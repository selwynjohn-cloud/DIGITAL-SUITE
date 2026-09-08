import { clearPending, waListGroups, waSendText, whatsappConfigured } from './whatsapp.js'
import { redisCommand } from './store.js'

export type PublishResult = {
  ok: boolean
  channelSent: boolean
  groupsSent: number
  error?: string
}

const LOG_KEY = 'pulse:publish:log:v1'
const MAX_LOG = 60

export type PublishLogEntry = {
  edition: string
  date: string
  slot: string
  ts: number
  ok: boolean
  channelSent: boolean
  groupsSent: number
  auto: boolean
  reason?: string
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Default ON — set PULSE_AUTO_PUBLISH=false to require manual tap again. */
export function autoPublishEnabled(): boolean {
  const v = process.env.PULSE_AUTO_PUBLISH?.trim().toLowerCase()
  if (v === 'false' || v === '0' || v === 'no') return false
  return true
}

function todayIst(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

/** Calendar day of a send in IST. Prefer the timestamp — a fake Date plus Kolkata offset used to mark 10:00 PM as the next day. */
export function publishLogIstDate(entry: Pick<PublishLogEntry, 'date' | 'ts'>): string {
  if (entry.ts > 0) {
    return new Date(entry.ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  }
  return entry.date
}

function slotKey(edition: string): string {
  return edition.replace(/\s+/g, '-').toLowerCase()
}

export async function readPublishLog(): Promise<PublishLogEntry[]> {
  const d = await redisCommand(['GET', LOG_KEY])
  if (!d?.result || typeof d.result !== 'string') return []
  try {
    return JSON.parse(d.result) as PublishLogEntry[]
  } catch {
    return []
  }
}

export async function wasPublishedOn(edition: string, ymd = todayIst()): Promise<boolean> {
  const slot = slotKey(edition)
  const log = await readPublishLog()
  return log.some((e) => publishLogIstDate(e) === ymd && e.slot === slot && e.ok)
}

export async function wasPublishedToday(edition: string): Promise<boolean> {
  return wasPublishedOn(edition)
}

export async function getTodayPublishEntry(edition: string): Promise<PublishLogEntry | null> {
  const date = todayIst()
  const slot = slotKey(edition)
  const log = await readPublishLog()
  return log.find((e) => publishLogIstDate(e) === date && e.slot === slot && e.ok) ?? null
}

export async function recordPublishLog(entry: PublishLogEntry): Promise<void> {
  const log = await readPublishLog()
  log.unshift(entry)
  await redisCommand(['SET', LOG_KEY, JSON.stringify(log.slice(0, MAX_LOG))])
}

function lockKey(edition: string, ymd = todayIst()): string {
  return `pulse:publish:lock:${ymd}:${slotKey(edition)}`
}

/** Prevent pulse cron + health-cron from sending the same edition twice. Redis down → allow send. */
export async function acquirePublishLock(edition: string, ymd = todayIst()): Promise<boolean> {
  const r = await redisCommand(['SET', lockKey(edition, ymd), String(Date.now()), 'NX', 'EX', '280'])
  if (!r) return true
  return String(r.result ?? '') === 'OK'
}

export async function releasePublishLock(edition: string, ymd = todayIst()): Promise<void> {
  await redisCommand(['DEL', lockKey(edition, ymd)])
}

function envGroupIds(): string[] {
  return (process.env.WHAPI_GROUP_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function groupIdsFromWhapi(data: unknown): string[] {
  if (!data || typeof data !== 'object') return []
  const o = data as Record<string, unknown>
  const raw = Array.isArray(o.groups) ? o.groups : Array.isArray(o.data) ? o.data : []
  const out: string[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const g = row as Record<string, unknown>
    const id = String(g.id || g.group_id || g.groupId || '').trim()
    if (id.includes('@g.us')) out.push(id)
  }
  return [...new Set(out)]
}

async function liveGroupIds(): Promise<string[]> {
  const listed = await waListGroups()
  return groupIdsFromWhapi(listed?.data)
}

async function sendToGroups(groups: string[], msg2: string): Promise<number> {
  let groupsSent = 0
  const BATCH = 4
  for (let i = 0; i < groups.length; i += BATCH) {
    const chunk = groups.slice(i, i + BATCH)
    const results = await Promise.all(chunk.map((g) => waSendText(g, msg2)))
    groupsSent += results.filter((r) => r?.ok).length
    if (i + BATCH < groups.length) await sleep(400)
  }
  return groupsSent
}

/** Post 2 only — used to recover groups after a Channel-only send. */
export async function publishGroupMessages(msg2: string): Promise<{
  groupsSent: number
  tried: number
  usedLiveList: boolean
  error?: string
}> {
  if (!whatsappConfigured()) {
    return { groupsSent: 0, tried: 0, usedLiveList: false, error: 'WhatsApp gateway not configured (WHAPI_TOKEN)' }
  }
  const saved = envGroupIds()
  const live = await liveGroupIds()
  const groups = [...new Set([...saved, ...live])]
  const groupsSent = await sendToGroups(groups, msg2)
  return {
    groupsSent,
    tried: groups.length,
    usedLiveList: live.length > 0,
    error: groupsSent === 0 ? 'No WhatsApp group accepted the bulletin' : undefined,
  }
}

/** Post 1 → Channel, Post 2 → all groups (small parallel batches so the clock job finishes). */
export async function publishEditionMessages(msg1: string, msg2: string): Promise<PublishResult> {
  if (!whatsappConfigured()) {
    return { ok: false, channelSent: false, groupsSent: 0, error: 'WhatsApp gateway not configured (WHAPI_TOKEN)' }
  }

  const channel = process.env.WHAPI_CHANNEL_ID?.trim()
  const groups = [...new Set([...envGroupIds(), ...(await liveGroupIds())])]

  let channelSent = false
  if (channel) {
    const r = await waSendText(channel, msg1)
    channelSent = Boolean(r?.ok)
    await sleep(400)
  }

  const groupsSent = await sendToGroups(groups, msg2)

  await clearPending()

  if (!channel && groups.length === 0 && groupsSent === 0) {
    return { ok: false, channelSent: false, groupsSent: 0, error: 'No channel or group IDs configured' }
  }

  return { ok: channelSent || groupsSent > 0, channelSent, groupsSent }
}

export async function notifyDirectorPublished(
  edition: string,
  result: PublishResult,
  auto: boolean,
): Promise<void> {
  const admin = process.env.ADMIN_WHATSAPP?.trim()
  if (!admin || !whatsappConfigured()) return
  const detail = result.ok
    ? `✅ *${edition} SENT*\n\nPost 1 → WhatsApp Channel${result.channelSent ? ' ✓' : ''}\nPost 2 → ${result.groupsSent} group(s) ✓\n\nBulletin: tinyurl.com/Security-News`
    : `⚠️ *${edition} NOT SENT*\n\n${result.error ?? 'WhatsApp gateway problem. System will retry.'}`
  await waSendText(admin, detail)
}

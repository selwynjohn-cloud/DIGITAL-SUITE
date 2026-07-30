import { clearPending, waSendText, whatsappConfigured } from './whatsapp.js'
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

export async function wasPublishedToday(edition: string): Promise<boolean> {
  const date = todayIst()
  const slot = slotKey(edition)
  const log = await readPublishLog()
  return log.some((e) => e.date === date && e.slot === slot && e.ok)
}

export async function getTodayPublishEntry(edition: string): Promise<PublishLogEntry | null> {
  const date = todayIst()
  const slot = slotKey(edition)
  const log = await readPublishLog()
  return log.find((e) => e.date === date && e.slot === slot && e.ok) ?? null
}

export async function recordPublishLog(entry: PublishLogEntry): Promise<void> {
  const log = await readPublishLog()
  log.unshift(entry)
  await redisCommand(['SET', LOG_KEY, JSON.stringify(log.slice(0, MAX_LOG))])
}

/** Post 1 → Channel, Post 2 → all groups. */
export async function publishEditionMessages(msg1: string, msg2: string): Promise<PublishResult> {
  if (!whatsappConfigured()) {
    return { ok: false, channelSent: false, groupsSent: 0, error: 'WhatsApp gateway not configured (WHAPI_TOKEN)' }
  }

  const channel = process.env.WHAPI_CHANNEL_ID?.trim()
  const groups = (process.env.WHAPI_GROUP_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  let channelSent = false
  if (channel) {
    const r = await waSendText(channel, msg1)
    channelSent = Boolean(r?.ok)
    await sleep(1200)
  }

  let groupsSent = 0
  for (const g of groups) {
    const r = await waSendText(g, msg2)
    if (r?.ok) groupsSent++
    await sleep(1200)
  }

  await clearPending()

  if (!channel && groups.length === 0) {
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

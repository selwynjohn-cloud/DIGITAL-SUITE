import { randomBytes } from 'node:crypto'
import { redisCommand } from '../pulse/store.js'
import { opsNid } from '../ops-mobile/store.js'
import type {
  LiveBlockedAttempt,
  LiveChatMessage,
  LiveExtraMobile,
  LiveGuardSession,
  LiveMute,
  LiveReminder,
  LiveSiteNote,
  LiveSoftSkill,
  LiveStatusKind,
  LiveStatusRow,
  LiveUnitWeekOff,
  LiveVacantAllot,
} from './types.js'
import { liveUnitWoKey } from './weekly-roster.js'

const CHAT_PREFIX = 'live:chat:'
const EXTRA_MOBILE_KEY = 'live:extra-mobiles:v1'
const MUTE_KEY = 'live:mutes:v1'
const STATUS_KEY = 'live:status:v1'
const BLOCKED_KEY = 'live:blocked:v1'
const RATE_PREFIX = 'live:rate:'
const SESS_PREFIX = 'live:gsess:'
const UNIT_WO_KEY = 'live:unit-week-off:v1'
const REMIND_KEY = 'live:reminders:v1'
const VACANT_KEY = 'live:vacant-allot:v1'
const SITE_NOTE_KEY = 'live:site-notes:v1'
const SOFT_KEY = 'live:soft-skills:v1'
const ID_CARD_KEY = 'live:id-cards:v1'

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const d = await redisCommand(['GET', key])
  if (!d?.result || typeof d.result !== 'string') return fallback
  try {
    return JSON.parse(d.result) as T
  } catch {
    return fallback
  }
}

async function setJson(key: string, value: unknown): Promise<boolean> {
  const r = await redisCommand(['SET', key, JSON.stringify(value)])
  return r?.result === 'OK' || r?.result === true
}

export async function issueLiveGuardToken(row: Omit<LiveGuardSession, 'token'>): Promise<string> {
  const token = randomBytes(24).toString('hex')
  const body: LiveGuardSession = { ...row, token }
  await redisCommand(['SET', `${SESS_PREFIX}${token}`, JSON.stringify(body), 'EX', '43200'])
  return token
}

export async function readLiveGuardToken(token: string): Promise<LiveGuardSession | null> {
  const t = String(token || '').trim()
  if (t.length < 20) return null
  const d = await redisCommand(['GET', `${SESS_PREFIX}${t}`])
  if (!d?.result || typeof d.result !== 'string') return null
  try {
    const row = JSON.parse(d.result) as LiveGuardSession
    return row?.guardId ? row : null
  } catch {
    return null
  }
}

function last10(raw: string): string {
  return String(raw || '').replace(/\D/g, '').slice(-10)
}

/** Guard phone: group messages + DMs to this mobile. Staff see the full room. */
export function filterLiveChatForGuard(rows: LiveChatMessage[], mobile: string): LiveChatMessage[] {
  const mob = last10(mobile)
  if (mob.length !== 10) return rows.filter((m) => !m.toMobile)
  return rows.filter((m) => {
    const to = last10(m.toMobile || '')
    return !to || to === mob
  })
}

export async function listLiveExtraMobiles(): Promise<LiveExtraMobile[]> {
  const list = await getJson<LiveExtraMobile[]>(EXTRA_MOBILE_KEY, [])
  return Array.isArray(list) ? list : []
}

export async function findLiveExtraMobile(mobile: string): Promise<LiveExtraMobile | null> {
  const mob = last10(mobile)
  if (mob.length !== 10) return null
  const list = await listLiveExtraMobiles()
  return list.find((r) => last10(r.mobile) === mob) || null
}

export async function upsertLiveExtraMobile(opts: {
  mobile: string
  name: string
  addedBy: string
}): Promise<LiveExtraMobile | { error: string }> {
  const mobile = last10(opts.mobile)
  const name = String(opts.name || '').replace(/\s+/g, ' ').trim().slice(0, 80)
  if (mobile.length !== 10) return { error: 'Enter a 10-digit mobile.' }
  if (!name) return { error: 'Type a name for this mobile (example: Director).' }
  const row: LiveExtraMobile = {
    mobile,
    name,
    addedBy: String(opts.addedBy || '').trim(),
    at: new Date().toISOString(),
  }
  const list = (await listLiveExtraMobiles()).filter((r) => last10(r.mobile) !== mobile)
  list.unshift(row)
  await setJson(EXTRA_MOBILE_KEY, list.slice(0, 400))
  return row
}

export async function listLiveChat(roomKey: string, afterId = '', limit = 80): Promise<LiveChatMessage[]> {
  const list = await getJson<LiveChatMessage[]>(`${CHAT_PREFIX}${roomKey}`, [])
  const rows = Array.isArray(list) ? list : []
  if (!afterId) return rows.slice(-limit)
  const idx = rows.findIndex((m) => m.id === afterId)
  return idx >= 0 ? rows.slice(idx + 1).slice(-limit) : rows.slice(-limit)
}

export async function appendLiveChat(row: Omit<LiveChatMessage, 'id' | 'at'> & { id?: string; at?: string }) {
  const key = `${CHAT_PREFIX}${row.roomKey}`
  const list = await getJson<LiveChatMessage[]>(key, [])
  const msg: LiveChatMessage = {
    id: row.id || opsNid('lm'),
    at: row.at || new Date().toISOString(),
    roomKey: row.roomKey,
    fromRole: row.fromRole,
    fromKind: row.fromKind,
    fromName: row.fromName,
    fromId: row.fromId,
    text: row.text,
    fileKind: row.fileKind,
    fileUrl: row.fileUrl,
    fileName: row.fileName,
    fileMime: row.fileMime,
    toMobile: row.toMobile,
    toName: row.toName,
  }
  list.push(msg)
  await setJson(key, list.slice(-400))
  return msg
}

export async function deleteLiveChat(roomKey: string, messageId: string): Promise<boolean> {
  const key = `${CHAT_PREFIX}${roomKey}`
  const list = await getJson<LiveChatMessage[]>(key, [])
  const next = list.filter((m) => m.id !== messageId)
  if (next.length === list.length) return false
  return setJson(key, next)
}

export async function listLiveMutes(): Promise<LiveMute[]> {
  const now = Date.now()
  const list = (await getJson<LiveMute[]>(MUTE_KEY, [])).filter((m) => new Date(m.until).getTime() > now)
  return list
}

export async function isLiveMuted(key: string): Promise<LiveMute | null> {
  const k = String(key || '').trim().toLowerCase()
  if (!k) return null
  const list = await listLiveMutes()
  return list.find((m) => m.key === k) || null
}

export async function muteLiveSender(opts: {
  key: string
  name: string
  by: string
  hours?: number
  reason?: string
}): Promise<LiveMute> {
  const hours = opts.hours && opts.hours > 0 ? opts.hours : 24
  const row: LiveMute = {
    id: opsNid('mu'),
    key: String(opts.key || '').trim().toLowerCase(),
    name: String(opts.name || '').trim(),
    until: new Date(Date.now() + hours * 3600_000).toISOString(),
    by: opts.by,
    reason: String(opts.reason || 'Company chat rule').slice(0, 160),
  }
  const list = (await listLiveMutes()).filter((m) => m.key !== row.key)
  list.unshift(row)
  await setJson(MUTE_KEY, list.slice(0, 400))
  return row
}

export async function unmuteLiveSender(key: string): Promise<boolean> {
  const k = String(key || '').trim().toLowerCase()
  const list = await listLiveMutes()
  const next = list.filter((m) => m.key !== k)
  return setJson(MUTE_KEY, next)
}

export async function addLiveStatus(row: Omit<LiveStatusRow, 'id' | 'at'> & { id?: string; at?: string }) {
  const list = await getJson<LiveStatusRow[]>(STATUS_KEY, [])
  const rec: LiveStatusRow = {
    id: row.id || opsNid('st'),
    at: row.at || new Date().toISOString(),
    date: row.date,
    kind: row.kind,
    guardId: row.guardId,
    idNo: row.idNo,
    name: row.name,
    mobile: row.mobile,
    branch: row.branch,
    clientSite: row.clientSite,
    remark: String(row.remark || '').slice(0, 200),
  }
  list.unshift(rec)
  await setJson(STATUS_KEY, list.slice(0, 3000))
  return rec
}

export async function listLiveStatus(date: string, kinds?: LiveStatusKind[]): Promise<LiveStatusRow[]> {
  const list = await getJson<LiveStatusRow[]>(STATUS_KEY, [])
  return list.filter((r) => r.date === date && (!kinds || kinds.includes(r.kind)))
}

export async function listLiveStatusBetween(fromYmd: string, toYmd: string): Promise<LiveStatusRow[]> {
  const from = String(fromYmd || '').trim()
  const to = String(toYmd || '').trim()
  const list = await getJson<LiveStatusRow[]>(STATUS_KEY, [])
  return list.filter((r) => r.date >= from && r.date <= to)
}

export async function addBlockedAttempt(row: Omit<LiveBlockedAttempt, 'id' | 'at'> & { id?: string; at?: string }) {
  const list = await getJson<LiveBlockedAttempt[]>(BLOCKED_KEY, [])
  const rec: LiveBlockedAttempt = {
    id: row.id || opsNid('bk'),
    at: row.at || new Date().toISOString(),
    date: row.date,
    roomKey: row.roomKey,
    fromName: row.fromName,
    fromId: row.fromId,
    hit: row.hit,
    snippet: String(row.snippet || '').slice(0, 80),
  }
  list.unshift(rec)
  await setJson(BLOCKED_KEY, list.slice(0, 800))
  return rec
}

export async function listBlockedAttempts(date: string): Promise<LiveBlockedAttempt[]> {
  const list = await getJson<LiveBlockedAttempt[]>(BLOCKED_KEY, [])
  return list.filter((r) => r.date === date)
}

/** True if sender is within the per-minute cap. */
export async function liveChatRateOk(fromId: string, max = 8): Promise<boolean> {
  const id = String(fromId || '').trim().toLowerCase()
  if (!id) return false
  const key = `${RATE_PREFIX}${id}`
  const n = await redisCommand(['INCR', key])
  const count = Number(n?.result || 0)
  if (count === 1) await redisCommand(['EXPIRE', key, '60'])
  return count <= max
}

export async function listLiveUnitWeekOffs(): Promise<LiveUnitWeekOff[]> {
  const list = await getJson<LiveUnitWeekOff[]>(UNIT_WO_KEY, [])
  return Array.isArray(list) ? list : []
}

export async function mapLiveUnitWeekOffs(): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  for (const row of await listLiveUnitWeekOffs()) {
    if (row?.key) map.set(row.key, Number(row.weekday) || 0)
  }
  return map
}

export function offWeekdayFromMap(
  map: Map<string, number>,
  branch: string,
  clientSite: string,
): number {
  const hit = map.get(liveUnitWoKey(branch, clientSite))
  return Number.isInteger(hit) ? Number(hit) : 0
}

export async function saveLiveUnitWeekOff(opts: {
  branch: string
  clientSite: string
  weekday: number
  setBy: string
}): Promise<LiveUnitWeekOff | { error: string }> {
  const clientSite = String(opts.clientSite || '').replace(/\s+/g, ' ').trim()
  if (!clientSite) return { error: 'Pick a unit (site).' }
  const weekday = Number(opts.weekday)
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    return { error: 'Pick the weekly off day for this unit.' }
  }
  const row: LiveUnitWeekOff = {
    key: liveUnitWoKey(opts.branch, clientSite),
    branch: String(opts.branch || '').trim(),
    clientSite,
    weekday,
    setBy: String(opts.setBy || '').trim(),
    at: new Date().toISOString(),
  }
  const list = (await listLiveUnitWeekOffs()).filter((r) => r.key !== row.key)
  list.unshift(row)
  await setJson(UNIT_WO_KEY, list.slice(0, 2000))
  return row
}

export async function listLiveReminders(): Promise<LiveReminder[]> {
  const list = await getJson<LiveReminder[]>(REMIND_KEY, [])
  return Array.isArray(list) ? list : []
}

export async function addLiveReminder(row: Omit<LiveReminder, 'id' | 'at' | 'reply' | 'repliedAt'> & { id?: string }): Promise<LiveReminder> {
  const rec: LiveReminder = {
    id: row.id || opsNid('rm'),
    at: new Date().toISOString(),
    date: row.date,
    kind: row.kind,
    guardId: row.guardId,
    idNo: row.idNo,
    name: row.name,
    mobile: row.mobile,
    branch: row.branch,
    clientSite: row.clientSite,
    text: String(row.text || '').slice(0, 240),
    reply: '',
    repliedAt: '',
    showWageSlip: Boolean(row.showWageSlip),
    by: row.by,
  }
  const list = await listLiveReminders()
  list.unshift(rec)
  await setJson(REMIND_KEY, list.slice(0, 4000))
  return rec
}

export async function replyLiveReminder(id: string, reply: string, mobile: string): Promise<LiveReminder | { error: string }> {
  const list = await listLiveReminders()
  const rec = list.find((r) => r.id === id)
  if (!rec) return { error: 'Reminder not found.' }
  if (String(rec.mobile).replace(/\D/g, '').slice(-10) !== String(mobile).replace(/\D/g, '').slice(-10)) {
    return { error: 'This reminder is not for you.' }
  }
  rec.reply = reply
  rec.repliedAt = new Date().toISOString()
  await setJson(REMIND_KEY, list.slice(0, 4000))
  return rec
}

export async function listLiveVacantAllots(): Promise<LiveVacantAllot[]> {
  const list = await getJson<LiveVacantAllot[]>(VACANT_KEY, [])
  return Array.isArray(list) ? list : []
}

export async function saveLiveVacantAllot(row: Omit<LiveVacantAllot, 'id' | 'at'>): Promise<LiveVacantAllot> {
  const rec: LiveVacantAllot = { ...row, id: opsNid('vp'), at: new Date().toISOString() }
  const list = (await listLiveVacantAllots()).filter(
    (r) => !(r.date === rec.date && r.mobile === rec.mobile && r.clientSite === rec.clientSite),
  )
  list.unshift(rec)
  await setJson(VACANT_KEY, list.slice(0, 2000))
  return rec
}

export async function listLiveSiteNotes(): Promise<LiveSiteNote[]> {
  const list = await getJson<LiveSiteNote[]>(SITE_NOTE_KEY, [])
  return Array.isArray(list) ? list : []
}

export async function findLiveSiteNote(branch: string, clientSite: string): Promise<LiveSiteNote | null> {
  const key = liveUnitWoKey(branch, clientSite)
  return (await listLiveSiteNotes()).find((r) => r.key === key) || null
}

export async function saveLiveSiteNote(opts: {
  branch: string
  clientSite: string
  text: string
  by: string
}): Promise<LiveSiteNote | { error: string }> {
  const clientSite = String(opts.clientSite || '').replace(/\s+/g, ' ').trim()
  if (!clientSite) return { error: 'Pick a unit (site).' }
  const text = String(opts.text || '').replace(/\s+/g, ' ').trim().slice(0, 800)
  if (!text) return { error: 'Type the site instruction.' }
  const row: LiveSiteNote = {
    key: liveUnitWoKey(opts.branch, clientSite),
    branch: String(opts.branch || '').trim(),
    clientSite,
    text,
    by: String(opts.by || '').trim(),
    at: new Date().toISOString(),
  }
  const list = (await listLiveSiteNotes()).filter((r) => r.key !== row.key)
  list.unshift(row)
  await setJson(SITE_NOTE_KEY, list.slice(0, 2000))
  return row
}

export async function listLiveSoftSkills(): Promise<LiveSoftSkill[]> {
  const list = await getJson<LiveSoftSkill[]>(SOFT_KEY, [])
  return Array.isArray(list) ? list : []
}

export async function saveLiveSoftSkill(opts: {
  title: string
  text: string
  by: string
}): Promise<LiveSoftSkill | { error: string }> {
  const title = String(opts.title || '').replace(/\s+/g, ' ').trim().slice(0, 80)
  const text = String(opts.text || '').replace(/\s+/g, ' ').trim().slice(0, 400)
  if (!title || !text) return { error: 'Type a short title and the soft-skill line.' }
  const row: LiveSoftSkill = {
    id: opsNid('sk'),
    title,
    text,
    by: String(opts.by || '').trim(),
    at: new Date().toISOString(),
  }
  const list = await listLiveSoftSkills()
  list.unshift(row)
  await setJson(SOFT_KEY, list.slice(0, 200))
  return row
}

function liveIdCardIso(raw: string): string {
  const s = String(raw || '').trim()
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  return iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : ''
}

export async function getLiveIdCard(guardId: string): Promise<string> {
  const id = String(guardId || '').trim()
  if (!id) return ''
  const map = await getJson<Record<string, string>>(ID_CARD_KEY, {})
  return liveIdCardIso(map && typeof map === 'object' ? map[id] || '' : '')
}

export async function saveLiveIdCard(guardId: string, ymd: string): Promise<string | { error: string }> {
  const id = String(guardId || '').trim()
  const iso = liveIdCardIso(ymd)
  if (!id) return { error: 'Could not save ID card validity.' }
  if (!iso) return { error: 'Pick the ID card validity date.' }
  const y = Number(iso.slice(0, 4))
  if (y < 2020 || y > 2045) return { error: 'Pick a valid ID card date.' }
  const map = await getJson<Record<string, string>>(ID_CARD_KEY, {})
  const next = map && typeof map === 'object' ? map : {}
  next[id] = iso
  await setJson(ID_CARD_KEY, next)
  return iso
}

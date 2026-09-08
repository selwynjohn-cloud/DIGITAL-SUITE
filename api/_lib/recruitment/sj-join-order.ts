/**
 * Provisional joining letter — WhatsApp to the candidate after Tentative date.
 * Send + replies use Whapi only (same Command Centre line). Never Fast2SMS.
 */

import { misTodayIst } from '../mis/dates.js'
import { resolveRecruitmentCentre } from '../securityjob/recruitment-centres.js'
import { waSendButtons, waSendText, whatsappChatId, whatsappConfigured } from '../pulse/whatsapp.js'
import { rememberSjFollowupDates, ymdFollowup } from './sj-followup-dates.js'
import { loadAllRegisteredCandidates } from './registration-store.js'

export type SjJoinOrderStatus = 'sent' | 'will_come' | 'await_new_date' | 'not_now'

export type SjJoinOrder = {
  phone: string
  id: string
  name: string
  regCode: string
  tentativeJoinDate: string
  status: SjJoinOrderStatus
  sentAt: string
  repliedAt?: string
  lastReply?: string
}

const PREFIX = 'recruit:sj-join-order:'
const INDEX = 'recruit:sj-join-order-phones'
const SEEN = 'recruit:sj-join-order-seen:'

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

async function redis(command: unknown[]): Promise<{ result?: unknown } | null> {
  const cfg = redisConfig()
  if (!cfg) return null
  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    })
    if (!res.ok) return null
    return (await res.json()) as { result?: unknown }
  } catch {
    return null
  }
}

export function sjJoinOrderPhone(raw: string): string {
  return String(raw || '').replace(/\D/g, '').slice(-10)
}

function storeKey(phone: string) {
  return `${PREFIX}${sjJoinOrderPhone(phone)}`
}

function displayDmy(ymd: string): string {
  const iso = ymdFollowup(ymd)
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function addDaysIst(ymd: string, days: number): string {
  const iso = ymdFollowup(ymd) || misTodayIst()
  const d = new Date(`${iso}T12:00:00+05:30`)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

export function buildSjJoinOrderText(opts: {
  name: string
  regCode: string
  tentativeJoinDate: string
  centreCity: string
  mapsUrl: string
  helpDesk: string
}): string {
  const name = String(opts.name || 'Candidate').trim() || 'Candidate'
  const when = displayDmy(opts.tentativeJoinDate) || 'the date we agreed'
  return [
    `Namaste ${name},`,
    'Agile Security Force — Provisional Recruitment Order.',
    `You registered on Security Job (${opts.regCode || '—'}).`,
    '',
    `Please come and join on ${when}.`,
    `Centre: ${opts.centreCity}`,
    `Map: ${opts.mapsUrl}`,
    '',
    'Please bring: Aadhaar, 2 photos, bank passbook / account details.',
    `Help Desk: ${opts.helpDesk}`,
    '',
    'Tap one button, or reply 1 / 2 / 3.',
  ].join('\n')
}

export const SJ_JOIN_ORDER_BUTTONS = [
  { id: 'sj_come', title: 'Yes I will come' },
  { id: 'sj_newdate', title: 'New date' },
  { id: 'sj_hold', title: 'Not now' },
] as const

export async function loadSjJoinOrder(phone: string): Promise<SjJoinOrder | null> {
  const mob = sjJoinOrderPhone(phone)
  if (mob.length < 10) return null
  const d = await redis(['GET', storeKey(mob)])
  if (typeof d?.result !== 'string') return null
  try {
    return JSON.parse(d.result) as SjJoinOrder
  } catch {
    return null
  }
}

export async function loadSjJoinOrderMap(phones: string[]): Promise<Record<string, SjJoinOrder>> {
  const mobs = [...new Set(phones.map(sjJoinOrderPhone).filter((p) => p.length >= 10))]
  const out: Record<string, SjJoinOrder> = {}
  if (!mobs.length) return out
  for (let i = 0; i < mobs.length; i += 80) {
    const chunk = mobs.slice(i, i + 80)
    const d = await redis(['MGET', ...chunk.map(storeKey)])
    const arr = Array.isArray(d?.result) ? d.result : []
    for (let n = 0; n < chunk.length; n++) {
      const raw = arr[n]
      if (typeof raw !== 'string') continue
      try {
        out[chunk[n]] = JSON.parse(raw) as SjJoinOrder
      } catch {
        /* skip */
      }
    }
  }
  return out
}

async function saveSjJoinOrder(row: SjJoinOrder): Promise<void> {
  const mob = sjJoinOrderPhone(row.phone)
  if (mob.length < 10) return
  await redis(['SET', storeKey(mob), JSON.stringify({ ...row, phone: mob })])
  await redis(['SADD', INDEX, mob])
}

function parseReplyDate(text: string): string {
  const raw = String(text || '').trim()
  const dmy = raw.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (dmy) return ymdFollowup(`${dmy[1]}/${dmy[2]}/${dmy[3]}`)
  const ymd = raw.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (ymd) return ymdFollowup(ymd[0])
  return ymdFollowup(raw)
}

function classifyReply(text: string, buttonId: string): 'come' | 'newdate' | 'hold' | 'date' | '' {
  const id = String(buttonId || '').trim().toLowerCase()
  if (id === 'sj_come') return 'come'
  if (id === 'sj_newdate') return 'newdate'
  if (id === 'sj_hold') return 'hold'
  const t = String(text || '')
    .trim()
    .toLowerCase()
  if (!t) return ''
  if (parseReplyDate(t)) return 'date'
  if (/^(1|yes)\b/.test(t) || /will come|i will come|coming/.test(t)) return 'come'
  if (/^(2)\b/.test(t) || /new date|another date|change date/.test(t)) return 'newdate'
  if (/^(3)\b/.test(t) || /not now|cannot|can'?t join|later/.test(t)) return 'hold'
  return ''
}

async function findCandidate(phone: string, id?: string) {
  const mob = sjJoinOrderPhone(phone)
  const all = await loadAllRegisteredCandidates()
  if (id) {
    const hit = all.find((r) => r.id === id && r.active !== false)
    if (hit) return hit
  }
  return all.find((r) => sjJoinOrderPhone(r.phone) === mob && r.active !== false) || null
}

export async function sendSjProvisionalJoinOrder(opts: {
  phone: string
  id?: string
  name?: string
  regCode?: string
  tentativeJoinDate: string
  location?: string
}): Promise<{ ok: boolean; sent?: boolean; error?: string; status?: SjJoinOrderStatus }> {
  const mob = sjJoinOrderPhone(opts.phone)
  const doj = ymdFollowup(opts.tentativeJoinDate)
  if (mob.length < 10) return { ok: false, error: 'Mobile number missing.' }
  if (!doj) return { ok: false, error: 'Tentative date missing.' }
  if (!whatsappConfigured()) return { ok: false, error: 'WhatsApp line is not connected.' }

  const found = await findCandidate(mob, opts.id)
  const name = String(opts.name || found?.name || 'Candidate').trim() || 'Candidate'
  const regCode = String(opts.regCode || found?.regCode || '').trim()
  const centre = resolveRecruitmentCentre(opts.location || found?.location || found?.branchId || '')
  const text = buildSjJoinOrderText({
    name,
    regCode,
    tentativeJoinDate: doj,
    centreCity: centre.city,
    mapsUrl: centre.mapsUrl,
    helpDesk: centre.helpDesk,
  })
  const to = whatsappChatId(mob)
  const sent = await waSendButtons(to, text, [...SJ_JOIN_ORDER_BUTTONS])
  if (!sent?.ok) return { ok: false, error: 'WhatsApp joining letter did not go out.' }

  const row: SjJoinOrder = {
    phone: mob,
    id: String(opts.id || found?.id || ''),
    name,
    regCode,
    tentativeJoinDate: doj,
    status: 'sent',
    sentAt: new Date().toISOString(),
  }
  await saveSjJoinOrder(row)
  return { ok: true, sent: true, status: 'sent' }
}

async function alreadySeen(messageId: string): Promise<boolean> {
  const id = String(messageId || '').trim()
  if (!id) return false
  const prev = await redis(['SET', `${SEEN}${id}`, '1', 'EX', 86400, 'NX'])
  return Boolean(prev) && prev.result !== 'OK'
}

export async function handleSjJoinOrderReply(opts: {
  from: string
  text?: string
  buttonId?: string
  messageId?: string
}): Promise<boolean> {
  const mob = sjJoinOrderPhone(opts.from)
  if (mob.length < 10) return false

  const pending = await loadSjJoinOrder(mob)
  if (!pending) return false
  if (await alreadySeen(String(opts.messageId || ''))) return true

  const kind = classifyReply(String(opts.text || ''), String(opts.buttonId || ''))
  if (!kind) return false

  const to = whatsappChatId(mob)
  const when = displayDmy(pending.tentativeJoinDate)
  const now = new Date().toISOString()

  if (kind === 'come') {
    await saveSjJoinOrder({
      ...pending,
      status: 'will_come',
      repliedAt: now,
      lastReply: 'will_come',
    })
    await waSendText(
      to,
      `Thank you. Please come and join on ${when || 'the agreed date'}. Bring Aadhaar, 2 photos and bank details.`,
    )
    return true
  }

  if (kind === 'date') {
    const next = parseReplyDate(String(opts.text || ''))
    if (!next) {
      await saveSjJoinOrder({ ...pending, status: 'await_new_date', repliedAt: now, lastReply: 'newdate' })
      await waSendText(to, 'Please send the new date as dd/mm/yyyy (example 15/09/2026).')
      return true
    }
    await rememberSjFollowupDates(
      { phone: mob, id: pending.id, regCode: pending.regCode },
      { tentativeJoinDate: next },
    )
    const sent = await sendSjProvisionalJoinOrder({
      phone: mob,
      id: pending.id,
      name: pending.name,
      regCode: pending.regCode,
      tentativeJoinDate: next,
    })
    if (!sent.ok) {
      await saveSjJoinOrder({
        ...pending,
        tentativeJoinDate: next,
        status: 'await_new_date',
        repliedAt: now,
        lastReply: next,
      })
      await waSendText(to, `New date ${displayDmy(next)} is saved. We will send the joining letter again.`)
    }
    return true
  }

  if (kind === 'newdate') {
    await saveSjJoinOrder({
      ...pending,
      status: 'await_new_date',
      repliedAt: now,
      lastReply: 'newdate',
    })
    await waSendText(to, 'Please send the new date as dd/mm/yyyy (example 15/09/2026).')
    return true
  }

  if (kind === 'hold') {
    const holdOn = addDaysIst(misTodayIst(), 7)
    await rememberSjFollowupDates(
      { phone: mob, id: pending.id, regCode: pending.regCode },
      { holdRemindOn: holdOn },
    )
    await saveSjJoinOrder({
      ...pending,
      status: 'not_now',
      repliedAt: now,
      lastReply: 'not_now',
    })
    await waSendText(to, 'Thank you. We will call you again later.')
    return true
  }

  return false
}

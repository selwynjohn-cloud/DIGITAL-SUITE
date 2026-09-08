/**
 * Thank-you WhatsApp after SecurityJob registration — ask tentative joining date.
 * Whapi interactive buttons only. Never Fast2SMS.
 */

import { misTodayIst } from '../mis/dates.js'
import { resolveRecruitmentCentre } from '../securityjob/recruitment-centres.js'
import { waSendButtons, waSendText, whatsappChatId, whatsappConfigured } from '../pulse/whatsapp.js'
import { rememberSjFollowupDates, ymdFollowup } from './sj-followup-dates.js'
import { sendSjProvisionalJoinOrder } from './sj-join-order.js'
import { resolveSjAiCallFromWhatsApp } from './sj-ai-call.js'

export type SjAskDateStatus = 'asked' | 'got_date' | 'await_date' | 'not_now'

export type SjAskDate = {
  phone: string
  id: string
  name: string
  regCode: string
  location: string
  status: SjAskDateStatus
  sentAt: string
  tentativeJoinDate?: string
  repliedAt?: string
  lastReply?: string
}

const PREFIX = 'recruit:sj-ask-date:'
const INDEX = 'recruit:sj-ask-date-phones'
const SEEN = 'recruit:sj-ask-date-seen:'

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

export function sjAskDatePhone(raw: string): string {
  return String(raw || '').replace(/\D/g, '').slice(-10)
}

function storeKey(phone: string) {
  return `${PREFIX}${sjAskDatePhone(phone)}`
}

function addDaysYmd(ymd: string, days: number): string {
  const iso = ymdFollowup(ymd) || misTodayIst()
  const d = new Date(`${iso}T12:00:00+05:30`)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function skipSunday(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00+05:30`)
  if (d.getDay() === 0) return addDaysYmd(ymd, 1)
  return ymd
}

function displayDmy(ymd: string): string {
  const iso = ymdFollowup(ymd)
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function parseReplyDate(text: string): string {
  const raw = String(text || '').trim()
  const dmy = raw.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (dmy) return ymdFollowup(`${dmy[1]}/${dmy[2]}/${dmy[3]}`)
  const ymd = raw.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (ymd) return ymdFollowup(ymd[0])
  return ymdFollowup(raw)
}

export function buildSjRegThankYouAskText(opts: {
  name: string
  regCode: string
  centreCity: string
  mapsUrl: string
}): string {
  const name = String(opts.name || 'Candidate').trim() || 'Candidate'
  return [
    `Namaste ${name},`,
    'Thank you for registering on Security Job.',
    `Your code: ${opts.regCode || '—'}`,
    'Agile Security Force.',
    '',
    `When can you come to our Recruitment Centre (${opts.centreCity})?`,
    `Map: ${opts.mapsUrl}`,
    '',
    'Tap one button, or reply the date as dd/mm/yyyy (example 15/09/2026).',
  ].join('\n')
}

export const SJ_ASK_DATE_BUTTONS = [
  { id: 'sj_ask_week', title: 'This week' },
  { id: 'sj_ask_next', title: 'Next week' },
  { id: 'sj_ask_hold', title: 'Not now' },
] as const

export async function loadSjAskDate(phone: string): Promise<SjAskDate | null> {
  const mob = sjAskDatePhone(phone)
  if (mob.length < 10) return null
  const d = await redis(['GET', storeKey(mob)])
  if (typeof d?.result !== 'string') return null
  try {
    return JSON.parse(d.result) as SjAskDate
  } catch {
    return null
  }
}

export async function loadSjAskDateMap(phones: string[]): Promise<Record<string, SjAskDate>> {
  const mobs = [...new Set(phones.map(sjAskDatePhone).filter((p) => p.length >= 10))]
  const out: Record<string, SjAskDate> = {}
  if (!mobs.length) return out
  for (let i = 0; i < mobs.length; i += 80) {
    const chunk = mobs.slice(i, i + 80)
    const d = await redis(['MGET', ...chunk.map(storeKey)])
    const arr = Array.isArray(d?.result) ? d.result : []
    for (let n = 0; n < chunk.length; n++) {
      const raw = arr[n]
      if (typeof raw !== 'string') continue
      try {
        out[chunk[n]] = JSON.parse(raw) as SjAskDate
      } catch {
        /* skip */
      }
    }
  }
  return out
}

async function saveAsk(row: SjAskDate): Promise<void> {
  const mob = sjAskDatePhone(row.phone)
  if (mob.length < 10) return
  await redis(['SET', storeKey(mob), JSON.stringify({ ...row, phone: mob })])
  await redis(['SADD', INDEX, mob])
}

export async function sendSjRegThankYouAskDate(opts: {
  phone: string
  id?: string
  name?: string
  regCode?: string
  location?: string
}): Promise<{ ok: boolean; sent?: boolean; error?: string }> {
  const mob = sjAskDatePhone(opts.phone)
  if (mob.length < 10) return { ok: false, error: 'Mobile number missing.' }
  if (!whatsappConfigured()) return { ok: false, error: 'WhatsApp line is not connected.' }

  const name = String(opts.name || 'Candidate').trim() || 'Candidate'
  const regCode = String(opts.regCode || '').trim()
  const location = String(opts.location || '')
  const centre = resolveRecruitmentCentre(location)
  const text = buildSjRegThankYouAskText({
    name,
    regCode,
    centreCity: centre.city,
    mapsUrl: centre.mapsUrl,
  })
  const sent = await waSendButtons(whatsappChatId(mob), text, [...SJ_ASK_DATE_BUTTONS])
  if (!sent?.ok) return { ok: false, error: 'WhatsApp thank-you did not go out.' }

  await saveAsk({
    phone: mob,
    id: String(opts.id || ''),
    name,
    regCode,
    location,
    status: 'asked',
    sentAt: new Date().toISOString(),
  })
  return { ok: true, sent: true }
}

function classifyAskReply(text: string, buttonId: string): 'week' | 'next' | 'hold' | 'date' | '' {
  const id = String(buttonId || '').trim().toLowerCase()
  if (id === 'sj_ask_week') return 'week'
  if (id === 'sj_ask_next') return 'next'
  if (id === 'sj_ask_hold') return 'hold'
  const t = String(text || '')
    .trim()
    .toLowerCase()
  if (!t) return ''
  if (parseReplyDate(t)) return 'date'
  if (/^(1)\b/.test(t) || /this week/.test(t)) return 'week'
  if (/^(2)\b/.test(t) || /next week/.test(t)) return 'next'
  if (/^(3)\b/.test(t) || /not now|cannot|can'?t join|later/.test(t)) return 'hold'
  return ''
}

async function alreadySeen(messageId: string): Promise<boolean> {
  const id = String(messageId || '').trim()
  if (!id) return false
  const prev = await redis(['SET', `${SEEN}${id}`, '1', 'EX', 86400, 'NX'])
  return Boolean(prev) && prev.result !== 'OK'
}

async function saveDateAndLetter(row: SjAskDate, ymd: string, lastReply: string): Promise<void> {
  const now = new Date().toISOString()
  await rememberSjFollowupDates(
    { phone: row.phone, id: row.id, regCode: row.regCode },
    { call1At: misTodayIst(), tentativeJoinDate: ymd },
  )
  await saveAsk({
    ...row,
    status: 'got_date',
    tentativeJoinDate: ymd,
    repliedAt: now,
    lastReply,
  })
  await resolveSjAiCallFromWhatsApp(row.phone, 'got_date', ymd)
  const letter = await sendSjProvisionalJoinOrder({
    phone: row.phone,
    id: row.id,
    name: row.name,
    regCode: row.regCode,
    tentativeJoinDate: ymd,
    location: row.location,
  })
  if (!letter.ok) {
    await waSendText(
      whatsappChatId(row.phone),
      `Thank you. We have noted ${displayDmy(ymd)}. Please come to the Recruitment Centre on that date.`,
    )
  }
}

export async function applySjRegAskChoice(opts: {
  phone: string
  id?: string
  name?: string
  regCode?: string
  location?: string
  choice: 'week' | 'next' | 'tomorrow' | 'hold' | 'date'
  dateText?: string
  notifyWhatsApp?: boolean
}): Promise<{ ok: boolean; error?: string; tentativeJoinDate?: string; hold?: boolean }> {
  const mob = sjAskDatePhone(opts.phone)
  if (mob.length < 10) return { ok: false, error: 'Mobile number missing.' }

  const prev = await loadSjAskDate(mob)
  const pending: SjAskDate = prev || {
    phone: mob,
    id: String(opts.id || ''),
    name: String(opts.name || 'Candidate').trim() || 'Candidate',
    regCode: String(opts.regCode || ''),
    location: String(opts.location || ''),
    status: 'asked',
    sentAt: new Date().toISOString(),
  }
  if (opts.id) pending.id = String(opts.id)
  if (opts.name) pending.name = String(opts.name).trim() || pending.name
  if (opts.regCode) pending.regCode = String(opts.regCode)
  if (opts.location) pending.location = String(opts.location)

  const now = new Date().toISOString()
  const notify = opts.notifyWhatsApp !== false

  if (opts.choice === 'hold') {
    const holdOn = addDaysYmd(misTodayIst(), 7)
    await rememberSjFollowupDates(
      { phone: mob, id: pending.id, regCode: pending.regCode },
      { holdRemindOn: holdOn },
    )
    await saveAsk({
      ...pending,
      status: 'not_now',
      repliedAt: now,
      lastReply: 'not_now',
    })
    await resolveSjAiCallFromWhatsApp(mob, 'not_now')
    if (notify) await waSendText(whatsappChatId(mob), 'Thank you. We will call you again later.')
    return { ok: true, hold: true }
  }

  let ymd = ''
  if (opts.choice === 'tomorrow') ymd = skipSunday(addDaysYmd(misTodayIst(), 1))
  else if (opts.choice === 'week') ymd = skipSunday(addDaysYmd(misTodayIst(), 2))
  else if (opts.choice === 'next') ymd = skipSunday(addDaysYmd(misTodayIst(), 7))
  else ymd = parseReplyDate(String(opts.dateText || ''))
  if (ymd && ymd < misTodayIst()) {
    return { ok: false, error: 'Please pick today or a coming date.' }
  }

  if (!ymd) {
    await saveAsk({
      ...pending,
      status: 'await_date',
      repliedAt: now,
      lastReply: 'await_date',
    })
    if (notify) {
      await waSendText(whatsappChatId(mob), 'Please send the date as dd/mm/yyyy (example 15/09/2026).')
    }
    return { ok: false, error: 'Please pick or send the date as dd/mm/yyyy.' }
  }

  await saveDateAndLetter(pending, ymd, opts.choice)
  return { ok: true, tentativeJoinDate: ymd }
}

export async function handleSjRegAskDateReply(opts: {
  from: string
  text?: string
  buttonId?: string
  messageId?: string
}): Promise<boolean> {
  const mob = sjAskDatePhone(opts.from)
  if (mob.length < 10) return false

  const pending = await loadSjAskDate(mob)
  if (!pending) return false
  if (pending.status === 'got_date' || pending.status === 'not_now') return false
  if (await alreadySeen(String(opts.messageId || ''))) return true

  const kind = classifyAskReply(String(opts.text || ''), String(opts.buttonId || ''))
  if (!kind) return false

  const result = await applySjRegAskChoice({
    phone: mob,
    id: pending.id,
    name: pending.name,
    regCode: pending.regCode,
    location: pending.location,
    choice: kind,
    dateText: String(opts.text || ''),
  })
  return result.ok || Boolean(result.error)
}

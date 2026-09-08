/**
 * AI voice call after SecurityJob registration — in the form's Primary Language.
 * Twilio only (Polly.Aditi / Google IN voices). Never Fast2SMS.
 * Office hours only (8:00 AM – 9:00 PM IST). Night registrations wait until morning.
 */

import { istNow, misTodayIst } from '../mis/dates.js'
import { rememberSjFollowupDates, ymdFollowup } from './sj-followup-dates.js'
import { sendSjProvisionalJoinOrder } from './sj-join-order.js'
import { resolveSjAiVoice, spokenJoinHint } from './sj-ai-call-voice.js'

export type SjAiCallStatus =
  | 'queued'
  | 'ringing'
  | 'asked'
  | 'got_date'
  | 'not_now'
  | 'no_answer'
  | 'failed'

export type SjAiCall = {
  phone: string
  id: string
  name: string
  regCode: string
  location: string
  language: string
  status: SjAiCallStatus
  attempt: number
  transcript?: string
  tentativeJoinDate?: string
  callSid?: string
  updatedAt: string
}

const PREFIX = 'recruit:sj-ai-call:'
const QUEUE = 'recruit:sj-ai-call-queue'
const OFFICE_FROM = 8
const OFFICE_UNTIL = 21

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

function twilioConfig(): { sid: string; token: string; from: string; baseUrl: string } | null {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const token = process.env.TWILIO_AUTH_TOKEN?.trim()
  const from = process.env.TWILIO_VOICE_FROM?.trim()
  const baseUrl = (
    process.env.OPS_VOICE_WEBHOOK_BASE?.trim() ||
    process.env.HEALTH_CHECK_BASE_URL?.trim() ||
    'https://www.agilegroup-digital.co.in'
  ).replace(/\/$/, '')
  if (!sid || !token || !from) return null
  return { sid, token, from, baseUrl }
}

export function sjAiCallConfigured(): boolean {
  return twilioConfig() !== null
}

export function sjAiCallPhone(raw: string): string {
  return String(raw || '').replace(/\D/g, '').slice(-10)
}

function storeKey(phone: string) {
  return `${PREFIX}${sjAiCallPhone(phone)}`
}

function toE164(mobile: string): string {
  const ten = sjAiCallPhone(mobile)
  return ten.length === 10 ? `+91${ten}` : `+${ten}`
}

function xmlEscape(s: string): string {
  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function sjAiCallOfficeHours(now = istNow()): boolean {
  const h = now.getHours()
  return h >= OFFICE_FROM && h < OFFICE_UNTIL
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

export function parseSpokenJoinDate(text: string): string {
  const hint = spokenJoinHint(text)
  if (hint === 'tomorrow') return skipSunday(addDaysYmd(misTodayIst(), 1))
  if (hint === 'dayafter') return skipSunday(addDaysYmd(misTodayIst(), 2))
  if (hint === 'thisweek') return skipSunday(addDaysYmd(misTodayIst(), 2))
  if (hint === 'nextweek') return skipSunday(addDaysYmd(misTodayIst(), 7))
  const t = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9/\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t) return ''
  if (/\btomorrow\b/.test(t)) return skipSunday(addDaysYmd(misTodayIst(), 1))
  if (/day after/.test(t)) return skipSunday(addDaysYmd(misTodayIst(), 2))
  if (/this week/.test(t)) return skipSunday(addDaysYmd(misTodayIst(), 2))
  if (/next week/.test(t)) return skipSunday(addDaysYmd(misTodayIst(), 7))

  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  for (let i = 0; i < weekdays.length; i++) {
    if (t.includes(weekdays[i])) {
      const now = new Date(`${misTodayIst()}T12:00:00+05:30`)
      let add = (i - now.getDay() + 7) % 7
      if (add === 0) add = 7
      return skipSunday(addDaysYmd(misTodayIst(), add))
    }
  }

  const months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ]
  const monthWord = months.findIndex((m) => t.includes(m) || t.includes(m.slice(0, 3)))
  const dayWord = t.match(/\b(\d{1,2})(st|nd|rd|th)?\b/)
  if (monthWord >= 0 && dayWord) {
    const year = Number(misTodayIst().slice(0, 4))
    const mm = String(monthWord + 1).padStart(2, '0')
    const dd = String(Number(dayWord[1])).padStart(2, '0')
    let ymd = `${year}-${mm}-${dd}`
    if (ymd < misTodayIst()) ymd = `${year + 1}-${mm}-${dd}`
    return ymdFollowup(ymd)
  }

  const dmy = t.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/)
  if (dmy) {
    const dd = dmy[1].padStart(2, '0')
    const mm = dmy[2].padStart(2, '0')
    let yyyy = dmy[3] || misTodayIst().slice(0, 4)
    if (yyyy.length === 2) yyyy = `20${yyyy}`
    let ymd = `${yyyy}-${mm}-${dd}`
    if (!dmy[3] && ymd < misTodayIst()) ymd = `${Number(yyyy) + 1}-${mm}-${dd}`
    return ymdFollowup(ymd)
  }
  return ''
}

export function spokenMeansNotNow(text: string): boolean {
  return spokenJoinHint(text) === 'notnow'
}

export async function loadSjAiCall(phone: string): Promise<SjAiCall | null> {
  const mob = sjAiCallPhone(phone)
  if (mob.length < 10) return null
  const d = await redis(['GET', storeKey(mob)])
  if (typeof d?.result !== 'string') return null
  try {
    return JSON.parse(d.result) as SjAiCall
  } catch {
    return null
  }
}

export async function loadSjAiCallMap(phones: string[]): Promise<Record<string, SjAiCall>> {
  const mobs = [...new Set(phones.map(sjAiCallPhone).filter((p) => p.length >= 10))]
  const out: Record<string, SjAiCall> = {}
  if (!mobs.length) return out
  for (let i = 0; i < mobs.length; i += 80) {
    const chunk = mobs.slice(i, i + 80)
    const d = await redis(['MGET', ...chunk.map(storeKey)])
    const arr = Array.isArray(d?.result) ? d.result : []
    for (let n = 0; n < chunk.length; n++) {
      const raw = arr[n]
      if (typeof raw !== 'string') continue
      try {
        out[chunk[n]] = JSON.parse(raw) as SjAiCall
      } catch {
        /* skip */
      }
    }
  }
  return out
}

async function saveCall(row: SjAiCall): Promise<void> {
  const mob = sjAiCallPhone(row.phone)
  if (mob.length < 10) return
  await redis(['SET', storeKey(mob), JSON.stringify({ ...row, phone: mob }), 'EX', 21 * 86400])
}

/** WhatsApp already got the date / not-now — do not keep calling. */
export async function resolveSjAiCallFromWhatsApp(
  phone: string,
  status: 'got_date' | 'not_now',
  ymd?: string,
): Promise<void> {
  const mob = sjAiCallPhone(phone)
  if (mob.length < 10) return
  const prev = await loadSjAiCall(mob)
  await saveCall({
    phone: mob,
    id: prev?.id || '',
    name: prev?.name || 'Candidate',
    regCode: prev?.regCode || '',
    location: prev?.location || '',
    language: prev?.language || 'English',
    status,
    attempt: prev?.attempt || 0,
    tentativeJoinDate: ymd || prev?.tentativeJoinDate,
    updatedAt: new Date().toISOString(),
  })
  await redis(['SREM', QUEUE, mob])
}

function webhookUrl(cfg: { baseUrl: string }, phone: string, extra = '') {
  const q = extra ? `&${extra}` : ''
  return `${cfg.baseUrl}/api/recruitment/ai-call?k=${encodeURIComponent(sjAiCallPhone(phone))}${q}`
}

export function sjAiAskTwiml(name: string, actionUrl: string, again = false, language = 'English'): string {
  const pack = resolveSjAiVoice(language)
  const line = xmlEscape(again ? pack.again(name) : pack.first(name))
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech dtmf" language="${pack.gatherLang}" speechTimeout="auto" numDigits="1" timeout="8" action="${xmlEscape(actionUrl)}" method="POST">
    <Say voice="${pack.sayVoice}" language="${pack.sayLang}">${line}</Say>
  </Gather>
  <Redirect method="POST">${xmlEscape(actionUrl)}&amp;missed=1</Redirect>
</Response>`
}

export function sjAiSayTwiml(message: string, language = 'English'): string {
  const pack = resolveSjAiVoice(language)
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="${pack.sayVoice}" language="${pack.sayLang}">${xmlEscape(message)}</Say><Hangup/></Response>`
}

async function placeTwilioCall(row: SjAiCall): Promise<{ ok: boolean; error?: string; callSid?: string }> {
  const cfg = twilioConfig()
  if (!cfg) return { ok: false, error: 'Voice line is not connected.' }
  const to = toE164(row.phone)
  const url = webhookUrl(cfg, row.phone, 'step=ask')
  const body = new URLSearchParams({
    To: to,
    From: cfg.from,
    Url: url,
    Method: 'POST',
    Timeout: '45',
    StatusCallback: webhookUrl(cfg, row.phone, 'status=1'),
    StatusCallbackMethod: 'POST',
  })
  try {
    const auth = Buffer.from(`${cfg.sid}:${cfg.token}`).toString('base64')
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cfg.sid}/Calls.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      signal: AbortSignal.timeout(25000),
    })
    const data = (await res.json().catch(() => null)) as { sid?: string; message?: string } | null
    if (!res.ok) return { ok: false, error: data?.message || `Voice HTTP ${res.status}` }
    return { ok: true, callSid: data?.sid }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Call failed' }
  }
}

export async function queueOrPlaceSjAiCall(opts: {
  phone: string
  id?: string
  name?: string
  regCode?: string
  location?: string
  language?: string
}): Promise<{ ok: boolean; queued?: boolean; called?: boolean; error?: string }> {
  const mob = sjAiCallPhone(opts.phone)
  if (mob.length < 10) return { ok: false, error: 'Mobile missing.' }
  if (!sjAiCallConfigured()) return { ok: false, error: 'Voice line is not connected.' }

  const prev = await loadSjAiCall(mob)
  if (prev?.status === 'got_date' || prev?.status === 'not_now') {
    return { ok: true, queued: false, called: false }
  }
  if (prev?.status === 'ringing' || prev?.status === 'asked') {
    return { ok: true, queued: false, called: false }
  }

  const row: SjAiCall = {
    phone: mob,
    id: String(opts.id || prev?.id || ''),
    name: String(opts.name || prev?.name || 'Candidate'),
    regCode: String(opts.regCode || prev?.regCode || ''),
    location: String(opts.location || prev?.location || ''),
    language: String(opts.language || prev?.language || 'English'),
    status: 'queued',
    attempt: (prev?.attempt || 0) + 1,
    updatedAt: new Date().toISOString(),
  }

  if (!sjAiCallOfficeHours()) {
    await saveCall(row)
    await redis(['SADD', QUEUE, mob])
    return { ok: true, queued: true }
  }

  const placed = await placeTwilioCall(row)
  if (!placed.ok) {
    await saveCall({ ...row, status: 'failed', updatedAt: new Date().toISOString() })
    await redis(['SADD', QUEUE, mob])
    return { ok: false, error: placed.error, queued: true }
  }
  await saveCall({
    ...row,
    status: 'ringing',
    callSid: placed.callSid,
    updatedAt: new Date().toISOString(),
  })
  await redis(['SREM', QUEUE, mob])
  return { ok: true, called: true }
}

export async function flushSjAiCallQueue(limit = 8): Promise<{ ok: true; called: number; queued: number }> {
  if (!sjAiCallConfigured() || !sjAiCallOfficeHours()) {
    return { ok: true, called: 0, queued: 0 }
  }
  const listed = await redis(['SMEMBERS', QUEUE])
  const phones = Array.isArray(listed?.result) ? listed.result.map((p) => String(p || '')) : []
  let called = 0
  for (const phone of phones.slice(0, Math.max(1, Math.min(20, limit)))) {
    const row = await loadSjAiCall(phone)
    if (!row || row.status === 'got_date' || row.status === 'not_now') {
      await redis(['SREM', QUEUE, phone])
      continue
    }
    const r = await queueOrPlaceSjAiCall(row)
    if (r.called) called += 1
  }
  const left = await redis(['SCARD', QUEUE])
  return { ok: true, called, queued: Number(left?.result || 0) }
}

export async function markSjAiCallAsked(phone: string): Promise<SjAiCall | null> {
  const row = await loadSjAiCall(phone)
  if (!row) return null
  const next = { ...row, status: 'asked' as const, updatedAt: new Date().toISOString() }
  await saveCall(next)
  return next
}

export async function markSjAiCallNoAnswer(phone: string): Promise<void> {
  const row = await loadSjAiCall(phone)
  if (!row || row.status === 'got_date' || row.status === 'not_now') return
  await saveCall({ ...row, status: 'no_answer', updatedAt: new Date().toISOString() })
  await redis(['SADD', QUEUE, sjAiCallPhone(phone)])
}

export async function applySjAiCallReply(opts: {
  phone: string
  speech?: string
  digits?: string
  finalRetry?: boolean
}): Promise<{ twiml: string; saved?: boolean }> {
  const row = (await loadSjAiCall(opts.phone)) || {
    phone: sjAiCallPhone(opts.phone),
    id: '',
    name: 'Candidate',
    regCode: '',
    location: '',
    language: 'English',
    status: 'asked' as const,
    attempt: 1,
    updatedAt: new Date().toISOString(),
  }
  const pack = resolveSjAiVoice(row.language)
  const speech = String(opts.speech || '').trim()
  const digit = String(opts.digits || '').trim()
  const transcript = [speech, digit ? `press ${digit}` : ''].filter(Boolean).join(' · ')

  let ymd = ''
  if (digit === '1') ymd = skipSunday(addDaysYmd(misTodayIst(), 2))
  else if (digit === '2') ymd = skipSunday(addDaysYmd(misTodayIst(), 7))
  else if (digit === '3' || spokenMeansNotNow(speech)) {
    await rememberSjFollowupDates(
      { phone: row.phone, id: row.id, regCode: row.regCode },
      { holdRemindOn: addDaysYmd(misTodayIst(), 7) },
    )
    await saveCall({
      ...row,
      status: 'not_now',
      transcript,
      updatedAt: new Date().toISOString(),
    })
    return {
      twiml: sjAiSayTwiml(pack.thanksLater, row.language),
      saved: true,
    }
  } else {
    ymd = parseSpokenJoinDate(speech)
  }

  if (!ymd) {
    await saveCall({ ...row, status: 'asked', transcript, updatedAt: new Date().toISOString() })
    if (opts.finalRetry) {
      return {
        twiml: sjAiSayTwiml(pack.teamWillCall, row.language),
      }
    }
    const againUrl = `${twilioConfig()?.baseUrl || 'https://www.agilegroup-digital.co.in'}/api/recruitment/ai-call?k=${encodeURIComponent(row.phone)}&step=again`
    return { twiml: sjAiAskTwiml(row.name, againUrl, true, row.language) }
  }

  await rememberSjFollowupDates(
    { phone: row.phone, id: row.id, regCode: row.regCode },
    { call1At: misTodayIst(), tentativeJoinDate: ymd },
  )
  await saveCall({
    ...row,
    status: 'got_date',
    transcript,
    tentativeJoinDate: ymd,
    updatedAt: new Date().toISOString(),
  })
  void sendSjProvisionalJoinOrder({
    phone: row.phone,
    id: row.id,
    name: row.name,
    regCode: row.regCode,
    tentativeJoinDate: ymd,
    location: row.location,
  }).catch(() => {})

  const [y, m, d] = ymd.split('-')
  const spoken = `${d} ${['January','February','March','April','May','June','July','August','September','October','November','December'][Number(m) - 1] || ''} ${y}`
  return {
    twiml: sjAiSayTwiml(pack.thanksDate(spoken), row.language),
    saved: true,
  }
}

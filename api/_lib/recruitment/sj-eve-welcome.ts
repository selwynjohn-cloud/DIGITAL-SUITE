/**
 * One day before Tentative date — welcome WhatsApp to the candidate.
 * Send uses Whapi only. Never Fast2SMS.
 * Does not change MIS, DRR, login, or the joining letter.
 */
import { misTodayIst } from '../mis/dates.js'
import { resolveRecruitmentCentre } from '../securityjob/recruitment-centres.js'
import { waSendText, whatsappChatId, whatsappConfigured } from '../pulse/whatsapp.js'
import { RECRUIT_BRAND } from './brand.js'
import {
  loadAllRegisteredCandidates,
  type RegisteredCandidate,
} from './registration-store.js'
import { ymdFollowup } from './sj-followup-dates.js'

const LEDGER = 'recruit:sj-eve-welcome:'

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

function addDaysIst(ymd: string, days: number): string {
  const iso = ymdFollowup(ymd)
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00+05:30`)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function displayDmy(ymd: string): string {
  const iso = ymdFollowup(ymd)
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function phoneOf(c: RegisteredCandidate): string {
  return String(c.phone || '').replace(/\D/g, '').slice(-10)
}

export function eveWelcomeDue(c: RegisteredCandidate, todayYmd: string): boolean {
  if (c.active === false) return false
  if (c.status === 'joined' || c.status === 'rejected' || c.status === 'not_willing') return false
  if (c.recruitClosed) return false
  const tent = ymdFollowup(c.tentativeJoinDate)
  if (!tent) return false
  return addDaysIst(tent, -1) === todayYmd
}

export function buildSjEveWelcomeText(opts: {
  name: string
  tentativeJoinDate: string
  centreCity: string
  mapsUrl: string
  contact: string
}): string {
  const name = String(opts.name || 'Candidate').trim() || 'Candidate'
  const when = displayDmy(opts.tentativeJoinDate) || 'your joining date'
  return [
    RECRUIT_BRAND.company,
    RECRUIT_BRAND.product,
    '',
    `Namaste ${name},`,
    'Welcome.',
    `Please come tomorrow, ${when}, to the Recruitment Centre / Branch Office.`,
    '',
    'Please come with the following documents:',
    '1. Educational qualification',
    '2. Aadhaar card',
    '3. Police verification certificate',
    '4. Medical Fitness',
    '5. PSARA Training Certificate (if any)',
    '6. Bank Account details',
    '',
    `Recruitment Centre / Branch Office: ${opts.centreCity}`,
    `GPS / Map: ${opts.mapsUrl}`,
    `Contact Number: ${opts.contact}`,
    '',
    `By Recruitment Team, ${RECRUIT_BRAND.company}`,
    RECRUIT_BRAND.footerSiteLabel,
  ].join('\n')
}

export async function sendSjEveWelcomeMessages(opts?: {
  preview?: boolean
  force?: boolean
  ymd?: string
}): Promise<{
  ok: boolean
  date: string
  due: number
  sent: number
  skipped: number
  preview?: boolean
  error?: string
  sample?: string
}> {
  const todayYmd = ymdFollowup(opts?.ymd) || misTodayIst()
  const all = await loadAllRegisteredCandidates()
  const due = all.filter((c) => eveWelcomeDue(c, todayYmd))
  const sample = due[0]
    ? buildSjEveWelcomeText({
        name: due[0].name,
        tentativeJoinDate: String(due[0].tentativeJoinDate || ''),
        centreCity: resolveRecruitmentCentre(due[0].location || due[0].branchId).city,
        mapsUrl: resolveRecruitmentCentre(due[0].location || due[0].branchId).mapsUrl,
        contact: resolveRecruitmentCentre(due[0].location || due[0].branchId).helpDesk,
      })
    : ''

  if (opts?.preview) {
    return { ok: true, preview: true, date: todayYmd, due: due.length, sent: 0, skipped: 0, sample }
  }
  if (!due.length) return { ok: true, date: todayYmd, due: 0, sent: 0, skipped: 0 }
  if (!whatsappConfigured()) {
    return { ok: false, date: todayYmd, due: due.length, sent: 0, skipped: 0, error: 'WhatsApp line is not connected.' }
  }

  let sent = 0
  let skipped = 0
  for (const c of due.slice(0, 80)) {
    const mob = phoneOf(c)
    if (mob.length < 10) {
      skipped += 1
      continue
    }
    const key = `${LEDGER}${todayYmd}:${mob}`
    if (!opts?.force) {
      const already = await redis(['GET', key])
      if (already?.result) {
        skipped += 1
        continue
      }
    }
    const centre = resolveRecruitmentCentre(c.location || c.branchId)
    const text = buildSjEveWelcomeText({
      name: c.name,
      tentativeJoinDate: String(c.tentativeJoinDate || ''),
      centreCity: centre.city,
      mapsUrl: centre.mapsUrl,
      contact: centre.helpDesk,
    })
    const r = await waSendText(whatsappChatId(mob), text)
    if (r?.ok) {
      sent += 1
      await redis(['SET', key, '1', 'EX', 60 * 60 * 48])
    }
  }
  return { ok: true, date: todayYmd, due: due.length, sent, skipped }
}

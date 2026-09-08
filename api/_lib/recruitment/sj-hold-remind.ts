/**
 * Hold date = call-again day. Morning reminder only.
 * Does not change DRR or other Recruitment reports.
 */
import { misTodayIst } from '../mis/dates.js'
import { adminWhatsAppPhone, waSendText, whatsappConfigured } from '../pulse/whatsapp.js'
import { SJ_INVITE_APP_COPY } from './sj-invite-recipients.js'
import {
  loadAllRegisteredCandidates,
  sjFollowBucket,
  sjHoldOn,
  type RegisteredCandidate,
} from './registration-store.js'

const LEDGER = 'recruit:sj-hold-call:'

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

export function holdDueToday(c: RegisteredCandidate, todayYmd: string): boolean {
  if (c.active === false || c.status === 'joined') return false
  const hold = sjHoldOn(c)
  return Boolean(hold && hold === todayYmd && sjFollowBucket(c, todayYmd) === 'hold')
}

export async function listHoldDueToday(todayYmd = misTodayIst()): Promise<RegisteredCandidate[]> {
  const all = await loadAllRegisteredCandidates()
  return all.filter((c) => holdDueToday(c, todayYmd))
}

export function holdCallRemindText(rows: RegisteredCandidate[], todayYmd: string): string {
  const lines = [
    'Agile Recruitment — Hold date is today.',
    `Please call these people again today (${todayYmd.slice(8, 10)}/${todayYmd.slice(5, 7)}/${todayYmd.slice(0, 4)}).`,
    '',
  ]
  rows.slice(0, 40).forEach((c, i) => {
    const mob = String(c.phone || '').replace(/\D/g, '').slice(-10)
    lines.push(`${i + 1}. ${c.name || '—'} — ${mob || 'no mobile'} — ${c.ownerTeam || '—'}`)
  })
  if (rows.length > 40) lines.push(`… and ${rows.length - 40} more`)
  return lines.join('\n')
}

export function holdCallRemindHtml(rows: RegisteredCandidate[], todayYmd: string): string {
  if (!rows.length) return ''
  const items = rows
    .slice(0, 40)
    .map((c) => {
      const mob = String(c.phone || '').replace(/\D/g, '').slice(-10)
      return `<li><b>${c.name || '—'}</b> — ${mob || 'no mobile'} — ${c.ownerTeam || '—'}</li>`
    })
    .join('')
  return `<div style="margin:16px 0;padding:12px 14px;border:2px solid #d97706;border-radius:10px;background:#fff7ed">
    <p style="margin:0 0 8px"><b>Hold date is today — call these people again</b> (${todayYmd})</p>
    <ol style="margin:0;padding-left:20px">${items}</ol>
  </div>`
}

export async function sendHoldCallReminders(opts?: { force?: boolean }): Promise<{
  ok: boolean
  count: number
  sent: boolean
  skipped?: boolean
}> {
  const todayYmd = misTodayIst()
  const rows = await listHoldDueToday(todayYmd)
  if (!rows.length) return { ok: true, count: 0, sent: false }
  const key = `${LEDGER}${todayYmd}`
  if (!opts?.force) {
    const already = await redis(['GET', key])
    if (already?.result) return { ok: true, count: rows.length, sent: false, skipped: true }
  }
  const text = holdCallRemindText(rows, todayYmd)
  let sent = false
  if (whatsappConfigured()) {
    const targets = [...new Set([adminWhatsAppPhone(), SJ_INVITE_APP_COPY].filter(Boolean))]
    for (const to of targets) {
      const r = await waSendText(to, text)
      if (r?.ok) sent = true
    }
  }
  if (sent || opts?.force) await redis(['SET', key, '1', 'EX', 60 * 60 * 36])
  return { ok: true, count: rows.length, sent, skipped: false }
}

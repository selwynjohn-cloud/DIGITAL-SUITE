/**
 * Agile Guards — daily morning status mail to HODs (CC Director).
 */

import { Resend } from 'resend'
import { sendSuiteEmail } from '../suite-mail.js'
import { withDailyPackDelivery } from '../suite-daily-delivery.js'
import { getHodEmailsForBranch } from '../mis/digest.js'
import { getBranches, getUsers as getMisUsers } from '../mis/store.js'
import { computeGuardsDashboard } from './dashboard.js'
import { listAllHodContacts } from './hod-contacts.js'
import { displayStatus, SLA_LABEL } from './completion.js'
import { realComplaintsOnly } from './practice.js'
import {
  applySla,
  branchDisplayName,
  getComplaints,
  getFeedback,
  getOpsStaff,
  getPortalUsers,
  guardsBranchList,
  type GuardComplaint,
  type GuardFeedback,
} from './store.js'

function esc(s: unknown) {
  return String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function istYmd(iso?: string) {
  const d = iso ? new Date(iso) : new Date()
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

/** Official Indian date for mail subject: 13-08-2026 */
function istSubjectDate(iso?: string) {
  const ymd = istYmd(iso)
  const [y, m, d] = ymd.split('-')
  if (!d) return ymd
  return `${d}-${m}-${y}`
}

export function dailyGuardsStatusSubject(iso?: string) {
  return `AGILE DIGITAL COMMAND CENTER , AGILE GUARDS- COMPLAINTS STATUS ${istSubjectDate(iso)}-REG`
}

function istLabel(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    })
  } catch {
    return iso
  }
}

export type SatisfactionVerdict = 'convinced' | 'satisfied' | 'mixed' | 'not_satisfied' | 'no_feedback'

export function satisfactionFromFeedback(
  rating?: number,
  comment?: string,
): { verdict: SatisfactionVerdict; label: string } {
  const c = String(comment || '').toLowerCase()
  const negative = /not satisfied|not resolved|still waiting|no response|unhappy|not closed|same problem|pending still/
  const positive = /thank|satisfied|resolved|happy|convinced|excellent|very good/

  if (!rating || rating < 1) {
    if (negative.test(c)) return { verdict: 'not_satisfied', label: 'Not satisfied (from comment — no star rating)' }
    return {
      verdict: 'no_feedback',
      label: 'Feedback not received — cannot confirm if the guard is convinced',
    }
  }
  if (rating >= 5) {
    return { verdict: 'convinced', label: positive.test(c) ? 'Convinced and satisfied (5/5)' : 'Convinced (5/5)' }
  }
  if (rating >= 4) return { verdict: 'satisfied', label: 'Satisfied (4/5)' }
  if (rating === 3) {
    return negative.test(c)
      ? { verdict: 'not_satisfied', label: 'Not fully convinced (3/5) — HOD should call the guard' }
      : { verdict: 'mixed', label: 'Partly convinced (3/5) — follow up' }
  }
  return { verdict: 'not_satisfied', label: `Not satisfied (${rating}/5) — HOD should call the guard` }
}

async function aiCompletionNarrative(
  rows: { code: string; guardName: string; rating: number | null; comment: string; label: string }[],
): Promise<string> {
  const fallback = ruleNarrative(rows)
  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  const pplxKey = process.env.PERPLEXITY_API_KEY?.trim()
  const url = openaiKey
    ? 'https://api.openai.com/v1/chat/completions'
    : pplxKey
      ? 'https://api.perplexity.ai/chat/completions'
      : ''
  const key = openaiKey || pplxKey
  if (!url || !key || !rows.length) return fallback
  const model = openaiKey ? process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini' : 'sonar'
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You write a short morning briefing for security-company HODs in plain English. 4–6 sentences. Say how many closed complaints look convinced/satisfied vs not, based on star ratings and comments. Do not invent facts.',
          },
          {
            role: 'user',
            content: rows
              .map(
                (r) =>
                  `${r.code} ${r.guardName}: ${r.rating ?? 'no rating'}/5 — ${r.label}. Comment: ${r.comment || 'none'}`,
              )
              .join('\n'),
          },
        ],
        temperature: 0.2,
        max_tokens: 280,
      }),
    })
    if (!res.ok) return fallback
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content?.trim() || fallback
  } catch {
    return fallback
  }
}

function ruleNarrative(
  rows: { rating: number | null; verdict?: SatisfactionVerdict; label: string }[],
): string {
  if (!rows.length) {
    return 'No complaints were marked completed in the last 7 days. There is no satisfaction reading for this morning.'
  }
  const convinced = rows.filter((r) => r.verdict === 'convinced' || r.verdict === 'satisfied').length
  const notOk = rows.filter((r) => r.verdict === 'not_satisfied').length
  const mixed = rows.filter((r) => r.verdict === 'mixed').length
  const missing = rows.filter((r) => r.verdict === 'no_feedback').length
  const bits = [
    `${rows.length} complaint(s) were completed in the last 7 days.`,
    convinced ? `${convinced} guard(s) look convinced / satisfied from their rating.` : '',
    mixed ? `${mixed} look only partly convinced — please follow up.` : '',
    notOk ? `${notOk} are not satisfied — the HOD should telephone the guard today.` : '',
    missing ? `${missing} have not sent the 1–5 star feedback yet, so we cannot confirm they are convinced.` : '',
  ]
  return bits.filter(Boolean).join(' ')
}

function bucket(c: GuardComplaint): 'received' | 'process' | 'delayed' | 'solved' {
  if (c.status === 'solved') return 'solved'
  if (c.isDelayed) return 'delayed'
  if (c.status === 'received' || c.status === 'reopened') return 'received'
  return 'process'
}

function rowsHtml(
  list: GuardComplaint[],
  branchName: (id: string) => string,
  extra?: (c: GuardComplaint) => string,
) {
  if (!list.length) {
    return '<tr><td colspan="6" style="padding:8px;color:#64748b">None</td></tr>'
  }
  return list
    .map((c) => {
      const extraCell = extra ? `<td style="padding:8px">${extra(c)}</td>` : ''
      return `<tr>
        <td style="padding:8px">${esc(c.code)}</td>
        <td style="padding:8px">${esc(c.guardName)}</td>
        <td style="padding:8px">${esc(branchName(c.branchId))}</td>
        <td style="padding:8px">${esc(c.category)}${c.subCategory ? ` — ${esc(c.subCategory)}` : ''}</td>
        <td style="padding:8px">${esc(displayStatus(c))}</td>
        <td style="padding:8px">${esc(istLabel(c.registeredAt))}</td>
        ${extraCell}
      </tr>`
    })
    .join('')
}

export async function allGuardsHodEmails(): Promise<string[]> {
  const [branches, misUsers, portalUsers] = await Promise.all([
    getBranches(),
    getMisUsers(),
    getPortalUsers(),
  ])
  const branchList = guardsBranchList(branches)
  const seen = new Set<string>()
  const out: string[] = []
  const add = (e: string) => {
    const x = e.trim().toLowerCase()
    if (!x.includes('@') || seen.has(x)) return
    seen.add(x)
    out.push(e.trim())
  }
  for (const h of listAllHodContacts(branchList, misUsers, portalUsers)) add(h.email)
  for (const b of branchList) {
    for (const e of await getHodEmailsForBranch(b.id, misUsers, branches)) add(e)
  }
  return out
}

export async function sendDailyGuardsStatusMail(opts?: {
  preview?: boolean
  force?: boolean
  _direct?: boolean
}) {
  if (!opts?.preview && !opts?._direct) {
    return withDailyPackDelivery('guards', () => sendDailyGuardsStatusMail({ ...opts, _direct: true }), {
      force: opts?.force,
    })
  }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey && !opts?.preview) return { ok: false, skipped: true, reason: 'Email not configured' }

  const [raw, feedback, ops, branches] = await Promise.all([
    getComplaints(),
    getFeedback(),
    getOpsStaff(),
    getBranches(),
  ])
  const complaints = realComplaintsOnly(raw).map((c) => applySla(c)).filter((c) => c.active !== false)
  const liveIds = new Set(complaints.map((c) => c.id))
  const fbByComplaint = new Map<string, GuardFeedback>()
  for (const f of feedback) {
    if (liveIds.has(f.complaintId)) fbByComplaint.set(f.complaintId, f)
  }

  const received = complaints.filter((c) => bucket(c) === 'received')
  const inProcess = complaints.filter((c) => bucket(c) === 'process')
  const delayed = complaints.filter((c) => bucket(c) === 'delayed')
  const weekAgo = Date.now() - 7 * 86400000
  const completed = complaints.filter(
    (c) => c.status === 'solved' && c.solvedAt && new Date(c.solvedAt).getTime() >= weekAgo,
  )

  const branchName = (id: string) => branchDisplayName(id, branches)
  const dash = computeGuardsDashboard(complaints, ops, Object.fromEntries(branches.map((b) => [b.id, b.name])))
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })

  const completionRows = completed.map((c) => {
    const fb = fbByComplaint.get(c.id)
    const sat = satisfactionFromFeedback(fb?.rating, fb?.comment)
    return {
      code: c.code,
      guardName: c.guardName,
      branch: branchName(c.branchId),
      rating: fb?.rating ?? null,
      comment: fb?.comment || '',
      verdict: sat.verdict,
      label: sat.label,
      solvedAt: c.solvedAt,
    }
  })
  const narrative = await aiCompletionNarrative(completionRows)

  const completionTable = completed.length
    ? completed
        .map((c) => {
          const row = completionRows.find((r) => r.code === c.code)
          const stars = row?.rating ? `${'★'.repeat(row.rating)}${'☆'.repeat(5 - row.rating)} (${row.rating}/5)` : '—'
          return `<tr>
            <td style="padding:8px">${esc(c.code)}</td>
            <td style="padding:8px">${esc(c.guardName)}</td>
            <td style="padding:8px">${esc(branchName(c.branchId))}</td>
            <td style="padding:8px">${esc(istLabel(c.solvedAt))}</td>
            <td style="padding:8px;color:#b45309">${esc(stars)}</td>
            <td style="padding:8px">${esc(row?.label || '')}</td>
          </tr>`
        })
        .join('')
    : '<tr><td colspan="6" style="padding:8px;color:#64748b">No completions in the last 7 days</td></tr>'

  const html = `<div style="font-family:Arial,sans-serif;max-width:860px;color:#0f172a">
    <div style="background:linear-gradient(135deg,#1e3a8a,#7f1d1d);color:#fff;padding:18px 20px;border-radius:10px 10px 0 0">
      <div style="font-size:13px;opacity:.9">Agile Guards · Internal Customer Care</div>
      <h1 style="margin:6px 0 0;font-size:22px">Morning complaint status — ${esc(today)}</h1>
      <p style="margin:8px 0 0;font-size:14px">Response standard: ${esc(SLA_LABEL)}</p>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;padding:18px 20px;border-radius:0 0 10px 10px">
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <tr>
          <td style="padding:12px;background:#eff6ff;border-radius:8px;text-align:center"><b style="font-size:22px">${received.length}</b><div style="font-size:12px;color:#1e40af">Received (not yet assigned)</div></td>
          <td style="width:8px"></td>
          <td style="padding:12px;background:#f8fafc;border-radius:8px;text-align:center"><b style="font-size:22px">${inProcess.length}</b><div style="font-size:12px;color:#334155">In process</div></td>
          <td style="width:8px"></td>
          <td style="padding:12px;background:#fef2f2;border-radius:8px;text-align:center"><b style="font-size:22px;color:#b91c1c">${delayed.length}</b><div style="font-size:12px;color:#991b1b">Delayed (past ${esc(SLA_LABEL)})</div></td>
          <td style="width:8px"></td>
          <td style="padding:12px;background:#ecfdf5;border-radius:8px;text-align:center"><b style="font-size:22px;color:#047857">${completed.length}</b><div style="font-size:12px;color:#065f46">Completed (7 days)</div></td>
        </tr>
      </table>
      <p style="font-size:13px;color:#475569">Open total: <b>${received.length + inProcess.length + delayed.length}</b> · Average close time: <b>${dash.avgResponseHours || 0} hours</b> · On-time close: <b>${dash.slaCompliancePct}%</b></p>

      <h3 style="color:#1e3a8a;margin:18px 0 8px">1. Received — waiting for HOD assignment</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e2e8f0">${rowsHtml(received, branchName)}</table>

      <h3 style="color:#1e3a8a;margin:18px 0 8px">2. In process</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e2e8f0">${rowsHtml(inProcess, branchName)}</table>

      <h3 style="color:#b91c1c;margin:18px 0 8px">3. Delayed — please close today</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #fecaca;background:#fff7f7">${rowsHtml(delayed, branchName)}</table>

      <h3 style="color:#065f46;margin:18px 0 8px">4. Completions — is the guard convinced / satisfied?</h3>
      <p style="font-size:14px;line-height:1.55;background:#f0fdf4;border:1px solid #bbf7d0;padding:12px;border-radius:8px">${esc(narrative)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e2e8f0;margin-top:10px">
        <tr style="background:#f8fafc;text-align:left">
          <th style="padding:8px">Code</th><th style="padding:8px">Guard</th><th style="padding:8px">Branch</th>
          <th style="padding:8px">Closed</th><th style="padding:8px">Stars</th><th style="padding:8px">AI reading</th>
        </tr>
        ${completionTable}
      </table>
      <p style="font-size:12px;color:#64748b;margin-top:16px">
        Open the portal: <a href="https://www.agilegroup-digital.co.in/guards">HOD</a> ·
        <a href="https://www.agilegroup-digital.co.in/guards?portal=management">Management</a>
      </p>
    </div>
  </div>`

  if (opts?.preview) {
    return {
      ok: true,
      preview: true,
      received: received.length,
      process: inProcess.length,
      delayed: delayed.length,
      completed: completed.length,
      html,
    }
  }

  const hods = await allGuardsHodEmails()
  const director = process.env.MIS_DIRECTOR_EMAIL?.trim() || 'director@agilegroup.co.in'
  const to = hods.length ? hods : [director]
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Guards <noreply@agilegroup.co.in>'
  const r = await sendSuiteEmail(resend, {
    from,
    to,
    subject: dailyGuardsStatusSubject(),
    html,
  })
  return {
    ok: !r.error,
    to,
    cc: [director],
    received: received.length,
    process: inProcess.length,
    delayed: delayed.length,
    completed: completed.length,
    error: r.error?.message,
  }
}

/**
 * AVM end-of-day report — aggregates and metadata only. No names, mobiles, or photos.
 */
import { Resend } from 'resend'
import { getHodEmailsForBranch } from '../mis/digest.js'
import { getBranches } from '../mis/store.js'
import { pinMailFrom, pinMailReplyTo, sendSuiteEmail, suiteDirectorEmail } from '../suite-mail.js'
import { suiteAppOpenPageFooterInlineHtml } from '../suite-app-footer.js'
import {
  listAggregates,
  markDailySent,
  wasDailySent,
  type AvmAggregate,
} from './store.js'

function esc(s: string): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function mapLine(map: Record<string, number> | undefined): string {
  const entries = Object.entries(map || {}).filter(([, n]) => n > 0)
  if (!entries.length) return '—'
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k} (${n})`)
    .join(', ')
}

export function dailyReportHtml(ymd: string, rows: AvmAggregate[]): string {
  const total = rows.reduce((n, r) => n + (r.visitorCount || 0), 0)
  const closed = rows.reduce((n, r) => n + (r.closedCount || 0), 0)
  const open = rows.reduce((n, r) => n + (r.notClosedCount || 0), 0)
  const body = rows.length
    ? rows
        .map(
          (r) => `<tr>
      <td>${esc(r.branchName || r.branchId)}</td>
      <td>${esc(r.buildingName || r.buildingId)}</td>
      <td>${r.visitorCount || 0}</td>
      <td>${r.closedCount || 0}</td>
      <td>${r.notClosedCount || 0}</td>
      <td>${esc(mapLine(r.peakHours))}</td>
      <td>${esc(mapLine(r.hostDepts))}</td>
      <td>${esc(mapLine(r.materialsIn))}</td>
      <td>${esc(mapLine(r.materialsOut))}</td>
    </tr>`,
        )
        .join('')
    : '<tr><td colspan="9">No visitor counts for this date.</td></tr>'
  return `<div style="font-family:Segoe UI,Arial,sans-serif;color:#0f172a">
  <img src="https://www.agilegroup-digital.co.in/agile-logo-clear.png" alt="Agile" height="48" style="background:transparent">
  <h2 style="margin:10px 0 4px">Agile Visitors Management — Daily Report</h2>
  <p style="color:#64748b">Date ${esc(ymd)} · counts only · no visitor names or identity numbers</p>
  <p><b>Visitors ${total}</b> · Closed ${closed} · Not closed ${open}</p>
  <table style="border-collapse:collapse;width:100%;font-size:13px" border="1" cellpadding="6">
    <thead style="background:#0b1220;color:#e2e8f0">
      <tr>
        <th>Branch</th><th>Building</th><th>Visitors</th><th>Closed</th><th>Not closed</th>
        <th>Peak hours</th><th>Host department</th><th>Materials in</th><th>Materials out</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
  </table>
  ${suiteAppOpenPageFooterInlineHtml()}
</div>`
}

export async function previewDailyReport(ymd: string): Promise<{ html: string; rows: AvmAggregate[] }> {
  const rows = await listAggregates(ymd)
  return { html: dailyReportHtml(ymd, rows), rows }
}

export async function sendDailyReportMail(
  ymd: string,
  opts?: { force?: boolean },
): Promise<{ ok: boolean; skipped?: boolean; error?: string; to?: string[] }> {
  if (!opts?.force && (await wasDailySent(ymd))) {
    return { ok: true, skipped: true }
  }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }
  const { html, rows } = await previewDailyReport(ymd)
  const branches = await getBranches(true)
  const to: string[] = []
  const seen = new Set<string>()
  for (const r of rows) {
    const emails = await getHodEmailsForBranch(r.branchId, undefined, branches)
    for (const e of emails) {
      const em = e.trim().toLowerCase()
      if (!em.includes('@') || seen.has(em)) continue
      if (em === 'it@agilegroup.co.in' || em === 'app@agilegroup.co.in') continue
      seen.add(em)
      to.push(em)
    }
  }
  const director = suiteDirectorEmail()
  if (!to.length && director.includes('@')) to.push(director)
  if (!to.length) return { ok: false, error: 'No HOD mailbox for this report' }
  const resend = new Resend(apiKey)
  const sent = await sendSuiteEmail(resend, {
    from: pinMailFrom(),
    to,
    replyTo: pinMailReplyTo(),
    subject: `AVM daily visitor counts — ${ymd}`,
    html,
  })
  if (sent.error) return { ok: false, error: sent.error.message }
  await markDailySent(ymd)
  return { ok: true, to }
}

/**
 * Client-facing Late Start & Out of Post + PVC & MC reports (colourful PDF / email).
 * Share always CC Lokesh + Director.
 */
import { Resend } from 'resend'
import { sendSuiteEmail } from '../suite-mail.js'
import { LOKESH_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL } from './branch-mail-cc.js'
import { MIS_BRAND, misLetterPrintFooter } from './brand.js'
import { misTodayIst } from './dates.js'
import { guardDocPresent, guardRecordEligible, type MisDutyIncident, type MisGuardDoc } from './store.js'

function esc(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function fmtDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd ?? '').trim())
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(ymd ?? '')
}

function pct(n: number, t: number): number {
  if (!t || t <= 0) return 0
  return Math.min(100, Math.round((Math.min(n, t) * 100) / t))
}

function barHtml(n: number, t: number): string {
  const p = pct(n, t)
  const c = p >= 90 ? '#16a34a' : p >= 70 ? '#d97706' : '#dc2626'
  return (
    `<div style="height:14px;border-radius:7px;background:#e2e8f0;overflow:hidden;min-width:90px;display:inline-block;vertical-align:middle">` +
    `<i style="display:block;height:100%;width:${p}%;background:${c}"></i></div>` +
    ` <b style="color:${c}">${p}%</b>`
  )
}

const EXPORT_CSS = `
body{margin:0;padding:0;background:#f1f5f9;color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;font-size:14px}
.cf-wrap{max-width:920px;margin:0 auto;padding:18px 14px 28px}
.cf-hdr{background:linear-gradient(135deg,#14224f 0%,#1e3a8a 55%,#0f172a 100%);color:#fff;border-radius:14px;padding:20px 22px;margin-bottom:16px;border-bottom:4px solid #c9a84c;display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}
.cf-hdr .co{font-size:18px;font-weight:900;color:#fff;line-height:1.35}
.cf-hdr .title{font-size:20px;font-weight:900;color:#c9a84c;margin-top:10px}
.cf-hdr .sub{font-size:13px;color:#cbd5e1;margin-top:6px;line-height:1.5}
.cf-kpis{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px}
.cf-kpi{flex:1;min-width:120px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;text-align:center;box-shadow:0 1px 3px rgba(15,23,42,.06)}
.cf-kpi b{display:block;font-size:28px;font-weight:900;line-height:1.1}
.cf-kpi span{display:block;margin-top:6px;font-size:12px;color:#64748b;font-weight:700}
.cf-sec{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:14px;box-shadow:0 1px 3px rgba(15,23,42,.05)}
.cf-sec-h{font-size:13px;font-weight:900;color:#14224f;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #c9a84c}
table.cf-tbl{width:100%;border-collapse:collapse;font-size:13px}
.cf-tbl th,.cf-tbl td{border:1px solid #e2e8f0;padding:8px 9px;text-align:left;vertical-align:top}
.cf-tbl th{background:linear-gradient(135deg,#14224f,#1e3a8a);color:#c9a84c;font-size:11px;text-transform:uppercase}
.cf-tbl tr:nth-child(even) td{background:#f8fafc}
.tag-late{background:#fef3c7;color:#b45309;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:800}
.tag-out{background:#fee2e2;color:#b91c1c;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:800}
.ok{color:#15803d;font-weight:800}.miss{color:#b91c1c;font-weight:800;background:#fef2f2}
.cf-note{font-size:12px;color:#64748b;margin-top:8px;line-height:1.45}
@media print{body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
`

function wrapDoc(title: string, body: string): string {
  return (
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${esc(title)}</title><style>${EXPORT_CSS}</style></head>` +
    `<body>${body}</body></html>`
  )
}

function headerBlock(reportTitle: string, subtitle: string): string {
  return (
    `<div class="cf-hdr">` +
    `<div><img src="${MIS_BRAND.logoUrl}" alt="Agile" width="56" height="56" style="background:#fff;border-radius:10px;padding:4px;margin-bottom:10px;display:block">` +
    `<div class="co">${esc(MIS_BRAND.company)}</div>` +
    `<div class="title">${esc(reportTitle)}</div>` +
    `<div class="sub">${esc(subtitle)}</div></div>` +
    `<div style="background:rgba(255,255,255,.1);border:1px solid rgba(201,168,76,.45);border-radius:12px;padding:12px 16px;text-align:center;min-width:110px">` +
    `<div style="font-size:11px;color:#cbd5e1">Prepared</div>` +
    `<div style="font-size:16px;font-weight:900;color:#c9a84c;margin-top:4px">${esc(fmtDate(misTodayIst()))}</div>` +
    `</div></div>`
  )
}

export type DutyReportPayload = {
  date: string
  branchName?: string
  late: number
  out: number
  incidents: MisDutyIncident[]
}

export function buildDutyExceptionReportHtml(d: DutyReportPayload): string {
  const scope = d.branchName ? `Branch: ${d.branchName}` : 'All Branches'
  const lateRows = d.incidents.filter((i) => i.type === 'late_start')
  const outRows = d.incidents.filter((i) => i.type === 'out_of_post')
  const rowHtml = (list: MisDutyIncident[], kind: 'late' | 'out') =>
    list
      .map((i, idx) => {
        const time =
          kind === 'late' ? i.dutyStartTime || i.incidentTime || '—' : i.incidentTime || '—'
        const detail = kind === 'out' ? i.kmFromPost || '—' : i.scheduledTime || '—'
        const mobile = String(i.mobile || '').replace(/\D/g, '').slice(-10) || '—'
        return (
          `<tr><td>${idx + 1}</td><td>${esc(i.guardName)}</td><td>${esc(mobile)}</td><td>${esc(i.client)}</td><td>${esc(i.unit)}</td>` +
          `<td>${esc(time)}</td><td>${esc(detail)}</td><td>${esc(i.remarks || '—')}</td></tr>`
        )
      })
      .join('') ||
    `<tr><td colspan="8" style="padding:14px;color:#64748b;text-align:center">No cases in this period.</td></tr>`

  const body =
    `<div class="cf-wrap">` +
    headerBlock('Late Start & Out of Post Report', `${scope} · Date ${fmtDate(d.date)} · Client copy`) +
    `<div class="cf-kpis">` +
    `<div class="cf-kpi"><b style="color:#d97706">${d.late}</b><span>Late Start</span></div>` +
    `<div class="cf-kpi"><b style="color:#dc2626">${d.out}</b><span>Out of Post</span></div>` +
    `<div class="cf-kpi"><b style="color:#14224f">${d.late + d.out}</b><span>Total Cases</span></div>` +
    `</div>` +
    `<div class="cf-sec"><div class="cf-sec-h"><span class="tag-late">LATE START</span> — Cases</div>` +
    `<table class="cf-tbl"><thead><tr><th>#</th><th>Guard</th><th>Mobile</th><th>Client</th><th>Site</th><th>Duty Start</th><th>Scheduled</th><th>Remarks</th></tr></thead>` +
    `<tbody>${rowHtml(lateRows, 'late')}</tbody></table></div>` +
    `<div class="cf-sec"><div class="cf-sec-h"><span class="tag-out">OUT OF POST</span> — Cases</div>` +
    `<table class="cf-tbl"><thead><tr><th>#</th><th>Guard</th><th>Mobile</th><th>Client</th><th>Site</th><th>Left Time</th><th>Away Detail</th><th>Remarks</th></tr></thead>` +
    `<tbody>${rowHtml(outRows, 'out')}</tbody></table></div>` +
    `<div class="cf-note">Source: Agile Mobile (Work360). This report is shared for client visibility of duty exceptions.</div>` +
    misLetterPrintFooter() +
    `</div>`

  return wrapDoc(`Late Start & Out of Post — ${fmtDate(d.date)}`, body)
}

export type ComplianceBranchRow = {
  branch: string
  strength: number
  pvc: number
  medical: number
  training: number
}

export type ComplianceReportPayload = {
  date?: string
  branchName?: string
  rows: ComplianceBranchRow[]
  totals: { strength: number; pvc: number; medical: number; training: number }
  /** Optional guard detail for a single-branch report */
  guards?: Array<{
    guardName: string
    employeeId: string
    unitName: string
    pvc: string
    medical: string
    training: string
  }>
}

function statusCell(v: string, validity = ''): string {
  return guardDocPresent(v, validity)
    ? `<td class="ok">${esc(v || validity || 'OK')}</td>`
    : `<td class="miss">Missing</td>`
}

export function buildPvcMcReportHtml(d: ComplianceReportPayload): string {
  const scope = d.branchName ? `Branch: ${d.branchName}` : 'All Branches'
  const asOf = fmtDate(d.date || misTodayIst())
  const t = d.totals
  const branchRows =
    d.rows
      .map(
        (r) =>
          `<tr><td><b>${esc(r.branch)}</b></td><td style="text-align:center">${r.strength}</td>` +
          `<td style="text-align:center">${r.pvc}</td><td>${barHtml(r.pvc, r.strength)}</td>` +
          `<td style="text-align:center">${r.medical}</td><td>${barHtml(r.medical, r.strength)}</td>` +
          `<td style="text-align:center">${r.training}</td><td>${barHtml(r.training, r.strength)}</td></tr>`,
      )
      .join('') ||
    `<tr><td colspan="8" style="padding:14px;color:#64748b;text-align:center">No compliance data.</td></tr>`

  let guardBlock = ''
  if (d.guards && d.guards.length) {
    const gRows = d.guards
      .map(
        (g, i) =>
          `<tr><td>${i + 1}</td><td><b>${esc(g.guardName)}</b></td><td>${esc(g.employeeId || '—')}</td>` +
          `<td>${esc(g.unitName || '—')}</td>${statusCell(g.pvc)}${statusCell(g.medical)}${statusCell(g.training)}</tr>`,
      )
      .join('')
    guardBlock =
      `<div class="cf-sec"><div class="cf-sec-h">Guard-wise PVC / Medical / Training</div>` +
      `<table class="cf-tbl"><thead><tr><th>#</th><th>Guard</th><th>Emp ID</th><th>Unit</th><th>PVC</th><th>Medical</th><th>Training</th></tr></thead>` +
      `<tbody>${gRows}</tbody></table></div>`
  }

  const body =
    `<div class="cf-wrap">` +
    headerBlock('PVC & Medical Compliance Report', `${scope} · As of ${asOf} · Client copy`) +
    `<div class="cf-kpis">` +
    `<div class="cf-kpi"><b style="color:#14224f">${t.strength}</b><span>Guards (register)</span></div>` +
    `<div class="cf-kpi"><b style="color:#16a34a">${pct(t.pvc, t.strength)}%</b><span>PVC (${t.pvc})</span></div>` +
    `<div class="cf-kpi"><b style="color:#2563eb">${pct(t.medical, t.strength)}%</b><span>Medical (${t.medical})</span></div>` +
    `<div class="cf-kpi"><b style="color:#c9a84c">${pct(t.training, t.strength)}%</b><span>Training (${t.training})</span></div>` +
    `</div>` +
    `<div class="cf-sec"><div class="cf-sec-h">Branch-wise Summary</div>` +
    `<table class="cf-tbl"><thead><tr><th>Branch</th><th>Guards</th><th>PVC</th><th>PVC %</th><th>Medical</th><th>Med %</th><th>Training</th><th>Trn %</th></tr></thead>` +
    `<tbody>${branchRows}</tbody></table>` +
    `<div class="cf-note">Percentages use unique active guards as denominator — each guard counted once; never above 100%.</div></div>` +
    guardBlock +
    misLetterPrintFooter() +
    `</div>`

  return wrapDoc(`PVC & MC Report — ${asOf}`, body)
}

export function guardsForComplianceReport(docs: MisGuardDoc[]) {
  return docs
    .filter(guardRecordEligible)
    .map((d) => ({
      guardName: d.guardName || '',
      employeeId: d.employeeId || '',
      unitName: d.unitName || '',
      pvc: d.pvc || d.pvcValidity || '',
      medical: d.medical || d.medicalValidity || '',
      training: d.training || '',
    }))
}

/** Always CC Director (client-facing reports). */
function clientReportCc(to: string[]): string[] {
  const toSet = new Set(to.map((e) => e.trim().toLowerCase()))
  return [LOKESH_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL].filter((e) => e.includes('@') && !toSet.has(e))
}

async function sendClientFacingMail(opts: {
  to: string[]
  subject: string
  html: string
}): Promise<{ ok: true; to: string[] } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }
  if (!opts.to.length) return { ok: false, error: 'No recipient email' }
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile MIS <noreply@agilegroup.co.in>'
  const result = await sendSuiteEmail(resend, {
    from,
    to: opts.to,
    cc: clientReportCc(opts.to),
    subject: opts.subject,
    html: opts.html,
  })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
  return { ok: true, to: opts.to }
}

export function parseShareEmails(raw: unknown): string[] {
  return String(raw ?? '')
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter((e) => e.includes('@'))
}

export async function sendDutyExceptionReportMail(to: string[], d: DutyReportPayload) {
  const scope = d.branchName ? d.branchName : 'All Branches'
  return sendClientFacingMail({
    to,
    subject: `Late Start & Out of Post Report — ${scope} — ${fmtDate(d.date)}`,
    html: buildDutyExceptionReportHtml(d),
  })
}

export async function sendPvcMcReportMail(to: string[], d: ComplianceReportPayload) {
  const scope = d.branchName ? d.branchName : 'All Branches'
  const asOf = fmtDate(d.date || misTodayIst())
  return sendClientFacingMail({
    to,
    subject: `PVC & Medical Compliance Report — ${scope} — ${asOf}`,
    html: buildPvcMcReportHtml(d),
  })
}

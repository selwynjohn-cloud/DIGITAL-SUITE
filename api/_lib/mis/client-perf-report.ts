/**
 * Colourful Client Performance report — PDF, email, and WhatsApp (no formal letter).
 */
import { MIS_BRAND, misPrintFooterBlock } from './brand.js'
import { misTodayIst } from './dates.js'
import {
  clientPerfColourfulChartsHtml,
  clientPerfColourfulComplianceHtml,
  clientPerfColourfulKpiRowHtml,
} from './client-perf-charts.js'
import { clientPerfMwLabel, clientPerfPeriodLabel, type ClientPerfLetterData } from './client-perf-letter.js'
import { formatInrFromLacs } from './client-perf-money.js'

export type { ClientPerfLetterData as ClientPerfReportData }

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

function display(v: unknown): string {
  return v == null || v === '' ? '—' : String(v)
}

const EXPORT_CSS = `
body{margin:0;padding:0;background:#0b1220;color:#e2e8f0;font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
.cp-wrap{max-width:900px;margin:0 auto;padding:20px 16px 28px}
.cp-hdr{background:linear-gradient(135deg,#14224f,#1b2f6b);color:#fff;border-radius:12px;padding:18px 20px;margin-bottom:16px;border:1px solid #334155;display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}
.cp-hdr .co{font-size:20px;font-weight:900;color:#fff}
.cp-hdr .sub{font-size:13px;color:#cbd5e1;margin-top:6px;line-height:1.5}
.cp-hdr .avg{background:linear-gradient(145deg,#0e1730,#16223f);border:1px solid #334155;border-radius:12px;padding:14px 18px;text-align:center;min-width:120px}
.cp-hdr .avg b{display:block;font-size:28px;color:#c9a84c;font-weight:900}
.cp-hdr .avg span{font-size:12px;color:#94a3b8}
.cp-sec{background:#111a30;border:1px solid #22304f;border-radius:12px;padding:18px;margin-bottom:14px}
.cp-sec-h{font-size:14px;font-weight:900;color:#c9a84c;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px}
.cp-foot{margin-top:18px;padding-top:14px;border-top:1px solid #334155;text-align:center;font-size:12px;color:#94a3b8;line-height:1.6}
.cp-foot b{color:#fde68a}
@media print{body{background:#0b1220;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
`

/** Colourful report body — same visual style as the MIS screen. */
export function buildClientPerfReportHtml(d: ClientPerfLetterData): string {
  const period = clientPerfPeriodLabel(d)
  const today = fmtDate(misTodayIst())

  return (
    `<div class="cp-wrap">` +
    `<div class="cp-hdr">` +
    `<div><img src="${MIS_BRAND.logoUrl}" alt="Agile" width="52" height="52" style="background:#fff;border-radius:8px;padding:4px;margin-bottom:10px;display:block">` +
    `<div class="co">${esc(d.clientName)}</div>` +
    `<div class="sub">Unit Performance Report · ${esc(period)}<br>${esc(MIS_BRAND.company)} · Security Division · ${esc(today)}</div></div>` +
    `<div class="avg"><b>${esc(String(d.avgDeploy))}%</b><span>Avg Deployment</span></div>` +
    `</div>` +
    clientPerfColourfulChartsHtml(d) +
    `<div class="cp-sec"><div class="cp-sec-h">1. Deployment</div>` +
    clientPerfColourfulKpiRowHtml([
      { value: String(d.san), label: 'Sanctioned', color: '#3b82f6' },
      { value: String(d.dep), label: 'Deployed', color: '#22c55e' },
      { value: String(d.vac), label: 'Vacant', color: '#ef4444' },
      { value: String(d.daysWithData), label: 'Days with data', color: '#c9a84c' },
    ]) +
    `</div>` +
    `<div class="cp-sec"><div class="cp-sec-h">2. Visits &amp; Duty</div>` +
    clientPerfColourfulKpiRowHtml([
      { value: display(d.dayVisits), label: 'Day Visits', color: '#3b82f6' },
      { value: display(d.nightChecks), label: 'Night Checks', color: '#c9a84c' },
      { value: display(d.training), label: 'Training', color: '#22c55e' },
      { value: display(d.lateStart), label: 'Late Start', color: '#ef4444' },
      { value: display(d.outOfPost), label: 'Out of Post', color: '#ef4444' },
    ]) +
    `</div>` +
    `<div class="cp-sec"><div class="cp-sec-h">3. Compliance &amp; Billing</div>` +
    clientPerfColourfulComplianceHtml(d) +
    `<div style="font-size:11px;color:#94a3b8;text-align:center;margin-top:10px">All amounts in ₹ Lakhs (two decimals) · Collected = Monthly bill − Balance</div>` +
    `</div>` +
    `<div class="cp-foot">Thank you for your continued support. We welcome your feedback.</div>` +
    misPrintFooterBlock() +
    `</div>`
  )
}

/** Full HTML document for PDF print or email. */
export function buildClientPerfReportEmailHtml(d: ClientPerfLetterData): string {
  return (
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>Unit Performance — ${esc(d.clientName)}</title><style>${EXPORT_CSS}</style></head>` +
    `<body>${buildClientPerfReportHtml(d)}</body></html>`
  )
}

/** Plain-text summary for WhatsApp (no letter wording). */
export function clientPerfReportShareText(d: ClientPerfLetterData): string {
  const period = clientPerfPeriodLabel(d)
  return (
    `📊 *Unit Performance Report*\n` +
    `*${d.clientName}*\n` +
    `Period: ${period}\n\n` +
    `*Deployment*\n` +
    `Sanctioned: ${d.san} · Deployed: ${d.dep} · Vacant: ${d.vac}\n` +
    `Avg Deployment: ${d.avgDeploy}% · Days: ${d.daysWithData}\n\n` +
    `*Visits & Duty*\n` +
    `Day: ${display(d.dayVisits)} · Night: ${display(d.nightChecks)} · Training: ${display(d.training)}\n` +
    `Late Start: ${display(d.lateStart)} · Out of Post: ${display(d.outOfPost)}\n\n` +
    `*Compliance & Billing*\n` +
    `MW Compliant: ${clientPerfMwLabel(d)}\n` +
    `Monthly bill: ${formatInrFromLacs(d.monthlyBillLacs)}\n` +
    `Collected: ${formatInrFromLacs(d.collectedLacs)}\n` +
    `Balance: ${formatInrFromLacs(d.balanceToPayLacs)}\n\n` +
    `— Agile Security Force Private Limited\nwww.agilegroup.co.in`
  )
}

import { formatInrFromLacs } from './client-perf-money.js'

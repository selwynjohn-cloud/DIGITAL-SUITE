/**
 * Client Performance letter — same layout for screen, PDF print, and email body.
 */
import { MIS_BRAND, misLetterPrintFooter } from './brand.js'
import { misTodayIst } from './dates.js'
import {
  clientPerfChartsBlockHtml,
  clientPerfComplianceSectionHtml,
} from './client-perf-charts.js'

export type ClientPerfLetterData = {
  clientName: string
  month?: string
  from?: string
  to?: string
  rangeLabel?: string
  san: number
  dep: number
  vac: number
  avgDeploy: number
  daysWithData: number
  dayVisits?: number
  nightChecks?: number
  training?: number
  lateStart?: number
  outOfPost?: number
  mwCompliant?: string
  mwCompliantLabel?: string
  monthlyBillLacs?: number | null
  balanceToPayLacs?: number | null
  collectedLacs?: number | null
}

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

export function clientPerfPeriodLabel(d: {
  from?: string
  to?: string
  rangeLabel?: string
  month?: string
}): string {
  if (d.from && d.to) return `${fmtDate(d.from)} to ${fmtDate(d.to)}`
  return d.rangeLabel || d.month || ''
}

export function clientPerfMwLabel(d: {
  mwCompliantLabel?: string
  mwCompliant?: string
}): string {
  if (d.mwCompliantLabel) return d.mwCompliantLabel
  const m = String(d.mwCompliant ?? '').toLowerCase()
  if (m === 'yes') return 'Yes'
  if (m === 'no') return 'No'
  return '—'
}

function display(v: unknown): string {
  return v == null || v === '' ? '—' : String(v)
}

function dataRow(label: string, value: string): string {
  return `<tr><td style="padding:7px 10px;border:1px solid #e2e8f0;font-weight:700;width:55%;color:#334155">${esc(label)}</td><td style="padding:7px 10px;border:1px solid #e2e8f0;font-weight:800;color:#0f172a">${esc(value)}</td></tr>`
}

function sectionTable(title: string, rows: string): string {
  return (
    `<h3 style="color:#14224f;font-size:14px;margin:18px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px">${esc(title)}</h3>` +
    `<table style="width:100%;border-collapse:collapse;font-size:13px;margin:8px 0 14px"><tbody>${rows}</tbody></table>`
  )
}

/** Full letter HTML — matches Management Client Performance screen / PDF. */
export function buildClientPerfLetterHtml(d: ClientPerfLetterData): string {
  const period = clientPerfPeriodLabel(d)
  const today = fmtDate(misTodayIst())

  return (
    `<div style="background:#fff;color:#0f172a;border:1px solid #cbd5e1;border-radius:12px;overflow:hidden;max-width:820px;font-family:'Segoe UI',Arial,sans-serif">` +
    `<div style="background:linear-gradient(135deg,#14224f,#1e3a8a);color:#fff;padding:18px 22px;border-bottom:4px solid #c9a84c;display:flex;align-items:center">` +
    `<img src="${MIS_BRAND.logoUrl}" alt="Agile" width="56" height="56" style="background:#fff;border-radius:8px;padding:4px;margin-right:14px">` +
    `<div><div style="font-size:16px;font-weight:800;color:#fff">${esc(MIS_BRAND.company)}</div>` +
    `<div style="color:#c9a84c;margin-top:4px;font-size:12px">Unit Performance Report · Security Division</div></div></div>` +
    `<div style="padding:22px 26px 18px;line-height:1.55;font-size:14px;color:#1e293b">` +
    `<div style="text-align:right;margin-bottom:16px;color:#475569">Date: ${esc(today)}</div>` +
    `<div style="margin-bottom:14px"><b>To,</b><br>M/s. ${esc(d.clientName)}</div>` +
    `<div style="margin:14px 0 10px">Dear Sir/Madam,</div>` +
    `<p style="margin:0 0 14px">We hereby submit the unit performance report for your kind information for the period <b>${esc(period)}</b> and review.</p>` +
    clientPerfChartsBlockHtml(d) +
    sectionTable(
      '1. Deployment',
      dataRow('Sanctioned', String(d.san)) +
        dataRow('Deployed', String(d.dep)) +
        dataRow('Vacant', String(d.vac)) +
        dataRow('Average Deployment %', `${d.avgDeploy}%`) +
        dataRow('Days with data', String(d.daysWithData)),
    ) +
    sectionTable(
      '2. Visits & Duty',
      dataRow('Day Visits', display(d.dayVisits)) +
        dataRow('Night Checks', display(d.nightChecks)) +
        dataRow('Training', display(d.training)) +
        dataRow('Late Start', display(d.lateStart)) +
        dataRow('Out of Post', display(d.outOfPost)),
    ) +
    clientPerfComplianceSectionHtml(d) +
    `<div style="margin-top:22px">` +
    `<p style="margin:0 0 14px">We are extremely thankful for your support and guidance. We welcome your suggestion and feedback which would help us to deliver better.</p>` +
    `<div style="margin-top:22px;line-height:1.45">With regards,<br><br>` +
    `<b style="display:block;color:#14224f">Director — Security Division</b>` +
    `<b style="display:block;color:#14224f">${esc(MIS_BRAND.company)}</b></div></div>` +
    `</div>` +
    misLetterPrintFooter() +
    `</div>`
  )
}

/** Complete email document — letter design as the body (not the old mailWrap bar). */
export function buildClientPerfLetterEmailHtml(d: ClientPerfLetterData): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>` +
    `<body style="margin:0;padding:20px 12px;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">` +
    `<div style="max-width:820px;margin:0 auto">` +
    buildClientPerfLetterHtml(d) +
    `</div></body></html>`
}

/**
 * Client Performance charts & Compliance section — shared by letter screen, PDF, email.
 */
import { formatInrFromLacs } from './client-perf-money.js'
import { billingCoinStacksSvg, clientPerfDeployChartTitle, CLIENT_PERF_BILLING_CHART_TITLE } from './client-perf-billing-bar.js'

function fmtDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd ?? '').trim())
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(ymd ?? '')
}

function periodLabel(d: {
  from?: string
  to?: string
  rangeLabel?: string
  month?: string
}): string {
  if (d.from && d.to) return `${fmtDate(d.from)} to ${fmtDate(d.to)}`
  return d.rangeLabel || d.month || ''
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function display(v: unknown): string {
  return v == null || v === '' ? '—' : String(v)
}

type PieSlice = { label: string; value: number; light: string; dark: string }

function donutArc(cx: number, cy: number, r: number, ir: number, startDeg: number, endDeg: number): string {
  if (endDeg - startDeg >= 359.99) return ''
  const s1 = (startDeg * Math.PI) / 180
  const s2 = (endDeg * Math.PI) / 180
  const x1 = cx + r * Math.sin(s1)
  const y1 = cy - r * Math.cos(s1)
  const x2 = cx + r * Math.sin(s2)
  const y2 = cy - r * Math.cos(s2)
  const x3 = cx + ir * Math.sin(s2)
  const y3 = cy - ir * Math.cos(s2)
  const x4 = cx + ir * Math.sin(s1)
  const y4 = cy - ir * Math.cos(s1)
  const lg = endDeg - startDeg > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} L ${x3} ${y3} A ${ir} ${ir} 0 ${lg} 0 ${x4} ${y4} Z`
}

/** 3D-style donut pie — shadow, depth layer, gradient top slices. */
export function pie3dDonutSvg(
  slices: PieSlice[],
  emptyMsg: string,
  opts?: { centerValue?: string; centerLabel?: string; moneyFromLacs?: boolean; darkTheme?: boolean },
): string {
  const active = slices.filter((s) => Math.max(0, Number(s.value) || 0) > 0)
  const total = active.reduce((sum, s) => sum + Math.max(0, Number(s.value) || 0), 0)
  if (!total) {
    return `<div style="color:#94a3b8;padding:24px;text-align:center;font-size:13px">${esc(emptyMsg)}</div>`
  }

  const cx = 100
  const cy = 82
  const r = 76
  const ir = 42
  const depth = 11
  const uid = Math.random().toString(36).slice(2, 8)

  let svg = `<svg width="200" height="170" viewBox="0 0 200 170" xmlns="http://www.w3.org/2000/svg"><defs>`
  active.forEach((s, i) => {
    svg += `<linearGradient id="cpg${uid}${i}" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0%" stop-color="${s.light}"/><stop offset="100%" stop-color="${s.dark}"/></linearGradient>`
  })
  svg += `</defs>`
  svg += `<ellipse cx="${cx}" cy="${cy + depth + 18}" rx="${r * 0.82}" ry="9" fill="rgba(15,23,42,0.14)"/>`

  let angle = 0
  active.forEach((s) => {
    const val = Math.max(0, Number(s.value) || 0)
    const sweep = (val / total) * 360
    if (sweep < 0.05) return
    const start = angle
    angle += sweep
    svg += `<path d="${donutArc(cx, cy + depth, r, ir, start, angle)}" fill="${s.dark}" opacity="0.9"/>`
  })

  angle = 0
  active.forEach((s, i) => {
    const val = Math.max(0, Number(s.value) || 0)
    const sweep = (val / total) * 360
    if (sweep < 0.05) return
    const start = angle
    angle += sweep
    svg += `<path d="${donutArc(cx, cy, r, ir, start, angle)}" fill="url(#cpg${uid}${i})" stroke="#fff" stroke-width="1.5"/>`
  })
  if (opts?.centerValue) {
    const centerFill = opts.darkTheme ? '#fde68a' : '#14224f'
    const labelFill = opts.darkTheme ? '#94a3b8' : '#64748b'
    svg += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="18" font-weight="800" fill="${centerFill}">${esc(opts.centerValue)}</text>`
    svg += `<text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="9" fill="${labelFill}">${esc(opts.centerLabel || '')}</text>`
  }
  svg += `</svg>`

  const legendColor = opts?.darkTheme ? '#94a3b8' : '#475569'
  const legend = active
    .map((s) => {
      const val = Math.max(0, Number(s.value) || 0)
      const pct = Math.round((val / total) * 100)
      const shown = opts?.moneyFromLacs ? formatInrFromLacs(val) : String(val)
      return (
        `<span style="display:inline-block;margin:4px 8px;font-size:11px;color:${legendColor}">` +
        `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px;background:linear-gradient(180deg,${s.light},${s.dark})"></span>` +
        `${esc(s.label)} <b>${esc(shown)}</b> (${pct}%)</span>`
      )
    })
    .join('')

  return svg + `<div style="margin-top:6px;font-size:11px;color:#475569;text-align:center;line-height:1.7">${legend}</div>`
}

export function deploymentForDaysHtml(days: number, san: number, dep: number, vac: number, dark = false): string {
  const s = Math.max(0, Number(san) || 0)
  const d = Math.max(0, Number(dep) || 0)
  const v = Math.max(0, Number(vac) || 0)
  const depPct = s ? Math.round((d / s) * 100) : 0
  const vacPct = s ? Math.round((v / s) * 100) : 0
  const dayN = Math.max(0, Number(days) || 0)
  if (dark) {
    return (
      `<div style="margin-top:10px;padding:12px 14px;background:rgba(30,58,138,.22);border:1px solid #334155;border-radius:10px;text-align:center">` +
      `<div style="font-size:14px;font-weight:800;color:#fde68a;margin-bottom:10px">Deployment for ${esc(String(dayN))} days</div>` +
      `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:12px;color:#cbd5e1">` +
      `<tr>` +
      `<td style="padding:6px 4px;text-align:center"><span style="display:block;font-weight:800;color:#60a5fa;font-size:16px">${s}</span>Sanctioned Posts</td>` +
      `<td style="padding:6px 4px;text-align:center"><span style="display:block;font-weight:800;color:#4ade80;font-size:16px">${depPct}%</span>Deployed strength</td>` +
      `<td style="padding:6px 4px;text-align:center"><span style="display:block;font-weight:800;color:#f87171;font-size:16px">${vacPct}%</span>Vacant posts</td>` +
      `</tr></table></div>`
    )
  }
  return (
    `<div style="margin-top:10px;padding:12px 14px;background:linear-gradient(135deg,#f8fafc,#eff6ff);border:1px solid #e2e8f0;border-radius:10px;text-align:center">` +
    `<div style="font-size:14px;font-weight:800;color:#14224f;margin-bottom:10px">Deployment for ${esc(String(dayN))} days</div>` +
    `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:12px;color:#334155">` +
    `<tr>` +
    `<td style="padding:6px 4px;text-align:center"><span style="display:block;font-weight:800;color:#1d4ed8;font-size:16px">${s}</span>Sanctioned Posts</td>` +
    `<td style="padding:6px 4px;text-align:center"><span style="display:block;font-weight:800;color:#15803d;font-size:16px">${depPct}%</span>Deployed strength</td>` +
    `<td style="padding:6px 4px;text-align:center"><span style="display:block;font-weight:800;color:#b91c1c;font-size:16px">${vacPct}%</span>Vacant posts</td>` +
    `</tr></table></div>`
  )
}

export function pie3dDeploySvg(san: number, dep: number, vac: number, daysWithData = 0, dark = false): string {
  const s = Math.max(0, Number(san) || 0)
  const d = Math.max(0, Number(dep) || 0)
  const v = Math.max(0, Number(vac) || 0)
  const total = s || d + v
  if (!total) {
    return `<div style="color:#94a3b8;padding:24px;text-align:center;font-size:13px">No deployment data</div>`
  }
  const slices: PieSlice[] = [
    { label: 'Deployed strength', value: d, light: '#4ade80', dark: '#15803d' },
    { label: 'Vacant posts', value: v, light: '#f87171', dark: '#b91c1c' },
  ]
  const gap = Math.max(0, s - d - v)
  if (gap > 0) slices.push({ label: 'Sanctioned (unfilled)', value: gap, light: '#93c5fd', dark: '#1d4ed8' })

  const pie = pie3dDonutSvg(slices, 'No deployment data', {
    centerValue: String(s || d + v + gap),
    centerLabel: 'Sanctioned Posts',
    darkTheme: dark,
  })

  return pie + deploymentForDaysHtml(daysWithData, s, d, v, dark)
}

export function pie3dBillingSvg(
  bill: number | null | undefined,
  collected: number | null | undefined,
  balance: number | null | undefined,
  dark = false,
): string {
  if (bill == null && collected == null && balance == null) {
    return `<div style="color:#94a3b8;padding:24px;text-align:center;font-size:13px">Enter monthly bill &amp; balance on branch portal</div>`
  }
  const b = Math.max(0, Number(bill) || 0)
  const c = Math.max(0, Number(collected) || 0)
  const bal = Math.max(0, Number(balance) ?? Math.max(0, b - c))
  if (!b && !c && !bal) {
    return `<div style="color:#94a3b8;padding:24px;text-align:center;font-size:13px">Enter monthly bill &amp; balance on branch portal</div>`
  }
  return pie3dDonutSvg(
    [
      { label: 'Collected', value: c || 0, light: '#fcd34d', dark: '#b45309' },
      { label: 'Balance due', value: bal || 0, light: '#60a5fa', dark: '#1d4ed8' },
    ],
    'No billing data',
    { moneyFromLacs: true, darkTheme: dark },
  )
}

export function clientPerfChartsBlockHtml(d: {
  san: number
  dep: number
  vac: number
  monthlyBillLacs?: number | null
  collectedLacs?: number | null
  balanceToPayLacs?: number | null
  from?: string
  to?: string
  rangeLabel?: string
  month?: string
  daysWithData: number
}): string {
  return (
    `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 8px;border-collapse:collapse">` +
    `<tr>` +
    `<td width="50%" valign="top" style="padding:6px">` +
    `<div style="border:1px solid #e2e8f0;border-radius:10px;padding:12px;text-align:center;background:#f8fafc;box-shadow:0 6px 18px rgba(20,33,79,.08)">` +
    `<div style="font-size:12px;color:#14224f;font-weight:800;margin-bottom:8px">${esc(clientPerfDeployChartTitle(d.daysWithData))}</div>` +
    pie3dDeploySvg(d.san, d.dep, d.vac, d.daysWithData) +
    `</div></td>` +
    `<td width="50%" valign="top" style="padding:6px">` +
    `<div style="border:1px solid #e2e8f0;border-radius:10px;padding:12px;text-align:center;background:#f8fafc;box-shadow:0 6px 18px rgba(20,33,79,.08)">` +
    `<div style="font-size:12px;color:#14224f;font-weight:800;margin-bottom:8px">${esc(CLIENT_PERF_BILLING_CHART_TITLE)}</div>` +
    billingCoinStacksSvg(d.monthlyBillLacs, d.collectedLacs, d.balanceToPayLacs) +
    `</div></td>` +
    `</tr></table>`
  )
}

export function clientPerfMwBannerHtml(d: { mwCompliant?: string; mwCompliantLabel?: string }): string {
  const raw = String(d.mwCompliant ?? '').toLowerCase()
  if (raw === 'yes') {
    return (
      `<div style="margin:14px 0;padding:14px 20px;border-radius:10px;text-align:center;font-weight:800;font-size:15px;letter-spacing:.3px;` +
      `background:linear-gradient(135deg,#15803d,#22c55e);color:#fff;box-shadow:0 4px 14px rgba(22,163,74,.35)">` +
      `✓ Minimum Wage Compliant — <span style="font-size:17px">YES</span></div>`
    )
  }
  if (raw === 'no') {
    return (
      `<div style="margin:14px 0;padding:14px 20px;border-radius:10px;text-align:center;font-weight:800;font-size:15px;letter-spacing:.3px;` +
      `background:linear-gradient(135deg,#b91c1c,#ef4444);color:#fff;box-shadow:0 4px 14px rgba(239,68,68,.35)">` +
      `✗ Minimum Wage Compliant — <span style="font-size:17px">NO</span></div>`
    )
  }
  return (
    `<div style="margin:14px 0;padding:12px 16px;border-radius:10px;text-align:center;font-weight:700;font-size:13px;` +
    `background:#f1f5f9;color:#64748b;border:1px dashed #cbd5e1">MW Compliant — not entered yet (branch portal)</div>`
  )
}

function pctBannerStyle(pct: number | null): { bg: string; color: string; border?: string } {
  if (pct == null) return { bg: '#f1f5f9', color: '#64748b', border: '1px dashed #cbd5e1' }
  if (pct >= 90) return { bg: 'linear-gradient(135deg,#15803d,#22c55e)', color: '#fff' }
  if (pct >= 70) return { bg: 'linear-gradient(135deg,#b45309,#f59e0b)', color: '#fff' }
  return { bg: 'linear-gradient(135deg,#b91c1c,#ef4444)', color: '#fff' }
}

function clientPerfPctBannerHtml(opts: {
  title: string
  pct: number | null
  count?: number
  san?: number
  label?: string
  pendingText: string
}): string {
  const pct = opts.pct == null || Number.isNaN(Number(opts.pct)) ? null : Math.max(0, Math.min(100, Math.round(Number(opts.pct))))
  const style = pctBannerStyle(pct)
  const detail =
    pct == null
      ? opts.pendingText
      : opts.label ||
        `${opts.title} — ${pct}%` +
          (opts.san != null && opts.san > 0 ? ` (${opts.count ?? 0} / ${opts.san} posts)` : '')
  const shadow =
    pct == null
      ? ''
      : pct >= 90
        ? 'box-shadow:0 4px 14px rgba(22,163,74,.35);'
        : pct >= 70
          ? 'box-shadow:0 4px 14px rgba(245,158,11,.35);'
          : 'box-shadow:0 4px 14px rgba(239,68,68,.35);'
  const border = style.border ? `border:${style.border};` : ''
  return (
    `<div style="margin:10px 0;padding:14px 18px;border-radius:10px;text-align:center;font-weight:800;font-size:15px;letter-spacing:.2px;` +
    `background:${style.bg};color:${style.color};${shadow}${border}">` +
    (pct == null ? esc(detail) : `✓ ${esc(detail)}`) +
    `</div>`
  )
}

/** PVC compliance banner for Client Performance (all clients). */
export function clientPerfPvcBannerHtml(d: {
  pvcPct?: number | null
  pvcCount?: number
  complianceSan?: number
  pvcLabel?: string
}): string {
  return clientPerfPctBannerHtml({
    title: 'PVC Compliant',
    pct: d.pvcPct ?? null,
    count: d.pvcCount,
    san: d.complianceSan,
    label: d.pvcLabel,
    pendingText: 'PVC — Guard Docs not linked for this client yet',
  })
}

/** Medical Certificate (MC) banner for Client Performance (all clients). */
export function clientPerfMcBannerHtml(d: {
  medicalPct?: number | null
  medicalCount?: number
  complianceSan?: number
  medicalLabel?: string
}): string {
  return clientPerfPctBannerHtml({
    title: 'MC (Medical Fitness)',
    pct: d.medicalPct ?? null,
    count: d.medicalCount,
    san: d.complianceSan,
    label: d.medicalLabel,
    pendingText: 'MC (Medical) — Guard Docs not linked for this client yet',
  })
}

export function clientPerfComplianceBannersHtml(d: {
  mwCompliant?: string
  mwCompliantLabel?: string
  pvcPct?: number | null
  pvcCount?: number
  medicalPct?: number | null
  medicalCount?: number
  complianceSan?: number
  pvcLabel?: string
  medicalLabel?: string
}): string {
  return clientPerfPvcBannerHtml(d) + clientPerfMcBannerHtml(d) + clientPerfMwBannerHtml(d)
}

function kpiTile(grad: string, value: string, label: string): string {
  return (
    `<td width="33%" valign="top" style="padding:6px">` +
    `<div style="background:linear-gradient(135deg,${grad});border-radius:12px;padding:14px 10px;text-align:center;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.14)">` +
    `<div style="font-size:22px;font-weight:800;line-height:1.1">${esc(value)}</div>` +
    `<div style="font-size:11px;margin-top:6px;opacity:.92">${esc(label)}</div></div></td>`
  )
}

export function clientPerfComplianceSectionHtml(d: {
  mwCompliant?: string
  mwCompliantLabel?: string
  pvcPct?: number | null
  pvcCount?: number
  medicalPct?: number | null
  medicalCount?: number
  complianceSan?: number
  san?: number
  pvcLabel?: string
  medicalLabel?: string
  accuracyNote?: string
  monthlyBillLacs?: number | null
  collectedLacs?: number | null
  balanceToPayLacs?: number | null
}): string {
  const strength = Number(d.complianceSan || d.san || 0)
  const strengthLine =
    strength > 0
      ? `<div style="margin:8px 0 4px;padding:10px 12px;border-radius:8px;background:#eff6ff;border:1px solid #93c5fd;color:#1e3a8a;font-size:13px;font-weight:700;text-align:center">Unit sanctioned strength: ${esc(String(strength))} posts — PVC &amp; MC counted only against this strength (cannot exceed)</div>`
      : ''
  const accuracy =
    d.accuracyNote
      ? `<div style="font-size:11px;color:#475569;text-align:center;margin:8px 0 10px;line-height:1.45">${esc(d.accuracyNote)}</div>`
      : ''
  return (
    `<h3 style="color:#fde68a;font-size:14px;margin:20px 0 10px;padding:8px 12px;background:linear-gradient(135deg,#14224f,#1e3a8a);border-radius:8px;border-left:4px solid #c9a84c">3. Compliance &amp; Billing</h3>` +
    strengthLine +
    clientPerfComplianceBannersHtml(d) +
    accuracy +
    `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 14px"><tr>` +
    kpiTile('#1d4ed8,#3b82f6', formatInrFromLacs(d.monthlyBillLacs), 'Monthly bill') +
    kpiTile('#b45309,#f59e0b', formatInrFromLacs(d.collectedLacs), 'Collected') +
    kpiTile('#7c3aed,#a855f7', formatInrFromLacs(d.balanceToPayLacs), 'Balance to be paid') +
    `</tr></table>` +
    `<div style="font-size:11px;color:#64748b;text-align:center;margin-bottom:8px">Amounts in ₹ thousands · Collected = Monthly bill − Balance</div>`
  )
}

const PANEL_DARK =
  'background:linear-gradient(145deg,#0e1730,#16223f);border:1px solid #334155;border-radius:12px;padding:14px;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.25)'

/** Colourful chart row for PDF / email export (dark panels + 3D pies). */
export function clientPerfColourfulChartsHtml(d: {
  san: number
  dep: number
  vac: number
  monthlyBillLacs?: number | null
  collectedLacs?: number | null
  balanceToPayLacs?: number | null
  daysWithData: number
}): string {
  return (
    `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;border-collapse:collapse">` +
    `<tr>` +
    `<td width="50%" valign="top" style="padding:6px">` +
    `<div style="${PANEL_DARK}">` +
    `<div style="font-size:13px;color:#c9a84c;font-weight:800;margin-bottom:10px">${esc(clientPerfDeployChartTitle(d.daysWithData))}</div>` +
    pie3dDeploySvg(d.san, d.dep, d.vac, d.daysWithData, true) +
    `</div></td>` +
    `<td width="50%" valign="top" style="padding:6px">` +
    `<div style="${PANEL_DARK}">` +
    `<div style="font-size:13px;color:#c9a84c;font-weight:800;margin-bottom:10px">${esc(CLIENT_PERF_BILLING_CHART_TITLE)}</div>` +
    billingCoinStacksSvg(d.monthlyBillLacs, d.collectedLacs, d.balanceToPayLacs, true) +
    `</div></td>` +
    `</tr></table>`
  )
}

export function clientPerfColourfulKpiRowHtml(
  items: { value: string; label: string; color: string }[],
): string {
  const cells = items
    .map(
      (k) =>
        `<td width="${Math.floor(100 / items.length)}%" valign="top" style="padding:5px">` +
        `<div style="background:linear-gradient(145deg,#0e1730,#16223f);border:1px solid #22304f;border-radius:12px;padding:14px 10px;text-align:center">` +
        `<div style="font-size:26px;font-weight:900;color:${k.color}">${esc(k.value)}</div>` +
        `<div style="font-size:12px;color:#94a3b8;margin-top:4px">${esc(k.label)}</div></div></td>`,
    )
    .join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>${cells}</tr></table>`
}

export function clientPerfColourfulComplianceHtml(d: {
  mwCompliant?: string
  mwCompliantLabel?: string
  pvcPct?: number | null
  pvcCount?: number
  medicalPct?: number | null
  medicalCount?: number
  complianceSan?: number
  san?: number
  pvcLabel?: string
  medicalLabel?: string
  accuracyNote?: string
  monthlyBillLacs?: number | null
  collectedLacs?: number | null
  balanceToPayLacs?: number | null
}): string {
  const strength = Number(d.complianceSan || d.san || 0)
  const strengthLine =
    strength > 0
      ? `<div style="margin:8px 0 6px;padding:10px 12px;border-radius:8px;background:rgba(30,58,138,.35);border:1px solid #3b82f6;color:#93c5fd;font-size:13px;font-weight:700;text-align:center">Unit sanctioned strength: ${esc(String(strength))} posts — PVC &amp; MC capped at this strength</div>`
      : ''
  const accuracy = d.accuracyNote
    ? `<div style="font-size:11px;color:#94a3b8;text-align:center;margin:6px 0 10px;line-height:1.45">${esc(d.accuracyNote)}</div>`
    : ''
  return (
    strengthLine +
    clientPerfComplianceBannersHtml(d) +
    accuracy +
    `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 10px"><tr>` +
    kpiTile('#1d4ed8,#3b82f6', formatInrFromLacs(d.monthlyBillLacs), 'Monthly bill') +
    kpiTile('#b45309,#f59e0b', formatInrFromLacs(d.collectedLacs), 'Collected') +
    kpiTile('#7c3aed,#a855f7', formatInrFromLacs(d.balanceToPayLacs), 'Balance to be paid') +
    `</tr></table>`
  )
}

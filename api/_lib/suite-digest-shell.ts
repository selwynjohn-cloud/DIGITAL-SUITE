/**
 * Shared colourful HTML shell + recipients for Director digests
 * (client / sales-ready presentation).
 * Every mail uses the regular Agile header + footer.
 */

import { SUITE_APP_FOOTER_LINE, suiteAppFooterPlainText, suiteAppOpenPageFooterInlineHtml } from './suite-app-footer.js'
import { suiteDirectorEmail } from './suite-mail.js'

export const LOKESH_CC_EMAIL = ''

export const SUITE_BRAND = {
  company: 'Agile Security Force Private Limited',
  shortName: 'Agile Security Force Pvt. Ltd.',
  /** Transparent PNG — no white plate behind the mark in mails / WhatsApp cards. */
  logoUrl: 'https://www.agilegroup-digital.co.in/agile-logo-clear.png',
  corporateSite: 'https://www.agilegroup.co.in',
  corporateSiteLabel: 'www.agilegroup.co.in',
  /** Staff-only portal — never put in client / guard / sales WhatsApp or public footers. */
  digitalSite: 'https://www.agilegroup-digital.co.in',
  digitalSiteLabel: 'www.agilegroup-digital.co.in',
  jobsSite: 'https://www.securityjob.co.in',
  jobsSiteLabel: 'www.securityjob.co.in',
  helpline: '18005995599',
  centralControl: '+91 9248707070',
  /** Display with space (Selwyn): 85009 15599 */
  helpDesk: '+91 85009 15599',
  /** 10-digit for WhatsApp / SMS APIs */
  helpDeskMobile10: '8500915599',
  controlEmail: 'control@agilegroup.co.in',
  commandCentre: 'Digital Operations Command Centre',
  cursorLine1: SUITE_APP_FOOTER_LINE,
  cursorLine2: '',
}

/** Important numbers block for emails (client / guard / sales safe). */
export function suiteImportantNumbersHtml(): string {
  return `<div style="margin:14px 0;padding:14px 16px;border-radius:12px;background:linear-gradient(135deg,#eff6ff,#f0fdf4);border:1px solid #bfdbfe">
      <div style="font-weight:900;color:#14224f;margin-bottom:8px;font-size:13px">Important numbers</div>
      <div style="font-size:13px;line-height:1.7;color:#1e293b">
        <div>Central Control Centre: <b>${escHtml(SUITE_BRAND.centralControl)}</b></div>
        <div>Control email: <b>${escHtml(SUITE_BRAND.controlEmail)}</b></div>
        <div>Toll Free: <b>${escHtml(SUITE_BRAND.helpline)}</b></div>
        <div>Help Desk: <b>${escHtml(SUITE_BRAND.helpDesk)}</b></div>
      </div>
    </div>`
}

/** Important numbers for WhatsApp / plain text. */
export function suiteImportantNumbersText(): string {
  return [
    'Important numbers',
    `• Central Control Centre: ${SUITE_BRAND.centralControl}`,
    `• Control email: ${SUITE_BRAND.controlEmail}`,
    `• Toll Free: ${SUITE_BRAND.helpline}`,
    `• Help Desk: ${SUITE_BRAND.helpDesk}`,
  ].join('\n')
}

export function suiteSampleEmail(): string {
  return (
    process.env.SUITE_SAMPLE_EMAIL?.trim() ||
    process.env.ADMIN_NOTIFY_EMAIL?.trim() ||
    process.env.MIS_DIRECTOR_EMAIL?.trim() ||
    process.env.DIRECTOR_ALERT_EMAIL?.trim() ||
    suiteDirectorEmail() ||
    'director@agilegroup.co.in'
  )
    .trim()
    .toLowerCase()
}

function uniqueEmails(list: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of list) {
    const e = String(raw || '')
      .trim()
      .toLowerCase()
    if (!e.includes('@') || seen.has(e)) continue
    seen.add(e)
    out.push(e)
  }
  return out
}

/** Production digests: To Director · CC all HODs. */
export async function suiteDigestRecipients(opts?: {
  sampleOnly?: boolean
}): Promise<{ to: string; cc: string[]; sampleOnly: boolean }> {
  if (opts?.sampleOnly) {
    return { to: suiteSampleEmail(), cc: [], sampleOnly: true }
  }
  const director = suiteDirectorEmail()
  const { getAllHodEmails } = await import('./mis/digest.js')
  const { misDirectorCcEmail } = await import('./mis/branch-mail-cc.js')
  const hods = await getAllHodEmails()
  const cc = uniqueEmails([...hods, misDirectorCcEmail()].filter((e) => e !== director))
  return { to: director, cc, sampleOnly: false }
}

export function escHtml(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Inline style for Agile logo in all suite communications — no white background. */
export function suiteLogoImgStyle(extra = ''): string {
  const base =
    'display:inline-block;background:transparent!important;border:0;padding:0;border-radius:0;object-fit:contain;filter:drop-shadow(0 2px 8px rgba(0,0,0,.28))'
  return extra ? `${base};${extra}` : base
}

/** Standard logo &lt;img&gt; for emails / letters / digests. */
export function suiteLogoImgHtml(opts?: { height?: number; width?: number; extraStyle?: string }): string {
  const h = Math.max(28, Math.min(96, Number(opts?.height) || 56))
  const w = opts?.width ? Math.max(28, Math.min(120, Number(opts.width))) : 0
  const size = w
    ? `height:${h}px;width:${w}px`
    : `height:${h}px;width:auto;max-width:${Math.round(h * 1.35)}px`
  return `<img src="${SUITE_BRAND.logoUrl}" alt="Agile" height="${h}"${w ? ` width="${w}"` : ''} style="${suiteLogoImgStyle(`${size};margin-bottom:10px;${opts?.extraStyle || ''}`)}">`
}

/** Standalone HTML document for in-app letter previews (isolates from dark portal CSS). */
export function suiteHtmlPreviewDocument(bodyHtml: string, title = 'Preview'): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escHtml(title)}</title><style>html{color-scheme:light!important}html,body{margin:0!important;background:#f1f5f9!important;color:#0f172a!important;font-family:Arial,Helvetica,sans-serif}p,td,th,li{color:#0f172a!important}table{color:#0f172a!important}</style></head><body style="margin:0;padding:16px;background:#f1f5f9;color:#0f172a;color-scheme:light">${bodyHtml || '<p style="color:#64748b">No preview content.</p>'}</body></html>`
}

/** Regular email header — logo + full company name + app title. */
export function suiteRegularHeaderHtml(opts: {
  appName: string
  title: string
  subtitle: string
  accentFrom?: string
  accentTo?: string
}): string {
  const from = opts.accentFrom || '#14224f'
  const to = opts.accentTo || '#0ea5e9'
  return `<div style="background:linear-gradient(135deg,${from} 0%,${to} 100%);padding:0;text-align:center;color:#fff">
      <div style="height:5px;background:linear-gradient(90deg,#c9a84c,#fbbf24,#c9a84c)"></div>
      <div style="padding:22px 18px 20px">
        ${suiteLogoImgHtml({ height: 56 })}
        <div style="font-size:15px;font-weight:800;color:#fff;letter-spacing:.02em;margin-top:4px">${escHtml(SUITE_BRAND.company)}</div>
        <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#e0f2fe;font-weight:700;margin-top:8px">${escHtml(opts.appName)}</div>
        <div style="font-size:22px;font-weight:900;margin-top:8px;line-height:1.25">${escHtml(opts.title)}</div>
        <div style="font-size:14px;color:#bae6fd;margin-top:6px">${opts.subtitle}</div>
      </div>
    </div>`
}

/**
 * Regular email footer (exact company standard):
 * Agile Security Force Private Limited, Digital Operations Command Centre, www.agilegroup.co.in
 * — designed and built with Cursor.ai...
 */
export function suiteRegularFooterHtml(_footerNote?: string): string {
  return suiteAppOpenPageFooterInlineHtml()
}

/** Plain-text header for WhatsApp / SMS. */
export function suiteWhatsAppHeader(appOrTitle: string): string {
  return [
    SUITE_BRAND.company,
    appOrTitle,
    '────────────────',
  ].join('\n')
}

/** Plain-text footer for WhatsApp / SMS — same company standard as email. */
export function suiteWhatsAppFooter(): string {
  return ['────────────────', suiteAppFooterPlainText()].join('\n')
}

/** Wrap WhatsApp body with regular header + important numbers + standard footer. */
export function suiteWhatsAppWrap(appOrTitle: string, bodyLines: string[]): string {
  return [
    suiteWhatsAppHeader(appOrTitle),
    '',
    ...bodyLines,
    '',
    suiteImportantNumbersText(),
    '',
    suiteWhatsAppFooter(),
  ].join('\n')
}

/** Colourful gradient email shell with regular Agile header + footer. */
export function suiteColourEmailShell(opts: {
  appName: string
  title: string
  subtitle: string
  accentFrom?: string
  accentTo?: string
  bodyHtml: string
  footerNote?: string
}): string {
  return `<div style="font-family:'Segoe UI',Arial,Helvetica,sans-serif;max-width:840px;margin:0 auto;background:#f1f5f9;padding:18px;color:#0f172a;color-scheme:light">
  <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,.12);color:#0f172a">
    ${suiteRegularHeaderHtml(opts)}
    <div style="padding:22px 20px;color:#0f172a;font-size:14px;line-height:1.55;background:#ffffff">
      ${opts.bodyHtml}
      ${suiteImportantNumbersHtml()}
    </div>
    ${suiteRegularFooterHtml(opts.footerNote)}
  </div>
</div>`
}

export function suiteStatRow(
  items: { label: string; value: string | number; color?: string; bg?: string }[],
): string {
  const cells = items
    .map(
      (it) => `<div style="flex:1;min-width:110px;padding:14px 10px;text-align:center;background:${it.bg || '#f8fafc'};border-radius:12px;border:1px solid #e2e8f0">
      <div style="font-size:26px;font-weight:900;color:${it.color || '#14224f'}">${escHtml(it.value)}</div>
      <div style="font-size:11px;color:#64748b;margin-top:4px;font-weight:700;text-transform:uppercase;letter-spacing:.04em">${escHtml(it.label)}</div>
    </div>`,
    )
    .join('')
  return `<div style="display:flex;flex-wrap:wrap;gap:10px;margin:14px 0 18px">${cells}</div>`
}

export function suiteTable(headers: string[], rowsHtml: string, emptyCols = 4): string {
  const th = headers
    .map(
      (h) =>
        `<th style="padding:10px 8px;text-align:left;font-size:11px;letter-spacing:.04em;text-transform:uppercase">${escHtml(h)}</th>`,
    )
    .join('')
  return `<table style="width:100%;border-collapse:collapse;font-size:13px;margin:8px 0 16px;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
    <thead><tr style="background:linear-gradient(135deg,#14224f,#1e3a8a);color:#fff">${th}</tr></thead>
    <tbody>${rowsHtml || `<tr><td colspan="${emptyCols}" style="padding:14px;color:#64748b">No rows.</td></tr>`}</tbody>
  </table>`
}

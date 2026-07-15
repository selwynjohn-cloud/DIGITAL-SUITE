/**
 * Agile MIS — shared branding, footer, and Cursor attribution (all shared reports).
 */

export const MIS_BRAND = {
  company: 'Agile Security Force Private Limited',
  shortName: 'Agile Security Force Pvt. Ltd.',
  site: 'https://www.agilegroup-digital.co.in',
  siteLabel: 'www.agilegroup-digital.co.in',
  /** Corporate website — shown on report footers. */
  corporateSite: 'https://www.agilegroup.co.in',
  corporateSiteLabel: 'www.agilegroup.co.in',
  logoUrl: 'https://www.agilegroup-digital.co.in/agile-logo.png',
}

/** Standard footer on every MIS email, WhatsApp share, and printed report. */
export const MIS_CURSOR_ATTRIBUTION =
  'Agile MIS — Daily Deployment, Compliance & Command Centre — designed and built with Cursor.ai, San Francisco, California, USA, in partnership with Agile Group leadership.'

/** MIS branch submit acknowledgment — header date and footer (Director response email). */
export const MIS_ACK_CURSOR_ATTRIBUTION =
  '— designed and built with Cursor.ai, San Francisco, California, USA, in partnership with Agile Group leadership.'

export function misAckDateDisplay(dateFor: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateFor ?? '').trim())
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return String(dateFor ?? '')
}

/** Gold divider between dashboard rows in acknowledgment emails. */
export function misAckRowDivider(): string {
  return `<div style="margin:12px 0 14px;border-top:2px solid #c9a84c;opacity:.75"></div>`
}

/** Footer for MIS branch submit acknowledgment emails. */
export function misAckFooterHtml(): string {
  return `<div style="margin-top:24px;padding:20px 16px;background:#f8fafc;border-top:3px solid #c9a84c;text-align:center">
    <div style="font-size:13px;font-weight:700;color:#14224f;line-height:1.5">${esc(MIS_BRAND.company)}, Digital Operations Command Centre</div>
    <div style="margin-top:8px;font-size:12px"><a href="${MIS_BRAND.corporateSite}" style="color:#1d4ed8;text-decoration:none">${esc(MIS_BRAND.corporateSiteLabel)}</a></div>
    <div style="margin-top:10px;font-size:11px;color:#64748b;line-height:1.55;font-style:italic">— designed and built with Cursor.ai, San Francisco, California, USA,</div>
    <div style="margin-top:4px;font-size:11px;color:#64748b;line-height:1.55;font-style:italic">in partnership with Agile Group leadership.</div>
  </div>`
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Standard centred footer lines — screen, email, print, WhatsApp. */
function misStandardFooterLinesHtml(opts: {
  companyColor: string
  siteColor: string
  attributionColor: string
  attributionBg?: string
}): string {
  const attrWrap = opts.attributionBg
    ? `<div style="margin-top:12px;padding:10px;background:${opts.attributionBg};border-radius:8px;font-size:11px;color:${opts.attributionColor};line-height:1.55;font-style:italic;text-align:center">${esc(MIS_CURSOR_ATTRIBUTION)}</div>`
    : `<div style="margin-top:10px;font-size:11px;color:${opts.attributionColor};line-height:1.55;font-style:italic;text-align:center">${esc(MIS_CURSOR_ATTRIBUTION)}</div>`
  return (
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse">` +
    `<tr><td align="center" style="text-align:center">` +
    `<div style="font-size:13px;font-weight:700;color:${opts.companyColor};line-height:1.5;text-align:center">${esc(MIS_BRAND.company)}</div>` +
    `<div style="margin-top:8px;font-size:13px;text-align:center"><a href="${MIS_BRAND.corporateSite}" style="color:${opts.siteColor};text-decoration:none;font-weight:700">${esc(MIS_BRAND.corporateSiteLabel)}</a></div>` +
    attrWrap +
    `</td></tr></table>`
  )
}

/** HTML block for emails and shared report pages. */
export function misFooterHtml(extraLine = ''): string {
  return `<div style="margin-top:20px;padding:16px 14px;background:linear-gradient(135deg,#14224f,#1e3a8a);border-radius:10px;border-top:3px solid #c9a84c;text-align:center;width:100%">
    ${extraLine ? `<div style="margin-bottom:10px;font-size:11px;color:#94a3b8;text-align:center">${extraLine}</div>` : ''}
    ${misStandardFooterLinesHtml({ companyColor: '#fff', siteColor: '#c9a84c', attributionColor: '#dbeafe', attributionBg: 'rgba(255,255,255,.08)' })}
  </div>`
}

/** Plain text for WhatsApp / clipboard shares. */
export function misFooterText(): string {
  return (
    `\n\n${MIS_BRAND.company}\n` +
    `${MIS_BRAND.corporateSiteLabel}\n` +
    `${MIS_CURSOR_ATTRIBUTION}`
  )
}

/** Colourful MIS reminder header — logo + full company name. */
export function misReminderHeaderHtml(title: string, subtitle: string, accent = '#c9a84c'): string {
  return `<div style="background:linear-gradient(135deg,#14224f 0%,#1e3a8a 58%,#0f172a 100%);padding:22px 24px 18px;border-radius:12px 12px 0 0;border-bottom:4px solid ${accent}">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr>
        <td width="72" style="vertical-align:middle;padding-right:14px">
          <img src="${MIS_BRAND.logoUrl}" alt="Agile" width="64" height="64" style="display:block;border-radius:10px;background:#fff;padding:4px" />
        </td>
        <td style="vertical-align:middle">
          <div style="font-size:17px;font-weight:800;color:#ffffff;line-height:1.35;letter-spacing:.2px">${esc(MIS_BRAND.company)}</div>
          <div style="font-size:12px;color:#cbd5e1;margin-top:4px">Digital Operations Command Centre · MIS</div>
        </td>
      </tr>
    </table>
    <div style="margin-top:16px;padding:12px 14px;background:rgba(255,255,255,.1);border-radius:8px;border-left:4px solid ${accent}">
      <div style="font-size:16px;font-weight:800;color:${accent};line-height:1.3">${esc(title)}</div>
      <div style="font-size:12px;color:#e2e8f0;margin-top:4px;line-height:1.45">${esc(subtitle)}</div>
    </div>
  </div>`
}

/** Reminder email footer — company + corporate site + Cursor line. */
export function misReminderFooterHtml(): string {
  return `<div style="margin-top:24px;padding:20px 16px;background:#f8fafc;border-top:3px solid #c9a84c;text-align:center">
    <div style="font-size:13px;font-weight:700;color:#14224f;line-height:1.5">${esc(MIS_BRAND.company)}</div>
    <div style="margin-top:6px;font-size:12px;color:#475569">Digital Operations Command Centre</div>
    <div style="margin-top:10px;font-size:13px"><a href="${MIS_BRAND.corporateSite}" style="color:#1d4ed8;text-decoration:none;font-weight:700">${esc(MIS_BRAND.corporateSiteLabel)}</a></div>
    <div style="margin-top:12px;font-size:11px;color:#64748b;line-height:1.55;font-style:italic">— designed and built with Cursor.ai, San Francisco, California, USA,</div>
    <div style="margin-top:4px;font-size:11px;color:#64748b;line-height:1.55;font-style:italic">in partnership with Agile Group leadership.</div>
  </div>`
}

/** Wrap reminder body with branded header + footer. */
export function misReminderMailWrap(title: string, subtitle: string, inner: string, accent = '#c9a84c'): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9">
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;color:#1e293b">
  ${misReminderHeaderHtml(title, subtitle, accent)}
  <div style="padding:24px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">${inner}${misReminderFooterHtml()}</div>
</div>
</body></html>`
}

/** Compact footer for print-friendly MIS pages. */
export function misPrintFooterBlock(): string {
  return `<div class="mis-report-footer" style="margin-top:24px;padding:16px;border:1px solid #334155;border-radius:10px;background:#0e1730;text-align:center;width:100%;font-size:12px;color:#94a3b8;line-height:1.6">
    ${misStandardFooterLinesHtml({ companyColor: '#fde68a', siteColor: '#c9a84c', attributionColor: '#64748b' })}
  </div>`
}

/** Light print footer for formal client letters. */
export function misLetterPrintFooter(): string {
  return `<div class="mis-report-footer" style="margin-top:28px;padding:16px 14px;border-top:2px solid #c9a84c;text-align:center;width:100%;font-size:12px;color:#475569;line-height:1.55">
    ${misStandardFooterLinesHtml({ companyColor: '#14224f', siteColor: '#1d4ed8', attributionColor: '#64748b' })}
  </div>`
}

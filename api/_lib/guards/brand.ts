export const GUARDS_BRAND = {
  company: 'Agile Security Force Private Limited',
  site: 'https://www.agilegroup.co.in',
  siteLabel: 'www.agilegroup.co.in',
  logoUrl: 'https://www.agilegroup-digital.co.in/agile-logo.png',
  portalSite: 'https://www.agilegroup-digital.co.in',
  careLine: 'Agile Internal Customer Care Department · Response time 24 hours',
  deptLine: 'Agile Group Internal Customer Care Department',
}

export const GUARDS_CURSOR_FOOTER =
  'The Internal Customer Care & Feedback Automated systems are designed and built with Cursor.ai, San Francisco, California, USA, in partnership with Agile Group leadership, India.'

export const GUARDS_NAVY_HDR = 'linear-gradient(135deg,#14224f,#1e3a8a)'

function esc(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function guardsDocFooter(): string {
  return `<div class="doc-ft">
    <div class="care">${esc(GUARDS_BRAND.careLine)}</div>
    <div class="dept">${esc(GUARDS_BRAND.deptLine)} · <a href="${GUARDS_BRAND.site}">${esc(GUARDS_BRAND.siteLabel)}</a></div>
    <div class="cursor">${esc(GUARDS_CURSOR_FOOTER)}</div>
  </div>`
}

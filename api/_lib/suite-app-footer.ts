/**
 * Standard colourful footer banner — every Agile Digital page & communication
 * (internal and external).
 */

export const SUITE_APP_FOOTER_LINE =
  'Agile Digital Operations Command Centre — designed and built with Cursor.ai, San Francisco, California, USA, in partnership with Agile Group leadership.'

export const SUITE_APP_FOOTER_DIGITAL_URL = 'https://www.agilegroup-digital.co.in'
export const SUITE_APP_FOOTER_DIGITAL_LABEL = 'www.agilegroup-digital.co.in'
export const SUITE_APP_FOOTER_CURSOR_URL = 'https://cursor.ai'
export const SUITE_APP_FOOTER_CURSOR_LABEL = 'cursor.ai'

/** Plain text for WhatsApp / SMS / clipboard. */
export function suiteAppFooterPlainText(): string {
  return `${SUITE_APP_FOOTER_LINE}\n${SUITE_APP_FOOTER_DIGITAL_LABEL} · ${SUITE_APP_FOOTER_CURSOR_LABEL}`
}

function esc(s: string): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** CSS for dark suite portals (MIS, Training, CRM shells). */
export const SUITE_APP_FOOTER_CSS = `
.suite-app-footer{
  margin:24px 0 10px;padding:0;text-align:center;overflow:hidden;
  border-radius:14px;border:1px solid rgba(253,230,138,.35);
  background:
    linear-gradient(135deg,#14224f 0%,#1e3a8a 38%,#0f766e 78%,#a16207 100%);
  box-shadow:0 12px 32px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.12);
}
.suite-app-footer .suite-app-footer-inner{padding:18px 16px 16px}
.suite-app-footer .suite-app-footer-bar{
  height:4px;background:linear-gradient(90deg,#fde68a,#c9a84c,#38bdf8,#a78bfa,#fde68a);
}
.suite-app-footer p.suite-app-footer-line{
  margin:0 auto;max-width:860px;font-size:12px;line-height:1.55;font-style:italic;font-weight:700;
  color:#f8fafc;text-shadow:0 1px 8px rgba(0,0,0,.35);
}
.suite-app-footer .suite-app-footer-links{
  margin-top:12px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center;
}
.suite-app-footer .suite-app-footer-links a{
  display:inline-flex;align-items:center;justify-content:center;
  padding:7px 14px;border-radius:999px;font-size:12px;font-weight:800;font-style:normal;
  text-decoration:none;letter-spacing:.02em;
  color:#14224f;background:linear-gradient(135deg,#fde68a,#c9a84c);
  border:1px solid rgba(255,255,255,.35);
  box-shadow:0 4px 12px rgba(0,0,0,.25);
}
.suite-app-footer .suite-app-footer-links a.cursor-link{
  color:#fff;background:linear-gradient(135deg,#0ea5e9,#2563eb);
}
`.trim()

function footerLinksHtml(linkStyleDigital: string, linkStyleCursor: string): string {
  return `<div class="suite-app-footer-links" style="margin-top:12px;text-align:center">
  <a href="${SUITE_APP_FOOTER_DIGITAL_URL}" target="_blank" rel="noopener noreferrer" style="${linkStyleDigital}">${esc(SUITE_APP_FOOTER_DIGITAL_LABEL)}</a>
  <a href="${SUITE_APP_FOOTER_CURSOR_URL}" target="_blank" rel="noopener noreferrer" class="cursor-link" style="${linkStyleCursor}">${esc(SUITE_APP_FOOTER_CURSOR_LABEL)}</a>
</div>`
}

/** HTML block — use on every application open page. */
export function suiteAppOpenPageFooterHtml(): string {
  return `<footer class="suite-app-footer" role="contentinfo">
  <div class="suite-app-footer-bar"></div>
  <div class="suite-app-footer-inner">
    <p class="suite-app-footer-line">${esc(SUITE_APP_FOOTER_LINE)}</p>
    <div class="suite-app-footer-links">
      <a href="${SUITE_APP_FOOTER_DIGITAL_URL}" target="_blank" rel="noopener noreferrer">${esc(SUITE_APP_FOOTER_DIGITAL_LABEL)}</a>
      <a href="${SUITE_APP_FOOTER_CURSOR_URL}" target="_blank" rel="noopener noreferrer" class="cursor-link">${esc(SUITE_APP_FOOTER_CURSOR_LABEL)}</a>
    </div>
  </div>
</footer>`
}

/** Inline style variant (emails / isolated pages without shared CSS). */
export function suiteAppOpenPageFooterInlineHtml(): string {
  const digitalBtn =
    'display:inline-block;margin:4px 6px;padding:8px 14px;border-radius:999px;font-size:12px;font-weight:800;text-decoration:none;color:#14224f;background:linear-gradient(135deg,#fde68a,#c9a84c);border:1px solid rgba(255,255,255,.35)'
  const cursorBtn =
    'display:inline-block;margin:4px 6px;padding:8px 14px;border-radius:999px;font-size:12px;font-weight:800;text-decoration:none;color:#ffffff;background:linear-gradient(135deg,#0ea5e9,#2563eb);border:1px solid rgba(255,255,255,.35)'
  return `<div style="margin-top:20px;padding:0;text-align:center;border-radius:14px;overflow:hidden;width:100%;border:1px solid rgba(253,230,138,.35);background:linear-gradient(135deg,#14224f 0%,#1e3a8a 38%,#0f766e 78%,#a16207 100%);box-shadow:0 12px 32px rgba(0,0,0,.25)">
  <div style="height:4px;background:linear-gradient(90deg,#fde68a,#c9a84c,#38bdf8,#a78bfa,#fde68a)"></div>
  <div style="padding:18px 16px 16px">
    <div style="font-size:12px;line-height:1.55;font-style:italic;font-weight:700;color:#f8fafc;max-width:860px;margin:0 auto">${esc(SUITE_APP_FOOTER_LINE)}</div>
    ${footerLinksHtml(digitalBtn, cursorBtn)}
  </div>
</div>`
}

/** Agile Fleet — shared brand, report header/footer, and email shell. */

export const FLEET_BRAND = {
  company: 'Agile Security Force Private Limited',
  product: 'Agile Fleet',
  tagline: 'Moving Forward',
  logoUrl: 'https://www.agilegroup-digital.co.in/agile-logo.png',
  site: 'https://www.agilegroup-digital.co.in',
  siteLabel: 'www.agilegroup-digital.co.in',
  /** Standard footer link shown on all reports and pages */
  footerSite: 'https://www.agilegroup.co.in',
  footerSiteLabel: 'www.agilegroup.co.in',
  footerCredit: 'Created by Cursor.AI',
}

export const FLEET_SKY = '#0ea5e9'
export const FLEET_SKY_LIGHT = '#38bdf8'
export const FLEET_SKY_DARK = '#0369a1'
export const FLEET_HDR_GRADIENT = 'linear-gradient(135deg,#0369a1 0%,#0ea5e9 55%,#38bdf8 100%)'
export const FLEET_GOLD = '#c9a84c'

function esc(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Dark-portal report chrome (Staff / Management in-app). */
export const FLEET_REPORT_CSS = `
.rpt-sheet{background:#0b1220;border:1px solid #22304f;border-radius:16px;overflow:hidden;margin-bottom:18px;box-shadow:0 8px 32px rgba(0,0,0,.35)}
.rpt-hdr{text-align:center;padding:22px 18px 18px;background:${FLEET_HDR_GRADIENT};position:relative}
.rpt-gold-bar{height:4px;background:linear-gradient(90deg,${FLEET_GOLD},#fbbf24,${FLEET_GOLD});margin:-22px -18px 16px}
.rpt-hdr img{height:58px;filter:drop-shadow(0 2px 8px rgba(0,0,0,.3))}
.rpt-co{font-size:11px;color:#bae6fd;letter-spacing:.12em;text-transform:uppercase;margin-top:10px;font-weight:700}
.rpt-title{color:#fff;font-size:20px;font-weight:900;margin-top:6px;text-shadow:0 1px 2px rgba(0,0,0,.2)}
.rpt-sub{color:#e0f2fe;font-size:13px;margin-top:6px;opacity:.95}
.rpt-badge{display:inline-block;margin-top:10px;padding:5px 14px;border-radius:20px;background:rgba(201,168,76,.25);border:1px solid ${FLEET_GOLD};color:#fde68a;font-size:11px;font-weight:800;letter-spacing:.06em}
.rpt-body{padding:16px 18px 8px}
.rpt-sec{display:flex;align-items:center;gap:10px;margin:16px 0 10px;font-size:11px;font-weight:800;color:#7dd3fc;text-transform:uppercase;letter-spacing:.1em}
.rpt-sec::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,${FLEET_SKY},transparent)}
.rpt-sec span{background:#0b1220;padding-right:8px}
.rpt-meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;margin-bottom:4px}
.rpt-meta .fld{background:#111a30;border:1px solid #22304f;border-radius:10px;padding:10px 12px}
.rpt-meta .fld label{font-size:10px;color:#64748b;margin:0 0 4px;text-transform:uppercase;letter-spacing:.05em}
.rpt-meta .fld input,.rpt-meta .fld select{background:transparent;border:none;padding:0;font-size:14px;color:#e2e8f0;font-weight:600}
.rpt-note{font-size:12px;color:#94a3b8;line-height:1.55;margin:8px 0 12px;padding:10px 12px;background:#111a30;border-left:3px solid ${FLEET_SKY};border-radius:0 8px 8px 0}
.rpt-decl{font-size:12px;color:#94a3b8;margin:14px 0;padding:12px 14px;border:1px dashed #334155;border-radius:10px;background:#0e1730}
.rpt-ftr{text-align:center;padding:16px 18px;background:#0e1730;border-top:1px solid #22304f}
.rpt-ftr .rpt-gold-bar{margin:-16px -18px 12px;height:2px}
.rpt-ftr p{font-size:12px;color:#94a3b8;margin:4px 0}
.rpt-ftr .rpt-copy{font-size:10px;color:#64748b;margin-top:8px}
.veh-cards-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px;margin-bottom:8px}
.veh-card{background:linear-gradient(145deg,#111a30,#0e1730);border:1px solid ${FLEET_SKY};border-radius:14px;padding:16px;position:relative;overflow:hidden}
.veh-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${FLEET_GOLD},${FLEET_SKY})}
.veh-card-hdr{display:flex;align-items:center;gap:12px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #22304f}
.veh-num{background:${FLEET_SKY};color:#fff;font-size:10px;font-weight:800;padding:4px 10px;border-radius:20px;white-space:nowrap}
.veh-ro{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;font-size:11px}
.veh-ro span{color:#64748b;display:block;margin-bottom:2px}
.veh-ro b{color:#7dd3fc;font-weight:700}
.veh-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}
.veh-card-grid label{font-size:10px;margin:0 0 3px}
.veh-card-grid input,.veh-card-grid select{font-size:13px;padding:8px 10px}
.wr-tbl-wrap{border-radius:10px;overflow:hidden;border:1px solid ${FLEET_SKY}}
.wr-tbl th{background:linear-gradient(180deg,${FLEET_SKY_DARK},#0b1220);color:#bae6fd;font-size:10px;padding:8px 6px}
.wr-tbl td{background:#111a30}
.wr-tbl tr:nth-child(even) td{background:#0e1730}
.wr-count{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;background:rgba(14,165,233,.2);border:1px solid ${FLEET_SKY};color:#7dd3fc;font-size:12px;font-weight:700;margin-bottom:10px}
.wr-doc-frame{border:3px solid ${FLEET_GOLD};border-radius:6px;padding:4px;margin:14px 0;background:linear-gradient(135deg,rgba(201,168,76,.08),rgba(14,165,233,.06))}
.wr-doc-inner{border:2px solid ${FLEET_SKY};border-radius:4px;padding:16px;background:linear-gradient(180deg,#0e1730 0%,#0b1220 100%)}
.wr-section-box{border:1px solid #334155;border-top:3px solid ${FLEET_GOLD};border-radius:10px;padding:14px;margin-bottom:14px;background:#111a30;box-shadow:inset 0 0 0 1px rgba(14,165,233,.15)}
.wr-section-title{font-size:11px;font-weight:900;color:${FLEET_GOLD};text-transform:uppercase;letter-spacing:.12em;margin:-14px -14px 14px;padding:9px 12px;background:linear-gradient(90deg,rgba(201,168,76,.18),rgba(14,165,233,.08));border-bottom:1px solid #334155}
.cond-good{color:#4ade80;font-weight:700}.cond-fair{color:#f59e0b;font-weight:700}.cond-bad{color:#ef4444;font-weight:700}
.pen-amt{color:#f59e0b;font-weight:700}
@media print{.side,.bar,.burger,.savebar,.btn,.burger,.logout{display:none!important}.main{margin-left:0!important}.rpt-sheet{box-shadow:none;border:1px solid #ccc}.wr-doc-frame{border:2px solid #333}}
`

export function fleetReportHeader(title: string, subtitle?: string, badge?: string): string {
  return `<div class="rpt-sheet"><div class="rpt-hdr"><div class="rpt-gold-bar"></div>
    <img src="${FLEET_BRAND.logoUrl}" alt="Agile">
    <div class="rpt-co">${esc(FLEET_BRAND.company)}</div>
    <h2 class="rpt-title">${esc(title)}</h2>
    ${subtitle ? `<p class="rpt-sub">${subtitle}</p>` : ''}
    ${badge ? `<div class="rpt-badge">${esc(badge)}</div>` : ''}
  </div>`
}

export function fleetFooterBlock(): string {
  return `<div class="rpt-ftr"><div class="rpt-gold-bar"></div>
    <p><b>${esc(FLEET_BRAND.product)}</b> — Vehicle Management System</p>
    <p><a href="${FLEET_BRAND.footerSite}" style="color:#7dd3fc;text-decoration:none">${esc(FLEET_BRAND.footerSiteLabel)}</a> ${esc(FLEET_BRAND.footerCredit)}</p>
    <p class="rpt-copy">© ${esc(FLEET_BRAND.company)} · Confidential</p>
  </div>`
}

export function fleetReportFooter(): string {
  return `${fleetFooterBlock()}</div>`
}

/** Light-background pages (manual, troubleshooting). */
export function fleetPublicFooter(): string {
  return `<footer style="text-align:center;margin-top:28px;padding:20px 16px;border-top:2px solid #0ea5e9;color:#64748b;font-size:13px;line-height:1.65">
    <p style="font-weight:800;color:#0369a1;margin-bottom:6px">${esc(FLEET_BRAND.product)} — Vehicle Management System</p>
    <p><a href="${FLEET_BRAND.footerSite}" style="color:#0ea5e9;text-decoration:none">${esc(FLEET_BRAND.footerSiteLabel)}</a> ${esc(FLEET_BRAND.footerCredit)}</p>
    <p style="font-size:11px;margin-top:6px">© ${esc(FLEET_BRAND.company)} · Confidential</p>
  </footer>`
}

export function fleetReportSection(label: string): string {
  return `<div class="rpt-sec"><span>${esc(label)}</span></div>`
}

/** Email reports — light background with navy header + gold accent. */
export function fleetEmailShell(title: string, subtitle: string, bodyHtml: string): string {
  return `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:820px;margin:0 auto;color:#1e293b">
    <div style="background:linear-gradient(135deg,${FLEET_SKY_DARK},${FLEET_SKY});color:#fff;padding:0;border-radius:12px 12px 0 0;overflow:hidden">
      <div style="height:4px;background:linear-gradient(90deg,${FLEET_GOLD},#fbbf24,${FLEET_GOLD})"></div>
      <div style="padding:20px 18px;text-align:center">
        <img src="${FLEET_BRAND.logoUrl}" alt="Agile" height="52" style="margin-bottom:10px">
        <div style="font-size:10px;letter-spacing:.12em;color:#bae6fd;text-transform:uppercase">${esc(FLEET_BRAND.company)}</div>
        <div style="font-size:18px;font-weight:900;margin-top:6px">${esc(title)}</div>
        <div style="font-size:13px;color:#e0f2fe;margin-top:4px">${subtitle}</div>
      </div>
    </div>
    <div style="padding:18px;background:#fff;border:1px solid #e2e8f0;border-top:none">${bodyHtml}</div>
    <div style="text-align:center;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;font-size:11px;color:#64748b;line-height:1.65">
      <div style="height:2px;background:linear-gradient(90deg,${FLEET_GOLD},${FLEET_SKY});margin:-14px -1px 10px"></div>
      <p style="margin:4px 0;font-weight:800;color:#0369a1">${esc(FLEET_BRAND.product)} — Vehicle Management System</p>
      <p style="margin:4px 0"><a href="${FLEET_BRAND.footerSite}" style="color:#0ea5e9;text-decoration:none">${esc(FLEET_BRAND.footerSiteLabel)}</a> ${esc(FLEET_BRAND.footerCredit)}</p>
      <p style="margin:4px 0">© ${esc(FLEET_BRAND.company)} · Confidential</p>
    </div>
  </div>`
}

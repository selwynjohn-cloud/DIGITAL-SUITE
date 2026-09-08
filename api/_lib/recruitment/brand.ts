/** Agile Recruitment — shared brand & report chrome (sky blue + purple accent). */

export const RECRUIT_BRAND = {
  company: 'Agile Security Force Private Limited',
  product: 'Agile Recruitment',
  tagline: 'Building Teams That Win',
  logoUrl: 'https://www.agilegroup-digital.co.in/agile-logo.png',
  publicFormUrl: 'https://www.securityjob.co.in',
  securityJobUrl: 'https://www.securityjob.co.in',
  helpline: '18005995599',
  footerSite: 'https://www.agilegroup.co.in',
  footerSiteLabel: 'www.agilegroup.co.in',
  footerCredit: 'Created by Cursor.AI',
}

export const RECRUIT_SKY = '#0ea5e9'
export const RECRUIT_SKY_DARK = '#0369a1'
export const RECRUIT_PURPLE = '#7c3aed'
export const RECRUIT_GOLD = '#c9a84c'
export const RECRUIT_HDR_GRADIENT = 'linear-gradient(135deg,#4c1d95 0%,#7c3aed 45%,#0ea5e9 100%)'

function esc(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export const RECRUIT_REPORT_CSS = `
.rpt-sheet{background:#0b1220;border:1px solid #22304f;border-radius:16px;overflow:hidden;margin-bottom:18px;box-shadow:0 8px 32px rgba(0,0,0,.35)}
.rpt-hdr{text-align:center;padding:22px 18px 18px;background:${RECRUIT_HDR_GRADIENT};position:relative}
.rpt-gold-bar{height:4px;background:linear-gradient(90deg,${RECRUIT_GOLD},#fbbf24,${RECRUIT_GOLD});margin:-22px -18px 16px}
.rpt-hdr img{height:58px;filter:drop-shadow(0 2px 8px rgba(0,0,0,.3))}
.rpt-co{font-size:11px;color:#ddd6fe;letter-spacing:.12em;text-transform:uppercase;margin-top:10px;font-weight:700}
.rpt-title{color:#fff;font-size:20px;font-weight:900;margin-top:6px}
.rpt-sub{color:#e0f2fe;font-size:13px;margin-top:6px}
.rpt-badge{display:inline-block;margin-top:10px;padding:5px 14px;border-radius:20px;background:rgba(124,58,237,.35);border:1px solid ${RECRUIT_GOLD};color:#fde68a;font-size:11px;font-weight:800}
.rpt-body{padding:16px 18px 8px}
.rpt-sec{display:flex;align-items:center;gap:10px;margin:16px 0 10px;font-size:11px;font-weight:800;color:#a78bfa;text-transform:uppercase;letter-spacing:.1em}
.rpt-sec::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,${RECRUIT_PURPLE},transparent)}
.rpt-sec span{background:#0b1220;padding-right:8px}
.rpt-meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;margin-bottom:4px}
.rpt-meta .fld{background:#111a30;border:1px solid #22304f;border-radius:10px;padding:10px 12px}
.rpt-meta .fld label{font-size:10px;color:#64748b;margin:0 0 4px;text-transform:uppercase}
.rpt-meta .fld input,.rpt-meta .fld select{background:transparent;border:none;padding:0;font-size:14px;color:#e2e8f0;font-weight:600;width:100%}
.rpt-note{font-size:12px;color:#94a3b8;line-height:1.55;margin:8px 0 12px;padding:10px 12px;background:#111a30;border-left:3px solid ${RECRUIT_PURPLE};border-radius:0 8px 8px 0}
.rpt-ftr{text-align:center;padding:16px 18px;background:#0e1730;border-top:1px solid #22304f}
.rpt-ftr .rpt-gold-bar{margin:-16px -18px 12px;height:2px}
.rpt-ftr p{font-size:12px;color:#94a3b8;margin:4px 0}
.rpt-ftr .rpt-copy{font-size:10px;color:#64748b;margin-top:8px}
.shortage-banner{padding:14px 16px;border-radius:12px;margin-bottom:14px;font-size:14px;font-weight:700;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.shortage-banner.critical{background:linear-gradient(135deg,#7f1d1d,#dc2626);border:1px solid #ef4444;color:#fff}
.shortage-banner.warn{background:linear-gradient(135deg,#92400e,#d97706);border:1px solid #f59e0b;color:#fff}
.shortage-banner.ok{background:linear-gradient(135deg,#14532d,#16a34a);border:1px solid #4ade80;color:#fff}
.shortage-banner b{font-size:22px}
.funnel{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
.funnel-step{flex:1;min-width:100px;text-align:center;padding:12px 8px;border-radius:10px;background:#111a30;border:1px solid #334155}
.funnel-step b{display:block;font-size:22px;color:#a78bfa}
.funnel-step span{font-size:10px;color:#94a3b8;text-transform:uppercase}
.wr-tbl-wrap{border-radius:10px;overflow:hidden;border:1px solid ${RECRUIT_SKY}}
.wr-tbl{border-collapse:collapse;width:100%;font-size:12px;min-width:600px}
.wr-tbl th{background:linear-gradient(180deg,${RECRUIT_SKY_DARK},#0b1220);color:#bae6fd;font-size:10px;padding:8px 6px;border:1px solid #22304f}
.wr-tbl td{background:#111a30;border:1px solid #22304f;padding:6px}
.wr-tbl tr:nth-child(even) td{background:#0e1730}
.sj-process{background:#111a30;border:1px solid #0ea5e9;border-radius:12px;padding:12px 14px;margin:10px 0 12px;font-size:13px;line-height:1.55;color:#e2e8f0}
.sj-process b{color:#7dd3fc}
.sj-process ol{margin:8px 0 0 18px;padding:0}
.sj-process li{margin:4px 0}
.sj-say{background:#0e1730;border:1px dashed #64748b;border-radius:10px;padding:10px 12px;margin-top:10px;font-size:12px;color:#cbd5e1;line-height:1.5}
.sj-freeze-wrap{overflow:auto;max-height:min(72vh,680px);border-radius:10px;border:1px solid ${RECRUIT_SKY};-webkit-overflow-scrolling:touch}
.sj-freeze-wrap table{border-collapse:separate;border-spacing:0;min-width:2200px;width:max-content;font-size:12px}
.sj-date{font-size:16px;min-width:138px;max-width:160px;padding:7px 6px;border-radius:8px;background:#0b1220;color:#fff;border:1px solid #475569}
.sj-date-ro{font-size:13px;font-weight:700;color:#e2e8f0}
.sj-invite-box{position:fixed;inset:0;background:rgba(2,8,23,.72);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:18px 12px;overflow:auto}
.sj-invite-card{width:min(560px,100%);background:#0f172a;border:1px solid #334155;border-radius:14px;padding:16px;color:#e2e8f0}
.sj-invite-card select,.sj-invite-card textarea{width:100%;margin-top:6px;padding:10px;border-radius:8px;border:1px solid #475569;background:#020617;color:#e2e8f0;font-size:16px}
.sj-invite-card textarea{min-height:220px;font-size:14px;line-height:1.45}
.sj-who{display:block;font-size:9px;font-weight:700;color:#94a3b8;margin-top:3px;text-transform:none;letter-spacing:0}
.sj-saved-pop{position:fixed;inset:0;z-index:10050;background:rgba(2,8,23,.78);display:flex;align-items:center;justify-content:center;padding:20px}
.sj-saved-card{background:#14532d;border:3px solid #4ade80;border-radius:16px;padding:28px 22px;max-width:420px;width:100%;text-align:center;color:#fff;box-shadow:0 12px 40px rgba(0,0,0,.45)}
.sj-saved-card b{display:block;font-size:26px;margin-bottom:10px;color:#bbf7d0}
.sj-saved-card p{font-size:16px;line-height:1.45;margin:0 0 18px;color:#dcfce7}
.sj-freeze-wrap th,.sj-freeze-wrap td{border:1px solid #22304f;padding:8px 7px;vertical-align:top;background:#111a30}
.sj-freeze-wrap thead th{position:sticky;top:0;z-index:5;background:#0b1220;color:#bae6fd;font-size:10px;text-transform:uppercase;white-space:nowrap}
.sj-freeze-wrap .sj-sl,.sj-freeze-wrap .sj-name,.sj-freeze-wrap .sj-mob,.sj-freeze-wrap .sj-f1,.sj-freeze-wrap .sj-f2,.sj-freeze-wrap .sj-f3,.sj-freeze-wrap .sj-act{position:sticky;z-index:3}
.sj-freeze-wrap .sj-sl{left:0;min-width:48px;max-width:56px;text-align:center;font-weight:800;color:#fde68a}
.sj-freeze-wrap .sj-name{left:48px;min-width:170px;max-width:220px}
.sj-freeze-wrap .sj-mob{left:218px;min-width:132px;font-size:14px;font-weight:800;color:#fff;white-space:nowrap;box-shadow:3px 0 6px rgba(0,0,0,.28)}
.sj-freeze-wrap .sj-f1{left:0;min-width:180px;max-width:220px}
.sj-freeze-wrap .sj-f2{left:180px;min-width:108px}
@media print{
  .noprint,.side,.bar,.burger,.help-links,.logout,#recruitPortalHint,.savebar{display:none!important}
  body{background:#fff;color:#111}
  .main{margin-left:0}
  .rpt-sheet{box-shadow:none;border:1px solid #ccc}
  .wr-tbl th,.wr-tbl td{color:#111;background:#fff!important}
  .ab-act{display:none!important}
}
.sj-freeze-wrap .sj-f3{left:288px;min-width:168px;box-shadow:3px 0 6px rgba(0,0,0,.28)}
.sj-freeze-wrap .sj-act{right:0;min-width:88px;white-space:nowrap;box-shadow:-3px 0 6px rgba(0,0,0,.28)}
.sj-freeze-wrap thead .sj-sl,.sj-freeze-wrap thead .sj-name,.sj-freeze-wrap thead .sj-mob,
.sj-freeze-wrap thead .sj-f1,.sj-freeze-wrap thead .sj-f2,.sj-freeze-wrap thead .sj-f3,.sj-freeze-wrap thead .sj-act{z-index:8;background:#0b1220}
.sj-freeze-wrap tbody tr:nth-child(even) td{background:#0e1730}
.sj-freeze-wrap tbody tr.sj-overdue td{background:rgba(239,68,68,.16)}
.sj-freeze-wrap tbody tr.sj-due td{background:rgba(251,146,60,.14)}
.sj-freeze-wrap tbody tr.sj-joined td{background:rgba(34,197,94,.10)}
.sj-freeze-wrap tbody tr.sj-closed td{background:rgba(220,38,38,.08)}
.sj-next{font-size:11px;font-weight:800;color:#fde68a;line-height:1.35;max-width:168px}
.pipe-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.pipe-tab{padding:8px 14px;border-radius:8px;border:1px solid #334155;background:#111a30;color:#cbd5e1;cursor:pointer;font-weight:700;font-size:12px}
.pipe-tab.active{background:${RECRUIT_PURPLE};color:#fff;border-color:${RECRUIT_PURPLE}}
.stage-badge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:800}
.stage-applied{background:#312e81;color:#c4b5fd}.stage-verify{background:#1e3a5f;color:#93c5fd}
.stage-medical{background:#422006;color:#fcd34d}.stage-ready{background:#14532d;color:#86efac}
.stage-deployed{background:#0f766e;color:#5eead4}.stage-rejected{background:#450a0a;color:#fca5a5}
.stage-joinback{background:#581c87;color:#e9d5ff}
@media print{
  .noprint,.side,.bar,.burger,.help-links,.logout,#recruitPortalHint,.savebar{display:none!important}
  body{background:#fff;color:#111}
  .main{margin-left:0}
  .rpt-sheet{box-shadow:none;border:1px solid #ccc}
  .wr-tbl th,.wr-tbl td{color:#111;background:#fff!important}
  .ab-act{display:none!important}
}
`

export function recruitReportHeader(title: string, subtitle?: string, badge?: string): string {
  return `<div class="rpt-sheet"><div class="rpt-hdr"><div class="rpt-gold-bar"></div>
    <img src="${RECRUIT_BRAND.logoUrl}" alt="Agile">
    <div class="rpt-co">${esc(RECRUIT_BRAND.company)}</div>
    <h2 class="rpt-title">${esc(title)}</h2>
    ${subtitle ? `<p class="rpt-sub">${subtitle}</p>` : ''}
    ${badge ? `<div class="rpt-badge">${esc(badge)}</div>` : ''}
  </div>`
}

export function recruitFooterBlock(): string {
  return `<div class="rpt-ftr"><div class="rpt-gold-bar"></div>
    <p><b>${esc(RECRUIT_BRAND.product)}</b> — Guard Recruitment &amp; Manpower</p>
    <p><a href="${RECRUIT_BRAND.footerSite}" style="color:#7dd3fc;text-decoration:none">${esc(RECRUIT_BRAND.footerSiteLabel)}</a> ${esc(RECRUIT_BRAND.footerCredit)}</p>
    <p class="rpt-copy">© ${esc(RECRUIT_BRAND.company)} · Confidential</p>
  </div>`
}

export function recruitReportFooter(): string {
  return `${recruitFooterBlock()}</div>`
}

export function recruitReportSection(label: string): string {
  return `<div class="rpt-sec"><span>${esc(label)}</span></div>`
}

/** Email reports — light background with purple + sky header. */
export function recruitEmailShell(title: string, subtitle: string, bodyHtml: string): string {
  return `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:820px;margin:0 auto;color:#1e293b">
    <div style="background:${RECRUIT_HDR_GRADIENT};color:#fff;padding:0;border-radius:12px 12px 0 0;overflow:hidden">
      <div style="height:4px;background:linear-gradient(90deg,${RECRUIT_GOLD},#fbbf24,${RECRUIT_GOLD})"></div>
      <div style="padding:20px 18px;text-align:center">
        <img src="${RECRUIT_BRAND.logoUrl}" alt="Agile" height="52" style="margin-bottom:10px">
        <div style="font-size:10px;letter-spacing:.12em;color:#ddd6fe;text-transform:uppercase">${esc(RECRUIT_BRAND.company)}</div>
        <div style="font-size:18px;font-weight:900;margin-top:6px">${esc(title)}</div>
        <div style="font-size:13px;color:#e0f2fe;margin-top:4px">${subtitle}</div>
      </div>
    </div>
    <div style="padding:18px;background:#fff;border:1px solid #e2e8f0;border-top:none">${bodyHtml}</div>
    <div style="text-align:center;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;font-size:11px;color:#64748b;line-height:1.65">
      <div style="height:2px;background:linear-gradient(90deg,${RECRUIT_GOLD},${RECRUIT_PURPLE});margin:-14px -1px 10px"></div>
      <p style="margin:4px 0;font-weight:800;color:#5b21b6">${esc(RECRUIT_BRAND.product)} — Guard Recruitment &amp; Manpower</p>
      <p style="margin:4px 0"><a href="${RECRUIT_BRAND.footerSite}" style="color:#7c3aed;text-decoration:none">${esc(RECRUIT_BRAND.footerSiteLabel)}</a> ${esc(RECRUIT_BRAND.footerCredit)}</p>
      <p style="margin:4px 0">© ${esc(RECRUIT_BRAND.company)} · Confidential</p>
    </div>
  </div>`
}

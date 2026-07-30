import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hodLoginHtml, otpLoginHtml, otpLoginScript } from '../_lib/embedded-otp.js'

function crmPortal(req: VercelRequest): 'staff' | 'management' {
  const p = String(req.query?.portal ?? 'management').trim()
  return p === 'staff' ? 'staff' : 'management'
}

function crmPage(portal: 'staff' | 'management') {
  const loginBlock =
    portal === 'staff'
      ? hodLoginHtml('Agile CRM', 'Branch HOD / Staff — select branch and enter your branch password')
      : otpLoginHtml('Agile CRM', 'Management — Director &amp; Sales team email sign in')
  return PAGE.replace('__CRM_LOGIN__', loginBlock).replace(
    '__CRM_OTP_SCRIPT__',
    otpLoginScript('crm', 'Agile CRM', portal),
  )
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(crmPage(crmPortal(req)))
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile CRM — Sales & Tender Management</title>
<style>
:root{--bg:#070d18;--panel:#0f1729;--card:#131f35;--border:#1e3050;--text:#e8edf5;--muted:#8b9cb8;--gold:#d4a017;--gold2:#f0c040;--blue:#2563eb;--red:#ef4444;--green:#22c55e}
*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Segoe UI',system-ui,Arial,sans-serif;background:var(--bg);color:var(--text);font-size:14px;line-height:1.45}
#login{max-width:400px;margin:0 auto;padding-top:10vh}
.card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;margin-bottom:16px}
.card h2{color:#fff;margin-bottom:4px;font-size:22px}
input,select,textarea{width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:#0a1220;color:var(--text);font-size:14px}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--gold)}
label{display:block;font-size:11px;color:var(--muted);margin:8px 0 4px;font-weight:700;text-transform:uppercase;letter-spacing:.4px}
.btn{padding:10px 18px;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:13px;background:var(--gold);color:#1a1200;transition:.15s}
.btn:hover{filter:brightness(1.08)}.btn.gold{background:linear-gradient(135deg,#d4a017,#f0c040);color:#1a1200}
.btn.blue{background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#fff}.btn.grey{background:#243049;color:var(--text);border:1px solid var(--border)}
.btn.green{background:var(--green);color:#fff}.btn.r{background:var(--red);color:#fff}
.msg{padding:10px;border-radius:8px;font-size:14px;margin-top:10px;display:none;background:#3a0a0a;color:#ef4444}
#shell{display:none;min-height:100vh}
.side{position:fixed;top:0;left:0;bottom:0;width:250px;background:linear-gradient(180deg,#0c1528,#0a1020);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow-y:auto;z-index:40}
.brand{padding:20px 16px;border-bottom:1px solid var(--border)}.brand img{height:44px;display:block;margin:0 auto}
.brand b{display:block;color:#fff;font-size:13px;margin-top:8px;line-height:1.3;text-align:center}
.brand small{display:block;color:var(--gold);font-size:10px;margin-top:4px;text-align:center;line-height:1.3}
.menu{padding:10px 8px;flex:1}.mi{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:10px;color:#b8c5da;cursor:pointer;font-weight:600;font-size:13px;margin-bottom:2px}
.mi:hover{background:#162540}.mi.active{background:linear-gradient(135deg,#b8860b,#d4a017);color:#1a1200;box-shadow:0 2px 12px rgba(212,160,23,.25)}
.msec{padding:14px 14px 5px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#5a6d8a;font-weight:800}
.logout{padding:14px 16px;border-top:1px solid var(--border);color:var(--muted);cursor:pointer;font-size:13px}
.main{margin-left:250px;min-height:100vh;background:var(--bg)}
.bar{background:var(--panel);border-bottom:1px solid var(--border);padding:14px 22px;display:flex;justify-content:space-between;align-items:center}
.bar b{color:#fff;font-size:17px}.bar .sub{color:var(--muted);font-size:12px;margin-top:2px}
.content{padding:20px 22px 140px;max-width:1200px}
.burger{display:none;background:var(--gold);color:#1a1200;border:none;border-radius:8px;padding:8px 12px;font-weight:800}
@media(max-width:900px){.side{transform:translateX(-100%);transition:.2s}.side.open{transform:none}.main{margin-left:0}.burger{display:inline-block}.content{padding:16px}}
.page-hdr{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:18px}
.page-hdr h1{color:#fff;font-size:26px;font-weight:800}.page-hdr p{color:var(--muted);font-size:13px;margin-top:4px;max-width:560px}
.kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:18px}
.kpi{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px}.kpi b{font-size:28px;color:#fff;display:block;font-weight:800}
.kpi span{font-size:12px;color:var(--muted);margin-top:4px;display:block}
.kpi.gold b{color:var(--gold2)}.kpi.blue b{color:#60a5fa}
.tblwrap{overflow-x:auto;border:1px solid var(--border);border-radius:10px}table{border-collapse:collapse;width:100%;font-size:13px;min-width:700px}
th,td{border:1px solid var(--border);padding:8px;text-align:left}th{background:#0a1220;color:var(--muted);font-size:11px;text-transform:uppercase}
td input,td select{min-width:90px}
.stage{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;color:#fff}
.due{color:#fbbf24;font-weight:700}.over{color:#f87171;font-weight:700}
.tcard{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:14px}
.trow{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}@media(max-width:900px){.trow{grid-template-columns:1fr}}
.savebar{position:fixed;bottom:0;left:250px;right:0;background:rgba(15,23,41,.95);backdrop-filter:blur(8px);border-top:1px solid var(--border);padding:12px 22px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;z-index:20;pointer-events:auto}
@media(max-width:900px){.savebar{left:0}}
textarea{min-height:160px;line-height:1.5;white-space:pre;font-family:inherit}
.fhead{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}.fhead>div{flex:1;min-width:180px}
.inact{opacity:.5}
.hidden{display:none!important}
.search-row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}
.search-row input,.search-row select{flex:1;min-width:160px}
.pipe-tabs{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.pipe-tab{padding:10px 20px;border-radius:10px;border:1px solid var(--border);background:var(--card);color:var(--muted);cursor:pointer;font-weight:700;font-size:13px}
.pipe-tab.on{background:linear-gradient(135deg,#b8860b,#d4a017);color:#1a1200;border-color:var(--gold)}
.stage-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.stage-box{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;cursor:pointer;transition:.15s}
.stage-box:hover{border-color:var(--gold)}.stage-box .dot{width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:6px}
.stage-box .nm{font-weight:700;color:#fff;font-size:14px}.stage-box .ct{float:right;font-weight:800;color:#fff;font-size:18px}
.stage-box .val{font-size:12px;color:var(--gold2);margin-top:6px}
.lead-card,.tender-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;margin-bottom:12px;transition:.15s}
.lead-card:hover,.tender-card:hover{border-color:#3d5280}
.lead-card.open,.tender-card.open{border-color:var(--gold);box-shadow:0 0 0 1px rgba(212,160,23,.2)}
.lc-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.lc-name{font-size:17px;font-weight:800;color:#fff}.lc-loc{color:var(--muted);font-size:13px;margin-top:2px}
.lc-meta{display:flex;flex-wrap:wrap;gap:14px;margin-top:12px;font-size:13px;color:var(--muted)}
.lc-val{margin-top:12px;font-size:15px;font-weight:800;color:var(--gold2)}
.lc-val span{color:var(--muted);font-weight:500;font-size:13px;margin-left:8px}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.tag{font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;background:#1a2840;color:#94a3b8;border:1px solid var(--border)}
.tag.status{background:#1e3a5f;color:#93c5fd}.tag.loc{background:#1a2e1a;color:#86efac}
.tc-title{font-size:18px;font-weight:800;color:#fff;margin-bottom:4px}.tc-sub{color:var(--muted);font-size:13px;margin-bottom:12px}
.tc-dates{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;font-size:12px;color:var(--muted)}
.tc-dates b{color:#fff;display:block;margin-top:2px;font-size:13px}
.tc-arrow{color:var(--muted);font-size:20px;align-self:center}
.edit-panel{margin-top:14px;padding-top:14px;border-top:1px solid var(--border)}
.count-note{color:var(--muted);font-size:13px;margin-bottom:12px}
.filter-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.filter-tab{padding:7px 14px;border-radius:999px;border:1px solid var(--border);background:#0a1220;color:var(--muted);cursor:pointer;font-size:12px;font-weight:700}
.filter-tab.on{background:var(--gold);color:#1a1200;border-color:var(--gold)}
.rem-card{border:1px solid var(--border);border-left:4px solid var(--gold)}
.score-btns{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}
.score-btn{width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:#0a1220;color:var(--muted);cursor:pointer;font-weight:800;font-size:12px}
.score-btn.on{background:var(--gold);color:#1a1200;border-color:var(--gold)}
.survey-tabs{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}
.survey-tab{padding:8px 16px;border-radius:10px;border:1px solid var(--border);cursor:pointer;font-weight:700;font-size:13px;color:var(--muted)}
.survey-tab.on{background:var(--gold);color:#1a1200;border-color:var(--gold)}
.check-item{padding:12px 0;border-bottom:1px solid var(--border)}.check-item:last-child{border:none}
.risk-pill{display:inline-block;padding:6px 14px;border-radius:999px;font-weight:800;font-size:13px}
.survey-cols{display:grid;grid-template-columns:1fr 300px;gap:16px;align-items:start}
@media(max-width:960px){.survey-cols{grid-template-columns:1fr}}
.photo-panel{background:#0a1220;border:1px solid var(--border);border-radius:12px;padding:14px;position:sticky;top:12px}
.photo-panel h4{color:var(--gold2);font-size:13px;margin-bottom:10px}
.photo-slot{border:2px dashed #334155;border-radius:10px;padding:10px;margin-bottom:10px;text-align:center;background:#070d18}
.photo-thumb{width:100%;height:110px;object-fit:cover;border-radius:8px;border:1px solid var(--border);display:block;margin-bottom:6px}
.photo-heading{font-size:14px;font-weight:700;color:#fff;background:#0f172a;border:1px solid var(--gold);border-radius:8px;padding:8px 10px}
.photo-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.photo-label-btn{display:block;width:100%;text-align:center;cursor:pointer;margin-top:6px}
.cam-modal{position:fixed;inset:0;background:#000;z-index:400;display:flex;flex-direction:column}
.cam-modal.hidden{display:none!important}
.cam-modal video{flex:1;width:100%;max-height:75vh;object-fit:cover;background:#111}
.cam-top{padding:12px 16px;background:#0f172a;color:#fff;font-weight:700;text-align:center}
.cam-actions{display:flex;gap:12px;padding:16px;justify-content:center;background:#0f172a}
.cam-actions .btn{min-width:120px}
.mic-btn{padding:4px 12px;border-radius:999px;border:1px solid #3b82f6;background:#1e3a8a;color:#fff;font-size:12px;font-weight:700;cursor:pointer;margin-left:8px;text-transform:none;letter-spacing:0}
.interview-card{background:#0a1220;border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:12px}
.input-sec{background:#0a1220;border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:14px}
.input-sec h4{color:var(--gold2);font-size:13px;margin-bottom:10px}
.report-preview{background:#fff;color:#1e293b;border-radius:10px;padding:16px;max-height:320px;overflow:auto;font-size:12px;border:1px solid var(--border)}
.row-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center}
.share-overlay{position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;pointer-events:auto}
.share-box{background:var(--card);border:2px solid var(--gold);border-radius:14px;padding:22px;max-width:540px;width:100%;max-height:92vh;overflow-y:auto;position:relative;z-index:9001;pointer-events:auto;box-shadow:0 20px 60px rgba(0,0,0,.55)}
.crm-email-panel{background:linear-gradient(180deg,#0f1f3d,#0b1528);border:3px solid var(--gold);border-radius:14px;padding:18px 20px;margin:0 22px 16px;position:relative;z-index:60}
.crm-email-panel.hidden{display:none!important}
.crm-email-panel h3{color:#fde68a;font-size:18px;margin-bottom:6px}
.crm-email-panel .hint{color:#94a3b8;font-size:13px;margin-bottom:12px;line-height:1.5}
.crm-email-panel input,.crm-email-panel textarea{font-size:18px;padding:14px 12px;min-height:50px;width:100%}
.crm-email-panel .mail-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px}
@media(max-width:700px){.crm-email-panel .mail-row{grid-template-columns:1fr}}
.crm-email-panel .mail-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.crm-email-panel .mail-actions .btn{min-height:54px;font-size:17px;padding:14px 24px;flex:1;min-width:160px;touch-action:manipulation;cursor:pointer;-webkit-tap-highlight-color:rgba(212,160,23,.3)}
.share-box h3{color:#fff;margin-bottom:4px;font-size:18px}
.share-note{font-size:12px;color:var(--gold2);margin-bottom:14px}
.ext-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;font-size:13px}
@media(max-width:700px){.ext-grid{grid-template-columns:1fr}}
.ext-cell{background:#0a1220;border:1px solid var(--border);border-radius:8px;padding:8px 10px}
.ext-cell b{color:var(--gold2);font-size:10px;text-transform:uppercase;display:block;margin-bottom:3px}
.cmp-chg{background:#1a1208;border:1px solid #78350f;border-radius:8px;padding:10px;margin-bottom:8px;font-size:13px}
.cmp-chg b{color:#fbbf24}
.cmp-report{margin-top:14px}
.cmp-summary{background:linear-gradient(135deg,#1e3a5f 0%,#0f2744 100%);border:1px solid #3b82f6;border-radius:12px;padding:16px 18px;color:#dbeafe;font-size:15px;line-height:1.6;margin-bottom:14px}
.cmp-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
@media(max-width:700px){.cmp-stats{grid-template-columns:1fr}}
.cmp-stat{background:#0a1628;border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center}
.cmp-stat b{display:block;font-size:22px;color:#fff;margin-bottom:4px}
.cmp-stat span{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
.cmp-section-title{color:#fbbf24;font-size:15px;font-weight:800;margin:14px 0 10px;display:flex;align-items:center;gap:8px}
.cmp-change-card{background:#0a1628;border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:10px}
.cmp-change-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px;flex-wrap:wrap}
.cmp-change-top b{color:#fff;font-size:14px}
.cmp-badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.03em}
.cmp-badge.inc{background:#7f1d1d;color:#fecaca}
.cmp-badge.dec{background:#14532d;color:#86efac}
.cmp-badge.ext{background:#1e3a8a;color:#93c5fd}
.cmp-badge.short{background:#713f12;color:#fde68a}
.cmp-badge.add{background:#312e81;color:#c4b5fd}
.cmp-badge.rem{background:#3f3f46;color:#d4d4d8}
.cmp-badge.chg{background:#78350f;color:#fde68a}
.cmp-values{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:700px){.cmp-values{grid-template-columns:1fr}}
.cmp-val-box{border-radius:8px;padding:10px 12px;font-size:13px;line-height:1.5;word-break:break-word}
.cmp-val-old{background:#1c0a0a;border-left:3px solid #f87171}
.cmp-val-new{background:#0a1a0f;border-left:3px solid #4ade80}
.cmp-val-box small{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;color:#94a3b8}
.cmp-note{font-size:12px;color:#cbd5e1;margin-top:8px;font-style:italic}
.cmp-unchanged{background:#0a1628;border:1px solid #14532d;border-radius:8px;padding:10px 12px;font-size:12px;color:#86efac;margin-top:8px}
.cmp-reco{background:#1a1208;border:1px solid #78350f;border-radius:10px;padding:14px;margin-top:14px;color:#fde68a;font-size:13px;line-height:1.6}
.cmp-reco b{display:block;color:#fbbf24;margin-bottom:6px;font-size:12px;text-transform:uppercase}
.cmp-share-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid #334155}
.cmp-cols{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:10px}
@media(max-width:800px){.cmp-cols{grid-template-columns:1fr}}
.cmp-doc-box{background:#0a1628;border:1px solid var(--border);border-radius:10px;padding:12px}
.cmp-doc-box label{color:var(--gold2)}
.cmp-preview-label{font-size:11px;font-weight:800;letter-spacing:.06em;margin-bottom:8px;padding:4px 8px;border-radius:6px;display:inline-block}
.cmp-preview-label.old{background:#7f1d1d;color:#fecaca}
.cmp-preview-label.new{background:#14532d;color:#86efac}
.cmp-preview-box{background:#fff;border-radius:8px;min-height:180px;max-height:38vh;overflow:auto;margin-top:8px}
.cmp-preview-box iframe{width:100%;height:36vh;min-height:220px;border:0;border-radius:8px}
.cmp-preview-box img{max-width:100%;max-height:36vh;object-fit:contain;display:block;margin:0 auto}
.cmp-text-preview{background:#f8fafc;color:#0f172a;font-size:15px;line-height:1.7;padding:12px;border-radius:8px;max-height:32vh;overflow-y:auto;margin-top:8px;border:1px solid #cbd5e1}
.cmp-search-bar{background:#0a1628;border:1px solid var(--border);border-radius:10px;padding:12px;margin:14px 0 10px}
.cmp-search-hint{font-size:11px;color:#64748b;margin-top:6px}
.rca-card{background:#0a1628;border:1px solid var(--border);border-left:4px solid #ef4444;border-radius:10px;padding:14px;margin-bottom:12px}
.rca-card.done{border-left-color:#22c55e}
.rca-report{background:linear-gradient(135deg,#1a1a2e 0%,#0f172a 100%);border:1px solid #475569;border-radius:10px;padding:16px 18px;margin-top:12px;font-size:14px;line-height:1.75;color:#dbeafe;white-space:pre-wrap}
.rca-section-title{color:#fbbf24;font-size:13px;font-weight:800;margin:12px 0 6px;text-transform:uppercase;letter-spacing:.04em}
.tn-reader-layout{display:grid;grid-template-columns:1.15fr 0.85fr;gap:16px;margin-top:12px}
@media(max-width:960px){.tn-reader-layout{grid-template-columns:1fr}}
.tn-preview-col{background:#0b1220;border:1px solid var(--border);border-radius:10px;padding:12px}
.tn-format-col{background:#0b1220;border:1px solid var(--border);border-radius:10px;padding:12px}
.tn-preview-box{background:#fff;border-radius:8px;min-height:360px;max-height:70vh;overflow:auto;margin-top:8px}
.tn-preview-box iframe{width:100%;height:65vh;min-height:480px;border:0;border-radius:8px}
.tn-preview-box img{max-width:100%;max-height:65vh;object-fit:contain;display:block;margin:0 auto}
.tn-text-preview{background:#f8fafc;color:#0f172a;font-size:17px;line-height:1.75;padding:16px;border-radius:8px;max-height:70vh;overflow-y:auto;margin-top:8px;border:1px solid #cbd5e1}
.tn-lang-banner{background:#1e3a5f;color:#93c5fd;padding:10px 12px;border-radius:8px;font-size:13px;margin-bottom:8px;border:1px solid #3b82f6}
.tn-para{padding:10px 12px;margin:4px 0;border-radius:6px;border:1px solid transparent;word-break:break-word;transition:opacity .15s}
.tn-para.hl{background:#fef08a;border-color:#eab308;box-shadow:inset 0 0 0 2px #facc15}
.tn-para.dim{opacity:.42}
.tn-para.srch{background:#fde68a;border-color:#f59e0b}
.tn-search-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px}
.tn-search-row input{flex:1;min-width:140px;padding:8px 10px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#fff;font-size:14px}
.tn-search-meta{font-size:11px;color:var(--muted);min-width:80px}
.tn-fmt-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
@media(max-width:700px){.tn-fmt-grid{grid-template-columns:1fr}}
.tn-fmt-field{background:#0a1628;border:1px solid var(--border);border-radius:8px;padding:8px 10px;cursor:pointer}
.tn-fmt-field.on{border-color:var(--gold2);box-shadow:0 0 0 2px rgba(201,168,76,.2)}
.tn-fmt-field label{font-size:10px;color:var(--gold2);text-transform:uppercase;display:block;margin-bottom:4px;cursor:pointer}
.tn-fmt-field input,.tn-fmt-field textarea{width:100%;background:#0f172a;border:1px solid #334155;color:#fff;border-radius:6px;padding:8px;font-size:14px;box-sizing:border-box}
.tn-fmt-field textarea{min-height:64px;resize:vertical}
.tn-mark{background:#facc15;color:#000;padding:0 2px;border-radius:2px;font-weight:700}
</style></head>
<body>
<p style="max-width:400px;margin:12px auto 0;padding:10px 14px;border-radius:10px;background:#131f35;border:1px solid #d4a017;text-align:center;font-size:13px;color:#cbd5e1;line-height:1.5">Branch HOD: white <b>HODs / Staff</b> button · Director / Sales: dark <b>Management</b> button on App 03.</p>
__CRM_LOGIN__

<div id="shell">
  <div class="side" id="side">
    <div class="brand"><img src="https://www.agilegroup-digital.co.in/agile-logo.png"><b>Agile Security Force Pvt. Ltd.</b><small>Loyal · Disciplined · Sharp · Active · Intelligent</small></div>
    <div class="menu">
      <div class="mi active" id="m0" onclick="tab(0)"><span>📊</span>Dash Board</div>
      <div class="mi" id="m1" onclick="tab(1)"><span>📅</span>Weekly Calendar</div>
      <div class="mi" id="m2" onclick="tab(2)"><span>🎯</span>Sales Lead</div>
      <div class="mi" id="m3" onclick="tab(3)"><span>🛡️</span>Security Survey</div>
      <div class="mi" id="m4" onclick="tab(4)"><span>📄</span>Tender Lead</div>
      <div class="mi" id="m5" onclick="tab(5)"><span>🔍</span>Tender Reader</div>
      <div class="mi" id="m6" onclick="tab(6)"><span>📁</span>Tender History</div>
      <div class="mi" id="m7" onclick="tab(7)"><span>📝</span>Contract Renewal &amp; PI</div>
      <div class="mi" id="m8" onclick="tab(8)"><span>✉️</span>Communication Formats</div>
      <div class="mi" id="m9" onclick="tab(9)"><span>🔒</span>Data Repository</div>
      <div class="msec">Company Masters</div>
      <div class="mi" onclick="location.href='/mis-admin'"><span>🗄</span>Master Directory</div>
      <div class="mi" id="m10" onclick="tab(10)" style="display:none"><span>🔬</span>Root Cause Analysis (RCA)</div>
      <div class="mi" id="m11" onclick="tab(11)" style="display:none"><span>🔧</span>CRM Admin</div>
    </div>
    <div class="logout" onclick="logout()">⎋ Logout</div>
  </div>
  <div class="main">
    <div class="bar"><div style="display:flex;align-items:center;gap:12px"><button class="burger" onclick="document.getElementById('side').classList.toggle('open')">☰</button><div><b id="ttl">Dash Board</b><div class="sub" id="subttl">Pipeline overview — sales lead stages &amp; tender tracker</div></div></div><span style="color:var(--muted);font-size:12px" id="roleLbl">Director</span></div>
    <div id="crmEmailPanel" class="crm-email-panel hidden">
      <h3>📤 Send by Email</h3>
      <p class="hint"><b>Step 1:</b> Type the client email in the TO box.<br><b>Step 2:</b> Tap the big green <b>Send Email</b> button below.</p>
      <div class="mail-row">
        <div><label>TO (client email)</label><input id="shareTo" type="email" inputmode="email" autocomplete="email" placeholder="client@company.com"></div>
        <div><label>CC (optional)</label><input id="shareCc" type="email" placeholder="cc@..."></div>
      </div>
      <label>Subject</label><input id="shareSub">
      <label style="margin-top:8px">Message</label><textarea id="shareBody" rows="6"></textarea>
      <div class="mail-actions">
        <button type="button" class="btn green" id="shareSendBtn" onclick="sendShareMail()">📨 Send Email</button>
        <button type="button" class="btn blue" onclick="openShareMailto()">✉️ Open in Email App</button>
        <button type="button" class="btn grey" onclick="closeShare()">Close</button>
      </div>
    </div>
    <div class="content" id="content"></div>
  </div>
</div>
<div id="voiceBanner" style="display:none;position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:#1e3a8a;color:#fff;padding:10px 18px;border-radius:999px;font-size:13px;font-weight:700;z-index:150;box-shadow:0 4px 20px rgba(0,0,0,.4)"></div>
<input type="file" id="svPhotoCam" accept="image/*" capture="environment" tabindex="-1" aria-hidden="true" style="position:fixed;left:-9999px;width:1px;height:1px;opacity:0">
<input type="file" id="svPhotoGallery" accept="image/*" tabindex="-1" aria-hidden="true" style="position:fixed;left:-9999px;width:1px;height:1px;opacity:0">
<div id="svCamModal" class="cam-modal hidden">
  <div class="cam-top">📷 Point at site — tap Capture when ready</div>
  <video id="svCamVideo" autoplay playsinline muted></video>
  <canvas id="svCamCanvas" style="display:none"></canvas>
  <div class="cam-actions">
    <button type="button" class="btn gold" onclick="svCamSnap()">📷 Capture</button>
    <button type="button" class="btn grey" onclick="svCamClose()">Cancel</button>
  </div>
</div>

<script>
if(new URLSearchParams(location.search).get('fresh')==='1'){
  sessionStorage.removeItem('otp_crm');
  sessionStorage.removeItem('otp_email_crm');
}
__CRM_OTP_SCRIPT__
var PORTAL='management';
var qpPortal=new URLSearchParams(location.search).get('portal');
if(qpPortal==='staff'){PORTAL='staff';OTP_ROLE='staff';}
else if(qpPortal==='management'||qpPortal==='admin'){PORTAL='management';OTP_ROLE='management';}
var L=[],T=[],A=[],C=[],F=[],D=[],FU=[],LA=[],SV=[],SURVEY_TPL=null,ROLE='admin',BRANCH=null;
var PISTATUS=['Pending','Achieved'];
var ISSUESTATUS=['Pending','Issued','Partial','Due','Not Applicable'];
var DOCCATS=['Master Agreement','MW Notification','Tender Document','PSARA Licence','GST / PF / ESI','Client Contract','Policy / SOP','Previous Tender Data','Other'];
var SERVICELINES=['Manned Guarding / Security','Facility Management Services','Outsourcing Services','Housekeeping','Electrical / Technical','Payroll / Manpower Supply','Other'];
var CRMBRANCHES=['Hyderabad - A','Hyderabad - B','Hi-Tech Branch','Bangalore','Chennai & Pondicherry','Kochi','Mumbai','Surat','Bhopal','Visakhapatnam','Vijayawada','Kakinada','Nellore & Tada','Tirupati & Tadipatri','Corporate Office'];
var STATELIST=['Telangana','Andhra Pradesh','Karnataka','Tamil Nadu','Kerala','Maharashtra','Gujarat','Madhya Pradesh','Puducherry','Delhi','Other'];
var STAGES=['New/RFQ','Initial Meeting','Follow-up Meeting','Site Survey','Quote Submitted','Negotiation','Awaiting Decision','Closed-Won','Closed - Lost'];
var SOURCES=['Referral','Website','Cold Call','Tender Portal','Existing Client','Walk-in','Other'];
var INDIAN_CITIES=['Hyderabad','Secunderabad','Bangalore','Chennai','Mumbai','Pune','Kochi','Surat','Ahmedabad','Vijayawada','Visakhapatnam','Kakinada','Nellore','Tirupati','Tadipatri','Bhopal','Delhi','Noida','Gurgaon','Kolkata','Pondicherry','Other'];
var SECTORS=['Banking','Hospital','Manufacturing / Factory','IT / Corporate','Government / PSU','Education','Retail / Mall','Residential','Warehouse / Logistics','Other'];
var TSTATUS=['Identified / Under Review','Bid Preparation','Check Corrigendum','Submitted','Technical Bid Opened','Evaluation Stage','Price Bid Opened','Result Awaiting','Closed-Won','Closed - Lost'];
var REMINDER_TYPES=['Sales Meeting','Tender Submission','Prebid Meeting','EMD Preparation','Last Date','Call','Site Survey','Follow-up'];
var OURPOS=['L1','L2','L3','L4','Not Qualified','Did Not Bid','—'];
var BIDRANKS=['L1','L2','L3','L4'];
var OLD_Q='',OLD_LOC='',OLD_ST='',OLD_SHOW_INACT=false,OLD_EDIT=-1;
var DASH_PIPE='sales',LEAD_Q='',LEAD_STAGE='',LEAD_REGION='',LEAD_EDIT=-1;
var TEND_Q='',TEND_FILTER='All',TEND_EDIT=-1,TEND_READER_IDX=-1,TEND_EXTRACT={},TEND_PREVIEW={},TEND_SEARCH={},CMP_OLD_FILE=null,CMP_NEW_FILE=null,CMP_LAST_SHARE='',CMP_PREVIEW={old:null,new:null},CMP_SEARCH={},CMP_BLOB_URLS={old:'',new:''},CMP_READ_QUEUE=[],CMP_READ_BUSY=false,CMP_PASTE_TIMERS={old:null,new:null},TEND_MAX_FILE=4000000,TEND_PREVIEW_MAX=1800000,CMP_PREVIEW_MAX_PARAS=350;
var TENDER_FMT_FIELDS=[
  {key:'tenderNo',label:'Tender No',labels:['Tender No','Tender Number']},
  {key:'bidEndDateTime',label:'Bid End Date/Time',labels:['Bid End Date','Bid End Date/Time']},
  {key:'bidValidityFromEnd',label:'Bid Offer Validity (From End Date)',labels:['Bid Offer Validity','Bid Validity']},
  {key:'clientDept',label:'Organisation Name',labels:['Organisation Name','Organization Name']},
  {key:'typeOfServices',label:'Type of Service',labels:['Type of Service','Type of Services']},
  {key:'location',label:'Location',labels:['Location','Place of Work']},
  {key:'contractPeriod',label:'Contract Period',labels:['Contract Period']},
  {key:'minTurnover3yr',label:'Min Turnover Condition',labels:['Min Turnover Condition','Minimum Average Annual Turnover','Min Turnover']},
  {key:'experienceYears',label:'Experience Required',labels:['Years of Past Experience','Experience Required']},
  {key:'estimatedBidValue',label:'Estimated Bid Value',labels:['Estimated Bid Value','Approximate value','Value of Work','Estimated cost']},
  {key:'evaluationMethod',label:'Evaluation Method',labels:['Evaluation Method']},
  {key:'emd',label:'EMD Amount',labels:['EMD Amount','EMD']},
  {key:'epbgPercent',label:'ePBG Percentage (%)',labels:['ePBG Percentage','EPBG']},
  {key:'scoreMatrix',label:'Score Matrix',labels:['Score Matrix']},
  {key:'serviceCharge',label:'Service Charge',labels:['Service Charge']},
  {key:'l1TieBreak',label:'L1 Tie Break',labels:['L1 Tie Break','In Case of L1 Tie Break']},
  {key:'requiredManpower',label:'Total Manpower',labels:['Total Manpower','Manpower']},
  {key:'msePreference',label:'MSE Purchase Preference',labels:['MSE Purchase Preference','MSE Preference']},
  {key:'prebidMeetingDate',label:'Pre-Bid Date & Time',labels:['Pre-Bid meeting date','Pre-Bid Meeting']},
  {key:'prebidMeetingVenue',label:'Pre-Bid Venue',labels:['Pre-Bid meeting Venue','Prebid Venue']},
  {key:'portal',label:'Portal',labels:['Portal','Website']},
  {key:'submissionDate',label:'Submission / Last Date',labels:['Last Date','Submission Date']},
  {key:'tenderFee',label:'Tender Fee',labels:['Tender Fee']},
  {key:'tenderName',label:'Tender Name / Work',labels:['Tender for','Name of work']}
];
var SUBTITLES=['Pipeline overview — sales lead stages & tender tracker','Weekly calendar — meetings, follow-ups & tender milestones','Direct sales enquiries — add, edit, deactivate','Physical security survey & risk assessment (0–180 score)','Centralised Tender Cell — active tender process','Read tender notices & compare documents (not stored)','Past tender records — search by client, location, state','Contract renewals & minimum wage price increase','Standard email & letter formats','Client follow-ups — renewal, uniform, equipment','Analyse lost sales leads & tenders — learn and win next time','Director administration & quick access'];
var RCA_Q='',RCA_FILTER='all',RCA_EXPAND='',RCA_BUSY='';
var WEEK_OFFSET=0;
var SV_EDIT=-1,SV_VIEW='list',SV_TAB='inputs',SV_MAX_PHOTOS=10,VOICE_REC=null,VOICE_TARGET=null,SV_PHOTO_CTX={si:-1,type:'site_photo'},SV_CAM_STREAM=null;
var PHOTO_LABELS={site_photo:'Site Photo',deployment_chart:'Deployment Chart',perimeter:'Perimeter',entrance:'Entrance',cctv:'CCTV',other:'Other'};
var SPEECH_OK=!!(window.SpeechRecognition||window.webkitSpeechRecognition);
var LEAD_SHOW_INACT=false,TEND_SHOW_INACT=false,SV_SHOW_INACT=false,ACT_SHOW_INACT=false,CONT_SHOW_INACT=false,FU_SHOW_INACT=false,DOC_SHOW_INACT=false,FMT_SHOW_INACT=false;
function showInactLbl(on,fn){return '<label style="display:flex;align-items:center;gap:6px;color:var(--muted);font-size:12px"><input type="checkbox" '+(on?'checked':'')+' onchange="'+fn+'"> Show deactivated</label>';}
function toggleAct(row,isOn,reload){return '<button type="button" class="btn grey" style="padding:5px 12px;font-size:12px" onclick="event.stopPropagation();'+row+'.active='+(isOn?'false':'true')+';'+reload+'">'+(isOn?'Deactivate':'Activate')+'</button>';}
function btnEdit(fn){return '<button type="button" class="btn gold" style="padding:5px 14px;font-size:12px;font-weight:800" onclick="event.stopPropagation();'+fn+'">✏️ Edit</button>';}
function btnShare(fn){return '<button type="button" class="btn blue" style="padding:5px 14px;font-size:12px" onclick="event.stopPropagation();'+fn+'">📤 Share</button>';}
function cardActs(editFn,shareFn,actRow,isOn,reload){return '<div class="row-actions">'+btnEdit(editFn)+btnShare(shareFn)+toggleAct(actRow,isOn,reload)+'</div>';}
function shareHdr(title){return 'Agile Security Force Pvt. Ltd.\\n'+title+'\\nDate: '+today()+'\\n'+'==================================================\\n\\n';}
function leadShareText(l){return shareHdr('SALES LEAD — '+(l.company||'Lead'))+'Company: '+(l.company||'—')+'\\nContact: '+(l.contactName||'—')+' | '+(l.phone||'—')+'\\nLocation: '+(l.location||l.branch||'—')+' | '+(l.state||'—')+'\\nStage: '+(l.stage||'New')+'\\nEst. Value: '+fmtMoneyMo(l.estValue||0)+'\\nManpower: '+(l.manpower||'—')+'\\nNext Follow-up: '+(l.nextFollowUp||'—')+'\\nRequirement: '+(l.requirement||'—')+'\\nAssigned To: '+(l.assignedTo||'—')+'\\n\\n— Sent from Agile CRM';}
function surveyShareText(sv){var total=svGrandTotal(sv),band=svRiskBand(total);return shareHdr('SECURITY SURVEY REPORT — '+(sv.company||''))+'Location: '+(sv.locationName||sv.address||'—')+'\\nSurvey Date: '+(sv.surveyDate||'—')+'\\nSurveyed By: '+(sv.surveyedBy||'—')+'\\nRisk Score: '+total+'/180 ('+band.level+')\\nStatus: '+(sv.status||'Draft')+'\\n\\nRISK ANALYSIS\\n'+(sv.riskAnalysis||'—')+'\\n\\nEXECUTIVE SUMMARY\\n'+(sv.executiveSummary||'(Generate report in CRM first)')+'\\n\\nMANNING & DEPLOYMENT\\n'+(sv.manningSuggestion||'—')+'\\n\\nUNIFORM REQUIREMENTS\\n'+(sv.uniformRequirements||'—')+'\\n\\nEQUIPMENT\\n'+(sv.equipmentSuggestions||'—')+'\\n\\nSECURITY RECOMMENDATIONS\\n'+(sv.securityRecommendations||sv.recommendations||'—')+'\\n\\nSite Requirements: '+(sv.siteRequirements||'—')+'\\n\\nCONFIDENTIAL — Agile Security Survey & Risk Assessment\\n— Sent from Agile CRM';}
function tenderShareText(t){return shareHdr('TENDER — '+(t.tenderName||t.clientDept||''))+'Client / Dept: '+(t.clientDept||'—')+'\\nLocation: '+(t.location||'—')+' | '+(t.state||'—')+'\\nStatus: '+(t.status||'—')+'\\nPortal: '+(t.portal||'—')+'\\nServices: '+(t.typeOfServices||'—')+'\\nManpower: '+(t.requiredManpower||'—')+'\\nPublished: '+(t.publishedDate||'—')+'\\nPre-Bid: '+(t.prebidMeetingDate||'—')+'\\nEMD Prep: '+(t.emdPreparationDate||'—')+'\\nSubmission / Last Date: '+(t.submissionDate||'—')+'\\nEMD: '+(t.emd||'—')+' | Fee: '+(t.tenderFee||'—')+'\\nOur Quote: '+(t.ourQuote||'—')+' | Position: '+(t.ourPosition||'—')+'\\nRemarks: '+(t.remarks||'—')+'\\n\\n— Sent from Agile CRM';}
function oldTenderShareText(t){return shareHdr('OLD TENDER RECORD — '+(t.tenderName||''))+'Client / Dept: '+(t.clientDept||'—')+'\\nLocation: '+(t.location||'—')+' | '+(t.state||'—')+'\\nPublished: '+(t.publishedDate||'—')+'\\nSubmission: '+(t.submissionDate||'—')+'\\nAwarded: '+(t.contractAwardedDate||'—')+' to '+(t.awardedTo||'—')+'\\nAward Rate: '+(t.contractAwardedRate||'—')+'\\nOur Quote: '+(t.ourQuote||'—')+' | Our Position: '+(t.ourPosition||'—')+'\\nNext Probable Tender: '+(t.nextProbableDate||'—')+'\\nAllotment: '+(t.allotmentDetails||'—')+'\\nRemarks: '+(t.remarks||'—')+'\\n\\n— Sent from Agile CRM';}
function dashShareText(){var td=today(),actSales=activeSalesLeads(),actTend=activeTenderLeads(),pval=actSales.reduce(function(s,x){return s+(Number(x.estValue)||0);},0),tval=actTend.reduce(function(s,x){return s+(Number(x.ourQuote)||0);},0),todayList=todayReminders(),overList=overdueReminders();var t=shareHdr('CRM PIPELINE DASHBOARD')+'Sales lead Stages: '+fmtMoney(pval)+' ('+actSales.length+' active leads)\\nTender Status Tracker: '+fmtMoney(tval||0)+' ('+actTend.length+' active tenders)\\n\\nACTIVE SALES LEADS\\n';actSales.slice(0,15).forEach(function(l){t+='• '+(l.company||'—')+' | '+(l.stage||'—')+' | F/U: '+(l.nextFollowUp||'—')+'\\n';});t+='\\nACTIVE TENDER LEADS\\n';actTend.slice(0,15).forEach(function(x){t+='• '+(x.tenderName||x.clientDept||'—')+' | '+(x.status||'—')+' | Last: '+(x.submissionDate||'—')+'\\n';});t+='\\nREMINDERS TODAY ('+td+')\\n';todayList.forEach(function(r){t+='• '+r.type+' — '+r.title+' ('+r.date+')\\n';});if(!todayList.length)t+='(none)\\n';if(overList.length){t+='\\nOVERDUE ('+overList.length+')\\n';overList.slice(0,8).forEach(function(r){t+='• '+r.type+' — '+r.title+' ('+r.date+')\\n';});}return t+'\\n— Sent from Agile CRM';}
function remindersShareText(){var td=today(),actA=A.filter(function(x){return x.active!==false;}),auto=tenderRemindersForDay(td);var t=shareHdr('DAILY REMINDERS — '+td)+'AUTO FROM LIVE TENDERS\\n';auto.forEach(function(r){t+='• '+r.type+' — '+r.title+' ('+r.date+')\\n';});if(!auto.length)t+='(none today)\\n';t+='\\nMANUAL REMINDERS\\n';actA.filter(function(x){return !x.done;}).slice(0,30).forEach(function(x){t+='• '+x.type+' — '+(x.company||'—')+' | '+x.date+(x.notes?(' | '+x.notes):'')+'\\n';});return t+'\\n— Sent from Agile CRM';}
function contractShareText(c){return shareHdr('CONTRACT — '+(c.client||''))+'State: '+(c.state||'—')+'\\nMaster Agreement: '+(c.masterAgreementDate||'—')+'\\nRenewal Date: '+(c.renewalDate||'—')+'\\nExisting Rate: '+(c.existingRate||'—')+'\\nRevised Rate: '+(c.revisedRate||'—')+'\\nMW Notification: '+(c.mwNotificationDate||'—')+'\\nPI Status: '+(c.piStatus||'—')+'\\nPI Achieved: '+(c.piAchievedDate||'—')+'\\nNext PI: '+(c.nextPiDate||'—')+'\\nRemarks: '+(c.remarks||'—')+'\\n\\n— Sent from Agile CRM';}
function repoShareText(x){return shareHdr('CLIENT SITE — '+(x.client||''))+'Branch: '+(x.branch||'—')+'\\nLocation: '+(x.location||'—')+'\\nContract Renewal: '+(x.contractRenewalDate||'—')+'\\nContract F/U: '+(x.contractFollowUp||'—')+'\\nUniform: '+(x.uniformStatus||'—')+' | Issued: '+(x.uniformIssued||'—')+' | F/U: '+(x.uniformFollowUp||'—')+'\\nEquipment: '+(x.equipmentStatus||'—')+' | Issued: '+(x.equipmentIssued||'—')+' | F/U: '+(x.equipmentFollowUp||'—')+'\\nNotes: '+(x.notes||'—')+'\\n\\n— Sent from Agile CRM';}
function shareOpen(kind,idx){var sub='',body='';if(kind==='lead'){var l=L[idx];if(!l)return;sub='Sales Lead — '+(l.company||'Lead');body=leadShareText(l);}else if(kind==='survey'){var sv=SV[idx];if(!sv)return;sub='Security Survey — '+(sv.company||'Site');body=surveyShareText(sv);}else if(kind==='tend'){var t=T[idx];if(!t)return;sub='Tender — '+(t.tenderName||t.clientDept||'');body=tenderShareText(t);}else if(kind==='oldtend'){var ot=T[idx];if(!ot)return;sub='Tender History — '+(ot.tenderName||ot.clientDept||'');body=oldTenderShareText(ot);}else if(kind==='dash'){sub='CRM Dashboard — '+today();body=dashShareText();}else if(kind==='reminders'){sub='Weekly Calendar — '+today();body=remindersShareText();}else if(kind==='contract'){var c=C[idx];if(!c)return;sub='Contract — '+(c.client||'');body=contractShareText(c);}else if(kind==='repo'){var fu=FU[idx];if(!fu)return;sub='Client Site — '+(fu.client||'');body=repoShareText(fu);}openShare(sub,body);}
function closeAllOverlays(){var c=el('cmpModal');if(c)c.remove();}
function openShare(sub,body){
  closeAllOverlays();
  el('shareSub').value=sub||'';
  el('shareBody').value=body||'';
  el('shareTo').value='';
  el('shareCc').value='';
  var p=el('crmEmailPanel');
  if(p){
    p.classList.remove('hidden');
    try{p.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){p.scrollIntoView(true);}
  }
  var sb=el('shareSendBtn');
  if(sb){sb.disabled=false;sb.textContent='📨 Send Email';}
  setTimeout(function(){try{el('shareTo').focus();}catch(e){}},300);
}
function closeShare(){var p=el('crmEmailPanel');if(p)p.classList.add('hidden');}
function openShareMailto(){
  var to=(el('shareTo').value||'').trim(),sub=el('shareSub').value||'Agile CRM',body=el('shareBody').value||'';
  if(!to||to.indexOf('@')<0){alert('Please type the client email in the TO box first.');try{el('shareTo').focus();}catch(e){}return;}
  var url='mailto:'+encodeURIComponent(to)+'?subject='+encodeURIComponent(sub)+'&body='+encodeURIComponent(body);
  window.location.href=url;
}
function sendShareMail(){
  var to=(el('shareTo').value||'').trim(),cc=(el('shareCc').value||'').trim(),sub=el('shareSub').value,body=el('shareBody').value;
  if(!to||to.indexOf('@')<0){alert('Please type the client email address in the TO box first.');try{el('shareTo').focus();}catch(e){}return;}
  var sb=el('shareSendBtn');
  if(sb){sb.disabled=true;sb.textContent='Sending…';}
  api('sendCrmMail',{to:to,cc:cc,subject:sub,body:body}).then(function(r){
    if(sb){sb.disabled=false;sb.textContent='📨 Send Email';}
    if(r.s===200){alert('✅ Email sent to '+to+'. Director copied (BCC).');closeShare();}
    else alert(r.j.error||'Could not send email. Please try again.');
  }).catch(function(){
    if(sb){sb.disabled=false;sb.textContent='📨 Send Email';}
    alert('Network error. Please check your internet and try again.');
  });
}
var STCOL={'New/RFQ':'#64748b','Initial Meeting':'#3b82f6','Follow-up Meeting':'#2563eb','Site Survey':'#8b5cf6','Quote Submitted':'#a855f7',Negotiation:'#f59e0b','Awaiting Decision':'#eab308','Closed-Won':'#22c55e','Closed - Lost':'#64748b',New:'#64748b',Contacted:'#3b82f6','Quotation Sent':'#a855f7',Won:'#22c55e',Lost:'#64748b'};
var STDOT={'New/RFQ':'#94a3b8','Initial Meeting':'#f59e0b','Follow-up Meeting':'#3b82f6','Site Survey':'#8b5cf6','Quote Submitted':'#a855f7',Negotiation:'#ef4444','Awaiting Decision':'#eab308','Closed-Won':'#22c55e','Closed - Lost':'#64748b',New:'#94a3b8',Contacted:'#f59e0b','Quotation Sent':'#a855f7',Won:'#22c55e',Lost:'#64748b'};
var TDOT={'Identified / Under Review':'#64748b','Bid Preparation':'#3b82f6','Check Corrigendum':'#f59e0b',Submitted:'#2563eb','Technical Bid Opened':'#8b5cf6','Evaluation Stage':'#a855f7','Price Bid Opened':'#f59e0b','Result Awaiting':'#eab308','Closed-Won':'#22c55e','Closed - Lost':'#64748b'};
function fmtMoney(n){var v=Number(n)||0;if(v>=100000)return '₹'+(v/100000).toFixed(1).replace(/\\.0$/,'')+'L';return '₹'+v.toLocaleString('en-IN');}
function fmtRecordDate(iso){if(!iso)return '—';try{var d=new Date(iso);return d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}catch(e){return String(iso).slice(0,16);}}
function mapSearchUrl(q){q=String(q||'').trim();return q?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q):'';}
function mapDirsUrl(q){q=String(q||'').trim();return q?'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(q):'';}
function leadMapQuery(l){return [l.location,l.city,l.state,l.company].filter(Boolean).join(', ');}
function tenderMapQuery(t,kind){if(kind==='Prebid Meeting'&&t.prebidMeetingVenue)return [t.prebidMeetingVenue,t.location,t.state].filter(Boolean).join(', ');return [t.location,t.state,t.tenderName||t.clientDept].filter(Boolean).join(', ');}
function findLeadForReminder(x){
  if(x.leadId){var byId=L.find(function(z){return z.id===x.leadId;});if(byId)return byId;}
  var name=String(x.company||'').trim();if(!name)return null;
  var scoped=L.filter(function(z){return z.leadKind!=='Tender'&&z.active!==false&&leadInScope(z);});
  var exact=scoped.find(function(z){return normTxt(z.company)===normTxt(name);});if(exact)return exact;
  var partial=scoped.find(function(z){return matchQ(z.company,name);});if(partial)return partial;
  return scoped.find(function(z){return matchQ(name,z.company);})||null;
}
function activityMapQuery(x){
  var l=findLeadForReminder(x);
  if(x.location&&String(x.location).trim())return String(x.location).trim();
  if(l)return leadMapQuery(l);
  return '';
}
function branchLeadsForPicker(){return L.filter(function(l){return l.leadKind!=='Tender'&&l.active!==false&&leadInScope(l);}).sort(function(a,b){return String(a.company||'').localeCompare(b.company||'');});}
function onReminderLeadPick(i,v){
  var x=A[i];if(!x)return;
  if(!v){x.leadId='';weeklyCalendar();return;}
  var l=L.find(function(z){return z.id===v;});if(!l)return;
  x.leadId=l.id;x.company=l.company||'';x.location=leadMapQuery(l);weeklyCalendar();
}
function onReminderCompanyInput(i){
  var x=A[i];if(!x)return;
  var l=findLeadForReminder(x);
  x.leadId=l?l.id:'';
  if(l&&!x.location)x.location=leadMapQuery(l);
  weeklyCalendar();
}
function reminderLeadSelect(i,x){
  var leads=branchLeadsForPicker();
  var opts='<option value="">— Pick Sales Lead —</option>'+leads.map(function(l){return '<option value="'+a(l.id)+'"'+(x.leadId===l.id?' selected':'')+'>'+h(l.company||'(no name)')+(l.city?(' · '+l.city):'')+'</option>';}).join('');
  return '<select onchange="onReminderLeadPick('+i+',this.value)" style="min-width:170px;margin-bottom:4px;display:block">'+opts+'</select><input value="'+a(x.company)+'" oninput="A['+i+'].company=this.value;A['+i+'].leadId=\\'\\';" onchange="onReminderCompanyInput('+i+')" placeholder="Or type client name" style="min-width:170px">';
}
function renderMapLinks(q,compact){if(!q)return '';var s=mapSearchUrl(q),d=mapDirsUrl(q);if(compact)return '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><a class="btn grey" style="padding:4px 10px;font-size:11px;white-space:nowrap" href="'+a(s)+'" target="_blank" rel="noopener">🗺 Map</a><a class="btn blue" style="padding:4px 10px;font-size:11px;white-space:nowrap" href="'+a(d)+'" target="_blank" rel="noopener">🧭 Directions</a></div>';return '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><a class="btn grey" style="padding:6px 12px;font-size:12px" href="'+a(s)+'" target="_blank" rel="noopener">🗺 View on Google Map</a><a class="btn blue" style="padding:6px 12px;font-size:12px" href="'+a(d)+'" target="_blank" rel="noopener">🧭 Get Directions</a></div>';}
function renderReminderLocation(q,fromLead){if(!q)return '<span style="color:var(--muted);font-size:11px">Add address in Sales Lead</span>';var short=q.length>70?q.slice(0,67)+'…':q;return '<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;line-height:1.3">'+h(short)+(fromLead?' <span style="color:var(--gold2)">(from Sales Lead)</span>':'')+'</div>'+renderMapLinks(q,true);}
function renderOtherSiteCities(l,i){
  if(!l.otherSiteCities)l.otherSiteCities=[];
  var rows=l.otherSiteCities.map(function(c,ci){return '<div style="display:flex;gap:8px;margin-bottom:6px"><select onchange="L['+i+'].otherSiteCities['+ci+']=this.value">'+opt(c,INDIAN_CITIES)+'</select><button type="button" class="btn grey" style="padding:4px 10px" onclick="L['+i+'].otherSiteCities.splice('+ci+',1);salesLeads();">✕</button></div>';}).join('');
  return '<label>Do they have any other sites in India? (city)</label>'+rows+'<button type="button" class="btn grey" style="margin-top:4px" onclick="if(!L['+i+'].otherSiteCities)L['+i+'].otherSiteCities=[];L['+i+'].otherSiteCities.push(\\'\\');salesLeads();">+ Add city</button>';
}
function deleteLeadPermanently(i){
  if(ROLE!=='admin'){alert('Only Director/Admin can delete leads.');return;}
  var l=L[i];if(!l)return;
  if(!confirm('Permanently delete this lead for '+((l.company||'unnamed'))+'? This cannot be undone.'))return;
  api('deleteLead',{leadId:l.id}).then(function(r){
    if(r.s!==200){alert(r.j.error||'Could not delete.');return;}
    L.splice(i,1);LEAD_EDIT=-1;expLead=-1;salesLeads();alert('Lead deleted.');
  });
}
function runLeadAiResearch(i){
  if(ROLE!=='admin'){alert('Only Director/Admin can run AI research.');return;}
  var l=L[i];if(!l)return;
  expLead=i;salesLeads();
  var out=el('leadAiOut');if(out)out.textContent='Researching… please wait.';
  api('researchLead',{company:l.company,webAddress:l.webAddress,location:l.location,city:l.city,state:l.state,sector:l.sector}).then(function(r){
    if(r.s!==200){if(out)out.textContent=r.j.error||'Research failed.';return;}
    l.aiResearch=r.j.aiResearch||'';l.swot=r.j.swot||l.swot;
    salesLeads();expLead=i;
    alert(r.j.aiUsed?'✅ AI research & SWOT updated.':'Research saved (template mode — add AI key for live web research).');
  });
}
function fmtMoneyMo(n){return fmtMoney(n)+'/mo';}
function fmtDate(d){if(!d)return '—';var p=d.split('-');if(p.length<3)return d;var mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return parseInt(p[2],10)+' '+mo[parseInt(p[1],10)-1]+' '+p[0];}
function matchQ(txt,q){if(!q)return true;return normTxt(txt).indexOf(normTxt(q))>=0;}
function pageHdr(title,sub,btn){return '<div class="page-hdr"><div><h1>'+h(title)+'</h1><p>'+h(sub)+'</p></div>'+(btn||'')+'</div>';}
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function nid(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function api(action,extra){return fetch('/api/crm/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION},extra||{}))}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});}
function opt(cur,arr){return arr.map(function(o){return '<option'+(o===cur?' selected':'')+'>'+h(o)+'</option>';}).join('');}
function today(){return new Date().toISOString().slice(0,10);}
function mapLeadStage(s){var m={New:'New/RFQ',Contacted:'Initial Meeting','Quotation Sent':'Quote Submitted',Won:'Closed-Won',Lost:'Closed - Lost'};return m[s]||s||'New/RFQ';}
function mapTenderStatus(s){var m={Identified:'Identified / Under Review','In Progress':'Bid Preparation','Result Awaited':'Result Awaiting',Won:'Closed-Won',Lost:'Closed - Lost'};return m[s]||s||'Identified / Under Review';}
function isClosedWon(v){return v==='Closed-Won'||v==='Won';}
function isClosedLost(v){return v==='Closed - Lost'||v==='Lost';}
function leadInScope(l){if(ROLE!=='branch'||!BRANCH)return true;return (l.branch||'')===BRANCH;}
function tenderInScope(t){if(ROLE!=='branch'||!BRANCH)return true;return (t.branch||'')===BRANCH;}
function activityInScope(a){
  if(ROLE!=='branch'||!BRANCH)return true;
  if(a.leadId){return L.some(function(l){return l.id===a.leadId;});}
  if(a.tenderId)return false;
  return L.some(function(l){return matchQ(l.company,a.company);});
}
function archiveLostLead(i){
  var l=L[i];if(!l)return;
  if(!l.competitors)l.competitors=[];
  var comps=l.competitors.slice();
  if(l.presentAgency)comps.unshift({name:l.presentAgency,quote:l.existingRate||''});
  var summary=comps.filter(function(c){return c.name||c.quote;}).map(function(c){return (c.name||'—')+(c.quote?(' @ '+c.quote):'');}).join(' · ');
  LA.unshift({id:nid('ar'),kind:'sales',branch:l.branch||'',client:l.company||'',title:l.requirement||'Sales lead',ourQuote:String(l.estValue||''),ourPosition:'',competitorSummary:summary,detailJson:JSON.stringify(l),closedDate:today(),active:true,createdAt:new Date().toISOString()});
  l.active=false;
  api('saveLeads',{leads:L}).then(function(){api('saveLostArchives',{lostArchives:LA});});
}
function archiveLostTender(i){
  var t=T[i];if(!t)return;
  var bidders=t.bidders||[];
  var summary=bidders.map(function(b){return (b.rank||'')+': '+(b.name||'—')+(b.quote?(' @ '+b.quote):'');}).join(' · ');
  LA.unshift({id:nid('ar'),kind:'tender',branch:t.branch||'',client:t.clientDept||'',title:t.tenderName||'Tender',ourQuote:t.ourQuote||'',ourPosition:t.ourPosition||'',competitorSummary:summary,detailJson:JSON.stringify(t),closedDate:today(),active:true,createdAt:new Date().toISOString()});
  t.recordKind='Historical';t.active=false;
  api('saveTenders',{tenders:T}).then(function(){api('saveLostArchives',{lostArchives:LA});});
}
function onLeadStageChange(i,st){
  var prev=L[i].stage;L[i].stage=st;
  if(isClosedLost(st)){if(confirm('Mark as Closed - Lost? The full record (with competitor rates) will move to Data Repository.'))archiveLostLead(i);else L[i].stage=prev;}
  salesLeads();
}
function onTenderStatusChange(i,st){
  var prev=T[i].status;T[i].status=st;
  if(isClosedLost(st)){if(confirm('Mark as Closed - Lost? The full record (L1–L4 rates & our position) will move to Data Repository.'))archiveLostTender(i);else T[i].status=prev;}
  else if(isClosedWon(st))T[i].recordKind='Historical';
  tenderLeads();
}
function selStage(i,l){return '<div><label>Stage</label><select onchange="onLeadStageChange('+i+',this.value)">'+opt(mapLeadStage(l.stage),STAGES)+'</select></div>';}
function selTenderStatus(i,t){return '<div><label>Status</label><select onchange="onTenderStatusChange('+i+',this.value)">'+opt(mapTenderStatus(t.status),TSTATUS)+'</select></div>';}

function onOtpLogin(j){api('login').then(function(res){if(res.s!==200){otpMsg(res.j.error||'Login failed',false);return;}applyLogin(res);});}
function applyLogin(res){L=res.j.leads||[];T=res.j.tenders||[];A=res.j.activities||[];C=res.j.contracts||[];D=res.j.docs||[];FU=res.j.followUps||[];LA=res.j.lostArchives||[];SV=res.j.surveys||[];SURVEY_TPL=res.j.surveyTemplate||null;ROLE=res.j.role||'admin';BRANCH=res.j.branch||null;
  L.forEach(function(l){l.stage=mapLeadStage(l.stage);if(!l.competitors)l.competitors=[];if(!l.otherSiteCities)l.otherSiteCities=[];if(!l.webAddress)l.webAddress='';if(!l.aiResearch)l.aiResearch='';if(!l.recordedBy)l.recordedBy='';});
  A.forEach(function(x){if(!x.location)x.location='';if(!x.leadId)x.leadId='';var l=findLeadForReminder(x);if(l&&!x.location)x.location=leadMapQuery(l);});
  T.forEach(function(t){t.status=mapTenderStatus(t.status);});
  ['m7','m8','m11'].forEach(function(id){el(id).style.display=(ROLE==='admin')?'':'none';});
  ['m4','m5','m6','m10'].forEach(function(id){el(id).style.display=(ROLE==='admin'||ROLE==='coordinator')?'':'none';});
  el('m9').style.display='';
  var rl={admin:'Director — All Regions',coordinator:'Sales Coordinator — All India',staff:'Sales Team',branch:'Branch HOD — '+(BRANCH||'')};
  el('roleLbl').textContent=rl[ROLE]||ROLE;
  el('login').style.display='none';el('shell').style.display='block';
  if(new URLSearchParams(location.search).get('portal')==='admin'&&ROLE==='admin')tab(11);
  else tab(0);}
function logout(){sessionStorage.removeItem('otp_crm');sessionStorage.removeItem('otp_email_crm');sessionStorage.removeItem('otp_branch_crm');otpLogout();location.href='/crm?portal='+encodeURIComponent(PORTAL||'management')+'&fresh=1';}
var CUR=0;
function tab(i){CUR=i;['m0','m1','m2','m3','m4','m5','m6','m7','m8','m9','m10','m11'].forEach(function(x,k){el(x).classList.toggle('active',k===i);});el('ttl').textContent=['Dash Board','Weekly Calendar','Sales Lead','Security Survey','Tender Lead','Tender Reader','Tender History','Contract Renewal & PI','Communication Formats','Data Repository','Root Cause Analysis (RCA)','CRM Admin'][i];el('subttl').textContent=SUBTITLES[i]||'';el('side').classList.remove('open');[dash,weeklyCalendar,salesLeads,securitySurvey,tenderLeads,tenderReader,oldTenders,contracts_pi,formats,repository,rcaPage,crmAdmin][i]();}

function normTxt(s){return String(s||'').trim().toUpperCase().replace(/\\s+/g,' ');}
function normDept(s){return normTxt(s);}
function tenderYear(t){return (t.publishedDate||t.contractAwardedDate||t.submissionDate||'').slice(0,4)||'Unknown';}
function oldTenderInList(x){
  if(x.recordKind!=='Historical')return false;
  if(!OLD_SHOW_INACT&&x.active===false)return false;
  if(OLD_Q){var q=normDept(OLD_Q);if(normDept(x.clientDept).indexOf(q)<0&&normDept(x.tenderName).indexOf(q)<0)return false;}
  if(OLD_LOC&&normTxt(x.location).indexOf(normTxt(OLD_LOC))<0)return false;
  if(OLD_ST&&normDept(x.state)!==normDept(OLD_ST))return false;
  return true;
}
function matchOldTenders(t,excludeId){var d=normDept(t.clientDept),st=normDept(t.state),loc=normTxt(t.location);return T.filter(function(x){if(x.recordKind!=='Historical'||x.id===excludeId)return false;if(!OLD_SHOW_INACT&&x.active===false)return false;if(OLD_Q){var q=normDept(OLD_Q);if(normDept(x.clientDept).indexOf(q)<0&&normDept(x.tenderName).indexOf(q)<0)return false;}if(OLD_LOC&&normTxt(x.location).indexOf(normTxt(OLD_LOC))<0)return false;if(OLD_ST&&normDept(x.state)!==normDept(OLD_ST))return false;if(!OLD_Q&&!OLD_LOC&&!OLD_ST){if(d&&normDept(x.clientDept)!==d)return false;if(st&&normDept(x.state)!==st)return false;if(loc&&normTxt(x.location)!==loc)return false;}return true;});}
function prevTenders(t,excludeId){return matchOldTenders(t,excludeId).sort(function(a,b){return (b.publishedDate||b.contractAwardedDate||b.submissionDate||'').localeCompare(a.publishedDate||a.contractAwardedDate||a.submissionDate||'');});}
function renderYearHistory(t,excludeId){var prev=prevTenders(t,excludeId);if(!prev.length)return '';var byY={},ys;prev.forEach(function(p){var y=tenderYear(p);if(!byY[y])byY[y]=[];byY[y].push(p);});ys=Object.keys(byY).sort(function(a,b){return b.localeCompare(a);});return '<div style="margin-top:12px;padding:12px;background:#0b1220;border:1px solid #334155;border-radius:10px"><b style="color:#c9a84c">Previous old tender records (year-wise, latest first)</b>'+ys.map(function(y){return '<div style="margin-top:10px"><b style="color:#94a3b8">'+h(y)+'</b><div class="tblwrap" style="margin-top:6px"><table><thead><tr><th>Published</th><th>Tender</th><th>Location</th><th>State</th><th>EMD</th><th>Awarded</th><th>Award Rate</th><th>L1</th><th>Our Pos.</th><th>Our Rate</th><th>Next Tender</th></tr></thead><tbody>'+byY[y].map(function(p){var l1=(p.bidders||[]).find(function(b){return b.rank==='L1';})||{};return '<tr><td>'+h(p.publishedDate)+'</td><td>'+h(p.tenderName)+'</td><td>'+h(p.location)+'</td><td>'+h(p.state)+'</td><td>'+h(p.emd)+'</td><td>'+h(p.contractAwardedDate)+'</td><td>'+h(p.contractAwardedRate)+'</td><td>'+h(p.awardedTo||l1.name)+'</td><td>'+h(p.ourPosition)+'</td><td>'+h(p.ourQuote)+'</td><td>'+h(p.nextProbableDate)+'</td></tr>';}).join('')+'</tbody></table></div></div>';}).join('')+'</div>';}
function tenderRemindersForDay(day){var list=[];if(ROLE!=='admin'&&ROLE!=='coordinator')return list;T.filter(function(t){return t.recordKind!=='Historical'&&tenderInScope(t);}).forEach(function(t){
  var title=(t.tenderName||t.clientDept||'Tender').trim();var sub=t.clientDept?(' — '+t.clientDept):'';
  if(t.prebidMeetingDate===day)list.push({type:'Prebid Meeting',title:title+sub,date:day,notes:t.prebidMeetingVenue||'',mapQ:tenderMapQuery(t,'Prebid Meeting')});
  if(t.emdPreparationDate===day)list.push({type:'EMD Preparation',title:title+sub,date:day,notes:'EMD: '+(t.emd||'—'),mapQ:tenderMapQuery(t,'EMD Preparation')});
  if(t.submissionDate===day)list.push({type:'Tender Submission / Last Date',title:title+sub,date:day,notes:'',mapQ:tenderMapQuery(t,'Submission')});
  if(t.publishedDate===day)list.push({type:'Tender Published',title:title+sub,date:day,notes:'',mapQ:tenderMapQuery(t,'Published')});
});return list;}
function todayReminders(){var td=today(),list=[];
  A.forEach(function(x){if(x.active===false||x.done||x.date!==td||!activityInScope(x))return;var l=findLeadForReminder(x);list.push({src:'Reminder',type:x.type,title:x.company||'(no name)',date:x.date,notes:x.notes||'',mapQ:activityMapQuery(x),fromLead:!!l});});
  tenderRemindersForDay(td).forEach(function(x){list.push({src:'Tender',type:x.type,title:x.title,date:x.date,notes:x.notes,mapQ:x.mapQ||'',fromLead:false});});
  L.forEach(function(l){if(l.leadKind==='Tender'||l.active===false||!leadInScope(l)||l.nextFollowUp!==td||isClosedWon(l.stage)||isClosedLost(l.stage))return;list.push({src:'Sales Lead',type:'Follow-up',title:l.company||'Lead',date:td,notes:l.stage||'',mapQ:leadMapQuery(l),fromLead:true});});
  return list;}
function overdueReminders(){var td=today(),list=[];
  A.forEach(function(x){if(x.active===false||x.done||!x.date||x.date>=td||!activityInScope(x))return;list.push({src:'Reminder',type:x.type,title:x.company||'(no name)',date:x.date,notes:x.notes||''});});
  return list;}
function emptyTender(kind){return {id:nid('tn'),recordKind:kind||'Live',active:true,tenderNo:'',tenderName:'',clientDept:'',location:'',state:'',branch:'',portal:'',typeOfServices:'',contractPeriod:'',minTurnover3yr:'',experienceYears:'',estimatedBidValue:'',evaluationMethod:'',requiredManpower:'',publishedDate:'',prebidMeetingDate:'',prebidMeetingVenue:'',emdPreparationDate:'',submissionDate:'',bidEndDateTime:'',bidValidityFromEnd:'',emd:'',epbgPercent:'',tenderFee:'',scoreMatrix:'',serviceCharge:'',l1TieBreak:'',msePreference:'',ourQuote:'',ourPosition:'',winningQuote:'',contractAwardedRate:'',contractAwardedDate:'',awardedTo:'',allotmentDetails:'',bidders:[{rank:'L1',name:'',quote:''},{rank:'L2',name:'',quote:''},{rank:'L3',name:'',quote:''},{rank:'L4',name:'',quote:''}],competitors:[],loiDate:'',nextProbableDate:'',status:kind==='Historical'?'Closed-Won':'Identified / Under Review',remarks:'',tenderExtract:{},createdAt:new Date().toISOString()};}
function saveTendersOnly(done){
  api('saveTenders',{tenders:T}).then(function(r){
    if(typeof done==='function')done(r);
    else alert(r.s===200?'Tenders saved ✓':(r.j.error||'Could not save tenders.'));
  });
}
function salesLeadsList(){return L.map(function(l,i){return {l:l,i:i};}).filter(function(x){return x.l.leadKind!=='Tender'&&(LEAD_SHOW_INACT||x.l.active!==false);});}
function activeSalesLeads(){return L.filter(function(l){return l.leadKind!=='Tender'&&l.active!==false&&leadInScope(l)&&!isClosedWon(l.stage)&&!isClosedLost(l.stage);});}
function activeTenderLeads(){return T.filter(function(t){return t.recordKind!=='Historical'&&t.active!==false&&tenderInScope(t)&&!isClosedWon(t.status)&&!isClosedLost(t.status);});}

/* Dashboard */
function daysUntil(d,from){if(!d)return 9999;var a=new Date(d+'T00:00:00'),b=new Date((from||today())+'T00:00:00');return Math.round((a-b)/86400000);}
function renewalReminders(){
  var td=today(),list=[];
  if(ROLE==='admin'||ROLE==='coordinator'){
    C.forEach(function(c){if(c.active===false||!c.renewalDate)return;var days=daysUntil(c.renewalDate,td);
      if(days<=30)list.push({client:c.client,place:c.state||'',date:c.renewalDate,days:days,src:'Contract Renewal & PI'});});
  }
  var fu=FU.slice();
  if(ROLE==='branch'&&BRANCH)fu=fu.filter(function(x){return x.branch===BRANCH;});
  fu.forEach(function(x){if(x.active===false||!x.contractRenewalDate)return;var days=daysUntil(x.contractRenewalDate,td);
    if(days<=30)list.push({client:x.client,place:(x.branch||'')+(x.location?(' · '+x.location):''),date:x.contractRenewalDate,days:days,src:'Data Repository'});});
  list.sort(function(a,b){return a.days-b.days;});
  return list;
}
function dash(){
  var td=today();
  var actSales=activeSalesLeads(),actTend=activeTenderLeads();
  var pval=actSales.reduce(function(s,x){return s+(Number(x.estValue)||0);},0);
  var tval=actTend.reduce(function(s,x){return s+(Number(x.ourQuote)||0);},0);
  var wonL=L.filter(function(x){return leadInScope(x)&&isClosedWon(x.stage);}).length;
  var wonT=T.filter(function(x){return tenderInScope(x)&&isClosedWon(x.status);}).length;
  var weekEnd=daysAdd(7);
  var meetWeek=A.filter(function(x){return !x.done&&x.date&&x.date>=td&&x.date<=weekEnd&&activityInScope(x);}).length;
  var tendWeek=actTend.filter(function(x){return x.submissionDate&&x.submissionDate>=td&&x.submissionDate<=weekEnd;}).length;
  var todayList=todayReminders(),overList=overdueReminders(),renewList=renewalReminders();
  var dashSub=ROLE==='branch'&&BRANCH?('Branch dashboard — '+BRANCH+' only'):'Active sales & tender process at a glance';
  var html=pageHdr('Dash Board',dashSub,'<button class="btn blue" onclick="shareOpen(\\'dash\\',0)">📤 Share Dashboard</button>');
  html+='<div class="kgrid">';
  html+='<div class="kpi gold"><b>'+fmtMoney(pval)+'</b><span>Sales Pipeline · '+actSales.length+' active leads</span></div>';
  html+='<div class="kpi"><b>'+wonL+'</b><span>Won Deals · '+wonL+' leads · '+wonT+' tenders won</span></div>';
  if(ROLE==='admin'||ROLE==='coordinator'){
    html+='<div class="kpi blue"><b>'+fmtMoney(tval||actTend.length*100000)+'</b><span>Tender Status Tracker · '+actTend.length+' active tenders</span></div>';
    html+='<div class="kpi"><b>'+(meetWeek+tendWeek)+'</b><span>This Week · '+meetWeek+' meetings · '+tendWeek+' tender deadlines</span></div>';
  }else{
    html+='<div class="kpi blue"><b>'+meetWeek+'</b><span>This Week · meetings & follow-ups</span></div>';
    html+='<div class="kpi"><b>'+renewList.length+'</b><span>Renewal reminders (30 days)</span></div>';
  }
  html+='</div>';
  if(ROLE==='admin'||ROLE==='coordinator'){
    html+='<div class="pipe-tabs"><div class="pipe-tab '+(DASH_PIPE==='sales'?'on':'')+'" onclick="DASH_PIPE=\\'sales\\';dash()">Sales lead Stages</div><div class="pipe-tab '+(DASH_PIPE==='tender'?'on':'')+'" onclick="DASH_PIPE=\\'tender\\';dash()">Tender Status Tracker</div></div>';
  }
  if(DASH_PIPE==='sales'||ROLE==='branch'){
    html+='<div class="card"><b style="color:#fff;font-size:15px">Sales lead Stages</b><div class="stage-grid" style="margin-top:14px">';
    STAGES.forEach(function(st){
      var ls=L.filter(function(l){return l.leadKind!=='Tender'&&l.active!==false&&leadInScope(l)&&mapLeadStage(l.stage)===st;});
      var val=ls.reduce(function(s,x){return s+(Number(x.estValue)||0);},0);
      html+='<div class="stage-box" onclick="LEAD_STAGE=\\''+st+'\\';tab(2)"><span class="dot" style="background:'+(STDOT[st]||'#64748b')+'"></span><span class="nm">'+h(st)+'</span><span class="ct">'+ls.length+'</span>'+(val?'<div class="val">'+fmtMoneyMo(val)+'</div>':'')+'</div>';
    });
    html+='</div><div style="text-align:right;margin-top:12px"><button class="btn grey" style="padding:6px 14px" onclick="tab(2)">View All Sales Lead →</button></div></div>';
  }else{
    html+='<div class="card"><b style="color:#fff;font-size:15px">Tender Status Tracker</b><div class="stage-grid" style="margin-top:14px">';
    TSTATUS.forEach(function(st){
      var ls=actTend.filter(function(t){return mapTenderStatus(t.status)===st;});
      html+='<div class="stage-box" onclick="TEND_FILTER=\\''+st+'\\';tab(4)"><span class="dot" style="background:'+(TDOT[st]||'#60a5fa')+'"></span><span class="nm">'+h(st)+'</span><span class="ct">'+ls.length+'</span></div>';
    });
    html+='</div><div style="text-align:right;margin-top:12px"><button class="btn grey" style="padding:6px 14px" onclick="tab(4)">View All Tender Lead →</button></div></div>';
  }
  html+='<div class="card rem-card" style="margin-top:16px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px"><b style="color:var(--gold2);font-size:16px">📅 Reminders for Today — '+h(td)+'</b><button class="btn grey" style="padding:6px 14px" onclick="tab(1)">Open Weekly Calendar</button></div>';
  html+='<div class="tblwrap"><table><thead><tr><th>Source</th><th>Type</th><th>Client / Tender</th><th>Date</th><th>Notes</th><th>Location</th></tr></thead><tbody>';
  html+=todayList.length?todayList.map(function(r){return '<tr><td>'+h(r.src)+'</td><td class="due"><b>'+h(r.type)+'</b></td><td>'+h(r.title)+'</td><td>'+h(r.date)+'</td><td>'+h(r.notes)+'</td><td>'+renderReminderLocation(r.mapQ,r.fromLead)+'</td></tr>';}).join(''):'<tr><td colspan="6" style="color:var(--muted)">Nothing scheduled for today.</td></tr>';
  if(overList.length)html+='<tr><td colspan="5" class="over" style="padding-top:10px"><b>Overdue ('+overList.length+'):</b> '+overList.slice(0,4).map(function(r){return h(r.type)+' — '+h(r.title);}).join(' · ')+'</td></tr>';
  html+='</tbody></table></div></div>';
  html+='<div class="card" style="border-left:4px solid var(--gold);margin-top:16px"><b style="color:#fff;font-size:16px">Active Sales &amp; Tender Process</b><div style="display:grid;grid-template-columns:1fr '+(ROLE==='admin'||ROLE==='coordinator'?'1fr':'')+';gap:16px;margin-top:14px">';
  html+='<div><b style="color:var(--gold2)">Sales Leads ('+actSales.length+')</b><div class="tblwrap" style="margin-top:8px"><table><thead><tr><th>Company</th><th>Stage</th><th>Next F/U</th></tr></thead><tbody>';
  html+=actSales.length?actSales.slice(0,6).map(function(l){return '<tr><td>'+h(l.company)+'</td><td><span class="stage" style="background:'+(STCOL[l.stage]||'#64748b')+'">'+h(l.stage)+'</span></td><td class="due">'+h(l.nextFollowUp)+'</td></tr>';}).join(''):'<tr><td colspan="3" style="color:var(--muted)">No active sales leads.</td></tr>';
  html+='</tbody></table></div></div>';
  if(ROLE==='admin'||ROLE==='coordinator'){
  html+='<div><b style="color:#60a5fa">Tender Leads ('+actTend.length+')</b><div class="tblwrap" style="margin-top:8px"><table><thead><tr><th>Tender</th><th>Last Date</th><th>Status</th></tr></thead><tbody>';
  html+=actTend.length?actTend.slice(0,6).map(function(t){return '<tr><td>'+h(t.tenderName||t.clientDept)+'</td><td class="'+(t.submissionDate&&t.submissionDate<td?'over':'due')+'">'+fmtDate(t.submissionDate)+'</td><td>'+h(t.status)+'</td></tr>';}).join(''):'<tr><td colspan="3" style="color:var(--muted)">No active tender process.</td></tr>';
  html+='</tbody></table></div></div>';
  }
  html+='</div></div>';
  if(renewList.length){
    html+='<div class="card" style="border-left:4px solid #f59e0b;margin-top:16px"><b style="color:#fde68a;font-size:16px">🔔 Agreement Renewal Reminders (30 days)</b><div class="tblwrap" style="margin-top:10px"><table><thead><tr><th>Client</th><th>Place</th><th>Renewal</th><th>Days Left</th></tr></thead><tbody>';
    html+=renewList.slice(0,8).map(function(r){var cls=r.days<0?'over':'due';var lbl=r.days<0?('Overdue '+Math.abs(r.days)+'d'):(r.days===0?'Today':r.days+' days');return '<tr><td><b>'+h(r.client)+'</b></td><td>'+h(r.place)+'</td><td>'+h(r.date)+'</td><td class="'+cls+'"><b>'+lbl+'</b></td></tr>';}).join('');
    html+='</tbody></table></div></div>';
  }
  el('content').innerHTML=html;
}
function kpi(v,l,c){return '<div class="kpi"><b style="'+(c?'color:'+c:'')+'">'+v+'</b><span>'+l+'</span></div>';}

/* Sales Leads */
function renderLeadEdit(l,i){
  var branchFld=ROLE==='branch'?'<div><label>Branch</label><input value="'+a(l.branch||BRANCH||'')+'" readonly style="opacity:.9"></div>':'<div><label>Branch</label><select onchange="L['+i+'].branch=this.value"><option value="">—</option>'+CRMBRANCHES.map(function(b){return '<option'+(b===(l.branch||'')?' selected':'')+'>'+h(b)+'</option>';}).join('')+'</select></div>';
  var webFld=l.source==='Website'?'<div><label>Website address</label><input type="url" placeholder="https://www.client.com" value="'+a(l.webAddress)+'" oninput="L['+i+'].webAddress=this.value"></div>':'';
  return '<div class="edit-panel"><div style="font-size:12px;color:#94a3b8;margin-bottom:10px;padding:8px;background:#0a1220;border-radius:8px">📌 Recorded by <b style="color:var(--gold2)">'+h(l.recordedBy||OTP_EMAIL||'—')+'</b> on '+h(fmtRecordDate(l.createdAt))+' · Branch: '+h(l.branch||BRANCH||'—')+'</div>'+
    '<div class="trow">'+
    f('Company / Client name',"L["+i+"].company",l.company)+f('Contact Name',"L["+i+"].contactName",l.contactName)+f('Phone',"L["+i+"].phone",l.phone)+
    branchFld+sel('State',"L["+i+"].state",l.state||'',STATELIST)+sel('City',"L["+i+"].city",l.city||'',INDIAN_CITIES)+
    sel('Sector',"L["+i+"].sector",l.sector,SECTORS)+'<div><label>Source</label><select onchange="L['+i+'].source=this.value;salesLeads();LEAD_EDIT='+i+';">'+opt(l.source,SOURCES)+'</select></div>'+webFld+
    '</div>'+
    '<label>Full site address (type complete address)</label><textarea rows="2" oninput="L['+i+'].location=this.value">'+h(l.location)+'</textarea>'+
    renderMapLinks(leadMapQuery(l))+
    '<div class="trow" style="margin-top:10px">'+
    '<div><label>Manpower required</label><input type="number" min="0" step="1" value="'+a(l.manpower||'0')+'" oninput="L['+i+'].manpower=this.value"></div>'+
    '<div><label>Est ₹/month</label><input type="number" min="0" value="'+(l.estValue||0)+'" oninput="L['+i+'].estValue=+this.value"></div>'+
    selStage(i,l)+fd('Next Follow-up',"L["+i+"].nextFollowUp",l.nextFollowUp)+
    f('Assigned to (Branch staff name)',"L["+i+"].assignedTo",l.assignedTo)+
    '</div>'+
    renderOtherSiteCities(l,i)+
    '<label>Requirement / Remarks</label><input value="'+a(l.requirement)+'" oninput="L['+i+'].requirement=this.value">'+
    '<div style="font-size:12px;color:#64748b;margin-top:8px"><b>Tip:</b> If the card shows <em>[Enter company name]</em>, it means this is a new lead at <b>New/RFQ</b> stage — type the client company name above.</div>'+
    '<div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">'+(ROLE==='admin'?'<button class="btn gold" onclick="expLead='+i+';salesLeads()">Sales Intelligence</button>':'')+
    '<button class="btn blue" onclick="event.stopPropagation();startSurveyFromLead('+i+')">🛡️ Security Survey</button>'+
    (ROLE==='admin'?'<button class="btn r" onclick="event.stopPropagation();deleteLeadPermanently('+i+')">🗑 Delete Lead</button>':'')+
    toggleAct('L['+i+']',l.active!==false,'LEAD_EDIT=-1;salesLeads()')+'</div></div>';
}
function salesLeads(){
  var list=salesLeadsList().filter(function(x){
    var l=x.l;
    if(LEAD_STAGE&&l.stage!==LEAD_STAGE)return false;
    if(LEAD_REGION&&!matchQ(l.branch,LEAD_REGION)&&!matchQ(l.location,LEAD_REGION)&&!matchQ(l.state,LEAD_REGION))return false;
    if(LEAD_Q&&!matchQ(l.company,LEAD_Q)&&!matchQ(l.contactName,LEAD_Q)&&!matchQ(l.phone,LEAD_Q)&&!matchQ(l.location,LEAD_Q))return false;
    return true;
  });
  var sub=ROLE==='branch'&&BRANCH?('Record leads for branch: '+BRANCH):'Direct sales pipeline — branch-wise recording';
  var html=pageHdr('Sales Lead',sub,'<button class="btn gold" onclick="addSalesLead()">+ Add Lead</button>');
  html+='<div class="search-row"><input id="leadQ" value="'+a(LEAD_Q)+'" placeholder="Search client, contact, region..." onkeydown="if(event.key===\\'Enter\\'){LEAD_Q=this.value;salesLeads();}"><select id="leadSt" onchange="LEAD_STAGE=this.value;salesLeads()"><option value="">All Stages</option>'+STAGES.map(function(st){return '<option'+(st===LEAD_STAGE?' selected':'')+'>'+h(st)+'</option>';}).join('')+'</select><input id="leadReg" value="'+a(LEAD_REGION)+'" placeholder="Filter by region..." onkeydown="if(event.key===\\'Enter\\'){LEAD_REGION=this.value;salesLeads();}"><button class="btn grey" onclick="LEAD_Q=el(\\'leadQ\\').value;LEAD_REGION=el(\\'leadReg\\').value;salesLeads()">Search</button>'+showInactLbl(LEAD_SHOW_INACT,'LEAD_SHOW_INACT=this.checked;salesLeads()')+'</div>';
  html+='<div class="count-note">'+list.length+' lead'+(list.length===1?'':'s')+' found</div>';
  if(!list.length)html+='<div class="card" style="color:var(--muted);text-align:center;padding:40px">No sales leads yet. Click <b>+ Add Lead</b> to start.</div>';
  list.forEach(function(x){
    var l=x.l,i=x.i,open=LEAD_EDIT===i;
    var dispName=l.company||'[Enter company name]';
    html+='<div class="lead-card'+(open?' open':'')+(l.active===false?' inact':'')+'">';
    html+='<div class="lc-top"><div><div class="lc-name">'+h(dispName)+'</div><div class="lc-loc">'+h(l.location||l.city||l.branch||l.state||'—')+'</div><div style="font-size:11px;color:#64748b;margin-top:4px">'+h(l.branch||'')+(l.recordedBy?' · '+h(l.recordedBy):'')+'</div></div><span class="stage" style="background:'+(STCOL[l.stage]||'#64748b')+'">'+h(l.stage||'New/RFQ')+'</span></div>';
    html+='<div class="lc-meta"><span>👤 '+h(l.contactName||'—')+'</span><span>📞 '+h(l.phone||'—')+'</span><span>👷 '+h(l.manpower||'0')+' guards</span><span>Staff: '+h(l.assignedTo||'—')+'</span></div>';
    if(l.estValue)html+='<div class="lc-val">'+fmtMoneyMo(l.estValue)+'<span>'+h(l.requirement||l.sector||'')+'</span></div>';
    if(leadMapQuery(l))html+='<div style="margin-top:8px">'+renderMapLinks(leadMapQuery(l),true)+'</div>';
    html+=cardActs('LEAD_EDIT='+(open?'-1':i)+';salesLeads()','shareOpen(\\'lead\\','+i+')','L['+i+']',l.active!==false,'LEAD_EDIT=-1;salesLeads()');
    if(open)html+=renderLeadEdit(l,i);
    html+='</div>';
  });
  el('content').innerHTML=html+intelPanel()+savebar('saveLeadsBtn');
}
function addSalesLead(){L.push({id:nid('ld'),leadKind:'Sales',active:true,company:'',branch:BRANCH||'',location:'',state:'',deploymentDate:'',contactName:'',phone:'',email:'',city:'',sector:'Banking',source:'Referral',webAddress:'',requirement:'Manned Guarding',manpower:'0',estValue:0,stage:'New/RFQ',nextFollowUp:today(),surveyDone:false,assignedTo:'',remarks:'',existingRate:'',presentAgency:'',changeReason:'',swot:'',moreSites:'',irritants:'',competitors:[],otherSiteCities:[],aiResearch:'',recordedBy:OTP_EMAIL||'',createdAt:new Date().toISOString()});LEAD_EDIT=L.length-1;salesLeads();}
var expLead=-1;
function intelPanel(){
  if(expLead<0||!L[expLead])return '';
  var i=expLead,l=L[i];
  return '<div class="card" style="border:1px solid var(--gold)"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><b style="color:#fff">🔍 Sales Intelligence — '+h(l.company||'[Enter company name]')+'</b><div style="display:flex;gap:8px"><button class="btn gold" onclick="runLeadAiResearch('+i+')">✨ AI Research &amp; SWOT</button><button class="btn grey" style="padding:4px 10px" onclick="expLead=-1;salesLeads()">Close</button></div></div>'+
    '<div style="font-size:12px;color:#94a3b8;margin:8px 0">Uses company name, website URL &amp; location to research India presence, headquarters &amp; SWOT.</div>'+
    '<div class="trow" style="margin-top:10px">'+
      '<div><label>Website URL</label><input type="url" value="'+a(l.webAddress)+'" oninput="L['+i+'].webAddress=this.value" placeholder="https://..."></div>'+
      '<div><label>Existing Rate (what they pay now)</label><input value="'+a(l.existingRate)+'" oninput="L['+i+'].existingRate=this.value"></div>'+
      '<div><label>Present Agency (incumbent)</label><input value="'+a(l.presentAgency)+'" oninput="L['+i+'].presentAgency=this.value"></div>'+
    '</div>'+
    '<label>Reason for change / unhappiness with existing agency</label><textarea rows="2" oninput="L['+i+'].changeReason=this.value">'+h(l.changeReason)+'</textarea>'+
    '<label>AI Company Research (India presence, HQ, key facts)</label><textarea id="leadAiOut" rows="5" oninput="L['+i+'].aiResearch=this.value">'+h(l.aiResearch)+'</textarea>'+
    '<label>SWOT Analysis (Strengths / Weaknesses / Opportunities / Threats)</label><textarea rows="4" oninput="L['+i+'].swot=this.value">'+h(l.swot)+'</textarea>'+
    '<label>Irritant points to AVOID</label><textarea rows="2" oninput="L['+i+'].irritants=this.value">'+h(l.irritants)+'</textarea>'+
    '<label style="margin-top:10px">Competitor Rates (for Data Repository if lost)</label><div class="tblwrap"><table><thead><tr><th>Competitor</th><th>Rate ₹</th><th></th></tr></thead><tbody>'+
    (l.competitors||[]).map(function(c,ci){return '<tr><td><input value="'+a(c.name)+'" oninput="L['+i+'].competitors['+ci+'].name=this.value"></td><td><input value="'+a(c.quote)+'" oninput="L['+i+'].competitors['+ci+'].quote=this.value"></td><td><button type="button" class="btn grey" style="padding:4px 8px" onclick="L['+i+'].competitors.splice('+ci+',1);salesLeads();expLead='+i+';">✕</button></td></tr>';}).join('')+
    '</tbody></table></div><button type="button" class="btn grey" style="margin-top:6px" onclick="if(!L['+i+'].competitors)L['+i+'].competitors=[];L['+i+'].competitors.push({name:\\'\\',quote:\\'\\'});salesLeads();expLead='+i+';">+ Add Competitor</button>'+
  '</div>';
}

/* Leads legacy alias */
function leads(){salesLeads();}
function addLead(){addSalesLead();}

/* Security Survey & Risk Assessment */
function svPartTotal(sv,part){if(!part||!part.items)return 0;return part.items.reduce(function(s,it){return s+(Number((sv.scores||{})[it.id])||0);},0);}
function svGrandTotal(sv){if(!SURVEY_TPL||!SURVEY_TPL.parts)return 0;return SURVEY_TPL.parts.reduce(function(s,p){return s+svPartTotal(sv,p);},0);}
function svRiskBand(t){if(t<=60)return {level:'Low',colour:'#22c55e'};if(t<=100)return {level:'Moderate',colour:'#f59e0b'};if(t<=140)return {level:'High',colour:'#f97316'};return {level:'Critical',colour:'#ef4444'};}
function emptySurvey(leadId){return {id:nid('sv'),leadId:leadId||'',active:true,company:'',locationName:'',address:'',factoryManager:'',contactPhone:'',contactEmail:'',natureOfBusiness:'',surveyDate:today(),surveyedBy:'',confidentialAccess:'Director / Client only',siteInputs:{clientBrief:'',scopeOfWork:'',existingSecurity:'',proposedShifts:'',sanctionedStrength:'',criticalAssets:'',accessPoints:'',vulnerableAreas:'',clientExpectations:''},siteObservations:'',interviews:svDefaultInterviews(),photos:[],deploymentPlan:'',scores:{},scoreNotes:{},executiveSummary:'',riskAnalysis:'',manningSuggestion:'',uniformRequirements:'',equipmentSuggestions:'',securityRecommendations:'',recommendations:'',siteRequirements:'',contractStart:{},status:'Draft',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};}
function svDefaultInterviews(){return [{personName:'',designation:'',notes:''},{personName:'',designation:'',notes:''},{personName:'',designation:'',notes:''}];}
function svEnsureInputs(si){var sv=SV[si];if(!sv.siteInputs)sv.siteInputs={clientBrief:'',scopeOfWork:'',existingSecurity:'',proposedShifts:'',sanctionedStrength:'',criticalAssets:'',accessPoints:'',vulnerableAreas:'',clientExpectations:''};if(!sv.photos)sv.photos=[];if(!sv.interviews||sv.interviews.length<3)sv.interviews=svDefaultInterviews();}
function svLooksLikeImage(file){if(!file)return false;if(file.type&&file.type.indexOf('image')===0)return true;if(!file.type||file.type==='application/octet-stream')return true;return/\\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name||'');}
function svAddPhotoData(dataUrl,si,type){
  if(si<0||!SV[si])return;
  if(!dataUrl||String(dataUrl).indexOf('data:image/')!==0){alert('Could not save photo — try again.');return;}
  if(svActivePhotoCount(si)>=SV_MAX_PHOTOS){alert('Maximum '+SV_MAX_PHOTOS+' photos.');return;}
  svEnsureInputs(si);
  var lbl=PHOTO_LABELS[type]||'Site Photo';
  SV[si].photos.push({id:nid('ph'),type:type||'site_photo',label:lbl,heading:'',caption:'',dataUrl:dataUrl,takenAt:new Date().toISOString(),active:true});
  securitySurvey();
}
function svCompressPhoto(file,cb){
  if(!svLooksLikeImage(file)){alert('Please choose a photo (JPG or PNG).');return;}
  var r=new FileReader();
  r.onerror=function(){alert('Could not read photo — try Choose from Gallery.');};
  r.onload=function(e){
    var dataUrl=e.target.result;
    var img=new Image();
    img.onerror=function(){
      if(dataUrl&&String(dataUrl).indexOf('data:image/')===0){cb(dataUrl);return;}
      alert('Photo format not supported. On iPhone: Settings → Camera → Formats → Most Compatible.');
    };
    img.onload=function(){
      var c=document.createElement('canvas'),w=img.width,h=img.height,mx=900;
      if(w>mx){h=Math.round(h*mx/w);w=mx;}
      c.width=w;c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      cb(c.toDataURL('image/jpeg',0.6));
    };
    img.src=dataUrl;
  };
  r.readAsDataURL(file);
}
function svPhotoBtn(si,type,mode){
  if(si<0||!SV[si])return;
  if(svActivePhotoCount(si)>=SV_MAX_PHOTOS){alert('Maximum '+SV_MAX_PHOTOS+' photos. Delete or deactivate one first.');return;}
  SV_PHOTO_CTX={si:si,type:type||'site_photo'};
  if(mode==='cam'){
    if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){svCamOpen();return;}
    var inp=el('svPhotoCam');
    if(inp){inp.value='';inp.click();return;}
    alert('Camera not available — use Choose from Gallery.');
    return;
  }
  var gal=el('svPhotoGallery');
  if(gal){gal.value='';gal.click();return;}
  alert('Photo upload not ready — refresh the page.');
}
function svPhotoFromInput(inp){
  if(!inp||!inp.files||!inp.files[0])return;
  var si=SV_PHOTO_CTX.si,type=SV_PHOTO_CTX.type||'site_photo';
  if(si<0||!SV[si])return;
  var f=inp.files[0];
  inp.value='';
  if(f.size>15000000){alert('Photo too large — move closer or use a smaller image.');return;}
  voiceShow('Processing photo…');
  svCompressPhoto(f,function(dataUrl){
    voiceShow('');
    svAddPhotoData(dataUrl,si,type);
  });
}
function svCamOpen(){
  var modal=el('svCamModal'),video=el('svCamVideo');
  if(!modal||!video){var inp=el('svPhotoCam');if(inp){inp.value='';inp.click();}return;}
  if(SV_CAM_STREAM){SV_CAM_STREAM.getTracks().forEach(function(t){t.stop();});SV_CAM_STREAM=null;}
  if(video)video.srcObject=null;
  modal.classList.remove('hidden');
  voiceShow('Opening camera…');
  var opts={video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false};
  navigator.mediaDevices.getUserMedia(opts).then(function(stream){
    SV_CAM_STREAM=stream;
    video.srcObject=stream;
    video.play().catch(function(){});
    voiceShow('');
  }).catch(function(){
    voiceShow('');
    svCamClose();
    var inp=el('svPhotoCam');
    if(inp){inp.value='';inp.click();}
    else alert('Could not open camera. Allow camera permission, or use Gallery.');
  });
}
function svCamClose(){
  var modal=el('svCamModal'),video=el('svCamVideo');
  if(SV_CAM_STREAM){SV_CAM_STREAM.getTracks().forEach(function(t){t.stop();});SV_CAM_STREAM=null;}
  if(video)video.srcObject=null;
  if(modal)modal.classList.add('hidden');
  voiceShow('');
}
function svCamSnap(){
  var video=el('svCamVideo'),canvas=el('svCamCanvas');
  if(!video||!canvas||!video.videoWidth){alert('Camera not ready — wait a second and try again.');return;}
  var w=video.videoWidth,h=video.videoHeight,mx=900;
  if(w>mx){h=Math.round(h*mx/w);w=mx;}
  canvas.width=w;canvas.height=h;
  canvas.getContext('2d').drawImage(video,0,0,w,h);
  var dataUrl=canvas.toDataURL('image/jpeg',0.72);
  svCamClose();
  svAddPhotoData(dataUrl,SV_PHOTO_CTX.si,SV_PHOTO_CTX.type||'site_photo');
}
function svPhotoPickBtn(si,type,text,cls,mode){
  if(svActivePhotoCount(si)>=SV_MAX_PHOTOS)return '<button type="button" class="btn '+cls+' upload-btn" disabled>'+text+'</button>';
  return '<button type="button" class="btn '+cls+' upload-btn" onclick="svPhotoBtn('+si+',\\''+type+'\\',\\''+mode+'\\')">'+text+'</button>';
}
function svActivePhotoCount(si){svEnsureInputs(si);return (SV[si].photos||[]).filter(function(p){return p.active!==false;}).length;}
function voiceShow(msg){var b=el('voiceBanner');if(!b)return;if(msg){b.textContent=msg;b.style.display='block';}else b.style.display='none';}
function voiceInterview(si,idx){
  var ta=el('svInt'+si+'_'+idx);
  if(!ta){alert('Interview box not found — refresh page.');return;}
  voiceStart(ta);
}
function voiceStart(target){
  if(!SPEECH_OK){alert('Speak works in Google Chrome on your phone.');return;}
  voiceStop();
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  VOICE_REC=new SR();
  VOICE_REC.lang='en-IN';
  VOICE_REC.interimResults=false;
  VOICE_REC.continuous=true;
  VOICE_TARGET=target;
  voiceShow('🎤 Listening — speak interview notes. Tap Stop when finished.');
  VOICE_REC.onresult=function(ev){
    if(!VOICE_TARGET)return;
    var txt='';
    for(var i=ev.resultIndex;i<ev.results.length;i++){if(ev.results[i].isFinal)txt+=ev.results[i][0].transcript;}
    txt=txt.trim();
    if(!txt)return;
    var cur=VOICE_TARGET.value||'';
    VOICE_TARGET.value=(cur?cur+' ':'')+txt;
    VOICE_TARGET.dispatchEvent(new Event('input',{bubbles:true}));
  };
  VOICE_REC.onerror=function(e){voiceStop();if(e.error!=='aborted')alert('Could not hear you — move closer to the phone mic.');};
  VOICE_REC.onend=function(){voiceStop();};
  try{VOICE_REC.start();}catch(err){voiceStop();alert('Allow microphone permission in phone settings, then try Speak again.');}
}
function voiceStop(){if(VOICE_REC){try{VOICE_REC.stop();}catch(e){}VOICE_REC=null;}VOICE_TARGET=null;voiceShow('');}
function svRemovePhoto(si,pi){if(!SV[si]||!SV[si].photos)return;if(!confirm('Delete this photo permanently?'))return;SV[si].photos.splice(pi,1);securitySurvey();}
function svTogglePhoto(si,pi){if(!SV[si]||!SV[si].photos||!SV[si].photos[pi])return;SV[si].photos[pi].active=SV[si].photos[pi].active===false;securitySurvey();}
function svPhotoHeading(p){return String(p.heading||p.label||'').trim();}
function svPhotoPlaceholders(type){if(type==='deployment_chart')return 'e.g. Proposed Deployment Chart — Shift A/B/C';return 'e.g. Main Gate, Scrap Yard, Loading Platform';}
function renderPhotoPanel(si){
  svEnsureInputs(si);var photos=SV[si].photos||[],activeN=svActivePhotoCount(si);
  var html='<div class="photo-panel"><h4>📷 Site Photos &amp; Charts <span style="color:var(--muted);font-weight:400">('+activeN+'/'+SV_MAX_PHOTOS+' active)</span></h4>';
  html+='<div style="font-size:12px;color:var(--muted);margin-bottom:10px">Tap <b>Take Photo</b> — camera opens on your phone. Tap <b>Capture</b>, then type the location heading.</div>';
  if(activeN>=SV_MAX_PHOTOS)html+='<div style="font-size:12px;color:#f59e0b;margin-bottom:8px">Maximum '+SV_MAX_PHOTOS+' photos reached — delete or deactivate to add more.</div>';
  html+='<div class="photo-slot"><div style="font-size:12px;color:var(--muted);margin-bottom:8px">📱 Take photo with camera</div>'+svPhotoPickBtn(si,'site_photo','📷 Take Photo','gold','cam')+'</div>';
  html+='<div class="photo-slot"><div style="font-size:12px;color:var(--muted);margin-bottom:8px">🖼 Upload from phone gallery</div>'+svPhotoPickBtn(si,'site_photo','+ Choose Photo from Gallery','blue','gallery')+'</div>';
  html+='<div class="photo-slot"><div style="font-size:12px;color:var(--muted);margin-bottom:8px">📊 Deployment chart</div>'+svPhotoPickBtn(si,'deployment_chart','+ Upload Deployment Chart','blue','gallery')+'</div>';
  html+='<div style="font-size:11px;color:var(--muted);margin:8px 0">Quick tags — then add heading below</div><div class="photo-row">'+svPhotoPickBtn(si,'perimeter','Perimeter','grey','cam')+svPhotoPickBtn(si,'entrance','Entrance','grey','cam')+'</div><div style="margin-top:8px">'+svPhotoPickBtn(si,'cctv','CCTV','grey','cam')+'</div>';
  if(photos.length){
    html+='<div style="margin-top:12px">';
    photos.forEach(function(p,pi){
      var off=p.active===false,cat=PHOTO_LABELS[p.type]||p.type||'Photo',hd=svPhotoHeading(p);
      html+='<div class="photo-item'+(off?' photo-off':'')+'" style="margin-bottom:10px;padding:10px;border:1px solid var(--border);border-radius:8px'+(off?';opacity:.55':'')+'">';
      html+='<img class="photo-thumb" src="'+p.dataUrl+'" alt="">';
      html+='<div style="font-size:10px;color:var(--gold2);margin-top:6px;text-transform:uppercase;letter-spacing:.3px">'+h(cat)+(off?' · Deactivated':'')+'</div>';
      html+='<label style="margin-top:6px">Location / Heading</label>';
      html+='<input class="photo-heading" placeholder="'+a(svPhotoPlaceholders(p.type))+'" value="'+a(p.heading||'')+'" oninput="SV['+si+'].photos['+pi+'].heading=this.value">';
      if(!hd&&!off)html+='<div style="font-size:11px;color:#f59e0b;margin-top:4px">Please type a heading for this photo.</div>';
      html+='<label style="margin-top:6px">Extra notes (optional)</label>';
      html+='<input style="font-size:12px" placeholder="Any extra detail for client report" value="'+a(p.caption)+'" oninput="SV['+si+'].photos['+pi+'].caption=this.value">';
      html+='<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap"><button type="button" class="btn grey" style="padding:4px 8px;font-size:11px" onclick="svTogglePhoto('+si+','+pi+')">'+(off?'Activate':'Deactivate')+'</button><button type="button" class="btn r" style="padding:4px 8px;font-size:11px" onclick="svRemovePhoto('+si+','+pi+')">Delete</button></div></div>';
    });
    html+='</div>';
  }else html+='<div style="font-size:12px;color:var(--muted);margin-top:10px">No photos yet — tap Take Photo above (max '+SV_MAX_PHOTOS+').</div>';
  html+='</div>';return html;
}
function renderSiteInputs(si){
  svEnsureInputs(si);var inp=SV[si].siteInputs;
  return '<div class="input-sec"><h4>📋 Site Brief &amp; Scope (placed above observations in client report)</h4>'+
    '<div class="trow"><div><label>Client Brief</label><textarea rows="2" oninput="SV['+si+'].siteInputs.clientBrief=this.value">'+h(inp.clientBrief)+'</textarea></div><div><label>Scope of Work</label><textarea rows="2" oninput="SV['+si+'].siteInputs.scopeOfWork=this.value">'+h(inp.scopeOfWork)+'</textarea></div></div>'+
    '<div class="trow"><div><label>Existing Security</label><textarea rows="2" oninput="SV['+si+'].siteInputs.existingSecurity=this.value">'+h(inp.existingSecurity)+'</textarea></div><div><label>Proposed Shifts (A/B/C)</label><textarea rows="2" oninput="SV['+si+'].siteInputs.proposedShifts=this.value">'+h(inp.proposedShifts)+'</textarea></div></div>'+
    '<div class="trow"><div><label>Sanctioned Strength</label><input value="'+a(inp.sanctionedStrength)+'" oninput="SV['+si+'].siteInputs.sanctionedStrength=this.value" placeholder="e.g. 12 SG + 2 ASO"></div><div><label>Critical Assets</label><input value="'+a(inp.criticalAssets)+'" oninput="SV['+si+'].siteInputs.criticalAssets=this.value"></div><div><label>Access Points</label><input value="'+a(inp.accessPoints)+'" oninput="SV['+si+'].siteInputs.accessPoints=this.value"></div></div>'+
    '<div class="trow"><div><label>Vulnerable Areas</label><textarea rows="2" oninput="SV['+si+'].siteInputs.vulnerableAreas=this.value">'+h(inp.vulnerableAreas)+'</textarea></div><div><label>Client Expectations</label><textarea rows="2" oninput="SV['+si+'].siteInputs.clientExpectations=this.value">'+h(inp.clientExpectations)+'</textarea></div></div>'+
    '<label>Deployment Plan (text — if no chart image)</label><textarea rows="3" placeholder="Post-wise deployment table: Gate 1 — 2 SG day..." oninput="SV['+si+'].deploymentPlan=this.value">'+h(SV[si].deploymentPlan)+'</textarea></div>';
}
function renderInterviews(si){
  svEnsureInputs(si);
  var html='<div class="input-sec"><h4>🎤 Site Interviews (3 people)</h4>';
  html+='<div style="font-size:12px;color:var(--muted);margin-bottom:10px">Type the name and designation. For notes, tap <b>🎤 Speak</b> — your voice is typed into the box. (Chrome on phone works best.)</div>';
  if(VOICE_REC)html+='<button type="button" class="btn r" style="margin-bottom:10px;padding:4px 12px;font-size:12px" onclick="voiceStop()">■ Stop listening</button>';
  SV[si].interviews.forEach(function(iv,idx){
    html+='<div class="interview-card"><b style="color:var(--gold2)">Interview '+(idx+1)+'</b>';
    html+='<div class="trow"><div><label>Name of person</label><input value="'+a(iv.personName)+'" oninput="SV['+si+'].interviews['+idx+'].personName=this.value" placeholder="e.g. Factory Manager"></div>';
    html+='<div><label>Designation</label><input value="'+a(iv.designation)+'" oninput="SV['+si+'].interviews['+idx+'].designation=this.value" placeholder="e.g. Security In-charge"></div></div>';
    html+='<label>Interview notes <button type="button" class="mic-btn" onclick="voiceInterview('+si+','+idx+')">🎤 Speak</button></label>';
    html+='<textarea id="svInt'+si+'_'+idx+'" rows="4" placeholder="What they told you — security concerns, expectations, incidents..." oninput="SV['+si+'].interviews['+idx+'].notes=this.value">'+h(iv.notes)+'</textarea></div>';
  });
  html+='</div>';
  return html;
}
function startSurveyFromLead(li){var l=L[li];if(!l)return;var ex=SV.findIndex(function(s){return s.leadId===l.id;});if(ex>=0){SV_EDIT=ex;SV_VIEW='edit';SV_TAB='inputs';tab(3);return;}SV.push(emptySurvey(l.id));var i=SV.length-1;SV[i].company=l.company;SV[i].locationName=l.location||l.city||'';SV[i].address=(l.location||'')+(l.state?(', '+l.state):'');SV[i].factoryManager=l.contactName||'';SV[i].contactPhone=l.phone||'';SV[i].contactEmail=l.email||'';SV[i].natureOfBusiness=l.sector||l.requirement||'';SV[i].siteInputs.scopeOfWork=l.requirement||'';SV[i].siteInputs.sanctionedStrength=l.manpower||'';SV_EDIT=i;SV_VIEW='edit';SV_TAB='inputs';tab(3);}
function setScore(si,itemId,val){if(!SV[si].scores)SV[si].scores={};SV[si].scores[itemId]=val;securitySurvey();}
function renderScoreRow(si,item){var sc=(SV[si].scores||{})[item.id]||0,note=(SV[si].scoreNotes||{})[item.id]||'';var btns=[0,1,2,3,4,5].map(function(n){return '<button type="button" class="score-btn'+(sc===n?' on':'')+'" onclick="event.stopPropagation();setScore('+si+',\\''+item.id+'\\','+n+')">'+n+'</button>';}).join('');return '<div class="check-item"><div style="font-weight:600;color:#fff;font-size:13px">'+h(item.label)+'</div>'+(item.hint?'<div style="font-size:11px;color:var(--muted);margin-top:2px">'+h(item.hint)+'</div>':'')+'<div class="score-btns">'+btns+'</div><input style="margin-top:6px" placeholder="Notes (optional)" value="'+a(note)+'" oninput="if(!SV['+si+'].scoreNotes)SV['+si+'].scoreNotes={};SV['+si+'].scoreNotes[\\''+item.id+'\\']=this.value"></div>';}
function renderSurveyEdit(si){
  var sv=SV[si],total=svGrandTotal(sv),band=svRiskBand(total),parts=SURVEY_TPL&&SURVEY_TPL.parts?SURVEY_TPL.parts:[];
  var html='<div class="card"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;align-items:center"><div><b style="color:#fff;font-size:18px">'+h(sv.company||'(New Survey)')+'</b><div style="font-size:12px;color:var(--muted);margin-top:4px">Agile Security Survey &amp; Risk Assessment · CONFIDENTIAL</div></div><span class="risk-pill" style="background:'+band.colour+'22;color:'+band.colour+';border:1px solid '+band.colour+'">Score '+total+'/180 · '+band.level+'</span></div>';
  html+='<div class="survey-tabs"><div class="survey-tab '+(SV_TAB==='inputs'?'on':'')+'" onclick="SV_TAB=\\'inputs\\';securitySurvey()">Site Inputs &amp; Photos</div><div class="survey-tab '+(SV_TAB==='checklist'?'on':'')+'" onclick="SV_TAB=\\'checklist\\';securitySurvey()">Risk Checklist (0–5)</div><div class="survey-tab '+(SV_TAB==='report'?'on':'')+'" onclick="SV_TAB=\\'report\\';securitySurvey()">Professional Report</div><div class="survey-tab '+(SV_TAB==='contract'?'on':'')+'" onclick="SV_TAB=\\'contract\\';securitySurvey()">Contract Start</div></div>';
  if(SV_TAB==='inputs'){
    html+='<div class="trow"><div><label>Company</label><input value="'+a(sv.company)+'" oninput="SV['+si+'].company=this.value"></div><div><label>Location Name</label><input value="'+a(sv.locationName)+'" oninput="SV['+si+'].locationName=this.value"></div><div><label>Survey Date</label><input type="date" value="'+a(sv.surveyDate)+'" oninput="SV['+si+'].surveyDate=this.value"></div></div>';
    html+='<div class="trow"><div><label>Address</label><input value="'+a(sv.address)+'" oninput="SV['+si+'].address=this.value"></div><div><label>Factory Manager</label><input value="'+a(sv.factoryManager)+'" oninput="SV['+si+'].factoryManager=this.value"></div><div><label>Contact Phone</label><input value="'+a(sv.contactPhone)+'" oninput="SV['+si+'].contactPhone=this.value"></div></div>';
    html+='<div class="trow"><div><label>Email</label><input value="'+a(sv.contactEmail)+'" oninput="SV['+si+'].contactEmail=this.value"></div><div><label>Nature of Business</label><input value="'+a(sv.natureOfBusiness)+'" oninput="SV['+si+'].natureOfBusiness=this.value"></div><div><label>Surveyed By</label><input value="'+a(sv.surveyedBy)+'" oninput="SV['+si+'].surveyedBy=this.value"></div></div>';
    html+='<div class="survey-cols"><div>'+renderSiteInputs(si)+renderInterviews(si)+'<label>Site observations (day &amp; evening visit)</label><textarea rows="4" oninput="SV['+si+'].siteObservations=this.value">'+h(sv.siteObservations)+'</textarea></div>'+renderPhotoPanel(si)+'</div>';
  }else if(SV_TAB==='checklist'){
    html+='<div style="font-size:12px;color:var(--muted);margin-bottom:12px">Score each item 0 (low risk) to 5 (high risk). Add photos on <b>Site Inputs &amp; Photos</b> tab.</div>';
    html+='<div class="survey-cols"><div>';
    parts.forEach(function(part){
      var pt=svPartTotal(sv,part);
      html+='<div class="card" style="margin-top:12px;padding:14px"><b style="color:var(--gold2)">'+h(part.title)+'</b> <span style="color:var(--muted);font-size:12px">('+pt+' / '+part.maxTotal+')</span>';
      part.items.forEach(function(it){html+=renderScoreRow(si,it);});
      html+='</div>';
    });
    html+='</div>'+renderPhotoPanel(si)+'</div>';
  }else if(SV_TAB==='report'){
    html+='<div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn gold" onclick="generateSurveyAi('+si+')">✨ Generate Professional Report</button><button class="btn blue" onclick="openClientReport('+si+')">📄 Client Report (Print / PDF)</button><button class="btn blue" onclick="shareOpen(\\'survey\\','+si+')">📤 Share by Email</button><button class="btn grey" onclick="SV['+si+'].status=\\'Completed\\';securitySurvey()">Mark Completed</button></div>';
    html+='<label>Scientific Risk Analysis</label><textarea rows="5" oninput="SV['+si+'].riskAnalysis=this.value">'+h(sv.riskAnalysis)+'</textarea>';
    html+='<label>Executive Summary (for client)</label><textarea rows="5" oninput="SV['+si+'].executiveSummary=this.value">'+h(sv.executiveSummary)+'</textarea>';
    html+='<label>Recommended Manning (ASO / LSG / SG — shifts A, B, C)</label><textarea rows="5" oninput="SV['+si+'].manningSuggestion=this.value">'+h(sv.manningSuggestion)+'</textarea>';
    html+='<label>Uniform &amp; Grooming Requirements</label><textarea rows="5" oninput="SV['+si+'].uniformRequirements=this.value">'+h(sv.uniformRequirements)+'</textarea>';
    html+='<label>Equipment &amp; Security Infrastructure</label><textarea rows="4" oninput="SV['+si+'].equipmentSuggestions=this.value">'+h(sv.equipmentSuggestions)+'</textarea>';
    html+='<label>Security Professional Recommendations</label><textarea rows="5" oninput="SV['+si+'].securityRecommendations=this.value">'+h(sv.securityRecommendations)+'</textarea>';
    html+='<label>Additional Recommendations</label><textarea rows="3" oninput="SV['+si+'].recommendations=this.value">'+h(sv.recommendations)+'</textarea>';
    html+='<label>Client-Specific Requirements</label><textarea rows="3" oninput="SV['+si+'].siteRequirements=this.value">'+h(sv.siteRequirements)+'</textarea>';
    html+='<div style="font-size:12px;color:var(--muted);margin-top:8px">Use <b>Client Report</b> for polished PDF to send to client · security@agilegroup.co.in</div>';
  }else{
    var steps=SURVEY_TPL&&SURVEY_TPL.contractStart?SURVEY_TPL.contractStart:[];
    html+='<div style="font-size:13px;color:var(--muted);margin-bottom:12px">12-step checklist when taking over a new site (from Agile Contract Start Process).</div>';
    steps.forEach(function(st){
      if(!sv.contractStart)sv.contractStart={};
      if(!sv.contractStart[st.id])sv.contractStart[st.id]={done:false,notes:'',date:''};
      var row=sv.contractStart[st.id];
      html+='<div class="card" style="margin-bottom:10px;padding:14px"><label style="display:flex;align-items:center;gap:8px;text-transform:none;font-size:14px;color:#fff"><input type="checkbox" style="width:auto"'+(row.done?' checked':'')+' onchange="SV['+si+'].contractStart[\\''+st.id+'\\'].done=this.checked;securitySurvey()"> <b>'+h(st.title)+'</b></label><ul style="margin:8px 0 8px 20px;color:var(--muted);font-size:12px">'+st.bullets.map(function(b){return '<li>'+h(b)+'</li>';}).join('')+'</ul><input placeholder="Notes for this step" value="'+a(row.notes)+'" oninput="SV['+si+'].contractStart[\\''+st.id+'\\'].notes=this.value"><input type="date" style="margin-top:6px" value="'+a(row.date)+'" oninput="SV['+si+'].contractStart[\\''+st.id+'\\'].date=this.value"></div>';
    });
  }
  html+='<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn grey" onclick="SV_VIEW=\\'list\\';SV_EDIT=-1;securitySurvey()">← Back to list</button>'+btnShare('shareOpen(\\'survey\\','+si+')')+toggleAct('SV['+si+']',sv.active!==false,'SV_VIEW=\\'list\\';SV_EDIT=-1;securitySurvey()')+'</div></div>';
  return html;
}
function generateSurveyAi(si){
  var sv=SV[si];if(!sv)return;
  if(!confirm('Generate professional report from checklist & site inputs?'))return;
  var btn=event&&event.target; if(btn){btn.disabled=true;btn.textContent='Generating…';}
  api('generateSurveyAi',{survey:sv}).then(function(res){
    if(btn){btn.disabled=false;btn.textContent='✨ Generate Professional Report';}
    if(res.s!==200){alert(res.j.error||'Could not generate report.');return;}
    sv.executiveSummary=res.j.executiveSummary||'';sv.riskAnalysis=res.j.riskAnalysis||'';sv.manningSuggestion=res.j.manning||'';sv.equipmentSuggestions=res.j.equipment||'';sv.uniformRequirements=res.j.uniformRequirements||'';sv.securityRecommendations=res.j.securityRecommendations||'';sv.recommendations=res.j.recommendations||'';
    SV_TAB='report';securitySurvey();
    alert(res.j.aiUsed?'Professional report generated ✓':'Report generated (built-in rules — add OPENAI_API_KEY for full AI).');
  });
}
function openClientReport(si){
  var sv=SV[si];if(!sv)return;
  api('saveSurveys',{surveys:SV}).then(function(saveRes){
    if(saveRes.s!==200){alert(saveRes.j.error||'Please save survey first.');return null;}
    return api('surveyClientReport',{surveyId:sv.id});
  }).then(function(res){
    if(!res)return;
    if(res.s!==200){alert(res.j.error||'Could not build report.');return;}
    var w=window.open('','_blank');if(!w){alert('Please allow pop-ups to open client report.');return;}
    w.document.write(res.j.html);w.document.close();
  });
}
function securitySurvey(){
  if(SV_VIEW==='edit'&&SV_EDIT>=0&&SV[SV_EDIT]){el('content').innerHTML=renderSurveyEdit(SV_EDIT)+savebar('saveSurveysBtn');return;}
  var html=pageHdr('Security Survey &amp; Risk Assessment','Professional client-ready reports · Photos · Deployment chart · 0–180 risk score','<button class="btn gold" onclick="SV.push(emptySurvey(\\'\\'));SV_EDIT=SV.length-1;SV_VIEW=\\'edit\\';SV_TAB=\\'inputs\\';securitySurvey()">+ Add Survey</button>');
  html+='<div style="margin-bottom:12px">'+showInactLbl(SV_SHOW_INACT,'SV_SHOW_INACT=this.checked;securitySurvey()')+'</div>';
  var svList=SV.map(function(s,i){return {s:s,i:i};}).filter(function(x){return SV_SHOW_INACT||x.s.active!==false;});
  html+='<div class="count-note">'+svList.length+' survey'+(svList.length===1?'':'s')+' saved</div>';
  if(!svList.length)html+='<div class="card" style="text-align:center;padding:40px;color:var(--muted)">No surveys yet. Start from a <b>Sales Lead</b> or click <b>+ Add Survey</b>.</div>';
  svList.forEach(function(x){
    var sv=x.s,i=x.i,total=svGrandTotal(sv),band=svRiskBand(total);
    html+='<div class="lead-card'+(sv.active===false?' inact':'')+'"><div class="lc-top"><div><div class="lc-name">'+h(sv.company||'(unnamed)')+'</div><div class="lc-loc">'+h(sv.locationName||sv.address||'—')+' · '+fmtDate(sv.surveyDate)+'</div></div><span class="risk-pill" style="background:'+band.colour+'22;color:'+band.colour+'">'+total+'/180 · '+band.level+'</span></div><div style="font-size:12px;color:var(--muted);margin-top:8px">Status: '+h(sv.status)+' · '+(sv.active===false?'Inactive · ':'')+'Surveyed by: '+h(sv.surveyedBy||'—')+'</div>';
    html+=cardActs('SV_EDIT='+i+';SV_VIEW=\\'edit\\';SV_TAB=\\'inputs\\';securitySurvey()','shareOpen(\\'survey\\','+i+')','SV['+i+']',sv.active!==false,'SV_VIEW=\\'list\\';SV_EDIT=-1;securitySurvey()');
    html+='</div>';
  });
  el('content').innerHTML=html+savebar('saveSurveysBtn');
}
function saveSurveys(){api('saveSurveys',{surveys:SV}).then(function(r){if(r.s===200){alert('Security surveys saved ✓');if(r.j.count)login();}else alert(r.j.error||'Error');});}

/* Tenders */
function tenderPanelId(i){return i==null||i<0?'top':String(i);}
function tenderReaderBlock(list){
  return '<div class="card" style="margin-bottom:18px;border:3px solid #3b82f6;background:#0a1628">'+
    '<b style="color:#60a5fa;font-size:18px">📋 Tender Notice Reader</b>'+
    '<div style="color:#93c5fd;font-size:14px;margin:8px 0 12px">Upload → preview → <b>Read</b> fills Agile tender format → edit &amp; verify → <b>Add to Tender Lead</b> creates a <b>new</b> tender (Organisation Name becomes tender title). Use <b>Clear</b> buttons to remove document or fields.</div>'+
    tenderNoticePanel('top')+tenderCompareInlineHtml()+'</div>';
}
function tenderCompareInlineHtml(){
  return '<div style="margin-top:16px;padding-top:14px;border-top:1px solid #334155">'+
    '<b style="color:#fbbf24;font-size:16px">⚖ Compare Old vs New Document</b>'+
    '<div style="color:#94a3b8;font-size:12px;margin:6px 0 10px">Upload (max <b>4 MB</b>) or <b>paste tender text</b> below. Click <b>Read</b> when ready — or <b>Compare</b> / <b>Find</b> will read for you (faster than before).</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">'+
    '<button type="button" class="btn grey" style="padding:6px 12px;font-size:12px" onclick="tenderClearCompare(\\'all\\')">Clear Both Documents</button>'+
    '<span id="cmpReadStatus" style="font-size:11px;color:var(--muted);align-self:center"></span></div>'+
    '<div class="cmp-cols">'+
    '<div class="cmp-doc-box"><b style="color:#f87171">📄 Old Document</b>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">'+
    '<label class="btn grey" style="cursor:pointer;margin:0;padding:6px 12px;font-size:12px">📎 Upload<input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" style="display:none" onchange="tenderCmpUpload(\\'old\\',this)"></label>'+
    '<button type="button" class="btn grey" style="padding:6px 12px;font-size:12px" onclick="tenderCmpRead(\\'old\\')">Read</button>'+
    '<button type="button" class="btn grey" style="padding:6px 12px;font-size:12px" onclick="tenderClearCompare(\\'old\\')">Clear</button>'+
    '<span id="cmpOldLbl" style="font-size:11px;color:var(--muted);align-self:center"></span></div>'+
    '<textarea id="cmpOldPaste" style="min-height:100px;font-size:14px" placeholder="Paste OLD tender text here (open PDF → Ctrl+A → Ctrl+C → paste)…" oninput="tenderCmpPasteInput(\\'old\\')"></textarea>'+
    '<div id="cmpDocPreviewOld" class="cmp-preview-box"><div style="padding:30px;text-align:center;color:#64748b;font-size:13px">Upload old document to see preview</div></div>'+
    '<div id="cmpTextPreviewOld" class="cmp-text-preview" style="display:none"></div></div>'+
    '<div class="cmp-doc-box"><b style="color:#4ade80">📄 New Document</b>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">'+
    '<label class="btn grey" style="cursor:pointer;margin:0;padding:6px 12px;font-size:12px">📎 Upload<input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" style="display:none" onchange="tenderCmpUpload(\\'new\\',this)"></label>'+
    '<button type="button" class="btn grey" style="padding:6px 12px;font-size:12px" onclick="tenderCmpRead(\\'new\\')">Read</button>'+
    '<button type="button" class="btn grey" style="padding:6px 12px;font-size:12px" onclick="tenderClearCompare(\\'new\\')">Clear</button>'+
    '<span id="cmpNewLbl" style="font-size:11px;color:var(--muted);align-self:center"></span></div>'+
    '<textarea id="cmpNewPaste" style="min-height:100px;font-size:14px" placeholder="Paste NEW tender text here (open PDF → Ctrl+A → Ctrl+C → paste)…" oninput="tenderCmpPasteInput(\\'new\\')"></textarea>'+
    '<div id="cmpDocPreviewNew" class="cmp-preview-box"><div style="padding:30px;text-align:center;color:#64748b;font-size:13px">Upload new document to see preview</div></div>'+
    '<div id="cmpTextPreviewNew" class="cmp-text-preview" style="display:none"></div></div></div>'+
    '<div class="cmp-search-bar">'+
    '<b style="color:#fff;font-size:13px">🔎 Search BOTH documents together</b>'+
    '<div class="tn-search-row" style="margin-top:8px">'+
    '<input id="cmpSearch" placeholder="Type word or sentence — searches Old + New together (like Find)…" onkeydown="if(event.key===\\'Enter\\'){tenderCmpSearch();event.preventDefault();}">'+
    '<button type="button" class="btn grey" style="padding:6px 12px;font-size:12px" onclick="tenderCmpSearch()">Find</button>'+
    '<button type="button" class="btn grey" style="padding:6px 12px;font-size:12px" onclick="tenderCmpSearchNext(-1)">◀ Prev</button>'+
    '<button type="button" class="btn grey" style="padding:6px 12px;font-size:12px" onclick="tenderCmpSearchNext(1)">Next ▶</button>'+
    '<span class="tn-search-meta" id="cmpSearchMeta"></span></div>'+
    '<div class="cmp-search-hint">Tip: Press <b>Cmd+F</b> (Mac) or <b>Ctrl+F</b> (Windows) while on this page — cursor jumps here and searches <b>both</b> documents.</div></div>'+
    '<div style="margin-top:12px"><button type="button" class="btn gold" style="min-height:48px;font-size:16px" onclick="tenderRunCompareInline()">⚖ Compare &amp; Show Differences</button></div>'+
    '<div id="cmpInlineResult" style="margin-top:12px"></div></div>';
}
function tenderCmpInitFindHook(){
  if(window._cmpFindHook)return;
  window._cmpFindHook=true;
  document.addEventListener('keydown',function(e){
    if((e.metaKey||e.ctrlKey)&&String(e.key).toLowerCase()==='f'){
      var cmpS=el('cmpSearch');
      if(cmpS&&cmpS.offsetParent!==null){
        e.preventDefault();
        cmpS.focus();
        try{cmpS.select();}catch(err){}
      }
    }
  });
}
function tenderCmpReleaseBlob(slot){
  if(CMP_BLOB_URLS[slot]){try{URL.revokeObjectURL(CMP_BLOB_URLS[slot]);}catch(e){}CMP_BLOB_URLS[slot]='';}
}
function tenderCmpPumpRead(){
  if(CMP_READ_BUSY||!CMP_READ_QUEUE.length)return;
  CMP_READ_BUSY=true;
  var slot=CMP_READ_QUEUE.shift();
  tenderCmpReadAsync(slot,function(){CMP_READ_BUSY=false;tenderCmpPumpRead();});
}
function tenderCmpQueueRead(slot){
  if(CMP_READ_QUEUE.indexOf(slot)<0)CMP_READ_QUEUE.push(slot);
  tenderCmpPumpRead();
}
function tenderCmpHasSearchText(slot){
  return !!(CMP_PREVIEW[slot]&&CMP_PREVIEW[slot].paras&&CMP_PREVIEW[slot].paras.length);
}
function tenderCmpCanRead(slot){
  var paste=el(slot==='old'?'cmpOldPaste':'cmpNewPaste');
  var text=(paste&&paste.value||'').trim();
  var file=slot==='old'?CMP_OLD_FILE:CMP_NEW_FILE;
  return (file&&file.b64)||text.length>=40;
}
function tenderCmpPasteInput(slot){
  if(CMP_PASTE_TIMERS[slot])clearTimeout(CMP_PASTE_TIMERS[slot]);
  CMP_PASTE_TIMERS[slot]=setTimeout(function(){
    var paste=el(slot==='old'?'cmpOldPaste':'cmpNewPaste');
    var text=(paste&&paste.value||'').trim();
    if(text.length>=40)tenderCmpSetSourceText(slot,text,true);
  },450);
}
function tenderCmpReadAsync(slot,cb){
  var paste=el(slot==='old'?'cmpOldPaste':'cmpNewPaste');
  var text=(paste&&paste.value||'').trim();
  var file=slot==='old'?CMP_OLD_FILE:CMP_NEW_FILE;
  if(tenderCmpHasSearchText(slot)){if(cb)cb(true);return;}
  if(text.length>=40&&!(file&&file.b64)){tenderCmpSetSourceText(slot,text);if(cb)cb(true);return;}
  var body={};
  if(file&&file.b64){body={fileName:file.name,mimeType:file.mime,fileBase64:file.b64};}
  else if(text.length>=40){body={text:text};}
  else{if(cb)cb(false);return;}
  var lbl=el(slot==='old'?'cmpOldLbl':'cmpNewLbl');
  var st=el('cmpReadStatus');
  if(lbl)lbl.textContent='Reading…';
  if(st)st.textContent='Reading '+(slot==='old'?'old':'new')+' document…';
  api('readTenderText',body).then(function(res){
    if(lbl)lbl.textContent=file?('✓ '+file.name):(text.length+' chars');
    if(st)st.textContent='';
    if(res.s!==200){if(cb)cb(false);return;}
    if(res.j.sourceText){
      tenderCmpSetSourceText(slot,res.j.sourceText);
      if(file&&file.b64)file.b64='';
      if(slot==='old'&&CMP_OLD_FILE)CMP_OLD_FILE.b64='';
      if(slot==='new'&&CMP_NEW_FILE)CMP_NEW_FILE.b64='';
    }
    if(cb)cb(true);
  }).catch(function(){if(lbl)lbl.textContent='';if(st)st.textContent='';if(cb)cb(false);});
}
function tenderCmpEnsureReady(done){
  ['old','new'].forEach(function(slot){
    if(tenderCmpHasSearchText(slot))return;
    var paste=el(slot==='old'?'cmpOldPaste':'cmpNewPaste');
    var text=(paste&&paste.value||'').trim();
    if(text.length>=40)tenderCmpSetSourceText(slot,text,true);
  });
  var need=[];
  if(!tenderCmpHasSearchText('old')&&tenderCmpCanRead('old'))need.push('old');
  if(!tenderCmpHasSearchText('new')&&tenderCmpCanRead('new'))need.push('new');
  if(!need.length){if(done)done();return;}
  var st=el('cmpReadStatus');if(st)st.textContent='Reading documents for search… please wait.';
  var i=0;
  function step(){
    if(i>=need.length){if(st)st.textContent='';if(done)done();return;}
    tenderCmpReadAsync(need[i++],step);
  }
  step();
}
function tenderCmpAutoReadSlot(slot){
  if(tenderCmpCanRead(slot)&&!tenderCmpHasSearchText(slot))tenderCmpQueueRead(slot);
}
function tenderRenderCmpDocPreview(slot){
  var box=el(slot==='old'?'cmpDocPreviewOld':'cmpDocPreviewNew');
  var p=CMP_PREVIEW[slot];
  if(!box)return;
  if(!p){box.innerHTML='<div style="padding:30px;text-align:center;color:#64748b;font-size:13px">Upload '+(slot==='old'?'old':'new')+' document to see preview</div>';return;}
  var mime=p.mime||'',name=(p.name||p.fileName||'').toLowerCase();
  var previewUrl=p.blobUrl||p.dataUrl||'';
  if((p.size||0)>TEND_PREVIEW_MAX||!previewUrl){
    box.innerHTML='<div style="padding:20px;text-align:center;color:#334155;background:#f1f5f9;border-radius:8px"><div style="font-size:28px">📄</div><b>'+h(p.name||p.fileName||'Document')+'</b><div style="font-size:12px;margin-top:8px;color:#64748b">Large file — reading text for search (preview skipped to save memory).</div></div>';
    return;
  }
  if(mime.indexOf('pdf')>=0||name.endsWith('.pdf')){
    box.innerHTML='<iframe src="'+a(previewUrl)+'" title="Compare PDF"></iframe>';
  }else if(mime.indexOf('image/')===0||name.endsWith('.jpg')||name.endsWith('.jpeg')||name.endsWith('.png')||name.endsWith('.webp')){
    box.innerHTML='<img src="'+a(previewUrl)+'" alt="Compare document">';
  }else{
    box.innerHTML='<div style="padding:24px;text-align:center;color:#334155;background:#f1f5f9;border-radius:8px"><div style="font-size:32px">📄</div><b>'+h(p.name||p.fileName||'Document')+'</b><div style="font-size:12px;margin-top:8px">Reading text for search…</div></div>';
  }
}
function tenderCmpSetSourceText(slot,text,skipSearch){
  if(!CMP_PREVIEW[slot])CMP_PREVIEW[slot]={};
  CMP_PREVIEW[slot].sourceText=text;
  CMP_PREVIEW[slot].paras=tenderBuildParas(text);
  tenderCmpRenderTextPreview(slot);
  if(!skipSearch){var q=el('cmpSearch');if(q&&q.value)tenderCmpSearchRun(q.value.trim());}
}
function tenderCmpRenderTextPreview(slot){
  var tx=el(slot==='old'?'cmpTextPreviewOld':'cmpTextPreviewNew');
  if(!tx)return;
  var prev=CMP_PREVIEW[slot];
  if(!prev||!prev.paras||!prev.paras.length){tx.style.display='none';tx.innerHTML='';return;}
  var label=slot==='old'?'OLD':'NEW';
  var cls=slot==='old'?'old':'new';
  tx.style.display='block';
  var paras=prev.paras,shown=paras.length>CMP_PREVIEW_MAX_PARAS?paras.slice(0,CMP_PREVIEW_MAX_PARAS):paras;
  var note=paras.length>CMP_PREVIEW_MAX_PARAS?'<div style="font-size:12px;color:#64748b;padding:8px 0;border-bottom:1px solid #e2e8f0;margin-bottom:6px">Showing first '+CMP_PREVIEW_MAX_PARAS+' lines — use <b>Search</b> to find text in the full document.</div>':'';
  tx.innerHTML='<span class="cmp-preview-label '+cls+'">'+label+' — searchable text</span>'+note+
    shown.map(function(p,i){return '<div class="tn-para cmp-para" id="cmpPara_'+slot+'_'+i+'">'+h(p)+'</div>';}).join('');
}
function tenderCmpRead(slot){
  tenderCmpReadAsync(slot,function(ok){
    if(!ok)alert('Please upload or paste the '+(slot==='old'?'old':'new')+' document first (at least a few lines).');
  });
}
function tenderCmpReadBoth(){
  if(!tenderCmpCanRead('old')||!tenderCmpCanRead('new')){alert('Please upload or paste BOTH old and new documents first.');return;}
  tenderCmpQueueRead('old');
  tenderCmpQueueRead('new');
}
function tenderCmpSearch(){
  var qInp=el('cmpSearch'),meta=el('cmpSearchMeta');
  var q=(qInp&&qInp.value||'').trim();
  if(!q){if(meta)meta.textContent='';return;}
  tenderCmpEnsureReady(function(){tenderCmpSearchRun(q);});
}
function tenderCmpSearchRun(q){
  var meta=el('cmpSearchMeta');
  var hasText=tenderCmpHasSearchText('old')||tenderCmpHasSearchText('new');
  if(!hasText){if(meta)meta.textContent='No text yet — upload or paste documents';return;}
  var qlow=q.toLowerCase(),hits=[];
  ['old','new'].forEach(function(slot){
    var prev=CMP_PREVIEW[slot];if(!prev||!prev.paras)return;
    prev.paras.forEach(function(p,i){
      var plow=p.toLowerCase(),pos=0;
      while((pos=plow.indexOf(qlow,pos))>=0){hits.push({slot:slot,para:i,start:pos,end:pos+q.length});pos+=q.length||1;}
    });
  });
  CMP_SEARCH={q:q,hits:hits,idx:0};
  ['old','new'].forEach(function(slot){
    var prev=CMP_PREVIEW[slot];if(!prev||!prev.paras)return;
    prev.paras.forEach(function(p,i){
      var node=el('cmpPara_'+slot+'_'+i);if(!node)return;
      var phits=hits.filter(function(h){return h.slot===slot&&h.para===i;}).sort(function(a,b){return b.start-a.start;});
      var marked=p;
      phits.forEach(function(h){
        marked=marked.slice(0,h.start)+'<mark class="tn-mark">'+h(marked.slice(h.start,h.end))+'</mark>'+marked.slice(h.end);
      });
      node.innerHTML=marked;node.classList.remove('hl','srch');
    });
  });
  if(hits.length){
    var h0=hits[0],n0=el('cmpPara_'+h0.slot+'_'+h0.para);
    if(n0){n0.classList.add('srch');try{n0.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){n0.scrollIntoView(true);}}
    if(meta)meta.textContent='1 / '+hits.length+' (both docs)'+(h0.para>=CMP_PREVIEW_MAX_PARAS?' — scroll preview or refine search':'');
  }else{if(meta)meta.textContent='Not found in either document';}
}
function tenderCmpSearchNext(dir){
  var st=CMP_SEARCH;if(!st||!st.hits||!st.hits.length)return;
  st.idx=(st.idx+(dir||1)+st.hits.length)%st.hits.length;
  var h=st.hits[st.idx],meta=el('cmpSearchMeta');
  document.querySelectorAll('.cmp-para').forEach(function(n){n.classList.remove('hl','srch');});
  var n=el('cmpPara_'+h.slot+'_'+h.para);
  if(n){n.classList.add('srch');try{n.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){n.scrollIntoView(true);}}
  if(meta)meta.textContent=(st.idx+1)+' / '+st.hits.length+' ('+(h.slot==='old'?'Old':'New')+')';
}
function crmAdmin(){
  var html=pageHdr('CRM Admin','Director administration & quick access','<button type="button" class="btn blue" onclick="addTender(\\'Live\\')">+ Add Tender</button>');
  html+='<div style="font-size:13px;color:#94a3b8;margin-bottom:14px">Quick access to tender pipeline, reader, history, RCA, and communication formats.</div>';
  html+='<div class="card"><b style="color:#fff">Quick links</b><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">'+
    '<button type="button" class="btn grey" onclick="tab(4)">📄 Tender Lead</button>'+
    '<button type="button" class="btn grey" onclick="tab(5)">🔍 Tender Reader</button>'+
    '<button type="button" class="btn grey" onclick="tab(6)">📁 Tender History</button>'+
    '<button type="button" class="btn grey" onclick="tab(10)">🔬 Root Cause Analysis</button>'+
    '<button type="button" class="btn grey" onclick="tab(8)">✉️ Communication Formats</button></div></div>';
  el('content').innerHTML=html+savebar('saveTendersBtn');
}
function rcaInScope(x){
  if(x.active===false)return false;
  if(ROLE==='branch'&&BRANCH&&x.branch!==BRANCH)return false;
  return true;
}
function rcaScopeList(){
  return LA.filter(function(x){
    if(!rcaInScope(x))return false;
    if(RCA_FILTER==='sales'&&x.kind!=='sales')return false;
    if(RCA_FILTER==='tender'&&x.kind!=='tender')return false;
    if(RCA_Q&&!matchQ(x.client,RCA_Q)&&!matchQ(x.title,RCA_Q)&&!matchQ(x.branch,RCA_Q)&&!matchQ(x.competitorSummary,RCA_Q))return false;
    return true;
  }).sort(function(a,b){return (b.closedDate||'').localeCompare(a.closedDate||'');});
}
function rcaShareText(ar){
  return shareHdr('ROOT CAUSE ANALYSIS — LOST '+(ar.kind==='tender'?'TENDER':'SALES LEAD'))+
    'Client: '+(ar.client||'—')+'\\n'+
    'Opportunity: '+(ar.title||'—')+'\\n'+
    'Branch: '+(ar.branch||'—')+'\\n'+
    'Our Quote: '+(ar.ourQuote||'—')+'\\n'+
    'Our Position: '+(ar.ourPosition||'—')+'\\n'+
    'Competitors: '+(ar.competitorSummary||'—')+'\\n'+
    'Closed: '+(ar.closedDate||'—')+'\\n\\n'+
    (ar.rcaAnalysis||'')+'\\n\\n— Sent from Agile CRM Root Cause Analysis';
}
function runRcaAnalyze(arId){
  var ar=LA.find(function(x){return x.id===arId;});if(!ar)return;
  RCA_BUSY=arId;RCA_EXPAND=arId;rcaPage();
  api('analyzeLostOpportunity',{kind:ar.kind,archiveId:arId}).then(function(res){
    RCA_BUSY='';
    if(res.s!==200){alert(res.j.error||'Could not analyse this loss.');rcaPage();return;}
    ar.rcaAnalysis=res.j.reportText||'';
    ar.rcaAnalyzedAt=new Date().toISOString();
    api('saveLostArchives',{lostArchives:LA}).then(function(){
      RCA_EXPAND=arId;rcaPage();
      alert(res.j.aiUsed?'✅ RCA complete (AI analysis saved).':'✅ RCA complete (saved).');
    });
  }).catch(function(){RCA_BUSY='';alert('Network error.');rcaPage();});
}
function rcaShareEmail(arId){
  var ar=LA.find(function(x){return x.id===arId;});
  if(!ar||!ar.rcaAnalysis){alert('Please click Analyse RCA first.');return;}
  openShare('RCA — Lost '+(ar.kind==='tender'?'Tender':'Sales')+' — '+(ar.client||''),rcaShareText(ar));
}
function rcaDownload(arId){
  var ar=LA.find(function(x){return x.id===arId;});
  if(!ar||!ar.rcaAnalysis){alert('Please click Analyse RCA first.');return;}
  var name='RCA-'+(ar.client||'lost').replace(/[^a-zA-Z0-9]+/g,'-').slice(0,40)+'.txt';
  var blob=new Blob([rcaShareText(ar)],{type:'text/plain;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(url);},1000);
}
function rcaPage(){
  var scoped=LA.filter(rcaInScope);
  var list=rcaScopeList();
  var salesCnt=scoped.filter(function(x){return x.kind==='sales';}).length;
  var tendCnt=scoped.filter(function(x){return x.kind==='tender';}).length;
  var doneCnt=scoped.filter(function(x){return x.rcaAnalysis&&x.rcaAnalysis.length>40;}).length;
  var html=pageHdr('Root Cause Analysis (RCA) – Lost Opportunities','How would you help to analyse to be a winner next time','');
  html+='<div style="font-size:13px;color:#94a3b8;margin-bottom:14px">Every lost sales lead or tender is listed here. Click <b>Analyse RCA</b> on each one individually — get root causes, mistakes, lessons &amp; a plan to <b>win next time</b>. Then <b>Download</b> or <b>Email</b> the report for your team review.</div>';
  html+='<div class="kgrid">'+kpi(list.length,'Showing')+kpi(salesCnt,'Sales Lost','#f87171')+kpi(tendCnt,'Tenders Lost','#fb923c')+kpi(doneCnt,'RCA Done','#86efac')+'</div>';
  html+='<div class="filter-tabs" style="margin-bottom:12px">'+
    '<button type="button" class="filter-tab'+(RCA_FILTER==='all'?' on':'')+'" onclick="RCA_FILTER=\\'all\\';rcaPage()">All Lost</button>'+
    '<button type="button" class="filter-tab'+(RCA_FILTER==='sales'?' on':'')+'" onclick="RCA_FILTER=\\'sales\\';rcaPage()">Sales Leads Lost</button>'+
    '<button type="button" class="filter-tab'+(RCA_FILTER==='tender'?' on':'')+'" onclick="RCA_FILTER=\\'tender\\';rcaPage()">Tenders Lost</button></div>';
  html+='<div class="search-row"><input id="rcaQ" value="'+a(RCA_Q)+'" placeholder="Search client, tender, branch, competitor…" onkeydown="if(event.key===\\'Enter\\'){RCA_Q=this.value;rcaPage();}"><button class="btn grey" onclick="RCA_Q=el(\\'rcaQ\\').value;rcaPage()">Search</button></div>';
  html+='<div class="count-note">'+list.length+' lost opportunit'+(list.length===1?'y':'ies')+' — analyse each one separately</div>';
  if(!list.length){
    html+='<div class="card" style="text-align:center;padding:40px;color:var(--muted)">No lost deals yet.<br><br>When you mark a Sales Lead or Tender as <b>Closed - Lost</b>, it appears here automatically for RCA.</div>';
  }
  list.forEach(function(ar){
    var open=RCA_EXPAND===ar.id;
    var hasRca=ar.rcaAnalysis&&ar.rcaAnalysis.length>40;
    var busy=RCA_BUSY===ar.id;
    var kindLbl=ar.kind==='tender'?'📄 Tender Lost':'🎯 Sales Lead Lost';
    var kindCol=ar.kind==='tender'?'#fb923c':'#f87171';
    html+='<div class="rca-card'+(hasRca?' done':'')+'">';
    html+='<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;align-items:flex-start">';
    html+='<div><div style="font-size:11px;font-weight:800;color:'+kindCol+';text-transform:uppercase;letter-spacing:.05em">'+kindLbl+'</div>';
    html+='<div style="font-size:18px;font-weight:800;color:#fff;margin:4px 0">'+h(ar.client||'—')+'</div>';
    html+='<div style="font-size:13px;color:#94a3b8">'+h(ar.title||'')+'</div>';
    html+='<div style="font-size:12px;color:#64748b;margin-top:6px">Branch: '+h(ar.branch||'—')+' · Closed: '+h(ar.closedDate||'—')+(hasRca?' · <span style="color:#86efac">RCA ✓</span>':'')+'</div></div>';
    html+='<div style="text-align:right;font-size:13px"><div style="color:#fde68a">Our Quote: <b>'+h(ar.ourQuote||'—')+'</b></div>';
    if(ar.ourPosition)html+='<div style="color:#93c5fd;margin-top:4px">Position: <b>'+h(ar.ourPosition)+'</b></div></div></div>';
    else html+='</div></div>';
    if(ar.competitorSummary)html+='<div style="font-size:12px;color:#cbd5e1;margin-top:8px;padding:8px 10px;background:#0f172a;border-radius:8px"><b style="color:#fbbf24">Competitors:</b> '+h(ar.competitorSummary)+'</div>';
    html+='<div class="row-actions" style="margin-top:12px">'+
      '<button type="button" class="btn gold" style="min-height:44px" onclick="runRcaAnalyze(\\''+ar.id+'\\')" '+(busy?'disabled':'')+'>'+(busy?'⏳ Analysing…':'🔬 Analyse RCA')+'</button>'+
      (hasRca?'<button type="button" class="btn grey" style="min-height:44px" onclick="RCA_EXPAND=\\''+(open?'':ar.id)+'\\';rcaPage()">'+(open?'▲ Hide Report':'▼ View Report')+'</button>':'')+
      (hasRca?'<button type="button" class="btn green" style="min-height:44px" onclick="rcaShareEmail(\\''+ar.id+'\\')">📨 Email Report</button>':'')+
      (hasRca?'<button type="button" class="btn grey" style="min-height:44px" onclick="rcaDownload(\\''+ar.id+'\\')">📥 Download</button>':'')+
      '</div>';
    if(open){
      if(busy)html+='<div class="rca-report" style="text-align:center;color:#94a3b8">Analysing why we lost this opportunity… please wait (up to 1 minute).</div>';
      else if(hasRca)html+='<div class="rca-report">'+h(ar.rcaAnalysis)+'</div>';
    }
    html+='</div>';
  });
  html+='<div class="card" style="margin-top:16px;border-left:4px solid var(--gold)"><b style="color:#fde68a">💡 How RCA helps you win next time</b>';
  html+='<div style="font-size:13px;color:#94a3b8;margin-top:8px;line-height:1.7">1. <b>Analyse each loss individually</b> — price, relationship, compliance, follow-up.<br>2. <b>Share the report</b> with Branch HOD and Tender Cell in your weekly meeting.<br>3. <b>Track early warning signs</b> on the next similar opportunity before it is too late.<br>4. Mark losses in <b>Sales Lead</b> or <b>Tender Lead</b> as <b>Closed - Lost</b> — they appear here automatically.</div></div>';
  el('content').innerHTML=html;
}
function tenderReader(){
  tenderCmpInitFindHook();
  var list=T.map(function(t,i){return {t:t,i:i};}).filter(function(x){return x.t.recordKind!=='Historical'&&x.t.active!==false;});
  var html=pageHdr('Tender Reader','Read tender notices & compare documents — nothing stored on server','');
  html+='<div style="font-size:13px;color:#94a3b8;margin-bottom:14px">Upload tender document (any state language) → click <b>Translate to English</b> or <b>Read</b> → <b>Download</b> or <b>Email</b> the English version → edit fields → <b>Add to Tender Lead</b> when verified.</div>';
  html+=tenderReaderBlock(list);
  el('content').innerHTML=html;
}
function tenderNoticePanel(i){
  var sid=tenderPanelId(i);
  return '<div style="margin-top:4px">'+
    '<details style="margin-bottom:8px"><summary style="cursor:pointer;color:var(--muted);font-size:12px">Or paste tender text instead of upload</summary>'+
    '<textarea id="tnPaste'+sid+'" style="min-height:80px;font-size:15px;margin-top:6px" placeholder="Paste tender notice text here…"></textarea></details>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">'+
    '<label class="btn blue" style="cursor:pointer;margin:0;min-height:48px;display:inline-flex;align-items:center">📎 Upload Document<input type="file" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*" style="display:none" onchange="tenderUploadNotice(\\''+sid+'\\',this)"></label>'+
    '<button type="button" class="btn grey" style="min-height:48px" onclick="tenderReadNotice(\\''+sid+'\\')">🔍 Read</button>'+
    '<button type="button" class="btn grey" style="min-height:48px" onclick="tenderClearNotice(\\''+sid+'\\')">🗑 Clear Document</button>'+
    '<button type="button" class="btn grey" style="min-height:48px" onclick="tenderClearExtractFields(\\''+sid+'\\')">✕ Clear Fields</button>'+
    '<button type="button" class="btn gold" style="min-height:48px" onclick="tenderApplyExtract(\\''+sid+'\\')">➕ Add to Tender Lead</button>'+
    '<button type="button" class="btn grey" style="min-height:48px" onclick="tenderCompareOpen(\\''+sid+'\\')">⚖ Compare with Old</button>'+
    '</div>'+
    '<div class="tn-reader-layout">'+
    '<div class="tn-preview-col"><b style="color:#fff">Document Preview</b>'+
    '<div class="tn-search-row"><input id="tnSearch'+sid+'" placeholder="Search word or sentence in document…" onkeydown="if(event.key===\\'Enter\\'){tenderDocSearch(\\''+sid+'\\');event.preventDefault();}">'+
    '<button type="button" class="btn grey" style="padding:6px 12px;font-size:12px" onclick="tenderDocSearch(\\''+sid+'\\')">Find</button>'+
    '<button type="button" class="btn grey" style="padding:6px 12px;font-size:12px" onclick="tenderDocSearchNext(\\''+sid+'\\',-1)">◀ Prev</button>'+
    '<button type="button" class="btn grey" style="padding:6px 12px;font-size:12px" onclick="tenderDocSearchNext(\\''+sid+'\\',1)">Next ▶</button>'+
    '<span class="tn-search-meta" id="tnSearchMeta'+sid+'"></span></div>'+
    '<div class="tn-search-row" style="margin-top:6px">'+
    '<button type="button" class="btn gold" style="padding:6px 14px;font-size:12px;min-height:40px" onclick="tenderTranslateEnglish(\\''+sid+'\\')">🌐 Translate to English</button>'+
    '<button type="button" class="btn grey" style="padding:6px 14px;font-size:12px;min-height:40px" onclick="tenderDownloadEnglish(\\''+sid+'\\')">📥 Download English</button>'+
    '<button type="button" class="btn green" style="padding:6px 14px;font-size:12px;min-height:40px" onclick="tenderEmailEnglish(\\''+sid+'\\')">📨 Email English</button>'+
    '<span id="tnLangStatus'+sid+'" style="font-size:11px;color:var(--muted)"></span></div>'+
    '<div id="tnPreview'+sid+'" class="tn-preview-box"><div style="padding:40px;text-align:center;color:#64748b">Upload a PDF, Word or photo to see preview here.</div></div>'+
    '<div id="tnTextPreview'+sid+'" class="tn-text-preview" style="display:none"></div></div>'+
    '<div class="tn-format-col"><b style="color:#fff">Agile Tender Format</b>'+
    '<div style="font-size:12px;color:#94a3b8;margin-top:4px">Click <b>Read</b> after upload. Click any field to jump to that paragraph. Edit before adding to Tender Lead.</div>'+
    '<div id="tnResult'+sid+'" style="margin-top:10px"><div style="color:var(--muted);font-size:13px">Waiting for document…</div></div></div></div></div>';
}
function tenderBuildParas(text){
  var raw=String(text||'').replace(new RegExp('\\\\r','g'),'').split(new RegExp('\\\\n+')).map(function(l){return l.trim();}).filter(Boolean);
  if(raw.length>3)return raw;
  return String(text||'').replace(new RegExp('\\\\r','g'),'').split(new RegExp('\\\\n')).map(function(l){return l.trim();}).filter(Boolean);
}
function tenderRenderDocPreview(sid){
  var box=el('tnPreview'+sid),tx=el('tnTextPreview'+sid),p=TEND_PREVIEW[sid];
  if(!box)return;
  if(!p){box.innerHTML='<div style="padding:40px;text-align:center;color:#64748b">Upload a PDF, Word or photo to see preview here.</div>';if(tx){tx.style.display='none';tx.innerHTML='';}return;}
  var mime=p.mime||'',name=(p.fileName||'').toLowerCase();
  var previewUrl=p.blobUrl||p.dataUrl||'';
  if((p.size||0)>TEND_PREVIEW_MAX||!previewUrl){
    box.innerHTML='<div style="padding:24px;text-align:center;color:#334155;background:#f1f5f9;border-radius:8px"><div style="font-size:32px">📄</div><b>'+h(p.fileName)+'</b><div style="font-size:13px;margin-top:8px;color:#64748b">Large file — click <b>Read</b> for text (preview skipped to save memory).</div></div>';
    return;
  }
  if(mime.indexOf('pdf')>=0||name.endsWith('.pdf')){
    box.innerHTML='<iframe src="'+a(previewUrl)+'" title="Tender PDF"></iframe>';
  }else if(mime.indexOf('image/')===0||name.endsWith('.jpg')||name.endsWith('.jpeg')||name.endsWith('.png')||name.endsWith('.webp')||name.endsWith('.gif')){
    box.innerHTML='<img src="'+a(previewUrl)+'" alt="Tender document">';
  }else{
    box.innerHTML='<div style="padding:30px;text-align:center;color:#334155;background:#f1f5f9;border-radius:8px"><div style="font-size:36px">📄</div><b>'+h(p.fileName)+'</b><div style="font-size:13px;margin-top:8px">Click <b>Read</b> to show searchable text preview.</div></div>';
  }
}
function tenderLangLabel(code){
  var m={hindi:'Hindi',tamil:'Tamil',telugu:'Telugu',bengali:'Bengali',kannada:'Kannada',marathi:'Marathi',malayalam:'Malayalam',other:'local language',en:'English',mixed:'Hindi/English'};
  return m[code]||code||'local language';
}
function tenderEnglishText(sid){
  var p=TEND_PREVIEW[sid];
  if(p&&p.englishText)return p.englishText;
  if(p&&p.sourceText)return p.sourceText;
  return (el('tnPaste'+sid)&&el('tnPaste'+sid).value||'').trim();
}
function tenderApplyEnglishResult(sid,res,prev){
  var meta={wasTranslated:!!res.wasTranslated,wasBilingual:!!res.wasBilingual,originalLang:res.originalLang||'en',translationFailed:!!res.translationFailed};
  if(!TEND_PREVIEW[sid])TEND_PREVIEW[sid]={};
  if(res.originalText)TEND_PREVIEW[sid].originalText=res.originalText;
  TEND_PREVIEW[sid].englishText=res.sourceText;
  TEND_PREVIEW[sid].sourceText=res.sourceText;
  TEND_PREVIEW[sid].langMeta=meta;
  var paste=el('tnPaste'+sid);if(paste)paste.value=res.sourceText;
  if(meta.wasTranslated||meta.wasBilingual||meta.translationFailed){
    var box=el('tnPreview'+sid);
    if(box)box.innerHTML='<div style="padding:24px;text-align:center;color:#334155;background:#f1f5f9;border-radius:8px;font-size:15px;line-height:1.6"><div style="font-size:32px;margin-bottom:8px">'+(meta.wasTranslated?'🌐':meta.translationFailed?'⚠':'📄')+'</div><b>'+(meta.wasTranslated?'English translation ready':meta.translationFailed?'Translation could not be made — original text shown':meta.wasBilingual?'English text extracted from bilingual document':'Document is in English')+'</b><div style="font-size:13px;margin-top:8px;color:#64748b">'+(meta.wasTranslated?'Original: '+h(tenderLangLabel(meta.originalLang))+' · Use Download or Email below':'')+'</div></div>';
  }
  tenderRenderTextPreview(sid,res.sourceText,meta);
  var st=el('tnLangStatus'+sid);
  if(st){
    if(meta.wasTranslated)st.textContent='✓ Translated from '+tenderLangLabel(meta.originalLang);
    else if(meta.wasBilingual)st.textContent='✓ English lines used from bilingual document';
    else if(meta.translationFailed)st.textContent='⚠ Translation failed — showing original text';
    else st.textContent='✓ Already in English';
  }
  if(prev&&prev.b64)prev.b64='';
}
function tenderTranslateEnglish(sid){
  var prev=TEND_PREVIEW[sid],text=(el('tnPaste'+sid).value||'').trim(),body={};
  if(prev&&prev.b64){body={fileName:prev.fileName,mimeType:prev.mime,fileBase64:prev.b64};}
  else if(text.length>=40){body={text:text};}
  else{alert('Please upload a document or paste tender text first (Hindi, Telugu, Tamil, Kannada, Marathi, Bengali, etc.).');return;}
  var st=el('tnLangStatus'+sid);if(st)st.textContent='Translating… please wait (up to 1 minute).';
  var tx=el('tnTextPreview'+sid);
  if(tx){tx.style.display='block';tx.innerHTML='<div style="padding:20px;color:#64748b;text-align:center">🌐 Translating tender to English… please wait.</div>';}
  api('readTenderText',body).then(function(res){
    if(res.s!==200){if(st)st.textContent='';alert(res.j.error||'Could not translate document.');return;}
    tenderApplyEnglishResult(sid,res.j,prev);
  }).catch(function(){if(st)st.textContent='';alert('Network error — please try again.');});
}
function tenderDownloadEnglish(sid){
  var text=tenderEnglishText(sid);
  if(!text||text.length<40){alert('Please click Translate to English or Read first.');return;}
  var prev=TEND_PREVIEW[sid]||{};
  var base=(prev.fileName||'tender-notice').replace(/\\.[^.]+$/,'');
  var name=base+'-English.txt';
  var hdr='Agile Security Force Pvt. Ltd.\\nTENDER NOTICE — ENGLISH TRANSLATION\\nDate: '+today()+'\\n';
  if(prev.langMeta&&prev.langMeta.wasTranslated)hdr+='Translated from: '+tenderLangLabel(prev.langMeta.originalLang)+'\\n';
  hdr+='\\n'+'='.repeat(50)+'\\n\\n';
  var blob=new Blob([hdr+text],{type:'text/plain;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(url);},1000);
}
function tenderTranslateShareText(sid){
  var prev=TEND_PREVIEW[sid]||{};
  var text=tenderEnglishText(sid);
  var meta=prev.langMeta||{};
  var t=shareHdr('TENDER NOTICE — ENGLISH TRANSLATION');
  if(meta.wasTranslated)t+='Translated from: '+tenderLangLabel(meta.originalLang)+'\\n';
  else if(meta.wasBilingual)t+='Source: English lines from bilingual document\\n';
  t+='Document: '+(prev.fileName||'Pasted text')+'\\n\\n';
  t+=text.slice(0,14000);
  if(text.length>14000)t+='\\n\\n[Text truncated for email — use Download for full document]';
  return t+'\\n\\n— Sent from Agile CRM Tender Reader';
}
function tenderEmailEnglish(sid){
  var text=tenderEnglishText(sid);
  if(!text||text.length<40){alert('Please click Translate to English or Read first.');return;}
  var prev=TEND_PREVIEW[sid]||{};
  var sub='Tender Notice — English Translation — '+(prev.fileName||today()).replace(/\\.[^.]+$/,'');
  openShare(sub,tenderTranslateShareText(sid));
}
function tenderRenderTextPreview(sid,text,meta){
  var tx=el('tnTextPreview'+sid);if(!tx)return;
  meta=meta||{};
  if(!text||!String(text).trim()){tx.style.display='none';tx.innerHTML='';return;}
  if(!TEND_PREVIEW[sid])TEND_PREVIEW[sid]={};
  TEND_PREVIEW[sid].sourceText=text;
  TEND_PREVIEW[sid].paras=tenderBuildParas(text);
  var paras=TEND_PREVIEW[sid].paras;
  tx.style.display='block';
  var banner='';
  if(meta.wasTranslated)banner='<div class="tn-lang-banner">🌐 Translated from <b>'+h(tenderLangLabel(meta.originalLang))+'</b> to English — preview below</div>';
  else if(meta.wasBilingual)banner='<div class="tn-lang-banner">📄 English text used from bilingual document (other language lines skipped)</div>';
  else if(meta.translationFailed)banner='<div class="tn-lang-banner" style="background:#451a03;color:#fdba74;border-color:#ea580c">⚠ Hindi/local language detected but English translation could not be made. Please try again or contact admin.</div>';
  tx.innerHTML=banner+'<div style="font-size:12px;color:#64748b;margin-bottom:8px">Document text — click a field on the right to jump here · use Search above (like Find)</div>'+
    paras.map(function(p,i){return '<div class="tn-para" id="tnPara_'+sid+'_'+i+'">'+h(p)+'</div>';}).join('');
  var q=el('tnSearch'+sid);if(q&&q.value)tenderDocSearch(sid);
}
function tenderHighlightPara(sid,idx){
  var paras=document.querySelectorAll('#tnTextPreview'+sid+' .tn-para');
  paras.forEach(function(n,i){
    n.classList.remove('hl','dim','srch');
    if(i===idx)n.classList.add('hl');
    else if(idx>=0)n.classList.add('dim');
  });
  var target=el('tnPara_'+sid+'_'+idx);
  if(target)try{target.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){target.scrollIntoView(true);}
}
function tenderFindParaIndex(paras,val,labels){
  paras=paras||[];val=String(val||'').trim();
  if(val.length>=2){
    var vlow=val.toLowerCase().replace(/[₹,]/g,'');
    var vshort=vlow.length>24?vlow.slice(0,24):vlow;
    for(var i=0;i<paras.length;i++){
      var pl=paras[i].toLowerCase().replace(/[₹,]/g,'');
      if(pl.indexOf(vlow)>=0||pl.indexOf(vshort)>=0)return i;
    }
  }
  labels=labels||[];
  for(var L=0;L<labels.length;L++){var lbl=labels[L].toLowerCase();
    for(var j=0;j<paras.length;j++){
      if(paras[j].toLowerCase().indexOf(lbl)>=0){
        if(j+1<paras.length&&paras[j+1].length>1&&paras[j+1].length<240)return j+1;
        return j;
      }
    }
  }
  return -1;
}
function tenderSyncFld(sid,key,val){if(!TEND_EXTRACT[sid])TEND_EXTRACT[sid]={};TEND_EXTRACT[sid][key]=val;}
function tenderFieldFocus(sid,key){
  document.querySelectorAll('#tnResult'+sid+' .tn-fmt-field').forEach(function(n){n.classList.remove('on');});
  var inp=el('tnFld_'+sid+'_'+key);if(inp&&inp.parentElement)inp.parentElement.classList.add('on');
  var ex=TEND_EXTRACT[sid]||{},f=null;
  TENDER_FMT_FIELDS.forEach(function(x){if(x.key===key)f=x;});
  var prev=TEND_PREVIEW[sid];if(!prev||!prev.paras)return;
  var idx=tenderFindParaIndex(prev.paras,ex[key],f?f.labels:[]);
  if(idx>=0)tenderHighlightPara(sid,idx);
}
function tenderSyncExtractFromForm(sid){
  var ex=TEND_EXTRACT[sid]||{};
  TENDER_FMT_FIELDS.forEach(function(f){var inp=el('tnFld_'+sid+'_'+f.key);if(inp)ex[f.key]=inp.value;});
  if(ex.eligibility===undefined)ex.eligibility=ex.eligibility||'';
  TEND_EXTRACT[sid]=ex;return ex;
}
function tenderRenderEditableExtract(sid,ex){
  if(!ex)ex={};
  var html='<div style="background:#14532d;color:#86efac;padding:8px 12px;border-radius:8px;font-size:13px;margin-bottom:8px">'+
    (ex.aiUsed?'🤖 AI read — verify & edit each field':'Fields read from document — verify & edit')+'</div>';
  if(ex.summary)html+='<p style="font-size:12px;color:#cbd5e1;margin-bottom:8px">'+h(ex.summary)+'</p>';
  html+='<div class="tn-fmt-grid">';
  TENDER_FMT_FIELDS.forEach(function(f){
    var v=ex[f.key]!=null?String(ex[f.key]):'';
    html+='<div class="tn-fmt-field" onclick="tenderFieldFocus(\\''+sid+'\\',\\''+f.key+'\\')">'+
      '<label>'+h(f.label)+'</label>'+
      '<input id="tnFld_'+sid+'_'+f.key+'" value="'+a(v)+'" onclick="event.stopPropagation()" oninput="tenderSyncFld(\\''+sid+'\\',\\''+f.key+'\\',this.value)" onfocus="tenderFieldFocus(\\''+sid+'\\',\\''+f.key+'\\')">'+
      '</div>';
  });
  html+='</div>';
  html+='<div style="margin-top:8px"><button type="button" class="btn grey" style="padding:6px 14px;font-size:12px" onclick="tenderClearExtractFields(\\''+sid+'\\')">✕ Clear All Fields</button></div>';
  if(ex.eligibility)html+='<div class="tn-fmt-field" style="margin-top:10px" onclick="tenderFieldFocus(\\''+sid+'\\',\\'eligibility\\')"><label>Eligibility (excerpt)</label><textarea id="tnFld_'+sid+'_eligibility" onclick="event.stopPropagation()" oninput="tenderSyncFld(\\''+sid+'\\',\\'eligibility\\',this.value)">'+h(ex.eligibility)+'</textarea></div>';
  return html;
}
function tenderDocSearch(sid){
  var qInp=el('tnSearch'+sid),meta=el('tnSearchMeta'+sid),tx=el('tnTextPreview'+sid);
  var q=(qInp&&qInp.value||'').trim();
  if(!q){if(meta)meta.textContent='';return;}
  var prev=TEND_PREVIEW[sid];
  if(!prev||!prev.paras||!prev.paras.length){
    if(meta)meta.textContent='Click Read first';
    alert('Please click Read first so the document text is available for search.');
    return;
  }
  var qlow=q.toLowerCase(),hits=[];
  prev.paras.forEach(function(p,i){
    var plow=p.toLowerCase(),pos=0;
    while((pos=plow.indexOf(qlow,pos))>=0){hits.push({para:i,start:pos,end:pos+q.length});pos+=q.length||1;}
  });
  TEND_SEARCH[sid]={q:q,hits:hits,idx:0};
  prev.paras.forEach(function(p,i){
    var node=el('tnPara_'+sid+'_'+i);if(!node)return;
    var marked=p,off=0;
    var phits=hits.filter(function(h){return h.para===i;}).sort(function(a,b){return b.start-a.start;});
    phits.forEach(function(h){
      marked=marked.slice(0,h.start)+'<mark class="tn-mark">'+h(marked.slice(h.start,h.end))+'</mark>'+marked.slice(h.end);
    });
    node.innerHTML=marked;node.classList.remove('hl','srch');
  });
  if(hits.length){
    var h0=hits[0];
    var n0=el('tnPara_'+sid+'_'+h0.para);if(n0){n0.classList.add('srch');try{n0.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){n0.scrollIntoView(true);}}
    if(meta)meta.textContent='1 / '+hits.length;
  }else{if(meta)meta.textContent='Not found';}
}
function tenderDocSearchNext(sid,dir){
  var st=TEND_SEARCH[sid];if(!st||!st.hits||!st.hits.length)return;
  st.idx=(st.idx+(dir||1)+st.hits.length)%st.hits.length;
  var h=st.hits[st.idx],meta=el('tnSearchMeta'+sid);
  document.querySelectorAll('#tnTextPreview'+sid+' .tn-para').forEach(function(n){n.classList.remove('hl','srch');});
  var n=el('tnPara_'+sid+'_'+h.para);
  if(n){n.classList.add('srch');try{n.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){n.scrollIntoView(true);}}
  if(meta)meta.textContent=(st.idx+1)+' / '+st.hits.length;
}
function tenderMimeGuess(name){
  var n=String(name||'').toLowerCase();
  if(n.endsWith('.pdf'))return 'application/pdf';
  if(n.endsWith('.docx'))return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if(n.endsWith('.doc'))return 'application/msword';
  if(n.endsWith('.png'))return 'image/png';
  if(n.endsWith('.jpg')||n.endsWith('.jpeg'))return 'image/jpeg';
  if(n.endsWith('.webp'))return 'image/webp';
  if(n.endsWith('.txt'))return 'text/plain';
  return '';
}
function tenderFileToBase64(file,cb){
  if(!file)return;
  if(file.size>TEND_MAX_FILE){alert('File is too big (max 4 MB). Please paste the tender text in the box below instead (open PDF → Ctrl+A → Ctrl+C → paste).');return;}
  var r=new FileReader();
  r.onload=function(){
    var parts=String(r.result||'').split(',');
    cb(parts.length>1?parts[1]:'',file);
  };
  r.onerror=function(){alert('Could not read file — try a smaller file or paste text instead.');};
  r.readAsDataURL(file);
}
function tenderReleaseBlob(sid){
  var p=TEND_PREVIEW[sid];
  if(p&&p.blobUrl){try{URL.revokeObjectURL(p.blobUrl);}catch(e){}p.blobUrl='';}
}
function tenderReadNotice(id){
  var sid=tenderPanelId(id),prev=TEND_PREVIEW[sid],text=(el('tnPaste'+sid).value||'').trim(),body={};
  if(prev&&prev.b64){body={fileName:prev.fileName,mimeType:prev.mime,fileBase64:prev.b64};}
  else if(text.length>=40){body={text:text};}
  else{alert('Please upload a document or paste tender text first.');return;}
  el('tnResult'+sid).innerHTML='<div style="color:var(--muted)">Reading document… please wait (up to 1 minute).</div>';
  api('extractTenderNotice',body).then(function(res){
    if(res.s!==200){el('tnResult'+sid).innerHTML='<div style="color:#f87171">'+(res.j.error||'Could not read document.')+'</div>';return;}
    var meta={wasTranslated:!!res.j.wasTranslated,wasBilingual:!!res.j.wasBilingual,originalLang:res.j.originalLang||'en',translationFailed:!!res.j.translationFailed};
    if(res.j.sourceText){
      tenderApplyEnglishResult(sid,{
        sourceText:res.j.sourceText,
        originalText:res.j.originalText,
        wasTranslated:res.j.wasTranslated,
        wasBilingual:res.j.wasBilingual,
        originalLang:res.j.originalLang,
        translationFailed:res.j.translationFailed
      },prev);
    }
    TEND_EXTRACT[sid]=res.j;
    el('tnResult'+sid).innerHTML=tenderRenderEditableExtract(sid,res.j)+
      '<div style="font-size:11px;color:#64748b;margin-top:10px">'+h(prev?prev.fileName:'Pasted text')+' · '+h(res.j.readMethod||'read')+' · '+(res.j.sourceChars||0)+' characters'+(meta.wasTranslated?' · translated to English':'')+(meta.wasBilingual?' · English from bilingual doc':'')+'</div>';
  }).catch(function(){el('tnResult'+sid).innerHTML='<div style="color:#f87171">Network error.</div>';});
}
function tenderUploadNotice(id,inp){
  var sid=tenderPanelId(id),f=inp.files&&inp.files[0];if(!f)return;
  if(f.size>TEND_MAX_FILE){alert('File is too big (max 4 MB). Please paste the tender text in the box below instead (open PDF → Ctrl+A → Ctrl+C → paste).');inp.value='';return;}
  tenderReleaseBlob(sid);
  var blobUrl='';
  if(f.size<=TEND_PREVIEW_MAX){try{blobUrl=URL.createObjectURL(f);}catch(e){blobUrl='';}}
  var r=new FileReader();
  r.onload=function(){
    var parts=String(r.result||'').split(',');
    var b64=parts.length>1?parts[1]:'';
    TEND_PREVIEW[sid]={fileName:f.name,mime:f.type||tenderMimeGuess(f.name),blobUrl:blobUrl,b64:b64,size:f.size};
    tenderRenderDocPreview(sid);
    el('tnResult'+sid).innerHTML='<div style="color:var(--muted);font-size:13px">✓ <b>'+h(f.name)+'</b> uploaded. Click <b>Read</b> to fill the tender format.</div>';
    if(el('tnSearchMeta'+sid))el('tnSearchMeta'+sid).textContent='';
  };
  r.onerror=function(){alert('Could not read file — file may be too large. Try a smaller PDF or paste text.');tenderReleaseBlob(sid);};
  r.readAsDataURL(f);
  inp.value='';
}
function tenderClearNotice(id){
  var sid=tenderPanelId(id);
  tenderReleaseBlob(sid);
  delete TEND_PREVIEW[sid];
  delete TEND_SEARCH[sid];
  var paste=el('tnPaste'+sid);if(paste)paste.value='';
  var search=el('tnSearch'+sid);if(search)search.value='';
  var meta=el('tnSearchMeta'+sid);if(meta)meta.textContent='';
  var langSt=el('tnLangStatus'+sid);if(langSt)langSt.textContent='';
  var box=el('tnPreview'+sid);
  if(box)box.innerHTML='<div style="padding:40px;text-align:center;color:#64748b">Upload a PDF, Word or photo to see preview here.</div>';
  var tx=el('tnTextPreview'+sid);
  if(tx){tx.style.display='none';tx.innerHTML='';}
  var res=el('tnResult'+sid);
  if(res)res.innerHTML='<div style="color:var(--muted);font-size:13px">Document cleared. Upload or paste a new tender notice, then click <b>Read</b>.</div>';
}
function tenderClearExtractFields(id){
  var sid=tenderPanelId(id);
  var emptyEx={summary:'',aiUsed:false};
  TENDER_FMT_FIELDS.forEach(function(f){emptyEx[f.key]='';});
  emptyEx.eligibility='';
  TEND_EXTRACT[sid]=emptyEx;
  var res=el('tnResult'+sid);
  if(res)res.innerHTML=tenderRenderEditableExtract(sid,emptyEx)+
    '<div style="font-size:12px;color:#64748b;margin-top:8px">All fields cleared. You can type values manually or click <b>Read</b> again.</div>';
}
function tenderClearCompare(slot){
  if(slot==='old'||slot==='all'){
    CMP_OLD_FILE=null;
    CMP_PREVIEW.old=null;
    tenderCmpReleaseBlob('old');
    var o=el('cmpOldPaste');if(o)o.value='';
    var ol=el('cmpOldLbl');if(ol)ol.textContent='';
    var os=el('cmpOldSel');if(os)os.value='';
    var op=el('cmpDocPreviewOld');if(op)op.innerHTML='<div style="padding:30px;text-align:center;color:#64748b;font-size:13px">Upload old document to see preview</div>';
    var ot=el('cmpTextPreviewOld');if(ot){ot.style.display='none';ot.innerHTML='';}
  }
  if(slot==='new'||slot==='all'){
    CMP_NEW_FILE=null;
    CMP_PREVIEW.new=null;
    tenderCmpReleaseBlob('new');
    var n=el('cmpNewPaste');if(n)n.value='';
    var nl=el('cmpNewLbl');if(nl)nl.textContent='';
    var np=el('cmpDocPreviewNew');if(np)np.innerHTML='<div style="padding:30px;text-align:center;color:#64748b;font-size:13px">Upload new document to see preview</div>';
    var nt=el('cmpTextPreviewNew');if(nt){nt.style.display='none';nt.innerHTML='';}
  }
  if(slot==='all'){
    var out=el('cmpInlineResult')||el('cmpResult');
    if(out)out.innerHTML='';
    var cs=el('cmpSearch');if(cs)cs.value='';
    var cm=el('cmpSearchMeta');if(cm)cm.textContent='';
    var crs=el('cmpReadStatus');if(crs)crs.textContent='';
    CMP_READ_QUEUE=[];CMP_READ_BUSY=false;
    CMP_SEARCH={};
  }
}
function tenderResolveIdx(id){
  var sid=tenderPanelId(id);
  if(sid!=='top')return parseInt(sid,10);
  if(TEND_READER_IDX>=0&&T[TEND_READER_IDX])return TEND_READER_IDX;
  return -1;
}
function tenderApplyExtract(id){
  var sid=tenderPanelId(id);
  if(!TEND_EXTRACT[sid]){alert('Click Read after uploading the document first.');return;}
  var ex=tenderSyncExtractFromForm(sid);
  T.push(emptyTender('Live'));
  var i=T.length-1;
  TEND_READER_IDX=i;
  var t=T[i];
  t.tenderNo=String(ex.tenderNo||'');
  t.clientDept=String(ex.clientDept||'');
  t.tenderName=String(ex.clientDept||ex.tenderName||'');
  t.location=String(ex.location||'');
  t.portal=String(ex.portal||'');
  t.typeOfServices=String(ex.typeOfServices||'');
  t.contractPeriod=String(ex.contractPeriod||'');
  t.minTurnover3yr=String(ex.minTurnover3yr||'');
  t.experienceYears=String(ex.experienceYears||'');
  t.estimatedBidValue=String(ex.estimatedBidValue||'');
  t.evaluationMethod=String(ex.evaluationMethod||'');
  t.requiredManpower=String(ex.requiredManpower||'');
  t.publishedDate=String(ex.publishedDate||'');
  t.prebidMeetingDate=String(ex.prebidMeetingDate||'');
  t.prebidMeetingVenue=String(ex.prebidMeetingVenue||'');
  t.emdPreparationDate=String(ex.emdPreparationDate||'');
  t.submissionDate=String(ex.submissionDate||'');
  t.bidEndDateTime=String(ex.bidEndDateTime||'');
  t.bidValidityFromEnd=String(ex.bidValidityFromEnd||'');
  t.emd=String(ex.emd||'');
  t.epbgPercent=String(ex.epbgPercent||'');
  t.tenderFee=String(ex.tenderFee||'');
  t.scoreMatrix=String(ex.scoreMatrix||'');
  t.serviceCharge=String(ex.serviceCharge||'');
  t.l1TieBreak=String(ex.l1TieBreak||'');
  t.msePreference=String(ex.msePreference||'');
  t.tenderExtract={
    summary:ex.summary||'',portal:ex.portal||'',submissionMode:ex.submissionMode||'',bidType:ex.bidType||'',
    emdMode:ex.emdMode||'',openingDate:ex.openingDate||'',eligibility:ex.eligibility||'',
    documentsRequired:ex.documentsRequired||'',importantDates:ex.importantDates||'',
    extractedAt:new Date().toISOString()
  };
  TEND_EDIT=i;
  tab(4);
  alert('New tender created ✓ — Organisation Name used as tender title. Review the form and tap Save at the bottom.');
}
function tenderCompareOpen(id){
  var i=tenderResolveIdx(id);
  closeAllOverlays();
  var oldM=el('cmpModal');if(oldM)oldM.remove();
  var t=i>=0&&T[i]?T[i]:null,prev=t?prevTenders(t,t.id):T.filter(function(x){return x.recordKind==='Historical';});
  if(t&&t.recordKind==='Historical')prev=[t].concat(prev.filter(function(p){return p.id!==t.id;}));
  var opts='<option value="">— Select old tender from archive —</option>'+prev.map(function(p){
    var sel=(t.recordKind==='Historical'&&p.id===t.id)?' selected':'';
    return '<option value="'+a(p.id)+'"'+sel+'>'+h(p.tenderName||p.clientDept)+' ('+h(tenderYear(p))+')</option>';
  }).join('');
  var newVal=el('tnPaste'+tenderPanelId(id))?el('tnPaste'+tenderPanelId(id)).value:'';
  CMP_OLD_FILE=null;CMP_NEW_FILE=null;
  var html='<div class="share-overlay" id="cmpModal" onclick="if(event.target===this)el(\\'cmpModal\\').remove()"><div class="share-box" style="max-width:760px;max-height:92vh;overflow-y:auto">'+
    '<h3>⚖ Compare Old vs New Tender</h3><p class="share-note">Upload PDF / Word / image for old and new — or paste text.</p>'+
    '<label>Old tender (from CRM archive)</label><select id="cmpOldSel" style="margin-top:4px">'+opts+'</select>'+
    '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">'+
    '<label class="btn grey" style="cursor:pointer;margin:0">📎 Old file<input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" style="display:none" onchange="tenderCmpUpload(\\'old\\',this)"></label>'+
    '<button type="button" class="btn grey" style="padding:6px 12px;font-size:12px" onclick="tenderClearCompare(\\'old\\')">Clear Old</button>'+
    '<span id="cmpOldLbl" style="font-size:12px;color:var(--muted)"></span></div>'+
    '<label style="margin-top:10px">Or paste previous tender / agreement text</label><textarea id="cmpOldPaste" style="min-height:70px" placeholder="Previous tender or master agreement text…"></textarea>'+
    '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">'+
    '<label class="btn grey" style="cursor:pointer;margin:0">📎 New file<input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" style="display:none" onchange="tenderCmpUpload(\\'new\\',this)"></label>'+
    '<button type="button" class="btn grey" style="padding:6px 12px;font-size:12px" onclick="tenderClearCompare(\\'new\\')">Clear New</button>'+
    '<button type="button" class="btn grey" style="padding:6px 12px;font-size:12px" onclick="tenderClearCompare(\\'all\\')">Clear Both</button>'+
    '<span id="cmpNewLbl" style="font-size:12px;color:var(--muted)"></span></div>'+
    '<label style="margin-top:10px">New tender notice (text)</label><textarea id="cmpNewPaste" style="min-height:90px">'+h(newVal)+'</textarea>'+
    '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn gold" onclick="tenderRunCompare('+(i>=0?i:-1)+')">Compare Documents</button><button type="button" class="btn grey" onclick="el(\\'cmpModal\\').remove()">Close</button></div>'+
    '<div id="cmpResult" style="margin-top:14px"></div></div></div>';
  document.body.insertAdjacentHTML('beforeend',html);
}
function tenderCmpUpload(slot,inp){
  var f=inp.files&&inp.files[0];if(!f)return;
  if(f.size>TEND_MAX_FILE){alert('File is too big (max 4 MB). Please paste the tender text in the box below instead (open PDF → Ctrl+A → Ctrl+C → paste).');inp.value='';return;}
  tenderCmpReleaseBlob(slot);
  if(slot==='old'){CMP_OLD_FILE=null;if(CMP_PREVIEW.old)CMP_PREVIEW.old=null;}
  else{CMP_NEW_FILE=null;if(CMP_PREVIEW.new)CMP_PREVIEW.new=null;}
  var blobUrl='';
  if(f.size<=TEND_PREVIEW_MAX){try{blobUrl=URL.createObjectURL(f);CMP_BLOB_URLS[slot]=blobUrl;}catch(e){blobUrl='';}}
  var r=new FileReader();
  r.onload=function(){
    var parts=String(r.result||'').split(',');
    var b64=parts.length>1?parts[1]:'';
    var rec={name:f.name,mime:f.type||tenderMimeGuess(f.name),b64:b64,blobUrl:blobUrl,size:f.size};
    if(slot==='old'){CMP_OLD_FILE=rec;CMP_PREVIEW.old=rec;if(el('cmpOldLbl'))el('cmpOldLbl').textContent='✓ '+f.name;}
    else{CMP_NEW_FILE=rec;CMP_PREVIEW.new=rec;if(el('cmpNewLbl'))el('cmpNewLbl').textContent='✓ '+f.name;}
    tenderRenderCmpDocPreview(slot);
    if(el('cmpReadStatus'))el('cmpReadStatus').textContent='Uploaded — click Read, Compare, or Find when ready.';
  };
  r.onerror=function(){alert('Could not read file — it may be too large. Try a smaller PDF or paste text instead.');tenderCmpReleaseBlob(slot);};
  r.readAsDataURL(f);
  inp.value='';
}
function tenderCompareBadge(dir){
  var d=String(dir||'changed').toLowerCase();
  var labels={increased:'↑ Increased',decreased:'↓ Reduced',extended:'📅 Extended',shortened:'⏩ Earlier',added:'+ Added',removed:'− Removed',changed:'↔ Changed'};
  var cls={increased:'inc',decreased:'dec',extended:'ext',shortened:'short',added:'add',removed:'rem',changed:'chg'};
  return '<span class="cmp-badge '+(cls[d]||'chg')+'">'+(labels[d]||'↔ Changed')+'</span>';
}
function tenderCompareShareText(res){
  var t=shareHdr('TENDER COMPARISON — OLD vs NEW');
  t+=(res.summary||'')+'\\n\\n';
  if(res.changes&&res.changes.length){
    t+='CHANGES FOUND ('+res.changes.length+')\\n'+'='.repeat(40)+'\\n';
    res.changes.forEach(function(c,i){
      t+=(i+1)+'. '+c.field+' — '+(c.note||'Changed')+'\\n';
      t+='   OLD: '+(c.oldValue||'—')+'\\n';
      t+='   NEW: '+(c.newValue||'—')+'\\n\\n';
    });
  }else t+='No major field changes detected.\\n\\n';
  if(res.unchanged&&res.unchanged.length)t+='UNCHANGED: '+res.unchanged.join(', ')+'\\n\\n';
  if(res.recommendations)t+='RECOMMENDATIONS\\n'+(res.recommendations)+'\\n';
  return t+'\\n— Sent from Agile CRM Tender Reader';
}
function shareCompareEmail(){
  if(!CMP_LAST_SHARE){alert('Please run Compare first.');return;}
  openShare('Tender Comparison — Old vs New — '+today(),CMP_LAST_SHARE);
}
function shareCompareWhatsApp(){
  if(!CMP_LAST_SHARE){alert('Please run Compare first.');return;}
  window.open('https://wa.me/?text='+encodeURIComponent(CMP_LAST_SHARE),'_blank');
}
function copyCompareReport(){
  if(!CMP_LAST_SHARE){alert('Please run Compare first.');return;}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(CMP_LAST_SHARE).then(function(){alert('Report copied ✓ — paste into Email or WhatsApp.');}).catch(function(){alert('Could not copy. Use Share by Email or WhatsApp buttons.');});
  }else{alert('Copy not supported on this device. Use Share by Email or WhatsApp.');}
}
function tenderRenderCompare(res){
  if(!res)res={};
  var chg=res.changes||[],unch=res.unchanged||[],cnt=res.changeCount!=null?res.changeCount:chg.length;
  CMP_LAST_SHARE=tenderCompareShareText(res);
  var html='<div class="cmp-report">';
  html+='<div class="cmp-summary">'+(res.aiUsed?'🤖 ':'📋 ')+h(res.summary||'Comparison complete.')+'</div>';
  html+='<div class="cmp-stats">'+
    '<div class="cmp-stat"><b style="color:#f87171">'+cnt+'</b><span>Changes Found</span></div>'+
    '<div class="cmp-stat"><b style="color:#86efac">'+unch.length+'</b><span>Unchanged Fields</span></div>'+
    '<div class="cmp-stat"><b style="color:#93c5fd">'+(res.aiUsed?'AI':'Auto')+'</b><span>Read Method</span></div></div>';
  if(chg.length){
    html+='<div class="cmp-section-title">🔍 Differences — Old vs New</div>';
    chg.forEach(function(c){
      html+='<div class="cmp-change-card">'+
        '<div class="cmp-change-top"><b>'+h(c.field)+'</b>'+tenderCompareBadge(c.direction)+'</div>'+
        '<div class="cmp-values">'+
        '<div class="cmp-val-box cmp-val-old"><small>Old Document</small>'+h(c.oldValue||'—')+'</div>'+
        '<div class="cmp-val-box cmp-val-new"><small>New Document</small>'+h(c.newValue||'—')+'</div></div>'+
        (c.note?'<div class="cmp-note">'+h(c.note)+'</div>':'')+
        '</div>';
    });
  }else html+='<div style="color:var(--muted);font-size:14px;padding:20px;text-align:center;background:#0a1628;border-radius:10px">No major field changes detected between old and new documents.</div>';
  if(unch.length)html+='<div class="cmp-unchanged"><b style="color:#86efac">✓ Unchanged:</b> '+h(unch.join(' · '))+'</div>';
  if(res.recommendations)html+='<div class="cmp-reco"><b>Recommendations for Tender Cell</b>'+h(res.recommendations)+'</div>';
  html+='<div class="cmp-share-row">'+
    '<button type="button" class="btn green" style="min-height:44px" onclick="shareCompareEmail()">📨 Share by Email</button>'+
    '<button type="button" class="btn grey" style="min-height:44px;background:#166534;border-color:#22c55e;color:#fff" onclick="shareCompareWhatsApp()">💬 Share on WhatsApp</button>'+
    '<button type="button" class="btn grey" style="min-height:44px" onclick="copyCompareReport()">📋 Copy Report</button></div>';
  html+='</div>';
  return html;
}
function tenderRunCompare(i){
  var oldSel=el('cmpOldSel'),oldId=oldSel?oldSel.value:'',oldPaste=(el('cmpOldPaste')?el('cmpOldPaste').value:'').trim(),newPaste=(el('cmpNewPaste')?el('cmpNewPaste').value:'').trim();
  if(CMP_PREVIEW.old&&CMP_PREVIEW.old.sourceText)oldPaste=CMP_PREVIEW.old.sourceText;
  if(CMP_PREVIEW.new&&CMP_PREVIEW.new.sourceText)newPaste=CMP_PREVIEW.new.sourceText;
  if(!newPaste&&!CMP_NEW_FILE){alert('Upload new tender file or paste new notice text.');return;}
  if(!oldId&&!oldPaste&&!CMP_OLD_FILE){alert('Select old tender, upload old file, or paste old text.');return;}
  var outEl=el('cmpResult')||el('cmpInlineResult');
  if(outEl)outEl.innerHTML='<div style="color:var(--muted);padding:20px;text-align:center">Reading both documents &amp; comparing… please wait (up to 1 minute).</div>';
  var payload={oldTenderId:oldId,oldText:oldPaste,newText:newPaste};
  if(i>=0&&T[i])payload.newTenderId=T[i].id;
  if(CMP_OLD_FILE){payload.oldFileBase64=CMP_OLD_FILE.b64;payload.oldFileName=CMP_OLD_FILE.name;payload.oldMimeType=CMP_OLD_FILE.mime;}
  if(CMP_NEW_FILE){payload.newFileBase64=CMP_NEW_FILE.b64;payload.newFileName=CMP_NEW_FILE.name;payload.newMimeType=CMP_NEW_FILE.mime;}
  api('compareTenderDocs',payload).then(function(res){
    if(!outEl)return;
    if(res.s!==200){outEl.innerHTML='<div style="color:#f87171">'+(res.j.error||'Compare failed.')+'</div>';return;}
    if(res.j.oldSourceText)tenderCmpSetSourceText('old',res.j.oldSourceText);
    if(res.j.newSourceText)tenderCmpSetSourceText('new',res.j.newSourceText);
    outEl.innerHTML=tenderRenderCompare(res.j);
  }).catch(function(){if(outEl)outEl.innerHTML='<div style="color:#f87171">Network error.</div>';});
}
function tenderRunCompareInline(){tenderRunCompare(-1);}
/* Tender Leads (active tender process) */
function renderLiveTenderEdit(t,i){
  if(!t.bidders||!t.bidders.length)t.bidders=[{rank:'L1',name:'',quote:''},{rank:'L2',name:'',quote:''},{rank:'L3',name:'',quote:''},{rank:'L4',name:'',quote:''}];
  var bidRows=t.bidders.map(function(b,bi){return '<tr><td><b>'+h(b.rank)+'</b></td><td><input value="'+a(b.name)+'" oninput="T['+i+'].bidders['+bi+'].name=this.value"></td><td><input value="'+a(b.quote)+'" oninput="T['+i+'].bidders['+bi+'].quote=this.value"></td></tr>';}).join('');
  return '<div class="edit-panel"><div class="trow">'+
    f('Tender No',"T["+i+"].tenderNo",t.tenderNo||'')+f('Organisation Name',"T["+i+"].clientDept",t.clientDept)+f('Tender Name / Work',"T["+i+"].tenderName",t.tenderName)+
    sel('Type of Service',"T["+i+"].typeOfServices",t.typeOfServices,SERVICELINES)+f('Location',"T["+i+"].location",t.location||'')+sel('State',"T["+i+"].state",t.state||'',STATELIST)+
    '<div><label>Branch</label><select onchange="T['+i+'].branch=this.value"><option value="">—</option>'+CRMBRANCHES.map(function(b){return '<option'+(b===t.branch?' selected':'')+'>'+h(b)+'</option>';}).join('')+'</select></div>'+
    f('Contract Period',"T["+i+"].contractPeriod",t.contractPeriod||'')+f('Min Turnover (3 yrs)',"T["+i+"].minTurnover3yr",t.minTurnover3yr||'')+f('Experience Required',"T["+i+"].experienceYears",t.experienceYears||'')+
    f('Estimated Bid Value ₹',"T["+i+"].estimatedBidValue",t.estimatedBidValue||'')+f('Evaluation Method',"T["+i+"].evaluationMethod",t.evaluationMethod||'')+
    f('EMD Amount ₹',"T["+i+"].emd",t.emd)+f('ePBG %',"T["+i+"].epbgPercent",t.epbgPercent||'')+f('Score Matrix',"T["+i+"].scoreMatrix",t.scoreMatrix||'')+
    f('Service Charge',"T["+i+"].serviceCharge",t.serviceCharge||'')+f('L1 Tie Break',"T["+i+"].l1TieBreak",t.l1TieBreak||'')+f('Total Manpower',"T["+i+"].requiredManpower",t.requiredManpower)+
    f('MSE Preference',"T["+i+"].msePreference",t.msePreference||'')+f('Portal',"T["+i+"].portal",t.portal)+selTenderStatus(i,t)+
    fd('Published Date',"T["+i+"].publishedDate",t.publishedDate)+f('Pre-Bid Date & Time',"T["+i+"].prebidMeetingDate",t.prebidMeetingDate)+f('Pre-Bid Venue',"T["+i+"].prebidMeetingVenue",t.prebidMeetingVenue||'')+
    fd('EMD Preparation',"T["+i+"].emdPreparationDate",t.emdPreparationDate)+f('Bid End Date/Time',"T["+i+"].bidEndDateTime",t.bidEndDateTime||'')+f('Bid Validity from End',"T["+i+"].bidValidityFromEnd",t.bidValidityFromEnd||'')+
    fd('Submission / Last Date',"T["+i+"].submissionDate",t.submissionDate)+f('Tender Fee ₹',"T["+i+"].tenderFee",t.tenderFee)+
    f('Our Quote ₹',"T["+i+"].ourQuote",t.ourQuote)+sel('Our Position',"T["+i+"].ourPosition",t.ourPosition,OURPOS)+fd('Tentative Next Tender',"T["+i+"].nextProbableDate",t.nextProbableDate)+
    '</div>'+
    '<label style="margin-top:8px">Competitors L1–L4 (saved to Data Repository if lost)</label><div class="tblwrap"><table><thead><tr><th>Rank</th><th>Name</th><th>Rate ₹</th></tr></thead><tbody>'+bidRows+'</tbody></table></div>'+
    renderYearHistory(t,t.id)+
    '<label>Remarks</label><input value="'+a(t.remarks)+'" oninput="T['+i+'].remarks=this.value">'+
    '<div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end">'+toggleAct('T['+i+']',t.active!==false,'TEND_EDIT=-1;tenderLeads()')+'</div></div>';
}
function tenderLeads(){
  var td=today();
  var all=T.map(function(t,i){return {t:t,i:i};}).filter(function(x){return x.t.recordKind!=='Historical'&&(TEND_SHOW_INACT||x.t.active!==false);});
  var list=all.filter(function(x){
    var t=x.t;
    if(TEND_FILTER!=='All'&&mapTenderStatus(t.status)!==TEND_FILTER)return false;
    if(TEND_Q&&!matchQ(t.tenderName,TEND_Q)&&!matchQ(t.clientDept,TEND_Q)&&!matchQ(t.location,TEND_Q))return false;
    return true;
  });
  var html=pageHdr('Tender Lead','Centralised Tender Cell — track all tenders stage by stage',(ROLE==='admin'?'<button type="button" class="btn blue" onclick="addTender(\\'Live\\')">+ Add Tender</button>':''));
  html+='<div style="font-size:12px;color:#94a3b8;margin-bottom:10px">Mandatory before <b>Submitted</b>: move each tender to <b>Check Corrigendum</b> first — verify portal amendments / corrigendum (online or sealed cover) for date, EMD &amp; document changes.</div>';
  html+='<div class="filter-tabs"><div class="filter-tab '+(TEND_FILTER==='All'?'on':'')+'" onclick="TEND_FILTER=\\'All\\';tenderLeads()">All ('+all.length+')</div>';
  TSTATUS.forEach(function(st){var n=all.filter(function(x){return mapTenderStatus(x.t.status)===st;}).length;if(n||st==='Identified / Under Review'||st==='Check Corrigendum')html+='<div class="filter-tab '+(TEND_FILTER===st?' on':'')+'" onclick="TEND_FILTER=\\''+st+'\\';tenderLeads()">'+h(st)+' ('+n+')</div>';});
  html+='</div>';
  html+='<div class="search-row"><input id="tendQ" value="'+a(TEND_Q)+'" placeholder="Search by tender title or client name..." onkeydown="if(event.key===\\'Enter\\'){TEND_Q=this.value;tenderLeads();}"><button class="btn grey" onclick="TEND_Q=el(\\'tendQ\\').value;tenderLeads()">Search</button>'+showInactLbl(TEND_SHOW_INACT,'TEND_SHOW_INACT=this.checked;tenderLeads()')+'</div>';
  html+='<div class="count-note">'+list.length+' tender'+(list.length===1?'':'s')+'</div>';
  if(!list.length)html+='<div class="card" style="color:var(--muted);text-align:center;padding:40px">No tender leads yet.</div>';
  list.forEach(function(x){
    var t=x.t,i=x.i,open=TEND_EDIT===i;
    var over=t.submissionDate&&t.submissionDate<td;
    html+='<div class="tender-card'+(open?' open':'')+(t.active===false?' inact':'')+'">';
    html+='<div style="display:flex;justify-content:space-between;gap:12px"><div style="flex:1">';
    html+='<div class="tags"><span class="tag status">'+h(t.status||'Identified')+'</span>';
    if(t.location)html+='<span class="tag loc">'+h(t.location)+'</span>';
    if(t.state)html+='<span class="tag">'+h(t.state)+'</span>';
    html+='</div><div class="tc-title">'+h(t.tenderName||'(new tender)')+'</div><div class="tc-sub">'+h(t.clientDept||'—')+'</div>';
    html+='<div class="tc-dates"><div>📅 Pre-Bid<br><b>'+fmtDate(t.prebidMeetingDate)+'</b></div><div>⏱ Obtain by<br><b>'+fmtDate(t.emdPreparationDate)+'</b></div><div>📋 Submit by<br><b class="'+(over?'over':'')+'">'+fmtDate(t.submissionDate)+(over?' (Overdue)':'')+'</b></div></div>';
    html+=cardActs('TEND_EDIT='+(open?'-1':i)+';tenderLeads()','shareOpen(\\'tend\\','+i+')','T['+i+']',t.active!==false,'TEND_EDIT=-1;tenderLeads()');
    if(open)html+=renderLiveTenderEdit(t,i);
    html+='</div></div></div>';
  });
  el('content').innerHTML=html+(ROLE==='admin'?savebar('saveTendersBtn'):'');
}

/* Old Tenders archive */
function renderOldTenderEdit(t,i){
  if(!t.bidders||!t.bidders.length)t.bidders=[{rank:'L1',name:'',quote:''},{rank:'L2',name:'',quote:''},{rank:'L3',name:'',quote:''},{rank:'L4',name:'',quote:''}];
  var bidRows=t.bidders.map(function(b,bi){return '<tr><td><b>'+h(b.rank)+'</b></td><td><input value="'+a(b.name)+'" oninput="T['+i+'].bidders['+bi+'].name=this.value"></td><td><input value="'+a(b.quote)+'" oninput="T['+i+'].bidders['+bi+'].quote=this.value"></td></tr>';}).join('');
  return '<div class="tcard '+(t.active===false?'inact':'')+'"><div class="trow">'+
    f('Client / Department',"T["+i+"].clientDept",t.clientDept)+f('Tender Name',"T["+i+"].tenderName",t.tenderName)+f('Location',"T["+i+"].location",t.location||'')+
    sel('State',"T["+i+"].state",t.state||'',STATELIST)+fd('Published Date',"T["+i+"].publishedDate",t.publishedDate)+f('EMD ₹',"T["+i+"].emd",t.emd)+
    fd('Submission / Last Date',"T["+i+"].submissionDate",t.submissionDate)+fd('Contract Awarded Date',"T["+i+"].contractAwardedDate",t.contractAwardedDate)+
    f('Contract Awarded Rate ₹',"T["+i+"].contractAwardedRate",t.contractAwardedRate)+f('Awarded To (L1)',"T["+i+"].awardedTo",t.awardedTo)+
    f('Our Quote ₹',"T["+i+"].ourQuote",t.ourQuote)+sel('Our Position',"T["+i+"].ourPosition",t.ourPosition,OURPOS)+fd('Next Probable Tender',"T["+i+"].nextProbableDate",t.nextProbableDate)+'</div>'+
    '<label>Allotment details</label><input value="'+a(t.allotmentDetails)+'" oninput="T['+i+'].allotmentDetails=this.value">'+
    '<label style="margin-top:8px">Competitors L1–L4</label><div class="tblwrap"><table><thead><tr><th>Rank</th><th>Name</th><th>Rate ₹</th></tr></thead><tbody>'+bidRows+'</tbody></table></div>'+
    '<div style="margin-top:10px"><button type="button" class="btn grey" onclick="TEND_EDIT='+i+';tenderCompareOpen('+i+')">⚖ Compare with New Notice</button></div>'+
    renderYearHistory(t,t.id)+
    '<label>Remarks</label><input value="'+a(t.remarks)+'" oninput="T['+i+'].remarks=this.value">'+
    '<div style="margin-top:8px;display:flex;gap:8px;justify-content:flex-end">'+toggleAct('T['+i+']',t.active!==false,'OLD_EDIT=-1;oldTenders()')+'</div></div>';
}
function oldTenders(){
  var list=T.map(function(t,i){return {t:t,i:i};}).filter(function(x){return oldTenderInList(x.t);});
  list.sort(function(a,b){return (b.t.publishedDate||b.t.contractAwardedDate||b.t.submissionDate||'').localeCompare(a.t.publishedDate||a.t.contractAwardedDate||a.t.submissionDate||'');});
  var html=pageHdr('Tender History','Past tender records — search by client, location, state',(ROLE==='admin'?'<button class="btn gold" onclick="addTender(\\'Historical\\')">+ Add Tender History</button>':''));
  html+='<div class="search-row"><input id="oldQ" value="'+a(OLD_Q)+'" placeholder="Client / Department name..."><input id="oldLoc" value="'+a(OLD_LOC)+'" placeholder="Location / city"><select id="oldSt"><option value="">All states</option>'+STATELIST.map(function(st){return '<option'+(st===OLD_ST?' selected':'')+'>'+h(st)+'</option>';}).join('')+'</select></div>';
  html+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px"><button class="btn gold" onclick="OLD_Q=el(\\'oldQ\\').value;OLD_LOC=el(\\'oldLoc\\').value;OLD_ST=el(\\'oldSt\\').value;OLD_EDIT=-1;oldTenders()">Search</button><button class="btn grey" onclick="OLD_Q=\\'\\';OLD_LOC=\\'\\';OLD_ST=\\'\\';OLD_EDIT=-1;oldTenders()">Clear</button><label style="display:flex;align-items:center;gap:6px;color:var(--muted);font-size:12px"><input type="checkbox" '+(OLD_SHOW_INACT?'checked':'')+' onchange="OLD_SHOW_INACT=this.checked;oldTenders()"> Show deactivated</label></div>';
  html+='<div class="count-note">'+list.length+' record'+(list.length===1?'':'s')+' · latest year first</div>';
  var table='<div class="card"><div class="tblwrap"><table><thead><tr><th>Year</th><th>Client / Dept</th><th>Tender</th><th>Location</th><th>State</th><th>EMD</th><th>Awarded</th><th>Award Rate</th><th>Our Pos.</th><th>Status</th><th></th></tr></thead><tbody>';
  table+=list.length?list.map(function(x){var t=x.t,i=x.i;var cls=t.active===false?'inact':'';var acts=(ROLE==='admin'||ROLE==='coordinator')?btnEdit('OLD_EDIT='+i+';oldTenders()')+' '+btnShare('shareOpen(\\'oldtend\\','+i+')'):btnShare('shareOpen(\\'oldtend\\','+i+')');return '<tr class="'+cls+'"><td>'+h(tenderYear(t))+'</td><td>'+h(t.clientDept)+'</td><td>'+h(t.tenderName)+'</td><td>'+h(t.location)+'</td><td>'+h(t.state)+'</td><td>'+h(t.emd)+'</td><td>'+h(t.contractAwardedDate)+'</td><td>'+h(t.contractAwardedRate)+'</td><td>'+h(t.ourPosition)+'</td><td>'+(t.active===false?'Inactive':'Active')+'</td><td style="white-space:nowrap">'+acts+'</td></tr>';}).join(''):'<tr><td colspan="11" style="color:#64748b">No old tender records found. Add records one by one.</td></tr>';
  table+='</tbody></table></div></div>';
  var edit=(OLD_EDIT>=0&&T[OLD_EDIT]&&T[OLD_EDIT].recordKind==='Historical')?('<div class="card"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px"><b style="color:#fff">Edit Tender History</b>'+btnShare('shareOpen(\\'oldtend\\','+OLD_EDIT+')')+'</div>'+renderOldTenderEdit(T[OLD_EDIT],OLD_EDIT)+'</div>'):'';
  el('content').innerHTML=html+table+edit+(ROLE==='admin'?savebar('saveTendersBtn'):'');
}
function tenders(){tenderLeads();}
function addTender(kind){
  T.push(emptyTender(kind));
  var i=T.length-1;
  if(kind==='Historical'){
    OLD_EDIT=i;
    saveTendersOnly(function(r){
      oldTenders();
      alert(r.s===200?'Old tender added and saved ✓ Tap Edit to fill details.':(r.j.error||'Added in memory — tap Save at bottom.'));
    });
  }else{
    TEND_EDIT=i;TEND_READER_IDX=i;
    saveTendersOnly(function(r){
      tenderLeads();
      alert(r.s===200?'New tender added and saved ✓ Fill details in the form below.':(r.j.error||'Added in memory — tap Save at bottom.'));
    });
  }
}

function f(lbl,path,val){return '<div><label>'+lbl+'</label><input value="'+a(val)+'" oninput="'+path+'=this.value"></div>';}
function fd(lbl,path,val){return '<div><label>'+lbl+'</label><input type="date" value="'+a(val)+'" oninput="'+path+'=this.value"></div>';}
function sel(lbl,path,val,arr){return '<div><label>'+lbl+'</label><select onchange="'+path+'=this.value">'+opt(val,arr)+'</select></div>';}

/* Weekly Calendar */
function weekMonday(offset){
  var d=new Date();d.setDate(d.getDate()+(offset||0)*7);
  var day=d.getDay(),adj=day===0?-6:1-day;
  d.setDate(d.getDate()+adj);
  return d.toISOString().slice(0,10);
}
function weeklyCalendar(){
  var td=today(),ws=weekMonday(WEEK_OFFSET),days=[];
  for(var di=0;di<7;di++){var d=new Date(ws+'T00:00:00');d.setDate(d.getDate()+di);days.push(d.toISOString().slice(0,10));}
  var actA=A.filter(function(x){return (ACT_SHOW_INACT||x.active!==false)&&activityInScope(x);});
  var over=actA.filter(function(x){return x.active!==false&&!x.done&&x.date&&x.date<td;});
  var wkCount=0;
  days.forEach(function(day){
    var n=actA.filter(function(x){return x.active!==false&&!x.done&&x.date===day;}).length;
    if(ROLE==='admin'||ROLE==='coordinator')n+=tenderRemindersForDay(day).length;
    L.forEach(function(l){if(l.leadKind!=='Tender'&&l.active!==false&&leadInScope(l)&&l.nextFollowUp===day&&!isClosedWon(l.stage)&&!isClosedLost(l.stage))n++;});
    wkCount+=n;
  });
  var h1=pageHdr('Weekly Calendar','Sales meetings, tender milestones & follow-ups — Monday to Sunday','<button class="btn blue" onclick="shareOpen(\\'reminders\\',0)">📤 Share Calendar</button>');
  h1+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px"><button class="btn grey" onclick="WEEK_OFFSET--;weeklyCalendar()">← Previous week</button><button class="btn grey" onclick="WEEK_OFFSET=0;weeklyCalendar()">This week</button><button class="btn grey" onclick="WEEK_OFFSET++;weeklyCalendar()">Next week →</button></div>';
  h1+='<div class="kgrid">'+kpi(over.length,'Overdue','#ef4444')+kpi(wkCount,'This week','#f59e0b')+kpi(actA.filter(function(x){return x.active!==false&&!x.done&&x.date>days[6];}).length,'Later')+kpi(actA.filter(function(x){return x.active!==false&&x.done;}).length,'Done')+'</div>';
  var dayNames=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  days.forEach(function(day,idx){
    var items=[];
    actA.forEach(function(x){if(x.active!==false&&!x.done&&x.date===day){var lnk=findLeadForReminder(x);items.push({src:'Reminder',type:x.type,title:x.company||'(no name)',notes:x.notes||'',mapQ:activityMapQuery(x),fromLead:!!lnk});}});
    if(ROLE==='admin'||ROLE==='coordinator')tenderRemindersForDay(day).forEach(function(r){items.push({src:'Tender',type:r.type,title:r.title,notes:r.notes,mapQ:r.mapQ||'',fromLead:false});});
    L.forEach(function(l){if(l.leadKind!=='Tender'&&l.active!==false&&leadInScope(l)&&l.nextFollowUp===day&&!isClosedWon(l.stage)&&!isClosedLost(l.stage))items.push({src:'Sales Lead',type:'Follow-up',title:l.company||'Lead',notes:l.stage||'',mapQ:leadMapQuery(l),fromLead:true});});
    var cls=day===td?' rem-card':'';
    h1+='<div class="card'+cls+'" style="margin-bottom:10px"><b style="color:'+(day===td?'var(--gold2)':'#fff')+'">'+dayNames[idx]+' — '+h(fmtDate(day))+(day===td?' (Today)':'')+' <span style="color:var(--muted);font-size:12px">('+items.length+')</span></b>';
    if(items.length){
      h1+='<div class="tblwrap" style="margin-top:8px"><table><thead><tr><th>Source</th><th>Type</th><th>Item</th><th>Notes</th><th>Location</th></tr></thead><tbody>';
      items.forEach(function(it){h1+='<tr><td>'+h(it.src)+'</td><td class="due"><b>'+h(it.type)+'</b></td><td>'+h(it.title)+'</td><td>'+h(it.notes)+'</td><td>'+renderReminderLocation(it.mapQ,it.fromLead)+'</td></tr>';});
      h1+='</tbody></table></div>';
    }else h1+='<div style="color:var(--muted);font-size:13px;margin-top:8px">Nothing scheduled.</div>';
    h1+='</div>';
  });
  h1+='<div class="card"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px"><b style="color:#fff">Manual Reminders</b><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn grey" onclick="addAct()">+ Add Reminder</button>'+showInactLbl(ACT_SHOW_INACT,'ACT_SHOW_INACT=this.checked;weeklyCalendar()')+'</div></div>';
  h1+='<div style="font-size:12px;color:#94a3b8;margin-bottom:8px">Pick a Sales Lead — address is picked up automatically for Map &amp; Directions on Dash Board. You can edit the address if needed.</div>';
  var rows=actA.slice().sort(function(x,y){return (x.date||'').localeCompare(y.date||'');}).map(function(x){var i=A.indexOf(x);var cls=x.done?'':(x.date<td?'over':(x.date===td?'due':''));var mq=activityMapQuery(x);var lnk=findLeadForReminder(x);return '<tr class="'+(x.active===false?'inact':'')+'">'+
    '<td>'+reminderLeadSelect(i,x)+'</td>'+
    '<td><select onchange="A['+i+'].type=this.value">'+opt(x.type,REMINDER_TYPES)+'</select></td>'+
    '<td><input type="date" class="'+cls+'" value="'+a(x.date)+'" oninput="A['+i+'].date=this.value"></td>'+
    '<td><input value="'+a(x.location)+'" oninput="A['+i+'].location=this.value" placeholder="'+(lnk?'From Sales Lead - edit if needed':'Full address')+'" style="min-width:180px">'+(lnk&&!x.location?'<div style="font-size:10px;color:var(--gold2);margin-top:2px">From Sales Lead</div>':'')+'</td>'+
    '<td><input value="'+a(x.notes)+'" oninput="A['+i+'].notes=this.value" style="min-width:140px"></td>'+
    '<td>'+(mq?renderMapLinks(mq,true):'<span style="color:var(--muted);font-size:11px">Pick lead with address</span>')+'</td>'+
    '<td style="text-align:center"><input type="checkbox" '+(x.done?'checked':'')+' onchange="A['+i+'].done=this.checked;weeklyCalendar()"></td>'+
    '<td style="white-space:nowrap">'+toggleAct('A['+i+']',x.active!==false,'weeklyCalendar()')+'</td></tr>';}).join('');
  el('content').innerHTML=h1+'<div class="tblwrap"><table><thead><tr><th>Sales Lead / Client</th><th>Type</th><th>Reminder Date</th><th>Location</th><th>Notes</th><th>Map</th><th>Done</th><th>Action</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+savebar('saveActsBtn');
}
function followups(){weeklyCalendar();}
function addAct(){A.push({id:nid('ac'),leadId:'',tenderId:'',company:'',type:'Sales Meeting',date:today(),location:'',notes:'',done:false,active:true,createdAt:new Date().toISOString()});weeklyCalendar();}

/* Contracts & PI (Minimum Wage price increase) */
function daysAdd(n){var d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}
function contracts_pi(){
  var td=today(),soon=daysAdd(30),piSoon=daysAdd(30);
  var actC=C.filter(function(x){return CONT_SHOW_INACT||x.active!==false;});
  var renew=actC.filter(function(x){if(!x.renewalDate||x.active===false)return false;var d=daysUntil(x.renewalDate,td);return d<=30;});
  var piPend=actC.filter(function(x){return x.active!==false&&x.piStatus!=='Achieved';});
  var piDue=actC.filter(function(x){return x.active!==false&&x.nextPiDate&&x.nextPiDate<=piSoon;});
  var h1=pageHdr('Contract Renewal & PI','Contract renewals & minimum wage price increase','<button class="btn grey" onclick="addContract()">+ Add Contract</button>');
  h1+='<div class="kgrid">'+kpi(actC.filter(function(x){return x.active!==false;}).length,'Contracts')+kpi(renew.length,'Renewals due (30d)','#f59e0b')+kpi(piPend.length,'PI Pending','#ef4444')+kpi(piDue.length,'Next PI due (30d)','#f59e0b')+'</div>';
  h1+='<div class="card"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px"><b style="color:#fff">Contract Renewals &amp; Price Increase (Minimum Wage)</b><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'+showInactLbl(CONT_SHOW_INACT,'CONT_SHOW_INACT=this.checked;contracts_pi()')+'</div></div>';
  h1+='<div style="font-size:12px;color:#94a3b8;margin-bottom:8px">Add · Edit inline · Deactivate when contract ends (record kept)</div>';
  var rows=actC.map(function(c){var i=C.indexOf(c);var piCls=c.piStatus==='Achieved'?'':'over';var nCls=c.nextPiDate&&c.nextPiDate<=piSoon?'over':(c.nextPiDate&&c.nextPiDate<=soon?'due':'');
    return '<tr class="'+(c.active===false?'inact':'')+'">'+
    '<td><input value="'+a(c.client)+'" oninput="C['+i+'].client=this.value" style="min-width:130px"></td>'+
    '<td><select onchange="C['+i+'].state=this.value">'+opt(c.state,STATELIST)+'</select></td>'+
    '<td><input type="date" value="'+a(c.masterAgreementDate)+'" oninput="C['+i+'].masterAgreementDate=this.value"></td>'+
    '<td><input type="date" value="'+a(c.renewalDate)+'" oninput="C['+i+'].renewalDate=this.value"></td>'+
    '<td><input value="'+a(c.existingRate)+'" oninput="C['+i+'].existingRate=this.value" style="min-width:90px"></td>'+
    '<td><input value="'+a(c.revisedRate)+'" oninput="C['+i+'].revisedRate=this.value" style="min-width:90px"></td>'+
    '<td><input type="date" value="'+a(c.mwNotificationDate)+'" oninput="C['+i+'].mwNotificationDate=this.value"></td>'+
    '<td><select class="'+piCls+'" onchange="C['+i+'].piStatus=this.value;contracts_pi()">'+opt(c.piStatus,PISTATUS)+'</select></td>'+
    '<td><input type="date" value="'+a(c.piAchievedDate)+'" oninput="C['+i+'].piAchievedDate=this.value"></td>'+
    '<td><input type="date" class="'+nCls+'" value="'+a(c.nextPiDate)+'" oninput="C['+i+'].nextPiDate=this.value"></td>'+
    '<td><input value="'+a(c.remarks)+'" oninput="C['+i+'].remarks=this.value"></td>'+
    '<td style="white-space:nowrap">'+btnShare('shareOpen(\\'contract\\','+i+')')+' '+toggleAct('C['+i+']',c.active!==false,'contracts_pi()')+'</td></tr>';}).join('');
  el('content').innerHTML=h1+'<div class="tblwrap"><table><thead><tr><th>Client</th><th>State</th><th>Master Agmt</th><th>Renewal</th><th>Existing Rate</th><th>Revised Rate</th><th>MW Notif.</th><th>PI Status</th><th>PI Achieved</th><th>Next PI</th><th>Remarks</th><th>Action</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+savebar();
}
function addContract(){C.push({id:nid('ct'),client:'',state:'Telangana',masterAgreementDate:'',renewalDate:'',existingRate:'',revisedRate:'',mwNotificationDate:'',piStatus:'Pending',piAchievedDate:'',nextPiDate:daysAdd(180),remarks:'',active:true,createdAt:new Date().toISOString()});contracts_pi();}

/* Communication Formats */
var FCATS=['Agreement','Email','Letter','Notice','Other'];
function formats(){api('loadFormats').then(function(res){if(res.s!==200){el('content').innerHTML='<div class="card">Could not load formats.</div>';return;}F=res.j.formats||[];renderFormats();});}
function renderFormats(){
  el('content').innerHTML='<div class="card"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><b style="color:#fff">Standard Formats — Agreement · Thank-you · Price Increase · Renewal &amp; more</b><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button type="button" class="btn grey" onclick="addFormat()">+ Add Format</button>'+showInactLbl(FMT_SHOW_INACT,'FMT_SHOW_INACT=this.checked;renderFormats()')+'</div></div><div style="font-size:12px;color:#94a3b8;margin-top:6px">Tap <b>Send Mail</b> — the email form opens at the <b>top</b> of the page (gold border). Type email, then tap green Send.</div></div><div id="fmtList"></div>'+savebar('saveFmtBtn');
  var list=el('fmtList');
  var vis=F.map(function(f,i){return {f:f,i:i};}).filter(function(x){return FMT_SHOW_INACT||x.f.active!==false;});
  list.innerHTML=vis.map(function(x){var f=x.f,i=x.i;return '<div class="card '+(f.active===false?'inact':'')+'">'+
    '<div class="fhead"><div><label>Title</label><input value="'+a(f.title)+'" oninput="F['+i+'].title=this.value"></div>'+
    '<div style="max-width:180px"><label>Category</label><select onchange="F['+i+'].category=this.value">'+opt(f.category,FCATS)+'</select></div>'+
    toggleAct('F['+i+']',f.active!==false,'renderFormats()')+
    '<button type="button" class="btn gold" onclick="copyFormat('+i+')">📋 Copy</button>'+
    '<button type="button" class="btn green" onclick="openFmtMail('+i+')">✉️ Send Mail</button></div>'+
    '<label>Format Text</label><textarea id="fmtTa'+i+'" oninput="F['+i+'].body=this.value">'+h(f.body)+'</textarea>'+
    '</div>';}).join('');
}
function addFormat(){F.push({id:nid('fmt'),title:'New Format',category:'Email',body:'',active:true});renderFormats();}
function copyFormat(i){var t=F[i].body||'';if(navigator.clipboard){navigator.clipboard.writeText(t).then(function(){alert('Copied "'+F[i].title+'" ✓');});}else{var ta=el('fmtTa'+i);ta.select();document.execCommand('copy');alert('Copied ✓');}}
function fmtSubj(body,title){var m=String(body||'').match(/^\\s*Subject:\\s*(.+)$/mi);return m?m[1].trim():title;}
function openFmtMail(i){
  var f=F[i];
  if(!f){alert('Format not found.');return;}
  openShare(fmtSubj(f.body,f.title),f.body||'');
}
function saveFormats(){api('saveFormats',{formats:F}).then(function(r){alert(r.s===200?'Formats saved ✓':(r.j.error||'Error'));});}

/* Data Repository — contract renewal, uniform, security equipment follow-ups */
function repository(){
  var td=today(),soon=daysAdd(30);
  var list=FU.filter(function(x){return (FU_SHOW_INACT||x.active!==false)&&!(ROLE==='branch'&&BRANCH&&x.branch!==BRANCH);});
  var renewDue=list.filter(function(x){return x.active!==false&&x.contractRenewalDate&&daysUntil(x.contractRenewalDate,td)<=30;}).length;
  var uniDue=list.filter(function(x){return x.active!==false&&x.uniformStatus!=='Issued'&&x.uniformStatus!=='Not Applicable'&&(x.uniformFollowUp&&x.uniformFollowUp<=soon||x.uniformStatus==='Due'||x.uniformStatus==='Pending');}).length;
  var eqDue=list.filter(function(x){return x.active!==false&&x.equipmentStatus!=='Issued'&&x.equipmentStatus!=='Not Applicable'&&(x.equipmentFollowUp&&x.equipmentFollowUp<=soon||x.equipmentStatus==='Due'||x.equipmentStatus==='Pending');}).length;
  var h1='<div class="kgrid">'+kpi(list.filter(function(x){return x.active!==false;}).length,'Client Sites')+kpi(renewDue,'Renewals (60d)','#f59e0b')+kpi(uniDue,'Uniform Follow-up','#a855f7')+kpi(eqDue,'Equipment Follow-up','#3b82f6')+'</div>';
  h1+='<div class="card"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px"><b style="color:#fff">Client Follow-ups — Renewal · Uniform · Security Equipment</b><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn grey" onclick="addFollowUp()">+ Add Client Site</button>'+showInactLbl(FU_SHOW_INACT,'FU_SHOW_INACT=this.checked;repository()')+'</div></div>';
  h1+='<div style="font-size:12px;color:#94a3b8;margin-bottom:8px">Add · Edit inline · Deactivate when site closed (record kept)</div>';
  var fuRows=list.map(function(x){var i=FU.indexOf(x);var rCls=x.contractRenewalDate&&x.contractRenewalDate<=daysAdd(60)?'due':'';var uCls=x.uniformStatus==='Due'||x.uniformStatus==='Pending'?'over':'';var eCls=x.equipmentStatus==='Due'||x.equipmentStatus==='Pending'?'over':'';
    return '<tr class="'+(x.active===false?'inact':'')+'">'+
    '<td><input value="'+a(x.client)+'" oninput="FU['+i+'].client=this.value" style="min-width:120px"></td>'+
    '<td><select onchange="FU['+i+'].branch=this.value"><option value="">—</option>'+CRMBRANCHES.map(function(b){return '<option'+(b===x.branch?' selected':'')+'>'+h(b)+'</option>';}).join('')+'</select></td>'+
    '<td><input value="'+a(x.location)+'" oninput="FU['+i+'].location=this.value"></td>'+
    '<td><input type="date" class="'+rCls+'" value="'+a(x.contractRenewalDate)+'" oninput="FU['+i+'].contractRenewalDate=this.value"></td>'+
    '<td><input type="date" value="'+a(x.contractFollowUp)+'" oninput="FU['+i+'].contractFollowUp=this.value"></td>'+
    '<td><select class="'+uCls+'" onchange="FU['+i+'].uniformStatus=this.value">'+opt(x.uniformStatus,ISSUESTATUS)+'</select></td>'+
    '<td><input value="'+a(x.uniformIssued)+'" oninput="FU['+i+'].uniformIssued=this.value" placeholder="Qty / date issued"></td>'+
    '<td><input type="date" value="'+a(x.uniformFollowUp)+'" oninput="FU['+i+'].uniformFollowUp=this.value"></td>'+
    '<td><select class="'+eCls+'" onchange="FU['+i+'].equipmentStatus=this.value">'+opt(x.equipmentStatus,ISSUESTATUS)+'</select></td>'+
    '<td><input value="'+a(x.equipmentIssued)+'" oninput="FU['+i+'].equipmentIssued=this.value" placeholder="Torch, baton, etc."></td>'+
    '<td><input type="date" value="'+a(x.equipmentFollowUp)+'" oninput="FU['+i+'].equipmentFollowUp=this.value"></td>'+
    '<td><input value="'+a(x.notes)+'" oninput="FU['+i+'].notes=this.value"></td>'+
    '<td style="white-space:nowrap">'+btnShare('shareOpen(\\'repo\\','+i+')')+' '+toggleAct('FU['+i+']',x.active!==false,'repository()')+'</td></tr>';}).join('');
  h1+='<div class="tblwrap"><table><thead><tr><th>Client</th><th>Branch</th><th>Location</th><th>Renewal</th><th>Renewal F/U</th><th>Uniform</th><th>Uniform Detail</th><th>Uniform F/U</th><th>Equipment</th><th>Equipment Detail</th><th>Equip F/U</th><th>Notes</th><th>Action</th></tr></thead><tbody>'+(fuRows||'<tr><td colspan="13" style="color:#64748b">No client sites yet. Click + Add Client Site.</td></tr>')+'</tbody></table></div></div>';
  if(ROLE==='admin'){
    var docList=D.filter(function(x){return DOC_SHOW_INACT||x.active!==false;});
    h1+='<div class="card" style="margin-top:16px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px"><b style="color:#fff">Secure Documents &amp; Links</b><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn grey" onclick="addDoc()">+ Add Document</button>'+showInactLbl(DOC_SHOW_INACT,'DOC_SHOW_INACT=this.checked;repository()')+'</div></div>';
    h1+='<div style="font-size:12px;color:#94a3b8;margin-bottom:8px">Add · Edit · Deactivate (link hidden when inactive)</div>';
    h1+='<div class="tblwrap"><table><thead><tr><th>Title</th><th>Category</th><th>Link</th><th>Notes</th><th>Added By</th><th>Date</th><th>Action</th></tr></thead><tbody>';
    h1+=docList.map(function(d){var i=D.indexOf(d);return '<tr class="'+(d.active===false?'inact':'')+'">'+
      '<td><input value="'+a(d.title)+'" oninput="D['+i+'].title=this.value"></td>'+
      '<td><select onchange="D['+i+'].category=this.value">'+opt(d.category,DOCCATS)+'</select></td>'+
      '<td><input value="'+a(d.link)+'" oninput="D['+i+'].link=this.value" placeholder="https://..."> '+(d.link?'<a href="'+a(d.link)+'" target="_blank" style="color:var(--gold2)">Open</a>':'')+'</td>'+
      '<td><input value="'+a(d.notes)+'" oninput="D['+i+'].notes=this.value"></td>'+
      '<td><input value="'+a(d.addedBy)+'" oninput="D['+i+'].addedBy=this.value"></td>'+
      '<td><input type="date" value="'+a(d.date)+'" oninput="D['+i+'].date=this.value"></td>'+
      '<td style="white-space:nowrap">'+toggleAct('D['+i+']',d.active!==false,'repository()')+'</td></tr>';}).join('')+'</tbody></table></div></div>';
  }
  var arList=LA.filter(function(x){
    if(ROLE==='branch'&&BRANCH&&x.branch!==BRANCH)return false;
    return x.active!==false;
  });
  if(arList.length||ROLE==='admin'||ROLE==='coordinator'){
    h1+='<div class="card" style="margin-top:16px;border-left:4px solid #ef4444"><b style="color:#fff">Lost Deals Archive — Sales &amp; Tenders</b>';
    h1+='<div style="font-size:12px;color:#94a3b8;margin-bottom:8px">When a lead or tender is marked <b>Closed - Lost</b>, the full record moves here with competitor rates (L1–L4 for tenders).</div>';
    h1+='<div class="tblwrap"><table><thead><tr><th>Type</th><th>Branch</th><th>Client</th><th>Title</th><th>Our Quote</th><th>Our Pos.</th><th>Competitors</th><th>Closed</th></tr></thead><tbody>';
    h1+=arList.length?arList.map(function(x){
      return '<tr><td>'+(x.kind==='tender'?'Tender':'Sales')+'</td><td>'+h(x.branch)+'</td><td>'+h(x.client)+'</td><td>'+h(x.title)+'</td><td>'+h(x.ourQuote)+'</td><td>'+h(x.ourPosition||'—')+'</td><td style="max-width:220px">'+h(x.competitorSummary)+'</td><td>'+h(x.closedDate)+'</td></tr>';
    }).join(''):'<tr><td colspan="8" style="color:#64748b">No lost deals archived yet.</td></tr>';
    h1+='</tbody></table></div></div>';
  }
  el('content').innerHTML=h1+savebar('saveRepoBtn');
}
function addFollowUp(){FU.push({id:nid('fu'),client:'',branch:BRANCH||'',location:'',contractRenewalDate:'',contractFollowUp:'',uniformStatus:'Pending',uniformIssued:'',uniformFollowUp:'',equipmentStatus:'Pending',equipmentIssued:'',equipmentFollowUp:'',notes:'',active:true,createdAt:new Date().toISOString()});repository();}
function addDoc(){D.push({id:nid('dc'),title:'',category:'Master Agreement',link:'',notes:'',addedBy:'',date:today(),active:true});repository();}
function saveRepository(){var jobs=[api('saveFollowUps',{followUps:FU})];if(ROLE==='admin'||ROLE==='coordinator')jobs.push(api('saveLostArchives',{lostArchives:LA}));if(ROLE==='admin')jobs.push(api('saveDocs',{docs:D}));Promise.all(jobs).then(function(r){alert(r[0].s===200?'Data Repository saved ✓':(r[0].j.error||'Error'));});}

function savebar(id){
  if(id==='saveRepoBtn')return '<div class="savebar"><button class="btn green" onclick="saveRepository()">✅ Save Data Repository</button></div>';
  if(id==='saveSurveysBtn')return '<div class="savebar"><button class="btn green" onclick="saveSurveys()">✅ Save Security Surveys</button></div>';
  return '<div class="savebar"><button class="btn green" onclick="'+(id==='saveFmtBtn'?'saveFormats()':'saveAll()')+'">✅ Save &amp; Publish</button></div>';
}
function saveAll(){Promise.all([api('saveLeads',{leads:L}),api('saveTenders',{tenders:T}),api('saveActivities',{activities:A}),api('saveContracts',{contracts:C}),api('saveSurveys',{surveys:SV}),api('saveLostArchives',{lostArchives:LA})]).then(function(r){alert('Saved ✓');});}
(function(){
  closeAllOverlays();
  var cam=el('svPhotoCam'),gal=el('svPhotoGallery');
  if(cam)cam.addEventListener('change',function(){svPhotoFromInput(cam);});
  if(gal)gal.addEventListener('change',function(){svPhotoFromInput(gal);});
})();
</script>
</body></html>`

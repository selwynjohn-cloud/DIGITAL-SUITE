/**
 * HDFC Training report — open quiz results + training acknowledgements.
 * Public link from Training (not Client Door). English.
 */

import { suiteAppOpenPageFooterHtml } from '../suite-app-footer.js'
import {
  EN_ADV,
  FA_ADVISORY_INFOGRAPHIC_FILE,
  FA_ADVISORY_INFOGRAPHIC_PATH,
  FA_ADVISORY_URL,
  faAdvIssueStamp,
} from './fa-advisory-i18n.js'
import {
  branchTables,
  sampleQuizHtml,
  trainingTables,
  type FaClientListRow,
} from './fa-advisory-mail.js'
import { trainingBrandHeaderHtml, trainingBrandSignOffHtml, trainingTrack1EmailShell } from './training-brand.js'
import type { FaHdfcPack } from './fa-hdfc-pack.js'

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function faHdfcCombinedListsHtml(opts: {
  advRows: FaClientListRow[]
  trainRows: FaClientListRow[]
  branchLabel: string
  period: string
  pack?: FaHdfcPack | null
}): string {
  const adv = opts.advRows || []
  const train = opts.trainRows || []
  const review = opts.pack
    ? `<p style="margin:0 0 14px;color:#334155;font-size:13px">
        OM reviewed: <b>${esc(opts.pack.omName || '—')}</b>${opts.pack.omAt ? ` · ${esc(opts.pack.omAt)}` : ''}
        · HOD approved: <b>${esc(opts.pack.hodName || '—')}</b>${opts.pack.hodAt ? ` · ${esc(opts.pack.hodAt)}` : ''}
      </p>`
    : ''
  return `
    <p style="margin:0 0 10px;color:#0f172a;font-size:15px;line-height:1.5">
      Standing <b>HDFC Bank — Strategic Client</b> report from Agile Training.
      Quiz results and training acknowledgements are shown openly for this branch.
    </p>
    <p style="margin:0 0 8px;color:#334155;font-size:13px">
      Branch: <b>${esc(opts.branchLabel)}</b> · Period: <b>${esc(opts.period)}</b>
      · Advisory acknowledgements: <b>${adv.length}</b>
      · Training acknowledgements: <b>${train.length}</b>
    </p>
    ${review}
    ${sampleQuizHtml()}
    <h2 style="margin:22px 0 8px;color:#14224f;font-size:18px">1. Advisory quiz results (open)</h2>
    <p style="margin:0 0 10px;color:#334155;font-size:13px">Each Facility Attendant answered the 3 questions on the three points and gave the undertaking.</p>
    ${adv.length ? branchTables(adv) : '<p style="color:#0f172a">No advisory acknowledgements in this period.</p>'}
    <h2 style="margin:22px 0 8px;color:#14224f;font-size:18px">2. Training completion acknowledgements</h2>
    <p style="margin:0 0 10px;color:#334155;font-size:13px">Facility Attendants who completed Learn &amp; Confirm training and submitted acknowledgement.</p>
    ${train.length ? trainingTables(train) : '<p style="color:#0f172a">No training acknowledgements in this period.</p>'}
    <p style="margin:16px 0 0;font-size:13px;color:#334155">
      Facility Attendant advisory link (quiz + acknowledgement):<br>
      <a href="${FA_ADVISORY_URL}">${FA_ADVISORY_URL}</a>
    </p>
    ${trainingBrandSignOffHtml()}
  `
}

export function faHdfcReportPageHtml(opts: {
  advRows: FaClientListRow[]
  trainRows: FaClientListRow[]
  branchLabel: string
  period: string
  pack?: FaHdfcPack | null
}): string {
  const issue = faAdvIssueStamp()
  const body = faHdfcCombinedListsHtml(opts)
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>HDFC Bank — FA advisory &amp; training report</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#eef2f8;color:#14224f}
.wrap{max-width:960px;margin:0 auto;padding:16px}
.card{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,.08)}
.inner{padding:18px 16px 8px}
.info-btn{display:block;width:100%;text-align:center;margin:12px 0;padding:12px 14px;background:#c9a84c;color:#14224f;border:0;border-radius:8px;font-weight:800;cursor:pointer;font-size:1rem}
.info-view{display:none;position:fixed;inset:0;z-index:80;background:rgba(15,23,42,.82);padding:16px;overflow:auto}
.info-view.on{display:block}
.info-view-card{max-width:920px;margin:8px auto 24px;background:#fff;border-radius:12px;padding:12px}
.info-view-card img{display:block;width:100%;height:auto;border-radius:8px}
.info-view-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.info-view-actions .btn{flex:1;min-width:110px;min-height:48px;display:grid;place-items:center;text-decoration:none;border:0;border-radius:8px;font-weight:800;cursor:pointer}
.btn.gold{background:#c9a84c;color:#14224f}
.btn.ghost{background:#14224f;color:#fff}
h1{font-size:1.25rem;margin:0 0 6px}
.sub{color:#1e3a6e;font-weight:800;margin:0 0 12px}
</style>
</head>
<body>
<main class="wrap">
  <div class="card">
    ${trainingBrandHeaderHtml({
      title: 'HDFC Bank — Strategic Client',
      subtitle: `FA advisory & training report · ${issue} · ${opts.branchLabel}`,
      accentFrom: '#14224f',
      accentTo: '#1e3a6e',
    })}
    <div class="inner">
      <h1>${esc(EN_ADV.title)}</h1>
      <p class="sub">${esc(EN_ADV.subtitle)}</p>
      ${body}
      <button type="button" class="info-btn" id="infoOpen">Open Infographic</button>
    </div>
  </div>
  ${suiteAppOpenPageFooterHtml()}
</main>
<div class="info-view" id="infoView">
  <div class="info-view-card">
    <img src="${FA_ADVISORY_INFOGRAPHIC_PATH}?v=logo" alt="Integrity at Work — HDFC Bank Compliance Advisory">
    <div class="info-view-actions">
      <a class="btn gold" href="${FA_ADVISORY_INFOGRAPHIC_PATH}?v=logo" download="${FA_ADVISORY_INFOGRAPHIC_FILE}">Download</a>
      <button type="button" class="btn ghost" id="infoClose">Close</button>
    </div>
  </div>
</div>
<script>
(function(){
  var box=document.getElementById('infoView');
  var open=document.getElementById('infoOpen');
  var close=document.getElementById('infoClose');
  if(open) open.onclick=function(){ if(box) box.classList.add('on'); };
  if(close) close.onclick=function(){ if(box) box.classList.remove('on'); };
  if(box) box.onclick=function(ev){ if(ev.target===box) box.classList.remove('on'); };
})();
</script>
</body></html>`
}

export function faHdfcReportMailHtml(opts: {
  reportUrl: string
  branchLabel: string
  period: string
  advCount: number
  trainCount: number
  omName: string
  hodName: string
}): string {
  const issue = faAdvIssueStamp()
  const body = `
    <p style="margin:0 0 12px;color:#0f172a;font-size:15px;line-height:1.55">
      Dear Sir / Madam,
    </p>
    <p style="margin:0 0 12px;color:#0f172a;font-size:15px;line-height:1.55">
      Greetings from Agile Group. Please open the <b>Training report</b> for
      <b>${esc(opts.branchLabel)}</b>. Quiz answers and training acknowledgements are shown openly.
    </p>
    <p style="margin:0 0 16px;padding:14px;background:#fffbeb;border:1px solid #c9a84c;border-radius:10px">
      <b>Open the branch report:</b><br>
      <a href="${esc(opts.reportUrl)}" style="color:#14224f;font-weight:800">${esc(opts.reportUrl)}</a>
    </p>
    <p style="margin:0 0 10px;color:#334155;font-size:13px">
      Compliance Advisory Series · ${esc(issue)} · Period: <b>${esc(opts.period)}</b><br>
      Advisory quiz acknowledgements: <b>${opts.advCount}</b>
      · Training completion acknowledgements: <b>${opts.trainCount}</b><br>
      OM reviewed: <b>${esc(opts.omName || '—')}</b> · HOD approved: <b>${esc(opts.hodName || '—')}</b>
    </p>
    <p style="margin:0 0 10px;color:#334155;font-size:13px">
      The report is from Agile Training. It is not the Client Door daily operations page.
    </p>
    ${trainingBrandSignOffHtml()}
  `
  return trainingTrack1EmailShell({
    title: 'HDFC Bank — FA advisory & training report',
    subtitle: `${opts.branchLabel} · ${issue}`,
    bodyHtml: body,
    includeImportantNumbers: false,
    accentFrom: '#14224f',
    accentTo: '#1e3a6e',
  })
}

export function faHdfcMissingReportHtml(): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Report not found</title></head>
<body style="font-family:'Segoe UI',system-ui,sans-serif;padding:24px;color:#14224f">
<p>This Training report link is not valid. Please ask the Agile branch HOD to send the report again.</p>
</body></html>`
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hodLoginHtml, otpLoginScript } from '../_lib/embedded-otp.js'
import { loadBranchLoginOptionsHtml } from '../_lib/branch-login-options.js'
import { hodBootFromRequest, hodBootScriptJson } from '../_lib/hod-session.js'
import {
  MIS_STAFF_LAYOUT_CSS,
  MIS_STAFF_SESSION_JS,
  MIS_STAFF_THEME_CSS,
  misStaffPageWrap,
  STAFF_BOOT_HEAD_SCRIPT,
  STAFF_BOOT_WAIT_HTML,
} from '../_lib/mis/staff-layout.js'
import { incidentReportInnerHtml, incidentReportClientScript } from '../_lib/mis/incident-report-ui.js'
import { MIS_STAFF_CSS } from '../_lib/mis/staff-theme.js'
import { CLIENT_PERF_DASHBOARD_CSS } from '../_lib/mis/client-perf-ui.js'
import { CLIENT_PERF_MONEY_JS } from '../_lib/mis/client-perf-money.js'
import { CLIENT_PERF_BILLING_BAR_JS } from '../_lib/mis/client-perf-billing-bar.js'
import { COMPLAINT_NATURES } from '../_lib/mis/store.js'
import { SLA_COMPLIANCE_PAGE_CSS, SLA_COMPLIANCE_PAGE_JS } from '../_lib/mis/sla-compliance-page.js'
import {
  clientVisitCss,
  clientVisitInnerHtml,
  clientVisitScript,
  clientVisitStaffBootScript,
} from '../_lib/mis/client-visit-ui.js'
import { DUTY_CONTACT_CSS, DUTY_CONTACT_JS } from '../_lib/mis/duty-contact.js'

type StaffPage = { active: string; title: string; inner: string; script: string }

const NATURES_JSON = JSON.stringify([...COMPLAINT_NATURES])
const GUARDS_URL = 'https://www.agilegroup-digital.co.in/guards'

const FEED_NOTE = `<div class="staff-note noprint"><b>Branch Portal</b> — Enter and submit your branch data here. <b>Management Portal</b> consolidates all branches into one report for Director and MD Sir.</div>`

const SHARED_STYLE = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_STAFF_CSS}
${MIS_STAFF_THEME_CSS}
${MIS_STAFF_LAYOUT_CSS}
${DUTY_CONTACT_CSS}
${clientVisitCss()}
.staff-login-wrap .card{background:linear-gradient(180deg,#111a30,#0e1730);border:1px solid #475569;border-radius:14px;padding:20px}
.hidden{display:none!important}
.hod-spinner{width:44px;height:44px;border:4px solid #334155;border-top-color:#c9a84c;border-radius:50%;animation:hodSpin .9s linear infinite;margin:0 auto 12px}
@keyframes hodSpin{to{transform:rotate(360deg)}}
.daily-step-card{display:block;padding:20px 18px;margin-bottom:14px;border-radius:12px;border:2px solid #334155;background:#0e1730;text-decoration:none;color:#e2e8f0;transition:border-color .15s}
.daily-step-card:hover{border-color:#c9a84c}
.daily-step-card .step-num{display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;border-radius:50%;background:#c9a84c;color:#14224f;font-weight:900;margin-right:12px}
.daily-step-card b{display:block;color:#fde68a;font-size:17px;margin-top:4px}
.daily-step-card small{display:block;color:#94a3b8;font-size:13px;margin-top:6px;line-height:1.45}
.daily-frame-wrap{position:relative;min-height:calc(100vh - 150px)}
.daily-frame-load{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0b1220;z-index:2}
.daily-mis-frame{width:100%;min-height:calc(100vh - 150px);border:none;background:#0b1220;display:block}
.deploy-load{padding:28px 16px;text-align:center}
.deploy-tbl{overflow:auto;max-height:min(68vh,560px);-webkit-overflow-scrolling:touch;border:1px solid #334155;border-radius:10px}
.deploy-tbl table{min-width:1200px;font-size:11px;border-collapse:separate;border-spacing:0}
.deploy-tbl th{background:#14224f;color:#fde68a;padding:6px 4px}
.deploy-tbl td{padding:5px 4px}
.deploy-tbl input.m-inp{width:52px;padding:5px 3px;text-align:center;font-size:13px}
.deploy-tbl .san-cell{color:#fde68a;font-weight:800;background:#111a30}
.deploy-tbl .grp-a{background:rgba(59,130,246,.1)}
.deploy-tbl .grp-g{background:rgba(234,179,8,.08)}
.deploy-tbl .grp-b{background:rgba(34,197,94,.08)}
.deploy-tbl .grp-c{background:rgba(239,68,68,.08)}
.deploy-tbl thead tr:first-child th{position:sticky;top:0;z-index:4;background:#14224f}
.deploy-tbl thead tr:nth-child(2) th{position:sticky;top:28px;z-index:4;background:#14224f}
.deploy-tbl .freeze-h{position:sticky;z-index:6}
.deploy-tbl thead .freeze-num{left:0;min-width:40px;width:40px}
.deploy-tbl thead .freeze-client{left:40px;min-width:140px;width:140px}
.deploy-tbl thead .freeze-loc{left:180px;min-width:140px;width:140px;box-shadow:3px 0 6px rgba(0,0,0,.35)}
.deploy-tbl tbody .freeze-num{position:sticky;left:0;z-index:3;min-width:40px;width:40px;background:#111a30;font-weight:800;color:#fde68a}
.deploy-tbl tbody .freeze-client{position:sticky;left:40px;z-index:3;min-width:140px;width:140px;background:#111a30;text-align:left}
.deploy-tbl tbody .freeze-loc{position:sticky;left:180px;z-index:3;min-width:140px;width:140px;background:#111a30;text-align:left;box-shadow:3px 0 6px rgba(0,0,0,.25)}
.deploy-tbl tbody tr:nth-child(even) .freeze-num,.deploy-tbl tbody tr:nth-child(even) .freeze-client,.deploy-tbl tbody tr:nth-child(even) .freeze-loc{background:#0e1730}
.deploy-tbl thead .freeze-num,.deploy-tbl thead .freeze-client,.deploy-tbl thead .freeze-loc{background:#14224f}
.shortage-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:12px}
.shortage-grid label{display:block;color:#94a3b8;font-size:12px;margin-bottom:4px}
.shortage-grid .m-inp{width:100%;max-width:100%}
.sum-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}
.sec{margin-bottom:18px}
.sec-h{font-size:14px;font-weight:900;color:#c9a84c;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}
.field-hint{font-size:11px;color:#64748b;margin-top:3px;line-height:1.35}
.field-auto{color:#4ade80}
.field-manual{color:#94a3b8}
.field-attn{color:#fbbf24;font-weight:600}
.sum-help{margin:10px 0 14px;padding:12px 14px;border:1px solid #334155;border-radius:10px;background:#0e1730;color:#cbd5e1;font-size:13px;line-height:1.55}
.sum-help b{color:#fde68a}
.sum-help a{color:#93c5fd;font-weight:700}
${CLIENT_PERF_DASHBOARD_CSS}
${SLA_COMPLIANCE_PAGE_CSS}
`

function shell(page: StaffPage, hodBoot = 'null', branchHtml = ''): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — ${page.title}</title>
<script>window.__HOD_BOOT__=${hodBoot};</script>
${STAFF_BOOT_HEAD_SCRIPT}
<style>${SHARED_STYLE}
html.boot-ready #staffLogin{display:none!important}
html.boot-ready #staffShell{display:flex!important}
</style></head>
<body>
${STAFF_BOOT_WAIT_HTML}
<div id="staffLogin" class="staff-login-wrap">
<p style="margin-bottom:12px;padding:12px 14px;border-radius:10px;background:#0e1730;border:1px solid #22c55e;text-align:center;font-size:13px;color:#cbd5e1;line-height:1.55">
  <b style="color:#4ade80">HOD Portal</b> — Select your branch (Chennai, Mumbai, Kochi, …), then email PIN or 6-digit branch password.<br>
  On phone: type password → tap gold <b>Sign in</b> (keyboard Done does not sign in).<br>
  <a href="/mis-staff?fresh=1" style="color:#fde68a;font-weight:800">Stuck? Tap here for fresh sign-in</a>
</p>
${hodLoginHtml('Agile MIS', page.title + ' — branch HOD sign in', branchHtml)}
</div>
<div id="staffShell" class="hidden">
${misStaffPageWrap(page.active, page.title, FEED_NOTE + page.inner)}
</div>
<script>
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
${otpLoginScript('mis-report', 'Agile MIS — Branch Portal', 'staff')}
${MIS_STAFF_SESSION_JS}
function onOtpLogin(j){staffOnLogin(j);}
${page.script}
(function(){
  var fresh=new URLSearchParams(location.search).get('fresh')==='1';
  if(fresh){
    sessionStorage.removeItem('otp_mis-report');
    sessionStorage.removeItem('otp_email_mis-report');
    sessionStorage.removeItem('otp_branch_mis-report');
    sessionStorage.removeItem('otp_branch_name_mis-report');
    document.documentElement.classList.remove('hod-signed-in','boot-ready','staff-booting','boot-failed');
    fetch('/api/auth/hod-session',{method:'DELETE',credentials:'include'}).catch(function(){});
    if(typeof staffShowLogin==='function')staffShowLogin('');
  } else staffBoot();
})();
</script>
</body></html>`
}

const DASHBOARD: StaffPage = {
  active: '/mis-staff',
  title: 'Dashboard',
  inner: `<div class="m-wrap">
  <div class="m-card">
    <div class="hint" style="margin-top:0">Same report sections as Management Dashboard — for <b>your branch only</b>.</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-top:10px">
      <div><label class="m-lbl">Report Date</label><input class="m-inp" id="date" type="date"></div>
      <button class="m-btn m-btn-gold" onclick="load()">Show</button>
      <a class="m-btn m-btn-navy" href="/mis-staff-daily" style="text-decoration:none">🕒 Submit Daily MIS</a>
    </div>
  </div>
  <div class="sec"><div class="sec-h">Deployment</div><div class="m-kgrid" id="kDeploy"></div></div>
  <div class="m-card" id="recruitList">
    <h4>Recruitment and Rejoin — name list</h4>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th>#</th><th>Type</th><th>Name</th><th>Emp / Code</th><th>Unit / Site</th><th class="c">DOJ</th><th>Referred by</th><th>Source</th></tr></thead><tbody id="recruitRows"></tbody></table></div>
  </div>
  <div class="sec"><div class="sec-h">Operations &amp; Compliance</div><div class="m-kgrid" id="kOps"></div></div>
  <div class="sec"><div class="sec-h">Collections &amp; Duty Start</div><div class="m-kgrid" id="kColl"></div></div>
  <div class="sec"><div class="sec-h">Patrol &amp; Duty (Mobile)</div><div class="m-kgrid" id="kPatrolDuty"></div></div>
  <div class="m-card"><h4>Submission Status</h4><div id="subStatus" class="hint">Loading…</div></div>
  <div class="m-card"><h4>Patrol — KM Travelled <span style="color:#93c5fd;font-size:12px">(Agile Mobile)</span></h4>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th>Staff</th><th>Client</th><th>Site</th><th class="c">Time</th><th>Patrol Point</th><th class="c">KM</th></tr></thead><tbody id="patrolRows"></tbody></table></div>
  </div>
  <div class="m-card"><h4>Late Duty <span style="color:#fbbf24;font-size:12px">(guard mobile · Call · WhatsApp warning)</span></h4>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th>Guard</th><th class="c">Mobile</th><th>Client</th><th>Site</th><th class="c">Start Time</th><th class="c">Call</th><th class="c">WhatsApp Warning</th><th>Remarks</th></tr></thead><tbody id="lateRows"></tbody></table></div>
  </div>
  <div class="m-card"><h4>Out of Location <span style="color:#fca5a5;font-size:12px">(guard mobile · Call · WhatsApp warning)</span></h4>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th>Guard</th><th class="c">Mobile</th><th>Client</th><th>Site</th><th class="c">Left Time</th><th class="c">Away Detail</th><th class="c">Call</th><th class="c">WhatsApp Warning</th><th>Remarks</th></tr></thead><tbody id="outRows"></tbody></table></div>
  </div>
  <div class="m-card"><h4>Vacant Posts <span style="color:#ef4444;font-size:12px">(your branch)</span></h4>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th>Client</th><th>Site</th><th class="c">Vacant</th><th class="c">Fill %</th></tr></thead><tbody id="vac"></tbody><tfoot id="vacFoot"></tfoot></table></div>
  </div>
  <div class="m-card"><h4>Overtime (OT) <span style="color:#a78bfa;font-size:12px">(highest first)</span></h4>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th>Client</th><th>Site</th><th class="c">OT</th><th class="c">Absent</th></tr></thead><tbody id="ot"></tbody><tfoot id="otFoot"></tfoot></table></div>
  </div>
</div>`,
  script: `
${DUTY_CONTACT_JS}
(function(){el('date').value=staffTodayIst();})();
function load(){staffApi('dashboard',{date:el('date').value}).then(function(res){
  if(res.status===401){staffShowLogin(res.body.error);return;}
  if(res.status!==200){el('subStatus').textContent=res.body.error||'Could not load — refresh page.';return;}
  var d=res.body,t=d.totals||{},c=d.compliance||{},col=d.collection;
  el('kDeploy').innerHTML=
    '<div class="m-kpi o"><b>'+(t.san||0)+'</b><span>Sanctioned</span></div>'+
    '<div class="m-kpi s"><b>'+(t.dep||0)+'</b><span>Deployed</span></div>'+
    '<div class="m-kpi p"><b>'+(t.vac||0)+'</b><span>Vacant</span></div>'+
    '<div class="m-kpi t"><b>'+(d.deployPct||0)+'%</b><span>Deploy %</span></div>'+
    '<div class="m-kpi t"><b>'+((d.hr&&d.hr.recruitment)||0)+'</b><span>Recruitment</span></div>'+
    '<div class="m-kpi o"><b>'+((d.hr&&d.hr.rejoin)||0)+'</b><span>Rejoin</span></div>';
  el('kOps').innerHTML=
    '<div class="m-kpi s"><b>'+(c.pvcPct||0)+'%</b><span>PVC</span></div>'+
    '<div class="m-kpi o"><b>'+(c.medicalPct||0)+'%</b><span>Medical Fit</span></div>'+
    '<div class="m-kpi t"><b>'+(c.trainingPct||0)+'%</b><span>Training</span></div>'+
    '<div class="m-kpi p"><b>'+(d.complaints?d.complaints.open:0)+'</b><span>Open Complaints</span></div>'+
    '<div class="m-kpi p"><b>'+(d.incidents?d.incidents.open:0)+'</b><span>Incidents Open</span></div>'+
    '<div class="m-kpi s"><b>'+(d.incidents?d.incidents.closed:0)+'</b><span>Incidents Closed</span></div>'+
    '<div class="m-kpi o"><b>'+(d.mobile?d.mobile.visitTotal:0)+'</b><span>Mobile Visits</span></div>';
  el('kColl').innerHTML=
    '<div class="m-kpi t"><b>'+(col?col.achievement:0)+'%</b><span>Collection Achv</span></div>'+
    '<div class="m-kpi p"><b>'+(col?col.dso:'—')+'</b><span>DSO Days</span></div>'+
    '<div class="m-kpi o"><b>'+(d.dutyStart?d.dutyStart.timelyPct:0)+'%</b><span>Timely Duty Start</span></div>'+
    '<div class="m-kpi p"><b>'+(d.dutyStart?d.dutyStart.latePct:0)+'%</b><span>Late Start</span></div>'+
    '<div class="m-kpi p"><b>'+(d.dutyStart?d.dutyStart.notStartedPct:0)+'%</b><span>Not Started</span></div>';
  var pd=d.patrolDuty||{};
  el('kPatrolDuty').innerHTML=
    '<div class="m-kpi o"><b>'+(pd.patrolCount||0)+'</b><span>Patrol Visits</span></div>'+
    '<div class="m-kpi s"><b>'+(pd.totalPatrolKm||0)+'</b><span>Total KM</span></div>'+
    '<div class="m-kpi p"><b>'+((pd.lateStartRows||[]).length)+'</b><span>Late Start</span></div>'+
    '<div class="m-kpi p"><b>'+((pd.outOfLocationRows||[]).length)+'</b><span>Out of Location</span></div>';
  el('patrolRows').innerHTML=(pd.patrolRows||[]).map(function(p){
    return '<tr><td>'+h(p.user)+'</td><td>'+h(p.client)+'</td><td>'+h(p.unit)+'</td><td class="c">'+h(p.visitTime)+'</td><td>'+h(p.patrolPoint||'—')+'</td><td class="c">'+(p.kmTravelled?h(p.kmTravelled):'—')+'</td></tr>';
  }).join('')||'<tr><td colspan="6" class="hint">No patrol data for this date — open <a href="/mis-staff-visits" style="color:#fde68a">Patrol &amp; Visit Report</a> and tap Sync.</td></tr>';
  el('lateRows').innerHTML=dutyLateRowsHtml(pd.lateStartRows||[]);
  el('outRows').innerHTML=dutyOutRowsHtml(pd.outOfLocationRows||[]);
  var st;
  if(d.submitted)st=d.onTime?'✅ Submitted on time':'⚠ Submitted late';
  else if(d.hasDraft)st='💾 Draft saved — complete Steps 2 &amp; 3 and submit';
  else st='❌ Not submitted — <a href="/mis-staff-daily" style="color:#fde68a">open Daily MIS</a>';
  if(d.submittedBy)st+=' · By: '+h(d.submittedBy);
  el('subStatus').innerHTML=st;
  var rec=(d.recruits&&d.recruits.rows)||[];
  el('recruitRows').innerHTML=rec.map(function(r,i){
    var typ=(r.kind==='rejoin'||r.kind==='existing')?'Rejoin':'Recruitment';
    return '<tr><td class="c">'+(i+1)+'</td><td><b>'+typ+'</b></td><td><b>'+h(r.name)+'</b></td><td>'+h(r.empId||'—')+'</td><td>'+h(r.unit||r.location||'—')+'</td><td class="c">'+h(r.doj||'—')+'</td><td>'+h(r.referredBy||'—')+'</td><td>'+h(r.source||typ)+'</td></tr>';
  }).join('')||'<tr><td colspan="8" class="hint">No names for this day yet — enter them in Agile Recruitment → Detailed DRR or Roster &amp; Join-Backs.</td></tr>';
  if(!d.submitted && !d.hasDraft){
    el('vac').innerHTML='<tr><td colspan="4" class="hint">No report for this date yet — tap <b>Daily MIS Submission</b> on the left menu to submit, then vacant posts will show here.</td></tr>';
    el('ot').innerHTML='<tr><td colspan="4" class="hint">No report for this date yet — submit Daily MIS to see overtime list.</td></tr>';
    el('vacFoot').innerHTML='';el('otFoot').innerHTML='';
    return;
  }
  el('vac').innerHTML=(d.vacantRows||[]).map(function(v){
    return '<tr><td>'+h(v.client)+'</td><td>'+h(v.unit)+'</td><td class="c sc-poor">'+v.vac+'</td><td class="c">'+v.fill+'%</td></tr>';
  }).join('')||'<tr><td colspan="4" class="hint">No vacant posts — good deployment.</td></tr>';
  el('vacFoot').innerHTML='<tr><td><b>TOTAL</b></td><td></td><td class="c"><b>'+(t.vac||0)+'</b></td><td></td></tr>';
  el('ot').innerHTML=(d.otRows||[]).map(function(v){
    return '<tr><td>'+h(v.client)+'</td><td>'+h(v.unit)+'</td><td class="c" style="color:#a78bfa;font-weight:800">'+v.ot+'</td><td class="c">'+(v.abs||0)+'</td></tr>';
  }).join('')||'<tr><td colspan="4" class="hint">No overtime posts today.</td></tr>';
  el('otFoot').innerHTML='<tr><td><b>TOTAL</b></td><td></td><td class="c" style="color:#a78bfa"><b>'+(t.ot||0)+'</b></td><td class="c"><b>'+(t.abs||0)+'</b></td></tr>';
});}
function initStaffPage(){load();}
`,
}

const DAILY: StaffPage = {
  active: '/mis-staff-daily',
  title: 'Daily MIS Submission',
  inner: `<div class="m-wrap">
  <div class="m-card">
    <div class="hint" style="margin-top:0"><b>Submit in 4 easy steps</b> — Step 1 loads below. Header row and <b>Client / Site</b> stay fixed while you scroll. Last data is remembered (please update for today).</div>
    <div id="dailyStatus" class="hint" style="margin-top:10px;color:#fde68a">Checking today's status…</div>
  </div>
  <div class="m-card" id="deployCard">
    <div class="hint"><b>Step 1 — Deployment</b> · You may edit <b>Sanctioned (San)</b>, <b>Absent</b> and <b>OT</b>. Sanctioned changes are remembered for next time. Scroll — header &amp; Client/Site stay frozen. Auto-saves while you type.</div>
    <div id="deployLoad" class="deploy-load"><div class="hod-spinner"></div><p class="hint" style="margin-top:12px;color:#fde68a">Loading your sites…</p></div>
    <div id="deployForm" class="hidden">
      <h3 id="deployHdr" style="color:#fde68a;margin:12px 0 6px"></h3>
      <div style="margin-bottom:10px"><label class="m-lbl">Your name (submitting)</label><input class="m-inp" id="submittedBy" placeholder="e.g. Branch Manager name" style="max-width:280px"></div>
    <div class="hint" style="margin-bottom:8px" id="deployCarryNote"></div>
    <div class="hint" style="margin-bottom:8px">↔ Scroll right to see all shifts — <b>A Day · General · B · C Night</b></div>
    <div id="otTotalsBar" style="margin:8px 0 4px;padding:10px 12px;border-radius:8px;border:1px solid #c9a84c;background:rgba(201,168,76,.12);color:#fde68a;font-weight:700;font-size:14px">Branch OT total (all sites combined): A 0 + G 0 + B 0 + C 0 = 0</div>
    <div id="absTotalsBar" style="margin:0 0 4px;padding:10px 12px;border-radius:8px;border:1px solid #60a5fa;background:rgba(96,165,250,.12);color:#bfdbfe;font-weight:700;font-size:14px">Branch Absent total (all sites combined): 0 · Vacant (Absent − OT): 0</div>
    <div class="hint" style="margin-bottom:8px;color:#fde68a">⚠️ These bars add numbers from <b>every site</b> together. Last deployment (San/Abs/OT) may appear — please check and update for today.</div>
    <div id="deployOtClampMsg" class="hint hidden" style="margin-bottom:8px;color:#fbbf24"></div>
    <div class="hint" style="margin-bottom:8px;color:#93c5fd">Rule: enter <b>Absent first</b>, then <b>OT</b>. OT cannot be more than Absent for that shift.</div>
      <div class="mtblwrap deploy-tbl"><table class="mtbl"><thead>
        <tr><th rowspan="2" class="c freeze-h freeze-num">#</th><th rowspan="2" class="freeze-h freeze-client">Client</th><th rowspan="2" class="freeze-h freeze-loc">Site</th>
        <th colspan="3" class="grp-a">A / Day</th><th colspan="3" class="grp-g">General</th><th colspan="3" class="grp-b">B</th><th colspan="3" class="grp-c">C / Night</th><th rowspan="2" class="c">Vac</th></tr>
        <tr><th class="grp-a">San</th><th class="grp-a">Abs</th><th class="grp-a">OT</th>
        <th class="grp-g">San</th><th class="grp-g">Abs</th><th class="grp-g">OT</th>
        <th class="grp-b">San</th><th class="grp-b">Abs</th><th class="grp-b">OT</th>
        <th class="grp-c">San</th><th class="grp-c">Abs</th><th class="grp-c">OT</th></tr>
      </thead><tbody id="deployRows"></tbody></table></div>
      <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <button class="m-btn m-btn-gold" id="btnSaveDeploy" onclick="saveDeployStep(false)">💾 Save Step 1</button>
        <button class="m-btn m-btn-navy" onclick="saveDeployStep(true)">Save &amp; go to Step 2 →</button>
        <span id="deployMsg" class="hint"></span>
      </div>
    </div>
  </div>
  <a class="daily-step-card" href="/mis-staff-daily-shortage" style="opacity:.85">
    <span class="step-num">2</span>
    <b>Manpower Shortage Details</b>
    <small>After Step 1 — role-wise shortages (Absent = Shortage)</small>
  </a>
  <a class="daily-step-card" href="/mis-staff-daily-summary" style="opacity:.85">
    <span class="step-num">3</span>
    <b>Daily Summary</b>
    <small>After Step 2 — operations, collection &amp; complaints</small>
  </a>
  <a class="daily-step-card" href="/mis-staff-daily-submit" style="opacity:.85">
    <span class="step-num">4</span>
    <b>Review &amp; Submit</b>
    <small>After Step 3 — check and submit to Management</small>
  </a>
</div>`,
  script: `
var DEPLOY_ROWS=[],DEPLOY_DATE='',DEPLOY_SHIFTS=['A','G','B','C'];
var DEPLOY_AUTO_T=null,DEPLOY_AUTO_BUSY=false;
function staffReportApi(action,extra){
  var payload=Object.assign({action:action,sessionToken:OTP_SESSION,branchId:staffResolveBranchId()||'',autoSync:false},extra||{});
  var ctrl=typeof AbortController!=='undefined'?new AbortController():null;
  var timer=ctrl?setTimeout(function(){try{ctrl.abort();}catch(e){}},90000):null;
  return fetch('/api/mis/report-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:ctrl?ctrl.signal:undefined}).then(function(r){
    return r.text().then(function(t){
      var j={};
      try{j=JSON.parse(t);}catch(e){throw new Error('Server busy (code '+(r.status||'?')+') — wait 10 seconds and tap again');}
      return {status:r.status,body:j};
    });
  }).finally(function(){if(timer)clearTimeout(timer);});
}
function clampOt(san,abs,ot){var s=Math.max(0,Math.floor(Number(san)||0));if(s<=0)return 0;var o=Math.max(0,Math.floor(Number(ot)||0));var a=Math.max(0,Math.floor(Number(abs)||0));return Math.min(o,a,s);}
function shiftVac(r){var a=0,o=0;DEPLOY_SHIFTS.forEach(function(s){var san=r['san'+s]||0;if(san<=0)return;a+=(r['abs'+s]||0);o+=clampOt(san,r['abs'+s],r['ot'+s]);});return Math.max(0,a-o);}
function otTotals(){var n=DEPLOY_ROWS.length;var t={A:0,G:0,B:0,C:0};DEPLOY_ROWS.forEach(function(r){DEPLOY_SHIFTS.forEach(function(s){t[s]+=clampOt(r['san'+s],r['abs'+s],r['ot'+s]);});});var sum=t.A+t.G+t.B+t.C;return{t:t,sum:sum,n:n,label:'Branch OT total ('+n+' site'+(n===1?'':'s')+' combined): A '+t.A+' + G '+t.G+' + B '+t.B+' + C '+t.C+' = '+sum};}
function absTotals(){var abs=0,ot=0;DEPLOY_ROWS.forEach(function(r){DEPLOY_SHIFTS.forEach(function(s){var san=r['san'+s]||0;if(san<=0)return;abs+=Number(r['abs'+s])||0;ot+=clampOt(san,r['abs'+s],r['ot'+s]);});});var vac=Math.max(0,abs-ot);return{abs:abs,ot:ot,vac:vac,label:'Branch Absent total (all sites combined): '+abs+' · Vacant (Absent − OT): '+vac};}
function showOtClampMsg(txt){var m=el('deployOtClampMsg');if(!m)return;if(!txt){m.classList.add('hidden');m.textContent='';return;}m.classList.remove('hidden');m.textContent=txt;}
function refreshOtBar(){var bar=el('otTotalsBar');if(!bar)return;var o=otTotals();bar.textContent=o.label;bar.style.borderColor=o.sum>0?'#c9a84c':'#334155';var ab=el('absTotalsBar');if(ab){var a=absTotals();ab.textContent=a.label;ab.style.borderColor=a.vac>0?'#f87171':'#334155';}}
function setShift(i,s,kind,v){
  DEPLOY_ROWS[i][kind+s]=Math.max(0,Math.floor(Number(v)||0));
  var san=DEPLOY_ROWS[i]['san'+s]||0,abs=DEPLOY_ROWS[i]['abs'+s]||0,ot=DEPLOY_ROWS[i]['ot'+s]||0;
  var ot2=clampOt(san,abs,ot);
  if(ot2!==ot){
    DEPLOY_ROWS[i]['ot'+s]=ot2;ot=ot2;var inp=document.querySelector('input[data-ot=\"'+i+'-'+s+'\"]');if(inp)inp.value=String(ot2);
    if(kind==='ot'&&abs===0)showOtClampMsg('OT needs Absent first — enter Absent for this shift, then enter OT.');
    else if(kind==='ot'&&ot2<Number(v))showOtClampMsg('OT cannot be more than Absent for this shift — number adjusted.');
    else showOtClampMsg('');
  }else if(kind!=='ot')showOtClampMsg('');
  var vac=Math.max(0,abs-ot);DEPLOY_ROWS[i]['dep'+s]=Math.min(san,Math.max(0,san-vac));
  var vacEl=el('vac'+i);if(vacEl)vacEl.textContent=shiftVac(DEPLOY_ROWS[i]);
  refreshOtBar();
  scheduleDeployAutoSave();
}
function scheduleDeployAutoSave(){
  if(DEPLOY_AUTO_T)clearTimeout(DEPLOY_AUTO_T);
  DEPLOY_AUTO_T=setTimeout(function(){DEPLOY_AUTO_T=null;quietSaveDeploy();},1500);
}
function quietSaveDeploy(){
  if(!DEPLOY_ROWS.length||DEPLOY_AUTO_BUSY)return;
  normalizeDeployRows();
  DEPLOY_AUTO_BUSY=true;
  var tip=el('deployMsg');
  if(tip){tip.style.color='#94a3b8';tip.textContent='Auto-saving…';}
  staffReportApi('saveDraft',{dateFor:DEPLOY_DATE,rows:DEPLOY_ROWS,submittedBy:el('submittedBy').value||'',syncSanctioned:true}).then(function(res){
    DEPLOY_AUTO_BUSY=false;
    if(!tip)return;
    if(res.status===200){tip.style.color='#86efac';tip.textContent='Auto-saved (Sanctioned remembered)';setTimeout(function(){if(tip&&tip.textContent.indexOf('Auto-saved')===0)tip.textContent='';},2500);}
    else{tip.style.color='#fbbf24';tip.textContent=res.body.error||'Auto-save failed — tap Save Step 1';}
  }).catch(function(){DEPLOY_AUTO_BUSY=false;if(tip){tip.style.color='#fbbf24';tip.textContent='Auto-save failed — tap Save Step 1';}});
}
function normalizeDeployRows(){DEPLOY_ROWS.forEach(function(r){DEPLOY_SHIFTS.forEach(function(s){var san=r['san'+s]||0,abs=Math.max(0,r['abs'+s]||0),ot=clampOt(san,abs,r['ot'+s]||0);r['abs'+s]=abs;r['ot'+s]=ot;var vac=Math.max(0,abs-ot);r['dep'+s]=Math.min(san,Math.max(0,san-vac));});});}
function shiftCells(i,r,s,g){
  var san=r['san'+s]||0;
  var abs=r['abs'+s]||0;
  var ot=clampOt(san,abs,r['ot'+s]||0);r['ot'+s]=ot;
  return '<td class="'+g+'"><input class="m-inp san-inp" type="number" min="0" value="'+san+'" oninput="setShift('+i+',\\''+s+'\\',\\'san\\',this.value)" title="Sanctioned — HOD can change; remembered next time"></td>'+
    '<td class="'+g+'"><input class="m-inp" type="number" min="0" value="'+abs+'" oninput="setShift('+i+',\\''+s+'\\',\\'abs\\',this.value)"></td>'+
    '<td class="'+g+'"><input class="m-inp" type="number" min="0" data-ot="'+i+'-'+s+'" value="'+ot+'" oninput="setShift('+i+',\\''+s+'\\',\\'ot\\',this.value)" title="OT cannot exceed Absent"></td>';
}
function renderDeployRows(){
  var tb=el('deployRows');if(!tb)return;
  normalizeDeployRows();
  tb.innerHTML=DEPLOY_ROWS.map(function(r,i){
    return '<tr><td class="c freeze-num">'+(i+1)+'</td><td class="freeze-client">'+h(r.clientName)+'</td><td class="freeze-loc">'+h(r.location)+'</td>'+
      shiftCells(i,r,'A','grp-a')+shiftCells(i,r,'G','grp-g')+shiftCells(i,r,'B','grp-b')+shiftCells(i,r,'C','grp-c')+
      '<td class="c" id="vac'+i+'">'+shiftVac(r)+'</td></tr>';
  }).join('')||'<tr><td colspan="16" class="hint">No sites — add in Master Directory.</td></tr>';
  refreshOtBar();
}
function loadDeploy(){
  if(!staffEnsureSession()){el('deployLoad').innerHTML='<p class="hint" style="color:#f87171">Please sign in first.</p>';return;}
  DEPLOY_DATE=staffTodayIst();
  staffReportApi('quickOpen',{dateFor:DEPLOY_DATE}).then(function(res){
    if(res.status===401){el('deployLoad').innerHTML='<p class="hint" style="color:#f87171">'+(res.body.error||'Sign-in expired.')+'</p>';staffShowLogin(res.body.error);return;}
    if(res.status!==200){el('deployLoad').innerHTML='<p class="hint" style="color:#f87171">'+(res.body.error||'Could not load sites.')+'</p><button class="m-btn m-btn-gold" onclick="loadDeploy()">Try again</button>';return;}
    DEPLOY_ROWS=res.body.rows||[];
    el('deployHdr').textContent=res.body.branch.name+' — '+res.body.dateFor+(res.body.hasDraft?' (today\\'s draft loaded)':(res.body.carriedFromDate?' (last data loaded)':''));
    var carry=el('deployCarryNote');
    if(carry)carry.textContent=res.body.deployCarryNote||'';
    if(el('submittedBy'))el('submittedBy').value=res.body.submittedBy||'';
    renderDeployRows();
    el('deployLoad').classList.add('hidden');
    el('deployForm').classList.remove('hidden');
  }).catch(function(err){el('deployLoad').innerHTML='<p class="hint" style="color:#f87171">'+(err&&err.message?h(err.message):'Could not connect — check internet')+'.</p><button class="m-btn m-btn-gold" onclick="loadDeploy()">Try again</button>';});
}
function saveDeployStep(goStep2){
  if(!DEPLOY_ROWS.length){el('deployMsg').textContent='No sites to save.';return;}
  normalizeDeployRows();
  refreshOtBar();
  var o=otTotals();
  var a=absTotals();
  if(!confirm(a.label+'\\n'+o.label+'\\n\\nPlease confirm Absent, OT and Vacant are correct before saving.\\n(OT cannot be more than Absent for each shift.)'))return;
  var btn=el('btnSaveDeploy');if(btn)btn.disabled=true;
  el('deployMsg').textContent='Saving '+DEPLOY_ROWS.length+' sites — please wait…';
  el('deployMsg').style.color='#94a3b8';
  staffReportApi('saveDraft',{dateFor:DEPLOY_DATE,rows:DEPLOY_ROWS,submittedBy:el('submittedBy').value||'',syncSanctioned:true}).then(function(res){
    if(btn)btn.disabled=false;
    if(res.status===200){
      el('deployMsg').style.color='#4ade80';
      el('deployMsg').textContent='✅ Step 1 saved — '+o.label;
      renderDeployRows();
      if(goStep2)setTimeout(function(){location.href='/mis-staff-daily-shortage';},700);
    }else el('deployMsg').textContent=res.body.error||'Could not save.';
  }).catch(function(err){if(btn)btn.disabled=false;el('deployMsg').textContent=(err&&err.message)?err.message:'Could not connect — wait 10 seconds and tap Save again.';});
}
function initStaffPage(){
  loadDeploy();
  staffApi('dashboard',{date:staffTodayIst()}).then(function(res){
    if(res.status!==200){el('dailyStatus').textContent='Sign in to submit today\\'s MIS.';return;}
    var d=res.body;
    el('dailyStatus').textContent=d.submitted
      ?('✅ Submitted today'+(d.onTime?' on time':' — late')+(d.submittedBy?' · '+d.submittedBy:''))
      :(d.hasDraft?'💾 Draft saved — continue Steps 2 → 4 below':'❌ Not submitted yet — fill Step 1 below');
  });
}`,
}

const DAILY_DEPLOY: StaffPage = {
  active: '/mis-staff-daily',
  title: 'Daily MIS Submission',
  inner: `<div class="m-wrap"><div class="m-card"><p class="hint">Opening Daily MIS…</p></div></div>`,
  script: `function initStaffPage(){location.replace('/mis-staff-daily');}`,
}

const DAILY_SHORTAGE: StaffPage = {
  active: '/mis-staff-daily',
  title: 'Step 2 — Manpower Shortage Details',
  inner: `<div class="m-wrap">
  <div class="m-card">
    <a href="/mis-staff-daily" class="m-btn m-btn-navy" style="text-decoration:none;margin-bottom:10px;display:inline-block">← Back to Step 1</a>
    <div class="hint"><b>Step 2 — Manpower Shortage Details</b> · Branches enter role-wise shortages. Helps Recruitment plan manpower. Auto-saves while you type.</div>
    <div class="hint" style="margin-top:8px;color:#fde68a">For the day: <b>Absent = Shortage = Manpower shortages</b> (sanctioned posts only — weekly-off / relievers not included). Role breakdown is editable.</div>
    <div id="shLoad" class="deploy-load"><div class="hod-spinner"></div><p class="hint" style="margin-top:12px;color:#fde68a">Loading shortage form…</p></div>
    <div id="shForm" class="hidden">
      <h3 id="shHdr" style="color:#fde68a;margin:12px 0 6px"></h3>
      <div id="shCalcNote" class="hint" style="margin-bottom:10px"></div>
      <div class="shortage-grid" id="shGrid"></div>
      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <button class="m-btn m-btn-gold" id="btnSaveShortage" onclick="saveShortageStep(false)">💾 Save Step 2</button>
        <button class="m-btn m-btn-navy" onclick="saveShortageStep(true)">Save &amp; go to Step 3 →</button>
        <span id="shMsg" class="hint"></span>
      </div>
    </div>
  </div>
</div>`,
  script: `
var SH_DATE='',SH_ROLES=[
  {key:'totalBranchShortages',label:'Total Branch shortages'},
  {key:'assignmentManager',label:'Assignment Manager'},
  {key:'dutyOfficer',label:'Duty Officer'},
  {key:'securityOfficer',label:'Security Officer'},
  {key:'assistantSecurityOfficer',label:'Assistant Security Officer'},
  {key:'supervisor',label:'Supervisor'},
  {key:'cctvOperator',label:'CCTV operator'},
  {key:'ladySecurityGuard',label:'Lady Security Guard'},
  {key:'securityGuards',label:'Security Guards'},
  {key:'driver',label:'Driver'},
  {key:'houseKeeping',label:'HK'},
  {key:'hkSupervisor',label:'HK-Supervisor'},
  {key:'escort',label:'Escorts'},
  {key:'spo',label:'SPO'},
  {key:'spa',label:'SPA'},
  {key:'pantryBoy',label:'Pantry Boy'},
  {key:'stf',label:'STF'},
  {key:'fa',label:'FA'},
  {key:'careTaker',label:'Care Taker'}
];
var SH_DATA={};
function staffReportApi(action,extra){
  var payload=Object.assign({action:action,sessionToken:OTP_SESSION,branchId:staffResolveBranchId()||'',autoSync:false},extra||{});
  return fetch('/api/mis/report-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(r){
    return r.text().then(function(t){var j={};try{j=JSON.parse(t);}catch(e){throw new Error('Server busy — try again');}return{status:r.status,body:j};});
  });
}
function renderShortageForm(){
  var g=el('shGrid');if(!g)return;
  g.innerHTML=SH_ROLES.map(function(r){
    var v=SH_DATA[r.key]!=null?SH_DATA[r.key]:0;
    return '<div><label>'+h(r.label)+'</label><input class="m-inp" type="number" min="0" id="sh_'+r.key+'" value="'+v+'" oninput="scheduleShortageAutoSave()"></div>';
  }).join('');
}
var SH_AUTO_T=null,SH_AUTO_BUSY=false;
function scheduleShortageAutoSave(){
  if(SH_AUTO_T)clearTimeout(SH_AUTO_T);
  SH_AUTO_T=setTimeout(function(){SH_AUTO_T=null;quietSaveShortage();},1500);
}
function quietSaveShortage(){
  if(SH_AUTO_BUSY)return;
  var data=readShortageForm();
  SH_AUTO_BUSY=true;
  var tip=el('shMsg');
  if(tip){tip.style.color='#94a3b8';tip.textContent='Auto-saving…';}
  staffReportApi('saveDraft',{dateFor:SH_DATE,manpowerShortage:data,useServerDraft:true,rows:[]}).then(function(res){
    SH_AUTO_BUSY=false;
    if(!tip)return;
    if(res.status===200){tip.style.color='#86efac';tip.textContent='Auto-saved';SH_DATA=res.body.manpowerShortage||data;setTimeout(function(){if(tip&&tip.textContent==='Auto-saved')tip.textContent='';},2000);}
    else{tip.style.color='#fbbf24';tip.textContent=res.body.error||'Auto-save failed — tap Save';}
  }).catch(function(){SH_AUTO_BUSY=false;if(tip){tip.style.color='#fbbf24';tip.textContent='Auto-save failed — tap Save';}});
}
function readShortageForm(){
  var o={};
  SH_ROLES.forEach(function(r){var inp=el('sh_'+r.key);o[r.key]=Math.max(0,Math.floor(Number(inp&&inp.value)||0));});
  return o;
}
function loadShortage(){
  if(!staffEnsureSession()){el('shLoad').innerHTML='<p class="hint" style="color:#f87171">Please sign in first.</p>';return;}
  SH_DATE=staffTodayIst();
  staffReportApi('quickOpen',{dateFor:SH_DATE,includeRows:true}).then(function(res){
    if(res.status===401){staffShowLogin(res.body.error);return;}
    if(res.status!==200){el('shLoad').innerHTML='<p class="hint" style="color:#f87171">'+(res.body.error||'Could not load')+'</p><button class="m-btn m-btn-gold" onclick="loadShortage()">Try again</button>';return;}
    if(!res.body.rowCount){el('shLoad').innerHTML='<p class="hint" style="color:#fbbf24">Please complete <b>Step 1 — Deployment</b> and Save first.</p><a class="m-btn m-btn-navy" href="/mis-staff-daily" style="text-decoration:none;margin-top:10px;display:inline-block">← Go to Step 1</a>';return;}
    var absN=Number(res.body.deployAbs||0);
    var otN=Number(res.body.deployOt||0);
    var def=Number(res.body.shortageWithoutRelievers!=null?res.body.shortageWithoutRelievers:absN);
    SH_DATA=res.body.manpowerShortage||{};
    var savedTot=Number(SH_DATA.totalBranchShortages);
    /** Refresh Total when empty or still on old Abs+OT mistake. */
    if(SH_DATA.totalBranchShortages==null||SH_DATA.totalBranchShortages===0||savedTot===(absN+otN))SH_DATA.totalBranchShortages=def;
    el('shHdr').textContent=(res.body.branch&&res.body.branch.name?res.body.branch.name:'Branch')+' — '+res.body.dateFor;
    el('shCalcNote').innerHTML='From Step 1 (sanctioned posts): <b>Absent = Shortage = <span style="color:#fbbf24">'+def+'</span></b>. OT today: <b>'+otN+'</b> (OT does not add to shortage). Weekly-off / relievers are not included. Total box pre-filled — fill each rank below.';
    renderShortageForm();
    el('shLoad').classList.add('hidden');
    el('shForm').classList.remove('hidden');
  }).catch(function(err){el('shLoad').innerHTML='<p class="hint" style="color:#f87171">'+(err&&err.message?h(err.message):'Could not connect')+'</p><button class="m-btn m-btn-gold" onclick="loadShortage()">Try again</button>';});
}
function saveShortageStep(goNext){
  var data=readShortageForm();
  var btn=el('btnSaveShortage');if(btn)btn.disabled=true;
  el('shMsg').textContent='Saving…';el('shMsg').style.color='#94a3b8';
  staffReportApi('saveDraft',{dateFor:SH_DATE,manpowerShortage:data,useServerDraft:true,rows:[]}).then(function(res){
    if(btn)btn.disabled=false;
    if(res.status===200){
      el('shMsg').style.color='#4ade80';
      el('shMsg').textContent='✅ Step 2 saved — Total shortages: '+(data.totalBranchShortages||0);
      SH_DATA=res.body.manpowerShortage||data;
      if(goNext)setTimeout(function(){location.href='/mis-staff-daily-summary';},700);
    }else{
      el('shMsg').style.color='#f87171';
      el('shMsg').textContent=res.body.error||'Could not save. Complete Step 1 first.';
    }
  }).catch(function(err){if(btn)btn.disabled=false;el('shMsg').style.color='#f87171';el('shMsg').textContent=err&&err.message?err.message:'Could not connect';});
}
function initStaffPage(){loadShortage();}
`,
}

const DAILY_SUMMARY: StaffPage = {
  active: '/mis-staff-daily',
  title: 'Step 3 — Daily Summary',
  inner: `<div class="m-wrap">
  <div class="m-card">
    <a href="/mis-staff-daily-shortage" class="m-btn m-btn-navy" style="text-decoration:none;margin-bottom:10px;display:inline-block">← Back to Step 2</a>
    <div class="hint"><b>Step 3 — Daily Summary</b> · Collection, PVC, Medical, Training &amp; operations. Auto-saves while you type.</div>
    <div id="sumLoad" class="deploy-load"><div class="hod-spinner"></div><p class="hint" style="margin-top:12px;color:#fde68a">Loading summary…</p></div>
    <div id="sumForm" class="hidden">
      <h3 id="sumHdr" style="color:#fde68a;margin:12px 0"></h3>
      <div class="sum-help">
        <b>How to fill this page</b><br>
        Green note under a box = system already put the number (you may edit).<br>
        Amber note = system could not find it — <b>type the number yourself</b> (use 0 if none).<br>
        PVC / Medical / Training come from <a href="/mis-guard-docs">Compliance (PVC/MC)</a>.
        Collection ₹ from <a href="/mis-staff-collection">Collection (DSO)</a> or type Mon–Sat below.
        Night checks come from <a href="/mis-staff-night-visit">Night Visit (check)</a> for today.
      </div>
      <p id="sumHint" class="hint" style="color:#93c5fd"></p>
      <div style="margin:8px 0 14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <button type="button" class="m-btn m-btn-navy" id="btnRefreshSum" onclick="refreshFromSystem()">↻ Refresh from system</button>
        <a class="m-btn m-btn-navy" href="/mis-guard-docs" style="text-decoration:none">🛡 Open Compliance</a>
        <a class="m-btn m-btn-navy" href="/mis-staff-collection" style="text-decoration:none">₹ Open Collection</a>
        <a class="m-btn m-btn-navy" href="/mis-staff-night-visit" style="text-decoration:none">🌙 Night Visit (check)</a>
        <span id="refreshMsg" class="hint"></span>
      </div>
      <div class="sec-h">Weekly Collection (₹ thousands) — type here if blank</div>
      <div class="sum-grid">
        <div><label class="m-lbl">Weekly Budget</label><input class="m-inp" id="colBudget" inputmode="decimal" oninput="fillCollectionPct()"></div>
        <div><label class="m-lbl">Mon</label><input class="m-inp" id="colMon" inputmode="decimal" oninput="fillCollectionPct()"></div>
        <div><label class="m-lbl">Tue</label><input class="m-inp" id="colTue" inputmode="decimal" oninput="fillCollectionPct()"></div>
        <div><label class="m-lbl">Wed</label><input class="m-inp" id="colWed" inputmode="decimal" oninput="fillCollectionPct()"></div>
        <div><label class="m-lbl">Thu</label><input class="m-inp" id="colThu" inputmode="decimal" oninput="fillCollectionPct()"></div>
        <div><label class="m-lbl">Fri</label><input class="m-inp" id="colFri" inputmode="decimal" oninput="fillCollectionPct()"></div>
        <div><label class="m-lbl">Sat</label><input class="m-inp" id="colSat" inputmode="decimal" oninput="fillCollectionPct()"></div>
      </div>
      <p id="colHint" class="hint" style="margin-top:6px"></p>
      <div class="sec-h" style="margin-top:14px">Daily Summary — edit any box; blank = type manually</div>
      <div class="sum-grid">
        <div><label class="m-lbl">Weekly Collection %</label><input class="m-inp" id="weeklyCollectionPct" inputmode="decimal"><div id="hint-weeklyCollectionPct" class="field-hint field-manual">Mon–Sat ÷ budget — or type %</div></div>
        <div><label class="m-lbl">Consolidated Collection %</label><input class="m-inp" id="consolidatedCollectionPct" inputmode="decimal"><div id="hint-consolidatedCollectionPct" class="field-hint field-manual">Friday OST current-month billing (10th–10th). Weekly does not change this.</div></div>
        <div><label class="m-lbl">Day Visits</label><input class="m-inp" id="dayVisits" inputmode="numeric"><div id="hint-dayVisits" class="field-hint field-manual">Mobile / Work360 — or type</div></div>
        <div><label class="m-lbl">Night Checks</label><input class="m-inp" id="nightChecks" inputmode="numeric"><div id="hint-nightChecks" class="field-hint field-manual">Night Visit (check) report today — or type</div></div>
        <div><label class="m-lbl">Trained Sites</label><input class="m-inp" id="trainedSites" inputmode="numeric"><div id="hint-trainedSites" class="field-hint field-manual">Mobile / Work360 — or type</div></div>
        <div><label class="m-lbl">Medical Fitness %</label><input class="m-inp" id="medicalFitnessPct" inputmode="decimal"><div id="hint-medicalFitnessPct" class="field-hint field-manual">Guard Docs — or type manually</div></div>
        <div><label class="m-lbl">PVC Upload %</label><input class="m-inp" id="pvcPct" inputmode="decimal"><div id="hint-pvcPct" class="field-hint field-manual">Guard Docs — or type manually</div></div>
        <div><label class="m-lbl">PSARA / Training %</label><input class="m-inp" id="psaraPct" inputmode="decimal"><div id="hint-psaraPct" class="field-hint field-manual">Guard Docs — or type manually</div></div>
        <div><label class="m-lbl">Resignations</label><input class="m-inp" id="resignation" inputmode="numeric"><div id="hint-resignation" class="field-hint field-manual">Or type manually</div></div>
        <div><label class="m-lbl">Recruitment (open)</label><input class="m-inp" id="recruitment" inputmode="numeric"><div id="hint-recruitment" class="field-hint field-manual">Or type manually</div></div>
        <div><label class="m-lbl">Guard Complaints</label><input class="m-inp" id="guardComplaints" placeholder="solved/registered"><div id="hint-guardComplaints" class="field-hint field-manual">e.g. 2/5 — or type</div></div>
        <div><label class="m-lbl">Client Complaints</label><input class="m-inp" id="clientComplaints" placeholder="solved/registered"><div id="hint-clientComplaints" class="field-hint field-manual">e.g. 1/3 — or type</div></div>
        <div><label class="m-lbl">Late Start (cases)</label><input class="m-inp" id="lateStartCases" inputmode="numeric"><div id="hint-lateStartCases" class="field-hint field-manual">Mobile — or type</div></div>
        <div><label class="m-lbl">Out of Post (cases)</label><input class="m-inp" id="outOfPostCases" inputmode="numeric"><div id="hint-outOfPostCases" class="field-hint field-manual">Mobile — or type</div></div>
      </div>
      <div style="margin-top:10px"><label class="m-lbl">Remarks</label><input class="m-inp" id="remarks" placeholder="Any remarks or actions taken"></div>
      <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="m-btn m-btn-gold" onclick="saveSummaryStep(false)">💾 Save Step 3</button>
        <button class="m-btn m-btn-navy" onclick="saveSummaryStep(true)">Save &amp; go to Step 4 →</button>
        <span id="sumMsg" class="hint"></span>
      </div>
    </div>
  </div>
</div>`,
  script: `
var SUM_DATE='',SUM_COL={};
var SUM_KEYS=['weeklyCollectionPct','consolidatedCollectionPct','dayVisits','nightChecks','trainedSites','medicalFitnessPct','pvcPct','psaraPct','resignation','recruitment','guardComplaints','clientComplaints','lateStartCases','outOfPostCases','remarks'];
function staffReportApi(action,extra){
  var payload=Object.assign({action:action,sessionToken:OTP_SESSION,branchId:staffResolveBranchId()||'',autoSync:false},extra||{});
  var ctrl=typeof AbortController!=='undefined'?new AbortController():null;
  var timer=ctrl?setTimeout(function(){try{ctrl.abort();}catch(e){}},90000):null;
  return fetch('/api/mis/report-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:ctrl?ctrl.signal:undefined}).then(function(r){
    return r.text().then(function(t){
      var j={};
      try{j=JSON.parse(t);}catch(e){throw new Error('Server busy (code '+(r.status||'?')+') — wait 10 seconds and tap again');}
      return {status:r.status,body:j};
    });
  }).finally(function(){if(timer)clearTimeout(timer);});
}
function applyFieldMeta(meta){
  if(!meta)return;
  Object.keys(meta).forEach(function(k){
    var hEl=el('hint-'+k);if(!hEl)return;
    var m=meta[k];
    if(m.status==='auto'){hEl.className='field-hint field-auto';hEl.textContent=m.hint||'✓ Auto-filled';}
    else if(m.status==='previous'){hEl.className='field-hint field-auto';hEl.textContent=m.hint||'✓ From previous day — you may edit';}
    else{hEl.className='field-hint field-attn';hEl.textContent=m.hint||'Kind attention — system could not get the data. Please enter manually.';}
  });
}
function fillSummary(s,onlyEmpty){
  if(!s)return;
  SUM_KEYS.forEach(function(k){var inp=el(k);if(!inp)return;if(onlyEmpty&&String(inp.value||'').trim())return;if(s[k]!=null)inp.value=s[k];});
}
function fillCollection(c){
  if(!c)return;SUM_COL=c;
  if(el('colBudget'))el('colBudget').value=c.budget||'';
  ['mon','tue','wed','thu','fri','sat'].forEach(function(d){var inp=el('col'+d.charAt(0).toUpperCase()+d.slice(1));if(inp)inp.value=c[d]||'';});
  fillCollectionPct();
}
function fillCollectionPct(){
  var budget=+el('colBudget').value||0;
  var wk=(+el('colMon').value||0)+(+el('colTue').value||0)+(+el('colWed').value||0)+(+el('colThu').value||0)+(+el('colFri').value||0)+(+el('colSat').value||0);
  if(budget>0&&el('weeklyCollectionPct'))el('weeklyCollectionPct').value=String(Math.round(wk*100/budget));
  var hint=el('colHint');
  if(hint)hint.textContent='Collected this week: '+wk+' L · Budget '+budget+' L · Weekly % = week collected ÷ week budget. Month collection % comes from Friday OST only (10th–10th billing) and does not change when you enter Mon–Sat.';
}
function collectSummary(){
  var s={};SUM_KEYS.forEach(function(k){s[k]=el(k)?el(k).value:'';});s.collectionPct=s.weeklyCollectionPct||'';return s;
}
function applyEnrich(body,onlyEmpty){
  fillSummary(body.summary||{},onlyEmpty);
  if(body.collection)fillCollection(body.collection);
  else fillCollectionPct();
  var s=body.summary||{};
  ['weeklyCollectionPct','consolidatedCollectionPct','nightChecks'].forEach(function(k){
    if(s[k]!=null&&String(s[k]).trim()&&el(k))el(k).value=s[k];
  });
  if(body.collectionPct&&el('weeklyCollectionPct'))el('weeklyCollectionPct').value=body.collectionPct;
  if(body.consolidatedPct&&el('consolidatedCollectionPct'))el('consolidatedCollectionPct').value=body.consolidatedPct;
  applyFieldMeta(body.fieldMeta||{});
  if(body.mobileNote)el('sumHint').textContent=body.mobileNote;
}
function loadSummary(){
  if(!staffEnsureSession()){el('sumLoad').innerHTML='<p class="hint" style="color:#f87171">Please sign in first.</p>';return;}
  SUM_DATE=staffTodayIst();
  staffReportApi('quickOpen',{dateFor:SUM_DATE,includeRows:false}).then(function(res){
    if(res.status===401){staffShowLogin(res.body.error);return;}
    if(res.status!==200){el('sumLoad').innerHTML='<p class="hint" style="color:#f87171">'+(res.body.error||'Could not load')+'</p><button class="m-btn m-btn-gold" onclick="loadSummary()">Try again</button>';return;}
    el('sumHdr').textContent=res.body.branch.name+' — '+res.body.dateFor;
    if(res.body.summaryCarryNote)el('sumHint').textContent=res.body.summaryCarryNote;
    fillSummary(res.body.summary||{});
    fillCollection(res.body.collection||{});
    el('sumLoad').classList.add('hidden');
    el('sumForm').classList.remove('hidden');
    wireSummaryAutoSave();
    staffReportApi('enrichSummary',{dateFor:SUM_DATE,lite:false}).then(function(er){
      if(er.status===200)applyEnrich(er.body,true);
    });
  }).catch(function(err){el('sumLoad').innerHTML='<p class="hint" style="color:#f87171">'+(err&&err.message?h(err.message):'Could not connect')+'.</p><button class="m-btn m-btn-gold" onclick="loadSummary()">Try again</button>';});
}
function refreshFromSystem(){
  if(!staffEnsureSession())return;
  var btn=el('btnRefreshSum');var msg=el('refreshMsg');
  if(btn){btn.disabled=true;btn.textContent='Refreshing…';}
  if(msg){msg.style.color='#93c5fd';msg.textContent='Pulling Guard Docs, Collection & Mobile…';}
  staffReportApi('enrichSummary',{dateFor:SUM_DATE||staffTodayIst(),lite:false,autoSync:true}).then(function(er){
    if(er.status===401){staffShowLogin(er.body.error);return;}
    if(er.status!==200){if(msg){msg.style.color='#f87171';msg.textContent=er.body.error||'Refresh failed';}return;}
    applyEnrich(er.body,true);
    if(msg){msg.style.color='#4ade80';msg.textContent='✓ Updated blank fields. Amber notes = please type those yourself.';}
  }).catch(function(){if(msg){msg.style.color='#f87171';msg.textContent='Network error.';}}).finally(function(){if(btn){btn.disabled=false;btn.textContent='↻ Refresh from system';}});
}
function saveSummaryStep(goStep3){
  el('sumMsg').textContent='Saving…';
  fillCollectionPct();
  var col={id:SUM_COL.id,budget:el('colBudget').value,mon:el('colMon').value,tue:el('colTue').value,wed:el('colWed').value,thu:el('colThu').value,fri:el('colFri').value,sat:el('colSat').value};
  var summary=collectSummary();
  staffReportApi('saveCollection',{dateFor:SUM_DATE,collection:col}).then(function(cr){
    if(cr.status!==200){el('sumMsg').textContent=cr.body.error||'Collection save failed.';return null;}
    if(cr.body.collectionPct&&el('weeklyCollectionPct'))el('weeklyCollectionPct').value=cr.body.collectionPct;
    if(cr.body.consolidatedPct&&el('consolidatedCollectionPct'))el('consolidatedCollectionPct').value=cr.body.consolidatedPct;
    return staffReportApi('saveDraft',{dateFor:SUM_DATE,summary:collectSummary()});
  }).then(function(dr){
    if(!dr)return;
    if(dr.status===200){el('sumMsg').style.color='#4ade80';el('sumMsg').textContent='✅ Step 3 saved.';if(goStep3)setTimeout(function(){location.href='/mis-staff-daily-submit';},600);}
    else el('sumMsg').textContent=dr.body.error||'Could not save.';
  }).catch(function(err){el('sumMsg').textContent=(err&&err.message)?err.message:'Could not connect — wait and tap Save again.';});
}
var SUM_AUTO_T=null,SUM_AUTO_BUSY=false;
function scheduleSummaryAutoSave(){
  if(SUM_AUTO_T)clearTimeout(SUM_AUTO_T);
  SUM_AUTO_T=setTimeout(function(){SUM_AUTO_T=null;quietSaveSummary();},1800);
}
function quietSaveSummary(){
  if(SUM_AUTO_BUSY||!SUM_DATE)return;
  SUM_AUTO_BUSY=true;
  fillCollectionPct();
  var tip=el('sumMsg');
  if(tip){tip.style.color='#94a3b8';tip.textContent='Auto-saving…';}
  var col={id:SUM_COL.id,budget:el('colBudget').value,mon:el('colMon').value,tue:el('colTue').value,wed:el('colWed').value,thu:el('colThu').value,fri:el('colFri').value,sat:el('colSat').value};
  staffReportApi('saveCollection',{dateFor:SUM_DATE,collection:col}).then(function(cr){
    if(cr.status===200){
      if(cr.body.collectionPct&&el('weeklyCollectionPct'))el('weeklyCollectionPct').value=cr.body.collectionPct;
      if(cr.body.consolidatedPct&&el('consolidatedCollectionPct'))el('consolidatedCollectionPct').value=cr.body.consolidatedPct;
    }
    return staffReportApi('saveDraft',{dateFor:SUM_DATE,summary:collectSummary()});
  }).then(function(dr){
    SUM_AUTO_BUSY=false;
    if(!tip)return;
    if(dr&&dr.status===200){tip.style.color='#86efac';tip.textContent='Auto-saved';setTimeout(function(){if(tip&&tip.textContent==='Auto-saved')tip.textContent='';},2000);}
    else{tip.style.color='#fbbf24';tip.textContent=(dr&&dr.body&&dr.body.error)||'Auto-save failed — tap Save';}
  }).catch(function(){SUM_AUTO_BUSY=false;if(tip){tip.style.color='#fbbf24';tip.textContent='Auto-save failed — tap Save';}});
}
function wireSummaryAutoSave(){
  var ids=['colBudget','colMon','colTue','colWed','colThu','colFri','colSat'].concat(SUM_KEYS);
  ids.forEach(function(id){
    var inp=el(id);if(!inp||inp.getAttribute('data-autosave'))return;
    inp.setAttribute('data-autosave','1');
    inp.addEventListener('input',function(){scheduleSummaryAutoSave();});
  });
}
function initStaffPage(){loadSummary();}
`,
}

const DAILY_SUBMIT: StaffPage = {
  active: '/mis-staff-daily',
  title: 'Step 4 — Submit',
  inner: `<div class="m-wrap">
  <div class="m-card">
    <a href="/mis-staff-daily-summary" class="m-btn m-btn-navy" style="text-decoration:none;margin-bottom:10px;display:inline-block">← Back to Step 3</a>
    <a href="/mis-staff-daily-shortage" class="m-btn m-btn-navy" style="text-decoration:none;margin-bottom:10px;display:inline-block;margin-left:8px">✏️ Edit Shortage (Step 2)</a>
    <a href="/mis-staff-daily" class="m-btn m-btn-gold" style="text-decoration:none;margin-bottom:10px;display:inline-block;margin-left:8px">✏️ Edit OT (Step 1)</a>
    <div class="hint"><b>Step 4 — Review &amp; Submit</b> · Check the figures, tick the box, then tap Submit. Do not wait on the spinner.</div>
    <div id="subForm">
      <h3 id="subHdr" style="color:#fde68a;margin:12px 0">Daily MIS — Submit</h3>
      <div style="margin-bottom:10px"><label class="m-lbl">Your name (submitting)</label><input class="m-inp" id="submittedBy" style="max-width:280px" oninput="updateSubmitBtn()"></div>
      <div id="subCheck" class="hint" style="padding:12px;border:1px solid #334155;border-radius:8px;line-height:1.6;margin-bottom:12px">Opening saved Steps 1–3… you can still type your name and tick the box.</div>
      <div style="margin:0 0 12px;padding:12px 14px;border:1px solid #334155;border-radius:10px;background:#0e1730">
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;margin-bottom:8px">
          <b style="color:#fde68a">Figures pulled from each module (check carefully)</b>
          <button type="button" class="m-btn m-btn-navy" id="btnRefreshSub" onclick="refreshSubmitSystem()">↻ Refresh from system</button>
        </div>
        <p id="subSysNote" class="hint" style="margin:0 0 8px;color:#93c5fd"></p>
        <div id="subLoad" class="deploy-load" style="padding:12px 0"><div class="hod-spinner"></div><p class="hint" style="margin-top:8px;color:#fde68a">Loading saved figures… Submit stays available below.</p></div>
        <div id="subSysList" style="line-height:1.65"></div>
      </div>
      <label for="misCertified" style="display:flex;gap:12px;align-items:flex-start;margin:0 0 14px;padding:12px 14px;border:1px solid #c9a84c;border-radius:10px;background:#1a2438;cursor:pointer">
        <input type="checkbox" id="misCertified" onchange="updateSubmitBtn()" style="margin-top:3px;width:20px;height:20px;flex-shrink:0;accent-color:#c9a84c">
        <span style="color:#fde68a;line-height:1.55;font-size:13px"><b>I certify:</b> I have checked the system figures above (visits, night checks, complaints, PVC/Medical, collection, late start / out of post). They are correct for today. Deployment, shortage and remarks are also verified. I take responsibility for this submission.</span>
      </label>
      <button class="m-btn m-btn-gold" id="btnFinalSubmit" onclick="finalSubmit()">✅ Submit Daily Report to Management</button>
      <span id="subMsg" class="hint" style="margin-left:10px"></span>
    </div>
  </div>
</div>`,
  script: `
var SUB_DATE='',SUB_ROWS=[],SUB_SUMMARY={},SUB_COL={},SUB_SHORTAGE={},SUB_FIELD_META={},SUB_SYSTEM_READY=false,SUB_READY=false;
var SUB_LABELS={weeklyCollectionPct:'Weekly Collection %',consolidatedCollectionPct:'Consolidated Collection %',dayVisits:'Day Visits',nightChecks:'Night Checks',trainedSites:'Trained Sites',medicalFitnessPct:'Medical Fitness %',pvcPct:'PVC Upload %',psaraPct:'PSARA / Training %',resignation:'Resignations',recruitment:'Recruitment (open)',guardComplaints:'Guard Complaints',clientComplaints:'Client Complaints',lateStartCases:'Late Start (cases)',outOfPostCases:'Out of Post (cases)'};
function clampOt(san,abs,ot){var s=Math.max(0,Math.floor(Number(san)||0));if(s<=0)return 0;var o=Math.max(0,Math.floor(Number(ot)||0));var a=Math.max(0,Math.floor(Number(abs)||0));return Math.min(o,a,s);}
function staffReportApi(action,extra){
  var payload=Object.assign({action:action,sessionToken:OTP_SESSION,branchId:staffResolveBranchId()||'',autoSync:false},extra||{});
  var ctrl=typeof AbortController!=='undefined'?new AbortController():null;
  var timer=ctrl?setTimeout(function(){try{ctrl.abort();}catch(e){}},90000):null;
  return fetch('/api/mis/report-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:ctrl?ctrl.signal:undefined}).then(function(r){
    return r.text().then(function(t){
      var j={};
      try{j=JSON.parse(t);}catch(e){throw new Error('Server busy (code '+(r.status||'?')+') — wait 10 seconds and tap again');}
      return {status:r.status,body:j};
    });
  }).finally(function(){if(timer)clearTimeout(timer);});
}
function renderSysList(){
  var meta=SUB_FIELD_META||{};
  var rows=Object.keys(SUB_LABELS).map(function(k){
    var m=meta[k]||{};
    var val=String((SUB_SUMMARY&&SUB_SUMMARY[k])||'').trim();
    var st=m.status||(val?'auto':'manual');
    var badge=st==='auto'?'<span style="color:#4ade80;font-weight:800">From system</span>':(st==='previous'?'<span style="color:#fbbf24;font-weight:800">From earlier day — check</span>':'<span style="color:#f87171;font-weight:800">Need check / enter</span>');
    var src=m.source?(' · '+h(m.source)):'';
    return '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;border-bottom:1px solid #22304f;padding:7px 0"><span style="color:#e2e8f0">'+h(SUB_LABELS[k])+'</span><span style="text-align:right"><b style="color:#fff">'+(val?h(val):'—')+'</b><br>'+badge+'<span style="color:#64748b;font-size:11px">'+src+'</span></span></div>';
  }).join('');
  el('subSysList').innerHTML=rows||'<span class="hint">No summary fields yet.</span>';
}
function updateSubmitBtn(){
  var btn=el('btnFinalSubmit');
  if(!btn)return;
  var name=el('submittedBy')&&el('submittedBy').value.trim();
  var cert=el('misCertified')&&el('misCertified').checked;
  btn.disabled=!(name&&cert);
}
function paintSubmitReview(){
  var items=[];
  if(!el('submittedBy').value.trim())items.push('❌ Your name');
  var san=0,abs=0,otA=0,otG=0,otB=0,otC=0;
  SUB_ROWS.forEach(function(r){
    san+=(r.sanA||0)+(r.sanG||0)+(r.sanB||0)+(r.sanC||0);
    abs+=(r.sanA>0?(r.absA||0):0)+(r.sanG>0?(r.absG||0):0)+(r.sanB>0?(r.absB||0):0)+(r.sanC>0?(r.absC||0):0);
    otA+=clampOt(r.sanA,r.absA,r.otA);otG+=clampOt(r.sanG,r.absG,r.otG);otB+=clampOt(r.sanB,r.absB,r.otB);otC+=clampOt(r.sanC,r.absC,r.otC);
  });
  if(!san)items.push('❌ Step 1 — deployment (Absent/OT)');
  if(SUB_SHORTAGE.totalBranchShortages==null&&!SUB_SHORTAGE.savedAt)items.push('❌ Step 2 — Manpower Shortage Details (save once)');
  if(!(Number(SUB_COL.budget)||0))items.push('❌ Weekly Budget (Step 3)');
  Object.keys(SUB_LABELS).forEach(function(k){if(!String(SUB_SUMMARY[k]||'').trim())items.push('❌ '+SUB_LABELS[k]+' — open Step 3 or Refresh from system');});
  SUB_READY=items.length===0;
  var otSum=otA+otG+otB+otC;
  var vac=Math.max(0,abs-otSum);
  var shortCalc=abs;
  var shRoles=[
    ['Assignment Manager',SUB_SHORTAGE.assignmentManager],['Duty Officer',SUB_SHORTAGE.dutyOfficer],['Security Officer',SUB_SHORTAGE.securityOfficer],
    ['Asst. Security Officer',SUB_SHORTAGE.assistantSecurityOfficer],['Supervisor',SUB_SHORTAGE.supervisor],['CCTV operator',SUB_SHORTAGE.cctvOperator],
    ['Lady Security Guard',SUB_SHORTAGE.ladySecurityGuard],['Security Guards',SUB_SHORTAGE.securityGuards],['Driver',SUB_SHORTAGE.driver],
    ['HK',SUB_SHORTAGE.houseKeeping],['HK-Supervisor',SUB_SHORTAGE.hkSupervisor],['Escorts',SUB_SHORTAGE.escort],
    ['SPO',SUB_SHORTAGE.spo],['SPA',SUB_SHORTAGE.spa],['Pantry Boy',SUB_SHORTAGE.pantryBoy],['STF',SUB_SHORTAGE.stf],
    ['FA',SUB_SHORTAGE.fa],['Care Taker',SUB_SHORTAGE.careTaker]
  ].filter(function(x){return Number(x[1])>0;}).sort(function(a,b){return Number(b[1])-Number(a[1]);});
  var shRows=shRoles.map(function(x,i){return '<tr><td>'+(i+1)+'</td><td>'+h(x[0])+'</td><td style="text-align:center;font-weight:800">'+(x[1]||0)+'</td></tr>';}).join('');
  var siteOt=SUB_ROWS.map(function(r,i){
    var s=clampOt(r.sanA,r.absA,r.otA)+clampOt(r.sanG,r.absG,r.otG)+clampOt(r.sanB,r.absB,r.otB)+clampOt(r.sanC,r.absC,r.otC);
    return s?('<tr><td>'+(i+1)+'</td><td>'+h(r.clientName)+'</td><td>'+h(r.location)+'</td><td style="text-align:center;font-weight:700">'+s+'</td><td style="text-align:center">'+clampOt(r.sanA,r.absA,r.otA)+'</td><td style="text-align:center">'+clampOt(r.sanG,r.absG,r.otG)+'</td><td style="text-align:center">'+clampOt(r.sanB,r.absB,r.otB)+'</td><td style="text-align:center">'+clampOt(r.sanC,r.absC,r.otC)+'</td></tr>'):'';
  }).filter(Boolean).join('');
  var otLine='<div style="margin-top:10px;padding:8px 10px;border-radius:8px;border:1px solid #60a5fa;color:#bfdbfe;font-weight:700">Branch totals: Absent '+abs+' · OT '+otSum+' · Vacant '+vac+'</div>'+
    '<div style="margin-top:8px;padding:8px 10px;border-radius:8px;border:1px solid #f87171;color:#fecaca;font-weight:700">Manpower Shortages (for the day) = Absent = <b>'+shortCalc+'</b> · Entered total: <b>'+(SUB_SHORTAGE.totalBranchShortages!=null?SUB_SHORTAGE.totalBranchShortages:shortCalc)+'</b></div>'+
    '<div style="margin-top:8px;padding:8px 10px;border-radius:8px;border:1px solid #c9a84c;color:#fde68a;font-weight:700">OT breakdown: A '+otA+' + G '+otG+' + B '+otB+' + C '+otC+' = '+otSum+'</div>'+
    '<div style="margin-top:10px"><b style="color:#fde68a">Shortage by rank (most → least)</b><div class="mtblwrap" style="margin-top:6px"><table class="mtbl"><thead><tr><th>#</th><th>Rank / Role</th><th>Shortage</th></tr></thead><tbody>'+(shRows||'<tr><td colspan="3" class="hint">No role shortages entered — open Step 2.</td></tr>')+'</tbody></table></div></div>'+
    (siteOt?('<div style="margin-top:10px;overflow-x:auto"><table class="mtbl" style="font-size:13px"><thead><tr><th>#</th><th>Client</th><th>Site</th><th>Site OT</th><th>A</th><th>G</th><th>B</th><th>C</th></tr></thead><tbody>'+siteOt+'</tbody></table></div>'):'');
  el('subCheck').innerHTML='<b style="color:'+(SUB_READY?'#4ade80':'#fde68a')+'">'+(SUB_READY?'✅ Steps 1–3 complete':'⚠ Complete missing items first')+'</b><br>'+(items.length?items.join('<br>'):'Deployment &amp; shortage ready.')+otLine;
  renderSysList();
  updateSubmitBtn();
}
function applySystemEnrich(body){
  if(body.summary)SUB_SUMMARY=Object.assign({},SUB_SUMMARY||{},body.summary);
  if(body.collection)SUB_COL=body.collection;
  if(body.collectionPct&&!String(SUB_SUMMARY.weeklyCollectionPct||'').trim()){
    SUB_SUMMARY.weeklyCollectionPct=body.collectionPct;
    SUB_SUMMARY.collectionPct=body.collectionPct;
  }
  SUB_FIELD_META=body.fieldMeta||{};
  SUB_SYSTEM_READY=true;
  if(el('subSysNote'))el('subSysNote').textContent=body.mobileNote||'System figures refreshed for today. Green = from system. Amber/red = please check or enter on Step 3.';
  paintSubmitReview();
  // Persist pulled figures into draft so dashboard/report keep them.
  staffReportApi('saveDraft',{dateFor:SUB_DATE,summary:SUB_SUMMARY,submittedBy:(el('submittedBy')&&el('submittedBy').value)||''}).catch(function(){});
}
function refreshSubmitSystem(){
  var btn=el('btnRefreshSub');
  if(btn){btn.disabled=true;btn.textContent='Refreshing…';}
  if(el('subSysNote')){el('subSysNote').style.color='#93c5fd';el('subSysNote').textContent='Pulling Visits, Complaints, Compliance, Collection & Mobile…';}
  SUB_SYSTEM_READY=false;updateSubmitBtn();
  var watchdog=setTimeout(function(){
    if(SUB_SYSTEM_READY)return;
    SUB_SYSTEM_READY=true;
    if(el('subSysNote')){el('subSysNote').style.color='#fde68a';el('subSysNote').textContent='System refresh is taking long — you can submit with the figures already saved in Step 3.';}
    paintSubmitReview();
  },12000);
  return staffReportApi('enrichSummary',{dateFor:SUB_DATE||staffTodayIst(),lite:true,autoSync:true,forceSystem:true}).then(function(er){
    if(er.status===401){staffShowLogin(er.body.error);return;}
    if(er.status!==200){
      if(el('subSysNote')){el('subSysNote').style.color='#f87171';el('subSysNote').textContent=er.body.error||'Could not refresh — tap Refresh from system again.';}
      SUB_SYSTEM_READY=true;paintSubmitReview();
      return;
    }
    applySystemEnrich(er.body);
  }).catch(function(err){
    if(el('subSysNote')){el('subSysNote').style.color='#fde68a';el('subSysNote').textContent=(err&&err.message)?err.message:'Network slow — you can still submit with Step 3 figures.';}
    SUB_SYSTEM_READY=true;paintSubmitReview();
  }).finally(function(){clearTimeout(watchdog);if(btn){btn.disabled=false;btn.textContent='↻ Refresh from system';}});
}
function loadSubmit(){
  SUB_DATE=staffTodayIst();
  SUB_SYSTEM_READY=true;SUB_READY=false;
  var loadBox=el('subLoad');
  if(loadBox)loadBox.classList.remove('hidden');
  var form=el('subForm');if(form)form.classList.remove('hidden');
  updateSubmitBtn();
  var watchdog=setTimeout(function(){
    if(loadBox)loadBox.classList.add('hidden');
    if(el('subSysNote')){el('subSysNote').style.color='#fde68a';el('subSysNote').textContent='Saved figures are still opening — type your name, tick the box, and tap Submit. Steps 1–3 already saved will be used.';}
    SUB_SYSTEM_READY=true;
    updateSubmitBtn();
  },8000);
  staffReportApi('quickOpen',{dateFor:SUB_DATE}).then(function(res){
    clearTimeout(watchdog);
    if(res.status===401){staffShowLogin(res.body.error);return;}
    if(res.status!==200){if(loadBox)loadBox.innerHTML='<p class="hint" style="color:#f87171">'+(res.body.error||'Could not load')+'</p><button class="m-btn m-btn-gold" onclick="loadSubmit()">Try again</button>';return;}
    if(res.body.alreadySubmitted){if(loadBox){loadBox.classList.remove('hidden');loadBox.innerHTML='<p class="hint" style="color:#4ade80">✅ Already submitted today'+(res.body.submittedBy?' · '+h(res.body.submittedBy):'')+'.</p><p class="hint" style="margin-top:10px">To correct OT, Management must tap <b>Reopen</b> on <b>Submission Status</b> — then open Daily MIS again and resubmit.</p><a class="m-btn m-btn-navy" href="/mis-staff-daily" style="text-decoration:none;margin-top:10px;display:inline-block">← Back to Daily MIS</a>';}var btn=el('btnFinalSubmit');if(btn)btn.disabled=true;return;}
    SUB_ROWS=res.body.rows||[];
    SUB_SUMMARY=res.body.summary||{};
    SUB_COL=res.body.collection||{};
    SUB_SHORTAGE=res.body.manpowerShortage||{};
    el('subHdr').textContent=res.body.branch.name+' — '+res.body.dateFor;
    if(el('submittedBy'))el('submittedBy').value=res.body.submittedBy||'';
    if(loadBox)loadBox.classList.add('hidden');
    paintSubmitReview();
    return refreshSubmitSystem();
  }).catch(function(err){
    clearTimeout(watchdog);
    if(loadBox)loadBox.classList.add('hidden');
    if(el('subSysNote')){el('subSysNote').style.color='#fde68a';el('subSysNote').textContent=(err&&err.message?h(err.message):'Could not connect')+' — you can still submit if Steps 1–3 were saved.';}
    SUB_SYSTEM_READY=true;updateSubmitBtn();
  });
}
function finalSubmit(){
  var name=el('submittedBy').value.trim();
  if(!name){el('subMsg').style.color='#fde68a';el('subMsg').textContent='Enter your name first.';return;}
  var cert=el('misCertified');
  if(!cert||!cert.checked){el('subMsg').style.color='#fde68a';el('subMsg').textContent='Please tick the certification box before submit.';return;}
  var abs=0,otA=0,otG=0,otB=0,otC=0;
  SUB_ROWS.forEach(function(r){
    abs+=(r.sanA>0?(r.absA||0):0)+(r.sanG>0?(r.absG||0):0)+(r.sanB>0?(r.absB||0):0)+(r.sanC>0?(r.absC||0):0);
    otA+=clampOt(r.sanA,r.absA,r.otA);otG+=clampOt(r.sanG,r.absG,r.otG);otB+=clampOt(r.sanB,r.absB,r.otB);otC+=clampOt(r.sanC,r.absC,r.otC);
  });
  var otSum=otA+otG+otB+otC;
  var vac=Math.max(0,abs-otSum);
  if(!confirm('CERTIFICATION\\nI have checked the system figures (visits, night, complaints, PVC/Medical, collection, late start / out of post).\\nThey are correct for today.\\n\\nAbsent / Shortage: '+abs+'\\nOT: '+otSum+'\\nVacant: '+vac+'\\n\\nSubmit Daily MIS to Management now?'))return;
  var btn=el('btnFinalSubmit');if(btn)btn.disabled=true;
  el('subMsg').textContent='Submitting… please wait a few seconds.';
  staffReportApi('submit',{
    dateFor:SUB_DATE||staffTodayIst(),submittedBy:name,summary:SUB_SUMMARY,useServerDraft:true,certified:true,
    collection:{id:SUB_COL.id,budget:SUB_COL.budget||0,mon:SUB_COL.mon||0,tue:SUB_COL.tue||0,wed:SUB_COL.wed||0,thu:SUB_COL.thu||0,fri:SUB_COL.fri||0,sat:SUB_COL.sat||0}
  }).then(function(res){
    if(!res)return;
    if(btn)btn.disabled=false;
    if(res.status===200){
      var ack=res.body.acknowledgment||{};
      el('subMsg').style.color='#4ade80';
      el('subMsg').textContent=ack.ok
        ?('✅ Submitted! '+(ack.note||'Saved successfully.'))
        :('✅ Submitted! '+(ack.note||'Saved — email may follow shortly.'));
      setTimeout(function(){location.href='/mis-staff-daily';},2500);
    }else{el('subMsg').style.color='#f87171';el('subMsg').textContent=(res.body.error||'Could not submit.')+(res.body.missing?(' Missing: '+res.body.missing.join(', ')):'');updateSubmitBtn();}
  }).catch(function(err){if(btn)btn.disabled=false;el('subMsg').style.color='#f87171';el('subMsg').textContent=(err&&err.message)?err.message:'Network error — please try again.';updateSubmitBtn();});
}
function initStaffPage(){loadSubmit();}
`,
}

const BOARD: StaffPage = {
  active: '/mis-staff-board',
  title: 'Consolidated MIS',
  inner: `<div class="m-wrap">
  <div class="m-card">
    <div class="hint">Your branch row — same format as Management Consolidated MIS. Management merges all branches.</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-top:10px">
      <div><label class="m-lbl">Report Date</label><input class="m-inp" id="dateFor" type="date"></div>
      <button class="m-btn m-btn-gold" onclick="load()">Show</button>
      <a class="m-btn m-btn-navy" href="/mis-report" onclick="return staffGoDailyMis(event)" style="text-decoration:none">🕒 Submit / Edit</a>
    </div>
  </div>
  <div class="m-kgrid" id="kpis"></div>
  <div class="m-card">
    <div class="mtblwrap"><table class="mtbl">
      <thead><tr><th class="l">Branch</th><th>MIS</th><th>San</th><th>Abs</th><th>OT</th><th>Dep</th><th>Vac</th><th>Coll %</th><th>Med %</th><th>PVC %</th><th>Resign</th><th>Recruit</th><th>Compl</th><th class="l">Remarks</th></tr></thead>
      <tbody id="rows"></tbody>
    </table></div>
  </div>
</div>`,
  script: `
(function(){el('dateFor').value=staffTodayIst();})();
function hr(s,k,l){var v=s[k];if(v==null||v==='')v=s[l];return v==null?'':v;}
function load(){staffApi('consolidated',{dateFor:el('dateFor').value}).then(function(res){
  if(res.status===401){staffShowLogin(res.body.error);return;}
  if(res.status!==200)return;
  var d=res.body,r=d.report,t=d.branchTotals||{san:0,dep:0,abs:0,ot:0,vac:0},s=r?r.summary||{}:{};
  el('kpis').innerHTML='<div class="m-kpi '+(d.submitted?'s':'p')+'"><b>'+(d.submitted?'YES':'NO')+'</b><span>MIS Received</span></div><div class="m-kpi o"><b>'+t.san+'</b><span>Sanctioned</span></div><div class="m-kpi s"><b>'+t.dep+'</b><span>Deployed</span></div><div class="m-kpi p"><b>'+t.vac+'</b><span>Vacant</span></div>';
  if(!d.submitted){el('rows').innerHTML='<tr><td>'+h(d.branch.name)+'</td><td class="sc-poor">NO</td><td colspan="12" class="hint">Not submitted — open Daily MIS Submission.</td></tr>';return;}
  el('rows').innerHTML='<tr><td>'+h(d.branch.name)+'</td><td class="sc-good">YES</td><td>'+t.san+'</td><td>'+t.abs+'</td><td>'+t.ot+'</td><td>'+t.dep+'</td><td class="sc-poor">'+t.vac+'</td><td>'+h(s.collectionPct)+'</td><td>'+h(s.medicalFitnessPct)+'</td><td>'+h(s.pvcPct)+'</td><td>'+h(hr(s,'resignation','mobileMentionedPct'))+'</td><td>'+h(hr(s,'recruitment','mobileActualPct'))+'</td><td>'+h(s.complaints)+'</td><td>'+h(s.remarks)+'</td></tr>';
});}
function initStaffPage(){load();}
`,
}

const MD: StaffPage = {
  active: '/mis-staff-md',
  title: 'MD Sir Report',
  inner: `<div class="m-wrap">
  <div class="m-card">
    <div class="hint">Your branch section — Management sends the <b>full all-branch</b> MD Sir Report to MD Sir.</div>
    <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;margin-top:10px">
      <div><label class="m-lbl">Report Date</label><input class="m-inp" id="date" type="date"></div>
      <button class="m-btn m-btn-gold" onclick="load()">Show</button>
    </div>
  </div>
  <div id="report"></div>
</div>`,
  script: `
(function(){el('date').value=staffTodayIst();})();
function load(){staffApi('dashboard',{date:el('date').value}).then(function(res){
  if(res.status===401){staffShowLogin(res.body.error);return;}
  if(res.status!==200)return;
  var d=res.body,t=d.totals||{},s=d.summary||{},c=d.compliance||{};
  el('report').innerHTML=
    '<div class="m-card"><h3 style="color:#fde68a">'+h(d.branch.name)+' — '+d.dateFor+'</h3>'+
    '<div class="m-kgrid" style="margin-top:12px">'+
    '<div class="m-kpi o"><b>'+t.san+'</b><span>Sanctioned</span></div>'+
    '<div class="m-kpi s"><b>'+t.dep+'</b><span>Deployed</span></div>'+
    '<div class="m-kpi p"><b>'+t.vac+'</b><span>Vacant</span></div>'+
    '<div class="m-kpi t"><b>'+(d.deployPct||0)+'%</b><span>Deploy %</span></div></div>'+
    '<p class="hint" style="margin-top:14px">Collection: '+h(s.collectionPct||'—')+' · PVC: '+h(s.pvcPct||c.pvcPct||'—')+'% · Medical: '+h(s.medicalFitnessPct||c.medicalPct||'—')+'% · Resignation: '+h(s.resignation||'—')+' · Recruitment: '+h(s.recruitment||'—')+' · Complaints: '+h(s.complaints||'—')+'</p>'+
    '<p class="hint">Remarks: '+h(s.remarks||'—')+'</p></div>'+
    '<div class="m-card"><h4>Vacant Posts</h4><div class="mtblwrap"><table class="mtbl"><thead><tr><th>Client</th><th>Site</th><th class="c">Vacant</th></tr></thead><tbody>'+
    (d.vacantRows||[]).map(function(v){return '<tr><td>'+h(v.client)+'</td><td>'+h(v.unit)+'</td><td class="c">'+v.vac+'</td></tr>';}).join('')+
    '</tbody></table></div></div>';
});}
function initStaffPage(){load();}
`,
}

const BPI: StaffPage = {
  active: '/mis-staff-bpi',
  title: 'Branch Performance',
  inner: `<div class="m-wrap">
  <div class="m-card"><div class="hint">BPI for your branch — same formula as Management Portal.</div>
    <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;margin-top:10px">
      <div><label class="m-lbl">Date</label><input class="m-inp" id="date" type="date"></div>
      <button class="m-btn m-btn-gold" onclick="load()">Show</button>
    </div>
  </div>
  <div class="m-kgrid" id="kpis"></div>
  <div class="m-card"><div class="mtblwrap"><table class="mtbl"><thead><tr><th>Area</th><th class="c">Weight</th><th class="c">Score</th></tr></thead><tbody id="rows"></tbody></table></div></div>
</div>`,
  script: `
(function(){el('date').value=staffTodayIst();})();
function cls(v){return v>=80?'sc-bg-good':(v>=60?'sc-bg-fair':'sc-bg-poor');}
function load(){staffApi('bpi',{date:el('date').value}).then(function(res){
  if(res.status===401){staffShowLogin(res.body.error);return;}
  if(res.status!==200)return;
  var s=res.body.score||{};
  el('kpis').innerHTML='<div class="m-kpi t"><b>'+(s.bpi||0)+'</b><span>BPI Score</span></div><div class="m-kpi o"><b>'+(s.deployment||0)+'</b><span>Deployment</span></div><div class="m-kpi s"><b>'+(s.compliance||0)+'</b><span>Compliance</span></div><div class="m-kpi p"><b>'+(s.client||0)+'</b><span>Client</span></div><div class="m-kpi o"><b>'+(s.admin||0)+'</b><span>Admin</span></div>';
  el('rows').innerHTML=
    '<tr><td>Deployment</td><td class="c">40%</td><td class="c"><span class="'+cls(s.deployment)+'">'+(s.deployment||0)+'</span></td></tr>'+
    '<tr><td>Compliance (PVC / Medical / Training)</td><td class="c">30%</td><td class="c"><span class="'+cls(s.compliance)+'">'+(s.compliance||0)+'</span></td></tr>'+
    '<tr><td>Client (complaints)</td><td class="c">20%</td><td class="c"><span class="'+cls(s.client)+'">'+(s.client||0)+'</span></td></tr>'+
    '<tr><td>Admin (on-time submit)</td><td class="c">10%</td><td class="c"><span class="'+cls(s.admin)+'">'+(s.admin||0)+'</span></td></tr>'+
    '<tr><td><b>Total BPI</b></td><td class="c"></td><td class="c"><span class="'+cls(s.bpi)+'"><b>'+(s.bpi||0)+'</b></span></td></tr>';
});}
function initStaffPage(){load();}
`,
}

const CLIENT: StaffPage = {
  active: '/mis-staff-client',
  title: 'Client Performance',
  inner: `<div class="m-wrap">
  <div class="m-card noprint">
    <div class="hint" style="margin-bottom:12px">Colourful report — <b>Deployment pie</b> (no. of days) and <b>₹ coin stacks</b> for Monthly bill vs Balance (auto-saves for Management).</div>
    <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
      <div style="flex:1;min-width:220px"><label class="m-lbl">Client (your branch)</label><select class="m-inp" id="client" style="width:100%"></select></div>
      <div><label class="m-lbl">From</label><input class="m-inp" id="from" type="date"></div>
      <div><label class="m-lbl">To</label><input class="m-inp" id="to" type="date"></div>
      <button class="m-btn m-btn-gold" onclick="run()">Generate</button>
    </div>
    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
      <button type="button" class="m-btn m-btn-navy" onclick="setThisWeek()">This week</button>
      <button type="button" class="m-btn m-btn-navy" onclick="setThisMonth()">This month</button>
      <button type="button" class="m-btn m-btn-navy" onclick="setLastMonth()">Last month</button>
    </div>
  </div>
  <div id="report"></div>
</div>`,
  script: `
var LAST_REPORT=null,SAVE_TIMER=null;
${CLIENT_PERF_MONEY_JS}
${CLIENT_PERF_BILLING_BAR_JS}
function iso(d){return d.toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});}
function mondayOf(d){var x=new Date(d);var day=x.getDay();var diff=day===0?-6:1-day;x.setDate(x.getDate()+diff);return x;}
function setThisWeek(){var t=new Date();var m=mondayOf(t);el('from').value=iso(m);el('to').value=iso(t);}
function setThisMonth(){var t=new Date();el('from').value=iso(new Date(t.getFullYear(),t.getMonth(),1));el('to').value=iso(t);}
function setLastMonth(){var t=new Date();var first=new Date(t.getFullYear(),t.getMonth()-1,1);var last=new Date(t.getFullYear(),t.getMonth(),0);el('from').value=iso(first);el('to').value=iso(last);}
function n(v){return v==null||v===''?'—':v;}
function fmtDate(ymd){var m=/^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(String(ymd||''));if(!m)return String(ymd||'');return m[3]+'-'+m[2]+'-'+m[1];}
function periodWords(d){return fmtDate(d.from)+' to '+fmtDate(d.to);}
function row(k,v){return '<tr><td class="k">'+h(k)+'</td><td class="v">'+h(v)+'</td></tr>';}
function donutArc(cx,cy,r,ir,startDeg,endDeg){
  if(endDeg-startDeg>=359.99)return '';
  var s1=startDeg*Math.PI/180,s2=endDeg*Math.PI/180;
  var x1=cx+r*Math.sin(s1),y1=cy-r*Math.cos(s1),x2=cx+r*Math.sin(s2),y2=cy-r*Math.cos(s2);
  var x3=cx+ir*Math.sin(s2),y3=cy-ir*Math.cos(s2),x4=cx+ir*Math.sin(s1),y4=cy-ir*Math.cos(s1);
  var lg=(endDeg-startDeg)>180?1:0;
  return 'M '+x1+' '+y1+' A '+r+' '+r+' 0 '+lg+' 1 '+x2+' '+y2+' L '+x3+' '+y3+' A '+ir+' '+ir+' 0 '+lg+' 0 '+x4+' '+y4+' Z';
}
function pie3dDonut(slices,emptyMsg,center,money){
  var active=slices.filter(function(s){return Math.max(0,Number(s.value)||0)>0;});
  var total=active.reduce(function(sum,s){return sum+Math.max(0,Number(s.value)||0);},0);
  if(!total)return '<div style="color:#94a3b8;padding:24px">'+h(emptyMsg)+'</div>';
  var cx=100,cy=82,r=76,ir=42,depth=11,uid=Math.random().toString(36).slice(2,8),angle=0,html='';
  html+='<svg width="200" height="170" viewBox="0 0 200 170"><defs>';
  active.forEach(function(s,idx){html+='<linearGradient id="cpg'+uid+idx+'" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0%" stop-color="'+s.light+'"/><stop offset="100%" stop-color="'+s.dark+'"/></linearGradient>';});
  html+='</defs><ellipse cx="'+cx+'" cy="'+(cy+depth+18)+'" rx="'+(r*0.82)+'" ry="9" fill="rgba(15,23,42,0.14)"/>';
  active.forEach(function(s){var val=Math.max(0,Number(s.value)||0),sweep=val/total*360;if(sweep<0.05)return;var start=angle;angle+=sweep;html+='<path d="'+donutArc(cx,cy+depth,r,ir,start,angle)+'" fill="'+s.dark+'" opacity="0.9"/>';});
  angle=0;
  active.forEach(function(s,idx){var val=Math.max(0,Number(s.value)||0),sweep=val/total*360;if(sweep<0.05)return;var start=angle;angle+=sweep;html+='<path d="'+donutArc(cx,cy,r,ir,start,angle)+'" fill="url(#cpg'+uid+idx+')" stroke="#fff" stroke-width="1.5"/>';});
  if(center&&center.value){html+='<text x="'+cx+'" y="'+(cy-4)+'" text-anchor="middle" font-size="18" font-weight="800" fill="#fde68a">'+h(center.value)+'</text>';if(center.label)html+='<text x="'+cx+'" y="'+(cy+12)+'" text-anchor="middle" font-size="9" fill="#94a3b8">'+h(center.label)+'</text>';}
  html+='</svg><div class="chart-legend">';
  active.forEach(function(s){var val=Math.max(0,Number(s.value)||0),pct=Math.round(val*100/total);var shown=money?fmtInrThousands(val):String(val);html+='<span><i class="dot" style="background:linear-gradient(180deg,'+s.light+','+s.dark+')"></i>'+h(s.label)+' <b>'+h(shown)+'</b> ('+pct+'%)</span>';});
  return html+'</div>';
}
function depDaysBlock(days,san,dep,vac){
  var s=Math.max(0,Number(san)||0),d=Math.max(0,Number(dep)||0),v=Math.max(0,Number(vac)||0);
  var depPct=s?Math.round(d*100/s):0,vacPct=s?Math.round(v*100/s):0;
  return '<div class="cp-dep-days"><h5>Deployment for '+h(String(days))+' days</h5><table><tr><td class="san"><span class="n">'+s+'</span>Sanctioned Posts</td><td class="dep"><span class="n">'+depPct+'%</span>Deployed strength</td><td class="vac"><span class="n">'+vacPct+'%</span>Vacant posts</td></tr></table></div>';
}
function pie3dDeploy(san,dep,vac,days){
  var s=Math.max(0,Number(san)||0),d=Math.max(0,Number(dep)||0),v=Math.max(0,Number(vac)||0),total=s||d+v;
  if(!total)return '<div style="color:#94a3b8;padding:24px">No deployment data</div>';
  var slices=[{label:'Deployed strength',value:d,light:'#4ade80',dark:'#15803d'},{label:'Vacant posts',value:v,light:'#f87171',dark:'#b91c1c'}];
  var gap=Math.max(0,s-d-v);if(gap>0)slices.push({label:'Sanctioned (unfilled)',value:gap,light:'#93c5fd',dark:'#1d4ed8'});
  return pie3dDonut(slices,'No deployment data',{value:String(s||d+v+gap),label:'Sanctioned Posts'})+depDaysBlock(days,s,d,v);
}
function mwBanner(d){
  var raw=String(d.mwCompliant||'').toLowerCase();
  if(raw==='yes')return '<div class="mw-yes">✓ Minimum Wage Compliant — <span style="font-size:17px">YES</span></div>';
  if(raw==='no')return '<div class="mw-no">✗ Minimum Wage Compliant — <span style="font-size:17px">NO</span></div>';
  return '<div class="mw-pend">Select MW Compliant below — saves automatically</div>';
}
function pctBanner(label,pct){
  if(pct==null||pct==='')return '<div class="cmp-pend">'+h(label)+'</div>';
  var p=Math.max(0,Math.min(100,Math.round(Number(pct))));
  var cls=p>=90?'cmp-ok':(p>=70?'cmp-mid':'cmp-low');
  return '<div class="'+cls+'">✓ '+h(label)+'</div>';
}
function complianceBanners(d){
  var pvc=d.pvcLabel||(d.pvcPct!=null?'PVC Compliant — '+d.pvcPct+'%':'PVC — Guard Docs not linked for this client yet');
  var mc=d.medicalLabel||(d.medicalPct!=null?'MC (Medical Fitness) — '+d.medicalPct+'%':'MC (Medical) — Guard Docs not linked for this client yet');
  return pctBanner(pvc,d.pvcPct)+pctBanner(mc,d.medicalPct)+'<div id="mwBannerWrap">'+mwBanner(d)+'</div>';
}
function billKpisHtml(d){
  return '<div class="cp-money-grid"><div class="cp-money bl"><b>'+h(fmtInrThousands(d.monthlyBillLacs))+'</b><span>Monthly bill</span></div><div class="cp-money am"><b>'+h(fmtInrThousands(d.collectedLacs))+'</b><span>Collected</span></div><div class="cp-money pu"><b>'+h(fmtInrThousands(d.balanceToPayLacs))+'</b><span>Balance to be paid</span></div></div>';
}
function financeFromForm(){
  var billL=normalizeToLacs(el('monthlyBillLacs').value),balL=normalizeToLacs(el('balanceToPayLacs').value),coll=null;
  if(billL!=null&&balL!=null)coll=Math.round((billL-balL)*100)/100;
  return {mwCompliant:el('mwCompliant').value,monthlyBillLacs:billL,balanceToPayLacs:balL,collectedLacs:coll};
}
function refreshFinanceUi(){
  if(!LAST_REPORT)return;
  var fin=financeFromForm();
  var d=Object.assign({},LAST_REPORT,fin);
  LAST_REPORT=d;
  var wrap=el('mwBannerWrap');
  if(wrap)wrap.innerHTML=mwBanner(d);
  else if(el('cmpBanners'))el('cmpBanners').innerHTML=complianceBanners(d);
  el('billKgrid').innerHTML=billKpisHtml(d);
  el('chartBilling').innerHTML=billingCoinStacks(d.monthlyBillLacs,d.collectedLacs,d.balanceToPayLacs);
}
function queueFinanceSave(){
  if(!LAST_REPORT)return;
  clearTimeout(SAVE_TIMER);
  el('finMsg').textContent='Saving…';
  SAVE_TIMER=setTimeout(function(){
    var fin=financeFromForm();
    staffApi('saveClientPerfFinance',{clientName:LAST_REPORT.clientName,mwCompliant:fin.mwCompliant,monthlyBillLacs:fin.monthlyBillLacs,balanceToPayLacs:fin.balanceToPayLacs}).then(function(res){
      if(res.status===401){staffShowLogin(res.body.error);return;}
      if(res.status!==200){el('finMsg').style.color='#f87171';el('finMsg').textContent=res.body.error||'Save failed';return;}
      el('finMsg').style.color='#4ade80';el('finMsg').textContent='✓ Saved — Management letter updated';
      refreshFinanceUi();
    });
  },500);
}
function bindFinanceInputs(){
  ['mwCompliant','monthlyBillLacs','balanceToPayLacs'].forEach(function(id){
    var node=el(id);if(!node)return;
    node.onchange=function(){refreshFinanceUi();queueFinanceSave();};
    node.oninput=function(){refreshFinanceUi();queueFinanceSave();};
  });
}
(function(){setThisMonth();})();
function run(){el('report').innerHTML='<div class="m-card">Generating…</div>';LAST_REPORT=null;staffApi('clientPerf',{clientName:el('client').value,from:el('from').value,to:el('to').value}).then(function(res){
  if(res.status===401){staffShowLogin(res.body.error);return;}
  if(res.status!==200){el('report').innerHTML='<div class="m-card">'+(res.body.error||'Error')+'</div>';return;}
  renderDashboard(res.body);
});}
function renderDashboard(d){
  LAST_REPORT=d;
  var period=periodWords(d),mw=String(d.mwCompliant||'');
  el('report').innerHTML=
    '<div class="m-hdr"><div><b>'+h(d.clientName)+'</b><div class="badges">Unit Performance Report · '+h(period)+'</div></div>'+
    '<div class="m-kpi t" style="min-width:130px"><b>'+h(String(d.avgDeploy))+'%</b><span>Avg Deployment</span></div></div>'+
    '<div class="cp-charts">'+
      '<div class="cp-chart-panel"><h4>'+deployChartTitle(d.daysWithData)+'</h4>'+pie3dDeploy(d.san,d.dep,d.vac,d.daysWithData)+'</div>'+
      '<div class="cp-chart-panel"><h4>'+billingChartTitle()+'</h4><div id="chartBilling">'+billingCoinStacks(d.monthlyBillLacs,d.collectedLacs,d.balanceToPayLacs)+'</div></div>'+
    '</div>'+
    '<div class="m-card"><div class="sec-h">1. Deployment</div>'+
      '<div class="m-kgrid">'+
        '<div class="m-kpi o"><b>'+h(String(d.san))+'</b><span>Sanctioned</span></div>'+
        '<div class="m-kpi s"><b>'+h(String(d.dep))+'</b><span>Deployed</span></div>'+
        '<div class="m-kpi p"><b>'+h(String(d.vac))+'</b><span>Vacant</span></div>'+
        '<div class="m-kpi t"><b>'+h(String(d.daysWithData))+'</b><span>Days with data</span></div>'+
      '</div></div>'+
    '<div class="m-card"><div class="sec-h">2. Visits &amp; Duty</div>'+
      '<div class="m-kgrid">'+
        '<div class="m-kpi o"><b>'+h(n(d.dayVisits))+'</b><span>Day Visits</span></div>'+
        '<div class="m-kpi t"><b>'+h(n(d.nightChecks))+'</b><span>Night Checks</span></div>'+
        '<div class="m-kpi s"><b>'+h(n(d.training))+'</b><span>Training</span></div>'+
        '<div class="m-kpi p"><b>'+h(n(d.lateStart))+'</b><span>Late Start</span></div>'+
        '<div class="m-kpi p"><b>'+h(n(d.outOfPost))+'</b><span>Out of Post</span></div>'+
      '</div></div>'+
    '<div class="m-card"><div class="sec-h">3. Compliance &amp; Billing</div>'+
      '<div class="branch-fin">'+
        '<div><label class="m-lbl">MW Compliant</label><select class="m-inp" id="mwCompliant"><option value="">— Select —</option><option value="yes"'+(mw==='yes'?' selected':'')+'>Yes</option><option value="no"'+(mw==='no'?' selected':'')+'>No</option></select></div>'+
        '<div><label class="m-lbl">Monthly bill (₹ thousands)</label><input class="m-inp" id="monthlyBillLacs" inputmode="decimal" placeholder="e.g. 525.00 K or 525000" value="'+h(lacsInputVal(d.monthlyBillLacs))+'"></div>'+
        '<div><label class="m-lbl">Balance to be paid (₹ thousands)</label><input class="m-inp" id="balanceToPayLacs" inputmode="decimal" placeholder="e.g. 125.00 K or 125000" value="'+h(lacsInputVal(d.balanceToPayLacs))+'"></div>'+
      '</div>'+
      (d.san||d.complianceSan?'<div class="cmp-ok" style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);box-shadow:0 4px 14px rgba(37,99,235,.35)">Unit sanctioned strength: '+h(String(d.complianceSan||d.san))+' posts — PVC &amp; MC cannot exceed this</div>':'')+
      '<div id="cmpBanners">'+complianceBanners(d)+'</div>'+
      (d.accuracyNote?'<p class="hint" style="text-align:center;margin:8px 0 4px;color:#cbd5e1">'+h(d.accuracyNote)+'</p>':'')+
      '<div id="billKgrid">'+billKpisHtml(d)+'</div>'+
      '<div class="fin-saved" id="finMsg"></div>'+
      '<p class="hint" style="text-align:center;margin-top:10px">Amounts in ₹ thousands · MW / Bill / Balance save automatically</p></div>';
  bindFinanceInputs();
}
function initStaffPage(){staffApi('clientList').then(function(res){if(res.status===200)el('client').innerHTML=(res.body.clients||[]).map(function(c){var name=typeof c==='string'?c:(c.name||'');var tier=typeof c==='string'?'':(c.businessTierLabel||'');return '<option value="'+h(name)+'">'+h(name)+(tier?' — '+h(tier):'')+'</option>';}).join('');});}
`,
}

const VISITS: StaffPage = {
  active: '/mis-staff-visits',
  title: 'Client Visits',
  inner: clientVisitInnerHtml({
    portal: 'staff',
    activePath: '/mis-staff-visits',
    title: 'Client Visits',
  }),
  script: `
${clientVisitScript({ portal: 'staff', activePath: '/mis-staff-visits', title: 'Client Visits' })}
${clientVisitStaffBootScript()}
`,
}

const DUTY: StaffPage = {
  active: '/mis-staff-duty',
  title: 'Late Start & Out of Post',
  inner: `<div class="m-wrap">
  <div class="m-card"><div class="hint"><b>Late Duty</b> and <b>Out of Location</b> from Agile Mobile — same as Management. Each row shows the <b>guard mobile</b> with <b>Call</b> and <b>WhatsApp Warning</b>.</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-top:10px">
      <div><label class="m-lbl">Date</label><input class="m-inp" id="date" type="date"></div>
      <button class="m-btn m-btn-gold" onclick="load()">Show</button>
      <button class="m-btn m-btn-navy" onclick="syncNow()">📱 Sync from Mobile</button>
      <button class="m-btn m-btn-green" onclick="shareDutyReport()">✉ Share</button>
      <button class="m-btn m-btn-grey" onclick="downloadDutyPdf()">⬇ Download PDF</button>
    </div>
  </div>
  <div class="m-kgrid" id="kpis"></div>
  <div class="m-card"><h4>Patrol — KM Travelled</h4><div class="mtblwrap"><table class="mtbl"><thead><tr><th class="c">Type</th><th>Staff</th><th>Client</th><th>Site</th><th class="c">Time</th><th class="c">KM</th><th>Remarks</th></tr></thead><tbody id="patrolTbl"></tbody></table></div></div>
  <div class="m-card"><h4>Late Duty</h4><div class="mtblwrap"><table class="mtbl"><thead><tr><th>Guard</th><th class="c">Mobile</th><th>Client</th><th>Site</th><th class="c">Start Time</th><th class="c">Call</th><th class="c">WhatsApp Warning</th><th>Remarks</th></tr></thead><tbody id="lateRows"></tbody></table></div></div>
  <div class="m-card"><h4>Out of Location</h4><div class="mtblwrap"><table class="mtbl"><thead><tr><th>Guard</th><th class="c">Mobile</th><th>Client</th><th>Site</th><th class="c">Left Time</th><th class="c">Away Detail</th><th class="c">Call</th><th class="c">WhatsApp Warning</th><th>Remarks</th></tr></thead><tbody id="outRows"></tbody></table></div></div>
</div>`,
  script: `
${DUTY_CONTACT_JS}
(function(){el('date').value=staffTodayIst();})();
function load(){staffApi('duty',{date:el('date').value}).then(render);}
function syncNow(){staffApi('syncDuty',{date:el('date').value}).then(render);}
function shareDutyReport(){
  var to=prompt('Enter client email ID to share this report (Director will be copied):');
  if(to==null)return;to=String(to||'').trim();if(!to||to.indexOf('@')<0){alert('Please enter a valid email ID.');return;}
  staffApi('sendDutyReportMail',{date:el('date').value,to:to}).then(function(res){
    if(res.status===401){staffShowLogin(res.body.error);return;}
    alert(res.status===200?'✅ Report shared by email (CC: Director).':(res.body.error||'Could not send'));
  });
}
function downloadDutyPdf(){
  staffApi('dutyReportHtml',{date:el('date').value}).then(function(res){
    if(res.status===401){staffShowLogin(res.body.error);return;}
    if(res.status!==200){alert(res.body.error||'Could not build PDF');return;}
    var w=window.open('','_blank','noopener');
    if(!w){alert('Please allow pop-ups to download the PDF');return;}
    w.document.write(res.body.html);w.document.close();
    setTimeout(function(){w.focus();w.print();},400);
  });
}
function render(res){
  if(res.status===401){staffShowLogin(res.body.error);return;}
  if(res.status!==200)return;
  var d=res.body,c=d.counts||{},vis=d.patrolVisits||[];
  el('kpis').innerHTML='<div class="m-kpi o"><b>'+(vis.length||0)+'</b><span>Patrol Visits</span></div><div class="m-kpi s"><b>'+(d.totalPatrolKm||0)+'</b><span>Total KM</span></div><div class="m-kpi p"><b>'+(c.late||0)+'</b><span>Late Duty</span></div><div class="m-kpi p"><b>'+(c.out||0)+'</b><span>Out of Location</span></div>';
  el('patrolTbl').innerHTML=vis.map(function(v){
    var vt=v.visitType==='N'?'Night':(v.visitType==='T'?'Training':'Day');
    return '<tr><td class="c">'+vt+'</td><td>'+h(v.user)+'</td><td>'+h(v.client)+'</td><td>'+h(v.unit)+'</td><td class="c">'+h(v.visitTime)+'</td><td class="c">'+(v.kmTravelled?h(v.kmTravelled):'—')+'</td><td>'+h(v.patrolPoint||v.remarks||'')+'</td></tr>';
  }).join('')||'<tr><td colspan="7" class="hint">No patrol visits — sync from mobile.</td></tr>';
  var list=d.incidents||[];
  el('lateRows').innerHTML=dutyLateRowsHtml(list.filter(function(i){return i.type==='late_start';}));
  el('outRows').innerHTML=dutyOutRowsHtml(list.filter(function(i){return i.type==='out_of_post';}));
}
function initStaffPage(){load();}
`,
}

const UNIT: StaffPage = {
  active: '/mis-staff-unit-issue',
  title: 'SLA- Analysis & Compliance',
  inner: `<div class="m-wrap" id="slaRoot"><p class="hint">Loading SLA compliance…</p></div>`,
  script: SLA_COMPLIANCE_PAGE_JS,
}

const COLLECTION: StaffPage = {
  active: '/mis-staff-collection',
  title: 'Collection (DSO)',
  inner: `<div class="m-wrap">
  <div class="m-card">
    <div class="hint">Weekly collection entry and Saturday file upload — feeds Management Collection (DSO) report. Saved weekly data also appears in <b>Daily MIS Submission</b>.</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-top:10px">
      <div><label class="m-lbl">Week Starting (Monday)</label><input class="m-inp" id="week" type="date" onchange="load()"></div>
      <button class="m-btn m-btn-gold" onclick="save()">💾 Save Weekly</button>
    </div>
    <div class="m-kgrid" style="margin-top:14px" id="kpis"></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;margin-top:12px">
      <div><label class="m-lbl">Budget</label><input class="m-inp" id="budget"></div>
      <div><label class="m-lbl">Mon</label><input class="m-inp" id="mon"></div>
      <div><label class="m-lbl">Tue</label><input class="m-inp" id="tue"></div>
      <div><label class="m-lbl">Wed</label><input class="m-inp" id="wed"></div>
      <div><label class="m-lbl">Thu</label><input class="m-inp" id="thu"></div>
      <div><label class="m-lbl">Fri</label><input class="m-inp" id="fri"></div>
      <div><label class="m-lbl">Sat</label><input class="m-inp" id="sat"></div>
    </div>
    <div id="saveMsg" class="hint" style="margin-top:10px"></div>
    <div id="colCarryNote" class="hint" style="margin-top:6px;color:#93c5fd"></div>
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid #334155">
      <label class="m-lbl">① CC BEFORE xlsx (weekly)</label><input id="ccFile" type="file" accept=".xlsx,.xls" style="color:#e2e8f0"><button class="m-btn m-btn-navy" style="margin-top:8px" onclick="uploadCc()">📤 Upload</button>
    </div>
    <div style="margin-top:12px">
      <label class="m-lbl">② OST BILLS (Collection Statement)</label><input id="ostFile" type="file" accept=".xlsx,.xls" style="color:#e2e8f0"><button class="m-btn m-btn-navy" style="margin-top:8px" onclick="uploadOst()">📤 Upload</button>
    </div>
  </div>
</div>`,
  script: `
var COL=null;
function mondayOf(d){var x=new Date(d+'T12:00:00');var day=x.getDay();var diff=(day===0?-6:1-day);x.setDate(x.getDate()+diff);return x.toISOString().slice(0,10);}
(function(){el('week').value=mondayOf(staffTodayIst());})();
function load(){staffApi('loadCollection',{weekStart:el('week').value}).then(function(res){
  if(res.status===401){staffShowLogin(res.body.error);return;}
  if(res.status!==200){el('saveMsg').textContent=res.body.error||'Could not load — refresh page.';return;}
  COL=res.body.collection||{};
  ['budget','mon','tue','wed','thu','fri','sat'].forEach(function(k){if(el(k))el(k).value=COL[k]||'';});
  if(el('colCarryNote'))el('colCarryNote').textContent=res.body.carryNote||'';
  el('kpis').innerHTML='<div class="m-kpi t"><b>'+(res.body.collected||0)+' L</b><span>Collected</span></div><div class="m-kpi s"><b>'+(res.body.achievement||0)+'%</b><span>Achievement</span></div><div class="m-kpi p"><b>'+(COL.outstanding||0)+'</b><span>Outstanding</span></div><div class="m-kpi o"><b>'+(res.body.dso||0)+'</b><span>DSO</span></div>';
});}
function save(){staffApi('saveCollection',{weekStart:el('week').value,collection:{id:COL&&COL.id,budget:el('budget').value,mon:el('mon').value,tue:el('tue').value,wed:el('wed').value,thu:el('thu').value,fri:el('fri').value,sat:el('sat').value}}).then(function(res){el('saveMsg').textContent=res.status===200?'Saved ✓':(res.body.error||'Failed');if(res.status===200)load();});}
function readFile(input,cb){var f=input.files&&input.files[0];if(!f){alert('Choose a file');return;}var r=new FileReader();r.onload=function(){cb(f.name,r.result.split(',')[1]||'');};r.readAsDataURL(f);}
function uploadCc(){readFile(el('ccFile'),function(n,d){staffApi('importCollectionSheet',{weekStart:el('week').value,fileName:n,data:d}).then(function(res){el('saveMsg').textContent=res.status===200?(res.body.message||'OK'):res.body.error;load();});});}
function uploadOst(){readFile(el('ostFile'),function(n,d){staffApi('importOutstandingFile',{weekStart:el('week').value,fileName:n,data:d}).then(function(res){el('saveMsg').textContent=res.status===200?(res.body.message||'OK'):res.body.error;load();});});}
function initStaffPage(){load();}
`,
}

const REGISTER: StaffPage = {
  active: '/mis-staff-register',
  title: 'Guards Complaint',
  inner: `<div class="m-wrap">
  <div class="m-card">
    <div class="hint">Pulled from <b>Agile Guards</b> — shows only <b>Delayed</b> guard complaints that are <b>not resolved</b> (same columns &amp; controls as Client Complaints). Resolved / closed cases are hidden. Full register: <a href="${GUARDS_URL}" target="_blank" style="color:#c9a84c">Open Agile Guards</a></div>
    <div class="m-actions" style="margin-top:10px">
      <button type="button" class="m-btn m-btn-gold" onclick="load()">🔄 Sync from Agile Guards</button>
      <button type="button" class="m-btn m-btn-green" onclick="save()">✅ Save &amp; Publish</button>
      <span id="syncMsg" class="hint" style="margin:0"></span>
    </div>
    <div id="saveMsg" class="hint" style="margin-top:8px"></div>
  </div>
  <div class="m-kgrid" id="kpis"></div>
  <div class="m-card">
    <h4>Delayed Guard Complaints <span style="background:rgba(251,191,36,.2);color:#fbbf24;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:800">Not resolved</span></h4>
    <label style="display:flex;align-items:center;gap:6px;margin:0 0 10px;font-size:13px;color:#94a3b8"><input type="checkbox" id="showArchived" onchange="render()"> Show archived</label>
    <div class="mtblwrap"><table class="mtbl">
      <thead><tr><th>Code</th><th>Client</th><th>Location</th><th>Date</th><th>Via</th><th>Nature</th><th>Description</th><th>Action Taken</th><th class="c">MOM &lt;24h</th><th>Status</th><th>Reported By</th><th>Archive</th><th>Delete</th></tr></thead>
      <tbody id="rows"></tbody>
    </table></div>
  </div>
</div>`,
  script: `
var ALL=[],NATURES=${NATURES_JSON};
function a(s){return h(s).replace(/"/g,'&quot;');}
function chOpt(cur){return ['Phone','Mail','WhatsApp','Email','Web','Agile Guards'].map(function(o){return '<option'+(o===(cur||'Agile Guards')?' selected':'')+'>'+o+'</option>';}).join('');}
function natureOpt(cur){var opts='<option value="">— select —</option>';NATURES.forEach(function(n){opts+='<option'+(n===(cur||'')?' selected':'')+'>'+h(n)+'</option>';});return opts;}
function isDelayedGuard(c){
  if(!c||c.type!=='Guard')return false;
  if(c.status==='Closed'||c.status==='Resolved'||c.status==='Solved')return false;
  return c.status==='Delayed'||/DELAYED/i.test(String(c.description||''));
}
function visibleList(){
  var show=el('showArchived')&&el('showArchived').checked;
  return ALL.map(function(c,i){return{c:c,i:i};}).filter(function(x){
    if(!isDelayedGuard(x.c))return false;
    if(!show&&x.c.active===false)return false;
    return true;
  }).sort(function(a,b){
    var da=String(a.c.registeredAt||a.c.incidentDate||'');
    var db=String(b.c.registeredAt||b.c.incidentDate||'');
    return db.localeCompare(da);
  });
}
function upd(i,f,v){if(!ALL[i])return;ALL[i][f]=v;kpi();}
function toggleArchive(i){if(!ALL[i])return;ALL[i].active=ALL[i].active===false;render();}
function deleteRow(i){
  if(!confirm('Delete this guard complaint permanently?'))return;
  ALL.splice(i,1);render();
}
function kpi(){
  var list=visibleList();
  var delayed=list.length,mom=0,archived=0;
  ALL.forEach(function(c){if(c.type==='Guard'&&c.active===false)archived++;});
  list.forEach(function(x){if(x.c.momWithin24h)mom++;});
  var momPct=delayed?Math.round(mom*100/delayed):0;
  el('kpis').innerHTML=
    '<div class="m-kpi o"><b style="color:#fbbf24">'+delayed+'</b><span>Delayed (open)</span></div>'+
    '<div class="m-kpi s"><b>'+momPct+'%</b><span>MOM within 24h</span></div>'+
    '<div class="m-kpi p"><b>'+archived+'</b><span>Archived guards</span></div>';
}
function render(){
  var tb=el('rows');tb.innerHTML='';
  var list=visibleList();
  if(!list.length){
    tb.innerHTML='<tr><td colspan="13" class="hint">No delayed unresolved guard complaints for your branch — sync from Agile Guards or check Agile Guards → Delayed Complaints.</td></tr>';
    kpi();return;
  }
  list.forEach(function(item){
    var c=item.c,i=item.i;
    function opt(cur,arr){return arr.map(function(o){return '<option'+(o===cur?' selected':'')+'>'+o+'</option>';}).join('');}
    var stCls=c.status==='Closed'?'sc-good':(c.status==='Delayed'?'':'sc-poor');
    var act=c.active!==false;
    var tr=document.createElement('tr');
    if(!act)tr.style.opacity='.55';
    tr.innerHTML='<td style="font-weight:800;color:#fde68a;white-space:nowrap">'+(c.code?h(c.code):'<span class="hint">—</span>')+'</td>'+
     '<td><input class="m-inp" value="'+a(c.clientName)+'" oninput="upd('+i+',\\'clientName\\',this.value)"></td>'+
     '<td><input class="m-inp" value="'+a(c.location)+'" oninput="upd('+i+',\\'location\\',this.value)"></td>'+
     '<td><input class="m-inp" type="date" value="'+a(c.incidentDate)+'" oninput="upd('+i+',\\'incidentDate\\',this.value)"></td>'+
     '<td><select class="m-inp" onchange="upd('+i+',\\'channel\\',this.value)">'+chOpt(c.channel||'Agile Guards')+'</select></td>'+
     '<td><select class="m-inp" onchange="upd('+i+',\\'nature\\',this.value)">'+natureOpt(c.nature)+'</select></td>'+
     '<td><input class="m-inp" value="'+a(c.description)+'" oninput="upd('+i+',\\'description\\',this.value)"></td>'+
     '<td><input class="m-inp" value="'+a(c.actionTaken)+'" oninput="upd('+i+',\\'actionTaken\\',this.value)"></td>'+
     '<td class="c"><input type="checkbox" '+(c.momWithin24h?'checked':'')+' onchange="upd('+i+',\\'momWithin24h\\',this.checked)"></td>'+
     '<td><select class="m-inp '+stCls+'" onchange="upd('+i+',\\'status\\',this.value);render()">'+opt(c.status,['Open','Delayed','Closed'])+'</select></td>'+
     '<td><input class="m-inp" value="'+a(c.reportedBy)+'" oninput="upd('+i+',\\'reportedBy\\',this.value)"></td>'+
     '<td><button type="button" class="m-btn '+(act?'m-btn-green':'m-btn-navy')+'" style="padding:5px 9px;font-size:12px" onclick="toggleArchive('+i+')">'+(act?'Active':'Archived')+'</button></td>'+
     '<td><button type="button" class="m-btn m-btn-red" style="padding:5px 9px;font-size:12px" onclick="deleteRow('+i+')">Delete</button></td>';
    tb.appendChild(tr);
  });
  kpi();
}
function load(){
  el('syncMsg').textContent='Syncing Agile Guards…';
  staffApi('loadComplaints',{syncGuards:true,syncMail:false}).then(function(res){
    if(res.status===401){staffShowLogin(res.body.error);return;}
    el('syncMsg').textContent=res.status===200?'Done':'Could not load';
    if(res.status!==200)return;
    ALL=(res.body.complaints||[]).map(function(c){c.active=c.active!==false;return c;});
    render();
  }).catch(function(){el('syncMsg').textContent='Network error — try again.';});
}
function save(){
  var m=el('saveMsg');m.style.color='#4ade80';m.textContent='Saving…';
  staffApi('saveComplaints',{complaints:ALL}).then(function(res){
    if(res.status===200){
      m.textContent='✅ Saved & published!';
      if(res.body.complaints)ALL=res.body.complaints.map(function(c){c.active=c.active!==false;return c;});
      render();
    }else{m.style.color='#f87171';m.textContent=res.body.error||'Could not save';}
  });
}
function initStaffPage(){load();}
`,
}

const COMPLAINTS: StaffPage = {
  active: '/mis-staff-complaints',
  title: 'Client Complaints',
  inner: `<div class="m-wrap">
  <div class="m-card">
    <div class="hint">Guard complaints from <b>Agile Guards</b> · Client complaints from <b>mail</b> and manual entry — feeds Management Complaints report.</div>
    <div class="m-actions" style="margin-top:10px">
      <button class="m-btn m-btn-gold" onclick="load()">🔄 Refresh</button>
      <button class="m-btn m-btn-navy" onclick="addRow()">+ Add Complaint</button>
      <button class="m-btn m-btn-green" onclick="save()">💾 Save All</button>
    </div>
    <div id="msg" class="hint" style="margin-top:8px"></div>
  </div>
  <div class="m-card"><div class="mtblwrap"><table class="mtbl"><thead><tr><th>Code</th><th>Type</th><th>Client</th><th>Date</th><th>Status</th><th>Description</th><th>Action</th></tr></thead><tbody id="rows"></tbody></table></div></div>
</div>`,
  script: `
var LIST=[];
function load(){staffApi('loadComplaints',{syncGuards:true,syncMail:true}).then(function(res){
  if(res.status===401){staffShowLogin(res.body.error);return;}
  if(res.status!==200)return;
  LIST=res.body.complaints||[];render();
});}
function render(){
  var html='';
  LIST.forEach(function(c,i){
    if(c.active===false)return;
    html+='<tr><td>'+h(c.code)+'</td><td>'+h(c.type||'Client')+'</td><td><input class="m-inp" value="'+h(c.clientName)+'" onchange="LIST['+i+'].clientName=this.value"></td><td><input class="m-inp" type="date" value="'+h(c.incidentDate)+'" onchange="LIST['+i+'].incidentDate=this.value"></td><td><select class="m-inp" onchange="LIST['+i+'].status=this.value"><option'+(c.status==='Open'?' selected':'')+'>Open</option><option'+(c.status==='Closed'?' selected':'')+'>Closed</option></select></td><td><input class="m-inp" value="'+h(c.description)+'" onchange="LIST['+i+'].description=this.value"></td><td><input class="m-inp" value="'+h(c.actionTaken)+'" onchange="LIST['+i+'].actionTaken=this.value"></td></tr>';
  });
  el('rows').innerHTML=html||'<tr><td colspan="7" class="hint">No complaints.</td></tr>';
}
function addRow(){LIST.push({id:'',code:'',type:'Client',clientName:'',incidentDate:staffTodayIst(),status:'Open',description:'',actionTaken:'',active:true});render();}
function save(){staffApi('saveComplaints',{complaints:LIST}).then(function(res){el('msg').textContent=res.status===200?'Saved ✓':(res.body.error||'Failed');if(res.status===200)load();});}
function initStaffPage(){load();}
`,
}

const INCIDENTS: StaffPage = {
  active: '/mis-staff-incidents',
  title: 'Incident Reporting',
  inner: incidentReportInnerHtml(),
  script: incidentReportClientScript('staff'),
}

const SITES: StaffPage = {
  active: '/mis-staff-sites',
  title: 'Master Directory',
  inner: `<div class="m-wrap">
  <div class="m-card"><div class="hint">Your branch Master Directory — <b>A–Z order</b>. Add, edit, deactivate, or search company clients. <b>Every change asks for RECONFIRM</b> so Daily MIS is not disturbed by accident. Director is emailed on every change.</div><div class="m-kgrid" id="kpis"><div class="hint" id="sitesLoad">Loading sites…</div></div></div>
  <div class="m-card">
    <h4 style="color:#fde68a;margin-bottom:10px">🔍 Search company clients (all branches)</h4>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">
      <div style="flex:1;min-width:200px"><label class="m-lbl">Client / site name</label><input class="m-inp" id="searchQ" placeholder="Type at least 2 letters" onkeydown="if(event.key==='Enter')searchCompany()"></div>
      <button class="m-btn m-btn-navy" onclick="searchCompany()">Search</button>
    </div>
    <div id="searchMsg" class="hint" style="margin-top:8px"></div>
    <div class="mtblwrap" style="margin-top:10px"><table class="mtbl"><thead><tr><th>Branch</th><th>Client</th><th>Site</th><th class="c">A</th><th class="c">G</th><th class="c">B</th><th class="c">C</th><th>Action</th></tr></thead><tbody id="searchRows"><tr><td colspan="8" class="hint">Search to find a client from any branch master.</td></tr></tbody></table></div>
  </div>
  <div class="m-card">
    <h4 style="color:#fde68a;margin-bottom:10px">+ Add New Site</h4>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">
      <div><label class="m-lbl">Client Name *</label><input class="m-inp" id="addName"></div>
      <div><label class="m-lbl">Site / Location</label><input class="m-inp" id="addLoc"></div>
      <div><label class="m-lbl">Staff Incharge</label><input class="m-inp" id="addStaff"></div>
      <div><label class="m-lbl">Client email (Client door)</label><input class="m-inp" id="addEmail" type="email" placeholder="client@…" autocomplete="email"></div>
      <div><label class="m-lbl">San A</label><input class="m-inp" id="addA" inputmode="numeric" value="0"></div>
      <div><label class="m-lbl">San G</label><input class="m-inp" id="addG" inputmode="numeric" value="0"></div>
      <div><label class="m-lbl">San B</label><input class="m-inp" id="addB" inputmode="numeric" value="0"></div>
      <div><label class="m-lbl">San C</label><input class="m-inp" id="addC" inputmode="numeric" value="0"></div>
    </div>
    <button class="m-btn m-btn-gold" style="margin-top:12px" onclick="addSite()">+ Add Site</button>
    <div id="addMsg" class="hint" style="margin-top:8px"></div>
  </div>
  <div class="m-card">
    <label class="hint" style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><input type="checkbox" id="showInactive" onchange="load()"> Show inactive sites (history kept)</label>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th class="c">#</th><th>Client</th><th>Business Tier</th><th>Site</th><th>Staff</th><th class="c">A</th><th class="c">G</th><th class="c">B</th><th class="c">C</th><th>Status</th><th>Actions</th></tr></thead><tbody id="rows"></tbody></table></div>
  </div>
  <div id="siteModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;align-items:center;justify-content:center;padding:16px">
    <div class="m-card" style="max-width:520px;width:100%;max-height:90vh;overflow:auto">
      <h4 id="siteModalTitle" style="color:#fde68a;margin:0 0 12px">Edit Site</h4>
      <input type="hidden" id="editId">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">
        <div><label class="m-lbl">Client Name *</label><input class="m-inp" id="editName"></div>
        <div><label class="m-lbl">Site / Location</label><input class="m-inp" id="editLoc"></div>
        <div><label class="m-lbl">Staff Incharge</label><input class="m-inp" id="editStaff"></div>
        <div><label class="m-lbl">Client email (Client door)</label><input class="m-inp" id="editEmail" type="email" placeholder="client@…" autocomplete="email"></div>
        <div><label class="m-lbl">San A</label><input class="m-inp" id="editA" inputmode="numeric"></div>
        <div><label class="m-lbl">San G</label><input class="m-inp" id="editG" inputmode="numeric"></div>
        <div><label class="m-lbl">San B</label><input class="m-inp" id="editB" inputmode="numeric"></div>
        <div><label class="m-lbl">San C</label><input class="m-inp" id="editC" inputmode="numeric"></div>
      </div>
      <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="m-btn m-btn-green" onclick="saveEditSite()">💾 Save</button>
        <button class="m-btn m-btn-navy" onclick="closeSiteModal()">Cancel</button>
      </div>
      <div id="editMsg" class="hint" style="margin-top:8px"></div>
    </div>
  </div>
</div>`,
  script: `
var SITE_LIST=[];
var SEARCH_HITS=[];
function load(){
  var ld=el('sitesLoad');if(ld)ld.textContent='Loading sites…';
  el('rows').innerHTML='<tr><td colspan="11" class="hint">Loading…</td></tr>';
  staffApi('sites',{showInactive:el('showInactive')&&el('showInactive').checked}).then(function(res){
  if(res.status===401){staffShowLogin(res.body.error);return;}
  if(res.status!==200){if(ld)ld.textContent='Could not load — refresh page.';el('rows').innerHTML='<tr><td colspan="11" class="hint">Could not load sites.</td></tr>';return;}
  if(ld)ld.textContent='';
  SITE_LIST=res.body.sites||[];
  el('kpis').innerHTML='<div class="m-kpi o"><b>'+(res.body.siteCount||0)+'</b><span>Active Sites</span></div><div class="m-kpi s"><b>'+(res.body.clientNameCount||0)+'</b><span>Clients</span></div>'+(res.body.inactiveCount?'<div class="m-kpi p"><b>'+res.body.inactiveCount+'</b><span>Inactive</span></div>':'');
  el('rows').innerHTML=SITE_LIST.map(function(c,i){
    var act=c.active!==false;
    var btn=act?'<button class="m-btn m-btn-navy" style="padding:4px 8px;font-size:12px" onclick="toggleSite(\\''+c.id+'\\',false)">Deactivate</button>':'<button class="m-btn m-btn-green" style="padding:4px 8px;font-size:12px" onclick="toggleSite(\\''+c.id+'\\',true)">Activate</button>';
    return '<tr'+(act?'':' style="opacity:.55"')+'><td class="c">'+(i+1)+'</td><td>'+h(c.name)+'</td><td style="color:#fde68a;font-weight:700;white-space:nowrap">'+h(c.businessTierLabel||c.businessTier||'—')+'</td><td>'+h(c.location)+'</td><td>'+h(c.staffName)+'</td><td class="c">'+(c.sanA||0)+'</td><td class="c">'+(c.sanG||0)+'</td><td class="c">'+(c.sanB||0)+'</td><td class="c">'+(c.sanC||0)+'</td><td class="c" style="color:'+(act?'#4ade80':'#f87171')+'">'+(act?'Active':'Inactive')+'</td><td style="white-space:nowrap"><button class="m-btn m-btn-gold" style="padding:4px 8px;font-size:12px;margin-right:4px" onclick="openEditSite(\\''+c.id+'\\')">Edit</button>'+btn+'</td></tr>';
  }).join('')||'<tr><td colspan="11" class="hint">No sites.</td></tr>';
});}
function searchCompany(){
  var q=(el('searchQ').value||'').trim();
  if(q.length<2){el('searchMsg').textContent='Type at least 2 letters.';return;}
  el('searchMsg').textContent='Searching…';
  el('searchRows').innerHTML='<tr><td colspan="8" class="hint">Searching…</td></tr>';
  staffApi('searchCompanyClients',{q:q}).then(function(res){
    if(res.status===401){staffShowLogin(res.body.error);return;}
    if(res.status!==200){el('searchMsg').textContent=res.body.error||'Search failed.';return;}
    SEARCH_HITS=res.body.results||[];
    el('searchMsg').textContent=(SEARCH_HITS.length?('Found '+SEARCH_HITS.length+' site(s).'):'No matches.')+' Add a hit to your branch with its sanctioned strength.';
    el('searchRows').innerHTML=SEARCH_HITS.map(function(c,i){
      var act=c.alreadyOnMyBranch
        ?'<span class="hint">Already on my branch</span>'
        :'<button class="m-btn m-btn-gold" style="padding:4px 8px;font-size:12px" onclick="addFromSearch('+i+')">Add to my branch</button>';
      return '<tr><td>'+h(c.branchName)+'</td><td>'+h(c.name)+'</td><td>'+h(c.location)+'</td><td class="c">'+(c.sanA||0)+'</td><td class="c">'+(c.sanG||0)+'</td><td class="c">'+(c.sanB||0)+'</td><td class="c">'+(c.sanC||0)+'</td><td>'+act+'</td></tr>';
    }).join('')||'<tr><td colspan="8" class="hint">No matches.</td></tr>';
  });
}
function addFromSearch(i){
  var c=SEARCH_HITS[i];
  if(!c)return;
  if(!confirm('Add “'+c.name+'” ('+(c.location||'—')+') to your branch Master Directory with SAN A'+(c.sanA||0)+'/G'+(c.sanG||0)+'/B'+(c.sanB||0)+'/C'+(c.sanC||0)+'?'))return;
  if(!confirm('RECONFIRM: Change your branch client list? This affects Daily MIS. Tap OK only if intentional.'))return;
  el('searchMsg').textContent='Adding…';
  staffApi('addFromMaster',{confirmed:true,sourceId:c.id,site:{name:c.name,location:c.location,staffName:c.staffName,clientEmail:c.clientEmail,sanA:c.sanA,sanG:c.sanG,sanB:c.sanB,sanC:c.sanC}}).then(function(res){
    if(res.status===200){el('searchMsg').textContent='Added to your branch ✓';load();searchCompany();}
    else el('searchMsg').textContent=res.body.error||'Could not add.';
  });
}
function openEditSite(id){
  var c=SITE_LIST.find(function(x){return x.id===id;});
  if(!c)return;
  el('siteModalTitle').textContent='Edit Site';
  el('editId').value=c.id;
  el('editName').value=c.name||'';
  el('editLoc').value=c.location||'';
  el('editStaff').value=c.staffName||'';
  el('editEmail').value=c.clientEmail||'';
  el('editA').value=c.sanA||0;
  el('editG').value=c.sanG||0;
  el('editB').value=c.sanB||0;
  el('editC').value=c.sanC||0;
  el('editMsg').textContent='';
  el('siteModal').style.display='flex';
}
function closeSiteModal(){el('siteModal').style.display='none';}
function saveEditSite(){
  var name=(el('editName').value||'').trim();
  if(!name){el('editMsg').textContent='Please enter client name.';return;}
  if(!confirm('RECONFIRM: Save changes to Master Directory? This affects Daily MIS. Tap OK only if intentional.'))return;
  el('editMsg').textContent='Saving…';
  staffApi('saveSite',{confirmed:true,site:{id:el('editId').value,name:name,location:el('editLoc').value,staffName:el('editStaff').value,clientEmail:el('editEmail').value,sanA:el('editA').value,sanG:el('editG').value,sanB:el('editB').value,sanC:el('editC').value}}).then(function(res){
    if(res.status===200){closeSiteModal();load();}
    else el('editMsg').textContent=res.body.error||'Could not save.';
  });
}
function toggleSite(id,active){
  var label=active?'activate':'deactivate';
  if(!confirm('Are you sure you want to '+label+' this site? Deactivate keeps the row in history.'))return;
  if(!confirm('RECONFIRM: Change your branch client list? This affects Daily MIS. Tap OK only if intentional.'))return;
  staffApi('toggleSite',{confirmed:true,clientId:id,active:active}).then(function(res){
    if(res.status===200)load();
    else alert(res.body.error||'Could not update.');
  });
}
function addSite(){
  var name=(el('addName').value||'').trim();
  if(!name){el('addMsg').textContent='Please enter client name.';return;}
  if(!confirm('RECONFIRM: Add this site to Master Directory? This affects Daily MIS. Tap OK only if intentional.'))return;
  el('addMsg').textContent='Adding…';
  staffApi('addSite',{confirmed:true,site:{name:name,location:el('addLoc').value,staffName:el('addStaff').value,clientEmail:el('addEmail').value,sanA:el('addA').value,sanG:el('addG').value,sanB:el('addB').value,sanC:el('addC').value}}).then(function(res){
    if(res.status===200){
      el('addMsg').textContent='Site added ✓';
      ['addName','addLoc','addStaff','addEmail'].forEach(function(id){if(el(id))el(id).value='';});
      ['addA','addG','addB','addC'].forEach(function(id){if(el(id))el(id).value='0';});
      load();
    }else el('addMsg').textContent=res.body.error||'Could not add.';
  });
}
function initStaffPage(){load();}
`,
}

const MANUAL: StaffPage = {
  active: '/mis-staff-manual',
  title: 'User Manual',
  inner: `<div class="m-wrap"><div class="m-card">
    <h3>HOD / Staff Portal</h3>
    <ol style="margin:12px 0 0 18px;line-height:1.7;color:#cbd5e1">
      <li><b>Dashboard</b> — same sections as Management, for your branch.</li>
      <li><b>Daily MIS Submission</b> — submit deployment, summary, collection every day.</li>
      <li><b>Client Visits / Patrol &amp; Duty</b> — sync from Agile Mobile.</li>
      <li><b>Compliance / Collection / Complaints</b> — your data feeds Management reports.</li>
    </ol>
    <div class="m-actions" style="margin-top:16px"><a class="m-btn m-btn-gold" href="/mis-manual" target="_blank">📖 Full User Manual</a></div>
  </div></div>`,
  script: `function initStaffPage(){}`,
}

const HELP: StaffPage = {
  active: '/mis-staff-help',
  title: 'Troubleshooting',
  inner: `<div class="m-wrap"><div class="m-card">
    <h3>Common Fixes</h3>
    <p style="color:#cbd5e1;line-height:1.65;margin-top:10px"><b>Sign in?</b> Branch password from WhatsApp.<br><b>No sites?</b> Master Directory or + Add Site in Daily MIS.<br><b>Mobile NA?</b> Sync on Client Visits / Patrol pages.<br><b>Management not seeing data?</b> Submit Daily MIS for today's date.</p>
    <div class="m-actions" style="margin-top:16px"><a class="m-btn m-btn-gold" href="/mis-troubleshooting" target="_blank">🔧 Full Booklet</a></div>
  </div></div>`,
  script: `function initStaffPage(){}`,
}

const PAGES: Record<string, StaffPage> = {
  dashboard: DASHBOARD,
  daily: DAILY,
  'daily-deploy': DAILY_DEPLOY,
  'daily-shortage': DAILY_SHORTAGE,
  'daily-summary': DAILY_SUMMARY,
  'daily-submit': DAILY_SUBMIT,
  board: BOARD,
  md: MD,
  bpi: BPI,
  client: CLIENT,
  visits: VISITS,
  duty: DUTY,
  'unit-issue': UNIT,
  collection: COLLECTION,
  register: REGISTER,
  complaints: COMPLAINTS,
  incidents: INCIDENTS,
  sites: SITES,
  manual: MANUAL,
  help: HELP,
  late: DUTY,
  out: DUTY,
  hr: BOARD,
  'guard-complaints': COMPLAINTS,
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = req.query || {}
  if (String(q.hdfcPublic || '') === '1' || String(q.page || '') === 'hdfc-public') {
    const { default: hdfcPublic } = await import('./hdfc-survey-public.js')
    return hdfcPublic(req, res)
  }
  const page = String(req.query.page ?? req.query.Page ?? 'dashboard').trim() || 'dashboard'
  if (page === 'board' || page === 'md' || page === 'users') {
    res.writeHead(302, { Location: '/mis-staff' })
    res.end()
    return
  }
  const def = PAGES[page] ?? DASHBOARD
  const boot = await hodBootFromRequest(req)
  const branchHtml = await loadBranchLoginOptionsHtml('mis-report')
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(shell(def, hodBootScriptJson(boot), branchHtml))
}

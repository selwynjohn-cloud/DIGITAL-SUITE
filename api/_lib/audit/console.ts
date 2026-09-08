/**
 * Agile HR Audit — Staff + Management SPA.
 * Strategic clients · Monthly (defined day, e.g. KRC) / Quarterly (e.g. HDFC)
 * Statutory pack: PF, ESIC, wages… · Checklist points · Pending issue closure.
 */

import type { VercelRequest } from '@vercel/node'
import { hodLoginHtml, otpLoginHtml, otpLoginScript } from '../embedded-otp.js'
import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../suite-tap-feedback.js'
import { suiteDateInputInitScript } from '../suite-date-input.js'

function portalFromReq(req: VercelRequest): 'staff' | 'management' {
  return String(req.query?.portal || '').toLowerCase() === 'management' ? 'management' : 'staff'
}

export function renderAuditConsole(req: VercelRequest): string {
  const portal = portalFromReq(req)
  const isMgmt = portal === 'management'
  const title = isMgmt ? 'Agile HR Audit — Management' : 'Agile HR Audit — HOD / Staff'
  const login = isMgmt
    ? otpLoginHtml(title, 'Management — email PIN (all branches HR audit overview)')
    : hodLoginHtml(title, 'HOD / Staff — select branch + branch password, or email PIN')
  const otp = otpLoginScript('audit', 'Agile HR Audit', portal)
  const accent = '#be185d'

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<script>(function(){try{if(sessionStorage.getItem('otp_audit')||localStorage.getItem('otp_audit'))document.documentElement.className+=' hra-authed';}catch(e){}})();</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}
body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:14px}
html.hra-authed #login{display:none!important}html.hra-authed #shell{display:flex!important}
#login{max-width:420px;margin:0 auto;padding-top:8vh}
.card{background:#111a30;border:1px solid #22304f;border-radius:14px;padding:18px;margin-bottom:14px}
.card h3{color:#fff;margin-bottom:8px}
input,select,textarea{width:100%;padding:9px 11px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:14px}
label{display:block;font-size:12px;color:#94a3b8;margin:8px 0 3px;font-weight:700}
.btn{padding:10px 16px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:13px;background:${accent};color:#fff;margin:4px 4px 4px 0}
.btn:disabled{opacity:.6}.grey{background:#334155;color:#e2e8f0}.green{background:#16a34a;color:#fff}.amb{background:#d97706;color:#fff}
#shell{display:none;min-height:100vh;width:100%}
.side{position:fixed;top:0;left:0;bottom:0;width:250px;background:#0e1730;border-right:1px solid #22304f;display:flex;flex-direction:column;overflow-y:auto;z-index:40}
.brand{padding:16px;text-align:center;border-bottom:1px solid #22304f}
.brand img{height:46px}.brand b{display:block;color:#fff;font-size:14px;margin-top:8px}
.brand small{color:#f9a8d4;font-size:11px;font-weight:700}
.menu{padding:8px;flex:1}
.mi{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:9px;color:#cbd5e1;cursor:pointer;font-weight:600;font-size:13px;margin-bottom:2px;border:none;background:transparent;width:100%;text-align:left}
.mi:hover{background:#16223f}.mi.active{background:${accent};color:#fff}
.sidefoot{padding:12px 14px;border-top:1px solid #22304f}
.main{margin-left:250px;min-height:100vh;display:flex;flex-direction:column;width:calc(100% - 250px)}
.bar{background:#111a30;border-bottom:1px solid #22304f;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;position:sticky;top:0;z-index:30}
.bar b{color:#fff;font-size:16px}.content{padding:16px;flex:1;max-width:1100px;width:100%}
.burger{display:none;background:${accent};color:#fff;border:none;border-radius:8px;padding:8px 12px;font-weight:800}
@media(max-width:820px){.side{transform:translateX(-100%);transition:.2s}.side.open{transform:none}.main{margin-left:0;width:100%}.burger{display:inline-block}}
.kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:10px 0}
.kpi{background:#0e1730;border:1px solid #22304f;border-radius:10px;padding:12px;text-align:center}
.kpi b{display:block;font-size:20px;color:#f9a8d4}.kpi.bad b{color:#fca5a5}.kpi span{font-size:11px;color:#94a3b8;font-weight:700}
.tblwrap{overflow-x:auto;border:1px solid #22304f;border-radius:8px;margin-top:10px}
table{border-collapse:collapse;width:100%;font-size:12px;min-width:640px}
th,td{border:1px solid #22304f;padding:7px 8px;text-align:left;vertical-align:top}
th{background:#0b1220;color:#94a3b8;font-size:10px;text-transform:uppercase}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
@media(max-width:720px){.row2,.row3{grid-template-columns:1fr}}
.muted{color:#94a3b8;font-size:12px;line-height:1.45}
.alert{padding:10px 12px;border-radius:8px;margin-bottom:8px;font-size:13px;border-left:4px solid}
.alert.critical{background:#3a0a0a;border-color:#ef4444;color:#fca5a5}
.alert.warn{background:#451a03;border-color:#f59e0b;color:#fcd34d}
.alert.info{background:#4a044e;border-color:#ec4899;color:#fbcfe8}
.toast{position:fixed;bottom:18px;right:18px;background:#166534;color:#fff;padding:10px 14px;border-radius:8px;font-weight:700;display:none;z-index:99}
.toast.bad{background:#991b1b}
.portal-tag{display:inline-block;padding:3px 10px;border-radius:999px;background:rgba(190,24,93,.25);border:1px solid ${accent};color:#fbcfe8;font-size:11px;font-weight:800;margin-left:8px}
.tag{display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:800}
.tag.m{background:#831843;color:#fce7f3}.tag.q{background:#1e3a5f;color:#93c5fd}
.doc-row{display:grid;grid-template-columns:1.2fr 100px 1fr 1fr;gap:8px;margin-bottom:8px;align-items:end}
@media(max-width:720px){.doc-row{grid-template-columns:1fr}}
.cp-row{display:grid;grid-template-columns:1fr 140px;gap:8px;margin-bottom:8px;align-items:start}
${SUITE_TAP_FEEDBACK_CSS}
</style></head><body>
${login}
<div id="shell">
  <aside class="side" id="side">
    <div class="brand">
      <img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile">
      <b>Agile HR Audit</b>
      <small>${isMgmt ? 'Management Portal' : 'HOD / Staff Portal'}</small>
    </div>
    <div class="menu" id="menu"></div>
    <div class="sidefoot">
      <button type="button" class="btn grey app-tap-btn" style="width:100%" onclick="switchPortal()">${isMgmt ? 'Open Staff portal' : 'Open Management portal'}</button>
      <button type="button" class="btn grey app-tap-btn" style="width:100%" onclick="logout()">Sign out</button>
    </div>
  </aside>
  <div class="main">
    <div class="bar">
      <div>
        <button type="button" class="burger app-tap-btn" onclick="el('side').classList.toggle('open')">Menu</button>
        <b id="ttl">Dashboard</b>
        <span class="portal-tag">${isMgmt ? 'Management' : 'Staff'}</span>
        <div class="muted" id="who"></div>
      </div>
    </div>
    <div class="content" id="content"></div>
  </div>
</div>
<div class="toast" id="toast"></div>
<script>
${otp}
${suiteTapFeedbackInitScript()}
${suiteDateInputInitScript()}
var API='/api/audit/data';
var PORTAL=${JSON.stringify(portal)};
var IS_MGMT=${isMgmt ? 'true' : 'false'};
var CTX={email:'',name:'',branches:[],clients:[],strategic:[],branchId:'',defaultChecklist:[],defaultDocuments:[],sampleFormats:[]};
var VIEW='dashboard';
var PROFILES=[],AUDITS=[],ISSUES=[];
var EDIT_AUDIT=null;

function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function toast(msg,ok){var t=el('toast');if(!t)return;t.textContent=msg;t.className='toast'+(ok===false?' bad':'');t.style.display='block';setTimeout(function(){t.style.display='none';},2800);}
function api(action,extra){
  if(typeof otpRestoreSession==='function')otpRestoreSession();
  return fetch(API,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,portal:PORTAL,branchId:CTX.branchId||OTP_BRANCH_ID||''},extra||{}))
  }).then(function(r){return r.json().then(function(j){if(r.status===401&&typeof otpHandleUnauthorized==='function')otpHandleUnauthorized();return{s:r.status,j:j};});});
}
function logout(){if(typeof otpLogout==='function')otpLogout();else location.reload();}
function switchPortal(){location.href='/audit/?portal='+(PORTAL==='management'?'staff':'management');}

function menuItems(){
  return [
    {id:'dashboard',label:'Dashboard',icon:'▣'},
    {id:'clients',label:'Apex Clients',icon:'★'},
    {id:'audits',label:'Audits',icon:'📑'},
    {id:'formats',label:'Sample Formats',icon:'📎'},
    {id:'issues',label:'Pending Issues',icon:'⚠'},
    {id:'reminders',label:'Reminders',icon:'⏰'}
  ];
}
function setNav(){
  el('menu').innerHTML=menuItems().map(function(it){
    return '<button type="button" class="mi app-tap-btn'+(VIEW===it.id?' active':'')+'" onclick="nav(\\''+it.id+'\\')"><span>'+it.icon+'</span>'+h(it.label)+'</button>';
  }).join('');
}
function nav(id){
  VIEW=id;try{el('side').classList.remove('open');}catch(e){}
  setNav();
  if(id==='dashboard')renderDashboard();
  else if(id==='clients')renderClients();
  else if(id==='audits')renderAudits();
  else if(id==='formats')renderFormats();
  else if(id==='issues')renderIssues();
  else if(id==='reminders')renderReminders();
}
function branchOpts(sel){
  return '<option value="">— Branch —</option>'+(CTX.branches||[]).map(function(b){
    return '<option value="'+h(b.id)+'"'+(sel===b.id?' selected':'')+'>'+h(b.name)+'</option>';
  }).join('');
}
function clientOpts(sel, strategicOnly){
  var list=strategicOnly?(CTX.strategic||[]):(CTX.clients||[]);
  return '<option value="">— Client —</option>'+list.map(function(c){
    return '<option value="'+h(c.id)+'" data-name="'+h(c.name)+'" data-branch="'+h(c.branchId)+'"'+(sel===c.id?' selected':'')+'>'+h(c.name)+(c.isStrategic?' ★':'')+'</option>';
  }).join('');
}
function cadenceTag(c){
  return c==='Monthly'?'<span class="tag m">Monthly SLA</span>':'<span class="tag q">Quarterly</span>';
}
function alertsHtml(rows){
  if(!rows||!rows.length)return '<p class="muted">No reminders right now.</p>';
  return rows.map(function(a){
    return '<div class="alert '+h(a.severity)+'"><b>'+h(a.title)+'</b> · '+h(a.branchName)+(a.clientName?' · '+h(a.clientName):'')+'<br>'+
      h(a.actionRequired)+'<br><span class="muted">Due '+h(a.dueDate)+'</span></div>';
  }).join('');
}

function renderDashboard(){
  el('ttl').textContent=IS_MGMT?'India HR Audit Dashboard':'Branch HR Audit Dashboard';
  el('content').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  api('dashboard',{}).then(function(res){
    if(res.s!==200){el('content').innerHTML='<div class="card">'+h(res.j.error||'Error')+'</div>';return;}
    var k=res.j.kpis||{};
    el('content').innerHTML='<div class="card"><h3>At a glance</h3>'+
      '<p class="muted">HR audit for <b>strategic clients</b>. Example: <b>KRC</b> monthly on a fixed day · <b>HDFC</b> quarterly. Submit PF, ESIC, wages and other statutory documents. Close pending issues.</p>'+
      '<div class="kgrid">'+
      '<div class="kpi"><b>'+k.profiles+'</b><span>Strategic audit clients</span></div>'+
      '<div class="kpi"><b>'+k.monthly+'</b><span>Monthly (e.g. KRC)</span></div>'+
      '<div class="kpi"><b>'+k.quarterly+'</b><span>Quarterly (e.g. HDFC)</span></div>'+
      '<div class="kpi"><b>'+k.plannedAudits+'</b><span>Audits in progress</span></div>'+
      '<div class="kpi bad"><b>'+k.openIssues+'</b><span>Open issues</span></div>'+
      '<div class="kpi bad"><b>'+k.dueSoon+'</b><span>Due ≤14 days</span></div></div></div>'+
      '<div class="card"><h3>Reminders</h3>'+alertsHtml(res.j.alerts||[])+'</div>'+
      '<div class="card"><button type="button" class="btn green" onclick="nav(\\''+'clients'+'\\')">Set up client SLA</button> '+
      '<button type="button" class="btn" onclick="nav(\\''+'audits'+'\\')">Start / edit audit</button></div>';
  });
}

function renderClients(){
  el('ttl').textContent='Strategic clients — SLA cadence';
  el('content').innerHTML='<div class="card"><button type="button" class="btn" onclick="loadProfiles()">Refresh</button> '+
    '<button type="button" class="btn green" onclick="editProfile()">Add client SLA</button>'+
    '<p class="muted" style="margin-top:8px">Monthly = fixed day each month (e.g. KRC). Quarterly = every 3 months (e.g. HDFC). Only strategic clients normally.</p></div><div id="prOut"></div>';
  loadProfiles();
}
function loadProfiles(){
  api('listProfiles',{}).then(function(res){
    PROFILES=res.j.profiles||[];
    el('prOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Client</th><th>Code</th><th>Branch</th><th>Cadence</th><th>SLA day</th><th>Next audit</th><th></th></tr></thead><tbody>'+
      PROFILES.map(function(p,i){
        return '<tr><td>'+h(p.clientName)+'</td><td>'+h(p.clientCode||'—')+'</td><td>'+h(p.branchName)+'</td><td>'+cadenceTag(p.cadence)+'</td>'+
          '<td>'+(p.cadence==='Monthly'?('Day '+p.slaDay):'—')+'</td><td>'+h(p.nextAuditDate)+'</td>'+
          '<td><button type="button" class="btn grey" onclick="editProfile('+i+')">Edit</button> '+
          '<button type="button" class="btn green" onclick="startAuditFromProfile('+i+')">Start audit</button></td></tr>';
      }).join('')+'</tbody></table></div></div>';
  });
}
function editProfile(i){
  var p=typeof i==='number'?PROFILES[i]:null;
  el('content').innerHTML='<div class="card"><h3>'+(p?'Edit':'Add')+' strategic client SLA</h3>'+
    '<input type="hidden" id="pId" value="'+h(p&&p.id||'')+'">'+
    '<div class="row2"><div><label>Strategic client</label><select id="pClient" onchange="onProfileClient()">'+clientOpts(p&&p.clientId||'',true)+'</select></div>'+
    '<div><label>Client name</label><input id="pClientName" value="'+h(p&&p.clientName||'')+'"></div></div>'+
    '<div class="row3"><div><label>Branch</label><select id="pBr">'+branchOpts(p&&p.branchId||CTX.branchId||'')+'</select></div>'+
    '<div><label>Short code (e.g. KRC / HDFC)</label><input id="pCode" value="'+h(p&&p.clientCode||'')+'"></div>'+
    '<div><label>Cadence</label><select id="pCad" onchange="toggleSlaDay()"><option value="Monthly">Monthly (defined day)</option><option value="Quarterly">Quarterly</option></select></div></div>'+
    '<div class="row3"><div id="slaDayWrap"><label>SLA / audit day of month (1–28)</label><input type="number" min="1" max="28" id="pSlaDay" value="'+(p&&p.slaDay||10)+'"></div>'+
    '<div><label>Next audit date</label><input type="date" id="pNext" value="'+h(p&&p.nextAuditDate||'')+'"></div>'+
    '<div><label>Responsible officer</label><input id="pOff" value="'+h(p&&p.responsibleOfficer||CTX.name||'')+'"></div></div>'+
    '<label>Notes</label><textarea id="pNotes" rows="2">'+h(p&&p.notes||'')+'</textarea>'+
    '<button type="button" class="btn green" onclick="saveProfile()">Save</button> '+
    '<button type="button" class="btn grey" onclick="nav(\\''+'clients'+'\\')">Cancel</button></div>';
  if(p)el('pCad').value=p.cadence||'Monthly';
  toggleSlaDay();
}
function toggleSlaDay(){
  var wrap=el('slaDayWrap');if(!wrap)return;
  wrap.style.display=el('pCad').value==='Monthly'?'block':'none';
}
function onProfileClient(){
  var sel=el('pClient');if(!sel||!sel.value)return;
  var opt=sel.selectedOptions[0];
  if(opt&&opt.getAttribute('data-name'))el('pClientName').value=opt.getAttribute('data-name');
  var bid=opt&&opt.getAttribute('data-branch');
  if(bid&&el('pBr'))el('pBr').value=bid;
}
function saveProfile(){
  var b=el('pBr');var bn=b&&b.selectedOptions[0]?b.selectedOptions[0].text:'';if(bn==='— Branch —')bn='';
  if(!el('pClientName').value){toast('Client name is required',false);return;}
  api('saveProfile',{
    id:el('pId').value,clientId:el('pClient').value,clientName:el('pClientName').value,
    branchId:b.value,branchName:bn,clientCode:el('pCode').value,cadence:el('pCad').value,
    slaDay:el('pSlaDay').value,nextAuditDate:el('pNext').value,responsibleOfficer:el('pOff').value,
    notes:el('pNotes').value,active:true
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Client SLA saved',true);nav('clients');
  });
}
function startAuditFromProfile(i){
  var p=PROFILES[i];if(!p)return;
  EDIT_AUDIT={
    profileId:p.id,clientId:p.clientId,clientName:p.clientName,clientCode:p.clientCode,
    branchId:p.branchId,branchName:p.branchName,cadence:p.cadence,
    auditDate:p.nextAuditDate||'',status:'Planned',
    checklist:JSON.parse(JSON.stringify(CTX.defaultChecklist||[])),
    documents:JSON.parse(JSON.stringify(CTX.defaultDocuments||[]))
  };
  editAudit();
}

function renderAudits(){
  el('ttl').textContent='HR audits — documents & checklist';
  el('content').innerHTML='<div class="card"><div class="row2"><div><label>Search</label><input id="aQ"></div>'+
    '<div style="align-self:end"><button type="button" class="btn" onclick="loadAudits()">Search</button> '+
    '<button type="button" class="btn green" onclick="EDIT_AUDIT=null;editAudit()">New audit</button></div></div>'+
    '<p class="muted" style="margin-top:8px">On audit date submit supporting documents: <b>Wage Register (Form B / XVII)</b>, <b>Muster Roll (Form D / XVI)</b>, <b>PF</b>, <b>ESIC</b>, and related statutory files. See Sample Formats for JTH / HDFC pack layouts.</p></div><div id="auOut"></div>';
  loadAudits();
}
function loadAudits(){
  api('listAudits',{q:el('aQ')?el('aQ').value:''}).then(function(res){
    AUDITS=res.j.audits||[];
    el('auOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Date</th><th>Client</th><th>Cadence</th><th>Docs pending</th><th>Points open</th><th>Status</th><th></th></tr></thead><tbody>'+
      AUDITS.map(function(a,i){
        var pend=(a.documents||[]).filter(function(d){return d.status==='Pending'||d.status==='Rejected';}).length;
        var open=(a.checklist||[]).filter(function(c){return c.status==='Pending'||c.status==='NonCompliant';}).length;
        return '<tr><td>'+h(a.auditDate)+'</td><td>'+h(a.clientName)+(a.clientCode?' <span class="muted">('+h(a.clientCode)+')</span>':'')+'<br><span class="muted">'+h(a.branchName)+'</span></td>'+
          '<td>'+cadenceTag(a.cadence)+'</td><td>'+pend+'</td><td>'+open+'</td><td>'+h(a.status)+'</td>'+
          '<td><button type="button" class="btn grey" onclick="openAudit('+i+')">Open</button></td></tr>';
      }).join('')+'</tbody></table></div></div>';
  });
}
function openAudit(i){EDIT_AUDIT=AUDITS[i];editAudit();}
function editAudit(){
  var a=EDIT_AUDIT;
  VIEW='audits';setNav();
  el('ttl').textContent=a&&a.id?'Edit HR audit':'New HR audit';
  var docs=a&&a.documents&&a.documents.length?a.documents:(CTX.defaultDocuments||[]);
  var cps=a&&a.checklist&&a.checklist.length?a.checklist:(CTX.defaultChecklist||[]);
  el('content').innerHTML='<div class="card"><h3>'+(a&&a.id?'Edit':'New')+' HR audit pack</h3>'+
    '<input type="hidden" id="auId" value="'+h(a&&a.id||'')+'">'+
    '<input type="hidden" id="auProfileId" value="'+h(a&&a.profileId||'')+'">'+
    '<div class="row2"><div><label>Client</label><select id="auClient" onchange="onAuditClient()">'+clientOpts(a&&a.clientId||'',true)+'</select></div>'+
    '<div><label>Client name</label><input id="auClientName" value="'+h(a&&a.clientName||'')+'"></div></div>'+
    '<div class="row3"><div><label>Branch</label><select id="auBr">'+branchOpts(a&&a.branchId||CTX.branchId||'')+'</select></div>'+
    '<div><label>Code</label><input id="auCode" value="'+h(a&&a.clientCode||'')+'"></div>'+
    '<div><label>Cadence</label><select id="auCad"><option>Monthly</option><option>Quarterly</option></select></div></div>'+
    '<div class="row3"><div><label>Audit date</label><input type="date" id="auDate" value="'+h(a&&a.auditDate||'')+'"></div>'+
    '<div><label>Period from</label><input type="date" id="auFrom" value="'+h(a&&a.periodFrom||'')+'"></div>'+
    '<div><label>Period to</label><input type="date" id="auTo" value="'+h(a&&a.periodTo||'')+'"></div></div>'+
    '<div class="row2"><div><label>Status</label><select id="auSt"><option>Planned</option><option>InProgress</option><option>Submitted</option><option>Closed</option></select></div>'+
    '<div><label>Agenda / SLA notes</label><input id="auAgenda" value="'+h(a&&a.agenda||'')+'"></div></div>'+
    '<h3 style="margin-top:16px">Supporting documents</h3>'+
    '<p class="muted">Paste drive/share link for each document. Use the same layouts as your JTH pack / HDFC Form D muster / Form B wage register. Mark Submitted when ready.</p>'+
    '<div id="docBox"></div>'+
    '<h3 style="margin-top:16px">Compliance points</h3>'+
    '<div id="cpBox"></div>'+
    '<label>Minutes / auditor notes</label><textarea id="auMinutes" rows="3">'+h(a&&a.minutes||'')+'</textarea>'+
    '<button type="button" class="btn green" onclick="saveAudit()">Save audit</button> '+
    '<button type="button" class="btn amb" onclick="saveAudit(\\'Submitted\\')">Mark submitted</button> '+
    '<button type="button" class="btn grey" onclick="nav(\\''+'audits'+'\\')">Cancel</button></div>';
  if(a){el('auCad').value=a.cadence||'Monthly';el('auSt').value=a.status||'Planned';}
  renderDocEditors(docs);
  renderCpEditors(cps);
}
function renderDocEditors(docs){
  el('docBox').innerHTML=docs.map(function(d,i){
    return '<div class="doc-row" data-i="'+i+'">'+
      '<div><label>'+h(d.label)+'</label><input type="hidden" class="dKind" value="'+h(d.kind)+'"><input type="hidden" class="dLabel" value="'+h(d.label)+'">'+
      '<input class="dUrl" placeholder="Document link" value="'+h(d.fileUrl||'')+'"></div>'+
      '<div><label>Status</label><select class="dSt"><option>Pending</option><option>Submitted</option><option>Accepted</option><option>Rejected</option></select></div>'+
      '<div><label>Period label</label><input class="dPer" value="'+h(d.periodLabel||'')+'" placeholder="e.g. Jul 2026"></div>'+
      '<div><label>Remarks</label><input class="dRem" value="'+h(d.remarks||'')+'"></div></div>';
  }).join('');
  var rows=el('docBox').querySelectorAll('.doc-row');
  docs.forEach(function(d,i){var sel=rows[i].querySelector('.dSt');if(sel)sel.value=d.status||'Pending';});
}
function collectDocs(){
  return Array.prototype.map.call(el('docBox').querySelectorAll('.doc-row'),function(row){
    return {
      kind:row.querySelector('.dKind').value,
      label:row.querySelector('.dLabel').value,
      fileUrl:row.querySelector('.dUrl').value,
      status:row.querySelector('.dSt').value,
      periodLabel:row.querySelector('.dPer').value,
      remarks:row.querySelector('.dRem').value
    };
  });
}
function renderCpEditors(cps){
  el('cpBox').innerHTML=cps.map(function(c,i){
    return '<div class="cp-row" data-i="'+i+'">'+
      '<div><label>'+h(c.title)+(c.required?' *':'')+'</label><input type="hidden" class="cId" value="'+h(c.id)+'">'+
      '<input type="hidden" class="cTitle" value="'+h(c.title)+'"><input type="hidden" class="cReq" value="'+(c.required?'1':'0')+'">'+
      '<input class="cRem" placeholder="Remarks" value="'+h(c.remarks||'')+'"></div>'+
      '<div><label>Status</label><select class="cSt"><option>Pending</option><option>Compliant</option><option>NonCompliant</option><option>NA</option></select></div></div>';
  }).join('');
  var rows=el('cpBox').querySelectorAll('.cp-row');
  cps.forEach(function(c,i){var sel=rows[i].querySelector('.cSt');if(sel)sel.value=c.status||'Pending';});
}
function collectChecklist(){
  return Array.prototype.map.call(el('cpBox').querySelectorAll('.cp-row'),function(row){
    return {
      id:row.querySelector('.cId').value,
      title:row.querySelector('.cTitle').value,
      required:row.querySelector('.cReq').value==='1',
      status:row.querySelector('.cSt').value,
      remarks:row.querySelector('.cRem').value
    };
  });
}
function onAuditClient(){
  var sel=el('auClient');if(!sel||!sel.value)return;
  var opt=sel.selectedOptions[0];
  if(opt&&opt.getAttribute('data-name'))el('auClientName').value=opt.getAttribute('data-name');
  var bid=opt&&opt.getAttribute('data-branch');
  if(bid&&el('auBr'))el('auBr').value=bid;
}
function saveAudit(forceStatus){
  var b=el('auBr');var bn=b&&b.selectedOptions[0]?b.selectedOptions[0].text:'';if(bn==='— Branch —')bn='';
  if(!el('auDate').value){toast('Please pick an audit date',false);return;}
  if(!el('auClientName').value){toast('Client name is required',false);return;}
  var st=forceStatus||el('auSt').value;
  api('saveAudit',{
    id:el('auId').value,profileId:el('auProfileId').value,
    clientId:el('auClient').value,clientName:el('auClientName').value,clientCode:el('auCode').value,
    branchId:b.value,branchName:bn,cadence:el('auCad').value,auditDate:el('auDate').value,
    periodFrom:el('auFrom').value,periodTo:el('auTo').value,status:st,
    agenda:el('auAgenda').value,minutes:el('auMinutes').value,
    documents:collectDocs(),checklist:collectChecklist()
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast(st==='Submitted'?'Audit submitted':'Audit saved',true);nav('audits');
  });
}

function renderFormats(){
  el('ttl').textContent='Sample document formats';
  var rows=CTX.sampleFormats||[];
  if(!rows.length){
    el('content').innerHTML='<div class="card"><p class="muted">No sample formats loaded.</p></div>';
    return;
  }
  el('content').innerHTML='<div class="card"><h3>Formats we submit on audit date</h3>'+
    '<p class="muted">Taken from your real packs (JTH wage-register workbook, HDFC muster Form D, HDFC wages Form B). Live payroll files stay on your drive — paste links in each audit. Do not upload full employee sheets to the public site.</p></div>'+
    rows.map(function(f){
      return '<div class="card"><h3>'+h(f.title)+'</h3>'+
        '<p class="muted">'+h(f.usedFor)+'</p>'+
        '<p><b>Forms</b></p><ul class="muted">'+(f.forms||[]).map(function(x){return '<li>'+h(x)+'</li>';}).join('')+'</ul>'+
        '<p style="margin-top:8px"><b>Typical sheets</b></p><p class="muted">'+(f.sheets||[]).map(h).join(' · ')+'</p>'+
        '<p style="margin-top:8px"><b>Key columns</b></p><p class="muted">'+(f.keyColumns||[]).map(h).join(' · ')+'</p>'+
        '<p style="margin-top:8px" class="muted">'+h(f.notes)+'</p></div>';
    }).join('');
}

function renderIssues(){
  el('ttl').textContent='Pending issues — close to complete';
  el('content').innerHTML='<div class="card"><div class="row2"><div><label>Search</label><input id="iQ"></div>'+
    '<div style="align-self:end"><button type="button" class="btn" onclick="loadIssues()">Search</button> '+
    '<button type="button" class="btn green" onclick="editIssue()">Add issue</button></div></div>'+
    '<p class="muted" style="margin-top:8px">Each audit may raise points. Close them with notes when completed.</p></div><div id="isOut"></div>';
  loadIssues();
}
function loadIssues(){
  api('listIssues',{q:el('iQ')?el('iQ').value:'',status:'open'}).then(function(res){
    ISSUES=res.j.issues||[];
    el('isOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Issue</th><th>Client</th><th>Severity</th><th>Due</th><th>Owner</th><th>Status</th><th></th></tr></thead><tbody>'+
      ISSUES.map(function(x,i){
        return '<tr><td>'+h(x.title)+(x.pointRef?'<br><span class="muted">'+h(x.pointRef)+'</span>':'')+'</td>'+
          '<td>'+h(x.clientName)+'<br><span class="muted">'+h(x.branchName)+'</span></td><td>'+h(x.severity)+'</td><td>'+h(x.dueDate)+'</td>'+
          '<td>'+h(x.ownerName)+'</td><td>'+h(x.status)+'</td>'+
          '<td><button type="button" class="btn grey" onclick="editIssue('+i+')">Edit</button> '+
          '<button type="button" class="btn green" onclick="closeIssue('+i+')">Close</button></td></tr>';
      }).join('')+'</tbody></table></div></div>';
  });
}
function editIssue(i){
  var x=typeof i==='number'?ISSUES[i]:null;
  el('content').innerHTML='<div class="card"><h3>'+(x?'Edit':'Add')+' pending issue</h3>'+
    '<input type="hidden" id="isId" value="'+h(x&&x.id||'')+'">'+
    '<input type="hidden" id="isAuditId" value="'+h(x&&x.auditId||'')+'">'+
    '<label>Issue title</label><input id="isTitle" value="'+h(x&&x.title||'')+'">'+
    '<div class="row2"><div><label>Client</label><select id="isClient" onchange="onIssueClient()">'+clientOpts(x&&x.clientId||'',false)+'</select></div>'+
    '<div><label>Client name</label><input id="isClientName" value="'+h(x&&x.clientName||'')+'"></div></div>'+
    '<div class="row3"><div><label>Branch</label><select id="isBr">'+branchOpts(x&&x.branchId||CTX.branchId||'')+'</select></div>'+
    '<div><label>Due date</label><input type="date" id="isDue" value="'+h(x&&x.dueDate||'')+'"></div>'+
    '<div><label>Severity</label><select id="isSev"><option>High</option><option>Medium</option><option>Low</option></select></div></div>'+
    '<div class="row3"><div><label>Status</label><select id="isSt"><option>Open</option><option>InProgress</option><option>Closed</option></select></div>'+
    '<div><label>Point / clause ref</label><input id="isRef" value="'+h(x&&x.pointRef||'')+'"></div>'+
    '<div><label>Owner</label><input id="isOwner" value="'+h(x&&x.ownerName||CTX.name||'')+'"></div></div>'+
    '<label>Closure notes</label><textarea id="isNotes" rows="3">'+h(x&&x.closureNotes||'')+'</textarea>'+
    '<button type="button" class="btn green" onclick="saveIssue()">Save</button> '+
    '<button type="button" class="btn grey" onclick="nav(\\''+'issues'+'\\')">Cancel</button></div>';
  if(x){el('isSev').value=x.severity||'Medium';el('isSt').value=x.status||'Open';}
}
function onIssueClient(){
  var sel=el('isClient');if(!sel||!sel.value)return;
  var opt=sel.selectedOptions[0];
  if(opt&&opt.getAttribute('data-name'))el('isClientName').value=opt.getAttribute('data-name');
  var bid=opt&&opt.getAttribute('data-branch');
  if(bid&&el('isBr'))el('isBr').value=bid;
}
function saveIssue(){
  var b=el('isBr');var bn=b&&b.selectedOptions[0]?b.selectedOptions[0].text:'';if(bn==='— Branch —')bn='';
  if(!el('isTitle').value){toast('Issue title is required',false);return;}
  if(!el('isDue').value){toast('Please pick a due date',false);return;}
  api('saveIssue',{
    id:el('isId').value,auditId:el('isAuditId').value,title:el('isTitle').value,
    clientId:el('isClient').value,clientName:el('isClientName').value,
    branchId:b.value,branchName:bn,dueDate:el('isDue').value,severity:el('isSev').value,
    status:el('isSt').value,pointRef:el('isRef').value,ownerName:el('isOwner').value,
    closureNotes:el('isNotes').value
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Issue saved',true);nav('issues');
  });
}
function closeIssue(i){
  var x=ISSUES[i];if(!x)return;
  api('saveIssue',Object.assign({},x,{status:'Closed',closureNotes:(x.closureNotes||'')+(x.closureNotes?' ':'')+'Closed'})).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Issue closed',true);loadIssues();
  });
}

function renderReminders(){
  el('ttl').textContent='HR audit reminders';
  el('content').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  api('alerts',{}).then(function(res){
    el('content').innerHTML='<div class="card"><h3>All reminders</h3>'+
      '<p class="muted">SLA audit dates (14/7/3/1 days), pending documents, open issues. Daily mail to Director.</p>'+
      alertsHtml(res.j.alerts||[])+'</div>';
  });
}

function onOtpLogin(){
  document.documentElement.classList.add('hra-authed');
  if(el('login'))el('login').style.display='none';
  if(el('shell'))el('shell').style.display='flex';
  bootApp();
}
function bootApp(){
  if(typeof otpRestoreSession==='function')otpRestoreSession();
  if(!OTP_SESSION){if(el('shell'))el('shell').style.display='none';return;}
  api('bootstrap',{}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Not authorised',false);if(typeof otpHandleUnauthorized==='function')otpHandleUnauthorized();return;}
    CTX.email=res.j.email;CTX.name=res.j.name;CTX.branches=res.j.branches||[];
    CTX.clients=res.j.clients||[];CTX.strategic=res.j.strategicClients||[];
    CTX.defaultChecklist=res.j.defaultChecklist||[];CTX.defaultDocuments=res.j.defaultDocuments||[];
    CTX.sampleFormats=res.j.sampleFormats||[];
    CTX.branchId=res.j.branchId||OTP_BRANCH_ID||'';
    el('who').textContent=(CTX.name||CTX.email);
    setNav();renderDashboard();
  });
}
(function boot(){
  try{if(typeof otpRestoreSession==='function'&&otpRestoreSession()&&OTP_SESSION){onOtpLogin();return;}}catch(e){}
  try{
    var m=String(location.hash||'').match(/[#&]otp=([^&]+)/);
    if(m&&m[1]){
      OTP_SESSION=decodeURIComponent(m[1]);
      if(typeof otpStoreSession==='function')otpStoreSession(OTP_SESSION,'','','');
      try{history.replaceState(null,'',location.pathname+location.search);}catch(e2){}
      onOtpLogin();
    }
  }catch(e){}
})();
</script>
</body></html>`
}

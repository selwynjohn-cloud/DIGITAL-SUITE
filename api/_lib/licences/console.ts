/**
 * Agile Licenses — Staff + Management SPA (left menu, date pickers).
 */

import type { VercelRequest } from '@vercel/node'
import { hodLoginHtml, otpLoginHtml, otpLoginScript } from '../embedded-otp.js'
import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../suite-tap-feedback.js'
import { suiteDateInputInitScript } from '../suite-date-input.js'

function portalFromReq(req: VercelRequest): 'staff' | 'management' {
  return String(req.query?.portal || '').toLowerCase() === 'management' ? 'management' : 'staff'
}

export function renderLicencesConsole(req: VercelRequest): string {
  const portal = portalFromReq(req)
  const isMgmt = portal === 'management'
  const title = isMgmt ? 'Agile Licenses — Management' : 'Agile Licenses — HOD / Staff'
  const login = isMgmt
    ? otpLoginHtml(title, 'Management — email PIN (all branches licence overview)')
    : hodLoginHtml(title, 'HOD / Staff — select branch + branch password, or email PIN')
  const otp = otpLoginScript('licences', 'Agile Licenses', portal)
  const accent = '#6366f1'

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<script>(function(){try{if(sessionStorage.getItem('otp_licences')||localStorage.getItem('otp_licences'))document.documentElement.className+=' lic-authed';}catch(e){}})();</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}
body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:14px}
html.lic-authed #login{display:none!important}html.lic-authed #shell{display:flex!important}
#login{max-width:420px;margin:0 auto;padding-top:8vh}
.card{background:#111a30;border:1px solid #22304f;border-radius:14px;padding:18px;margin-bottom:14px}
.card h3{color:#fff;margin-bottom:8px}
input,select,textarea{width:100%;padding:9px 11px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:14px}
label{display:block;font-size:12px;color:#94a3b8;margin:8px 0 3px;font-weight:700}
.btn{padding:10px 16px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:13px;background:${accent};color:#fff;margin:4px 4px 4px 0}
.btn:disabled{opacity:.6}.gold{background:#c9a84c;color:#14224f}.grey{background:#334155;color:#e2e8f0}.green{background:#16a34a;color:#fff}.r{background:#dc2626;color:#fff}.amb{background:#d97706;color:#fff}
.msg{padding:10px;border-radius:8px;font-size:13px;margin-top:10px;display:none}.hidden{display:none!important}
#shell{display:none;min-height:100vh;width:100%}
.side{position:fixed;top:0;left:0;bottom:0;width:250px;background:#0e1730;border-right:1px solid #22304f;display:flex;flex-direction:column;overflow-y:auto;z-index:40}
.brand{padding:16px;text-align:center;border-bottom:1px solid #22304f}
.brand img{height:46px}.brand b{display:block;color:#fff;font-size:14px;margin-top:8px}
.brand small{color:#a5b4fc;font-size:11px;font-weight:700}
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
.kpi b{display:block;font-size:20px;color:#a5b4fc}.kpi.bad b{color:#fca5a5}.kpi span{font-size:11px;color:#94a3b8;font-weight:700}
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
.alert.info{background:#1e1b4b;border-color:#818cf8;color:#c7d2fe}
.toast{position:fixed;bottom:18px;right:18px;background:#166534;color:#fff;padding:10px 14px;border-radius:8px;font-weight:700;display:none;z-index:99}
.toast.bad{background:#991b1b}
.portal-tag{display:inline-block;padding:3px 10px;border-radius:999px;background:rgba(99,102,241,.25);border:1px solid ${accent};color:#c7d2fe;font-size:11px;font-weight:800;margin-left:8px}
${SUITE_TAP_FEEDBACK_CSS}
</style></head><body>
${login}
<div id="shell">
  <aside class="side" id="side">
    <div class="brand">
      <img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile">
      <b>Agile Licenses</b>
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
var API='/api/licences/data';
var PORTAL=${JSON.stringify(portal)};
var IS_MGMT=${isMgmt ? 'true' : 'false'};
var CTX={email:'',name:'',branches:[],clients:[],branchKinds:[],labourAuth:[],branchId:''};
var VIEW='dashboard';
var BRANCH_LIC=[],LABOUR_LIC=[];

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
function switchPortal(){location.href='/licences/?portal='+(PORTAL==='management'?'staff':'management');}

function menuItems(){
  return [
    {id:'dashboard',label:'Dashboard',icon:'▣'},
    {id:'branch',label:'Branch Licences',icon:'🏛'},
    {id:'labour',label:'Labour Licences',icon:'👷'},
    {id:'clients',label:'Client List',icon:'📋'},
    {id:'reminders',label:'Renewal Reminders',icon:'⏰'}
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
  else if(id==='branch')renderBranch();
  else if(id==='labour')renderLabour();
  else if(id==='clients')renderClients();
  else if(id==='reminders')renderReminders();
}
function branchOpts(sel){
  return '<option value="">— Branch —</option>'+(CTX.branches||[]).map(function(b){
    return '<option value="'+h(b.id)+'"'+(sel===b.id?' selected':'')+'>'+h(b.name)+'</option>';
  }).join('');
}
function kindOpts(sel){
  return (CTX.branchKinds||[]).map(function(k){return '<option value="'+h(k.id)+'"'+(sel===k.id?' selected':'')+'>'+h(k.label)+'</option>';}).join('');
}
function authOpts(sel){
  return (CTX.labourAuth||[]).map(function(k){return '<option value="'+h(k.id)+'"'+(sel===k.id?' selected':'')+'>'+h(k.label)+'</option>';}).join('');
}
function clientOpts(sel){
  return '<option value="">— Client —</option>'+(CTX.clients||[]).map(function(c){
    var tag=c.businessTierLabel||c.tier?' · '+(c.businessTierLabel||c.tier):'';
    return '<option value="'+h(c.id)+'" data-name="'+h(c.name)+'" data-branch="'+h(c.branchId)+'"'+(sel===c.id?' selected':'')+'>'+h(c.name)+tag+'</option>';
  }).join('');
}
function kindLabel(id){
  var k=(CTX.branchKinds||[]).find(function(x){return x.id===id;});
  return k?k.label:id;
}
function alertsHtml(rows){
  if(!rows||!rows.length)return '<p class="muted">No renewal reminders right now.</p>';
  return rows.map(function(a){
    return '<div class="alert '+h(a.severity)+'"><b>'+h(a.title)+'</b> · '+h(a.branchName)+(a.clientName?' · '+h(a.clientName):'')+'<br>'+
      h(a.actionRequired)+'<br><span class="muted">Valid to '+h(a.dueDate)+' · Licence '+h(a.licenceNo||'—')+'</span></div>';
  }).join('');
}

function renderDashboard(){
  el('ttl').textContent=IS_MGMT?'India Licences Dashboard':'Branch Licences Dashboard';
  el('content').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  api('dashboard',{}).then(function(res){
    if(res.s!==200){el('content').innerHTML='<div class="card">'+h(res.j.error||'Error')+'</div>';return;}
    var k=res.j.kpis||{};
    el('content').innerHTML='<div class="card"><h3>At a glance</h3><div class="kgrid">'+
      '<div class="kpi"><b>'+k.branchLicences+'</b><span>Branch licences</span></div>'+
      '<div class="kpi"><b>'+k.labourLicences+'</b><span>Labour licences</span></div>'+
      '<div class="kpi"><b>'+k.clientsCovered+'</b><span>Clients covered</span></div>'+
      '<div class="kpi"><b>'+k.sanctionedTotal+'</b><span>Sanctioned strength</span></div>'+
      '<div class="kpi bad"><b>'+k.expiring30+'</b><span>Expiring ≤30 days</span></div>'+
      '<div class="kpi bad"><b>'+k.expired+'</b><span>Expired</span></div></div></div>'+
      '<div class="card"><h3>Upcoming renewals</h3>'+alertsHtml(res.j.alerts||[])+'</div>';
  });
}

function renderBranch(){
  el('ttl').textContent='Branch licences — PSARA / Shop & Est. / Trade';
  el('content').innerHTML='<div class="card"><button type="button" class="btn" onclick="loadBranch()">Refresh</button> <button type="button" class="btn green" onclick="editBranch()">Add branch licence</button>'+
    '<p class="muted" style="margin-top:8px">PSARA, Shop &amp; Establishment, and Trade licence for running the security business — branch-wise.</p></div><div id="brOut"></div>';
  loadBranch();
}
function loadBranch(){
  api('listBranchLicences',{}).then(function(res){
    BRANCH_LIC=res.j.licences||[];
    el('brOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Kind</th><th>Licence no.</th><th>Branch</th><th>From</th><th>To</th><th>Strength</th><th>Status</th><th></th></tr></thead><tbody>'+
      BRANCH_LIC.map(function(L,i){
        return '<tr><td>'+h(kindLabel(L.kind))+'</td><td>'+h(L.licenceNo)+'</td><td>'+h(L.branchName)+'</td><td>'+h(L.validFrom)+'</td><td>'+h(L.validTo)+'</td><td>'+(L.sanctionedStrength||'—')+'</td><td>'+h(L.status)+'</td>'+
          '<td><button type="button" class="btn grey" onclick="editBranch('+i+')">Edit</button></td></tr>';
      }).join('')+'</tbody></table></div></div>';
  });
}
function editBranch(i){
  var L=typeof i==='number'?BRANCH_LIC[i]:null;
  el('content').innerHTML='<div class="card"><h3>'+(L?'Edit':'Add')+' branch licence</h3>'+
    '<input type="hidden" id="bId" value="'+h(L&&L.id||'')+'">'+
    '<div class="row2"><div><label>Licence type</label><select id="bKind">'+kindOpts(L&&L.kind||'')+'</select></div>'+
    '<div><label>Licence number</label><input id="bNo" value="'+h(L&&L.licenceNo||'')+'"></div></div>'+
    '<div class="row3"><div><label>Branch</label><select id="bBr">'+branchOpts(L&&L.branchId||CTX.branchId||'')+'</select></div>'+
    '<div><label>State</label><input id="bState" value="'+h(L&&L.state||'')+'"></div>'+
    '<div><label>Issuing authority</label><input id="bAuth" value="'+h(L&&L.issuingAuthority||'')+'"></div></div>'+
    '<div class="row3"><div><label>Valid from</label><input type="date" id="bFrom" value="'+h(L&&L.validFrom||'')+'"></div>'+
    '<div><label>Valid to</label><input type="date" id="bTo" value="'+h(L&&L.validTo||'')+'"></div>'+
    '<div><label>Sanctioned strength</label><input type="number" id="bStr" value="'+(L&&L.sanctionedStrength||'')+'"></div></div>'+
    '<div class="row2"><div><label>Holder / firm name</label><input id="bHold" value="'+h(L&&L.holderName||'')+'"></div>'+
    '<div><label>Status</label><select id="bSt"><option>Active</option><option>Applied</option><option>Expired</option><option>Suspended</option></select></div></div>'+
    '<label>Document link</label><input id="bDoc" value="'+h(L&&L.documentUrl||'')+'">'+
    '<label>Notes</label><textarea id="bNotes" rows="2">'+h(L&&L.notes||'')+'</textarea>'+
    '<button type="button" class="btn green" onclick="saveBranch()">Save</button> <button type="button" class="btn grey" onclick="nav(\\''+'branch'+'\\')">Cancel</button></div>';
  if(L)el('bSt').value=L.status||'Active';
}
function saveBranch(){
  var b=el('bBr');var bn=b&&b.selectedOptions[0]?b.selectedOptions[0].text:'';if(bn==='— Branch —')bn='';
  if(!el('bFrom').value||!el('bTo').value){toast('Please pick Valid from and Valid to dates',false);return;}
  api('saveBranchLicence',{
    id:el('bId').value,kind:el('bKind').value,licenceNo:el('bNo').value,branchId:b.value,branchName:bn,
    state:el('bState').value,issuingAuthority:el('bAuth').value,validFrom:el('bFrom').value,validTo:el('bTo').value,
    sanctionedStrength:el('bStr').value,holderName:el('bHold').value,status:el('bSt').value,
    documentUrl:el('bDoc').value,notes:el('bNotes').value
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Branch licence saved',true);nav('branch');
  });
}

function renderLabour(){
  el('ttl').textContent='Client labour licences — State & Central';
  el('content').innerHTML='<div class="card"><div class="row2"><div><label>Search client / licence</label><input id="lQ"></div>'+
    '<div style="align-self:end"><button type="button" class="btn" onclick="loadLabour()">Search</button> <button type="button" class="btn green" onclick="editLabour()">Add labour licence</button></div></div>'+
    '<p class="muted" style="margin-top:8px">Client-wise labour licence: sanctioned strength, licence for, valid from–to (calendar pickers).</p></div><div id="lbOut"></div>';
  loadLabour();
}
function loadLabour(){
  api('listLabourLicences',{q:el('lQ')?el('lQ').value:''}).then(function(res){
    LABOUR_LIC=res.j.licences||[];
    el('lbOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Authority</th><th>Client</th><th>Licence for</th><th>No.</th><th>Strength</th><th>From</th><th>To</th><th>Status</th><th></th></tr></thead><tbody>'+
      LABOUR_LIC.map(function(L,i){
        return '<tr><td>'+h(L.authority)+'</td><td>'+h(L.clientName)+'<br><span class="muted">'+h(L.siteName)+' · '+h(L.branchName)+'</span></td><td>'+h(L.licenceFor)+'</td><td>'+h(L.licenceNo)+'</td><td>'+(L.sanctionedStrength||0)+'</td><td>'+h(L.validFrom)+'</td><td>'+h(L.validTo)+'</td><td>'+h(L.status)+'</td>'+
          '<td><button type="button" class="btn grey" onclick="editLabour('+i+')">Edit</button></td></tr>';
      }).join('')+'</tbody></table></div></div>';
  });
}
function editLabour(i){
  var L=typeof i==='number'?LABOUR_LIC[i]:null;
  el('content').innerHTML='<div class="card"><h3>'+(L?'Edit':'Add')+' labour licence</h3>'+
    '<input type="hidden" id="lId" value="'+h(L&&L.id||'')+'">'+
    '<div class="row2"><div><label>Authority</label><select id="lAuth">'+authOpts(L&&L.authority||'')+'</select></div>'+
    '<div><label>Client</label><select id="lClient" onchange="onClientPick()">'+clientOpts(L&&L.clientId||'')+'</select></div></div>'+
    '<div class="row2"><div><label>Client name (if not in list)</label><input id="lClientName" value="'+h(L&&L.clientName||'')+'"></div>'+
    '<div><label>Site / unit</label><input id="lSite" value="'+h(L&&L.siteName||'')+'"></div></div>'+
    '<div class="row3"><div><label>Branch</label><select id="lBr">'+branchOpts(L&&L.branchId||CTX.branchId||'')+'</select></div>'+
    '<div><label>Licence number</label><input id="lNo" value="'+h(L&&L.licenceNo||'')+'"></div>'+
    '<div><label>Sanctioned strength</label><input type="number" id="lStr" value="'+(L&&L.sanctionedStrength||'')+'"></div></div>'+
    '<label>Licence for (work / category)</label><input id="lFor" value="'+h(L&&L.licenceFor||'')+'" placeholder="e.g. Security guards at client site">'+
    '<div class="row3"><div><label>Valid from</label><input type="date" id="lFrom" value="'+h(L&&L.validFrom||'')+'"></div>'+
    '<div><label>Valid to</label><input type="date" id="lTo" value="'+h(L&&L.validTo||'')+'"></div>'+
    '<div><label>Status</label><select id="lSt"><option>Active</option><option>Applied</option><option>Expired</option><option>Suspended</option></select></div></div>'+
    '<div class="row2"><div><label>Issuing authority</label><input id="lIss" value="'+h(L&&L.issuingAuthority||'')+'"></div>'+
    '<div><label>Document link</label><input id="lDoc" value="'+h(L&&L.documentUrl||'')+'"></div></div>'+
    '<label>Notes</label><textarea id="lNotes" rows="2">'+h(L&&L.notes||'')+'</textarea>'+
    '<button type="button" class="btn green" onclick="saveLabour()">Save</button> <button type="button" class="btn grey" onclick="nav(\\''+'labour'+'\\')">Cancel</button></div>';
  if(L)el('lSt').value=L.status||'Active';
}
function onClientPick(){
  var sel=el('lClient');if(!sel||!sel.value)return;
  var opt=sel.selectedOptions[0];
  if(opt&&opt.getAttribute('data-name'))el('lClientName').value=opt.getAttribute('data-name');
  var bid=opt&&opt.getAttribute('data-branch');
  if(bid&&el('lBr'))el('lBr').value=bid;
}
function saveLabour(){
  var b=el('lBr');var bn=b&&b.selectedOptions[0]?b.selectedOptions[0].text:'';if(bn==='— Branch —')bn='';
  if(!el('lFrom').value||!el('lTo').value){toast('Please pick Valid from and Valid to dates',false);return;}
  if(!el('lClientName').value){toast('Client name is required',false);return;}
  api('saveLabourLicence',{
    id:el('lId').value,authority:el('lAuth').value,clientId:el('lClient').value,clientName:el('lClientName').value,
    siteName:el('lSite').value,branchId:b.value,branchName:bn,licenceNo:el('lNo').value,
    sanctionedStrength:el('lStr').value,licenceFor:el('lFor').value,validFrom:el('lFrom').value,validTo:el('lTo').value,
    status:el('lSt').value,issuingAuthority:el('lIss').value,documentUrl:el('lDoc').value,notes:el('lNotes').value
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Labour licence saved',true);nav('labour');
  });
}

function renderClients(){
  el('ttl').textContent='Client list — labour licence summary';
  el('content').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  api('clientSummary',{}).then(function(res){
    var rows=res.j.clients||[];
    var tierByName={};
    (CTX.clients||[]).forEach(function(c){if(c&&c.name)tierByName[String(c.name).toUpperCase()]=c.businessTierLabel||c.tier||'';});
    el('content').innerHTML='<div class="card"><h3>Clients with labour licences</h3><div class="tblwrap"><table><thead><tr><th>Client</th><th>Business Tier</th><th>Branch</th><th>Licences</th><th>Sanctioned strength</th><th>Next expiry</th></tr></thead><tbody>'+
      rows.map(function(c){
        var tier=tierByName[String(c.clientName||'').toUpperCase()]||'—';
        return '<tr><td>'+h(c.clientName)+'</td><td>'+h(tier)+'</td><td>'+h(c.branchName)+'</td><td>'+c.count+'</td><td>'+c.strength+'</td><td>'+h(c.nextExpiry)+'</td></tr>';
      }).join('')+'</tbody></table></div></div>';
  });
}

function renderReminders(){
  el('ttl').textContent='Renewal reminders';
  el('content').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  api('alerts',{}).then(function(res){
    el('content').innerHTML='<div class="card"><h3>All licence renewals</h3><p class="muted">Reminders at 90 / 60 / 30 / 15 / 7 days before expiry (and overdue). Daily mail to Director.</p>'+
      alertsHtml(res.j.alerts||[])+'</div>';
  });
}

function onOtpLogin(){
  document.documentElement.classList.add('lic-authed');
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
    CTX.clients=res.j.clients||[];CTX.branchKinds=res.j.branchKinds||[];CTX.labourAuth=res.j.labourAuth||[];
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

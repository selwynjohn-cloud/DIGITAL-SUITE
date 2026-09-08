/**
 * Agile Facilities — Staff + Management SPA (left menu, suite OTP).
 */

import type { VercelRequest } from '@vercel/node'
import { hodLoginHtml, otpLoginHtml, otpLoginScript } from '../embedded-otp.js'
import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../suite-tap-feedback.js'
import { suiteDateInputInitScript } from '../suite-date-input.js'

function portalFromReq(req: VercelRequest): 'staff' | 'management' {
  return String(req.query?.portal || '').toLowerCase() === 'management' ? 'management' : 'staff'
}

export function renderFacilitiesConsole(req: VercelRequest): string {
  const portal = portalFromReq(req)
  const isMgmt = portal === 'management'
  const title = isMgmt ? 'Agile Facilities — Management' : 'Agile Facilities — HOD / Staff'
  const login = isMgmt
    ? otpLoginHtml(title, 'Management — email PIN (Director, Facility Admin, Finance)')
    : hodLoginHtml(title, 'HOD / Staff — select branch + branch password, or email PIN')
  const otp = otpLoginScript('facilities', 'Agile Facilities', portal)
  const accent = '#0891b2'

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<script>
(function(){try{if(sessionStorage.getItem('otp_facilities')||localStorage.getItem('otp_facilities'))document.documentElement.className+=' fac-authed';}catch(e){}})();
</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}
body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:14px}
html.fac-authed #login{display:none!important}html.fac-authed #shell{display:flex!important}
#login{max-width:420px;margin:0 auto;padding-top:8vh}
.card{background:#111a30;border:1px solid #22304f;border-radius:14px;padding:18px;margin-bottom:14px}
.card h2,.card h3{color:#fff;margin-bottom:8px}
input,select,textarea{width:100%;padding:9px 11px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:14px}
label{display:block;font-size:12px;color:#94a3b8;margin:8px 0 3px;font-weight:700}
.btn{padding:10px 16px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:13px;background:${accent};color:#fff;margin:4px 4px 4px 0}
.btn:disabled{opacity:.6}.gold,.btn.gold{background:#c9a84c;color:#14224f}.grey{background:#334155}.green{background:#16a34a}.r{background:#dc2626}.amb{background:#d97706}
.msg{padding:10px;border-radius:8px;font-size:13px;margin-top:10px;display:none}.hidden{display:none!important}
#shell{display:none;min-height:100vh;width:100%}
.side{position:fixed;top:0;left:0;bottom:0;width:250px;background:#0e1730;border-right:1px solid #22304f;display:flex;flex-direction:column;overflow-y:auto;z-index:40}
.brand{padding:16px;text-align:center;border-bottom:1px solid #22304f}
.brand img{height:46px}.brand b{display:block;color:#fff;font-size:14px;margin-top:8px}
.brand small{color:#67e8f9;font-size:11px;font-weight:700}
.menu{padding:8px;flex:1}
.mi{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:9px;color:#cbd5e1;cursor:pointer;font-weight:600;font-size:13px;margin-bottom:2px;border:none;background:transparent;width:100%;text-align:left}
.mi:hover{background:#16223f}.mi.active{background:${accent};color:#fff}
.sidefoot{padding:12px 14px;border-top:1px solid #22304f}
.main{margin-left:250px;min-height:100vh;display:flex;flex-direction:column;width:calc(100% - 250px)}
.bar{background:#111a30;border-bottom:1px solid #22304f;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;position:sticky;top:0;z-index:30}
.bar b{color:#fff;font-size:16px}.content{padding:16px;flex:1;max-width:1100px;width:100%}
.burger{display:none;background:${accent};color:#fff;border:none;border-radius:8px;padding:8px 12px;font-weight:800}
@media(max-width:820px){.side{transform:translateX(-100%);transition:.2s}.side.open{transform:none}.main{margin-left:0;width:100%}.burger{display:inline-block}}
.kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:10px 0}
.kpi{background:#0e1730;border:1px solid #22304f;border-radius:10px;padding:12px;text-align:center}
.kpi b{display:block;font-size:22px;color:#67e8f9}.kpi.bad b{color:#fca5a5}.kpi span{font-size:11px;color:#94a3b8;font-weight:700}
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
.alert.info{background:#0c4a6e;border-color:#38bdf8;color:#bae6fd}
.toast{position:fixed;bottom:18px;right:18px;background:#166534;color:#fff;padding:10px 14px;border-radius:8px;font-weight:700;display:none;z-index:99}
.toast.bad{background:#991b1b}
.portal-tag{display:inline-block;padding:3px 10px;border-radius:999px;background:rgba(8,145,178,.25);border:1px solid ${accent};color:#a5f3fc;font-size:11px;font-weight:800;margin-left:8px}
${SUITE_TAP_FEEDBACK_CSS}
</style></head><body>
${login}
<div id="shell">
  <aside class="side" id="side">
    <div class="brand">
      <img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile">
      <b>Agile Facilities</b>
      <small id="portalLabel">${isMgmt ? 'Management Portal' : 'HOD / Staff Portal'}</small>
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
var API='/api/facilities/data';
var PORTAL=${JSON.stringify(portal)};
var IS_MGMT=${isMgmt ? 'true' : 'false'};
var CTX={email:'',name:'',branches:[],usages:[],taxKinds:[],maintKinds:[],branchId:''};
var VIEW='dashboard';
var PROPS=[],LEASES=[],TAXES=[],WOS=[];

function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function toast(msg,ok){var t=el('toast');if(!t)return;t.textContent=msg;t.className='toast'+(ok===false?' bad':'');t.style.display='block';setTimeout(function(){t.style.display='none';},2800);}
function money(n){return '₹'+Number(n||0).toLocaleString('en-IN');}
function api(action,extra){
  if(typeof otpRestoreSession==='function')otpRestoreSession();
  return fetch(API,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,portal:PORTAL,branchId:CTX.branchId||OTP_BRANCH_ID||''},extra||{}))
  }).then(function(r){return r.json().then(function(j){if(r.status===401&&typeof otpHandleUnauthorized==='function')otpHandleUnauthorized();return{s:r.status,j:j};});});
}
function logout(){if(typeof otpLogout==='function')otpLogout();else location.reload();}
function switchPortal(){location.href='/facilities/?portal='+(PORTAL==='management'?'staff':'management');}

function menuItems(){
  return [
    {id:'dashboard',label:'Dashboard',icon:'▣'},
    {id:'properties',label:'Properties',icon:'🏢'},
    {id:'leases',label:'Leases & Rentals',icon:'📄'},
    {id:'taxes',label:'Tax & Compliance',icon:'₹'},
    {id:'maint',label:'Maintenance',icon:'🔧'},
    {id:'reports',label:'Reports',icon:'📊'},
    {id:'alerts',label:'Alerts',icon:'⚠'}
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
  else if(id==='properties')renderProperties();
  else if(id==='leases')renderLeases();
  else if(id==='taxes')renderTaxes();
  else if(id==='maint')renderMaint();
  else if(id==='reports')renderReports();
  else if(id==='alerts')renderAlerts();
}

function branchOpts(sel){
  return '<option value="">— Branch —</option>'+(CTX.branches||[]).map(function(b){
    return '<option value="'+h(b.id)+'"'+(sel===b.id?' selected':'')+'>'+h(b.name)+'</option>';
  }).join('');
}
function propOpts(sel){
  return '<option value="">— Property —</option>'+PROPS.map(function(p){
    return '<option value="'+h(p.id)+'"'+(sel===p.id?' selected':'')+'>'+h(p.propertyCode+' · '+p.name)+'</option>';
  }).join('');
}
function usageOpts(sel){
  return (CTX.usages||[]).map(function(u){return '<option value="'+h(u.id)+'"'+(sel===u.id?' selected':'')+'>'+h(u.label)+'</option>';}).join('');
}
function taxKindOpts(sel){
  return (CTX.taxKinds||[]).map(function(u){return '<option value="'+h(u.id)+'"'+(sel===u.id?' selected':'')+'>'+h(u.label)+'</option>';}).join('');
}
function maintKindOpts(sel){
  return (CTX.maintKinds||[]).map(function(u){return '<option value="'+h(u.id)+'"'+(sel===u.id?' selected':'')+'>'+h(u.label)+'</option>';}).join('');
}
function alertsHtml(rows){
  if(!rows||!rows.length)return '<p class="muted">No alerts right now.</p>';
  return rows.map(function(a){
    return '<div class="alert '+h(a.severity)+'"><b>'+h(a.propertyName)+'</b> · '+h(a.branchName)+'<br>'+
      h(a.actionRequired)+'<br><span class="muted">Due '+h(a.dueDate)+' · Officer: '+h(a.responsibleOfficer)+'</span></div>';
  }).join('');
}

function renderDashboard(){
  el('ttl').textContent=IS_MGMT?'India Facilities Dashboard':'Branch Facilities Dashboard';
  el('content').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  api('dashboard',{}).then(function(res){
    if(res.s!==200){el('content').innerHTML='<div class="card">'+h(res.j.error||'Error')+'</div>';return;}
    var k=res.j.kpis||{};
    el('content').innerHTML='<div class="card"><h3>At a glance</h3><div class="kgrid">'+
      '<div class="kpi"><b>'+k.properties+'</b><span>Properties</span></div>'+
      '<div class="kpi"><b>'+k.activeLeases+'</b><span>Active leases</span></div>'+
      '<div class="kpi"><b>'+money(k.monthlyOutflow)+'</b><span>Monthly rent outflow</span></div>'+
      '<div class="kpi bad"><b>'+k.pendingTaxes+'</b><span>Pending taxes</span></div>'+
      '<div class="kpi bad"><b>'+k.openWorkOrders+'</b><span>Open work orders</span></div>'+
      '<div class="kpi bad"><b>'+k.alerts+'</b><span>Alerts</span></div></div></div>'+
      '<div class="card"><h3>Upcoming renewals</h3>'+alertsHtml(res.j.renewals||[])+'</div>'+
      '<div class="card"><h3>Pending taxes</h3>'+alertsHtml(res.j.pendingTaxes||[])+'</div>'+
      '<div class="card"><h3>Open maintenance</h3>'+alertsHtml(res.j.openMaint||[])+'</div>';
  });
}

function renderProperties(){
  el('ttl').textContent='Property & asset directory';
  el('content').innerHTML='<div class="card"><button type="button" class="btn" onclick="loadProps()">Refresh</button> <button type="button" class="btn green" onclick="editProp()">Add property</button></div><div id="propOut"></div>';
  loadProps();
}
function loadProps(){
  api('listProperties',{}).then(function(res){
    PROPS=res.j.properties||[];
    el('propOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Code</th><th>Name</th><th>City</th><th>Tenure</th><th>Usage</th><th>Status</th><th>Branch</th><th></th></tr></thead><tbody>'+
      PROPS.map(function(p,i){
        return '<tr><td>'+h(p.propertyCode)+'</td><td>'+h(p.name)+'</td><td>'+h(p.city)+'</td><td>'+h(p.tenure)+'</td><td>'+h(p.usage)+'</td><td>'+h(p.status)+'</td><td>'+h(p.branchName)+'</td>'+
          '<td><button type="button" class="btn grey" onclick="editProp('+i+')">Edit</button></td></tr>';
      }).join('')+'</tbody></table></div></div>';
  });
}
function editProp(i){
  var p=typeof i==='number'?PROPS[i]:null;
  el('content').innerHTML='<div class="card"><h3>'+(p?'Edit':'Add')+' property</h3>'+
    '<input type="hidden" id="pId" value="'+h(p&&p.id||'')+'">'+
    '<div class="row2"><div><label>Name *</label><input id="pName" value="'+h(p&&p.name||'')+'"></div>'+
    '<div><label>City</label><input id="pCity" value="'+h(p&&p.city||'')+'"></div></div>'+
    '<label>Address</label><textarea id="pAddr" rows="2">'+h(p&&p.address||'')+'</textarea>'+
    '<div class="row3"><div><label>Area (sq ft)</label><input id="pArea" type="number" value="'+(p&&p.areaSqFt||'')+'"></div>'+
    '<div><label>Tenure</label><select id="pTen"><option>Owned</option><option>Leased</option><option>Rented</option></select></div>'+
    '<div><label>Usage</label><select id="pUse">'+usageOpts(p&&p.usage||'')+'</select></div></div>'+
    '<div class="row3"><div><label>Status</label><select id="pSt"><option>Active</option><option>Vacant</option><option>UnderRenovation</option><option>Disposed</option></select></div>'+
    '<div><label>Branch</label><select id="pBr">'+branchOpts(p&&p.branchId||CTX.branchId||'')+'</select></div>'+
    '<div><label>Owner name</label><input id="pOwn" value="'+h(p&&p.ownerName||'')+'"></div></div>'+
    '<div class="row3"><div><label>Landlord</label><input id="pLl" value="'+h(p&&p.landlordName||'')+'"></div>'+
    '<div><label>Landlord phone</label><input id="pLlPh" value="'+h(p&&p.landlordPhone||'')+'"></div>'+
    '<div><label>Landlord email</label><input id="pLlEm" value="'+h(p&&p.landlordEmail||'')+'"></div></div>'+
    '<label>Notes</label><textarea id="pNotes" rows="2">'+h(p&&p.notes||'')+'</textarea>'+
    '<button type="button" class="btn green" onclick="saveProp()">Save</button> <button type="button" class="btn grey" onclick="nav(\\''+'properties'+'\\')">Cancel</button></div>';
  if(p){el('pTen').value=p.tenure||'Leased';el('pSt').value=p.status||'Active';}
}
function saveProp(){
  var b=el('pBr');var bn=b&&b.selectedOptions[0]?b.selectedOptions[0].text:'';if(bn==='— Branch —')bn='';
  api('saveProperty',{
    id:el('pId').value,name:el('pName').value,city:el('pCity').value,address:el('pAddr').value,
    areaSqFt:el('pArea').value,tenure:el('pTen').value,usage:el('pUse').value,status:el('pSt').value,
    branchId:b.value,branchName:bn,ownerName:el('pOwn').value,landlordName:el('pLl').value,
    landlordPhone:el('pLlPh').value,landlordEmail:el('pLlEm').value,notes:el('pNotes').value
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Property saved',true);nav('properties');
  });
}

function renderLeases(){
  el('ttl').textContent='Rental & lease agreements';
  el('content').innerHTML='<div class="card"><button type="button" class="btn" onclick="loadLeases()">Refresh</button> <button type="button" class="btn green" onclick="editLease()">Add lease</button><p class="muted" style="margin-top:8px">Renewal alerts fire at 90 / 60 / 30 / 15 days before expiry.</p></div><div id="leaseOut"></div>';
  Promise.all([api('listProperties',{}),api('listLeases',{})]).then(function(arr){
    PROPS=arr[0].j.properties||[];
    LEASES=arr[1].j.leases||[];
    paintLeases();
  });
}
function loadLeases(){api('listLeases',{}).then(function(res){LEASES=res.j.leases||[];paintLeases();});}
function paintLeases(){
  el('leaseOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Property</th><th>Start</th><th>Expiry</th><th>Rent / mo</th><th>Esc %</th><th>Status</th><th>Officer</th><th></th></tr></thead><tbody>'+
    LEASES.map(function(L,i){
      return '<tr><td>'+h(L.propertyName)+'</td><td>'+h(L.startDate)+'</td><td>'+h(L.expiryDate)+'</td><td>'+money(L.monthlyRent)+'</td><td>'+h(L.escalationPct)+'</td><td>'+h(L.status)+'</td><td>'+h(L.responsibleOfficer)+'</td>'+
        '<td><button type="button" class="btn grey" onclick="editLease('+i+')">Edit</button></td></tr>';
    }).join('')+'</tbody></table></div></div>';
}
function editLease(i){
  var L=typeof i==='number'?LEASES[i]:null;
  if(!PROPS.length){
    api('listProperties',{}).then(function(res){PROPS=res.j.properties||[];editLease(i);});
    return;
  }
  el('content').innerHTML='<div class="card"><h3>'+(L?'Edit':'Add')+' lease</h3>'+
    '<input type="hidden" id="lId" value="'+h(L&&L.id||'')+'">'+
    '<div class="row2"><div><label>Property</label><select id="lProp" onchange="onLeaseProp()">'+propOpts(L&&L.propertyId||'')+'</select></div>'+
    '<div><label>Status</label><select id="lSt"><option>Active</option><option>Draft</option><option>Expired</option><option>Terminated</option></select></div></div>'+
    '<div class="row3"><div><label>Start date</label><input type="date" id="lStart" value="'+h(L&&L.startDate||'')+'"></div>'+
    '<div><label>Expiry date</label><input type="date" id="lExp" value="'+h(L&&L.expiryDate||'')+'"></div>'+
    '<div><label>Notice period (days)</label><input type="number" id="lNotice" value="'+(L&&L.noticePeriodDays||30)+'"></div></div>'+
    '<div class="row3"><div><label>Monthly rent</label><input type="number" id="lRent" value="'+(L&&L.monthlyRent||'')+'"></div>'+
    '<div><label>Security deposit</label><input type="number" id="lDep" value="'+(L&&L.securityDeposit||'')+'"></div>'+
    '<div><label>Escalation %</label><input type="number" id="lEsc" value="'+(L&&L.escalationPct||'')+'"></div></div>'+
    '<div class="row3"><div><label>Landlord</label><input id="lLl" value="'+h(L&&L.landlordName||'')+'"></div>'+
    '<div><label>Phone</label><input id="lPh" value="'+h(L&&L.landlordPhone||'')+'"></div>'+
    '<div><label>Email</label><input id="lEm" value="'+h(L&&L.landlordEmail||'')+'"></div></div>'+
    '<div class="row2"><div><label>Document link / drive URL</label><input id="lDoc" value="'+h(L&&L.documentUrl||'')+'"></div>'+
    '<div><label>Responsible officer</label><input id="lOff" value="'+h(L&&L.responsibleOfficer||CTX.name||'')+'"></div></div>'+
    '<label>Document note</label><input id="lDocNote" value="'+h(L&&L.documentNote||'')+'">'+
    '<button type="button" class="btn green" onclick="saveLease()">Save</button> <button type="button" class="btn grey" onclick="nav(\\''+'leases'+'\\')">Cancel</button></div>';
  if(L)el('lSt').value=L.status||'Active';
}
function onLeaseProp(){
  var id=el('lProp').value;var p=PROPS.find(function(x){return x.id===id;});
  if(!p)return;
  if(!el('lLl').value)el('lLl').value=p.landlordName||'';
  if(!el('lPh').value)el('lPh').value=p.landlordPhone||'';
  if(!el('lEm').value)el('lEm').value=p.landlordEmail||'';
}
function saveLease(){
  var id=el('lProp').value;var p=PROPS.find(function(x){return x.id===id;})||{};
  api('saveLease',{
    id:el('lId').value,propertyId:id,propertyName:p.name||'',branchId:p.branchId||'',branchName:p.branchName||'',
    startDate:el('lStart').value,expiryDate:el('lExp').value,noticePeriodDays:el('lNotice').value,
    monthlyRent:el('lRent').value,securityDeposit:el('lDep').value,escalationPct:el('lEsc').value,
    landlordName:el('lLl').value,landlordPhone:el('lPh').value,landlordEmail:el('lEm').value,
    documentUrl:el('lDoc').value,documentNote:el('lDocNote').value,status:el('lSt').value,
    responsibleOfficer:el('lOff').value
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Lease saved',true);nav('leases');
  });
}

function renderTaxes(){
  el('ttl').textContent='Estate tax & compliance';
  el('content').innerHTML='<div class="card"><button type="button" class="btn" onclick="loadTaxes()">Refresh</button> <button type="button" class="btn green" onclick="editTax()">Add tax / due</button><p class="muted" style="margin-top:8px">Payment reminders at 30 days and 7 days before due date.</p></div><div id="taxOut"></div>';
  Promise.all([api('listProperties',{}),api('listTaxes',{})]).then(function(arr){
    PROPS=arr[0].j.properties||[];TAXES=arr[1].j.taxes||[];paintTaxes();
  });
}
function loadTaxes(){api('listTaxes',{}).then(function(res){TAXES=res.j.taxes||[];paintTaxes();});}
function paintTaxes(){
  el('taxOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Property</th><th>Kind</th><th>Authority</th><th>Amount</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>'+
    TAXES.map(function(T,i){
      return '<tr><td>'+h(T.propertyName)+'</td><td>'+h(T.kind)+'</td><td>'+h(T.authority)+'</td><td>'+money(T.amountDue)+'</td><td>'+h(T.dueDate)+'</td><td>'+h(T.status)+'</td>'+
        '<td><button type="button" class="btn grey" onclick="editTax('+i+')">Edit</button></td></tr>';
    }).join('')+'</tbody></table></div></div>';
}
function editTax(i){
  var T=typeof i==='number'?TAXES[i]:null;
  if(!PROPS.length){api('listProperties',{}).then(function(res){PROPS=res.j.properties||[];editTax(i);});return;}
  el('content').innerHTML='<div class="card"><h3>'+(T?'Edit':'Add')+' tax / due</h3>'+
    '<input type="hidden" id="tId" value="'+h(T&&T.id||'')+'">'+
    '<div class="row2"><div><label>Property</label><select id="tProp">'+propOpts(T&&T.propertyId||'')+'</select></div>'+
    '<div><label>Kind</label><select id="tKind">'+taxKindOpts(T&&T.kind||'')+'</select></div></div>'+
    '<div class="row3"><div><label>Authority</label><input id="tAuth" value="'+h(T&&T.authority||'')+'"></div>'+
    '<div><label>Amount due</label><input type="number" id="tAmt" value="'+(T&&T.amountDue||'')+'"></div>'+
    '<div><label>Due date</label><input type="date" id="tDue" value="'+h(T&&T.dueDate||'')+'"></div></div>'+
    '<div class="row2"><div><label>Status</label><select id="tSt"><option>Pending</option><option>Paid</option><option>Overdue</option></select></div>'+
    '<div><label>Paid on</label><input type="date" id="tPaid" value="'+h((T&&T.paidAt||'').slice(0,10))+'"></div></div>'+
    '<label>Notes</label><textarea id="tNotes" rows="2">'+h(T&&T.notes||'')+'</textarea>'+
    '<button type="button" class="btn green" onclick="saveTax()">Save</button> <button type="button" class="btn grey" onclick="nav(\\''+'taxes'+'\\')">Cancel</button></div>';
  if(T)el('tSt').value=T.status||'Pending';
}
function saveTax(){
  var id=el('tProp').value;var p=PROPS.find(function(x){return x.id===id;})||{};
  api('saveTax',{
    id:el('tId').value,propertyId:id,propertyName:p.name||'',branchId:p.branchId||'',branchName:p.branchName||'',
    kind:el('tKind').value,authority:el('tAuth').value,amountDue:el('tAmt').value,dueDate:el('tDue').value,
    status:el('tSt').value,paidAt:el('tPaid').value,notes:el('tNotes').value
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Tax item saved',true);nav('taxes');
  });
}

function renderMaint(){
  el('ttl').textContent='Maintenance & operations';
  el('content').innerHTML='<div class="card"><button type="button" class="btn" onclick="loadWo()">Refresh</button> <button type="button" class="btn green" onclick="editWo()">New work order</button></div><div id="woOut"></div>';
  Promise.all([api('listProperties',{}),api('listWorkOrders',{})]).then(function(arr){
    PROPS=arr[0].j.properties||[];WOS=arr[1].j.workOrders||[];paintWo();
  });
}
function loadWo(){api('listWorkOrders',{}).then(function(res){WOS=res.j.workOrders||[];paintWo();});}
function paintWo(){
  el('woOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Property</th><th>Kind</th><th>Title</th><th>Vendor</th><th>Cost</th><th>Scheduled</th><th>Status</th><th></th></tr></thead><tbody>'+
    WOS.map(function(W,i){
      return '<tr><td>'+h(W.propertyName)+'</td><td>'+h(W.kind)+'</td><td>'+h(W.title)+'</td><td>'+h(W.vendorName)+'</td><td>'+money(W.cost)+'</td><td>'+h(W.scheduledDate)+'</td><td>'+h(W.status)+'</td>'+
        '<td><button type="button" class="btn grey" onclick="editWo('+i+')">Edit</button></td></tr>';
    }).join('')+'</tbody></table></div></div>';
}
function editWo(i){
  var W=typeof i==='number'?WOS[i]:null;
  if(!PROPS.length){api('listProperties',{}).then(function(res){PROPS=res.j.properties||[];editWo(i);});return;}
  el('content').innerHTML='<div class="card"><h3>'+(W?'Edit':'New')+' work order</h3>'+
    '<input type="hidden" id="wId" value="'+h(W&&W.id||'')+'">'+
    '<div class="row2"><div><label>Property</label><select id="wProp">'+propOpts(W&&W.propertyId||'')+'</select></div>'+
    '<div><label>Kind</label><select id="wKind">'+maintKindOpts(W&&W.kind||'')+'</select></div></div>'+
    '<label>Title</label><input id="wTitle" value="'+h(W&&W.title||'')+'">'+
    '<label>Detail</label><textarea id="wDet" rows="2">'+h(W&&W.detail||'')+'</textarea>'+
    '<div class="row3"><div><label>Vendor</label><input id="wVen" value="'+h(W&&W.vendorName||'')+'"></div>'+
    '<div><label>Bill ref</label><input id="wBill" value="'+h(W&&W.vendorBillRef||'')+'"></div>'+
    '<div><label>Cost</label><input type="number" id="wCost" value="'+(W&&W.cost||'')+'"></div></div>'+
    '<div class="row3"><div><label>Scheduled</label><input type="date" id="wSch" value="'+h(W&&W.scheduledDate||'')+'"></div>'+
    '<div><label>Completed</label><input type="date" id="wDone" value="'+h(W&&W.completedDate||'')+'"></div>'+
    '<div><label>Next service</label><input type="date" id="wNext" value="'+h(W&&W.nextServiceDate||'')+'"></div></div>'+
    '<div class="row2"><div><label>Recurring</label><select id="wRec"><option value="">None</option><option>Quarterly</option><option>Annual</option></select></div>'+
    '<div><label>Status</label><select id="wSt"><option>Open</option><option>InProgress</option><option>Closed</option></select></div></div>'+
    '<button type="button" class="btn green" onclick="saveWo()">Save</button> <button type="button" class="btn grey" onclick="nav(\\''+'maint'+'\\')">Cancel</button></div>';
  if(W){el('wRec').value=W.recurring||'';el('wSt').value=W.status||'Open';}
}
function saveWo(){
  var id=el('wProp').value;var p=PROPS.find(function(x){return x.id===id;})||{};
  api('saveWorkOrder',{
    id:el('wId').value,propertyId:id,propertyName:p.name||'',branchId:p.branchId||'',branchName:p.branchName||'',
    kind:el('wKind').value,title:el('wTitle').value,detail:el('wDet').value,vendorName:el('wVen').value,
    vendorBillRef:el('wBill').value,cost:el('wCost').value,scheduledDate:el('wSch').value,
    completedDate:el('wDone').value,nextServiceDate:el('wNext').value,recurring:el('wRec').value,status:el('wSt').value
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Work order saved',true);nav('maint');
  });
}

function renderReports(){
  el('ttl').textContent='Summary reports';
  el('content').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  api('reports',{}).then(function(res){
    if(res.s!==200){el('content').innerHTML='<div class="card">'+h(res.j.error||'Error')+'</div>';return;}
    var L=res.j.activeLeases||[],M=res.j.maintenanceLogs||[];
    el('content').innerHTML='<div class="card"><h3>Active leases</h3><p class="muted">Monthly rental outflow: <b style="color:#67e8f9">'+money(res.j.monthlyOutflow)+'</b></p>'+
      '<div class="tblwrap"><table><thead><tr><th>Property</th><th>Expiry</th><th>Rent</th><th>Branch</th></tr></thead><tbody>'+
      L.map(function(x){return '<tr><td>'+h(x.propertyName)+'</td><td>'+h(x.expiryDate)+'</td><td>'+money(x.monthlyRent)+'</td><td>'+h(x.branchName)+'</td></tr>';}).join('')+
      '</tbody></table></div></div>'+
      '<div class="card"><h3>Property maintenance logs</h3><div class="tblwrap"><table><thead><tr><th>Date</th><th>Property</th><th>Title</th><th>Vendor</th><th>Cost</th><th>Status</th></tr></thead><tbody>'+
      M.map(function(x){return '<tr><td>'+h(x.scheduledDate||x.createdAt&&x.createdAt.slice(0,10))+'</td><td>'+h(x.propertyName)+'</td><td>'+h(x.title)+'</td><td>'+h(x.vendorName)+'</td><td>'+money(x.cost)+'</td><td>'+h(x.status)+'</td></tr>';}).join('')+
      '</tbody></table></div></div>';
  });
}

function renderAlerts(){
  el('ttl').textContent='Actionable alerts';
  el('content').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  api('alerts',{}).then(function(res){
    el('content').innerHTML='<div class="card"><h3>All alerts</h3><p class="muted">Each alert shows property, due date, action, and responsible officer.</p>'+alertsHtml(res.j.alerts||[])+'</div>';
  });
}

function onOtpLogin(){
  document.documentElement.classList.add('fac-authed');
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
    CTX.usages=res.j.usages||[];CTX.taxKinds=res.j.taxKinds||[];CTX.maintKinds=res.j.maintKinds||[];
    CTX.branchId=res.j.branchId||OTP_BRANCH_ID||'';
    el('who').textContent=(CTX.name||CTX.email)+(CTX.branchId?' · branch linked':'');
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

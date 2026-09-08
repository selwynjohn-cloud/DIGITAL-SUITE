/**
 * Agile Assets — Staff + Management SPA (left menu, suite OTP).
 */

import type { VercelRequest } from '@vercel/node'
import { hodLoginHtml, otpLoginHtml, otpLoginScript } from '../embedded-otp.js'
import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../suite-tap-feedback.js'
import { suiteDateInputInitScript } from '../suite-date-input.js'

function portalFromReq(req: VercelRequest): 'staff' | 'management' {
  return String(req.query?.portal || '').toLowerCase() === 'management' ? 'management' : 'staff'
}

export function renderAssetsConsole(req: VercelRequest): string {
  const portal = portalFromReq(req)
  const isMgmt = portal === 'management'
  const title = isMgmt ? 'Agile Assets — Management' : 'Agile Assets — HOD / Staff'
  const login = isMgmt
    ? otpLoginHtml(title, 'Management — email PIN (global asset view & write-off approval)')
    : hodLoginHtml(title, 'HOD / Staff — select branch + branch password, or email PIN')
  const otp = otpLoginScript('assets', 'Agile Assets', portal)
  const accent = '#ca8a04'

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<script>(function(){try{if(sessionStorage.getItem('otp_assets')||localStorage.getItem('otp_assets'))document.documentElement.className+=' aa-authed';}catch(e){}})();</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}
body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:14px}
html.aa-authed #login{display:none!important}html.aa-authed #shell{display:flex!important}
#login{max-width:420px;margin:0 auto;padding-top:8vh}
.card{background:#111a30;border:1px solid #22304f;border-radius:14px;padding:18px;margin-bottom:14px}
.card h3{color:#fff;margin-bottom:8px}
input,select,textarea{width:100%;padding:9px 11px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:14px}
label{display:block;font-size:12px;color:#94a3b8;margin:8px 0 3px;font-weight:700}
.btn{padding:10px 16px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:13px;background:${accent};color:#14224f;margin:4px 4px 4px 0}
.btn:disabled{opacity:.6}.gold{background:#c9a84c;color:#14224f}.grey{background:#334155;color:#e2e8f0}.green{background:#16a34a;color:#fff}.r{background:#dc2626;color:#fff}.amb{background:#d97706;color:#fff}
.msg{padding:10px;border-radius:8px;font-size:13px;margin-top:10px;display:none}.hidden{display:none!important}
#shell{display:none;min-height:100vh;width:100%}
.side{position:fixed;top:0;left:0;bottom:0;width:250px;background:#0e1730;border-right:1px solid #22304f;display:flex;flex-direction:column;overflow-y:auto;z-index:40}
.brand{padding:16px;text-align:center;border-bottom:1px solid #22304f}
.brand img{height:46px}.brand b{display:block;color:#fff;font-size:14px;margin-top:8px}
.brand small{color:#fde68a;font-size:11px;font-weight:700}
.menu{padding:8px;flex:1}
.mi{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:9px;color:#cbd5e1;cursor:pointer;font-weight:600;font-size:13px;margin-bottom:2px;border:none;background:transparent;width:100%;text-align:left}
.mi:hover{background:#16223f}.mi.active{background:${accent};color:#14224f}
.sidefoot{padding:12px 14px;border-top:1px solid #22304f}
.main{margin-left:250px;min-height:100vh;display:flex;flex-direction:column;width:calc(100% - 250px)}
.bar{background:#111a30;border-bottom:1px solid #22304f;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;position:sticky;top:0;z-index:30}
.bar b{color:#fff;font-size:16px}.content{padding:16px;flex:1;max-width:1100px;width:100%}
.burger{display:none;background:${accent};color:#14224f;border:none;border-radius:8px;padding:8px 12px;font-weight:800}
@media(max-width:820px){.side{transform:translateX(-100%);transition:.2s}.side.open{transform:none}.main{margin-left:0;width:100%}.burger{display:inline-block}}
.kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:10px 0}
.kpi{background:#0e1730;border:1px solid #22304f;border-radius:10px;padding:12px;text-align:center}
.kpi b{display:block;font-size:20px;color:#fde68a}.kpi.bad b{color:#fca5a5}.kpi span{font-size:11px;color:#94a3b8;font-weight:700}
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
.portal-tag{display:inline-block;padding:3px 10px;border-radius:999px;background:rgba(202,138,4,.25);border:1px solid ${accent};color:#fde68a;font-size:11px;font-weight:800;margin-left:8px}
.codepill{display:inline-block;padding:2px 8px;border-radius:6px;background:#0b1220;border:1px solid #334155;font-family:ui-monospace,monospace;font-size:11px;color:#fde68a}
${SUITE_TAP_FEEDBACK_CSS}
</style></head><body>
${login}
<div id="shell">
  <aside class="side" id="side">
    <div class="brand">
      <img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile">
      <b>Agile Assets</b>
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
var API='/api/assets/data';
var PORTAL=${JSON.stringify(portal)};
var IS_MGMT=${isMgmt ? 'true' : 'false'};
var CTX={email:'',name:'',branches:[],categories:[],tiers:[],branchId:''};
var VIEW='dashboard';
var ASSETS=[],TRANS=[],MAINT=[],WOS=[];

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
function switchPortal(){location.href='/assets/?portal='+(PORTAL==='management'?'staff':'management');}

function menuItems(){
  return [
    {id:'dashboard',label:'Dashboard',icon:'▣'},
    {id:'register',label:'Asset Directory',icon:'🏷'},
    {id:'stock',label:'Branch Stock',icon:'📦'},
    {id:'transfer',label:'Transfers / HOTO',icon:'↔'},
    {id:'maint',label:'Maintenance',icon:'🔧'},
    {id:'lifecycle',label:'Write-off',icon:'🗑'},
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
  else if(id==='register')renderRegister();
  else if(id==='stock')renderStock();
  else if(id==='transfer')renderTransfer();
  else if(id==='maint')renderMaint();
  else if(id==='lifecycle')renderLifecycle();
  else if(id==='alerts')renderAlerts();
}
function branchOpts(sel){
  return '<option value="">— Branch —</option>'+(CTX.branches||[]).map(function(b){
    return '<option value="'+h(b.id)+'"'+(sel===b.id?' selected':'')+'>'+h(b.name)+'</option>';
  }).join('');
}
function catOpts(sel){
  return (CTX.categories||[]).map(function(c){return '<option value="'+h(c.id)+'"'+(sel===c.id?' selected':'')+'>'+h(c.label)+'</option>';}).join('');
}
function tierOpts(sel){
  return (CTX.tiers||[]).map(function(c){return '<option value="'+h(c.id)+'"'+(sel===c.id?' selected':'')+'>'+h(c.label)+'</option>';}).join('');
}
function assetOpts(sel){
  return '<option value="">— Asset —</option>'+ASSETS.filter(function(a){return a.status!=='Disposed'&&a.status!=='WrittenOff';}).map(function(a){
    return '<option value="'+h(a.id)+'"'+(sel===a.id?' selected':'')+'>'+h(a.assetCode+' · '+a.name)+'</option>';
  }).join('');
}
function alertsHtml(rows){
  if(!rows||!rows.length)return '<p class="muted">No alerts right now.</p>';
  return rows.map(function(a){
    return '<div class="alert '+h(a.severity)+'"><span class="codepill">'+h(a.assetCode)+'</span> <b>'+h(a.assetName)+'</b> · '+h(a.branchName)+'<br>'+
      h(a.actionRequired)+'<br><span class="muted">Due '+h(a.dueDate)+'</span></div>';
  }).join('');
}

function renderDashboard(){
  el('ttl').textContent=IS_MGMT?'India Assets Dashboard':'Branch Assets Dashboard';
  el('content').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  api('dashboard',{}).then(function(res){
    if(res.s!==200){el('content').innerHTML='<div class="card">'+h(res.j.error||'Error')+'</div>';return;}
    var k=res.j.kpis||{};
    var cats=(res.j.byCategory||[]).map(function(c){return '<div class="kpi"><b>'+c.count+'</b><span>'+h(c.label)+'</span></div>';}).join('');
    el('content').innerHTML='<div class="card"><h3>At a glance</h3><div class="kgrid">'+
      '<div class="kpi"><b>'+k.assets+'</b><span>Assets</span></div>'+
      '<div class="kpi"><b>'+k.inService+'</b><span>In service</span></div>'+
      '<div class="kpi bad"><b>'+k.underRepair+'</b><span>Under repair</span></div>'+
      '<div class="kpi bad"><b>'+k.pendingHoto+'</b><span>Pending HOTO</span></div>'+
      '<div class="kpi bad"><b>'+k.openMaint+'</b><span>Open maint.</span></div>'+
      '<div class="kpi"><b>'+money(k.bookTotal)+'</b><span>Book value</span></div></div></div>'+
      '<div class="card"><h3>By category</h3><div class="kgrid">'+cats+'</div></div>'+
      '<div class="card"><h3>Alerts</h3>'+alertsHtml(res.j.alerts||[])+'</div>';
  });
}

function renderRegister(){
  el('ttl').textContent='Asset master directory';
  el('content').innerHTML='<div class="card"><div class="row3"><div><label>Search</label><input id="aQ" placeholder="code / name / serial / custodian"></div>'+
    '<div><label>Category</label><select id="aCatF"><option value="">All</option>'+catOpts('')+'</select></div>'+
    '<div style="align-self:end"><button type="button" class="btn" onclick="loadAssets()">Search</button> <button type="button" class="btn green" onclick="editAsset()">Add asset</button></div></div>'+
    '<p class="muted" style="margin-top:8px">Each asset gets a unique code (AA-#####) and QR payload for audit tagging.</p></div><div id="aOut"></div>';
  loadAssets();
}
function loadAssets(){
  api('listAssets',{q:el('aQ')?el('aQ').value:'',category:el('aCatF')?el('aCatF').value:''}).then(function(res){
    ASSETS=res.j.assets||[];
    el('aOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Location</th><th>Custodian</th><th>Status</th><th>Book</th><th></th></tr></thead><tbody>'+
      ASSETS.map(function(a,i){
        return '<tr><td><span class="codepill">'+h(a.assetCode)+'</span></td><td>'+h(a.name)+'<br><span class="muted">'+h(a.brand)+' '+h(a.serialNo)+'</span></td><td>'+h(a.category)+'</td>'+
          '<td>'+h(a.branchName)+'<br><span class="muted">'+h(a.roomFloor)+'</span></td><td>'+h(a.custodianName)+'</td><td>'+h(a.status)+'</td><td>'+money(a.bookValue)+'</td>'+
          '<td><button type="button" class="btn grey" onclick="editAsset('+i+')">Edit</button> <button type="button" class="btn amb" onclick="showTag('+i+')">Tag</button></td></tr>';
      }).join('')+'</tbody></table></div></div>';
  });
}
function showTag(i){
  var a=ASSETS[i];if(!a)return;
  el('content').innerHTML='<div class="card"><h3>Asset tag — '+h(a.assetCode)+'</h3>'+
    '<p><b>'+h(a.name)+'</b></p><p class="muted">'+h(a.branchName)+' · '+h(a.roomFloor)+' · Custodian: '+h(a.custodianName)+'</p>'+
    '<p style="margin:12px 0">QR / barcode payload (print or encode later):</p>'+
    '<pre style="background:#0b1220;padding:14px;border-radius:8px;border:1px solid #334155;color:#fde68a;font-size:16px;letter-spacing:.04em">'+h(a.qrPayload||('AGILE-ASSET|'+a.assetCode))+'</pre>'+
    '<p class="muted">Phase 1: use this code for audits. Mobile scanner can match on Asset ID / payload.</p>'+
    '<button type="button" class="btn grey" onclick="nav(\\''+'register'+'\\')">← Back</button></div>';
}
function editAsset(i){
  var a=typeof i==='number'?ASSETS[i]:null;
  el('content').innerHTML='<div class="card"><h3>'+(a?'Edit':'Add')+' asset</h3>'+
    '<input type="hidden" id="asId" value="'+h(a&&a.id||'')+'">'+
    '<div class="row2"><div><label>Name *</label><input id="asName" value="'+h(a&&a.name||'')+'"></div>'+
    '<div><label>Category</label><select id="asCat">'+catOpts(a&&a.category||'')+'</select></div></div>'+
    '<div class="row3"><div><label>Sub-category</label><input id="asSub" value="'+h(a&&a.subCategory||'')+'"></div>'+
    '<div><label>Brand</label><input id="asBrand" value="'+h(a&&a.brand||'')+'"></div>'+
    '<div><label>Serial no.</label><input id="asSer" value="'+h(a&&a.serialNo||'')+'"></div></div>'+
    '<div class="row3"><div><label>Purchase date</label><input type="date" id="asPur" value="'+h(a&&a.purchaseDate||'')+'"></div>'+
    '<div><label>Invoice ref</label><input id="asInv" value="'+h(a&&a.invoiceRef||'')+'"></div>'+
    '<div><label>Supplier</label><input id="asSup" value="'+h(a&&a.supplier||'')+'"></div></div>'+
    '<div class="row3"><div><label>Original cost</label><input type="number" id="asCost" value="'+(a&&a.originalCost||'')+'"></div>'+
    '<div><label>Warranty expiry</label><input type="date" id="asWar" value="'+h(a&&a.warrantyExpiry||'')+'"></div>'+
    '<div><label>Status</label><select id="asSt"><option>InService</option><option>InTransit</option><option>UnderRepair</option><option>WrittenOff</option><option>Disposed</option></select></div></div>'+
    '<div class="row3"><div><label>Org tier</label><select id="asTier">'+tierOpts(a&&a.orgTier||'')+'</select></div>'+
    '<div><label>Branch / location</label><select id="asBr">'+branchOpts(a&&a.branchId||CTX.branchId||'')+'</select></div>'+
    '<div><label>Room / floor</label><input id="asRoom" value="'+h(a&&a.roomFloor||'')+'"></div></div>'+
    '<div class="row2"><div><label>Custodian</label><input id="asCust" value="'+h(a&&a.custodianName||CTX.name||'')+'"></div>'+
    '<div><label>Custodian email</label><input id="asCustEm" value="'+h(a&&a.custodianEmail||CTX.email||'')+'"></div></div>'+
    '<label>Notes</label><textarea id="asNotes" rows="2">'+h(a&&a.notes||'')+'</textarea>'+
    '<button type="button" class="btn green" onclick="saveAsset()">Save</button> <button type="button" class="btn grey" onclick="nav(\\''+'register'+'\\')">Cancel</button></div>';
  if(a)el('asSt').value=a.status||'InService';
}
function saveAsset(){
  var b=el('asBr');var bn=b&&b.selectedOptions[0]?b.selectedOptions[0].text:'';if(bn==='— Branch —')bn='';
  api('saveAsset',{
    id:el('asId').value,name:el('asName').value,category:el('asCat').value,subCategory:el('asSub').value,
    brand:el('asBrand').value,serialNo:el('asSer').value,purchaseDate:el('asPur').value,invoiceRef:el('asInv').value,
    supplier:el('asSup').value,originalCost:el('asCost').value,warrantyExpiry:el('asWar').value,status:el('asSt').value,
    orgTier:el('asTier').value,branchId:b.value,branchName:bn,roomFloor:el('asRoom').value,
    custodianName:el('asCust').value,custodianEmail:el('asCustEm').value,notes:el('asNotes').value
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Saved '+res.j.asset.assetCode,true);nav('register');
  });
}

function renderStock(){
  el('ttl').textContent='Branch-wise stock ledger';
  el('content').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  api('stockByBranch',{}).then(function(res){
    var rows=res.j.stock||[];
    el('content').innerHTML='<div class="card"><h3>Live stock by location</h3><div class="tblwrap"><table><thead><tr><th>Branch / dept</th><th>Assets</th><th>Book value</th></tr></thead><tbody>'+
      rows.map(function(r){return '<tr><td>'+h(r.branchName)+'</td><td>'+r.count+'</td><td>'+money(r.bookValue)+'</td></tr>';}).join('')+
      '</tbody></table></div></div>';
  });
}

function renderTransfer(){
  el('ttl').textContent='Transfers & digital HOTO';
  el('content').innerHTML='<div class="card"><button type="button" class="btn green" onclick="newTransfer()">Start transfer</button> <button type="button" class="btn" onclick="loadTransfers()">Refresh</button>'+
    '<p class="muted" style="margin-top:8px">Hand over → Take over. Asset stays In Transit until destination accepts.</p></div><div id="trOut"></div>';
  Promise.all([api('listAssets',{}),api('listTransfers',{})]).then(function(arr){
    ASSETS=arr[0].j.assets||[];TRANS=arr[1].j.transfers||[];paintTransfers();
  });
}
function loadTransfers(){api('listTransfers',{}).then(function(res){TRANS=res.j.transfers||[];paintTransfers();});}
function paintTransfers(){
  el('trOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Asset</th><th>From → To</th><th>Handed by</th><th>Taken by</th><th>Status</th><th></th></tr></thead><tbody>'+
    TRANS.map(function(t){
      var act=t.status==='PendingHOTO'?'<button type="button" class="btn green" onclick="acceptTr(\\''+h(t.id)+'\\')">Accept HOTO</button>':'';
      return '<tr><td><span class="codepill">'+h(t.assetCode)+'</span> '+h(t.assetName)+'</td><td>'+h(t.fromBranchName)+' → '+h(t.toBranchName)+'</td>'+
        '<td>'+h(t.handedOverBy)+'<br><span class="muted">'+(t.handedOverAt||'').slice(0,16)+'</span></td>'+
        '<td>'+h(t.takenOverBy||'—')+'</td><td>'+h(t.status)+'</td><td>'+act+'</td></tr>';
    }).join('')+'</tbody></table></div></div>';
}
function newTransfer(){
  if(!ASSETS.length){api('listAssets',{}).then(function(res){ASSETS=res.j.assets||[];newTransfer();});return;}
  el('content').innerHTML='<div class="card"><h3>New transfer</h3>'+
    '<label>Asset</label><select id="trAsset">'+assetOpts('')+'</select>'+
    '<div class="row2"><div><label>To branch</label><select id="trTo">'+branchOpts('')+'</select></div>'+
    '<div><label>Receiving custodian</label><input id="trCust"></div></div>'+
    '<label>Notes</label><textarea id="trNotes" rows="2"></textarea>'+
    '<button type="button" class="btn green" onclick="saveTransfer()">Hand over</button> <button type="button" class="btn grey" onclick="nav(\\''+'transfer'+'\\')">Cancel</button></div>';
}
function saveTransfer(){
  var b=el('trTo');var bn=b&&b.selectedOptions[0]?b.selectedOptions[0].text:'';if(bn==='— Branch —')bn='';
  api('createTransfer',{assetId:el('trAsset').value,toBranchId:b.value,toBranchName:bn,toCustodian:el('trCust').value,notes:el('trNotes').value}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Handed over — awaiting takeover',true);nav('transfer');
  });
}
function acceptTr(id){
  el('content').innerHTML='<div class="card"><h3>Accept HOTO (Takeover)</h3>'+
    '<input type="hidden" id="accId" value="'+h(id)+'">'+
    '<label>Your name (receiving custodian)</label><input id="accName" value="'+h(CTX.name||'')+'">'+
    '<button type="button" class="btn green" onclick="doAcceptTr()">Confirm takeover</button> <button type="button" class="btn grey" onclick="nav(\\''+'transfer'+'\\')">Cancel</button></div>';
}
function doAcceptTr(){
  api('acceptTransfer',{transferId:el('accId').value,toCustodian:el('accName').value}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('HOTO completed',true);nav('transfer');
  });
}

function renderMaint(){
  el('ttl').textContent='Maintenance & servicing';
  el('content').innerHTML='<div class="card"><button type="button" class="btn green" onclick="editMaint()">Raise ticket</button> <button type="button" class="btn" onclick="loadMaint()">Refresh</button></div><div id="mOut"></div>';
  Promise.all([api('listAssets',{}),api('listMaint',{})]).then(function(arr){
    ASSETS=arr[0].j.assets||[];MAINT=arr[1].j.tickets||[];paintMaint();
  });
}
function loadMaint(){api('listMaint',{}).then(function(res){MAINT=res.j.tickets||[];paintMaint();});}
function paintMaint(){
  el('mOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Asset</th><th>Kind</th><th>Title</th><th>Vendor</th><th>Next / sched</th><th>Status</th><th></th></tr></thead><tbody>'+
    MAINT.map(function(m,i){
      return '<tr><td><span class="codepill">'+h(m.assetCode)+'</span></td><td>'+h(m.kind)+'</td><td>'+h(m.title)+'</td><td>'+h(m.vendorName)+'</td><td>'+h(m.nextServiceDate||m.scheduledDate)+'</td><td>'+h(m.status)+'</td>'+
        '<td><button type="button" class="btn grey" onclick="editMaint('+i+')">Edit</button></td></tr>';
    }).join('')+'</tbody></table></div></div>';
}
function editMaint(i){
  var m=typeof i==='number'?MAINT[i]:null;
  if(!ASSETS.length){api('listAssets',{}).then(function(res){ASSETS=res.j.assets||[];editMaint(i);});return;}
  el('content').innerHTML='<div class="card"><h3>'+(m?'Edit':'Raise')+' maintenance</h3>'+
    '<input type="hidden" id="mId" value="'+h(m&&m.id||'')+'">'+
    '<div class="row2"><div><label>Asset</label><select id="mAsset">'+assetOpts(m&&m.assetId||'')+'</select></div>'+
    '<div><label>Kind</label><select id="mKind"><option>Breakdown</option><option>Preventive</option><option>AMC</option></select></div></div>'+
    '<label>Title</label><input id="mTitle" value="'+h(m&&m.title||'')+'">'+
    '<label>Detail</label><textarea id="mDet" rows="2">'+h(m&&m.detail||'')+'</textarea>'+
    '<div class="row3"><div><label>Vendor</label><input id="mVen" value="'+h(m&&m.vendorName||'')+'"></div>'+
    '<div><label>AMC ref</label><input id="mAmc" value="'+h(m&&m.amcRef||'')+'"></div>'+
    '<div><label>Cost</label><input type="number" id="mCost" value="'+(m&&m.cost||'')+'"></div></div>'+
    '<div class="row3"><div><label>Scheduled</label><input type="date" id="mSch" value="'+h(m&&m.scheduledDate||'')+'"></div>'+
    '<div><label>Next service</label><input type="date" id="mNext" value="'+h(m&&m.nextServiceDate||'')+'"></div>'+
    '<div><label>Status</label><select id="mSt"><option>Raised</option><option>InProgress</option><option>Resolved</option><option>Closed</option></select></div></div>'+
    '<button type="button" class="btn green" onclick="saveMaint()">Save</button> <button type="button" class="btn grey" onclick="nav(\\''+'maint'+'\\')">Cancel</button></div>';
  if(m){el('mKind').value=m.kind||'Breakdown';el('mSt').value=m.status||'Raised';}
}
function saveMaint(){
  api('saveMaint',{
    id:el('mId').value,assetId:el('mAsset').value,kind:el('mKind').value,title:el('mTitle').value,detail:el('mDet').value,
    vendorName:el('mVen').value,amcRef:el('mAmc').value,cost:el('mCost').value,scheduledDate:el('mSch').value,
    nextServiceDate:el('mNext').value,status:el('mSt').value
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Ticket saved',true);nav('maint');
  });
}

function renderLifecycle(){
  el('ttl').textContent='Lifecycle & write-off';
  el('content').innerHTML='<div class="card"><button type="button" class="btn amb" onclick="reqWo()">Request write-off</button> <button type="button" class="btn" onclick="loadWo()">Refresh</button>'+
    '<p class="muted" style="margin-top:8px">Management approves condemn / auction / scrap / donate.</p></div><div id="woOut"></div>';
  Promise.all([api('listAssets',{}),api('listWriteOffs',{})]).then(function(arr){
    ASSETS=arr[0].j.assets||[];WOS=arr[1].j.writeoffs||[];paintWo();
  });
}
function loadWo(){api('listWriteOffs',{}).then(function(res){WOS=res.j.writeoffs||[];paintWo();});}
function paintWo(){
  el('woOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Asset</th><th>Method</th><th>Reason</th><th>Requested</th><th>Status</th><th></th></tr></thead><tbody>'+
    WOS.map(function(w){
      var act='';
      if(IS_MGMT&&w.status==='Pending'){
        act='<button type="button" class="btn green" onclick="decideWo(\\''+h(w.id)+'\\',true)">Approve</button> '+
          '<button type="button" class="btn r" onclick="decideWo(\\''+h(w.id)+'\\',false)">Reject</button>';
      }
      return '<tr><td><span class="codepill">'+h(w.assetCode)+'</span> '+h(w.assetName)+'</td><td>'+h(w.method)+'</td><td>'+h(w.reason)+'</td>'+
        '<td>'+h(w.requestedBy)+'<br><span class="muted">'+(w.requestedAt||'').slice(0,10)+'</span></td><td>'+h(w.status)+'</td><td>'+act+'</td></tr>';
    }).join('')+'</tbody></table></div></div>';
}
function reqWo(){
  if(!ASSETS.length){api('listAssets',{}).then(function(res){ASSETS=res.j.assets||[];reqWo();});return;}
  el('content').innerHTML='<div class="card"><h3>Request write-off</h3>'+
    '<label>Asset</label><select id="woAsset">'+assetOpts('')+'</select>'+
    '<div class="row2"><div><label>Method</label><select id="woMeth"><option>Condemn</option><option>Auction</option><option>Scrap</option><option>Donate</option></select></div>'+
    '<div><label>Reason</label><input id="woReason"></div></div>'+
    '<button type="button" class="btn amb" onclick="saveWoReq()">Submit</button> <button type="button" class="btn grey" onclick="nav(\\''+'lifecycle'+'\\')">Cancel</button></div>';
}
function saveWoReq(){
  api('requestWriteOff',{assetId:el('woAsset').value,method:el('woMeth').value,reason:el('woReason').value}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Write-off requested',true);nav('lifecycle');
  });
}
function decideWo(id,approve){
  api('decideWriteOff',{writeOffId:id,approve:approve}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast(approve?'Approved':'Rejected',true);loadWo();
  });
}

function renderAlerts(){
  el('ttl').textContent='Alerts';
  el('content').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  api('alerts',{}).then(function(res){
    el('content').innerHTML='<div class="card"><h3>Warranty · AMC · Repair · HOTO · Write-off</h3>'+alertsHtml(res.j.alerts||[])+'</div>';
  });
}

function onOtpLogin(){
  document.documentElement.classList.add('aa-authed');
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
    CTX.categories=res.j.categories||[];CTX.tiers=res.j.tiers||[];
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

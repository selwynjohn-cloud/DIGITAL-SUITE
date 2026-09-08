import { SUITE_APP_FOOTER_CSS, suiteAppOpenPageFooterHtml } from '../suite-app-footer.js'
import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../suite-tap-feedback.js'
import type { AvmHqClient } from './hq-store.js'

function esc(s: string) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Separate Officer and Gate doors. Gate needs Officer-issued PIN. No Agile email PIN. */
export function clientPortalPage(client: AvmHqClient): string {
  const tokenJs = JSON.stringify(client.linkToken)
  const companyJs = JSON.stringify(client.companyName)
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Visitor Management — ${esc(client.companyName)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:14px}
.card{background:#111a30;border:1px solid #22304f;border-radius:14px;padding:24px;margin-bottom:16px}
.card h2{color:#fff;margin-bottom:8px}
input,select,textarea{width:100%;padding:9px 11px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:14px}
label{display:block;font-size:12px;color:#94a3b8;margin:8px 0 3px;font-weight:700}
.btn{padding:11px 18px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:14px;background:#0ea5e9;color:#fff}
.gold{background:#c9a84c;color:#14224f}.grey{background:#334155;color:#e2e8f0}.green{background:#16a34a;color:#fff}.r{background:#dc2626;color:#fff}
.doors{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:720px;margin:8vh auto;padding:16px}
@media(max-width:700px){.doors{grid-template-columns:1fr}}
.door{background:#111a30;border:1px solid #22304f;border-radius:16px;padding:28px 20px;text-align:center;cursor:pointer}
.door:hover{border-color:#0ea5e9}.door b{display:block;color:#fff;font-size:22px;margin:8px 0}.door p{color:#94a3b8;line-height:1.5}
.pin{text-align:center;font-size:28px;letter-spacing:.35em;padding:16px}
.side{position:fixed;top:0;left:0;bottom:0;width:230px;background:#0e1730;border-right:1px solid #22304f;display:flex;flex-direction:column;overflow-y:auto}
.brand{padding:18px 16px;text-align:center;border-bottom:1px solid #22304f}.brand img{height:48px;background:transparent}.brand b{display:block;color:#fff;font-size:13px;margin-top:6px;line-height:1.35}.brand small{color:#38bdf8;font-size:11px}
.menu{padding:8px;flex:1}.mi{display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:9px;color:#cbd5e1;cursor:pointer;font-weight:600}.mi:hover{background:#16223f}.mi.active{background:#0ea5e9;color:#fff}
.logout{padding:12px 16px;border-top:1px solid #22304f;color:#94a3b8;cursor:pointer;font-size:13px}
.main{margin-left:230px;min-height:100vh}
.bar{background:#111a30;border-bottom:1px solid #22304f;padding:12px 18px;display:flex;justify-content:space-between;align-items:center}
.bar b{color:#fff;font-size:16px}.content{padding:18px}
.burger{display:none;background:#0ea5e9;color:#fff;border:none;border-radius:8px;padding:8px 12px;font-weight:800}
@media(max-width:820px){.side{transform:translateX(-100%);transition:.2s;z-index:50}.side.open{transform:none}.main{margin-left:0}.burger{display:inline-block}}
.tblwrap{overflow-x:auto;border:1px solid #22304f;border-radius:8px}table{border-collapse:collapse;width:100%;font-size:13px}
th,td{border:1px solid #22304f;padding:6px;text-align:left}th{background:#0b1220;color:#94a3b8;font-size:11px;text-transform:uppercase}
.face{width:56px;height:56px;object-fit:cover;border-radius:8px}.row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.hidden{display:none!important}
${SUITE_TAP_FEEDBACK_CSS}
${SUITE_APP_FOOTER_CSS}
</style></head>
<body>
<div id="chooser">
  <div style="text-align:center;padding-top:28px"><img src="https://www.agilegroup-digital.co.in/agile-logo-clear.png" alt="Agile" style="height:52px;background:transparent"><h1 style="color:#fff;font-size:20px;margin-top:10px" id="coTitle"></h1><p style="color:#94a3b8">Visitor Management · no Agile email login</p></div>
  <div class="doors">
    <div class="door" onclick="openOfficer()"><span style="font-size:36px">👔</span><b>Staff</b><p>Staff portal. Pick your registered name and enter the PIN sent on WhatsApp. You may view today’s Gate list (no add / edit).</p></div>
    <div class="door" onclick="openGate()"><span style="font-size:36px">🚪</span><b>Gate</b><p>Register today’s shift — Name, ID, Phone. PIN comes on WhatsApp. Use it to login, and enter it again every time you issue a Gate pass.</p></div>
  </div>
</div>
<div id="shell" class="hidden">
  <div class="side" id="side">
    <div class="brand"><img src="https://www.agilegroup-digital.co.in/agile-logo-clear.png" alt="Agile"><b id="coName"></b><small id="doorTag">Portal</small></div>
    <div class="menu" id="menu"></div>
    <div class="logout" onclick="goHome()">← Back to doors</div>
  </div>
  <div class="main">
    <div class="bar"><div style="display:flex;align-items:center;gap:12px"><button class="burger" type="button" onclick="document.getElementById('side').classList.toggle('open')">☰</button><b id="ttl">Start</b></div><span id="who" style="color:#94a3b8;font-size:12px"></span></div>
    <div class="content" id="content"></div>
  </div>
</div>
<script>
${suiteTapFeedbackInitScript()}
var TOKEN=${tokenJs};
var COMPANY=${companyJs};
var BOOT=null,CUR=0,ME=null,DOOR='',FOUND=null,EDIT=null;
var OFFICER_MENU=[
  {n:'New Invitation',fn:'inviteForm',icon:'✉️'},
  {n:'Pending Approval',fn:'pending',icon:'⏳'},
  {n:'Officer papers',fn:'officerPapers',icon:'🪪'},
  {n:'Buildings & Hosts',fn:'buildingsHosts',icon:'🏢'},
  {n:'User management',fn:'userMgmt',icon:'👥'},
  {n:'Service Complaints',fn:'clientComplaints',icon:'🎫'},
  {n:'Guards Portal',fn:'gateView',icon:'🛡️'}
];
var GATE_MENU=[{n:'Today’s Gate',fn:'gate',icon:'🛡️'}];
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function api(action,extra){
  return fetch('/api/visitors/client-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,token:TOKEN,staffId:ME&&ME.staffName?ME.id:'',dutyId:ME&&ME.guardName?ME.id:''},extra||{}))}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});
}
function visits(){return (BOOT&&BOOT.visits)||[];}
function gateVisits(){return (BOOT&&BOOT.gateVisits)||[];}
function buildings(){return (BOOT&&BOOT.buildings)||[];}
function hosts(){return (BOOT&&BOOT.hosts)||[];}
function staff(){return (BOOT&&BOOT.staff)||[];}
function officers(){return (BOOT&&BOOT.officers)||[];}
function gates(){return (BOOT&&BOOT.gates)||[];}
function duties(){return (BOOT&&BOOT.duties)||[];}
function canUsers(){return !!(ME&&(ME.canManageUsers||ME.role==='manager'));}
function activeMenu(){
  if(DOOR==='gate')return GATE_MENU;
  return canUsers()?OFFICER_MENU:OFFICER_MENU.filter(function(m){return m.fn!=='userMgmt';});
}
function buildMenu(){
  var menu=activeMenu();
  el('menu').innerHTML=menu.map(function(m,i){return '<div class="mi'+(CUR===i?' active':'')+'" onclick="tab('+i+')"><span>'+m.icon+'</span>'+h(m.n)+'</div>';}).join('');
}
function tab(i){CUR=i;EDIT=null;buildMenu();el('ttl').textContent=activeMenu()[i].n;el('side').classList.remove('open');window[activeMenu()[i].fn]();}
function reload(then){
  return api('boot').then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not load.');return;}
    BOOT=res.j;if(then)then();
  });
}
function showShell(){
  el('chooser').classList.add('hidden');el('shell').classList.remove('hidden');
  el('coName').textContent=COMPANY;el('doorTag').textContent=DOOR==='gate'?'Gate':'Staff portal';
  el('who').textContent=ME?(ME.guardName?(ME.guardName+' · '+ME.gateName):(ME.staffName+(ME.role==='manager'?' · Security Manager':''))):'';
}
function goHome(){ME=null;DOOR='';el('shell').classList.add('hidden');el('chooser').classList.remove('hidden');}
function openOfficer(){DOOR='officer';reload(officerStart);}
function openGate(){DOOR='gate';reload(gateStart);}

function pinLoginCard(title,hint,selectId,pinId,btnFn,names){
  var opts=names.map(function(u){return '<option value="'+a(u.id)+'">'+h(u.staffName)+' · '+h(u.idNo)+'</option>';}).join('');
  return '<div class="card" style="max-width:420px;margin:6vh auto"><h2>'+h(title)+'</h2><p style="color:#94a3b8;margin:10px 0 16px">'+h(hint)+'</p>'+
    (opts?'<label>Registered name *</label><select id="'+selectId+'"><option value="">— pick your name —</option>'+opts+'</select>':'<p style="color:#fca5a5">No registered name yet. Ask Agile Management to add you and send a PIN on WhatsApp.</p>')+
    '<label>PIN sent on WhatsApp *</label><input id="'+pinId+'" class="pin" inputmode="numeric" maxlength="6" placeholder="••••••">'+
    (opts?'<div class="row" style="justify-content:center"><button class="btn gold" type="button" onclick="'+btnFn+'()">Log in</button></div>':'')+
    '</div>'+suiteAppFooter();
}
function staffProcessCard(){
  return '<div class="card" style="max-width:640px;margin:2vh auto 0"><h2>Staff portal — the process</h2>'+
    '<ol style="color:#cbd5e1;margin:10px 0 0 20px;line-height:1.75">'+
    '<li>Agile Management adds your name on User management and sends a PIN on WhatsApp.</li>'+
    '<li>Open this company link and tap <b>Staff</b>.</li>'+
    '<li>Pick your registered name.</li>'+
    '<li>Type the 6-digit PIN from WhatsApp.</li>'+
    '<li>Tap <b>Log in</b>. There is no Agile email PIN on this page.</li>'+
    '<li>After login you can use: New Invitation, Pending Approval, Officer papers, Buildings &amp; Hosts, Service Complaints, and Guards Portal (view only — no add / edit). A Security Manager can also open User management.</li>'+
    '</ol></div>';
}
function officerStart(){
  showShell();el('ttl').textContent='Staff portal';el('menu').innerHTML='';
  el('content').innerHTML=staffProcessCard()+pinLoginCard('Staff portal — log in','Only a registered name with a PIN can log in. PIN comes on WhatsApp from Agile Management.','oid','spin','startOfficer',officers());
}
function startOfficer(){
  var id=el('oid')&&el('oid').value;
  var pin=el('spin')&&el('spin').value;
  if(!id){alert('Pick your registered name.');return;}
  if(!pin){alert('Enter the PIN sent on WhatsApp.');return;}
  api('staffLogin',{staffId:id,pin:pin}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not start.');return;}
    ME=res.j.staff;showShell();buildMenu();tab(0);
  });
}

function gateStart(){
  showShell();el('ttl').textContent='Gate';el('menu').innerHTML='';
  var dopts=duties().map(function(d){return '<option value="'+a(d.id)+'">'+h(d.guardName)+' · '+h(d.idNo)+' · '+h(d.shift)+'</option>';}).join('');
  el('content').innerHTML='<div class="card" style="max-width:480px;margin:4vh auto"><h2>Register today’s shift</h2><p style="color:#94a3b8;margin:10px 0 16px">Enter your name, ID and phone. A new PIN is made for this shift. It comes on WhatsApp. Use it to login, and enter it again every time you issue a Gate pass. The PIN changes every shift.</p>'+
    '<label>Shift *</label><select id="rshift"><option>Shift A (Morning)</option><option>Shift B (Afternoon)</option><option>Shift C (Night)</option></select>'+
    '<label>Your name *</label><input id="rname">'+
    '<label>ID *</label><input id="ridno">'+
    '<label>Phone *</label><input id="rmob" inputmode="numeric">'+
    '<div class="row"><button class="btn green" type="button" onclick="registerShift()">Register shift — get PIN</button></div>'+
    '<div class="msg" id="rmsg" style="display:none"></div></div>'+
    '<div class="card" style="max-width:480px;margin:0 auto 4vh"><h2>Login with today’s PIN</h2><p style="color:#94a3b8;margin:10px 0 16px">If you already registered this shift, pick your name and enter the PIN sent on WhatsApp.</p>'+
    (dopts?'<label>Today’s shift *</label><select id="gid"><option value="">— pick your name —</option>'+dopts+'</select>':'<p style="color:#fca5a5">No shift registered yet today. Fill the form above first.</p>')+
    '<label>PIN sent on WhatsApp *</label><input id="gpin" class="pin" inputmode="numeric" maxlength="6" placeholder="••••••">'+
    (dopts?'<div class="row" style="justify-content:center"><button class="btn gold" type="button" onclick="enterGate()">Log in</button></div>':'')+
    '</div>'+suiteAppFooter();
}
function registerShift(){
  var name=el('rname')&&el('rname').value;
  var idNo=el('ridno')&&el('ridno').value;
  var mobile=el('rmob')&&el('rmob').value;
  if(!name||!idNo){alert('Enter your name and ID.');return;}
  if(!mobile){alert('Enter your phone. PIN goes on WhatsApp.');return;}
  api('registerShiftDuty',{shift:el('rshift').value,guardName:name,idNo:idNo,mobile:mobile}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not register.');return;}
    if(res.j.pinSent)alert('PIN sent on WhatsApp. Use it to login, and enter it again each time you issue a Gate pass.');
    else if(res.j.pin)alert('WhatsApp could not go. Your PIN is '+res.j.pin+' — keep it. Enter it to login and for every Gate pass.');
    reload(gateStart);
  });
}
function enterGate(){
  var id=el('gid')&&el('gid').value;
  var pin=el('gpin')&&el('gpin').value;
  if(!id){alert('Pick your registered shift.');return;}
  if(!pin){alert('Enter the PIN sent on WhatsApp.');return;}
  api('shiftLogin',{dutyId:id,pin:pin}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'PIN not accepted.');return;}
    ME=res.j.duty;showShell();buildMenu();tab(0);
  });
}

function userMgmt(){
  if(!canUsers()){el('content').innerHTML='<div class="card"><p>User management is for the Security Manager only. Names are added by Agile Management.</p></div>';return;}
  var rows=staff().map(function(u,i){
    return '<tr><td>'+(i+1)+'</td><td>'+h(u.staffName)+'</td><td>'+h(u.idNo)+'</td><td>'+h(u.email)+'</td><td>'+h(u.mobile)+'</td><td>'+h(u.role==='manager'?'Security Manager':u.role==='guard'?'Guard':'Staff')+'</td><td>'+(u.active?'Active':'Off')+'</td><td>'+(u.hasPin?'PIN sent':'Need PIN')+'</td></tr>';
  }).join('')||'<tr><td colspan="8">No names yet. Ask Agile Management to add Staff or Guards and send a PIN on WhatsApp.</td></tr>';
  el('content').innerHTML='<div class="card"><h2>User management</h2><p style="color:#94a3b8">View only on this portal. Agile Management adds names, deletes names, and taps Refresh PIN. PIN goes on WhatsApp.</p></div>'+
    '<div class="card"><div class="tblwrap"><table><thead><tr><th>sl.</th><th>Name</th><th>ID no.</th><th>email</th><th>mobile</th><th>Role</th><th>Status</th><th>PIN</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+suiteAppFooter();
}
function editStaff(id){EDIT=staff().filter(function(u){return u.id===id;})[0]||null;userMgmt();}
function saveStaff(){
  api('saveStaff',{id:el('sid').value,staffName:el('sname').value,idNo:el('sidno').value,email:el('semail').value,mobile:el('smob').value,role:el('srole').value,canManageUsers:el('srole').value==='manager'}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not save.');return;}
    EDIT=null;reload(userMgmt);
  });
}
function offStaff(id){
  if(!confirm('Deactivate this staff? They cannot work until you add them again.'))return;
  api('deactivateStaff',{id:id}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not deactivate.');return;}
    reload(userMgmt);
  });
}
function givePin(id,back){
  if(!confirm('Create a new Gate PIN for this Guard? Tell them the number. It will show only once.'))return;
  api('issueGatePin',{id:id}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not make PIN.');return;}
    alert('PIN for '+res.j.staffName+': '+res.j.pin+'\\n\\nGive this number to the Guard. They enter it on the Gate door.');
    reload(back||userMgmt);
  });
}
function givePinPage(){
  var rows=staff().filter(function(u){return u.role==='guard'&&u.active;});
  var html='<div class="card"><h2>Give Gate PIN</h2><p style="color:#94a3b8">Make a 6-digit PIN and tell the Guard. They open the <b>Gate</b> door and type this number. The PIN shows only once.</p></div>';
  if(!rows.length){
    el('content').innerHTML=html+'<div class="card"><p>No Guard is on the list yet. Ask the Security Manager to add a Guard in User management (Name · ID no. · email · mobile).</p></div>'+suiteAppFooter();
    return;
  }
  html+='<div class="card"><div class="tblwrap"><table><thead><tr><th>Name</th><th>ID no.</th><th>mobile</th><th>PIN</th><th></th></tr></thead><tbody>';
  rows.forEach(function(u){
    html+='<tr><td>'+h(u.staffName)+'</td><td>'+h(u.idNo)+'</td><td>'+h(u.mobile||'—')+'</td><td>'+(u.hasPin?'PIN given':'Need PIN')+'</td><td><button class="btn gold" type="button" onclick="givePin(\\''+u.id+'\\',givePinPage)">Give Gate PIN</button></td></tr>';
  });
  el('content').innerHTML=html+'</tbody></table></div></div>'+suiteAppFooter();
}

function face(v){return v.facePhoto?'<img class="face" alt="" src="'+String(v.facePhoto).replace(/"/g,'')+'">':'';}
function gate(){
  var rows=gateVisits().filter(function(v){return v.status==='approved'||v.status==='arrived';});
  var html='<div class="card"><h2>Today’s Gate</h2><p style="color:#94a3b8">Name, company and mobile only. No ID photos. Enter your shift PIN every time you issue a Gate pass.</p>'+
    '<label>PIN to issue Gate pass (every time) *</label><input id="issuePin" class="pin" inputmode="numeric" maxlength="6" placeholder="••••••">'+
    '<label>Scan or type pass</label><input id="passIn" placeholder="AVM-XXXXXX"><p style="margin-top:10px"><button class="btn" type="button" onclick="findPass()">Find pass</button></p><div id="found"></div></div>'+
    '<div class="card"><div class="tblwrap"><table><thead><tr><th>Visitor</th><th>Company</th><th>Mobile</th><th>Pass</th><th></th></tr></thead><tbody>';
  if(!rows.length)html+='<tr><td colspan="5">No approved visitors waiting.</td></tr>';
  rows.forEach(function(v){
    html+='<tr><td>'+h(v.visitorName||'—')+'</td><td>'+h(v.visitorCompany||'—')+'</td><td>'+h(v.visitorMobile)+'</td><td>'+h(v.passCode||'—')+'</td><td>'+
      '<button class="btn green" type="button" onclick="gateAct(\\''+v.id+'\\',\\'checkIn\\')">Check In</button> '+
      '<button class="btn gold" type="button" onclick="gateAct(\\''+v.id+'\\',\\'issueCard\\')">Issue Gate pass</button> '+
      '<button class="btn r" type="button" onclick="doClose(\\''+v.id+'\\')">Close Visit</button></td></tr>';
  });
  el('content').innerHTML=html+'</tbody></table></div></div>'+suiteAppFooter();
}
function gateView(){
  var rows=gateVisits().filter(function(v){return v.status==='approved'||v.status==='arrived';});
  var html='<div class="card"><h2>Guards Portal</h2><p style="color:#94a3b8">View only — no add / edit. Name, company and mobile. Today’s Gate list. Staff cannot issue a Gate pass from here.</p></div>'+
    '<div class="card"><div class="tblwrap"><table><thead><tr><th>Visitor</th><th>Company</th><th>Mobile</th><th>Pass</th></tr></thead><tbody>';
  if(!rows.length)html+='<tr><td colspan="4">No approved visitors waiting.</td></tr>';
  rows.forEach(function(v){
    html+='<tr><td>'+h(v.visitorName||'—')+'</td><td>'+h(v.visitorCompany||'—')+'</td><td>'+h(v.visitorMobile)+'</td><td>'+h(v.passCode||'—')+'</td></tr>';
  });
  el('content').innerHTML=html+'</tbody></table></div></div>'+suiteAppFooter();
}
function findPass(){
  api('findPass',{passCode:el('passIn').value}).then(function(res){
    var box=el('found');
    if(res.s!==200){box.innerHTML='<p style="color:#fca5a5">'+(res.j.error||'Not found')+'</p>';return;}
    var v=res.j.visit;FOUND=v;
    box.innerHTML='<p><b>'+h(v.visitorName)+'</b> · '+h(v.visitorCompany||'')+' · '+h(v.visitorMobile)+'</p>'+
      '<button class="btn green" type="button" onclick="gateAct(\\''+v.id+'\\',\\'checkIn\\')">Check In</button> '+
      '<button class="btn gold" type="button" onclick="gateAct(\\''+v.id+'\\',\\'issueCard\\')">Issue Gate pass</button>';
  });
}
function gateAct(id,kind){
  var extra={visitId:id};
  if(kind==='issueCard'){
    extra.pin=el('issuePin')&&el('issuePin').value||'';
    if(!extra.pin){alert('Enter your shift PIN to issue a Gate pass.');return;}
  }
  api(kind,extra).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not update.');return;}
    if(kind==='issueCard'){
      if(el('issuePin'))el('issuePin').value='';
      if(res.j.visit&&res.j.visit.cardCode)alert('Gate pass '+res.j.visit.cardCode);
    }
    reload(gate);
  });
}
function doClose(id){
  if(!confirm('Close this visit now?'))return;
  api('closeVisit',{visitId:id}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not close.');return;}
    reload(gate);
  });
}
function inviteForm(){
  var bopts=buildings().filter(function(b){return b.active!==false;}).map(function(b){return '<option value="'+a(b.id)+'">'+h(b.name)+'</option>';}).join('');
  var hopts=hosts().filter(function(x){return x.active!==false;}).map(function(x){return '<option value="'+a(x.id)+'">'+h(x.name)+' — '+h(x.department)+'</option>';}).join('');
  el('content').innerHTML='<div class="card"><h2>Create Invitation</h2>'+
    '<label>Visitor mobile *</label><input id="vmob" inputmode="numeric">'+
    '<label>Visitor company name (if any)</label><input id="vco">'+
    '<p style="color:#94a3b8;font-size:12px">If you type a company name, the visitor must upload a company ID card with photo — not a visiting card.</p>'+
    '<label>Building *</label><select id="bldg"><option value="">— select —</option>'+bopts+'</select>'+
    '<label>Meeting with (officer) *</label><select id="host"><option value="">— select —</option>'+hopts+'</select>'+
    '<label>Escort required</label><select id="esc"><option value="no">No</option><option value="yes">Yes</option></select>'+
    '<label>Escort mobile</label><input id="emob" inputmode="numeric">'+
    '<label>Visit date *</label><input id="vdate" type="date"><label>From</label><input id="vfrom" type="time"><label>To</label><input id="vto" type="time">'+
    '<p style="margin-top:14px"><button class="btn gold" type="button" onclick="sendInvite()">Send Invite</button></p></div>'+suiteAppFooter();
  el('vdate').value=new Date().toISOString().slice(0,10);
}
function sendInvite(){
  api('sendInvite',{visitorMobile:el('vmob').value,visitorCompany:el('vco').value,buildingId:el('bldg').value,hostId:el('host').value,escortRequired:el('esc').value,escortMobile:el('emob').value,visitDate:el('vdate').value,windowFrom:el('vfrom').value,windowTo:el('vto').value}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not send.');return;}
    alert('Invite sent.');reload(inviteForm);
  });
}
function pending(){
  var rows=visits().filter(function(v){return v.status==='registered';});
  var html='<div class="card"><h2>Pending Approval</h2><div class="tblwrap"><table><thead><tr><th>Photo</th><th>Visitor</th><th>Company</th><th>ID</th><th></th></tr></thead><tbody>';
  if(!rows.length)html+='<tr><td colspan="5">No pending visitors.</td></tr>';
  rows.forEach(function(v){
    html+='<tr><td>'+face(v)+'</td><td>'+h(v.visitorName)+'<br><small>'+h(v.visitorMobile)+'</small></td><td>'+h(v.visitorCompany||'—')+'</td><td>'+(v.govIdPhoto?'<img class="face" alt="ID" src="'+String(v.govIdPhoto).replace(/"/g,'')+'">':'')+(v.companyIdPhoto?'<img class="face" alt="Company ID" src="'+String(v.companyIdPhoto).replace(/"/g,'')+'">':'')+'</td><td><button class="btn green" type="button" onclick="decide(\\''+v.id+'\\',\\'approve\\')">Approve</button> <button class="btn r" type="button" onclick="decide(\\''+v.id+'\\',\\'reject\\')">Reject</button></td></tr>';
  });
  el('content').innerHTML=html+'</tbody></table></div></div>'+suiteAppFooter();
}
function decide(id,kind){
  api(kind,{visitId:id}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not update.');return;}
    reload(pending);
  });
}
function officerPapers(){
  var rows=visits();
  var html='<div class="card"><h2>Officer papers</h2><div class="tblwrap"><table><thead><tr><th>Visitor</th><th>Read name</th><th>Papers</th><th></th></tr></thead><tbody>';
  if(!rows.length)html+='<tr><td colspan="4">No open papers.</td></tr>';
  rows.forEach(function(v){
    html+='<tr><td>'+h(v.visitorName)+'</td><td>'+h(v.ocrName||'—')+'</td><td>'+(v.govIdPhoto?'<img class="face" alt="ID" src="'+String(v.govIdPhoto).replace(/"/g,'')+'">':'')+(v.companyIdPhoto?'<img class="face" alt="Company ID" src="'+String(v.companyIdPhoto).replace(/"/g,'')+'">':'')+'</td><td><button class="btn r" type="button" onclick="delDocs(\\''+v.id+'\\')">Delete papers</button></td></tr>';
  });
  el('content').innerHTML=html+'</tbody></table></div></div>'+suiteAppFooter();
}
function delDocs(id){
  if(!confirm('Delete identity papers for this visitor now?'))return;
  api('deleteOfficerDocs',{visitId:id}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not delete.');return;}
    reload(officerPapers);
  });
}
function buildingsHosts(){
  var bhtml=buildings().map(function(b){return '<tr><td>'+h(b.name)+'</td></tr>';}).join('')||'<tr><td>No buildings yet.</td></tr>';
  var hhtml=hosts().map(function(x){return '<tr><td>'+h(x.name)+'</td><td>'+h(x.department)+'</td><td>'+h(x.mobile)+'</td></tr>';}).join('')||'<tr><td colspan="3">No hosts yet.</td></tr>';
  el('content').innerHTML='<div class="card"><h2>Add building</h2><label>Building name</label><input id="nbName"><p style="margin-top:10px"><button class="btn green" type="button" onclick="saveBldg()">Save building</button></p></div>'+
    '<div class="card"><h2>Add host officer</h2><label>Name</label><input id="nhName"><label>Mobile</label><input id="nhMob" inputmode="numeric"><label>Mail id</label><input id="nhEm" type="email"><label>Department</label><input id="nhDept"><label>Building</label><select id="nhBldg">'+buildings().map(function(b){return '<option value="'+a(b.id)+'">'+h(b.name)+'</option>';}).join('')+'</select>'+
    '<p style="margin-top:10px"><button class="btn green" type="button" onclick="saveHost()">Save host</button></p></div>'+
    '<div class="card"><h2>Buildings</h2><div class="tblwrap"><table><thead><tr><th>Building</th></tr></thead><tbody>'+bhtml+'</tbody></table></div></div>'+
    '<div class="card"><h2>Hosts</h2><div class="tblwrap"><table><thead><tr><th>Name</th><th>Department</th><th>Mobile</th></tr></thead><tbody>'+hhtml+'</tbody></table></div></div>'+suiteAppFooter();
}
function saveBldg(){
  api('saveBuilding',{name:el('nbName').value}).then(function(res){if(res.s!==200){alert((res.j&&res.j.error)||'Could not save.');return;}reload(buildingsHosts);});
}
function saveHost(){
  api('saveHost',{name:el('nhName').value,mobile:el('nhMob').value,email:el('nhEm').value,department:el('nhDept').value,buildingId:el('nhBldg').value}).then(function(res){if(res.s!==200){alert((res.j&&res.j.error)||'Could not save.');return;}reload(buildingsHosts);});
}
function clientComplaints(){
  var rows=((BOOT&&BOOT.complaints)||[]).map(function(r){
    return '<tr><td>'+h(r.ticketNo)+'</td><td>'+h(r.ymd)+' '+h(r.time)+'</td><td>'+h(r.receivedFrom)+'</td><td>'+h(r.issue)+'</td><td>'+h(r.status==='completed'?'Completed':(r.status==='review-draft'?'Review Draft mail':'Under process'))+'</td></tr>';
  }).join('')||'<tr><td colspan="5">No service complaints yet.</td></tr>';
  el('content').innerHTML='<div class="card"><h2>Service Complaints</h2><p style="color:#94a3b8">Client Name is <b>'+h(COMPANY)+'</b> (registered client). Token No. is auto.</p>'+
    '<label>Complaint by (Name of the staff) *</label><input id="tfrom">'+
    '<label>email Id *</label><input id="temail" type="email">'+
    '<label>Mobile No.</label><input id="tmob" inputmode="numeric">'+
    '<label>Nature of complaint *</label><textarea id="tissue"></textarea>'+
    '<div class="row"><button class="btn green" type="button" onclick="sendClientComplaint()">Save</button></div></div>'+
    '<div class="card"><div class="tblwrap"><table><thead><tr><th>Token No.</th><th>Date and time</th><th>Complaint by</th><th>Nature of complaint</th><th>Status</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+suiteAppFooter();
}
function sendClientComplaint(){
  api('addComplaint',{receivedFrom:el('tfrom').value,email:el('temail').value,mobile:el('tmob').value,issue:el('tissue').value}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not save.');return;}
    alert('Saved. Token No. '+res.j.complaint.ticketNo);
    reload(clientComplaints);
  });
}
function suiteAppFooter(){return ${JSON.stringify(suiteAppOpenPageFooterHtml())};}
el('coTitle').textContent=COMPANY;
(function(){
  var hash=String(location.hash||'').replace('#','');
  if(hash==='staff')openOfficer();
  else if(hash==='gate')openGate();
})();
</script>
</body></html>`
}

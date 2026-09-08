/**
 * Agile Control — Phase 1 Command Centre console (Staff + Management portals).
 * Left sidebar menus (suite standard).
 */

import type { VercelRequest } from '@vercel/node'
import { otpLoginHtml, otpLoginScript } from '../embedded-otp.js'
import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../suite-tap-feedback.js'
import { suiteDateInputInitScript } from '../suite-date-input.js'
import { GUARD_CATEGORIES } from '../guards/store.js'

function portalFromReq(req: VercelRequest): 'staff' | 'management' {
  const q = req.query || {}
  const p = String(q.portal || '').toLowerCase()
  if (p === 'management' || p === 'mgmt') return 'management'
  return 'staff'
}

/** Full HTML SPA for Command Centre (staff) and Management portal. */
export function renderAcConsole(req: VercelRequest): string {
  const portal = portalFromReq(req)
  const isMgmt = portal === 'management'
  const title = isMgmt ? 'Agile Control — Management' : 'Agile Control — Staff'
  const login = otpLoginHtml(
    title,
    isMgmt
      ? 'Management — Track 1 Control and Track 2 Help Desk. Work email + PIN (no branch).'
      : 'Track 1 Control and Track 2 Help Desk — authorised work email + PIN (no branch).',
  )
  /** Control is department-based — never ask for Chennai/Mumbai branch on Send PIN. */
  const otp = otpLoginScript('control', 'Agile Control', isMgmt ? 'management' : 'staff', {
    skipBranch: true,
  })

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<script>
(function(){
  try{
    var has=!!(sessionStorage.getItem('otp_control')||localStorage.getItem('otp_control'));
    if(has)document.documentElement.className+=' ac-authed';
  }catch(e){}
})();
</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:14px}
html.ac-authed #login{display:none!important}
html.ac-authed #shell{display:flex!important}
#login{max-width:420px;margin:0 auto;padding-top:8vh}
.card{background:#111a30;border:1px solid #22304f;border-radius:14px;padding:18px;margin-bottom:14px}
.card h2,.card h3{color:#fff;margin-bottom:8px}
input,select,textarea{width:100%;padding:9px 11px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:14px}
label{display:block;font-size:12px;color:#94a3b8;margin:8px 0 3px;font-weight:700}
.btn{padding:10px 16px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:13px;background:#a16207;color:#fff;margin:4px 4px 4px 0}
.btn:disabled{opacity:.6;cursor:wait}
.btn.gold,.gold{background:#a16207;color:#fff}
.grey{background:#334155}.green{background:#16a34a}.r{background:#dc2626}.amb{background:#d97706}.sky{background:#0284c7}
.msg{padding:10px;border-radius:8px;font-size:13px;margin-top:10px;display:none}
.hidden{display:none!important}
#shell{display:none;min-height:100vh;width:100%}
.side{position:fixed;top:0;left:0;bottom:0;width:260px;background:#0e1730;border-right:1px solid #22304f;display:flex;flex-direction:column;overflow-y:auto;z-index:40}
.brand{padding:16px;text-align:center;border-bottom:1px solid #22304f}
.brand img{height:46px}.brand b{display:block;color:#fff;font-size:14px;margin-top:8px}
.brand small{color:#fbbf24;font-size:11px;font-weight:700;line-height:1.35}
.menu{padding:8px;flex:1}
.mi{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:9px;color:#cbd5e1;cursor:pointer;font-weight:600;font-size:13px;margin-bottom:2px;border:none;background:transparent;width:100%;text-align:left}
.mi:hover{background:#16223f}.mi.active{background:#a16207;color:#fff}
.mi .ic{width:18px;text-align:center;flex-shrink:0}
.mi.sec{margin-top:8px;opacity:.85;font-size:11px;color:#94a3b8;cursor:default;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
.mi.sec:hover{background:transparent}
.sidefoot{padding:12px 14px;border-top:1px solid #22304f}
.sidefoot button{width:100%;margin:4px 0}
.main{margin-left:260px;min-height:100vh;display:flex;flex-direction:column;width:calc(100% - 260px)}
.bar{background:#111a30;border-bottom:1px solid #22304f;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;position:sticky;top:0;z-index:30}
.bar b{color:#fff;font-size:16px}
.portal-tag{display:inline-block;padding:3px 10px;border-radius:999px;background:rgba(161,98,7,.25);border:1px solid #a16207;color:#fde68a;font-size:11px;font-weight:800;margin-left:8px}
.content{padding:16px;flex:1;max-width:1100px;width:100%}
.burger{display:none;background:#a16207;color:#fff;border:none;border-radius:8px;padding:8px 12px;font-weight:800;cursor:pointer}
@media(max-width:820px){
  .side{transform:translateX(-100%);transition:.2s}
  .side.open{transform:none}
  .main{margin-left:0;width:100%}
  .burger{display:inline-block}
}
.biggrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:12px 0}
.big{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:88px;border-radius:12px;border:1px solid #334155;background:#111a30;color:#fff;font-weight:900;font-size:13px;letter-spacing:.02em;cursor:pointer;padding:12px;text-align:center}
.big span{font-size:11px;font-weight:600;color:#94a3b8;margin-top:4px}
.big.em{background:linear-gradient(145deg,#7f1d1d,#dc2626);border-color:#f87171}
.big.inc{background:linear-gradient(145deg,#9a3412,#ea580c);border-color:#fb923c}
.big.new{background:linear-gradient(145deg,#854d0e,#a16207);border-color:#fbbf24}
.big.call{background:linear-gradient(145deg,#1e3a5f,#0284c7);border-color:#38bdf8}
.big.hoto{background:linear-gradient(145deg,#14532d,#16a34a);border-color:#4ade80}
.kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:10px 0}
.kpi{background:#0e1730;border:1px solid #22304f;border-radius:10px;padding:12px;text-align:center}
.kpi b{display:block;font-size:22px;color:#fde68a}.kpi.bad b{color:#fca5a5}.kpi span{font-size:11px;color:#94a3b8;font-weight:700}
.tblwrap{overflow-x:auto;border:1px solid #22304f;border-radius:8px;margin-top:10px}
table{border-collapse:collapse;width:100%;font-size:12px;min-width:640px}
th,td{border:1px solid #22304f;padding:7px 8px;text-align:left;vertical-align:top}
th{background:#0b1220;color:#94a3b8;font-size:10px;text-transform:uppercase}
tr.clickable{cursor:pointer}tr.clickable:hover td{background:rgba(161,98,7,.15)}
.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:800}
.p1{background:#7f1d1d;color:#fecaca}.p2{background:#9a3412;color:#fed7aa}.p3{background:#854d0e;color:#fde68a}.p4{background:#334155;color:#cbd5e1}
.stamp{display:inline-block;padding:4px 8px;border-radius:6px;font-size:11px;margin:2px;border:1px solid #334155}
.stamp.ok{background:rgba(22,163,74,.25);border-color:#16a34a;color:#86efac}
.stamp.no{background:rgba(51,65,85,.4);color:#94a3b8}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
@media(max-width:720px){.row2,.row3{grid-template-columns:1fr}}
.muted{color:#94a3b8;font-size:12px;line-height:1.45}
.toast{position:fixed;bottom:18px;right:18px;background:#166534;color:#fff;padding:10px 14px;border-radius:8px;font-weight:700;display:none;z-index:99}
.toast.bad{background:#991b1b}
.checkrow{display:flex;align-items:center;gap:8px;margin:6px 0;font-size:13px}
.checkrow input{width:auto}
.timer{font-size:28px;font-weight:900;color:#fbbf24;letter-spacing:.04em}
${SUITE_TAP_FEEDBACK_CSS}
</style></head><body>
${login}
<div id="shell">
  <aside class="side" id="side">
    <div class="brand">
      <img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile">
      <b>Agile Control</b>
      <small id="portalLabel">${isMgmt ? 'Management · Track 1 Control / Track 2 Help Desk' : 'Staff · Track 1 Control / Track 2 Help Desk'}</small>
    </div>
    <div class="menu" id="menu"></div>
    <div class="sidefoot">
      <button type="button" class="btn grey app-tap-btn" id="switchPortalBtn" onclick="switchPortal()">${isMgmt ? 'Open Staff portal' : 'Open Management portal'}</button>
      <button type="button" class="btn grey app-tap-btn" onclick="logout()">Sign out</button>
    </div>
  </aside>
  <div class="main">
    <div class="bar">
      <div>
        <button type="button" class="burger app-tap-btn" onclick="el('side').classList.toggle('open')">Menu</button>
        <b id="ttl">Dashboard</b>
        <span class="portal-tag" id="portalTag">${isMgmt ? 'Management' : 'Staff'}</span>
        <div class="muted" id="who"></div>
      </div>
      <div>
        <button type="button" class="btn grey app-tap-btn" onclick="goOpsTools()">Ops Tools</button>
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
var API='/api/control/data';
var PORTAL=${JSON.stringify(portal)};
var IS_MGMT=${isMgmt ? 'true' : 'false'};
var CTX={email:'',name:'',director:false,canDelete:false,canOpenManagement:false,branches:[],categories:[]};
var USERS_CACHE=[];
/** Same company roles as MIS User Management (updated 17 Aug 2026). */
var USER_ROLES=['Director','President','Admin','CGM','Vice President (VP)','AVP','General Manager (GM)','Regional Manager (RM)','Branch Manager','Operations Manager','Area Manager','Field Officer','Sales Executive','Training Team','Accounts','HR','Control Operator'];
var AC_USERS_VERSION='2026-08-17-roles';
var VIEW='dashboard';
var OPEN_CASES=[];
var CURRENT=null;
var AGE_TIMER=null;

function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function toast(msg,ok){
  var t=el('toast');if(!t)return;
  t.textContent=msg;t.className='toast'+(ok===false?' bad':'');t.style.display='block';
  setTimeout(function(){t.style.display='none';},2800);
}
function api(action,extra){
  if(typeof otpRestoreSession==='function')otpRestoreSession();
  return fetch(API,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,portal:PORTAL},extra||{}))
  }).then(function(r){
    return r.json().then(function(j){
      if(r.status===401&&typeof otpHandleUnauthorized==='function')otpHandleUnauthorized();
      return{s:r.status,j:j};
    });
  });
}
function priCls(p){return 'pill '+(p||'P4').toLowerCase();}
function goOpsTools(){location.href='/control?ops=1&portal='+encodeURIComponent(PORTAL);}
function switchPortal(){
  if(PORTAL!=='management'&&!CTX.canOpenManagement){
    toast('Staff portal only. Ask the Director for Management access.',false);
    return;
  }
  location.href='/control?portal='+(PORTAL==='management'?'staff':'management');
}
function logout(){if(typeof otpLogout==='function')otpLogout();else location.reload();}

function menuItems(){
  return [
    {id:'dashboard',label:'Dashboard',icon:'▣'},
    {id:'_t1',label:'Track 1 · Control',icon:'·',sec:true},
    {id:'incidents',label:'Incident Received',icon:'⚠'},
    {id:'guardcomplaints',label:'Guards Complaint',icon:'🛡'},
    {id:'home',label:'Command Console',icon:'☎'},
    {id:'cases',label:'Cases',icon:'☰'},
    {id:'nightvehicles',label:'Night Visit Vehicles',icon:'🚗'},
    {id:'escalations',label:'Escalations',icon:'⬆'},
    {id:'checks',label:'Client Checks',icon:'✓'},
    {id:'sites',label:'Strategic Sites',icon:'★'},
    {id:'logbook',label:'Logbook',icon:'📔'},
    {id:'hoto',label:'HOTO',icon:'🔄'},
    {id:'_t2',label:'Track 2 · Help Desk',icon:'·',sec:true},
    {id:'incidents',label:'Incident Received',icon:'⚠'},
    {id:'guardcomplaints',label:'Guards Complaint',icon:'🛡'},
    {id:'nightcalls',label:'Night Calls',icon:'🌙'},
    {id:'_ops',label:'More',icon:'·',sec:true},
    {id:'users',label:'User management',icon:'👤'},
    {id:'ops',label:'Ops Tools (manpower)',icon:'⚙'}
  ];
}
function setNav(){
  var items=menuItems();
  el('menu').innerHTML=items.map(function(it){
    if(it.sec)return '<div class="mi sec"><span class="ic"></span>'+h(it.label)+'</div>';
    var act=VIEW===it.id||(VIEW==='case'&&it.id==='cases')||(VIEW==='newcase'&&it.id==='home')?' active':'';
    return '<button type="button" class="mi app-tap-btn'+act+'" onclick="nav(\\''+it.id+'\\')"><span class="ic">'+it.icon+'</span>'+h(it.label)+'</button>';
  }).join('');
}
function nav(id){
  if(id==='ops'){goOpsTools();return;}
  VIEW=id;CURRENT=null;if(AGE_TIMER){clearInterval(AGE_TIMER);AGE_TIMER=null;}
  try{el('side').classList.remove('open');}catch(e){}
  setNav();
  if(id==='home')renderHome();
  else if(id==='dashboard')renderDashboard();
  else if(id==='incidents')renderIncidents();
  else if(id==='guardcomplaints')renderGuardComplaints();
  else if(id==='nightcalls')renderNightCalls();
  else if(id==='cases')renderCases();
  else if(id==='nightvehicles')renderNightVehicles();
  else if(id==='escalations')renderEscalations();
  else if(id==='checks')renderChecks();
  else if(id==='sites')renderSites();
  else if(id==='logbook')renderLogbook();
  else if(id==='hoto')renderHoto();
  else if(id==='users')renderUsers();
  else if(id==='newcase')renderNewCase();
  else if(id==='case')renderCaseDetail();
}

function branchOpts(sel){
  return '<option value="">— Branch —</option>'+(CTX.branches||[]).map(function(b){
    return '<option value="'+h(b.id)+'"'+(sel===b.id?' selected':'')+'>'+h(b.name)+'</option>';
  }).join('');
}
function catOpts(sel){
  return (CTX.categories||[]).map(function(c){
    return '<option value="'+h(c.id)+'"'+(sel===c.id?' selected':'')+'>'+h(c.label)+'</option>';
  }).join('');
}

function renderHome(){
  el('ttl').textContent='Command Centre Console';
  el('content').innerHTML='<div class="card"><h3>Quick actions</h3><p class="muted">Three taps max for crisis paths. Every significant event becomes a numbered case.</p>'+
    '<div class="biggrid">'+
    '<button type="button" class="big em app-tap-btn" onclick="quickCase(\\'Emergency\\',\\'P1\\')">EMERGENCY<span>P1 · open now</span></button>'+
    '<button type="button" class="big new app-tap-btn" onclick="quickCase(\\'ClientComplaint\\',\\'P3\\')">NEW CASE<span>any category</span></button>'+
    '<button type="button" class="big inc app-tap-btn" onclick="quickCase(\\'Incident\\',\\'P1\\')">INCIDENT<span>Incident Room</span></button>'+
    '<button type="button" class="big call app-tap-btn" onclick="quickCase(\\'ClientInstruction\\',\\'P2\\')">CLIENT CALL<span>log + own</span></button>'+
    '<button type="button" class="big call app-tap-btn" onclick="quickCase(\\'GuardSupport\\',\\'P2\\')">GUARD CALL<span>support</span></button>'+
    '<button type="button" class="big new app-tap-btn" onclick="quickCase(\\'SalesLead\\',\\'P4\\')">SALES LEAD<span>capture only</span></button>'+
    '<button type="button" class="big hoto app-tap-btn" onclick="nav(\\'hoto\\')">HOTO<span>shift handover</span></button>'+
    '</div></div><div id="homeDash"></div>';
  loadHomeStrip();
}
function loadHomeStrip(){
  api('dashboard',{}).then(function(res){
    if(res.s!==200){el('homeDash').innerHTML='<div class="card"><p class="muted">'+(res.j.error||'Could not load')+'</p></div>';return;}
    var k=res.j.kpis||{};
    OPEN_CASES=res.j.openCases||[];
    el('homeDash').innerHTML='<div class="card"><h3>Now</h3><div class="kgrid">'+
      '<div class="kpi bad"><b>'+k.openP1+'</b><span>Open P1</span></div>'+
      '<div class="kpi bad"><b>'+k.openP2+'</b><span>Open P2</span></div>'+
      '<div class="kpi"><b>'+k.slaBreaches+'</b><span>SLA breaches</span></div>'+
      '<div class="kpi"><b>'+k.openAll+'</b><span>Open cases</span></div>'+
      '<div class="kpi"><b>'+k.incidentsToday+'</b><span>Incidents today</span></div>'+
      '<div class="kpi"><b>'+k.nightCallsToday+'</b><span>Night calls today</span></div>'+
      '<div class="kpi"><b>'+k.checksPending+'</b><span>Checks due</span></div>'+
      '</div>'+
      '<h3 style="margin-top:14px;color:#fff">Latest open</h3>'+casesTable(OPEN_CASES.slice(0,12))+
      '</div>';
  });
}

function casesTable(rows){
  if(!rows||!rows.length)return '<p class="muted">No open cases.</p>';
  return '<div class="tblwrap"><table><thead><tr><th>Case</th><th>P</th><th>Status</th><th>Summary</th><th>Branch</th><th>Owner</th><th>SLA ack</th></tr></thead><tbody>'+
    rows.map(function(c){
      return '<tr class="clickable" onclick="openCase(\\''+h(c.id||c.caseNo)+'\\')"><td>'+h(c.caseNo)+'</td><td><span class="'+priCls(c.priority)+'">'+h(c.priority)+'</span></td><td>'+h(c.status)+'</td><td>'+h(c.summary)+'</td><td>'+h(c.branchName)+'</td><td>'+h(c.ownerName||'—')+'</td><td>'+h((c.slaAckDueAt||'').slice(11,16)||'—')+'</td></tr>';
    }).join('')+'</tbody></table></div>';
}

function quickCase(cat,pri){
  VIEW='newcase';setNav();
  renderNewCase(cat,pri);
}
function renderNewCase(cat,pri){
  el('ttl').textContent='New case';
  cat=cat||'ClientComplaint';pri=pri||'P3';
  el('content').innerHTML='<div class="card"><h3>Create case</h3>'+
    '<div class="row2"><div><label>Category</label><select id="ncCat">'+catOpts(cat)+'</select></div>'+
    '<div><label>Priority</label><select id="ncPri"><option>P1</option><option>P2</option><option>P3</option><option>P4</option></select></div></div>'+
    '<label>Summary *</label><input id="ncSum" placeholder="Short description" maxlength="240">'+
    '<label>Detail</label><textarea id="ncDet" rows="3"></textarea>'+
    '<div class="row3"><div><label>Caller name</label><input id="ncCaller"></div><div><label>Caller phone</label><input id="ncPhone"></div><div><label>Source</label><input id="ncSrc" value="Command Centre"></div></div>'+
    '<div class="row3"><div><label>Branch</label><select id="ncBranch">'+branchOpts('')+'</select></div>'+
    '<div><label>Client</label><input id="ncClient"></div><div><label>Site</label><input id="ncSite"></div></div>'+
    '<div style="margin-top:12px"><button type="button" class="btn green app-tap-btn" onclick="submitCase()">Create case</button> <button type="button" class="btn grey" onclick="nav(\\''+'home'+'\\')">Cancel</button></div></div>';
  el('ncPri').value=pri;
}
function submitCase(){
  var b=el('ncBranch');
  var bn=b&&b.selectedOptions[0]?b.selectedOptions[0].text:'';
  if(bn==='— Branch —')bn='';
  api('createCase',{
    category:el('ncCat').value,priority:el('ncPri').value,summary:el('ncSum').value,detail:el('ncDet').value,
    callerName:el('ncCaller').value,callerPhone:el('ncPhone').value,source:el('ncSrc').value,
    branchId:b.value,branchName:bn,clientName:el('ncClient').value,siteName:el('ncSite').value
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Created '+res.j.case.caseNo,true);
    openCase(res.j.case.id||res.j.case.caseNo);
  });
}

var GUARD_CATS=${JSON.stringify(GUARD_CATEGORIES)};
function guardCatOpts(){
  return '<option value="">Select category</option>'+Object.keys(GUARD_CATS).map(function(x){return '<option value="'+h(x)+'">'+h(x)+'</option>';}).join('');
}
function guardSubOpts(){
  var cat=el('gcCat')?el('gcCat').value:'';
  var list=GUARD_CATS[cat]||[];
  if(el('gcSub'))el('gcSub').innerHTML='<option value="">Select detail</option>'+list.map(function(x){return '<option value="'+h(x)+'">'+h(x)+'</option>';}).join('');
}
function renderGuardComplaints(){
  el('ttl').textContent='Guards Complaint · Track 1 & Track 2';
  el('content').innerHTML=
    '<div class="card"><h3>Guards Complaint</h3>'+
    '<p class="muted">Same Agile Guards complaint format and GC- code. Registers into Agile Guards and appears under <b>Guards Complaint</b> in the combined list below.</p>'+
    '<div class="row3"><div><label>Branch *</label><select id="gcBranch">'+branchOpts('')+'</select></div><div><label>Guard name *</label><input id="gcName"></div><div><label>Guard ID no. *</label><input id="gcId"></div></div>'+
    '<div class="row3"><div><label>Guard mobile *</label><input id="gcMobile" inputmode="tel"></div><div><label>Client name</label><input id="gcClient"></div><div><label>Location / site</label><input id="gcSite"></div></div>'+
    '<div class="row2"><div><label>Complaint category</label><select id="gcCat" onchange="guardSubOpts()">'+guardCatOpts()+'</select></div><div><label>Complaint detail</label><select id="gcSub"><option value="">Select category first</option></select></div></div>'+
    '<label>Describe the complaint</label><textarea id="gcNote" rows="3" placeholder="Type or speak the guard issue…"></textarea>'+
    '<div style="margin-top:12px"><button type="button" class="btn green app-tap-btn" onclick="saveGuardComplaint()">Register Guards Complaint</button> <button type="button" class="btn grey app-tap-btn" onclick="loadCombinedComplaints()">Refresh combined list</button></div>'+
    '<div id="gcMsg" class="msg"></div></div>'+
    '<div class="card"><h3>Combined Complaint List</h3><p class="muted">Two clear sections: <b>Incident Received</b> (Track 1 desk log) and <b>Guards Complaint</b> (Agile Guards GC- cases).</p><div id="combinedComplaints">Loading…</div></div>';
  loadCombinedComplaints();
}
function saveGuardComplaint(){
  var branch=el('gcBranch');
  var branchName=branch&&branch.selectedOptions[0]?branch.selectedOptions[0].text:'';
  api('createGuardComplaint',{
    branchId:branch?branch.value:'',
    branchName:branchName,
    guardName:el('gcName').value,
    idNo:el('gcId').value,
    mobile:el('gcMobile').value,
    clientName:el('gcClient').value,
    location:el('gcSite').value,
    category:el('gcCat').value,
    subCategory:el('gcSub').value,
    complaintNote:el('gcNote').value
  }).then(function(res){
    var msg=el('gcMsg');
    if(res.s!==200){if(msg){msg.style.display='block';msg.style.background='#3a0a0a';msg.textContent=res.j.error||'Could not register complaint.';}return;}
    var c=res.j.complaint||{};
    if(msg){msg.style.display='block';msg.style.background='#0a2e1a';msg.innerHTML='<b>Complaint registered — '+h(c.code)+'</b><br>Open in Guards: <a style="color:#86efac" target="_blank" rel="noopener" href="'+h(c.url||'#')+'">'+h(c.url||'')+'</a>';}
    toast('Guards complaint registered: '+(c.code||''),true);
    loadCombinedComplaints();
  });
}
function combinedSection(title,rows,isGuard){
  if(!rows||!rows.length) return '<p class="muted" style="margin:8px 0 16px">No '+h(title)+' rows yet.</p>';
  return '<div class="tblwrap" style="margin-bottom:18px"><table><thead><tr><th>Code / ID</th><th>Received</th><th>Name</th><th>Complaint</th><th>Branch</th><th>Status / Action</th></tr></thead><tbody>'+
    rows.map(function(r){
      var link=isGuard
        ? '<a target="_blank" rel="noopener" style="color:#7dd3fc;font-weight:800" href="'+h(r.link||'#')+'">Open in Guards</a>'
        : '<button type="button" class="btn grey app-tap-btn" onclick="nav(\\'incidents\\');setTimeout(function(){editIncident(\\''+h(r.id)+'\\');},120)">Open incident</button>';
      return '<tr><td><b>'+h(r.code||r.id||'—')+'</b></td><td>'+h(String(r.receivedAt||'').replace('T',' ').slice(0,16))+'</td><td>'+h(r.name||'—')+'</td><td>'+h(r.subject||'—')+'</td><td>'+h(r.branchName||'—')+'</td><td>'+h(r.status||'—')+'<br>'+link+'</td></tr>';
    }).join('')+'</tbody></table></div>';
}
function loadCombinedComplaints(){
  api('listCombinedComplaints',{}).then(function(res){
    var out=el('combinedComplaints');if(!out)return;
    if(res.s!==200){out.innerHTML='<p class="muted">'+h(res.j.error||'Could not load complaints.')+'</p>';return;}
    var incidents=res.j.incidents||(res.j.complaints||[]).filter(function(r){return r.source==='incident';});
    var guards=res.j.guards||(res.j.complaints||[]).filter(function(r){return r.source==='guards';});
    if(!incidents.length&&!guards.length){out.innerHTML='<p class="muted">No Incident Received or Guards Complaint rows yet.</p>';return;}
    out.innerHTML=
      '<h4 style="margin:4px 0 8px;color:#fbbf24">Incident Received</h4>'+combinedSection('Incident Received',incidents,false)+
      '<h4 style="margin:16px 0 8px;color:#7dd3fc">Guards Complaint</h4>'+combinedSection('Guards Complaint',guards,true);
  });
}

function renderCases(){
  el('ttl').textContent=IS_MGMT?'All cases (India)':'Open cases / queue';
  el('content').innerHTML='<div class="card"><div class="row3"><div><label>Status</label><select id="fSt"><option value="">Open-ish</option><option>Open</option><option>Acknowledged</option><option>InProgress</option><option>Resolved</option><option>ClientConfirmed</option><option>Closed</option></select></div>'+
    '<div><label>Priority</label><select id="fPr"><option value="">All</option><option>P1</option><option>P2</option><option>P3</option><option>P4</option></select></div>'+
    '<div><label>Search</label><input id="fQ" placeholder="case / client / site"></div></div>'+
    '<button type="button" class="btn" onclick="loadCases()">Refresh</button></div><div id="caseList"></div>';
  loadCases();
}
function loadCases(){
  var st=el('fSt').value;
  api('listCases',{status:st,priority:el('fPr').value,q:el('fQ').value}).then(function(res){
    if(res.s!==200){el('caseList').innerHTML='<p class="muted">'+(res.j.error||'Error')+'</p>';return;}
    var rows=res.j.cases||[];
    if(!st)rows=rows.filter(function(c){return c.status!=='Closed';});
    el('caseList').innerHTML='<div class="card">'+casesTable(rows)+'</div>';
  });
}
function openCase(id){
  VIEW='case';CURRENT=id;setNav();
  renderCaseDetail();
}
function renderCaseDetail(){
  el('ttl').textContent='Case';
  el('content').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  api('getCase',{caseId:CURRENT}).then(function(res){
    if(res.s!==200){el('content').innerHTML='<div class="card"><p>'+h(res.j.error||'Not found')+'</p></div>';return;}
    var c=res.j.case;CURRENT=c.id||c.caseNo;
    var inc=!!res.j.isIncident;
    el('ttl').textContent=(inc?'Incident Room · ':'')+c.caseNo;
    var html='<div class="card">'+
      '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px">'+
      '<div><h3 style="margin:0">'+h(c.caseNo)+' <span class="'+priCls(c.priority)+'">'+h(c.priority)+'</span></h3>'+
      '<p class="muted">'+h(c.category)+' · '+h(c.status)+' · Owner: '+h(c.ownerName||'Unassigned')+'</p></div>'+
      (inc?'<div><div class="muted">Age</div><div class="timer" id="ageTimer">'+h(res.j.age||'—')+'</div></div>':'')+
      '</div>'+
      '<p style="margin:10px 0;font-size:15px;color:#fff">'+h(c.summary)+'</p>'+
      '<p class="muted">'+h(c.branchName)+' / '+h(c.clientName)+' / '+h(c.siteName)+'</p>'+
      (res.j.slaBreached?'<p style="color:#fca5a5;font-weight:800;margin-top:8px">SLA breached</p>':'')+
      (inc?incidentStamps(c):'')+
      '<div style="margin-top:12px">'+
      '<button type="button" class="btn green" onclick="act(\\''+'ackCase'+'\\')">Acknowledge / Claim</button> '+
      '<button type="button" class="btn amb" onclick="act(\\''+'resolveCase'+'\\')">Mark resolved</button> '+
      '<button type="button" class="btn sky" onclick="act(\\''+'confirmClient'+'\\')">Client confirmed</button> '+
      '<button type="button" class="btn r" onclick="act(\\''+'closeCase'+'\\')">Close case</button>'+
      '</div></div>'+
      (isMisVehicleCase(c)?vehicleAcceptCard(c):'');
    html+='<div class="card"><h3>Update</h3>'+
      '<label>Note</label><textarea id="upNote" rows="2"></textarea>'+
      '<label>Evidence / notes</label><textarea id="upEvid" rows="2">'+h(c.evidenceNotes||'')+'</textarea>'+
      (inc?'<div class="row2"><div><label>Next action</label><input id="upNext" value="'+h(c.nextActionNote||'')+'"></div>'+
      '<div><label>Next due</label><input type="datetime-local" id="upDue" value="'+h((c.nextActionDueAt||'').slice(0,16))+'"></div></div>'+
      '<div style="margin-top:8px"><button type="button" class="btn grey" onclick="stamp(\\''+'client'+'\\')">Client informed</button> '+
      '<button type="button" class="btn grey" onclick="stamp(\\''+'police'+'\\')">Police informed</button> '+
      '<button type="button" class="btn grey" onclick="stamp(\\''+'mgmt'+'\\')">Management informed</button></div>':'')+
      '<button type="button" class="btn" style="margin-top:10px" onclick="saveUpdate()">Save update</button></div>';
    html+='<div class="card"><h3>Timeline</h3>'+timelineHtml(c.timeline||[])+'</div>';
    html+='<button type="button" class="btn grey" onclick="nav(\\''+'cases'+'\\')">← Back to queue</button>';
    el('content').innerHTML=html;
    if(inc){
      if(AGE_TIMER)clearInterval(AGE_TIMER);
      AGE_TIMER=setInterval(function(){
        api('getCase',{caseId:CURRENT}).then(function(r2){
          if(r2.s===200&&el('ageTimer'))el('ageTimer').textContent=r2.j.age||'—';
        });
      },30000);
    }
  });
}
function isMisVehicleCase(c){
  var src=String(c.source||'');
  return c.misSourceKind==='night'||c.misSourceKind==='client'||c.misSourceKind==='training'||src.indexOf('MIS Night Visit')===0||src.indexOf('MIS Client Visit')===0||src.indexOf('Training OJT')===0;
}
function vehicleAcceptCard(c){
  var done=!!(c.vehicleDriverName||c.vehicleAcceptedAt);
  return '<div class="card" style="border-color:#c9a84c">'+
    '<h3>Vehicle + Driver accept</h3>'+
    '<p class="muted">Accept with driver name — same shows on MIS Scheduled List or Training Add schedule, and on this Vehicles list.</p>'+
    (done?'<p style="color:#86efac;font-weight:700">Accepted: '+h(c.vehicleDriverName||'—')+(c.vehicleRegNo?' · '+h(c.vehicleRegNo):'')+'</p>':'')+
    '<div class="row2"><div><label>Driver name *</label><input id="vehDriver" value="'+h(c.vehicleDriverName||'')+'"></div>'+
    '<div><label>Vehicle number</label><input id="vehReg" value="'+h(c.vehicleRegNo||'')+'" placeholder="e.g. AP 39 XX 1234"></div></div>'+
    '<button type="button" class="btn green app-tap-btn" style="margin-top:10px" onclick="acceptVehicle()">Accept vehicle</button></div>';
}
function acceptVehicle(){
  var driver=el('vehDriver')?el('vehDriver').value.trim():'';
  var reg=el('vehReg')?el('vehReg').value.trim():'';
  if(!driver){toast('Enter driver name',false);return;}
  api('acceptVehicleAllotment',{caseId:CURRENT,driverName:driver,vehicleRegNo:reg}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Accepted — schedule updated',true);renderCaseDetail();
  });
}
function renderNightVehicles(){
  el('ttl').textContent='Night Visit Vehicles';
  el('content').innerHTML='<div class="card"><h3>Vehicle requirements from MIS</h3><p class="muted">Night Visit, Client Visit, and Training requests. Accept with <b>Driver name</b> (and vehicle number). Same allotment shows on MIS Scheduled List or Training Add schedule.</p><button type="button" class="btn app-tap-btn" onclick="loadNightVehicles()">Refresh</button></div><div id="nvList"></div>';
  loadNightVehicles();
}
function loadNightVehicles(){
  api('listNightVisitVehicles',{}).then(function(res){
    if(res.s!==200){el('nvList').innerHTML='<div class="card"><p class="muted">'+(res.j.error||'Error')+'</p></div>';return;}
    var rows=res.j.cases||[];
    if(!rows.length){el('nvList').innerHTML='<div class="card"><p class="muted">No open MIS vehicle requirements.</p></div>';return;}
    el('nvList').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Case</th><th>Type</th><th>Branch</th><th>Client / site</th><th>Status</th><th>Driver</th><th>Vehicle</th><th></th></tr></thead><tbody>'+
      rows.map(function(c){
        var kind=c.misSourceKind==='client'?'Client Visit':(c.misSourceKind==='night'?'Night Visit':(c.misSourceKind==='training'?'Training':(String(c.source||'').replace('MIS ',''))));
        var drv=c.vehicleDriverName||'— waiting —';
        return '<tr><td>'+h(c.caseNo)+'</td><td>'+h(kind)+'</td><td>'+h(c.branchName||'')+'</td><td>'+h(c.clientName||'—')+'<div class="muted">'+h(c.siteName||'')+'</div></td><td>'+h(c.status)+'</td><td>'+h(drv)+'</td><td>'+h(c.vehicleRegNo||'—')+'</td><td><button type="button" class="btn green app-tap-btn" onclick="openCase(\\''+h(c.id||c.caseNo)+'\\')">Open / Accept</button></td></tr>';
      }).join('')+'</tbody></table></div></div>';
  });
}
function incidentStamps(c){
  function s(label,at){return '<span class="stamp '+(at?'ok':'no')+'">'+label+(at?' ✓ '+String(at).slice(11,16):' —')+'</span>';}
  return '<div style="margin-top:10px">'+s('Client informed',c.clientInformedAt)+s('Police informed',c.policeInformedAt)+s('Management informed',c.managementInformedAt)+'</div>';
}
function timelineHtml(t){
  if(!t.length)return '<p class="muted">No events yet.</p>';
  return '<div class="tblwrap"><table><thead><tr><th>When</th><th>By</th><th>Kind</th><th>Note</th></tr></thead><tbody>'+
    t.map(function(e){return '<tr><td>'+h((e.at||'').replace('T',' ').slice(0,16))+'</td><td>'+h(e.byName)+'</td><td>'+h(e.kind)+'</td><td>'+h(e.note)+'</td></tr>';}).join('')+
    '</tbody></table></div>';
}
function act(action){
  var note=el('upNote')?el('upNote').value:'';
  api(action,{caseId:CURRENT,note:note}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Updated',true);renderCaseDetail();
  });
}
function stamp(kind){
  var body={caseId:CURRENT,note:el('upNote')?el('upNote').value:''};
  if(kind==='client')body.clientInformed=true;
  if(kind==='police')body.policeInformed=true;
  if(kind==='mgmt')body.managementInformed=true;
  api('updateCase',body).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Stamped',true);renderCaseDetail();
  });
}
function saveUpdate(){
  api('updateCase',{
    caseId:CURRENT,note:el('upNote').value,evidenceNotes:el('upEvid').value,
    nextActionNote:el('upNext')?el('upNext').value:undefined,
    nextActionDueAt:el('upDue')&&el('upDue').value?new Date(el('upDue').value).toISOString():undefined
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Saved',true);renderCaseDetail();
  });
}

function renderDashboard(){
  el('ttl').textContent='Daily Control Dashboard';
  el('content').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  api('dashboard',{}).then(function(res){
    if(res.s!==200){el('content').innerHTML='<div class="card">'+h(res.j.error||'Error')+'</div>';return;}
    var k=res.j.kpis||{};
    var open=res.j.openCases||[];
    var inc=res.j.incidentsToday||[];
    var night=res.j.nightCallsToday||[];
    var byBranch={};
    open.forEach(function(c){
      var b=c.branchName||'Unassigned';
      if(!byBranch[b])byBranch[b]={p1:0,p2:0,all:0};
      byBranch[b].all++;
      if(c.priority==='P1')byBranch[b].p1++;
      if(c.priority==='P2')byBranch[b].p2++;
    });
    el('content').innerHTML='<div class="card"><h3>Dashboard</h3><p class="muted">Track 1 · Control (incidents) and Track 2 · Help Desk (night calls). Same picture on Staff and Management.</p><div class="kgrid">'+
      '<div class="kpi bad"><b>'+(k.openP1||0)+'</b><span>Open P1</span></div>'+
      '<div class="kpi bad"><b>'+(k.openP2||0)+'</b><span>Open P2</span></div>'+
      '<div class="kpi bad"><b>'+(k.slaBreaches||0)+'</b><span>SLA breaches</span></div>'+
      '<div class="kpi"><b>'+(k.incidentsToday||0)+'</b><span>Incidents today</span></div>'+
      '<div class="kpi bad"><b>'+(k.incidentsHodNo||0)+'</b><span>Incident HOD not informed</span></div>'+
      '<div class="kpi"><b>'+(k.nightCallsToday||0)+'</b><span>Night calls today</span></div>'+
      '<div class="kpi bad"><b>'+(k.nightNotPicked||0)+'</b><span>Night not picked</span></div>'+
      '<div class="kpi"><b>'+(k.checksPending||0)+'</b><span>Checks due</span></div>'+
      '</div>'+(CTX.director?'<button type="button" class="btn amb app-tap-btn" onclick="runEsc()">Run escalations now</button> <button type="button" class="btn sky app-tap-btn" onclick="genChecks()">Generate client checks</button>':'')+
      '<div style="margin-top:10px"><button type="button" class="btn app-tap-btn" onclick="nav(\\''+'incidents'+'\\')">Open Incident Received</button> '+
      '<button type="button" class="btn app-tap-btn" onclick="nav(\\''+'nightcalls'+'\\')">Open Night Calls</button></div></div>'+
      '<div class="card"><h3>Today — Incident Received (Track 1)</h3>'+incidentsTable(inc)+'</div>'+
      '<div class="card"><h3>Today — Night Calls (Track 2)</h3>'+nightTable(night)+'</div>'+
      '<div class="card"><h3>Open cases by branch</h3><div class="tblwrap"><table><thead><tr><th>Branch</th><th>Open</th><th>P1</th><th>P2</th></tr></thead><tbody>'+
      (Object.keys(byBranch).length?Object.keys(byBranch).sort().map(function(b){
        var x=byBranch[b];
        return '<tr class="clickable" onclick="nav(\\''+'cases'+'\\')"><td>'+h(b)+'</td><td>'+x.all+'</td><td>'+x.p1+'</td><td>'+x.p2+'</td></tr>';
      }).join(''):'<tr><td colspan="4" class="muted">No open cases.</td></tr>')+
      '</tbody></table></div></div><div class="card"><h3>Open cases</h3>'+casesTable(open)+'</div>';
  });
}
function runEsc(){
  api('runEscalations',{}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Escalated '+res.j.escalated+' / checked '+res.j.checked,true);
    renderDashboard();
  });
}
function genChecks(){
  api('generateChecks',{force:true}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Generated '+(res.j.created||0)+' checks',true);
    if(VIEW==='dashboard')renderDashboard();
    else if(VIEW==='checks')loadChecks();
  });
}

function renderEscalations(){
  el('ttl').textContent='Escalations';
  el('content').innerHTML='<div class="card"><p class="muted">Open cases already escalated or past ack SLA.</p><div id="escOut">Loading…</div></div>';
  api('listCases',{}).then(function(res){
    var rows=(res.j.cases||[]).filter(function(c){
      return c.status!=='Closed'&&(c.escalationLevel&&c.escalationLevel!=='None'||c.priority==='P1'||c.priority==='P2');
    });
    el('escOut').innerHTML=casesTable(rows)+
      (CTX.director?'<button type="button" class="btn amb" style="margin-top:10px" onclick="runEsc()">Run escalation engine</button>':'');
  });
}

function renderChecks(){
  el('ttl').textContent='Strategic client checks';
  el('content').innerHTML='<div class="card"><button type="button" class="btn" onclick="loadChecks()">Refresh</button>'+(CTX.director?' <button type="button" class="btn sky" onclick="genChecks();setTimeout(loadChecks,800)">Generate checks now</button>':'')+'</div><div id="chkOut"></div>';
  loadChecks();
}
function loadChecks(){
  api('listChecks',{}).then(function(res){
    var rows=res.j.checks||[];
    el('chkOut').innerHTML='<div class="card"><h3>Checks</h3><div class="tblwrap"><table><thead><tr><th>Site</th><th>Window</th><th>Status</th><th></th></tr></thead><tbody>'+
      rows.map(function(c){
        return '<tr><td>'+h(c.clientName)+' / '+h(c.siteName)+'<br><span class="muted">'+h(c.branchName)+'</span></td><td>'+h((c.windowStart||'').slice(0,16))+' → '+h((c.windowEnd||'').slice(11,16))+'</td><td>'+h(c.status)+'</td><td>'+(c.status==='Pending'?'<button type="button" class="btn green" onclick="completeCheck(\\''+h(c.id)+'\\')">Log check</button>':h(c.caseNo||'Done'))+'</td></tr>';
      }).join('')+'</tbody></table></div></div>';
  });
}
function completeCheck(id){
  el('content').innerHTML='<div class="card"><h3>CONTROL CHECK</h3>'+
    '<input type="hidden" id="ckId" value="'+h(id)+'">'+
    '<div class="row2"><div><label>Guard attendance</label><select id="ckAtt"><option>Present / OK</option><option>Short</option><option>Absent</option></select></div>'+
    '<div><label>Alertness</label><select id="ckAl"><option>Alert</option><option>Average</option><option>Poor</option></select></div></div>'+
    '<div class="row2"><div><label>Supervisor visit</label><select id="ckSup"><option>Yes</option><option>No</option><option>Not required</option></select></div>'+
    '<div><label>Any incident?</label><select id="ckInc"><option>None / All OK</option><option>Yes — see notes</option></select></div></div>'+
    '<label>Client satisfaction</label><select id="ckSat"><option>Satisfied</option><option>Neutral</option><option>Unhappy</option></select>'+
    '<label>Anything needing immediate attention?</label><input id="ckImm" placeholder="No / describe">'+
    '<label>Notes (negative “all OK” is valid evidence)</label><textarea id="ckNotes" rows="2">All OK</textarea>'+
    '<button type="button" class="btn green" onclick="submitCheck()">Save check</button> <button type="button" class="btn grey" onclick="nav(\\''+'checks'+'\\')">Cancel</button></div>';
}
function submitCheck(){
  api('completeCheck',{
    checkId:el('ckId').value,guardAttendance:el('ckAtt').value,alertness:el('ckAl').value,
    supervisorVisit:el('ckSup').value,anyIncident:el('ckInc').value,clientSatisfaction:el('ckSat').value,
    immediateAttention:el('ckImm').value,notes:el('ckNotes').value
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Check logged'+(res.j.case?' · '+res.j.case.caseNo:''),true);
    nav('checks');
  });
}

function renderSites(){
  el('ttl').textContent='Strategic / sensitive sites';
  el('content').innerHTML='<div class="card"><p class="muted">Master list for CONTROL CHECK rounds (Platinum / Gold / Silver).</p>'+
    (CTX.director?
      '<div class="row3"><div><label>Branch</label><select id="stBranch">'+branchOpts('')+'</select></div>'+
      '<div><label>Client</label><input id="stClient"></div><div><label>Site</label><input id="stSite"></div></div>'+
      '<div class="row3"><div><label>Contact</label><input id="stContact"></div><div><label>Phone</label><input id="stPhone"></div>'+
      '<div><label>Tier</label><select id="stTier"><option>Platinum</option><option selected>Gold</option><option>Silver</option></select></div></div>'+
      '<button type="button" class="btn green" onclick="saveSite()">Add / save site</button>':'')+
    '</div><div id="sitesOut"></div>';
  loadSites();
}
function loadSites(){
  api('listSites',{}).then(function(res){
    var rows=res.j.sites||[];
    el('sitesOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Tier</th><th>Client / Site</th><th>Branch</th><th>Contact</th><th>Last check</th></tr></thead><tbody>'+
      rows.map(function(s){
        return '<tr><td>'+h(s.tier)+'</td><td>'+h(s.clientName)+' / '+h(s.siteName)+'</td><td>'+h(s.branchName)+'</td><td>'+h(s.contactName)+' '+h(s.contactPhone)+'</td><td>'+h((s.lastCheckAt||'').slice(0,10)||'—')+'</td></tr>';
      }).join('')+'</tbody></table></div></div>';
  });
}
function saveSite(){
  var b=el('stBranch');
  var bn=b&&b.selectedOptions[0]?b.selectedOptions[0].text:'';
  if(bn==='— Branch —')bn='';
  api('saveSite',{
    branchId:b.value,branchName:bn,clientName:el('stClient').value,siteName:el('stSite').value,
    contactName:el('stContact').value,contactPhone:el('stPhone').value,tier:el('stTier').value,frequencyPerWeek:3,active:true
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Site saved',true);loadSites();
  });
}

function renderLogbook(){
  el('ttl').textContent='Digital logbook';
  el('content').innerHTML='<div class="card"><div class="row2"><div><label>Search</label><input id="lbQ" placeholder="case / keyword"></div><div style="align-self:end"><button type="button" class="btn" onclick="loadLog()">Search</button></div></div>'+
    '<label>Manual observation</label><textarea id="lbText" rows="2"></textarea><button type="button" class="btn green" onclick="addLog()">Add entry</button></div><div id="lbOut"></div>';
  loadLog();
}
function loadLog(){
  api('logbook',{q:el('lbQ')?el('lbQ').value:''}).then(function(res){
    var rows=res.j.log||[];
    el('lbOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>When</th><th>By</th><th>Kind</th><th>Text</th><th>Case</th></tr></thead><tbody>'+
      rows.map(function(e){return '<tr><td>'+h((e.at||'').replace('T',' ').slice(0,16))+'</td><td>'+h(e.byName)+'</td><td>'+h(e.kind)+'</td><td>'+h(e.text)+'</td><td>'+h(e.caseNo||'')+'</td></tr>';}).join('')+
      '</tbody></table></div></div>';
  });
}
function addLog(){
  api('addLog',{text:el('lbText').value}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    el('lbText').value='';toast('Logged',true);loadLog();
  });
}

var HOTO_ITEMS=[
  ['openIncidents','Open incidents reviewed'],
  ['openComplaints','Open complaints reviewed'],
  ['pendingCallbacks','Pending callbacks noted'],
  ['guardEmergencies','Guard emergencies noted'],
  ['deploymentShortages','Deployment shortages noted'],
  ['managementInstructions','Management instructions noted'],
  ['sensitiveSites','Sensitive sites status noted'],
  ['criticalClientCalls','Critical client calls noted'],
  ['technicalProblems','Technical problems noted'],
  ['salesLeads','Sales leads handed over'],
  ['specialEvents','Special events / VIP noted']
];

function roleLbl(r){
  return r||'Field Officer';
}
function renderUsers(){
  el('ttl').textContent='User management';
  var hint=CTX.canDelete
    ? 'Management may add, assign branch / role, and delete users.'
    : 'HOD / Staff may add and assign users (branch + role). You cannot delete any data — turn Active off, or ask Management to delete.';
  el('content').innerHTML='<div class="card"><h3>User management</h3><p class="muted">'+hint+'</p>'+
    '<p class="muted" style="margin-top:4px">Role list = company roles (Director, RM, Branch Manager…). Version <b>'+AC_USERS_VERSION+'</b></p>'+
    '<button type="button" class="btn green app-tap-btn" onclick="addAcUser()">+ Add user</button> '+
    '<button type="button" class="btn sky app-tap-btn" onclick="saveAcUsers()">Save assignments</button></div>'+
    '<div id="usersOut"><div class="card"><p class="muted">Loading…</p></div></div>';
  loadAcUsers();
}
function loadAcUsers(){
  api('loadUsers',{}).then(function(res){
    if(res.s!==200){el('usersOut').innerHTML='<div class="card"><p class="muted">'+(res.j.error||'Could not load users')+'</p></div>';return;}
    USERS_CACHE=(res.j.users||[]).slice();
    if(res.j.canDelete!=null)CTX.canDelete=!!res.j.canDelete;
    paintAcUsers();
  });
}
function paintAcUsers(){
  var delHead=CTX.canDelete?'<th>Delete</th>':'';
  var rows=USERS_CACHE.map(function(u,i){
    var bopts='<option value="">— All / HQ —</option>'+(CTX.branches||[]).map(function(b){
      return '<option value="'+h(b.id)+'"'+(b.id===u.branchId?' selected':'')+'>'+h(b.name)+'</option>';
    }).join('');
    var curRole=u.role||'Field Officer';
    var roleList=USER_ROLES.slice();
    if(curRole&&roleList.indexOf(curRole)<0) roleList.unshift(curRole);
    var ropts=roleList.map(function(r){
      return '<option value="'+h(r)+'"'+(r===curRole?' selected':'')+'>'+h(r)+'</option>';
    }).join('');
    var delCell=CTX.canDelete
      ?'<td><button type="button" class="btn grey app-tap-btn" style="background:#7f1d1d;border-color:#b91c1c" onclick="delAcUser('+i+')">Delete</button></td>'
      :'';
    return '<tr>'+
      '<td><input id="uName'+i+'" value="'+h(u.name||'')+'" oninput="USERS_CACHE['+i+'].name=this.value"></td>'+
      '<td><input id="uEmail'+i+'" value="'+h(u.email||'')+'" oninput="USERS_CACHE['+i+'].email=this.value"></td>'+
      '<td><input id="uPhone'+i+'" value="'+h(u.phone||'')+'" oninput="USERS_CACHE['+i+'].phone=this.value"></td>'+
      '<td><select id="uRole'+i+'" onchange="USERS_CACHE['+i+'].role=this.value">'+ropts+'</select></td>'+
      '<td><select id="uBranch'+i+'" onchange="setAcUserBranch('+i+',this)">'+bopts+'</select></td>'+
      '<td><label style="display:flex;align-items:center;gap:6px"><input type="checkbox" '+(u.active!==false?'checked':'')+' onchange="USERS_CACHE['+i+'].active=this.checked"> Active</label></td>'+
      delCell+'</tr>';
  }).join('');
  el('usersOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Branch (assign)</th><th>Active</th>'+delHead+'</tr></thead><tbody>'+
    (rows||'<tr><td colspan="7" class="muted">No users yet — tap Add user.</td></tr>')+
    '</tbody></table></div></div>';
}
function setAcUserBranch(i,sel){
  if(!USERS_CACHE[i]||!sel)return;
  USERS_CACHE[i].branchId=sel.value||'';
  USERS_CACHE[i].branchName=(sel.selectedOptions[0]&&sel.value)?sel.selectedOptions[0].text:'';
}
function addAcUser(){
  USERS_CACHE.push({id:'',name:'',email:'',phone:'',role:'Field Officer',branchId:'',branchName:'',active:true});
  paintAcUsers();
}
function delAcUser(i){
  if(!CTX.canDelete){toast('HOD / Staff cannot delete any data.',false);return;}
  var u=USERS_CACHE[i];if(!u)return;
  if(!confirm('Delete '+(u.name||u.email||'this user')+' permanently?'))return;
  if(u.id){
    api('deleteUser',{id:u.id,email:u.email}).then(function(res){
      if(res.s!==200){toast(res.j.error||'Could not delete',false);return;}
      toast('User deleted',true);loadAcUsers();
    });
    return;
  }
  USERS_CACHE.splice(i,1);paintAcUsers();
}
function saveAcUsers(){
  for(var i=0;i<USERS_CACHE.length;i++){
    if(!(USERS_CACHE[i].name||'').trim()){toast('Enter a name for every user.',false);return;}
    if(!(USERS_CACHE[i].email||'').trim()||String(USERS_CACHE[i].email).indexOf('@')<0){toast('Enter a valid email for every user.',false);return;}
  }
  api('saveUsers',{users:USERS_CACHE}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Could not save',false);return;}
    toast('Users saved · '+(res.j.count||USERS_CACHE.length),true);
    loadAcUsers();
  });
}

function renderHoto(){
  el('ttl').textContent=IS_MGMT?'HOTO history':'Digital HOTO';
  el('content').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  if(IS_MGMT){
    api('listHoto',{}).then(function(r2){
      var rows=r2.j.hoto||[];
      el('content').innerHTML='<div class="card"><h3>Recent HOTO</h3><div class="tblwrap"><table><thead><tr><th>When</th><th>Out → In</th><th>P1/P2</th><th>Notes</th></tr></thead><tbody>'+
        rows.map(function(x){return '<tr><td>'+h((x.acceptedAt||'').replace('T',' ').slice(0,16))+'</td><td>'+h(x.outgoingName)+' → '+h(x.incomingName)+'</td><td>'+x.openCasesP1+' / '+x.openCasesP2+'</td><td>'+h(x.notes||'')+'</td></tr>';}).join('')+
        '</tbody></table></div></div>';
    });
    return;
  }
  api('hotoPreview',{}).then(function(res){
    if(res.s!==200){el('content').innerHTML='<div class="card">'+h(res.j.error||'Error')+'</div>';return;}
    var s=res.j.summary||{};
    var html='<div class="card"><h3>Outgoing picture</h3><div class="kgrid">'+
      '<div class="kpi bad"><b>'+s.p1+'</b><span>Open P1</span></div>'+
      '<div class="kpi bad"><b>'+s.p2+'</b><span>Open P2</span></div>'+
      '<div class="kpi"><b>'+s.callbacksPending+'</b><span>Callbacks</span></div>'+
      '<div class="kpi"><b>'+s.incidentsMonitoring+'</b><span>Incidents</span></div>'+
      '<div class="kpi"><b>'+s.pendingChecks+'</b><span>Checks due</span></div></div>'+
      '<p class="muted">Incoming officer must tick every item before Accept HOTO.</p></div>';
    html+='<div class="card"><h3>Accept HOTO</h3>'+
      '<div class="row2"><div><label>Incoming email</label><input id="hoInEmail" value="'+h(CTX.email)+'"></div>'+
      '<div><label>Incoming name</label><input id="hoInName" value="'+h(CTX.name)+'"></div></div>'+
      HOTO_ITEMS.map(function(it){return '<label class="checkrow"><input type="checkbox" id="ho_'+it[0]+'"> '+h(it[1])+'</label>';}).join('')+
      '<label>Notes</label><textarea id="hoNotes" rows="2"></textarea>'+
      '<button type="button" class="btn green app-tap-btn" onclick="acceptHoto()">Accept HOTO</button></div>';
    html+='<div class="card"><h3>Open critical cases on this shift</h3>'+casesTable(res.j.openCases||[])+'</div>';
    html+='<div class="card"><h3>Recent HOTO</h3><div id="hoHist">Loading…</div></div>';
    el('content').innerHTML=html;
    api('listHoto',{}).then(function(r2){
      var rows=r2.j.hoto||[];
      el('hoHist').innerHTML='<div class="tblwrap"><table><thead><tr><th>When</th><th>Out → In</th><th>P1/P2</th></tr></thead><tbody>'+
        rows.map(function(x){return '<tr><td>'+h((x.acceptedAt||'').replace('T',' ').slice(0,16))+'</td><td>'+h(x.outgoingName)+' → '+h(x.incomingName)+'</td><td>'+x.openCasesP1+' / '+x.openCasesP2+'</td></tr>';}).join('')+
        '</tbody></table></div>';
    });
  });
}
function acceptHoto(){
  var checklist={};
  HOTO_ITEMS.forEach(function(it){checklist[it[0]]=!!(el('ho_'+it[0])&&el('ho_'+it[0]).checked);});
  api('hotoAccept',{incomingEmail:el('hoInEmail').value,incomingName:el('hoInName').value,notes:el('hoNotes').value,checklist:checklist}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('HOTO accepted',true);renderHoto();
  });
}

function ynOpts(sel){
  var s=sel||'';
  return '<option value="">— Select —</option><option value="Yes"'+(s==='Yes'?' selected':'')+'>Yes</option><option value="No"'+(s==='No'?' selected':'')+'>No</option>';
}
function istLocal(){
  var d=new Date();
  var u=d.getTime()+d.getTimezoneOffset()*60000;
  var ist=new Date(u+(330*60000));
  function z(n){return (n<10?'0':'')+n;}
  return ist.getFullYear()+'-'+z(ist.getMonth()+1)+'-'+z(ist.getDate())+'T'+z(ist.getHours())+':'+z(ist.getMinutes());
}
function istYmd(){return CTX.todayIst||istLocal().slice(0,10);}
function istHm(){return istLocal().slice(11,16);}
function incidentsTable(rows){
  if(!rows||!rows.length)return '<p class="muted">No incidents today. Open Incident Received to add one.</p>';
  return '<div class="tblwrap"><table><thead><tr><th>Date / time</th><th>Client</th><th>Location</th><th>From</th><th>Details</th><th>Branch</th><th>HOD</th></tr></thead><tbody>'+
    rows.map(function(r){
      return '<tr class="clickable" onclick="nav(\\''+'incidents'+'\\')"><td>'+h(String(r.occurredAt||r.dateYmd||'').replace('T',' ').slice(0,16))+'</td><td>'+h(r.clientName)+'</td><td>'+h(r.location)+'</td><td>'+h(r.receivedFrom||'')+'</td><td>'+h(r.details)+'</td><td>'+h(r.branchName||'')+'</td><td>'+h(r.informedHod||'—')+(r.informedHod==='Yes'&&r.informedHodAt?' '+h(String(r.informedHodAt).replace('T',' ').slice(11,16)):'')+'</td></tr>';
    }).join('')+'</tbody></table></div>';
}
function nightTable(rows){
  if(!rows||!rows.length)return '<p class="muted">No night calls today. Open Night Calls to add one.</p>';
  return '<div class="tblwrap"><table><thead><tr><th>Time</th><th>Client</th><th>Location</th><th>Guard</th><th>Mobile</th><th>Picked</th><th>Call back</th><th>HOD</th></tr></thead><tbody>'+
    rows.map(function(r){
      return '<tr class="clickable" onclick="nav(\\''+'nightcalls'+'\\')"><td>'+h(r.callTime||'')+'</td><td>'+h(r.clientName)+'</td><td>'+h(r.location)+'</td><td>'+h(r.guardName)+'</td><td>'+h(r.guardMobile)+'</td><td>'+h(r.pickedUp||'—')+'</td><td>'+h(r.calledBack||'—')+'</td><td>'+h(r.informedHod||'—')+'</td></tr>';
    }).join('')+'</tbody></table></div>';
}

var INC_CACHE=[];
function renderIncidents(row){
  el('ttl').textContent='Track 1 · Incident Received';
  row=row||{};
  var occ=String(row.occurredAt||istLocal()).slice(0,16);
  var hodAt=String(row.informedHodAt||istLocal()).slice(0,16);
  el('content').innerHTML='<div class="card"><h3>Incident Received</h3><p class="muted">Track 1 · Control. Pick date and time from the calendar. Both Staff and Management can fill this.</p>'+
    '<input type="hidden" id="incId" value="'+h(row.id||'')+'">'+
    '<div class="row2"><div><label>Date &amp; time *</label><input type="datetime-local" id="incWhen" value="'+h(occ)+'"></div>'+
    '<div><label>Branch</label><select id="incBranch">'+branchOpts(row.branchId||'')+'</select></div></div>'+
    '<div class="row2"><div><label>Client name *</label><input id="incClient" value="'+h(row.clientName||'')+'"></div>'+
    '<div><label>Location *</label><input id="incLoc" value="'+h(row.location||'')+'"></div></div>'+
    '<label>Received from</label><input id="incFrom" value="'+h(row.receivedFrom||'')+'" placeholder="Client / Guard / HOD / Police">'+
    '<label>Details *</label><textarea id="incDet" rows="3">'+h(row.details||'')+'</textarea>'+
    '<div class="row2"><div><label>Informed to HOD *</label><select id="incHod" onchange="toggleIncHod()">'+ynOpts(row.informedHod||'')+'</select></div>'+
    '<div id="incHodTimeWrap"><label>HOD informed time</label><input type="datetime-local" id="incHodAt" value="'+h(hodAt)+'"></div></div>'+
    '<div style="margin-top:12px"><button type="button" class="btn green app-tap-btn" onclick="saveIncident()">Save incident</button> '+
    '<button type="button" class="btn grey app-tap-btn" onclick="renderIncidents()">Clear form</button></div></div>'+
    '<div class="card"><div class="row2"><div><label>Show date</label><input type="date" id="incDate" value="'+h(istYmd())+'"></div>'+
    '<div style="align-self:end"><button type="button" class="btn app-tap-btn" onclick="loadIncidents()">Refresh</button></div></div><div id="incList"></div></div>';
  toggleIncHod();
  loadIncidents();
}
function toggleIncHod(){
  var wrap=el('incHodTimeWrap');
  if(!wrap)return;
  wrap.style.display=el('incHod')&&el('incHod').value==='Yes'?'block':'none';
}
function saveIncident(){
  var b=el('incBranch');
  var bn=b&&b.selectedOptions[0]?b.selectedOptions[0].text:'';
  if(bn==='— Branch —')bn='';
  var when=el('incWhen').value;
  if(!el('incHod').value){toast('Mark Informed to HOD as Yes or No',false);return;}
  api('saveIncident',{
    id:el('incId').value,occurredAt:when,dateYmd:(when||'').slice(0,10),
    clientName:el('incClient').value,location:el('incLoc').value,receivedFrom:el('incFrom').value,
    details:el('incDet').value,branchId:b.value,branchName:bn,
    informedHod:el('incHod').value,informedHodAt:el('incHod').value==='Yes'?el('incHodAt').value:''
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Incident saved',true);renderIncidents();
  });
}
function loadIncidents(){
  var d=el('incDate')?el('incDate').value:istYmd();
  api('listIncidents',{date:d}).then(function(res){
    var rows=res.j.incidents||[];
    INC_CACHE=rows;
    if(!el('incList'))return;
    if(!rows.length){el('incList').innerHTML='<p class="muted">No incidents on this date.</p>';return;}
    el('incList').innerHTML='<div class="tblwrap"><table><thead><tr><th>Date / time</th><th>Client</th><th>Location</th><th>From</th><th>Details</th><th>Branch</th><th>HOD</th></tr></thead><tbody>'+
      rows.map(function(r){
        return '<tr class="clickable" onclick="editIncident(\\''+h(r.id)+'\\')"><td>'+h(String(r.occurredAt||r.dateYmd||'').replace('T',' ').slice(0,16))+'</td><td>'+h(r.clientName)+'</td><td>'+h(r.location)+'</td><td>'+h(r.receivedFrom||'')+'</td><td>'+h(r.details)+'</td><td>'+h(r.branchName||'')+'</td><td>'+h(r.informedHod||'—')+(r.informedHod==='Yes'&&r.informedHodAt?' '+h(String(r.informedHodAt).replace('T',' ').slice(0,16)):'')+'</td></tr>';
      }).join('')+'</tbody></table></div>';
  });
}
function editIncident(id){
  var row=INC_CACHE.filter(function(x){return x.id===id;})[0];
  if(row)renderIncidents(row);
}

var NIGHT_CACHE=[];
function renderNightCalls(row){
  el('ttl').textContent='Track 2 · Night Calls';
  row=row||{};
  el('content').innerHTML='<div class="card"><h3>Night Calls report</h3><p class="muted">Track 2 · Help Desk. Call the guard, then mark Picked Up, Called Back and Inform HODs.</p>'+
    '<input type="hidden" id="ncId" value="'+h(row.id||'')+'">'+
    '<div class="row3"><div><label>Date *</label><input type="date" id="ncDateF" value="'+h(row.dateYmd||istYmd())+'"></div>'+
    '<div><label>Time *</label><input type="time" id="ncTime" value="'+h(row.callTime||istHm())+'"></div>'+
    '<div><label>Branch</label><select id="ncBr">'+branchOpts(row.branchId||'')+'</select></div></div>'+
    '<div class="row2"><div><label>Client *</label><input id="ncClientN" value="'+h(row.clientName||'')+'"></div>'+
    '<div><label>Location *</label><input id="ncLocN" value="'+h(row.location||'')+'"></div></div>'+
    '<div class="row2"><div><label>Guard name *</label><input id="ncGuard" value="'+h(row.guardName||'')+'"></div>'+
    '<div><label>Mobile No *</label><input id="ncMob" inputmode="tel" value="'+h(row.guardMobile||'')+'"></div></div>'+
    '<div class="row3"><div><label>Picked Up *</label><select id="ncPick">'+ynOpts(row.pickedUp||'')+'</select></div>'+
    '<div><label>Called Back *</label><select id="ncBack">'+ynOpts(row.calledBack||'')+'</select></div>'+
    '<div><label>Inform HODs *</label><select id="ncHodN">'+ynOpts(row.informedHod||'')+'</select></div></div>'+
    '<label>Notes</label><textarea id="ncNotesN" rows="2">'+h(row.notes||'')+'</textarea>'+
    '<div style="margin-top:12px"><button type="button" class="btn green app-tap-btn" onclick="saveNightCall()">Save night call</button> '+
    '<button type="button" class="btn grey app-tap-btn" onclick="renderNightCalls()">Clear form</button></div></div>'+
    '<div class="card"><div class="row2"><div><label>Show date</label><input type="date" id="ncListDate" value="'+h(istYmd())+'"></div>'+
    '<div style="align-self:end"><button type="button" class="btn app-tap-btn" onclick="loadNightCalls()">Refresh</button></div></div><div id="ncList"></div></div>';
  loadNightCalls();
}
function saveNightCall(){
  var b=el('ncBr');
  var bn=b&&b.selectedOptions[0]?b.selectedOptions[0].text:'';
  if(bn==='— Branch —')bn='';
  api('saveNightCall',{
    id:el('ncId').value,dateYmd:el('ncDateF').value,callTime:el('ncTime').value,
    clientName:el('ncClientN').value,location:el('ncLocN').value,
    guardName:el('ncGuard').value,guardMobile:el('ncMob').value,
    pickedUp:el('ncPick').value,calledBack:el('ncBack').value,informedHod:el('ncHodN').value,
    branchId:b.value,branchName:bn,notes:el('ncNotesN').value
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Night call saved',true);renderNightCalls();
  });
}
function loadNightCalls(){
  var d=el('ncListDate')?el('ncListDate').value:istYmd();
  api('listNightCalls',{date:d}).then(function(res){
    var rows=res.j.nightCalls||[];
    NIGHT_CACHE=rows;
    if(!el('ncList'))return;
    if(!rows.length){el('ncList').innerHTML='<p class="muted">No night calls on this date.</p>';return;}
    el('ncList').innerHTML='<div class="tblwrap"><table><thead><tr><th>Time</th><th>Client</th><th>Location</th><th>Guard</th><th>Mobile</th><th>Picked</th><th>Call back</th><th>HOD</th></tr></thead><tbody>'+
      rows.map(function(r){
        return '<tr class="clickable" onclick="editNightCall(\\''+h(r.id)+'\\')"><td>'+h(r.callTime||'')+'</td><td>'+h(r.clientName)+'</td><td>'+h(r.location)+'</td><td>'+h(r.guardName)+'</td><td>'+h(r.guardMobile)+'</td><td>'+h(r.pickedUp||'—')+'</td><td>'+h(r.calledBack||'—')+'</td><td>'+h(r.informedHod||'—')+'</td></tr>';
      }).join('')+'</tbody></table></div>';
  });
}
function editNightCall(id){
  var row=NIGHT_CACHE.filter(function(x){return x.id===id;})[0];
  if(row)renderNightCalls(row);
}

function onOtpLogin(){
  document.documentElement.classList.add('ac-authed');
  if(el('login'))el('login').style.display='none';
  if(el('shell'))el('shell').style.display='flex';
  bootApp();
}
function bootApp(){
  if(typeof otpRestoreSession==='function')otpRestoreSession();
  if(!OTP_SESSION){if(el('shell'))el('shell').style.display='none';return;}
  api('bootstrap',{}).then(function(res){
    if(res.s!==200){
      toast(res.j.error||'Not authorised',false);
      if(typeof otpHandleUnauthorized==='function')otpHandleUnauthorized();
      return;
    }
    CTX.email=res.j.email;CTX.name=res.j.name;CTX.director=!!res.j.director;
    CTX.canDelete=!!res.j.canDelete;
    CTX.canOpenManagement=!!res.j.canOpenManagement;
    CTX.branches=res.j.branches||[];CTX.categories=res.j.categories||[];
    CTX.todayIst=res.j.todayIst||'';
    var sw=el('switchPortalBtn');
    if(sw&&PORTAL!=='management'&&!CTX.canOpenManagement)sw.style.display='none';
    el('who').textContent=(CTX.name||CTX.email)+(CTX.director?' · Director':' · Operator');
    VIEW='dashboard';
    setNav();
    renderDashboard();
  });
}
(function boot(){
  try{
    if(typeof otpRestoreSession==='function'&&otpRestoreSession()&&OTP_SESSION){onOtpLogin();return;}
  }catch(e){}
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

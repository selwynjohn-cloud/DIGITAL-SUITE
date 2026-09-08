/**
 * Agile Meeting — Staff + Management SPA (left menu, date pickers).
 * Online meetings: Zoom / Teams · Strategic monthly · Others quarterly.
 */

import type { VercelRequest } from '@vercel/node'
import { hodLoginHtml, otpLoginHtml, otpLoginScript } from '../embedded-otp.js'
import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../suite-tap-feedback.js'
import { suiteDateInputInitScript } from '../suite-date-input.js'

function portalFromReq(req: VercelRequest): 'staff' | 'management' {
  return String(req.query?.portal || '').toLowerCase() === 'management' ? 'management' : 'staff'
}

export function renderMeetingsConsole(req: VercelRequest): string {
  const portal = portalFromReq(req)
  const isMgmt = portal === 'management'
  const title = isMgmt ? 'Agile Meeting — Management' : 'Agile Meeting — HOD / Staff'
  const login = isMgmt
    ? otpLoginHtml(title, 'Management — email PIN (all branches meeting overview)')
    : hodLoginHtml(title, 'HOD / Staff — select branch + branch password, or email PIN')
  const otp = otpLoginScript('meetings', 'Agile Meeting', portal)
  const accent = '#7c3aed'

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<script>(function(){try{if(sessionStorage.getItem('otp_meetings')||localStorage.getItem('otp_meetings'))document.documentElement.className+=' meet-authed';}catch(e){}})();</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}
body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:14px}
html.meet-authed #login{display:none!important}html.meet-authed #shell{display:flex!important}
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
.brand small{color:#c4b5fd;font-size:11px;font-weight:700}
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
.kpi b{display:block;font-size:20px;color:#c4b5fd}.kpi.bad b{color:#fca5a5}.kpi span{font-size:11px;color:#94a3b8;font-weight:700}
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
.portal-tag{display:inline-block;padding:3px 10px;border-radius:999px;background:rgba(124,58,237,.25);border:1px solid ${accent};color:#ddd6fe;font-size:11px;font-weight:800;margin-left:8px}
.tag{display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:800}
.tag.s{background:#4c1d95;color:#e9d5ff}.tag.q{background:#1e3a5f;color:#93c5fd}
.tag.z{background:#0c4a6e;color:#7dd3fc}.tag.t{background:#1e3a8a;color:#bfdbfe}
${SUITE_TAP_FEEDBACK_CSS}
</style></head><body>
${login}
<div id="shell">
  <aside class="side" id="side">
    <div class="brand">
      <img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile">
      <b>Agile Meeting</b>
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
var API='/api/meetings/data';
var PORTAL=${JSON.stringify(portal)};
var IS_MGMT=${isMgmt ? 'true' : 'false'};
var CTX={email:'',name:'',branches:[],clients:[],platforms:[],branchId:''};
var VIEW='dashboard';
var MEETINGS=[],ACTIONS=[],CONTACTS=[];

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
function switchPortal(){location.href='/meetings/?portal='+(PORTAL==='management'?'staff':'management');}

function menuItems(){
  return [
    {id:'dashboard',label:'Dashboard',icon:'▣'},
    {id:'schedule',label:'Schedule Meeting',icon:'📅'},
    {id:'meetings',label:'Meetings',icon:'💻'},
    {id:'clients',label:'Client List',icon:'📋'},
    {id:'contacts',label:'Contacts',icon:'👤'},
    {id:'actions',label:'Action Follow-ups',icon:'✓'},
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
  else if(id==='schedule')editMeeting();
  else if(id==='meetings')renderMeetings();
  else if(id==='clients')renderClients();
  else if(id==='contacts')renderContacts();
  else if(id==='actions')renderActions();
  else if(id==='reminders')renderReminders();
}
function branchOpts(sel){
  return '<option value="">— Branch —</option>'+(CTX.branches||[]).map(function(b){
    return '<option value="'+h(b.id)+'"'+(sel===b.id?' selected':'')+'>'+h(b.name)+'</option>';
  }).join('');
}
function platformOpts(sel){
  return (CTX.platforms||[{id:'Zoom',label:'Zoom'},{id:'Teams',label:'Microsoft Teams'}]).map(function(k){
    return '<option value="'+h(k.id)+'"'+(sel===k.id?' selected':'')+'>'+h(k.label)+'</option>';
  }).join('');
}
function clientOpts(sel){
  return '<option value="">— Client —</option>'+(CTX.clients||[]).map(function(c){
    var tag=c.isStrategic?' ★ Apex / Monthly':' · Quarterly';
    return '<option value="'+h(c.id)+'" data-name="'+h(c.name)+'" data-branch="'+h(c.branchId)+'" data-strategic="'+(c.isStrategic?'1':'0')+'" data-stars="'+(c.starRating||0)+'"'+(sel===c.id?' selected':'')+'>'+h(c.name)+tag+'</option>';
  }).join('');
}
function cadenceTag(m){
  return m.isStrategic?'<span class="tag s">Apex · Monthly</span>':'<span class="tag q">Quarterly</span>';
}
function platformTag(p){
  return p==='Teams'?'<span class="tag t">Teams</span>':'<span class="tag z">Zoom</span>';
}
function alertsHtml(rows){
  if(!rows||!rows.length)return '<p class="muted">No reminders right now.</p>';
  return rows.map(function(a){
    return '<div class="alert '+h(a.severity)+'"><b>'+h(a.title)+'</b> · '+h(a.branchName)+(a.clientName?' · '+h(a.clientName):'')+'<br>'+
      h(a.actionRequired)+'<br><span class="muted">Due '+h(a.dueDate)+'</span></div>';
  }).join('');
}

function renderDashboard(){
  el('ttl').textContent=IS_MGMT?'India Meetings Dashboard':'Branch Meetings Dashboard';
  el('content').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  api('dashboard',{}).then(function(res){
    if(res.s!==200){el('content').innerHTML='<div class="card">'+h(res.j.error||'Error')+'</div>';return;}
    var k=res.j.kpis||{};
    el('content').innerHTML='<div class="card"><h3>At a glance</h3>'+
      '<p class="muted">Apex Tier clients (5★ Strategic): online meeting once a month · Other clients: every quarter · Platforms: Zoom &amp; Microsoft Teams</p>'+
      '<div class="kgrid">'+
      '<div class="kpi"><b>'+k.scheduled+'</b><span>Upcoming scheduled</span></div>'+
      '<div class="kpi"><b>'+k.completed+'</b><span>Completed</span></div>'+
      '<div class="kpi"><b>'+k.strategic+'</b><span>Apex meetings</span></div>'+
      '<div class="kpi"><b>'+k.contacts+'</b><span>Contacts</span></div>'+
      '<div class="kpi bad"><b>'+k.openActions+'</b><span>Open actions</span></div>'+
      '<div class="kpi bad"><b>'+k.overdueActions+'</b><span>Overdue actions</span></div></div></div>'+
      '<div class="card"><h3>Reminders</h3>'+alertsHtml(res.j.alerts||[])+'</div>'+
      '<div class="card"><button type="button" class="btn green" onclick="nav(\\''+'schedule'+'\\')">Schedule meeting</button> '+
      '<button type="button" class="btn" onclick="nav(\\''+'actions'+'\\')">Action follow-ups</button></div>';
  });
}

function renderMeetings(){
  el('ttl').textContent='Meetings — Zoom & Teams';
  el('content').innerHTML='<div class="card"><div class="row2"><div><label>Search</label><input id="mQ"></div>'+
    '<div style="align-self:end"><button type="button" class="btn" onclick="loadMeetings()">Search</button> '+
    '<button type="button" class="btn green" onclick="editMeeting()">Schedule</button></div></div>'+
    '<p class="muted" style="margin-top:8px">Branch-wise online meetings with client contact email and meeting link.</p></div><div id="mtOut"></div>';
  loadMeetings();
}
function loadMeetings(){
  api('listMeetings',{q:el('mQ')?el('mQ').value:''}).then(function(res){
    MEETINGS=res.j.meetings||[];
    el('mtOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Date</th><th>Client</th><th>Platform</th><th>Contact</th><th>Host</th><th>Status</th><th></th></tr></thead><tbody>'+
      MEETINGS.map(function(m,i){
        return '<tr><td>'+h(m.meetingDate)+'<br><span class="muted">'+h(m.meetingTime)+'</span></td>'+
          '<td>'+h(m.clientName)+'<br>'+cadenceTag(m)+'<br><span class="muted">'+h(m.branchName)+'</span></td>'+
          '<td>'+platformTag(m.platform)+(m.meetingUrl?'<br><a href="'+h(m.meetingUrl)+'" target="_blank" rel="noopener" style="color:#a5b4fc">Join link</a>':'')+'</td>'+
          '<td>'+h(m.contactName)+'<br><span class="muted">'+h(m.contactEmail)+'</span></td>'+
          '<td>'+h(m.hostName)+'</td><td>'+h(m.status)+'</td>'+
          '<td><button type="button" class="btn grey" onclick="editMeeting('+i+')">Edit</button></td></tr>';
      }).join('')+'</tbody></table></div></div>';
  });
}
function editMeeting(i){
  var m=typeof i==='number'?MEETINGS[i]:null;
  el('ttl').textContent=m?'Edit meeting':'Schedule online meeting';
  VIEW=m?'meetings':'schedule';setNav();
  el('content').innerHTML='<div class="card"><h3>'+(m?'Edit':'Schedule')+' online meeting</h3>'+
    '<input type="hidden" id="mtId" value="'+h(m&&m.id||'')+'">'+
    '<div class="row2"><div><label>Client</label><select id="mtClient" onchange="onMeetClient()">'+(function(){
      var opts=clientOpts(m&&m.clientId||'');
      if(m&&m.clientId&&opts.indexOf('value="'+h(m.clientId)+'"')<0){
        opts+='<option value="'+h(m.clientId)+'" selected data-name="'+h(m.clientName)+'" data-branch="'+h(m.branchId)+'" data-strategic="'+(m.isStrategic?'1':'0')+'">'+h(m.clientName)+'</option>';
      }
      return opts;
    })()+'</select></div>'+
    '<div><label>Client name (if not in list)</label><input id="mtClientName" value="'+h(m&&m.clientName||'')+'"></div></div>'+
    '<div class="row3"><div><label>Branch</label><select id="mtBr">'+branchOpts(m&&m.branchId||CTX.branchId||'')+'</select></div>'+
    '<div><label>Platform</label><select id="mtPlat">'+platformOpts(m&&m.platform||'Zoom')+'</select></div>'+
    '<div><label>Status</label><select id="mtSt"><option>Scheduled</option><option>Completed</option><option>Cancelled</option><option>NoShow</option></select></div></div>'+
    '<div class="row3"><div><label>Meeting date</label><input type="date" id="mtDate" value="'+h(m&&m.meetingDate||'')+'"></div>'+
    '<div><label>Time</label><input type="time" id="mtTime" value="'+h(m&&m.meetingTime||'11:00')+'"></div>'+
    '<div><label>Duration (minutes)</label><input type="number" id="mtDur" value="'+(m&&m.durationMins||60)+'"></div></div>'+
    '<div class="row2"><div><label>Zoom / Teams join link</label><input id="mtUrl" value="'+h(m&&m.meetingUrl||'')+'" placeholder="https://…"></div>'+
    '<div><label>Meeting ID / passcode</label><input id="mtRef" value="'+h(m&&m.meetingRef||'')+'"></div></div>'+
    '<div class="row3"><div><label>Contact person</label><input id="mtCName" value="'+h(m&&m.contactName||'')+'"></div>'+
    '<div><label>Contact email</label><input type="email" id="mtCEmail" value="'+h(m&&m.contactEmail||'')+'"></div>'+
    '<div><label>Contact phone</label><input id="mtCPhone" value="'+h(m&&m.contactPhone||'')+'"></div></div>'+
    '<div class="row2"><div><label>Host (Agile)</label><input id="mtHost" value="'+h(m&&m.hostName||CTX.name||'')+'"></div>'+
    '<div><label>Host email</label><input type="email" id="mtHostEmail" value="'+h(m&&m.hostEmail||CTX.email||'')+'"></div></div>'+
    '<label>Agenda</label><textarea id="mtAgenda" rows="3">'+h(m&&m.agenda||'')+'</textarea>'+
    '<label>Minutes / notes (after meeting)</label><textarea id="mtMinutes" rows="3">'+h(m&&m.minutes||'')+'</textarea>'+
    '<p class="muted" id="mtCadenceHint">Apex Tier clients → monthly · Others → quarterly (auto from client stars).</p>'+
    '<button type="button" class="btn green" onclick="saveMeeting()">Save meeting</button> '+
    '<button type="button" class="btn grey" onclick="nav(\\''+'meetings'+'\\')">Cancel</button></div>';
  if(m)el('mtSt').value=m.status||'Scheduled';
  onMeetClient();
}
function onMeetClient(){
  var sel=el('mtClient');if(!sel)return;
  var opt=sel.selectedOptions[0];
  if(opt&&opt.value&&opt.getAttribute('data-name'))el('mtClientName').value=opt.getAttribute('data-name');
  var bid=opt&&opt.getAttribute('data-branch');
  if(bid&&el('mtBr'))el('mtBr').value=bid;
  var strat=opt&&opt.getAttribute('data-strategic')==='1';
  var hint=el('mtCadenceHint');
  if(hint)hint.textContent=strat?'This is an Apex Tier client → schedule once every month.':'Other client → schedule every quarter.';
}
function saveMeeting(){
  var b=el('mtBr');var bn=b&&b.selectedOptions[0]?b.selectedOptions[0].text:'';if(bn==='— Branch —')bn='';
  var sel=el('mtClient');var opt=sel&&sel.selectedOptions[0];
  var strat=opt&&opt.getAttribute('data-strategic')==='1';
  var stars=opt?Number(opt.getAttribute('data-stars')||0):0;
  if(!el('mtDate').value){toast('Please pick a meeting date',false);return;}
  if(!el('mtClientName').value){toast('Client name is required',false);return;}
  api('saveMeeting',{
    id:el('mtId').value,clientId:sel?sel.value:'',clientName:el('mtClientName').value,
    branchId:b.value,branchName:bn,platform:el('mtPlat').value,status:el('mtSt').value,
    meetingDate:el('mtDate').value,meetingTime:el('mtTime').value,durationMins:el('mtDur').value,
    meetingUrl:el('mtUrl').value,meetingRef:el('mtRef').value,
    contactName:el('mtCName').value,contactEmail:el('mtCEmail').value,contactPhone:el('mtCPhone').value,
    hostName:el('mtHost').value,hostEmail:el('mtHostEmail').value,
    agenda:el('mtAgenda').value,minutes:el('mtMinutes').value,
    isStrategic:!!strat,starRating:stars
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Meeting saved',true);nav('meetings');
  });
}

function renderClients(){
  el('ttl').textContent='Client list — meeting cadence';
  el('content').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  api('clientCadence',{}).then(function(res){
    var rows=res.j.clients||[];
    el('content').innerHTML='<div class="card"><h3>Branch client list</h3>'+
      '<p class="muted">Apex Tier (5★ Strategic) = monthly online meeting · Others = quarterly. Use Schedule to book Zoom / Teams.</p>'+
      '<div class="tblwrap"><table><thead><tr><th>Client</th><th>Branch</th><th>Business Tier</th><th>Cadence</th><th>Last meeting</th><th>Next due</th><th></th></tr></thead><tbody>'+
      rows.map(function(c){
        return '<tr><td>'+h(c.name)+'<br><span class="muted">'+h(c.staffName)+'</span></td><td>'+h(c.branchName)+'</td>'+
          '<td>'+h(c.tier)+'</td><td>'+(c.isStrategic?'<span class="tag s">Monthly</span>':'<span class="tag q">Quarterly</span>')+'</td>'+
          '<td>'+h(c.lastMeetingDate||'—')+(c.lastPlatform?' · '+h(c.lastPlatform):'')+'</td><td>'+h(c.nextDueDate||'—')+'</td>'+
          '<td><button type="button" class="btn grey" onclick="scheduleForClient(\\''+h(c.id)+'\\')">Schedule</button></td></tr>';
      }).join('')+'</tbody></table></div></div>';
  });
}
function scheduleForClient(cid){
  editMeeting();
  setTimeout(function(){
    if(el('mtClient')){el('mtClient').value=cid;onMeetClient();}
  },50);
}

function renderContacts(){
  el('ttl').textContent='Client contact persons';
  el('content').innerHTML='<div class="card"><div class="row2"><div><label>Search</label><input id="cQ"></div>'+
    '<div style="align-self:end"><button type="button" class="btn" onclick="loadContacts()">Search</button> '+
    '<button type="button" class="btn green" onclick="editContact()">Add contact</button></div></div></div><div id="ctOut"></div>';
  loadContacts();
}
function loadContacts(){
  api('listContacts',{q:el('cQ')?el('cQ').value:''}).then(function(res){
    CONTACTS=res.j.contacts||[];
    el('ctOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Client</th><th>Role</th><th></th></tr></thead><tbody>'+
      CONTACTS.map(function(c,i){
        return '<tr><td>'+h(c.name)+'</td><td>'+h(c.email)+'</td><td>'+h(c.phone)+'</td><td>'+h(c.clientName)+'<br><span class="muted">'+h(c.branchName)+'</span></td><td>'+h(c.role)+'</td>'+
          '<td><button type="button" class="btn grey" onclick="editContact('+i+')">Edit</button></td></tr>';
      }).join('')+'</tbody></table></div></div>';
  });
}
function editContact(i){
  var c=typeof i==='number'?CONTACTS[i]:null;
  el('content').innerHTML='<div class="card"><h3>'+(c?'Edit':'Add')+' contact person</h3>'+
    '<input type="hidden" id="ctId" value="'+h(c&&c.id||'')+'">'+
    '<div class="row2"><div><label>Client</label><select id="ctClient" onchange="onContactClient()">'+clientOpts(c&&c.clientId||'')+'</select></div>'+
    '<div><label>Client name</label><input id="ctClientName" value="'+h(c&&c.clientName||'')+'"></div></div>'+
    '<div class="row2"><div><label>Branch</label><select id="ctBr">'+branchOpts(c&&c.branchId||CTX.branchId||'')+'</select></div>'+
    '<div><label>Role / designation</label><input id="ctRole" value="'+h(c&&c.role||'')+'"></div></div>'+
    '<div class="row3"><div><label>Contact name</label><input id="ctName" value="'+h(c&&c.name||'')+'"></div>'+
    '<div><label>Email ID</label><input type="email" id="ctEmail" value="'+h(c&&c.email||'')+'"></div>'+
    '<div><label>Phone</label><input id="ctPhone" value="'+h(c&&c.phone||'')+'"></div></div>'+
    '<label>Notes</label><textarea id="ctNotes" rows="2">'+h(c&&c.notes||'')+'</textarea>'+
    '<button type="button" class="btn green" onclick="saveContact()">Save</button> '+
    '<button type="button" class="btn grey" onclick="nav(\\''+'contacts'+'\\')">Cancel</button></div>';
}
function onContactClient(){
  var sel=el('ctClient');if(!sel||!sel.value)return;
  var opt=sel.selectedOptions[0];
  if(opt&&opt.getAttribute('data-name'))el('ctClientName').value=opt.getAttribute('data-name');
  var bid=opt&&opt.getAttribute('data-branch');
  if(bid&&el('ctBr'))el('ctBr').value=bid;
}
function saveContact(){
  var b=el('ctBr');var bn=b&&b.selectedOptions[0]?b.selectedOptions[0].text:'';if(bn==='— Branch —')bn='';
  if(!el('ctName').value){toast('Contact name is required',false);return;}
  if(!el('ctClientName').value){toast('Client name is required',false);return;}
  api('saveContact',{
    id:el('ctId').value,clientId:el('ctClient').value,clientName:el('ctClientName').value,
    branchId:b.value,branchName:bn,name:el('ctName').value,email:el('ctEmail').value,
    phone:el('ctPhone').value,role:el('ctRole').value,notes:el('ctNotes').value
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Contact saved',true);nav('contacts');
  });
}

function renderActions(){
  el('ttl').textContent='Action plan follow-ups';
  el('content').innerHTML='<div class="card"><div class="row2"><div><label>Search</label><input id="aQ"></div>'+
    '<div style="align-self:end"><button type="button" class="btn" onclick="loadActions()">Search</button> '+
    '<button type="button" class="btn green" onclick="editAction()">Add action</button></div></div>'+
    '<p class="muted" style="margin-top:8px">Track action plans to completion — due dates use calendar picker.</p></div><div id="acOut"></div>';
  loadActions();
}
function loadActions(){
  api('listActions',{q:el('aQ')?el('aQ').value:'',status:'open'}).then(function(res){
    ACTIONS=res.j.actions||[];
    el('acOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Action</th><th>Client</th><th>Owner</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>'+
      ACTIONS.map(function(a,i){
        return '<tr><td>'+h(a.title)+'</td><td>'+h(a.clientName)+'<br><span class="muted">'+h(a.branchName)+'</span></td>'+
          '<td>'+h(a.ownerName)+'<br><span class="muted">'+h(a.ownerEmail)+'</span></td><td>'+h(a.dueDate)+'</td><td>'+h(a.status)+'</td>'+
          '<td><button type="button" class="btn grey" onclick="editAction('+i+')">Edit</button> '+
          (a.status!=='Done'?'<button type="button" class="btn green" onclick="markDone('+i+')">Done</button>':'')+'</td></tr>';
      }).join('')+'</tbody></table></div>'+
      '<button type="button" class="btn grey" onclick="loadAllActions()">Show all (incl. Done)</button></div>';
  });
}
function loadAllActions(){
  api('listActions',{q:el('aQ')?el('aQ').value:''}).then(function(res){
    ACTIONS=res.j.actions||[];
    el('acOut').innerHTML='<div class="card"><div class="tblwrap"><table><thead><tr><th>Action</th><th>Client</th><th>Owner</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>'+
      ACTIONS.map(function(a,i){
        return '<tr><td>'+h(a.title)+'</td><td>'+h(a.clientName)+'</td><td>'+h(a.ownerName)+'</td><td>'+h(a.dueDate)+'</td><td>'+h(a.status)+'</td>'+
          '<td><button type="button" class="btn grey" onclick="editAction('+i+')">Edit</button></td></tr>';
      }).join('')+'</tbody></table></div></div>';
  });
}
function editAction(i){
  var a=typeof i==='number'?ACTIONS[i]:null;
  el('content').innerHTML='<div class="card"><h3>'+(a?'Edit':'Add')+' action follow-up</h3>'+
    '<input type="hidden" id="acId" value="'+h(a&&a.id||'')+'">'+
    '<input type="hidden" id="acMeetId" value="'+h(a&&a.meetingId||'')+'">'+
    '<label>Action title</label><input id="acTitle" value="'+h(a&&a.title||'')+'">'+
    '<div class="row2"><div><label>Client</label><select id="acClient" onchange="onActionClient()">'+clientOpts(a&&a.clientId||'')+'</select></div>'+
    '<div><label>Client name</label><input id="acClientName" value="'+h(a&&a.clientName||'')+'"></div></div>'+
    '<div class="row3"><div><label>Branch</label><select id="acBr">'+branchOpts(a&&a.branchId||CTX.branchId||'')+'</select></div>'+
    '<div><label>Due date</label><input type="date" id="acDue" value="'+h(a&&a.dueDate||'')+'"></div>'+
    '<div><label>Status</label><select id="acSt"><option>Open</option><option>InProgress</option><option>Done</option><option>Overdue</option></select></div></div>'+
    '<div class="row2"><div><label>Owner name</label><input id="acOwner" value="'+h(a&&a.ownerName||CTX.name||'')+'"></div>'+
    '<div><label>Owner email</label><input type="email" id="acOwnerEmail" value="'+h(a&&a.ownerEmail||CTX.email||'')+'"></div></div>'+
    '<label>Completion notes</label><textarea id="acNotes" rows="3">'+h(a&&a.completionNotes||'')+'</textarea>'+
    '<button type="button" class="btn green" onclick="saveAction()">Save</button> '+
    '<button type="button" class="btn grey" onclick="nav(\\''+'actions'+'\\')">Cancel</button></div>';
  if(a)el('acSt').value=a.status||'Open';
}
function onActionClient(){
  var sel=el('acClient');if(!sel||!sel.value)return;
  var opt=sel.selectedOptions[0];
  if(opt&&opt.getAttribute('data-name'))el('acClientName').value=opt.getAttribute('data-name');
  var bid=opt&&opt.getAttribute('data-branch');
  if(bid&&el('acBr'))el('acBr').value=bid;
}
function saveAction(){
  var b=el('acBr');var bn=b&&b.selectedOptions[0]?b.selectedOptions[0].text:'';if(bn==='— Branch —')bn='';
  if(!el('acTitle').value){toast('Action title is required',false);return;}
  if(!el('acDue').value){toast('Please pick a due date',false);return;}
  api('saveAction',{
    id:el('acId').value,meetingId:el('acMeetId').value,title:el('acTitle').value,
    clientId:el('acClient').value,clientName:el('acClientName').value,
    branchId:b.value,branchName:bn,dueDate:el('acDue').value,status:el('acSt').value,
    ownerName:el('acOwner').value,ownerEmail:el('acOwnerEmail').value,completionNotes:el('acNotes').value
  }).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Action saved',true);nav('actions');
  });
}
function markDone(i){
  var a=ACTIONS[i];if(!a)return;
  api('saveAction',Object.assign({},a,{status:'Done',completionNotes:(a.completionNotes||'')+(a.completionNotes?' ':'')+'Marked done'})).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Marked done',true);loadActions();
  });
}

function renderReminders(){
  el('ttl').textContent='Meeting & action reminders';
  el('content').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  api('alerts',{}).then(function(res){
    el('content').innerHTML='<div class="card"><h3>All reminders</h3>'+
      '<p class="muted">Meeting reminders at 7 / 3 / 1 days. Cadence gaps (monthly / quarterly). Open action due dates. Daily mail to Director.</p>'+
      alertsHtml(res.j.alerts||[])+'</div>';
  });
}

function onOtpLogin(){
  document.documentElement.classList.add('meet-authed');
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
    CTX.clients=res.j.clients||[];CTX.platforms=res.j.platforms||[];
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

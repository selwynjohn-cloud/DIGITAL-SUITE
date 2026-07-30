import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from '../_lib/mis/layout.js'

const MIS_ACTIVE = '/mis-admin'
const MIS_TITLE = 'Master Directory'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Master Directory</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
.hidden{display:none!important}
${MIS_LAYOUT_CSS}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="m-wrap" id="app">
  <div id="loadStatus" class="m-card"><p class="hint" style="margin:0">Loading Master Directory…</p></div>
  <div id="loadErr" class="m-card hidden" style="border-color:#ef4444"></div>
  <div class="m-tabs">
    <button class="m-tab active" data-t="branches" onclick="showTab('branches')">Branches</button>
    <button class="m-tab" data-t="clients" onclick="showTab('clients')">Sites</button>
    <button class="m-tab" data-t="staff" onclick="showTab('staff')">Operations Staff</button>
    <button class="m-tab" data-t="support" onclick="showTab('support')">Support Departments</button>
    <button class="m-tab" data-t="guards" onclick="showTab('guards')">Guard Compliance</button>
  </div>
  <div id="tab-branches" class="m-card">
    <div class="hint">Each branch has a <b>6-digit password</b> for HOD / Staff sign-in. Turn the switch <b>off</b> to deactivate — deactivated branches stay in the list but are hidden from daily reports and HOD login. Renamed branches update on <b>all reports</b> when you save.</div>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th>Branch Name</th><th>HOD Password</th><th>Active</th><th>Share with HOD / Staff</th></tr></thead><tbody id="brRows"></tbody></table></div>
    <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="m-btn m-btn-grey" onclick="addBranch()">+ Add Branch</button><button class="m-btn m-btn-green" onclick="generateAllPasswords()">🔑 Refresh All Passwords</button></div>
    <div id="pwMsg" class="hint" style="margin-top:8px;display:none"></div>
  </div>
  <div id="tab-clients" class="m-card hidden">
    <div class="hint">Pick a <b>branch</b> first — <b>sites</b> load branch-by-branch (1,000+ total). One <b>client</b> may have many sites. Edit deployment strength per shift.</div>
    <label class="m-lbl" style="max-width:320px">Branch</label>
    <select class="m-inp" id="clientBranchFilter" style="max-width:320px" onchange="loadClientsForBranch()"></select>
    <p id="clientLoadMsg" class="hint" style="margin-top:8px;color:#94a3b8">Select a branch to load sites.</p>
    <div class="mtblwrap" style="margin-top:10px"><table class="mtbl"><thead><tr>
      <th>Branch</th><th>Client</th><th>Site / Unit</th><th>Ops Staff</th><th>San A</th><th>San G</th><th>San B</th><th>San C</th><th>SLA Day</th><th>SLA Night</th><th>Stars (1–5)</th><th>Status</th>
    </tr></thead><tbody id="clRows"></tbody></table></div>
    <div style="margin-top:10px"><button class="m-btn m-btn-grey" onclick="addClient()">+ Add Site</button></div>
  </div>
  <div id="tab-staff" class="m-card hidden">
    <div class="hint"><b>Operations Team</b> — branch field staff (submit MIS, visits, deployment). Deactivate instead of delete.</div>
    <p id="staffLoadMsg" class="hint" style="margin-bottom:8px;color:#94a3b8"></p>
    <label style="display:flex;align-items:center;gap:6px;margin:8px 0;font-size:13px;color:#94a3b8"><input type="checkbox" id="showInactiveStaff" onchange="renderStaff()"> Show deactivated staff</label>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th>Branch</th><th>Name</th><th>Role</th><th>Phone</th><th>Status</th></tr></thead><tbody id="stRows"></tbody></table></div>
    <div style="margin-top:10px"><button class="m-btn m-btn-grey" onclick="addStaff()">+ Add Operations Staff</button></div>
  </div>
  <div id="tab-support" class="m-card hidden">
    <div class="hint"><b>Support Departments</b> — Stores, HR, Recruitment, Payroll. These teams <b>do not submit</b> daily branch MIS reports.</div>
    <label style="display:flex;align-items:center;gap:6px;margin:8px 0;font-size:13px;color:#94a3b8"><input type="checkbox" id="showInactiveSupport" onchange="renderSupport()"> Show deactivated</label>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th>Department</th><th>Name</th><th>Role</th><th>Phone</th><th>Status</th><th></th></tr></thead><tbody id="suRows"></tbody></table></div>
    <div style="margin-top:10px"><button class="m-btn m-btn-grey" onclick="addSupport()">+ Add Support Staff</button></div>
  </div>
  <div id="tab-guards" class="m-card hidden">
    <div class="hint">Guard PVC / Medical / Training — pick branch, then records load. Also at <a href="/mis-guard-docs" target="_blank" style="color:#c9a84c">/mis-guard-docs</a>.</div>
    <label class="m-lbl" style="max-width:280px">Branch</label>
    <select class="m-inp" id="guardBranchFilter" style="max-width:280px" onchange="loadGuardDocs()"></select>
    <p id="guardLoadMsg" class="hint" style="margin:8px 0;color:#94a3b8">Select a branch to load guard records.</p>
    <label style="display:flex;align-items:center;gap:6px;margin:10px 0;font-size:13px;color:#94a3b8"><input type="checkbox" id="showInactiveGuards" onchange="renderGuardDocs()"> Show deactivated guards</label>
    <div class="mtblwrap" style="margin-top:10px"><table class="mtbl"><thead><tr>
      <th>Unit</th><th>Incharge</th><th>Guard</th><th>Emp ID</th><th>Mobile</th><th>DOJ</th><th>PVC</th><th>Medical</th><th>Training</th><th>Remarks</th><th>Status</th>
    </tr></thead><tbody id="gdRows"></tbody></table></div>
    <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="m-btn m-btn-grey" onclick="addGuardDoc()">+ Add Row</button><button class="m-btn m-btn-green" onclick="saveGuardDocs()">Save Guard Records</button></div>
  </div>
</div>
<div class="m-savebar noprint"><div id="saveMsg" class="hint" style="flex-basis:100%;display:none"></div><button class="m-btn m-btn-green" onclick="saveAll()">✅ Save Master Directory &amp; Publish</button></div>
`)}
<script>
${MIS_SESSION_JS}
var PW='',branches=[],clients=[],staff=[],guardDocs=[],siteCounts={},clientNameCounts={},totalSites=0,totalClientNames=0,clientsLoadedBranch='';
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function nid(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function api(action,extra){return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,password:PW},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
function updateTabBadges(){
  var ops=opsStaff().length,su=supportStaff().length;
  document.querySelectorAll('.m-tab').forEach(function(btn){
    var t=btn.getAttribute('data-t');
    if(t==='clients'&&totalSites)btn.textContent='Sites ('+totalSites+')';
    if(t==='staff'&&ops)btn.textContent='Operations Staff ('+ops+')';
    if(t==='support'&&su)btn.textContent='Support Departments ('+su+')';
  });
}
function branchSiteSummary(bid){
  var sites=siteCounts[bid]||0,clients=clientNameCounts[bid]||0;
  if(!sites&&!clients)return '';
  return ' ('+sites+' site'+(sites===1?'':'s')+(clients?', '+clients+' client'+(clients===1?'':'s')+')':')')+'';
}
function showTab(t){document.querySelectorAll('.m-tab').forEach(function(x){x.classList.toggle('active',x.getAttribute('data-t')===t);});['branches','clients','staff','support','guards'].forEach(function(id){var e=el('tab-'+id);if(e)e.classList.toggle('hidden',id!==t);});if(t==='clients')loadClientsForBranch();if(t==='guards')loadGuardDocs();}
function activeBranches(){return branches.filter(function(b){return b.active!==false;});}
function branchShareText(b){return 'Agile Security Force — Branch sign-in\\n\\nBranch: '+(b.name||'(name)')+'\\nPassword: '+(b.pin||'')+'\\n\\n1. Open https://www.agilegroup-digital.co.in\\n2. Open the app (MIS, Fleet, Guards, etc.)\\n3. Tap HODs / Staff\\n4. Select branch: '+(b.name||'')+'\\n5. Enter the password above';}
function copyBranchCreds(i){var t=branchShareText(branches[i]);if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){alert('Copied — paste into WhatsApp or email for the HOD.');}).catch(function(){prompt('Copy this message:',t);});}else{prompt('Copy this message:',t);}}
function whatsappBranchCreds(i){window.open('https://wa.me/?text='+encodeURIComponent(branchShareText(branches[i])),'_blank');}
function emailBranchCreds(i){var b=branches[i];var sub=encodeURIComponent('Branch login — '+(b.name||'Agile'));var body=encodeURIComponent(branchShareText(b));window.location.href='mailto:?subject='+sub+'&body='+body;}
function toggleBranchActive(i){branches[i].active=branches[i].active===false;renderBranches();fillBranchFilter();fillGuardBranchFilter();}
function renderBranches(){var tb=el('brRows');tb.innerHTML='';branches.forEach(function(b,i){var act=b.active!==false;var pw=b.pin||'(creating…)';var tr=document.createElement('tr');if(!act)tr.className='m-row-inactive';tr.innerHTML='<td><input value="'+a(b.name)+'" oninput="branches['+i+'].name=this.value"></td><td style="white-space:nowrap"><code style="color:#fde68a;font-size:15px;letter-spacing:.1em">'+h(pw)+'</code> <button type="button" class="m-btn m-btn-grey" style="padding:4px 8px;font-size:12px;margin-left:6px" onclick="regenPassword(\\''+a(b.id)+'\\','+i+')">Reset</button></td><td><label class="m-sw"><input type="checkbox" '+(act?'checked':'')+' onchange="toggleBranchActive('+i+')"><i></i><span>'+(act?'Active':'Deactivated')+'</span></label></td><td><div class="m-share"><button type="button" class="m-btn m-btn-grey" onclick="copyBranchCreds('+i+')">Copy</button><button type="button" class="m-btn m-btn-green" onclick="whatsappBranchCreds('+i+')">WhatsApp</button><button type="button" class="m-btn m-btn-navy" onclick="emailBranchCreds('+i+')">Email</button></div></td>';tb.appendChild(tr);});}
function generateAllPasswords(){if(!confirm('Create new passwords for ALL branches? Old passwords will stop working.'))return;var m=el('pwMsg');m.style.display='block';m.style.color='#94a3b8';m.textContent='Refreshing passwords…';api('generateBranchPasswords').then(function(res){if(res.status!==200){m.style.color='#f87171';m.textContent=res.body.error||'Could not refresh.';return;}(res.body.branches||[]).forEach(function(nb){var i=branches.findIndex(function(x){return x.id===nb.id;});if(i>=0)branches[i].pin=nb.pin;});renderBranches();m.style.color='#4ade80';m.textContent='✅ All branch passwords updated. Share each password with the branch HOD.';}).catch(function(){m.style.color='#f87171';m.textContent='Network error.';});}
function regenPassword(id,i){if(!confirm('Reset password for this branch? The old password will stop working immediately.'))return;api('regenerateBranchPassword',{branchId:id}).then(function(res){if(res.status!==200){alert(res.body.error||'Error');return;}branches[i].pin=res.body.pin;renderBranches();alert('New password for '+res.body.name+': '+res.body.pin+'\\n\\nGive this to the branch HOD.');}).catch(function(){alert('Network error.');});}
function newBranchPassword(){return String(100000+Math.floor(Math.random()*900000));}
function addBranch(){branches.push({id:nid('br'),name:'',pin:newBranchPassword(),active:true});renderBranches();fillBranchFilter();}

function branchName(id){var b=branches.find(function(x){return x.id===id;});return b?b.name:'';}
function branchOptions(sel){return '<option value="">— select —</option>'+activeBranches().map(function(b){return '<option value="'+a(b.id)+'"'+(b.id===sel?' selected':'')+'>'+h(b.name)+'</option>';}).join('');}
function fillBranchFilter(){var s=el('clientBranchFilter');if(!s)return;var cur=s.value;s.innerHTML=branches.map(function(b){return '<option value="'+a(b.id)+'">'+h(b.name)+branchSiteSummary(b.id)+(b.active===false?' — off':'')+'</option>';}).join('');if(!cur&&branches.length)cur=branches[0].id;s.value=cur;}
function loadClientsForBranch(){
  var bid=el('clientBranchFilter')&&el('clientBranchFilter').value;
  var msg=el('clientLoadMsg');
  if(!bid){if(msg)msg.textContent='Select a branch to load sites.';return;}
  if(msg)msg.textContent='Loading sites for this branch…';
  api('loadClients',{branchId:bid}).then(function(res){
    if(res.status!==200){if(msg)msg.textContent=res.body.error||'Could not load sites.';return;}
    clients=res.body.clients||[];
    clientsLoadedBranch=bid;
    renderClients();
    var sc=res.body.siteCount!=null?res.body.siteCount:clients.length;
    var cc=res.body.clientNameCount!=null?res.body.clientNameCount:0;
    if(msg)msg.textContent='✅ '+sc+' site'+(sc===1?'':'s')+(cc?', '+cc+' client'+(cc===1?'':'s'):'')+' loaded for this branch.';
  }).catch(function(){if(msg)msg.textContent='Network error loading sites.';});
}
function fillGuardBranchFilter(){var s=el('guardBranchFilter');if(!s)return;var cur=s.value;s.innerHTML=activeBranches().map(function(b){return '<option value="'+a(b.id)+'">'+h(b.name)+'</option>';}).join('');s.value=cur||(activeBranches()[0]?activeBranches()[0].id:'');}
function loadGuardDocs(){var bid=el('guardBranchFilter').value;var msg=el('guardLoadMsg');if(!bid){guardDocs=[];renderGuardDocs();if(msg)msg.textContent='Select a branch to load guard records.';return;}if(msg)msg.textContent='Loading guard records…';api('guardDocs',{branchId:bid}).then(function(res){guardDocs=(res.status===200?(res.body.docs||[]):[]).map(function(g){g.active=g.active!==false;return g;});renderGuardDocs();if(msg)msg.textContent=guardDocs.length?('✅ '+guardDocs.length+' guard records loaded.'):'No guard records for this branch yet — use + Add Row or /mis-guard-docs.';}).catch(function(){if(msg)msg.textContent='Network error loading guards.';});}
function gfld(i,k){return '<input value="'+a(guardDocs[i][k])+'" oninput="guardDocs['+i+'][\\''+k+'\\']=this.value">';}
function toggleGuardActive(i){guardDocs[i].active=guardDocs[i].active===false;renderGuardDocs();}
function renderGuardDocs(){var tb=el('gdRows');if(!tb)return;var show=el('showInactiveGuards')&&el('showInactiveGuards').checked;tb.innerHTML='';guardDocs.forEach(function(g,i){if(!show&&g.active===false)return;var act=g.active!==false;var tr=document.createElement('tr');if(!act)tr.className='m-row-inactive';tr.innerHTML=
  '<td>'+gfld(i,'unitName')+'</td><td>'+gfld(i,'incharge')+'</td><td>'+gfld(i,'guardName')+'</td><td>'+gfld(i,'employeeId')+'</td><td>'+gfld(i,'mobile')+'</td><td>'+gfld(i,'doj')+'</td><td>'+gfld(i,'pvc')+'</td><td>'+gfld(i,'medical')+'</td><td>'+gfld(i,'training')+'</td><td>'+gfld(i,'remarks')+'</td>'+
  '<td><button type="button" class="m-toggle '+(act?'on':'off')+'" onclick="toggleGuardActive('+i+')">'+(act?'Active':'Inactive')+'</button></td>';tb.appendChild(tr);});}
function addGuardDoc(){guardDocs.push({id:nid('gd'),unitName:'',incharge:'',inchargeMobile:'',guardName:'',employeeId:'',mobile:'',doj:'',idCardValidity:'',aadhar:'',pvc:'',pvcValidity:'',medical:'',medicalValidity:'',training:'',remarks:'',active:true});renderGuardDocs();}
function saveGuardDocs(){var bid=el('guardBranchFilter').value;api('saveGuardDocs',{branchId:bid,docs:guardDocs}).then(function(res){alert(res.status===200?'Guard records saved ✓':(res.body.error||'Error'));});}

// Clients
function clientIndexById(id){for(var i=0;i<clients.length;i++){if(clients[i].id===id)return i;}return -1;}
function toggleClientActive(id){var i=clientIndexById(id);if(i<0)return;clients[i].active=clients[i].active===false;renderClients();}
function renderClients(){var f=el('clientBranchFilter').value;var tb=el('clRows');tb.innerHTML='';clients.forEach(function(c,i){if(f&&c.branchId!==f)return;var tr=document.createElement('tr');if(c.active===false)tr.className='m-row-inactive';
  var act=c.active!==false;
  tr.innerHTML='<td><select onchange="clients['+i+'].branchId=this.value">'+branchOptions(c.branchId)+'</select></td>'+
  '<td><input value="'+a(c.name)+'" oninput="clients['+i+'].name=this.value"></td>'+
  '<td><input value="'+a(c.location)+'" oninput="clients['+i+'].location=this.value"></td>'+
  '<td><input value="'+a(c.staffName)+'" oninput="clients['+i+'].staffName=this.value"></td>'+
  '<td><input type="number" value="'+(c.sanA||0)+'" oninput="clients['+i+'].sanA=+this.value"></td>'+
  '<td><input type="number" value="'+(c.sanG||0)+'" oninput="clients['+i+'].sanG=+this.value"></td>'+
  '<td><input type="number" value="'+(c.sanB||0)+'" oninput="clients['+i+'].sanB=+this.value"></td>'+
  '<td><input type="number" value="'+(c.sanC||0)+'" oninput="clients['+i+'].sanC=+this.value"></td>'+
  '<td><input value="'+a(c.slaDayVisit)+'" oninput="clients['+i+'].slaDayVisit=this.value"></td>'+
  '<td><input value="'+a(c.slaNightCheck)+'" oninput="clients['+i+'].slaNightCheck=this.value"></td>'+
  '<td><select onchange="clients['+i+'].starRating=+this.value" style="min-width:70px">'+
    [1,2,3,4,5].map(function(n){return '<option value="'+n+'"'+(Math.round(c.starRating||(c.highValue?4:2))===n?' selected':'')+'>'+n+' ★</option>';}).join('')+
  '</select></td>'+
  '<td><button type="button" class="m-toggle '+(act?'on':'off')+'" onclick="toggleClientActive(\\''+a(c.id)+'\\')">'+(act?'Active':'Inactive')+'</button></td>';
  tb.appendChild(tr);});}
function addClient(){var f=el('clientBranchFilter').value;clients.push({id:nid('cl'),branchId:f||'',name:'',location:'',staffName:'',sanA:0,sanG:0,sanB:0,sanC:0,slaDayVisit:'',slaNightCheck:'',starRating:2,highValue:false,active:true});renderClients();}

// Staff — Operations vs Support
var SUPPORT_DEPTS=['Stores','HR','Recruitment','Payroll'];
function opsStaff(){return staff.filter(function(s){return s.team!=='support';});}
function supportStaff(){return staff.filter(function(s){return s.team==='support';});}
function toggleStaffActive(i){var s=opsStaff()[i];var idx=staff.indexOf(s);if(idx>=0){staff[idx].active=staff[idx].active===false;renderStaff();}}
function renderStaff(){var tb=el('stRows');var show=el('showInactiveStaff')&&el('showInactiveStaff').checked;var list=opsStaff();var msg=el('staffLoadMsg');if(msg)msg.textContent=list.length?('✅ '+list.length+' operations staff loaded.'):'No operations staff in Master Directory yet — use + Add Operations Staff.';tb.innerHTML='';list.forEach(function(s,i){if(!show&&s.active===false)return;var act=s.active!==false;var idx=staff.indexOf(s);var tr=document.createElement('tr');if(!act)tr.className='m-row-inactive';tr.innerHTML='<td><select onchange="staff['+idx+'].branchId=this.value">'+branchOptions(s.branchId)+'</select></td><td><input value="'+a(s.name)+'" oninput="staff['+idx+'].name=this.value"></td><td><input value="'+a(s.role)+'" oninput="staff['+idx+'].role=this.value"></td><td><input value="'+a(s.phone)+'" oninput="staff['+idx+'].phone=this.value"></td><td><button type="button" class="m-toggle '+(act?'on':'off')+'" onclick="toggleStaffActive('+i+')">'+(act?'Active':'Inactive')+'</button></td>';tb.appendChild(tr);});}
function addStaff(){staff.push({id:nid('st'),branchId:'',name:'',role:'',phone:'',active:true,team:'operations',department:''});renderStaff();}
function toggleSupportActive(i){var s=supportStaff()[i];var idx=staff.indexOf(s);if(idx>=0){staff[idx].active=staff[idx].active===false;renderSupport();}}
function delSupport(i){var s=supportStaff()[i];if(!confirm('Remove '+((s&&s.name)||'this person')+'?'))return;var idx=staff.indexOf(s);if(idx>=0)staff.splice(idx,1);renderSupport();}
function renderSupport(){var tb=el('suRows');if(!tb)return;var show=el('showInactiveSupport')&&el('showInactiveSupport').checked;var list=supportStaff();tb.innerHTML='';list.forEach(function(s,i){if(!show&&s.active===false)return;var act=s.active!==false;var idx=staff.indexOf(s);var tr=document.createElement('tr');if(!act)tr.className='m-row-inactive';tr.innerHTML='<td><select onchange="staff['+idx+'].department=this.value">'+SUPPORT_DEPTS.map(function(d){return '<option'+(s.department===d?' selected':'')+'>'+h(d)+'</option>';}).join('')+'</select></td><td><input value="'+a(s.name)+'" oninput="staff['+idx+'].name=this.value"></td><td><input value="'+a(s.role)+'" oninput="staff['+idx+'].role=this.value"></td><td><input value="'+a(s.phone)+'" oninput="staff['+idx+'].phone=this.value"></td><td><button type="button" class="m-toggle '+(act?'on':'off')+'" onclick="toggleSupportActive('+i+')">'+(act?'Active':'Inactive')+'</button></td><td><button type="button" class="m-btn m-btn-grey" style="padding:4px 8px" onclick="delSupport('+i+')">Remove</button></td>';tb.appendChild(tr);});}
function addSupport(){staff.push({id:nid('st'),branchId:'',name:'',role:'',phone:'',active:true,team:'support',department:'HR'});renderSupport();}

function saveAll(){var m=el('saveMsg');m.style.display='block';m.style.color='#4ade80';m.textContent='Saving...';
  var chain=api('saveBranches',{branches:branches});
  if(clientsLoadedBranch&&clients.length){
    chain=chain.then(function(){return api('saveClients',{clients:clients,branchId:clientsLoadedBranch,mergeBranch:true});});
  }
  chain.then(function(){return api('saveStaff',{staff:staff});}).then(function(res){
    if(res.status===200){
      m.textContent='✅ Master Directory saved — branch names updated on all reports.';
      if(clientsLoadedBranch)api('login').then(function(r){if(r.status===200){siteCounts=r.body.siteCounts||r.body.clientCounts||{};clientNameCounts=r.body.clientNameCounts||{};totalSites=r.body.totalSites||r.body.totalClients||0;totalClientNames=r.body.totalClientNames||0;fillBranchFilter();updateTabBadges();}});
    }else{m.style.color='#f87171';m.textContent=res.body.error||'Could not save.';}
  }).catch(function(){m.style.color='#f87171';m.textContent='Network error.';});}
function showLoadErr(msg){
  var e=el('loadErr');var s=el('loadStatus');
  if(s)s.classList.add('hidden');
  if(!e)return;
  e.classList.remove('hidden');
  e.innerHTML='<p style="color:#f87171;margin-bottom:10px">'+h(msg)+'</p><button type="button" class="m-btn m-btn-gold" onclick="location.href=\\'/mis?dest=/mis-admin\\'">Sign in again</button>';
}
function misMgmtToken(){
  var keys=['otp_mis','otp_fleet','otp_recruitment','otp_guards','otp_crm','otp_pulse','otp_securityjob'];
  for(var i=0;i<keys.length;i++){var t=sessionStorage.getItem(keys[i]);if(t)return t;}
  return '';
}
function ensureMisCookie(done){
  fetch('/api/mis/login',{method:'GET',credentials:'include'}).then(function(r){return r.json();}).then(function(j){
    if(j&&j.ok)return done();
    var t=misMgmtToken();
    if(!t){showLoadErr('Sign-in not complete. Open App 05 → Management (not the separate Master Directory button).');return;}
    fetch('/api/mis/login',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionToken:t})})
      .then(function(r){return r.json().then(function(x){return{s:r.status,j:x};});})
      .then(function(res){
        if(res.s===200)done();
        else showLoadErr(res.j.error||'Could not connect your sign-in. Use App 05 → Management.');
      }).catch(function(){showLoadErr('Network error — check internet and try again.');});
  }).catch(function(){showLoadErr('Network error — check internet and try again.');});
}
function initPage(){
  ensureMisCookie(function(){
    api('login').then(function(res){
      var s=el('loadStatus');if(s)s.classList.add('hidden');
      if(res.status!==200){showLoadErr(res.body.error||'Could not load Master Directory (error '+res.status+').');return;}
      branches=(res.body.branches||[]).map(function(b){b.active=b.active!==false;return b;});
      siteCounts=res.body.siteCounts||res.body.clientCounts||{};
      clientNameCounts=res.body.clientNameCounts||{};
      totalSites=res.body.totalSites||res.body.totalClients||0;
      totalClientNames=res.body.totalClientNames||0;
      staff=(res.body.staff||[]).map(function(s){s.active=s.active!==false;if(!s.team)s.team='operations';return s;});
      clients=[];
      clientsLoadedBranch='';
      if(!branches.length){showLoadErr('No branches loaded.');return;}
      var e=el('loadErr');if(e)e.classList.add('hidden');
      renderBranches();fillBranchFilter();fillGuardBranchFilter();renderStaff();renderSupport();updateTabBadges();
      var m=el('pwMsg');if(m){m.style.display='block';m.style.color='#4ade80';m.textContent='✅ '+branches.length+' branches'+(totalSites?', '+totalSites+' sites':'')+(totalClientNames?', '+totalClientNames+' clients':'')+(staff.length?', '+staff.length+' staff':'')+'.';}
    }).catch(function(){showLoadErr('Network error loading data.');});
  });
}
misStart();
</script>
</body></html>`

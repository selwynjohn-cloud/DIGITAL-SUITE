import type { VercelRequest, VercelResponse } from '@vercel/node'
import { BENEFIT_OPTIONS } from '../_lib/securityjob/store.js'
import { otpLoginHtml, otpLoginScript } from '../_lib/embedded-otp.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SecurityJob — Admin Sign In</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#eef2f7;color:#0f172a;font-size:16px}
body.login-mode{background:linear-gradient(165deg,#0b1220 0%,#14224f 42%,#1a3068 100%);min-height:100vh}
.login-shell{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:28px 16px 40px}
.login-wrap{width:100%;max-width:460px}
.login-brand{text-align:center;margin-bottom:22px}
.login-brand img{height:62px;filter:drop-shadow(0 4px 12px rgba(0,0,0,.35))}
.login-brand h1{color:#fff;font-size:24px;font-weight:900;margin-top:14px;letter-spacing:.2px}
.login-brand .tag{display:inline-block;margin-top:8px;padding:6px 14px;border-radius:999px;background:rgba(201,168,76,.18);border:1px solid #c9a84c;color:#fde68a;font-size:12px;font-weight:800;letter-spacing:.4px}
.login-brand .hint{color:#94a3b8;font-size:13px;margin-top:12px;line-height:1.55;max-width:380px;margin-left:auto;margin-right:auto}
.login-feats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px}
.login-feat{background:rgba(255,255,255,.07);border:1px solid rgba(201,168,76,.28);border-radius:11px;padding:12px 10px;color:#e2e8f0;font-size:12px;line-height:1.4;text-align:center}
.login-feat b{display:block;color:#c9a84c;font-size:11px;margin-bottom:3px;text-transform:uppercase;letter-spacing:.3px}
.login-site{margin-top:20px;text-align:center}
.login-site a{color:#c9a84c;text-decoration:none;font-weight:800;font-size:14px}
.login-site a:hover{text-decoration:underline}
#login{max-width:none;margin:0;padding:0;text-align:left}
#login .card{background:linear-gradient(180deg,#ffffff,#f8fafc);border:2px solid #c9a84c;border-radius:16px;padding:28px 24px;box-shadow:0 22px 55px rgba(0,0,0,.38)}
#login .card h2{color:#14224f;font-size:21px;font-weight:900;margin-bottom:4px}
#login .card>p{color:#64748b!important;font-size:13px!important;margin-bottom:12px!important}
#login label{display:block;font-size:12px;color:#475569;margin:10px 0 5px;font-weight:800;text-transform:uppercase;letter-spacing:.25px}
#login input[type=email],#login input[inputmode]{width:100%;padding:13px 14px;border:2px solid #cbd5e1;border-radius:10px;background:#fff;color:#0f172a;font-size:16px}
#login input:focus{outline:none;border-color:#c9a84c;box-shadow:0 0 0 3px rgba(201,168,76,.25)}
#login .btn.gold{width:100%;margin-top:14px;padding:14px;border:none;border-radius:10px;font-weight:900;font-size:16px;cursor:pointer;background:linear-gradient(135deg,#b45309,#f59e0b);color:#14224f}
#login .btn.gold:hover{filter:brightness(1.05)}
#login #msg.msg{margin-top:12px;padding:11px 12px;border-radius:9px;font-size:14px;font-weight:600}
.top{background:#14224f;color:#fff;padding:18px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;border-bottom:4px solid #c9a84c;flex-wrap:wrap}
.top h1{font-size:23px}.wrap{max-width:860px;margin:0 auto;padding:18px}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:18px}
.sec{font-size:20px;font-weight:800;color:#14224f;margin-bottom:14px;border-bottom:2px solid #e2e8f0;padding-bottom:9px}
label{display:block;font-size:14.5px;font-weight:700;color:#475569;margin:10px 0 4px}
input[type=text],select{width:100%;padding:11px 13px;border:1px solid #cbd5e1;border-radius:8px;font-size:16px}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.btn{padding:12px 20px;border:none;border-radius:8px;font-weight:800;cursor:pointer;font-size:16px;text-decoration:none;display:inline-block}
.g{background:#14224f;color:#fff}.b{background:#1d4ed8;color:#fff}.r{background:#dc2626;color:#fff}.grey{background:#e2e8f0;color:#334155}.gold{background:#c9a84c;color:#14224f}.green{background:#16a34a;color:#fff}
.item{border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:14px;background:#f8fafc}
.bengrid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
@media(max-width:620px){.bengrid{grid-template-columns:1fr}.login-feats{grid-template-columns:1fr}}
.tgl{display:flex;align-items:center;gap:11px;font-size:15px;font-weight:600;margin:0;padding:7px 6px;cursor:pointer;border-radius:8px}
.tgl:hover{background:#eef2ff}
.tgl input{display:none}
.tsw{position:relative;width:48px;height:28px;background:#cbd5e1;border-radius:999px;flex:none;transition:background .15s}
.tsw::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;background:#fff;border-radius:50%;transition:left .15s;box-shadow:0 1px 3px rgba(0,0,0,.35)}
.tgl input:checked+.tsw{background:#16a34a}
.tgl input:checked+.tsw::after{left:23px}
table{width:100%;border-collapse:collapse;font-size:15px}th,td{text-align:left;padding:9px;border-bottom:1px solid #eef2f7}
th{color:#64748b;font-size:12.5px;text-transform:uppercase}
.av{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#e2e8f0}
.hidden{display:none!important}
.msg{padding:11px 14px;border-radius:8px;font-size:15.5px;font-weight:600;margin:8px 0;display:none}
.savebar{position:sticky;bottom:0;background:#fff;border-top:1px solid #e2e8f0;padding:14px;text-align:center;box-shadow:0 -2px 8px rgba(0,0,0,.06);display:flex;gap:10px;justify-content:center;flex-wrap:wrap;align-items:center}
</style></head>
<body class="login-mode">

<div id="loginShell" class="login-shell">
  <div class="login-wrap">
    <div class="login-brand">
      <img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile Security Force">
      <h1>SecurityJob Admin</h1>
      <div class="tag">Recruitment Management</div>
      <p class="hint">Sign in with your official <b>@agilegroup.co.in</b> email. A 6-digit PIN is sent to your inbox — Director receives a copy.</p>
    </div>
    ${otpLoginHtml('Sign In', 'Management access — job postings &amp; applicant registrations')}
    <div class="login-feats">
      <div class="login-feat"><b>Job Postings</b>Edit openings, wages &amp; benefits</div>
      <div class="login-feat"><b>Applicants</b>View registrations with date &amp; photo</div>
      <div class="login-feat"><b>Site Stats</b>Update guards placed &amp; locations</div>
      <div class="login-feat"><b>Export</b>Download applicant list as CSV</div>
    </div>
    <div class="login-site"><a href="https://www.securityjob.co.in" target="_blank">← Back to public site (securityjob.co.in)</a></div>
  </div>
</div>

<div id="app" class="hidden">
<div class="top"><h1>SecurityJob — Admin Dashboard</h1><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn grey" href="/mis-admin">🗄 Master Directory</a><a class="btn gold" href="https://www.securityjob.co.in" target="_blank">🌐 View Site</a><button class="btn grey" type="button" onclick="otpLogout()">⎋ Logout</button></div></div>
  <div class="wrap">
    <div id="banner" class="msg"></div>
    <div class="card"><div class="sec">Site Statistics</div>
      <div class="row2"><div><label>Guards Placed</label><input type="text" id="s_guards"></div><div><label>Posting Locations</label><input type="text" id="s_loc"></div></div>
      <label>States Covered</label><input type="text" id="s_states">
    </div>
    <div class="card"><div class="sec">Contact Information</div>
      <label>WhatsApp Number</label><input type="text" id="s_wa">
      <div class="row2"><div><label>Recruitment Email 1</label><input type="text" id="s_e1"></div><div><label>Recruitment Email 2</label><input type="text" id="s_e2"></div></div>
    </div>
    <div class="card"><div class="sec">Security Job Postings</div>
      <div id="jobs"></div>
      <button class="btn grey" onclick="addJob()">+ Add Job</button>
    </div>
    <div class="card"><div class="sec">Applicant Registrations (<span id="appCount">0</span>)</div>
      <div class="row2"><div><label>Filter by Location</label><input type="text" id="filterLoc" oninput="renderApplicants()" placeholder="Type a city/state"></div><div><label>Filter by Role</label><input type="text" id="filterRole" oninput="renderApplicants()" placeholder="Type a role"></div></div>
      <div style="margin:10px 0"><button class="btn b" onclick="downloadCSV()">Download CSV</button> <button class="btn grey" onclick="loadData()">Refresh</button></div>
      <div style="overflow-x:auto"><table><thead><tr><th>Photo</th><th>Reg. Code</th><th>Name</th><th>Phone</th><th>Location</th><th>Role</th><th>Registered</th><th></th></tr></thead><tbody id="applicants"></tbody></table></div>
    </div>
  </div>
  <div class="savebar"><div id="saveMsg" class="msg" style="flex-basis:100%"></div><button class="btn green" style="min-width:220px" onclick="saveAll()">✅ Save &amp; Publish Changes</button><a class="btn b" href="https://www.securityjob.co.in" target="_blank">🌐 View Site</a></div>
</div>

<script>
if(new URLSearchParams(location.search).get('fresh')==='1'){
  sessionStorage.removeItem('otp_securityjob');
  sessionStorage.removeItem('otp_email_securityjob');
}
${otpLoginScript('securityjob', 'SecurityJob Admin', 'management')}
var settings={},jobs=[],applicants=[];
var BEN=${JSON.stringify(BENEFIT_OPTIONS)};
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function el(id){return document.getElementById(id);}
function nid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function api(action,extra){return fetch('/api/securityjob/admin-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}

function showDashboard(){
  el('loginShell').classList.add('hidden');
  el('app').classList.remove('hidden');
  document.body.classList.remove('login-mode');
}
function onOtpLogin(j){
  api('load').then(function(res){
    if(res.status!==200){otpMsg(res.body.error||'Could not sign in.',false);return;}
    settings=res.body.settings||{};jobs=res.body.jobs||[];applicants=res.body.applicants||[];
    showDashboard();
    fillSettings();renderJobs();renderApplicants();
  }).catch(function(){otpMsg('Network error. Please try again.',false);});
}

function fillSettings(){el('s_guards').value=settings.guardsPlaced||'';el('s_loc').value=settings.locations||'';el('s_states').value=settings.states||'';el('s_wa').value=settings.whatsapp||'';el('s_e1').value=settings.email1||'';el('s_e2').value=settings.email2||'';}
function readSettings(){return{guardsPlaced:el('s_guards').value,locations:el('s_loc').value,states:el('s_states').value,whatsapp:el('s_wa').value,email1:el('s_e1').value,email2:el('s_e2').value};}

function addJob(){jobs.push({id:nid(),title:'Security Guard',status:'Active',locations:'',eligibility:'',wages:'',closingDate:'',benefits:[]});renderJobs();}
function delJob(i){if(confirm('Delete this job posting?')){jobs.splice(i,1);renderJobs();}}
function upJob(i,f,v){jobs[i][f]=v;}
function toggleBen(i,ben,on){var arr=jobs[i].benefits||[];if(on){if(arr.indexOf(ben)<0)arr.push(ben);}else{arr=arr.filter(function(x){return x!==ben;});}jobs[i].benefits=arr;}
function renderJobs(){var c=el('jobs');c.innerHTML='';jobs.forEach(function(j,i){var opts=['Active','Upcoming','Closed'].map(function(s){return '<option'+(j.status===s?' selected':'')+'>'+s+'</option>';}).join('');var bens=BEN.map(function(b){var on=(j.benefits||[]).indexOf(b)>=0;return '<label class="tgl"><input type="checkbox" '+(on?'checked':'')+' onchange="toggleBen('+i+',\\''+b.replace(/'/g,"\\\\'")+'\\',this.checked)"><span class="tsw"></span> '+h(b)+'</label>';}).join('');c.innerHTML+='<div class="item"><div class="row2"><div><label>Job Title</label><input type="text" value="'+a(j.title)+'" oninput="upJob('+i+',\\'title\\',this.value)"></div><div><label>Hiring Status</label><select onchange="upJob('+i+',\\'status\\',this.value)">'+opts+'</select></div></div><label>Posting Locations</label><input type="text" value="'+a(j.locations)+'" oninput="upJob('+i+',\\'locations\\',this.value)"><div class="row2"><div><label>Eligibility</label><input type="text" value="'+a(j.eligibility)+'" oninput="upJob('+i+',\\'eligibility\\',this.value)"></div><div><label>Take-home Wages</label><input type="text" value="'+a(j.wages)+'" oninput="upJob('+i+',\\'wages\\',this.value)"></div></div><label>Closing Date</label><input type="text" value="'+a(j.closingDate)+'" oninput="upJob('+i+',\\'closingDate\\',this.value)" placeholder="e.g. 31/07/2026"><label>Benefits &amp; Perks</label><div class="bengrid">'+bens+'</div><div style="margin-top:8px"><button class="btn r" onclick="delJob('+i+')">Delete this job</button></div></div>';});}

function uniqueApplicants(){return applicants;}
function renderApplicants(){var loc=(el('filterLoc').value||'').toLowerCase();var role=(el('filterRole').value||'').toLowerCase();var list=applicants.filter(function(x){return(!loc||(x.location||'').toLowerCase().indexOf(loc)>=0)&&(!role||(x.role||'').toLowerCase().indexOf(role)>=0);});el('appCount').textContent=applicants.length;var t=el('applicants');t.innerHTML='';list.forEach(function(x){var img=x.photoId?'<img class="av" src="/api/securityjob/image?id='+a(x.photoId)+'">':'<div class="av"></div>';t.innerHTML+='<tr><td>'+img+'</td><td>'+h(x.regCode)+'</td><td>'+h(x.name)+'</td><td>'+h(x.phone)+'</td><td>'+h(x.location)+'</td><td>'+h(x.role)+'</td><td style="white-space:nowrap;font-size:12px">'+h(x.createdAt||'—')+'</td><td><button class="btn r" style="padding:5px 9px" onclick="delApp(\\''+x.id+'\\')">✕</button></td></tr>';});}
function delApp(id){if(!confirm('Delete this applicant?'))return;api('deleteApplicant',{id:id}).then(function(res){if(res.status===200){applicants=res.body.applicants||[];renderApplicants();}});}

function downloadCSV(){var rows=[['Reg Code','Name','Phone','Location','Role','Experience','Education','Language','Registered']];applicants.forEach(function(x){rows.push([x.regCode,x.name,x.phone,x.location,x.role,x.experience,x.education,x.language,x.createdAt]);});var csv=rows.map(function(r){return r.map(function(c){return '"'+String(c==null?'':c).replace(/"/g,'""')+'"';}).join(',');}).join('\\n');var blob=new Blob([csv],{type:'text/csv'});var url=URL.createObjectURL(blob);var link=document.createElement('a');link.href=url;link.download='securityjob-applicants.csv';link.click();}

function saveAll(){var m=el('saveMsg');m.style.display='block';m.style.background='#dcfce7';m.style.color='#166534';m.textContent='Saving...';api('saveSettings',{settings:readSettings()}).then(function(){return api('saveJobs',{jobs:jobs});}).then(function(res){if(res.status===200){if(res.body.jobs)jobs=res.body.jobs;m.style.background='#dcfce7';m.style.color='#166534';m.textContent='Saved &amp; published!';renderJobs();}else{m.style.background='#fef2f2';m.style.color='#991b1b';m.textContent=(res.body.error||'Could not save.');}}).catch(function(){m.style.background='#fef2f2';m.style.color='#991b1b';m.textContent='Network error.';});}

function loadData(){api('load').then(function(res){if(res.status===200){settings=res.body.settings||{};jobs=res.body.jobs||[];applicants=res.body.applicants||[];fillSettings();renderJobs();renderApplicants();}});}
if(otpRestoreSession())onOtpLogin({});
</script>
</body></html>`

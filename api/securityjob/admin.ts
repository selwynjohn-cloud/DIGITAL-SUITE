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
.bengroup{margin-top:12px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc}
.bengroup h4{margin:0 0 8px;font-size:13px;font-weight:800;color:#14224f;letter-spacing:.2px}
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
      <label>Help Line</label><input type="text" id="s_helpline" placeholder="+91 8500915599">
      <label>WhatsApp Number</label><input type="text" id="s_wa">
      <div class="row2"><div><label>Recruitment Email 1</label><input type="text" id="s_e1"></div><div><label>Recruitment Email 2</label><input type="text" id="s_e2"></div></div>
    </div>
    <div class="card"><div class="sec">Administrative &amp; Operations Banner</div>
      <label>Show banner on website</label>
      <select id="s_ops_show"><option value="Yes">Yes — show banner</option><option value="No">No — hide banner</option></select>
      <label>Small top line</label><input type="text" id="s_ops_eyebrow" placeholder="Office &amp; Operations — Pan India">
      <label>Main heading</label><input type="text" id="s_ops_title" placeholder="We Are Hiring: Operations &amp; Administrative Staff">
      <label>Short message</label><input type="text" id="s_ops_text" placeholder="Hiring for HR, Admin, Accounts…">
      <label>Button text</label><input type="text" id="s_ops_btn" placeholder="Register Now — It's Free">
    </div>
    <div class="card"><div class="sec">Agile Recruitment Anthem (MP3 — multi language)</div>
      <p style="font-size:13px;color:#64748b;margin:0 0 10px;line-height:1.45">Add songs by language. Paste an MP3 link, or upload an MP3 file. Tap Save &amp; Publish when finished.</p>
      <div id="anthemList"></div>
      <button class="btn grey" type="button" onclick="addAnthem()">+ Add language / song</button>
    </div>
    <div class="card"><div class="sec">Our Academy Videos (MP4)</div>
      <p style="font-size:13px;color:#64748b;margin:0 0 10px;line-height:1.45">Easiest: paste a <b>YouTube</b> link. Or upload an MP4 (up to about 100 MB). After upload, tap <b>Save &amp; Publish</b>.</p>
      <div id="videoList"></div>
      <button class="btn grey" type="button" onclick="addVideo()">+ Add academy video</button>
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
window.sjBlobUpload = function(file, kind, onProgress){
  syncOtpWindow();
  var safe = String(file.name || (kind === 'academy' ? 'video.mp4' : 'song.mp3')).replace(/[^\\w.\\-]+/g, '_').slice(0, 80);
  return fetch('/api/securityjob/media-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionToken: window.OTP_SESSION || (typeof OTP_SESSION !== 'undefined' ? OTP_SESSION : ''),
      kind: kind,
      filename: safe
    })
  }).then(function(r){
    return r.json().then(function(j){ return { ok: r.ok, status: r.status, body: j }; });
  }).then(function(res){
    if(!res.ok || !res.body.clientToken || !res.body.pathname){
      throw new Error((res.body && res.body.error) || 'Could not start upload. Please sign in again.');
    }
    return new Promise(function(resolve, reject){
      var url = 'https://vercel.com/api/blob/?pathname=' + encodeURIComponent(res.body.pathname);
      var xhr = new XMLHttpRequest();
      xhr.open('PUT', url);
      xhr.setRequestHeader('authorization', 'Bearer ' + res.body.clientToken);
      xhr.setRequestHeader('x-api-version', '12');
      xhr.setRequestHeader('x-vercel-blob-access', 'public');
      if(res.body.storeId) xhr.setRequestHeader('x-vercel-blob-store-id', res.body.storeId);
      xhr.setRequestHeader('x-content-type', res.body.contentType || (kind === 'academy' ? 'video/mp4' : 'audio/mpeg'));
      xhr.upload.onprogress = function(ev){
        if(!onProgress || !ev.lengthComputable) return;
        onProgress(Math.max(1, Math.min(99, Math.round(ev.loaded / ev.total * 100))));
      };
      xhr.onload = function(){
        if(xhr.status < 200 || xhr.status >= 300){
          var errMsg = 'Upload failed (' + xhr.status + ').';
          try {
            var j = JSON.parse(xhr.responseText || '{}');
            if(j.error && j.error.message) errMsg = j.error.message;
            else if(j.message) errMsg = j.message;
          } catch(e) {}
          reject(new Error(errMsg + ' You can paste a YouTube / MP4 link instead.'));
          return;
        }
        try {
          var out = JSON.parse(xhr.responseText || '{}');
          if(!out.url) throw new Error('missing url');
          resolve(out.url);
        } catch(e) {
          reject(new Error('Upload finished but no video link came back. Please try again.'));
        }
      };
      xhr.onerror = function(){
        reject(new Error('Network problem while sending the file. Check internet, or paste a YouTube / MP4 link.'));
      };
      var ctype = res.body.contentType || (kind === 'academy' ? 'video/mp4' : 'audio/mpeg');
      xhr.send(file.type === ctype ? file : new Blob([file], { type: ctype }));
    });
  });
};
</script>
<script>
if(new URLSearchParams(location.search).get('fresh')==='1'){
  sessionStorage.removeItem('otp_securityjob');
  sessionStorage.removeItem('otp_email_securityjob');
}
${otpLoginScript('securityjob', 'SecurityJob Admin', 'management')}
var settings={},jobs=[],applicants=[],anthems=[],academyVideos=[];
var BEN=${JSON.stringify(BENEFIT_OPTIONS)};
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function el(id){return document.getElementById(id);}
function nid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function syncOtpWindow(){try{window.OTP_SESSION=typeof OTP_SESSION!=='undefined'?OTP_SESSION:(sessionStorage.getItem('otp_securityjob')||'');}catch(e){}}
function api(action,extra){syncOtpWindow();return fetch('/api/securityjob/admin-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}

function showDashboard(){
  el('loginShell').classList.add('hidden');
  el('app').classList.remove('hidden');
  document.body.classList.remove('login-mode');
}
function onOtpLogin(j){
  syncOtpWindow();
  api('load').then(function(res){
    if(res.status!==200){otpMsg(res.body.error||'Could not sign in.',false);return;}
    settings=res.body.settings||{};jobs=res.body.jobs||[];applicants=res.body.applicants||[];
    anthems=res.body.anthems||[];academyVideos=res.body.academyVideos||[];
    showDashboard();
    fillSettings();renderJobs();renderApplicants();renderAnthems();renderVideos();
  }).catch(function(){otpMsg('Network error. Please try again.',false);});
}

function fillSettings(){
  el('s_guards').value=settings.guardsPlaced||'';
  el('s_loc').value=settings.locations||'';
  el('s_states').value=settings.states||'';
  el('s_helpline').value=settings.helpline||'+91 8500915599';
  el('s_wa').value=settings.whatsapp||'';
  el('s_e1').value=settings.email1||'';
  el('s_e2').value=settings.email2||'';
  el('s_ops_show').value=settings.adminOpsShow==='No'?'No':'Yes';
  el('s_ops_eyebrow').value=settings.adminOpsEyebrow||'';
  el('s_ops_title').value=settings.adminOpsTitle||'';
  el('s_ops_text').value=settings.adminOpsText||'';
  el('s_ops_btn').value=settings.adminOpsButton||'';
}
function readSettings(){
  return{
    guardsPlaced:el('s_guards').value,
    locations:el('s_loc').value,
    states:el('s_states').value,
    helpline:el('s_helpline').value,
    whatsapp:el('s_wa').value,
    email1:el('s_e1').value,
    email2:el('s_e2').value,
    adminOpsShow:el('s_ops_show').value,
    adminOpsEyebrow:el('s_ops_eyebrow').value,
    adminOpsTitle:el('s_ops_title').value,
    adminOpsText:el('s_ops_text').value,
    adminOpsButton:el('s_ops_btn').value
  };
}

function addJob(){jobs.push({id:nid(),title:'Security Guard',status:'Active',locations:'',eligibility:'',wages:'',closingDate:'',benefits:[]});renderJobs();}
function delJob(i){if(confirm('Delete this job posting?')){jobs.splice(i,1);renderJobs();}}
function upJob(i,f,v){jobs[i][f]=v;}
function toggleBen(i,ben,on){var arr=jobs[i].benefits||[];if(on){if(arr.indexOf(ben)<0)arr.push(ben);}else{arr=arr.filter(function(x){return x!==ben;});}jobs[i].benefits=arr;}
function renderJobs(){var c=el('jobs');c.innerHTML='';jobs.forEach(function(j,i){var opts=['Active','Upcoming','Closed'].map(function(s){return '<option'+(j.status===s?' selected':'')+'>'+s+'</option>';}).join('');var bens=BEN.map(function(b){var on=(j.benefits||[]).indexOf(b)>=0;return '<label class="tgl"><input type="checkbox" '+(on?'checked':'')+' onchange="toggleBen('+i+',\\''+b.replace(/'/g,"\\\\'")+'\\',this.checked)"><span class="tsw"></span> '+h(b)+'</label>';}).join('');c.innerHTML+='<div class="item"><div class="row2"><div><label>Job Title</label><input type="text" value="'+a(j.title)+'" oninput="upJob('+i+',\\'title\\',this.value)"></div><div><label>Hiring Status</label><select onchange="upJob('+i+',\\'status\\',this.value)">'+opts+'</select></div></div><label>Posting Locations</label><input type="text" value="'+a(j.locations)+'" oninput="upJob('+i+',\\'locations\\',this.value)"><div class="row2"><div><label>Eligibility</label><input type="text" value="'+a(j.eligibility)+'" oninput="upJob('+i+',\\'eligibility\\',this.value)"></div><div><label>Gross Wages</label><input type="text" value="'+a(j.wages)+'" oninput="upJob('+i+',\\'wages\\',this.value)"></div></div><label>Closing Date</label><input type="text" value="'+a(j.closingDate)+'" oninput="upJob('+i+',\\'closingDate\\',this.value)" placeholder="e.g. 31/07/2026"><label>Benefits &amp; Perks</label><div class="bengrid">'+bens+'</div><div style="margin-top:8px"><button class="btn r" onclick="delJob('+i+')">Delete this job</button></div></div>';});}

function addAnthem(){anthems.push({id:nid(),language:'',title:'',url:'',active:true});renderAnthems();}
function delAnthem(i){if(confirm('Remove this song?')){anthems.splice(i,1);renderAnthems();}}
function upAnthem(i,f,v){anthems[i][f]=v;}
function toggleAnthem(i,on){anthems[i].active=!!on;}
function renderAnthems(){
  var c=el('anthemList');if(!c)return;c.innerHTML='';
  anthems.forEach(function(x,i){
    c.innerHTML+='<div class="item"><div class="row2"><div><label>Language</label><input type="text" value="'+a(x.language)+'" oninput="upAnthem('+i+',\\'language\\',this.value)" placeholder="English / Tamil / Hindi…"></div><div><label>Song title</label><input type="text" value="'+a(x.title)+'" oninput="upAnthem('+i+',\\'title\\',this.value)" placeholder="Song name"></div></div><label>MP3 link / path</label><input type="text" value="'+a(x.url)+'" oninput="upAnthem('+i+',\\'url\\',this.value)" placeholder="/securityjob/song-english.mp3 or https://…"><div class="row2" style="margin-top:8px;align-items:center"><div><label class="tgl"><input type="checkbox" '+(x.active!==false?'checked':'')+' onchange="toggleAnthem('+i+',this.checked)"><span class="tsw"></span> Show on website</label></div><div><button class="btn grey" type="button" onclick="uploadMedia(\\''+i+'\\',\\'anthem\\')">⬆ Upload MP3</button> <button class="btn r" type="button" onclick="delAnthem('+i+')">Delete</button></div></div></div>';
  });
}

function addVideo(){academyVideos.push({id:nid(),title:'',url:'',active:true});renderVideos();}
function delVideo(i){if(confirm('Remove this video?')){academyVideos.splice(i,1);renderVideos();}}
function upVideo(i,f,v){academyVideos[i][f]=v;}
function toggleVideo(i,on){academyVideos[i].active=!!on;}
function renderVideos(){
  var c=el('videoList');if(!c)return;c.innerHTML='';
  academyVideos.forEach(function(x,i){
    c.innerHTML+='<div class="item"><label>Video title</label><input type="text" value="'+a(x.title)+'" oninput="upVideo('+i+',\\'title\\',this.value)" placeholder="Academy video title"><label>MP4 / YouTube link</label><input type="text" value="'+a(x.url)+'" oninput="upVideo('+i+',\\'url\\',this.value)" placeholder="https://…mp4 or YouTube link"><div class="row2" style="margin-top:8px;align-items:center"><div><label class="tgl"><input type="checkbox" '+(x.active!==false?'checked':'')+' onchange="toggleVideo('+i+',this.checked)"><span class="tsw"></span> Show on website</label></div><div><button class="btn grey" type="button" onclick="uploadMedia(\\''+i+'\\',\\'academy\\')">⬆ Upload MP4</button> <button class="btn r" type="button" onclick="delVideo('+i+')">Delete</button></div></div></div>';
  });
}

function uploadMedia(index,kind){
  var inp=document.createElement('input');inp.type='file';inp.accept=kind==='anthem'?'audio/mpeg,.mp3':'video/mp4,.mp4';
  inp.onchange=async function(){
    var f=inp.files&&inp.files[0];if(!f)return;
    var maxMb=kind==='academy'?100:15;
    if(f.size>maxMb*1024*1024){
      var m0=el('saveMsg');m0.style.display='block';m0.style.background='#fef2f2';m0.style.color='#991b1b';
      m0.textContent='This file is too large (max '+maxMb+' MB). Use a smaller file, or paste a YouTube / MP4 link.';
      return;
    }
    var m=el('saveMsg');m.style.display='block';m.style.background='#dcfce7';m.style.color='#166534';
    m.textContent='Uploading '+f.name+'… 0%';
    syncOtpWindow();
    try{
      if(typeof window.sjBlobUpload!=='function'){
        throw new Error('Upload tool not ready. Refresh the page and try again, or paste a YouTube / MP4 link.');
      }
      var url=await window.sjBlobUpload(f, kind, function(pct){ m.textContent='Uploading '+f.name+'… '+pct+'%'; });
      var i=Number(index);
      if(kind==='anthem'){anthems[i].url=url;if(!anthems[i].title)anthems[i].title=f.name.replace(/\\.mp3$/i,'');renderAnthems();}
      else{academyVideos[i].url=url;if(!academyVideos[i].title)academyVideos[i].title=f.name.replace(/\\.mp4$/i,'');renderVideos();}
      m.style.background='#dcfce7';m.style.color='#166534';
      m.textContent='Uploaded. Tap Save & Publish to keep it.';
    }catch(err){
      m.style.background='#fef2f2';m.style.color='#991b1b';
      m.textContent=(err&&err.message)||'Upload failed. Paste a YouTube or MP4 link instead, then Save.';
    }
  };
  inp.click();
}

function uniqueApplicants(){return applicants;}
function renderApplicants(){var loc=(el('filterLoc').value||'').toLowerCase();var role=(el('filterRole').value||'').toLowerCase();var list=applicants.filter(function(x){return(!loc||(x.location||'').toLowerCase().indexOf(loc)>=0)&&(!role||(x.role||'').toLowerCase().indexOf(role)>=0);});el('appCount').textContent=applicants.length;var t=el('applicants');t.innerHTML='';list.forEach(function(x){var img=x.photoId?'<img class="av" src="/api/securityjob/image?id='+a(x.photoId)+'">':'<div class="av"></div>';t.innerHTML+='<tr><td>'+img+'</td><td>'+h(x.regCode)+'</td><td>'+h(x.name)+'</td><td>'+h(x.phone)+'</td><td>'+h(x.location)+'</td><td>'+h(x.role)+'</td><td style="white-space:nowrap;font-size:12px">'+h(x.createdAt||'—')+'</td><td><button class="btn r" style="padding:5px 9px" onclick="delApp(\\''+x.id+'\\')">✕</button></td></tr>';});}
function delApp(id){if(!confirm('Delete this applicant?'))return;api('deleteApplicant',{id:id}).then(function(res){if(res.status===200){applicants=res.body.applicants||[];renderApplicants();}});}

function downloadCSV(){var rows=[['Reg Code','Name','Phone','Email','Date of Birth','Location','Role','Experience','Education','Language','Registered']];applicants.forEach(function(x){rows.push([x.regCode,x.name,x.phone,x.email||'',x.dob||'',x.location,x.role,x.experience,x.education,x.language,x.createdAt]);});var csv=rows.map(function(r){return r.map(function(c){return '"'+String(c==null?'':c).replace(/"/g,'""')+'"';}).join(',');}).join('\\n');var blob=new Blob([csv],{type:'text/csv'});var url=URL.createObjectURL(blob);var link=document.createElement('a');link.href=url;link.download='securityjob-applicants.csv';link.click();}

function saveAll(){
  var m=el('saveMsg');m.style.display='block';m.style.background='#dcfce7';m.style.color='#166534';m.textContent='Saving...';
  api('saveSettings',{settings:readSettings()})
    .then(function(){return api('saveJobs',{jobs:jobs});})
    .then(function(res){if(res.status===200&&res.body.jobs)jobs=res.body.jobs;return api('saveAnthems',{anthems:anthems});})
    .then(function(res){if(res.status===200&&res.body.anthems)anthems=res.body.anthems;return api('saveAcademyVideos',{academyVideos:academyVideos});})
    .then(function(res){
      if(res.status===200){
        if(res.body.academyVideos)academyVideos=res.body.academyVideos;
        m.style.background='#dcfce7';m.style.color='#166534';m.textContent='Saved &amp; published!';
        renderJobs();renderAnthems();renderVideos();
      }else{
        m.style.background='#fef2f2';m.style.color='#991b1b';m.textContent=(res.body.error||'Could not save.');
      }
    }).catch(function(){m.style.background='#fef2f2';m.style.color='#991b1b';m.textContent='Network error.';});
}

function loadData(){api('load').then(function(res){if(res.status===200){settings=res.body.settings||{};jobs=res.body.jobs||[];applicants=res.body.applicants||[];anthems=res.body.anthems||[];academyVideos=res.body.academyVideos||[];fillSettings();renderJobs();renderApplicants();renderAnthems();renderVideos();}});}
if(otpRestoreSession())onOtpLogin({});
</script>
</body></html>`

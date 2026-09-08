import type { VercelRequest, VercelResponse } from '@vercel/node'
import { otpLoginHtml, otpLoginScript } from '../_lib/embedded-otp.js'
import { GUARD_CSV_TEMPLATE } from '../_lib/ops-mobile/store.js'
import { SUITE_PAGE_CHROME_CSS, suitePageHeadHtml, suitePageTitleInitScript } from '../_lib/suite-page-chrome.js'

/** GET /ops-mobile/admin — import Hyderabad guard master + see who is on duty. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const TEMPLATE_JS = JSON.stringify(GUARD_CSV_TEMPLATE)

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Ops Mobile — Admin</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#0b1220;color:#e2e8f0}
.top{background:linear-gradient(135deg,#14224f,#1e3a8a);color:#fff;padding:14px 16px;border-bottom:3px solid #c9a84c}
.wrap{max-width:720px;margin:0 auto;padding:16px 16px 40px}
.card{background:linear-gradient(180deg,#111a30,#0e1730);border:1px solid #334155;border-radius:14px;padding:16px;margin-bottom:14px}
h2{margin:0 0 8px;font-size:18px;color:#fde68a}
.sub{color:#94a3b8;font-size:13px;line-height:1.5;margin:0 0 12px}
label{display:block;font-size:12px;color:#94a3b8;margin:8px 0 4px;font-weight:700}
textarea,input,select{width:100%;padding:12px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:15px;font-family:inherit}
textarea{min-height:160px;resize:vertical}
.btn{display:inline-block;padding:12px 16px;border:none;border-radius:10px;font-size:15px;font-weight:800;cursor:pointer;margin:4px 4px 4px 0;min-height:48px}
.btn.gold{background:#c9a84c;color:#14224f}
.btn.blue{background:#1d4ed8;color:#fff}
.btn.grey{background:#334155;color:#e2e8f0}
.btn.green{background:#059669;color:#fff}
.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.msg{padding:10px 12px;border-radius:8px;margin:10px 0;font-size:14px;font-weight:600;display:none}
.msg.ok{background:#0a2e1a;color:#4ade80;display:block}
.msg.err{background:#3a0a0a;color:#fca5a5;display:block}
.hidden{display:none!important}
#login{max-width:420px;margin:40px auto;padding:0 16px}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{padding:8px 6px;border-bottom:1px solid #334155;text-align:left;vertical-align:top}
th{color:#c9a84c;font-size:11px;text-transform:uppercase}
.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:800;background:#1e3a8a;color:#bfdbfe}
.pill.on{background:#065f46;color:#a7f3d0}
.pill.mild{background:#422006;color:#fde68a}
.pill.med{background:#7c2d12;color:#fdba74}
.pill.sev{background:#7f1d1d;color:#fecaca}
.kpis{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
.kpi{background:#0b1220;border:1px solid #334155;border-radius:10px;padding:12px;text-align:center}
.kpi b{display:block;font-size:22px;color:#fde68a}
.kpi span{font-size:12px;color:#94a3b8}
a{color:#93c5fd}
${SUITE_PAGE_CHROME_CSS}
</style></head>
<body>
<div class="top suite-sticky-top">${suitePageHeadHtml('Agile Ops Mobile', 'Admin — Guard master & duty', { subId: 'opsSub', subText: 'Hyderabad Phase A/B first' })}</div>

${otpLoginHtml('Agile Ops Mobile', 'Sign in with your @agilegroup.co.in email')}

<div id="app" class="hidden">
  <div class="wrap">
    <div id="banner" class="msg"></div>

    <div class="card">
      <h2>Quick links</h2>
      <p class="sub">Guards use the duty page on their phone (no email login).</p>
      <div class="row">
        <a class="btn gold" href="/ops-mobile/duty" target="_blank" rel="noopener">Open Duty page</a>
        <button type="button" class="btn grey" onclick="copyDutyLink()">Copy duty link</button>
      </div>
    </div>

    <div class="card">
      <h2>1. Sync from Master Directory (recommended)</h2>
      <p class="sub">Uses the guard sheet already in MIS (Hyderabad-A, Hyderabad-B, Hi-Tech). Same list as Master Directory.</p>
      <div class="row">
        <button type="button" class="btn gold" onclick="syncMaster()">Sync Hyderabad from Master Directory</button>
        <button type="button" class="btn grey" onclick="syncMaster('*')">Sync ALL branches</button>
      </div>
    </div>

    <div class="card">
      <h2>2. Import guard list (Excel / CSV) — optional</h2>
      <p class="sub">Only if you need to add rows not yet in Master Directory. Columns: Branch, Client/Site, Guard ID No., Name, Mobile, Aadhaar, DOJ, ID Card Renewal, Designation, Shift.</p>
      <div class="row">
        <button type="button" class="btn grey" onclick="downloadTemplate()">Download template CSV</button>
        <label class="btn blue" style="margin:4px 0;display:inline-flex;align-items:center">Upload CSV file
          <input type="file" id="csvFile" accept=".csv,text/csv,text/plain" style="display:none" onchange="onFile(event)">
        </label>
      </div>
      <label>Paste rows here</label>
      <textarea id="csvText" placeholder="Branch,Client / Site,Guard ID No.,..."></textarea>
      <label>Import mode</label>
      <select id="importMode">
        <option value="merge">Merge (update matching ID+Mobile, keep others)</option>
        <option value="replace">Replace all (wipe previous list)</option>
      </select>
      <div class="row" style="margin-top:10px">
        <button type="button" class="btn gold" onclick="importGuards()">Import guards</button>
        <button type="button" class="btn green" onclick="loadGuards()">Refresh list</button>
      </div>
    </div>

    <div class="card">
      <h2>3. Guard master</h2>
      <div class="kpis">
        <div class="kpi"><b id="kpiGuards">0</b><span>Guards loaded</span></div>
        <div class="kpi"><b id="kpiOnDuty">0</b><span>On duty now</span></div>
      </div>
      <label>Filter by branch (optional)</label>
      <input id="branchFilter" type="text" placeholder="e.g. Hyderabad" value="Hyderabad">
      <div class="row" style="margin-top:8px">
        <button type="button" class="btn blue" onclick="loadGuards()">Show guards</button>
        <button type="button" class="btn grey" onclick="loadOnDuty()">Who is on duty</button>
      </div>
      <div id="listWrap" style="margin-top:12px;overflow:auto"></div>
    </div>

    <div class="card">
      <h2>4. Duty alerts (late start · out of post · voice check)</h2>
      <p class="sub">Mild = watch · Medium = follow up · Severe = urgent. Random phone calls ask: press 1 on duty, 2 off duty.</p>
      <div class="kpis">
        <div class="kpi"><b id="kpiAlertMild">0</b><span>Mild today</span></div>
        <div class="kpi"><b id="kpiAlertMed">0</b><span>Medium today</span></div>
        <div class="kpi"><b id="kpiAlertSev">0</b><span>Severe today</span></div>
      </div>
      <div class="row">
        <button type="button" class="btn blue" onclick="loadAlerts()">Refresh alerts</button>
        <button type="button" class="btn grey" onclick="runVoiceTest()">Test voice check (1 call)</button>
      </div>
      <div id="alertWrap" style="margin-top:12px;overflow:auto"></div>
    </div>
  </div>
</div>

<script>
${otpLoginScript('ops-mobile', 'Agile Ops Mobile', 'management')}
${suitePageTitleInitScript('Agile Ops Mobile')}
var TEMPLATE=${TEMPLATE_JS};

function showBanner(t,ok){
  var m=document.getElementById('banner');
  m.className='msg '+(ok?'ok':'err');
  m.textContent=t;
  m.style.display='block';
}
function api(action,extra){
  return fetch('/api/ops-mobile/data',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,_t:Date.now()},extra||{}))})
    .then(function(r){return r.json().then(function(j){return {status:r.status,body:j};});});
}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function copyDutyLink(){
  var u=location.origin+'/ops-mobile/duty';
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(u).then(function(){showBanner('Duty link copied',true);});
  }else{prompt('Copy this link:',u);}
}
function downloadTemplate(){
  var blob=new Blob([TEMPLATE],{type:'text/csv;charset=utf-8'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='agile-ops-mobile-guard-template.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
function onFile(ev){
  var f=ev.target.files&&ev.target.files[0];
  if(!f)return;
  var reader=new FileReader();
  reader.onload=function(){document.getElementById('csvText').value=String(reader.result||''); showBanner('File loaded — tap Import guards',true);};
  reader.readAsText(f);
}
function syncMaster(filter){
  showBanner('Syncing from Master Directory…',true);
  api('syncFromMaster',{branchFilter:filter||''}).then(function(res){
    if(res.status!==200){showBanner(res.body.error||'Sync failed',false);return;}
    var parts=(res.body.fromBranches||[]).map(function(b){return b.name+': '+b.count;}).join(' · ');
    showBanner('Synced. Added '+res.body.added+', updated '+res.body.updated+'. Total '+res.body.total+'. '+(parts||''),true);
    loadGuards();
  }).catch(function(){showBanner('Network error — try again',false);});
}
function importGuards(){
  var csv=document.getElementById('csvText').value;
  var mode=document.getElementById('importMode').value;
  if(!String(csv).trim()){showBanner('Paste or upload the guard list first.',false);return;}
  showBanner('Importing…',true);
  api('importGuards',{csv:csv,mode:mode}).then(function(res){
    if(res.status!==200){showBanner(res.body.error||'Import failed',false);return;}
    showBanner('Imported. Added '+res.body.added+', updated '+res.body.updated+'. Total now '+res.body.total+'.',true);
    loadGuards();
  }).catch(function(){showBanner('Network error — try again',false);});
}
function loadGuards(){
  var branch=document.getElementById('branchFilter').value||'';
  api('listGuards',{branch:branch}).then(function(res){
    if(res.status!==200){showBanner(res.body.error||'Could not load',false);return;}
    document.getElementById('kpiGuards').textContent=String(res.body.count||0);
    var rows=res.body.guards||[];
    if(!rows.length){document.getElementById('listWrap').innerHTML='<p class="sub">No guards yet. Import the Hyderabad sheet.</p>';return;}
    var html='<table><thead><tr><th>Name</th><th>ID</th><th>Mobile</th><th>Branch / Site</th><th>Shift</th></tr></thead><tbody>';
    rows.slice(0,300).forEach(function(g){
      html+='<tr><td><b>'+h(g.name)+'</b><br><span style="color:#94a3b8">'+h(g.designation||'')+'</span></td><td>'+h(g.idNo)+'</td><td>'+h(g.mobile)+'</td><td>'+h(g.branch)+'<br><span style="color:#94a3b8">'+h(g.clientSite||'')+'</span></td><td>'+h(g.shift||'—')+'</td></tr>';
    });
    html+='</tbody></table>';
    if(rows.length>300)html+='<p class="sub">Showing first 300 of '+rows.length+'.</p>';
    document.getElementById('listWrap').innerHTML=html;
  });
  loadOnDuty(true);
}
function loadOnDuty(silent){
  api('listOnDuty').then(function(res){
    if(res.status!==200){if(!silent)showBanner(res.body.error||'Could not load on-duty',false);return;}
    document.getElementById('kpiOnDuty').textContent=String(res.body.count||0);
    if(silent)return;
    var rows=res.body.sessions||[];
    if(!rows.length){document.getElementById('listWrap').innerHTML='<p class="sub">Nobody on duty right now.</p>';return;}
    var html='<table><thead><tr><th>Guard</th><th>Site</th><th>Started</th><th>Shift</th></tr></thead><tbody>';
    rows.forEach(function(s){
      html+='<tr><td><b>'+h(s.name)+'</b><br>'+h(s.idNo)+' · '+h(s.mobile)+'</td><td>'+h(s.clientSite||s.branch)+'</td><td>'+h(String(s.startedAt||'').replace('T',' ').slice(0,16))+'</td><td><span class="pill on">'+h(s.shiftHours)+'h</span></td></tr>';
    });
    html+='</tbody></table>';
    document.getElementById('listWrap').innerHTML=html;
  });
}
function sevPill(s){
  if(s==='severe')return '<span class="pill sev">SEVERE</span>';
  if(s==='medium')return '<span class="pill med">MEDIUM</span>';
  return '<span class="pill mild">MILD</span>';
}
function loadAlerts(){
  api('listAlerts',{}).then(function(res){
    if(res.status!==200){showBanner(res.body.error||'Could not load alerts',false);return;}
    var rows=res.body.alerts||[];
    var mild=0,med=0,sev=0;
    rows.forEach(function(a){
      if(a.severity==='severe')sev++;
      else if(a.severity==='medium')med++;
      else mild++;
    });
    document.getElementById('kpiAlertMild').textContent=String(mild);
    document.getElementById('kpiAlertMed').textContent=String(med);
    document.getElementById('kpiAlertSev').textContent=String(sev);
    if(!rows.length){
      document.getElementById('alertWrap').innerHTML='<p class="sub">No alerts today yet.</p>';
      return;
    }
    var html='<table><thead><tr><th>Time</th><th>Guard</th><th>Alert</th><th>Level</th></tr></thead><tbody>';
    rows.slice(0,100).forEach(function(a){
      html+='<tr><td>'+h(String(a.at||'').replace('T',' ').slice(0,16))+'</td><td><b>'+h(a.name)+'</b><br>'+h(a.clientSite||a.branch)+'</td><td>'+h(a.type.replace(/_/g,' '))+'<br><span style="color:#94a3b8;font-size:12px">'+h(a.detail||'')+'</span></td><td>'+sevPill(a.severity)+'</td></tr>';
    });
    html+='</tbody></table>';
    document.getElementById('alertWrap').innerHTML=html;
  });
}
function runVoiceTest(){
  showBanner('Placing test voice call…',true);
  fetch('/api/ops-mobile/cron?job=voice-check&max=1',{cache:'no-store'}).then(function(r){return r.json();}).then(function(j){
    if(!j.ok){showBanner(j.error||j.reason||'Voice check not configured or no guards on duty',false);return;}
    showBanner('Voice check queued: '+(j.placed||0)+' call(s). Guard hears: press 1 on duty, 2 off duty.',true);
    loadAlerts();
  }).catch(function(){showBanner('Network error',false);});
}
function onOtpLogin(){
  document.getElementById('login').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  loadGuards();
  loadAlerts();
}
if(typeof otpRestoreSession==='function'&&otpRestoreSession())onOtpLogin();
</script>
</body></html>`

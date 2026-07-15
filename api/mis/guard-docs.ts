import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hodLoginHtml, otpLoginScript } from '../_lib/embedded-otp.js'
import { MIS_STAFF_CSS } from '../_lib/mis/staff-theme.js'
import { MIS_STAFF_LAYOUT_CSS, misStaffSidebarHtml, MIS_STAFF_SESSION_JS } from '../_lib/mis/staff-layout.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Guard Compliance (Branch)</title>
<style>
${MIS_STAFF_CSS}
${MIS_STAFF_LAYOUT_CSS}
.staff-shell .top{display:none}
.toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:12px 0}
.toolbar input{max-width:360px}
.guard-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-top:12px}
.guard-card{background:linear-gradient(145deg,#0e1730,#16223f);border:1px solid #475569;border-radius:14px;padding:16px;cursor:pointer;transition:box-shadow .15s}
.guard-card:hover{box-shadow:0 8px 24px rgba(59,130,246,.25);border-color:#3b82f6}
.guard-card.off{opacity:.45;border-style:dashed}
.guard-card .name{font-size:20px;font-weight:900;color:#fff;line-height:1.25;margin-bottom:6px}
.guard-card .eid{font-size:17px;font-weight:800;color:#fde68a;letter-spacing:.5px}
.guard-card .meta{font-size:14px;color:#94a3b8;margin-top:8px;line-height:1.5}
.guard-card .tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.tag{padding:4px 10px;border-radius:8px;font-size:12px;font-weight:800}
.tag-ok{background:rgba(34,197,94,.2);color:#4ade80;border:1px solid #22c55e}
.tag-miss{background:rgba(239,68,68,.2);color:#f87171;border:1px solid #ef4444}
.tag-off{background:rgba(100,116,139,.2);color:#94a3b8;border:1px solid #64748b}
.modal .inner{max-width:580px;max-height:92vh;overflow-y:auto}
.modal .row2 input,.modal .row2 select{font-size:16px;padding:11px}
.modal label{font-size:14px}
.date-hint{font-size:11px;color:#64748b;margin-top:2px}
.menu-btns{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}
@media(max-width:520px){.menu-btns{grid-template-columns:1fr}}
.menu-btns .btn{text-align:center;padding:18px;font-size:16px}
</style></head>
<body>
<div class="top"><div style="display:flex;align-items:center;gap:12px"><img src="https://www.agilegroup-digital.co.in/agile-logo.png"><h1>Guard Compliance Register<small>PVC · Medical · Training — Statutory</small></h1></div>
<div id="topNav" style="display:flex;gap:8px;flex-wrap:wrap">
  <button class="btn grey btn-sm hidden" id="btnMenu" onclick="goMainMenu()">← Main Menu</button>
  <a class="btn grey btn-sm" href="/mis-report" style="text-decoration:none">📋 Daily Report</a>
</div></div>

<div id="login">
${hodLoginHtml('Agile MIS', 'Guard Compliance — branch HOD sign in')}
<div id="branchStep" class="card hidden" style="margin-top:12px">
  <div class="hint">You are signed in. Choose your branch and open the guard register.</div>
  <label>Your Branch</label><select id="branch"></select>
  <div class="menu-btns">
    <button class="btn green" onclick="openRegister()">🛡 Open Guard Register</button>
    <a class="btn g" href="/mis-report" style="text-decoration:none;display:flex;align-items:center;justify-content:center">📋 Daily Branch Report</a>
    <a class="btn grey" href="/mis-staff" style="text-decoration:none;display:flex;align-items:center;justify-content:center">📊 Branch Dashboard</a>
  </div>
</div>
</div>

<div id="staffShell" class="staff-shell hidden">
${misStaffSidebarHtml('/mis-guard-docs')}
<div class="staff-main">
<div class="staff-bar noprint"><div style="display:flex;align-items:center;gap:12px"><button type="button" class="staff-burger" onclick="document.getElementById('staffSide').classList.toggle('open')">☰ Menu</button><div><b>Compliance (PVC/MC)</b><div class="co">Guard mandatory documents — feeds Management Compliance report</div></div></div><span class="staff-branch-tag" id="staffBranchTag">Branch</span></div>
<div class="staff-content">
<div id="app" class="hidden"><div class="wrap">
  <div class="card">
    <b style="color:#fde68a;font-size:18px" id="hdr"></b>
    <div class="hint">Tap any guard card to <b>edit</b>. Names and Employee IDs are shown large for easy reading.</div>
    <div class="toolbar">
      <input id="search" placeholder="Search name, emp ID, unit, mobile…" oninput="render()">
      <label style="display:flex;align-items:center;gap:6px;margin:0;font-size:13px;color:#94a3b8"><input type="checkbox" id="showInactive" onchange="render()"> Show deactivated</label>
      <button class="btn grey btn-sm" onclick="addRow()">+ Add Guard</button>
      <button class="btn green btn-sm" onclick="save()">✅ Save All</button>
      <button class="btn grey btn-sm" onclick="goMainMenu()">← Main Menu</button>
      <span id="countHint" class="hint" style="margin:0"></span>
    </div>
    <div class="guard-grid" id="grid"></div>
    <div id="saveMsg" class="msg"></div>
  </div>
</div></div>
</div></div></div>

<div id="editModal" class="modal hidden" onclick="if(event.target===this)closeEdit()">
  <div class="inner">
    <h3 id="editTitle">Edit Guard</h3>
    <input type="hidden" id="editIdx">
    <label>Guard Name</label><input id="egName" placeholder="Full name">
    <label>Employee ID</label><input id="egEid" placeholder="e.g. AG-12345" style="font-size:18px;font-weight:800;color:#fde68a">
    <div class="row2">
      <div><label>Unit / Site</label><input id="egUnit"></div>
      <div><label>Incharge Name</label><input id="egIncharge"></div>
    </div>
    <div class="row2">
      <div><label>Guard Mobile</label><input id="egMobile" inputmode="tel" placeholder="10-digit mobile"></div>
      <div><label>Incharge Mobile</label><input id="egInchargeMob" inputmode="tel" placeholder="10-digit mobile"></div>
    </div>
    <div class="row2">
      <div><label>Date of Joining</label><input id="egDoj" type="date"><div class="date-hint">Pick date (shown as DD/MM/YYYY)</div></div>
      <div><label>ID Card Validity Date</label><input id="egIdCard" type="date"><div class="date-hint">Pick expiry date</div></div>
    </div>
    <label>Aadhar Number</label><input id="egAadhar" inputmode="numeric" maxlength="12">
    <div class="row2">
      <div><label>PVC Status</label>
        <select id="egPvc" onchange="toggleValidity()">
          <option value="">— select —</option>
          <option value="Valid">Valid</option>
          <option value="Applied">Applied — pending</option>
          <option value="Pending">Pending</option>
          <option value="Expired">Expired</option>
          <option value="Not Applied">Not Applied</option>
          <option value="N/A">N/A</option>
        </select>
      </div>
      <div id="pvcValWrap"><label>PVC Validity Date</label><input id="egPvcVal" type="date"><div class="date-hint">Pick expiry date</div></div>
    </div>
    <div class="row2">
      <div><label>Medical Fitness</label>
        <select id="egMed" onchange="toggleValidity()">
          <option value="">— select —</option>
          <option value="Fit">Fit</option>
          <option value="Unfit">Unfit</option>
          <option value="Pending">Pending</option>
          <option value="Expired">Expired</option>
          <option value="N/A">N/A</option>
        </select>
      </div>
      <div id="medValWrap"><label>Medical Validity Date</label><input id="egMedVal" type="date"><div class="date-hint">Pick expiry date</div></div>
    </div>
    <div class="row2">
      <div><label>Training</label>
        <select id="egTrain">
          <option value="">— select —</option>
          <option value="Certified">Certified</option>
          <option value="Pending">Pending</option>
          <option value="Expired">Expired</option>
          <option value="Not Done">Not Done</option>
          <option value="N/A">N/A</option>
        </select>
      </div>
      <div><label>Remarks</label><input id="egRem" placeholder="Any notes"></div>
    </div>
    <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn green" onclick="applyEdit()">Save This Guard</button>
      <button class="btn grey" onclick="closeEdit()">← Back to List</button>
      <button class="btn amber" id="btnDeactivate" onclick="toggleActive()">Deactivate Guard</button>
    </div>
  </div>
</div>

<script>
${otpLoginScript('mis-report', 'Agile MIS — Guard Compliance', 'staff')}
${MIS_STAFF_SESSION_JS}
var BR='',DOCS=[],BNAME='';
var AUTO_OPEN_REGISTER=false;
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function nid(){return 'gd'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function api(action,extra){return fetch('/api/mis/report-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,branchId:BR},extra||{}))}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});}

function toIsoDate(v){
  if(!v)return '';
  var s=String(v).trim();
  if(/^\\d{4}-\\d{2}-\\d{2}$/.test(s))return s;
  var m=s.match(/^(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{2,4})$/);
  if(m){var d=m[1].padStart(2,'0'),mo=m[2].padStart(2,'0'),y=m[3].length===2?('20'+m[3]):m[3];return y+'-'+mo+'-'+d;}
  return '';
}
function fmtDate(v){
  var iso=toIsoDate(v);if(!iso)return v||'';
  var p=iso.split('-');return p[2]+'/'+p[1]+'/'+p[0].slice(2);
}

function onOtpLogin(j){
  if(typeof branchHideAll==='function') branchHideAll();
  var bid=j.branchId||OTP_BRANCH_ID||'';
  if(bid){OTP_BRANCH_ID=bid;BR=bid;if(el('branch'))el('branch').value=bid;}
  if(j.branchName)OTP_BRANCH_NAME=j.branchName;
  staffPortalEnter('login');
  AUTO_OPEN_REGISTER=true;
  tryOpenRegister();
}

function tryOpenRegister(){
  if(!AUTO_OPEN_REGISTER||!BR||!OTP_SESSION)return;
  AUTO_OPEN_REGISTER=false;
  openRegister();
}

fetch('/api/mis/report-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'branches'})}).then(function(r){return r.json();}).then(function(j){
  el('branch').innerHTML=(j.branches||[]).map(function(b){return '<option value="'+b.id+'">'+h(b.name)+'</option>';}).join('');
  var saved=OTP_BRANCH_ID||sessionStorage.getItem('guard_branch')||sessionStorage.getItem('otp_branch_mis-report');
  if(saved){el('branch').value=saved;BR=saved;}
  tryOpenRegister();
});

(function boot(){
  var fresh=new URLSearchParams(location.search).get('fresh')==='1';
  if(fresh){
    sessionStorage.removeItem('otp_mis-report');
    sessionStorage.removeItem('otp_email_mis-report');
    sessionStorage.removeItem('otp_branch_mis-report');
    sessionStorage.removeItem('otp_branch_name_mis-report');
    sessionStorage.removeItem('otp_mis');
    sessionStorage.removeItem('otp_email_mis');
  } else if(typeof otpRestoreSession==='function'&&otpRestoreSession()){
    if(OTP_BRANCH_ID&&OTP_SESSION){
      BR=OTP_BRANCH_ID;
      staffPortalEnter('login');
      AUTO_OPEN_REGISTER=true;
      tryOpenRegister();
    }else onOtpLogin({});
  }
})();

function goMainMenu(){
  el('app').classList.add('hidden');
  el('staffShell').classList.add('hidden');
  el('login').classList.remove('hidden');
  if(typeof branchShowMain==='function') branchShowMain();
  closeEdit();
}

function openRegister(){
  BR=OTP_BRANCH_ID||el('branch').value;
  if(!BR||!(OTP_SESSION||(typeof otpRestoreSession==='function'&&otpRestoreSession()))){if(typeof branchShowMain==='function')branchShowMain();el('login').classList.remove('hidden');return;}
  sessionStorage.setItem('guard_branch',BR);
  api('guardDocs').then(function(res){
    if(res.s!==200){otpMsg(res.j.error||'Could not open register',false);return;}
    DOCS=(res.j.docs||[]).map(function(d){return Object.assign({active:d.active!==false,inchargeMobile:d.inchargeMobile||'',idCardValidity:d.idCardValidity||'',pvcValidity:d.pvcValidity||'',medicalValidity:d.medicalValidity||''},d);});
    BNAME=res.j.branchName||'';
    el('login').classList.add('hidden');el('branchStep').classList.add('hidden');
    el('staffShell').classList.remove('hidden');el('app').classList.remove('hidden');
    var tag=el('staffBranchTag');if(tag)tag.textContent=staffBranchLabel();
    el('hdr').textContent=BNAME+' — '+DOCS.filter(function(d){return d.active!==false;}).length+' active guards';
    render();
  });
}

function okTag(v,l){
  var s=String(v||'').trim().toUpperCase();
  var good=['VALID','FIT','CERTIFIED','APPLIED'].indexOf(s)>=0;
  return '<span class="tag '+(good?'tag-ok':'tag-miss')+'">'+l+(good?' ✓':' ✗')+'</span>';
}

function render(){
  var q=(el('search').value||'').toLowerCase();
  var showIn=el('showInactive').checked;
  var g=el('grid');g.innerHTML='';var n=0,active=0;
  DOCS.forEach(function(d,i){
    if(d.active===false&&!showIn)return;
    var hay=(d.guardName+' '+d.employeeId+' '+d.unitName+' '+d.mobile+' '+d.incharge).toLowerCase();
    if(q&&hay.indexOf(q)<0)return;
    n++;if(d.active!==false)active++;
    var card=document.createElement('div');
    card.className='guard-card'+(d.active===false?' off':'');
    card.onclick=function(){openEdit(i);};
    var doj=d.doj?(' · DOJ '+fmtDate(d.doj)):'';
    card.innerHTML='<div class="name">'+h(d.guardName||'(No name)')+(d.active===false?' <span class="tag tag-off">Inactive</span>':'')+'</div>'+
      '<div class="eid">ID: '+h(d.employeeId||'—')+'</div>'+
      '<div class="meta">'+h(d.unitName||'')+(d.mobile?' · '+h(d.mobile):'')+doj+'</div>'+
      '<div class="tags">'+okTag(d.pvc,'PVC')+okTag(d.medical,'Med')+okTag(d.training,'Trn')+'</div>';
    g.appendChild(card);
  });
  el('countHint').textContent=n+' shown · '+active+' active';
  if(!n)g.innerHTML='<div class="hint" style="grid-column:1/-1;padding:20px">No guards to show — tap <b>+ Add Guard</b> or tick <b>Show deactivated</b>.</div>';
}

function toggleValidity(){
  var pvc=el('egPvc').value;
  var med=el('egMed').value;
  el('pvcValWrap').style.display=(pvc==='Valid'||pvc==='Applied')?'block':'none';
  el('medValWrap').style.display=(med==='Fit')?'block':'none';
}

function openEdit(i){
  var d=DOCS[i];el('editIdx').value=i;
  el('editTitle').textContent=d.active===false?'Edit Guard (Inactive)':'Edit Guard';
  el('egName').value=d.guardName||'';el('egEid').value=d.employeeId||'';el('egUnit').value=d.unitName||'';
  el('egIncharge').value=d.incharge||'';el('egMobile').value=d.mobile||'';el('egInchargeMob').value=d.inchargeMobile||'';
  el('egDoj').value=toIsoDate(d.doj);el('egIdCard').value=toIsoDate(d.idCardValidity);
  el('egAadhar').value=d.aadhar||'';el('egPvc').value=d.pvc||'';el('egPvcVal').value=toIsoDate(d.pvcValidity);
  el('egMed').value=d.medical||'';el('egMedVal').value=toIsoDate(d.medicalValidity);
  el('egTrain').value=d.training||'';el('egRem').value=d.remarks||'';
  var btn=el('btnDeactivate');
  if(d.active===false){btn.textContent='Activate Guard';btn.className='btn green';}
  else{btn.textContent='Deactivate Guard';btn.className='btn amber';}
  toggleValidity();
  el('editModal').classList.remove('hidden');
}

function closeEdit(){el('editModal').classList.add('hidden');}

function rowFromForm(i){
  var d=DOCS[i]||{};
  return {
    id:d.id||nid(),guardName:el('egName').value,employeeId:el('egEid').value,unitName:el('egUnit').value,
    incharge:el('egIncharge').value,mobile:el('egMobile').value,inchargeMobile:el('egInchargeMob').value,
    doj:el('egDoj').value,idCardValidity:el('egIdCard').value,aadhar:el('egAadhar').value,
    pvc:el('egPvc').value,pvcValidity:el('egPvcVal').value,medical:el('egMed').value,
    medicalValidity:el('egMedVal').value,training:el('egTrain').value,remarks:el('egRem').value,
    active:d.active!==false
  };
}

function applyEdit(){
  var i=+el('editIdx').value;
  DOCS[i]=rowFromForm(i);
  closeEdit();render();
  el('hdr').textContent=BNAME+' — '+DOCS.filter(function(d){return d.active!==false;}).length+' active guards';
}

function toggleActive(){
  var i=+el('editIdx').value;
  var d=DOCS[i];
  var goingInactive=d.active!==false;
  if(goingInactive&&!confirm('Deactivate this guard? They will be hidden from the list (not deleted).'))return;
  d.active=!goingInactive;
  if(!goingInactive)applyEdit();
  else{
    DOCS[i]=Object.assign(rowFromForm(i),{active:false});
    closeEdit();render();
    el('hdr').textContent=BNAME+' — '+DOCS.filter(function(x){return x.active!==false;}).length+' active guards';
  }
  var btn=el('btnDeactivate');
  if(d.active===false){btn.textContent='Activate Guard';btn.className='btn green';el('editTitle').textContent='Edit Guard (Inactive)';}
  else{btn.textContent='Deactivate Guard';btn.className='btn amber';el('editTitle').textContent='Edit Guard';}
}

function addRow(){
  DOCS.push({id:nid(),unitName:'',incharge:'',inchargeMobile:'',guardName:'',employeeId:'',mobile:'',doj:'',idCardValidity:'',aadhar:'',pvc:'',pvcValidity:'',medical:'',medicalValidity:'',training:'',remarks:'',active:true});
  openEdit(DOCS.length-1);
}

function save(){
  var m=el('saveMsg');
  api('saveGuardDocs',{docs:DOCS}).then(function(res){
    m.style.display='block';
    if(res.s===200){m.style.background='#14532d';m.style.color='#86efac';m.textContent='✅ All guard records saved.';}
    else{m.style.background='#450a0a';m.style.color='#fca5a5';m.textContent=res.j.error||'Could not save';}
  });
}
</script></body></html>`

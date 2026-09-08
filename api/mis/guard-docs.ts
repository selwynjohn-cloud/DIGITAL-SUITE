import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hodLoginHtml, otpLoginScript } from '../_lib/embedded-otp.js'
import { hodBootFromRequest, hodBootScriptJson } from '../_lib/hod-session.js'
import { MIS_STAFF_CSS } from '../_lib/mis/staff-theme.js'
import { MIS_STAFF_LAYOUT_CSS, misStaffSidebarHtml, MIS_STAFF_SESSION_JS, STAFF_BOOT_HEAD_SCRIPT, STAFF_BOOT_WAIT_HTML } from '../_lib/mis/staff-layout.js'
import { suitePageHeadHtml } from '../_lib/suite-page-chrome.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const boot = await hodBootFromRequest(req)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(
    PAGE.replace('__HOD_BOOT_JSON__', hodBootScriptJson(boot)),
  )
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Guard Compliance (Branch)</title>
<script>window.__HOD_BOOT__=__HOD_BOOT_JSON__;</script>
${STAFF_BOOT_HEAD_SCRIPT}
<style>
${MIS_STAFF_CSS}
${MIS_STAFF_LAYOUT_CSS}
.staff-shell .top{display:none}
.toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:12px 0}
.toolbar input{max-width:360px}
.guard-reg-wrap{overflow-x:auto;overflow-y:auto;max-height:74vh;border:2px solid #c9a84c;border-radius:10px;background:#0a1020;margin-top:10px}
.guard-reg-tbl{min-width:3100px;width:max-content;font-size:14px;border-collapse:separate;border-spacing:0}
.guard-reg-tbl th,.guard-reg-tbl td{border:1px solid #334155;padding:6px 8px;text-align:left;color:#e2e8f0}
.guard-reg-tbl th{white-space:nowrap;font-size:11px;padding:10px 8px;position:sticky;top:0;z-index:3;background:#0e1730;color:#c9a84c;text-transform:uppercase}
.guard-reg-tbl td{vertical-align:middle}
.guard-reg-tbl td input,.guard-reg-tbl td select{font-size:14px;padding:8px 10px;min-width:100px;width:100%;box-sizing:border-box;border:1px solid #334155;border-radius:6px;background:#0b1220;color:#e2e8f0}
.guard-reg-tbl .col-unit input,.guard-reg-tbl .col-unit select{min-width:240px}
.guard-reg-tbl .col-name input{min-width:170px}
.guard-reg-tbl .col-mob input{min-width:130px}
.guard-reg-tbl .col-date input{min-width:118px}
.guard-reg-tbl .col-aad input{min-width:140px;font-family:monospace}
.guard-reg-tbl tr.row-inactive{opacity:.45}
.guard-scroll-hint{color:#fde68a;font-size:14px;margin:10px 0 8px;padding:10px 12px;border-radius:8px;border:1px solid #c9a84c;background:rgba(201,168,76,.1)}
.guard-toggle{padding:6px 12px;border:none;border-radius:6px;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap}
.guard-toggle.on{background:#14532d;color:#86efac}
.guard-toggle.off{background:#334155;color:#94a3b8}
.menu-btns{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}
@media(max-width:520px){.menu-btns{grid-template-columns:1fr}}
.menu-btns .btn{text-align:center;padding:18px;font-size:16px}
.renew-modal{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px}
.renew-modal.hidden{display:none!important}
.renew-modal .inner{background:#111a30;border:2px solid #c9a84c;border-radius:14px;padding:20px;width:100%;max-width:780px;max-height:90vh;overflow:auto}
.renew-tbl{width:100%;font-size:13px;border-collapse:collapse;margin:12px 0}
.renew-tbl th,.renew-tbl td{border:1px solid #334155;padding:8px;text-align:left;color:#e2e8f0}
.renew-tbl th{background:#0e1730;color:#c9a84c;font-size:11px;text-transform:uppercase}
.renew-exp{color:#f87171;font-weight:800}
.renew-soon{color:#fbbf24;font-weight:800}
</style></head>
<body>
${STAFF_BOOT_WAIT_HTML}
<div class="top"><div style="display:flex;align-items:center;gap:12px"><img src="https://www.agilegroup-digital.co.in/agile-logo.png"><h1>Guard Compliance Register<small>PVC · Medical · Training — Statutory</small></h1></div>
<div id="topNav" style="display:flex;gap:8px;flex-wrap:wrap">
  <button class="btn grey btn-sm hidden" id="btnMenu" onclick="goMainMenu()">← Main Menu</button>
  <a class="btn grey btn-sm" href="/mis-report" style="text-decoration:none">📋 Daily Report</a>
</div></div>

<div id="loginWrap">
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
<div class="staff-bar noprint"><div style="display:flex;align-items:center;gap:12px;min-width:0;flex:1"><button type="button" class="staff-burger" onclick="document.getElementById('staffSide').classList.toggle('open')">☰ Menu</button>${suitePageHeadHtml('Agile MIS', 'Compliance (PVC/MC)', { coText: 'Guard mandatory documents — feeds Management Compliance report' })}</div><span class="staff-branch-tag" id="staffBranchTag">Branch</span></div>
<div class="staff-content">
<div id="app" class="hidden"><div class="wrap">
  <div class="card">
    <b style="color:#fde68a;font-size:18px" id="hdr"></b>
    <div class="hint">Edit any cell in the table below, then tap <b>Save All</b>. Same list as Master Directory — updates the dashboard automatically.</div>
    <div class="guard-scroll-hint">↔ <b>Scroll right</b> for all columns. <b>ID Card Issue</b> date auto-fills <b>Valid Till</b> (+1 year). You will get a popup if any ID Card / PVC / Medical renewal is due.</div>
    <div class="toolbar">
      <input id="search" placeholder="Search name, emp ID, unit, mobile…" oninput="render()">
      <label style="display:flex;align-items:center;gap:6px;margin:0;font-size:13px;color:#94a3b8"><input type="checkbox" id="showInactive" onchange="render()"> Show deactivated</label>
      <button class="btn amber btn-sm" onclick="showRenewalsNow()">⚠ Renewals Due</button>
      <button class="btn grey btn-sm" onclick="addRow()">+ Add Guard</button>
      <button class="btn green btn-sm" onclick="save()">✅ Save All</button>
      <button class="btn green btn-sm" onclick="shareCompliance()">✉ Share</button>
      <button class="btn grey btn-sm" onclick="downloadCompliancePdf()">⬇ Download PDF</button>
      <button class="btn grey btn-sm" onclick="goMainMenu()">← Main Menu</button>
      <span id="countHint" class="hint" style="margin:0"></span>
    </div>
    <div class="guard-reg-wrap"><table class="guard-reg-tbl"><thead><tr>
      <th>Unit / Site</th><th>Incharge</th><th>Incharge Mobile</th><th>Guard Name</th><th>Emp ID</th><th>Guard Mobile</th><th>DOJ</th><th>ID Card Issue</th><th>ID Card Valid Till</th><th>Aadhar</th><th>PVC</th><th>PVC Valid Till</th><th>Medical</th><th>Med Valid Till</th><th>Training</th><th>Remarks</th><th>Status</th>
    </tr></thead><tbody id="gdRows"></tbody></table></div>
    <div id="saveMsg" class="msg"></div>
  </div>
</div></div>
</div></div></div>

<div id="renewModal" class="renew-modal hidden" onclick="if(event.target===this)closeRenewModal()">
  <div class="inner">
    <h3 style="color:#fde68a;margin-bottom:8px">⚠ Renewals Due — ID Card / PVC / Medical</h3>
    <p class="hint" style="margin-bottom:10px">Expired or due within <b>30 days</b>. Please arrange renewal and update this register.</p>
    <div style="overflow-x:auto"><table class="renew-tbl"><thead><tr><th>Guard</th><th>Emp ID</th><th>Document</th><th>Renewal Date</th><th>Status</th></tr></thead><tbody id="renewRows"></tbody></table></div>
    <button class="btn green" type="button" onclick="closeRenewModal()" style="margin-top:12px">OK — I will action these</button>
  </div>
</div>

<script>
${otpLoginScript('mis-report', 'Agile MIS — Guard Compliance', 'staff')}
${MIS_STAFF_SESSION_JS}
var BR='',DOCS=[],BNAME='';
var AUTO_OPEN_REGISTER=false;
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function nid(){return 'gd'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function api(action,extra){return fetch('/api/mis/report-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,branchId:BR},extra||{}))}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});}
var PVC_OPTS=['','Valid','Applied','Pending','Expired','Not Applied','N/A'];
var MED_OPTS=['','Fit','Unfit','Pending','Expired','N/A'];
var TRN_OPTS=['','Certified','Pending','Expired','Not Done','N/A'];
function gfld(i,k,cls){cls=cls||'';return '<td class="'+cls+'"><input value="'+a(DOCS[i][k])+'" oninput="DOCS['+i+'][\\''+k+'\\']=this.value" title="'+a(DOCS[i][k])+'"></td>';}
function parseGuardDate(v){var s=String(v||'').trim();if(!s)return null;var m=s.match(/^(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{2,4})$/);if(m){var y=m[3].length===2?('20'+m[3]):m[3];return new Date(y+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0')+'T12:00:00');}if(/^\\d{4}-\\d{2}-\\d{2}$/.test(s))return new Date(s+'T12:00:00');return null;}
function fmtDdMmYyyy(d){if(!d||isNaN(d.getTime()))return '';return String(d.getDate()).padStart(2,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+d.getFullYear();}
function addOneYearStr(issue){var d=parseGuardDate(issue);if(!d)return '';d.setFullYear(d.getFullYear()+1);return fmtDdMmYyyy(d);}
function guardDateIso(v){var d=parseGuardDate(v);if(!d||isNaN(d.getTime()))return '';return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function onGuardDate(i,k,v){var d=parseGuardDate(v);DOCS[i][k]=d&&!isNaN(d.getTime())?fmtDdMmYyyy(d):v;}
function gfldDate(i,k,cls){cls=cls||'col-date';return '<td class="'+cls+'"><input type="date" value="'+a(guardDateIso(DOCS[i][k]))+'" oninput="onGuardDate('+i+',\\''+k+'\\',this.value)" title="'+a(DOCS[i][k])+'"></td>';}
function onIdCardIssueIso(i,v){onGuardDate(i,'idCardIssueDate',v);if(String(DOCS[i].idCardIssueDate||'').trim())DOCS[i].idCardValidity=addOneYearStr(DOCS[i].idCardIssueDate);render();}
function gfldIssueDate(i,cls){cls=cls||'col-date';return '<td class="'+cls+'"><input type="date" value="'+a(guardDateIso(DOCS[i].idCardIssueDate))+'" oninput="onIdCardIssueIso('+i+',this.value)" title="Issue date — Valid Till auto +1 year"></td>';}
function effectiveIdValid(d){var v=String(d.idCardValidity||'').trim();if(v)return v;var iss=String(d.idCardIssueDate||'').trim();return iss?addOneYearStr(iss):'';}
function gsel(i,k,opts,cls){cls=cls||'';var cur=DOCS[i][k]||'';return '<td class="'+cls+'"><select onchange="DOCS['+i+'][\\''+k+'\\']=this.value">'+opts.map(function(o){return '<option value="'+o+'"'+(cur===o?' selected':'')+'>'+(o||'—')+'</option>';}).join('')+'</select></td>';}
function updateHdr(){el('hdr').textContent=BNAME+' — '+DOCS.filter(function(d){return d.active!==false;}).length+' active guards';}
function closeRenewModal(){el('renewModal').classList.add('hidden');}
function showRenewModal(list){var tb=el('renewRows');if(!list||!list.length){tb.innerHTML='<tr><td colspan="5" style="padding:12px;color:#94a3b8">No renewals due in the next 30 days.</td></tr>';}else{tb.innerHTML=list.map(function(r){var st=r.expired?'<span class="renew-exp">EXPIRED</span>':'<span class="renew-soon">Due in '+r.daysLeft+' day'+(r.daysLeft===1?'':'s')+'</span>';return '<tr><td>'+h(r.guardName)+'</td><td>'+h(r.employeeId||'—')+'</td><td>'+h(r.docType)+'</td><td>'+h(r.renewalDate)+'</td><td>'+st+'</td></tr>';}).join('');}el('renewModal').classList.remove('hidden');}
function showRenewalsNow(){api('guardRenewals').then(function(r){if(r.s===200)showRenewModal(r.j.renewals||[]);});}
function checkRenewalPopup(){api('guardRenewals').then(function(r){if(r.s===200&&(r.j.renewals||[]).length)showRenewModal(r.j.renewals);});}

function onOtpLogin(j){
  if(typeof branchHideAll==='function') branchHideAll();
  var bid=j.branchId||OTP_BRANCH_ID||'';
  if(bid){OTP_BRANCH_ID=bid;BR=bid;sessionStorage.setItem('otp_branch_mis-report',bid);if(el('branch'))el('branch').value=bid;}
  if(j.branchName)OTP_BRANCH_NAME=j.branchName;
  if(typeof hodPersistSession==='function')hodPersistSession();
  staffShowApp();
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

function initStaffPage(){
  BR=staffResolveBranchId()||'';
  if(el('branch')&&BR)el('branch').value=BR;
  if(BR&&OTP_SESSION){
    AUTO_OPEN_REGISTER=true;
    tryOpenRegister();
    return;
  }
  if(OTP_SESSION){
    staffShowApp();
    if(typeof branchHideAll==='function')branchHideAll();
    var login=staffLoginEl();if(login)login.classList.remove('hidden');
    if(el('branchStep'))el('branchStep').classList.remove('hidden');
  }
}

function goMainMenu(){
  el('app').classList.add('hidden');
  el('staffShell').classList.add('hidden');
  var wrap=el('loginWrap');if(wrap)wrap.classList.remove('hidden');
  else el('login').classList.remove('hidden');
  if(typeof branchShowMain==='function') branchShowMain();
}

function openRegister(){
  BR=staffResolveBranchId()||OTP_BRANCH_ID||el('branch').value;
  if(!OTP_SESSION){if(typeof branchShowMain==='function')branchShowMain();var wrap=el('loginWrap');if(wrap)wrap.classList.remove('hidden');return;}
  if(!BR){
    staffShowApp();
    if(typeof branchHideAll==='function')branchHideAll();
    var wrap=el('loginWrap');if(wrap)wrap.classList.remove('hidden');
    if(el('branchStep'))el('branchStep').classList.remove('hidden');
    return;
  }
  if(typeof staffBootPending==='function')staffBootPending('Loading guard register…');
  sessionStorage.setItem('guard_branch',BR);
  api('guardDocs').then(function(res){
    if(res.s===401){staffShowLogin(res.j&&res.j.error?res.j.error:'Please sign in again.');return;}
    if(res.s!==200){otpMsg(res.j.error||'Could not open register',false);return;}
    DOCS=(res.j.docs||[]).map(function(d){return Object.assign({active:d.active!==false,inchargeMobile:d.inchargeMobile||'',idCardIssueDate:d.idCardIssueDate||'',idCardValidity:d.idCardValidity||'',pvcValidity:d.pvcValidity||'',medicalValidity:d.medicalValidity||''},d);});
    BNAME=res.j.branchName||'';
    el('login').classList.add('hidden');el('branchStep').classList.add('hidden');
    el('staffShell').classList.remove('hidden');el('app').classList.remove('hidden');
    var tag=el('staffBranchTag');if(tag)tag.textContent=staffBranchLabel();
    updateHdr();
    render();
    checkRenewalPopup();
  });
}

function toggleGuardActive(i){
  var d=DOCS[i];
  if(d.active!==false){
    if(!confirm('Deactivate this guard? They will be hidden from the list (not deleted).'))return;
    d.active=false;
  }else d.active=true;
  render();updateHdr();
}

function render(){
  var q=(el('search').value||'').toLowerCase();
  var showIn=el('showInactive').checked;
  var tb=el('gdRows');if(!tb)return;tb.innerHTML='';var n=0,active=0;
  DOCS.forEach(function(d,i){
    if(d.active===false&&!showIn)return;
    var hay=(d.guardName+' '+d.employeeId+' '+d.unitName+' '+d.mobile+' '+d.incharge+' '+d.inchargeMobile).toLowerCase();
    if(q&&hay.indexOf(q)<0)return;
    n++;if(d.active!==false)active++;
    var act=d.active!==false;
    var tr=document.createElement('tr');
    if(!act)tr.className='row-inactive';
    tr.innerHTML=
      gfld(i,'unitName','col-unit')+gfld(i,'incharge','col-name')+gfld(i,'inchargeMobile','col-mob')+gfld(i,'guardName','col-name')+gfld(i,'employeeId','')+gfld(i,'mobile','col-mob')+gfldDate(i,'doj','col-date')+gfldIssueDate(i,'col-date')+gfldDate(i,'idCardValidity','col-date')+gfld(i,'aadhar','col-aad')+gsel(i,'pvc',PVC_OPTS,'')+gfldDate(i,'pvcValidity','col-date')+gsel(i,'medical',MED_OPTS,'')+gfldDate(i,'medicalValidity','col-date')+gsel(i,'training',TRN_OPTS,'')+gfld(i,'remarks','col-unit')+
      '<td><button type="button" class="guard-toggle '+(act?'on':'off')+'" onclick="toggleGuardActive('+i+')">'+(act?'Active':'Inactive')+'</button></td>';
    tb.appendChild(tr);
  });
  el('countHint').textContent=n+' shown · '+active+' active';
  if(!n)tb.innerHTML='<tr><td colspan="17" style="padding:20px;color:#94a3b8;text-align:center">No guards to show — tap <b>+ Add Guard</b> or tick <b>Show deactivated</b>.</td></tr>';
}

function addRow(){
  DOCS.push({id:nid(),unitName:'',incharge:'',inchargeMobile:'',guardName:'',employeeId:'',mobile:'',doj:'',idCardIssueDate:'',idCardValidity:'',aadhar:'',pvc:'',pvcValidity:'',medical:'',medicalValidity:'',training:'',remarks:'',active:true});
  render();updateHdr();
}

function save(){
  var m=el('saveMsg');
  api('saveGuardDocs',{docs:DOCS}).then(function(res){
    m.style.display='block';
    if(res.s===200){m.style.background='#14532d';m.style.color='#86efac';m.textContent='✅ All guard records saved.';}
    else{m.style.background='#450a0a';m.style.color='#fca5a5';m.textContent=res.j.error||'Could not save';}
  });
}
function shareCompliance(){
  var to=prompt('Enter client email ID to share this PVC & MC report (Director will be copied):');
  if(to==null)return;to=String(to||'').trim();if(!to||to.indexOf('@')<0){alert('Please enter a valid email ID.');return;}
  api('sendComplianceReportMail',{to:to}).then(function(res){
    if(res.s===401){staffShowLogin(res.j&&res.j.error?res.j.error:'Please sign in again.');return;}
    alert(res.s===200?'✅ Report shared by email (CC: Director).':(res.j.error||'Could not send'));
  });
}
function openReportHtml(html,fileName){
  try{
    var blob=new Blob([html],{type:'text/html;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var w=window.open(url,'_blank');
    if(w){
      setTimeout(function(){try{w.focus();w.print();}catch(e){}},600);
      setTimeout(function(){URL.revokeObjectURL(url);},60000);
      return;
    }
    var a=document.createElement('a');
    a.href=url;a.download=fileName||'PVC-MC-Report.html';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},5000);
    alert('Report downloaded as HTML. Open the file and choose Print → Save as PDF.');
  }catch(e){
    alert('Could not open the report. Please allow pop-ups for this site and try again.');
  }
}
function downloadCompliancePdf(){
  api('complianceReportHtml').then(function(res){
    if(res.s===401){staffShowLogin(res.j&&res.j.error?res.j.error:'Please sign in again.');return;}
    if(res.s!==200){alert(res.j.error||'Could not build PDF');return;}
    if(!res.j.html){alert('Report was empty — please try again.');return;}
    openReportHtml(res.j.html,'PVC-MC-Branch.html');
  }).catch(function(){alert('Network error — could not build PDF.');});
}
(function(){
  var fresh=new URLSearchParams(location.search).get('fresh')==='1';
  if(fresh){
    sessionStorage.removeItem('otp_mis-report');
    sessionStorage.removeItem('otp_email_mis-report');
    sessionStorage.removeItem('otp_branch_mis-report');
    sessionStorage.removeItem('otp_branch_name_mis-report');
    document.documentElement.classList.remove('hod-signed-in','boot-ready','staff-booting','boot-failed');
    fetch('/api/auth/hod-session',{method:'DELETE',credentials:'include'}).catch(function(){});
    staffShowLogin();
  } else{
    staffBoot();
  }
})();
</script></body></html>`

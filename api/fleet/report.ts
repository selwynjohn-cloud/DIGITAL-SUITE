import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hodLoginHtml, otpLoginScript } from '../_lib/embedded-otp.js'
import { FLEET_REPORT_CSS, fleetReportFooter, fleetReportHeader } from '../_lib/fleet/brand.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Fleet — Weekly Vehicle Report</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:14px}
#login{max-width:400px;margin:0 auto;padding-top:10vh}
.card{background:#111a30;border:1px solid #22304f;border-radius:14px;padding:24px;margin-bottom:16px}
.card h2{color:#fff;margin-bottom:4px}
input,select,textarea{width:100%;padding:9px 11px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:14px}
label{display:block;font-size:12px;color:#94a3b8;margin:8px 0 3px;font-weight:700}
.btn{padding:11px 18px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:14px;background:#0d9488;color:#fff}
.green{background:#16a34a;color:#fff}.grey{background:#334155;color:#e2e8f0}
.msg{padding:10px;border-radius:8px;font-size:14px;margin-top:10px;display:none;background:#3a0a0a;color:#ef4444}
#app{display:none;max-width:1100px;margin:0 auto;padding:16px}
.hdr{text-align:center;margin-bottom:16px}.hdr img{height:52px}.hdr h1{color:#fff;font-size:20px;margin-top:8px}
.hdr p{color:#0d9488;font-size:13px}
.deadline{background:#451a03;border:1px solid #f59e0b;border-radius:10px;padding:12px;text-align:center;margin-bottom:14px;color:#fcd34d;font-weight:700}
.sec{font-size:13px;font-weight:800;color:#0d9488;margin:16px 0 8px;text-transform:uppercase;letter-spacing:1px}
.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:16px}
.vcard{background:#111a30;border:1px solid #22304f;border-radius:12px;padding:14px;margin-bottom:12px}
.vcard h3{color:#fff;font-size:15px;margin-bottom:10px;border-bottom:1px solid #22304f;padding-bottom:6px}
.fgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px}
.okmsg{display:none;background:#052e16;color:#4ade80;padding:12px;border-radius:8px;margin-top:12px;text-align:center;font-weight:700}
.decl{font-size:12px;color:#94a3b8;margin-top:16px;padding:12px;border:1px solid #22304f;border-radius:8px}
.links{text-align:center;margin:12px 0;font-size:12px;color:#64748b}
.links a{color:#0d9488;margin:0 8px}
.hidden{display:none!important}
${FLEET_REPORT_CSS}
</style></head>
<body>
<div id="login">
${hodLoginHtml('Agile Fleet', 'Weekly Vehicle Report — branch HOD sign in')}
<div id="branchStep" class="card hidden" style="margin-top:12px">
  <label>Your branch</label><select id="branch"></select>
  <button class="btn" style="width:100%;margin-top:12px" onclick="doLogin()">Continue to report</button>
  <div class="links"><a href="/fleet-drivers">Driver Register</a></div>
</div>
</div>

<div id="app">
  ${fleetReportHeader('Weekly Vehicle Report', 'Branch submission — all branches & Corporate Office', 'Agile Fleet')}
  <div class="rpt-body">
  <div class="deadline">⏰ Submit every <b>Saturday before 5:00 PM</b> — each branch submits for their own vehicles (1 to many)</div>
  <div class="wr-doc-frame"><div class="wr-doc-inner">
  <div class="wr-section-box"><div class="wr-section-title">Section A — Branch Details</div>
  <div class="rpt-meta">
    <div class="fld"><label>Branch Name *</label><input id="branchName" readonly></div>
    <div class="fld"><label>Reporting Week No. *</label><input id="weekNo"></div>
    <div class="fld"><label>From Date *</label><input id="fromDate" type="date"></div>
    <div class="fld"><label>To Date *</label><input id="toDate" type="date"></div>
    <div class="fld"><label>Submitted By *</label><input id="submittedBy" placeholder="Name & Designation"></div>
    <div class="fld"><label>Date of Submission *</label><input id="submitDate" type="date"></div>
  </div></div>
  <div class="wr-section-box"><div class="wr-section-title">Section B — Vehicle Details</div>
  <div id="vehicles"></div></div>
  <div class="rpt-decl">Declaration: I hereby certify that the above information is true and correct.</div>
  <div style="text-align:center;margin:16px 0">
    <button class="btn green" onclick="submitReport()">✓ Submit Weekly Vehicle Report</button>
  </div>
  </div></div>
  <div id="ok" class="okmsg">Report submitted. Vehicle analysis email sent to your branch (Director copied). Thank you!</div>
  <div class="links"><a href="/fleets?portal=staff">Open Branch Portal</a></div>
  </div>
  ${fleetReportFooter()}
</div>

<script>
${otpLoginScript('fleet', 'Agile Fleet — Weekly Report', 'staff')}
var BRANCH='',VEH=[],DRV=[],ENT=[],BRANCHES=['Visakhapatnam','Nellore','Bangalore','Gulbarga','Hyderabad','Kakinada','Vijayawada','Chennai','Mumbai','Corporate Office'];
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function weekNo(){var d=new Date();var x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));var day=x.getUTCDay()||7;x.setUTCDate(x.getUTCDate()+4-day);var ys=new Date(Date.UTC(x.getUTCFullYear(),0,1));return 'Week-'+Math.ceil(((x-ys)/86400000+1)/7);}
function weekRange(){var d=new Date();var wd=(d.getDay()+6)%7;d.setDate(d.getDate()-wd);var f=d.toISOString().slice(0,10);d.setDate(d.getDate()+6);return {from:f,to:d.toISOString().slice(0,10)};}
function api(action,extra){return fetch('/api/fleet/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,branchId:BRANCH},extra||{}))}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});}
function onOtpLogin(j){
  api('login').then(function(res){
    if(res.s===403||res.s===401){otpMsg(res.j.error||'Not authorized for Fleet.',false);return;}
    if(res.s!==200){otpMsg(res.j.error||'Could not sign in.',false);return;}
    if(res.j.role==='branch'&&res.j.lockedBranch){
      BRANCH=res.j.lockedBranch;
      doLogin();
      return;
    }
    if(res.j.role==='admin'){
      el('otpStepEmail').classList.add('hidden');el('otpStepPin').classList.add('hidden');
      el('branchStep').classList.remove('hidden');
      otpMsg('Signed in. Select branch to view report.',true);
      return;
    }
    otpMsg(res.j.error||'Branch access not set up for your email.',false);
  }).catch(function(){otpMsg('Network error.',false);});
}
function drvOpts(i){return '<option value="">— Select driver —</option>'+DRV.filter(function(d){return d.active!==false;}).map(function(d,di){var sel=ENT[i].driverName===d.name?' selected':'';return '<option value="'+di+'"'+sel+'>'+h(d.name)+' ('+h(d.licenseNo)+')</option>';}).join('');}
function pickDrv(i,idx){var d=DRV[+idx];if(!d)return;ENT[i].driverName=d.name;ENT[i].driverMobile=d.mobile;ENT[i].licenseNo=d.licenseNo;ENT[i].licenseValid=d.licenseValid;render();}
el('branch').innerHTML=BRANCHES.map(function(b){return '<option>'+b+'</option>';}).join('');
function doLogin(){BRANCH=el('branch').value;api('login').then(function(res){if(res.s!==200){otpMsg(res.j.error||'Could not open report',false);return;}
  VEH=(res.j.vehicles||[]).filter(function(v){return v.active;});
  DRV=(res.j.drivers||[]).filter(function(d){return d.active!==false;});
  var wr=weekRange();el('branchName').value=BRANCH;el('weekNo').value=weekNo();el('fromDate').value=wr.from;el('toDate').value=wr.to;el('submitDate').value=new Date().toISOString().slice(0,10);
  ENT=VEH.map(function(v){return {vehicleId:v.id,regNo:v.regNo,makeModel:v.vehicleName||v.makeModel,driverName:'',driverMobile:'',licenseNo:'',licenseValid:'',odoStart:'',odoEnd:'',kmWeek:0,kmMonth:0,lastFuelDate:'',fuelAmount:'',fuelQty:'',maintenanceDetails:'Nil',maintenanceCost:'Nil',insuranceValid:v.insuranceValid,pucValid:v.pucValid,condition:'Good',remarks:''};});
  el('login').style.display='none';el('app').style.display='block';render();});}

function render(){
  el('vehicles').innerHTML=ENT.map(function(e,i){
    return '<div class="vcard"><h3>Vehicle '+(i+1)+' — '+h(e.regNo)+' · '+h(e.makeModel)+'</h3><div class="fgrid">'+
      '<div><label>Driver (from branch register)</label><select onchange="pickDrv('+i+',this.value)">'+drvOpts(i)+'</select></div>'+
      fld('Driver Full Name *',e.driverName,'driverName',i)+fld('Driver Mobile No. *',e.driverMobile,'driverMobile',i)+
      fld('Driving License No. *',e.licenseNo,'licenseNo',i)+fld('License Valid Upto *',e.licenseValid,'licenseValid',i)+
      fld('Speedometer Start / End (KM) *',e.odoStart,'odoStart',i)+fld('Odo End (km)',e.odoEnd,'odoEnd',i)+
      fld('KM Driven This Week *',e.kmWeek,'kmWeek',i,true)+fld('KM Driven This Month *',e.kmMonth,'kmMonth',i,true)+
      fld('Last Fuel Date *',e.lastFuelDate,'lastFuelDate',i)+fld('Fuel Amount (Rs.) *',e.fuelAmount,'fuelAmount',i)+
      fld('Fuel Quantity (Ltrs) *',e.fuelQty,'fuelQty',i)+fld('Maintenance Details *',e.maintenanceDetails,'maintenanceDetails',i)+
      fld('Maintenance Cost (Rs.) *',e.maintenanceCost,'maintenanceCost',i)+
      fld('Insurance Valid Upto *',e.insuranceValid,'insuranceValid',i)+fld('PUC Valid Upto *',e.pucValid,'pucValid',i)+
      fld('Vehicle Condition *',e.condition,'condition',i)+fld('Remarks *',e.remarks,'remarks',i)+
    '</div></div>';}).join('')||'<div class="card" style="color:#94a3b8">No vehicles in master for this branch. Ask management to add vehicles first.</div>';
}
function fld(lbl,val,key,i,num){return '<div><label>'+lbl+'</label><input value="'+a(val)+'" '+(num?'type="number"':'')+' oninput="ENT['+i+'][\\''+key+'\\']='+(num?'+this.value':'this.value')+'"></div>';}

function submitReport(){
  if(!el('submittedBy').value){alert('Please enter Submitted By (name & designation).');return;}
  var rep={id:'wr'+Date.now(),branchId:BRANCH,weekNo:el('weekNo').value,fromDate:el('fromDate').value,toDate:el('toDate').value,submittedBy:el('submittedBy').value,submittedAt:new Date().toISOString(),entries:ENT,active:true};
  api('load').then(function(res){var prev=(res.j.reports||[]).filter(function(r){return !(r.branchId===BRANCH&&r.weekNo===rep.weekNo);});
    return api('saveReports',{reports:prev.concat([rep])});}).then(function(res){if(res.s===200){el('ok').style.display='block';window.scrollTo(0,document.body.scrollHeight);}else alert(res.j.error||'Could not save');});
}
</script></body></html>`

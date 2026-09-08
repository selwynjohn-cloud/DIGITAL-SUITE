import type { VercelRequest, VercelResponse } from '@vercel/node'
import { FLEET_REPORT_CSS, fleetFooterBlock } from '../_lib/fleet/brand.js'
import { FLEET_BRANCHES } from '../_lib/fleet/store.js'
import { POST_TRIP_CHECKS, PRE_TRIP_CHECKS } from '../_lib/fleet/trip-fields.js'
import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../_lib/suite-tap-feedback.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Agile Fleet — Daily Pre & Post Trip</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:16px;padding:12px;padding-bottom:env(safe-area-inset-bottom)}
.hdr{text-align:center;margin:8px 0 14px}.hdr img{height:48px}.hdr h1{color:#fff;font-size:18px;margin-top:8px}.hdr p{color:#7dd3fc;font-size:13px;margin-top:4px}
.card{background:#111a30;border:1px solid #22304f;border-radius:14px;padding:16px;margin-bottom:14px}
label{display:block;font-size:12px;color:#94a3b8;margin:10px 0 4px;font-weight:700}
input,select,textarea{width:100%;padding:12px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:16px}
.btn{padding:13px 16px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:16px;background:#0ea5e9;color:#fff;width:100%;margin-top:10px}
.green{background:#16a34a}.grey{background:#334155;color:#e2e8f0}
.note{background:#111a30;border-left:3px solid #0ea5e9;padding:10px 12px;margin-bottom:12px;color:#94a3b8;font-size:13px;line-height:1.5}
.grid{display:grid;grid-template-columns:1fr;gap:0}
@media(min-width:560px){.grid{grid-template-columns:1fr 1fr;gap:8px}}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #22304f;padding:8px;text-align:left}th{color:#94a3b8;font-size:11px}
.sec{color:#7dd3fc;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin:16px 0 8px}
.msg{display:none;padding:10px;border-radius:8px;margin-top:10px}
${FLEET_REPORT_CSS}
${SUITE_TAP_FEEDBACK_CSS}
</style></head>
<body>
<div class="hdr"><img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile"><h1>Daily Pre &amp; Post Trip</h1><p>No password — one common link. Pick your branch</p></div>
<p class="note">Fill <b>Pre-Trip</b> before you start. After the trip (even 3–4 hours later) open this same page, pick the same Branch, Date, Vehicle and <b>Trip no.</b> The saved Pre-Trip comes back so you can see it. You cannot change it. Fill <b>Post-Trip</b> only. You do not type the trip code. One vehicle can do Trip 1, 2 and 3 in a day. Opening KM uses the last closing KM. Pick a driver from the list, or <b>New Driver</b> and type the name and licence expiry date.</p>
<div class="card">
  <label>Branch name *</label>
  <select id="branch" onchange="onBranch()"></select>
  <div><label>Trip report code</label><input id="tripCode" readonly placeholder="CHE/0001/29-08-2026"></div>
  <div class="grid">
    <div><label>Date *</label><input id="date" type="date" onchange="onDate()"></div>
    <div><label>Trip no. *</label><select id="tripNo" onchange="onTrip()"><option value="1">Trip 1</option><option value="2">Trip 2</option><option value="3">Trip 3</option></select></div>
    <div><label>Shift</label><select id="shift" onchange="rememberTrip()"><option>Morning</option><option>Afternoon</option><option>Night</option></select></div>
    <div><label>Vehicle No. *</label><select id="vehSel" onchange="pickVeh(this.value)"></select><input id="regNo" placeholder="Vehicle Number" style="margin-top:6px" onchange="onKey()"></div>
    <div><label>Driver name *</label><select id="drvSel" onchange="pickDrv(this.value)"></select><input id="driver" placeholder="New driver name" style="margin-top:6px"></div>
    <div><label>Driver mobile</label><input id="mobile" placeholder="10-digit mobile" inputmode="numeric"></div>
    <div><label>License Expiry date</label><input id="licExp" type="date" onchange="onLicTyped()"></div>
  </div>
</div>
<div class="sec" id="preSec">Pre-Trip</div>
<div class="card" id="preCard">
  <div class="grid">
    <div><label>Start time (Auto)</label><input id="startTime" placeholder="00.00hrs"></div>
    <div><label>Diesel Level</label><select id="diesel"><option value="">— Select —</option><option>Full Tank</option><option>Half tank</option><option>less than half tank</option></select></div>
    <div><label>Opening KM *</label><input id="odoStart" inputmode="decimal"></div>
    <div><label>From</label><input id="fromLoc"></div>
    <div><label>To</label><input id="toLoc"></div>
    <div><label>Purpose</label><input id="purpose"></div>
    <div><label>Checked by *</label><input id="preBy"></div>
  </div>
  <label>Remarks</label><textarea id="preRemarks" rows="2"></textarea>
  <div style="overflow-x:auto;margin-top:10px"><table><thead><tr><th>Check</th><th>Status</th><th>Remarks</th></tr></thead><tbody id="preRows"></tbody></table></div>
  <button class="btn green" id="preSaveBtn" onclick="saveKind('pre-trip-4w')">Save Pre-Trip Report</button>
</div>
<div class="sec" id="postSec">Post-Trip</div>
<div class="card" id="postCard">
  <div style="overflow-x:auto;margin-top:0"><div class="grid">
    <div><label>End time (Auto)</label><input id="endTime" placeholder="dd/mm/yyyy 00.00hrs"></div>
    <div><label>Closing KM *</label><input id="odoEnd" inputmode="decimal"></div>
    <div><label>Total KM (Auto)</label><input id="kmRun" readonly></div>
    <div><label>Fuel (L)</label><input id="fuelQty" inputmode="decimal"></div>
    <div><label>Fuel ₹</label><input id="fuelAmount" inputmode="decimal"></div>
    <div><label>Return location</label><input id="returnLoc"></div>
    <div><label>Incident (if any)</label><input id="incident"></div>
    <div><label>Checked by *</label><input id="postBy"></div>
  </div></div>
  <label>Remarks</label><textarea id="postRemarks" rows="2"></textarea>
  <div style="overflow-x:auto;margin-top:10px"><table><thead><tr><th>Check</th><th>Status</th><th>Remarks</th></tr></thead><tbody id="postRows"></tbody></table></div>
  <button class="btn green" onclick="saveKind('post-trip-4w')">Save Post-Trip Report</button>
</div>
<div id="msg" class="msg"></div>
${fleetFooterBlock()}
<script>
${suiteTapFeedbackInitScript()}
var BRANCHES=${JSON.stringify(FLEET_BRANCHES)};
var PRE4W=${JSON.stringify(PRE_TRIP_CHECKS)};
var POST4W=${JSON.stringify(POST_TRIP_CHECKS)};
var VEH=[],DRV=[],RECALLING=false,LIC_ALERTED='',NEXT_SEQ=1,HAS_PRE=false;
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function today(){return new Date().toISOString().slice(0,10);}
function nowHrs(){
  var parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
  var hh='00',mm='00';
  for(var i=0;i<parts.length;i++){if(parts[i].type==='hour')hh=parts[i].value;if(parts[i].type==='minute')mm=parts[i].value;}
  if(hh.length<2)hh='0'+hh;
  if(mm.length<2)mm='0'+mm;
  return hh+'.'+mm+'hrs';
}
function nowDateHrs(){
  var parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(new Date());
  var dd='00',mo='00',yy='';
  for(var i=0;i<parts.length;i++){if(parts[i].type==='day')dd=parts[i].value;if(parts[i].type==='month')mo=parts[i].value;if(parts[i].type==='year')yy=parts[i].value;}
  return dd+'/'+mo+'/'+yy+' '+nowHrs();
}
function asHrs(v){
  var t=String(v||'').trim();
  if(!t)return nowHrs();
  if(/hrs$/i.test(t)&&t.indexOf('/')<0)return t;
  var m=t.match(/([0-9]{1,2})[:.]([0-9]{2})/);
  if(m)return (m[1].length<2?'0':'')+m[1]+'.'+m[2]+'hrs';
  return t;
}
function asEnd(v){
  var t=String(v||'').trim();
  if(!t)return nowDateHrs();
  if(t.indexOf('/')>=0&&/hrs$/i.test(t))return t;
  return nowDateHrs().slice(0,11)+asHrs(t);
}
function qBranch(){
  var q=new URLSearchParams(location.search).get('branch');
  if(q)return decodeURIComponent(q);
  var parts=location.pathname.replace(/[/]+$/,'').split('/');
  if(parts.length>=3&&parts[1]==='fleet-trip')return decodeURIComponent(parts.slice(2).join('/'));
  return '';
}
function matchBranch(name){
  var want=String(name||'').trim().toLowerCase();
  return BRANCHES.find(function(b){return b.toLowerCase()===want;})||'';
}
function showMsg(t,ok){var m=el('msg');m.style.display='block';m.style.background=ok?'#052e16':'#3a0a0a';m.style.color=ok?'#4ade80':'#fecaca';m.textContent=t;}
function checkRows(id,list){
  el(id).innerHTML=list.map(function(it,i){return '<tr><td>'+h(it)+'</td><td><select id="'+id+'s'+i+'"><option>OK</option><option>NOT OK</option><option>NA</option></select></td><td><input id="'+id+'r'+i+'"></td></tr>';}).join('');
}
function applyChecks(id,list,items){
  checkRows(id,list);
  list.forEach(function(name,i){
    var found=(items||[]).find(function(x){return x.item===name;});
    if(!found)return;
    if(el(id+'s'+i)&&found.status)el(id+'s'+i).value=found.status;
    if(el(id+'r'+i)&&found.remarks)el(id+'r'+i).value=found.remarks;
  });
}
function readChecks(id,list){return list.map(function(it,i){return {item:it,status:(el(id+'s'+i)&&el(id+'s'+i).value)||'OK',remarks:(el(id+'r'+i)&&el(id+'r'+i).value)||''};});}
function branchName(){return el('branch').value||'';}
function setSecs(){
  var b=branchName();
  var t=el('tripNo').value||'1';
  el('preSec').textContent=b?('Pre-Trip — '+b+' — Trip '+t):('Pre-Trip — Trip '+t);
  el('postSec').textContent=b?('Post-Trip — '+b+' — Trip '+t):('Post-Trip — Trip '+t);
}
function rememberTrip(){
  try{localStorage.setItem('fleetTripLast',JSON.stringify({branch:branchName(),date:el('date').value,tripNo:el('tripNo').value,shift:el('shift').value,regNo:el('regNo').value,driver:el('driver').value,mobile:el('mobile').value,licExp:el('licExp').value,diesel:el('diesel').value,tripCode:el('tripCode').value}));}catch(e){}
}
function istYmd(){
  var parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(new Date());
  var dd='00',mo='00',yy='';
  for(var i=0;i<parts.length;i++){if(parts[i].type==='day')dd=parts[i].value;if(parts[i].type==='month')mo=parts[i].value;if(parts[i].type==='year')yy=parts[i].value;}
  return yy+'-'+mo+'-'+dd;
}
function licenseExpiredYmd(ymd){var t=String(ymd||'').trim();return t.length>=10&&t<istYmd();}
function licenseBlockMsg(name){return (String(name||'').trim()||'Driver')+' please renew your license. You will not be permitted to drive any vehicles. Please handover the vehicle key to HOD.';}
function branchTripLetters(b){var s=String(b||'').toUpperCase().replace(/[^A-Z]/g,'');return (s+'XXX').slice(0,3);}
function tripCodeDatePart(iso){var p=String(iso||'').split('-');return p.length===3&&p[0].length===4?(p[2]+'-'+p[1]+'-'+p[0]):String(iso||'');}
function formatTripCode(branch,seq,iso){return branchTripLetters(branch)+'/'+String(Math.max(1,seq||1)).padStart(4,'0')+'/'+tripCodeDatePart(iso);}
function setCardLocked(id,on){
  var box=el(id);if(!box)return;
  box.style.opacity=on?'0.72':'1';
  box.querySelectorAll('input,select,textarea,button').forEach(function(n){
    if(n.id==='kmRun'){n.disabled=false;n.readOnly=true;return;}
    n.disabled=!!on;
  });
}
function applyLocks(){
  var lic=licenseExpiredYmd(el('licExp').value);
  setCardLocked('preCard',lic||HAS_PRE);
  setCardLocked('postCard',lic);
  var btn=el('preSaveBtn');
  if(btn)btn.style.display=(lic||HAS_PRE)?'none':'block';
}
function setTripLocked(on){
  if(on){setCardLocked('preCard',true);setCardLocked('postCard',true);var btn=el('preSaveBtn');if(btn)btn.style.display='none';}
  else applyLocks();
}
function gatePhoneLicense(popup){
  var name=el('driver').value.trim();
  var rec=DRV.find(function(x){return x.name===name;});
  if(rec&&rec.licenseValid){el('licExp').value=rec.licenseValid;el('licExp').readOnly=true;}
  else el('licExp').readOnly=false;
  var ymd=el('licExp').value;
  if(!licenseExpiredYmd(ymd)){LIC_ALERTED='';applyLocks();return false;}
  var msg=licenseBlockMsg(name);
  applyLocks();
  if(popup&&LIC_ALERTED!==name){
    LIC_ALERTED=name;
    alert(msg);
    fetch('/api/fleet/trip-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'licenseAlert',branchId:branchName(),driverName:name,licenseValid:ymd,regNo:el('regNo').value.trim()})});
  }
  return true;
}
function onLicTyped(){gatePhoneLicense(true);rememberTrip();}
function paintTripCode(code){
  var b=branchName(),dt=el('date').value||istYmd();
  if(!b){el('tripCode').value='';return;}
  var letters=branchTripLetters(b),c=String(code||el('tripCode').value||'').toUpperCase();
  if(c.indexOf(letters+'/')===0){
    var n=parseInt(c.slice(letters.length+1,letters.length+5),10);
    el('tripCode').value=formatTripCode(b,n||NEXT_SEQ,dt);
  }else el('tripCode').value=formatTripCode(b,NEXT_SEQ,dt);
}
function onDate(){paintTripCode();onKey();}
function loadRemembered(){
  try{return JSON.parse(localStorage.getItem('fleetTripLast')||'{}');}catch(e){return {};}
}
function fillVeh(){
  var cur=el('regNo').value,opts='<option value="">— Select vehicle —</option>'+VEH.map(function(v){return '<option'+(v.regNo===cur?' selected':'')+'>'+h(v.regNo)+'</option>';}).join('');
  var inList=VEH.some(function(v){return v.regNo===cur;});
  el('vehSel').innerHTML=opts+'<option value="__OTHER__"'+(cur&&!inList?' selected':'')+'>Other Vehicle</option>';
}
function fillDrv(){
  var cur=el('driver').value,opts='<option value="">— Select driver —</option>'+DRV.map(function(d){return '<option'+(d.name===cur?' selected':'')+'>'+h(d.name)+'</option>';}).join('');
  var inList=DRV.some(function(d){return d.name===cur;});
  el('drvSel').innerHTML=opts+'<option value="__OTHER__"'+(cur&&!inList?' selected':'')+'>New Driver</option>';
}
function pickVeh(v){
  if(v==='__OTHER__'){el('regNo').value='';el('regNo').focus();return;}
  el('regNo').value=v;
  resetTripBoxes();
  onKey();
}
function pickDrv(n){
  if(n==='__OTHER__'){el('driver').value='';el('licExp').value='';el('licExp').readOnly=false;LIC_ALERTED='';applyLocks();el('driver').focus();return;}
  el('driver').value=n;
  var rec=DRV.find(function(x){return x.name===n;});
  if(rec){if(rec.mobile)el('mobile').value=rec.mobile;if(rec.licenseValid)el('licExp').value=rec.licenseValid;}
  gatePhoneLicense(true);
  rememberTrip();
}
function resetTripBoxes(){
  HAS_PRE=false;
  el('startTime').value=nowHrs();el('odoStart').value='';el('fromLoc').value='';el('toLoc').value='';el('purpose').value='';el('preBy').value='';el('preRemarks').value='';el('diesel').value='';
  el('endTime').value=nowDateHrs();el('odoEnd').value='';el('kmRun').value='';el('fuelQty').value='';el('fuelAmount').value='';el('returnLoc').value='';el('incident').value='';el('postBy').value='';el('postRemarks').value='';
  checkRows('preRows',PRE4W);checkRows('postRows',POST4W);
  applyLocks();
}
function onBranch(){setSecs();loadOpts(true);}
function onTrip(){resetTripBoxes();onKey();}
function onKey(){setSecs();rememberTrip();recallTrip();}
function loadOpts(thenRecall){
  var b=branchName();
  setSecs();
  if(!b){VEH=[];DRV=[];HAS_PRE=false;fillVeh();fillDrv();applyLocks();return;}
  fetch('/api/fleet/trip-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'options',branchId:b,date:el('date').value||istYmd()})}).then(function(r){return r.json();}).then(function(j){
    VEH=j.vehicles||[];DRV=j.drivers||[];
    if(j.nextTripCode){
      var parts=String(j.nextTripCode).split('/');
      NEXT_SEQ=parseInt(parts[1]||'1',10)||1;
    }
    paintTripCode(j.nextTripCode||'');
    fillVeh();fillDrv();
    if(thenRecall)recallTrip();
    else gatePhoneLicense(false);
  }).catch(function(){showMsg('Could not load vehicles / drivers.',false);});
}
function tripKm(){
  var s=parseFloat(String(el('odoStart').value).replace(/,/g,'')),e=parseFloat(String(el('odoEnd').value).replace(/,/g,''));
  if(!isNaN(s)&&!isNaN(e))el('kmRun').value=String(Math.round(e-s));
  else el('kmRun').value='';
}
function fillFrom(rec,kind){
  if(!rec)return;
  if(rec.riderName)el('driver').value=rec.riderName;
  if(rec.driverMobile)el('mobile').value=rec.driverMobile;
  if(rec.licenseValid)el('licExp').value=rec.licenseValid;
  if(kind==='pre-trip-4w'){
    if(rec.startTime)el('startTime').value=asHrs(rec.startTime);
    if(rec.dieselLevel)el('diesel').value=rec.dieselLevel;
    if(rec.odoStart)el('odoStart').value=rec.odoStart;
    if(rec.location)el('fromLoc').value=rec.location;
    if(rec.destination)el('toLoc').value=rec.destination;
    if(rec.purpose)el('purpose').value=rec.purpose;
    if(rec.checkedBy)el('preBy').value=rec.checkedBy;
    if(rec.tripRemarks)el('preRemarks').value=rec.tripRemarks;
    applyChecks('preRows',PRE4W,rec.items||[]);
  }else{
    if(rec.endTime)el('endTime').value=asEnd(rec.endTime);
    if(rec.odoEnd)el('odoEnd').value=rec.odoEnd;
    if(rec.fuelQty)el('fuelQty').value=rec.fuelQty;
    if(rec.fuelAmount)el('fuelAmount').value=rec.fuelAmount;
    if(rec.destination)el('returnLoc').value=rec.destination;
    if(rec.incident)el('incident').value=rec.incident;
    if(rec.checkedBy)el('postBy').value=rec.checkedBy;
    if(rec.tripRemarks)el('postRemarks').value=rec.tripRemarks;
    applyChecks('postRows',POST4W,rec.items||[]);
  }
  fillDrv();
  tripKm();
}
function recallTrip(){
  var b=branchName(),reg=el('regNo').value.trim(),dt=el('date').value,tn=el('tripNo').value||'1';
  rememberTrip();
  if(!b||!reg||!dt||RECALLING)return;
  RECALLING=true;
  fetch('/api/fleet/trip-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'recall',branchId:b,regNo:reg,date:dt,tripNo:tn})}).then(function(r){return r.json();}).then(function(j){
    RECALLING=false;
    if(!j||!j.ok)return;
    HAS_PRE=!!j.pre;
    if(j.pre){fillFrom(j.pre,'pre-trip-4w');showMsg('Trip '+tn+' Pre-Trip is saved (view only). Fill Post-Trip only. You do not type the trip code — pick the same Branch, Date, Vehicle and Trip no.',true);}
    if(j.post){fillFrom(j.post,'post-trip-4w');showMsg('Trip '+tn+' Pre-Trip is saved (view only). Post-Trip is also saved — you can update Post-Trip only.',true);}
    else if(!j.pre){showMsg('Trip '+tn+' — fill Pre-Trip now. Post-Trip can wait until after the trip.',true);}
    if(!el('odoStart').value&&j.lastCloseKm){el('odoStart').value=j.lastCloseKm;tripKm();}
    if(!el('odoStart').value){
      var veh=VEH.find(function(v){return v.regNo===reg;});
      if(veh&&veh.lastOdoReading)el('odoStart').value=veh.lastOdoReading;
    }
    if(!el('startTime').value)el('startTime').value=nowHrs();
    if(!el('endTime').value)el('endTime').value=nowDateHrs();
    var code=(j.pre&&j.pre.tripCode)||(j.post&&j.post.tripCode)||'';
    if(code)paintTripCode(code);
    tripKm();
    applyLocks();
    gatePhoneLicense(false);
  }).catch(function(){RECALLING=false;});
}
function saveKind(kind){
  tripKm();
  var rec={formType:kind,branchId:branchName(),date:el('date').value,regNo:el('regNo').value.trim(),riderName:el('driver').value.trim(),driverMobile:el('mobile').value.trim(),licenseValid:el('licExp').value,tripCode:el('tripCode').value,dieselLevel:el('diesel').value,shift:el('shift').value,tripNo:el('tripNo').value||'1',odoStart:el('odoStart').value,odoEnd:el('odoEnd').value,startTime:asHrs(el('startTime').value),endTime:asEnd(el('endTime').value),location:el('fromLoc').value.trim(),destination:kind==='pre-trip-4w'?el('toLoc').value.trim():el('returnLoc').value.trim(),purpose:el('purpose').value.trim(),kmRun:el('kmRun').value,fuelQty:el('fuelQty').value,fuelAmount:el('fuelAmount').value,incident:el('incident').value.trim(),tripRemarks:kind==='pre-trip-4w'?el('preRemarks').value:el('postRemarks').value,checkedBy:kind==='pre-trip-4w'?el('preBy').value.trim():el('postBy').value.trim(),items:readChecks(kind==='pre-trip-4w'?'preRows':'postRows',kind==='pre-trip-4w'?PRE4W:POST4W)};
  if(!rec.branchId){showMsg('Pick the branch.',false);return;}
  if(kind==='pre-trip-4w'&&HAS_PRE){showMsg('Pre-Trip already saved. You can see it, but you cannot change it. Fill Post-Trip only.',false);return;}
  var known=DRV.some(function(x){return x.name===rec.riderName;});
  if(!known&&!String(rec.licenseValid||'').trim()){showMsg('Enter the new driver name and license expiry date.',false);return;}
  if(gatePhoneLicense(true)){showMsg(licenseBlockMsg(rec.riderName),false);return;}
  if(!rec.date||!rec.regNo||!rec.riderName||!rec.checkedBy){showMsg('Fill date, vehicle, driver and Checked By.',false);return;}
  fetch('/api/fleet/trip-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save',branchId:rec.branchId,inspection:rec})}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});}).then(function(res){
    if(res.s!==200){showMsg(res.j.error||'Could not save.',false);return;}
    rememberTrip();
    if(res.j.tripCode){el('tripCode').value=res.j.tripCode;rec.tripCode=res.j.tripCode;}
    if(kind==='pre-trip-4w')HAS_PRE=true;
    applyLocks();
    showMsg((kind==='pre-trip-4w'?'Pre-Trip':'Post-Trip')+' saved — '+h(rec.tripCode||'')+' — '+h(rec.branchId)+' Trip '+h(rec.tripNo)+'.'+(res.j.emailSent?' Mail sent to HOD (Director and Control copied).':'')+(kind==='pre-trip-4w'?' Come back after this trip to fill Post-Trip. Pick the same Branch, Date, Vehicle and Trip no. You do not type the trip code. Next trip today? Choose Trip 2 or Trip 3.':' You can update Post-Trip and Save again.'),true);
    window.scrollTo(0,0);
  }).catch(function(){showMsg('Network error. Try again.',false);});
}
el('branch').innerHTML='<option value="">— Select branch —</option>'+BRANCHES.map(function(b){return '<option value="'+a(b)+'">'+h(b)+'</option>';}).join('');
el('date').value=today();
checkRows('preRows',PRE4W);checkRows('postRows',POST4W);
el('odoStart').addEventListener('input',tripKm);el('odoEnd').addEventListener('input',tripKm);
var mem=loadRemembered();
var start=matchBranch(qBranch())||matchBranch(mem.branch)||'';
if(start)el('branch').value=start;
if(mem.date)el('date').value=mem.date;
if(mem.tripNo)el('tripNo').value=mem.tripNo;
if(mem.shift)el('shift').value=mem.shift;
if(mem.regNo)el('regNo').value=mem.regNo;
if(mem.driver)el('driver').value=mem.driver;
if(mem.mobile)el('mobile').value=mem.mobile;
if(mem.licExp)el('licExp').value=mem.licExp;
if(mem.diesel)el('diesel').value=mem.diesel;
if(!el('startTime').value)el('startTime').value=nowHrs();
if(!el('endTime').value)el('endTime').value=nowDateHrs();
setSecs();
if(start)loadOpts(true);
else {fillVeh();fillDrv();}
</script></body></html>`

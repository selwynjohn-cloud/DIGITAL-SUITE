import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hodLoginHtml, otpLoginHtml, otpLoginScript } from '../_lib/embedded-otp.js'
import { FLEET_REPORT_CSS } from '../_lib/fleet/brand.js'
import { MASTER_DIRECTORY_MGMT_MENU_ITEM, OPEN_MASTER_DIRECTORY_JS } from '../_lib/master-directory.js'

function fleetPortal(req: VercelRequest): 'staff' | 'management' {
  return String(req.query?.portal ?? 'staff').trim() === 'management' ? 'management' : 'staff'
}

function fleetPage(portal: 'staff' | 'management') {
  const loginBlock =
    portal === 'management'
      ? otpLoginHtml('Agile Fleet', 'Management Portal — Director & Admin email sign in')
      : hodLoginHtml('Agile Fleet', 'HOD / Staff — select branch and enter your branch password')
  return PAGE.replace('__FLEET_LOGIN__', loginBlock).replace(
    '__FLEET_OTP_SCRIPT__',
    otpLoginScript('fleet', 'Agile Fleet', portal),
  )
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(fleetPage(fleetPortal(req)))
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Fleet — Vehicle Management</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:14px}
#login{max-width:380px;margin:0 auto;padding-top:12vh}
.card{background:#111a30;border:1px solid #22304f;border-radius:14px;padding:24px;margin-bottom:16px}
.card h2{color:#fff;margin-bottom:4px}
input,select,textarea{width:100%;padding:9px 11px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:14px}
label{display:block;font-size:12px;color:#94a3b8;margin:8px 0 3px;font-weight:700}
.btn{padding:11px 18px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:14px;background:#0ea5e9;color:#fff}
.gold{background:#c9a84c;color:#14224f}.grey{background:#334155;color:#e2e8f0}.green{background:#16a34a;color:#fff}.r{background:#dc2626;color:#fff}.amb{background:#d97706;color:#fff}
.msg{padding:10px;border-radius:8px;font-size:14px;margin-top:10px;display:none;background:#3a0a0a;color:#ef4444}
#shell{display:none;height:100vh}
.side{position:fixed;top:0;left:0;bottom:0;width:220px;background:#0e1730;border-right:1px solid #22304f;display:flex;flex-direction:column;overflow-y:auto}
.brand{padding:18px 16px;text-align:center;border-bottom:1px solid #22304f}.brand img{height:48px}.brand b{display:block;color:#fff;font-size:14px;margin-top:6px}.brand small{color:#38bdf8;font-size:11px}
.menu{padding:8px;flex:1}.mi{display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:9px;color:#cbd5e1;cursor:pointer;font-weight:600}.mi:hover{background:#16223f}.mi.active{background:#0ea5e9;color:#fff}
.logout{padding:12px 16px;border-top:1px solid #22304f;color:#94a3b8;cursor:pointer;font-size:13px}
.main{margin-left:220px;min-height:100vh}
.bar{background:#111a30;border-bottom:1px solid #22304f;padding:12px 18px;display:flex;justify-content:space-between;align-items:center}
.bar b{color:#fff;font-size:16px}.content{padding:18px}
.burger{display:none;background:#0ea5e9;color:#fff;border:none;border-radius:8px;padding:8px 12px;font-weight:800}
@media(max-width:820px){.side{transform:translateX(-100%);transition:.2s;z-index:50}.side.open{transform:none}.main{margin-left:0}.burger{display:inline-block}}
.kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}
.kpi{border-radius:12px;padding:16px;border:1px solid #22304f}.kpi b{font-size:26px;color:#fff;display:block}.kpi span{font-size:12px;color:#94a3b8}
.kpi.purple{background:linear-gradient(135deg,#312e81,#4338ca)}.kpi.teal{background:linear-gradient(135deg,#0369a1,#0ea5e9)}.kpi.blue{background:linear-gradient(135deg,#1e3a8a,#2563eb)}
.kpi.amber{background:linear-gradient(135deg,#92400e,#d97706)}.kpi.red{background:linear-gradient(135deg,#7f1d1d,#dc2626)}.kpi.green{background:linear-gradient(135deg,#14532d,#16a34a)}
.tblwrap{overflow-x:auto;border:1px solid #22304f;border-radius:8px}table{border-collapse:collapse;width:100%;font-size:13px;min-width:800px}
th,td{border:1px solid #22304f;padding:6px;text-align:left}th{background:#0b1220;color:#94a3b8;font-size:11px;text-transform:uppercase}
td input,td select{min-width:80px}
.subgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-bottom:16px}
.scard{border-radius:10px;padding:12px;border:1px solid #22304f}.scard.ok{background:#052e16;border-color:#166534}.scard.ng{background:#451a03;border-color:#92400e}
.scard b{font-size:14px;display:block}.scard.ok b{color:#4ade80}.scard.ng b{color:#fb923c}.scard small{color:#94a3b8;font-size:11px;display:block;margin-top:4px}
.savebar{position:sticky;bottom:0;background:#111a30;border-top:1px solid #22304f;padding:12px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.inactive{opacity:.45}
.alert{padding:10px 12px;border-radius:8px;margin-bottom:8px;font-size:13px;border-left:4px solid}
.alert.red{background:#3a0a0a;border-color:#ef4444;color:#fca5a5}.alert.amber{background:#451a03;border-color:#f59e0b;color:#fcd34d}.alert.green{background:#052e16;border-color:#4ade80;color:#86efac}
.vedit{background:#111a30;border:1px solid #0ea5e9;border-radius:12px;padding:16px;margin-top:12px}
.vedit h4{color:#38bdf8;margin-bottom:10px}
.miss{color:#f59e0b;font-size:11px}
.switch{position:relative;display:inline-block;width:46px;height:26px;vertical-align:middle}
.switch input{opacity:0;width:0;height:0;position:absolute}
.slider{position:absolute;cursor:pointer;inset:0;background:#334155;transition:.2s;border-radius:26px;border:1px solid #475569}
.slider:before{position:absolute;content:"";height:20px;width:20px;left:2px;bottom:2px;background:#94a3b8;transition:.2s;border-radius:50%}
.switch input:checked+.slider{background:#16a34a;border-color:#15803d}
.switch input:checked+.slider:before{transform:translateX(20px);background:#fff}
.switch-lbl{font-size:11px;color:#94a3b8;margin-left:6px;vertical-align:middle}
.badge-role{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700}
.badge-admin{background:#312e81;color:#c4b5fd}.badge-branch{background:#0369a1;color:#7dd3fc}
.row-actions{display:flex;flex-wrap:wrap;gap:4px}
.row-actions .btn{padding:4px 8px;font-size:11px}
.hidden{display:none!important}
.readonly-banner{background:#1e3a5f;border:1px solid #3b82f6;border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:12px;color:#93c5fd}
.email-preview{background:#e2e8f0;border:1px solid #cbd5e1;border-radius:12px;padding:12px;margin-top:12px;overflow:auto;max-height:78vh}
.email-preview .subj{font-size:12px;color:#64748b;margin-bottom:10px;padding:8px 10px;background:#f8fafc;border-radius:8px}
.preview-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.preview-tab{padding:10px 16px;border-radius:9px;border:1px solid #334155;background:#111a30;color:#cbd5e1;cursor:pointer;font-weight:700}
.preview-tab.active{background:#0ea5e9;color:#fff;border-color:#0ea5e9}
${FLEET_REPORT_CSS}
</style></head>
<body>
<p style="max-width:380px;margin:12px auto 0;padding:10px 14px;border-radius:10px;background:#0e1730;border:1px solid #0ea5e9;text-align:center;font-size:13px;color:#cbd5e1;line-height:1.5" id="fleetPortalHint">Branch HOD: white <b>HODs / Staff</b> button · Management: dark <b>Management</b> button on App 12.</p>
__FLEET_LOGIN__

<div id="shell">
  <div class="side" id="side">
    <div class="brand"><img src="https://www.agilegroup-digital.co.in/agile-logo.png"><b>Agile Fleet</b><small id="portalTag">Moving Forward</small></div>
    <div class="menu" id="menu"></div>
    <div class="logout" onclick="logout()">⎋ Logout</div>
  </div>
  <div class="main">
    <div class="bar"><div style="display:flex;align-items:center;gap:12px"><button class="burger" onclick="document.getElementById('side').classList.toggle('open')">☰</button><b id="ttl">Dashboard</b></div><span id="userLine" style="color:#94a3b8;font-size:12px">Agile Security Force</span></div>
    <div class="content" id="content"></div>
  </div>
</div>

<script>
__FLEET_OTP_SCRIPT__
var PORTAL='staff';
if(new URLSearchParams(location.search).get('portal')==='management'){OTP_ROLE='management';PORTAL='management';}
var V=[],D=[],R=[],I=[],U=[],EXP=-1,DR=-1,USR=-1,FLEET_MONTH='',FLEET_MBRANCH='ALL',FLEET_DASH_BRANCH='ALL',FLEET_ROLE='admin',FLEET_USER='',FLEET_BRANCH='',ENT=[],CUR=0;
var STAFF_MENU=[{n:'Dashboard',fn:'branchDash',icon:'📊'},{n:'Weekly Reports',fn:'reports',icon:'📁'},{n:'Submit Weekly Report',fn:'weeklyReportStaff',icon:'📋'},{n:'Monthly Data',fn:'monthly',icon:'📅'},{n:'Vehicle Data',fn:'branchVehicles',icon:'🚗'},{n:'Drivers Data',fn:'drivers',icon:'👤'},{n:'Documents Validity',fn:'docs',icon:'📄'},{n:'Daily Pre Trip',fn:'pretrip',icon:'✅'},{n:'Daily Post Trip',fn:'posttrip',icon:'🏁'},{n:'User Manual & Troubleshooting',fn:'staffHelp',icon:'📖'}];
var MGMT_MENU=[{n:'Dashboard',fn:'dash',icon:'📊'},{n:'Weekly Reports',fn:'reports',icon:'📁'},{n:'Letter Previews',fn:'letterPreviews',icon:'✉️'},{n:'Drivers Data',fn:'drivers',icon:'👤'},{n:'Vehicle Data',fn:'vehicles',icon:'🚗'},${JSON.stringify(MASTER_DIRECTORY_MGMT_MENU_ITEM)},{n:'User Management',fn:'users',icon:'👥'},{n:'User Manual',fn:'fleetManual',icon:'📖'},{n:'Troubleshooting',fn:'fleetTroubleshooting',icon:'🔧'}];
var FLEET_PREVIEW_TAB='hod',FLEET_PREVIEW_WEEK='';
var BRANCHES=['Visakhapatnam','Nellore','Bangalore','Gulbarga','Hyderabad','Kakinada','Vijayawada','Chennai','Mumbai','Corporate Office'];
var VTYPES=['4-Wheeler','2-Wheeler','EV'];var FTYPES=['Diesel','Petrol','Electric','CNG'];
var PRE4W=${JSON.stringify([
  'Tyre Condition – Front Left','Tyre Condition – Front Right','Tyre Condition – Rear Left','Tyre Condition – Rear Right',
  'Tyre Pressure (All 4 + Spare)','Spare Tyre Availability','Jack & Tool Kit','Body Damage / Dents','Windshield & Glass',
  'Wiper Blades','Mirrors – ORVM & IRVM','Number Plates','Headlights','Tail / Brake Lights','Indicators','Reverse Light',
  'Horn','Engine Oil Level','Coolant Level','Brake Fluid','Seat Belts','Fire Extinguisher','First Aid Kit','Documents (RC/Insurance/PUC)','Vehicle Cleanliness'
])};
var POST4W=${JSON.stringify([
  'Trip End Odometer Recorded','Fuel / Battery Level After Trip','New Damage or Dents Noticed','Tyre Condition After Trip',
  'Lights & Indicators Working','Brakes Responsive After Trip','Windshield & Mirrors Clear','Interior Cleanliness',
  'Documents in Vehicle (RC/Insurance/PUC)','Fire Extinguisher & First Aid Present','Keys & Vehicle Secured',
  'Any Incident During Trip','Vehicle Parked Safely','Post-Trip Cleanliness','Rider Fit to Drive (Return)'
])};
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function nid(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
var BR_ABBR={'Visakhapatnam':'VSK','Nellore':'NEL','Bangalore':'BLR','Gulbarga':'GLB','Hyderabad':'HYD','Kakinada':'KKD','Vijayawada':'VJA','Chennai':'CHN','Mumbai':'MUM','Corporate Office':'CO'};
function reportCode(branch,weekNo,id){var ab=BR_ABBR[branch]||(branch||'').slice(0,3).toUpperCase();var wk=String(weekNo||'').replace(/^Week-?/i,'');var tail=(id||nid('')).slice(-4).toUpperCase();return 'WR-'+ab+'-'+new Date().getFullYear()+'-W'+wk+'-'+tail;}
function api(action,extra){return fetch('/api/fleet/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,branchId:FLEET_BRANCH||''},extra||{}))}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});}
${OPEN_MASTER_DIRECTORY_JS}
function weekNo(){var d=new Date();var x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));var day=x.getUTCDay()||7;x.setUTCDate(x.getUTCDate()+4-day);var ys=new Date(Date.UTC(x.getUTCFullYear(),0,1));return 'Week-'+Math.ceil(((x-ys)/86400000+1)/7);}
function daysLeft(dt){if(!dt)return 999;var t=Math.ceil((new Date(dt)-new Date())/86400000);return t;}
function fuelEff(km,qty){var q=parseFloat(String(qty).replace(/,/g,''));if(!q||!km)return null;return Math.round(km/q*10)/10;}
function vehTemplate(){return {id:nid('vh'),branchId:FLEET_BRANCH||'Hyderabad',vehicleName:'',regNo:'',chassisNo:'',engineNo:'',vehicleType:'4-Wheeler',makeModel:'',manufacturer:'',fuelType:'Diesel',driverName:'',driverMobile:'',licenseNo:'',licenseValid:'',insuranceValid:'',insuranceIssueDate:'',insurancePolicyNo:'',insuranceCompany:'',insuranceClaim:'',pucValid:'',pucIssueDate:'',dateOfPurchase:'',tyresCondition:'Good',batteryCondition:'Good',vehicleCondition:'Good',damageNote:'',lastServiceDate:'',nextServiceDue:'',nextServiceKm:'',lastOdoReading:'',majorAccident:'',deactivateReason:'',active:true,remarks:'',createdAt:new Date().toISOString()};}
function drTemplate(){return {id:nid('dr'),branchId:FLEET_BRANCH||'Hyderabad',name:'',mobile:'',licenseNo:'',licenseIssueDate:'',licenseValid:'',licenseType:'LMV',medicalFitness:'',trafficPenaltyWeek:'',badgeNo:'',active:true,deactivateReason:'',remarks:'',createdAt:new Date().toISOString()};}
function missingFields(v){var m=[];if(!v.regNo)m.push('Reg No');if(!v.chassisNo)m.push('Chassis');if(!v.insuranceValid)m.push('Insurance');if(!v.pucValid&&v.vehicleType!=='EV')m.push('PUC');return m;}
function reportHdr(title,sub,badge){return '<div class="rpt-sheet"><div class="rpt-hdr"><div class="rpt-gold-bar"></div><img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile"><div class="rpt-co">AGILE SECURITY FORCE PRIVATE LIMITED</div><h2 class="rpt-title">'+h(title)+'</h2>'+(sub?'<p class="rpt-sub">'+sub+'</p>':'')+(badge?'<div class="rpt-badge">'+badge+'</div>':'')+'</div>';}
function reportFtr(){return '<div class="rpt-ftr"><div class="rpt-gold-bar"></div><p><b>Agile Fleet</b> — Vehicle Management System</p><p><a href="https://www.agilegroup.co.in" style="color:#7dd3fc;text-decoration:none">www.agilegroup.co.in</a> Created by Cursor.AI</p><p class="rpt-copy">© Agile Security Force Private Limited · Confidential</p></div>';}
function reportSec(lbl){return '<div class="rpt-sec"><span>'+h(lbl)+'</span></div>';}
function reportWrap(title,sub,badge,body){return reportHdr(title,sub,badge)+'<div class="rpt-body">'+body+'</div>'+reportFtr()+'</div>';}
function withFooter(html){return html+reportFtr();}
function portalBadge(){return PORTAL==='staff'?(FLEET_BRANCH?h(FLEET_BRANCH)+' · Branch Portal':'Branch Portal'):'Management Portal';}
function branchVehiclesList(){if(PORTAL==='staff'&&FLEET_BRANCH)return V.filter(function(v){return v.branchId===FLEET_BRANCH&&v.active!==false;});return V;}
function branchDriversList(){if(PORTAL==='staff'&&FLEET_BRANCH)return D.filter(function(d){return d.branchId===FLEET_BRANCH&&d.active!==false;});return D;}

function savebar(btn,fn){return '<div class="savebar"><button class="btn green" id="'+btn+'" onclick="'+fn+'()">💾 Save All</button></div>';}
function activeMenu(){return PORTAL==='staff'?STAFF_MENU:MGMT_MENU;}
function buildMenu(){var menu=activeMenu();el('menu').innerHTML=menu.map(function(m,i){return '<div class="mi'+(CUR===i?' active':'')+'" id="m'+i+'" onclick="tab('+i+')"><span>'+m.icon+'</span>'+h(m.n)+'</div>';}).join('');if(el('portalTag'))el('portalTag').textContent=PORTAL==='staff'?'Branch Portal':'Management';}
function weekRange(){var d=new Date();var wd=(d.getDay()+6)%7;d.setDate(d.getDate()-wd);var f=d.toISOString().slice(0,10);d.setDate(d.getDate()+6);return {from:f,to:d.toISOString().slice(0,10)};}
function currentWeekReport(){var wk=weekNo();return R.find(function(x){return x.active&&x.weekNo===wk&&x.branchId===FLEET_BRANCH;});}
function applyLogin(res){
  FLEET_ROLE=res.j.role||'admin';
  FLEET_BRANCH=res.j.branch||res.j.lockedBranch||'';
  if(res.j.fleetBranches&&res.j.fleetBranches.length) BRANCHES=res.j.fleetBranches.slice();
  FLEET_USER=(res.j.name||res.j.email||'')+' · '+(FLEET_BRANCH||'Management');
  if(el('userLine')) el('userLine').textContent=FLEET_USER;
  if(FLEET_ROLE==='branch'&&PORTAL==='management'){
    el('login').style.display='none';el('shell').style.display='block';
    el('content').innerHTML='<div class="card" style="margin-top:20px"><h2 style="color:#fff">Management portal only</h2><p style="color:#94a3b8;margin:12px 0">Your branch: <b>'+h(FLEET_BRANCH)+'</b>. Use the <b>Staff / HOD</b> button on Command Centre.</p><p style="margin-top:14px"><a class="btn" href="/fleets?portal=staff" style="text-decoration:none;display:inline-block">Open Branch Portal</a></p></div>';
    return;
  }
  if(FLEET_ROLE==='admin'&&PORTAL==='staff'){PORTAL='management';OTP_ROLE='management';}
  V=(res.j.vehicles||[]).map(function(v){v.vehicleName=v.vehicleName||v.makeModel||'';v.makeModel=v.makeModel||v.vehicleName||'';return v;});
  D=res.j.drivers||[];R=res.j.reports||[];I=res.j.inspections||[];U=res.j.users||[];
  if(FLEET_ROLE==='branch'&&FLEET_BRANCH){
    I=I.filter(function(x){return x.branchId===FLEET_BRANCH;});
    FLEET_DASH_BRANCH=FLEET_BRANCH;
  }
  el('login').style.display='none';el('shell').style.display='block';buildMenu();tab(0);
}
function onOtpLogin(j){api('login').then(function(res){if(res.s!==200){otpMsg(res.j.error||'Could not sign in.',false);return;}applyLogin(res);}).catch(function(){otpMsg('Network error. Please try again.',false);});}
function logout(){otpLogout();}
function tab(i){CUR=i;var menu=activeMenu();buildMenu();el('ttl').textContent=menu[i].n;el('side').classList.remove('open');window[menu[i].fn]();}

function fmtRs(n){return '₹'+(n||0).toLocaleString('en-IN',{maximumFractionDigits:0});}
function fmtL(n){return (n||0).toLocaleString('en-IN',{maximumFractionDigits:1})+' L';}
function entryFuelType(e){if(e.fuelType)return e.fuelType;var q=String(e.fuelQty||'').toLowerCase();if(q.indexOf('electric')>=0||q.indexOf('ev')>=0)return 'Electric';return 'Diesel';}
function addStats(s,e){
  var ft=entryFuelType(e),km=Number(e.kmWeek)||0,lit=Number(e.fuelLiters)||parseFloat(String(e.fuelQty||'').replace(/,/g,''))||0;
  if(ft==='Electric')lit=0;
  var fc=Number(e.fuelCost)||parseFloat(String(e.fuelAmount||'').replace(/,/g,''))||0;
  var card=Number(e.fuelCardCharged)||0;
  var evC=ft==='Electric'?(Number(e.evChargeCost)||fc):Number(e.evChargeCost)||0;
  var evK=parseFloat(String(e.evChargeKwh||'').replace(/,/g,''))||0;
  var maint=Number(e.maintenanceCostNum)||parseFloat(String(e.maintenanceCost||'').replace(/,/g,''))||0;
  if(String(e.maintenanceCost||'').toLowerCase()==='nil')maint=0;
  var o={km:s.km+km,dieselL:s.dieselL,petrolL:s.petrolL,cngL:s.cngL,fuelCost:s.fuelCost,fuelCard:s.fuelCard,evCharge:s.evCharge,evKwh:s.evKwh,maintenance:s.maintenance,vehicles:s.vehicles+1,evCount:s.evCount};
  if(ft==='Electric'){o.evCount++;o.evCharge+=evC||fc;o.evKwh+=evK;o.fuelCost+=fc;o.fuelCard+=card;}
  else if(ft==='Petrol'){o.petrolL+=lit;o.fuelCost+=fc;o.fuelCard+=card;}
  else if(ft==='CNG'){o.cngL+=lit;o.fuelCost+=fc;o.fuelCard+=card;}
  else{o.dieselL+=lit;o.fuelCost+=fc;o.fuelCard+=card;}
  o.maintenance+=maint;return o;
}
function emptyStats(){return {km:0,dieselL:0,petrolL:0,cngL:0,fuelCost:0,fuelCard:0,evCharge:0,evKwh:0,maintenance:0,vehicles:0,evCount:0};}
function avgMil(s){var l=s.dieselL+s.petrolL;return l&&s.km?Math.round(s.km/l*10)/10:null;}
function evEff(s){return s.evKwh&&s.km&&s.evCount?Math.round(s.km/s.evKwh*10)/10:null;}
function aggregateWeek(wk){
  var byId={};R.filter(function(x){return x.active&&x.weekNo===wk;}).forEach(function(x){byId[x.branchId]=x;});
  var total=emptyStats(),rows=[];
  BRANCHES.forEach(function(b){
    var s=emptyStats(),r=byId[b];
    if(r){r.entries.forEach(function(e){s=addStats(s,e);});}
    rows.push({branchId:b,reported:!!r,submittedBy:r?r.submittedBy:'',stats:s});
  });
  R.filter(function(x){return x.active&&x.weekNo===wk;}).forEach(function(x){x.entries.forEach(function(e){total=addStats(total,e);});});
  return {total:total,rows:rows};
}
function statRow(lbl,s,extra){
  extra=extra||'';
  return '<tr><td><b>'+h(lbl)+'</b></td><td>'+s.km.toLocaleString('en-IN')+' km</td><td>'+fmtL(s.dieselL)+'</td><td>'+fmtL(s.petrolL)+'</td><td>'+fmtRs(s.fuelCost)+'</td><td>'+fmtRs(s.fuelCard)+'</td><td>'+fmtRs(s.maintenance)+'</td><td>'+(avgMil(s)||'—')+'</td><td>'+(s.evCount?s.evCount+' · '+fmtRs(s.evCharge):'—')+'</td><td>'+(evEff(s)||'—')+extra+'</td></tr>';
}

function dashInsights(fb){
  var wk=weekNo(),tips=[],totalPen=0,lowEff=[],badCond=[];
  R.filter(function(x){return x.active&&x.weekNo===wk&&(fb==='ALL'||x.branchId===fb);}).forEach(function(r){
    r.entries.forEach(function(e){
      totalPen+=parseFloat(String(e.trafficPenaltyRs||'').replace(/,/g,''))||0;
      var km=Number(e.kmWeek)||0,lit=parseFloat(String(e.fuelQty||e.fuelLiters||'').replace(/,/g,''))||0;
      if(lit&&km){var mil=Math.round(km/lit*10)/10;if(mil<8)lowEff.push(h(e.regNo)+' ('+mil+' km/L)');}
      if(e.condition&&String(e.condition).toLowerCase()!=='good')badCond.push(h(e.regNo)+' — '+h(e.condition));
    });
  });
  if(fb!=='ALL'&&!R.find(function(x){return x.active&&x.weekNo===wk&&x.branchId===fb;}))tips.push('⚠ <b>Weekly report not submitted</b> for '+wk+' — due every Saturday before 5:00 PM.');
  if(totalPen>0)tips.push('Traffic penalties this week: <b>'+fmtRs(totalPen)+'</b> — follow up with drivers.');
  if(lowEff.length)tips.push('Low fuel efficiency: '+lowEff.join(', ')+'.');
  if(badCond.length)tips.push('Vehicle condition alert: '+badCond.join('; ')+'.');
  V.filter(function(v){return v.active&&(fb==='ALL'||v.branchId===fb);}).forEach(function(v){
    [{t:'Insurance',d:v.insuranceValid},{t:'PUC',d:v.pucValid}].forEach(function(c){
      if(c.d&&daysLeft(c.d)<=30)tips.push('Renewal: <b>'+h(v.regNo)+'</b> — '+c.t+' expires '+h(c.d)+' ('+daysLeft(c.d)+' days).');
    });
  });
  D.filter(function(d){return d.active&&(fb==='ALL'||d.branchId===fb);}).forEach(function(d){
    if(d.licenseValid&&daysLeft(d.licenseValid)<=30)tips.push('Driver licence: <b>'+h(d.name)+'</b> expires '+h(d.licenseValid)+' ('+daysLeft(d.licenseValid)+' days).');
  });
  if(!tips.length)tips.push('✓ No critical alerts — fleet operating normally this week.');
  return tips;
}
function condBadge(c){var cl=String(c||'Good').toLowerCase();var cls=cl==='good'?'cond-good':(cl==='fair'?'cond-fair':'cond-bad');return '<span class="'+cls+'">'+h(c||'Good')+'</span>';}
function penBadge(p){var n=parseFloat(String(p||'').replace(/,/g,''))||0;if(!n)return '—';return '<span class="pen-amt">'+fmtRs(n)+'</span>';}
function renderFleetDashboard(fb,showPicker){
  var wk=weekNo(),branchList=fb==='ALL'?BRANCHES:[fb];
  var reported={};
  R.filter(function(x){return x.active&&x.weekNo===wk&&(fb==='ALL'||x.branchId===fb);}).forEach(function(x){reported[x.branchId]=x;});
  var submitted=Object.keys(reported).length,pending=branchList.length-submitted;
  var total=emptyStats();
  R.filter(function(x){return x.active&&x.weekNo===wk&&(fb==='ALL'||x.branchId===fb);}).forEach(function(x){x.entries.forEach(function(e){total=addStats(total,e);});});
  var renewals=[];
  V.filter(function(v){return v.active&&(fb==='ALL'||v.branchId===fb);}).forEach(function(v){
    [{t:'Insurance',d:v.insuranceValid},{t:'PUC',d:v.pucValid}].forEach(function(c){
      if(c.d){var dl=daysLeft(c.d);if(dl<=60)renewals.push({reg:v.regNo,branch:v.branchId,driver:'',type:c.t,date:c.d,days:dl});}
    });
    if(v.nextServiceDue){var sd=daysLeft(v.nextServiceDue);if(sd<=60)renewals.push({reg:v.regNo,branch:v.branchId,driver:'',type:'Service Due',date:v.nextServiceDue,days:sd});}
  });
  D.filter(function(d){return d.active&&(fb==='ALL'||d.branchId===fb);}).forEach(function(d){
    if(d.licenseValid){var dl=daysLeft(d.licenseValid);if(dl<=60)renewals.push({reg:'—',branch:d.branchId,driver:d.name,type:'Driver License',date:d.licenseValid,days:dl});}
    if(d.medicalFitness){var md=daysLeft(d.medicalFitness);if(md<=60)renewals.push({reg:'—',branch:d.branchId,driver:d.name,type:'Medical Fitness',date:d.medicalFitness,days:md});}
  });
  renewals.sort(function(a,b){return a.days-b.days;});
  var tips=dashInsights(fb);
  var tipHtml='<div class="card" style="margin-bottom:12px;border-left:4px solid #0ea5e9"><b style="color:#7dd3fc">🤖 Smart Fleet Analysis — '+wk+'</b><ul style="margin:10px 0 0 18px;color:#94a3b8;font-size:13px">'+tips.map(function(t){return '<li style="margin:6px 0">'+t+'</li>';}).join('')+'</ul></div>';
  var cards=branchList.map(function(b){var ok=reported[b];return '<div class="scard '+(ok?'ok':'ng')+'"><b>'+(ok?'✓ ':'⚠ ')+h(b)+'</b><small>'+(ok?'Report received — '+h(reported[b].submittedBy||''):'Due Sat before 5 PM')+'</small></div>';}).join('');
  var renRows=renewals.slice(0,12).map(function(r){
    var cls=r.days<0?'red':r.days<30?'amber':'green';
    return '<div class="alert '+cls+'"><b>'+h(r.regNo)+'</b> ('+h(r.branch)+') — '+h(r.type)+' · '+h(r.date)+' · <b>'+r.days+' days</b>'+(r.driver?' · '+h(r.driver):'')+'</div>';
  }).join('');
  var vehRows='',totalPen=0,badCond=0;
  R.filter(function(x){return x.active&&x.weekNo===wk&&(fb==='ALL'||x.branchId===fb);}).forEach(function(r){
    r.entries.forEach(function(e){
      var km=Number(e.kmWeek)||0,lit=parseFloat(String(e.fuelQty||e.fuelLiters).replace(/,/g,''))||0;
      var mil=lit&&km?Math.round(km/lit*10)/10:'—';
      var pen=parseFloat(String(e.trafficPenaltyRs||'').replace(/,/g,''))||0;
      totalPen+=pen;
      if(e.condition&&String(e.condition).toLowerCase()!=='good')badCond++;
      vehRows+='<tr><td>'+(fb==='ALL'?h(r.branchId):'')+'</td><td><b>'+h(e.regNo)+'</b></td><td>'+h(e.driverName||'—')+'</td><td>'+km+' km</td><td>'+fmtRs(parseFloat(String(e.fuelAmount||e.fuelCost).replace(/,/g,''))||0)+'</td><td>'+condBadge(e.condition)+'</td><td>'+penBadge(e.trafficPenaltyRs)+'</td><td>'+mil+(mil!=='—'?' km/L':'')+'</td></tr>';
    });
  });
  var picker='<div class="card" style="margin-bottom:12px"><label>View Branch</label><select id="dashBranchSel" onchange="FLEET_DASH_BRANCH=this.value;'+(showPicker?'dash':'branchDash')+'()">'+['ALL'].concat(BRANCHES).map(function(b){return '<option value="'+b+'"'+(b===fb?' selected':'')+'>'+(b==='ALL'?'All Branches (Consolidated)':b)+'</option>';}).join('')+'</select></div>';
  var title=fb==='ALL'?'All Branches Dashboard':'Branch Dashboard — '+h(fb);
  var body=picker+tipHtml+
    '<div class="kgrid">'+
    kpi(submitted,'Reports Received','purple')+kpi(pending,'Pending','red')+kpi(V.filter(function(x){return x.active&&(fb==='ALL'||x.branchId===fb);}).length,'Vehicles','teal')+
    kpi(total.km.toLocaleString('en-IN')+' km','KM This Week','blue')+kpi(fmtRs(total.fuelCost+total.evCharge),'Fuel + EV','amber')+
    kpi(fmtRs(total.maintenance),'Maintenance','red')+kpi(avgMil(total)||'—','Avg km/L','green')+
    kpi(badCond,'Vehicle Condition Alerts','red')+kpi(fmtRs(totalPen),'Traffic Penalties ₹','amber')+
    kpi(renewals.length,'Renewal Alerts','purple')+
    '</div>'+
    reportSec('Weekly Vehicle Summary — '+wk)+
    '<div class="card"><b style="color:#fff">'+title+'</b>'+
    '<p style="color:#94a3b8;font-size:12px;margin:8px 0">Fuel efficiency, vehicle condition, traffic penalties, renewal alerts — choose all branches or one branch from the dropdown.</p>'+
    '<div class="tblwrap wr-tbl-wrap" style="margin-top:8px"><table class="wr-tbl"><thead><tr>'+(fb==='ALL'?'<th>Branch</th>':'')+'<th>Reg No</th><th>Driver</th><th>KM</th><th>Fuel ₹</th><th>Condition</th><th>Traffic Penalty ₹</th><th>Mileage km/L</th></tr></thead><tbody>'+(vehRows||'<tr><td colspan="'+(fb==='ALL'?8:7)+'" style="color:#64748b">No weekly report data yet.</td></tr>')+'</tbody></table></div></div>'+
    (reportSec('Submission Status — '+wk)+'<div class="card"><div class="subgrid" style="margin-top:4px">'+cards+'</div></div>')+
    (renRows?reportSec('Renewal Alerts')+'<div class="card">'+renRows+'</div>':'');
  el('content').innerHTML=reportWrap(showPicker?'Fleet Dashboard':'Branch Fleet Dashboard',wk+(fb!=='ALL'?' · '+h(fb):' · All Branches'),portalBadge(),body);
}
function dash(){renderFleetDashboard(FLEET_DASH_BRANCH,true);}
function branchDash(){renderFleetDashboard(FLEET_DASH_BRANCH,true);}
function kpi(v,l,c){return '<div class="kpi '+c+'"><b>'+v+'</b><span>'+l+'</span></div>';}

function vehicles(){
  var rows=V.map(function(v,i){
    var miss=missingFields(v);
    return '<tr class="'+(v.active?'':'inactive')+'"><td>'+h(v.branchId)+'</td><td><b>'+h(v.regNo)+'</b>'+(miss.length?'<br><span class="miss">Missing: '+miss.join(', ')+'</span>':'')+'</td><td>'+h(v.vehicleName||v.makeModel)+'</td><td>'+h(v.chassisNo||'—')+'</td><td>'+(v.active?'<span style="color:#4ade80">Active</span>':'<span style="color:#f59e0b">Inactive</span>')+'</td><td><div class="row-actions"><button class="btn grey" onclick="EXP='+i+';vehicles()">Edit</button>'+(v.active?'<button class="btn amb" onclick="deactVeh('+i+')">Deactivate</button>':'<button class="btn green" onclick="reactVeh('+i+')">Reactivate</button>')+'<button class="btn r" onclick="delVeh('+i+')">Delete</button></div></td></tr>';
  }).join('');
  var ed='';
  if(EXP>=0&&V[EXP]){
    var v=V[EXP],i=EXP;
    ed='<div class="vedit"><h4>Edit Vehicle — '+h(v.regNo||'New')+'</h4><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">'+
      vsel('Branch',i,'branchId',BRANCHES)+vinp('Vehicle Name',i,'vehicleName')+vinp('Reg No.',i,'regNo')+vinp('Chassis No.',i,'chassisNo')+vinp('Engine No.',i,'engineNo')+
      vsel('Type',i,'vehicleType',VTYPES)+vinp('Make/Model',i,'makeModel')+vsel('Fuel',i,'fuelType',FTYPES)+
      vinpd('Insurance Valid',i,'insuranceValid')+vinpd('Insurance Issued',i,'insuranceIssueDate')+vinp('Insurance Policy No.',i,'insurancePolicyNo')+vinp('Insurance Company',i,'insuranceCompany')+
      vinpd('PUC Valid',i,'pucValid')+vinpd('PUC Issued',i,'pucIssueDate')+vinpd('Date of Purchase',i,'dateOfPurchase')+
      vinpd('Last Service',i,'lastServiceDate')+vinpd('Next Service Due',i,'nextServiceDue')+vinp('Next Service KM',i,'nextServiceKm')+vinp('Last Odo (km)',i,'lastOdoReading')+
      vinp('Tyres Condition',i,'tyresCondition')+vinp('Battery Condition',i,'batteryCondition')+vinp('Vehicle Condition',i,'vehicleCondition')+vinp('Damage Note',i,'damageNote')+
      '</div><div style="margin-top:10px"><label>Insurance Claim (if any)</label><textarea rows="2" oninput="V['+i+'].insuranceClaim=this.value">'+h(v.insuranceClaim)+'</textarea></div>'+
      '<div style="margin-top:8px"><label>Major Accident Detail</label><textarea rows="2" oninput="V['+i+'].majorAccident=this.value">'+h(v.majorAccident)+'</textarea></div>'+
      '<div style="margin-top:8px"><label>Remarks</label><textarea rows="2" oninput="V['+i+'].remarks=this.value">'+h(v.remarks)+'</textarea></div>'+
      '<div style="margin-top:8px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><label style="margin:0"><input type="checkbox" '+(v.active?'checked':'')+' onchange="V['+i+'].active=this.checked;if(!this.checked&&!V['+i+'].deactivateReason)V['+i+'].deactivateReason=\\'Sold\\';vehicles()"> Active</label>'+
      (v.active?'':vinp('Deactivate Reason (e.g. Sold)',i,'deactivateReason'))+
      '<button class="btn" onclick="EXP=-1;vehicles()">Close</button></div></div>';
  }
  el('content').innerHTML=withFooter('<div class="card"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px"><b style="color:#fff">Vehicle Details — All Branches (Management only)</b><button class="btn grey" onclick="V.push(vehTemplate());EXP=V.length-1;vehicles()">+ Add Vehicle</button></div>'+
    '<p style="color:#94a3b8;font-size:12px;margin-bottom:8px">Maintain all vehicle master data here. Branches view their vehicles in HOD portal (read-only).</p>'+
    '<div class="tblwrap"><table><thead><tr><th>Branch</th><th>Reg No.</th><th>Name</th><th>Chassis</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+ed+'</div>'+savebar('sv','saveVeh'));
}
function deactVeh(i){var r=prompt('Reason for deactivation (e.g. Sold, Written Off):',V[i].deactivateReason||'Sold');if(r===null)return;V[i].active=false;V[i].deactivateReason=r;EXP=-1;vehicles();}
function reactVeh(i){V[i].active=true;V[i].deactivateReason='';vehicles();}
function delVeh(i){if(!confirm('Remove vehicle '+V[i].regNo+' from fleet records?'))return;V.splice(i,1);EXP=-1;vehicles();}
function vinpd(lbl,i,k){return '<div><label>'+lbl+'</label><input type="date" value="'+a(V[i][k])+'" oninput="V['+i+'][\\''+k+'\\']=this.value"></div>';}
function vinp(lbl,i,k){return '<div><label>'+lbl+'</label><input value="'+a(V[i][k])+'" oninput="V['+i+'][\\''+k+'\\']=this.value"></div>';}
function vsel(lbl,i,k,arr){return '<div><label>'+lbl+'</label><select onchange="V['+i+'][\\''+k+'\\']=this.value">'+arr.map(function(o){return '<option'+(o===V[i][k]?' selected':'')+'>'+h(o)+'</option>';}).join('')+'</select></div>';}
function addVeh(){V.push(vehTemplate());EXP=V.length-1;vehicles();}
function saveVeh(){api('saveVehicles',{vehicles:V}).then(function(res){alert(res.s===200?'Saved ('+res.j.count+' vehicles)':(res.j.error||'Error'));});}

function drivers(){
  var staffView=PORTAL==='staff';
  var list=branchDriversList();
  var rows=list.map(function(d,i){
    var realIdx=staffView?D.indexOf(d):i;
    var dl=d.licenseValid?daysLeft(d.licenseValid):999;
    var licBadge=dl<0?'<span style="color:#ef4444">Expired</span>':dl<60?'<span style="color:#f59e0b">'+dl+'d</span>':'<span style="color:#4ade80">OK</span>';
    return staffView
      ? '<tr><td><b>'+h(d.name)+'</b></td><td>'+h(d.mobile)+'</td><td>'+h(d.licenseNo)+'</td><td>'+h(d.licenseValid)+' '+licBadge+'</td><td>'+h(d.licenseType||'LMV')+'</td><td>'+h(d.medicalFitness||'—')+'</td><td>'+h(d.trafficPenaltyWeek||'—')+'</td></tr>'
      : '<tr class="'+(d.active?'':'inactive')+'"><td>'+h(d.branchId)+'</td><td><b>'+h(d.name)+'</b></td><td>'+h(d.mobile)+'</td><td>'+h(d.licenseNo)+'</td><td>'+h(d.licenseValid)+' '+licBadge+'</td><td>'+h(d.licenseType||'LMV')+'</td><td style="text-align:center">'+(d.active?'Yes':'No')+'</td><td><div class="row-actions"><button class="btn grey" onclick="DR='+realIdx+';drivers()">Edit</button>'+(d.active?'<button class="btn amb" onclick="deactDr('+realIdx+')">Deactivate</button>':'<button class="btn green" onclick="reactDr('+realIdx+')">Reactivate</button>')+'<button class="btn r" onclick="delDr('+realIdx+')">Delete</button></div></td></tr>';
  }).join('');
  if(staffView){
    el('content').innerHTML=withFooter('<div class="readonly-banner">📌 Driver records are maintained in the <b>Management Portal</b> only. Contact management to add, edit, or deactivate drivers.</div>'+
      '<div class="card"><b style="color:#fff">Drivers Data — '+h(FLEET_BRANCH)+' (View Only)</b>'+
      '<p style="color:#94a3b8;font-size:12px;margin:8px 0">Drivers for your branch from Management master data. In Weekly Report, pick the driver for each vehicle based on weekly availability (especially Corporate Office).</p>'+
      '<div class="tblwrap"><table><thead><tr><th>Name</th><th>Mobile</th><th>License</th><th>Valid Upto</th><th>Type</th><th>Medical</th><th>Penalty ₹</th></tr></thead><tbody>'+
      (rows||'<tr><td colspan="7" style="color:#64748b;text-align:center">No drivers yet — ask management to add drivers in Management Portal.</td></tr>')+'</tbody></table></div></div>');
    return;
  }
  var ed='';
  if(DR>=0&&D[DR]){
    var d=D[DR],i=DR;
    ed='<div class="vedit"><h4>Edit Driver — '+h(d.name||'New')+'</h4><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">'+
      '<div><label>Branch</label><select onchange="D['+i+'].branchId=this.value">'+BRANCHES.map(function(b){return '<option'+(b===d.branchId?' selected':'')+'>'+h(b)+'</option>';}).join('')+'</select></div>'+
      '<div><label>Full Name</label><input value="'+a(d.name)+'" oninput="D['+i+'].name=this.value"></div>'+
      '<div><label>Mobile</label><input value="'+a(d.mobile)+'" oninput="D['+i+'].mobile=this.value"></div>'+
      '<div><label>License No.</label><input value="'+a(d.licenseNo)+'" oninput="D['+i+'].licenseNo=this.value"></div>'+
      '<div><label>Date of Issue</label><input type="date" value="'+a(d.licenseIssueDate)+'" oninput="D['+i+'].licenseIssueDate=this.value"></div>'+
      '<div><label>Valid Upto</label><input type="date" value="'+a(d.licenseValid)+'" oninput="D['+i+'].licenseValid=this.value"></div>'+
      '<div><label>License Type</label><input value="'+a(d.licenseType||'LMV')+'" oninput="D['+i+'].licenseType=this.value"></div>'+
      '<div><label>Medical Fitness</label><input type="date" value="'+a(d.medicalFitness)+'" oninput="D['+i+'].medicalFitness=this.value"></div>'+
      '<div><label>Traffic Penalty (week) ₹</label><input value="'+a(d.trafficPenaltyWeek)+'" oninput="D['+i+'].trafficPenaltyWeek=this.value"></div>'+
      '<div><label>Badge No.</label><input value="'+a(d.badgeNo)+'" oninput="D['+i+'].badgeNo=this.value"></div>'+
      '</div><div style="margin-top:8px"><label>Remarks</label><textarea rows="2" oninput="D['+i+'].remarks=this.value">'+h(d.remarks)+'</textarea></div>'+
      '<div style="margin-top:8px"><label style="display:inline"><input type="checkbox" '+(d.active?'checked':'')+' onchange="D['+i+'].active=this.checked;drivers()"> Active</label>'+
      (d.active?'':' <input placeholder="Deactivate reason" value="'+a(d.deactivateReason)+'" oninput="D['+i+'].deactivateReason=this.value" style="margin-left:8px">')+
      ' <button class="btn" onclick="DR=-1;drivers()">Close</button></div></div>';
  }
  el('content').innerHTML=withFooter('<div class="card"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px"><b style="color:#fff">All Company Drivers (Management)</b><button class="btn grey" onclick="D.push(drTemplate());DR=D.length-1;drivers()">+ Add Driver</button></div>'+
    '<p style="color:#94a3b8;font-size:12px;margin-bottom:8px">Add / edit / deactivate drivers for all branches. Branch HOD portal is view-only.</p>'+
    '<div class="tblwrap"><table><thead><tr><th>Branch</th><th>Name</th><th>Mobile</th><th>License</th><th>Valid</th><th>Type</th><th>Active</th><th>Actions</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+ed+'</div>'+
    '<div style="text-align:center;margin-top:12px"><button class="btn green" onclick="saveDr()">💾 Save Drivers</button></div>');
}
function deactDr(i){var r=prompt('Reason for deactivation:',D[i].deactivateReason||'Left company');if(r===null)return;D[i].active=false;D[i].deactivateReason=r;DR=-1;drivers();}
function reactDr(i){D[i].active=true;D[i].deactivateReason='';drivers();}
function delDr(i){if(!confirm('Remove driver '+D[i].name+' from records?'))return;D.splice(i,1);DR=-1;drivers();}
function saveDr(){api('saveDrivers',{drivers:D}).then(function(res){alert(res.s===200?'Saved ('+res.j.count+' drivers)':(res.j.error||'Error'));});}

function userTemplate(){return {id:nid('us'),name:'',email:'',mobile:'',role:'branch',userType:'hod',branchId:'Hyderabad',active:true,deactivateReason:'',remarks:'',createdAt:new Date().toISOString()};}
function userTypeLabel(t){return {director:'Director',admin:'Admin',hod:'HOD',staff:'Staff'}[t]||t;}
function setUserType(i,t){U[i].userType=t;if(t==='director'||t==='admin'){U[i].role='admin';U[i].branchId='';}else{U[i].role='branch';}users();}
function toggleUser(i,on){U[i].active=on;if(!on&&!U[i].deactivateReason)U[i].deactivateReason='Deactivated';users();}
function users(){
  if(PORTAL!=='management'||FLEET_ROLE!=='admin'){
    el('content').innerHTML='<div class="card" style="margin-top:20px"><h2 style="color:#fff">User Management — Management Portal only</h2><p style="color:#94a3b8;margin:12px 0">Register Director, Admin, HOD and Staff users from the <b>Management Portal</b> only.</p><p style="margin-top:14px"><a class="btn" href="/fleets?portal=management" style="text-decoration:none;display:inline-block">Open Management Portal</a></p></div>';
    return;
  }
  var rows=U.map(function(u,i){
    var ut=u.userType||(u.role==='admin'?'admin':'hod');
    var roleBadge='<span class="badge-role badge-'+(u.role==='admin'?'admin':'branch')+'">'+h(userTypeLabel(ut))+'</span>';
    var sw='<label class="switch" title="'+(u.active?'Active — click to deactivate':'Inactive — click to activate')+'"><input type="checkbox" '+(u.active?'checked':'')+' onchange="toggleUser('+i+',this.checked)"><span class="slider"></span></label><span class="switch-lbl">'+(u.active?'Active':'Off')+'</span>';
    return '<tr class="'+(u.active?'':'inactive')+'"><td><b>'+h(u.name||'—')+'</b></td><td>'+h(u.email||'—')+'</td><td>'+h(u.mobile||'—')+'</td><td>'+roleBadge+'</td><td>'+(u.role==='branch'?h(u.branchId):'Management')+'</td><td style="white-space:nowrap">'+sw+'</td><td><button class="btn grey" style="padding:4px 10px" onclick="USR='+i+';users()">Edit</button></td></tr>';
  }).join('');
  var ed='';
  if(USR>=0&&U[USR]){
    var u=U[USR],i=USR,ut=u.userType||(u.role==='admin'?'admin':'hod');
    ed='<div class="vedit"><h4>Edit User — '+h(u.name||'New')+'</h4><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">'+
      '<div><label>Full Name *</label><input value="'+a(u.name)+'" oninput="U['+i+'].name=this.value"></div>'+
      '<div><label>Work email (@agilegroup.co.in)</label><input value="'+a(u.email)+'" oninput="U['+i+'].email=this.value" placeholder="name@agilegroup.co.in"></div>'+
      '<div><label>Mobile</label><input value="'+a(u.mobile)+'" oninput="U['+i+'].mobile=this.value"></div>'+
      '<div><label>Role *</label><select onchange="setUserType('+i+',this.value)"><option value="director"'+(ut==='director'?' selected':'')+'>Director (Management)</option><option value="admin"'+(ut==='admin'?' selected':'')+'>Admin (Management)</option><option value="hod"'+(ut==='hod'?' selected':'')+'>HOD (Branch Portal)</option><option value="staff"'+(ut==='staff'?' selected':'')+'>Staff (Branch Portal)</option></select></div>'+
      (u.role==='branch'?'<div><label>Branch *</label><select onchange="U['+i+'].branchId=this.value">'+BRANCHES.map(function(b){return '<option'+(b===u.branchId?' selected':'')+'>'+h(b)+'</option>';}).join('')+'</select></div>':'')+
      '</div><div style="margin-top:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">'+
      '<label class="switch" style="margin:0"><input type="checkbox" '+(u.active?'checked':'')+' onchange="U['+i+'].active=this.checked;toggleUser('+i+',this.checked)"><span class="slider"></span></label>'+
      '<span style="color:#94a3b8;font-size:13px">'+(u.active?'User is <b style="color:#4ade80">Active</b> — can log in with email OTP':'User is <b style="color:#fb923c">Inactive</b> — login blocked')+'</span>'+
      (u.active?'':'<input placeholder="Deactivate reason" value="'+a(u.deactivateReason)+'" oninput="U['+i+'].deactivateReason=this.value" style="flex:1;min-width:180px">')+
      '</div><div style="margin-top:8px"><label>Remarks</label><textarea rows="2" oninput="U['+i+'].remarks=this.value">'+h(u.remarks)+'</textarea></div>'+
      '<div style="margin-top:10px"><button class="btn" onclick="USR=-1;users()">Close</button></div></div>';
  }
  el('content').innerHTML=reportWrap('User Management','Director · Admin · HOD · Staff access',portalBadge(),
    '<div class="card"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px"><b style="color:#fff">Fleet User Access — Management only</b><button class="btn grey" onclick="U.push(userTemplate());USR=U.length-1;users()">+ Add User</button></div>'+
    '<p class="rpt-note">Register <b>Director / Admin</b> (management portal) or <b>HOD / Staff</b> (branch portal — own branch only). Branch HODs cannot edit users here.</p>'+
    '<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Role</th><th>Branch</th><th>Active</th><th></th></tr></thead><tbody>'+(rows||'<tr><td colspan="7" style="color:#64748b">No users yet — click Add User.</td></tr>')+'</tbody></table></div>'+ed+'</div>'+
    '<div class="savebar"><button class="btn green" onclick="saveUsr()">💾 Save Users</button></div>');
}
function saveUsr(){api('saveUsers',{users:U}).then(function(res){alert(res.s===200?'Saved ('+res.j.count+' users)':(res.j.error||'Error'));});}

function reports(){
  var staffView=PORTAL==='staff';
  var sorted=R.filter(function(x){return x.active&&(!staffView||x.branchId===FLEET_BRANCH);}).slice().sort(function(a,b){return (b.submittedAt||'').localeCompare(a.submittedAt||'');});
  var rows=sorted.map(function(r){var km=r.entries.reduce(function(s,e){return s+(Number(e.kmWeek)||0);},0);var code=r.reportCode||reportCode(r.branchId,r.weekNo,r.id);
    var acts='<div class="row-actions"><button class="btn" style="padding:4px 10px" onclick="viewRep(\\''+r.id+'\\')">View</button>';
    if(canDeleteRep(r))acts+='<button class="btn r" style="padding:4px 10px" onclick="delRep(\\''+r.id+'\\')">Delete</button>';
    acts+='</div>';
    return '<tr><td><b style="color:#7dd3fc">'+h(code)+'</b></td>'+(staffView?'':'<td>'+h(r.branchId)+'</td>')+'<td>'+h(r.weekNo)+'</td><td>'+h(r.fromDate)+' → '+h(r.toDate)+'</td><td>'+h(r.submittedBy)+'</td><td>'+r.entries.length+'</td><td>'+km+' km</td><td style="font-size:11px">'+h((r.submittedAt||'').slice(0,16).replace('T',' '))+'</td>'+
    '<td>'+acts+'</td></tr>';}).join('');
  var subtitle=staffView?h(FLEET_BRANCH)+' · archived weekly reports with report codes':'All branches · archived weekly reports with report codes';
  var hodPreview=staffView?'<div class="card" style="margin-bottom:12px"><b style="color:#fff">Preview — Email to HOD</b><p style="color:#94a3b8;font-size:12px;margin:8px 0">See the analysis letter sent to your branch HOD after each Saturday submission.</p><div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end"><div><label>Week</label><select id="staffPrevWeek">'+listReportWeeks().map(function(w){return '<option value="'+w+'">'+w+'</option>';}).join('')+'</select></div><button class="btn" onclick="runStaffHodPreview()">Show HOD Letter Preview</button></div><div id="staffEmailPreview"></div></div>':'';
  el('content').innerHTML=reportWrap('Weekly Reports Archive',subtitle,portalBadge(),
    hodPreview+
    '<div class="card"><p class="rpt-note">Every submitted weekly vehicle report is stored here with a unique <b>Report Code</b>. Click <b>View</b> to open the full report. Use <b>Delete</b> to remove old reports from the archive.</p>'+
    '<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Report Code</th>'+(staffView?'':'<th>Branch</th>')+'<th>Week</th><th>Period</th><th>Submitted By</th><th>Vehicles</th><th>Total KM</th><th>Date</th><th>Actions</th></tr></thead><tbody>'+
    (rows||'<tr><td colspan="'+(staffView?8:9)+'" style="color:#64748b;text-align:center">No weekly reports submitted yet.</td></tr>')+'</tbody></table></div></div>');
}
function canDeleteRep(r){if(PORTAL==='management'||FLEET_ROLE==='admin')return true;return r.branchId===FLEET_BRANCH;}
function wrViewFld(lbl,val){return '<div class="fld"><label>'+lbl+'</label><div style="font-size:14px;color:#e2e8f0;font-weight:600;padding-top:2px">'+h(val||'—')+'</div></div>';}
function wrViewCard(e,i){
  return '<div class="veh-card"><div class="veh-card-hdr"><span class="veh-num">Vehicle '+(i+1)+'</span><div><b style="color:#fff;font-size:16px">'+h(e.regNo)+'</b><div style="color:#94a3b8;font-size:12px">'+h(e.makeModel)+'</div></div></div>'+
    '<div class="veh-ro"><div><span>Insurance</span><b>'+h(e.insuranceValid||'—')+'</b></div><div><span>PUC</span><b>'+h(e.pucValid||'—')+'</b></div><div><span>DL Valid</span><b>'+h(e.licenseValid||'—')+'</b></div></div>'+
    '<div class="veh-card-grid">'+
    wrViewFld('Driver',e.driverName)+wrViewFld('Driver Mobile',e.driverMobile)+
    wrViewFld('Opening Meter (km)',e.odoStart)+wrViewFld('Closing Meter (km)',e.odoEnd)+wrViewFld('Total KM',e.kmWeek)+
    wrViewFld('Fuel (L)',e.fuelQty||e.fuelLiters)+wrViewFld('Fuel Charges ₹',e.fuelAmount||e.fuelCost)+
    wrViewFld('Maintenance ₹',e.maintenanceCost)+wrViewFld('Maintenance Details',e.maintenanceDetails)+
    wrViewFld('Tyre Change KM',e.tyreChangeKm)+wrViewFld('Battery Change KM',e.batteryChangeKm)+
    wrViewFld('Traffic Penalty ₹',e.trafficPenaltyRs)+wrViewFld('Vehicle Condition',e.condition)+wrViewFld('Next Service KM',e.nextServiceKm)+
    '</div></div>';
}
function wrViewRow(e,i){
  return '<tr><td style="text-align:center">'+(i+1)+'</td><td><b>'+h(e.regNo)+'</b></td><td>'+h(e.makeModel)+'</td><td>'+h(e.driverName)+'</td>'+
    '<td style="font-size:11px">'+h(e.licenseValid)+'</td><td style="font-size:11px">'+h(e.insuranceValid)+'</td><td style="font-size:11px">'+h(e.pucValid)+'</td>'+
    '<td>'+h(e.odoStart)+'</td><td>'+h(e.odoEnd)+'</td><td><b>'+h(e.kmWeek)+'</b></td>'+
    '<td>'+h(e.fuelQty||e.fuelLiters)+'</td><td>'+h(e.fuelAmount||e.fuelCost)+'</td>'+
    '<td>'+h(e.maintenanceCost)+'</td><td>'+h(e.maintenanceDetails)+'</td>'+
    '<td>'+h(e.tyreChangeKm)+'</td><td>'+h(e.batteryChangeKm)+'</td><td>'+h(e.trafficPenaltyRs)+'</td>'+
    '<td>'+condBadge(e.condition)+'</td><td>'+h(e.nextServiceKm)+'</td></tr>';
}
function viewRep(id){var r=R.find(function(x){return x.id===id});if(!r){alert('Report not found.');return;}
  var code=r.reportCode||reportCode(r.branchId,r.weekNo,r.id),n=r.entries.length,vehBlock='';
  if(!n)vehBlock='<div class="card" style="color:#94a3b8;text-align:center;padding:20px">No vehicle entries in this report.</div>';
  else if(n<=3)vehBlock='<div class="wr-count">🚗 '+n+' vehicle'+(n===1?'':'s')+' · Card view</div><div class="veh-cards-grid">'+r.entries.map(wrViewCard).join('')+'</div>';
  else vehBlock='<div class="wr-count">🚗 '+n+' vehicles · Table view</div><div class="tblwrap wr-tbl-wrap"><table class="wr-tbl" style="min-width:2200px"><thead><tr>'+
    '<th>S.No</th><th>Reg No.</th><th>Model</th><th>Driver</th><th>DL Valid</th><th>Insurance</th><th>PUC</th>'+
    '<th>Odo Open</th><th>Odo Close</th><th>Total KM</th><th>Fuel (L)</th><th>Fuel ₹</th>'+
    '<th>Maint ₹</th><th>Maint Details</th><th>Tyre KM</th><th>Battery KM</th><th>Traffic Pen ₹</th><th>Condition</th><th>Next Svc KM</th>'+
    '</tr></thead><tbody>'+r.entries.map(wrViewRow).join('')+'</tbody></table></div>';
  var submitDate=(r.submittedAt||'').slice(0,10);
  var framed='<div class="wr-doc-frame"><div class="wr-doc-inner">'+
    '<div class="wr-section-box"><div class="wr-section-title">Section A — Branch Details</div><div class="rpt-meta">'+
    wrViewFld('Report Code',code)+wrViewFld('Branch Name',r.branchId)+wrViewFld('Reporting Week No.',r.weekNo)+
    wrViewFld('From Date',r.fromDate)+wrViewFld('To Date',r.toDate)+wrViewFld('Submitted By',r.submittedBy)+
    wrViewFld('Date of Submission',submitDate)+'</div></div>'+
    '<div class="wr-section-box"><div class="wr-section-title">Section B — Vehicle Details ('+n+' vehicle'+(n===1?'':'s')+')</div>'+vehBlock+'</div>'+
    '<div class="rpt-decl">Declaration: I hereby certify that the above information is true and correct to the best of my knowledge.</div></div></div>';
  var body='<div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn grey" onclick="reports()">← Back to Weekly Reports</button>'+
    (canDeleteRep(r)?'<button class="btn r" onclick="delRep(\\''+r.id+'\\')">Delete This Report</button>':'')+'</div>'+framed;
  el('content').innerHTML=reportWrap('Weekly Vehicle Report — '+h(r.branchId),h(r.weekNo)+' · '+h(r.fromDate)+' to '+h(r.toDate),code,body);
  window.scrollTo(0,0);
}
function delRep(id){
  var r=R.find(function(x){return x.id===id});if(!r)return;
  if(!canDeleteRep(r)){alert('You can only delete reports for your own branch.');return;}
  if(!confirm('Delete weekly report '+h(r.reportCode||r.weekNo)+' from the archive?'))return;
  api('load').then(function(res){
    var all=res.j.reports||[];
    var payload;
    if(PORTAL==='management'||FLEET_ROLE==='admin')payload=all.filter(function(x){return x.id!==id;});
    else payload=all.filter(function(x){return x.branchId===FLEET_BRANCH&&x.id!==id;});
    return api('saveReports',{reports:payload});
  }).then(function(res){
    if(res.s===200){R=R.filter(function(x){return x.id!==id;});alert('Report deleted.');reports();}
    else alert(res.j.error||'Could not delete report.');
  }).catch(function(){alert('Network error. Please try again.');});
}
function listReportWeeks(){
  var set={};set[weekNo()]=1;
  R.filter(function(x){return x.active;}).forEach(function(r){if(r.weekNo)set[r.weekNo]=1;});
  return Object.keys(set).sort(function(a,b){return b.localeCompare(a);});
}
function setPreviewTab(t){FLEET_PREVIEW_TAB=t;letterPreviews();}
function letterPreviews(){
  if(PORTAL!=='management'&&FLEET_ROLE!=='admin'){
    el('content').innerHTML='<div class="card" style="margin-top:12px"><h2 style="color:#fff">Management only</h2><p style="color:#94a3b8;margin:12px 0">Letter previews are in the <b>Management Portal</b>. Branch staff can preview their HOD email from <b>Weekly Reports</b>.</p></div>';
    return;
  }
  var weeks=listReportWeeks();
  if(!FLEET_PREVIEW_WEEK&&weeks.length)FLEET_PREVIEW_WEEK=weeks[0];
  var isHod=FLEET_PREVIEW_TAB==='hod';
  var weekOpts=weeks.map(function(w){return '<option value="'+w+'"'+(w===FLEET_PREVIEW_WEEK?' selected':'')+'>'+w+'</option>';}).join('');
  var branchOpts=BRANCHES.map(function(b){return '<option value="'+b+'">'+h(b)+'</option>';}).join('');
  var body='<div class="preview-tabs">'+
    '<div class="preview-tab'+(isHod?' active':'')+'" onclick="setPreviewTab(\\'hod\\')">📧 Branch HOD Weekly Letter</div>'+
    '<div class="preview-tab'+(isHod?'':' active')+'" onclick="setPreviewTab(\\'consolidated\\')">📊 Consolidated Weekly Vehicle Report</div></div>'+
    '<div class="card"><p class="rpt-note">'+(isHod?
      'This is the <b>email sent to each branch HOD</b> automatically when they submit their weekly vehicle report on Saturday (Director is copied).':
      'This is the <b>all-India consolidated report</b> emailed to the Director every <b>Sunday at 10:00 AM IST</b> — all branches combined.')+'</p>'+
    '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin-top:10px">'+
    '<div><label>Week</label><select id="prevWeek" onchange="FLEET_PREVIEW_WEEK=this.value">'+weekOpts+'</select></div>'+
    (isHod?'<div><label>Branch</label><select id="prevBranch">'+branchOpts+'</select></div>':'')+
    '<button class="btn green" onclick="runLetterPreview()">Show Preview</button></div>'+
    '<div id="prevSubject" class="subj" style="display:none;margin-top:12px"></div>'+
    '<div id="emailPreview" class="email-preview"><p style="color:#64748b;text-align:center;padding:24px">Choose week'+(isHod?' and branch':'')+' above, then click <b>Show Preview</b>.</p></div></div>';
  el('content').innerHTML=reportWrap('Weekly Letter Previews',isHod?'Branch HOD analysis email':'Director consolidated report',portalBadge(),body);
}
function runLetterPreview(){
  var kind=FLEET_PREVIEW_TAB==='consolidated'?'consolidated':'hod';
  var payload={kind:kind,weekNo:el('prevWeek').value};
  FLEET_PREVIEW_WEEK=payload.weekNo;
  if(kind==='hod')payload.branchId=el('prevBranch').value;
  el('emailPreview').innerHTML='<p style="color:#64748b;text-align:center;padding:24px">Loading preview…</p>';
  el('prevSubject').style.display='none';
  api('previewEmail',payload).then(function(res){
    if(res.s!==200){el('emailPreview').innerHTML='<div class="alert red">'+h(res.j.error||'Could not load preview')+'</div>';return;}
    el('prevSubject').style.display='block';
    el('prevSubject').innerHTML='<b>Email subject:</b> '+h(res.j.subject||'');
    el('emailPreview').innerHTML=res.j.html||'';
    el('emailPreview').scrollIntoView({behavior:'smooth',block:'start'});
  }).catch(function(){el('emailPreview').innerHTML='<div class="alert red">Network error. Please try again.</div>';});
}
function runStaffHodPreview(){
  var wk=el('staffPrevWeek')?el('staffPrevWeek').value:weekNo();
  el('staffEmailPreview').innerHTML='<div class="email-preview" style="margin-top:10px"><p style="color:#64748b;text-align:center;padding:20px">Loading…</p></div>';
  api('previewEmail',{kind:'hod',weekNo:wk,branchId:FLEET_BRANCH}).then(function(res){
    if(res.s!==200){el('staffEmailPreview').innerHTML='<div class="alert red">'+h(res.j.error||'No report for this week yet.')+'</div>';return;}
    el('staffEmailPreview').innerHTML='<div class="subj" style="margin-top:10px"><b>Email subject:</b> '+h(res.j.subject||'')+'</div><div class="email-preview">'+res.j.html+'</div>';
  });
}

function monthLabel(mk){var p=mk.split('-');var n=['January','February','March','April','May','June','July','August','September','October','November','December'];return n[parseInt(p[1],10)-1]+' '+p[0];}
function reportMonth(r){var d=r.toDate||r.fromDate||(r.submittedAt||'').slice(0,10);return d.length>=7?d.slice(0,7):'';}
function listMonths(){var set={},now=new Date();set[now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')]=1;R.filter(function(x){return x.active;}).forEach(function(r){var m=reportMonth(r);if(m)set[m]=1;});return Object.keys(set).sort().reverse();}
function aggregateMonth(mk){
  var reps=R.filter(function(x){return x.active&&reportMonth(x)===mk;});
  var byBranch={},total=emptyStats();
  BRANCHES.forEach(function(b){byBranch[b]={stats:emptyStats(),weeks:0};});
  reps.forEach(function(r){
    if(!byBranch[r.branchId])byBranch[r.branchId]={stats:emptyStats(),weeks:0};
    byBranch[r.branchId].weeks++;
    r.entries.forEach(function(e){byBranch[r.branchId].stats=addStats(byBranch[r.branchId].stats,e);total=addStats(total,e);});
  });
  return {total:total,rows:BRANCHES.map(function(b){return {branchId:b,stats:byBranch[b].stats,weeks:byBranch[b].weeks||0};})};
}
function aggregateMonthVehicles(mk,branch){
  var reps=R.filter(function(x){return x.active&&reportMonth(x)===mk&&(branch==='ALL'||x.branchId===branch);});
  var map={};
  reps.forEach(function(r){
    r.entries.forEach(function(e){
      var key=r.branchId+'|'+e.regNo;
      if(!map[key])map[key]={branchId:r.branchId,regNo:e.regNo,makeModel:e.makeModel||'',stats:emptyStats(),weeks:{}};
      map[key].stats=addStats(map[key].stats,e);
      if(e.makeModel)map[key].makeModel=e.makeModel;
      map[key].weeks[r.weekNo]=1;
    });
  });
  return Object.keys(map).map(function(k){var v=map[k];return {branchId:v.branchId,regNo:v.regNo,makeModel:v.makeModel,stats:v.stats,weeksReported:Object.keys(v.weeks).length};}).sort(function(a,b){return a.branchId.localeCompare(b.branchId)||a.regNo.localeCompare(b.regNo);});
}
function monthly(){
  var staffView=PORTAL==='staff';
  if(staffView)FLEET_MBRANCH=FLEET_BRANCH;
  var months=listMonths();
  if(!FLEET_MONTH&&months.length)FLEET_MONTH=months[0];
  var agg=aggregateMonth(FLEET_MONTH);
  if(staffView)agg.rows=agg.rows.filter(function(r){return r.branchId===FLEET_BRANCH;});
  if(staffView&&agg.rows.length)agg.total=agg.rows[0].stats;else if(staffView)agg.total=emptyStats();
  var vehs=aggregateMonthVehicles(FLEET_MONTH,staffView?FLEET_BRANCH:FLEET_MBRANCH);
  var brRows=agg.rows.map(function(r){
    var lbl=r.branchId+(r.weeks?' ('+r.weeks+' week'+(r.weeks===1?'':'s')+')':' (no reports)');
    return statRow(lbl,r.stats,'');
  }).join('');
  var allRow=statRow('ALL BRANCHES (Total)',agg.total,'');
  var vehRows=vehs.map(function(v){
    var s=v.stats;
    return '<tr><td>'+h(v.branchId)+'</td><td><b>'+h(v.regNo)+'</b></td><td>'+h(v.makeModel)+'</td><td style="text-align:center">'+v.weeksReported+'</td><td>'+s.km.toLocaleString('en-IN')+' km</td><td>'+fmtL(s.dieselL)+'</td><td>'+fmtL(s.petrolL)+'</td><td>'+fmtRs(s.fuelCost)+'</td><td>'+fmtRs(s.fuelCard)+'</td><td>'+fmtRs(s.maintenance)+'</td><td>'+(avgMil(s)||'—')+'</td><td>'+(s.evCount?s.evCount+' · '+fmtRs(s.evCharge):'—')+'</td><td>'+(evEff(s)||'—')+'</td></tr>';
  }).join('');
  var monthOpts=months.map(function(m){return '<option value="'+m+'"'+(m===FLEET_MONTH?' selected':'')+'>'+monthLabel(m)+'</option>';}).join('');
  var branchOpts=['ALL'].concat(BRANCHES).map(function(b){return '<option value="'+b+'"'+(b===FLEET_MBRANCH?' selected':'')+'>'+(b==='ALL'?'All Branches':b)+'</option>';}).join('');
  var body=
    '<div class="kgrid">'+
    kpi(agg.total.km.toLocaleString('en-IN')+' km','Total KM — '+monthLabel(FLEET_MONTH),'blue')+
    kpi(fmtRs(agg.total.fuelCost+agg.total.evCharge),'Fuel + EV Cost','amber')+
    kpi(fmtRs(agg.total.maintenance),'Maintenance','red')+
    kpi(vehs.length,'Vehicles in view','teal')+
    kpi(avgMil(agg.total)||'—','Avg km/l (fuel)','green')+
    '</div>'+
    '<div class="card"><div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin-bottom:12px">'+
    '<div><label>Select Month</label><select id="fleetMonthSel" onchange="FLEET_MONTH=this.value;monthly()">'+monthOpts+'</select></div>'+
    (staffView?'':'<div><label>Branch filter (vehicle list)</label><select id="fleetMBra" onchange="FLEET_MBRANCH=this.value;monthly()">'+branchOpts+'</select></div>')+'</div></div>'+
    reportSec('Branch Totals — '+monthLabel(FLEET_MONTH))+
    '<div class="card"><p class="rpt-note">Adds up every weekly report submitted by branches in this calendar month.</p>'+
    '<div class="tblwrap wr-tbl-wrap" style="margin-top:8px"><table class="wr-tbl"><thead><tr><th>Branch</th><th>KM</th><th>Diesel</th><th>Petrol</th><th>Fuel Cost</th><th>Fuel Card</th><th>Maintenance</th><th>Avg km/l</th><th>EV (count · charge)</th><th>EV km/kWh</th></tr></thead><tbody>'+brRows+allRow+'</tbody></table></div></div>'+
    reportSec('All Vehicles — '+monthLabel(FLEET_MONTH))+
    '<div class="card"><p class="rpt-note">Every vehicle in weekly reports this month — single-vehicle branches and multi-vehicle branches (including Corporate Office).</p>'+
    '<div class="tblwrap wr-tbl-wrap" style="margin-top:8px"><table class="wr-tbl"><thead><tr><th>Branch</th><th>Reg No.</th><th>Model</th><th>Weeks</th><th>KM</th><th>Diesel</th><th>Petrol</th><th>Fuel Cost</th><th>Fuel Card</th><th>Maintenance</th><th>Avg km/l</th><th>EV</th><th>EV km/kWh</th></tr></thead><tbody>'+
    (vehRows||'<tr><td colspan="13" style="color:#64748b;text-align:center">No vehicle data for this month yet — branches submit weekly reports every Saturday.</td></tr>')+
    '</tbody></table></div></div>';
  el('content').innerHTML=reportWrap('Monthly Fleet Report',monthLabel(FLEET_MONTH)+(staffView?' · '+h(FLEET_BRANCH):''),portalBadge(),body);
}

function docs(){
  var staffView=PORTAL==='staff';
  var vlist=branchVehiclesList().filter(function(v){return v.active;});
  var dlist=branchDriversList().filter(function(d){return d.active;});
  var rows=vlist.map(function(v){
    var id=daysLeft(v.insuranceValid),pd=daysLeft(v.pucValid),sd=v.nextServiceDue?daysLeft(v.nextServiceDue):999;
    function badge(d,l){if(!l)return '<span style="color:#64748b">—</span>';var c=d<0?'#ef4444':d<60?'#f59e0b':'#4ade80';return '<span style="color:'+c+';font-weight:700">'+l+' ('+d+'d)</span>';}
    return '<tr>'+(staffView?'':'<td>'+h(v.branchId)+'</td>')+'<td><b>'+h(v.regNo)+'</b></td><td>'+h(v.vehicleName||v.makeModel)+'</td><td>'+badge(id,v.insuranceValid)+'</td><td>'+badge(pd,v.pucValid)+'</td><td>'+(v.nextServiceDue?badge(sd,v.nextServiceDue):'—')+'</td><td style="font-size:11px">'+h(v.insuranceClaim||'—')+'</td></tr>';
  }).join('');
  var drows=dlist.map(function(d){
    var ld=daysLeft(d.licenseValid),mf=d.medicalFitness?daysLeft(d.medicalFitness):999;
    function badge(d,l){if(!l)return '—';var c=d<0?'#ef4444':d<60?'#f59e0b':'#4ade80';return '<span style="color:'+c+';font-weight:700">'+l+' ('+d+'d)</span>';}
    return '<tr>'+(staffView?'':'<td>'+h(d.branchId)+'</td>')+'<td><b>'+h(d.name)+'</b></td><td>'+h(d.licenseNo)+'</td><td>'+badge(ld,d.licenseValid)+'</td><td>'+(d.medicalFitness?badge(mf,d.medicalFitness):'—')+'</td><td>'+h(d.mobile)+'</td></tr>';
  }).join('');
  el('content').innerHTML=reportWrap('Documents Validity Report',(staffView?h(FLEET_BRANCH):'All Branches')+' · Vehicles & Drivers',portalBadge(),
    reportSec('Vehicle Documents')+
    '<div class="card"><div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr>'+(staffView?'':'<th>Branch</th>')+'<th>Reg</th><th>Name</th><th>Insurance</th><th>PUC</th><th>Service</th><th>Claim</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+
    reportSec('Driver Licence & Medical Fitness')+
    '<div class="card"><div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr>'+(staffView?'':'<th>Branch</th>')+'<th>Driver</th><th>License No.</th><th>Valid Upto</th><th>Medical</th><th>Mobile</th></tr></thead><tbody>'+(drows||'<tr><td colspan="'+(staffView?5:6)+'" style="color:#64748b">No drivers yet.</td></tr>')+'</tbody></table></div></div>');
}

var PT={date:'',regNo:'',location:'',riderName:'',licenseNo:'',shift:'Morning',odoStart:'',odoEnd:'',battery:'',checkedBy:'',branchId:'',items:[]};
function tripBranchReset(){return FLEET_BRANCH||'Corporate Office';}
function tripBranchFld(obj,selId,onchange){
  if(PORTAL==='staff'&&FLEET_BRANCH){obj.branchId=FLEET_BRANCH;return '<div><label>Branch</label><input value="'+a(FLEET_BRANCH)+'" readonly></div>';}
  return '<div><label>Branch</label><select id="'+selId+'" onchange="'+onchange+'">'+BRANCHES.map(function(b){return '<option'+(b===obj.branchId?' selected':'')+'>'+h(b)+'</option>';}).join('')+'</select></div>';
}
function vehRegOpts(cur){return '<option value="">— Select vehicle —</option>'+branchVehiclesList().filter(function(v){return v.active;}).map(function(v){return '<option'+(v.regNo===cur?' selected':'')+'>'+h(v.regNo)+'</option>';}).join('');}
function tripRegFld(obj,objName,inpFn){
  if(PORTAL==='staff'&&branchVehiclesList().filter(function(v){return v.active;}).length){
    return '<div><label>Reg No.</label><select onchange="'+objName+'.regNo=this.value">'+vehRegOpts(obj.regNo)+'</select></div>';
  }
  return inpFn('Reg No.','regNo',obj.regNo);
}
function recentTrips(formType,label){
  var rows=I.filter(function(x){return x.active&&x.formType===formType;}).slice().sort(function(a,b){return (b.createdAt||'').localeCompare(a.createdAt||'');}).slice(0,10)
    .map(function(x){return '<tr><td>'+h(x.date)+'</td><td>'+h(x.regNo)+'</td><td>'+h(x.riderName)+'</td><td>'+h(x.shift)+'</td><td>'+h(x.checkedBy)+'</td></tr>';}).join('');
  return rows?'<div class="card" style="margin-top:12px"><b style="color:#fff">Recent '+label+' — '+h(FLEET_BRANCH)+'</b><div class="tblwrap" style="margin-top:8px"><table><thead><tr><th>Date</th><th>Reg</th><th>Rider</th><th>Shift</th><th>Checked By</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>':'';
}
function pretrip(){
  if(!PT.branchId)PT.branchId=tripBranchReset();
  if(!PT.items.length)PT.items=PRE4W.map(function(it){return {item:it,status:'OK',remarks:''};});
  if(!PT.date)PT.date=new Date().toISOString().slice(0,10);
  var rows=PT.items.map(function(it,i){return '<tr><td style="font-size:12px">'+h(it.item)+'</td><td><select onchange="PT.items['+i+'].status=this.value"><option'+(it.status==='OK'?' selected':'')+'>OK</option><option'+(it.status==='NOT OK'?' selected':'')+'>NOT OK</option><option'+(it.status==='NA'?' selected':'')+'>NA</option></select></td><td><input value="'+a(it.remarks)+'" oninput="PT.items['+i+'].remarks=this.value"></td></tr>';}).join('');
  el('content').innerHTML=reportWrap('Daily Pre-Trip Report','PTC-01 · 4-Wheeler · '+h(FLEET_BRANCH||PT.branchId),portalBadge(),
    '<p class="rpt-note">Complete before every trip. Branch is locked to your branch only.</p>'+
    reportSec('Trip Details')+
    '<div class="card"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:12px">'+
    fld('Date','date',PT.date,'date')+tripRegFld(PT,'PT',function(l,k,v){return fld(l,k,v);})+fld('Location/Site','location',PT.location)+
    fld('Rider Name','riderName',PT.riderName)+fld('License No.','licenseNo',PT.licenseNo)+
    '<div><label>Shift</label><select id="ptShift" onchange="PT.shift=this.value"><option'+(PT.shift==='Morning'?' selected':'')+'>Morning</option><option'+(PT.shift==='Afternoon'?' selected':'')+'>Afternoon</option><option'+(PT.shift==='Night'?' selected':'')+'>Night</option></select></div>'+
    fld('Odo Start','odoStart',PT.odoStart)+fld('Odo End','odoEnd',PT.odoEnd)+fld('Checked By','checkedBy',PT.checkedBy)+
    tripBranchFld(PT,'ptBranch','PT.branchId=this.value')+'</div>'+
    reportSec('Pre-Trip Checklist')+
    '<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Check Item</th><th>Status</th><th>Remarks</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<div style="text-align:center;margin-top:12px"><button class="btn green" onclick="savePT()">💾 Save Pre-Trip Report</button></div></div>'+recentTrips('pre-trip-4w','Pre-Trip Reports'));
}
function fld(lbl,key,val,type){return '<div><label>'+lbl+'</label><input '+(type==='date'?'type="date"':'')+' value="'+a(val||PT[key]||'')+'" oninput="PT[\\''+key+'\\']=this.value"></div>';}
function savePT(){
  var bid=PORTAL==='staff'&&FLEET_BRANCH?FLEET_BRANCH:(PT.branchId||(el('ptBranch')?el('ptBranch').value:''));
  var rec={id:nid('in'),branchId:bid,formType:'pre-trip-4w',date:PT.date,regNo:PT.regNo,location:PT.location,riderName:PT.riderName,licenseNo:PT.licenseNo,shift:PT.shift,odoStart:PT.odoStart,odoEnd:PT.odoEnd,battery:PT.battery,items:PT.items,checkedBy:PT.checkedBy,active:true,createdAt:new Date().toISOString()};
  api('saveInspections',{inspections:I.concat([rec])}).then(function(res){if(res.s===200){I=I.concat([rec]);alert('Pre-trip saved.');PT={date:'',regNo:'',location:'',riderName:'',licenseNo:'',shift:'Morning',odoStart:'',odoEnd:'',battery:'',checkedBy:'',branchId:tripBranchReset(),items:[]};pretrip();}else alert(res.j.error||'Error');});
}

var PO={date:'',regNo:'',location:'',riderName:'',licenseNo:'',shift:'Morning',odoStart:'',odoEnd:'',battery:'',checkedBy:'',branchId:'',items:[]};
function posttrip(){
  if(!PO.branchId)PO.branchId=tripBranchReset();
  if(!PO.items.length)PO.items=POST4W.map(function(it){return {item:it,status:'OK',remarks:''};});
  if(!PO.date)PO.date=new Date().toISOString().slice(0,10);
  var rows=PO.items.map(function(it,i){return '<tr><td style="font-size:12px">'+h(it.item)+'</td><td><select onchange="PO.items['+i+'].status=this.value"><option'+(it.status==='OK'?' selected':'')+'>OK</option><option'+(it.status==='NOT OK'?' selected':'')+'>NOT OK</option><option'+(it.status==='NA'?' selected':'')+'>NA</option></select></td><td><input value="'+a(it.remarks)+'" oninput="PO.items['+i+'].remarks=this.value"></td></tr>';}).join('');
  el('content').innerHTML=reportWrap('Daily Post-Trip Report','4-Wheeler · '+h(FLEET_BRANCH||PO.branchId),portalBadge(),
    '<p class="rpt-note">Complete after every trip. Pairs with the pre-trip report for the same journey.</p>'+
    reportSec('Trip Details')+
    '<div class="card"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:12px">'+
    pfld('Date','date',PO.date,'date')+tripRegFld(PO,'PO',function(l,k,v){return pfld(l,k,v);})+pfld('Location/Site','location',PO.location)+
    pfld('Rider Name','riderName',PO.riderName)+pfld('License No.','licenseNo',PO.licenseNo)+
    '<div><label>Shift</label><select id="poShift" onchange="PO.shift=this.value"><option'+(PO.shift==='Morning'?' selected':'')+'>Morning</option><option'+(PO.shift==='Afternoon'?' selected':'')+'>Afternoon</option><option'+(PO.shift==='Night'?' selected':'')+'>Night</option></select></div>'+
    pfld('Odo Start','odoStart',PO.odoStart)+pfld('Odo End (after trip)','odoEnd',PO.odoEnd)+pfld('Checked By','checkedBy',PO.checkedBy)+
    tripBranchFld(PO,'poBranch','PO.branchId=this.value')+'</div>'+
    reportSec('Post-Trip Checklist')+
    '<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Check Item</th><th>Status</th><th>Remarks</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<div style="text-align:center;margin-top:12px"><button class="btn green" onclick="savePO()">💾 Save Post-Trip Report</button></div></div>'+recentTrips('post-trip-4w','Post-Trip Reports'));
}
function pfld(lbl,key,val,type){return '<div><label>'+lbl+'</label><input '+(type==='date'?'type="date"':'')+' value="'+a(val||PO[key]||'')+'" oninput="PO[\\''+key+'\\']=this.value"></div>';}
function savePO(){
  var bid=PORTAL==='staff'&&FLEET_BRANCH?FLEET_BRANCH:(PO.branchId||(el('poBranch')?el('poBranch').value:''));
  var rec={id:nid('in'),branchId:bid,formType:'post-trip-4w',date:PO.date,regNo:PO.regNo,location:PO.location,riderName:PO.riderName,licenseNo:PO.licenseNo,shift:PO.shift,odoStart:PO.odoStart,odoEnd:PO.odoEnd,battery:PO.battery,items:PO.items,checkedBy:PO.checkedBy,active:true,createdAt:new Date().toISOString()};
  api('saveInspections',{inspections:I.concat([rec])}).then(function(res){if(res.s===200){I=I.concat([rec]);alert('Post-trip saved.');PO={date:'',regNo:'',location:'',riderName:'',licenseNo:'',shift:'Morning',odoStart:'',odoEnd:'',battery:'',checkedBy:'',branchId:tripBranchReset(),items:[]};posttrip();}else alert(res.j.error||'Error');});
}

function drvOptsStaff(i){return '<option value="">— Driver —</option>'+branchDriversList().map(function(d){var sel=ENT[i]&&ENT[i].driverName===d.name?' selected':'';return '<option value="'+a(d.name)+'"'+sel+'>'+h(d.name)+'</option>';}).join('');}
function pickDrvStaff(i,name){var d=branchDriversList().find(function(x){return x.name===name;});if(!d)return;ENT[i].driverName=d.name;ENT[i].driverMobile=d.mobile;ENT[i].licenseNo=d.licenseNo;ENT[i].licenseValid=d.licenseValid;}
function lastWeekEntry(regNo){
  var wk=weekNo();
  var prev=R.filter(function(x){return x.active&&x.branchId===FLEET_BRANCH&&x.weekNo!==wk;}).sort(function(a,b){return (b.submittedAt||'').localeCompare(a.submittedAt||'');});
  for(var pi=0;pi<prev.length;pi++){var e=prev[pi].entries.find(function(x){return x.regNo===regNo;});if(e)return e;}
  return null;
}
function buildWeeklyEntries(){
  var rep=currentWeekReport();
  if(rep)return rep.entries.map(function(e){return Object.assign({},e);});
  return branchVehiclesList().filter(function(v){return v.active!==false;}).map(function(v){
    var lw=lastWeekEntry(v.regNo),drv=v.driverName||'';
    if(lw&&lw.driverName)drv=lw.driverName;
    var drvRec=D.find(function(d){return d.name===drv;});
    var odoStart=lw&&lw.odoEnd?lw.odoEnd:(v.lastOdoReading||'');
    return {vehicleId:v.id,regNo:v.regNo,makeModel:v.vehicleName||v.makeModel,driverName:drv,driverMobile:drvRec?drvRec.mobile:(lw?lw.driverMobile:''),licenseNo:drvRec?drvRec.licenseNo:(lw?lw.licenseNo:''),licenseValid:drvRec?drvRec.licenseValid:(v.licenseValid||''),odoStart:odoStart,odoEnd:'',kmWeek:0,kmMonth:0,lastFuelDate:'',fuelAmount:'',fuelQty:'',maintenanceDetails:'Nil',maintenanceCost:'Nil',insuranceValid:v.insuranceValid,pucValid:v.pucValid,condition:lw?lw.condition:(v.vehicleCondition||'Good'),nextServiceKm:v.nextServiceKm||'',trafficPenaltyRs:'',tyreChangeKm:'',batteryChangeKm:'',remarks:''};
  });
}
function recalcKm(i){
  var s=parseFloat(String(ENT[i].odoStart).replace(/,/g,'')),e=parseFloat(String(ENT[i].odoEnd).replace(/,/g,''));
  if(!isNaN(s)&&!isNaN(e)&&e>=s){ENT[i].kmWeek=Math.round(e-s);var kmEl=document.getElementById('wrKm'+i);if(kmEl)kmEl.value=ENT[i].kmWeek;}
}
function wrInp(val,key,i,num,onchg,id){var chg=onchg||('ENT['+i+'][\\''+key+'\\']='+(num?'+this.value':'this.value'));return '<td><input'+(id?' id="'+id+'"':'')+' value="'+a(val)+'" '+(num?'type="number" step="any"':'')+' oninput="'+chg+'"></td>';}
function wrFldCard(lbl,val,key,i,num,onchg,id){
  var chg=onchg||('ENT['+i+'][\\''+key+'\\']='+(num?'+this.value':'this.value'));
  return '<div><label>'+lbl+'</label><input'+(id?' id="'+id+'"':'')+' value="'+a(val)+'" '+(num?'type="number" step="any"':'')+' oninput="'+chg+'"></div>';
}
function wrVehicleCard(e,i){
  return '<div class="veh-card"><div class="veh-card-hdr"><span class="veh-num">Vehicle '+(i+1)+'</span><div><b style="color:#fff;font-size:16px">'+h(e.regNo)+'</b><div style="color:#94a3b8;font-size:12px">'+h(e.makeModel)+'</div></div></div>'+
    '<div class="veh-ro"><div><span>Insurance</span><b>'+h(e.insuranceValid||'—')+'</b></div><div><span>PUC</span><b>'+h(e.pucValid||'—')+'</b></div><div><span>DL Valid</span><b id="wrDl'+i+'">'+h(e.licenseValid||'—')+'</b></div></div>'+
    '<div class="veh-card-grid">'+
    '<div><label>Driver *</label><select onchange="pickDrvStaff('+i+',this.value);var d=branchDriversList().find(function(x){return x.name===this.value;}.bind(this));if(d&&el(\\'wrDl'+i+'\\'))el(\\'wrDl'+i+'\\').textContent=d.licenseValid||\\'—\\'">'+drvOptsStaff(i)+'</select></div>'+
    wrFldCard('Opening Meter (km)',e.odoStart,'odoStart',i,true,'ENT['+i+'].odoStart=this.value;recalcKm('+i+')')+
    wrFldCard('Closing Meter (km)',e.odoEnd,'odoEnd',i,true,'ENT['+i+'].odoEnd=this.value;recalcKm('+i+')')+
    wrFldCard('Total KM',e.kmWeek,'kmWeek',i,true,null,'wrKm'+i)+
    wrFldCard('Fuel (L)',e.fuelQty,'fuelQty',i)+wrFldCard('Fuel Charges ₹',e.fuelAmount,'fuelAmount',i)+
    wrFldCard('Maintenance ₹',e.maintenanceCost,'maintenanceCost',i)+wrFldCard('Maintenance Details',e.maintenanceDetails,'maintenanceDetails',i)+
    wrFldCard('Tyre Change KM',e.tyreChangeKm,'tyreChangeKm',i)+wrFldCard('Battery Change KM',e.batteryChangeKm,'batteryChangeKm',i)+
    wrFldCard('Traffic Penalty ₹',e.trafficPenaltyRs,'trafficPenaltyRs',i)+
    '<div><label>Vehicle Condition</label><select onchange="ENT['+i+'].condition=this.value"><option'+(e.condition==='Good'?' selected':'')+'>Good</option><option'+(e.condition==='Fair'?' selected':'')+'>Fair</option><option'+(e.condition==='Poor'?' selected':'')+'>Poor</option><option'+(e.condition==='Under Repair'?' selected':'')+'>Under Repair</option></select></div>'+
    wrFldCard('Next Service KM',e.nextServiceKm,'nextServiceKm',i)+'</div></div>';
}
function wrVehicleTable(){
  return ENT.map(function(e,i){
    return '<tr><td style="text-align:center">'+(i+1)+'</td><td><b>'+h(e.regNo)+'</b></td><td>'+h(e.makeModel)+'</td>'+
      '<td><select onchange="pickDrvStaff('+i+',this.value)">'+drvOptsStaff(i)+'</select></td>'+
      '<td style="font-size:11px">'+h(e.licenseValid)+'</td><td style="font-size:11px">'+h(e.insuranceValid)+'</td><td style="font-size:11px">'+h(e.pucValid)+'</td>'+
      wrInp(e.odoStart,'odoStart',i,true,'ENT['+i+'].odoStart=this.value;recalcKm('+i+')')+
      wrInp(e.odoEnd,'odoEnd',i,true,'ENT['+i+'].odoEnd=this.value;recalcKm('+i+')')+
      wrInp(e.kmWeek,'kmWeek',i,true,null,'wrKm'+i)+wrInp(e.fuelQty,'fuelQty',i)+wrInp(e.fuelAmount,'fuelAmount',i)+
      wrInp(e.maintenanceCost,'maintenanceCost',i)+wrInp(e.maintenanceDetails,'maintenanceDetails',i)+
      wrInp(e.tyreChangeKm,'tyreChangeKm',i)+wrInp(e.batteryChangeKm,'batteryChangeKm',i)+wrInp(e.trafficPenaltyRs,'trafficPenaltyRs',i)+
      '<td><select onchange="ENT['+i+'].condition=this.value"><option'+(e.condition==='Good'?' selected':'')+'>Good</option><option'+(e.condition==='Fair'?' selected':'')+'>Fair</option><option'+(e.condition==='Poor'?' selected':'')+'>Poor</option><option'+(e.condition==='Under Repair'?' selected':'')+'>Under Repair</option></select></td>'+
      wrInp(e.nextServiceKm,'nextServiceKm',i)+'</tr>';
  }).join('');
}
function weeklyReportStaff(){
  var wk=weekNo(),wr=weekRange(),rep=currentWeekReport();
  if(!ENT.length)ENT=buildWeeklyEntries();
  var n=ENT.length,vehBlock='';
  if(!n)vehBlock='<div class="card" style="color:#94a3b8;text-align:center;padding:24px">No vehicles for <b>'+h(FLEET_BRANCH)+'</b> — ask management to add vehicles in Management Portal.</div>';
  else if(n<=3){
    var hint=n===1?'Single-vehicle branch — fill the card below.':(n===2?'Two vehicles — one card per vehicle.':'Three vehicles — one card per vehicle.');
    vehBlock='<div class="wr-count">🚗 '+n+' vehicle'+(n===1?'':'s')+' · Card view</div><p class="rpt-note">'+hint+' Data from Management Portal. Opening meter from last week closing reading.</p><div class="veh-cards-grid">'+ENT.map(wrVehicleCard).join('')+'</div>';
  } else {
    vehBlock='<div class="wr-count">🚗 '+n+' vehicles · Table view (Corporate Office / multi-vehicle branch)</div><p class="rpt-note">Scroll the table sideways on mobile. Each row is one vehicle for the week.</p>'+
      '<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl" style="min-width:2200px"><thead><tr>'+
      '<th>S.No</th><th>Reg No.</th><th>Model</th><th>Driver</th><th>DL Valid</th><th>Insurance</th><th>PUC</th>'+
      '<th>Odo Open</th><th>Odo Close</th><th>Total KM</th><th>Fuel (L)</th><th>Fuel ₹</th>'+
      '<th>Maint ₹</th><th>Maint Details</th><th>Tyre KM</th><th>Battery KM</th><th>Traffic Pen ₹</th><th>Condition</th><th>Next Svc KM</th>'+
      '</tr></thead><tbody>'+wrVehicleTable()+'</tbody></table></div>';
  }
  var statusMsg=rep?'<div class="alert green" style="margin-bottom:12px">✓ Report for <b>'+wk+'</b> already submitted. You may update and re-submit before Saturday 5 PM.</div>':'';
  var framed='<div class="wr-doc-frame"><div class="wr-doc-inner">'+
    '<div class="wr-section-box"><div class="wr-section-title">Section A — Branch Details</div>'+
    '<div class="rpt-meta">'+
    '<div class="fld"><label>Branch Name</label><input value="'+a(FLEET_BRANCH)+'" readonly></div>'+
    '<div class="fld"><label>Reporting Week No.</label><input id="wrWeek" value="'+wk+'"></div>'+
    '<div class="fld"><label>From Date</label><input id="wrFrom" type="date" value="'+wr.from+'"></div>'+
    '<div class="fld"><label>To Date</label><input id="wrTo" type="date" value="'+wr.to+'"></div>'+
    '<div class="fld"><label>Submitted By *</label><input id="wrBy" placeholder="Name &amp; Designation" value="'+a(rep?rep.submittedBy:'')+'"></div>'+
    '<div class="fld"><label>Date of Submission</label><input id="wrDate" type="date" value="'+new Date().toISOString().slice(0,10)+'"></div></div></div>'+
    '<div class="wr-section-box"><div class="wr-section-title">Section B — Vehicle Details ('+n+' vehicle'+(n===1?'':'s')+')</div>'+vehBlock+'</div>'+
    '<div class="rpt-decl">Declaration: I hereby certify that the above information is true and correct to the best of my knowledge.</div>'+
    '<div style="text-align:center;margin:8px 0 4px"><button class="btn green" onclick="submitWeeklyStaff()">✓ Submit Weekly Vehicle Report</button></div>'+
    '</div></div>';
  var body='<div class="alert amber" style="margin-bottom:12px">⏰ Every branch submits this report — <b>Saturday before 5:00 PM</b></div>'+statusMsg+framed;
  el('content').innerHTML=reportWrap('Weekly Vehicle Report',h(FLEET_BRANCH)+' · '+wk+' · '+wr.from+' to '+wr.to,portalBadge(),body);
}
function wrFld(lbl,val,key,i,num){return '<div><label>'+lbl+'</label><input value="'+a(val)+'" '+(num?'type="number"':'')+' oninput="ENT['+i+'][\\''+key+'\\']='+(num?'+this.value':'this.value')+'"></div>';}
function submitWeeklyStaff(){
  if(!el('wrBy').value){alert('Please enter Submitted By.');return;}
  var rid='wr'+Date.now();
  var rep={id:rid,reportCode:reportCode(FLEET_BRANCH,el('wrWeek').value,rid),branchId:FLEET_BRANCH,weekNo:el('wrWeek').value,fromDate:el('wrFrom').value,toDate:el('wrTo').value,submittedBy:el('wrBy').value,submittedAt:new Date().toISOString(),entries:ENT,active:true};
  api('load').then(function(res){var prev=(res.j.reports||[]).filter(function(r){return !(r.branchId===FLEET_BRANCH&&r.weekNo===rep.weekNo);});
    return api('saveReports',{reports:prev.concat([rep])});}).then(function(res){if(res.s===200){alert('Report saved with code '+rep.reportCode+'. Analysis email sent to your branch HOD (Director copied).');R=R.filter(function(r){return !(r.branchId===FLEET_BRANCH&&r.weekNo===rep.weekNo);});R.push(rep);ENT=[];weeklyReportStaff();}else alert(res.j.error||'Could not save');});
}
function branchVehicles(){
  var rows=branchVehiclesList().filter(function(v){return v.active!==false;}).map(function(v){
    var miss=missingFields(v);
    return '<tr><td><b>'+h(v.regNo)+'</b>'+(miss.length?'<br><span class="miss">Missing: '+miss.join(', ')+'</span>':'')+'</td><td>'+h(v.makeModel||v.vehicleName)+'</td><td>'+h(v.vehicleType||'—')+'</td><td>'+h(v.fuelType||'—')+'</td><td>'+h(v.chassisNo||'—')+'</td><td>'+h(v.insuranceValid)+'</td><td>'+h(v.pucValid)+'</td><td>'+h(v.vehicleCondition||'Good')+'</td><td>'+h(v.driverName||'—')+'</td><td>'+h(v.nextServiceDue||'—')+'</td><td>'+h(v.lastOdoReading||'—')+'</td></tr>';
  }).join('');
  el('content').innerHTML=withFooter('<div class="readonly-banner">📌 Vehicle master data is maintained in the <b>Management Portal</b> only. Data entered there is remembered until changed.</div>'+
    '<div class="card"><b style="color:#fff">Vehicle Data — '+h(FLEET_BRANCH)+' (View Only)</b>'+
    '<p style="color:#94a3b8;font-size:12px;margin:8px 0">Your branch vehicles from Management portal. Enter weekly usage in <b>Submit Weekly Report</b>.</p>'+
    '<div class="tblwrap"><table><thead><tr><th>Reg No</th><th>Model</th><th>Type</th><th>Fuel</th><th>Chassis</th><th>Insurance</th><th>PUC</th><th>Condition</th><th>Driver</th><th>Next Service</th><th>Last Odo</th></tr></thead><tbody>'+
    (rows||'<tr><td colspan="11" style="color:#64748b;text-align:center">No vehicles yet — ask management to add vehicles in Management Portal.</td></tr>')+'</tbody></table></div></div>');
}
function staffHelp(){
  el('content').innerHTML=withFooter('<div class="card"><b style="color:#fff">User Manual &amp; Troubleshooting</b>'+
    '<p style="color:#94a3b8;margin:12px 0">Step-by-step guides for branch HODs and staff.</p>'+
    '<p style="margin-top:14px"><a class="btn" href="/fleet/manual" target="_blank" style="text-decoration:none;display:inline-block;margin-right:8px">📖 User Manual</a>'+
    '<a class="btn grey" href="/fleet/troubleshooting" target="_blank" style="text-decoration:none;display:inline-block">🔧 Troubleshooting</a></p></div>');
}
function fleetManual(){
  el('content').innerHTML=reportWrap('User Manual','HOD / Staff &amp; Management — step-by-step guides',portalBadge(),
    '<div class="card" style="padding:0;overflow:hidden;border-radius:10px"><iframe src="/fleet/manual" title="Agile Fleet User Manual" style="width:100%;min-height:78vh;border:none;display:block;background:#e8f5f3"></iframe></div>');
}
function fleetTroubleshooting(){
  el('content').innerHTML=reportWrap('Troubleshooting','Common fixes for branch and management users',portalBadge(),
    '<div class="card" style="padding:0;overflow:hidden;border-radius:10px"><iframe src="/fleet/troubleshooting" title="Agile Fleet Troubleshooting" style="width:100%;min-height:78vh;border:none;display:block;background:#e8f5f3"></iframe></div>');
}

if(otpRestoreSession())onOtpLogin({});
</script></body></html>`

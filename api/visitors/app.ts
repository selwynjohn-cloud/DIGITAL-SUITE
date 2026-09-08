import type { VercelRequest, VercelResponse } from '@vercel/node'
import { otpLoginHtml, otpLoginScript } from '../_lib/embedded-otp.js'
import { SUITE_APP_FOOTER_CSS, suiteAppOpenPageFooterHtml } from '../_lib/suite-app-footer.js'
import { SUITE_TAP_FEEDBACK_CSS } from '../_lib/suite-tap-feedback.js'

async function avmPage() {
  return PAGE.replace(
    '__AVM_LOGIN__',
    otpLoginHtml('Agile Security Force Private Limited', 'Visitor Management — Agile email · Send PIN · log in'),
  ).replace(
    '__AVM_OTP_SCRIPT__',
    otpLoginScript('visitors', 'Agile Visitors Management', 'management'),
  )
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(await avmPage())
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Visitors Management</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:14px}
#login{max-width:380px;margin:0 auto;padding-top:10vh}
.card{background:#111a30;border:1px solid #22304f;border-radius:14px;padding:24px;margin-bottom:16px}
.card h2{color:#fff;margin-bottom:8px}
input,select,textarea{width:100%;padding:9px 11px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:14px}
textarea{min-height:88px}label{display:block;font-size:12px;color:#94a3b8;margin:8px 0 3px;font-weight:700}
.btn{padding:11px 18px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:14px;background:#0ea5e9;color:#fff}
.gold{background:#c9a84c;color:#14224f}.grey{background:#334155;color:#e2e8f0}.green{background:#16a34a;color:#fff}.r{background:#dc2626;color:#fff}
.row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.msg{padding:10px;border-radius:8px;font-size:14px;margin-top:10px;display:none;background:#3a0a0a;color:#ef4444}
#shell{display:none;height:100vh}
.side{position:fixed;top:0;left:0;bottom:0;width:240px;background:#0e1730;border-right:1px solid #22304f;display:flex;flex-direction:column;overflow-y:auto}
.brand{padding:18px 16px;text-align:center;border-bottom:1px solid #22304f}.brand img{height:48px;background:transparent}.brand b{display:block;color:#fff;font-size:13px;margin-top:6px;line-height:1.35}.brand small{color:#38bdf8;font-size:11px}
.menu{padding:8px;flex:1}.mi{display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:9px;color:#cbd5e1;cursor:pointer;font-weight:600}.mi:hover{background:#16223f}.mi.active{background:#0ea5e9;color:#fff}
.mi.head{cursor:default;color:#c9a84c;font-size:11px;text-transform:uppercase;letter-spacing:.04em;padding:14px 13px 6px;opacity:.95}.mi.head:hover{background:transparent}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-top:8px}
.khead{color:#c9a84c;font-size:13px;font-weight:800;margin:18px 0 4px}
.kpi{border-radius:12px;padding:16px;min-height:110px}.kpi b{display:block;font-size:26px;color:#fff;margin-bottom:4px;line-height:1.15}.kpi span{color:#fff;font-size:12px;font-weight:800}.kpi small{display:block;color:rgba(255,255,255,.88);font-size:11px;margin-top:6px;font-weight:600}
.kpi.c1{background:linear-gradient(135deg,#0ea5e9,#0369a1)}.kpi.c2{background:linear-gradient(135deg,#8b5cf6,#5b21b6)}.kpi.c3{background:linear-gradient(135deg,#10b981,#047857)}.kpi.c4{background:linear-gradient(135deg,#f59e0b,#b45309)}.kpi.c5{background:linear-gradient(135deg,#ef4444,#991b1b)}.kpi.c6{background:linear-gradient(135deg,#14b8a6,#0f766e)}.kpi.c7{background:linear-gradient(135deg,#f97316,#c2410c)}.kpi.c8{background:linear-gradient(135deg,#6366f1,#3730a3)}.kpi.c9{background:linear-gradient(135deg,#ec4899,#9d174d)}.kpi.c10{background:linear-gradient(135deg,#06b6d4,#0e7490)}
.logout{padding:12px 16px;border-top:1px solid #22304f;color:#94a3b8;cursor:pointer;font-size:13px}
.main{margin-left:240px;min-height:100vh}
.bar{background:#111a30;border-bottom:1px solid #22304f;padding:12px 18px;display:flex;justify-content:space-between;align-items:center}
.bar b{color:#fff;font-size:16px}.content{padding:18px}
.burger{display:none;background:#0ea5e9;color:#fff;border:none;border-radius:8px;padding:8px 12px;font-weight:800}
@media(max-width:820px){.side{transform:translateX(-100%);transition:.2s;z-index:50}.side.open{transform:none}.main{margin-left:0}.burger{display:inline-block}}
.tblwrap{overflow-x:auto;border:1px solid #22304f;border-radius:8px}table{border-collapse:collapse;width:100%;font-size:13px}
th,td{border:1px solid #22304f;padding:6px;text-align:left}th{background:#0b1220;color:#94a3b8;font-size:11px;text-transform:uppercase}
.avmpop{position:fixed;inset:0;background:rgba(2,6,23,.62);z-index:80;display:flex;align-items:center;justify-content:center;padding:16px}
.avmpop-box{background:#111a30;border:1px solid #22304f;border-radius:14px;padding:22px;max-width:420px;width:100%}
.avmpop-box h2{color:#fff;margin-bottom:8px}
${SUITE_TAP_FEEDBACK_CSS}
${SUITE_APP_FOOTER_CSS}
</style></head>
<body>
__AVM_LOGIN__
<div id="shell">
  <div class="side" id="side">
    <div class="brand"><img src="https://www.agilegroup-digital.co.in/agile-logo-clear.png" alt="Agile"><b>Agile Management</b></div>
    <div class="menu" id="menu"></div>
    <div class="logout" onclick="logout()">⎋ Logout</div>
  </div>
  <div class="main">
    <div class="bar"><div style="display:flex;align-items:center;gap:12px"><button class="burger" onclick="document.getElementById('side').classList.toggle('open')">☰</button><b id="ttl">Client Registration</b></div><span id="userLine" style="color:#94a3b8;font-size:12px">Management</span></div>
    <div class="content" id="content"></div>
  </div>
</div>
<script>
__AVM_OTP_SCRIPT__
OTP_ROLE='management';
var BOOT=null,CUR=0,EDIT=null,EDITG=null,EDITD=null,MIS_CLIENTS=[],MIS_BOOK={},DASH_CLIENT='ALL',ANAL_CLIENT='ALL',LIST_CLIENT='ALL';
var MGMT_MENU=[
  {n:'Agile Administration',fn:'',icon:'',head:true},
  {n:'Dashboard',fn:'avmDash',icon:'📊'},
  {n:'Clients Registrations',fn:'clientReg',icon:'🏢'},
  {n:'Registered Clients List',fn:'registeredList',icon:'📋'},
  {n:'Service complaints List',fn:'complaintListPage',icon:'🎫'},
  {n:'Add Complaints',fn:'complaintAdd',icon:'➕'},
  {n:'Client Administration',fn:'',icon:'',head:true},
  {n:'Staff Portal (Test)',fn:'staffPortalTest',icon:'👔'},
  {n:'Guards Portal (Test)',fn:'guardsPortalTest',icon:'🛡️'},
  {n:'User Management',fn:'users',icon:'👥'}
];
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function api(action,extra){
  return fetch('/api/visitors/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,portal:'management'},extra||{}))}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});
}
function clientList(){return (BOOT&&BOOT.clients)||[];}
function complaintList(){return (BOOT&&BOOT.complaints)||[];}
function userList(){return (BOOT&&BOOT.users)||[];}
function guardList(){return (BOOT&&BOOT.guardLogs)||[];}
function clientOpts(sel){
  return '<option value="">— Client Name (select) —</option>'+clientList().map(function(c){return '<option value="'+a(c.id)+'"'+(sel===c.id?' selected':'')+'>'+h(c.companyName)+'</option>';}).join('');
}
function misBranches(){return (BOOT&&BOOT.misBranches)||[];}
function branchOpts(sel){
  return '<option value="">— Branch Name —</option>'+misBranches().map(function(b){return '<option value="'+a(b.id)+'"'+(sel===b.id?' selected':'')+'>'+h(b.name)+'</option>';}).join('');
}
function clientBookOpts(sel){
  return '<option value="">— Name Of the Client —</option>'+MIS_CLIENTS.map(function(c){
    var lab=c.name+(c.location?' — '+c.location:'');
    return '<option value="'+a(c.id)+'"'+(sel===c.id?' selected':'')+'>'+h(lab)+'</option>';
  }).join('');
}
function rememberTab(i){try{sessionStorage.setItem('avm_mgmt_tab',String(i));}catch(e){}}
function lastTab(){
  try{var n=parseInt(sessionStorage.getItem('avm_mgmt_tab')||'-1',10);if(n>=0&&n<MGMT_MENU.length&&MGMT_MENU[n]&&MGMT_MENU[n].fn)return n;}catch(e){}
  for(var i=0;i<MGMT_MENU.length;i++){if(MGMT_MENU[i].fn)return i;}
  return 1;
}
function buildMenu(){
  el('menu').innerHTML=MGMT_MENU.map(function(m,i){
    if(m.head)return '<div class="mi head">'+h(m.n)+'</div>';
    return '<div class="mi'+(CUR===i?' active':'')+'" onclick="tab('+i+')"><span>'+m.icon+'</span>'+h(m.n)+'</div>';
  }).join('');
}
function tab(i){
  if(!MGMT_MENU[i]||MGMT_MENU[i].head||!MGMT_MENU[i].fn)return;
  CUR=i;EDIT=null;rememberTab(i);buildMenu();el('ttl').textContent=MGMT_MENU[i].n;el('side').classList.remove('open');
  var fn=window[MGMT_MENU[i].fn];
  if(typeof fn==='function')fn();
}
function reload(then){
  return api('boot').then(function(res){
    if(res.s===401){if(typeof otpHandleUnauthorized==='function')otpHandleUnauthorized();return;}
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not load.');return;}
    BOOT=res.j;if(el('userLine'))el('userLine').textContent=(res.j.name||res.j.email||'')+' · Management';if(then)then();
  });
}
function applyLogin(res){
  BOOT=res.j;
  if(el('userLine'))el('userLine').textContent=(res.j.name||res.j.email||'')+' · Management';
  el('login').style.display='none';el('shell').style.display='block';buildMenu();tab(lastTab());
}
function onOtpLogin(){
  api('boot').then(function(res){
    if(res.s===401){if(typeof otpHandleUnauthorized==='function')otpHandleUnauthorized();else otpMsg(res.j.error||'Please sign in again.',false);return;}
    if(res.s!==200){otpMsg(res.j.error||'Could not sign in.',false);return;}
    applyLogin(res);
  }).catch(function(){otpMsg('Network error. Please try again.',false);});
}
function logout(){otpLogout();}
function flash(id,ok,text){var m=el(id);if(!m)return;m.style.display='block';m.style.background=ok?'#052e16':'#3a0a0a';m.style.color=ok?'#86efac':'#ef4444';m.textContent=text;}
function visitList(){return (BOOT&&BOOT.visits)||[];}
function allClientOpts(sel){
  var cur=sel||'ALL';
  return '<option value="ALL"'+(cur==='ALL'?' selected':'')+'>All clients</option>'+clientList().map(function(c){return '<option value="'+a(c.id)+'"'+(cur===c.id?' selected':'')+'>'+h(c.companyName)+'</option>';}).join('');
}
function kpi(n,lab,cls,sub){return '<div class="kpi '+cls+'"><b>'+h(String(n))+'</b><span>'+h(lab)+'</span>'+(sub?'<small>'+h(sub)+'</small>':'')+'</div>';}
function dashRows(clientId){
  var all=clientId==='ALL';
  var vis=visitList().filter(function(v){return all||v.clientId===clientId;});
  var comps=complaintList().filter(function(c){return all||c.clientId===clientId;});
  var duts=dutyList().filter(function(d){return all||d.clientId===clientId;});
  var staff=userList().filter(function(u){return all||u.clientId===clientId;});
  var byDay={};
  vis.forEach(function(v){var k=String(v.visitDate||'')+'|'+String(v.clientName||'');byDay[k]=(byDay[k]||0)+1;});
  var foot={n:0,name:'—'};
  var low={n:0,name:'—'};
  var dayKeys=Object.keys(byDay);
  Object.keys(byDay).forEach(function(k){if(byDay[k]>foot.n){foot={n:byDay[k],name:k.split('|')[1]||'—'};}});
  if(dayKeys.length){
    low={n:byDay[dayKeys[0]],name:dayKeys[0].split('|')[1]||'—'};
    dayKeys.forEach(function(k){if(byDay[k]<low.n){low={n:byDay[k],name:k.split('|')[1]||'—'};}});
  }else if(!all){
    var one=clientList().filter(function(c){return c.id===clientId;})[0];
    low={n:0,name:one?one.companyName:'—'};
  }
  var byShift={};
  vis.forEach(function(v){var k=String(v.visitDate||'')+'|'+String(v.clientId||'')+'|'+String(v.shift||'');byShift[k]=(byShift[k]||0)+1;});
  var mx={n:0,guard:'—'};
  Object.keys(byShift).forEach(function(k){
    if(byShift[k]>mx.n){
      var p=k.split('|');
      var d=dutyList().filter(function(x){return x.ymd===p[0]&&x.clientId===p[1]&&x.shift===p[2];})[0];
      mx={n:byShift[k],guard:d&&d.guardName?d.guardName:'—'};
    }
  });
  var reqs=comps.length;
  var solved=comps.filter(function(c){return c.status==='completed';}).length;
  return {
    usage:all?clientList().length:1,
    users:staff.filter(function(u){return u.active!==false;}).length+duts.length,
    visitors:vis.length,
    requests:reqs,
    solved:solved,
    balance:reqs-solved,
    footN:foot.n,
    footName:foot.name,
    lowN:low.n,
    lowName:low.name,
    maxN:mx.n,
    maxGuard:mx.guard
  };
}
function visitShiftLetter(v){
  var t=String(v&&v.shift||'');
  if(t.indexOf('Shift B')>=0||t.indexOf('Afternoon')>=0)return 'B';
  if(t.indexOf('Shift C')>=0||t.indexOf('Night')>=0)return 'C';
  return 'A';
}
function timeToShift(raw){
  var t=String(raw||'');
  var h=parseInt(t.replace(/[^0-9]/g,' ').trim(),10);
  if(isNaN(h)){
    var d=new Date(t);
    if(!isNaN(d.getTime()))h=d.getHours();
  }
  if(isNaN(h))return 'A';
  if(h>=6&&h<14)return 'A';
  if(h>=14&&h<22)return 'B';
  return 'C';
}
function visitMins(v){
  var t=String(v&&v.hoursSpent||'');
  if(!t||t==='—'||t.toLowerCase().indexOf('in premises')>=0)return -1;
  var p=t.split(':');
  if(p.length<2)return -1;
  return (Number(p[0])||0)*60+(Number(p[1])||0);
}
function fmtMins(m){
  if(m==null||m<0)return '—';
  return Math.floor(m/60)+':'+String(m%60).padStart(2,'0');
}
function isBreach(c){
  var t=String(c&&c.issue||'').toLowerCase();
  return t.indexOf('breach')>=0||t.indexOf('security incident')>=0||t.indexOf('theft')>=0||t.indexOf('intrusion')>=0;
}
function filteredVisits(clientId){
  return visitList().filter(function(v){return clientId==='ALL'||v.clientId===clientId;});
}
function handledAll(){
  var vis=visitList();
  var byDay={};
  vis.forEach(function(v){var k=String(v.visitDate||'')+'|'+String(v.clientName||'');byDay[k]=(byDay[k]||0)+1;});
  var foot={n:0,name:'—'};
  var low={n:0,name:'—'};
  var dayKeys=Object.keys(byDay);
  dayKeys.forEach(function(k){if(byDay[k]>foot.n){foot={n:byDay[k],name:k.split('|')[1]||'—'};}});
  if(dayKeys.length){
    low={n:byDay[dayKeys[0]],name:dayKeys[0].split('|')[1]||'—'};
    dayKeys.forEach(function(k){if(byDay[k]<low.n){low={n:byDay[k],name:k.split('|')[1]||'—'};}});
  }
  var byShift={};
  vis.forEach(function(v){
    var k=String(v.visitDate||'')+'|'+String(v.clientId||'')+'|'+String(v.shift||'');
    if(!byShift[k])byShift[k]={n:0,name:v.clientName||'—'};
    byShift[k].n++;
  });
  var mx={n:0,name:'—'};
  Object.keys(byShift).forEach(function(k){if(byShift[k].n>mx.n)mx=byShift[k];});
  var gMax={n:0,name:'—'};
  guardList().forEach(function(g){
    var n=Number(g.visitorsHandled)||0;
    if(n>gMax.n)gMax={n:n,name:g.clientName||'—'};
  });
  if(!gMax.n)gMax={n:mx.n,name:mx.name};
  return {foot:foot,low:low,maxShift:mx,guard:gMax};
}
function analysisStats(clientId){
  var vis=filteredVisits(clientId);
  var shiftA=0,shiftB=0,shiftC=0;
  vis.forEach(function(v){
    var L=visitShiftLetter(v);
    if(L==='B')shiftB++;
    else if(L==='C')shiftC++;
    else shiftA++;
  });
  var mins=[];
  vis.forEach(function(v){var m=visitMins(v);if(m>=0)mins.push(m);});
  var short=mins.length?Math.min.apply(null,mins):-1;
  var long=mins.length?Math.max.apply(null,mins):-1;
  var avg=mins.length?Math.round(mins.reduce(function(s,n){return s+n;},0)/mins.length):-1;
  var byDept={};
  vis.forEach(function(v){
    var d=String(v.hostDept||'').trim();
    if(!d)return;
    byDept[d]=(byDept[d]||0)+1;
  });
  var dHigh={n:0,name:'—'},dLow={n:0,name:'—'};
  var dks=Object.keys(byDept);
  if(dks.length){
    dHigh={n:byDept[dks[0]],name:dks[0]};
    dLow={n:byDept[dks[0]],name:dks[0]};
    dks.forEach(function(k){
      if(byDept[k]>dHigh.n)dHigh={n:byDept[k],name:k};
      if(byDept[k]<dLow.n)dLow={n:byDept[k],name:k};
    });
  }
  var hr=vis.filter(function(v){
    var t=(String(v.hostDept||'')+' '+String(v.hostName||'')).toLowerCase();
    return t.indexOf('hr')>=0||t.indexOf('interview')>=0||t.indexOf('human resource')>=0;
  }).length;
  var byPerson={};
  vis.forEach(function(v){
    var k=String(v.visitorMobile||v.visitorName||v.id);
    if(!byPerson[k])byPerson[k]={n:0,name:v.visitorName||'—'};
    byPerson[k].n++;
  });
  var fHigh={n:0,name:'—'},fLow={n:0,name:'—'};
  var pks=Object.keys(byPerson);
  if(pks.length){
    fHigh={n:byPerson[pks[0]].n,name:byPerson[pks[0]].name};
    fLow={n:byPerson[pks[0]].n,name:byPerson[pks[0]].name};
    pks.forEach(function(k){
      if(byPerson[k].n>fHigh.n)fHigh={n:byPerson[k].n,name:byPerson[k].name};
      if(byPerson[k].n<fLow.n)fLow={n:byPerson[k].n,name:byPerson[k].name};
    });
  }
  var fAvg=pks.length?Math.round((vis.length/pks.length)*10)/10:0;
  var brA=0,brB=0,brC=0;
  complaintList().filter(function(c){return clientId==='ALL'||c.clientId===clientId;}).forEach(function(c){
    if(!isBreach(c))return;
    var L=timeToShift(c.time||c.createdAt);
    if(L==='B')brB++;
    else if(L==='C')brC++;
    else brA++;
  });
  return {shiftA:shiftA,shiftB:shiftB,shiftC:shiftC,short:short,long:long,avg:avg,dHigh:dHigh,dLow:dLow,hr:hr,fHigh:fHigh,fLow:fLow,fAvg:fAvg,brA:brA,brB:brB,brC:brC};
}
function analysisVisits(){
  return filteredVisits(LIST_CLIENT).slice().sort(function(a,b){
    return String(b.visitDate||'').localeCompare(String(a.visitDate||''))||String(b.inTime||'').localeCompare(String(a.inTime||''));
  });
}
function avmDash(){
  var u=dashRows(DASH_CLIENT);
  var hnd=handledAll();
  var a=analysisStats(ANAL_CLIENT);
  var rows=analysisVisits();
  var body=rows.map(function(v,i){
    var letter=visitShiftLetter(v);
    var total=(Number(v.previousVisits)||0)+1;
    return '<tr><td>'+(i+1)+'</td><td>'+h(v.visitorName)+'</td><td>'+h(v.hostName||'—')+'</td><td>'+h(v.hoursSpent||'—')+'</td><td>'+h(v.previousVisits)+'</td><td>'+(letter==='A'?1:'')+'</td><td>'+(letter==='B'?1:'')+'</td><td>'+(letter==='C'?1:'')+'</td><td>'+total+'</td></tr>';
  }).join('')||'<tr><td colspan="9">No visitors yet for this client.</td></tr>';
  el('content').innerHTML='<div class="card"><h2>1. AVM Usage Report</h2>'+
    '<label>Client Name</label><select id="uclient" onchange="onUsageClient()">'+allClientOpts(DASH_CLIENT)+'</select>'+
    '<p style="color:#94a3b8;margin-top:10px">Pick All clients or one registered client.</p>'+
    '<div class="kpis">'+
      kpi(u.usage,'AVM usage report','c1')+
      kpi(u.users,'No of users','c2')+
      kpi(u.visitors,'Total visitors','c3')+
      kpi(u.requests,'Service Requests','c4')+
      kpi(u.solved,'Service request solved','c5')+
      kpi(u.balance,'Service Balance','c6')+
    '</div></div>'+
    '<div class="card"><h2>2. Visitor analysis</h2>'+
    '<h3 class="khead">Visitors Handled</h3>'+
    '<p style="color:#94a3b8">All clients. Number / Client name.</p>'+
    '<div class="kpis">'+
      kpi(hnd.foot.n,'Highest per day','c7','No / Client name: '+hnd.foot.name)+
      kpi(hnd.low.n,'Lowest per day','c9','No / Client name: '+hnd.low.name)+
      kpi(hnd.maxShift.n,'Max per shift','c8','No / Client name: '+hnd.maxShift.name)+
      kpi(hnd.guard.n,'Highest Handled Guard','c4','No / Client name: '+hnd.guard.name)+
    '</div>'+
    '<h3 class="khead">Visitor analysis</h3>'+
    '<label>Client Name</label><select id="aclient" onchange="onAnalClient()">'+allClientOpts(ANAL_CLIENT)+'</select>'+
    '<h3 class="khead">Shift Banners</h3>'+
    '<div class="kpis">'+
      kpi(a.shiftA,'A shift','c1')+
      kpi(a.shiftB,'B shift','c2')+
      kpi(a.shiftC,'C shift','c3')+
    '</div>'+
    '<h3 class="khead">Visit Duration</h3>'+
    '<div class="kpis">'+
      kpi(fmtMins(a.short),'Short Visit','c6')+
      kpi(fmtMins(a.long),'Long Visit','c5')+
      kpi(fmtMins(a.avg),'Average time','c10')+
    '</div>'+
    '<h3 class="khead">Visit By department</h3>'+
    '<div class="kpis">'+
      kpi(a.dHigh.n,'Highest','c7',a.dHigh.name)+
      kpi(a.dLow.n,'Lowest','c9',a.dLow.name)+
      kpi(a.hr,'HR (interview)','c8')+
    '</div>'+
    '<h3 class="khead">Visit Frequency</h3>'+
    '<div class="kpis">'+
      kpi(a.fHigh.n,'Highest','c4',a.fHigh.name)+
      kpi(a.fLow.n,'Lowest','c2',a.fLow.name)+
      kpi(a.fAvg,'Average','c1')+
    '</div>'+
    '<h3 class="khead">Security Breach</h3>'+
    '<div class="kpis">'+
      kpi(a.brA,'A Shift','c5')+
      kpi(a.brB,'B Shift','c3')+
      kpi(a.brC,'C Shift','c7')+
    '</div></div>'+
    '<div class="card"><h2>3. Visitor Analysis, Client wise visitors List</h2>'+
    '<label>Client Name</label><select id="lclient" onchange="onListClient()">'+allClientOpts(LIST_CLIENT)+'</select>'+
    '<p style="color:#94a3b8;margin-top:10px">This list only. Share will go to the email Id you enter.</p>'+
    '<div class="row"><button class="btn gold" type="button" onclick="openShareAnalysis()">Share</button></div>'+
    '<div class="tblwrap" style="margin-top:12px"><table><thead><tr><th>Sl. no.</th><th>Visitor Name</th><th>Met whom</th><th>Time spend</th><th>Repeated visit no</th><th>A shift</th><th>B shift</th><th>C shift</th><th>Total</th></tr></thead><tbody>'+body+'</tbody></table></div></div>'+suiteAppFooter();
}
function onUsageClient(){DASH_CLIENT=(el('uclient')&&el('uclient').value)||'ALL';avmDash();}
function onAnalClient(){ANAL_CLIENT=(el('aclient')&&el('aclient').value)||'ALL';avmDash();}
function onListClient(){LIST_CLIENT=(el('lclient')&&el('lclient').value)||'ALL';avmDash();}
function closeSharePop(){var m=el('avmShareMount');if(m&&m.parentNode)m.parentNode.removeChild(m);}
function openShareAnalysis(){
  if(LIST_CLIENT==='ALL'){alert('Pick one client on Client wise visitors List. Share will go to that client.');return;}
  closeSharePop();
  var c=clientList().filter(function(x){return x.id===LIST_CLIENT;})[0];
  var wrap=document.createElement('div');
  wrap.id='avmShareMount';
  wrap.innerHTML='<div class="avmpop"><div class="avmpop-box"><h2>Share Client wise visitors List</h2>'+
    '<label>Share will go to</label><input id="shareEmail" type="email" value="'+a(c&&c.email||'')+'" placeholder="email Id">'+
    '<div class="row"><button class="btn gold" type="button" onclick="sendAnalysisShare()">Send</button>'+
    '<button class="btn grey" type="button" onclick="closeSharePop()">Cancel</button></div></div></div>';
  document.body.appendChild(wrap);
}
function sendAnalysisShare(){
  var cid=LIST_CLIENT;
  var email=el('shareEmail')&&el('shareEmail').value||'';
  if(!cid||cid==='ALL'){alert('Pick one client on Client wise visitors List. Share will go to that client.');return;}
  if(!email||email.indexOf('@')<0){alert('Enter the email Id. Share will go to this address.');return;}
  api('shareVisitorAnalysis',{clientId:cid,email:email}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not share.');return;}
    closeSharePop();
    alert('Shared. Mail will go to '+email+'.');
  });
}
function visitorsList(){
  var rows=visitList().filter(function(v){return LIST_CLIENT==='ALL'||v.clientId===LIST_CLIENT;}).slice().sort(function(a,b){return String(b.visitDate||'').localeCompare(String(a.visitDate||''));});
  var body=rows.map(function(v,i){
    return '<tr><td>'+(i+1)+'</td><td>'+h(v.visitorName)+'</td><td>'+h(v.visitorCompany||'—')+'</td><td>'+h(v.visitorMobile||'—')+'</td><td>'+h(v.inTime||'—')+'</td><td>'+h(v.outTime||'—')+'</td><td>'+h(v.hoursSpent||'—')+'</td><td>'+h(v.previousVisits)+'</td><td><button class="btn gold" type="button" onclick="shareVisit(\\''+v.id+'\\')">Share</button></td><td><input id="vem-'+a(v.id)+'" type="email" value="'+a(v.clientEmail||'')+'" placeholder="client email Id"></td></tr>';
  }).join('')||'<tr><td colspan="10">No visitors yet for this client.</td></tr>';
  el('content').innerHTML='<div class="card"><h2>2. Visitors List</h2>'+
    '<label>Client Name</label><select id="lclient" onchange="onListClient()">'+allClientOpts(LIST_CLIENT)+'</select>'+
    '<p style="color:#94a3b8;margin-top:10px">List Details. Share sends this visitor’s row to the email Id (to share with the client).</p></div>'+
    '<div class="card"><div class="tblwrap"><table><thead><tr><th>Sl. no.</th><th>Name of visitors</th><th>Company name</th><th>Contact number</th><th>In time</th><th>Out time</th><th>Hours spent in premises</th><th>Previous visits</th><th>Share</th><th>email Id</th></tr></thead><tbody>'+body+'</tbody></table></div></div>'+suiteAppFooter();
}
function shareVisit(id){
  var box=el('vem-'+id);
  var email=box&&box.value||'';
  if(!email||email.indexOf('@')<0){alert('Enter the email Id to share with the client.');return;}
  api('shareVisitor',{visitId:id,email:email}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not share.');return;}
    alert('Shared with the client.');
  });
}
function goMenu(fn){var i=menuIx(fn);if(i>=0)tab(i);}
function staffPortalTest(){clientPortalTestPage('Staff Portal (Test)','staff');}
function guardsPortalTest(){clientPortalTestPage('Guards Portal (Test)','gate');}
function clientPortalTestPage(title,door){
  var rows=clientList().slice().sort(function(a,b){return String(a.companyName||'').localeCompare(String(b.companyName||''));}).map(function(c,i){
    return '<tr><td>'+(i+1)+'</td><td>'+h(c.companyName)+'</td><td>'+h(c.staffName||'—')+'</td><td>'+h(c.mobile||'—')+'</td><td><button class="btn gold" type="button" onclick="testClientPortal(\\''+c.id+'\\',\\''+door+'\\')">Test</button></td></tr>';
  }).join('')||'<tr><td colspan="5">No registered clients yet. Use Clients Registrations first.</td></tr>';
  el('content').innerHTML='<div class="card"><h2>'+h(title)+'</h2><p style="color:#94a3b8">Pick a registered client and tap Test. The company '+h(door==='staff'?'Staff':'Gate')+' door opens. No Agile email PIN on that page.</p></div>'+
    '<div class="card"><div class="tblwrap"><table><thead><tr><th>sl.</th><th>Client Name</th><th>Staff name</th><th>mobile</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+suiteAppFooter();
}
function testClientPortal(id,door){
  var c=clientList().filter(function(x){return x.id===id;})[0];
  if(!c||!c.linkUrl){alert('Save the client first. The link is made automatically.');return;}
  var url=c.linkUrl+(String(c.linkUrl).indexOf('#')>=0?'':'')+(door==='staff'?'#staff':'#gate');
  window.open(url,'_blank');
}

function draftGet(){try{return JSON.parse(sessionStorage.getItem('avm_reg_draft')||'null');}catch(e){return null;}}
function draftSet(){
  if(!el('cbranch'))return;
  try{sessionStorage.setItem('avm_reg_draft',JSON.stringify({id:el('cid').value,branchId:el('cbranch').value,misClientId:el('cclient').value,sanctionedPosts:el('csan').value,staffName:el('cstaff').value,designation:el('cdesig').value,mobile:el('cmob').value,email:el('cemail').value,linkUrl:el('clink').value}));}catch(e){}
}
function draftClear(){try{sessionStorage.removeItem('avm_reg_draft');}catch(e){}}
function setSanNote(text,ok){
  var n=el('csanNote');if(!n)return;
  n.textContent=text||'';
  n.style.color=ok?'#86efac':'#fde68a';
}
function misSan(site){var n=site&&Number(site.sanctionedPosts);return n>0?String(n):'';}
function clientReg(){
  var e=EDIT||(!EDIT&&draftGet())||{};
  el('content').innerHTML='<div class="card"><h2>Clients Registrations</h2>'+
    '<p style="color:#94a3b8;margin-bottom:10px">Pick the Agile branch, then the MIS client. Sanctioned Posts come from MIS. If MIS has no number, type it. One unique link is made for that branch and client location.</p>'+
    '<input type="hidden" id="cid" value="'+a(e.id||'')+'">'+
    '<label>Branch Name *</label><select id="cbranch" onchange="onBranchChange()">'+branchOpts(e.branchId||'')+'</select>'+
    '<label>Name Of the Client *</label><select id="cclient" onchange="onClientPick()">'+clientBookOpts(e.misClientId||'')+'</select>'+
    '<label>Sanctioned Posts</label><input id="csan" inputmode="numeric" value="'+a(e.sanctionedPosts||'')+'">'+
    '<p id="csanNote" style="font-size:12px;color:#94a3b8;margin-top:4px">Pick a client — we fetch from MIS. If it cannot fetch, type the number.</p>'+
    '<label>Name Of the Staff (client) *</label><input id="cstaff" value="'+a(e.staffName||'')+'">'+
    '<label>Designation</label><input id="cdesig" value="'+a(e.designation||'')+'">'+
    '<label>Phone *</label><input id="cmob" inputmode="numeric" value="'+a(e.mobile||'')+'">'+
    '<label>Email ID *</label><input id="cemail" type="email" value="'+a(e.email||'')+'">'+
    '<label>Link to Client</label><input id="clink" readonly value="'+a(e.linkUrl||'')+'" placeholder="Saved automatically — unique for this Branch and Client">'+
    '<div class="row">'+
      '<button class="btn green" type="button" onclick="saveClient()">Save</button>'+
      '<button class="btn grey" type="button" onclick="reviewWelcome()">Review</button>'+
      '<button class="btn gold" type="button" onclick="sendWelcome()">Send</button>'+
    '</div>'+
    '<div class="msg" id="cmsg"></div></div>'+suiteAppFooter();
  ['cbranch','cclient','csan','cstaff','cdesig','cmob','cemail'].forEach(function(id){var x=el(id);if(x)x.addEventListener('change',draftSet);});
  if(e.branchId)loadMisClients(e.branchId,e.misClientId||'',e.sanctionedPosts||'');
}
function onBranchChange(){
  el('csan').value='';
  setSanNote('Pick Name Of the Client — we fetch Sanctioned Posts from MIS.');
  draftSet();
  loadMisClients(el('cbranch').value,'','');
}
function loadMisClients(branchId,sel,keepSan){
  var box=el('cclient');
  if(!box)return;
  if(!branchId){MIS_CLIENTS=[];box.innerHTML=clientBookOpts('');return;}
  function paint(list){
    MIS_CLIENTS=list||[];
    box.innerHTML=clientBookOpts(sel||'');
    if(sel)onClientPick(keepSan);
  }
  if(MIS_BOOK[branchId]){paint(MIS_BOOK[branchId]);return;}
  box.innerHTML='<option value="">Loading from MIS…</option>';
  api('misClients',{branchId:branchId}).then(function(res){
    if(res.s!==200){
      box.innerHTML='<option value="">Could not load MIS clients — pick again or type Sanctioned Posts</option>';
      setSanNote('Could not fetch from MIS. Please type Sanctioned Posts.',false);
      return;
    }
    MIS_BOOK[branchId]=res.j.clients||[];
    paint(MIS_BOOK[branchId]);
  }).catch(function(){
    box.innerHTML='<option value="">Could not load MIS clients</option>';
    setSanNote('Could not fetch from MIS. Please type Sanctioned Posts.',false);
  });
}
function onClientPick(keepSan){
  var mid=el('cclient').value;
  var bid=el('cbranch').value;
  var site=MIS_CLIENTS.filter(function(c){return c.id===mid;})[0];
  var fromMis=misSan(site);
  var saved=keepSan||'';
  if(fromMis){el('csan').value=fromMis;setSanNote('From MIS: '+fromMis+' (you may change it if needed)',true);}
  else if(saved){el('csan').value=saved;setSanNote('Saved number. MIS has no sanctioned posts — you may type a new one.',false);}
  else {el('csan').value='';setSanNote('Not in MIS — please type Sanctioned Posts.',false);}
  var hit=clientList().filter(function(c){return c.id!==el('cid').value&&c.branchId===bid&&c.misClientId===mid;})[0];
  if(hit){alert('already issued');el('clink').value=hit.linkUrl||'';}
  draftSet();
}
function addClient(){EDIT=null;draftClear();goMenu('clientReg');}
function editReg(id){EDIT=clientList().filter(function(c){return c.id===id;})[0]||null;goMenu('clientReg');}
function welcomeClientName(){
  var id=el('cid')&&el('cid').value||'';
  var saved=clientList().filter(function(c){return c.id===id;})[0];
  if(saved&&saved.companyName)return saved.companyName;
  var box=el('cclient');
  if(box&&box.selectedIndex>0)return box.options[box.selectedIndex].text||'';
  return '';
}
function reviewWelcome(){
  var staff=el('cstaff')&&el('cstaff').value||'';
  var email=el('cemail')&&el('cemail').value||'';
  if(!staff||!email||email.indexOf('@')<0){alert('Fill Name Of the Staff and Email ID first.');return;}
  var id=el('cid')&&el('cid').value||'';
  api('previewWelcomeMail',{id:id,staffName:staff,clientName:welcomeClientName(),link:el('clink')&&el('clink').value||''}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not open the letter.');return;}
    el('ttl').textContent='Review Welcome letter';
    el('content').innerHTML='<div class="card"><h2>Review Welcome letter</h2><p style="color:#94a3b8">This is the letter. Mail is sent only when you tap Send. It goes to the Email ID on the form.</p>'+
      '<input type="hidden" id="cid" value="'+a(id)+'">'+
      '<div class="row"><button class="btn gold" type="button" onclick="sendWelcome()">Send</button> <button class="btn grey" type="button" onclick="clientReg()">Back</button></div></div>'+
      '<div class="card" style="background:#fff;color:#0f172a">'+(res.j.html||'')+'</div>'+suiteAppFooter();
  });
}
function sendWelcome(){
  var id=el('cid')&&el('cid').value||'';
  if(!id){alert('Save first, then Send.');return;}
  if(!confirm('Send the Welcome letter now?'))return;
  api('sendClientLink',{id:id}).then(function(res){
    if(res.s===409||(res.j&&res.j.error==='already issued')){alert('already issued');return;}
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not send.');return;}
    if(res.j&&res.j.mailError){alert(res.j.mailError);return;}
    alert('Welcome letter sent.');
    reload(clientReg);
  });
}
function saveClient(){
  flash('cmsg',true,'Saving…');
  api('saveClient',{id:el('cid').value,branchId:el('cbranch').value,misClientId:el('cclient').value,sanctionedPosts:el('csan').value,staffName:el('cstaff').value,designation:el('cdesig').value,email:el('cemail').value,mobile:el('cmob').value}).then(function(res){
    if(res.s===409||(res.j&&res.j.error==='already issued')){alert('already issued');flash('cmsg',false,'already issued');return;}
    if(res.s!==200){flash('cmsg',false,(res.j&&res.j.error)||'Could not save.');return;}
    draftClear();EDIT=res.j.client;reload(clientReg);
  });
}
function registeredList(){
  var rows=clientList().slice().sort(function(a,b){
    return String(b.registeredYmd||b.createdAt||'').localeCompare(String(a.registeredYmd||a.createdAt||''));
  }).map(function(c,i){
    var d=c.registeredYmd||(c.createdAt?String(c.createdAt).slice(0,10):'—');
    return '<tr><td>'+(i+1)+'</td><td>'+h(d)+'</td><td>'+h(c.companyName)+(c.branchName?'<br><small>'+h(c.branchName)+'</small>':'')+'</td><td>'+h(c.staffName)+'</td><td>'+h(c.mobile)+'</td><td style="max-width:220px;word-break:break-all">'+h(c.linkUrl||'—')+'</td><td>'+
      '<button class="btn grey" type="button" onclick="editReg(\\''+c.id+'\\')">Edit</button> '+
      '<button class="btn gold" type="button" onclick="sendRegLink(\\''+c.id+'\\')">Send</button> '+
      '<button class="btn" type="button" onclick="testLink(\\''+c.id+'\\')">Test</button> '+
      '<button class="btn r" type="button" onclick="delClient(\\''+c.id+'\\')">Delete</button></td></tr>';
  }).join('')||'<tr><td colspan="7">No registered clients yet. Use Clients Registrations, then this list fills date-wise.</td></tr>';
  el('content').innerHTML='<div class="card"><h2>Registered Clients List</h2><p style="color:#94a3b8">Send one unique link to each client. If they ask again, you will see <b>already issued</b>.</p>'+
    '<div class="row"><button class="btn green" type="button" onclick="addClient()">Add</button></div></div>'+
    '<div class="card"><div class="tblwrap"><table><thead><tr><th>Sl. No.</th><th>Date</th><th>Client Name</th><th>Staff name</th><th>mobile Number</th><th>link</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+suiteAppFooter();
}
function sendRegLink(id){
  var c=clientList().filter(function(x){return x.id===id;})[0];
  if(!c)return;
  if(c.linkSentAt){alert('already issued');return;}
  if(!confirm('Send this unique link to '+c.email+'?'))return;
  api('sendClientLink',{id:id}).then(function(res){
    if(res.s===409||(res.j&&res.j.error==='already issued')){alert('already issued');return;}
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not send.');return;}
    reload(registeredList);
  });
}
function delClient(id){
  if(!confirm('Delete this registered client?'))return;
  api('deleteClient',{id:id}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not delete.');return;}
    reload(registeredList);
  });
}

function statusLabel(st){
  return st==='completed'?'Completed':'Under process';
}
function complaintListPage(){
  var rows=complaintList().slice().sort(function(a,b){return String(b.createdAt||'').localeCompare(String(a.createdAt||''));}).map(function(r,i){
    var rt=r.status==='completed'?(r.respondTime||'—'):'—';
    return '<tr><td>'+(i+1)+'</td><td>'+h(r.ymd)+' '+h(r.time)+'</td><td>'+h(r.ticketNo)+'</td><td>'+h(r.clientName)+'</td><td>'+h(r.receivedFrom)+'</td><td>'+h(r.issue)+'</td><td>'+h(statusLabel(r.status))+'</td><td>'+h(rt)+'</td><td>'+
      '<button class="btn" type="button" onclick="reviewDraft(\\''+r.id+'\\')">Review Draft mail</button> '+
      '<button class="btn gold" type="button" onclick="sendComplaintMail(\\''+r.id+'\\')">Send mail</button> '+
      (r.status==='completed'?'':'<button class="btn grey" type="button" onclick="markCompleted(\\''+r.id+'\\')">Completed</button> ')+
      '<button class="btn grey" type="button" onclick="editComplaint(\\''+r.id+'\\')">Edit</button> '+
      '<button class="btn r" type="button" onclick="delComplaint(\\''+r.id+'\\')">Delete</button></td></tr>';
  }).join('')||'<tr><td colspan="9">No service complaints yet. Use Add Complaints on the left menu, or wait for a client to register one.</td></tr>';
  el('content').innerHTML='<div class="card"><h2>Service complaints List</h2><p style="color:#94a3b8">Every complaint from the client and from Add is listed here. Date and time and Token No. are auto. Status: Under process → Completed. Response time shows after Completed. Review Draft mail opens the letter. Send mail is only when you tap it — no automatic mail.</p></div>'+
    '<div class="card"><div class="tblwrap"><table><thead><tr><th>Sl.</th><th>Date and time</th><th>Token No.</th><th>Client Name</th><th>Complaint by</th><th>Nature of complaint</th><th>Status</th><th>Response time</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+suiteAppFooter();
}
function menuIx(fn){for(var i=0;i<MGMT_MENU.length;i++){if(MGMT_MENU[i].fn===fn)return i;}return -1;}
function goComplaintList(){var i=menuIx('complaintListPage');if(i>=0)tab(i);else complaintListPage();}
function addComplaint(){EDIT=null;var i=menuIx('complaintAdd');if(i>=0)tab(i);else {el('ttl').textContent='Add Complaints';complaintAdd();}}
function complaintAdd(){
  var e=EDIT||{};
  el('content').innerHTML='<div class="card"><h2>Add Complaints</h2>'+
    '<input type="hidden" id="tid" value="'+a(e.id||'')+'">'+
    '<label>Client Name *</label><select id="tclient" onchange="onComplaintClient()">'+clientOpts(e.clientId||'')+'</select>'+
    '<p style="font-size:12px;color:#94a3b8">Client Name is the registered client — not the staff name.</p>'+
    '<label>Token No.</label><input id="tno" readonly value="'+a(e.ticketNo||'')+'" placeholder="Auto — example HYD-A/AVM/001/30-08-2026">'+
    '<label>Date and time (auto)</label><input id="tdt" readonly value="'+a(e.ymd&&e.time?e.ymd+' '+e.time:'Auto on Save')+'">'+
    '<label>Complaint by (Name of the staff) *</label><input id="tfrom" value="'+a(e.receivedFrom||'')+'">'+
    '<label>email Id *</label><input id="temail" type="email" value="'+a(e.email||'')+'">'+
    '<label>Mobile No.</label><input id="tmob" inputmode="numeric" value="'+a(e.mobile||'')+'">'+
    '<label>Nature of complaint *</label><textarea id="tissue">'+h(e.issue||'')+'</textarea>'+
    '<div class="row"><button class="btn green" type="button" onclick="saveComplaint()">Save</button> '+
    (e.id?'<button class="btn grey" type="button" onclick="saveComplaint()">Edit</button> <button class="btn r" type="button" onclick="delComplaint(\\''+e.id+'\\')">Delete</button>':'')+
    '</div><div class="msg" id="tmsg"></div></div>'+suiteAppFooter();
  onComplaintClient();
}
function onComplaintClient(){
  var id=el('tclient')&&el('tclient').value;
  var c=clientList().filter(function(x){return x.id===id;})[0];
  if(!c||(EDIT&&EDIT.ticketNo&&EDIT.clientId===id))return;
  if(!(EDIT&&EDIT.ticketNo))el('tno').placeholder='Auto on Save — '+branchPref(c.branchName||c.companyName)+'/AVM/001/date';
}
function branchPref(name){
  var n=String(name||'').toLowerCase();
  if(/hyd/.test(n)&&/\ba\b/.test(n))return 'HYD-A';
  if(/hyd/.test(n)&&/\bb\b/.test(n))return 'HYD-B';
  if(/hi[- ]?tech/.test(n))return 'HIT';
  var L=String(name||'').toUpperCase().replace(/[^A-Z]/g,'');
  return (L+'XXX').slice(0,3);
}
function editComplaint(id){
  EDIT=complaintList().filter(function(r){return r.id===id;})[0]||null;
  var i=menuIx('complaintAdd');
  if(i>=0){CUR=i;rememberTab(i);buildMenu();el('side').classList.remove('open');}
  el('ttl').textContent='Add Complaints';
  complaintAdd();
}
function saveComplaint(){
  flash('tmsg',true,'Saving…');
  api('saveComplaint',{id:el('tid').value,clientId:el('tclient').value,receivedFrom:el('tfrom').value,email:el('temail').value,mobile:el('tmob').value,issue:el('tissue').value}).then(function(res){
    if(res.s!==200){flash('tmsg',false,(res.j&&res.j.error)||'Could not save.');return;}
    EDIT=null;reload(goComplaintList);
  });
}
function delComplaint(id){
  if(!confirm('Delete this service complaint?'))return;
  api('deleteComplaint',{id:id}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not delete.');return;}
    EDIT=null;reload(goComplaintList);
  });
}
function reviewDraft(id){
  api('previewComplaintMail',{id:id}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not open draft.');return;}
    el('ttl').textContent='Review Draft mail';
    el('content').innerHTML='<div class="card"><h2>Review Draft mail</h2><p style="color:#94a3b8">This is the letter. Mail is sent only when you tap Send mail.</p>'+
      '<div class="row"><button class="btn gold" type="button" onclick="sendComplaintMail(\\''+id+'\\')">Send mail</button> <button class="btn grey" type="button" onclick="goComplaintList()">Back to list</button></div></div>'+
      '<div class="card" style="background:#fff;color:#0f172a">'+(res.j.html||'')+'</div>'+suiteAppFooter();
  });
}
function markCompleted(id){
  if(!confirm('Mark this complaint Completed? No mail will be sent.'))return;
  api('markComplaintDone',{id:id}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not update.');return;}
    reload(goComplaintList);
  });
}
function sendComplaintMail(id){
  if(!confirm('Send this letter to the complainant now?'))return;
  api('sendComplaintMail',{id:id}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not send.');return;}
    alert('Mail sent.');
    reload(goComplaintList);
  });
}

function pinNote(u){return u.hasPin?('PIN sent on WhatsApp'+(u.pinIssuedAt?' · '+String(u.pinIssuedAt).slice(0,10):'')):'Need PIN — tap Refresh PIN';}
function gateList(){return (BOOT&&BOOT.gates)||[];}
function dutyList(){return (BOOT&&BOOT.duties)||[];}
function workOpts(sel){
  return ['Staff','Security Head','HOD'].map(function(x){return '<option'+(sel===x?' selected':'')+'>'+h(x)+'</option>';}).join('');
}
function shiftOpts(sel){
  return ['Shift A (Morning)','Shift B (Afternoon)','Shift C (Night)'].map(function(x){return '<option'+(sel===x?' selected':'')+'>'+h(x)+'</option>';}).join('');
}
function gateOpts(clientId,sel){
  return '<option value="">— Gate name —</option>'+gateList().filter(function(g){return !clientId||g.clientId===clientId;}).map(function(g){return '<option value="'+a(g.id)+'"'+(sel===g.id?' selected':'')+'>'+h(g.gateName)+'</option>';}).join('');
}
function userRows(list){
  return list.map(function(u,i){
    return '<tr><td>'+(i+1)+'</td><td>'+h(u.clientName)+'</td><td>'+h(u.staffName)+'</td><td>'+h(u.department||'—')+'</td><td>'+h(u.workAs||'—')+'</td><td>'+h(u.idNo||'—')+'</td><td>'+h(u.mobile)+'</td><td>'+
      '<button class="btn grey" type="button" onclick="editUser(\\''+u.id+'\\')">Edit</button> '+
      '<button class="btn r" type="button" onclick="delUser(\\''+u.id+'\\')">Delete</button></td></tr>';
  }).join('')||'<tr><td colspan="8">No staff yet. Add above.</td></tr>';
}
function users(){
  var e=EDIT||{};
  var de=EDITD||{};
  var staff=userList().filter(function(u){return u.role!=='guard';});
  var today=(BOOT&&BOOT.today)||'';
  var todayDuties=dutyList().filter(function(d){return !today||d.ymd===today;});
  var heads='<tr><th>sl. No.</th><th>Client Name</th><th>Name</th><th>Department</th><th>Work as</th><th>ID no.</th><th>Phone</th><th></th></tr>';
  var dutyRows=todayDuties.map(function(d,i){
    return '<tr><td>'+(i+1)+'</td><td>'+h(d.clientName)+'</td><td>'+h(d.shift)+'</td><td>'+h(d.guardName)+'</td><td>'+h(d.idNo)+'</td><td>'+h(d.mobile)+'</td><td>'+h(pinNote(d))+'</td><td>'+
      '<button class="btn grey" type="button" onclick="editDuty(\\''+d.id+'\\')">Edit</button> '+
      '<button class="btn gold" type="button" onclick="refreshDutyPin(\\''+d.id+'\\')">Refresh PIN</button> '+
      '<button class="btn r" type="button" onclick="delDuty(\\''+d.id+'\\')">Delete</button></td></tr>';
  }).join('')||'<tr><td colspan="8">No Guard on the list yet.</td></tr>';
  var staffPins=staff.map(function(u,i){
    return '<tr><td>'+(i+1)+'</td><td>'+h(u.clientName)+'</td><td>'+h(u.staffName)+'</td><td>Staff door</td><td>'+h(u.mobile)+'</td><td>'+h(pinNote(u))+'</td><td><button class="btn gold" type="button" onclick="refreshPin(\\''+u.id+'\\')">Refresh PIN</button></td></tr>';
  }).join('');
  var dutyPins=todayDuties.map(function(d,i){
    return '<tr><td>'+(staff.length+i+1)+'</td><td>'+h(d.clientName)+'</td><td>'+h(d.guardName)+'</td><td>Guards · '+h(d.shift)+'</td><td>'+h(d.mobile)+'</td><td>'+h(pinNote(d))+'</td><td><button class="btn gold" type="button" onclick="refreshDutyPin(\\''+d.id+'\\')">Refresh PIN</button></td></tr>';
  }).join('');
  el('content').innerHTML='<div class="card"><h2>User management</h2><p style="color:#94a3b8">One Client Name on each form — pick the registered client (the unique link). It is not a person name — not the Staff or Guard name. ID number is not mandatory for Staff. Guards register a daily shift — Name, ID, Phone, PIN to login. PIN again for every Gate pass. See <b>3. User Details</b>.</p></div>'+
    '<div class="card"><h2>1. Staff</h2>'+
    '<input type="hidden" id="sid" value="'+a(e.id||'')+'">'+
    '<label>Client Name *</label><select id="sclient">'+clientOpts(e.clientId||'')+'</select>'+
    '<label>Department *</label><input id="sdept" value="'+a(e.department||'')+'">'+
    '<label>Name of the Staff *</label><input id="sname" value="'+a(e.staffName||'')+'">'+
    '<label>Work as *</label><select id="swork">'+workOpts(e.workAs||'')+'</select>'+
    '<label>ID no.</label><input id="sidno" value="'+a(e.idNo||'')+'" placeholder="Optional">'+
    '<label>email</label><input id="semail" type="email" value="'+a(e.email||'')+'">'+
    '<label>Phone * (WhatsApp PIN)</label><input id="smob" inputmode="numeric" value="'+a(e.mobile||'')+'">'+
    '<div class="row"><button class="btn green" type="button" onclick="saveUser()">Add / Edit</button></div><div class="msg" id="smsg"></div></div>'+
    '<div class="card"><div class="tblwrap"><table><thead>'+heads+'</thead><tbody>'+userRows(staff)+'</tbody></table></div></div>'+
    '<div class="card"><h2>2. Guards</h2><p style="color:#94a3b8">One Client Name. Register today’s shift: Name, ID, Phone. A new PIN is made for login and for every Gate pass. PIN changes every shift.</p>'+
    '<input type="hidden" id="did" value="'+a(de.id||'')+'">'+
    '<label>Client Name *</label><select id="dclient">'+clientOpts(de.clientId||'')+'</select>'+
    '<label>Shift *</label><select id="dshift">'+shiftOpts(de.shift||'')+'</select>'+
    '<label>Guard name *</label><input id="dname" value="'+a(de.guardName||'')+'">'+
    '<label>ID *</label><input id="didno" value="'+a(de.idNo||'')+'">'+
    '<label>Phone *</label><input id="dmob" inputmode="numeric" value="'+a(de.mobile||'')+'">'+
    '<div class="row"><button class="btn green" type="button" onclick="saveDuty()">Add / Edit</button></div><div class="msg" id="dmsg"></div></div>'+
    '<div class="card"><h2>Guards List</h2><div class="tblwrap"><table><thead><tr><th>sl.</th><th>Client Name</th><th>Shift</th><th>Name</th><th>ID</th><th>Phone</th><th>PIN</th><th></th></tr></thead><tbody>'+dutyRows+'</tbody></table></div></div>'+
    '<div class="card"><h2>3. User Details</h2><p style="color:#94a3b8">Login PINs. Staff PIN is for the Staff door. Guard shift PIN is for the Gate door and for every Gate pass. PIN goes on WhatsApp. Refresh PIN makes a new one for this shift.</p></div>'+
    '<div class="card"><div class="tblwrap"><table><thead><tr><th>sl.</th><th>Client Name</th><th>Name</th><th>Door / Shift</th><th>Phone</th><th>PIN</th><th></th></tr></thead><tbody>'+(staffPins+dutyPins||'<tr><td colspan="7">No PIN yet. Add Staff or add a Guard.</td></tr>')+'</tbody></table></div></div>'+suiteAppFooter();
}
function editUser(id){EDIT=userList().filter(function(u){return u.id===id;})[0]||null;EDITG=null;EDITD=null;users();}
function editGate(id){EDITG=gateList().filter(function(g){return g.id===id;})[0]||null;EDIT=null;EDITD=null;users();}
function editDuty(id){EDITD=dutyList().filter(function(d){return d.id===id;})[0]||null;EDIT=null;EDITG=null;users();}
function afterPinSave(res,msgId){
  if(res.s!==200){flash(msgId||'smsg',false,(res.j&&res.j.error)||'Could not save.');return;}
  if(res.j&&res.j.pinSent)alert('PIN sent on WhatsApp. See 3. User Details.');
  else if(res.j&&res.j.pin)alert('WhatsApp could not go. PIN is '+res.j.pin+' — please tell them. Also see 3. User Details.');
  else if(res.j&&res.j.pinError)alert(res.j.pinError);
  EDIT=null;EDITG=null;EDITD=null;reload(users);
}
function saveUser(){
  flash('smsg',true,'Saving…');
  var work=(el('swork')&&el('swork').value)||'Staff';
  api('saveUser',{id:el('sid').value,clientId:el('sclient').value,staffName:el('sname').value,idNo:el('sidno').value,email:el('semail').value,mobile:el('smob').value,department:el('sdept').value,workAs:work,kind:'staff',canManageUsers:work==='Security Head'||work==='HOD'}).then(function(res){afterPinSave(res,'smsg');});
}
function saveGate(){
  flash('gmsg',true,'Saving…');
  api('saveGate',{id:el('gid').value,clientId:el('gclient').value,gateName:el('gname').value}).then(function(res){
    if(res.s!==200){flash('gmsg',false,(res.j&&res.j.error)||'Could not save.');return;}
    EDITG=null;reload(users);
  });
}
function saveDuty(){
  flash('dmsg',true,'Saving…');
  api('saveShiftDuty',{id:el('did').value,clientId:el('dclient').value,shift:el('dshift').value,guardName:el('dname').value,idNo:el('didno').value,mobile:el('dmob').value}).then(function(res){afterPinSave(res,'dmsg');});
}
function refreshPin(id){
  if(!confirm('Refresh PIN? A new PIN will go on WhatsApp.'))return;
  api('refreshPin',{id:id}).then(function(res){afterPinSave(res,'smsg');});
}
function refreshDutyPin(id){
  if(!confirm('Refresh this shift PIN? The Guard must use the new PIN to login and to issue a Gate pass.'))return;
  api('refreshDutyPin',{id:id}).then(function(res){afterPinSave(res,'dmsg');});
}
function delUser(id){
  if(!confirm('Delete this staff? They will not be able to log in.'))return;
  api('deleteUser',{id:id}).then(function(res){if(res.s!==200){alert((res.j&&res.j.error)||'Could not delete.');return;}EDIT=null;reload(users);});
}
function delGate(id){
  if(!confirm('Delete this Gate name?'))return;
  api('deleteGate',{id:id}).then(function(res){if(res.s!==200){alert((res.j&&res.j.error)||'Could not delete.');return;}EDITG=null;reload(users);});
}
function delDuty(id){
  if(!confirm('Delete this shift register?'))return;
  api('deleteShiftDuty',{id:id}).then(function(res){if(res.s!==200){alert((res.j&&res.j.error)||'Could not delete.');return;}EDITD=null;reload(users);});
}

function guardsPortal(){
  var rows=guardList().map(function(g,i){
    return '<tr><td>'+(i+1)+'</td><td>'+h(g.clientName)+'</td><td>'+h(g.ymd)+'</td><td>'+h(g.loginTime)+'</td><td>'+h(g.logoutTime||'—')+'</td><td>'+h(g.visitorsHandled)+'</td><td><button class="btn gold" type="button" onclick="shareGuard(\\''+g.id+'\\')">Share</button></td></tr>';
  }).join('')||'<tr><td colspan="7">No guard rows yet.</td></tr>';
  el('content').innerHTML='<div class="card"><h2>Guards Portal</h2>'+
    '<label>Client Name (select)</label><select id="gclient">'+clientOpts('')+'</select>'+
    '<label>date</label><input id="gdate" type="date">'+
    '<label>login time</label><input id="gin" type="time">'+
    '<label>logout</label><input id="gout" type="time">'+
    '<label>Total Visiters Handeled</label><input id="gvis" inputmode="numeric" value="0">'+
    '<div class="row"><button class="btn green" type="button" onclick="saveGuard()">Save</button></div>'+
    '<div class="msg" id="gmsg"></div></div>'+
    '<div class="card"><div class="tblwrap"><table><thead><tr><th>sl. No.</th><th>Client Name</th><th>date</th><th>login time</th><th>logout</th><th>Total Visiters Handeled</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+suiteAppFooter();
  el('gdate').value=new Date().toISOString().slice(0,10);
}
function saveGuard(){
  flash('gmsg',true,'Saving…');
  api('saveGuardLog',{clientId:el('gclient').value,ymd:el('gdate').value,loginTime:el('gin').value,logoutTime:el('gout').value,visitorsHandled:el('gvis').value}).then(function(res){
    if(res.s!==200){flash('gmsg',false,(res.j&&res.j.error)||'Could not save.');return;}
    reload(guardsPortal);
  });
}
function shareGuard(id){
  if(!confirm('Share this Guards Portal row to the client email Id?'))return;
  api('shareGuardLog',{id:id}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not share.');return;}
    alert('Shared.');
  });
}

function testLink(id){
  var c=clientList().filter(function(x){return x.id===id;})[0];
  if(!c||!c.linkUrl){alert('Save the client first. The link is made automatically.');return;}
  window.open(c.linkUrl,'_blank');
  setTimeout(function(){reload(function(){if(MGMT_MENU[CUR]&&MGMT_MENU[CUR].fn==='registeredList')registeredList();else if(MGMT_MENU[CUR]&&MGMT_MENU[CUR].fn==='clientReg')clientReg();});},1500);
}
function suiteAppFooter(){return ${JSON.stringify(suiteAppOpenPageFooterHtml())};}
if(OTP_SESSION)onOtpLogin();
else if(typeof otpRestoreSession==='function'&&otpRestoreSession())onOtpLogin();
</script>
</body></html>`

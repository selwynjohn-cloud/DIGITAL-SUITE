/**
 * Agile Ops — shared SPA shell for Control / Quality / Meetings.
 * Dark navy theme, sidebar menus (HOD ↔ Management parity), OTP login injected.
 */

import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../suite-tap-feedback.js'
import { suiteDateInputInitScript } from '../suite-date-input.js'

export type OpsShellApp = 'control' | 'quality' | 'meetings'

type MenuItem = { n: string; fn: string; icon: string }

const APP_META: Record<OpsShellApp, { title: string; accent: string; tag: string }> = {
  control: { title: 'Agile Control', accent: '#a16207', tag: '24×7 Control Room' },
  quality: { title: 'Agile Security', accent: '#059669', tag: 'Visits · Audits · Performance' },
  meetings: { title: 'Agile Meeting (War Room)', accent: '#7c3aed', tag: 'Weekly · Monthly · MOM' },
}

const CONTROL_MENU: MenuItem[] = [
  { n: '← Command Centre', fn: 'goCommandCentre', icon: '🏠' },
  { n: '— Ops Tools —', fn: 'noop', icon: '·' },
  { n: 'Shadow Compare Board', fn: 'shadow', icon: '◐' },
  { n: 'Control Room', fn: 'control', icon: '▣' },
  { n: 'Nearby W.Off', fn: 'nearby', icon: '◎' },
  { n: 'Late / Out of Post', fn: 'exceptions', icon: '⚠' },
  { n: 'Guard Journey (PSARA)', fn: 'journey', icon: '🧭' },
  { n: 'People — Guards & Posts', fn: 'masters', icon: '☰' },
  { n: 'Staff Appointment', fn: 'appointments', icon: '✎' },
  { n: 'ID Cards', fn: 'idcards', icon: '▤' },
  { n: 'Deployment Orders', fn: 'orders', icon: '📄' },
  { n: 'Uniform Issue', fn: 'uniforms', icon: '👕' },
  { n: 'Shift Roster / W.Off', fn: 'roster', icon: '📅' },
  { n: 'Monthly Attendance', fn: 'months', icon: '🗓' },
  { n: 'Invoice Feed Preview', fn: 'invoice', icon: '₹' },
  { n: 'Transition Plans', fn: 'transitions', icon: '→' },
  { n: 'Safety Flags', fn: 'flags', icon: '⚑' },
]

const QUALITY_MENU: MenuItem[] = [
  { n: 'Visit Actions', fn: 'visits', icon: '📍' },
  { n: 'Service Scorecards', fn: 'scorecards', icon: '★' },
  { n: 'Periodical Audit / Findings', fn: 'findings', icon: '🔍' },
  { n: 'Client Report Pack', fn: 'clientReports', icon: '📦' },
]

const MEETINGS_MENU: MenuItem[] = [
  { n: 'Weekly Meeting', fn: 'weeklyMeet', icon: '🗓' },
  { n: 'Monthly Meeting', fn: 'monthlyMeet', icon: '📆' },
  { n: 'MOM & Corrections', fn: 'corrections', icon: '✓' },
  { n: 'Agenda Pull', fn: 'agenda', icon: '⤵' },
]

function menusFor(app: OpsShellApp): MenuItem[] {
  if (app === 'quality') return QUALITY_MENU
  if (app === 'meetings') return MEETINGS_MENU
  return CONTROL_MENU
}

/** Server-rendered HTML SPA for Ops Control / Quality / Meetings. */
export function renderOpsShell(
  app: OpsShellApp,
  portal: 'staff' | 'management',
  loginHtml: string,
  otpScript: string,
): string {
  const meta = APP_META[app]
  const menu = menusFor(app)
  const accent = meta.accent
  const portalLabel = portal === 'management' ? 'Management' : 'HOD / Staff'

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${meta.title} — ${portalLabel}</title>
<script>
(function(){
  try{
    var h=String(location.hash||'');
    var q=String(location.search||'');
    var has=h.indexOf('otp=')>=0 || q.indexOf('open=1')>=0 || q.indexOf('skipLogin=1')>=0;
    if(!has){
      has=!!(sessionStorage.getItem('otp_${app}')||localStorage.getItem('otp_${app}'));
    }
    if(has)document.documentElement.className+=' ops-authed';
  }catch(e){}
})();
</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}
body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:14px}
html.ops-authed #login,html.ops-authed #opsOpening{display:none!important}
html.ops-authed #shell{display:block!important}
#login{max-width:400px;margin:0 auto;padding-top:10vh}
.card{background:#111a30;border:1px solid #22304f;border-radius:14px;padding:20px;margin-bottom:14px}
.card h2,.card h3{color:#fff;margin-bottom:8px}
input,select,textarea{width:100%;padding:9px 11px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:14px}
label{display:block;font-size:12px;color:#94a3b8;margin:8px 0 3px;font-weight:700}
.btn{padding:10px 16px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:13px;background:${accent};color:#fff;margin:4px 4px 4px 0}
.btn:disabled{opacity:.6;cursor:wait}.grey{background:#334155;color:#e2e8f0}.green{background:#16a34a}.r{background:#dc2626}.amb{background:#d97706}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
#shell{display:none;height:100vh}
.side{position:fixed;top:0;left:0;bottom:0;width:240px;background:#0e1730;border-right:1px solid #22304f;display:flex;flex-direction:column;overflow-y:auto;z-index:40}
.brand{padding:16px;text-align:center;border-bottom:1px solid #22304f}
.brand img{height:44px}.brand b{display:block;color:#fff;font-size:14px;margin-top:6px}
.brand small{color:${accent};font-size:11px;font-weight:700}
.menu{padding:8px;flex:1}
.mi{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:9px;color:#cbd5e1;cursor:pointer;font-weight:600;font-size:13px;margin-bottom:2px}
.mi:hover{background:#16223f}.mi.active{background:${accent};color:#fff}
.logout{padding:12px 16px;border-top:1px solid #22304f;color:#94a3b8;cursor:pointer;font-size:13px}
.main{margin-left:240px;min-height:100vh;display:flex;flex-direction:column}
.bar{background:#111a30;border-bottom:1px solid #22304f;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;position:sticky;top:0;z-index:30}
.bar b{color:#fff;font-size:16px}.content{padding:16px;flex:1;max-width:1200px}
.burger{display:none;background:${accent};color:#fff;border:none;border-radius:8px;padding:8px 12px;font-weight:800}
@media(max-width:820px){.side{transform:translateX(-100%);transition:.2s}.side.open{transform:none}.main{margin-left:0}.burger{display:inline-block}.row2,.row3{grid-template-columns:1fr}}
.tblwrap{overflow-x:auto;border:1px solid #22304f;border-radius:8px;margin-top:10px}
table{border-collapse:collapse;width:100%;font-size:12px;min-width:640px}
th,td{border:1px solid #22304f;padding:7px 8px;text-align:left;vertical-align:top}
th{background:#0b1220;color:#94a3b8;font-size:10px;text-transform:uppercase}
tr.mismatch td{background:rgba(127,29,29,.35);color:#fecaca}
.banner{padding:12px 14px;border-radius:10px;margin-bottom:12px;font-size:13px;font-weight:700;border:1px solid}
.banner.shadow{background:rgba(161,98,7,.25);border-color:${accent};color:#fde68a}
.banner.ok{background:rgba(5,150,105,.2);border-color:#059669;color:#6ee7b7}
.banner.warn{background:rgba(220,38,38,.2);border-color:#ef4444;color:#fca5a5}
.kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:14px}
.kpi{border-radius:12px;padding:14px;border:1px solid #22304f;background:#111a30}
.kpi b{font-size:24px;color:#fff;display:block}.kpi span{font-size:11px;color:#94a3b8}
.muted{color:#94a3b8;font-size:12px}.msg{padding:10px;border-radius:8px;margin:8px 0;font-size:13px;display:none}
.msg.err{display:block;background:#3a0a0a;color:#ef4444}.msg.ok{display:block;background:#052e16;color:#4ade80}
.av{width:40px;height:40px;border-radius:8px;object-fit:cover;border:1px solid #334155;background:#0b1220;vertical-align:middle}
.av.lg{width:96px;height:96px;border-radius:12px}
.toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:end;margin-bottom:12px}
.toolbar .fld{min-width:140px;flex:1}
.foot-note{margin:20px 0 12px;padding:12px;border-radius:10px;background:#0e1730;border:1px solid #22304f;color:#94a3b8;font-size:12px;text-align:center}
.foot-note b{color:${accent}}
${SUITE_TAP_FEEDBACK_CSS}
</style></head>
<body>
${loginHtml}

<div id="shell">
  <div class="side" id="side">
    <div class="brand">
      <img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile">
      <b>${meta.title}</b>
      <small id="portalTag">${portalLabel}</small>
    </div>
    <div class="menu" id="menu"></div>
    <div class="logout" onclick="logout()">⎋ Logout</div>
  </div>
  <div class="main">
    <div class="bar">
      <div style="display:flex;align-items:center;gap:12px">
        <button type="button" class="burger" onclick="document.getElementById('side').classList.toggle('open')">☰</button>
        <b id="ttl">${menu[0] ? menu[0].n : 'Home'}</b>
      </div>
      <span id="userLine" style="color:#94a3b8;font-size:12px">${meta.tag}</span>
    </div>
    <div class="content" id="content"></div>
    <div class="foot-note"><b>Shadow mode</b> protects invoices and guard pay — Ops compares only until Management cutover.</div>
  </div>
</div>

<script>
${otpScript}
${suiteTapFeedbackInitScript()}
${suiteDateInputInitScript()}
var PORTAL=${JSON.stringify(portal)};
var APP_ID=${JSON.stringify(app)};
var ACCENT=${JSON.stringify(accent)};
var MENU=${JSON.stringify(menu)};
var CUR=0,CTX={email:'',branchId:'',branches:[],flags:{},role:PORTAL};
if(PORTAL==='management')OTP_ROLE='management';

function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function today(){return new Date().toISOString().slice(0,10);}
function monthNow(){return today().slice(0,7);}
function toast(msg,ok){var m=el('flash');if(!m){m=document.createElement('div');m.id='flash';m.className='msg';el('content').prepend(m);}m.className='msg '+(ok?'ok':'err');m.textContent=msg;m.style.display='block';setTimeout(function(){m.style.display='none';},4500);}
function api(action,extra){
  return fetch('/api/ops/data',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',
    body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,appId:APP_ID,branchId:CTX.branchId||''},extra||{}))
  }).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});})
   .catch(function(){return{s:0,j:{error:'Network / timeout — try one branch at a time'}}});
}
function photoUrl(id){
  if(!id)return '';
  var base=(typeof location!=='undefined'&&location.origin)?location.origin:'';
  return base+'/api/ops/image?id='+encodeURIComponent(id)+'&v='+Date.now();
}
function setPhotoPreview(boxId, src){
  var box=el(boxId); if(!box||!src)return;
  box.innerHTML='<img class="av lg" src="'+src+'" alt="photo" style="display:block;background:#fff">';
  box.style.display='block';
}
function resizePhoto(src,cb){
  var img=new Image();
  img.onload=function(){
    var mx=480,w=img.width,h=img.height;
    if(!w||!h){cb('');return;}
    if(w>mx||h>mx){if(w>h){h=Math.round(h*mx/w);w=mx;}else{w=Math.round(w*mx/h);h=mx;}}
    var c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
    cb(c.toDataURL('image/jpeg',0.75));
  };
  img.onerror=function(){cb('');};
  img.src=src;
}
function pickGuardPhoto(cb){
  var inp=document.createElement('input');inp.type='file';inp.accept='image/jpeg,image/png,image/webp,image/*';
  inp.onchange=function(){
    var f=inp.files&&inp.files[0];if(!f)return;
    if(f.size>8*1024*1024){toast('Photo file is too large. Choose a smaller picture.',false);return;}
    var r=new FileReader();
    r.onload=function(e){
      var raw=String(e.target.result||'');
      resizePhoto(raw,function(d){
        if(!d){toast('Could not read this photo. Please try a normal JPEG from the camera roll.',false);return;}
        cb(d);
      });
    };
    r.onerror=function(){toast('Could not open the photo file.',false);};
    r.readAsDataURL(f);
  };
  inp.click();
}
function uploadGuardPhotoNow(opts){
  opts=opts||{};
  var emp=String(opts.employeeId||'').trim();
  if(!emp && !opts.guardId && !opts.journeyId){toast('Enter Employee ID first',false);return;}
  pickGuardPhoto(function(dataUrl){
    if(opts.previewId) setPhotoPreview(opts.previewId, dataUrl);
    toast('Saving photo… please wait',true);
    api('uploadGuardPhoto',{photo:dataUrl,employeeId:emp,guardId:opts.guardId||'',journeyId:opts.journeyId||'',name:opts.name||''}).then(function(res){
      if(res.s!==200){toast(res.j.error||'Photo save failed',false);return;}
      // Keep the local preview (always works). Also try the saved URL.
      if(opts.previewId) setPhotoPreview(opts.previewId, dataUrl);
      toast(res.j.message||'Photo saved',true);
      if(typeof opts.onDone==='function')opts.onDone(Object.assign({},res.j,{previewUrl:dataUrl,dataUrl:dataUrl}));
    });
  });
}
function branchSel(id,val){
  if(PORTAL!=='management')return '<input type="hidden" id="'+id+'" value="'+a(CTX.branchId)+'">';
  var opts=(CTX.branches||[]).map(function(b){return '<option value="'+a(b.id)+'"'+(b.id===(val||'')?' selected':'')+'>'+h(b.name)+'</option>';}).join('');
  return '<label>Branch</label><select id="'+id+'"><option value="">All Branches</option>'+opts+'</select>';
}
function bid(id){var e=el(id);return e?e.value:(CTX.branchId||'');}
function buildMenu(){
  el('menu').innerHTML=MENU.map(function(m,i){
    return '<div class="mi'+(CUR===i?' active':'')+'" onclick="tab('+i+')"><span>'+m.icon+'</span>'+h(m.n)+'</div>';
  }).join('');
  el('portalTag').textContent=PORTAL==='management'?'Management · all branches':'HOD / Staff';
}
function tab(i){CUR=i;buildMenu();el('ttl').textContent=MENU[i].n;el('side').classList.remove('open');window[MENU[i].fn]();}
function goCommandCentre(){location.href='/control'+(PORTAL==='staff'?'?portal=staff':'?portal=management');}
function noop(){/* Ops Tools section header */}
function logout(){if(typeof otpLogout==='function')otpLogout();else{OTP_SESSION='';location.reload();}}
function onOtpLogin(j){
  if(j&&j.sessionToken){
    OTP_SESSION=j.sessionToken;
    OTP_EMAIL=j.email||OTP_EMAIL||'';
    if(typeof otpStoreSession==='function')otpStoreSession(OTP_SESSION,OTP_EMAIL,'','');
  }
  if(!OTP_SESSION&&typeof otpRestoreSession==='function')otpRestoreSession();
  if(!OTP_SESSION){
    document.documentElement.classList.remove('ops-authed');
    var open=el('opsOpening');
    if(open){open.style.display='block';open.innerHTML='<p style="color:#fca5a5">Sign-in missing. <a href="/'+APP_ID+'/" style="color:#93c5fd">Go back and Send PIN again</a>.</p>';}
    if(typeof otpMsg==='function')otpMsg('Sign-in missing. Go back and Send PIN again.',false);
    return;
  }
  document.documentElement.classList.add('ops-authed');
  if(el('login'))el('login').style.display='none';
  if(el('opsOpening'))el('opsOpening').style.display='none';
  if(el('shell')){el('shell').style.display='block';if(el('ttl'))el('ttl').textContent='Opening…';}
  api('bootstrap').then(function(res){
    if(res.s!==200){
      document.documentElement.classList.remove('ops-authed');
      if(el('shell'))el('shell').style.display='none';
      var open=el('opsOpening');
      if(open){
        open.style.display='block';
        open.innerHTML='<p style="color:#fca5a5;margin-bottom:12px">'+(res.j.error||'Could not open')+'</p><p><a class="btn" href="/'+APP_ID+'/" style="display:inline-block;padding:10px 16px;background:#a16207;color:#fff;border-radius:9px;text-decoration:none;font-weight:800">Back — Send PIN again</a></p>';
      }
      if(typeof otpMsg==='function')otpMsg(res.j.error||'Could not open. Send a new PIN.',false);
      return;
    }
    CTX.email=res.j.email||'';CTX.branchId=res.j.branchId||'';CTX.branches=res.j.branches||[];CTX.flags=res.j.flags||{};CTX.role=res.j.role||PORTAL;
    if(el('login'))el('login').style.display='none';
    if(el('opsOpening'))el('opsOpening').style.display='none';
    el('shell').style.display='block';
    el('userLine').textContent=(CTX.email||'')+' · '+(PORTAL==='management'?'All branches':(CTX.branchId||'Branch'));
    buildMenu();
    var hash=(location.hash||'').replace(/^#/,'').toLowerCase();
    if(hash.indexOf('otp=')===0)hash='';
    var start=0;
    if(hash){
      for(var i=0;i<MENU.length;i++){if(MENU[i].fn.toLowerCase()===hash||MENU[i].n.toLowerCase().indexOf(hash)>=0){start=i;break;}}
    }
    tab(start);
  }).catch(function(){
    document.documentElement.classList.remove('ops-authed');
    if(typeof otpMsg==='function')otpMsg('Network error. Try again.',false);
  });
}
function shadowBanner(){
  var f=CTX.flags||{};
  if(f.shadow!==false)return '<div class="banner shadow">SHADOW MODE — invoices/pay NOT from Ops</div>';
  return '<div class="banner ok">Live Ops mode — cutover approved</div>';
}
function formCard(title,body,actions){return '<div class="card"><h3>'+h(title)+'</h3>'+body+(actions?'<div style="margin-top:12px">'+actions+'</div>':'')+'</div>';}

/* ——— CONTROL ——— */
function shadow(){
  el('content').innerHTML=shadowBanner()+
    '<div class="card"><h3>Shadow Compare Board</h3><p class="muted">MIS remains truth. Ops calculates in parallel — never writes invoice/pay.</p>'+
    '<div class="toolbar"><div class="fld"><label>Date</label><input type="date" id="shDate" value="'+today()+'"></div>'+
    '<button type="button" class="btn grey" onclick="doIngest()">Ingest Work360</button>'+
    '<button type="button" class="btn" onclick="doShadow()">Run Compare</button></div>'+
    '<div id="shKpis"></div><div id="shTbl" class="muted">Pick a date and Run Compare.</div></div>';
}
function doIngest(){
  var d=el('shDate').value||today();
  api('ingestWork360',{date:d}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Ingest failed',false);return;}
    toast(res.j.message||('Work360 ingested. Added '+(res.j.added||0)+' punches.'),true);
  });
}
function doShadow(){
  var d=el('shDate').value||today();
  el('shTbl').innerHTML='Comparing…';
  api('shadowCompare',{date:d}).then(function(res){
    if(res.s!==200){el('shTbl').innerHTML='<div class="banner warn">'+h(res.j.error||'Failed')+'</div>';return;}
    CTX.flags=res.j.flags||CTX.flags;
    var days=res.j.days||[],streak=res.j.greenStreak||0;
    el('shKpis').innerHTML='<div class="kgrid"><div class="kpi"><b>'+streak+'</b><span>Green streak (days)</span></div>'+
      '<div class="kpi"><b>'+days.length+'</b><span>Branches compared</span></div>'+
      '<div class="kpi"><b>'+days.filter(function(x){return!x.match;}).length+'</b><span>Mismatches</span></div></div>';
    var rows=days.map(function(r){
      return '<tr class="'+(r.match?'':'mismatch')+'"><td>'+h(r.branchName)+'</td><td>'+r.misDeployed+'</td><td>'+r.opsPresent+
        '</td><td>'+r.misAbsent+'</td><td>'+r.opsAbsent+'</td><td>'+r.misVacant+'</td><td>'+r.opsVacant+
        '</td><td>'+r.misLate+'/'+r.opsLate+'</td><td>'+h((r.mismatches||[]).join('; ')||'OK')+'</td></tr>';
    }).join('');
    el('shTbl').innerHTML='<div class="tblwrap"><table><thead><tr><th>Branch</th><th>MIS Dep</th><th>Ops Pres</th><th>MIS Abs</th><th>Ops Abs</th><th>MIS Vac</th><th>Ops Vac</th><th>Late M/O</th><th>Notes</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  });
}

function control(){
  el('content').innerHTML=shadowBanner()+
    '<div class="card"><h3>Control Room</h3><div class="toolbar"><div class="fld"><label>Date</label><input type="date" id="crDate" value="'+today()+'"></div>'+
    '<div class="fld">'+branchSel('crBranch')+'</div><button type="button" class="btn" onclick="loadControl()">Refresh</button></div><div id="crBody">Loading…</div></div>';
  loadControl();
}
function loadControl(){
  api('controlBoard',{date:el('crDate').value||today(),branchId:bid('crBranch')}).then(function(res){
    if(res.s!==200){el('crBody').innerHTML=h(res.j.error||'Error');return;}
    var vac=res.j.vacant||[];
    var rows=vac.map(function(v,i){
      var p=v.post||{};
      return '<tr><td>'+h(p.branchName||'')+'</td><td>'+h(p.clientName)+'</td><td>'+h(p.postName)+'</td><td>'+h(v.shift)+
        '</td><td>'+v.onDuty+' / '+v.need+'</td><td><button type="button" class="btn grey" onclick="suggestFill('+i+')">Nearby</button> '+
        '<button type="button" class="btn" onclick="fillVac('+i+')">Fill</button></td></tr>';
    }).join('');
    window.__VAC=vac;
    el('crBody').innerHTML='<div class="kgrid"><div class="kpi"><b>'+vac.length+'</b><span>Vacant slots</span></div>'+
      '<div class="kpi"><b>'+(res.j.fills||[]).length+'</b><span>Fills today</span></div>'+
      '<div class="kpi"><b>'+(res.j.exceptions||[]).length+'</b><span>Exceptions</span></div></div>'+
      (vac.length?'<div class="tblwrap"><table><thead><tr><th>Branch</th><th>Client</th><th>Post</th><th>Shift</th><th>On duty</th><th>Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>':
        '<p class="muted">No vacant posts for this date.</p>')+
      '<div id="crNear" style="margin-top:12px"></div>';
  });
}
function suggestFill(i){
  var v=window.__VAC[i];if(!v)return;
  api('nearbyWOff',{date:el('crDate').value||today(),postId:v.post.id}).then(function(res){
    var sug=res.j.suggestions||[];
    window.__SUG=sug;window.__SUG_VAC=i;
    el('crNear').innerHTML='<div class="card"><h3>Nearby W.Off for '+h(v.post.postName)+' · '+h(v.shift)+'</h3>'+
      (sug.length?'<div class="tblwrap"><table><thead><tr><th>Guard</th><th>Emp ID</th><th>Km</th><th></th></tr></thead><tbody>'+
        sug.map(function(s,si){return '<tr><td>'+h(s.guardName||s.name)+'</td><td>'+h(s.employeeId)+'</td><td>'+(s.distanceKm!=null?s.distanceKm:(s.km!=null?s.km:'—'))+
          '</td><td><button type="button" class="btn" onclick="pickFill('+si+')">Use</button></td></tr>';}).join('')+
        '</tbody></table></div>':'<p class="muted">No nearby W.Off suggestions.</p>')+'</div>';
  });
}
function pickFill(si){fillVac(window.__SUG_VAC,window.__SUG&&window.__SUG[si]);}
function fillVac(i,picked){
  var v=window.__VAC[i];if(!v)return;
  var g=picked||{};
  var name=prompt('Fill guard name',g.guardName||g.name||'');if(name==null)return;
  var emp=prompt('Fill employee ID',g.employeeId||'')||'';
  api('fillVacancy',{fill:{date:el('crDate').value||today(),branchId:v.post.branchId,postId:v.post.id,postName:v.post.postName,shift:v.shift,
    fillGuardId:g.guardId||g.id||'',fillGuardName:name,fillEmployeeId:emp,note:'Control room fill'}}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Fill failed',false);return;}
    toast('Vacancy filled',true);loadControl();
  });
}

function nearby(){
  el('content').innerHTML='<div class="card"><h3>Nearby W.Off</h3><div class="toolbar">'+
    '<div class="fld"><label>Date</label><input type="date" id="nbDate" value="'+today()+'"></div>'+
    '<div class="fld"><label>Post ID</label><input id="nbPost" placeholder="Post id from masters"></div>'+
    '<button type="button" class="btn" onclick="runNearby()">Suggest</button></div><div id="nbOut" class="muted">Enter a post id.</div></div>';
}
function runNearby(){
  api('nearbyWOff',{date:el('nbDate').value||today(),postId:el('nbPost').value}).then(function(res){
    if(res.s!==200){el('nbOut').innerHTML='<div class="banner warn">'+h(res.j.error||'Failed')+'</div>';return;}
    var sug=res.j.suggestions||[];
    el('nbOut').innerHTML=sug.length?'<div class="tblwrap"><table><thead><tr><th>Guard</th><th>Emp</th><th>Branch</th><th>Km</th></tr></thead><tbody>'+
      sug.map(function(s){return '<tr><td>'+h(s.guardName||s.name)+'</td><td>'+h(s.employeeId)+'</td><td>'+h(s.branchId||s.branchName||'')+'</td><td>'+(s.distanceKm!=null?s.distanceKm:(s.km!=null?s.km:'—'))+'</td></tr>';}).join('')+
      '</tbody></table></div>':'<p class="muted">No suggestions.</p>';
  });
}

function exceptions(){
  el('content').innerHTML='<div class="card"><h3>Late / Out of Post</h3><div class="toolbar">'+
    '<div class="fld"><label>Date</label><input type="date" id="exDate" value="'+today()+'"></div>'+
    '<div class="fld">'+branchSel('exBranch')+'</div><button type="button" class="btn grey" onclick="loadEx()">Load</button></div>'+
    formCard('Log exception',
      '<div class="row2"><div><label>Kind</label><select id="exKind"><option value="late_start">Late start</option><option value="out_of_post">Out of post</option></select></div>'+
      '<div><label>Guard name</label><input id="exName"></div></div>'+
      '<div class="row2"><div><label>Employee ID</label><input id="exEmp"></div><div><label>Client</label><input id="exClient"></div></div>'+
      '<div class="row2"><div><label>Post</label><input id="exPost"></div><div><label>Detail</label><input id="exDetail"></div></div>',
      '<button type="button" class="btn" onclick="saveEx()">Save exception</button>')+
    '<div id="exList" style="margin-top:12px"></div></div>';
  loadEx();
}
function loadEx(){
  api('controlBoard',{date:el('exDate').value||today(),branchId:bid('exBranch')}).then(function(res){
    var xs=res.j.exceptions||[];
    el('exList').innerHTML=xs.length?'<div class="tblwrap"><table><thead><tr><th>Kind</th><th>Guard</th><th>Client</th><th>Post</th><th>Detail</th><th>Source</th></tr></thead><tbody>'+
      xs.map(function(x){return '<tr><td>'+h(x.kind)+'</td><td>'+h(x.guardName)+'</td><td>'+h(x.clientName)+'</td><td>'+h(x.postName)+'</td><td>'+h(x.detail)+'</td><td>'+h(x.source)+'</td></tr>';}).join('')+
      '</tbody></table></div>':'<p class="muted">No exceptions for this date.</p>';
  });
}
function saveEx(){
  api('saveException',{exception:{date:el('exDate').value||today(),branchId:bid('exBranch')||CTX.branchId,kind:el('exKind').value,
    guardName:el('exName').value,employeeId:el('exEmp').value,clientName:el('exClient').value,postName:el('exPost').value,detail:el('exDetail').value,source:'manual'}}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Save failed',false);return;}toast('Saved',true);loadEx();
  });
}

/* ——— PSARA Guard Journey ——— */
var __JY=[],__JY_ST=[];
var __EXIT_CATS=['Better pay / offer','Relocation / hometown','Family reasons','Health','Work conflict / duty issue','Client / post issue','Personal','Other'];
var __LABOUR_NOTE='Latest Indian labour codes apply: Code on Wages 2019; Industrial Relations Code 2020; Code on Social Security 2020; OSHWC Code 2020 — plus PSARA and State rules.';
function journey(){
  el('content').innerHTML=shadowBanner()+
    '<div class="card"><h3>Guard Journey (PSARA)</h3>'+
    '<div class="banner warn">Duty rule: <b>face photo required</b> before Reported duty / Scheduling / Active duty (guards and staff).</div>'+
    '<p class="muted">Structured path: Recruitment (PSARA) → Fitness → ID → Uniform → Deployment order (location) → WhatsApp (CC HOD / Ops / IT) → Reported duty → Help desk 3 alternate-day calls → Schedule (no night first week for new boys) → Duty message. Also Transfer, Long-leave return, Resignation + Exit interview. <b>Latest Indian labour codes apply</b> on exit / F&amp;F.</p>'+
    '<div class="toolbar"><button type="button" class="btn" onclick="loadJourneys()">Refresh</button>'+
    '<button type="button" class="btn green" onclick="newJourneyForm()">+ New recruit journey</button></div>'+
    copyPanelHtml()+
    '<div id="jyForm"></div><div id="jyList">Loading…</div></div>';
  loadJourneys();
}
function copyPanelHtml(){
  var opts=(CTX.branches||[]).map(function(b){return '<option value="'+a(b.id)+'">'+h(b.name)+'</option>';}).join('');
  if(!opts && CTX.branchId) opts='<option value="'+a(CTX.branchId)+'">'+h(CTX.branchId)+'</option>';
  return '<div class="card" style="margin:12px 0;border:1px solid #d4a017;background:#fffbeb">'+
    '<h3 style="margin:0 0 8px">Copy live data — one branch at a time</h3>'+
    '<p class="muted" style="margin:0 0 10px">Pick a branch, then tap <b>Copy this branch</b>. Wait for the green message before the next branch. Live apps are not changed.</p>'+
    '<div class="toolbar"><div class="fld"><label>Branch</label><select id="copyBranch">'+opts+'</select></div> '+
    '<button type="button" class="btn amb" id="copyOneBtn" onclick="copyOneBranch()">Copy this branch</button> '+
    '<button type="button" class="btn grey" id="copyAllBtn" onclick="copyAllBranchesOneByOne()">Copy all branches (one by one)</button> '+
    '<button type="button" class="btn green" id="verifyCopyBtn" onclick="verifyShadowCopyNow()">Check if all copied</button></div>'+
    '<div id="copyStatus" class="muted" style="margin-top:10px;white-space:pre-wrap;min-height:1.4em"></div></div>';
}
function setCopyStatus(html,ok){
  var box=el('copyStatus'); if(!box){toast(String(html).replace(/<[^>]+>/g,''),!!ok);return;}
  box.className=ok===true?'msg ok':(ok===false?'msg err':'muted');
  box.style.display='block';
  box.innerHTML=html;
}
function copyOneBranch(){
  var sel=el('copyBranch');
  var branchId=sel?sel.value:(CTX.branchId||'');
  if(!branchId){setCopyStatus('Please select a branch first.',false);return;}
  var name=sel&&sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].text:branchId;
  var btn=el('copyOneBtn'); if(btn)btn.disabled=true;
  setCopyStatus('Copying <b>'+h(name)+'</b>… please wait (this can take up to a minute).',null);
  api('importShadowFromLive',{branchId:branchId,createJourneys:true}).then(function(res){
    if(btn)btn.disabled=false;
    if(res.s!==200){setCopyStatus(h(res.j.error||'Copy failed')+' — try again for this branch.',false);return;}
    setCopyStatus('✓ '+h(res.j.message||('Copied '+name)),true);
    toast('Branch copied',true);
    if(typeof loadJourneys==='function')loadJourneys();
    if(typeof loadGuards==='function' && el('msList'))loadGuards();
  });
}
var __copyAllBusy=false;
function copyAllBranchesOneByOne(){
  if(__copyAllBusy)return;
  var list=(CTX.branches||[]).slice();
  if(!list.length && CTX.branchId) list=[{id:CTX.branchId,name:CTX.branchId}];
  if(!list.length){setCopyStatus('No branches found. Sign out and sign in again.',false);return;}
  if(!confirm('Copy '+list.length+' branches one by one? Stay on this page until it finishes.'))return;
  __copyAllBusy=true;
  var btn=el('copyAllBtn'); if(btn)btn.disabled=true;
  var i=0, log=[];
  function next(){
    if(i>=list.length){
      __copyAllBusy=false; if(btn)btn.disabled=false;
      setCopyStatus('✓ Finished all '+list.length+' branches.\\n'+log.join('\\n'),true);
      if(typeof loadJourneys==='function')loadJourneys();
      return;
    }
    var b=list[i];
    setCopyStatus('Copying branch '+(i+1)+' of '+list.length+': <b>'+h(b.name)+'</b>…\\n'+log.join('\\n'),null);
    api('importShadowFromLive',{branchId:b.id,createJourneys:true}).then(function(res){
      if(res.s!==200){
        log.push('✗ '+b.name+': '+(res.j.error||'failed'));
        setCopyStatus('Stopped at <b>'+h(b.name)+'</b>. Fix / retry that branch, then continue.\\n'+log.join('\\n'),false);
        __copyAllBusy=false; if(btn)btn.disabled=false;
        return;
      }
      log.push('✓ '+b.name+': +'+(res.j.guardsAdded||0)+' guards, +'+(res.j.journeysAdded||0)+' journeys');
      i++; next();
    });
  }
  next();
}
function copyLiveToShadow(){ copyOneBranch(); }
function verifyShadowCopyNow(){
  var btn=el('verifyCopyBtn'); if(btn)btn.disabled=true;
  setCopyStatus('Checking live clients vs shadow…',null);
  api('verifyShadowCopy',{}).then(function(res){
    if(btn)btn.disabled=false;
    if(res.s!==200){setCopyStatus(h(res.j.error||'Check failed'),false);return;}
    var j=res.j||{};
    var lines=[];
    lines.push(j.complete?'✓ CONFIRMED — all clients / locations are in shadow.':'✗ NOT complete yet.');
    lines.push('Live clients: '+(j.liveActiveClients||0)+' · Shadow posts: '+(j.shadowPosts||0)+' · Matched: '+(j.matched||0)+' ('+(j.matchPct||0)+'%)');
    lines.push('Missing clients: '+(j.missing||0)+' · Branches done: '+(j.branchesComplete||0)+'/'+(j.branchesTotal||0));
    lines.push('Guards in shadow: '+(j.shadowGuards||0)+' · Journeys: '+(j.shadowJourneys||0)+' (with client/location: '+(j.journeysWithClientLoc||0)+')');
    if(j.postsMissingLocation) lines.push('Posts with blank location field: '+j.postsMissingLocation);
    var inc=j.branchesIncomplete||[];
    if(inc.length){
      lines.push('Branches still needing copy:');
      inc.slice(0,20).forEach(function(b){lines.push(' • '+b.branchName+' — missing '+b.missing+' of '+b.clients);});
    }
    var miss=j.sampleMissing||[];
    if(miss.length){
      lines.push('Examples still missing:');
      miss.slice(0,10).forEach(function(m){lines.push(' • '+m.branchName+': '+m.client+(m.location?' @ '+m.location:''));});
    }
    setCopyStatus(lines.map(h).join('<br>'), !!j.complete);
    toast(j.complete?'All clients copied':'Copy still incomplete', !!j.complete);
  });
}
function loadJourneys(){
  api('listJourneys',{}).then(function(res){
    if(res.s!==200){el('jyList').innerHTML='<div class="banner warn">'+h(res.j.error||'Failed')+'</div>';return;}
    __JY=res.j.journeys||[];__JY_ST=res.j.stages||[];
    if(res.j.exitReasonCategories&&res.j.exitReasonCategories.length)__EXIT_CATS=res.j.exitReasonCategories;
    if(res.j.labourCodeNote)__LABOUR_NOTE=res.j.labourCodeNote;
    if(!__JY.length){el('jyList').innerHTML='<p class="muted">No journeys yet. Tap <b>+ New recruit journey</b>.</p>';return;}
    el('jyList').innerHTML='<div class="tblwrap"><table><thead><tr><th>Photo</th><th>Name</th><th>ID</th><th>Kind</th><th>Stage</th><th>Client / Location</th><th>Actions</th></tr></thead><tbody>'+
      __JY.map(function(j,i){
        var ph=j.photoId?'<img class="av" src="'+photoUrl(j.photoId)+'" alt="" style="background:#fff">':'<span class="muted">—</span>';
        return '<tr><td>'+ph+'</td><td>'+h(j.guardName)+'</td><td>'+h(j.employeeId)+'</td><td>'+h(j.kind)+'</td><td>'+h(j.stage)+
          '</td><td>'+h(j.clientName)+' · '+h(j.location)+'</td><td>'+
          '<button type="button" class="btn grey" onclick="openJourney('+i+')">Open</button> '+
          '<button type="button" class="btn" onclick="advJourney('+i+')">Next stage</button></td></tr>';
      }).join('')+'</tbody></table></div>';
  });
}
function newJourneyForm(){
  el('jyForm').innerHTML=formCard('New recruit (PSARA start)',
    '<div class="row2"><div><label>Guard name</label><input id="jyName"></div><div><label>Employee ID</label><input id="jyEmp"></div></div>'+
    '<div class="row2"><div><label>Mobile (WhatsApp)</label><input id="jyMob"></div><div><label>Joining date</label><input type="date" id="jyJoin" value="'+today()+'"></div></div>'+
    '<div class="row2"><div>'+branchSel('jyBranch',CTX.branchId)+'</div><div><label>Branch name</label><input id="jyBrName" placeholder="Branch"></div></div>'+
    '<div class="row2"><div><label>Client</label><input id="jyClient"></div><div><label>Post</label><input id="jyPost"></div></div>'+
    '<label>Location (full posting address)</label><input id="jyLoc">'+
    '<label>PSARA document notes</label><textarea id="jyPsara" rows="2"></textarea>',
    '<button type="button" class="btn" onclick="saveNewJourney()">Save & start at Recruitment</button>');
}
function saveNewJourney(){
  api('saveJourney',{journey:{
    kind:'new_join',stage:'recruitment_psara',guardName:el('jyName').value,employeeId:el('jyEmp').value,
    mobile:el('jyMob').value,waGuard:el('jyMob').value,joiningDate:el('jyJoin').value||today(),
    branchId:bid('jyBranch')||CTX.branchId,branchName:el('jyBrName').value,
    clientName:el('jyClient').value,postName:el('jyPost').value,location:el('jyLoc').value,
    psaraDocNotes:el('jyPsara').value,psaraDocsOk:false,firstWeekNoNight:true,shift:'A'
  }}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Save failed',false);return;}
    toast('Journey started',true);el('jyForm').innerHTML='';loadJourneys();
  });
}
function openJourney(i){
  var j=__JY[i];if(!j)return;
  var calls=(j.helpCalls||[]).map(function(c){
    return '<tr><td>Day '+c.dayNo+'</td><td>'+h(c.plannedDate)+'</td><td>'+h(c.status)+'</td><td>'+
      '<button type="button" class="btn grey" onclick="markHelpCall(\\''+j.id+'\\','+c.dayNo+',\\'done\\')">Done</button> '+
      '<button type="button" class="btn amb" onclick="markHelpCall(\\''+j.id+'\\','+c.dayNo+',\\'no_answer\\')">No answer</button></td></tr>';
  }).join('');
  var ev=(j.events||[]).slice().reverse().slice(0,12).map(function(e){
    return '<div class="muted" style="margin:4px 0"><b>'+h(e.stage)+'</b> — '+h(e.note)+' <small>('+h(e.at)+')</small></div>';
  }).join('');
  var phHtml=j.photoId
    ?'<img class="av lg" id="jyPhotoThumb" src="'+photoUrl(j.photoId)+'" alt="'+a(j.guardName)+'" style="background:#fff">'
    :'<div class="av lg" id="jyPhotoThumb" style="display:flex;align-items:center;justify-content:center;color:#64748b;font-size:11px;background:#0b1220">No photo</div>';
  el('jyForm').innerHTML='<div class="card"><h3>'+h(j.guardName)+' · '+h(j.employeeId)+'</h3>'+
    '<p class="muted">Kind: <b>'+h(j.kind)+'</b> · Stage: <b>'+h(j.stage)+'</b> · Order: '+h(j.orderNo)+'</p>'+
    '<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin:10px 0 14px">'+phHtml+
      '<div><b>Face photo</b><p class="muted" style="margin:4px 0 8px">Linked to Employee ID. Face should appear on the left after upload.</p>'+
      '<button type="button" class="btn amb" onclick="uploadJourneyPhotoIx('+i+')">Upload / take photo</button></div></div>'+
    '<div class="kgrid">'+
      '<div class="kpi"><b>'+(j.psaraDocsOk?'Yes':'No')+'</b><span>PSARA docs</span></div>'+
      '<div class="kpi"><b>'+(j.fitnessOk?'Yes':'No')+'</b><span>Fitness</span></div>'+
      '<div class="kpi"><b>'+(j.idCardIssued?'Yes':'No')+'</b><span>ID card</span></div>'+
      '<div class="kpi"><b>'+(j.uniformIssued?'Yes':'No')+'</b><span>Uniform</span></div>'+
      '<div class="kpi"><b>'+(j.firstWeekNoNight?'On':'Off')+'</b><span>No night week-1</span></div>'+
      '<div class="kpi"><b>'+(j.hodApproved?'Yes':'No')+'</b><span>HOD approved</span></div>'+
    '</div>'+
    formCard('Update checklist / posting',
      '<div class="row2"><div><label><input type="checkbox" id="jPsara"'+(j.psaraDocsOk?' checked':'')+'> PSARA docs OK</label></div>'+
      '<div><label><input type="checkbox" id="jFit"'+(j.fitnessOk?' checked':'')+'> Fitness OK</label></div></div>'+
      '<div class="row2"><div><label><input type="checkbox" id="jId"'+(j.idCardIssued?' checked':'')+'> ID card issued</label></div>'+
      '<div><label>ID card no</label><input id="jIdNo" value="'+a(j.idCardNo||'')+'"></div></div>'+
      '<div class="row2"><div><label><input type="checkbox" id="jUni"'+(j.uniformIssued?' checked':'')+'> Uniform issued</label></div>'+
      '<div><label>Uniform items</label><input id="jUniItems" value="'+a(j.uniformItems||'')+'"></div></div>'+
      '<div class="row2"><div><label>Client</label><input id="jClient" value="'+a(j.clientName||'')+'"></div><div><label>Post</label><input id="jPost" value="'+a(j.postName||'')+'"></div></div>'+
      '<label>Location</label><input id="jLoc" value="'+a(j.location||'')+'">'+
      '<div class="row2"><div><label>Shift (A/G/B — avoid C first week)</label><input id="jShift" value="'+a(j.shift||'A')+'"></div>'+
      '<div><label>Joining date</label><input type="date" id="jJoin" value="'+a(j.joiningDate||'')+'"></div></div>'+
      '<label>WhatsApp message (CC HOD / Ops / IT)</label><textarea id="jWa" rows="5">'+h(j.waMessage||'')+'</textarea>'+
      '<div class="row3"><div><label>WA HOD</label><input id="jWaHod" value="'+a(j.waHod||'')+'"></div>'+
      '<div><label>WA Ops Mgr</label><input id="jWaOps" value="'+a(j.waOpsManager||'')+'"></div>'+
      '<div><label>WA IT</label><input id="jWaIt" value="'+a(j.waIt||'')+'"></div></div>',
      '<button type="button" class="btn" onclick="saveJourneyEdit(\\''+j.id+'\\')">Save</button> '+
      '<button type="button" class="btn green" onclick="advJourneyId(\\''+j.id+'\\')">Advance next stage</button> '+
      '<button type="button" class="btn grey" onclick="hodApproveJourney(\\''+j.id+'\\')">HOD approve</button>')+
    '<div class="card"><h3>Help desk comfort calls (3 alternate days)</h3><div class="tblwrap"><table><thead><tr><th>Call</th><th>Planned</th><th>Status</th><th></th></tr></thead><tbody>'+
      (calls||'<tr><td colspan="4" class="muted">Advance to helpdesk stage to plan calls</td></tr>')+'</tbody></table></div></div>'+
    '<div class="card"><h3>Change events</h3>'+
      '<button type="button" class="btn amb" onclick="doTransfer(\\''+j.id+'\\')">Start transfer</button> '+
      '<button type="button" class="btn grey" onclick="doLeaveReturn(\\''+j.id+'\\')">Long leave return</button> '+
      '<button type="button" class="btn r" onclick="doResign(\\''+j.id+'\\')">Resignation</button> '+
      (j.kind==='resignation'||j.stage==='resignation'||j.stage==='exit_interview'||j.stage==='resigned'
        ?'<button type="button" class="btn" onclick="showExitInterview(\\''+j.id+'\\')">Exit interview</button> ':'')+
      '<div style="margin-top:10px">'+ev+'</div></div></div>';
}
function uploadJourneyPhotoIx(i){
  var jy=__JY[i]; if(!jy){toast('Journey not found',false);return;}
  var emp=jy.employeeId||'';
  if(!emp){toast('Add Employee ID on this journey first, then save, then upload photo.',false);return;}
  uploadGuardPhotoNow({journeyId:jy.id,employeeId:emp,name:jy.guardName||'',onDone:function(res){
    jy.photoId=res.photoId||jy.photoId;
    var src=res.dataUrl||res.previewUrl||photoUrl(jy.photoId);
    var t=el('jyPhotoThumb');
    if(t && src){
      if(t.tagName==='IMG'){t.src=src;t.style.background='#fff';}
      else{t.outerHTML='<img class="av lg" id="jyPhotoThumb" src="'+src+'" alt="" style="background:#fff">';}
    }
    loadJourneys();
  }});
}
function hodApproveJourney(id){
  api('journeyHodApprove',{id:id}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('HOD approved',true);loadJourneys();
  });
}
function saveJourneyEdit(id){
  var j=__JY.find(function(x){return x.id===id;})||{};
  api('saveJourney',{journey:Object.assign({},j,{
    id:id,psaraDocsOk:el('jPsara').checked,fitnessOk:el('jFit').checked,
    idCardIssued:el('jId').checked,idCardNo:el('jIdNo').value,
    uniformIssued:el('jUni').checked,uniformItems:el('jUniItems').value,
    clientName:el('jClient').value,postName:el('jPost').value,location:el('jLoc').value,
    shift:el('jShift').value,joiningDate:el('jJoin').value,waMessage:el('jWa').value,
    waHod:el('jWaHod').value,waOpsManager:el('jWaOps').value,waIt:el('jWaIt').value
  })}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Save failed',false);return;}
    toast('Saved',true);loadJourneys();
  });
}
function advJourney(i){var j=__JY[i];if(j)advJourneyId(j.id);}
function advJourneyId(id){
  api('advanceJourney',{id:id,note:''}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Cannot advance',false);return;}
    toast('Moved to: '+(res.j.journey&&res.j.journey.stage),true);loadJourneys();
  });
}
function markHelpCall(id,dayNo,status){
  api('journeyHelpCall',{id:id,dayNo:dayNo,status:status}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Call updated',true);loadJourneys();
  });
}
function doTransfer(id){
  var client=prompt('New client name','')||'';
  var post=prompt('New post','')||'';
  var loc=prompt('New location','')||'';
  api('startTransfer',{id:id,clientName:client,postName:post,location:loc}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Transfer started — HOD approval needed',true);loadJourneys();
  });
}
function doLeaveReturn(id){
  api('startLeaveReturn',{id:id,joiningDate:today()}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Leave return — fresh posting',true);loadJourneys();
  });
}
function doResign(id){
  var reason=prompt('Resignation reason (short)','')||'';
  api('startResignation',{id:id,resignationDate:today(),resignationReason:reason}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Resignation started — complete Exit Interview next',true);
    loadJourneys();
    var ix=__JY.findIndex(function(x){return x.id===id;});
    if(ix>=0)setTimeout(function(){openJourney(ix);showExitInterview(id);},400);
  });
}
function showExitInterview(id){
  var j=__JY.find(function(x){return x.id===id;});
  if(!j){toast('Open the journey first',false);return;}
  var ei=j.exitInterview||{};
  var cats=(__EXIT_CATS).map(function(c){
    return '<option value="'+a(c)+'"'+(ei.reasonCategory===c?' selected':'')+'>'+h(c)+'</option>';
  }).join('');
  var box=document.getElementById('jyExitBox');
  if(!box){
    var wrap=document.createElement('div');wrap.id='jyExitBox';
    var form=document.getElementById('jyForm');if(form)form.appendChild(wrap);else el('content').appendChild(wrap);
    box=wrap;
  }
  box.innerHTML='<div class="card" style="border-color:#dc2626"><h3>Resignation &amp; Exit Interview</h3>'+
    '<div class="banner warn" style="font-weight:600;line-height:1.45">'+h(__LABOUR_NOTE)+'</div>'+
    '<p class="muted">Stage: <b>'+h(j.stage)+'</b> · Resignation date: '+h(j.resignationDate||'')+'</p>'+
    '<div class="row2"><div><label>Interview date</label><input type="date" id="eiDate" value="'+a(ei.interviewDate||today())+'"></div>'+
    '<div><label>Interviewed by</label><input id="eiBy" value="'+a(ei.interviewedBy||'')+'"></div></div>'+
    '<div class="row2"><div><label>Reason category</label><select id="eiCat"><option value="">— select —</option>'+cats+'</select></div>'+
    '<div><label>Would rejoin?</label><select id="eiRejoin"><option value="">—</option>'+
      ['yes','no','maybe'].map(function(v){return '<option value="'+v+'"'+(ei.wouldRejoin===v?' selected':'')+'>'+v+'</option>';}).join('')+
    '</select></div></div>'+
    '<label>Reason detail</label><textarea id="eiDetail" rows="2">'+h(ei.reasonDetail||j.resignationReason||'')+'</textarea>'+
    '<label>Feedback / improvement</label><textarea id="eiFb" rows="2">'+h(ei.feedback||'')+'</textarea>'+
    '<div class="row2"><div><label><input type="checkbox" id="eiId"'+(ei.idCardReturned?' checked':'')+'> ID card returned</label></div>'+
    '<div><label><input type="checkbox" id="eiUni"'+(ei.uniformReturned?' checked':'')+'> Uniform / kit returned</label></div></div>'+
    '<label>Outstanding dues / recovery note</label><input id="eiDues" value="'+a(ei.outstandingDues||'')+'">'+
    '<p style="margin:12px 0 6px;color:#fde68a;font-weight:800">Indian labour codes (mandatory)</p>'+
    '<label><input type="checkbox" id="eiLabour"'+(ei.labourCodeAcknowledged?' checked':'')+'> I confirm <b>latest Indian labour codes</b> apply to this exit (Wages / IR / Social Security / OSHWC + PSARA)</label>'+
    '<div class="row2" style="margin-top:8px"><div><label><input type="checkbox" id="eiNotice"'+(ei.noticePeriodOk?' checked':'')+'> Notice period / pay in lieu handled</label></div>'+
    '<div><label><input type="checkbox" id="eiFnF"'+(ei.finalSettlementOk?' checked':'')+'> Full &amp; final / wages settled or scheduled</label></div></div>'+
    '<label>Notice notes</label><input id="eiNoticeN" value="'+a(ei.noticePeriodNotes||'')+'">'+
    '<label>F&amp;F / settlement notes</label><input id="eiFnFN" value="'+a(ei.finalSettlementNotes||'')+'">'+
    '<label>EPF / ESIC / social security notes</label><input id="eiSS" value="'+a(ei.socialSecurityNotes||'')+'">'+
    '<div style="margin-top:12px">'+
      '<button type="button" class="btn" onclick="saveExitInterview(\\''+id+'\\')">Save exit interview</button> '+
      '<button type="button" class="btn r" onclick="closeResignation(\\''+id+'\\')">Complete &amp; close resignation</button>'+
    '</div></div>';
}
function saveExitInterview(id){
  api('saveExitInterview',{id:id,exitInterview:{
    interviewDate:el('eiDate').value,interviewedBy:el('eiBy').value,
    reasonCategory:el('eiCat').value,reasonDetail:el('eiDetail').value,
    wouldRejoin:el('eiRejoin').value,feedback:el('eiFb').value,
    idCardReturned:el('eiId').checked,uniformReturned:el('eiUni').checked,
    outstandingDues:el('eiDues').value,
    labourCodeAcknowledged:el('eiLabour').checked,
    noticePeriodOk:el('eiNotice').checked,noticePeriodNotes:el('eiNoticeN').value,
    finalSettlementOk:el('eiFnF').checked,finalSettlementNotes:el('eiFnFN').value,
    socialSecurityNotes:el('eiSS').value
  }}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Save failed',false);return;}
    if(res.j.labourCodeNote)__LABOUR_NOTE=res.j.labourCodeNote;
    toast('Exit interview saved',true);loadJourneys();
  });
}
function closeResignation(id){
  api('saveExitInterview',{id:id,exitInterview:{
    interviewDate:el('eiDate').value,interviewedBy:el('eiBy').value,
    reasonCategory:el('eiCat').value,reasonDetail:el('eiDetail').value,
    wouldRejoin:el('eiRejoin').value,feedback:el('eiFb').value,
    idCardReturned:el('eiId').checked,uniformReturned:el('eiUni').checked,
    outstandingDues:el('eiDues').value,
    labourCodeAcknowledged:el('eiLabour').checked,
    noticePeriodOk:el('eiNotice').checked,noticePeriodNotes:el('eiNoticeN').value,
    finalSettlementOk:el('eiFnF').checked,finalSettlementNotes:el('eiFnFN').value,
    socialSecurityNotes:el('eiSS').value
  }}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Save failed',false);return;}
    return api('completeExitInterview',{id:id});
  }).then(function(res){
    if(!res)return;
    if(res.s!==200){toast(res.j.error||'Cannot close yet — complete labour-code & returns checks',false);return;}
    toast('Resignation closed after exit interview',true);loadJourneys();
  });
}

var __GUARDS=[], __PEOPLE_KIND='';
function masters(){
  el('content').innerHTML='<div class="card"><h3>People — Guards, Staff & Posts</h3>'+
    '<div class="banner warn" style="margin-bottom:12px">Rule: <b>Guards and Agile staff start duty only with a face photo</b>. No photo → duty stages stay locked.</div>'+
    '<div class="toolbar">'+
    '<button type="button" class="btn" onclick="loadGuards()">All people</button>'+
    '<button type="button" class="btn grey" onclick="loadGuards(\'guard\')">Guards only</button>'+
    '<button type="button" class="btn grey" onclick="loadGuards(\'staff\')">Agile staff only</button>'+
    '<button type="button" class="btn grey" onclick="loadPosts()">Posts</button></div>'+
    copyPanelHtml()+
    '<div id="msForm"></div><div id="msList" class="muted">Load people or posts.</div></div>';
  loadGuards('');
}
function loadGuards(kind){
  if(kind===undefined) kind=__PEOPLE_KIND||'';
  __PEOPLE_KIND=kind||'';
  el('msForm').innerHTML=formCard('Add / update person',
    '<div class="row2"><div><label>Name</label><input id="gName"></div><div><label>Employee ID / Staff code</label><input id="gEmp"></div></div>'+
    '<div class="row2"><div><label>Mobile</label><input id="gMob"></div><div><label>Rank / Designation</label><input id="gRank"></div></div>'+
    '<div class="row2"><div>'+branchSel('gBranch',CTX.branchId)+'</div><div><label>Kind</label><select id="gKind"><option value="guard">Guard</option><option value="staff">Agile staff</option></select></div></div>'+
    '<div class="row2"><div><label>DOJ</label><input type="date" id="gDoj"></div><div><label>Email (staff)</label><input id="gEmail" placeholder="name@agilegroup.co.in"></div></div>'+
    '<div style="margin-top:10px;padding:12px;border:1px dashed #d4a017;border-radius:10px;background:#1a1408">'+
    '<b style="color:#fde68a">Agile staff + Face photo</b>'+
    '<p class="muted" style="margin:4px 0 8px">Staff who work in Agile Group were not fully in shadow before — use the green staff button. Photo is mandatory before duty for guards and staff.</p>'+
    '<div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap">'+
    '<div id="gPhotoPreview" style="min-width:96px;min-height:96px;border:1px solid #334155;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:11px;background:#0b1220">No photo yet</div>'+
    '<div style="flex:1">'+
    '<div class="toolbar">'+
    '<button type="button" class="btn green" id="copyStaffBtn" onclick="copyAgileStaff()">Copy Agile staff into shadow</button> '+
    '<button type="button" class="btn green" id="copyMobilePhotosBtn" onclick="copyPhotosFromMobile()">Copy photos from mobile app</button></div>'+
    '<div id="mobilePhotoStatus" class="muted" style="margin:6px 0 10px;white-space:pre-wrap"></div>'+
    '<div class="toolbar"><div class="fld"><label>Employee ID / staff code for one photo</label><input id="gPhotoEmp" placeholder="e.g. AG12345 or mobile"></div> '+
    '<button type="button" class="btn amb" onclick="uploadPeoplePhoto()">Upload / take photo</button></div>'+
    '</div></div></div>',
    '<button type="button" class="btn" onclick="saveGuard()">Save person</button>');
  api('listGuards',{branchId:bid('gBranch'),kind:__PEOPLE_KIND}).then(function(res){
    __GUARDS=res.j.guards||[];
    var c=res.j.counts||{};
    var tip='<p class="muted">Showing: <b>'+(__PEOPLE_KIND||'all')+'</b> · Staff in shadow: <b>'+(c.staff||0)+'</b> · Guards: <b>'+(c.guardsOnly||0)+'</b> · With photo here: <b>'+(c.withPhoto||0)+'/'+(__GUARDS.length)+'</b>. Duty needs photo.</p>';
    renderGuardTable(__GUARDS, tip);
  });
}
function copyAgileStaff(){
  var btn=el('copyStaffBtn'); if(btn)btn.disabled=true;
  var st=el('mobilePhotoStatus');
  if(st){st.className='muted';st.textContent='Copying Agile Group staff from MIS…';}
  api('importStaffFromLive',{}).then(function(res){
    if(btn)btn.disabled=false;
    if(res.s!==200){
      if(st){st.className='msg err';st.textContent=res.j.error||'Staff copy failed';}
      toast(res.j.error||'Staff copy failed',false);return;
    }
    if(st){st.className='msg ok';st.textContent=res.j.message||'Staff copied';}
    toast('Agile staff copied',true);
    loadGuards('staff');
  });
}
function renderGuardTable(g, tip){
  tip=tip||'';
  var q=((el('gSearch')&&el('gSearch').value)||'').trim().toLowerCase();
  var onlyMiss=el('gOnlyMiss')&&el('gOnlyMiss').checked;
  var filtered=g.filter(function(x){
    if(onlyMiss && x.photoId)return false;
    if(!q)return true;
    return (x.name||'').toLowerCase().indexOf(q)>=0 || (x.employeeId||'').toLowerCase().indexOf(q)>=0 || (x.branchName||'').toLowerCase().indexOf(q)>=0;
  });
  var show=filtered.slice(0,250);
  el('msList').innerHTML=tip+
    '<div class="toolbar"><div class="fld"><label>Search name / ID</label><input id="gSearch" value="'+a(q)+'" oninput="renderGuardTable(__GUARDS)"></div>'+
    '<label style="margin-top:18px"><input type="checkbox" id="gOnlyMiss"'+(onlyMiss?' checked':'')+' onchange="renderGuardTable(__GUARDS)"> Only missing photo</label></div>'+
    '<p class="muted">Showing '+show.length+(filtered.length>show.length?' of '+filtered.length:'')+' people.</p>'+
    '<div class="tblwrap"><table><thead><tr><th>Photo</th><th>Name</th><th>ID</th><th>Kind</th><th>Branch</th><th>Rank</th><th>Photo</th></tr></thead><tbody>'+
    show.map(function(x){
      var gi=__GUARDS.indexOf(x);
      var ph=x.photoId?'<img class="av" src="'+photoUrl(x.photoId)+'" alt="" style="background:#fff">':'<span class="muted">No</span>';
      return '<tr><td>'+ph+'</td><td>'+h(x.name)+'</td><td>'+h(x.employeeId)+'</td><td>'+h(x.kind||'guard')+'</td><td>'+h(x.branchName||x.branchId)+'</td><td>'+h(x.rank)+'</td><td>'+
        '<button type="button" class="btn amb" onclick="uploadPeoplePhotoRow('+gi+')">Photo</button></td></tr>';
    }).join('')+'</tbody></table></div>';
}
var __photoImportOffset=0;
function copyPhotosFromMobile(){
  var btn=el('copyMobilePhotosBtn'); if(btn)btn.disabled=true;
  var st=el('mobilePhotoStatus');
  if(st){st.className='muted';st.textContent='Copying photos from mobile / Work360… please wait.';}
  api('importPhotosFromMobile',{limit:25,offset:__photoImportOffset}).then(function(res){
    if(btn)btn.disabled=false;
    if(res.s!==200){
      if(st){st.className='msg err';st.textContent=res.j.error||'Copy failed';}
      toast(res.j.error||'Copy failed',false);return;
    }
    var j=res.j||{};
    if(j.hasMore) __photoImportOffset=j.nextOffset||(__photoImportOffset+25);
    else __photoImportOffset=0;
    if(st){
      st.className=j.imported>0?'msg ok':'muted';
      st.textContent=(j.message||'Done')+(j.hasMore?'\\nTap the green button again for the next batch.':'');
    }
    toast(j.imported>0?('Copied '+j.imported+' photos'):(j.message||'Checked mobile photos'), j.imported>0);
    loadGuards();
  });
}
function uploadPeoplePhoto(){
  var emp=(el('gPhotoEmp')&&el('gPhotoEmp').value)||(el('gEmp')&&el('gEmp').value)||'';
  var name=(el('gName')&&el('gName').value)||'';
  if(!String(emp).trim()){toast('Type the Employee ID in the yellow photo box first.',false);return;}
  uploadGuardPhotoNow({employeeId:emp.trim(),name:name,previewId:'gPhotoPreview',onDone:function(res){
    if(res.dataUrl) setPhotoPreview('gPhotoPreview', res.dataUrl);
    else if(res.previewUrl) setPhotoPreview('gPhotoPreview', res.previewUrl);
    loadGuards();
  }});
}
function uploadPeoplePhotoRow(gi){
  var x=__GUARDS[gi]; if(!x){toast('Guard not found',false);return;}
  if(el('gPhotoEmp')) el('gPhotoEmp').value=x.employeeId||'';
  uploadGuardPhotoNow({guardId:x.id,employeeId:x.employeeId,name:x.name,previewId:'gPhotoPreview',onDone:function(res){
    if(res.dataUrl) setPhotoPreview('gPhotoPreview', res.dataUrl);
    x.photoId=res.photoId||x.photoId;
    loadGuards();
  }});
}
function saveGuard(){
  var br=(CTX.branches||[]).find(function(b){return b.id===bid('gBranch');});
  var emp=el('gEmp').value;
  var kind=el('gKind')?el('gKind').value:'guard';
  api('saveGuard',{guard:{name:el('gName').value,employeeId:emp,mobile:el('gMob').value,rank:el('gRank').value,
    kind:kind,email:el('gEmail')?el('gEmail').value:'',
    branchId:bid('gBranch')||CTX.branchId,branchName:br?br.name:'',doj:el('gDoj').value,status:'active'}}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}
    toast('Saved',true);
    if(el('gPhotoEmp'))el('gPhotoEmp').value=emp;
    loadGuards(kind==='staff'?'staff':__PEOPLE_KIND);
  });
}
function loadPosts(){
  el('msForm').innerHTML=formCard('Add / update post',
    '<div class="row2"><div><label>Client</label><input id="pClient"></div><div><label>Post name</label><input id="pName"></div></div>'+
    '<div class="row2"><div>'+branchSel('pBranch',CTX.branchId)+'</div><div><label>Location</label><input id="pLoc"></div></div>'+
    '<div class="row3"><div><label>San A</label><input id="pA" type="number" value="0"></div><div><label>San G</label><input id="pG" type="number" value="0"></div>'+
    '<div><label>San B</label><input id="pB" type="number" value="0"></div></div><div><label>San C</label><input id="pC" type="number" value="0" style="max-width:120px"></div>',
    '<button type="button" class="btn" onclick="savePost()">Save post</button>');
  api('listPosts',{branchId:bid('pBranch')}).then(function(res){
    var p=res.j.posts||[];
    el('msList').innerHTML='<div class="tblwrap"><table><thead><tr><th>Client</th><th>Post</th><th>Branch</th><th>A/G/B/C</th><th>Active</th></tr></thead><tbody>'+
      p.map(function(x){return '<tr><td>'+h(x.clientName)+'</td><td>'+h(x.postName)+' <span class="muted">'+h(x.id)+'</span></td><td>'+h(x.branchName||x.branchId)+
        '</td><td>'+x.sanA+'/'+x.sanG+'/'+x.sanB+'/'+x.sanC+'</td><td>'+(x.active!==false?'Yes':'No')+'</td></tr>';}).join('')+
      '</tbody></table></div>';
  });
}
function savePost(){
  var br=(CTX.branches||[]).find(function(b){return b.id===bid('pBranch');});
  api('savePost',{post:{clientName:el('pClient').value,postName:el('pName').value,location:el('pLoc').value,
    branchId:bid('pBranch')||CTX.branchId,branchName:br?br.name:'',sanA:+el('pA').value||0,sanG:+el('pG').value||0,sanB:+el('pB').value||0,sanC:+el('pC').value||0,active:true}}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Post saved',true);loadPosts();
  });
}

function simpleListForm(opts){
  el('content').innerHTML='<div class="card"><h3>'+h(opts.title)+'</h3>'+opts.formHtml+
    '<div style="margin-top:10px"><button type="button" class="btn" onclick="'+opts.saveFn+'()">Save</button> <button type="button" class="btn grey" onclick="'+opts.loadFn+'()">Refresh</button></div>'+
    '<div id="lfOut" style="margin-top:12px" class="muted">Loading…</div></div>';
  window[opts.loadFn]();
}
function appointments(){
  simpleListForm({title:'Staff Appointment',saveFn:'saveAppt',loadFn:'loadAppt',formHtml:
    '<div class="row2"><div><label>Name</label><input id="apName"></div><div><label>Employee ID</label><input id="apEmp"></div></div>'+
    '<div class="row2"><div><label>Designation</label><input id="apDesig"></div><div><label>DOJ</label><input type="date" id="apDoj"></div></div>'+
    '<div class="row2"><div>'+branchSel('apBranch',CTX.branchId)+'</div><div><label>Letter No</label><input id="apLetter"></div></div>'+
    '<label>Remarks</label><input id="apRem"><label>Kind</label><select id="apKind"><option value="guard">Guard</option><option value="staff">Staff</option></select>'});
}
function loadAppt(){api('listAppointments',{branchId:bid('apBranch')}).then(function(res){
  var rows=res.j.appointments||[];
  el('lfOut').innerHTML='<div class="tblwrap"><table><thead><tr><th>Name</th><th>Emp</th><th>Desig</th><th>DOJ</th><th>Letter</th></tr></thead><tbody>'+
    rows.map(function(x){return '<tr><td>'+h(x.name)+'</td><td>'+h(x.employeeId)+'</td><td>'+h(x.designation)+'</td><td>'+h(x.doj)+'</td><td>'+h(x.letterNo)+'</td></tr>';}).join('')+'</tbody></table></div>';
});}
function saveAppt(){
  var br=(CTX.branches||[]).find(function(b){return b.id===bid('apBranch');});
  api('saveAppointment',{appointment:{kind:el('apKind').value,name:el('apName').value,employeeId:el('apEmp').value,designation:el('apDesig').value,
    doj:el('apDoj').value,letterNo:el('apLetter').value,remarks:el('apRem').value,branchId:bid('apBranch')||CTX.branchId,branchName:br?br.name:''}}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Saved',true);loadAppt();
  });
}

function idcards(){
  simpleListForm({title:'ID Cards',saveFn:'saveId',loadFn:'loadId',formHtml:
    '<div class="row2"><div><label>Guard name</label><input id="idName"></div><div><label>Employee ID</label><input id="idEmp"></div></div>'+
    '<div class="row2"><div><label>Issue date</label><input type="date" id="idIssue" value="'+today()+'"></div><div><label>Valid upto</label><input type="date" id="idValid"></div></div>'+
    '<div class="row2"><div>'+branchSel('idBranch',CTX.branchId)+'</div><div><label>Status</label><select id="idStatus"><option>active</option><option>reprint</option><option>stopped</option><option>expired</option></select></div></div>'});
}
function loadId(){api('listIdCards',{branchId:bid('idBranch')}).then(function(res){
  var rows=res.j.idCards||res.j.cards||[];
  el('lfOut').innerHTML='<div class="tblwrap"><table><thead><tr><th>Guard</th><th>Emp</th><th>Issue</th><th>Valid</th><th>Status</th></tr></thead><tbody>'+
    rows.map(function(x){return '<tr><td>'+h(x.guardName)+'</td><td>'+h(x.employeeId)+'</td><td>'+h(x.issueDate)+'</td><td>'+h(x.validUpto)+'</td><td>'+h(x.status)+'</td></tr>';}).join('')+'</tbody></table></div>';
});}
function saveId(){
  api('saveIdCard',{idCard:{guardName:el('idName').value,employeeId:el('idEmp').value,issueDate:el('idIssue').value,validUpto:el('idValid').value,
    status:el('idStatus').value,branchId:bid('idBranch')||CTX.branchId}}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Saved',true);loadId();
  });
}

function orders(){
  simpleListForm({title:'Deployment Orders',saveFn:'saveOrd',loadFn:'loadOrd',formHtml:
    '<div class="row2"><div><label>Guard name</label><input id="oName"></div><div><label>Employee ID</label><input id="oEmp"></div></div>'+
    '<div class="row2"><div><label>Client</label><input id="oClient"></div><div><label>Post</label><input id="oPost"></div></div>'+
    '<div class="row3"><div><label>Rank</label><input id="oRank"></div><div><label>Shift</label><select id="oShift"><option>A</option><option>G</option><option>B</option><option>C</option></select></div>'+
    '<div><label>Joining date</label><input type="date" id="oJoin" value="'+today()+'"></div></div>'+
    '<div>'+branchSel('oBranch',CTX.branchId)+'</div>'});
}
function loadOrd(){api('listOrders',{branchId:bid('oBranch')}).then(function(res){
  var rows=res.j.orders||[];
  el('lfOut').innerHTML='<div class="tblwrap"><table><thead><tr><th>Order</th><th>Guard</th><th>Client</th><th>Post</th><th>Shift</th><th>Join</th><th>Status</th></tr></thead><tbody>'+
    rows.map(function(x){return '<tr><td>'+h(x.orderNo)+'</td><td>'+h(x.guardName)+'</td><td>'+h(x.clientName)+'</td><td>'+h(x.postName)+'</td><td>'+h(x.shift)+'</td><td>'+h(x.joiningDate)+'</td><td>'+h(x.status)+'</td></tr>';}).join('')+'</tbody></table></div>';
});}
function saveOrd(){
  var br=(CTX.branches||[]).find(function(b){return b.id===bid('oBranch');});
  api('saveOrder',{order:{guardName:el('oName').value,employeeId:el('oEmp').value,clientName:el('oClient').value,postName:el('oPost').value,
    rank:el('oRank').value,shift:el('oShift').value,joiningDate:el('oJoin').value,branchId:bid('oBranch')||CTX.branchId,branchName:br?br.name:'',status:'issued'}}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Saved',true);loadOrd();
  });
}

function uniforms(){
  simpleListForm({title:'Uniform Issue',saveFn:'saveUni',loadFn:'loadUni',formHtml:
    '<div class="row2"><div><label>Guard name</label><input id="uName"></div><div><label>Employee ID</label><input id="uEmp"></div></div>'+
    '<div class="row2"><div><label>Items</label><input id="uItems" placeholder="Shirt, Cap…"></div><div><label>Sizes</label><input id="uSizes"></div></div>'+
    '<div class="row2"><div><label>Issue date</label><input type="date" id="uIssue" value="'+today()+'"></div><div>'+branchSel('uBranch',CTX.branchId)+'</div></div>'});
}
function loadUni(){api('listUniforms',{branchId:bid('uBranch')}).then(function(res){
  var rows=res.j.uniforms||[];
  el('lfOut').innerHTML='<div class="tblwrap"><table><thead><tr><th>Guard</th><th>Items</th><th>Sizes</th><th>Issue</th><th>Status</th></tr></thead><tbody>'+
    rows.map(function(x){return '<tr><td>'+h(x.guardName)+'</td><td>'+h(x.items)+'</td><td>'+h(x.sizes)+'</td><td>'+h(x.issueDate)+'</td><td>'+h(x.status)+'</td></tr>';}).join('')+'</tbody></table></div>';
});}
function saveUni(){
  api('saveUniform',{uniform:{guardName:el('uName').value,employeeId:el('uEmp').value,items:el('uItems').value,sizes:el('uSizes').value,
    issueDate:el('uIssue').value,branchId:bid('uBranch')||CTX.branchId,status:'issued'}}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Saved',true);loadUni();
  });
}

function roster(){
  el('content').innerHTML='<div class="card"><h3>Shift Roster / W.Off</h3><div class="toolbar">'+
    '<div class="fld"><label>Date</label><input type="date" id="roDate" value="'+today()+'"></div><div class="fld">'+branchSel('roBranch',CTX.branchId)+'</div>'+
    '<button type="button" class="btn grey" onclick="loadRoster()">Load</button></div>'+
    formCard('Add slot',
      '<div class="row2"><div><label>Post name</label><input id="roPost"></div><div><label>Client</label><input id="roClient"></div></div>'+
      '<div class="row3"><div><label>Shift</label><select id="roShift"><option>A</option><option>G</option><option>B</option><option>C</option></select></div>'+
      '<div><label>Guard name</label><input id="roGuard"></div><div><label>Employee ID</label><input id="roEmp"></div></div>'+
      '<label><input type="checkbox" id="roWoff"> Weekly off</label>',
      '<button type="button" class="btn" onclick="saveRoster()">Save slot</button>')+
    '<div id="roList"></div></div>';
  loadRoster();
}
function loadRoster(){api('listRoster',{date:el('roDate').value||today(),branchId:bid('roBranch')}).then(function(res){
  var rows=res.j.roster||[];
  el('roList').innerHTML='<div class="tblwrap"><table><thead><tr><th>Post</th><th>Client</th><th>Shift</th><th>Guard</th><th>W.Off</th></tr></thead><tbody>'+
    rows.map(function(x){return '<tr><td>'+h(x.postName)+'</td><td>'+h(x.clientName)+'</td><td>'+h(x.shift)+'</td><td>'+h(x.guardName)+'</td><td>'+(x.isWOff?'Yes':'No')+'</td></tr>';}).join('')+'</tbody></table></div>';
});}
function saveRoster(){
  api('saveRosterSlot',{slot:{date:el('roDate').value||today(),branchId:bid('roBranch')||CTX.branchId,postName:el('roPost').value,clientName:el('roClient').value,
    shift:el('roShift').value,guardName:el('roGuard').value,employeeId:el('roEmp').value,isWOff:el('roWoff').checked}}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Saved',true);loadRoster();
  });
}

function months(){
  el('content').innerHTML='<div class="card"><h3>Monthly Attendance</h3><div class="toolbar">'+
    '<div class="fld"><label>Month</label><input type="month" id="moMonth" value="'+monthNow()+'"></div><div class="fld">'+branchSel('moBranch',CTX.branchId)+'</div>'+
    '<button type="button" class="btn" onclick="buildMonth()">Build</button>'+
    '<button type="button" class="btn grey" onclick="loadMonths()">List</button>'+
    (PORTAL==='management'?'<button type="button" class="btn green" onclick="approveMonth()">Approve</button><button type="button" class="btn amb" onclick="lockMonth()">Lock</button>':'')+
    '<button type="button" class="btn" onclick="submitMonth()">Submit</button></div><div id="moOut"></div></div>';
  loadMonths();
}
function loadMonths(){api('listMonths',{branchId:bid('moBranch')}).then(function(res){
  var rows=res.j.months||[];
  window.__MONTHS=rows;
  el('moOut').innerHTML='<div class="tblwrap"><table><thead><tr><th>Month</th><th>Branch</th><th>Status</th><th>Rows</th><th>Trusted</th></tr></thead><tbody>'+
    rows.map(function(x,i){return '<tr onclick="selMonth('+i+')"><td>'+h(x.month)+'</td><td>'+h(x.branchName||x.branchId)+'</td><td>'+h(x.status)+'</td><td>'+(x.rows||[]).length+'</td><td>'+(x.trusted?'Yes':'No')+'</td></tr>';}).join('')+'</tbody></table></div><p class="muted">Click a row then Submit / Approve / Lock. Selected: <span id="moSel">—</span></p>';
});}
function selMonth(i){var x=window.__MONTHS[i];if(!x)return;window.__MID=x.id;if(el('moSel'))el('moSel').textContent=x.month+' · '+(x.branchName||x.branchId)+' · '+x.status;}
function buildMonth(){api('buildMonthRegister',{month:el('moMonth').value||monthNow(),branchId:bid('moBranch')||CTX.branchId}).then(function(res){
  if(res.s!==200){toast(res.j.error||'Build failed',false);return;}toast('Register built',true);loadMonths();
});}
function submitMonth(){if(!window.__MID){toast('Select a register row first',false);return;}
  api('submitMonth',{id:window.__MID}).then(function(res){if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Submitted',true);loadMonths();});}
function approveMonth(){if(!window.__MID){toast('Select a register',false);return;}
  api('approveMonth',{id:window.__MID}).then(function(res){if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Approved',true);loadMonths();});}
function lockMonth(){if(!window.__MID){toast('Select a register',false);return;}
  api('lockMonth',{id:window.__MID}).then(function(res){if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Locked',true);loadMonths();});}

function invoice(){
  el('content').innerHTML=shadowBanner()+'<div class="card"><h3>Invoice Feed Preview</h3><p class="muted">Preview only — never sent while shadow blocks feed.</p>'+
    '<div class="toolbar"><div class="fld"><label>Month</label><input type="month" id="invMonth" value="'+monthNow()+'"></div>'+
    '<div class="fld">'+branchSel('invBranch')+'</div><button type="button" class="btn" onclick="prevInv()">Preview</button></div><div id="invOut"></div></div>';
}
function prevInv(){api('previewInvoiceFeed',{month:el('invMonth').value||monthNow(),branchId:bid('invBranch')}).then(function(res){
  if(res.s!==200){el('invOut').innerHTML='<div class="banner warn">'+h(res.j.error||'Blocked')+'</div>';return;}
  var rows=res.j.rows||res.j.feed||[];
  el('invOut').innerHTML='<p class="muted">'+h(res.j.note||'')+'</p><div class="tblwrap"><table><thead><tr><th>Branch</th><th>Client</th><th>Post</th><th>Strength</th><th>Days</th></tr></thead><tbody>'+
    rows.map(function(x){return '<tr><td>'+h(x.branchName)+'</td><td>'+h(x.clientName)+'</td><td>'+h(x.postName)+'</td><td>'+h(x.billableStrength)+'</td><td>'+h(x.billableDays)+'</td></tr>';}).join('')+
    '</tbody></table></div>';
});}

function transitions(){
  simpleListForm({title:'Transition Plans',saveFn:'saveTr',loadFn:'loadTr',formHtml:
    '<div class="row2"><div><label>Client</label><input id="trClient"></div><div>'+branchSel('trBranch',CTX.branchId)+'</div></div>'+
    '<div class="row2"><div><label>Start date</label><input type="date" id="trStart"></div><div><label>Go-live</label><input type="date" id="trLive"></div></div>'+
    '<label>Rank strength</label><input id="trRank"><label>Manpower schedule</label><textarea id="trMan" rows="2"></textarea>'+
    '<label>Training plan</label><textarea id="trTrain" rows="2"></textarea><label>Logistics</label><textarea id="trLog" rows="2"></textarea>'});
}
function loadTr(){api('listTransitions',{branchId:bid('trBranch')}).then(function(res){
  var rows=res.j.transitions||[];
  el('lfOut').innerHTML='<div class="tblwrap"><table><thead><tr><th>Client</th><th>Start</th><th>Go-live</th><th>Status</th></tr></thead><tbody>'+
    rows.map(function(x){return '<tr><td>'+h(x.clientName)+'</td><td>'+h(x.startDate)+'</td><td>'+h(x.goLiveDate)+'</td><td>'+h(x.status)+'</td></tr>';}).join('')+'</tbody></table></div>';
});}
function saveTr(){
  api('saveTransition',{transition:{clientName:el('trClient').value,branchId:bid('trBranch')||CTX.branchId,startDate:el('trStart').value,goLiveDate:el('trLive').value,
    rankStrength:el('trRank').value,manpowerSchedule:el('trMan').value,trainingPlan:el('trTrain').value,logisticsNotes:el('trLog').value,status:'planning'}}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Saved',true);loadTr();
  });
}

function flags(){
  el('content').innerHTML='Loading flags…';
  api('getFlags').then(function(res){
    var f=res.j.flags||{};CTX.flags=f;
    var canSave=PORTAL==='management';
    el('content').innerHTML=shadowBanner()+
      '<div class="card"><h3>Safety Flags</h3><p class="muted">Both portals can view. Only Management can save / approve cutover.</p>'+
      '<div class="kgrid"><div class="kpi"><b>'+(f.shadow!==false?'ON':'OFF')+'</b><span>OPS_SHADOW</span></div>'+
      '<div class="kpi"><b>'+(f.invoiceFeed?'ON':'OFF')+'</b><span>Invoice feed</span></div>'+
      '<div class="kpi"><b>'+h(f.attendanceSource||'work360')+'</b><span>Attendance source</span></div>'+
      '<div class="kpi"><b>'+(f.cutoverApprovedAt?'YES':'NO')+'</b><span>Cutover approved</span></div></div>'+
      '<p class="muted">Cutover by: '+h(f.cutoverApprovedBy||'—')+' · '+h(f.cutoverApprovedAt||'')+'</p>'+
      (canSave?
        '<div class="row2"><div><label>Shadow</label><select id="flShadow"><option value="true"'+(f.shadow!==false?' selected':'')+'>true</option><option value="false"'+(f.shadow===false?' selected':'')+'>false</option></select></div>'+
        '<div><label>Invoice feed</label><select id="flInv"><option value="false"'+(f.invoiceFeed?'':' selected')+'>false</option><option value="true"'+(f.invoiceFeed?' selected':'')+'>true</option></select></div></div>'+
        '<div class="row2"><div><label>MIS prefill</label><select id="flMis"><option value="false"'+(f.misPrefill?'':' selected')+'>false</option><option value="true"'+(f.misPrefill?' selected':'')+'>true</option></select></div>'+
        '<div><label>Attendance source</label><select id="flSrc"><option value="work360">work360</option><option value="agile_mobile">agile_mobile</option><option value="both">both</option></select></div></div>'+
        '<div style="margin-top:12px"><button type="button" class="btn" onclick="saveFlags()">Save flags</button> '+
        '<button type="button" class="btn green" onclick="doCutover()">Approve cutover</button></div>':
        '<p class="muted">Ask Management to change flags or approve cutover.</p>')+
      '</div>';
    if(canSave&&el('flSrc'))el('flSrc').value=f.attendanceSource||'work360';
  });
}
function saveFlags(){
  if(PORTAL!=='management'){toast('Management only',false);return;}
  api('saveFlags',{shadow:el('flShadow').value==='true',invoiceFeed:el('flInv').value==='true',misPrefill:el('flMis').value==='true',attendanceSource:el('flSrc').value}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Blocked',false);return;}CTX.flags=res.j.flags||CTX.flags;toast('Flags saved',true);flags();
  });
}
function doCutover(){
  if(PORTAL!=='management'){toast('Management only',false);return;}
  if(!confirm('Approve cutover? Invoice feed may become allowed with shadow stamp.'))return;
  api('approveCutover',{}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}CTX.flags=res.j.flags||CTX.flags;toast('Cutover approved',true);flags();
  });
}

/* ——— QUALITY ——— */
function visits(){
  simpleListForm({title:'Visit Actions',saveFn:'saveVisit',loadFn:'loadVisits',formHtml:
    '<div class="row2"><div><label>Date</label><input type="date" id="vDate" value="'+today()+'"></div><div>'+branchSel('vBranch',CTX.branchId)+'</div></div>'+
    '<div class="row2"><div><label>Kind</label><select id="vKind"><option value="day">Day</option><option value="night">Night</option><option value="training">Training</option></select></div>'+
    '<div><label>Assignee</label><input id="vAsg"></div></div>'+
    '<div class="row2"><div><label>Client</label><input id="vClient"></div><div><label>Post</label><input id="vPost"></div></div>'+
    '<div class="row2"><div><label>Status</label><select id="vStatus"><option>open</option><option>in_progress</option><option>closed</option><option>escalated</option></select></div>'+
    '<div><label>Notes</label><input id="vNotes"></div></div>'});
}
function loadVisits(){api('listVisits',{branchId:bid('vBranch')}).then(function(res){
  var rows=res.j.visits||[];
  el('lfOut').innerHTML='<div class="tblwrap"><table><thead><tr><th>Date</th><th>Kind</th><th>Client</th><th>Post</th><th>Assignee</th><th>Status</th></tr></thead><tbody>'+
    rows.map(function(x){return '<tr><td>'+h(x.date)+'</td><td>'+h(x.kind)+'</td><td>'+h(x.clientName)+'</td><td>'+h(x.postName)+'</td><td>'+h(x.assignee)+'</td><td>'+h(x.status)+'</td></tr>';}).join('')+'</tbody></table></div>';
});}
function saveVisit(){
  api('saveVisit',{visit:{date:el('vDate').value,branchId:bid('vBranch')||CTX.branchId,kind:el('vKind').value,assignee:el('vAsg').value,
    clientName:el('vClient').value,postName:el('vPost').value,status:el('vStatus').value,notes:el('vNotes').value}}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Saved',true);loadVisits();
  });
}

function scorecards(){
  simpleListForm({title:'Service Scorecards',saveFn:'saveSc',loadFn:'loadSc',formHtml:
    '<div class="row2"><div><label>Month</label><input type="month" id="scMonth" value="'+monthNow()+'"></div><div>'+branchSel('scBranch',CTX.branchId)+'</div></div>'+
    '<div class="row2"><div><label>Client</label><input id="scClient"></div><div><label>Post</label><input id="scPost"></div></div>'+
    '<div class="row2"><div><label>Score</label><input type="number" id="scScore" min="0" max="100"></div><div><label>Notes</label><input id="scNotes"></div></div>'});
}
function loadSc(){api('listScorecards',{branchId:bid('scBranch')}).then(function(res){
  var rows=res.j.scorecards||[];
  el('lfOut').innerHTML='<div class="tblwrap"><table><thead><tr><th>Month</th><th>Client</th><th>Post</th><th>Score</th><th>Notes</th></tr></thead><tbody>'+
    rows.map(function(x){return '<tr><td>'+h(x.month)+'</td><td>'+h(x.clientName)+'</td><td>'+h(x.postName)+'</td><td>'+h(x.score)+'</td><td>'+h(x.notes)+'</td></tr>';}).join('')+'</tbody></table></div>';
});}
function saveSc(){
  api('saveScorecard',{scorecard:{month:el('scMonth').value,branchId:bid('scBranch')||CTX.branchId,clientName:el('scClient').value,postName:el('scPost').value,score:+el('scScore').value||0,notes:el('scNotes').value}}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Saved',true);loadSc();
  });
}

function findings(){
  simpleListForm({title:'Periodical Audit / Findings',saveFn:'saveFd',loadFn:'loadFd',formHtml:
    '<div class="row2"><div><label>Date</label><input type="date" id="fdDate" value="'+today()+'"></div><div>'+branchSel('fdBranch',CTX.branchId)+'</div></div>'+
    '<div class="row2"><div><label>Client</label><input id="fdClient"></div><div><label>Post</label><input id="fdPost"></div></div>'+
    '<label>Finding</label><textarea id="fdText" rows="2"></textarea>'+
    '<div class="row3"><div><label>Severity</label><select id="fdSev"><option>medium</option><option>low</option><option>high</option></select></div>'+
    '<div><label>Owner</label><input id="fdOwner"></div><div><label>Due</label><input type="date" id="fdDue"></div></div>'+
    '<label>Correction plan</label><textarea id="fdPlan" rows="2"></textarea>'+
    '<label>Status</label><select id="fdStatus"><option>open</option><option>closed</option></select>'});
}
function loadFd(){api('listFindings',{branchId:bid('fdBranch')}).then(function(res){
  var rows=res.j.findings||[];
  el('lfOut').innerHTML='<div class="tblwrap"><table><thead><tr><th>Date</th><th>Client</th><th>Finding</th><th>Sev</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead><tbody>'+
    rows.map(function(x){return '<tr><td>'+h(x.date)+'</td><td>'+h(x.clientName)+'</td><td>'+h(x.finding)+'</td><td>'+h(x.severity)+'</td><td>'+h(x.owner)+'</td><td>'+h(x.dueDate)+'</td><td>'+h(x.status)+'</td></tr>';}).join('')+'</tbody></table></div>';
});}
function saveFd(){
  api('saveFinding',{finding:{date:el('fdDate').value,branchId:bid('fdBranch')||CTX.branchId,clientName:el('fdClient').value,postName:el('fdPost').value,
    finding:el('fdText').value,severity:el('fdSev').value,owner:el('fdOwner').value,dueDate:el('fdDue').value,correctionPlan:el('fdPlan').value,status:el('fdStatus').value}}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Saved',true);loadFd();
  });
}

function clientReports(){
  el('content').innerHTML='<div class="card"><h3>Client Report Pack</h3><div class="toolbar"><div class="fld">'+branchSel('crpBranch')+
    '</div><button type="button" class="btn" onclick="loadPack()">Build pack</button></div><div id="crpOut" class="muted">Loads visits, findings, scorecards for client packs.</div></div>';
}
function loadPack(){
  var b=bid('crpBranch');
  Promise.all([api('listVisits',{branchId:b}),api('listFindings',{branchId:b}),api('listScorecards',{branchId:b})]).then(function(arr){
    var v=arr[0].j.visits||[],f=arr[1].j.findings||[],s=arr[2].j.scorecards||[];
    el('crpOut').innerHTML='<div class="kgrid"><div class="kpi"><b>'+v.length+'</b><span>Visits</span></div><div class="kpi"><b>'+f.length+'</b><span>Findings</span></div><div class="kpi"><b>'+s.length+'</b><span>Scorecards</span></div></div>'+
      '<h3 style="margin:12px 0 6px;color:#fff">Open findings</h3><div class="tblwrap"><table><thead><tr><th>Date</th><th>Client</th><th>Finding</th><th>Sev</th><th>Status</th></tr></thead><tbody>'+
      f.filter(function(x){return x.status!=='closed';}).map(function(x){return '<tr><td>'+h(x.date)+'</td><td>'+h(x.clientName)+'</td><td>'+h(x.finding)+'</td><td>'+h(x.severity)+'</td><td>'+h(x.status)+'</td></tr>';}).join('')+
      '</tbody></table></div>';
  });
}

/* ——— MEETINGS ——— */
function meetForm(kind){
  window.__MEET_KIND=kind;
  el('content').innerHTML='<div class="card"><h3>'+(kind==='monthly'?'Monthly':'Weekly')+' Meeting</h3>'+
    '<div class="row2"><div><label>Date</label><input type="date" id="mtDate" value="'+today()+'"></div><div>'+branchSel('mtBranch',CTX.branchId)+'</div></div>'+
    '<label>Title</label><input id="mtTitle" value="'+(kind==='monthly'?'Monthly Ops Meeting':'Weekly Ops Meeting')+'">'+
    '<label>Agenda (extra notes — auto-pull adds ops stats)</label><textarea id="mtAgenda" rows="3"></textarea>'+
    '<label>MOM</label><textarea id="mtMom" rows="4"></textarea>'+
    '<div style="margin-top:10px"><button type="button" class="btn" onclick="saveMeet()">Save meeting</button> <button type="button" class="btn grey" onclick="loadMeets()">List</button></div>'+
    '<div id="mtList" style="margin-top:12px"></div></div>';
  loadMeets();
}
function weeklyMeet(){meetForm('weekly');}
function monthlyMeet(){meetForm('monthly');}
function loadMeets(){var kind=window.__MEET_KIND;api('listMeetings',{branchId:bid('mtBranch')}).then(function(res){
  var rows=(res.j.meetings||[]).filter(function(m){return!kind||m.kind===kind;});
  window.__MEETS=res.j.meetings||[];window.__CORR=res.j.corrections||[];
  el('mtList').innerHTML='<div class="tblwrap"><table><thead><tr><th>Date</th><th>Title</th><th>Status</th><th>Agenda</th></tr></thead><tbody>'+
    rows.map(function(x){return '<tr><td>'+h(x.date)+'</td><td>'+h(x.title)+'</td><td>'+h(x.status)+'</td><td style="white-space:pre-wrap;max-width:320px">'+h(x.agenda)+'</td></tr>';}).join('')+'</tbody></table></div>';
});}
function saveMeet(){
  var kind=window.__MEET_KIND||'weekly';
  api('saveMeeting',{meeting:{kind:kind,date:el('mtDate').value||today(),branchId:bid('mtBranch')||CTX.branchId,title:el('mtTitle').value,agenda:el('mtAgenda').value,mom:el('mtMom').value,status:'draft'}}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Meeting saved (agenda auto-pulled)',true);loadMeets();
  });
}

function corrections(){
  el('content').innerHTML='<div class="card"><h3>MOM & Corrections</h3>'+
    '<div class="row2"><div><label>Meeting ID</label><input id="cMeet" placeholder="from list below"></div><div><label>Owner</label><input id="cOwner"></div></div>'+
    '<label>Action</label><input id="cAction"><div class="row2"><div><label>Due</label><input type="date" id="cDue"></div>'+
    '<div><label>Status</label><select id="cStatus"><option>open</option><option>done</option></select></div></div>'+
    '<label>Evidence</label><input id="cEvid">'+
    '<div style="margin-top:10px"><button type="button" class="btn" onclick="saveCorr()">Save correction</button> <button type="button" class="btn grey" onclick="loadCorr()">Refresh</button></div>'+
    '<div id="cOut" style="margin-top:12px"></div></div>';
  loadCorr();
}
function loadCorr(){api('listMeetings',{}).then(function(res){
  var meets=res.j.meetings||[],corr=res.j.corrections||[];
  window.__MEETS=meets;
  el('cOut').innerHTML='<p class="muted">Meetings</p><div class="tblwrap"><table><thead><tr><th>ID</th><th>Date</th><th>Title</th><th>MOM</th></tr></thead><tbody>'+
    meets.map(function(m,i){return '<tr onclick="pickMeet('+i+')"><td>'+h(m.id)+'</td><td>'+h(m.date)+'</td><td>'+h(m.title)+'</td><td style="white-space:pre-wrap;max-width:280px">'+h(m.mom)+'</td></tr>';}).join('')+
    '</tbody></table></div><p class="muted" style="margin-top:12px">Corrections</p><div class="tblwrap"><table><thead><tr><th>Meeting</th><th>Action</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead><tbody>'+
    corr.map(function(c){return '<tr><td>'+h(c.meetingId)+'</td><td>'+h(c.action)+'</td><td>'+h(c.owner)+'</td><td>'+h(c.dueDate)+'</td><td>'+h(c.status)+'</td></tr>';}).join('')+'</tbody></table></div>';
});}
function pickMeet(i){var m=window.__MEETS[i];if(m&&el('cMeet'))el('cMeet').value=m.id;}
function saveCorr(){
  api('saveCorrection',{correction:{meetingId:el('cMeet').value,action:el('cAction').value,owner:el('cOwner').value,dueDate:el('cDue').value,status:el('cStatus').value,evidence:el('cEvid').value}}).then(function(res){
    if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Saved',true);loadCorr();
  });
}

function agenda(){
  el('content').innerHTML='<div class="card"><h3>Agenda Pull</h3><p class="muted">Pulls vacancy fills, late, out-of-post, open findings for the date — then you can save as weekly meeting.</p>'+
    '<div class="toolbar"><div class="fld"><label>Date</label><input type="date" id="agDate" value="'+today()+'"></div><div class="fld">'+branchSel('agBranch',CTX.branchId)+'</div>'+
    '<button type="button" class="btn" onclick="pullAgenda()">Pull now</button></div><div id="agOut"></div></div>';
}
function pullAgenda(){
  var d=el('agDate').value||today();
  Promise.all([api('controlBoard',{date:d,branchId:bid('agBranch')}),api('listFindings',{branchId:bid('agBranch')})]).then(function(arr){
    var board=arr[0].j||{},finds=(arr[1].j.findings||[]).filter(function(f){return f.status!=='closed';});
    var lines=[
      'Vacancy fills today: '+((board.fills||[]).length),
      'Late / OOP exceptions: '+((board.exceptions||[]).length),
      'Vacant slots: '+((board.vacant||[]).length),
      'Open audit findings: '+finds.length
    ];
    el('agOut').innerHTML='<pre style="background:#0b1220;padding:12px;border-radius:8px;white-space:pre-wrap;color:#e2e8f0">'+h(lines.join('\\n'))+'</pre>'+
      '<button type="button" class="btn" id="agSave">Save as weekly meeting</button>';
    el('agSave').onclick=function(){
      api('saveMeeting',{meeting:{kind:'weekly',date:d,branchId:bid('agBranch')||CTX.branchId,title:'Weekly Ops Meeting',agenda:lines.join('\\n'),mom:'',status:'draft'}}).then(function(res){
        if(res.s!==200){toast(res.j.error||'Failed',false);return;}toast('Agenda saved as weekly meeting',true);
      });
    };
  });
}

/* boot — open Control if Director already verified PIN (no second login) */
(function boot(){
  try{
    if(typeof otpRestoreSession==='function'&&otpRestoreSession()&&OTP_SESSION){
      onOtpLogin({});
      return;
    }
  }catch(e){}
  // Fallback: token still in hash
  try{
    var m=String(location.hash||'').match(/[#&]otp=([^&]+)/);
    if(m&&m[1]){
      OTP_SESSION=decodeURIComponent(m[1]);
      if(typeof otpStoreSession==='function')otpStoreSession(OTP_SESSION,'','','');
      try{history.replaceState(null,'',location.pathname+location.search);}catch(e2){}
      onOtpLogin({});
    }
  }catch(e){}
})();
</script>
</body></html>`
}

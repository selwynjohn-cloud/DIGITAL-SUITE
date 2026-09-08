import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hodLoginHtml, otpLoginHtml, otpLoginScript } from '../_lib/embedded-otp.js'
import { loadBranchLoginOptionsHtml } from '../_lib/branch-login-options.js'
import { RECRUIT_REPORT_CSS } from '../_lib/recruitment/brand.js'
import { MASTER_DIRECTORY_MGMT_MENU_ITEM, OPEN_MASTER_DIRECTORY_JS } from '../_lib/master-directory.js'
import { REGISTERED_CANDIDATES_JS } from '../_lib/recruitment/registered-candidates-pages.js'
import { SECURITY_NEWS_REGISTERED_JS } from '../_lib/recruitment/security-news-registered-pages.js'
import { WALK_IN_PAGES_JS } from '../_lib/recruitment/walk-in-pages.js'
import { REFERRAL_LIST_PAGES_JS } from '../_lib/recruitment/referral-list-pages.js'
import { DRR_DETAIL_PAGES_JS } from '../_lib/recruitment/drr-detail-pages.js'
import { RECRUIT_PORTAL_PAGES_JS } from '../_lib/recruitment/portal-pages.js'
import { FUNNEL_FOLLOWUP_JS } from '../_lib/recruitment/funnel-followup-pages.js'

function recruitPortal(req: VercelRequest): 'staff' | 'management' {
  const q = req.query || {}
  const portal = String(q.portal ?? '').trim().toLowerCase()
  if (portal === 'management') return 'management'
  if (portal === 'staff') return 'staff'
  // Command Centre also sends suite_role — use if portal was dropped
  const suiteRole = String(q.suite_role ?? '').trim().toLowerCase()
  return suiteRole === 'management' ? 'management' : 'staff'
}

async function recruitPage(portal: 'staff' | 'management') {
  const branchOpts =
    portal === 'staff' ? await loadBranchLoginOptionsHtml('recruitment') : ''
  const loginBlock =
    portal === 'management'
      ? otpLoginHtml('Agile Recruitment', 'Management Portal — work email + PIN from inbox')
      : hodLoginHtml(
          'Agile Recruitment',
          'HOD / Staff — select your branch, then email PIN or 6-digit branch password',
          branchOpts,
        )
  return PAGE.replace('__RECRUIT_LOGIN__', loginBlock).replace(
    '__RECRUIT_OTP_SCRIPT__',
    otpLoginScript('recruitment', 'Agile Recruitment', portal),
  )
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(await recruitPage(recruitPortal(req)))
}

const SOURCES = ['WhatsApp', 'SecurityJob.co.in', 'Field Agent', 'Referral', 'Sub-Agency', 'Recruitment Camp', 'News / Media', 'Walk-in', 'News Bulletin', 'Other']
const PIPE_STAGES = [
  { id: 'applied', label: 'Applied' },
  { id: 'walk_in', label: 'Walk-in' },
  { id: 'verification', label: 'Verification' },
  { id: 'medical', label: 'Medicals' },
  { id: 'ready', label: 'Ready to Deploy' },
  { id: 'deployed', label: 'Deployed' },
  { id: 'join_back', label: 'Join-Back' },
]

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Recruitment — Guard Manpower</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:14px}
#login{max-width:400px;margin:0 auto;padding-top:10vh}
.card{background:#111a30;border:1px solid #22304f;border-radius:14px;padding:20px;margin-bottom:14px}
input,select,textarea{width:100%;padding:9px 11px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:14px}
label{display:block;font-size:12px;color:#94a3b8;margin:8px 0 3px;font-weight:700}
.btn{padding:10px 16px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:13px;background:#7c3aed;color:#fff}
.btn.sky{background:#0ea5e9}.grey{background:#334155;color:#e2e8f0}.green{background:#16a34a;color:#fff}.r{background:#dc2626;color:#fff}.amb{background:#d97706;color:#fff}.gold{background:#c9a84c;color:#14224f}
.msg{padding:10px;border-radius:8px;font-size:14px;margin-top:10px;display:none}
#shell{display:none;height:100vh}
.side{position:fixed;top:0;left:0;bottom:0;width:230px;background:#0e1730;border-right:1px solid #22304f;display:flex;flex-direction:column;overflow-y:auto;z-index:40}
.brand{padding:16px;text-align:center;border-bottom:1px solid #22304f}.brand img{height:46px}.brand b{display:block;color:#fff;font-size:13px;margin-top:6px}.brand small{color:#a78bfa;font-size:11px}
.menu{padding:6px;flex:1}.mi{display:flex;align-items:center;gap:8px;padding:10px 11px;border-radius:9px;color:#cbd5e1;cursor:pointer;font-weight:600;font-size:13px}.mi:hover{background:#16223f}.mi.active{background:#7c3aed;color:#fff}
.mi.head{cursor:default;color:#c9a84c;font-size:11px;text-transform:uppercase;letter-spacing:.04em;padding:14px 11px 6px;opacity:.95}.mi.head:hover{background:transparent}.mi.head.active{background:transparent;color:#c9a84c}
.logout{padding:12px 16px;border-top:1px solid #22304f;color:#94a3b8;cursor:pointer;font-size:12px}
.help-links{padding:8px 12px;border-top:1px solid #22304f;display:flex;flex-direction:column;gap:6px}
.help-links a{color:#a78bfa;font-size:12px;font-weight:700;text-decoration:none}
.help-links a:hover{color:#ddd6fe;text-decoration:underline}
.main{margin-left:230px;min-height:100vh}
.bar{background:#111a30;border-bottom:1px solid #22304f;padding:12px 18px;display:flex;justify-content:space-between;align-items:center}
.bar b{color:#fff;font-size:16px}.content{padding:16px}
.burger{display:none;background:#7c3aed;color:#fff;border:none;border-radius:8px;padding:8px 12px;font-weight:800}
@media(max-width:900px){.side{transform:translateX(-100%);transition:.2s}.side.open{transform:none;box-shadow:8px 0 24px rgba(0,0,0,.45)}.main{margin-left:0}.burger{display:inline-block}.content{padding:12px}}
#shell.shell-ready{display:flex;flex-direction:column}
.kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px}
.kpi{border-radius:12px;padding:14px;border:1px solid #22304f}.kpi b{font-size:24px;color:#fff;display:block}.kpi span{font-size:11px;color:#94a3b8}
.kpi.purple{background:linear-gradient(135deg,#4c1d95,#7c3aed)}.kpi.sky{background:linear-gradient(135deg,#0369a1,#0ea5e9)}.kpi.red{background:linear-gradient(135deg,#7f1d1d,#dc2626)}
.kpi.green{background:linear-gradient(135deg,#14532d,#16a34a)}.kpi.amber{background:linear-gradient(135deg,#92400e,#d97706)}
.tblwrap{overflow-x:auto;border:1px solid #22304f;border-radius:8px}table{border-collapse:collapse;width:100%;font-size:12px}
th,td{border:1px solid #22304f;padding:6px;text-align:left}th{background:#0b1220;color:#94a3b8;font-size:10px;text-transform:uppercase}
.savebar{position:sticky;bottom:0;background:#111a30;border-top:1px solid #22304f;padding:12px;text-align:center}
.inactive{opacity:.45}
.vedit{background:#111a30;border:1px solid #7c3aed;border-radius:12px;padding:16px;margin-top:12px}
.vedit h4{color:#a78bfa;margin-bottom:10px}
.switch{position:relative;display:inline-block;width:46px;height:26px;vertical-align:middle}
.switch input{opacity:0;width:0;height:0;position:absolute}
.slider{position:absolute;cursor:pointer;inset:0;background:#334155;transition:.2s;border-radius:26px;border:1px solid #475569}
.slider:before{position:absolute;content:"";height:20px;width:20px;left:2px;bottom:2px;background:#94a3b8;transition:.2s;border-radius:50%}
.switch input:checked+.slider{background:#16a34a;border-color:#15803d}
.switch input:checked+.slider:before{transform:translateX(20px);background:#fff}
.switch-lbl{font-size:11px;color:#94a3b8;margin-left:6px;vertical-align:middle}
.drr-other-box{display:none}
.badge-role{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700}
.badge-admin{background:#312e81;color:#c4b5fd}.badge-branch{background:#0369a1;color:#7dd3fc}
.fgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}
.hidden{display:none!important}
${RECRUIT_REPORT_CSS}
</style></head>
<body>
<p style="max-width:400px;margin:12px auto 0;padding:10px 14px;border-radius:10px;background:#0e1730;border:1px solid #7c3aed;text-align:center;font-size:13px;color:#cbd5e1;line-height:1.5" id="recruitPortalHint">Branch HOD: white <b>HODs / Staff</b> button · Management: dark <b>Management</b> button on App 01.</p>
__RECRUIT_LOGIN__

<div id="shell">
  <div class="side" id="side">
    <div class="brand"><img src="https://www.agilegroup-digital.co.in/agile-logo.png"><b>Agile Recruitment</b><small id="portalTag">Building Teams That Win</small></div>
    <div class="menu" id="menu"></div>
    <div class="help-links">
      <a href="/recruitment/manual" target="_blank" rel="noopener">📖 User Guide (Staff &amp; HOD)</a>
      <a href="/recruitment/troubleshooting" target="_blank" rel="noopener">🔧 Troubleshooting</a>
    </div>
    <div class="logout" onclick="logout()">⎋ Logout</div>
  </div>
  <div class="main">
    <div class="bar"><div style="display:flex;align-items:center;gap:10px"><button class="burger" onclick="document.getElementById('side').classList.toggle('open')">☰</button><b id="ttl">Dashboard</b></div><span id="userLine" style="color:#94a3b8;font-size:12px"></span></div>
    <div class="content" id="content"></div>
  </div>
</div>

<script>
__RECRUIT_OTP_SCRIPT__
var __rq=new URLSearchParams(location.search);
var PORTAL=(__rq.get('portal')==='management'||(__rq.get('portal')!=='staff'&&__rq.get('suite_role')==='management'))?'management':'staff';
OTP_ROLE=PORTAL;
(function(){var hint=document.getElementById('recruitPortalHint');if(!hint)return;hint.innerHTML=PORTAL==='management'
  ? 'Management Portal — use your <b>@agilegroup.co.in</b> email and the PIN from your email.'
  : 'Branch HOD / Staff — select branch and enter your <b>branch password</b>, or use email PIN.';})();
var DRR=[],GUARDS=[],REQS=[],JOINS=[],VENDORS=[],USERS=[],CFG={shortageCount:13,previousShortage:15,dailyTargetPerBranch:5,monthlyTarget:100,contractedStrength:0,actualDeployed:0,wageHoldSites:[]};
var SHORTAGE={date:'',vac:0,ot:0,shortage:0,prevVac:0,prevOt:0,prevShortage:0,openingVac:0,openingOt:0,openingShortage:0,openingDate:'',recruitsSinceBaseline:0,san:0,dep:0,misSubmittedCount:0,branchCount:0,source:'config',label:'Opening from Consolidated MIS 14/08/2026 · Shortages = Vacant + OT',byBranch:[]};
var RECRUIT_ROLE='admin',RECRUIT_BRANCH='',RECRUIT_DASH='ALL',PIPE_STAGE='applied',CUR=0,GUARD_EDIT=-1,USR=-1;
var __AB_PAYLOADS=[];
var BRANCHES=['Bangalore','Bhopal','Chennai','Hi-Tech City','Hyderabad - A','Hyderabad - B','Kakinada','Kochi','Lucknow','Mumbai','Nellore','Puducherry','Surat','Tada','Tadipatri','Tirupati','Vijayawada','Visakhapatnam'];
function recruitCentres(){
  return (BRANCHES||[]).filter(function(b){return b&&b!=='Corporate Office'&&b!=='Recruitment Department'&&b!=='Gulbarga'&&b!=='Hyderabad';})
    .slice().sort(function(a,b){return String(a).localeCompare(String(b),'en',{sensitivity:'base'});});
}
var STAFF_MENU=[
  {n:'Dashboard',fn:'staffDash',icon:'📊'},
  {n:'Cumulative Referral Details',fn:'referralListPage',icon:'🔗'},
  {n:'— Sourcing Funnel —',fn:'',icon:'',head:true},
  {n:'Walk-in',fn:'sourceWalkIn',icon:'🚶'},
  {n:'Referral',fn:'sourceReferral',icon:'🔗'},
  {n:'Training (EOI) Follow-up',fn:'trainingEoiFollowUp',icon:'📨'},
  {n:'Absconder List (7+ days)',fn:'absconders',icon:'🚨'},
  {n:'Irregular Attendance (under 13 duties)',fn:'irregularAttendance',icon:'📅'},
  {n:'Academy',fn:'sourceAcademy',icon:'🎓'},
  {n:'Recruiters',fn:'sourceRecruiters',icon:'🧑‍💼'},
  {n:'Security Job — Registered List',fn:'sjRegisteredList',icon:'📱'},
  {n:'Security News - Registered List',fn:'snRegisteredList',icon:'📰'},
  {n:'— Recruitment —',fn:'',icon:'',head:true},
  {n:'Branch-wise Wages',fn:'branchWiseWages',icon:'💰'},
  {n:'Branch-wise Vacant (Rank-wise)',fn:'branchVacantRankWise',icon:'📉'},
  {n:'Daily Recruitment Report (DRR) submission',fn:'drrForm',icon:'📋'},
  {n:'Recruited List',fn:'recruitedList',icon:'✅'},
  {n:'Rejoin List',fn:'rejoinList',icon:'🔄'},
  {n:'Referral Incentives',fn:'referralIncentives',icon:'🎁'},
  {n:'Recruitment format',fn:'recruitmentFormats',icon:'📣'},
  {n:'— Recruitment Admin —',fn:'',icon:'',head:true},
  {n:'User Guide',fn:'openUserGuide',icon:'📖'},
  {n:'Troubleshooting',fn:'openTroubleshooting',icon:'🔧'}
];
var BRANCH_STAFF_MENU=[
  {n:'Dashboard',fn:'staffDash',icon:'📊'},
  {n:'Cumulative Referral Details',fn:'referralListPage',icon:'🔗'},
  {n:'— Sourcing Funnel —',fn:'',icon:'',head:true},
  {n:'Walk-in',fn:'sourceWalkIn',icon:'🚶'},
  {n:'Referral',fn:'sourceReferral',icon:'🔗'},
  {n:'Training (EOI) Follow-up',fn:'trainingEoiFollowUp',icon:'📨'},
  {n:'Absconder List (7+ days)',fn:'absconders',icon:'🚨'},
  {n:'Irregular Attendance (under 13 duties)',fn:'irregularAttendance',icon:'📅'},
  {n:'Academy',fn:'sourceAcademy',icon:'🎓'},
  {n:'Recruiters',fn:'sourceRecruiters',icon:'🧑‍💼'},
  {n:'Security Job — Registered List',fn:'sjRegisteredList',icon:'📱'},
  {n:'Security News - Registered List',fn:'snRegisteredList',icon:'📰'},
  {n:'— Recruitment —',fn:'',icon:'',head:true},
  {n:'Branch-wise Wages',fn:'branchWiseWages',icon:'💰'},
  {n:'Branch-wise Vacant (Rank-wise)',fn:'branchVacantRankWise',icon:'📉'},
  {n:'Daily Recruitment Report (DRR) submission',fn:'drrForm',icon:'📋'},
  {n:'Recruited List',fn:'recruitedList',icon:'✅'},
  {n:'Rejoin List',fn:'rejoinList',icon:'🔄'},
  {n:'Referral Incentives',fn:'referralIncentives',icon:'🎁'},
  {n:'Recruitment format',fn:'recruitmentFormats',icon:'📣'},
  {n:'— Recruitment Admin —',fn:'',icon:'',head:true},
  {n:'User Guide',fn:'openUserGuide',icon:'📖'},
  {n:'Troubleshooting',fn:'openTroubleshooting',icon:'🔧'}
];
var MGMT_MENU=[
  {n:'Dashboard',fn:'mgmtDash',icon:'📊'},
  {n:'Cumulative Referral Details',fn:'referralListPage',icon:'🔗'},
  {n:'— Sourcing Funnel —',fn:'',icon:'',head:true},
  {n:'Walk-in',fn:'sourceWalkIn',icon:'🚶'},
  {n:'Referral',fn:'sourceReferral',icon:'🔗'},
  {n:'Training (EOI) Follow-up',fn:'trainingEoiFollowUp',icon:'📨'},
  {n:'Absconder List (7+ days)',fn:'absconders',icon:'🚨'},
  {n:'Irregular Attendance (under 13 duties)',fn:'irregularAttendance',icon:'📅'},
  {n:'Academy',fn:'sourceAcademy',icon:'🎓'},
  {n:'Recruiters',fn:'sourceRecruiters',icon:'🧑‍💼'},
  {n:'Security Job — Registered List',fn:'sjRegisteredList',icon:'📱'},
  {n:'Security News - Registered List',fn:'snRegisteredList',icon:'📰'},
  {n:'— Recruitment —',fn:'',icon:'',head:true},
  {n:'Branch-wise Wages',fn:'branchWiseWages',icon:'💰'},
  {n:'Branch-wise Vacant (Rank-wise)',fn:'branchVacantRankWise',icon:'📉'},
  {n:'Daily Recruitment Report (DRR)',fn:'drrForm',icon:'📋'},
  {n:'DRR History',fn:'drrLogs',icon:'📁'},
  {n:'Recruited List',fn:'recruitedList',icon:'✅'},
  {n:'Rejoin List',fn:'rejoinList',icon:'🔄'},
  {n:'Referral Incentives',fn:'referralIncentives',icon:'🎁'},
  {n:'Recruitment format',fn:'recruitmentFormats',icon:'📣'},
  {n:'— Recruitment Admin —',fn:'',icon:'',head:true},
  {n:'User Management',fn:'users',icon:'👤'},
  {n:'Configuration',fn:'settings',icon:'⚙'},
  ${JSON.stringify(MASTER_DIRECTORY_MGMT_MENU_ITEM)},
  {n:'User Guide',fn:'openUserGuide',icon:'📖'},
  {n:'Troubleshooting',fn:'openTroubleshooting',icon:'🔧'}
];
var PUBLIC_FORM='https://www.securityjob.co.in',SECURITYJOB='https://www.securityjob.co.in',HELPLINE='18005995599';
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function nid(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function today(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});}
function api(action,extra){return fetch('/api/recruitment/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,branchId:RECRUIT_BRANCH||''},extra||{}))}).then(function(r){return r.text().then(function(t){var j={};try{j=t?JSON.parse(t):{};}catch(e){j={error:(t&&String(t).slice(0,120))||('Server error '+r.status)};}return{s:r.status,j:j};});});}
function applyData(j){if(!j)return;DRR=j.drr||DRR;if(j.drrDetails)DRR_DETAILS=j.drrDetails;GUARDS=j.guards||GUARDS;REQS=j.requisitions||REQS;JOINS=j.joinbacks||JOINS;VENDORS=j.vendors||VENDORS;USERS=j.users||USERS;CFG=j.config||CFG;if(j.shortage)SHORTAGE=j.shortage;if(j.recruitBranches&&j.recruitBranches.length)BRANCHES=j.recruitBranches.filter(function(b){return b&&b!=='Corporate Office'&&b!=='Gulbarga'&&b!=='Hyderabad'&&b!=='Recruitment Department';});}
function reloadThen(fn){api('load').then(function(res){if(res.s===200)applyData(res.j);fn();}).catch(function(){fn();});}
${OPEN_MASTER_DIRECTORY_JS}
${REGISTERED_CANDIDATES_JS}
${SECURITY_NEWS_REGISTERED_JS}
${WALK_IN_PAGES_JS}
${FUNNEL_FOLLOWUP_JS}
${REFERRAL_LIST_PAGES_JS}
${DRR_DETAIL_PAGES_JS}
${RECRUIT_PORTAL_PAGES_JS}
function reportHdr(t,sub,b){return '<div class="rpt-sheet"><div class="rpt-hdr"><div class="rpt-gold-bar"></div><img src="https://www.agilegroup-digital.co.in/agile-logo.png"><div class="rpt-co">AGILE SECURITY FORCE PRIVATE LIMITED</div><h2 class="rpt-title">'+h(t)+'</h2>'+(sub?'<p class="rpt-sub">'+sub+'</p>':'')+(b?'<div class="rpt-badge">'+b+'</div>':'')+'</div>';}
function reportFtr(){return '<div class="rpt-ftr"><div class="rpt-gold-bar"></div><p><b>Agile Recruitment</b> — Guard Recruitment &amp; Manpower</p><p><a href="https://www.agilegroup.co.in" style="color:#7dd3fc;text-decoration:none">www.agilegroup.co.in</a> Created by Cursor.AI</p><p class="rpt-copy">© Agile Security Force Private Limited · Confidential</p></div>';}
function reportSec(l){return '<div class="rpt-sec"><span>'+h(l)+'</span></div>';}
function pageToolbar(opts){
  opts=opts||{};
  var share=PORTAL==='management'&&opts.share?'<button type="button" class="btn sky suite-tap-no-feedback" onclick="shareDashboardEmail()">✉ Share Dashboard</button>':'';
  return '<div class="savebar" style="margin:0 0 12px;justify-content:flex-end;flex-wrap:wrap;gap:8px">'+share+'<button type="button" class="btn grey" onclick="refreshCurrentPage()">↻ Refresh</button></div>';
}
function reportWrap(t,sub,b,body,opts){return reportHdr(t,sub,b)+'<div class="rpt-body">'+pageToolbar(opts)+body+'</div>'+reportFtr()+'</div>';}
function refreshCurrentPage(){
  var m=activeMenu();
  if(!m||!m[CUR])return;
  reloadThen(function(){
    var prev=reloadThen;
    reloadThen=function(cb){try{cb();}catch(e){}};
    try{
      var fn=window[m[CUR].fn];
      if(typeof fn==='function')fn();
    }catch(err){
      el('content').innerHTML='<div class="card"><h2 style="color:#fff">Could not refresh</h2><p class="rpt-note">'+h(err&&err.message?err.message:String(err))+'</p></div>';
    }finally{
      reloadThen=prev;
    }
  });
}
function shareDashboardEmail(){
  if(PORTAL!=='management'){alert('Share is available on the Management portal.');return;}
  var to=prompt('Send Dashboard to this email (MD or others):','');
  if(!to)return;
  to=String(to).trim();
  if(!to.includes('@')){alert('Please enter a valid email address.');return;}
  api('shareDashboard',{to:to}).then(function(res){
    if(res.s===200&&res.j&&res.j.ok)alert('Dashboard sent to '+to);
    else alert((res.j&&res.j.error)||'Could not send. Try again.');
  }).catch(function(){alert('Could not send. Check internet and try again.');});
}
function portalBadge(){return PORTAL==='staff'?(RECRUIT_BRANCH?h(RECRUIT_BRANCH)+' · Branch':'Branch Portal'):'Management Portal';}
function activeMenu(){if(PORTAL==='staff'&&RECRUIT_ROLE==='branch')return BRANCH_STAFF_MENU;return PORTAL==='staff'?STAFF_MENU:MGMT_MENU;}
function buildMenu(){
  var m=activeMenu();
  el('menu').innerHTML=m.map(function(x,i){
    if(x.head)return '<div class="mi head">'+h(x.n)+'</div>';
    return '<div class="mi'+(CUR===i?' active':'')+'" onclick="tab('+i+')">'+x.icon+' '+h(x.n)+'</div>';
  }).join('');
  if(el('portalTag'))el('portalTag').textContent=PORTAL==='staff'?'Branch Portal':'Management';
}
function tab(i){
  try{
    var m=activeMenu();
    if(!m||!m[i]){el('content').innerHTML='<div class="card"><p class="rpt-note">Menu item missing. Please hard refresh (Cmd+Shift+R) and sign in again.</p></div>';return;}
    if(m[i].head){return;}
    CUR=i;
    buildMenu();
    if(el('ttl'))el('ttl').textContent=m[i].n;
    if(el('side'))el('side').classList.remove('open');
    var fn=window[m[i].fn];
    if(typeof fn!=='function'){
      el('content').innerHTML='<div class="card"><h2 style="color:#fff">'+h(m[i].n)+'</h2><p class="rpt-note">This page is not available yet (missing '+h(m[i].fn)+'). Hard refresh and try again.</p></div>';
      return;
    }
    fn();
  }catch(err){
    el('content').innerHTML='<div class="card"><h2 style="color:#fff">Could not open page</h2><p class="rpt-note">'+h(err&&err.message?err.message:String(err))+'</p><p class="rpt-note">Hard refresh (Cmd+Shift+R), sign in again, then tap the menu.</p></div>';
  }
}
function branchList(){return PORTAL==='staff'&&RECRUIT_BRANCH?[RECRUIT_BRANCH]:BRANCHES;}
function filterBranch(list,fb){return list.filter(function(x){return x.active!==false&&(!fb||fb==='ALL'||x.branchId===fb);});}
function shortageVac(){return SHORTAGE&&SHORTAGE.source==='mis'?Number(SHORTAGE.vac||0):0;}
function shortageOt(){return SHORTAGE&&SHORTAGE.source==='mis'?Number(SHORTAGE.ot||0):0;}
function shortageTotal(){
  if(SHORTAGE&&SHORTAGE.source==='mis'){
    if(SHORTAGE.shortage!=null)return Number(SHORTAGE.shortage||0);
    return Number(SHORTAGE.vac||0)+Number(SHORTAGE.ot||0);
  }
  return CFG.shortageCount||0;
}
function shortageBanner(){
  var vac=shortageVac(),ot=shortageOt(),s=shortageTotal();
  var open=Number(SHORTAGE&&(SHORTAGE.openingShortage!=null?SHORTAGE.openingShortage:SHORTAGE.prevShortage)!=null?(SHORTAGE.openingShortage!=null?SHORTAGE.openingShortage:SHORTAGE.prevShortage):(CFG.previousShortage||s));
  var openVac=Number(SHORTAGE&&SHORTAGE.openingVac!=null?SHORTAGE.openingVac:SHORTAGE.prevVac||0);
  var openOt=Number(SHORTAGE&&SHORTAGE.openingOt!=null?SHORTAGE.openingOt:SHORTAGE.prevOt||0);
  var rec=Number(SHORTAGE&&SHORTAGE.recruitsSinceBaseline||0);
  var delta=open-s;
  var cls=s>=15?'critical':s>=8?'warn':'ok';
  var trend=delta>0?'↓ Filled '+delta+' since opening':(rec>0?'— Stable after recruitment':'— No recruitment yet vs opening');
  var openDate=SHORTAGE&&SHORTAGE.openingDate?SHORTAGE.openingDate:'2026-08-14';
  var asOf=SHORTAGE&&SHORTAGE.label?(' · '+SHORTAGE.label):'';
  return '<div class="shortage-banner '+cls+'"><span>🚨 TOTAL SHORTAGES (remaining)</span><b>'+s+'</b><span style="font-size:12px;opacity:.9">Opening Vacant '+openVac+' + OT '+openOt+' = '+open+' from Consolidated MIS '+h(openDate)+' · Recruits since then '+rec+' · '+trend+asOf+'</span></div>';
}
function improveBar(prev,cur,recruited){
  var p=Number(prev||0),c=Number(cur||0),r=Number(recruited||0);
  var delta=p-c;
  var improved=delta>0;
  var stable=delta===0;
  var worsened=delta<0;
  /** No improvement → red; improved or stable → green. */
  var noImprove=worsened||(p>0&&!improved&&r===0);
  var color=noImprove?'#dc2626':'#16a34a';
  var label=improved?'↓ Improved '+delta:(stable?(noImprove?'No improvement':'— Stable'):'↑ +'+Math.abs(delta));
  var pct=p>0?Math.round(Math.min(100,Math.max(0,(Math.max(0,delta)/p)*100))):(improved||stable?100:8);
  if(noImprove)pct=Math.max(8,Math.min(100,Math.round((c/(p||c||1))*40)));
  return '<div style="min-width:110px"><div style="height:8px;background:#1e293b;border-radius:4px;overflow:hidden"><div style="width:'+pct+'%;height:100%;background:'+color+'"></div></div><small style="color:'+color+'">'+label+'</small></div>';
}
function branchMisRow(b){
  var list=(SHORTAGE&&SHORTAGE.byBranch)||[];
  for(var i=0;i<list.length;i++){if(list[i].branch===b)return list[i];}
  return {branch:b,vac:0,ot:0,shortage:0,prevVac:0,prevOt:0,prevShortage:0,openingVac:0,openingOt:0,openingShortage:0,recruitsSinceBaseline:0,san:0,dep:0,misSubmitted:false};
}
function sendBranchShortageReminder(b){
  if(!b)return;
  if(!confirm('Send shortage reminder mail to HOD of '+b+'? (Director is copied)'))return;
  api('sendShortageReminder',{branchId:b,force:true}).then(function(res){
    if(res.s!==200){alert(res.j.error||'Could not send reminder');return;}
    if(res.j.skipped){alert('Skipped: '+(res.j.reason||'already handled'));return;}
    alert('Reminder sent to: '+((res.j.to&&res.j.to.join(', '))||'HOD'));
  });
}
function kpi(v,l,c){return '<div class="kpi '+c+'"><b>'+v+'</b><span>'+l+'</span></div>';}
function drrToday(b){return DRR.find(function(r){return r.active!==false&&r.reportDate===today()&&r.branchId===(b||RECRUIT_BRANCH);});}
function drrForDate(b,date){var d=date||today();return DRR.find(function(r){return r.active!==false&&r.reportDate===d&&r.branchId===(b||RECRUIT_BRANCH);});}
function sumDrr(fb){var list=filterBranch(DRR,fb||RECRUIT_DASH);return list.reduce(function(a,r){return {walkIns:a.walkIns+(r.walkIns||0),screened:a.screened+(r.screened||0),selected:a.selected+(r.selected||0),deployed:a.deployed+(r.deployed||0),wa:a.wa+(r.whatsappLeads||0),sj:a.sj+(r.securityjobLeads||0)};},{walkIns:0,screened:0,selected:0,deployed:0,wa:0,sj:0});}
function stageCount(st,fb){return filterBranch(GUARDS,fb).filter(function(g){return g.stage===st;}).length;}
function applyLogin(res){
  RECRUIT_ROLE=res.j.role||'admin';
  RECRUIT_BRANCH=res.j.branch||res.j.lockedBranch||'';
  if(res.j.recruitBranches&&res.j.recruitBranches.length) BRANCHES=res.j.recruitBranches.filter(function(b){return b&&b!=='Corporate Office'&&b!=='Gulbarga'&&b!=='Hyderabad'&&b!=='Recruitment Department';});
  el('userLine').textContent=(res.j.name||'')+' · '+(RECRUIT_BRANCH||'Management');
  if(RECRUIT_ROLE==='branch'&&PORTAL==='management'){
    el('login').style.display='none';el('shell').style.display='block';el('shell').classList.add('shell-ready');
    el('content').innerHTML='<div class="card"><h2 style="color:#fff">Management portal only</h2><p style="color:#94a3b8;margin:12px 0">Your sign-in is for <b>branch HOD / Staff</b>. Use the white <b>HODs / Staff</b> button on Command Centre.</p><a class="btn" href="/recruitment?portal=staff">Open Branch Portal</a></div>';
    return;
  }
  // Keep portal from the URL — do not auto-switch Management ↔ HOD.
  DRR=res.j.drr||[];if(res.j.drrDetails)DRR_DETAILS=res.j.drrDetails;GUARDS=res.j.guards||[];REQS=res.j.requisitions||[];JOINS=res.j.joinbacks||[];VENDORS=res.j.vendors||[];USERS=res.j.users||[];CFG=res.j.config||CFG;if(res.j.shortage)SHORTAGE=res.j.shortage;
  if(RECRUIT_ROLE==='branch'&&RECRUIT_BRANCH)RECRUIT_DASH=RECRUIT_BRANCH;
  el('login').style.display='none';el('shell').style.display='block';el('shell').classList.add('shell-ready');
  CUR=0;buildMenu();
  /** Paint Dashboard from login payload — do not wait for a second full /load. */
  try{paintMgmtDash();}catch(err){
    el('content').innerHTML='<div class="card"><h2 style="color:#fff">Could not open Dashboard</h2><p class="rpt-note">'+h(err&&err.message?err.message:String(err))+'</p><p class="rpt-note">Tap Refresh, or hard refresh and sign in again.</p></div>';
  }
}
function onOtpLogin(j){
  otpMsg('PIN accepted — opening…',true);
  var done=false;
  var timer=setTimeout(function(){
    if(done)return;
    otpMsg('Still opening… if this takes more than a minute, check internet and tap Verify again.',false);
  },12000);
  api('login').then(function(res){
    done=true;clearTimeout(timer);
    if(res.s!==200){otpMsg(res.j.error||'Sign in failed',false);return;}
    applyLogin(res);
  }).catch(function(err){
    done=true;clearTimeout(timer);
    otpMsg('Could not open Recruitment ('+(err&&err.message?err.message:'network')+'). Tap Verify again.',false);
  });
}
function logout(){otpLogout();}

function staffDash(){mgmtDash();}
function paintMgmtDash(){
  var todayPkgs=drrDetailFor('ALL',today());
  var c=drrDetailCounts(todayPkgs);
  var joinToday=(JOINS||[]).filter(function(j){return j.active!==false&&j.status==='rejoined'&&String(j.rejoinDate||'').slice(0,10)===today();}).length;
  var rejoins=(c.rejoins||0)+joinToday;
  var src=c.sources||{web:0,walkin:0,referral:0,recruiters:0,academy:0,others:0};
  var body=shortageBanner()+
    '<div class="kgrid">'+
      kpi(Number(SHORTAGE&&(SHORTAGE.openingShortage!=null?SHORTAGE.openingShortage:SHORTAGE.prevShortage)||0),'Opening (MIS 14 Aug)','amber')+
      kpi(shortageVac(),'Vacant (opening)','amber')+
      kpi(shortageOt(),'OT (opening)','sky')+
      kpi(shortageTotal(),'Remaining Shortages','red')+
      kpi(Number(SHORTAGE&&SHORTAGE.recruitsSinceBaseline||0),'Recruits since 14 Aug','green')+
      kpi(rejoins,'Rejoin','purple')+
      kpi(c.recruits||0,"Today's Recruitment",'green')+
      kpi(src.web||0,'Web Source','sky')+
      kpi(src.walkin||0,'Walk-in','green')+
      kpi(src.referral||0,'Referral','purple')+
      kpi(src.recruiters||0,'Recruiters','amber')+
      kpi(src.academy||0,'Academy','sky')+
      kpi(src.others||0,'Others','amber')+
      kpi(c.resignations||0,'Resignation','red')+
    '</div>'+
    '<p class="rpt-note"><b>Opening</b> = Consolidated MIS <b>14/08/2026</b> (Vacant + OT). <b>Remaining Shortages</b> = Opening − recruits registered on DRR since that day. Branches with shortage and <b>no recruitment</b> get an automatic HOD reminder (once a day). Use <b>Reminder Mail</b> on any row to send again.</p>'+
    reportSec('Branch DRR Submission — '+today())+
    '<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr>'+
      '<th>Branch</th><th>Opening</th><th>Vacant</th><th>OT</th><th>Remaining</th><th>DRR status</th><th>Recruited</th><th>Rejoin</th><th>Resigned</th><th>Improvement</th><th>Reminder</th>'+
    '</tr></thead><tbody>'+
    (function(){
      var centres=RECRUIT_ROLE==='branch'&&RECRUIT_BRANCH?[RECRUIT_BRANCH]:recruitCentres();
      var tot={open:0,vac:0,ot:0,short:0,rec:0,rej:0,res:0,sub:0};
      var rows=centres.map(function(b){
        var mis=branchMisRow(b);
        var list=drrDetailFor(b,today());
        var hasRows=list.some(drrDetailHasRows);
        var isNil=!hasRows&&list.some(drrDetailIsNil);
        var ok=hasRows||isNil;
        var n=drrDetailCounts(list);
        var jr=(JOINS||[]).filter(function(j){return j.active!==false&&j.branchId===b&&j.status==='rejoined'&&String(j.rejoinDate||'').slice(0,10)===today();}).length;
        var recN=hasRows?n.recruits:0;
        var rejN=hasRows?(n.rejoins||0)+jr:0;
        var resN=hasRows?n.resignations:0;
        var rec=recN+rejN;
        var open=mis.openingShortage!=null?mis.openingShortage:mis.prevShortage;
        tot.open+=Number(open||0);tot.vac+=Number(mis.vac||0);tot.ot+=Number(mis.ot||0);tot.short+=Number(mis.shortage||0);
        tot.rec+=recN;tot.rej+=rejN;tot.res+=resN;if(ok)tot.sub+=1;
        var remindBtn=mis.openingShortage>0?'<button type="button" class="btn sky" style="padding:4px 8px;font-size:11px" onclick="sendBranchShortageReminder(\\''+b+'\\')">Reminder Mail</button>':'—';
        var drrStatus=hasRows?'✓ Submitted':(isNil?'✓ Nil':'⚠ Pending');
        return '<tr>'+
          '<td><b>'+h(b)+'</b></td>'+
          '<td>'+open+'</td>'+
          '<td>'+mis.vac+'</td><td>'+mis.ot+'</td><td><b>'+mis.shortage+'</b></td>'+
          '<td style="color:'+(ok?'#4ade80':'#fb923c')+'">'+drrStatus+'</td>'+
          '<td>'+recN+'</td>'+
          '<td>'+rejN+'</td>'+
          '<td>'+resN+'</td>'+
          '<td>'+improveBar(open,mis.shortage,rec+(mis.recruitsSinceBaseline||0))+'</td>'+
          '<td>'+remindBtn+'</td>'+
        '</tr>';
      }).join('');
      var totalRow='<tr style="background:#1e293b;font-weight:800">'+
        '<td><b>TOTAL</b></td><td>'+tot.open+'</td><td>'+tot.vac+'</td><td>'+tot.ot+'</td><td><b>'+tot.short+'</b></td>'+
        '<td>'+tot.sub+' submitted</td><td>'+tot.rec+'</td><td>'+tot.rej+'</td><td>'+tot.res+'</td><td colspan="2">Banner = these totals</td></tr>';
      return rows+totalRow;
    })()+
    '</tbody></table></div>'+
    '<p class="rpt-note" style="margin-top:12px">Banner Opening / Remaining match the <b>TOTAL</b> row (recruitment centres). Gulbarga under Bangalore. Hyderabad A · B · Hi-Tech from Training / Recruitment DRR.'+(RECRUIT_ROLE==='branch'?'':' Past dates: <b>DRR History</b>.')+'</p>';
  el('content').innerHTML=reportWrap('Dashboard','All India · '+today()+' · Opening MIS 14/08/2026',portalBadge(),body,{share:true});
  /** Auto HOD reminder in background — never block login / Dashboard paint. */
  setTimeout(function(){api('autoShortageReminders',{}).then(function(){}).catch(function(){});},800);
}
function mgmtDash(){reloadThen(function(){paintMgmtDash();});}

function drrForm(){drrDetailForm();}
function saveDrr(){drrDetailForm();}

function drrLogs(){drrDetailHistory();}

function reqForm(){el('content').innerHTML=reportWrap('Request for Manpower',h(RECRUIT_BRANCH),portalBadge(),'<div class="card fgrid"><div><label>Site / Zone</label><input id="rq_site"></div><div><label>Guards Needed</label><input type="number" id="rq_need" value="1"></div><div><label>Urgency</label><select id="rq_urg"><option>normal</option><option>urgent</option><option>critical</option></select></div></div><div class="card"><label>Notes</label><textarea id="rq_notes" rows="3"></textarea></div><div class="savebar"><button class="btn green" onclick="saveReq()">Submit Requisition</button></div>');}
function saveReq(){var r={id:nid('rq'),branchId:RECRUIT_BRANCH,siteZone:el('rq_site').value,guardsNeeded:+el('rq_need').value,urgency:el('rq_urg').value,status:'pending',requestedBy:RECRUIT_BRANCH,notes:el('rq_notes').value,active:true,createdAt:new Date().toISOString()};api('saveRequisitions',{requisitions:REQS.concat([r])}).then(function(res){if(res.s===200){REQS.push(r);alert('Requisition submitted for management approval.');reqForm();}else alert(res.j.error);});}

function sourcing(){var s=sumDrr(RECRUIT_BRANCH);var rows=[['WhatsApp',s.wa],['SecurityJob.co.in',s.sj],['Referral',DRR.reduce(function(a,r){return a+(r.referralLeads||0);},0)],['Field Agent',DRR.reduce(function(a,r){return a+(r.fieldAgentLeads||0);},0)],['News Bulletin',DRR.reduce(function(a,r){return a+(r.newsBulletinLeads||0);},0)]].map(function(x){return '<tr><td><b>'+x[0]+'</b></td><td>'+x[1]+' leads</td><td>Track in DRR daily</td></tr>';}).join('');el('content').innerHTML=reportWrap('Sourcing Channels','WhatsApp · SecurityJob · Camps · Media',portalBadge(),'<p class="rpt-note">Log every lead source in your <b>Daily Recruitment Report</b>. Management sees consolidated sourcing performance.</p><div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Channel</th><th>Leads (period)</th><th>Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>');}

function pipeline(){var tabs=PIPE_STAGES.map(function(s){return '<div class="pipe-tab'+(PIPE_STAGE===s.id?' active':'')+'" onclick="PIPE_STAGE=\\''+s.id+'\\';pipeline()">'+s.label+' ('+stageCount(s.id,RECRUIT_BRANCH)+')</div>';}).join('');var list=filterBranch(GUARDS,RECRUIT_BRANCH).filter(function(g){return g.stage===PIPE_STAGE;});var rows=list.map(function(g){var gi=GUARDS.indexOf(g);return '<tr><td><b>'+h(g.name)+'</b></td><td>'+h(g.mobile)+'</td><td>'+h(g.source)+'</td><td>'+h(g.siteZone)+'</td><td><select onchange="GUARDS['+gi+'].stage=this.value;saveGuards()">'+PIPE_STAGES.map(function(s){return '<option value="'+s.id+'"'+(g.stage===s.id?' selected':'')+'>'+s.label+'</option>';}).join('')+'</select></td><td>'+h(g.policeVerification)+'</td><td>'+h(g.medicalStatus)+'</td></tr>';}).join('');var add='<div class="card fgrid" style="margin-top:10px"><input id="gn" placeholder="Name"><input id="gm" placeholder="Mobile"><select id="gs">'+SOURCES.map(function(s){return '<option>'+s+'</option>';}).join('')+'</select><input id="gz" placeholder="Site/Zone"><button class="btn" onclick="addGuard()">+ Add</button></div>';el('content').innerHTML=reportWrap('Guard Pipeline (CRM)','Track applicants through deployment',portalBadge(),'<div class="pipe-tabs">'+tabs+'</div><div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Name</th><th>Mobile</th><th>Source</th><th>Site</th><th>Stage</th><th>Police</th><th>Medical</th></tr></thead><tbody>'+(rows||'<tr><td colspan="7">No guards in this stage.</td></tr>')+'</tbody></table></div>'+add);}

function addGuard(){var g={id:nid('gd'),branchId:RECRUIT_BRANCH,name:el('gn').value,mobile:el('gm').value,source:el('gs').value,siteZone:el('gz').value,stage:PIPE_STAGE,policeVerification:'Pending',medicalStatus:'Pending',fitnessStatus:'Pending',active:true,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};if(!g.name)return;GUARDS.push(g);saveGuards();}
function saveGuards(){api('saveGuards',{guards:GUARDS}).then(function(res){if(res.s===200)pipeline();else alert(res.j.error);});}

function joinbacks(){var list=filterBranch(JOINS,RECRUIT_BRANCH);var rows=list.map(function(j,i){return '<tr><td>'+h(j.guardName)+'</td><td>'+h(j.mobile)+'</td><td>'+h(j.siteZone)+'</td><td>'+h(j.leftDate)+'</td><td>'+h(j.rejoinDate)+'</td><td>'+h(j.status)+'</td><td>'+h(j.reason)+'</td></tr>';}).join('');var add='<div class="card fgrid"><input id="jn" placeholder="Guard name"><input id="jm" placeholder="Mobile"><input id="jz" placeholder="Site"><input type="date" id="jl" placeholder="Left"><select id="js"><option>absent</option><option>rejoined</option><option>left_permanent</option></select><button class="btn" onclick="addJoin()">+ Log</button></div>';el('content').innerHTML=reportWrap('Roster & Join-Backs','Absentees and rejoins — keeps shortage accurate',portalBadge(),'<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Name</th><th>Mobile</th><th>Site</th><th>Left</th><th>Rejoined</th><th>Status</th><th>Reason</th></tr></thead><tbody>'+(rows||'<tr><td colspan="7">No records.</td></tr>')+'</tbody></table></div>'+add);}
function addJoin(){var j={id:nid('jb'),branchId:RECRUIT_BRANCH,guardName:el('jn').value,mobile:el('jm').value,siteZone:el('jz').value,leftDate:el('jl').value,status:el('js').value,active:true,createdAt:new Date().toISOString()};if(!j.guardName)return;JOINS.push(j);api('saveJoinbacks',{joinbacks:JOINS}).then(function(){joinbacks();});}

function publicity(){var wa='Agile Security Force — Register Your Interest%0A'+PUBLIC_FORM+'%0AHelpline: '+HELPLINE;var body='<div class="card"><b style="color:#fff">Public Apply Link</b><p style="margin:8px 0"><a class="btn sky" href="'+PUBLIC_FORM+'" target="_blank">'+PUBLIC_FORM+'</a></p></div><div class="card"><b style="color:#fff">SecurityJob.co.in</b><p style="margin:8px 0"><a class="btn" href="'+SECURITYJOB+'" target="_blank">'+SECURITYJOB+'</a></p></div><div class="card"><b style="color:#fff">WhatsApp Share</b><p style="margin:8px 0"><a class="btn green" href="https://wa.me/?text='+wa+'" target="_blank">Share on WhatsApp</a></p></div><div class="card"><b style="color:#fff">Recruitment Camps</b><p class="rpt-note">Plan camps in potential areas. Log <b>Camps Held</b> and walk-in numbers in your DRR. Coordinate with News Bulletin / Pulse for publicity.</p></div>';el('content').innerHTML=reportWrap('Publicity & Camps','Media · WhatsApp · SecurityJob · Field camps',portalBadge(),body);}

function drrSummary(){reloadThen(function(){var rows=recruitCentres().map(function(b){var list=drrDetailFor(b,today());var hasRows=list.some(drrDetailHasRows);var isNil=!hasRows&&list.some(drrDetailIsNil);var ok=hasRows||isNil;var n=drrDetailCounts(list);var mis=branchMisRow(b);return '<tr><td>'+h(b)+'</td><td>'+mis.vac+'</td><td>'+mis.ot+'</td><td><b>'+mis.shortage+'</b></td><td>'+(hasRows?'✓':(isNil?'Nil':'⚠'))+'</td><td>'+(hasRows?n.recruits:(isNil?'0':'—'))+'</td><td>'+(hasRows?(n.rejoins||0):(isNil?'0':'—'))+'</td><td>'+(hasRows?n.resignations:(isNil?'0':'—'))+'</td></tr>';}).join('');el('content').innerHTML=reportWrap('Daily Recruitment Summary','All recruitment centres · India date '+today(),portalBadge(),shortageBanner()+'<p class="rpt-note">Opening = Consolidated MIS 14/08/2026. Remaining Shortages = Opening − recruits since that day. DRR columns are today’s detailed report. Nil = no recruitment today.</p><div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Branch</th><th>Vacant</th><th>OT</th><th>Remaining Shortages</th><th>DRR</th><th>Recruited</th><th>Rejoin</th><th>Resignations</th></tr></thead><tbody>'+rows+'</tbody></table></div>');});}

function absconders(){
  var branchPick=RECRUIT_ROLE==='branch'?'':'All Branches';
  funnelFollowUp('absconder');
}
function trainingEoiFollowUp(){ funnelFollowUp('eoi'); }
function abPhone(m){return String(m||'').replace(/\D/g,'').slice(-10);}
function abRowPayload(g){
  return {key:g.key||'',employeeId:g.employeeId||'',guardName:g.guardName||'',mobile:g.mobile||'',unit:g.unit||'',client:g.client||'',absentSince:g.absentSince||'',consecutiveDays:g.consecutiveDays||7,branch:g.branch||''};
}
function renderAbsconderGroups(groups){
  var tblEl=el('ab_tbl');
  if(!tblEl)return;
  __AB_PAYLOADS=[];
  var blocks=(groups||[]).map(function(gr){
    var html=gr.rows.map(function(g,i){
      var ph=abPhone(g.mobile);
      var call=ph?'<a class="btn sky ab-act" style="padding:4px 8px;font-size:11px" href="tel:+91'+ph+'">Call</a>':'—';
      var wa=ph?'<a class="btn green ab-act" style="padding:4px 8px;font-size:11px" href="https://wa.me/91'+ph+'" target="_blank" rel="noopener">WhatsApp</a>':'—';
      var joined=g.followStatus==='joined';
      var ix=__AB_PAYLOADS.length;
      __AB_PAYLOADS.push(abRowPayload(g));
      return '<tr>'+
        '<td>'+(i+1)+'</td>'+
        '<td><b>'+h(g.guardName||'—')+'</b></td>'+
        '<td>'+h(g.employeeId||'—')+'</td>'+
        '<td>'+h(g.mobile||'—')+'</td>'+
        '<td><b>'+g.consecutiveDays+'</b></td>'+
        '<td>'+h(g.absentSince||'—')+'</td>'+
        '<td class="ab-act">'+call+'</td>'+
        '<td class="ab-act">'+wa+'</td>'+
        '<td class="ab-act"><button type="button" class="btn amb" style="padding:4px 8px;font-size:11px" onclick="absconderRemind('+ix+')">Reminder</button> <button type="button" class="btn" style="padding:4px 8px;font-size:11px;background:#7f1d1d;border-color:#ef4444" onclick="absconderTerminate('+ix+')">Termination</button></td>'+
        '<td class="ab-act"><button type="button" class="btn '+(joined?'green':'grey')+'" style="padding:4px 8px;font-size:11px" onclick="absconderMark('+ix+',\\'joined\\')">Joined</button></td>'+
        '<td class="ab-act"><button type="button" class="btn '+(!joined?'sky':'grey')+'" style="padding:4px 8px;font-size:11px" onclick="absconderMark('+ix+',\\'pending\\')">Pending</button></td>'+
        '</tr>';
    }).join('');
    return reportSec(gr.branch+' ('+gr.rows.length+')')+
      '<div class="tblwrap wr-tbl-wrap" style="margin-bottom:12px"><table class="wr-tbl"><thead><tr>'+
      '<th>Sl.No.</th><th>Guards Name</th><th>Id No.</th><th>Mobile Number</th><th>Days</th><th>Absent since</th>'+
      '<th class="ab-act">Call</th><th class="ab-act">WhatsApp</th><th class="ab-act">Reminder</th><th class="ab-act">Joined</th><th class="ab-act">Pending</th>'+
      '</tr></thead><tbody>'+(html||'<tr><td colspan="11">No records.</td></tr>')+'</tbody></table></div>';
  }).join('');
  tblEl.innerHTML=blocks||'<div class="card"><p class="rpt-note">No 7+ day absconders found.</p></div>';
}
function loadAbsconders(sync){
  var asOfEl=el('ab_date'),msgEl=el('ab_msg'),btnEl=el('ab_sync_btn');
  if(!asOfEl||!msgEl){alert('Page not ready — open Absconder List from the left menu again.');return;}
  var asOf=asOfEl.value;
  var bf=RECRUIT_ROLE==='branch'?RECRUIT_BRANCH:((el('ab_branch')&&el('ab_branch').value)||'ALL');
  msgEl.textContent=sync?'Pulling all-client attendance (about one minute)…':'Loading saved list…';
  if(btnEl&&sync){btnEl.disabled=true;btnEl.textContent='Syncing…';}
  api('absconders',{asOf:asOf,minDays:7,syncFirst:!!sync,branchFilter:bf}).then(function(res){
    if(btnEl){btnEl.disabled=false;btnEl.textContent='Sync & Refresh';}
    if(res.s!==200){msgEl.textContent=res.j.error||'Request failed — sign in again from Command Centre.';return;}
    var gs=res.j.guards||[];
    var groups=res.j.groups||[];
    if(!groups.length&&gs.length){
      var by={};
      gs.forEach(function(g){
        var b=String(g.branch||g.branchHint||'Unassigned').trim()||'Unassigned';
        if(!by[b])by[b]=[];
        by[b].push(g);
      });
      groups=Object.keys(by).map(function(b){return {branch:b,rows:by[b]};});
    }
    var note=gs.length?(gs.length+' absconder(s) as of '+asOf+', branch-wise, highest first.'):(res.j.hint||'No 7+ day absconders found.');
    if(res.j.sync&&res.j.sync.saved)note+=' Mobile rows synced: '+res.j.sync.saved+'.';
    else if(res.j.sync&&res.j.sync.error){
      note+=' Sync note: '+res.j.sync.error;
    }
    else if(!res.j.work360Configured)note+=' Work360 not on server yet — showing join-back log only.';
    msgEl.textContent=note;
    renderAbsconderGroups(groups);
  }).catch(function(err){
    if(btnEl){btnEl.disabled=false;btnEl.textContent='Sync & Refresh';}
    msgEl.textContent='Could not reach server. Check internet and try again. ('+(err&&err.message?err.message:'error')+')';
  });
}
function shareAbsconderList(){
  var to=prompt('Share this absconder list to email:','');
  if(!to)return;
  to=String(to).trim();
  if(!to.includes('@')){alert('Please enter a valid email address.');return;}
  var asOf=(el('ff_asof')&&el('ff_asof').value)||(el('ab_date')&&el('ab_date').value)||today();
  var bf=RECRUIT_ROLE==='branch'?RECRUIT_BRANCH:((el('ff_branch')&&el('ff_branch').value)||(el('ab_branch')&&el('ab_branch').value)||'ALL');
  api('shareAbsconders',{to:to,asOf:asOf,branchFilter:bf}).then(function(res){
    if(res.s===200&&res.j&&res.j.ok)alert('List sent to '+to);
    else alert((res.j&&res.j.error)||'Could not send.');
  }).catch(function(){alert('Could not send. Check internet and try again.');});
}
function downloadAbsconderPdf(){window.print();}
function absconderRemind(g){
  if(typeof g==='number')g=__AB_PAYLOADS[g]||{};
  api('updateAbsconderFollow',Object.assign({remind:true},g)).then(function(res){
    if(res.s!==200){alert(res.j.error||'Could not send reminder');return;}
    if(res.j.waUrl)window.open(res.j.waUrl,'_blank');
    else alert(res.j.reminderText||'Reminder ready — add a mobile number.');
  });
}
function absconderTerminate(g){
  if(typeof g==='number')g=__AB_PAYLOADS[g]||{};
  var who=g.guardName||'this guard';
  if(!confirm('Send termination notice to '+who+' on WhatsApp? They ran away with company ID and Uniform.'))return;
  if(!confirm('Final confirm: send termination now to '+who+'?'))return;
  api('sendAbsconderTermination',g).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Termination notice did not go.');return;}
    if(res.j.html){
      var w=window.open('','_blank');
      if(w){w.document.open();w.document.write(res.j.html);w.document.close();}
    }
    alert('Termination notice sent to '+who+'.');
  }).catch(function(){alert('Could not send. Check internet and try again.');});
}
function absconderMark(g,status){
  if(typeof g==='number')g=__AB_PAYLOADS[g]||{};
  api('updateAbsconderFollow',Object.assign({status:status},g)).then(function(res){
    if(res.s!==200){alert(res.j.error||'Save failed');return;}
    if(typeof loadFunnelFollowUp==='function')loadFunnelFollowUp(false);
    else loadAbsconders(false);
  });
}

function drrEmailPreview(){var b=RECRUIT_BRANCH||recruitCentres()[0]||'Bangalore';var dt=today();var pick='<div class="card fgrid"><div><label>Branch</label><select id="em_branch" onchange="drrEmailPreview()">'+recruitCentres().map(function(x){return '<option'+(x===b?' selected':'')+'>'+x+'</option>';}).join('')+'</select></div><div><label>Report Date</label><input type="date" id="em_date" value="'+dt+'" onchange="drrEmailPreview()"></div><button class="btn sky" onclick="loadDrrEmail()">Preview Thank You Email</button></div><div id="em_out"><p class="rpt-note">Select branch and date, then preview the thank you email sent after DRR submission.</p></div>';el('content').innerHTML=reportWrap('DRR Thank You Email','Branch dashboard email preview',portalBadge(),pick);}
function loadDrrEmail(){var b=(el('em_branch')&&el('em_branch').value)||'';var d=(el('em_date')&&el('em_date').value)||today();el('em_out').innerHTML='<p class="rpt-note">Loading…</p>';api('previewDrrEmail',{branchId:b,reportDate:d}).then(function(res){if(res.s!==200){el('em_out').innerHTML='<p class="rpt-note">'+(res.j.error||'Failed')+'</p>';return;}el('em_out').innerHTML='<div class="card" style="background:#fff;color:#0f172a;padding:0;overflow:auto">'+res.j.html+'</div>';});}

function shortageReminderPreview(){
  var b=RECRUIT_BRANCH||recruitCentres()[0]||'Bangalore';
  var pick='<div class="card fgrid"><div><label>Branch (sample)</label><select id="sr_branch">'+recruitCentres().map(function(x){return '<option'+(x===b?' selected':'')+'>'+x+'</option>';}).join('')+'</select></div>'+
    '<button type="button" class="btn sky" onclick="loadShortageReminderPreview()">Show format preview</button></div>'+
    '<p class="rpt-note"><b>To:</b> Branch HOD · <b>CC:</b> Director. Opening = Consolidated MIS <b>14/08/2026</b> (Vacant+OT). Remaining = Opening − recruits since then. Auto-mail goes to HODs with shortage and no recruitment.</p>'+
    '<div id="sr_out"><p class="rpt-note">Tap <b>Show format preview</b>.</p></div>';
  el('content').innerHTML=reportWrap('Shortage Reminder Preview','HOD mail · CC Director · header & footer',portalBadge(),pick);
}
function loadShortageReminderPreview(){
  var b=(el('sr_branch')&&el('sr_branch').value)||recruitCentres()[0];
  el('sr_out').innerHTML='<p class="rpt-note">Loading preview…</p>';
  api('previewShortageReminder',{branchId:b}).then(function(res){
    if(res.s!==200){el('sr_out').innerHTML='<p class="rpt-note">'+(res.j.error||'Failed')+'</p>';return;}
    el('sr_out').innerHTML='<div class="card"><p class="rpt-note"><b>Subject:</b> '+h(res.j.subject||'')+'</p></div><div class="card" style="background:#fff;color:#0f172a;padding:0;overflow:auto">'+res.j.html+'</div>';
  });
}

function gapAnalysis(){var vac=shortageVac(),ot=shortageOt(),gap=shortageTotal(),open=Number(SHORTAGE&&(SHORTAGE.openingShortage!=null?SHORTAGE.openingShortage:SHORTAGE.prevShortage)||0),con=SHORTAGE&&SHORTAGE.source==='mis'?Number(SHORTAGE.san||0):(CFG.contractedStrength||0),dep=SHORTAGE&&SHORTAGE.source==='mis'?Number(SHORTAGE.dep||0):(CFG.actualDeployed||0),rec=Number(SHORTAGE&&SHORTAGE.recruitsSinceBaseline||0);el('content').innerHTML=reportWrap('Manpower Gap Analysis','Opening from Consolidated MIS 14 Aug',portalBadge(),shortageBanner()+'<div class="kgrid">'+kpi(open,'Opening (MIS 14 Aug)','amber')+kpi(con||'—','Sanctioned (MIS)','sky')+kpi(dep||'—','Deployed (MIS)','green')+kpi(vac,'Vacant (opening)','amber')+kpi(ot,'OT (opening)','sky')+kpi(gap,'Remaining Shortages','red')+kpi(rec,'Recruits since 14 Aug','green')+'</div><p class="rpt-note"><b>Opening</b> = Consolidated MIS 14/08/2026 (Vacant + OT). <b>Remaining</b> = Opening − recruits registered on DRR since that day.</p>');}

function funnelView(){var steps=PIPE_STAGES.map(function(s){return '<div class="funnel-step"><b>'+stageCount(s.id,'ALL')+'</b><span>'+s.label+'</span></div>';}).join('');var ch={};DRR.forEach(function(r){ch.wa=(ch.wa||0)+(r.whatsappLeads||0);ch.sj=(ch.sj||0)+(r.securityjobLeads||0);ch.ref=(ch.ref||0)+(r.referralLeads||0);ch.fa=(ch.fa||0)+(r.fieldAgentLeads||0);ch.nb=(ch.nb||0)+(r.newsBulletinLeads||0);ch.wi=(ch.wi||0)+(r.walkIns||0);});var dep=GUARDS.filter(function(g){return g.stage==='deployed';}).length;var chRows=[['Walk-in (Branches)',ch.wi],['WhatsApp',ch.wa],['SecurityJob.co.in',ch.sj],['Referral',ch.ref],['Field Agent',ch.fa],['News Bulletin',ch.nb]].map(function(x){var roi=dep&&x[1]?Math.round(dep/x[1]*100)+'%':'—';return '<tr><td><b>'+x[0]+'</b></td><td>'+x[1]+'</td><td>'+roi+'</td></tr>';}).join('');el('content').innerHTML=reportWrap('Sourcing Funnel','Pipeline stages + channel leads — all branches',portalBadge(),shortageBanner()+reportSec('Guard Pipeline Stages')+'<div class="funnel">'+steps+'</div>'+reportSec('Sourcing Channels (HQ + Branches)')+'<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Channel</th><th>Total Leads</th><th>Deploy ROI</th></tr></thead><tbody>'+chRows+'</tbody></table></div>');}

function retention(){var abs=JOINS.filter(function(j){return j.status==='absent';}).length,rej=JOINS.filter(function(j){return j.status==='rejoined';}).length;el('content').innerHTML=reportWrap('Operations & Retention','Join-backs and attrition',portalBadge(),'<div class="kgrid">'+kpi(abs,'Currently Absent','red')+kpi(rej,'Rejoined','green')+kpi(JOINS.length,'Total Join-Back Records','purple')+'</div><p class="rpt-note">Track why guards leave in Join-Back log. High attrition sites flagged in Risk &amp; Wage Controls.</p>');}

function bottlenecks(){var items=DRR.filter(function(r){return r.bottlenecks;}).map(function(r){return '<div class="alert amber"><b>'+h(r.branchId)+' · '+h(r.reportDate)+'</b><br>'+h(r.bottlenecks)+'</div>';}).join('');el('content').innerHTML=reportWrap('Notes & Bottlenecks','From all DRR submissions',portalBadge(),items||'<p class="rpt-note">No bottlenecks logged yet.</p>');}

function wageRisk(){var sites=CFG.wageHoldSites||[];var rows=sites.map(function(w,i){return '<tr><td>'+h(w.branchId)+'</td><td>'+h(w.siteZone)+'</td><td>'+h(w.riskLevel)+'</td><td>'+h(w.attritionPct)+'</td><td>'+h(w.notes)+'</td></tr>';}).join('');el('content').innerHTML=reportWrap('Risk & Wage Controls','Hold/Release wage monitor',portalBadge(),'<p class="rpt-note">Flag sites with high attrition where wage release needs careful approval.</p><div class="tblwrap"><table><thead><tr><th>Branch</th><th>Site</th><th>Risk</th><th>Attrition %</th><th>Notes</th></tr></thead><tbody>'+(rows||'<tr><td colspan="5">No sites flagged — add in Configuration.</td></tr>')+'</tbody></table></div>');}

function approvals(){var pend=REQS.filter(function(r){return r.status==='pending';});var rows=pend.map(function(r){return '<tr><td>'+h(r.branchId)+'</td><td>'+h(r.siteZone)+'</td><td>'+r.guardsNeeded+'</td><td>'+h(r.urgency)+'</td><td>'+h(r.requestedBy)+'</td><td><button class="btn green" onclick="approveReq(\\''+r.id+'\\',\\'approved\\')">Approve</button> <button class="btn r" onclick="approveReq(\\''+r.id+'\\',\\'rejected\\')">Reject</button></td></tr>';}).join('');el('content').innerHTML=reportWrap('Manpower Approvals','Pending requisitions from branches',portalBadge(),'<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Branch</th><th>Site</th><th>Needed</th><th>Urgency</th><th>Requested</th><th></th></tr></thead><tbody>'+(rows||'<tr><td colspan="6">No pending approvals.</td></tr>')+'</tbody></table></div>');}
function approveReq(id,st){api('approveRequisition',{id:id,status:st}).then(function(res){if(res.s===200){REQS=REQS.map(function(r){return r.id===id?Object.assign({},r,{status:st}):r;});approvals();}});}

function vendors(){var rows=VENDORS.map(function(v,i){return '<tr><td>'+h(v.name)+'</td><td>'+h(v.contactPerson)+'</td><td>'+h(v.mobile)+'</td><td>'+h(v.branchesServed)+'</td><td>'+h(v.contractValidTill)+'</td><td>'+v.guardsSupplied+'</td></tr>';}).join('');var add='<div class="card fgrid"><input id="vn" placeholder="Agency name"><input id="vc" placeholder="Contact"><input id="vm" placeholder="Mobile"><button class="btn" onclick="addVendor()">+ Add Vendor</button></div>';el('content').innerHTML=reportWrap('Vendor / Agency Management','Third-party recruitment partners',portalBadge(),'<div class="tblwrap"><table><thead><tr><th>Agency</th><th>Contact</th><th>Mobile</th><th>Branches</th><th>Contract Till</th><th>Supplied</th></tr></thead><tbody>'+(rows||'<tr><td colspan="6">No vendors.</td></tr>')+'</tbody></table></div>'+add+'<div class="savebar"><button class="btn green" onclick="api(\\'saveVendors\\',{vendors:VENDORS}).then(function(){alert(\\'Saved\\');})">Save Vendors</button></div>');}
function addVendor(){VENDORS.push({id:nid('vn'),name:el('vn').value,contactPerson:el('vc').value,mobile:el('vm').value,branchesServed:'',contractValidTill:'',guardsSupplied:0,active:true,remarks:'',createdAt:new Date().toISOString()});vendors();}

function settings(){el('content').innerHTML=reportWrap('Configuration','Targets and shortage fallback',portalBadge(),'<div class="card fgrid"><div><label>Shortage Count (fallback only)</label><input type="number" id="cf_short" value="'+(CFG.shortageCount||0)+'"></div><div><label>Daily Target / Branch</label><input type="number" id="cf_daily" value="'+(CFG.dailyTargetPerBranch||5)+'"></div><div><label>Monthly Target</label><input type="number" id="cf_month" value="'+(CFG.monthlyTarget||100)+'"></div><div><label>Contracted Strength</label><input type="number" id="cf_con" value="'+(CFG.contractedStrength||0)+'"></div><div><label>Actually Deployed</label><input type="number" id="cf_dep" value="'+(CFG.actualDeployed||0)+'"></div></div><p class="rpt-note">Dashboard uses <b>Opening from Consolidated MIS 14/08/2026</b>. Remaining Shortages = Opening − recruits on DRR. The shortage count above is only a fallback when MIS baseline is empty.</p><div class="savebar"><button class="btn green" onclick="saveCfg()">Save Configuration</button></div>');}
function saveCfg(){var c={shortageCount:+el('cf_short').value,dailyTargetPerBranch:+el('cf_daily').value,monthlyTarget:+el('cf_month').value,contractedStrength:+el('cf_con').value,actualDeployed:+el('cf_dep').value,wageHoldSites:CFG.wageHoldSites||[]};api('saveConfig',{config:c}).then(function(res){if(res.s===200){CFG=res.j.config||c;alert('Saved.');settings();}});}

function userTemplate(){return {id:nid('us'),name:'',email:'',mobile:'',role:'branch',userType:'hod',branchId:'Hyderabad',active:true,deactivateReason:'',remarks:'',createdAt:new Date().toISOString()};}
function userTypeLabel(t){return {director:'Director',admin:'Admin',hod:'HOD',staff:'Staff',recruiter:'Recruiter'}[t]||t;}
function setUserType(i,t){USERS[i].userType=t;if(t==='director'||t==='admin'){USERS[i].role='admin';USERS[i].branchId='';}else{USERS[i].role='branch';}users();}
function toggleUser(i,on){USERS[i].active=on;if(!on&&!USERS[i].deactivateReason)USERS[i].deactivateReason='Deactivated';users();}
function delUser(i){if(!confirm('Remove '+((USERS[i]&&USERS[i].name)||'this user')+' from the list?'))return;USERS.splice(i,1);USR=-1;users();}
function users(){
  if(RECRUIT_ROLE!=='admin'){el('content').innerHTML=reportWrap('User Management','Management only',portalBadge(),'<p class="rpt-note">Only Director / Admin can manage users.</p>');return;}
  var rows=USERS.map(function(u,i){
    var ut=u.userType||(u.role==='admin'?'admin':'hod');
    var roleBadge='<span class="badge-role badge-'+(u.role==='admin'?'admin':'branch')+'">'+h(userTypeLabel(ut))+'</span>';
    var sw='<label class="switch" title="'+(u.active?'Active':'Inactive')+'"><input type="checkbox" '+(u.active?'checked':'')+' onchange="toggleUser('+i+',this.checked)"><span class="slider"></span></label><span class="switch-lbl">'+(u.active?'Active':'Off')+'</span>';
    return '<tr class="'+(u.active?'':'inactive')+'"><td><b>'+h(u.name||'—')+'</b></td><td>'+h(u.email||'—')+'</td><td>'+h(u.mobile||'—')+'</td><td>'+roleBadge+'</td><td>'+(u.role==='branch'?h(u.branchId):'Management')+'</td><td style="white-space:nowrap">'+sw+'</td><td><button class="btn grey" style="padding:4px 10px" onclick="USR='+i+';users()">Edit</button> <button class="btn r" style="padding:4px 10px" onclick="delUser('+i+')">Remove</button></td></tr>';
  }).join('');
  var ed='';
  if(USR>=0&&USERS[USR]){
    var u=USERS[USR],i=USR,ut=u.userType||(u.role==='admin'?'admin':'hod');
    ed='<div class="vedit"><h4>Edit User — '+h(u.name||'New')+'</h4><div class="fgrid">'+
      '<div><label>Full Name *</label><input value="'+a(u.name)+'" oninput="USERS['+i+'].name=this.value"></div>'+
      '<div><label>Work email</label><input value="'+a(u.email)+'" oninput="USERS['+i+'].email=this.value" placeholder="name@agilegroup.co.in"></div>'+
      '<div><label>Mobile</label><input value="'+a(u.mobile)+'" oninput="USERS['+i+'].mobile=this.value"></div>'+
      '<div><label>Role *</label><select onchange="setUserType('+i+',this.value)"><option value="director"'+(ut==='director'?' selected':'')+'>Director</option><option value="admin"'+(ut==='admin'?' selected':'')+'>Admin</option><option value="hod"'+(ut==='hod'?' selected':'')+'>HOD (Branch)</option><option value="recruiter"'+(ut==='recruiter'?' selected':'')+'>Recruiter (Branch)</option><option value="staff"'+(ut==='staff'?' selected':'')+'>Staff (Branch)</option></select></div>'+
      (u.role==='branch'?'<div><label>Branch *</label><select onchange="USERS['+i+'].branchId=this.value">'+BRANCHES.map(function(b){return '<option'+(b===u.branchId?' selected':'')+'>'+h(b)+'</option>';}).join('')+'</select></div>':'')+
      '</div><div style="margin-top:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">'+
      '<label class="switch"><input type="checkbox" '+(u.active?'checked':'')+' onchange="USERS['+i+'].active=this.checked;toggleUser('+i+',this.checked)"><span class="slider"></span></label>'+
      '<span style="color:#94a3b8;font-size:13px">'+(u.active?'User is <b style="color:#4ade80">Active</b>':'User is <b style="color:#fb923c">Inactive</b> — login blocked')+'</span>'+
      (u.active?'':'<input placeholder="Deactivate reason" value="'+a(u.deactivateReason)+'" oninput="USERS['+i+'].deactivateReason=this.value" style="flex:1;min-width:180px">')+
      '</div><div style="margin-top:8px"><label>Remarks</label><textarea rows="2" oninput="USERS['+i+'].remarks=this.value">'+h(u.remarks)+'</textarea></div>'+
      '<div style="margin-top:10px"><button class="btn grey" onclick="USR=-1;users()">Close</button></div></div>';
  }
  el('content').innerHTML=reportWrap('User Management','Add · Edit · Activate / Deactivate · Remove',portalBadge(),
    '<div class="card"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px"><b style="color:#fff">Recruitment Users</b><button class="btn grey" onclick="USERS.push(userTemplate());USR=USERS.length-1;users()">+ Add User</button></div>'+
    '<p class="rpt-note">Same format as Fleet &amp; MIS User Management. Use the <b>green switch</b> to activate or deactivate. Support departments are managed in <b>Master Directory</b>.</p>'+
    '<div class="tblwrap"><table><thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Role</th><th>Branch</th><th>Active</th><th>Actions</th></tr></thead><tbody>'+(rows||'<tr><td colspan="7">No users — click Add User.</td></tr>')+'</tbody></table></div>'+ed+'</div>'+
    '<div class="savebar"><button class="btn green" onclick="saveUsr()">💾 Save Users</button></div>');
}
function saveUsr(){api('saveUsers',{users:USERS}).then(function(res){alert(res.s===200?'Saved ('+(res.j.count||USERS.length)+' users)':(res.j.error||'Error'));});}

(function(){
  var tok=otpRestoreSession();
  if(!tok)return;
  var stored='';
  try{stored=sessionStorage.getItem('otp_role_recruitment')||'';}catch(e){}
  if(stored&&stored!==PORTAL){
    try{sessionStorage.removeItem('otp_recruitment');sessionStorage.removeItem('otp_email_recruitment');sessionStorage.removeItem('otp_branch_recruitment');sessionStorage.removeItem('otp_branch_name_recruitment');sessionStorage.removeItem('otp_role_recruitment');}catch(e){}
    OTP_SESSION='';OTP_EMAIL='';OTP_BRANCH_ID='';
    return;
  }
  onOtpLogin({});
})();
</script></body></html>`

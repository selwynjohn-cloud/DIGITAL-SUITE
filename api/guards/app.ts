import type { VercelRequest, VercelResponse } from '@vercel/node'
import { loadBranchLoginOptionsHtml } from '../_lib/branch-login-options.js'
import { hodLoginHtml, otpLoginHtml, otpLoginScript } from '../_lib/embedded-otp.js'
import { MANAGEMENT_PAGE_HELP, PAGE_HELP } from '../_lib/guards/page-help.js'
import { DEFAULT_BRANCHES } from '../_lib/mis/store.js'
import { GUARD_CATEGORIES } from '../_lib/guards/store.js'
import {
  MASTER_DIRECTORY_HELP_LINK_HTML,
  SHOW_MASTER_DIRECTORY_LINK_JS,
} from '../_lib/master-directory.js'
import { suiteMgmtBranchOptionsJs } from '../_lib/suite-mgmt-branch-select.js'

const ALL_BRANCHES = DEFAULT_BRANCHES.map((b) => ({ id: b.id, name: b.name }))

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url ?? '/', 'https://www.agilegroup-digital.co.in')
  const isMgmt =
    url.searchParams.get('portal') === 'management' ||
    url.searchParams.get('suite_role') === 'management'
  const otpRole = isMgmt ? 'management' : 'staff'
  /** Must pass real role here — a placeholder made OTP_STAFF_PIN=false and hid the branch box. */
  const otpScript = otpLoginScript('guards', 'Agile Guards', otpRole)
  const loginHtml = isMgmt
    ? otpLoginHtml(
        'Agile Guards — Management',
        'Director / Admin — sign in with your @agilegroup.co.in email.',
      )
    : hodLoginHtml(
        'Agile Guards — HOD Portal',
        'Select your branch (Mumbai, Chennai, Kochi, …), then email PIN (morning) or branch password',
        await loadBranchLoginOptionsHtml('guards'),
      )
  const html = PAGE.replace('__GUARDS_LOGIN__', loginHtml).replace('__GUARDS_OTP_SCRIPT__', otpScript)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(html)
}

const HOD_MENU = [
  ['Branch Dashboard', 'Dept time · categories · 24h tips'],
  ['Register Phone Complaints', 'Register guard complaints by phone'],
  ['Received Complaints', 'Assign · clocks · search'],
  ['Delayed Complaints', 'Past 24 hours — priority'],
  ['Complaint Analysis', 'Root cause · scientific plan'],
  ['Delayed Complaint Analysis', 'Who delayed · improve response'],
  ['Communication to Complainant', 'All outbound messages'],
  ['Feedback', 'Send satisfaction form to complainants'],
  ['Operations Staff', 'Ops team for assignment'],
  ['Department Staff', 'Dept dropdown + email'],
]

const MGMT_MENU = [
  ['Branch Dashboard', 'All branches · KPIs · trends'],
  ['Register Phone Complaints', 'Phone complaints · all branches'],
  ['Received Complaints', 'All branches · assign · clocks'],
  ['Delayed Complaints', 'Past 24h · every branch'],
  ['Complaint Analysis', 'Company-wide root cause'],
  ['Delayed Complaint Analysis', 'Who delayed · all branches'],
  ['Communication to Complainant', 'All outbound messages'],
  ['Feedback Analysis', 'Guard satisfaction · averages'],
  ['Operations Staff', 'Ops team — every branch'],
  ['Department Staff', 'Dept staff — every branch'],
]

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Guards — HOD / Management Portal</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Segoe UI',Arial,sans-serif;background:linear-gradient(160deg,#0b1220,#14224f 50%,#1e3a6e);color:#e2e8f0;font-size:15px}
#login{max-width:420px;margin:0 auto;padding-top:10vh}
.card{background:linear-gradient(180deg,#111a30,#0e1730);border:1px solid #334155;border-radius:14px;padding:24px}
input,select,textarea{width:100%;padding:10px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:15px}
label{display:block;font-size:13px;color:#94a3b8;margin:8px 0 4px;font-weight:600}
.btn{padding:12px 18px;border:none;border-radius:9px;font-weight:700;cursor:pointer;font-size:15px;background:linear-gradient(135deg,#1d4ed8,#1e3a8a);color:#fff;margin-right:6px;margin-top:6px}
.btn:disabled{opacity:.55;cursor:not-allowed}
.gold{background:linear-gradient(135deg,#d97706,#b45309);color:#fff}
.btn-danger{background:transparent;border:1px solid #ef4444;color:#f87171}
.btn-danger:hover{background:rgba(127,29,29,.35);color:#fecaca}
.btn-ol{background:transparent;border:1px solid #334155;color:#94a3b8}.btn-sm{padding:8px 14px;font-size:13px}
.msg{padding:10px;border-radius:8px;font-size:14px;margin-top:10px;display:none}
.hidden{display:none!important}
#shell{display:none;height:100vh}
.side{position:fixed;top:0;left:0;bottom:0;width:280px;background:linear-gradient(180deg,#0c1528,#0a1020);border-right:1px solid #1e3050;overflow-y:auto;display:flex;flex-direction:column}
.brand{padding:16px;text-align:center;border-bottom:1px solid #1e3050}.brand img{height:44px}.brand b{display:block;color:#93c5fd;font-size:15px;margin-top:6px}.brand small{color:#94a3b8;font-size:11px}
.menu{padding:8px;flex:1}.mi{padding:12px 14px;border-radius:10px;color:#94a3b8;cursor:pointer;margin-bottom:4px;border:none;background:transparent;width:100%;text-align:left}
.mi b{display:block;font-size:15px;color:#e2e8f0}.mi small{display:block;font-size:11px;margin-top:3px;line-height:1.35}
.mi.on{background:linear-gradient(135deg,rgba(29,78,216,.35),rgba(30,58,138,.2));border:1px solid rgba(147,197,253,.4)}.mi.on b{color:#fff}
.logout{padding:14px;border-top:1px solid #1e3050;color:#94a3b8;cursor:pointer;font-size:13px;text-align:center}
.help-links{padding:10px 14px;border-top:1px solid #1e3050;font-size:12px}
.help-links a{display:block;color:#c9a84c;text-decoration:none;padding:7px 0;font-weight:700}
.help-links a:hover{color:#fde68a}
.main{margin-left:280px;min-height:100vh}
.bar{background:#111a30;border-bottom:1px solid #1e3050;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.bar h1{font-size:20px;color:#93c5fd}.content{padding:18px;max-width:1100px}
.kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:16px}
.kpi{border-radius:12px;padding:14px;border:1px solid #1e3050;background:#111a30}.kpi b{font-size:26px;color:#93c5fd;display:block}.kpi span{font-size:12px;color:#94a3b8}
.panel{background:#111a30;border:1px solid #1e3050;border-radius:12px;padding:16px;margin-bottom:12px}
.panel h3{color:#93c5fd;margin-bottom:10px;font-size:17px}
.tblwrap{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:13px;min-width:760px}
th,td{border-bottom:1px solid #1e3050;padding:10px 8px;text-align:left;vertical-align:top}th{color:#94a3b8;font-size:11px;text-transform:uppercase}
tr.click{cursor:pointer}tr.click:hover td{background:rgba(29,78,216,.1)}
.badge{display:inline-block;padding:3px 8px;border-radius:8px;font-size:11px;font-weight:700}
.badge.ok{background:rgba(34,197,94,.2);color:#4ade80}.badge.wn{background:rgba(245,158,11,.2);color:#fbbf24}.badge.er{background:rgba(239,68,68,.2);color:#f87171}.badge.inf{background:rgba(59,130,246,.2);color:#93c5fd}
.sla-bar{height:8px;background:#1e3050;border-radius:99px;overflow:hidden;margin-top:4px}.sla-fill{height:100%;background:linear-gradient(90deg,#22c55e,#f59e0b,#ef4444)}
.clock{font-size:11px;color:#94a3b8;line-height:1.4}
.alert{padding:10px 12px;border-radius:8px;margin-bottom:8px;font-size:13px;border-left:4px solid}
.alert.red{background:rgba(127,29,29,.4);border-color:#ef4444}.alert.amber{background:rgba(120,53,15,.4);border-color:#f59e0b}.alert.green{background:rgba(20,83,45,.4);border-color:#4ade80}
.suggest li{margin:6px 0 6px 18px;line-height:1.45;color:#e2e8f0}
.timeline{border-left:3px solid #1e3050;margin:12px 0 0 8px;padding-left:16px}
.tl{margin-bottom:14px}.tl b{color:#93c5fd;font-size:12px;text-transform:uppercase}.tl p{margin:4px 0;font-size:14px}
.page-help{background:#0b1220;border:1px solid #1e3050;border-radius:10px;padding:12px 14px;margin-bottom:14px;color:#94a3b8;font-size:14px}
.page-help b{color:#93c5fd}
.burger{display:none;background:#1d4ed8;color:#fff;border:none;border-radius:8px;padding:8px 12px}
.search-row{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.search-row input{flex:1;min-width:180px}
.share-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.reg-form .row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.dept-bars{margin:4px 0}
.db-row{display:flex;align-items:center;gap:6px;margin:3px 0;font-size:11px}
.db-label{width:68px;color:#94a3b8;flex-shrink:0}
.db-track{flex:1;height:7px;background:#1e3050;border-radius:99px;overflow:hidden}
.db-fill{height:100%;border-radius:99px}
.db-fill.hod{background:#f59e0b}.db-fill.ops{background:#3b82f6}.db-fill.dept{background:#a855f7}
.db-hrs{width:34px;text-align:right;font-weight:600}
.db-delay{color:#93c5fd;font-size:11px;margin-top:3px}
.sla-overall{margin-top:6px}
.sla-overall small{color:#94a3b8;font-size:10px;display:block;margin-bottom:3px}
.pie-wrap{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start;margin:12px 0}
.pie-chart{width:190px;height:190px;border-radius:50%;flex-shrink:0;border:2px solid #1e3050}
.pie-legend{font-size:13px;flex:1;min-width:180px}
.pie-legend div{margin:6px 0;display:flex;align-items:center;gap:8px}
.pie-dot{width:12px;height:12px;border-radius:3px;flex-shrink:0}
.delay-card{background:#0b1220;border:1px solid #1e3050;border-radius:10px;padding:12px;margin-bottom:10px}
.share-dash{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:flex-end}
.share-dash input{max-width:240px;flex:1;min-width:160px}
.status-cell{min-width:240px}
.status-cell label{font-size:11px;color:#b8a0a0;display:block;margin-top:6px}
.status-cell input,.status-cell select{margin:4px 0 6px;width:100%}
.remind-cell{min-width:220px}
.remind-cell label{font-size:11px;color:#b8a0a0;display:block;margin:6px 0 2px}
.remind-cell select{width:100%;min-width:180px;margin-bottom:4px}
.assign-note{display:block;font-size:11px;color:#c4b5fd;margin-top:6px;line-height:1.45}
.assign-note b{color:#e9d5ff;font-weight:600}
.case-card{background:#0b1220;border:1px solid #1e3050;border-radius:12px;padding:14px 16px;margin-bottom:12px;cursor:pointer}
.case-card:hover{border-color:#3b82f6}
.case-card.mismatch{border-color:#ef4444;background:rgba(127,29,29,.12)}
.case-head{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:6px}
.branch-pill{background:rgba(59,130,246,.22);color:#93c5fd;padding:4px 10px;border-radius:8px;font-size:12px;font-weight:700}
.guard-title{font-size:19px;font-weight:700;color:#f8fafc;margin:2px 0 4px}
.guard-banner{font-size:20px;font-weight:800;color:#fff;background:linear-gradient(90deg,#1e40af,#6d28d9);padding:10px 14px;border-radius:8px;margin:0 0 10px;line-height:1.3}
.guard-banner small{display:block;font-size:12px;font-weight:600;color:#e0e7ff;margin-top:4px}
.guard-meta{font-size:12px;color:#94a3b8}
.case-cat{font-size:13px;color:#cbd5e1;margin:8px 0 4px}
.case-foot{margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.case-actions{margin-top:12px;padding-top:12px;border-top:1px solid #1e3050}
.case-actions summary{cursor:pointer;color:#93c5fd;font-size:13px;font-weight:600}
.content.mgmt-wide{max-width:1280px}
.reg-form .row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.reg-ok{background:rgba(20,83,45,.45);border:1px solid #4ade80;border-radius:10px;padding:14px;margin-top:12px;color:#bbf7d0}
.form-frame{width:100%;min-height:520px;border:1px solid #3d2828;border-radius:10px;background:#fff}
@media(max-width:900px){.side{transform:translateX(-100%);transition:.2s;z-index:50}.side.open{transform:none}.main{margin-left:0}.burger{display:inline-block}.share-grid{grid-template-columns:1fr}}
</style></head>
<body>
__GUARDS_LOGIN__

<div id="shell">
  <div class="side" id="side">
    <div class="brand"><img src="https://www.agilegroup-digital.co.in/agile-logo.png"><b>Agile Guards</b><small id="sideBranch">HOD Portal</small></div>
    <div class="menu" id="menu"></div>
    <div class="help-links">
      ${MASTER_DIRECTORY_HELP_LINK_HTML}
      <a href="/guards/manual" target="_blank">📖 User Guide (Staff &amp; HOD)</a>
      <a href="/guards/troubleshooting" target="_blank">🔧 Troubleshooting</a>
    </div>
    <div class="logout" onclick="logout()">⎋ Logout</div>
  </div>
  <div class="main">
    <div class="bar">
      <div><button class="burger" onclick="document.getElementById('side').classList.toggle('open')">☰ Menu</button>
      <h1 id="pageTitle">Branch Dashboard</h1><div id="userLine" style="font-size:13px;color:#b8a0a0"></div></div>
      <button class="btn btn-sm btn-ol" id="refreshBtn" onclick="load(true)">↻ Refresh</button>
    </div>
    <div class="content" id="content">Loading…</div>
  </div>
</div>

<script>
__GUARDS_OTP_SCRIPT__

${SHOW_MASTER_DIRECTORY_LINK_JS}
${suiteMgmtBranchOptionsJs()}

function isDemoMode(){return false;}
function isMgmtPortal(){
  var q=new URLSearchParams(location.search);
  return OTP_ROLE==='management'||q.get('portal')==='management'||q.get('suite_role')==='management';
}
if(isMgmtPortal()) OTP_ROLE='management';

var HOD_MENU_REF=${JSON.stringify(HOD_MENU)};
var MGMT_MENU_REF=${JSON.stringify(MGMT_MENU)};
var GUARD_CATS=${JSON.stringify(GUARD_CATEGORIES)};
var HOD_PAGE_HELP=${JSON.stringify(PAGE_HELP)};
var MGMT_PAGE_HELP=${JSON.stringify(MANAGEMENT_PAGE_HELP)};
var ALL_BRANCHES=${JSON.stringify(ALL_BRANCHES)};
var S={tab:0,role:'hod',branchId:'',branchName:'',canAssign:true,complaints:[],ops:[],dept:[],comms:[],dash:{},delayed:{},analysis:{},events:[],shareUrl:'',search:'',selected:null,caseDetail:null,pageHelp:{},isManagement:false,branches:[],branchFilter:'',branchNames:{},liveData:null,regBranch:'',commsLoaded:false,feedback:[],feedbackSummary:{},hodContacts:[],waRows:null,waFilter:'ALL',waError:'',waBusy:false,waQr:'',waPairCode:''};
var MENU=HOD_MENU_REF.slice();

function useMgmtLayout(){return S.isManagement||isMgmtPortal();}
function dedupeBranchesClient(list){
  var seen={},out=[];
  (list||[]).forEach(function(b){
    var name=branchLabel(b.id,b)||b.name||'';
    var key=String(name).toLowerCase().replace(/[_\s]+/g,'-');
    if(seen[key]) return;
    seen[key]=1;
    out.push({id:b.id,name:name});
  });
  return out.sort(function(a,b){return String(a.name).localeCompare(String(b.name));});
}
function displayGuardName(c){
  var n=(c&&(c.guardName||c.name||'')).trim();
  return n||'Guard name not recorded';
}
function fmtIstDateTime(iso){
  if(!iso) return '—';
  try{
    return new Date(iso).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'});
  }catch(e){return String(iso).slice(0,16).replace('T',' ');}
}
function formatBranchRaw(s){
  var t=String(s||'').trim().replace(/-(AP|TG|MH|GJ|UP|PY|TN|KA|KL|MP)$/i,'');
  var m=t.match(/hyd(?:erabad)?[\s_-]*(?:zone[\s_-]*)?([ab])\b/i);
  if(m) return 'Hyderabad-'+m[1].toUpperCase();
  if(/^hyd\s*zone\s*a$/i.test(t)) return 'Hyderabad-A';
  if(/^hyd\s*zone\s*b$/i.test(t)) return 'Hyderabad-B';
  if(/^karnataka$/i.test(t)||/^bengaluru$/i.test(t)||/^bangalore$/i.test(t)) return 'Bangalore';
  return t;
}
function resolveBranchClient(input){
  var q=String(input||'').trim();
  if(!q) return '';
  if(S.branchNames&&S.branchNames[q]) return q;
  var list=S.branches||[];
  var hit=list.find(function(b){return b.id===q||b.name===q;});
  if(hit) return hit.id;
  var pretty=formatBranchRaw(q);
  hit=list.find(function(b){return b.name===pretty||formatBranchRaw(b.name)===pretty;});
  if(hit) return hit.id;
  var key=q.toLowerCase().replace(/[_\s]+/g,'-');
  var alias={'hyderabad-a':'Hyderabad-A','hyderabad-b':'Hyderabad-B','hyd-zone-a':'Hyderabad-A','hyd-zone-b':'Hyderabad-B','hyd-a':'Hyderabad-A','hyd-b':'Hyderabad-B','karnataka':'Bangalore','bengaluru':'Bangalore','bangalore':'Bangalore','b-karnataka':'Bangalore'};
  if(alias[key]){
    hit=list.find(function(b){return b.name===alias[key];});
    if(hit) return hit.id;
  }
  if(S.branchNames){
    for(var id in S.branchNames){
      if(S.branchNames[id]===q||S.branchNames[id]===pretty||formatBranchRaw(S.branchNames[id])===pretty) return id;
    }
  }
  return pretty||q;
}
function branchIdsMatch(a,b){
  if(!a&&!b) return true;
  if(!a||!b) return false;
  if(a===b) return true;
  return resolveBranchClient(a)===resolveBranchClient(b);
}
function allStaffList(kind){
  var src=S.liveData||{};
  return (kind==='ops'?(src.opsStaff||[]):(src.deptStaff||[])).filter(function(x){return x.active!==false;});
}
function staffForBranch(kind,branchId){
  var list=allStaffList(kind);
  if(!list.length) list=((kind==='ops'?S.ops:S.dept)||[]).filter(function(x){return x.active!==false;});
  // Department staff is company-wide — same list for every branch (includes HR)
  if(kind==='dept') return list;
  // Operations staff: ONLY the complaint / login branch — never fall back to Visakhapatnam etc.
  // Plus company-wide HOD/OM with no branch. Never another city.
  function opsOnThisBranch(s){
    if(!s.branchId) return true;
    if(branchIdsMatch(s.branchId,branchId)) return true;
    var want=String(branchLabel(branchId)||'').toLowerCase();
    var n=String(s.branchName||branchLabel(s.branchId)||'').toLowerCase();
    return !!(want&&n&&(n===want||(want.indexOf('bangalore')>=0&&(n.indexOf('bangalore')>=0||n.indexOf('bengaluru')>=0||n.indexOf('karnataka')>=0))));
  }
  if(!branchId) return list;
  return list.filter(opsOnThisBranch);
}
function branchLabel(id,row){
  if(row&&row.branchName) return row.branchName;
  if(S.branchNames[id]) return S.branchNames[id];
  var hit=S.branches.find(function(b){return b.id===id||String(b.name).toLowerCase()===String(id).toLowerCase();});
  if(hit) return hit.name;
  return formatBranchRaw(id)||id||'—';
}
function applyBranchFilter(list){
  if(!S.branchFilter) return list;
  return list.filter(function(x){return branchIdsMatch(x.branchId,S.branchFilter);});
}
function applyDataView(){
  var src=S.liveData||{};
  S.complaints=applyBranchFilter(src.complaints||[]);
  S.ops=(src.opsStaff||[]).filter(function(x){
    if(x.active===false) return false;
    if(!S.branchFilter||!x.branchId) return true;
    return branchIdsMatch(x.branchId,S.branchFilter);
  });
  // Department staff is the same for all branches — do not filter by branch
  S.dept=(src.deptStaff||[]).filter(function(x){return x.active!==false;});
  S.comms=(src.communications||[]).slice();
  if(S.branchFilter) S.comms=S.comms.filter(function(c){var row=(src.complaints||[]).find(function(x){return x.id===c.complaintId;});return !c.complaintId||!row||row.branchId===S.branchFilter;});
  S.dash=src.dashboard||{};
  S.delayed=src.delayedAnalysis||{};
  S.analysis=src.complaintAnalysis||{};
  S.events=src.events||[];
  S.feedback=src.feedback||[];
  S.feedbackSummary=src.feedbackSummary||{};
  if(S.branchFilter){
    var ids={};S.complaints.forEach(function(c){ids[c.id]=1;});
    S.events=S.events.filter(function(e){return ids[e.complaintId];});
  }
}

function pageIntro(){
  var help=(S.pageHelp&&S.pageHelp[S.tab])||'';
  if(help) return '<div class="page-help"><b>What this page does:</b> '+esc(help)+'</div>';
  return '';
}
function el(id){return document.getElementById(id)}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function api(body){
  return fetch('/api/guards/data',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','Cache-Control':'no-cache'},body:JSON.stringify(Object.assign({sessionToken:OTP_SESSION,_t:Date.now()},body||{}))})
    .then(function(r){
      return r.text().then(function(t){
        var j=null;
        try{j=t?JSON.parse(t):{};}catch(e){
          if(r.status===401){otpHandleUnauthorized();throw new Error('Session expired');}
          throw new Error((t||'Server error').slice(0,120).replace(/\s+/g,' ').trim()||'Server error — please refresh');
        }
        if(r.status===401){otpHandleUnauthorized();throw new Error('Session expired');}
        return j;
      });
    });
}
function onOtpLogin(d){
  el('login').style.display='none';el('shell').style.display='block';
  S.email=(d&&d.email)||OTP_EMAIL||'';
  S.isManagement=isMgmtPortal();
  S.pageHelp=S.isManagement?MGMT_PAGE_HELP:HOD_PAGE_HELP;
  MENU=S.isManagement?MGMT_MENU_REF.slice():HOD_MENU_REF.slice();
  buildMenu();
  el('content').innerHTML='<p style="color:#94a3b8;padding:20px">Loading…</p>';
  load(false);
}
function logout(){otpLogout();}
function buildMenu(){
  if(!MENU||!MENU.length) return;
  var h='';MENU.forEach(function(m,i){if(!m) return;h+='<button class="mi'+(S.tab===i?' on':'')+'" onclick="tab('+i+')"><b>'+esc(m[0])+'</b><small>'+esc(m[1])+'</small></button>';});
  el('menu').innerHTML=h;
}
function tab(n){S.tab=n;S.selected=null;S.caseDetail=null;buildMenu();render();document.getElementById('side').classList.remove('open');}
function load(fromRefresh){
  var btn=el('refreshBtn');if(btn) btn.textContent='↻ Loading…';
  if(!fromRefresh) el('content').innerHTML='<p style="color:#94a3b8;padding:20px">Loading…</p>';
  api({action:'load',search:S.search||'',branchId:S.branchFilter||'',live:true}).then(function(d){
    if(btn) btn.textContent='↻ Refresh';
    if(!d.ok){el('content').innerHTML='<p style="color:#f87171">'+esc(d.error||'Could not load')+'</p>';return;}
    S.role=d.role;S.branchId=d.branchId;S.branchName=d.branchName;S.canAssign=d.canAssign!==false;
    S.isManagement=d.role==='management'||isMgmtPortal();
    if(d.branches&&d.branches.length) S.branches=dedupeBranchesClient(d.branches);
    else if(S.isManagement) S.branches=dedupeBranchesClient(ALL_BRANCHES.slice());
    S.branchNames={};
    (S.branches||[]).forEach(function(b){S.branchNames[b.id]=b.name;});
    (d.complaints||[]).concat(d.opsStaff||[]).concat(d.deptStaff||[]).forEach(function(row){
      if(row&&row.branchId&&row.branchName) S.branchNames[row.branchId]=row.branchName;
    });
    S.liveData={
      complaints:d.complaints||[],opsStaff:d.opsStaff||[],deptStaff:d.deptStaff||[],
      communications:d.communications||[],dashboard:d.dashboard||{},delayedAnalysis:d.delayedAnalysis||{},
      complaintAnalysis:d.complaintAnalysis||{},events:d.events||[],
      feedback:d.feedback||[],feedbackSummary:d.feedbackSummary||{}
    };
    S.feedback=d.feedback||[];
    S.feedbackSummary=d.feedbackSummary||{};
    S.hodContacts=d.hodContacts||[];
    S.comms=(d.communications||[]).slice();
    S.commsLoaded=Boolean((d.communications||[]).length);
    MENU=S.isManagement?MGMT_MENU_REF:HOD_MENU_REF;
    S.pageHelp=d.pageHelp||{};
    S.shareUrl=d.shareUrl||'';
    if(!S.regBranch&&S.branches.length) S.regBranch=S.branches[0].name;
    S.shareUrl=regUrlForBranch(S.isManagement?S.regBranch:S.branchName);
    applyDataView();
    el('sideBranch').textContent=(S.isManagement?'Management Portal · All branches':(d.branchName||'Branch'))+' · '+d.role.toUpperCase();
    el('userLine').textContent=(d.name||d.email)+' · '+(S.isManagement?'All branches':d.branchName)+(fromRefresh?' · refreshed '+new Date().toLocaleTimeString('en-IN'):'');
    if(S.isManagement) el('content').classList.add('mgmt-wide'); else el('content').classList.remove('mgmt-wide');
    showMasterDirectoryLink(S.isManagement);
    if(!S.selected){
      try{
        var q=new URLSearchParams(location.search);
        var deep=String(q.get('case')||q.get('focus')||'').trim();
        if(deep) S.selected=deep;
      }catch(e){}
    }
    if(S.selected) return openCase(S.selected);
    render();
    api({action:'escalateDelayed'}).catch(function(){});
  }).catch(function(e){if(btn) btn.textContent='↻ Refresh';el('content').innerHTML='<p style="color:#f87171">'+esc(e.message)+'</p>';});
}
function slaPct(c){
  var start=new Date(c.registeredAt).getTime(),end=new Date(c.slaDeadline).getTime();
  return Math.min(100,Math.max(0,Math.round(((Date.now()-start)/(end-start))*100)));
}
function displayStatus(c){
  if(c.status==='solved') return '<span class="badge ok">Solved</span>';
  if(c.isDelayed) return '<span class="badge er">Delayed Response</span>';
  return '<span class="badge wn">Under process</span>';
}
function stageClocks(c){
  function hrs(a,b){if(!a||!b) return 0;return Math.max(0,Math.round(((new Date(b).getTime()-new Date(a).getTime())/3600000)*10)/10);}
  var now=new Date().toISOString(),end=c.solvedAt||now;
  var hod=c.assignedAt?hrs(c.registeredAt,c.assignedAt):hrs(c.registeredAt,now);
  var ops=c.assignedAt?hrs(c.assignedAt,c.opsCompletedAt||end):0;
  var dept=c.deptCompletedAt?hrs(c.opsCompletedAt||c.assignedAt,c.deptCompletedAt):c.assignedAt?hrs(c.opsCompletedAt||c.assignedAt,end):0;
  return {hod:hod,ops:ops,dept:dept};
}
function canRemind(){return S.isManagement||S.role==='management';}
function canDeleteComplaint(){return canRemind();}
function deleteComplaintBtn(c,inline){
  if(!canDeleteComplaint()) return '';
  var label=inline?'Delete':'Remove complaint';
  return '<button class="btn btn-sm btn-danger" type="button" onclick="deleteComplaint(\\''+esc(c.id)+'\\')">'+label+'</button>';
}
function deleteComplaint(id){
  if(!canDeleteComplaint()){alert('Director / Management only.');return;}
  var c=(S.complaints||[]).find(function(x){return x.id===id;})||(S.caseDetail&&S.caseDetail.complaint);
  var code=c?c.code:id;
  var guardName=c?displayGuardName(c):'';
  var msg='Remove complaint '+code+(guardName?' ('+guardName+')':'')+'?\\n\\nThis cannot be undone.';
  if(!confirm(msg)) return;
  api({action:'deleteComplaint',complaintId:id}).then(function(d){
    if(d.ok){
      alert('Deleted '+code);
      S.selected=null;S.caseDetail=null;
      load(true);
    } else alert(d.error||'Could not delete');
  });
}
function delayStage(c){
  var clk=stageClocks(c);
  var stages=[{n:'HOD / RM',h:clk.hod},{n:'Operations',h:clk.ops},{n:'Department',h:clk.dept}];
  stages.sort(function(a,b){return b.h-a.h;});
  return stages[0]&&stages[0].h>0?stages[0].n:'Awaiting assignment';
}
function deptTimeBarsHtml(c){
  var clk=stageClocks(c),mx=Math.max(clk.hod,clk.ops,clk.dept,1);
  function bar(lbl,cls,hrs){var w=Math.round((hrs/mx)*100);return '<div class="db-row"><span class="db-label">'+lbl+'</span><div class="db-track"><div class="db-fill '+cls+'" style="width:'+w+'%"></div></div><span class="db-hrs">'+hrs+'h</span></div>';}
  var h='<div class="dept-bars">'+bar('HOD','hod',clk.hod)+bar('Ops','ops',clk.ops)+bar('Dept','dept',clk.dept);
  h+='<div class="db-delay">Delayed at: <b>'+esc(delayStage(c))+'</b></div></div>';
  var pct=slaPct(c);
  h+='<div class="sla-overall"><small>Overall 24-hour clock</small><div class="sla-bar"><div class="sla-fill" style="width:'+pct+'%"></div></div></div>';
  return h;
}
function pieChartHtml(items){
  items=(items||[]).filter(function(x){return x.count>0;});
  if(!items.length) return '<p style="color:#b8a0a0">No data yet.</p>';
  var cols=['#ef4444','#f59e0b','#3b82f6','#22c55e','#a855f7','#ec4899','#14b8a6'];
  var total=items.reduce(function(s,x){return s+x.count;},0)||1;
  var acc=0,segs=[];
  items.forEach(function(it,i){var pct=(it.count/total)*100;segs.push(cols[i%cols.length]+' '+(acc)+'% '+(acc+pct)+'%');acc+=pct;});
  var h='<div class="pie-wrap"><div class="pie-chart" style="background:conic-gradient('+segs.join(',')+')"></div><div class="pie-legend">';
  items.forEach(function(it,i){h+='<div><span class="pie-dot" style="background:'+cols[i%cols.length]+'"></span><b>'+esc(it.cause||it.category||it.label)+'</b> — '+it.count+' ('+Math.round((it.count/total)*100)+'%)</div>';});
  return h+'</div></div>';
}
function sendReminder(id,target){
  sendReminderPick(id,target);
}
function hodMatchesBranch(h,branchId){
  if(branchIdsMatch(h.branchId,branchId)) return true;
  var want=String(formatBranchRaw(branchLabel(branchId))||'').toLowerCase();
  var have=String(formatBranchRaw(h.branchName||branchLabel(h.branchId))||'').toLowerCase();
  return !!(want&&have&&want===have);
}
function staffRoleLabel(o){
  return String(o&&o.roleLabel||'').trim()||'Operations';
}
function hodOptionsForBranch(branchId){
  var list=(S.hodContacts||[]).filter(function(h){return !h.branchId||hodMatchesBranch(h,branchId);});
  var seen={},h='';
  function addHod(em,name,role,br){
    em=String(em||'').trim();
    var key=em.toLowerCase();
    if(!em||em.indexOf('@')<0||seen[key]) return;
    seen[key]=1;
    h+='<option value="'+esc(em)+'">'+esc(role||'HOD')+' — '+esc(name||em)+' ('+esc(em)+')'+(br?' — '+esc(br):'')+'</option>';
  }
  list.forEach(function(hod){
    addHod(hod.email,hod.name,hod.roleLabel,hod.branchName||branchLabel(hod.branchId||branchId));
  });
  staffForBranch('ops',branchId).forEach(function(o){
    addHod(o.email,o.name,staffRoleLabel(o),o.branchName||branchLabel(o.branchId||branchId));
  });
  return h;
}
function reminderStaffOptions(branchId){
  var h='';
  staffForBranch('ops',branchId).forEach(function(o){
    h+='<option value="ops:'+esc(o.id)+'">'+esc(staffRoleLabel(o))+' — '+esc(o.name)+(o.email?' ('+esc(o.email)+')':'')+'</option>';
  });
  staffForBranch('dept',branchId).forEach(function(d){
    h+='<option value="dept:'+esc(d.id)+'">'+esc(d.department)+' — '+esc(d.name)+(d.email?' ('+esc(d.email)+')':'')+'</option>';
  });
  return h;
}
function reminderCellHtml(c){
  var hodOpts=hodOptionsForBranch(c.branchId);
  var staffOpts=reminderStaffOptions(c.branchId);
  var h='<div class="remind-cell">';
  h+='<label>HOD (select)</label><select id="hod_'+esc(c.id)+'"><option value="">— Select HOD —</option>'+hodOpts+'</select>';
  h+='<button class="btn btn-sm btn-ol" type="button" onclick="sendReminderPick(\\''+esc(c.id)+'\\',\\'hod\\')">Remind HOD</button>';
  h+='<label>Ops / Department (select)</label><select id="rstaff_'+esc(c.id)+'"><option value="">— Select staff —</option>'+staffOpts+'</select>';
  h+='<button class="btn btn-sm btn-ol" type="button" onclick="sendReminderPick(\\''+esc(c.id)+'\\',\\'department\\')">Remind staff</button>';
  if(!hodOpts&&!staffOpts) h+='<p style="font-size:11px;color:#fbbf24;margin-top:6px">No HOD or Operation Manager for this branch in User Management. Add them there, or add Ops/Dept staff in the left menu.</p>';
  return h+'</div>';
}
function sendReminderPick(id,target){
  if(!canRemind()){alert('Director / Management only.');return;}
  var body={action:'sendReminder',complaintId:id,target:target||'hod'};
  if(target==='hod'){
    var em=el('hod_'+id)&&el('hod_'+id).value;
    if(!em){alert('Please select HOD from the dropdown first.');var s=el('hod_'+id);if(s)s.focus();return;}
    body.hodEmail=em;
  } else {
    var pick=el('rstaff_'+id)&&el('rstaff_'+id).value;
    if(!pick){alert('Please select Operations or Department staff from the dropdown.');var s=el('rstaff_'+id);if(s)s.focus();return;}
    if(pick.indexOf('ops:')===0) body.opsStaffId=pick.slice(4);
    else if(pick.indexOf('dept:')===0) body.deptStaffId=pick.slice(5);
  }
  api(body).then(function(d){
    if(d.ok) alert('Reminder email sent.'); else alert(d.error||d.result?.error||'Could not send');
  });
}
function shareDashboard(){
  var inp=el('dashShareEmail');
  var to=(inp&&inp.value||'').trim();
  if(!to||to.indexOf('@')<0){alert('Please enter email address to send dashboard.');if(inp) inp.focus();return;}
  api({action:'shareDashboard',to:to,branchId:S.branchFilter||''}).then(function(d){
    if(d.ok) alert('Colourful dashboard shared by email to '+to+' (with Agile header & footer)'); else alert(d.error||'Could not share');
  });
}
function deptOptionsForBranch(branchId){
  var h='';
  staffForBranch('ops',branchId).forEach(function(o){
    if(o.email) h+='<option value="ops:'+esc(o.id)+'">'+esc(staffRoleLabel(o))+' — '+esc(o.name)+' ('+esc(o.email)+')</option>';
  });
  staffForBranch('dept',branchId).forEach(function(d){
    if(d.email) h+='<option value="dept:'+esc(d.id)+'">'+esc(d.department)+' — '+esc(d.name)+' ('+esc(d.email)+')</option>';
    else h+='<option value="dept:'+esc(d.id)+'">'+esc(d.department)+' — '+esc(d.name)+'</option>';
  });
  return h;
}
function sendStatus(id,target){
  if(!canRemind()){alert('Director / Management only.');return;}
  var toEmail='',deptStaffId='',opsStaffId='';
  if(target==='client'){
    var inp=el('cli_'+id);
    toEmail=(inp&&inp.value||'').trim();
    if(!toEmail||toEmail.indexOf('@')<0){alert('Please enter client email address.');if(inp) inp.focus();return;}
  } else if(target==='hod'){
    var hodSel=el('hodinf_'+id);
    toEmail=(hodSel&&hodSel.value||'').trim();
    if(!toEmail||toEmail.indexOf('@')<0){alert('Please select HOD from the dropdown.');if(hodSel) hodSel.focus();return;}
  } else {
    var sel=el('dept_'+id);
    var pick=(sel&&sel.value||'').trim();
    if(!pick){alert('Please select Operations or Department staff from the dropdown.');if(sel) sel.focus();return;}
    if(pick.indexOf('ops:')===0) opsStaffId=pick.slice(4);
    else if(pick.indexOf('dept:')===0) deptStaffId=pick.slice(5);
  }
  api({action:'sendStatusUpdate',complaintId:id,target:target,toEmail:toEmail,deptStaffId:deptStaffId,opsStaffId:opsStaffId}).then(function(d){
    if(d.ok) alert('Status email sent.'); else alert(d.error||d.result?.error||'Could not send');
  });
}
function sendFeedbackOne(id,ch){
  api({action:'sendFeedbackRequest',complaintId:id,channel:ch||'whatsapp'}).then(function(d){
    if(d.ok) alert('Feedback form sent'); else alert(d.error||'Could not send');
  });
}
function sendFeedbackBulk(ch){
  if(!confirm('Send feedback form to all solved complainants without feedback?')) return;
  api({action:'sendFeedbackBulk',channel:ch||'whatsapp',branchId:S.branchFilter||''}).then(function(d){
    if(d.ok) alert('Sent to '+d.sent+' of '+d.total+' complainants'); else alert(d.error||'Could not send');
  });
}
function clockHtml(c){
  var clk=stageClocks(c);
  return '<div class="clock">HOD: <b>'+clk.hod+'h</b> · Ops: <b>'+clk.ops+'h</b> · Dept: <b>'+clk.dept+'h</b></div>';
}
function searchBar(){
  return '<div class="search-row"><input id="searchQ" placeholder="Search by ID No. or Mobile" value="'+esc(S.search||'')+'" onkeydown="if(event.key===\\'Enter\\')doSearch()"><button class="btn btn-sm" onclick="doSearch()">Search</button><button class="btn btn-sm btn-ol" onclick="S.search=\\'\\';load()">Clear</button></div>';
}
function doSearch(){S.search=(el('searchQ')&&el('searchQ').value||'').trim();load();}
function filterList(list){if(!S.search) return list;var s=S.search.replace(/\\D/g,'');if(!s) return list;return list.filter(function(c){return String(c.idNo||'').replace(/\\D/g,'').indexOf(s)>=0||String(c.mobile||'').replace(/\\D/g,'').indexOf(s)>=0;});}
function assignedToNote(c){
  var lines=[];
  if(c.opsStaffName&&String(c.opsStaffName).trim()){
    var ops='Mr. '+esc(String(c.opsStaffName).trim())+' (Operations)';
    if(c.opsStaffBranchName) ops+=' · '+esc(c.opsStaffBranchName);
    lines.push(ops);
  }
  if(c.deptStaffName&&String(c.deptStaffName).trim()){
    var dept='Mr. '+esc(String(c.deptStaffName).trim());
    if(c.department) dept+=' — '+esc(c.department);
    if(c.deptStaffBranchName) dept+=' · '+esc(c.deptStaffBranchName);
    lines.push(dept);
  }
  if(!lines.length){
    if(c.department) return '<span class="assign-note"><b>Assigned to:</b> <span style="color:#fbbf24">Pending — '+esc(c.department)+' team ('+esc(branchLabel(c.branchId,c))+')</span></span>';
    return '<span class="assign-note"><b>Assigned to:</b> <span style="color:#fbbf24">Not yet assigned — '+esc(branchLabel(c.branchId,c))+'</span></span>';
  }
  var h='<span class="assign-note"><b>Assigned to</b> '+lines.join(' · ')+'</span>';
  if(c.assignmentMismatch) h+='<span class="assign-note" style="color:#f87171"><b>Wrong branch!</b> Re-assign using '+esc(branchLabel(c.branchId,c))+' staff only.</span>';
  return h;
}
function informStatusHtml(c){
  return '<label>Client email</label><input id="cli_'+esc(c.id)+'" type="email" placeholder="client@bank.com"><button class="btn btn-sm" type="button" onclick="sendStatus(\\''+esc(c.id)+'\\',\\'client\\')">Email client</button>'+
    '<label>HOD</label><select id="hodinf_'+esc(c.id)+'"><option value="">— Select HOD —</option>'+hodOptionsForBranch(c.branchId)+'</select><button class="btn btn-sm btn-ol" type="button" onclick="sendStatus(\\''+esc(c.id)+'\\',\\'hod\\')">Email HOD</button>'+
    '<label>Ops / Dept</label><select id="dept_'+esc(c.id)+'"><option value="">— Select —</option>'+deptOptionsForBranch(c.branchId)+'</select><button class="btn btn-sm btn-ol" type="button" onclick="sendStatus(\\''+esc(c.id)+'\\',\\'department\\')">Email staff</button>';
}
function complaintMgmtCards(list,opts){
  opts=opts||{};
  list=filterList(list);
  if(!list.length) return '<p style="color:#b8a0a0">No complaints in this list.</p>';
  var h='<div class="case-list">';
  list.slice().sort(function(a,b){return String(b.registeredAt).localeCompare(String(a.registeredAt));}).forEach(function(c){
    h+='<div class="case-card'+(c.assignmentMismatch?' mismatch':'')+'" onclick="openCase(\\''+esc(c.id)+'\\')">';
    h+='<div class="guard-banner">'+esc(displayGuardName(c))+'<small>ID '+esc(c.idNo||'—')+' · Mobile '+esc(c.mobile||'—')+'</small></div>';
    h+='<div class="case-head"><span class="branch-pill">'+esc(branchLabel(c.branchId,c))+'</span>';
    h+='<span style="font-weight:700;color:#93c5fd">'+esc(c.code)+'</span>';
    h+='<small style="color:#94a3b8">'+esc(c.registeredAtLabel||fmtIstDateTime(c.registeredAt))+'</small>';
    h+='<span style="margin-left:auto">'+displayStatus(c)+'</span></div>';
    h+='<div class="case-cat">'+esc(c.category)+' — '+esc(c.subCategory)+'</div>';
    h+=assignedToNote(c);
    h+='<div style="margin-top:10px">'+deptTimeBarsHtml(c)+'</div>';
    h+='<div class="case-foot" onclick="event.stopPropagation()">';
    h+='<button class="btn btn-sm" type="button" onclick="openCase(\\''+esc(c.id)+'\\')">Open & assign</button>';
    if(canDeleteComplaint()) h+=deleteComplaintBtn(c,false);
    if(opts.showActions&&canRemind()){
      h+='<details class="case-actions"><summary>Remind / Inform status</summary>';
      h+='<div style="margin-top:10px">'+reminderCellHtml(c)+'</div>';
      h+='<div class="status-cell" style="margin-top:10px">'+informStatusHtml(c)+'</div></details>';
    }
    h+='</div></div>';
  });
  return h+'</div>';
}
function complaintRows(list,click,opts){
  opts=opts||{};
  list=filterList(list);
  if(!list.length) return '<p style="color:#b8a0a0">No complaints in this list.</p>';
  var branchCol=S.isManagement?'<th>Branch</th>':'';
  var remindCol=(opts.showRemind&&canRemind())?'<th>Reminder</th>':'';
  var statusCol=(opts.showStatus&&canRemind())?'<th>Inform status</th>':'';
  var h='<div class="tblwrap"><table><thead><tr>'+branchCol+'<th>Code</th><th>Guard</th><th>Category</th><th>Time by department</th><th>Status</th><th></th>'+remindCol+statusCol+'</tr></thead><tbody>';
  list.slice().sort(function(a,b){return String(b.registeredAt).localeCompare(String(a.registeredAt));}).forEach(function(c){
    h+='<tr'+(click?' class="click" onclick="openCase(\\''+esc(c.id)+'\\')"':'')+'>';
    if(S.isManagement) h+='<td><b>'+esc(branchLabel(c.branchId,c))+'</b></td>';
    h+='<td><b>'+esc(c.code)+'</b><br><small>'+esc(c.registeredAtLabel||fmtIstDateTime(c.registeredAt))+'</small></td>';
    h+='<td><b style="font-size:15px;color:#f8fafc">'+esc(displayGuardName(c))+'</b><br><small>ID '+esc(c.idNo)+' · '+esc(c.mobile)+'</small></td>';
    h+='<td>'+esc(c.category)+'<br><small>'+esc(c.subCategory)+'</small></td>';
    h+='<td style="min-width:200px">'+deptTimeBarsHtml(c)+'</td><td>'+displayStatus(c)+(S.isManagement?'<br>'+assignedToNote(c):'')+'</td>';
    h+='<td onclick="event.stopPropagation()"><button class="btn btn-sm" type="button" onclick="openCase(\\''+esc(c.id)+'\\')">Open &amp; assign</button></td>';
    if(opts.showRemind&&canRemind()) h+='<td onclick="event.stopPropagation()">'+reminderCellHtml(c)+'</td>';
    if(opts.showStatus&&canRemind()) h+='<td class="status-cell" onclick="event.stopPropagation()">'+informStatusHtml(c)+'</td>';
    h+='</tr>';
  });
  return h+'</tbody></table></div>';
}
function render(){
  if(S.caseDetail) return renderCase();
  el('pageTitle').textContent=(MENU[S.tab]&&MENU[S.tab][0])||'Branch Dashboard';
  var fn=[rDash,rRegister,rReceived,rDelayed,rAnalysis,rDelayedA,rComms,rFeedback,rOps,rDept];
  var view=fn[S.tab];
  el('content').innerHTML=pageIntro()+(view?view():'');
}
function rDash(){
  var d=S.dash,h='';
  if(S.isManagement){
    h+='<div class="panel" style="margin-bottom:12px"><label>Branch</label><select id="mgmtBr" onchange="S.branchFilter=this.value===\\'ALL\\'?\\'\\':this.value;load()">'+suiteMgmtBranchOptionsHtml(S.branches,S.branchFilter||'ALL')+'</select></div>';
  }
  h+='<div class="share-dash"><div><label style="font-size:12px;color:#b8a0a0;display:block;margin-bottom:4px">Email to send colourful dashboard (Agile header &amp; footer)</label><input id="dashShareEmail" type="email" placeholder="client@bank.com"></div><button class="btn btn-sm" onclick="shareDashboard()">Share dashboard by email</button><button class="btn btn-sm btn-ol" onclick="navigator.clipboard&&navigator.clipboard.writeText(location.href).then(function(){alert(\\'Link copied\\')})">Copy portal link</button></div>';
  h+='<p style="color:#94a3b8;font-size:12px;margin:-6px 0 12px">Shared mail uses the usual Agile letterhead header and suite footer, with the same colourful KPI cards and tables as this dashboard.</p>';
  h+='<div class="kgrid">';
  [['total','Total'],['received','Open'],['delayed','Delayed &gt;24h'],['solved','Solved'],['avgResponseHours','Avg hours (h)'],['slaCompliancePct','Within 24h %']].forEach(function(p){
    var v=d[p[0]];if(p[0]==='avgResponseHours') v=(v||0)+'h';else if(p[0]==='slaCompliancePct') v=(v||0)+'%';
    h+='<div class="kpi"><b>'+v+'</b><span>'+p[1]+'</span></div>';
  });
  h+='</div>';
  var delayed=S.complaints.filter(function(c){return c.isDelayed&&c.status!=='solved';});
  // Locked order after KPI cards: branch table, then department hours, then category cards
  if(S.isManagement&&(d.byBranch||[]).length){h+='<div class="panel"><h3>Branch-wise breakdown</h3><div class="tblwrap"><table><tr><th>Branch</th><th>Total</th><th>Open</th><th>Delayed</th><th>Solved</th><th>Avg hours</th><th>Within 24h</th></tr>';
    d.byBranch.forEach(function(x){h+='<tr><td><b>'+esc(x.branchName)+'</b></td><td>'+x.total+'</td><td>'+x.received+'</td><td>'+x.delayed+'</td><td>'+x.solved+'</td><td>'+x.avgHours+'h</td><td>'+x.slaPct+'%</td></tr>';});
    h+='</table></div></div>';}
  if((d.byDepartment||[]).length){h+='<div class="panel"><h3>Time per department</h3><div class="tblwrap"><table><tr><th>Department</th><th>Cases</th><th>Avg hours</th><th>Delayed</th></tr>';
    d.byDepartment.forEach(function(x){h+='<tr><td>'+esc(x.department)+'</td><td>'+x.count+'</td><td>'+x.avgHours+'h</td><td>'+x.delayed+'</td></tr>';});
    h+='</table></div></div>';}
  if((d.topCategories||[]).length){h+='<div class="panel"><h3>Complaint categories</h3><div class="kgrid">';
    d.topCategories.forEach(function(c){h+='<div class="kpi"><b>'+c.count+'</b><span>'+esc(c.category)+' · avg '+c.avgHours+'h</span></div>';});
    h+='</div></div>';}
  if(delayed.length){
    h+='<div class="panel"><h3>Beyond 24 hours — all delayed complaints</h3><p style="color:#b8a0a0;margin-bottom:10px">Each case shows where time was spent (HOD · Ops · Dept) and overall 24-hour clock.</p>';
    delayed.forEach(function(c){
      h+='<div class="delay-card'+(c.assignmentMismatch?' mismatch':'')+'"><div class="guard-banner">'+esc(displayGuardName(c))+'<small>ID '+esc(c.idNo||'—')+' · '+esc(c.mobile||'—')+'</small></div><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-top:8px"><div><span class="branch-pill">'+esc(branchLabel(c.branchId,c))+'</span> <b>'+esc(c.code)+'</b></div><div>'+displayStatus(c)+'</div></div>';
      h+='<p style="margin:6px 0;font-size:13px">'+esc(c.category)+' — '+esc(c.subCategory)+'</p>';
      if(S.isManagement) h+='<p style="margin:4px 0">'+assignedToNote(c)+'</p>';
      h+=deptTimeBarsHtml(c);
      if(canRemind()) h+='<div style="margin-top:8px" onclick="event.stopPropagation()"><details><summary style="color:#93c5fd;cursor:pointer">Remind / Inform</summary><div style="margin-top:8px">'+reminderCellHtml(c)+'</div></details></div>';
      h+='</div>';
    });
    h+='</div>';
  }
  if((d.hurdles||[]).length){h+='<div class="panel"><h3>Where it is delayed</h3>';d.hurdles.forEach(function(x){h+='<div class="alert '+(x.count>2?'red':'amber')+'"><b>'+esc(x.label)+' ('+x.count+')</b><br>'+esc(x.hint)+'</div>';});h+='</div>';}
  h+='<div class="panel"><h3>Suggestions to reduce response time (24 hours)</h3><ul class="suggest">';
  (d.suggestions||[]).forEach(function(s){h+='<li>'+esc(s)+'</li>';});h+='</ul></div>';
  return h;
}
function regBranchForQr(){
  if(S.isManagement){
    var sel=el('regBranchSel');
    if(sel&&sel.value){S.regBranch=sel.value;return sel.value;}
    if(S.regBranch) return S.regBranch;
    return (S.branches[0]&&S.branches[0].name)||'';
  }
  return S.branchName||'';
}
function regUrlForBranch(branchName){
  return 'https://www.agilegroup-digital.co.in/guards/register?branch='+encodeURIComponent(branchName||'');
}
function rRegister(){
  var regBranch=regBranchForQr();
  var url=regUrlForBranch(regBranch);
  var qr='https://api.qrserver.com/v1/create-qr-code/?size=260x260&data='+encodeURIComponent(url)+'&t='+Date.now();
  var commonUrl='https://www.agilegroup-digital.co.in/guards/register';
  var commonPoster='https://www.agilegroup-digital.co.in/guards/complaint-poster';
  var commonQr='https://api.qrserver.com/v1/create-qr-code/?size=260x260&data='+encodeURIComponent(commonUrl)+'&t='+Date.now();
  var waText=encodeURIComponent('Agile Security Force — Guards Complaint\\nBranch: '+regBranch+'\\nRegister here (no login):\\n'+url+'\\nOur response time: 24 hours');
  var cats='';Object.keys(GUARD_CATS||{}).forEach(function(k){cats+='<option value="'+esc(k)+'">'+esc(k)+'</option>';});
  var branchPick='';
  if(S.isManagement&&(S.branches||[]).length){
    branchPick='<label>Branch for this complaint</label><select id="regBranchSel" onchange="S.regBranch=this.value;S.shareUrl=regUrlForBranch(this.value);render()">';
    S.branches.forEach(function(b){branchPick+='<option value="'+esc(b.name)+'"'+(b.name===regBranch?' selected':'')+'>'+esc(b.name)+'</option>';});
    branchPick+='</select>';
  }
  var h='<div class="panel reg-form"><h3>Register Phone Complaints</h3>';
  h+='<p style="color:#b8a0a0;margin-bottom:12px">Guard visits control room — fill this form and submit. Branch: <b>'+esc(regBranch)+'</b> · Response time: <b>24 hours</b>.</p>';
  h+=branchPick;
  h+='<div id="regMsg" style="display:none" class="alert amber"></div><div id="regOk" class="reg-ok" style="display:none"></div>';
  h+='<div class="row2"><div><label>Guard Name *</label><input id="regName" placeholder="Full name"></div><div><label>ID No. *</label><input id="regId" placeholder="Guard ID"></div></div>';
  h+='<label>Mobile Number *</label><input id="regMob" type="tel" placeholder="10-digit mobile">';
  h+='<div class="row2"><div><label>Category</label><select id="regCat" onchange="updateRegSubs()"><option value="">— Select —</option>'+cats+'</select></div>';
  h+='<div><label>Detail</label><select id="regSub"><option value="">— Select category —</option></select></div></div>';
  h+='<label>Describe complaint</label><textarea id="regNote" rows="3" placeholder="Guard explains the issue…"></textarea>';
  h+='<button class="btn btn-sm" onclick="submitControlComplaint()">Submit complaint</button>';
  h+='<button class="btn btn-sm btn-ol" onclick="resetControlForm()">Clear form</button></div>';
  h+='<div class="panel"><h3>Common QR — all branches (save on phone)</h3>';
  h+='<p style="color:#b8a0a0;margin-bottom:10px">One poster for every guard. They scan, pick <b>their branch</b>, and register. Not locked to one zone.</p>';
  h+='<div style="text-align:center;background:#fff;border-radius:12px;padding:12px;margin-bottom:10px"><img src="'+commonQr+'" width="220" alt="Common QR" style="background:#fff"></div>';
  h+='<input readonly value="'+esc(commonUrl)+'" onclick="this.select()">';
  h+='<button class="btn btn-sm" onclick="window.open(\\''+esc(commonPoster)+'\\',\\'_blank\\')">Open / print common poster</button>';
  h+='<button class="btn btn-sm btn-ol" onclick="navigator.clipboard&&navigator.clipboard.writeText(\\''+esc(commonUrl)+'\\').then(function(){alert(\\'Common link copied\\')})">Copy common link</button></div>';
  h+='<div class="panel"><h3>This branch only (print at site)</h3><p style="color:#b8a0a0;margin-bottom:8px">Locked to <b>'+esc(regBranch)+'</b> — same as the old A-zone poster style.</p>';
  h+='<input readonly value="'+esc(url)+'" onclick="this.select()"><button class="btn btn-sm" onclick="navigator.clipboard&&navigator.clipboard.writeText(\\''+esc(url)+'\\').then(function(){alert(\\'Link copied\\')})">Copy branch link</button></div>';
  h+='<div class="share-grid"><div class="panel"><h3>This-branch QR</h3><img src="'+qr+'" width="260" alt="QR" style="background:#fff;padding:8px;border-radius:8px"><p style="color:#b8a0a0;font-size:13px;margin-top:8px">Print at this site only.</p></div>';
  h+='<div class="panel"><h3>Send to guard</h3><label>Mobile (WhatsApp)</label><input id="shareWa" placeholder="10-digit mobile"><button class="btn btn-sm" onclick="shareLink(\\'whatsapp\\')">Send WhatsApp</button>';
  h+='<label style="margin-top:12px">Email</label><input id="shareEmail" placeholder="email@agilegroup.co.in"><button class="btn btn-sm" onclick="shareLink(\\'email\\')">Send email</button>';
  h+='<button class="btn btn-sm btn-ol" onclick="window.open(\\'https://wa.me/?text='+waText+'\\',\\'_blank\\')">Open WhatsApp (pick contact)</button></div></div>';
  return h;
}
function updateRegSubs(){
  var m=el('regCat')?el('regCat').value:'';
  var sub=el('regSub');if(!sub) return;
  sub.innerHTML='<option value="">— Select —</option>';
  (GUARD_CATS[m]||[]).forEach(function(s){sub.innerHTML+='<option value="'+esc(s)+'">'+esc(s)+'</option>';});
}
function resetControlForm(){
  ['regName','regId','regMob','regNote'].forEach(function(id){var x=el(id);if(x) x.value='';});
  if(el('regCat')) el('regCat').value='';
  updateRegSubs();
  if(el('regMsg')) el('regMsg').style.display='none';
  if(el('regOk')) el('regOk').style.display='none';
}
function submitControlComplaint(){
  var regBranch=regBranchForQr();
  var payload={
    action:'register',
    branch:regBranch,
    guardName:(el('regName')&&el('regName').value||'').trim(),
    idNo:(el('regId')&&el('regId').value||'').trim(),
    mobile:(el('regMob')&&el('regMob').value||'').trim(),
    category:(el('regCat')&&el('regCat').value||''),
    subCategory:(el('regSub')&&el('regSub').value||''),
    complaintNote:(el('regNote')&&el('regNote').value||'').trim()
  };
  var msg=el('regMsg'),ok=el('regOk');
  if(!payload.guardName||!payload.idNo||!payload.mobile){
    if(msg){msg.style.display='block';msg.textContent='Please fill Guard Name, ID No. and Mobile.';}
    return;
  }
  if(!payload.category&&!payload.subCategory&&!payload.complaintNote){
    if(msg){msg.style.display='block';msg.textContent='Select a category or describe the complaint.';}
    return;
  }
  if(msg){msg.style.display='block';msg.className='alert amber';msg.textContent='Submitting…';}
  fetch('/api/guards/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});})
    .then(function(res){
      if(res.s!==200){
        if(msg){msg.style.display='block';msg.className='alert red';msg.textContent=res.j.error||'Could not submit.';}
        return;
      }
      if(msg) msg.style.display='none';
      if(ok){
        ok.style.display='block';
        ok.innerHTML='<b>Complaint registered — '+esc(res.j.code)+'</b><br>'+esc(res.j.message||'')+
          (res.j.complaintId?' <button class="btn btn-sm" style="margin-top:8px" onclick="openCase(\\''+esc(res.j.complaintId)+'\\')">Assign now</button>':'')+
          ' <button class="btn btn-sm btn-ol" style="margin-top:8px" onclick="tab(2)">View received list</button>';
      }
      load(true);
      resetControlForm();
    }).catch(function(){
      if(msg){msg.style.display='block';msg.className='alert red';msg.textContent='Network error. Try again.';}
    });
}
function rReceived(){
  var list=S.complaints.filter(function(c){return c.status!=='solved';});
  var intro='<p style="color:#b8a0a0;margin-bottom:10px"><b>Guard name</b> is in the blue bar on each card. Only live complaints are shown — test / practice entries are removed automatically.</p>';
  var body=useMgmtLayout()
    ? complaintMgmtCards(list,{showActions:canRemind()})
    : complaintRows(list,true,{showRemind:canRemind(),showStatus:canRemind()});
  return searchBar()+'<div class="panel"><h3>Received complaints</h3>'+intro+body+'</div>';
}
function previewDelayedMail(){
  if(!canRemind()){alert('Director / Management only.');return;}
  api({action:'previewDelayedMail'}).then(function(d){
    if(!d.ok||!d.html){alert(d.error||'Could not open draft');return;}
    var w=window.open('','_blank');
    if(!w){alert('Please allow the new window to see the draft.');return;}
    w.document.open();
    w.document.write(d.html);
    w.document.close();
  });
}
function rDelayed(){
  var list=S.complaints.filter(function(c){return c.isDelayed&&c.status!=='solved';});
  var intro='<p style="color:#b8a0a0;margin-bottom:10px">'+(useMgmtLayout()?'Every branch — ':'')+'Past 24 hours. Staff and HOD must be from the <b>same branch</b> as the complaint. Each branch HOD is mailed this list at <b>9:30 AM</b> only (Director is copied). Colour bars show where it is held up.</p>';
  if(canRemind()) intro+='<p style="margin:0 0 12px"><button class="btn" type="button" onclick="previewDelayedMail()">View 9:30 AM mail draft</button></p>';
  var body=useMgmtLayout()
    ? complaintMgmtCards(list,{showActions:canRemind()})
    : complaintRows(list,true,{showRemind:canRemind(),showStatus:canRemind()});
  return searchBar()+'<div class="panel"><h3>Delayed complaints (&gt;24 hours)</h3>'+intro+body+'</div>';
}
function rAnalysis(){
  var a=S.analysis||{},h='<div class="panel"><h3>Root cause analysis</h3>'+pieChartHtml(a.rootCauses||[]);
  h+='<div class="tblwrap" style="margin-top:12px"><table><tr><th>Category</th><th>Count</th><th>Permanent fix</th></tr>';
  (a.rootCauses||[]).forEach(function(r){h+='<tr><td>'+esc(r.cause)+'</td><td>'+r.count+'</td><td>'+esc(r.action)+'</td></tr>';});
  h+='</table></div></div><div class="panel"><h3>Where is the delay?</h3><div class="tblwrap"><table><tr><th>Stage</th><th>Avg hours</th><th>Cases</th></tr>';
  (a.delayPoints||[]).forEach(function(p){h+='<tr><td>'+esc(p.stage)+'</td><td>'+p.avgHours+'h</td><td>'+p.cases+'</td></tr>';});
  h+='</table></div></div><div class="panel"><h3>How to reduce response time</h3><ul class="suggest">';
  (a.reduceResponseTime||[]).forEach(function(s){h+='<li>'+esc(s)+'</li>';});
  h+='</ul><h4 style="margin-top:14px;color:#f87171">Avoid permanently</h4><ul class="suggest">';
  (a.permanentFixes||[]).forEach(function(s){h+='<li>'+esc(s)+'</li>';});
  return h+'</ul></div>';
}
function rDelayedA(){
  var d=S.delayed,h='<div class="panel"><h3>Delayed complaint analysis</h3><p style="color:#b8a0a0">Who delayed · how to respond better · appreciation email on completion.</p>';
  h+='<div class="tblwrap"><table><tr><th>Person</th><th>Department</th><th>Cases</th><th>Avg hours</th><th>Tip</th></tr>';
  (d.byPerson||[]).forEach(function(x){h+='<tr><td>'+esc(x.name)+'</td><td>'+esc(x.department)+'</td><td>'+x.count+'</td><td>'+x.avgHours+'h</td><td>'+esc(x.tip)+'</td></tr>';});
  h+='</table></div></div>'+searchBar()+(useMgmtLayout()?complaintMgmtCards(d.cases||[],{showActions:canRemind()}):complaintRows(d.cases||[],true,{showRemind:true}));
  return h;
}
function rComms(){
  if(!isDemoMode()&&!S.commsLoaded&&!S.commsLoading){
    S.commsLoading=true;
    el('content').innerHTML=pageIntro()+'<p style="color:#b8a0a0;padding:12px">Loading messages…</p>';
    api({action:'loadComms',branchId:S.branchFilter||''}).then(function(d){
      S.commsLoading=false;
      if(d.ok){S.comms=(d.communications||[]).slice();S.commsLoaded=true;}
      render();
    }).catch(function(){S.commsLoading=false;el('content').innerHTML=pageIntro()+'<p style="color:#f87171">Could not load messages.</p>';});
    return '';
  }
  var list=S.comms.slice().sort(function(a,b){return String(b.sentAt).localeCompare(String(a.sentAt));});
  if(S.search) list=list.filter(function(c){var s=S.search.replace(/\\D/g,'');return !s||String(c.sentTo||'').replace(/\\D/g,'').indexOf(s)>=0||String(c.code||'').indexOf(S.search)>=0;});
  if(!list.length) return searchBar()+'<p style="color:#b8a0a0">No communications yet.</p>';
  var h=searchBar()+'<div class="tblwrap"><table><tr><th>Code</th><th>Type</th><th>Channel</th><th>Sent to</th><th>Date</th><th>Subject</th></tr>';
  list.forEach(function(c){h+='<tr><td><b>'+esc(c.code)+'</b></td><td>'+esc(c.type)+'</td><td>'+esc(c.channel)+'</td><td>'+esc(c.sentTo)+'</td><td>'+esc((c.sentAt||'').slice(0,16))+'</td><td>'+esc(c.subject)+'</td></tr>';});
  return h+'</table></div>';
}
function rFeedback(){
  if(S.isManagement) return rFeedbackAnalysis();
  var solved=S.complaints.filter(function(c){return c.status==='solved';});
  var fbIds={};(S.feedback||[]).forEach(function(f){fbIds[f.complaintId]=1;});
  var pending=solved.filter(function(c){return !fbIds[c.id];});
  var preview=solved[0]||null;
  var h='';
  if(preview){
    var fbUrl='https://www.agilegroup-digital.co.in/guards/feedback?code='+encodeURIComponent(preview.code);
    h+='<div class="panel"><h3>Preview — feedback form (what guard sees)</h3><p style="color:#b8a0a0;margin-bottom:10px">After a complaint is solved, the guard gets this link by WhatsApp or email. Tap below to review the form.</p>';
    h+='<p><b>Link for '+esc(preview.code)+':</b><br><input readonly value="'+esc(fbUrl)+'" onclick="this.select()" style="margin:8px 0"><br>';
    h+='<button class="btn btn-sm" onclick="window.open(\\''+esc(fbUrl)+'\\',\\'_blank\\')">Open feedback form →</button> ';
    h+='<button class="btn btn-sm btn-ol" onclick="navigator.clipboard&&navigator.clipboard.writeText(\\''+esc(fbUrl)+'\\').then(function(){alert(\\'Link copied\\')})">Copy link</button></p></div>';
  }
  h+='<div class="panel"><h3>Feedback — send to complainants</h3><p style="color:#b8a0a0">After a complaint is solved, send the satisfaction form (1–5 stars) by WhatsApp or email.</p>';
  h+='<button class="btn btn-sm" onclick="sendFeedbackBulk(\\'whatsapp\\')">Send to all pending (WhatsApp)</button> ';
  h+='<button class="btn btn-sm btn-ol" onclick="sendFeedbackBulk(\\'email\\')">Send to all pending (Email)</button></div>';
  if(!pending.length) return h+'<p style="color:#b8a0a0;margin-top:12px">All solved complainants have been sent feedback forms (or none solved yet).</p>';
  h+='<div class="tblwrap"><table><tr><th>Code</th><th>Guard</th><th>Mobile</th><th></th></tr>';
  pending.forEach(function(c){
    h+='<tr><td><b>'+esc(c.code)+'</b></td><td>'+esc(c.guardName)+'</td><td>'+esc(c.mobile)+'</td><td>';
    h+='<button class="btn btn-sm btn-ol" onclick="sendFeedbackOne(\\''+esc(c.id)+'\\',\\'whatsapp\\')">WhatsApp</button> ';
    h+='<button class="btn btn-sm btn-ol" onclick="sendFeedbackOne(\\''+esc(c.id)+'\\',\\'email\\')">Email</button></td></tr>';
  });
  return h+'</table></div>';
}
function rFeedbackAnalysis(){
  var fs=S.feedbackSummary||{},h='<div class="panel"><h3>Guard satisfaction — average</h3>';
  h+='<div class="kgrid"><div class="kpi"><b>'+(fs.avgRating||0)+'</b><span>Average rating (out of 5)</span></div>';
  h+='<div class="kpi"><b>'+(fs.total||0)+'</b><span>Responses received</span></div></div>';
  if((fs.byRating||{})[5]!==undefined){
    h+='<p style="margin-top:10px;color:#b8a0a0">5★: '+(fs.byRating[5]||0)+' · 4★: '+(fs.byRating[4]||0)+' · 3★: '+(fs.byRating[3]||0)+' · 2★: '+(fs.byRating[2]||0)+' · 1★: '+(fs.byRating[1]||0)+'</p>';
  }
  h+='</div>';
  if((fs.byBranch||[]).length){
    h+='<div class="panel"><h3>Satisfaction by branch</h3><div class="tblwrap"><table><tr><th>Branch</th><th>Responses</th><th>Avg rating</th></tr>';
    fs.byBranch.forEach(function(b){h+='<tr><td>'+esc(b.branchName||branchLabel(b.branchId))+'</td><td>'+b.count+'</td><td>'+b.avgRating+' ★</td></tr>';});
    h+='</table></div></div>';
  }
  var list=(S.feedback||[]).slice().sort(function(a,b){return String(b.submittedAt).localeCompare(String(a.submittedAt));});
  if(list.length){
    h+='<div class="panel"><h3>Recent feedback</h3><div class="tblwrap"><table><tr><th>Code</th><th>Guard</th><th>ID No.</th><th>Category</th><th>Branch</th><th>Rating</th><th>Comment</th><th>Date</th></tr>';
    list.slice(0,30).forEach(function(f){
      h+='<tr><td>'+esc(f.code)+'</td><td>'+esc(f.guardName)+'</td><td>'+esc(f.idNo||'—')+'</td><td>'+esc(f.category||'—')+'</td><td>'+esc(branchLabel(f.branchId,f))+'</td><td>'+f.rating+' ★</td><td>'+esc(f.comment)+'</td><td>'+esc(fmtIstDateTime(f.submittedAt))+'</td></tr>';
    });
    h+='</table></div></div>';
  } else h+='<p style="color:#b8a0a0">No feedback responses yet. Send forms from HOD Feedback menu.</p>';
  return h;
}
function rOps(){
  var branchCol=S.isManagement?'<th>Branch</th>':'';
  var h='<div class="panel"><h3>Operations staff</h3><p style="color:#b8a0a0">'+(S.isManagement?'Add Operations staff per branch. Assign dropdown shows only that branch’s Ops (never another city).':'Add Bangalore Operations staff here — used only for Bangalore complaints.')+'</p><button class="btn btn-sm" onclick="editOps(null)">+ Add staff</button></div><div class="tblwrap"><table><tr>'+branchCol+'<th>Name</th><th>Mobile</th><th>Email</th><th>Active</th><th></th></tr>';
  S.ops.forEach(function(o){h+='<tr>';if(S.isManagement) h+='<td>'+esc(o.branchName||branchLabel(o.branchId,o))+'</td>';h+='<td>'+esc(o.name)+'</td><td>'+esc(o.mobile)+'</td><td>'+esc(o.email)+'</td><td>'+(o.active?'<span class="badge ok">Yes</span>':'No')+'</td><td><button class="btn btn-sm btn-ol" onclick="editOps(\\''+esc(o.id)+'\\')">Edit</button></td></tr>';});
  return h+'</table></div><div id="staffForm"></div>';
}
function rDept(){
  var branchCol=S.isManagement?'<th>Branch</th>':'';
  var h='<div class="panel"><h3>Department staff</h3><p style="color:#b8a0a0">Same department list for all branches. Used when assigning complaints.</p><button class="btn btn-sm" onclick="editDept(null)">+ Add department staff</button></div><div class="tblwrap"><table><tr>'+branchCol+'<th>Department</th><th>Name</th><th>Email</th><th>Mobile</th><th></th></tr>';
  S.dept.forEach(function(o){h+='<tr>';if(S.isManagement) h+='<td>'+esc(o.branchName||branchLabel(o.branchId,o))+'</td>';h+='<td>'+esc(o.department)+'</td><td>'+esc(o.name)+'</td><td>'+esc(o.email)+'</td><td>'+esc(o.mobile)+'</td><td><button class="btn btn-sm btn-ol" onclick="editDept(\\''+esc(o.id)+'\\')">Edit</button></td></tr>';});
  return h+'</table></div><div id="staffForm"></div>';
}
function openCase(id){
  if(!id){alert('Could not open this complaint.');return;}
  S.selected=id;
  if(el('content')) el('content').innerHTML='<p style="color:#94a3b8;padding:20px">Opening complaint…</p>';
  api({action:'caseDetail',complaintId:id}).then(function(d){
    if(!d.ok||!d.complaint){alert(d.error||'Could not open complaint');S.selected=null;S.caseDetail=null;render();return;}
    S.caseDetail=d;
    // Always refresh lists from this case (Ops = branch-only; Dept = company-wide)
    if(!S.liveData) S.liveData={};
    if(Array.isArray(d.opsStaff)){
      S.liveData.opsStaff=d.opsStaff;
      S.ops=d.opsStaff.slice();
    }
    if(Array.isArray(d.deptStaff)){
      S.liveData.deptStaff=d.deptStaff;
      S.dept=d.deptStaff.slice();
    }
    renderCase();
  }).catch(function(e){
    alert((e&&e.message)||'Could not open complaint');
    S.selected=null;S.caseDetail=null;render();
  });
}
function renderCase(){
  var d=S.caseDetail,c=d.complaint;
  el('pageTitle').textContent='Case '+c.code;
  var h='<button class="btn btn-sm btn-ol" onclick="S.selected=null;S.caseDetail=null;render()">← Back</button>';
  h+='<div class="panel" style="margin-top:12px"><h3>'+esc(c.guardName)+' · '+esc(c.code)+'</h3>';
  if(S.isManagement) h+='<p><b>Branch:</b> '+esc(branchLabel(c.branchId,c))+'</p>';
  h+='<p>Received: <b>'+esc(c.registeredAtLabel||fmtIstDateTime(c.registeredAt))+'</b> (India time)</p>';
  h+='<p>ID: '+esc(c.idNo)+' · Mobile: '+esc(c.mobile)+' · '+displayStatus(c)+'</p>';
  h+='<p><b>'+esc(c.category)+'</b> — '+esc(c.subCategory)+'</p><p>'+esc(c.complaintNote)+'</p>';
  h+='<p>Ops: <b>'+esc(c.opsStaffName||'Unassigned')+'</b> · Dept: <b>'+esc(c.deptStaffName||c.department||'—')+'</b></p>';
  h+='<p>Assigned by: '+esc(c.assignedBy||'—')+'</p>'+clockHtml(c);
  h+='<p style="margin-top:8px"><b>24-hour SLA:</b></p><div class="sla-bar"><div class="sla-fill" style="width:'+slaPct(c)+'%"></div></div></div>';

  if(S.canAssign&&c.status!=='solved'){
    var opsPick=staffForBranch('ops',c.branchId);
    var deptPick=staffForBranch('dept',c.branchId);
    // Ops from caseDetail are already branch-scoped; Dept is company-wide
    if((!opsPick||!opsPick.length)&&d.opsStaff&&d.opsStaff.length){
      opsPick=d.opsStaff.filter(function(x){return x.active!==false&&branchIdsMatch(x.branchId,c.branchId);});
    }
    if((!deptPick||!deptPick.length)&&d.deptStaff&&d.deptStaff.length) deptPick=d.deptStaff.filter(function(x){return x.active!==false;});
    h+='<div class="panel"><h3>Assign (HOD / Operation Manager / Department)</h3>';
    if(opsPick.length){
      h+='<label>HOD / Operation Manager ('+esc(branchLabel(c.branchId,c))+' only)</label><select class="m-inp" id="asOps" style="width:100%;margin-bottom:10px"><option value="">— Select HOD or Operation Manager —</option>';
      opsPick.forEach(function(o){h+='<option value="'+esc(o.id)+'"'+(o.id===c.opsStaffId?' selected':'')+'>'+esc(staffRoleLabel(o))+' — '+esc(o.name)+(o.email?' ('+esc(o.email)+')':'')+'</option>';});
      h+='</select>';
    }else{
      h+='<input type="hidden" id="asOps" value="">';
      h+='<div style="margin:10px 0;padding:12px;border:1px solid #b45309;border-radius:10px;background:#1a1200">';
      h+='<b style="color:#fde68a">'+esc(branchLabel(c.branchId,c))+' has no HOD or Operation Manager in User Management — type one below</b>';
      h+='<p class="hint" style="margin-top:6px;color:#cbd5e1">One tap adds the name and assigns this complaint.</p>';
      h+='<label>Operations staff name *</label><input id="quickOpsName" placeholder="Type name here" style="width:100%;margin-bottom:8px">';
      h+='<label>Mobile</label><input id="quickOpsMobile" placeholder="10-digit mobile" style="width:100%;margin-bottom:8px">';
      h+='<label>Email</label><input id="quickOpsEmail" placeholder="name@agilegroup.co.in" style="width:100%;margin-bottom:8px">';
      h+='<button type="button" class="btn btn-sm gold" onclick="quickAddOpsThenAssign()">Save name and assign</button></div>';
    }
    if(deptPick.length){
      h+='<label>Department staff (same for all branches)</label><select class="m-inp" id="asDept" style="width:100%;margin-bottom:10px"><option value="">— Select department staff —</option>';
      deptPick.forEach(function(o){h+='<option value="'+esc(o.id)+'"'+(o.id===c.deptStaffId?' selected':'')+'>'+esc(o.department||'Dept')+' — '+esc(o.name)+(o.email?' ('+esc(o.email)+')':'')+'</option>';});
      h+='</select>';
    }else{
      h+='<input type="hidden" id="asDept" value="">';
      h+='<div style="margin:10px 0;padding:12px;border:1px solid #1d4ed8;border-radius:10px;background:#0b1220">';
      h+='<b style="color:#93c5fd">No Department names yet — type one below (optional)</b>';
      h+='<label>Department</label><input id="quickDeptDept" value="Operations" style="width:100%;margin-bottom:8px">';
      h+='<label>Name</label><input id="quickDeptName" placeholder="Department staff name" style="width:100%;margin-bottom:8px">';
      h+='<label>Email</label><input id="quickDeptEmail" placeholder="name@agilegroup.co.in" style="width:100%;margin-bottom:8px">';
      h+='<label>Mobile</label><input id="quickDeptMobile" placeholder="10-digit mobile" style="width:100%;margin-bottom:8px">';
      h+='<button type="button" class="btn btn-sm" onclick="quickAddDeptThenAssign()">Save Dept name and assign</button></div>';
    }
    h+='<label>Or department email</label><input id="asDeptEmail" value="'+esc(c.deptStaffEmail||'')+'" placeholder="finance@agilegroup.co.in" style="width:100%">';
    if(opsPick.length||deptPick.length){
      h+='<button type="button" class="btn btn-sm gold" style="margin-top:12px" onclick="assignCase()">Save assignment</button>';
    }
    h+='</div>';
  }
  if(c.status!=='solved'){
    h+='<div class="panel"><h3>Completion report — Operations</h3><textarea id="opsRes" rows="2" placeholder="What was done?">'+esc(c.opsResolution||'')+'</textarea><label>Assurance to avoid repeat</label><textarea id="assurance" rows="2" placeholder="We will make all necessary corrections…">'+esc(c.assuranceNote||'')+'</textarea><button type="button" class="btn btn-sm" onclick="submitOps()">Submit ops report</button></div>';
    h+='<div class="panel"><h3>Completion report — Department</h3><textarea id="deptRes" rows="2" placeholder="Department action taken">'+esc(c.deptResolution||'')+'</textarea><button type="button" class="btn btn-sm" onclick="submitDept()">Submit dept report</button></div>';
    h+='<div class="panel"><h3>Send completion letter to guard</h3><p style="color:#b8a0a0;font-size:13px">Includes resolution message <b>and feedback form link</b> (1–5 stars). Subject: Update on your issue : Resolved '+esc(c.code)+'</p><button type="button" class="btn btn-sm btn-ol" onclick="previewComplete()">Preview</button><button type="button" class="btn btn-sm" onclick="sendComplete(\\'whatsapp\\')">WhatsApp</button><button type="button" class="btn btn-sm" onclick="sendComplete(\\'email\\')">Email</button></div>';
  }
  if(c.opsResolution) h+='<div class="panel"><h3>Ops report</h3><p>'+esc(c.opsResolution)+'</p></div>';
  if(c.deptResolution) h+='<div class="panel"><h3>Dept report</h3><p>'+esc(c.deptResolution)+'</p></div>';
  h+='<div class="panel"><h3>Timeline</h3><div class="timeline">';
  (d.events||[]).forEach(function(ev){h+='<div class="tl"><b>'+esc(ev.level)+' — '+esc(ev.action)+'</b><p>'+esc(ev.detail)+'</p><small>'+esc(ev.createdAt)+'</small></div>';});
  h+='</div></div>';
  if(canDeleteComplaint()) h+='<div class="panel" style="margin-top:12px;border-color:#7f1d1d"><h3 style="color:#f87171">Remove this complaint</h3><p style="color:#b8a0a0;font-size:13px">Permanently deletes this complaint. Use only for a genuine mistake — test entries are already removed automatically.</p>'+deleteComplaintBtn(c,false)+'</div>';
  el('content').innerHTML=h;
}
function assignCase(){
  if(!S.caseDetail||!S.caseDetail.complaint){alert('Open the complaint first.');return;}
  var opsId=el('asOps')?el('asOps').value:'';
  var deptId=el('asDept')?el('asDept').value:'';
  var deptEmail=el('asDeptEmail')?String(el('asDeptEmail').value||'').trim():'';
  if(!opsId&&!deptId&&deptEmail.indexOf('@')<0){
    alert('Select HOD / Operation Manager or Department staff, then Save assignment.');
    return;
  }
  api({action:'assignComplaint',complaintId:S.caseDetail.complaint.id,opsStaffId:opsId,deptStaffId:deptId,deptStaffEmail:deptEmail}).then(function(d){
    if(d.ok){alert('Assignment saved.');openCase(S.selected);}
    else alert(d.error||'Could not save assignment');
  }).catch(function(e){alert((e&&e.message)||'Could not save assignment');});
}
function quickAddOpsThenAssign(){
  var name=(el('quickOpsName')&&el('quickOpsName').value||'').trim();
  if(!name){alert('Enter Operations staff name.');return;}
  var branchId=S.branchId||(S.caseDetail&&S.caseDetail.complaint&&S.caseDetail.complaint.branchId)||'';
  var complaintId=S.caseDetail.complaint.id;
  var deptEmail=(el('asDeptEmail')&&el('asDeptEmail').value)||'';
  var deptId=(el('asDept')&&el('asDept').value)||'';
  api({action:'saveOps',id:'',branchId:branchId,name:name,mobile:(el('quickOpsMobile')&&el('quickOpsMobile').value)||'',email:(el('quickOpsEmail')&&el('quickOpsEmail').value)||'',whatsApp:(el('quickOpsMobile')&&el('quickOpsMobile').value)||'',active:true}).then(function(d){
    if(!d.ok||!d.staff||!d.staff.id){alert(d.error||'Could not save Ops staff');return;}
    return api({action:'assignComplaint',complaintId:complaintId,opsStaffId:d.staff.id,deptStaffId:deptId,deptStaffEmail:deptEmail}).then(function(a){
      if(!a.ok){alert(a.error||'Name saved, but assignment failed. Open the case again and pick the name.');openCase(S.selected);return;}
      alert('Assigned to '+name+'.');
      openCase(S.selected);
    });
  });
}
function quickAddDeptThenAssign(){
  var name=(el('quickDeptName')&&el('quickDeptName').value||'').trim();
  var dept=(el('quickDeptDept')&&el('quickDeptDept').value||'').trim()||'Operations';
  if(!name){alert('Enter Department staff name.');return;}
  var branchId=S.branchId||(S.caseDetail&&S.caseDetail.complaint&&S.caseDetail.complaint.branchId)||'';
  var complaintId=S.caseDetail.complaint.id;
  var opsId=(el('asOps')&&el('asOps').value)||'';
  var deptEmail=(el('quickDeptEmail')&&el('quickDeptEmail').value)||(el('asDeptEmail')&&el('asDeptEmail').value)||'';
  api({action:'saveDept',id:'',branchId:branchId,department:dept,name:name,email:(el('quickDeptEmail')&&el('quickDeptEmail').value)||'',mobile:(el('quickDeptMobile')&&el('quickDeptMobile').value)||'',active:true}).then(function(d){
    if(!d.ok||!d.staff||!d.staff.id){alert(d.error||'Could not save Department staff');return;}
    return api({action:'assignComplaint',complaintId:complaintId,opsStaffId:opsId,deptStaffId:d.staff.id,deptStaffEmail:deptEmail}).then(function(a){
      if(!a.ok){alert(a.error||'Name saved, but assignment failed. Open the case again.');openCase(S.selected);return;}
      alert('Department assigned to '+name+'.');
      openCase(S.selected);
    });
  });
}
function submitOps(){
  if(!S.caseDetail||!S.caseDetail.complaint){alert('Open the complaint first.');return;}
  var note=el('opsRes')?String(el('opsRes').value||'').trim():'';
  if(!note){alert('Write what Operations did, then tap Submit ops report.');if(el('opsRes'))el('opsRes').focus();return;}
  var assurance=el('assurance')?el('assurance').value:'';
  api({action:'opsResolve',complaintId:S.caseDetail.complaint.id,opsResolution:note,assuranceNote:assurance}).then(function(d){
    if(d.ok){alert('Ops report saved.');openCase(S.selected);}
    else alert(d.error||'Could not save ops report');
  }).catch(function(e){alert((e&&e.message)||'Could not save ops report');});
}
function submitDept(){
  if(!S.caseDetail||!S.caseDetail.complaint){alert('Open the complaint first.');return;}
  var note=el('deptRes')?String(el('deptRes').value||'').trim():'';
  if(!note){alert('Write the Department action, then tap Submit dept report.');if(el('deptRes'))el('deptRes').focus();return;}
  var assurance=el('assurance')?el('assurance').value:'';
  api({action:'deptResolve',complaintId:S.caseDetail.complaint.id,deptResolution:note,assuranceNote:assurance}).then(function(d){
    if(d.ok){alert('Dept report saved.');openCase(S.selected);}
    else alert(d.error||'Could not save dept report');
  }).catch(function(e){alert((e&&e.message)||'Could not save dept report');});
}
function previewComplete(){
  if(!S.caseDetail||!S.caseDetail.complaint){alert('Open the complaint first.');return;}
  var assurance=el('assurance')?el('assurance').value:'';
  api({action:'previewCompletion',complaintId:S.caseDetail.complaint.id,assuranceNote:assurance}).then(function(d){
    if(!d.ok||!d.html){alert(d.error||'Could not open preview');return;}
    var w=window.open('','_blank');
    if(!w){alert('Please allow the new window to see the letter.');return;}
    w.document.open();
    w.document.write(d.html);
    w.document.close();
  }).catch(function(e){alert((e&&e.message)||'Could not open preview');});
}
function sendComplete(ch){
  if(!S.caseDetail||!S.caseDetail.complaint){alert('Open the complaint first.');return;}
  var assurance=el('assurance')?el('assurance').value:'';
  api({action:'sendCompletion',complaintId:S.caseDetail.complaint.id,channel:ch,assuranceNote:assurance}).then(function(d){
    if(d.ok){alert('Completion letter sent via '+ch);load(true);}
    else alert(d.error||'Could not send');
  }).catch(function(e){alert((e&&e.message)||'Could not send');});
}
function quickComplete(id){
  S.selected=id;
  openCase(id);
}
function shareLink(ch){
  var to=ch==='whatsapp'?el('shareWa').value:el('shareEmail').value;
  var url=regUrlForBranch(regBranchForQr());
  api({action:'shareLink',channel:ch,to:to,url:url}).then(function(d){if(d.ok)alert('Sent');else alert(d.error||'Could not send');});
}
function staffBranchField(currentId){
  if(S.isManagement&&(S.branches||[]).length){
    var h='<label>Branch *</label><select id="staffBranch">';
    S.branches.forEach(function(b){h+='<option value="'+esc(b.id)+'"'+(b.id===currentId?' selected':'')+'>'+esc(b.name)+'</option>';});
    return h+'</select>';
  }
  return '';
}
function editOps(id){
  var pool=allStaffList('ops').concat(S.ops);
  var o=null;
  if(id){for(var i=0;i<pool.length;i++){if(pool[i].id===id){o=pool[i];break;}}}
  if(!o) o={branchId:S.branchId||(S.branches[0]&&S.branches[0].id)||'',active:true};
  el('staffForm').innerHTML='<div class="panel"><h3>'+(id?'Edit':'Add')+' operations staff</h3>'+staffBranchField(o.branchId)+'<label>Name *</label><input id="oName" value="'+esc(o.name||'')+'"><label>Mobile</label><input id="oMob" value="'+esc(o.mobile||'')+'"><label>Email</label><input id="oEmail" value="'+esc(o.email||'')+'"><label>WhatsApp</label><input id="oWa" value="'+esc(o.whatsApp||'')+'"><button class="btn btn-sm" onclick="saveOps(\\''+esc(o.id||'')+'\\')">Save</button></div>';
}
function saveOps(id){
  var branchId=S.isManagement?(el('staffBranch')&&el('staffBranch').value):S.branchId;
  api({action:'saveOps',id:id||'',branchId:branchId,name:el('oName').value,mobile:el('oMob').value,email:el('oEmail').value,whatsApp:el('oWa').value,active:true}).then(function(d){if(d.ok){el('staffForm').innerHTML='';load();}else alert(d.error);});
}
function editDept(id){
  var pool=allStaffList('dept').concat(S.dept);
  var o=null;
  if(id){for(var i=0;i<pool.length;i++){if(pool[i].id===id){o=pool[i];break;}}}
  if(!o) o={branchId:S.branchId||(S.branches[0]&&S.branches[0].id)||'',active:true,department:'Operations'};
  el('staffForm').innerHTML='<div class="panel"><h3>'+(id?'Edit':'Add')+' department staff</h3>'+staffBranchField(o.branchId)+'<label>Department *</label><input id="dDept" value="'+esc(o.department||'')+'"><label>Name *</label><input id="dName" value="'+esc(o.name||'')+'"><label>Email</label><input id="dEmail" value="'+esc(o.email||'')+'"><label>Mobile</label><input id="dMob" value="'+esc(o.mobile||'')+'"><button class="btn btn-sm" onclick="saveDept(\\''+esc(o.id||'')+'\\')">Save</button></div>';
}
function saveDept(id){
  var branchId=S.isManagement?(el('staffBranch')&&el('staffBranch').value):S.branchId;
  api({action:'saveDept',id:id||'',branchId:branchId,department:el('dDept').value,name:el('dName').value,email:el('dEmail').value,mobile:el('dMob').value,active:true}).then(function(d){if(d.ok){el('staffForm').innerHTML='';load();}else alert(d.error);});
}
if(otpRestoreSession()) onOtpLogin({email:OTP_EMAIL});
</script>
</body></html>`

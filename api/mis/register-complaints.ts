import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from '../_lib/mis/layout.js'

const MIS_ACTIVE = '/mis-register-complaints'
const MIS_TITLE = 'Guards Complaint'
const GUARDS_CASE_URL = 'https://www.agilegroup-digital.co.in/guards?portal=management'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Guards Complaint</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
.kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:14px}
.kpi{border-radius:12px;padding:16px;border:1px solid #22304f;background:#0e1730;text-align:center}
.kpi b{font-size:28px;color:#93c5fd;display:block}.kpi span{font-size:12px;color:#94a3b8}
.kpi.delayed b{color:#fbbf24}
.case-list{display:flex;flex-direction:column;gap:12px}
.case-card{background:#0b1220;border:1px solid #1e3050;border-radius:12px;padding:14px 16px}
.case-card.mismatch{border-color:#ef4444;background:rgba(127,29,29,.12)}
.case-head{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px}
.branch-pill{background:rgba(59,130,246,.22);color:#93c5fd;padding:4px 10px;border-radius:8px;font-size:12px;font-weight:700}
.guard-title{font-size:18px;font-weight:800;color:#f8fafc;margin:4px 0 2px}
.guard-meta{font-size:12px;color:#94a3b8}
.case-cat{font-size:13px;color:#cbd5e1;margin:8px 0 4px}
.assign-note{display:block;font-size:12px;color:#c4b5fd;margin-top:6px;line-height:1.45}
.assign-note b{color:#e9d5ff}
.badge{display:inline-block;padding:3px 8px;border-radius:8px;font-size:11px;font-weight:700}
.badge.ok{background:rgba(34,197,94,.2);color:#4ade80}.badge.wn{background:rgba(245,158,11,.2);color:#fbbf24}.badge.er{background:rgba(239,68,68,.2);color:#f87171}
.dept-bars{margin:8px 0}
.db-row{display:flex;align-items:center;gap:6px;margin:3px 0;font-size:11px}
.db-label{width:68px;color:#94a3b8;flex-shrink:0}
.db-track{flex:1;height:7px;background:#1e3050;border-radius:99px;overflow:hidden}
.db-fill{height:100%;border-radius:99px}
.db-fill.hod{background:#f59e0b}.db-fill.ops{background:#3b82f6}.db-fill.dept{background:#a855f7}
.db-hrs{width:34px;text-align:right;font-weight:600}
.db-delay{color:#93c5fd;font-size:11px;margin-top:3px}
.sla-overall{margin-top:6px}.sla-overall small{color:#94a3b8;font-size:10px;display:block;margin-bottom:3px}
.sla-bar{height:8px;background:#1e3050;border-radius:99px;overflow:hidden}.sla-fill{height:100%;background:linear-gradient(90deg,#22c55e,#f59e0b,#ef4444)}
.case-actions-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}
.case-foot{margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.case-actions{margin-top:12px;padding-top:12px;border-top:1px solid #1e3050;width:100%}
.case-actions summary{cursor:pointer;color:#93c5fd;font-size:13px;font-weight:600}
.remind-cell label,.status-cell label{font-size:11px;color:#94a3b8;display:block;margin:6px 0 2px}
.remind-cell select,.status-cell select,.status-cell input{width:100%;margin-bottom:4px}
.g-btn{padding:8px 14px;border:none;border-radius:9px;font-weight:700;cursor:pointer;font-size:13px;background:linear-gradient(135deg,#1d4ed8,#1e3a8a);color:#fff}
.g-btn-ol{background:transparent;border:1px solid #334155;color:#94a3b8}
.g-btn-danger{background:transparent;border:1px solid #ef4444;color:#f87171}
${MIS_LAYOUT_CSS}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="m-wrap" id="app">
  <div class="m-card">
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
      <div><label class="m-lbl">Branch</label><select class="m-inp" id="branch" style="min-width:300px" onchange="loadDash()"><option value="all" selected>All Branches</option></select></div>
      <button type="button" class="m-btn m-btn-gold" onclick="loadDash(true)">🔄 Sync from Agile Guards</button>
      <span id="syncMsg" class="hint" style="margin:0"></span>
    </div>
  </div>
  <div id="dashBody"><div class="hint" style="padding:20px">Choose a branch and sync to open the dashboard.</div></div>
</div>
`)}
<script>
${MIS_SESSION_JS}
var BRANCH_LIST=[],OPS=[],DEPT=[],HODS=[],DELAYED=[],OPEN=[],DASH={};
var GUARDS_CASE='${GUARDS_CASE_URL}';
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function esc(s){return a(s);}
function api(action,extra){return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
function branchLabel(c){return c.branchName||c.branchId||'—';}
function displayGuardName(c){return String(c.guardName||'').trim()||'Guard';}
function displayStatus(c){
  if(c.status==='solved') return '<span class="badge ok">Solved</span>';
  if(c.isDelayed) return '<span class="badge er">Delayed Response</span>';
  return '<span class="badge wn">Under process</span>';
}
function hrs(a,b){if(!a||!b)return 0;return Math.max(0,Math.round(((new Date(b).getTime()-new Date(a).getTime())/3600000)*10)/10);}
function stageClocks(c){
  var now=new Date().toISOString(),end=c.solvedAt||now;
  var hod=c.assignedAt?hrs(c.registeredAt,c.assignedAt):hrs(c.registeredAt,now);
  var ops=c.assignedAt?hrs(c.assignedAt,c.opsCompletedAt||end):0;
  var dept=c.deptCompletedAt?hrs(c.opsCompletedAt||c.assignedAt,c.deptCompletedAt):c.assignedAt?hrs(c.opsCompletedAt||c.assignedAt,end):0;
  return {hod:hod,ops:ops,dept:dept};
}
function delayStage(c){
  var clk=stageClocks(c);
  var stages=[{n:'HOD / RM',h:clk.hod},{n:'Operations',h:clk.ops},{n:'Department',h:clk.dept}];
  stages.sort(function(a,b){return b.h-a.h;});
  return stages[0]&&stages[0].h>0?stages[0].n:'Awaiting assignment';
}
function slaPct(c){
  var start=new Date(c.registeredAt).getTime(),end=new Date(c.slaDeadline).getTime();
  if(!start||!end||end<=start)return 0;
  return Math.min(100,Math.max(0,Math.round(((Date.now()-start)/(end-start))*100)));
}
function deptTimeBarsHtml(c){
  var clk=stageClocks(c),mx=Math.max(clk.hod,clk.ops,clk.dept,1);
  function bar(lbl,cls,hrsV){var w=Math.round((hrsV/mx)*100);return '<div class="db-row"><span class="db-label">'+lbl+'</span><div class="db-track"><div class="db-fill '+cls+'" style="width:'+w+'%"></div></div><span class="db-hrs">'+hrsV+'h</span></div>';}
  var html='<div class="dept-bars">'+bar('HOD','hod',clk.hod)+bar('Ops','ops',clk.ops)+bar('Dept','dept',clk.dept);
  html+='<div class="db-delay">Delayed at: <b>'+h(delayStage(c))+'</b></div></div>';
  html+='<div class="sla-overall"><small>Overall 24-hour clock</small><div class="sla-bar"><div class="sla-fill" style="width:'+slaPct(c)+'%"></div></div></div>';
  return html;
}
function assignedToNote(c){
  var lines=[];
  if(c.opsStaffName&&String(c.opsStaffName).trim()){
    var ops='Mr. '+h(String(c.opsStaffName).trim())+' (Operations)';
    if(c.opsStaffBranchName) ops+=' · '+h(c.opsStaffBranchName);
    lines.push(ops);
  }
  if(c.deptStaffName&&String(c.deptStaffName).trim()){
    var dept='Mr. '+h(String(c.deptStaffName).trim());
    if(c.department) dept+=' — '+h(c.department);
    if(c.deptStaffBranchName) dept+=' · '+h(c.deptStaffBranchName);
    lines.push(dept);
  }
  if(!lines.length){
    if(c.department) return '<span class="assign-note"><b>Assigned to:</b> <span style="color:#fbbf24">Pending — '+h(c.department)+' team ('+h(branchLabel(c))+')</span></span>';
    return '<span class="assign-note"><b>Assigned to:</b> <span style="color:#fbbf24">Not yet assigned — '+h(branchLabel(c))+'</span></span>';
  }
  var html='<span class="assign-note"><b>Assigned to</b> '+lines.join(' · ')+'</span>';
  if(c.assignmentMismatch) html+='<span class="assign-note" style="color:#f87171"><b>Wrong branch!</b> Re-assign using '+h(branchLabel(c))+' staff only.</span>';
  return html;
}
function openGuardsCase(id,focus){
  var url=GUARDS_CASE+'&case='+encodeURIComponent(id)+(focus?'&focus='+encodeURIComponent(focus):'');
  window.open(url,'_blank');
}
function complaintActionsHtml(c){
  return '<div class="case-actions-row">'+
    '<button class="g-btn" type="button" onclick="openGuardsCase(\\''+esc(c.id)+'\\',\\'assign\\')">Assign</button>'+
    '<button class="g-btn g-btn-ol" type="button" onclick="openGuardsCase(\\''+esc(c.id)+'\\',\\'status\\')">View status</button>'+
    displayStatus(c)+
    '</div>';
}
function hodOptionsForBranch(branchId){
  var list=(HODS||[]).filter(function(x){return String(x.branchId||'')===String(branchId||'');});
  var seen={},html='';
  list.forEach(function(hod){
    var em=String(hod.email||'').toLowerCase();
    if(!em||seen[em])return;
    seen[em]=1;
    html+='<option value="'+esc(hod.email)+'">'+h(hod.name)+' — '+h(hod.branchName||branchId)+'</option>';
  });
  return html;
}
function reminderStaffOptions(branchId){
  var html='';
  (OPS||[]).filter(function(o){return String(o.branchId||'')===String(branchId||'');}).forEach(function(o){
    html+='<option value="ops:'+esc(o.id)+'">Ops — '+h(o.name)+(o.email?' ('+h(o.email)+')':'')+'</option>';
  });
  (DEPT||[]).filter(function(d){return String(d.branchId||'')===String(branchId||'');}).forEach(function(d){
    html+='<option value="dept:'+esc(d.id)+'">'+h(d.department)+' — '+h(d.name)+(d.email?' ('+h(d.email)+')':'')+'</option>';
  });
  return html;
}
function reminderCellHtml(c){
  var html='<div class="remind-cell">';
  html+='<label>HOD (select)</label><select id="hod_'+esc(c.id)+'"><option value="">— Select HOD —</option>'+hodOptionsForBranch(c.branchId)+'</select>';
  html+='<button class="g-btn g-btn-ol" type="button" onclick="sendReminder(\\''+esc(c.id)+'\\',\\'hod\\')">Remind HOD</button>';
  html+='<label>Ops / Department (select)</label><select id="rstaff_'+esc(c.id)+'"><option value="">— Select staff —</option>'+reminderStaffOptions(c.branchId)+'</select>';
  html+='<button class="g-btn g-btn-ol" type="button" onclick="sendReminder(\\''+esc(c.id)+'\\',\\'department\\')">Remind staff</button>';
  return html+'</div>';
}
function sendReminder(id,target){
  var body={complaintId:id,target:target||'hod'};
  if(target==='hod'){
    var em=el('hod_'+id)&&el('hod_'+id).value;
    if(!em){alert('Please select HOD from the dropdown first.');return;}
    body.hodEmail=em;
  }else{
    var pick=el('rstaff_'+id)&&el('rstaff_'+id).value;
    if(!pick){alert('Please select Operations or Department staff.');return;}
    if(pick.indexOf('ops:')===0) body.opsStaffId=pick.slice(4);
    else if(pick.indexOf('dept:')===0) body.deptStaffId=pick.slice(5);
  }
  api('sendGuardsReminder',body).then(function(res){
    if(res.status===200) alert('Reminder email sent.');
    else alert(res.body.error||'Could not send');
  });
}
function deleteComplaint(id){
  var c=DELAYED.find(function(x){return x.id===id;})||OPEN.find(function(x){return x.id===id;});
  var code=c?c.code:id;
  if(!confirm('Delete complaint '+code+' permanently?'))return;
  api('deleteGuardsComplaint',{complaintId:id}).then(function(res){
    if(res.status===200){alert('Deleted '+code);loadDash(false);}
    else alert(res.body.error||'Could not delete');
  });
}
function renderCards(list){
  if(!list.length) return '<p class="hint">No delayed open complaints for this selection.</p>';
  var html='<div class="case-list">';
  list.forEach(function(c){
    html+='<div class="case-card'+(c.assignmentMismatch?' mismatch':'')+'">';
    html+='<div class="guard-title">'+h(displayGuardName(c))+'</div>';
    html+='<div class="guard-meta">ID '+h(c.idNo||'—')+' · Mobile '+h(c.mobile||'—')+(c.email?' · Email '+h(c.email):'')+'</div>';
    html+='<div class="case-head"><span class="branch-pill">'+h(branchLabel(c))+'</span>';
    html+='<span style="font-weight:700;color:#93c5fd">'+h(c.code)+'</span>';
    html+='<small style="color:#94a3b8">'+h(c.registeredAtLabel||String(c.registeredAt||'').slice(0,16))+'</small>';
    html+='<span style="margin-left:auto">'+displayStatus(c)+'</span></div>';
    html+='<div class="case-cat">'+h(c.category)+' — '+h(c.subCategory)+'</div>';
    html+=assignedToNote(c);
    html+='<div style="margin-top:10px">'+deptTimeBarsHtml(c)+'</div>';
    html+=complaintActionsHtml(c);
    html+='<div class="case-foot">';
    html+='<button class="g-btn g-btn-danger" type="button" onclick="deleteComplaint(\\''+esc(c.id)+'\\')">Delete</button>';
    html+='<details class="case-actions"><summary>Remind / Inform status</summary>';
    html+='<div style="margin-top:10px">'+reminderCellHtml(c)+'</div></details>';
    html+='</div></div>';
  });
  return html+'</div>';
}
function renderDash(){
  var openCount=(OPEN||[]).length;
  var delayedCount=(DELAYED||[]).length;
  var html='<div class="kgrid">';
  html+='<div class="kpi"><b>'+openCount+'</b><span>Open Complaints</span></div>';
  html+='<div class="kpi delayed"><b>'+delayedCount+'</b><span>Delayed &gt;24 hrs</span></div>';
  html+='</div>';
  html+='<div class="m-card"><h4 style="color:#fde68a;margin-bottom:10px">Open Complaints (Delayed &gt;24 hrs)</h4>';
  html+='<p class="hint" style="margin-bottom:12px">Same layout and controls as Agile Guards Received / Delayed complaints. Assign and View status open the full case in Agile Guards.</p>';
  html+=renderCards(DELAYED);
  html+='</div>';
  el('dashBody').innerHTML=html;
}
function loadDash(doSync){
  var bid=el('branch').value||'all';
  el('syncMsg').textContent=doSync!==false?'Syncing…':'Loading…';
  api('loadGuardsComplaintDashboard',{branchId:bid,sync:doSync!==false}).then(function(res){
    el('syncMsg').textContent=res.status===200?'Done':'Could not load';
    if(res.status!==200){el('dashBody').innerHTML='<div class="hint" style="color:#f87171">'+(res.body.error||'Could not load dashboard')+'</div>';return;}
    DASH=res.body.dashboard||{};
    OPEN=res.body.open||[];
    DELAYED=res.body.delayed||[];
    OPS=res.body.opsStaff||[];
    DEPT=res.body.deptStaff||[];
    HODS=res.body.hodContacts||[];
    if((res.body.branches||[]).length){
      BRANCH_LIST=res.body.branches.slice().sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''));});
      var cur=el('branch').value||'all';
      el('branch').innerHTML='<option value="all">All Branches</option>'+BRANCH_LIST.map(function(b){return '<option value="'+a(b.id)+'">'+h(b.name)+'</option>';}).join('');
      el('branch').value=cur;
    }
    renderDash();
  }).catch(function(){el('syncMsg').textContent='Network error';});
}
function initPage(){
  api('login').then(function(res){
    if(res.status!==200)return;
    BRANCH_LIST=(res.body.branches||[]).filter(function(b){return b&&b.id;})
      .sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''));});
    el('branch').innerHTML='<option value="all" selected>All Branches</option>'+
      BRANCH_LIST.map(function(b){return '<option value="'+a(b.id)+'">'+h(b.name)+(b.active===false?' (inactive)':'')+'</option>';}).join('');
    loadDash(true);
  });
}
misStart();
</script>
</body></html>`

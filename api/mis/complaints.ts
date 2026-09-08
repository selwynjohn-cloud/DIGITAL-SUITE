import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from '../_lib/mis/layout.js'

const MIS_ACTIVE = '/mis-complaints'
const MIS_TITLE = 'Client Complaints'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Client Complaints</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
.m-kpi-dark{background:#0e1730;border:1px solid #22304f;border-radius:12px;padding:14px 16px;text-align:center}
.m-kpi-dark b{color:#c9a84c;font-size:24px;display:block}.m-kpi-dark span{font-size:12px;color:#94a3b8}
.mail-sync-banner{display:flex;gap:14px;flex-wrap:wrap;align-items:center;justify-content:space-between;padding:16px 18px;border-radius:12px;border:1px solid #3b82f6;background:linear-gradient(135deg,rgba(29,78,216,.28),rgba(14,23,48,.95));cursor:pointer;margin-bottom:14px}
.mail-sync-banner:hover{border-color:#93c5fd}
.mail-sync-banner b{color:#fde68a;font-size:16px;display:block}
.mail-sync-banner p{color:#cbd5e1;font-size:13px;line-height:1.45;margin-top:4px;max-width:720px}
.mail-sync-banner .sync-btn{background:#c9a84c;color:#14224f;border:none;border-radius:9px;padding:12px 18px;font-weight:800;cursor:pointer;font-size:14px}
.mtbl td,.mtbl th{font-size:14px;line-height:1.45;vertical-align:top}
.mtbl td input,.mtbl td select,.mtbl td textarea{font-size:14px;line-height:1.4;min-height:36px}
.cmp-read{white-space:pre-wrap;color:#e2e8f0;font-size:14px;line-height:1.5;max-width:260px}
.cmp-link{color:#93c5fd;font-weight:700;cursor:pointer;text-decoration:underline;background:none;border:none;font-size:14px;padding:0;text-align:left}
.cmp-link:hover{color:#fde68a}
.nature-cell{color:#fde68a;font-weight:700;max-width:220px;white-space:pre-wrap;line-height:1.4}
.nature-link{color:#fde68a;font-weight:700;cursor:pointer;text-decoration:underline;background:none;border:none;font-size:14px;text-align:left;padding:0;white-space:pre-wrap;line-height:1.4;max-width:220px}
.nature-link:hover{color:#fff}
.branch-group-row td{background:#14224f;color:#c9a84c;font-weight:900;font-size:14px;padding:10px 12px;border-top:2px solid #c9a84c}
.assignee-cell{color:#4ade80;font-weight:800;white-space:nowrap}
.auto-grow{overflow:hidden;resize:none;min-height:120px}
.timebar-wrap{min-width:120px}
.timebar-wrap small{display:block;color:#94a3b8;font-size:11px;margin-bottom:4px}
.timebar{height:10px;background:#1e3050;border-radius:99px;overflow:hidden}
.timebar>i{display:block;height:100%;background:linear-gradient(90deg,#22c55e,#f59e0b,#ef4444)}
.case-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:9999;align-items:center;justify-content:center;padding:16px}
.case-modal.open{display:flex}
.case-box{background:#0e1730;border:1px solid #334155;border-radius:14px;max-width:640px;width:100%;max-height:92vh;overflow:auto;padding:20px}
.case-box h3{color:#fde68a;margin-bottom:12px;font-size:18px}
.case-box .m-lbl{margin-top:10px}
.case-box pre{white-space:pre-wrap;color:#e2e8f0;font-family:inherit;font-size:15px;line-height:1.55;background:#0b1220;border:1px solid #22304f;border-radius:10px;padding:14px}
.assign-banner{width:100%;margin-top:16px;padding:14px;border:none;border-radius:10px;background:linear-gradient(135deg,#c9a84c,#a8842f);color:#14224f;font-weight:900;font-size:16px;cursor:pointer}
.assign-banner:hover{filter:brightness(1.05)}
.row-actions{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.code-cell{color:#fde68a;font-weight:800;font-size:12px;white-space:nowrap;line-height:1.35}
.m-row-reopened{opacity:.42;filter:grayscale(.35)}
.m-row-reopened .nature-link,.m-row-reopened .cmp-link{color:#94a3b8}
.add-help{color:#94a3b8;font-size:13px;line-height:1.45;margin:12px 0 8px;max-width:900px}
${MIS_LAYOUT_CSS}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="m-wrap" id="app">
  <div class="m-card">
    <div class="hint">Client complaints / incidents from Director mail. Each case gets a code like <b>Agile - TCS-JUL-00042 22/07/2026</b>. <b>Nature</b> = mail subject. Phone / Help desk / Control cases: use <b>+ Add Complaint</b> at the bottom (HOD updates manually).</div>
    <label class="m-lbl" style="max-width:300px">Branch</label>
    <select class="m-inp" id="branch" style="min-width:300px;max-width:360px" onchange="loadBranchComplaints()"></select>
  </div>
  <div class="m-kgrid" id="kpis"></div>

  <div class="mail-sync-banner" onclick="syncMail()">
    <div>
      <b>📧 Mail sync — Director inbox</b>
      <p>Fetch client mails (fire, incident, shortages, theft, left the post, missing, sleeping, accident) from <b>director@agilegroup.co.in</b>.</p>
      <span id="syncMsg" class="hint" style="display:block;margin-top:8px;color:#93c5fd"></span>
    </div>
    <button type="button" class="sync-btn" onclick="event.stopPropagation();syncMail()">Sync mail now</button>
  </div>

  <div class="m-card">
    <h4>Complaints / Incidents</h4>
    <label style="display:flex;align-items:center;gap:6px;margin:0 0 10px;font-size:13px;color:#94a3b8"><input type="checkbox" id="showArchived" onchange="render()"> Show archived</label>
    <div class="mtblwrap"><table class="mtbl">
      <thead><tr id="headRow"></tr></thead>
      <tbody id="rows"></tbody>
    </table></div>
    <p class="add-help">Add complaint — for complaints received over phone by Operations, Help desk or Control. HOD will update all such complaints manually. Code is assigned on Save.</p>
    <div style="margin-top:6px"><button type="button" class="m-btn m-btn-gold" onclick="openAddComplaint()">+ Add Complaint</button></div>
  </div>
</div>
<div class="m-savebar noprint"><div id="saveMsg" class="hint" style="flex-basis:100%;display:none"></div><button class="m-btn m-btn-green" onclick="save()">✅ Save &amp; Publish</button></div>

<div class="case-modal" id="addModal" onclick="if(event.target===this)closeAddComplaint()"><div class="case-box">
  <h3>Add complaint (phone / Help desk / Control)</h3>
  <p class="hint" style="margin-bottom:10px">For cases received by Operations, Help desk or Control — not from Director mail. HOD fills and updates manually.</p>
  <div><label class="m-lbl">Branch *</label><select class="m-inp" id="addBranch"></select></div>
  <div><label class="m-lbl">Received via *</label>
    <select class="m-inp" id="addChannel">
      <option value="Phone">Phone — Operations</option>
      <option value="Help Desk">Help desk</option>
      <option value="Control">Control room</option>
      <option value="Operations">Operations team</option>
    </select>
  </div>
  <div><label class="m-lbl">Client name *</label><input class="m-inp" id="addClient" placeholder="Client name"></div>
  <div><label class="m-lbl">Location</label><input class="m-inp" id="addLoc" placeholder="Site / location"></div>
  <div><label class="m-lbl">Nature / subject *</label><input class="m-inp" id="addNature" placeholder="Short nature of complaint"></div>
  <div><label class="m-lbl">Date &amp; time received *</label><input class="m-inp" id="addWhen" type="datetime-local"></div>
  <div><label class="m-lbl">Reported by</label><input class="m-inp" id="addBy" placeholder="Caller / staff name"></div>
  <div><label class="m-lbl">Details *</label><textarea class="m-inp auto-grow" id="addDesc" rows="4" placeholder="What was reported…" oninput="autoGrow(this)"></textarea></div>
  <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
    <button type="button" class="m-btn m-btn-green" onclick="submitAddComplaint()">Add to list &amp; Save</button>
    <button type="button" class="m-btn m-btn-navy" onclick="closeAddComplaint()">Cancel</button>
  </div>
  <div id="addMsg" class="hint" style="margin-top:8px"></div>
</div></div>

<div class="case-modal" id="assignModal" onclick="if(event.target===this)closeAssign()"><div class="case-box">
  <h3>Assign complaint</h3>
  <input type="hidden" id="asIdx">
  <div><label class="m-lbl">Complaint assigned to (Name) *</label><input class="m-inp" id="asName" placeholder="Staff / HOD name"></div>
  <div><label class="m-lbl">Branch *</label><select class="m-inp" id="asBranch"></select></div>
  <div><label class="m-lbl">Department</label><input class="m-inp" id="asDept" placeholder="e.g. Operations / HOD"></div>
  <div><label class="m-lbl">Client name</label><input class="m-inp" id="asClient" readonly></div>
  <div><label class="m-lbl">Nature of complaint</label><input class="m-inp" id="asNature" readonly></div>
  <div><label class="m-lbl">Date and time of mail</label><input class="m-inp" id="asMailDt" readonly></div>
  <div><label class="m-lbl">EDC — expected date of closure *</label><input class="m-inp" id="asEdc" type="date"></div>
  <div><label class="m-lbl">Assignee email *</label><input class="m-inp" id="asEmail" type="email" placeholder="name@agilegroup.co.in"></div>
  <p class="hint" style="margin-top:10px">Assign sends the mail details to the assignee. <b>CC:</b> Director.</p>
  <button type="button" class="assign-banner" onclick="submitAssign()">Assign — send mail to staff</button>
  <div style="margin-top:10px"><button type="button" class="m-btn m-btn-navy" onclick="closeAssign()">Cancel</button></div>
  <div id="asMsg" class="hint" style="margin-top:8px"></div>
</div></div>

<div class="case-modal" id="planModal" onclick="if(event.target===this)closePlan()"><div class="case-box">
  <h3 id="planTitle">Corrective action plan</h3>
  <input type="hidden" id="planIdx">
  <label class="m-lbl">Text paragraph (assignee input — visible to all when saved)</label>
  <textarea class="m-inp auto-grow" id="planText" rows="4" placeholder="Write the corrective action plan…" oninput="autoGrow(this)"></textarea>
  <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
    <button type="button" class="m-btn m-btn-green" onclick="savePlan()">Save plan</button>
    <button type="button" class="m-btn m-btn-navy" onclick="closePlan()">Close</button>
  </div>
</div></div>

<div class="case-modal" id="avoidModal" onclick="if(event.target===this)closeAvoid()"><div class="case-box">
  <h3>How to avoid reoccurrence</h3>
  <input type="hidden" id="avoidIdx">
  <label class="m-lbl">Action taken — prevention plan</label>
  <textarea class="m-inp auto-grow" id="avoidText" rows="4" placeholder="How will we avoid this happening again?" oninput="autoGrow(this)"></textarea>
  <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
    <button type="button" class="m-btn m-btn-green" onclick="saveAvoid()">Save</button>
    <button type="button" class="m-btn m-btn-navy" onclick="closeAvoid()">Close</button>
  </div>
</div></div>

<div class="case-modal" id="caseModal" onclick="if(event.target===this)closeCase()"><div class="case-box">
  <h3 id="caseTitle">Case</h3>
  <div id="caseMeta" class="hint" style="margin-bottom:10px"></div>
  <pre id="caseBody"></pre>
  <div style="margin-top:14px"><button type="button" class="m-btn m-btn-navy" onclick="closeCase()">Close</button></div>
</div></div>
`)}
<script>
${MIS_SESSION_JS}
ROWS=[],BRANCH_LIST=[],STAFF=[];
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function nid(){return 'cmp'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function isAll(){return el('branch').value==='all';}
function autoGrow(ta){
  if(!ta)return;
  ta.style.height='auto';
  ta.style.height=Math.max(120,ta.scrollHeight)+'px';
}
function branchName(c){
  if(c.branchName)return c.branchName;
  var b=BRANCH_LIST.find(function(x){return x.id===c.branchId;});
  return b?b.name:(c.branchId?c.branchId:'Unassigned');
}
function fillAssignBranchSelect(selectedId){
  var sel=el('asBranch');
  var opts='<option value="">— Select branch —</option>';
  BRANCH_LIST.forEach(function(b){
    opts+='<option value="'+a(b.id)+'"'+(b.id===selectedId?' selected':'')+'>'+h(b.name)+'</option>';
  });
  sel.innerHTML=opts;
  if(selectedId)sel.value=selectedId;
}
function mergeBranches(list){
  var byId={};
  BRANCH_LIST.forEach(function(b){byId[b.id]=b;});
  (list||[]).forEach(function(b){if(b&&b.id&&b.active!==false)byId[b.id]=b;});
  BRANCH_LIST=Object.keys(byId).map(function(k){return byId[k];})
    .filter(function(b){return b.active!==false;})
    .sort(function(x,y){return String(x.name||'').localeCompare(String(y.name||''));});
}
function branchOptionsHtml(includeAll){
  var html=includeAll?'<option value="all">All Branches</option>':'';
  return html+BRANCH_LIST.map(function(b){return '<option value="'+a(b.id)+'">'+h(b.name)+'</option>';}).join('');
}
function api(action,extra){return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
function mailAt(c){return c.mailReceivedAt||c.registeredAt||(c.incidentDate?c.incidentDate+'T00:00:00':'');}
function sortAt(c){return c.reopenedAt||mailAt(c);}
function natureOf(c){
  var channel=String(c.channel||'').toLowerCase();
  var isMail=c.source==='inbox'||channel==='email'||channel==='mail'||!!c.emailId;
  var sub=String(c.subject||'').replace(/\s+/g,' ').trim();
  var nat=String(c.nature||'').replace(/\s+/g,' ').trim();
  if(isMail){
    if(sub)return sub;
    if(nat&&nat!=='—'&&nat!=='-')return nat;
    return 'NIL';
  }
  if(nat)return nat;
  if(sub)return sub;
  return 'NIL';
}
function isFadedReopen(c){return c.reopenLabel==='reopened'||!!c.supersededById;}
function canReopen(c){
  if(!c||isFadedReopen(c))return false;
  if(c.reopenedFromId)return false;
  return c.status==='Closed'||!!c.resolvedOn;
}
function toLocalInput(iso){
  if(!iso){
    var n=new Date();
    n.setMinutes(n.getMinutes()-n.getTimezoneOffset());
    return n.toISOString().slice(0,16);
  }
  try{
    var d=new Date(iso);
    d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
    return d.toISOString().slice(0,16);
  }catch(e){return '';}
}
function fromLocalInput(v){
  if(!v)return new Date().toISOString();
  try{return new Date(v).toISOString();}catch(e){return new Date().toISOString();}
}
function fmtDate(iso){
  if(!iso)return '—';
  try{return new Date(iso).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Kolkata'});}catch(e){return String(iso).slice(0,10);}
}
function fmtTime(iso){
  if(!iso)return '—';
  try{return new Date(iso).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'});}catch(e){return '';}
}
function fmtDateTime(iso){return fmtDate(iso)+' '+fmtTime(iso);}
function elapsedHours(iso){
  if(!iso)return 0;
  var t=new Date(iso).getTime();
  if(!t)return 0;
  return Math.max(0,Math.round(((Date.now()-t)/3600000)*10)/10);
}
function timeBarHtml(c){
  var start=mailAt(c);
  var hrs=elapsedHours(start);
  var pct=Math.min(100,Math.round((hrs/24)*100));
  var label=hrs>=24?(Math.floor(hrs/24)+'d '+(Math.round(hrs%24))+'h'):(hrs+'h');
  return '<div class="timebar-wrap"><small>Since mail · '+label+'</small><div class="timebar"><i style="width:'+pct+'%"></i></div></div>';
}

function syncMail(){
  el('syncMsg').textContent='Fetching client complaints from Director inbox…';
  api('syncClientComplaintMail').then(function(res){
    if(res.status!==200){el('syncMsg').textContent=res.body.error||'Sync failed';return;}
    var b=res.body;
    if(b.skipped&&b.error){el('syncMsg').textContent=b.error;loadBranchComplaints();return;}
    el('syncMsg').textContent='✅ Synced — imported '+(b.imported||0)+' · scanned '+(b.scanned||0)+(b.natureFixed?' · nature fixed '+b.natureFixed:'')+(b.mode?' · via '+b.mode:'');
    loadBranchComplaints();
  }).catch(function(){el('syncMsg').textContent='Network error — try again.';});
}
function loadBranchComplaints(){
  var bid=el('branch').value;if(!bid)return;
  api('loadComplaints',{branchId:bid,syncGuards:false}).then(function(res){
    if(res.status!==200)return;
    ROWS=(res.body.complaints||[]).map(function(c){
      c.active=c.active!==false;
      if(!c.mailReceivedAt&&c.registeredAt)c.mailReceivedAt=c.registeredAt;
      var channel=String(c.channel||'').toLowerCase();
      var isMail=c.source==='inbox'||channel==='email'||channel==='mail'||!!c.emailId;
      var sub=String(c.subject||'').replace(/\s+/g,' ').trim();
      var nat=String(c.nature||'').replace(/\s+/g,' ').trim();
      if(isMail){
        if(sub){c.subject=sub;c.nature=sub;}
        else if(nat&&nat!=='NIL'&&nat!=='—'&&nat!=='-'&&nat.length>20){c.subject=nat;c.nature=nat;}
        else {c.nature=nat&&nat!=='—'&&nat!=='-'?nat:'NIL'; if(!c.subject)c.subject='';}
      }else if(!nat){c.nature='NIL';}
      return c;
    }).filter(function(c){
      var from=String(c.fromEmail||c.reportedBy||'').toLowerCase();
      return from.indexOf('selwyn.john@gmail.com')<0;
    });
    render();
  });
}
function initPage(){
  api('login').then(function(res){
    if(res.status!==200)return;
    mergeBranches(res.body.branches||[]);
    STAFF=(res.body.staff||[]).filter(function(s){return s.active!==false;});
    el('branch').innerHTML=branchOptionsHtml(true);
    el('branch').value='all';
    loadBranchComplaints();
  });
}
function openAddComplaint(){
  var sel=el('addBranch');
  sel.innerHTML='<option value="">— Select branch —</option>'+BRANCH_LIST.map(function(b){return '<option value="'+a(b.id)+'">'+h(b.name)+'</option>';}).join('');
  var cur=el('branch').value;
  if(cur&&cur!=='all')sel.value=cur;
  el('addChannel').value='Phone';
  el('addClient').value='';
  el('addLoc').value='';
  el('addNature').value='';
  el('addWhen').value=toLocalInput('');
  el('addBy').value='';
  el('addDesc').value='';
  el('addMsg').textContent='';
  el('addModal').classList.add('open');
  setTimeout(function(){autoGrow(el('addDesc'));el('addClient').focus();},40);
}
function closeAddComplaint(){el('addModal').classList.remove('open');}
function submitAddComplaint(){
  var branchId=(el('addBranch').value||'').trim();
  var client=(el('addClient').value||'').trim();
  var nature=(el('addNature').value||'').trim();
  var desc=(el('addDesc').value||'').trim();
  var when=fromLocalInput(el('addWhen').value);
  var channel=(el('addChannel').value||'Phone').trim();
  var by=(el('addBy').value||'').trim();
  var loc=(el('addLoc').value||'').trim();
  if(!branchId){el('addMsg').textContent='Please select a branch.';return;}
  if(!client){el('addMsg').textContent='Please enter client name.';return;}
  if(!nature){el('addMsg').textContent='Please enter nature / subject.';return;}
  if(desc.length<5){el('addMsg').textContent='Please enter complaint details.';return;}
  var br=BRANCH_LIST.find(function(b){return b.id===branchId;});
  ROWS.unshift({
    id:nid(),code:'',clientName:client,location:loc,incidentDate:when.slice(0,10),type:'Client',
    nature:nature,channel:channel,description:desc,actionTaken:'',assignedTo:'',assigneeEmail:'',assigneeDept:'',
    edc:'',correctiveActionPlan:'',avoidRecurrence:'',resolvedOn:'',completionReportSentOn:'',momWithin24h:false,
    status:'Open',reportedBy:by||channel,source:'phone',active:true,branchId:branchId,
    branchName:br?br.name:'',mailReceivedAt:when,registeredAt:when
  });
  closeAddComplaint();
  render();
  el('saveMsg').style.display='block';el('saveMsg').style.color='#4ade80';el('saveMsg').textContent='Saving phone complaint — code will be assigned…';
  save();
}
function reopenRow(i){
  var c=ROWS[i];if(!c)return;
  if(isFadedReopen(c)){alert('This complaint is already reopened.');return;}
  if(!canReopen(c)){alert('Reopen is for closed / resolved complaints only.');return;}
  if(!confirm('Reopen this complaint? A full copy will be placed at the top. The old row stays faded as Reopened.'))return;
  var now=new Date().toISOString();
  var copy={
    id:nid(),
    code:'',
    branchId:c.branchId,
    branchName:c.branchName||branchName(c),
    clientName:c.clientName||'',
    location:c.location||'',
    incidentDate:c.incidentDate||now.slice(0,10),
    type:c.type||'Client',
    nature:natureOf(c),
    subject:c.subject||natureOf(c),
    channel:c.channel||'',
    description:c.description||'',
    actionTaken:c.actionTaken||'',
    assignedTo:c.assignedTo||'',
    assigneeEmail:c.assigneeEmail||'',
    assigneeDept:c.assigneeDept||'',
    edc:c.edc||'',
    correctiveActionPlan:c.correctiveActionPlan||'',
    avoidRecurrence:c.avoidRecurrence||'',
    resolvedOn:'',
    completionReportSentOn:'',
    momWithin24h:false,
    status:'Open',
    reportedBy:c.reportedBy||'',
    fromEmail:c.fromEmail||'',
    emailId:c.emailId||'',
    source:c.source||'manual',
    active:true,
    mailReceivedAt:c.mailReceivedAt||mailAt(c)||now,
    registeredAt:now,
    reopenedFromId:c.id,
    reopenedAt:now
  };
  c.reopenLabel='reopened';
  c.supersededById=copy.id;
  c.status='Reopened';
  ROWS.unshift(copy);
  render();
  el('saveMsg').style.display='block';el('saveMsg').style.color='#4ade80';el('saveMsg').textContent='Reopened — saving copy at top…';
  save();
}
function upd(i,f,v){if(!ROWS[i])return;ROWS[i][f]=v;kpi();}
function deleteRow(i){
  if(!confirm('Delete this complaint permanently?'))return;
  var c=ROWS[i],bid=c.branchId||el('branch').value;
  if(!c.id){ROWS.splice(i,1);render();return;}
  api('deleteComplaint',{branchId:bid||'inbox',complaintId:c.id}).then(function(res){
    if(res.status===200){ROWS.splice(i,1);render();}
    else alert(res.body.error||'Could not delete');
  });
}
function openCase(i){
  var c=ROWS[i];if(!c)return;
  el('caseTitle').textContent=(c.code||'Case')+' — '+(c.clientName||'Client');
  el('caseMeta').innerHTML='<b>Nature:</b> '+h(natureOf(c))+' · <b>Received:</b> '+h(fmtDateTime(mailAt(c)))+' · <b>Assignee:</b> '+h(c.assignedTo||'—');
  el('caseBody').textContent=c.description||'(No details)';
  el('caseModal').classList.add('open');
}
function closeCase(){el('caseModal').classList.remove('open');}

/** Open selected mail in a new window (inbox-style view + Gmail when id known). */
function openMailWindow(i){
  var c=ROWS[i];if(!c)return;
  var subj=natureOf(c);
  var from=c.fromEmail||c.reportedBy||'';
  var when=fmtDateTime(mailAt(c));
  var body=c.description||'(No message body)';
  var gmail='';
  if(c.emailId){
    gmail='https://mail.google.com/mail/u/0/#inbox/'+encodeURIComponent(c.emailId);
  }
  var w=window.open('','_blank');
  if(!w){alert('Please allow pop-ups to open the mail.');return;}
  w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+String(subj).replace(/</g,'')+'</title>'+
    '<style>body{font-family:Segoe UI,Arial,sans-serif;background:#0b1220;color:#e2e8f0;margin:0;padding:24px}'+
    '.box{max-width:820px;margin:0 auto;background:#0e1730;border:1px solid #334155;border-radius:14px;padding:22px}'+
    'h1{color:#fde68a;font-size:20px;margin:0 0 12px;line-height:1.35}.meta{color:#94a3b8;font-size:14px;margin-bottom:16px;line-height:1.5}'+
    'pre{white-space:pre-wrap;background:#0b1220;border:1px solid #22304f;border-radius:10px;padding:16px;font:15px/1.55 Segoe UI,Arial,sans-serif;color:#e2e8f0}'+
    'a.btn{display:inline-block;margin-top:14px;padding:10px 16px;background:#c9a84c;color:#14224f;font-weight:800;border-radius:9px;text-decoration:none}</style></head><body>'+
    '<div class="box"><h1></h1><div class="meta"></div><pre></pre><div id="gl"></div></div></body></html>');
  w.document.close();
  w.document.querySelector('h1').textContent=subj;
  w.document.querySelector('.meta').innerHTML='<b>From:</b> '+String(from).replace(/</g,'&lt;')+'<br><b>Received:</b> '+when+
    '<br><b>Client:</b> '+String(c.clientName||'—').replace(/</g,'&lt;')+' · <b>Branch:</b> '+String(branchName(c)).replace(/</g,'&lt;')+
    (c.code?' · <b>Code:</b> '+c.code:'');
  w.document.querySelector('pre').textContent=body;
  if(gmail){
    w.document.getElementById('gl').innerHTML='<a class="btn" href="'+gmail+'" target="_blank" rel="noopener">Open in Director Gmail inbox</a>';
  }
}

function openAssign(i){
  var c=ROWS[i];if(!c)return;
  el('asIdx').value=String(i);
  el('asName').value=c.assignedTo||'';
  fillAssignBranchSelect(c.branchId||'');
  el('asDept').value=c.assigneeDept&&c.assigneeDept!==branchName(c)?c.assigneeDept:'';
  el('asClient').value=c.clientName||'';
  el('asNature').value=natureOf(c);
  el('asMailDt').value=fmtDateTime(mailAt(c));
  el('asEdc').value=c.edc||'';
  el('asEmail').value=c.assigneeEmail||'';
  el('asMsg').textContent='';
  el('assignModal').classList.add('open');
  if(!el('asEmail').value) setTimeout(function(){el('asEmail').focus();},50);
}
function closeAssign(){el('assignModal').classList.remove('open');}
function submitAssign(){
  var i=parseInt(el('asIdx').value,10);
  var c=ROWS[i];if(!c)return;
  var name=(el('asName').value||'').trim();
  var branchId=(el('asBranch').value||'').trim();
  var dept=(el('asDept').value||'').trim();
  var email=(el('asEmail').value||'').trim();
  var edc=(el('asEdc').value||'').trim();
  if(!name){el('asMsg').textContent='Please enter assignee name.';return;}
  if(!branchId){el('asMsg').textContent='Please select a branch.';return;}
  if(!edc){el('asMsg').textContent='Please select EDC (expected date of closure).';return;}
  if(!email||email.indexOf('@')<0){
    el('asMsg').textContent='Email not available — please enter assignee email address.';
    el('asEmail').focus();
    return;
  }
  var br=BRANCH_LIST.find(function(b){return b.id===branchId;});
  var deptLabel=dept||(br?br.name:'');
  el('asMsg').textContent='Sending assignment mail…';
  api('assignComplaintCase',{
    complaintId:c.id,
    branchId:branchId,
    assigneeName:name,
    assigneeEmail:email,
    assigneeDept:deptLabel,
    edc:edc
  }).then(function(res){
    if(res.status!==200){el('asMsg').textContent=res.body.error||'Could not assign';return;}
    if(res.body.complaint){
      ROWS[i]=Object.assign(ROWS[i],res.body.complaint,{branchId:branchId,branchName:br?br.name:branchName(ROWS[i])});
    }else{
      ROWS[i].assignedTo=name;ROWS[i].assigneeEmail=email;ROWS[i].assigneeDept=deptLabel;ROWS[i].edc=edc;ROWS[i].branchId=branchId;if(br)ROWS[i].branchName=br.name;
    }
    el('asMsg').textContent='✅ Assigned — mail sent (CC Director).';
    render();
    setTimeout(closeAssign,900);
  });
}

function openPlan(i){
  var c=ROWS[i];if(!c)return;
  el('planIdx').value=String(i);
  el('planTitle').textContent='Corrective action plan'+(c.assignedTo?' — '+c.assignedTo:'');
  el('planText').value=c.correctiveActionPlan||'';
  el('planModal').classList.add('open');
  setTimeout(function(){autoGrow(el('planText'));},30);
}
function closePlan(){el('planModal').classList.remove('open');}
function savePlan(){
  var i=parseInt(el('planIdx').value,10);
  if(!ROWS[i])return;
  ROWS[i].correctiveActionPlan=(el('planText').value||'').trim();
  closePlan();render();
}

function openAvoid(i){
  var c=ROWS[i];if(!c)return;
  el('avoidIdx').value=String(i);
  el('avoidText').value=c.avoidRecurrence||'';
  el('avoidText').readOnly=!!isFadedReopen(c);
  el('avoidModal').classList.add('open');
  setTimeout(function(){autoGrow(el('avoidText'));},30);
}
function closeAvoid(){el('avoidModal').classList.remove('open');el('avoidText').readOnly=false;}
function saveAvoid(){
  var i=parseInt(el('avoidIdx').value,10);
  if(!ROWS[i])return;
  if(isFadedReopen(ROWS[i])){closeAvoid();return;}
  ROWS[i].avoidRecurrence=(el('avoidText').value||'').trim();
  closeAvoid();render();
}

function submitRow(i){
  var c=ROWS[i];if(!c)return;
  if(!c.assignedTo){alert('Please Assign this complaint first.');return;}
  if(!c.correctiveActionPlan){alert('Please enter Corrective action plan.');openPlan(i);return;}
  if(!c.resolvedOn){alert('Please select Resolved on date.');return;}
  el('saveMsg').style.display='block';el('saveMsg').style.color='#4ade80';el('saveMsg').textContent='Saving row…';
  save();
}

function headHtml(){
  el('headRow').innerHTML=
    '<th>Code</th><th>Client name</th><th>Location</th><th>Date of mail</th><th>Time</th><th>Nature (subject)</th><th>Assign</th><th>Corrective action plan</th><th>Resolved on</th><th>Report sent on</th><th>Complaint reported by</th><th>Time since mail</th><th>Assignee</th><th>Action</th>';
}
function groupedList(show){
  var list=ROWS.map(function(c,i){return{c:c,i:i};}).filter(function(x){return show||x.c.active!==false;});
  var filterBid=el('branch').value;
  if(filterBid&&filterBid!=='all'){
    list=list.filter(function(x){return x.c.branchId===filterBid;});
  }
  var by={};
  list.forEach(function(item){
    var key=branchName(item.c)||'Unassigned';
    if(!by[key])by[key]=[];
    by[key].push(item);
  });
  Object.keys(by).forEach(function(k){
    by[k].sort(function(a,b){
      var fa=isFadedReopen(a.c)?0:1;
      var fb=isFadedReopen(b.c)?0:1;
      if(fa!==fb)return fb-fa;
      return String(sortAt(b.c)).localeCompare(String(sortAt(a.c)));
    });
  });
  var names=Object.keys(by).sort(function(a,b){
    if(a==='Unassigned')return 1;
    if(b==='Unassigned')return -1;
    return a.localeCompare(b);
  });
  return {by:by,names:names};
}
function reopenBtnHtml(c,i){
  if(isFadedReopen(c)){
    return '<button type="button" class="m-btn m-btn-grey" style="padding:6px 10px;font-size:12px;opacity:.85;cursor:default" disabled>Reopened</button>';
  }
  if(canReopen(c)){
    return '<button type="button" class="m-btn m-btn-gold" style="padding:6px 10px;font-size:12px" onclick="reopenRow('+i+')">Reopen</button>';
  }
  return '';
}
function render(){
  headHtml();
  var tb=el('rows');var show=el('showArchived')&&el('showArchived').checked;tb.innerHTML='';
  var g=groupedList(show);
  var cols=14;
  if(!g.names.length){
    tb.innerHTML='<tr><td colspan="'+cols+'" class="m-pending">No complaints yet. Tap <b>Mail sync</b> or <b>+ Add Complaint</b> at the bottom for phone / Help desk / Control cases.</td></tr>';
    kpi();return;
  }
  g.names.forEach(function(bn){
    var items=g.by[bn];
    var hr=document.createElement('tr');
    hr.className='branch-group-row';
    hr.innerHTML='<td colspan="'+cols+'">📍 '+h(bn)+' · '+items.length+' complaint'+(items.length===1?'':'s')+' · latest on top</td>';
    tb.appendChild(hr);
    items.forEach(function(item){
      var c=item.c,i=item.i;
      var tr=document.createElement('tr');
      if(c.active===false)tr.className='m-row-inactive';
      else if(isFadedReopen(c))tr.className='m-row-reopened';
      var planCell=c.correctiveActionPlan
        ? '<button type="button" class="cmp-link" onclick="openPlan('+i+')"><div class="cmp-read">'+h(c.correctiveActionPlan)+'</div></button>'
        : '<button type="button" class="cmp-link" onclick="openPlan('+i+')">+ Corrective action plan</button>';
      var avoidLabel=c.avoidRecurrence?'How to avoid reoccurrence ✓':'How to avoid reoccurrence';
      var reopenTag=c.reopenedFromId?'<br><small style="color:#fbbf24">Reopen copy</small>':'';
      tr.innerHTML=
        '<td class="code-cell">'+(c.code?h(c.code):'<span style="color:#64748b">On save…</span>')+reopenTag+'</td>'+
        '<td style="font-weight:700;color:#f8fafc">'+h(c.clientName||'—')+'</td>'+
        '<td>'+h(c.location||'—')+'</td>'+
        '<td style="white-space:nowrap">'+h(fmtDate(mailAt(c)))+'</td>'+
        '<td style="white-space:nowrap;color:#93c5fd">'+h(fmtTime(mailAt(c)))+'</td>'+
        '<td><button type="button" class="nature-link" title="Open mail in new window" onclick="openMailWindow('+i+')">'+h(natureOf(c))+'</button></td>'+
        '<td>'+(isFadedReopen(c)?'—':'<button type="button" class="m-btn m-btn-gold" style="padding:7px 12px;font-size:13px" onclick="openAssign('+i+')">Assign</button>')+'</td>'+
        '<td>'+planCell+'</td>'+
        '<td><input type="date" value="'+a(c.resolvedOn||'')+'" '+(isFadedReopen(c)?'disabled':'oninput="upd('+i+',\\'resolvedOn\\',this.value)"')+'></td>'+
        '<td><input type="date" value="'+a(c.completionReportSentOn||'')+'" '+(isFadedReopen(c)?'disabled':'oninput="upd('+i+',\\'completionReportSentOn\\',this.value)"')+'></td>'+
        '<td>'+h(c.reportedBy||'—')+(c.channel?'<br><small style="color:#93c5fd">'+h(c.channel)+'</small>':'')+'<br><small style="color:#64748b">'+h(c.fromEmail||'')+'</small></td>'+
        '<td>'+timeBarHtml(c)+'</td>'+
        '<td class="assignee-cell">'+(c.assignedTo?h(c.assignedTo):'<span style="color:#64748b;font-weight:600">—</span>')+(c.edc?'<br><small style="color:#94a3b8;font-weight:600">EDC '+h(fmtDate(c.edc))+'</small>':'')+'</td>'+
        '<td><div class="row-actions">'+
          '<button type="button" class="m-btn m-btn-navy" style="padding:6px 10px;font-size:12px" onclick="openCase('+i+')">Open the case</button>'+
          reopenBtnHtml(c,i)+
          (isFadedReopen(c)?'':'<button type="button" class="m-btn m-btn-red" style="padding:6px 10px;font-size:12px" onclick="deleteRow('+i+')">Delete</button>')+
          '<button type="button" class="m-btn m-btn-grey" style="padding:6px 10px;font-size:12px" onclick="openAvoid('+i+')">'+h(avoidLabel)+'</button>'+
          (isFadedReopen(c)?'':'<button type="button" class="m-btn m-btn-green" style="padding:6px 10px;font-size:12px" onclick="submitRow('+i+')">Submit</button>')+
        '</div></td>';
      tb.appendChild(tr);
    });
  });
  kpi();
}
function kpi(){
  var open=0,closed=0,mail=0,active=0,assigned=0;
  ROWS.forEach(function(c){
    if(c.active===false)return;
    active++;
    if(c.status==='Closed'||c.resolvedOn)closed++;else open++;
    if(c.source==='inbox'||c.channel==='Email'||c.emailId)mail++;
    if(c.assignedTo)assigned++;
  });
  el('kpis').innerHTML=
    '<div class="m-kpi-dark"><b>'+active+'</b><span>Active</span></div>'+
    '<div class="m-kpi-dark"><b class="sc-poor">'+open+'</b><span>Open</span></div>'+
    '<div class="m-kpi-dark"><b>'+assigned+'</b><span>Assigned</span></div>'+
    '<div class="m-kpi-dark"><b>'+mail+'</b><span>From Director mail</span></div>';
}
function save(){
  var m=el('saveMsg');m.style.display='block';m.style.color='#4ade80';m.textContent='Saving…';
  api('saveComplaints',{branchId:el('branch').value,complaints:ROWS}).then(function(res){
    if(res.status===200){
      m.textContent='✅ Saved & published!';
      if(isAll()){loadBranchComplaints();return;}
      if(res.body.complaints)ROWS=res.body.complaints.map(function(c){c.active=c.active!==false;return c;});
      render();
    }else{m.style.color='#f87171';m.textContent=res.body.error||'Could not save';}
  });
}
misStart();
</script>
</body></html>`

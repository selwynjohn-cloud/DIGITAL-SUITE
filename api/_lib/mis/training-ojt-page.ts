/** MIS Management / HOD — Training (OJT) Track 1 follow-up (OJT only). */

export type TrainingOjtPageOpts = {
  portal: 'mgmt' | 'staff'
  activePath: string
  title: string
}

export function trainingOjtInnerHtml(opts: TrainingOjtPageOpts): string {
  const branchPick =
    opts.portal === 'mgmt'
      ? '<div><label class="m-lbl">Branch</label><select class="m-inp" id="branchSel" onchange="loadFollowup()"><option value="ALL">All Branches</option></select></div>'
      : ''
  const mgmtNote =
    opts.portal === 'mgmt'
      ? '<p class="hint">Track 1 — On Site Tactical Training (OJT) only. Management can <b>Reopen</b> a completed observation when follow-up is needed again.</p>'
      : '<p class="hint">Track 1 — OJT only. Assign observation closure duty to your <b>Operations Manager (OM)</b>. OM completes the format in the Training app; completion is sent back to you here.</p>'
  return `
<div class="m-wrap" id="app">
  <style>
  .tojt-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:12px 0}
  .tojt-kpi .box{background:#0e1730;border:1px solid #22304f;border-radius:10px;padding:12px;text-align:center}
  .tojt-kpi .n{font-size:22px;font-weight:800;color:#fde68a}
  .tojt-kpi .l{font-size:11px;color:#94a3b8;margin-top:4px;line-height:1.35}
  .mtbl th,.mtbl td{padding:8px 10px;border-bottom:1px solid #22304f;text-align:left;vertical-align:top;font-size:13px}
  .mtbl th{color:#fde68a;font-weight:800}
  .pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700}
  .pill.open{background:#7c2d12;color:#fed7aa}
  .pill.ok{background:#14532d;color:#bbf7d0}
  .pill.muted{background:#334155;color:#cbd5e1}
  .tojt-sec{margin-top:18px}
  .tojt-sec h2{font-size:16px;color:#fde68a;margin:0 0 8px}
  #reviewModal{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px}
  #reviewModal.hidden{display:none!important}
  #reviewBox{background:#fff;color:#0f172a;max-width:920px;width:100%;max-height:90vh;overflow:auto;border-radius:12px;padding:16px}
  </style>
  ${mgmtNote}
  <div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:10px">
    ${branchPick}
    <div><label class="m-lbl">Month</label><input class="m-inp" type="month" id="monthPick" onchange="loadFollowup()"></div>
    <div style="align-self:end"><button type="button" class="m-btn m-btn-gold" onclick="loadFollowup()">Refresh</button></div>
  </div>
  <div class="tojt-kpi" id="kpiRow"></div>
  <p id="loadMsg" class="hint"></p>

  <div class="tojt-sec m-card">
    <h2>1 · Training OJT — completed (review report sent to client)</h2>
    <div id="tblCompleted"></div>
  </div>

  <div class="tojt-sec m-card">
    <h2>2 · Observation report — assigned · completed · review</h2>
    <p class="hint" style="margin-bottom:8px">HOD assigns OM → OM submits completion format in Training app → review here. Reopen is Management only.</p>
    <div id="tblObs"></div>
  </div>

  <div id="reviewModal" class="hidden" onclick="if(event.target===this)closeReview()">
    <div id="reviewBox">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <strong id="reviewTitle" style="color:#14224f"></strong>
        <button type="button" class="m-btn m-btn-grey" onclick="closeReview()">Close</button>
      </div>
      <iframe id="reviewFrame" title="Report preview" sandbox="allow-same-origin" style="display:block;width:100%;min-height:70vh;height:70vh;border:0;background:#f1f5f9;border-radius:8px"></iframe>
    </div>
  </div>
</div>`
}

export function trainingOjtScript(opts: TrainingOjtPageOpts): string {
  const apiUrl = opts.portal === 'mgmt' ? '/api/mis/admin-data' : '/api/mis/staff-data'
  const isStaff = opts.portal === 'staff'
  const isMgmt = opts.portal === 'mgmt'
  return `
var API='${apiUrl}',IS_STAFF=${isStaff ? 'true' : 'false'},IS_MGMT=${isMgmt ? 'true' : 'false'};
var DATA=null;
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function today(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});}
function api(action,extra){
  var payload=Object.assign({kind:'training'},extra||{});
  if(IS_STAFF&&typeof staffApi==='function'){
    return staffApi(action,payload).then(function(r){return{s:r.status,j:r.body};});
  }
  return fetch(API,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,kind:'training'},extra||{}))}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});
}
function branchId(){
  if(IS_STAFF)return typeof STAFF_BRANCH_ID!=='undefined'?STAFF_BRANCH_ID:'';
  return el('branchSel')&&el('branchSel').value?el('branchSel').value:'ALL';
}
function pillOpen(){return '<span class="pill open">Pending</span>';}
function pillOk(){return '<span class="pill ok">Done</span>';}
function omSelect(row){
  if(!row.canAssign)return '—';
  var opts=(DATA&&DATA.omOptions||[]).filter(function(o){return o.branchId===row.branchId;});
  if(!opts.length)return '<span class="hint">No OM in directory</span>';
  var sel='<select class="m-inp" style="min-width:140px;font-size:12px" id="om_'+h(row.sessionId)+'">';
  sel+='<option value="">Assign OM…</option>';
  opts.forEach(function(o){sel+='<option value="'+h(o.email)+'" data-name="'+h(o.name)+'">'+h(o.name)+'</option>';});
  sel+='</select> <button type="button" class="m-btn m-btn-gold" style="padding:4px 8px;font-size:11px" onclick="assignOm(\\''+h(row.sessionId)+'\\',\\''+h(row.branchId)+'\\')">Assign</button>';
  return sel;
}
function renderKpis(s){
  var items=[
    {n:s.totalScheduled,l:'Total training scheduled'},
    {n:s.trainingCompleted,l:'Training completed'},
    {n:s.completionReportSent,l:'Completion report sent'},
    {n:s.balanceToComplete,l:'Balance to be completed'},
    {n:s.balancePendingCompletionReport,l:'Balance pending completion report'},
    {n:s.observationCompleted,l:'Observation report completed'},
    {n:s.observationBalance,l:'Observation balance'}
  ];
  el('kpiRow').innerHTML=items.map(function(x){return '<div class="box"><div class="n">'+x.n+'</div><div class="l">'+h(x.l)+'</div></div>';}).join('');
}
function renderCompleted(rows){
  var box=el('tblCompleted');if(!box)return;
  if(!rows||!rows.length){box.innerHTML='<p class="hint">No completed trainings with client report sent this month.</p>';return;}
  var th='<tr><th>Branch</th><th>Date</th><th>Client</th><th>Trainer</th><th>Sent</th><th></th></tr>';
  var body=rows.map(function(r){
    var sent=r.reportSentAt?h(r.reportSentAt).slice(0,10)+' · '+h(r.reportSentBy):'—';
    var btn=r.canReviewReport?'<button type="button" class="m-btn m-btn-grey" style="padding:4px 8px;font-size:11px" onclick="reviewReport(\\'completion\\',\\''+h(r.sessionId)+'\\',\\''+h(r.branchId)+'\\')">Review report</button>':'';
    return '<tr><td>'+h(r.branchName)+'</td><td>'+h(r.trainingDate)+'</td><td>'+h(r.clientName)+'</td><td>'+h(r.trainerName)+'</td><td>'+sent+'</td><td>'+btn+'</td></tr>';
  }).join('');
  box.innerHTML='<div class="mtblwrap"><table class="mtbl"><thead>'+th+'</thead><tbody>'+body+'</tbody></table></div>';
}
function renderObs(rows){
  var box=el('tblObs');if(!box)return;
  if(!rows||!rows.length){box.innerHTML='<p class="hint">No observation reports for this month.</p>';return;}
  var th='<tr><th>Branch</th><th>Date</th><th>Client</th><th>Status</th><th>Assigned OM</th><th>Detail</th><th></th></tr>';
  var body=rows.map(function(r){
    var st=r.obsCompleted?pillOk()+' Completed':(r.assignedOmName?pillOpen()+' Assigned':pillOpen()+' '+h(r.statusLabel));
    var om=r.obsCompleted?h(r.assignedOmName||'—'):omSelect(r);
    var acts='';
    if(r.canReviewClosure)acts+='<button type="button" class="m-btn m-btn-grey" style="padding:4px 8px;font-size:11px;margin-right:4px" onclick="reviewReport(\\'observation\\',\\''+h(r.sessionId)+'\\',\\''+h(r.branchId)+'\\')">Review completion</button>';
    if(r.canReopen)acts+='<button type="button" class="m-btn m-btn-grey" style="padding:4px 8px;font-size:11px" onclick="reopenObs(\\''+h(r.sessionId)+'\\',\\''+h(r.branchId)+'\\')">Reopen</button>';
    return '<tr><td>'+h(r.branchName)+'</td><td>'+h(r.trainingDate)+'</td><td>'+h(r.clientName)+'</td><td>'+st+'</td><td>'+om+'</td><td>'+h(r.detail)+'</td><td>'+acts+'</td></tr>';
  }).join('');
  box.innerHTML='<div class="mtblwrap"><table class="mtbl"><thead>'+th+'</thead><tbody>'+body+'</tbody></table></div>';
}
function loadFollowup(){
  var msg=el('loadMsg');if(msg)msg.textContent='Loading…';
  api('trainingOjtFollowup',{month:el('monthPick').value,branchId:branchId()}).then(function(res){
    if(res.s!==200){if(msg)msg.textContent=res.j.error||'Could not load';return;}
    DATA=res.j;
    if(msg)msg.textContent='Track 1 OJT · '+h(res.j.from)+' to '+h(res.j.to)+(IS_STAFF?' · '+h(typeof STAFF_BRANCH_NAME!=='undefined'?STAFF_BRANCH_NAME:''):'');
    renderKpis(res.j.summary);
    renderCompleted(res.j.completedList);
    renderObs(res.j.observationList);
  });
}
function suitePaintHtmlPreview(frameId,html,title){
  var frame=el(frameId);if(!frame)return;
  var doc='<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+h(title||'Preview')+'</title><style>html,body{margin:0;background:#f1f5f9;color:#0f172a;font-family:Arial,Helvetica,sans-serif}</style></head><body style="margin:0;padding:16px;background:#f1f5f9;color:#0f172a">'+(html||'<p style="color:#64748b">No preview content.</p>')+'</body></html>';
  try{frame.srcdoc=doc;}catch(e){
    try{frame.src='data:text/html;charset=utf-8,'+encodeURIComponent(doc);}catch(e2){}
  }
}
function reviewReport(kind,sessionId,bid){
  api('trainingOjtReviewReport',{kind:kind,sessionId:sessionId,branchId:bid}).then(function(res){
    if(res.s!==200){alert(res.j.error||'Could not load report');return;}
    el('reviewTitle').textContent=res.j.title||'Report';
    suitePaintHtmlPreview('reviewFrame',res.j.html||'',res.j.title||'Report');
    el('reviewModal').classList.remove('hidden');
  });
}
function closeReview(){el('reviewModal').classList.add('hidden');}
function assignOm(sessionId,bid){
  var sel=el('om_'+sessionId);if(!sel||!sel.value){alert('Pick an Operations Manager.');return;}
  var opt=sel.options[sel.selectedIndex];
  api('trainingOjtAssignObs',{sessionId:sessionId,branchId:bid,omEmail:sel.value,omName:opt.getAttribute('data-name')||opt.textContent}).then(function(res){
    if(res.s!==200){alert(res.j.error||'Could not assign');return;}
    loadFollowup();
  });
}
function reopenObs(sessionId,bid){
  if(!confirm('Reopen this observation completion for follow-up?'))return;
  api('trainingOjtReopen',{kind:'observation',id:sessionId,branchId:bid}).then(function(res){
    if(res.s!==200){alert(res.j.error||'Could not reopen');return;}
    loadFollowup();
  });
}
function loadBranches(){
  return api('nightOjtBranches').then(function(res){
    if(res.s!==200||!el('branchSel'))return;
    var opts='<option value="ALL">All Branches</option>';
    (res.j.branches||[]).forEach(function(b){opts+='<option value="'+h(b.id)+'">'+h(b.name)+'</option>';});
    el('branchSel').innerHTML=opts;
  });
}
function bootTrainingOjt(){
  if(el('monthPick'))el('monthPick').value=today().slice(0,7);
  var chain=Promise.resolve();
  if(!IS_STAFF)chain=loadBranches();
  chain.then(loadFollowup);
}
`
}

export function trainingOjtStaffBootScript(): string {
  return `
function initStaffPage(j){
  STAFF_BRANCH_ID=(j&&j.branchId)||(typeof staffResolveBranchId==='function'?staffResolveBranchId():'');
  STAFF_BRANCH_NAME=(j&&j.branchName)||(typeof staffBranchLabel==='function'?staffBranchLabel():'');
  bootTrainingOjt();
}
`
}

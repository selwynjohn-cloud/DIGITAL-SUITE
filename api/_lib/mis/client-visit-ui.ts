export type ClientVisitPageOpts = {
  portal: 'mgmt' | 'staff'
  activePath: string
  title: string
}

export function clientVisitCss(): string {
  return `
.cv-st{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:800}
.cv-st-d{background:rgba(234,179,8,.2);color:#fde68a}
.cv-st-r{background:rgba(59,130,246,.25);color:#93c5fd}
.cv-st-s{background:rgba(34,197,94,.25);color:#86efac}
.cv-toggle{display:inline-flex;align-items:center;gap:10px;cursor:pointer;user-select:none}
.cv-toggle input{position:absolute;opacity:0;width:0;height:0}
.cv-toggle-ui{width:46px;height:26px;border-radius:999px;background:#334155;border:1px solid #475569;position:relative;transition:.15s;flex-shrink:0}
.cv-toggle-ui:after{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#e2e8f0;transition:.15s}
.cv-toggle input:checked+.cv-toggle-ui{background:#14532d;border-color:#22c55e}
.cv-toggle input:checked+.cv-toggle-ui:after{left:22px;background:#bbf7d0}
.cv-toggle-lbl{font-weight:800;color:#fde68a;font-size:14px}
`
}

export function clientVisitInnerHtml(opts: ClientVisitPageOpts): string {
  const isMgmt = opts.portal === 'mgmt'
  const branchPick = isMgmt
    ? '<div><label class="m-lbl">Branch</label><select class="m-inp" id="branchSel" onchange="onBranchChange()"></select></div>'
    : ''
  return `
<div class="m-wrap" id="app">
  ${clientVisitCss() ? `<style>${clientVisitCss()}</style>` : ''}
  <div class="m-card">
    <h3>Client Visits</h3>
    <p class="hint">${
      isMgmt
        ? 'Visits already done on <b>Agile Mobile / Work360</b> are fetched here. Management <b>Reviews</b>, sends <b>Reminder</b>, <b>Reopens</b>, and can <b>Send to client</b>.'
        : 'Visits already done on <b>Agile Mobile / Work360</b> are fetched here — you do not type them again. Add a visit only if it is not on Mobile. Then Review and Send to client.'
    }</p>
    <div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:10px">
      ${branchPick}
      <div><label class="m-lbl">Month</label><input class="m-inp" type="month" id="monthPick" onchange="reloadAll()"></div>
    </div>
    <div class="m-kgrid" id="cvKpis" style="margin-top:12px"></div>
  </div>

  <div class="m-tabs noprint">
    <button type="button" class="m-tab active" id="tabSchedule" onclick="showTab('schedule')">📅 Visit schedule</button>
    <button type="button" class="m-tab" id="tabAdd" onclick="showTab('add')">➕ Add visit</button>
    <button type="button" class="m-tab" id="tabList" onclick="showTab('list')">📋 Scheduled List</button>
    <button type="button" class="m-tab" id="tabReport" onclick="showTab('report')">📝 Visit report</button>
    <button type="button" class="m-tab" id="tabReview" onclick="showTab('review')">✅ Review</button>
    <button type="button" class="m-tab" id="tabMobile" onclick="showTab('mobile')">📱 Mobile patrol</button>
  </div>

  <div id="paneSchedule" class="m-card">
    <h3>Visit schedule</h3>
    <p class="hint">Visits <b>completed as per the schedule</b> (including Mobile). Tap <b>Complete visit (Mobile app)</b> to pull day visits from Agile Mobile. Plan future visits under <b>Scheduled List</b> or <b>Add visit</b>. Day / Night Check visit reports stay on <b>Site Security Visit Report (Day / Night Check)</b>.</p>
    <div style="margin:10px 0;display:flex;gap:8px;flex-wrap:wrap">
      <button type="button" class="m-btn m-btn-gold" onclick="fetchLatestVisits()">Complete visit (Mobile app)</button>
      <button type="button" class="m-btn m-btn-green" onclick="showTab('add')">+ Add visit</button>
    </div>
    <p id="calMsg" class="hint" style="margin-top:8px"></p>
    <div id="scheduleTable" style="overflow:auto;margin-top:10px"></div>
  </div>

  <div id="paneAdd" class="m-card hidden">
    <h3 id="addTitle">Add visit</h3>
    <input type="hidden" id="cv_id">
    <div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:10px">
      <div><label class="m-lbl">Visit date</label><input class="m-inp" type="date" id="cv_date"></div>
      <div><label class="m-lbl">Visit time</label><input class="m-inp" type="time" id="cv_time" value="10:00"></div>
      <div><label class="m-lbl">Client (Master Directory)</label><select class="m-inp" id="cv_client" onchange="onClientPick()"></select></div>
      <div><label class="m-lbl">Location</label><input class="m-inp" id="cv_loc"></div>
      <div><label class="m-lbl">Officer name</label><input class="m-inp" id="cv_officer" list="cvOfficerList" placeholder="Duty officer"></div>
      <div><label class="m-lbl">Officer mobile</label><input class="m-inp" id="cv_phone" placeholder="10-digit"></div>
      <div><label class="m-lbl">Person met</label><input class="m-inp" id="cv_met"></div>
      <div><label class="m-lbl">Purpose</label><input class="m-inp" id="cv_purpose" value="Scheduled Visit"></div>
      <div><label class="m-lbl">Client email</label><input class="m-inp" id="cv_email" type="email" placeholder="client@..."></div>
      <div><label class="m-lbl">SLA / visit note</label><input class="m-inp" id="cv_sla" readonly></div>
    </div>
    <div style="margin-top:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <label class="cv-toggle" title="When ON, Save visit also creates a new visit in Agile Control for vehicle allotment">
        <input type="checkbox" id="cv_vehicleReq">
        <span class="cv-toggle-ui"></span>
        <span class="cv-toggle-lbl">Vehicle Requirement</span>
      </label>
      <span id="cv_vehicleHint" class="hint" style="margin:0"></span>
    </div>
    <datalist id="cvOfficerList"></datalist>
    <p class="hint" style="margin-top:8px">If Vehicle Requirement is ON, Save also copies a <b>new visit to Agile Control</b>.</p>
    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
      <button type="button" class="m-btn m-btn-green" id="cvSaveBtn" onclick="saveVisit()">Save visit</button>
      <button type="button" class="m-btn m-btn-grey" onclick="clearVisitForm()">New visit</button>
    </div>
    <p id="addMsg" class="hint" style="margin-top:8px"></p>
  </div>

  <div id="paneList" class="m-card hidden">
    <h3>Scheduled List</h3>
    <p class="hint">Visits that are <b>scheduled but not yet completed</b>. When done on Mobile, tap <b>Complete visit (Mobile app)</b> on Visit schedule.</p>
    <p id="listMsg" class="hint"></p>
    <div id="visitTable" style="overflow:auto;margin-top:10px"></div>
  </div>

  <div id="paneReport" class="m-card hidden">
    <h3>Visit report</h3>
    ${
      isMgmt
        ? `<p class="hint">Management consolidated report for the selected month. Use <b>All Branches</b> for the full picture, or pick one branch. Open a row — then <b>Save report</b>, <b>Preview</b>, or <b>Send to client</b>.</p>
    <div id="mgmtReportBody" style="margin-top:10px"></div>
    <div id="reportEdit" class="hidden" style="margin-top:14px">
      <h4 style="color:#e2e8f0;margin:0 0 8px">Selected visit</h4>
      <div id="mgmtVisitDetail" class="hint"></div>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="m-btn m-btn-green" id="rpSaveBtn" onclick="saveVisit()">Save report</button>
        <button type="button" class="m-btn m-btn-navy" onclick="previewVisit()">Preview</button>
        <button type="button" class="m-btn m-btn-green" onclick="sendVisit()">Send to client</button>
        <button type="button" class="m-btn m-btn-grey" onclick="remindVisit(EDIT&&EDIT.id)">Reminder</button>
        <button type="button" class="m-btn m-btn-grey" onclick="reopenVisit(EDIT&&EDIT.id)">Reopen</button>
      </div>
      <p id="rpMsg" class="hint" style="margin-top:8px"></p>
      <iframe id="rpPreview" class="hidden" style="width:100%;min-height:420px;margin-top:12px;border:1px solid #334155;border-radius:8px;background:#fff"></iframe>
    </div>`
        : `<p class="hint">Fill the observation, then <b>Save report</b>, <b>Preview</b>, or <b>Send to client</b>. Use the <b>Review</b> tab for Open / Review / Save / Send.</p>
    <div id="reportPick"></div>
    <div id="reportEdit" class="hidden" style="margin-top:12px">
      <div><label class="m-lbl">Observation</label><textarea class="m-inp" id="cv_obs" rows="4" style="width:100%"></textarea></div>
      <div style="margin-top:10px"><label class="m-lbl">Issues found</label><textarea class="m-inp" id="cv_issues" rows="2" style="width:100%"></textarea></div>
      <div style="margin-top:10px"><label class="m-lbl">Action taken</label><textarea class="m-inp" id="cv_action" rows="2" style="width:100%"></textarea></div>
      <div style="margin-top:10px"><label class="m-lbl">Follow-up</label><textarea class="m-inp" id="cv_follow" rows="2" style="width:100%"></textarea></div>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="m-btn m-btn-green" id="rpSaveBtn" onclick="saveVisit()">Save report</button>
        <button type="button" class="m-btn m-btn-navy" onclick="previewVisit()">Preview</button>
        <button type="button" class="m-btn m-btn-green" onclick="sendVisit()">Send to client</button>
      </div>
      <p id="rpMsg" class="hint" style="margin-top:8px"></p>
      <iframe id="rpPreview" class="hidden" style="width:100%;min-height:420px;margin-top:12px;border:1px solid #334155;border-radius:8px;background:#fff"></iframe>
    </div>`
    }
  </div>

  <div id="paneReview" class="m-card hidden">
    <h3>Review</h3>
    <p class="hint">${
      isMgmt
        ? 'Buttons: <b>Open</b> · <b>Review</b> · <b>Save</b> · <b>Send to client</b>. Reminder and Reopen stay for Management.'
        : 'Buttons: <b>Open</b> · <b>Review</b> · <b>Save</b> · <b>Send to client</b>.'
    }</p>
    <div id="reviewList"></div>
  </div>

  <div id="paneMobile" class="m-card hidden">
    <h3>Mobile patrol (Work360)</h3>
    <p class="hint">Day visits from Agile Mobile — same as before. Day / Night Check visit reports stay on <b>Site Security Visit Report (Day / Night Check)</b>.</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-top:10px">
      <div><label class="m-lbl">Visit date</label><input class="m-inp" type="date" id="mobDate"></div>
      <button type="button" class="m-btn m-btn-gold" onclick="loadMobile()">Show</button>
      <button type="button" class="m-btn m-btn-navy" onclick="syncMobile()">📱 Sync from Mobile</button>
      <span id="syncMsg" class="hint" style="margin:0"></span>
    </div>
    <div class="m-kgrid" id="mobKpis" style="margin-top:12px"></div>
    <div class="mtblwrap" style="margin-top:12px"><table class="mtbl"><thead><tr><th>Staff</th><th>Client</th><th>Unit</th><th class="c">Time</th><th>Place</th></tr></thead><tbody id="mobAll"></tbody></table></div>
  </div>
</div>`
}

export function clientVisitScript(opts: ClientVisitPageOpts): string {
  const apiUrl = opts.portal === 'mgmt' ? '/api/mis/admin-data' : '/api/mis/staff-data'
  const isStaff = opts.portal === 'staff'
  const isMgmt = opts.portal === 'mgmt'
  return `
var API='${apiUrl}',IS_STAFF=${isStaff ? 'true' : 'false'},IS_MGMT=${isMgmt ? 'true' : 'false'};
var BRANCH_ID='',BRANCH_NAME='',MONTH='',TODAY='',VISITS=[],CLIENTS=[],STAFF=[],BRANCHES=[],EDIT=null;
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function today(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});}
function api(action,extra){
  var payload=Object.assign({},extra||{});
  if(IS_STAFF&&typeof staffApi==='function'){
    return staffApi(action,payload).then(function(r){return{s:r.status,j:r.body};});
  }
  return fetch(API,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},payload))}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});
}
function branchId(){
  if(IS_STAFF) return (typeof STAFF_BRANCH_ID!=='undefined'&&STAFF_BRANCH_ID)||BRANCH_ID;
  var a=el('branchSel');
  return (a&&a.value)||BRANCH_ID;
}
function showTab(t){
  var tabs=['schedule','add','list','report','review','mobile'];
  tabs.forEach(function(name){
    var tab=el('tab'+name.charAt(0).toUpperCase()+name.slice(1));
    var pane=el('pane'+name.charAt(0).toUpperCase()+name.slice(1));
    if(tab)tab.classList.toggle('active',t===name);
    if(pane)pane.classList.toggle('hidden',t!==name);
  });
  if(t==='schedule')renderSchedule();
  if(t==='list')renderList();
  if(t==='report')renderReportPick();
  if(t==='review')renderReview();
  if(t==='mobile'&&el('mobDate')&&!el('mobDate').value){el('mobDate').value=today();loadMobile();}
}
function onBranchChange(){ BRANCH_ID=el('branchSel')&&el('branchSel').value||BRANCH_ID; reloadAll(); }
function statusLabel(st){
  if(st==='Sent')return 'Sent to client';
  if(st==='Reviewed')return 'Reviewed';
  return 'Draft';
}
function statusBadge(st){
  var cls=st==='Sent'?'cv-st-s':(st==='Reviewed'?'cv-st-r':'cv-st-d');
  return '<span class="cv-st '+cls+'">'+h(statusLabel(st))+'</span>';
}
function locked(v){return v&&v.status==='Sent';}
function fillBranches(){
  var sel=el('branchSel'); if(!sel)return;
  if(IS_STAFF)return;
  var cur=BRANCH_ID||'ALL';
  var html='<option value="ALL"'+(cur==='ALL'?' selected':'')+'>All Branches</option>';
  (BRANCHES||[]).forEach(function(b){
    html+='<option value="'+h(b.id)+'"'+(String(cur)===String(b.id)?' selected':'')+'>'+h(b.name)+'</option>';
  });
  sel.innerHTML=html;
  if(!BRANCH_ID)BRANCH_ID='ALL';
  sel.value=BRANCH_ID||'ALL';
}
function isAllBranches(){
  var v=String(branchId()||'').trim();
  return !v||v==='ALL'||v==='All'||v==='All Branches';
}
function fillClients(){
  var sel=el('cv_client'); if(!sel)return;
  var keep=sel.value;
  sel.innerHTML='<option value="">— Pick client —</option>'+CLIENTS.map(function(c){
    return '<option value="'+h(c.id)+'" data-name="'+h(c.name)+'" data-loc="'+h(c.location||'')+'" data-sla="'+h(c.slaDayVisit||'')+'">'+h(c.name)+(c.location?' — '+h(c.location):'')+'</option>';
  }).join('');
  if(keep)sel.value=keep;
}
function fillOfficers(){
  var dl=el('cvOfficerList'); if(!dl)return;
  dl.innerHTML=STAFF.map(function(s){return '<option value="'+h(s.name)+'"></option>';}).join('');
}
function onClientPick(){
  var sel=el('cv_client'); if(!sel)return;
  var opt=sel.options[sel.selectedIndex];
  if(!opt||!opt.value)return;
  el('cv_loc').value=opt.getAttribute('data-loc')||'';
  el('cv_sla').value=opt.getAttribute('data-sla')||'';
}
function collectVisit(){
  var sel=el('cv_client');
  var opt=sel&&sel.options[sel.selectedIndex];
  return {
    id:el('cv_id').value||undefined,
    branchId:branchId(),
    clientId:sel&&sel.value||'',
    clientName:opt&&opt.getAttribute('data-name')||(opt&&opt.text)||'',
    location:el('cv_loc').value.trim(),
    clientEmail:el('cv_email').value.trim(),
    visitDate:el('cv_date').value,
    visitTime:el('cv_time').value||'10:00',
    officerName:el('cv_officer').value.trim(),
    officerPhone:el('cv_phone').value.trim(),
    personMet:el('cv_met').value.trim(),
    purpose:el('cv_purpose').value.trim(),
    slaNote:el('cv_sla').value.trim(),
    observation:el('cv_obs')?el('cv_obs').value.trim():'',
    issues:el('cv_issues')?el('cv_issues').value.trim():'',
    actionTaken:el('cv_action')?el('cv_action').value.trim():'',
    followUp:el('cv_follow')?el('cv_follow').value.trim():'',
    fromMobile:EDIT&&EDIT.fromMobile?true:false,
    mobileId:EDIT&&EDIT.mobileId||'',
    vehicleRequired:!!(el('cv_vehicleReq')&&el('cv_vehicleReq').checked),
    controlCaseNo:EDIT&&EDIT.controlCaseNo||''
  };
}
function paintForm(v){
  EDIT=v||null;
  el('cv_id').value=v&&v.id||'';
  el('cv_date').value=(v&&v.visitDate)||TODAY||today();
  el('cv_time').value=(v&&v.visitTime)||'10:00';
  fillClients();
  if(v&&v.clientId)el('cv_client').value=v.clientId;
  else if(v&&v.clientName){
    var match=CLIENTS.find(function(c){return c.name===v.clientName;});
    if(match)el('cv_client').value=match.id;
  }
  el('cv_loc').value=(v&&v.location)||'';
  el('cv_officer').value=(v&&v.officerName)||'';
  el('cv_phone').value=(v&&v.officerPhone)||'';
  el('cv_met').value=(v&&v.personMet)||'';
  el('cv_purpose').value=(v&&v.purpose)||'Scheduled Visit';
  el('cv_email').value=(v&&v.clientEmail)||'';
  el('cv_sla').value=(v&&v.slaNote)||'';
  if(el('cv_obs'))el('cv_obs').value=(v&&v.observation)||'';
  if(el('cv_issues'))el('cv_issues').value=(v&&v.issues)||'';
  if(el('cv_action'))el('cv_action').value=(v&&v.actionTaken)||'';
  if(el('cv_follow'))el('cv_follow').value=(v&&v.followUp)||'';
  if(el('cv_vehicleReq'))el('cv_vehicleReq').checked=!!(v&&v.vehicleRequired);
  if(el('cv_vehicleHint'))el('cv_vehicleHint').textContent=(v&&v.controlCaseNo)?('Control: '+v.controlCaseNo):'';
  el('addTitle').textContent=v&&v.id?'Edit visit':'Add visit';
  var lock=locked(v);
  ['cv_date','cv_time','cv_client','cv_loc','cv_officer','cv_phone','cv_met','cv_purpose','cv_email','cv_obs','cv_issues','cv_action','cv_follow'].forEach(function(id){
    if(el(id))el(id).disabled=lock;
  });
  if(el('cvSaveBtn'))el('cvSaveBtn').style.display=lock?'none':'inline-block';
  if(el('rpSaveBtn'))el('rpSaveBtn').style.display=lock?'none':'inline-block';
  if(el('addMsg'))el('addMsg').textContent=lock?'Sent to client — Management can Reopen if it must change.':'';
  if(el('rpMsg'))el('rpMsg').textContent=lock?'Already sent to client.':(v&&v.status==='Reviewed'?'Reviewed — ready to Send to client.':'');
  if(el('reportEdit'))el('reportEdit').classList.remove('hidden');
  if(el('mgmtVisitDetail')&&v){
    el('mgmtVisitDetail').innerHTML='<b>'+h(v.visitDate)+' · '+h(v.clientName)+'</b><br>'+
      statusBadge(v.status)+' · Officer: '+h(v.officerName||'—')+' · Branch: '+h(v.branchId||'')+
      (v.observation?'<br><span class="hint">Observation: '+h(v.observation.slice(0,240))+(v.observation.length>240?'…':'')+'</span>':'');
  }
}
function clearVisitForm(){
  paintForm({visitDate:el('cv_date').value||TODAY||today(),visitTime:'10:00',purpose:'Scheduled Visit'});
  el('cv_id').value='';
  el('addTitle').textContent='Add visit';
  if(el('addMsg'))el('addMsg').textContent='Saved visits stay on Scheduled List until completed on Mobile.';
}
function openScheduledVisit(){
  clearVisitForm();
  el('cv_purpose').value='Scheduled Visit';
  el('addTitle').textContent='Add visit — schedule';
  if(el('addMsg'))el('addMsg').textContent='This stays on Scheduled List until completed on Mobile.';
  showTab('add');
}
function isVisitCompleted(v){
  if(!v)return false;
  if(v.fromMobile)return true;
  if(v.status==='Reviewed'||v.status==='Sent')return true;
  return false;
}
function isVisitScheduledOnly(v){
  return !!v && !isVisitCompleted(v);
}
function vehCell(v){
  if(!v.vehicleRequired)return 'No';
  var bits=[];
  if(v.controlCaseNo)bits.push(h(v.controlCaseNo));
  if(v.driverName||v.vehicleRegNo)bits.push(h(v.driverName||'—')+(v.vehicleRegNo?' / '+h(v.vehicleRegNo):''));
  return bits.length?('Yes · '+bits.join(' · ')):'Yes · waiting Control';
}
function openVisit(id,tab){
  var v=VISITS.find(function(x){return x.id===id;});
  if(!v)return;
  paintForm(v);
  showTab(tab||'report');
}
function openNewForDate(ymd){
  clearVisitForm();
  el('cv_date').value=ymd;
  showTab('add');
}
function applyVisit(v){
  if(!v||!v.id)return;
  var i=VISITS.findIndex(function(x){return x.id===v.id;});
  if(i>=0)VISITS[i]=v; else VISITS.unshift(v);
  paintForm(v);
  renderAll();
}
function saveVisit(){
  var msg=el('addMsg')||el('rpMsg');
  if(!IS_STAFF && isAllBranches()){
    if(msg)msg.textContent='Pick one branch (not All Branches), then save.';
    alert('Pick one branch from the Branch list (not All Branches), then save the visit.');
    return;
  }
  if(msg)msg.textContent='Saving…';
  api('clientVisitSave',{visit:collectVisit()}).then(function(res){
    if(res.s!==200){if(msg)msg.textContent=res.j.error||'Save failed';return;}
    applyVisit(res.j.visit);
    if(msg)msg.textContent='Saved ✓'+(res.j.controlNote?' · '+res.j.controlNote:'');
    if(el('cv_vehicleHint')&&res.j.visit&&res.j.visit.controlCaseNo)el('cv_vehicleHint').textContent='Control: '+res.j.visit.controlCaseNo;
  });
}
function reviewVisit(id){
  var v=id?VISITS.find(function(x){return x.id===id;}):EDIT;
  if(!v){alert('Open a visit first.');return;}
  if(!confirm('Review this Client Visit report? After Review you can Send to client.'))return;
  var ready=Promise.resolve({s:200,j:{visit:v}});
  if(EDIT&&EDIT.id===v.id)ready=api('clientVisitSave',{visit:collectVisit()});
  ready.then(function(res){
    if(res.s!==200){alert(res.j.error||'Save failed');return;}
    return api('clientVisitReview',{visitId:(res.j.visit&&res.j.visit.id)||v.id});
  }).then(function(res){
    if(!res)return;
    if(res.s!==200){alert(res.j.error||'Review failed');return;}
    applyVisit(res.j.visit);
    alert('Reviewed. You can Send to client.');
    showTab('review');
  });
}
function remindVisit(id){
  if(!confirm('Send a reminder to the branch HOD for this visit?'))return;
  api('clientVisitRemind',{visitId:id}).then(function(res){
    if(res.s!==200){alert(res.j.error||'Reminder failed');return;}
    applyVisit(res.j.visit);
    alert('Reminder sent to the HOD.');
  });
}
function reopenVisit(id){
  if(!confirm('Reopen this case so the HOD can edit and send again?'))return;
  api('clientVisitReopen',{visitId:id}).then(function(res){
    if(res.s!==200){alert(res.j.error||'Reopen failed');return;}
    applyVisit(res.j.visit);
    alert('Reopened — HOD can edit again.');
    showTab('report');
  });
}
function previewVisit(){
  var v=EDIT;
  if(!v||!v.id){alert('Open a visit first.');return;}
  if(el('rpMsg'))el('rpMsg').textContent='Preview…';
  if(el('reportEdit'))el('reportEdit').classList.remove('hidden');
  var chain=IS_MGMT?Promise.resolve({s:200,j:{visit:v}}):api('clientVisitSave',{visit:collectVisit()});
  chain.then(function(res){
    if(res.s!==200){if(el('rpMsg'))el('rpMsg').textContent=res.j.error||'Save failed';return;}
    if(res.j.visit)applyVisit(res.j.visit);
    return api('clientVisitPreview',{visitId:(res.j.visit&&res.j.visit.id)||v.id});
  }).then(function(res){
    if(!res)return;
    if(res.s!==200){if(el('rpMsg'))el('rpMsg').textContent=res.j.error||'Preview failed';return;}
    el('rpPreview').classList.remove('hidden');
    el('rpPreview').srcdoc=res.j.html||'';
    if(el('rpMsg'))el('rpMsg').textContent='Preview ready';
  });
}
function sendVisit(id){
  var v=id?VISITS.find(function(x){return x.id===id;}):EDIT;
  if(!v){alert('Open a visit first.');return;}
  if(v.status!=='Reviewed'&&v.status!=='Sent'){alert('Review the report first, then Send to client.');return;}
  var to=v.clientEmail||prompt('Client email:','');
  if(!to)return;
  if(!confirm('Send this Client Visit report to the client?'))return;
  api('clientVisitSend',{visitId:v.id,to:to}).then(function(res){
    if(res.s!==200){alert(res.j.error||'Send failed');return;}
    applyVisit(res.j.visit);
    alert('Sent to client ✓');
    showTab('review');
  });
}
function rowActions(v){
  var html='<button type="button" class="m-btn m-btn-navy" style="margin:2px" onclick="openVisit(\\''+v.id+'\\',\\'report\\')">Open</button>';
  html+='<button type="button" class="m-btn m-btn-navy" style="margin:2px" onclick="reviewVisit(\\''+v.id+'\\')">Review</button>';
  html+='<button type="button" class="m-btn m-btn-green" style="margin:2px" onclick="saveReviewRow(\\''+v.id+'\\')">Save</button>';
  html+='<button type="button" class="m-btn m-btn-green" style="margin:2px" onclick="sendVisit(\\''+v.id+'\\')">Send to client</button>';
  if(IS_MGMT&&v.status==='Draft')html+='<button type="button" class="m-btn m-btn-grey" style="margin:2px" onclick="remindVisit(\\''+v.id+'\\')">Reminder</button>';
  if(IS_MGMT&&(v.status==='Reviewed'||v.status==='Sent'))html+='<button type="button" class="m-btn m-btn-grey" style="margin:2px" onclick="reopenVisit(\\''+v.id+'\\')">Reopen</button>';
  return html;
}
function saveReviewRow(id){
  var v=VISITS.find(function(x){return x.id===id;});
  if(!v){alert('Open a visit first.');return;}
  EDIT=v;
  paintForm(v);
  showTab('report');
  saveVisit();
}
function renderKpis(){
  var box=el('cvKpis'); if(!box)return;
  var d=0,r=0,s=0;
  VISITS.forEach(function(v){if(v.status==='Sent')s++;else if(v.status==='Reviewed')r++;else d++;});
  box.innerHTML='<div class="m-kpi t"><b>'+d+'</b><span>Draft</span></div><div class="m-kpi o"><b>'+r+'</b><span>Reviewed</span></div><div class="m-kpi s"><b>'+s+'</b><span>Sent to client</span></div>';
}
function renderSchedule(){
  var box=el('scheduleTable'), msg=el('calMsg');
  if(!box)return;
  var rows=VISITS.filter(isVisitCompleted).slice().sort(function(a,b){
    var ka=(a.visitDate||'')+' '+(a.visitTime||'');
    var kb=(b.visitDate||'')+' '+(b.visitTime||'');
    return ka.localeCompare(kb);
  });
  if(msg)msg.textContent=rows.length?(rows.length+' completed visit(s) this month'):'No completed visits yet — tap Complete visit (Mobile app) or finish a scheduled visit.';
  if(!rows.length){box.innerHTML='<p class="hint">No completed visits on the schedule yet.</p>';return;}
  var showBr=!IS_STAFF && isAllBranches();
  box.innerHTML='<table class="mtbl" style="width:100%;border-collapse:collapse"><thead><tr>'+(showBr?'<th>Branch</th>':'')+'<th>Date</th><th>Time</th><th>Client</th><th>Officer</th><th>Source</th><th>Vehicle / Driver</th><th>Status</th><th></th></tr></thead><tbody>'+
    rows.map(function(v){
      var src=v.fromMobile?'Mobile':'Added';
      return '<tr>'+(showBr?'<td>'+h(v.branchId||'')+'</td>':'')+'<td>'+h(v.visitDate)+'</td><td>'+h(v.visitTime||'')+'</td><td>'+h(v.clientName)+'<div class="hint">'+h(v.location||'')+'</div></td><td>'+h(v.officerName||'—')+'</td><td>'+h(src)+'</td><td>'+vehCell(v)+'</td><td>'+statusBadge(v.status)+'</td><td style="white-space:nowrap">'+rowActions(v)+'</td></tr>';
    }).join('')+'</tbody></table>';
}
function renderList(){
  var box=el('visitTable'), msg=el('listMsg');
  if(!box)return;
  var rows=VISITS.filter(isVisitScheduledOnly).slice().sort(function(a,b){
    return ((a.visitDate||'')+' '+(a.visitTime||'')).localeCompare((b.visitDate||'')+' '+(b.visitTime||''));
  });
  if(msg)msg.textContent=rows.length?(rows.length+' scheduled (not completed)'):'No scheduled visits waiting — tap Add visit to plan one.';
  if(!rows.length){box.innerHTML='<p class="hint">No scheduled visits waiting to be completed.</p>';return;}
  var showBr=!IS_STAFF && isAllBranches();
  box.innerHTML='<table class="mtbl" style="width:100%;border-collapse:collapse"><thead><tr>'+(showBr?'<th>Branch</th>':'')+'<th>Date</th><th>Time</th><th>Client</th><th>Officer</th><th>Vehicle / Driver</th><th>Status</th><th></th></tr></thead><tbody>'+
    rows.map(function(v){
      return '<tr>'+(showBr?'<td>'+h(v.branchId||'')+'</td>':'')+'<td>'+h(v.visitDate)+'</td><td>'+h(v.visitTime||'')+'</td><td>'+h(v.clientName)+'<div class="hint">'+h(v.location||'')+'</div></td><td>'+h(v.officerName||'—')+'</td><td>'+vehCell(v)+'</td><td>'+statusBadge(v.status)+(v.reminderCount?'<div class="hint">Reminders: '+v.reminderCount+'</div>':'')+'</td><td style="white-space:nowrap">'+rowActions(v)+'</td></tr>';
    }).join('')+'</tbody></table>';
}
function renderReportPick(){
  if(IS_MGMT){renderMgmtReport();return;}
  var box=el('reportPick'); if(!box)return;
  if(!VISITS.length){box.innerHTML='<p class="hint">Add a visit first.</p>';if(el('reportEdit'))el('reportEdit').classList.add('hidden');return;}
  box.innerHTML='<label class="m-lbl">Select visit</label><select class="m-inp" id="reportSel" onchange="openVisit(this.value,\\'report\\')" style="max-width:520px;display:block;margin-top:6px">'+
    VISITS.map(function(v){return '<option value="'+h(v.id)+'"'+(EDIT&&EDIT.id===v.id?' selected':'')+'>'+h(v.visitDate)+' · '+h(v.clientName)+' ('+h(statusLabel(v.status))+')</option>';}).join('')+'</select>';
  if(EDIT&&EDIT.id)paintForm(EDIT);
  else openVisit(VISITS[0].id,'report');
}
function branchNameOf(id){
  var b=(BRANCHES||[]).find(function(x){return x.id===id;});
  return (b&&b.name)||id||'—';
}
function renderMgmtReport(){
  var box=el('mgmtReportBody'); if(!box)return;
  var rows=VISITS.slice().sort(function(a,b){return ((a.visitDate||'')+' '+(a.visitTime||'')).localeCompare((b.visitDate||'')+' '+(b.visitTime||''));});
  var d=0,r=0,s=0,by={};
  rows.forEach(function(v){
    if(v.status==='Sent')s++;else if(v.status==='Reviewed')r++;else d++;
    var key=v.branchId||'—';
    if(!by[key])by[key]={branchId:key,total:0,draft:0,reviewed:0,sent:0};
    by[key].total++;
    if(v.status==='Sent')by[key].sent++;else if(v.status==='Reviewed')by[key].reviewed++;else by[key].draft++;
  });
  var branchRows=Object.keys(by).sort().map(function(k){
    var x=by[k];
    return '<tr><td>'+h(branchNameOf(x.branchId))+'</td><td class="c">'+x.total+'</td><td class="c">'+x.draft+'</td><td class="c">'+x.reviewed+'</td><td class="c">'+x.sent+'</td></tr>';
  }).join('');
  var html='<div class="m-kgrid" style="margin-bottom:12px"><div class="m-kpi t"><b>'+d+'</b><span>Draft</span></div><div class="m-kpi o"><b>'+r+'</b><span>Reviewed</span></div><div class="m-kpi s"><b>'+s+'</b><span>Sent to client</span></div><div class="m-kpi"><b>'+rows.length+'</b><span>Total visits</span></div></div>';
  html+='<h4 style="color:#fde68a;margin:0 0 8px">Branch-wise summary — '+h(MONTH)+'</h4>';
  if(!rows.length){
    box.innerHTML=html+'<p class="hint">No visits this month for the selected branch filter.</p>';
    if(el('reportEdit'))el('reportEdit').classList.add('hidden');
    return;
  }
  html+='<div style="overflow:auto;margin-bottom:14px"><table class="mtbl" style="width:100%;border-collapse:collapse"><thead><tr><th>Branch</th><th class="c">Total</th><th class="c">Draft</th><th class="c">Reviewed</th><th class="c">Sent</th></tr></thead><tbody>'+branchRows+'</tbody></table></div>';
  html+='<h4 style="color:#fde68a;margin:0 0 8px">Visit detail</h4>';
  html+='<div style="overflow:auto"><table class="mtbl" style="width:100%;border-collapse:collapse"><thead><tr><th>Branch</th><th>Date</th><th>Client</th><th>Officer</th><th>Vehicle / Driver</th><th>Status</th><th></th></tr></thead><tbody>'+
    rows.map(function(v){
      return '<tr><td>'+h(branchNameOf(v.branchId))+'</td><td>'+h(v.visitDate)+' '+h(v.visitTime||'')+'</td><td>'+h(v.clientName)+'<div class="hint">'+h(v.location||'')+'</div></td><td>'+h(v.officerName||'—')+'</td><td>'+vehCell(v)+'</td><td>'+statusBadge(v.status)+(v.sentToClientAt?'<div class="hint">Sent '+h(String(v.sentToClientAt).slice(0,16))+'</div>':'')+'</td><td style="white-space:nowrap">'+rowActions(v)+'</td></tr>';
    }).join('')+'</tbody></table></div>';
  box.innerHTML=html;
  if(EDIT&&EDIT.id)paintForm(EDIT);
}
function renderReview(){
  var box=el('reviewList'); if(!box)return;
  var rows=VISITS.slice().sort(function(a,b){return ((b.visitDate||'')+' '+(b.visitTime||'')).localeCompare((a.visitDate||'')+' '+(a.visitTime||''));});
  if(!rows.length){box.innerHTML='<p class="hint">No visits this month to open, review, save, or send.</p>';return;}
  box.innerHTML=rows.map(function(v){
    return '<div style="padding:12px;border:1px solid #334155;border-radius:10px;margin-bottom:10px;background:#0e1730">'+
      '<div style="font-weight:800;color:#e2e8f0">'+h(v.visitDate)+' · '+h(v.clientName)+(IS_MGMT?' · '+h(branchNameOf(v.branchId)):'')+'</div>'+
      '<div class="hint" style="margin-top:4px">'+statusBadge(v.status)+' · Officer: '+h(v.officerName||'—')+' · Person met: '+h(v.personMet||'—')+(v.sentToClientAt?' · Sent '+h(String(v.sentToClientAt).slice(0,16)):'')+'</div>'+
      '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">'+
      '<button type="button" class="m-btn m-btn-navy" onclick="openVisit(\\''+v.id+'\\',\\'report\\')">Open</button>'+
      '<button type="button" class="m-btn m-btn-navy" onclick="reviewVisit(\\''+v.id+'\\')">Review</button>'+
      '<button type="button" class="m-btn m-btn-green" onclick="saveReviewRow(\\''+v.id+'\\')">Save</button>'+
      '<button type="button" class="m-btn m-btn-green" onclick="sendVisit(\\''+v.id+'\\')">Send to client</button>'+
      (IS_MGMT&&v.status==='Draft'?'<button type="button" class="m-btn m-btn-grey" onclick="remindVisit(\\''+v.id+'\\')">Reminder</button>':'')+
      (IS_MGMT&&(v.status==='Reviewed'||v.status==='Sent')?'<button type="button" class="m-btn m-btn-grey" onclick="reopenVisit(\\''+v.id+'\\')">Reopen</button>':'')+
      '</div></div>';
  }).join('');
}
function renderAll(){
  renderKpis();
  renderSchedule();
  renderList();
  renderReview();
  if(IS_MGMT)renderMgmtReport();
}
function reloadAll(){
  MONTH=(el('monthPick')&&el('monthPick').value)||today().slice(0,7);
  var msg=el('calMsg'); if(msg)msg.textContent='Loading…';
  api('clientVisitBoot',{branchId:branchId(),month:MONTH}).then(function(res){
    if(res.s!==200){if(msg)msg.textContent=res.j.error||'Could not load';return;}
    BRANCH_ID=res.j.branchId||branchId();
    MONTH=res.j.month||MONTH;
    TODAY=res.j.today||today();
    VISITS=res.j.visits||[];
    CLIENTS=res.j.clients||[];
    STAFF=res.j.staff||[];
    BRANCHES=res.j.branches||BRANCHES;
    if(el('monthPick'))el('monthPick').value=MONTH;
    fillBranches();
    fillClients();
    fillOfficers();
    if(msg)msg.textContent=VISITS.length+' visit(s) this month'+(res.j.fetched?' · '+res.j.fetched+' from Mobile':'');
    if(!el('cv_date').value)el('cv_date').value=TODAY;
    renderAll();
  });
}
function loadMobile(){
  var d=el('mobDate')&&el('mobDate').value||today();
  el('syncMsg').textContent='Fetching from Mobile…';
  api('visits',{date:d,autoSync:true}).then(function(res){
    renderMobile(res);
  });
}
function syncMobile(){
  var d=el('mobDate')&&el('mobDate').value||today();
  el('syncMsg').textContent='Syncing Patrol Visit Report…';
  api('syncVisits',{date:d}).then(function(res){renderMobile(res);});
}
function renderMobile(res){
  if(res.s!==200&&res.status!==200){el('syncMsg').textContent=(res.j&&res.j.error)||'Could not load';return;}
  var body=res.j||res.body||{};
  var vis=body.visits||[], a=body.analysis||{};
  el('syncMsg').textContent=body.sync&&body.sync.saved?'✓ '+body.sync.saved+' patrol visits':'';
  el('mobKpis').innerHTML='<div class="m-kpi o"><b>'+vis.length+'</b><span>Branch visits</span></div><div class="m-kpi s"><b>'+(a.staffCount||0)+'</b><span>Staff active</span></div><div class="m-kpi t"><b>'+(a.metFiveTarget||0)+'</b><span>Met 5 day-visits</span></div>';
  el('mobAll').innerHTML=vis.map(function(v){
    return '<tr><td>'+h(v.user)+'</td><td>'+h(v.client)+'</td><td>'+h(v.unit)+'</td><td class="c">'+h(v.visitTime)+'</td><td>'+h(v.place||v.patrolPoint||'')+'</td></tr>';
  }).join('')||'<tr><td colspan="5" class="hint">No mobile visits — tap Sync.</td></tr>';
}
function applyBoot(j){
  if(!j)return;
  BRANCH_ID=j.branchId||branchId();
  BRANCH_NAME=j.branchName||BRANCH_NAME;
  MONTH=j.month||MONTH;
  TODAY=j.today||today();
  VISITS=j.visits||[];
  CLIENTS=j.clients||[];
  STAFF=j.staff||[];
  BRANCHES=j.branches||BRANCHES;
  if(el('monthPick'))el('monthPick').value=MONTH;
  fillBranches();
  fillClients();
  fillOfficers();
  if(el('cv_date')&&!el('cv_date').value)el('cv_date').value=TODAY;
  renderAll();
}
function fetchLatestVisits(){
  var msg=el('calMsg');
  if(!IS_STAFF && isAllBranches()){
    if(msg)msg.textContent='Pick one branch first, then Complete visit (Mobile app).';
    alert('Pick one branch (not All Branches), then tap Complete visit (Mobile app).');
    return;
  }
  if(msg)msg.textContent='Loading completed visits from Mobile app…';
  api('clientVisitFetchMobile',{branchId:branchId(),month:MONTH,days:7,autoSync:true}).then(function(res){
    if(res.s!==200){if(msg)msg.textContent=res.j.error||'Could not fetch';return;}
    applyBoot(res.j);
    var extra=res.j.synced?(' · '+res.j.synced+' new from Mobile'):'';
    if(msg)msg.textContent=(VISITS.filter(isVisitCompleted).length||0)+' completed visit(s)'+extra+(res.j.syncError?' · '+res.j.syncError:'');
  });
}
function bootClientVisit(){
  if(el('monthPick'))el('monthPick').value=today().slice(0,7);
  if(el('cv_date'))el('cv_date').value=today();
  if(el('mobDate'))el('mobDate').value=today();
  if(!IS_STAFF){
    api('clientVisitBoot',{month:today().slice(0,7),branchId:'ALL'}).then(function(res){
      if(res.s===200){BRANCHES=res.j.branches||[];BRANCH_ID=res.j.branchId||'ALL';fillBranches();}
      reloadAll();
    });
  } else reloadAll();
}
`
}

export function clientVisitStaffBootScript(): string {
  return `
function initStaffPage(j){
  STAFF_BRANCH_ID=(j&&j.branchId)||(typeof staffResolveBranchId==='function'?staffResolveBranchId():'');
  STAFF_BRANCH_NAME=(j&&j.branchName)||(typeof staffBranchLabel==='function'?staffBranchLabel():'');
  BRANCH_ID=STAFF_BRANCH_ID;
  BRANCH_NAME=STAFF_BRANCH_NAME;
  bootClientVisit();
}
`
}

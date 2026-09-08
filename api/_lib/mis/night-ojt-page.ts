/** Shared Night Visit / Training OJT page body + script */

export type NightOjtPageOpts = {
  kind: 'night' | 'training'
  portal: 'mgmt' | 'staff'
  activePath: string
  title: string
}

export function nightOjtInnerHtml(opts: NightOjtPageOpts): string {
  const isNight = opts.kind === 'night'
  const scheduleHint = isNight
    ? 'Upload the <b>monthly Night check schedule</b> (Excel, Word, PNG, or PDF). It will be shown below for all staff to view.'
    : 'Upload the <b>monthly Training (OJT) schedule</b> (Excel, Word, PNG, or PDF). It will be shown below.'
  const branchPick =
    opts.portal === 'mgmt'
      ? '<div><label class="m-lbl">Branch</label><select class="m-inp" id="branchSel" onchange="onBranchChange()"></select></div>'
      : ''
  return `
<div class="m-wrap" id="app">
  <div class="m-tabs noprint">
    <button type="button" class="m-tab active" id="tabSchedule" onclick="showTab('schedule')">📅 Schedule</button>
    <button type="button" class="m-tab" id="tabReport" onclick="showTab('report')">📝 Report</button>
  </div>
  <div id="paneSchedule" class="m-card">
    <div class="hint">${scheduleHint}</div>
    <div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:10px">
      ${branchPick}
      <div><label class="m-lbl">Month</label><input class="m-inp" type="month" id="schedMonth" onchange="loadSchedule()"></div>
      <div><label class="m-lbl">Upload file</label><input class="m-inp" type="file" id="schedFile" accept=".xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg,.pdf,.webp"></div>
      <div style="align-self:end"><button type="button" class="m-btn m-btn-gold" onclick="uploadSchedule()">Upload schedule</button></div>
    </div>
    <p id="schedMsg" class="hint" style="margin-top:10px"></p>
    <div id="schedPreview" style="margin-top:12px"></div>
  </div>
  <div id="paneReport" class="m-card hidden">
    <div class="hint">${isNight ? '<b>Night visit report</b> — date-wise entry.' : '<b>Training (OJT) report</b> — date-wise entry per unit.'}</div>
    <div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:10px">
      ${branchPick.replace('onBranchChange()', 'onBranchChange();loadReport()') || ''}
      <div><label class="m-lbl">Report date</label><input class="m-inp" type="date" id="reportDate" onchange="loadReport()"></div>
      <div style="align-self:end"><button type="button" class="m-btn m-btn-green" onclick="saveReport()">Save report</button></div>
    </div>
    <p id="reportMsg" class="hint" style="margin-top:8px"></p>
    <div id="reportForm" style="margin-top:12px"></div>
  </div>
</div>`
}

export function nightOjtScript(opts: NightOjtPageOpts): string {
  const isNight = opts.kind === 'night'
  const apiUrl = opts.portal === 'mgmt' ? '/api/mis/admin-data' : '/api/mis/staff-data'
  const isStaff = opts.portal === 'staff'
  return `
var KIND='${opts.kind}',API='${apiUrl}',IS_STAFF=${isStaff ? 'true' : 'false'};
var BRANCH_ID='',BRANCHES=[];
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function today(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});}
function api(action,extra){
  var payload=Object.assign({kind:KIND},extra||{});
  if(IS_STAFF&&typeof staffApi==='function'){
    return staffApi(action,payload).then(function(r){return{s:r.status,j:r.body};});
  }
  return fetch(API,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,kind:KIND},extra||{}))}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});
}
function showTab(t){
  el('tabSchedule').classList.toggle('active',t==='schedule');
  el('tabReport').classList.toggle('active',t==='report');
  el('paneSchedule').classList.toggle('hidden',t!=='schedule');
  el('paneReport').classList.toggle('hidden',t!=='report');
  if(t==='schedule')loadSchedule();else loadReport();
}
function onBranchChange(){
  var sel=el('branchSel');
  BRANCH_ID=sel&&sel.value?sel.value:(IS_STAFF&&typeof STAFF_BRANCH_ID!=='undefined'?STAFF_BRANCH_ID:'');
}
function initDates(){
  var m=today().slice(0,7);
  if(el('schedMonth'))el('schedMonth').value=m;
  if(el('reportDate'))el('reportDate').value=today();
}
function loadBranches(){
  return api('nightOjtBranches').then(function(res){
    if(res.s!==200)return;
    BRANCHES=res.j.branches||[];
    var sel=el('branchSel');
    if(!sel)return;
    var cur=BRANCH_ID||'ALL';
    var html='<option value="ALL"'+(cur==='ALL'?' selected':'')+'>All Branches</option>';
    BRANCHES.forEach(function(b){
      html+='<option value="'+h(b.id)+'"'+(String(cur)===String(b.id)?' selected':'')+'>'+h(b.name)+'</option>';
    });
    sel.innerHTML=html;
    if(!BRANCH_ID)BRANCH_ID='ALL';
    sel.value=BRANCH_ID||'ALL';
  });
}
function branchId(){return IS_STAFF?(typeof STAFF_BRANCH_ID!=='undefined'?STAFF_BRANCH_ID:BRANCH_ID):(el('branchSel')&&el('branchSel').value||BRANCH_ID);}
function loadSchedule(){
  var msg=el('schedMsg'),prev=el('schedPreview');
  if(!msg)return;
  msg.textContent='Loading…';
  api('nightOjtLoad',{tab:'schedule',month:el('schedMonth').value,branchId:branchId()}).then(function(res){
    if(res.s!==200){msg.textContent=res.j.error||'Could not load';prev.innerHTML='';return;}
    if(res.j.allBranches){
      var rows=(res.j.schedules||[]).filter(function(x){return x.schedule;});
      msg.textContent=rows.length?('All Branches · '+rows.length+' schedule(s) uploaded'):'All Branches · no schedules uploaded yet for this month.';
      if(!prev)return;
      if(!rows.length){prev.innerHTML='<p class="hint">Pick one branch to upload a schedule.</p>';return;}
      prev.innerHTML='<div class="mtblwrap"><table class="mtbl"><thead><tr><th>Branch</th><th>File</th><th>Uploaded</th></tr></thead><tbody>'+
        rows.map(function(x){return '<tr><td>'+h(x.branchName)+'</td><td>'+h(x.schedule.fileName||'')+'</td><td>'+h((x.schedule.uploadedAt||'').slice(0,10))+'</td></tr>';}).join('')+
        '</tbody></table></div><p class="hint">Pick one branch to open or upload a file.</p>';
      return;
    }
    msg.textContent=res.j.schedule?'Uploaded: '+h(res.j.schedule.fileName)+' · '+h((res.j.schedule.uploadedAt||'').slice(0,10)):'No schedule uploaded for this month yet.';
    renderSchedulePreview(res.j.schedule);
  });
}
function renderSchedulePreview(sch){
  var prev=el('schedPreview');
  if(!prev)return;
  if(!sch||!sch.dataBase64){prev.innerHTML='<p class="hint">No file yet — upload Excel, Word, or PNG above.</p>';return;}
  var mime=String(sch.mimeType||'').toLowerCase();
  var name=h(sch.fileName||'schedule');
  var data=sch.dataBase64;
  if(!data.includes(','))data='data:'+mime+';base64,'+data;
  if(mime.indexOf('image/')===0||/\\.png|\\.jpg|\\.jpeg|\\.webp/i.test(sch.fileName||'')){
    prev.innerHTML='<p class="hint"><b>'+name+'</b></p><img src="'+data+'" alt="Schedule" style="max-width:100%;border:1px solid #334155;border-radius:8px;background:#fff">';
    return;
  }
  if(mime.indexOf('pdf')>=0||/\\.pdf/i.test(sch.fileName||'')){
    prev.innerHTML='<p class="hint"><b>'+name+'</b></p><iframe src="'+data+'" style="width:100%;min-height:480px;border:1px solid #334155;border-radius:8px;background:#fff"></iframe><p style="margin-top:8px"><a class="m-btn m-btn-grey" href="'+data+'" download="'+name+'">Download PDF</a></p>';
    return;
  }
  prev.innerHTML='<p class="hint"><b>'+name+'</b> — open or download to view (Excel / Word).</p><a class="m-btn m-btn-gold" href="'+data+'" download="'+name+'">Download schedule</a>';
}
function uploadSchedule(){
  var f=el('schedFile')&&el('schedFile').files&&el('schedFile').files[0];
  var msg=el('schedMsg');
  var bid=branchId();
  if(!IS_STAFF&&(!bid||bid==='ALL')){if(msg)msg.textContent='Pick one branch (not All Branches), then upload.';alert('Pick one branch from the Branch list (not All Branches), then upload.');return;}
  if(!f){if(msg)msg.textContent='Choose a file first.';return;}
  if(msg)msg.textContent='Uploading…';
  var reader=new FileReader();
  reader.onload=function(){
    api('nightOjtUploadSchedule',{month:el('schedMonth').value,branchId:bid,fileName:f.name,mimeType:f.type||'application/octet-stream',data:reader.result}).then(function(res){
      if(res.s!==200){if(msg)msg.textContent=res.j.error||'Upload failed';return;}
      if(msg)msg.textContent='Schedule saved ✓';
      if(el('schedFile'))el('schedFile').value='';
      renderSchedulePreview(res.j.schedule);
    });
  };
  reader.readAsDataURL(f);
}
function loadReport(){
  var box=el('reportForm'),msg=el('reportMsg');
  if(!box)return;
  var bid=branchId();
  if(!IS_STAFF&&(!bid||bid==='ALL')){
    box.innerHTML='<p class="hint">Pick one branch (not All Branches) to open or save a report.</p>';
    if(msg)msg.textContent='All Branches — pick one branch to edit.';
    return;
  }
  box.innerHTML='<p class="hint">Loading…</p>';
  api('nightOjtLoad',{tab:'report',date:el('reportDate').value,branchId:bid}).then(function(res){
    if(res.s!==200){box.innerHTML='<p class="hint" style="color:#f87171">'+(res.j.error||'Could not load')+'</p>';return;}
    if(msg)msg.textContent='Editing report for '+h(res.j.date);
    ${isNight ? 'renderNightForm(res.j.report);' : 'renderTrainingForm(res.j.report);'}
  });
}
function fld(lbl,id,val,area){
  if(area)return '<div style="margin-bottom:10px"><label class="m-lbl">'+lbl+'</label><textarea class="m-inp" id="'+id+'" rows="3" style="width:100%">'+h(val||'')+'</textarea></div>';
  return '<div style="margin-bottom:10px"><label class="m-lbl">'+lbl+'</label><input class="m-inp" id="'+id+'" value="'+h(val||'')+'" style="width:100%"></div>';
}
function renderNightForm(r){
  r=r||{};
  el('reportForm').innerHTML=
    fld('Duty Officer name','nv_duty',r.dutyOfficerName)+
    fld('Driver name','nv_driver',r.driverName)+
    fld('Units visited (client list)','nv_units',r.unitsVisited,true)+
    fld('Observation','nv_obs',r.observation,true)+
    fld('Information','nv_info',r.information,true)+
    fld('Sleeping cases','nv_sleep',r.sleepingCases,true)+
    fld('ID Card validity','nv_id',r.idCardValidity,true)+
    fld('Turnout issue','nv_turn',r.turnoutIssue,true)+
    '<div style="margin-bottom:10px"><label class="m-lbl">Report sent to client?</label><select class="m-inp" id="nv_sent"><option value="">—</option><option value="Yes"'+(r.reportSentToClient==='Yes'?' selected':'')+'>Yes</option><option value="No"'+(r.reportSentToClient==='No'?' selected':'')+'>No</option></select></div>'+
    fld('Sent by (name)','nv_by',r.sentByName);
}
function collectNight(){
  return {
    dutyOfficerName:(el('nv_duty')&&el('nv_duty').value||'').trim(),
    driverName:(el('nv_driver')&&el('nv_driver').value||'').trim(),
    unitsVisited:(el('nv_units')&&el('nv_units').value||'').trim(),
    observation:(el('nv_obs')&&el('nv_obs').value||'').trim(),
    information:(el('nv_info')&&el('nv_info').value||'').trim(),
    sleepingCases:(el('nv_sleep')&&el('nv_sleep').value||'').trim(),
    idCardValidity:(el('nv_id')&&el('nv_id').value||'').trim(),
    turnoutIssue:(el('nv_turn')&&el('nv_turn').value||'').trim(),
    reportSentToClient:(el('nv_sent')&&el('nv_sent').value||''),
    sentByName:(el('nv_by')&&el('nv_by').value||'').trim()
  };
}
function renderTrainingForm(r){
  r=r||{};var rows=r.rows&&r.rows.length?r.rows:[{}];
  var head=
    fld('Training imparted by (name)','tr_by',r.trainingByName)+
    '<div style="margin-bottom:10px"><label class="m-lbl">Report sent to client?</label><select class="m-inp" id="tr_sent"><option value="">—</option><option value="Yes"'+(r.reportSentToClient==='Yes'?' selected':'')+'>Yes</option><option value="No"'+(r.reportSentToClient==='No'?' selected':'')+'>No</option></select></div>'+
    fld('Sent by (name)','tr_sender',r.sentByName)+
    '<h4 style="color:#fde68a;margin:14px 0 8px">Units trained</h4>';
  var tbl='<div class="mtblwrap"><table class="mtbl"><thead><tr><th>Unit name</th><th>Sanctioned</th><th>Attended</th><th>Topics</th><th>Observation</th><th>Information</th><th>Client complaint/suggestion</th><th>ID validity</th><th>Turnout</th></tr></thead><tbody id="tr_rows">';
  rows.forEach(function(row,i){tbl+=trainingRowHtml(i,row);});
  tbl+='</tbody></table></div><button type="button" class="m-btn m-btn-grey" style="margin-top:8px" onclick="addTrainingRow()">+ Add unit row</button>';
  el('reportForm').innerHTML=head+tbl;
}
function trainingRowHtml(i,row){
  row=row||{};
  function c(id,v){return '<td><input class="m-inp" data-tr="'+id+'" data-i="'+i+'" value="'+h(v||'')+'"></td>';}
  return '<tr>'+c('unit',row.unitName)+c('san',row.sanctionedPosts)+c('att',row.trainingAttended)+c('top',row.trainingTopics)+c('obs',row.observation)+c('inf',row.information)+c('cmp',row.clientComplaintSuggestion)+c('id',row.idCardValidity)+c('turn',row.turnoutIssue)+'</tr>';
}
function addTrainingRow(){
  var tb=el('tr_rows');if(!tb)return;
  var i=tb.querySelectorAll('tr').length;
  tb.insertAdjacentHTML('beforeend',trainingRowHtml(i,{}));
}
function collectTraining(){
  var rows=[];
  var tb=el('tr_rows');
  if(tb){
    tb.querySelectorAll('tr').forEach(function(tr){
      var get=function(k){var inp=tr.querySelector('[data-tr="'+k+'"]');return inp?String(inp.value||'').trim():'';};
      rows.push({
        unitName:get('unit'),sanctionedPosts:get('san'),trainingAttended:get('att'),trainingTopics:get('top'),
        observation:get('obs'),information:get('inf'),clientComplaintSuggestion:get('cmp'),
        idCardValidity:get('id'),turnoutIssue:get('turn')
      });
    });
  }
  return {
    trainingByName:(el('tr_by')&&el('tr_by').value||'').trim(),
    reportSentToClient:(el('tr_sent')&&el('tr_sent').value||''),
    sentByName:(el('tr_sender')&&el('tr_sender').value||'').trim(),
    rows:rows
  };
}
function saveReport(){
  var msg=el('reportMsg');
  var bid=branchId();
  if(!IS_STAFF&&(!bid||bid==='ALL')){if(msg)msg.textContent='Pick one branch (not All Branches), then save.';alert('Pick one branch from the Branch list (not All Branches), then save.');return;}
  if(msg)msg.textContent='Saving…';
  var payload={date:el('reportDate').value,branchId:bid,report:${isNight ? 'collectNight()' : 'collectTraining()'}};
  api('nightOjtSaveReport',payload).then(function(res){
    if(res.s!==200){if(msg)msg.textContent=res.j.error||'Save failed';return;}
    if(msg)msg.textContent='Report saved ✓';
  });
}
function bootNightOjt(){
  initDates();
  var chain=Promise.resolve();
  if(!IS_STAFF)chain=loadBranches();
  chain.then(function(){loadSchedule();});
}
`
}

export function nightOjtStaffBootScript(): string {
  return `
function initStaffPage(j){
  STAFF_BRANCH_ID=(j&&j.branchId)||(typeof staffResolveBranchId==='function'?staffResolveBranchId():'');
  STAFF_BRANCH_NAME=(j&&j.branchName)||(typeof staffBranchLabel==='function'?staffBranchLabel():'');
  bootNightOjt();
}
`
}

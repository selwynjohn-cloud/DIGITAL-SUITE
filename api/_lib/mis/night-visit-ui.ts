/** Night Visit — calendar schedule, day-of route, WhatsApp, per-client HOD reports. */

export type NightVisitPageOpts = {
  portal: 'mgmt' | 'staff'
  activePath: string
  title: string
}

export function nightVisitInnerHtml(opts: NightVisitPageOpts): string {
  const branchPick =
    opts.portal === 'mgmt'
      ? '<div><label class="m-lbl">Branch</label><select class="m-inp" id="branchSel" onchange="onBranchChange()"></select></div>'
      : ''
  const isMgmt = opts.portal === 'mgmt'
  return `
<div class="m-wrap" id="app">
  <style>
  .nv-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:12px}
  .nv-cal .hd{text-align:center;font-size:11px;font-weight:800;color:#94a3b8;padding:4px}
  .nv-cal .day{min-height:72px;background:#0e1730;border:1px solid #22304f;border-radius:8px;padding:6px;cursor:pointer}
  .nv-cal .day:hover{border-color:#c9a84c}
  .nv-cal .day.mute{opacity:.35;cursor:default}
  .nv-cal .day .n{font-weight:800;color:#fde68a;font-size:13px}
  .nv-cal .pill{margin-top:4px;font-size:11px;padding:2px 5px;border-radius:5px;background:#1e3a5f;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .nv-cal .pill.ok{background:#14532d;color:#bbf7d0}
  .nv-cal .pill.warn{background:#7c2d12;color:#fed7aa}
  .wa-badge{display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:800}
  .wa-badge.sent{background:#14532d;color:#bbf7d0}
  .wa-badge.not{background:#3f3f46;color:#e4e4e7}
  .wa-badge.fail{background:#7f1d1d;color:#fecaca}
  .nv-toggle{display:inline-flex;align-items:center;gap:10px;cursor:pointer;user-select:none}
  .nv-toggle input{position:absolute;opacity:0;width:0;height:0}
  .nv-toggle-ui{width:46px;height:26px;border-radius:999px;background:#334155;border:1px solid #475569;position:relative;transition:.15s;flex-shrink:0}
  .nv-toggle-ui:after{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#e2e8f0;transition:.15s}
  .nv-toggle input:checked+.nv-toggle-ui{background:#14532d;border-color:#22c55e}
  .nv-toggle input:checked+.nv-toggle-ui:after{left:22px;background:#bbf7d0}
  .nv-toggle-lbl{font-weight:800;color:#fde68a;font-size:14px}
  </style>

  <div class="m-card" style="border-color:#4ade80">
    <h3 style="color:#86efac;margin:0 0 8px">Site Security Visit Report: Day / Night Check</h3>
    <p class="hint" style="margin:0 0 10px">Visit report for security lapses and observations (not an assessment). Ops use the public mobile link. Schedule / route / WhatsApp stay below for Night Check duty planning.</p>
    <p style="margin:0 0 10px"><b style="color:#fde68a">Public link (Android &amp; iPhone):</b><br>
      <a href="https://www.agilegroup-digital.co.in/mis-site-visit-report" target="_blank" rel="noopener" style="color:#7dd3fc;word-break:break-all">https://www.agilegroup-digital.co.in/mis-site-visit-report</a>
    </p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <a class="m-btn m-btn-green" href="https://www.agilegroup-digital.co.in/mis-site-visit-report" target="_blank" rel="noopener" style="text-decoration:none;min-width:180px">Start Visit</a>
      <button type="button" class="m-btn m-btn-navy" onclick="loadSiteVisitReports()">Refresh submitted list</button>
    </div>
    <div id="siteVisitList" style="margin-top:14px"></div>
  </div>

  <div class="m-tabs noprint">
    <button type="button" class="m-tab active" id="tabCalendar" onclick="showTab('calendar')">📅 Calendar</button>
    <button type="button" class="m-tab" id="tabList" onclick="showTab('list')">📋 Schedule list</button>
    <button type="button" class="m-tab" id="tabRoute" onclick="showTab('route')">🗺️ Route (day of)</button>
    <button type="button" class="m-tab" id="tabWa" onclick="showTab('wa')">💬 WhatsApp</button>
    <button type="button" class="m-tab" id="tabAllot" onclick="showTab('allot')">🚗 Duty allotment</button>
    <button type="button" class="m-tab" id="tabReport" onclick="showTab('report')">📝 Client reports</button>
  </div>

  <div id="paneCalendar" class="m-card">
    <h3>Night check calendar</h3>
    <p class="hint">Tap a date to schedule, or tap <b>Add Night visit</b>. Enter <b>date, time</b> and <b>Duty Officer name</b>. Client route is added only on the night-check day (so unit guards are not alerted early).</p>
    <div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:10px">
      ${branchPick}
      <div><label class="m-lbl">Month</label><input class="m-inp" type="month" id="monthPick" onchange="reloadAll()"></div>
      <div><label class="m-lbl">Date</label><input class="m-inp" type="date" id="scheduleDatePick"></div>
    </div>
    <div style="margin:12px 0 8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <button type="button" class="m-btn m-btn-gold" onclick="addNightVisit()">+ Add Night visit</button>
    </div>
    <div class="nv-cal" id="calGrid"></div>
    <p id="calMsg" class="hint" style="margin-top:10px"></p>

    <div id="schedForm" class="m-card hidden" style="margin-top:16px;border-color:#c9a84c">
      <h4 id="schedFormTitle">Add Night schedule</h4>
      <input type="hidden" id="sf_id">
      <div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:10px">
        <div><label class="m-lbl">Visit date</label><input class="m-inp" type="date" id="sf_date"></div>
        <div><label class="m-lbl">From (usually 22:00)</label><input class="m-inp" type="time" id="sf_start" value="22:00"></div>
        <div><label class="m-lbl">To (usually 05:00 next day)</label><input class="m-inp" type="time" id="sf_end" value="05:00"></div>
        <div><label class="m-lbl">Duty Officer Name</label><input class="m-inp" id="sf_officer" placeholder="Officer name"></div>
        <div><label class="m-lbl">Duty Officer WhatsApp</label><input class="m-inp" id="sf_phone" placeholder="10-digit mobile"></div>
      </div>
      <div style="margin-top:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <label class="nv-toggle" title="When ON, Save schedule also creates a new visit in Agile Control for vehicle allotment">
          <input type="checkbox" id="sf_vehicleReq">
          <span class="nv-toggle-ui"></span>
          <span class="nv-toggle-lbl">Vehicle Requirement</span>
        </label>
        <span id="sf_vehicleHint" class="hint" style="margin:0"></span>
      </div>
      <p class="hint" style="margin-top:8px">Route / client list is filled on the visit day under <b>Route (day of)</b>. WhatsApp goes out automatically at <b>4:00 pm</b> that evening. If Vehicle Requirement is ON, Save also copies a <b>new visit to Agile Control</b>.</p>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="m-btn m-btn-green" onclick="saveSchedule()">Save schedule</button>
        <button type="button" class="m-btn m-btn-red" id="sf_cancelBtn" onclick="openCancelFromForm()">Cancel schedule</button>
        <button type="button" class="m-btn m-btn-grey" onclick="closeScheduleForm()">Close</button>
      </div>
      <p id="sfMsg" class="hint" style="margin-top:8px"></p>
    </div>
  </div>

  <div id="paneList" class="m-card hidden">
    <h3>Night check schedule list</h3>
    <p class="hint">All schedules added for this branch / month (same list is copied to <b>Agile Fleet → Driver Night Check Duty</b> on HOD and Management).</p>
    <p id="listMsg" class="hint"></p>
    <div id="schedListTable" style="overflow:auto;margin-top:10px"></div>
  </div>

  <div id="paneRoute" class="m-card hidden">
    <h3>Route — night check day only</h3>
    <p class="hint">On the evening of the night check, add the client list with map directions. This list is what goes in the 4:00 pm WhatsApp.</p>
    <div id="routePick"></div>
    <div id="routeEdit" class="hidden" style="margin-top:12px">
      <p id="routeDayHint" class="hint"></p>
      <div id="routeStops"></div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="m-btn m-btn-grey" onclick="addRouteStop()">+ Add client</button>
        <button type="button" class="m-btn m-btn-green" onclick="saveRoute()">Save route</button>
      </div>
      <p id="routeMsg" class="hint" style="margin-top:8px"></p>
    </div>
  </div>

  <div id="paneWa" class="m-card hidden">
    <h3>WhatsApp — 4:00 pm auto + Reminder</h3>
    <p class="hint">First <b>Save route</b> on the Route tab. Then here you can <b>Preview</b> the exact WhatsApp message, see <b>Message sent / not sent</b>, press <b>Send now</b> or <b>Reminder</b>. Auto-send is at <b>4:00 pm</b> on the night-check day.</p>
    <div id="waList"></div>
    <pre id="waPreview" class="hidden" style="white-space:pre-wrap;margin-top:14px;padding:14px;border-radius:10px;background:#0b1220;border:1px solid #c9a84c;color:#e2e8f0;font-size:14px;line-height:1.55"></pre>
  </div>

  <div id="paneAllot" class="m-card hidden">
    <h3>Duty allotment</h3>
    <p class="hint">${
      isMgmt
        ? 'Corporate assigns <b>Duty Driver</b> and <b>vehicle number</b> (Cancel clears allotment).'
        : 'Corporate assigns Duty Driver and vehicle. Branch can view here.'
    }</p>
    <p id="allotMsg" class="hint"></p>
    <div id="allotList"></div>
  </div>

  <div id="paneReport" class="m-card hidden">
    <h3>Client reports — post-wise</h3>
    <p class="hint">Every client on the route has a report. Fill → <b>Save</b> → HOD <b>Review</b> → <b>Send to client</b> (night check + post-wise observations).</p>
    <div id="reportPick"></div>
    <div id="reportEdit" class="hidden" style="margin-top:14px">
      <input type="hidden" id="rp_sessionId">
      <input type="hidden" id="rp_stopId">
      <div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
        <div><label class="m-lbl">Client</label><input class="m-inp" id="rp_client" readonly></div>
        <div><label class="m-lbl">Client email</label><input class="m-inp" id="rp_email" type="email"></div>
        <div><label class="m-lbl">Report date</label><input class="m-inp" type="date" id="rp_date"></div>
      </div>
      <div style="margin-top:10px"><label class="m-lbl">General observation</label><textarea class="m-inp" id="rp_obs" rows="3" style="width:100%"></textarea></div>
      <div style="margin-top:10px"><label class="m-lbl">Information</label><textarea class="m-inp" id="rp_info" rows="2" style="width:100%"></textarea></div>
      <div style="margin-top:10px"><label class="m-lbl">Sleeping cases</label><textarea class="m-inp" id="rp_sleep" rows="2" style="width:100%"></textarea></div>
      <div style="margin-top:10px"><label class="m-lbl">ID Card validity</label><textarea class="m-inp" id="rp_id" rows="2" style="width:100%"></textarea></div>
      <div style="margin-top:10px"><label class="m-lbl">Turnout issue</label><textarea class="m-inp" id="rp_turn" rows="2" style="width:100%"></textarea></div>
      <h4 style="margin:14px 0 8px;color:#fde68a">Post-wise observations</h4>
      <div id="rp_posts"></div>
      <button type="button" class="m-btn m-btn-grey" style="margin-top:8px" onclick="addPostRow()">+ Add post</button>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="m-btn m-btn-green" onclick="saveClientReport()">Save report</button>
        <button type="button" class="m-btn m-btn-navy" onclick="hodApprove()">HOD Review / Approve</button>
        <button type="button" class="m-btn m-btn-grey" onclick="previewClientReport()">Preview</button>
        <button type="button" class="m-btn m-btn-gold" onclick="sendClientReport()">Send to client</button>
      </div>
      <p id="rpMsg" class="hint" style="margin-top:8px"></p>
      <pre id="rpPreview" class="hidden" style="white-space:pre-wrap;margin-top:12px;padding:12px;border-radius:8px;background:#0b1220;border:1px solid #334155;color:#e2e8f0;font-size:13px;line-height:1.5"></pre>
    </div>
  </div>

  <div id="cancelModal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:50;align-items:center;justify-content:center;padding:16px">
    <div class="m-card" style="max-width:420px;width:100%;margin:0">
      <h4>Cancel Night schedule</h4>
      <input type="hidden" id="cancelId">
      <label class="m-lbl">Reason</label>
      <textarea class="m-inp" id="cancelReason" rows="3" style="width:100%;margin-top:6px"></textarea>
      <div style="margin-top:12px;display:flex;gap:8px">
        <button type="button" class="m-btn m-btn-red" onclick="confirmCancel()">Cancel schedule</button>
        <button type="button" class="m-btn m-btn-grey" onclick="closeCancel()">Close</button>
      </div>
      <p id="cancelMsg" class="hint" style="margin-top:8px"></p>
    </div>
  </div>
</div>`
}

export function nightVisitScript(opts: NightVisitPageOpts): string {
  const apiUrl = opts.portal === 'mgmt' ? '/api/mis/admin-data' : '/api/mis/staff-data'
  const isStaff = opts.portal === 'staff'
  const isMgmt = opts.portal === 'mgmt'
  return `
var API='${apiUrl}',IS_STAFF=${isStaff ? 'true' : 'false'},IS_MGMT=${isMgmt ? 'true' : 'false'};
var BRANCH_ID='',BRANCH_NAME='',MONTH='',TODAY='',SESSIONS=[],CLIENTS=[],STAFF=[],BRANCHES=[],REPORT_ITEMS=[];
var DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
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
  var tabs=['calendar','list','route','wa','allot','report'];
  tabs.forEach(function(name){
    var tab=el('tab'+name.charAt(0).toUpperCase()+name.slice(1));
    var pane=el('pane'+name.charAt(0).toUpperCase()+name.slice(1));
    if(tab)tab.classList.toggle('active',t===name);
    if(pane)pane.classList.toggle('hidden',t!==name);
  });
  if(t==='calendar')renderCal();
  if(t==='list')renderScheduleList();
  if(t==='route')renderRoutePick();
  if(t==='wa')renderWa();
  if(t==='allot')renderAllot();
  if(t==='report')renderReportPick();
}
function onBranchChange(){ BRANCH_ID=el('branchSel')&&el('branchSel').value||BRANCH_ID; reloadAll(); }
function statusLabel(st){
  if(st==='RouteReady')return 'Route ready';
  if(st==='TeamNotified')return 'WA notified';
  if(st==='Completed')return 'Completed';
  if(st==='Cancelled')return 'Cancelled';
  return 'Scheduled';
}
function waBadge(status){
  if(status==='sent')return '<span class="wa-badge sent">Message sent</span>';
  if(status==='failed')return '<span class="wa-badge fail">Message failed</span>';
  return '<span class="wa-badge not">Message not sent</span>';
}
function reloadAll(){
  MONTH=(el('monthPick')&&el('monthPick').value)||today().slice(0,7);
  var msg=el('calMsg'); if(msg)msg.textContent='Loading…';
  api('nightVisitBoot',{branchId:branchId(),month:MONTH}).then(function(res){
    if(res.s!==200){if(msg)msg.textContent=res.j.error||'Could not load';return;}
    BRANCH_ID=res.j.branchId||branchId();
    BRANCH_NAME=res.j.branchName||'';
    MONTH=res.j.month||MONTH;
    TODAY=res.j.today||today();
    SESSIONS=res.j.sessions||[];
    CLIENTS=res.j.clients||[];
    STAFF=res.j.staff||[];
    BRANCHES=res.j.branches||BRANCHES;
    if(el('monthPick'))el('monthPick').value=MONTH;
    fillBranches();
    if(msg)msg.textContent=SESSIONS.length+' schedule(s) this month · Route only on visit day · WA at 4:00 pm';
    renderCal();
    renderScheduleList();
    renderRoutePick();
    renderWa();
    renderAllot();
    renderReportPick();
    loadSiteVisitReports();
  });
}
function loadSiteVisitReports(){
  var box=el('siteVisitList'); if(!box)return;
  box.innerHTML='<p class="hint">Loading visit reports…</p>';
  api('nightVisitSiteReportList',{branchId:branchId()}).then(function(res){
    if(res.s!==200){box.innerHTML='<p class="hint">'+(res.j&&res.j.error?res.j.error:'Could not load visit reports')+'</p>';return;}
    var rows=res.j.reports||[];
    if(!rows.length){box.innerHTML='<p class="hint">No Day / Night Check visit reports submitted yet. Use the public link or Start Visit.</p>';return;}
    var h='';
    rows.forEach(function(r){
      var typ=r.visitType==='night'?'Night Check':'Day Check';
      h+='<div style="border:1px solid #22304f;border-radius:10px;padding:12px;margin:8px 0;background:#0b1220">';
      h+='<b style="color:#fde68a">'+typ+'</b> · <span style="color:#cbd5e1">'+(r.unitName||'—')+'</span><br>';
      h+='<span class="hint">'+(r.branchName||'')+(r.unitLocation?' — '+r.unitLocation:'')+'</span><br>';
      h+='<span class="hint">Officer: '+(r.officerName||'—')+' · '+(r.visitDate||'')+' '+(r.visitTime||'')+'</span><br>';
      if(r.overallStatus)h+='<span class="hint">Status: '+r.overallStatus+'</span><br>';
      if(r.geoLat!=null&&r.geoLng!=null){
        h+='<b style="color:#7dd3fc">GPS:</b> '+Number(r.geoLat).toFixed(5)+', '+Number(r.geoLng).toFixed(5);
        h+=' <a href="https://maps.google.com/?q='+encodeURIComponent(String(r.geoLat)+','+String(r.geoLng))+'" target="_blank" rel="noopener" style="color:#7dd3fc">Map</a><br>';
      }
      if(r.keyObservations)h+='<p class="hint" style="margin-top:6px">'+String(r.keyObservations).slice(0,180)+'</p>';
      h+='</div>';
    });
    box.innerHTML=h;
  });
}
function renderScheduleList(){
  var box=el('schedListTable'), msg=el('listMsg');
  if(!box)return;
  var rows=SESSIONS.slice().sort(function(a,b){return (a.visitDate+a.visitTimeStart).localeCompare(b.visitDate+b.visitTimeStart);});
  if(msg)msg.textContent=rows.length? (rows.length+' schedule(s) for '+h(MONTH)):'No schedules added yet — use Calendar to add.';
  if(!rows.length){box.innerHTML='<p class="hint">No schedules this month.</p>';return;}
  box.innerHTML='<table class="mtbl" style="width:100%;border-collapse:collapse"><thead><tr><th>Visit date</th><th>Window</th><th>Duty Officer</th><th>Driver / Vehicle</th><th>Vehicle Req.</th><th>Status</th><th>WhatsApp</th><th></th></tr></thead><tbody>'+
    rows.map(function(s){
      var duty=(s.driverName||s.vehicleRegNo)?(h(s.driverName||'—')+' / '+h(s.vehicleRegNo||'—')):'— not allotted';
      var wa=s.waAutoStatus==='sent'?'Sent':(s.waAutoStatus==='failed'?'Failed':'Not sent');
      var veh=s.vehicleRequired?(s.controlCaseNo?('Yes · '+h(s.controlCaseNo)):'Yes'):'No';
      var actions=s.status!=='Cancelled'&&s.status!=='Completed'
        ? '<button type="button" class="m-btn m-btn-grey" style="margin:2px" onclick="editSchedule(\\''+s.id+'\\')">Edit</button>'+
          '<button type="button" class="m-btn m-btn-red" style="margin:2px" onclick="openCancel(\\''+s.id+'\\')">Cancel</button>'
        : '<span class="hint">'+h(statusLabel(s.status))+'</span>';
      return '<tr><td>'+h(s.visitDate)+'</td><td>'+h(s.visitTimeStart||'22:00')+' → '+h(s.visitTimeEnd||'05:00')+'</td><td>'+h(s.dutyOfficerName)+'</td><td>'+duty+'</td><td>'+veh+'</td><td>'+h(statusLabel(s.status))+'</td><td>'+h(wa)+'</td><td style="white-space:nowrap">'+actions+'</td></tr>';
    }).join('')+'</tbody></table>';
}
function editSchedule(id){
  var s=SESSIONS.find(function(x){return x.id===id;});
  if(!s)return;
  showTab('calendar');
  openScheduleForm(s);
}
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
function renderCal(){
  var grid=el('calGrid'); if(!grid)return;
  var parts=MONTH.split('-'); var y=+parts[0], m=+parts[1]-1;
  var first=new Date(y,m,1); var start=first.getDay();
  var daysIn=new Date(y,m+1,0).getDate();
  var byDate={};
  SESSIONS.forEach(function(s){ var d=s.visitDate; if(!byDate[d])byDate[d]=[]; byDate[d].push(s); });
  var html=DAYS.map(function(d){return '<div class="hd">'+d+'</div>';}).join('');
  for(var i=0;i<start;i++) html+='<div class="day mute"></div>';
  for(var day=1;day<=daysIn;day++){
    var ymd=MONTH+'-'+(day<10?'0':'')+day;
    var items=(byDate[ymd]||[]).map(function(s){
      var cls=s.status==='Cancelled'?'warn':(s.waAutoStatus==='sent'?'ok':'');
      return '<div class="pill '+cls+'" data-id="'+h(s.id)+'">'+h(s.dutyOfficerName||'Officer')+' · '+h(s.visitTimeStart||'')+'</div>';
    }).join('');
    html+='<div class="day" data-day="'+ymd+'"><div class="n">'+day+'</div>'+items+'</div>';
  }
  grid.innerHTML=html;
  grid.querySelectorAll('[data-id]').forEach(function(node){
    node.addEventListener('click',function(ev){
      ev.stopPropagation();
      var s=SESSIONS.find(function(x){return x.id===node.getAttribute('data-id');});
      if(s)openScheduleForm(s);
    });
  });
  grid.querySelectorAll('[data-day]').forEach(function(node){
    node.addEventListener('click',function(){ openNewForDate(node.getAttribute('data-day')); });
  });
}
function openNewForDate(ymd){
  if(isAllBranches()){
    alert('Pick one branch (not All Branches), then add a Night schedule.');
    return;
  }
  if(el('scheduleDatePick'))el('scheduleDatePick').value=ymd;
  openScheduleForm(null,ymd);
}
function addNightVisit(){
  if(isAllBranches()){
    alert('Pick one branch (not All Branches), then Add Night visit.');
    return;
  }
  var ymd=(el('scheduleDatePick')&&el('scheduleDatePick').value)||TODAY||today();
  if(el('scheduleDatePick'))el('scheduleDatePick').value=ymd;
  openScheduleForm(null,ymd);
}
function openScheduleForm(s,presetDate){
  el('schedForm').classList.remove('hidden');
  el('schedFormTitle').textContent=s&&s.id?'Edit Night visit':'Add Night visit';
  el('sf_id').value=s&&s.id?s.id:'';
  el('sf_date').value=(s&&s.visitDate)||presetDate||(el('scheduleDatePick')&&el('scheduleDatePick').value)||TODAY||today();
  el('sf_start').value=(s&&s.visitTimeStart)||'22:00';
  el('sf_end').value=(s&&s.visitTimeEnd)||'05:00';
  el('sf_officer').value=(s&&s.dutyOfficerName)||'';
  el('sf_phone').value=(s&&s.dutyOfficerPhone)||'';
  if(el('sf_vehicleReq'))el('sf_vehicleReq').checked=!!(s&&s.vehicleRequired);
  if(el('sf_vehicleHint'))el('sf_vehicleHint').textContent=(s&&s.controlCaseNo)?('Control: '+s.controlCaseNo):'';
  el('sfMsg').textContent='';
  el('sf_cancelBtn').style.display=(s&&s.id&&s.status!=='Cancelled')?'inline-block':'none';
  el('schedForm').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function closeScheduleForm(){el('schedForm').classList.add('hidden');}
function saveSchedule(){
  if(isAllBranches()){
    var m=el('sfMsg'); if(m)m.textContent='Pick one branch (not All Branches), then save.';
    alert('Pick one branch from the Branch list (not All Branches), then save the schedule.');
    return;
  }
  var msg=el('sfMsg'); msg.textContent='Saving…';
  var session={
    id:el('sf_id').value||undefined,
    visitDate:el('sf_date').value,
    visitTimeStart:el('sf_start').value||'22:00',
    visitTimeEnd:el('sf_end').value||'05:00',
    dutyOfficerName:el('sf_officer').value.trim(),
    dutyOfficerPhone:el('sf_phone').value.trim(),
    vehicleRequired:!!(el('sf_vehicleReq')&&el('sf_vehicleReq').checked)
  };
  api('nightVisitSaveSession',{branchId:branchId(),month:MONTH,session:session}).then(function(res){
    if(res.s!==200){msg.textContent=res.j.error||'Save failed';return;}
    msg.textContent='Schedule saved ✓'+(res.j.controlNote?' · '+res.j.controlNote:'');
    if(el('sf_vehicleHint')&&res.j.session&&res.j.session.controlCaseNo)el('sf_vehicleHint').textContent='Control: '+res.j.session.controlCaseNo;
    closeScheduleForm();
    reloadAll();
  });
}
function openCancelFromForm(){ openCancel(el('sf_id').value); }
function openCancel(id){
  if(!id)return;
  el('cancelModal').classList.remove('hidden');
  el('cancelModal').style.display='flex';
  el('cancelId').value=id;
  el('cancelReason').value='';
  el('cancelMsg').textContent='';
}
function closeCancel(){ el('cancelModal').classList.add('hidden'); el('cancelModal').style.display='none'; }
function confirmCancel(){
  var id=el('cancelId').value, reason=el('cancelReason').value.trim(), msg=el('cancelMsg');
  if(!reason){msg.textContent='Enter a reason.';return;}
  msg.textContent='Cancelling…';
  api('nightVisitCancelSession',{branchId:branchId(),month:MONTH,sessionId:id,cancelReason:reason}).then(function(res){
    if(res.s!==200){msg.textContent=res.j.error||'Failed';return;}
    closeCancel(); closeScheduleForm(); reloadAll();
  });
}
function openSessions(){ return SESSIONS.filter(function(s){return s.status!=='Cancelled';}); }
function renderRoutePick(){
  var box=el('routePick'); if(!box)return;
  var open=openSessions();
  if(!open.length){box.innerHTML='<p class="hint">No schedules. Add from Calendar first.</p>';el('routeEdit').classList.add('hidden');return;}
  box.innerHTML='<label class="m-lbl">Select schedule</label><select class="m-inp" id="routeSel" onchange="loadRouteEditor()" style="max-width:520px;display:block;margin-top:6px">'+
    open.map(function(s){return '<option value="'+h(s.id)+'">'+h(s.visitDate)+' · '+h(s.dutyOfficerName)+' ('+h(statusLabel(s.status))+')</option>';}).join('')+'</select>';
  loadRouteEditor();
}
function loadRouteEditor(){
  var id=el('routeSel')&&el('routeSel').value;
  var s=SESSIONS.find(function(x){return x.id===id;});
  if(!s){el('routeEdit').classList.add('hidden');return;}
  el('routeEdit').classList.remove('hidden');
  var isDay=s.visitDate===TODAY;
  el('routeDayHint').innerHTML=isDay
    ? '<b style="color:#4ade80">Today is the night-check day</b> — add clients and map directions, then Save route.'
    : 'Route unlocks on <b>'+h(s.visitDate)+'</b> (today is '+h(TODAY)+'). You can prepare only on that day.';
  var stops=(s.stops&&s.stops.length)?s.stops:[{}];
  renderRouteStops(stops);
  if(!isDay&&!(s.stops&&s.stops.length)){
    el('routeMsg').textContent='Come back on the visit day to enter the route.';
  } else el('routeMsg').textContent='';
}
function renderRouteStops(stops){
  var box=el('routeStops');
  var opts=CLIENTS.map(function(c){return '<option value="'+h(c.name)+'" data-id="'+h(c.id)+'" data-loc="'+h(c.location||'')+'" data-map="'+h(c.mapUrl||'')+'"></option>';}).join('');
  box.innerHTML='<datalist id="routeClientList">'+opts+'</datalist>'+stops.map(function(st,i){
    return '<div class="fgrid" style="display:grid;grid-template-columns:2fr 1.5fr 2fr auto;gap:8px;margin-bottom:8px;align-items:end" data-ri="'+i+'">'+
      '<div><label class="m-lbl">Client</label><input class="m-inp rs_name" list="routeClientList" value="'+h(st.clientName||'')+'" onchange="fillStopFromClient(this)"></div>'+
      '<div><label class="m-lbl">Location</label><input class="m-inp rs_loc" value="'+h(st.location||'')+'"></div>'+
      '<div><label class="m-lbl">Map link</label><input class="m-inp rs_map" value="'+h(st.mapUrl||'')+'" placeholder="Google Maps URL"></div>'+
      '<div><label class="m-lbl">Email</label><input class="m-inp rs_email" value="'+h(st.clientEmail||'')+'" placeholder="client@"></div>'+
      '<input type="hidden" class="rs_id" value="'+h(st.id||'')+'"><input type="hidden" class="rs_cid" value="'+h(st.clientId||'')+'">'+
      '</div>';
  }).join('');
}
function fillStopFromClient(inp){
  var name=inp.value; var c=CLIENTS.find(function(x){return x.name===name;});
  if(!c)return;
  var row=inp.closest('[data-ri]');
  if(!row)return;
  row.querySelector('.rs_loc').value=c.location||'';
  row.querySelector('.rs_map').value=c.mapUrl||'';
  row.querySelector('.rs_cid').value=c.id||'';
}
function addRouteStop(){
  var cur=[];
  el('routeStops').querySelectorAll('[data-ri]').forEach(function(row){
    cur.push({
      id:row.querySelector('.rs_id').value,
      clientId:row.querySelector('.rs_cid').value,
      clientName:row.querySelector('.rs_name').value,
      location:row.querySelector('.rs_loc').value,
      mapUrl:row.querySelector('.rs_map').value,
      clientEmail:row.querySelector('.rs_email').value
    });
  });
  cur.push({});
  renderRouteStops(cur);
}
function collectStops(){
  var out=[];
  el('routeStops').querySelectorAll('[data-ri]').forEach(function(row,i){
    var name=(row.querySelector('.rs_name').value||'').trim();
    if(!name)return;
    out.push({
      id:row.querySelector('.rs_id').value||undefined,
      clientId:row.querySelector('.rs_cid').value,
      clientName:name,
      location:(row.querySelector('.rs_loc').value||'').trim(),
      mapUrl:(row.querySelector('.rs_map').value||'').trim(),
      clientEmail:(row.querySelector('.rs_email').value||'').trim(),
      sequence:i+1
    });
  });
  return out;
}
function saveRoute(){
  var id=el('routeSel')&&el('routeSel').value;
  var msg=el('routeMsg'); msg.textContent='Saving route…';
  api('nightVisitSaveRoute',{branchId:branchId(),month:MONTH,sessionId:id,stops:collectStops()}).then(function(res){
    if(res.s!==200){msg.textContent=res.j.error||'Save failed';return;}
    msg.textContent='Route saved ✓ — open WhatsApp tab → Preview message';
    reloadAll();
    showTab('wa');
    if(id) setTimeout(function(){ previewWa(id,'auto'); }, 600);
  });
}
function renderWa(){
  var box=el('waList'); if(!box)return;
  var open=openSessions();
  if(!open.length){box.innerHTML='<p class="hint">No schedules.</p>';return;}
  box.innerHTML=open.map(function(s){
    var routeOk=s.stops&&s.stops.length;
    return '<div style="padding:12px;border:1px solid #334155;border-radius:10px;margin-bottom:10px;background:#0e1730">'+
      '<div style="font-weight:800;color:#fde68a">'+h(s.visitDate)+' · '+h(s.dutyOfficerName)+'</div>'+
      '<div class="hint" style="margin-top:4px">Officer WA: '+h(s.dutyOfficerPhone||'—')+' · Stops: '+(routeOk?s.stops.length:'not set — save route first')+'</div>'+
      '<div style="margin-top:8px">Auto 4:00 pm: '+waBadge(s.waAutoStatus||'not_sent')+(s.waAutoSentAt?' · '+h(String(s.waAutoSentAt).slice(0,16)):'')+'</div>'+
      (s.waAutoError?'<div class="hint" style="color:#fca5a5">'+h(s.waAutoError)+'</div>':'')+
      '<div style="margin-top:6px">Reminder: '+waBadge(s.waReminderStatus||'not_sent')+(s.waReminderSentAt?' · '+h(String(s.waReminderSentAt).slice(0,16)):'')+'</div>'+
      '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">'+
      '<button type="button" class="m-btn m-btn-grey" onclick="previewWa(\\''+s.id+'\\',\\'auto\\')">Preview message</button>'+
      '<button type="button" class="m-btn m-btn-navy" onclick="sendWa(\\''+s.id+'\\',\\'auto\\')">Send now</button>'+
      '<button type="button" class="m-btn m-btn-gold" onclick="sendWa(\\''+s.id+'\\',\\'reminder\\')">Reminder</button>'+
      '</div></div>';
  }).join('');
}
function previewWa(id,kind){
  var prev=el('waPreview');
  if(prev){prev.classList.remove('hidden');prev.textContent='Loading preview…';}
  api('nightVisitPreviewWa',{branchId:branchId(),month:MONTH,sessionId:id,kind:kind||'auto'}).then(function(res){
    if(!prev)return;
    if(res.s!==200){prev.textContent=res.j.error||'Could not load preview';return;}
    prev.textContent=res.j.message||'(empty)';
    prev.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
}
function sendWa(id,kind){
  api('nightVisitSendWa',{branchId:branchId(),month:MONTH,sessionId:id,kind:kind}).then(function(res){
    if(res.s!==200){alert(res.j.error||'WhatsApp failed');return;}
    alert(kind==='reminder'?'Reminder sent ✓':'WhatsApp sent ✓');
    reloadAll();
  });
}
function renderAllot(){
  var box=el('allotList'); if(!box)return;
  var open=openSessions().filter(function(s){return s.status!=='Completed';});
  if(!open.length){box.innerHTML='<p class="hint">No open schedules.</p>';return;}
  box.innerHTML=open.map(function(s){
    var form=IS_MGMT
      ? '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;align-items:end">'+
        '<div><label class="m-lbl">Duty Driver</label><input class="m-inp" id="ad_d_'+s.id+'" value="'+h(s.driverName||'')+'"></div>'+
        '<div><label class="m-lbl">Vehicle</label><input class="m-inp" id="ad_v_'+s.id+'" value="'+h(s.vehicleRegNo||'')+'"></div>'+
        '<button type="button" class="m-btn m-btn-gold" onclick="allotDuty(\\''+s.id+'\\')">Save allotment</button>'+
        (s.driverName?'<button type="button" class="m-btn m-btn-red" onclick="cancelAllot(\\''+s.id+'\\')">Cancel</button>':'')+'</div>'
      : '<div class="hint" style="margin-top:8px">'+(s.driverName?('Allotted: <b>'+h(s.driverName)+'</b> · '+h(s.vehicleRegNo||'')):'Waiting for Corporate allotment.')+'</div>';
    return '<div style="padding:12px;border:1px solid #334155;border-radius:10px;margin-bottom:10px;background:#0e1730"><b>'+h(s.visitDate)+'</b> · '+h(s.dutyOfficerName)+form+'</div>';
  }).join('');
}
function allotDuty(id){
  api('nightVisitAllotDuty',{branchId:branchId(),month:MONTH,sessionId:id,driverName:(el('ad_d_'+id).value||'').trim(),vehicleRegNo:(el('ad_v_'+id).value||'').trim()}).then(function(res){
    if(res.s!==200){el('allotMsg').textContent=res.j.error||'Failed';return;}
    el('allotMsg').textContent='Duty allotted ✓'; reloadAll();
  });
}
function cancelAllot(id){
  if(!confirm('Cancel duty allotment?'))return;
  api('nightVisitCancelAllotment',{branchId:branchId(),month:MONTH,sessionId:id}).then(function(res){
    if(res.s!==200){el('allotMsg').textContent=res.j.error||'Failed';return;}
    reloadAll();
  });
}
function renderReportPick(){
  var box=el('reportPick'); if(!box)return;
  var withRoute=openSessions().filter(function(s){return s.stops&&s.stops.length;});
  if(!withRoute.length){box.innerHTML='<p class="hint">Save a route (clients) first — then each client gets a report.</p>';el('reportEdit').classList.add('hidden');return;}
  box.innerHTML='<label class="m-lbl">Night schedule</label><select class="m-inp" id="reportSessionSel" onchange="loadReportItems()" style="max-width:520px;display:block;margin-top:6px">'+
    withRoute.map(function(s){return '<option value="'+h(s.id)+'">'+h(s.visitDate)+' · '+h(s.dutyOfficerName)+'</option>';}).join('')+'</select>'+
    '<div id="reportClientList" style="margin-top:12px"></div>';
  loadReportItems();
}
function loadReportItems(){
  var id=el('reportSessionSel')&&el('reportSessionSel').value;
  if(!id)return;
  api('nightVisitLoadReports',{branchId:branchId(),month:MONTH,sessionId:id}).then(function(res){
    var box=el('reportClientList');
    if(res.s!==200){box.innerHTML='<p class="hint">'+(res.j.error||'Failed')+'</p>';return;}
    REPORT_ITEMS=res.j.items||[];
    box.innerHTML=REPORT_ITEMS.map(function(it){
      var r=it.report||{}, st=it.stop||{};
      var tag=r.sentToClientAt?'Sent':(r.hodApproved?'HOD approved':(r.savedAt?'Saved':'Not started'));
      return '<div style="padding:10px;border:1px solid #334155;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">'+
        '<div><b>'+h(st.clientName)+'</b><div class="hint">'+h(st.location||'')+' · '+h(tag)+'</div></div>'+
        '<button type="button" class="m-btn m-btn-navy" onclick="openClientReport(\\''+st.id+'\\')">Report</button></div>';
    }).join('')||'<p class="hint">No clients on route.</p>';
  });
}
function openClientReport(stopId){
  var it=REPORT_ITEMS.find(function(x){return x.stop&&x.stop.id===stopId;});
  if(!it)return;
  var r=it.report||{}, st=it.stop||{};
  el('reportEdit').classList.remove('hidden');
  el('rp_sessionId').value=el('reportSessionSel').value;
  el('rp_stopId').value=st.id;
  el('rp_client').value=st.clientName||'';
  el('rp_email').value=r.clientEmail||st.clientEmail||'';
  el('rp_date').value=r.reportDate||TODAY||today();
  el('rp_obs').value=r.generalObservation||'';
  el('rp_info').value=r.information||'';
  el('rp_sleep').value=r.sleepingCases||'';
  el('rp_id').value=r.idCardValidity||'';
  el('rp_turn').value=r.turnoutIssue||'';
  renderPosts(r.posts&&r.posts.length?r.posts:[{}]);
  el('rpMsg').textContent=r.sentToClientAt?'Already sent to client':(r.hodApproved?'HOD approved — ready to Send':(r.savedAt?'Saved — HOD can Review':'Fill format and Save'));
  el('rpPreview').classList.add('hidden');
  el('reportEdit').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function renderPosts(posts){
  el('rp_posts').innerHTML=posts.map(function(p,i){
    return '<div class="m-card" style="margin-bottom:8px;padding:12px" data-pi="'+i+'">'+
      '<div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px">'+
      '<div><label class="m-lbl">Post name</label><input class="m-inp pp_name" value="'+h(p.postName||'')+'"></div>'+
      '<div style="grid-column:1/-1"><label class="m-lbl">Observation</label><textarea class="m-inp pp_obs" rows="2" style="width:100%">'+h(p.observation||'')+'</textarea></div>'+
      '<div><label class="m-lbl">Sleeping</label><input class="m-inp pp_sleep" value="'+h(p.sleeping||'')+'"></div>'+
      '<div><label class="m-lbl">ID card</label><input class="m-inp pp_id" value="'+h(p.idCard||'')+'"></div>'+
      '<div><label class="m-lbl">Turnout</label><input class="m-inp pp_turn" value="'+h(p.turnout||'')+'"></div>'+
      '<div style="grid-column:1/-1"><label class="m-lbl">Information</label><input class="m-inp pp_info" value="'+h(p.information||'')+'"></div>'+
      '</div></div>';
  }).join('');
}
function addPostRow(){
  var cur=[];
  el('rp_posts').querySelectorAll('[data-pi]').forEach(function(row){
    cur.push({
      postName:row.querySelector('.pp_name').value,
      observation:row.querySelector('.pp_obs').value,
      sleeping:row.querySelector('.pp_sleep').value,
      idCard:row.querySelector('.pp_id').value,
      turnout:row.querySelector('.pp_turn').value,
      information:row.querySelector('.pp_info').value
    });
  });
  cur.push({});
  renderPosts(cur);
}
function collectClientReport(){
  var posts=[];
  el('rp_posts').querySelectorAll('[data-pi]').forEach(function(row){
    posts.push({
      postName:(row.querySelector('.pp_name').value||'').trim(),
      observation:(row.querySelector('.pp_obs').value||'').trim(),
      sleeping:(row.querySelector('.pp_sleep').value||'').trim(),
      idCard:(row.querySelector('.pp_id').value||'').trim(),
      turnout:(row.querySelector('.pp_turn').value||'').trim(),
      information:(row.querySelector('.pp_info').value||'').trim()
    });
  });
  return {
    clientEmail:el('rp_email').value.trim(),
    reportDate:el('rp_date').value,
    generalObservation:el('rp_obs').value.trim(),
    information:el('rp_info').value.trim(),
    sleepingCases:el('rp_sleep').value.trim(),
    idCardValidity:el('rp_id').value.trim(),
    turnoutIssue:el('rp_turn').value.trim(),
    posts:posts
  };
}
function saveClientReport(){
  el('rpMsg').textContent='Saving…';
  api('nightVisitSaveClientReport',{branchId:branchId(),month:MONTH,sessionId:el('rp_sessionId').value,stopId:el('rp_stopId').value,report:collectClientReport()}).then(function(res){
    if(res.s!==200){el('rpMsg').textContent=res.j.error||'Save failed';return;}
    el('rpMsg').textContent='Report saved ✓ — HOD can Review, then Send to client';
    loadReportItems();
  });
}
function hodApprove(){
  el('rpMsg').textContent='Saving & approving…';
  api('nightVisitSaveClientReport',{branchId:branchId(),month:MONTH,sessionId:el('rp_sessionId').value,stopId:el('rp_stopId').value,report:collectClientReport()}).then(function(){
    return api('nightVisitHodReview',{branchId:branchId(),month:MONTH,sessionId:el('rp_sessionId').value,stopId:el('rp_stopId').value,approve:true});
  }).then(function(res){
    if(res.s!==200){el('rpMsg').textContent=res.j.error||'Review failed';return;}
    el('rpMsg').textContent='HOD approved ✓ — Preview / Send to client';
    loadReportItems();
  });
}
function previewClientReport(){
  el('rpMsg').textContent='Preview…';
  api('nightVisitSaveClientReport',{branchId:branchId(),month:MONTH,sessionId:el('rp_sessionId').value,stopId:el('rp_stopId').value,report:collectClientReport()}).then(function(){
    return api('nightVisitPreviewClient',{branchId:branchId(),month:MONTH,sessionId:el('rp_sessionId').value,stopId:el('rp_stopId').value});
  }).then(function(res){
    if(res.s!==200){el('rpMsg').textContent=res.j.error||'Preview failed';return;}
    el('rpPreview').classList.remove('hidden');
    el('rpPreview').textContent=res.j.preview||'';
    el('rpMsg').textContent='Preview ready';
  });
}
function sendClientReport(){
  if(!confirm('Send this Night check report (with post-wise observations) to the client?'))return;
  el('rpMsg').textContent='Sending…';
  api('nightVisitSendClient',{branchId:branchId(),month:MONTH,sessionId:el('rp_sessionId').value,stopId:el('rp_stopId').value}).then(function(res){
    if(res.s!==200){el('rpMsg').textContent=res.j.error||'Send failed';return;}
    el('rpMsg').textContent='Sent to client ✓';
    reloadAll();
  });
}
function bootNightVisit(){
  if(el('monthPick'))el('monthPick').value=today().slice(0,7);
  if(!IS_STAFF){
    api('nightVisitBranches',{}).then(function(res){
      if(res.s===200){BRANCHES=res.j.branches||[];fillBranches();}
      reloadAll();
    });
  } else reloadAll();
}
`
}

export function nightVisitStaffBootScript(): string {
  return `
function initStaffPage(j){
  STAFF_BRANCH_ID=(j&&j.branchId)||(typeof staffResolveBranchId==='function'?staffResolveBranchId():'');
  STAFF_BRANCH_NAME=(j&&j.branchName)||(typeof staffBranchLabel==='function'?staffBranchLabel():'');
  BRANCH_ID=STAFF_BRANCH_ID;
  BRANCH_NAME=STAFF_BRANCH_NAME;
  bootNightVisit();
}
`
}

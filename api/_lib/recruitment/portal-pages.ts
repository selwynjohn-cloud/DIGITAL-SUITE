/**
 * Extra Recruitment portal pages — Management + HOD.
 * Injected into api/recruitment/app.ts (after walk-in / DRR pages).
 */

export const RECRUIT_PORTAL_PAGES_JS = `
var DEPLOY_FOLLOWUPS=[];
function irregularAttendance(){ funnelFollowUp('irregular'); }
function loadIrregularAttendance(sync){
  var m=(el('ia_month')&&el('ia_month').value)||today().slice(0,7);
  var msg=el('ia_msg'),btn=el('ia_sync_btn'),tbl=el('ia_tbl');
  if(!msg)return;
  msg.textContent=sync?'Syncing attendance…':'Loading saved list…';
  if(btn&&sync){btn.disabled=true;btn.textContent='Syncing…';}
  api('irregularAttendance',{month:m,minDuties:13,syncFirst:!!sync,branchId:RECRUIT_ROLE==='branch'?RECRUIT_BRANCH:'ALL'}).then(function(res){
    if(btn){btn.disabled=false;btn.textContent='Sync & Refresh';}
    if(res.s!==200){msg.textContent=res.j.error||'Could not load.';return;}
    var rows=res.j.rows||[];
    msg.textContent=rows.length+' guard(s) under 13 duties in '+m+'.';
    var by={};
    rows.forEach(function(r){
      var b=String(r.branch||r.unit||'Unassigned').trim()||'Unassigned';
      if(!by[b])by[b]=[];
      by[b].push(r);
    });
    var keys=Object.keys(by).sort();
    var blocks=keys.map(function(br){
      var html=by[br].map(function(r,i){
        return '<tr><td>'+(i+1)+'</td><td><b>'+h(r.guardName)+'</b></td><td>'+h(r.employeeId)+'</td><td>'+h(r.unit||'')+'</td><td><b>'+r.duties+'</b></td><td>'+h(r.mobile||'')+'</td></tr>';
      }).join('');
      return reportSec(br+' ('+by[br].length+')')+
        '<div class="tblwrap wr-tbl-wrap" style="margin-bottom:12px"><table class="wr-tbl"><thead><tr><th>#</th><th>Guard</th><th>Emp ID</th><th>Unit / Site</th><th>Duties</th><th>Mobile</th></tr></thead><tbody>'+html+'</tbody></table></div>';
    }).join('');
    if(tbl)tbl.innerHTML=blocks||'<div class="card"><p class="rpt-note">No irregular attendance found for this month.</p></div>';
  }).catch(function(){if(btn){btn.disabled=false;btn.textContent='Sync & Refresh';}msg.textContent='Network error.';});
}

function branchWiseWages(){
  var isBranch=RECRUIT_ROLE==='branch';
  var upload=isBranch?
    '<div class="card fgrid"><div><label>City *</label><input id="wg_city" placeholder="City"></div>'+
    '<div><label>Area</label><input id="wg_area" placeholder="Area / locality"></div>'+
    '<div><label>Category *</label><select id="wg_cat"><option value="state">State wages</option><option value="central">Central wages</option></select></div>'+
    '<div><label>Rank / Designation *</label><input id="wg_desig" value="SECURITY GUARD"></div>'+
    '<div><label>Wage amount (₹) *</label><input type="number" id="wg_amt" value="0"></div>'+
    '<div><label>Effective from</label><input type="date" id="wg_from" value="'+today()+'"></div>'+
    '<div><label>Remarks</label><input id="wg_rem" placeholder="Optional"></div>'+
    '<div style="align-self:end"><button type="button" class="btn green" onclick="saveBranchWageUpload()">Upload wage row</button></div></div>':
    '<p class="rpt-note">Management view — Branch-wise · Area-wise · <b>State</b> and <b>Central</b> wages (city-wise). Branches upload from HOD portal.</p>';
  el('content').innerHTML=reportWrap('Branch-wise Wages',isBranch?'Upload your branch wages':'All branches · State & Central',portalBadge(),
    upload+'<p id="wg_msg" class="rpt-note">Loading…</p><div id="wg_tbl"></div>');
  loadBranchWages();
}
function saveBranchWageUpload(){
  api('saveBranchWage',{
    city:(el('wg_city')&&el('wg_city').value)||'',
    area:(el('wg_area')&&el('wg_area').value)||'',
    category:(el('wg_cat')&&el('wg_cat').value)||'state',
    designation:(el('wg_desig')&&el('wg_desig').value)||'',
    wageAmount:(el('wg_amt')&&el('wg_amt').value)||0,
    effectiveFrom:(el('wg_from')&&el('wg_from').value)||today(),
    remarks:(el('wg_rem')&&el('wg_rem').value)||''
  }).then(function(res){
    if(res.s!==200){alert(res.j.error||'Save failed');return;}
    alert('Wage row uploaded.');
    loadBranchWages();
  });
}
function loadBranchWages(){
  var msg=el('wg_msg'),tbl=el('wg_tbl');
  if(!msg)return;
  msg.textContent='Loading…';
  api('listBranchWages',{branchId:RECRUIT_ROLE==='branch'?RECRUIT_BRANCH:'ALL'}).then(function(res){
    if(res.s!==200){msg.textContent=res.j.error||'Could not load.';return;}
    var rows=res.j.rows||[];
    msg.textContent=rows.length+' wage row(s).';
    if(RECRUIT_ROLE!=='branch'){
      var by={};
      rows.forEach(function(r){
        var k=r.branchId+' · '+(r.category==='central'?'Central':'State');
        if(!by[k])by[k]=[];
        by[k].push(r);
      });
      var blocks=Object.keys(by).sort().map(function(k){
        var html=by[k].map(function(r,i){
          return '<tr><td>'+(i+1)+'</td><td>'+h(r.city)+'</td><td>'+h(r.area)+'</td><td>'+h(r.designation)+'</td><td><b>₹'+r.wageAmount+'</b></td><td>'+ddDate(r.effectiveFrom)+'</td><td>'+h(r.remarks||'')+'</td></tr>';
        }).join('');
        return reportSec(k)+'<div class="tblwrap wr-tbl-wrap" style="margin-bottom:12px"><table class="wr-tbl"><thead><tr><th>#</th><th>City</th><th>Area</th><th>Rank</th><th>Wage</th><th>From</th><th>Remarks</th></tr></thead><tbody>'+html+'</tbody></table></div>';
      }).join('');
      tbl.innerHTML=blocks||'<div class="card"><p class="rpt-note">No wage uploads yet.</p></div>';
    }else{
      var html=rows.map(function(r,i){
        return '<tr><td>'+(i+1)+'</td><td>'+h(r.city)+'</td><td>'+h(r.area)+'</td><td>'+h(r.category)+'</td><td>'+h(r.designation)+'</td><td><b>₹'+r.wageAmount+'</b></td><td>'+ddDate(r.effectiveFrom)+'</td></tr>';
      }).join('');
      tbl.innerHTML='<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>#</th><th>City</th><th>Area</th><th>Category</th><th>Rank</th><th>Wage</th><th>From</th></tr></thead><tbody>'+(html||'<tr><td colspan="7">No rows yet — upload above.</td></tr>')+'</tbody></table></div>';
    }
  });
}

function branchVacantRankWise(){
  el('content').innerHTML=reportWrap('Branch-wise Vacant (Rank-wise)','From Agile MIS · worst vacant first',portalBadge(),'<p id="bv_msg" class="rpt-note">Loading…</p><div id="bv_tbl"></div>');
  api('branchVacantRankWise',{branchId:RECRUIT_ROLE==='branch'?RECRUIT_BRANCH:'ALL'}).then(function(res){
    if(res.s!==200){el('bv_msg').textContent=res.j.error||'Could not load.';return;}
    var rows=res.j.rows||[];
    el('bv_msg').textContent='Rank 1 = highest vacant on today\\'s Daily MIS only (not yesterday leftover). As of '+h(res.j.date||'')+'.';
    el('bv_tbl').innerHTML='<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Rank</th><th>Branch</th><th>Vacant</th><th>OT</th><th>Total Shortages</th><th>Sanctioned</th><th>Deployed</th></tr></thead><tbody>'+
      (rows.map(function(r){return '<tr><td><b>'+r.rank+'</b></td><td>'+h(r.branch)+'</td><td>'+r.vac+'</td><td>'+r.ot+'</td><td><b>'+r.shortage+'</b></td><td>'+r.san+'</td><td>'+r.dep+'</td></tr>';}).join('')||
      '<tr><td colspan="7">No MIS vacancy data yet.</td></tr>')+'</tbody></table></div>';
  }).catch(function(){el('bv_msg').textContent='Network error.';});
}

function drrThankYouWhatsApp(){recruitmentFormats('thankyou');}
function shortageReminder(){recruitmentFormats('shortage');}
function recruitmentFormats(tab){
  RF_TAB=tab||RF_TAB||'thankyou';
  var tabs=['thankyou','deploy','shortage'].map(function(t){
    var label=t==='thankyou'?'Thank you message':(t==='deploy'?'Deployment order':'Branch-wise Shortages mail');
    return '<button type="button" class="btn '+(RF_TAB===t?'green':'sky')+'" onclick="recruitmentFormats(\\''+t+'\\')">'+label+'</button>';
  }).join(' ');
  var pick='<div class="card"><p class="rpt-note"><b>Recruitment format</b> — preview and send to the concerned person. Thank you / Deployment include ID, Control, Help Desk, OM &amp; HOD numbers, and mobile-alarm note.</p>'+
    '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0">'+tabs+'</div>'+
    '<div class="fgrid">'+
    '<div><label>Branch</label><select id="rf_branch">'+(RECRUIT_ROLE==='branch'?('<option>'+h(RECRUIT_BRANCH)+'</option>'):recruitCentres().map(function(x){return '<option>'+h(x)+'</option>';}).join(''))+'</select></div>'+
    '<div><label>Guard name</label><input id="rf_name" placeholder="New recruit name"></div>'+
    '<div><label>ID number</label><input id="rf_emp" placeholder="Emp ID"></div>'+
    '<div><label>Unit / Location</label><input id="rf_unit" placeholder="Unit"></div>'+
    '<div><label>OM mobile</label><input id="rf_om" placeholder="10-digit" inputmode="numeric"></div>'+
    '<div><label>HOD mobile</label><input id="rf_hod" placeholder="10-digit" inputmode="numeric"></div>'+
    '<div><label>Send WhatsApp to mobile</label><input id="rf_to" placeholder="Recipient mobile" inputmode="numeric"></div>'+
    '</div>'+
    '<div class="savebar" style="position:static;margin-top:12px"><button type="button" class="btn sky" onclick="previewRecruitFormat()">Preview</button> <button type="button" class="btn green" onclick="sendRecruitFormat()">Send</button></div>'+
    '<div id="rf_out" style="margin-top:12px"><p class="rpt-note">Tap Preview first.</p></div></div>';
  el('content').innerHTML=reportWrap('Recruitment format','Thank you · Deployment order · Branch shortages',portalBadge(),pick);
}
var RF_TAB='thankyou';
function previewRecruitFormat(){
  el('rf_out').innerHTML='<p class="rpt-note">Loading…</p>';
  api('previewRecruitFormat',{
    kind:RF_TAB,
    branchId:(el('rf_branch')&&el('rf_branch').value)||'',
    name:(el('rf_name')&&el('rf_name').value)||'',
    empId:(el('rf_emp')&&el('rf_emp').value)||'',
    unit:(el('rf_unit')&&el('rf_unit').value)||'',
    omMobile:(el('rf_om')&&el('rf_om').value)||'',
    hodMobile:(el('rf_hod')&&el('rf_hod').value)||'',
    toMobile:(el('rf_to')&&el('rf_to').value)||''
  }).then(function(res){
    if(res.s!==200){el('rf_out').innerHTML='<p class="rpt-note">'+(res.j.error||'Failed')+'</p>';return;}
    el('rf_out').innerHTML='<div class="card"><b style="color:#fff">'+h(res.j.subject||'Preview')+'</b><pre style="white-space:pre-wrap;color:#e2e8f0;font-size:13px;line-height:1.5;margin-top:8px">'+h(res.j.text||'')+'</pre></div>'+
      (res.j.html?'<div class="card" style="background:#fff;color:#0f172a;padding:12px;overflow:auto">'+res.j.html+'</div>':'');
  });
}
function sendRecruitFormat(){
  api('sendRecruitFormat',{
    kind:RF_TAB,
    branchId:(el('rf_branch')&&el('rf_branch').value)||'',
    name:(el('rf_name')&&el('rf_name').value)||'',
    empId:(el('rf_emp')&&el('rf_emp').value)||'',
    unit:(el('rf_unit')&&el('rf_unit').value)||'',
    omMobile:(el('rf_om')&&el('rf_om').value)||'',
    hodMobile:(el('rf_hod')&&el('rf_hod').value)||'',
    toMobile:(el('rf_to')&&el('rf_to').value)||''
  }).then(function(res){
    if(res.s!==200){alert(res.j.error||'Send failed');return;}
    if(res.j.waUrl)window.open(res.j.waUrl,'_blank');
    else if(res.j.emailSent)alert('Mail sent to '+((res.j.to&&res.j.to.join(', '))||'concerned'));
    else alert(res.j.text||'Ready');
  });
}

function omOptionsHtml(selected){
  var oms=(CFG.omContacts||[]).slice();
  if(!oms.length)oms=[{name:'Operations Manager',mobile:''}];
  return oms.map(function(o){
    var v=String(o.name||'')+(o.mobile?' · '+o.mobile:'');
    return '<option value="'+a(v)+'"'+(v===selected?' selected':'')+'>'+h(v)+'</option>';
  }).join('')+'<option value="Other">Other</option>';
}
function loadDeployFollowups(kind){
  api('listDeployFollowups',{kind:kind,branchId:RECRUIT_ROLE==='branch'?RECRUIT_BRANCH:'ALL'}).then(function(res){
    if(res.s!==200){el('df_msg').textContent=res.j.error||'Could not load.';return;}
    DEPLOY_FOLLOWUPS=res.j.rows||[];
    renderDeployFollowups(kind);
  }).catch(function(){el('df_msg').textContent='Network error.';});
}
function renderDeployFollowups(kind){
  var isMgmt=PORTAL==='management';
  var isRejoin=kind==='rejoin';
  var callMax=isRejoin?0:(isMgmt?3:6);
  var rows=DEPLOY_FOLLOWUPS.map(function(r,i){
    var calls='';
    for(var c=1;c<=callMax;c++){
      var st=r['call'+c+'Status']||'';
      calls+='<td><select onchange="dfSetField(\\''+r.id+'\\',\\'call'+c+'Status\\',this.value)">'+
        ['','Pending','Connected','No answer','Settled','Not settled'].map(function(s){return '<option'+(st===s?' selected':'')+'>'+s+'</option>';}).join('')+
        '</select></td>';
    }
    var reopen=(!isRejoin&&isMgmt)?'<td><button type="button" class="btn amb" style="padding:4px 8px" onclick="dfReopen(\\''+r.id+'\\')">Reopen</button></td>':'';
    var orderCell=isRejoin?'—':'<button type="button" class="btn sky" style="padding:4px 8px" onclick="dfPreviewOrder(\\''+r.id+'\\')">Preview</button> <button type="button" class="btn green" style="padding:4px 8px" onclick="dfSendOrderWa(\\''+r.id+'\\')">WA + GPS</button>';
    var remark=isRejoin?'—':'<select onchange="dfSetField(\\''+r.id+'\\',\\'finalRemark\\',this.value)"><option'+(r.finalRemark==='Settled'?' selected':'')+'>Settled</option><option'+(r.finalRemark!=='Settled'?' selected':'')+'>Not settled</option></select>';
    return '<tr>'+
      '<td>'+(i+1)+'</td>'+
      '<td>'+ddDate(r.recruitDate)+'</td>'+
      '<td><b>'+h(r.name)+'</b></td>'+
      '<td>'+h(r.empId)+'</td>'+
      '<td>'+h(r.rank)+'</td>'+
      '<td>'+h(r.branch)+'</td>'+
      '<td><input value="'+a(r.unit||'')+'" onchange="dfSetField(\\''+r.id+'\\',\\'unit\\',this.value)" style="min-width:100px"></td>'+
      '<td><select onchange="dfSetField(\\''+r.id+'\\',\\'omContact\\',this.value)">'+omOptionsHtml(r.omContact||'')+'</select></td>'+
      (isRejoin?'':'<td>'+orderCell+'</td>')+
      calls+
      (isRejoin?'':('<td>'+remark+'</td>'+reopen))+
    '</tr>';
  }).join('');
  var callHeads='';
  for(var c=1;c<=callMax;c++)callHeads+='<th>Help desk call '+c+'</th>';
  el('df_msg').textContent=DEPLOY_FOLLOWUPS.length+' row(s).'+(isRejoin?' Rejoin list — no help-desk follow-up.':'');
  var head='<tr><th>#</th><th>Date of Recruitment</th><th>Name</th><th>ID</th><th>Rank</th><th>Branch</th><th>Unit allotted</th><th>OM name · Mobile</th>'+(isRejoin?'':('<th>Deployment Order</th>'+callHeads+'<th>Final remark</th>'+(isMgmt?'<th></th>':'')))+'</tr>';
  el('df_tbl').innerHTML='<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead>'+head+'</thead><tbody>'+(rows||'<tr><td colspan="12">No rows — Sync from DRR.</td></tr>')+'</tbody></table></div>';
}
function recruitedList(){
  el('content').innerHTML=reportWrap('Recruited List','New recruits · deployment & help-desk follow-up',portalBadge(),
    '<div class="card"><button type="button" class="btn sky" onclick="api(\\'syncDeployFollowups\\',{kind:\\'new\\'}).then(function(){loadDeployFollowups(\\'new\\');})">Sync from DRR</button> <button type="button" class="btn grey" onclick="loadDeployFollowups(\\'new\\')">Refresh</button><p id="df_msg" class="rpt-note" style="margin-top:8px">Loading…</p></div><div id="df_tbl"></div>');
  loadDeployFollowups('new');
}
function rejoinList(){
  el('content').innerHTML=reportWrap('Rejoin List','Rejoins from DRR (no help-desk follow-up)',portalBadge(),
    '<div class="card"><button type="button" class="btn sky" onclick="api(\\'syncDeployFollowups\\',{kind:\\'rejoin\\'}).then(function(){loadDeployFollowups(\\'rejoin\\');})">Sync from DRR</button> <button type="button" class="btn grey" onclick="loadDeployFollowups(\\'rejoin\\')">Refresh</button><p id="df_msg" class="rpt-note" style="margin-top:8px">Loading…</p></div><div id="df_tbl"></div>');
  loadDeployFollowups('rejoin');
}
function dfSetField(id,field,value){
  api('saveDeployFollowup',{id:id,field:field,value:value}).then(function(res){
    if(res.s!==200){alert(res.j.error||'Save failed');return;}
    var row=DEPLOY_FOLLOWUPS.find(function(x){return x.id===id;});
    if(row)row[field]=value;
  });
}
function dfReopen(id){
  api('saveDeployFollowup',{id:id,field:'finalRemark',value:'Not settled',reopen:true}).then(function(res){
    if(res.s!==200){alert(res.j.error||'Reopen failed');return;}
    alert('Reopened.');
    loadDeployFollowups('new');
  });
}
function dfPreviewOrder(id){
  api('previewDeploymentOrder',{id:id}).then(function(res){
    if(res.s!==200){alert(res.j.error||'Preview failed');return;}
    var w=window.open('','_blank');
    if(w){w.document.write(res.j.html||res.j.text||'');w.document.close();}
  });
}
function dfSendOrderWa(id){
  api('sendDeploymentOrderWa',{id:id}).then(function(res){
    if(res.s!==200){alert(res.j.error||'Could not open WhatsApp');return;}
    if(res.j.waUrl)window.open(res.j.waUrl,'_blank');
    else alert(res.j.text||'Message ready');
  });
}

function referralIncentives(){
  var body='<div class="card"><p class="rpt-note"><b>Referral Incentives</b> — from Cumulative Referral Details. Verify the guard is still working. Once a month, Recruitment / Branch can preview &amp; send the list to the Director.</p>'+
    '<div class="fgrid" style="margin-top:10px">'+
    (RECRUIT_ROLE==='branch'?'<div><label>Branch</label><input value="'+a(RECRUIT_BRANCH||'')+'" disabled></div>':
      '<div><label>Branch</label><select id="ri_branch"><option value="ALL">All Branches</option>'+recruitCentres().map(function(b){return '<option>'+h(b)+'</option>';}).join('')+'</select></div>')+
    '<div><label>From</label><input type="date" id="ri_from"></div>'+
    '<div><label>To</label><input type="date" id="ri_to" value="'+today()+'"></div>'+
    '<button type="button" class="btn sky" onclick="loadReferralIncentives()">Refresh list</button>'+
    '<button type="button" class="btn grey" onclick="previewReferralIncentiveMail()">Preview mail to Director</button>'+
    '<button type="button" class="btn green" onclick="sendReferralIncentiveMail()">Send to Director</button>'+
    '</div><p id="ri_msg" class="rpt-note" style="margin-top:8px">Tap Refresh list.</p></div><div id="ri_tbl"></div><div id="ri_prev"></div>';
  el('content').innerHTML=reportWrap('Referral Incentives','Staff / Referred-by · continuing yes/no',portalBadge(),body);
}
function loadReferralIncentives(){
  var msg=el('ri_msg');
  msg.textContent='Loading…';
  api('referralIncentives',{
    branchId:RECRUIT_ROLE==='branch'?RECRUIT_BRANCH:((el('ri_branch')&&el('ri_branch').value)||'ALL'),
    from:(el('ri_from')&&el('ri_from').value)||'',
    to:(el('ri_to')&&el('ri_to').value)||today()
  }).then(function(res){
    if(res.s!==200){msg.textContent=res.j.error||'Failed';return;}
    var rows=res.j.rows||[];
    msg.textContent=rows.length+' referral row(s). Mark Continuing till date, then Preview / Send.';
    var html=rows.map(function(r,i){
      return '<tr><td>'+(i+1)+'</td><td><b>'+h(r.referredBy)+'</b></td><td>'+h(r.name)+'</td><td>'+h(r.empId)+'</td><td>'+h(r.rank)+'</td><td>'+h(r.client)+' / '+h(r.location)+'</td><td>'+ddDate(r.doj)+'</td>'+
        '<td><select onchange="riSetContinuing(\\''+r.id+'\\',this.value)"><option'+(r.continuing!=='no'?' selected':'')+'>Yes</option><option'+(r.continuing==='no'?' selected':'')+'>No</option></select></td></tr>';
    }).join('');
    el('ri_tbl').innerHTML='<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Sl.</th><th>Referred by (Staff)</th><th>Guard name</th><th>ID</th><th>Rank</th><th>Working client / location</th><th>Date of joining</th><th>Continuing till date</th></tr></thead><tbody>'+(html||'<tr><td colspan="8">No referral rows in range.</td></tr>')+'</tbody></table></div>';
  });
}
function riSetContinuing(id,val){
  api('saveReferralIncentiveFlag',{id:id,continuing:val==='Yes'||val==='yes'?'yes':'no'}).then(function(res){
    if(res.s!==200)alert(res.j.error||'Save failed');
  });
}
function previewReferralIncentiveMail(){
  api('previewReferralIncentiveMail',{
    branchId:RECRUIT_ROLE==='branch'?RECRUIT_BRANCH:((el('ri_branch')&&el('ri_branch').value)||'ALL'),
    from:(el('ri_from')&&el('ri_from').value)||'',
    to:(el('ri_to')&&el('ri_to').value)||today()
  }).then(function(res){
    if(res.s!==200){alert(res.j.error||'Preview failed');return;}
    el('ri_prev').innerHTML='<div class="card"><p class="rpt-note"><b>Subject:</b> '+h(res.j.subject||'')+'</p></div><div class="card" style="background:#fff;color:#0f172a;padding:12px;overflow:auto">'+res.j.html+'</div>';
  });
}
function sendReferralIncentiveMail(){
  if(!confirm('Send Referral Incentives list to the Director?'))return;
  api('sendReferralIncentiveMail',{
    branchId:RECRUIT_ROLE==='branch'?RECRUIT_BRANCH:((el('ri_branch')&&el('ri_branch').value)||'ALL'),
    from:(el('ri_from')&&el('ri_from').value)||'',
    to:(el('ri_to')&&el('ri_to').value)||today()
  }).then(function(res){
    if(res.s!==200){alert(res.j.error||'Send failed');return;}
    alert('Sent to Director'+(res.j.to?': '+res.j.to:''));
  });
}

function openUserGuide(){window.open('/recruitment/manual','_blank','noopener');}
function openTroubleshooting(){window.open('/recruitment/troubleshooting','_blank','noopener');}
`

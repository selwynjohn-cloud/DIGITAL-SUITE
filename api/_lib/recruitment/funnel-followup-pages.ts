/**
 * Sourcing funnel follow-up — same Call 1–3 system as Security Job Registered List.
 * Training EOI · Absconders · Irregular · Recruiters · Security News.
 */

export const FUNNEL_FOLLOWUP_JS = `
var FF_KIND='eoi',FF_TAB='call1',FF_LIST=[],FF_COUNTS={call1:0,call2:0,call3:0,hold:0,joined:0,holdToday:0},FF_BRANCH='ALL',FF_DATE_Q=[],FF_DATE_BUSY=0,FF_SAVE_NOTE='',FF_KEEP={},FF_META={extractedAt:'',asOf:'',month:'',hint:''};
var FF_META_MAP={
  eoi:{title:'Training EOI Follow-up',sub:'From Agile Training WhatsApp · last list remembered',extract:'Sync from Training',show:'Show last list',x1:'Client',x2:'Training',x3:'EOI type',say:'You replied EOI for training. Can you attend / join? Which date?'},
  absconder:{title:'Absconder List (7+ days)',sub:'Branch-wise · highest first · last list remembered',extract:'Sync & Refresh',show:'Show last list',x1:'Id No.',x2:'Days',x3:'Absent since',say:'You have been away from duty. Can you return? Which date?'},
  irregular:{title:'Irregular Attendance (under 13 duties)',sub:'Branch-wise · last list remembered',extract:'Sync & Refresh',show:'Show last list',x1:'Id No.',x2:'Duties',x3:'Unit / Site',say:'Your attendance is below 13 duties. Can you continue duty?'},
  recruiters:{title:'Recruiters',sub:'Same calling system as Security Job · last list remembered',extract:'Extract list',show:'Show last list',x1:'Referred by',x2:'Added from',x3:'Code',say:'A recruiter shared your name. Are you looking for a security job now?'},
  news:{title:'Security News - Registered List',sub:'Name + mobile from Security News quiz · last come first',extract:'Extract list',show:'Show last list',x1:'Last answered',x2:'Week',x3:'Answers',say:'Thank you for answering Security News. Do you want a security job?'}
};
function ffKeepLoad(){try{FF_KEEP=JSON.parse(localStorage.getItem('ff_dates_v1')||'{}')||{};}catch(e){FF_KEEP={};}}
function ffKeepStore(){try{localStorage.setItem('ff_dates_v1',JSON.stringify(FF_KEEP));}catch(e){}}
function ffPhoneDigits(p){return String(p||'').replace(/\\D/g,'').slice(-10);}
function ffKeepKey(c){return ffPhoneDigits(c&&c.phone)||String((c&&c.id)||'');}
function ffKeepPut(c,dates){
  var k=ffKeepKey(c);if(!k)return;
  FF_KEEP[FF_KIND+':'+k]=Object.assign({},FF_KEEP[FF_KIND+':'+k]||{},dates||{});
  if(c&&c.id)FF_KEEP[FF_KIND+':'+c.id]=Object.assign({},FF_KEEP[FF_KIND+':'+c.id]||{},dates||{});
  ffKeepStore();
}
function ffPaintKept(list){
  ffKeepLoad();
  return (list||[]).map(function(c){
    var extra=Object.assign({},FF_KEEP[FF_KIND+':'+ffKeepKey(c)]||{},FF_KEEP[FF_KIND+':'+c.id]||{});
    return Object.keys(extra).length?Object.assign({},c,extra):c;
  });
}
function ffMergeBook(list,book){
  book=book||{};
  return (list||[]).map(function(c){
    var extra=Object.assign({},book['m:'+ffPhoneDigits(c.phone)]||{},book['id:'+c.id]||{});
    return Object.keys(extra).length?Object.assign({},c,extra):c;
  });
}
function ffShowMobile(p){
  var d=ffPhoneDigits(p);
  if(d.length===10)return d.slice(0,5)+' '+d.slice(5);
  var raw=String(p||'').trim();
  return raw||'—';
}
function ffDayIso(v){
  var s=String(v||'').trim();
  if(!s||s==='—')return '';
  if(/^\\d{4}-\\d{2}-\\d{2}/.test(s))return s.slice(0,10);
  var dmy=s.match(/^(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{4})/);
  if(dmy)return dmy[3]+'-'+String(+dmy[2]).padStart(2,'0')+'-'+String(+dmy[1]).padStart(2,'0');
  return '';
}
function ffDay(v){
  var s=ffDayIso(v);
  if(!s)return '—';
  var p=s.split('-');
  return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s;
}
function ffCall1(c){return ffDayIso(c.call1At);}
function ffHold(c){return ffDayIso(c.holdRemindOn);}
function ffBucket(c){
  if(c.status==='joined'&&ffDayIso(c.joinedAt))return 'joined';
  var hold=ffHold(c),t=today();
  if(hold&&hold>=t&&!ffDayIso(c.joinedAt))return 'hold';
  if(!ffCall1(c)||!ffDayIso(c.tentativeJoinDate))return 'call1';
  if(!ffDayIso(c.call2At))return 'call2';
  return 'call3';
}
function ffSortList(list){
  return list.slice().sort(function(a,b){
    var d=(Number(b.sortTs)||0)-(Number(a.sortTs)||0);
    if(d)return d;
    return String(b.id||'').localeCompare(String(a.id||''));
  });
}
function ffNextStep(c){
  var b=ffBucket(c);
  if(b==='call1')return ffCall1(c)?'App team: Tentative date — Call 1 is remembered':'App team: Call 1 + tentative date';
  if(b==='call2')return 'App team: Call 2 + WhatsApp';
  if(b==='call3')return 'Recruitment: Call 3, then Joined or Hold on';
  if(b==='hold'){
    var hd=ffHold(c);
    if(hd&&hd===today())return 'CALL TODAY — hold reminder';
    return 'Remind on '+ffDay(hd);
  }
  return 'Joined';
}
function ffJsId(id){return JSON.stringify(String(id||''));}
function ffCanRecruit(){return RECRUIT_ROLE!=='branch'||RECRUIT_BRANCH==='Recruitment Department';}
function ffDateBox(id,field,val,locked){
  var v=ffDayIso(val);
  if(locked)return '<div class="sj-date-ro">'+ffDay(v)+(v?'<span class="sj-who">Saved</span>':'')+'</div>';
  return '<input type="date" class="sj-date" data-ff-id="'+a(String(id||''))+'" data-ff-field="'+a(field)+'" value="'+a(v)+'" onchange="ffSaveFromEl(this,false)">'+
    '<button type="button" class="btn green" style="padding:6px 10px;font-size:12px;margin-top:6px" data-ff-id="'+a(String(id||''))+'" data-ff-field="'+a(field)+'" onclick="ffSaveFromBtn(this)">Save date</button>'+
    (v?'<span class="sj-who">Saved '+ffDay(v)+'</span>':'');
}
function ffSaveFromEl(box,force){
  if(!box)return;
  ffSaveDate(box.getAttribute('data-ff-id')||'',box.getAttribute('data-ff-field')||'',box,!!force);
}
function ffSaveFromBtn(btn){
  var box=btn&&btn.previousElementSibling;
  ffSaveDate(btn.getAttribute('data-ff-id')||'',btn.getAttribute('data-ff-field')||'',box,true);
}
function ffBranchPickHtml(){
  if(FF_KIND==='news')return '';
  if(RECRUIT_ROLE==='branch'){
    return '<div><label>Branch</label><input value="'+a(RECRUIT_BRANCH||'')+'" disabled></div>';
  }
  var cur=FF_BRANCH||'ALL';
  var opts=['ALL'].concat((typeof recruitCentres==='function'?recruitCentres():BRANCHES)||[]);
  return '<div><label>Branch</label><select id="ff_branch" onchange="FF_BRANCH=this.value;loadFunnelFollowUp(false)">'+
    opts.map(function(b){return '<option value="'+a(b)+'"'+(b===cur?' selected':'')+'>'+h(b==='ALL'?'All Branches':b)+'</option>';}).join('')+
    '</select></div>';
}
function ffExtraTools(){
  if(FF_KIND==='news'){
    return '<button type="button" class="btn gold" onclick="snDownloadExcel()">Save Excel</button>';
  }
  if(FF_KIND==='absconder'){
    return '<div><label>As of date</label><input type="date" id="ff_asof" value="'+a(FF_META.asOf||today())+'"></div>'+
      '<button type="button" class="btn gold" onclick="shareAbsconderList()">Share list</button>'+
      '<button type="button" class="btn grey" onclick="downloadAbsconderPdf()">Download PDF</button>'+
      '<button type="button" class="btn sky" onclick="ffTerminationPreview()">Preview termination</button>'+
      '<button type="button" class="btn amb" onclick="ffTerminationSendList()">Send termination to this list</button>';
  }
  if(FF_KIND==='irregular'){
    return '<div><label>Month</label><input type="month" id="ff_month" value="'+a(FF_META.month||today().slice(0,7))+'"></div>';
  }
  return '';
}
function ffRecruiterAddHtml(){
  if(FF_KIND!=='recruiters')return '';
  var branchOpts=typeof wiAssignBranchOptions==='function'?wiAssignBranchOptions():((BRANCHES||[]).map(function(b){return '<option>'+h(b)+'</option>';}).join(''));
  var fromOpts=typeof wiFromOptions==='function'?wiFromOptions():'<option>Recruitment Department</option>';
  return '<div class="card fgrid" style="margin-top:12px"><div><label>Name *</label><input id="wi_name" placeholder="Candidate name"></div>'+
    '<div><label>Mobile *</label><input id="wi_mobile" placeholder="10-digit mobile" inputmode="numeric"></div>'+
    '<div><label>Candidate branch *</label><select id="wi_add_branch">'+branchOpts+'</select></div>'+
    '<div><label>Referred by name</label><input id="wi_referred" placeholder="Who referred this candidate?"></div>'+
    '<div><label>Added from *</label><select id="wi_from">'+fromOpts+'</select></div>'+
    '<div><label>Notes (optional)</label><input id="wi_notes" placeholder="Notes"></div>'+
    '<div style="align-self:end"><button type="button" class="btn green" onclick="ffAddRecruiter()">+ Add Recruiters</button></div></div>';
}
function funnelFollowUp(kind){
  FF_KIND=String(kind||'eoi');
  FF_TAB='call1';
  FF_SAVE_NOTE='';
  if(RECRUIT_ROLE==='branch')FF_BRANCH=RECRUIT_BRANCH||'ALL';
  else FF_BRANCH=FF_BRANCH||'ALL';
  var meta=FF_META_MAP[FF_KIND]||FF_META_MAP.eoi;
  if(el('ttl'))el('ttl').textContent=meta.title;
  var body='<div class="card"><p class="rpt-note"><b>'+h(meta.title)+'</b> — same calling system as <b>Security Job — Registered List</b>. <b>Last come first</b>. Dates are <b>dd/mm/yyyy</b>. Pick a date from the <b>calendar</b> — it <b>saves at once</b> and <b>cannot be deleted</b>. After <b>'+h(meta.extract)+'</b> the list is remembered — open this page again to see the last list.</p>'+
    '<div class="sj-process"><b>How to follow up</b><ol>'+
    '<li><b>Call 1</b> — App team. Pick the call date. Same sitting pick <b>Tentative date</b>. The name stays on Call 1 until both dates are saved.</li>'+
    '<li><b>Call 2</b> — App team. Pick the call date. Tap <b>WhatsApp</b>, <b>Reminder</b>, or <b>Termination</b> (ID card + Uniform) in that column.</li>'+
    '<li><b>Call 3</b> — Recruitment team. Pick the call date.</li>'+
    '<li><b>Joined date</b> — Recruitment department, when they join.</li>'+
    '<li><b>Hold on</b> — pick the date to <b>call again</b>. On that day the list marks <b>CALL TODAY</b>.</li>'+
    '</ol>'+
    '<div class="sj-say"><b>What to say on Call 1</b><br>Namaste, Agile Security Force.<br>'+h(meta.say)+'</div></div>'+
    ffRecruiterAddHtml()+
    '<div class="fgrid" style="margin-top:10px">'+ffBranchPickHtml()+ffExtraTools()+
    '<div style="align-self:end;display:flex;gap:8px;flex-wrap:wrap">'+
    '<button type="button" class="btn sky" id="ff_sync_btn" onclick="loadFunnelFollowUp(true)">'+h(meta.extract)+'</button>'+
    '<button type="button" class="btn grey" onclick="loadFunnelFollowUp(false)">'+h(meta.show)+'</button>'+
    '</div></div>'+
    '<div id="ff_btns" style="display:flex;flex-wrap:wrap;gap:10px;margin:14px 0 8px"></div>'+
    '<div id="ff_banner"></div>'+
    '<p id="ff_msg" class="rpt-note">Loading last list…</p></div><div id="ff_tbl"></div>';
  el('content').innerHTML=reportWrap(meta.title,meta.sub+' · '+h(RECRUIT_ROLE==='branch'?RECRUIT_BRANCH:'All Branches'),portalBadge(),body);
  if(RECRUIT_ROLE==='branch'&&RECRUIT_BRANCH&&el('wi_add_branch'))el('wi_add_branch').value=RECRUIT_BRANCH;
  loadFunnelFollowUp(false);
}
function ffCountBuckets(list){
  var c={call1:0,call2:0,call3:0,hold:0,joined:0,holdToday:0},td=today();
  (list||[]).forEach(function(row){
    var b=ffBucket(row);
    c[b]=(c[b]||0)+1;
    if(b==='hold'&&ffHold(row)===td)c.holdToday++;
  });
  return c;
}
function loadFunnelFollowUp(sync){
  var msgEl=el('ff_msg'),btn=el('ff_sync_btn');
  if(!msgEl){alert('Open this list from the left menu again.');return;}
  var meta=FF_META_MAP[FF_KIND]||FF_META_MAP.eoi;
  var branchId=RECRUIT_ROLE==='branch'?(RECRUIT_BRANCH||''):(FF_BRANCH||'ALL');
  var allBranch=RECRUIT_ROLE!=='branch'&&(branchId==='ALL'||!branchId);
  var asOf=(el('ff_asof')&&el('ff_asof').value)||today();
  var month=(el('ff_month')&&el('ff_month').value)||today().slice(0,7);
  msgEl.textContent=sync?'Extracting from the source… please wait.':'Loading last list…';
  if(btn&&sync){btn.disabled=true;btn.textContent='Extracting…';}
  api('funnelFollowupList',{kind:FF_KIND,syncFirst:!!sync,branchId:allBranch?'ALL':branchId,allBranches:allBranch,asOf:asOf,month:month}).then(function(res){
    if(btn){btn.disabled=false;btn.textContent=meta.extract;}
    if(res.s!==200){msgEl.textContent=res.j.error||'Could not load list.';return;}
    FF_LIST=ffMergeBook(ffPaintKept(res.j.people||[]),res.j.dateBook||{});
    FF_COUNTS=res.j.counts||ffCountBuckets(FF_LIST);
    FF_META={extractedAt:res.j.extractedAt||'',asOf:res.j.asOf||asOf,month:res.j.month||month,hint:res.j.hint||''};
    renderFunnelFollowUp();
  }).catch(function(){
    if(btn){btn.disabled=false;btn.textContent=meta.extract;}
    msgEl.textContent='Could not load list — check internet and try again.';
  });
}
function renderFunnelFollowUp(){
  var msgEl=el('ff_msg'),tblEl=el('ff_tbl'),btnsEl=el('ff_btns'),bannerEl=el('ff_banner');
  if(!msgEl||!tblEl)return;
  var c=FF_COUNTS;
  if(btnsEl){
    btnsEl.innerHTML=
      '<button type="button" class="btn '+(FF_TAB==='call1'?'green':'sky')+'" style="font-size:14px;padding:11px 16px" onclick="ffShowTab(\\'call1\\')">Call 1 — App ('+(c.call1||0)+')</button>'+
      '<button type="button" class="btn '+(FF_TAB==='call2'?'green':'sky')+'" style="font-size:14px;padding:11px 16px" onclick="ffShowTab(\\'call2\\')">Call 2 — App ('+(c.call2||0)+')</button>'+
      '<button type="button" class="btn '+(FF_TAB==='call3'?'green':'sky')+'" style="font-size:14px;padding:11px 16px" onclick="ffShowTab(\\'call3\\')">Call 3 — Recruitment ('+(c.call3||0)+')</button>'+
      '<button type="button" class="btn '+(FF_TAB==='hold'?'amb':'grey')+'" style="font-size:14px;padding:11px 16px" onclick="ffShowTab(\\'hold\\')">Hold on ('+(c.hold||0)+')'+(c.holdToday?' · '+c.holdToday+' today':'')+'</button>'+
      '<button type="button" class="btn '+(FF_TAB==='joined'?'green':'sky')+'" style="font-size:14px;padding:11px 16px" onclick="ffShowTab(\\'joined\\')">Joined ('+(c.joined||0)+')</button>';
  }
  var list=ffSortList(FF_LIST.filter(function(row){return ffBucket(row)===FF_TAB;}));
  if(FF_TAB==='hold'){
    var td=today();
    list=list.slice().sort(function(a,b){return (ffHold(a)===td?0:1)-(ffHold(b)===td?0:1);});
  }
  var tabLabel=FF_TAB==='call1'?'Call 1 — App team':(FF_TAB==='call2'?'Call 2 — App team':(FF_TAB==='call3'?'Call 3 — Recruitment':(FF_TAB==='hold'?'Hold on':'Joined')));
  var last=FF_META.extractedAt?('Last list saved '+ffDay(FF_META.extractedAt.slice(0,10))):'No extract yet — tap Extract';
  msgEl.textContent=list.length+' name(s) · '+tabLabel+' · last come first · dates dd/mm/yyyy · '+last+(FF_SAVE_NOTE?' · '+FF_SAVE_NOTE:'');
  FF_SAVE_NOTE='';
  if(bannerEl){
    if(FF_TAB==='call1')bannerEl.innerHTML='<div class="alert" style="background:rgba(14,165,233,.12);border:1px solid #0ea5e9;color:#bae6fd;padding:12px 14px;border-radius:10px;margin-bottom:10px;font-size:13px;line-height:1.5"><b>Call 1 — App team</b> — pick the date, tap <b>Save date</b>, then pick <b>Tentative date</b>.</div>';
    else if(FF_TAB==='call2')bannerEl.innerHTML='<div class="alert" style="background:rgba(14,165,233,.12);border:1px solid #0ea5e9;color:#bae6fd;padding:12px 14px;border-radius:10px;margin-bottom:10px;font-size:13px;line-height:1.5"><b>Call 2 — App team</b> — pick <b>Call 2 date</b>. In the same column tap <b>WhatsApp</b>, <b>Reminder</b>, or <b>Termination</b> (they ran away with ID and Uniform).</div>';
    else if(FF_TAB==='call3')bannerEl.innerHTML='<div class="alert" style="background:rgba(167,139,250,.12);border:1px solid #a78bfa;color:#ddd6fe;padding:12px 14px;border-radius:10px;margin-bottom:10px;font-size:13px;line-height:1.5"><b>Call 3 — Recruitment team</b> — pick <b>Call 3 date</b>, then <b>Joined</b> or <b>Hold on</b>.</div>';
    else if(FF_TAB==='hold')bannerEl.innerHTML='<div class="alert amb" style="padding:12px 14px;border-radius:10px;margin-bottom:10px;font-size:13px;line-height:1.5"><b>Hold on</b> — names due today are at the top (<b>CALL TODAY</b>).</div>';
    else bannerEl.innerHTML='<div class="alert" style="background:rgba(34,197,94,.12);border:1px solid #16a34a;color:#bbf7d0;padding:12px 14px;border-radius:10px;margin-bottom:10px;font-size:13px;line-height:1.5"><b>Joined</b> — joining date is saved.</div>';
    if(FF_META.hint)bannerEl.innerHTML+='<p class="rpt-note" style="margin:6px 0 0">'+h(FF_META.hint)+'</p>';
  }
  var recLock=!ffCanRecruit();
  var meta=FF_META_MAP[FF_KIND]||FF_META_MAP.eoi;
  var abs=FF_KIND==='absconder';
  var rows=list.map(function(row,i){
    var mob=ffPhoneDigits(row.phone);
    var callBtn=mob?('<a class="btn grey" style="padding:6px 10px;font-size:12px;margin:2px" href="tel:+91'+mob+'">Call</a> '):'';
    var waBtn=mob?('<button type="button" class="btn sky" style="padding:6px 10px;font-size:12px;margin:2px" data-ff-id="'+a(row.id)+'" onclick="ffWhatsApp(this.dataset.ffId,\\'invite\\')">WhatsApp</button>'):'';
    var remindBtn=mob?('<button type="button" class="btn amb" style="padding:6px 10px;font-size:12px;margin:2px" data-ff-id="'+a(row.id)+'" onclick="ffWhatsApp(this.dataset.ffId,\\'remind\\')">Reminder</button>'):'';
    var termBtn=(abs&&mob)?('<button type="button" class="btn" style="padding:6px 10px;font-size:12px;margin:2px;background:#7f1d1d;border-color:#ef4444" data-ff-id="'+a(row.id)+'" onclick="ffTerminationSend(this.dataset.ffId)">Termination</button>'):'';
    var holdToday=ffHold(row)&&ffHold(row)===today();
    var rowCls=holdToday?'sj-due':(FF_TAB==='joined'?'sj-joined':'');
    var pendingBtn=abs?('<button type="button" class="btn grey" style="padding:4px 8px;font-size:11px;margin-top:4px" data-ff-id="'+a(row.id)+'" onclick="ffAbsconderMark(this.dataset.ffId,\\'pending\\')">Pending</button>'):'';
    return '<tr'+(rowCls?' class="'+rowCls+'"':'')+'>'+
      '<td class="sj-sl">'+(i+1)+'</td>'+
      '<td class="sj-name"><b>'+(i+1)+'. '+h(row.name)+'</b>'+(row.empId?'<div style="font-size:11px;color:#94a3b8">Id No. '+h(row.empId)+'</div>':'')+'<div style="font-size:10px;color:#64748b">'+h(row.branch||'')+(row.detail?' · '+h(row.detail):'')+'</div>'+(String(row.notes||'').indexOf('Termination')>=0?'<div class="sj-next" style="color:#fca5a5">Termination notice sent</div>':'')+(ffCall1(row)?'<div class="sj-next">Call 1 remembered: '+ffDay(ffCall1(row))+'</div>':'')+'<div class="sj-next">'+h(ffNextStep(row))+'</div></td>'+
      '<td class="sj-mob">'+h(ffShowMobile(row.phone))+'</td>'+
      (abs?'<td>'+h(row.extra1||row.empId||'—')+'</td><td><b>'+h(row.extra2||'—')+'</b></td><td>'+h(row.extra3||'—')+'</td>':
        '<td>'+h(row.extra1||'—')+'</td><td>'+h(row.extra2||'—')+'</td><td>'+h(row.extra3||'—')+'</td>')+
      '<td>'+ffDateBox(row.id,'call1At',ffCall1(row),false)+'<span class="sj-who">App team</span></td>'+
      '<td>'+ffDateBox(row.id,'tentativeJoinDate',row.tentativeJoinDate,false)+'</td>'+
      '<td>'+ffDateBox(row.id,'call2At',row.call2At,false)+'<span class="sj-who">App team</span></td>'+
      '<td>'+waBtn+remindBtn+termBtn+'</td>'+
      '<td>'+ffDateBox(row.id,'call3At',row.call3At,recLock)+'<span class="sj-who">Recruitment</span></td>'+
      '<td>'+ffDateBox(row.id,'joinedAt',row.joinedAt,recLock)+'<span class="sj-who">Recruitment dept</span></td>'+
      '<td>'+ffDateBox(row.id,'holdRemindOn',ffHold(row),recLock)+'<span class="sj-who">'+(holdToday?'CALL TODAY':'Call again on this date')+'</span>'+pendingBtn+'</td>'+
      '<td class="sj-act">'+callBtn+'</td></tr>';
  }).join('');
  var extraHeads=abs?
    '<th>Id No.</th><th>Days</th><th>Absent since</th>':
    '<th>'+h(meta.x1)+'</th><th>'+h(meta.x2)+'</th><th>'+h(meta.x3)+'</th>';
  tblEl.innerHTML='<div class="tblwrap sj-freeze-wrap"><table><thead><tr>'+
    '<th class="sj-sl">'+(abs?'Sl.No.':'Sl.')+'</th><th class="sj-name">'+(abs?'Guards Name':'Name / Next step')+'</th><th class="sj-mob">'+(abs?'Mobile Number':'Mobile')+'</th>'+extraHeads+
    '<th>Call 1 date<br><span class="sj-who">App team</span></th><th>Tentative date</th><th>Call 2 date<br><span class="sj-who">App team</span></th><th>WhatsApp</th>'+
    '<th>Call 3 date<br><span class="sj-who">Recruitment</span></th><th>Joined date</th><th>Hold on / Reminder</th>'+
    '<th class="sj-act">Call</th></tr></thead><tbody>'+
    (rows||'<tr><td colspan="15">No names in this tab. Tap <b>'+h(meta.extract)+'</b> if the last list is empty.</td></tr>')+'</tbody></table></div>';
}
function ffShowTab(tab){FF_TAB=tab;renderFunnelFollowUp();}
function ffPrevDate(id,field){
  for(var i=0;i<FF_LIST.length;i++){
    if(FF_LIST[i].id===id){
      if(field==='call1At')return ffDayIso(FF_LIST[i].call1At);
      if(field==='holdRemindOn')return ffHold(FF_LIST[i]);
      return ffDayIso(FF_LIST[i][field]);
    }
  }
  return '';
}
function ffSaveDate(id,field,elOrVal,force){
  var box=elOrVal&&elOrVal.value!==undefined?elOrVal:null;
  var iso=ffDayIso(box?box.value:elOrVal);
  if(!iso){
    var prev=ffPrevDate(id,field);
    if(box)box.value=prev;
    if(el('ff_msg'))el('ff_msg').textContent='Pick a date, then tap Save date.';
    if(force)alert('Pick a date first, then tap Save date.');
    return;
  }
  if(!force&&ffPrevDate(id,field)===iso)return;
  var row=null;
  for(var i=0;i<FF_LIST.length;i++){if(FF_LIST[i].id===id){row=FF_LIST[i];row[field]=iso;break;}}
  if(!row){
    for(var j=0;j<FF_LIST.length;j++){
      if(ffPhoneDigits(FF_LIST[j].phone)===ffPhoneDigits(id)){row=FF_LIST[j];id=row.id;row[field]=iso;break;}
    }
  }
  var patch={};patch[field]=iso;
  if(row)ffKeepPut(row,patch);
  FF_DATE_Q.push({id:id,field:field,value:iso,phone:ffPhoneDigits(row&&row.phone),force:!!force});
  if(el('ff_msg'))el('ff_msg').textContent='Saving date…';
  ffFlushDates();
}
function ffFlushDates(){
  if(FF_DATE_BUSY||!FF_DATE_Q.length)return;
  FF_DATE_BUSY=1;
  var job=FF_DATE_Q.shift();
  api('saveFunnelDate',{kind:FF_KIND,id:job.id,field:job.field,value:job.value,phone:job.phone||''}).then(function(res){
    FF_DATE_BUSY=0;
    if(res.s!==200){
      alert((res.j&&res.j.error)||'Date could not be saved. Try again.');
      if(FF_DATE_Q.length)ffFlushDates();
      return;
    }
    var dates=(res.j&&res.j.dates)||{};
    dates[job.field]=job.value;
    for(var i=0;i<FF_LIST.length;i++){
      var same=FF_LIST[i].id===job.id||(job.phone&&ffPhoneDigits(FF_LIST[i].phone)===job.phone);
      if(same){Object.assign(FF_LIST[i],dates);ffKeepPut(FF_LIST[i],dates);}
    }
    if(job.force)alert('Saved');
    if(FF_DATE_Q.length){ffFlushDates();return;}
    if(job.field==='joinedAt'&&job.value)FF_TAB='joined';
    else if(job.field==='holdRemindOn'&&job.value)FF_TAB='hold';
    else if(job.field==='call1At')FF_TAB='call1';
    FF_SAVE_NOTE='Saved';
    FF_COUNTS=ffCountBuckets(FF_LIST);
    renderFunnelFollowUp();
  }).catch(function(){
    FF_DATE_BUSY=0;
    alert('Could not save — check internet and try again.');
    if(FF_DATE_Q.length)ffFlushDates();
  });
}
function ffWhatsApp(id,kind){
  var row=null;
  for(var i=0;i<FF_LIST.length;i++){if(FF_LIST[i].id===id){row=FF_LIST[i];break;}}
  if(!row){alert('Name not found. Open the list again.');return;}
  api('funnelWhatsApp',{kind:FF_KIND,id:row.id,name:row.name,mobile:row.phone,remind:kind==='remind'}).then(function(res){
    if(res.s!==200||!res.j.waUrl){alert((res.j&&res.j.error)||'Could not open WhatsApp.');return;}
    window.open(res.j.waUrl,'_blank');
  });
}
function ffAbsconderMark(id,status){
  var row=null;
  for(var i=0;i<FF_LIST.length;i++){if(FF_LIST[i].id===id){row=FF_LIST[i];break;}}
  if(!row)return;
  api('updateAbsconderFollow',{key:row.id,employeeId:row.empId,guardName:row.name,mobile:row.phone,status:status,absentSince:row.extra3,branch:row.branch}).then(function(res){
    if(res.s!==200){alert(res.j.error||'Save failed');return;}
    if(status==='joined')ffSaveDate(row.id,'joinedAt',today(),true);
    else loadFunnelFollowUp(false);
  });
}
function ffAddRecruiter(){
  var name=(el('wi_name')&&el('wi_name').value||'').trim();
  var phone=(el('wi_mobile')&&el('wi_mobile').value||'').replace(/\\D/g,'').slice(-10);
  var branchId=(el('wi_add_branch')&&el('wi_add_branch').value||RECRUIT_BRANCH||'').trim();
  var walkInFrom=(el('wi_from')&&el('wi_from').value||'Recruitment Department').trim();
  var referredBy=(el('wi_referred')&&el('wi_referred').value||'').trim();
  var notes=(el('wi_notes')&&el('wi_notes').value||'').trim();
  if(!name){alert('Enter candidate name.');return;}
  if(phone.length<10){alert('Enter a valid 10-digit mobile number.');return;}
  if(!branchId){alert('Select candidate branch.');return;}
  api('addWalkIn',{name:name,phone:phone,branchId:branchId,walkInFrom:walkInFrom,referredBy:referredBy,replyNotes:notes,funnelChannel:'recruiters'}).then(function(res){
    if(res.s!==200){alert(res.j.error||'Could not add.');return;}
    if(el('wi_name'))el('wi_name').value='';
    if(el('wi_mobile'))el('wi_mobile').value='';
    if(el('wi_referred'))el('wi_referred').value='';
    if(el('wi_notes'))el('wi_notes').value='';
    loadFunnelFollowUp(true);
  });
}
function ffAbsconderPayload(row){
  return {
    key:row.id||'',
    employeeId:row.empId||row.extra1||'',
    guardName:row.name||'',
    mobile:row.phone||'',
    unit:row.detail||'',
    absentSince:row.extra3||'',
    consecutiveDays:Number(row.extra2)||7,
    branch:row.branch||''
  };
}
function ffOpenTerminationLetter(html){
  var w=window.open('','_blank');
  if(!w){alert('Allow pop-up windows to see the termination letter.');return;}
  w.document.open();
  w.document.write(html||'<p>Letter missing.</p>');
  w.document.close();
}
function ffTerminationPreview(){
  if(FF_KIND!=='absconder'){alert('Open Absconder List first.');return;}
  var list=FF_LIST.filter(function(row){return ffBucket(row)===FF_TAB;});
  var row=list[0]||FF_LIST[0]||{name:'Guard'};
  api('previewAbsconderTermination',ffAbsconderPayload(row)).then(function(res){
    if(res.s!==200||!res.j.html){alert((res.j&&res.j.error)||'Could not open preview.');return;}
    ffOpenTerminationLetter(res.j.html);
  }).catch(function(){alert('Could not open preview. Check internet and try again.');});
}
function ffTerminationSend(id){
  if(FF_KIND!=='absconder'){alert('Open Absconder List first.');return;}
  var row=null;
  for(var i=0;i<FF_LIST.length;i++){if(FF_LIST[i].id===id){row=FF_LIST[i];break;}}
  if(!row){alert('Name not found. Open the list again.');return;}
  if(!confirm('Send termination notice to '+row.name+' on WhatsApp? They ran away with company ID and Uniform.'))return;
  if(!confirm('Final confirm: send termination now to '+row.name+'?'))return;
  api('sendAbsconderTermination',ffAbsconderPayload(row)).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Termination notice did not go.');return;}
    row.notes='Termination sent';
    if(res.j.html)ffOpenTerminationLetter(res.j.html);
    alert('Termination notice sent to '+row.name+'.');
    renderFunnelFollowUp();
  }).catch(function(){alert('Could not send. Check internet and try again.');});
}
function ffTerminationSendList(){
  if(FF_KIND!=='absconder'){alert('Open Absconder List first.');return;}
  var list=FF_LIST.filter(function(row){return ffBucket(row)===FF_TAB&&ffPhoneDigits(row.phone).length===10;}).slice(0,20);
  if(!list.length){alert('No mobile numbers on this tab.');return;}
  if(!confirm('Send termination notice to '+list.length+' absconder(s) on this tab? They ran away with ID and Uniform.'))return;
  if(!confirm('Final confirm: send to all '+list.length+' names now?'))return;
  api('sendAbsconderTermination',{people:list.map(ffAbsconderPayload)}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'Termination notices did not go.');return;}
    var sent=res.j.sent||0;
    var failed=res.j.failed||0;
    (res.j.results||[]).forEach(function(r){
      if(!r||!r.ok)return;
      for(var i=0;i<FF_LIST.length;i++){
        if(ffPhoneDigits(FF_LIST[i].phone)===String(r.mobile||'').replace(/\\D/g,'').slice(-10))FF_LIST[i].notes='Termination sent';
      }
    });
    alert('Sent '+sent+(failed?' · '+failed+' not sent':'')+'.');
    renderFunnelFollowUp();
  }).catch(function(){alert('Could not send. Check internet and try again.');});
}
function ffDownloadExcel(){
  if(FF_KIND==='news'&&typeof snDownloadExcel==='function'){snDownloadExcel();return;}
  alert('Use Extract, then follow up from this list.');
}
`

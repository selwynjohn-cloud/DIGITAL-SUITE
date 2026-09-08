/**
 * Security Job — Registered List
 * Call 1 (App) → Tentative date → Call 2 (App) + WhatsApp to HOD / Recruitment →
 * Call 3 (Recruitment) → Joined date or Hold on (remind date).
 * Dates use type="date" calendar pickers (phone-safe).
 */

export const REGISTERED_CANDIDATES_JS = `
var SJ_LIST_TAB='call1',SJ_LIST=[],SJ_COUNTS={call1:0,call2:0,call3:0,hold:0,joined:0,holdToday:0},SJ_REPORT_BRANCH='ALL',SJ_INVITE_RECIPIENTS=[{id:'recruitment',label:'Recruitment department',group:'recruitment'}],SJ_DATE_Q=[],SJ_DATE_BUSY=0,SJ_SAVE_NOTE='',SJ_KEEP={};
function sjKeepLoad(){try{SJ_KEEP=JSON.parse(localStorage.getItem('sj_dates_v1')||'{}')||{};}catch(e){SJ_KEEP={};}}
function sjKeepStore(){try{localStorage.setItem('sj_dates_v1',JSON.stringify(SJ_KEEP));}catch(e){}}
function sjKeepKey(c){return sjPhoneDigits(c&&c.phone)||String((c&&c.id)||'');}
function sjKeepPut(c,dates){
  var k=sjKeepKey(c);if(!k)return;
  SJ_KEEP[k]=Object.assign({},SJ_KEEP[k]||{},dates||{});
  if(c&&c.id)SJ_KEEP[c.id]=Object.assign({},SJ_KEEP[c.id]||{},dates||{});
  sjKeepStore();
}
function sjPaintKept(list){
  sjKeepLoad();
  return (list||[]).map(function(c){
    var extra=Object.assign({},SJ_KEEP[sjKeepKey(c)]||{},SJ_KEEP[c.id]||{});
    return Object.keys(extra).length?Object.assign({},c,extra):c;
  });
}
function sjMergeBook(list,book){
  book=book||{};
  return (list||[]).map(function(c){
    var extra=Object.assign({},book['m:'+sjPhoneDigits(c.phone)]||{},book['id:'+c.id]||{},book['rc:'+(c.regCode||'')]||{});
    return Object.keys(extra).length?Object.assign({},c,extra):c;
  });
}
function sjPhoneDigits(p){return String(p||'').replace(/\\D/g,'').slice(-10);}
function sjShowMobile(p){
  var d=sjPhoneDigits(p);
  if(d.length===10)return d.slice(0,5)+' '+d.slice(5);
  var raw=String(p||'').trim();
  return raw||'—';
}
function sjDayIso(v){
  var s=String(v||'').trim();
  if(!s||s==='—')return '';
  if(/^\\d{4}-\\d{2}-\\d{2}/.test(s))return s.slice(0,10);
  var dmy=s.match(/^(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{4})/);
  if(dmy)return dmy[3]+'-'+String(+dmy[2]).padStart(2,'0')+'-'+String(+dmy[1]).padStart(2,'0');
  var t=Date.parse(s);
  if(!isNaN(t)){
    try{return new Date(t).toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});}catch(e){}
  }
  return '';
}
function sjDay(v){
  var s=sjDayIso(v);
  if(!s)return '—';
  var p=s.split('-');
  return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s;
}
function sjCall1(c){return sjDayIso(c.call1At);}
function sjHold(c){return sjDayIso(c.holdRemindOn)||sjDayIso(c.waitingListAt);}
function sjBucket(c){
  if(c.recruitClosed&&c.status==='joined'&&sjDayIso(c.joinedAt)&&!c.reopenedAt)return 'joined';
  if(c.status==='joined'&&sjDayIso(c.joinedAt)&&!c.reopenedAt)return 'joined';
  if(c.pipelineBucket&&!c.reopenedAt)return c.pipelineBucket;
  var hold=sjHold(c),t=today();
  if(hold&&hold>=t&&!(sjDayIso(c.joinedAt)&&!c.reopenedAt))return 'hold';
  if(!sjCall1(c)||!sjDayIso(c.tentativeJoinDate))return 'call1';
  if(!sjDayIso(c.call2At))return 'call2';
  return 'call3';
}
function sjRegDay(c){return sjDayIso(c.registeredOn||c.createdAt||'');}
function sjSortTs(c){
  if(c.sortTs)return c.sortTs;
  var t=Date.parse(String(c.createdAt||''));
  return isNaN(t)?0:t;
}
function sjSortList(list){
  return list.slice().sort(function(a,b){
    var d=sjSortTs(b)-sjSortTs(a);
    if(d)return d;
    return String(b.id||'').localeCompare(String(a.id||''));
  });
}
function sjStatusLabel(c){
  var b=sjBucket(c);
  if(b==='call1')return 'Call 1 due';
  if(b==='call2')return 'Call 2 due';
  if(b==='call3')return 'Call 3 due';
  if(b==='hold')return 'Hold on';
  return 'Joined';
}
function sjNextStep(c){
  var b=sjBucket(c);
  if(b==='call1')return sjCall1(c)?'App team: Tentative date — Call 1 is remembered':'App team: Call 1 + tentative date';
  if(b==='call2')return 'App team: Call 2 + WhatsApp invitation';
  if(b==='call3')return 'Recruitment: Call 3, Recruited, or Hold on';
  if(b==='hold'){
    var hd=sjHold(c);
    if(hd&&hd===today())return 'CALL TODAY — hold reminder';
    return 'Remind on '+sjDay(hd);
  }
  return 'Joined';
}
function sjOwnerLabel(c){
  var o=String(c.ownerTeam||'').trim();
  if(!o)return '—';
  if(o==='Recruitment Department')return 'Recruitment Dept (Hyd)';
  return o+' HOD';
}
function sjSlaBar(c){
  var met=!!c.slaMet,overdue=!!c.slaOverdue&&!met;
  var pct=Math.max(0,Math.min(100,Number(c.slaPct)||0));
  var label=h(c.slaLabel||'Call within 24h');
  var fill=met?'#22c55e':(overdue?'#ef4444':(pct>=50?'#f59e0b':'#22c55e'));
  var track=overdue?'rgba(239,68,68,.25)':'#1e3050';
  return '<div style="min-width:120px;max-width:160px">'+
    '<div style="font-size:10px;font-weight:800;color:'+(met?'#4ade80':(overdue?'#fca5a5':'#93c5fd'))+';margin-bottom:3px;line-height:1.3">'+label+'</div>'+
    '<div style="height:8px;background:'+track+';border-radius:99px;overflow:hidden">'+
      '<div style="height:100%;width:'+(met?100:pct)+'%;background:'+fill+';border-radius:99px"></div>'+
    '</div></div>';
}
function sjNotesCell(c){
  var n=String(c.replyNotes||'').trim();
  if(!n)return '—';
  var short=n.length>100?n.slice(0,97)+'…':n;
  return '<span title="'+h(n)+'" style="font-size:11px;color:#cbd5e1;max-width:200px;display:inline-block;white-space:normal;line-height:1.35">'+h(short)+'</span>';
}
function sjJsId(id){return JSON.stringify(String(id||''));}
function sjShowTab(tab){SJ_LIST_TAB=tab;loadSjRegisteredList();}
function sjCanRecruit(){
  return RECRUIT_ROLE!=='branch'||RECRUIT_BRANCH==='Recruitment Department';
}
function sjAiCallLabel(c){
  var st=String(c.aiCallStatus||'');
  var lang=String(c.language||'').trim();
  var inLang=lang?' in '+lang:'';
  if(st==='queued')return 'AI will call (after 8 AM)'+inLang;
  if(st==='ringing'||st==='asked')return 'AI calling'+inLang;
  if(st==='got_date')return 'AI got date'+inLang;
  if(st==='not_now')return 'AI: not now';
  if(st==='no_answer')return 'AI no answer — App team call';
  if(st==='failed')return 'AI call failed — App team call';
  return '';
}
function sjAskDateLabel(c){
  var st=String(c.askDateStatus||'');
  if(st==='asked')return 'WhatsApp: asked date';
  if(st==='await_date')return 'WhatsApp: waiting for date';
  if(st==='got_date')return 'WhatsApp: date received';
  if(st==='not_now')return 'WhatsApp: not now';
  return '';
}
function sjJoinOrderLabel(c){
  var st=String(c.joinOrderStatus||'');
  if(st==='will_come')return 'Will come';
  if(st==='await_new_date')return 'Asked new date';
  if(st==='not_now')return 'Not now';
  if(st==='sent'||c.joinOrderSentAt)return 'Letter sent';
  return '';
}
function sjJoinOrderCell(c){
  var lab=sjJoinOrderLabel(c);
  var send=sjDayIso(c.tentativeJoinDate)?'<button type="button" class="btn sky" style="padding:6px 10px;font-size:12px;margin-top:6px" onclick="sjSendJoinOrder('+sjJsId(c.id)+')">Send joining letter</button>':'';
  return (lab?'<div class="sj-who">'+h(lab)+'</div>':'')+send;
}
function sjSendJoinOrder(id){
  var phone='';
  for(var i=0;i<SJ_LIST.length;i++){if(SJ_LIST[i].id===id){phone=SJ_LIST[i].phone||'';break;}}
  api('sendSjJoinOrder',{id:id,phone:phone}).then(function(res){
    if(res.s!==200){alert((res.j&&res.j.error)||'WhatsApp joining letter did not go out.');return;}
    alert((res.j&&res.j.popup)||'WhatsApp joining letter sent to the candidate.');
    loadSjRegisteredList();
  }).catch(function(){alert('Could not send — check internet and try again.');});
}
function sjDateBox(id,field,val,locked,phone,regCode){
  var v=sjDayIso(val);
  if(locked)return '<div class="sj-date-ro">'+sjDay(v)+(v?'<span class="sj-who">Saved</span>':'')+'</div>';
  var meta=' data-sj-id="'+a(String(id||''))+'" data-sj-field="'+a(field)+'" data-sj-phone="'+a(sjPhoneDigits(phone))+'" data-sj-code="'+a(String(regCode||''))+'"';
  return '<input type="date" class="sj-date"'+meta+' value="'+a(v)+'">'+
    '<button type="button" class="btn green sj-date-save" style="padding:6px 10px;font-size:12px;margin-top:6px"'+meta+'>Save date</button>'+
    (v?'<span class="sj-who">Saved '+sjDay(v)+'</span>':'');
}
function sjSavedPopup(msg){
  var text=msg||'Saved';
  try{alert(text);}catch(e){}
  var old=document.getElementById('sj_saved_pop');
  if(old&&old.parentNode)old.parentNode.removeChild(old);
  var box=document.createElement('div');
  box.id='sj_saved_pop';
  box.className='sj-saved-pop';
  box.innerHTML='<div class="sj-saved-card"><b>'+h(text)+'</b><p>This date stays on the list. It cannot be deleted.</p><button type="button" class="btn green" style="font-size:18px;padding:12px 28px" id="sj_saved_ok">OK</button></div>';
  document.body.appendChild(box);
  var ok=document.getElementById('sj_saved_ok');
  if(ok)ok.onclick=function(){var p=document.getElementById('sj_saved_pop');if(p&&p.parentNode)p.parentNode.removeChild(p);};
}
function sjSaveFromEl(box,force){
  if(!box)return;
  sjSaveDate(box.getAttribute('data-sj-id')||'',box.getAttribute('data-sj-field')||'',box,!!force,box.getAttribute('data-sj-phone')||'',box.getAttribute('data-sj-code')||'');
}
function sjSaveFromBtn(btn){
  var box=btn&&btn.previousElementSibling;
  var id=(btn&&btn.getAttribute('data-sj-id'))||(box&&box.getAttribute('data-sj-id'))||'';
  var field=(btn&&btn.getAttribute('data-sj-field'))||(box&&box.getAttribute('data-sj-field'))||'';
  var phone=(btn&&btn.getAttribute('data-sj-phone'))||(box&&box.getAttribute('data-sj-phone'))||'';
  var code=(btn&&btn.getAttribute('data-sj-code'))||(box&&box.getAttribute('data-sj-code'))||'';
  sjSaveDate(id,field,box,true,phone,code);
}
function sjBindDateClicks(){
  var host=el('sj_tbl');
  if(!host||host.getAttribute('data-sj-bound')==='1')return;
  host.setAttribute('data-sj-bound','1');
  host.addEventListener('change',function(ev){
    var t=ev.target;
    if(!t||!t.classList||!t.classList.contains('sj-date'))return;
    sjSaveFromEl(t,true);
  });
  host.addEventListener('click',function(ev){
    var t=ev.target;
    while(t&&t!==host){
      if(t.classList&&t.classList.contains('sj-date-save')){sjSaveFromBtn(t);return;}
      t=t.parentNode;
    }
  });
}
function sjBranchPickHtml(){
  if(RECRUIT_ROLE==='branch'){
    var brLabel=RECRUIT_BRANCH==='Recruitment Department'?'Recruitment Department (Hyderabad A · B · Hi-Tech)':RECRUIT_BRANCH;
    return '<div><label>Owner / login</label><input value="'+a(brLabel)+'" disabled></div>';
  }
  var cur=SJ_REPORT_BRANCH||'ALL';
  var opts=['ALL','Recruitment Department'].concat(BRANCHES.filter(function(b){return b!=='Hyderabad';}));
  opts.push('Hyderabad');
  var seen={};
  opts=opts.filter(function(b){if(seen[b])return false;seen[b]=1;return true;});
  return '<div><label>Owner filter</label><select id="sj_branch" onchange="SJ_REPORT_BRANCH=this.value;loadSjRegisteredList()">'+
    opts.map(function(b){
      var lab=b==='ALL'?'All owners':(b==='Recruitment Department'||b==='Hyderabad'?'Recruitment Dept / Hyderabad RC':b+' HOD');
      return '<option value="'+a(b)+'"'+(b===cur?' selected':'')+'>'+h(lab)+'</option>';
    }).join('')+
    '</select></div>';
}
function sjRegisteredList(){
  if(el('ttl'))el('ttl').textContent='Security Job — Registered List';
  if(RECRUIT_ROLE==='branch')SJ_REPORT_BRANCH=RECRUIT_BRANCH||'ALL';
  var body='<div class="card"><p class="rpt-note"><b>Security Job follow-up</b> — <b>last come first</b> (newest at the top). Dates on the list are <b>dd/mm/yyyy</b>. Pick a date from the <b>calendar</b> — it <b>saves at once</b> and <b>cannot be deleted</b>. Hyderabad registrations show on <b>Hi-Tech City, Hyderabad-A, Hyderabad-B and Recruitment Department</b>. Other cities → <b>that branch HOD only</b>. Scroll — <b>Name, Mobile</b> stay on the left; <b>Call</b> stays on the right.</p>'+
    '<div class="sj-process"><b>How to follow up</b>'+
    '<ol>'+
    '<li><b>Call 1</b> — App team. Pick the call date. It is remembered and stays. Same sitting pick <b>Tentative date</b>. The name stays on Call 1 until both dates are saved.</li>'+
    '<li><b>Call 2</b> — App team. Pick the call date. In the <b>WhatsApp invitation</b> column tap <b>WhatsApp invitation</b> or <b>Reminder</b>. Pick HOD or Recruitment department, then Send. Director and 9500915599 (app) always get a copy.</li>'+
    '<li><b>Call 3</b> — Recruitment team. Pick the call date.</li>'+
    '<li><b>Joined date</b> — Recruitment department, when they walk in.</li>'+
    '<li><b>Recruited / Reopen</b> — Recruitment team. Recruited closes the name on Joined. Reopen brings them back to Call 3. Dates stay saved.</li>'+
    '<li><b>Welcome WhatsApp</b> — one day before Tentative date we send documents + centre GPS to the candidate.</li>'+
    '<li><b>Hold on</b> — if not joining now, pick the date to <b>call again</b>. On that day we remind you. After that date they return to Call 3.</li>'+
    '<li><b>Thank you WhatsApp</b> — when they register we send buttons: <b>This week</b>, <b>Next week</b>, <b>Not now</b>. Their reply saves Tentative date and the joining letter goes.</li>'+
    '<li><b>AI call</b> — when they register, we call in the <b>Primary Language</b> they chose on the form and ask the tentative date. Night registrations wait until morning. If they do not answer, App team still calls.</li>'+
    '<li><b>Joining letter</b> — when <b>Tentative date</b> is saved, WhatsApp goes to the <b>candidate</b>: come and join on that date. They tap <b>Yes I will come</b>, <b>New date</b>, or <b>Not now</b>.</li>'+
    '</ol>'+
    '<div class="sj-say"><b>What to say on Call 1</b><br>Namaste, Agile Security Force. You registered on Security Job.<br>Are you looking for a security job now? Which city can you join from?<br>Can you come to our Recruitment Centre tomorrow or this week?</div></div>'+
    '<div class="fgrid" style="margin-top:10px">'+sjBranchPickHtml()+
    '<div style="align-self:end;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sky" onclick="loadSjRegisteredList()">Refresh</button><button type="button" class="btn gold" onclick="sjDownloadExcel()">Save Excel</button></div></div>'+
    '<div id="sj_btns" style="display:flex;flex-wrap:wrap;gap:10px;margin:14px 0 8px"></div>'+
    '<div id="sj_banner"></div>'+
    '<p id="sj_msg" class="rpt-note">Loading…</p></div><div id="sj_tbl"></div>';
  el('content').innerHTML=reportWrap('Security Job — Registered List',h(RECRUIT_ROLE==='branch'?RECRUIT_BRANCH:'All owners')+' · Call 1–2 App team · Call 3 / Joined / Hold on Recruitment',portalBadge(),body);
  loadSjRegisteredList();
}
function loadSjRegisteredList(){
  var msgEl=el('sj_msg'),tblEl=el('sj_tbl'),btnsEl=el('sj_btns');
  if(!msgEl){alert('Open Security Job — Registered List from the menu again.');return;}
  var branchId=RECRUIT_ROLE==='branch'?(RECRUIT_BRANCH||''):(SJ_REPORT_BRANCH||'ALL');
  var allBranch=RECRUIT_ROLE!=='branch'&&(branchId==='ALL'||!branchId);
  msgEl.textContent='Loading registered list…';
  api('candidatesPipeline',{branchId:allBranch?'ALL':branchId,allBranches:allBranch}).then(function(res){
    if(res.s!==200){msgEl.textContent=res.j.error||'Could not load list.';return;}
    SJ_LIST=sjMergeBook(sjPaintKept(res.j.candidates||[]),res.j.dateBook||{});
    SJ_COUNTS=res.j.counts||SJ_COUNTS;
    if(res.j.inviteRecipients&&res.j.inviteRecipients.length)SJ_INVITE_RECIPIENTS=res.j.inviteRecipients;
    var c=SJ_COUNTS;
    if(btnsEl){
      btnsEl.innerHTML=
        '<button type="button" class="btn '+(SJ_LIST_TAB==='call1'?'green':'sky')+'" style="font-size:14px;padding:11px 16px" onclick="sjShowTab(\\'call1\\')">Call 1 — App ('+(c.call1||0)+')</button>'+
        '<button type="button" class="btn '+(SJ_LIST_TAB==='call2'?'green':'sky')+'" style="font-size:14px;padding:11px 16px" onclick="sjShowTab(\\'call2\\')">Call 2 — App ('+(c.call2||0)+')</button>'+
        '<button type="button" class="btn '+(SJ_LIST_TAB==='call3'?'green':'sky')+'" style="font-size:14px;padding:11px 16px" onclick="sjShowTab(\\'call3\\')">Call 3 — Recruitment ('+(c.call3||0)+')</button>'+
        '<button type="button" class="btn '+(SJ_LIST_TAB==='hold'?'amb':'grey')+'" style="font-size:14px;padding:11px 16px" onclick="sjShowTab(\\'hold\\')">Hold on ('+(c.hold||0)+')'+(c.holdToday?' · '+c.holdToday+' today':'')+'</button>'+
        '<button type="button" class="btn '+(SJ_LIST_TAB==='joined'?'green':'sky')+'" style="font-size:14px;padding:11px 16px" onclick="sjShowTab(\\'joined\\')">Joined ('+(c.joined||0)+')</button>';
    }
    renderSjRegisteredList();
  }).catch(function(){msgEl.textContent='Could not load list — check internet and try again.';});
}
function renderSjRegisteredList(){
  var msgEl=el('sj_msg'),tblEl=el('sj_tbl'),bannerEl=el('sj_banner');
  if(!msgEl||!tblEl)return;
  var list=sjSortList(SJ_LIST.filter(function(c){return sjBucket(c)===SJ_LIST_TAB;}));
  if(SJ_LIST_TAB==='hold'){
    var td=today();
    list=list.slice().sort(function(a,b){
      var at=sjHold(a)===td?0:1,bt=sjHold(b)===td?0:1;
      return at-bt;
    });
  }
  var tabLabel=SJ_LIST_TAB==='call1'?'Call 1 — App team':(SJ_LIST_TAB==='call2'?'Call 2 — App team':(SJ_LIST_TAB==='call3'?'Call 3 — Recruitment':(SJ_LIST_TAB==='hold'?'Hold on':'Joined')));
  var overdueN=list.filter(function(c){return c.slaOverdue&&!c.slaMet;}).length;
  msgEl.textContent=list.length+' candidate(s) · '+tabLabel+(overdueN?' · '+overdueN+' overdue for first call':'')+(SJ_SAVE_NOTE?' · '+SJ_SAVE_NOTE:'');
  SJ_SAVE_NOTE='';
  if(bannerEl){
    if(SJ_LIST_TAB==='call1')bannerEl.innerHTML='<div class="alert" style="background:rgba(14,165,233,.12);border:1px solid #0ea5e9;color:#bae6fd;padding:12px 14px;border-radius:10px;margin-bottom:10px;font-size:13px;line-height:1.5"><b>Call 1 — App team</b> — pick the date from the calendar, then tap <b>Save date</b>. The date stays on this name. Then pick <b>Tentative date</b> and tap Save date again.</div>';
    else if(SJ_LIST_TAB==='call2')bannerEl.innerHTML='<div class="alert" style="background:rgba(14,165,233,.12);border:1px solid #0ea5e9;color:#bae6fd;padding:12px 14px;border-radius:10px;margin-bottom:10px;font-size:13px;line-height:1.5"><b>Call 2 — App team</b> — pick <b>Call 2 date</b>. In the <b>WhatsApp invitation</b> column tap <b>WhatsApp invitation</b> or <b>Reminder</b>. Pick HOD or Recruitment department, then Send.</div>';
    else if(SJ_LIST_TAB==='call3')bannerEl.innerHTML='<div class="alert" style="background:rgba(167,139,250,.12);border:1px solid #a78bfa;color:#ddd6fe;padding:12px 14px;border-radius:10px;margin-bottom:10px;font-size:13px;line-height:1.5"><b>Call 3 — Recruitment team</b> — pick <b>Call 3 date</b>. If they join, tap <b>Recruited</b> or pick <b>Joined date</b>. If later, pick <b>Hold on</b>. One day before Tentative date they get a welcome WhatsApp.</div>';
    else if(SJ_LIST_TAB==='hold')bannerEl.innerHTML='<div class="alert amb" style="padding:12px 14px;border-radius:10px;margin-bottom:10px;font-size:13px;line-height:1.5"><b>Hold on</b> — on the Hold date we remind you to <b>call them again</b>. Names due today are at the top (CALL TODAY). After that date they return to Call 3.</div>';
    else bannerEl.innerHTML='<div class="alert" style="background:rgba(34,197,94,.12);border:1px solid #16a34a;color:#bbf7d0;padding:12px 14px;border-radius:10px;margin-bottom:10px;font-size:13px;line-height:1.5"><b>Joined</b> — Recruitment recorded Recruited / Joined date. Tap <b>Reopen</b> to bring them back to Call 3. Dates stay saved.</div>';
    if((SJ_COUNTS.holdToday||0)>0&&SJ_LIST_TAB!=='hold'){
      bannerEl.innerHTML+='<div class="alert amb" style="padding:12px 14px;border-radius:10px;margin-bottom:10px;font-size:13px;line-height:1.5"><b>Hold date today</b> — '+(SJ_COUNTS.holdToday)+' people to call again. Open the <b>Hold on</b> tab.</div>';
    }
  }
  var recLock=!sjCanRecruit();
  var rows=list.map(function(c,i){
    var mob=sjPhoneDigits(c.phone);
    var callBtn=mob?('<a class="btn grey" style="padding:6px 10px;font-size:12px;margin:2px" href="tel:+91'+mob+'">Call</a> '):'';
    var recruitBtn='';
    if(sjCanRecruit()){
      if(SJ_LIST_TAB==='joined')recruitBtn='<button type="button" class="btn amb" style="padding:6px 10px;font-size:12px;margin:2px" onclick="sjReopenRecruit('+sjJsId(c.id)+')">Reopen</button>';
      else recruitBtn='<button type="button" class="btn green" style="padding:6px 10px;font-size:12px;margin:2px" onclick="sjMarkRecruited('+sjJsId(c.id)+')">Recruited</button>';
    }
    var waBtn='<button type="button" class="btn sky" style="padding:6px 10px;font-size:12px;margin:2px" onclick="sjWhatsAppInvite(\\''+a(c.id)+'\\',\\'invite\\')">WhatsApp invitation</button>';
    var remindBtn='<button type="button" class="btn amb" style="padding:6px 10px;font-size:12px;margin:2px" onclick="sjWhatsAppInvite(\\''+a(c.id)+'\\',\\'remind\\')">Reminder</button>';
    var waDone=sjDayIso(c.whatsappInviteAt)?'<div class="sj-who">Sent '+sjDay(c.whatsappInviteAt)+'</div>':'';
    var holdToday=sjHold(c)&&sjHold(c)===today();
    var overdueRow=c.slaOverdue&&!c.slaMet&&SJ_LIST_TAB==='call1';
    var rowCls=overdueRow?'sj-overdue':(holdToday?'sj-due':(SJ_LIST_TAB==='joined'?'sj-joined':''));
    return '<tr'+(rowCls?' class="'+rowCls+'"':'')+'>'+
      '<td class="sj-sl">'+(i+1)+'</td>'+
      '<td class="sj-name"><b>'+(i+1)+'. '+h(c.name)+'</b><div style="font-size:11px;color:#94a3b8">'+h(c.regCode)+'</div><div style="font-size:10px;color:#64748b">'+h(c.location||'')+(c.source==='securityjob'?' · SecurityJob':'')+'</div>'+(sjCall1(c)?'<div class="sj-next">Call 1 remembered: '+sjDay(sjCall1(c))+'</div>':'')+(sjAskDateLabel(c)?'<div class="sj-next">'+h(sjAskDateLabel(c))+'</div>':'')+(sjAiCallLabel(c)?'<div class="sj-next">'+h(sjAiCallLabel(c))+'</div>':'')+'<div class="sj-next">'+h(sjNextStep(c))+'</div></td>'+
      '<td class="sj-mob">'+h(sjShowMobile(c.phone))+'</td>'+
      '<td style="font-size:11px;font-weight:700;color:#c4b5fd">'+h(sjOwnerLabel(c))+'</td>'+
      '<td>'+sjSlaBar(c)+'</td>'+
      '<td>'+sjDay(sjRegDay(c))+'</td>'+
      '<td>'+sjDateBox(c.id,'call1At',sjCall1(c),false,c.phone,c.regCode)+'<span class="sj-who">App team</span></td>'+
      '<td>'+sjDateBox(c.id,'tentativeJoinDate',c.tentativeJoinDate,false,c.phone,c.regCode)+sjJoinOrderCell(c)+'</td>'+
      '<td>'+sjDateBox(c.id,'call2At',c.call2At,false,c.phone,c.regCode)+'<span class="sj-who">App team</span></td>'+
      '<td>'+waBtn+remindBtn+waDone+'</td>'+
      '<td>'+sjDateBox(c.id,'call3At',c.call3At,recLock,c.phone,c.regCode)+'<span class="sj-who">Recruitment</span></td>'+
      '<td>'+sjDateBox(c.id,'joinedAt',c.joinedAt,recLock,c.phone,c.regCode)+'<span class="sj-who">Recruitment dept</span></td>'+
      '<td>'+sjDateBox(c.id,'holdRemindOn',sjHold(c),recLock,c.phone,c.regCode)+'<span class="sj-who">'+(holdToday?'CALL TODAY':'Call again on this date')+'</span></td>'+
      '<td>'+sjNotesCell(c)+'</td>'+
      '<td>'+h(sjStatusLabel(c))+'</td>'+
      '<td class="sj-act">'+callBtn+recruitBtn+'</td></tr>';
  }).join('');
  tblEl.innerHTML='<div class="tblwrap sj-freeze-wrap"><table><thead><tr>'+
    '<th class="sj-sl">Sl.</th><th class="sj-name">Name / Next step</th><th class="sj-mob">Mobile</th><th>Owner</th><th>24h call clock</th><th>Registered on</th>'+
    '<th>Call 1 date<br><span class="sj-who">App team</span></th><th>Tentative date</th><th>Call 2 date<br><span class="sj-who">App team</span></th><th>WhatsApp invitation</th>'+
    '<th>Call 3 date<br><span class="sj-who">Recruitment</span></th><th>Joined date<br><span class="sj-who">Recruitment dept</span></th><th>Hold on<br><span class="sj-who">Remind date</span></th>'+
    '<th>Notes</th><th>Status</th><th class="sj-act">Call</th></tr></thead><tbody>'+
    (rows||'<tr><td colspan="16">No candidates in this list.</td></tr>')+'</tbody></table></div>';
  sjBindDateClicks();
}
function sjMarkRecruited(id){
  if(!confirm('Mark this person as Recruited? They move to Joined.'))return;
  sjAct(id,'mark_recruited',{},function(j){
    if(!j)return;
    SJ_LIST_TAB='joined';
    loadSjRegisteredList();
  });
}
function sjReopenRecruit(id){
  if(!confirm('Reopen this person for Call 3? Joined date stays saved.'))return;
  sjAct(id,'reopen_recruit',{},function(j){
    if(!j)return;
    SJ_LIST_TAB='call3';
    loadSjRegisteredList();
  });
}
function sjAct(id,action,extra,cb){
  var phone='';
  for(var i=0;i<SJ_LIST.length;i++){if(SJ_LIST[i].id===id){phone=SJ_LIST[i].phone||'';break;}}
  api('registeredCandidateAction',Object.assign({id:id,subAction:action,phone:phone},extra||{})).then(function(res){
    if(res.s!==200){alert(res.j.error||'Action failed');if(cb)cb(null);return;}
    if(cb)cb(res.j);
    else loadSjRegisteredList();
  }).catch(function(){alert('Could not save — check internet and try again.');if(cb)cb(null);});
}
function sjPrevDate(id,field){
  for(var i=0;i<SJ_LIST.length;i++){
    if(SJ_LIST[i].id===id){
      if(field==='call1At')return sjDayIso(SJ_LIST[i].call1At);
      if(field==='holdRemindOn')return sjHold(SJ_LIST[i]);
      return sjDayIso(SJ_LIST[i][field]);
    }
  }
  return '';
}
function sjPhoneOf(id){
  for(var i=0;i<SJ_LIST.length;i++){if(SJ_LIST[i].id===id)return sjPhoneDigits(SJ_LIST[i].phone);}
  return '';
}
function sjSaveDate(id,field,elOrVal,force,phone,regCode){
  var box=elOrVal&&elOrVal.value!==undefined?elOrVal:null;
  var raw=box?box.value:elOrVal;
  var iso=sjDayIso(raw);
  if(!iso){
    var prev=sjPrevDate(id,field);
    if(box)box.value=prev;
    if(el('sj_msg'))el('sj_msg').textContent='Pick a date, then tap Save date.';
    if(force)alert('Pick a date first, then tap Save date.');
    return;
  }
  var row=null;
  for(var i=0;i<SJ_LIST.length;i++){if(SJ_LIST[i].id===id){row=SJ_LIST[i];break;}}
  if(!row&&sjPhoneDigits(phone).length===10){
    for(var j=0;j<SJ_LIST.length;j++){if(sjPhoneDigits(SJ_LIST[j].phone)===sjPhoneDigits(phone)){row=SJ_LIST[j];id=row.id;break;}}
  }
  if(!force&&sjPrevDate(id,field)===iso){
    sjSavedPopup(field==='call1At'?'Saved Call 1':'Saved');
    return;
  }
  if(row)row[field]=iso;
  var patch={};patch[field]=iso;
  if(row)sjKeepPut(row,patch);
  SJ_DATE_Q.push({id:id||(row&&row.id)||'',field:field,value:iso,phone:sjPhoneDigits(phone)||sjPhoneDigits(row&&row.phone)||sjPhoneOf(id),regCode:regCode||(row&&row.regCode)||''});
  if(el('sj_msg'))el('sj_msg').textContent='Saving date…';
  sjFlushDates();
}
function sjFlushDates(){
  if(SJ_DATE_BUSY||!SJ_DATE_Q.length)return;
  SJ_DATE_BUSY=1;
  var job=SJ_DATE_Q.shift();
  api('saveSjDate',{id:job.id,field:job.field,value:job.value,phone:job.phone||'',regCode:job.regCode||''}).then(function(res){
    SJ_DATE_BUSY=0;
    if(res.s!==200){
      alert((res.j&&res.j.error)||'Date could not be saved. Try again.');
      if(SJ_DATE_Q.length)sjFlushDates();
      return;
    }
    var dates=(res.j&&res.j.dates)||{};
    dates[job.field]=job.value;
    for(var i=0;i<SJ_LIST.length;i++){
      var same=SJ_LIST[i].id===job.id||(job.phone&&sjPhoneDigits(SJ_LIST[i].phone)===sjPhoneDigits(job.phone));
      if(same){
        Object.assign(SJ_LIST[i],dates);
        sjKeepPut(SJ_LIST[i],dates);
      }
    }
    var pop=(res.j&&res.j.popup)||(job.field==='call1At'?'Saved Call 1':'Date saved');
    if(SJ_DATE_Q.length){sjFlushDates();sjSavedPopup(pop);return;}
    if(job.field==='joinedAt'&&job.value)SJ_LIST_TAB='joined';
    else if(job.field==='holdRemindOn'&&job.value)SJ_LIST_TAB='hold';
    else if(job.field==='call1At')SJ_LIST_TAB='call1';
    SJ_SAVE_NOTE=pop;
    renderSjRegisteredList();
    sjSavedPopup(pop);
  }).catch(function(){
    SJ_DATE_BUSY=0;
    alert('Could not save — check internet and try again.');
    if(SJ_DATE_Q.length)sjFlushDates();
  });
}
function sjInviteOptionsHtml(rec){
  var list=rec&&rec.length?rec:SJ_INVITE_RECIPIENTS;
  var recDept=list.filter(function(r){return r.group==='recruitment'||r.id==='recruitment';});
  var hods=list.filter(function(r){return r.group!=='recruitment'&&r.id!=='recruitment';});
  if(!recDept.length)recDept=[{id:'recruitment',label:'Recruitment department'}];
  var html='<option value="">— Select HOD or Recruitment department —</option>';
  html+='<optgroup label="Recruitment department">';
  recDept.forEach(function(r){html+='<option value="'+a(r.id)+'">'+h(r.label||'Recruitment department')+'</option>';});
  html+='</optgroup>';
  if(hods.length){
    html+='<optgroup label="HODs">';
    hods.forEach(function(r){html+='<option value="'+a(r.id)+'">'+h(r.label)+'</option>';});
    html+='</optgroup>';
  }
  return html;
}
function sjCloseInvite(){
  var box=document.getElementById('sj_invite_box');
  if(box&&box.parentNode)box.parentNode.removeChild(box);
}
function sjWhatsAppInvite(id,kind){
  try{
    sjCloseInvite();
    var isRemind=kind==='remind';
    var who='this person';
    for(var i=0;i<SJ_LIST.length;i++){if(SJ_LIST[i].id===id){who=SJ_LIST[i].name||who;break;}}
    var title=isRemind?'WhatsApp reminder — ':'WhatsApp invitation — ';
    var html='<div id="sj_invite_box" style="background:#0f172a;border:2px solid #0ea5e9;border-radius:14px;padding:14px;margin-bottom:12px;color:#e2e8f0">'+
      '<b>'+title+h(who)+'</b>'+
      '<p class="rpt-note" style="margin:8px 0">Pick <b>HOD</b> or <b>Recruitment department</b>, then tap <b>Send</b>. Director and 9500915599 (app) always get a copy.</p>'+
      '<label>Send to</label>'+
      '<select id="sj_invite_to" style="font-size:16px;padding:12px;margin-top:4px">'+sjInviteOptionsHtml(SJ_INVITE_RECIPIENTS)+'</select>'+
      '<label style="margin-top:10px;display:block">Message</label>'+
      '<textarea id="sj_invite_draft" readonly rows="7" style="width:100%;min-height:140px;margin-top:6px;padding:10px;border-radius:8px;border:1px solid #475569;background:#020617;color:#e2e8f0;font-size:14px">Loading message…</textarea>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">'+
      '<button type="button" class="btn green" onclick="sjSendInvite(\\''+a(id)+'\\',\\''+(isRemind?'remind':'invite')+'\\')">Send</button>'+
      '<button type="button" class="btn grey" onclick="sjCloseInvite()">Close</button>'+
      '</div></div>';
    var host=el('sj_banner');
    if(host){
      host.innerHTML=html;
      try{host.scrollIntoView({block:'start'});}catch(e){}
    }else{
      el('sj_msg')&&(el('sj_msg').insertAdjacentHTML('beforebegin',html));
    }
    api('sjInvitePreview',{id:id,kind:isRemind?'remind':'invite'}).then(function(res){
      var draft=document.getElementById('sj_invite_draft');
      var sel=document.getElementById('sj_invite_to');
      if(res.s!==200){
        if(draft)draft.value=res.j.error||'Could not load message.';
        return;
      }
      if(res.j.recipients&&res.j.recipients.length){
        SJ_INVITE_RECIPIENTS=res.j.recipients;
        if(sel)sel.innerHTML=sjInviteOptionsHtml(res.j.recipients);
      }
      if(draft)draft.value=res.j.draft||'';
    });
  }catch(err){
    alert('WhatsApp list could not open. Open this page again.');
  }
}
function sjSendInvite(id,kind){
  var sel=document.getElementById('sj_invite_to');
  var toId=sel&&sel.value?sel.value:'';
  if(!toId){alert('Pick an HOD name or Recruitment department.');return;}
  var act=kind==='remind'?'remind_whatsapp':'send_whatsapp';
  sjAct(id,act,{toId:toId},function(j){
    alert(j.message||(kind==='remind'?'Reminder sent.':'Invitation sent.'));
    sjCloseInvite();
    loadSjRegisteredList();
  });
}
function sjSaveExcelFile(base64,filename){
  var bin=atob(base64),bytes=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  var blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  var url=URL.createObjectURL(blob);var link=document.createElement('a');link.href=url;link.download=filename||'Security Job - Registered List.xlsx';link.click();
}
function sjDownloadExcel(){
  api('securityJobListExcel',{}).then(function(res){
    if(res.s!==200||!res.j.base64){alert((res.j&&res.j.error)||'Could not make Excel.');return;}
    sjSaveExcelFile(res.j.base64,res.j.filename||'Security Job - Registered List.xlsx');
  });
}
`

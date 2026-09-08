/** Walk-in Pipeline — manual walk-ins + Referred by (self-contained for suite SPA) */

export const WALK_IN_PAGES_JS = `
var WALK_PIPE_TAB='registered',WALK_PIPE_LIST=[],WALK_PIPE_COUNTS={registered:0,responded:0,follow_up:0,joined:0,closed:0},WALK_FILTER_BRANCH='ALL',WALK_FUNNEL='walkin';
var WALK_IN_SOURCES=['Recruitment Department','Training Academy','IT Department','Bangalore','Bhopal','Chennai','Hi-Tech City','Hyderabad - A','Hyderabad - B','Kakinada','Kochi','Mumbai','Nellore','Puducherry','Surat','Tada','Tadipatri','Tirupati','Vijayawada','Visakhapatnam'];
function wiFunnelTitle(ch){
  ch=String(ch||'walkin').toLowerCase();
  if(ch==='referral')return 'Referral';
  if(ch==='academy')return 'Academy';
  if(ch==='recruiters')return 'Recruiters';
  return 'Walk-in';
}
function wiDayIso(v){return String(v||'').slice(0,10);}
function wiDay(v){
  var s=wiDayIso(v);
  if(!s)return '—';
  var p=s.split('-');
  return p.length===3?String(+p[2]).padStart(2,'0')+'/'+String(+p[1]).padStart(2,'0')+'/'+p[0]:s;
}
function wiPhoneDigits(p){return String(p||'').replace(/\\D/g,'').slice(-10);}
function wiJsId(id){return JSON.stringify(String(id||''));}
function wiBucket(c){
  if(c.pipelineBucket)return c.pipelineBucket;
  if(c.status==='joined'&&String(c.joinedAt||'').trim())return 'joined';
  if(c.status==='rejected'||c.status==='not_willing')return 'closed';
  var doj=wiDayIso(c.tentativeJoinDate);
  if(doj&&doj<=today())return 'follow_up';
  if((c.status==='new'||c.status==='joined')&&!c.calledAt&&!c.tentativeJoinDate)return 'registered';
  return 'responded';
}
function wiStatusLabel(c){
  if(c.status==='joined'&&String(c.joinedAt||'').trim())return 'Joined';
  if(c.status==='rejected')return 'Rejected';
  if(c.status==='not_willing')return 'Not willing';
  var b=wiBucket(c);
  if(b==='follow_up')return 'Follow-up due';
  if(b==='responded')return 'Responded';
  return 'Registered';
}
function wiNotesCell(c){
  var n=String(c.replyNotes||'').trim();
  if(!n)return '—';
  var short=n.length>100?n.slice(0,97)+'…':n;
  return '<span title="'+h(n)+'" style="font-size:11px;color:#cbd5e1;max-width:180px;display:inline-block;white-space:normal;line-height:1.35">'+h(short)+'</span>';
}
function wiDefaultFrom(){
  var b=String(RECRUIT_BRANCH||'').trim();
  if(WALK_IN_SOURCES.indexOf(b)>=0)return b;
  return 'Recruitment Department';
}
function wiFromOptions(selected){
  var sel=selected||wiDefaultFrom();
  return WALK_IN_SOURCES.slice().sort().map(function(s){return '<option'+(s===sel?' selected':'')+'>'+h(s)+'</option>';}).join('');
}
function wiAssignBranchOptions(){
  var list=(BRANCHES&&BRANCHES.length)?BRANCHES.slice():['Hyderabad','Visakhapatnam','Nellore','Bangalore','Chennai','Mumbai'];
  return list.slice().sort().map(function(b){return '<option>'+h(b)+'</option>';}).join('');
}
function wiFilterPickHtml(){
  if(RECRUIT_ROLE==='branch'){
    return '<div><label>Branch</label><input value="'+a(RECRUIT_BRANCH||'')+'" disabled></div>';
  }
  var cur=WALK_FILTER_BRANCH||'ALL';
  var opts=['ALL'].concat((BRANCHES||[]).slice());
  return '<div><label>Branch filter</label><select id="wi_branch" onchange="WALK_FILTER_BRANCH=this.value;loadWalkInPipeline()">'+
    opts.map(function(b){return '<option value="'+a(b)+'"'+(b===cur?' selected':'')+'>'+h(b==='ALL'?'All Branches':b)+'</option>';}).join('')+
    '</select></div>';
}
function walkInPipeline(channel){
  WALK_FUNNEL=String(channel||WALK_FUNNEL||'walkin').toLowerCase();
  var title=wiFunnelTitle(WALK_FUNNEL);
  if(el('ttl'))el('ttl').textContent=title;
  if(RECRUIT_ROLE==='branch')WALK_FILTER_BRANCH=RECRUIT_BRANCH||'ALL';
  var addForm='<div class="card fgrid" style="margin-top:12px"><div><label>Name *</label><input id="wi_name" placeholder="Candidate name"></div>'+
    '<div><label>Mobile *</label><input id="wi_mobile" placeholder="10-digit mobile" inputmode="numeric"></div>'+
    '<div><label>Candidate branch *</label><select id="wi_add_branch">'+wiAssignBranchOptions()+'</select><p class="rpt-note" style="margin-top:4px;font-size:11px">Assign this guard to the branch where they will deploy.</p></div>'+
    '<div><label>Referred by name</label><input id="wi_referred" placeholder="Who referred this candidate?"></div>'+
    '<div><label>Added from *</label><select id="wi_from">'+wiFromOptions()+'</select><p class="rpt-note" style="margin-top:4px;font-size:11px">Which team added this '+h(title)+' entry.</p></div>'+
    '<div><label>Notes (optional)</label><input id="wi_notes" placeholder="Notes"></div>'+
    '<div style="align-self:end"><button type="button" class="btn green" onclick="walkInAdd()">+ Add '+h(title)+'</button></div></div>';
  var body='<div class="card"><p class="rpt-note"><b>'+h(title)+'</b> pipeline — same form as Walk-in. Fill <b>Referred by name</b> when someone referred them.</p>'+
    addForm+
    '<div class="fgrid" style="margin-top:10px">'+wiFilterPickHtml()+
    '<div style="align-self:end"><button type="button" class="btn sky" onclick="loadWalkInPipeline()">Refresh</button></div></div>'+
    '<div id="wi_btns" style="display:flex;flex-wrap:wrap;gap:10px;margin:14px 0 8px"></div>'+
    '<div id="wi_banner"></div>'+
    '<p id="wi_msg" class="rpt-note">Loading…</p></div><div id="wi_tbl"></div>';
  el('content').innerHTML=reportWrap(title+' Pipeline',portalBadge()+' · '+h(title),portalBadge(),body);
  if(RECRUIT_ROLE==='branch'&&RECRUIT_BRANCH&&el('wi_add_branch'))el('wi_add_branch').value=RECRUIT_BRANCH;
  loadWalkInPipeline();
}
function sourceWalkIn(){walkInPipeline('walkin');}
function sourceReferral(){walkInPipeline('referral');}
function sourceAcademy(){walkInPipeline('academy');}
function sourceRecruiters(){funnelFollowUp('recruiters');}
function walkInAdd(){
  var name=(el('wi_name')&&el('wi_name').value||'').trim();
  var phone=(el('wi_mobile')&&el('wi_mobile').value||'').replace(/\\D/g,'').slice(-10);
  var branchId=(el('wi_add_branch')&&el('wi_add_branch').value||RECRUIT_BRANCH||'Hyderabad').trim();
  var walkInFrom=(el('wi_from')&&el('wi_from').value||wiDefaultFrom()).trim();
  var referredBy=(el('wi_referred')&&el('wi_referred').value||'').trim();
  var notes=(el('wi_notes')&&el('wi_notes').value||'').trim();
  if(!name){alert('Enter candidate name.');return;}
  if(phone.length<10){alert('Enter a valid 10-digit mobile number.');return;}
  if(!branchId){alert('Select candidate branch.');return;}
  api('addWalkIn',{name:name,phone:phone,branchId:branchId,walkInFrom:walkInFrom,referredBy:referredBy,replyNotes:notes,funnelChannel:WALK_FUNNEL||'walkin'}).then(function(res){
    if(res.s!==200){alert(res.j.error||'Could not add walk-in.');return;}
    if(el('wi_name'))el('wi_name').value='';
    if(el('wi_mobile'))el('wi_mobile').value='';
    if(el('wi_referred'))el('wi_referred').value='';
    if(el('wi_notes'))el('wi_notes').value='';
    if(RECRUIT_ROLE!=='branch'){WALK_FILTER_BRANCH='ALL';var wiBranch=el('wi_branch');if(wiBranch)wiBranch.value='ALL';}
    WALK_PIPE_TAB='registered';
    loadWalkInPipeline();
    var msgEl=el('wi_msg');
    if(msgEl)msgEl.textContent=res.j.emailSent?'Walk-in added — branch notified by email. Check Registered tab.':'Walk-in added — check Registered tab (newest at top).';
  });
}
function loadWalkInPipeline(){
  var msgEl=el('wi_msg'),btnsEl=el('wi_btns');
  if(!msgEl){alert('Open Walk-in Pipeline from the menu again.');return;}
  var branchId=RECRUIT_ROLE==='branch'?(RECRUIT_BRANCH||''):(WALK_FILTER_BRANCH||'ALL');
  var allBranch=RECRUIT_ROLE!=='branch'&&(branchId==='ALL'||!branchId);
  msgEl.textContent='Loading…';
  api('walkInPipeline',{branchId:allBranch?'ALL':branchId,allBranches:allBranch,funnelChannel:WALK_FUNNEL||'walkin'}).then(function(res){
    if(res.s!==200){msgEl.textContent=res.j.error||'Could not load list.';return;}
    WALK_PIPE_LIST=res.j.candidates||[];
    WALK_PIPE_COUNTS=res.j.counts||WALK_PIPE_COUNTS;
    var c=WALK_PIPE_COUNTS;
    if(btnsEl){
      btnsEl.innerHTML=
        '<button type="button" class="btn '+(WALK_PIPE_TAB==='registered'?'green':'sky')+'" style="font-size:15px;padding:12px 18px" onclick="WALK_PIPE_TAB=\\'registered\\';loadWalkInPipeline()">Registered ('+(c.registered||0)+')</button>'+
        '<button type="button" class="btn '+(WALK_PIPE_TAB==='responded'?'green':'sky')+'" style="font-size:15px;padding:12px 18px" onclick="WALK_PIPE_TAB=\\'responded\\';loadWalkInPipeline()">Responded ('+(c.responded||0)+')</button>'+
        '<button type="button" class="btn '+(WALK_PIPE_TAB==='follow_up'?'amb':'grey')+'" style="font-size:15px;padding:12px 18px" onclick="WALK_PIPE_TAB=\\'follow_up\\';loadWalkInPipeline()">Follow-up due ('+(c.follow_up||0)+')</button>'+
        '<button type="button" class="btn '+(WALK_PIPE_TAB==='joined'?'green':'sky')+'" style="font-size:15px;padding:12px 18px" onclick="WALK_PIPE_TAB=\\'joined\\';loadWalkInPipeline()">Joined ('+(c.joined||0)+')</button>'+
        '<button type="button" class="btn '+(WALK_PIPE_TAB==='closed'?'r':'grey')+'" style="font-size:15px;padding:12px 18px" onclick="WALK_PIPE_TAB=\\'closed\\';loadWalkInPipeline()">Rejected ('+(c.closed||0)+')</button>';
    }
    renderWalkInPipeline();
  }).catch(function(){msgEl.textContent='Could not load list — check internet and try again.';});
}
function renderWalkInPipeline(){
  var msgEl=el('wi_msg'),tblEl=el('wi_tbl'),bannerEl=el('wi_banner');
  if(!msgEl||!tblEl)return;
  var allBranch=RECRUIT_ROLE!=='branch'&&(WALK_FILTER_BRANCH==='ALL'||!WALK_FILTER_BRANCH);
  var list=WALK_PIPE_LIST.filter(function(c){return wiBucket(c)===WALK_PIPE_TAB;}).slice().sort(function(a,b){
    return String(b.createdAt||'').localeCompare(String(a.createdAt||''))||String(b.id||'').localeCompare(String(a.id||''));
  });
  var tabLabel=WALK_PIPE_TAB==='follow_up'?'Follow-up due':(WALK_PIPE_TAB==='responded'?'Responded':(WALK_PIPE_TAB==='joined'?'Joined':(WALK_PIPE_TAB==='closed'?'Rejected':'Registered')));
  msgEl.textContent=list.length+' walk-in(s) · '+tabLabel;
  if(bannerEl){
    if(WALK_PIPE_TAB==='registered')bannerEl.innerHTML='<div class="alert" style="background:rgba(14,165,233,.12);border:1px solid #0ea5e9;color:#bae6fd;padding:12px 14px;border-radius:10px;margin-bottom:10px;font-size:13px;line-height:1.5"><b>Walk-in registered</b> — latest first. Use <b>+ Add walk-in</b> above.</div>';
    else if(WALK_PIPE_TAB==='responded')bannerEl.innerHTML='<div class="alert" style="background:rgba(34,197,94,.12);border:1px solid #22c55e;color:#bbf7d0;padding:12px 14px;border-radius:10px;margin-bottom:10px;font-size:13px;line-height:1.5"><b>Responded</b> — called or tentative date recorded.</div>';
    else if(WALK_PIPE_TAB==='follow_up')bannerEl.innerHTML='<div class="alert amb" style="padding:12px 14px;border-radius:10px;margin-bottom:10px;font-size:13px;line-height:1.5"><b>Follow-up due</b> — please call again.</div>';
    else if(WALK_PIPE_TAB==='joined')bannerEl.innerHTML='<div class="alert" style="background:rgba(34,197,94,.12);border:1px solid #16a34a;color:#bbf7d0;padding:12px 14px;border-radius:10px;margin-bottom:10px;font-size:13px;line-height:1.5"><b>Joined</b> — walk-ins who joined.</div>';
    else if(WALK_PIPE_TAB==='closed')bannerEl.innerHTML='<div class="alert" style="background:rgba(220,38,38,.15);border:1px solid #dc2626;color:#fecaca;padding:12px 14px;border-radius:10px;margin-bottom:10px;font-size:13px;line-height:1.5"><b>Rejected</b> — will not join.</div>';
    else bannerEl.innerHTML='';
  }
  var rows=list.map(function(c){
    var id=wiJsId(c.id);
    var mob=wiPhoneDigits(c.phone);
    var callBtn=mob?('<a class="btn grey" style="padding:3px 6px;font-size:11px;margin:2px" href="tel:+91'+mob+'" onmousedown="walkLogCall('+id+')">Call</a> '):'';
    var brCol=allBranch?('<td>'+h(c.branchId||'')+'</td>'):'';
    var due=wiBucket(c)==='follow_up';
    var rejected=WALK_PIPE_TAB==='closed';
    var acts=WALK_PIPE_TAB==='joined'?'<span style="font-size:11px;color:#94a3b8">Joined</span>':(WALK_PIPE_TAB==='closed'?'<span style="font-size:11px;color:#f87171">Rejected</span>':(callBtn+
      '<button class="btn" style="padding:3px 6px;font-size:11px;margin:2px" onclick="walkSetDoj('+id+')">Tentative DOJ</button> '+
      '<button class="btn grey" style="padding:3px 6px;font-size:11px;margin:2px" onclick="walkFollowUp('+id+')">Follow up</button> '+
      '<button class="btn green" style="padding:3px 6px;font-size:11px;margin:2px" onclick="walkMarkJoined('+id+')">Joined</button> '+
      '<button class="btn r" style="padding:3px 6px;font-size:11px;margin:2px" onclick="walkReject('+id+')">Rejected</button>'));
    return '<tr'+(due?' style="background:rgba(251,146,60,.12)"':(rejected?' style="background:rgba(220,38,38,.08)"':(WALK_PIPE_TAB==='joined'?' style="background:rgba(34,197,94,.08)"':'')))+'>'+brCol+
      '<td><b>'+h(c.name)+'</b><div style="font-size:11px;color:#94a3b8">'+h(c.regCode)+'</div></td>'+
      '<td>'+h(c.phone)+'</td>'+
      '<td><b style="color:#a78bfa">'+h(c.walkInFrom||c.branchId||'—')+'</b></td>'+
      '<td>'+h(c.referredBy||'—')+'</td>'+
      '<td>'+wiDay(c.calledAt)+'</td>'+
      '<td><b>'+wiDay(c.tentativeJoinDate)+'</b></td>'+
      '<td>'+wiDay(c.joinedAt)+'</td>'+
      '<td>'+wiDay(c.status==='rejected'||c.status==='not_willing'?c.rejectedAt||c.notWillingAt:'')+'</td>'+
      '<td>'+wiNotesCell(c)+'</td>'+
      '<td>'+h(wiStatusLabel(c))+'</td>'+
      '<td style="white-space:nowrap">'+acts+'</td></tr>';
  }).join('');
  var cols=allBranch?12:11;
  tblEl.innerHTML='<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr>'+(allBranch?'<th>Branch</th>':'')+
    '<th>Name</th><th>Mobile</th><th>Walk-in from</th><th>Referred by</th><th>Date of call</th><th>Tentative DOJ</th><th>Joined on</th><th>Rejected on</th><th>Notes</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+
    (rows||'<tr><td colspan="'+cols+'">No walk-ins in this list.</td></tr>')+'</tbody></table></div>';
}
function walkAct(id,action,extra){
  api('walkInCandidateAction',Object.assign({id:id,subAction:action},extra||{})).then(function(res){
    if(res.s!==200){alert(res.j.error||'Action failed');return;}
    if(action==='rejected'||action==='not_willing')WALK_PIPE_TAB='closed';
    if(action==='mark_joined')WALK_PIPE_TAB='joined';
    loadWalkInPipeline();
  });
}
function walkLogCall(id){walkAct(id,'log_call',{calledAt:today()});}
function walkPickDate(label,def,cb){
  if(typeof suitePickDate==='function'){suitePickDate(label,def,cb);return;}
  var v=prompt(label+' (YYYY-MM-DD)',def||today());
  if(v)cb(String(v).slice(0,10));
}
function walkSetDoj(id){
  walkPickDate('Tentative date of joining',today(),function(dt){
    if(!dt)return;
    var notes=prompt('Notes (optional):')||'';
    walkAct(id,'set_tentative_doj',{tentativeJoinDate:dt,replyNotes:notes});
  });
}
function walkFollowUp(id){
  var notes=prompt('Follow-up notes:','')||'';
  var cur='';
  for(var i=0;i<WALK_PIPE_LIST.length;i++){if(WALK_PIPE_LIST[i].id===id){cur=wiDayIso(WALK_PIPE_LIST[i].tentativeJoinDate)||today();break;}}
  walkPickDate('Tentative date of joining',cur||today(),function(dt){
    if(!dt)return;
    walkAct(id,'follow_up',{followUpNotes:notes,tentativeJoinDate:dt,calledAt:today()});
  });
}
function walkMarkJoined(id){
  walkPickDate('Date joined',today(),function(dt){if(!dt)return;walkAct(id,'mark_joined',{joinedAt:dt});});
}
function walkReject(id){
  walkPickDate('Date rejected',today(),function(dt){if(!dt)return;walkAct(id,'rejected',{rejectedAt:dt});});
}
`

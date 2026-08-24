import { otpLoginHtml, otpLoginScript } from '../embedded-otp.js'
import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../suite-tap-feedback.js'
import { suitePageTitleInitScript } from '../suite-page-chrome.js'
import { suiteMgmtBranchOptionsJs } from '../suite-mgmt-branch-select.js'
import { LIVE_APP_ID, LIVE_APP_NAME, LIVE_JOBS_URL, LIVE_NEWS_CHANNEL, LIVE_NEWS_PAGE } from './types.js'
import { LIVE_CHAT_ACCEPT, liveVoiceBindScript } from './media.js'
import { LIVE_CHAT_RULE, LIVE_CHAT_RULE_MGMT } from './moderation.js'
import { LIVE_SHELL_CSS, liveAvatarImg, liveFooterHtml, liveLogoImg, liveOpsIcon, livePersonHeadHtml } from './shell.js'

export function agileLiveStaffPage(portal: 'staff' | 'management', branchOptionsHtml: string): string {
  const isMgmt = portal === 'management'
  const login = isMgmt
    ? otpLoginHtml(LIVE_APP_NAME, 'Management — All Branches first')
    : otpLoginHtml(LIVE_APP_NAME, 'HOD / Staff — your branch only', true, branchOptionsHtml)
  const rule = isMgmt ? LIVE_CHAT_RULE_MGMT : LIVE_CHAT_RULE
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#14224f">
<meta name="mobile-web-app-capable" content="yes">
<title>${LIVE_APP_NAME} — ${isMgmt ? 'Management' : 'Staff'}</title>
<style>
${LIVE_SHELL_CSS}
${SUITE_TAP_FEEDBACK_CSS}
</style></head>
<body>
${login}
<div id="app" class="live-fill hidden">
  <div class="live-desk">
    <div id="side" class="live-side">
      ${livePersonHeadHtml({
        whoId: 'meWho',
        idId: 'meId',
        desigId: 'meDesig',
        cardId: 'meCard',
        cardPickId: 'meCardPick',
        cardDateId: 'meCardDate',
        branchId: 'meBr',
        extra: `<button type="button" class="live-ico" id="btnOps" title="Dashboard" aria-label="Dashboard">${liveOpsIcon()}</button>`,
      })}
      <div id="banner" class="msg"></div>
      ${isMgmt ? '<div class="live-search"><select id="branchSel" aria-label="All Branches"></select></div>' : ''}
      <div id="tabChats" class="live-tab">
        <div class="live-search"><input id="q" placeholder="Search" type="search"></div>
        <div class="live-list" id="people"></div>
        <div class="add-box">
          <input id="toMobile" inputmode="numeric" maxlength="10" placeholder="10-digit mobile">
          <input id="toName" maxlength="80" placeholder="Name" style="margin-top:8px">
          <div class="row" style="margin-top:8px">
            <button type="button" class="btn grey" id="btnFindMob">Find</button>
            <button type="button" class="btn gold" id="btnAddMob">Add</button>
          </div>
        </div>
      </div>
      <div id="tabCalls" class="live-tab hidden"><div class="live-tab-body" id="callList"><p class="muted">Pick a branch, then open Call & Video.</p></div></div>
      <div id="tabNews" class="live-tab hidden"><div class="live-tab-body" id="newsBox"><p class="muted">Open Security News after sign-in.</p></div></div>
      <div id="tabWeather" class="live-tab hidden"><div class="live-tab-body" id="wxBox"><p class="muted">Pick a branch, then open Weather.</p></div></div>
      <div id="tabTrain" class="live-tab hidden"><div class="live-tab-body" id="trainBox"><p class="muted">Open Training after sign-in.</p></div></div>
      <div id="tabEmergency" class="live-tab hidden"><div class="live-tab-body" id="emBox"><p class="muted">Pick a branch, then open Emergency Number.</p></div></div>
      <div id="tabSite" class="live-tab hidden"><div class="live-tab-body" id="siteBox"><p class="muted">Pick a branch, then open Site Instructions.</p></div></div>
      <div id="tabProfile" class="live-tab hidden"><div class="live-tab-body" id="profBox"><p class="muted">Open Profile after sign-in.</p></div></div>
      <div id="tabLinks" class="live-tab hidden"><div class="live-tab-body" id="linkBox"><p class="muted">Open Important Links after sign-in.</p></div></div>
      ${liveFooterHtml('Chat')}
    </div>
    <div id="main" class="live-main hidden">
      <div class="live-chat-bar">
        <button type="button" class="live-back" id="btnBack" aria-label="Back">‹</button>
        ${liveAvatarImg()}
        <div class="live-chat-who"><b id="chatName">Branch group</b><span id="chatSub">Security Staff</span></div>
      </div>
      <p class="rule">${rule}</p>
      <div class="live-chat" id="chat"></div>
      <div class="composer">
        <input id="chatFile" type="file" class="hidden" accept="${LIVE_CHAT_ACCEPT}">
        <button type="button" class="btn grey" id="btnAttach">+</button>
        <button type="button" class="btn grey voice" id="btnVoice" aria-label="Voice" title="Voice"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2z"/></svg></button>
        <input id="chatText" type="text" maxlength="400" placeholder="Type a message">
        <button type="button" class="btn green" id="btnSend">Send</button>
      </div>
    </div>
  </div>
  <div id="ops" class="ops hidden">
    ${livePersonHeadHtml({
      whoId: 'opsWho',
      idId: 'opsId',
      desigId: 'opsDesig',
      cardId: 'opsCard',
      cardPickId: 'opsCardPick',
      cardDateId: 'opsCardDate',
      branchId: 'opsBr',
      extra: `<button type="button" class="btn grey live-head-btn" id="btnOpsClose">Back to chat</button><button type="button" class="btn grey live-head-btn" id="btnOut">Sign out</button>`,
    })}
    <div class="ops-body" id="paneDuty"></div>
  </div>
</div>
<script>
${suitePageTitleInitScript(LIVE_APP_NAME)}
${suiteMgmtBranchOptionsJs()}
${suiteTapFeedbackInitScript()}
${otpLoginScript(LIVE_APP_ID, LIVE_APP_NAME, portal)}
var CTX={email:'',name:'',role:'${portal}',roleLabel:'${isMgmt ? 'Management' : 'Staff'}',branchId:'',branches:[],extras:[]};
var ALL=[];
var LAST='';
var POLL=null;
var SEL={id:'group',mobile:'',name:'Branch group',role:''};
var WIDE=false;
function el(id){return document.getElementById(id);}
function banner(t,ok){var n=el('banner');if(!n)return;n.textContent=t||'';n.className='msg '+(t?(ok?'ok':'err'):'');}
function api(action,extra){
  return fetch('/api/live/data',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,branchId:CTX.branchId},extra||{}))})
    .then(function(r){return r.json().then(function(j){return {s:r.status,j:j};});});
}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}
function last10(s){return String(s||'').replace(/\\D/g,'').slice(-10);}
function roleOf(m){
  if(m.fromKind==='management')return 'Management';
  if(m.fromKind==='staff'||m.fromRole==='staff')return 'Staff';
  return 'Security Staff';
}
function when(iso){
  var d=new Date(iso); if(isNaN(d.getTime()))return '';
  var now=new Date();
  var h=d.getHours(),m=d.getMinutes(),ap=h>=12?'pm':'am'; h=h%12||12;
  var t=h+':'+(m<10?'0':'')+m+' '+ap;
  return d.toDateString()===now.toDateString()?t:(d.getDate()+'/'+(d.getMonth()+1));
}
function collect(){
  var map={};
  function add(id,mobile,name,role,text,at){
    if(!map[id])map[id]={id:id,mobile:mobile||'',name:name||mobile||'Branch group',role:role||'',text:text||'',at:at||''};
    else{
      if(name&&name!==mobile)map[id].name=name;
      if(role)map[id].role=role;
      if(at&&(!map[id].at||at>map[id].at)){map[id].text=text||'';map[id].at=at;}
    }
  }
  add('group','','Branch group','','','');
  (CTX.extras||[]).forEach(function(e){add(last10(e.mobile),last10(e.mobile),e.name,'', '',e.at);});
  ALL.forEach(function(m){
    if(m.toMobile)add(last10(m.toMobile),last10(m.toMobile),m.toName||'', '',m.text,m.at);
    if(String(m.fromId||'').indexOf('g:')===0)add(last10(m.fromId.slice(2)),last10(m.fromId.slice(2)),m.fromName,'Security Staff',m.text,m.at);
  });
  var rows=Object.keys(map).map(function(k){return map[k];});
  rows.sort(function(a,b){
    if(a.id==='group')return -1; if(b.id==='group')return 1;
    return String(b.at||'').localeCompare(String(a.at||''));
  });
  return rows;
}
function inThread(m){
  if(SEL.id==='group')return !m.toMobile;
  var mob=SEL.mobile;
  if(m.toMobile&&last10(m.toMobile)===mob)return true;
  if(String(m.fromId||'')==='g:'+mob)return true;
  return false;
}
function paintPeople(){
  var q=String(el('q').value||'').toLowerCase().trim();
  var box=el('people'); box.innerHTML='';
  collect().forEach(function(p){
    var hay=(p.mobile+' '+p.name+' '+p.role).toLowerCase();
    if(q&&hay.indexOf(q)<0)return;
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='live-row'+(p.id===SEL.id?' on':'');
    btn.innerHTML='${liveAvatarImg()}'+
      '<div class="live-row-mid"><div class="live-row-top"><span class="live-num">'+esc(p.mobile||'Branch group')+'</span><span class="live-time">'+esc(when(p.at))+'</span></div>'+
      '<div class="live-row-sub"><span class="live-sub">'+esc(p.name)+(p.text?' · '+esc(p.text):'')+'</span><span class="live-role">'+esc(p.role||'')+'</span></div></div>';
    btn.addEventListener('click',function(){openThread(p);});
    box.appendChild(btn);
  });
}
function paintThread(){
  var box=el('chat'); box.innerHTML='';
  ALL.filter(inThread).forEach(function(m){
    LAST=m.id;
    var mine=String(m.fromId||'').indexOf(CTX.email)>=0;
    var div=document.createElement('div');
    div.className='bub '+(mine?'me':'them');
    var sm=document.createElement('small');
    sm.textContent=(m.fromName||'')+' · '+roleOf(m);
    div.appendChild(sm);
    if(m.fileUrl&&m.fileKind==='image'){var im=document.createElement('img');im.src=m.fileUrl;im.alt=m.fileName||'photo';div.appendChild(im);}
    else if(m.fileUrl&&m.fileKind==='audio'){var au=document.createElement('audio');au.controls=true;au.src=m.fileUrl;div.appendChild(au);}
    else if(m.fileUrl&&m.fileKind==='video'){var vd=document.createElement('video');vd.controls=true;vd.src=m.fileUrl;div.appendChild(vd);}
    else if(m.fileUrl){var a=document.createElement('a');a.className='file';a.href=m.fileUrl;a.target='_blank';a.rel='noopener';a.textContent=m.fileName||'Open file';div.appendChild(a);}
    if(m.text)div.appendChild(document.createTextNode(m.text));
    if(!mine){
      var del=document.createElement('button');
      del.type='button';del.className='btn grey';del.textContent='Remove';
      del.style.marginTop='6px';del.style.minHeight='36px';
      del.addEventListener('click',function(){api('chatDelete',{messageId:m.id}).then(function(){loadChat(true);});});
      div.appendChild(del);
    }
    box.appendChild(div);
  });
  box.scrollTop=box.scrollHeight;
}
function showMain(on){
  WIDE=window.matchMedia('(min-width:1100px)').matches;
  el('main').classList.toggle('hidden',!(on||WIDE));
  if(!WIDE)el('side').classList.toggle('hidden',!!on);
}
function openThread(p){
  SEL=p;
  el('toMobile').value=p.mobile||'';
  el('toName').value=p.id==='group'?'':(p.name||'');
  el('chatName').textContent=p.name||p.mobile||'Branch group';
  el('chatSub').textContent=(p.mobile?p.mobile+' · ':'')+(p.role|| (p.id==='group'?'Security Staff':''));
  paintPeople();
  paintThread();
  showMain(true);
}
function loadChat(full){
  if(CTX.role==='management'&&(!CTX.branchId||CTX.branchId==='ALL')){
    banner('Pick one branch to open chat (not All Branches).',false);return;
  }
  api('chatList',{afterId:full?'':LAST}).then(function(res){
    if(res.s!==200){banner(res.j.error||'Pick one branch to open chat.',false);return;}
    if(full)ALL=[];
    (res.j.messages||[]).forEach(function(m){ALL.push(m);LAST=m.id;});
    paintPeople();
    paintThread();
  });
}
function startPoll(){
  loadChat(true);
  if(POLL)clearInterval(POLL);
  POLL=setInterval(function(){loadChat(false);},4000);
}
function pill(flag){
  if(flag==='out_of_post')return '<span class="pill miss">Out of Post</span>';
  if(flag==='break_duty')return '<span class="pill way">Break Duty</span>';
  if(flag==='early_end')return '<span class="pill way">Ended early</span>';
  if(flag==='late_start'||flag==='late')return '<span class="pill late">Late Start</span>';
  return '<span class="pill ok">On duty</span>';
}
function showOps(){
  el('ops').classList.remove('hidden');
  el('paneDuty').innerHTML='<div class="card"><p class="muted">Loading…</p></div>';
  api('board',{}).then(function(res){
    if(res.s!==200){banner(res.j.error||'Could not load.',false);el('paneDuty').innerHTML='';return;}
    var c=res.j.counts||{};
    var rows=res.j.rows||[];
    var book=res.j.bookCount||c.book||0;
    var html='<div class="card"><h3>Dashboard — today</h3>';
    html+='<p class="muted">Duty, Late Start, Out of Post — name and ID on each row. Today only — not the full HDFC / Master Directory list ('+book+' in the book).</p>';
    html+='<div class="kpis">';
    html+='<div class="kpi"><b>'+(c.onDuty||0)+'</b><span>On duty</span></div>';
    html+='<div class="kpi"><b>'+(c.lateStart||c.late||0)+'</b><span>Late Start</span></div>';
    html+='<div class="kpi"><b>'+(c.outOfPost||0)+'</b><span>Out of Post</span></div>';
    html+='<div class="kpi"><b>'+(c.breakDuty||0)+'</b><span>Break Duty</span></div></div>';
    if(!rows.length) html+='<p class="muted">No Start Duty, Late Start, Out of Post, or Break Duty yet today.</p></div>';
    else {
      html+='<div style="overflow:auto"><table><thead><tr><th>Name</th><th>Site</th><th>Shift</th><th>Report by</th><th>Status</th><th></th></tr></thead><tbody>';
      rows.forEach(function(r){
        var site=esc(r.clientName||r.clientSite||'')+(r.location?'<br><span class="muted">'+esc(r.location)+'</span>':'')+(r.rank?'<br><span class="muted">'+esc(r.rank)+'</span>':'');
        var dist=r.metres!=null?('<br><span class="muted">'+r.metres+' m</span>'):'';
        var note=r.lateMessage||r.leaveMessage||'';
        if(note) dist+='<br><span class="muted">'+esc(note)+'</span>';
        var map=r.mapUrl?' <a class="btn grey" href="'+esc(r.mapUrl)+'" target="_blank" rel="noopener">Map</a>':'';
        html+='<tr><td>'+esc(r.name)+'<br><span class="muted">'+esc(r.idNo)+'</span></td><td>'+site+'<br><span class="muted">'+esc(r.branch)+'</span>'+dist+'</td><td>'+esc(r.shiftLabel||'')+'</td><td>'+esc(r.reportBy)+'</td><td>'+pill(r.flag)+'</td><td><button type="button" class="btn grey" data-chatmob="'+esc(r.mobile)+'" data-name="'+esc(r.name)+'">Message</button> <button type="button" class="btn grey" data-mute="'+esc(r.mobile)+'" data-name="'+esc(r.name)+'">Mute 24h</button>'+map+'</td></tr>';
      });
      html+='</tbody></table></div></div>';
    }
    var blocked=res.j.blocked||[];
    if(blocked.length){
      html+='<div class="card"><h3>Blocked messages (strike / unlawful)</h3>';
      blocked.forEach(function(b){html+='<p class="muted">'+esc(b.fromName)+' · '+esc(b.hit)+' · '+esc(b.snippet)+'</p>';});
      html+='</div>';
    }
    html+='<div class="card" id="weekCard"><h3 id="calMonth">This month calendar</h3><p class="muted" id="weekHint">Pick a person below.</p><div id="calGrid" class="live-cal"></div><p class="live-cal-leg"><span><i class="duty"></i>Duty</span><span><i class="absent"></i>Absent</span><span><i class="off"></i>Weekly off</span></p><div id="weekList" class="live-week-list"></div></div>';
    html+='<div class="card" id="monthCard"><h3>This month</h3><p class="muted" id="monthHint">Loading…</p><div id="monthList"></div></div>';
    html+='<div class="card"><h3>Site Instructions</h3><p class="muted">Shown on the Security Staff phone for that unit.</p>';
    html+='<label>Unit (site)</label><select id="noteSite"><option value="">Pick a unit</option></select>';
    html+='<label>Instruction</label><textarea id="noteText" maxlength="800" style="min-height:90px;width:100%;font-size:16px;font-family:inherit;background:#071018;color:#f1f5f9;border:1px solid #1e293b;border-radius:12px;padding:12px"></textarea>';
    html+='<button type="button" class="btn gold wide" id="btnNoteSave" style="margin-top:12px">Save site instruction</button></div>';
    html+='<div class="card"><h3>Soft Skill</h3><p class="muted">Short lines for the phone Soft Skill tab. Not the Training report.</p>';
    html+='<label>Title</label><input id="softTitle" maxlength="80" placeholder="Greet first">';
    html+='<label>Line</label><input id="softText" maxlength="400" placeholder="Greet every visitor politely.">';
    html+='<button type="button" class="btn gold wide" id="btnSoftSave" style="margin-top:12px">Save soft skill</button></div>';
    html+='<div class="card"><h3>Weekly off for the unit</h3><p class="muted">Sunday is normal. The OM / incharge can set another day for each site.</p>';
    html+='<label>Unit (site)</label><select id="woSite"><option value="">Pick a unit</option></select>';
    html+='<label>Weekly off day</label><select id="woDay"><option value="0">Sunday</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option></select>';
    html+='<button type="button" class="btn gold wide" id="btnWoSave" style="margin-top:12px">Save weekly off</button></div>';
    html+='<div class="card"><h3>Portal attendance</h3><p class="muted">Use this when the phone has no signal or the mobile will not Start Duty.</p>';
    html+='<label>Person</label><select id="portalWho"><option value="">Pick a person</option></select>';
    html+='<button type="button" class="btn green wide" id="btnPortal" style="margin-top:12px">Mark present today</button></div>';
    html+='<div class="card"><h3>Duty reminder · Vacant Post</h3><p class="muted">Duty reminder opens Wage Slip on the phone. Training (OJT) is a reminder only — not the Training report.</p>';
    html+='<label>Person</label><select id="remindWho"><option value="">Pick a person</option></select>';
    html+='<label>Unit (Vacant Post)</label><select id="vacantSite"><option value="">Same as their site</option></select>';
    html+='<button type="button" class="btn gold wide" id="btnDutyRm" style="margin-top:12px">Send duty reminder</button>';
    html+='<button type="button" class="btn navy wide" id="btnOjtRm">Send training (OJT) reminder</button>';
    html+='<button type="button" class="btn green wide" id="btnVacant">Allot Vacant Post duty</button></div>';
    var rms=res.j.reminders||[];
    html+='<div class="card"><h3>Reminder replies</h3>';
    if(!rms.length) html+='<p class="muted">No duty / training / Vacant Post reminders yet.</p></div>';
    else {
      rms.forEach(function(r){
        html+='<div class="month-row"><b>'+esc(r.name)+'</b> · '+esc(r.kind==='training'?'Training (OJT)':(r.kind==='vacant_post'?'Vacant Post':'Duty'))+'<br><span class="muted">'+(r.reply?('Reply: '+esc(r.reply)): 'Waiting')+' · '+esc(r.clientSite||'')+'</span></div>';
      });
      html+='</div>';
    }
    html+='<div class="card"><h3>Attendance reports</h3><p class="muted" id="attNote">Absent more than 7 days · Irregular (less than 13 duty days) · Month · Unit for billing / wages.</p><div id="attBox"><p class="muted">Loading…</p></div></div>';
    el('paneDuty').innerHTML=html;
    Array.prototype.forEach.call(el('paneDuty').querySelectorAll('[data-chatmob]'),function(btn){
      btn.addEventListener('click',function(){
        var mob=last10(btn.getAttribute('data-chatmob')||'');
        var nm=btn.getAttribute('data-name')||'';
        el('ops').classList.add('hidden');
        openThread({id:mob,mobile:mob,name:nm,role:'Security Staff',text:'',at:''});
      });
    });
    Array.prototype.forEach.call(el('paneDuty').querySelectorAll('[data-mute]'),function(btn){
      btn.addEventListener('click',function(){
        var mob=last10(btn.getAttribute('data-mute')||'');
        api('mute',{key:'g:'+mob,name:btn.getAttribute('data-name')}).then(function(r){
          banner(r.s===200?'Muted for 24 hours.':(r.j.error||'Could not mute'),r.s===200);
        });
      });
    });
    loadStaffMonth();
    loadLiveAttTools();
  });
}
function loadLiveAttTools(){
  if(CTX.role==='management'&&(!CTX.branchId||CTX.branchId==='ALL')){
    var att=el('attBox'); if(att)att.innerHTML='<p class="muted">Pick one branch first.</p>';
    return;
  }
  api('weekRoster',{}).then(function(res){
    var site=el('woSite'); var who=el('portalWho');
    var rows=res.s===200?(res.j.rows||[]):[];
    var units=res.s===200?(res.j.units||[]):[];
    if(site){
      site.innerHTML='<option value="">Pick a unit</option>'+units.map(function(u){
        return '<option value="'+esc(u.clientSite)+'" data-wo="'+esc(String(u.weekday||0))+'">'+esc(u.clientSite)+'</option>';
      }).join('');
      site.addEventListener('change',function(){
        var opt=site.options[site.selectedIndex];
        var day=el('woDay');
        if(day&&opt)day.value=opt.getAttribute('data-wo')||'0';
      });
    }
    if(who){
      who.innerHTML='<option value="">Pick a person</option>'+rows.map(function(r){
        return '<option value="'+esc(r.mobile)+'">'+esc(r.name)+' · '+esc(r.idNo)+' · '+esc(r.clientSite||'')+'</option>';
      }).join('');
    }
    var rm=el('remindWho');
    if(rm){
      rm.innerHTML='<option value="">Pick a person</option>'+rows.map(function(r){
        return '<option value="'+esc(r.mobile)+'" data-site="'+esc(r.clientSite||'')+'">'+esc(r.name)+' · '+esc(r.idNo)+' · '+esc(r.clientSite||'')+'</option>';
      }).join('');
    }
    var vs=el('vacantSite');
    if(vs){
      vs.innerHTML='<option value="">Same as their site</option>'+units.map(function(u){
        return '<option value="'+esc(u.clientSite)+'">'+esc(u.clientSite)+'</option>';
      }).join('');
    }
    var ns=el('noteSite');
    if(ns){
      ns.innerHTML='<option value="">Pick a unit</option>'+units.map(function(u){
        return '<option value="'+esc(u.clientSite)+'">'+esc(u.clientSite)+'</option>';
      }).join('');
    }
  });
  var save=el('btnWoSave');
  if(save)save.addEventListener('click',function(){
    var site=el('woSite'); var day=el('woDay');
    api('setUnitWeekOff',{clientSite:site&&site.value,weekday:day?Number(day.value):0}).then(function(r){
      banner(r.j.message||r.j.error||'',r.s===200);
      if(r.s===200)loadWeekRoster();
    });
  });
  var portal=el('btnPortal');
  if(portal)portal.addEventListener('click',function(){
    var who=el('portalWho');
    api('portalAttend',{mobile:who&&who.value}).then(function(r){
      banner(r.j.message||r.j.error||'',r.s===200);
      if(r.s===200){loadStaffMonth();loadAttReports();}
    });
  });
  function remindWho(){
    var who=el('remindWho');
    return who?String(who.value||''):'';
  }
  function vacantSite(){
    var site=el('vacantSite');
    var who=el('remindWho');
    var picked=site?String(site.value||''):'';
    if(picked) return picked;
    if(!who||!who.selectedIndex) return '';
    var opt=who.options[who.selectedIndex];
    return opt?String(opt.getAttribute('data-site')||''):'';
  }
  var dutyRm=el('btnDutyRm');
  if(dutyRm)dutyRm.addEventListener('click',function(){
    api('sendReminder',{kind:'duty',mobile:remindWho()}).then(function(r){
      banner(r.j.message||r.j.error||'',r.s===200);
      if(r.s===200)showOps();
    });
  });
  var ojtRm=el('btnOjtRm');
  if(ojtRm)ojtRm.addEventListener('click',function(){
    api('sendReminder',{kind:'training',mobile:remindWho()}).then(function(r){
      banner(r.j.message||r.j.error||'',r.s===200);
      if(r.s===200)showOps();
    });
  });
  var vacBtn=el('btnVacant');
  if(vacBtn)vacBtn.addEventListener('click',function(){
    api('allotVacant',{mobile:remindWho(),clientSite:vacantSite()}).then(function(r){
      banner(r.j.message||r.j.error||'',r.s===200);
      if(r.s===200)showOps();
    });
  });
  var noteSave=el('btnNoteSave');
  if(noteSave)noteSave.addEventListener('click',function(){
    var site=el('noteSite'); var text=el('noteText');
    api('saveSiteNote',{clientSite:site&&site.value,text:text&&text.value}).then(function(r){
      banner(r.j.message||r.j.error||'',r.s===200);
    });
  });
  var softSave=el('btnSoftSave');
  if(softSave)softSave.addEventListener('click',function(){
    api('saveSoftSkill',{title:el('softTitle')&&el('softTitle').value,text:el('softText')&&el('softText').value}).then(function(r){
      banner(r.j.message||r.j.error||'',r.s===200);
      if(r.s===200)loadSoft();
    });
  });
  loadAttReports();
}
function loadAttReports(){
  var box=el('attBox');
  if(!box)return;
  if(CTX.role==='management'&&(!CTX.branchId||CTX.branchId==='ALL')){box.innerHTML='<p class="muted">Pick one branch first.</p>';return;}
  api('attReports',{}).then(function(res){
    if(res.s!==200){box.innerHTML='<p class="muted">'+(res.j.error||'Could not load reports.')+'</p>';return;}
    var note=el('attNote');
    if(note)note.textContent=res.j.note||'Agile Live attendance book.';
    function list(title,rows,line){
      var html='<h3 style="margin-top:14px">'+title+'</h3>';
      if(!rows||!rows.length) return html+'<p class="muted">None this month.</p>';
      return html+rows.map(line).join('');
    }
    var html='';
    html+=list('Absent more than 7 days',res.j.absent7,function(r){
      return '<div class="month-row"><b>'+esc(r.name)+'</b> · '+esc(r.idNo)+'<br><span class="muted">'+esc(r.clientSite||'')+' · '+r.maxAbsentStreak+' days in a row · last duty '+(esc(r.lastDuty)||'none')+'</span></div>';
    });
    html+=list('Irregular (less than 13 duty days)',res.j.irregular,function(r){
      return '<div class="month-row"><b>'+esc(r.name)+'</b> · '+esc(r.idNo)+'<br><span class="muted">'+esc(r.clientSite||'')+' · '+r.present+' duty days</span></div>';
    });
    html+=list('Monthly attendance',res.j.monthly,function(r){
      return '<div class="month-row"><b>'+esc(r.name)+'</b> · '+esc(r.idNo)+'<br><span class="muted">'+esc(r.clientSite||'')+' · Present '+r.present+' · Weekly off '+r.weeklyOff+' · Absent '+r.absent+(r.portal?' · Portal '+r.portal:'')+'</span></div>';
    });
    html+=list('Unit attendance (billing / wages)',res.j.units,function(r){
      return '<div class="month-row"><b>'+esc(r.clientSite)+'</b><br><span class="muted">'+r.people+' people · '+r.presentDays+' duty days · Portal '+r.portalDays+' · Weekly off '+r.weeklyOffDays+'</span></div>';
    });
    box.innerHTML=html;
  });
}
function loadStaffMonth(){
  var hint=el('monthHint');
  var box=el('monthList');
  if(!hint||!box)return;
  if(CTX.role==='management'&&(!CTX.branchId||CTX.branchId==='ALL')){
    hint.textContent='Pick one branch to open a person’s month.';
    box.innerHTML='';
    return;
  }
  api('monthDuties',{}).then(function(res){
    if(res.s!==200){hint.textContent=res.j.error||'Pick one branch to open a person’s month.';box.innerHTML='';return;}
    var rows=res.j.rows||[];
    hint.textContent=rows.length?('1st of this month to today ('+(res.j.from||'')+' – '+(res.j.to||'')+').'):'No Start Duty this month yet.';
    if(res.j.calendar) paintCal(res.j.calendar);
    var wh=el('weekHint');
    if(wh&&res.j.calendarName) wh.textContent=res.j.calendarName+' · Duty · Weekly off · OT · Absent';
    box.innerHTML=rows.map(function(r){
      var flags=[];
      if(r.lateStart)flags.push('Late Start');
      if(r.outOfPost)flags.push('Out of Post');
      var map=r.mapUrl?' <a href="'+esc(r.mapUrl)+'" target="_blank" rel="noopener">Map</a>':'';
      return '<div class="month-row"><b>'+esc(r.name)+'</b> · '+esc(r.idNo)+'<br><span class="muted">'+esc(r.date)+' · '+(esc(r.clientName||r.clientSite||''))+(r.location?' · '+esc(r.location):'')+(r.shiftLabel?' · '+esc(r.shiftLabel):'')+(flags.length?' · '+esc(flags.join(', ')):'')+(r.metres!=null?' · '+r.metres+' m':'')+map+'</span></div>';
    }).join('');
  });
}
function onOtpLogin(){
  el('login').classList.add('hidden');
  el('app').classList.remove('hidden');
  api('bootstrap',{}).then(function(res){
    if(res.s!==200){banner(res.j.error||'Not authorised.',false);if(typeof otpHandleUnauthorized==='function')otpHandleUnauthorized();return;}
    CTX.email=res.j.email||OTP_EMAIL;
    CTX.name=res.j.name||CTX.email.split('@')[0];
    CTX.role=res.j.role||CTX.role;
    CTX.roleLabel=res.j.roleLabel||(CTX.role==='management'?'Management':'Staff');
    CTX.branchId=res.j.branchId||OTP_BRANCH_ID||'';
    CTX.branches=res.j.branches||[];
    CTX.extras=res.j.extras||[];
    paintStaffHead();
    if(typeof suiteSetMenuTitle==='function')suiteSetMenuTitle(CTX.roleLabel);
    var sel=el('branchSel');
    if(sel){
      sel.innerHTML=suiteMgmtBranchOptionsHtml(CTX.branches,CTX.branchId||'ALL');
      sel.addEventListener('change',function(){CTX.branchId=sel.value;LAST='';ALL=[];paintStaffHead();loadWeekRoster();if(CTX.branchId&&CTX.branchId!=='ALL')startPoll();else {banner('Pick one branch to open chat (not All Branches).',false);paintPeople();}});
    }
    showMain(false);
    paintPeople();
    loadWeekRoster();
    if(CTX.role==='staff'||(CTX.branchId&&CTX.branchId!=='ALL'))startPoll();
  });
}
function loadWeekRoster(){
  var box=el('weekList');
  var hint=el('weekHint');
  if(!box)return;
  if(CTX.role==='management'&&(!CTX.branchId||CTX.branchId==='ALL')){
    if(hint)hint.textContent='Pick one branch to see this week’s site schedule.';
    box.innerHTML='<p class="muted">Pick one branch (not All Branches).</p>';
    return;
  }
  api('weekRoster',{}).then(function(res){
    if(res.s!==200){box.innerHTML='<p class="muted">'+(res.j.error||'Could not load this week.')+'</p>';return;}
    var title=el('weekTitle');
    if(title)title.textContent=res.j.weekLabel||'This week · duty changes every Sunday';
    var rows=res.j.rows||[];
    if(hint)hint.textContent=rows.length?(rows.length+' people · weekly off every 7th day · 8 hrs or 12 hrs'):'No people assigned at sites in this branch yet.';
    box.innerHTML=rows.length?rows.map(function(r){
      return '<div class="month-row"><b>'+esc(r.name)+'</b> · '+esc(r.idNo)+'<br><span class="muted">'+esc(r.todayLine||'')+'</span></div>';
    }).join(''):'<p class="muted">No site schedule for this branch yet.</p>';
  });
}
function paintCal(cal){
  var box=el('calGrid');
  if(!box)return;
  var title=el('calMonth');
  if(title&&cal&&cal.monthLabel) title.textContent=cal.monthLabel;
  var head=['S','M','T','W','T','F','S'].map(function(d){return '<span class="dow">'+d+'</span>';}).join('');
  var days=(cal&&cal.days||[]).map(function(d){
    if(!d.day) return '<span class="d"></span>';
    return '<span class="d '+esc(d.kind||'')+(d.isToday?' today':'')+'">'+d.day+'</span>';
  }).join('');
  box.innerHTML=head+days;
}
function staffBranchLine(){
  if(!CTX.branchId||CTX.branchId==='ALL') return CTX.role==='management'?'Branch: All Branches':'Branch —';
  var hit=(CTX.branches||[]).filter(function(b){return b.id===CTX.branchId;})[0];
  return 'Branch: '+(hit&&hit.name?hit.name:CTX.branchId);
}
function paintStaffHead(){
  var name=CTX.name||'Name';
  var idLine=CTX.email?'ID / Email: '+CTX.email:'ID No.';
  var desig=CTX.roleLabel||'Staff';
  var brLine=staffBranchLine();
  function one(who,id,des,card,pick,br){
    if(who) who.textContent=name;
    if(id) id.textContent=idLine;
    if(des) des.textContent=desig;
    if(card){card.textContent='ID card validity: —'; card.classList.remove('hidden');}
    if(pick) pick.classList.add('hidden');
    if(br) br.textContent=brLine;
  }
  one(el('meWho'),el('meId'),el('meDesig'),el('meCard'),el('meCardPick'),el('meBr'));
  one(el('opsWho'),el('opsId'),el('opsDesig'),el('opsCard'),el('opsCardPick'),el('opsBr'));
}
var GROUP={
  Chat:[{pane:'Chats',label:'Chat'},{pane:'Calls',label:'Call & Video'}],
  News:[{pane:'News',label:'Security News'},{pane:'Weather',label:'Weather & Traffic'}],
  Train:[{pane:'Train',label:'Training'},{pane:'Emergency',label:'Emergency Number'},{pane:'Site',label:'Site Instructions'}],
  Profile:[{pane:'Profile',label:'Profile & Documents'},{pane:'Links',label:'Important Links'}]
};
function showGroup(group,pane){
  var items=GROUP[group]||GROUP.Chat;
  var pick=pane||items[0].pane;
  var sub=el('subFoot');
  if(sub){
    sub.innerHTML=items.map(function(it){
      return '<button type="button" class="app-tap-btn'+(it.pane===pick?' on':'')+'" data-pane="'+it.pane+'">'+it.label+'</button>';
    }).join('');
    Array.prototype.forEach.call(sub.querySelectorAll('[data-pane]'),function(b){
      b.addEventListener('click',function(){showGroup(group, b.getAttribute('data-pane')||'');});
    });
  }
  ['Chat','News','Train','Profile'].forEach(function(g){
    var f=el('foot'+g); if(f)f.classList.toggle('on',g===group);
  });
  ['Chats','Calls','News','Weather','Train','Emergency','Site','Profile','Links'].forEach(function(p){
    var n=el('tab'+p); if(n)n.classList.toggle('hidden',p!==pick);
  });
  if(pick==='Calls') loadCalls('callList');
  if(pick==='Emergency') loadCalls('emBox');
  if(pick==='Weather') loadWeather();
  if(pick==='Site') loadSite();
  if(pick==='News') loadNews();
  if(pick==='Train') loadTrain();
  if(pick==='Profile') loadProfile();
  if(pick==='Links') loadLinks();
}
function staffNeedBranch(){
  return CTX.role==='management'&&(!CTX.branchId||CTX.branchId==='ALL');
}
function callRow(r){
  return '<div class="live-row"><div class="live-row-mid"><div class="live-row-top"><span class="live-num">'+esc(r.name)+'</span></div>'+
    '<div class="live-row-sub"><span class="live-sub">'+esc(r.mobile)+'</span><span class="live-role">'+esc(r.role||'')+'</span></div>'+
    '<div class="live-split"><a class="btn green" href="tel:+91'+esc(r.mobile)+'">Call</a>'+
    '<a class="btn navy" href="https://wa.me/91'+esc(r.mobile)+'" target="_blank" rel="noopener">Video</a></div></div></div>';
}
function loadCalls(boxId){
  var box=el(boxId||'callList'); if(!box)return;
  if(staffNeedBranch()){box.innerHTML='<p class="muted">Pick one branch first.</p>';return;}
  api('callBook',{}).then(function(res){
    var rows=res.s===200?(res.j.calls||[]):[];
    var title=boxId==='emBox'?'<div class="card"><h3>Emergency Number</h3><p class="muted">Call the OM / HOD / Control first. Video opens WhatsApp.</p></div>':'<div class="card"><h3>Call & Video</h3><p class="muted">Call the phone, or tap Video to open WhatsApp.</p></div>';
    if(!rows.length){box.innerHTML=title+'<p class="muted">'+(res.j.error||'No numbers on this branch yet.')+'</p>';return;}
    box.innerHTML=title+rows.map(callRow).join('');
  });
}
function loadWeather(){
  var box=el('wxBox'); if(!box)return;
  if(staffNeedBranch()){box.innerHTML='<p class="muted">Pick one branch first.</p>';return;}
  box.innerHTML='<p class="muted">Loading weather…</p>';
  api('weather',{}).then(function(res){
    var w=res.j.weather;
    if(!w){box.innerHTML='<p class="muted">'+(res.j.error||'Weather is not available now.')+'</p>';return;}
    var traffic=w.trafficUrl?'<a class="btn gold wide" href="'+esc(w.trafficUrl)+'" target="_blank" rel="noopener">Open traffic map</a>':'';
    box.innerHTML='<div class="card"><h3>Weather & Traffic</h3><p class="week-today">'+(w.tempC!=null?w.tempC+'°C':'')+' · '+esc(w.text||'')+'</p><p class="muted">'+esc(w.place||'')+(w.maxC!=null?' · High '+w.maxC+'°C':'')+(w.minC!=null?' · Low '+w.minC+'°C':'')+(w.humidity!=null?' · Humidity '+w.humidity+'%':'')+(w.windKmh!=null?' · Wind '+w.windKmh+' km/h':'')+'</p>'+traffic+'</div>';
  });
}
function loadSite(){
  var box=el('siteBox'); if(!box)return;
  if(staffNeedBranch()){box.innerHTML='<p class="muted">Pick one branch first.</p>';return;}
  api('weekRoster',{}).then(function(res){
    var units=res.s===200?(res.j.units||[]):[];
    var first=units[0]&&units[0].clientSite||'';
    api('siteNote',{clientSite:first}).then(function(r){
      var note=r.j.siteNote;
      box.innerHTML='<div class="card"><h3>Site Instructions</h3><p class="muted">'+esc(first||'')+'</p><p>'+(note&&note.text?esc(note.text):'No site instruction yet. Save one from Dashboard.')+'</p></div>';
    });
  });
}
function loadNews(){
  var box=el('newsBox'); if(!box)return;
  box.innerHTML='<div class="card"><h3>Security News</h3><p>Today’s Security News bulletin for Agile Group.</p>'+
    '<a class="btn gold wide" href="${LIVE_NEWS_PAGE}" target="_blank" rel="noopener">Open Security News</a></div>';
}
function loadTrain(){
  var box=el('trainBox'); if(!box)return;
  api('softSkills',{}).then(function(res){
    var rows=res.s===200?(res.j.softSkills||[]):[];
    var html='<div class="card"><h3>Training</h3><p class="muted">Send the Training (OJT) reminder from Dashboard. This is a reminder only — not the Training report.</p></div>';
    html+='<div class="card"><h3>Soft Skill</h3>'+(rows.length?rows.map(function(r){
      return '<div class="month-row"><b>'+esc(r.title)+'</b><br><span class="muted">'+esc(r.text)+'</span></div>';
    }).join(''):'<p class="muted">No soft skill lines yet. Save one from Dashboard.</p>')+'</div>';
    box.innerHTML=html;
  });
}
function loadProfile(){
  var box=el('profBox'); if(!box)return;
  box.innerHTML='<div class="card"><h3>Profile & Documents</h3>'+
    '<p class="week-today">'+esc(CTX.name||'')+'</p>'+
    '<p>ID / Email: '+esc(CTX.email||'—')+'</p>'+
    '<p>Designation: '+esc(CTX.roleLabel||'Staff')+'</p>'+
    '<p>ID card validity: —</p></div>';
}
function loadLinks(){
  var box=el('linkBox'); if(!box)return;
  box.innerHTML='<div class="card"><h3>Important Links</h3>'+
    '<a class="btn gold wide" href="${LIVE_NEWS_PAGE}" target="_blank" rel="noopener">Security News</a>'+
    '<a class="btn grey wide" href="${LIVE_NEWS_CHANNEL}" target="_blank" rel="noopener">Security News Channel</a>'+
    '<a class="btn navy wide" href="${LIVE_JOBS_URL}" target="_blank" rel="noopener">Job vacancies — SecurityJob</a></div>';
}
el('btnOps').addEventListener('click',showOps);
['Chat','News','Train','Profile'].forEach(function(name){
  var b=el('foot'+name);
  if(b)b.addEventListener('click',function(){showGroup(name);});
});
showGroup('Chat');
el('btnOpsClose').addEventListener('click',function(){el('ops').classList.add('hidden');});
el('btnBack').addEventListener('click',function(){showMain(false);});
el('q').addEventListener('input',paintPeople);
el('btnFindMob').addEventListener('click',function(){
  var mob=last10(el('toMobile').value);
  if(mob.length!==10){banner('Enter a 10-digit mobile.',false);return;}
  api('lookupMobile',{toMobile:mob}).then(function(res){
    if(res.s!==200){banner(res.j.error||'Could not check this mobile.',false);return;}
    el('toMobile').value=res.j.mobile||mob;
    if(res.j.name)el('toName').value=res.j.name;
    if(res.j.kind==='open'){banner('Not in the book. Type a name and tap Add.',true);return;}
    openThread({id:mob,mobile:mob,name:res.j.name||mob,role:res.j.kind==='staff'?'Staff':'Security Staff',text:'',at:''});
    banner('',true);
  });
});
el('btnAddMob').addEventListener('click',function(){
  var mob=last10(el('toMobile').value);
  var nm=String(el('toName').value||'').replace(/\\s+/g,' ').trim();
  if(mob.length!==10){banner('Enter the 10-digit mobile to add.',false);return;}
  if(!nm){banner('Type a name for this mobile (example: Director).',false);return;}
  api('saveMobile',{toMobile:mob,toName:nm}).then(function(res){
    if(res.s!==200){banner(res.j.error||'Could not add this mobile.',false);return;}
    CTX.extras=CTX.extras.filter(function(e){return last10(e.mobile)!==mob;});
    CTX.extras.unshift({mobile:res.j.mobile||mob,name:res.j.name||nm,at:new Date().toISOString()});
    openThread({id:mob,mobile:res.j.mobile||mob,name:res.j.name||nm,role:'',text:'',at:''});
    banner('Mobile added. Type your message and tap Send.',true);
  });
});
var PENDING=null;
el('btnAttach').addEventListener('click',function(){el('chatFile').click();});
el('chatFile').addEventListener('change',function(){
  var f=this.files&&this.files[0];
  this.value='';
  if(!f)return;
  if(f.size>8000000){banner('File too large (keep under 8 MB).',false);return;}
  banner('Ready to send: '+f.name,true);
  var r=new FileReader();
  r.onload=function(){PENDING={name:f.name,mime:f.type,data:String(r.result||'')};};
  r.readAsDataURL(f);
});
function sendChat(){
  var t=el('chatText').value;
  if(!t.trim()&&!PENDING)return;
  api('chatSend',{text:t,toMobile:SEL.mobile||el('toMobile').value,toName:SEL.name||el('toName').value,fileName:PENDING&&PENDING.name,fileMime:PENDING&&PENDING.mime,fileData:PENDING&&PENDING.data}).then(function(res){
    if(res.s!==200){banner(res.j.error||'Not sent.',false);return;}
    el('chatText').value='';
    PENDING=null;
    if(res.j.message){ALL.push(res.j.message);LAST=res.j.message.id;paintPeople();paintThread();}
  });
}
el('btnSend').addEventListener('click',sendChat);
el('chatText').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();sendChat();}});
${liveVoiceBindScript()}
el('btnVoice').addEventListener('click',liveVoiceToggle);
el('btnOut').addEventListener('click',function(){if(typeof otpLogout==='function')otpLogout();});
window.addEventListener('resize',function(){if(el('app').classList.contains('hidden'))return;showMain(!el('main').classList.contains('hidden')||WIDE);});
(function boot(){
  try{if(typeof otpRestoreSession==='function'&&otpRestoreSession()&&OTP_SESSION){onOtpLogin();}}catch(e){}
})();
</script>
</body></html>`
}
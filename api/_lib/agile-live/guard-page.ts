import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../suite-tap-feedback.js'
import { LIVE_APP_NAME, LIVE_DUTY_REPLIES, LIVE_JOBS_URL, LIVE_LEAVE_POST_MSG, LIVE_NEWS_CHANNEL, LIVE_NEWS_PAGE } from './types.js'
import { LIVE_CHAT_ACCEPT, liveVoiceBindScript } from './media.js'
import { LIVE_CHAT_RULE } from './moderation.js'
import { liveI18nScript, liveLangBarHtml } from './i18n.js'
import { LIVE_SHELL_CSS, liveFooterHtml, liveLogoImg, liveOpsIcon, livePersonHeadHtml } from './shell.js'

export function agileLiveGuardPage(): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#14224f">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Agile Live">
<title>${LIVE_APP_NAME}</title>
<style>
${LIVE_SHELL_CSS}
${SUITE_TAP_FEEDBACK_CSS}
</style></head>
<body class="live-home-chat">
<div id="gate" class="gate">
  <div class="live-head">
    <div class="live-crest">${liveLogoImg()}</div>
    <div class="live-me"><b>${LIVE_APP_NAME}</b><span data-i18n="staffRole">Security Staff</span></div>
  </div>
  ${liveLangBarHtml('langPickGate')}
  <div id="gateBanner" class="msg"></div>
  <div class="gate-card">
    <p class="muted" data-i18n="gateHint">Same ID No. and mobile as Master Directory. After this, the chat stays open — you do not open a second screen.</p>
    <label data-i18n="idNo">ID No.</label>
    <input id="idNo" autocomplete="username" enterkeyhint="next" inputmode="text">
    <label data-i18n="mobile">Mobile (10 digits)</label>
    <input id="mobile" inputmode="numeric" maxlength="10" enterkeyhint="go">
    <button type="button" class="btn green" id="btnIn" style="width:100%" data-i18n="openLive">Open ${LIVE_APP_NAME}</button>
  </div>
</div>
<div id="home" class="live-fill hidden">
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
      ${liveLangBarHtml('langPickHome')}
      <div id="banner" class="msg"></div>
      <div id="dutyTimes" class="live-times one-line">
        <p><span id="timeToday">Today’s shift —</span> · <span id="timeTomorrow">Tomorrow’s shift —</span></p>
      </div>
      <div class="live-duty-btns">
        <button type="button" class="btn green" id="btnInDuty" data-i18n="startDuty">Start Duty</button>
        <button type="button" class="btn navy" id="btnOutDuty" data-i18n="endDuty">End Duty</button>
      </div>
      <div class="live-duty-lv hidden" id="startLv">
        <label class="reliever"><input type="checkbox" id="tickPatrol"> <span data-i18n="patrol">Patrolling completed</span></label>
        <label class="reliever"><input type="checkbox" id="tickTakeover"> <span data-i18n="takeover">Taken over</span></label>
      </div>
      <div class="live-duty-lv hidden" id="endLv">
        <label class="reliever"><input type="checkbox" id="tickReliever"> <span data-i18n="reliever">Reliever Reported</span></label>
        <label class="reliever"><input type="checkbox" id="tickHandover"> <span data-i18n="handover">Handed over</span></label>
      </div>
      <div class="live-duty-btns">
        <button type="button" class="btn connect" id="btnConnect"><span data-i18n="connect">Agile Connect</span><small data-i18n="connectSub">Complaints</small></button>
        <button type="button" class="btn alarm-red" id="btnAlarm" data-i18n="alarm">Alarm</button>
      </div>
      <div class="live-alarm-lv hidden" id="alarmLv">
        <button type="button" class="btn low" id="alarmLow" data-i18n="alarmLow" data-i18n-br="1">Green<br>Low Risk</button>
        <button type="button" class="btn med" id="alarmMed" data-i18n="alarmMed" data-i18n-br="1">Yellow<br>Medium Risk</button>
        <button type="button" class="btn high" id="alarmHigh" data-i18n="alarmHigh" data-i18n-br="1">Red<br>High Risk</button>
      </div>
      <p class="live-alarm-hint hidden" id="alarmHint" data-i18n="alarmHint">Green — normal duty. Yellow — extra watch. Red — emergency.</p>
      <div id="tabChats" class="live-tab">
        <p id="vacantLine" class="week-today hidden" style="margin:8px 14px 0"></p>
        <div class="live-list hidden" id="people"></div>
        <p class="rule">${LIVE_CHAT_RULE}</p>
        <div class="live-chat" id="chat"></div>
        <div class="composer">
          <input id="chatFile" type="file" class="hidden" accept="${LIVE_CHAT_ACCEPT}">
          <button type="button" class="btn grey" id="btnAttach">+</button>
          <button type="button" class="btn grey voice" id="btnVoice" aria-label="Voice" title="Voice"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2z"/></svg></button>
          <input id="chatText" type="text" maxlength="400" placeholder="Type a message" data-i18n="typeMsg" data-i18n-placeholder="1">
          <button type="button" class="btn green" id="btnSend" data-i18n="send">Send</button>
        </div>
      </div>
      <div id="tabCalls" class="live-tab hidden"><div class="live-tab-body" id="callList"><p class="muted">Open Call & Video after sign-in.</p></div></div>
      <div id="tabNews" class="live-tab hidden"><div class="live-tab-body" id="newsBox"><p class="muted">Open Security News after sign-in.</p></div></div>
      <div id="tabWeather" class="live-tab hidden"><div class="live-tab-body" id="wxBox"><p class="muted">Open Weather after sign-in.</p></div></div>
      <div id="tabTrain" class="live-tab hidden"><div class="live-tab-body" id="trainBox"><p class="muted">Open Training after sign-in.</p></div></div>
      <div id="tabEmergency" class="live-tab hidden"><div class="live-tab-body" id="emBox"><p class="muted">Open Emergency Number after sign-in.</p></div></div>
      <div id="tabSite" class="live-tab hidden"><div class="live-tab-body" id="siteBox"><p class="muted">Open Site Instructions after sign-in.</p></div></div>
      <div id="tabProfile" class="live-tab hidden"><div class="live-tab-body" id="profBox"><p class="muted">Open Profile after sign-in.</p></div></div>
      <div id="tabLinks" class="live-tab hidden"><div class="live-tab-body" id="linkBox"><p class="muted">Open Important Links after sign-in.</p></div></div>
      ${liveFooterHtml('Chat')}
    </div>
    <div id="main" class="live-main hidden"></div>
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
      extra: `<button type="button" class="btn grey live-head-btn" id="btnOpsClose">Back to chat</button>`,
    })}
    <div class="ops-body">
      <div class="card" id="dashCard">
        <h3 data-i18n="dash">Dashboard</h3>
        <p id="dashShifts" class="week-today">Today’s shift — · Tomorrow’s shift —</p>
        <div class="dash-rounds">
          <div class="dash-round" id="dashDutyWrap"><b id="dashDuty">—</b><span data-i18n="duties">Duties</span></div>
          <div class="dash-round" id="dashLateWrap"><b id="dashLate">—</b><span data-i18n="lateStart">Late Start</span></div>
          <div class="dash-round" id="dashOutWrap"><b id="dashOut">—</b><span data-i18n="leftPost">Left Post</span></div>
        </div>
      </div>
      <div class="card" id="weekCard">
        <b id="weekTitle">This month</b>
        <div id="calGrid" class="live-cal"></div>
        <p class="live-cal-leg"><span><i class="duty"></i>Duty</span><span><i class="absent"></i>Absent</span><span><i class="off"></i>Weekly off</span></p>
        <div id="weekDays" class="hidden"></div>
        <p id="dayPick" class="week-today" data-i18n="calHint">Calendar shows this month. Use Start Duty and End Duty on the first page.</p>
        <div class="live-how">
          <b data-i18n="howStartTitle">How to Start Duty</b><br>
          <span data-i18n="howStart">Tap Start Duty, then tick both Patrolling completed and Taken over. The selfie then opens. Phone location must match the duty post (100 metres).</span>
          Time must match today’s schedule (HDFC 2FA: 7:00 AM–3:00 PM or 3:00 PM–11:00 PM — no night Facility Attendant). If today is Off Duty, Start Duty is only for a Vacant Post allotment.<br>
          <b data-i18n="howEndTitle">How to End Duty</b><br>
          <span data-i18n="howEnd">Tap End Duty, then tick both Reliever Reported and Handed over. The selfie then opens. Location must match the duty post.</span>
        </div>
      </div>
      <div class="card duty-geo">
        <p id="dutyGeo" class="muted" data-i18n="dutyGeo">Start Duty with a selfie and site location.</p>
        <a id="dutyMap" class="btn grey wide hidden" target="_blank" rel="noopener">Map</a>
      </div>
    </div>
  </div>
</div>
<div id="selfieBox" class="live-selfie hidden">
  <video id="selfieVid" autoplay playsinline muted></video>
  <div class="selfie-bar">
    <label class="reliever hidden" id="selfieReliever"><input type="checkbox" id="relieverOk"> Reliever took over</label>
    <button type="button" class="btn grey" id="btnSelfieNo" data-i18n="cancel">Cancel</button>
    <button type="button" class="btn green" id="btnSelfieYes" data-i18n="takeSelfie">Take selfie</button>
  </div>
</div>
<div id="dutyAlarm" class="live-alarm hidden">
  <h2 id="alarmTitle">${LIVE_LEAVE_POST_MSG}</h2>
  <p id="alarmText">Control, OM, HOD and Director have been informed.</p>
  <button type="button" class="btn gold" id="btnAlarmOk">OK</button>
</div>
<div id="remindBox" class="live-remind hidden">
  <div class="live-remind-card">
    <h2 id="remindTitle">Duty reminder</h2>
    <p id="remindText"></p>
    <div id="wageSlip" class="wage hidden"></div>
    <label>Reply</label>
    <select id="remindReply">
      <option value="">Pick a reply</option>
      ${LIVE_DUTY_REPLIES.map((r) => `<option value="${r}">${r}</option>`).join('')}
    </select>
    <button type="button" class="btn green wide" id="btnRemindYes" style="margin-top:12px">Send reply</button>
  </div>
</div>
<script>
${suiteTapFeedbackInitScript()}
${liveI18nScript()}
(function(){
var TOKEN='', ME='', MOB='', LAST='', PUNCH='in', POLL=null, GEO=null, ON=false, LEFT=false, ALL=[], WIDE=false, SHOW_RM='', RM_ID='', DONE_RM='', TODAY='', LAST_DUTY=null, DUTY_ACT='';
function isWide(){return window.matchMedia('(min-width:1100px)').matches;}
var SEL={id:'group',mobile:'',name:'Branch group',role:'Security Staff'};
function el(id){return document.getElementById(id);}
function show(id,on){var n=el(id);if(n)n.classList.toggle('hidden',!on);}
function banner(t,ok){
  ['banner','gateBanner'].forEach(function(id){
    var n=el(id); if(!n)return;
    n.textContent=t||'';
    n.className='msg '+(t?(ok?'ok':'err'):'');
  });
}
function api(action,extra){
  return fetch('/api/live/data',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,guardToken:TOKEN},extra||{}))})
    .then(function(r){return r.json().then(function(j){return {s:r.status,j:j};});});
}
function saveTok(t){TOKEN=t||'';try{if(TOKEN)localStorage.setItem('live_guard',TOKEN);else localStorage.removeItem('live_guard');}catch(e){}}
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
  var h=d.getHours(),mi=d.getMinutes(),ap=h>=12?'pm':'am'; h=h%12||12;
  var t=h+':'+(mi<10?'0':'')+mi+' '+ap;
  return d.toDateString()===now.toDateString()?t:(d.getDate()+'/'+(d.getMonth()+1));
}
function paintDuty(d){
  LAST_DUTY=d||null;
  ME=d.name||'';
  MOB=last10(d.mobile||el('mobile').value||MOB);
  ON=!!d.onDuty;
  var site=[d.clientName||d.clientSite||'',d.location||'',d.shiftLabel||''].filter(Boolean).join(' · ');
  var desig=d.rank||d.designation||'Security Staff';
  TODAY=d.today||'';
  paintHead(d, desig);
  paintShifts(d);
  paintDash(d, site, desig);
  var geo=el('dutyGeo');
  var map=el('dutyMap');
  var bits=[];
  if(site) bits.push(site);
  if(d.metres!=null) bits.push(d.metres+' metres from the duty post');
  if(d.lateMessage) bits.push(d.lateMessage);
  if(d.outOfPost) bits.push('${LIVE_LEAVE_POST_MSG}');
  geo.textContent=bits.length?bits.join(' · '):(d.onDuty?'On duty at the post.':t('dutyGeo'));
  if(d.mapUrl){map.href=d.mapUrl;map.classList.remove('hidden');}
  else {map.removeAttribute('href');map.classList.add('hidden');}
  if(d.outOfPost) showAlarm('${LIVE_LEAVE_POST_MSG}');
  else LEFT=false;
  watchGeo(!!d.onDuty);
}
function paintHead(d, desig){
  var missing=!!d.idCardMissing;
  var brLine=d.branch?(t('branchLine')+' '+d.branch):(t('branchLine')+' —');
  function one(who,id,des,card,pick,date,br){
    if(who) who.textContent=d.name||'Name';
    if(id) id.textContent=d.idNo?'ID No. '+d.idNo:'ID No.';
    if(des) des.textContent=desig||d.designation||'Security Staff';
    if(card){
      card.textContent=missing?'':'ID card validity: '+(d.idCardValidity||'');
      card.classList.toggle('hidden', missing);
    }
    if(pick) pick.classList.toggle('hidden', !missing);
    if(date && d.idCardIso) date.value=d.idCardIso;
    if(br) br.textContent=brLine;
  }
  one(el('meWho'),el('meId'),el('meDesig'),el('meCard'),el('meCardPick'),el('meCardDate'),el('meBr'));
  one(el('opsWho'),el('opsId'),el('opsDesig'),el('opsCard'),el('opsCardPick'),el('opsCardDate'),el('opsBr'));
  bindCardDate('meCardDate');
  bindCardDate('opsCardDate');
}
function bindCardDate(id){
  var n=el(id); if(!n||n.getAttribute('data-on'))return;
  n.setAttribute('data-on','1');
  n.addEventListener('change',function(){
    var v=String(n.value||'');
    if(!v){banner('Pick the ID card validity date.',false);return;}
    api('saveIdCard',{idCard:v}).then(function(res){
      banner(res.j.message||res.j.error||'',res.s===200);
      if(res.j.duty)paintDuty(res.j.duty);
    });
  });
}
function shiftLetter(d, which){
  var w=d.week||{};
  if(which==='tom'){
    if(w.tomorrowOff) return 'Off';
    return d.tomorrowShift||w.tomorrowShift||'—';
  }
  if(w.todayOff) return 'Off';
  return d.todayShift||w.todayShift||d.shiftCode||'—';
}
function paintShifts(d){
  var today=t('todayShift')+' '+shiftLetter(d,'today');
  var tom=t('tomShift')+' '+shiftLetter(d,'tom');
  var t1=el('timeToday'); if(t1) t1.textContent=today;
  var t2=el('timeTomorrow'); if(t2) t2.textContent=tom;
  var ds=el('dashShifts'); if(ds) ds.textContent=today+' · '+tom;
}
function paintDash(d, site, desig){
  var duty=el('dashDuty');
  var late=el('dashLate');
  var out=el('dashOut');
  var done=d.completedDuty?'Yes':(d.onDuty?'On duty':'No');
  if(d.week&&d.week.todayOff && !d.onDuty && !d.completedDuty) done='Off';
  if(duty) duty.textContent=done;
  if(late) late.textContent=d.lateStart||d.isLateForReport?'Yes':'No';
  if(out) out.textContent=d.outOfPost?'Yes':'No';
  var w1=el('dashDutyWrap'); if(w1) w1.className='dash-round'+(done==='Yes'||done==='On duty'?' on':'');
  var w2=el('dashLateWrap'); if(w2) w2.className='dash-round'+(d.lateStart||d.isLateForReport?' warn':' ok');
  var w3=el('dashOutWrap'); if(w3) w3.className='dash-round'+(d.outOfPost?' warn':' ok');
}
function paintCal(cal){
  var box=el('calGrid');
  if(!box)return;
  var title=el('weekTitle');
  if(title) title.textContent=cal&&cal.monthLabel?cal.monthLabel:'This month';
  var pick=el('dayPick');
  if(pick) pick.textContent=t('calHint');
  var head=['S','M','T','W','T','F','S'].map(function(d){return '<span class="dow">'+d+'</span>';}).join('');
  var days=(cal&&cal.days||[]).map(function(d){
    if(!d.day) return '<span class="d"></span>';
    return '<span class="d '+esc(d.kind||'')+(d.isToday?' today':'')+'">'+d.day+'</span>';
  }).join('');
  box.innerHTML=head+days;
  var todayDay=(cal&&cal.days||[]).filter(function(x){return x&&x.isToday;})[0];
  if(todayDay&&LAST_DUTY){
    LAST_DUTY.completedDuty=todayDay.kind==='duty'||todayDay.kind==='ot';
    paintDash(LAST_DUTY,'','');
  }
}
function groupMenu(){
  return {
    Chat:[{pane:'Chats',label:t('chat')},{pane:'Calls',label:t('callVideo')}],
    News:[{pane:'News',label:t('news')},{pane:'Weather',label:t('weather')}],
    Train:[{pane:'Train',label:t('train')},{pane:'Emergency',label:t('emergency')},{pane:'Site',label:t('siteNote')}],
    Profile:[{pane:'Profile',label:t('profile')},{pane:'Links',label:t('links')}]
  };
}
function showGroup(group,pane){
  var GROUP=groupMenu();
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
function callRow(r){
  return '<div class="live-row"><div class="live-row-mid"><div class="live-row-top"><span class="live-num">'+esc(r.name)+'</span></div>'+
    '<div class="live-row-sub"><span class="live-sub">'+esc(r.mobile)+'</span><span class="live-role">'+esc(r.role||'')+'</span></div>'+
    '<div class="live-split"><a class="btn green" href="tel:+91'+esc(r.mobile)+'">Call</a>'+
    '<a class="btn navy" href="https://wa.me/91'+esc(r.mobile)+'" target="_blank" rel="noopener">Video</a></div></div></div>';
}
function loadCalls(boxId){
  api('callBook',{}).then(function(res){
    var box=el(boxId||'callList'); if(!box)return;
    var rows=res.s===200?(res.j.calls||[]):[];
    var title=boxId==='emBox'?'<div class="card"><h3>Emergency Number</h3><p class="muted">Call the OM / HOD / Control first. Video opens WhatsApp.</p></div>':'<div class="card"><h3>Call & Video</h3><p class="muted">Call the phone, or tap Video to open WhatsApp.</p></div>';
    if(!rows.length){box.innerHTML=title+'<p class="muted">No numbers on this branch yet.</p>';return;}
    box.innerHTML=title+rows.map(callRow).join('');
  });
}
function loadWeather(){
  var box=el('wxBox'); if(!box)return;
  box.innerHTML='<p class="muted">Loading weather…</p>';
  locThen(function(lat,lng){
    api('weather',{lat:lat,lng:lng}).then(function(res){
      var w=res.j.weather;
      if(!w){box.innerHTML='<p class="muted">'+(res.j.error||'Weather is not available now.')+'</p>';return;}
      var traffic=w.trafficUrl?'<a class="btn gold wide" href="'+esc(w.trafficUrl)+'" target="_blank" rel="noopener">Open traffic map</a>':'';
      box.innerHTML='<div class="card"><h3>Weather & Traffic</h3><p class="week-today">'+(w.tempC!=null?w.tempC+'°C':'')+' · '+esc(w.text||'')+'</p><p class="muted">'+esc(w.place||'')+(w.maxC!=null?' · High '+w.maxC+'°C':'')+(w.minC!=null?' · Low '+w.minC+'°C':'')+(w.humidity!=null?' · Humidity '+w.humidity+'%':'')+(w.windKmh!=null?' · Wind '+w.windKmh+' km/h':'')+'</p>'+traffic+'</div>';
    });
  });
}
function loadSite(){
  api('siteNote',{}).then(function(res){
    var box=el('siteBox'); if(!box)return;
    var note=res.j.siteNote;
    box.innerHTML='<div class="card"><h3>Site Instructions</h3><p class="muted">'+esc(res.j.site||'')+'</p><p>'+(note&&note.text?esc(note.text):'No site instruction yet. OM will add it.')+'</p></div>';
  });
}
function loadNews(){
  var box=el('newsBox'); if(!box)return;
  box.innerHTML='<div class="card"><h3>Security News</h3><p>Today’s Security News bulletin for Agile Group.</p>'+
    '<a class="btn gold wide" href="${LIVE_NEWS_PAGE}" target="_blank" rel="noopener">'+t('newsOpen')+'</a></div>';
}
function loadTrain(){
  var box=el('trainBox'); if(!box)return;
  api('softSkills',{}).then(function(res){
    var rows=res.s===200?(res.j.softSkills||[]):[];
    var html='<div class="card"><h3>Training</h3><p class="muted">Training (OJT) reminder comes from your OM. This is a reminder only — not the Training report.</p></div>';
    html+='<div class="card"><h3>Soft Skill</h3>'+(rows.length?rows.map(function(r){
      return '<div class="month-row"><b>'+esc(r.title)+'</b><br><span class="muted">'+esc(r.text)+'</span></div>';
    }).join(''):'<p class="muted">No soft skill lines yet.</p>')+'</div>';
    box.innerHTML=html;
  });
}
function loadProfile(){
  var box=el('profBox'); if(!box)return;
  var d=LAST_DUTY||{};
  var desig=d.rank||d.designation||'Security Staff';
  var missing=!!d.idCardMissing;
  box.innerHTML='<div class="card"><h3>Profile & Documents</h3>'+
    '<p class="week-today">'+esc(d.name||'')+'</p>'+
    '<p>ID No. '+esc(d.idNo||'—')+'</p>'+
    '<p>Designation: '+esc(desig)+'</p>'+
    '<p>Branch: '+esc(d.branch||'—')+'</p>'+
    '<p>Site: '+esc(d.clientSite||'—')+'</p>'+
    (d.doj?'<p>Date of joining: '+esc(d.doj)+'</p>':'')+
    (d.aadhaar?'<p>Aadhaar: '+esc(d.aadhaar)+'</p>':'')+
    (missing?'<p class="muted">ID card validity is not on file. Pick the date in the header.</p>':
      '<p>ID card validity: '+esc(d.idCardValidity||'—')+'</p>')+
    '</div>';
}
function loadLinks(){
  var box=el('linkBox'); if(!box)return;
  box.innerHTML='<div class="card"><h3>Important Links</h3>'+
    '<a class="btn gold wide" href="${LIVE_NEWS_PAGE}" target="_blank" rel="noopener">Security News</a>'+
    '<a class="btn grey wide" href="${LIVE_NEWS_CHANNEL}" target="_blank" rel="noopener">Security News Channel</a>'+
    '<a class="btn navy wide" href="${LIVE_JOBS_URL}" target="_blank" rel="noopener">Job vacancies — SecurityJob</a></div>';
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
  add('group','','Branch group','Security Staff','','');
  ALL.forEach(function(m){
    if(m.toMobile&&last10(m.toMobile)===MOB) add(last10(m.fromId&&String(m.fromId).indexOf('s:')===0?m.fromName:m.fromId), last10(m.toMobile), m.fromName, roleOf(m), m.text, m.at);
    if(m.fromRole==='staff') add('s:'+(m.fromId||m.fromName), '', m.fromName, roleOf(m), m.text, m.at);
    if(String(m.fromId||'').indexOf('g:')===0 && last10(m.fromId.slice(2))!==MOB) add(last10(m.fromId.slice(2)), last10(m.fromId.slice(2)), m.fromName, 'Security Staff', m.text, m.at);
  });
  var rows=Object.keys(map).map(function(k){return map[k];});
  rows.sort(function(a,b){ if(a.id==='group')return -1; if(b.id==='group')return 1; return String(b.at||'').localeCompare(String(a.at||'')); });
  return rows;
}
function inThread(m){
  if(SEL.id==='group')return !m.toMobile;
  if(m.toMobile&&last10(m.toMobile)===MOB) return roleOf(m)===SEL.role && (m.fromName===SEL.name || String(m.fromId)===SEL.id);
  return false;
}
function paintPeople(){
  var box=el('people'); if(box) box.innerHTML='';
}
function paintThread(){
  var box=el('chat'); box.innerHTML='';
  ALL.filter(inThread).forEach(function(m){
    LAST=m.id;
    var div=document.createElement('div');
    div.className='bub '+(String(m.fromName)===ME?'me':'them');
    var sm=document.createElement('small');
    sm.textContent=(m.fromName||'')+' · '+roleOf(m)+(m.toMobile?' · To you':'');
    div.appendChild(sm);
    if(m.fileUrl&&m.fileKind==='image'){var im=document.createElement('img');im.src=m.fileUrl;im.alt=m.fileName||'photo';div.appendChild(im);}
    else if(m.fileUrl&&m.fileKind==='audio'){var au=document.createElement('audio');au.controls=true;au.src=m.fileUrl;div.appendChild(au);}
    else if(m.fileUrl&&m.fileKind==='video'){var vd=document.createElement('video');vd.controls=true;vd.src=m.fileUrl;div.appendChild(vd);}
    else if(m.fileUrl){var a=document.createElement('a');a.className='file';a.href=m.fileUrl;a.target='_blank';a.rel='noopener';a.textContent=m.fileName||'Open file';div.appendChild(a);}
    if(m.text)div.appendChild(document.createTextNode(m.text));
    box.appendChild(div);
  });
  box.scrollTop=box.scrollHeight;
}
function showMain(){}
function openThread(p){
  if(p) SEL=p;
  paintThread();
}
function loadChat(full){
  api('chatList',{afterId:full?'':LAST}).then(function(res){
    if(res.s!==200)return;
    if(full)ALL=[];
    var added=0;
    (res.j.messages||[]).forEach(function(m){
      if(ALL.some(function(x){return x.id===m.id;}))return;
      ALL.push(m); LAST=m.id;
      if(!full && String(m.fromName)!==ME) added++;
    });
    if(added) beep();
    paintPeople();
    paintThread();
    paintInbox(res.j);
  });
}
function paintMonth(rows){
  var box=el('monthList');
  if(!box)return;
  if(!rows||!rows.length){box.innerHTML='<p class="muted">No Start Duty this month yet.</p>';return;}
  box.innerHTML=rows.map(function(r){
    var flags=[];
    if(r.lateStart)flags.push('Late Start');
    if(r.outOfPost)flags.push('Out of Post');
    var tm=when(r.startedAt);
    var end=r.endedAt?(' – '+when(r.endedAt)):'';
    var site=[r.clientName||'',r.location||'',r.shiftLabel||''].filter(Boolean).join(' · ');
    return '<div class="month-row"><b>'+esc(r.date)+'</b> · '+esc(tm)+end+(site?' · '+esc(site):'')+(flags.length?' · '+esc(flags.join(', ')):'')+(r.metres!=null?' · '+r.metres+' m':'')+'</div>';
  }).join('');
}
function loadMonth(){
  api('dutyMonth',{}).then(function(res){
    if(res.s!==200)return;
    paintMonth(res.j.rows||[]);
    if(res.j.calendar) paintCal(res.j.calendar);
  });
}
function paintInbox(j){
  if(!j)return;
  var vac=j.vacant||null;
  var vacLine=vac&&vac.clientSite?('Vacant Post duty today — '+vac.clientSite):'';
  var vacTop=el('vacantLine');
  if(vacTop){
    vacTop.textContent=vacLine;
    vacTop.classList.toggle('hidden',!vacLine);
  }
  var rem=(j.reminders||[]).filter(function(r){return !r.reply;})[0];
  if(rem) showRemind(rem, j.wageSlip);
  else hideRemind();
  if(j.calendar) paintCal(j.calendar);
}
function remindKindTitle(kind){
  if(kind==='training') return 'Training (OJT) reminder';
  if(kind==='vacant_post') return 'Vacant Post duty';
  return 'Duty reminder';
}
function hideRemind(){
  SHOW_RM=''; RM_ID='';
  var box=el('remindBox'); if(box)box.classList.add('hidden');
}
function showRemind(r, slip){
  if(!r || r.id===DONE_RM)return;
  RM_ID=r.id;
  el('remindTitle').textContent=remindKindTitle(r.kind);
  el('remindText').textContent=r.text||'Please reply from the list.';
  var slipBox=el('wageSlip');
  if(slip && (r.showWageSlip||r.kind==='duty')){
    slipBox.classList.remove('hidden');
    slipBox.innerHTML='<b>Wage Slip</b>'+
      esc(slip.name||'')+(slip.idNo?' · '+esc(slip.idNo):'')+'<br>'+
      esc(slip.site||'')+(slip.rank?' · '+esc(slip.rank):'')+'<br>'+
      'Duty days this month: '+(slip.dutyDays||0)+'<br>'+
      esc(slip.note||'Amount shows when the branch wage is uploaded.');
  } else {
    slipBox.classList.add('hidden');
    slipBox.innerHTML='';
  }
  if(r.id!==SHOW_RM){
    SHOW_RM=r.id;
    el('remindReply').value='';
    el('remindBox').classList.remove('hidden');
    beep();
  } else {
    el('remindBox').classList.remove('hidden');
  }
}
function sendRemindReply(){
  var reply=String(el('remindReply').value||'').trim();
  if(!reply){banner('Pick a reply: On the way, Will report, Leave informed, or Traffic delay.',false);return;}
  if(!RM_ID){banner('Reminder already closed.',false);return;}
  banner('Sending reply…',true);
  api('remindReply',{reminderId:RM_ID,reply:reply}).then(function(res){
    banner(res.j.message||res.j.error||'',res.s===200);
    if(res.s!==200)return;
    DONE_RM=RM_ID;
    hideRemind();
    paintInbox(res.j);
  });
}
function askLocBanner(){
  if(!navigator.geolocation){banner(t('locOn'),false);return;}
  navigator.geolocation.getCurrentPosition(function(){
    var n=el('banner');
    if(n && n.textContent===t('locOn')) banner('',true);
  },function(){banner(t('locOn'),false);},{enableHighAccuracy:false,timeout:5000,maximumAge:60000});
}
function openHome(d, extra){
  show('gate',false);show('home',true);
  paintDuty(d);
  paintInbox(extra||{});
  showMain(false);
  loadChat(true);
  loadMonth();
  applyLang();
  askLocBanner();
  if(POLL)clearInterval(POLL);
  POLL=setInterval(function(){loadChat(false);},4000);
}
function signIn(){
  banner('Checking…',true);
  api('guardLookup',{idNo:el('idNo').value,mobile:el('mobile').value,guardToken:''}).then(function(res){
    if(res.s!==200){banner(res.j.error||'Could not open.',false);return;}
    saveTok(res.j.guardToken);
    banner('',true);
    openHome(res.j.duty, res.j);
  }).catch(function(){banner('Network error.',false);});
}
var CAM=null;
function stopSelfie(){
  try{if(CAM){CAM.getTracks().forEach(function(t){t.stop();});} }catch(e){}
  CAM=null;
  var v=el('selfieVid'); if(v)v.srcObject=null;
  el('selfieBox').classList.add('hidden');
}
function snapSelfie(){
  var v=el('selfieVid');
  if(!v||!v.videoWidth)return '';
  var w=v.videoWidth,h=v.videoHeight,max=480;
  if(w>max||h>max){var s=Math.min(max/w,max/h);w=Math.round(w*s);h=Math.round(h*s);}
  var c=document.createElement('canvas');c.width=w;c.height=h;
  c.getContext('2d').drawImage(v,0,0,w,h);
  return c.toDataURL('image/jpeg',0.62);
}
function locThen(cb){
  if(!navigator.geolocation){cb(null,null);return;}
  navigator.geolocation.getCurrentPosition(function(p){cb(p.coords.latitude,p.coords.longitude);},function(){cb(null,null);},{enableHighAccuracy:true,timeout:8000});
}
function saveDuty(photo){
  banner(t('locCheck'),true);
  locThen(function(lat,lng){
    if(lat==null||lng==null){banner(t('locOn'),false);return;}
    api('duty',{kind:PUNCH,photo:photo,lat:lat,lng:lng,reliever:PUNCH==='out',dutyAction:DUTY_ACT}).then(function(res){
      if(res.s!==200){banner(res.j.error||'Could not save.',false);return;}
      banner(res.j.message||'Saved.',true);
      if(res.j.duty)paintDuty(res.j.duty);
      if(res.j.alarm|| (res.j.duty&&res.j.duty.outOfPost)) showAlarm(res.j.message||'${LIVE_LEAVE_POST_MSG}');
      loadMonth();
    });
  });
}
function hideDutyPicks(){
  var s=el('startLv'); if(s) s.classList.add('hidden');
  var e=el('endLv'); if(e) e.classList.add('hidden');
}
function clearDutyTicks(){
  ['tickPatrol','tickTakeover','tickReliever','tickHandover'].forEach(function(id){
    var n=el(id); if(n) n.checked=false;
  });
}
function bothTicked(a,b){
  return !!(el(a)&&el(a).checked&&el(b)&&el(b).checked);
}
function doDuty(kind, action){
  if(!action){banner(kind==='out'?t('tickEnd'):t('tickStart'),false);return;}
  PUNCH=kind;
  DUTY_ACT=action;
  hideDutyPicks();
  var rel=el('selfieReliever');
  if(rel) rel.classList.add('hidden');
  var tick=el('relieverOk'); if(tick) tick.checked=kind==='out';
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    banner(t('locCam'),false);return;
  }
  navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false}).then(function(stream){
    CAM=stream;
    el('selfieVid').srcObject=stream;
    el('selfieBox').classList.remove('hidden');
  }).catch(function(){banner(t('locCamAgain'),false);});
}
el('btnSelfieNo').addEventListener('click',function(){clearDutyTicks();stopSelfie();});
el('btnSelfieYes').addEventListener('click',function(){
  if(PUNCH==='out' && DUTY_ACT!=='end_both'){
    banner(t('tickEnd'),false);return;
  }
  if(PUNCH==='in' && DUTY_ACT!=='start_both'){
    banner(t('tickStart'),false);return;
  }
  var photo=snapSelfie();
  stopSelfie();
  if(!photo){banner('Could not take the selfie. Try again.',false);return;}
  saveDuty(photo);
});
function beep(){
  try{
    var C=window.AudioContext||window.webkitAudioContext; if(!C)return;
    var ctx=new C(); var o=ctx.createOscillator(); var g=ctx.createGain();
    o.type='square'; o.frequency.value=880; g.gain.value=0.08;
    o.connect(g); g.connect(ctx.destination); o.start();
    setTimeout(function(){o.stop();ctx.close();},420);
  }catch(e){}
}
function showAlarm(msg){
  if(LEFT)return;
  LEFT=true;
  el('alarmTitle').textContent=msg||'${LIVE_LEAVE_POST_MSG}';
  el('dutyAlarm').classList.remove('hidden');
  beep();
}
function watchGeo(on){
  if(!on){
    if(GEO){clearInterval(GEO);GEO=null;}
    return;
  }
  if(GEO)return;
  GEO=setInterval(function(){
    locThen(function(lat,lng){
      if(lat==null||lng==null)return;
      api('dutyWatch',{lat:lat,lng:lng}).then(function(res){
        if(res.s!==200)return;
        if(res.j.duty)paintDuty(res.j.duty);
        if(res.j.alarm) showAlarm(res.j.message||'${LIVE_LEAVE_POST_MSG}');
      });
    });
  },25000);
}
function sendStatus(kind,reason){
  banner('Sending…',true);
  api('status',{kind:kind,remark:reason||'',reason:reason||''}).then(function(res){
    banner(res.j.error||res.j.message||'',res.s===200);
    if(res.j.duty)paintDuty(res.j.duty);
    if(res.j.alarm) showAlarm(res.j.message||'${LIVE_LEAVE_POST_MSG}');
    loadMonth();
  });
}
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
  locThen(function(lat,lng){
    api('chatSend',{text:t,lat:lat,lng:lng,fileName:PENDING&&PENDING.name,fileMime:PENDING&&PENDING.mime,fileData:PENDING&&PENDING.data}).then(function(res){
      if(res.s!==200){banner(res.j.error||'Not sent.',false);return;}
      el('chatText').value='';
      PENDING=null;
      banner('',true);
      if(res.j.message){ALL.push(res.j.message);LAST=res.j.message.id;paintPeople();paintThread();}
    });
  });
}
el('btnIn').addEventListener('click',signIn);
el('mobile').addEventListener('keydown',function(e){if(e.key==='Enter')signIn();});
el('btnOps').addEventListener('click',function(){el('ops').classList.remove('hidden');loadMonth();});
['Chat','News','Train','Profile'].forEach(function(name){
  var b=el('foot'+name);
  if(b)b.addEventListener('click',function(){showGroup(name);});
});
showGroup('Chat');
el('btnOpsClose').addEventListener('click',function(){el('ops').classList.add('hidden');});
el('btnInDuty').addEventListener('click',function(){
  var row=el('startLv'); var end=el('endLv');
  if(end) end.classList.add('hidden');
  clearDutyTicks();
  if(row) row.classList.toggle('hidden');
});
el('btnOutDuty').addEventListener('click',function(){
  var row=el('endLv'); var start=el('startLv');
  if(start) start.classList.add('hidden');
  clearDutyTicks();
  if(row) row.classList.toggle('hidden');
});
function watchStartTicks(){
  if(bothTicked('tickPatrol','tickTakeover')) doDuty('in','start_both');
}
function watchEndTicks(){
  if(bothTicked('tickReliever','tickHandover')) doDuty('out','end_both');
}
el('tickPatrol').addEventListener('change',watchStartTicks);
el('tickTakeover').addEventListener('change',watchStartTicks);
el('tickReliever').addEventListener('change',watchEndTicks);
el('tickHandover').addEventListener('change',watchEndTicks);
el('btnConnect').addEventListener('click',function(){
  var d=LAST_DUTY||{};
  var q=new URLSearchParams();
  if(d.branch) q.set('branch',d.branch);
  if(d.name) q.set('name',d.name);
  if(d.idNo) q.set('idNo',d.idNo);
  if(MOB||d.mobile) q.set('mobile', last10(MOB||d.mobile||''));
  window.open('/guards/register?'+q.toString(),'_blank','noopener');
});
el('btnAlarm').addEventListener('click',function(){
  var row=el('alarmLv'); var hint=el('alarmHint');
  if(row) row.classList.toggle('hidden');
  if(hint) hint.classList.toggle('hidden', !row || row.classList.contains('hidden'));
});
function sendStaffAlarm(level){
  var row=el('alarmLv'); if(row) row.classList.add('hidden');
  var hint=el('alarmHint'); if(hint) hint.classList.add('hidden');
  banner('Sending alarm…',true);
  locThen(function(lat,lng){
    api('staffAlarm',{level:level,lat:lat,lng:lng}).then(function(res){
      banner(res.j.message||res.j.error||'',res.s===200);
      if(res.s===200) beep();
      if(res.j.duty)paintDuty(res.j.duty);
    });
  });
}
el('alarmLow').addEventListener('click',function(){sendStaffAlarm('low');});
el('alarmMed').addEventListener('click',function(){sendStaffAlarm('medium');});
el('alarmHigh').addEventListener('click',function(){sendStaffAlarm('high');});
el('btnAlarmOk').addEventListener('click',function(){el('dutyAlarm').classList.add('hidden');});
el('btnRemindYes').addEventListener('click',sendRemindReply);
el('btnSend').addEventListener('click',sendChat);
el('chatText').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();sendChat();}});
${liveVoiceBindScript()}
el('btnVoice').addEventListener('click',liveVoiceToggle);
window.liveAfterLang=function(){
  if(LAST_DUTY){
    paintShifts(LAST_DUTY);
    paintHead(LAST_DUTY, LAST_DUTY.rank||LAST_DUTY.designation||t('staffRole'));
  }
  var on=['Chat','News','Train','Profile'].filter(function(g){
    var b=el('foot'+g); return b&&b.classList.contains('on');
  })[0]||'Chat';
  showGroup(on);
};
bindLangPick('langPickGate');
bindLangPick('langPickHome');
applyLang();
try{
  var savedTok=localStorage.getItem('live_guard')||'';
  if(savedTok){TOKEN=savedTok;api('guardHome',{}).then(function(res){if(res.s===200)openHome(res.j.duty,res.j);else saveTok('');});}
}catch(e){}
})();
</script>
</body></html>`
}
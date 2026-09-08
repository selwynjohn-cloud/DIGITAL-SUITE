/** Shared email OTP + per-branch password login for server-rendered suite apps (01–15). */

import { defaultBranchLoginFallback } from './branch-login-options.js'
import { MIS_BRANCH_HINTS_JS } from './mis/branch-labels.js'
import { suiteTapFeedbackInitScript } from './suite-tap-feedback.js'
import { suiteDateInputInitScript } from './suite-date-input.js'

/**
 * Safari/iPhone PIN fields:
 * Prefer type=text + inputmode=numeric (password type often blocks digit pad / Enter).
 * Mask with -webkit-text-security so digits stay private.
 */
const SAFARI_PIN =
  'text-align:center;font-size:22px;letter-spacing:0.35em;font-family:system-ui,-apple-system,sans-serif;-webkit-text-security:disc;text-security:disc'

/** Branch HOD login — per-branch password + email PIN reset. */
export function hodLoginHtml(title: string, subtitle: string, branchOptionsHtml?: string): string {
  return branchStaffLoginHtml(title, subtitle, branchOptionsHtml)
}

export function branchStaffLoginHtml(title: string, subtitle: string, branchOptionsHtml?: string): string {
  const branchSelect =
    branchOptionsHtml?.trim() ||
    '<option value="">Loading branches…</option>'
  return `<div id="login"><div class="card">
  <h2>${title}</h2>
  <p style="color:#94a3b8;font-size:13px;margin-bottom:14px">${subtitle}</p>
  <p style="font-size:12px;color:#64748b;margin-bottom:12px;line-height:1.55">
    <strong>Morning login:</strong> select your <strong>branch</strong> → enter your <strong>@agilegroup.co.in</strong> email → tap <strong>Send PIN</strong>.<br>
    Check <strong>spam</strong> if not in inbox. PIN works once · valid 15 minutes.
  </p>
  <div id="otpStepEmail">
    <form id="otpEmailForm" action="#" method="post" style="margin:0">
    <div id="otpEmailBranchWrap">
    <label>Your branch</label>
    <select id="otpEmailBranch" style="font-size:17px;padding:12px;min-height:50px;position:relative;z-index:3">${branchSelect}</select>
    </div>
    <label>Work email</label>
    <input id="otpEmail" type="email" placeholder="name@agilegroup.co.in" autocomplete="username" inputmode="email" enterkeyhint="go" style="font-size:18px;padding:14px 12px;min-height:50px;position:relative;z-index:3">
    <p style="font-size:12px;color:#fde68a;margin:8px 0 0;line-height:1.45;font-weight:700">On phone: after typing your email, tap the gold <b>Send PIN</b> button (keyboard Done only closes the keyboard).</p>
    <button class="btn gold suite-tap-no-feedback" id="otpSendBtn" style="width:100%;margin-top:12px;min-height:56px;font-size:17px;touch-action:manipulation;cursor:pointer;position:relative;z-index:6;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:rgba(201,168,76,.35)" type="submit">Send 6-digit PIN to email</button>
    </form>
    <button type="button" class="suite-tap-no-feedback" style="width:100%;margin-top:10px;background:none;border:none;color:#94a3b8;cursor:pointer;font-size:13px;min-height:44px" onclick="branchShowMain()">Or use branch password instead</button>
  </div>
  <div id="otpStepPin" class="hidden">
    <label>6-digit PIN from your email</label>
    <input id="otpPin" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="••••••" autocomplete="one-time-code" enterkeyhint="go" autocapitalize="off" autocorrect="off" spellcheck="false" style="${SAFARI_PIN}">
    <p style="font-size:12px;color:#fde68a;margin:8px 0 0;line-height:1.45;font-weight:700">On phone: tap <b>Verify &amp; enter</b> after the PIN (Done only closes the keyboard).</p>
    <button class="btn gold suite-tap-no-feedback" id="otpVerifyBtn" style="width:100%;margin-top:12px;min-height:56px;font-size:17px;touch-action:manipulation;cursor:pointer;position:relative;z-index:6" type="button" onclick="otpVerify()">Verify &amp; enter</button>
    <button type="button" class="suite-tap-no-feedback" id="otpResetBtn" style="width:100%;margin-top:8px;background:none;border:none;color:#94a3b8;cursor:pointer;font-size:13px;min-height:44px">← Change email / send new PIN</button>
  </div>
  <div id="branchLoginMain" class="hidden">
    <form id="branchLoginForm" action="#" method="post" onsubmit="try{branchSignIn();}catch(e){}return false;" style="margin:0">
    <label>Your branch</label>
    <select id="branchLoginBranch" style="font-size:17px;padding:12px;min-height:50px;position:relative;z-index:3">${branchSelect}</select>
    <label>Work email</label>
    <input id="branchLoginEmail" type="email" placeholder="name@agilegroup.co.in" autocomplete="username" inputmode="email" enterkeyhint="next" style="font-size:18px;padding:14px 12px;min-height:50px">
    <label>Branch password (6 digits)</label>
    <input id="branchLoginPwd" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="8" placeholder="••••••" autocomplete="one-time-code" enterkeyhint="go" autocapitalize="off" autocorrect="off" spellcheck="false" style="${SAFARI_PIN}">
    <p style="font-size:12px;color:#fde68a;margin:8px 0 0;line-height:1.45;font-weight:700">On phone: after typing the 6 digits, tap the gold <b>Sign in</b> button below.</p>
    <button class="btn gold suite-tap-no-feedback" id="branchSignInBtn" style="width:100%;margin-top:12px;min-height:54px;font-size:17px;touch-action:manipulation;cursor:pointer;position:relative;z-index:5;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:rgba(201,168,76,.35)" type="button" onclick="try{branchSignIn();}catch(e){}">Sign in</button>
    </form>
    <button type="button" class="suite-tap-no-feedback" style="width:100%;margin-top:8px;background:none;border:none;color:#c9a84c;cursor:pointer;font-size:14px;min-height:44px" onclick="branchShowForgot()">Forgot password?</button>
    <button type="button" class="btn sky suite-tap-no-feedback" style="width:100%;margin-top:10px;min-height:50px;font-size:15px;background:#0ea5e9;color:#fff;border:none;border-radius:9px;font-weight:800;cursor:pointer" onclick="branchShowEmailPin()">← Back to email PIN (morning login)</button>
  </div>
  <div id="branchLoginForgot" class="hidden">
    <p style="font-size:12px;color:#94a3b8;margin-bottom:10px">We will email a 6-digit PIN. Enter it below with your new branch password.</p>
    <label>Your branch</label>
    <select id="branchForgotBranch" style="font-size:17px;padding:12px;min-height:50px"></select>
    <label>Work email</label>
    <input id="branchForgotEmail" type="email" placeholder="name@agilegroup.co.in" style="font-size:18px;padding:14px 12px;min-height:50px">
    <button class="btn gold suite-tap-no-feedback" id="branchForgotSendBtn" style="width:100%;margin-top:10px;min-height:50px" type="button" onclick="branchForgotSend()">Send reset PIN to email</button>
    <div id="branchForgotStep2" class="hidden" style="margin-top:12px">
      <label>6-digit PIN from email</label>
      <input id="branchForgotOtp" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="••••••" autocomplete="one-time-code" enterkeyhint="next" autocapitalize="off" autocorrect="off" spellcheck="false" style="${SAFARI_PIN}">
      <label>New branch password (6 digits)</label>
      <input id="branchForgotNewPwd" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="8" placeholder="••••••" autocomplete="new-password" enterkeyhint="go" autocapitalize="off" autocorrect="off" spellcheck="false" style="${SAFARI_PIN}">
      <button class="btn gold suite-tap-no-feedback" style="width:100%;margin-top:10px;min-height:50px" type="button" onclick="branchForgotReset()">Set new password &amp; sign in</button>
    </div>
    <button type="button" class="suite-tap-no-feedback" style="width:100%;margin-top:10px;background:none;border:none;color:#94a3b8;cursor:pointer;font-size:13px" onclick="branchShowMain()">← Back to branch password</button>
  </div>
  <div id="msg" class="msg"></div>
</div></div>`
}

export function otpLoginHtml(
  title: string,
  subtitle: string,
  staffBranchPin = false,
  branchOptionsHtml?: string,
  helpText?: string,
): string {
  if (staffBranchPin) return branchStaffLoginHtml(title, subtitle, branchOptionsHtml)
  const help =
    helpText ||
    'Use your official <strong>@agilegroup.co.in</strong> email (including Director). A 6-digit PIN is emailed to you — valid <strong>15 minutes</strong>. Check <strong>spam</strong> if not in inbox. Wait 90 seconds before requesting again.'
  return `<div id="login"><div class="card">
  <h2>${title}</h2>
  <p style="color:#94a3b8;font-size:13px;margin-bottom:14px">${subtitle}</p>
  <p style="font-size:12px;color:#64748b;margin-bottom:12px">${help}</p>
  <div id="otpStepEmail">
    <form id="otpEmailForm" action="#" method="post" style="margin:0">
    <label>Work email</label>
    <input id="otpEmail" type="email" placeholder="name@agilegroup.co.in" autocomplete="username" inputmode="email" enterkeyhint="go" style="font-size:18px;padding:14px 12px;min-height:50px;position:relative;z-index:3">
    <p style="font-size:12px;color:#fde68a;margin:8px 0 0;line-height:1.45;font-weight:700">On phone: after typing your email, tap the gold <b>Send PIN</b> button below (keyboard Done only closes the keyboard).</p>
    <button class="btn gold suite-tap-no-feedback" id="otpSendBtn" style="width:100%;margin-top:12px;min-height:56px;font-size:17px;touch-action:manipulation;cursor:pointer;position:relative;z-index:6;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:rgba(201,168,76,.35)" type="submit">Send 6-digit PIN to email</button>
    </form>
  </div>
  <div id="otpStepPin" class="hidden">
    <label>6-digit PIN from your email</label>
    <input id="otpPin" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="••••••" autocomplete="one-time-code" enterkeyhint="go" autocapitalize="off" autocorrect="off" spellcheck="false" style="${SAFARI_PIN}">
    <p style="font-size:12px;color:#fde68a;margin:8px 0 0;line-height:1.45;font-weight:700">On phone: tap <b>Verify &amp; enter</b> after the PIN (Done only closes the keyboard). Each PIN works <b>once</b> — if you see this screen again, tap Send PIN for a <b>new</b> code.</p>
    <button class="btn gold suite-tap-no-feedback" id="otpVerifyBtn" style="width:100%;margin-top:12px;min-height:56px;font-size:17px;touch-action:manipulation;cursor:pointer;position:relative;z-index:6" type="button" onclick="otpVerify()">Verify &amp; enter</button>
    <button type="button" class="suite-tap-no-feedback" id="otpResetBtn" style="width:100%;margin-top:8px;background:none;border:none;color:#94a3b8;cursor:pointer;font-size:13px;min-height:44px">← Change email / send new PIN</button>
  </div>
  <div id="msg" class="msg"></div>
</div></div>`
}

export function otpLoginScript(
  appId: string,
  appTitle: string,
  role: 'staff' | 'management',
  opts?: { skipBranch?: boolean },
): string {
  const r = role
  /** Branch required only for HOD apps (MIS/Guards/Fleet…). Control / dept desks skip branch. */
  const staffPin = r === 'staff' && !opts?.skipBranch
  const fallbackBranches = JSON.stringify(defaultBranchLoginFallback(appId))
  return `
function el(id){return document.getElementById(id);}
var OTP_EMAIL='',OTP_SESSION='',OTP_APP='${appId}',OTP_ROLE='${r}',OTP_STAFF_PIN=${staffPin},OTP_BRANCH_ID='',OTP_BRANCH_NAME='';
var FALLBACK_BRANCHES=${fallbackBranches};
var BRANCH_HINTS=${MIS_BRANCH_HINTS_JS};
function branchDisplayName(b){return (b&&b.displayName)||(b.name+(BRANCH_HINTS[b.id]||''));}
function otpMsg(t,ok){var m=el('msg');if(!m)return;m.style.display='block';m.style.background=ok?'#0a2e1a':'#3a0a0a';m.style.color=ok?'#4ade80':'#ef4444';m.textContent=t;m.scrollIntoView({behavior:'smooth',block:'nearest'});}
function branchHideAll(){
  ['branchLoginMain','branchLoginForgot','otpStepEmail','otpStepPin'].forEach(function(id){var e=el(id);if(e)e.classList.add('hidden');});
}
function branchShowMain(){branchHideAll();var m=el('branchLoginMain');if(m)m.classList.remove('hidden');var from=el('otpEmailBranch')&&el('otpEmailBranch').value||'';var to=el('branchLoginBranch');if(to&&from)to.value=from;var msg=el('msg');if(msg)msg.style.display='none';}
function branchShowForgot(){
  branchHideAll();var f=el('branchLoginForgot');if(!f)return;f.classList.remove('hidden');
  var em=(el('branchLoginEmail')&&el('branchLoginEmail').value||'').trim();
  var br=el('branchLoginBranch')&&el('branchLoginBranch').value||'';
  if(el('branchForgotEmail')&&em)el('branchForgotEmail').value=em;
  if(el('branchForgotBranch')&&br)el('branchForgotBranch').value=br;
  var s2=el('branchForgotStep2');if(s2)s2.classList.add('hidden');
}
function otpReset(){
  OTP_EMAIL='';
  var stepEmail=el('otpStepEmail');if(stepEmail)stepEmail.classList.remove('hidden');
  var stepPin=el('otpStepPin');if(stepPin)stepPin.classList.add('hidden');
  if(el('otpPin'))el('otpPin').value='';
  var m=el('msg');if(m)m.style.display='none';
}
function branchShowEmailPin(){
  branchHideAll();
  var e=el('otpStepEmail');if(e)e.classList.remove('hidden');
  var em=el('branchLoginEmail')&&el('branchLoginEmail').value||'';
  if(el('otpEmail')&&em)el('otpEmail').value=em;
}
function branchFillSelects(list){
  var keep=branchSelectedId()||OTP_BRANCH_ID||'';
  var sorted=(list||[]).slice().sort(function(a,b){
    return String(branchDisplayName(a)).localeCompare(String(branchDisplayName(b)),'en',{sensitivity:'base'});
  });
  var opts='<option value="">— select branch —</option>'+sorted.map(function(b){return '<option value="'+b.id+'">'+branchDisplayName(b)+'</option>';}).join('');
  ['otpEmailBranch','branchLoginBranch','branchForgotBranch'].forEach(function(id){
    var s=el(id);if(!s)return;
    var cur=(s.value||'').trim()||keep;
    s.innerHTML=opts;
    if(cur) s.value=cur;
  });
}
function branchHasRealOptions(sel){
  if(!sel)return false;
  return Array.prototype.some.call(sel.options,function(o){return String(o.value||'').trim();})&&sel.options.length>1;
}
function branchSelectedId(){
  var a=(el('otpEmailBranch')&&el('otpEmailBranch').value||'').trim();
  var b=(el('branchLoginBranch')&&el('branchLoginBranch').value||'').trim();
  return a||b||OTP_BRANCH_ID||'';
}
function branchLoadList(){
  var sel=el('otpEmailBranch')||el('branchLoginBranch');
  fetch('/api/auth/branch-login',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'branches',appId:OTP_APP})})
    .then(function(r){return r.json();})
    .then(function(j){
      var list=j.branches||[];
      if(list.length) branchFillSelects(list);
      else if(!branchHasRealOptions(sel)){
        if(FALLBACK_BRANCHES&&FALLBACK_BRANCHES.length) branchFillSelects(FALLBACK_BRANCHES);
        else if(sel){sel.innerHTML='<option value="">No branches found — contact Head Office</option>';otpMsg('Branch list is empty. Please contact Head Office.',false);}
      }
    })
    .catch(function(){
      if(branchHasRealOptions(sel))return;
      if(FALLBACK_BRANCHES&&FALLBACK_BRANCHES.length) branchFillSelects(FALLBACK_BRANCHES);
      else if(sel){
        sel.innerHTML='<option value="">Could not load — refresh page</option>';
        otpMsg('Could not load branch list — refresh the page.',false);
      }
    });
}
function branchSignIn(){
  if(window.__BRANCH_SIGNIN_BUSY__)return;
  /** Blur first so iPhone commits the last password digit before we read the field. */
  try{if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();}catch(e){}
  var run=function(){
    if(window.__BRANCH_SIGNIN_BUSY__)return;
    var branchId=(el('branchLoginBranch')&&el('branchLoginBranch').value||'').trim();
    var email=(el('branchLoginEmail')&&el('branchLoginEmail').value||'').trim().toLowerCase();
    var pwd=(el('branchLoginPwd')&&el('branchLoginPwd').value||'').replace(/\\D/g,'').trim();
    if(!branchId){otpMsg('Select your branch — for Hyderabad-A choose Hyderabad - A (or Hyderabad-A).',false);return;}
    if(!email||email.indexOf('@')<0){otpMsg('Enter your @agilegroup.co.in work email.',false);return;}
    if(!pwd){otpMsg('Enter your branch password (same as MIS / Guards).',false);return;}
    if(pwd.length<4){otpMsg('Branch password looks too short — enter all digits, then tap Sign in.',false);return;}
    window.__BRANCH_SIGNIN_BUSY__=true;
    var btn=el('branchSignInBtn');if(btn){btn.disabled=true;btn.textContent='Signing in…';}
    otpMsg('Checking…',true);
    fetch('/api/auth/branch-login',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',branchId:branchId,email:email,password:pwd,appId:OTP_APP,role:OTP_ROLE})})
      .then(function(r){return r.json().then(function(j){return{s:r.status,j:j};}).catch(function(){return{s:r.status,j:{error:'Sign in failed'}};});})
      .then(function(res){
        if(res.s!==200){
          window.__BRANCH_SIGNIN_BUSY__=false;
          if(btn){btn.disabled=false;btn.textContent='Sign in';}
          otpMsg((res.j&&res.j.error)||'Sign in failed. Check branch password, or tap Forgot password.',false);
          return;
        }
        OTP_EMAIL=email;OTP_SESSION=res.j.sessionToken||'';OTP_BRANCH_ID=res.j.branchId||branchId;OTP_BRANCH_NAME=res.j.branchName||'';
        if(!OTP_SESSION){
          window.__BRANCH_SIGNIN_BUSY__=false;
          if(btn){btn.disabled=false;btn.textContent='Sign in';}
          otpMsg('Sign in succeeded but no session was returned. Please try again.',false);
          return;
        }
        otpStoreSession(OTP_SESSION,OTP_EMAIL,OTP_BRANCH_ID,OTP_BRANCH_NAME);
        try{sessionStorage.setItem('otp_role_'+OTP_APP,OTP_ROLE||'staff');}catch(e){}
        hodPersistSession();
        otpMsg('Signed in — opening…',true);
        try{onOtpLogin(res.j);}catch(err){
          window.__BRANCH_SIGNIN_BUSY__=false;
          if(btn){btn.disabled=false;btn.textContent='Sign in';}
          var dest=(typeof TARGET_URL!=='undefined'&&TARGET_URL)?TARGET_URL:(location.pathname||'/');
          var fall=new URL(dest,location.origin);
          fall.searchParams.set('suite_token',OTP_SESSION);
          if(OTP_EMAIL) fall.searchParams.set('suite_email',OTP_EMAIL);
          if(OTP_BRANCH_ID) fall.searchParams.set('suite_branch',OTP_BRANCH_ID);
          if(OTP_BRANCH_NAME) fall.searchParams.set('suite_branch_name',OTP_BRANCH_NAME);
          fall.searchParams.set('suite_role','staff');
          fall.searchParams.set('suite_ok','1');
          location.href=fall.toString();
        }
      }).catch(function(){
        window.__BRANCH_SIGNIN_BUSY__=false;
        if(btn){btn.disabled=false;btn.textContent='Sign in';}
        otpMsg('Network error. Try again, or open Fresh sign-in link.',false);
      });
  };
  setTimeout(run,50);
}
function branchForgotSend(){
  if(window.__OTP_FORGOT_BUSY__)return;
  var branchId=(el('branchForgotBranch')&&el('branchForgotBranch').value||'').trim();
  var email=(el('branchForgotEmail')&&el('branchForgotEmail').value||'').trim().toLowerCase();
  if(!branchId){otpMsg('Select your branch.',false);return;}
  if(!email||email.indexOf('@')<0){otpMsg('Enter your work email.',false);return;}
  window.__OTP_FORGOT_BUSY__=true;
  var btn=el('branchForgotSendBtn');if(btn){btn.disabled=true;btn.textContent='Sending…';}
  fetch('/api/auth/branch-login',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'forgot-send',branchId:branchId,email:email,appId:OTP_APP,appTitle:'${appTitle.replace(/'/g, "\\'")}'})})
    .then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});})
    .then(function(res){
      window.__OTP_FORGOT_BUSY__=false;
      if(btn){btn.disabled=false;btn.textContent='Send reset PIN to email';}
      if(res.s!==200){otpMsg(res.j.error||'Could not send PIN.',false);return;}
      OTP_EMAIL=email;OTP_BRANCH_ID=branchId;
      var s2=el('branchForgotStep2');if(s2)s2.classList.remove('hidden');
      otpMsg(res.j.message||'PIN sent — check email and spam.',true);
    }).catch(function(){
      window.__OTP_FORGOT_BUSY__=false;
      if(btn){btn.disabled=false;btn.textContent='Send reset PIN to email';}
      otpMsg('Network error.',false);
    });
}
function branchForgotReset(){
  var branchId=(el('branchForgotBranch')&&el('branchForgotBranch').value||OTP_BRANCH_ID||'').trim();
  var email=(el('branchForgotEmail')&&el('branchForgotEmail').value||OTP_EMAIL||'').trim().toLowerCase();
  var otp=(el('branchForgotOtp')&&el('branchForgotOtp').value||'').replace(/\\D/g,'');
  var npw=(el('branchForgotNewPwd')&&el('branchForgotNewPwd').value||'').replace(/\\D/g,'');
  if(otp.length!==6){otpMsg('Enter the 6-digit PIN from your email.',false);return;}
  if(npw.length<6){otpMsg('New password must be 6 digits.',false);return;}
  otpMsg('Saving…',true);
  fetch('/api/auth/branch-login',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'forgot-reset',branchId:branchId,email:email,otp:otp,newPassword:npw,appId:OTP_APP})})
    .then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});})
    .then(function(res){
      if(res.s!==200){otpMsg(res.j.error||'Reset failed.',false);return;}
      OTP_EMAIL=email;OTP_SESSION=res.j.sessionToken||'';OTP_BRANCH_ID=res.j.branchId||branchId;OTP_BRANCH_NAME=res.j.branchName||'';
      otpStoreSession(OTP_SESSION,OTP_EMAIL,OTP_BRANCH_ID,OTP_BRANCH_NAME);
      hodPersistSession();
      onOtpLogin(res.j);
    }).catch(function(){otpMsg('Network error.',false);});
}
function otpSend(){
  if(window.__OTP_SEND_BUSY__)return;
  try{if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();}catch(e){}
  var run=function(){
    if(window.__OTP_SEND_BUSY__)return;
    var em=((el('otpEmail')&&el('otpEmail').value)||'').trim().toLowerCase();
    if(OTP_STAFF_PIN){
      var br=branchSelectedId();
      var dir=em==='director@agilegroup.co.in'||em==='selwyn.john@gmail.com'||em==='sai@agilegroup.co.in';
      if(!br&&!dir){otpMsg('Select your branch first (Chennai, Mumbai, Kochi, …).',false);return;}
    }
    if(!em||em.indexOf('@')<0){otpMsg('Enter your @agilegroup.co.in work email.',false);return;}
    window.__OTP_SEND_BUSY__=true;
    var btn=el('otpSendBtn');if(btn){btn.disabled=true;btn.textContent='Sending PIN…';}
    otpMsg('Sending PIN…',true);
    fetch('/api/auth/app-otp',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'send',email:em,appId:OTP_APP,appTitle:'${appTitle.replace(/'/g, "\\'")}',role:OTP_ROLE,branchId:branchSelectedId()})})
      .then(function(r){return r.json().then(function(j){return{s:r.status,j:j};}).catch(function(){return{s:r.status,j:{error:'Could not send PIN'}};});})
      .then(function(res){
        if(btn){btn.disabled=false;btn.textContent='Send 6-digit PIN to email';}
        window.__OTP_SEND_BUSY__=false;
        if(res.s!==200){otpMsg(res.j.error||'Could not send PIN. Please try again in 90 seconds.',false);return;}
        OTP_EMAIL=em;
        OTP_BRANCH_ID=branchSelectedId()||OTP_BRANCH_ID;
        var stepEmail=el('otpStepEmail');if(stepEmail)stepEmail.classList.add('hidden');
        var stepPin=el('otpStepPin');if(stepPin)stepPin.classList.remove('hidden');
        try{if(el('otpPin'))el('otpPin').focus();}catch(e){}
        otpMsg(res.j.message||('PIN sent to '+em+'. Check inbox and spam.'),true);
      }).catch(function(){
        window.__OTP_SEND_BUSY__=false;
        if(btn){btn.disabled=false;btn.textContent='Send 6-digit PIN to email';}
        otpMsg('Network error. Try again.',false);
      });
  };
  setTimeout(run,50);
}
function otpVerify(){
  try{if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();}catch(e){}
  var pin=((el('otpPin')&&el('otpPin').value)||'').replace(/\\D/g,'').trim();
  if(pin.length!==6){otpMsg('Enter the 6-digit PIN from your email.',false);return;}
  var em=OTP_EMAIL||((el('otpEmail')&&el('otpEmail').value)||'').trim().toLowerCase();
  try{em=em||sessionStorage.getItem('otp_email_'+OTP_APP)||localStorage.getItem('otp_email_'+OTP_APP)||'';}catch(e){}
  if(!em||em.indexOf('@')<0){otpMsg('Email missing. Tap Change email / send new PIN.',false);return;}
  OTP_EMAIL=em;
  otpMsg('Checking…',true);
  var vbtn=el('otpVerifyBtn');if(vbtn){vbtn.disabled=true;vbtn.textContent='Opening…';}
  fetch('/api/auth/app-otp',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'verify',email:em,pin:pin,appId:OTP_APP,role:OTP_ROLE,branchId:branchSelectedId()||OTP_BRANCH_ID})})
    .then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});})
    .then(function(res){
      if(vbtn){vbtn.disabled=false;vbtn.textContent='Verify & enter';}
      if(res.s!==200){
        otpMsg((res.j.error||'Wrong or expired PIN.')+' Tap Send PIN again for a new code (old PIN works only once).',false);
        return;
      }
      OTP_SESSION=res.j.sessionToken||'';
      OTP_EMAIL=res.j.email||OTP_EMAIL;
      OTP_BRANCH_ID=res.j.branchId||branchSelectedId()||'';
      OTP_BRANCH_NAME=res.j.branchName||'';
      otpStoreSession(OTP_SESSION,OTP_EMAIL,OTP_BRANCH_ID,OTP_BRANCH_NAME);
      hodPersistSession();
      otpMsg('PIN accepted — opening…',true);
      onOtpLogin(res.j);
    }).catch(function(){
      if(vbtn){vbtn.disabled=false;vbtn.textContent='Verify & enter';}
      otpMsg('Network error. Try again.',false);
    });
}
function otpBranchFromJwt(token){
  if(!token)return '';
  try{
    var parts=token.split('.');
    if(parts.length<2)return '';
    var b=parts[1].replace(/-/g,'+').replace(/_/g,'/');
    while(b.length%4)b+='=';
    var p=JSON.parse(atob(b));
    return String(p.branchId||'').trim();
  }catch(e){return '';}
}
function otpClearAuthFailed(){
  try{sessionStorage.removeItem('otp_fail_'+OTP_APP);}catch(e){}
}
function otpMarkAuthFailed(){
  try{sessionStorage.setItem('otp_fail_'+OTP_APP,'1');}catch(e){}
}
function otpAuthIsFailed(){
  try{return sessionStorage.getItem('otp_fail_'+OTP_APP)==='1';}catch(e){return false;}
}
/** Remove fresh=1 after a successful sign-in so refresh does not wipe the new session. */
function otpStripFreshFromUrl(){
  try{
    var u=new URL(location.href);
    if(!u.searchParams.has('fresh'))return;
    u.searchParams.delete('fresh');
    var q=u.searchParams.toString();
    history.replaceState(null,'',u.pathname+(q?'?'+q:'')+(u.hash||''));
  }catch(e){}
}
function otpClearStoredSession(){
  try{
    sessionStorage.removeItem('otp_'+OTP_APP);
    sessionStorage.removeItem('otp_email_'+OTP_APP);
    sessionStorage.removeItem('otp_branch_'+OTP_APP);
    sessionStorage.removeItem('otp_branch_name_'+OTP_APP);
    sessionStorage.removeItem('otp_role_'+OTP_APP);
    localStorage.removeItem('otp_'+OTP_APP);
    localStorage.removeItem('otp_email_'+OTP_APP);
  }catch(e){}
  OTP_SESSION='';OTP_EMAIL='';OTP_BRANCH_ID='';OTP_BRANCH_NAME='';
  fetch('/api/auth/hod-session',{method:'DELETE',credentials:'include'}).catch(function(){});
}
function otpShowLoginScreen(){
  var login=el('login');
  var shell=el('shell');
  if(login){
    login.style.display='block';
    login.classList.remove('hidden');
  }
  if(shell){
    shell.style.display='none';
    shell.classList.add('hidden');
  }
  window.__BRANCH_SIGNIN_BUSY__=false;
  window.__OTP_SEND_BUSY__=false;
  var btn=el('branchSignInBtn');
  if(btn){btn.disabled=false;btn.textContent='Sign in';}
  var sendBtn=el('otpSendBtn');
  if(sendBtn){sendBtn.disabled=false;sendBtn.textContent='Send 6-digit PIN to email';}
}
function otpStoreSession(token,email,branchId,branchName){
  OTP_SESSION=token||'';
  OTP_EMAIL=email||'';
  OTP_BRANCH_ID=branchId||'';
  OTP_BRANCH_NAME=branchName||'';
  try{
    if(OTP_SESSION){sessionStorage.setItem('otp_'+OTP_APP,OTP_SESSION);localStorage.setItem('otp_'+OTP_APP,OTP_SESSION);}
    if(OTP_EMAIL){sessionStorage.setItem('otp_email_'+OTP_APP,OTP_EMAIL);localStorage.setItem('otp_email_'+OTP_APP,OTP_EMAIL);}
    if(OTP_BRANCH_ID){
      sessionStorage.setItem('otp_branch_'+OTP_APP,OTP_BRANCH_ID);
    } else {
      sessionStorage.removeItem('otp_branch_'+OTP_APP);
    }
    if(OTP_BRANCH_NAME){
      sessionStorage.setItem('otp_branch_name_'+OTP_APP,OTP_BRANCH_NAME);
    } else {
      sessionStorage.removeItem('otp_branch_name_'+OTP_APP);
    }
  }catch(e){}
  otpClearAuthFailed();
  otpStripFreshFromUrl();
}
function hodPersistSession(){
  if(!OTP_SESSION||OTP_ROLE!=='staff')return;
  fetch('/api/auth/hod-session',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionToken:OTP_SESSION})}).catch(function(){});
}
function applyHodBoot(){
  var boot=typeof window.__HOD_BOOT__!=='undefined'?window.__HOD_BOOT__:null;
  if(!boot||!boot.sessionToken)return false;
  otpStoreSession(boot.sessionToken,boot.email||'',boot.branchId||'',boot.branchName||'');
  return true;
}
function otpRestoreSession(){
  if(new URLSearchParams(location.search).get('fresh')==='1'){
    otpClearStoredSession();
    otpClearAuthFailed();
    return '';
  }
  // After a 401 / failed auto-login, do not restore the same dead token (stops flicker loops).
  if(otpAuthIsFailed()){
    otpClearStoredSession();
    return '';
  }
  // Director Coming Soon → Control: token in #otp=...
  try{
    var hash=String(location.hash||'');
    var m=hash.match(/[#&]otp=([^&]+)/);
    if(m&&m[1]){
      var ht=decodeURIComponent(m[1]);
      if(ht){
        otpStoreSession(ht,sessionStorage.getItem('otp_email_'+OTP_APP)||localStorage.getItem('otp_email_'+OTP_APP)||'','','');
        try{history.replaceState(null,'',location.pathname+location.search);}catch(e2){location.hash='';}
        hodPersistSession();
        return OTP_SESSION;
      }
    }
  }catch(e){}
  if(applyHodBoot())return OTP_SESSION;
  var t='';
  try{t=sessionStorage.getItem('otp_'+OTP_APP)||localStorage.getItem('otp_'+OTP_APP)||'';}catch(e){t='';}
  if(t){
    OTP_SESSION=t;
    try{
      OTP_EMAIL=sessionStorage.getItem('otp_email_'+OTP_APP)||localStorage.getItem('otp_email_'+OTP_APP)||'';
      OTP_BRANCH_ID=sessionStorage.getItem('otp_branch_'+OTP_APP)||'';
      OTP_BRANCH_NAME=sessionStorage.getItem('otp_branch_name_'+OTP_APP)||'';
    }catch(e){}
    if(!OTP_BRANCH_ID||!String(OTP_BRANCH_ID).trim()){
      var bid=otpBranchFromJwt(t);
      if(bid&&String(bid).trim()){OTP_BRANCH_ID=bid;try{sessionStorage.setItem('otp_branch_'+OTP_APP,bid);}catch(e){}}
    }
    hodPersistSession();
    return t;
  }
  return '';
}
/** Sign out — clear every stored token and show login (no reload flicker). */
function otpLogout(){
  otpClearStoredSession();
  otpMarkAuthFailed();
  otpStripFreshFromUrl();
  if(el('login')){
    otpShowLoginScreen();
    try{otpMsg('Signed out. Please sign in again.',true);}catch(e){}
    return;
  }
  location.replace(location.pathname+(function(){try{var u=new URL(location.href);u.searchParams.delete('fresh');var q=u.searchParams.toString();return q?'?'+q:'';}catch(e){return '';}})());
}
/** Call on HTTP 401 — clears bad tokens and stops restore→reload loops across the suite. */
function otpHandleUnauthorized(){
  otpClearStoredSession();
  otpMarkAuthFailed();
  otpStripFreshFromUrl();
  if(el('login')){
    otpShowLoginScreen();
    try{otpMsg('Session expired. Please sign in again.',false);}catch(e){}
    return;
  }
  location.replace(location.pathname+(function(){try{var u=new URL(location.href);u.searchParams.delete('fresh');var q=u.searchParams.toString();return q?'?'+q:'';}catch(e){return '';}})());
}
function pinOnlyInput(el){
  if(!el)return;
  el.addEventListener('input',function(){
    var max=parseInt(this.getAttribute('maxlength')||'6',10);
    this.value=String(this.value||'').replace(/\\D/g,'').slice(0,max);
  });
}
function otpBoot(){
  window.__BRANCH_SIGNIN_BUSY__=false;
  var signBtn=el('branchSignInBtn');
  if(signBtn){signBtn.disabled=false;signBtn.textContent='Sign in';}
  if(!OTP_STAFF_PIN){var wrap=el('otpEmailBranchWrap');if(wrap)wrap.classList.add('hidden');}
  if(OTP_STAFF_PIN||el('branchLoginBranch')||el('otpEmailBranch')) branchLoadList();
  /** Deep link: ?branch=br2 pre-selects Hyderabad-A for HOD login. */
  try{
    var want=new URLSearchParams(location.search).get('branch')||'';
    if(want){
      var applyBranch=function(){
        ['otpEmailBranch','branchLoginBranch'].forEach(function(id){
          var s=el(id);
          if(!s)return;
          if(!Array.prototype.some.call(s.options,function(o){return o.value===want;}))return;
          s.value=want;
        });
      };
      applyBranch();
      setTimeout(applyBranch,400);
      setTimeout(applyBranch,1200);
    }
  }catch(e){}
  ['otpPin','branchLoginPwd','branchForgotOtp','branchForgotNewPwd'].forEach(function(id){pinOnlyInput(el(id));});
  window.__OTP_SEND_BUSY__=false;
  var emailIn=el('otpEmail');
  if(emailIn) emailIn.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();otpSend();}});
  var otpForm=el('otpEmailForm');
  if(otpForm) otpForm.addEventListener('submit',function(e){e.preventDefault();try{otpSend();}catch(err){}});
  var sendBtn=el('otpSendBtn');
  if(sendBtn){
    sendBtn.addEventListener('click',function(e){e.preventDefault();try{otpSend();}catch(err){}});
    sendBtn.addEventListener('touchend',function(e){e.preventDefault();try{otpSend();}catch(err){}},{passive:false});
  }
  var verifyBtn=el('otpVerifyBtn');
  if(verifyBtn) verifyBtn.addEventListener('click',function(e){e.preventDefault();try{otpVerify();}catch(err){}});
  var resetBtn=el('otpResetBtn');
  if(resetBtn) resetBtn.addEventListener('click',function(e){e.preventDefault();try{otpReset();}catch(err){}});
  var branchEmail=el('branchLoginEmail');
  if(branchEmail) branchEmail.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();var p=el('branchLoginPwd');if(p)p.focus();}});
  var branchPwd=el('branchLoginPwd');
  if(branchPwd){
    branchPwd.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();branchSignIn();}});
    branchPwd.addEventListener('focus',function(){
      setTimeout(function(){var b=el('branchSignInBtn');if(b&&b.scrollIntoView)b.scrollIntoView({block:'nearest',behavior:'smooth'});},300);
    });
  }
  var form=el('branchLoginForm');
  if(form) form.addEventListener('submit',function(e){e.preventDefault();branchSignIn();});
  var otpPinIn=el('otpPin');
  if(otpPinIn) otpPinIn.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();otpVerify();}});
  if(new URLSearchParams(location.search).get('fresh')!=='1') otpRestoreSession();
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',otpBoot);
}else{
  otpBoot();
}
${suiteTapFeedbackInitScript()}
${suiteDateInputInitScript()}
`
}

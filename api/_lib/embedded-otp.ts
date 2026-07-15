/** Shared email OTP + per-branch password login for server-rendered suite apps (01–15). */

import { MIS_BRANCH_HINTS_JS } from './mis/branch-labels.js'

/** Branch HOD login — per-branch password + email PIN reset. */
export function hodLoginHtml(title: string, subtitle: string): string {
  return branchStaffLoginHtml(title, subtitle)
}

export function branchStaffLoginHtml(title: string, subtitle: string): string {
  return `<div id="login"><div class="card">
  <h2>${title}</h2>
  <p style="color:#94a3b8;font-size:13px;margin-bottom:14px">${subtitle}</p>
  <p style="font-size:12px;color:#64748b;margin-bottom:12px;line-height:1.55">
    Use your <strong>@agilegroup.co.in</strong> email.<br>
    <strong>Step 1:</strong> Select your branch.<br>
    <strong>Step 2:</strong> Enter your <strong>branch password</strong> (6 digits — given by Director).<br>
    <strong>Forgot?</strong> Tap <em>Forgot password?</em> — we email a PIN, then you set a new password.<br>
    <span style="color:#fbbf24">Director Master PIN 170658 does not work on this page.</span>
  </p>
  <div id="branchLoginMain">
    <label>Your branch</label>
    <select id="branchLoginBranch" style="font-size:17px;padding:12px;min-height:50px"><option value="">Loading branches…</option></select>
    <label>Work email</label>
    <input id="branchLoginEmail" type="email" placeholder="name@agilegroup.co.in" autocomplete="email" style="font-size:18px;padding:14px 12px;min-height:50px">
    <label>Branch password (6 digits)</label>
    <input id="branchLoginPwd" type="password" inputmode="numeric" maxlength="8" placeholder="••••••" autocomplete="current-password" style="text-align:center;letter-spacing:.25em;font-size:20px">
    <button class="btn gold" id="branchSignInBtn" style="width:100%;margin-top:12px;min-height:54px;font-size:17px" type="button" onclick="branchSignIn()">Sign in</button>
    <button type="button" style="width:100%;margin-top:8px;background:none;border:none;color:#c9a84c;cursor:pointer;font-size:14px;min-height:44px" onclick="branchShowForgot()">Forgot password?</button>
    <button type="button" style="width:100%;margin-top:4px;background:none;border:none;color:#94a3b8;cursor:pointer;font-size:13px;min-height:40px" onclick="branchShowEmailPin()">Sign in with email PIN instead</button>
  </div>
  <div id="branchLoginForgot" class="hidden">
    <p style="font-size:12px;color:#94a3b8;margin-bottom:10px">We will email a 6-digit PIN. Enter it below with your new branch password.</p>
    <label>Your branch</label>
    <select id="branchForgotBranch" style="font-size:17px;padding:12px;min-height:50px"></select>
    <label>Work email</label>
    <input id="branchForgotEmail" type="email" placeholder="name@agilegroup.co.in" style="font-size:18px;padding:14px 12px;min-height:50px">
    <button class="btn gold" id="branchForgotSendBtn" style="width:100%;margin-top:10px;min-height:50px" type="button" onclick="branchForgotSend()">Send reset PIN to email</button>
    <div id="branchForgotStep2" class="hidden" style="margin-top:12px">
      <label>6-digit PIN from email</label>
      <input id="branchForgotOtp" inputmode="numeric" maxlength="6" placeholder="••••••" style="text-align:center;letter-spacing:.35em;font-size:20px">
      <label>New branch password (6 digits)</label>
      <input id="branchForgotNewPwd" inputmode="numeric" maxlength="8" placeholder="••••••" style="text-align:center;letter-spacing:.25em;font-size:20px">
      <button class="btn gold" style="width:100%;margin-top:10px;min-height:50px" type="button" onclick="branchForgotReset()">Set new password &amp; sign in</button>
    </div>
    <button type="button" style="width:100%;margin-top:10px;background:none;border:none;color:#94a3b8;cursor:pointer;font-size:13px" onclick="branchShowMain()">← Back to sign in</button>
  </div>
  <div id="otpStepEmail" class="hidden">
    <label>Work email</label>
    <input id="otpEmail" type="email" placeholder="name@agilegroup.co.in" autocomplete="email" style="font-size:18px;padding:14px 12px;min-height:50px">
    <button class="btn gold" id="otpSendBtn" style="width:100%;margin-top:12px;min-height:54px;font-size:17px" type="button" onclick="otpSend()">Send 6-digit PIN to email</button>
    <button type="button" style="width:100%;margin-top:8px;background:none;border:none;color:#94a3b8;cursor:pointer;font-size:13px" onclick="branchShowMain()">← Use branch password instead</button>
  </div>
  <div id="otpStepPin" class="hidden">
    <label>6-digit PIN from your email</label>
    <input id="otpPin" inputmode="numeric" maxlength="6" placeholder="••••••" style="text-align:center;letter-spacing:.35em;font-size:20px">
    <button class="btn gold" style="width:100%;margin-top:12px" type="button" onclick="otpVerify()">Verify &amp; enter</button>
    <button type="button" style="width:100%;margin-top:8px;background:none;border:none;color:#94a3b8;cursor:pointer;font-size:13px" onclick="otpReset()">← Change email</button>
  </div>
  <div id="msg" class="msg"></div>
</div></div>`
}

export function otpLoginHtml(title: string, subtitle: string, staffBranchPin = false): string {
  if (staffBranchPin) return branchStaffLoginHtml(title, subtitle)
  return `<div id="login"><div class="card">
  <h2>${title}</h2>
  <p style="color:#94a3b8;font-size:13px;margin-bottom:14px">${subtitle}</p>
  <p style="font-size:12px;color:#64748b;margin-bottom:12px">Use your official <strong>@agilegroup.co.in</strong> email. A 6-digit PIN is emailed to you — valid <strong>15 minutes</strong>. Check <strong>spam</strong> if not in inbox. Wait 90 seconds before requesting again.<br><span style="color:#fbbf24">Director: tap Send PIN, then enter Master PIN <strong>170658</strong> (no email code).</span></p>
  <div id="otpStepEmail">
    <label>Work email</label>
    <input id="otpEmail" type="email" placeholder="name@agilegroup.co.in" autocomplete="email" style="font-size:18px;padding:14px 12px;min-height:50px">
    <button class="btn gold" id="otpSendBtn" style="width:100%;margin-top:12px;min-height:54px;font-size:17px;touch-action:manipulation;cursor:pointer" type="button" onclick="otpSend()">Send 6-digit PIN to email</button>
  </div>
  <div id="otpStepPin" class="hidden">
    <label>6-digit PIN from your email</label>
    <input id="otpPin" inputmode="numeric" maxlength="6" placeholder="••••••" style="text-align:center;letter-spacing:.35em;font-size:20px">
    <button class="btn gold" style="width:100%;margin-top:12px" type="button" onclick="otpVerify()">Verify &amp; enter</button>
    <button type="button" style="width:100%;margin-top:8px;background:none;border:none;color:#94a3b8;cursor:pointer;font-size:13px" onclick="otpReset()">← Change email</button>
  </div>
  <div id="msg" class="msg"></div>
</div></div>`
}

export function otpLoginScript(appId: string, appTitle: string, role: 'staff' | 'management'): string {
  const r = role
  const staffPin = r === 'staff'
  return `
function el(id){return document.getElementById(id);}
var OTP_EMAIL='',OTP_SESSION='',OTP_APP='${appId}',OTP_ROLE='${r}',OTP_STAFF_PIN=${staffPin},OTP_BRANCH_ID='',OTP_BRANCH_NAME='';
var BRANCH_HINTS=${MIS_BRANCH_HINTS_JS};
function branchDisplayName(b){return (b&&b.displayName)||(b.name+(BRANCH_HINTS[b.id]||''));}
function otpMsg(t,ok){var m=el('msg');if(!m)return;m.style.display='block';m.style.background=ok?'#0a2e1a':'#3a0a0a';m.style.color=ok?'#4ade80':'#ef4444';m.textContent=t;m.scrollIntoView({behavior:'smooth',block:'nearest'});}
function branchHideAll(){
  ['branchLoginMain','branchLoginForgot','otpStepEmail','otpStepPin'].forEach(function(id){var e=el(id);if(e)e.classList.add('hidden');});
}
function branchShowMain(){branchHideAll();var m=el('branchLoginMain');if(m)m.classList.remove('hidden');var msg=el('msg');if(msg)msg.style.display='none';}
function branchShowForgot(){
  branchHideAll();var f=el('branchLoginForgot');if(!f)return;f.classList.remove('hidden');
  var em=(el('branchLoginEmail')&&el('branchLoginEmail').value||'').trim();
  var br=el('branchLoginBranch')&&el('branchLoginBranch').value||'';
  if(el('branchForgotEmail')&&em)el('branchForgotEmail').value=em;
  if(el('branchForgotBranch')&&br)el('branchForgotBranch').value=br;
  var s2=el('branchForgotStep2');if(s2)s2.classList.add('hidden');
}
function branchShowEmailPin(){branchHideAll();var e=el('otpStepEmail');if(e)e.classList.remove('hidden');var em=el('branchLoginEmail')&&el('branchLoginEmail').value||'';if(el('otpEmail')&&em)el('otpEmail').value=em;}
function otpReset(){OTP_EMAIL='';el('otpStepEmail').classList.remove('hidden');el('otpStepPin').classList.add('hidden');el('otpPin').value='';var m=el('msg');if(m)m.style.display='none';}
function branchFillSelects(list){
  var opts='<option value="">— select branch —</option>'+list.map(function(b){return '<option value="'+b.id+'">'+branchDisplayName(b)+'</option>';}).join('');
  ['branchLoginBranch','branchForgotBranch'].forEach(function(id){var s=el(id);if(s)s.innerHTML=opts;});
}
function branchLoadList(){
  fetch('/api/auth/branch-login',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'branches'})})
    .then(function(r){return r.json();})
    .then(function(j){
      var list=j.branches||[];
      branchFillSelects(list);
      if(!list.length){
        var s=el('branchLoginBranch');
        if(s)s.innerHTML='<option value="">No branches found — contact Head Office</option>';
        otpMsg('Branch list is empty. Please contact Head Office.',false);
      }
    })
    .catch(function(){
      var s=el('branchLoginBranch');
      if(s)s.innerHTML='<option value="">Could not load — refresh page</option>';
      branchFillSelects([]);
      otpMsg('Could not load branch list — refresh the page.',false);
    });
}
function branchSignIn(){
  var branchId=(el('branchLoginBranch')&&el('branchLoginBranch').value||'').trim();
  var email=(el('branchLoginEmail')&&el('branchLoginEmail').value||'').trim().toLowerCase();
  var pwd=(el('branchLoginPwd')&&el('branchLoginPwd').value||'').trim();
  if(!branchId){otpMsg('Select your branch.',false);return;}
  if(!email||email.indexOf('@')<0){otpMsg('Enter your @agilegroup.co.in work email.',false);return;}
  if(!pwd){otpMsg('Enter your branch password.',false);return;}
  var btn=el('branchSignInBtn');if(btn){btn.disabled=true;btn.textContent='Signing in…';}
  otpMsg('Checking…',true);
  fetch('/api/auth/branch-login',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',branchId:branchId,email:email,password:pwd,appId:OTP_APP,role:OTP_ROLE})})
    .then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});})
    .then(function(res){
      if(btn){btn.disabled=false;btn.textContent='Sign in';}
      if(res.s!==200){otpMsg(res.j.error||'Sign in failed.',false);return;}
      OTP_EMAIL=email;OTP_SESSION=res.j.sessionToken||'';OTP_BRANCH_ID=res.j.branchId||branchId;OTP_BRANCH_NAME=res.j.branchName||'';
      otpStoreSession(OTP_SESSION,OTP_EMAIL,OTP_BRANCH_ID,OTP_BRANCH_NAME);
      hodPersistSession();
      onOtpLogin(res.j);
    }).catch(function(){
      if(btn){btn.disabled=false;btn.textContent='Sign in';}
      otpMsg('Network error. Try again.',false);
    });
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
  var em=(el('otpEmail').value||'').trim().toLowerCase();
  if(!em||em.indexOf('@')<0){otpMsg('Enter your @agilegroup.co.in work email.',false);return;}
  window.__OTP_SEND_BUSY__=true;
  var btn=el('otpSendBtn');if(btn){btn.disabled=true;btn.textContent='Sending PIN…';}
  otpMsg('Sending PIN…',true);
  fetch('/api/auth/app-otp',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'send',email:em,appId:OTP_APP,appTitle:'${appTitle.replace(/'/g, "\\'")}',role:OTP_ROLE})})
    .then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});})
    .then(function(res){
      if(btn){btn.disabled=false;btn.textContent='Send 6-digit PIN to email';}
      window.__OTP_SEND_BUSY__=false;
      if(res.s!==200){otpMsg(res.j.error||'Could not send PIN. Please try again in 90 seconds.',false);return;}
      OTP_EMAIL=em;el('otpStepEmail').classList.add('hidden');el('otpStepPin').classList.remove('hidden');
      el('otpPin').focus();
      otpMsg(res.j.message||('PIN sent to '+em+'. Check inbox and spam.'),true);
    }).catch(function(){
      window.__OTP_SEND_BUSY__=false;
      if(btn){btn.disabled=false;btn.textContent='Send 6-digit PIN to email';}
      otpMsg('Network error. Try again.',false);
    });
}
function otpVerify(){
  var pin=(el('otpPin').value||'').replace(/\\D/g,'').trim();
  if(pin.length!==6){otpMsg('Enter the 6-digit PIN from your email.',false);return;}
  otpMsg('Checking…',true);
  fetch('/api/auth/app-otp',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'verify',email:OTP_EMAIL,pin:pin,appId:OTP_APP,role:OTP_ROLE})})
    .then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});})
    .then(function(res){
      if(res.s!==200){otpMsg(res.j.error||'Wrong or expired PIN.',false);return;}
      OTP_SESSION=res.j.sessionToken||'';
      sessionStorage.setItem('otp_'+OTP_APP,OTP_SESSION);
      sessionStorage.setItem('otp_email_'+OTP_APP,OTP_EMAIL);
      onOtpLogin(res.j);
    }).catch(function(){otpMsg('Network error. Try again.',false);});
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
function otpStoreSession(token,email,branchId,branchName){
  OTP_SESSION=token||'';
  OTP_EMAIL=email||'';
  OTP_BRANCH_ID=branchId||'';
  OTP_BRANCH_NAME=branchName||'';
  if(OTP_SESSION)sessionStorage.setItem('otp_'+OTP_APP,OTP_SESSION);
  if(OTP_EMAIL)sessionStorage.setItem('otp_email_'+OTP_APP,OTP_EMAIL);
  if(OTP_BRANCH_ID)sessionStorage.setItem('otp_branch_'+OTP_APP,OTP_BRANCH_ID);
  if(OTP_BRANCH_NAME)sessionStorage.setItem('otp_branch_name_'+OTP_APP,OTP_BRANCH_NAME);
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
    sessionStorage.removeItem('otp_'+OTP_APP);
    sessionStorage.removeItem('otp_email_'+OTP_APP);
    sessionStorage.removeItem('otp_branch_'+OTP_APP);
    sessionStorage.removeItem('otp_branch_name_'+OTP_APP);
    fetch('/api/auth/hod-session',{method:'DELETE',credentials:'include'}).catch(function(){});
    return '';
  }
  if(applyHodBoot())return OTP_SESSION;
  var t=sessionStorage.getItem('otp_'+OTP_APP);
  if(t){
    OTP_SESSION=t;
    OTP_EMAIL=sessionStorage.getItem('otp_email_'+OTP_APP)||'';
    OTP_BRANCH_ID=sessionStorage.getItem('otp_branch_'+OTP_APP)||'';
    OTP_BRANCH_NAME=sessionStorage.getItem('otp_branch_name_'+OTP_APP)||'';
    if(!OTP_BRANCH_ID||!String(OTP_BRANCH_ID).trim()){
      var bid=otpBranchFromJwt(t);
      if(bid&&String(bid).trim()){OTP_BRANCH_ID=bid;sessionStorage.setItem('otp_branch_'+OTP_APP,bid);}
    }
    hodPersistSession();
    return t;
  }
  return '';
}
function otpLogout(){
  sessionStorage.removeItem('otp_'+OTP_APP);
  sessionStorage.removeItem('otp_email_'+OTP_APP);
  sessionStorage.removeItem('otp_branch_'+OTP_APP);
  sessionStorage.removeItem('otp_branch_name_'+OTP_APP);
  OTP_SESSION='';OTP_EMAIL='';OTP_BRANCH_ID='';location.reload();
}
function otpBoot(){
  if(OTP_STAFF_PIN) branchLoadList();
  var emailIn=el('otpEmail');
  if(emailIn) emailIn.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();otpSend();}});
  if(new URLSearchParams(location.search).get('fresh')!=='1') otpRestoreSession();
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',otpBoot);
}else{
  otpBoot();
}
`
}

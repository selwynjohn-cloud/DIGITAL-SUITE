/**
 * Public face for Ops shadow apps — "Coming Soon" only.
 * Quiet Director link → email PIN (director only; enforced in app-otp + ops/data).
 */

import { otpLoginScript } from '../embedded-otp.js'
import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../suite-tap-feedback.js'
import type { OpsShellApp } from './shell.js'

const META: Record<OpsShellApp, { title: string; accent: string; path: string; otpAppId: string }> = {
  control: { title: 'Agile Control', accent: '#a16207', path: 'control', otpAppId: 'control' },
  quality: { title: 'Agile Security', accent: '#059669', path: 'security', otpAppId: 'quality' },
  meetings: { title: 'Agile Meeting', accent: '#7c3aed', path: 'meetings', otpAppId: 'meetings' },
}

export function renderOpsComingSoonPage(app: OpsShellApp): string {
  const meta = META[app]
  const otp = otpLoginScript(meta.otpAppId, meta.title, 'management')
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${meta.title} — Coming Soon</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{min-height:100vh;font-family:'Segoe UI',Arial,sans-serif;background:linear-gradient(160deg,#0b1220,#14224f 55%,#0f172a);color:#e2e8f0;display:flex;align-items:center;justify-content:center;padding:24px}
.wrap{max-width:440px;width:100%;text-align:center}
.logo{height:52px;margin-bottom:18px}
h1{font-size:28px;color:#fff;margin-bottom:8px}
.badge{display:inline-block;margin:10px 0 16px;padding:8px 16px;border-radius:999px;background:rgba(255,255,255,.12);color:#fde68a;font-weight:800;font-size:13px;letter-spacing:.06em;text-transform:uppercase;border:1px solid rgba(253,230,138,.35)}
p{color:#94a3b8;font-size:15px;line-height:1.55;margin-bottom:10px}
a.home{display:inline-block;margin-top:18px;color:#93c5fd;font-weight:700;text-decoration:none}
.quiet{margin-top:28px;font-size:11px;color:#334155}
.quiet button{background:none;border:none;color:#334155;cursor:pointer;font-size:11px}
#dirBox{display:none;margin-top:18px;text-align:left;background:#111a30;border:1px solid #22304f;border-radius:14px;padding:18px}
#dirBox h2{color:#fff;font-size:16px;margin-bottom:6px}
#dirBox .hint{color:#64748b;font-size:12px;margin-bottom:12px;line-height:1.45}
input{width:100%;padding:11px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:15px;margin:6px 0 10px}
label{display:block;font-size:12px;color:#94a3b8;font-weight:700}
.btn{width:100%;padding:12px;border:none;border-radius:9px;font-weight:800;cursor:pointer;background:${meta.accent};color:#fff;font-size:14px;margin-top:4px}
.msg{padding:10px;border-radius:8px;font-size:13px;margin-top:10px;display:none}
.hidden{display:none!important}
${SUITE_TAP_FEEDBACK_CSS}
</style></head>
<body>
<div class="wrap">
  <img class="logo" src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile">
  <h1>${meta.title}</h1>
  <div class="badge">Coming Soon</div>
  <p>This application is not available yet.</p>
  <p>Please continue with your usual day-to-day apps on the Command Centre.</p>
  <a class="home" href="/">← Back to Command Centre</a>
  <div class="quiet"><button type="button" id="dirToggle" onclick="showDir()">.</button></div>
  <div id="dirBox">
    <h2>Director access</h2>
    <p class="hint">Use: <b>director@agilegroup.co.in</b>, <b>selwyn.john@gmail.com</b>, or <b>sai@agilegroup.co.in</b>. We email a 6-digit PIN — also check <b>Spam / Junk</b>.</p>
    <div id="otpStepEmail">
      <label>Email</label>
      <input id="otpEmail" type="email" autocomplete="username" placeholder="selwyn.john@gmail.com" value="director@agilegroup.co.in">
      <button type="button" class="btn" id="otpSendBtn" onclick="otpSend()">Send PIN to email</button>
    </div>
    <div id="otpStepPin" class="hidden" style="margin-top:12px">
      <label>6-digit PIN from email</label>
      <input id="otpPin" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="••••••">
      <p class="hint" style="margin:8px 0">If the mail is late, you may also enter your usual <b>Director master PIN</b>.</p>
      <button type="button" class="btn" id="otpVerifyBtn" onclick="otpVerify()">Open Control</button>
      <button type="button" class="btn" style="background:#334155;margin-top:8px" onclick="otpShowEmailAgain()">Send PIN again</button>
    </div>
    <div class="msg" id="msg"></div>
  </div>
</div>
<script>
${otp}
${suiteTapFeedbackInitScript()}
OTP_ROLE='management';
function showDir(){document.getElementById('dirBox').style.display='block';}
function otpMsg(t,ok){var m=document.getElementById('msg');m.style.display='block';m.style.background=ok?'#052e16':'#3a0a0a';m.style.color=ok?'#86efac':'#fca5a5';m.textContent=t;}
function otpShowEmailAgain(){
  var stepEmail=document.getElementById('otpStepEmail');if(stepEmail)stepEmail.classList.remove('hidden');
  var stepPin=document.getElementById('otpStepPin');if(stepPin)stepPin.classList.add('hidden');
  otpMsg('Enter email and tap Send PIN again. Also check Spam.',true);
}
function onOtpLogin(j){
  var tok=(j&&j.sessionToken)||OTP_SESSION||'';
  var em=(j&&j.email)||OTP_EMAIL||'';
  try{
    if(tok){
      sessionStorage.setItem('otp_'+OTP_APP,tok);
      localStorage.setItem('otp_'+OTP_APP,tok);
    }
    if(em){
      sessionStorage.setItem('otp_email_'+OTP_APP,em);
      localStorage.setItem('otp_email_'+OTP_APP,em);
    }
  }catch(e){}
  // open=1 = skip the second gold login screen; token in hash opens the menu.
  location.replace('/${meta.path}/?portal=management&access=1&open=1#otp='+encodeURIComponent(tok));
}
</script>
</body></html>`
}
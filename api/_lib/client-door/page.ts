import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../suite-tap-feedback.js'
import { MIS_BRAND } from '../mis/brand.js'

export function clientDoorPublicHtml(): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Client Door</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;color:#0f172a;min-height:100vh}
.wrap{max-width:840px;margin:0 auto;padding:18px 14px 32px}
.hdr{background:linear-gradient(135deg,#14224f 0%,#1e3a8a 58%,#0f172a 100%);border-bottom:4px solid #c9a84c;border-radius:14px;padding:18px 16px;margin-bottom:14px;text-align:center;color:#fff}
.hdr img{height:52px;background:transparent;display:block;margin:0 auto 10px}
.hdr b{display:block;color:#fff;font-size:18px}
.hdr small{display:block;color:#c9a84c;margin-top:6px;font-size:15px;font-weight:800}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:12px}
.card h3{color:#14224f;font-size:15px;margin-bottom:8px}
.hint{color:#64748b;font-size:13px;line-height:1.5;margin-bottom:10px}
label{display:block;font-size:12px;color:#64748b;font-weight:700;margin:8px 0 4px}
input{width:100%;padding:12px 12px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#0f172a;font-size:16px}
.btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.m-btn{padding:12px 16px;border:none;border-radius:8px;font-weight:800;cursor:pointer;font-size:15px}
.m-btn-gold{background:#c9a84c;color:#14224f}
.m-btn-navy{background:#1d4ed8;color:#fff}
.m-btn-grey{background:#334155;color:#e2e8f0}
.msg{min-height:20px;margin-top:10px;font-size:13px;color:#92400e;line-height:1.45}
.hidden{display:none!important}
.report{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}
.topbar{display:flex;justify-content:flex-end;margin-bottom:10px}
${SUITE_TAP_FEEDBACK_CSS}
</style>
</head>
<body>
<div class="wrap">
  <div id="loginHdr" class="hdr">
    <img src="${MIS_BRAND.logoUrl}" alt="Agile">
    <b>Agile Security Force Private Limited</b>
    <small>Client Door</small>
  </div>
  <div id="loginCard" class="card">
    <h3>Open with email PIN</h3>
    <p class="hint">Use the work email your Agile HOD sent. We will mail a 6-digit PIN.</p>
    <label for="email">Work email</label>
    <input id="email" type="email" autocomplete="username" inputmode="email" placeholder="you@company.com">
    <label for="pin">6-digit PIN</label>
    <input id="pin" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000">
    <div class="btns">
      <button type="button" class="m-btn m-btn-navy" id="btnSend">Send PIN</button>
      <button type="button" class="m-btn m-btn-gold" id="btnOpen">Open</button>
    </div>
    <div class="msg" id="loginMsg"></div>
  </div>
  <div id="dashCard" class="hidden">
    <div class="topbar"><button type="button" class="m-btn m-btn-grey" id="btnOut">Sign out</button></div>
    <div class="report" id="reportBox"></div>
  </div>
</div>
<script>
${suiteTapFeedbackInitScript()}
function el(id){return document.getElementById(id);}
function msg(t){el('loginMsg').textContent=t||'';}
function api(action,extra){
  return fetch('/api/client/data',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});
}
function paint(d){
  var box=el('reportBox');
  if(d.reportHtml){
    box.innerHTML=d.reportHtml;
    return;
  }
  box.innerHTML='';
}
function showDash(on){
  el('loginCard').classList.toggle('hidden',!!on);
  el('loginHdr').classList.toggle('hidden',!!on);
  el('dashCard').classList.toggle('hidden',!on);
}
function boot(){
  api('boot').then(function(res){
    if(res.status===200&&res.body&&(res.body.reportHtml||res.body.metrics)){paint(res.body);showDash(true);}
    else showDash(false);
  }).catch(function(){showDash(false);});
}
el('btnSend').onclick=function(){
  var email=(el('email').value||'').trim();
  if(!email){msg('Please enter your work email.');return;}
  msg('Sending PIN…');
  api('sendPin',{email:email}).then(function(res){
    if(res.status===200) msg(res.body.throttled?'PIN already sent. Check your inbox.':'PIN sent. Check your inbox (and spam).');
    else msg(res.body.error||'Could not send PIN.');
  }).catch(function(){msg('Network error. Try again.');});
};
el('btnOpen').onclick=function(){
  var email=(el('email').value||'').trim();
  var pin=(el('pin').value||'').trim();
  if(!email||!pin){msg('Enter email and PIN.');return;}
  msg('Opening…');
  api('verifyPin',{email:email,pin:pin}).then(function(res){
    if(res.status!==200){msg(res.body.error||'Could not open.');return;}
    return api('boot');
  }).then(function(res){
    if(!res)return;
    if(res.status===200&&res.body&&(res.body.reportHtml||res.body.metrics)){paint(res.body);showDash(true);msg('');}
    else msg(res.body&&res.body.error?res.body.error:'Could not load your sites.');
  }).catch(function(){msg('Network error. Try again.');});
};
el('btnOut').onclick=function(){
  api('logout').finally(function(){showDash(false);el('pin').value='';msg('');});
};
boot();
</script>
</body></html>`
}

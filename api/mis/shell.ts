import type { VercelRequest, VercelResponse } from '@vercel/node'
import { otpLoginHtml, otpLoginScript } from '../_lib/embedded-otp.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Sign In</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:linear-gradient(160deg,#0b1220,#14224f 50%,#1e3a6e);color:#e2e8f0;font-size:15px;min-height:100vh}
#login{max-width:400px;margin:0 auto;padding-top:12vh}
.card{background:linear-gradient(180deg,#111a30,#0e1730);border:1px solid #475569;border-radius:14px;padding:26px;box-shadow:0 12px 32px rgba(0,0,0,.35)}
.card h2{color:#fff;margin-bottom:4px}.card p{color:#94a3b8;font-size:13px;margin-bottom:14px}
input{width:100%;padding:12px;border:1px solid #475569;border-radius:9px;background:#0b1220;color:#fff;font-size:16px}
.btn{padding:12px 20px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:16px;background:linear-gradient(135deg,#b45309,#f59e0b);color:#14224f;width:100%;margin-top:14px}
.msg{padding:10px;border-radius:8px;font-size:14px;margin-top:10px;display:none}
.hidden{display:none!important}
label{display:block;font-size:12px;color:#94a3b8;margin:8px 0 4px;font-weight:700}
</style></head>
<body>
<p style="max-width:420px;margin:12px auto;padding:12px 14px;border-radius:10px;background:#450a0a;border:1px solid #f87171;text-align:center;font-size:14px;color:#fecaca;line-height:1.5">
  <b>Old Manus MIS is CLOSED permanently.</b> Use only <a href="https://www.agilegroup-digital.co.in" style="color:#fde68a;font-weight:800">agilegroup-digital.co.in</a> — App 05.
</p>
<p style="max-width:420px;margin:12px auto;padding:12px 14px;border-radius:10px;background:#0e1730;border:1px solid #c9a84c;text-align:center;font-size:14px;color:#fde68a;line-height:1.55">
  After sign-in, open <b>Master Directory</b> from the left menu (branches, clients, staff).
</p>
<p style="max-width:420px;margin:12px auto;padding:12px 14px;border-radius:10px;background:#0e1730;border:1px solid #475569;text-align:center;font-size:14px;color:#cbd5e1;line-height:1.5">
  <b style="color:#fde68a">Branch HOD?</b> Use App 05 → white <b>HODs / Staff</b> button → <a href="/mis-staff" style="color:#4ade80;font-weight:800">Branch Portal</a> — not this page.
</p>
${otpLoginHtml('Agile MIS', 'Management Dashboard — opened from App 05 Command Centre')}
<p id="hostWarn" style="display:none;max-width:400px;margin:12px auto;padding:10px;border-radius:8px;background:#422006;color:#fbbf24;font-size:13px;text-align:center">Please use <b>www.agilegroup-digital.co.in</b> (not the vercel.app link in the address bar).</p>
<script>
(function(){
  var p=new URLSearchParams(location.search);
  if(p.get('suite_role')==='staff'||p.get('portal')==='staff'){
    var q=p.toString();
    location.replace('/mis-staff'+(q?'?'+q:''));
  }
})();
function el(id){return document.getElementById(id);}
if(location.hostname.indexOf('vercel.app')>=0){var w=el('hostWarn');if(w)w.style.display='block';}
if(new URLSearchParams(location.search).get('fresh')==='1'){
  sessionStorage.removeItem('otp_mis');
  sessionStorage.removeItem('otp_email_mis');
}
${otpLoginScript('mis', 'Agile MIS', 'management')}
function misDest(){
  var d=new URLSearchParams(location.search).get('dest');
  if(d&&d.indexOf('/mis')===0)return d;
  return 'https://www.agilegroup-digital.co.in/mis-dashboard';
}
function onOtpLogin(j){
  fetch('/api/mis/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({sessionToken:OTP_SESSION})})
    .then(function(r){return r.json().then(function(res){return{s:r.status,j:res};});})
    .then(function(res){
      if(res.s!==200){otpMsg(res.j.error||'Login failed — please try PIN again.',false);return;}
      var dest=misDest();
      if(dest.indexOf('/mis-admin')>=0){location.href=dest;return;}
      location.href=dest;
    }).catch(function(){otpMsg('Network error after PIN. Please try again.',false);});
}
</script>
</body></html>`

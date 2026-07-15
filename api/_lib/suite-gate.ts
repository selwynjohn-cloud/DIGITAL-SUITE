import type { VercelRequest, VercelResponse } from '@vercel/node'
import { otpLoginHtml, otpLoginScript } from './embedded-otp.js'

export type SuiteGateOptions = {
  appId: string
  title: string
  subtitle: string
  role: 'staff' | 'management'
  targetUrl: string
  accent?: string
  appNumber?: string
}

export function gateRoleFromQuery(req: VercelRequest): 'staff' | 'management' {
  return String(req.query.suite_role ?? '').toLowerCase() === 'staff' ? 'staff' : 'management'
}

export function renderSuiteGatePage(opts: SuiteGateOptions): string {
  const accent = opts.accent || '#c9a84c'
  const target = JSON.stringify(opts.targetUrl)
  const subtitle = opts.subtitle.replace(/'/g, "\\'")
  const title = opts.title.replace(/'/g, "\\'")

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${opts.title} — Sign In</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:linear-gradient(160deg,#0b1220,${accent}22 45%,#1e3a6e);color:#e2e8f0;font-size:15px;min-height:100vh}
#login{max-width:420px;margin:0 auto;padding-top:10vh}
.badge{display:inline-block;margin-bottom:10px;padding:6px 12px;border-radius:999px;background:${accent}33;border:1px solid ${accent};color:#fde68a;font-size:11px;font-weight:800;letter-spacing:.08em}
.card{background:linear-gradient(180deg,#111a30,#0e1730);border:1px solid #475569;border-radius:14px;padding:26px;box-shadow:0 12px 32px rgba(0,0,0,.35)}
.card h2{color:#fff;margin-bottom:4px}
.card p{color:#94a3b8;font-size:13px;margin-bottom:14px}
input{width:100%;padding:12px;border:1px solid #475569;border-radius:9px;background:#0b1220;color:#fff;font-size:16px}
.btn{padding:12px 20px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:16px;background:linear-gradient(135deg,${accent},#f59e0b);color:#14224f;width:100%;margin-top:14px}
.msg{padding:10px;border-radius:8px;font-size:14px;margin-top:10px;display:none}
.hidden{display:none!important}
label{display:block;font-size:12px;color:#94a3b8;margin:8px 0 4px;font-weight:700}
.hint{max-width:420px;margin:14px auto;padding:10px 14px;border-radius:8px;background:#0e1730;border:1px solid #334155;color:#94a3b8;font-size:12px;text-align:center}
</style></head>
<body>
<div id="login">
<span class="badge">APP ${opts.appNumber ?? ''} · AGILE DIGITAL SUITE</span>
${otpLoginHtml(opts.title, opts.subtitle)}
</div>
<p class="hint">Same login as MIS, Guards, CRM &amp; Fleet — <b>@agilegroup.co.in</b> email + 6-digit PIN (15 minutes).</p>
<p id="hostWarn" style="display:none;max-width:420px;margin:12px auto;padding:10px;border-radius:8px;background:#422006;color:#fbbf24;font-size:13px;text-align:center">Please use <b>www.agilegroup-digital.co.in</b> (not a vercel.app link).</p>
<script>
var TARGET_URL=${target};
function el(id){return document.getElementById(id);}
if(location.hostname.indexOf('vercel.app')>=0){var w=el('hostWarn');if(w)w.style.display='block';}
if(new URLSearchParams(location.search).get('fresh')==='1'){
  sessionStorage.removeItem('otp_${opts.appId}');
  sessionStorage.removeItem('otp_email_${opts.appId}');
}
${otpLoginScript(opts.appId, opts.title, opts.role)}
function onOtpLogin(j){location.href=TARGET_URL;}
(function(){
  var t=sessionStorage.getItem('otp_${opts.appId}');
  if(!t||new URLSearchParams(location.search).get('fresh')==='1')return;
  location.replace(TARGET_URL);
})();
</script>
</body></html>`
}

export function sendSuiteGate(res: VercelResponse, html: string) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(html)
}

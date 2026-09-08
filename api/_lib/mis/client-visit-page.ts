import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hodLoginHtml, otpLoginScript } from '../embedded-otp.js'
import { hodBootFromRequest, hodBootScriptJson } from '../hod-session.js'
import { requireMisPageSession } from './session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from './layout.js'
import {
  MIS_STAFF_LAYOUT_CSS,
  MIS_STAFF_SESSION_JS,
  MIS_STAFF_THEME_CSS,
  misStaffPageWrap,
  STAFF_BOOT_HEAD_SCRIPT,
  STAFF_BOOT_WAIT_HTML,
} from './staff-layout.js'
import { MIS_STAFF_CSS } from './staff-theme.js'
import {
  clientVisitCss,
  clientVisitInnerHtml,
  clientVisitScript,
  clientVisitStaffBootScript,
  type ClientVisitPageOpts,
} from './client-visit-ui.js'

function mgmtPage(opts: ClientVisitPageOpts): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — ${opts.title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
.hidden{display:none!important}
${MIS_LAYOUT_CSS}
${clientVisitCss()}
.mtbl th,.mtbl td{padding:8px 10px;border-bottom:1px solid #22304f;text-align:left;vertical-align:top;font-size:13px}
.mtbl th{color:#fde68a;font-weight:800}
</style></head>
<body>
${misPageWrap(opts.activePath, opts.title, clientVisitInnerHtml(opts))}
<script>
${MIS_SESSION_JS}
${clientVisitScript(opts)}
misStart();
bootClientVisit();
</script>
</body></html>`
}

function staffPage(opts: ClientVisitPageOpts, hodBoot: string): string {
  const inner = clientVisitInnerHtml(opts)
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — ${opts.title}</title>
<script>window.__HOD_BOOT__=${hodBoot};</script>
${STAFF_BOOT_HEAD_SCRIPT}
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_STAFF_CSS}
${MIS_STAFF_THEME_CSS}
${MIS_STAFF_LAYOUT_CSS}
.hidden{display:none!important}
${clientVisitCss()}
.mtbl th,.mtbl td{padding:8px 10px;border-bottom:1px solid #22304f;text-align:left;vertical-align:top;font-size:13px}
.mtbl th{color:#fde68a;font-weight:800}
</style></head>
<body>
${STAFF_BOOT_WAIT_HTML}
<div id="staffLogin" class="staff-login-wrap">
<p style="margin-bottom:12px;padding:12px 14px;border-radius:10px;background:#0e1730;border:1px solid #22c55e;text-align:center;font-size:13px;color:#cbd5e1;line-height:1.55">
  <b style="color:#4ade80">HOD Portal</b> — Work email PIN, then select your branch.
</p>
${hodLoginHtml('Agile MIS', opts.title + ' — branch HOD sign in')}
</div>
<div id="staffShell" class="hidden">
${misStaffPageWrap(opts.activePath, opts.title, '<div class="staff-note noprint"><b>Branch Portal</b> — Visit schedule, Add visit, Visit list, Visit report, Review, Send to client. Your branch clients only.</div>' + inner)}
</div>
<script>
var STAFF_BRANCH_ID='',STAFF_BRANCH_NAME='';
function el(id){return document.getElementById(id);}
${otpLoginScript('mis-report', 'Agile MIS — Branch Portal', 'staff')}
${MIS_STAFF_SESSION_JS}
${clientVisitScript(opts)}
${clientVisitStaffBootScript()}
(function(){
  var fresh=new URLSearchParams(location.search).get('fresh')==='1';
  if(fresh){
    sessionStorage.removeItem('otp_mis-report');
    sessionStorage.removeItem('otp_email_mis-report');
    sessionStorage.removeItem('otp_branch_mis-report');
    sessionStorage.removeItem('otp_branch_name_mis-report');
    document.documentElement.classList.remove('boot-ready','staff-booting','boot-failed');
    fetch('/api/auth/hod-session',{method:'DELETE',credentials:'include'}).catch(function(){});
    if(typeof staffShowLogin==='function')staffShowLogin('');
  } else if(typeof staffBoot==='function')staffBoot();
})();
</script>
</body></html>`
}

export function clientVisitMgmtHandler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!requireMisPageSession(req, res)) return
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(
      mgmtPage({
        portal: 'mgmt',
        activePath: '/mis-visits',
        title: 'Client Visits',
      }),
    )
  } catch (err) {
    console.error('[mis/visits]', err)
    return res.status(500).send('Client Visits page failed to load. Please refresh.')
  }
}

export async function clientVisitStaffHandler(req: VercelRequest, res: VercelResponse) {
  const boot = await hodBootFromRequest(req)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(
    staffPage(
      {
        portal: 'staff',
        activePath: '/mis-staff-visits',
        title: 'Client Visits',
      },
      hodBootScriptJson(boot),
    ),
  )
}

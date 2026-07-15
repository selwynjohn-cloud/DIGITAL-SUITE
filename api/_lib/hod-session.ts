import type { VercelRequest } from '@vercel/node'
import { verifyAppSession } from './app-session.js'
import { getActiveBranch } from './mis/store.js'

export const HOD_SESSION_COOKIE = 'hod_mis_report'
const MAX_AGE_SEC = 8 * 60 * 60

function hodCookieDomain(host: string | undefined): string {
  const h = String(host ?? '').toLowerCase().split(':')[0]
  if (
    h === 'agilegroup-digital.co.in' ||
    h === 'www.agilegroup-digital.co.in' ||
    h.endsWith('.agilegroup-digital.co.in')
  ) {
    return '.agilegroup-digital.co.in'
  }
  return ''
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 1) continue
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

export function hodSessionFromRequest(req: VercelRequest): string {
  return String(parseCookies(req.headers.cookie)[HOD_SESSION_COOKIE] ?? '').trim()
}

export function hodSessionSetCookie(host: string | undefined, token: string): string {
  const dom = hodCookieDomain(host)
  const domPart = dom ? ` Domain=${dom};` : ''
  const val = encodeURIComponent(String(token ?? '').trim())
  return `${HOD_SESSION_COOKIE}=${val};${domPart} Path=/; Max-Age=${MAX_AGE_SEC}; Secure; SameSite=Lax`
}

export function hodSessionClearCookie(host: string | undefined): string {
  const dom = hodCookieDomain(host)
  const domPart = dom ? ` Domain=${dom};` : ''
  return `${HOD_SESSION_COOKIE}=;${domPart} Path=/; Max-Age=0; Secure; SameSite=Lax`
}

export type HodBoot = {
  sessionToken: string
  email: string
  branchId: string
  branchName: string
}

export async function hodBootFromRequest(req: VercelRequest): Promise<HodBoot | null> {
  const token = hodSessionFromRequest(req)
  if (!token) return null
  const session = await verifyAppSession(token, 'mis-report')
  if (!session || session.role !== 'staff' || !session.branchId) return null
  const branch = await getActiveBranch(session.branchId)
  if (!branch) return null
  return {
    sessionToken: token,
    email: session.email,
    branchId: session.branchId,
    branchName: branch.name,
  }
}

export function hodBootScriptJson(boot: HodBoot | null): string {
  if (!boot) return 'null'
  return JSON.stringify(boot)
}

/** Reads HOD sessionStorage on this tab, saves cookie, then opens Daily MIS report. */
export function hodReportBridgeHtml(): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Opening Daily Report</title>
<style>body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.box{text-align:center;padding:32px;max-width:440px;border:1px solid #334155;border-radius:14px;background:#0e1730}
.box p{color:#94a3b8;font-size:15px;line-height:1.55;margin:0}
.box b{color:#fde68a;font-size:17px;display:block;margin-bottom:12px}</style></head><body>
<div class="box"><b>Opening Daily MIS Submission…</b><p id="msg">Please wait a moment.</p></div>
<script>
(function(){
  var keys=['otp_mis-report','otp_mis'];
  var t=null,i,email='',bid='',bname='';
  for(i=0;i<keys.length&&!t;i++){
    t=sessionStorage.getItem(keys[i]);
    if(t&&keys[i]==='otp_mis'){email=sessionStorage.getItem('otp_email_mis')||'';}
  }
  if(!t){t=sessionStorage.getItem('otp_mis-report');}
  email=email||sessionStorage.getItem('otp_email_mis-report')||'';
  bid=sessionStorage.getItem('otp_branch_mis-report')||'';
  bname=sessionStorage.getItem('otp_branch_name_mis-report')||'';
  if(!t){
    document.getElementById('msg').innerHTML='Please sign in first.<br><br><a href="/mis-staff?fresh=1" style="color:#fde68a;font-weight:800">Open HOD Portal sign-in</a>';
    setTimeout(function(){location.replace('/mis-staff?fresh=1');},2200);
    return;
  }
  sessionStorage.setItem('otp_mis-report',t);
  if(email)sessionStorage.setItem('otp_email_mis-report',email);
  if(bid)sessionStorage.setItem('otp_branch_mis-report',bid);
  if(bname)sessionStorage.setItem('otp_branch_name_mis-report',bname);
  fetch('/api/auth/hod-session',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionToken:t})})
    .then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});})
    .then(function(res){
      if(res.s===200)location.replace('/mis-report');
      else{
        document.getElementById('msg').textContent=res.j&&res.j.error?res.j.error:'Could not open — please sign in again.';
        setTimeout(function(){location.replace('/mis-staff?fresh=1');},2500);
      }
    })
    .catch(function(){
      document.getElementById('msg').textContent='Network error — trying again…';
      setTimeout(function(){location.replace('/mis-report');},1200);
    });
})();
</script></body></html>`
}

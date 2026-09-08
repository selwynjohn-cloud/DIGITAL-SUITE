import { SUITE_MONEY_JS } from '../inr-money.js'
import { SUITE_PAGE_CHROME_CSS, suitePageHeadHtml } from '../suite-page-chrome.js'
import { misPrintFooterBlock } from './brand.js'
import { MIS_THEME_CSS } from './layout.js'

/**
 * HOD / Staff menu — Daily MIS sits after Client Complaints so HODs check
 * visits, night checks, complaints & compliance before the daily submit.
 * Locked: Client Complaints → Incident Reporting → Daily MIS Submission → Site Security Assessment (SSA) → Master Directory.
 * Do not move Daily MIS back to the top unless Selwyn explicitly asks.
 */
export const MIS_STAFF_MENU: [string, string, string][] = [
  ['Dashboard', '📊', '/mis-staff'],
  ['Branch Performance', '🏅', '/mis-staff-bpi'],
  ['Client Performance', '🏢', '/mis-staff-client'],
  ['Client Visits', '📍', '/mis-staff-visits'],
  ['Client Door', '🔗', '/mis-staff-client-door'],
  ['Site Security Visit Report (Day / Night Check)', '🛡️', '/mis-staff-night-visit'],
  ['Training (OJT)', '🎓', '/mis-staff-training-ojt'],
  ['Late Start & Out of Post', '🚶', '/mis-staff-duty'],
  ['SLA- Analysis & Compliance', '⚠', '/mis-staff-unit-issue'],
  ['Compliance (PVC/MC)', '🛡', '/mis-guard-docs'],
  ['Collection (DSO)', '₹', '/mis-staff-collection'],
  ['Guards Complaint', '📝', '/mis-staff-register'],
  ['Client Complaints', '⚠', '/mis-staff-complaints'],
  ['Incident Reporting', '🚨', '/mis-staff-incidents'],
  ['Daily MIS Submission', '🕒', '/mis-staff-daily'],
  ['Site Security Assessment (SSA)', '🛡️', '/mis-staff-special-survey'],
  ['Master Directory', '🗄', '/mis-staff-sites'],
  ['User Manual', '📖', '/mis-staff-manual'],
  ['Troubleshooting', '🔧', '/mis-staff-help'],
]

export const MIS_STAFF_LAYOUT_CSS = `
body.staff-body{background:#0b1220;color:#e2e8f0}
.staff-shell{display:flex;min-height:100vh;background:#0b1220}
.staff-side{position:fixed;top:0;left:0;bottom:0;width:320px;background:#0e1730;border-right:1px solid #22304f;display:flex;flex-direction:column;overflow-y:auto;z-index:40}
.staff-main{margin-left:320px;flex:1;min-height:100vh;display:flex;flex-direction:column;width:calc(100% - 320px)}
.staff-bar{background:#111a30;border-bottom:1px solid #22304f;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.staff-bar b{color:#fff;font-size:16px}
.staff-bar .co{color:#94a3b8;font-size:12px}
${SUITE_PAGE_CHROME_CSS}
.staff-side .brand{padding:18px 16px;text-align:center;border-bottom:1px solid #22304f}
.staff-side .brand img{height:54px}
.staff-side .brand b{display:block;color:#fff;font-size:14px;margin-top:8px}
.staff-side .brand small{color:#c9a84c;font-size:11px;line-height:1.4}
.staff-side .menu{padding:8px;flex:1}
.staff-side .mi{display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:9px;color:#cbd5e1;text-decoration:none;font-size:14px;font-weight:600;white-space:normal;line-height:1.35}
.staff-side .mi:hover{background:#16223f}
.staff-side .mi.active{background:#c9a84c;color:#14224f}
.staff-side .mi .ic{width:20px;text-align:center;flex-shrink:0}
.staff-side .logout{padding:12px 16px;border-top:1px solid #22304f;color:#94a3b8;cursor:pointer;font-size:13px}
.staff-content{flex:1;overflow:auto}
.staff-burger{display:none;background:#c9a84c;color:#14224f;border:none;border-radius:8px;padding:8px 12px;font-weight:800;cursor:pointer}
.staff-login-wrap{max-width:440px;margin:40px auto;padding:16px}
.staff-branch-tag{display:inline-block;padding:4px 10px;border-radius:999px;background:rgba(34,197,94,.15);border:1px solid #22c55e;color:#4ade80;font-size:12px;font-weight:800}
.staff-note{background:rgba(59,130,246,.12);border:1px solid #3b82f6;border-radius:10px;padding:12px 14px;color:#93c5fd;font-size:13px;line-height:1.55;margin-bottom:14px}
.staff-boot-wait{display:none;min-height:50vh;align-items:center;justify-content:center;padding:24px;background:#0b1220}
.staff-boot-box{text-align:center;padding:28px 32px;border:1px solid #334155;border-radius:14px;background:#0e1730;max-width:420px}
.staff-boot-box b{color:#fde68a;font-size:18px;display:block;margin-bottom:10px}
.staff-boot-box p{color:#94a3b8;font-size:15px;margin:0;line-height:1.5}
html.staff-booting .staff-boot-wait{display:flex!important}
html.staff-booting #loginWrap,html.staff-booting #staffLogin{display:none!important}
html.boot-ready #loginWrap,html.boot-ready #staffLogin{display:none!important}
html.boot-ready #staffShell{display:flex!important}
html.boot-failed .staff-boot-wait{display:none!important}
@media(max-width:820px){
  .staff-side{transform:translateX(-100%);transition:.2s;width:300px}
  .staff-side.open{transform:none}
  .staff-main{margin-left:0;width:100%}
  .staff-burger{display:inline-block}
}
@media print{.staff-side,.staff-bar,.staff-burger,.staff-note,.noprint{display:none!important}.staff-main{margin-left:0!important;width:100%!important}body,.staff-content{background:#fff!important}.letter{box-shadow:none!important}}
`

function staffPathMatch(active: string, path: string): boolean {
  if (active === path) return true
  const aBase = active.split('?')[0]
  const pBase = path.split('?')[0]
  if (aBase !== pBase) return false
  const aQ = active.includes('?') ? active.slice(active.indexOf('?') + 1) : ''
  const pQ = path.includes('?') ? path.slice(path.indexOf('?') + 1) : ''
  return aQ === pQ
}

export function misStaffSidebarHtml(active: string, branchName = ''): string {
  const items = MIS_STAFF_MENU.map(([label, icon, path]) => {
    const cls =
      (staffPathMatch(active, path) || (active === '/mis-guard-docs' && path === '/mis-guard-docs') ? ' active' : '') +
      (active === '/mis-report' && path === '/mis-staff-daily' ? ' active' : '') +
      (active === '/mis-staff-periodical-survey' && path === '/mis-staff-special-survey' ? ' active' : '')
    return `<a class="mi${cls}" href="${path}"><span class="ic">${icon}</span>${label}</a>`
  }).join('')
  const sub = branchName
    ? `<small>${branchName}</small>`
    : '<small>HODs / Staff Portal</small>'
  return `<aside class="staff-side" id="staffSide"><div class="brand"><img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile"><b>Agile MIS</b>${sub}</div><nav class="menu">${items}</nav><div class="logout" onclick="staffLogout()">⎋ Sign Out</div></aside>`
}

export function misStaffPageWrap(
  active: string,
  title: string,
  inner: string,
  branchName = '',
  headOpts?: { hideAgileBrand?: boolean; coText?: string; hideOpenedBy?: boolean },
): string {
  const head = suitePageHeadHtml('Agile MIS', title, {
    coText: headOpts?.coText,
    hideAgileBrand: headOpts?.hideAgileBrand === true,
    hideOpenedBy: headOpts?.hideOpenedBy === true,
  })
  return `<div class="staff-shell">${misStaffSidebarHtml(active, branchName)}<div class="staff-main"><div class="staff-bar"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><button type="button" class="staff-burger noprint" onclick="document.getElementById('staffSide').classList.toggle('open')">☰ Menu</button>${head}</div><span class="staff-branch-tag noprint" id="staffBranchTag">${branchName || 'Branch'}</span></div><div class="staff-content">${inner}${misPrintFooterBlock()}</div></div></div>`
}

export const MIS_STAFF_THEME_CSS = MIS_THEME_CSS

/** Hide login flash while an existing HOD session is checked. */
/** Hide login flash only when server confirmed a valid HOD cookie (not stale sessionStorage). */
export const STAFF_BOOT_HEAD_SCRIPT = `<script>(function(){try{var b=window.__HOD_BOOT__;if(b&&b.sessionToken)document.documentElement.classList.add('staff-booting');}catch(e){}})();</script>`

export const STAFF_BOOT_WAIT_HTML = `<div id="staffBootWait" class="staff-boot-wait"><div class="staff-boot-box"><b id="staffBootWaitTitle">Opening your branch portal…</b><p>Please wait a moment.</p></div></div>`

export const MIS_STAFF_SESSION_JS = `
${SUITE_MONEY_JS}
try{var _sh=document.querySelector('.suite-app-name');var _sm=document.querySelector('.suite-menu-name');if(_sh&&_sm)document.title='AGILE · '+String(_sh.textContent||'').trim()+' · '+String(_sm.textContent||'').trim();}catch(e){}
function staffPaintOpenedBy(){
  var who='';
  try{if(typeof OTP_EMAIL!=='undefined'&&OTP_EMAIL)who=String(OTP_EMAIL).trim();}catch(e){}
  if(!who){try{who=sessionStorage.getItem('otp_email_mis-report')||'';}catch(e){}}
  var branch='';
  try{if(typeof OTP_BRANCH_NAME!=='undefined'&&OTP_BRANCH_NAME)branch=String(OTP_BRANCH_NAME).trim();}catch(e){}
  var el=document.getElementById('suiteOpenedBy');
  if(el&&who)el.textContent='Opened by: '+who+(branch?' · '+branch:'');
}
staffPaintOpenedBy();
setTimeout(staffPaintOpenedBy,500);
setTimeout(staffPaintOpenedBy,1500);
function staffTodayIst(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});}
function staffLogout(){
  sessionStorage.removeItem('otp_mis-report');
  sessionStorage.removeItem('otp_email_mis-report');
  sessionStorage.removeItem('otp_branch_mis-report');
  sessionStorage.removeItem('otp_branch_name_mis-report');
  sessionStorage.removeItem('guard_branch');
  sessionStorage.removeItem('guard_reopen');
  fetch('/api/auth/hod-session',{method:'DELETE',credentials:'include'}).catch(function(){});
  location.href='/mis-staff?fresh=1';
}
function staffGoDailyMis(e){
  if(e&&e.preventDefault)e.preventDefault();
  location.href='/mis-staff-daily';
  return false;
}
function staffLoginEl(){return el('staffLogin')||el('loginWrap')||el('login');}
function staffShellEl(){return el('staffShell');}
function staffResolveBranchId(){
  if(OTP_BRANCH_ID&&String(OTP_BRANCH_ID).trim())return OTP_BRANCH_ID;
  var stored=sessionStorage.getItem('otp_branch_mis-report');
  if(stored&&String(stored).trim()){OTP_BRANCH_ID=stored;return stored;}
  if(typeof otpBranchFromJwt==='function'&&OTP_SESSION){
    var bid=otpBranchFromJwt(OTP_SESSION);
    if(bid&&String(bid).trim()){OTP_BRANCH_ID=bid;sessionStorage.setItem('otp_branch_mis-report',bid);return bid;}
  }
  return '';
}
function staffEnsureSession(){
  if(OTP_SESSION)return true;
  if(typeof otpRestoreSession==='function') otpRestoreSession();
  return !!OTP_SESSION;
}
function staffApi(action,extra){
  var bid=staffResolveBranchId();
  return fetch('/api/mis/staff-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,branchId:bid},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});
}
function staffBranchLabel(){
  if(OTP_BRANCH_NAME)return OTP_BRANCH_NAME;
  return sessionStorage.getItem('otp_branch_name_mis-report')||'Branch';
}
function staffBootPending(title){
  document.documentElement.classList.add('staff-booting');
  document.documentElement.classList.remove('boot-failed');
  document.body.classList.add('staff-body');
  var w=el('staffBootWait');if(w)w.style.display='';
  var t=el('staffBootWaitTitle');if(t&&title)t.textContent=title;
  var login=staffLoginEl();if(login)login.classList.add('hidden');
}
function staffShowApp(){
  document.documentElement.classList.remove('staff-booting','boot-failed');
  document.documentElement.classList.add('boot-ready','hod-signed-in');
  var w=el('staffBootWait');if(w)w.style.display='none';
  var login=staffLoginEl();if(login)login.classList.add('hidden');
  var shell=staffShellEl();if(shell)shell.classList.remove('hidden');
  var tag=el('staffBranchTag');
  if(tag)tag.textContent=staffBranchLabel();
  document.body.classList.add('staff-body');
}
function staffPortalEnter(hideLoginId){
  document.documentElement.classList.add('boot-ready','hod-signed-in');
  var login=el(hideLoginId||'login')||staffLoginEl();if(login)login.classList.add('hidden');
  var promo=el('promoBanner');if(promo)promo.classList.add('hidden');
  var topBanner=document.querySelector('.top');if(topBanner)topBanner.style.display='none';
  var shell=el('staffShell');if(shell)shell.classList.remove('hidden');
  var tag=el('staffBranchTag');
  if(tag)tag.textContent=staffBranchLabel();
  document.body.classList.add('staff-body');
}
function staffClearSession(){
  sessionStorage.removeItem('otp_mis-report');
  sessionStorage.removeItem('otp_email_mis-report');
  sessionStorage.removeItem('otp_branch_mis-report');
  sessionStorage.removeItem('otp_branch_name_mis-report');
  OTP_SESSION='';OTP_EMAIL='';OTP_BRANCH_ID='';OTP_BRANCH_NAME='';
  document.documentElement.classList.remove('hod-signed-in','boot-ready');
  fetch('/api/auth/hod-session',{method:'DELETE',credentials:'include'}).catch(function(){});
}
function staffOnLogin(j){
  if(typeof branchHideAll==='function') branchHideAll();
  else{var e=el('otpStepEmail');var p=el('otpStepPin');if(e)e.classList.add('hidden');if(p)p.classList.add('hidden');}
  staffShowApp();
  if(typeof initStaffPage==='function') initStaffPage(j);
  else if(typeof load==='function') load();
}
function staffShowLogin(msg){
  document.documentElement.classList.remove('boot-ready','hod-signed-in','staff-booting');
  document.documentElement.classList.add('boot-failed');
  var w=el('staffBootWait');if(w){w.style.display='none';w.setAttribute('aria-hidden','true');}
  var login=staffLoginEl();if(login)login.classList.remove('hidden');
  var shell=staffShellEl();if(shell)shell.classList.add('hidden');
  if(msg&&typeof otpMsg==='function')otpMsg(msg,false);
}
function staffPingTimeout(ms){
  return new Promise(function(_, reject){
    setTimeout(function(){ reject(new Error('timeout')); }, ms || 12000);
  });
}
function staffBoot(){
  document.body.classList.add('staff-body');
  if(typeof otpRestoreSession!=='function'||!otpRestoreSession()){
    staffShowLogin('');
    return;
  }
  staffBootPending('Checking your sign-in…');
  Promise.race([staffApi('ping'), staffPingTimeout(12000)]).then(function(res){
    if(res.status!==200){
      staffClearSession();
      staffShowLogin(res.body&&res.body.error?res.body.error:'Please select your branch and enter your branch password.');
      return;
    }
    if(res.body&&res.body.branchId){
      OTP_BRANCH_ID=res.body.branchId;
      sessionStorage.setItem('otp_branch_mis-report',res.body.branchId);
    }
    if(res.body&&res.body.branch)OTP_BRANCH_NAME=res.body.branch;
    if(typeof hodPersistSession==='function')hodPersistSession();
    staffShowApp();
    if(typeof initStaffPage==='function')initStaffPage({});
    else if(typeof load==='function')load();
  }).catch(function(){
    staffClearSession();
    staffShowLogin('Could not verify sign-in — check your internet and refresh the page.');
  });
}
`

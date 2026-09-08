/**
 * Shared chrome for Agile Training — Track 1 On Site Tactical Training (OJT)
 * · Track 2 Digital Learning Program (Online Courses).
 * Theme aligned with Agile Command Centre (navy + gold).
 */

import { SUITE_APP_FOOTER_CSS, suiteAppOpenPageFooterHtml } from '../suite-app-footer.js'
import { SUITE_DATE_INPUT_CSS, suiteDateInputInitScript } from '../suite-date-input.js'
import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../suite-tap-feedback.js'
import { TRAINING_BRAND, TRAINING_LOGO_URL } from './training-brand.js'
import { TRAINING_TRACK1_LABEL, TRAINING_TRACK2_LABEL } from './track-labels.js'

export { TRAINING_LOGO_URL, TRAINING_BRAND }

export function trainingShellCss(): string {
  return `
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:'Segoe UI',system-ui,sans-serif;color:#e2e8f0;min-height:100vh;
  background:
    radial-gradient(1200px 500px at 10% -10%,rgba(201,168,76,.28),transparent 55%),
    radial-gradient(900px 420px at 90% 0%,rgba(15,118,110,.35),transparent 50%),
    radial-gradient(800px 400px at 50% 100%,rgba(37,99,235,.22),transparent 55%),
    linear-gradient(165deg,#070d1a 0%,#0b1220 40%,#12203a 100%);
}
a{color:#fde68a;text-decoration:none}
.wrap{max-width:1100px;margin:0 auto;padding:0 16px 48px}
.tr-hero{
  position:relative;overflow:hidden;
  margin:0 -16px 18px;padding:22px 16px 20px;
  background:linear-gradient(135deg,#0e1730 0%,#14224f 45%,#0f766e 120%);
  border-bottom:3px solid #c9a84c;
  box-shadow:0 12px 36px rgba(0,0,0,.35);
}
.tr-hero::before{
  content:'';position:absolute;inset:0;pointer-events:none;
  background:
    radial-gradient(circle at 85% 20%,rgba(253,230,138,.18),transparent 40%),
    radial-gradient(circle at 15% 80%,rgba(45,212,191,.12),transparent 35%);
}
.tr-hero-inner{position:relative;max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px}
.tr-brand{display:flex;align-items:center;gap:14px;min-width:0;flex:1}
.tr-logo{
  height:72px;width:auto;max-width:110px;object-fit:contain;flex-shrink:0;
  background:transparent!important;border:none;box-shadow:none;padding:0;
  filter:drop-shadow(0 4px 12px rgba(0,0,0,.35));
}
.tr-brand-text{min-width:0}
.tr-co{
  font-size:.95rem;font-weight:800;color:#fff;letter-spacing:.01em;line-height:1.25;
  text-shadow:0 1px 8px rgba(0,0,0,.35);
}
.tr-dept{
  margin-top:4px;font-size:.82rem;font-weight:700;color:#fde68a;letter-spacing:.04em;
  text-transform:uppercase;line-height:1.35;
}
.tr-tag{
  margin-top:6px;font-size:1.05rem;font-weight:800;color:#99f6e4;font-style:italic;
  letter-spacing:.01em;line-height:1.3;
}
.meta{font-size:.85rem;color:#cbd5e1;text-align:right;line-height:1.4}
.meta b{color:#fde68a}
.nav{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px}
.nav a,.nav button,.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  padding:10px 14px;border-radius:10px;border:1px solid rgba(201,168,76,.45);
  background:linear-gradient(180deg,#16223f,#0e1730);color:#fde68a;font-weight:700;font-size:.9rem;cursor:pointer;
}
.nav a:hover,.btn:hover{border-color:#c9a84c;background:linear-gradient(180deg,#1e2d52,#14224f)}
.nav a.active,.btn.primary{background:linear-gradient(135deg,#c9a84c,#a8842f);color:#14224f;border-color:#fde68a}
.btn.danger{background:#3f1d1d;color:#fecaca;border-color:#7f1d1d}
.btn.ghost{background:transparent;color:#e2e8f0}
.ojt-gal-live{
  position:fixed;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:80;
  min-height:56px;font-size:16px;padding:10px;border-radius:12px;
  border:2px solid #c9a84c;background:#14224f;color:#fde68a;display:block;
}
.ojt-gal-live.is-away{
  position:fixed!important;left:0!important;top:0!important;width:2px!important;height:2px!important;
  min-height:2px!important;opacity:.02!important;z-index:0!important;pointer-events:none;
  border:0!important;padding:0!important;
}
.panel{
  background:linear-gradient(160deg,rgba(17,26,48,.96),rgba(14,23,48,.92));
  border:1px solid rgba(201,168,76,.35);border-radius:18px;padding:20px;
  box-shadow:0 14px 40px rgba(0,0,0,.35);
}
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.card-link{display:block;padding:22px 18px;border-radius:14px;border:1px solid rgba(201,168,76,.35);background:#111a30;transition:transform .15s ease,box-shadow .15s ease}
.card-link:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(201,168,76,.18)}
.card-link h2{font-size:1.15rem;color:#fde68a;margin-bottom:6px}
.card-link p{font-size:.9rem;color:#94a3b8;line-height:1.45}
h1{font-size:1.5rem;color:#fff;margin-bottom:6px;letter-spacing:-.02em}
h2.sec{font-size:1.05rem;color:#fde68a;margin:18px 0 10px}
.muted{color:#94a3b8;font-size:.92rem;line-height:1.5}
.tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.tabs button{padding:8px 12px;border-radius:999px;border:1px solid rgba(201,168,76,.4);background:#0e1730;font-weight:700;color:#fde68a;cursor:pointer;font-size:.85rem}
.tabs button.on{background:linear-gradient(135deg,#c9a84c,#a8842f);color:#14224f;border-color:#fde68a}
.ojt-layout{display:grid;grid-template-columns:240px minmax(0,1fr);gap:18px;align-items:start}
.ojt-sidebar{
  position:sticky;top:12px;padding:12px 10px;border-radius:14px;
  border:1px solid rgba(201,168,76,.28);background:rgba(11,18,32,.72);
  max-height:calc(100vh - 24px);overflow:auto
}
.ojt-main{min-width:0}
.ojt-menu-label{font-size:.72rem;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin:10px 0 6px}
.ojt-sidebar .ojt-menu-label:first-child{margin-top:0}
.ojt-menu{display:flex;flex-direction:column;gap:6px;margin-bottom:8px}
.ojt-menu button,.ojt-menu a.ojt-link{
  padding:10px 12px;border-radius:10px;border:1px solid rgba(201,168,76,.4);background:#0e1730;
  font-weight:700;color:#fde68a;cursor:pointer;font-size:.82rem;text-decoration:none;
  display:flex;align-items:center;width:100%;text-align:left;line-height:1.25
}
.ojt-menu button.on,.ojt-menu a.ojt-link.on{background:linear-gradient(135deg,#c9a84c,#a8842f);color:#14224f;border-color:#fde68a}
#menuHelp{margin-top:4px;padding-top:8px;border-top:1px solid rgba(148,163,184,.25)}
@media(max-width:900px){
  .ojt-layout{grid-template-columns:1fr}
  .ojt-sidebar{position:relative;top:auto;max-height:none}
}
.ojt-subtabs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}
.ojt-subtabs button{padding:7px 11px;border-radius:8px;border:1px solid #334155;background:#111a30;color:#cbd5e1;font-weight:700;cursor:pointer;font-size:.8rem}
.ojt-subtabs button.on{border-color:#c9a84c;color:#fde68a;background:#16223f}
.cam-modal{position:fixed;inset:0;background:#000;z-index:400;display:flex;flex-direction:column}
.cam-modal.hidden{display:none!important}
.cam-video-wrap{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#111;min-height:40vh}
.cam-modal video{width:100%;max-height:75vh;object-fit:contain;background:#111;transform-origin:center center}
.cam-top{padding:12px 16px;background:#0f172a;color:#fde68a;font-weight:700;text-align:center;font-size:.9rem}
.cam-actions{display:flex;gap:12px;padding:16px;justify-content:center;background:#0f172a;flex-wrap:wrap}
.days-bar{height:10px;border-radius:6px;background:#22304f;overflow:hidden;min-width:80px}
.days-bar>i{display:block;height:100%;background:linear-gradient(90deg,#f59e0b,#ef4444)}
.days-bar.tone-ok>i{background:linear-gradient(90deg,#34d399,#10b981)}
.days-bar.tone-warn>i{background:linear-gradient(90deg,#fbbf24,#f59e0b)}
.days-bar.tone-danger>i{background:linear-gradient(90deg,#f87171,#ef4444)}
.days-bar.tone-done>i{background:linear-gradient(90deg,#6ee7b7,#22c55e)}
.sec-obs-actions{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.sec-obs-actions .btn{padding:5px 9px;font-size:11px;white-space:nowrap}
.track-pill{display:inline-block;padding:3px 8px;border-radius:999px;font-size:.68rem;font-weight:700}
.track-pill.done{background:#14532d;color:#bbf7d0}
.track-pill.warn{background:#78350f;color:#fde68a}
.track-pill.bad{background:#7f1d1d;color:#fecaca}
.track-pill.info{background:#164e63;color:#a5f3fc}
.track-pill.muted{background:#1e293b;color:#cbd5e1}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin:12px 0}
input[type="date"],input[type="month"],input[type="datetime-local"]{min-height:42px;cursor:pointer;color-scheme:dark}
${SUITE_DATE_INPUT_CSS}
.row{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin-bottom:12px}
label{display:flex;flex-direction:column;gap:4px;font-size:.78rem;font-weight:700;color:#94a3b8;min-width:140px;flex:1}
label.wide{flex:2;min-width:220px}
input,select,textarea{padding:9px 10px;border:1px solid #334155;border-radius:8px;font:inherit;color:#e2e8f0;background:#0b1220}
textarea{min-height:72px;resize:vertical}
table{width:100%;border-collapse:collapse;font-size:.88rem}
th,td{border-bottom:1px solid #22304f;padding:8px 6px;text-align:left;vertical-align:top;color:#e2e8f0}
th{color:#c9a84c;font-size:.75rem;text-transform:uppercase;letter-spacing:.03em}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.cal .hd{font-size:.72rem;font-weight:700;color:#94a3b8;text-align:center;padding:4px}
.cal .day{min-height:72px;border:1px solid #22304f;border-radius:8px;padding:4px;background:#0e1730;font-size:.72rem}
.cal .day.mute{opacity:.4}
.cal .day .n{font-weight:800;color:#fde68a;margin-bottom:2px}
.pill{display:inline-block;padding:2px 7px;border-radius:999px;background:#134e4a;color:#99f6e4;font-size:.7rem;font-weight:700;margin:1px 0}
.pill.warn{background:#78350f;color:#fde68a}
.pill.ok{background:#14532d;color:#bbf7d0}
.pill.bad{background:#7f1d1d;color:#fecaca}
.toast{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#c9a84c;color:#14224f;padding:10px 16px;border-radius:10px;font-size:.9rem;font-weight:700;z-index:50;display:none}
.hidden{display:none!important}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px}
.stat{background:linear-gradient(145deg,#0e1730,#16223f);border:1px solid rgba(201,168,76,.3);border-radius:12px;padding:12px}
.stat b{display:block;font-size:1.4rem;color:#fde68a}
.stat span{font-size:.78rem;color:#94a3b8}
.form-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
@media(max-width:640px){
  .tr-logo{height:58px}
  .tr-co{font-size:.85rem}
  .tr-dept{font-size:.72rem}
  .tr-tag{font-size:.92rem}
  .meta{text-align:left;width:100%}
}
${SUITE_APP_FOOTER_CSS}
${SUITE_TAP_FEEDBACK_CSS}
`.trim()
}

export function trainingSessionBootScript(): string {
  return `
${suiteTapFeedbackInitScript()}
${suiteDateInputInitScript()}
function trainingStore(key,val){
  if(!val&&val!=='')return;
  try{sessionStorage.setItem(key,val);}catch(e){}
  try{localStorage.setItem(key,val);}catch(e){}
}
function trainingGet(key){
  try{var a=sessionStorage.getItem(key);if(a)return a;}catch(e){}
  try{var b=localStorage.getItem(key);if(b)return b;}catch(e){}
  return '';
}
function trainingReadAuth(){
  /** Memory first — hub calls this more than once; never lose the token after URL cleanup. */
  if(window.__TRAINING_AUTH__&&window.__TRAINING_AUTH__.token){
    var cached=window.__TRAINING_AUTH__;
    var q0=new URLSearchParams(location.search);
    if(q0.get('suite_ok')==='1'){
      q0.delete('suite_token');q0.delete('suite_email');q0.delete('suite_branch');q0.delete('suite_branch_name');q0.delete('suite_role');q0.delete('suite_ok');
      try{history.replaceState({},'',location.pathname+(q0.toString()?'?'+q0.toString():''));}catch(e){}
    }
    return cached;
  }
  var q=new URLSearchParams(location.search);
  var token=q.get('suite_token')||trainingGet('otp_training')||'';
  var email=q.get('suite_email')||trainingGet('otp_email_training')||'';
  var branch=q.get('suite_branch')||trainingGet('otp_branch_training')||'';
  var branchName=q.get('suite_branch_name')||trainingGet('otp_branch_name_training')||'';
  var role=q.get('suite_role')||trainingGet('otp_role_training')||'';
  if(token) trainingStore('otp_training',token);
  if(email) trainingStore('otp_email_training',email);
  if(branch) trainingStore('otp_branch_training',branch);
  if(branchName) trainingStore('otp_branch_name_training',branchName);
  if(role) trainingStore('otp_role_training',role);
  var auth={token:token,email:email,branchId:branch,branchName:branchName,role:role};
  window.__TRAINING_AUTH__=auth;
  if(q.get('suite_ok')==='1'&&token){
    q.delete('suite_token');q.delete('suite_email');q.delete('suite_branch');q.delete('suite_branch_name');q.delete('suite_role');q.delete('suite_ok');
    try{history.replaceState({},'',location.pathname+(q.toString()?'?'+q.toString():''));}catch(e){}
  }
  return auth;
}
function trainingAuthHeaders(){
  var a=trainingReadAuth();
  return {
    'Content-Type':'application/json',
    'x-suite-token':a.token||'',
    'x-suite-email':a.email||'',
    'x-suite-branch':a.branchId||''
  };
}
/** Send user back to the correct Training login (staff branch password vs management PIN). */
function trainingLoginUrl(){
  var role=trainingGet('otp_role_training')||(window.__TRAINING_AUTH__&&window.__TRAINING_AUTH__.role)||'';
  var isMgmt=String(role).toLowerCase()==='management';
  if(isMgmt) return '/training/?portal=management&suite_role=management&fresh=1';
  return '/training/?portal=lecturer&suite_role=staff&fresh=1';
}
function trainingRequireLogin(){
  var a=trainingReadAuth();
  if(!a.token){
    location.href=trainingLoginUrl();
    return null;
  }
  return a;
}
function trainingToast(msg){
  var el=document.getElementById('toast');
  if(!el){alert(msg);return;}
  el.textContent=msg;el.style.display='block';
  clearTimeout(window.__tt);window.__tt=setTimeout(function(){el.style.display='none';},3200);
}
`.trim()
}

export function trainingPageHtml(opts: {
  title: string
  body: string
  script?: string
  activeNav?: 'hub' | 'ojt' | 'online'
  /** Hub chooser: no Tracks / Track 1 / Track 2 nav strip. */
  hideNav?: boolean
  footerHtml?: string
}): string {
  const nav = opts.hideNav
    ? ''
    : `<nav class="nav" id="mainNav">
    <a href="/training/hub" data-nav="hub">Tracks</a>
    <a href="/training/ojt" data-nav="ojt">${TRAINING_TRACK1_LABEL}</a>
    <a href="#" id="onlineLink" data-nav="online">${TRAINING_TRACK2_LABEL}</a>
  </nav>`
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${opts.title}</title>
<style>${trainingShellCss()}</style>
</head>
<body>
<header class="tr-hero">
  <div class="tr-hero-inner">
    <div class="tr-brand">
      <img class="tr-logo" src="${TRAINING_LOGO_URL}" alt="Agile Security Force" width="110" height="72">
      <div class="tr-brand-text">
        <div class="tr-co">${TRAINING_BRAND.company.replace(/&/g, '&amp;')}</div>
        <div class="tr-dept">${TRAINING_BRAND.department.replace(/&/g, '&amp;')}</div>
        <div class="tr-tag">${TRAINING_BRAND.tagline.replace(/&/g, '&amp;')}</div>
      </div>
    </div>
    <div class="meta" id="userMeta">Loading…</div>
  </div>
</header>
<div class="wrap">
  ${nav}
  ${opts.body}
  ${opts.footerHtml ?? suiteAppOpenPageFooterHtml()}
</div>
<div class="toast" id="toast"></div>
<script>
${trainingSessionBootScript()}
(function(){
  var a=trainingRequireLogin();
  if(!a) return;
  var meta=document.getElementById('userMeta');
  if(meta) meta.innerHTML='<b>Signed in</b><br>'+(a.email||'')+(a.branchName||a.branchId?('<br>'+(a.branchName||a.branchId)):'');
  var active=${JSON.stringify(opts.activeNav || '')};
  document.querySelectorAll('#mainNav a').forEach(function(el){
    if(el.getAttribute('data-nav')===active) el.classList.add('active');
  });
  var online=document.getElementById('onlineLink');
  if(online){
    online.addEventListener('click',function(e){
      e.preventDefault();
      fetch('/api/training/ojt-data',{method:'POST',headers:trainingAuthHeaders(),body:JSON.stringify({action:'lmsUrl'})})
        .then(function(r){return r.json();})
        .then(function(j){ location.href=j.url||'/training/?portal=trainee'; })
        .catch(function(){ location.href='/training/?portal=trainee'; });
    });
  }
})();
${opts.script || ''}
</script>
</body></html>`
}

import { misPrintFooterBlock } from './brand.js'
import { SUITE_MONEY_JS } from '../inr-money.js'

export const MIS_MENU: [string, string, string][] = [
  ['Dashboard', '📊', '/mis-dashboard'],
  ['Daily MIS Submission', '🕒', '/mis-submission'],
  ['Consolidated MIS', '📋', '/mis-board'],
  ['MD Sir Report', '📑', '/mis-md'],
  ['Branch Performance', '🏅', '/mis-bpi'],
  ['Client Performance', '🏢', '/mis-client'],
  ['Client Visits', '📍', '/mis-visits'],
  ['Patrol & Duty Exceptions', '🚶', '/mis-duty'],
  ['SLA Issue Analysis', '⚠', '/mis-unit-issue'],
  ['Compliance (PVC/MC)', '🛡', '/mis-compliance'],
  ['Collection (DSO)', '₹', '/mis-collection'],
  ['Register Complaints', '📝', '/mis-register-complaints'],
  ['Complaints', '⚠', '/mis-complaints'],
  ['Master Directory', '🗄', '/mis-admin'],
  ['User Management', '👥', '/mis-users'],
  ['User Manual', '📖', '/mis-manual'],
  ['Troubleshooting', '🔧', '/mis-troubleshooting'],
]

/** Shared Manus-style dark theme for MIS page content areas. */
export const MIS_THEME_CSS = `
.m-wrap{max-width:1300px;margin:0 auto;padding:16px}
.m-card{background:#111a30;border:1px solid #22304f;border-radius:12px;padding:18px;margin-bottom:16px;color:#e2e8f0}
.m-card h3,.m-card h4{color:#fff;margin-bottom:10px;font-size:16px;font-weight:800}
.m-card .hint{color:#94a3b8;font-size:13px;margin-bottom:10px;line-height:1.5}
.m-btn{padding:10px 16px;border:none;border-radius:8px;font-weight:800;cursor:pointer;font-size:14px;text-decoration:none;display:inline-block;line-height:1.2}
.m-btn-gold{background:#c9a84c;color:#14224f}.m-btn-navy{background:#1d4ed8;color:#fff}.m-btn-grey{background:#334155;color:#e2e8f0}.m-btn-red{background:#dc2626;color:#fff}.m-btn-green{background:#16a34a;color:#fff}
.m-lbl{display:block;font-size:12px;color:#94a3b8;margin-bottom:3px;font-weight:600}
.m-inp,select.m-inp,textarea.m-inp{padding:9px 10px;border:1px solid #334155;border-radius:7px;background:#0b1220;color:#e2e8f0;font-size:15px}
select.m-inp option{background:#0b1220;color:#e2e8f0}
.mtblwrap{overflow-x:auto;border:1px solid #22304f;border-radius:8px}
.mtbl{border-collapse:collapse;width:100%;font-size:13px;min-width:600px}
.mtbl th,.mtbl td{border:1px solid #22304f;padding:8px;text-align:left;color:#e2e8f0;vertical-align:top}
.mtbl th{background:#0e1730;color:#c9a84c;font-size:11px;text-transform:uppercase;position:sticky;top:0;z-index:1}
.mtbl td input,.mtbl td select,.mtbl td textarea{background:#0b1220;color:#e2e8f0;border:1px solid #334155;border-radius:5px;padding:6px;width:100%;font-size:13px}
.mtbl td.c,.mtbl th.c{text-align:center}
.m-kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:14px}
.m-kpi{border-radius:12px;padding:16px;text-align:center;border:1px solid #22304f;background:linear-gradient(145deg,#0e1730,#16223f);box-shadow:0 4px 14px rgba(0,0,0,.2)}
.m-kpi b{font-size:28px;display:block;color:#fff}.m-kpi span{font-size:12px;color:#94a3b8;display:block;margin-top:2px}
.m-kpi.s b{color:#22c55e}.m-kpi.p b{color:#ef4444}.m-kpi.t b{color:#c9a84c}.m-kpi.o b{color:#3b82f6}
.m-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border:1px solid #22304f;border-radius:10px;margin-bottom:8px;background:#0e1730;color:#e2e8f0}
.m-row b{color:#fff}
.m-row .sub{color:#94a3b8;font-size:12px;margin-top:2px}
.m-tag{padding:4px 12px;border-radius:999px;font-size:12px;font-weight:800;display:inline-block;white-space:nowrap}
.m-tag-ok{background:rgba(34,197,94,.18);color:#4ade80;border:1px solid #22c55e}
.m-tag-no{background:rgba(239,68,68,.18);color:#fca5a5;border:1px solid #ef4444}
.m-tag-late{background:rgba(245,158,11,.18);color:#fcd34d;border:1px solid #f59e0b}
.m-tag-warn{background:rgba(201,168,76,.18);color:#fde68a;border:1px solid #c9a84c}
.m-bar{height:14px;border-radius:8px;background:#22304f;overflow:hidden;margin:6px 0}.m-bar>i{display:block;height:100%;background:linear-gradient(90deg,#c9a84c,#22c55e);transition:width .3s}
.sc-good{color:#4ade80!important;font-weight:800}
.sc-fair{color:#fbbf24!important;font-weight:800}
.sc-poor{color:#f87171!important;font-weight:800}
.sc-bg-good{background:rgba(34,197,94,.22);color:#4ade80;border-radius:6px;padding:2px 8px;font-weight:800;display:inline-block}
.sc-bg-fair{background:rgba(245,158,11,.22);color:#fbbf24;border-radius:6px;padding:2px 8px;font-weight:800;display:inline-block}
.sc-bg-poor{background:rgba(239,68,68,.22);color:#f87171;border-radius:6px;padding:2px 8px;font-weight:800;display:inline-block}
.m-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.m-row-inactive td{opacity:.45}
.m-rank{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;font-size:12px;font-weight:800;color:#fff}
.m-rank-1{background:#dc2626}.m-rank-2{background:#ea580c}.m-rank-3{background:#f59e0b}.m-rank-n{background:#64748b}
.m-savebar{position:sticky;bottom:0;background:#111a30;border-top:1px solid #22304f;padding:12px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;box-shadow:0 -4px 12px rgba(0,0,0,.3);z-index:20}
.m-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.m-tab{padding:11px 20px;border-radius:9px;border:1px solid #334155;background:#0e1730;color:#cbd5e1;font-weight:800;cursor:pointer}
.m-tab.active{background:#c9a84c;color:#14224f;border-color:#c9a84c}
.m-hdr{background:linear-gradient(135deg,#14224f,#1b2f6b);color:#fff;border-radius:12px;padding:18px;margin-bottom:16px;border:1px solid #334155}
.m-hdr b{font-size:20px;color:#fff}.m-hdr .badges{margin-top:8px;font-size:13px;color:#cbd5e1;line-height:1.6}
.m-kb{background:#0e1730;border:1px solid #22304f;border-radius:10px;padding:10px 16px;min-width:110px;display:inline-block}
.m-kb b{display:block;font-size:22px;color:#c9a84c}.m-kb span{font-size:11px;color:#94a3b8}
.m-pending{color:#94a3b8;font-style:italic}
.m-toggle{padding:4px 10px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;border:1px solid #334155;background:#0b1220;color:#94a3b8}
.m-toggle.on{background:rgba(34,197,94,.2);color:#4ade80;border-color:#22c55e}
.m-toggle.off{background:rgba(239,68,68,.15);color:#f87171;border-color:#ef4444}
.m-sw{display:inline-flex;align-items:center;gap:8px;cursor:pointer;user-select:none}
.m-sw input{position:absolute;opacity:0;width:0;height:0}
.m-sw i{width:44px;height:24px;background:#334155;border-radius:12px;position:relative;transition:.2s;border:1px solid #475569;flex-shrink:0}
.m-sw input:checked+i{background:#16a34a;border-color:#22c55e}
.m-sw i::after{content:'';position:absolute;top:2px;left:2px;width:18px;height:18px;background:#fff;border-radius:50%;transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.35)}
.m-sw input:checked+i::after{left:22px}
.m-sw span{font-size:11px;font-weight:800;color:#94a3b8;min-width:52px}
.m-sw input:checked~span{color:#4ade80}
.m-share{display:flex;gap:4px;flex-wrap:wrap}
.m-share .m-btn{padding:4px 8px;font-size:11px}
@media print{.mis-side,.mis-bar,.noprint{display:none!important}.mis-main{margin-left:0!important;width:100%!important}body,.mis-content{background:#fff!important;color:#000!important}.m-card{background:#fff;border:1px solid #ccc;color:#000}.m-card h3,.m-card h4,.m-row b{color:#000!important}}
`

export const MIS_LAYOUT_CSS = `
body{background:#0b1220;color:#e2e8f0}
.mis-shell{display:flex;min-height:100vh;background:#0b1220}
.mis-side{position:fixed;top:0;left:0;bottom:0;width:230px;background:#0e1730;border-right:1px solid #22304f;display:flex;flex-direction:column;overflow-y:auto;z-index:40}
.mis-main{margin-left:230px;flex:1;min-height:100vh;display:flex;flex-direction:column;width:calc(100% - 230px)}
.mis-bar{background:#111a30;border-bottom:1px solid #22304f;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;gap:12px}
.mis-bar b{color:#fff;font-size:16px}
.mis-bar .co{color:#94a3b8;font-size:12px}
.mis-side .brand{padding:18px 16px;text-align:center;border-bottom:1px solid #22304f}
.mis-side .brand img{height:54px}
.mis-side .brand b{display:block;color:#fff;font-size:14px;margin-top:8px}
.mis-side .brand small{color:#c9a84c;font-size:11px}
.mis-side .menu{padding:8px;flex:1}
.mis-side .mi{display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:9px;color:#cbd5e1;text-decoration:none;font-size:14px;font-weight:600;white-space:nowrap}
.mis-side .mi:hover{background:#16223f}
.mis-side .mi.active{background:#c9a84c;color:#14224f}
.mis-side .mi .ic{width:20px;text-align:center}
.mis-side .mi .mis-menu-badge{margin-left:auto;min-width:52px;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:800;line-height:1.2;white-space:nowrap;text-align:center;border:1px solid rgba(255,255,255,.15);box-shadow:0 4px 10px rgba(0,0,0,.2)}
.mis-side .mi .mis-menu-badge b{display:block;color:#fff;font-size:12px;font-weight:900}
.mis-side .mi .mis-menu-badge.ok{background:linear-gradient(135deg,#15803d,#22c55e)}
.mis-side .mi .mis-menu-badge.warn{background:linear-gradient(135deg,#b45309,#f59e0b)}
.mis-side .mi .mis-menu-badge.bad{background:linear-gradient(135deg,#b91c1c,#ef4444)}
.mis-sub-badge.m-kpi{display:inline-block;min-width:140px;width:140px;box-sizing:border-box;vertical-align:bottom}
.mis-sub-badge.m-kpi b{color:#fff!important;font-size:28px}
.mis-sub-badge.m-kpi span{color:rgba(255,255,255,.88)!important;font-size:12px}
.mis-sub-badge.m-kpi.ok{background:linear-gradient(135deg,#15803d,#22c55e)!important;border-color:rgba(255,255,255,.12)}
.mis-sub-badge.m-kpi.warn{background:linear-gradient(135deg,#b45309,#f59e0b)!important;border-color:rgba(255,255,255,.12)}
.mis-sub-badge.m-kpi.bad{background:linear-gradient(135deg,#b91c1c,#ef4444)!important;border-color:rgba(255,255,255,.12)}
.mis-side .logout{padding:12px 16px;border-top:1px solid #22304f;color:#94a3b8;cursor:pointer;font-size:13px}
.mis-content{flex:1;overflow:auto}
.mis-shell .top{display:none!important}
.mis-burger{display:none;background:#c9a84c;color:#14224f;border:none;border-radius:8px;padding:8px 12px;font-weight:800;cursor:pointer}
.mis-loading{padding:28px;text-align:center;color:#94a3b8;font-size:15px}
@media(max-width:820px){
  .mis-side{transform:translateX(-100%);transition:.2s;width:220px}
  .mis-side.open{transform:none}
  .mis-main{margin-left:0;width:100%}
  .mis-burger{display:inline-block}
}
`

export function misSidebarHtml(active: string): string {
  const items = MIS_MENU.map(([label, icon, path]) => {
    const menuBadge =
      path === '/mis-submission'
        ? '<span class="mis-menu-badge" id="misMenuSubBadge" title="Branches submitted today"></span>'
        : ''
    return `<a class="mi${path === active ? ' active' : ''}" href="${path}"><span class="ic">${icon}</span><span style="flex:1;min-width:0">${label}</span>${menuBadge}</a>`
  }).join('')
  return `<aside class="mis-side" id="misSide"><div class="brand"><img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile"><b>Agile Security Force</b><small>MIS Dashboard</small></div><nav class="menu">${items}</nav><div class="logout" onclick="misLogout()">⎋ Logout</div></aside>`
}

export function misPageWrap(active: string, title: string, inner: string, actions = ''): string {
  const barActions = actions
      ? `<div class="m-actions noprint" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${actions}</div>`
      : ''
  return `<div class="mis-shell">${misSidebarHtml(active)}<div class="mis-main"><div class="mis-bar"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><button type="button" class="mis-burger" onclick="document.getElementById('misSide').classList.toggle('open')">☰ Menu</button><div><b>${title}</b><div class="co">Agile Security Force Private Limited</div></div></div>${barActions}</div><div class="mis-content">${inner}${misPrintFooterBlock()}</div></div></div>`
}

export const MIS_SESSION_JS = `
${SUITE_MONEY_JS}
function misTodayIst(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});}
function misSubBadgeClass(submitted,total){
  if(!total)return 'warn';
  if(submitted>=total)return 'ok';
  if(submitted>0)return 'warn';
  return 'bad';
}
function misPaintSubBadge(el,submitted,total){
  if(!el)return;
  if(!total){el.innerHTML='';return;}
  var cls=misSubBadgeClass(submitted,total);
  var isMenu=el.id==='misMenuSubBadge';
  if(isMenu){
    el.className='mis-menu-badge '+cls;
    el.innerHTML='<b>'+submitted+'/'+total+'</b>';
  }else{
    el.className='mis-sub-badge m-kpi '+cls;
    el.innerHTML='<b>'+submitted+'/'+total+'</b><span>MIS Submission</span>';
  }
  el.title='MIS Submission — '+submitted+' of '+total+' branches submitted';
}
function misSubBadgeDate(){
  var dateEl=document.getElementById('date')||document.getElementById('dateFor');
  return dateEl&&dateEl.value?dateEl.value:misTodayIst();
}
function misInitSubBadges(){
  document.querySelectorAll('button.m-btn-gold,button.m-btn.g').forEach(function(btn){
    if(btn.textContent.replace(/\\s+/g,' ').trim()!=='Show')return;
    if(btn.parentElement&&btn.parentElement.querySelector('.mis-sub-badge'))return;
    var wrap=document.createElement('span');
    wrap.className='mis-sub-badge m-kpi warn';
    wrap.id='misSubBadge';
    wrap.title='MIS Submission';
    wrap.innerHTML='<b>…</b><span>MIS Submission</span>';
    btn.insertAdjacentElement('afterend',wrap);
  });
}
function misRefreshSubBadge(){
  var date=misSubBadgeDate();
  fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'submission',date:date})})
    .then(function(r){return r.json();})
    .then(function(d){
      if(!d||!d.total)return;
      misPaintSubBadge(document.getElementById('misMenuSubBadge'),d.submitted,d.total);
      misPaintSubBadge(document.getElementById('misSubBadge'),d.submitted,d.total);
    })
    .catch(function(){});
}
function misLogout(){
  sessionStorage.removeItem('otp_mis');
  sessionStorage.removeItem('otp_email_mis');
  sessionStorage.removeItem('otp_mis-report');
  sessionStorage.removeItem('otp_email_mis-report');
  fetch('/api/mis/login',{method:'DELETE',credentials:'same-origin'}).finally(function(){location.href='/mis?fresh=1';});
}
function misStart(){
  misInitSubBadges();
  setTimeout(misRefreshSubBadge,3000);
  var dateEl=document.getElementById('date')||document.getElementById('dateFor');
  if(dateEl&&!dateEl._misSubBadge){
    dateEl._misSubBadge=true;
    dateEl.addEventListener('change',misRefreshSubBadge);
  }
  if(!window._misSubBadgeClick){
    window._misSubBadgeClick=true;
    document.addEventListener('click',function(ev){
      var t=ev.target;
      if(t&&t.tagName==='BUTTON'&&String(t.textContent||'').replace(/\\s+/g,' ').trim()==='Show'){
        setTimeout(misRefreshSubBadge,600);
      }
    },true);
  }
  if(!window._misSubBadgeTimer){
    window._misSubBadgeTimer=setInterval(misRefreshSubBadge,180000);
  }
  if(typeof initPage==='function'){initPage();return;}
  if(typeof load==='function'){load();return;}
}
`

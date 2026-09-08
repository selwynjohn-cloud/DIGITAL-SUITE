/**
 * Suite page chrome — sticky header with AGILE · App · Menu · who opened.
 */

import { SUITE_APP_FOOTER_CSS } from './suite-app-footer.js'
import { SUITE_STABLE_UI_CSS, suiteStableContentInitScript } from './suite-stable-ui.js'

function esc(s: string): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export const SUITE_PAGE_CHROME_CSS = `
${SUITE_APP_FOOTER_CSS}
${SUITE_STABLE_UI_CSS}
.suite-page-head{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.suite-brand-line{display:flex;align-items:center;gap:8px;flex-wrap:wrap;line-height:1.2}
.suite-brand{color:#fde68a;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
.suite-app-name{color:#c9a84c;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;line-height:1.2}
.suite-menu-name,.suite-page-head #ttl,.suite-page-head #pageTitle,.suite-page-head b.suite-menu-name,.suite-page-head h1.suite-menu-name{color:#fff;font-size:16px;font-weight:800;line-height:1.25;margin:0}
.suite-page-head h1.suite-menu-name{font-size:18px}
.suite-page-head .sub{color:#94a3b8;font-size:12px;margin-top:2px;line-height:1.35}
.suite-page-head .co{color:#94a3b8;font-size:12px;margin-top:2px}
.suite-opened-by,.suite-page-head #suiteOpenedBy,#userLine.suite-opened-by,#roleLbl.suite-opened-by{color:#93c5fd;font-size:12px;font-weight:700;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:min(420px,46vw)}
.suite-page-head #suiteOpenedBy{color:#86efac;font-weight:700;margin-top:2px;white-space:normal}
/* Freeze header while the page scrolls (no blur — blur flickers on Safari) */
.bar,.mis-bar,.staff-bar,.top.suite-sticky-top{
  position:sticky;top:0;z-index:45;
  box-shadow:0 10px 24px rgba(0,0,0,.28);
  background-color:#111a30;
}
@media print{
  .bar,.mis-bar,.staff-bar,.top.suite-sticky-top{position:static!important;box-shadow:none!important}
}
`

export type SuitePageHeadOpts = {
  ttlId?: string
  menuTag?: 'b' | 'h1'
  subId?: string
  subText?: string
  coText?: string
  /** Hide the Opened by line (rare). */
  hideOpenedBy?: boolean
  openedBy?: string
  /** First line is only the app name (e.g. Agile MIS) — no AGILE brand chip. */
  hideAgileBrand?: boolean
}

/** Top-bar block: AGILE · App · Menu · Opened by. */
export function suitePageHeadHtml(
  appName: string,
  menuName: string,
  opts: SuitePageHeadOpts = {},
): string {
  const ttlId = opts.ttlId || 'ttl'
  const tag = opts.menuTag || 'b'
  const sub = opts.subId
    ? `<div class="sub" id="${opts.subId}">${esc(opts.subText || '')}</div>`
    : ''
  const co = opts.coText ? `<div class="co">${esc(opts.coText)}</div>` : ''
  const opened = opts.hideOpenedBy
    ? ''
    : `<div class="suite-opened-by" id="suiteOpenedBy">${esc(
        opts.openedBy ? `Opened by: ${opts.openedBy}` : 'Opened by: —',
      )}</div>`
  const brandLine = opts.hideAgileBrand
    ? `<div class="suite-brand-line"><span class="suite-app-name" id="suiteAppName">${esc(appName)}</span></div>`
    : `<div class="suite-brand-line"><span class="suite-brand">AGILE</span><span class="suite-app-name" id="suiteAppName">${esc(appName)}</span></div>`
  return `<div class="suite-page-head">${brandLine}<${tag} id="${ttlId}" class="suite-menu-name">${esc(menuName)}</${tag}>${sub}${co}${opened}</div>`
}

/** Client helper: menu title + opened-by + sticky-friendly document title. */
export function suitePageTitleInitScript(appName: string): string {
  return `
window.SUITE_APP_NAME=${JSON.stringify(appName)};
window.suiteSetMenuTitle=function(menu){
  var m=String(menu==null?'':menu).trim();
  var app=window.SUITE_APP_NAME||'';
  var el=document.getElementById('ttl')||document.getElementById('pageTitle');
  if(el)el.textContent=m;
  var appEl=document.getElementById('suiteAppName');
  if(appEl&&app)appEl.textContent=app;
  try{document.title=(app&&m)?('AGILE · '+app+' · '+m):(app||m||document.title);}catch(e){}
};
window.suiteSetOpenedBy=function(who){
  var raw=String(who==null?'':who).trim().replace(/^Opened by:\\s*/i,'');
  if(!raw){
    try{if(typeof OTP_EMAIL!=='undefined'&&OTP_EMAIL)raw=String(OTP_EMAIL).trim();}catch(e){}
  }
  if(!raw)return;
  var label='Opened by: '+raw;
  var el=document.getElementById('suiteOpenedBy');
  if(el&&el.textContent!==label)el.textContent=label;
  var ul=document.getElementById('userLine')||document.getElementById('roleLbl');
  if(ul){
    ul.classList.add('suite-opened-by');
    if(ul.textContent!==label)ul.textContent=label;
  }
};
window.suiteSyncOpenedBy=function(){
  var who='';
  try{if(typeof OTP_EMAIL!=='undefined'&&OTP_EMAIL)who=String(OTP_EMAIL).trim();}catch(e){}
  if(!who){
    try{
      var ul=document.getElementById('userLine');
      if(ul&&ul.textContent)who=String(ul.textContent).trim();
    }catch(e){}
  }
  if(who)window.suiteSetOpenedBy(who);
};
(function(){
  try{
    var bootEl=document.getElementById('ttl')||document.getElementById('pageTitle');
    var bootMenu=bootEl?String(bootEl.textContent||'').trim():'';
    if(bootMenu)document.title='AGILE · '+${JSON.stringify(appName)}+' · '+bootMenu;
    else document.title='AGILE · '+${JSON.stringify(appName)};
  }catch(e){}
  function paint(){try{window.suiteSyncOpenedBy();}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',paint);
  else paint();
  setTimeout(paint,500);
  try{
    var ul=document.getElementById('userLine')||document.getElementById('roleLbl');
    if(ul&&typeof MutationObserver!=='undefined'){
      var _suiteObBusy=false;
      new MutationObserver(function(){
        if(_suiteObBusy)return;
        var t=String(ul.textContent||'').trim();
        if(!t||/^Opened by:/i.test(t))return;
        _suiteObBusy=true;
        try{window.suiteSetOpenedBy(t);}finally{_suiteObBusy=false;}
      }).observe(ul,{childList:true,characterData:true,subtree:false});
    }
  }catch(e){}
})();
${suiteStableContentInitScript()}
`
}

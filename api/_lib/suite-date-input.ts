/**
 * Agile Digital Suite — date fields must use calendar pickers (type="date"), not typed text.
 */

export const SUITE_DATE_INPUT_CSS = `
input[type="date"], input[type="month"], input[type="datetime-local"] {
  min-height: 44px;
  cursor: pointer;
  color-scheme: dark;
}
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="month"]::-webkit-calendar-picker-indicator,
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.85;
}
#suite-date-modal {
  position: fixed; inset: 0; z-index: 99999;
  background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; padding: 16px;
}
#suite-date-modal .suite-date-box {
  background: #111a30; border: 1px solid #334155; border-radius: 14px; padding: 20px; max-width: 320px; width: 100%;
  box-shadow: 0 12px 40px rgba(0,0,0,0.45);
}
#suite-date-modal label { display: block; color: #e2e8f0; font-weight: 700; margin-bottom: 10px; font-size: 14px; }
#suite-date-modal input[type="date"] { width: 100%; margin-bottom: 14px; }
#suite-date-modal .suite-date-actions { display: flex; gap: 10px; justify-content: flex-end; }
#suite-date-modal button { padding: 10px 16px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
#suite-date-modal .suite-date-ok { background: #16a34a; color: #fff; }
#suite-date-modal .suite-date-cancel { background: #334155; color: #e2e8f0; }
`.trim()

/** Inject CSS + suitePickDate modal helper (server-rendered suite apps). */
export function suiteDateInputInitScript(): string {
  const css = SUITE_DATE_INPUT_CSS.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
  return `
(function suiteDateInputInit(){
  if(window.__SUITE_DATE_INP__) return;
  window.__SUITE_DATE_INP__=true;
  if(!document.getElementById('suite-date-input-css')){
    var st=document.createElement('style');
    st.id='suite-date-input-css';
    st.textContent=\`${css}\`;
    document.head.appendChild(st);
  }
  window.suiteDateToIso=function(v){
    if(!v)return '';
    var s=String(v).trim();
    if(/^\\d{4}-\\d{2}-\\d{2}$/.test(s))return s;
    var m=s.match(/^(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{2,4})$/);
    if(m){var y=m[3].length===2?('20'+m[3]):m[3];return y+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[1]).padStart(2,'0');}
    var d=new Date(s);
    if(!isNaN(d.getTime()))return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    return '';
  };
  window.suiteDateFromIso=function(iso,fmt){
    if(!iso)return '';
    fmt=fmt||'dmy';
    var p=String(iso).slice(0,10).split('-');
    if(p.length!==3)return iso;
    if(fmt==='dmy')return String(+p[2]).padStart(2,'0')+'/'+String(+p[1]).padStart(2,'0')+'/'+p[0];
    if(fmt==='dmy-dash')return String(+p[2]).padStart(2,'0')+'-'+String(+p[1]).padStart(2,'0')+'-'+p[0];
    return iso;
  };
  window.fmtDate=function(v){
    if(!v)return '—';
    var iso=window.suiteDateToIso(v)||String(v).slice(0,10);
    if(!iso||iso.length<8)return '—';
    return window.suiteDateFromIso(iso,'dmy')||'—';
  };
  window.suitePickDate=function(label,defaultVal,cb){
    var old=document.getElementById('suite-date-modal');
    if(old)old.remove();
    var wrap=document.createElement('div');
    wrap.id='suite-date-modal';
    wrap.innerHTML='<div class="suite-date-box"><label>'+String(label||'Pick a date').replace(/</g,'&lt;')+'</label><input type="date" id="suiteDatePickVal"><div class="suite-date-actions"><button type="button" class="suite-date-cancel">Cancel</button><button type="button" class="suite-date-ok">OK</button></div></div>';
    document.body.appendChild(wrap);
    var inp=document.getElementById('suiteDatePickVal');
    inp.value=window.suiteDateToIso(defaultVal)||defaultVal||'';
    function close(v){wrap.remove();if(typeof cb==='function')cb(v);}
    wrap.querySelector('.suite-date-cancel').onclick=function(){close(null);};
    wrap.querySelector('.suite-date-ok').onclick=function(){close(inp.value||null);};
    wrap.addEventListener('click',function(e){if(e.target===wrap)close(null);});
    inp.focus();
  };
  function applyDatePickers(root){
    (root||document).querySelectorAll('input[data-suite-date]').forEach(function(inp){
      if(inp.type!=='date'&&inp.type!=='month'&&inp.type!=='datetime-local')inp.type='date';
    });
  }
  applyDatePickers(document);
  if(typeof MutationObserver!=='undefined'){
    new MutationObserver(function(muts){
      muts.forEach(function(m){if(m.addedNodes&&m.addedNodes.length)m.addedNodes.forEach(function(n){if(n.nodeType===1)applyDatePickers(n);});});
    }).observe(document.body||document.documentElement,{childList:true,subtree:true});
  }
})();
`.trim()
}

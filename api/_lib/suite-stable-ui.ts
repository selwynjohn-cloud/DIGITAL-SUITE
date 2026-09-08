/**
 * Suite-wide paint stability — stop page/menu flicker and keep previews steady.
 * Included from page chrome, OTP shells, and suite gates.
 */

export const SUITE_STABLE_UI_CSS = `
/* Prefer calm motion — no looping page animations */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}

html, body {
  background-color: #0b1220;
  background-attachment: fixed;
}

/* Sticky bars: blur causes Safari/macOS scroll flicker — solid bar instead */
.bar, .mis-bar, .staff-bar, .top.suite-sticky-top, .hdr, .rv-sidebar {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  transform: translateZ(0);
  will-change: auto;
}

/* Content panels keep height while menus swap — no white collapse flash */
#content, #rv-content, .staff-content, .mis-content, .main-content, main.suite-main, .fleet-content, .crm-content {
  min-height: 55vh;
  contain: layout style;
  background: transparent;
}

/* Soft swap only (no blanking) */
.suite-content-stable {
  opacity: 1;
  transition: opacity 0.12s ease;
}
.suite-content-stable.is-swapping {
  opacity: 0.96;
}

/* Print / preview must stay static */
@media print {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
  .bar, .mis-bar, .staff-bar, .top.suite-sticky-top { position: static !important; box-shadow: none !important; }
}
`.trim()

/** Soft content swap helper for SPA-style portals (optional use). */
export function suiteStableContentInitScript(): string {
  return `
(function suiteStableContentInit(){
  if(window.__SUITE_STABLE_UI__) return;
  window.__SUITE_STABLE_UI__=true;
  if(!document.getElementById('suite-stable-ui-css')){
    var st=document.createElement('style');
    st.id='suite-stable-ui-css';
    st.textContent=${JSON.stringify(SUITE_STABLE_UI_CSS)};
    document.head.appendChild(st);
  }
  window.suiteSetHtml=function(el,html){
    if(!el)return;
    el.classList.add('suite-content-stable');
    el.classList.add('is-swapping');
    el.innerHTML=html;
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ el.classList.remove('is-swapping'); });
    });
  };
})();
`.trim()
}

/**
 * Agile Digital Suite — universal button click feedback.
 * Every click: button presses in, then springs back (like a real button).
 * Save/send actions: separate Saving… / Sending… label.
 */

export const SUITE_TAP_FEEDBACK_CSS = `
@keyframes suite-tap-press {
  0% { filter: brightness(1); box-shadow: none; }
  40% { filter: brightness(0.9); box-shadow: inset 0 4px 10px rgba(0, 0, 0, 0.22); }
  100% { filter: brightness(1); box-shadow: none; }
}
.suite-tap-press {
  animation: suite-tap-press 0.3s ease-out !important;
}
button, .btn, .app-tap-btn, .m-btn, input[type="submit"], input[type="button"] {
  transition: filter 0.1s ease, box-shadow 0.1s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  position: relative;
  z-index: 1;
}
/* No transform on :active — Safari/iOS drops the tap when the button moves under the finger. */
button:active:not(:disabled), .btn:active:not(:disabled), .app-tap-btn:active:not(:disabled), .m-btn:active:not(:disabled), input[type="submit"]:active:not(:disabled), input[type="button"]:active:not(:disabled) {
  filter: brightness(0.9);
  box-shadow: inset 0 3px 8px rgba(0, 0, 0, 0.18);
}
button:disabled, .btn:disabled, .m-btn:disabled { opacity: 0.72; cursor: wait; }
.suite-tap-working { opacity: 0.88; cursor: wait !important; }
`.trim()

/** Inject CSS + click press + working-state helper (server-rendered suite apps). */
export function suiteTapFeedbackInitScript(): string {
  const css = SUITE_TAP_FEEDBACK_CSS.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
  return `
(function suiteTapFeedbackInit(){
  if(window.__SUITE_TAP_FB__) return;
  window.__SUITE_TAP_FB__=true;
  if(!document.getElementById('suite-tap-feedback-css')){
    var st=document.createElement('style');
    st.id='suite-tap-feedback-css';
    st.textContent=\`${css}\`;
    document.head.appendChild(st);
  }
  window.suiteTapFeedback=function(el){
    if(!el||el.disabled||el.classList.contains('suite-tap-no-feedback')) return;
    el.classList.remove('suite-tap-press');
    void el.offsetWidth;
    el.classList.add('suite-tap-press');
    setTimeout(function(){ el.classList.remove('suite-tap-press'); }, 320);
  };
  window.suiteBtnWorking=function(btn,label){
    if(!btn) return function(){};
    var orig=btn.textContent;
    btn.disabled=true;
    btn.textContent=label||'Working…';
    btn.classList.add('suite-tap-working');
    return function restore(){
      btn.disabled=false;
      btn.textContent=orig;
      btn.classList.remove('suite-tap-working');
    };
  };
  document.addEventListener('click',function(ev){
    var t=ev.target;
    if(!t||!t.closest) return;
    var btn=t.closest('button,.btn,.app-tap-btn,.m-btn,input[type="submit"],input[type="button"]');
    if(!btn||btn.disabled||btn.classList.contains('suite-tap-no-feedback')) return;
    window.suiteTapFeedback(btn);
  },{capture:true,passive:true});
})();
`.trim()
}

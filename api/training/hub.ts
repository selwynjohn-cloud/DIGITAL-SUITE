import type { VercelRequest, VercelResponse } from '@vercel/node'
import { suiteAppOpenPageFooterHtml } from '../_lib/suite-app-footer.js'
import { trainingTargetUrl } from '../_lib/suite-gate-config.js'
import {
  TRAINING_TRACK1_SHORT,
  TRAINING_TRACK1_TITLE,
  TRAINING_TRACK2_SHORT,
  TRAINING_TRACK2_TITLE_MAIN,
  TRAINING_TRACK2_TITLE_SUB,
} from '../_lib/training/track-labels.js'
import { trainingPageHtml } from '../_lib/training/training-shell.js'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const digitalUrl = trainingTargetUrl('lecturer')

  const body = `
<style>
.track-hero{margin-bottom:4px;text-align:center}
.track-hero h1{
  font-size:1.7rem;letter-spacing:-.02em;margin:0;color:#fff;
  text-shadow:0 2px 12px rgba(0,0,0,.35);
}
.track-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;margin-top:18px}
.track-card{
  position:relative;display:flex;flex-direction:column;min-height:280px;padding:24px 22px;border-radius:18px;
  text-decoration:none;color:inherit;overflow:hidden;
  border:1px solid rgba(255,255,255,.12);
  box-shadow:0 16px 40px rgba(0,0,0,.35);
  transition:transform .18s ease,box-shadow .18s ease;
}
.track-card:hover{transform:translateY(-4px);box-shadow:0 22px 48px rgba(0,0,0,.45)}
.track-card::before{content:'';position:absolute;inset:0;opacity:.9;pointer-events:none}
.track-card.t1::before{background:linear-gradient(155deg,#14532d 0%,#0f766e 45%,#164e63 100%)}
.track-card.t2::before{background:linear-gradient(155deg,#1e3a8a 0%,#6d28d9 48%,#9a3412 100%)}
.track-card > *{position:relative;z-index:1}
.track-card .eyebrow{
  display:inline-block;padding:4px 10px;border-radius:999px;font-size:.7rem;font-weight:900;
  letter-spacing:.1em;text-transform:uppercase;background:rgba(0,0,0,.28);color:#fde68a;margin-bottom:12px;
  border:1px solid rgba(253,230,138,.35);
}
.track-card h2{font-size:1.35rem;color:#fff;margin-bottom:12px;line-height:1.25;text-shadow:0 2px 10px rgba(0,0,0,.35)}
.track-card h2 .sub{display:block;margin-top:6px;font-size:1.05rem;font-weight:800;color:#fde68a}
.track-card p{font-size:.95rem;color:rgba(255,255,255,.9);line-height:1.55;flex:1}
.track-card .cta{
  margin-top:18px;display:inline-flex;align-items:center;justify-content:center;
  padding:12px 16px;border-radius:12px;font-weight:900;font-size:.92rem;
  background:linear-gradient(135deg,#fde68a,#c9a84c);color:#14224f;
  box-shadow:0 8px 20px rgba(0,0,0,.25);
}
</style>
<div class="panel">
  <div class="track-hero">
    <h1>Choose your Training Track</h1>
  </div>
  <div class="track-grid">
    <a class="track-card t1 app-tap-btn" href="/training/ojt">
      <div class="eyebrow">${TRAINING_TRACK1_SHORT}</div>
      <h2>${TRAINING_TRACK1_TITLE}</h2>
      <p>Hands-on, location-specific training focused on mastering facility SOPs, emergency response, and post-duty execution tailored to client requirements.</p>
      <span class="cta">Open ${TRAINING_TRACK1_TITLE}</span>
    </a>
    <a class="track-card t2 app-tap-btn" href="${digitalUrl}" id="hubDigital">
      <div class="eyebrow">${TRAINING_TRACK2_SHORT}</div>
      <h2>${TRAINING_TRACK2_TITLE_MAIN}<span class="sub">${TRAINING_TRACK2_TITLE_SUB}</span></h2>
      <p>Accredited online coursework delivered in partnership with our Academy and RRU, covering foundational security theory, compliance, and legal standards.</p>
      <span class="cta">Open ${TRAINING_TRACK2_TITLE_MAIN}</span>
    </a>
  </div>
</div>
`
  const script = `
(function(){
  /** Do not call trainingRequireLogin() again — boot already did; a second pass used to bounce HODs out. */
  var a=window.__TRAINING_AUTH__||trainingReadAuth();
  if(!a||!a.token) return;
  var link=document.getElementById('hubDigital');
  if(link){
    link.addEventListener('click',function(e){
      e.preventDefault();
      fetch('/api/training/ojt-data',{method:'POST',headers:trainingAuthHeaders(),body:JSON.stringify({action:'lmsUrl'})})
        .then(function(r){return r.json();})
        .then(function(j){ location.href=j.url||link.href; })
        .catch(function(){ location.href=link.href; });
    });
  }
})();
`
  const html = trainingPageHtml({
    title: 'Agile Training — Choose your Training Track',
    body,
    script,
    activeNav: 'hub',
    /** Keep Track 1 / Track 2 nav visible — cards alone were easy to miss after login. */
    hideNav: false,
    footerHtml: suiteAppOpenPageFooterHtml(),
  })
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(html)
}

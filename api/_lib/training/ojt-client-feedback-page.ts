/** Public client feedback page after OJT completion — question + options + Submit only. */

import { suiteTapFeedbackInitScript } from '../suite-tap-feedback.js'
import { OJT_CLIENT_BENEFIT_OPTIONS, normalizeBenefitRating } from './ojt-client-feedback-store.js'

export function ojtClientFeedbackPageHtml(token: string, preselectRating = ''): string {
  const t = JSON.stringify(String(token || '').trim())
  const pre = JSON.stringify(normalizeBenefitRating(preselectRating) || '')
  const tap = suiteTapFeedbackInitScript()
  const options = OJT_CLIENT_BENEFIT_OPTIONS.map(
    (opt) => `
      <label class="opt">
        <input type="radio" name="benefit" value="${opt.replace(/"/g, '&quot;')}"/>
        <span>☐ ${opt}</span>
      </label>`,
  ).join('')
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Please share your feedback</title>
<style>
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:520px;margin:0 auto;padding:28px 16px 40px}
.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px}
h1{font-size:1.15rem;margin:0 0 14px;color:#fde68a;font-weight:900}
.q{font-size:1.02rem;font-weight:800;color:#fff;margin:0 0 16px;line-height:1.45}
.opts{display:grid;gap:10px}
.opt{display:flex;align-items:center;gap:12px;padding:14px;border-radius:12px;border:1px solid #475569;background:#0b1220;cursor:pointer;font-weight:700;color:#e2e8f0;min-height:48px}
.opt:has(input:checked),.opt.on{border-color:#c9a84c;background:#1a2744;box-shadow:inset 0 0 0 1px rgba(201,168,76,.45)}
.opt input{width:20px;height:20px;accent-color:#c9a84c;flex:0 0 auto}
.btn{display:block;width:100%;margin:18px 0 0;padding:14px 16px;border-radius:12px;border:0;font-weight:800;cursor:pointer;font:inherit;background:linear-gradient(135deg,#fde68a,#c9a84c);color:#14224f;min-height:52px}
.btn:active{transform:scale(.98)}
.btn:disabled{opacity:.6;cursor:wait}
.msg{margin-top:12px;padding:10px;border-radius:8px;display:none;font-size:.9rem}
.msg.ok{display:block;background:#0a2e1a;color:#4ade80}
.msg.err{display:block;background:#3a0a0a;color:#ef4444}
.hidden{display:none!important}
.thanks{text-align:center;padding:28px 12px;color:#bbf7d0;font-weight:800;font-size:1.1rem;line-height:1.5}
.ask{margin-top:18px;padding:16px;border-radius:12px;border:1px solid #c9a84c;background:#0b1220;text-align:center}
.ask p{margin:0 0 12px;font-weight:800;color:#fde68a;font-size:1.02rem}
.ask-btns{display:flex;gap:10px}
.ask-btns .btn{margin:0}
.btn-no{background:#334155;color:#e2e8f0}
.load{color:#94a3b8;text-align:center;margin-top:20px}
</style>
</head>
<body>
<div class="wrap">
  <div id="loadMsg" class="load">Loading…</div>
  <div id="main" class="hidden">
    <div class="card" id="formCard">
      <h1>Please share your feedback</h1>
      <p class="q">Overall, how was the OJT beneficial to our security operations?</p>
      <div class="opts">${options}</div>
      <button type="button" class="btn app-tap-btn" id="btnSubmit">Submit</button>
      <div id="msg" class="msg"></div>
    </div>
    <div class="card hidden" id="thanksCard">
      <p class="thanks" id="thanksText">Thank you for your valuable feedback.</p>
      <div class="ask hidden" id="googleAsk">
        <p>Want to give Google review</p>
        <div class="ask-btns">
          <button type="button" class="btn app-tap-btn" id="btnGoogleYes">Yes</button>
          <button type="button" class="btn btn-no app-tap-btn" id="btnGoogleNo">No</button>
        </div>
      </div>
    </div>
  </div>
</div>
<script>
${tap}
(function(){
  var TOKEN=${t};
  var PRE=${pre};
  var API='/api/training/client-feedback-data';
  function $(id){ return document.getElementById(id); }
  function showMsg(text, ok){
    var el=$('msg');
    if(!el) return;
    el.textContent=text||'';
    el.className='msg '+(ok?'ok':'err');
  }
  function post(action, extra){
    var body=Object.assign({action:action, token:TOKEN}, extra||{});
    return fetch(API,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    }).then(function(r){ return r.json().then(function(j){ return {s:r.status,j:j}; }); });
  }
  function selectRating(val){
    document.querySelectorAll('input[name="benefit"]').forEach(function(inp){
      inp.checked = String(inp.value)===String(val);
      if(inp.parentElement) inp.parentElement.classList.toggle('on', inp.checked);
    });
  }
  function showGoogleAsk(url){
    var box=$('googleAsk');
    if(!box||!url) return;
    box.classList.remove('hidden');
    var yes=$('btnGoogleYes');
    var no=$('btnGoogleNo');
    if(yes) yes.onclick=function(){
      try{ window.open(url,'_blank','noopener'); }catch(e){ location.href=url; }
    };
    if(no) no.onclick=function(){ box.classList.add('hidden'); };
  }
  function submitRating(rating){
    var btn=$('btnSubmit');
    if(btn) btn.disabled=true;
    showMsg('Saving…', true);
    return post('submit',{ rating:rating }).then(function(res){
      if(btn) btn.disabled=false;
      if(res.s!==200||!res.j.ok){
        showMsg((res.j&&res.j.error)||'Could not save feedback.', false);
        return false;
      }
      $('formCard').classList.add('hidden');
      $('thanksCard').classList.remove('hidden');
      $('thanksText').textContent='Thank you for your valuable feedback. You selected: '+rating+'.';
      if(res.j.askGoogleReview && res.j.googleReviewUrl) showGoogleAsk(res.j.googleReviewUrl);
      return true;
    }).catch(function(){
      if(btn) btn.disabled=false;
      showMsg('Could not save feedback. Please try again.', false);
      return false;
    });
  }
  if(!TOKEN){
    $('loadMsg').textContent='This feedback link is not valid.';
    return;
  }
  post('load').then(function(res){
    if(res.s!==200||!res.j.ok){
      $('loadMsg').textContent=(res.j&&res.j.error)||'This feedback link is not valid.';
      return;
    }
    $('loadMsg').classList.add('hidden');
    $('main').classList.remove('hidden');
    if(res.j.lastReply && res.j.lastReply.rating){
      $('formCard').classList.add('hidden');
      $('thanksCard').classList.remove('hidden');
      $('thanksText').textContent='Thank you. You selected: '+res.j.lastReply.rating+'.';
      if(res.j.lastReply.rating==='Highly Beneficial' && res.j.googleReviewUrl) showGoogleAsk(res.j.googleReviewUrl);
      return;
    }
    if(PRE){
      selectRating(PRE);
      submitRating(PRE);
      return;
    }
  }).catch(function(){
    $('loadMsg').textContent='Could not load. Please try again.';
  });
  document.querySelectorAll('input[name="benefit"]').forEach(function(inp){
    inp.addEventListener('change', function(){ selectRating(inp.value); });
  });
  document.querySelectorAll('.opt').forEach(function(lab){
    lab.addEventListener('click', function(){
      var inp=lab.querySelector('input');
      if(inp){ inp.checked=true; selectRating(inp.value); }
    });
  });
  $('btnSubmit').onclick=function(){
    var picked=document.querySelector('input[name="benefit"]:checked');
    if(!picked||!picked.value){ showMsg('Please select one option.', false); return; }
    submitRating(picked.value);
  };
})();
</script>
</body>
</html>`
}

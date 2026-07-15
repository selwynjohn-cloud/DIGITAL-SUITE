import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from '../_lib/mis/layout.js'

const MIS_ACTIVE = '/mis-bpi'
const MIS_TITLE = 'Branch Performance'
const ACTIONS = `<button class="m-btn m-btn-grey" onclick="window.print()">⬇ Download PDF</button><button class="m-btn m-btn-navy" onclick="shareMail()">✉ Share by Email</button>`

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Branch Performance Index</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
.bpiC{display:flex;align-items:flex-end;gap:8px;height:240px;padding:12px 8px 8px;overflow-x:auto}
.bpiC .b{flex:0 0 62px;min-width:62px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;cursor:pointer;position:relative}
.bpiC .b:hover .bar{filter:brightness(1.12);box-shadow:0 0 0 2px #c9a84c}
.bpiC .bpi-score{font-size:12px;font-weight:800;color:#f8fafc;margin-bottom:4px}
.bpiC .bar{width:100%;min-height:4px;border-radius:6px 6px 0 0;transition:filter .12s,box-shadow .12s}
.bpiC .bl{font-size:10px;font-weight:700;color:#e2e8f0;margin-top:8px;text-align:center;line-height:1.3;max-width:58px;min-height:36px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;word-break:break-word}
.bpi-tip{position:fixed;background:#14224f;border:2px solid #c9a84c;color:#fde68a;padding:12px 16px;border-radius:12px;font-size:15px;font-weight:800;pointer-events:none;z-index:60;box-shadow:0 10px 28px rgba(0,0,0,.55);max-width:300px;line-height:1.4;transform:translate(-50%,calc(-100% - 14px))}
.bpi-tip.hidden{display:none}
.bpi-tip small{display:block;color:#cbd5e1;font-size:12px;font-weight:600;margin-top:6px;line-height:1.45}
#app .mtblwrap{border:2px solid #64748b;border-radius:10px}
#app .mtbl th,#app .mtbl td{border:1px solid #64748b!important}
#app .mtbl tbody tr:hover td{background:rgba(201,168,76,.1)!important}
#app .mtbl td.branch-name{font-weight:800;color:#f8fafc;white-space:nowrap}
.mtbl td.l,.mtbl th.l{text-align:left}
${MIS_LAYOUT_CSS}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="m-wrap" id="app">
  <div class="m-card" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
    <div><label class="m-lbl">Date</label><input class="m-inp" id="date" type="date"></div>
    <button class="m-btn m-btn-gold" onclick="load()">Show</button>
    <div class="hint" style="margin:0">BPI = Deployment 40% + Compliance 30% + Client 20% + Admin 10% · <span class="sc-good">≥80 Good</span> · <span class="sc-fair">60–79 Fair</span> · <span class="sc-poor">&lt;60 Poor</span> · <b style="color:#f87171">Not submitted by 4 PM = zero score</b> (reduces monthly average). Move cursor over a bar for full branch name.</div>
  </div>
  <div class="m-card"><h4>Branch Performance Index — All Branches</h4><p class="hint" style="margin-top:0">Hover on any coloured bar to pop up the full branch name and score.</p><div class="bpiC" id="chart"></div></div>
  <div class="m-card"><h4>Detailed Scores</h4>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th class="c">Rank</th><th class="l">Branch</th><th class="c">Deploy (40%)</th><th class="c">Compliance (30%)</th><th class="c">Client (20%)</th><th class="c">Admin (10%)</th><th class="c">BPI Score</th></tr></thead><tbody id="rows"></tbody></table></div>
  </div>
</div>
<div id="bpiTip" class="bpi-tip hidden"></div>
`, ACTIONS)}
<script>
${MIS_SESSION_JS}

function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function api(action,extra){return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
(function(){el('date').value=new Date().toISOString().slice(0,10);})();
function load(){api('bpi',{date:el('date').value}).then(function(res){if(res.status===200)render(res.body);});}
function col(v){return v>=80?'#4ade80':(v>=60?'#fbbf24':'#f87171');}
function cls(v){return v>=80?'sc-bg-good':(v>=60?'sc-bg-fair':'sc-bg-poor');}
function branchLabel(b){return b.displayName||b.branch||'';}
function branchShort(label){
  if(!label)return '';
  if(label.length<=16)return label;
  var p=label.indexOf('(');
  if(p>0)return label.slice(0,p).trim();
  return label.slice(0,14)+'…';
}
function showBpiTip(node,e){
  var tip=el('bpiTip');if(!tip||!node)return;
  var name=node.getAttribute('data-name')||'';
  var bpi=node.getAttribute('data-bpi')||'';
  var dep=node.getAttribute('data-dep')||'';
  var comp=node.getAttribute('data-comp')||'';
  var client=node.getAttribute('data-client')||'';
  var admin=node.getAttribute('data-admin')||'';
  var sub=node.getAttribute('data-sub')==='1';
  tip.innerHTML='<div>'+h(name)+'</div><small>'+(node.getAttribute('data-zero')==='1'?'<span style="color:#f87171">Zero performance — '+h(node.getAttribute('data-zero-reason')||'Not submitted')+'</span><br>':'')+'BPI <b style="color:#fde68a">'+bpi+'</b> · Deploy '+dep+' · Compliance '+comp+' · Client '+client+' · Admin '+admin+(sub?'':' · <span style="color:#f87171">MIS not submitted</span>')+'</small>';
  tip.classList.remove('hidden');
  moveBpiTip(e||window.event);
}
function moveBpiTip(e){
  var tip=el('bpiTip');if(!tip||tip.classList.contains('hidden'))return;
  tip.style.left=e.clientX+'px';
  tip.style.top=e.clientY+'px';
}
function hideBpiTip(){var tip=el('bpiTip');if(tip)tip.classList.add('hidden');}
function wireBpiTips(root,selector){
  if(!root)return;
  root.querySelectorAll(selector).forEach(function(node){
    node.addEventListener('mouseenter',function(e){showBpiTip(node,e);});
    node.addEventListener('mousemove',moveBpiTip);
    node.addEventListener('mouseleave',hideBpiTip);
  });
}
function render(d){
  var s=d.scores||[];
  el('chart').innerHTML=s.map(function(b){
    var label=branchLabel(b);
    var short=branchShort(label);
    return '<div class="b" data-name="'+h(label)+'" data-bpi="'+b.bpi+'" data-dep="'+b.deployment+'" data-comp="'+b.compliance+'" data-client="'+b.client+'" data-admin="'+b.admin+'" data-sub="'+(b.submitted?1:0)+'" data-zero="'+(b.performanceZero?1:0)+'" data-zero-reason="'+h(b.zeroReason||'')+'" title="'+h(label)+'">'+
      '<div class="bpi-score" style="'+(b.performanceZero?'color:#f87171':'')+'">'+(b.performanceZero?'0':b.bpi)+'</div>'+
      '<div class="bar" style="height:'+(b.performanceZero?3:Math.max(b.bpi,3))+'%;background:'+(b.performanceZero?'#ef4444':col(b.bpi))+'"></div>'+
      '<div class="bl">'+h(short)+'</div></div>';
  }).join('')||'<div class="hint">No data.</div>';
  el('rows').innerHTML=s.map(function(b,i){
    var label=branchLabel(b);
    return '<tr data-name="'+h(label)+'" data-bpi="'+b.bpi+'" data-dep="'+b.deployment+'" data-comp="'+b.compliance+'" data-client="'+b.client+'" data-admin="'+b.admin+'" data-sub="'+(b.submitted?1:0)+'" data-zero="'+(b.performanceZero?1:0)+'" data-zero-reason="'+h(b.zeroReason||'')+'" title="'+h(label)+'">'+
      '<td class="c">'+(i===0?'🥇 #1':'#'+(i+1))+'</td>'+
      '<td class="l branch-name">'+h(label)+'</td>'+
      '<td class="c">'+(b.performanceZero?'—':b.deployment)+'</td><td class="c">'+(b.performanceZero?'—':b.compliance)+'</td><td class="c">'+(b.performanceZero?'—':b.client)+'</td><td class="c">'+(b.performanceZero?'—':b.admin)+'</td>'+
      '<td class="c">'+(b.performanceZero?'<span class="sc-bg-poor">0</span>':'<span class="'+cls(b.bpi)+'">'+b.bpi+'</span>')+'</td></tr>';
  }).join('');
  wireBpiTips(el('chart'),'.b');
  wireBpiTips(el('rows'),'tr');
}
function shareMail(){var to=prompt('Share BPI report to (email):','director@agilegroup.co.in');if(!to)return;api('sendConsolidatedMail',{date:el('date').value,to:to}).then(function(res){alert(res.status===200?'Email sent ✓':(res.body.error||'Could not send'));});}
misStart();
</script>
</body></html>`

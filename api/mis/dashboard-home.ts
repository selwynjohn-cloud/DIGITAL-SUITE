import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from '../_lib/mis/layout.js'

const MIS_ACTIVE = '/mis-dashboard'
const MIS_TITLE = 'Dashboard'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Dashboard</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#070d18;color:#e2e8f0;font-size:15px}
${MIS_THEME_CSS}
${MIS_LAYOUT_CSS}
.dash-hero{background:linear-gradient(135deg,#14224f 0%,#1e40af 55%,#0f172a 100%);border-radius:16px;padding:22px 24px;margin-bottom:18px;border:1px solid rgba(201,168,76,.35);box-shadow:0 12px 40px rgba(0,0,0,.35)}
.dash-hero h1{font-size:22px;color:#fde68a;font-weight:900}.dash-hero .sub{color:#cbd5e1;font-size:13px;margin-top:6px}
.dash-date{display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;margin-bottom:16px}
.sec{margin-bottom:18px}
.sec-h{font-size:14px;font-weight:900;color:#c9a84c;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;display:flex;align-items:center;gap:8px}
.sec-h::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,#334155,transparent)}
.kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:12px}
.kcard{border-radius:14px;padding:16px 14px;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.08);box-shadow:0 8px 24px rgba(0,0,0,.25)}
.kcard::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.kcard .v{font-size:28px;font-weight:900;line-height:1.1}.kcard .l{font-size:11px;font-weight:700;margin-top:4px;opacity:.92}.kcard .s{font-size:10px;margin-top:3px;opacity:.72}
.kcard.bl{background:linear-gradient(145deg,#1e3a8a,#1d4ed8)}.kcard.bl::before{background:#60a5fa}
.kcard.gr{background:linear-gradient(145deg,#14532d,#16a34a)}.kcard.gr::before{background:#4ade80}
.kcard.rd{background:linear-gradient(145deg,#7f1d1d,#dc2626)}.kcard.rd::before{background:#f87171}
.kcard.am{background:linear-gradient(145deg,#78350f,#d97706)}.kcard.am::before{background:#fbbf24}
.kcard.pu{background:linear-gradient(145deg,#4c1d95,#7c3aed)}.kcard.pu::before{background:#a78bfa}
.kcard.gd{background:linear-gradient(145deg,#3f2f0f,#92700c)}.kcard.gd::before{background:#c9a84c}
.two{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:900px){.two{grid-template-columns:1fr}}
.chart-card{background:#0e1730;border:1px solid #22304f;border-radius:14px;padding:18px}
.chart-card h3{color:#fff;font-size:15px;margin-bottom:12px}
.pie{width:200px;height:200px;border-radius:50%;margin:0 auto 14px;position:relative;box-shadow:0 0 0 6px rgba(201,168,76,.15)}
.pie-interactive{width:200px;height:200px;margin:0 auto 14px;position:relative}
.pie-interactive svg{display:block;width:200px;height:200px}
.pie-interactive .pie-hole{position:absolute;inset:28%;background:#0e1730;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;pointer-events:none}
.pie-tip{position:absolute;background:#14224f;border:1px solid #c9a84c;color:#fde68a;padding:8px 12px;border-radius:8px;font-size:13px;font-weight:800;pointer-events:none;z-index:10;white-space:nowrap;box-shadow:0 6px 16px rgba(0,0,0,.45);transform:translate(-50%,-100%)}
.pie-tip.hidden{display:none}
.pie-slice{cursor:pointer;transition:opacity .12s}
.pie-slice:hover{opacity:.82}
.pie-hole{position:absolute;inset:28%;background:#0e1730;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center}
.pie-hole b{font-size:22px;color:#fde68a}.pie-hole span{font-size:10px;color:#94a3b8}
.leg{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;font-size:12px}
.leg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:middle}
.cmp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}@media(max-width:700px){.cmp-grid{grid-template-columns:1fr}}
.cmp-box{background:#0b1220;border:1px solid #22304f;border-radius:12px;padding:14px;text-align:center}
.cmp-box .tier{font-size:12px;font-weight:800;color:#c9a84c;margin-bottom:8px}
.cmp-box .nums{font-size:24px;font-weight:900}.cmp-box .lbl{font-size:11px;color:#94a3b8;margin-top:4px}
.sla-list{margin-top:8px}
.sla-row{display:flex;justify-content:space-between;padding:8px 12px;border:1px solid #22304f;border-radius:8px;margin-bottom:6px;background:#0b1220;font-size:13px}
table.dtbl{border-collapse:collapse;width:100%;font-size:12px}table.dtbl th,table.dtbl td{border:1px solid #22304f;padding:7px}table.dtbl th{background:#0b1220;color:#94a3b8;font-size:10px;text-transform:uppercase}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="m-wrap" id="app">
  <div class="dash-hero">
    <h1>📊 Agile MIS — Operations Dashboard</h1>
    <div class="sub" id="hint">Consolidated deployment, compliance, visits, collections &amp; complaints</div>
    <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
      <a href="/mis-admin" class="m-btn m-btn-gold" style="font-size:15px;padding:12px 18px">🗄 Open Master Directory</a>
      <a href="/mis-users" class="m-btn m-btn-navy" style="font-size:15px;padding:12px 18px">👥 User Management</a>
    </div>
  </div>
  <div class="dash-date m-card noprint" style="padding:14px">
    <label class="m-lbl">View</label>
    <select class="m-inp" id="period" style="margin-right:10px" onchange="togglePeriod()">
      <option value="day">Single day</option>
      <option value="week">This week</option>
      <option value="month">Pick month</option>
    </select>
    <label class="m-lbl">Date</label>
    <input class="m-inp" id="date" type="date" style="margin-right:10px">
    <span id="monthWrap" style="display:none">
      <label class="m-lbl">Month</label>
      <input class="m-inp" id="month" type="month" style="margin-right:10px">
    </span>
    <button class="m-btn m-btn-gold" onclick="load()">Show</button>
    <span id="loadMsg" style="font-size:13px;color:#94a3b8;margin-left:10px"></span>
  </div>

  <div class="sec"><div class="sec-h">Deployment</div><div class="kgrid" id="kDeploy"></div></div>
  <div class="sec"><div class="sec-h">Operations &amp; Compliance</div><div class="kgrid" id="kOps"></div></div>
  <div class="sec"><div class="sec-h">Collections &amp; Duty Start</div><div class="kgrid" id="kColl"></div></div>
  <div class="sec"><div class="sec-h">Receivables &amp; DSO</div><div class="kgrid" id="kRecv"></div></div>

  <div class="two">
    <div class="chart-card">
      <h3>Duty Start — Pie Chart</h3>
      <div class="pie" id="pieDuty"><div class="pie-hole"><b id="pieTimely">—</b><span>Timely Start</span></div></div>
      <div class="leg" id="legDuty"></div>
    </div>
    <div class="chart-card">
      <h3>Deployment Breakdown</h3>
      <div class="pie-interactive" id="pieDepWrap">
        <svg id="pieDepSvg" viewBox="0 0 200 200" aria-label="Deployment breakdown"></svg>
        <div class="pie-hole"><b id="pieDepPct">—</b><span>Deployed</span></div>
        <div id="pieDepTip" class="pie-tip hidden"></div>
      </div>
      <div class="leg" id="legDep"></div>
    </div>
  </div>

  <div class="sec" style="margin-top:18px"><div class="sec-h">Complaint Analysis — by Client Category</div>
    <div class="cmp-grid" id="kCompl"></div>
  </div>

  <div class="two" style="margin-top:18px">
    <div class="chart-card">
      <h3>Pending SLA Equipment Issues</h3>
      <div id="slaPending" class="sla-list"></div>
      <p style="font-size:11px;color:#64748b;margin-top:8px"><a href="/mis-unit-issue" style="color:#c9a84c">Open full SLA analysis →</a></p>
    </div>
    <div class="chart-card">
      <h3>Client Categories</h3>
      <div class="kgrid" id="kTiers" style="margin-top:8px"></div>
    </div>
  </div>

  <div class="m-card" style="margin-top:18px">
    <h3 style="color:#fff;margin-bottom:10px">Branch Overview</h3>
    <div style="overflow-x:auto"><table class="dtbl"><thead><tr><th>Branch</th><th>MIS</th><th>Sanctioned</th><th>Deployed</th><th>OT</th><th>Vacant</th><th>Deploy %</th><th>Collection %</th></tr></thead><tbody id="branches"></tbody></table></div>
  </div>
  <div class="m-card">
    <h3 style="color:#fff;margin-bottom:10px">Vacant Posts <span style="color:#ef4444;font-size:12px">(worst first)</span></h3>
    <div style="overflow-x:auto"><table class="dtbl"><thead><tr><th>#</th><th>Client</th><th>Branches</th><th>Vacant</th><th>Fill %</th></tr></thead><tbody id="vac"></tbody></table></div>
  </div>
</div>
`)}
<script>
${MIS_SESSION_JS}
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function api(action,extra){return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
(function(){el('date').value=misTodayIst();el('month').value=el('date').value.slice(0,7);})();
function togglePeriod(){el('monthWrap').style.display=el('period').value==='month'?'inline':'none';}
function periodBody(){var p=el('period').value;var body={date:el('date').value,period:p};if(p==='month')body.month=el('month').value||el('date').value.slice(0,7);return body;}
function load(){el('loadMsg').textContent='Loading dashboard… please wait';api('mdsummary',periodBody()).then(function(res){el('loadMsg').textContent='';if(res.status===200)render(res.body);else el('loadMsg').textContent=res.body.error||'Could not load — try Single day view';});}
function pct(a,b){return b>0?Math.round(a*100/b):0;}
function kc(cls,v,l,s){return '<div class="kcard '+cls+'"><div class="v">'+v+'</div><div class="l">'+l+'</div>'+(s?'<div class="s">'+s+'</div>':'')+'</div>';}

function donutArc(cx,cy,r,ir,startDeg,endDeg){
  if(endDeg-startDeg>=359.99)return '';
  var s1=startDeg*Math.PI/180,s2=endDeg*Math.PI/180;
  var x1=cx+r*Math.sin(s1),y1=cy-r*Math.cos(s1),x2=cx+r*Math.sin(s2),y2=cy-r*Math.cos(s2);
  var x3=cx+ir*Math.sin(s2),y3=cy-ir*Math.cos(s2),x4=cx+ir*Math.sin(s1),y4=cy-ir*Math.cos(s1);
  var lg=(endDeg-startDeg)>180?1:0;
  return 'M '+x1+' '+y1+' A '+r+' '+r+' 0 '+lg+' 1 '+x2+' '+y2+' L '+x3+' '+y3+' A '+ir+' '+ir+' 0 '+lg+' 0 '+x4+' '+y4+' Z';
}

function drawDepPie(dep,ot,vac,depPct){
  var svg=el('pieDepSvg'),tip=el('pieDepTip'),wrap=el('pieDepWrap');
  var total=(dep||0)+(ot||0)+(vac||0)||1;
  var slices=[
    {label:'Deployed',val:dep||0,color:'#22c55e'},
    {label:'OT',val:ot||0,color:'#a855f7'},
    {label:'Vacant',val:vac||0,color:'#ef4444'}
  ];
  var cx=100,cy=100,r=90,ir=52,angle=0,html='';
  slices.forEach(function(s){
    if(s.val<=0)return;
    var sweep=s.val/total*360;
    if(sweep<0.05)return;
    var start=angle;angle+=sweep;
    var p=Math.round(s.val*100/total);
    html+='<path class="pie-slice" fill="'+s.color+'" d="'+donutArc(cx,cy,r,ir,start,angle)+'" data-label="'+s.label+'" data-val="'+s.val+'" data-pct="'+p+'"><title>'+s.label+': '+s.val+' ('+p+'%)</title></path>';
  });
  if(!html)html='<circle cx="100" cy="100" r="90" fill="#334155"/>';
  svg.innerHTML=html;
  el('pieDepPct').textContent=depPct+'%';
  el('legDep').innerHTML=slices.map(function(s){
    var p=Math.round(s.val*100/total);
    return '<span><i style="background:'+s.color+'"></i>'+s.label+' <b>'+s.val+'</b> ('+p+'%)</span>';
  }).join('');
  svg.querySelectorAll('.pie-slice').forEach(function(path){
    path.addEventListener('mouseenter',function(){
      tip.textContent=path.getAttribute('data-label')+': '+path.getAttribute('data-val')+' ('+path.getAttribute('data-pct')+'%)';
      tip.classList.remove('hidden');
    });
    path.addEventListener('mousemove',function(e){
      var rc=wrap.getBoundingClientRect();
      tip.style.left=(e.clientX-rc.left)+'px';
      tip.style.top=(e.clientY-rc.top)+'px';
    });
    path.addEventListener('mouseleave',function(){tip.classList.add('hidden');});
  });
}

function render(d){
  var label=d.periodLabel||d.date;
  el('hint').textContent=label+' · '+d.submitted+'/'+d.branchCount+' branches reported'+(d.period&&d.period!=='day'?' (latest snapshot + period totals)':'');
  if(typeof misPaintSubBadge==='function'){
    misPaintSubBadge(el('misSubBadge'),d.submitted,d.branchCount);
    misPaintSubBadge(el('misMenuSubBadge'),d.submitted,d.branchCount);
  }
  var t=d.totals,ct=d.complianceTotals,strength=ct.strength||t.san||0;
  var depPct=pct(t.dep,t.san);
  var ov=d.opsVisits||{};
  var ds=d.dutyStart||{timelyPct:0,latePct:0,outOfPostPct:0,lateCases:0,outOfPostCases:0};
  var col=d.collection||{};
  var colPct=col.pct||pct(col.collected||0,col.budget||0);
  var overallPct=col.overallPct||0;
  var dso90=col.dsoOver90Receivable||0;
  var dso90br=col.dsoOver90Branches||0;

  el('kDeploy').innerHTML=
    kc('bl',t.san,'Sanctioned Posts','All branches')+
    kc('gr',t.dep,'Deployed',depPct+'% deployment')+
    kc('pu',t.ot,'OT','Overtime posts')+
    kc('rd',t.vac,'Vacant','Absent − OT')+
    kc('am',t.resignation||0,'Resignation','Reported by branches')+
    kc('pu',t.recruitment||0,'Recruitment','Open / in progress');

  el('kOps').innerHTML=
    kc('pu',ov.total||0,'Operations Visits',(ov.pct||0)+'% of '+((ov.sites||0))+' sites')+
    kc('bl',ov.nightChecks||0,'Night Checks','Visit type N')+
    kc('gd',ov.trainedSites||0,'Trained Sites','Visit type T')+
    kc('gr',pct(ct.pvc,strength)+'%','PVC Compliance',ct.pvc+' / '+strength)+
    kc('am',pct(ct.medical,strength)+'%','Medical Fitness',ct.medical+' / '+strength)+
    kc('bl',pct(ct.training,strength)+'%','Training Certificate',ct.training+' / '+strength);

  el('kColl').innerHTML=
    kc('gd',colPct+'%','Weekly Collection %','₹'+(col.collected||0).toFixed(1)+'L / ₹'+(col.budget||0).toFixed(1)+'L budget')+
    kc('gr',ds.timelyPct+'%','Timely Start Duty','On time')+
    kc('am',ds.latePct+'%','Late Start Duty',ds.lateCases+' / '+t.san+' posts')+
    kc('rd',ds.outOfPostPct+'%','Out of Post Cases',ds.outOfPostCases+' / '+t.san+' posts');

  el('kRecv').innerHTML=
    kc('gr',overallPct+'%','Overall Collection %','₹'+(col.collected||0).toFixed(1)+'L received / ₹'+(col.outstanding||0).toFixed(1)+'L outstanding')+
    kc('am','₹'+dso90.toFixed(1)+'L','DSO &gt;90 Days Receivable',dso90br+' branch'+(dso90br===1?'':'es'))+
    kc('bl','₹'+(col.outstanding||0).toFixed(1)+'L','Total Outstanding','All branches')+
    kc('pu',(col.avgDso!=null?col.avgDso:'—'),'Average DSO (days)','Target ≤30 days');

  var p1=ds.timelyPct,p2=ds.latePct,p3=ds.outOfPostPct;
  el('pieDuty').style.background='conic-gradient(#22c55e 0 '+p1+'%,#f59e0b '+p1+'% '+(p1+p2)+'%,#ef4444 '+(p1+p2)+'% 100%)';
  el('pieTimely').textContent=ds.timelyPct+'%';
  el('legDuty').innerHTML='<span><i style="background:#22c55e"></i>Timely '+p1+'%</span><span><i style="background:#f59e0b"></i>Late '+p2+'%</span><span><i style="background:#ef4444"></i>Out of Post '+p3+'%</span>';

  drawDepPie(t.dep,t.ot,t.vac,depPct);

  var cb=d.complaintsByTier||{};
  function cmpBox(tier,cls,data){
    data=data||{received:0,solved:0};
    return '<div class="cmp-box"><div class="tier">'+tier+'</div><div class="nums" style="color:'+cls+'">'+data.solved+' / '+data.received+'</div><div class="lbl">Solved / Received</div></div>';
  }
  el('kCompl').innerHTML=
    cmpBox('Strategic Client','#fde68a',cb.strategic)+
    cmpBox('High Value Client','#a78bfa',cb.highValue)+
    cmpBox('Valued Client','#94a3b8',cb.valued);

  var tiers=d.clientTiers||d.starClients||{};
  el('kTiers').innerHTML=
    kc('gd',tiers.strategic||0,'Strategic Client','5 ★')+
    kc('pu',tiers.highValue||0,'High Value Client','3–4 ★')+
    kc('bl',tiers.valued||tiers.normal||0,'Valued Client','1–2 ★');

  var sp=d.slaPending||{};
  var slaHtml=(sp.branches||[]).map(function(b){
    return '<div class="sla-row"><span>'+h(b.branch)+'</span><span><b style="color:#f87171">'+b.pending+'</b> pending · <b style="color:#fbbf24">'+b.repeated+'</b> repeated</span></div>';
  }).join('');
  el('slaPending').innerHTML=slaHtml||'<p style="color:#94a3b8">Use <a href="/mis-unit-issue" style="color:#c9a84c">SLA analysis page</a> for equipment pending details.</p>';

  el('branches').innerHTML=(d.deployment||[]).map(function(x){
    var tag=x.submitted?'<span class="sc-bg-good">✓</span>':'<span class="sc-bg-poor">✗</span>';
    var dp=x.submitted?pct(x.dep,x.san):0;
    return '<tr><td>'+h(x.branch)+'</td><td>'+tag+'</td><td>'+(x.san||0)+'</td><td>'+(x.dep||0)+'</td><td>'+(x.ot||0)+'</td><td style="color:#f87171;font-weight:800">'+(x.vac||0)+'</td><td>'+(x.submitted?dp+'%':'—')+'</td><td>'+(x.collectionPct||'—')+(x.collectionPct?'%':'')+'</td></tr>';
  }).join('')||'<tr><td colspan="8" style="color:#94a3b8">No data</td></tr>';

  el('vac').innerHTML=(d.vacantGrouped||[]).slice(0,12).map(function(v,i){
    return '<tr><td>'+(i+1)+'</td><td>'+h(v.client)+'</td><td>'+h(v.branches)+'</td><td style="color:#f87171;font-weight:800">'+v.vac+'</td><td>'+v.fill+'%</td></tr>';
  }).join('')||'<tr><td colspan="5" style="color:#94a3b8">No vacant posts</td></tr>';
}
misStart();
</script>
</body></html>`

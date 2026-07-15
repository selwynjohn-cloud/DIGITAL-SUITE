import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from '../_lib/mis/layout.js'
import { misFooterText } from '../_lib/mis/brand.js'
import { CLIENT_PERF_DASHBOARD_CSS } from '../_lib/mis/client-perf-ui.js'
import { CLIENT_PERF_MONEY_JS } from '../_lib/mis/client-perf-money.js'
import { CLIENT_PERF_BILLING_BAR_JS } from '../_lib/mis/client-perf-billing-bar.js'

const MIS_ACTIVE = '/mis-client'
const MIS_TITLE = 'Client Performance'
const SHARE_FOOTER_JS = JSON.stringify(misFooterText())
const ACTIONS = `<button class="m-btn m-btn-grey" onclick="downloadReport()">⬇ Download Report (PDF)</button><button class="m-btn m-btn-navy" onclick="shareMail()">✉ Send to Client (Mail)</button><button class="m-btn m-btn-green" onclick="shareWhatsApp()">💬 Send to Client (WhatsApp)</button>`

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Client Performance</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
.range-btns{display:flex;gap:8px;flex-wrap:wrap}
${CLIENT_PERF_DASHBOARD_CSS}
${MIS_LAYOUT_CSS}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="m-wrap" id="app">
  <div class="m-card noprint">
    <div class="hint" style="margin-bottom:12px">Colourful report — <b>Deployment pie</b> (no. of days) and <b>₹ coin stacks</b> (Monthly bill vs Balance to be paid).</div>
    <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
      <div style="flex:1;min-width:220px"><label class="m-lbl">Client</label><select class="m-inp" id="client" style="width:100%"></select></div>
      <div><label class="m-lbl">From</label><input class="m-inp" id="from" type="date"></div>
      <div><label class="m-lbl">To</label><input class="m-inp" id="to" type="date"></div>
      <button class="m-btn m-btn-gold" onclick="run()">Generate</button>
    </div>
    <div class="range-btns" style="margin-top:12px">
      <button type="button" class="m-btn m-btn-navy" onclick="setThisWeek()">This week</button>
      <button type="button" class="m-btn m-btn-navy" onclick="setThisMonth()">This month</button>
      <button type="button" class="m-btn m-btn-navy" onclick="setLastMonth()">Last month</button>
    </div>
  </div>
  <div id="report"></div>
</div>
`, ACTIONS)}
<script>
var __SHARE_FOOTER__=${SHARE_FOOTER_JS};
${CLIENT_PERF_MONEY_JS}
${CLIENT_PERF_BILLING_BAR_JS}
${MIS_SESSION_JS}
var LAST_REPORT=null;
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function api(action,extra){
  var ctrl=new AbortController();
  var timer=setTimeout(function(){ctrl.abort();},45000);
  return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},signal:ctrl.signal,body:JSON.stringify(Object.assign({action:action},extra||{}))})
    .then(function(r){clearTimeout(timer);return r.json().then(function(j){return{status:r.status,body:j};});})
    .catch(function(err){
      clearTimeout(timer);
      if(err&&err.name==='AbortError')return{status:0,body:{error:'Report took too long — please try This month or a shorter date range.'}};
      return{status:0,body:{error:'Could not reach server. Please refresh the page and try again.'}};
    });
}
function run(){
  var m=el('report'),btn=document.querySelector('button.m-btn-gold');
  if(!el('client').value){m.innerHTML='<div class="m-card">Please pick a client first.</div>';return;}
  m.innerHTML='<div class="m-card">Generating report…</div>';
  if(btn){btn.disabled=true;btn.textContent='Please wait…';}
  LAST_REPORT=null;
  api('clientPerf',{clientName:el('client').value,from:el('from').value,to:el('to').value}).then(function(res){
    if(btn){btn.disabled=false;btn.textContent='Generate';}
    if(res.status!==200){m.innerHTML='<div class="m-card">'+(res.body.error||'Error')+'</div>';return;}
    try{render(res.body);}catch(e){m.innerHTML='<div class="m-card">Report loaded but screen could not draw it. Please refresh and try again.</div>';}
  });
}
function iso(d){return d.toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});}
function mondayOf(d){var x=new Date(d);var day=x.getDay();var diff=day===0?-6:1-day;x.setDate(x.getDate()+diff);return x;}
function setThisWeek(){var t=new Date();var m=mondayOf(t);el('from').value=iso(m);el('to').value=iso(t);}
function setThisMonth(){var t=new Date();el('from').value=iso(new Date(t.getFullYear(),t.getMonth(),1));el('to').value=iso(t);}
function setLastMonth(){var t=new Date();var first=new Date(t.getFullYear(),t.getMonth()-1,1);var last=new Date(t.getFullYear(),t.getMonth(),0);el('from').value=iso(first);el('to').value=iso(last);}
(function(){setThisMonth();})();
function n(v){return v==null||v===''?'—':v;}
function mwLabel(d){if(d.mwCompliantLabel)return d.mwCompliantLabel;var m=String(d.mwCompliant||'').toLowerCase();if(m==='yes')return'Yes';if(m==='no')return'No';return'—';}
function fmtDate(ymd){
  var m=/^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(String(ymd||''));
  if(!m)return String(ymd||'');
  return m[3]+'-'+m[2]+'-'+m[1];
}
function periodWords(d){
  return fmtDate(d.from)+' to '+fmtDate(d.to);
}
function row(k,v){return '<tr><td class="k">'+h(k)+'</td><td class="v">'+h(v)+'</td></tr>';}

function donutArc(cx,cy,r,ir,startDeg,endDeg){
  if(endDeg-startDeg>=359.99)return '';
  var s1=startDeg*Math.PI/180,s2=endDeg*Math.PI/180;
  var x1=cx+r*Math.sin(s1),y1=cy-r*Math.cos(s1),x2=cx+r*Math.sin(s2),y2=cy-r*Math.cos(s2);
  var x3=cx+ir*Math.sin(s2),y3=cy-ir*Math.cos(s2),x4=cx+ir*Math.sin(s1),y4=cy-ir*Math.cos(s1);
  var lg=(endDeg-startDeg)>180?1:0;
  return 'M '+x1+' '+y1+' A '+r+' '+r+' 0 '+lg+' 1 '+x2+' '+y2+' L '+x3+' '+y3+' A '+ir+' '+ir+' 0 '+lg+' 0 '+x4+' '+y4+' Z';
}
function pie3dDonut(slices,emptyMsg,center,money){
  var active=slices.filter(function(s){return Math.max(0,Number(s.value)||0)>0;});
  var total=active.reduce(function(sum,s){return sum+Math.max(0,Number(s.value)||0);},0);
  if(!total)return '<div style="color:#94a3b8;padding:24px">'+h(emptyMsg)+'</div>';
  var cx=100,cy=82,r=76,ir=42,depth=11,uid=Math.random().toString(36).slice(2,8),angle=0,html='';
  html+='<svg width="200" height="170" viewBox="0 0 200 170"><defs>';
  active.forEach(function(s,idx){html+='<linearGradient id="cpg'+uid+idx+'" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0%" stop-color="'+s.light+'"/><stop offset="100%" stop-color="'+s.dark+'"/></linearGradient>';});
  html+='</defs><ellipse cx="'+cx+'" cy="'+(cy+depth+18)+'" rx="'+(r*0.82)+'" ry="9" fill="rgba(15,23,42,0.14)"/>';
  active.forEach(function(s){
    var val=Math.max(0,Number(s.value)||0),sweep=val/total*360;
    if(sweep<0.05)return;
    var start=angle;angle+=sweep;
    html+='<path d="'+donutArc(cx,cy+depth,r,ir,start,angle)+'" fill="'+s.dark+'" opacity="0.9"/>';
  });
  angle=0;
  active.forEach(function(s,idx){
    var val=Math.max(0,Number(s.value)||0),sweep=val/total*360;
    if(sweep<0.05)return;
    var start=angle;angle+=sweep;
    html+='<path d="'+donutArc(cx,cy,r,ir,start,angle)+'" fill="url(#cpg'+uid+idx+')" stroke="#fff" stroke-width="1.5"/>';
  });
  if(center&&center.value){
    html+='<text x="'+cx+'" y="'+(cy-4)+'" text-anchor="middle" font-size="18" font-weight="800" fill="#fde68a">'+h(center.value)+'</text>';
    if(center.label)html+='<text x="'+cx+'" y="'+(cy+12)+'" text-anchor="middle" font-size="9" fill="#94a3b8">'+h(center.label)+'</text>';
  }
  html+='</svg><div class="chart-legend">';
  active.forEach(function(s){
    var val=Math.max(0,Number(s.value)||0),pct=Math.round(val*100/total);
    var shown=money?fmtInrLacs(val):String(val);
    html+='<span><i class="dot" style="background:linear-gradient(180deg,'+s.light+','+s.dark+')"></i>'+h(s.label)+' <b>'+h(shown)+'</b> ('+pct+'%)</span>';
  });
  return html+'</div>';
}
function depDaysBlock(days,san,dep,vac){
  var s=Math.max(0,Number(san)||0),d=Math.max(0,Number(dep)||0),v=Math.max(0,Number(vac)||0);
  var depPct=s?Math.round(d*100/s):0,vacPct=s?Math.round(v*100/s):0;
  return '<div class="cp-dep-days"><h5>Deployment for '+h(String(days))+' days</h5><table><tr>'+
    '<td class="san"><span class="n">'+s+'</span>Sanctioned Posts</td>'+
    '<td class="dep"><span class="n">'+depPct+'%</span>Deployed strength</td>'+
    '<td class="vac"><span class="n">'+vacPct+'%</span>Vacant posts</td></tr></table></div>';
}
function pie3dDeploy(san,dep,vac,days){
  var s=Math.max(0,Number(san)||0),d=Math.max(0,Number(dep)||0),v=Math.max(0,Number(vac)||0),total=s||d+v;
  if(!total)return '<div style="color:#94a3b8;padding:24px">No deployment data</div>';
  var slices=[{label:'Deployed strength',value:d,light:'#4ade80',dark:'#15803d'},{label:'Vacant posts',value:v,light:'#f87171',dark:'#b91c1c'}];
  var gap=Math.max(0,s-d-v);
  if(gap>0)slices.push({label:'Sanctioned (unfilled)',value:gap,light:'#93c5fd',dark:'#1d4ed8'});
  return pie3dDonut(slices,'No deployment data',{value:String(s||d+v+gap),label:'Sanctioned Posts'})+depDaysBlock(days,s,d,v);
}
function moneyTiles(d){
  return '<div class="cp-money-grid"><div class="cp-money bl"><b>'+h(fmtInrLacs(d.monthlyBillLacs))+'</b><span>Monthly bill</span></div><div class="cp-money am"><b>'+h(fmtInrLacs(d.collectedLacs))+'</b><span>Collected</span></div><div class="cp-money pu"><b>'+h(fmtInrLacs(d.balanceToPayLacs))+'</b><span>Balance to be paid</span></div></div>';
}
function mwBanner(d){
  var raw=String(d.mwCompliant||'').toLowerCase();
  if(raw==='yes')return '<div class="mw-yes">✓ Minimum Wage Compliant — <span style="font-size:17px">YES</span></div>';
  if(raw==='no')return '<div class="mw-no">✗ Minimum Wage Compliant — <span style="font-size:17px">NO</span></div>';
  return '<div class="mw-pend">MW Compliant — not entered yet (branch portal)</div>';
}
function perfText(d){
  var period=periodWords(d);
  return '📊 Unit Performance Report\\n'+d.clientName+'\\nPeriod: '+period+'\\n\\n'+
    'DEPLOYMENT\\nSanctioned: '+d.san+' · Deployed: '+d.dep+' · Vacant: '+d.vac+' · Avg: '+d.avgDeploy+'%\\n\\n'+
    'VISITS & DUTY\\nDay Visits: '+n(d.dayVisits)+' · Night Checks: '+n(d.nightChecks)+' · Training: '+n(d.training)+'\\nLate Start: '+n(d.lateStart)+' · Out of Post: '+n(d.outOfPost)+'\\n\\n'+
    'COMPLIANCE & BILLING\\nMW Compliant: '+mwLabel(d)+'\\nMonthly bill: '+fmtInrLacs(d.monthlyBillLacs)+'\\nCollected: '+fmtInrLacs(d.collectedLacs)+'\\nBalance to be paid: '+fmtInrLacs(d.balanceToPayLacs)+'\\n\\n'+
    '— Agile Security Force Private Limited\\nwww.agilegroup.co.in'+__SHARE_FOOTER__;
}
function shareMail(){
  if(!LAST_REPORT){alert('Please pick a client and press Generate first.');return;}
  var to=prompt('Send colourful report to client email:','');
  if(!to)return;
  api('sendClientPerfMail',Object.assign({to:to},LAST_REPORT)).then(function(res){
    alert(res.status===200?'✅ Colourful report sent by email.':(res.body.error||'Could not send email'));
  });
}
function shareWhatsApp(){
  if(!LAST_REPORT){alert('Please pick a client and press Generate first.');return;}
  window.open('https://wa.me/?text='+encodeURIComponent(perfText(LAST_REPORT)),'_blank','noopener');
}
function downloadReport(){
  if(!LAST_REPORT){alert('Please pick a client and press Generate first.');return;}
  api('clientPerfReportHtml',LAST_REPORT).then(function(res){
    if(res.status!==200){alert(res.body.error||'Could not build report');return;}
    var w=window.open('','_blank','noopener');
    if(!w){alert('Please allow pop-ups to download the report PDF');return;}
    w.document.write(res.body.html);
    w.document.close();
    setTimeout(function(){w.focus();w.print();},400);
  });
}
function render(d){
  LAST_REPORT=d;
  var period=periodWords(d);
  el('report').innerHTML=
    '<div class="m-hdr"><div><b>'+h(d.clientName)+'</b><div class="badges">Unit Performance Report · '+h(period)+'</div></div>'+
    '<div class="m-kpi t" style="min-width:130px"><b>'+h(String(d.avgDeploy))+'%</b><span>Avg Deployment</span></div></div>'+
    '<div class="cp-charts">'+
      '<div class="cp-chart-panel"><h4>'+deployChartTitle(d.daysWithData)+'</h4>'+pie3dDeploy(d.san,d.dep,d.vac,d.daysWithData)+'</div>'+
      '<div class="cp-chart-panel"><h4>'+billingChartTitle()+'</h4>'+billingCoinStacks(d.monthlyBillLacs,d.collectedLacs,d.balanceToPayLacs)+'</div>'+
    '</div>'+
    '<div class="m-card"><div class="sec-h">1. Deployment</div>'+
      '<div class="m-kgrid">'+
        '<div class="m-kpi o"><b>'+h(String(d.san))+'</b><span>Sanctioned</span></div>'+
        '<div class="m-kpi s"><b>'+h(String(d.dep))+'</b><span>Deployed</span></div>'+
        '<div class="m-kpi p"><b>'+h(String(d.vac))+'</b><span>Vacant</span></div>'+
        '<div class="m-kpi t"><b>'+h(String(d.daysWithData))+'</b><span>Days with data</span></div>'+
      '</div></div>'+
    '<div class="m-card"><div class="sec-h">2. Visits &amp; Duty</div>'+
      '<div class="m-kgrid">'+
        '<div class="m-kpi o"><b>'+h(n(d.dayVisits))+'</b><span>Day Visits</span></div>'+
        '<div class="m-kpi t"><b>'+h(n(d.nightChecks))+'</b><span>Night Checks</span></div>'+
        '<div class="m-kpi s"><b>'+h(n(d.training))+'</b><span>Training</span></div>'+
        '<div class="m-kpi p"><b>'+h(n(d.lateStart))+'</b><span>Late Start</span></div>'+
        '<div class="m-kpi p"><b>'+h(n(d.outOfPost))+'</b><span>Out of Post</span></div>'+
      '</div></div>'+
    '<div class="m-card"><div class="sec-h">3. Compliance &amp; Billing</div>'+
      mwBanner(d)+moneyTiles(d)+
      '<p class="hint" style="text-align:center;margin-top:10px">All amounts in ₹ Lakhs (two decimals) · Collected = Monthly bill − Balance · Branch enters MW / Bill / Balance</p></div>';
}
function initPage(){api('clientList').then(function(res){if(res.status!==200)return;el('client').innerHTML=(res.body.clients||[]).map(function(c){return '<option>'+h(c)+'</option>';}).join('');});}
misStart();
</script>
</body></html>`

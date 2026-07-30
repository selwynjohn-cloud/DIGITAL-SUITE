import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from '../_lib/mis/layout.js'

const MIS_ACTIVE = '/mis-register-complaints'
const MIS_TITLE = 'Register Complaints'
const FORM_BASE = 'https://www.agilegroup-digital.co.in/operations-complaints'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Register Complaints</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
${MIS_LAYOUT_CSS}
.share-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-bottom:16px}
.share-card{background:#0e1730;border:1px solid #334155;border-radius:12px;padding:20px;text-align:center}
.share-card h4{color:#fff;font-size:16px;margin-bottom:8px}
.share-card .num{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#c9a84c;color:#14224f;font-weight:800;font-size:14px;margin-bottom:8px}
.share-card p{color:#94a3b8;font-size:13px;line-height:1.5;margin-bottom:12px}
.qr-wrap img{border-radius:10px;background:#fff;padding:8px;margin:8px 0}
.link-box{background:#0b1220;border:1px solid #475569;border-radius:9px;padding:12px;color:#fde68a;font-size:14px;word-break:break-all;margin:10px 0;text-align:left}
.btn-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:10px}
.m-btn{padding:10px 14px;border:none;border-radius:8px;font-weight:800;cursor:pointer;font-size:13px;text-decoration:none;display:inline-block}
.m-btn-gold{background:#c9a84c;color:#14224f}.m-btn-navy{background:#1d4ed8;color:#fff}.m-btn-green{background:#16a34a;color:#fff}.m-btn-grey{background:#334155;color:#e2e8f0}
.copied{font-size:12px;color:#4ade80;margin-top:6px;min-height:18px}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="m-wrap">
  <div class="m-card">
    <div class="hint">Share the <b>Operations Complaints Form</b> with clients — by <b>mail</b> or <b>WhatsApp</b>. Pick your <b>branch</b> first — the QR code and link update for that branch.</div>
    <label class="m-lbl" style="max-width:300px">Branch</label>
    <select class="m-inp" id="branch" style="max-width:360px" onchange="updateBranchShare()"></select>
  </div>

  <div class="share-grid">
    <div class="share-card">
      <div class="num">1</div>
      <h4>QR Code — Share by Mail</h4>
      <p>Attach or paste this QR in an email. The client scans it to open the form for your branch.</p>
      <div class="qr-wrap">
        <img id="qrImg" src="" width="220" height="220" alt="QR code for Operations Complaints Form">
      </div>
      <div class="btn-row">
        <a class="m-btn m-btn-grey" id="qrDownload" href="#" download="agile-operations-complaints-qr.png">⬇ Save QR Image</a>
      </div>
    </div>

    <div class="share-card">
      <div class="num">2</div>
      <h4>Link — Share by Mail / WhatsApp</h4>
      <p>Copy the link below and send it by email or WhatsApp to your client.</p>
      <div class="link-box" id="formLink"></div>
      <div class="btn-row">
        <button type="button" class="m-btn m-btn-gold" onclick="copyLink()">📋 Copy Link</button>
        <a class="m-btn m-btn-navy" id="mailBtn" href="#">✉ Share by Mail</a>
        <a class="m-btn m-btn-green" id="waBtn" href="#" target="_blank" rel="noopener">💬 Share by WhatsApp</a>
      </div>
      <div class="copied" id="copyMsg"></div>
    </div>

    <div class="share-card">
      <div class="num">3</div>
      <h4>Operations Complaints Form</h4>
      <p>Open the public form to test it, or register a complaint on behalf of a client while on the phone.</p>
      <div class="btn-row" style="margin-top:18px">
        <a class="m-btn m-btn-gold" id="openForm" href="#" target="_blank" rel="noopener" style="font-size:15px;padding:12px 20px">📝 Open Operations Complaints Form</a>
      </div>
    </div>
  </div>
</div>
`)}
<script>
${MIS_SESSION_JS}
var BRANCHES=[],FORM_URL='${FORM_BASE}';
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function api(action,extra){return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
function formUrlForBranch(b){
  if(!b||!b.id) return FORM_URL;
  return FORM_URL+'?branchId='+encodeURIComponent(b.id);
}
function updateBranchShare(){
  var bid=el('branch').value;
  var b=BRANCHES.find(function(x){return x.id===bid;})||BRANCHES[0];
  FORM_URL=formUrlForBranch(b);
  var branchName=b?b.name:'';
  el('formLink').textContent=FORM_URL;
  var qr='https://api.qrserver.com/v1/create-qr-code/?size=220x220&data='+encodeURIComponent(FORM_URL)+'&t='+Date.now();
  el('qrImg').src=qr;
  el('qrDownload').href=qr;
  el('openForm').href=FORM_URL;
  var subj=encodeURIComponent('Agile — Operations Complaints Form'+(branchName?' — '+branchName:''));
  var body=encodeURIComponent('Dear Sir/Madam,\\n\\nPlease use the link below to register an operations complaint with Agile Security Force'+(branchName?' ('+branchName+')':'')+'.\\n\\n'+FORM_URL+'\\n\\nYou will receive a Complaint Code and the branch will respond to you.\\n\\n— Agile Security Force');
  el('mailBtn').href='mailto:?subject='+subj+'&body='+body;
  el('waBtn').href='https://wa.me/?text='+encodeURIComponent('Agile Operations Complaints Form'+(branchName?' — '+branchName:'')+' — register here:\\n'+FORM_URL);
}
function copyLink(){
  var msg=el('copyMsg');
  function ok(){msg.textContent='✅ Link copied — paste into mail or WhatsApp.';setTimeout(function(){msg.textContent='';},4000);}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(FORM_URL).then(ok).catch(fallback);
  }else fallback();
  function fallback(){
    var t=document.createElement('textarea');t.value=FORM_URL;document.body.appendChild(t);t.select();
    try{document.execCommand('copy');ok();}catch(e){msg.textContent='Please select and copy the link manually.';}
    document.body.removeChild(t);
  }
}
function initPage(){
  api('login').then(function(res){
    if(res.status!==200)return;
    BRANCHES=(res.body.branches||[]).filter(function(b){return b.active!==false;});
    el('branch').innerHTML=BRANCHES.map(function(b){return '<option value="'+h(b.id)+'">'+h(b.name)+'</option>';}).join('');
    updateBranchShare();
  });
}
misStart();
</script>
</body></html>`

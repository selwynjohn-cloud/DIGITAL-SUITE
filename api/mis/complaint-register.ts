import type { VercelRequest, VercelResponse } from '@vercel/node'
import { registerOperationalComplaint } from '../_lib/mis/complaint-inbox.js'
import { COMPLAINT_NATURES, getBranches, misStorageOk } from '../_lib/mis/store.js'
import { sendComplaintThankYouMail } from '../_lib/mis/complaint-mail.js'
import { BRAND, CURSOR_ATTRIBUTION, JOB_LINKS } from '../_lib/pulse/config.js'

const NATURE_OPTIONS = COMPLAINT_NATURES.map(
  (n) => `<option value="${n.replace(/"/g, '&quot;')}">${n}</option>`,
).join('\n            ')

const FOOTER = `<footer class="agile-ft">
  <div class="ft-copy" style="font-weight:800">Agile Security Force Private Limited</div>
  <div class="ft-copy"><a href="${BRAND.website}">${BRAND.websiteLabel}</a></div>
  <div class="ft-cursor">${CURSOR_ATTRIBUTION}</div>
  <div class="ft-job">💼 <a href="${JOB_LINKS.registerUrl}">${JOB_LINKS.registerLabel}</a></div>
  <div class="ft-copy">© ${new Date().getFullYear()} Agile Security Force Private Limited.</div>
</footer>`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    if (req.query.branches === '1') {
      const branches = await getBranches(true)
      return res.status(200).json({ ok: true, branches: branches.map((b) => ({ id: b.id, name: b.name })) })
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(PAGE)
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!misStorageOk()) return res.status(503).json({ error: 'System temporarily unavailable.' })

  const body = (req.body ?? {}) as Record<string, unknown>
  const result = await registerOperationalComplaint({
    branchId: String(body.branchId ?? ''),
    clientName: String(body.clientName ?? ''),
    location: String(body.location ?? ''),
    type: String(body.type ?? 'Client'),
    nature: String(body.nature ?? ''),
    description: String(body.description ?? ''),
    reportedBy: String(body.reportedBy ?? ''),
    phone: String(body.phone ?? ''),
    email: String(body.email ?? ''),
    channel: String(body.channel ?? 'Web'),
  })

  if (!result.ok) return res.status(400).json({ error: result.error || 'Could not register' })
  const c = result.complaint!
  const branchName = result.branchName || ''

  const notify = await sendComplaintThankYouMail(c, branchName)

  return res.status(200).json({
    ok: true,
    code: c.code,
    registeredAt: c.registeredAt,
    branchId: c.branchId,
    branchName,
    whatsappSent: notify.whatsapp?.reporterSent === true,
    whatsappSkipped: notify.whatsapp?.skipped === true,
    whatsappReason: notify.whatsapp?.reason || (notify.whatsapp?.failed?.[0]?.error ?? ''),
    message: `Thank you. Your complaint ${c.code} has been registered. ${branchName} will respond to you.`,
  })
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile — Operations Complaints Form</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:linear-gradient(160deg,#0b1220,#14224f 55%,#1e3a6e);color:#e2e8f0;min-height:100vh;padding:16px}
.wrap{max-width:520px;margin:0 auto}
.hdr{text-align:center;margin-bottom:18px}
.hdr img{height:56px}
.hdr h1{color:#fff;font-size:22px;margin-top:10px}
.hdr p{color:#94a3b8;font-size:14px;margin-top:6px;line-height:1.5}
.card{background:linear-gradient(180deg,#111a30,#0e1730);border:1px solid #475569;border-radius:14px;padding:22px;box-shadow:0 12px 32px rgba(0,0,0,.35)}
label{display:block;font-size:13px;color:#94a3b8;margin:12px 0 4px;font-weight:700}
input,select,textarea{width:100%;padding:12px;border:1px solid #475569;border-radius:9px;background:#0b1220;color:#fff;font-size:16px}
textarea{min-height:100px;resize:vertical}
.btn{width:100%;padding:14px;border:none;border-radius:10px;font-weight:800;font-size:17px;cursor:pointer;background:linear-gradient(135deg,#b45309,#f59e0b);color:#14224f;margin-top:16px}
.btn:disabled{opacity:.5;cursor:not-allowed}
.agile-ft{text-align:center;margin-top:20px;padding:20px 16px;background:linear-gradient(135deg,#1d4ed8,#1e3a8a);border-radius:14px;border-top:2px solid #c9a84c;box-shadow:0 4px 12px rgba(29,78,216,.3)}
.agile-ft .ft-quote{font-size:13px;color:#fff;font-weight:600;line-height:1.5}
.agile-ft .ft-hi{font-size:11px;color:#dbeafe;margin-top:3px}
.agile-ft .ft-by{font-size:10px;color:#93c5fd;margin-top:2px}
.agile-ft .ft-cursor{margin-top:14px;padding:10px 12px;background:rgba(255,255,255,.08);border-radius:8px;font-size:12px;color:#dbeafe;line-height:1.6;font-style:italic}
.agile-ft .ft-job{margin-top:10px;font-size:13px;color:#eff6ff;font-weight:600}
.agile-ft .ft-job a{color:#fde68a;text-decoration:none;font-weight:800}
.agile-ft .ft-copy{margin-top:6px;font-size:14px;color:#fff;font-weight:700}
.ok{display:none;text-align:center;padding:24px 16px}
.ok .thanks{font-size:24px;font-weight:800;color:#fff;margin-bottom:8px}
.ok .codebox{background:linear-gradient(145deg,#1a1200,#2d2200);border:2px solid #c9a84c;border-radius:12px;padding:18px;margin:18px 0}
.ok .codebox .lbl{font-size:12px;color:#94a3b8;letter-spacing:.5px}
.ok .codebox b{display:block;font-size:30px;color:#fde68a;margin:8px 0;letter-spacing:1px}
.ok .codebox .ts{color:#cbd5e1;font-size:14px}
.ok p{color:#cbd5e1;font-size:15px;margin-top:12px;line-height:1.6}
.ok .respond{color:#4ade80;font-weight:700;font-size:16px;margin-top:14px}
.msg{padding:10px;border-radius:8px;font-size:14px;margin-top:10px;display:none;background:#3a0a0a;color:#f87171}
.hint{font-size:12px;color:#64748b;margin-top:4px}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:480px){.row2{grid-template-columns:1fr}}
</style></head>
<body>
<div class="wrap">
  <div class="hdr">
    <img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile">
    <h1>Operations Complaints Form</h1>
    <p>Want to register a complaint? Fill the form below. You will get a <b>Complaint Code</b> and the branch will <b>respond to you</b>.</p>
  </div>

  <div class="card" id="formCard">
    <form id="f" onsubmit="return submitForm(event)">
      <label>Complaint received at</label>
      <input id="receivedAt" readonly style="color:#fde68a;font-weight:700">

      <label>Agile Branch *</label>
      <select id="branchId" required><option value="">— select branch —</option></select>

      <label>Client / Company Name *</label>
      <input id="clientName" required placeholder="e.g. ABC Industries">

      <label>Location / Site</label>
      <input id="location" placeholder="Unit or address">

      <div class="row2">
        <div>
          <label>Received via *</label>
          <select id="channel" required>
            <option value="Phone">Phone</option>
            <option value="Mail">Mail</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Web">Web / Other</option>
          </select>
        </div>
        <div></div>
      </div>

      <label>Your Name</label>
      <input id="reportedBy" placeholder="Person reporting">

      <label>Contact Mobile <span class="hint" style="display:inline">(for WhatsApp confirmation)</span></label>
      <input id="phone" inputmode="tel" placeholder="10-digit mobile e.g. 9876543210">

      <label>Your Email <span class="hint" style="display:inline">(for confirmation &amp; response)</span></label>
      <input id="email" type="email" placeholder="you@company.com">

      <label>Complaint Type *</label>
      <select id="nature" required>
        <option value="">— select complaint type —</option>
            ${NATURE_OPTIONS}
      </select>

      <label>Describe the Complaint *</label>
      <textarea id="description" required placeholder="What happened? When? Who was involved?"></textarea>
      <div class="hint">Minimum 10 characters. Data is saved and sent to the branch HOD.</div>

      <button type="submit" class="btn" id="btn">Submit Complaint</button>
      <div id="err" class="msg"></div>
    </form>
  </div>

  <div class="card ok" id="okCard">
    <div style="font-size:52px;line-height:1">✅</div>
    <div class="thanks">Thank You!</div>
    <p>Your complaint has been registered successfully.</p>
    <div class="codebox">
      <div class="lbl">YOUR COMPLAINT CODE — please save this</div>
      <b id="codeOut">—</b>
      <div class="ts" id="tsOut"></div>
    </div>
    <div class="respond" id="respondMsg">Your Agile branch will respond to you.</div>
    <p id="emailNote" class="hint" style="display:none;margin-top:10px">A confirmation has also been sent to your email.</p>
    <p id="waNote" class="hint" style="display:none;margin-top:6px;color:#4ade80">✅ WhatsApp confirmation sent to your mobile.</p>
    <p id="waRetryNote" class="hint" style="display:none;margin-top:6px;color:#fbbf24">WhatsApp could not be sent right now — please save your Complaint Code above. The branch has still been notified by email.</p>
    <p style="font-size:13px;color:#94a3b8">The branch and Director have been notified. Keep your complaint code when you follow up.</p>
    <button type="button" class="btn" onclick="resetForm()">Register Another Complaint</button>
  </div>

  ${FOOTER}
</div>
<script>
function el(id){return document.getElementById(id);}
function showErr(t){var e=el('err');e.style.display='block';e.textContent=t;}
function fmtTs(iso){
  try{var d=new Date(iso);return d.toLocaleString('en-IN',{dateStyle:'full',timeStyle:'short',timeZone:'Asia/Kolkata'});}catch(x){return iso||'';}
}
function setReceivedNow(){
  el('receivedAt').value=fmtTs(new Date().toISOString());
}
setReceivedNow();
var PRESET_BRANCH_ID=new URLSearchParams(location.search).get('branchId')||'';
var PRESET_BRANCH_NAME=new URLSearchParams(location.search).get('branch')||'';
fetch('/api/mis/complaint-register?branches=1').then(function(r){return r.json();}).then(function(j){
  var s=el('branchId');
  (j.branches||[]).forEach(function(b){
    var o=document.createElement('option');o.value=b.id;o.textContent=b.name;s.appendChild(o);
  });
  if(PRESET_BRANCH_ID){
    s.value=PRESET_BRANCH_ID;
  } else if(PRESET_BRANCH_NAME){
    for(var i=0;i<s.options.length;i++){
      if(String(s.options[i].textContent).toLowerCase()===PRESET_BRANCH_NAME.trim().toLowerCase()){s.selectedIndex=i;break;}
    }
  }
}).catch(function(){});

function submitForm(e){
  e.preventDefault();
  el('err').style.display='none';
  el('btn').disabled=true;
  var payload={
    branchId:el('branchId').value,
    clientName:el('clientName').value,
    location:el('location').value,
    channel:el('channel').value,
    nature:el('nature').value,
    reportedBy:el('reportedBy').value,
    phone:el('phone').value,
    email:el('email').value,
    description:el('description').value
  };
  fetch('/api/mis/complaint-register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});})
    .then(function(res){
      el('btn').disabled=false;
      if(res.s!==200){showErr(res.j.error||'Could not register. Please try again.');return;}
      el('codeOut').textContent=res.j.code||'—';
      el('tsOut').textContent='Registered: '+fmtTs(res.j.registeredAt);
      el('respondMsg').textContent=(res.j.branchName?res.j.branchName+' branch':'Your Agile branch')+' has been notified and will respond to you.';
      el('emailNote').style.display=el('email').value&&el('email').value.indexOf('@')>0?'block':'none';
      el('waNote').style.display=res.j.whatsappSent?'block':'none';
      if(!res.j.whatsappSent&&el('phone').value){
        var wr=el('waRetryNote');
        if(wr)wr.style.display='block';
      }
      el('formCard').style.display='none';
      el('okCard').style.display='block';
      window.scrollTo(0,0);
    })
    .catch(function(){el('btn').disabled=false;showErr('Network error. Please try again.');});
  return false;
}
function resetForm(){
  el('f').reset();
  setReceivedNow();
  el('formCard').style.display='block';
  el('okCard').style.display='none';
  el('err').style.display='none';
  el('emailNote').style.display='none';
  el('waNote').style.display='none';
  el('waRetryNote').style.display='none';
}
</script>
</body></html>`

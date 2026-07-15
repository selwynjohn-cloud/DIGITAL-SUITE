import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getBranches } from '../_lib/mis/store.js'
import { GUARDS_BRAND, GUARDS_CURSOR_FOOTER, GUARDS_NAVY_HDR } from '../_lib/guards/brand.js'
import {
  getComplaints,
  getFeedback,
  guardsStorageOk,
  resolveBranchId,
} from '../_lib/guards/store.js'

const LOGO = 'https://www.agilegroup-digital.co.in/agile-logo.png'

type FeedbackInfo = {
  code: string
  guardName: string
  idNo: string
  category: string
  subCategory: string
  registeredAt: string
  branchName: string
  alreadySubmitted: boolean
  found: boolean
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = String(req.query.code ?? '').trim()
  const info = await lookupComplaintForFeedback(code)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(page(info))
}

async function lookupComplaintForFeedback(code: string): Promise<FeedbackInfo> {
  const empty: FeedbackInfo = {
    code,
    guardName: '',
    idNo: '',
    category: '',
    subCategory: '',
    registeredAt: '',
    branchName: '',
    alreadySubmitted: false,
    found: false,
  }
  if (!code) return empty

  let complaint: {
    id: string
    code: string
    branchId: string
    guardName: string
    idNo: string
    category: string
    subCategory: string
    registeredAt: string
  } | null = null

  if (guardsStorageOk()) {
    const all = await getComplaints()
    const c = all.find((x) => x.code === code)
    if (c) complaint = c
    if (c) {
      const fb = await getFeedback()
      empty.alreadySubmitted = fb.some((f) => f.complaintId === c.id)
    }
  }

  if (!complaint) return empty

  const branches = await getBranches()
  const branch = resolveBranchId(complaint.branchId, branches)

  return {
    code: complaint.code,
    guardName: complaint.guardName,
    idNo: complaint.idNo,
    category: complaint.category,
    subCategory: complaint.subCategory,
    registeredAt: complaint.registeredAt,
    branchName: branch?.name || complaint.branchId,
    alreadySubmitted: empty.alreadySubmitted,
    found: true,
  }
}

function esc(s: unknown) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function fmtDate(iso: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

function page(info: FeedbackInfo) {
  const dateStr = fmtDate(info.registeredAt)
  const catLine = info.category
    ? `${info.category}${info.subCategory ? ` — ${info.subCategory}` : ''}`
    : '—'

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Guards — Feedback</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:linear-gradient(160deg,#e8eef8 0%,#dbeafe 50%,#eff6ff 100%);color:#1e293b;min-height:100vh;padding:14px}
.shell{max-width:560px;margin:0 auto;border:5px solid #1d4ed8;border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 0 0 2px #c9a84c,0 12px 36px rgba(29,78,216,.22)}
.hdr{background:${GUARDS_NAVY_HDR};color:#fff;text-align:center;padding:22px 16px 24px;border-bottom:3px solid #c9a84c}
.hdr img{height:58px;margin-bottom:10px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))}
.hdr h1{font-size:16px;font-weight:700;letter-spacing:.35px;line-height:1.4}
.hdr h2{font-size:21px;margin-top:8px;font-weight:800;color:#fde68a}
.hdr p{font-size:13px;opacity:.94;margin-top:6px}
.body{padding:18px 18px 8px}
.card{background:#fff;border-radius:12px;padding:4px 2px 8px}
.card-title{font-size:15px;font-weight:800;color:#1e3a8a;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #c9a84c}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.info-box{background:linear-gradient(135deg,#eff6ff,#f8fafc);border:2px solid #93c5fd;border-radius:10px;padding:10px 12px}
.info-box.wide{grid-column:1/-1}
.info-box label{display:block;font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:.4px;margin-bottom:3px}
.info-box span{font-size:15px;font-weight:600;color:#0f172a}
.rating-box{background:linear-gradient(135deg,#eff6ff,#f0f9ff);border:3px solid #1d4ed8;border-radius:12px;padding:16px;margin:14px 0;text-align:center}
.rating-box .lbl{font-size:16px;font-weight:800;color:#1e3a8a;margin-bottom:10px}
.stars{display:flex;justify-content:center;gap:10px;margin:10px 0}
.star{font-size:40px;cursor:pointer;color:#cbd5e1;transition:transform .15s,color .15s}
.star:hover{transform:scale(1.12)}
.star.on{color:#f59e0b;text-shadow:0 0 10px rgba(245,158,11,.55)}
.star-label{font-size:13px;color:#475569;margin-top:4px}
textarea{width:100%;padding:12px;border:2px solid #93c5fd;border-radius:10px;font-size:16px;min-height:88px;margin-top:6px}
textarea:focus{outline:none;border-color:#1d4ed8;box-shadow:0 0 0 3px rgba(29,78,216,.15)}
.lbl{display:block;font-size:14px;font-weight:700;margin:12px 0 6px;color:#1e3a8a}
.btn{width:100%;padding:16px;background:linear-gradient(135deg,#1d4ed8,#1e3a8a 70%,#7f1d1d);color:#fff;border:none;border-radius:12px;font-size:18px;font-weight:800;cursor:pointer;margin-top:14px;box-shadow:0 4px 14px rgba(30,58,138,.35)}
.btn:disabled{opacity:.55;cursor:not-allowed}
.msg{padding:14px;border-radius:10px;margin-top:14px;display:none;font-size:15px;font-weight:600}
.msg.ok{display:block;background:#ecfdf5;border:2px solid #22c55e;color:#166534}
.msg.err{display:block;background:#fef2f2;border:2px solid #ef4444;color:#991b1b}
.msg.info{display:block;background:#eff6ff;border:2px solid #1d4ed8;color:#1e40af}
.ft{background:${GUARDS_NAVY_HDR};border-top:3px solid #c9a84c;padding:18px 16px 20px;text-align:center;color:#dbeafe}
.ft .care{font-size:14px;font-weight:800;color:#fff;margin-bottom:10px;line-height:1.5}
.ft .dept{font-size:13px;color:#cbd5e1;margin-bottom:10px}
.ft .dept a{color:#c9a84c;text-decoration:none;font-weight:700}
.ft .cursor{margin-top:10px;padding:10px 12px;background:rgba(255,255,255,.08);border-radius:8px;font-size:11px;color:#dbeafe;line-height:1.55;font-style:italic}
@media(max-width:480px){.info-grid{grid-template-columns:1fr}.star{font-size:36px}body{padding:8px}.shell{border-width:4px;border-radius:14px}}
</style></head>
<body>
<div class="shell">
<div class="hdr">
  <img src="${LOGO}" alt="Agile logo">
  <h1>AGILE SECURITY FORCE PRIVATE LIMITED</h1>
  <h2>Guards Feedback Form</h2>
  <p>Your opinion helps us improve our 24-hour response</p>
</div>
<div class="body">
  <div class="card">
    <div class="card-title">Complaint details</div>
    ${
      info.found
        ? `<div class="info-grid">
      <div class="info-box"><label>Complaint code</label><span>${esc(info.code)}</span></div>
      <div class="info-box"><label>Date</label><span>${esc(dateStr)}</span></div>
      <div class="info-box"><label>Guard name</label><span>${esc(info.guardName)}</span></div>
      <div class="info-box"><label>ID number</label><span>${esc(info.idNo)}</span></div>
      <div class="info-box wide"><label>Complaint category</label><span>${esc(catLine)}</span></div>
      <div class="info-box wide"><label>Branch</label><span>${esc(info.branchName)}</span></div>
    </div>`
        : `<div class="msg info" style="display:block">Complaint code not found. Please use the link from your completion message.</div>`
    }
    ${
      info.alreadySubmitted
        ? `<div class="msg ok" style="display:block">Thank you — feedback already submitted for this complaint.</div>`
        : info.found
          ? `<div class="rating-box">
      <div class="lbl">My rating for Agile</div>
      <div class="stars" id="stars">
        <span class="star" data-v="1" title="Poor">★</span>
        <span class="star" data-v="2" title="Fair">★</span>
        <span class="star" data-v="3" title="Good">★</span>
        <span class="star" data-v="4" title="Very good">★</span>
        <span class="star" data-v="5" title="Excellent">★</span>
      </div>
      <div class="star-label" id="starLbl">Tap a star (1 = poor · 5 = excellent)</div>
    </div>
    <label class="lbl">Comments (optional)</label>
    <textarea id="comment" placeholder="Tell us how we handled your complaint…"></textarea>
    <button class="btn" id="submitBtn" onclick="submitFb()">Submit feedback</button>
    <div id="msg" class="msg"></div>`
          : ''
    }
  </div>
</div>
<div class="ft">
  <div class="care">${GUARDS_BRAND.careLine}</div>
  <div class="dept">${GUARDS_BRAND.deptLine} · <a href="${GUARDS_BRAND.site}">${GUARDS_BRAND.siteLabel}</a></div>
  <div class="cursor">${GUARDS_CURSOR_FOOTER}</div>
</div>
</div>
<script>
var RATING=0;
var LABELS=['','Poor','Fair','Good','Very good','Excellent'];
document.querySelectorAll('.star').forEach(function(s){
  s.addEventListener('click',function(){
    RATING=Number(s.getAttribute('data-v'));
    document.querySelectorAll('.star').forEach(function(x,i){x.classList.toggle('on',i<RATING);});
    var lbl=document.getElementById('starLbl');
    if(lbl) lbl.textContent=LABELS[RATING]+' ('+RATING+'/5)';
  });
});
function submitFb(){
  var code=${JSON.stringify(info.code)};
  if(!code){showMsg('err','Invalid link — missing complaint code.');return;}
  if(!RATING){showMsg('err','Please tap a star rating (1–5).');return;}
  var btn=document.getElementById('submitBtn');
  if(btn){btn.disabled=true;btn.textContent='Submitting…';}
  fetch('/api/guards/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'submitFeedback',code:code,rating:RATING,comment:(document.getElementById('comment').value||'').trim()})})
    .then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});})
    .then(function(res){
      if(btn){btn.disabled=false;btn.textContent='Submit feedback';}
      if(res.s!==200){showMsg('err',res.j.error||'Could not submit.');return;}
      showMsg('ok',res.j.message||'Thank you for your feedback!');
      document.querySelectorAll('.star').forEach(function(x){x.style.pointerEvents='none';});
      if(document.getElementById('comment')) document.getElementById('comment').disabled=true;
      if(btn) btn.style.display='none';
    }).catch(function(){
      if(btn){btn.disabled=false;btn.textContent='Submit feedback';}
      showMsg('err','Network error. Try again.');
    });
}
function showMsg(cls,text){
  var m=document.getElementById('msg');
  if(m){m.className='msg '+cls;m.textContent=text;}
}
</script>
</body></html>`
}

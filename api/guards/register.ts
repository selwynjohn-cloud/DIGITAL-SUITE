import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GUARD_CATEGORIES } from '../_lib/guards/store.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const branch = String(req.query.branch ?? '').trim()
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(page(branch))
}

function page(branch: string) {
  const cats = Object.entries(GUARD_CATEGORIES)
    .map(([k, subs]) => {
      const opts = subs.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')
      return `<option value="${esc(k)}">${esc(k)}</option>`
    })
    .join('')

  const branchField = branch
    ? `<input type="hidden" id="branch" value="${esc(branch)}"><p style="text-align:center;color:#7f1d1d;font-weight:700;margin-bottom:12px">Branch: ${esc(branch)}</p>`
    : `<label class="lbl">Branch / Region *</label><input class="inp" id="branch" required placeholder="Your branch">`

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Guards — Complaint Form</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#faf5f5;color:#222}
.hdr{background:linear-gradient(135deg,#7f1d1d,#450a0a);color:#fff;text-align:center;padding:22px 16px;border-bottom:3px solid #fca5a5}
.hdr h1{font-size:18px;color:#fecaca}.hdr h2{font-size:24px;margin-top:6px}
.wrap{max-width:640px;margin:0 auto;padding:14px 16px 28px}
.card{background:#fff;border-radius:12px;padding:18px;margin-bottom:14px;border-left:4px solid #7f1d1d}
.lbl{display:block;font-size:14px;font-weight:600;color:#444;margin:10px 0 4px}
.inp,.sel{width:100%;padding:12px;border:1.5px solid #ddd;border-radius:8px;font-size:16px;background:#fafafa}
.btn{width:100%;padding:16px;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;border:none;border-radius:10px;font-size:17px;font-weight:700;cursor:pointer;margin-top:10px}
.msg{padding:12px;border-radius:8px;margin:10px 0;font-size:15px;display:none}
.msg.ok{display:block;background:#ecfdf5;border:1px solid #22c55e;color:#166534}
.msg.err{display:block;background:#fef2f2;border:1px solid #ef4444;color:#991b1b}
.result{display:none;text-align:center;padding:20px;background:#ecfdf5;border:2px solid #22c55e;border-radius:12px;margin-top:14px}
.result.show{display:block}
</style></head>
<body>
<div class="hdr"><h1>Agile Security Force Private Limited</h1><h2>Guards Complaint Form</h2></div>
<div class="wrap">
  <div class="card">
    <p style="font-size:14px;color:#666;line-height:1.5;margin-bottom:12px">No login needed. Fill your details and submit. You will get a <b>complaint code</b> — save it.<br><b style="color:#7f1d1d">Our response time is 24 hours.</b></p>
    ${branchField}
    <label class="lbl">Guard Name *</label><input class="inp" id="guardName" required>
    <label class="lbl">ID No. *</label><input class="inp" id="idNo" required>
    <label class="lbl">Mobile Number *</label><input class="inp" id="mobile" type="tel" required>
    <label class="lbl">Category</label>
    <select class="sel" id="category" onchange="updateSubs()"><option value="">— Select —</option>${cats}</select>
    <label class="lbl">Detail</label><select class="sel" id="subCategory"><option value="">— Select category first —</option></select>
    <label class="lbl">Describe your complaint</label><textarea class="inp" id="complaintNote" rows="3" placeholder="Type or speak your issue…"></textarea>
    <div id="msg" class="msg"></div>
    <button class="btn" onclick="submitForm()">Submit Complaint</button>
    <div class="result" id="result"><h3 style="color:#166534">Complaint Registered</h3><p id="resultText" style="margin-top:10px;line-height:1.5"></p></div>
  </div>
</div>
<script>
var CATS=${JSON.stringify(GUARD_CATEGORIES)};
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function updateSubs(){
  var m=document.getElementById('category').value;
  var sub=document.getElementById('subCategory');
  sub.innerHTML='<option value="">— Select —</option>';
  (CATS[m]||[]).forEach(function(s){sub.innerHTML+='<option value="'+esc(s)+'">'+esc(s)+'</option>'});
}
function showMsg(t,ok){var m=document.getElementById('msg');m.className='msg '+(ok?'ok':'err');m.textContent=t;}
function submitForm(){
  var payload={
    action:'register',
    branch:document.getElementById('branch').value.trim(),
    guardName:document.getElementById('guardName').value.trim(),
    idNo:document.getElementById('idNo').value.trim(),
    mobile:document.getElementById('mobile').value.trim(),
    category:document.getElementById('category').value,
    subCategory:document.getElementById('subCategory').value,
    complaintNote:document.getElementById('complaintNote').value.trim()
  };
  if(!payload.guardName||!payload.idNo||!payload.mobile){showMsg('Please fill Guard Name, ID and Mobile.',false);return;}
  if(!payload.branch){showMsg('Please enter your branch.',false);return;}
  showMsg('Submitting…',true);
  fetch('/api/guards/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});})
    .then(function(res){
      if(res.s!==200){showMsg(res.j.error||'Could not submit.',false);return;}
      document.getElementById('msg').style.display='none';
      document.querySelector('.btn').style.display='none';
      document.getElementById('result').classList.add('show');
      document.getElementById('resultText').textContent=res.j.message||('Your code: '+res.j.code);
    }).catch(function(){showMsg('Network error. Try again.',false);});
}
</script>
</body></html>`
}

function esc(s: string) {
  return String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

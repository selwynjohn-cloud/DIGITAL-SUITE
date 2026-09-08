/**
 * Public client signup — Director sends this link. No Command Centre login.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../_lib/suite-tap-feedback.js'
import { suiteAppOpenPageFooterHtml } from '../_lib/suite-app-footer.js'
import {
  avmNid,
  getClientUsers,
  getTenants,
  normalizeMobile10,
  saveClientUsers,
  saveTenants,
  type AvmRetention,
} from '../_lib/visitors/store.js'

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  return res.status(status).json(body)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const body = (req.body ?? {}) as Record<string, unknown>
    const companyName = String(body.companyName || '').trim().slice(0, 80)
    const logo = String(body.logo || '')
    const retention: AvmRetention = String(body.retention || '') === 'night' ? 'night' : 'officer30'
    const name = String(body.name || '').trim().slice(0, 80)
    const email = String(body.email || '').trim().toLowerCase()
    const mobile = normalizeMobile10(String(body.mobile || ''))
    if (!companyName) return json(res, 400, { error: 'Enter the company name.' })
    if (!name || !email.includes('@')) return json(res, 400, { error: 'Enter the first officer name and work email.' })
    const tenants = await getTenants()
    if (tenants.some((t) => t.companyName.toLowerCase() === companyName.toLowerCase())) {
      return json(res, 400, { error: 'This company is already registered. Ask Agile for the login link.' })
    }
    const tenant = {
      id: avmNid('tn'),
      companyName,
      logo: logo.startsWith('data:image/') ? logo.slice(0, 220_000) : '',
      retention,
      active: true,
      createdAt: new Date().toISOString(),
    }
    tenants.push(tenant)
    await saveTenants(tenants)
    const users = await getClientUsers()
    users.push({
      id: avmNid('usr'),
      tenantId: tenant.id,
      name,
      email,
      mobile,
      role: 'officer',
      active: true,
    })
    await saveClientUsers(users)
    return json(res, 200, {
      ok: true,
      tenantId: tenant.id,
      gateUrl: 'https://www.agilegroup-digital.co.in/visitors/?portal=gate',
      officerUrl: 'https://www.agilegroup-digital.co.in/visitors/?portal=officer',
    })
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Agile Visitors — Register your company</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:16px;padding:14px}
.hdr{text-align:center;margin:8px 0 16px}.hdr img{height:48px;background:transparent}.hdr h1{color:#fff;font-size:20px;margin-top:8px}
.card{background:#111a30;border:1px solid #22304f;border-radius:14px;padding:16px;max-width:520px;margin:0 auto}
label{display:block;font-size:12px;color:#94a3b8;margin:10px 0 4px;font-weight:700}
input,select{width:100%;padding:12px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:16px}
.btn{padding:14px;border:none;border-radius:9px;font-weight:800;width:100%;margin-top:14px;background:#c9a84c;color:#14224f;cursor:pointer;font-size:16px}
.note{color:#94a3b8;font-size:13px;line-height:1.5;margin-bottom:12px}
.msg{display:none;padding:10px;border-radius:8px;margin-top:10px}
${SUITE_TAP_FEEDBACK_CSS}
</style></head>
<body>
<div class="hdr"><img src="https://www.agilegroup-digital.co.in/agile-logo-clear.png" alt="Agile"><h1>Agile Visitors Management</h1><p style="color:#7dd3fc">Register your company — free value-added service</p></div>
<div class="card">
  <p class="note">Agile sends you this link. Enter your company name, logo, first officer, and how long to keep visitor papers.</p>
  <label>Company name *</label><input id="co">
  <label>Company logo</label><input id="logo" type="file" accept="image/*">
  <label>Visitor papers</label>
  <select id="ret">
    <option value="officer30">Officer keeps copies for 30 days, then deletes</option>
    <option value="night">Wipe every visitor the same night</option>
  </select>
  <label>First officer name *</label><input id="nm">
  <label>Work email *</label><input id="em" type="email">
  <label>Mobile</label><input id="mob" inputmode="numeric">
  <button class="btn" type="button" onclick="join()">Register company</button>
  <div class="msg" id="msg"></div>
</div>
${suiteAppOpenPageFooterHtml()}
<script>
${suiteTapFeedbackInitScript()}
var LOGO='';
document.getElementById('logo').onchange=function(){
  var f=this.files&&this.files[0];if(!f)return;
  var r=new FileReader();r.onload=function(){LOGO=String(r.result||'');};r.readAsDataURL(f);
};
function join(){
  var msg=document.getElementById('msg');msg.style.display='block';msg.textContent='Saving…';
  fetch('/api/visitors/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    companyName:document.getElementById('co').value,
    logo:LOGO,
    retention:document.getElementById('ret').value,
    name:document.getElementById('nm').value,
    email:document.getElementById('em').value,
    mobile:document.getElementById('mob').value
  })}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});}).then(function(res){
    if(res.s!==200){msg.textContent=(res.j&&res.j.error)||'Could not register.';return;}
    msg.innerHTML='Registered. Officer login: <a style="color:#7dd3fc" href="'+res.j.officerUrl+'">Officer</a> · Gate login: <a style="color:#7dd3fc" href="'+res.j.gateUrl+'">Gate</a>. Use Send PIN on that page.';
  }).catch(function(){msg.textContent='Network error.';});
}
</script>
</body></html>`

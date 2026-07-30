import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GUARDS_BRAND, GUARDS_NAVY_HDR, guardsDocFooter } from '../_lib/guards/brand.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Guards — HOD Portal User Manual</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#e8eef8;color:#1e293b;font-size:15px;line-height:1.55}
a{color:#1d4ed8}
.wrap{max-width:920px;margin:0 auto;padding:20px 16px 32px}
.topbar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px}
.btn{padding:10px 18px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:14px;text-decoration:none;display:inline-block}
.btn-navy{background:#1d4ed8;color:#fff}.btn-gold{background:#c9a84c;color:#14224f}
.hero{background:${GUARDS_NAVY_HDR};color:#fff;border-radius:16px;padding:28px 24px;margin-bottom:22px;border-top:3px solid #c9a84c;text-align:center}
.hero img{height:64px;margin-bottom:12px}
.hero h1{font-size:24px;color:#fde68a;font-weight:900}
.hero .sub{color:#dbeafe;font-size:14px;margin-top:8px}
.card{background:#fff;border:3px solid #1d4ed8;border-radius:14px;padding:20px;margin-bottom:18px;box-shadow:0 4px 16px rgba(29,78,216,.12)}
.card h2{color:#1e3a8a;font-size:18px;font-weight:900;margin-bottom:10px}
.card h3{color:#1d4ed8;font-size:15px;font-weight:800;margin:14px 0 8px}
.card p,.card li{font-size:14px;color:#334155}
.card ul,.card ol{padding-left:22px;margin:8px 0}
.card li{margin:6px 0}
.links{width:100%;border-collapse:collapse;font-size:13px;margin-top:10px}
.links th,.links td{border:1px solid #93c5fd;padding:10px;text-align:left}
.links th{background:#eff6ff;color:#1e3a8a;font-size:11px;text-transform:uppercase}
.doc-ft{background:${GUARDS_NAVY_HDR};border-top:3px solid #c9a84c;border-radius:14px;padding:18px 16px;text-align:center;color:#dbeafe;margin-top:8px}
.doc-ft .care{font-size:14px;font-weight:800;color:#fff;margin-bottom:8px}
.doc-ft .dept{font-size:13px;color:#cbd5e1;margin-bottom:10px}
.doc-ft .dept a{color:#c9a84c;text-decoration:none}
.doc-ft .cursor{padding:10px 12px;background:rgba(255,255,255,.08);border-radius:8px;font-size:11px;line-height:1.55;font-style:italic}
.share-hint{background:#eff6ff;border:1px dashed #1d4ed8;border-radius:10px;padding:14px;font-size:13px;color:#1e40af;margin-bottom:18px}
@media print{.noprint{display:none!important}body{background:#fff}.card{border:1px solid #999;box-shadow:none}}
</style></head>
<body>
<div class="wrap">
  <div class="topbar noprint">
    <a href="/guards" class="btn btn-navy">← HOD / Management Portal</a>
    <button class="btn btn-gold" onclick="window.print()">⬇ Download / Print PDF</button>
    <button class="btn btn-navy" onclick="navigator.clipboard&&navigator.clipboard.writeText(location.href).then(function(){alert('Link copied — share with branches')})">Copy link to share</button>
  </div>
  <div class="share-hint noprint"><b>Share or save:</b> Click <b>Download / Print PDF</b> → choose <b>Save as PDF</b>. Or copy the link and send on WhatsApp / email.</div>
  <div class="hero">
    <img src="${GUARDS_BRAND.logoUrl}" alt="Agile">
    <h1>User Manual — Agile Guards HOD Portal (App 07)</h1>
    <div class="sub">For Branch HOD / RM and Management only · Guards do <b>not</b> sign in here</div>
  </div>
  <div class="card" style="border-color:#c9a84c;background:#fffbeb">
    <h2>Important — who signs in here?</h2>
    <p><b>This portal is for HODs and Management staff only.</b> Guards never log in to this screen.</p>
    <p style="margin-top:8px">When a guard comes to the <b>control room</b>, your team either:</p>
    <ul>
      <li>Fills <b>Register Phone Complaints</b> (menu 1) on behalf of the guard, or</li>
      <li>Shares the <b>QR code / registration link</b> so the guard registers on their own phone (no login).</li>
    </ul>
    <p style="margin-top:8px">After a case is closed, the guard receives a <b>feedback link</b> by WhatsApp or email — that is also separate from this portal.</p>
  </div>
  <div class="card">
    <h2>Who uses this portal?</h2>
    <ul>
      <li><b>Branch HOD / RM</b> — one branch: assign complaints, track 24-hour clock, send completion letters.</li>
      <li><b>Management / Director</b> — all branches: dashboards, reminders, client status emails, feedback analysis.</li>
      <li><b>Control room staff</b> — use menu 1 to register a guard complaint (guard does not need this login).</li>
    </ul>
  </div>
  <div class="card">
    <h2>HOD / Management sign in</h2>
    <p>Open <b>${GUARDS_BRAND.portalSite}/guards</b> for <b>HOD Portal</b>, or <b>?portal=management</b> for Management. Sign in with <b>@agilegroup.co.in</b> email and OTP PIN.</p>
    <p style="margin-top:8px;color:#64748b"><i>Do not give guards this link — they use the registration link or QR only.</i></p>
  </div>
  <div class="card">
    <h2>Menu guide (same order for HOD &amp; Management)</h2>
    <table class="links">
      <tr><th>#</th><th>Menu</th><th>What it does</th></tr>
      <tr><td>0</td><td>Branch Dashboard</td><td>KPIs, delayed list, share dashboard by email</td></tr>
      <tr><td>1</td><td>Register Phone Complaints</td><td>Control room registers for guard · QR / link to share with guard phone</td></tr>
      <tr><td>2</td><td>Received Complaints</td><td>Open cases — assign Ops &amp; Dept staff</td></tr>
      <tr><td>3</td><td>Delayed Complaints</td><td>Past 24 hours — priority; Director reminders</td></tr>
      <tr><td>4</td><td>Complaint Analysis</td><td>Root cause pie chart &amp; fixes</td></tr>
      <tr><td>5</td><td>Delayed Complaint Analysis</td><td>Who delayed — improve response</td></tr>
      <tr><td>6</td><td>Communication to Complainant</td><td>All outbound WhatsApp &amp; emails</td></tr>
      <tr><td>7</td><td>Feedback / Feedback Analysis</td><td>HOD sends form · Management sees ratings</td></tr>
      <tr><td>8</td><td>Operations Staff</td><td>Ops team for assignment dropdown</td></tr>
      <tr><td>9</td><td>Department Staff</td><td>Dept staff + email for assignment</td></tr>
    </table>
  </div>
  <div class="card">
    <h2>24-hour workflow</h2>
    <ol>
      <li>Guard visits control room — staff registers via <b>menu 1</b> or shares registration link / QR (guard phone, no login).</li>
      <li>HOD assigns Operations + Department within 24 hours.</li>
      <li>Ops &amp; Dept file completion reports.</li>
      <li>HOD sends <b>completion letter</b> (WhatsApp or email) — includes <b>feedback form link</b> for the guard.</li>
      <li>Guard submits feedback on phone; Management sees ratings in Feedback Analysis.</li>
    </ol>
  </div>
  <div class="card">
    <h2>Important links</h2>
    <table class="links">
      <tr><th>Link</th><th>Who uses it</th><th>URL</th></tr>
      <tr><td>HOD Portal (sign in)</td><td>HOD / RM only</td><td>${GUARDS_BRAND.portalSite}/guards</td></tr>
      <tr><td>Management Portal</td><td>Director / Management</td><td>${GUARDS_BRAND.portalSite}/guards?portal=management</td></tr>
      <tr><td>Guard register — no login</td><td>Control room shares with guard</td><td>${GUARDS_BRAND.portalSite}/guards/register?branch=Hi-Tech City</td></tr>
      <tr><td>Guard feedback — no login</td><td>Guard after case closed</td><td>${GUARDS_BRAND.portalSite}/guards/feedback?code=COMPLAINT_CODE</td></tr>
      <tr><td>Troubleshooting booklet</td><td>HOD / Management</td><td>${GUARDS_BRAND.portalSite}/guards/troubleshooting</td></tr>
    </table>
  </div>
  ${guardsDocFooter()}
</div>
</body></html>`

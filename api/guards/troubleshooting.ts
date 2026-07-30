import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GUARDS_BRAND, GUARDS_NAVY_HDR, guardsDocFooter } from '../_lib/guards/brand.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Guards — HOD Portal Troubleshooting</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#e8eef8;color:#1e293b;font-size:15px;line-height:1.55}
a{color:#1d4ed8}
.wrap{max-width:900px;margin:0 auto;padding:20px 16px 32px}
.topbar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px}
.btn{padding:10px 18px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:14px;text-decoration:none;display:inline-block}
.btn-navy{background:#1d4ed8;color:#fff}.btn-gold{background:#c9a84c;color:#14224f}
.hero{background:${GUARDS_NAVY_HDR};color:#fff;border-radius:16px;padding:28px 24px;margin-bottom:22px;border-top:3px solid #c9a84c;text-align:center}
.hero img{height:58px;margin-bottom:12px}
.hero h1{font-size:22px;color:#fde68a;font-weight:900}
.hero .sub{color:#dbeafe;font-size:14px;margin-top:8px}
.card{background:#fff;border:3px solid #1d4ed8;border-radius:14px;padding:20px;margin-bottom:18px}
.card h2{color:#1e3a8a;font-size:17px;font-weight:900;margin-bottom:12px}
.issue{background:#f8fafc;border:1px solid #93c5fd;border-radius:12px;padding:16px;margin-bottom:14px}
.issue .q{color:#1d4ed8;font-weight:900;font-size:15px;margin-bottom:8px}
.issue .fix{color:#334155;font-size:14px}
.issue ol{padding-left:22px;margin-top:8px}
.issue li{margin:6px 0}
.quick table{width:100%;border-collapse:collapse;font-size:13px;margin-top:10px}
.quick th,.quick td{border:1px solid #93c5fd;padding:10px;text-align:left}
.quick th{background:#eff6ff;color:#1e3a8a}
.share-hint{background:#eff6ff;border:1px dashed #1d4ed8;border-radius:10px;padding:14px;font-size:13px;color:#1e40af;margin-bottom:18px}
.doc-ft{background:${GUARDS_NAVY_HDR};border-top:3px solid #c9a84c;border-radius:14px;padding:18px 16px;text-align:center;color:#dbeafe;margin-top:8px}
.doc-ft .care{font-size:14px;font-weight:800;color:#fff;margin-bottom:8px}
.doc-ft .dept{font-size:13px;color:#cbd5e1;margin-bottom:10px}
.doc-ft .dept a{color:#c9a84c;text-decoration:none}
.doc-ft .cursor{padding:10px 12px;background:rgba(255,255,255,.08);border-radius:8px;font-size:11px;line-height:1.55;font-style:italic}
@media print{.noprint{display:none!important}body{background:#fff}.card,.issue{border:1px solid #999}}
</style></head>
<body>
<div class="wrap">
  <div class="topbar noprint">
    <a href="/guards/manual" class="btn btn-navy">← User Manual</a>
    <button class="btn btn-gold" onclick="window.print()">⬇ Download / Print PDF</button>
    <button class="btn btn-navy" onclick="navigator.clipboard&&navigator.clipboard.writeText(location.href).then(function(){alert('Link copied')})">Copy link to share</button>
    <a href="/guards" class="btn btn-navy">HOD / Management Portal</a>
  </div>
  <div class="share-hint noprint"><b>For HODs &amp; Management only.</b> Guards do not use this portal — control room shares the registration link or QR. Save as PDF: <b>Download / Print PDF</b> → <b>Save as PDF</b>.</div>
  <div class="hero">
    <img src="${GUARDS_BRAND.logoUrl}" alt="Agile">
    <h1>Troubleshooting — HOD Portal</h1>
    <div class="sub">Quick fixes for HODs, Management &amp; control room staff</div>
  </div>
  <div class="card quick">
    <h2>⚡ Correct links</h2>
    <table>
      <tr><th>Need</th><th>Who</th><th>Open</th></tr>
      <tr><td>HOD Portal (sign in)</td><td>HOD / RM</td><td>${GUARDS_BRAND.portalSite}/guards</td></tr>
      <tr><td>Management Portal</td><td>Director</td><td>${GUARDS_BRAND.portalSite}/guards?portal=management</td></tr>
      <tr><td>User Manual</td><td>HOD / Management</td><td>${GUARDS_BRAND.portalSite}/guards/manual</td></tr>
      <tr><td>Guard register (no login)</td><td>Control room → guard phone</td><td>${GUARDS_BRAND.portalSite}/guards/register?branch=YOUR_BRANCH</td></tr>
      <tr><td>Guard feedback (no login)</td><td>Guard after case closed</td><td>${GUARDS_BRAND.portalSite}/guards/feedback?code=COMPLAINT_CODE</td></tr>
    </table>
  </div>
  <div class="card">
    <h2>Common issues</h2>
    <div class="issue">
      <div class="q">Guard wants to register — which link?</div>
      <div class="fix"><ol>
        <li><b>Guards do not sign in</b> to the HOD portal.</li>
        <li>Control room: use <b>menu 1 — Register Phone Complaints</b> and fill the form for the guard, OR</li>
        <li>Share the <b>QR code / registration link</b> from menu 1 to the guard's phone.</li>
        <li>Registration link: <b>/guards/register?branch=BRANCH_NAME</b> — no login, no OTP.</li>
      </ol></div>
    </div>
    <div class="issue">
      <div class="q">Cannot sign in / OTP not received (HOD or Management)</div>
      <div class="fix"><ol>
        <li>Use <b>www.agilegroup-digital.co.in</b> — not a long vercel.app link.</li>
        <li>Enter your <b>@agilegroup.co.in</b> email only.</li>
        <li>Check spam folder for OTP email.</li>
        <li>Wait 60 seconds and request PIN again.</li>
      </ol></div>
    </div>
    <div class="issue">
      <div class="q">Portal shows empty / loading forever</div>
      <div class="fix"><ol>
        <li>Click <b>↻ Refresh</b> at top right.</li>
        <li>Use Chrome or Safari — avoid very old browsers.</li>
        <li>Sign out and sign in again.</li>
      </ol></div>
    </div>
    <div class="issue">
      <div class="q">Completion email / WhatsApp not sent</div>
      <div class="fix"><ol>
        <li>Check guard mobile is 10 digits.</li>
        <li>Ops &amp; Dept reports must be filed before completion letter.</li>
        <li>Email goes via company mail — forward to guard if needed.</li>
      </ol></div>
    </div>
    <div class="issue">
      <div class="q">Feedback form — complaint not found</div>
      <div class="fix"><ol>
        <li>Guard must use the <b>exact link</b> from the completion message.</li>
        <li>Code format: e.g. <b>GC-2026-S001</b></li>
        <li>Feedback works only after complaint is marked solved.</li>
      </ol></div>
    </div>
    <div class="issue">
      <div class="q">Director — email client status</div>
      <div class="fix"><ol>
        <li>Open Management portal → Received or Delayed complaints.</li>
        <li>Enter <b>client email</b> and click Email client status.</li>
        <li>For department: pick staff from dropdown → Email dept status.</li>
      </ol></div>
    </div>
  </div>
  ${guardsDocFooter()}
</div>
</body></html>`

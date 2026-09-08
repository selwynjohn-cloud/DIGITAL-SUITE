import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GUARDS_BRAND, GUARDS_NAVY_HDR, guardsDocFooter } from '../_lib/guards/brand.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Guards — Troubleshooting (Staff &amp; HOD)</title>
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
.sla{background:#fff7ed;border:3px solid #ea580c;border-radius:14px;padding:18px;margin-bottom:18px}
.sla h2{color:#c2410c;font-size:17px;font-weight:900;margin-bottom:8px}
.sla p,.sla li{font-size:14px;color:#7c2d12}
.sla ul{padding-left:22px;margin:8px 0}
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
@media print{.noprint{display:none!important}body{background:#fff}.card,.issue,.sla{border:1px solid #999}}
</style></head>
<body>
<div class="wrap">
  <div class="topbar noprint">
    <a href="/guards/manual" class="btn btn-navy">← User Guide</a>
    <button class="btn btn-gold" onclick="window.print()">⬇ Download / Print PDF</button>
    <button class="btn btn-navy" onclick="navigator.clipboard&&navigator.clipboard.writeText(location.href).then(function(){alert('Link copied')})">Copy link to share</button>
    <a href="/guards" class="btn btn-navy">HOD Portal</a>
    <a href="/guards?portal=management" class="btn btn-navy">Management Portal</a>
  </div>
  <div class="share-hint noprint"><b>Staff &amp; HODs:</b> This booklet opens from both HOD and Management portals (left menu). Save as PDF: <b>Download / Print PDF</b> → <b>Save as PDF</b>. Live link: <b>${GUARDS_BRAND.portalSite}/guards/troubleshooting</b></div>
  <div class="hero">
    <img src="${GUARDS_BRAND.logoUrl}" alt="Agile">
    <h1>Troubleshooting — Staff &amp; HOD</h1>
    <div class="sub">Quick fixes for HOD Portal · Management Portal · Control room · Ops &amp; Dept</div>
  </div>

  <div class="sla">
    <h2>If a complaint is past 24 hours</h2>
    <ul>
      <li>Open <b>Delayed Complaints</b> immediately — treat as priority.</li>
      <li>Confirm Ops + Dept are assigned (same branch as the complaint).</li>
      <li>Ask Ops / Dept to file reports today; then send the completion letter.</li>
      <li>Management: use <b>Remind HOD</b> / <b>Remind Dept</b> on the delayed case.</li>
      <li>Never leave a delayed case without a written update the same day.</li>
    </ul>
  </div>

  <div class="card quick">
    <h2>⚡ Correct links</h2>
    <table>
      <tr><th>Need</th><th>Who</th><th>Open</th></tr>
      <tr><td>HOD Portal</td><td>HOD / RM / branch staff</td><td>${GUARDS_BRAND.portalSite}/guards</td></tr>
      <tr><td>Management Portal</td><td>Director / Management</td><td>${GUARDS_BRAND.portalSite}/guards?portal=management</td></tr>
      <tr><td>User Guide</td><td>Staff &amp; HODs</td><td>${GUARDS_BRAND.portalSite}/guards/manual</td></tr>
      <tr><td>This Troubleshooting</td><td>Staff &amp; HODs</td><td>${GUARDS_BRAND.portalSite}/guards/troubleshooting</td></tr>
      <tr><td>Guard register (no login)</td><td>Control room → guard phone</td><td>${GUARDS_BRAND.portalSite}/guards/register?branch=YOUR_BRANCH</td></tr>
      <tr><td>Guard feedback (no login)</td><td>Guard after case closed</td><td>${GUARDS_BRAND.portalSite}/guards/feedback?code=COMPLAINT_CODE</td></tr>
    </table>
  </div>

  <div class="card">
    <h2>Common issues</h2>

    <div class="issue">
      <div class="q">Complaint will miss the 24-hour deadline — what should we do?</div>
      <div class="fix"><ol>
        <li>Assign Ops + Dept immediately if not already assigned.</li>
        <li>Call / WhatsApp the assigned staff — ask for action report today.</li>
        <li>If resolution needs more time, still send an interim update to the guard and note it in the case.</li>
        <li>HOD: send completion letter as soon as reports are filed.</li>
        <li>Management: send reminder from Delayed Complaints if the branch is silent.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q">Guard wants to register — which link?</div>
      <div class="fix"><ol>
        <li><b>Guards do not sign in</b> to HOD or Management portals.</li>
        <li>Control room: use <b>menu 1 — Register Phone Complaints</b> and fill the form, OR</li>
        <li>Share the <b>QR code / registration link</b> from menu 1 to the guard's phone.</li>
        <li>Registration link: <b>/guards/register?branch=BRANCH_NAME</b> — no login, no OTP.</li>
        <li>Tell the guard: response time is <b>24 hours</b>.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q">Cannot assign Ops / Dept — dropdown empty</div>
      <div class="fix"><ol>
        <li>Open <b>Operations Staff</b> (menu 8) and <b>Department Staff</b> (menu 9).</li>
        <li>HODs and Operation Managers come from <b>User Management</b> for that branch. Add them there if the list is empty.</li>
        <li>Or add Operations staff for the <b>same branch</b> as the complaint.</li>
        <li>Mark them Active, with correct email / mobile.</li>
        <li>Refresh the portal, then open the complaint again.</li>
        <li>Management: ensure you picked the correct branch when adding staff.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q">Cannot sign in / OTP not received (HOD or Management)</div>
      <div class="fix"><ol>
        <li>Use <b>www.agilegroup-digital.co.in</b> — not a long vercel.app link.</li>
        <li>Management: enter your <b>@agilegroup.co.in</b> email only.</li>
        <li>Check spam / Junk folder for OTP email.</li>
        <li>Wait 60 seconds and request PIN again.</li>
        <li>Try Chrome or Safari; clear cache if the page sticks on Loading.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q">Portal shows empty / loading forever</div>
      <div class="fix"><ol>
        <li>Click <b>↻ Refresh</b> at top right.</li>
        <li>Use Chrome or Safari — avoid very old browsers.</li>
        <li>Sign out and sign in again.</li>
        <li>Confirm you opened the correct portal (HOD vs Management).</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q">Staff / HOD from wrong branch appears on a complaint</div>
      <div class="fix"><ol>
        <li>Ops, Dept, and HOD must belong to the <b>same branch</b> as the complaint.</li>
        <li>Re-assign using the branch-filtered dropdowns.</li>
        <li>If staff is listed under the wrong branch, edit them in menus 8 / 9.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q">Completion email / WhatsApp not sent</div>
      <div class="fix"><ol>
        <li>Check guard mobile is <b>10 digits</b>.</li>
        <li>Ops &amp; Dept reports must be filed before the completion letter.</li>
        <li>Try WhatsApp if email fails (or vice versa).</li>
        <li>Email goes via company mail — forward to guard if needed.</li>
        <li>Confirm the message appears under <b>Communication to Complainant</b>.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q">Feedback form — complaint not found</div>
      <div class="fix"><ol>
        <li>Guard must use the <b>exact link</b> from the completion message.</li>
        <li>Code format: e.g. <b>GC-2026-S001</b></li>
        <li>Feedback works only after the complaint is marked solved / completion sent.</li>
        <li>HOD can resend the feedback form from the Feedback menu.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q">Director — email client status / remind HOD</div>
      <div class="fix"><ol>
        <li>Open <b>Management portal</b> → Received or Delayed complaints.</li>
        <li>For reminders: select HOD / Dept from dropdown → Remind.</li>
        <li>For client status: enter <b>client email</b> → Email client status.</li>
        <li>For department status: pick staff → Email dept status.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q">Within 24h % is low on dashboard</div>
      <div class="fix"><ol>
        <li>Open Delayed Complaints and clear the oldest cases first.</li>
        <li>Assign new cases within a few hours of registration.</li>
        <li>Keep Ops / Dept lists updated so assignment is never blocked.</li>
        <li>Review Delayed Complaint Analysis to see who is holding cases.</li>
        <li>Use dashboard suggestions under “reduce response time (24 hours)”.</li>
      </ol></div>
    </div>
  </div>
  ${guardsDocFooter()}
</div>
</body></html>`

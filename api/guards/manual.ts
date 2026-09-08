import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GUARDS_BRAND, GUARDS_NAVY_HDR, guardsDocFooter } from '../_lib/guards/brand.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Guards — User Guide (Staff &amp; HOD)</title>
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
.sla{background:#fff7ed;border:3px solid #ea580c;border-radius:14px;padding:20px;margin-bottom:18px}
.sla h2{color:#c2410c;font-size:18px;font-weight:900;margin-bottom:10px}
.sla p,.sla li{font-size:14px;color:#7c2d12}
.sla ul{padding-left:22px;margin:8px 0}
.sla li{margin:6px 0}
.badge{display:inline-block;background:#ea580c;color:#fff;font-weight:900;font-size:12px;padding:4px 10px;border-radius:999px;margin-bottom:8px}
.links{width:100%;border-collapse:collapse;font-size:13px;margin-top:10px}
.links th,.links td{border:1px solid #93c5fd;padding:10px;text-align:left}
.links th{background:#eff6ff;color:#1e3a8a;font-size:11px;text-transform:uppercase}
.role{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px}
.role .box{background:#f8fafc;border:1px solid #93c5fd;border-radius:10px;padding:14px}
.role .box h3{margin-top:0}
.doc-ft{background:${GUARDS_NAVY_HDR};border-top:3px solid #c9a84c;border-radius:14px;padding:18px 16px;text-align:center;color:#dbeafe;margin-top:8px}
.doc-ft .care{font-size:14px;font-weight:800;color:#fff;margin-bottom:8px}
.doc-ft .dept{font-size:13px;color:#cbd5e1;margin-bottom:10px}
.doc-ft .dept a{color:#c9a84c;text-decoration:none}
.doc-ft .cursor{padding:10px 12px;background:rgba(255,255,255,.08);border-radius:8px;font-size:11px;line-height:1.55;font-style:italic}
.share-hint{background:#eff6ff;border:1px dashed #1d4ed8;border-radius:10px;padding:14px;font-size:13px;color:#1e40af;margin-bottom:18px}
.toc a{display:block;padding:4px 0;font-weight:700;font-size:14px}
@media(max-width:700px){.role{grid-template-columns:1fr}}
@media print{.noprint{display:none!important}body{background:#fff}.card,.sla{border:1px solid #999;box-shadow:none}}
</style></head>
<body>
<div class="wrap">
  <div class="topbar noprint">
    <a href="/guards" class="btn btn-navy">← HOD Portal</a>
    <a href="/guards?portal=management" class="btn btn-navy">Management Portal</a>
    <button class="btn btn-gold" onclick="window.print()">⬇ Download / Print PDF</button>
    <button class="btn btn-navy" onclick="navigator.clipboard&&navigator.clipboard.writeText(location.href).then(function(){alert('Link copied — share with staff & HODs')})">Copy link to share</button>
  </div>
  <div class="share-hint noprint"><b>Attach to email:</b> Click <b>Download / Print PDF</b> → choose <b>Save as PDF</b> → attach the PDF to your mail to staff &amp; HODs. Or copy this link: <b>${GUARDS_BRAND.portalSite}/guards/manual</b></div>
  <div class="hero">
    <img src="${GUARDS_BRAND.logoUrl}" alt="Agile">
    <h1>Agile Guards — User Guide</h1>
    <div class="sub">For Control Room Staff · Operations · Department · Branch HOD / RM · Management<br>App 07 · Internal Customer Care · Response time <b>24 hours</b></div>
  </div>

  <div class="sla">
    <div class="badge">MANDATORY POLICY</div>
    <h2>Respond to every guard complaint within 24 hours</h2>
    <p>Every complaint registered in Agile Guards must be <b>assigned, actioned, and closed (or given a clear written update)</b> within <b>24 hours</b> of registration. <b>Updated 18 Aug 2026 — app working.</b></p>
    <ul>
      <li><b>Hour 0</b> — Complaint registered (control room / QR / phone).</li>
      <li><b>Within a few hours</b> — HOD / RM assigns Operations staff + Department staff (same branch).</li>
      <li><b>Same day</b> — Ops &amp; Dept file completion / action reports.</li>
      <li><b>Before 24 hours</b> — HOD sends completion letter (WhatsApp or email) with feedback link to the guard.</li>
      <li><b>After 24 hours</b> — Case appears under <b>Delayed Complaints</b>. Director / Management may send reminders. Treat as priority.</li>
    </ul>
    <p style="margin-top:10px"><b>Do not leave open complaints unattended.</b> If you need more time, update the case with action taken and inform the complainant.</p>
  </div>

  <div class="card">
    <h2>Working today (18 Aug 2026)</h2>
    <ul>
      <li>Sign in with work email → Send PIN.</li>
      <li>HOD and Management menus stay aligned (assign staff, delayed list, completion letter, feedback).</li>
      <li>Daily complaints pack continues on the Command Centre schedule.</li>
      <li>Use this User Guide and Troubleshooting from the Help menus in the portal.</li>
    </ul>
  </div>

  <div class="card toc">
    <h2>Contents</h2>
    <a href="#who">1. Who uses which portal</a>
    <a href="#login">2. How to sign in</a>
    <a href="#workflow">3. 24-hour workflow (step by step)</a>
    <a href="#roles">4. Duties by role</a>
    <a href="#menus">5. Menu guide (HOD &amp; Management)</a>
    <a href="#tips">6. Daily checklist for staff &amp; HODs</a>
    <a href="#links">7. Important links</a>
  </div>

  <div class="card" id="who">
    <h2>1. Who uses which portal?</h2>
    <p><b>Guards never sign in</b> to the HOD or Management portals. They only use the registration link / QR and the feedback link.</p>
    <div class="role">
      <div class="box">
        <h3>HOD Portal</h3>
        <p>Branch HOD / RM · Control room staff · Branch ops coordinators</p>
        <p style="margin-top:8px">Open: <b>${GUARDS_BRAND.portalSite}/guards</b></p>
        <p style="margin-top:6px">One branch · assign · close · send letters</p>
      </div>
      <div class="box">
        <h3>Management Portal</h3>
        <p>Director · Management · HQ Internal Customer Care</p>
        <p style="margin-top:8px">Open: <b>${GUARDS_BRAND.portalSite}/guards?portal=management</b></p>
        <p style="margin-top:6px">All branches · dashboards · reminders · analysis</p>
      </div>
    </div>
  </div>

  <div class="card" id="login">
    <h2>2. How to sign in</h2>
    <h3>HOD Portal</h3>
    <ol>
      <li>Open <b>${GUARDS_BRAND.portalSite}/guards</b></li>
      <li>Sign in with your branch credentials / OTP as prompted.</li>
      <li>You will see only your branch data.</li>
    </ol>
    <h3>Management Portal</h3>
    <ol>
      <li>Open <b>${GUARDS_BRAND.portalSite}/guards?portal=management</b></li>
      <li>Sign in with <b>@agilegroup.co.in</b> email and OTP PIN.</li>
      <li>You will see all branches.</li>
    </ol>
    <p style="margin-top:10px;color:#64748b"><i>Always use www.agilegroup-digital.co.in — not old vercel.app links.</i></p>
  </div>

  <div class="card" id="workflow">
    <h2>3. 24-hour workflow (step by step)</h2>
    <ol>
      <li><b>Register</b> — Guard visits / calls control room. Staff opens <b>menu 1 — Register Phone Complaints</b> and submits the form, <b>or</b> shares the QR / registration link so the guard registers on their phone (no login).</li>
      <li><b>Assign (HOD)</b> — Open <b>Received Complaints</b>. Assign <b>Operations staff</b> and <b>Department staff</b> from the <b>same branch</b> as the complaint. Do this immediately — do not wait till end of day.</li>
      <li><b>Action (Ops &amp; Dept)</b> — Investigate, resolve, and file completion / action reports in the case.</li>
      <li><b>Close (HOD)</b> — Send <b>completion letter</b> by WhatsApp or email. The message includes a <b>feedback form link</b> for the guard.</li>
      <li><b>Feedback</b> — Guard submits feedback on phone. Management reviews ratings under Feedback Analysis.</li>
      <li><b>If delayed (&gt;24h)</b> — Case moves to <b>Delayed Complaints</b>. HOD must clear it today. Management may email reminders to HOD / Dept.</li>
    </ol>
  </div>

  <div class="card" id="roles">
    <h2>4. Duties by role</h2>
    <h3>Control room / branch staff</h3>
    <ul>
      <li>Register every guard complaint the same day it is received (menu 1 or QR).</li>
      <li>Enter correct mobile (10 digits), branch, category, and clear description.</li>
      <li>Inform the guard: <b>“We will respond within 24 hours.”</b></li>
      <li>Escalate open cases to HOD / RM the same day.</li>
    </ul>
    <h3>Operations &amp; Department staff</h3>
    <ul>
      <li>Act on assigned complaints the same day.</li>
      <li>File your report promptly so HOD can send the completion letter before 24 hours.</li>
      <li>Keep evidence / notes ready if Management asks for status.</li>
    </ul>
    <h3>Branch HOD / RM</h3>
    <ul>
      <li>Check <b>Branch Dashboard</b> and <b>Received Complaints</b> every morning and evening.</li>
      <li>Assign Ops + Dept within hours of registration — not after 24 hours.</li>
      <li>Clear <b>Delayed Complaints</b> first every day.</li>
      <li>Send completion letter + feedback link before the 24-hour clock expires.</li>
      <li>Keep Operations Staff and Department Staff lists updated (menus 8 &amp; 9).</li>
    </ul>
    <h3>Management / Director</h3>
    <ul>
      <li>Monitor all-branch dashboard and delayed list daily.</li>
      <li>Send reminder emails to HOD / Department for delayed cases.</li>
      <li>Review Complaint Analysis &amp; Feedback Analysis weekly.</li>
      <li>Email client / dept status when required from Received or Delayed screens.</li>
    </ul>
  </div>

  <div class="card" id="menus">
    <h2>5. Menu guide (same order — HOD &amp; Management)</h2>
    <table class="links">
      <tr><th>#</th><th>Menu</th><th>What it does</th><th>24h focus</th></tr>
      <tr><td>0</td><td>Branch Dashboard</td><td>KPIs, delayed list, share by email</td><td>Start here daily</td></tr>
      <tr><td>1</td><td>Register Phone Complaints</td><td>Control room form · QR / link for guard phone</td><td>Clock starts on register</td></tr>
      <tr><td>2</td><td>Received Complaints</td><td>Open cases — assign Ops &amp; Dept</td><td>Assign same day</td></tr>
      <tr><td>3</td><td>Delayed Complaints</td><td>Past 24 hours — priority list</td><td>Clear today</td></tr>
      <tr><td>4</td><td>Complaint Analysis</td><td>Root cause pie chart &amp; fixes</td><td>Prevent repeats</td></tr>
      <tr><td>5</td><td>Delayed Complaint Analysis</td><td>Who delayed — improve response</td><td>Coach the team</td></tr>
      <tr><td>6</td><td>Communication to Complainant</td><td>All outbound WhatsApp &amp; emails</td><td>Proof of contact</td></tr>
      <tr><td>7</td><td>Feedback / Feedback Analysis</td><td>HOD sends form · Mgmt sees ratings</td><td>Close the loop</td></tr>
      <tr><td>8</td><td>Operations Staff</td><td>Ops team for assignment dropdown</td><td>Keep list current</td></tr>
      <tr><td>9</td><td>Department Staff</td><td>Dept staff + email for assignment</td><td>Keep list current</td></tr>
    </table>
    <p style="margin-top:10px">Both portals open the same User Guide and Troubleshooting from the left menu (gold links at the bottom).</p>
  </div>

  <div class="card" id="tips">
    <h2>6. Daily checklist for staff &amp; HODs</h2>
    <ol>
      <li>Open Agile Guards → check Dashboard KPIs (Open / Delayed / Within 24h %).</li>
      <li>Register any pending phone / walk-in complaints immediately.</li>
      <li>Assign every unassigned case under Received Complaints.</li>
      <li>Work Delayed Complaints first until the list is empty.</li>
      <li>Ensure Ops &amp; Dept reports are filed; then send completion letters.</li>
      <li>Confirm feedback link went to the guard (WhatsApp / email).</li>
      <li>If anything blocks closure, update notes and inform Management the same day.</li>
    </ol>
  </div>

  <div class="card" id="links">
    <h2>7. Important links</h2>
    <table class="links">
      <tr><th>Link</th><th>Who uses it</th><th>URL</th></tr>
      <tr><td>HOD Portal</td><td>HOD / RM / branch staff</td><td>${GUARDS_BRAND.portalSite}/guards</td></tr>
      <tr><td>Management Portal</td><td>Director / Management</td><td>${GUARDS_BRAND.portalSite}/guards?portal=management</td></tr>
      <tr><td>This User Guide</td><td>Staff &amp; HODs</td><td>${GUARDS_BRAND.portalSite}/guards/manual</td></tr>
      <tr><td>Troubleshooting</td><td>Staff &amp; HODs</td><td>${GUARDS_BRAND.portalSite}/guards/troubleshooting</td></tr>
      <tr><td>Guard register (no login)</td><td>Control room → guard phone</td><td>${GUARDS_BRAND.portalSite}/guards/register?branch=YOUR_BRANCH</td></tr>
      <tr><td>Guard feedback (no login)</td><td>Guard after case closed</td><td>${GUARDS_BRAND.portalSite}/guards/feedback?code=COMPLAINT_CODE</td></tr>
    </table>
  </div>
  ${guardsDocFooter()}
</div>
</body></html>`

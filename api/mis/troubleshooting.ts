import type { VercelRequest, VercelResponse } from '@vercel/node'
import { MIS_BRAND, misPrintFooterBlock } from '../_lib/mis/brand.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const SITE = MIS_BRAND.site

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Troubleshooting Booklet</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#070d18;color:#e2e8f0;font-size:15px;line-height:1.55}
a{color:#c9a84c}
.wrap{max-width:900px;margin:0 auto;padding:20px 16px 40px}
.hero{background:linear-gradient(135deg,#7f1d1d,#14224f 55%,#0f172a);border-radius:16px;padding:28px 24px;margin-bottom:22px;border:1px solid rgba(201,168,76,.4);text-align:center}
.hero img{height:58px;margin-bottom:12px}
.hero h1{font-size:24px;color:#fde68a;font-weight:900}
.hero .sub{color:#cbd5e1;font-size:14px;margin-top:8px}
.hero .badge{display:inline-block;margin-top:14px;padding:8px 16px;border-radius:999px;background:rgba(239,68,68,.15);border:1px solid #ef4444;color:#fca5a5;font-weight:800;font-size:13px}
.topbar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px}
.btn{padding:10px 18px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:14px;text-decoration:none;display:inline-block}
.btn-gold{background:#c9a84c;color:#14224f}.btn-navy{background:#1d4ed8;color:#fff}.btn-red{background:#dc2626;color:#fff}
.card{background:#0e1730;border:1px solid #22304f;border-radius:14px;padding:20px;margin-bottom:18px;page-break-inside:avoid}
.card h2{color:#fde68a;font-size:17px;font-weight:900;margin-bottom:12px;border-bottom:1px solid #334155;padding-bottom:8px}
.issue{background:#0b1220;border:1px solid #334155;border-radius:12px;padding:16px;margin-bottom:14px}
.issue .q{color:#fbbf24;font-weight:900;font-size:15px;margin-bottom:8px}
.issue .fix{color:#cbd5e1;font-size:14px}
.issue ol{padding-left:22px;margin-top:8px}
.issue li{margin:6px 0}
.tag{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800;margin-right:6px;margin-bottom:6px}
.tag-hod{background:rgba(59,130,246,.2);color:#93c5fd;border:1px solid #3b82f6}
.tag-mgmt{background:rgba(201,168,76,.2);color:#fde68a;border:1px solid #c9a84c}
.tag-all{background:rgba(168,85,247,.2);color:#d8b4fe;border:1px solid #a855f7}
.quick{background:linear-gradient(135deg,rgba(34,197,94,.12),rgba(30,64,175,.15));border:2px solid #22c55e;border-radius:14px;padding:20px;margin-bottom:18px}
.quick h2{color:#4ade80;font-size:18px;margin-bottom:10px}
.quick table{width:100%;border-collapse:collapse;font-size:13px;margin-top:10px}
.quick th,.quick td{border:1px solid #334155;padding:10px;text-align:left}
.quick th{background:#0b1220;color:#c9a84c}
.escalate{background:#1a0a0a;border:2px solid #ef4444;border-radius:14px;padding:20px;margin-bottom:18px}
.escalate h2{color:#f87171;font-size:18px;margin-bottom:8px}
.print-hint{background:#1e293b;border:1px dashed #c9a84c;border-radius:10px;padding:14px;font-size:13px;color:#fde68a;margin-bottom:18px}
@media print{
  .noprint{display:none!important}
  body{background:#fff;color:#000;font-size:12px}
  .wrap{max-width:100%;padding:0}
  .hero{background:#14224f!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .card,.issue,.quick,.escalate{border:1px solid #999;background:#fff;page-break-inside:avoid}
  .card h2,.issue .q,.hero h1{color:#14224f!important}
  .issue .fix,.card p,.card li{color:#222!important}
  a{color:#1d4ed8!important}
}
</style></head>
<body>
<div class="wrap">
  <div class="topbar noprint">
    <a href="${SITE}/mis-manual" class="btn btn-navy">← User Manual</a>
    <button class="btn btn-gold" onclick="window.print()">⬇ Save as PDF / Print</button>
    <a href="${SITE}/mis" class="btn btn-navy">MIS Sign In</a>
  </div>

  <div class="print-hint noprint">
    <b>How to save as PDF:</b> Click <b>Save as PDF / Print</b> above → choose <b>Save as PDF</b> (or Microsoft Print to PDF) → Save. Share that file with branches.
  </div>

  <div class="hero">
    <img src="${MIS_BRAND.logoUrl}" alt="Agile">
    <h1>Troubleshooting Booklet</h1>
    <div class="sub">Agile MIS — Quick fixes for Team Agile<br>Keep this with the User Manual at every branch</div>
    <div class="badge">${MIS_BRAND.corporateSiteLabel}</div>
  </div>

  <div class="quick">
    <h2>⚡ Quick Reference — Correct Links</h2>
    <table>
      <tr><th>What you need</th><th>Open this link</th></tr>
      <tr><td>User Manual (instructions)</td><td><a href="${SITE}/mis-manual">${SITE}/mis-manual</a></td></tr>
      <tr><td>Management sign-in</td><td><a href="${SITE}/mis">${SITE}/mis</a></td></tr>
      <tr><td>Branch daily report (HOD)</td><td><a href="${SITE}/mis-report">${SITE}/mis-report</a></td></tr>
      <tr><td>Register a complaint (public)</td><td><a href="${SITE}/register-complaint">${SITE}/register-complaint</a></td></tr>
      <tr><td>This troubleshooting booklet</td><td><a href="${SITE}/mis-troubleshooting">${SITE}/mis-troubleshooting</a></td></tr>
    </table>
    <p style="margin-top:12px;font-size:13px;color:#e2e8f0"><b>Always use www.agilegroup-digital.co.in</b> — not vercel.app or any other link.</p>
  </div>

  <div class="card">
    <h2>1 — Sign In &amp; PIN Problems</h2>

    <div class="issue">
      <div class="q"><span class="tag tag-all">Everyone</span> MIS opened automatically without asking for PIN</div>
      <div class="fix"><ol>
        <li>Click <b>Logout</b> (bottom left on management pages).</li>
        <li>Open <a href="${SITE}/mis?fresh=1">${SITE}/mis?fresh=1</a> — you must see the email + PIN screen.</li>
        <li>Sign-in now lasts <b>30 minutes</b> — then PIN is required again.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q"><span class="tag tag-all">Everyone</span> “Only @agilegroup.co.in email addresses can log in”</div>
      <div class="fix"><ol>
        <li>Use your <b>company email</b> ending in <b>@agilegroup.co.in</b> — not Gmail, Yahoo, or personal email.</li>
        <li>Example: <b>branchname@agilegroup.co.in</b></li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q"><span class="tag tag-all">Everyone</span> PIN not received in email</div>
      <div class="fix"><ol>
        <li>Check <b>Spam / Junk</b> folder.</li>
        <li>Wait 2 minutes — then click <b>Send PIN</b> again (do not click many times quickly).</li>
        <li>Confirm you typed the email correctly — no spaces.</li>
        <li>Director receives a copy — ask Director office if branch email is not working.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q"><span class="tag tag-all">Everyone</span> “Wrong or expired PIN”</div>
      <div class="fix"><ol>
        <li>PIN is valid for a short time only — click <b>← Change email</b> and request a <b>new PIN</b>.</li>
        <li>Enter all <b>6 digits</b> from the latest email only.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q"><span class="tag tag-mgmt">Management</span> Dashboard or report page sends me back to sign-in</div>
      <div class="fix"><ol>
        <li>Your 30-minute session expired — sign in again at <a href="${SITE}/mis">${SITE}/mis</a>.</li>
        <li>Use <b>www.agilegroup-digital.co.in</b> — not a saved vercel.app bookmark.</li>
      </ol></div>
    </div>
  </div>

  <div class="card">
    <h2>2 — Daily Branch Report (HOD)</h2>

    <div class="issue">
      <div class="q"><span class="tag tag-hod">Branch HOD</span> Cannot see my branch in the list</div>
      <div class="fix"><ol>
        <li>Contact management — branch must be added in <b>Master Directory</b>.</li>
        <li>Refresh the page after sign-in.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q"><span class="tag tag-hod">Branch HOD</span> Client missing from today’s table</div>
      <div class="fix"><ol>
        <li>Scroll to <b>Your Clients — Add / Edit / Deactivate</b> — check client is <b>Active</b>.</li>
        <li>If new client — click <b>+ Add Client</b>, fill details, save, then refresh report.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q"><span class="tag tag-hod">Branch HOD</span> “Submit” button does not work / error message</div>
      <div class="fix"><ol>
        <li>Fill <b>Your Name (submitting)</b> at the top.</li>
        <li>Every active client row needs numbers — Sanctioned, Absent, OT.</li>
        <li>Check internet connection — try again after 1 minute.</li>
        <li>If it still fails — take a screenshot and send to Director office.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q"><span class="tag tag-hod">Branch HOD</span> Report already submitted — need to correct numbers</div>
      <div class="fix"><ol>
        <li>Open same branch and <b>same date</b> — system loads the existing report for editing.</li>
        <li>Change the figures and click <b>Submit Daily Report</b> again.</li>
        <li>Do this before 2:00 PM if possible.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q"><span class="tag tag-hod">Branch HOD</span> Unit Issue Register not saving</div>
      <div class="fix"><ol>
        <li>Open from daily report page — button <b>📦 Unit Issue Register</b>.</li>
        <li>Fill <b>Next Issue Date</b> and <b>Remark</b> for each item.</li>
        <li>Click <b>Save</b> on the equipment tab before submitting the daily report.</li>
      </ol></div>
    </div>
  </div>

  <div class="card">
    <h2>3 — Complaints</h2>

    <div class="issue">
      <div class="q"><span class="tag tag-all">Everyone</span> Client cannot register complaint online</div>
      <div class="fix"><ol>
        <li>Use: <a href="${SITE}/register-complaint">${SITE}/register-complaint</a></li>
        <li>Select <b>branch</b>, fill name, mobile, and description (minimum 10 characters).</li>
        <li>No PIN needed for clients — only name and mobile.</li>
        <li>Save the <b>Complaint Code</b> shown on screen.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q"><span class="tag tag-mgmt">Management</span> Complaint not showing on dashboard</div>
      <div class="fix"><ol>
        <li>Open <b>Complaints</b> menu — check Open vs Closed tabs.</li>
        <li>New public complaints may take a few minutes to appear.</li>
        <li>Confirm branch was selected correctly on the form.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q"><span class="tag tag-hod">Branch HOD</span> Where to enter complaint count in daily report</div>
      <div class="fix"><ol>
        <li>In <b>Daily Summary</b> section — field <b>No. of Client Complaints / Incidents</b>.</li>
        <li>Also register full detail on <b>Register Complaint</b> page if not already done.</li>
      </ol></div>
    </div>
  </div>

  <div class="card">
    <h2>4 — Dashboard &amp; Reports (Management)</h2>

    <div class="issue">
      <div class="q"><span class="tag tag-mgmt">Management</span> Dashboard shows zero or empty</div>
      <div class="fix"><ol>
        <li>Check the <b>Report Date</b> at top — pick today’s date, click <b>Show</b>.</li>
        <li>If branches have not submitted by 2 PM, numbers will be low or empty — chase HODs.</li>
        <li>Try Logout → sign in again.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q"><span class="tag tag-mgmt">Management</span> MD Sir Report — branch shows “Awaiting submission”</div>
      <div class="fix"><ol>
        <li>That branch HOD has not submitted today’s report at <a href="${SITE}/mis-report">/mis-report</a>.</li>
        <li>Call the branch — refer to User Manual daily habit (by 2:00 PM).</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q"><span class="tag tag-mgmt">Management</span> Cannot send report by email</div>
      <div class="fix"><ol>
        <li>Use <b>Share by Email</b> button on MD Report or Client Performance.</li>
        <li>Type a valid email address when prompted.</li>
        <li>If error — email service may be busy; try again in 5 minutes.</li>
      </ol></div>
    </div>
  </div>

  <div class="card">
    <h2>5 — Phone, Internet &amp; Browser</h2>

    <div class="issue">
      <div class="q"><span class="tag tag-all">Everyone</span> Page looks broken or old version</div>
      <div class="fix"><ol>
        <li>Close the internet program completely and open again.</li>
        <li>Type the address fresh: <b>www.agilegroup-digital.co.in/mis</b></li>
        <li>On phone — use Chrome or Safari, not an old in-app browser.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q"><span class="tag tag-all">Everyone</span> “Network error” message</div>
      <div class="fix"><ol>
        <li>Check mobile data or Wi-Fi is working (try opening Google).</li>
        <li>Wait 1 minute and try again.</li>
        <li>Move to better signal area if on phone.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q"><span class="tag tag-all">Everyone</span> Yellow warning about vercel.app link</div>
      <div class="fix"><ol>
        <li>You are on the wrong address — close that tab.</li>
        <li>Open <b>www.agilegroup-digital.co.in</b> only.</li>
      </ol></div>
    </div>
  </div>

  <div class="escalate">
    <h2>🆘 When to Escalate to Director Office</h2>
    <p style="color:#fca5a5;font-size:14px;margin-bottom:10px">Contact Director office or IT support if:</p>
    <ul style="padding-left:22px;color:#e2e8f0;font-size:14px">
      <li>PIN never arrives after 3 tries (branch email may be blocked)</li>
      <li>Submit button fails repeatedly on a working internet connection</li>
      <li>Wrong deployment figures appear and cannot be corrected</li>
      <li>Any client data visible to outsiders (report immediately)</li>
    </ul>
    <p style="margin-top:12px;color:#fde68a;font-weight:800">${MIS_BRAND.corporateSiteLabel}</p>
    <p style="color:#cbd5e1;font-size:13px">Email: director@agilegroup.co.in · Website: ${MIS_BRAND.corporateSiteLabel}</p>
  </div>

  <div class="card" style="text-align:center">
    <p style="color:#94a3b8;font-size:13px">Version July 2026 · Agile MIS Troubleshooting Booklet<br>
    Pair with User Manual: <a href="${SITE}/mis-manual">${SITE}/mis-manual</a></p>
  </div>

  ${misPrintFooterBlock()}
</div>
</body></html>`

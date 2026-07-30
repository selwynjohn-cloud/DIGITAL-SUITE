import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fleetPublicFooter } from '../_lib/fleet/brand.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Fleet — Troubleshooting</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#e8f5f3;color:#1e293b;font-size:15px;line-height:1.55}
a{color:#0d9488}
.wrap{max-width:900px;margin:0 auto;padding:20px 16px 32px}
.topbar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px}
.btn{padding:10px 18px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:14px;text-decoration:none;display:inline-block}
.btn-teal{background:#0d9488;color:#fff}.btn-gold{background:#c9a84c;color:#14224f}
.hero{background:linear-gradient(135deg,#115e59,#0d9488);color:#fff;border-radius:16px;padding:28px 24px;margin-bottom:22px;border-top:3px solid #c9a84c;text-align:center}
.hero img{height:58px;margin-bottom:12px}
.hero h1{font-size:22px;color:#ccfbf1;font-weight:900}
.issue{background:#f8fafc;border:1px solid #5eead4;border-radius:12px;padding:16px;margin-bottom:14px}
.issue .q{color:#0f766e;font-weight:900;font-size:15px;margin-bottom:8px}
.issue .fix{color:#334155;font-size:14px}
.issue ol{padding-left:22px;margin-top:8px}
.issue li{margin:6px 0}
</style></head>
<body>
<div class="wrap">
  <div class="topbar">
    <a href="/fleet/manual" class="btn btn-teal">← User Manual</a>
    <a href="/fleets?portal=staff" class="btn btn-teal">Branch Portal</a>
    <button class="btn btn-gold" onclick="window.print()">Print / Save PDF</button>
  </div>
  <div class="hero">
    <img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile">
    <h1>Fleet Troubleshooting</h1>
  </div>
  <div class="issue">
    <div class="q">I cannot sign in — "Branch access not set up"</div>
    <div class="fix"><ol>
      <li>Use your <b>@agilegroup.co.in</b> work email only.</li>
      <li>Ask Fleet Management to add your email under <b>User Management</b> (Management Portal) with your correct branch.</li>
      <li>MIS HODs mapped to a branch can also sign in to Staff portal.</li>
    </ol></div>
  </div>
  <div class="issue">
    <div class="q">I see another branch's data</div>
    <div class="fix">You should only see your branch. Sign out and use <b>Staff / HOD</b> button (not Management). If problem continues, contact Head Office.</div>
  </div>
  <div class="issue">
    <div class="q">No vehicles on Weekly Report</div>
    <div class="fix"><ol>
      <li>Go to <b>Branch Vehicles Data</b> and add your vehicles first.</li>
      <li>Or ask Management to add vehicles in Vehicle Details portal.</li>
    </ol></div>
  </div>
  <div class="issue">
    <div class="q">Weekly report will not save</div>
    <div class="fix"><ol>
      <li>Fill <b>Submitted By</b> (your name).</li>
      <li>Check internet connection and try again.</li>
      <li>Sign out and sign in again if session expired.</li>
    </ol></div>
  </div>
  <div class="issue">
    <div class="q">Management portal says "branch staff only"</div>
    <div class="fix">Branch HODs use <b>Staff / HOD</b> on Command Centre. Management portal is for Director and Fleet administrators only.</div>
  </div>
  <div class="issue">
    <div class="q">Corporate Office — which driver to pick?</div>
    <div class="fix">Pick whichever driver used the vehicle that week from the dropdown. Drivers are not fixed to one vehicle at Corporate Office.</div>
  </div>
  ${fleetPublicFooter()}
</div>
</body></html>`

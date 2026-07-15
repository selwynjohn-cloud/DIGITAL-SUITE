import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fleetPublicFooter } from '../_lib/fleet/brand.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Fleet — User Manual</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#e8f5f3;color:#1e293b;font-size:15px;line-height:1.55}
a{color:#0d9488}
.wrap{max-width:920px;margin:0 auto;padding:20px 16px 32px}
.topbar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px}
.btn{padding:10px 18px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:14px;text-decoration:none;display:inline-block}
.btn-teal{background:#0d9488;color:#fff}.btn-gold{background:#c9a84c;color:#14224f}
.hero{background:linear-gradient(135deg,#115e59,#0d9488);color:#fff;border-radius:16px;padding:28px 24px;margin-bottom:22px;border-top:3px solid #c9a84c;text-align:center}
.hero img{height:64px;margin-bottom:12px}
.hero h1{font-size:24px;color:#ccfbf1;font-weight:900}
.hero .sub{color:#99f6e4;font-size:14px;margin-top:8px}
.card{background:#fff;border:3px solid #0d9488;border-radius:14px;padding:20px;margin-bottom:18px}
.card h2{color:#115e59;font-size:18px;font-weight:900;margin-bottom:10px}
.card h3{color:#0d9488;font-size:15px;font-weight:800;margin:14px 0 8px}
.card p,.card li{font-size:14px;color:#334155}
.card ul,.card ol{padding-left:22px;margin:8px 0}
.card li{margin:6px 0}
</style></head>
<body>
<div class="wrap">
  <div class="topbar">
    <a href="/fleets?portal=staff" class="btn btn-teal">← Branch Portal</a>
    <a href="/fleet/troubleshooting" class="btn btn-gold">Troubleshooting</a>
    <button class="btn btn-teal" onclick="window.print()">Print / Save PDF</button>
  </div>
  <div class="hero">
    <img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile">
    <h1>Agile Fleet — User Manual</h1>
    <p class="sub">HOD / Staff Branch Portal &amp; Management Portal</p>
  </div>
  <div class="card">
    <h2>1. How to sign in</h2>
    <ol>
      <li>Open <b>Command Centre</b> → click <b>Agile Fleet</b> → choose <b>Staff / HOD</b> or <b>Management</b>.</li>
      <li>Enter your <b>@agilegroup.co.in</b> work email.</li>
      <li>Enter the OTP sent to your email (or Master PIN if authorised).</li>
      <li>Branch staff see <b>only their branch</b>. Management sees all branches.</li>
    </ol>
  </div>
  <div class="card">
    <h2>2. Branch Portal menus (HOD / Staff)</h2>
    <h3>Branch Dashboard</h3>
    <p>Week number, branch name, each vehicle: insurance, PUC, KM run, fuel, maintenance, condition, next service, driver and licence renewal.</p>
    <h3>Weekly Vehicle Report</h3>
    <p>Submit every <b>Saturday before 5:00 PM</b>. Opening/closing meter, KM, fuel litres and cost, maintenance, tyre/battery change KM, traffic penalty.</p>
    <h3>Branch Vehicles Data</h3>
    <p>View your branch vehicles (read-only). Management Portal adds and updates vehicle data.</p>
    <h3>Drivers Details</h3>
    <p>View branch drivers (read-only). Management Portal maintains all driver records.</p>
    <h3>Fuel Charges &amp; Maintenance</h3>
    <p>View this week's fuel and maintenance from your submitted report.</p>
    <h3>Daily Pre-Trip Report</h3>
    <p>Complete before every trip (PTC-01 checklist). Branch is locked — you cannot see other branches.</p>
    <h3>Post-Trip Report</h3>
    <p>Complete after every trip. Pairs with pre-trip.</p>
    <h3>Branch Admin</h3>
    <p>Your branch summary and whether this week's report is submitted. <b>User Management</b> is in the Management Portal only — not in the branch menu.</p>
  </div>
  <div class="card">
    <h2>3. Management Portal (Director / Fleet Admin)</h2>
    <ol>
      <li><b>All Branch Dashboard</b> — all branches or pick one branch; fuel, KM, mileage (km/L), traffic penalties, renewal alerts.</li>
      <li><b>Saturday:</b> Branch submits weekly report → HOD gets analysis email immediately.</li>
      <li><b>Sunday 10 AM:</b> Consolidated report to Director/Management.</li>
      <li><b>Drivers Details</b> — add and maintain all company drivers (HOD portal is view-only).</li>
      <li><b>Vehicle Details</b> — add and maintain all vehicles (HOD portal is view-only).</li>
      <li><b>User Management</b> — register Director, Admin, HOD, Staff users (Management Portal only).</li>
    </ol>
  </div>
  <div class="card">
    <h2>4. Corporate Office note</h2>
    <p>At <b>Corporate Office</b>, vehicles are shared. Drivers are selected each week based on availability — not fixed to one vehicle. Use the Weekly Report driver dropdown each week.</p>
  </div>
  ${fleetPublicFooter()}
</div>
</body></html>`

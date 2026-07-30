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
<title>Agile MIS — User Manual</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#070d18;color:#e2e8f0;font-size:15px;line-height:1.55}
a{color:#c9a84c}
.wrap{max-width:960px;margin:0 auto;padding:20px 16px 40px}
.hero{background:linear-gradient(135deg,#14224f,#1e40af 60%,#0f172a);border-radius:16px;padding:28px 24px;margin-bottom:22px;border:1px solid rgba(201,168,76,.4);text-align:center}
.hero img{height:64px;margin-bottom:12px}
.hero h1{font-size:26px;color:#fde68a;font-weight:900}
.hero .sub{color:#cbd5e1;font-size:14px;margin-top:8px}
.hero .badge{display:inline-block;margin-top:14px;padding:8px 16px;border-radius:999px;background:rgba(201,168,76,.2);border:1px solid #c9a84c;color:#fde68a;font-weight:800;font-size:13px}
.card{background:#0e1730;border:1px solid #22304f;border-radius:14px;padding:20px;margin-bottom:18px}
.card h2{color:#fde68a;font-size:18px;font-weight:900;margin-bottom:10px;display:flex;align-items:center;gap:8px}
.card h3{color:#c9a84c;font-size:15px;font-weight:800;margin:14px 0 8px}
.card p,.card li{color:#cbd5e1;font-size:14px}
.card ul,.card ol{padding-left:22px;margin:8px 0}
.card li{margin:6px 0}
.callout{background:linear-gradient(135deg,rgba(34,197,94,.15),rgba(30,64,175,.2));border:2px solid #22c55e;border-radius:14px;padding:20px;margin-bottom:18px}
.callout h2{color:#4ade80;font-size:20px;margin-bottom:8px}
.callout p{color:#e2e8f0;font-size:15px}
.habit-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:12px}
.habit{background:#0b1220;border:1px solid #334155;border-radius:12px;padding:14px}
.habit .time{font-size:22px;font-weight:900;color:#fde68a}
.habit .who{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-top:4px}
.habit .task{font-size:13px;color:#e2e8f0;margin-top:8px;font-weight:600}
.links{width:100%;border-collapse:collapse;font-size:13px;margin-top:10px}
.links th,.links td{border:1px solid #334155;padding:10px;text-align:left}
.links th{background:#0b1220;color:#c9a84c;font-size:11px;text-transform:uppercase}
.links td a{font-weight:700}
.snap{border:2px solid #334155;border-radius:12px;overflow:hidden;margin:14px 0;background:#0b1220;box-shadow:0 8px 28px rgba(0,0,0,.35)}
.snap-bar{background:#111a30;padding:10px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #22304f}
.snap-dot{width:10px;height:10px;border-radius:50%}.snap-dot.r{background:#ef4444}.snap-dot.y{background:#f59e0b}.snap-dot.g{background:#22c55e}
.snap-title{color:#94a3b8;font-size:11px;margin-left:8px}
.snap-body{padding:14px}
.mock-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px}
.mock-k{background:linear-gradient(145deg,#1e3a8a,#1d4ed8);border-radius:10px;padding:10px;text-align:center}
.mock-k b{display:block;font-size:20px;color:#fff}.mock-k span{font-size:9px;color:#bfdbfe}
.mock-row{display:flex;justify-content:space-between;padding:8px 10px;border:1px solid #22304f;border-radius:8px;margin-bottom:6px;font-size:12px;background:#0e1730}
.mock-row b{color:#fff}
.mock-pie{width:100px;height:100px;border-radius:50%;margin:0 auto;background:conic-gradient(#22c55e 0 72%,#f59e0b 72% 88%,#ef4444 88% 100%);border:4px solid #0e1730}
.mock-btn{display:inline-block;padding:6px 12px;border-radius:7px;font-size:11px;font-weight:800;margin:4px 4px 0 0}
.mock-btn.gold{background:#c9a84c;color:#14224f}.mock-btn.green{background:#16a34a;color:#fff}.mock-btn.navy{background:#1d4ed8;color:#fff}
.role-tag{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800;margin-right:6px}
.role-hod{background:rgba(59,130,246,.2);color:#93c5fd;border:1px solid #3b82f6}
.role-mgmt{background:rgba(201,168,76,.2);color:#fde68a;border:1px solid #c9a84c}
.role-ops{background:rgba(34,197,94,.2);color:#86efac;border:1px solid #22c55e}
.role-all{background:rgba(168,85,247,.2);color:#d8b4fe;border:1px solid #a855f7}
.topbar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px}
.btn{padding:10px 18px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:14px;text-decoration:none;display:inline-block}
.btn-gold{background:#c9a84c;color:#14224f}.btn-navy{background:#1d4ed8;color:#fff}
@media print{.noprint{display:none!important}body{background:#fff;color:#000}.card,.callout,.snap{border:1px solid #ccc;background:#fff}.card h2,.card h3,.hero h1{color:#14224f!important}}
</style></head>
<body>
<div class="wrap">
  <div class="topbar noprint">
    <a href="/mis" class="btn btn-navy">← MIS Sign In</a>
    <button class="btn btn-gold" onclick="window.print()">⬇ Print / Save PDF</button>
  </div>

  <div class="hero">
    <img src="${MIS_BRAND.logoUrl}" alt="Agile">
    <h1>User Manual — Agile MIS</h1>
    <div class="sub">Daily Deployment, Compliance &amp; Command Centre<br>For all Team Agile — Branch HODs, Operations, Management &amp; Support</div>
    <div class="badge">Share this page with every branch · ${MIS_BRAND.siteLabel}</div>
    <div style="margin-top:18px">
      <a href="${SITE}/mis-report" class="btn btn-gold" style="font-size:16px;padding:14px 22px">✅ Submit Today's Daily MIS — Open Report Page</a>
    </div>
    <p style="margin-top:10px;font-size:13px;color:#86efac">Reading this manual is not enough — you must open the link above, fill the report, and press <b>Submit Daily Report</b>.</p>
  </div>

  <div class="callout">
    <h2>📝 Register Every Complaint — No Exceptions</h2>
    <p><b>Every client complaint, incident, or service concern must be registered in Agile MIS.</b> Silent complaints hurt our reputation. When you register, management sees it on the dashboard, SLA tracking begins, and the client knows we are serious about resolution.</p>
    <p style="margin-top:10px"><b>Who can register?</b> Branch HODs (in daily report), Operations staff, Management — and clients via the public link. <b>No complaint is too small.</b> Wrong uniform, late relief, equipment missing, supervisor behaviour — register it.</p>
    <p style="margin-top:10px">Public link for clients &amp; field staff: <a href="${SITE}/register-complaint">${SITE}/register-complaint</a><br>
    Management complaints board: <a href="${SITE}/mis-complaints">${SITE}/mis-complaints</a></p>
  </div>

  <div class="card">
    <h2>⏰ Daily Habits — Team Agile Discipline</h2>
    <p>These habits keep deployment honest, clients informed, and MD Sir's report accurate every evening.</p>
    <div class="habit-grid">
      <div class="habit"><div class="time">By 2:00 PM</div><div class="who">Branch HOD</div><div class="task">Submit Daily Branch Report at <a href="${SITE}/mis-report">/mis-report</a> — check the <b>report date is TODAY</b> before you press Submit.</div></div>
      <div class="habit"><div class="time">Same day</div><div class="who">Branch HOD</div><div class="task">Update Unit Issue Register (equipment tab) from the report page — note next issue date &amp; remark.</div></div>
      <div class="habit"><div class="time">5 visits/day</div><div class="who">Operations Staff</div><div class="task">Log client visits in MIS. Strategic &amp; High Value clients need day + night checks per SLA.</div></div>
      <div class="habit"><div class="time">When it happens</div><div class="who">Everyone</div><div class="task">Register complaints immediately — do not wait for weekly meetings.</div></div>
      <div class="habit"><div class="time">Saturday</div><div class="who">Management / Accounts</div><div class="task"><b>Outstanding statement</b> (client names, month-wise) — uploaded separately in Collection (DSO). <b>Weekly budget</b> for branches is taken from that statement.</div></div>
      <div class="habit"><div class="time">Each week</div><div class="who">Branch HOD</div><div class="task">On Daily Branch Report — enter <b>Weekly Budget</b> + Mon–Sat collected only (not client outstanding).</div></div>
      <div class="habit"><div class="time">6:00 AM &amp; 6:00 PM</div><div class="who">System</div><div class="task">Auto-sync <b>client visits</b>, <b>late start</b> &amp; <b>out-of-post</b> from Agile Mobile into MIS (shows on branch report; NA if no data).</div></div>
      <div class="habit"><div class="time">8:00 AM &amp; 8:00 PM</div><div class="who">System</div><div class="task">Sync <b>client complaints</b> from director mail inbox + <b>guard complaints</b> from Agile Guards into MIS.</div></div>
      <div class="habit"><div class="time">5:00 PM</div><div class="who">Pending HODs</div><div class="task">Email reminder — submit daily MIS before <b>2:00 PM</b> (same day).</div></div>
      <div class="habit"><div class="time">2:00 PM</div><div class="who">Director</div><div class="task">Alert email listing branches still <b>not submitted</b>.</div></div>
      <div class="habit"><div class="time">4:00 PM</div><div class="who">Director + HODs</div><div class="task">Consolidated MIS response email (all branches).</div></div>
      <div class="habit"><div class="time">7:00 PM</div><div class="who">Director</div><div class="task">Daily MIS summary — deployment %, pending branches, complaints.</div></div>
      <div class="habit"><div class="time">On submit</div><div class="who">Branch HOD</div><div class="task">Thank-you email with branch dashboard (PVC, visits, complaints) — sent to HOD email in User Management + Director.</div></div>
    </div>
  </div>

  <div class="card">
    <h2>📱 Automatic data on the Daily Branch Report</h2>
    <p>When a HOD opens <b>today's</b> report, the system tries to fill these from <b>Agile Mobile (Work360)</b> and <b>Master Directory</b>:</p>
    <ul>
      <li><b>Late Start</b> and <b>Out of Post</b> counts (per branch, for that day)</li>
      <li><b>Medical %</b> and <b>PVC %</b> from guard records in Master Directory</li>
      <li><b>Clients, locations, ops staff, sanctioned strength</b> from Master Directory (you may edit sanctioned posts — they save back to Master Directory on Submit)</li>
      <li><b>Absent &amp; OT</b> from yesterday's report (carried forward)</li>
    </ul>
    <p style="margin-top:10px">If mobile data is missing, the blue note shows <b>NA</b> and what to do. You may still type counts manually.</p>
  </div>

  <div class="card">
    <h2>👥 Who Uses What</h2>
    <table class="links">
      <thead><tr><th>Role</th><th>Main pages</th><th>Sign-in</th></tr></thead>
      <tbody>
        <tr><td><span class="role-tag role-hod">Branch HOD</span></td><td><a href="${SITE}/mis-report">Daily Branch Report</a>, Guard Compliance</td><td>Email OTP at report page</td></tr>
        <tr><td><span class="role-tag role-mgmt">Management</span></td><td><a href="${SITE}/mis-dashboard">Dashboard</a>, MD Report, Complaints, Collection, Admin</td><td>Email OTP at <a href="${SITE}/mis">/mis</a> (@agilegroup.co.in)</td></tr>
        <tr><td><span class="role-tag role-ops">Operations</span></td><td>Client Visits, Complaint registration</td><td>As assigned by branch</td></tr>
        <tr><td><span class="role-tag role-all">Clients / Public</span></td><td><a href="${SITE}/register-complaint">Register Complaint</a></td><td>No login — name &amp; mobile only</td></tr>
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>📸 Screen Guide — Dashboard</h2>
    <p><span class="role-tag role-mgmt">Management</span> Open <a href="${SITE}/mis-dashboard">/mis-dashboard</a> after sign-in. One screen for deployment, duty start, receivables, complaints &amp; vacant posts.</p>
    <div class="snap">
      <div class="snap-bar"><span class="snap-dot r"></span><span class="snap-dot y"></span><span class="snap-dot g"></span><span class="snap-title">agilegroup-digital.co.in/mis-dashboard</span></div>
      <div class="snap-body">
        <div style="color:#fde68a;font-weight:900;font-size:14px;margin-bottom:10px">Agile MIS Command Centre — Today</div>
        <div class="mock-kpi">
          <div class="mock-k"><b>28,412</b><span>Sanctioned</span></div>
          <div class="mock-k" style="background:linear-gradient(145deg,#14532d,#16a34a)"><b>26,891</b><span>Deployed</span></div>
          <div class="mock-k" style="background:linear-gradient(145deg,#78350f,#d97706)"><b>412</b><span>OT</span></div>
          <div class="mock-k" style="background:linear-gradient(145deg,#7f1d1d,#dc2626)"><b>1,109</b><span>Vacant</span></div>
        </div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
          <div class="mock-pie"></div>
          <div style="font-size:12px"><b style="color:#22c55e">● Deployed 94.6%</b><br><b style="color:#f59e0b">● OT 1.4%</b><br><b style="color:#ef4444">● Vacant 3.9%</b></div>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <h2>📸 Screen Guide — Daily Branch Report (HOD)</h2>
    <p><span class="role-tag role-hod">Branch HOD</span> This is the most important daily habit. URL: <a href="${SITE}/mis-report">/mis-report</a></p>
    <div class="snap">
      <div class="snap-bar"><span class="snap-dot r"></span><span class="snap-dot y"></span><span class="snap-dot g"></span><span class="snap-title">agilegroup-digital.co.in/mis-report</span></div>
      <div class="snap-body">
        <div class="mock-row"><b>HDFC Bank — MG Road</b><span>San 12 · Dep 11 · Vac 1</span></div>
        <div class="mock-row"><b>ITC Hotel — Residency</b><span>San 24 · Dep 24 · Vac 0</span></div>
        <div class="mock-row"><b>Totals</b><span style="color:#4ade80">Deployed 96%</span></div>
        <div style="margin-top:12px"><span class="mock-btn green">✅ Submit Daily Report</span><span class="mock-btn gold">📦 Unit Issue Register</span><span class="mock-btn navy">✉ Share Summary</span></div>
      </div>
    </div>
    <h3>Steps</h3>
    <ol>
      <li>Sign in with your <b>@agilegroup.co.in</b> email OTP.</li>
      <li>Select your branch and today's date.</li>
      <li>Fill deployment numbers for every active client (Sanctioned, Absent, OT).</li>
      <li>Enter collection %, PVC/medical %, complaint count, late start &amp; out-of-post cases.</li>
      <li>Open <b>Unit Issue Register</b> if any equipment needs Stores attention.</li>
      <li>Press <b>Submit Daily Report</b> before 2:00 PM.</li>
    </ol>
  </div>

  <div class="card">
    <h2>📸 Screen Guide — MD Sir Report</h2>
    <p><span class="role-tag role-mgmt">Management</span> Consolidated view for leadership — <a href="${SITE}/mis-md">/mis-md</a></p>
    <div class="snap">
      <div class="snap-bar"><span class="snap-dot r"></span><span class="snap-dot y"></span><span class="snap-dot g"></span><span class="snap-title">MD Sir Report — Section 2 Vacant Posts (clubbed by client)</span></div>
      <div class="snap-body">
        <div class="mock-row"><b>1. Large Bank Client</b><span style="color:#f87171">Vacant 48 · Fill 92%</span></div>
        <div class="mock-row"><b>2. Retail Chain</b><span style="color:#fbbf24">Vacant 22 · Fill 94%</span></div>
        <div style="margin-top:10px"><span class="mock-btn gold">✈ Send to MD Sir</span><span class="mock-btn navy">✉ Share by Email</span></div>
      </div>
    </div>
  </div>

  <div class="card">
    <h2>📸 Screen Guide — Register Complaints</h2>
    <p><span class="role-tag role-all">Everyone</span> Encourage clients and guards to use this — it protects Agile's reputation.</p>
    <div class="snap">
      <div class="snap-bar"><span class="snap-dot r"></span><span class="snap-dot y"></span><span class="snap-dot g"></span><span class="snap-title">agilegroup-digital.co.in/register-complaint</span></div>
      <div class="snap-body" style="font-size:13px">
        <div style="margin-bottom:8px;color:#94a3b8">Client name · Branch · Category · Description · Photo (optional)</div>
        <span class="mock-btn green">Submit Complaint</span>
        <p style="margin-top:10px;color:#4ade80;font-weight:700">✓ Complaint registered — reference number sent</p>
      </div>
    </div>
    <h3>Complaint categories</h3>
    <p>Deployment shortage · Late relief · Supervisor issue · Uniform / grooming · Equipment · Billing · Other — always add detail in the description box.</p>
  </div>

  <div class="card">
    <h2>📸 Screen Guide — Unit Issue &amp; SLA</h2>
    <p><span class="role-tag role-hod">HOD</span> Enter on daily report page. <span class="role-tag role-mgmt">Management</span> reads SLA analysis at <a href="${SITE}/mis-unit-issue">/mis-unit-issue</a>.</p>
    <div class="snap">
      <div class="snap-bar"><span class="snap-dot r"></span><span class="snap-dot y"></span><span class="snap-dot g"></span><span class="snap-title">Unit Equipment Issue Register</span></div>
      <div class="snap-body">
        <div class="mock-row"><b>Torch · Belt · Baton</b><span>Next issue: 12 Jul</span></div>
        <div class="mock-row"><b>Uniform set</b><span>Share Stores ✉</span></div>
      </div>
    </div>
  </div>

  <div class="card">
    <h2>⭐ Client Categories (MIS-wide)</h2>
    <ul>
      <li><b>Strategic Client</b> — 5★ — highest SLA, MD visibility, priority visits.</li>
      <li><b>High Value Client</b> — 3–4★ — strong SLA, regular ops visits.</li>
      <li><b>Valued Client</b> — 1–2★ — standard service, still fully tracked.</li>
    </ul>
  </div>

  <div class="card">
    <h2>🔗 Quick Links</h2>
    <table class="links">
      <thead><tr><th>Page</th><th>Link</th></tr></thead>
      <tbody>
        <tr><td>MIS Sign In (Management)</td><td><a href="${SITE}/mis">${SITE}/mis</a></td></tr>
        <tr><td>Dashboard</td><td><a href="${SITE}/mis-dashboard">${SITE}/mis-dashboard</a></td></tr>
        <tr><td>Daily Branch Report (HOD)</td><td><a href="${SITE}/mis-report">${SITE}/mis-report</a></td></tr>
        <tr><td>MD Sir Report</td><td><a href="${SITE}/mis-md">${SITE}/mis-md</a></td></tr>
        <tr><td>Register Complaint (public)</td><td><a href="${SITE}/register-complaint">${SITE}/register-complaint</a></td></tr>
        <tr><td>Complaints Board</td><td><a href="${SITE}/mis-complaints">${SITE}/mis-complaints</a></td></tr>
        <tr><td>Collection / DSO</td><td><a href="${SITE}/mis-collection">${SITE}/mis-collection</a></td></tr>
        <tr><td>Client Performance</td><td><a href="${SITE}/mis-client">${SITE}/mis-client</a></td></tr>
        <tr><td>User Manual (this page)</td><td><a href="${SITE}/mis-manual">${SITE}/mis-manual</a></td></tr>
        <tr><td>Troubleshooting Booklet</td><td><a href="${SITE}/mis-troubleshooting">${SITE}/mis-troubleshooting</a></td></tr>
      </tbody>
    </table>
    <p style="margin-top:12px;font-size:13px;color:#94a3b8">Always use <b>www.agilegroup-digital.co.in</b> in the address bar — not the vercel.app link.</p>
  </div>

  <div class="card">
    <h2>💬 Message to Team Agile</h2>
    <p>Agile MIS is our command centre — built so every branch, every client, and every complaint is visible to leadership in real time. <b>Your honest daily submission is what makes it work.</b></p>
    <p style="margin-top:10px">If something is wrong at a site, do not hide it — register it, fix it, and record the fix. That is the Agile way.</p>
    <p style="margin-top:10px;color:#c9a84c;font-weight:700">— Management · Agile Security Force Private Limited</p>
  </div>

  ${misPrintFooterBlock()}
</div>
</body></html>`

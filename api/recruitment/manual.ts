import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  RECRUIT_BRAND,
  RECRUIT_GOLD,
  RECRUIT_HDR_GRADIENT,
  RECRUIT_PURPLE,
} from '../_lib/recruitment/brand.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const SITE = 'https://www.agilegroup-digital.co.in'

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Recruitment — User Guide (Staff &amp; HOD)</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f3e8ff;color:#1e293b;font-size:15px;line-height:1.55}
a{color:#6d28d9}
.wrap{max-width:920px;margin:0 auto;padding:20px 16px 32px}
.topbar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px}
.btn{padding:10px 18px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:14px;text-decoration:none;display:inline-block}
.btn-purple{background:${RECRUIT_PURPLE};color:#fff}.btn-gold{background:${RECRUIT_GOLD};color:#14224f}
.hero{background:${RECRUIT_HDR_GRADIENT};color:#fff;border-radius:16px;padding:28px 24px;margin-bottom:22px;border-top:3px solid ${RECRUIT_GOLD};text-align:center}
.hero img{height:64px;margin-bottom:12px}
.hero h1{font-size:24px;color:#fde68a;font-weight:900}
.hero .sub{color:#e0f2fe;font-size:14px;margin-top:8px}
.card{background:#fff;border:3px solid ${RECRUIT_PURPLE};border-radius:14px;padding:20px;margin-bottom:18px;box-shadow:0 4px 16px rgba(124,58,237,.12)}
.card h2{color:#5b21b6;font-size:18px;font-weight:900;margin-bottom:10px}
.card h3{color:${RECRUIT_PURPLE};font-size:15px;font-weight:800;margin:14px 0 8px}
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
.links th,.links td{border:1px solid #c4b5fd;padding:10px;text-align:left}
.links th{background:#f5f3ff;color:#5b21b6;font-size:11px;text-transform:uppercase}
.role{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px}
.role .box{background:#faf5ff;border:1px solid #c4b5fd;border-radius:10px;padding:14px}
.role .box h3{margin-top:0}
.doc-ft{background:${RECRUIT_HDR_GRADIENT};border-top:3px solid ${RECRUIT_GOLD};border-radius:14px;padding:18px 16px;text-align:center;color:#e0f2fe;margin-top:8px}
.doc-ft .care{font-size:14px;font-weight:800;color:#fff;margin-bottom:8px}
.doc-ft .cursor{padding:10px 12px;background:rgba(255,255,255,.08);border-radius:8px;font-size:11px;line-height:1.55;font-style:italic;margin-top:10px}
.share-hint{background:#f5f3ff;border:1px dashed ${RECRUIT_PURPLE};border-radius:10px;padding:14px;font-size:13px;color:#5b21b6;margin-bottom:18px}
.toc a{display:block;padding:4px 0;font-weight:700;font-size:14px}
.menu-list{background:#0b1220;color:#e2e8f0;border-radius:10px;padding:14px 18px;font-size:13px;line-height:1.7;margin:10px 0}
.menu-list b{color:#fde68a}
@media(max-width:700px){.role{grid-template-columns:1fr}}
@media print{.noprint{display:none!important}body{background:#fff}.card,.sla{border:1px solid #999;box-shadow:none}}
</style></head>
<body>
<div class="wrap">
  <div class="topbar noprint">
    <a href="/recruitment?portal=staff" class="btn btn-purple">← Staff Portal</a>
    <a href="/recruitment?portal=management" class="btn btn-purple">Management Portal</a>
    <a href="/recruitment/troubleshooting" class="btn btn-purple">🔧 Troubleshooting</a>
    <button class="btn btn-gold" onclick="window.print()">⬇ Download / Print PDF</button>
    <button class="btn btn-purple" onclick="navigator.clipboard&&navigator.clipboard.writeText(location.href).then(function(){alert('Link copied — share with staff & HODs')})">Copy link to share</button>
  </div>
  <div class="share-hint noprint"><b>Attach to email:</b> Click <b>Download / Print PDF</b> → choose <b>Save as PDF</b>. Live link: <b>${SITE}/recruitment/manual</b></div>
  <div class="hero">
    <img src="${RECRUIT_BRAND.logoUrl}" alt="Agile">
    <h1>Agile Recruitment — User Guide</h1>
    <div class="sub">For Branch HOD · Recruiter · Staff · Management<br>App 02 · ${RECRUIT_BRAND.tagline}</div>
  </div>

  <div class="sla">
    <div class="badge">DAILY DUTY</div>
    <h2>Submit Daily Recruitment Report (DRR) every working day</h2>
    <p>Every branch must submit the Recruitment-specific <b>Daily Recruitment Report (DRR)</b>: full new-recruit details, transfers and resignations. <b>Updated 18 Aug 2026 — app working.</b></p>
    <ul>
      <li><b>Where (HOD / Staff):</b> Left menu → <b>Recruitment</b> → <b>Daily Recruitment Report (DRR) submission</b></li>
      <li><b>HOD:</b> No DRR History on the HOD menu (Management has History)</li>
      <li><b>Login:</b> Work email → Send PIN (not branch password first)</li>
      <li><b>Management:</b> Same Dashboard as HOD (All Branches available), plus DRR + DRR History</li>
    </ul>
  </div>

  <div class="card">
    <h2>Working today (18 Aug 2026)</h2>
    <ul>
      <li>Email-PIN login opens the suite Recruitment portal (not the old Google Script).</li>
      <li>Menu keeps Cumulative Referral Details, Sourcing Funnel, Recruitment format, Referral Incentives, detailed DRR.</li>
      <li>Public apply stays <b>www.securityjob.co.in</b>.</li>
      <li>HOD lists stay <b>their branch only</b>.</li>
    </ul>
  </div>

  <div class="card toc">
    <h2>Contents</h2>
    <a href="#who">1. Who uses which portal</a>
    <a href="#login">2. How to sign in</a>
    <a href="#menu">3. Left menu order (Staff)</a>
    <a href="#drr">4. How to submit DRR</a>
    <a href="#other">5. Other useful menus</a>
    <a href="#mgmt">6. Management portal</a>
    <a href="#links">7. Important links</a>
  </div>

  <div class="card" id="who">
    <h2>1. Who uses which portal?</h2>
    <div class="role">
      <div class="box">
        <h3>Staff / HOD Portal</h3>
        <p>Branch HOD · Recruiter · Branch recruitment staff</p>
        <p style="margin-top:8px">Open: <b>${SITE}/recruitment?portal=staff</b></p>
        <p style="margin-top:6px">Select your branch → email PIN → your branch data only</p>
      </div>
      <div class="box">
        <h3>Management Portal</h3>
        <p>Director · Recruitment HQ · Management</p>
        <p style="margin-top:8px">Open: <b>${SITE}/recruitment?portal=management</b></p>
        <p style="margin-top:6px">All branches · DRR summary · approvals · configuration</p>
      </div>
    </div>
    <p style="margin-top:12px"><b>Public apply form</b> (for candidates — no staff login): <a href="${RECRUIT_BRAND.publicFormUrl}" target="_blank">${RECRUIT_BRAND.publicFormUrl}</a></p>
  </div>

  <div class="card" id="login">
    <h2>2. How to sign in</h2>
    <h3>Staff / HOD</h3>
    <ol>
      <li>From Command Centre open <b>Agile Recruitment → HODs / Staff</b></li>
      <li>Select your <b>branch</b></li>
      <li>Enter your <b>@agilegroup.co.in</b> work email → <b>Send PIN</b></li>
      <li>Open your email inbox → enter the <b>6-digit PIN</b></li>
    </ol>
    <h3>Management</h3>
    <ol>
      <li>Open <b>Agile Recruitment → Management</b></li>
      <li>Work email → <b>Send PIN</b> → enter code from inbox</li>
    </ol>
    <p style="margin-top:10px">Always use <b>www.agilegroup-digital.co.in</b> (not an old Google or vercel.app bookmark).</p>
  </div>

  <div class="card" id="menu">
    <h2>3. Left menu order (Staff)</h2>
    <p>DRR is kept at the <b>bottom</b> of the menu (after Publicity &amp; Camps).</p>
    <div class="menu-list">
      📊 Dashboard<br>
      📌 Request for Manpower<br>
      📱 Security Job — Registered List<br>
      🚶 Walk-in Pipeline<br>
      🔗 Cumulative Referral Details<br>
      📣 Sourcing Channels<br>
      👥 Guard Pipeline<br>
      🔄 Roster &amp; Join-Backs<br>
      📨 Training EOI Follow-up<br>
      📢 Publicity &amp; Camps<br>
      <b>📋 Daily Recruitment Report (DRR)</b> ← scroll here<br>
      <b>📁 DRR History</b>
    </div>
  </div>

  <div class="card" id="drr">
    <h2>4. How to submit DRR</h2>
    <ol>
      <li>Sign in to <b>Staff</b> portal for your branch</li>
      <li>On the left menu, scroll to the <b>bottom</b></li>
      <li>Tap <b>Daily Recruitment Report (DRR)</b></li>
      <li>Choose the <b>report date</b> (calendar picker)</li>
      <li>Select company <b>All</b> (view), or <b>Agile</b> / <b>Sparks</b> to add names</li>
      <li>Enter each <b>new recruit</b>: employee ID, name, designation, mobile, DOJ, client, location, Referred by and the other required details</li>
      <li>Add any <b>Transfers</b> and <b>Resignations</b></li>
      <li>Enter <b>Submitted by</b>, then tap <b>Review &amp; Save Detailed DRR</b></li>
      <li>Open <b>DRR History</b> (next item at the bottom) to confirm it appears</li>
    </ol>
    <h3>Branch rule</h3>
    <p>Branch users enter their own branch report. Management can choose any branch and view all detailed reports.</p>
    <h3>Correct Recruitment format</h3>
    <p>This is the <b>ASFPL / SSMS Daily Recruitment Details</b> format. It is not the short walk-ins / screened / selected count form.</p>
  </div>

  <div class="card" id="other">
    <h2>5. Other useful menus</h2>
    <ul>
      <li><b>Request for Manpower</b> — ask HQ for guards needed at a site</li>
      <li><b>Security Job — Registered List</b> — Call 1 + tentative date (App team) → Call 2 + WhatsApp invitation draft (App team) → Call 3 + Joined date or Hold on reminder (Recruitment). Calendar dates save at once and are never deleted.</li>
      <li><b>Security News - Registered List</b> — name + mobile of people who answered the Security News question (last come first)</li>
      <li><b>Walk-in Pipeline</b> — add walk-in candidates; fill <b>Referred by name</b> when someone referred them</li>
      <li><b>Cumulative Referral Details</b> — all Referred by names from Daily Recruitment Reports (all dates), grouped by referrer</li>
      <li><b>Guard Pipeline</b> — move applicants through Applied → Deployed</li>
      <li><b>Roster &amp; Join-Backs</b> — log absentees and rejoins</li>
      <li><b>Training EOI Follow-up</b> — EOI / EOI DOJ replies from Agile Training WhatsApp (join-back dates)</li>
      <li><b>Publicity &amp; Camps</b> — public apply link, WhatsApp share, SecurityJob</li>
    </ul>
  </div>

  <div class="card" id="mgmt">
    <h2>6. Management portal</h2>
    <p>Also on Management (and Staff):</p>
    <ul>
      <li><b>Training EOI Follow-up</b> — same list as Staff; mark Contacted / Rejoined / Closed</li>
      <li><b>Absconder List (7+ days)</b> — long absences from mobile attendance</li>
    </ul>
    <p>Near the <b>bottom</b> of the Management left menu:</p>
    <ul>
      <li><b>Daily Recruitment Report (DRR)</b> — submit / correct for any branch (choose branch)</li>
      <li><b>DRR Daily Summary</b> — today’s status for all branches</li>
      <li><b>DRR History</b> — past reports (filter by branch)</li>
      <li><b>DRR Thank You Email</b> — preview the branch thank-you mail</li>
    </ul>
  </div>

  <div class="card" id="links">
    <h2>7. Important links</h2>
    <table class="links">
      <tr><th>Need</th><th>Open</th></tr>
      <tr><td>Staff / HOD portal</td><td>${SITE}/recruitment?portal=staff</td></tr>
      <tr><td>Management portal</td><td>${SITE}/recruitment?portal=management</td></tr>
      <tr><td>This User Guide</td><td>${SITE}/recruitment/manual</td></tr>
      <tr><td>Troubleshooting</td><td>${SITE}/recruitment/troubleshooting</td></tr>
      <tr><td>Public apply (candidates)</td><td>${RECRUIT_BRAND.publicFormUrl}</td></tr>
      <tr><td>SecurityJob.co.in</td><td>${RECRUIT_BRAND.securityJobUrl}</td></tr>
      <tr><td>Helpline</td><td>${RECRUIT_BRAND.helpline}</td></tr>
    </table>
  </div>

  <div class="doc-ft">
    <div class="care">${RECRUIT_BRAND.product} — ${RECRUIT_BRAND.company}</div>
    <div><a href="${RECRUIT_BRAND.footerSite}" style="color:${RECRUIT_GOLD};text-decoration:none">${RECRUIT_BRAND.footerSiteLabel}</a></div>
    <div class="cursor">${RECRUIT_BRAND.footerCredit} · Confidential internal guide</div>
  </div>
</div>
</body></html>`

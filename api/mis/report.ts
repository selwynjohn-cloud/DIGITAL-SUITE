import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hodLoginHtml, otpLoginScript } from '../_lib/embedded-otp.js'
import { hodBootFromRequest, hodBootScriptJson } from '../_lib/hod-session.js'
import { MIS_STAFF_CSS } from '../_lib/mis/staff-theme.js'
import { MIS_STAFF_LAYOUT_CSS, misStaffSidebarHtml, MIS_STAFF_SESSION_JS } from '../_lib/mis/staff-layout.js'
import { UNIT_ISSUE_ITEMS } from '../_lib/mis/unit-issue.js'
import { misFooterText, misPrintFooterBlock } from '../_lib/mis/brand.js'

const UI_ITEMS_JS = JSON.stringify(UNIT_ISSUE_ITEMS)
const SHARE_FOOTER_JS = JSON.stringify(misFooterText())
const PRINT_FOOTER_HTML = misPrintFooterBlock()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const boot = await hodBootFromRequest(req)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(
    PAGE.replace('__UI_ITEMS__', UI_ITEMS_JS).replace('__HOD_BOOT_JSON__', hodBootScriptJson(boot)),
  )
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Daily Branch Report</title>
<script>window.__HOD_BOOT__=__HOD_BOOT_JSON__;if(window.__HOD_BOOT__&&window.__HOD_BOOT__.sessionToken){document.documentElement.classList.add('hod-signed-in');}</script>
<style>
${MIS_STAFF_CSS}
${MIS_STAFF_LAYOUT_CSS}
.staff-shell .top{display:none}
.staff-shell .wrap{max-width:1180px}
html.hod-signed-in #loginWrap{display:none!important}
html.hod-signed-in #staffShell{display:flex!important}
html.hod-signed-in #reportLoading:not(.hidden){display:flex!important}
.hod-load-panel{max-width:520px;margin:48px auto;padding:28px 24px;text-align:center;background:#0e1730;border:1px solid #334155;border-radius:14px;flex-direction:column;align-items:center;gap:14px}
.hod-spinner{width:52px;height:52px;border:5px solid #334155;border-top-color:#c9a84c;border-radius:50%;animation:hodSpin .9s linear infinite}
@keyframes hodSpin{to{transform:rotate(360deg)}}
.hod-load-title{color:#fde68a;font-size:17px;font-weight:800}
.hod-load-step{color:#94a3b8;font-size:13px;line-height:1.5;min-height:2.8em}
.field-hint{font-size:11px;color:#64748b;margin-top:3px;line-height:1.35}
.field-auto{color:#4ade80}
.field-manual{color:#fbbf24}
.field-attn{color:#f87171;font-weight:600}
.section-hidden{display:none!important}
html.report-embed .staff-side,html.report-embed .staff-bar{display:none!important}
html.report-embed .top,html.report-embed body>p{display:none!important}
html.report-embed .staff-main{margin-left:0!important;width:100%!important}
html.report-embed .staff-shell .wrap{max-width:100%}
</style></head>
<body>
<script>try{var t=sessionStorage.getItem('otp_mis-report');if(t&&!document.documentElement.classList.contains('hod-signed-in'))document.documentElement.classList.add('hod-signed-in');}catch(e){}</script>
<p style="max-width:640px;margin:10px auto 0;padding:12px 14px;border-radius:10px;background:#0e1730;border:1px solid #22c55e;text-align:center;font-size:13px;color:#cbd5e1;line-height:1.55">
  <b style="color:#4ade80">Official MIS only</b> — Old <b>Manus / Railway</b> system is <b style="color:#f87171">CLOSED</b>. Open App <b>05</b> → white button <b>HODs / Staff</b> · Select branch · Enter your <b>branch password</b>.
  <br><a href="/mis-staff?fresh=1" style="color:#fde68a;font-weight:800">Open HOD Portal (fresh sign-in)</a>
</p>
<div class="top"><img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile"><div><h1>Agile MIS — Daily Branch Report<small>DEPLOYMENT (REPORT 1a)</small></h1></div></div>

<div id="loginWrap">
${hodLoginHtml('Agile MIS', 'Daily Branch Report — branch HOD sign in')}
<div id="branchStep" class="card hidden" style="margin-top:12px">
  <div class="hint">Select your branch and report date — or pick a menu item on the left after opening.</div>
  <label>Branch</label><select id="branch"></select>
  <label>Report for date</label><input id="dateFor" type="date">
  <div id="mondayBacklog" class="hidden" style="margin-top:10px;padding:12px 14px;border-radius:10px;background:rgba(245,158,11,.15);border:2px solid #f59e0b;color:#fde68a;font-size:14px;line-height:1.55">
    <b>Monday catch-up:</b> Also submit <b>Saturday</b> and <b>Sunday</b> reports today. Change the date above to <span id="satDate"></span> or <span id="sunDate"></span>, then open the report.
  </div>
  <p class="hint" style="margin-top:6px;color:#fbbf24">⚠ Usually this must be <b>today's date</b>. If yesterday's date is still showing, change it before you submit.</p>
  <div style="margin-top:14px"><button class="btn g" id="btnOpenReport" onclick="openReport()" disabled>Loading branches…</button></div>
  <div id="branchLoadMsg" class="hint" style="margin-top:8px;color:#94a3b8"></div>
  <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
    <a class="btn grey btn-sm" href="/mis-staff" style="text-decoration:none">📊 Branch Dashboard</a>
    <a class="btn grey btn-sm" href="/mis-guard-docs" style="text-decoration:none">🛡 Guard Docs</a>
  </div>
</div>
</div>

<div id="staffShell" class="staff-shell hidden">
${misStaffSidebarHtml('/mis-report')}
<div class="staff-main">
<div class="staff-bar noprint"><div style="display:flex;align-items:center;gap:12px"><button type="button" class="staff-burger" onclick="document.getElementById('staffSide').classList.toggle('open')">☰ Menu</button><div><b>Daily MIS Submission</b><div class="co">Submit your branch report — feeds Management consolidated MIS</div></div></div><span class="staff-branch-tag" id="staffBranchTag">Branch</span></div>
<div class="staff-content">
<div id="reportLoading" class="hod-load-panel hidden">
  <div class="hod-spinner" aria-hidden="true"></div>
  <div class="hod-load-title">Opening Daily MIS Submission…</div>
  <p id="reportLoadingMsg" class="hod-load-step">Please wait — loading your branch report.</p>
  <p id="reportLoadingStep" class="hod-load-step" style="color:#64748b;font-size:12px"></p>
  <button type="button" class="btn grey btn-sm hidden" id="reportLoadingRetry" onclick="OPEN_REPORT_BUSY=false;openReport(true)">Try again</button>
</div>
<div id="app" class="hidden"><div class="wrap">
  <div class="card">
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;align-items:center">
      <div><h2 id="hdr" style="color:#fde68a"></h2><div class="hint" id="subhdr"></div></div>
      <div style="min-width:200px"><label>Your Name (submitting)</label><input id="submittedBy" placeholder="e.g. Branch Manager name" oninput="updateDashCheck()"></div>
    </div>
    <div id="dateWarn" class="hidden" style="margin:12px 0;padding:12px 14px;border:2px solid #f59e0b;border-radius:10px;background:rgba(245,158,11,.12);color:#fde68a;font-size:14px">
      ⚠ Report date is <b id="dateWarnVal"></b> but <b>today is <span id="dateWarnToday"></span></b> — management will not see this under today's submissions.
      <button class="btn gold btn-sm" style="margin-left:10px" onclick="setReportToday()">Use Today's Date</button>
    </div>

    <nav id="reportNav" class="report-nav" style="margin:14px 0;display:flex;gap:8px;flex-wrap:wrap">
      <a class="btn gold btn-sm" href="#deploy" style="text-decoration:none">1. Deployment Submission</a>
      <a class="btn grey btn-sm" href="#clients" style="text-decoration:none">2. Your Sites</a>
      <a class="btn grey btn-sm" href="#summary" style="text-decoration:none">3. Daily Summary</a>
    </nav>

    <div id="stepNavBar" class="hidden noprint" style="margin-bottom:14px;padding:12px 14px;background:#0e1730;border:1px solid #c9a84c;border-radius:10px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <a href="/mis-staff-daily" class="btn grey btn-sm" style="text-decoration:none">← All 3 steps</a>
      <span id="stepNavLabel" style="color:#fde68a;font-weight:800;font-size:14px"></span>
      <span style="flex:1"></span>
      <button type="button" id="stepNavAction" class="btn gold btn-sm hidden"></button>
    </div>

    <div id="deploy" class="deploy-box" style="margin:16px 0;padding:16px;background:rgba(20,34,79,.55);border:2px solid #c9a84c;border-radius:12px">
      <h3 style="color:#fde68a;margin-bottom:6px">📋 Deployment Submission — Report 1a</h3>
      <div class="hint" style="margin-bottom:10px">Enter <b>Absent</b> and <b>OT</b> for each <b>site</b> and shift. Sanctioned posts are pre-filled from your Data Bank.</div>
      <div id="deployEmpty" class="hidden" style="margin-bottom:12px;padding:12px 14px;border:2px solid #f59e0b;border-radius:10px;background:rgba(245,158,11,.15);color:#fde68a;font-size:14px;line-height:1.5">
        <b>No deployment rows yet.</b> Add sites below with <b>+ Add Site</b>, or ask Head Office to load your branch in the Master Directory.
        <button class="btn gold btn-sm" style="margin-left:8px;margin-top:6px" onclick="openClientModal()">+ Add Site</button>
      </div>
      <div class="totbar">
        <div><b id="tSan">0</b><span>Sanctioned</span></div>
        <div><b id="tAbs">0</b><span>Absent</span></div>
        <div><b id="tOt">0</b><span>OT</span></div>
        <div><b id="tDep">0</b><span>Deployed</span></div>
        <div><b id="tVac">0</b><span>Vacant</span></div>
      </div>
      <div class="hint" style="margin-bottom:6px">↔ Scroll right for shift columns — <b>Client, Site &amp; Staff stay fixed</b> on the left. ↕ Header row stays fixed when scrolling down.</div>
      <div class="tblwrap-deploy"><table id="deployTbl">
        <thead>
          <tr>
            <th rowspan="2" class="freeze-h freeze-num">#</th><th rowspan="2" class="freeze-h freeze-client">Client</th><th rowspan="2" class="freeze-h freeze-loc">Site / Unit</th><th rowspan="2" class="freeze-h freeze-staff">Staff</th>
            <th colspan="5" class="grp-a" style="color:#93c5fd">A / DAY</th>
            <th colspan="5" class="grp-g" style="color:#fde047">GENERAL</th>
            <th colspan="5" class="grp-b" style="color:#86efac">B SHIFT</th>
            <th colspan="5" class="grp-c" style="color:#fca5a5">C / NIGHT</th>
            <th rowspan="2">Total<br>Vacant</th>
          </tr>
          <tr>
            <th class="grp-a">San</th><th class="grp-a">Abs</th><th class="grp-a">OT</th><th class="grp-a">Dep</th><th class="grp-a">Vac</th>
            <th class="grp-g">San</th><th class="grp-g">Abs</th><th class="grp-g">OT</th><th class="grp-g">Dep</th><th class="grp-g">Vac</th>
            <th class="grp-b">San</th><th class="grp-b">Abs</th><th class="grp-b">OT</th><th class="grp-b">Dep</th><th class="grp-b">Vac</th>
            <th class="grp-c">San</th><th class="grp-c">Abs</th><th class="grp-c">OT</th><th class="grp-c">Dep</th><th class="grp-c">Vac</th>
          </tr>
        </thead>
        <tbody id="rows"></tbody>
      </table></div>
      <div class="hint">Deployed = San − (Abs − OT), Vacant = San − Deployed.</div>
    </div>

    <div id="clients" class="clmgmt">
      <h3>Your Sites — Add / Edit / Deactivate</h3>
      <div class="hint">Manage deployment <b>sites</b> for your branch (one client may have many sites). Inactive sites are hidden from today's entry table.</div>
      <div style="margin:10px 0;display:flex;gap:8px;flex-wrap:wrap"><button class="btn g btn-sm" onclick="openClientModal()">+ Add Site</button><button class="btn gold btn-sm" onclick="toggleUnitIssue()">📦 Unit Issue Register</button></div>
      <p class="hint" style="margin-bottom:10px">You may change <b>Sanctioned</b> posts when the client changes security need — saved to Master Directory when you submit. <b>Absent</b> and <b>OT</b> carry forward to tomorrow's report.</p>
    <div class="tblwrap"><table style="min-width:1000px;font-size:13px">
        <thead><tr>
          <th>Client</th><th>Site / Unit</th><th>Ops Staff</th><th>San A/G/B/C</th><th>SLA Day</th><th>SLA Night</th><th>Stars</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody id="clientMgmt"></tbody>
      </table></div>
    </div>

    <div id="unitIssuePanel" class="hidden" style="margin:18px 0;padding:14px;border:2px solid #c9a84c;border-radius:10px;background:#0e1730">
      <h3 style="color:#fde68a;margin-bottom:8px">Unit Issue Register <small style="font-weight:600;color:#94a3b8">(HOD entry)</small></h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
        <button class="btn gold btn-sm" id="uiTab1" onclick="uiTab('equip')">1. Unit Equipment Issue Register</button>
        <button class="btn grey btn-sm" id="uiTab2" onclick="uiTab('sla')">2. Equipment Issues as per SLA</button>
      </div>
      <div id="uiEquip"></div>
      <div id="uiSla" class="hidden"></div>
      <div style="margin-top:10px;display:flex;gap:8px"><button class="btn green btn-sm" onclick="saveUnitIssue()">💾 Save Equipment Register</button><button class="btn green btn-sm" onclick="saveSlaIssue()">💾 Save SLA Issues</button></div>
      <div id="uiMsg" class="hint" style="margin-top:8px"></div>
    </div>

    <div id="collectionBlock">
    <h3 id="summaryBlockStart" style="color:#fde68a;margin:18px 0 4px">Weekly Collection Plan <small style="font-weight:600;color:#94a3b8">(₹ Lakhs)</small></h3>
    <div class="hint" style="margin-bottom:10px"><b>Weekly Budget</b> is your collection target for this week (from the outstanding statement — branch total only). Enter what you <b>collected each day</b> (Mon–Sat). This is saved automatically when you <b>Submit Daily Report</b>. <b>Client-wise outstanding</b> is uploaded separately by Management — not here.</div>
    <div class="sumgrid">
      <div><label>Weekly Budget (L)</label><input id="colBudget" inputmode="decimal" placeholder="Target for this week" oninput="fillCollectionPct()"></div>
      <div><label>Mon collected</label><input id="colMon" inputmode="decimal" oninput="fillCollectionPct()"></div>
      <div><label>Tue collected</label><input id="colTue" inputmode="decimal" oninput="fillCollectionPct()"></div>
      <div><label>Wed collected</label><input id="colWed" inputmode="decimal" oninput="fillCollectionPct()"></div>
      <div><label>Thu collected</label><input id="colThu" inputmode="decimal" oninput="fillCollectionPct()"></div>
      <div><label>Fri collected</label><input id="colFri" inputmode="decimal" oninput="fillCollectionPct()"></div>
      <div><label>Sat collected</label><input id="colSat" inputmode="decimal" oninput="fillCollectionPct()"></div>
    </div>
    <div style="margin:10px 0 16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <button class="btn gold btn-sm" onclick="saveCollection()">💾 Save Weekly Collection</button>
      <span id="colHint" class="hint"></span>
    </div>
    </div>

    <div id="summaryBlock">
    <h3 id="summary" style="color:#fde68a;margin:18px 0 4px">Daily Summary <small style="font-weight:600;color:#94a3b8">— needed for Management Dashboard</small></h3>
    <div class="hint" style="margin-bottom:10px">Green labels = <b>auto-filled</b> from Agile Mobile, Guard Docs, Recruitment, or Complaints register. Amber = <b>type manually</b> if blank. Enter <b>0</b> if none. All fields are required before submit.</div>
    <div id="dutyStats" class="hint" style="display:none;margin-bottom:12px;padding:12px 14px;border:1px solid #334155;border-radius:10px;background:#0e1730;line-height:1.6"></div>
    <div id="mobileHint" class="hint" style="display:none;margin-bottom:10px;color:#93c5fd;border:1px solid #334155;border-radius:8px;padding:10px 12px"></div>
    <div style="color:#fde68a;font-weight:700;font-size:13px;margin:12px 0 8px;border-bottom:1px solid #334155;padding-bottom:6px">Operations Visits — Agile Mobile / Work360</div>
    <div class="sumgrid">
      <div><label>Operations Visits (Day)</label><input id="dayVisits" inputmode="numeric" placeholder="Day patrol visits" oninput="updateDashCheck()"><div id="hint-dayVisits" class="field-hint field-manual">Agile Mobile / Work360</div></div>
      <div><label>Night Checks</label><input id="nightChecks" inputmode="numeric" placeholder="Night check visits" oninput="updateDashCheck()"><div id="hint-nightChecks" class="field-hint field-manual">Agile Mobile / Work360</div></div>
      <div><label>Trained Sites</label><input id="trainedSites" inputmode="numeric" placeholder="Training visits" oninput="updateDashCheck()"><div id="hint-trainedSites" class="field-hint field-manual">Agile Mobile / Work360</div></div>
    </div>
    <div style="color:#fde68a;font-weight:700;font-size:13px;margin:16px 0 8px;border-bottom:1px solid #334155;padding-bottom:6px">Duty Discipline — separate fields (Agile Mobile / Work360)</div>
    <div class="sumgrid">
      <div><label>Late Start Duty (cases)</label><input id="lateStartCases" inputmode="numeric" placeholder="Late start only" style="border-color:#f59e0b" oninput="updateDashCheck()"><div id="hint-lateStartCases" class="field-hint field-manual">Agile Mobile / Work360 — Late Start</div></div>
      <div><label>Left Post / Out of Post (cases)</label><input id="outOfPostCases" inputmode="numeric" placeholder="Out of post only" style="border-color:#ef4444" oninput="updateDashCheck()"><div id="hint-outOfPostCases" class="field-hint field-manual">Agile Mobile / Work360 — Out of Post</div></div>
    </div>
    <div style="color:#fde68a;font-weight:700;font-size:13px;margin:16px 0 8px;border-bottom:1px solid #334155;padding-bottom:6px">Guard Compliance (Guard Docs register)</div>
    <div class="sumgrid">
      <div><label>Medical Fitness %</label><input id="medicalFitnessPct" inputmode="decimal" oninput="updateDashCheck()"><div id="hint-medicalFitnessPct" class="field-hint field-manual">Guard Docs — or type manually</div></div>
      <div><label>PVC Upload %</label><input id="pvcPct" inputmode="decimal" oninput="updateDashCheck()"><div id="hint-pvcPct" class="field-hint field-manual">Guard Docs — or type manually</div></div>
      <div><label>PSARA / Training Cert %</label><input id="psaraPct" inputmode="decimal" oninput="updateDashCheck()"><div id="hint-psaraPct" class="field-hint field-manual">Guard Docs — or type manually</div></div>
    </div>
    <div style="color:#fde68a;font-weight:700;font-size:13px;margin:16px 0 8px;border-bottom:1px solid #334155;padding-bottom:6px">HR, Collection &amp; Complaints</div>
    <div class="sumgrid">
      <div><label>Weekly Collection %</label><input id="weeklyCollectionPct" inputmode="decimal" oninput="syncCollectionPct();updateDashCheck()"><div id="hint-weeklyCollectionPct" class="field-hint field-manual">Mon–Sat collected ÷ weekly budget</div></div>
      <div><label>Consolidated Collection %</label><input id="consolidatedCollectionPct" inputmode="decimal" oninput="updateDashCheck()"><div id="hint-consolidatedCollectionPct" class="field-hint field-manual">Finance upload — billing vs outstanding</div></div>
      <div><label>Resignation (cases)</label><input id="resignation" inputmode="numeric" placeholder="Guards resigned" oninput="updateDashCheck()"><div id="hint-resignation" class="field-hint field-manual">Recruitment / Guard Docs</div></div>
      <div><label>Recruitment (open)</label><input id="recruitment" inputmode="numeric" placeholder="Open positions" oninput="updateDashCheck()"><div id="hint-recruitment" class="field-hint field-manual">Recruitment app</div></div>
      <div><label>Guard Complaints</label><input id="guardComplaints" inputmode="text" placeholder="solved / registered e.g. 2/5" oninput="updateDashCheck()"><div id="hint-guardComplaints" class="field-hint field-manual">Agile Guards — solved / registered (running)</div></div>
      <div><label>Client Complaints</label><input id="clientComplaints" inputmode="text" placeholder="solved / registered e.g. 1/3" oninput="updateDashCheck()"><div id="hint-clientComplaints" class="field-hint field-manual">Director mail @agilegroup.co.in — solved / registered</div></div>
    </div>
    <input type="hidden" id="collectionPct">
    <label>Remarks / Solved</label><input id="remarks" placeholder="Any remarks, actions taken, issues solved">
    </div>

    <div id="submitBlock">
    <div id="dashCheck" class="hint" style="margin-bottom:10px;padding:10px 12px;border:1px solid #334155;border-radius:8px;background:#0e1730;line-height:1.55"></div>
    <div id="saveMsg" class="msg"></div>
    <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
      <button id="btnSubmitReport" class="btn green" onclick="submitReport()">✅ Submit Daily Report</button>
      <button class="btn grey" onclick="location.reload()">Change Branch</button>
      <a class="btn grey" href="/mis-guard-docs" style="text-decoration:none">🛡 Guard Compliance</a>
      <button class="btn gold" onclick="shareSummary()">✉ Share Summary</button>
    </div>
    <p class="hint" style="margin-top:10px">Submit saves deployment, weekly collection, and daily summary together — all feed the Management Dashboard.</p>
    </div>
  </div>
</div></div>
</div></div></div>
${PRINT_FOOTER_HTML}

<div id="clientModal" class="modal hidden" onclick="if(event.target===this)closeClientModal()">
  <div class="inner">
    <h3 id="clientModalTitle">Add Site</h3>
    <input type="hidden" id="cmId">
    <label>Client Name</label><input id="cmName" placeholder="e.g. HDFC Bank">
    <label>Site / Unit</label><input id="cmLoc" placeholder="Branch / site name">
    <label>Operations Staff (in charge)</label><input id="cmStaff" placeholder="Field Officer name">
    <div class="row2">
      <div><label>Sanctioned A / Day</label><input id="cmA" type="number" min="0" value="0"></div>
      <div><label>Sanctioned General</label><input id="cmG" type="number" min="0" value="0"></div>
    </div>
    <div class="row2">
      <div><label>Sanctioned B</label><input id="cmB" type="number" min="0" value="0"></div>
      <div><label>Sanctioned C / Night</label><input id="cmC" type="number" min="0" value="0"></div>
    </div>
    <div class="row2">
      <div><label>SLA — Day Visit</label><input id="cmSlaDay" placeholder="e.g. 2/month"></div>
      <div><label>SLA — Night Check</label><input id="cmSlaNight" placeholder="e.g. 1/week"></div>
    </div>
    <label>Client Priority (Stars)</label>
    <select id="cmStars" style="font-size:17px">
      <option value="1">★☆☆☆☆ — Valued Client (1)</option>
      <option value="2">★★☆☆☆ — Valued Client (2)</option>
      <option value="3">★★★☆☆ — High Value Client (3)</option>
      <option value="4">★★★★☆ — High Value Client (4)</option>
      <option value="5">★★★★★ — Strategic Client (5)</option>
    </select>
    <div class="hint">Equipment &amp; SLA issues per unit — use <b>Unit Issue Register</b> button above (on this page).</div>
    <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn green" onclick="saveClientModal()">Save Client</button>
      <button class="btn grey" onclick="closeClientModal()">Cancel</button>
    </div>
    <div id="cmMsg" class="msg"></div>
  </div>
</div>

<div id="ackModal" class="modal hidden" onclick="if(event.target===this)el('ackModal').classList.add('hidden')">
  <div class="inner" style="max-width:520px">
    <h3>✅ Report Submitted</h3>
    <div id="ackBody" class="hint"></div>
    <button class="btn green" style="margin-top:14px" onclick="el('ackModal').classList.add('hidden')">Close</button>
  </div>
</div>

<script>
var __SHARE_FOOTER__=${SHARE_FOOTER_JS};
${otpLoginScript('mis-report', 'Agile MIS — Daily Branch Report', 'staff')}
${MIS_STAFF_SESSION_JS}
var CTX={branchId:'',rows:[],clients:[]};
var BRANCHES_READY=false;
var AUTO_OPEN_AFTER_LOAD=false;
var REPORT_SECTION=(function(){
  var p=new URLSearchParams(location.search).get('section');
  return p==='deploy'||p==='summary'||p==='submit'?p:'';
})();
var REPORT_EMBED=new URLSearchParams(location.search).get('embed')==='1';
function el(id){return document.getElementById(id);}
function ensureSession(){
  if(OTP_SESSION)return true;
  if(typeof otpRestoreSession==='function') otpRestoreSession();
  if(!OTP_SESSION){
    var alt=sessionStorage.getItem('otp_mis');
    if(alt){OTP_SESSION=alt;OTP_EMAIL=sessionStorage.getItem('otp_email_mis')||'';return true;}
  }
  return !!OTP_SESSION;
}
var OPEN_REPORT_BUSY=false;
function showReportLoading(msg,step){
  var box=el('reportLoading');if(box)box.classList.remove('hidden');
  var app=el('app');if(app)app.classList.add('hidden');
  var m=el('reportLoadingMsg');if(m)m.textContent=msg||'Please wait — loading your branch report.';
  var s=el('reportLoadingStep');if(s)s.textContent=step||'';
  var retry=el('reportLoadingRetry');if(retry)retry.classList.add('hidden');
}
function hideReportLoading(){
  var box=el('reportLoading');if(box)box.classList.add('hidden');
  var retry=el('reportLoadingRetry');if(retry)retry.classList.add('hidden');
}
function showLoginAgain(msg){
  hideReportLoading();
  el('branchStep').classList.add('hidden');
  el('staffShell').classList.add('hidden');
  el('app').classList.add('hidden');
  el('loginWrap').classList.remove('hidden');
  if(typeof branchShowMain==='function') branchShowMain();
  else{el('otpStepEmail').classList.remove('hidden');el('otpStepPin').classList.add('hidden');}
  sessionStorage.removeItem('otp_mis-report');
  sessionStorage.removeItem('otp_email_mis-report');
  sessionStorage.removeItem('otp_branch_mis-report');
  sessionStorage.removeItem('otp_branch_name_mis-report');
  OTP_SESSION='';OTP_EMAIL='';OTP_BRANCH_ID='';OTP_BRANCH_NAME='';
  otpMsg(msg||'Please sign in again with your branch and password.',false);
}
function reportBranchId(){
  if(typeof staffResolveBranchId==='function')return staffResolveBranchId();
  if(OTP_BRANCH_ID)return OTP_BRANCH_ID;
  if(typeof otpBranchFromJwt==='function'&&OTP_SESSION){
    var bid=otpBranchFromJwt(OTP_SESSION);
    if(bid){OTP_BRANCH_ID=bid;sessionStorage.setItem('otp_branch_mis-report',bid);return bid;}
  }
  var sel=el('branch');
  return sel&&sel.value?sel.value:'';
}
function tryOpenReportWhenReady(){
  if(!AUTO_OPEN_AFTER_LOAD||!OTP_SESSION)return;
  CTX.branchId=reportBranchId()||'';
  if(el('branch')&&CTX.branchId)el('branch').value=CTX.branchId;
  openReport(true);
}
function setOpenBtnReady(){
  var btn=el('btnOpenReport');
  if(!btn)return;
  btn.disabled=!BRANCHES_READY;
  btn.textContent=BRANCHES_READY?"Open Today's Report":'Loading branches…';
}
function api(action,extra){return fetch('/api/mis/report-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,branchId:CTX.branchId,autoSync:false},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
function branchLabel(b){return b.displayName||b.name;}
function showMondayBacklog(){
  var now=new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Kolkata'}));
  if(now.getDay()!==1)return;
  var sat=new Date(now);sat.setDate(now.getDate()-2);
  var sun=new Date(now);sun.setDate(now.getDate()-1);
  var fmt=function(d){return d.toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});};
  var box=el('mondayBacklog');if(!box)return;
  box.classList.remove('hidden');
  var sd=el('satDate');if(sd)sd.textContent=fmt(sat);
  var ud=el('sunDate');if(ud)ud.textContent=fmt(sun);
}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function misTodayIst(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});}
function misYesterdayIst(){return new Date(Date.now()-86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});}
function onOtpLogin(j){
  el('dateFor').value=misTodayIst();
  showMondayBacklog();
  if(typeof branchHideAll==='function') branchHideAll();
  else{el('otpStepEmail').classList.add('hidden');el('otpStepPin').classList.add('hidden');}
  var bid=j.branchId||OTP_BRANCH_ID||'';
  if(bid){OTP_BRANCH_ID=bid;CTX.branchId=bid;if(el('branch'))el('branch').value=bid;}
  if(j.branchName)OTP_BRANCH_NAME=j.branchName;
  staffPortalEnter('loginWrap');
  showReportLoading('Opening your Daily MIS report…','Step 1 — please wait');
  AUTO_OPEN_AFTER_LOAD=true;
  tryOpenReportWhenReady();
}

function reportBoot(){
  if(typeof applyHodBoot==='function')applyHodBoot();
  el('dateFor').value=misTodayIst();
  showMondayBacklog();
  var fresh=new URLSearchParams(location.search).get('fresh')==='1';
  if(fresh){
    sessionStorage.removeItem('otp_mis-report');
    sessionStorage.removeItem('otp_email_mis-report');
    sessionStorage.removeItem('otp_branch_mis-report');
    sessionStorage.removeItem('otp_branch_name_mis-report');
    sessionStorage.removeItem('otp_mis');
    sessionStorage.removeItem('otp_email_mis');
    return;
  }
  if(typeof otpRestoreSession!=='function'||!otpRestoreSession()||!OTP_SESSION){
    if(REPORT_EMBED){setTimeout(function(){location.replace('/mis-staff?fresh=1');},800);}
    return;
  }
  CTX.branchId=reportBranchId()||'';
  if(el('branch')&&CTX.branchId)el('branch').value=CTX.branchId;
  staffPortalEnter('loginWrap');
  showReportLoading('Opening your Daily MIS report…',REPORT_SECTION==='deploy'?'Step 1 — Deployment':REPORT_SECTION==='summary'?'Step 2 — Summary':REPORT_SECTION==='submit'?'Step 3 — Submit':'Please wait');
  AUTO_OPEN_AFTER_LOAD=true;
  tryOpenReportWhenReady();
}

(function init(){
  if(REPORT_EMBED){
    document.documentElement.classList.add('report-embed');
    var promo=document.querySelector('body>p');if(promo)promo.style.display='none';
    var topBanner=document.querySelector('.top');if(topBanner)topBanner.style.display='none';
    if(document.documentElement.classList.contains('hod-signed-in')){
      showReportLoading('Opening Daily MIS…',REPORT_SECTION==='deploy'?'Step 1 — Deployment':REPORT_SECTION==='summary'?'Step 2 — Summary':REPORT_SECTION==='submit'?'Step 3 — Submit':'Please wait');
    }
  }
  fetch('/api/mis/report-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'branches'})}).then(function(r){return r.json();}).then(function(j){
    var s=el('branch');s.innerHTML='';(j.branches||[]).forEach(function(b){var o=document.createElement('option');o.value=b.id;o.textContent=branchLabel(b);s.appendChild(o);});
    BRANCHES_READY=!!(j.branches&&j.branches.length);
    setOpenBtnReady();
    tryOpenReportWhenReady();
    if(!BRANCHES_READY){var lm=el('branchLoadMsg');if(lm)lm.textContent='Branch list could not load — please refresh the page.';}
  }).catch(function(){
    var lm=el('branchLoadMsg');if(lm)lm.textContent='Could not load branches — check internet and refresh the page.';
    setOpenBtnReady();
  });
  setOpenBtnReady();
  reportBoot();
})();

function updateDateWarn(dateFor){
  var today=misTodayIst();
  var w=el('dateWarn');
  if(!w)return;
  if(dateFor&&dateFor!==today){w.classList.remove('hidden');el('dateWarnVal').textContent=dateFor;el('dateWarnToday').textContent=today;}
  else w.classList.add('hidden');
}
function applyFieldMeta(meta){
  if(!meta)return;
  Object.keys(meta).forEach(function(k){
    var h=el('hint-'+k);if(!h)return;
    var m=meta[k];
    if(m.status==='auto'){h.className='field-hint field-auto';h.textContent=m.hint||'✓ Auto-filled';}
    else if(m.status==='previous'){h.className='field-hint field-auto';h.textContent=m.hint||'✓ From previous submission';}
    else{h.className='field-hint field-attn';h.textContent=m.hint||'Kind attention — system could not get the data. Please enter manually.';}
  });
}
function applySummaryFromLogin(res){
  if(!res.body.summary)return;
  var s=res.body.summary;
  ['weeklyCollectionPct','consolidatedCollectionPct','collectionPct','dayVisits','nightChecks','trainedSites','medicalFitnessPct','pvcPct','psaraPct','resignation','recruitment','guardComplaints','clientComplaints','complaints','remarks','lateStartCases','outOfPostCases'].forEach(function(k){if(el(k))el(k).value=s[k]||'';});
  if(!el('weeklyCollectionPct').value&&s.collectionPct)el('weeklyCollectionPct').value=s.collectionPct;
  syncCollectionPct();
  if(!el('guardComplaints').value&&s.complaints&&!s.clientComplaints)el('guardComplaints').value='0/0';
  if(!el('clientComplaints').value&&s.complaints)el('clientComplaints').value=s.complaints;
  if(!el('resignation').value&&s.mobileMentionedPct)el('resignation').value=s.mobileMentionedPct;
  if(!el('recruitment').value&&s.mobileActualPct)el('recruitment').value=s.mobileActualPct;
  applyFieldMeta(res.body.fieldMeta||{});
  if(res.body.collection){
    var c=res.body.collection;
    CTX.collection=c;
    var colMap={colBudget:'budget',colMon:'mon',colTue:'tue',colWed:'wed',colThu:'thu',colFri:'fri',colSat:'sat'};
    Object.keys(colMap).forEach(function(id){var e=el(id);if(e)e.value=c[colMap[id]]||'';});
    var hint=el('colHint');
    if(hint)hint.textContent='Week from '+(res.body.weekStart||'')+' · Collected '+(res.body.collectionCollected||0)+' L';
  }
  var hint=el('mobileHint');
  var dutyBox=el('dutyStats');
  if(dutyBox&&res.body.mobileStats){
    var ms=res.body.mobileStats;
    var late=ms.lateStartCases||0,outp=ms.outOfPostCases||0;
    dutyBox.style.display='block';
    dutyBox.innerHTML='<b style="color:#fde68a">From Agile Mobile / Work360 today (separate fields):</b><br>'+
      '<span style="color:#fbbf24">Late Start only: <b>'+late+'</b></span><br>'+
      '<span style="color:#f87171">Out of Post only: <b>'+outp+'</b></span>'+
      (res.body.mobileFilled?' <span style="color:#4ade80">(auto-filled in form below)</span>':'');
  }else if(dutyBox){dutyBox.style.display='none';}
  if(hint){
    var text=res.body.mobileNote||'';
    if(!text&&res.body.mobileStats){
      var ms=res.body.mobileStats;
      var parts=[];
      if(ms.visitTotal)parts.push('Mobile visits today: '+ms.dayVisits+' day · '+ms.nightChecks+' night'+(ms.trainedSites?' · '+ms.trainedSites+' trained':''));
      if(ms.lateStartCases||ms.outOfPostCases)parts.push('Late start: '+ms.lateStartCases+' · Out of post: '+ms.outOfPostCases);
      if(res.body.mobileFilled)parts.push('Counts filled from Agile Mobile.');
      text=parts.join(' · ');
    }
    hint.textContent=text||'Mobile app sync: NA — see instructions in User Manual / Troubleshooting.';
    hint.style.display='block';
  }
}
function saveCollection(){
  if(!ensureSession()){showLoginAgain('Please sign in first.');return;}
  api('saveCollection',{
    dateFor:el('dateFor').value||misTodayIst(),
    collection:{
      id:CTX.collection&&CTX.collection.id,
      budget:el('colBudget').value,
      mon:el('colMon').value,tue:el('colTue').value,wed:el('colWed').value,thu:el('colThu').value,fri:el('colFri').value,sat:el('colSat').value
    }
  }).then(function(res){
    if(res.status!==200){alert(res.body.error||'Could not save collection');return;}
    CTX.collection=res.body.collection;
    if(res.body.collectionPct&&el('weeklyCollectionPct'))el('weeklyCollectionPct').value=res.body.collectionPct;
    syncCollectionPct();
    var hint=el('colHint');if(hint)hint.textContent='Saved ✓ Week '+res.body.weekStart+' · Collected '+res.body.collected+' L · Collection % '+res.body.collectionPct;
  });
}
function setReportToday(){
  el('dateFor').value=misTodayIst();
  showMondayBacklog();
  api('login',{dateFor:el('dateFor').value}).then(function(res){
    if(res.status!==200){alert(res.body.error||'Could not reload report');return;}
    CTX.rows=res.body.rows||[];
    el('hdr').textContent=res.body.branch.name+' — '+res.body.dateFor;
    el('subhdr').textContent=res.body.alreadySubmitted?'A report already exists for this date — you are editing it.':'New report. Sanctioned strength pre-filled from your Data Bank.';
    applySummaryFromLogin(res);
    renderRows();
    updateDashCheck();
    updateDateWarn(res.body.dateFor);
  });
}

function showReportFromRes(res){
  CTX.rows=res.body.rows||[];
  hideReportLoading();
  document.documentElement.classList.remove('hod-signed-in');
  el('loginWrap').classList.add('hidden');el('staffShell').classList.remove('hidden');el('app').classList.remove('hidden');
  var tag=el('staffBranchTag');if(tag)tag.textContent=staffBranchLabel();
  el('hdr').textContent=res.body.branch.name+' — '+res.body.dateFor;
  el('subhdr').textContent=res.body.alreadySubmitted?'A report already exists for this date — you are editing it.':'New report. Sanctioned strength pre-filled from your Data Bank.';
  applySummaryFromLogin(res);
  if(REPORT_SECTION!=='deploy') loadClientMgmt();
  renderRows();
  updateDashCheck();
  updateDateWarn(res.body.dateFor);
  var m=el('msg');if(m)m.style.display='none';
  applyReportSection();
  if(!REPORT_SECTION){var dep=el('deploy');if(dep)dep.scrollIntoView({behavior:'smooth',block:'start'});}
}
function enrichInBackground(df){
  var hint=el('mobileHint');
  if(hint){hint.style.display='block';hint.textContent='Loading auto-fill from mobile, guard docs, and collection…';}
  api('enrichSummary',{dateFor:df}).then(function(res){
    if(res.status===200){
      applySummaryFromLogin(res);
      if(hint)hint.textContent=res.body.mobileNote||'Auto-fill complete.';
    }else if(hint){hint.textContent='Auto-fill skipped — you may enter summary fields manually.';}
  }).catch(function(){
    if(hint)hint.textContent='Auto-fill skipped — you may enter summary fields manually.';
  });
}
function openReport(skipConfirm){
  if(OPEN_REPORT_BUSY)return;
  if(!ensureSession()){showLoginAgain('Please sign in first — select your branch and enter your branch password.');return;}
  var bidEarly=reportBranchId();
  if(!BRANCHES_READY&&!bidEarly&&OTP_ROLE!=='staff'){showReportLoading('Loading branch list…','Step 1 — please wait');return;}
  var bid=reportBranchId()||'';
  if(!bid&&OTP_ROLE!=='staff'){showLoginAgain('Please sign in with your branch first.');return;}
  var today=misTodayIst();
  var df=el('dateFor').value;
  if(!df){el('dateFor').value=today;df=today;}
  if(!skipConfirm&&df!==today){
    if(confirm('Today is '+today+'.\\n\\nSubmit TODAY\\'s report? (Recommended)\\n\\nOK = use today\\nCancel = keep date '+df)){
      el('dateFor').value=today;
      df=today;
    }
  }
  CTX.branchId=bid;
  if(el('branch'))el('branch').value=bid;
  OPEN_REPORT_BUSY=true;
  var btn=el('btnOpenReport');
  if(btn){btn.disabled=true;btn.textContent='Opening report…';}
  showReportLoading('Loading your deployment form…',REPORT_SECTION==='deploy'?'Step 1 — deployment sites only (fast open)':REPORT_SECTION==='summary'?'Step 2 — summary & collection':REPORT_SECTION==='submit'?'Step 3 — review checklist':'Step 2 — fetching sites and summary (usually under 1 minute)');
  var ctrl=new AbortController();
  var timer=setTimeout(function(){
    showReportLoading('Still loading…','Large branches can take up to 1 minute — please wait');
    var retry=el('reportLoadingRetry');if(retry)retry.classList.remove('hidden');
  },45000);
  fetch('/api/mis/report-data',{method:'POST',headers:{'Content-Type':'application/json'},signal:ctrl.signal,body:JSON.stringify({action:'quickOpen',sessionToken:OTP_SESSION,branchId:CTX.branchId,dateFor:df})}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});}).then(function(res){
    if(res.status===401){showLoginAgain(res.body.error||'Sign-in expired. Please sign in with your branch password again.');return;}
    if(res.status!==200){hideReportLoading();showReportLoading(res.body.error||'Could not open report. Tap Try again below.','');var retry=el('reportLoadingRetry');if(retry)retry.classList.remove('hidden');return;}
    showReportFromRes(res);
    if(REPORT_SECTION!=='deploy')enrichInBackground(df);
  }).catch(function(err){
    if(err&&err.name==='AbortError'){
      showReportLoading('Timed out — tap Try again.','Check Wi-Fi or mobile data');
    }else{
      showReportLoading('Network error — tap Try again.','');
    }
    var retry=el('reportLoadingRetry');if(retry)retry.classList.remove('hidden');
  }).finally(function(){clearTimeout(timer);OPEN_REPORT_BUSY=false;setOpenBtnReady();});
}

function loadClientMgmt(){
  api('clientsList').then(function(res){
    CTX.clients=res.status===200?(res.body.clients||[]):[];
    renderClientMgmt();
  });
}

function starStr(n){n=Math.min(5,Math.max(1,Math.round(Number(n)||2)));return '★'.repeat(n);}
function tierLabel(n){n=Math.round(Number(n)||2);if(n>=5)return 'Strategic Client';if(n>=3)return 'High Value Client';return 'Valued Client';}
function renderClientMgmt(){
  var tb=el('clientMgmt');if(!tb)return;tb.innerHTML='';
  if(!CTX.clients.length){tb.innerHTML='<tr><td colspan="9" style="padding:12px;color:#94a3b8">No sites yet — tap <b>+ Add Site</b> above.</td></tr>';return;}
  CTX.clients.forEach(function(c){
    var act=c.active!==false;
    var tr=document.createElement('tr');
    if(!act)tr.className='inactive-row';
    var san=(c.sanA||0)+'/'+(c.sanG||0)+'/'+(c.sanB||0)+'/'+(c.sanC||0);
    var stars=c.starRating||(c.highValue?4:2);
    tr.innerHTML=
      '<td class="txt">'+h(c.name)+'</td><td class="txt">'+h(c.location)+'</td><td class="txt">'+h(c.staffName)+'</td>'+
      '<td>'+san+'</td><td class="txt">'+h(c.slaDayVisit||'—')+'</td><td class="txt">'+h(c.slaNightCheck||'—')+'</td>'+
      '<td><span style="color:#fde68a;font-size:15px">'+starStr(stars)+'</span> <small>'+tierLabel(stars)+'</small></td>'+
      '<td><b style="color:'+(act?'#4ade80':'#f87171')+'">'+(act?'Active':'Inactive')+'</b></td>'+
      '<td class="cl-actions" style="white-space:nowrap">'+
      '<button type="button" class="btn sm" onclick="openClientModal(\\''+c.id+'\\')">Edit</button> '+
      (act?'<button type="button" class="btn sm red" onclick="toggleClient(\\''+c.id+'\\',false)">Deactivate</button>':'<button type="button" class="btn sm green" onclick="toggleClient(\\''+c.id+'\\',true)">Activate</button>')+
      '</td>';
    tb.appendChild(tr);
  });
}

function openClientModal(id){
  var c=null;
  if(id){c=CTX.clients.find(function(x){return x.id===id;});if(!c){alert('Site not found — refresh and try again.');return;}}
  el('clientModalTitle').textContent=c?'Edit Site':'Add Site';
  el('cmId').value=c?c.id:'';
  el('cmName').value=c?c.name:'';
  el('cmLoc').value=c?c.location:'';
  el('cmStaff').value=c?c.staffName:'';
  el('cmA').value=c?c.sanA||0:0;
  el('cmG').value=c?c.sanG||0:0;
  el('cmB').value=c?c.sanB||0:0;
  el('cmC').value=c?c.sanC||0:0;
  el('cmSlaDay').value=c?c.slaDayVisit||'':'';
  el('cmSlaNight').value=c?c.slaNightCheck||'':'';
  el('cmStars').value=String(c?(c.starRating||(c.highValue?4:2)):2);
  var m=el('cmMsg');m.style.display='none';
  el('clientModal').classList.remove('hidden');
}
function closeClientModal(){el('clientModal').classList.add('hidden');}

function saveClientModal(){
  var m=el('cmMsg');m.style.display='block';m.style.background='#dcfce7';m.style.color='#166534';m.textContent='Saving...';
  var payload={id:el('cmId').value,name:el('cmName').value,location:el('cmLoc').value,staffName:el('cmStaff').value,
    sanA:+el('cmA').value||0,sanG:+el('cmG').value||0,sanB:+el('cmB').value||0,sanC:+el('cmC').value||0,
    slaDayVisit:el('cmSlaDay').value,slaNightCheck:el('cmSlaNight').value,starRating:+el('cmStars').value||2,active:true};
  if(!payload.name.trim()){m.style.background='#fef2f2';m.style.color='#991b1b';m.textContent='Please enter client name.';return;}
  api('saveClient',{client:payload}).then(function(res){
    if(res.status!==200){m.style.background='#fef2f2';m.style.color='#991b1b';m.textContent=res.body.error||'Could not save.';return;}
    closeClientModal();
    refreshRowsAfterClientChange();
  }).catch(function(){m.style.background='#fef2f2';m.style.color='#991b1b';m.textContent='Network error.';});
}

function toggleClient(id,active){
  var label=active?'activate':'deactivate';
  if(!id){alert('This client has no id — please refresh the page and try again.');return;}
  if(!confirm('Are you sure you want to '+label+' this site?'))return;
  api('toggleClient',{clientId:id,active:active===true}).then(function(res){
    if(res.status===200) refreshRowsAfterClientChange();
    else alert(res.body.error||'Could not update.');
  });
}

function refreshRowsAfterClientChange(){
  api('login',{dateFor:el('dateFor').value}).then(function(res){
    if(res.status===200){
      CTX.rows=res.body.rows||[];
      loadClientMgmt();
      renderRows();
      updateDashCheck();
    }
  });
}

var SH=[['A','grp-a'],['G','grp-g'],['B','grp-b'],['C','grp-c']];
function renderRows(){
  var tb=el('rows');tb.innerHTML='';
  var emptyBox=el('deployEmpty');
  if(!CTX.rows.length){
    if(emptyBox)emptyBox.classList.remove('hidden');
    tb.innerHTML='<tr><td colspan="25" style="padding:16px;color:#64748b">No sites found for your branch. Use <b>+ Add Site</b> below or ask HO to load sites in the Master Directory.</td></tr>';
    updateTotals();return;
  }
  if(emptyBox)emptyBox.classList.add('hidden');
  CTX.rows.forEach(function(r,i){
    var html='<td class="freeze-num">'+(i+1)+'</td><td class="txt freeze-client">'+h(r.clientName)+'</td><td class="txt freeze-loc">'+h(r.location)+'</td><td class="txt freeze-staff">'+h(r.staffName)+'</td>';
    SH.forEach(function(sh){var s=sh[0],g=sh[1];
      html+='<td class="'+g+'"><input class="san" type="number" min="0" value="'+(r['san'+s]||0)+'" oninput="upd('+i+',\\'san'+s+'\\',this.value)"></td>'+
        '<td class="'+g+'"><input type="number" min="0" value="'+(r['abs'+s]||0)+'" oninput="upd('+i+',\\'abs'+s+'\\',this.value)"></td>'+
        '<td class="'+g+'"><input type="number" min="0" value="'+(r['ot'+s]||0)+'" oninput="upd('+i+',\\'ot'+s+'\\',this.value)"></td>'+
        '<td class="'+g+'"><input type="number" value="'+(r['dep'+s]||0)+'" readonly style="background:#e2e8f0;font-weight:800"></td>'+
        '<td class="'+g+'"><span class="vac" id="v'+i+s+'">0</span></td>';
    });
    html+='<td><b id="tv'+i+'">0</b></td>';
    var tr=document.createElement('tr');tr.innerHTML=html;tb.appendChild(tr);
  });
  recompute();
}

function upd(i,f,v){CTX.rows[i][f]=Number(v)||0;recompute();}
function shiftCalc(san,abs,ot){san=Number(san)||0;abs=Number(abs)||0;ot=Number(ot)||0;var vac=Math.max(0,abs-ot);var dep=Math.min(san,Math.max(0,san-vac));return {dep:dep,vac:vac};}
function recompute(){
  CTX.rows.forEach(function(r,i){
    var totAbs=0,totOt=0;
    var tr=el('rows').rows[i];
    SH.forEach(function(sh,idx){
      var s=sh[0];
      var c=shiftCalc(r['san'+s],r['abs'+s],r['ot'+s]);
      r['dep'+s]=c.dep;
      totAbs+=(r['abs'+s]||0);totOt+=(r['ot'+s]||0);
      if(el('v'+i+s))el('v'+i+s).textContent=c.vac;
      if(tr){var depInp=tr.cells[4+idx*5+3]&&tr.cells[4+idx*5+3].querySelector('input');if(depInp)depInp.value=c.dep;}
    });
    if(el('tv'+i))el('tv'+i).textContent=Math.max(0,totAbs-totOt);
  });
  updateTotals();
}
function updateTotals(){
  var san=0,abs=0,ot=0;
  CTX.rows.forEach(function(r){
    SH.forEach(function(sh){var s=sh[0];san+=(r['san'+s]||0);abs+=(r['abs'+s]||0);ot+=(r['ot'+s]||0);});
  });
  var vac=Math.max(0,abs-ot);
  var dep=Math.min(san,Math.max(0,san-vac));
  el('tSan').textContent=san;el('tAbs').textContent=abs;el('tOt').textContent=ot;el('tDep').textContent=dep;el('tVac').textContent=vac;
  updateDashCheck();
}

function showAck(share,ack){
  var s=share||{};
  var emailNote='';
  if(ack&&ack.ok&&!ack.skipped){
    var toList=(ack.submitterTo||ack.to||[]).filter(function(e){return e&&e.indexOf('@')>=0;});
    var ccDir=ack.directorEmail||ack.directorCc&&ack.directorCc[0]||'director@agilegroup.co.in';
    if(toList.length)emailNote=' Confirmation email sent to <b>'+toList.join(', ')+'</b> (CC: Director '+ccDir+').';
    else emailNote=' Confirmation email sent (CC: Director '+ccDir+').';
  }
  else if(ack&&ack.skipped) emailNote=' (Email skipped: '+(ack.reason||'no address on file')+'.)';
  else if(ack&&ack.error) emailNote=' (Email could not be sent: '+ack.error+'. Suggestions below are still shown on screen — check spam or ask IT.)';
  else if(ack&&!ack.ok) emailNote=' (Email could not be sent.)';
  var alerts=(ack&&ack.aiAlerts)||[];
  var st=ack&&ack.ackStats;
  var statsHtml='';
  if(st){
    function tile(v,l){return '<div style="flex:1;min-width:72px;padding:10px 6px;background:#0e1730;border:1px solid #334155;border-radius:8px;text-align:center"><b style="display:block;color:#fde68a;font-size:18px">'+v+'</b><span style="font-size:10px;color:#94a3b8;line-height:1.3">'+l+'</span></div>';}
    var gc=st.guardComplaints||{};var cc=st.clientComplaints||{};
    statsHtml='<div style="margin:14px 0;text-align:left"><div style="color:#fde68a;font-weight:700;font-size:13px;margin-bottom:8px;border-bottom:2px solid #c9a84c;padding-bottom:6px">Branch Status Dashboard</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">'+
      tile((st.pvcValid||0)+'/'+(st.guardsTotal||0),'PVC valid/total')+
      tile((st.medicalValid||0)+'/'+(st.guardsTotal||0),'Medical valid/total')+
      tile(String(st.dayVisits||0),'Day visits')+
      tile(String(st.srMgmtVisits||0),'Sr Mgmt visits')+
      '</div><div style="display:flex;flex-wrap:wrap;gap:8px">'+
      tile(String(st.resigned||0),'Resigned')+
      tile(String(st.recruitmentOpen||0),'Recruitment open')+
      tile((st.weeklyCollected||0)+' / '+(st.weeklyBudget||0),'Weekly ₹ Lakhs')+
      tile((gc.solved||0)+' / '+(gc.received||0),'Guard complaints')+
      tile((cc.solved||0)+' / '+(cc.received||0),'Client complaints')+
      '</div></div>';
  }
  var alertHtml=alerts.length?'<div style="margin:14px 0;padding:12px 14px;background:rgba(251,191,36,.12);border:1px solid #f59e0b;border-radius:8px;text-align:left"><div style="color:#fde68a;font-weight:700;font-size:13px;margin-bottom:8px">Suggestion (AI) — Alert Message</div><ul style="margin:0;padding-left:18px;color:#cbd5e1;font-size:13px;line-height:1.5">'+alerts.map(function(a){return '<li style="margin-bottom:6px">'+String(a).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</li>';}).join('')+'</ul></div>':'';
  el('ackBody').innerHTML='<p style="color:#fff;font-size:16px">Thank you — your Branch/Zone MIS is recorded.'+emailNote+'</p>'+
    '<div class="totbar" style="margin:12px 0"><div><b>'+(s.sanctioned||0)+'</b><span>Sanctioned</span></div><div><b>'+(s.absent||0)+'</b><span>Absent</span></div><div><b>'+(s.ot||0)+'</b><span>OT</span></div><div><b>'+(s.vacant||0)+'</b><span>Vacant</span></div><div><b>'+(s.deployed||0)+'</b><span>Deployed</span></div><div><b>'+(s.collectionPct||'—')+'%</b><span>Weekly Coll.</span></div></div>'+
    '<p style="color:#94a3b8">Deployment: <b style="color:#4ade80">'+(s.depPct||0)+'%</b></p>'+statsHtml+alertHtml;
  el('ackModal').classList.remove('hidden');
}
function summaryFieldFilled(id){
  var e=el(id);if(!e)return false;var v=String(e.value||'').trim();return v.length>0;
}
function collectMissingSummary(){
  var missing=[];
  if(!el('submittedBy').value.trim())missing.push('Your name (submitting)');
  var san=+el('tSan').textContent||0;
  if(!san)missing.push('Deployment — enter Absent/OT for each site');
  var budget=+el('colBudget').value||0;
  var wk=(+el('colMon').value||0)+(+el('colTue').value||0)+(+el('colWed').value||0)+(+el('colThu').value||0)+(+el('colFri').value||0)+(+el('colSat').value||0);
  if(!budget)missing.push('Weekly Budget (Collection)');
  else if(!wk&&!summaryFieldFilled('weeklyCollectionPct'))missing.push('Daily collection (Mon–Sat) or Weekly Collection %');
  var req=['weeklyCollectionPct','consolidatedCollectionPct','dayVisits','nightChecks','trainedSites','medicalFitnessPct','pvcPct','psaraPct','resignation','recruitment','guardComplaints','clientComplaints','lateStartCases','outOfPostCases'];
  var labels={weeklyCollectionPct:'Weekly Collection %',consolidatedCollectionPct:'Consolidated Collection %',dayVisits:'Operations Visits (Day)',nightChecks:'Night Checks',trainedSites:'Trained Sites',medicalFitnessPct:'Medical Fitness %',pvcPct:'PVC Upload %',psaraPct:'PSARA / Training Cert %',resignation:'Resignations',recruitment:'Recruitment (open)',guardComplaints:'Guard Complaints (solved/registered)',clientComplaints:'Client Complaints (solved/registered)',lateStartCases:'Late Start',outOfPostCases:'Out of Post'};
  req.forEach(function(id){if(!summaryFieldFilled(id))missing.push(labels[id]||id);});
  return missing;
}
function updateDashCheck(){
  var box=el('dashCheck');if(!box)return;
  var missing=collectMissingSummary();
  var items=[];
  var san=+el('tSan').textContent||0;
  if(!san)items.push('❌ Deployment — enter Absent/OT for each site');
  else items.push('✅ Deployment rows ('+san+' sanctioned)');
  if(!el('submittedBy').value.trim())items.push('❌ Your name (submitting)');
  else items.push('✅ Your name');
  var budget=+el('colBudget').value||0;
  var wk=(+el('colMon').value||0)+(+el('colTue').value||0)+(+el('colWed').value||0)+(+el('colThu').value||0)+(+el('colFri').value||0)+(+el('colSat').value||0);
  if(!budget)items.push('❌ Weekly Budget — enter for Collection %');
  else if(!wk&&!summaryFieldFilled('weeklyCollectionPct'))items.push('❌ Daily collection (Mon–Sat) — enter amounts');
  else items.push('✅ Weekly collection entered');
  ['weeklyCollectionPct','consolidatedCollectionPct','dayVisits','nightChecks','trainedSites','medicalFitnessPct','pvcPct','psaraPct','resignation','recruitment','guardComplaints','clientComplaints','lateStartCases','outOfPostCases'].forEach(function(id){
    var lbl=(el(id)&&el(id).previousElementSibling)?el(id).previousElementSibling.textContent:id;
    if(!summaryFieldFilled(id))items.push('❌ '+lbl+' — fill (enter 0 if none)');
    else items.push('✅ '+lbl);
  });
  var ready=missing.length===0;
  box.innerHTML='<b style="color:'+(ready?'#4ade80':'#fde68a')+'">'+(ready?'✅ Ready to submit — all fields complete':'⚠ Complete all fields before submit')+'</b><br>'+items.join('<br>');
}
function syncCollectionPct(){
  var w=el('weeklyCollectionPct');var h=el('collectionPct');
  if(h&&w)h.value=w.value||'';
}
function fillCollectionPct(){
  var budget=+el('colBudget').value||0;
  if(!budget)return;
  var wk=(+el('colMon').value||0)+(+el('colTue').value||0)+(+el('colWed').value||0)+(+el('colThu').value||0)+(+el('colFri').value||0)+(+el('colSat').value||0);
  if(wk>=0&&el('weeklyCollectionPct'))el('weeklyCollectionPct').value=String(Math.round(wk*100/budget));
  syncCollectionPct();
  updateDashCheck();
}
function shareSummary(){
  var san=el('tSan').textContent,abs=el('tAbs').textContent,vac=el('tVac').textContent,dep=el('tDep').textContent,coll=el('weeklyCollectionPct').value||'—';
  var txt='Agile MIS Daily Summary\\nSanctioned: '+san+'\\nAbsent: '+abs+'\\nVacant: '+vac+'\\nDeployed: '+dep+'\\nCollection: '+coll+'%'+__SHARE_FOOTER__;
  if(navigator.share){navigator.share({title:'MIS Daily Summary',text:txt}).catch(function(){});}
  else{navigator.clipboard&&navigator.clipboard.writeText(txt);alert('Summary copied — paste into WhatsApp or email.');}
}
function collectSummaryPayload(){
  var summary={};
  ['weeklyCollectionPct','consolidatedCollectionPct','dayVisits','nightChecks','trainedSites','medicalFitnessPct','pvcPct','psaraPct','resignation','recruitment','guardComplaints','clientComplaints','remarks','lateStartCases','outOfPostCases'].forEach(function(k){summary[k]=el(k)?el(k).value:'';});
  summary.collectionPct=summary.weeklyCollectionPct||'';
  return summary;
}
function applyReportSection(){
  if(!REPORT_SECTION)return;
  var nav=el('reportNav');if(nav)nav.classList.add('hidden');
  var bar=el('stepNavBar');if(bar)bar.classList.remove('hidden');
  var deploy=el('deploy');
  var clients=el('clients');
  var coll=el('collectionBlock');
  var sum=el('summaryBlock');
  var sub=el('submitBlock');
  function hide(nodes){nodes.forEach(function(n){if(n)n.classList.add('section-hidden');});}
  function show(nodes){nodes.forEach(function(n){if(n)n.classList.remove('section-hidden');});}
  hide([deploy,clients,coll,sum,sub]);
  var label=el('stepNavLabel');
  var action=el('stepNavAction');
  if(REPORT_SECTION==='deploy'){
    if(label)label.textContent='Step 1 — Deployment';
    show([deploy]);
    if(action){action.classList.remove('hidden');action.textContent='Save & go to Step 2 →';action.onclick=saveDraftStep1;}
    if(deploy)deploy.scrollIntoView({behavior:'auto',block:'start'});
  }else if(REPORT_SECTION==='summary'){
    if(label)label.textContent='Step 2 — Daily Summary';
    show([coll,sum]);
    if(action){action.classList.remove('hidden');action.textContent='Save & go to Step 3 →';action.onclick=saveDraftStep2;}
    if(coll)coll.scrollIntoView({behavior:'auto',block:'start'});
  }else if(REPORT_SECTION==='submit'){
    if(label)label.textContent='Step 3 — Review & Submit';
    show([sub]);
    if(action)action.classList.add('hidden');
    updateDashCheck();
    if(sub)sub.scrollIntoView({behavior:'auto',block:'start'});
  }
}
function saveDraftStep1(){
  if(!CTX.rows.length){alert('No deployment sites loaded. Contact Head Office or add sites first.');return;}
  var btn=el('stepNavAction');if(btn){btn.disabled=true;btn.textContent='Saving…';}
  api('saveDraft',{dateFor:el('dateFor').value,submittedBy:el('submittedBy').value,rows:CTX.rows}).then(function(res){
    if(res.status!==200){alert(res.body.error||'Could not save. Please try again.');return;}
    location.href='/mis-staff-daily-summary';
  }).catch(function(){alert('Network error — please try again.');}).finally(function(){if(btn){btn.disabled=false;btn.textContent='Save & go to Step 2 →';}});
}
function saveDraftStep2(){
  fillCollectionPct();
  var btn=el('stepNavAction');if(btn){btn.disabled=true;btn.textContent='Saving…';}
  var summary=collectSummaryPayload();
  var colPromise=api('saveCollection',{dateFor:el('dateFor').value,collection:{
    id:CTX.collection&&CTX.collection.id,
    budget:el('colBudget').value,
    mon:el('colMon').value,tue:el('colTue').value,wed:el('colWed').value,
    thu:el('colThu').value,fri:el('colFri').value,sat:el('colSat').value
  }});
  var draftPromise=api('saveDraft',{dateFor:el('dateFor').value,submittedBy:el('submittedBy').value,rows:CTX.rows,summary:summary});
  Promise.all([colPromise,draftPromise]).then(function(results){
    var colRes=results[0],draftRes=results[1];
    if(draftRes.status!==200){alert(draftRes.body.error||'Could not save summary. Please try again.');return;}
    if(colRes.status!==200){alert(colRes.body.error||'Could not save collection. Please try again.');return;}
    location.href='/mis-staff-daily-submit';
  }).catch(function(){alert('Network error — please try again.');}).finally(function(){if(btn){btn.disabled=false;btn.textContent='Save & go to Step 3 →';}});
}
function submitReport(){
  var df=el('dateFor').value;
  var today=misTodayIst();
  if(df!==today){
    if(!confirm('WARNING: Report date is '+df+' but TODAY is '+today+'.\\n\\nManagement will count this under '+df+', not today.\\n\\nPress OK only if you mean to submit for '+df+'.\\nPress Cancel, then tap "Use Today\\'s Date".'))return;
  }
  if(!el('submittedBy').value.trim()){alert('Please enter your name before submitting.');return;}
  if(!CTX.rows.length){alert('No deployment sites loaded. Contact Head Office or add sites first.');return;}
  fillCollectionPct();
  var missing=collectMissingSummary();
  if(missing.length){
    alert('Please complete ALL fields before submitting:\\n\\n• '+missing.join('\\n• ')+'\\n\\nEnter 0 if there are none. Auto-filled fields may be edited.');
    updateDashCheck();
    return;
  }
  var san=+el('tSan').textContent||0;
  if(!san){if(!confirm('Deployment shows 0 sanctioned posts. Submit anyway?'))return;}
  var m=el('saveMsg');m.style.display='block';m.style.background='#14532d';m.style.color='#86efac';m.textContent='Submitting...';
  var submitBtn=el('btnSubmitReport');if(submitBtn)submitBtn.disabled=true;
  var summary=collectSummaryPayload();
  summary.complaints=summary.clientComplaints||'';
  var ctrl=new AbortController();
  var timer=setTimeout(function(){ctrl.abort();},120000);
  fetch('/api/mis/report-data',{method:'POST',headers:{'Content-Type':'application/json'},signal:ctrl.signal,body:JSON.stringify({
    action:'submit',
    sessionToken:OTP_SESSION,
    branchId:CTX.branchId,
    autoSync:false,
    dateFor:el('dateFor').value,
    submittedBy:el('submittedBy').value,
    submitterEmail:(typeof OTP_EMAIL!=='undefined'?OTP_EMAIL:'')||sessionStorage.getItem('otp_email_mis-report')||'',
    rows:CTX.rows,
    summary:summary,
    collection:{
      id:CTX.collection&&CTX.collection.id,
      budget:el('colBudget').value,
      mon:el('colMon').value,tue:el('colTue').value,wed:el('colWed').value,
      thu:el('colThu').value,fri:el('colFri').value,sat:el('colSat').value
    }
  })}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});}).then(function(res){
    if(res.status===200){
      m.style.background='#14532d';m.style.color='#86efac';m.textContent='✅ Report submitted successfully.'+(res.body.masterSanUpdated?' Sanctioned posts updated in Master Directory.':'');
      showAck(res.body.share,res.body.acknowledgment);
    }
    else{
      m.style.background='#450a0a';m.style.color='#fca5a5';
      var errMsg=res.body.error||'Could not submit.';
      if(res.body.missing&&res.body.missing.length)errMsg+=' Missing: '+res.body.missing.join(', ');
      m.textContent=errMsg;
      if(res.status===400)updateDashCheck();
    }
  }).catch(function(err){
    if(err&&err.name==='AbortError')m.style.background='#450a0a';m.style.color='#fca5a5';m.textContent='Submit took too long — please refresh the page. Your report may already be saved.';
    else{m.style.background='#450a0a';m.style.color='#fca5a5';m.textContent='Network error. Please try again.';}
  }).finally(function(){clearTimeout(timer);if(submitBtn)submitBtn.disabled=false;});
}

var UI_ITEMS=__UI_ITEMS__,UI_EQUIP=[],UI_SLA=[],UI_MODE='equip';
function unitApi(action,extra){return fetch('/api/mis/unit-issue-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,branchId:CTX.branchId},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
function toggleUnitIssue(){var p=el('unitIssuePanel');p.classList.toggle('hidden');if(!p.classList.contains('hidden')&&!UI_EQUIP.length)loadUnitIssue();}
function uiTab(m){UI_MODE=m;el('uiTab1').className='btn '+(m==='equip'?'gold':'grey')+' btn-sm';el('uiTab2').className='btn '+(m==='sla'?'gold':'grey')+' btn-sm';el('uiEquip').classList.toggle('hidden',m!=='equip');el('uiSla').classList.toggle('hidden',m!=='sla');}
function loadUnitIssue(){
  unitApi('load').then(function(res){if(res.status===200){UI_EQUIP=res.body.rows||[];renderUiEquip();}});
  unitApi('loadSla').then(function(res){if(res.status===200){UI_SLA=(res.body.rows||[]).map(function(r){r.active=r.active!==false;return r;});renderUiSla();}});
}
function renderUiEquip(){
  var hdr='<div style="overflow-x:auto"><table style="font-size:11px;min-width:900px"><thead><tr><th>Client</th><th>Location</th>';
  UI_ITEMS.forEach(function(it){hdr+='<th title="'+h(it.label)+'">'+h(it.abbr)+'</th>';});
  hdr+='<th>Next Issue</th><th>Remark</th></tr></thead><tbody>';
  var body=UI_EQUIP.map(function(r,i){
    var row='<tr><td>'+h(r.clientName)+'</td><td>'+h(r.location)+'</td>';
    UI_ITEMS.forEach(function(it){var v=(r.qty&&r.qty[it.key])||0;row+='<td><input type="number" min="0" style="width:42px" value="'+v+'" oninput="uiEq('+i+',\\''+it.key+'\\',this.value)"></td>';});
    row+='<td><input value="'+h(r.nextIssue||'')+'" oninput="UI_EQUIP['+i+'].nextIssue=this.value"></td>';
    row+='<td><input value="'+h(r.remark||'')+'" oninput="UI_EQUIP['+i+'].remark=this.value"></td></tr>';
    return row;
  }).join('');
  el('uiEquip').innerHTML=hdr+body+'</tbody></table></div>';
}
function uiEq(i,k,v){if(!UI_EQUIP[i].qty)UI_EQUIP[i].qty={};UI_EQUIP[i].qty[k]=Number(v)||0;}
function renderUiSla(){
  var hdr='<div style="overflow-x:auto"><table style="font-size:11px;min-width:1100px"><thead><tr><th>Client</th><th>Location</th><th>Datestamp</th>';
  UI_ITEMS.forEach(function(it){hdr+='<th title="'+h(it.label)+' issue qty">'+h(it.abbr)+'</th>';});
  hdr+='<th>Next Issue Date</th><th>Shared</th><th>Remark</th><th>Repeated</th><th>Stores</th></tr></thead><tbody>';
  var body='';
  UI_SLA.forEach(function(r,i){
    if(r.active===false)return;
    body+='<tr><td>'+h(r.clientName)+'</td><td>'+h(r.location)+'</td>';
    body+='<td><input type="date" value="'+h(r.issueDate||'')+'" oninput="UI_SLA['+i+'].issueDate=this.value"></td>';
    UI_ITEMS.forEach(function(it){var v=(r.qty&&r.qty[it.key])||0;body+='<td><input type="number" min="0" style="width:42px" value="'+v+'" oninput="uiSl('+i+',\\''+it.key+'\\',this.value)"></td>';});
    body+='<td><input type="date" value="'+h(r.nextIssueDate||'')+'" oninput="UI_SLA['+i+'].nextIssueDate=this.value"></td>';
    body+='<td><input type="checkbox"'+(r.sharedWithStores?' checked':'')+' onchange="UI_SLA['+i+'].sharedWithStores=this.checked"></td>';
    body+='<td><input value="'+h(r.remark||'')+'" oninput="UI_SLA['+i+'].remark=this.value"></td>';
    body+='<td style="color:'+(r.repeated?'#fbbf24':'#94a3b8')+'">'+(r.repeated?'⚠ Yes':'No')+'</td>';
    body+='<td><button class="btn grey btn-sm" onclick="shareStores('+i+')">✉ Stores</button></td></tr>';
  });
  el('uiSla').innerHTML=hdr+body+'</tbody></table></div>';
}
function uiSl(i,k,v){if(!UI_SLA[i].qty)UI_SLA[i].qty={};UI_SLA[i].qty[k]=Number(v)||0;}
function saveUnitIssue(){unitApi('save',{rows:UI_EQUIP}).then(function(res){el('uiMsg').textContent=res.status===200?'Equipment register saved ✓':(res.body.error||'Could not save');});}
function saveSlaIssue(){unitApi('saveSla',{rows:UI_SLA}).then(function(res){if(res.status===200&&res.body.rows)UI_SLA=res.body.rows;renderUiSla();el('uiMsg').textContent='SLA issues saved ✓';});}
function shareStores(i){
  var to=prompt('Send to stores email:','stores@agilegroup.co.in');if(!to)return;
  unitApi('sendStoresMail',{to:to,rowIndex:i,rows:UI_SLA}).then(function(res){
    if(res.status===200&&res.body.rows)UI_SLA=res.body.rows;
    renderUiSla();alert(res.status===200?'Sent to stores ✓':(res.body.error||'Could not send'));
  });
}
</script>
</body></html>`

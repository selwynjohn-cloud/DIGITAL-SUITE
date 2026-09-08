/** OJT User Guide and Troubleshooting pages — Track 1 (both portals). */

import { trainingPageHtml } from './training-shell.js'

export function ojtGuidePageHtml(): string {
  const body = `
<div class="panel">
  <h1>User Manual</h1>
  <p class="muted">Track 1 — <b>On Site Tactical Training (OJT)</b>. Same menus for Branch (HODs / Staff) and Management. <b>Updated 18 Aug 2026 — app working.</b></p>

  <h2 class="sec">Working today (18 Aug 2026)</h2>
  <ul class="muted" style="margin-left:18px;line-height:1.7">
    <li>Open from Command Centre → Agile Training → Staff or Management (email PIN first).</li>
    <li>Completion report: fill every column → <b>Review</b> (same page) → <b>Save</b> → <b>Preview</b> opens the client letter in a new window (clear Agile logo).</li>
    <li>Client mail: up to 3 client emails; CC trainer, HOD, Director.</li>
    <li>After Highly Beneficial feedback, offer Google review when Yes is chosen.</li>
  </ul>

  <h2 class="sec">Menu 1 · Dashboard</h2>
  <p class="muted"><b>Dashboard</b> shows training completed vs total sites, SLA schedule, guards trained vs sanctioned posts, units trained %, and balance schedule still to be conducted. Pick From / To dates for the period.</p>
  <p class="muted"><b>Branch Security Observation List</b> shows assigned trainer, pending days, and Completed / Open. Tap <b>Open</b> to register the Completion report (date, text, evidence). Every <b>Saturday</b>, open items are auto-mailed to the Branch HOD (CC Training, Director).</p>

  <h2 class="sec">Menu 2 · Training &amp; forms</h2>
  <ul class="muted" style="margin-left:18px;line-height:1.7">
    <li><b>Training schedule</b> — Make Schedule, Schedule list, Format preview, Notify client, <b>Training Confirmation and Attendance</b>, Completion report, Security Observations form.</li>
    <li><b>Training Confirmation and Attendance</b> — Trainer ticks <b>site(s)</b> of the same client, same branch, same area; guards from those sites are listed (mobiles from MIS guards list). Never edits Branch clients. Guards reply <b>EOI</b> then on training day <b>ATTENDANCE</b> → 5 Yes/No → marks → feedback.</li>
    <li><b>Notify client</b> — client intimation mail; Prepare Guards Link for unit WhatsApp group if needed.</li>
    <li><b>Training Notes</b> — teaching notes topic-wise + visual PPT (Agile header &amp; suite footer). View PPT / Download PPT.</li>
    <li><b>Question Bank</b> — Yes/No questions topic-wise (10+ per topic). Show/hide answers for trainer or print.</li>
    <li><b>Post Training Test / Guard &amp; Client feedback / Feedback analysis</b> — pick client from Master Directory list where shown.</li>
    <li><b>User Management / Master Directory</b> — open the live MIS pages.</li>
  </ul>

  <h2 class="sec">Help (last on the left)</h2>
  <ul class="muted" style="margin-left:18px;line-height:1.7">
    <li><b>User Manual</b> — this page (Branch and Management).</li>
    <li><b>Troubleshooting</b> — common fixes when login, mail, or WhatsApp does not work.</li>
  </ul>

  <h2 class="sec">Dates</h2>
  <p class="muted">Every date field uses a calendar date picker. Do not type dates by hand.</p>
  <p style="margin-top:16px"><a class="btn primary" href="/training/ojt">Back to OJT</a>
  <a class="btn" href="/training/ojt-help">Troubleshooting</a></p>
</div>`
  return trainingPageHtml({
    title: 'OJT User Manual',
    body,
    activeNav: 'ojt',
  })
}

export function ojtHelpPageHtml(): string {
  const body = `
<div class="panel">
  <h1>Troubleshooting</h1>
  <p class="muted">Track 1 — On Site Tactical Training (OJT). Quick checks for Branch and Management.</p>

  <h2 class="sec">Cannot open OJT / Track 1</h2>
  <p class="muted">Sign in again from Agile Training (email PIN). Use <b>Management</b> for all-branch view, or <b>HODs / Staff</b> for your branch. Director / IT / Sai can open both portals.</p>

  <h2 class="sec">Dashboard numbers look empty</h2>
  <p class="muted">Pick the correct From / To dates. Add schedules and completion reports first — KPIs read from saved schedules and Master Directory sanctioned posts.</p>

  <h2 class="sec">WhatsApp / EOI / ATTENDANCE</h2>
  <p class="muted">Open <b>Training Confirmation and Attendance</b>, pick the session, tap <b>Preview</b>. Tick the <b>site(s)</b> (same client · same branch · same area), tap <b>Save sites &amp; show guards</b> — guards from those units are listed. You do not need WhatsApp numbers yourself; mobiles come from the MIS guards list. Then Send. Branch clients are never changed. Guards reply <b>EOI</b> then on training day <b>ATTENDANCE</b>.</p>

  <h2 class="sec">Wrong sites or empty guards list</h2>
  <p class="muted">Venue / location on the schedule sets the <b>area</b>. Only sites in that area for that client appear. Premier: <b>Electronic City</b> (PEIPL P3 &amp; PEPPL P2 — same building) and <b>Sitharampuram, PEGPL P7</b> stay separate. Tick the sites you need, Save, then Preview again.</p>

  <h2 class="sec">Bank — need more branches to attend</h2>
  <p class="muted">Only bank sites in the <b>same area</b> are offered. Tick those sites and Save. This does not add or edit Branch clients / Master Directory.</p>

  <h2 class="sec">Cancel &amp; Share / Completion Share failed</h2>
  <p class="muted">Client email (and Branch HOD email for Security Observations) must be filled. Check that mail is configured on the server.</p>

  <h2 class="sec">Security Observations not for client</h2>
  <p class="muted">Security Observations are shared only to Branch HOD (CC trainer, Training, Director). They are never included in the client completion mail.</p>

  <h2 class="sec">Weekly closing chase mail</h2>
  <p class="muted">Every Saturday, each Branch HOD receives open observation reports. Closing the observation in the app stops it appearing next week.</p>

  <h2 class="sec">Need MIS help</h2>
  <p class="muted">Also see MIS Troubleshooting from the MIS portal menu.</p>
  <p style="margin-top:16px"><a class="btn primary" href="/training/ojt">Back to OJT</a>
  <a class="btn" href="/training/ojt-guide">User Manual</a>
  <a class="btn" href="/mis-troubleshooting" target="_blank" rel="noopener">MIS Troubleshooting</a></p>
</div>`
  return trainingPageHtml({
    title: 'OJT Troubleshooting',
    body,
    activeNav: 'ojt',
  })
}

/** Agile Training OJT module — Make Schedule, list, notify, completion, internal, dashboard. */

import { questionBanksJsonForPage } from './ojt-question-bank.js'
import { teachingNotesJsonForPage } from './ojt-teaching-notes.js'
import { ojtPptBrandJsonForPage } from './ojt-topic-ppt.js'
import { ojtGalleryWidgetHtml } from './ojt-gallery-widget.js'
import { trainingPageHtml } from './training-shell.js'

export function ojtPageHtml(): string {
  const teachingNotesJson = teachingNotesJsonForPage()
  const pptBrandJson = ojtPptBrandJsonForPage()
  const questionBanksJson = questionBanksJsonForPage()
  const body = `
<div class="panel">
  <h1>On Site Tactical Training (OJT)</h1>
  <p class="muted">Branch dashboard, schedules, feedback and security observations — same live menus for Branch and Management.</p>

  <div class="ojt-layout">
  <aside class="ojt-sidebar" aria-label="OJT menus">
    <div class="ojt-menu-label">Menu 1 · Dashboard</div>
    <div class="ojt-menu" id="menu1">
      <button type="button" data-tab="dashboard" class="on">Dashboard</button>
      <button type="button" data-tab="secObsList">Branch Security Observation List</button>
    </div>
    <div class="ojt-menu-label">Menu 2 · Training &amp; forms</div>
    <div class="ojt-menu" id="menu2">
      <button type="button" data-tab="schedule">Training schedule</button>
      <button type="button" data-tab="fbGuard">Guard feedback format</button>
      <button type="button" data-tab="fbClient">Client feedback format</button>
      <button type="button" data-tab="postTest">Post Training Test</button>
      <button type="button" data-tab="fbAnalysis">Feedback analysis</button>
      <button type="button" data-tab="qbank">Question Bank</button>
      <button type="button" data-tab="notesPpt">Training Notes</button>
      <button type="button" data-tab="subjectGuide">Subject Guide for guards</button>
      <a class="ojt-link" href="/training/fa-records">Facility Attendant Training</a>
      <a class="ojt-link" id="linkUsers" href="/mis-users" target="_blank" rel="noopener">User Management</a>
      <a class="ojt-link" id="linkMaster" href="/mis-admin" target="_blank" rel="noopener">Master Directory</a>
    </div>
    <div class="ojt-menu-label">Help</div>
    <div class="ojt-menu" id="menuHelp">
      <button type="button" data-tab="userManual">User Manual</button>
      <button type="button" data-tab="troubleshooting">Troubleshooting</button>
    </div>
  </aside>
  <div class="ojt-main">

  <div id="tab-dashboard">
    <div class="row">
      <label id="branchPickWrapDash" class="hidden">Branch
        <select id="branchPickDash"></select>
      </label>
      <label>Period from <input type="date" id="dashFrom"></label>
      <label>Period to <input type="date" id="dashTo"></label>
      <button type="button" class="btn primary" id="btnDashReload">Refresh</button>
    </div>
    <p class="muted" id="dashPeriodHint">Month period — pick From and To dates. Training Department shows Hyderabad-A, Hyderabad-B and Hi-Tech City individually.</p>
    <div class="kpi-grid" id="dashStats"></div>
    <h2 class="sec">By branch</h2>
    <div style="overflow:auto"><table><thead><tr>
      <th>Branch</th><th>Training completed</th><th>SLA schedule</th><th>Guards trained</th><th>Units trained %</th><th>Balance schedule</th>
    </tr></thead><tbody id="dashBranchBody"></tbody></table></div>
  </div>

  <div id="tab-secObsList" class="hidden">
    <p class="muted">Branch Security Observation board for <b>all branches</b> (Management) or your Training Department branches (training@). Time bar = days open vs 7-day SLA. Use <b>WhatsApp</b> to chase assigned staff. Open <b>Completion report</b> to close with evidence. <b>Reminder</b> / <b>Reopen</b> / <b>Delete both</b> (schedule + report) are for Management / Director. Saturdays: open items are auto-mailed to Branch HOD (CC Training, Director).</p>
    <div class="row">
      <label>Period from <input type="date" id="secObsFrom"></label>
      <label>Period to <input type="date" id="secObsTo"></label>
      <label id="secObsBranchWrap" class="hidden">Branch
        <select id="secObsBranch">
          <option value="all">All Branches</option>
        </select>
      </label>
      <button type="button" class="btn" id="btnSecObsReload">Refresh</button>
    </div>
    <div class="kpi-grid" id="secObsBanners"></div>
    <div style="overflow:auto"><table><thead><tr>
      <th>Branch</th><th>Date</th><th>Client</th><th>Time bar</th><th>Assigned to</th><th>Tracking</th><th>Actions</th>
    </tr></thead><tbody id="secObsBody"></tbody></table></div>

    <div id="secObsClosurePanel" class="panel hidden" style="margin-top:16px;border-color:#c9a84c">
      <div class="row" style="justify-content:space-between;align-items:center">
        <h2 class="sec" style="margin:0">Register Completion Report</h2>
        <button type="button" class="btn ghost" id="btnSecObsClosureClose">Close</button>
      </div>
      <p class="muted" id="secObsClosureMeta" style="margin:8px 0 12px"></p>
      <div id="secObsClosureDone" class="hidden" style="margin-bottom:12px;padding:10px 12px;border-radius:10px;background:#14532d;border:1px solid #22c55e;color:#bbf7d0;font-weight:700">Completed — this observation is closed on the list.</div>
      <div class="row">
        <label>Date of completion <input type="date" id="secObsClosureDate"></label>
      </div>
      <label class="wide" style="display:block;margin-bottom:10px">Text box
        <textarea id="secObsClosureText" placeholder="Describe the closing action / completion notes…" style="min-height:110px;width:100%"></textarea>
      </label>
      <label class="wide" style="display:block;margin-bottom:8px">Document evidence (PDF, image, Word, Excel — up to 5 files)
        <input type="file" id="secObsClosureFiles" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*,.png,.jpg,.jpeg,.webp,.gif" multiple>
      </label>
      <div id="secObsClosureFileList" class="muted" style="margin-bottom:12px;font-size:.85rem"></div>
      <div class="form-actions">
        <button type="button" class="btn primary" id="btnSecObsClosureSubmit">Submit Completion Report</button>
        <button type="button" class="btn" id="btnSecObsOpenForm">Open Security Observations form</button>
      </div>
    </div>
  </div>

  <div id="tab-schedule" class="hidden">
    <div class="ojt-subtabs" id="scheduleSub">
      <button type="button" data-sub="calendar" class="on">Make Schedule</button>
      <button type="button" data-sub="list">Schedule list</button>
      <button type="button" data-sub="format">Format preview</button>
      <button type="button" data-sub="notify">Notify client</button>
      <button type="button" data-sub="confirmAttend">Training Confirmation and Attendance</button>
      <button type="button" data-sub="completion">Completion report</button>
      <button type="button" data-sub="internal">Security Observations form</button>
    </div>
    <div id="sub-calendar">
      <div class="row">
        <label id="branchPickWrap" class="hidden">Branch
          <select id="branchPick"></select>
        </label>
        <label id="workBranchWrap" class="hidden">Train branch (clients from Hyd-A · Hyd-B · Hi-Tech)
          <select id="workBranchPick"></select>
        </label>
        <label>Date <input type="date" id="scheduleDatePick"></label>
        <button type="button" class="btn primary" id="btnNew">Add schedule</button>
        <button type="button" class="btn" id="btnReload">Refresh</button>
      </div>
      <p class="muted">Pick the training date, then press Add schedule. Or tap a day on the calendar.</p>
      <div class="cal" id="calGrid"></div>
    </div>
  </div>

  <div id="tab-list" class="hidden">
    <p class="muted">Best way to clear a test: press <b>Delete both</b> (Management / Director). It removes the schedule and the observation report together — no email to the client. Day-to-day cancellations still use <b>Cancel &amp; Share</b>.</p>
    <div class="row">
      <label>Filter client <input id="filterClient" placeholder="Client name"></label>
      <label>Status
        <select id="filterStatus">
          <option value="">All</option>
          <option value="Scheduled">Schedule</option>
          <option value="ClientNotified">Client notified</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </label>
      <label>Type
        <select id="filterSla">
          <option value="">All</option>
          <option value="RegularSchedule">Regular schedule</option>
          <option value="SLA">SLA</option>
          <option value="ClientRequest">Client Request</option>
          <option value="ManagementInstruction">Management Instruction</option>
          <option value="PostIncident">Post Incident</option>
        </select>
      </label>
    </div>
    <div style="overflow:auto"><table><thead><tr>
      <th>Date</th><th>Client</th><th>Trainer</th><th>Type</th><th>Status</th><th></th>
    </tr></thead><tbody id="listBody"></tbody></table></div>
  </div>

  <div id="tab-format" class="hidden">
    <h2 class="sec">Actual format preview</h2>
    <p class="muted">Tap <b>Show format</b> on a session for the <b>client intimation</b> letter. Use <b>Show monthly schedule format</b> only when you want the full-month table.</p>
    <div class="form-actions" style="margin:12px 0;flex-wrap:wrap">
      <button type="button" class="btn" id="btnPreviewMonthFormat">Show monthly schedule format</button>
      <button type="button" class="btn" id="btnOpenFormatNewTab">Print / open in new tab</button>
    </div>
    <div id="formatPreviewWrap" style="margin:14px 0;border:1px solid rgba(201,168,76,.45);border-radius:12px;overflow:hidden;background:#f1f5f9">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 12px;background:#0b1220;border-bottom:1px solid rgba(201,168,76,.35)">
        <b id="formatPreviewTitle" style="color:#fde68a">Format preview</b>
        <span class="muted" style="font-size:.8rem">Scroll inside the frame — full letter with dark text</span>
      </div>
      <iframe id="formatPreviewFrame" title="Format preview" style="display:block;width:100%;min-height:420px;height:70vh;border:0;background:#fff"></iframe>
    </div>
    <h3 class="sec" style="margin-top:18px">Client intimation format (per session)</h3>
    <p class="muted">Tap <b>Show format</b> — that session’s client intimation appears in the box above (not the monthly table).</p>
    <div id="formatSessionList"></div>
  </div>

  <div id="tab-notify" class="hidden">
    <h2 class="sec">Notify client &amp; Guards Link</h2>
    <p class="muted">Send client intimation first. For WhatsApp to each guard (Fast2SMS / Whapi), open <b>Training Confirmation and Attendance</b> under Training Schedule. Or use <b>Prepare Guards Link</b> for the unit WhatsApp group. On training date &amp; time: guards confirm attendance → 5 Yes/No → marks → feedback → Security News channel. Mail CC: Branch HOD, Director.</p>
    <div id="notifyList"></div>
  </div>

  <div id="tab-confirmAttend" class="hidden">
    <h2 class="sec">Training Confirmation and Attendance</h2>
    <p class="muted"><b>Steps:</b> 1) Pick session · 2) <b>Show client units</b> · 3) Toggle only the <b>unit / location</b> names you need · 4) <b>Load guards for selected units</b> · 5) Turn OFF <b>Select for Training</b> for absentees (or Delete) · 6) Send WhatsApp. WhatsApp tells absentees to reply <b>EOI DOJ DD/MM/YYYY</b>. <b>On training day at the site:</b> tap <b>Attendance request</b>. After the attendance list, tap <b>Send 5 questions to attended</b> (Yes/No from today’s topics). <b>Branch clients list is never changed.</b></p>
    <div class="row">
      <label class="wide">Training session
        <select id="confirmSessionPick"></select>
      </label>
    </div>
    <p class="muted" id="confirmScopeNote" style="margin:8px 0"></p>
    <div id="confirmBankUnitsBox" style="margin:10px 0;padding:14px;border:1px solid rgba(201,168,76,.35);border-radius:10px;background:#0b1220">
      <p class="muted" style="margin:0">Pick a session, then tap <b>Show client units</b>.</p>
    </div>
    <div class="form-actions" style="margin:12px 0;flex-wrap:wrap;gap:8px">
      <button type="button" class="btn primary" id="btnConfirmLoadUnits">Show client units</button>
      <button type="button" class="btn primary" id="btnConfirmLoadGuards">Load guards for selected units</button>
      <button type="button" class="btn" id="btnConfirmSelectAll">Select all guards for Training</button>
      <button type="button" class="btn" id="btnConfirmDeselectAll">Deselect all guards</button>
      <button type="button" class="btn primary" id="btnConfirmSendAll">Send WhatsApp intimation to all Guards</button>
      <button type="button" class="btn" id="btnConfirmAttendanceReq">Attendance request WhatsApp to all responded</button>
      <button type="button" class="btn primary" id="btnConfirmSendQuiz">Send 5 questions to attended</button>
      <button type="button" class="btn" id="btnConfirmPreview">Preview WhatsApp message</button>
      <button type="button" class="btn" id="btnConfirmCopy">Copy message</button>
      <a class="btn" id="btnConfirmOpenLink" href="#" target="_blank" rel="noopener" style="display:none">Open confirmation link</a>
    </div>
    <p class="muted" id="confirmWaStatus"></p>
    <div id="confirmMsgBox" class="panel" style="margin:10px 0;padding:12px;white-space:pre-wrap;font-size:.88rem;background:#0b1220;border:1px solid rgba(201,168,76,.35);min-height:60px;color:#e2e8f0">WhatsApp message preview (optional).</div>
    <p class="muted" id="confirmLinkLine"></p>
    <div id="confirmGuardsBox" style="overflow:auto;margin-top:10px"></div>
  </div>

  <div id="tab-completion" class="hidden">
    <p class="muted">Fill <b>every column</b>, then <b>Review</b> (on this page — does not open a new window). After review tap <b>Save</b> to return to the completion report. <b>Preview</b> opens the client letter in a new window. <b>Send to Client</b> mails the client (up to 3 emails), CC trainer, Branch HOD and Director. If Highly Beneficial, the client is asked about a Google review. Security Observations are never included.</p>
    <div id="completionPick"></div>
    <div id="completionForm" class="hidden">
      <div id="completionEdit">
        <h2 class="sec">Completion report</h2>
        <div class="row">
          <label>Date <input type="date" id="rDate"></label>
          <label>Sanctioned strength <input id="rSan"></label>
          <label>Attended count <input id="rAttCount"></label>
        </div>
        <div class="row">
          <label class="wide">Topics covered (from schedule) <textarea id="rTopics" rows="3"></textarea></label>
        </div>
        <div class="row">
          <label class="wide">Attended list <textarea id="rAttNames" rows="4" placeholder="Names of guards who attended"></textarea></label>
        </div>
        <div class="row">
          <label class="wide">OM reported (name) <textarea id="rOpsStaff" rows="2" placeholder="Operations Manager / OM name reported on this completion"></textarea></label>
        </div>
        <div class="row">
          <label class="wide">Marks statement attachment
            <input type="file" id="rMarksFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,image/*,application/pdf">
            <span class="muted" id="rMarksFileMeta"></span>
          </label>
        </div>
        <div class="row">
          <div class="wide" style="display:flex;flex-direction:column;gap:4px;flex:2;min-width:220px">
            <span style="font-size:.78rem;font-weight:700;color:#94a3b8">Training photos / selfies (maximum 3)</span>
            <span class="muted" style="display:block;font-weight:500;margin:2px 0 8px">Tap Take photo / selfie — allow camera when asked. Or upload from gallery. Maximum 3 photos.</span>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">
              <button type="button" class="btn" id="btnOjtSelfie">📷 Take photo / selfie</button>
              <label for="ojtGalFile" class="btn" id="btnOjtGallery">🖼 Upload from gallery</label>
            </div>
            <div id="rPhotoGrid" style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:6px"></div>
            <span class="muted" id="rPhotoMeta">0 of 3 photos — each photo has a Delete button</span>
          </div>
        </div>
        <div class="row">
          <label class="wide">Feedback <textarea id="rFeedback" rows="4" placeholder="Feedback from guard / client"></textarea></label>
        </div>
        <div id="rClientBenefitBox" style="margin:12px 0;padding:12px 14px;border-radius:12px;border:1px solid rgba(201,168,76,.45);background:#111a30">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
            <div style="font-weight:800;color:#fde68a">Client feedback (our record)</div>
            <button type="button" class="btn" id="btnRefreshClientBenefit" style="min-height:36px;padding:6px 12px;font-size:.85rem">Refresh</button>
          </div>
          <p class="muted" style="margin:0 0 6px">Saved on this completion report when the client taps <b>Feedback</b> in the Share email and submits.</p>
          <p id="rClientBenefitMeta" style="margin:0;color:#e2e8f0;line-height:1.5">Pending — client has not replied yet.</p>
        </div>
        <div class="form-actions">
          <button type="button" class="btn" id="btnSaveReport">Save draft</button>
          <button type="button" class="btn" id="btnPreviewReport">Preview client report</button>
          <button type="button" class="btn" id="btnReviewReport">Review</button>
        </div>
      </div>
      <div id="completionReview" class="hidden">
        <h2 class="sec">Review — Completion report</h2>
        <p class="muted">Check every column here. Preview opens a new window. After review tap <b>Save</b> to return to the completion report (does not open Preview).</p>
        <div id="completionReviewBody" style="white-space:pre-wrap;line-height:1.5;background:#111a30;border:1px solid rgba(201,168,76,.35);border-radius:10px;padding:14px;margin:10px 0;color:#e2e8f0"></div>
        <div id="completionReviewPhotos" style="display:flex;flex-wrap:wrap;gap:10px;margin:10px 0"></div>
        <div class="form-actions">
          <button type="button" class="btn primary" id="btnSaveAfterReview">Save</button>
          <button type="button" class="btn" id="btnPreviewReportReview">Preview client report</button>
          <button type="button" class="btn" id="btnEditReport">Edit</button>
          <button type="button" class="btn primary" id="btnSendReport">Send to Client</button>
        </div>
        <p class="muted" id="reportMailMeta"></p>
      </div>
    </div>
  </div>

  <div id="tab-internal" class="hidden">
    <p class="muted">Security Observations — not sent to the client. Save → Review → Edit → <b>Sent to HOD</b> (To Branch HOD; CC Training Staff and Director).</p>
    <div id="internalPick"></div>
    <div id="internalForm" class="hidden">
      <div id="securityEdit">
        <h2 class="sec">Security Observations</h2>
        <div class="row">
          <label>1. Turnout of guards
            <select id="iTurnout">
              <option value="">—</option>
              <option value="Excellent">Excellent</option>
              <option value="ToBeImproved">To be improved</option>
            </select>
          </label>
          <label class="wide" id="iTurnoutReasonWrap" style="display:none">Reason <textarea id="iTurnoutReason" rows="3"></textarea></label>
        </div>
        <div class="row">
          <label>2. ID card validity
            <select id="iIdValid">
              <option value="">—</option>
              <option value="AllValid">All valid</option>
              <option value="ToBeCorrected">To be corrected</option>
            </select>
          </label>
          <label class="wide" id="iIdReasonWrap" style="display:none">Reason <textarea id="iIdReason" rows="3"></textarea></label>
        </div>
        <div class="row">
          <label>3. Record keeping
            <select id="iRecord">
              <option value="">—</option>
              <option value="Excellent">Excellent</option>
              <option value="ToBeImproved">To be improved</option>
            </select>
          </label>
          <label class="wide" id="iRecordReasonWrap" style="display:none">Reason <textarea id="iRecordReason" rows="3"></textarea></label>
        </div>
        <div class="row">
          <label>4. OM previous visit date <input type="date" id="iOmDate"></label>
          <label>5. Previous night check date <input type="date" id="iNightDate"></label>
        </div>
        <div class="row">
          <label class="wide">6. Any other abnormality observed <textarea id="iAbnormal" rows="3"></textarea></label>
        </div>
        <div class="row">
          <label class="wide">7. Information gathering <textarea id="iInfoGather" rows="3"></textarea></label>
        </div>
        <p class="muted" id="nightHint"></p>
        <div class="form-actions">
          <button type="button" class="btn primary" id="btnSaveInternal">Save</button>
          <button type="button" class="btn" id="btnReviewInternal">Review</button>
        </div>
      </div>
      <div id="securityReview" class="hidden">
        <h2 class="sec">Review — Security Observations</h2>
        <div id="securityReviewBody" style="white-space:pre-wrap;line-height:1.5;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin:10px 0"></div>
        <div class="form-actions">
          <button type="button" class="btn" id="btnEditInternal">Edit</button>
          <button type="button" class="btn primary" id="btnShareInternal">Sent to HOD</button>
        </div>
        <p class="muted" id="securityMailMeta"></p>
      </div>
    </div>
  </div>

  <div id="tab-notesPpt" class="hidden">
    <h2 class="sec">Training Notes — Teaching notes (topic wise)</h2>
    <p class="muted">Pick a <b>category</b>, then a <b>training topic</b>. Teaching notes for the trainer appear below — same on Branch and Management portals.</p>
    <div class="row">
      <label>Category
        <select id="tnCategory"></select>
      </label>
      <label class="wide">Training topic
        <select id="tnTopic"></select>
      </label>
    </div>
    <div class="form-actions" style="margin:8px 0 12px;flex-wrap:wrap">
      <button type="button" class="btn primary" id="btnTnShow">Show teaching notes</button>
      <button type="button" class="btn primary" id="btnTnPpt">View PPT</button>
      <button type="button" class="btn" id="btnTnPptDl">Download PPT</button>
      <button type="button" class="btn" id="btnTnPrint">Print notes</button>
      <button type="button" class="btn" id="btnTnCopy">Copy notes</button>
    </div>
    <div id="tnBody" style="margin:0 0 18px;padding:16px;border-radius:14px;border:1px solid rgba(201,168,76,.4);background:#f8fafc;color:#0f172a;min-height:180px"></div>
    <div id="tnPptStrip" style="margin:0 0 18px"></div>
    <h3 class="sec">Your extra notes / own PPT link (optional)</h3>
    <p class="muted">Each topic already has a visual Agile PPT (logo header + footer on every slide). Save an extra link only if you have your own file.</p>
    <div class="row">
      <label>Date <input type="date" id="exNotesDate"></label>
      <label>Subject
        <select id="exNotesSubject"></select>
      </label>
    </div>
    <div class="row"><label class="wide">Title / PPT name <input id="exNotesTitle"></label></div>
    <div class="row"><label class="wide">Notes / PPT link or summary <textarea id="exNotesBody" rows="5"></textarea></label></div>
    <div class="form-actions"><button type="button" class="btn primary" id="btnSaveNotes">Save</button></div>
    <div id="exNotesList" style="margin-top:12px"></div>
  </div>

  <div id="pptModal" class="hidden" style="position:fixed;inset:0;z-index:9999;background:rgba(2,6,23,.88);flex-direction:column;padding:10px">
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-bottom:8px">
      <b id="pptModalTitle" style="color:#fde68a">Topic PPT</b>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <button type="button" class="btn" id="btnPptPrev">◀ Prev</button>
        <span id="pptPageLabel" class="muted" style="align-self:center;min-width:70px;text-align:center">1 / 1</span>
        <button type="button" class="btn" id="btnPptNext">Next ▶</button>
        <button type="button" class="btn" id="btnPptPrintSlides">Print slides</button>
        <button type="button" class="btn primary" id="btnPptClose">Close</button>
      </div>
    </div>
    <div id="pptStage" style="flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:auto"></div>
  </div>

  <div id="tab-qbank" class="hidden">
    <h2 class="sec">Question Bank — Yes / No (topic wise)</h2>
    <p class="muted">Pick a <b>category</b>, then a <b>training topic</b>. Each topic has <b>minimum 10 Yes/No questions</b> for class use. Same on Branch and Management portals.</p>
    <div class="row">
      <label>Category
        <select id="qbCategory"></select>
      </label>
      <label class="wide">Training topic
        <select id="qbTopic"></select>
      </label>
    </div>
    <div class="form-actions" style="margin:8px 0 12px;flex-wrap:wrap">
      <button type="button" class="btn primary" id="btnQbShow">Show questions</button>
      <button type="button" class="btn" id="btnQbToggleAns">Show / hide answers</button>
      <button type="button" class="btn" id="btnQbPrint">Print</button>
      <button type="button" class="btn" id="btnQbCopy">Copy questions</button>
    </div>
    <div id="qbBody" style="margin:0 0 18px;padding:16px;border-radius:14px;border:1px solid rgba(201,168,76,.4);background:#f8fafc;color:#0f172a;min-height:180px"></div>
    <h3 class="sec">Your extra draft questions (optional)</h3>
    <p class="muted">Topic Yes/No banks above are ready. Save extra drafts only if you need more for your branch.</p>
    <div class="row">
      <label>Subject <select id="exQbSubject"></select></label>
      <label>Date <input type="date" id="exQbDate"></label>
    </div>
    <div class="row"><label class="wide">Questions (draft) <textarea id="exQbBody" rows="8" placeholder="1. …&#10;2. …"></textarea></label></div>
    <div class="form-actions"><button type="button" class="btn primary" id="btnSaveQb">Save draft</button></div>
    <div id="exQbList" style="margin-top:12px"></div>
  </div>
  <div id="tab-subjectGuide" class="hidden">
    <h2 class="sec">Subject Guide for guards</h2>
    <p class="muted">Short subject guides for guards — pick a subject and save the guide text.</p>
    <div class="row">
      <label>Subject <select id="exSgSubject"></select></label>
      <label>Date <input type="date" id="exSgDate"></label>
    </div>
    <div class="row"><label class="wide">Guide text <textarea id="exSgBody" rows="8"></textarea></label></div>
    <div class="form-actions"><button type="button" class="btn primary" id="btnSaveSg">Save guide</button></div>
    <div id="exSgList" style="margin-top:12px"></div>
  </div>

  <div id="tab-userManual" class="hidden">
    <h2 class="sec">User Manual</h2>
    <p class="muted">On Site Tactical Training (OJT) — same guide for Branch and Management portals.</p>
    <div class="panel" style="padding:0;overflow:hidden;border-radius:12px;border:1px solid rgba(201,168,76,.35)">
      <iframe src="/training/ojt-guide" title="OJT User Manual" style="width:100%;min-height:78vh;border:none;display:block;background:#f1f5f9"></iframe>
    </div>
    <p class="muted" style="margin-top:10px"><a class="btn" href="/training/ojt-guide" target="_blank" rel="noopener">Open User Manual in new tab</a></p>
  </div>
  <div id="tab-troubleshooting" class="hidden">
    <h2 class="sec">Troubleshooting</h2>
    <p class="muted">Quick fixes when something does not work — Branch and Management.</p>
    <div class="panel" style="padding:0;overflow:hidden;border-radius:12px;border:1px solid rgba(201,168,76,.35)">
      <iframe src="/training/ojt-help" title="OJT Troubleshooting" style="width:100%;min-height:78vh;border:none;display:block;background:#f1f5f9"></iframe>
    </div>
    <p class="muted" style="margin-top:10px"><a class="btn" href="/training/ojt-help" target="_blank" rel="noopener">Open Troubleshooting in new tab</a></p>
  </div>

  <div id="tab-postTest" class="hidden">
    <h2 class="sec">Post Training Test</h2>
    <div class="row">
      <label class="wide">Client name
        <select id="exTestClient"><option value="">— select client —</option></select>
      </label>
      <label>Date <input type="date" id="exTestDate"></label>
      <label>Score <input id="exTestScore" placeholder="e.g. 8/10"></label>
    </div>
    <div class="row"><label class="wide">Test notes / questions summary <textarea id="exTestBody" rows="5"></textarea></label></div>
    <div class="form-actions"><button type="button" class="btn primary" id="btnSaveTest">Save test</button></div>
    <div id="exTestList" style="margin-top:12px"></div>
  </div>
  <div id="tab-fbGuard" class="hidden">
    <h2 class="sec">Guard feedback format</h2>
    <p class="muted">Simple form for guards after every OJT. Use on site — save in app or print blank copy.</p>
    <div id="guardFbPrint">
      <div class="row">
        <label class="wide">Client / site
          <select id="exFgClient"><option value="">— select client —</option></select>
        </label>
        <label>Training date <input type="date" id="exFgDate"></label>
        <label>Guard name <input id="exFgGuardName" placeholder="Optional"></label>
      </div>
      <div class="row">
        <label>1. Training was useful?
          <select id="exFgQ1"><option value="">—</option><option>Yes</option><option>Somewhat</option><option>No</option></select>
        </label>
        <label>2. Trainer explained clearly?
          <select id="exFgQ2"><option value="">—</option><option>Yes</option><option>Somewhat</option><option>No</option></select>
        </label>
      </div>
      <div class="row">
        <label>3. Topics easy to understand?
          <select id="exFgQ3"><option value="">—</option><option>Yes</option><option>Somewhat</option><option>No</option></select>
        </label>
        <label>4. Will use this on duty?
          <select id="exFgQ4"><option value="">—</option><option>Yes</option><option>Somewhat</option><option>No</option></select>
        </label>
      </div>
      <div class="row">
        <label>5. Overall rating
          <select id="exFgQ5"><option value="">—</option><option>Excellent</option><option>Good</option><option>Average</option><option>Poor</option></select>
        </label>
      </div>
      <div class="row">
        <label class="wide">6. Any suggestion? <textarea id="exFgQ6" rows="3" placeholder="Write in simple words…"></textarea></label>
      </div>
    </div>
    <div class="form-actions">
      <button type="button" class="btn primary" id="btnSaveFg">Save guard feedback</button>
      <button type="button" class="btn" id="btnPrintFg">Print blank form</button>
      <button type="button" class="btn" id="btnClearFg">Clear</button>
    </div>
    <div id="exFgList" style="margin-top:12px"></div>
  </div>

  <div id="tab-fbClient" class="hidden">
    <h2 class="sec">Client feedback format</h2>
    <p class="muted">Main client question is also on the <b>completion report email</b> (Give feedback button). Use this form on site if needed — save in app or print blank copy.</p>
    <div id="clientFbPrint">
      <div class="row">
        <label class="wide">Client / site
          <select id="exFcClient"><option value="">— select client —</option></select>
        </label>
        <label>Training date <input type="date" id="exFcDate"></label>
        <label>Client person name <input id="exFcPerson" placeholder="Security Head / Officer"></label>
      </div>
      <div class="row">
        <label class="wide">Overall, how was the OJT beneficial to our security operations?
          <select id="exFcBenefit">
            <option value="">— select —</option>
            <option>Highly Beneficial</option>
            <option>Beneficial</option>
            <option>Needs Improvement</option>
          </select>
        </label>
      </div>
      <div class="row">
        <label>1. Training done as scheduled?
          <select id="exFcQ1"><option value="">—</option><option>Yes</option><option>No</option></select>
        </label>
        <label>2. Topics useful for your site?
          <select id="exFcQ2"><option value="">—</option><option>Yes</option><option>Somewhat</option><option>No</option></select>
        </label>
      </div>
      <div class="row">
        <label>3. Trainer professionalism
          <select id="exFcQ3"><option value="">—</option><option>Excellent</option><option>Good</option><option>Average</option><option>Poor</option></select>
        </label>
        <label>4. Guards' attention / participation
          <select id="exFcQ4"><option value="">—</option><option>Excellent</option><option>Good</option><option>Average</option><option>Poor</option></select>
        </label>
      </div>
      <div class="row">
        <label>5. Overall satisfaction
          <select id="exFcQ5"><option value="">—</option><option>Excellent</option><option>Good</option><option>Average</option><option>Poor</option></select>
        </label>
      </div>
      <div class="row">
        <label class="wide">6. Topic to add next time <input id="exFcQ6" placeholder="Optional topic name"></label>
      </div>
      <div class="row">
        <label class="wide">7. Remarks <textarea id="exFcQ7" rows="3" placeholder="Any other comment…"></textarea></label>
      </div>
    </div>
    <div class="form-actions">
      <button type="button" class="btn primary" id="btnSaveFc">Save client feedback</button>
      <button type="button" class="btn" id="btnPrintFc">Print blank form</button>
      <button type="button" class="btn" id="btnClearFc">Clear</button>
    </div>
    <div id="exFcList" style="margin-top:12px"></div>
  </div>

  <div id="tab-fbAnalysis" class="hidden">
    <h2 class="sec">Feedback analysis</h2>
    <p class="muted">Summary of guard feedback, client feedback and completion feedback for the month.</p>
    <div id="fbAnalysisBody"></div>
  </div>

  </div><!-- /.ojt-main -->
  </div><!-- /.ojt-layout -->
</div>

<div id="editor" class="panel hidden" style="margin-top:14px">
  <h2 class="sec" id="editorTitle">Add schedule</h2>
  <input type="hidden" id="sId">
  <div class="row">
    <label class="wide">Client / unit
      <select id="sClient"></select>
    </label>
    <label>Date <input type="date" id="sDate"></label>
    <label>Time <input type="time" id="sTime"></label>
  </div>
  <div class="row">
    <label class="wide"><input type="checkbox" id="sTrainerOther"> Trainer is a different person (not the signed-in staff)</label>
  </div>
  <div class="row" id="trainerFields">
    <label>Trainer name <input id="sTrainer" placeholder="Leave blank if you are the trainer"></label>
    <label>Trainer email <input id="sTrainerEmail" type="email" placeholder="trainer@agilegroup.co.in"></label>
  </div>
  <div class="row">
    <label>Status
      <select id="sStatus">
        <option value="Scheduled">Schedule</option>
        <option value="ClientNotified">Client notified</option>
      </select>
    </label>
    <label>Type
      <select id="sSla">
        <option value="RegularSchedule">Regular schedule</option>
        <option value="SLA">SLA</option>
        <option value="ClientRequest">Client Request</option>
        <option value="ManagementInstruction">Management Instruction</option>
        <option value="PostIncident">Post Incident</option>
      </select>
    </label>
  </div>
  <div class="row">
    <label class="wide">Venue / location <input id="sLoc"></label>
    <label>Branch HOD email (CC) <input id="sBhEmail" type="email"></label>
  </div>
  <div class="row">
    <label>Client email 1 <input id="sClientEmail" type="email" placeholder="client@example.com"></label>
    <label>Client email 2 <input id="sClientEmail2" type="email" placeholder="optional"></label>
    <label>Client email 3 <input id="sClientEmail3" type="email" placeholder="optional"></label>
  </div>
  <h3 class="sec" style="margin-top:8px">Training topics</h3>
  <p class="muted">Pick from the OJT list (usual class uses 3). Client Security Head may suggest more — use <b>Add / edit topics</b>.</p>
  <div class="row">
    <label class="wide">Topic-1
      <select id="sTopicPick1"></select>
      <input id="sTopicCustom1" class="hidden" maxlength="500" placeholder="Type client / site topic…" style="margin-top:6px">
    </label>
  </div>
  <div class="row">
    <label class="wide">Topic-2
      <select id="sTopicPick2"></select>
      <input id="sTopicCustom2" class="hidden" maxlength="500" placeholder="Type client / site topic…" style="margin-top:6px">
    </label>
  </div>
  <div class="row">
    <label class="wide">Topic-3
      <select id="sTopicPick3"></select>
      <input id="sTopicCustom3" class="hidden" maxlength="500" placeholder="Type client / site topic…" style="margin-top:6px">
    </label>
  </div>
  <div class="row">
    <label class="wide">Topic-4 (optional)
      <select id="sTopicPick4"></select>
      <input id="sTopicCustom4" class="hidden" maxlength="500" placeholder="Type client / site topic…" style="margin-top:6px">
    </label>
  </div>
  <div class="row">
    <label class="wide">Topic-5 (optional)
      <select id="sTopicPick5"></select>
      <input id="sTopicCustom5" class="hidden" maxlength="500" placeholder="Type client / site topic…" style="margin-top:6px">
    </label>
  </div>
  <div class="row" style="align-items:center;gap:10px;flex-wrap:wrap">
    <button type="button" class="btn" id="btnToggleTopicManage">Add / edit topics</button>
    <span class="muted" id="topicManageHint">For client-suggested or site-specific topics</span>
  </div>
  <div id="topicManagePanel" class="hidden" style="margin:10px 0 14px;padding:12px;border:1px solid #334155;border-radius:10px;background:#0b1220">
    <p class="muted" style="margin-top:0">Add a topic suggested by the client Security Head, or edit an existing one. Inactive topics stay in history but cannot be newly selected.</p>
    <div class="row">
      <input type="hidden" id="tmEditId" value="">
      <label class="wide">Topic title <input id="tmTitle" maxlength="500" placeholder="e.g. Gate pass for scrap vehicles"></label>
    </div>
    <div class="row">
      <label>Category
        <select id="tmCategory">
          <option>Client suggested</option>
          <option>Motivation &amp; job</option>
          <option>Turnout &amp; behaviour</option>
          <option>Visitors &amp; access</option>
          <option>Vehicles</option>
          <option>Post &amp; records (SLA)</option>
          <option>Fire &amp; bomb</option>
          <option>First aid</option>
          <option>Travel &amp; special duty</option>
          <option>Industry / site</option>
        </select>
      </label>
      <button type="button" class="btn primary" id="btnSaveTopic">Save topic</button>
      <button type="button" class="btn" id="btnClearTopicForm">Clear</button>
    </div>
    <div style="overflow:auto;max-height:220px;margin-top:8px">
      <table>
        <thead><tr><th>#</th><th>Category</th><th>Topic</th><th></th></tr></thead>
        <tbody id="tmTopicBody"></tbody>
      </table>
    </div>
  </div>
  <input type="hidden" id="sTopic1" value="">
  <input type="hidden" id="sTopic2" value="">
  <input type="hidden" id="sTopic3" value="">
  <input type="hidden" id="sTopic4" value="">
  <input type="hidden" id="sTopic5" value="">
  <div class="row">
    <label>Table Top Exercise
      <select id="sTt"><option value="">—</option><option>Yes</option><option>No</option></select>
    </label>
    <label class="wide">Table-top notes <input id="sTtNotes"></label>
  </div>
  <div class="row">
    <label>Feedback from Guard
      <select id="sFbGuard" disabled><option value="Yes" selected>Yes (compulsory)</option></select>
    </label>
    <label>Feedback from Client
      <select id="sFbClient" disabled><option value="Yes" selected>Yes (compulsory)</option></select>
    </label>
  </div>
  <div class="row">
    <label class="wide">Security equipment to identify <textarea id="sEquip"></textarea></label>
    <label class="wide">Sample questions for guards <textarea id="sQuestions"></textarea></label>
  </div>
  <div id="sVehicleBlock" style="margin:12px 0 4px;padding:12px;border:1px solid #334155;border-radius:10px;background:#0b1220">
    <label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer">
      <input type="checkbox" id="sVehicleReq" style="margin-top:4px">
      <span><b>Ask Control for a vehicle</b><br><span class="muted">Tick only if the trainer needs a vehicle. Control gets a mail and confirms driver + vehicle number. Existing schedule fields stay as they are.</span></span>
    </label>
    <input type="hidden" id="sVehicleCaseNo" value="">
    <p class="muted" id="sVehicleStatus" style="margin:8px 0 0"></p>
  </div>
  <div class="form-actions">
    <button type="button" class="btn primary" id="btnSaveSession">Save Schedule</button>
    <button type="button" class="btn ghost" id="btnCloseEditor">Close</button>
  </div>
</div>

<div id="cancelPanel" class="panel hidden" style="margin-top:14px">
  <h2 class="sec">Cancel &amp; Share</h2>
  <p class="muted">Cancellation is mailed to the Client automatically, with CC to Branch HOD and Director.</p>
  <input type="hidden" id="cancelSessionId">
  <p id="cancelMeta" class="muted"></p>
  <div class="row">
    <label class="wide">Reason for cancellation <textarea id="cancelReason" rows="4" placeholder="Enter reason…"></textarea></label>
  </div>
  <div class="form-actions">
    <button type="button" class="btn danger" id="btnConfirmCancel">Cancel &amp; Share</button>
    <button type="button" class="btn ghost" id="btnCloseCancel">Close</button>
  </div>
</div>

<input type="file" id="rPhotoCam" accept="image/*" capture="user" tabindex="-1" aria-hidden="true" style="position:fixed;left:-9999px;width:1px;height:1px;opacity:0">
<div id="ojtCamModal" class="cam-modal hidden">
  <div class="cam-top" id="ojtCamTop">📷 Selfie (front camera) — face the camera, then tap Capture</div>
  <div class="cam-video-wrap"><video id="ojtCamVideo" autoplay playsinline muted></video></div>
  <canvas id="ojtCamCanvas" style="display:none"></canvas>
  <div class="cam-actions">
    <button type="button" class="btn" id="btnOjtCamRotate">↻ Rotate</button>
    <button type="button" class="btn" id="btnOjtCamFlip">🔄 Flip camera</button>
    <button type="button" class="btn primary" id="btnOjtCamSnap">📷 Capture</button>
    <button type="button" class="btn" id="btnOjtCamClose">Cancel</button>
  </div>
</div>
`

  const script = `
(function(){
  var STATE={sessions:[],clients:[],branches:[],trainingDeptBranches:[],questionSubjects:[],ojtTopics:[],role:'staff',trainingDeptManager:false,clientScope:'branch-hod',branchId:'',workBranchId:'',month:'',selectedId:'',report:null,session:null,suggestBh:'',staffEmail:'',staffName:'',marksFile:null,completionPhotos:[],secObsClosureFiles:[],secObsRow:null,tab:'dashboard',scheduleSub:'calendar',dash:null,pendingFormatSessionId:''};
  var TEACHING_NOTES=${teachingNotesJson};
  var PPT_BRAND=${pptBrandJson};
  var QUESTION_BANKS=${questionBanksJson};
  var PPT_STATE={slides:[], index:0, topic:''};
  var QB_STATE={showAnswers:true};
  var OJT_MAX_PHOTOS=3;
  var OJT_CAM_STREAM=null;
  var OJT_CAM_FACING='user';
  var OJT_CAM_ROT=0;
  var DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var TYPE_LABELS={
    RegularSchedule:'Regular schedule',
    SLA:'SLA',
    ClientRequest:'Client Request',
    ManagementInstruction:'Management Instruction',
    PostIncident:'Post Incident',
    Routine:'Regular schedule'
  };

  function $(id){return document.getElementById(id);}
  function api(action, extra){
    var ex=extra||{};
    var body=Object.assign({action:action, month:STATE.month, branchId:STATE.branchId, workBranchId:STATE.workBranchId}, ex);
    /** Keep an explicit branch from the caller (e.g. observation row) — do not overwrite with Training Dept default. */
    if(ex.branchId) body.branchId=ex.branchId;
    else if(action!=='listMonth' && action!=='dashboard' && action!=='listOjtTopics' && action!=='saveOjtTopic' && action!=='setOjtTopicActive' && action!=='purgeTestSession' && action!=='getReport' && action!=='submitSecObsClosure' && action!=='secObsWhatsApp' && action!=='secObsReminder' && action!=='secObsReopen'){
      body.branchId=effectiveBranchId();
    }
    if(ex.workBranchId) body.workBranchId=ex.workBranchId;
    if(ex.trainingDate && !ex.month) body.month=String(ex.trainingDate).slice(0,7)||body.month;
    return fetch('/api/training/ojt-data',{method:'POST',headers:trainingAuthHeaders(),body:JSON.stringify(body)})
      .then(function(r){return r.json();})
      .then(function(j){
        if(!j||j.ok===false) throw new Error((j&&j.error)||'Request failed');
        return j;
      });
  }
  function todayYmd(){
    var d=new Date();
    var z=function(n){return (n<10?'0':'')+n;};
    return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate());
  }
  function statusLabel(st){
    if(st==='Scheduled') return 'Schedule';
    if(st==='ClientNotified') return 'Client notified';
    return st||'';
  }
  function statusPill(st){
    var c='pill';
    if(st==='Completed') c+=' ok';
    else if(st==='Cancelled') c+=' bad';
    else if(st==='Scheduled'||st==='ClientNotified') c+=' warn';
    return '<span class="'+c+'">'+esc(statusLabel(st))+'</span>';
  }
  function typeLabel(t){ return TYPE_LABELS[t]||t||'—'; }
  var SCHEDULE_SUBS=['calendar','list','format','notify','confirmAttend','completion','internal'];
  var ALL_TABS=['dashboard','secObsList','schedule','list','format','notify','confirmAttend','completion','internal','notesPpt','qbank','subjectGuide','postTest','fbGuard','fbClient','fbAnalysis','userManual','troubleshooting'];
  var CONFIRM_WA={ text:'', url:'', whatsappUrl:'', guards:[], waReady:false };
  function setMenuOn(name){
    document.querySelectorAll('#menu1 button, #menu2 button, #menuHelp button').forEach(function(b){
      b.classList.toggle('on', b.getAttribute('data-tab')===name);
    });
  }
  function showScheduleSub(sub, opts){
    STATE.scheduleSub=sub||'calendar';
    document.querySelectorAll('#scheduleSub button').forEach(function(b){
      b.classList.toggle('on', b.getAttribute('data-sub')===STATE.scheduleSub);
    });
    var cal=$('sub-calendar'); if(cal) cal.classList.toggle('hidden', STATE.scheduleSub!=='calendar');
    SCHEDULE_SUBS.forEach(function(t){
      if(t==='calendar') return;
      var el=$('tab-'+t); if(el) el.classList.toggle('hidden', STATE.scheduleSub!==t);
    });
    if(STATE.scheduleSub==='list') renderList();
    if(STATE.scheduleSub==='format') renderFormatPreview(opts||{});
    if(STATE.scheduleSub==='notify') renderNotify();
    if(STATE.scheduleSub==='confirmAttend') renderConfirmAttend();
    if(STATE.scheduleSub==='completion'){ renderCompletionPick(); showGalleryInput(true); }
    else showGalleryInput(false);
    if(STATE.scheduleSub==='internal') renderInternalPick();
  }
  var LAST_FORMAT_HTML='';
  var LAST_FORMAT_TITLE='';
  var LAST_PREVIEW_BLOB='';
  function buildPreviewDoc(html, title){
    /** Standalone light document — blocks dark portal CSS / color-scheme washout (body looked blank; header+footer stayed). */
    var reset=
      'html{color-scheme:light!important}'+
      'html,body{margin:0!important;background:#f1f5f9!important;color:#0f172a!important;font-family:Arial,Helvetica,sans-serif}'+
      'body{padding:16px}'+
      'p,li,td,th,label{color:#0f172a!important}'+
      'table{color:#0f172a!important}'+
      'a{color:#0369a1}'+
      'b,strong{color:inherit;font-weight:800}';
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>'+esc(title||'OJT format preview')+'</title><style>'+reset+'</style></head><body style="margin:0;padding:16px;background:#f1f5f9;color:#0f172a;color-scheme:light">'+(html||'<p style="color:#64748b;padding:24px">No preview content yet.</p>')+'</body></html>';
  }
  function fmtRow(label, value){
    var v=String(value||'').trim();
    if(!v) return '';
    return '<tr><td style="padding:8px 10px;border:1px solid #d8e0ea;background:#f7fafc;font-weight:700;width:32%;vertical-align:top;color:#0f172a">'+esc(label)+'</td><td style="padding:8px 10px;border:1px solid #d8e0ea;white-space:pre-wrap;color:#0f172a">'+esc(v)+'</td></tr>';
  }
  function localMonthScheduleHtml(){
    var month=STATE.month||'';
    var parts=month.split('-');
    var monthLabel=month;
    try{
      var d=new Date(Date.UTC(Number(parts[0]), Number(parts[1])-1, 1));
      monthLabel=d.toLocaleDateString('en-IN',{month:'long',year:'numeric',timeZone:'UTC'});
    }catch(e){}
    var rows=(STATE.sessions||[]).filter(function(s){ return s && s.status!=='Cancelled'; }).slice().sort(function(a,b){
      return String(a.trainingDate||'').localeCompare(String(b.trainingDate||'')) || String(a.trainingTime||'').localeCompare(String(b.trainingTime||''));
    });
    var body=rows.length?rows.map(function(s,i){
      var topics=String(s.topics||'').split(/\\n|;/).map(function(t){return t.trim();}).filter(Boolean).join('; ');
      return '<tr>'+
        '<td style="padding:8px 10px;border:1px solid #d8e0ea;text-align:center;color:#0f172a">'+(i+1)+'</td>'+
        '<td style="padding:8px 10px;border:1px solid #d8e0ea;color:#0f172a">'+esc(s.trainingDate||'—')+'</td>'+
        '<td style="padding:8px 10px;border:1px solid #d8e0ea;color:#0f172a">'+esc(s.trainingTime||'—')+'</td>'+
        '<td style="padding:8px 10px;border:1px solid #d8e0ea;color:#0f172a">'+esc(s.clientName||'—')+'</td>'+
        '<td style="padding:8px 10px;border:1px solid #d8e0ea;color:#0f172a">'+esc(s.location||'—')+'</td>'+
        '<td style="padding:8px 10px;border:1px solid #d8e0ea;color:#0f172a">'+esc(s.trainerName||'—')+'</td>'+
        '<td style="padding:8px 10px;border:1px solid #d8e0ea;font-size:13px;color:#0f172a">'+esc(topics||'—')+'</td>'+
        '<td style="padding:8px 10px;border:1px solid #d8e0ea;color:#0f172a">'+esc(typeLabel(s.slaTag))+'</td>'+
        '<td style="padding:8px 10px;border:1px solid #d8e0ea;color:#0f172a">'+esc(statusLabel(s.status))+'</td>'+
      '</tr>';
    }).join(''):'<tr><td colspan="9" style="padding:16px;border:1px solid #d8e0ea;text-align:center;color:#64748b">No training sessions scheduled for this month yet.</td></tr>';
    return ''+
      '<div style="font-family:Segoe UI,Arial,sans-serif;max-width:960px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,.12);border:1px solid #e2e8f0">'+
      '<div style="padding:18px 20px;background:linear-gradient(135deg,#0f766e,#0369a1);color:#fff;text-align:center">'+
      brandLogoHtml()+
      '<div style="font-size:15px;font-weight:800">Agile Security Force Private Limited</div>'+
      '<div style="font-size:13px;font-weight:700;color:#fde68a;margin-top:6px">Department of Security Training &amp; Excellence</div>'+
      '<div style="font-size:14px;font-weight:700;font-style:italic;color:#99f6e4;margin-top:6px">Empowering Guards. Elevating Security.</div>'+
      '<div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.22);font-size:18px;font-weight:900">OJT monthly training schedule</div>'+
      '<div style="margin-top:6px;font-size:14px;color:#bae6fd">'+esc(monthLabel)+'</div>'+
      '</div>'+
      '<div style="padding:20px;color:#1e293b;font-size:14px;line-height:1.55">'+
      '<p style="margin:0 0 12px">Dear Sir / Madam,</p>'+
      '<p style="margin:0 0 14px">Please find the <b>On Site Tactical Training (OJT)</b> schedule for <b>'+esc(monthLabel)+'</b>.</p>'+
      '<table style="border-collapse:collapse;width:100%;font-size:14px">'+
      '<thead><tr style="background:linear-gradient(135deg,#0f766e,#0369a1);color:#fff">'+
      '<th style="padding:10px;border:1px solid #0e7490">#</th><th style="padding:10px;border:1px solid #0e7490;text-align:left">Date</th><th style="padding:10px;border:1px solid #0e7490;text-align:left">Time</th><th style="padding:10px;border:1px solid #0e7490;text-align:left">Branch / unit</th><th style="padding:10px;border:1px solid #0e7490;text-align:left">Venue</th><th style="padding:10px;border:1px solid #0e7490;text-align:left">Trainer</th><th style="padding:10px;border:1px solid #0e7490;text-align:left">Training topics</th><th style="padding:10px;border:1px solid #0e7490;text-align:left">Type</th><th style="padding:10px;border:1px solid #0e7490;text-align:left">Status</th>'+
      '</tr></thead><tbody>'+body+'</tbody></table>'+
      '<p style="margin:16px 0 0;font-size:13px;color:#334155">Client intimation is sent separately for each session (with confirmation link).</p>'+
      '<p style="margin:16px 0 0;color:#0f172a">Regards,<br/><b>Agile Security Force Private Limited</b><br/><span style="color:#334155">Department of Security Training &amp; Excellence</span></p>'+
      '</div></div>';
  }
  function localAdvanceHtml(s){
    if(!s) return '<p style="color:#b91c1c;padding:16px">Session not found.</p>';
    var when=[s.trainingDate,s.trainingTime].filter(Boolean).join(' · ');
    var trainer=[s.trainerName,s.trainerEmail].filter(Boolean).join(' · ');
    var feedback=(s.feedbackGuard==='Yes'||s.feedbackClient==='Yes')
      ? [s.feedbackGuard==='Yes'?'Guard feedback':'', s.feedbackClient==='Yes'?'Client feedback':''].filter(Boolean).join(' + ')
      : (s.feedbackPlanned||'Yes — feedback will be collected');
    var rows=fmtRow('Date & time', when)+fmtRow('Branch / unit', s.clientName)+fmtRow('Venue / location', s.location)+
      fmtRow('Trainer', trainer)+fmtRow('Training topics', s.topics)+fmtRow('Table Top Exercise', s.tableTop)+
      fmtRow('Table-top notes', s.tableTopNotes)+fmtRow('Security equipment to identify', s.equipmentIdentify)+
      fmtRow('Sample questions for guards', s.sampleQuestions)+fmtRow('Feedback (compulsory)', feedback)+
      fmtRow('Type', typeLabel(s.slaTag));
    var replyTok=String(s.clientReplyToken||'').trim();
    var replyUrl=replyTok?('https://www.agilegroup-digital.co.in/training/client-reply?t='+encodeURIComponent(replyTok)):'';
    var confirmBtn=replyUrl
      ? '<a href="'+esc(replyUrl)+'" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#059669;color:#fff;font-weight:800;text-decoration:none">Open confirmation link</a>'
      : '<span style="display:inline-block;padding:12px 18px;border-radius:10px;background:#059669;color:#fff;font-weight:800">Open confirmation link</span>';
    return ''+
      '<div style="font-family:Segoe UI,Arial,sans-serif;max-width:840px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,.12);border:1px solid #e2e8f0">'+
      '<div style="padding:18px 20px;background:linear-gradient(135deg,#0f766e,#0369a1);color:#fff;text-align:center">'+
      brandLogoHtml()+
      '<div style="font-size:15px;font-weight:800">Agile Security Force Private Limited</div>'+
      '<div style="font-size:13px;font-weight:700;color:#fde68a;margin-top:6px">Department of Security Training &amp; Excellence</div>'+
      '<div style="font-size:14px;font-weight:700;font-style:italic;color:#99f6e4;margin-top:6px">Empowering Guards. Elevating Security.</div>'+
      '<div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.22);font-size:18px;font-weight:900">'+(s.notifySentAt?'OJT intimation (updated)':'OJT training intimation')+'</div>'+
      '<div style="margin-top:6px;font-size:14px;color:#bae6fd">'+esc(s.clientName||'Site')+' · '+esc(when||'Schedule')+'</div>'+
      '</div>'+
      '<div style="padding:20px;color:#0f172a;font-size:14px;line-height:1.55;background:#fff">'+
      '<p style="margin:0 0 12px;color:#0f172a">Dear Sir / Madam,</p>'+
      '<p style="margin:0 0 12px;color:#0f172a">This is intimation of <b>On Site Tactical Training (OJT)</b> scheduled at your site. Details are below.</p>'+
      '<table style="border-collapse:collapse;width:100%;max-width:720px;font-size:14px">'+rows+'</table>'+
      '<div style="margin:18px 0;padding:16px;border-radius:12px;background:linear-gradient(135deg,#ecfdf5,#eff6ff);border:1px solid #86efac;text-align:center">'+
      '<div style="font-weight:900;color:#065f46;margin-bottom:8px">Kindly confirm the training in the link</div>'+
      confirmBtn+
      '</div>'+
      '<p style="margin:16px 0 0;color:#0f172a">On your confirmation the site will be informed digitally.</p>'+
      '<p style="margin:10px 0 0;color:#0f172a">The Training completion report will be sent for your kind information along with Post Training test marks.</p>'+
      '<p style="margin:10px 0 0;color:#0f172a">Thank you for all your support in this regard.</p>'+
      '<p style="margin:16px 0 0;color:#0f172a">Regards,<br/><b>Agile Security Force Private Limited</b><br/><span style="color:#334155">Department of Security Training &amp; Excellence</span></p>'+
      '</div></div>';
  }
  function paintFormatBody(html, title){
    LAST_FORMAT_HTML=html||'';
    LAST_FORMAT_TITLE=title||'Format preview';
    if($('formatPreviewTitle')) $('formatPreviewTitle').textContent=LAST_FORMAT_TITLE;
    var frame=$('formatPreviewFrame');
    if(!frame){ trainingToast('Format preview box missing — please refresh the page.'); return; }
    var doc=buildPreviewDoc(
      LAST_FORMAT_HTML || '<p style="color:#64748b;padding:12px">No preview content yet.</p>',
      LAST_FORMAT_TITLE
    );
    /** Same blob method as Print / open — was blank with sandboxed srcdoc on some phones. */
    try{
      if(LAST_PREVIEW_BLOB){ try{ URL.revokeObjectURL(LAST_PREVIEW_BLOB); }catch(e0){} LAST_PREVIEW_BLOB=''; }
      frame.removeAttribute('srcdoc');
      var blob=new Blob([doc],{type:'text/html;charset=utf-8'});
      LAST_PREVIEW_BLOB=URL.createObjectURL(blob);
      frame.src=LAST_PREVIEW_BLOB;
    }catch(e){
      try{
        frame.removeAttribute('src');
        frame.srcdoc=doc;
      }catch(e2){
        trainingToast('Could not paint format preview — use Print / open in new tab.');
      }
    }
    try{ $('formatPreviewWrap').scrollIntoView({behavior:'smooth',block:'nearest'}); }catch(e3){}
  }
  function openHtmlPreview(html, title, opts){
    paintFormatBody(html, title);
    if(opts&&opts.skipNewTab) return;
    try{
      var doc=buildPreviewDoc(html, title);
      var blob=new Blob([doc],{type:'text/html'});
      var url=URL.createObjectURL(blob);
      var w=window.open(url,'_blank');
      if(!w) trainingToast('Preview is on this page (new tab was blocked).');
      else setTimeout(function(){ try{ URL.revokeObjectURL(url); }catch(e){} }, 120000);
    }catch(e){ trainingToast('Preview is shown on this page.'); }
  }
  function previewAdvanceFormat(sessionId, opts){
    if(!sessionId){ trainingToast('Select a session first.'); return; }
    var local=STATE.sessions.find(function(x){ return String(x.id)===String(sessionId); });
    if(local){
      try{
        paintFormatBody(localAdvanceHtml(local), 'OJT training intimation — preview');
      }catch(err){
        trainingToast('Could not build session format. Please try again.');
      }
    } else {
      paintFormatBody(
        '<div style="font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#0f172a"><p style="margin:0;font-weight:700">Loading client intimation…</p></div>',
        'OJT training intimation — preview'
      );
    }
    api('previewAdvance',{sessionId:sessionId}).then(function(j){
      if(j&&j.replyUrl&&local){
        try{
          var u=new URL(j.replyUrl);
          var tok=u.searchParams.get('t')||'';
          if(tok){
            local.clientReplyToken=tok;
            var ix=STATE.sessions.findIndex(function(x){ return String(x.id)===String(sessionId); });
            if(ix>=0) STATE.sessions[ix].clientReplyToken=tok;
          }
        }catch(e){}
      }
      if(j&&j.html) openHtmlPreview(j.html, j.subject||'OJT training intimation — preview', opts||{skipNewTab:true});
      else if(!local) trainingToast((j&&j.error)||'Could not open session format.');
      else trainingToast('Client intimation format shown above.');
      if(j&&j.replyUrl) trainingToast('Client intimation format ready — tap Open confirmation link.');
    }).catch(function(e){
      if(!local) trainingToast(e&&e.message?e.message:'Could not open preview.');
      else trainingToast('Showing local format preview (mail server copy unavailable).');
    });
  }
  function previewMonthScheduleFormat(opts){
    var localHtml=localMonthScheduleHtml();
    paintFormatBody(localHtml, 'OJT monthly training schedule — '+(STATE.month||''));
    api('previewMonthSchedule',{}).then(function(j){
      if(j&&j.html) openHtmlPreview(j.html, j.subject||('OJT monthly training schedule — '+(STATE.month||'')), opts||{skipNewTab:true});
      trainingToast('Monthly schedule format shown above.');
    }).catch(function(){
      trainingToast('Monthly schedule format shown above.');
    });
  }
  function renderFormatPreview(opts){
    var box=$('formatSessionList');
    if(!box) return;
    var rows=(STATE.sessions||[]).filter(function(s){ return s.status!=='Cancelled'; }).slice().sort(function(a,b){
      return String(a.trainingDate||'').localeCompare(String(b.trainingDate||''));
    });
    box.innerHTML=rows.map(function(s){
      return '<div class="panel" style="margin:8px 0;padding:12px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;align-items:center"><div><b>'+esc(s.clientName||'Session')+'</b><br><span class="muted">'+esc(s.trainingDate||'')+' '+esc(s.trainingTime||'')+' · '+esc(typeLabel(s.slaTag))+'</span><br><span class="muted" style="font-size:.82rem">Topics: '+esc(s.topics||'—')+'</span></div><button type="button" class="btn primary" data-fmt-preview="'+esc(s.id)+'">Show format</button></div>';
    }).join('')||'<p class="muted">No sessions this month yet. Showing the monthly schedule format above.</p>';
    box.querySelectorAll('[data-fmt-preview]').forEach(function(b){
      b.addEventListener('click',function(ev){
        if(ev&&ev.preventDefault) ev.preventDefault();
        previewAdvanceFormat(b.getAttribute('data-fmt-preview'),{skipNewTab:true});
      });
    });
    var pendingId=String((opts&&opts.sessionId)||STATE.pendingFormatSessionId||'').trim();
    STATE.pendingFormatSessionId='';
    if(pendingId){
      previewAdvanceFormat(pendingId,{skipNewTab:true});
      return;
    }
    /** Always open a real letter — never leave the “Choose a format” stub on screen. */
    if(rows.length){
      previewAdvanceFormat(rows[0].id,{skipNewTab:true});
    } else {
      previewMonthScheduleFormat({skipNewTab:true});
    }
  }
  function showTab(name){
    showGalleryInput(false);
    STATE.tab=name;
    ALL_TABS.forEach(function(t){
      var el=$('tab-'+t); if(el) el.classList.add('hidden');
    });
    if(name==='schedule' || SCHEDULE_SUBS.indexOf(name)>=0){
      $('tab-schedule').classList.remove('hidden');
      setMenuOn('schedule');
      showScheduleSub(name==='schedule' ? (STATE.scheduleSub||'calendar') : name);
      return;
    }
    setMenuOn(name);
    var panel=$('tab-'+name); if(panel) panel.classList.remove('hidden');
    if(name==='dashboard') loadDashboard();
    if(name==='secObsList') loadDashboard();
    if(name==='fbAnalysis') loadFeedbackViews();
    if(name==='notesPpt'){ fillSubjects('exNotesSubject'); loadExtras('notesPpt','exNotesList'); initTeachingNotesUi(); }
    if(name==='qbank'){ fillSubjects('exQbSubject'); loadExtras('questionBank','exQbList'); initQuestionBankUi(); }
    if(name==='subjectGuide'){ fillSubjects('exSgSubject'); loadExtras('subjectGuide','exSgList'); }
    if(name==='postTest'||name==='fbGuard'||name==='fbClient') fillExtraClientSelects();
    if(name==='postTest') loadExtras('postTest','exTestList');
    if(name==='fbGuard') loadExtras('feedbackGuard','exFgList');
    if(name==='fbClient') loadExtras('feedbackClient','exFcList');
  }
  function fillSubjects(selId){
    var sel=$(selId); if(!sel) return;
    var cur=sel.value;
    var list=STATE.questionSubjects||[];
    sel.innerHTML=list.map(function(s){ return '<option value="'+esc(s)+'">'+esc(s)+'</option>'; }).join('')||'<option value="">—</option>';
    if(cur) sel.value=cur;
  }
  function questionBanksFlat(){
    var out=[];
    (QUESTION_BANKS||[]).forEach(function(g){
      (g.banks||[]).forEach(function(b){ out.push(b); });
    });
    return out;
  }
  function findQuestionBank(topic){
    var t=String(topic||'').trim().toLowerCase().replace(/\\s+/g,' ');
    if(!t) return null;
    return questionBanksFlat().find(function(b){ return String(b.topic||'').trim().toLowerCase().replace(/\\s+/g,' ')===t; })||null;
  }
  function renderQuestionBank(bank){
    var box=$('qbBody'); if(!box) return;
    if(!bank){
      box.innerHTML='<p style="margin:0;color:#64748b">Select a training topic to see Yes/No questions.</p>';
      return;
    }
    var qs=bank.questions||[];
    var show=QB_STATE.showAnswers!==false;
    box.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:#0f766e;text-transform:uppercase;letter-spacing:.04em">'+esc(bank.category)+'</div>'+
      '<h3 style="margin:6px 0 8px;color:#0f172a;font-size:1.25rem">'+esc(bank.topic)+'</h3>'+
      '<p style="margin:0 0 12px;color:#334155"><b>'+qs.length+' Yes/No questions</b> · Answer key for trainer '+(show?'visible':'hidden')+'</p>'+
      '<ol style="margin:0 0 0 1.2rem;padding:0;line-height:1.55;color:#0f172a">'+
        qs.map(function(q,i){
          var ans=String(q.answer||'');
          var pill=ans==='Yes'
            ? '<span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:#dcfce7;color:#166534;font-size:12px;font-weight:800">Yes</span>'
            : '<span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:#fee2e2;color:#991b1b;font-size:12px;font-weight:800">No</span>';
          return '<li style="margin:0 0 10px;padding:10px 12px;border-radius:10px;background:#fff;border:1px solid #e2e8f0">'+
            '<div style="font-weight:700;color:#0f172a">'+(i+1)+'. '+esc(q.text)+'</div>'+
            '<div style="margin-top:6px;color:#475569;font-size:.92rem">Answer: <b>Yes</b> / <b>No</b>'+(show?(' · Correct: '+pill):'')+'</div>'+
          '</li>';
        }).join('')+
      '</ol>';
  }
  function fillQuestionTopicSelect(){
    var catSel=$('qbCategory'); var topicSel=$('qbTopic');
    if(!catSel||!topicSel) return;
    var cat=catSel.value;
    var groups=QUESTION_BANKS||[];
    var banks=[];
    groups.forEach(function(g){
      if(!cat || cat==='__all__' || g.category===cat) banks=banks.concat(g.banks||[]);
    });
    var cur=topicSel.value;
    topicSel.innerHTML='<option value="">— select topic —</option>'+banks.map(function(b){
      var n=(b.questions||[]).length;
      return '<option value="'+esc(b.topic)+'">'+esc(b.topic)+' ('+n+')</option>';
    }).join('');
    if(cur && banks.some(function(b){ return b.topic===cur; })) topicSel.value=cur;
    else if(banks[0]) topicSel.value=banks[0].topic;
    renderQuestionBank(findQuestionBank(topicSel.value));
  }
  function initQuestionBankUi(){
    var catSel=$('qbCategory'); if(!catSel) return;
    var groups=QUESTION_BANKS||[];
    var cur=catSel.value;
    catSel.innerHTML='<option value="__all__">All categories</option>'+groups.map(function(g){
      var n=(g.banks||[]).reduce(function(a,b){ return a+((b.questions||[]).length); },0);
      return '<option value="'+esc(g.category)+'">'+esc(g.category)+' · '+(g.banks||[]).length+' topics · '+n+' Q</option>';
    }).join('');
    if(cur) catSel.value=cur;
    if(!catSel._qbBound){
      catSel._qbBound=true;
      catSel.onchange=function(){ fillQuestionTopicSelect(); };
      if($('qbTopic')) $('qbTopic').onchange=function(){ renderQuestionBank(findQuestionBank($('qbTopic').value)); };
      if($('btnQbShow')) $('btnQbShow').onclick=function(){
        renderQuestionBank(findQuestionBank($('qbTopic').value));
        try{$('qbBody').scrollIntoView({behavior:'smooth',block:'nearest'});}catch(e){}
      };
      if($('btnQbToggleAns')) $('btnQbToggleAns').onclick=function(){
        QB_STATE.showAnswers=!QB_STATE.showAnswers;
        renderQuestionBank(findQuestionBank($('qbTopic').value));
        trainingToast(QB_STATE.showAnswers?'Answers shown for trainer.':'Answers hidden (guard quiz view).');
      };
      if($('btnQbCopy')) $('btnQbCopy').onclick=function(){
        var bank=findQuestionBank($('qbTopic').value);
        if(!bank){ trainingToast('Select a topic first.'); return; }
        var lines=[bank.topic,'Yes/No questions ('+(bank.questions||[]).length+')',''];
        (bank.questions||[]).forEach(function(q,i){
          lines.push((i+1)+'. '+q.text);
          lines.push('   Answer: Yes / No'+(QB_STATE.showAnswers?('  (Correct: '+q.answer+')'):''));
          lines.push('');
        });
        var text=lines.join('\\n');
        if(navigator.clipboard&&navigator.clipboard.writeText){
          navigator.clipboard.writeText(text).then(function(){ trainingToast('Questions copied.'); }).catch(function(){ prompt('Copy questions:', text); });
        }else{ prompt('Copy questions:', text); }
      };
      if($('btnQbPrint')) $('btnQbPrint').onclick=function(){
        var bank=findQuestionBank($('qbTopic').value);
        if(!bank){ trainingToast('Select a topic first.'); return; }
        var html=$('qbBody')?$('qbBody').innerHTML:'';
        try{
          var doc='<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+esc(bank.topic)+' — Yes/No questions</title><style>body{font-family:Arial,sans-serif;padding:20px;color:#0f172a;line-height:1.5}h3{margin-top:0}</style></head><body><p><b>Agile Training — On Site Tactical Training (OJT)</b><br/>Question Bank — Yes/No (topic wise)</p>'+html+'</body></html>';
          var blob=new Blob([doc],{type:'text/html'});
          var url=URL.createObjectURL(blob);
          var w=window.open(url,'_blank');
          if(!w){ trainingToast('Please allow pop-ups to print.'); return; }
          setTimeout(function(){ try{ w.print(); }catch(e){} }, 400);
          setTimeout(function(){ try{ URL.revokeObjectURL(url); }catch(e){} }, 120000);
        }catch(e){ trainingToast('Could not open print view.'); }
      };
    }
    fillQuestionTopicSelect();
  }
  function teachingNotesFlat(){
    var out=[];
    (TEACHING_NOTES||[]).forEach(function(g){
      (g.notes||[]).forEach(function(n){ out.push(n); });
    });
    return out;
  }
  function findTeachingNote(topic){
    var t=String(topic||'').trim().toLowerCase().replace(/\\s+/g,' ');
    if(!t) return null;
    return teachingNotesFlat().find(function(n){ return String(n.topic||'').trim().toLowerCase().replace(/\\s+/g,' ')===t; })||null;
  }
  function ulHtml(items){
    return '<ul style="margin:6px 0 0 18px;line-height:1.55">'+(items||[]).map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('')+'</ul>';
  }
  function chunkItems(arr, size){
    var a=arr||[], out=[], i;
    for(i=0;i<a.length;i+=size) out.push(a.slice(i,i+size));
    return out.length?out:[[]];
  }
  function buildTopicPptSlides(note){
    if(!note) return [];
    var slides=[
      {kind:'title', eyebrow:note.category, title:note.topic, subtitle:'Teaching PPT · '+(PPT_BRAND.track||'On Site Tactical Training (OJT)'), accent:'#0f766e'},
      {kind:'content', eyebrow:'Objective', title:'What we want guards to take away', bullets:[note.objective], accent:'#0369a1'}
    ];
    var parts=chunkItems(note.keyPoints||[], 4);
    parts.forEach(function(part, i){
      slides.push({
        kind:'content',
        eyebrow: parts.length>1 ? ('Key points ('+(i+1)+'/'+parts.length+')') : 'Key points to teach',
        title: note.topic,
        bullets: part,
        accent: '#14224f'
      });
    });
    slides.push({
      kind:'split', eyebrow:'Classroom guidance', title:'Do  ·  Don’t',
      leftTitle:'Do', leftBullets:note.dos||[], rightTitle:"Don't", rightBullets:note.donts||[], accent:'#0f766e'
    });
    if((note.askGuards||[]).length){
      slides.push({kind:'content', eyebrow:'Check understanding', title:'Ask the guards', bullets:note.askGuards, accent:'#a16207'});
    }
    slides.push({
      kind:'end', eyebrow:note.category, title:'Thank you',
      subtitle: note.tip ? ('Trainer tip: '+note.tip) : 'Practice on post · Be polite and firm · Report early',
      bullets:[
        'Use this PPT with the teaching notes in Training Notes.',
        'Keep examples from this site.',
        'End with 2–3 questions before dismissal.'
      ],
      accent:'#14224f'
    });
    return slides;
  }
  function pptSlideChrome(inner, page, total, accent){
    var ac=accent||'#14224f';
    var logo=esc(PPT_BRAND.logoUrl||'https://www.agilegroup-digital.co.in/agile-logo-clear.png');
    return ''+
      '<div class="ojt-ppt-slide" style="width:min(960px,100%);aspect-ratio:16/9;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.45);display:flex;flex-direction:column;border:1px solid #e2e8f0">'+
        '<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;background:linear-gradient(135deg,#0e1730 0%,#14224f 55%,#0f766e 120%);border-bottom:3px solid #c9a84c">'+
          '<img src="'+logo+'" alt="Agile" style="height:48px;width:auto;background:transparent;border:0;padding:0;object-fit:contain">'+
          '<div style="min-width:0;flex:1;color:#fff">'+
            '<div style="font-size:13px;font-weight:800;line-height:1.25">'+esc(PPT_BRAND.company||'Agile Security Force Private Limited')+'</div>'+
            '<div style="font-size:11px;color:#fde68a;font-weight:700;margin-top:2px">'+esc(PPT_BRAND.dept||'Department of Security Training & Excellence')+'</div>'+
            '<div style="font-size:11px;color:#99f6e4;font-style:italic;margin-top:2px">'+esc(PPT_BRAND.tagline||'Empowering Guards. Elevating Security.')+'</div>'+
          '</div>'+
          '<div style="width:8px;align-self:stretch;border-radius:6px;background:'+ac+'"></div>'+
        '</div>'+
        '<div style="flex:1;padding:18px 22px;overflow:auto;color:#0f172a;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)">'+inner+'</div>'+
        '<div style="padding:8px 14px;background:linear-gradient(135deg,#14224f,#0f766e);color:#fde68a;border-top:2px solid #c9a84c">'+
          '<div style="font-size:10px;line-height:1.35;font-weight:600">'+esc(PPT_BRAND.footerLine||'')+'</div>'+
          '<div style="display:flex;justify-content:space-between;gap:8px;margin-top:4px;font-size:11px;color:#e0f2fe">'+
            '<span>'+esc(PPT_BRAND.sites||'www.agilegroup-digital.co.in')+'</span>'+
            '<span>Slide '+page+' / '+total+'</span>'+
          '</div>'+
        '</div>'+
      '</div>';
  }
  function pptSlideInner(slide){
    if(!slide) return '';
    if(slide.kind==='title' || slide.kind==='end'){
      return '<div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:10px;padding:8px 4px">'+
        (slide.eyebrow?'<div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#0f766e">'+esc(slide.eyebrow)+'</div>':'')+
        '<div style="font-size:clamp(1.6rem,3.2vw,2.4rem);font-weight:900;color:#14224f;line-height:1.2">'+esc(slide.title)+'</div>'+
        (slide.subtitle?'<div style="font-size:1.05rem;color:#334155;max-width:40rem;line-height:1.45">'+esc(slide.subtitle)+'</div>':'')+
        ((slide.bullets&&slide.bullets.length)?'<ul style="margin:8px 0 0 1.1rem;line-height:1.55;color:#1e293b;font-size:1rem">'+slide.bullets.map(function(b){return '<li style="margin:4px 0">'+esc(b)+'</li>';}).join('')+'</ul>':'')+
        '<div style="margin-top:14px;height:6px;width:120px;border-radius:99px;background:linear-gradient(90deg,#c9a84c,#0f766e)"></div>'+
      '</div>';
    }
    if(slide.kind==='split'){
      return '<div>'+
        (slide.eyebrow?'<div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;margin-bottom:6px">'+esc(slide.eyebrow)+'</div>':'')+
        '<div style="font-size:1.45rem;font-weight:900;color:#14224f;margin-bottom:12px">'+esc(slide.title)+'</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'+
          '<div style="padding:14px;border-radius:12px;background:#ecfdf5;border:1px solid #86efac"><div style="font-weight:900;color:#065f46;margin-bottom:6px">'+esc(slide.leftTitle||'Do')+'</div><ul style="margin:0 0 0 1.1rem;line-height:1.5">'+(slide.leftBullets||[]).map(function(b){return '<li style="margin:5px 0">'+esc(b)+'</li>';}).join('')+'</ul></div>'+
          '<div style="padding:14px;border-radius:12px;background:#fef2f2;border:1px solid #fca5a5"><div style="font-weight:900;color:#991b1b;margin-bottom:6px">'+esc(slide.rightTitle||"Don't")+'</div><ul style="margin:0 0 0 1.1rem;line-height:1.5">'+(slide.rightBullets||[]).map(function(b){return '<li style="margin:5px 0">'+esc(b)+'</li>';}).join('')+'</ul></div>'+
        '</div></div>';
    }
    return '<div>'+
      (slide.eyebrow?'<div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;margin-bottom:6px">'+esc(slide.eyebrow)+'</div>':'')+
      '<div style="font-size:1.45rem;font-weight:900;color:#14224f;margin-bottom:12px">'+esc(slide.title)+'</div>'+
      '<ul style="margin:0 0 0 1.2rem;line-height:1.55;font-size:1.05rem;color:#1e293b">'+(slide.bullets||[]).map(function(b){return '<li style="margin:8px 0;padding-left:4px">'+esc(b)+'</li>';}).join('')+'</ul>'+
    '</div>';
  }
  function paintPptSlide(){
    var stage=$('pptStage'); if(!stage) return;
    var slides=PPT_STATE.slides||[];
    if(!slides.length){ stage.innerHTML='<p class="muted">No slides.</p>'; return; }
    if(PPT_STATE.index<0) PPT_STATE.index=0;
    if(PPT_STATE.index>=slides.length) PPT_STATE.index=slides.length-1;
    var slide=slides[PPT_STATE.index];
    var page=PPT_STATE.index+1;
    stage.innerHTML=pptSlideChrome(pptSlideInner(slide), page, slides.length, slide.accent);
    if($('pptPageLabel')) $('pptPageLabel').textContent=page+' / '+slides.length;
    if($('pptModalTitle')) $('pptModalTitle').textContent=(PPT_STATE.topic||'Topic')+' — PPT';
  }
  function openTopicPpt(note){
    if(!note){ trainingToast('Select a training topic first.'); return; }
    PPT_STATE.slides=buildTopicPptSlides(note);
    PPT_STATE.index=0;
    PPT_STATE.topic=note.topic||'';
    var modal=$('pptModal');
    if(modal){
      modal.classList.remove('hidden');
      modal.style.display='flex';
    }
    paintPptSlide();
    trainingToast('PPT ready — '+PPT_STATE.slides.length+' slides with Agile header & footer.');
  }
  function closeTopicPpt(){
    var modal=$('pptModal');
    if(modal){ modal.classList.add('hidden'); modal.style.display='none'; }
  }
  function renderPptStrip(note){
    var strip=$('tnPptStrip'); if(!strip) return;
    if(!note){ strip.innerHTML=''; return; }
    var slides=buildTopicPptSlides(note);
    strip.innerHTML=
      '<div class="panel" style="padding:14px;border-color:rgba(15,118,110,.45)">'+
        '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;align-items:center;margin-bottom:10px">'+
          '<div><b style="color:#99f6e4">Visual PPT for this topic</b><br><span class="muted">'+esc(String(slides.length))+' slides · Agile logo header · standard footer on every slide</span></div>'+
          '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" id="btnTnPptInline">Open PPT</button><button type="button" class="btn" id="btnTnPptDlInline">Download PPT</button></div>'+
        '</div>'+
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px">'+
          slides.map(function(s,i){
            return '<button type="button" class="btn" data-ppt-jump="'+i+'" style="text-align:left;padding:10px;font-size:.78rem;line-height:1.3">'+
              '<span style="color:#fde68a">Slide '+(i+1)+'</span><br>'+esc(String(s.title||s.eyebrow||'Slide').slice(0,42))+
            '</button>';
          }).join('')+
        '</div>'+
      '</div>';
    if($('btnTnPptInline')) $('btnTnPptInline').onclick=function(){ openTopicPpt(note); };
    if($('btnTnPptDlInline')) $('btnTnPptDlInline').onclick=function(){ downloadTopicPpt(note); };
    strip.querySelectorAll('[data-ppt-jump]').forEach(function(b){
      b.addEventListener('click',function(){
        openTopicPpt(note);
        PPT_STATE.index=Number(b.getAttribute('data-ppt-jump')||0)||0;
        paintPptSlide();
      });
    });
  }
  function loadPptxGen(){
    if(window.PptxGenJS) return Promise.resolve(window.PptxGenJS);
    return new Promise(function(resolve, reject){
      var s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
      s.onload=function(){ resolve(window.PptxGenJS); };
      s.onerror=function(){ reject(new Error('Could not load PPT library. Use View PPT instead.')); };
      document.head.appendChild(s);
    });
  }
  function fetchLogoDataUrl(){
    var logo=PPT_BRAND.logoUrl||'https://www.agilegroup-digital.co.in/agile-logo-clear.png';
    return fetch(logo,{credentials:'omit'}).then(function(r){ return r.blob(); }).then(function(blob){
      return new Promise(function(resolve){
        var fr=new FileReader();
        fr.onload=function(){ resolve(String(fr.result||'')); };
        fr.onerror=function(){ resolve(''); };
        fr.readAsDataURL(blob);
      });
    }).catch(function(){ return ''; });
  }
  function pptBulletItems(list){
    return (list||[]).map(function(b){ return { text:String(b||''), options:{ bullet:true } }; });
  }
  function downloadTopicPpt(note){
    if(!note){ trainingToast('Select a training topic first.'); return; }
    var slides=buildTopicPptSlides(note);
    trainingToast('Preparing PowerPoint download…');
    Promise.all([loadPptxGen(), fetchLogoDataUrl()]).then(function(parts){
      var PptxGenJS=parts[0];
      var logoData=parts[1];
      var pptx=new PptxGenJS();
      pptx.author='Agile Security Force';
      pptx.title=note.topic+' — OJT Teaching PPT';
      pptx.subject=PPT_BRAND.track||'On Site Tactical Training (OJT)';
      slides.forEach(function(slide, idx){
        var s=pptx.addSlide();
        s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:10,h:0.95,fill:{color:'14224F'}});
        if(logoData){
          try{ s.addImage({data:logoData, x:0.2, y:0.12, w:0.7, h:0.7}); }catch(eImg){}
        }
        s.addText(PPT_BRAND.company||'Agile Security Force Private Limited',{x:1.05,y:0.12,w:7.5,h:0.28,fontSize:12,bold:true,color:'FFFFFF',fontFace:'Arial'});
        s.addText(PPT_BRAND.dept||'Department of Security Training & Excellence',{x:1.05,y:0.38,w:7.5,h:0.22,fontSize:10,color:'FDE68A',fontFace:'Arial'});
        s.addText(PPT_BRAND.tagline||'Empowering Guards. Elevating Security.',{x:1.05,y:0.58,w:7.5,h:0.22,fontSize:10,italic:true,color:'99F6E4',fontFace:'Arial'});
        s.addShape(pptx.ShapeType.rect,{x:0,y:0.95,w:10,h:0.06,fill:{color:'C9A84C'}});
        var y=1.2;
        if(slide.eyebrow){ s.addText(String(slide.eyebrow).toUpperCase(),{x:0.45,y:y,w:9.1,h:0.3,fontSize:11,bold:true,color:'0F766E',fontFace:'Arial'}); y+=0.32; }
        s.addText(slide.title||'',{x:0.45,y:y,w:9.1,h:0.45,fontSize:22,bold:true,color:'14224F',fontFace:'Arial'}); y+=0.5;
        if(slide.subtitle){ s.addText(slide.subtitle,{x:0.45,y:y,w:9.1,h:0.5,fontSize:13,color:'334155',fontFace:'Arial'}); y+=0.55; }
        if(slide.kind==='split'){
          s.addShape(pptx.ShapeType.roundRect,{x:0.4,y:y,w:4.4,h:3.2,fill:{color:'ECFDF5'},line:{color:'86EFAC'}});
          s.addShape(pptx.ShapeType.roundRect,{x:5.2,y:y,w:4.4,h:3.2,fill:{color:'FEF2F2'},line:{color:'FCA5A5'}});
          s.addText(slide.leftTitle||'Do',{x:0.55,y:y+0.15,w:4.1,h:0.3,fontSize:14,bold:true,color:'065F46',fontFace:'Arial'});
          s.addText(pptBulletItems(slide.leftBullets),{x:0.55,y:y+0.5,w:4.1,h:2.5,fontSize:12,color:'0F172A',fontFace:'Arial',valign:'top'});
          s.addText(slide.rightTitle||"Don't",{x:5.35,y:y+0.15,w:4.1,h:0.3,fontSize:14,bold:true,color:'991B1B',fontFace:'Arial'});
          s.addText(pptBulletItems(slide.rightBullets),{x:5.35,y:y+0.5,w:4.1,h:2.5,fontSize:12,color:'0F172A',fontFace:'Arial',valign:'top'});
        }else if(slide.bullets&&slide.bullets.length){
          s.addText(pptBulletItems(slide.bullets),{x:0.55,y:y,w:8.9,h:3.6,fontSize:14,color:'0F172A',fontFace:'Arial',valign:'top'});
        }
        s.addShape(pptx.ShapeType.rect,{x:0,y:5.05,w:10,h:0.58,fill:{color:'0F766E'}});
        s.addText(PPT_BRAND.footerLine||'',{x:0.3,y:5.08,w:7.8,h:0.3,fontSize:7,color:'FDE68A',fontFace:'Arial'});
        s.addText((PPT_BRAND.sites||'')+'   ·   Slide '+(idx+1)+' / '+slides.length,{x:0.3,y:5.32,w:9.4,h:0.22,fontSize:9,color:'E0F2FE',fontFace:'Arial'});
      });
      var safe=(note.topic||'OJT-topic').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);
      return pptx.writeFile({fileName:'Agile-OJT-'+safe+'.pptx'});
    }).then(function(){
      trainingToast('PPT downloaded for: '+note.topic);
    }).catch(function(e){
      trainingToast(e&&e.message?e.message:'Download failed. Please use View PPT.');
      openTopicPpt(note);
    });
  }
  function renderTeachingNote(note){
    var box=$('tnBody'); if(!box) return;
    if(!note){
      box.innerHTML='<p style="margin:0;color:#64748b">Select a training topic to see teaching notes and PPT.</p>';
      renderPptStrip(null);
      return;
    }
    box.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:#0f766e;text-transform:uppercase;letter-spacing:.04em">'+esc(note.category)+'</div>'+
      '<h3 style="margin:6px 0 10px;color:#0f172a;font-size:1.25rem">'+esc(note.topic)+'</h3>'+
      '<p style="margin:0 0 12px;color:#334155"><b>Objective:</b> '+esc(note.objective)+'</p>'+
      '<div style="margin:0 0 12px"><b style="color:#0f172a">Key points to teach</b>'+ulHtml(note.keyPoints)+'</div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:0 0 12px">'+
        '<div style="padding:10px;border-radius:10px;background:#ecfdf5;border:1px solid #86efac"><b style="color:#065f46">Do</b>'+ulHtml(note.dos)+'</div>'+
        '<div style="padding:10px;border-radius:10px;background:#fef2f2;border:1px solid #fca5a5"><b style="color:#991b1b">Don\\'t</b>'+ulHtml(note.donts)+'</div>'+
      '</div>'+
      '<div style="margin:0 0 10px"><b style="color:#0f172a">Ask guards (check understanding)</b>'+ulHtml(note.askGuards)+'</div>'+
      (note.tip?'<p style="margin:0;padding:10px;border-radius:10px;background:#fff7ed;border:1px solid #fdba74;color:#9a3412"><b>Trainer tip:</b> '+esc(note.tip)+'</p>':'');
    renderPptStrip(note);
  }
  function fillTeachingTopicSelect(){
    var catSel=$('tnCategory'); var topicSel=$('tnTopic');
    if(!catSel||!topicSel) return;
    var cat=catSel.value;
    var groups=TEACHING_NOTES||[];
    var notes=[];
    groups.forEach(function(g){
      if(!cat || cat==='__all__' || g.category===cat) notes=notes.concat(g.notes||[]);
    });
    var cur=topicSel.value;
    topicSel.innerHTML='<option value="">— select topic —</option>'+notes.map(function(n){
      return '<option value="'+esc(n.topic)+'">'+esc(n.topic)+'</option>';
    }).join('');
    if(cur && notes.some(function(n){ return n.topic===cur; })) topicSel.value=cur;
    else if(notes[0]) topicSel.value=notes[0].topic;
    renderTeachingNote(findTeachingNote(topicSel.value));
  }
  function initTeachingNotesUi(){
    var catSel=$('tnCategory'); if(!catSel) return;
    var groups=TEACHING_NOTES||[];
    var cur=catSel.value;
    catSel.innerHTML='<option value="__all__">All categories</option>'+groups.map(function(g){
      return '<option value="'+esc(g.category)+'">'+esc(g.category)+' ('+(g.notes||[]).length+')</option>';
    }).join('');
    if(cur) catSel.value=cur;
    if(!catSel._tnBound){
      catSel._tnBound=true;
      catSel.onchange=function(){ fillTeachingTopicSelect(); };
      if($('tnTopic')) $('tnTopic').onchange=function(){ renderTeachingNote(findTeachingNote($('tnTopic').value)); };
      if($('btnTnShow')) $('btnTnShow').onclick=function(){ renderTeachingNote(findTeachingNote($('tnTopic').value)); try{$('tnBody').scrollIntoView({behavior:'smooth',block:'nearest'});}catch(e){} };
      if($('btnTnPpt')) $('btnTnPpt').onclick=function(){ openTopicPpt(findTeachingNote($('tnTopic').value)); };
      if($('btnTnPptDl')) $('btnTnPptDl').onclick=function(){ downloadTopicPpt(findTeachingNote($('tnTopic').value)); };
      if($('btnPptPrev')) $('btnPptPrev').onclick=function(){ PPT_STATE.index=Math.max(0, PPT_STATE.index-1); paintPptSlide(); };
      if($('btnPptNext')) $('btnPptNext').onclick=function(){ PPT_STATE.index=Math.min((PPT_STATE.slides||[]).length-1, PPT_STATE.index+1); paintPptSlide(); };
      if($('btnPptClose')) $('btnPptClose').onclick=function(){ closeTopicPpt(); };
      if($('btnPptPrintSlides')) $('btnPptPrintSlides').onclick=function(){
        if(!(PPT_STATE.slides||[]).length){ trainingToast('Open a PPT first.'); return; }
        var html=(PPT_STATE.slides||[]).map(function(slide,i){
          return '<div style="page-break-after:always;margin:0 0 18px">'+pptSlideChrome(pptSlideInner(slide), i+1, PPT_STATE.slides.length, slide.accent)+'</div>';
        }).join('');
        try{
          var doc='<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+esc(PPT_STATE.topic)+' — PPT</title><style>@page{size:landscape;margin:10mm}body{margin:0;background:#e2e8f0;font-family:Arial,sans-serif}.ojt-ppt-slide{width:100%!important;aspect-ratio:auto!important;min-height:180mm}</style></head><body style="padding:12px">'+html+'</body></html>';
          var blob=new Blob([doc],{type:'text/html'});
          var url=URL.createObjectURL(blob);
          var w=window.open(url,'_blank');
          if(!w){ trainingToast('Please allow pop-ups to print slides.'); return; }
          setTimeout(function(){ try{ w.print(); }catch(e){} }, 500);
          setTimeout(function(){ try{ URL.revokeObjectURL(url); }catch(e){} }, 120000);
        }catch(e){ trainingToast('Could not print slides.'); }
      };
      document.addEventListener('keydown',function(ev){
        var modal=$('pptModal');
        if(!modal||modal.classList.contains('hidden')) return;
        if(ev.key==='Escape') closeTopicPpt();
        if(ev.key==='ArrowLeft'){ PPT_STATE.index=Math.max(0, PPT_STATE.index-1); paintPptSlide(); }
        if(ev.key==='ArrowRight'){ PPT_STATE.index=Math.min((PPT_STATE.slides||[]).length-1, PPT_STATE.index+1); paintPptSlide(); }
      });
      if($('btnTnCopy')) $('btnTnCopy').onclick=function(){
        var note=findTeachingNote($('tnTopic').value);
        if(!note){ trainingToast('Select a topic first.'); return; }
        var text=[note.topic,'', 'Objective: '+note.objective,'', 'Key points:'].concat((note.keyPoints||[]).map(function(x,i){return (i+1)+'. '+x;}))
          .concat(['','Do:']).concat((note.dos||[]).map(function(x){return '• '+x;}))
          .concat(["","Don't:"]).concat((note.donts||[]).map(function(x){return '• '+x;}))
          .concat(['','Ask guards:']).concat((note.askGuards||[]).map(function(x){return '• '+x;}))
          .concat(note.tip?['','Tip: '+note.tip]:[]).join('\\n');
        if(navigator.clipboard&&navigator.clipboard.writeText){
          navigator.clipboard.writeText(text).then(function(){ trainingToast('Teaching notes copied.'); }).catch(function(){ prompt('Copy notes:', text); });
        }else{ prompt('Copy notes:', text); }
      };
      if($('btnTnPrint')) $('btnTnPrint').onclick=function(){
        var note=findTeachingNote($('tnTopic').value);
        if(!note){ trainingToast('Select a topic first.'); return; }
        var html=$('tnBody')?$('tnBody').innerHTML:'';
        try{
          var doc='<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+esc(note.topic)+' — Teaching notes</title><style>body{font-family:Arial,sans-serif;padding:20px;color:#0f172a;line-height:1.5}h3{margin-top:0}</style></head><body><p><b>Agile Training — On Site Tactical Training (OJT)</b><br/>Teaching notes (topic wise)</p>'+html+'</body></html>';
          var blob=new Blob([doc],{type:'text/html'});
          var url=URL.createObjectURL(blob);
          var w=window.open(url,'_blank');
          if(!w){ trainingToast('Please allow pop-ups to print.'); return; }
          setTimeout(function(){ try{ w.print(); }catch(e){} }, 400);
          setTimeout(function(){ try{ URL.revokeObjectURL(url); }catch(e){} }, 120000);
        }catch(e){ trainingToast('Could not open print view.'); }
      };
    }
    fillTeachingTopicSelect();
  }
  function activeOjtTopics(){
    return (STATE.ojtTopics||[]).filter(function(t){ return t && t.active!==false && t.title; });
  }
  function topicOptionsHtml(selectedTitle){
    var cur=String(selectedTitle||'').trim();
    var groups={};
    activeOjtTopics().forEach(function(t){
      var cat=t.category||'Other';
      if(!groups[cat]) groups[cat]=[];
      groups[cat].push(t);
    });
    var html='<option value="">— select topic —</option>';
    Object.keys(groups).forEach(function(cat){
      html+='<optgroup label="'+esc(cat)+'">';
      groups[cat].forEach(function(t){
        var sel=t.title===cur?' selected':'';
        html+='<option value="'+esc(t.title)+'"'+sel+'>'+esc(t.title)+'</option>';
      });
      html+='</optgroup>';
    });
    var inList=activeOjtTopics().some(function(t){ return t.title===cur; });
    if(cur && !inList){
      html+='<option value="'+esc(cur)+'" selected>'+esc(cur)+' (saved)</option>';
    }
    html+='<option value="__custom__">Other — type for this client…</option>';
    return html;
  }
  function syncTopicSlot(n, preferredTitle){
    var pick=$('sTopicPick'+n);
    var custom=$('sTopicCustom'+n);
    var hidden=$('sTopic'+n);
    if(!pick||!custom||!hidden) return;
    var title=preferredTitle!=null?String(preferredTitle||'').trim():String(hidden.value||'').trim();
    pick.innerHTML=topicOptionsHtml(title);
    var inList=activeOjtTopics().some(function(t){ return t.title===title; });
    if(title && !inList){
      pick.value='__custom__';
      custom.classList.remove('hidden');
      custom.value=title;
      hidden.value=title;
    } else {
      pick.value=title||'';
      custom.classList.add('hidden');
      custom.value='';
      hidden.value=title||'';
    }
  }
  function topicKey(s){
    return String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
  }
  function findDuplicateTopicSlot(ignoreSlot){
    var seen={};
    for(var n=1;n<=5;n++){
      if(ignoreSlot && n===ignoreSlot) continue;
      var v=readTopicSlot(n);
      var k=topicKey(v);
      if(!k) continue;
      if(seen[k]) return {slot:n, title:v, other:seen[k]};
      seen[k]=n;
    }
    return null;
  }
  function clearTopicSlot(n){
    var pick=$('sTopicPick'+n);
    var custom=$('sTopicCustom'+n);
    var hidden=$('sTopic'+n);
    if(pick) pick.value='';
    if(custom){ custom.value=''; custom.classList.add('hidden'); }
    if(hidden) hidden.value='';
  }
  function bindTopicPick(n){
    var pick=$('sTopicPick'+n);
    var custom=$('sTopicCustom'+n);
    var hidden=$('sTopic'+n);
    if(!pick||pick._ojtBound) return;
    pick._ojtBound=true;
    pick.addEventListener('change',function(){
      if(pick.value==='__custom__'){
        custom.classList.remove('hidden');
        custom.focus();
        hidden.value=custom.value.trim();
      } else {
        custom.classList.add('hidden');
        custom.value='';
        hidden.value=pick.value||'';
      }
      var dup=findDuplicateTopicSlot();
      if(dup && topicKey(readTopicSlot(n))===topicKey(dup.title)){
        trainingToast('This topic is already selected in Topic-'+dup.other+'. Please choose a different one.');
        clearTopicSlot(n);
      }
    });
    custom.addEventListener('input',function(){
      if(pick.value==='__custom__') hidden.value=custom.value.trim();
    });
    custom.addEventListener('change',function(){
      if(pick.value!=='__custom__') return;
      hidden.value=custom.value.trim();
      var dup=findDuplicateTopicSlot();
      if(dup && topicKey(readTopicSlot(n))===topicKey(dup.title)){
        trainingToast('This topic is already selected in Topic-'+dup.other+'. Please choose a different one.');
        clearTopicSlot(n);
      }
    });
  }
  function fillAllTopicPicks(values){
    var v=values||{};
    for(var n=1;n<=5;n++){
      bindTopicPick(n);
      syncTopicSlot(n, v['topic'+n]||'');
    }
  }
  function readTopicSlot(n){
    var pick=$('sTopicPick'+n);
    var custom=$('sTopicCustom'+n);
    if(!pick) return '';
    if(pick.value==='__custom__') return (custom&&custom.value||'').trim();
    return (pick.value||'').trim();
  }
  function renderTopicManage(){
    var body=$('tmTopicBody'); if(!body) return;
    var list=(STATE.ojtTopics||[]).slice().sort(function(a,b){
      if((a.sort||0)!==(b.sort||0)) return (a.sort||0)-(b.sort||0);
      return String(a.title||'').localeCompare(String(b.title||''),'en',{sensitivity:'base'});
    });
    body.innerHTML=list.map(function(t,i){
      var inactive=t.active===false;
      return '<tr style="'+(inactive?'opacity:.55':'')+'">'+
        '<td>'+esc(String(t.sort||i+1))+'</td>'+
        '<td>'+esc(t.category||'')+(t.clientSuggested?' <span class="pill warn">Client</span>':'')+'</td>'+
        '<td>'+esc(t.title||'')+(inactive?' <span class="pill">Inactive</span>':'')+'</td>'+
        '<td style="white-space:nowrap">'+
          '<button type="button" class="btn" data-tm-edit="'+esc(t.id)+'">Edit</button> '+
          (inactive
            ? '<button type="button" class="btn" data-tm-on="'+esc(t.id)+'">Activate</button>'
            : '<button type="button" class="btn" data-tm-off="'+esc(t.id)+'">Hide</button>')+
        '</td></tr>';
    }).join('')||'<tr><td colspan="4" class="muted">No topics yet.</td></tr>';
  }
  function clearTopicForm(){
    if($('tmEditId')) $('tmEditId').value='';
    if($('tmTitle')) $('tmTitle').value='';
    if($('tmCategory')) $('tmCategory').value='Client suggested';
  }
  function refreshTopicsFromServer(j){
    if(j&&j.ojtTopics) STATE.ojtTopics=j.ojtTopics;
    fillAllTopicPicks({
      topic1:readTopicSlot(1),
      topic2:readTopicSlot(2),
      topic3:readTopicSlot(3),
      topic4:readTopicSlot(4),
      topic5:readTopicSlot(5)
    });
    renderTopicManage();
  }
  function effectiveBranchId(){
    if(STATE.workBranchId && STATE.workBranchId!=='all') return STATE.workBranchId;
    var first=(STATE.trainingDeptBranches||[]).find(function(x){return x.id&&x.id!=='all';});
    if(first) return first.id;
    return STATE.branchId;
  }
  function isTrainingDeptScope(){
    if(STATE.clientScope==='training-dept') return true;
    if(STATE.trainingDeptManager) return true;
    if(STATE.role==='management'){
      var b=(STATE.branches||[]).find(function(x){return x.id===STATE.branchId;});
      return !!(b&&b.isTrainingDepartment);
    }
    return false;
  }
  function clientsForPicker(){
    var list=(STATE.clients||[]).slice();
    if(STATE.clientScope==='branch-hod' && STATE.branchId){
      list=list.filter(function(c){ return String(c.branchId||'')===String(STATE.branchId); });
    }
    if(isTrainingDeptScope()){
      var allowed={};
      (STATE.trainingDeptBranches||[]).forEach(function(b){ if(b.id&&b.id!=='all') allowed[b.id]=true; });
      list=list.filter(function(c){ return allowed[String(c.branchId||'')]===true; });
      if(STATE.workBranchId && STATE.workBranchId!=='all'){
        list=list.filter(function(c){ return String(c.branchId||'')===String(STATE.workBranchId); });
      }
    }
    return list;
  }
  function syncWorkBranchUI(){
    var wrap=$('workBranchWrap');
    var show=isTrainingDeptScope() && (STATE.trainingDeptBranches||[]).length>0;
    if(wrap) wrap.classList.toggle('hidden', !show);
    if(show && $('workBranchPick')){
      var cur=STATE.workBranchId||'all';
      var opts=(STATE.trainingDeptBranches||[]).slice();
      if(!opts.some(function(x){return x.id==='all';})){
        opts=[{id:'all',name:'All three — Hyderabad-A · Hyderabad-B · Hi-Tech City'}].concat(opts);
      }
      $('workBranchPick').innerHTML=opts.map(function(x){
        return '<option value="'+x.id+'"'+(x.id===cur?' selected':'')+'>'+esc(x.name)+'</option>';
      }).join('');
      STATE.workBranchId=$('workBranchPick').value||cur;
    }
  }
  function syncTrainerFields(){
    var other=$('sTrainerOther').checked;
    $('trainerFields').style.opacity=other?'1':'0.85';
    if(!other){
      if(!$('sTrainer').value) $('sTrainer').value=STATE.staffName||'';
      if(!$('sTrainerEmail').value) $('sTrainerEmail').value=STATE.staffEmail||'';
    }
  }
  function openEditor(s, presetDate){
    $('cancelPanel').classList.add('hidden');
    $('editor').classList.remove('hidden');
    $('editorTitle').textContent=s&&s.id?'Edit schedule':'Add schedule';
    $('sId').value=s&&s.id||'';
    fillClientSelect(s&&s.clientId||'');
    $('sDate').value=(s&&s.trainingDate)||presetDate||'';
    $('sTime').value=s&&s.trainingTime||'10:00';
    var trainerName=s&&s.trainerName||STATE.staffName||'';
    var trainerEmail=s&&s.trainerEmail||STATE.staffEmail||'';
    var other=Boolean(s&&s.trainerEmail&&STATE.staffEmail&&String(s.trainerEmail).toLowerCase()!==String(STATE.staffEmail).toLowerCase());
    if(s&&s.trainerName&&STATE.staffName&&String(s.trainerName).toLowerCase()!==String(STATE.staffName).toLowerCase()) other=true;
    $('sTrainerOther').checked=other;
    $('sTrainer').value=trainerName;
    $('sTrainerEmail').value=trainerEmail;
    syncTrainerFields();
    var st=s&&s.status||'Scheduled';
    if(st==='Draft') st='Scheduled';
    if(st!=='Scheduled'&&st!=='ClientNotified'){
      if(!$('sStatus').querySelector('option[value="'+st+'"]')){
        var o=document.createElement('option'); o.value=st; o.textContent=statusLabel(st); $('sStatus').appendChild(o);
      }
    }
    $('sStatus').value=st;
    var tag=s&&s.slaTag||'RegularSchedule';
    if(tag==='Routine') tag='RegularSchedule';
    $('sSla').value=tag;
    $('sLoc').value=s&&s.location||'';
    $('sClientEmail').value=s&&s.clientEmail||'';
    if($('sClientEmail2')) $('sClientEmail2').value=s&&s.clientEmail2||'';
    if($('sClientEmail3')) $('sClientEmail3').value=s&&s.clientEmail3||'';
    $('sBhEmail').value=(s&&s.branchHeadEmail)||STATE.suggestBh||'';
    var t1=s&&s.topic1||'';
    var t2=s&&s.topic2||'';
    var t3=s&&s.topic3||'';
    var t4=s&&s.topic4||'';
    var t5=s&&s.topic5||'';
    if(s&&!t1&&s.topics) t1=s.topics;
    fillAllTopicPicks({topic1:t1,topic2:t2,topic3:t3,topic4:t4,topic5:t5});
    $('sTt').value=s&&s.tableTop||'';
    $('sTtNotes').value=s&&s.tableTopNotes||'';
    $('sEquip').value=s&&s.equipmentIdentify||'';
    $('sQuestions').value=s&&s.sampleQuestions||'';
    fillVehicleAsk(s);
    $('editor').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function fillVehicleAsk(s){
    var asked=!!(s&&(s.vehicleRequired||s.controlCaseNo));
    var confirmed=!!(s&&(s.vehicleDriverName||s.vehicleAcceptedAt));
    if($('sVehicleReq')){
      $('sVehicleReq').checked=asked;
      $('sVehicleReq').disabled=!!(s&&s.controlCaseNo);
    }
    if($('sVehicleCaseNo')) $('sVehicleCaseNo').value=s&&s.controlCaseNo||'';
    var st=$('sVehicleStatus');
    if(!st)return;
    if(confirmed){
      st.textContent='Control confirmed: '+(s.vehicleDriverName||'—')+(s.vehicleRegNo?' · '+s.vehicleRegNo:'');
      st.style.color='#86efac';
    }else if(asked){
      st.textContent='Asked — Control has been mailed. Waiting for confirmation'+(s.controlCaseNo?' ('+s.controlCaseNo+')':'')+'.';
      st.style.color='#fde68a';
    }else{
      st.textContent='';
      st.style.color='';
    }
  }
  function clientOptionLabel(c){
    var parts=[c.name||'Client'];
    if(c.branchName) parts.push(c.branchName);
    if(c.location) parts.push(c.location);
    return parts.join(' — ');
  }
  function fillClientSelect(selected){
    var sel=$('sClient');
    var list=clientsForPicker();
    var ph=isTrainingDeptScope()
      ? 'Select client (Hyderabad-A · Hyderabad-B · Hi-Tech City)…'
      : 'Select client from your branch…';
    sel.innerHTML='<option value="">'+ph+'</option>'+list.map(function(c){
      return '<option value="'+c.id+'" data-name="'+esc(c.name)+'" data-loc="'+esc(c.location||'')+'" data-branch="'+esc(c.branchId||'')+'"'+(c.id===selected?' selected':'')+'>'+esc(clientOptionLabel(c))+'</option>';
    }).join('');
  }
  /** Client name dropdown for feedback formats + Post Training Test. */
  function fillExtraClientSelects(){
    var list=clientsForPicker().slice().sort(function(a,b){
      return String(a.name||'').localeCompare(String(b.name||''),'en',{sensitivity:'base'});
    });
    var opts='<option value="">— select client —</option>'+list.map(function(c){
      return '<option value="'+esc(c.name)+'" data-id="'+esc(c.id)+'">'+esc(clientOptionLabel(c))+'</option>';
    }).join('');
    ;['exFgClient','exFcClient','exTestClient'].forEach(function(id){
      var sel=$(id); if(!sel||sel.tagName!=='SELECT') return;
      var cur=sel.value;
      sel.innerHTML=opts;
      if(cur){
        var hit=Array.prototype.some.call(sel.options,function(o){return o.value===cur;});
        if(hit) sel.value=cur;
        else {
          var o=document.createElement('option');
          o.value=cur; o.textContent=cur; o.selected=true;
          sel.appendChild(o);
        }
      }
    });
  }
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(ch){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]);});}
  function brandLogoHtml(){
    return '<img src="https://www.agilegroup-digital.co.in/agile-logo-clear.png" alt="Agile Security Force" height="72" style="display:block;margin:0 auto 12px;height:72px;width:auto;max-width:160px;object-fit:contain;background:transparent;border:0;padding:0">';
  }
  function clientEmailsLine(s){
    var list=[s&&s.clientEmail,s&&s.clientEmail2,s&&s.clientEmail3].map(function(e){return String(e||'').trim();}).filter(Boolean);
    return list.length?list.join(' · '):'no client email';
  }
  function completionMissingColumns(){
    var missing=[];
    if(!String($('rDate')&&$('rDate').value||'').trim()) missing.push('Date');
    if(!String($('rSan')&&$('rSan').value||'').trim()) missing.push('Sanctioned strength');
    if(!String($('rAttCount')&&$('rAttCount').value||'').trim()) missing.push('Attended count');
    if(!String($('rTopics')&&$('rTopics').value||'').trim()) missing.push('Topics covered');
    if(!String($('rAttNames')&&$('rAttNames').value||'').trim()) missing.push('Attended list');
    if(!String($('rOpsStaff')&&$('rOpsStaff').value||'').trim()) missing.push('OM reported');
    if(!String($('rFeedback')&&$('rFeedback').value||'').trim()) missing.push('Feedback');
    if(!(STATE.completionPhotos||[]).length) missing.push('Training photos');
    var file=$('rMarksFile')&&$('rMarksFile').files&&$('rMarksFile').files[0];
    var hasMarks=Boolean(file||(STATE.marksFile&&STATE.marksFile.name)||(STATE.report&&STATE.report.marksFileName));
    if(!hasMarks) missing.push('Marks statement');
    return missing;
  }
  function askFillAllColumns(missing){
    trainingToast('Please ask the trainer to fill all columns before review: '+(missing||[]).join(', ')+'.');
  }
  function readSessionForm(){
    var opt=$('sClient').selectedOptions[0];
    var other=$('sTrainerOther').checked;
    var trainerName=$('sTrainer').value.trim();
    var trainerEmail=$('sTrainerEmail').value.trim();
    if(!other){
      trainerName=trainerName||STATE.staffName||'';
      trainerEmail=trainerEmail||STATE.staffEmail||'';
    }
    /** Client’s own branch (Hyd-A / B / Hi-Tech) — not Training Department id. */
    var clientBranch=opt?String(opt.getAttribute('data-branch')||'').trim():'';
    var br=clientBranch||effectiveBranchId();
    if(br==='all'){
      var hit=(STATE.clients||[]).find(function(c){return c.id===$('sClient').value;});
      br=(hit&&hit.branchId)||(STATE.trainingDeptBranches||[]).filter(function(x){return x.id!=='all';})[0]?.id||br;
    }
    return {
      id:$('sId').value||undefined,
      branchId:br,
      clientId:$('sClient').value,
      clientName:opt?opt.getAttribute('data-name')||opt.textContent:'',
      location:$('sLoc').value||(opt?opt.getAttribute('data-loc'):''),
      trainingDate:$('sDate').value,
      trainingTime:$('sTime').value,
      trainerName:trainerName,
      trainerEmail:trainerEmail,
      status:$('sStatus').value||'Scheduled',
      slaTag:$('sSla').value,
      clientEmail:$('sClientEmail').value,
      clientEmail2:$('sClientEmail2')?$('sClientEmail2').value:'',
      clientEmail3:$('sClientEmail3')?$('sClientEmail3').value:'',
      branchHeadEmail:$('sBhEmail').value,
      topic1:readTopicSlot(1),
      topic2:readTopicSlot(2),
      topic3:readTopicSlot(3),
      topic4:readTopicSlot(4),
      topic5:readTopicSlot(5),
      tableTop:$('sTt').value,
      tableTopNotes:$('sTtNotes').value,
      feedbackGuard:'Yes',
      feedbackClient:'Yes',
      feedbackPlanned:'Yes',
      equipmentIdentify:$('sEquip').value,
      sampleQuestions:$('sQuestions').value,
      vehicleRequired:!!($('sVehicleReq')&&$('sVehicleReq').checked)||!!($('sVehicleCaseNo')&&$('sVehicleCaseNo').value),
      controlCaseNo:$('sVehicleCaseNo')?$('sVehicleCaseNo').value:''
    };
  }
  function openNewForDate(ymd){
    if(!ymd) return;
    if($('scheduleDatePick')) $('scheduleDatePick').value=ymd;
    openEditor(null, ymd);
  }
  function renderCal(){
    var parts=STATE.month.split('-');
    var y=+parts[0], m=+parts[1]-1;
    var first=new Date(y,m,1);
    var start=first.getDay();
    var daysIn=new Date(y,m+1,0).getDate();
    var byDate={};
    STATE.sessions.forEach(function(s){
      var d=s.trainingDate; if(!byDate[d]) byDate[d]=[]; byDate[d].push(s);
    });
    var html=DAYS.map(function(d){return '<div class="hd">'+d+'</div>';}).join('');
    for(var i=0;i<start;i++) html+='<div class="day mute"></div>';
    for(var day=1;day<=daysIn;day++){
      var ymd=STATE.month+'-'+(day<10?'0':'')+day;
      var items=(byDate[ymd]||[]).map(function(s){
        return '<div class="pill" data-id="'+s.id+'" style="cursor:pointer">'+esc(s.clientName||'Session')+'</div>';
      }).join('');
      html+='<div class="day" data-day="'+ymd+'" style="cursor:pointer"><div class="n">'+day+'</div>'+items+'</div>';
    }
    $('calGrid').innerHTML=html;
    $('calGrid').querySelectorAll('[data-id]').forEach(function(el){
      el.addEventListener('click',function(ev){
        ev.stopPropagation();
        var s=STATE.sessions.find(function(x){return x.id===el.getAttribute('data-id');});
        if(s) openEditor(s);
      });
    });
    $('calGrid').querySelectorAll('[data-day]').forEach(function(el){
      el.addEventListener('click',function(){
        openNewForDate(el.getAttribute('data-day'));
      });
    });
  }
  function filteredSessions(){
    var q=($('filterClient').value||'').toLowerCase();
    var st=$('filterStatus').value;
    var sla=$('filterSla').value;
    return STATE.sessions.filter(function(s){
      if(q && String(s.clientName||'').toLowerCase().indexOf(q)<0) return false;
      if(st && s.status!==st) return false;
      if(sla){
        var tag=s.slaTag==='Routine'?'RegularSchedule':s.slaTag;
        if(tag!==sla) return false;
      }
      return true;
    }).slice().sort(function(a,b){return String(a.trainingDate).localeCompare(String(b.trainingDate));});
  }
  function openCancel(s){
    if(!s||!s.id) return;
    $('editor').classList.add('hidden');
    $('cancelPanel').classList.remove('hidden');
    $('cancelSessionId').value=s.id;
    $('cancelReason').value='';
    $('cancelMeta').textContent=(s.clientName||'')+' · '+(s.trainingDate||'')+' '+(s.trainingTime||'')+' · '+clientEmailsLine(s);
    $('cancelPanel').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function canPurgeTests(){
    if(STATE.role==='management') return true;
    var em=String(STATE.staffEmail||'').trim().toLowerCase();
    return em==='director@agilegroup.co.in'||em==='sai@agilegroup.co.in';
  }
  function purgeTestBoth(sid, bid, trainingDate, btn){
    if(!sid){ trainingToast('Missing session.'); return; }
    if(!confirm('Delete BOTH now?\\n\\n1) Training schedule\\n2) Observation / completion report\\n\\nNo email will go to the client.')) return;
    if(btn) btn.disabled=true;
    var monthHint=String(trainingDate||STATE.month||'').slice(0,7)||STATE.month;
    api('purgeTestSession',{
      sessionId:sid,
      branchId:bid||effectiveBranchId(),
      workBranchId:bid||effectiveBranchId(),
      trainingDate:trainingDate||'',
      month:monthHint
    }).then(function(j){
      trainingToast(j.message||'Deleted both.');
      if(STATE.tab==='secObsList') return loadDashboard();
      return loadMonth();
    }).catch(function(e){
      if(btn) btn.disabled=false;
      trainingToast(e.message||'Delete failed — refresh and try Delete both again.');
    });
  }
  function renderList(){
    var canDelete=canPurgeTests();
    $('listBody').innerHTML=filteredSessions().map(function(s){
      var canCancel=s.status!=='Cancelled'&&s.status!=='Completed';
      var acts='<button type="button" class="btn" data-edit="'+s.id+'">Open</button> <button type="button" class="btn" data-list-preview="'+s.id+'">Preview format</button> ';
      if(canCancel) acts+='<button type="button" class="btn danger" data-cancel="'+s.id+'">Cancel &amp; Share</button> ';
      if(canDelete) acts+='<button type="button" class="btn danger" data-del-both="'+s.id+'" data-bid="'+esc(s.branchId||'')+'" data-date="'+esc(s.trainingDate||'')+'">Delete both</button>';
      return '<tr><td>'+esc(s.trainingDate)+' '+esc(s.trainingTime||'')+'</td><td>'+esc(s.clientName)+'</td><td>'+esc(s.trainerName)+(s.trainerEmail?'<br><span class="muted">'+esc(s.trainerEmail)+'</span>':'')+'</td><td>'+esc(typeLabel(s.slaTag))+'</td><td>'+statusPill(s.status)+'</td><td style="white-space:nowrap">'+acts+'</td></tr>';
    }).join('')||'<tr><td colspan="6" class="muted">No sessions this month.</td></tr>';
    $('listBody').querySelectorAll('[data-edit]').forEach(function(b){
      b.addEventListener('click',function(){
        var s=STATE.sessions.find(function(x){return x.id===b.getAttribute('data-edit');});
        if(s) openEditor(s);
      });
    });
    $('listBody').querySelectorAll('[data-del-both]').forEach(function(b){
      b.addEventListener('click',function(){
        purgeTestBoth(b.getAttribute('data-del-both'), b.getAttribute('data-bid'), b.getAttribute('data-date'), b);
      });
    });
    $('listBody').querySelectorAll('[data-list-preview]').forEach(function(b){
      b.addEventListener('click',function(){
        STATE.pendingFormatSessionId=b.getAttribute('data-list-preview')||'';
        showScheduleSub('format',{sessionId:STATE.pendingFormatSessionId});
      });
    });
    $('listBody').querySelectorAll('[data-cancel]').forEach(function(b){
      b.addEventListener('click',function(){
        var s=STATE.sessions.find(function(x){return x.id===b.getAttribute('data-cancel');});
        if(s) openCancel(s);
      });
    });
  }
  function renderNotify(){
    var today=todayYmd();
    var rows=STATE.sessions.filter(function(s){return s.status==='Scheduled'||s.status==='ClientNotified';}).map(function(s){
      var days=null;
      try{
        var a=Date.parse(s.trainingDate+'T00:00:00+05:30');
        var b=Date.parse(today+'T00:00:00+05:30');
        days=Math.round((a-b)/(24*60*60*1000));
      }catch(e){}
      var due=days!==null && days<=3 && days>=0 && s.status==='Scheduled';
      var overdue=days!==null && days<0 && s.status==='Scheduled';
      var tag=overdue?'<span class="pill bad">Overdue</span>':(due?'<span class="pill warn">Due (T−'+days+')</span>':(days!==null?'<span class="pill">T−'+days+'</span>':''));
      var sendLabel=s.notifySentAt?'Send modified intimation':'Send intimation';
      var replyTag=s.clientReplyAt?' <span class="pill ok">Client replied</span>':'';
      var replyBox='';
      if(s.clientReplyAt){
        var replyWhat=s.clientReplyNote||'Reply received';
        if(s.clientReplyAction==='confirm'){
          replyWhat='Confirmed as Scheduled';
        } else if(s.clientReplyAction==='changeRequired' || s.clientReplyAction==='addTopic' || s.clientReplyAction==='changeSchedule' || s.clientReplyAction==='removeTopic'){
          replyWhat=s.clientReplyNote||'Change Required';
        }
        var replyWhen='';
        try{
          replyWhen=new Date(s.clientReplyAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'})+' IST';
        }catch(e2){ replyWhen=String(s.clientReplyAt||''); }
        var extra='';
        if(s.clientReplyRemoveTopic) extra+='<br><b style="color:#fca5a5">Remove topic:</b> '+esc(s.clientReplyRemoveTopic);
        if(s.clientReplyTopic) extra+='<br><b style="color:#fde68a">Add topic:</b> '+esc(s.clientReplyTopic);
        if(s.clientReplyNewDate||s.clientReplyNewTime) extra+='<br><b style="color:#93c5fd">New date/time:</b> '+esc((s.clientReplyNewDate||'')+' '+(s.clientReplyNewTime||''));
        replyBox='<div style="margin-top:10px;padding:10px;border-radius:8px;border:1px solid rgba(16,185,129,.45);background:rgba(6,78,59,.35);font-size:.88rem"><b style="color:#86efac">Client response</b><br>'+esc(replyWhat)+extra+'<br><span class="muted">Date stamp: '+esc(replyWhen)+'</span><br><span class="muted">Also check Add schedule → Training topics (and Client suggested list).</span></div>';
      }
      return '<div class="panel" style="margin:8px 0;padding:12px"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px"><div><b>'+esc(s.clientName)+'</b><br><span class="muted">'+esc(s.trainingDate)+' '+esc(s.trainingTime)+' · '+esc(clientEmailsLine(s))+'</span> '+tag+(s.notifySentAt?' <span class="pill ok">Sent</span>':'')+replyTag+'</div><div style="display:flex;flex-wrap:wrap;gap:6px"><button type="button" class="btn primary" data-send="'+s.id+'">'+sendLabel+'</button> <button type="button" class="btn" data-preview="'+s.id+'">Preview format</button> <button type="button" class="btn" data-glink="'+s.id+'">Prepare Guards Link</button></div></div>'+replyBox+'<div id="glink-'+s.id+'" class="hidden" style="margin-top:8px;padding:10px;border-radius:8px;border:1px solid rgba(201,168,76,.35);background:#0b1220;font-size:.85rem"></div></div>';
    }).join('')||'<p class="muted">No scheduled sessions needing notice this month.</p>';
    $('notifyList').innerHTML='<p class="muted" style="margin-bottom:10px">Client intimation first. Then <b>Prepare Guards Link</b> → WhatsApp to unit group (your numbers/group). Flow: Guard attendance only at training date &amp; time → Training Manager marks <b>final attendance</b> in hall from list → Feedback → Test → marks list.</p>'+rows;
    $('notifyList').querySelectorAll('[data-send]').forEach(function(b){
      b.addEventListener('click',function(){
        api('sendAdvance',{sessionId:b.getAttribute('data-send')}).then(function(j){
          trainingToast(j.revised?'Modified intimation sent to client.':'Intimation sent to client (with confirmation link).');
          return loadMonth();
        }).then(renderNotify).catch(function(e){trainingToast(e.message);});
      });
    });
    $('notifyList').querySelectorAll('[data-preview]').forEach(function(b){
      b.addEventListener('click',function(){
        STATE.pendingFormatSessionId=b.getAttribute('data-preview')||'';
        showScheduleSub('format',{sessionId:STATE.pendingFormatSessionId});
      });
    });
    function paintGuardsBox(box, id, j){
      var sum=j.summary||{};
      var roster=j.roster||[];
      var rosterHtml=roster.length?('<p class="muted" style="margin-top:8px">List received from guards. In the training hall, mark <b>Final attendance</b> — that is the official present list.</p><table style="width:100%;margin-top:8px;font-size:.82rem"><thead><tr><th>Guard (received)</th><th>Final attendance</th><th>Feedback</th><th>Marks</th><th></th></tr></thead><tbody>'+
        roster.map(function(r){
          var marks=(r.tested&&r.score!=null)?(r.score+'/'+(r.maxScore||10)):'—';
          var conf=r.confirmed?'<span class="pill ok">Present (final)</span>':'<span class="pill warn">On list — not marked</span>';
          var fb=r.feedback?'<span class="pill ok">Yes</span>':'—';
          var btn=r.confirmed?'':('<button type="button" class="btn primary" data-confirm-att="'+esc(r.responseId)+'">Mark present (final)</button>');
          return '<tr><td>'+esc(r.name)+(r.employeeId?' <span class="muted">('+esc(r.employeeId)+')</span>':'')+'</td><td>'+conf+'</td><td>'+fb+'</td><td><b>'+esc(marks)+'</b></td><td>'+btn+'</td></tr>';
        }).join('')+'</tbody></table>'):'<p class="muted" style="margin-top:8px">No attendance received yet. WhatsApp the schedule to your <b>unit WhatsApp group</b> (use the group/numbers you already have).</p>';
      var marksOnly=roster.filter(function(r){return r.tested;});
      var marksList=marksOnly.length?('<div style="margin-top:10px"><b style="color:#fde68a">Boys with marks</b><ol style="margin:6px 0 0 18px">'+marksOnly.map(function(r){
        return '<li>'+esc(r.name)+' — <b>'+esc(String(r.score))+'/'+esc(String(r.maxScore||10))+'</b></li>';
      }).join('')+'</ol></div>'):'';
      box.innerHTML='<b>Guards link — schedule + attendance</b><br><span class="muted">WhatsApp: share to the unit group — app does not collect guard WhatsApp numbers.</span><br><a href="'+esc(j.url)+'" target="_blank" rel="noopener" style="color:#fde68a;word-break:break-all">'+esc(j.url)+'</a><br><span class="muted">On list: '+(sum.attended||0)+' · Final present: '+roster.filter(function(r){return r.confirmed;}).length+' · Feedback: '+(sum.feedbackCount||0)+' · Tests: '+(sum.tested||0)+' · Avg: '+esc(sum.avgScore||'—')+'</span><div class="form-actions" style="margin-top:8px"><button type="button" class="btn primary" data-copy="'+esc(j.url)+'">Copy link</button> <a class="btn" href="'+esc(j.whatsappUrl)+'" target="_blank" rel="noopener">WhatsApp to unit group</a> <button type="button" class="btn" data-refresh-roster="'+esc(id)+'">Refresh list</button></div>'+rosterHtml+marksList;
      box.querySelectorAll('[data-copy]').forEach(function(c){
        c.addEventListener('click',function(){
          var u=c.getAttribute('data-copy')||'';
          if(navigator.clipboard&&navigator.clipboard.writeText){
            navigator.clipboard.writeText(u).then(function(){trainingToast('Link copied.');}).catch(function(){prompt('Copy this link:',u);});
          }else{prompt('Copy this link:',u);}
        });
      });
      box.querySelectorAll('[data-confirm-att]').forEach(function(c){
        c.addEventListener('click',function(){
          var rid=c.getAttribute('data-confirm-att');
          api('confirmGuardAttendance',{sessionId:id, responseId:rid}).then(function(res){
            trainingToast('Final attendance marked — guard can now give feedback.');
            paintGuardsBox(box, id, res);
          }).catch(function(e){trainingToast(e.message);});
        });
      });
      box.querySelectorAll('[data-refresh-roster]').forEach(function(c){
        c.addEventListener('click',function(){
          api('guardsRoster',{sessionId:id}).then(function(res){
            res.url=j.url; res.whatsappUrl=j.whatsappUrl;
            paintGuardsBox(box, id, res);
            trainingToast('Roster updated.');
          }).catch(function(e){trainingToast(e.message);});
        });
      });
    }
    $('notifyList').querySelectorAll('[data-glink]').forEach(function(b){
      b.addEventListener('click',function(){
        var id=b.getAttribute('data-glink');
        api('prepareGuardsLink',{sessionId:id}).then(function(j){
          var box=$('glink-'+id);
          if(!box)return;
          box.classList.remove('hidden');
          paintGuardsBox(box, id, j);
          trainingToast('Guards Link ready — WhatsApp to your unit group (you pick the group/numbers).');
        }).catch(function(e){trainingToast(e.message);});
      });
    });
  }
  function confirmAddGuardFormHtml(){
    var sess=((STATE.sessions||[]).find(function(s){return s.id===$('confirmSessionPick').value;})||{});
    var defUnit=sess.location||'';
    return '<div id="confirmAddGuardBox" style="margin-top:16px;padding:14px;border:1px solid rgba(201,168,76,.4);border-radius:10px;background:#0b1220">'+
      '<div style="font-weight:800;color:#fde68a;margin-bottom:6px">Add guard (this Training list only)</div>'+
      '<p class="muted" style="margin:0 0 10px">Use when someone is missing from the MIS list. Does <b>not</b> change Branch clients.</p>'+
      '<div class="row" style="display:flex;flex-wrap:wrap;gap:8px">'+
      '<label style="flex:1;min-width:140px">Name <input id="addGName" placeholder="Guard name"></label>'+
      '<label style="flex:1;min-width:120px">ID number <input id="addGId" placeholder="Employee ID"></label>'+
      '<label style="flex:1;min-width:100px">Rank <input id="addGRank" placeholder="e.g. SG"></label>'+
      '<label style="flex:1;min-width:140px">Unit <input id="addGUnit" value="'+esc(defUnit)+'" placeholder="Unit / building"></label>'+
      '<label style="flex:1;min-width:120px">Mobile <input id="addGMobile" inputmode="numeric" placeholder="10-digit mobile"></label>'+
      '</div>'+
      '<div style="margin-top:10px"><button type="button" class="btn primary" id="btnAddTrainingGuard">Add guard to list</button></div>'+
      '</div>';
  }
  function wireConfirmAddGuard(){
    var btn=$('btnAddTrainingGuard');
    if(!btn||btn._wired) return;
    btn._wired=true;
    btn.onclick=function(){
      var id=$('confirmSessionPick').value;
      if(!id){ trainingToast('Select a training session first.'); return; }
      var name=($('addGName')&&$('addGName').value||'').trim();
      if(!name){ trainingToast('Enter guard name.'); return; }
      btn.disabled=true;
      api('addTrainingGuardRow',{
        sessionId:id,
        name:name,
        employeeId:($('addGId')&&$('addGId').value||'').trim(),
        rank:($('addGRank')&&$('addGRank').value||'').trim(),
        unitName:($('addGUnit')&&$('addGUnit').value||'').trim(),
        mobile:($('addGMobile')&&$('addGMobile').value||'').trim()
      }).then(function(j){
        btn.disabled=false;
        trainingToast(j.message||'Guard added.');
        if($('addGName')) $('addGName').value='';
        if($('addGId')) $('addGId').value='';
        if($('addGRank')) $('addGRank').value='';
        if($('addGMobile')) $('addGMobile').value='';
        refreshConfirmTable(id);
      }).catch(function(e){ btn.disabled=false; trainingToast(e.message); });
    };
  }
  function paintConfirmGuardsList(j){
    var box=$('confirmGuardsBox');
    if(!box) return;
    j=j||{};
    var rows=j.tableRows||j.guards||CONFIRM_WA.guards||[];
    if(j.tableRows||j.guards) CONFIRM_WA.guards=rows;
    if(!rows.length){
      box.innerHTML='<p class="muted">No guards yet. First <b>Show client units</b>, toggle the units you need, then <b>Load guards for selected units</b>. Or add a guard below.</p>'+confirmAddGuardFormHtml();
      wireConfirmAddGuard();
      return;
    }
    var html='';
    var unitOrder=[];
    var byUnit={};
    rows.forEach(function(g){
      var u=g.unitName||'—';
      if(!byUnit[u]){ byUnit[u]=[]; unitOrder.push(u); }
      byUnit[u].push(g);
    });
    var sess=((STATE.sessions||[]).find(function(s){return s.id===$('confirmSessionPick').value;})||{});
    var client=sess.clientName||'';
    html+='<div style="margin:0 0 10px;padding:10px 12px;border-radius:8px;border:1px solid rgba(201,168,76,.35);background:#111a30;color:#e2e8f0;font-size:.88rem">'+
      '<b>Guards by unit</b> for <b>'+esc(client||'client')+'</b> — '+unitOrder.length+' unit(s) · '+rows.length+' guard(s). '+
      'Unit column shows which building / site each guard belongs to (e.g. KRC Building 10).'+
      '</div>';
    html+='<div style="overflow:auto"><table style="width:100%;min-width:980px;font-size:.82rem;border-collapse:collapse">'+
      '<thead><tr style="background:#111a30;color:#f0e6c8">'+
      '<th style="padding:8px;border-bottom:1px solid rgba(201,168,76,.3)">Sl.</th>'+
      '<th style="padding:8px;border-bottom:1px solid rgba(201,168,76,.3)">Name</th>'+
      '<th style="padding:8px;border-bottom:1px solid rgba(201,168,76,.3)">ID number</th>'+
      '<th style="padding:8px;border-bottom:1px solid rgba(201,168,76,.3)">Rank</th>'+
      '<th style="padding:8px;border-bottom:1px solid rgba(201,168,76,.3)">Unit</th>'+
      '<th style="padding:8px;border-bottom:1px solid rgba(201,168,76,.3)">Mobile</th>'+
      '<th style="padding:8px;border-bottom:1px solid rgba(201,168,76,.3)">Select for Training</th>'+
      '<th style="padding:8px;border-bottom:1px solid rgba(201,168,76,.3)">Send WhatsApp</th>'+
      '<th style="padding:8px;border-bottom:1px solid rgba(201,168,76,.3)">Response</th>'+
      '<th style="padding:8px;border-bottom:1px solid rgba(201,168,76,.3)">Edit / Delete</th>'+
      '</tr></thead><tbody>';
    var sl=0;
    unitOrder.forEach(function(unitName){
      var list=byUnit[unitName]||[];
      html+='<tr><td colspan="10" style="padding:8px 10px;background:rgba(201,168,76,.12);color:#fde68a;font-weight:800;border-bottom:1px solid rgba(201,168,76,.25)">Unit: '+esc(unitName)+' <span class="muted" style="font-weight:500">('+(list.length)+' guard'+(list.length===1?'':'s')+')</span></td></tr>';
      list.forEach(function(g){
        sl+=1;
        var can=g.canWhatsApp!==false&&String(g.mobile||'').replace(/\\D/g,'').length>=10;
        var sel=g.selectedForTraining!==false;
        var resp=g.response||'—';
        html+='<tr data-guard-id="'+esc(g.id)+'">'+
          '<td style="padding:7px;border-bottom:1px solid rgba(148,163,184,.15)">'+sl+'</td>'+
          '<td style="padding:7px;border-bottom:1px solid rgba(148,163,184,.15)">'+esc(g.name||'—')+'</td>'+
          '<td style="padding:7px;border-bottom:1px solid rgba(148,163,184,.15)">'+esc(g.employeeId||'—')+'</td>'+
          '<td style="padding:7px;border-bottom:1px solid rgba(148,163,184,.15)">'+esc(g.rank||'—')+'</td>'+
          '<td style="padding:7px;border-bottom:1px solid rgba(148,163,184,.15)"><b>'+esc(g.unitName||'—')+'</b></td>'+
          '<td style="padding:7px;border-bottom:1px solid rgba(148,163,184,.15)">'+(can?esc(g.mobile):'<span class="muted">'+(esc(g.mobile)||'No mobile')+'</span>')+'</td>'+
          '<td style="padding:7px;border-bottom:1px solid rgba(148,163,184,.15);text-align:center"><input type="checkbox" class="confirm-train-sel" data-id="'+esc(g.id)+'" data-mobile="'+esc(can?g.mobile:'')+'" '+(sel&&can?'checked':'')+' '+(can?'':'disabled')+'></td>'+
          '<td style="padding:7px;border-bottom:1px solid rgba(148,163,184,.15)"><button type="button" class="btn confirm-wa-one" data-mobile="'+esc(can?g.mobile:'')+'" '+(can?'':'disabled')+' style="min-height:32px;padding:4px 8px;font-size:.78rem">Send</button></td>'+
          '<td style="padding:7px;border-bottom:1px solid rgba(148,163,184,.15)">'+(resp!=='—'?'<span class="pill ok">'+esc(resp)+'</span>':'<span class="muted">—</span>')+'</td>'+
          '<td style="padding:7px;border-bottom:1px solid rgba(148,163,184,.15);white-space:nowrap">'+
            '<button type="button" class="btn confirm-edit-one" data-id="'+esc(g.id)+'" style="min-height:32px;padding:4px 8px;font-size:.78rem">Edit</button> '+
            '<button type="button" class="btn danger confirm-del-one" data-id="'+esc(g.id)+'" style="min-height:32px;padding:4px 8px;font-size:.78rem">Delete</button>'+
          '</td></tr>';
      });
    });
    html+='</tbody></table></div>';
    var waOk=rows.filter(function(g){ return g.canWhatsApp!==false&&String(g.mobile||'').replace(/\\D/g,'').length>=10; }).length;
    html+='<p class="muted" style="margin-top:8px">'+rows.length+' guard(s) · '+waOk+' with mobile · '+unitOrder.length+' unit(s). Responses appear in the Response column.</p>';
    html+=confirmAddGuardFormHtml();
    box.innerHTML=html;
    wireConfirmAddGuard();
    box.querySelectorAll('.confirm-train-sel').forEach(function(c){
      c.onchange=function(){
        var id=$('confirmSessionPick').value;
        if(!id) return;
        api('saveTrainingGuardRow',{sessionId:id, guardId:c.getAttribute('data-id'), selectedForTraining:c.checked}).catch(function(e){ trainingToast(e.message); });
      };
    });
    box.querySelectorAll('.confirm-wa-one').forEach(function(b){
      b.onclick=function(){
        var id=$('confirmSessionPick').value;
        var mobile=b.getAttribute('data-mobile')||'';
        if(!id||!mobile){ trainingToast('No mobile on this row.'); return; }
        b.disabled=true;
        api('sendTrainingConfirmWa',{sessionId:id, mobiles:[mobile]}).then(function(j){
          b.disabled=false;
          if(j.text) applyConfirmMessage(j);
          refreshConfirmTable(id);
          trainingToast(j.sendOk?'WhatsApp sent.':((j.errors&&j.errors[0])||'Send failed.'));
        }).catch(function(e){ b.disabled=false; trainingToast(e.message); });
      };
    });
    box.querySelectorAll('.confirm-edit-one').forEach(function(b){
      b.onclick=function(){
        var id=$('confirmSessionPick').value;
        var gid=b.getAttribute('data-id');
        var row=(CONFIRM_WA.guards||[]).find(function(g){ return g.id===gid; })||{};
        var name=prompt('Name', row.name||'');
        if(name===null) return;
        var employeeId=prompt('ID number', row.employeeId||'');
        if(employeeId===null) return;
        var rank=prompt('Rank', row.rank||'');
        if(rank===null) return;
        var mobile=prompt('Mobile', row.mobile||'');
        if(mobile===null) return;
        api('saveTrainingGuardRow',{sessionId:id, guardId:gid, name:name, employeeId:employeeId, rank:rank, mobile:mobile}).then(function(){
          refreshConfirmTable(id);
          trainingToast('Guard updated on this Training list only.');
        }).catch(function(e){ trainingToast(e.message); });
      };
    });
    box.querySelectorAll('.confirm-del-one').forEach(function(b){
      b.onclick=function(){
        var id=$('confirmSessionPick').value;
        var gid=b.getAttribute('data-id');
        if(!confirm('Remove this guard from the Training list only? (Does not change Branch clients / MIS)')) return;
        api('deleteTrainingGuardRow',{sessionId:id, guardId:gid}).then(function(j){
          trainingToast(j.message||'Removed.');
          refreshConfirmTable(id);
        }).catch(function(e){ trainingToast(e.message); });
      };
    });
  }
  function paintConfirmBankUnits(j){
    var note=$('confirmScopeNote');
    if(note) note.textContent=j.scopeNote||'';
    var box=$('confirmBankUnitsBox');
    if(!box) return;
    var units=j.availableUnits||[];
    var picked=new Set(j.trainingInviteUnits||[]);
    var sess=((STATE.sessions||[]).find(function(s){return s.id===$('confirmSessionPick').value;})||{});
    var client=sess.clientName||'client';
    var rows=j.tableRows||j.guards||CONFIRM_WA.guards||[];
    var countByUnit={};
    rows.forEach(function(g){
      var u=g.unitName||'—';
      countByUnit[u]=(countByUnit[u]||0)+1;
    });
    var isKrc=/krc|k raheja|kraheja|mindspace|sundew|stargaze|raheja/i.test(client);
    if(!units.length){
      box.innerHTML='<p class="muted" style="margin:0">No unit / location names yet for <b>'+esc(client)+'</b> on this branch. Branch clients are not changed. You can still <b>Add guard</b> below, or open Schedule and confirm the client name is saved.</p>';
      return;
    }
    var title=isKrc
      ? '<b>Client-wise units (locations)</b> for <b>'+esc(client)+'</b> — related KRC buildings on this branch. Toggle only what you need (avoids irrelevant units), then tap <b>Load guards for selected units</b>.'
      : '<b>Client-wise units (locations)</b> for <b>'+esc(client)+'</b> on this branch. Toggle only what you need, then tap <b>Load guards for selected units</b>.';
    box.innerHTML='<p style="margin:0 0 8px;font-size:.9rem;color:#e2e8f0">'+title+'</p>'+
      '<p class="muted" style="margin:0 0 10px">ON = include this unit · OFF = skip. Guards load only after you tap Load guards.</p>'+
      '<div style="display:flex;flex-wrap:wrap;gap:10px 16px;max-height:240px;overflow:auto">'+
      units.map(function(u){
        var id='tunit-'+String(u).replace(/[^a-zA-Z0-9]+/g,'_').slice(0,40);
        var on=picked.has(u);
        var n=countByUnit[u];
        var countHtml=(typeof n==='number'&&n>0)?' <span class="muted">('+n+' loaded)</span>':'';
        return '<label class="unit-tog" style="display:inline-flex;align-items:center;gap:8px;font-size:.85rem;color:#e2e8f0;cursor:pointer;padding:6px 10px;border-radius:999px;border:1px solid rgba(201,168,76,.35);background:'+(on?'rgba(201,168,76,.18)':'#0a1020')+'">'+
          '<span style="position:relative;width:42px;height:24px;flex:0 0 auto">'+
          '<input type="checkbox" class="confirm-bank-unit" id="'+esc(id)+'" value="'+esc(u)+'" '+(on?'checked':'')+' style="opacity:0;width:42px;height:24px;margin:0;position:absolute;inset:0;cursor:pointer;z-index:2">'+
          '<span data-tog="track" style="display:block;width:42px;height:24px;border-radius:999px;background:'+(on?'#c9a84c':'#334155')+';transition:.15s"></span>'+
          '<span data-tog="knob" style="position:absolute;top:3px;left:'+(on?'22px':'3px')+';width:18px;height:18px;border-radius:50%;background:#fff;transition:.15s;pointer-events:none"></span>'+
          '</span> <span><b>'+esc(u)+'</b>'+countHtml+'</span></label>';
      }).join('')+
      '</div><div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px">'+
      '<button type="button" class="btn" id="btnSelectAllUnits">All units on</button>'+
      '<button type="button" class="btn" id="btnClearAllUnits">All units off</button></div>';
    function restyleTogs(){
      box.querySelectorAll('.unit-tog').forEach(function(lab){
        var c=lab.querySelector('.confirm-bank-unit');
        var on=c&&c.checked;
        lab.style.background=on?'rgba(201,168,76,.18)':'#0a1020';
        var parts=lab.querySelectorAll('[data-tog]');
        if(parts[0]) parts[0].style.background=on?'#c9a84c':'#334155';
        if(parts[1]) parts[1].style.left=on?'22px':'3px';
      });
    }
    box.querySelectorAll('.confirm-bank-unit').forEach(function(c){ c.onchange=restyleTogs; });
    var btnAll=$('btnSelectAllUnits');
    if(btnAll) btnAll.onclick=function(){ box.querySelectorAll('.confirm-bank-unit').forEach(function(c){ c.checked=true; }); restyleTogs(); };
    var btnClr=$('btnClearAllUnits');
    if(btnClr) btnClr.onclick=function(){ box.querySelectorAll('.confirm-bank-unit').forEach(function(c){ c.checked=false; }); restyleTogs(); };
  }
  function selectedConfirmMobiles(){
    var out=[];
    document.querySelectorAll('.confirm-train-sel:checked').forEach(function(c){
      var m=c.getAttribute('data-mobile')||'';
      if(m) out.push(m);
    });
    return out;
  }
  function applyConfirmMessage(j){
    CONFIRM_WA.text=j.text||CONFIRM_WA.text||'';
    CONFIRM_WA.url=j.url||CONFIRM_WA.url||'';
    CONFIRM_WA.whatsappUrl=j.whatsappUrl||(CONFIRM_WA.text?('https://wa.me/?text='+encodeURIComponent(CONFIRM_WA.text)):'');
    if(typeof j.waReady==='boolean') CONFIRM_WA.waReady=j.waReady;
    var msg=$('confirmMsgBox'); if(msg) msg.textContent=CONFIRM_WA.text||'No message.';
    var st=$('confirmWaStatus');
    if(st) st.textContent=CONFIRM_WA.waReady
      ? 'WhatsApp ready (Fast2SMS / Whapi).'
      : 'WhatsApp not configured yet — use Copy message if needed.';
    var link=$('confirmLinkLine');
    if(link) link.textContent=CONFIRM_WA.url
      ? 'Confirmation link ready — Open confirmation link.'
      : '';
    var openLink=$('btnConfirmOpenLink');
    if(openLink){
      if(CONFIRM_WA.url){ openLink.href=CONFIRM_WA.url; openLink.style.display=''; }
      else { openLink.href='#'; openLink.style.display='none'; }
    }
    if(j.scopeNote){ var note=$('confirmScopeNote'); if(note) note.textContent=j.scopeNote; }
  }
  function applyConfirmGuardsList(j){
    if(j.tableRows||j.guards) CONFIRM_WA.guards=j.tableRows||j.guards;
    paintConfirmBankUnits(j);
    paintConfirmGuardsList(j);
  }
  function applyConfirmPreview(j){
    if(j.text||j.url||j.whatsappUrl) applyConfirmMessage(j);
    if(j.availableUnits||j.tableRows||j.guards) applyConfirmGuardsList(j);
  }
  function refreshConfirmTable(sessionId){
    if(!sessionId) return;
    api('listTrainingGuards',{sessionId:sessionId}).then(function(j){ applyConfirmGuardsList(j); }).catch(function(){});
  }
  function loadConfirmRoster(sessionId){
    /** Responses now live in the main table Response column. */
    if(sessionId) refreshConfirmTable(sessionId);
  }
  function renderConfirmAttend(){
    var pick=$('confirmSessionPick');
    if(!pick) return;
    var prev=pick.value||STATE.selectedId||'';
    pick.innerHTML=sessionOptionsHtml(prev);
    if(!pick._wired){
      pick._wired=true;
      pick.onchange=function(){
        STATE.selectedId=pick.value||'';
        CONFIRM_WA={ text:'', url:'', whatsappUrl:'', guards:[], waReady:false };
        var msg=$('confirmMsgBox'); if(msg) msg.textContent='WhatsApp message preview (optional).';
        var box=$('confirmGuardsBox'); if(box) box.innerHTML='';
        var note=$('confirmScopeNote'); if(note) note.textContent='';
        var bank=$('confirmBankUnitsBox'); if(bank){ bank.innerHTML='<p class="muted" style="margin:0">Pick a session, then tap <b>Show client units</b>.</p>'; }
        var gbox=$('confirmGuardsBox'); if(gbox) gbox.innerHTML='';
      };
      function selectedUnitToggles(){
        var sel=[];
        document.querySelectorAll('.confirm-bank-unit:checked').forEach(function(c){ sel.push(c.value); });
        return sel;
      }
      $('btnConfirmLoadUnits').onclick=function(){
        var id=$('confirmSessionPick').value;
        if(!id){ trainingToast('Select a training session first.'); return; }
        var btn=$('btnConfirmLoadUnits');
        if(btn) btn.disabled=true;
        api('listTrainingUnits',{sessionId:id}).then(function(j){
          if(btn) btn.disabled=false;
          CONFIRM_WA.guards=[];
          applyConfirmGuardsList(j);
          var gbox=$('confirmGuardsBox');
          if(gbox) gbox.innerHTML='<p class="muted">Units ready. Toggle the unit / location names you need above, then tap <b>Load guards for selected units</b>.</p>';
          trainingToast(j.message||'Client units loaded.');
        }).catch(function(e){ if(btn) btn.disabled=false; trainingToast(e.message); });
      };
      $('btnConfirmLoadGuards').onclick=function(){
        var id=$('confirmSessionPick').value;
        if(!id){ trainingToast('Select a training session first.'); return; }
        var units=selectedUnitToggles();
        if(!units.length){ trainingToast('Toggle at least one client unit / location first.'); return; }
        var btn=$('btnConfirmLoadGuards');
        if(btn) btn.disabled=true;
        api('listTrainingGuards',{sessionId:id, units:units}).then(function(j){
          if(btn) btn.disabled=false;
          applyConfirmGuardsList(j);
          var n=(j.tableRows||j.guards||[]).length;
          trainingToast(j.message||(n?('Loaded '+n+' guard(s) for '+units.length+' unit(s).'):'No guards for selected units.'));
        }).catch(function(e){ if(btn) btn.disabled=false; trainingToast(e.message); });
      };
      $('btnConfirmSelectAll').onclick=function(){
        var id=$('confirmSessionPick').value;
        if(!id){ trainingToast('Select a training session first.'); return; }
        api('selectAllTrainingGuards',{sessionId:id, select:true}).then(function(j){
          trainingToast(j.message||'All selected.');
          refreshConfirmTable(id);
        }).catch(function(e){ trainingToast(e.message); });
      };
      $('btnConfirmDeselectAll').onclick=function(){
        var id=$('confirmSessionPick').value;
        if(!id){ trainingToast('Select a training session first.'); return; }
        api('selectAllTrainingGuards',{sessionId:id, select:false}).then(function(j){
          trainingToast(j.message||'All deselected.');
          refreshConfirmTable(id);
        }).catch(function(e){ trainingToast(e.message); });
      };
      $('btnConfirmPreview').onclick=function(){
        var id=$('confirmSessionPick').value;
        if(!id){ trainingToast('Select a training session first.'); return; }
        api('previewTrainingConfirmWa',{sessionId:id}).then(function(j){
          applyConfirmMessage(j);
          trainingToast('WhatsApp message ready.');
        }).catch(function(e){ trainingToast(e.message); });
      };
      $('btnConfirmCopy').onclick=function(){
        var t=CONFIRM_WA.text||'';
        if(!t){ trainingToast('Preview the WhatsApp message first.'); return; }
        if(navigator.clipboard&&navigator.clipboard.writeText){
          navigator.clipboard.writeText(t).then(function(){ trainingToast('Message copied.'); }).catch(function(){ prompt('Copy message:',t); });
        }else{ prompt('Copy message:',t); }
      };
      $('btnConfirmSendAll').onclick=function(){
        var id=$('confirmSessionPick').value;
        if(!id){ trainingToast('Select a training session first.'); return; }
        var mobiles=selectedConfirmMobiles();
        if(!mobiles.length){ trainingToast('Select guards for Training first (or Select all).'); return; }
        var btn=$('btnConfirmSendAll');
        if(btn) btn.disabled=true;
        api('sendTrainingConfirmWa',{sessionId:id, mobiles:mobiles}).then(function(j){
          if(btn) btn.disabled=false;
          if(j.text) applyConfirmMessage(j);
          refreshConfirmTable(id);
          if(j.sendOk) trainingToast('Intimation sent: '+(j.sent||0)+' · failed: '+(j.failed||0));
          else trainingToast((j.errors&&j.errors[0])||('Sent '+(j.sent||0)+', failed '+(j.failed||0)));
        }).catch(function(e){ if(btn) btn.disabled=false; trainingToast(e.message); });
      };
      $('btnConfirmAttendanceReq').onclick=function(){
        var id=$('confirmSessionPick').value;
        if(!id){ trainingToast('Select a training session first.'); return; }
        var btn=$('btnConfirmAttendanceReq');
        if(btn) btn.disabled=true;
        api('sendAttendanceRequestWa',{sessionId:id}).then(function(j){
          if(btn) btn.disabled=false;
          if(j.text) applyConfirmMessage(j);
          refreshConfirmTable(id);
          if(j.sendOk) trainingToast('Attendance request sent: '+(j.sent||0));
          else trainingToast((j.errors&&j.errors[0])||'No EOI responses yet.');
        }).catch(function(e){ if(btn) btn.disabled=false; trainingToast(e.message); });
      };
      $('btnConfirmSendQuiz').onclick=function(){
        var id=$('confirmSessionPick').value;
        if(!id){ trainingToast('Select a training session first.'); return; }
        var btn=$('btnConfirmSendQuiz');
        if(btn) btn.disabled=true;
        api('sendTopicQuizWa',{sessionId:id}).then(function(j){
          if(btn) btn.disabled=false;
          if(j.text) applyConfirmMessage(j);
          refreshConfirmTable(id);
          if(j.sendOk) trainingToast('5 questions sent: '+(j.sent||0));
          else trainingToast((j.errors&&j.errors[0])||'No attendance list yet.');
        }).catch(function(e){ if(btn) btn.disabled=false; trainingToast(e.message); });
      };
    }
  }
  function sessionOptionsHtml(selected){
    return '<option value="">Select session…</option>'+STATE.sessions.map(function(s){
      var site=s.location?(' · '+s.location):'';
      return '<option value="'+s.id+'"'+(s.id===selected?' selected':'')+'>'+esc(s.trainingDate)+' — '+esc(s.clientName)+esc(site)+' ('+esc(statusLabel(s.status))+')</option>';
    }).join('');
  }
  function syncReasonWraps(){
    $('iTurnoutReasonWrap').style.display=$('iTurnout').value==='ToBeImproved'?'':'none';
    $('iIdReasonWrap').style.display=$('iIdValid').value==='ToBeCorrected'?'':'none';
    $('iRecordReasonWrap').style.display=$('iRecord').value==='ToBeImproved'?'':'none';
  }
  function showCompletionMode(mode){
    $('completionEdit').classList.toggle('hidden', mode!=='edit');
    $('completionReview').classList.toggle('hidden', mode!=='review');
  }
  function showSecurityMode(mode){
    $('securityEdit').classList.toggle('hidden', mode!=='edit');
    $('securityReview').classList.toggle('hidden', mode!=='review');
  }
  function ratingText(v){
    if(v==='Excellent') return 'Excellent';
    if(v==='ToBeImproved') return 'To be improved';
    return v||'—';
  }
  function idText(v){
    if(v==='AllValid') return 'All valid';
    if(v==='ToBeCorrected') return 'To be corrected';
    return v||'—';
  }
  function renderCompletionPick(){
    $('completionPick').innerHTML='<label>Session <select id="compSession">'+sessionOptionsHtml(STATE.selectedId)+'</select></label>';
    $('compSession').onchange=function(){ loadReport($('compSession').value,'completion'); };
    if(STATE.selectedId) loadReport(STATE.selectedId,'completion');
  }
  function renderInternalPick(){
    $('internalPick').innerHTML='<label>Session <select id="intSession">'+sessionOptionsHtml(STATE.selectedId)+'</select></label>';
    $('intSession').onchange=function(){ loadReport($('intSession').value,'security'); };
    if(STATE.selectedId) loadReport(STATE.selectedId,'security');
  }
  function fillReportForms(r, nightHint, session){
    r=r||{};
    session=session||STATE.session||{};
    STATE.marksFile=null;
    STATE.completionPhotos=(r.completionPhotos||[]).slice(0,OJT_MAX_PHOTOS).map(function(p,i){
      return {
        id:p.id||('ph'+i),
        name:p.name||('photo-'+(i+1)+'.jpg'),
        type:p.type||'image/jpeg',
        base64:p.base64||'__stored__'
      };
    });
    $('rDate').value=r.reportDate||session.trainingDate||'';
    $('rTopics').value=r.topicsCovered||session.topics||'';
    $('rSan').value=r.sanctionedStrength||'';
    $('rAttCount').value=r.attendanceCount||'';
    $('rAttNames').value=r.attendanceNames||'';
    $('rOpsStaff').value=r.operationsStaffNames||'';
    $('rFeedback').value=r.feedback||[r.guardFeedback,r.clientFeedback].filter(Boolean).join('\\n\\n')||'';
    $('rMarksFileMeta').textContent=r.marksFileName?('Saved file: '+r.marksFileName):'No file attached yet';
    if($('rMarksFile')) $('rMarksFile').value='';
    if($('rPhotoCam')) $('rPhotoCam').value='';
    if(window.OJT_GALLERY&&window.OJT_GALLERY.set) window.OJT_GALLERY.set(STATE.completionPhotos||[]);
    else renderPhotoGrid();
    if($('rClientBenefitMeta')){
      if(r.clientOjtBenefitRating){
        var whenFb=String(r.clientOjtBenefitAt||'').slice(0,16).replace('T',' ');
        $('rClientBenefitMeta').innerHTML=
          '<b style="color:#86efac">Recorded:</b> '+esc(r.clientOjtBenefitRating)+
          (r.clientOjtBenefitBy?(' — '+esc(r.clientOjtBenefitBy)):'')+
          (whenFb?('<br><span class="muted">Date stamp: '+esc(whenFb)+'</span>'):'')+
          '<br><span class="muted">Question: Overall, how was the OJT beneficial to our security operations?</span>';
      } else {
        $('rClientBenefitMeta').textContent='Pending — client has not replied yet (Feedback button on Share email). Tap Refresh after they submit.';
      }
    }
    var mailBits=[];
    if(r.reportSentAt) mailBits.push('Sent to client '+r.reportSentAt+(r.reportSentBy?' by '+r.reportSentBy:''));
    if(r.clientOjtBenefitRating) mailBits.push('Client feedback recorded: '+r.clientOjtBenefitRating);
    $('reportMailMeta').textContent=mailBits.join(' · ');
    $('iTurnout').value=r.turnoutRating||'';
    $('iTurnoutReason').value=r.turnoutReason||'';
    $('iIdValid').value=r.idCardValidity||'';
    $('iIdReason').value=r.idCardReason||'';
    $('iRecord').value=r.recordKeeping||'';
    $('iRecordReason').value=r.recordKeepingReason||'';
    $('iOmDate').value=r.omPreviousVisitDate||'';
    $('iNightDate').value=r.previousNightCheckDate||'';
    $('iAbnormal').value=r.otherAbnormality||'';
    $('iInfoGather').value=r.informationGathering||'';
    $('nightHint').textContent=nightHint||'';
    $('securityMailMeta').textContent=r.securityObsSentAt?('Sent to HOD '+r.securityObsSentAt+(r.securityObsSentBy?' by '+r.securityObsSentBy:'')):'';
    syncReasonWraps();
    $('completionForm').classList.remove('hidden');
    $('internalForm').classList.remove('hidden');
    showCompletionMode('edit');
    showSecurityMode('edit');
    showGalleryInput(true);
  }
  function loadReport(sessionId, tab){
    STATE.selectedId=sessionId||'';
    if(!sessionId){ $('completionForm').classList.add('hidden'); $('internalForm').classList.add('hidden'); return; }
    api('getReport',{sessionId:sessionId}).then(function(j){
      STATE.report=j.report;
      STATE.session=j.session||null;
      fillReportForms(j.report, j.nightHint, j.session);
      if(tab==='review-completion') showCompletionReview();
      if(tab==='review-security') showSecurityReview();
    }).catch(function(e){trainingToast(e.message);});
  }
  function readFileAsBase64(file, kind){
    return new Promise(function(resolve,reject){
      if(!file){ resolve(null); return; }
      var max=kind==='photo'?1200000:1800000;
      if(file.size>max*2.5){ reject(new Error((kind==='photo'?'Photo':'Marks file')+' is too large — try a smaller image or PDF.')); return; }
      var reader=new FileReader();
      reader.onload=function(){
        var s=String(reader.result||'');
        var i=s.indexOf('base64,');
        resolve({
          name:file.name,
          type:file.type||'',
          base64:i>=0?s.slice(i+7):s
        });
      };
      reader.onerror=function(){ reject(new Error(kind==='photo'?'Could not read the photo.':'Could not read the marks file.')); };
      reader.readAsDataURL(file);
    });
  }
  function compressImageFile(file){
    return new Promise(function(resolve,reject){
      if(!file){ resolve(null); return; }
      function finishCanvas(srcW,srcH,paint){
        try{
          var maxW=1280;
          var w=srcW||maxW,h=srcH||maxW;
          if(w>maxW){ h=Math.max(1,Math.round(h*maxW/w)); w=maxW; }
          var canvas=document.createElement('canvas');
          canvas.width=w; canvas.height=h;
          var ctx=canvas.getContext('2d');
          if(!ctx){ readFileAsBase64(file,'photo').then(resolve).catch(reject); return; }
          paint(ctx,w,h);
          var dataUrl=canvas.toDataURL('image/jpeg',0.82);
          var i=dataUrl.indexOf('base64,');
          var base64=i>=0?dataUrl.slice(i+7):'';
          if(!base64){ reject(new Error('Could not process the photo.')); return; }
          if(base64.length>950000){ reject(new Error('Photo still too large after resize — try another picture.')); return; }
          resolve({
            name:String(file.name||'photo.jpg').replace(/\\.[^.]+$/i,'')+'.jpg',
            type:'image/jpeg',
            base64:base64
          });
        }catch(err){
          readFileAsBase64(file,'photo').then(resolve).catch(reject);
        }
      }
      function viaImage(){
        var url=URL.createObjectURL(file);
        var img=new Image();
        img.onload=function(){
          URL.revokeObjectURL(url);
          finishCanvas(img.naturalWidth||img.width, img.naturalHeight||img.height, function(ctx,w,h){ ctx.drawImage(img,0,0,w,h); });
        };
        img.onerror=function(){
          URL.revokeObjectURL(url);
          readFileAsBase64(file,'photo').then(resolve).catch(reject);
        };
        img.src=url;
      }
      if(typeof createImageBitmap==='function'){
        createImageBitmap(file).then(function(bmp){
          finishCanvas(bmp.width,bmp.height,function(ctx,w,h){
            ctx.drawImage(bmp,0,0,w,h);
            try{ if(bmp.close) bmp.close(); }catch(e){}
          });
        }).catch(function(){ viaImage(); });
        return;
      }
      viaImage();
    });
  }
  function preserveLocalPhotos(serverPhotos){
    var local=STATE.completionPhotos||[];
    return (serverPhotos||[]).slice(0,OJT_MAX_PHOTOS).map(function(p,i){
      var hit=local.find(function(x){return x.id===p.id;})||local[i];
      if(hit&&hit.base64&&hit.base64!=='__stored__') return hit;
      return p;
    });
  }
  function dataUrlToPhotoInfo(dataUrl,name){
    var i=String(dataUrl||'').indexOf('base64,');
    if(i<0) return null;
    var base64=dataUrl.slice(i+7);
    if(!base64) return null;
    if(base64.length>950000) return null;
    return {name:name||'selfie.jpg',type:'image/jpeg',base64:base64};
  }
  function ojtCamApplyPreview(){
    var video=$('ojtCamVideo');
    if(!video) return;
    var parts=[];
    if(OJT_CAM_ROT) parts.push('rotate('+OJT_CAM_ROT+'deg)');
    if(OJT_CAM_FACING==='user') parts.push('scaleX(-1)');
    video.style.transform=parts.length?parts.join(' '):'none';
    var top=$('ojtCamTop');
    if(top){
      top.textContent=OJT_CAM_FACING==='user'
        ? '📷 Selfie (front camera) — tap Rotate if sideways, then Capture'
        : '📷 Back camera — tap Rotate if needed, then Capture';
    }
  }
  function ojtCamStartStream(){
    var modal=$('ojtCamModal'), video=$('ojtCamVideo');
    if(!modal||!video||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
      return Promise.reject(new Error('Camera not available'));
    }
    if(OJT_CAM_STREAM){ OJT_CAM_STREAM.getTracks().forEach(function(t){t.stop();}); OJT_CAM_STREAM=null; }
    if(video) video.srcObject=null;
    modal.classList.remove('hidden');
    ojtCamApplyPreview();
    var facing=OJT_CAM_FACING==='environment'?{ideal:'environment'}:{ideal:'user'};
    return navigator.mediaDevices.getUserMedia({video:{facingMode:facing,width:{ideal:1280},height:{ideal:720}},audio:false}).then(function(stream){
      OJT_CAM_STREAM=stream;
      video.srcObject=stream;
      return video.play().catch(function(){});
    });
  }
  function ojtCamClose(){
    var modal=$('ojtCamModal'), video=$('ojtCamVideo');
    if(OJT_CAM_STREAM){ OJT_CAM_STREAM.getTracks().forEach(function(t){t.stop();}); OJT_CAM_STREAM=null; }
    if(video){ video.srcObject=null; video.style.transform='none'; }
    if(modal) modal.classList.add('hidden');
    OJT_CAM_FACING='user';
    OJT_CAM_ROT=0;
  }
  function ojtCamOpen(){
    if((STATE.completionPhotos||[]).length>=OJT_MAX_PHOTOS){
      trainingToast('Maximum '+OJT_MAX_PHOTOS+' photos allowed.');
      return;
    }
    OJT_CAM_FACING='user';
    OJT_CAM_ROT=0;
    ojtCamStartStream().catch(function(){
      ojtCamClose();
      var inp=$('rPhotoCam');
      if(inp){ inp.value=''; inp.click(); }
      else trainingToast('Could not open camera. Allow camera permission, or use Upload from gallery.');
    });
  }
  function ojtCamRotate(){
    OJT_CAM_ROT=(OJT_CAM_ROT+90)%360;
    ojtCamApplyPreview();
    trainingToast('Rotated '+OJT_CAM_ROT+'°');
  }
  function ojtCamFlip(){
    OJT_CAM_FACING=OJT_CAM_FACING==='user'?'environment':'user';
    ojtCamStartStream().catch(function(){
      trainingToast('Could not switch camera — try again.');
    });
  }
  function ojtCamSnap(){
    var video=$('ojtCamVideo'), canvas=$('ojtCamCanvas');
    if(!video||!canvas||!video.videoWidth){
      trainingToast('Camera not ready — wait a second and tap Capture again.');
      return;
    }
    if((STATE.completionPhotos||[]).length>=OJT_MAX_PHOTOS){
      trainingToast('Maximum '+OJT_MAX_PHOTOS+' photos allowed.');
      ojtCamClose();
      return;
    }
    var vw=video.videoWidth, vh=video.videoHeight, rot=OJT_CAM_ROT, mirror=OJT_CAM_FACING==='user';
    var natW=rot===90||rot===270?vh:vw;
    var natH=rot===90||rot===270?vw:vh;
    var scale=1, mx=1280;
    if(natW>mx) scale=mx/natW;
    var cw=Math.max(1,Math.round(natW*scale));
    var ch=Math.max(1,Math.round(natH*scale));
    canvas.width=cw; canvas.height=ch;
    var ctx=canvas.getContext('2d');
    if(!ctx){ trainingToast('Could not capture photo.'); return; }
    ctx.save();
    ctx.translate(cw/2,ch/2);
    ctx.rotate(rot*Math.PI/180);
    if(mirror) ctx.scale(-1,1);
    var drawW=vw*scale, drawH=vh*scale;
    ctx.drawImage(video,-drawW/2,-drawH/2,drawW,drawH);
    ctx.restore();
    var info=dataUrlToPhotoInfo(canvas.toDataURL('image/jpeg',0.82),(OJT_CAM_FACING==='user'?'selfie':'training')+'.jpg');
    ojtCamClose();
    if(!info){ trainingToast('Could not capture photo — try Upload from gallery.'); return; }
    if(window.OJT_GALLERY&&window.OJT_GALLERY.add){
      window.OJT_GALLERY.add(info);
      STATE.completionPhotos=window.OJT_GALLERY.list();
    } else {
      STATE.completionPhotos.push({
        id:'ph'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),
        name:info.name,
        type:info.type,
        base64:info.base64
      });
      renderPhotoGrid();
      trainingToast('Photo added ('+(STATE.completionPhotos||[]).length+' of '+OJT_MAX_PHOTOS+').');
    }
  }
  function ojtPhotoSelfie(){
    if((STATE.completionPhotos||[]).length>=OJT_MAX_PHOTOS){
      trainingToast('Maximum '+OJT_MAX_PHOTOS+' photos allowed.');
      return;
    }
    if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){ ojtCamOpen(); return; }
    var inp=$('rPhotoCam');
    if(inp){ inp.value=''; inp.click(); return; }
    trainingToast('Camera not available — use Upload from gallery.');
  }
  function showGalleryInput(on){
    var dock=$('ojtGalDock');
    if(dock&&on){
      try{ dock.scrollIntoView({block:'nearest',behavior:'smooth'}); }catch(e){}
    }
  }
  function ojtPhotoGallery(){
    showGalleryInput(true);
  }
  function ojtPhotoFromInput(inp){
    if(!inp||!inp.files||!inp.files.length) return;
    var files=inp.files;
    inp.value='';
    addPhotosFromFiles(files).catch(function(e){ trainingToast(e&&e.message?e.message:'Could not add photo'); });
  }
  function removeCompletionPhoto(id){
    if(!id) return;
    STATE.completionPhotos=(STATE.completionPhotos||[]).filter(function(p){return p.id!==id;});
    renderPhotoGrid();
    var rp=$('completionReviewPhotos');
    if(rp && $('completionReview') && !$('completionReview').classList.contains('hidden')){
      showCompletionReview();
    }
    trainingToast('Photo deleted. You can add another from gallery or camera.');
  }
  function photoCardHtml(p,i,wide){
    var w=wide?140:132;
    var img=p.base64&&p.base64!=='__stored__'
      ? '<img src="data:'+esc(p.type||'image/jpeg')+';base64,'+p.base64+'" alt="Photo '+(i+1)+'" style="width:100%;height:100%;object-fit:cover;display:block">'
      : '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:12px;color:#94a3b8;padding:8px;text-align:center">Saved photo '+(i+1)+'</div>';
    return '<div style="width:'+w+'px;border:1px solid rgba(201,168,76,.4);border-radius:10px;overflow:hidden;background:#0b1220">'+
      '<div style="height:120px;background:#111a30">'+img+'</div>'+
      '<div style="padding:8px;display:flex;flex-direction:column;gap:6px">'+
      '<span class="muted" style="font-size:12px">Photo '+(i+1)+'</span>'+
      '<button type="button" class="btn" data-rm-photo="'+esc(p.id)+'" style="width:100%;min-height:44px;padding:8px 10px;font-size:15px;font-weight:800;background:#b91c1c;color:#fff;border:1px solid #fecaca">Delete</button>'+
      '</div></div>';
  }
  function bindPhotoDelete(root){
    if(!root) return;
    root.querySelectorAll('[data-rm-photo]').forEach(function(btn){
      btn.onclick=function(){ removeCompletionPhoto(btn.getAttribute('data-rm-photo')); };
    });
  }
  function renderPhotoGrid(){
    var grid=$('rPhotoGrid');
    var meta=$('rPhotoMeta');
    if(!grid)return;
    var list=STATE.completionPhotos||[];
    grid.innerHTML=list.map(function(p,i){ return photoCardHtml(p,i,false); }).join('');
    bindPhotoDelete(grid);
    if(meta) meta.textContent=list.length+' of '+OJT_MAX_PHOTOS+' photos — tap Delete to remove';
  }
  function addPhotosFromFiles(fileList){
    var files=Array.prototype.slice.call(fileList||[]).filter(Boolean);
    if(!files.length){ trainingToast('No picture came through — tap Upload from gallery or use Pick from phone album.'); return Promise.resolve(); }
    var room=OJT_MAX_PHOTOS-(STATE.completionPhotos||[]).length;
    if(room<=0){ trainingToast('Maximum '+OJT_MAX_PHOTOS+' photos allowed.'); return Promise.resolve(); }
    if(files.length>room){
      trainingToast('Only '+room+' more photo(s) can be added (max '+OJT_MAX_PHOTOS+').');
      files=files.slice(0,room);
    }
    return Promise.all(files.map(function(f){ return compressImageFile(f); })).then(function(infos){
      var added=0;
      infos.forEach(function(info){
        if(!info||!info.base64)return;
        STATE.completionPhotos.push({
          id:'ph'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),
          name:info.name||('photo.jpg'),
          type:info.type||'image/jpeg',
          base64:info.base64
        });
        added++;
      });
      renderPhotoGrid();
      if(added) trainingToast('Photo added ('+(STATE.completionPhotos||[]).length+' of '+OJT_MAX_PHOTOS+').');
    });
  }
  function readCompletionPayload(fileInfo){
    if(window.OJT_GALLERY&&window.OJT_GALLERY.list) STATE.completionPhotos=window.OJT_GALLERY.list();
    var payload={
      sessionId:STATE.selectedId,
      reportDate:$('rDate').value,
      topicsCovered:$('rTopics').value,
      sanctionedStrength:$('rSan').value,
      attendanceCount:$('rAttCount').value,
      attendanceNames:$('rAttNames').value,
      operationsStaffNames:$('rOpsStaff').value,
      feedback:$('rFeedback').value,
      marksFileBase64:'__stored__',
      completionPhotos:(STATE.completionPhotos||[]).slice(0,OJT_MAX_PHOTOS).map(function(p){
        return { id:p.id, name:p.name, type:p.type, base64:p.base64||'__stored__' };
      })
    };
    if(fileInfo&&fileInfo.base64){
      payload.marksFileName=fileInfo.name;
      payload.marksFileType=fileInfo.type;
      payload.marksFileBase64=fileInfo.base64;
    }
    return payload;
  }
  function readSecurityPayload(){
    return {
      sessionId:STATE.selectedId,
      turnoutRating:$('iTurnout').value,
      turnoutReason:$('iTurnoutReason').value,
      idCardValidity:$('iIdValid').value,
      idCardReason:$('iIdReason').value,
      recordKeeping:$('iRecord').value,
      recordKeepingReason:$('iRecordReason').value,
      omPreviousVisitDate:$('iOmDate').value,
      previousNightCheckDate:$('iNightDate').value,
      otherAbnormality:$('iAbnormal').value,
      informationGathering:$('iInfoGather').value
    };
  }
  function showCompletionReview(){
    var r=STATE.report||{};
    var s=STATE.session||{};
    var photos=STATE.completionPhotos||[];
    var lines=[
      'Date: '+($('rDate').value||r.reportDate||s.trainingDate||'—'),
      'Client: '+(s.clientName||'—'),
      'Topics covered:\\n'+($('rTopics').value||r.topicsCovered||s.topics||'—'),
      'Sanctioned strength: '+($('rSan').value||r.sanctionedStrength||'—'),
      'Attended count: '+($('rAttCount').value||r.attendanceCount||'—'),
      'Attended list:\\n'+($('rAttNames').value||r.attendanceNames||'—'),
      'Training photo: '+(photos.length?'Attached ('+photos.length+')':'—'),
      'Guards attendance: '+(($('rAttNames').value||r.attendanceNames||$('rAttCount').value||r.attendanceCount)?'Attached':'—'),
      'Post Training marks: '+(STATE.marksFile&&STATE.marksFile.name?('Attached — '+STATE.marksFile.name):(r.marksFileName?('Attached — '+r.marksFileName):'—')),
      'OM reported: '+($('rOpsStaff').value||r.operationsStaffNames||s.trainerName||'—'),
      'Client feedback (our record): '+(r.clientOjtBenefitRating
        ? (r.clientOjtBenefitRating+(r.clientOjtBenefitBy?(' — '+r.clientOjtBenefitBy):'')+(r.clientOjtBenefitAt?(' · '+String(r.clientOjtBenefitAt).slice(0,16).replace('T',' ')):'') )
        : 'Pending (Give feedback link on Share email)'),
      'Feedback:\\n'+($('rFeedback').value||r.feedback||'—')
    ];
    $('completionReviewBody').textContent=lines.join('\\n\\n');
    var rp=$('completionReviewPhotos');
    if(rp){
      rp.innerHTML=photos.map(function(p,i){ return photoCardHtml(p,i,true); }).join('');
      bindPhotoDelete(rp);
    }
    showCompletionMode('review');
  }
  function openCompletionPreview(){
    if(!STATE.selectedId){ trainingToast('Select a session first.'); return; }
    var file=$('rMarksFile')&&$('rMarksFile').files&&$('rMarksFile').files[0];
    return readFileAsBase64(file,'marks').then(function(info){
      if(info) STATE.marksFile=info;
      var payload=readCompletionPayload(info||STATE.marksFile);
      return api('previewCompletion',{sessionId:STATE.selectedId, report:payload});
    }).then(function(j){
      if(!j.html){ trainingToast('Completion preview was empty. Please save and try again.'); return; }
      var doc=buildPreviewDoc(j.html, j.subject||'OJT Completion Preview');
      try{
        var blob=new Blob([doc],{type:'text/html'});
        var url=URL.createObjectURL(blob);
        var w=window.open(url,'_blank');
        if(!w){ trainingToast('Please allow pop-ups to preview the completion report.'); return; }
        setTimeout(function(){ try{ URL.revokeObjectURL(url); }catch(e){} }, 120000);
      }catch(e){
        trainingToast('Could not open completion preview window.');
      }
    }).catch(function(e){ trainingToast(e&&e.message?e.message:'Could not preview report.'); });
  }
  function showSecurityReview(){
    var turnout=$('iTurnout').value;
    var idv=$('iIdValid').value;
    var rec=$('iRecord').value;
    var lines=[
      '1. Turnout of guards: '+ratingText(turnout)+(turnout==='ToBeImproved'?'\\nReason: '+($('iTurnoutReason').value||'—'):''),
      '2. ID card validity: '+idText(idv)+(idv==='ToBeCorrected'?'\\nReason: '+($('iIdReason').value||'—'):''),
      '3. Record keeping: '+ratingText(rec)+(rec==='ToBeImproved'?'\\nReason: '+($('iRecordReason').value||'—'):''),
      '4. OM previous visit date: '+($('iOmDate').value||'—'),
      '5. Previous night check date: '+($('iNightDate').value||'—'),
      '6. Any other abnormality observed:\\n'+($('iAbnormal').value||'—'),
      '7. Information gathering:\\n'+($('iInfoGather').value||'—')
    ];
    $('securityReviewBody').textContent=lines.join('\\n\\n');
    showSecurityMode('review');
  }
  function saveCompletionThen(next){
    if(!STATE.selectedId){trainingToast('Select a session first.');return Promise.reject();}
    var file=$('rMarksFile')&&$('rMarksFile').files&&$('rMarksFile').files[0];
    return readFileAsBase64(file,'marks').then(function(info){
      if(info) STATE.marksFile=info;
      return api('saveReport',{section:'completion', report:readCompletionPayload(info||STATE.marksFile)});
    }).then(function(j){
      STATE.report=j.report;
      if(j.report&&Array.isArray(j.report.completionPhotos)){
        STATE.completionPhotos=preserveLocalPhotos(j.report.completionPhotos);
        renderPhotoGrid();
      }
      trainingToast('Completion report saved.');
      if(typeof next==='function') next();
    });
  }
  function saveSecurityThen(next){
    if(!STATE.selectedId){trainingToast('Select a session first.');return Promise.reject();}
    return api('saveReport',{section:'security', report:readSecurityPayload()}).then(function(j){
      STATE.report=j.report;
      trainingToast('Security Observations saved.');
      if(typeof next==='function') next();
    });
  }
  function pctBar(pct, tone){
    var w=Math.max(0,Math.min(100,Number(pct)||0));
    var t=tone?(' tone-'+tone):'';
    return '<div class="days-bar'+t+'" title="'+w+'%"><i style="width:'+w+'%"></i></div>';
  }
  function trackPill(label){
    var t=String(label||'');
    var cls='muted';
    if(t==='Completed') cls='done';
    else if(t==='Overdue') cls='bad';
    else if(t==='Reminder sent'||t==='WhatsApp sent') cls='warn';
    else if(t==='Assigned'||t==='Form shared') cls='info';
    return '<span class="track-pill '+cls+'">'+esc(t||'—')+'</span>';
  }
  function renderSecObsClosureFiles(){
    var el=$('secObsClosureFileList');
    if(!el) return;
    var list=STATE.secObsClosureFiles||[];
    if(!list.length){ el.textContent='No evidence files selected yet.'; return; }
    el.innerHTML=list.map(function(f,i){
      return '<div style="display:flex;gap:8px;align-items:center;margin:4px 0"><span>'+esc(f.name||('File '+(i+1)))+'</span>'+
        '<button type="button" class="btn danger" data-rm-ev="'+esc(f.id)+'" style="padding:4px 8px;font-size:11px">Remove</button></div>';
    }).join('');
    el.querySelectorAll('[data-rm-ev]').forEach(function(btn){
      btn.addEventListener('click',function(){
        var id=btn.getAttribute('data-rm-ev');
        STATE.secObsClosureFiles=(STATE.secObsClosureFiles||[]).filter(function(f){return f.id!==id;});
        renderSecObsClosureFiles();
      });
    });
  }
  function openSecObsClosure(row){
    STATE.secObsRow=row||null;
    STATE.selectedId=row&&row.sessionId||'';
    var obsBranch=row&&row.branchId?row.branchId:effectiveBranchId();
    if(obsBranch){ STATE.workBranchId=obsBranch; }
    STATE.secObsClosureFiles=[];
    var panel=$('secObsClosurePanel');
    if(panel) panel.classList.remove('hidden');
    if($('secObsClosureMeta')){
      $('secObsClosureMeta').innerHTML='<b>'+esc(row.clientName||'')+'</b> · '+esc(row.trainingDate||'')+
        ' · '+esc(row.branchName||'')+' · Assigned: '+esc(row.assignedTo||'—');
    }
    if($('secObsClosureDate')) $('secObsClosureDate').value=todayYmd();
    if($('secObsClosureText')) $('secObsClosureText').value='';
    if($('secObsClosureFiles')) $('secObsClosureFiles').value='';
    var done=$('secObsClosureDone');
    if(done) done.classList.toggle('hidden', row.completed!=='Yes');
    if($('btnSecObsClosureSubmit')) $('btnSecObsClosureSubmit').disabled=row.completed==='Yes';
    renderSecObsClosureFiles();
    api('getReport',{
      sessionId:STATE.selectedId,
      branchId:obsBranch,
      workBranchId:obsBranch,
      trainingDate:row.trainingDate||'',
      month:(row.trainingDate||'').slice(0,7)||STATE.month
    }).then(function(j){
      STATE.report=j.report||null;
      STATE.session=j.session||null;
      var r=j.report||{};
      if(r.securityObsClosureDate && $('secObsClosureDate')) $('secObsClosureDate').value=r.securityObsClosureDate;
      if(r.securityObsClosureText && $('secObsClosureText')) $('secObsClosureText').value=r.securityObsClosureText;
      if(r.securityObsClosureSubmittedAt){
        if(done) done.classList.remove('hidden');
        if($('btnSecObsClosureSubmit')) $('btnSecObsClosureSubmit').disabled=true;
      }
      if(Array.isArray(r.securityObsClosureFiles)){
        STATE.secObsClosureFiles=r.securityObsClosureFiles.map(function(f,i){
          return { id:f.id||('ev'+i), name:f.name||('File '+(i+1)), type:f.type||'', base64:f.base64||'__stored__' };
        });
        renderSecObsClosureFiles();
      }
      trainingToast(row.completed==='Yes'?'Observation report opened.':'Completion report ready — fill and submit when done.');
    }).catch(function(e){
      trainingToast(e.message||'Could not open observation report.');
    });
    if(panel) panel.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function submitSecObsClosure(){
    if(!STATE.selectedId){ trainingToast('Open a Security Observation first.'); return; }
    var date=($('secObsClosureDate')&&$('secObsClosureDate').value)||'';
    var text=(($('secObsClosureText')&&$('secObsClosureText').value)||'').trim();
    if(!date){ trainingToast('Please enter the Date of completion.'); return; }
    if(!text){ trainingToast('Please enter the Completion report text.'); return; }
    var files=STATE.secObsClosureFiles||[];
    if(!files.length){ trainingToast('Please upload at least one evidence document.'); return; }
    var btn=$('btnSecObsClosureSubmit');
    if(btn){ btn.disabled=true; btn.textContent='Submitting…'; }
    var obsBranch=(STATE.secObsRow&&STATE.secObsRow.branchId)||effectiveBranchId();
    api('submitSecObsClosure',{
      sessionId:STATE.selectedId,
      branchId:obsBranch,
      workBranchId:obsBranch,
      trainingDate:(STATE.secObsRow&&STATE.secObsRow.trainingDate)||'',
      month:((STATE.secObsRow&&STATE.secObsRow.trainingDate)||STATE.month||'').slice(0,7),
      closureDate:date,
      closureText:text,
      files:files.map(function(f){ return { id:f.id, name:f.name, type:f.type, base64:f.base64 }; })
    }).then(function(){
      trainingToast('Completion report submitted — list shows Completed.');
      if($('secObsClosureDone')) $('secObsClosureDone').classList.remove('hidden');
      if(btn){ btn.disabled=true; btn.textContent='Submit Completion Report'; }
      return loadDashboard();
    }).catch(function(e){
      if(btn){ btn.disabled=false; btn.textContent='Submit Completion Report'; }
      trainingToast(e.message||'Could not submit.');
    });
  }
  function renderSecObs(list, summary){
    var sum=summary||{received:0,resolved:0,balance:0};
    var canRemind=!!(STATE.dash&&STATE.dash.canSecObsRemind)||STATE.role==='management';
    var canReopen=!!(STATE.dash&&STATE.dash.canSecObsReopen)||STATE.role==='management';
    if($('secObsBanners')){
      $('secObsBanners').innerHTML=
        '<div class="stat"><b>'+(sum.received||0)+'</b><span>Security Observations received</span></div>'+
        '<div class="stat"><b>'+(sum.resolved||0)+'</b><span>Completed</span></div>'+
        '<div class="stat"><b>'+(sum.balance||0)+'</b><span>Balance open</span></div>';
    }
    $('secObsBody').innerHTML=(list||[]).map(function(x){
      var days=x.pendingDays==null?'—':(String(x.pendingDays)+'d');
      var tone=x.timeBarTone||(x.completed==='Yes'?'done':((x.pendingDays||0)>=7?'danger':(x.pendingDays||0)>=3?'warn':'ok'));
      var pct=x.timeBarPct!=null?x.timeBarPct:Math.min(100,(x.pendingDays||0)*(100/7));
      var bar=pctBar(pct, tone)+'<div class="muted" style="font-size:.72rem;margin-top:3px">'+(x.completed==='Yes'?'Closed':('Open '+esc(days)+' · SLA 7d'))+'</div>';
      var assigned=esc(x.assignedTo||'—')+(x.assignedEmail?'<br><span class="muted">'+esc(x.assignedEmail)+'</span>':'');
      var track=trackPill(x.tracking||(x.completed==='Yes'?'Completed':'Awaiting form'));
      if(x.trackingDetail) track+='<div class="muted" style="font-size:.7rem;margin-top:3px">'+esc(x.trackingDetail)+'</div>';
      var acts='<div class="sec-obs-actions">';
      acts+='<button type="button" class="btn" data-sec-open="'+esc(x.sessionId)+'" data-bid="'+esc(x.branchId)+'">'+(x.completed==='Yes'?'View report':'Completion report')+'</button>';
      if(x.completed!=='Yes'){
        acts+='<button type="button" class="btn ghost" data-sec-wa="'+esc(x.sessionId)+'" data-bid="'+esc(x.branchId)+'">WhatsApp</button>';
      }
      if(canRemind && x.completed!=='Yes'){
        acts+='<button type="button" class="btn primary" data-sec-remind="'+esc(x.sessionId)+'" data-bid="'+esc(x.branchId)+'">Reminder</button>';
      }
      if(canReopen && x.completed==='Yes'){
        acts+='<button type="button" class="btn danger" data-sec-reopen="'+esc(x.sessionId)+'" data-bid="'+esc(x.branchId)+'">Reopen</button>';
      }
      if(canPurgeTests()){
        acts+='<button type="button" class="btn danger" data-sec-del-both="'+esc(x.sessionId)+'" data-bid="'+esc(x.branchId)+'" data-date="'+esc(x.trainingDate||'')+'">Delete both</button>';
      }
      acts+='</div>';
      return '<tr><td>'+esc(x.branchName||'')+'</td><td>'+esc(x.trainingDate)+'</td><td>'+esc(x.clientName)+'</td><td style="min-width:120px">'+bar+'</td><td>'+assigned+'</td><td>'+track+'</td><td>'+acts+'</td></tr>';
    }).join('')||'<tr><td colspan="7" class="muted">No observations in this period.</td></tr>';
    function rowOf(sid){
      return (list||[]).find(function(x){return x.sessionId===sid;})||null;
    }
    $('secObsBody').querySelectorAll('[data-sec-open]').forEach(function(b){
      b.addEventListener('click',function(){
        var sid=b.getAttribute('data-sec-open');
        var bid=b.getAttribute('data-bid');
        var row=rowOf(sid)||{sessionId:sid,branchId:bid,clientName:'',trainingDate:'',branchName:'',assignedTo:'',completed:'No'};
        openSecObsClosure(row);
      });
    });
    $('secObsBody').querySelectorAll('[data-sec-wa]').forEach(function(b){
      b.addEventListener('click',function(){
        var sid=b.getAttribute('data-sec-wa');
        var bid=b.getAttribute('data-bid');
        if(!confirm('Send WhatsApp to the assigned staff for this Security Observation?')) return;
        b.disabled=true;
        api('secObsWhatsApp',{sessionId:sid,branchId:bid,workBranchId:bid}).then(function(j){
          trainingToast(j.message||'WhatsApp sent.');
          return loadDashboard();
        }).catch(function(e){
          b.disabled=false;
          trainingToast(e.message||'WhatsApp failed.');
        });
      });
    });
    $('secObsBody').querySelectorAll('[data-sec-remind]').forEach(function(b){
      b.addEventListener('click',function(){
        var sid=b.getAttribute('data-sec-remind');
        var bid=b.getAttribute('data-bid');
        if(!confirm('Send management Reminder (email + WhatsApp) to assigned staff?')) return;
        b.disabled=true;
        api('secObsReminder',{sessionId:sid,branchId:bid,workBranchId:bid}).then(function(j){
          trainingToast(j.message||'Reminder sent.');
          return loadDashboard();
        }).catch(function(e){
          b.disabled=false;
          trainingToast(e.message||'Reminder failed.');
        });
      });
    });
    $('secObsBody').querySelectorAll('[data-sec-reopen]').forEach(function(b){
      b.addEventListener('click',function(){
        var sid=b.getAttribute('data-sec-reopen');
        var bid=b.getAttribute('data-bid');
        if(!confirm('Reopen this observation? The completion report will be cleared so the branch can submit again.')) return;
        b.disabled=true;
        api('secObsReopen',{sessionId:sid,branchId:bid,workBranchId:bid}).then(function(j){
          trainingToast(j.message||'Reopened.');
          return loadDashboard();
        }).catch(function(e){
          b.disabled=false;
          trainingToast(e.message||'Could not reopen.');
        });
      });
    });
    $('secObsBody').querySelectorAll('[data-sec-del-both]').forEach(function(b){
      b.addEventListener('click',function(){
        purgeTestBoth(b.getAttribute('data-sec-del-both'), b.getAttribute('data-bid'), b.getAttribute('data-date'), b);
      });
    });
  }
  function dashPayload(){
    var from=($('dashFrom')&&$('dashFrom').value)||(STATE.month+'-01');
    var to=($('dashTo')&&$('dashTo').value)||todayYmd();
    STATE.month=(from||to).slice(0,7);
    var filter=($('branchPickDash')&&$('branchPickDash').value)||'training-dept';
    var secBr=($('secObsBranch')&&$('secObsBranch').value)||'all';
    if(STATE.tab==='secObsList'){
      from=($('secObsFrom')&&$('secObsFrom').value)||from;
      to=($('secObsTo')&&$('secObsTo').value)||to;
    }
    return { fromDate:from, toDate:to, filterBranchId:filter, secObsBranchId:secBr, month:STATE.month, branchId:effectiveBranchId() };
  }
  function loadDashboard(){
    var extra=dashPayload();
    api('dashboard', extra).then(function(j){
      STATE.dash=j;
      if(j.questionSubjects) STATE.questionSubjects=j.questionSubjects;
      if(j.trainingDeptBranches) STATE.trainingDeptBranches=j.trainingDeptBranches;
      var s=j.stats||{};
      var slaSched=0, slaTot=0;
      (j.branchKpis||[]).forEach(function(k){ slaSched+=k.slaScheduled||0; slaTot+=k.slaTotal||0; });
      var slaPct=slaTot>0?Math.round((slaSched/slaTot)*1000)/10:0;
      $('dashStats').innerHTML=
        '<div class="stat"><b>'+esc(s.trainingCompletedLabel||'0/0')+'</b><span>Training completed / total sites</span>'+pctBar(s.trainingCompletedPct)+'</div>'+
        '<div class="stat"><b>'+slaSched+'/'+slaTot+'</b><span>SLA units — schedule / total sites</span>'+pctBar(slaPct)+'</div>'+
        '<div class="stat"><b>'+esc(s.unitsTrainedLabel||'0/0')+'</b><span>No. of units trained / total units</span>'+pctBar(s.unitsTrainedPct)+'</div>'+
        '<div class="stat"><b>'+(s.guardsTrained||0)+'/'+(s.sanctionedPosts||0)+'</b><span>Total guards trained / sanctioned posts</span>'+pctBar(s.trainedGuardsPct)+'</div>'+
        '<div class="stat"><b>'+(s.trainedGuardsPct||0)+'%</b><span>Trained guards %</span></div>'+
        '<div class="stat"><b>'+(s.unitsTrainedPct||0)+'%</b><span>Units trained %</span></div>'+
        '<div class="stat"><b>'+(s.balanceSchedule||0)+'</b><span>Balance schedule to be conducted</span></div>';
      $('dashBranchBody').innerHTML=(j.branchKpis||[]).map(function(k){
        return '<tr><td>'+esc(k.branchName)+'</td><td>'+esc(k.trainingCompletedLabel)+' ('+k.trainingCompletedPct+'%)</td><td>'+esc(k.slaScheduleLabel)+'</td><td>'+k.guardsTrained+'/'+k.sanctionedPosts+' ('+k.trainedGuardsPct+'%)</td><td>'+k.unitsTrainedPct+'%</td><td>'+k.balanceSchedule+'</td></tr>';
      }).join('')||'<tr><td colspan="6" class="muted">No branch data.</td></tr>';
      renderSecObs(j.secObs||[], j.secObsSummary||{});
      if(j.role) STATE.role=j.role;
      if(j.trainingDeptManager!=null) STATE.trainingDeptManager=!!j.trainingDeptManager;
      if(STATE.role==='management'||STATE.trainingDeptManager){
        if($('branchPickWrapDash')) $('branchPickWrapDash').classList.remove('hidden');
        if($('secObsBranchWrap')) $('secObsBranchWrap').classList.remove('hidden');
        var sel=$('branchPickDash');
        if(sel){
          var cur=sel.value||'training-dept';
          var opts='<option value="training-dept">Training Department (Hyd-A / Hyd-B / Hi-Tech)</option>';
          if(STATE.role==='management') opts+='<option value="all">All Branches</option>';
          (j.allBranches||j.branches||[]).forEach(function(b){
            if(b.isTrainingDepartment) return;
            opts+='<option value="'+b.id+'">'+esc(b.name)+'</option>';
          });
          sel.innerHTML=opts;
          if(Array.prototype.some.call(sel.options,function(o){return o.value===cur;})) sel.value=cur;
        }
        var secSel=$('secObsBranch');
        if(secSel){
          var scur=secSel.value||'all';
          var sopts='<option value="all">All Branches</option>';
          (j.allBranches||j.trainingDeptBranches||[]).forEach(function(b){
            sopts+='<option value="'+b.id+'">'+esc(b.name)+'</option>';
          });
          secSel.innerHTML=sopts;
          if(Array.prototype.some.call(secSel.options,function(o){return o.value===scur;})) secSel.value=scur;
        }
      }
    }).catch(function(e){trainingToast(e.message);});
  }
  function loadExtras(kind, listId){
    api('listExtras',{kind:kind}).then(function(j){
      var el=$(listId); if(!el) return;
      el.innerHTML=(j.extras||[]).map(function(e){
        return '<div class="panel" style="margin:8px 0;padding:12px"><b>'+esc(e.title||e.clientName||kind)+'</b> · <span class="muted">'+esc(e.trainingDate)+'</span>'+(e.score?' · Score '+esc(e.score):'')+'<pre style="white-space:pre-wrap;margin-top:8px;font:inherit">'+esc(e.body)+'</pre></div>';
      }).join('')||'<p class="muted">Nothing saved yet.</p>';
    }).catch(function(e){trainingToast(e.message);});
  }
  function saveExtraForm(kind, fields, listId){
    var title=fields.title?$(fields.title).value:'';
    if(fields.subject && $(fields.subject)) title=($(fields.subject).value||'')+(title?(' — '+title):'');
    var clientEl=fields.client?$(fields.client):null;
    var clientName=clientEl?(clientEl.value||'').trim():'';
    if(clientEl&&clientEl.tagName==='SELECT'&&!clientName){
      trainingToast('Select the client name from the list.');
      return;
    }
    var entry={
      kind:kind,
      branchId:effectiveBranchId(),
      trainingDate:$(fields.date).value||todayYmd(),
      clientName:clientName,
      title:title||clientName||(fields.subject&&$(fields.subject)?$(fields.subject).value:''),
      body:$(fields.body).value||'',
      score:fields.score&&$(fields.score)?$(fields.score).value:''
    };
    api('saveExtra',{entry:entry, month:(entry.trainingDate||'').slice(0,7)||STATE.month, branchId:effectiveBranchId()}).then(function(){
      trainingToast('Saved.');
      loadExtras(kind, listId);
    }).catch(function(e){trainingToast(e.message);});
  }
  function loadFeedbackViews(){
    api('dashboard').then(function(j){
      return api('listExtras',{}).then(function(ex){
        var reports=[];
        return Promise.all((STATE.sessions||[]).map(function(s){
          return api('getReport',{sessionId:s.id}).then(function(r){
            if(r.report && (r.report.feedback||r.report.guardFeedback||r.report.clientFeedback)){
              reports.push({s:s, r:r.report});
            }
          }).catch(function(){});
        })).then(function(){
          var extras=ex.extras||[];
          var guard=extras.filter(function(e){return e.kind==='feedbackGuard';}).length;
          var client=extras.filter(function(e){return e.kind==='feedbackClient';}).length;
          $('fbAnalysisBody').innerHTML=
            '<div class="kpi-grid">'+
            '<div class="stat"><b>'+reports.length+'</b><span>Completion feedbacks</span></div>'+
            '<div class="stat"><b>'+guard+'</b><span>Guard feedback forms</span></div>'+
            '<div class="stat"><b>'+client+'</b><span>Client feedback forms</span></div>'+
            '</div>'+
            '<p class="muted">Use <b>Guard feedback format</b> and <b>Client feedback format</b> after every OJT.</p>';
        });
      });
    }).catch(function(e){trainingToast(e.message);});
  }
  function buildGuardFeedbackBody(){
    var lines=[
      'AGILE OJT — GUARD FEEDBACK',
      'Guard name: '+(($('exFgGuardName').value||'').trim()||'—'),
      '1. Training was useful? '+(($('exFgQ1').value||'—')),
      '2. Trainer explained clearly? '+(($('exFgQ2').value||'—')),
      '3. Topics easy to understand? '+(($('exFgQ3').value||'—')),
      '4. Will use this on duty? '+(($('exFgQ4').value||'—')),
      '5. Overall rating: '+(($('exFgQ5').value||'—')),
      '6. Suggestion: '+(($('exFgQ6').value||'').trim()||'—')
    ];
    return lines.join('\\n');
  }
  function buildClientFeedbackBody(){
    var lines=[
      'AGILE OJT — CLIENT FEEDBACK',
      'Client person: '+(($('exFcPerson').value||'').trim()||'—'),
      'Overall, how was the OJT beneficial to our security operations? '+(($('exFcBenefit').value||'—')),
      '1. Training done as scheduled? '+(($('exFcQ1').value||'—')),
      '2. Topics useful for your site? '+(($('exFcQ2').value||'—')),
      '3. Trainer professionalism: '+(($('exFcQ3').value||'—')),
      '4. Guards attention / participation: '+(($('exFcQ4').value||'—')),
      '5. Overall satisfaction: '+(($('exFcQ5').value||'—')),
      '6. Topic to add next time: '+(($('exFcQ6').value||'').trim()||'—'),
      '7. Remarks: '+(($('exFcQ7').value||'').trim()||'—')
    ];
    return lines.join('\\n');
  }
  function clearGuardFeedbackForm(){
    ;['exFgGuardName','exFgQ1','exFgQ2','exFgQ3','exFgQ4','exFgQ5','exFgQ6'].forEach(function(id){ if($(id)) $(id).value=''; });
  }
  function clearClientFeedbackForm(){
    ;['exFcPerson','exFcBenefit','exFcQ1','exFcQ2','exFcQ3','exFcQ4','exFcQ5','exFcQ6','exFcQ7'].forEach(function(id){ if($(id)) $(id).value=''; });
  }
  function printFeedbackBlank(kind){
    var title=kind==='guard'?'Guard feedback format — blank':'Client feedback format — blank';
    var html=kind==='guard'
      ? '<h2>Agile OJT — Guard feedback</h2><p>Client/site: ______________ &nbsp; Date: ________ &nbsp; Guard name: ________</p>'+
        '<ol><li>Training was useful? &nbsp; Yes / Somewhat / No</li><li>Trainer explained clearly? &nbsp; Yes / Somewhat / No</li>'+
        '<li>Topics easy to understand? &nbsp; Yes / Somewhat / No</li><li>Will use this on duty? &nbsp; Yes / Somewhat / No</li>'+
        '<li>Overall rating: Excellent / Good / Average / Poor</li><li>Any suggestion: _______________________________</li></ol>'+
        '<p>Signature: ______________</p>'
      : '<h2>Agile OJT — Client feedback</h2><p>Client/site: ______________ &nbsp; Date: ________ &nbsp; Name: ________</p>'+
        '<p><b>Overall, how was the OJT beneficial to our security operations?</b><br>□ Highly Beneficial &nbsp; □ Beneficial &nbsp; □ Needs Improvement</p>'+
        '<ol><li>Training done as scheduled? &nbsp; Yes / No</li><li>Topics useful for your site? &nbsp; Yes / Somewhat / No</li>'+
        '<li>Trainer professionalism: Excellent / Good / Average / Poor</li><li>Guards attention: Excellent / Good / Average / Poor</li>'+
        '<li>Overall satisfaction: Excellent / Good / Average / Poor</li><li>Topic to add next time: ________________</li>'+
        '<li>Remarks: _______________________________________</li></ol><p>Signature / stamp: ______________</p>';
    var w=window.open('','_blank','noopener,noreferrer');
    if(!w){ trainingToast('Please allow pop-ups to print.'); return; }
    w.document.write('<!DOCTYPE html><html><head><title>'+title+'</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111;line-height:1.6}ol{line-height:2}</style></head><body>'+html+'</body></html>');
    w.document.close();
    w.focus();
    w.print();
  }
  function loadMonth(){
    return api('listMonth',{branchId:STATE.branchId, workBranchId:STATE.workBranchId}).then(function(j){
      STATE.sessions=j.sessions||[];
      STATE.clients=j.clients||[];
      STATE.branches=j.branches||[];
      STATE.trainingDeptBranches=j.trainingDeptBranches||[];
      STATE.questionSubjects=j.questionSubjects||STATE.questionSubjects||[];
      STATE.ojtTopics=j.ojtTopics||STATE.ojtTopics||[];
      STATE.role=j.role||STATE.role||'staff';
      STATE.trainingDeptManager=!!j.trainingDeptManager;
      STATE.clientScope=j.clientScope||STATE.clientScope||'branch-hod';
      STATE.branchId=j.branchId||STATE.branchId;
      STATE.workBranchId=j.workBranchId||STATE.workBranchId;
      STATE.suggestBh=j.suggestBranchHeadEmail||'';
      renderTopicManage();
      if((STATE.role==='management'||STATE.trainingDeptManager) && $('branchPickWrap') && $('branchPick')){
        $('branchPickWrap').classList.remove('hidden');
        var sel=$('branchPick');
        var cur=STATE.branchId;
        var branchOpts=STATE.branches||[];
        if(!branchOpts.length){
          sel.innerHTML='<option value="">No branches loaded — tap Reload</option>';
        } else {
          sel.innerHTML=branchOpts.map(function(b){
            return '<option value="'+b.id+'"'+(b.id===cur?' selected':'')+'>'+esc(b.name)+'</option>';
          }).join('');
          if(cur && Array.prototype.some.call(sel.options,function(o){return o.value===cur;})) sel.value=cur;
        }
      }
      syncWorkBranchUI();
      fillExtraClientSelects();
      renderCal();
      renderList();
    });
  }

  document.querySelectorAll('#menu1 button, #menu2 button, #menuHelp button').forEach(function(b){
    b.addEventListener('click',function(){ showTab(b.getAttribute('data-tab')); });
  });
  document.querySelectorAll('#scheduleSub button').forEach(function(b){
    b.addEventListener('click',function(){ showScheduleSub(b.getAttribute('data-sub')); });
  });
  if($('btnDashReload')) $('btnDashReload').onclick=function(){ loadDashboard(); };
  if($('btnSecObsReload')) $('btnSecObsReload').onclick=function(){ loadDashboard(); };
  if($('btnSecObsClosureClose')) $('btnSecObsClosureClose').onclick=function(){
    if($('secObsClosurePanel')) $('secObsClosurePanel').classList.add('hidden');
  };
  if($('btnSecObsClosureSubmit')) $('btnSecObsClosureSubmit').onclick=submitSecObsClosure;
  if($('btnSecObsOpenForm')) $('btnSecObsOpenForm').onclick=function(){
    if(!STATE.selectedId){ trainingToast('Open a Security Observation first.'); return; }
    showTab('internal');
    loadReport(STATE.selectedId,'security');
  };
  if($('secObsClosureFiles')) $('secObsClosureFiles').onchange=function(){
    var input=$('secObsClosureFiles');
    var files=input&&input.files?Array.prototype.slice.call(input.files):[];
    if(!files.length) return;
    var room=5-(STATE.secObsClosureFiles||[]).length;
    if(room<=0){ trainingToast('Maximum 5 evidence files.'); input.value=''; return; }
    var take=files.slice(0,room);
    Promise.all(take.map(function(f){
      return readFileAsBase64(f,'marks').then(function(info){
        var name=info.name||f.name||'evidence';
        var type=info.type||f.type||'';
        var ok=/\\.(pdf|docx?|xlsx?|csv|jpe?g|png|webp|gif)$/i.test(name)||/^image\\//.test(type)||/pdf|word|excel|sheet|msword/i.test(type);
        if(!ok) throw new Error('Use PDF, image, Word or Excel only: '+name);
        return { id:'ev'+Date.now().toString(36)+Math.random().toString(36).slice(2,6), name:name, type:type, base64:info.base64 };
      });
    })).then(function(infos){
      STATE.secObsClosureFiles=(STATE.secObsClosureFiles||[]).concat(infos);
      renderSecObsClosureFiles();
      input.value='';
    }).catch(function(e){ trainingToast(e.message||'Could not read file'); input.value=''; });
  };
  ;['dashFrom','dashTo','branchPickDash','secObsFrom','secObsTo','secObsBranch'].forEach(function(id){
    if($(id)) $(id).onchange=function(){ loadDashboard(); };
  });
  if($('btnSaveNotes')) $('btnSaveNotes').onclick=function(){ saveExtraForm('notesPpt',{date:'exNotesDate',subject:'exNotesSubject',title:'exNotesTitle',body:'exNotesBody'},'exNotesList'); };
  if($('btnSaveQb')) $('btnSaveQb').onclick=function(){ saveExtraForm('questionBank',{date:'exQbDate',subject:'exQbSubject',body:'exQbBody'},'exQbList'); };
  if($('btnSaveSg')) $('btnSaveSg').onclick=function(){ saveExtraForm('subjectGuide',{date:'exSgDate',subject:'exSgSubject',body:'exSgBody'},'exSgList'); };
  if($('btnSaveTest')) $('btnSaveTest').onclick=function(){ saveExtraForm('postTest',{date:'exTestDate',client:'exTestClient',body:'exTestBody',score:'exTestScore'},'exTestList'); };
  if($('btnSaveFg')) $('btnSaveFg').onclick=function(){
    if(!$('exFgClient').value){ trainingToast('Select the client / site.'); return; }
    if(!$('exFgQ5').value && !$('exFgQ1').value){ trainingToast('Please answer at least one question or overall rating.'); return; }
    var entry={
      kind:'feedbackGuard',
      branchId:effectiveBranchId(),
      trainingDate:$('exFgDate').value||todayYmd(),
      clientName:$('exFgClient').value,
      title:(($('exFgGuardName').value||'').trim()||'Guard')+' — '+(($('exFgQ5').value||'Feedback')),
      body:buildGuardFeedbackBody(),
      score:$('exFgQ5').value||''
    };
    api('saveExtra',{entry:entry, month:(entry.trainingDate||'').slice(0,7)||STATE.month, branchId:effectiveBranchId()}).then(function(){
      trainingToast('Guard feedback saved.');
      clearGuardFeedbackForm();
      loadExtras('feedbackGuard','exFgList');
    }).catch(function(e){trainingToast(e.message);});
  };
  if($('btnSaveFc')) $('btnSaveFc').onclick=function(){
    if(!$('exFcClient').value){ trainingToast('Select the client / site.'); return; }
    if(!$('exFcBenefit').value && !$('exFcQ5').value && !$('exFcQ1').value){
      trainingToast('Please answer the OJT benefit question (or overall satisfaction).');
      return;
    }
    var benefit=($('exFcBenefit').value||'').trim();
    var entry={
      kind:'feedbackClient',
      branchId:effectiveBranchId(),
      trainingDate:$('exFcDate').value||todayYmd(),
      clientName:$('exFcClient').value,
      title:(($('exFcPerson').value||'').trim()||'Client')+' — '+(benefit||$('exFcQ5').value||'Feedback'),
      body:buildClientFeedbackBody(),
      score:benefit||$('exFcQ5').value||''
    };
    api('saveExtra',{entry:entry, month:(entry.trainingDate||'').slice(0,7)||STATE.month, branchId:effectiveBranchId()}).then(function(){
      trainingToast('Client feedback saved.');
      clearClientFeedbackForm();
      loadExtras('feedbackClient','exFcList');
    }).catch(function(e){trainingToast(e.message);});
  };
  if($('btnClearFg')) $('btnClearFg').onclick=clearGuardFeedbackForm;
  if($('btnClearFc')) $('btnClearFc').onclick=clearClientFeedbackForm;
  if($('btnPrintFg')) $('btnPrintFg').onclick=function(){ printFeedbackBlank('guard'); };
  if($('btnPrintFc')) $('btnPrintFc').onclick=function(){ printFeedbackBlank('client'); };
  $('btnReload').onclick=function(){ loadMonth().then(function(){trainingToast('Updated.');}).catch(function(e){trainingToast(e.message);}); };
  $('btnNew').onclick=function(){
    var d=$('scheduleDatePick').value||todayYmd();
    if(d.slice(0,7)!==STATE.month){
      STATE.month=d.slice(0,7);
      loadMonth().then(function(){ openNewForDate(d); }).catch(function(e){trainingToast(e.message);});
    } else openNewForDate(d);
  };
  $('scheduleDatePick').onchange=function(){
    var d=$('scheduleDatePick').value;
    if(!d) return;
    if(d.slice(0,7)!==STATE.month){
      STATE.month=d.slice(0,7);
      loadMonth().catch(function(e){trainingToast(e.message);});
    }
  };
  $('btnCloseEditor').onclick=function(){ $('editor').classList.add('hidden'); };
  $('btnCloseCancel').onclick=function(){ $('cancelPanel').classList.add('hidden'); };
  if($('btnToggleTopicManage')) $('btnToggleTopicManage').onclick=function(){
    var p=$('topicManagePanel');
    if(!p) return;
    p.classList.toggle('hidden');
    if(!p.classList.contains('hidden')) renderTopicManage();
  };
  if($('btnClearTopicForm')) $('btnClearTopicForm').onclick=clearTopicForm;
  if($('btnSaveTopic')) $('btnSaveTopic').onclick=function(){
    var title=($('tmTitle').value||'').trim();
    if(!title){ trainingToast('Enter the topic title.'); return; }
    var editId=($('tmEditId').value||'').trim();
    var prev=editId?(STATE.ojtTopics||[]).find(function(x){return x.id===editId;}):null;
    var cat=$('tmCategory').value||'Client suggested';
    api('saveOjtTopic',{
      topic:{
        id:editId||undefined,
        title:title,
        category:cat,
        clientSuggested:prev?!!prev.clientSuggested:(cat==='Client suggested'),
        active:prev?prev.active!==false:true
      }
    }).then(function(j){
      refreshTopicsFromServer(j);
      clearTopicForm();
      trainingToast('Topic saved — available in the dropdown.');
    }).catch(function(e){ trainingToast(e.message); });
  };
  if($('tmTopicBody')) $('tmTopicBody').addEventListener('click',function(ev){
    var t=ev.target;
    if(!t||!t.getAttribute) return;
    var editId=t.getAttribute('data-tm-edit');
    var onId=t.getAttribute('data-tm-on');
    var offId=t.getAttribute('data-tm-off');
    if(editId){
      var row=(STATE.ojtTopics||[]).find(function(x){ return x.id===editId; });
      if(!row) return;
      $('tmEditId').value=row.id;
      $('tmTitle').value=row.title||'';
      $('tmCategory').value=row.category||'Client suggested';
      $('topicManagePanel').classList.remove('hidden');
      $('tmTitle').focus();
      return;
    }
    if(onId||offId){
      var id=onId||offId;
      api('setOjtTopicActive',{topicId:id, active:!!onId}).then(function(j){
        refreshTopicsFromServer(j);
        trainingToast(onId?'Topic activated.':'Topic hidden from new schedules.');
      }).catch(function(e){ trainingToast(e.message); });
    }
  });
  $('sTrainerOther').onchange=syncTrainerFields;
  $('sClient').addEventListener('change',function(){
    var opt=$('sClient').selectedOptions[0];
    /** Always take site/location from the selected client row (multi-site clients e.g. Premier Energies). */
    if(opt) $('sLoc').value=opt.getAttribute('data-loc')||'';
  });
  $('btnSaveSession').onclick=function(){
    var payload=readSessionForm();
    if(!payload.trainingDate){trainingToast('Please pick a training date.');return;}
    if(!payload.clientId){trainingToast('Please select a client.');return;}
    if(!payload.branchId||payload.branchId==='all'){trainingToast('Client branch missing — pick a client from Hyd-A, Hyd-B or Hi-Tech.');return;}
    if(!String(payload.location||'').trim()){
      trainingToast('Please set Venue / location (site). Needed so WhatsApp goes only to that site’s guards.');
      return;
    }
    if(!payload.topic1&&!payload.topic2&&!payload.topic3&&!payload.topic4&&!payload.topic5){
      trainingToast('Select at least one training topic from the list.');return;
    }
    var dupSave=findDuplicateTopicSlot();
    if(dupSave){
      trainingToast('Same topic selected twice (Topic-'+dupSave.other+' and Topic-'+dupSave.slot+'). Please choose different topics.');
      return;
    }
    if(!payload.tableTop){trainingToast('Select Table Top Exercise Yes or No.');return;}
    if($('sTrainerOther').checked && !payload.trainerName){trainingToast('Enter trainer name.');return;}
    api('saveSession',{session:payload}).then(function(res){
      var note=res&&res.controlNote;
      trainingToast(note||'Schedule saved.');
      $('editor').classList.add('hidden');
      return loadMonth();
    }).catch(function(e){trainingToast(e.message);});
  };
  $('btnConfirmCancel').onclick=function(){
    var id=$('cancelSessionId').value;
    var reason=($('cancelReason').value||'').trim();
    if(!id) return;
    if(!reason){trainingToast('Please enter the cancellation reason.');return;}
    api('cancelSession',{sessionId:id, cancelReason:reason}).then(function(){
      trainingToast('Cancelled and shared with client (HOD, Director in CC).');
      $('cancelPanel').classList.add('hidden');
      return loadMonth();
    }).catch(function(e){trainingToast(e.message);});
  };
  $('iTurnout').onchange=syncReasonWraps;
  $('iIdValid').onchange=syncReasonWraps;
  $('iRecord').onchange=syncReasonWraps;
  if($('btnOjtSelfie')) $('btnOjtSelfie').onclick=function(){ ojtPhotoSelfie(); };
  if($('btnOjtCamRotate')) $('btnOjtCamRotate').onclick=function(){ ojtCamRotate(); };
  if($('btnOjtCamFlip')) $('btnOjtCamFlip').onclick=function(){ ojtCamFlip(); };
  if($('btnOjtCamSnap')) $('btnOjtCamSnap').onclick=function(){ ojtCamSnap(); };
  if($('btnOjtCamClose')) $('btnOjtCamClose').onclick=function(){ ojtCamClose(); };
  if($('rPhotoCam')) $('rPhotoCam').onchange=function(){ ojtPhotoFromInput(this); };
  if($('btnPreviewReport')) $('btnPreviewReport').onclick=function(){ openCompletionPreview(); };
  if($('btnPreviewReportReview')) $('btnPreviewReportReview').onclick=function(){ openCompletionPreview(); };
  if($('btnPreviewMonthFormat')) $('btnPreviewMonthFormat').onclick=function(){ previewMonthScheduleFormat({skipNewTab:true}); };
  if($('btnOpenFormatNewTab')) $('btnOpenFormatNewTab').onclick=function(){
    if(!LAST_FORMAT_HTML){ previewMonthScheduleFormat({skipNewTab:false}); return; }
    try{
      var doc=buildPreviewDoc(LAST_FORMAT_HTML, LAST_FORMAT_TITLE);
      var blob=new Blob([doc],{type:'text/html'});
      var url=URL.createObjectURL(blob);
      var w=window.open(url,'_blank');
      if(!w) trainingToast('Please allow pop-ups, or use the preview box on this page.');
      else setTimeout(function(){ try{ URL.revokeObjectURL(url); }catch(e){} }, 120000);
    }catch(e){ trainingToast('Could not open new tab — use the preview box on this page.'); }
  };
  if($('btnRefreshClientBenefit')) $('btnRefreshClientBenefit').onclick=function(){
    if(!STATE.selectedId){ trainingToast('Select a session first.'); return; }
    loadReport(STATE.selectedId,'completion').then(function(){
      var r=STATE.report||{};
      if(r.clientOjtBenefitRating) trainingToast('Client feedback on record: '+r.clientOjtBenefitRating);
      else trainingToast('Still pending — client has not submitted yet.');
    }).catch(function(e){ trainingToast(e&&e.message?e.message:'Could not refresh.'); });
  };
  $('btnSaveReport').onclick=function(){
    saveCompletionThen(function(){ showCompletionMode('edit'); }).catch(function(e){ if(e&&e.message) trainingToast(e.message); });
  };
  $('btnReviewReport').onclick=function(){
    var missing=completionMissingColumns();
    if(missing.length){ askFillAllColumns(missing); return; }
    showCompletionReview();
  };
  if($('btnSaveAfterReview')) $('btnSaveAfterReview').onclick=function(){
    var missing=completionMissingColumns();
    if(missing.length){ askFillAllColumns(missing); return; }
    saveCompletionThen(function(){ showCompletionMode('edit'); }).catch(function(e){ if(e&&e.message) trainingToast(e.message); });
  };
  $('btnEditReport').onclick=function(){ showCompletionMode('edit'); };
  $('btnSendReport').onclick=function(){
    if(!STATE.selectedId){trainingToast('Select a session first.');return;}
    var missing=completionMissingColumns();
    if(missing.length){ askFillAllColumns(missing); return; }
    saveCompletionThen(function(){
      api('sendCompletion',{sessionId:STATE.selectedId}).then(function(j){
        STATE.report=j.report;
        $('reportMailMeta').textContent='Sent to client (up to 3 emails). CC trainer, HOD, Director.';
        trainingToast('Completion report sent to client.');
        return loadMonth();
      }).catch(function(e){trainingToast(e.message);});
    }).catch(function(e){ if(e&&e.message) trainingToast(e.message); });
  };
  $('btnSaveInternal').onclick=function(){
    saveSecurityThen(function(){ showSecurityMode('edit'); }).catch(function(e){ if(e&&e.message) trainingToast(e.message); });
  };
  $('btnReviewInternal').onclick=function(){
    saveSecurityThen(function(){ showSecurityReview(); }).catch(function(e){ if(e&&e.message) trainingToast(e.message); });
  };
  $('btnEditInternal').onclick=function(){ showSecurityMode('edit'); };
  $('btnShareInternal').onclick=function(){
    if(!STATE.selectedId){trainingToast('Select a session first.');return;}
    saveSecurityThen(function(){
      api('sendSecurityObs',{sessionId:STATE.selectedId}).then(function(j){
        STATE.report=j.report;
        $('securityMailMeta').textContent='Sent to Branch HOD (CC Training, Director).';
        trainingToast('Security Observations sent to HOD.');
      }).catch(function(e){trainingToast(e.message);});
    }).catch(function(e){ if(e&&e.message) trainingToast(e.message); });
  };
  $('filterClient').oninput=renderList;
  $('filterStatus').onchange=renderList;
  $('filterSla').onchange=renderList;
  $('branchPick').onchange=function(){
    STATE.branchId=$('branchPick').value;
    syncWorkBranchUI();
    loadMonth().catch(function(e){trainingToast(e.message);});
  };
  if($('workBranchPick')) $('workBranchPick').onchange=function(){
    STATE.workBranchId=$('workBranchPick').value;
    loadMonth().catch(function(e){trainingToast(e.message);});
  };

  /** Use boot auth — do not call trainingRequireLogin() again (second pass used to bounce sessions). */
  var a=window.__TRAINING_AUTH__||trainingReadAuth();
  if(!a||!a.token){ location.href=trainingLoginUrl(); return; }
  STATE.branchId=a.branchId||'';
  STATE.staffEmail=a.email||'';
  STATE.staffName=(a.email||'').split('@')[0].replace(/[._]/g,' ')||'';
  /** Seed role from login immediately so branch pickers can appear for Director / Management. */
  STATE.role=String(a.role||trainingGet('otp_role_training')||'').toLowerCase()==='management'?'management':'staff';
  if(STATE.role==='management'){
    if($('branchPickWrap')) $('branchPickWrap').classList.remove('hidden');
    if($('branchPickWrapDash')) $('branchPickWrapDash').classList.remove('hidden');
    if($('secObsBranchWrap')) $('secObsBranchWrap').classList.remove('hidden');
  }
  var now=new Date();
  STATE.month=now.getFullYear()+'-'+((now.getMonth()+1)<10?'0':'')+(now.getMonth()+1);
  if($('scheduleDatePick')) $('scheduleDatePick').value=todayYmd();
  var firstOfMonth=STATE.month+'-01';
  ;['dashFrom','secObsFrom'].forEach(function(id){ if($(id)) $(id).value=firstOfMonth; });
  ;['dashTo','secObsTo'].forEach(function(id){ if($(id)) $(id).value=todayYmd(); });
  ;['exNotesDate','exTestDate','exFgDate','exFcDate','exQbDate','exSgDate'].forEach(function(id){ if($(id)) $(id).value=todayYmd(); });
  loadMonth().then(function(){
    if(STATE.role==='management' || STATE.clientScope==='training-dept' || STATE.trainingDeptManager){
      if($('linkMaster')) $('linkMaster').href=STATE.role==='management'?'/mis-admin':'/mis-staff-sites';
      if($('linkUsers')) $('linkUsers').href='/mis-users';
      var td=(STATE.branches||[]).find(function(b){return b.isTrainingDepartment;});
      if(td && STATE.clientScope==='training-dept' && STATE.branchId!==td.id){
        STATE.branchId=td.id;
        syncWorkBranchUI();
        return loadMonth().then(function(){ showTab('dashboard'); });
      }
    } else {
      if($('linkMaster')) $('linkMaster').href='/mis-staff-sites';
      if($('linkUsers')){ $('linkUsers').href='/mis-users'; $('linkUsers').title='Management User Management'; }
    }
    if(STATE.trainingDeptManager || STATE.clientScope==='training-dept') syncWorkBranchUI();
    showTab('dashboard');
  }).catch(function(e){
    var msg=e&&e.message?String(e.message):'Could not load schedules.';
    if(/branch is required/i.test(msg) && STATE.role!=='management'){
      trainingToast('Select your branch on the Training login screen, then sign in again.');
    } else {
      trainingToast(msg);
    }
  });
})();
`

  return trainingPageHtml({
    title: 'Agile Training — On Site Tactical Training (OJT)',
    body: body + ojtGalleryWidgetHtml(),
    script,
    activeNav: 'ojt',
  })
}

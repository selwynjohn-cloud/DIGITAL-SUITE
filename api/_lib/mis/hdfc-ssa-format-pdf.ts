/**
 * Full HDFC SSA format (all 15 pages + opening screen) for client approval print / PDF.
 * Mirrors the public link. Does not change /mis-hdfc-survey.
 */

import { SURVEY_PARTS } from '../crm/survey-template.js'
import { SUITE_APP_FOOTER_LINE } from '../suite-app-footer.js'

const LOGO = 'https://www.agilegroup-digital.co.in/agile-logo-clear.png'
const LIVE = 'https://www.agilegroup-digital.co.in/mis-hdfc-survey'

type Field = { q: string; a?: string }

function esc(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function lineBox(): string {
  return '<span class="ans"></span>'
}

function fieldRow(f: Field): string {
  return `<tr><td class="q">${esc(f.q)}</td><td class="a">${esc(f.a || '') || lineBox()}</td></tr>`
}

function section(n: string, title: string, note: string, fields: Field[]): string {
  return `<section class="sec" data-n="${esc(n)}">
    <h2><span class="num">${esc(n)}</span> ${esc(title)}</h2>
    ${note ? `<p class="note">${esc(note)}</p>` : ''}
    <table>${fields.map(fieldRow).join('')}</table>
  </section>`
}

function checklistHtml(): string {
  let html = `<section class="sec">
    <h2><span class="num">12</span> Risk check list</h2>
    <p class="note">Score each item 0 (low risk) to 5 (high risk). Same 180-point checklist as Agile CRM Security Survey. Notes optional.</p>`
  for (const part of SURVEY_PARTS) {
    html += `<h3>${esc(part.title)} <span class="muted">(max ${part.maxTotal})</span></h3>
      <table><thead><tr><th class="q">Item</th><th class="score">0</th><th class="score">1</th><th class="score">2</th><th class="score">3</th><th class="score">4</th><th class="score">5</th><th class="a">Notes</th></tr></thead><tbody>`
    for (const it of part.items) {
      html += `<tr><td class="q">${esc(it.label)}${it.hint ? `<div class="hint">${esc(it.hint)}</div>` : ''}</td>
        <td class="score">☐</td><td class="score">☐</td><td class="score">☐</td><td class="score">☐</td><td class="score">☐</td><td class="score">☐</td>
        <td class="a">${lineBox()}</td></tr>`
    }
    html += `</tbody></table>`
  }
  html += `</section>`
  return html
}

export function hdfcSsaFormatHtml(): string {
  const opening: Field[] = [
    { q: 'Branch *', a: 'Dropdown — pick branch first' },
    { q: 'HDFC unit *', a: 'That branch’s HDFC clients only (from Master Directory)' },
    { q: 'Risk Analyst / Operations name *', a: 'That branch’s HOD + operations only (VP, AVP, RM, CGM, OM). No HQ / IT / Director / Control names' },
    { q: 'Your Name (if not in list)', a: 'Typed name is saved for that branch' },
    { q: 'Email ID (HOD / Operations) *' },
    { q: 'WhatsApp Number * (10-digit mobile)' },
    { q: 'Date of Survey *', a: 'Calendar picker' },
    { q: 'Time now', a: 'Auto (IST)' },
    {
      q: 'Start Assessment',
      a: 'Press only on arrival at site. Phone asks for GPS (Allow). Coordinates save on the assessment and on client master. If denied, assessment still continues.',
    },
  ]

  const p1: Field[] = [
    { q: 'Client (this branch)', a: 'Select HDFC client from Master Directory — name / address autofill' },
    { q: 'Location / Category', a: 'Urban / Semi-Urban / Rural' },
    { q: 'Landmark' },
    { q: 'Ground — Left' },
    { q: 'Ground — Right' },
    { q: 'Ground — Front' },
    { q: 'Ground — Back' },
    { q: 'Nearest Fire Station' },
    { q: 'Fire Station distance (km)' },
    { q: 'Nearest Police Station' },
    { q: 'Police Station distance (km)' },
    { q: 'Wine shop nearby', a: 'Yes / No / NA' },
    { q: 'Bars nearby', a: 'Yes / No / NA' },
    { q: '24×7 shops nearby', a: 'Yes / No / NA' },
    { q: 'Bus stand nearby', a: 'Yes / No / NA' },
    { q: 'Railway station nearby', a: 'Yes / No / NA' },
    { q: 'Political Party office nearby', a: 'Yes / No / NA' },
    { q: 'Airport nearby', a: 'Yes / No / NA' },
    { q: '24×7 public movement', a: 'High 24x7 / Moderate / Low / Quiet at night / Remote / Isolated at night' },
    { q: 'Remote / isolated at night', a: 'Yes / No / NA' },
    { q: 'Location risk note' },
  ]

  const p2: Field[] = [
    { q: 'Risk Analyst / Surveyed By', a: 'Asked once — HOD / operations dropdown; typed name saved for branch' },
    { q: 'Email (HOD / Operations)', a: 'Asked once' },
    { q: 'Date of Survey', a: 'Asked once — calendar' },
    { q: 'Name of the Manager' },
    { q: 'Contact Number' },
    { q: 'Bank email' },
    { q: 'Branch category', a: 'Metro / Urban / Semi-Urban / Rural' },
    { q: 'Working hours', a: 'e.g. 9:30–4:30' },
    { q: 'Holiday opening is on the file', a: 'Yes / No' },
    { q: 'Whether FA knows the procedure', a: 'Yes / No' },
  ]

  const p3: Field[] = [
    { q: 'Sanctioned strength', a: '1FA / 2FA / 3FA' },
    { q: 'Actual Day shift start time', a: '6.00 am / 7.00 am / 10.00 am' },
    { q: 'Actual afternoon shift start time', a: '2.00 pm / 3.00 pm / 6.00 pm' },
    { q: 'Actual evening shift start time', a: '10.00 pm / 11.00 pm / 2.00 am' },
    { q: 'FA on duty', a: 'Yes / No / NA' },
    { q: 'Deployment matches sanction', a: 'Yes / No / NA' },
    { q: 'Facility Attendants — Name (Add FA / Edit / Save, max 6)' },
    { q: 'Facility Attendants — ID No.' },
    { q: 'Facility Attendants — ID card validity', a: 'Calendar picker (Pick date) — always visible on the form' },
    { q: 'Deployment gap notes' },
  ]

  const p4: Field[] = [
    { q: 'Attendance Register', a: 'Maintained / Not maintained / NA' },
    { q: 'HOTO', a: 'Maintained / Not maintained / NA' },
    { q: 'Occurrence Register', a: 'Maintained / Not maintained / NA' },
    { q: 'Break Register', a: 'Maintained / Not maintained / NA' },
    { q: 'Generator Register', a: 'Maintained / Not maintained / NA' },
    { q: 'Cash Loading register', a: 'Maintained / Not maintained / NA' },
    { q: 'Bank Opening and closing Register', a: 'Maintained / Not maintained / NA' },
    { q: 'Compliance File', a: 'Maintained / Not maintained / NA' },
    { q: 'During Bank Holidays — where will FA keep Register & files', a: 'ATM under Lock & key / 3 FA Branch / in Branch' },
    { q: 'Document for all FAs — PVC', a: 'Yes / No' },
    { q: 'Document for all FAs — Medical cert', a: 'Yes / No' },
    { q: 'Document for all FAs — Deployment Order', a: 'Yes / No' },
    { q: 'Compliance gap notes' },
  ]

  const p5: Field[] = [
    { q: 'Main Entrance Door', a: 'e.g. Glass / Wooden / Iron' },
    { q: 'Main door open / close procedure', a: 'Documented & followed / Partial / Not followed' },
    { q: 'Shutter Condition', a: 'Working / Not Working / Needs Repair / NA' },
    { q: 'Shutter open / close procedure', a: 'Documented & followed / Partial / Not followed' },
    { q: 'Windows secured', a: 'Yes / No / NA' },
    { q: 'Windows open / close procedure', a: 'Documented & followed / Partial / Not followed / NA' },
    { q: 'Entry Points to bank', a: '1 / 2 / 3' },
    { q: 'Normal Main door open position', a: 'Fully opened / Half Opened / Chained' },
    { q: 'Back Yard door', a: 'Yes / No / Closed always' },
    { q: 'Damaged windows (could not be closed)', a: 'Yes / No / NA' },
    { q: 'Check list for closing Bank', a: 'Yes / No / NA (this page only — not repeated)' },
    { q: 'Who Lock the bank', a: 'FA / HK / Bank Staff' },
    { q: 'Who will seal the keys', a: 'FA / HK / Bank Staff' },
    { q: 'Physical security notes' },
  ]

  const p6: Field[] = [
    { q: 'ATM Site', a: 'In Branch / Offsite / None' },
    { q: 'No. of shift', a: '1 / 2 / 3' },
    { q: 'No. of key sets', a: '1 / 2 / 3' },
    { q: 'Open wiring', a: 'Yes / No / NA' },
    { q: 'Open Power Socket', a: 'Yes / No / NA' },
    { q: 'ATM has Open Connection', a: 'Yes / No / Nil' },
    { q: 'FAs belonging in ATM', a: 'Yes / No' },
    { q: 'What is in ATM drawer', a: 'Empty / old Bank document / Registers (FAs)' },
    { q: 'ATM lobby is clean', a: 'Yes / No / Clean' },
    { q: 'Unauthorised Stickers found', a: 'Yes / No / NA' },
    { q: 'ATM can be seen from Road', a: 'Yes / No / NA' },
    { q: 'Surround Night Lightings', a: 'Good / Fair / Nil' },
    { q: 'Patrolling system before takeover', a: 'Yes / No / NA' },
    { q: 'No. of Access to ATM', a: '1 / 2 / 3' },
    { q: 'Can they Access Bank from ATM', a: 'Yes / No / Locked' },
    { q: 'ATM Guarding', a: '3 Shift / 2 Shift (1st & 2nd) / 1 shift (G)' },
    { q: 'ATM / Lobby notes' },
  ]

  const p7: Field[] = [
    { q: 'Generator Location', a: 'Front side / Back side / Right side / Left side / Basement / NA' },
    { q: 'Generator Battery', a: 'Yes / No / NA' },
    { q: 'Generator Lock is intact', a: 'Yes / No / NA' },
    { q: 'Generator working', a: 'Yes / No / NA' },
    { q: 'Who is starting the Generator', a: 'FA / HK / Bank Staff' },
    { q: 'Who is getting Diesel for Generator', a: 'FA / HK / Bank Staff' },
    { q: 'Fuel status', a: 'Adequate / Low / Empty / NA' },
    { q: 'UPS present', a: 'Yes / No / NA' },
    { q: 'UPS backup (hours)' },
    { q: 'Visibility from the ATM', a: 'Yes / No' },
    { q: 'CCTV coverage to Generator', a: 'Yes / No' },
    { q: 'Generator Area Luminated', a: 'Yes / No' },
    { q: 'Utility notes' },
    { q: 'Generator Register Maintained', a: 'Yes / No (last question on this page)' },
  ]

  const p8: Field[] = [
    { q: 'Perimeter fence / wall', a: 'Secure / Partial / None' },
    { q: 'Perimeter lighting', a: 'Adequate / Poor / None' },
    { q: 'Perimeter CCTV', a: 'Working / Not Working / Needs Repair / NA' },
    { q: 'Patrol frequency', a: 'while HOTO & Nights / Nights only / NA' },
    { q: 'Patrol route followed', a: 'Yes / No / NA' },
    { q: 'Outdoor A/C Unit', a: 'visible / Not visible / NA' },
    { q: 'Lightings Outdoor A/C Unit area', a: 'adequate / poor / Nil' },
    { q: 'CCTV coverage to Outdoor A/C unit', a: 'Yes / No / NA' },
    { q: 'Patrol notes' },
  ]

  const p9: Field[] = [
    { q: 'Fire Safety check – ATM — No. of FE in ATM', a: '0 to 15' },
    { q: 'ATM FE — Types CO2', a: '0 to 15' },
    { q: 'ATM FE — Types DCP', a: '0 to 15' },
    { q: 'ATM FE — Types Foam', a: '0 to 15' },
    { q: 'ATM FE — Types Mixed', a: '0 to 15' },
    { q: 'Fire Safety check – Bank — No. of FE in Bank', a: '0 to 15' },
    { q: 'Bank FE — Types CO2', a: '0 to 15' },
    { q: 'Bank FE — Types DCP', a: '0 to 15' },
    { q: 'Bank FE — Types Foam', a: '0 to 15' },
    { q: 'Bank FE — Types Mixed', a: '0 to 15' },
    { q: 'Cooking / Heating available', a: 'Yes / No / NA' },
    { q: 'Microwave', a: 'Yes / No / NA' },
    { q: 'Recent Fire audit', a: 'Calendar date or Not known' },
    { q: 'Recent Fire Drill', a: 'Calendar date or Not known' },
    { q: 'Smoke Detectors', a: 'Working / Not Working / Needs Repair / NA / Not Installed' },
    { q: 'Fire Alarm', a: 'Working / Not Working / Needs Repair / NA' },
    { q: 'Fire safety notes' },
  ]

  const p10: Field[] = [
    { q: 'Router installed', a: 'Yes / No / NA' },
    { q: 'Panic switch availability in ATM', a: 'Yes / No / NA' },
    { q: 'Agile Control Number' },
    { q: 'FA knowledge on Agile Mobile alarm', a: 'Yes / No / NA' },
    { q: 'Emergency Contact Displayed / available with FA', a: 'Yes / No / NA' },
    { q: 'Escalation matrix Known to FA', a: 'Yes / No / NA' },
    { q: 'Bank emergency contact' },
    { q: 'Police emergency contact' },
    { q: 'Fire emergency contact' },
    { q: 'Emergency notes' },
  ]

  const p11: Field[] = [
    { q: 'No. CCTV camera in ATM', a: '0 to 20' },
    { q: 'No. of CCTV in Bank', a: '0 to 20' },
    { q: 'Location of local DVR', a: 'ATM / Branch / NA' },
    { q: 'CCTV cable is open', a: 'Yes / No / NA' },
    { q: 'DVR / NVR — Channels' },
    { q: 'DVR / NVR — HDD capacity' },
    { q: 'Recording Backup (days)', a: 'e.g. 90' },
    { q: 'CCTV coverage adequate', a: 'Yes / No / NA' },
    { q: 'Electronic security notes' },
    { q: 'Surveyor Signature / Name', a: 'Same as assessor (auto)' },
    { q: 'Branch Representative Signature / Name' },
    { q: 'General Observations' },
    { q: 'Recommendations' },
  ]

  const p13: Field[] = [
    { q: 'Generate Professional Report', a: 'Optional AI assist on portal' },
    { q: 'Scientific Risk Analysis' },
    { q: 'Executive Summary' },
    { q: 'Security Professional Recommendations' },
    { q: 'Site observations' },
    { q: 'Client Report (Print / PDF)', a: 'Review full client letter' },
  ]

  const p14: Field[] = [
    { q: 'Selfie (surveyor on site)', a: 'Take Photo (Flip / front camera) or Gallery — Delete on each' },
    { q: 'Photo 1 — Bank & ATM from front', a: 'Left, right and above visible' },
    { q: 'Photo 2 — What is in front of the Bank & ATM' },
    { q: 'Photo 3 — AC outdoor unit area' },
    { q: 'Photo 4 — Any sensitive information area' },
    { q: 'Add Photo', a: 'Extra site photo if needed' },
    { q: 'Document 1 — Attendance Register copy' },
    { q: 'Document 2 — HOTO register copy' },
    { q: 'Document 3 — PVC copies of 3/2 FA' },
    { q: 'Document 4 — Closing and Opening register' },
  ]

  const p15: Field[] = [
    { q: 'HDFC questionnaire summary', a: 'Answers from headings 1–11' },
    { q: "HOD's suggestions" },
    { q: 'Generate system / AI suggestion', a: 'Optional' },
    { q: 'System / AI suggestion' },
    { q: 'Executive Summary', a: 'From page 13' },
    { q: 'Photos Preview' },
    { q: 'Review the report', a: 'Opens full client report (does not submit)' },
    { q: 'Submit to HOD', a: 'Public link only — only on page 15. Blocked until all 15 pages are complete. Confirm: All 15 pages are completed.' },
  ]

  const body = `
    ${section('0', 'Opening screen (public link — no login)', 'Pick Branch first, then that branch’s HDFC unit and Risk Analyst. Then Start Assessment.', opening)}
    ${section('1', 'Location & Identification', 'Pick HDFC client from Master Directory. Surroundings use Yes/No where possible. No Branch Name / SOL ID / First Floor on this page.', p1)}
    ${section('2', 'Basic Information', 'Assessor name / email / date asked once. Holiday opening is on this page only.', p2)}
    ${section('3', 'Deployment verification', 'No ASO / LSG / SG present fields.', p3)}
    ${section('4', 'Registers & Compliance', 'Mark each register in this order.', p4)}
    ${section('5', 'Bank Physical security', 'No Strong Room / Emergency Exit / fire questions. Check list for closing Bank is only here.', p5)}
    ${section('6', 'ATM & Lobby', '', p6)}
    ${section('7', 'Generator & Utility', 'Generator Register Maintained is the last question.', p7)}
    ${section('8', 'Perimeter & Patrolling', '', p8)}
    ${section('9', 'Fire safety', 'FE in ATM and Bank with type counts. Closing-bank checklist is not repeated here.', p9)}
    ${section('10', 'Emergency communication', 'No Panic Switches count/status, Burglar Alarm, or guards escalation.', p10)}
    ${section('11', 'Electronic Security', '', p11)}
    ${checklistHtml()}
    ${section('13', 'Professional assessment', 'Write or generate the report. Photos are on heading 14.', p13)}
    ${section('14', 'Site Photos & Documents', 'Take Photo / Gallery. Delete on every upload. If storage fails, answers still save.', p14)}
    ${section('15', 'Final Report with suggestions', 'Includes HOD & AI. Submit to HOD is only on this page on the public link.', p15)}
  `

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>HDFC Site Security Assessment (SSA) Format — Agile Security Force</title>
<style>
  *{box-sizing:border-box}
  @page{size:A4;margin:0}
  html,body{margin:0;padding:0}
  body{font-family:'Segoe UI',Calibri,Arial,Helvetica,sans-serif;color:#0f172a;background:#e8eef6;font-size:13.5px;line-height:1.5}
  .toolbar{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;padding:14px 12px 0}
  .btn{appearance:none;border:0;border-radius:8px;padding:10px 16px;font-weight:800;cursor:pointer;font-size:14px}
  .btn-navy{background:#14224f;color:#fff}
  .btn-gold{background:#c9a84c;color:#14224f}
  .page{max-width:210mm;margin:0 auto;background:#fff;box-shadow:0 10px 32px rgba(15,23,42,.12)}
  .doc-header,.doc-footer{left:0;right:0;z-index:2}
  .doc-header{
    background:linear-gradient(135deg,#0b1533 0%,#14224f 42%,#1e3a8a 100%);
    color:#fff;padding:10px 16px 0;border-bottom:4px solid #c9a84c;
  }
  .doc-header table{width:100%;border-collapse:collapse}
  .doc-header img{height:52px;width:auto;background:transparent;display:block}
  .co{font-size:16px;font-weight:800;letter-spacing:.3px;line-height:1.25;color:#fff}
  .co-sub{font-size:10.5px;color:#fde68a;font-weight:700;margin-top:3px}
  .co-addr{font-size:10px;color:#e2e8f0;line-height:1.4;margin-top:4px}
  .stamp{text-align:right}
  .stamp b{display:inline-block;background:#c9a84c;color:#14224f;font-size:10px;letter-spacing:.8px;padding:4px 8px;border-radius:3px}
  .stamp span{display:block;margin-top:6px;font-size:10px;color:#cbd5e1}
  .doc-bar{background:#0b1533;color:#fde68a;font-size:10.5px;font-weight:700;letter-spacing:.3px;padding:6px 16px;margin-top:8px;display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}
  .doc-header a{color:#fde68a;text-decoration:underline;font-weight:800}
  .doc-footer{
    background:#0b1533;color:#e2e8f0;border-top:3px solid #c9a84c;padding:8px 16px 9px;font-size:10.5px;line-height:1.45
  }
  .doc-footer .f1{display:flex;justify-content:space-between;gap:10px;color:#fde68a;font-weight:700}
  .doc-footer .f2{color:#e2e8f0;margin-top:3px}
  .doc-footer .f3{color:#cbd5e1;margin:4px auto 0;font-style:italic;font-weight:650;text-align:center;max-width:92%}
  .flow{width:100%;border-collapse:collapse}
  .flow > thead > tr > td,.flow > tbody > tr > td,.flow > tfoot > tr > td{border:0;padding:0;background:transparent}
  .head-space{height:8px}
  .foot-space{height:8px}
  .sheet{padding:16px 18px 18px}
  .title-card{
    margin:10px 0 14px;padding:14px 16px;
    background:linear-gradient(180deg,#f8fafc,#eef2ff);
    border:1px solid #c9a84c;border-radius:8px
  }
  .title-card h1{margin:0;font-size:18px;color:#14224f;letter-spacing:.2px}
  .title-card p{margin:5px 0 0;color:#334155}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;font-size:11.5px}
  .meta div{background:#fff;border:1px solid #dbe4f0;border-radius:6px;padding:7px 9px}
  .meta b{display:block;color:#14224f;font-size:10px;letter-spacing:.4px;text-transform:uppercase}
  .sec{margin:12px 0 0}
  .sec h2{margin:0 0 8px;font-size:16px;color:#14224f;background:#f4f0e4;border-left:5px solid #c9a84c;padding:8px 10px;border-radius:0 6px 6px 0}
  .sec h3{margin:12px 0 6px;font-size:14px;color:#1e3a5f}
  .num{display:inline-block;min-width:1.5em;color:#8a6d1f}
  .note,.hint{color:#334155;font-size:12.5px;margin:0 0 8px}
  .muted{color:#64748b;font-weight:500}
  table{width:100%;border-collapse:collapse}
  th,td{border:1px solid #c5d0e0;padding:6px 8px;vertical-align:top;text-align:left}
  tr{page-break-inside:avoid;break-inside:avoid}
  th{background:#14224f;color:#fff;font-size:12px}
  td.q{width:42%;font-weight:700;color:#0f172a;background:#f8fafc;font-size:13.5px}
  td.a{color:#0f172a;font-size:13.5px}
  td.a,.ans{min-height:20px}
  .ans{display:block;border-bottom:1px dotted #94a3b8;min-height:16px}
  td.score{width:26px;text-align:center;color:#14224f}
  .cover-box{background:#f8fafc;border:1px solid #dbe4f0;border-left:5px solid #14224f;border-radius:8px;padding:12px 14px;margin:10px 0 14px}
  @media print{
    html,body{height:auto!important;background:#fff}
    .toolbar,.noprint{display:none!important}
    .page{max-width:none;box-shadow:none;min-height:0}
    .doc-header,.doc-footer{position:fixed;width:100%}
    .doc-header{top:0}
    .doc-footer{bottom:0}
    .sheet{padding:2mm 11mm 2mm}
    .head-space{height:34mm}
    .foot-space{height:22mm}
    .flow > thead{display:table-header-group}
    .flow > tfoot{display:table-footer-group}
    .sheet > :last-child{page-break-after:avoid;break-after:avoid;margin-bottom:0}
    thead{display:table-header-group}
    tr{page-break-inside:avoid;break-inside:avoid}
    h2,h3{page-break-after:avoid}
    .sec[data-n="15"]{page-break-before:avoid;break-before:avoid}
  }
  @media screen{
    .page{margin:12px auto 28px;display:flex;flex-direction:column}
    .doc-header{border-radius:0;order:1}
    .sheet{order:2}
    .doc-footer{order:3}
  }
</style>
</head>
<body>
  <div class="toolbar noprint">
    <button type="button" class="btn btn-gold" onclick="window.print()">Save / Print as PDF</button>
    <a class="btn btn-navy" href="/hdfc-ssa-15-sections-format.pdf" download="HDFC-SSA-15-sections-format.pdf" style="text-decoration:none">Download PDF</a>
  </div>
  <div class="page">
    <header class="doc-header">
      <table>
        <tr>
          <td width="72" style="vertical-align:middle;padding-right:12px">
            <img src="${LOGO}" alt="Agile Security Force" onerror="this.onerror=null;this.src='https://www.agilegroup-digital.co.in/agile-logo.png'">
          </td>
          <td style="vertical-align:middle">
            <div class="co">Agile Security Force Private Limited</div>
            <div class="co-sub">Corporate Office · Security operations across India</div>
          </td>
          <td class="stamp" width="168" style="vertical-align:middle">
            <b>CONFIDENTIAL</b>
            <span>Prepared for HDFC Bank<br><a href="https://www.agilegroup.co.in">www.agilegroup.co.in</a></span>
          </td>
        </tr>
      </table>
      <div class="doc-bar">
        <span>SITE SECURITY ASSESSMENT (SSA) FORMAT</span>
        <span>External link: <a href="${LIVE}">www.agilegroup-digital.co.in/mis-hdfc-survey</a></span>
      </div>
    </header>
    <footer class="doc-footer">
      <div class="f1">
        <span>Agile Security Force Private Limited</span>
        <span>Confidential — for HDFC Bank</span>
        <span>www.SecurityJob.co.in</span>
      </div>
      <div class="f2">Digital Operations Command Centre — www.AgileGroup-digital.co.in · For Job Vacancies — www.SecurityJob.co.in</div>
      <div class="f3">${esc(SUITE_APP_FOOTER_LINE.replace(/\s*Agile Group leadership\.?$/i, '').trim())}<br>Agile Group Leadership.</div>
    </footer>
    <table class="flow"><thead><tr><td><div class="head-space"></div></td></tr></thead><tfoot><tr><td><div class="foot-space"></div></td></tr></tfoot><tbody><tr><td>
    <div class="sheet">
      <div class="title-card">
        <h1>Site Security Assessment Format — HDFC Bank</h1>
        <p>Official questionnaire for approval. This is the complete 15-section format used at every HDFC unit. Field staff complete it on phone (Android &amp; iPhone). No login.</p>
        <div class="meta">
          <div><b>Prepared by</b>Agile Security Force Private Limited</div>
          <div><b>Prepared for</b>HDFC Bank — Branch / ATM security assessment</div>
          <div><b>Document</b>SSA Format — all 15 sections</div>
          <div><b>Classification</b>Confidential — for HDFC Bank use</div>
        </div>
      </div>
      <div class="cover-box">
        <p style="margin:0 0 8px"><b>Site Security Assessment (SSA) — The "What" and "Where"</b></p>
        <p style="margin:0 0 8px">An SSA is a broad, investigative evaluation of a specific location. Its main goal is to identify existing security gaps, vulnerabilities, and potential threats to that particular site.</p>
        <ul style="margin:0 0 10px;padding-left:18px">
          <li><b>Focus:</b> Threats, vulnerabilities, and physical/operational risks unique to the location (e.g., weak perimeter fencing, poor lighting, blind spots in CCTV coverage, local crime rates).</li>
          <li><b>Objective:</b> To answer the question: "What are our security weaknesses here, and what could go wrong?"</li>
          <li><b>Output:</b> A baseline understanding of risk that helps management decide what security measures need to be implemented.</li>
          <li><b>Analogy (comparison):</b> Like a doctor conducting a general health checkup and diagnosing lifestyle risks for a patient.</li>
        </ul>
        <p style="margin:0 0 8px"><b>How the live assessment is completed</b></p>
        <ol style="margin:0;padding-left:18px">
          <li>Open the assessment → pick <b>Branch</b> → that branch’s <b>HDFC unit</b> → Risk Analyst details.</li>
          <li>Tap <b>Start Assessment</b> only after arrival at site (GPS).</li>
          <li>Complete <b>all 15 pages</b> with Previous / Next. Draft auto-saves.</li>
          <li><b>Submit to HOD</b> appears only on page 15, after all 15 pages are complete.</li>
        </ol>
      </div>
      ${body}
      <p class="note" style="margin-top:16px">This format does not include Strong Room, Emergency Exit, Branch Name / SOL ID / First Floor, ASO/LSG/SG present, Panic Switches count/status, Burglar Alarm, or old Fire extinguisher Type/Quantity columns.</p>
    </div>
    </td></tr></tbody></table>
  </div>
</body>
</html>`
}

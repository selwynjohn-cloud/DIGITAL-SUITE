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
<title>Agile Recruitment — Troubleshooting (Staff &amp; HOD)</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f3e8ff;color:#1e293b;font-size:15px;line-height:1.55}
a{color:#6d28d9}
.wrap{max-width:900px;margin:0 auto;padding:20px 16px 32px}
.topbar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px}
.btn{padding:10px 18px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:14px;text-decoration:none;display:inline-block}
.btn-purple{background:${RECRUIT_PURPLE};color:#fff}.btn-gold{background:${RECRUIT_GOLD};color:#14224f}
.hero{background:${RECRUIT_HDR_GRADIENT};color:#fff;border-radius:16px;padding:28px 24px;margin-bottom:22px;border-top:3px solid ${RECRUIT_GOLD};text-align:center}
.hero img{height:58px;margin-bottom:12px}
.hero h1{font-size:22px;color:#fde68a;font-weight:900}
.hero .sub{color:#e0f2fe;font-size:14px;margin-top:8px}
.card{background:#fff;border:3px solid ${RECRUIT_PURPLE};border-radius:14px;padding:20px;margin-bottom:18px}
.card h2{color:#5b21b6;font-size:17px;font-weight:900;margin-bottom:12px}
.sla{background:#fff7ed;border:3px solid #ea580c;border-radius:14px;padding:18px;margin-bottom:18px}
.sla h2{color:#c2410c;font-size:17px;font-weight:900;margin-bottom:8px}
.sla p,.sla li{font-size:14px;color:#7c2d12}
.sla ul{padding-left:22px;margin:8px 0}
.issue{background:#faf5ff;border:1px solid #c4b5fd;border-radius:12px;padding:16px;margin-bottom:14px}
.issue .q{color:${RECRUIT_PURPLE};font-weight:900;font-size:15px;margin-bottom:8px}
.issue .fix{color:#334155;font-size:14px}
.issue ol{padding-left:22px;margin-top:8px}
.issue li{margin:6px 0}
.quick table{width:100%;border-collapse:collapse;font-size:13px;margin-top:10px}
.quick th,.quick td{border:1px solid #c4b5fd;padding:10px;text-align:left}
.quick th{background:#f5f3ff;color:#5b21b6}
.share-hint{background:#f5f3ff;border:1px dashed ${RECRUIT_PURPLE};border-radius:10px;padding:14px;font-size:13px;color:#5b21b6;margin-bottom:18px}
.doc-ft{background:${RECRUIT_HDR_GRADIENT};border-top:3px solid ${RECRUIT_GOLD};border-radius:14px;padding:18px 16px;text-align:center;color:#e0f2fe;margin-top:8px}
.doc-ft .care{font-size:14px;font-weight:800;color:#fff;margin-bottom:8px}
.doc-ft .cursor{padding:10px 12px;background:rgba(255,255,255,.08);border-radius:8px;font-size:11px;line-height:1.55;font-style:italic;margin-top:10px}
@media print{.noprint{display:none!important}body{background:#fff}.card,.issue,.sla{border:1px solid #999}}
</style></head>
<body>
<div class="wrap">
  <div class="topbar noprint">
    <a href="/recruitment/manual" class="btn btn-purple">← User Guide</a>
    <button class="btn btn-gold" onclick="window.print()">⬇ Download / Print PDF</button>
    <button class="btn btn-purple" onclick="navigator.clipboard&&navigator.clipboard.writeText(location.href).then(function(){alert('Link copied')})">Copy link to share</button>
    <a href="/recruitment?portal=staff" class="btn btn-purple">Staff Portal</a>
    <a href="/recruitment?portal=management" class="btn btn-purple">Management Portal</a>
  </div>
  <div class="share-hint noprint"><b>Staff &amp; HODs:</b> Save as PDF from <b>Download / Print PDF</b>. Live link: <b>${SITE}/recruitment/troubleshooting</b></div>
  <div class="hero">
    <img src="${RECRUIT_BRAND.logoUrl}" alt="Agile">
    <h1>Troubleshooting — Staff &amp; HOD</h1>
    <div class="sub">Quick fixes for DRR · login · menu · history</div>
  </div>

  <div class="sla">
    <h2>Cannot find DRR on the left menu?</h2>
    <ul>
      <li>Scroll to the <b>bottom</b> of the left menu — DRR sits <b>below Publicity &amp; Camps</b>.</li>
      <li>Look for <b>Daily Recruitment Report (DRR)</b> then <b>DRR History</b>.</li>
      <li>The form is the Recruitment format: <b>New recruits · Transfers · Resignations</b> (not the short walk-in count page).</li>
      <li>If the page looks old: press <b>Cmd + Shift + R</b> (Mac) or open <b>${SITE}/recruitment?portal=staff&amp;fresh=1</b></li>
      <li>Do not use old Google Apps Script bookmarks — use Command Centre → Agile Recruitment</li>
    </ul>
  </div>

  <div class="card quick">
    <h2>⚡ Correct links</h2>
    <table>
      <tr><th>Need</th><th>Who</th><th>Open</th></tr>
      <tr><td>Staff / HOD portal</td><td>Branch HOD / recruiter</td><td>${SITE}/recruitment?portal=staff</td></tr>
      <tr><td>Management portal</td><td>Director / Management</td><td>${SITE}/recruitment?portal=management</td></tr>
      <tr><td>User Guide</td><td>Staff &amp; HODs</td><td>${SITE}/recruitment/manual</td></tr>
      <tr><td>This Troubleshooting</td><td>Staff &amp; HODs</td><td>${SITE}/recruitment/troubleshooting</td></tr>
      <tr><td>Public apply</td><td>Candidates (no login)</td><td>${RECRUIT_BRAND.publicFormUrl}</td></tr>
    </table>
  </div>

  <div class="card">
    <h2>Common issues</h2>

    <div class="issue">
      <div class="q">I do not see Daily Recruitment Report (DRR)</div>
      <div class="fix"><ol>
        <li>Confirm you opened <b>${SITE}/recruitment</b> (suite website), not Google or codewords.</li>
        <li>Scroll the left menu to the <b>bottom</b>.</li>
        <li>Hard refresh: <b>Cmd + Shift + R</b>, or add <b>&amp;fresh=1</b> to the address.</li>
        <li>Staff portal shows DRR for your branch; Management shows DRR near the bottom with branch picker.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q">PIN email not arriving</div>
      <div class="fix"><ol>
        <li>Use only <b>@agilegroup.co.in</b> work email.</li>
        <li>Check inbox and spam / promotions.</li>
        <li>Wait 1–2 minutes, then try <b>Send PIN</b> again.</li>
        <li>Make sure the address bar shows <b>www.agilegroup-digital.co.in</b> (not vercel.app).</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q">“Branch not set” when saving DRR</div>
      <div class="fix"><ol>
        <li>Log out.</li>
        <li>Open again from Command Centre → <b>HODs / Staff</b>.</li>
        <li>Select your branch before Send PIN.</li>
        <li>Management users: choose the branch from the dropdown on the DRR form.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q">I submitted DRR but cannot see it</div>
      <div class="fix"><ol>
        <li>Open <b>DRR History</b> (bottom of left menu).</li>
        <li>Check the report date and company (Agile / Sparks).</li>
        <li>Tap <b>Open</b> on that row to return to the same detailed report.</li>
        <li>Management: set branch filter to your branch or ALL.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q">I still see Walk-ins / Screened / Selected numbers</div>
      <div class="fix"><ol>
        <li>Hard refresh: <b>Cmd + Shift + R</b>, or add <b>&amp;fresh=1</b> to the address.</li>
        <li>You should see <b>New recruits</b>, <b>Transfers</b>, and <b>Resignations</b> — not Walk-ins / Screened / Selected.</li>
        <li>Fill <b>Referred by</b> for each new recruit, then <b>Review &amp; Save Detailed DRR</b>.</li>
      </ol></div>
    </div>

    <div class="issue">
      <div class="q">Opened wrong portal (Staff vs Management)</div>
      <div class="fix"><ol>
        <li>Branch HOD / recruiter → white <b>HODs / Staff</b> button.</li>
        <li>Director / HQ → dark <b>Management</b> button.</li>
        <li>If you see “Management portal only”, use the Staff link shown on screen.</li>
      </ol></div>
    </div>
  </div>

  <div class="doc-ft">
    <div class="care">${RECRUIT_BRAND.product} — ${RECRUIT_BRAND.company}</div>
    <div><a href="${SITE}/recruitment/manual" style="color:${RECRUIT_GOLD};text-decoration:none">User Guide</a> · Helpline ${RECRUIT_BRAND.helpline}</div>
    <div class="cursor">${RECRUIT_BRAND.footerCredit} · Confidential</div>
  </div>
</div>
</body></html>`

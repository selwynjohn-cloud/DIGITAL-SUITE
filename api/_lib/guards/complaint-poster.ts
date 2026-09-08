/**
 * Common Guards complaint poster — Agile Connect flyer.
 * QR opens /guards/register with no branch lock. Guard picks their branch.
 */

import { GUARDS_BRAND } from './brand.js'

export const GUARDS_COMMON_REGISTER_URL = `${GUARDS_BRAND.portalSite}/guards/register`
export const GUARDS_CONNECT_URL = `${GUARDS_BRAND.portalSite}/guards/connect`
export const GUARDS_CONNECT_URL_LABEL = 'www.agilegroup-digital.co.in/guards/connect'
export const GUARDS_COMMON_POSTER_URL = `${GUARDS_BRAND.portalSite}/guards/complaint-poster`
export const GUARDS_CONNECT_POSTER_IMAGE_URL = `${GUARDS_BRAND.portalSite}/guards-connect-poster.jpg`
export const GUARDS_CONNECT_LINKS_URL = `${GUARDS_BRAND.portalSite}/guards/links`

export const GUARDS_CONNECT_HELP_PHONE = '+91 8500915599'
export const GUARDS_CONNECT_CONTROL_PHONE = '+91 9248707070'
export const GUARDS_CONNECT_JOBS_URL = 'https://www.securityjob.co.in'
export const GUARDS_CONNECT_NEWS_URL = 'https://tinyurl.com/Security-News'
export const GUARDS_CONNECT_NEWS_LABEL = 'www.tinyurl.com/Security-News'

export function guardsCommonQrImageUrl(size = 520): string {
  const n = Math.min(800, Math.max(180, Number(size) || 520))
  return (
    `https://api.qrserver.com/v1/create-qr-code/?size=${n}x${n}` +
    `&margin=10&data=${encodeURIComponent(GUARDS_COMMON_REGISTER_URL)}`
  )
}

export function guardsComplaintPosterHtml(): string {
  const qr = guardsCommonQrImageUrl(480)
  const crest = `${GUARDS_BRAND.portalSite}/agile-logo-clear.png`
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Connect — Complaint QR (All Branches)</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#071428}
body{font-family:Arial,'Segoe UI',sans-serif;color:#fff}
.sheet{
  width:min(420px,100%);
  margin:0 auto;
  background:
    radial-gradient(circle at 88% 42%, rgba(30,75,140,.28), transparent 28%),
    linear-gradient(180deg,#0a2858 0%,#082047 48%,#061833 100%);
  display:flex;flex-direction:column;
  padding-bottom:0;
  border:4px solid #c9a227;
  box-sizing:border-box;
}
.banner{text-align:center;padding:16px 16px 10px}
.banner img{height:78px;width:auto;background:transparent;border:0;display:block;margin:0 auto 10px}
.banner .co{font-size:14px;font-weight:800;letter-spacing:.02em;line-height:1.35}
.banner .cmd{margin-top:4px;font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#f5d76e}
.banner h1{margin-top:12px;font-size:24px;font-weight:800;letter-spacing:.08em}
.main{padding:8px 16px 6px}
.navy-card{
  background:#0b2f66;
  border:2px solid #fff;
  border-radius:22px;
  padding:14px 14px 16px;
}
.qr-white{background:#fff;border-radius:16px;padding:10px}
.qr-white img{display:block;width:100%;max-width:210px;height:auto;margin:0 auto}
.connect-link{text-align:center;margin-top:10px;font-size:13px;font-weight:800;line-height:1.4}
.connect-link a{color:#f5d76e;text-decoration:underline;word-break:break-all}
.scan{text-align:center;margin-top:12px}
.scan h2{color:#f5d76e;font-size:13px;letter-spacing:.06em;font-weight:800;margin-bottom:6px}
.scan p{color:#fff;font-size:12px;line-height:1.45}
.promise{margin-top:12px;color:#fff;font-size:13px;line-height:1.45;text-align:center}
.team{margin-top:10px;text-align:center}
.team .who{color:#f5d76e;font-size:12px;font-weight:800}
.team .phones{margin-top:6px;color:#fff;font-size:14px;font-weight:800}
.team .phones a{color:#fff;text-decoration:none}
.links{margin-top:10px;text-align:center;font-size:13px;line-height:1.7}
.links a{color:#f5d76e;font-weight:800;text-decoration:none}
.honor{margin-top:12px;color:#f5d76e;font-size:13px;font-weight:800;text-align:center;line-height:1.4}
.open-form{display:block;margin:14px 8px 2px;background:linear-gradient(135deg,#1e3a8a,#38bdf8);color:#fff;font-weight:800;font-size:15px;text-align:center;text-decoration:none;border-radius:12px;padding:12px 10px}
.actions{padding:12px 16px 18px;display:flex;flex-wrap:wrap;gap:8px}
.actions a,.actions button{flex:1 1 140px;min-height:44px;border:none;border-radius:10px;font-weight:800;font-size:14px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;color:#14224f}
.actions .gold{background:linear-gradient(135deg,#b45309,#f59e0b)}
.actions .navy{background:linear-gradient(135deg,#1e3a8a,#38bdf8);color:#fff}
@media print{
  html,body{background:#fff}
  .sheet{width:100%;max-width:420px}
  .actions{display:none}
}
</style>
</head>
<body>
<div class="sheet">
  <div class="banner">
    <img src="${crest}" alt="Agile Group">
    <div class="co">Agile Security Force Private Limited,</div>
    <div class="cmd">Digital Operations Command Centre</div>
    <h1>AGILE CONNECT</h1>
  </div>
  <div class="main">
    <div class="navy-card">
      <div class="qr-white">
        <img src="${qr}" width="210" height="210" alt="Agile Connect QR — all branches">
      </div>
      <div class="connect-link">Connect — <a href="${GUARDS_CONNECT_URL}">${GUARDS_CONNECT_URL_LABEL}</a></div>
      <div class="scan">
        <h2>SCAN TO REGISTER YOUR COMPLAINT</h2>
        <p>Open your phone’s camera or QR scanner and point it at the code above.<br>Then pick <b>your branch</b> on the form. No login.</p>
      </div>
      <p class="promise">Give your Grievances. We would solve it within 24 hours.</p>
      <div class="team">
        <div class="who">Internal Customer Support Team</div>
        <div class="phones">Phone <a href="tel:+918500915599">${GUARDS_CONNECT_HELP_PHONE}</a> &amp; <a href="tel:+919248707070">${GUARDS_CONNECT_CONTROL_PHONE}</a></div>
      </div>
      <div class="links">
        Visit — <a href="${GUARDS_CONNECT_JOBS_URL}">www.securityjob.co.in</a><br>
        News Channel — <a href="${GUARDS_CONNECT_NEWS_URL}">${GUARDS_CONNECT_NEWS_LABEL}</a>
      </div>
      <p class="honor">Honouring Our Guards, who protect our clients Dream</p>
      <a class="open-form" href="${GUARDS_COMMON_REGISTER_URL}">Open Complaints form</a>
    </div>
  </div>
  <div class="actions">
    <a class="gold" href="${GUARDS_CONNECT_POSTER_IMAGE_URL}" download="Agile-Connect-poster.jpg">Save picture</a>
    <button type="button" class="gold" onclick="window.print()">Print / Save as PDF</button>
    <a class="navy" href="${GUARDS_COMMON_REGISTER_URL}">Open Complaints form</a>
  </div>
</div>
</body></html>`
}

/** Phone page — every address is a real tap (WhatsApp photo cannot do this). */
export function guardsConnectLinksHtml(): string {
  const crest = `${GUARDS_BRAND.portalSite}/agile-logo-clear.png`
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Connect — Open links</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#071428}
body{font-family:Arial,'Segoe UI',sans-serif;color:#fff;padding:16px}
.box{max-width:420px;margin:0 auto;border:4px solid #c9a227;border-radius:16px;padding:18px 16px 20px;background:#0a2858}
img{height:72px;width:auto;background:transparent;display:block;margin:0 auto 10px}
.co{text-align:center;font-weight:800;font-size:14px}
.cmd{text-align:center;color:#f5d76e;font-weight:800;font-size:12px;margin-top:4px;text-transform:uppercase}
h1{text-align:center;margin:12px 0 8px;font-size:22px;letter-spacing:.06em}
p{text-align:center;font-size:13px;line-height:1.45;margin-bottom:14px}
a.btn{display:block;text-decoration:none;font-weight:800;text-align:center;border-radius:12px;padding:14px 12px;margin:10px 0;min-height:48px}
.gold{background:linear-gradient(135deg,#b45309,#f59e0b);color:#14224f}
.navy{background:linear-gradient(135deg,#1e3a8a,#38bdf8);color:#fff}
.green{background:#166534;color:#fff}
.note{margin-top:12px;font-size:12px;color:#e8eef8;text-align:center}
</style>
</head>
<body>
<div class="box">
  <img src="${crest}" alt="Agile Group">
  <div class="co">Agile Security Force Private Limited,</div>
  <div class="cmd">Digital Operations Command Centre</div>
  <h1>AGILE CONNECT</h1>
  <p>Tap a button. Each one opens the right site.</p>
  <a class="btn navy" href="${GUARDS_CONNECT_URL}">Open Complaints form</a>
  <a class="btn gold" href="${GUARDS_CONNECT_JOBS_URL}">Visit — www.securityjob.co.in</a>
  <a class="btn green" href="${GUARDS_CONNECT_NEWS_URL}">News Channel — www.tinyurl.com/Security-News</a>
  <a class="btn navy" href="tel:+918500915599">Call ${GUARDS_CONNECT_HELP_PHONE}</a>
  <a class="btn navy" href="tel:+919248707070">Call ${GUARDS_CONNECT_CONTROL_PHONE}</a>
  <p class="note">Honouring Our Guards, who protect our clients Dream</p>
</div>
</body></html>`
}

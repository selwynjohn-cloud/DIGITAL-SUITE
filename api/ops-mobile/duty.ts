/**
 * Agile Mobile — Coming Soon (Director-only shadow; not for field teams yet).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Mobile — Coming Soon</title>
<style>
body{margin:0;min-height:100vh;font-family:'Segoe UI',Arial,sans-serif;background:linear-gradient(160deg,#0b1220,#14224f);color:#e2e8f0;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center}
h1{font-size:26px;margin:12px 0 8px} .badge{display:inline-block;padding:8px 16px;border-radius:999px;background:rgba(255,255,255,.12);color:#fde68a;font-weight:800;font-size:13px;letter-spacing:.06em;text-transform:uppercase}
p{color:#94a3b8;line-height:1.5;max-width:360px;margin:12px auto} a{color:#93c5fd;font-weight:700;text-decoration:none}
</style></head>
<body>
<div>
  <img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile" height="48">
  <h1>Agile Mobile</h1>
  <div class="badge">Coming Soon</div>
  <p>This application is not available yet. Please continue using your usual mobile app.</p>
  <p><a href="/">← Back to Command Centre</a></p>
</div>
</body></html>`)
}

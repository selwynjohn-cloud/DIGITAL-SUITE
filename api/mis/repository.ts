import type { VercelRequest, VercelResponse } from '@vercel/node'

/** Data Repository lives in Agile CRM — not MIS. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/crm"><title>Moved to Agile CRM</title></head><body style="font-family:Arial,sans-serif;padding:40px;text-align:center"><h1>Data Repository has moved</h1><p>Contract renewals, uniform issue, and security equipment follow-ups are now in <b>Agile CRM</b>.</p><p><a href="/crm">Open Agile CRM →</a></p></body></html>`)
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ojtGuardsLinkPageHtml } from '../_lib/training/ojt-guards-link-page.js'

/** Public Guards Training Link page — no login. */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const token = String(req.query.t ?? req.query.token ?? '').trim()
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(ojtGuardsLinkPageHtml(token))
}

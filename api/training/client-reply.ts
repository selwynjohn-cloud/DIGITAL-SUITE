import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ojtClientReplyPageHtml } from '../_lib/training/ojt-client-reply-page.js'

/** Public OJT client confirmation / reply page — no login. */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const token = String(req.query.t ?? req.query.token ?? '').trim()
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(ojtClientReplyPageHtml(token))
}

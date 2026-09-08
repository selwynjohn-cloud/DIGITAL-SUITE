import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ojtClientFeedbackPageHtml } from '../_lib/training/ojt-client-feedback-page.js'

/** Public OJT client feedback page — no login. */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const token = String(req.query.t ?? req.query.token ?? '').trim()
  const rating = String(req.query.r ?? req.query.rating ?? '').trim()
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(ojtClientFeedbackPageHtml(token, rating))
}

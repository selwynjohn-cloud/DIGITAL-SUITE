import type { VercelRequest, VercelResponse } from '@vercel/node'
import { guardsComplaintPosterHtml } from '../_lib/guards/complaint-poster.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(guardsComplaintPosterHtml())
}

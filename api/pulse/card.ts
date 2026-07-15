import type { VercelRequest, VercelResponse } from '@vercel/node'
import { renderCardHtml } from '../_lib/pulse/wa-cards.js'

/**
 * GET /api/pulse/card?type=thankyou|winner&name=...&week=2026-W27
 * Branded visual card — logo header, message, Agile Group footer, SecurityJob link.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const type = String(req.query.type ?? 'thankyou') === 'winner' ? 'winner' : 'thankyou'
  const name = String(req.query.name ?? 'Participant').slice(0, 80)
  const week = String(req.query.week ?? '').slice(0, 20)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  return res.status(200).send(renderCardHtml({ type, name, week }))
}

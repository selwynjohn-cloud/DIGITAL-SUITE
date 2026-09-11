import type { VercelRequest, VercelResponse } from '@vercel/node'
import { processTrainingInbound } from '../_lib/training/ojt-wa-inbound.js'

/**
 * Training Confirmation inbound (EOI / ATTENDANCE / YES / NO).
 * Does not change login, Pulse bulletin, or Recruitment PIN.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return res.status(200).json({ ok: true, app: 'training' })
  }
  if (req.method !== 'POST') return res.status(200).json({ ok: true })
  try {
    const raw = req.body
    const body =
      raw && typeof raw === 'object'
        ? (raw as Record<string, unknown>)
        : typeof raw === 'string'
          ? (JSON.parse(raw) as Record<string, unknown>)
          : {}
    const result = await processTrainingInbound(body)
    return res.status(200).json(result)
  } catch {
    return res.status(200).json({ ok: true })
  }
}

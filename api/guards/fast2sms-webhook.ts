import type { VercelRequest, VercelResponse } from '@vercel/node'
import { processTrainingInbound } from '../_lib/training/ojt-wa-inbound.js'

/**
 * Fast2SMS inbound (securityjob.co.in/api/guards/fast2sms-webhook).
 * Training EOI / ATTENDANCE / YES-NO first, then optional Recruitment forward.
 * Does not logout Pulse / news-bulletin WhatsApp.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return res.status(200).json({ ok: true, app: 'guards-fast2sms' })
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
    const result = await processTrainingInbound(body, { forwardUnmatched: true })
    return res.status(200).json(result)
  } catch {
    return res.status(200).json({ ok: true })
  }
}

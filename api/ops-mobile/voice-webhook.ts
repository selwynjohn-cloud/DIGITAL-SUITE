import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  dutyVerifyTwiml,
  handleVoiceDigit,
  handleVoiceNoAnswer,
  voiceWebhookTwiml,
} from '../_lib/ops-mobile/voice-check.js'

/**
 * Twilio voice webhook — random duty verification.
 * Press 1 = on duty · Press 2 = off duty
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const checkId = String(req.query.checkId ?? '').trim()
  const isStatus = req.query.status === '1'

  if (req.method === 'GET' && checkId && !isStatus) {
    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(dutyVerifyTwiml(checkId, 'Guard'))
  }

  if (req.method === 'POST') {
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>
    const digit = String(body.Digits ?? req.query.Digits ?? '').trim()
    const callStatus = String(body.CallStatus ?? '').trim()

    if (isStatus && checkId && (callStatus === 'no-answer' || callStatus === 'busy' || callStatus === 'failed')) {
      await handleVoiceNoAnswer(checkId)
      res.setHeader('Content-Type', 'text/xml')
      return res.status(200).send(voiceWebhookTwiml('Thank you. Goodbye.'))
    }

    if (checkId && digit) {
      await handleVoiceDigit(checkId, digit)
      res.setHeader('Content-Type', 'text/xml')
      const msg =
        digit === '1'
          ? 'Thank you. On duty recorded. Stay alert at your post. Goodbye.'
          : 'Thank you. Off duty noted. Goodbye.'
      return res.status(200).send(voiceWebhookTwiml(msg))
    }

    if (checkId && !digit) {
      await handleVoiceNoAnswer(checkId)
    }
  }

  res.setHeader('Content-Type', 'text/xml')
  return res.status(200).send(voiceWebhookTwiml('Goodbye.'))
}

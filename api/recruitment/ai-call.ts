/**
 * Twilio voice webhook — SecurityJob AI joining-date call (form Primary Language).
 * Never Fast2SMS. Does not change duty-check voice or login.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  applySjAiCallReply,
  loadSjAiCall,
  markSjAiCallAsked,
  markSjAiCallNoAnswer,
  sjAiAskTwiml,
  sjAiCallPhone,
  sjAiSayTwiml,
} from '../_lib/recruitment/sj-ai-call.js'
import { resolveSjAiVoice } from '../_lib/recruitment/sj-ai-call-voice.js'

export const maxDuration = 30

function baseUrl() {
  return (
    process.env.OPS_VOICE_WEBHOOK_BASE?.trim() ||
    process.env.HEALTH_CHECK_BASE_URL?.trim() ||
    'https://www.agilegroup-digital.co.in'
  ).replace(/\/$/, '')
}

function readBody(req: VercelRequest): Record<string, string> {
  const raw = req.body
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      out[k] = String(v ?? '')
    }
    return out
  }
  return {}
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/xml')
  const phone = sjAiCallPhone(String(req.query.k || req.query.phone || ''))
  const step = String(req.query.step || '').trim()
  const isStatus = String(req.query.status || '') === '1'
  const missed = String(req.query.missed || '') === '1'
  const body = readBody(req)

  if (!phone) {
    return res.status(200).send(sjAiSayTwiml('Goodbye.', 'English'))
  }

  if (isStatus) {
    const callStatus = String(body.CallStatus || '').toLowerCase()
    if (callStatus === 'no-answer' || callStatus === 'busy' || callStatus === 'failed' || callStatus === 'canceled') {
      await markSjAiCallNoAnswer(phone)
    }
    return res.status(200).send(sjAiSayTwiml('Goodbye.', 'English'))
  }

  const speech = String(body.SpeechResult || body.UnstableSpeechResult || '').trim()
  const digits = String(body.Digits || '').trim()
  const actionUrl = `${baseUrl()}/api/recruitment/ai-call?k=${encodeURIComponent(phone)}&step=again`

  if (speech || digits) {
    const result = await applySjAiCallReply({
      phone,
      speech,
      digits,
      finalRetry: step === 'again',
    })
    return res.status(200).send(result.twiml)
  }

  if (missed && step === 'again') {
    const row = await loadSjAiCall(phone)
    const lang = row?.language || 'English'
    return res.status(200).send(sjAiSayTwiml(resolveSjAiVoice(lang).teamWillCall, lang))
  }

  const row = (await markSjAiCallAsked(phone)) || (await loadSjAiCall(phone))
  const name = row?.name || 'friend'
  return res.status(200).send(sjAiAskTwiml(name, actionUrl, missed || step === 'again', row?.language || 'English'))
}

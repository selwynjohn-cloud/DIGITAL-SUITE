/**
 * Parse inbound WhatsApp (Fast2SMS / Whapi) and run Training EOI / ATTENDANCE / YES-NO first.
 * Does not touch Pulse bulletin webhook or login.
 */

import {
  forwardRecruitmentInboundToDirector,
  parseFast2smsInbound,
  type InboundWaMessage,
} from '../fast2sms/forward-to-director.js'
import { handleTrainingConfirmWaReply } from './ojt-wa-reply.js'

function parseWhapiMessages(body: Record<string, unknown>): InboundWaMessage[] {
  const messages = Array.isArray(body.messages) ? body.messages : []
  const out: InboundWaMessage[] = []
  for (const raw of messages) {
    const m = raw as {
      from?: string
      chat_id?: string
      id?: string
      type?: string
      body?: string
      text?: { body?: string }
      button?: { text?: string }
    }
    const from = String(m.from || m.chat_id || '').trim()
    const text = String(m.text?.body ?? m.body ?? m.button?.text ?? '').trim()
    if (!from || !text) continue
    out.push({
      from,
      body: text,
      messageType: String(m.type || 'text'),
      messageId: String(m.id || ''),
    })
  }
  return out
}

export function parseTrainingInbound(body: Record<string, unknown>): InboundWaMessage[] {
  const seen = new Set<string>()
  const out: InboundWaMessage[] = []
  for (const m of [...parseFast2smsInbound(body), ...parseWhapiMessages(body)]) {
    const k = `${m.messageId}|${m.from}|${m.body}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(m)
  }
  return out
}

export async function processTrainingInbound(
  body: Record<string, unknown>,
  opts?: { forwardUnmatched?: boolean },
): Promise<{ ok: true; messages: number; training: number; forwarded: number }> {
  const msgs = parseTrainingInbound(body)
  let training = 0
  let forwarded = 0
  for (const m of msgs) {
    const handled = await handleTrainingConfirmWaReply(m.from, m.body)
    if (handled) {
      training += 1
      continue
    }
    if (opts?.forwardUnmatched) {
      const fwd = await forwardRecruitmentInboundToDirector(m)
      if (fwd.ok && !fwd.skipped) forwarded += 1
    }
  }
  return { ok: true, messages: msgs.length, training, forwarded }
}

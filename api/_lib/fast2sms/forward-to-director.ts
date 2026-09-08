/**
 * Forward inbound Recruitment-cell WhatsApp (+91 94410 09091) to Director.
 * Prefer Whapi (Director linked phone — proven working), then Fast2SMS, then email.
 */
import { Resend } from 'resend'
import { fleetSendWhatsApp } from '../fleet/whatsapp-send.js'
import { redisCommand } from '../pulse/store.js'
import { adminWhatsAppPhone, waSendText, whatsappConfigured } from '../pulse/whatsapp.js'
import { pinMailFrom, sendSuiteEmail, suiteDirectorEmail } from '../suite-mail.js'
import { fast2smsMobile, fast2smsSenderMobile } from './whatsapp.js'

export type InboundWaMessage = {
  from: string
  body: string
  messageType?: string
  messageId?: string
  phoneNumberId?: string
}

/** Off by default — set RECRUITMENT_WA_FORWARD_TO_DIRECTOR=1 on Vercel to re-enable. */
export function recruitmentWaForwardEnabled(): boolean {
  const v = String(process.env.RECRUITMENT_WA_FORWARD_TO_DIRECTOR ?? '').trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

function formatFrom(raw: string): string {
  const d = fast2smsMobile(raw)
  if (d.length >= 12) return `+${d}`
  return raw || 'unknown'
}

async function alreadyForwarded(messageId: string): Promise<boolean> {
  if (!messageId) return false
  const key = `f2s:fwd:${messageId}`
  const prev = await redisCommand(['GET', key])
  if (prev?.result) return true
  await redisCommand(['SET', key, '1', 'EX', 86400])
  return false
}

async function logForward(entry: Record<string, unknown>) {
  try {
    const key = 'f2s:fwd:log'
    const prev = await redisCommand(['GET', key])
    let list: unknown[] = []
    if (prev?.result && typeof prev.result === 'string') {
      try {
        list = JSON.parse(prev.result) as unknown[]
      } catch {
        list = []
      }
    }
    list.unshift({ ...entry, ts: Date.now() })
    await redisCommand(['SET', key, JSON.stringify(list.slice(0, 40)), 'EX', 604800])
  } catch {
    /* ignore */
  }
}

/** Only skip the business sender line itself (not Director — they may test from their phone). */
function shouldSkip(from: string): boolean {
  const dest = fast2smsMobile(from)
  const sender = fast2smsSenderMobile()
  return Boolean(sender && dest === sender)
}

export async function forwardRecruitmentInboundToDirector(
  msg: InboundWaMessage,
): Promise<{ ok: boolean; skipped?: boolean; via?: string; error?: string }> {
  if (!recruitmentWaForwardEnabled()) {
    return { ok: true, skipped: true, error: 'Recruitment WA forward disabled' }
  }
  const from = String(msg.from ?? '').trim()
  const body = String(msg.body ?? '').trim()
  const type = String(msg.messageType ?? 'text').trim() || 'text'
  if (!from) return { ok: false, skipped: true, error: 'No from' }
  if (!body && type === 'text') return { ok: false, skipped: true, error: 'Empty body' }
  if (shouldSkip(from)) {
    await logForward({ skipped: true, reason: 'sender-line', from })
    return { ok: true, skipped: true }
  }

  const mid = String(msg.messageId ?? '').trim()
  if (mid && (await alreadyForwarded(mid))) {
    await logForward({ skipped: true, reason: 'duplicate', from, messageId: mid })
    return { ok: true, skipped: true }
  }

  const text = [
    '📩 *Recruitment WhatsApp — forwarded*',
    `From: ${formatFrom(from)}`,
    type !== 'text' ? `Type: ${type}` : '',
    '',
    body || '(no text — media/other message)',
  ]
    .filter(Boolean)
    .join('\n')

  const director = adminWhatsAppPhone()
  if (director.length < 12) {
    await logForward({ ok: false, error: 'ADMIN_WHATSAPP missing', from })
    return { ok: false, error: 'ADMIN_WHATSAPP missing' }
  }

  // 1) Whapi first — Director linked session (works for personal delivery)
  if (whatsappConfigured()) {
    const r = await waSendText(director, text)
    if (r?.ok) {
      await logForward({ ok: true, via: 'whapi', from, messageId: mid })
      return { ok: true, via: 'whapi' }
    }
  }

  // 2) Fast2SMS from Recruitment cell → Director
  const sent = await fleetSendWhatsApp(director, text)
  if (sent.ok) {
    await logForward({ ok: true, via: 'fast2sms', from, messageId: mid })
    return { ok: true, via: 'fast2sms' }
  }

  // 3) Email backup
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const emailTo = suiteDirectorEmail()
  if (apiKey && emailTo.includes('@')) {
    try {
      const resend = new Resend(apiKey)
      const mail = await sendSuiteEmail(resend, {
        from: pinMailFrom(),
        to: emailTo,
        subject: `Recruitment WhatsApp from ${formatFrom(from)}`,
        html: `<p><b>Forwarded from Recruitment cell (+91 94410 09091)</b></p>
          <p>From: ${formatFrom(from)}</p>
          <pre style="white-space:pre-wrap;background:#f1f5f9;padding:12px;border-radius:8px">${body
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')}</pre>`,
        skipDirectorCc: true,
      })
      if (!mail.error) {
        await logForward({ ok: true, via: 'email', from, messageId: mid })
        return { ok: true, via: 'email' }
      }
    } catch {
      /* ignore */
    }
  }

  await logForward({
    ok: false,
    from,
    messageId: mid,
    error: sent.error || 'Could not forward via Whapi, Fast2SMS, or email',
  })
  return { ok: false, error: sent.error || 'Could not forward via Whapi, Fast2SMS, or email' }
}

/** Parse Fast2SMS / Meta webhook body into inbound messages. */
export function parseFast2smsInbound(body: Record<string, unknown>): InboundWaMessage[] {
  const out: InboundWaMessage[] = []

  const reports = (body.whatsapp_reports as unknown[]) ?? []
  for (const row of reports) {
    const r = row as Record<string, unknown>
    const type = String(r.type ?? r.webhook_type ?? '').toLowerCase()
    // Accept incoming_message; also accept rows that look like inbound text even if type is blank
    const from = String(r.from ?? r.sender ?? r.mobile ?? '')
    const text = String(r.body ?? r.text ?? r.message ?? '').trim()
    const looksInbound =
      type === 'incoming_message' ||
      (!type && from && text) ||
      (type.includes('incoming') && from)
    // Skip pure delivery status rows
    if (type === 'status_update' || type === 'sent' || type === 'delivered' || type === 'read' || type === 'failed') {
      continue
    }
    if (!looksInbound || !from) continue
    out.push({
      from,
      body: text || `[${r.message_type || 'message'}]`,
      messageType: String(r.message_type ?? 'text'),
      messageId: String(r.message_id ?? r.request_id ?? r.id ?? ''),
      phoneNumberId: String(r.phone_number_id ?? ''),
    })
  }

  const wt = String(body.webhook_type ?? body.type ?? '').toLowerCase()
  if (
    wt === 'incoming_message' ||
    (body.body && (body.from || body.recipient_id || body.mobile))
  ) {
    out.push({
      from: String(body.from ?? body.recipient_id ?? body.mobile ?? ''),
      body: String(body.body ?? '').trim(),
      messageType: String(body.message_type ?? 'text'),
      messageId: String(body.message_id ?? ''),
      phoneNumberId: String(body.phone_number_id ?? ''),
    })
  }

  // Generic single-message shapes Fast2SMS sometimes uses
  if (!out.length && (body.message || body.text || body.msg)) {
    out.push({
      from: String(body.from ?? body.sender ?? body.mobile ?? body.number ?? ''),
      body: String(body.message ?? body.text ?? body.msg ?? body.body ?? '').trim(),
      messageType: String(body.message_type ?? body.type ?? 'text'),
      messageId: String(body.message_id ?? body.id ?? ''),
      phoneNumberId: String(body.phone_number_id ?? ''),
    })
  }

  const entries = (body.entry as unknown[]) ?? []
  for (const entry of entries) {
    const changes = ((entry as { changes?: unknown[] })?.changes ?? []) as unknown[]
    for (const ch of changes) {
      const value = (ch as { value?: { messages?: unknown[]; metadata?: { phone_number_id?: string } } })
        ?.value
      const phoneNumberId = String(value?.metadata?.phone_number_id ?? '')
      for (const m of value?.messages ?? []) {
        const msg = m as {
          from?: string
          id?: string
          type?: string
          text?: { body?: string }
          button?: { text?: string }
          interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } }
        }
        const from = String(msg.from ?? '')
        const text = String(
          msg.text?.body ??
            msg.button?.text ??
            msg.interactive?.button_reply?.title ??
            msg.interactive?.list_reply?.title ??
            '',
        ).trim()
        if (!from) continue
        out.push({
          from,
          body: text || `[${msg.type || 'message'}]`,
          messageType: String(msg.type ?? 'text'),
          messageId: String(msg.id ?? ''),
          phoneNumberId,
        })
      }
    }
  }

  const seen = new Set<string>()
  return out.filter((m) => {
    const k = `${m.messageId}|${m.from}|${m.body}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export async function readForwardLog(): Promise<unknown[]> {
  const d = await redisCommand(['GET', 'f2s:fwd:log'])
  if (!d?.result || typeof d.result !== 'string') return []
  try {
    return JSON.parse(d.result) as unknown[]
  } catch {
    return []
  }
}

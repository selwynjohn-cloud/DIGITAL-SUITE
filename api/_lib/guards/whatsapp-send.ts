import {
  fast2smsConfigured,
  fast2smsSameNumberBlock,
  fast2smsSendTextAndQr as f2sSend,
  fast2smsSendSessionText,
} from '../fast2sms/whatsapp.js'
import { waSendTextAndQr, whatsappConfigured } from '../pulse/whatsapp.js'

export type GuardWaSendResult = {
  ok: boolean
  provider?: 'fast2sms' | 'whapi'
  textOk?: boolean
  imgOk?: boolean
  imageOk?: boolean
  error?: string
  textError?: string
  imageError?: string
}

export type GuardWaSendOptions = { verifyDelivery?: boolean }

/** Prefer Fast2SMS (official) — fall back to Whapi if configured. */
export async function guardsSendWhatsApp(
  to: string,
  text: string,
  qrUrl?: string,
  options?: GuardWaSendOptions,
): Promise<GuardWaSendResult> {
  const qr = String(qrUrl ?? '').trim()
  const verifyDelivery = options?.verifyDelivery !== false
  const blocked = fast2smsSameNumberBlock(to)
  if (blocked) return { ok: false, provider: 'fast2sms', error: blocked }

  if (fast2smsConfigured()) {
    const r = await f2sSend(to, text, qr, verifyDelivery)
    if (r.ok) {
      return {
        ok: true,
        provider: 'fast2sms',
        textOk: r.textOk,
        imgOk: r.imgOk,
        imageOk: r.imgOk,
        error: r.error,
        textError: r.textError,
        imageError: r.imageError,
      }
    }
    // If Fast2SMS fails, try Whapi as backup
    if (!whatsappConfigured()) {
      return { ok: false, provider: 'fast2sms', error: r.error || 'Fast2SMS delivery failed' }
    }
  }

  if (whatsappConfigured()) {
    const r = await waSendTextAndQr(to, text, qr)
    return {
      ok: r.ok,
      provider: 'whapi',
      textOk: r.textOk,
      imgOk: r.imgOk,
      imageOk: r.imgOk,
      error: r.error,
      textError: r.textError,
      imageError: r.imageError,
    }
  }

  return { ok: false, error: 'WhatsApp not configured (add FAST2SMS_API_KEY on server)' }
}

export async function guardsSendWhatsAppPing(to: string, text: string): Promise<GuardWaSendResult> {
  const blocked = fast2smsSameNumberBlock(to)
  if (blocked) return { ok: false, provider: 'fast2sms', error: blocked }

  if (fast2smsConfigured()) {
    const r = await fast2smsSendSessionText(to, text)
    return { ok: r.ok, provider: 'fast2sms', error: r.error }
  }
  if (whatsappConfigured()) {
    const r = await waSendTextAndQr(to, text, '')
    return { ok: r.ok, provider: 'whapi', error: r.error }
  }
  return { ok: false, error: 'WhatsApp not configured' }
}

export function guardsWhatsAppReady(): boolean {
  return fast2smsConfigured() || whatsappConfigured()
}

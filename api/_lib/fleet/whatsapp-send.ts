import {
  fast2smsConfigured,
  fast2smsMobile,
  fast2smsSameNumberBlock,
  fast2smsSendTemplatePing,
} from '../fast2sms/whatsapp.js'
import { guardsSendWhatsApp, guardsWhatsAppReady } from '../guards/whatsapp-send.js'

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function fleetWhatsAppReady(): boolean {
  return guardsWhatsAppReady()
}

/** Approved template — opens WhatsApp chat before free-text (Recruitment cell line). */
export async function openFleetWhatsAppWindow(mobile: string): Promise<{ ok: boolean; error?: string }> {
  if (!fast2smsConfigured()) return { ok: false, error: 'FAST2SMS_API_KEY not set' }
  const dest = fast2smsMobile(mobile)
  if (dest.length < 12) return { ok: false, error: 'Invalid mobile number' }
  const templateId =
    process.env.FAST2SMS_FLEET_OPEN_TEMPLATE_ID?.trim() ||
    process.env.FAST2SMS_GUARDS_OPEN_TEMPLATE_ID?.trim() ||
    '24177'
  const r = await fast2smsSendTemplatePing(dest, templateId)
  await sleep(2500)
  if (!r.ok) return { ok: false, error: r.error || 'Template ping failed — ask recipient to reply Hi to Recruitment (+91 94410 09091)' }
  return { ok: true }
}

export type FleetWaSendResult = {
  ok: boolean
  apiSent: boolean
  provider?: 'fast2sms' | 'whapi'
  error?: string
}

/** Send via Fast2SMS (same path as Agile Guards) — template window then text. */
export async function fleetSendWhatsApp(
  mobile: string,
  text: string,
  windowOpened?: Set<string>,
): Promise<FleetWaSendResult> {
  const dest = fast2smsMobile(mobile)
  const ten = dest.slice(-10)
  if (ten.length !== 10) return { ok: false, apiSent: false, error: 'No valid 10-digit mobile number' }

  const block = fast2smsSameNumberBlock(mobile)
  if (block) return { ok: false, apiSent: false, error: block }

  if (!guardsWhatsAppReady()) {
    return { ok: false, apiSent: false, error: 'Fast2SMS not configured — add FAST2SMS_API_KEY on Vercel' }
  }

  if (!windowOpened?.has(ten)) {
    const open = await openFleetWhatsAppWindow(mobile)
    windowOpened?.add(ten)
    if (!open.ok && fast2smsConfigured()) {
      // Still try session text — template may have partially opened the window
    }
  }

  // verifyDelivery: true — Meta "accepted" alone is not enough (Director was missing messages)
  const r = await guardsSendWhatsApp(dest, text, '', { verifyDelivery: true })
  if (r.ok) return { ok: true, apiSent: true, provider: r.provider }
  return {
    ok: false,
    apiSent: false,
    provider: r.provider,
    error: r.error || r.textError || 'Fast2SMS could not deliver WhatsApp',
  }
}

/**
 * Fast2SMS WhatsApp Business API — official Meta Cloud API via Fast2SMS.
 * Env: FAST2SMS_API_KEY, FAST2SMS_WHATSAPP_PHONE_ID (optional — auto from WABA if missing)
 */

const BASE = 'https://www.fast2sms.com'

function apiKey(): string {
  return process.env.FAST2SMS_API_KEY?.trim() ?? ''
}

export function fast2smsConfigured(): boolean {
  return apiKey().length > 0
}

/** 10-digit or 91xxxxxxxxxx — Fast2SMS wants country code without + */
export function fast2smsMobile(raw: string): string {
  let d = String(raw ?? '').replace(/\D/g, '')
  if (d.startsWith('0') && d.length === 11) d = d.slice(1)
  if (d.length === 10) return `91${d}`
  if (d.length === 12 && d.startsWith('91')) return d
  return d
}

/** Recruitment cell +91 94410 09091 — same line used for bulk Fast2SMS campaigns. */
const DEFAULT_PHONE_ID = '1132692679917796'

const PHONE_ID_TO_MOBILE: Record<string, string> = {
  '1032052050001202': '917893692345',
  '1132692679917796': '919441009091',
  '1131932743342868': '919922133999',
  '1165119856686879': '15559653505',
}

function phoneNumberId(): string {
  return process.env.FAST2SMS_WHATSAPP_PHONE_ID?.trim() ?? DEFAULT_PHONE_ID
}

export function fast2smsSenderMobile(): string {
  const fromEnv = process.env.FAST2SMS_SENDER_MOBILE?.trim()
  if (fromEnv) return fast2smsMobile(fromEnv)
  return PHONE_ID_TO_MOBILE[phoneNumberId()] ?? ''
}

/** WhatsApp Business API cannot deliver to the same number as the sender line. */
export function fast2smsSameNumberBlock(to: string): string | undefined {
  const dest = fast2smsMobile(to)
  const sender = fast2smsSenderMobile()
  if (!dest || !sender) return undefined
  if (dest === sender) {
    return 'Cannot send WhatsApp to the same number as the business sender line. Use a different ADMIN_WHATSAPP mobile.'
  }
  return undefined
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

type F2sResponse = {
  ok: boolean
  status: number
  data: Record<string, unknown> | null
  error?: string
}

async function f2sFetch(path: string, init?: RequestInit): Promise<F2sResponse> {
  const key = apiKey()
  if (!key) return { ok: false, status: 0, data: null, error: 'Fast2SMS not configured' }

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      signal: AbortSignal.timeout(25000),
      headers: {
        Authorization: key,
        ...(init?.headers ?? {}),
      },
    })
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null
    const ok = Boolean(res.ok && (data?.return === true || data?.status === true || data?.success === true))
    const msg = data?.message
    const errText = Array.isArray(msg) ? msg.join('; ') : typeof msg === 'string' ? msg : data?.error
    return {
      ok,
      status: res.status,
      data,
      error: ok ? undefined : String(errText ?? `Fast2SMS error (${res.status})`),
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err instanceof Error ? err.message : 'Fast2SMS network error',
    }
  }
}

export async function fast2smsSendSessionText(to: string, text: string): Promise<F2sResponse> {
  const phoneId = phoneNumberId()
  const dest = fast2smsMobile(to)
  if (dest.length < 12) return { ok: false, status: 0, data: null, error: 'Invalid mobile number' }

  const body = JSON.stringify({
    type: 'text',
    text: String(text ?? '').slice(0, 4000),
  })

  return f2sFetch(
    `/dev/whatsapp-session?phone_number_id=${encodeURIComponent(phoneId)}&to=${encodeURIComponent(dest)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    },
  )
}

export async function fast2smsSendSessionImage(to: string, imageUrl: string): Promise<F2sResponse> {
  const phoneId = phoneNumberId()
  const dest = fast2smsMobile(to)
  if (dest.length < 12) return { ok: false, status: 0, data: null, error: 'Invalid mobile number' }
  const url = String(imageUrl ?? '').trim()
  if (!url) return { ok: false, status: 0, data: null, error: 'No image URL' }

  const body = JSON.stringify({ type: 'image', url })

  return f2sFetch(
    `/dev/whatsapp-session?phone_number_id=${encodeURIComponent(phoneId)}&to=${encodeURIComponent(dest)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    },
  )
}

type DeliveryRow = {
  status?: string
  status_description?: string
}

const SESSION_WINDOW_ERROR =
  'WhatsApp free-text needs a reply from the recipient within 24 hours. Ask them to send Hi to the Recruitment cell (+91 94410 09091), then try again — or use an approved template.'

/** Poll Fast2SMS DLR — API says "sent" even when Meta later rejects delivery. */
export async function fast2smsDeliveryStatus(requestId: string) {
  if (!requestId) return { ok: false, status: 'unknown', error: 'No request id', raw: null as unknown }
  const r = await f2sFetch(`/dev/whatsapp/${encodeURIComponent(requestId)}`, { method: 'GET' })
  const rows = ((r.data?.data as unknown[]) ?? []) as DeliveryRow[]
  const update = (rows.find((x) => x.status) ?? rows[0] ?? {}) as DeliveryRow & Record<string, unknown>
  const status = String(update?.status ?? '').toLowerCase()
  const desc = String(update?.status_description ?? update?.errors ?? update?.error ?? '')
  // Only delivered/read count — Meta "sent"/"accepted" often means queued, not on the phone.
  const delivered = status === 'delivered' || status === 'read'
  const failed = status === 'failed'
  const pending = !delivered && !failed
  return {
    ok: delivered && !failed,
    status: status || 'pending',
    description: desc,
    error: failed
      ? desc || 'WhatsApp delivery failed'
      : pending && (status === 'sent' || status === 'accepted')
        ? SESSION_WINDOW_ERROR
        : undefined,
    raw: r.data,
  }
}

/** List WABA numbers + approved templates (for diagnostics). */
export async function fast2smsListNumbers() {
  return f2sFetch('/dev/dlt_manager/whatsapp?type=number', { method: 'GET' })
}

export async function fast2smsListTemplates() {
  return f2sFetch('/dev/dlt_manager/whatsapp?type=template', { method: 'GET' })
}

async function waitForDelivery(requestId: string, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    await sleep(i === 0 ? 2500 : 2000)
    const d = await fast2smsDeliveryStatus(requestId)
    if (d.status === 'delivered' || d.status === 'read' || d.status === 'failed') return d
    if (d.status === 'pending' || !d.status) continue
    // sent/accepted — keep polling a bit; may become delivered
  }
  return fast2smsDeliveryStatus(requestId)
}

export async function fast2smsSendTemplate(
  to: string,
  messageId: string,
  variablesValues?: string,
  mediaUrl?: string,
) {
  const phoneId = phoneNumberId()
  const dest = fast2smsMobile(to)
  if (dest.length < 12) return { ok: false, status: 0, data: null, error: 'Invalid mobile number' }
  const params = new URLSearchParams({
    message_id: String(messageId),
    phone_number_id: phoneId,
    numbers: dest,
  })
  if (variablesValues?.trim()) params.set('variables_values', variablesValues.trim())
  if (mediaUrl?.trim()) params.set('media_url', mediaUrl.trim())
  return f2sFetch(`/dev/whatsapp?${params.toString()}`, { method: 'GET' })
}

/** Full text message, then QR image. Set verifyDelivery=false for faster sends (director samples). */
export async function fast2smsSendTextAndQr(
  to: string,
  text: string,
  qrUrl: string,
  verifyDelivery = true,
) {
  const textR = await fast2smsSendSessionText(to, text)
  const textReqId = String(textR.data?.request_id ?? textR.data?.requestId ?? '')
  let textOk = textR.ok
  let textError = textR.error
  if (verifyDelivery && textR.ok) {
    if (!textReqId) {
      textOk = false
      textError = 'Fast2SMS accepted the message but returned no delivery id — treat as not delivered'
    } else {
      const d = await waitForDelivery(textReqId)
      textOk = d.ok
      textError = d.error
      if (!textOk && (d.description?.includes('131047') || d.status === 'sent' || d.status === 'accepted')) {
        textError = SESSION_WINDOW_ERROR
      }
    }
  }

  await sleep(verifyDelivery ? 1500 : 800)
  let imgOk = true
  let imageError: string | undefined
  let imgReqId = ''
  if (qrUrl) {
    const imgR = await fast2smsSendSessionImage(to, qrUrl)
    imgReqId = String(imgR.data?.request_id ?? '')
    imgOk = imgR.ok
    imageError = imgR.error
    if (verifyDelivery && imgR.ok && imgReqId) {
      const d = await waitForDelivery(imgReqId)
      imgOk = d.ok
      imageError = d.error
      if (!imgOk && d.description?.includes('131047')) imageError = SESSION_WINDOW_ERROR
    }
  }

  return {
    ok: textOk || imgOk,
    provider: 'fast2sms' as const,
    textOk,
    imgOk,
    error: textOk || imgOk ? undefined : textError || imageError || 'Fast2SMS could not deliver',
    textError: textOk ? undefined : textError,
    imageError: imgOk ? undefined : imageError,
    requestId: textReqId || imgReqId,
  }
}

/** Approved template ping — works like bulk campaigns (no 24h window needed). */
export async function fast2smsSendTemplatePing(to: string, messageId: string) {
  const r = await fast2smsSendTemplate(to, messageId)
  const reqId = String(r.data?.request_id ?? '')
  if (!r.ok) return { ok: false, error: r.error || 'Template send failed' }
  if (!reqId) return { ok: true, requestId: reqId }
  const d = await waitForDelivery(reqId)
  return { ok: d.ok, requestId: reqId, error: d.error }
}

export async function fast2smsWabaStatus() {
  if (!fast2smsConfigured()) return { ok: false, error: 'FAST2SMS_API_KEY not set' }
  const r = await f2sFetch('/dev/dlt_manager/whatsapp?type=number', { method: 'GET' })
  const rows = (r.data?.data as unknown[]) ?? []
  const phoneId = phoneNumberId()
  const row = rows.find(
    (x) => String((x as { phone_number_id?: unknown })?.phone_number_id ?? '') === phoneId,
  ) as { number?: string; connection_status?: string; verified_name?: string } | undefined
  return {
    ok: r.ok,
    phoneNumberId: phoneId,
    number: row?.number,
    connectionStatus: row?.connection_status,
    verifiedName: row?.verified_name,
    error: r.error,
  }
}

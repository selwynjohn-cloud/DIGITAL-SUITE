import { redisCommand } from './store.js'

/**
 * Whapi.cloud gateway — lets the robot post into WhatsApp Channels and Groups
 * (which the official API cannot do).
 *
 * Two computer lines (buffer):
 * - primary  WHAPI_TOKEN        → news phone 9441009091
 * - spare    WHAPI_TOKEN_6626   → 7893692345 or 7093066626
 * Pairing the spare must never log out 9091.
 */

const BASE = 'https://gate.whapi.cloud'

export type WaChannel = 'primary' | 'buffer'

function tokenFor(channel: WaChannel = 'primary'): string {
  if (channel === 'buffer') {
    return process.env.WHAPI_TOKEN_6626?.trim() || process.env.WHAPI_TOKEN_BUFFER?.trim() || ''
  }
  return process.env.WHAPI_TOKEN?.trim() ?? ''
}

export function whatsappConfigured(): boolean {
  return tokenFor('primary').length > 0 || tokenFor('buffer').length > 0
}

export function whatsappBufferConfigured(): boolean {
  return tokenFor('buffer').length > 0
}

async function waFetch(
  path: string,
  init?: RequestInit,
  timeoutMs = 20000,
  channel: WaChannel = 'primary',
): Promise<{ ok: boolean; status: number; data: any } | null> {
  const t = tokenFor(channel)
  if (!t) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(BASE + path, {
      ...init,
      signal: controller.signal,
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
    const data = await res.json().catch(() => null)
    return { ok: res.ok, status: res.status, data }
  } catch {
    return { ok: false, status: 0, data: null }
  } finally {
    clearTimeout(timer)
  }
}

async function waFetchWithBuffer(
  path: string,
  init?: RequestInit,
  timeoutMs = 20000,
): Promise<{ ok: boolean; status: number; data: any } | null> {
  const first = await waFetch(path, init, timeoutMs, 'primary')
  if (first?.ok) return first
  if (!tokenFor('buffer')) return first
  const second = await waFetch(path, init, timeoutMs, 'buffer')
  if (second?.ok) return second
  return first ?? second
}

/** IT WhatsApp numbers — never receive suite alerts / copies. */
function itBlockedWhatsAppDigits(): Set<string> {
  const raw = [
    process.env.IT_WHATSAPP ?? '',
    process.env.IT_MOBILE ?? '',
    process.env.IT_PHONE ?? '',
  ].join(',')
  const set = new Set<string>()
  for (const part of raw.split(',')) {
    let d = part.replace(/\D/g, '')
    if (d.startsWith('0') && d.length === 11) d = d.slice(1)
    if (d.length === 10) d = `91${d}`
    if (d.length >= 10) set.add(d)
  }
  return set
}

function normalizeWaDigits(to: string): string {
  let d = String(to ?? '').replace(/\D/g, '')
  if (d.startsWith('0') && d.length === 11) d = d.slice(1)
  if (d.length === 10) d = `91${d}`
  return d
}

export function isItBlockedWhatsApp(to: string): boolean {
  const blocked = itBlockedWhatsAppDigits()
  if (!blocked.size) return false
  return blocked.has(normalizeWaDigits(to))
}

export function whatsappChatId(mobile: string): string {
  return normalizeWaDigits(mobile)
}

export function adminWhatsAppPhone(): string {
  return (
    process.env.DIRECTOR_WHATSAPP?.trim() ||
    process.env.ADMIN_WHATSAPP?.trim() ||
    process.env.PULSE_ADMIN_WHATSAPP?.trim() ||
    ''
  )
}

export async function waSendDirectorTest() {
  const to = adminWhatsAppPhone()
  if (!to) return { ok: false, phoneLast4: '', error: 'ADMIN_WHATSAPP is missing on the server.' }
  const r = await waSendText(to, 'Agile Pulse test ✓\n\nDirector WhatsApp check.\n— Agile Command Centre')
  return {
    ok: Boolean(r?.ok),
    phoneLast4: String(to).replace(/\D/g, '').slice(-4),
    error: r?.ok ? undefined : 'WhatsApp test failed',
  }
}

export async function waSendText(to: string, body: string) {
  if (isItBlockedWhatsApp(to)) {
    return { ok: false, status: 0, data: { skipped: true, reason: 'it-blocked' } }
  }
  return waFetchWithBuffer('/messages/text', { method: 'POST', body: JSON.stringify({ to, body }) })
}

/** Whapi tap-buttons. Falls back to numbered text on the same Whapi line. Never Fast2SMS. */
export async function waSendButtons(
  to: string,
  body: string,
  buttons: { id: string; title: string }[],
) {
  if (isItBlockedWhatsApp(to)) {
    return { ok: false, status: 0, data: { skipped: true, reason: 'it-blocked' } }
  }
  const chat = whatsappChatId(to)
  const list = buttons.slice(0, 3).map((b) => ({
    type: 'quick_reply',
    title: String(b.title || '').slice(0, 20),
    id: String(b.id || '').slice(0, 40),
  }))
  const r = await waFetchWithBuffer('/messages/interactive', {
    method: 'POST',
    body: JSON.stringify({
      to: chat,
      type: 'button',
      body: { text: body },
      action: { buttons: list },
    }),
  })
  if (r?.ok) return r
  const numbered = [body, '', 'Reply:', ...list.map((b, i) => `${i + 1} = ${b.title}`)].join('\n')
  return waSendText(chat, numbered)
}

export async function waSendTextAndQr(to: string, text: string, qrUrl?: string) {
  const qr = String(qrUrl ?? '').trim()
  if (qr) {
    const r = await waSendImageCard(to, qr, text)
    return {
      ok: Boolean(r?.ok),
      textOk: Boolean(r?.ok),
      imgOk: Boolean(r?.ok),
      error: r?.ok ? undefined : 'WhatsApp send failed',
    }
  }
  const r = await waSendText(to, text)
  return {
    ok: Boolean(r?.ok),
    textOk: Boolean(r?.ok),
    imgOk: false,
    error: r?.ok ? undefined : 'WhatsApp send failed',
  }
}

/** Send branded image card with caption (logo header graphic + message text). */
export async function waSendImageCard(to: string, mediaUrl: string, caption: string) {
  if (isItBlockedWhatsApp(to)) {
    return { ok: false, status: 0, data: { skipped: true, reason: 'it-blocked' } }
  }
  const r = await waFetchWithBuffer('/messages/image', {
    method: 'POST',
    body: JSON.stringify({ to, media: mediaUrl, caption }),
  })
  if (r?.ok) return r
  // Fallback — caption only if image gateway fails
  return waSendText(to, caption)
}

export async function waHealth() {
  return waFetch('/health?wakeup=true', { method: 'GET' }, 12000, 'primary')
}

async function waWakeWeb(channel: WaChannel = 'primary') {
  return waFetch('/health?wakeup=true&channel_type=web', { method: 'GET' }, 12000, channel)
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function waSettings() {
  return waFetch('/settings', { method: 'GET' })
}

function pickPhoneLast4(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  const user = o.user && typeof o.user === 'object' ? (o.user as Record<string, unknown>) : null
  const raw = String(user?.id || user?.phone || o.phone || o.wid || o.id || '')
  const d = raw.replace(/\D/g, '')
  return d.slice(-4)
}

export async function waLinkStatus(channel: WaChannel = 'primary') {
  const health = await waFetch('/health?wakeup=true', { method: 'GET' }, 12000, channel)
  const last4 = pickPhoneLast4(health?.data)
  const raw = health?.data as {
    status?: { text?: string; logged_in?: boolean; code?: number } | string
  } | null
  const status = raw?.status
  const text = typeof status === 'string' ? status : String(status?.text || '')
  const statusCode = typeof status === 'object' && status ? Number(status.code) : NaN
  const loggedIn = typeof status === 'object' && status?.logged_in === true
  /** Whapi status.code 3 / text QR = waiting to scan. A leftover last4 is not a live session. */
  const waitingForScan = statusCode === 3 || /^(qr|scan|login)$/i.test(text.trim())
  const linked = Boolean(
    health?.ok &&
      !waitingForScan &&
      (loggedIn || /auth|ok|connected|sync|online/i.test(text)),
  )
  return { linked, phoneLast4: last4, status: text || (health?.ok ? 'ok' : 'down'), channel }
}

export async function waBothLinkStatus() {
  const primary = await waLinkStatus('primary')
  const bufferConfigured = whatsappBufferConfigured()
  const buffer = bufferConfigured
    ? await waLinkStatus('buffer')
    : { linked: false, phoneLast4: '', status: 'not-set', channel: 'buffer' as const }
  return { primary, buffer, bufferConfigured }
}

function loginErrorMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  const nested = o.error && typeof o.error === 'object' ? (o.error as Record<string, unknown>) : null
  return String(nested?.message || nested?.details || o.message || o.error || '').trim()
}

export async function waLogout(channel: WaChannel = 'primary') {
  const post = await waFetch('/users/logout', { method: 'POST' }, 8000, channel)
  if (post?.ok || post?.status === 409) return post
  return waFetch('/users/logout', { method: 'DELETE' }, 8000, channel)
}

function connectFailReason(http: number, data: unknown, last4 = ''): string {
  const api = loginErrorMessage(data)
  if (http === 500 || /internal error/i.test(api)) {
    return 'WhatsApp is not ready yet. Wait 30 seconds, then tap Connect 9441009091 once more.'
  }
  if (http === 406) {
    return 'This WhatsApp line is set as a phone connection, so it cannot show a computer code.'
  }
  if (http === 409) {
    return last4 && last4 !== '9091'
      ? `WhatsApp is still connected to the number ending ${last4}. That is not 9441009091.`
      : 'WhatsApp is already connected.'
  }
  if (http === 422) return 'WhatsApp could not make the code. Tap Connect 9441009091 once more.'
  if (http === 0 || !http) return 'WhatsApp is not ready yet. Wait 30 seconds, then tap Connect 9441009091 once more.'
  if (/internal error/i.test(api)) {
    return 'WhatsApp is not ready yet. Wait 30 seconds, then tap Connect 9441009091 once more.'
  }
  return api || 'WhatsApp did not give a connect code. Tap Connect 9441009091 once more.'
}

function pickPairingCode(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  const inner = o.data && typeof o.data === 'object' ? (o.data as Record<string, unknown>) : o
  const raw = String(inner.code || inner.login || inner.auth_code || o.code || o.login || '')
  return raw.replace(/\s+/g, '').trim()
}

async function requestPairing(digits: string, channel: WaChannel = 'primary') {
  return waFetch(`/users/login/${encodeURIComponent(digits)}`, { method: 'GET' }, 20000, channel)
}

function loginResult(
  login: { ok: boolean; status: number; data: unknown } | null,
  wantLast4: string,
  linkedLast4: string,
) {
  const data = (login?.data && typeof login.data === 'object' ? login.data : {}) as Record<string, unknown>
  if (login?.status === 409) {
    const last4 = pickPhoneLast4(data) || linkedLast4
    if (last4 === wantLast4) {
      return {
        ok: true,
        alreadyAuthenticated: true,
        phoneLast4: last4,
        code: '',
        http: 409,
        error: undefined as string | undefined,
      }
    }
    return {
      ok: false,
      alreadyAuthenticated: false,
      phoneLast4: last4,
      code: '',
      http: 409,
      error: connectFailReason(409, data, last4),
    }
  }
  const code = pickPairingCode(data)
  return {
    ok: Boolean(code),
    alreadyAuthenticated: false,
    phoneLast4: wantLast4,
    code,
    http: login?.status ?? 0,
    error: code ? undefined : connectFailReason(login?.status ?? 0, data, linkedLast4),
  }
}

/** Pairing code — 9091 uses the news line; 6626 uses the spare line only (never logs out 9091). */
export async function waPairingCode(phone = '919441009091') {
  const digits = String(phone).replace(/\D/g, '')
  const wantLast4 = digits.slice(-4)
  const channel: WaChannel = wantLast4 === '6626' || wantLast4 === '2345' ? 'buffer' : 'primary'
  if (channel === 'buffer' && !tokenFor('buffer')) {
    return {
      ok: false,
      alreadyAuthenticated: false,
      phoneLast4: wantLast4,
      code: '',
      http: 503,
      error:
        'Spare WhatsApp line is not set yet. Add WHAPI_TOKEN_6626 on the server. The news phone (9091) was not disconnected.',
    }
  }
  const link = await waLinkStatus(channel)
  if (link.linked && link.phoneLast4 === wantLast4) {
    return {
      ok: true,
      alreadyAuthenticated: true,
      phoneLast4: link.phoneLast4,
      code: '',
      http: 409,
      error: undefined as string | undefined,
    }
  }
  if (link.linked && link.phoneLast4 && link.phoneLast4 !== wantLast4) {
    await waLogout(channel)
    await sleep(2500)
    await waWakeWeb(channel)
    await sleep(1500)
  }
  let login = await requestPairing(digits, channel)
  if (login?.status === 500 || login?.status === 0 || !login) {
    await sleep(2500)
    await waWakeWeb(channel)
    login = await requestPairing(digits, channel)
  }
  return loginResult(login, wantLast4, link.phoneLast4)
}

/** Pairing code so Director can link 9441009091. */
export async function waLoginQr() {
  try {
    const pair = await waPairingCode('919441009091')
    if (pair.alreadyAuthenticated || pair.code) {
      return {
        ok: Boolean(pair.alreadyAuthenticated || pair.code),
        alreadyAuthenticated: pair.alreadyAuthenticated,
        phoneLast4: pair.phoneLast4,
        qrDataUrl: '',
        qrImageUrl: '',
        code: pair.code,
        expire: null as number | null,
        source: pair.code ? 'code' : 'auth',
        http: pair.http,
        error: pair.error,
      }
    }
    if (pair.http === 500 || pair.http === 422 || pair.http === 0) {
      const login = await waFetch('/users/login?wakeup=true&size=400', { method: 'GET' }, 20000)
      const data = (login?.data && typeof login.data === 'object' ? login.data : {}) as Record<string, unknown>
      if (login?.status === 409) {
        const last4 = pickPhoneLast4(data) || pair.phoneLast4
        return {
          ok: last4 === '9091',
          alreadyAuthenticated: last4 === '9091',
          phoneLast4: last4,
          qrDataUrl: '',
          qrImageUrl: '',
          code: '',
          expire: null,
          source: 'auth',
          http: 409,
          error: last4 === '9091' ? undefined : connectFailReason(409, data, last4),
        }
      }
      let qr = String(data.qr || data.base64 || data.image || data.qr_code || '')
      if (qr && !qr.startsWith('data:') && !qr.startsWith('http') && qr.length > 40) {
        qr = `data:image/png;base64,${qr}`
      }
      const code = pickPairingCode(data)
      if (code || qr.startsWith('data:') || qr.startsWith('http')) {
        return {
          ok: true,
          alreadyAuthenticated: false,
          phoneLast4: pair.phoneLast4,
          qrDataUrl: qr.startsWith('data:') || qr.startsWith('http') ? qr : '',
          qrImageUrl: qr.startsWith('data:') || qr.startsWith('http') ? qr : '',
          code,
          expire: typeof data.expire === 'number' ? data.expire : null,
          source: code ? 'code' : 'image',
          http: login?.status ?? 0,
          error: undefined,
        }
      }
    }
    return {
      ok: false,
      alreadyAuthenticated: false,
      phoneLast4: pair.phoneLast4,
      qrDataUrl: '',
      qrImageUrl: '',
      code: '',
      expire: null,
      source: 'none',
      http: pair.http,
      error: pair.error || 'WhatsApp is not ready yet. Wait 30 seconds, then tap Connect 9441009091 once more.',
    }
  } catch {
    return {
      ok: false,
      alreadyAuthenticated: false,
      phoneLast4: '',
      qrDataUrl: '',
      qrImageUrl: '',
      code: '',
      expire: null,
      source: 'none',
      http: 0,
      error: 'WhatsApp is not ready yet. Wait 30 seconds, then tap Connect 9441009091 once more.',
    }
  }
}

export async function waListGroups() {
  return waFetchWithBuffer('/groups?count=500', { method: 'GET' })
}

export async function waCreateGroup(subject: string, participants: string[]) {
  return waFetch('/groups', {
    method: 'POST',
    body: JSON.stringify({ subject: subject.slice(0, 80), participants }),
  })
}

export async function waAddGroupParticipants(groupId: string, participants: string[]) {
  const id = String(groupId || '').trim()
  if (!id || !participants.length) return { ok: false, status: 0, data: null }
  return waFetch(`/groups/${encodeURIComponent(id)}/participants`, {
    method: 'POST',
    body: JSON.stringify({ participants }),
  })
}

export async function waGetGroup(groupId: string) {
  const id = String(groupId || '').trim()
  if (!id) return { ok: false, status: 0, data: null }
  return waFetch(`/groups/${encodeURIComponent(id)}`, { method: 'GET' })
}

/** Read or create the group invite link. Does not add members. */
export async function waGroupInvite(groupId: string) {
  const id = String(groupId || '').trim()
  if (!id) return { ok: false, status: 0, data: null }
  const get = await waFetch(`/groups/${encodeURIComponent(id)}/invite`, { method: 'GET' })
  if (get?.ok) return get
  return waFetch(`/groups/${encodeURIComponent(id)}/invite`, { method: 'POST' })
}

/** Group picture — URL or data URL. */
export async function waSetGroupIcon(groupId: string, mediaUrl: string, mimeType = 'image/png') {
  return waFetch(`/groups/${encodeURIComponent(groupId)}/icon`, {
    method: 'PUT',
    body: JSON.stringify({ media: mediaUrl, mime_type: mimeType }),
  })
}

export async function waListChannels() {
  return waFetch('/newsletters?count=200', { method: 'GET' })
}

/* ---- pending edition awaiting the admin's OK ---- */

const PENDING_KEY = 'pulse:pending'

export type PendingEdition = { edition: string; date: string; msg1: string; msg2: string; ts: number }

export async function setPending(p: PendingEdition) {
  await redisCommand(['SET', PENDING_KEY, JSON.stringify(p), 'EX', 36000])
}

export async function getPending(): Promise<PendingEdition | null> {
  const d = await redisCommand(['GET', PENDING_KEY])
  if (d?.result && typeof d.result === 'string') {
    try {
      return JSON.parse(d.result) as PendingEdition
    } catch {
      return null
    }
  }
  return null
}

export async function clearPending() {
  await redisCommand(['DEL', PENDING_KEY])
}

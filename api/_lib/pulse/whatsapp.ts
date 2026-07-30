import { redisCommand } from './store.js'

/**
 * Whapi.cloud gateway — lets the robot post into WhatsApp Channels and Groups
 * (which the official API cannot do). Configured via env WHAPI_TOKEN.
 */

const BASE = 'https://gate.whapi.cloud'

function token(): string {
  return process.env.WHAPI_TOKEN?.trim() ?? ''
}

export function whatsappConfigured(): boolean {
  return token().length > 0
}

async function waFetch(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: any } | null> {
  const t = token()
  if (!t) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
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

export async function waSendText(to: string, body: string) {
  return waFetch('/messages/text', { method: 'POST', body: JSON.stringify({ to, body }) })
}

/** Send branded image card with caption (logo header graphic + message text). */
export async function waSendImageCard(to: string, mediaUrl: string, caption: string) {
  const r = await waFetch('/messages/image', {
    method: 'POST',
    body: JSON.stringify({ to, media: mediaUrl, caption }),
  })
  if (r?.ok) return r
  // Fallback — caption only if image gateway fails
  return waSendText(to, caption)
}

export async function waHealth() {
  return waFetch('/health', { method: 'GET' })
}

export async function waListGroups() {
  return waFetch('/groups?count=500', { method: 'GET' })
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

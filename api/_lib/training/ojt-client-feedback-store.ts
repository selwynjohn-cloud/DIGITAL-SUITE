/**
 * Client feedback link for OJT completion report —
 * “Overall, how was the OJT beneficial to our security operations?”
 */

import { nid } from '../mis/store.js'
import type { OjtSession } from './ojt-store.js'

const LINK_KEY = 'training:ojt-client-feedback:'
const SESSION_TOKEN_KEY = 'training:ojt-client-feedback-session:'

export const OJT_CLIENT_BENEFIT_OPTIONS = [
  'Highly Beneficial',
  'Beneficial',
  'Needs Improvement',
] as const

export type OjtClientBenefitRating = (typeof OJT_CLIENT_BENEFIT_OPTIONS)[number]

export type OjtClientFeedbackMeta = {
  token: string
  sessionId: string
  branchId: string
  month: string
  clientName: string
  clientEmail: string
  location: string
  trainingDate: string
  trainingTime: string
  trainerName: string
  createdAt: string
  updatedAt: string
}

export type OjtClientFeedbackRecord = {
  rating: OjtClientBenefitRating
  repliedAt: string
  repliedIp: string
  personName: string
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

async function redis(command: unknown[]): Promise<{ result?: unknown } | null> {
  const cfg = redisConfig()
  if (!cfg) return null
  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    })
    if (!res.ok) return null
    return (await res.json()) as { result?: unknown }
  } catch {
    return null
  }
}

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const d = await redis(['GET', key])
  if (d?.result && typeof d.result === 'string') {
    try {
      return JSON.parse(d.result) as T
    } catch {
      return fallback
    }
  }
  return fallback
}

async function setJson(key: string, value: unknown): Promise<boolean> {
  const d = await redis(['SET', key, JSON.stringify(value)])
  return d?.result === 'OK'
}

function newToken(): string {
  return nid('ojtf').replace(/[^a-zA-Z0-9]/g, '') + Date.now().toString(36)
}

export function clientFeedbackPublicUrl(
  token: string,
  origin = 'https://www.agilegroup-digital.co.in',
  rating?: string,
): string {
  const base = String(origin || '').replace(/\/$/, '') || 'https://www.agilegroup-digital.co.in'
  const r = String(rating || '').trim()
  const q = r
    ? `t=${encodeURIComponent(token)}&r=${encodeURIComponent(r)}`
    : `t=${encodeURIComponent(token)}`
  return `${base}/training/client-feedback?${q}`
}

export function normalizeBenefitRating(raw: unknown): OjtClientBenefitRating | '' {
  const s = String(raw || '').trim()
  if ((OJT_CLIENT_BENEFIT_OPTIONS as readonly string[]).includes(s)) {
    return s as OjtClientBenefitRating
  }
  const lower = s.toLowerCase()
  if (lower.includes('highly')) return 'Highly Beneficial'
  if (lower.includes('need')) return 'Needs Improvement'
  if (lower.includes('beneficial')) return 'Beneficial'
  return ''
}

export async function getClientFeedbackMeta(token: string): Promise<OjtClientFeedbackMeta | null> {
  const t = String(token || '').trim()
  if (!t) return null
  const meta = await getJson<OjtClientFeedbackMeta | null>(LINK_KEY + t, null)
  return meta?.token ? meta : null
}

export async function getTokenForClientFeedbackSession(sessionId: string): Promise<string> {
  return String((await getJson<string>(SESSION_TOKEN_KEY + sessionId, '')) || '').trim()
}

export async function prepareClientFeedbackLink(
  session: OjtSession,
  month: string,
  origin?: string,
): Promise<{ ok: true; meta: OjtClientFeedbackMeta; url: string } | { ok: false; error: string }> {
  let token = await getTokenForClientFeedbackSession(session.id)
  let meta = token ? await getClientFeedbackMeta(token) : null
  const now = new Date().toISOString()
  if (!meta?.token) {
    token = newToken()
    meta = {
      token,
      sessionId: session.id,
      branchId: session.branchId,
      month: String(month || '').slice(0, 7),
      clientName: session.clientName,
      clientEmail: session.clientEmail,
      location: session.location,
      trainingDate: session.trainingDate,
      trainingTime: session.trainingTime,
      trainerName: session.trainerName,
      createdAt: now,
      updatedAt: now,
    }
    const ok1 = await setJson(LINK_KEY + token, meta)
    const ok2 = await setJson(SESSION_TOKEN_KEY + session.id, token)
    if (!ok1 || !ok2) return { ok: false, error: 'Could not prepare client feedback link.' }
  } else {
    meta = {
      ...meta,
      branchId: session.branchId,
      month: String(month || meta.month || '').slice(0, 7),
      clientName: session.clientName,
      clientEmail: session.clientEmail,
      location: session.location,
      trainingDate: session.trainingDate,
      trainingTime: session.trainingTime,
      trainerName: session.trainerName,
      updatedAt: now,
    }
    await setJson(LINK_KEY + token, meta)
  }
  return { ok: true, meta, url: clientFeedbackPublicUrl(token, origin) }
}

export async function saveClientFeedbackRecord(
  token: string,
  reply: OjtClientFeedbackRecord,
): Promise<boolean> {
  return setJson(`${LINK_KEY}${token}:last`, reply)
}

export async function loadClientFeedbackRecord(
  token: string,
): Promise<OjtClientFeedbackRecord | null> {
  const r = await getJson<OjtClientFeedbackRecord | null>(`${LINK_KEY}${token}:last`, null)
  const rating = normalizeBenefitRating(r?.rating)
  if (!rating || !r?.repliedAt) return null
  return {
    rating,
    repliedAt: String(r.repliedAt || ''),
    repliedIp: String(r.repliedIp || ''),
    personName: String(r.personName || '').slice(0, 120),
  }
}

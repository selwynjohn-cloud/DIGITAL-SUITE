/**
 * Client reply link for OJT intimation — confirm / add topic / change date-time.
 */

import { nid } from '../mis/store.js'
import type { OjtSession } from './ojt-store.js'

const LINK_KEY = 'training:ojt-client-reply:'
const SESSION_TOKEN_KEY = 'training:ojt-client-reply-session:'

export type OjtClientReplyAction =
  | 'confirm'
  | 'addTopic'
  | 'changeSchedule'
  | 'removeTopic'
  | 'changeRequired'

export type OjtClientReplyMeta = {
  token: string
  sessionId: string
  branchId: string
  month: string
  clientName: string
  clientEmail: string
  location: string
  trainingDate: string
  trainingTime: string
  topics: string
  trainerName: string
  createdAt: string
  updatedAt: string
}

export type OjtClientReplyRecord = {
  action: OjtClientReplyAction
  topicName: string
  removeTopicName: string
  newDate: string
  newTime: string
  note: string
  repliedAt: string
  repliedIp: string
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
  return nid('ojtr').replace(/[^a-zA-Z0-9]/g, '') + Date.now().toString(36)
}

export function clientReplyPublicUrl(token: string, origin = 'https://www.agilegroup-digital.co.in'): string {
  const base = String(origin || '').replace(/\/$/, '') || 'https://www.agilegroup-digital.co.in'
  return `${base}/training/client-reply?t=${encodeURIComponent(token)}`
}

export async function getClientReplyMeta(token: string): Promise<OjtClientReplyMeta | null> {
  const t = String(token || '').trim()
  if (!t) return null
  const meta = await getJson<OjtClientReplyMeta | null>(LINK_KEY + t, null)
  return meta?.token ? meta : null
}

export async function getTokenForClientReplySession(sessionId: string): Promise<string> {
  return String((await getJson<string>(SESSION_TOKEN_KEY + sessionId, '')) || '').trim()
}

export async function prepareClientReplyLink(
  session: OjtSession,
  month: string,
): Promise<{ ok: true; meta: OjtClientReplyMeta; url: string } | { ok: false; error: string }> {
  let token = await getTokenForClientReplySession(session.id)
  let meta = token ? await getClientReplyMeta(token) : null
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
      topics: session.topics,
      trainerName: session.trainerName,
      createdAt: now,
      updatedAt: now,
    }
    const ok1 = await setJson(LINK_KEY + token, meta)
    const ok2 = await setJson(SESSION_TOKEN_KEY + session.id, token)
    if (!ok1 || !ok2) return { ok: false, error: 'Could not prepare client reply link.' }
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
      topics: session.topics,
      trainerName: session.trainerName,
      updatedAt: now,
    }
    await setJson(LINK_KEY + token, meta)
  }
  return { ok: true, meta, url: clientReplyPublicUrl(token) }
}

export async function saveClientReplyRecord(
  token: string,
  reply: OjtClientReplyRecord,
): Promise<boolean> {
  return setJson(`${LINK_KEY}${token}:last`, reply)
}

export async function loadClientReplyRecord(token: string): Promise<OjtClientReplyRecord | null> {
  const r = await getJson<OjtClientReplyRecord | null>(`${LINK_KEY}${token}:last`, null)
  if (!r?.action) return null
  return {
    action: r.action,
    topicName: String(r.topicName || ''),
    removeTopicName: String((r as { removeTopicName?: string }).removeTopicName || ''),
    newDate: String(r.newDate || ''),
    newTime: String(r.newTime || ''),
    note: String(r.note || ''),
    repliedAt: String(r.repliedAt || ''),
    repliedIp: String(r.repliedIp || ''),
  }
}

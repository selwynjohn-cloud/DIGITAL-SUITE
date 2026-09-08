/**
 * Branch pack for HDFC FA advisory + training report.
 * OM review → HOD approve → send Training report link.
 */

import { randomBytes } from 'node:crypto'
import { FA_HDFC_REPORT_URL } from './fa-advisory-i18n.js'

const PACK_KEY = 'training:fa-hdfc-pack:'
const TOKEN_KEY = 'training:fa-hdfc-token:'

export type FaHdfcPackStatus = 'collecting' | 'om_reviewed' | 'hod_approved' | 'sent'

export type FaHdfcPack = {
  branchId: string
  branchName: string
  token: string
  status: FaHdfcPackStatus
  omName: string
  omAt: string
  hodName: string
  hodAt: string
  fromYmd: string
  toYmd: string
  advCount: number
  trainCount: number
  sentAt: string
  sentTo: string[]
  sentBy: string
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

async function delKey(key: string): Promise<void> {
  await redis(['DEL', key])
}

function newToken(): string {
  return randomBytes(18).toString('hex')
}

export function faHdfcReportLink(token: string): string {
  const t = String(token || '').trim()
  if (!t) return ''
  return `${FA_HDFC_REPORT_URL}?t=${encodeURIComponent(t)}`
}

export function faHdfcIstStamp(now = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
    .format(now)
    .replace(',', '')
}

function emptyPack(branchId: string, branchName: string): FaHdfcPack {
  return {
    branchId,
    branchName,
    token: '',
    status: 'collecting',
    omName: '',
    omAt: '',
    hodName: '',
    hodAt: '',
    fromYmd: '',
    toYmd: '',
    advCount: 0,
    trainCount: 0,
    sentAt: '',
    sentTo: [],
    sentBy: '',
  }
}

export function faHdfcEffectiveStatus(
  pack: FaHdfcPack | null,
  advCount: number,
  trainCount: number,
): FaHdfcPackStatus {
  if (!pack || pack.status === 'collecting') return 'collecting'
  const grew = advCount > (pack.advCount || 0) || trainCount > (pack.trainCount || 0)
  if (grew) return 'collecting'
  return pack.status
}

export function faHdfcStatusLabel(status: FaHdfcPackStatus): string {
  if (status === 'om_reviewed') return 'OM reviewed'
  if (status === 'hod_approved') return 'HOD approved'
  if (status === 'sent') return 'Sent to HDFC'
  return 'Collecting'
}

export async function loadFaHdfcPack(branchId: string): Promise<FaHdfcPack | null> {
  const bid = String(branchId || '').trim()
  if (!bid) return null
  const raw = await getJson<FaHdfcPack | null>(PACK_KEY + bid, null)
  if (!raw || typeof raw !== 'object') return null
  return { ...emptyPack(bid, String(raw.branchName || '')), ...raw, branchId: bid }
}

export async function findFaHdfcPackByToken(token: string): Promise<FaHdfcPack | null> {
  const t = String(token || '').trim()
  if (!t || t.length < 16) return null
  const bid = await getJson<string>(TOKEN_KEY + t, '')
  if (!String(bid || '').trim()) return null
  const pack = await loadFaHdfcPack(String(bid))
  if (!pack || pack.token !== t) return null
  return pack
}

async function writePack(pack: FaHdfcPack): Promise<FaHdfcPack> {
  await setJson(PACK_KEY + pack.branchId, pack)
  if (pack.token) await setJson(TOKEN_KEY + pack.token, pack.branchId)
  return pack
}

export async function ensureFaHdfcToken(pack: FaHdfcPack): Promise<FaHdfcPack> {
  if (pack.token) return pack
  const next = { ...pack, token: newToken() }
  return writePack(next)
}

export async function saveFaHdfcOmReview(opts: {
  branchId: string
  branchName: string
  omName: string
  fromYmd: string
  toYmd: string
  advCount: number
  trainCount: number
}): Promise<FaHdfcPack> {
  const name = String(opts.omName || '').trim().slice(0, 80)
  const bid = String(opts.branchId || '').trim()
  const prev = (await loadFaHdfcPack(bid)) || emptyPack(bid, opts.branchName)
  const next: FaHdfcPack = {
    ...prev,
    branchName: String(opts.branchName || prev.branchName || '').trim(),
    status: 'om_reviewed',
    omName: name,
    omAt: faHdfcIstStamp(),
    hodName: '',
    hodAt: '',
    fromYmd: String(opts.fromYmd || '').slice(0, 10),
    toYmd: String(opts.toYmd || '').slice(0, 10),
    advCount: Math.max(0, Number(opts.advCount) || 0),
    trainCount: Math.max(0, Number(opts.trainCount) || 0),
  }
  if (!next.token) next.token = newToken()
  return writePack(next)
}

export async function saveFaHdfcHodApprove(opts: {
  branchId: string
  hodName: string
  fromYmd: string
  toYmd: string
  advCount: number
  trainCount: number
}): Promise<FaHdfcPack | { error: string }> {
  const name = String(opts.hodName || '').trim().slice(0, 80)
  const pack = await loadFaHdfcPack(opts.branchId)
  const status = faHdfcEffectiveStatus(pack, opts.advCount, opts.trainCount)
  if (!pack || status === 'collecting') {
    return { error: 'OM must review this branch list first.' }
  }
  const next: FaHdfcPack = {
    ...pack,
    status: 'hod_approved',
    hodName: name,
    hodAt: faHdfcIstStamp(),
    fromYmd: String(opts.fromYmd || pack.fromYmd || '').slice(0, 10),
    toYmd: String(opts.toYmd || pack.toYmd || '').slice(0, 10),
    advCount: Math.max(0, Number(opts.advCount) || 0),
    trainCount: Math.max(0, Number(opts.trainCount) || 0),
  }
  if (!next.token) next.token = newToken()
  return writePack(next)
}

export async function saveFaHdfcSent(opts: {
  branchId: string
  sentTo: string[]
  sentBy: string
  fromYmd: string
  toYmd: string
  advCount: number
  trainCount: number
}): Promise<FaHdfcPack | { error: string }> {
  const pack = await loadFaHdfcPack(opts.branchId)
  const status = faHdfcEffectiveStatus(pack, opts.advCount, opts.trainCount)
  if (!pack || status === 'collecting') {
    if (pack && (pack.omName || pack.hodName || pack.sentAt)) {
      return { error: 'The list grew. OM must review again, then HOD approve.' }
    }
    return { error: 'OM must review this branch list first.' }
  }
  if (status === 'om_reviewed') return { error: 'HOD must approve this branch list before sending.' }
  const next: FaHdfcPack = {
    ...pack,
    status: 'sent',
    sentAt: faHdfcIstStamp(),
    sentTo: opts.sentTo.slice(0, 5),
    sentBy: String(opts.sentBy || '').trim().slice(0, 80),
    fromYmd: String(opts.fromYmd || pack.fromYmd || '').slice(0, 10),
    toYmd: String(opts.toYmd || pack.toYmd || '').slice(0, 10),
    advCount: Math.max(0, Number(opts.advCount) || 0),
    trainCount: Math.max(0, Number(opts.trainCount) || 0),
  }
  if (!next.token) next.token = newToken()
  return writePack(next)
}

export async function dropFaHdfcToken(token: string): Promise<void> {
  const t = String(token || '').trim()
  if (t) await delKey(TOKEN_KEY + t)
}

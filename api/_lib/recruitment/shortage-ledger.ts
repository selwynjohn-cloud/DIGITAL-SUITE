/**
 * Daily shortage opening / closing ledger for Recruitment.
 * Tomorrow's opening balance = today's closing (Vacant + OT).
 */

import { RECRUIT_BRANCHES } from './store.js'

const KEY_PREFIX = 'recruit:shortage-snap:'

export type ShortageBranchSnap = {
  branch: string
  vac: number
  ot: number
  shortage: number
}

export type ShortageDaySnap = {
  date: string
  vac: number
  ot: number
  shortage: number
  byBranch: ShortageBranchSnap[]
  savedAt: string
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

function n(v: unknown): number {
  const x = Math.floor(Number(v) || 0)
  return x < 0 ? 0 : x
}

export function normaliseShortageSnap(raw: Partial<ShortageDaySnap> | null, date: string): ShortageDaySnap | null {
  if (!raw || typeof raw !== 'object') return null
  const byBranch = Array.isArray(raw.byBranch)
    ? raw.byBranch.map((b) => ({
        branch: String(b.branch || ''),
        vac: n(b.vac),
        ot: n(b.ot),
        shortage: n(b.shortage) || n(b.vac) + n(b.ot),
      }))
    : []
  return {
    date: String(raw.date || date).slice(0, 10),
    vac: n(raw.vac),
    ot: n(raw.ot),
    shortage: n(raw.shortage) || n(raw.vac) + n(raw.ot),
    byBranch,
    savedAt: String(raw.savedAt || ''),
  }
}

export async function getShortageSnap(ymd: string): Promise<ShortageDaySnap | null> {
  const d = String(ymd || '').slice(0, 10)
  if (!d) return null
  const r = await redis(['GET', KEY_PREFIX + d])
  if (typeof r?.result !== 'string') return null
  try {
    return normaliseShortageSnap(JSON.parse(r.result) as Partial<ShortageDaySnap>, d)
  } catch {
    return null
  }
}

/** Save today's closing shortage — becomes tomorrow's opening balance. */
export async function saveShortageSnap(snap: ShortageDaySnap): Promise<boolean> {
  const d = String(snap.date || '').slice(0, 10)
  if (!d) return false
  const payload: ShortageDaySnap = {
    date: d,
    vac: n(snap.vac),
    ot: n(snap.ot),
    shortage: n(snap.shortage) || n(snap.vac) + n(snap.ot),
    byBranch: (snap.byBranch || []).map((b) => ({
      branch: String(b.branch || ''),
      vac: n(b.vac),
      ot: n(b.ot),
      shortage: n(b.shortage) || n(b.vac) + n(b.ot),
    })),
    savedAt: new Date().toISOString(),
  }
  const r = await redis(['SET', KEY_PREFIX + d, JSON.stringify(payload)])
  return r?.result === 'OK'
}

export function emptyBranchOpening(centres: readonly string[] = RECRUIT_BRANCHES): ShortageBranchSnap[] {
  return centres.map((branch) => ({ branch, vac: 0, ot: 0, shortage: 0 }))
}

const REMIND_PREFIX = 'recruit:shortage-reminded:'

/** Once-per-day ledger so auto HOD shortage mail is not repeated. */
export async function wasShortageReminded(branch: string, ymd: string): Promise<boolean> {
  const key = REMIND_PREFIX + String(branch || '').trim() + ':' + String(ymd || '').slice(0, 10)
  if (!key.includes(':')) return false
  const r = await redis(['GET', key])
  return typeof r?.result === 'string' && r.result.length > 0
}

export async function markShortageReminded(branch: string, ymd: string): Promise<boolean> {
  const d = String(ymd || '').slice(0, 10)
  const b = String(branch || '').trim()
  if (!d || !b) return false
  const r = await redis(['SET', REMIND_PREFIX + b + ':' + d, new Date().toISOString(), 'EX', String(60 * 60 * 48)])
  return r?.result === 'OK'
}

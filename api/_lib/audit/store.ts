/**
 * Agile HR Audit — Redis store (prefix hra:).
 */

import type { HraAudit, HraClientProfile, HraIssue } from './types.js'

const PREFIX = 'hra:'
const KEYS = {
  profiles: `${PREFIX}profiles`,
  audits: `${PREFIX}audits`,
  issues: `${PREFIX}issues`,
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

export function hraStorageOk(): boolean {
  return redisConfig() !== null
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
      /* ignore */
    }
  }
  return fallback
}

async function setJson(key: string, value: unknown): Promise<boolean> {
  const r = await redis(['SET', key, JSON.stringify(value)])
  return r?.result === 'OK'
}

export function hraNid(p: string): string {
  return `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export async function getHraProfiles(): Promise<HraClientProfile[]> {
  return getJson(KEYS.profiles, [])
}
export async function saveHraProfiles(rows: HraClientProfile[]): Promise<boolean> {
  return setJson(KEYS.profiles, rows.slice(0, 2000))
}
export async function upsertHraProfile(row: HraClientProfile): Promise<void> {
  const all = await getHraProfiles()
  const i = all.findIndex((x) => x.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveHraProfiles(all)
}

export async function getHraAudits(): Promise<HraAudit[]> {
  return getJson(KEYS.audits, [])
}
export async function saveHraAudits(rows: HraAudit[]): Promise<boolean> {
  return setJson(KEYS.audits, rows.slice(0, 5000))
}
export async function upsertHraAudit(row: HraAudit): Promise<void> {
  const all = await getHraAudits()
  const i = all.findIndex((x) => x.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveHraAudits(all)
}

export async function getHraIssues(): Promise<HraIssue[]> {
  return getJson(KEYS.issues, [])
}
export async function saveHraIssues(rows: HraIssue[]): Promise<boolean> {
  return setJson(KEYS.issues, rows.slice(0, 8000))
}
export async function upsertHraIssue(row: HraIssue): Promise<void> {
  const all = await getHraIssues()
  const i = all.findIndex((x) => x.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveHraIssues(all)
}

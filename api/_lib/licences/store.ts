/**
 * Agile Licenses — Redis store (prefix lic:).
 */

import type { LicBranchLicence, LicLabourLicence } from './types.js'

const PREFIX = 'lic:'
const KEYS = {
  branch: `${PREFIX}branch`,
  labour: `${PREFIX}labour`,
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

export function licStorageOk(): boolean {
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

export function licNid(p: string): string {
  return `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export async function getLicBranch(): Promise<LicBranchLicence[]> {
  return getJson(KEYS.branch, [])
}
export async function saveLicBranch(rows: LicBranchLicence[]): Promise<boolean> {
  return setJson(KEYS.branch, rows.slice(0, 3000))
}
export async function upsertLicBranch(row: LicBranchLicence): Promise<void> {
  const all = await getLicBranch()
  const i = all.findIndex((x) => x.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveLicBranch(all)
}

export async function getLicLabour(): Promise<LicLabourLicence[]> {
  return getJson(KEYS.labour, [])
}
export async function saveLicLabour(rows: LicLabourLicence[]): Promise<boolean> {
  return setJson(KEYS.labour, rows.slice(0, 5000))
}
export async function upsertLicLabour(row: LicLabourLicence): Promise<void> {
  const all = await getLicLabour()
  const i = all.findIndex((x) => x.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveLicLabour(all)
}

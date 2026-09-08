/**
 * Branch wage uploads (HOD) + Management city/area/state/central listing.
 * Redis: recruit:branch-wages
 */

import { recruitNid } from './store.js'

const KEY = 'recruit:branch-wages'

export type WageCategory = 'state' | 'central'
export type WageArea = 'city' | 'area' | 'state' | 'central'

export type BranchWageRow = {
  id: string
  branchId: string
  city: string
  area: string
  category: WageCategory
  designation: string
  wageAmount: number
  effectiveFrom: string
  remarks: string
  uploadedBy: string
  uploadedAt: string
  active: boolean
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

export async function getBranchWages(): Promise<BranchWageRow[]> {
  const d = await redis(['GET', KEY])
  if (typeof d?.result !== 'string') return []
  try {
    return (JSON.parse(d.result) as BranchWageRow[]).filter((r) => r && r.active !== false)
  } catch {
    return []
  }
}

export async function saveBranchWages(list: BranchWageRow[]): Promise<boolean> {
  const r = await redis(['SET', KEY, JSON.stringify(list.slice(0, 10000))])
  return r?.result === 'OK'
}

export function normalizeWageRow(raw: Partial<BranchWageRow>): BranchWageRow {
  const cat = String(raw.category || 'state').toLowerCase() === 'central' ? 'central' : 'state'
  return {
    id: String(raw.id || recruitNid('wg')),
    branchId: String(raw.branchId || '').slice(0, 80),
    city: String(raw.city || '').slice(0, 80),
    area: String(raw.area || '').slice(0, 80),
    category: cat,
    designation: String(raw.designation || 'SECURITY GUARD').slice(0, 80),
    wageAmount: Math.max(0, Math.floor(Number(raw.wageAmount) || 0)),
    effectiveFrom: String(raw.effectiveFrom || '').slice(0, 10),
    remarks: String(raw.remarks || '').slice(0, 500),
    uploadedBy: String(raw.uploadedBy || '').slice(0, 120),
    uploadedAt: String(raw.uploadedAt || new Date().toISOString()),
    active: raw.active !== false,
  }
}

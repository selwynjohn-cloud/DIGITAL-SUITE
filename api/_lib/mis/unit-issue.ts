/**
 * Unit Issue Register — equipment issued per client unit (Agile Deployment).
 */

import { getClients, nid, num, type MisClient } from './store.js'

export const UNIT_ISSUE_ITEMS = [
  { key: 'walkie', label: 'Walkie Talkie', abbr: 'WT' },
  { key: 'hhmd', label: 'Hand Held Metal Detector (HHMD)', abbr: 'HHMD' },
  { key: 'dfmd', label: 'Door Frame Metal Detector (DFMD)', abbr: 'DFMD' },
  { key: 'baton', label: 'Traffic Baton', abbr: 'TB' },
  { key: 'gardenUmbrella', label: 'Garden Umbrella', abbr: 'GU' },
  { key: 'umbrella', label: 'Umbrella', abbr: 'UB' },
  { key: 'raincoat', label: 'Rain Coat', abbr: 'RC' },
  { key: 'gumboot', label: 'Gum Boot', abbr: 'GB' },
  { key: 'breath', label: 'Breath Analyser', abbr: 'BA' },
  { key: 'torch', label: 'Torch Light', abbr: 'TL' },
  { key: 'flashlight', label: 'Long Distance Flash Light', abbr: 'LDFL' },
  { key: 'veh4w', label: '4-Wheeler', abbr: '4W' },
  { key: 'veh2w', label: '2-Wheeler', abbr: '2W' },
] as const

export type UnitIssueQty = Record<string, number>

export type UnitIssueRow = {
  clientId: string
  clientName: string
  location: string
  qty: UnitIssueQty
  /** Follow-up / indent action required */
  nextIssue?: string
  remark?: string
}

const unitIssueKey = (branchId: string) => `mis:unitissue:${branchId}`

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
      /* ignore */
    }
  }
  return fallback
}

async function setJson(key: string, value: unknown): Promise<boolean> {
  const r = await redis(['SET', key, JSON.stringify(value)])
  return r?.result === 'OK'
}

export function emptyQty(): UnitIssueQty {
  const q: UnitIssueQty = {}
  for (const it of UNIT_ISSUE_ITEMS) q[it.key] = 0
  return q
}

function seedFromClients(clients: MisClient[]): UnitIssueRow[] {
  return clients
    .filter((c) => c.active !== false)
    .map((c) => ({
      clientId: c.id,
      clientName: c.name,
      location: c.location,
      qty: emptyQty(),
      nextIssue: '',
      remark: '',
    }))
}

export async function getUnitIssueRegister(branchId: string, seed = true): Promise<UnitIssueRow[]> {
  const stored = await getJson<UnitIssueRow[]>(unitIssueKey(branchId), [])
  if (stored.length) return stored
  if (!seed) return []
  const clients = await getClients(branchId)
  return seedFromClients(clients)
}

export async function saveUnitIssueRegister(branchId: string, rows: UnitIssueRow[]): Promise<boolean> {
  const clean = rows.slice(0, 5000).map((r) => {
    const qty = emptyQty()
    for (const it of UNIT_ISSUE_ITEMS) qty[it.key] = num(r.qty?.[it.key])
    return {
      clientId: String(r.clientId ?? nid('cl')),
      clientName: String(r.clientName ?? '').slice(0, 120),
      location: String(r.location ?? '').slice(0, 120),
      qty,
      nextIssue: String(r.nextIssue ?? '').slice(0, 200),
      remark: String(r.remark ?? '').slice(0, 300),
    }
  })
  return setJson(unitIssueKey(branchId), clean)
}

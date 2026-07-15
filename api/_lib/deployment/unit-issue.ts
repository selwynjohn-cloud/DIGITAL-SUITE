/**
 * Unit Issue Register — security equipment issued per client unit (Agile Deployment).
 */

import { getClients, nid, num, type MisClient } from '../mis/store.js'

export const UNIT_ISSUE_ITEMS = [
  'Walkie Talkie',
  'Hand Held Metal Detector (HHMD)',
  'Door Frame Metal Detector (DFMD)',
  'Traffic Baton',
  'Garden Umbrella',
  'Rain Coat',
  'Gum Boots',
  'Breath Analyser',
  'Torch Light',
  'Long Distance Flash Light',
  '4-Wheeler',
  '2-Wheeler',
  'Uniform Set',
  'Rain Gear Set',
] as const

export type UnitIssueRow = {
  id: string
  branchId: string
  clientId: string
  clientName: string
  location: string
  items: Record<string, number>
  remarks: string
  updatedAt: string
}

const key = (branchId: string) => `mis:unitissue:${branchId}`

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

export async function getUnitIssues(branchId: string): Promise<UnitIssueRow[]> {
  const d = await redis(['GET', key(branchId)])
  if (d?.result && typeof d.result === 'string') {
    try {
      return JSON.parse(d.result) as UnitIssueRow[]
    } catch {
      /* ignore */
    }
  }
  return []
}

export async function saveUnitIssues(branchId: string, rows: UnitIssueRow[]): Promise<boolean> {
  const r = await redis(['SET', key(branchId), JSON.stringify(rows)])
  return r?.result === 'OK'
}

export async function seedUnitIssuesFromClients(branchId: string): Promise<UnitIssueRow[]> {
  const [existing, clients] = await Promise.all([getUnitIssues(branchId), getClients(branchId)])
  const byClient: Record<string, UnitIssueRow> = {}
  for (const r of existing) byClient[r.clientId] = r

  const items: Record<string, number> = {}
  for (const label of UNIT_ISSUE_ITEMS) items[label] = 0

  const out: UnitIssueRow[] = clients
    .filter((c) => c.active !== false)
    .map((c: MisClient) => {
      const prev = byClient[c.id]
      return {
        id: prev?.id ?? nid('ui'),
        branchId,
        clientId: c.id,
        clientName: c.name,
        location: c.location,
        items: prev?.items ?? { ...items },
        remarks: prev?.remarks ?? '',
        updatedAt: prev?.updatedAt ?? new Date().toISOString(),
      }
    })

  await saveUnitIssues(branchId, out)
  return out
}

export function normalizeUnitIssueRow(raw: Partial<UnitIssueRow> & { clientId?: string }, branchId: string): UnitIssueRow {
  const items: Record<string, number> = {}
  for (const label of UNIT_ISSUE_ITEMS) {
    items[label] = num((raw.items ?? {})[label])
  }
  return {
    id: String(raw.id ?? nid('ui')),
    branchId,
    clientId: String(raw.clientId ?? ''),
    clientName: String(raw.clientName ?? '').slice(0, 120),
    location: String(raw.location ?? '').slice(0, 120),
    items,
    remarks: String(raw.remarks ?? '').slice(0, 300),
    updatedAt: new Date().toISOString(),
  }
}

import { faDigitsMobile } from './fa-store.js'

const KEY = 'training:fa-advisory-roster:'

export type FaAdvisoryRosterRow = {
  name: string
  mobile: string
  employeeId: string
  hdfcSite: string
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

function cleanRow(raw: Partial<FaAdvisoryRosterRow>): FaAdvisoryRosterRow | null {
  const mobile = faDigitsMobile(String(raw.mobile || ''))
  const name = String(raw.name || '').trim().slice(0, 80)
  if (mobile.length !== 10 || !name) return null
  return {
    name,
    mobile,
    employeeId: String(raw.employeeId || '').trim().slice(0, 40),
    hdfcSite: String(raw.hdfcSite || '').trim().slice(0, 80),
  }
}

export function parseFaAdvisoryRosterText(text: string): FaAdvisoryRosterRow[] {
  const out: FaAdvisoryRosterRow[] = []
  const seen = new Set<string>()
  for (const line of String(text || '').split(/\r?\n/)) {
    const raw = line.trim()
    if (!raw || /^name\b/i.test(raw)) continue
    const parts = raw.split(/[\t,;|]+/).map((x) => x.trim()).filter(Boolean)
    let name = ''
    let mobile = ''
    let employeeId = ''
    let hdfcSite = ''
    if (parts.length >= 2) {
      const mobIdx = parts.findIndex((p) => faDigitsMobile(p).length === 10)
      if (mobIdx >= 0) {
        mobile = parts[mobIdx]
        name = parts.filter((_, i) => i !== mobIdx).slice(0, 1).join(' ')
        employeeId = parts.filter((_, i) => i !== mobIdx).slice(1, 2)[0] || ''
        hdfcSite = parts.filter((_, i) => i !== mobIdx).slice(2).join(' ')
      }
    } else {
      const m = raw.match(/(\+?91[\s-]?)?[6-9]\d{9}/)
      if (m) {
        mobile = m[0]
        name = raw.replace(m[0], '').trim()
      }
    }
    const row = cleanRow({ name, mobile, employeeId, hdfcSite })
    if (!row || seen.has(row.mobile)) continue
    seen.add(row.mobile)
    out.push(row)
  }
  return out
}

export async function loadFaAdvisoryRoster(branchId: string): Promise<FaAdvisoryRosterRow[]> {
  const id = String(branchId || '').trim()
  if (!id) return []
  const raw = await getJson<FaAdvisoryRosterRow[]>(`${KEY}${id}`, [])
  return Array.isArray(raw) ? raw.map((r) => cleanRow(r)).filter((r): r is FaAdvisoryRosterRow => !!r) : []
}

export async function saveFaAdvisoryRoster(branchId: string, rows: FaAdvisoryRosterRow[]): Promise<FaAdvisoryRosterRow[]> {
  const id = String(branchId || '').trim()
  const clean: FaAdvisoryRosterRow[] = []
  const seen = new Set<string>()
  for (const r of rows) {
    const row = cleanRow(r)
    if (!row || seen.has(row.mobile)) continue
    seen.add(row.mobile)
    clean.push(row)
  }
  if (id) await setJson(`${KEY}${id}`, clean)
  return clean
}

export function formatFaAdvisoryRosterText(rows: FaAdvisoryRosterRow[]): string {
  return rows
    .map((r) => {
      const extra = [r.employeeId, r.hdfcSite].filter(Boolean)
      return extra.length ? `${r.name}, ${r.mobile}, ${extra.join(', ')}` : `${r.name}, ${r.mobile}`
    })
    .join('\n')
}

export async function loadFaAdvisoryRosters(
  branchIds: string[],
): Promise<Array<FaAdvisoryRosterRow & { branchId: string }>> {
  const ids = [...new Set(branchIds.map((x) => String(x || '').trim()).filter(Boolean))]
  const packs = await Promise.all(ids.map((id) => loadFaAdvisoryRoster(id)))
  const out: Array<FaAdvisoryRosterRow & { branchId: string }> = []
  ids.forEach((id, i) => {
    for (const r of packs[i] || []) out.push({ ...r, branchId: id })
  })
  return out
}

export async function findFaAdvisoryRosterByMobile(
  mobile: string,
  branchIds: string[],
): Promise<(FaAdvisoryRosterRow & { branchId: string }) | null> {
  const mob = faDigitsMobile(mobile)
  if (mob.length !== 10) return null
  for (const bid of branchIds) {
    const rows = await loadFaAdvisoryRoster(bid)
    const hit = rows.find((r) => r.mobile === mob)
    if (hit) return { ...hit, branchId: bid }
  }
  return null
}

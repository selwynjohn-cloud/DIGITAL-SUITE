import { isNamedStrategicClient } from './strategic-client-names.js'

const BANK_HINTS = ['BANK', 'HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK', 'PNB', 'CANARA', 'UNION', 'IDBI', 'YES BANK', 'INDUSIND']

/** Business client tiers (operational scale + Apex / Strategic accounts). */
export type BusinessTierId = 'standard' | 'cluster' | 'enterprise' | 'apex'

export const BUSINESS_TIER_IDS: BusinessTierId[] = ['standard', 'cluster', 'enterprise', 'apex']

export const BUSINESS_TIER_LABELS: Record<BusinessTierId, string> = {
  standard: 'Standard Tier',
  cluster: 'Cluster Tier',
  enterprise: 'Enterprise Tier',
  apex: 'Apex Tier',
}

export const BUSINESS_TIER_SHORT: Record<BusinessTierId, string> = {
  standard: 'Standard',
  cluster: 'Cluster',
  enterprise: 'Enterprise',
  apex: 'Apex',
}

/** Client priority 1–5 stars (kept for SLA / Meetings cadence / Apex detection). */
export function normalizeStarRating(v: unknown, fallback = 2): number {
  const n = Math.round(Number(v) || 0)
  if (n >= 1 && n <= 5) return n
  return Math.min(5, Math.max(1, fallback))
}

/** @deprecated Prefer businessTierLabel — kept for star-only call sites during migration. */
export function clientTierLabel(stars: number): string {
  if (stars >= 5) return BUSINESS_TIER_LABELS.apex
  if (stars >= 3) return BUSINESS_TIER_LABELS.enterprise
  return BUSINESS_TIER_LABELS.standard
}

/** @deprecated Prefer businessTierShort */
export function clientTierShort(stars: number): string {
  if (stars >= 5) return BUSINESS_TIER_SHORT.apex
  if (stars >= 3) return BUSINESS_TIER_SHORT.enterprise
  return BUSINESS_TIER_SHORT.standard
}

export function businessTierLabel(tier: BusinessTierId | string | null | undefined): string {
  const id = String(tier || 'standard').toLowerCase() as BusinessTierId
  return BUSINESS_TIER_LABELS[id] || BUSINESS_TIER_LABELS.standard
}

export function businessTierShort(tier: BusinessTierId | string | null | undefined): string {
  const id = String(tier || 'standard').toLowerCase() as BusinessTierId
  return BUSINESS_TIER_SHORT[id] || BUSINESS_TIER_SHORT.standard
}

export function starsDisplay(stars: number): string {
  const s = normalizeStarRating(stars)
  return '★'.repeat(s) + '☆'.repeat(5 - s)
}

export function suggestStarRating(name: string, totalSan: number, highValue?: boolean): number {
  /** Named Strategic list (HDFC, Canara, …) always 5★ → Apex. */
  if (isNamedStrategicClient(name)) return 5
  if (highValue) return 4
  const n = name.toUpperCase()
  if (totalSan >= 30 || BANK_HINTS.some((h) => n.includes(h))) return 4
  return 2
}

export function isHighValueClient(name: string, totalSan: number): boolean {
  return suggestStarRating(name, totalSan) >= 3
}

/** Apex / Strategic = 5★ (including the fixed named strategic accounts). */
export function isStrategicClient(name: string, starRating?: number): boolean {
  if (isNamedStrategicClient(name)) return true
  return normalizeStarRating(starRating, 0) >= 5
}

export function isApexClient(name: string, starRating?: number): boolean {
  return isStrategicClient(name, starRating)
}

/** Clean key so “HDFC Bank” / “hdfc  bank” group together. */
export function normalizeClientGroupKey(name: string): string {
  return String(name ?? '')
    .trim()
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Map branch display name → city key for Cluster vs Enterprise.
 * Hyderabad-A / Hyderabad-B / Hi-Tech City share one city.
 * Independent ops cities stay separate (Nellore ≠ Tada, etc.).
 */
export function branchCityKey(branchName: string): string {
  const n = String(branchName ?? '')
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
  if (!n) return ''
  if (/HI\s*TECH|HITECH/.test(n)) return 'HYDERABAD'
  if (/HYD(?:ERABAD)?/.test(n)) return 'HYDERABAD'
  if (/BANGALORE|BENGALURU|KARNATAKA/.test(n)) return 'BANGALORE'
  if (/BHOPAL|MADHYA\s*PRADESH/.test(n)) return 'BHOPAL'
  if (/PUDUCHERRY|PONDICHERRY/.test(n)) return 'PUDUCHERRY'
  if (/CHENNAI|TAMIL\s*NADU/.test(n)) return 'CHENNAI'
  if (/KOCHI|COCHIN|KERALA/.test(n)) return 'KOCHI'
  if (/SURAT|GUJARAT/.test(n)) return 'SURAT'
  if (/MUMBAI|MAHARASHTRA/.test(n)) return 'MUMBAI'
  if (/\bTADA\b/.test(n)) return 'TADA'
  if (/NELLORE/.test(n)) return 'NELLORE'
  if (/TADIPATRI/.test(n)) return 'TADIPATRI'
  if (/TIRUPATI|TIRUPATHI/.test(n)) return 'TIRUPATI'
  if (/VIJAYAWADA/.test(n)) return 'VIJAYAWADA'
  if (/KAKINADA/.test(n)) return 'KAKINADA'
  if (/VISAKHAPATNAM|VIZAG/.test(n)) return 'VISAKHAPATNAM'
  return n
}

export type BusinessTierClientInput = {
  name?: string
  branchId?: string
  active?: boolean
  starRating?: number
}

export type BusinessTierBranchInput = {
  id?: string
  name?: string
}

/**
 * Resolve business tier per cleaned client name using national footprint.
 * Apex wins over footprint. Else: 2+ cities → Enterprise · 2+ sites one city → Cluster · else Standard.
 */
export function resolveBusinessTiers(
  clients: BusinessTierClientInput[],
  branches: BusinessTierBranchInput[] = [],
): Map<string, BusinessTierId> {
  const branchNameById = new Map<string, string>()
  for (const b of branches) {
    const id = String(b.id ?? '').trim()
    if (id) branchNameById.set(id, String(b.name ?? '').trim())
  }

  type Acc = { sites: number; cities: Set<string>; apex: boolean }
  const groups = new Map<string, Acc>()

  for (const c of clients) {
    if (c.active === false) continue
    const key = normalizeClientGroupKey(String(c.name ?? ''))
    if (!key) continue
    let g = groups.get(key)
    if (!g) {
      g = { sites: 0, cities: new Set(), apex: false }
      groups.set(key, g)
    }
    g.sites += 1
    const branchName = branchNameById.get(String(c.branchId ?? '').trim()) || String(c.branchId ?? '')
    const city = branchCityKey(branchName)
    if (city) g.cities.add(city)
    if (isApexClient(String(c.name ?? ''), c.starRating)) g.apex = true
  }

  const out = new Map<string, BusinessTierId>()
  for (const [key, g] of groups) {
    if (g.apex) out.set(key, 'apex')
    else if (g.cities.size >= 2) out.set(key, 'enterprise')
    else if (g.sites >= 2) out.set(key, 'cluster')
    else out.set(key, 'standard')
  }
  return out
}

export function businessTierForName(
  name: string,
  tierByGroup: Map<string, BusinessTierId>,
): BusinessTierId {
  const key = normalizeClientGroupKey(name)
  if (!key) return 'standard'
  if (isNamedStrategicClient(name)) return 'apex'
  return tierByGroup.get(key) || 'standard'
}

export function countBusinessTiers(tierByGroup: Map<string, BusinessTierId>): Record<BusinessTierId, number> {
  const counts: Record<BusinessTierId, number> = {
    standard: 0,
    cluster: 0,
    enterprise: 0,
    apex: 0,
  }
  for (const tier of tierByGroup.values()) counts[tier]++
  return counts
}

/** Attach computed businessTier fields for API/UI (not persisted). */
export function withBusinessTiers<T extends BusinessTierClientInput>(
  clients: T[],
  branches: BusinessTierBranchInput[] = [],
  tierByGroup?: Map<string, BusinessTierId>,
): Array<T & { businessTier: BusinessTierId; businessTierLabel: string; businessTierShort: string }> {
  const map = tierByGroup || resolveBusinessTiers(clients, branches)
  return clients.map((c) => {
    const tier = businessTierForName(String(c.name ?? ''), map)
    return {
      ...c,
      businessTier: tier,
      businessTierLabel: businessTierLabel(tier),
      businessTierShort: businessTierShort(tier),
    }
  })
}

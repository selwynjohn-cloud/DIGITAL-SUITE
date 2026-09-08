/**
 * Training-only guard invite scope.
 *
 * HARD RULE: Read MIS guards list only. Never create / edit / move Branch clients
 * or change Master Directory client books.
 *
 * Trainer flow:
 *  1) Book a client (e.g. K Raheja / KRC)
 *  2) “Show guards list” → all units of that client on the branch (KRC family;
 *     Premier still campus-scoped; banks area-scoped)
 *  3) Tick unit(s) — guards appear unit-wise (e.g. Building 10)
 *  4) Separate “Preview WhatsApp message” for the text only
 */

import { getGuards, type MisGuard } from '../mis/store.js'
import type { OjtSession, TrainingGuardRosterRow } from './ojt-store.js'
import { normalizeTrainingGuardRows } from './ojt-store.js'

export type TrainingGuardScopeMode = 'unit-pick'

export type ClientGuardPhone = {
  id: string
  name: string
  employeeId: string
  rank: string
  mobile: string
  clientName: string
  unitName: string
  canWhatsApp: boolean
  selectedForTraining: boolean
}

export type GuardsByUnit = {
  unitName: string
  guards: ClientGuardPhone[]
}

function digits10(mobile: string): string {
  const d = String(mobile || '').replace(/\D/g, '')
  if (d.length >= 10) return d.slice(-10)
  return d
}

function normKey(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function clientMatch(a: string, b: string): boolean {
  const na = normKey(a)
  const nb = normKey(b)
  if (!na || !nb) return false
  return na === nb || na.includes(nb) || nb.includes(na)
}

export function isBankTrainingClient(name: string): boolean {
  const k = normKey(name)
  if (!k) return false
  return /\b(bank|hdfc|sbi|state bank|icici|axis|idbi|canara|kotak|indusind|pnb|punjab national|bank of baroda|\bbob\b|indian bank|federal|rbl|bandhan|au small|aubank|yes bank|union bank|uco|central bank|bank of india|\bboi\b|south indian bank|karur vysya|\bkvb\b|dbs|hsbc|standard chartered)\b/.test(
    k,
  )
}

function isPremierClient(name: string): boolean {
  const k = normKey(name)
  return k.includes('premier') && k.includes('energ')
}

export function isKrcFamily(name: string): boolean {
  const k = normKey(name)
  return /\b(krc|k raheja|kraheja|raheja|mindspace|sundew|stargaze|pocharam|newfound)\b/.test(k)
}

/** Premier campuses only — KRC / banks / others use softer rules. */
function campusKey(text: string): string {
  const k = normKey(text)
  if (!k) return ''
  if (/(sitarampur|sitharampuram|sitarampuram|sitharampur|pegepl|pegpl|\bp7\b)/.test(k)) return 'sitarampur'
  if (/(naidupet|naidupeta|naidu pet)/.test(k)) return 'naidupet'
  if (/(electronic\s*city|electroniccity|peipl|peppl|\bp3\b|\bp2\b)/.test(k)) return 'electroniccity'
  return ''
}

function bankAreaKey(text: string): string {
  const k = normKey(text)
  if (!k) return ''
  if (/(hi\s*tech|hitech|madhapur|gachibowli|raidurg)/.test(k)) return 'hitech'
  if (/(banjara|jubilee)/.test(k)) return 'banjara'
  if (/(secunderabad|sec bad)/.test(k)) return 'secunderabad'
  return k.slice(0, 24)
}

function clientIdentityHit(g: Pick<MisGuard, 'clientName' | 'unitName'>, client: string): boolean {
  const gClient = g.clientName || ''
  const gUnit = g.unitName || ''
  if (
    clientMatch(gClient, client) ||
    clientMatch(gUnit, client) ||
    clientMatch(`${gClient} ${gUnit}`, client)
  ) {
    return true
  }
  if (isKrcFamily(client) && (isKrcFamily(gClient) || isKrcFamily(gUnit))) return true
  if (isPremierClient(client) && (isPremierClient(gClient) || isPremierClient(gUnit))) return true
  /** Shared significant tokens (e.g. Mindspace, Sundew, Building 10). */
  const a = new Set(normKey(client).split(' ').filter((w) => w.length >= 4))
  const b = new Set(normKey(`${gClient} ${gUnit}`).split(' ').filter((w) => w.length >= 4))
  for (const w of a) {
    if (b.has(w)) return true
  }
  return false
}

/** Branches to scan for MIS guards / unit names (never edits Branch clients). */
async function guardBranchIdsForSession(session: Pick<OjtSession, 'branchId' | 'clientName'>): Promise<string[]> {
  const bid = String(session.branchId || '').trim()
  const client = String(session.clientName || '').trim()
  const ids = new Set<string>()
  if (bid && bid !== 'all') ids.add(bid)
  const needTdCover =
    /training\s*department/i.test(bid) ||
    bid === 'br-training-department' ||
    isKrcFamily(client) ||
    isPremierClient(client)
  if (needTdCover) {
    try {
      const { resolveTrainingDeptCoveredBranches, isTrainingDepartmentBranch } = await import(
        './ojt-training-dept.js'
      )
      if (isTrainingDepartmentBranch({ id: bid }) || isKrcFamily(client) || isPremierClient(client)) {
        const covered = await resolveTrainingDeptCoveredBranches()
        for (const b of covered) {
          if (b?.id) ids.add(b.id)
        }
      }
    } catch {
      /* covered branches optional */
    }
  }
  return [...ids].filter(Boolean)
}

export function trainingGuardScopeMode(_session?: Pick<OjtSession, 'clientName'>): TrainingGuardScopeMode {
  return 'unit-pick'
}

export function invitedUnitNames(
  session: Pick<OjtSession, 'location' | 'trainingInviteUnits'>,
): string[] {
  const extras = (session.trainingInviteUnits || [])
    .map((u) => String(u || '').trim())
    .filter(Boolean)
  return [...new Set(extras)]
}

export function trainingGuardScopeNote(
  session: Pick<OjtSession, 'clientName' | 'location' | 'trainingInviteUnits'>,
): string {
  const client = session.clientName || 'this client'
  const picked = (session.trainingInviteUnits || []).filter(Boolean)
  if (isKrcFamily(client)) {
    return picked.length
      ? `KRC — ${picked.length} unit(s) selected. Guards listed unit-wise. Branch clients list is not changed.`
      : 'KRC / K Raheja — all KRC units on this branch are offered below. Tick unit(s) (e.g. Building 10) to list those guards. Branch clients list is not changed.'
  }
  if (picked.length) {
    return `Guards listed from ${picked.length} selected unit(s). Same client · same branch. Branch clients list is not changed.`
  }
  return `Select unit(s) of ${client} on this branch (same area where applicable). Guards appear unit-wise. Branch clients list is not changed.`
}

/**
 * Whether a unit belongs in the offer list for this session.
 * KRC: all KRC-family units on the branch (Director: all buildings / area).
 * Premier: same campus only.
 * Banks: soft same-area when venue set.
 * Other: all units for that client on the branch.
 */
export function unitInSessionArea(
  unitName: string,
  session: Pick<OjtSession, 'location' | 'clientName'>,
): boolean {
  const client = session.clientName || ''
  const loc = String(session.location || '').trim()
  const blob = `${client} ${unitName}`

  if (isKrcFamily(client) || isKrcFamily(unitName)) {
    return true
  }
  if (isPremierClient(client) || isPremierClient(unitName)) {
    if (!loc) return true
    const a = campusKey(loc)
    const b = campusKey(unitName) || campusKey(blob)
    if (!a) return true
    if (!b) return true
    return a === b
  }
  if (isBankTrainingClient(client)) {
    if (!loc) return true
    const a = bankAreaKey(loc)
    const b = bankAreaKey(unitName) || bankAreaKey(blob)
    if (!a || !b) return clientMatch(unitName, loc) || true
    return a === b || clientMatch(unitName, loc)
  }
  return true
}

export function guardMatchesTrainingInvite(
  g: Pick<MisGuard, 'clientName' | 'unitName'>,
  session: Pick<OjtSession, 'clientName' | 'location' | 'trainingInviteUnits'>,
): boolean {
  const client = String(session.clientName || '').trim()
  if (!client) return false
  if (!clientIdentityHit(g, client)) return false

  const unit = String(g.unitName || '').trim()
  const gClient = String(g.clientName || '').trim()
  const blob = `${gClient} ${unit}`
  const invited = invitedUnitNames(session)
  if (!invited.length) {
    /** No unit filter yet — list every guard for this client on the branch. */
    return true
  }

  if (!unit) return true

  return invited.some(
    (u) =>
      clientMatch(unit, u) ||
      clientMatch(blob, u) ||
      clientMatch(gClient, u) ||
      (unit && clientMatch(u, unit)),
  )
}

/** All selectable units: same client (KRC family), same branch; area rules above. */
export async function listTrainingUnitOptions(session: OjtSession): Promise<string[]> {
  const client = String(session.clientName || '').trim()
  if (!client) return []
  const branchIds = await guardBranchIdsForSession(session)
  if (!branchIds.length) return []
  const units = new Set<string>()

  for (const branchId of branchIds) {
    const rows = await getGuards(branchId)
    for (const g of rows) {
      if (!clientIdentityHit(g, client)) continue
      const u = String(g.unitName || '').trim() || String(g.clientName || '').trim()
      if (!u) continue
      if (!unitInSessionArea(u, session) && !unitInSessionArea(g.clientName || '', session)) continue
      units.add(u)
    }
  }

  /**
   * Fallback (read-only): Branch client book locations for the same client family.
   * Does NOT create / edit / move Branch clients — only lists names for toggles.
   */
  try {
    const { getClients } = await import('../mis/store.js')
    for (const branchId of branchIds) {
      const clients = await getClients(branchId, { skipRepair: true })
      for (const c of clients) {
        if (c.active === false) continue
        const hit = clientIdentityHit(
          { clientName: c.name || '', unitName: c.location || '' },
          client,
        )
        if (!hit) continue
        const label = String(c.location || '').trim() || String(c.name || '').trim()
        if (!label) continue
        if (!unitInSessionArea(label, session) && !unitInSessionArea(c.name || '', session)) continue
        units.add(label)
      }
    }
  } catch {
    /* client book optional */
  }

  const loc = String(session.location || '').trim()
  if (loc) units.add(loc)

  return [...units].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
}

/** Default ticks: saved units, else all available (so KRC shows every building’s guards ready to narrow). */
export function defaultInviteUnits(session: OjtSession, availableUnits: string[]): string[] {
  const saved = (session.trainingInviteUnits || []).map((u) => String(u || '').trim()).filter(Boolean)
  if (saved.length) {
    const kept = saved.filter((u) => availableUnits.some((a) => clientMatch(a, u) || a === u))
    if (kept.length) return kept
  }
  return [...availableUnits]
}

function toGuardPhone(g: MisGuard, prev?: TrainingGuardRosterRow): ClientGuardPhone {
  const mobile = digits10(g.mobile)
  const canWhatsApp = mobile.length === 10
  return {
    id: prev?.id || g.id,
    name: prev?.name || g.name || 'Guard',
    employeeId: prev?.employeeId || g.employeeId || '',
    rank: prev?.rank || '',
    mobile: canWhatsApp ? mobile : String(prev?.mobile || g.mobile || '').trim(),
    clientName: g.clientName || '',
    unitName: prev?.unitName || g.unitName || g.clientName || '',
    canWhatsApp: canWhatsApp || digits10(prev?.mobile || '').length === 10,
    selectedForTraining: prev ? prev.selectedForTraining !== false : canWhatsApp,
  }
}

/** Flat list for selected units (WhatsApp send). */
export async function listGuardsForOjtSession(session: OjtSession): Promise<ClientGuardPhone[]> {
  const client = String(session.clientName || '').trim()
  if (!client) return []
  const saved = normalizeTrainingGuardRows(session.trainingGuardRows).filter((r) => !r.deleted)
  if (saved.length && invitedUnitNames(session).length) {
    const want = new Set(invitedUnitNames(session).map((u) => normKey(u)))
    return saved
      .filter((r) => !want.size || want.has(normKey(r.unitName)) || [...want].some((w) => clientMatch(r.unitName, w)))
      .map((r) => {
        const mobile = digits10(r.mobile)
        return {
          id: r.id,
          name: r.name,
          employeeId: r.employeeId,
          rank: r.rank,
          mobile: mobile.length === 10 ? mobile : r.mobile,
          clientName: client,
          unitName: r.unitName,
          canWhatsApp: mobile.length === 10,
          selectedForTraining: r.selectedForTraining !== false,
        }
      })
  }
  const branchIds = await guardBranchIdsForSession(session)
  const out: ClientGuardPhone[] = []
  const seen = new Set<string>()
  const prevById = new Map(saved.map((r) => [r.id, r]))
  const prevByMobile = new Map(
    saved.filter((r) => digits10(r.mobile).length === 10).map((r) => [digits10(r.mobile), r]),
  )
  for (const branchId of branchIds) {
    const rows = await getGuards(branchId)
    for (const g of rows) {
      if (!guardMatchesTrainingInvite(g, session)) continue
      const prev = prevById.get(g.id) || prevByMobile.get(digits10(g.mobile))
      if (prev?.deleted) continue
      const row = toGuardPhone(g, prev)
      const key = row.canWhatsApp ? digits10(row.mobile) : `id:${g.id || g.employeeId || g.name}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(row)
    }
  }
  return out.sort((a, b) => {
    const u = a.unitName.localeCompare(b.unitName, 'en', { sensitivity: 'base' })
    if (u) return u
    return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
  })
}

/** Build session roster rows from current MIS guards + previous edits. */
export async function buildTrainingGuardRoster(
  session: OjtSession,
  selectedUnits?: string[],
): Promise<TrainingGuardRosterRow[]> {
  const units = selectedUnits?.length ? selectedUnits : invitedUnitNames(session)
  const scoped = { ...session, trainingInviteUnits: units }
  const guards = await listGuardsForOjtSession(scoped)
  return guards.map((g) => ({
    id: g.id,
    unitName: g.unitName,
    name: g.name,
    employeeId: g.employeeId,
    rank: g.rank || '',
    mobile: g.mobile,
    selectedForTraining: g.selectedForTraining !== false && g.canWhatsApp,
    deleted: false,
  }))
}

/**
 * Unit-wise roster for the trainer pick screen.
 * If selectedUnits empty → all offered units; else only those units.
 */
export async function listGuardsGroupedByUnit(
  session: OjtSession,
  selectedUnits?: string[],
): Promise<{ availableUnits: string[]; byUnit: GuardsByUnit[]; guards: ClientGuardPhone[] }> {
  const availableUnits = await listTrainingUnitOptions(session)
  const want =
    selectedUnits && selectedUnits.length
      ? selectedUnits.map((u) => String(u || '').trim()).filter(Boolean)
      : availableUnits
  const sessionScoped = { ...session, trainingInviteUnits: want }
  const guards = await listGuardsForOjtSession(sessionScoped)
  const byUnit: GuardsByUnit[] = []
  const assigned = new Set<string>()
  for (const u of want) {
    const list = guards.filter(
      (g) => clientMatch(g.unitName || '', u) || clientMatch(u, g.unitName || ''),
    )
    for (const g of list) assigned.add(g.id || `${g.mobile}:${g.name}`)
    byUnit.push({
      unitName: u,
      guards: list.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })),
    })
  }
  for (const g of guards) {
    const key = g.id || `${g.mobile}:${g.name}`
    if (assigned.has(key)) continue
    const unit = g.unitName || '—'
    let row = byUnit.find((b) => b.unitName === unit)
    if (!row) {
      row = { unitName: unit, guards: [] }
      byUnit.push(row)
    }
    row.guards.push(g)
  }
  byUnit.sort((a, b) => a.unitName.localeCompare(b.unitName, 'en', { sensitivity: 'base' }))

  return { availableUnits, byUnit, guards }
}

export function displaySiteLocation(clientName: string, location: string): string {
  const blob = `${clientName || ''} ${location || ''}`
  if (!isPremierClient(clientName || '') && !isPremierClient(location || '')) {
    return String(location || '').trim()
  }
  const key = campusKey(blob || location)
  const raw = String(location || '').trim()
  /** Director (17 Aug 2026): P3 & P2 = one Electronic City site; P7 separate. */
  if (key === 'sitarampur') return 'Sitharampuram, PEGPL P7'
  if (key === 'naidupet') return 'Naidupet'
  if (key === 'electroniccity') return 'Electronic City — PEIPL P3 & PEPPL P2'
  return raw
}

/**
 * Training schedule dropdown: Premier Electronic City (PEIPL P3 + PEPPL P2) = one pick.
 * Sitharampuram PEGPL P7 stays separate.
 */
export function collapsePremierTrainingPicks<
  T extends { id: string; name: string; location: string; branchId: string; branchName?: string },
>(picks: T[]): T[] {
  const out: T[] = []
  const eCityByBranch = new Map<string, T>()
  for (const p of picks) {
    if (!isPremierClient(p.name || '') && !isPremierClient(p.location || '')) {
      out.push(p)
      continue
    }
    const blob = `${p.name || ''} ${p.location || ''}`
    const key = campusKey(blob)
    if (key === 'electroniccity') {
      const bid = String(p.branchId || '')
      const prev = eCityByBranch.get(bid)
      const preferThis = /\bp3\b|peipl/i.test(blob) || !prev
      const row = {
        ...(preferThis || !prev ? p : prev),
        location: 'Electronic City — PEIPL P3 & PEPPL P2',
      } as T
      eCityByBranch.set(bid, row)
      continue
    }
    if (key === 'sitarampur') {
      out.push({ ...p, location: 'Sitharampuram, PEGPL P7' })
      continue
    }
    out.push(p)
  }
  for (const row of eCityByBranch.values()) out.push(row)
  return out
}

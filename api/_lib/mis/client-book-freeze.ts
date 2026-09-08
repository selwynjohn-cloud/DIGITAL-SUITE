/**
 * Director (15 Aug 2026): Daily MIS submitted on 14-08-2026 is the correct
 * client / site list for every branch (except Kakinada — leave unchanged).
 * Freeze that book so geo / restore cannot move sites to another city.
 */
import {
  applyKakinadaTerminatedAndNri,
  evacuateNonTadaBookFromTada,
  isKakinadaBranch,
  isKakinadaNriSite,
  isKrcHiTechClient,
  isSrmtClient,
  isTadaBookClient,
  isTadaBranch,
} from './client-branch.js'
import { resolveBranchFromSiteGeo } from './client-branch-geo-resolve.js'
import { misBranchGroupKey } from './branch-group-key.js'
import {
  getBranches,
  getClients,
  getClientBookFreeze,
  getReport,
  getReportsForDate,
  nid,
  num,
  saveClientBookFreeze,
  saveClients,
  type MisClient,
  type MisDeployRow,
  type ClientBookFreeze,
} from './store.js'

export const CLIENT_BOOK_FREEZE_DATE = '2026-08-14'
/** Director (15 Aug 2026): Kakinada book is the Daily MIS of 12-08-2026. */
export const KAKINADA_CLIENT_BOOK_DATE = '2026-08-12'

function siteKey(name: string, location: string): string {
  return `${String(name || '').trim().toUpperCase()}|${String(location || '').trim().toUpperCase()}`
}

function nameKey(name: string): string {
  return String(name || '').trim().toUpperCase()
}

function lockRank(branchName: string): number {
  const n = String(branchName || '').toUpperCase()
  if (/TADA/.test(n) && !/TADIPATRI/.test(n)) return 10
  if (/TADIPATRI/.test(n)) return 10
  if (/HI-?TECH/.test(n)) return 9
  if (/KAKINADA/.test(n)) return 9
  if (/HYDERABAD\s*-?\s*B|HYD\s*ZONE\s*B/.test(n)) return 8
  if (/HYDERABAD\s*-?\s*A|HYD\s*ZONE\s*A/.test(n)) return 8
  if (/PUDUCHERRY|PONDICHERRY/.test(n)) return 8
  if (/SURAT/.test(n)) return 8
  if (/NELLORE/.test(n)) return 7
  return 0
}

/** Hyderabad-A / B / Hi-Tech must never steal each other’s clients by name alone. */
function hydFamilyKey(branchIdOrName: string, branches: { id: string; name: string }[]): string {
  const hit = branches.find((b) => b.id === branchIdOrName || b.name === branchIdOrName)
  const key = misBranchGroupKey(hit?.name || branchIdOrName)
  if (key === 'HYDERABAD-A' || key === 'HYDERABAD-B' || key === 'HI-TECH CITY') return key
  return ''
}

function allowCrossBranchClientSteal(
  fromBranchId: string,
  toBranchId: string,
  branches: { id: string; name: string }[],
): boolean {
  if (fromBranchId === toBranchId) return true
  // Director: never touch Kakinada book from the all-branch 14-08 freeze
  if (isKakinadaBranch(fromBranchId, branches) || isKakinadaBranch(toBranchId, branches)) return false
  const from = hydFamilyKey(fromBranchId, branches)
  const to = hydFamilyKey(toBranchId, branches)
  // Never move between Hyd-A, Hyd-B, and Hi-Tech via name/location match
  if (from && to && from !== to) return false
  if (from && to && from === to) return true
  if (from && !to) return false
  if (!from && to) return false
  return true
}

function rowFromDeploy(row: MisDeployRow, branchId: string, prev?: MisClient): MisClient {
  return {
    id: prev?.id || String(row.clientId || '').trim() || nid('cl'),
    branchId,
    name: String(row.clientName || prev?.name || '').slice(0, 120),
    location: String(row.location || prev?.location || '').slice(0, 120),
    staffName: String(row.staffName || prev?.staffName || '').slice(0, 120),
    sanA: num(row.sanA),
    sanG: num(row.sanG),
    sanB: num(row.sanB),
    sanC: num(row.sanC),
    slaDayVisit: prev?.slaDayVisit || '',
    slaNightCheck: prev?.slaNightCheck || '',
    uniformIssued: prev?.uniformIssued || '',
    rainGearIssued: prev?.rainGearIssued || '',
    equipmentIssued: prev?.equipmentIssued || '',
    starRating: prev?.starRating ?? 2,
    highValue: prev?.highValue === true,
    active: true,
    entity: prev?.entity,
    mwCompliant: prev?.mwCompliant,
    monthlyBillLacs: prev?.monthlyBillLacs,
    balanceToPayLacs: prev?.balanceToPayLacs,
    branchFrozen: true,
  }
}

/**
 * Director (15 Aug 2026): 12-08-2026 is the Kakinada reference for NRI / SRMT.
 * That day’s form listed only those two names — do not treat it as the full book
 * (Coromandel / Gemini / banks stay). Keep NRI. Terminate SRMT.
 */
export async function applyKakinadaBookFromReport(
  clients: MisClient[],
  branches: Awaited<ReturnType<typeof getBranches>>,
  date = KAKINADA_CLIENT_BOOK_DATE,
): Promise<{ clients: MisClient[]; changed: number; samples: string[]; sites: string[] }> {
  const kakinada = branches.find((b) => isKakinadaBranch(b.id, branches) || isKakinadaBranch(b.name, branches))
  if (!kakinada) return { clients, changed: 0, samples: [], sites: [] }
  const kakinadaId = kakinada.id
  const report = await getReport(kakinadaId, date)
  const rows = (report?.rows || []).filter((r) => String(r.clientName || '').trim())
  let next = clients
  let changed = 0
  const samples: string[] = [`12-08 Kakinada reference: ${rows.length} row(s) — NRI keep, SRMT off`]

  for (const row of rows) {
    if (isSrmtClient({ name: row.clientName, location: row.location })) continue
    if (!isKakinadaNriSite({ name: row.clientName, location: row.location })) continue
    const key = siteKey(String(row.clientName || ''), String(row.location || ''))
    const nk = nameKey(String(row.clientName || ''))
    const hit = next.find(
      (c) =>
        isKakinadaNriSite(c) ||
        siteKey(c.name, c.location) === key ||
        nameKey(c.name) === nk ||
        (row.clientId && c.id === row.clientId),
    )
    if (hit) {
      if (hit.branchId !== kakinadaId || hit.active === false) {
        changed++
        samples.push(`NRI site on Kakinada — ${hit.name}`)
        next = next.map((c) =>
          c.id === hit.id ? { ...c, branchId: kakinadaId, active: true, branchFrozen: true } : c,
        )
      }
    } else {
      changed++
      samples.push(`+ NRI site → Kakinada (12-08)`)
      next = [...next, rowFromDeploy(row, kakinadaId)]
    }
  }

  const nriFix = applyKakinadaTerminatedAndNri(next, branches)
  if (nriFix.changed) {
    changed += nriFix.changed
    samples.push(...nriFix.samples)
  }
  const sites = nriFix.clients
    .filter((c) => isKakinadaBranch(c.branchId, branches) && c.active !== false)
    .map((c) => `${c.name}${c.location ? ' @ ' + c.location : ''}`)
  return { clients: nriFix.clients, changed, samples, sites }
}

export async function freezeKakinadaBookFromReport(
  date = KAKINADA_CLIENT_BOOK_DATE,
): Promise<{ ok: boolean; date: string; changed: number; samples: string[]; sites: string[] }> {
  const branches = await getBranches(false)
  const clients = await getClients(undefined, { skipRepair: true, branches })
  const result = await applyKakinadaBookFromReport(clients, branches, date)
  if (result.changed) await saveClients(result.clients, { force: true })
  const stamp = (await getClientBookFreeze()) || {
    date: CLIENT_BOOK_FREEZE_DATE,
    at: new Date().toISOString(),
    submitted: 0,
    moved: 0,
    added: 0,
    deactivated: 0,
    branches: [],
  }
  await saveClientBookFreeze({
    ...stamp,
    at: new Date().toISOString(),
    kakinadaDate: date,
    kakinadaSites: result.sites,
  })
  return { ok: true, date, changed: result.changed, samples: result.samples, sites: result.sites }
}

function hydFamilyBranches(branches: { id: string; name: string }[]) {
  const list = branches.filter((b) => {
    const k = misBranchGroupKey(b.name)
    return k === 'HYDERABAD-A' || k === 'HYDERABAD-B' || k === 'HI-TECH CITY'
  })
  /** Rebuild order: Hi-Tech → Hyd-B → Hyd-A so contested sites land on B, not A. */
  const rank = (name: string) => {
    const k = misBranchGroupKey(name)
    if (k === 'HI-TECH CITY') return 0
    if (k === 'HYDERABAD-B') return 1
    if (k === 'HYDERABAD-A') return 2
    return 9
  }
  return list.sort((a, b) => rank(a.name) - rank(b.name))
}

/**
 * Director (17 Aug 2026): Hyderabad-A was still showing Hyderabad-B clients.
 * Force each Hyd family book to exactly the freeze-date Daily MIS for that branch
 * (move strays, deactivate extras, add missing). Does not touch Kakinada.
 */
export async function strictRealignHydFamilyBooks(
  date = CLIENT_BOOK_FREEZE_DATE,
  clientsIn?: MisClient[],
  branchesIn?: Awaited<ReturnType<typeof getBranches>>,
): Promise<{
  clients: MisClient[]
  moved: number
  added: number
  deactivated: number
  samples: string[]
  books: { id: string; name: string; reportSites: number; active: number }[]
}> {
  const branches = branchesIn ?? (await getBranches(false))
  const hyd = hydFamilyBranches(branches)
  const nameOf = (id: string) => branches.find((b) => b.id === id)?.name || id
  let clients = clientsIn ? [...clientsIn] : await getClients(undefined, { skipRepair: true, branches })
  const samples: string[] = []
  let moved = 0
  let added = 0
  let deactivated = 0

  const reportByBranch = new Map<string, Awaited<ReturnType<typeof getReport>>>()
  const keysByBranch = new Map<string, Set<string>>()
  for (const b of hyd) {
    const r = await getReport(b.id, date)
    reportByBranch.set(b.id, r)
    const keys = new Set<string>()
    if (r && String(r.submittedAt || '').trim()) {
      for (const row of r.rows || []) {
        const name = String(row.clientName || '').trim()
        if (!name) continue
        keys.add(siteKey(name, String(row.location || '')))
      }
    }
    keysByBranch.set(b.id, keys)
  }

  // Owner of a site = the Hyd branch whose 14-08 report lists it.
  // If listed on more than one Hyd report: Hi-Tech wins for KRC; else Hyd-B wins over Hyd-A
  // (Director 18 Aug 2026: Hyderabad-A must not keep B sites that also appear on B’s book).
  const ownerOf = (key: string, currentBranchId: string): string | null => {
    const owners = hyd.filter((b) => keysByBranch.get(b.id)?.has(key)).map((b) => b.id)
    if (!owners.length) return null
    if (owners.length === 1) return owners[0]
    const hi = hyd.find((b) => misBranchGroupKey(b.name) === 'HI-TECH CITY')
    if (hi && owners.includes(hi.id)) return hi.id
    const bBranch = hyd.find((b) => misBranchGroupKey(b.name) === 'HYDERABAD-B')
    const aBranch = hyd.find((b) => misBranchGroupKey(b.name) === 'HYDERABAD-A')
    if (bBranch && owners.includes(bBranch.id) && aBranch && owners.includes(aBranch.id)) {
      return bBranch.id
    }
    if (owners.includes(currentBranchId)) return currentBranchId
    return owners[0]
  }

  const usedIds = new Set<string>()
  const next: MisClient[] = []

  // Keep every non-Hyd client as-is
  for (const c of clients) {
    if (!hydFamilyKey(c.branchId, branches)) {
      next.push(c)
      usedIds.add(c.id)
    }
  }

  // Rebuild each Hyd book from its report
  for (const b of hyd) {
    const r = reportByBranch.get(b.id)
    const keys = keysByBranch.get(b.id) || new Set()
    const pool = clients.filter((c) => !usedIds.has(c.id))

    if (r && String(r.submittedAt || '').trim()) {
      for (const row of r.rows || []) {
        const name = String(row.clientName || '').trim()
        if (!name) continue
        const key = siteKey(name, String(row.location || ''))
        /** Skip rows that another Hyd book owns (e.g. B site wrongly listed on A’s MIS). */
        const owner = ownerOf(key, b.id)
        if (owner && owner !== b.id) continue
        const rowId = String(row.clientId || '').trim()
        let hit =
          (rowId && pool.find((c) => c.id === rowId && !usedIds.has(c.id))) ||
          pool.find((c) => !usedIds.has(c.id) && c.branchId === b.id && siteKey(c.name, c.location) === key) ||
          pool.find((c) => !usedIds.has(c.id) && siteKey(c.name, c.location) === key) ||
          undefined
        if (hit) {
          usedIds.add(hit.id)
          if (hit.branchId !== b.id) {
            moved++
            if (samples.length < 50) {
              samples.push(`${hit.name} @ ${hit.location || '—'}: ${nameOf(hit.branchId)} → ${b.name}`)
            }
          }
          next.push(rowFromDeploy(row, b.id, hit))
        } else {
          added++
          if (samples.length < 50) samples.push(`+ ${name} @ ${row.location || '—'} → ${b.name}`)
          const created = rowFromDeploy(row, b.id)
          next.push(created)
          usedIds.add(created.id)
        }
      }
    }
  }

  // Leftover Hyd-family clients: deactivate (were extras / wrong book)
  for (const c of clients) {
    if (usedIds.has(c.id)) continue
    if (!hydFamilyKey(c.branchId, branches)) continue
    const key = siteKey(c.name, c.location)
    const owner = ownerOf(key, c.branchId)
    if (owner && owner !== c.branchId) {
      moved++
      if (samples.length < 50) {
        samples.push(`${c.name} @ ${c.location || '—'}: ${nameOf(c.branchId)} → ${nameOf(owner)} (stray)`)
      }
      next.push({ ...c, branchId: owner, active: true, branchFrozen: true })
      usedIds.add(c.id)
      continue
    }
    if (c.active !== false) {
      deactivated++
      if (samples.length < 50) {
        samples.push(`off ${c.name} @ ${c.location || '—'} (${nameOf(c.branchId)})`)
      }
    }
    next.push({ ...c, active: false, branchFrozen: true })
    usedIds.add(c.id)
  }

  // Zone geography: only move clear Hyd-B localities off Hyderabad-A (Warangal, Divis TG, etc.).
  // Do NOT use the catch-all “Telangana → Hyd-A” to pull B-book sites onto A (Director mix complaint).
  const hydOnly = next.map((c) => {
    if (c.active === false) return c
    const curKey = hydFamilyKey(c.branchId, branches)
    if (curKey !== 'HYDERABAD-A' && curKey !== 'HYDERABAD-B') return c
    if (isKrcHiTechClient(c)) {
      const hi = hyd.find((b) => misBranchGroupKey(b.name) === 'HI-TECH CITY')
      if (hi && c.branchId !== hi.id) {
        moved++
        if (samples.length < 50) {
          samples.push(`${c.name} @ ${c.location || '—'}: ${nameOf(c.branchId)} → ${hi.name} (KRC)`)
        }
        return { ...c, branchId: hi.id, branchFrozen: true }
      }
      return c
    }
    // Only strip B-zone sites that landed on Hyd-A
    if (curKey !== 'HYDERABAD-A') return c
    const text = [c.name, c.location].filter(Boolean).join(' · ')
    const geoId = resolveBranchFromSiteGeo(text, branches)
    if (!geoId || geoId === c.branchId) return c
    const geoKey = hydFamilyKey(geoId, branches)
    if (geoKey !== 'HYDERABAD-B') return c
    moved++
    if (samples.length < 50) {
      samples.push(`${c.name} @ ${c.location || '—'}: ${nameOf(c.branchId)} → ${nameOf(geoId)} (zone B)`)
    }
    return { ...c, branchId: geoId, active: true, branchFrozen: true }
  })

  const books = hyd.map((b) => {
    const keys = keysByBranch.get(b.id)
    return {
      id: b.id,
      name: b.name,
      reportSites: keys?.size || 0,
      active: hydOnly.filter((c) => c.branchId === b.id && c.active !== false).length,
    }
  })

  return { clients: hydOnly, moved, added, deactivated, samples, books }
}

export async function freezeClientBooksFromReport(
  date = CLIENT_BOOK_FREEZE_DATE,
): Promise<{
  ok: boolean
  date: string
  submitted: number
  moved: number
  added: number
  deactivated: number
  freeze: ClientBookFreeze
  samples: string[]
  tadaSites?: string[]
  kakinadaSites?: string[]
  /** When true, all-branch freeze left Kakinada book untouched. */
  kakinadaUnchanged?: boolean
  hydBooks?: { id: string; name: string; reportSites: number; active: number }[]
}> {
  const branches = await getBranches(false)
  const nameOf = (id: string) => branches.find((b) => b.id === id)?.name || id
  // All branches from 14-08-2026 — do NOT change Kakinada (Director 17 Aug 2026)
  const reports = (await getReportsForDate(date, branches)).filter(
    (r) =>
      String(r.submittedAt || '').trim() &&
      !isKakinadaBranch(r.branchId, branches) &&
      !isKakinadaBranch(r.branchName || '', branches),
  )
  const clients = await getClients(undefined, { skipRepair: true, branches })
  const priorFreeze = await getClientBookFreeze()

  const submittedIds = new Set(reports.map((r) => r.branchId))
  const byId = new Map(clients.map((c) => [c.id, c]))
  const unused = new Map(clients.map((c) => [c.id, c]))
  const next: MisClient[] = []
  const samples: string[] = ['Kakinada left unchanged (Director)']
  let moved = 0
  let added = 0
  let deactivated = 0

  // Keep every Kakinada client exactly as stored — out of the freeze pool
  for (const [id, c] of [...unused.entries()]) {
    if (isKakinadaBranch(c.branchId, branches)) {
      next.push({ ...c, branchFrozen: true })
      unused.delete(id)
    }
  }

  const ordered = reports.slice().sort(
    (a, b) => lockRank(b.branchName || nameOf(b.branchId)) - lockRank(a.branchName || nameOf(a.branchId)),
  )

  for (const r of ordered) {
    if (isKakinadaBranch(r.branchId, branches) || isKakinadaBranch(r.branchName || '', branches)) continue
    const tadaReport = isTadaBranch(r.branchId, branches) || isTadaBranch(r.branchName || '', branches)
    for (const row of r.rows || []) {
      const name = String(row.clientName || '').trim()
      if (!name) continue
      if (tadaReport && !isTadaBookClient({ name, location: String(row.location || '') })) continue
      const key = siteKey(name, String(row.location || ''))
      const nk = nameKey(name)
      const rowId = String(row.clientId || '').trim()
      const pool = [...unused.values()]
      let hit =
        (rowId && unused.get(rowId)) ||
        pool.find((c) => c.branchId === r.branchId && siteKey(c.name, c.location) === key) ||
        pool.find((c) => c.branchId === r.branchId && nameKey(c.name) === nk) ||
        pool.find(
          (c) =>
            siteKey(c.name, c.location) === key &&
            allowCrossBranchClientSteal(c.branchId, r.branchId, branches),
        ) ||
        undefined
      // Never pull Hyderabad-A / B / Hi-Tech / Kakinada clients onto another book by id or name
      if (hit && hit.branchId !== r.branchId && !allowCrossBranchClientSteal(hit.branchId, r.branchId, branches)) {
        hit =
          pool.find((c) => c.branchId === r.branchId && siteKey(c.name, c.location) === key) ||
          pool.find((c) => c.branchId === r.branchId && nameKey(c.name) === nk) ||
          undefined
      }
      if (hit) {
        unused.delete(hit.id)
        if (hit.branchId !== r.branchId) {
          moved++
          if (samples.length < 40) {
            samples.push(`${hit.name} @ ${hit.location || '—'} → ${nameOf(r.branchId)}`)
          }
        }
        next.push(rowFromDeploy(row, r.branchId, hit))
      } else {
        added++
        if (samples.length < 40) {
          samples.push(`+ ${row.clientName} @ ${row.location || '—'} → ${nameOf(r.branchId)}`)
        }
        const created = rowFromDeploy(row, r.branchId)
        next.push(created)
        byId.set(created.id, created)
      }
    }
  }

  for (const c of unused.values()) {
    if (isKakinadaBranch(c.branchId, branches)) {
      next.push({ ...c, branchFrozen: true })
      continue
    }
    if (submittedIds.has(c.branchId) && c.active !== false) {
      deactivated++
      if (samples.length < 40) {
        samples.push(`off ${c.name} @ ${c.location || '—'} (${nameOf(c.branchId)})`)
      }
      next.push({ ...c, active: false, branchFrozen: true })
    } else {
      next.push({ ...c, branchFrozen: true })
    }
  }

  const tadaClean = evacuateNonTadaBookFromTada(next, branches)
  if (tadaClean.moved) {
    moved += tadaClean.moved
    samples.push(...tadaClean.samples.slice(0, 10))
  }
  // Do not run applyKakinadaBookFromReport — Kakinada stays as-is
  let keptTada: MisClient | null = null
  const collapsed = tadaClean.clients.map((c) => {
    if (isKakinadaBranch(c.branchId, branches)) return { ...c, branchFrozen: true }
    if (!isTadaBranch(c.branchId, branches) || c.active === false) return c
    if (!isTadaBookClient(c)) {
      deactivated++
      return { ...c, active: false, branchFrozen: true }
    }
    if (!keptTada) {
      keptTada = c
      return { ...c, active: true, branchFrozen: true }
    }
    deactivated++
    samples.push(`off extra Tada ${c.name} @ ${c.location || '—'}`)
    return { ...c, active: false, branchFrozen: true }
  })

  // Strict Hyd-A / Hyd-B / Hi-Tech books from this freeze date (Director 17 Aug 2026)
  const hydFix = await strictRealignHydFamilyBooks(date, collapsed, branches)
  moved += hydFix.moved
  added += hydFix.added
  deactivated += hydFix.deactivated
  if (hydFix.samples.length) {
    samples.push('Hyd family realigned to ' + date)
    samples.push(...hydFix.samples.slice(0, 20))
  }

  await saveClients(hydFix.clients, { force: true })

  const byBranch = new Map<string, number>()
  for (const c of hydFix.clients) {
    if (c.active === false) continue
    byBranch.set(c.branchId, (byBranch.get(c.branchId) || 0) + 1)
  }
  const kakinadaSites = hydFix.clients
    .filter((c) => isKakinadaBranch(c.branchId, branches) && c.active !== false)
    .map((c) => `${c.name}${c.location ? ' @ ' + c.location : ''}`)
  const freeze: ClientBookFreeze = {
    date,
    at: new Date().toISOString(),
    submitted: reports.length,
    moved,
    added,
    deactivated,
    kakinadaDate: priorFreeze?.kakinadaDate || KAKINADA_CLIENT_BOOK_DATE,
    kakinadaSites: priorFreeze?.kakinadaSites?.length ? priorFreeze.kakinadaSites : kakinadaSites,
    branches: [
      ...reports.map((r) => ({
        id: r.branchId,
        name: r.branchName || nameOf(r.branchId),
        sites: r.rows?.length || 0,
        active: byBranch.get(r.branchId) || 0,
      })),
      ...branches
        .filter((b) => isKakinadaBranch(b.id, branches) || isKakinadaBranch(b.name, branches))
        .map((b) => ({
          id: b.id,
          name: `${b.name} (unchanged)`,
          sites: byBranch.get(b.id) || 0,
          active: byBranch.get(b.id) || 0,
        })),
    ].sort((a, b) => a.name.localeCompare(b.name)),
  }
  await saveClientBookFreeze(freeze)
  const tadaSites = hydFix.clients
    .filter((c) => isTadaBranch(c.branchId, branches) && c.active !== false)
    .map((c) => `${c.name}${c.location ? ' @ ' + c.location : ''}`)
  return {
    ok: true,
    date,
    submitted: reports.length,
    moved,
    added,
    deactivated,
    freeze,
    samples,
    tadaSites,
    kakinadaSites: freeze.kakinadaSites,
    kakinadaUnchanged: true as const,
    hydBooks: hydFix.books,
  }
}

export async function clientBooksAreFrozen(): Promise<boolean> {
  const stamp = await getClientBookFreeze()
  return Boolean(stamp?.date)
}

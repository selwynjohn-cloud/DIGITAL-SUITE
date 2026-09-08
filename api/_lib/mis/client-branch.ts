import { complaintMatchesBranch, resolveBranchId } from '../guards/store.js'
import { misBranchGroupKey } from './branch-group-key.js'
import { resolveBranchFromSiteGeo } from './client-branch-geo-resolve.js'
import type { MisBranch, MisClient } from './store.js'

type BranchRef = { id: string; name: string }

/**
 * Agile Group / own RUR staff — Corporate Office only.
 * Must never appear on Hyderabad-A (or any ops) Daily MIS client list.
 */
export function isAgileOwnStaffClient(c: {
  name?: string
  location?: string
  geoAddress?: string
  branchCode?: string
}): boolean {
  const name = String(c.name || '').trim()
  const loc = String(c.location || '').trim()
  const blob = [name, loc, c.geoAddress, c.branchCode].filter(Boolean).join(' ')
  if (!name && !loc) return false
  if (/\bagile\s*group\b/i.test(name)) return true
  if (/\bagile\s*group\b/i.test(loc)) return true
  if (/^agile\s*security(\s*force)?(\s*pvt)?(\s*ltd)?\.?$/i.test(name)) return true
  if (/\bagile\b/i.test(name) && /\b(rur|own\s*staff|head\s*office|\bhq\b|corporate\s*office)\b/i.test(blob)) {
    return true
  }
  return false
}

function branchIsCorporateOffice(branchId: string, branches: BranchRef[]): boolean {
  if (!branchId) return false
  if (branchId === 'br-corporate-office') return true
  const b = branches.find((x) => x.id === branchId)
  return Boolean(b && /corporate\s*office/i.test(String(b.name || '')))
}

/** Kakinada ops branch — independent of Visakhapatnam. */
export function isKakinadaBranch(branchId: string, branches: BranchRef[]): boolean {
  if (!branchId) return false
  if (branchId === 'b_kakinada') return true
  const b = branches.find((x) => x.id === branchId || x.name === branchId)
  const name = String(b?.name || branchId)
  return misBranchGroupKey(name) === 'KAKINADA' || /^kakinada$/i.test(name.trim())
}

export function isVisakhapatnamBranch(branchId: string, branches: BranchRef[]): boolean {
  if (!branchId) return false
  if (branchId === 'b_visakhapatnam') return true
  const b = branches.find((x) => x.id === branchId || x.name === branchId)
  const name = String(b?.name || branchId)
  return misBranchGroupKey(name) === 'VISAKHAPATNAM' || /^(visakhapatnam|vizag)$/i.test(name.trim())
}

function clientBlob(c: {
  name?: string
  location?: string
  geoAddress?: string
  branchCode?: string
}): string {
  return [c.name, c.location, c.geoAddress, c.branchCode]
    .filter(Boolean)
    .join(' ')
    .toUpperCase()
    .replace(/[_-]+/g, ' ')
}

function looksLikeVizagCitySite(blob: string): boolean {
  return /\b(VIZAG|VISAKHAPATNAM|VISHAKHAPATNAM|VIZIANAGARAM|GAJUWAKA|MADHURAWADA|SEETHAMMADHARA|GOPALAPATNAM|ANAKAPALL[EI]|PARAWADA|CHIPPADA|\bMVP\b)\b/.test(
    blob,
  )
}

function isDivisTelangana(blob: string): boolean {
  if (!/\bDIVI'?S\b/.test(blob)) return false
  return /\b(TELANGANA|CHOUTUPPAL|SANATHNAGAR|LINGOJIGUDEM|R\s*&\s*D OLD)\b/.test(blob)
}

function isDivisAndhraKakinada(blob: string): boolean {
  if (!/\bDIVI'?S\b/.test(blob)) return false
  if (isDivisTelangana(blob)) return false
  return /\b(THONDANGI|ANDHRA|\bAP\b|KAKINADA)\b/.test(blob)
}

function isWestGodavariOrVijayawadaSite(blob: string): boolean {
  return /\b(ELURU|ELLURU|BHIMAVARAM|BEEMAVARAM|VIJAYAWADA|RR\s*PET|H\.?\s*B\.?\s*COLONY|AVG\s*MULTIPLEX)\b/.test(
    blob,
  )
}

/**
 * Director (14 Aug 2026): Kakinada book — not Visakhapatnam.
 * Not Eluru / Bhimavaram / Vijayawada banks, not SBI, not Divis Telangana.
 */
export function isKakinadaBookClient(c: {
  name?: string
  location?: string
  geoAddress?: string
  branchCode?: string
}): boolean {
  const blob = clientBlob(c)
  if (!blob.trim()) return false
  if (isKakinadaLeftoverClient(c)) return false
  if (isSrmtClient(c)) return false
  if (isKakinadaNriSite(c)) return true
  if (/\bCOROMANDEL\b/.test(blob)) return true
  if (/\b(KALEESWARI|KALEESUWARI)\b/.test(blob)) return true
  if (isDivisAndhraKakinada(blob)) return true
  if (/\bGEMINI\b/.test(blob) && !/\bNELLORE\b/.test(blob)) return true
  if (!/\b(HDFC|IDBI)\b/.test(blob)) return false
  if (looksLikeVizagCitySite(blob)) return false
  return /\b(KAKINADA|RAJAHMUNDRY|RAJAHMANDRY|RAJHMUNDRY|RAJAMUNDRY|ANNAVARAM|AMALAPURAM|KOTHAPETA|TATIPAKA|RAZOLE|THONDANGI|EAST GODAVARI)\b/.test(
    blob,
  )
}

/** Director: take these off Kakinada (14 Aug evening). */
export function isKakinadaLeftoverClient(c: {
  name?: string
  location?: string
  geoAddress?: string
  branchCode?: string
}): boolean {
  const blob = clientBlob(c)
  if (!blob.trim()) return false
  if (isDivisTelangana(blob)) return true
  if (/\b(STATE BANK|SBI)\b/.test(blob)) return true
  if (/\bAVG\b/.test(blob) && /\b(BHIMAVARAM|BEEMAVARAM)\b/.test(blob)) return true
  if (/\b(HDFC|IDBI)\b/.test(blob) && isWestGodavariOrVijayawadaSite(blob)) return true
  return false
}

/** Director (15 Aug 2026): NRI site stays on Kakinada. */
export function isKakinadaNriSite(c: {
  name?: string
  location?: string
  geoAddress?: string
  branchCode?: string
}): boolean {
  const blob = clientBlob(c)
  if (!blob.trim()) return false
  if (/\bNRI\s*SITE\b/.test(blob)) return true
  return /\b(SREERAMA|SREE\s*RAMA|RATNAJYOTHI|RATNA\s*JYOTHI)\b/.test(blob)
}

export function isSrmtClient(c: {
  name?: string
  location?: string
  geoAddress?: string
  branchCode?: string
}): boolean {
  const blob = [c.name, c.location, c.geoAddress, c.branchCode]
    .filter(Boolean)
    .join(' ')
    .toUpperCase()
  return /\bSRMT\b/.test(blob)
}

/** Tada ops branch — Director lock: Premier Energies, Naidupetta only. */
export function isTadaBranch(branchId: string, branches: BranchRef[]): boolean {
  if (!branchId) return false
  const b = branches.find((x) => x.id === branchId || x.name === branchId)
  const name = String(b?.name || branchId)
  return misBranchGroupKey(name) === 'TADA' || /^tada$/i.test(name.trim())
}

/** The only Tada client: Premier Energies, Naidupetta. */
export function isTadaBookClient(c: {
  name?: string
  location?: string
  geoAddress?: string
  branchCode?: string
}): boolean {
  const blob = [c.name, c.location, c.geoAddress, c.branchCode]
    .filter(Boolean)
    .join(' ')
    .toUpperCase()
    .replace(/[_-]+/g, ' ')
  if (!blob.trim()) return false
  if (!/\bPREMIER\s*ENERG/.test(blob)) return false
  return /\bNAIDUPETT?A?\b/.test(blob)
}

/** Hi-Tech City ops branch — Director lock: KRC family sites only. */
export function isHiTechCityBranch(branchId: string, branches: BranchRef[]): boolean {
  if (!branchId) return false
  const b = branches.find((x) => x.id === branchId || x.name === branchId)
  const name = String(b?.name || branchId)
  const key = misBranchGroupKey(name)
  // Live Data Bank ids drift (br15 is Mumbai, br4 is Hi-Tech). Never key off br#.
  if (key === 'MUMBAI' || /^mumbai$/i.test(name.trim())) return false
  return key === 'HI-TECH CITY' || /^hi-?tech/i.test(name.trim())
}

/**
 * KRC / K Raheja Mindspace family (Hi-Tech City only).
 * Non-KRC sites in Gachibowli / Madhapur / etc. must not appear on Hi-Tech dropdowns.
 */
export function isKrcHiTechClient(c: {
  name?: string
  location?: string
  geoAddress?: string
  branchCode?: string
}): boolean {
  const blob = [c.name, c.location, c.geoAddress, c.branchCode]
    .filter(Boolean)
    .join(' ')
    .toUpperCase()
  if (!blob.trim()) return false
  if (/\bKRC\b/.test(blob)) return true
  if (/K\s*RAHEJA|RAHEJA\s*CORP|RAHEJA\s*MIND/.test(blob)) return true
  if (/MIND\s*A?SPACE|SUNDEW|STARGAZE|NEWFOUND/.test(blob)) return true
  if (/J\.?\s*T\.?\s*HOLD|KRIT\s*OFFICE|POCHARAM/.test(blob)) return true
  return false
}

/** Ops Daily MIS must never list Corporate Office / own-staff sites. */
export function isExcludedFromMisReporting(
  c: MisClient,
  branches: BranchRef[],
): boolean {
  if (isAgileOwnStaffClient(c)) return true
  if (branchIsCorporateOffice(String(c.branchId || ''), branches)) return true
  const b = branches.find((x) => x.id === c.branchId)
  if (b && /training\s*(academy|department)|recruitment\s*(department|dept)|it\s*department/i.test(b.name)) {
    return true
  }
  return false
}

/** Site text for branch / geo checks (name + location + geo address). */
export function clientSiteText(c: {
  name?: string
  location?: string
  geoAddress?: string
  branchCode?: string
}): string {
  return [c.name, c.location, c.geoAddress, c.branchCode].filter(Boolean).join(' · ')
}

/** True when site geography matches this branch (stored id + location text agree). */
export function clientBelongsToBranchForReporting(
  c: MisClient,
  branchId: string,
  branches: BranchRef[],
): boolean {
  if (!clientMatchesBranch(c.branchId, branchId, branches)) return false
  const geoId = resolveBranchFromSiteGeo(clientSiteText(c), branches as MisBranch[])
  if (!geoId) return true
  if (clientMatchesBranch(geoId, branchId, branches)) return true
  const scope = resolveBranchId(branchId, branches)?.id || branchId
  const geo = resolveBranchId(geoId, branches)?.id || geoId
  const scopeBranch = branches.find((b) => b.id === scope)
  const geoBranch = branches.find((b) => b.id === geo)
  return misBranchGroupKey(scopeBranch?.name || '') === misBranchGroupKey(geoBranch?.name || '')
}
export function clientMatchesBranch(
  clientBranchId: string,
  scopeBranchId: string,
  branches: BranchRef[],
): boolean {
  if (!scopeBranchId) return true
  if (complaintMatchesBranch(clientBranchId, scopeBranchId, branches)) return true

  const scope = resolveBranchId(scopeBranchId, branches)
  const client = resolveBranchId(clientBranchId, branches)
  if (scope && client) return scope.id === client.id

  const scopeBranch = branches.find((b) => b.id === scopeBranchId)
  const scopeName = String(scopeBranch?.name ?? scopeBranchId).trim()
  return (
    clientBranchId === scopeBranchId ||
    clientBranchId.toLowerCase() === scopeName.toLowerCase()
  )
}

/** Rewrite client branchId to canonical MIS branch ids (br1, br2, …). */
export function normalizeClientBranchIds(
  clients: MisClient[],
  branches: BranchRef[],
): { list: MisClient[]; changed: boolean } {
  let changed = false
  const list = clients.map((c) => {
    const resolved = resolveBranchId(c.branchId, branches)
    if (!resolved) return c
    if (c.branchId !== resolved.id) {
      changed = true
      return { ...c, branchId: resolved.id }
    }
    return c
  })
  return { list, changed }
}

export function filterClientsForBranch(
  clients: MisClient[],
  branchId: string,
  branches: BranchRef[],
): MisClient[] {
  if (!branchId) return clients
  const scopeIsCorporate = branchIsCorporateOffice(branchId, branches)
  const scopeIsHiTech = isHiTechCityBranch(branchId, branches)
  const scopeIsVizag = isVisakhapatnamBranch(branchId, branches)
  const scopeIsKakinada = isKakinadaBranch(branchId, branches)
  const scopeIsTada = isTadaBranch(branchId, branches)
  return clients.filter((c) => {
    if (!clientMatchesBranch(c.branchId, branchId, branches)) return false
    // Ops branches: never show Agile Group / Corporate Office sites
    if (!scopeIsCorporate && isExcludedFromMisReporting(c, branches)) return false
    // Hi-Tech City = KRC family only (Director lock)
    if (scopeIsHiTech && !isKrcHiTechClient(c)) return false
    // Tada = Premier Energies, Naidupetta only (Director lock 15 Aug 2026)
    if (scopeIsTada && !isTadaBookClient(c)) return false
    // Visakhapatnam must not show the Kakinada book
    if (scopeIsVizag && (isKakinadaBookClient(c) || isSrmtClient(c))) return false
    if (scopeIsKakinada && isKakinadaLeftoverClient(c)) return false
    if (scopeIsKakinada && isSrmtClient(c)) return false
    return true
  })
}

/** Sites for one branch — canonical branch id only (no cross-zone bleed). */
export function sitesForBranch(
  clients: MisClient[],
  branchId: string,
  branches: BranchRef[],
  onlyActive = true,
): MisClient[] {
  if (!branchId) {
    return onlyActive ? clients.filter((c) => c.active !== false) : clients
  }
  const scopeId = resolveBranchId(branchId, branches)?.id || branchId
  const scopeIsCorporate = branchIsCorporateOffice(scopeId, branches)
  const scopeIsHiTech = isHiTechCityBranch(scopeId, branches)
  const scopeIsVizag = isVisakhapatnamBranch(scopeId, branches)
  const scopeIsKakinada = isKakinadaBranch(scopeId, branches)
  const scopeIsTada = isTadaBranch(scopeId, branches)
  const byId = new Map<string, MisClient>()
  for (const c of clients) {
    const canon = resolveBranchId(c.branchId, branches)?.id || String(c.branchId || '').trim()
    if (canon !== scopeId) continue
    if (!scopeIsCorporate && isExcludedFromMisReporting(c, branches)) continue
    if (scopeIsHiTech && !isKrcHiTechClient(c)) continue
    if (scopeIsTada && !isTadaBookClient(c)) continue
    if (scopeIsVizag && (isKakinadaBookClient(c) || isSrmtClient(c))) continue
    if (scopeIsKakinada && isKakinadaLeftoverClient(c)) continue
    if (scopeIsKakinada && isSrmtClient(c)) continue
    byId.set(c.id || `${c.name}|${c.location}`, { ...c, branchId: scopeId })
  }
  let list = [...byId.values()]
  if (onlyActive) list = list.filter((c) => c.active !== false)
  return list
}

/**
 * Director (15 Aug 2026): Tada keeps only Premier Energies, Naidupetta.
 * HDFC Tada and any other site move to Nellore.
 */
export function evacuateNonTadaBookFromTada(
  clients: MisClient[],
  branches: BranchRef[],
): { clients: MisClient[]; moved: number; samples: string[] } {
  const tada = branches.find((b) => isTadaBranch(b.id, branches) || isTadaBranch(b.name, branches))
  const nellore =
    branches.find((b) => misBranchGroupKey(b.name) === 'NELLORE') ||
    branches.find((b) => /^nellore$/i.test(String(b.name || '').trim()))
  if (!tada || !nellore) return { clients, moved: 0, samples: [] }
  const tadaId = resolveBranchId(tada.id, branches)?.id || tada.id
  const nelloreId = resolveBranchId(nellore.id, branches)?.id || nellore.id
  let moved = 0
  const samples: string[] = []
  const next = clients.map((c) => {
    const canon = resolveBranchId(c.branchId, branches)?.id || String(c.branchId || '').trim()
    if (canon !== tadaId) return c
    if (isTadaBookClient(c)) return { ...c, active: true, branchFrozen: true }
    moved++
    if (samples.length < 20) {
      samples.push(`${c.name}${c.location ? ' @ ' + c.location : ''} → ${nellore.name}`)
    }
    return { ...c, branchId: nelloreId, branchFrozen: true }
  })
  return { clients: next, moved, samples }
}

/**
 * Director lock: every non-KRC site on Hi-Tech City moves to Hyderabad-A.
 * Returns updated client list + move log.
 */
export function evacuateNonKrcFromHiTech(
  clients: MisClient[],
  branches: BranchRef[],
): { clients: MisClient[]; moved: number; samples: string[] } {
  const hiTech = branches.find((b) => isHiTechCityBranch(b.id, branches) || isHiTechCityBranch(b.name, branches))
  const hydA =
    branches.find((b) => misBranchGroupKey(b.name) === 'HYDERABAD-A') ||
    branches.find((b) => /^hyderabad-?a$/i.test(String(b.name || '').trim()))
  if (!hiTech || !hydA) return { clients, moved: 0, samples: [] }

  const hiTechId = resolveBranchId(hiTech.id, branches)?.id || hiTech.id
  const hydAId = resolveBranchId(hydA.id, branches)?.id || hydA.id
  let moved = 0
  const samples: string[] = []
  const next = clients.map((c) => {
    const canon = resolveBranchId(c.branchId, branches)?.id || String(c.branchId || '').trim()
    if (canon !== hiTechId) return c
    if (isKrcHiTechClient(c)) return c
    moved++
    if (samples.length < 40) {
      samples.push(`${c.name}${c.location ? ' @ ' + c.location : ''} → ${hydA.name}`)
    }
    return { ...c, branchId: hydAId }
  })
  return { clients: next, moved, samples }
}

/** Drop non-KRC deploy rows when the report branch is Hi-Tech City. */
export function filterDeployRowsForHiTechKrc<T extends { clientName?: string; location?: string; name?: string }>(
  rows: T[],
  branchId: string,
  branches: BranchRef[],
): T[] {
  if (!isHiTechCityBranch(branchId, branches)) return rows
  return rows.filter((r) =>
    isKrcHiTechClient({
      name: r.clientName || r.name,
      location: r.location,
    }),
  )
}

/**
 * Director: take the Kakinada book off Visakhapatnam and put it on Kakinada.
 * Does not geo-reassign other Vizag sites.
 */
export function moveKakinadaBookFromVizag(
  clients: MisClient[],
  branches: BranchRef[],
): { clients: MisClient[]; moved: number; samples: string[] } {
  const kakinada = branches.find((b) => isKakinadaBranch(b.id, branches) || isKakinadaBranch(b.name, branches))
  const vizag =
    branches.find((b) => isVisakhapatnamBranch(b.id, branches) || isVisakhapatnamBranch(b.name, branches)) ||
    branches.find((b) => misBranchGroupKey(b.name) === 'VISAKHAPATNAM')
  if (!kakinada || !vizag) return { clients, moved: 0, samples: [] }

  const kakinadaId = resolveBranchId(kakinada.id, branches)?.id || kakinada.id
  const vizagId = resolveBranchId(vizag.id, branches)?.id || vizag.id
  let moved = 0
  const samples: string[] = []
  const next = clients.map((c) => {
    const canon = resolveBranchId(c.branchId, branches)?.id || String(c.branchId || '').trim()
    if (canon !== vizagId) return c
    if (!isKakinadaBookClient(c)) return c
    moved++
    if (samples.length < 40) {
      samples.push(`${c.name}${c.location ? ' @ ' + c.location : ''} → ${kakinada.name}`)
    }
    return { ...c, branchId: kakinadaId, active: isSrmtClient(c) ? false : c.active !== false }
  })
  return { clients: next, moved, samples }
}

/** SRMT is terminated — keep off lists (inactive, never shown on Kakinada). */
export function placeSrmtOnKakinada(
  clients: MisClient[],
  branches: BranchRef[],
): { clients: MisClient[]; moved: number; samples: string[] } {
  const kakinada = branches.find((b) => isKakinadaBranch(b.id, branches) || isKakinadaBranch(b.name, branches))
  if (!kakinada) return { clients, moved: 0, samples: [] }
  const kakinadaId = resolveBranchId(kakinada.id, branches)?.id || kakinada.id
  let moved = 0
  const samples: string[] = []
  const next = clients.map((c) => {
    if (!isSrmtClient(c)) return c
    const canon = resolveBranchId(c.branchId, branches)?.id || String(c.branchId || '').trim()
    if (canon === kakinadaId && c.active === false) return c
    moved++
    if (samples.length < 10) {
      samples.push(`${c.name}${c.location ? ' @ ' + c.location : ''} → terminated`)
    }
    return { ...c, branchId: kakinadaId, active: false }
  })
  return { clients: next, moved, samples }
}

function leftoverDestinationId(c: MisClient, branches: BranchRef[]): { id: string; name: string } | null {
  const blob = clientBlob(c)
  if (isDivisTelangana(blob)) {
    const hydB =
      branches.find((b) => misBranchGroupKey(b.name) === 'HYDERABAD-B') ||
      branches.find((b) => /hyderabad-?b/i.test(String(b.name || '')))
    return hydB ? { id: resolveBranchId(hydB.id, branches)?.id || hydB.id, name: hydB.name } : null
  }
  const vizag =
    branches.find((b) => isVisakhapatnamBranch(b.id, branches) || isVisakhapatnamBranch(b.name, branches)) ||
    branches.find((b) => misBranchGroupKey(b.name) === 'VISAKHAPATNAM')
  return vizag ? { id: resolveBranchId(vizag.id, branches)?.id || vizag.id, name: vizag.name } : null
}

/**
 * Director: leftovers leave Kakinada.
 * Divis Telangana → Hyderabad-B. Eluru / Bhimavaram / SBI / AVG → Visakhapatnam (where picked up).
 */
export function evacuateKakinadaLeftovers(
  clients: MisClient[],
  branches: BranchRef[],
): { clients: MisClient[]; moved: number; samples: string[] } {
  const kakinada = branches.find((b) => isKakinadaBranch(b.id, branches) || isKakinadaBranch(b.name, branches))
  if (!kakinada) return { clients, moved: 0, samples: [] }
  const kakinadaId = resolveBranchId(kakinada.id, branches)?.id || kakinada.id
  let moved = 0
  const samples: string[] = []
  const next = clients.map((c) => {
    const canon = resolveBranchId(c.branchId, branches)?.id || String(c.branchId || '').trim()
    if (canon !== kakinadaId) return c
    if (!isKakinadaLeftoverClient(c)) return c
    const dest = leftoverDestinationId(c, branches)
    if (!dest) return c
    moved++
    if (samples.length < 40) {
      samples.push(`${c.name}${c.location ? ' @ ' + c.location : ''} → ${dest.name}`)
    }
    return { ...c, branchId: dest.id }
  })
  return { clients: next, moved, samples }
}

/** Director (15 Aug 2026): SRMT terminated; NRI site stays on Kakinada. */
export function applyKakinadaTerminatedAndNri(
  clients: MisClient[],
  branches: BranchRef[],
): { clients: MisClient[]; changed: number; samples: string[] } {
  const kakinada = branches.find((b) => isKakinadaBranch(b.id, branches) || isKakinadaBranch(b.name, branches))
  if (!kakinada) return { clients, changed: 0, samples: [] }
  const kakinadaId = resolveBranchId(kakinada.id, branches)?.id || kakinada.id
  let changed = 0
  const samples: string[] = []
  const next = clients.map((c) => {
    if (isSrmtClient(c) && c.active !== false) {
      changed++
      samples.push(`SRMT terminated — ${c.name}`)
      return { ...c, active: false, branchFrozen: true }
    }
    if (isKakinadaNriSite(c)) {
      const canon = resolveBranchId(c.branchId, branches)?.id || String(c.branchId || '').trim()
      if (canon === kakinadaId && c.active !== false) return c
      changed++
      samples.push(`NRI site on Kakinada — ${c.name}`)
      return { ...c, branchId: kakinadaId, active: true, branchFrozen: true }
    }
    return c
  })
  return { clients: next, changed, samples }
}

/** Drop leftovers from a Kakinada Daily MIS draft. */
export function filterDeployRowsForKakinada<T extends { clientName?: string; location?: string; name?: string }>(
  rows: T[],
  branchId: string,
  branches: BranchRef[],
): T[] {
  if (!isKakinadaBranch(branchId, branches)) return rows
  return rows.filter((r) => {
    const row = { name: r.clientName || r.name, location: r.location }
    if (isSrmtClient(row)) return false
    return !isKakinadaLeftoverClient(row)
  })
}

/** Drop the Kakinada book from a Visakhapatnam Daily MIS draft. */
export function filterDeployRowsForVizag<T extends { clientName?: string; location?: string; name?: string }>(
  rows: T[],
  branchId: string,
  branches: BranchRef[],
): T[] {
  if (!isVisakhapatnamBranch(branchId, branches)) return rows
  return rows.filter((r) => {
    const row = { name: r.clientName || r.name, location: r.location }
    if (isSrmtClient(row)) return false
    return !isKakinadaBookClient(row)
  })
}

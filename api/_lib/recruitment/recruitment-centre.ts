/**
 * Hyderabad recruitment centre recruits for Hyd-A, Hyd-B, Hi-Tech City,
 * and other branches when required. Independent branches have their own RC.
 *
 * IMPORTANT: MIS branch ids (br4/br5/…) are not stable across Data Bank resets.
 * Always resolve Hyd zones by branch **name** via resolveHyderabadRcZones().
 */

export type RecruitmentZoneBranch = {
  misBranchId: string
  label: string
}

type ZoneDef = {
  label: string
  match: RegExp
  /** Fallback id from DEFAULT_BRANCHES order in mis/store (only if name match fails). */
  fallbackId: string
}

const ZONE_DEFS: ZoneDef[] = [
  {
    label: 'Hyderabad - A Branch',
    match: /hyderabad[\s\-–]*a\b|hyd[\s\-]*zone[\s\-]*a/i,
    /** Live Data Bank often uses br2; never trust this alone — name match wins. */
    fallbackId: 'br2',
  },
  {
    label: 'Hyderabad - B Branch',
    match: /hyderabad[\s\-–]*b\b|hyd[\s\-]*zone[\s\-]*b/i,
    fallbackId: 'br3',
  },
  {
    label: 'Hi-Tech City Branch',
    match: /hi-?tech/i,
    fallbackId: 'br15',
  },
]

/**
 * Fallback only — old code wrongly used br4=Hi-Tech / br5=Hyd-A / br6=Hyd-B
 * (those ids are Corporate Office / Hi-Tech / Hyd-A in DEFAULT_BRANCHES).
 */
export const HYDERABAD_RC_ZONES: RecruitmentZoneBranch[] = ZONE_DEFS.map((z) => ({
  misBranchId: z.fallbackId,
  label: z.label,
}))

/** True if this MIS branch name is one of the three Hyderabad RC zones. */
export function isHyderabadRcBranchName(name: string): boolean {
  const n = String(name ?? '').trim()
  return ZONE_DEFS.some((z) => z.match.test(n))
}

/**
 * Resolve Hyd-A / Hyd-B / Hi-Tech to live MIS branch ids by name.
 * Prevents Hi-Tech shortages pulling Corporate Office (or any wrong br#) data.
 */
export function resolveHyderabadRcZones(
  branches: { id: string; name: string }[],
): RecruitmentZoneBranch[] {
  const list = Array.isArray(branches) ? branches : []
  const used = new Set<string>()
  const out: RecruitmentZoneBranch[] = []

  for (const def of ZONE_DEFS) {
    const hit = list.find((b) => {
      const id = String(b.id || '').trim()
      if (!id || used.has(id)) return false
      return def.match.test(String(b.name || ''))
    })
    if (hit) {
      used.add(hit.id)
      out.push({ misBranchId: hit.id, label: def.label })
      continue
    }
    /**
     * Fallback id only when that id’s **name** also matches this zone.
     * Never attach “Hyderabad - A” label to br6 if br6 is another city (ids drift).
     */
    const fb = list.find((b) => {
      const id = String(b.id || '').trim()
      if (!id || id !== def.fallbackId || used.has(id)) return false
      return def.match.test(String(b.name || ''))
    })
    if (fb) {
      used.add(fb.id)
      out.push({ misBranchId: fb.id, label: def.label })
      continue
    }
    if (!list.length) {
      out.push({ misBranchId: def.fallbackId, label: def.label })
    }
  }
  return out.length ? out : HYDERABAD_RC_ZONES.slice()
}

/** True if this MIS id is a physical Hyd-A / Hyd-B / Hi-Tech branch (not a department). */
export function isHyderabadPhysicalZone(
  misBranchId?: string,
  branches?: { id: string; name: string }[],
): boolean {
  const id = String(misBranchId ?? '').trim()
  if (!id || id.startsWith('recruit-dept:')) return false
  if (branches?.length) {
    const zones = resolveHyderabadRcZones(branches)
    if (zones.some((z) => z.misBranchId === id)) return true
    const hit = branches.find((b) => b.id === id)
    if (hit && isHyderabadRcBranchName(hit.name)) return true
  }
  return HYDERABAD_RC_ZONES.some((z) => z.misBranchId === id)
}

/**
 * Who ENTERS DRR for Hyd-A · Hyd-B · Hi-Tech.
 * Recruitment Department (Hyderabad) — not the branch HODs of those zones.
 */
export function isHyderabadRcEnterer(
  misBranchId?: string,
  recruitmentBranchId?: string,
  branches?: { id: string; name: string }[],
): boolean {
  const rb = String(recruitmentBranchId ?? '').trim()
  const id = String(misBranchId ?? '').trim()
  if (rb === 'Recruitment Department') return true
  if (/^recruit-dept:recruitment/i.test(id)) return true
  /** Legacy centre login named Hyderabad (not a physical A/B/Hi-Tech MIS id). */
  if (rb === 'Hyderabad' && !isHyderabadPhysicalZone(id, branches)) return true
  return false
}

/**
 * Hyd-A / Hyd-B / Hi-Tech branch HOD — may VIEW DRR for their zone, not enter recruits.
 * (Recruitment Department enters for all three.)
 */
export function isHyderabadZoneHodViewer(
  misBranchId?: string,
  recruitmentBranchId?: string,
  branches?: { id: string; name: string }[],
): boolean {
  return (
    isHyderabadPhysicalZone(misBranchId, branches) &&
    !isHyderabadRcEnterer(misBranchId, recruitmentBranchId, branches)
  )
}

export function isHyderabadRecruitmentCentre(
  misBranchId?: string,
  recruitmentBranchId?: string,
  branches?: { id: string; name: string }[],
): boolean {
  const rb = String(recruitmentBranchId ?? '').trim()
  if (rb === 'Hyderabad') return true
  /** Portal teams that see Hyd-A · Hyd-B · Hi-Tech DRR (enter or view). */
  if (
    rb === 'Recruitment Department' ||
    rb === 'Corporate Office' ||
    rb === 'Training Academy' ||
    rb === 'IT Department'
  ) {
    return true
  }
  const id = String(misBranchId ?? '').trim()
  if (!id) return false
  if (id.startsWith('recruit-dept:')) return true
  return isHyderabadPhysicalZone(id, branches)
}

/** Store / filter key for Hyderabad RC packages (always Hyderabad, not department name). */
export function hyderabadRcStoreBranchId(recruitmentBranchId?: string): string {
  const rb = String(recruitmentBranchId ?? '').trim()
  if (
    !rb ||
    rb === 'Hyderabad' ||
    rb === 'Recruitment Department' ||
    rb === 'Corporate Office' ||
    rb === 'Training Academy' ||
    rb === 'IT Department'
  ) {
    return 'Hyderabad'
  }
  return rb
}

/**
 * Resolve a physical MIS branch for DRR / Master Directory sync.
 * Prefer label / name (Hyderabad - A) over stale br# ids.
 */
export function resolveMisBranchForDrr(
  branches: { id: string; name: string }[],
  opts: { id?: string; label?: string } = {},
): { misBranchId: string; label: string } | null {
  const list = Array.isArray(branches) ? branches : []
  const hydZones = resolveHyderabadRcZones(list)
  const label = String(opts.label || '').trim()
  const id = String(opts.id || '').trim()

  const norm = (s: string) =>
    String(s || '')
      .toLowerCase()
      .replace(/\s+branch$/i, '')
      .trim()

  const labelMatch = (a: string, b: string) => {
    const x = norm(a)
    const y = norm(b)
    if (!x || !y) return false
    if (x === y) return true
    if (x.includes(y) || y.includes(x)) return true
    if (/hyderabad[\s\-–]*a|hyd[\s\-]*zone[\s\-]*a/i.test(x) && /hyderabad[\s\-–]*a/i.test(y)) return true
    if (/hyderabad[\s\-–]*b|hyd[\s\-]*zone[\s\-]*b/i.test(x) && /hyderabad[\s\-–]*b/i.test(y)) return true
    if (/hi-?tech/i.test(x) && /hi-?tech/i.test(y)) return true
    return false
  }

  if (label) {
    const hyd = hydZones.find((z) => labelMatch(label, z.label))
    if (hyd) return { misBranchId: hyd.misBranchId, label: hyd.label }
    const byName = list.find(
      (b) => labelMatch(label, b.name) || labelMatch(label, b.id) || b.id === label,
    )
    if (byName) {
      const zl = hydZones.find((z) => z.misBranchId === byName.id)?.label || byName.name
      return { misBranchId: byName.id, label: zl }
    }
  }

  if (id && !id.startsWith('recruit-dept:') && id !== 'Hyderabad' && id !== 'Recruitment Department') {
    const hyd = hydZones.find((z) => z.misBranchId === id)
    if (hyd) {
      if (label && !labelMatch(label, hyd.label)) {
        /* stale id vs label — keep searching */
      } else {
        return { misBranchId: hyd.misBranchId, label: hyd.label }
      }
    }
    const meta = list.find((b) => b.id === id)
    if (meta) {
      if (label && !labelMatch(label, meta.name) && !labelMatch(label, zoneLabel(meta.id, list))) {
        /* reject mismatched id */
      } else {
        return {
          misBranchId: meta.id,
          label: hydZones.find((z) => z.misBranchId === meta.id)?.label || meta.name,
        }
      }
    }
  }

  return null
}

export function zoneLabel(
  misBranchId: string,
  branches?: { id: string; name: string }[],
): string {
  if (branches?.length) {
    const zones = resolveHyderabadRcZones(branches)
    const hit = zones.find((z) => z.misBranchId === misBranchId)
    if (hit) return hit.label
    const b = branches.find((x) => x.id === misBranchId)
    if (b && isHyderabadRcBranchName(b.name)) {
      const def = ZONE_DEFS.find((z) => z.match.test(b.name))
      if (def) return def.label
    }
  }
  const hit = HYDERABAD_RC_ZONES.find((z) => z.misBranchId === misBranchId)
  return hit?.label || misBranchId
}

export function packageKey(
  branchId: string,
  zoneBranchId: string,
  reportDate: string,
  company: string,
): string {
  return [branchId, zoneBranchId || branchId, reportDate, company].join('|')
}

/**
 * Recruitment branch metadata — centres, MIS linkage.
 * Gulbarga rolls under Bangalore (not a separate recruitment centre).
 * Hyderabad A · B · Hi-Tech City are separate rows (Training Department / Recruitment Dept DRR).
 * Independent ops cities stay separate (Nellore ≠ Tada, Chennai ≠ Puducherry, etc.).
 */

export type RecruitmentCentreType = 'shared' | 'independent'

export type RecruitmentBranchMeta = {
  /** Recruitment portal branch id (matches DRR branchId) */
  id: string
  displayName: string
  /** Where the recruitment centre physically operates */
  recruitmentCentre: string
  centreType: RecruitmentCentreType
  /** MIS / daily report branch name hints (exact city only — do not join neighbours) */
  misNameHints: string[]
  state: string
}

/** Recruitment centres A–Z — Corporate Office / Gulbarga are not centres. */
export const RECRUITMENT_BRANCH_META: RecruitmentBranchMeta[] = [
  {
    id: 'Bangalore',
    displayName: 'Bangalore (incl. Gulbarga)',
    recruitmentCentre: 'Bangalore',
    centreType: 'independent',
    misNameHints: ['Bangalore', 'Bengaluru', 'Gulbarga', 'Kalaburagi'],
    state: 'Karnataka',
  },
  {
    id: 'Bhopal',
    displayName: 'Bhopal',
    recruitmentCentre: 'Bhopal',
    centreType: 'independent',
    misNameHints: ['Bhopal'],
    state: 'Madhya Pradesh',
  },
  {
    id: 'Chennai',
    displayName: 'Chennai',
    recruitmentCentre: 'Chennai',
    centreType: 'independent',
    misNameHints: ['Chennai'],
    state: 'Tamil Nadu',
  },
  {
    id: 'Hi-Tech City',
    displayName: 'Hi-Tech City',
    recruitmentCentre: 'Hi-Tech City',
    centreType: 'independent',
    misNameHints: ['Hi-Tech', 'Hitech', 'Hi Tech'],
    state: 'Telangana',
  },
  {
    id: 'Hyderabad - A',
    displayName: 'Hyderabad - A',
    recruitmentCentre: 'Hyderabad - A',
    centreType: 'independent',
    misNameHints: ['Hyderabad - A', 'Hyderabad-A', 'Hyd Zone A', 'Zone A'],
    state: 'Telangana',
  },
  {
    id: 'Hyderabad - B',
    displayName: 'Hyderabad - B',
    recruitmentCentre: 'Hyderabad - B',
    centreType: 'independent',
    misNameHints: ['Hyderabad - B', 'Hyderabad-B', 'Hyd Zone B', 'Zone B'],
    state: 'Telangana',
  },
  {
    id: 'Kakinada',
    displayName: 'Kakinada',
    recruitmentCentre: 'Kakinada',
    centreType: 'independent',
    misNameHints: ['Kakinada'],
    state: 'Andhra Pradesh',
  },
  {
    id: 'Kochi',
    displayName: 'Kochi',
    recruitmentCentre: 'Kochi',
    centreType: 'independent',
    misNameHints: ['Kochi', 'Cochin'],
    state: 'Kerala',
  },
  {
    id: 'Lucknow',
    displayName: 'Lucknow',
    recruitmentCentre: 'Lucknow',
    centreType: 'independent',
    /** Recruit boys from Lucknow — not a Daily MIS reporting branch. */
    misNameHints: ['Lucknow'],
    state: 'Uttar Pradesh',
  },
  {
    id: 'Mumbai',
    displayName: 'Mumbai',
    recruitmentCentre: 'Mumbai',
    centreType: 'independent',
    misNameHints: ['Mumbai'],
    state: 'Maharashtra',
  },
  {
    id: 'Nellore',
    displayName: 'Nellore',
    recruitmentCentre: 'Nellore',
    centreType: 'independent',
    misNameHints: ['Nellore'],
    state: 'Andhra Pradesh',
  },
  {
    id: 'Puducherry',
    displayName: 'Puducherry',
    recruitmentCentre: 'Puducherry',
    centreType: 'independent',
    misNameHints: ['Puducherry', 'Pondicherry'],
    state: 'Puducherry',
  },
  {
    id: 'Surat',
    displayName: 'Surat',
    recruitmentCentre: 'Surat',
    centreType: 'independent',
    misNameHints: ['Surat'],
    state: 'Gujarat',
  },
  {
    id: 'Tada',
    displayName: 'Tada',
    recruitmentCentre: 'Tada',
    centreType: 'independent',
    misNameHints: ['Tada'],
    state: 'Andhra Pradesh',
  },
  {
    id: 'Tadipatri',
    displayName: 'Tadipatri',
    recruitmentCentre: 'Tadipatri',
    centreType: 'independent',
    misNameHints: ['Tadipatri'],
    state: 'Andhra Pradesh',
  },
  {
    id: 'Tirupati',
    displayName: 'Tirupati',
    recruitmentCentre: 'Tirupati',
    centreType: 'independent',
    misNameHints: ['Tirupati'],
    state: 'Andhra Pradesh',
  },
  {
    id: 'Vijayawada',
    displayName: 'Vijayawada',
    recruitmentCentre: 'Vijayawada',
    centreType: 'independent',
    misNameHints: ['Vijayawada'],
    state: 'Andhra Pradesh',
  },
  {
    id: 'Visakhapatnam',
    displayName: 'Visakhapatnam',
    recruitmentCentre: 'Visakhapatnam',
    centreType: 'independent',
    misNameHints: ['Visakhapatnam', 'Vizag'],
    state: 'Andhra Pradesh',
  },
]

export function recruitmentBranchIds(): string[] {
  return RECRUITMENT_BRANCH_META.map((b) => b.id)
}

export function metaForRecruitBranch(branchId: string): RecruitmentBranchMeta | undefined {
  const key = branchId.trim()
  return RECRUITMENT_BRANCH_META.find(
    (b) => b.id === key || b.displayName === key || b.misNameHints.some((h) => key.includes(h)),
  )
}

export function centreLabel(meta: RecruitmentBranchMeta): string {
  if (meta.centreType === 'shared') {
    return `${meta.recruitmentCentre} RC (shared — ${meta.displayName})`
  }
  return `${meta.recruitmentCentre} RC (independent)`
}

/** MIS branch id → dashboard header (explicit aliases only — not br1–br15, IDs vary in Data Bank). */
const RECRUIT_BRANCH_ID_DISPLAY: Record<string, string> = {
  bhyderabadzonea: 'Hyderabad - A',
  bhyderabadzoneb: 'Hyderabad - B',
  bhyderabada: 'Hyderabad - A',
  bhyderabadb: 'Hyderabad - B',
  hyderabadzonea: 'Hyderabad - A',
  hyderabadzoneb: 'Hyderabad - B',
  'hyderabad-a': 'Hyderabad - A',
  'hyderabad-b': 'Hyderabad - B',
  hydzonea: 'Hyderabad - A',
  hydzoneb: 'Hyderabad - B',
  bhitech: 'Hi-Tech City',
}

function normaliseBranchIdKey(id: string): string {
  return String(id ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '')
}

/**
 * Display label for recruitment / MIS branch pickers.
 * Uses the MIS name as stored — does not append " Branch" to every city.
 * Special labels only for Hyderabad A / B and Hi-Tech City.
 */
export function formatRecruitBranchDisplay(name: string, branchId?: string): string {
  const n = String(name ?? '').trim()

  if (/^hyderabad[\s\-–]*a$/i.test(n) || /^hyd[\s\-]*zone[\s\-]*a$/i.test(n)) {
    return 'Hyderabad - A'
  }
  if (/^hyderabad[\s\-–]*b$/i.test(n) || /^hyd[\s\-]*zone[\s\-]*b$/i.test(n)) {
    return 'Hyderabad - B'
  }
  if (/^hyderabad[\s\-–]*a\b/i.test(n) || /hyderabad[\s\-–]*zone[\s\-–]*a/i.test(n)) {
    return 'Hyderabad - A'
  }
  if (/^hyderabad[\s\-–]*b\b/i.test(n) || /hyderabad[\s\-–]*zone[\s\-–]*b/i.test(n)) {
    return 'Hyderabad - B'
  }
  if (/hi-?tech/i.test(n)) return 'Hi-Tech City'
  if (/gulbarga|kalaburagi/i.test(n)) return 'Bangalore'

  const idKey = normaliseBranchIdKey(branchId || '')
  if (idKey && RECRUIT_BRANCH_ID_DISPLAY[idKey]) {
    return RECRUIT_BRANCH_ID_DISPLAY[idKey].replace(/\s+Branch$/i, '')
  }
  const idLower = String(branchId ?? '').trim().toLowerCase()
  if (idLower && RECRUIT_BRANCH_ID_DISPLAY[idLower]) {
    return RECRUIT_BRANCH_ID_DISPLAY[idLower].replace(/\s+Branch$/i, '')
  }

  if (!n) return '—'
  return n.replace(/\s+Branch$/i, '')
}

/**
 * User-facing branch name for Recruitment UIs / emails / WhatsApp.
 * Prefer MIS display name; never show raw codes like br5 when a name is known.
 */
export function recruitBranchLabel(branchId: string, misName?: string): string {
  const id = String(branchId || '').trim()
  if (!id) return '—'
  const name = String(misName || '').trim()
  if (name) return formatRecruitBranchDisplay(name, id)
  const meta = metaForRecruitBranch(id)
  if (meta?.displayName) return meta.displayName.replace(/\s+Branch$/i, '')
  return formatRecruitBranchDisplay(id, id)
}

/** Map legacy / bag DRR branch ids onto a Hyd zone centre when possible. */
export function hydZoneCentreFromText(text: string): 'Hyderabad - A' | 'Hyderabad - B' | 'Hi-Tech City' | '' {
  const s = String(text || '').toLowerCase()
  if (/hi-?tech|hitech/.test(s)) return 'Hi-Tech City'
  if (/hyderabad[\s\-–]*b\b|hyd[\s\-]*zone[\s\-]*b|zone[\s\-–]*b\b/.test(s)) return 'Hyderabad - B'
  if (/hyderabad[\s\-–]*a\b|hyd[\s\-]*zone[\s\-]*a|zone[\s\-–]*a\b/.test(s)) return 'Hyderabad - A'
  if (/hyderabad[\s\-–]*b/.test(s)) return 'Hyderabad - B'
  if (/hyderabad[\s\-–]*a/.test(s)) return 'Hyderabad - A'
  return ''
}

export function isHydZoneCentre(id: string): boolean {
  return id === 'Hyderabad - A' || id === 'Hyderabad - B' || id === 'Hi-Tech City'
}

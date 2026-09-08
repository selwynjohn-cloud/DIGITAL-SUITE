/**
 * President — Management portal (email PIN) with view limited to covered branches.
 * Does not get User Management / Master Directory edit rights.
 */

import {
  getMisReportBranches,
  getUsers,
  type MisBranch,
  type MisUser,
} from './store.js'

/** Locked covered set — President may view only these branch reports. */
export const PRESIDENT_COVERED_NAMES = [
  'Hyderabad-A',
  'Hyderabad-B',
  'Hi-Tech City',
  'Mumbai & Surat',
  'Bhopal',
  'Lucknow',
  'Visakhapatnam & Kakinada',
  'Nellore & Tada',
  'Tirupati & Tadipatri',
] as const

export type MisViewerScope = {
  email: string
  role: string
  isPresident: boolean
  /** Full management (Director/Admin/super) — not limited. */
  fullAccess: boolean
  coveredNames: string[]
}

function normaliseEmail(email: string): string {
  return String(email || '')
    .trim()
    .toLowerCase()
}

function normName(name: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/-/g, '')
}

export function isPresidentRole(role: string): boolean {
  return /^president$/i.test(String(role || '').trim())
}

export function isPresidentCoveredName(name: string): boolean {
  const n = normName(name)
  if (!n) return false
  return PRESIDENT_COVERED_NAMES.some((x) => {
    const t = normName(x)
    return t === n || t.replace(/&/g, 'and') === n.replace(/&/g, 'and')
  })
}

export function findActiveMisUser(users: MisUser[], email: string): MisUser | null {
  const em = normaliseEmail(email)
  if (!em) return null
  return users.find((u) => normaliseEmail(u.email) === em && u.active !== false) || null
}

export async function resolveMisViewer(email: string): Promise<MisViewerScope> {
  const em = normaliseEmail(email)
  const empty: MisViewerScope = {
    email: em,
    role: '',
    isPresident: false,
    fullAccess: true,
    coveredNames: [],
  }
  if (!em) return empty

  const users = await getUsers()
  const u = findActiveMisUser(users, em)
  const role = String(u?.role || '').trim()
  if (isPresidentRole(role)) {
    return {
      email: em,
      role: 'President',
      isPresident: true,
      fullAccess: false,
      coveredNames: [...PRESIDENT_COVERED_NAMES],
    }
  }
  return {
    email: em,
    role: role || 'Management',
    isPresident: false,
    fullAccess: true,
    coveredNames: [],
  }
}

export function filterBranchesForMisViewer(
  viewer: MisViewerScope,
  branches: MisBranch[],
): MisBranch[] {
  if (!viewer.isPresident || viewer.fullAccess) return branches
  const covered = branches.filter((b) => isPresidentCoveredName(b.name))
  // Stable order matching PRESIDENT_COVERED_NAMES
  return PRESIDENT_COVERED_NAMES.map((name) =>
    covered.find((b) => normName(b.name) === normName(name)),
  ).filter(Boolean) as MisBranch[]
}

/** Report branches for the signed-in management viewer (President = covered set only). */
export async function getMisReportBranchesForViewer(email: string): Promise<MisBranch[]> {
  const viewer = await resolveMisViewer(email)
  const all = await getMisReportBranches(true)
  return filterBranchesForMisViewer(viewer, all)
}

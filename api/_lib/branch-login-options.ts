/** Server-rendered branch dropdown for HOD / staff login (Guards, Fleet, Recruit, etc.). */

import { DEFAULT_BRANCHES, getBranches } from './mis/store.js'
import { misBranchDisplayName } from './mis/branch-labels.js'
import { formatRecruitBranchDisplay } from './recruitment/branches.js'
import { recruitDepartmentLoginBranches } from './recruitment/department-auth.js'

export function escBranchHtml(s: string) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function branchDisplayForLogin(appId: string, branch: { id: string; name: string }): string {
  const id = String(branch.id ?? '').trim()
  /** Department logins already carry the full label — do not rewrite via Hi-Tech name match. */
  if (id.startsWith('recruit-dept:') || id.startsWith('recruit-centre:')) {
    return String(branch.name ?? '').trim() || id
  }
  if (appId === 'recruitment' || appId === 'training') {
    return formatRecruitBranchDisplay(branch.name, branch.id) || misBranchDisplayName(branch.id, branch.name)
  }
  return misBranchDisplayName(branch.id, branch.name)
}

function isTrainingAcademyBranch(branch: { id: string; name: string }): boolean {
  const id = String(branch.id ?? '').trim().toLowerCase()
  const name = String(branch.name ?? '').trim().toLowerCase()
  return (
    id === 'br-training-academy' ||
    id === 'recruit-dept:training-academy' ||
    name === 'training academy' ||
    name.startsWith('training academy (')
  )
}

function withRecruitDepartments(
  branches: { id: string; name: string }[],
  appId: string,
): { id: string; name: string }[] {
  if (appId !== 'recruitment') return branches
  /** Training Academy is for training batches only — not a Recruitment login branch. */
  const base = branches.filter((b) => !isTrainingAcademyBranch(b))
  const ids = new Set(base.map((b) => b.id))
  const extra = recruitDepartmentLoginBranches()
    .filter((d) => !ids.has(d.id) && !isTrainingAcademyBranch(d))
    .map((d) => ({ id: d.id, name: d.displayName || d.name }))
  return [...base, ...extra]
}

function sortBranchesForLogin(
  branches: { id: string; name: string }[],
  appId: string,
): { id: string; name: string }[] {
  const sorted = [...branches].sort((a, b) =>
    branchDisplayForLogin(appId, a).localeCompare(branchDisplayForLogin(appId, b), 'en', {
      sensitivity: 'base',
    }),
  )
  /** Training: Training Department first so Training Manager can pick Hyd-A / B / Hi-Tech. */
  if (appId === 'training') {
    const td = sorted.filter((b) => /training\s*department/i.test(b.name) || b.id === 'br-training-department')
    const rest = sorted.filter((b) => !td.some((t) => t.id === b.id))
    return [...td, ...rest]
  }
  return sorted
}

export function branchLoginOptionsHtml(
  branches: { id: string; name: string }[],
  appId = '',
): string {
  const sorted = sortBranchesForLogin(withRecruitDepartments(branches, appId), appId)
  const opts = sorted
    .map(
      (b) =>
        `<option value="${escBranchHtml(b.id)}">${escBranchHtml(branchDisplayForLogin(appId, b))}</option>`,
    )
    .join('')
  return `<option value="">— select branch —</option>${opts}`
}

export function defaultBranchLoginFallback(appId: string) {
  const base = DEFAULT_BRANCHES.filter((b) => b.active !== false).map((b) => ({
    id: b.id,
    name: b.name,
  }))
  return sortBranchesForLogin(withRecruitDepartments(base, appId), appId).map((b) => ({
    id: b.id,
    name: b.name,
    displayName: branchDisplayForLogin(appId, b),
  }))
}

/** JSON list for `/api/auth/branch-login` action=branches (includes Recruitment Department when appId=recruitment). */
export function branchLoginListForApp(
  branches: { id: string; name: string }[],
  appId: string,
): { id: string; name: string; displayName: string }[] {
  return sortBranchesForLogin(withRecruitDepartments(branches, appId), appId).map((b) => ({
    id: b.id,
    name: b.name,
    displayName: branchDisplayForLogin(appId, b),
  }))
}

/** Load active MIS branches from Redis; fall back to built-in list if storage is slow or down. */
export async function loadBranchLoginOptionsHtml(appId = ''): Promise<string> {
  try {
    const { ensureCorporateOfficeBranch, ensureTrainingAcademyBranch } = await import('./mis/store.js')
    await Promise.all([ensureCorporateOfficeBranch(), ensureTrainingAcademyBranch()])
    if (appId === 'training') {
      const { ensureTrainingDepartmentBranch } = await import('./training/ojt-training-dept.js')
      await ensureTrainingDepartmentBranch()
    }
    const branches = await getBranches(true)
    const list = branches.length ? branches : DEFAULT_BRANCHES.filter((b) => b.active !== false)
    return branchLoginOptionsHtml(list, appId)
  } catch {
    return branchLoginOptionsHtml(DEFAULT_BRANCHES.filter((b) => b.active !== false), appId)
  }
}

import type { MisUser } from './mis/store.js'

/** HQ support functions — do not submit branch MIS / DRR reports. */
export const SUPPORT_DEPARTMENTS = ['Stores', 'HR', 'Recruitment', 'Payroll'] as const
export type SupportDepartment = (typeof SUPPORT_DEPARTMENTS)[number]
export type MisUserTeam = 'operations' | 'support'

const SUPPORT_ROLE_HINTS = ['hr', 'accounts', 'training team', 'payroll', 'stores', 'recruitment']

export function inferMisUserTeam(u: {
  role?: string
  team?: string
  department?: string
}): MisUserTeam {
  const team = String(u.team ?? '').toLowerCase()
  if (team === 'support') return 'support'
  if (team === 'operations') return 'operations'
  const dept = String(u.department ?? '').trim()
  if (SUPPORT_DEPARTMENTS.includes(dept as SupportDepartment)) return 'support'
  const role = String(u.role ?? '').toLowerCase()
  if (SUPPORT_ROLE_HINTS.some((h) => role === h || role.includes(h))) return 'support'
  return 'operations'
}

export function inferSupportDepartment(u: { role?: string; department?: string }): string {
  const dept = String(u.department ?? '').trim()
  if (SUPPORT_DEPARTMENTS.includes(dept as SupportDepartment)) return dept
  const role = String(u.role ?? '').toLowerCase()
  if (role === 'hr' || role.includes('human resource')) return 'HR'
  if (role === 'accounts' || role.includes('payroll')) return 'Payroll'
  if (role.includes('recruitment')) return 'Recruitment'
  if (role.includes('stores') || role.includes('store')) return 'Stores'
  return dept
}

export function isSupportMisUser(u: MisUser): boolean {
  if (u.active === false) return false
  return inferMisUserTeam(u) === 'support'
}

export function isOperationsMisUser(u: MisUser): boolean {
  if (u.active === false) return false
  return inferMisUserTeam(u) === 'operations'
}

export function teamLabel(team: MisUserTeam): string {
  return team === 'support' ? 'Support' : 'Operations'
}

export function normalizeMisUserTeamFields(u: MisUser): MisUser {
  const team = inferMisUserTeam(u)
  const department = team === 'support' ? inferSupportDepartment(u) : String(u.department ?? '').trim()
  return { ...u, team, department }
}

export function supportUserBlocksMisSubmit(users: MisUser[], email: string): string | null {
  const em = email.trim().toLowerCase()
  if (!em.includes('@')) return null
  const u = users.find((x) => x.email?.trim().toLowerCase() === em && x.active !== false)
  if (!u || !isSupportMisUser(u)) return null
  const dept = inferSupportDepartment(u) || 'Support'
  return `${dept} is a Support department — daily branch MIS reports are for Operations teams only.`
}

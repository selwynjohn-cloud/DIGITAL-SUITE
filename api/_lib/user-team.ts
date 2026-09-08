import type { MisUser } from './mis/store.js'

/** HQ support functions — do not submit branch MIS / DRR reports. All names in CAPS. */
export const SUPPORT_DEPARTMENTS = [
  'HR',
  'RECRUITMENT',
  'PAYROLL',
  'STORES',
  'CONTROL',
  'SALES',
  'IT',
  'CORPORATE OFFICE',
  'TRAINING (OJT)',
  'TRAINING ACADEMY',
] as const
export type SupportDepartment = (typeof SUPPORT_DEPARTMENTS)[number]
export type MisUserTeam = 'operations' | 'support'

const LEGACY_DEPT: Record<string, SupportDepartment> = {
  hr: 'HR',
  recruitment: 'RECRUITMENT',
  payroll: 'PAYROLL',
  stores: 'STORES',
  control: 'CONTROL',
  sales: 'SALES',
  it: 'IT',
  'corporate office': 'CORPORATE OFFICE',
  'training (ojt)': 'TRAINING (OJT)',
  'training academy': 'TRAINING ACADEMY',
  'training team': 'TRAINING ACADEMY',
}

const SUPPORT_ROLE_HINTS = ['hr', 'accounts', 'payroll', 'stores', 'recruitment']

/** Map any stored / typed department name to the canonical CAPS label. */
export function canonicalSupportDepartment(dept: string): string {
  const raw = String(dept ?? '').trim()
  if (!raw) return ''
  for (const d of SUPPORT_DEPARTMENTS) {
    if (d === raw || d.toUpperCase() === raw.toUpperCase()) return d
  }
  const legacy = LEGACY_DEPT[raw.toLowerCase()]
  if (legacy) return legacy
  return raw.toUpperCase()
}

export function isSupportDepartmentName(dept: string): boolean {
  const c = canonicalSupportDepartment(dept)
  return SUPPORT_DEPARTMENTS.includes(c as SupportDepartment)
}

export function inferMisUserTeam(u: {
  role?: string
  team?: string
  department?: string
}): MisUserTeam {
  const team = String(u.team ?? '').toLowerCase()
  if (team === 'support') return 'support'
  if (team === 'operations') return 'operations'
  if (isSupportDepartmentName(String(u.department ?? ''))) return 'support'
  const role = String(u.role ?? '').toLowerCase()
  if (role === 'it' || role.includes('information tech')) return 'support'
  if (SUPPORT_ROLE_HINTS.some((h) => role === h || role.includes(h))) return 'support'
  return 'operations'
}

export function inferSupportDepartment(u: { role?: string; department?: string }): string {
  const dept = canonicalSupportDepartment(String(u.department ?? ''))
  if (SUPPORT_DEPARTMENTS.includes(dept as SupportDepartment)) return dept
  const role = String(u.role ?? '').toLowerCase()
  if (role === 'hr' || role.includes('human resource')) return 'HR'
  if (role === 'accounts' || role.includes('payroll')) return 'PAYROLL'
  if (role.includes('recruitment')) return 'RECRUITMENT'
  if (role.includes('stores') || role.includes('store')) return 'STORES'
  if (role.includes('control')) return 'CONTROL'
  if (role === 'it' || role.includes('information tech')) return 'IT'
  if (role.includes('training') && role.includes('ojt')) return 'TRAINING (OJT)'
  if (role.includes('training') || role.includes('academy')) return 'TRAINING ACADEMY'
  if (role.includes('corporate')) return 'CORPORATE OFFICE'
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
  const department =
    team === 'support' ? canonicalSupportDepartment(inferSupportDepartment(u)) : String(u.department ?? '').trim()
  return { ...u, team, department }
}

export function supportUserBlocksMisSubmit(users: MisUser[], email: string): string | null {
  const em = email.trim().toLowerCase()
  if (!em.includes('@')) return null
  const u = users.find((x) => x.email?.trim().toLowerCase() === em && x.active !== false)
  if (!u || !isSupportMisUser(u)) return null
  const dept = inferSupportDepartment(u) || 'SUPPORT'
  return `${dept} is a Support department — daily branch MIS reports are for Operations teams only.`
}

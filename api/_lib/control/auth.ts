/**
 * Agile Control — who may open App 06 (beyond Director-only Coming Soon).
 */

import { isSuiteAdminEmail, normaliseEmail } from '../auth.js'
import { isOpsShadowDirectorEmail } from '../ops/director-only.js'
import { findAcUserByEmail } from './store.js'
import { acRoleIsManagementGrade } from './types.js'

const DEFAULT_CC_OPS = [
  'director@agilegroup.co.in',
  'selwyn.john@gmail.com',
  'control@agilegroup.co.in',
  'aap@agilegroup.co.in',
  'sai@agilegroup.co.in',
]

/** Control Centre + Ops allowlist (env AC_ALLOWED_EMAILS comma-separated). */
export function getAcAllowedEmails(): string[] {
  const fromEnv = (process.env.AC_ALLOWED_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return Array.from(new Set([...DEFAULT_CC_OPS, ...fromEnv]))
}

export function isAcAllowedEmail(email: string): boolean {
  const em = normaliseEmail(email)
  if (!em) return false
  if (isSuiteAdminEmail(em) || isOpsShadowDirectorEmail(em)) return true
  return getAcAllowedEmails().includes(em)
}

/** Allowlist OR active User Management row. */
export async function isAcAuthorisedEmail(email: string): Promise<boolean> {
  if (isAcAllowedEmail(email)) return true
  const row = await findAcUserByEmail(email)
  return Boolean(row && row.active !== false)
}

export function isAcDirector(email: string): boolean {
  const em = normaliseEmail(email)
  return isSuiteAdminEmail(em) || isOpsShadowDirectorEmail(em)
}

/** Management portal = director / allowlist / management-grade User Management role. */
export async function canAcAccessPortal(
  email: string,
  portal: 'staff' | 'management',
): Promise<boolean> {
  if (!(await isAcAuthorisedEmail(email))) return false
  if (portal !== 'management') return true
  if (isAcAllowedEmail(email) || isAcDirector(email) || isSuiteAdminEmail(email)) return true
  const row = await findAcUserByEmail(email)
  return acRoleIsManagementGrade(String(row?.role || ''))
}

/** Management portal = director/management overview; staff = operator/ops queue. */
export function acPortalForEmail(email: string, requested?: string): 'staff' | 'management' {
  if (requested === 'management' || requested === 'staff') return requested
  return isAcDirector(email) ? 'management' : 'staff'
}

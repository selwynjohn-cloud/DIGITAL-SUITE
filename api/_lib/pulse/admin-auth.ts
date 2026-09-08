import { isLeftCompanyEmail, normaliseEmail } from '../auth.js'

/** Security News Admin Portal — Sai and Director only. it@ left 25 Aug 2026. */
export const PULSE_ADMIN_EMAILS = [
  'director@agilegroup.co.in',
  'sai@agilegroup.co.in',
] as const

export const PULSE_ADMIN_LOGIN_ERROR =
  'This Admin Portal is only for Sai and Director official emails (sai@agilegroup.co.in, director@agilegroup.co.in). it@agilegroup.co.in is no longer authorised. Other emails cannot sign in.'

export function isPulseAdminEmail(email: string): boolean {
  if (isLeftCompanyEmail(email)) return false
  return (PULSE_ADMIN_EMAILS as readonly string[]).includes(normaliseEmail(email))
}

export function isPulseAppId(appId: string): boolean {
  return String(appId ?? '').trim().toLowerCase() === 'pulse'
}

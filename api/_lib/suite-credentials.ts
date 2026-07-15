/**
 * Uniform passwords for Integrated Application Suite (Apps 01–15).
 * Apps 16–17 (Facebook, LinkedIn) and 18 (Mobile) are excluded — they use their own logins.
 *
 * Set on Vercel (Production):
 *   SUITE_ADMIN_PASSWORD  — Director / Management text password (all apps)
 *   SUITE_BRANCH_PIN      — 4-digit branch PIN (CRM, MIS, Fleet branch login)
 *   SUPER_ADMIN_PIN       — 6-digit Director Master PIN (Command Centre + email OTP bypass)
 */

/** Director / Management password — same across CRM, MIS, Fleet, Pulse, SecurityJob, etc. */
export function suiteAdminPassword(): string {
  return (
    process.env.SUITE_ADMIN_PASSWORD?.trim() ||
    process.env.MIS_ADMIN_PASSWORD?.trim() ||
    process.env.CRM_ADMIN_PASSWORD?.trim() ||
    process.env.PULSE_ADMIN_PASSWORD?.trim() ||
    process.env.SJ_ADMIN_PASSWORD?.trim() ||
    'Agile@170658'
  )
}

/** Branch HOD 4-digit PIN — same across CRM, MIS, Fleet branch portals. */
export function suiteBranchPin(): string {
  return (
    process.env.SUITE_BRANCH_PIN?.trim() ||
    process.env.CRM_BRANCH_PIN?.trim() ||
    process.env.MIS_BRANCH_PIN?.trim() ||
    process.env.FLEET_BRANCH_PIN?.trim() ||
    '1706'
  )
}

/** 6-digit Director Master PIN — Command Centre + OTP bypass for Director emails. */
export function suiteMasterPin(): string {
  return process.env.SUPER_ADMIN_PIN?.trim() || '170658'
}

export function matchesSuiteAdminPassword(input: unknown): boolean {
  const v = String(input ?? '').trim()
  if (!v) return false
  if (v === suiteAdminPassword()) return true
  // Director may enter 6-digit Master PIN in a password field
  if (v === suiteMasterPin()) return true
  return false
}

export function matchesSuiteBranchPin(input: unknown): boolean {
  const v = String(input ?? '').trim()
  if (!v) return false
  if (v === suiteBranchPin()) return true
  // Legacy default used before uniform SUITE_BRANCH_PIN
  if (v === '1234') return true
  return false
}

export function isValidSuiteMasterPin(pin: unknown): boolean {
  const expected = suiteMasterPin()
  if (!expected) return false
  return String(pin ?? '').trim() === expected
}

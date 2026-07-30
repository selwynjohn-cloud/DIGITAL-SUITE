import { verifyAppSession, type AppSession } from './app-session.js'

/** Suite apps whose Management OTP can open MIS pages (Master Directory, etc.). */
export const SUITE_MANAGEMENT_APP_IDS = [
  'mis',
  'fleet',
  'recruitment',
  'guards',
  'crm',
  'pulse',
  'securityjob',
] as const

/** sessionStorage keys checked by the MIS session bridge (order: MIS first). */
export const SUITE_OTP_SESSION_KEYS = [
  'otp_mis',
  'otp_mis-report',
  'otp_fleet',
  'otp_recruitment',
  'otp_guards',
  'otp_crm',
  'otp_pulse',
  'otp_securityjob',
] as const

/** Management-only keys — HOD daily report (otp_mis-report) must not open Master Directory. */
export const SUITE_MANAGEMENT_OTP_SESSION_KEYS = SUITE_OTP_SESSION_KEYS.filter(
  (k) => k !== 'otp_mis-report',
)

export async function verifyManagementSuiteSession(
  token: string | undefined,
): Promise<AppSession | null> {
  const t = String(token ?? '').trim()
  if (!t) return null
  for (const appId of SUITE_MANAGEMENT_APP_IDS) {
    const session = await verifyAppSession(t, appId)
    if (session?.role === 'management') return session
  }
  return null
}

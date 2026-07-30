import type { AuthRole } from './auth.js'
import {
  createSessionToken,
  isSuperAdminEmail,
  isValidSuperAdminPin,
  normaliseEmail,
} from './auth.js'
import { sendDirectorLoginAlert } from './login-alert.js'

/** Director / super-admin: skip emailed OTP on Send — use private PIN on Verify (all suite apps). */
export async function handleSuperAdminPinSend(
  email: string,
  _appTitle: string,
  _appId: string,
  _role: AuthRole,
) {
  const em = normaliseEmail(email)
  if (!isSuperAdminEmail(em)) return null
  return {
    ok: true as const,
    message: 'Enter your 6-digit PIN to continue.',
  }
}

export async function verifySuperAdminPin(
  email: string,
  pin: string,
  appId: string,
  appTitle: string,
  role: AuthRole,
) {
  const em = normaliseEmail(email)
  if (!isSuperAdminEmail(em) || !isValidSuperAdminPin(pin)) return null

  const sessionRole: AuthRole = role === 'staff' ? 'staff' : 'management'
  await sendDirectorLoginAlert({
    email: em,
    appTitle,
    appId,
    role: sessionRole === 'staff' ? 'HODs / Staff' : 'Management',
  })

  const token = await createSessionToken({ email: em, role: sessionRole, appId })
  return { token, email: em, role: sessionRole }
}

export async function notifySuperAdminEmailLogin(
  email: string,
  appTitle: string,
  appId: string,
  role: AuthRole,
) {
  if (!isSuperAdminEmail(email)) return
  await sendDirectorLoginAlert({
    email: normaliseEmail(email),
    appTitle,
    appId,
    role: role === 'staff' ? 'HODs / Staff' : 'Management',
  })
}

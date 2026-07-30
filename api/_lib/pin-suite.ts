import type { AuthRole } from './auth.js'
import { pinAliasIds } from './pin-aliases.js'
import {
  deletePin,
  markPinSent,
  pinExists,
  pinRecentlySent,
  savePin,
  verifyPinDetailed,
  clearPinSent,
  tryAcquirePinSendLock,
  releasePinSendLock,
  type PinRecord,
  type PinVerifyFailure,
} from './pin-store.js'

/** Save the same PIN for every alias in the app group (e.g. mis + mis-report). */
export async function saveSuitePin(email: string, pin: string, role: AuthRole, appId: string) {
  for (const id of pinAliasIds(appId)) {
    await savePin(email, pin, role, id)
  }
}

export async function deleteSuitePin(email: string, appId: string) {
  for (const id of pinAliasIds(appId)) {
    await deletePin(email, id)
  }
}

export async function markSuitePinSent(email: string, appId: string) {
  for (const id of pinAliasIds(appId)) {
    await markPinSent(email, id)
  }
}

export async function clearSuitePinSent(email: string, appId: string) {
  for (const id of pinAliasIds(appId)) {
    await clearPinSent(email, id)
  }
}

export async function acquireSuitePinSendLock(email: string, appId: string): Promise<boolean> {
  for (const id of pinAliasIds(appId)) {
    if (!(await tryAcquirePinSendLock(email, id))) return false
  }
  return true
}

export async function releaseSuitePinSendLock(email: string, appId: string) {
  for (const id of pinAliasIds(appId)) {
    await releasePinSendLock(email, id)
  }
}

export async function suitePinRecentlySent(email: string, appId: string): Promise<boolean> {
  for (const id of pinAliasIds(appId)) {
    if (await pinRecentlySent(email, id)) return true
  }
  return false
}

/** True if an email OTP is still valid for any alias in the app group. */
export async function suitePinActive(email: string, appId: string): Promise<boolean> {
  for (const id of pinAliasIds(appId)) {
    if (await pinExists(email, id)) return true
  }
  return false
}

/** Try each alias until a valid PIN is found (missing on one alias tries the next). */
export async function verifySuitePin(
  email: string,
  pin: string,
  appId: string,
): Promise<{ record: PinRecord | null; failure?: PinVerifyFailure }> {
  const ids = pinAliasIds(appId)
  let lastFailure: PinVerifyFailure | undefined = 'missing'
  for (const id of ids) {
    const checked = await verifyPinDetailed(email, pin, id)
    if (checked.record) return checked
    if (checked.failure === 'locked') return checked
    if (checked.failure === 'wrong') lastFailure = 'wrong'
  }
  return { record: null, failure: lastFailure }
}

export function pinVerifyError(failure: PinVerifyFailure | undefined, appTitle: string) {
  if (failure === 'locked') {
    return 'Too many wrong tries. Wait 90 seconds, tap Send PIN again, and use the new 6-digit PIN from your latest email.'
  }
  return `Wrong or expired PIN for ${appTitle}. Use the latest PIN from your email (valid 15 minutes). Check spam folder. Tap Send PIN again if needed.`
}

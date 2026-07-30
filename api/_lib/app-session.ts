import { canLoginWithEmail, normaliseEmail, verifySessionToken } from './auth.js'
import { pinAliasIds } from './pin-aliases.js'
import { getActiveBranch } from './mis/store.js'

export type AppSession = {
  email: string
  role: 'staff' | 'management'
  branchId?: string
}

/** Verify JWT session token issued after email OTP or branch login for a specific app. */
export async function verifyAppSession(
  token: string | undefined,
  expectedAppId: string,
): Promise<AppSession | null> {
  const t = String(token ?? '').trim()
  if (!t) return null
  const payload = await verifySessionToken(t)
  const allowed = pinAliasIds(expectedAppId)
  if (!payload || !allowed.includes(payload.appId)) return null
  if (!canLoginWithEmail(payload.email)) return null

  if (payload.role === 'staff' && payload.branchId) {
    const branch = await getActiveBranch(payload.branchId)
    if (!branch) return null
  }

  return {
    email: normaliseEmail(payload.email),
    role: payload.role === 'staff' ? 'staff' : 'management',
    branchId: payload.branchId,
  }
}

/** Staff/HOD must belong to an activated MIS branch (by id). */
export async function requireActiveMisBranch(branchId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = String(branchId ?? '').trim()
  if (!id) return { ok: false, error: 'Branch not selected.' }
  const branch = await getActiveBranch(id)
  if (!branch) {
    return {
      ok: false,
      error: 'This branch is deactivated. Only activated branch teams can access the portal. Contact management.',
    }
  }
  return { ok: true }
}

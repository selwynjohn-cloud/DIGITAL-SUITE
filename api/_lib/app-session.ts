import { canLoginWithEmail, normaliseEmail, verifySessionToken } from './auth.js'
import { isPulseAdminEmail, isPulseAppId } from './pulse/admin-auth.js'
import { pinAliasIds } from './pin-aliases.js'
import { getActiveBranch } from './mis/store.js'
import { isRecruitDepartmentLoginId } from './recruitment/department-auth.js'

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
  if (allowed.some(isPulseAppId) && !isPulseAdminEmail(payload.email)) return null

  /**
   * Trust a valid JWT. Branch active checks happen at bind-branch / app gates.
   * Do not drop the session when branch master is briefly unavailable — that
   * was kicking HODs back to login after a few clicks or refreshes.
   */
  if (payload.role === 'staff' && payload.branchId) {
    const isRecruitDept =
      allowed.includes('recruitment') && isRecruitDepartmentLoginId(payload.branchId)
    if (!isRecruitDept) {
      try {
        const branch = await getActiveBranch(payload.branchId)
        if (branch && branch.active === false) return null
      } catch {
        /* keep session */
      }
    }
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

import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  createSessionToken,
  canLoginWithEmail,
  isSuperAdminEmail,
  isSuiteAdminEmail,
  loginEmailBlockError,
  normaliseEmail,
  type AuthRole,
} from '../_lib/auth.js'
import { applyTrainingCors, handleTrainingCorsPreflight } from '../_lib/cors.js'
import { sendPinEmail } from '../_lib/email.js'
import { hasPinStorage, pinStorageStatus } from '../_lib/pin-store.js'
import {
  deleteSuitePin,
  markSuitePinSent,
  clearSuitePinSent,
  acquireSuitePinSendLock,
  releaseSuitePinSendLock,
  pinVerifyError,
  saveSuitePin,
  suitePinActive,
  suitePinRecentlySent,
  verifySuitePin,
} from '../_lib/pin-suite.js'
import { matchesSuiteBranchPin } from '../_lib/suite-credentials.js'
import { notifySuperAdminEmailLogin, verifySuperAdminPin } from '../_lib/super-admin-login.js'
import {
  isOpsShadowAppId,
  isOpsShadowDirectorEmail,
  opsComingSoonPublicMessage,
} from '../_lib/ops/director-only.js'
import { canAcAccessPortal, isAcAuthorisedEmail } from '../_lib/control/auth.js'
import { isPulseAdminEmail, isPulseAppId, PULSE_ADMIN_LOGIN_ERROR } from '../_lib/pulse/admin-auth.js'
import {
  lookupStaffBranchByEmail,
  resolveActiveBranchForLogin,
} from '../_lib/branch-auth.js'

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (handleTrainingCorsPreflight(req, res)) return
    applyTrainingCors(req, res)

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const body = (req.body ?? {}) as Record<string, unknown>
    const action = String(body.action ?? '')

    if (!hasPinStorage()) {
      const st = pinStorageStatus()
      const missing = 'missing' in st ? st.missing.join(', ') : 'Upstash Redis'
      return res.status(503).json({
        error: 'Login service not ready. Missing: ' + missing,
      })
    }

    const appId = String(body.appId ?? '').trim()
    const appTitle = String(body.appTitle ?? body.appId ?? 'Agile App').trim()
    const role: AuthRole = body.role === 'staff' ? 'staff' : 'management'

    if (action === 'send') {
      const email = normaliseEmail(String(body.email ?? ''))
      const blockedSend = loginEmailBlockError(email)
      if (blockedSend) {
        return res.status(403).json({ error: blockedSend })
      }
      if (!canLoginWithEmail(email)) {
        return res.status(400).json({
          error: 'Use your @agilegroup.co.in work email (Director may also use selwyn.john@gmail.com).',
        })
      }
      if (isPulseAppId(appId) && !isPulseAdminEmail(email)) {
        return res.status(403).json({ error: PULSE_ADMIN_LOGIN_ERROR })
      }

      if (appId === 'control') {
        if (!(await isAcAuthorisedEmail(email))) {
          return res.status(403).json({
            error:
              'Your email is not on Agile Control yet. Add this person under Control → User Management (Active), then they can open the Staff portal.',
          })
        }
        if (role === 'management' && !(await canAcAccessPortal(email, 'management'))) {
          return res.status(403).json({
            error: 'Use the Staff portal for Agile Control. Management access is for Director and assigned management users.',
          })
        }
      }
      if (isOpsShadowAppId(appId) && !isOpsShadowDirectorEmail(email)) {
        return res.status(403).json({ error: opsComingSoonPublicMessage() })
      }

      if (await suitePinRecentlySent(email, appId) && (await suitePinActive(email, appId))) {
        return res.status(200).json({
          ok: true,
          throttled: true,
          message:
            'PIN already sent — use the 6-digit PIN from your last email (still valid 15 minutes). Check spam. Wait 90 seconds to request a new PIN.',
        })
      }

      if (!(await acquireSuitePinSendLock(email, appId))) {
        return res.status(200).json({
          ok: true,
          throttled: true,
          message:
            'PIN is already being sent — check your inbox and spam in a moment. Wait 90 seconds before requesting again.',
        })
      }

      const pin = generatePin()
      await saveSuitePin(email, pin, role, appId)
      await markSuitePinSent(email, appId)
      const roleLabel = role === 'staff' ? 'HODs / Staff' : 'Management'
      const mailResult = await sendPinEmail(email, pin, appTitle, roleLabel, {
        requireDelivery: true,
        appId,
      })
      if (mailResult.ok === false) {
        await deleteSuitePin(email, appId)
        await clearSuitePinSent(email, appId)
        await releaseSuitePinSendLock(email, appId)
        return res.status(503).json({ error: mailResult.error })
      }
      await releaseSuitePinSendLock(email, appId)

      return res.status(200).json({
        ok: true,
        message: `PIN sent to ${email}. Check inbox and spam — valid for 15 minutes.`,
      })
    }

    if (action === 'verify') {
      const email = normaliseEmail(String(body.email ?? ''))
      const pin = String(body.pin ?? '').replace(/\D/g, '').trim()
      const blockedVerify = loginEmailBlockError(email)
      if (blockedVerify) {
        return res.status(403).json({ error: blockedVerify })
      }
      if (!canLoginWithEmail(email)) {
        return res.status(400).json({ error: 'Invalid email for this portal.' })
      }
      if (isPulseAppId(appId) && !isPulseAdminEmail(email)) {
        return res.status(403).json({ error: PULSE_ADMIN_LOGIN_ERROR })
      }
      if (appId === 'control') {
        if (!(await isAcAuthorisedEmail(email))) {
          return res.status(403).json({
            error:
              'Your email is not on Agile Control yet. Add this person under Control → User Management (Active), then they can open the Staff portal.',
          })
        }
        if (role === 'management' && !(await canAcAccessPortal(email, 'management'))) {
          return res.status(403).json({
            error: 'Use the Staff portal for Agile Control. Management access is for Director and assigned management users.',
          })
        }
      }
      if (isOpsShadowAppId(appId) && !isOpsShadowDirectorEmail(email)) {
        return res.status(403).json({ error: opsComingSoonPublicMessage() })
      }
      if (!pin || pin.length < (role === 'staff' ? 4 : 6) || pin.length > 6) {
        return res.status(400).json({
          error:
            role === 'staff'
              ? 'Enter your 6-digit branch password or the PIN from your email.'
              : 'Enter the 6-digit PIN from your email.',
        })
      }

      const branchKey = String(body.branchId ?? body.branch ?? '').trim()
      const pickedBranch =
        role === 'staff' && branchKey ? await resolveActiveBranchForLogin(branchKey) : null
      const staffNeedsBranch =
        role === 'staff' &&
        !isSuiteAdminEmail(email) &&
        (appId === 'mis-report' ||
          appId === 'guards' ||
          appId === 'fleet' ||
          appId === 'recruitment' ||
          appId === 'training' ||
          appId === 'crm')
      const staffBranch =
        pickedBranch || (staffNeedsBranch ? await lookupStaffBranchByEmail(email) : null)
      if (staffNeedsBranch && !staffBranch) {
        return res.status(400).json({
          error: 'Select your branch (Chennai, Mumbai, Kochi, …), then enter the PIN.',
        })
      }

      const superLogin = await verifySuperAdminPin(email, pin, appId, appTitle, role)
      if (superLogin) {
        const token = staffBranch
          ? await createSessionToken({
              email: superLogin.email,
              role: 'staff',
              appId,
              branchId: staffBranch.id,
            })
          : superLogin.token
        return res.status(200).json({
          ok: true,
          sessionToken: token,
          email: superLogin.email,
          role: staffBranch ? 'staff' : superLogin.role,
          branchId: staffBranch?.id || '',
          branchName: staffBranch?.name || '',
        })
      }

      if (role === 'staff' && matchesSuiteBranchPin(pin)) {
        await notifySuperAdminEmailLogin(email, appTitle, appId, 'staff')
        const token = await createSessionToken({
          email,
          role: 'staff',
          appId,
          branchId: staffBranch?.id,
        })
        return res.status(200).json({
          ok: true,
          sessionToken: token,
          email,
          role: 'staff',
          branchId: staffBranch?.id || '',
          branchName: staffBranch?.name || '',
        })
      }

      const checked = await verifySuitePin(email, pin, appId)
      if (!checked.record) {
        if (isSuperAdminEmail(email)) {
          return res.status(401).json({
            error:
              'Wrong PIN. Tap Send PIN first, then enter the PIN for this account.',
          })
        }
        const err =
          role === 'staff'
            ? checked.failure === 'locked'
              ? pinVerifyError('locked', appTitle)
              : 'Wrong PIN. Use your branch password or the latest 6-digit PIN from your email.'
            : pinVerifyError(checked.failure, appTitle)
        return res.status(401).json({ error: err })
      }

      const sessionRole = checked.record.role
      await notifySuperAdminEmailLogin(email, appTitle, appId, sessionRole)
      const token = await createSessionToken({
        email,
        role: sessionRole,
        appId,
        branchId: sessionRole === 'staff' ? staffBranch?.id : undefined,
      })

      return res.status(200).json({
        ok: true,
        sessionToken: token,
        email,
        role: sessionRole,
        branchId: staffBranch?.id || '',
        branchName: staffBranch?.name || '',
      })
    }

    return res.status(400).json({ error: 'Unknown action.' })
  } catch (err) {
    console.error('app-otp error', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Login failed.',
    })
  }
}

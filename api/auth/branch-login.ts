import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  canLoginWithEmail,
  isSuperAdminEmail,
  loginEmailBlockError,
  normaliseEmail,
  type AuthRole,
} from '../_lib/auth.js'
import {
  createBranchStaffSession,
  resolveActiveBranchForLogin,
  setBranchPassword,
  verifyBranchPassword,
} from '../_lib/branch-auth.js'
import { applyTrainingCors, handleTrainingCorsPreflight } from '../_lib/cors.js'
import { sendPinEmail } from '../_lib/email.js'
import { branchLoginListForApp } from '../_lib/branch-login-options.js'
import { getBranches } from '../_lib/mis/store.js'
import { hasPinStorage } from '../_lib/pin-store.js'
import {
  deleteSuitePin,
  markSuitePinSent,
  clearSuitePinSent,
  acquireSuitePinSendLock,
  releaseSuitePinSendLock,
  saveSuitePin,
  suitePinActive,
  suitePinRecentlySent,
  verifySuitePin,
} from '../_lib/pin-suite.js'
import { notifySuperAdminEmailLogin } from '../_lib/super-admin-login.js'
import { hodSessionSetCookie } from '../_lib/hod-session.js'
import { isOpsShadowAppId, opsComingSoonPublicMessage } from '../_lib/ops/director-only.js'
import { isPulseAdminEmail, isPulseAppId, PULSE_ADMIN_LOGIN_ERROR } from '../_lib/pulse/admin-auth.js'

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (handleTrainingCorsPreflight(req, res)) return
    applyTrainingCors(req, res)

    const body = (req.body ?? {}) as Record<string, unknown>
    const action = String(body.action ?? req.query?.action ?? '')

    if (action === 'branches' && (req.method === 'GET' || req.method === 'POST')) {
      const appId = String(body.appId ?? req.query?.appId ?? '').trim()
      const branches = await getBranches(true)
      return res.status(200).json({
        ok: true,
        branches: branchLoginListForApp(
          branches.map((b) => ({ id: b.id, name: b.name })),
          appId,
        ),
      })
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    if (!hasPinStorage()) {
      return res.status(503).json({ error: 'Login service not ready. Please try again shortly.' })
    }

    const appId = String(body.appId ?? '').trim()
    const appTitle = String(body.appTitle ?? body.appId ?? 'Agile App').trim()
    const role: AuthRole = body.role === 'management' ? 'management' : 'staff'

    if (isOpsShadowAppId(appId)) {
      return res.status(403).json({ error: opsComingSoonPublicMessage() })
    }

    if (action === 'login') {
      const email = normaliseEmail(String(body.email ?? ''))
      const branchId = String(body.branchId ?? '').trim()
      const password = String(body.password ?? '').trim()
      const blockedLogin = loginEmailBlockError(email)
      if (blockedLogin) {
        return res.status(403).json({ error: blockedLogin })
      }
      if (!canLoginWithEmail(email)) {
        return res.status(400).json({
          error: 'Use your @agilegroup.co.in work email (Director may also use selwyn.john@gmail.com).',
        })
      }
      if (isPulseAppId(appId) && !isPulseAdminEmail(email)) {
        return res.status(403).json({ error: PULSE_ADMIN_LOGIN_ERROR })
      }
      if (!branchId) return res.status(400).json({ error: 'Select your branch.' })
      if (!password) return res.status(400).json({ error: 'Enter your branch password.' })

      const branch = await verifyBranchPassword(branchId, password)
      if (!branch) {
        const all = await getBranches()
        const resolved = await resolveActiveBranchForLogin(branchId)
        const exists = resolved || all.find((b) => b.id === branchId)
        if (exists && exists.active === false) {
          return res.status(403).json({
            error:
              'This branch is deactivated. Only activated branch teams can sign in. Contact management.',
          })
        }
        if (isSuperAdminEmail(email)) {
          return res.status(401).json({
            error:
              'Wrong branch password. Tap “Sign in with email PIN instead” — we will email a 6-digit PIN to your inbox.',
          })
        }
        return res.status(401).json({
          error:
            'Wrong branch or password. Select the city name (Chennai, Mumbai, Kochi). Tap Forgot password? to reset with a PIN emailed to you.',
        })
      }

      void notifySuperAdminEmailLogin(email, appTitle, appId, 'staff')
      const session = await createBranchStaffSession(email, branch, appId, role)
      res.setHeader('Set-Cookie', hodSessionSetCookie(req.headers.host, session.token))
      return res.status(200).json({
        ok: true,
        sessionToken: session.token,
        email,
        role,
        branchId: session.branchId,
        branchName: session.branchName,
      })
    }

    if (action === 'forgot-send') {
      const email = normaliseEmail(String(body.email ?? ''))
      const branchId = String(body.branchId ?? '').trim()
      const blockedForgot = loginEmailBlockError(email)
      if (blockedForgot) {
        return res.status(403).json({ error: blockedForgot })
      }
      if (!canLoginWithEmail(email)) {
        return res.status(400).json({ error: 'Use your @agilegroup.co.in work email.' })
      }
      if (isPulseAppId(appId) && !isPulseAdminEmail(email)) {
        return res.status(403).json({ error: PULSE_ADMIN_LOGIN_ERROR })
      }
      if (!branchId) return res.status(400).json({ error: 'Select your branch.' })
      const forgotBranch = await resolveActiveBranchForLogin(branchId)
      if (!forgotBranch) {
        return res.status(400).json({ error: 'Unknown branch. Select Chennai, Mumbai, Kochi, or your city from the list.' })
      }

      if (await suitePinRecentlySent(email, appId) && (await suitePinActive(email, appId))) {
        return res.status(200).json({
          ok: true,
          throttled: true,
          message:
            'PIN already sent — use the 6-digit PIN from your last email (valid 15 minutes). Check spam.',
        })
      }

      if (!(await acquireSuitePinSendLock(email, appId))) {
        return res.status(200).json({
          ok: true,
          throttled: true,
          message:
            'PIN is already being sent — check your inbox and spam in a moment.',
        })
      }

      const pin = generatePin()
      await saveSuitePin(email, pin, 'staff', appId)
      await markSuitePinSent(email, appId)
      const mailResult = await sendPinEmail(email, pin, appTitle, 'Branch Password Reset', {
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
        message: `Reset PIN sent to ${email}. Check inbox and spam — valid 15 minutes.`,
      })
    }

    if (action === 'forgot-reset') {
      const email = normaliseEmail(String(body.email ?? ''))
      const branchId = String(body.branchId ?? '').trim()
      const otp = String(body.otp ?? '').replace(/\D/g, '').trim()
      const newPassword = String(body.newPassword ?? '').replace(/\D/g, '').trim()
      const blockedReset = loginEmailBlockError(email)
      if (blockedReset) {
        return res.status(403).json({ error: blockedReset })
      }
      if (!canLoginWithEmail(email)) {
        return res.status(400).json({ error: 'Invalid email.' })
      }
      if (isPulseAppId(appId) && !isPulseAdminEmail(email)) {
        return res.status(403).json({ error: PULSE_ADMIN_LOGIN_ERROR })
      }
      if (!branchId) return res.status(400).json({ error: 'Select your branch.' })
      if (otp.length !== 6) {
        return res.status(400).json({ error: 'Enter the 6-digit PIN from your email.' })
      }
      if (newPassword.length < 6 || newPassword.length > 8) {
        return res.status(400).json({ error: 'New password must be 6 digits (numbers only).' })
      }

      const checked = await verifySuitePin(email, otp, appId)
      if (!checked.record) {
        return res.status(401).json({ error: 'Wrong or expired PIN. Request a new one.' })
      }

      const branch = await resolveActiveBranchForLogin(branchId)
      if (!branch) {
        return res.status(400).json({ error: 'Unknown branch. Select Chennai, Mumbai, Kochi, or your city from the list.' })
      }

      const ok = await setBranchPassword(branch.id, newPassword)
      if (!ok) return res.status(500).json({ error: 'Could not save new password.' })

      await deleteSuitePin(email, appId)
      const session = await createBranchStaffSession(
        email,
        { ...branch, pin: newPassword },
        appId,
        'staff',
      )
      res.setHeader('Set-Cookie', hodSessionSetCookie(req.headers.host, session.token))
      return res.status(200).json({
        ok: true,
        message: 'Password updated. You are signed in.',
        sessionToken: session.token,
        email,
        role: 'staff',
        branchId: session.branchId,
        branchName: session.branchName,
      })
    }

    return res.status(400).json({ error: 'Unknown action.' })
  } catch (err) {
    console.error('branch-login error', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Login failed.',
    })
  }
}

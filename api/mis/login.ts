import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyManagementSuiteSession } from '../_lib/management-suite.js'
import { misStorageOk } from '../_lib/mis/store.js'
import {
  misSessionClearCookie,
  misSessionFromRequest,
  misSessionSetCookie,
  verifyMisSessionToken,
} from '../_lib/mis/session.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    const ok = verifyMisSessionToken(misSessionFromRequest(req))
    return res.status(ok ? 200 : 401).json({ ok, storage: ok ? misStorageOk() : false })
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as Record<string, unknown>
    /** Management OTP from any suite app (MIS, Fleet, Guards, …). */
    const session = await verifyManagementSuiteSession(String(body.sessionToken ?? ''))
    if (!session || session.role !== 'management') {
      return res.status(401).json({
        error: 'Please sign in to Agile MIS with your work email and the 6-digit PIN.',
      })
    }
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    res.setHeader('Set-Cookie', misSessionSetCookie(host, session.email))
    return res.status(200).json({ ok: true, storage: misStorageOk(), email: session.email })
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', misSessionClearCookie(req.headers.host))
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

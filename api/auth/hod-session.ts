import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { getActiveBranch } from '../_lib/mis/store.js'
import { hodSessionClearCookie, hodSessionSetCookie } from '../_lib/hod-session.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const body = (req.body ?? {}) as Record<string, unknown>
  const appId = String(body.appId ?? req.query?.appId ?? 'mis-report').trim() || 'mis-report'

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', hodSessionClearCookie(req.headers.host, appId))
    return res.status(200).json({ ok: true })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = String(body.sessionToken ?? '').trim()
  if (!token) return res.status(400).json({ error: 'Missing session.' })

  const session = await verifyAppSession(token, appId)
  if (!session || session.role !== 'staff') {
    return res.status(401).json({ error: 'Sign-in expired.' })
  }

  if (session.branchId) {
    const { recruitDepartmentFromLoginId } = await import('../_lib/recruitment/department-auth.js')
    const recruitDept = recruitDepartmentFromLoginId(session.branchId)
    if (recruitDept) {
      res.setHeader('Set-Cookie', hodSessionSetCookie(req.headers.host, token, appId))
      return res.status(200).json({
        ok: true,
        email: session.email,
        branchId: recruitDept.id,
        branchName: recruitDept.displayName,
        appId,
      })
    }
    const branch = await getActiveBranch(session.branchId)
    res.setHeader('Set-Cookie', hodSessionSetCookie(req.headers.host, token, appId))
    return res.status(200).json({
      ok: true,
      email: session.email,
      branchId: session.branchId,
      branchName: branch?.name || session.branchId,
      appId,
    })
  }

  if (appId.toLowerCase() === 'control') {
    res.setHeader('Set-Cookie', hodSessionSetCookie(req.headers.host, token, appId))
    return res.status(200).json({
      ok: true,
      email: session.email,
      branchId: '',
      branchName: '',
      appId,
    })
  }

  return res.status(401).json({ error: 'Sign-in expired.' })
}

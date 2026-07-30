import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { getActiveBranch } from '../_lib/mis/store.js'
import { hodSessionClearCookie, hodSessionSetCookie } from '../_lib/hod-session.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', hodSessionClearCookie(req.headers.host))
    return res.status(200).json({ ok: true })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = (req.body ?? {}) as Record<string, unknown>
  const token = String(body.sessionToken ?? '').trim()
  if (!token) return res.status(400).json({ error: 'Missing session.' })

  const session = await verifyAppSession(token, 'mis-report')
  if (!session || session.role !== 'staff' || !session.branchId) {
    return res.status(401).json({ error: 'Sign-in expired.' })
  }
  const branch = await getActiveBranch(session.branchId)
  if (!branch) return res.status(401).json({ error: 'Branch not found.' })

  res.setHeader('Set-Cookie', hodSessionSetCookie(req.headers.host, token))
  return res.status(200).json({
    ok: true,
    email: session.email,
    branchId: session.branchId,
    branchName: branch.name,
  })
}

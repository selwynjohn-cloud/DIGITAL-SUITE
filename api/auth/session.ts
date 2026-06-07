import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifySessionToken } from '../_lib/auth.js'

function readToken(req: VercelRequest) {
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const cookie = req.headers.cookie ?? ''
  const match = cookie.match(/agil_auth=([^;]+)/)
  return match?.[1]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = readToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const session = await verifySessionToken(token)
  if (!session) {
    return res.status(401).json({ error: 'Session expired' })
  }

  return res.status(200).json({ ok: true, session })
}

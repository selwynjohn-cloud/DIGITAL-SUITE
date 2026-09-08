/**
 * Field punch locked while Ops Mobile is Coming Soon.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  return res.status(403).json({ error: 'Coming Soon' })
}

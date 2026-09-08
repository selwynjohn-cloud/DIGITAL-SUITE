import type { VercelRequest, VercelResponse } from '@vercel/node'

/** Specialised content folds into Track 1 — On Site Tactical Training (OJT). */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Location', '/training/ojt')
  return res.status(302).end()
}

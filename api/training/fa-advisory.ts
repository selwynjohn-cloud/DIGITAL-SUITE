import type { VercelRequest, VercelResponse } from '@vercel/node'
import { faAdvisoryPageHtml } from '../_lib/training/fa-advisory-page.js'
import { listFaAdvisoryPublicBranches } from '../_lib/training/fa-advisory-store.js'

/** Public HDFC FA compliance advisory — no PIN. */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  let branches: Array<{ id: string; name: string }> = []
  try {
    branches = await listFaAdvisoryPublicBranches()
  } catch {
    branches = []
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(faAdvisoryPageHtml(branches))
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { nightVisitMgmtHandler } from '../_lib/mis/night-ojt-mgmt.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  return nightVisitMgmtHandler(req, res)
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clientDoorMgmtHandler } from '../_lib/mis/client-door-page.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  return clientDoorMgmtHandler(req, res)
}

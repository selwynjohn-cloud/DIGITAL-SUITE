import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clientVisitStaffHandler } from '../_lib/mis/client-visit-page.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  return clientVisitStaffHandler(req, res)
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { nightVisitStaffHandler } from '../_lib/mis/night-ojt-staff.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  return nightVisitStaffHandler(req, res)
}

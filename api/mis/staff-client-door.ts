import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clientDoorStaffHandler } from '../_lib/mis/client-door-page.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  return clientDoorStaffHandler(req, res)
}

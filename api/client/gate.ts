import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clientDoorPublicHtml } from '../_lib/client-door/page.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed')
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(clientDoorPublicHtml())
}

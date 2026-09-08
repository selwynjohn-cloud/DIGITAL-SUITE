import type { VercelRequest, VercelResponse } from '@vercel/node'
import { renderLicencesConsole } from '../_lib/licences/console.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(renderLicencesConsole(req))
}

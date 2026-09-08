import type { VercelRequest, VercelResponse } from '@vercel/node'
import { renderMeetingsConsole } from '../_lib/meetings/console.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(renderMeetingsConsole(req))
}

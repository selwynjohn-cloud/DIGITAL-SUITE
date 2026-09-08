import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ojtPageHtml } from '../_lib/training/ojt-ui.js'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(ojtPageHtml())
  } catch (err) {
    console.error('[training/ojt]', err)
    return res.status(500).send('OJT page failed to load. Please refresh.')
  }
}

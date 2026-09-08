import type { VercelRequest, VercelResponse } from '@vercel/node'
import { faRecordsPageHtml } from '../_lib/training/fa-records-page.js'

/** Staff / Management list of FA acknowledgements. Login via training shell. */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(faRecordsPageHtml())
}

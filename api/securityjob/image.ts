import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getImage } from '../_lib/securityjob/store.js'

/** GET /api/securityjob/image?id=xxx — serves an applicant photo. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = String(req.query.id ?? '').trim()
  if (!id) return res.status(400).send('Missing id')
  const dataUrl = await getImage(id)
  if (!dataUrl) return res.status(404).send('Not found')
  const m = /^data:(image\/[a-z0-9.+-]+);base64,(.*)$/i.exec(dataUrl)
  if (!m) return res.status(404).send('Not found')
  res.setHeader('Content-Type', m[1])
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400')
  return res.status(200).send(Buffer.from(m[2], 'base64'))
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getImage } from '../_lib/pulse/store.js'

/** GET /api/pulse/image?id=xxx  — serves a stored (uploaded) photo. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = String(req.query.id ?? '').trim()
  if (!id) return res.status(400).send('Missing id')

  const dataUrl = await getImage(id)
  if (!dataUrl) return res.status(404).send('Not found')

  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.*)$/i.exec(dataUrl)
  if (!match) return res.status(404).send('Not found')

  const mime = match[1]
  const buffer = Buffer.from(match[2], 'base64')
  res.setHeader('Content-Type', mime)
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400')
  return res.status(200).send(buffer)
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client'
import { verifyAppSession } from '../_lib/app-session.js'

/**
 * Issues a short-lived Vercel Blob client token so the browser can upload
 * MP3/MP4 directly to Blob storage (not through this function body).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (!blobToken) {
    return res.status(503).json({
      error:
        'File storage is not configured yet. Paste a public MP4 / YouTube link in the URL box, then Save & Publish.',
    })
  }

  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}) as {
      sessionToken?: string
      kind?: string
      filename?: string
      pathname?: string
    }

    const session = await verifyAppSession(String(body.sessionToken || ''), 'securityjob')
    if (!session || session.role !== 'management') {
      return res.status(401).json({ error: 'Please sign in again.' })
    }

    const kind = String(body.kind || '').toLowerCase()
    const isVideo = kind === 'academy'
    const folder = isVideo ? 'academy' : 'anthems'
    const rawName = String(body.filename || body.pathname || (isVideo ? 'video.mp4' : 'song.mp3'))
    const safe = rawName.replace(/[^\w.\-]+/g, '_').replace(/^_+/, '').slice(0, 80) || (isVideo ? 'video.mp4' : 'song.mp3')
    const pathname = `securityjob/${folder}/${Date.now()}-${safe}`
    const contentType = isVideo ? 'video/mp4' : 'audio/mpeg'

    const clientToken = await generateClientTokenFromReadWriteToken({
      token: blobToken,
      pathname,
      allowedContentTypes: isVideo
        ? ['video/mp4', 'video/quicktime', 'video/webm', 'application/octet-stream']
        : ['audio/mpeg', 'audio/mp3', 'audio/mpeg3', 'application/octet-stream'],
      maximumSizeInBytes: isVideo ? 100 * 1024 * 1024 : 15 * 1024 * 1024,
      addRandomSuffix: false,
      validUntil: Date.now() + 60 * 60 * 1000,
    })

    const storeId = clientToken.split('_')[3] || ''
    return res.status(200).json({
      clientToken,
      pathname,
      contentType,
      storeId,
      access: 'public',
    })
  } catch (err) {
    console.error('[securityjob/media-upload]', err)
    const msg = err instanceof Error ? err.message : 'Upload failed'
    return res.status(400).json({
      error: msg.includes('sign in')
        ? msg
        : 'Upload failed. Try a smaller file, or paste a YouTube / MP4 link instead.',
    })
  }
}

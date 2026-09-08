/**
 * Agile Meeting cron — daily reminder digest.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendMeetingsAlertDigest } from '../_lib/meetings/alerts.js'
import { meetStorageOk } from '../_lib/meetings/store.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization || ''
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    const fromVercel = Boolean(req.headers['x-vercel-cron'])
    if (!fromVercel && req.method !== 'GET') {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }
  if (!meetStorageOk()) return res.status(503).json({ ok: false, error: 'Redis not configured' })
  const digest = await sendMeetingsAlertDigest()
  return res.status(200).json({ ok: true, digest })
}

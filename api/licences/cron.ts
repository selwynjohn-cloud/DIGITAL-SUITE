/**
 * Agile Licenses cron — daily renewal digest.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendLicencesAlertDigest } from '../_lib/licences/alerts.js'
import { licStorageOk } from '../_lib/licences/store.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization || ''
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    const fromVercel = Boolean(req.headers['x-vercel-cron'])
    if (!fromVercel && req.method !== 'GET') {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }
  if (!licStorageOk()) return res.status(503).json({ ok: false, error: 'Redis not configured' })
  const digest = await sendLicencesAlertDigest()
  return res.status(200).json({ ok: true, digest })
}

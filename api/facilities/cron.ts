/**
 * Agile Facilities cron — daily lease/tax/maintenance alert digest.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendFacilitiesAlertDigest } from '../_lib/facilities/alerts.js'
import { facStorageOk } from '../_lib/facilities/store.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization || ''
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    const fromVercel = Boolean(req.headers['x-vercel-cron'])
    if (!fromVercel && req.method !== 'GET') {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  if (!facStorageOk()) {
    return res.status(503).json({ ok: false, error: 'Redis not configured' })
  }

  const digest = await sendFacilitiesAlertDigest()
  return res.status(200).json({ ok: true, digest })
}

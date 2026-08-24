import type { VercelRequest, VercelResponse } from '@vercel/node'
import { loadBranchLoginOptionsHtml } from '../_lib/branch-login-options.js'
import { agileLiveGuardPage } from '../_lib/agile-live/guard-page.js'
import { agileLiveStaffPage } from '../_lib/agile-live/staff-page.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  const portal = String(req.query.portal ?? '').trim().toLowerCase()
  if (portal === 'staff' || portal === 'management') {
    const branches = await loadBranchLoginOptionsHtml('live')
    return res.status(200).send(agileLiveStaffPage(portal, branches))
  }
  return res.status(200).send(agileLiveGuardPage())
}

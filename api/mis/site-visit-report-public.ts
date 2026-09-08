import type { VercelRequest, VercelResponse } from '@vercel/node'
import { siteVisitReportPublicPageHtml } from '../_lib/mis/site-visit-report-public-ui.js'
import {
  handleSiteVisitPublicBoot,
  handleSiteVisitPublicClients,
  handleSiteVisitPublicDraftLoad,
  handleSiteVisitPublicSubmit,
} from '../_lib/mis/site-visit-report-handlers.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const q = req.query || {}
      if (q.boot === '1' || q.boot === 'true') {
        const out = await handleSiteVisitPublicBoot()
        return res.status(out.status).json(out.json)
      }
      if (q.clients === '1' || q.clients === 'true') {
        const out = await handleSiteVisitPublicClients({
          branchId: String(q.branchId || ''),
        })
        return res.status(out.status).json(out.json)
      }
      if (q.draft === '1' || q.draft === 'true' || q.code || q.resumeCode) {
        const out = await handleSiteVisitPublicDraftLoad({
          branchId: String(q.branchId || ''),
          clientId: String(q.clientId || ''),
          officerName: String(q.officerName || ''),
          code: String(q.code || q.resumeCode || ''),
        })
        return res.status(out.status).json(out.json)
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      return res.status(200).send(siteVisitReportPublicPageHtml())
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const body = (req.body ?? {}) as Record<string, unknown>
    const out = await handleSiteVisitPublicSubmit(body)
    return res.status(out.status).json(out.json)
  } catch (err) {
    console.error('[mis/site-visit-report-public]', err)
    return res.status(500).json({ error: 'Site visit report failed. Please refresh.' })
  }
}

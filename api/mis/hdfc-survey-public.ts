import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hdfcSsaFormatHtml } from '../_lib/mis/hdfc-ssa-format-pdf.js'
import { hdfcPublicSurveyPageHtml } from '../_lib/mis/hdfc-survey-public-ui.js'
import {
  handlePeriodicalSurveyPublicBoot,
  handlePeriodicalSurveyPublicClients,
  handlePeriodicalSurveyPublicDraftLoad,
  handlePeriodicalSurveyPublicSubmit,
} from '../_lib/mis/periodical-survey-handlers.js'

export const maxDuration = 45

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const q = req.query || {}
      if (q.boot === '1' || q.boot === 'true') {
        const out = await handlePeriodicalSurveyPublicBoot({
          branchId: String(q.branchId || ''),
        })
        return res.status(out.status).json(out.json)
      }
      if (q.clients === '1' || q.clients === 'true') {
        const out = await handlePeriodicalSurveyPublicClients({
          branchId: String(q.branchId || ''),
        })
        return res.status(out.status).json(out.json)
      }
      if (q.draft === '1' || q.draft === 'true' || q.code || q.resumeCode) {
        const out = await handlePeriodicalSurveyPublicDraftLoad({
          branchId: String(q.branchId || ''),
          clientId: String(q.clientId || ''),
          surveyedBy: String(q.surveyedBy || ''),
          code: String(q.code || q.resumeCode || ''),
        })
        return res.status(out.status).json(out.json)
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      if (q.format === '1' || q.format === 'true' || q.pdf === '1') {
        return res.status(200).send(hdfcSsaFormatHtml())
      }
      return res.status(200).send(hdfcPublicSurveyPageHtml())
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const body = (req.body ?? {}) as Record<string, unknown>
    const out = await handlePeriodicalSurveyPublicSubmit(body)
    return res.status(out.status).json(out.json)
  } catch (err) {
    console.error('[mis/hdfc-survey-public]', err)
    return res.status(500).json({ error: 'Public HDFC survey failed. Please refresh.' })
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hdfcSsaDashboardPageHtml } from '../_lib/mis/hdfc-ssa-dashboard.js'
import {
  handleHdfcSsaBoardPublicBoot,
  handleHdfcSsaBoardPublicReport,
} from '../_lib/mis/periodical-survey-handlers.js'

export const maxDuration = 30

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const q = (req.query || {}) as Record<string, string | string[] | undefined>
    const pick = (k: string) => String(Array.isArray(q[k]) ? q[k][0] : q[k] || '')
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>
    const code = pick('code') || String(body.code || '')
    const surveyId = pick('surveyId') || String(body.surveyId || '')

    if (req.method === 'GET' && (pick('boot') === '1' || pick('boot') === 'true')) {
      const out = await handleHdfcSsaBoardPublicBoot({ code })
      return res.status(out.status).json(out.json)
    }
    if (req.method === 'GET' && (pick('report') === '1' || pick('report') === 'true')) {
      const out = await handleHdfcSsaBoardPublicReport({ code, surveyId })
      return res.status(out.status).json(out.json)
    }
    if (req.method === 'POST') {
      const action = String(body.action || '')
      if (action === 'report' || pick('report') === '1') {
        const out = await handleHdfcSsaBoardPublicReport({ code, surveyId })
        return res.status(out.status).json(out.json)
      }
      const out = await handleHdfcSsaBoardPublicBoot({ code })
      return res.status(out.status).json(out.json)
    }
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(hdfcSsaDashboardPageHtml())
  } catch (err) {
    console.error('[mis/hdfc-ssa-board]', err)
    return res.status(500).json({ error: 'HDFC SSA board failed. Please refresh.' })
  }
}

/**
 * Security Job + Security News Excel.
 * Daily mail at 07:00 IST (Vercel cron). Optional Mac download uses SECURITYJOB_LIST_EXPORT_KEY.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'
import { misTodayIst } from '../_lib/mis/dates.js'
import { isVercelClockRequest } from '../_lib/pulse/clock.js'
import {
  buildSecurityJobExcel,
  buildSecurityNewsExcel,
  SECURITY_JOB_XLSX,
  SECURITY_NEWS_XLSX,
} from '../_lib/recruitment/securityjob-list-excel.js'
import { pinMailFrom, sendSuiteEmail, suiteDirectorEmail } from '../_lib/suite-mail.js'

export const maxDuration = 60

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function exportKeyOk(req: VercelRequest): boolean {
  const expected = process.env.SECURITYJOB_LIST_EXPORT_KEY?.trim()
  if (!expected || expected.length < 16) return false
  const got = String(req.headers['x-securityjob-list-key'] || '').trim()
  return got.length >= 16 && got === expected
}

function cronOk(req: VercelRequest): boolean {
  if (isVercelClockRequest(req)) return true
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const auth = String(req.headers.authorization || '')
  return auth === `Bearer ${secret}` || String(req.query.secret || '') === secret
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const wantMail = String(req.query.mail || '') === '1'
  if (wantMail) {
    if (!cronOk(req) && !exportKeyOk(req)) return res.status(401).json({ error: 'Unauthorized' })
    const job = await buildSecurityJobExcel()
    const news = await buildSecurityNewsExcel()
    const ymd = misTodayIst()
    const { listHoldDueToday, holdCallRemindHtml, sendHoldCallReminders } = await import(
      '../_lib/recruitment/sj-hold-remind.js'
    )
    const holdDue = await listHoldDueToday(ymd)
    const holdHtml = holdCallRemindHtml(holdDue, ymd)
    await sendHoldCallReminders().catch(() => null)
    const apiKey = process.env.RESEND_API_KEY?.trim()
    if (!apiKey) return res.status(500).json({ error: 'Mail is not configured.' })
    const sent = await sendSuiteEmail(new Resend(apiKey), {
      from: pinMailFrom(),
      to: suiteDirectorEmail(),
      subject: `SecurityJob List — ${ymd}`,
      html: `<div style="font-family:Arial,sans-serif;color:#1e293b">
        ${holdHtml}
        <p>Two separate Excel files for today (${ymd}):</p>
        <ol>
          <li>${SECURITY_JOB_XLSX}</li>
          <li>${SECURITY_NEWS_XLSX}</li>
        </ol>
        <p>Save both into <b>Documents → SecurityJob List</b>.</p>
      </div>`,
      attachments: [
        { filename: SECURITY_JOB_XLSX, content: Buffer.from(job).toString('base64'), contentType: XLSX_TYPE },
        { filename: SECURITY_NEWS_XLSX, content: Buffer.from(news).toString('base64'), contentType: XLSX_TYPE },
      ],
    })
    if (sent.error) return res.status(500).json({ error: sent.error.message || 'Mail failed.' })
    return res.status(200).json({ ok: true, mailed: true, ymd })
  }

  if (!exportKeyOk(req)) return res.status(401).json({ error: 'Unauthorized' })
  const file = String(req.query.file || '').trim()
  const job = file === 'job'
  if (!job && file !== 'news') return res.status(400).json({ error: 'Use file=job or file=news' })
  const buf = job ? await buildSecurityJobExcel() : await buildSecurityNewsExcel()
  const name = job ? SECURITY_JOB_XLSX : SECURITY_NEWS_XLSX
  res.setHeader('Content-Type', XLSX_TYPE)
  res.setHeader('Content-Disposition', `attachment; filename="${name}"`)
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(buf)
}

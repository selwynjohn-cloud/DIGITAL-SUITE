import type { VercelRequest, VercelResponse } from '@vercel/node'
import { drawTargetWeekKey, prepareWeeklyDraw, publishNoWinner, winnerPublishedForWeek } from '../_lib/pulse/quiz.js'
import { notifyNoWinnerPublished } from '../_lib/pulse/winner-notify.js'
import { waSendText, whatsappConfigured } from '../_lib/pulse/whatsapp.js'

/**
 * Sunday 8:00 AM IST — auto-pick quiz winner and send WhatsApp preview to Director for approval.
 * GET /api/pulse/winner-cron  (Vercel Cron + CRON_SECRET)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET?.trim()
  const preview = String(req.query.preview ?? '') === '1'
  if (secret && !preview) {
    const auth = String(req.headers.authorization ?? '')
    if (auth !== `Bearer ${secret}`) return res.status(401).json({ error: 'Unauthorized' })
  }

  const week = drawTargetWeekKey()
  const result = await prepareWeeklyDraw(week)

  if (!result.ok) {
    const reason = result.reason
    if (reason === 'no-entries') {
      if (!(await winnerPublishedForWeek(week))) {
        await publishNoWinner(week)
      }
      const whatsappSent = await notifyNoWinnerPublished(week)
      return res.status(200).json({ ok: true, noWinner: true, week, published: true, whatsappSent })
    }
    return res.status(200).json({ ok: true, skipped: true, reason, week })
  }

  const { pending } = result
  const approveSecret = process.env.PULSE_APPROVE_SECRET?.trim() ?? ''
  const base = 'https://www.agilegroup-digital.co.in/api/pulse/winner-approve'
  const publishLink = `${base}?token=${encodeURIComponent(approveSecret)}`
  const skipNote = 'If you do not tap Publish, the winner stays off the bulletin and no message goes to the winner.'

  let whatsappSent = false
  const admin = process.env.ADMIN_WHATSAPP?.trim()
  if (admin && whatsappConfigured() && approveSecret) {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const r1 = await waSendText(
      admin,
      `🏆 *QUIZ WINNER — PREVIEW*\n\n` +
        `Week: *${pending.weekKey}*\n` +
        `Winner: *${pending.name}*\n` +
        `Entries this week: *${pending.entryCount}*\n\n` +
        `Tap to publish on the bulletin + WhatsApp the winner:\n${publishLink}\n\n` +
        skipNote,
    )
    await sleep(1200)
    whatsappSent = Boolean(r1?.ok)
  }

  return res.status(200).json({
    ok: true,
    week: pending.weekKey,
    winner: pending.name,
    mobileLast4: pending.mobileLast4,
    entryCount: pending.entryCount,
    whatsappSent,
    publishLink: preview ? publishLink : undefined,
  })
}

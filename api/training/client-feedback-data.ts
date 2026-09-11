import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  getClientFeedbackMeta,
  loadClientFeedbackRecord,
  normalizeBenefitRating,
  saveClientFeedbackRecord,
  type OjtClientFeedbackRecord,
} from '../_lib/training/ojt-client-feedback-store.js'
import { emptyExtra, saveExtra } from '../_lib/training/ojt-extras-store.js'
import { sendOjtClientFeedbackAckMail } from '../_lib/training/ojt-mail.js'
import {
  emptyOjtReport,
  findSession,
  loadOjtReport,
  monthOf,
  normalizeOjtReport,
  saveOjtReport,
} from '../_lib/training/ojt-store.js'
import { TRAINING_GOOGLE_REVIEW_URL } from '../_lib/training/training-brand.js'

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(status).json(body)
}

function clientIp(req: VercelRequest): string {
  const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0]?.trim()
  return xf || String(req.socket?.remoteAddress || '').slice(0, 80)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' })
  try {
    const body = (req.body || {}) as Record<string, unknown>
    const action = String(body.action ?? '').trim()
    const token = String(body.token ?? '').trim()
    const meta = await getClientFeedbackMeta(token)
    if (!meta) return json(res, 404, { ok: false, error: 'This feedback link is not valid.' })

    const found = await findSession(meta.branchId, meta.sessionId, [
      meta.month,
      meta.trainingDate,
      monthOf(meta.trainingDate),
    ])
    const session = found?.session || {
      id: meta.sessionId,
      branchId: meta.branchId,
      clientName: meta.clientName,
      clientEmail: meta.clientEmail,
      location: meta.location,
      trainingDate: meta.trainingDate,
      trainingTime: meta.trainingTime,
      trainerName: meta.trainerName,
      topics: '',
    }

    if (action === 'load') {
      const report = (await loadOjtReport(meta.sessionId)) || emptyOjtReport(meta.sessionId)
      const lastReply =
        (await loadClientFeedbackRecord(token)) ||
        (report.clientOjtBenefitRating
          ? {
              rating: normalizeBenefitRating(report.clientOjtBenefitRating),
              repliedAt: report.clientOjtBenefitAt || '',
              repliedIp: '',
              personName: report.clientOjtBenefitBy || '',
            }
          : null)
      return json(res, 200, {
        ok: true,
        session: {
          clientName: session.clientName,
          location: session.location,
          trainingDate: session.trainingDate,
          trainingTime: session.trainingTime,
          trainerName: session.trainerName,
        },
        lastReply: lastReply?.rating ? lastReply : null,
        googleReviewUrl:
          lastReply?.rating === 'Highly Beneficial' ? TRAINING_GOOGLE_REVIEW_URL : '',
      })
    }

    if (action === 'submit') {
      const rating = normalizeBenefitRating(body.rating)
      if (!rating) {
        return json(res, 400, {
          ok: false,
          error: 'Please select: Highly Beneficial, Beneficial, or Needs Improvement.',
        })
      }
      const existing = await loadClientFeedbackRecord(token)
      if (existing?.rating) {
        return json(res, 400, { ok: false, error: 'Feedback already submitted. Thank you.' })
      }
      const repliedAt = new Date().toISOString()
      const personName = String(body.personName || '').trim().slice(0, 120)
      const reply: OjtClientFeedbackRecord = {
        rating,
        repliedAt,
        repliedIp: clientIp(req),
        personName,
      }
      const saved = await saveClientFeedbackRecord(token, reply)
      if (!saved) return json(res, 500, { ok: false, error: 'Could not save feedback.' })

      // Always write onto the completion report record (same sessionId) for our files.
      const report = (await loadOjtReport(meta.sessionId)) || emptyOjtReport(meta.sessionId)
      const benefitLine = `Overall, how was the OJT beneficial to our security operations? ${rating}${
        personName ? ` — ${personName}` : ''
      } (${repliedAt.slice(0, 16).replace('T', ' ')})`
      const existingFb = String(report.feedback || '').trim()
      const nextFeedback =
        !existingFb
          ? benefitLine
          : /OJT beneficial/i.test(existingFb)
            ? existingFb
            : `${existingFb}\n\n${benefitLine}`
      const merged = normalizeOjtReport(
        {
          ...report,
          sessionId: meta.sessionId,
          clientOjtBenefitRating: rating,
          clientOjtBenefitAt: repliedAt,
          clientOjtBenefitBy: personName,
          clientFeedbackToken: token,
          clientFeedback: benefitLine,
          feedback: nextFeedback,
          reportDate: report.reportDate || session.trainingDate || '',
          topicsCovered: report.topicsCovered || String((session as { topics?: string }).topics || ''),
        },
        meta.sessionId,
      )
      const reportOk = await saveOjtReport(merged)
      if (!reportOk) {
        return json(res, 500, { ok: false, error: 'Feedback saved, but could not update completion report.' })
      }

      const month = monthOf(session.trainingDate) || meta.month
      const extra = emptyExtra(meta.branchId || session.branchId, 'feedbackClient')
      extra.sessionId = meta.sessionId
      extra.clientName = session.clientName
      extra.trainingDate = session.trainingDate
      extra.title = `OJT benefit — ${rating}`
      extra.body = [
        'Overall, how was the OJT beneficial to our security operations?',
        rating,
        personName ? `Client person: ${personName}` : '',
        `Submitted: ${repliedAt}`,
        'Stored on completion report for our record.',
      ]
        .filter(Boolean)
        .join('\n')
      extra.score = rating
      extra.createdBy = personName || session.clientEmail || 'client-link'
      await saveExtra(extra, month)

      if (found?.session) {
        try {
          await sendOjtClientFeedbackAckMail(found.session, reply)
        } catch {
          /* non-blocking */
        }
      }

      return json(res, 200, {
        ok: true,
        rating,
        repliedAt,
        savedOnCompletionReport: true,
        askGoogleReview: rating === 'Highly Beneficial',
        googleReviewUrl: rating === 'Highly Beneficial' ? TRAINING_GOOGLE_REVIEW_URL : '',
      })
    }

    return json(res, 400, { ok: false, error: 'Unknown action.' })
  } catch (e) {
    return json(res, 500, {
      ok: false,
      error: e instanceof Error ? e.message : 'Feedback failed',
    })
  }
}

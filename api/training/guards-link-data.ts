import type { VercelRequest, VercelResponse } from '@vercel/node'
import { publicSessionYesNoQuestions } from '../_lib/training/ojt-attendance-quiz.js'
import { emptyExtra, saveExtra } from '../_lib/training/ojt-extras-store.js'
import {
  findOrCreateResponse,
  getGuardsLinkMeta,
  loadSessionForGuardsLink,
  submitAttendance,
  submitDutyStatus,
  submitFeedback,
  submitYesNoQuiz,
  type GuardDutyStatus,
} from '../_lib/training/ojt-guards-link-store.js'
import { CHANNEL_URL } from '../_lib/pulse/config.js'

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  res.setHeader('Cache-Control', 'no-store')
  return res.status(status).json(body)
}

function publicSession(s: {
  clientName: string
  trainingDate: string
  trainingTime: string
  location: string
  trainerName: string
  topics: string
}) {
  return {
    clientName: s.clientName,
    trainingDate: s.trainingDate,
    trainingTime: s.trainingTime,
    location: s.location,
    trainerName: s.trainerName,
    topics: s.topics,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' })

  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const action = String(body.action ?? '').trim()
    const token = String(body.token ?? '').trim()
    const deviceKey = String(body.deviceKey ?? '').trim()
    const meta = await getGuardsLinkMeta(token)
    if (!meta) return json(res, 404, { ok: false, error: 'Training link not found or expired.' })
    const session = await loadSessionForGuardsLink(meta)
    if (!session) return json(res, 404, { ok: false, error: 'Training session not found.' })
    if (session.status === 'Cancelled') {
      return json(res, 400, { ok: false, error: 'This training was cancelled.' })
    }

    if (action === 'meta') {
      const response = await findOrCreateResponse(session.id, deviceKey || 'anon')
      return json(res, 200, {
        ok: true,
        session: publicSession(session),
        yesNoQuestions: publicSessionYesNoQuestions(session),
        questions: publicSessionYesNoQuestions(session),
        channelUrl: CHANNEL_URL,
        response,
      })
    }

    if (action === 'status') {
      const status = String(body.status ?? '').trim() as GuardDutyStatus
      if (!['on_duty', 'on_leave', 'attending', 'not_working'].includes(status)) {
        return json(res, 400, { ok: false, error: 'Select a valid status.' })
      }
      const response = await submitDutyStatus({ sessionId: session.id, deviceKey, status })
      return json(res, 200, { ok: true, response })
    }

    if (action === 'attendance') {
      const result = await submitAttendance({
        sessionId: session.id,
        deviceKey,
        guardName: String(body.guardName ?? ''),
        employeeId: String(body.employeeId ?? ''),
        trainingDate: session.trainingDate,
        trainingTime: session.trainingTime,
      })
      if (!result.ok) return json(res, 400, { ok: false, error: result.error })
      return json(res, 200, { ok: true, response: result.row })
    }

    if (action === 'test') {
      const answers = Array.isArray(body.answers) ? (body.answers as { qId: string; choice: string }[]) : []
      const result = await submitYesNoQuiz({ sessionId: session.id, deviceKey, answers })
      if (!result.ok) return json(res, 400, { ok: false, error: result.error })
      return json(res, 200, {
        ok: true,
        response: result.row,
        thankYou: `Thank you. Your marks: ${result.row.score}/${result.row.maxScore}`,
      })
    }

    if (action === 'feedback') {
      const result = await submitFeedback({
        sessionId: session.id,
        deviceKey,
        rating: String(body.rating ?? ''),
        text: String(body.text ?? ''),
      })
      if (!result.ok) return json(res, 400, { ok: false, error: result.error })

      /** Mirror into Guard feedback format menu (extras). */
      try {
        const month = String(session.trainingDate || '').slice(0, 7)
        const bodyText = [
          `Guard: ${result.row.guardName || 'Guard'}`,
          result.row.employeeId ? `Employee ID: ${result.row.employeeId}` : '',
          `Rating: ${result.row.feedbackRating || '—'}`,
          `Marks: ${result.row.score ?? '—'}/${result.row.maxScore ?? '—'}`,
          '',
          result.row.feedbackText || '',
        ]
          .filter(Boolean)
          .join('\n')
        const entry = emptyExtra(session.branchId, 'feedbackGuard')
        entry.sessionId = session.id
        entry.clientName = session.clientName || ''
        entry.trainingDate = session.trainingDate || ''
        entry.title = `${result.row.guardName || 'Guard'} — ${result.row.feedbackRating || 'Feedback'}`
        entry.body = bodyText
        entry.score = result.row.feedbackRating || ''
        entry.createdBy = `guards-link:${result.row.guardName || 'guard'}`
        await saveExtra(entry, month)
      } catch (e) {
        console.error('[guards-link-data] feedback extras', e)
      }

      return json(res, 200, {
        ok: true,
        response: result.row,
        channelUrl: CHANNEL_URL,
        thankYou: 'Thank you for attending the Training session.',
      })
    }

    return json(res, 400, { ok: false, error: 'Unknown action.' })
  } catch (err) {
    console.error('[guards-link-data]', err)
    return json(res, 500, { ok: false, error: 'Server error.' })
  }
}

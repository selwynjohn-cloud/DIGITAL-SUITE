import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  getClientReplyMeta,
  loadClientReplyRecord,
  saveClientReplyRecord,
  type OjtClientReplyAction,
  type OjtClientReplyRecord,
} from '../_lib/training/ojt-client-reply-store.js'
import { sendOjtClientReplySiteMail } from '../_lib/training/ojt-mail.js'
import { findSession, joinTopics, upsertSession, type OjtSession } from '../_lib/training/ojt-store.js'
import { saveOjtTopic } from '../_lib/training/ojt-topics-catalog.js'

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(status).json(body)
}

function clientIp(req: VercelRequest): string {
  const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0]?.trim()
  return xf || String(req.socket?.remoteAddress || '').slice(0, 80)
}

function applyRemoveTopic(row: OjtSession, removeName: string): void {
  const want = removeName.trim().toLowerCase()
  if (!want) return
  const keys = ['topic1', 'topic2', 'topic3', 'topic4', 'topic5'] as const
  for (const key of keys) {
    if (String(row[key] || '').trim().toLowerCase() === want) {
      row[key] = ''
    }
  }
  row.topics = joinTopics(row)
}

function applyAddTopic(row: OjtSession, topicName: string): void {
  const name = topicName.trim()
  if (!name) return
  const slots = [row.topic1, row.topic2, row.topic3, row.topic4, row.topic5].map((t) =>
    String(t || '').trim(),
  )
  const already = slots.some((t) => t.toLowerCase() === name.toLowerCase())
  if (!already) {
    const emptyIdx = slots.findIndex((t) => !t)
    if (emptyIdx >= 0) {
      const key = `topic${emptyIdx + 1}` as 'topic1' | 'topic2' | 'topic3' | 'topic4' | 'topic5'
      row[key] = name
    } else {
      row.topic5 = name
    }
    row.topics = joinTopics(row)
  }
}

function buildChangeNote(opts: {
  removeTopicName: string
  topicName: string
  newDate: string
  newTime: string
}): string {
  const parts: string[] = []
  if (opts.removeTopicName) parts.push(`Remove topic: ${opts.removeTopicName}`)
  if (opts.topicName) parts.push(`Add topic: ${opts.topicName}`)
  if (opts.newDate || opts.newTime) {
    parts.push(`Change date/time to ${opts.newDate} ${opts.newTime}`.trim())
  }
  return parts.join(' · ') || 'Change required'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' })
  try {
    const body = (req.body || {}) as Record<string, unknown>
    const action = String(body.action ?? '').trim()
    const token = String(body.token ?? '').trim()
    const meta = await getClientReplyMeta(token)
    if (!meta) return json(res, 404, { ok: false, error: 'This confirmation link is not valid.' })

    const found = await findSession(meta.branchId, meta.sessionId, [meta.month, meta.trainingDate])
    if (!found) return json(res, 404, { ok: false, error: 'Schedule not found. Please contact Training.' })

    if (action === 'load') {
      const lastReply = await loadClientReplyRecord(token)
      return json(res, 200, {
        ok: true,
        session: {
          clientName: found.session.clientName,
          location: found.session.location,
          trainingDate: found.session.trainingDate,
          trainingTime: found.session.trainingTime,
          trainerName: found.session.trainerName,
          topics: found.session.topics,
          clientReplyAt: found.session.clientReplyAt,
          clientReplyAction: found.session.clientReplyAction,
        },
        lastReply,
      })
    }

    if (action === 'reply') {
      let replyAction = String(body.replyAction ?? '').trim() as OjtClientReplyAction
      const topicName = String(body.topicName ?? '').trim().slice(0, 200)
      const removeTopicName = String(body.removeTopicName ?? '').trim().slice(0, 200)
      const newDate = String(body.newDate ?? '').trim().slice(0, 10)
      const newTime = String(body.newTime ?? '').trim().slice(0, 8)

      /** Map legacy single buttons into the same handlers. */
      if (replyAction === 'addTopic' || replyAction === 'removeTopic' || replyAction === 'changeSchedule') {
        replyAction = 'changeRequired'
      }

      if (replyAction !== 'confirm' && replyAction !== 'changeRequired') {
        return json(res, 400, { ok: false, error: 'Please choose a valid reply option.' })
      }

      if (replyAction === 'changeRequired') {
        if (!removeTopicName && !topicName && !newDate && !newTime) {
          return json(res, 400, {
            ok: false,
            error: 'Please remove a topic, add a topic, or change the date/time.',
          })
        }
        if ((newDate || newTime) && !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
          return json(res, 400, { ok: false, error: 'Please pick a valid new date from the calendar.' })
        }
        if ((newDate || newTime) && !newTime) {
          return json(res, 400, { ok: false, error: 'Please pick a new time.' })
        }
      }

      const repliedAt = new Date().toISOString()
      const note =
        replyAction === 'confirm'
          ? 'Confirmed as Scheduled'
          : buildChangeNote({ removeTopicName, topicName, newDate, newTime })

      const reply: OjtClientReplyRecord = {
        action: replyAction === 'confirm' ? 'confirm' : 'changeRequired',
        topicName: replyAction === 'changeRequired' ? topicName : '',
        removeTopicName: replyAction === 'changeRequired' ? removeTopicName : '',
        newDate: replyAction === 'changeRequired' ? newDate : '',
        newTime: replyAction === 'changeRequired' ? newTime : '',
        note,
        repliedAt,
        repliedIp: clientIp(req),
      }
      await saveClientReplyRecord(token, reply)

      const row = { ...found.session }
      row.clientReplyToken = token
      row.clientReplyAt = repliedAt
      row.clientReplyAction = reply.action
      row.clientReplyTopic = reply.topicName
      row.clientReplyRemoveTopic = reply.removeTopicName
      row.clientReplyNewDate = reply.newDate
      row.clientReplyNewTime = reply.newTime
      row.clientReplyNote = note

      if (reply.action === 'changeRequired') {
        if (removeTopicName) applyRemoveTopic(row, removeTopicName)
        if (topicName) {
          applyAddTopic(row, topicName)
          await saveOjtTopic(
            {
              title: topicName,
              category: 'Client suggested',
              clientSuggested: true,
              active: true,
            },
            String(row.clientEmail || 'client'),
          )
        }
      }

      const saved = await upsertSession(row)
      if (!saved.ok) return json(res, 500, { ok: false, error: 'Could not save your reply.' })

      await sendOjtClientReplySiteMail(saved.session, reply)

      const message =
        reply.action === 'confirm'
          ? 'Thank you. Confirmed as Scheduled. The site will be informed digitally.'
          : 'Thank you. Change required is recorded. The site / Training team will be informed digitally.'

      return json(res, 200, {
        ok: true,
        message,
        repliedAt,
        reply,
        session: {
          clientName: saved.session.clientName,
          location: saved.session.location,
          trainingDate: saved.session.trainingDate,
          trainingTime: saved.session.trainingTime,
          trainerName: saved.session.trainerName,
          topics: saved.session.topics,
        },
      })
    }

    return json(res, 400, { ok: false, error: 'Unknown action.' })
  } catch (e) {
    return json(res, 500, { ok: false, error: e instanceof Error ? e.message : 'Server error' })
  }
}

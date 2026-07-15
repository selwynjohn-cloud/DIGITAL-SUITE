import type { VercelRequest, VercelResponse } from '@vercel/node'
import { addEntry, getQuestionById, getTodayQuestion } from '../_lib/pulse/quiz.js'

/**
 * GET  /api/pulse/quiz            -> today's question (without the answer)
 * POST /api/pulse/quiz {id,key,name?,mobile?,guardId?} -> checks the answer, records a
 *                                    weekly prize-draw entry on a correct answer.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    const q = await getTodayQuestion()
    return res.status(200).json({
      id: q.id,
      type: q.type,
      question: q.question,
      imageUrl: q.imageUrl,
      options: q.options,
    })
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as Record<string, unknown>
    const id = String(body.id ?? '')
    const key = String(body.key ?? '')
    const name = String(body.name ?? '').trim()
    const mobile = String(body.mobile ?? '').trim()
    const guardId = String(body.guardId ?? '').trim()
    const agileGuard = String(body.agileGuard ?? '') === '1' || Boolean(guardId)

    const q = await getQuestionById(id)
    if (!q) return res.status(404).json({ error: 'Question not found.' })

    const correct = key === q.correctKey
    let entered = false
    let guardVerified = false
    if (correct && name && mobile.replace(/\D/g, '').length >= 10) {
      const gid = agileGuard ? guardId : ''
      entered = await addEntry(name, mobile, gid || undefined)
      if (gid) {
        const { lookupGuard } = await import('../_lib/pulse/guard-directory.js')
        guardVerified = Boolean(await lookupGuard(gid))
      }
    }
    return res.status(200).json({
      correct,
      correctKey: q.correctKey,
      explanation: q.explanation,
      entered,
      agileGuard: guardVerified,
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { getEditorial, saveEditorial, saveImage, storageStatus } from '../_lib/pulse/store.js'
import {
  drawWinner,
  generateQuestions,
  getBank,
  getEntries,
  getWinners,
  saveBank,
  weekKey,
} from '../_lib/pulse/quiz.js'
import { sendThankYouToParticipants } from '../_lib/pulse/winner-notify.js'
import type { EditorialContent, QuizQuestion } from '../_lib/pulse/types.js'

export const maxDuration = 60

const OPTION_KEYS = ['A', 'B', 'C', 'D']

function sanitiseBank(input: unknown): QuizQuestion[] {
  const arr = Array.isArray(input) ? input : []
  const str = (v: unknown) => String(v ?? '').slice(0, 1000)
  return arr.slice(0, 500).map((q) => {
    const opts = Array.isArray((q as any)?.options) ? (q as any).options : []
    const options = opts
      .slice(0, 4)
      .map((o: any, i: number) => ({ key: OPTION_KEYS[i], text: str(o?.text) }))
      .filter((o: { text: string }) => o.text)
    let correct = String((q as any)?.correctKey ?? 'A').toUpperCase()
    if (!OPTION_KEYS.includes(correct)) correct = 'A'
    return {
      id: str((q as any)?.id) || `${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
      type: (q as any)?.type === 'image' ? 'image' : 'text',
      question: str((q as any)?.question),
      imageUrl: String((q as any)?.imageUrl ?? '').trim().slice(0, 2000),
      options: options.length >= 2 ? options : [{ key: 'A', text: '' }],
      correctKey: correct,
      explanation: str((q as any)?.explanation),
    }
  })
}

/**
 * POST /api/pulse/admin-data — manager portal (email OTP session required).
 */

function sanitiseEditorial(input: unknown): EditorialContent {
  const data = (input ?? {}) as Partial<EditorialContent>
  const str = (v: unknown) => String(v ?? '').slice(0, 4000)
  const url = (v: unknown) => String(v ?? '').trim().slice(0, 2000)

  const events = Array.isArray(data.events)
    ? data.events.slice(0, 10).map((e) => ({
        id: str((e as any)?.id) || `${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
        heading: str((e as any)?.heading),
        text: str((e as any)?.text),
        imageUrl: url((e as any)?.imageUrl),
        videoUrl: url((e as any)?.videoUrl),
      }))
    : []

  const jobImages = Array.isArray(data.jobImages)
    ? data.jobImages.slice(0, 3).map(url).filter(Boolean)
    : []

  const guards = Array.isArray(data.guards)
    ? data.guards.slice(0, 3).map((g) => ({
        id: str((g as any)?.id) || `${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
        name: str((g as any)?.name),
        guardId: str((g as any)?.guardId),
        clientName: str((g as any)?.clientName),
        location: str((g as any)?.location),
        photoUrl: url((g as any)?.photoUrl),
        citation: str((g as any)?.citation),
      }))
    : []

  return { events, jobImages, guards }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = (req.body ?? {}) as Record<string, unknown>
  const action = String(body.action ?? '')

  // Safe, unauthenticated health check — reports only whether the database and
  // admin password are configured (no secret values are ever returned).
  if (action === 'status') {
    return res.status(200).json({
      ok: true,
      storage: storageStatus(),
      passwordConfigured: false,
    })
  }

  const otpSession = await verifyAppSession(String(body.sessionToken ?? ''), 'pulse')
  if (!otpSession) {
    return res.status(401).json({ error: 'Please sign in with your @agilegroup.co.in email OTP.' })
  }

  const storage = storageStatus()

  if (action === 'login') {
    return res.status(200).json({ ok: true, storage })
  }

  if (action === 'load') {
    const editorial = await getEditorial()
    return res.status(200).json({ ok: true, editorial, storage })
  }

  if (action === 'upload') {
    if (!storage.ok) {
      return res.status(503).json({ error: 'Storage not connected. Cannot save photos yet.' })
    }
    const id = await saveImage(String(body.dataUrl ?? ''))
    if (!id) return res.status(400).json({ error: 'Could not save image (must be an image under ~4MB).' })
    return res.status(200).json({ ok: true, id, url: `/api/pulse/image?id=${id}` })
  }

  if (action === 'save') {
    if (!storage.ok) {
      return res
        .status(503)
        .json({ error: 'Storage not connected. Add UPSTASH_REDIS keys in Vercel, then try again.' })
    }
    const editorial = sanitiseEditorial(body.editorial)
    const saved = await saveEditorial(editorial)
    if (!saved) return res.status(503).json({ error: 'Could not save. Please try again.' })
    return res.status(200).json({ ok: true, editorial })
  }

  /* ---------- Security Quiz management ---------- */

  if (action === 'quiz-load') {
    const [bank, winners] = await Promise.all([getBank(), getWinners()])
    const entries = await getEntries(weekKey())
    return res.status(200).json({ ok: true, bank, winners, week: weekKey(), entryCount: entries.length })
  }

  if (action === 'quiz-save') {
    if (!storage.ok) return res.status(503).json({ error: 'Storage not connected.' })
    const bank = sanitiseBank(body.bank)
    const saved = await saveBank(bank)
    if (!saved) return res.status(503).json({ error: 'Could not save questions.' })
    return res.status(200).json({ ok: true, bank })
  }

  if (action === 'quiz-generate') {
    if (!storage.ok) return res.status(503).json({ error: 'Storage not connected.' })
    const count = Number(body.count) || 5
    const { questions, error } = await generateQuestions(count)
    if (error) return res.status(400).json({ error })
    const existing = await getBank()
    const merged = sanitiseBank([...existing, ...questions])
    await saveBank(merged)
    return res.status(200).json({ ok: true, bank: merged, added: questions.length })
  }

  if (action === 'quiz-entries') {
    const week = String(body.week ?? weekKey())
    const entries = await getEntries(week)
    const masked = entries.map((e) => ({ name: e.name, date: e.date }))
    return res.status(200).json({ ok: true, week, count: entries.length, entries: masked })
  }

  if (action === 'quiz-draw') {
    if (!storage.ok) return res.status(503).json({ error: 'Storage not connected.' })
    const week = String(body.week ?? weekKey())
    const winner = await drawWinner(week)
    if (!winner) return res.status(400).json({ error: 'No entries to draw from for this week yet.' })
    return res.status(200).json({ ok: true, winner })
  }

  if (action === 'quiz-thankyou') {
    const week = String(body.week ?? weekKey())
    const entries = await getEntries(week)
    if (entries.length === 0) {
      return res.status(400).json({ error: 'No participants this week yet.' })
    }
    const result = await sendThankYouToParticipants(week)
    return res.status(200).json({ ok: true, week, ...result })
  }

  return res.status(400).json({ error: 'Unknown action.' })
}

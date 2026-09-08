/**
 * Five Yes/No questions after attendance confirmation (Training Confirmation flow).
 * Prefer 5 questions from the session’s scheduled topics (question bank).
 */

import { findTopicQuestionBank } from './ojt-question-bank.js'

export type AttendanceYesNoQ = {
  id: string
  text: string
  answer: 'Yes' | 'No'
}

/** Default 5 Yes/No questions shown after guard confirms attendance. */
export const ATTENDANCE_YES_NO_QUESTIONS: AttendanceYesNoQ[] = [
  {
    id: 'yn1',
    text: 'Should a guard wear a valid ID card visibly while on duty?',
    answer: 'Yes',
  },
  {
    id: 'yn2',
    text: 'Is it correct to skip visitor / access process for a “known” person?',
    answer: 'No',
  },
  {
    id: 'yn3',
    text: 'Should incidents be reported early with clear facts?',
    answer: 'Yes',
  },
  {
    id: 'yn4',
    text: 'Is using mobile for social media / games allowed on duty?',
    answer: 'No',
  },
  {
    id: 'yn5',
    text: 'Should a suspicious bag be left untouched and reported as per SOP?',
    answer: 'Yes',
  },
]

export function publicAttendanceYesNoQuestions(): { id: string; text: string }[] {
  return ATTENDANCE_YES_NO_QUESTIONS.map((q) => ({ id: q.id, text: q.text }))
}

export function sessionTopicList(session: {
  topic1?: string
  topic2?: string
  topic3?: string
  topic4?: string
  topic5?: string
  topics?: string
}): string[] {
  const numbered = [session.topic1, session.topic2, session.topic3, session.topic4, session.topic5]
    .map((t) => String(t || '').trim().replace(/^\d+\.\s*/, ''))
    .filter(Boolean)
  if (numbered.length) return numbered
  return String(session.topics || '')
    .split(/\n|;/)
    .map((t) => t.trim().replace(/^\d+\.\s*/, ''))
    .filter(Boolean)
}

function topicSlug(topic: string, index: number): string {
  const s = String(topic || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 18)
  return s || `t${index}`
}

/** Five Yes/No from the session’s scheduled topics. Falls back to the generic five. */
export function pickSessionYesNoQuestions(session: {
  topic1?: string
  topic2?: string
  topic3?: string
  topic4?: string
  topic5?: string
  topics?: string
}): AttendanceYesNoQ[] {
  const topics = sessionTopicList(session)
  const banks = topics
    .map((topic, i) => {
      const bank = findTopicQuestionBank(topic)
      return bank ? { topic: bank.topic, questions: bank.questions, slug: topicSlug(bank.topic, i) } : null
    })
    .filter((b): b is NonNullable<typeof b> => Boolean(b))
  const out: AttendanceYesNoQ[] = []
  const seen = new Set<string>()
  let round = 0
  while (out.length < 5 && banks.length && round < 20) {
    for (const b of banks) {
      const q = b.questions[round]
      if (!q) continue
      const id = `${b.slug}-${q.id}`.slice(0, 40)
      if (seen.has(id)) continue
      seen.add(id)
      out.push({ id, text: q.text, answer: q.answer === 'No' ? 'No' : 'Yes' })
      if (out.length >= 5) break
    }
    round += 1
  }
  return out.length === 5 ? out : ATTENDANCE_YES_NO_QUESTIONS
}

export function publicSessionYesNoQuestions(session: {
  topic1?: string
  topic2?: string
  topic3?: string
  topic4?: string
  topic5?: string
  topics?: string
}): { id: string; text: string }[] {
  return pickSessionYesNoQuestions(session).map((q) => ({ id: q.id, text: q.text }))
}

export function scoreAttendanceYesNo(
  answers: { qId: string; choice: string }[],
  questions: AttendanceYesNoQ[] = ATTENDANCE_YES_NO_QUESTIONS,
): { score: number; maxScore: number } {
  const list = questions.length ? questions : ATTENDANCE_YES_NO_QUESTIONS
  const maxScore = list.length
  let score = 0
  for (const q of list) {
    const a = answers.find((x) => x.qId === q.id)
    const choice = String(a?.choice || '')
      .trim()
      .toLowerCase()
    const normalized =
      choice === 'yes' || choice === 'y' ? 'Yes' : choice === 'no' || choice === 'n' ? 'No' : ''
    if (normalized && normalized === q.answer) score += 1
  }
  return { score, maxScore }
}

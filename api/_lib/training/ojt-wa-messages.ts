/**
 * WhatsApp message formats — Training Confirmation & Attendance (Track 1 OJT).
 */

import { CHANNEL_URL } from '../pulse/config.js'
import { suiteAppFooterPlainText } from '../suite-app-footer.js'
import type { OjtSession } from './ojt-store.js'
import { trainingBrandWhatsAppHeader } from './training-brand.js'

function topicLines(session: OjtSession): string {
  const topics = String(session.topics || '')
    .split(/\n|;/)
    .map((t) => t.trim().replace(/^\d+\.\s*/, ''))
    .filter(Boolean)
  if (!topics.length) return '• As briefed by trainer'
  return topics.map((t) => `• ${t}`).join('\n')
}

/** 1. Training information to guards — schedule + EOI / Attendance reply. */
export function buildTrainingConfirmIntimationWa(session: OjtSession, confirmUrl: string): string {
  const link = String(confirmUrl || '').trim()
  const lines = [
    trainingBrandWhatsAppHeader('Training schedule Intimation'),
    '',
    `Client: ${session.clientName || 'Site'}`,
    `Site / Location: ${session.location || '—'}`,
    `Date: ${session.trainingDate || '—'}`,
    `Time: ${session.trainingTime || '—'}`,
    `Venue: ${session.location || '—'}`,
    `Trainer: ${session.trainerName || '—'}`,
    '',
    'Topics:',
    topicLines(session),
    '',
    'Please confirm:',
    '• If you are ON DUTY and will attend training — reply: EOI',
    '• If you are NOT attending duty (absent / leave / not on post) — reply with your expected date of joining in this EOI format:',
    '  EOI DOJ DD/MM/YYYY',
    '  Example: EOI DOJ 20/08/2026',
    '• On training day (those attending) — reply: ATTENDANCE',
  ]
  if (link) {
    lines.push('', 'Or open confirmation link:', link)
  }
  lines.push(
    '',
    'After ATTENDANCE: 5 Yes/No questions → marks → feedback.',
    '',
    'Follow Security News — Agile Group:',
    CHANNEL_URL,
    '',
    suiteAppFooterPlainText(),
  )
  return lines.join('\n')
}

/** Ack after guard replies EOI. */
export function buildEoiAckWa(opts: {
  guardName: string
  clientName: string
  trainingDate: string
  trainingTime: string
  joiningDate?: string
}): string {
  const doj = String(opts.joiningDate || '').trim()
  const lines = [
    trainingBrandWhatsAppHeader('EOI received'),
    '',
    `Dear ${opts.guardName || 'Guard'},`,
    '',
  ]
  if (doj) {
    lines.push(
      `Thank you. Your EOI is recorded with expected date of joining: ${doj}.`,
      'Training Manager will note this (absentee / join-back).',
    )
  } else {
    lines.push(
      'Thank you. Your EOI (Expression of Interest) is recorded — you will attend training.',
    )
  }
  lines.push(
    `Unit: ${opts.clientName || 'Site'}`,
    `Date: ${opts.trainingDate || '—'} · ${opts.trainingTime || '—'}`,
    '',
  )
  if (!doj) {
    lines.push(
      'On training day, reply with the word ATTENDANCE to mark attendance.',
      '(Reply only: ATTENDANCE)',
    )
  } else {
    lines.push(
      'If you return to duty before training day and will attend, reply EOI again (without DOJ), then ATTENDANCE on the day.',
    )
  }
  return lines.join('\n')
}

/** Parse EOI DOJ DD/MM/YYYY (or YYYY-MM-DD) from a WhatsApp reply. */
export function parseEoiJoiningDate(text: string): string {
  const raw = String(text || '').trim()
  const m =
    raw.match(/\bDOJ\s*[:\-]?\s*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})\b/i) ||
    raw.match(/\b(?:joining|join)\s*(?:date|on)?\s*[:\-]?\s*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})\b/i)
  return m ? String(m[1] || '').trim().slice(0, 20) : ''
}

/** Ack after ATTENDANCE reply + quiz link. */
export function buildAttendanceAckWa(
  opts: { guardName: string; clientName: string; trainingDate: string; trainingTime: string },
  quizUrl: string,
): string {
  return [
    trainingBrandWhatsAppHeader('Attendance confirmation'),
    '',
    `Dear ${opts.guardName || 'Guard'},`,
    '',
    'Attendance confirmation received ✓',
    `Unit: ${opts.clientName || 'Site'}`,
    `Date: ${opts.trainingDate || '—'} · ${opts.trainingTime || '—'}`,
    '',
    'Please answer 5 Yes/No questions from today’s topics.',
    'Reply YES or NO to each question I send.',
    '',
    'Or open the link and tap Yes / No:',
    quizUrl,
    '',
    'After submit you will see your marks. Thank you.',
  ].join('\n')
}

/** One topic Yes/No question (WhatsApp). */
export function buildTopicQuizQuestionWa(opts: {
  guardName: string
  index: number
  total: number
  text: string
  quizUrl?: string
}): string {
  const lines = [
    trainingBrandWhatsAppHeader('Training questions'),
    '',
    `Dear ${opts.guardName || 'Guard'},`,
    '',
    `Question ${opts.index} of ${opts.total}`,
    opts.text,
    '',
    'Reply YES or NO',
  ]
  if (opts.quizUrl) {
    lines.push('', 'Or open the link and tap Yes / No:', opts.quizUrl)
  }
  return lines.join('\n')
}

/** After EOI — ask those who responded to mark ATTENDANCE on training day. */
export function buildAttendanceRequestWa(session: OjtSession, confirmUrl: string): string {
  const link = String(confirmUrl || '').trim()
  const lines = [
    trainingBrandWhatsAppHeader('Attendance request'),
    '',
    `Dear Guard,`,
    '',
    'You earlier sent EOI for this training. Please confirm attendance now:',
    '',
    `Client: ${session.clientName || 'Site'}`,
    `Date: ${session.trainingDate || '—'} · ${session.trainingTime || '—'}`,
    `Venue: ${session.location || '—'}`,
    '',
    'Reply with the word: ATTENDANCE',
  ]
  if (link) {
    lines.push('', 'Or open confirmation link:', link)
  }
  lines.push('', suiteAppFooterPlainText())
  return lines.join('\n')
}

/** After attendance confirmed — open 5-question quiz (same link continues). */
export function buildAttendanceConfirmedWa(session: OjtSession, quizUrl: string): string {
  return [
    trainingBrandWhatsAppHeader('Attendance confirmation'),
    '',
    'Attendance confirmation received ✓',
    '',
    `Unit: ${session.clientName || 'Site'}`,
    `Date: ${session.trainingDate || '—'} · ${session.trainingTime || '—'}`,
    '',
    'Please answer 5 Yes/No questions from today’s topics.',
    'Reply YES or NO to each question I send.',
    '',
    'Or open the link and tap Yes / No:',
    quizUrl,
    '',
    'After submit you will see your marks. Thank you.',
  ].join('\n')
}

/** After quiz — marks + thank you + feedback link. */
export function buildMarksThankYouWa(opts: {
  guardName: string
  score: number
  maxScore: number
  feedbackUrl: string
}): string {
  return [
    trainingBrandWhatsAppHeader('Training marks'),
    '',
    `Dear ${opts.guardName || 'Guard'},`,
    '',
    `Thank you. Your marks: ${opts.score}/${opts.maxScore}`,
    '',
    'Please share short feedback on today’s training:',
    opts.feedbackUrl,
    '',
    'Follow Security News — Agile Group:',
    CHANNEL_URL,
  ].join('\n')
}

/** After feedback — thank you for attending + Security News channel. */
export function buildFeedbackThankYouWa(guardName: string): string {
  return [
    trainingBrandWhatsAppHeader('Thank you for attending'),
    '',
    `Dear ${guardName || 'Guard'},`,
    '',
    'Thank you for attending the Training session.',
    '',
    'Follow our WhatsApp channel — Security News · Agile Group:',
    CHANNEL_URL,
    '',
    suiteAppFooterPlainText(),
  ].join('\n')
}

export { CHANNEL_URL as SECURITY_NEWS_CHANNEL_URL }

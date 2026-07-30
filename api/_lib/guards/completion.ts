import type { GuardComplaint } from './store.js'

export const SLA_HOURS = 24
export const SLA_LABEL = '24 hours'

export function displayStatus(c: GuardComplaint): 'Under process' | 'Delayed Response' | 'Solved' {
  if (c.status === 'solved') return 'Solved'
  if (c.isDelayed) return 'Delayed Response'
  return 'Under process'
}

export function completionLetterSubject(code: string) {
  return `Update on your issue : Resolved ${code}`
}

export function completionLetterBody(c: GuardComplaint, assurance?: string, feedbackUrl?: string) {
  const issue = `${c.category} — ${c.subCategory}${c.complaintNote ? `: ${c.complaintNote}` : ''}`
  const assuranceLine =
    assurance?.trim() ||
    'We will make all necessary corrections to avoid such issues in future.'
  const feedbackBlock = feedbackUrl
    ? `\n\nPlease share your feedback about our service (1–5 stars):\n${feedbackUrl}\n`
    : ''
  return (
    `Hi ${c.guardName},\n\n` +
    `We hereby inform that the issue you recently raised regarding ${issue}.\n\n` +
    `${assuranceLine}\n\n` +
    `We are proud to be associated with you.\n\n` +
    `If you need any other support, or if your colleagues/friends have such issues — register as before.` +
    feedbackBlock +
    `\n\nThank you.\n\n` +
    `Regards,\nManagement\nAgile Group`
  )
}

export function completionLetterWhatsApp(c: GuardComplaint, assurance?: string, feedbackUrl?: string) {
  return `*${completionLetterSubject(c.code)}*\n\n${completionLetterBody(c, assurance, feedbackUrl)}`
}

export function hoursSince(iso: string): number {
  if (!iso) return 0
  return Math.max(0, Math.round(((Date.now() - new Date(iso).getTime()) / 3600000) * 10) / 10)
}

export function stageClocks(c: GuardComplaint) {
  const now = new Date().toISOString()
  const end = c.solvedAt || now
  return {
    hodWaitHrs: c.assignedAt ? hoursBetween(c.registeredAt, c.assignedAt) : hoursSince(c.registeredAt),
    opsHrs: c.assignedAt
      ? hoursBetween(c.assignedAt, c.opsCompletedAt || end)
      : 0,
    deptHrs: c.deptCompletedAt
      ? hoursBetween(c.opsCompletedAt || c.assignedAt || c.registeredAt, c.deptCompletedAt)
      : c.assignedAt
        ? hoursBetween(c.opsCompletedAt || c.assignedAt, end)
        : 0,
    totalHrs: hoursBetween(c.registeredAt, end),
    slaRemainingHrs: Math.max(
      0,
      Math.round(((new Date(c.slaDeadline).getTime() - Date.now()) / 3600000) * 10) / 10,
    ),
  }
}

function hoursBetween(a: string, b: string): number {
  if (!a || !b) return 0
  return Math.max(0, Math.round(((new Date(b).getTime() - new Date(a).getTime()) / 3600000) * 10) / 10)
}

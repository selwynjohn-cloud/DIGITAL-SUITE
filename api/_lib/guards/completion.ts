import { guardsGoogleReviewUrl } from './brand.js'
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

export function completionLetterBody(
  c: GuardComplaint,
  assurance?: string,
  feedbackUrl?: string,
  googleReviewUrl?: string,
) {
  const issue = `${c.category} — ${c.subCategory}${c.complaintNote ? `: ${c.complaintNote}` : ''}`
  const assuranceLine =
    assurance?.trim() ||
    'We will make all necessary corrections to avoid such issues in future.'
  const feedbackBlock = feedbackUrl
    ? `\n\nPlease share your feedback about our service (1–5 stars):\n${feedbackUrl}\n`
    : ''
  const reviewBlock = googleReviewUrl
    ? `\nIf you are satisfied, you may optionally leave a Google review (not compulsory):\n${googleReviewUrl}\n`
    : ''
  return (
    `Hi ${c.guardName},\n\n` +
    `We hereby inform that the issue you recently raised regarding ${issue}.\n\n` +
    `${assuranceLine}\n\n` +
    `We are proud to be associated with you.\n\n` +
    `If you need any other support, or if your colleagues/friends have such issues — register as before.` +
    feedbackBlock +
    reviewBlock +
    `\n\nThank you.\n\n` +
    `Regards,\nManagement\nAgile Group`
  )
}

export function completionLetterWhatsApp(
  c: GuardComplaint,
  assurance?: string,
  feedbackUrl?: string,
  googleReviewUrl?: string,
) {
  return `*${completionLetterSubject(c.code)}*\n\n${completionLetterBody(c, assurance, feedbackUrl, googleReviewUrl)}`
}

function escLetter(s: unknown) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** On-screen letter — same words as WhatsApp / email. Does not send. */
export function completionLetterPreviewHtml(c: GuardComplaint, assurance?: string) {
  const fbUrl = `https://www.agilegroup-digital.co.in/guards/feedback?code=${encodeURIComponent(c.code)}`
  const reviewUrl = guardsGoogleReviewUrl()
  const subject = completionLetterSubject(c.code)
  const body = completionLetterBody(c, assurance || c.assuranceNote, fbUrl, reviewUrl)
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escLetter(subject)}</title>
<style>
body{margin:0;background:#0b1220;color:#0f172a;font-family:'Segoe UI',Arial,sans-serif}
.wrap{max-width:720px;margin:24px auto;padding:0 16px 40px}
.card{background:#fff;border-radius:12px;padding:28px 26px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
.hdr{text-align:center;margin-bottom:18px}
.hdr img{height:52px;background:transparent}
.hdr p{margin:8px 0 0;color:#64748b;font-size:13px}
h1{font-size:18px;color:#1e3a8a;margin:0 0 16px}
pre{white-space:pre-wrap;font-family:'Segoe UI',Arial,sans-serif;font-size:15px;line-height:1.55;margin:0}
.note{margin-top:16px;color:#64748b;font-size:13px}
</style></head><body>
<div class="wrap"><div class="card">
<div class="hdr"><img src="https://www.agilegroup-digital.co.in/agile-logo-clear.png" alt="Agile Group"><p>Preview — this letter is not sent yet</p></div>
<h1>${escLetter(subject)}</h1>
<pre>${escLetter(body)}</pre>
<p class="note">If this looks correct, close this window and tap <b>WhatsApp</b> or <b>Email</b>.</p>
</div></div>
</body></html>`
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

/** Longest stage — where the complaint is held up. */
export function delayHeldUpAt(c: GuardComplaint): string {
  const clk = stageClocks(c)
  const stages = [
    { n: 'HOD / RM', h: clk.hodWaitHrs },
    { n: 'Operations', h: clk.opsHrs },
    { n: 'Department', h: clk.deptHrs },
  ].sort((a, b) => b.h - a.h)
  return stages[0]?.h > 0 ? stages[0].n : 'Awaiting assignment'
}

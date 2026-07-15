import { normaliseEmail, withoutNoMailRecipients } from './auth.js'
import type { Resend } from 'resend'
import { getUsers as getFleetUsers } from './fleet/store.js'
import { getUsers as getMisUsers } from './mis/store.js'

/** Director inbox — CC on every mail from agilegroup-digital.co.in apps. */
export function suiteDirectorEmail(): string {
  return (
    process.env.MIS_DIRECTOR_EMAIL?.trim() ||
    process.env.FLEET_DIRECTOR_EMAIL?.trim() ||
    process.env.DIRECTOR_ALERT_EMAIL?.trim() ||
    pinMailReplyTo() ||
    'director@agilegroup.co.in'
  )
    .trim()
    .toLowerCase()
}

function emailList(v: string | string[] | undefined): string[] {
  if (!v) return []
  const arr = Array.isArray(v) ? v : [v]
  return arr.map((e) => String(e).trim().toLowerCase()).filter((e) => e.includes('@'))
}

/** Merge Director into CC unless already in To or CC. */
export function mergeDirectorCc(
  to: string | string[],
  cc?: string | string[],
  opts?: { skip?: boolean },
): string[] {
  if (opts?.skip) return withoutNoMailRecipients(emailList(cc))
  const toSet = new Set(emailList(to))
  const ccList = withoutNoMailRecipients(emailList(cc))
  const director = suiteDirectorEmail()
  if (!director.includes('@') || toSet.has(director)) return ccList
  if (ccList.includes(director)) return ccList
  return withoutNoMailRecipients([...ccList, director])
}

export type SuiteEmailPayload = {
  from: string
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string | string[]
  /** Director CC is on by default for all suite applications. */
  skipDirectorCc?: boolean
}

/** Send mail via Resend — always CC Director (visible) unless Director is already in To. */
export async function sendSuiteEmail(resend: Resend, payload: SuiteEmailPayload) {
  const { skipDirectorCc, to, cc, bcc, ...rest } = payload
  const director = suiteDirectorEmail()
  const ccMerged = mergeDirectorCc(to, cc, { skip: skipDirectorCc })
  const bccList = withoutNoMailRecipients(emailList(bcc).filter((e) => e !== director))
  return resend.emails.send({
    ...rest,
    to,
    cc: ccMerged.length ? ccMerged : undefined,
    bcc: bccList.length ? bccList : undefined,
  })
}

/** Verified Resend sender (must be a domain/address Resend accepts). */
export function pinMailFrom(): string {
  return (
    process.env.PIN_EMAIL_FROM?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    'Agile Security Force <onboarding@resend.dev>'
  )
}

/** Replies go to Director — even when send uses noreply@ or Resend default. */
export function pinMailReplyTo(): string {
  return process.env.PIN_REPLY_TO?.trim() || 'director@agilegroup.co.in'
}

/** Inbox that receives PIN-request copies — use plus-address for easy Gmail filtering. */
export function pinRequestInbox(): string {
  return (
    process.env.PIN_REQUEST_INBOX?.trim().toLowerCase() ||
    'director+pinrequest@agilegroup.co.in'
  )
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] || 'User'
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/** Registered display name from User Management — never the raw email in subject lines. */
export async function resolveSuiteUserName(email: string): Promise<string> {
  const em = normaliseEmail(email)
  try {
    const [mis, fleet] = await Promise.all([getMisUsers(), getFleetUsers()])
    for (const u of [...mis, ...fleet]) {
      const uem = String((u as { email?: string }).email ?? '')
        .trim()
        .toLowerCase()
      const uname = String((u as { name?: string }).name ?? '').trim()
      if (uem === em && uname) return uname
    }
  } catch {
    /* storage optional */
  }
  if (em === 'director@agilegroup.co.in') return 'Selwyn John'
  if (em === 'md@agilegroup.co.in') return 'Managing Director'
  return nameFromEmail(em)
}

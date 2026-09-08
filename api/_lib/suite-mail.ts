import { normaliseEmail, withoutNoMailRecipients } from './auth.js'
import type { Resend } from 'resend'
import { getUsers as getFleetUsers } from './fleet/store.js'
import { getUsers as getMisUsers } from './mis/store.js'

/** IT must never receive copies of suite activity (mail / alerts). */
export function itBlockedEmails(): Set<string> {
  const fromEnv = (process.env.IT_SUITE_EMAILS ?? process.env.IT_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return new Set(['it@agilegroup.co.in', ...fromEnv])
}

export function isItBlockedEmail(email: string): boolean {
  return itBlockedEmails().has(normaliseEmail(email))
}

function withoutItEmails(emails: string[]): string[] {
  const blocked = itBlockedEmails()
  return emails.filter((e) => !blocked.has(e.trim().toLowerCase()))
}

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

export type SuiteEmailAttachment = {
  filename: string
  content: string
  contentType?: string
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
  attachments?: SuiteEmailAttachment[]
  /** Director CC is on by default for all suite applications. */
  skipDirectorCc?: boolean
  /**
   * Only for IT's own login PIN mail (so IT can open apps).
   * Never used for copies of other people's activity.
   */
  allowItOwnMail?: boolean
}

/** Send mail via Resend — always CC Director (visible) unless Director is already in To. */
export async function sendSuiteEmail(resend: Resend, payload: SuiteEmailPayload) {
  const { skipDirectorCc, allowItOwnMail: _allowItOwnMail, to, cc, bcc, ...rest } = payload
  const director = suiteDirectorEmail()
  // Never To / CC / BCC it@ — Prabhakar left the company.
  const ccMerged = withoutItEmails(mergeDirectorCc(to, cc, { skip: skipDirectorCc }))
  const bccList = withoutItEmails(
    withoutNoMailRecipients(emailList(bcc).filter((e) => e !== director)),
  )
  const toList = withoutItEmails(withoutNoMailRecipients(emailList(to)))
  if (!toList.length) {
    return {
      data: null,
      error: { message: 'No valid recipients after IT monitoring block.', name: 'it_blocked' },
    }
  }
  const sendOnce = () =>
    resend.emails.send({
      ...rest,
      to: toList.length === 1 ? toList[0] : toList,
      cc: ccMerged.length ? ccMerged : undefined,
      bcc: bccList.length ? bccList : undefined,
    } as Parameters<typeof resend.emails.send>[0])
  const first = await sendOnce()
  if (!first.error) return first
  const name = String(first.error.name || '')
  if (name === 'it_blocked') return first
  // One retry if the first Resend call fails (timeout / brief outage).
  await new Promise((resolve) => setTimeout(resolve, 1600))
  return sendOnce()
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

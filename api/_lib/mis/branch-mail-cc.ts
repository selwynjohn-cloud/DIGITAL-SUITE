/**
 * Branch / management mail CC — Director only (President left; do not copy Lokesh).
 */
import { withoutNoMailRecipients } from '../auth.js'
import { suiteDirectorEmail } from '../suite-mail.js'
import type { MisBranch } from './store.js'

/** President left the organisation — do not mail this address. */
export const LOKESH_CC_EMAIL = ''

/** Hi-Tech / Telangana — CC on consolidated Daily MIS Dashboard. */
export const SRIDHAR_M_CC_EMAIL = 'sridhar.m@agilegroup.co.in'

export const MIS_IT_CC_EMAIL = 'it@agilegroup.co.in'

/** Visible CC on MIS mail — always the company director inbox. */
export const MIS_DIRECTOR_CC_EMAIL = 'director@agilegroup.co.in'

/** Central Control Centre inbox — CC on Training morning report and observation chase. */
export const CONTROL_EMAIL = 'control@agilegroup.co.in'

export function misDirectorCcEmail(): string {
  return MIS_DIRECTOR_CC_EMAIL
}

/** Gmail inbox copy for Director (BCC/CC from bulk sender often hidden in Gmail). */
export function misSelwynGmailCopy(): string {
  return (process.env.ADMIN_NOTIFY_EMAIL?.trim() || 'selwyn.john@gmail.com').toLowerCase()
}

function toEmailSet(to: string | string[]): Set<string> {
  const arr = Array.isArray(to) ? to : [to]
  return new Set(arr.map((e) => e.trim().toLowerCase()).filter((e) => e.includes('@')))
}

/**
 * Standard management CC — Director@ (excludes addresses already in To).
 * IT is never copied — Director-only monitoring; IT may still open apps to view.
 */
export function misManagementCcEmails(
  to: string | string[],
  opts?: {
    includeDirector?: boolean
    includeLokesh?: boolean
    /** Ignored — IT must not receive suite activity copies. */
    includeIt?: boolean
  },
): string[] {
  const toSet = toEmailSet(to)
  const cc = new Set<string>()
  const add = (e: string) => {
    const x = e.trim().toLowerCase()
    if (x.includes('@') && !toSet.has(x) && x !== MIS_IT_CC_EMAIL) cc.add(x)
  }
  if (opts?.includeDirector !== false) add(misDirectorCcEmail())
  return withoutNoMailRecipients([...cc])
}

export function misDirectorEmail(): string {
  return suiteDirectorEmail()
}

export function misBranchCcLokesh(_branchName: string): boolean {
  return false
}

export function misBranchCcLokeshById(branchId: string, branches: MisBranch[]): boolean {
  const b = branches.find((x) => x.id === branchId)
  return b ? misBranchCcLokesh(b.name) : false
}

/** Director@ on all branch reminders. IT not copied. */
export function misBranchDirectorCc(
  branchName: string,
  to: string[],
  opts?: { includeDirector?: boolean },
): string[] {
  return misManagementCcEmails(to, {
    includeDirector: opts?.includeDirector !== false,
    includeLokesh: misBranchCcLokesh(branchName),
    includeIt: false,
  })
}

/**
 * Branch-specific mail CC — Lokesh copied with Director for listed zones only.
 */
import { withoutNoMailRecipients } from '../auth.js'
import { suiteDirectorEmail } from '../suite-mail.js'
import type { MisBranch } from './store.js'

export const LOKESH_CC_EMAIL = (
  process.env.MIS_CONSOLIDATED_TO?.trim() || 'lokesh@agilegroup.co.in'
).toLowerCase()

/** Mumbai, Surat, Ahmedabad, Lucknow, Bhopal, New Delhi, Vizag, Kakinada, Vijayawada, Nellore, Tirupati. */
const LOKESH_CC_PATTERNS = [
  /\bmumbai\b/i,
  /\bsurat\b/i,
  /\bahmedabad\b/i,
  /\blucknow\b/i,
  /\bbhopal\b/i,
  /\bnew\s*delhi\b/i,
  /\bnewdelhi\b/i,
  /\bdelhi\b/i,
  /\bvisakhapatnam\b/i,
  /\bvizag\b/i,
  /\bkakinada\b/i,
  /\bvijayawada\b/i,
  /\bnellore\b/i,
  /\btirupati\b/i,
  /\btadipatri\b/i,
]

export function misDirectorEmail(): string {
  return suiteDirectorEmail()
}

export function misBranchCcLokesh(branchName: string): boolean {
  const n = String(branchName ?? '').trim()
  if (!n) return false
  return LOKESH_CC_PATTERNS.some((re) => re.test(n))
}

export function misBranchCcLokeshById(branchId: string, branches: MisBranch[]): boolean {
  const b = branches.find((x) => x.id === branchId)
  return b ? misBranchCcLokesh(b.name) : false
}

/** Director on all branch reminders/reports; Lokesh only for listed branches. */
export function misBranchDirectorCc(
  branchName: string,
  to: string[],
  opts?: { includeDirector?: boolean },
): string[] {
  const includeDirector = opts?.includeDirector !== false
  const director = misDirectorEmail()
  const toSet = new Set(to.map((e) => e.trim().toLowerCase()))
  const cc = new Set<string>()
  if (includeDirector && director.includes('@') && !toSet.has(director)) cc.add(director)
  if (misBranchCcLokesh(branchName)) {
    const lokesh = LOKESH_CC_EMAIL
    if (lokesh.includes('@') && !toSet.has(lokesh)) cc.add(lokesh)
  }
  return withoutNoMailRecipients([...cc])
}

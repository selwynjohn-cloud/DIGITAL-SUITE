/**
 * Weekly auto-mail: Branch Security Observation reports still open (not shared / closed).
 * To = Branch HOD · CC = Training, Lokesh, Director.
 * Reminder only — does not mark observations as shared.
 */

import { getBranches, getUsers } from '../mis/store.js'
import { buildSecurityObsList, type OjtSecObsRow } from './ojt-dashboard.js'
import { sendOjtSecObsWeeklyDigestMail } from './ojt-mail.js'
import { loadMonthSessions, loadOjtReport } from './ojt-store.js'
import { isTrainingDepartmentBranch } from './ojt-training-dept.js'

function istParts(d = new Date()): { y: number; m: number; day: number; dow: number; ymd: string } {
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60000
  const ist = new Date(utcMs + (5 * 60 + 30) * 60000)
  const z = (n: number) => (n < 10 ? `0${n}` : String(n))
  return {
    y: ist.getFullYear(),
    m: ist.getMonth() + 1,
    day: ist.getDate(),
    dow: ist.getDay(),
    ymd: `${ist.getFullYear()}-${z(ist.getMonth() + 1)}-${z(ist.getDate())}`,
  }
}

export function isSaturdayIst(d = new Date()): boolean {
  return istParts(d).dow === 6
}

function addDaysYmd(ymd: string, delta: number): string {
  const [y, m, day] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, day))
  dt.setUTCDate(dt.getUTCDate() + delta)
  const z = (n: number) => (n < 10 ? `0${n}` : String(n))
  return `${dt.getUTCFullYear()}-${z(dt.getUTCMonth() + 1)}-${z(dt.getUTCDate())}`
}

async function suggestBranchHeadEmail(branchId: string): Promise<string> {
  const users = await getUsers()
  const bid = String(branchId ?? '').trim()
  const match = users.find((u) => {
    if (u.active === false) return false
    if (String(u.branchId ?? '').trim() !== bid) return false
    const role = String(u.role ?? '').toLowerCase()
    return /branch manager|hod|operations manager|rm|regional/.test(role)
  })
  return match?.email ? String(match.email).trim().toLowerCase() : ''
}

export type SecObsWeeklyRow = OjtSecObsRow & {
  formSaved: boolean
  hodEmail: string
}

export async function runOjtSecObsWeeklyMails(opts?: {
  sampleOnly?: boolean
  force?: boolean
}): Promise<{
  ok: boolean
  skipped?: boolean
  reason?: string
  today: string
  from: string
  to: string
  branchesChecked: number
  branchesMailed: number
  openRows: number
  errors: string[]
}> {
  const today = istParts().ymd
  if (!opts?.force && !opts?.sampleOnly && !isSaturdayIst()) {
    return {
      ok: true,
      skipped: true,
      reason: 'Runs on Saturday IST only.',
      today,
      from: '',
      to: '',
      branchesChecked: 0,
      branchesMailed: 0,
      openRows: 0,
      errors: [],
    }
  }

  /** Look back 90 days for open (not shared) observation reports. */
  const from = addDaysYmd(today, -90)
  const to = today
  const branches = (await getBranches(true)).filter(
    (b) => !isTrainingDepartmentBranch(b) && !/corporate\s*office|training\s*academy/i.test(b.name),
  )

  let branchesChecked = 0
  let branchesMailed = 0
  let openRows = 0
  const errors: string[] = []

  for (const b of branches) {
    branchesChecked++
    const list = await buildSecurityObsList(b.id, b.name, from, to, today)
    const open = list.filter((r) => r.completed === 'No' && String(r.trainingDate || '') <= today)
    if (!open.length) continue
    openRows += open.length

    let hod = await suggestBranchHeadEmail(b.id)
    if (!hod.includes('@')) {
      const monthSessions = await loadMonthSessions(b.id, today.slice(0, 7))
      const fromSession = monthSessions.find((s) => String(s.branchHeadEmail || '').includes('@'))
      hod = String(fromSession?.branchHeadEmail || '')
        .trim()
        .toLowerCase()
    }

    if (!hod.includes('@') && !opts?.sampleOnly) {
      errors.push(`${b.name}: no Branch HOD email — skipped ${open.length} open observation(s)`)
      continue
    }

    const enriched: SecObsWeeklyRow[] = []
    for (const row of open) {
      const report = await loadOjtReport(row.sessionId)
      enriched.push({
        ...row,
        formSaved: Boolean(report?.securityObsSavedAt),
        hodEmail: hod,
      })
    }

    const mailed = await sendOjtSecObsWeeklyDigestMail({
      branchName: b.name,
      hodEmail: hod,
      fromYmd: from,
      toYmd: to,
      rows: enriched,
      sampleOnly: opts?.sampleOnly,
    })
    if (!mailed.ok) {
      errors.push(`${b.name}: ${mailed.error || 'mail failed'}`)
      continue
    }
    branchesMailed++
  }

  return {
    ok: true,
    today,
    from,
    to,
    branchesChecked,
    branchesMailed,
    openRows,
    errors,
  }
}

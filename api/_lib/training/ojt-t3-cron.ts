/**
 * Auto-send OJT advance notices when training is exactly 3 days ahead.
 */

import { getBranches, getUsers } from '../mis/store.js'
import { sendOjtAdvanceMail } from './ojt-mail.js'
import {
  daysUntilTraining,
  loadMonthSessions,
  monthOf,
  ojtClientEmailsFromSession,
  upsertSession,
  type OjtSession,
} from './ojt-store.js'

function todayYmdIst(): string {
  const utcMs = Date.now() + new Date().getTimezoneOffset() * 60000
  const ist = new Date(utcMs + (5 * 60 + 30) * 60000)
  const z = (n: number) => (n < 10 ? `0${n}` : String(n))
  return `${ist.getFullYear()}-${z(ist.getMonth() + 1)}-${z(ist.getDate())}`
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
  return match?.email ? String(match.email) : ''
}

export async function runOjtT3AdvanceMails(): Promise<{
  checked: number
  sent: number
  skipped: number
  errors: string[]
}> {
  const today = todayYmdIst()
  const month = monthOf(today)
  const branches = await getBranches(true)
  let checked = 0
  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const b of branches) {
    const list = await loadMonthSessions(b.id, month)
    for (const s of list) {
      checked++
      if (s.status !== 'Scheduled' || s.notifySentAt) {
        skipped++
        continue
      }
      const days = daysUntilTraining(s.trainingDate, today)
      if (days !== 3) {
        skipped++
        continue
      }
      if (!ojtClientEmailsFromSession(s).length) {
        errors.push(`${b.name}: ${s.clientName || s.id} — missing client email`)
        continue
      }
      const row: OjtSession = { ...s }
      if (!row.branchHeadEmail) row.branchHeadEmail = await suggestBranchHeadEmail(row.branchId)
      const mailed = await sendOjtAdvanceMail(row)
      if (!mailed.ok) {
        errors.push(`${b.name}: ${s.clientName || s.id} — ${mailed.error || 'mail failed'}`)
        continue
      }
      row.notifySentAt = new Date().toISOString()
      row.notifySentBy = 'cron:t3'
      row.notifyMessageId = mailed.messageId || ''
      row.status = 'ClientNotified'
      await upsertSession(row)
      sent++
    }
  }

  return { checked, sent, skipped, errors }
}

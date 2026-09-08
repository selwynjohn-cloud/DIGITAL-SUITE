/**
 * FA Banking Safety — WhatsApp to the Facility Attendant and Branch HOD.
 */

import { guardsSendWhatsAppPing } from '../guards/whatsapp-send.js'
import { isHodUser } from '../mis/digest.js'
import { getBranches, getUsers } from '../mis/store.js'
import { faDigitsMobile, type FaAck } from './fa-store.js'
import { trainingBrandWhatsAppHeader } from './training-brand.js'

function uniqueMobiles(list: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of list) {
    const m = faDigitsMobile(raw)
    if (m.length !== 10 || seen.has(m)) continue
    seen.add(m)
    out.push(m)
  }
  return out
}

export async function hodMobilesForBranch(branchId: string): Promise<string[]> {
  const [users, branches] = await Promise.all([getUsers(), getBranches()])
  const hods = users.filter((u) => {
    if (!isHodUser(u)) return false
    const ub = String(u.branchId || '').trim()
    if (!ub) return false
    if (ub === branchId) return true
    const br = branches.find((b) => b.id === branchId)
    return br && (ub === br.id || ub.toLowerCase() === String(br.name || '').toLowerCase())
  })
  return uniqueMobiles(hods.map((u) => String(u.phone || '')))
}

export function faAckWhatsAppText(rec: FaAck, forHod: boolean): string {
  const head = trainingBrandWhatsAppHeader('FA Banking Safety — completed')
  const lines = [
    head,
    '',
    forHod
      ? `${rec.name} (${rec.employeeId}) completed Facility Attendant Banking Safety.`
      : `${rec.name}, you have completed Facility Attendant Banking Safety.`,
    `Certificate: ${rec.code}`,
    `Agile Branch: ${rec.branchName}`,
    `HDFC Bank · ${rec.submittedAt}`,
    '',
    'Rules accepted:',
    '1. Do not do bank work for staff.',
    '2. Do not let anyone use your bank account.',
    '3. Report any such request to your HOD at once.',
    '',
    'Do not be a victim of crime.',
  ]
  return lines.join('\n')
}

export async function sendFaAckWhatsApp(rec: FaAck): Promise<{ ok: boolean; sent: number }> {
  const hods = await hodMobilesForBranch(rec.branchId)
  const targets: Array<{ mobile: string; hod: boolean }> = []
  const fa = faDigitsMobile(rec.mobile)
  if (fa.length === 10) targets.push({ mobile: fa, hod: false })
  for (const m of hods) {
    if (m !== fa) targets.push({ mobile: m, hod: true })
  }
  let sent = 0
  for (const t of targets) {
    const r = await guardsSendWhatsAppPing(t.mobile, faAckWhatsAppText(rec, t.hod))
    if (r.ok) sent += 1
  }
  return { ok: sent > 0, sent }
}

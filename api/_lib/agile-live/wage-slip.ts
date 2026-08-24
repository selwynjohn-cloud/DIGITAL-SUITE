/** Agile Live — simple wage slip for the phone (does not copy Recruitment). */

import { getBranchWages } from '../recruitment/wage-store.js'
import type { OpsGuard } from '../ops-mobile/store.js'
import { liveRoomKey } from './branches.js'
import { liveRankLabel } from './weekly-roster.js'

export async function liveWageSlip(opts: {
  person: OpsGuard
  month: string
  dutyDays: number
}) {
  const rank = liveRankLabel({
    designation: opts.person.designation,
    clientSite: opts.person.clientSite,
  })
  const wages = await getBranchWages()
  const brKey = liveRoomKey(opts.person.branch)
  const brName = String(opts.person.branch || '').toLowerCase()
  const hit = wages.find((w) => {
    if (w.branchId && liveRoomKey(w.branchId) === brKey) return true
    if (w.city && liveRoomKey(w.city) === brKey) return true
    const city = String(w.city || '').toLowerCase()
    const first = brName.split(/[\s-]/)[0] || ''
    return Boolean(city && first && (brName.includes(city) || city.includes(first)))
  })
  return {
    title: 'Wage Slip',
    name: opts.person.name,
    idNo: opts.person.idNo,
    month: opts.month,
    site: opts.person.clientSite,
    rank,
    dutyDays: opts.dutyDays,
    amount: hit?.wageAmount || 0,
    note: hit
      ? `₹${hit.wageAmount.toLocaleString('en-IN')} · ${hit.designation || rank}`
      : 'Amount shows when the branch wage is uploaded. Duty days are from Agile Live.',
  }
}

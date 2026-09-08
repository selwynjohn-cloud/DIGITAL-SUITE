/**
 * Shadow Compare Board — Ops vs MIS daily strength (never writes to MIS).
 */

import { getReportsForDate, type MisBranch, type MisReport } from '../mis/store.js'
import { getExceptions, getFills, getPosts, punchesForDate, rosterForDate, saveShadowDays, getShadowDays } from './store.js'
import type { OpsShadowDay } from './types.js'

function sumMis(report: MisReport) {
  let sanctioned = 0
  let deployed = 0
  let absent = 0
  let ot = 0
  for (const r of report.rows || []) {
    sanctioned += (r.sanA || 0) + (r.sanG || 0) + (r.sanB || 0) + (r.sanC || 0)
    deployed += (r.depA || 0) + (r.depG || 0) + (r.depB || 0) + (r.depC || 0)
    absent += (r.absA || 0) + (r.absG || 0) + (r.absB || 0) + (r.absC || 0)
    ot += (r.otA || 0) + (r.otG || 0) + (r.otB || 0) + (r.otC || 0)
  }
  const vacant = Math.max(0, sanctioned - deployed)
  const late = Number(report.summary?.lateStartCases || 0) || 0
  const outOfPost = Number(report.summary?.outOfPostCases || 0) || 0
  return { sanctioned, deployed, absent, vacant, ot, late, outOfPost }
}

export async function computeShadowForDate(
  date: string,
  branches: MisBranch[],
): Promise<OpsShadowDay[]> {
  const reports = await getReportsForDate(date, branches)
  const byBranch = new Map(reports.map((r) => [r.branchId, r]))
  const posts = await getPosts()
  const fills = (await getFills()).filter((f) => f.date === date)
  const exceptions = (await getExceptions()).filter((e) => e.date === date)
  const out: OpsShadowDay[] = []

  for (const b of branches) {
    const mis = byBranch.get(b.id)
    const misTotals = mis
      ? sumMis(mis)
      : { sanctioned: 0, deployed: 0, absent: 0, vacant: 0, ot: 0, late: 0, outOfPost: 0 }

    const punches = await punchesForDate(date, b.id)
    const roster = await rosterForDate(date, b.id)
    const dutyRoster = roster.filter((r) => !r.isWOff)
    const present = punches.filter((p) => p.status === 'present' || p.status === 'late').length
    const absent = punches.filter((p) => p.status === 'absent').length
    const late = punches.filter((p) => p.status === 'late').length +
      exceptions.filter((e) => e.branchId === b.id && e.kind === 'late_start').length
    const outOfPost = exceptions.filter((e) => e.branchId === b.id && e.kind === 'out_of_post').length

    const branchPosts = posts.filter((p) => p.branchId === b.id && p.active !== false)
    let sanctionedOps = 0
    for (const p of branchPosts) sanctionedOps += p.sanA + p.sanG + p.sanB + p.sanC
    if (!sanctionedOps && dutyRoster.length) sanctionedOps = dutyRoster.length

    const vacantOps = Math.max(0, (sanctionedOps || misTotals.sanctioned) - present - fills.filter((f) => f.branchId === b.id).length)

    const mismatches: string[] = []
    if (mis && Math.abs(misTotals.deployed - present) > 2) {
      mismatches.push(`Deployed MIS ${misTotals.deployed} vs Ops present ${present}`)
    }
    if (mis && Math.abs(misTotals.absent - absent) > 2) {
      mismatches.push(`Absent MIS ${misTotals.absent} vs Ops ${absent}`)
    }
    if (mis && Math.abs(misTotals.vacant - vacantOps) > 2) {
      mismatches.push(`Vacant MIS ${misTotals.vacant} vs Ops ${vacantOps}`)
    }
    if (mis && Math.abs(misTotals.late - late) > 1) {
      mismatches.push(`Late MIS ${misTotals.late} vs Ops ${late}`)
    }
    if (mis && Math.abs(misTotals.outOfPost - outOfPost) > 1) {
      mismatches.push(`Out-of-post MIS ${misTotals.outOfPost} vs Ops ${outOfPost}`)
    }
    if (!mis) mismatches.push('No MIS report for this branch/date (Ops-only shadow)')

    out.push({
      date,
      branchId: b.id,
      branchName: b.name,
      misSanctioned: misTotals.sanctioned,
      misDeployed: misTotals.deployed,
      misAbsent: misTotals.absent,
      misVacant: misTotals.vacant,
      misOt: misTotals.ot,
      misLate: misTotals.late,
      misOutOfPost: misTotals.outOfPost,
      opsPresent: present,
      opsAbsent: absent,
      opsVacant: vacantOps,
      opsLate: late,
      opsOutOfPost: outOfPost,
      match: mismatches.length === 0 || (mismatches.length === 1 && mismatches[0].startsWith('No MIS')),
      mismatches,
      computedAt: new Date().toISOString(),
    })
  }

  const prev = await getShadowDays()
  const kept = prev.filter((d) => d.date !== date)
  await saveShadowDays([...kept, ...out].slice(-2000))
  return out
}

export function shadowGreenStreak(days: OpsShadowDay[], branchId?: string): number {
  const filtered = days
    .filter((d) => (!branchId || d.branchId === branchId) && d.match)
    .map((d) => d.date)
  const uniq = [...new Set(filtered)].sort().reverse()
  let streak = 0
  let cursor = ''
  for (const iso of uniq) {
    if (!cursor) {
      cursor = iso
      streak = 1
      continue
    }
    const prev = new Date(`${cursor}T12:00:00`)
    prev.setDate(prev.getDate() - 1)
    const expect = prev.toISOString().slice(0, 10)
    if (iso === expect) {
      streak++
      cursor = iso
    } else break
  }
  return streak
}

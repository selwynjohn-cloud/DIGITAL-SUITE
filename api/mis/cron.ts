import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  sendMisDirectorDigest,
  sendMisHodReminders,
  sendMisSubmissionReminders,
  sendMisDirectorPendingReminder,
  sendMisAckTestToDirector,
  sendMisConsolidatedDailyAck,
  sendMisAckForAllSubmissionsToday,
  sendMisLateConsolidatedAck,
  sendMissingMisAcksForDate,
  sendManusClosedTeamNotice,
} from '../_lib/mis/digest.js'
import { istNow, misTodayIst, misYesterdayIst, isSubmittedTodayIst } from '../_lib/mis/dates.js'
import { computeDeploymentTotals } from '../_lib/mis/digest.js'
import { getReportsForDate } from '../_lib/mis/store.js'
import { syncMobileVisits } from '../_lib/mis/mobile-visits.js'
import { ensureTelanganaHodUsers } from '../_lib/mis/hod-directory.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const now = istNow()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const manual = String(req.query.job ?? '')
  const date = misTodayIst()
  const remindersOff = process.env.MIS_HOD_REMINDERS === '0' || process.env.MIS_HOD_REMINDERS === 'false'

  /**
   * Schedule (IST) — Vercel cron uses UTC (subtract 5h 30m):
   * - 6:00 AM & 6:00 PM — sync visits + late start / out-of-post from Agile Mobile
   * - 8:00 AM & 8:00 PM — sync client complaints from mail + Guards complaints into MIS
   * - 11:00 AM — branch reminders (HOD + staff, not submitted) + Director pending summary
   * - 2:00 PM — second branch reminders (HOD + staff) + Director pending summary
   * - 5:00 PM — consolidated MIS dashboard to Director only
   * - 7:00 PM — Director daily summary email
   */
  let job = ''
  if (manual === 'morning-reminder') job = 'morning-reminder'
  else if (manual === 'midday-reminder' || manual === 'afternoon-reminder' || manual === 'hod-reminder') job = 'midday-reminder'
  else if (manual === 'digest') job = 'digest'
  else if (manual === 'consolidated-ack') job = 'consolidated-ack'
  else if (manual === 'status') job = 'status'
  else if (manual === 'visit-sync') job = 'visit-sync'
  else if (manual === 'complaint-sync') job = 'complaint-sync'
  else if (manual === 'resend-acks') job = 'resend-acks'
  else if (manual === 'missing-acks') job = 'missing-acks'
  else if (manual === 'dedupe-branches') job = 'dedupe-branches'
  else if (manual === 'deactivate-branches') job = 'deactivate-branches'
  else if (manual === 'rename-branch') job = 'rename-branch'
  else if (manual === 'city-branch-names') job = 'city-branch-names'
  else if (manual === 'deploy-audit') job = 'deploy-audit'
  else if (manual === 'fix-ot') job = 'fix-ot'
  else if (manual === 'late-ack') job = 'late-ack'
  else if (manual === 'hod-pins') job = 'hod-pins'
  else if (manual === 'restore-clients') job = 'restore-clients'
  else if (manual === 'guards-complaint-sync') job = 'guards-complaint-sync'
  else if (manual === 'test-ack') job = 'test-ack'
  else if (manual === 'team-notice') job = 'team-notice'
  else if (manual === 'seed-hods') job = 'seed-hods'
  else if (hour === 11 && minute >= 25 && minute <= 35 && !remindersOff) job = 'morning-reminder'
  else if (hour === 14 && minute >= 25 && minute <= 35 && !remindersOff) job = 'midday-reminder'
  else if (hour === 17 && minute >= 25 && minute <= 35) job = 'consolidated-ack'
  else if (hour === 19 && minute >= 25 && minute <= 35) job = 'digest'
  else if (hour === 6 && minute >= 25 && minute <= 35) job = 'visit-sync'
  else if (hour === 18 && minute >= 25 && minute <= 35) job = 'visit-sync'
  else if (hour === 8 && minute >= 25 && minute <= 35) job = 'complaint-sync'
  else if (hour === 20 && minute >= 25 && minute <= 35) job = 'complaint-sync'

  if (!job) return res.status(200).json({ ok: true, skipped: true, reason: 'not a scheduled slot', ist: now.toISOString() })

  try {
    if (job === 'morning-reminder') {
      if (remindersOff) return res.status(200).json({ ok: true, skipped: true, reason: 'MIS_HOD_REMINDERS disabled' })
      await ensureTelanganaHodUsers()
      const reportDate = String(req.query.reportDate ?? date)
      const branchFilter = String(req.query.branches ?? '')
      const branchIds = branchFilter
        ? branchFilter.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined
      const branchMail = await sendMisSubmissionReminders(reportDate, 'morning', branchIds)
      const directorMail = await sendMisDirectorPendingReminder(reportDate, 'morning')
      if (!branchMail.ok && !branchMail.skipped) return res.status(500).json({ error: branchMail.error })
      if (!directorMail.ok) return res.status(500).json({ error: directorMail.error })
      return res.status(200).json({ ok: true, job, date: reportDate, branch: branchMail, director: directorMail })
    }
    if (job === 'midday-reminder') {
      if (remindersOff) return res.status(200).json({ ok: true, skipped: true, reason: 'MIS_HOD_REMINDERS disabled' })
      await ensureTelanganaHodUsers()
      const reportDate = String(req.query.reportDate ?? date)
      const branchFilter = String(req.query.branches ?? req.query.branch ?? '')
      let branchIds: string[] | undefined
      if (branchFilter) {
        const { getBranches } = await import('../_lib/mis/store.js')
        const active = await getBranches(true)
        if (branchFilter.toLowerCase() === 'hyderabad') {
          branchIds = active.filter((b) => /hyderabad|hi-?tech/i.test(b.name)).map((b) => b.id)
        } else if (/hi-?tech/i.test(branchFilter)) {
          branchIds = active.filter((b) => /hi-?tech/i.test(b.name)).map((b) => b.id)
        } else {
          const tokens = branchFilter.split(',').map((s) => s.trim()).filter(Boolean)
          branchIds = []
          for (const token of tokens) {
            const byId = active.find((b) => b.id === token)
            const byName = active.find((b) => b.name.toLowerCase() === token.toLowerCase())
            const byPartial = active.find((b) => b.name.toLowerCase().includes(token.toLowerCase()))
            const hit = byId || byName || byPartial
            if (hit) branchIds.push(hit.id)
          }
          if (!branchIds.length) branchIds = tokens
        }
      }
      const force = req.query.force === '1'
      if (force && branchIds?.length) {
        const mail = await sendMisSubmissionReminders(reportDate, 'midday', branchIds, {
          force: true,
          ccDirector: req.query.cc !== '0',
        })
        if (!mail.ok && !mail.skipped) return res.status(500).json({ error: mail.error })
        return res.status(200).json({ ok: true, job, date: reportDate, ...mail })
      }
      const branchMail = await sendMisSubmissionReminders(reportDate, 'midday', branchIds)
      const directorMail = await sendMisDirectorPendingReminder(reportDate, 'midday')
      if (!branchMail.ok && !branchMail.skipped) return res.status(500).json({ error: branchMail.error })
      if (!directorMail.ok) return res.status(500).json({ error: directorMail.error })
      return res.status(200).json({ ok: true, job, date: reportDate, branch: branchMail, director: directorMail })
    }
    if (job === 'afternoon-reminder') {
      return res.status(200).json({ ok: true, skipped: true, reason: 'Use midday-reminder (2:00 PM IST) instead' })
    }
    if (job === 'visit-sync') {
      const sync = await syncMobileVisits(date, { includeVisits: true, includeDuty: true })
      return res.status(200).json({ ok: sync.ok, job, date, ...sync })
    }
    if (job === 'complaint-sync') {
      const { syncComplaintsFromGmail } = await import('../_lib/mis/complaint-inbox.js')
      const { syncGuardsComplaintsToMis } = await import('../_lib/mis/guards-complaint-sync.js')
      const [sync, guards] = await Promise.all([syncComplaintsFromGmail(), syncGuardsComplaintsToMis()])
      return res.status(200).json({ ok: sync.ok, job, date, ...sync, guards })
    }
    if (job === 'test-ack') {
      const mail = await sendMisAckTestToDirector()
      if (!mail.ok) return res.status(500).json({ error: mail.error, ...mail })
      return res.status(200).json({ ok: true, job, date, ...mail })
    }
    if (job === 'team-notice') {
      const mail = await sendManusClosedTeamNotice()
      if (!mail.ok && !mail.sent?.length) return res.status(500).json({ error: mail.error, ...mail })
      return res.status(200).json({ ok: true, job, date, ...mail })
    }
    if (job === 'consolidated-ack') {
      const mail = await sendMisConsolidatedDailyAck(date)
      if (!mail.ok) return res.status(500).json({ error: mail.error, ...mail })
      return res.status(200).json({ ok: true, job, date, ...mail })
    }
    if (job === 'resend-acks') {
      const ackDate = String(req.query.date ?? date)
      const branchFilter = String(req.query.branches ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const mail = await sendMisAckForAllSubmissionsToday(
        ackDate,
        branchFilter.length ? branchFilter : undefined,
      )
      if (!mail.ok) return res.status(500).json({ error: mail.error, ...mail })
      return res.status(200).json({ ok: true, job, date: ackDate, ...mail })
    }
    if (job === 'missing-acks') {
      const ackDate = String(req.query.date ?? date)
      const mail = await sendMissingMisAcksForDate(ackDate)
      if (!mail.ok && !mail.sent?.length) return res.status(500).json({ error: mail.error, ...mail })
      return res.status(200).json({ ok: true, job, date: ackDate, ...mail })
    }
    if (job === 'dedupe-branches') {
      const { dedupeMisBranches } = await import('../_lib/mis/branch-dedupe.js')
      const result = await dedupeMisBranches()
      if (!result.ok) return res.status(500).json(result)
      return res.status(200).json({ ok: true, job, date, ...result })
    }
    if (job === 'deactivate-branches') {
      const { setBranchActiveByMatch } = await import('../_lib/mis/store.js')
      const lucknow = await setBranchActiveByMatch((n) => /lucknow/i.test(n), false)
      const surat = await setBranchActiveByMatch((n) => {
        const u = n.trim().toUpperCase()
        return u.startsWith('SURAT') && !u.includes('MUMBAI')
      }, false)
      return res.status(200).json({
        ok: true,
        job,
        date,
        deactivated: [...lucknow.updated, ...surat.updated],
      })
    }
    if (job === 'rename-branch') {
      const { renameBranch } = await import('../_lib/mis/store.js')
      const from = String(req.query.from ?? 'Karnataka')
      const to = String(req.query.to ?? 'Bangalore')
      const result = await renameBranch(from, to)
      if (!result.ok) return res.status(500).json({ ok: false, job, ...result })
      return res.status(200).json({ ok: true, job, date, ...result })
    }
    if (job === 'city-branch-names') {
      const { applyCityOnlyBranchNames } = await import('../_lib/mis/store.js')
      const result = await applyCityOnlyBranchNames()
      if (!result.ok) return res.status(500).json({ ok: false, job, ...result })
      return res.status(200).json({ ok: true, job, date, ...result })
    }
    if (job === 'deploy-audit' || job === 'fix-ot') {
      const { getBranches, getReport, getClients, saveDraftReport, submitReport, num } = await import(
        '../_lib/mis/store.js'
      )
      const { reportDeployTotals, rowDeployTotals, DEPLOY_SHIFTS } = await import('../_lib/mis/deploy-math.js')
      const branchQ = String(req.query.branch ?? 'Kochi').trim().toLowerCase()
      const auditDate = String(req.query.date ?? date)
      const branches = await getBranches()
      const branch = branches.find((b) => b.name.toLowerCase().includes(branchQ) || b.id === branchQ)
      if (!branch) return res.status(404).json({ ok: false, job, error: `Branch not found: ${branchQ}` })
      const report = await getReport(branch.id, auditDate)
      if (!report) return res.status(404).json({ ok: false, job, error: `No report for ${branch.name} on ${auditDate}` })
      const clients = await getClients(branch.id)
      const rows = report.rows || []
      const shiftOt = { A: 0, G: 0, B: 0, C: 0 }
      const shiftAbs = { A: 0, G: 0, B: 0, C: 0 }
      const detail = rows.map((r) => {
        const ot: Record<string, number> = {}
        const abs: Record<string, number> = {}
        let otSum = 0
        for (const s of DEPLOY_SHIFTS) {
          const o = num((r as Record<string, unknown>)[`ot${s}`])
          const a = num((r as Record<string, unknown>)[`abs${s}`])
          ot[s] = o
          abs[s] = a
          otSum += o
          shiftOt[s] += o
          shiftAbs[s] += a
        }
        return {
          clientId: r.clientId,
          client: r.clientName,
          site: r.location,
          ot,
          abs,
          otSum,
          row: rowDeployTotals(r as unknown as Record<string, unknown>),
        }
      })
      const totals = reportDeployTotals(rows as unknown as Record<string, unknown>[], branch.id, clients, branches)
      const keyCount = new Map<string, number>()
      for (const r of rows) {
        const k = `${String(r.clientId || '').trim()}|${String(r.clientName || '')
          .trim()
          .toUpperCase()}|${String(r.location || '')
          .trim()
          .toUpperCase()}`
        keyCount.set(k, (keyCount.get(k) || 0) + 1)
      }
      const dupes = [...keyCount.entries()].filter(([, n]) => n > 1).map(([k, n]) => ({ key: k, count: n }))

      if (job === 'fix-ot') {
        /**
         * Kochi OT correction (Director): true OT is 7 = A0 + B6 + C1 (G0).
         * Keep Abs as entered; zero excess OT.
         */
        const target = {
          A: Math.max(0, Number(req.query.otA ?? 0) || 0),
          G: Math.max(0, Number(req.query.otG ?? 0) || 0),
          B: Math.max(0, Number(req.query.otB ?? 6) || 0),
          C: Math.max(0, Number(req.query.otC ?? 1) || 0),
        }
        const fixed = rows.map((r) => ({ ...r }))
        for (const s of DEPLOY_SHIFTS) {
          let keep = target[s]
          for (const r of fixed) {
            const key = `ot${s}` as const
            const cur = num((r as Record<string, unknown>)[key])
            if (cur <= 0) {
              ;(r as Record<string, unknown>)[key] = 0
              continue
            }
            if (keep <= 0) {
              ;(r as Record<string, unknown>)[key] = 0
              continue
            }
            const use = Math.min(cur, keep)
            ;(r as Record<string, unknown>)[key] = use
            keep -= use
          }
        }
        /* Recompute dep per shift from san/abs/ot */
        for (const r of fixed) {
          for (const s of DEPLOY_SHIFTS) {
            const san = num((r as Record<string, unknown>)[`san${s}`])
            const abs = num((r as Record<string, unknown>)[`abs${s}`])
            const ot = num((r as Record<string, unknown>)[`ot${s}`])
            const vac = Math.max(0, abs - ot)
            ;(r as Record<string, unknown>)[`dep${s}`] = Math.min(san, Math.max(0, san - vac))
          }
        }
        const next = { ...report, rows: fixed, branchName: branch.name }
        const ok = report.submittedAt ? await submitReport(next) : await saveDraftReport(next)
        const newTotals = reportDeployTotals(
          fixed as unknown as Record<string, unknown>[],
          branch.id,
          clients,
          branches,
        )
        const newShift = { A: 0, G: 0, B: 0, C: 0 }
        for (const r of fixed) {
          for (const s of DEPLOY_SHIFTS) newShift[s] += num((r as Record<string, unknown>)[`ot${s}`])
        }
        return res.status(200).json({
          ok,
          job,
          branch: branch.name,
          date: auditDate,
          before: { ot: totals.ot, shiftOt },
          after: { ot: newTotals.ot, shiftOt: newShift, abs: newTotals.abs, vac: newTotals.vac },
          target,
        })
      }

      return res.status(200).json({
        ok: true,
        job,
        branch: branch.name,
        branchId: branch.id,
        date: auditDate,
        rowCount: rows.length,
        shiftOt,
        shiftAbs,
        shiftOtSum: shiftOt.A + shiftOt.G + shiftOt.B + shiftOt.C,
        totals,
        dupes,
        otRows: detail.filter((d) => d.otSum > 0 || d.row.abs > 0).slice(0, 80),
      })
    }
    if (job === 'late-ack') {
      const ackDate = String(req.query.date ?? date)
      const mail = await sendMisLateConsolidatedAck(ackDate)
      if (!mail.ok && !mail.skipped) return res.status(500).json({ error: mail.error, ...mail })
      return res.status(200).json({ ok: true, job, date: ackDate, ...mail })
    }
    if (job === 'seed-hods') {
      const result = await ensureTelanganaHodUsers()
      return res.status(200).json({ ok: true, job, date, ...result })
    }
    if (job === 'hod-pins') {
      const { ensureBranchPasswords } = await import('../_lib/branch-auth.js')
      const branches = await ensureBranchPasswords()
      const active = branches.filter((b) => b.active !== false).sort((a, b) => a.name.localeCompare(b.name))
      const lines = active.map((b) => `${b.name}: ${b.pin}`)
      return res.status(200).json({
        ok: true,
        job,
        date,
        count: active.length,
        branches: active.map((b) => ({ id: b.id, name: b.name, pin: b.pin })),
        whatsappText:
          'Agile Security Force — Branch HOD passwords\\n\\n' +
          lines.join('\\n') +
          '\\n\\nSign in: https://www.agilegroup-digital.co.in\\nOpen your app → HODs / Staff → pick branch → enter password.',
      })
    }
    if (job === 'restore-clients') {
      const { restoreMasterDirectoryIfNeeded, getSiteDirectoryStats } = await import('../_lib/mis/store.js')
      const restored = await restoreMasterDirectoryIfNeeded()
      const stats = await getSiteDirectoryStats()
      return res.status(200).json({
        ok: true,
        job,
        date,
        ...restored,
        totalSites: stats.totalSites,
        totalClientNames: stats.totalClientNames,
        siteCounts: stats.siteCounts,
        clientNameCounts: stats.clientNameCounts,
      })
    }
    if (job === 'guards-complaint-sync') {
      const { syncGuardsComplaintsToMis } = await import('../_lib/mis/guards-complaint-sync.js')
      const result = await syncGuardsComplaintsToMis()
      return res.status(200).json({ ok: true, job, date, ...result })
    }
    if (job === 'status') {
      const yesterday = misYesterdayIst()
      const snap = await computeDeploymentTotals(date)
      const yesterdayReports = await getReportsForDate(yesterday)
      const wrongDate = yesterdayReports
        .filter((r) => isSubmittedTodayIst(r.submittedAt))
        .map((r) => {
          const b = snap.branches.find((x) => x.id === r.branchId)
          return {
            branch: b?.name || r.branchName || r.branchId,
            reportDate: r.dateFor || yesterday,
            submittedBy: r.submittedBy || '',
            submittedAt: r.submittedAt,
          }
        })
      return res.status(200).json({
        ok: true,
        job,
        date,
        total: snap.branches.length,
        submitted: snap.submitted,
        pending: snap.pending.length,
        submittedBranches: snap.branchRows.filter((r) => r.submitted).map((r) => r.name),
        pendingBranches: snap.pending.map((b) => b.name),
        wrongDate,
      })
    }
    const mail = await sendMisDirectorDigest(date)
    if (!mail.ok) return res.status(500).json({ error: mail.error })
    return res.status(200).json({ ok: true, job, date, sentTo: mail.to })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Cron failed'
    return res.status(500).json({ error: msg })
  }
}

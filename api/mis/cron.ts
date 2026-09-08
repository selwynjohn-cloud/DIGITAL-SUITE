import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  sendMisDirectorDigest,
  sendMisHodReminders,
  sendMisSubmissionReminders,
  sendMisDirectorPendingReminder,
  sendMisAckTestToDirector,
  sendDirectorGmailTest,
  sendMisConsolidatedDailyAck,
  sendMisAckForAllSubmissionsToday,
  sendMisLateConsolidatedAck,
  sendMissingMisAcksForDate,
  sendManusClosedTeamNotice,
} from '../_lib/mis/digest.js'
import { sendMisDailyCommandReport } from '../_lib/mis/daily-command-report.js'
import { sendMisDirectorDailyPack } from '../_lib/mis/director-430-report.js'
import { ensureSuiteDailyReports } from '../_lib/suite-daily-delivery.js'
import { sendGuardRenewalWeeklyReminders } from '../_lib/mis/guard-renewal.js'
import { istNow, misTodayIst, misYesterdayIst, isSubmittedTodayIst } from '../_lib/mis/dates.js'
import { computeDeploymentTotals } from '../_lib/mis/digest.js'
import { getReportsForDate } from '../_lib/mis/store.js'
import { syncMobileVisits } from '../_lib/mis/mobile-visits.js'
import { ensureTelanganaHodUsers } from '../_lib/mis/hod-directory.js'

export const maxDuration = 120

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
   * - 4:30 PM — Command Centre daily MIS report (To Director + all HODs)
   *   plus Consolidated MIS + Branch-wise Registered Guards Complaints (To all HODs · CC Director).
   *   Catch-up continues until 10:00 PM if the 4:30 run is late or fails.
   * - 10:00 AM Saturday — guard ID Card / PVC / Medical renewal list to branch HODs (CC Recruitment + Director)
   */
  let job = ''
  if (manual === 'morning-reminder') job = 'morning-reminder'
  else if (manual === 'midday-reminder' || manual === 'afternoon-reminder' || manual === 'hod-reminder') job = 'midday-reminder'
  else if (manual === 'digest') job = 'digest'
  else if (manual === 'consolidated-ack') job = 'consolidated-ack'
  else if (manual === 'daily-report' || manual === 'daily-mis') job = 'daily-report'
  else if (manual === 'email-schedule') job = 'email-schedule'
  else if (manual === 'status') job = 'status'
  else if (manual === 'visit-sync') job = 'visit-sync'
  else if (manual === 'duty-headers') job = 'duty-headers'
  else if (manual === 'complaint-sync') job = 'complaint-sync'
  else if (manual === 'resend-acks') job = 'resend-acks'
  else if (manual === 'missing-acks') job = 'missing-acks'
  else if (manual === 'dedupe-branches') job = 'dedupe-branches'
  else if (manual === 'deactivate-branches') job = 'deactivate-branches'
  else if (manual === 'rename-branch') job = 'rename-branch'
  else if (manual === 'city-branch-names') job = 'city-branch-names'
  else if (manual === 'deploy-audit') job = 'deploy-audit'
  else if (manual === 'fix-ot') job = 'fix-ot'
  else if (manual === 'fix-carry-abs') job = 'fix-carry-abs'
  else if (manual === 'import-guard-docs') job = 'import-guard-docs'
  else if (manual === 'compliance-audit') job = 'compliance-audit'
  else if (manual === 'export-guard-phones') job = 'export-guard-phones'
  else if (manual === 'hyd-ab-masters' || manual === 'export-hyd-ab-masters') job = 'hyd-ab-masters'
  else if (manual === 'tada-surat-neolync' || manual === 'export-tada-surat-neolync') job = 'tada-surat-neolync'
  else if (manual === 'import-ost') job = 'import-ost'
  else if (manual === 'repair-collections') job = 'repair-collections'
  else if (manual === 'collection-audit') job = 'collection-audit'
  else if (manual === 'guard-renewal-reminder') job = 'guard-renewal-reminder'
  else if (manual === 'late-ack') job = 'late-ack'
  else if (manual === 'hod-pins') job = 'hod-pins'
  else if (manual === 'restore-clients') job = 'restore-clients'
  else if (manual === 'freeze-client-books') job = 'freeze-client-books'
  else if (manual === 'client-search') job = 'client-search'
  else if (manual === 'activate-client') job = 'activate-client'
  else if (manual === 'sort-client-masters' || manual === 'alpha-masters') job = 'sort-client-masters'
  else if (manual === 'ensure-premier-hyd-b') job = 'ensure-premier-hyd-b'
  else if (manual === 'realign-hyd-training-books' || manual === 'training-hyd-books-1408')
    job = 'realign-hyd-training-books'
  else if (manual === 'hyd-a-audit' || manual === 'dump-hyd-a-1408') job = 'hyd-a-audit'
  else if (manual === 'split-independent-branches') job = 'split-independent-branches'
  else if (manual === 'evacuate-hitech-krc') job = 'evacuate-hitech-krc'
  else if (manual === 'move-kakinada-from-vizag' || manual === 'kakinada-audit' || manual === 'clean-kakinada-leftovers')
    job = manual
  else if (manual === 'guards-complaint-sync') job = 'guards-complaint-sync'
  else if (manual === 'test-director-gmail') job = 'test-director-gmail'
  else if (manual === 'test-ack') job = 'test-ack'
  else if (manual === 'f2s-test' || manual === 'fast2sms-test') job = 'f2s-test'
  else if (manual === 'wa-test' || manual === 'whapi-test') job = 'wa-test'
  else if (manual === 'hdfc-survey-wa' || manual === 'hdfc-survey-notice') job = 'hdfc-survey-wa'
  else if (manual === 'guards-bangalore-heal' || manual === 'guards-heal-bangalore') job = 'guards-bangalore-heal'
  else if (manual === 'wa-pair' || manual === 'whapi-pair') job = 'wa-pair'
  else if (manual === 'wa-pair-2345') job = 'wa-pair-2345'
  else if (manual === 'wa-pair-6626') job = 'wa-pair-6626'
  else if (manual === 'wa-qr' || manual === 'whapi-qr') job = 'wa-qr'
  else if (manual === 'news-f2s-test') job = 'news-f2s-test'
  else if (manual === 'f2s-webhook-set') job = 'f2s-webhook-set'
  else if (manual === 'f2s-webhook-get') job = 'f2s-webhook-get'
  else if (manual === 'f2s-forward-test') job = 'f2s-forward-test'
  else if (manual === 'f2s-forward-log') job = 'f2s-forward-log'
  else if (manual === 'bulletin-test' || manual === 'pulse-test') job = 'bulletin-test'
  else if (manual === 'bulletin-groups' || manual === 'bulletin-last-night-groups') job = 'bulletin-groups'
  else if (manual === 'bulletin-post2-preview') job = 'bulletin-post2-preview'
  else if (manual === 'wa-health' || manual === 'whapi-health') job = 'wa-health'
  else if (manual === 'wa-login-probe') job = 'wa-login-probe'
  else if (manual === 'branch-invite-send' || manual === 'branch-invite-preview') job = manual
  else if (manual === 'team-notice') job = 'team-notice'
  else if (manual === 'seed-hods') job = 'seed-hods'
  else if (manual === 'sla-compliance-reminder') job = 'sla-compliance-reminder'
  else if (hour === 11 && minute >= 25 && minute <= 35 && !remindersOff) job = 'morning-reminder'
  else if (hour === 14 && minute >= 25 && minute <= 35 && !remindersOff) job = 'midday-reminder'
  else if ((hour === 16 && minute >= 15) || hour === 17) job = 'daily-report'
  else if (hour === 6 && minute >= 25 && minute <= 35) job = 'visit-sync'
  else if (hour === 18 && minute >= 25 && minute <= 35) job = 'visit-sync'
  else if (hour === 8 && minute >= 25 && minute <= 35) job = 'complaint-sync'
  else if (hour === 20 && minute >= 25 && minute <= 35) job = 'complaint-sync'
  else if (now.getDay() === 6 && hour === 10 && minute >= 25 && minute <= 35) job = 'guard-renewal-reminder'

  if (!job) {
    const dailyCatchUp = await ensureSuiteDailyReports({ ids: ['mis', 'mis-director'] })
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'not a scheduled slot',
      ist: now.toISOString(),
      dailyCatchUp,
    })
  }

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
      const { sendSlaComplianceReminders } = await import('../_lib/mis/sla-compliance-reminders.js')
      const slaMail = await sendSlaComplianceReminders({ date: reportDate, branchIds })
      if (!branchMail.ok && !branchMail.skipped) return res.status(500).json({ error: branchMail.error })
      if (!directorMail.ok) return res.status(500).json({ error: directorMail.error })
      return res.status(200).json({ ok: true, job, date: reportDate, branch: branchMail, director: directorMail, sla: slaMail })
    }
    if (job === 'sla-compliance-reminder') {
      const { sendSlaComplianceReminders } = await import('../_lib/mis/sla-compliance-reminders.js')
      const reportDate = String(req.query.reportDate ?? date)
      const branchFilter = String(req.query.branches ?? '')
      const branchIds = branchFilter
        ? branchFilter.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined
      const force = req.query.force === '1'
      const slaMail = await sendSlaComplianceReminders({ date: reportDate, branchIds, force })
      return res.status(200).json({ ok: true, job, date: reportDate, ...slaMail })
    }
    if (job === 'midday-reminder') {
      if (remindersOff) return res.status(200).json({ ok: true, skipped: true, reason: 'MIS_HOD_REMINDERS disabled' })
      await ensureTelanganaHodUsers()
      const reportDate = String(req.query.reportDate ?? date)
      const branchFilter = String(req.query.branches ?? req.query.branch ?? '')
      let branchIds: string[] | undefined
      if (branchFilter) {
        const { getMisReportBranches } = await import('../_lib/mis/store.js')
        const active = await getMisReportBranches(true)
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
      const dailyCatchUp = await ensureSuiteDailyReports({ ids: ['mis', 'mis-director'] })
      return res.status(200).json({ ok: sync.ok, job, date, ...sync, dailyCatchUp })
    }
    if (job === 'duty-headers') {
      const queryDate = String(req.query.date ?? date)
      const { debugWork360DutyHeaders } = await import('../_lib/mis/work360-duty.js')
      const debug = await debugWork360DutyHeaders(queryDate)
      return res.status(200).json({ ok: debug.ok, job, date: queryDate, ...debug })
    }
    if (job === 'complaint-sync') {
      const { syncComplaintsFromGmail } = await import('../_lib/mis/complaint-inbox.js')
      const { syncGuardsComplaintsToMis } = await import('../_lib/mis/guards-complaint-sync.js')
      const [sync, guards] = await Promise.all([syncComplaintsFromGmail(), syncGuardsComplaintsToMis()])
      return res.status(200).json({ ok: sync.ok, job, date, ...sync, guards })
    }
    if (job === 'test-director-gmail') {
      const mail = await sendDirectorGmailTest()
      if (!mail.ok) return res.status(500).json({ error: mail.error, ...mail })
      return res.status(200).json({ ok: true, job, date, ...mail })
    }
    if (job === 'test-ack') {
      const mail = await sendMisAckTestToDirector()
      if (!mail.ok) return res.status(500).json({ error: mail.error, ...mail })
      return res.status(200).json({ ok: true, job, date, ...mail })
    }
    if (job === 'wa-health') {
      const {
        adminWhatsAppPhone,
        waBothLinkStatus,
        waHealth,
        waSettings,
        whatsappBufferConfigured,
        whatsappConfigured,
      } = await import('../_lib/pulse/whatsapp.js')
      if (!whatsappConfigured()) {
        return res.status(503).json({ ok: false, job, error: 'WHAPI_TOKEN is not set on the server.' })
      }
      const [health, settings, both] = await Promise.all([waHealth(), waSettings(), waBothLinkStatus()])
      const link = both.primary
      return res.status(200).json({
        ok: Boolean(health?.ok),
        job,
        endpoint: 'https://gate.whapi.cloud/health?wakeup=true&channel_type=web',
        phoneLast4: adminWhatsAppPhone().slice(-4),
        healthHttp: health?.status ?? 0,
        health: health?.data ?? null,
        settingsHttp: settings?.status ?? 0,
        settings: settings?.data ?? null,
        link,
        buffer: {
          configured: whatsappBufferConfigured(),
          ...both.buffer,
        },
        message: link.linked
          ? both.buffer.linked
            ? 'News line (9091) and spare line (6626) are both linked.'
            : 'News line is linked. Spare line (6626) is not linked yet.'
          : 'Whapi API is reachable, but WhatsApp is not linked. Scan QR (job=wa-qr) to reconnect.',
      })
    }
    if (job === 'wa-login-probe') {
      // Inspect /users/login response shape (no email; truncate any large base64)
      const { whatsappConfigured } = await import('../_lib/pulse/whatsapp.js')
      if (!whatsappConfigured()) {
        return res.status(503).json({ ok: false, job, error: 'WHAPI_TOKEN is not set on the server.' })
      }
      const token = process.env.WHAPI_TOKEN?.trim() ?? ''
      const url = 'https://gate.whapi.cloud/users/login?wakeup=true&size=400'
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
      })
      const data = (await r.json().catch(() => null)) as Record<string, unknown> | null
      const summary: Record<string, unknown> = { http: r.status, keys: data ? Object.keys(data) : [] }
      if (data && typeof data === 'object') {
        for (const [k, v] of Object.entries(data)) {
          if (typeof v === 'string') summary[k] = v.length > 80 ? `${v.slice(0, 40)}…(len ${v.length})` : v
          else if (v && typeof v === 'object') summary[k] = { keys: Object.keys(v as object) }
          else summary[k] = v
        }
      }
      return res.status(200).json({ ok: r.ok, job, ...summary })
    }
    if (job === 'branch-invite-preview' || job === 'branch-invite-send') {
      const { sendBranchWaInviteLinks } = await import('../_lib/guards/branch-wa-invite-send.js')
      const result = await sendBranchWaInviteLinks({ preview: job === 'branch-invite-preview' })
      return res.status(result.ok === false ? 502 : 200).json({ job, ...result })
    }
    if (job === 'bulletin-post2-preview') {
      // Director-only preview of the new Groups (Post 2) message — does not blast groups
      const { editionLabelForHour } = await import('../_lib/pulse/config.js')
      const { buildWhatsAppMessages } = await import('../_lib/pulse/messages.js')
      const { flashHeadlinesFrom } = await import('../_lib/pulse/news.js')
      const { preparePulseContent } = await import('../_lib/pulse/quality.js')
      const { dateTimeLabel, istNow } = await import('../_lib/pulse/scheduler.js')
      const { adminWhatsAppPhone, waSendText, whatsappConfigured } = await import('../_lib/pulse/whatsapp.js')
      if (!whatsappConfigured()) {
        return res.status(503).json({ ok: false, job, error: 'WHAPI_TOKEN is not set — WhatsApp not linked.' })
      }
      const director = adminWhatsAppPhone()
      if (director.length < 12) {
        return res.status(400).json({ ok: false, job, error: 'ADMIN_WHATSAPP missing' })
      }
      const now = istNow()
      const edition = editionLabelForHour(now.getHours())
      let topHeadline = ''
      try {
        const prepared = await preparePulseContent(edition)
        topHeadline = flashHeadlinesFrom(prepared.sections)[0] ?? ''
      } catch {
        /* keep empty headline */
      }
      const { msg2 } = buildWhatsAppMessages({
        edition,
        dateTime: dateTimeLabel(now),
        topHeadline,
      })
      const sent = await waSendText(director, `📋 *NEW Group message (Post 2) — preview only*\n\n${msg2}`)
      return res.status(sent?.ok ? 200 : 502).json({
        ok: Boolean(sent?.ok),
        job,
        edition,
        message: sent?.ok
          ? 'New Post 2 preview sent to Director only (groups not touched).'
          : 'Could not send preview',
      })
    }
    if (job === 'bulletin-groups') {
      // Groups only. Channel is not sent again. ymd must be yesterday so tonight is never marked sent.
      const { publishGroupMessages } = await import('../_lib/pulse/publish.js')
      const { buildWhatsAppMessages } = await import('../_lib/pulse/messages.js')
      const { flashHeadlinesFrom } = await import('../_lib/pulse/news.js')
      const { preparePulseContent } = await import('../_lib/pulse/quality.js')
      const { dateTimeLabel } = await import('../_lib/pulse/scheduler.js')
      const { whatsappConfigured } = await import('../_lib/pulse/whatsapp.js')
      if (!whatsappConfigured()) {
        return res.status(503).json({ ok: false, job, error: 'WHAPI_TOKEN is not set — WhatsApp not linked.' })
      }
      const ymd = String(req.query.ymd ?? '').trim()
      const yesterday = misYesterdayIst()
      if (ymd !== yesterday) {
        return res.status(400).json({
          ok: false,
          job,
          error: `Pass ymd=${yesterday} to send last night’s bulletin to groups only.`,
        })
      }
      const edition = String(req.query.edition ?? '10:00 PM Edition').trim() || '10:00 PM Edition'
      const [y, mo, d] = ymd.split('-').map(Number)
      const when = new Date(y, mo - 1, d, 22, 0, 0)
      let topHeadline = ''
      try {
        const prepared = await preparePulseContent(edition, { forceFresh: true })
        topHeadline = flashHeadlinesFrom(prepared.sections)[0] ?? ''
      } catch {
        /* keep empty headline */
      }
      const { msg2 } = buildWhatsAppMessages({
        edition,
        dateTime: dateTimeLabel(when),
        topHeadline,
      })
      const sent = await publishGroupMessages(msg2)
      return res.status(sent.groupsSent > 0 ? 200 : 502).json({
        ok: sent.groupsSent > 0,
        job,
        edition,
        ymd,
        dateLabel: dateTimeLabel(when),
        groupsSent: sent.groupsSent,
        tried: sent.tried,
        usedLiveList: sent.usedLiveList,
        error: sent.error,
        message:
          sent.groupsSent > 0
            ? `Last night’s bulletin sent to ${sent.groupsSent} group(s). Channel was not sent again.`
            : sent.error || 'Groups did not accept the bulletin.',
      })
    }
    if (job === 'bulletin-test') {
      // Force-publish Agile Pulse: Post 1 → Channel, Post 2 → groups; also copy both to Director
      const { runPulsePublish } = await import('../_lib/pulse/scheduler.js')
      const { adminWhatsAppPhone, waSendText, whatsappConfigured } = await import('../_lib/pulse/whatsapp.js')
      if (!whatsappConfigured()) {
        return res.status(503).json({ ok: false, job, error: 'WHAPI_TOKEN is not set — WhatsApp not linked.' })
      }
      const result = await runPulsePublish({ force: true })
      const director = adminWhatsAppPhone()
      let directorCopies = { post1: false, post2: false }
      if (director.length >= 12 && result.msg1 && result.msg2) {
        const r1 = await waSendText(
          director,
          `📋 *BULLETIN TEST — Post 1 (Channel)*\n\n${result.msg1}`,
        )
        await new Promise((r) => setTimeout(r, 1200))
        const r2 = await waSendText(
          director,
          `📋 *BULLETIN TEST — Post 2 (Groups)*\n\n${result.msg2}`,
        )
        directorCopies = { post1: Boolean(r1?.ok), post2: Boolean(r2?.ok) }
      }
      return res.status(result.published || directorCopies.post1 ? 200 : 502).json({
        ok: Boolean(result.published || directorCopies.post1),
        job,
        edition: result.edition,
        published: result.published,
        skipped: result.skipped,
        reason: result.reason,
        groupsSent: result.groupsSent,
        newsCount: result.newsCount,
        directorCopies,
        message: result.published
          ? `Bulletin sent: Post 1 → Channel, Post 2 → ${result.groupsSent} group(s). Copies also sent to Director WhatsApp.`
          : result.reason
            ? `Could not publish (${result.reason}). Director copies: Post1 ${directorCopies.post1 ? '✓' : '✗'}, Post2 ${directorCopies.post2 ? '✓' : '✗'}.`
            : 'Bulletin test finished — check Director WhatsApp for Post 1 and Post 2 copies.',
      })
    }
    if (job === 'wa-test') {
      // Same path as Agile Pulse news bulletin → Director WhatsApp (Whapi)
      const {
        adminWhatsAppPhone,
        waErrorMessage,
        waHealth,
        waLinkStatus,
        waSendText,
        whatsappConfigured,
      } = await import('../_lib/pulse/whatsapp.js')
      const to = adminWhatsAppPhone()
      if (to.length < 12) {
        return res.status(400).json({ ok: false, job, error: 'ADMIN_WHATSAPP is missing on the server.' })
      }
      if (!whatsappConfigured()) {
        return res.status(503).json({ ok: false, job, error: 'WHAPI_TOKEN is not set on the server.' })
      }
      const health = await waHealth()
      const link = await waLinkStatus()
      const text =
        'Agile Pulse test ✓\n\nThis is the same WhatsApp path used for the news bulletin.\nIf you received this, Director WhatsApp is working.\n\n— Agile Command Centre'
      const sent = await waSendText(to, text)
      const ok = Boolean(sent?.ok)
      return res.status(ok ? 200 : 502).json({
        ok,
        job,
        provider: 'whapi',
        toLast4: to.slice(-4),
        healthOk: Boolean(health?.ok),
        link,
        http: sent?.status,
        error: ok ? undefined : waErrorMessage(sent),
        message: ok
          ? 'Test WhatsApp sent via Whapi (same as news bulletin). Please check your phone.'
          : waErrorMessage(sent) || 'Whapi send failed — channel may need re-linking.',
      })
    }
    if (job === 'hdfc-survey-wa') {
      const { adminWhatsAppPhone, waSendText, whatsappConfigured } = await import('../_lib/pulse/whatsapp.js')
      const { guardsSendWhatsAppPing } = await import('../_lib/guards/whatsapp-send.js')
      const to = adminWhatsAppPhone()
      if (to.length < 12) {
        return res.status(400).json({ ok: false, job, error: 'ADMIN_WHATSAPP is missing on the server.' })
      }
      const text = [
        '🛡️ *AGILE SECURITY FORCE PRIVATE LIMITED*',
        '*Security Division — Site Security Assessment (SSA) (HDFC)*',
        '━━━━━━━━━━━━━━━━━━━━',
        '',
        'Dear Colleagues,',
        '',
        'As informed in the meeting today, please find the *HDFC survey link*.',
        '',
        'Please visit *all HDFC units* and complete all unit surveys *by the end of this week*.',
        '',
        '🔗 *HDFC survey link (no login):*',
        'https://www.agilegroup-digital.co.in/mis-hdfc-survey',
        '',
        '✅ Open the link',
        '✅ Pick your *Branch*',
        '✅ Pick the *HDFC unit*',
        '✅ Fill the columns',
        '✅ Tap *Submit to HOD*',
        '',
        'Thank you,',
        '',
        '*Director — Security Division*',
        'Agile Security Force Private Limited',
        '',
        '━━━━━━━━━━━━━━━━━━━━',
        '_Agile Digital Operations Command Centre — designed and built with Cursor.ai, San Francisco, California, USA, in partnership with Agile Group leadership._',
        'www.agilegroup-digital.co.in · cursor.ai',
      ].join('\n')

      let provider: 'whapi' | 'fast2sms' = 'whapi'
      let ok = false
      let error = ''
      if (whatsappConfigured()) {
        const sent = await waSendText(to, text)
        ok = Boolean(sent?.ok)
        if (!ok) {
          const d = sent?.data as { error?: string; message?: string } | null
          error = d?.error || d?.message || `Whapi failed (${sent?.status || 0})`
        }
      } else {
        error = 'WHAPI_TOKEN is not set on the server.'
      }
      if (!ok) {
        provider = 'fast2sms'
        const f2s = await guardsSendWhatsAppPing(to, text)
        ok = Boolean(f2s.ok)
        if (!ok) error = f2s.error || error || 'WhatsApp send failed'
      }
      return res.status(ok ? 200 : 502).json({
        ok,
        job,
        provider,
        toLast4: String(to).replace(/\D/g, '').slice(-4),
        error: ok ? undefined : error,
        message: ok
          ? 'Colourful HDFC survey WhatsApp sent to Director. Please forward to all operation teams.'
          : error || 'Could not send WhatsApp to Director.',
      })
    }
    if (job === 'guards-bangalore-heal') {
      const { getBranches } = await import('../_lib/mis/store.js')
      const {
        branchDisplayName,
        complaintMatchesBranch,
        getComplaints,
        getDeptStaff,
        getOpsStaff,
        healComplaintBranches,
        healGuardsStaffBranches,
        resolveBranchId,
        canonicalBranchStorageId,
        saveOpsStaff,
        saveDeptStaff,
        normalizeOps,
        normalizeDeptStaff,
      } = await import('../_lib/guards/store.js')
      const branches = await getBranches(true)
      const bangalore = resolveBranchId('Bangalore', branches) || resolveBranchId('Karnataka', branches)
      if (!bangalore) {
        return res.status(404).json({ ok: false, job, error: 'Bangalore branch not found in Master Directory.' })
      }
      await healGuardsStaffBranches(branches)
      const complaintsRaw = await getComplaints()
      const complaintHeal = await healComplaintBranches(branches, complaintsRaw)

      // Force-map any ops/dept whose label looks like Bangalore / Karnataka / Bengaluru onto br1
      let forcedOps = 0
      let forcedDept = 0
      const opsAll = await getOpsStaff()
      const deptAll = await getDeptStaff()
      const looksBangalore = (raw: string) => {
        const s = String(raw || '')
        return /bangalore|bengaluru|karnataka|b-karnataka/i.test(s)
      }
      const nextOps = opsAll.map((o) => {
        if (complaintMatchesBranch(o.branchId, bangalore.id, branches)) return o
        if (!looksBangalore(o.branchId) && !looksBangalore(branchDisplayName(o.branchId, branches))) return o
        forcedOps++
        return normalizeOps({ ...o, branchId: bangalore.id })
      })
      const nextDept = deptAll.map((d) => {
        if (complaintMatchesBranch(d.branchId, bangalore.id, branches)) return d
        if (!looksBangalore(d.branchId) && !looksBangalore(branchDisplayName(d.branchId, branches))) return d
        forcedDept++
        return normalizeDeptStaff({ ...d, branchId: bangalore.id })
      })
      if (forcedOps) await saveOpsStaff(nextOps)
      if (forcedDept) await saveDeptStaff(nextDept)

      const ops = forcedOps ? nextOps : await getOpsStaff()
      const dept = forcedDept ? nextDept : await getDeptStaff()
      const complaints = complaintHeal.complaints
      const bangOps = ops.filter((o) => complaintMatchesBranch(o.branchId, bangalore.id, branches) && o.active !== false)
      const bangDept = dept.filter(
        (d) => complaintMatchesBranch(d.branchId, bangalore.id, branches) && d.active !== false,
      )
      const bangComplaints = complaints.filter((c) =>
        complaintMatchesBranch(c.branchId, bangalore.id, branches),
      )
      const unassigned = bangComplaints.filter(
        (c) => c.status !== 'solved' && !c.opsStaffId && !c.deptStaffId && !c.deptStaffEmail,
      )
      const opsBuckets: Record<string, number> = {}
      for (const o of ops) {
        const key = `${canonicalBranchStorageId(o.branchId, branches) || o.branchId}::${branchDisplayName(o.branchId, branches)}`
        opsBuckets[key] = (opsBuckets[key] || 0) + 1
      }
      return res.status(200).json({
        ok: true,
        job,
        bangalore: { id: bangalore.id, name: branchDisplayName(bangalore.id, branches) },
        healed: {
          complaintsFixed: complaintHeal.fixed,
          forcedOpsToBangalore: forcedOps,
          forcedDeptToBangalore: forcedDept,
        },
        counts: {
          opsStaff: bangOps.length,
          deptStaff: bangDept.length,
          complaints: bangComplaints.length,
          unassignedOpen: unassigned.length,
          opsStaffNames: bangOps.slice(0, 12).map((o) => o.name),
          deptStaffNames: bangDept.slice(0, 12).map((d) => `${d.department}: ${d.name}`),
        },
        opsBranchBuckets: Object.entries(opsBuckets)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([k, n]) => ({ branch: k, n })),
        message:
          bangOps.length || bangDept.length
            ? 'Bangalore Ops/Dept staff ready for assign dropdowns.'
            : 'No Operations/Department staff linked to Bangalore yet. HOD must add them under Operations Staff and Department Staff.',
      })
    }
    if (job === 'wa-pair' || job === 'wa-pair-2345' || job === 'wa-pair-6626') {
      const { Resend } = await import('resend')
      const { pinMailFrom, sendSuiteEmail, suiteDirectorEmail } = await import('../_lib/suite-mail.js')
      const {
        waLinkStatus,
        waPairingCode,
        whatsappConfigured,
      } = await import('../_lib/pulse/whatsapp.js')
      if (!whatsappConfigured()) {
        return res.status(503).json({ ok: false, job, error: 'WHAPI_TOKEN is not set on the server.' })
      }
      const pairPhone =
        job === 'wa-pair-6626' ? '917093066626' : job === 'wa-pair-2345' ? '917893692345' : '919441009091'
      const statusBefore = await waLinkStatus()
      const pair = await waPairingCode(pairPhone)
      if (pair.alreadyAuthenticated) {
        return res.status(200).json({
          ok: true,
          job,
          alreadyAuthenticated: true,
          phoneLast4: pair.phoneLast4 || pairPhone.slice(-4),
          message: 'WhatsApp channel is already linked. Try job=wa-test next.',
          link: statusBefore,
        })
      }
      if (!pair.ok || !pair.code) {
        return res.status(502).json({
          ok: false,
          job,
          phoneLast4: pairPhone.slice(-4),
          error: pair.error || 'Could not get pairing code',
          http: pair.http,
          link: statusBefore,
        })
      }

      let emailed = false
      let emailError = ''
      const apiKey = process.env.RESEND_API_KEY?.trim()
      const emailTo = suiteDirectorEmail()
      if (apiKey && emailTo.includes('@')) {
        try {
          const resend = new Resend(apiKey)
          const mail = await sendSuiteEmail(resend, {
            from: pinMailFrom(),
            to: emailTo,
            subject: 'Agile WhatsApp pairing code — enter on your phone now',
            html: `<p>Your WhatsApp <b>pairing code</b> for Agile Digital (news bulletin path) is:</p>
              <p style="font-size:28px;font-weight:800;letter-spacing:0.12em;color:#14224f">${pair.code}</p>
              <p>On your phone: WhatsApp → <b>Linked devices</b> → <b>Link a device</b> → <b>Link with phone number instead</b> → type this code.</p>
              <p style="color:#64748b;font-size:13px">Use the phone ending …${pair.phoneLast4 || pairPhone.slice(-4)}. Code expires soon.</p>`,
            skipDirectorCc: true,
          })
          emailed = !mail.error
          if (mail.error) emailError = mail.error.message || 'Email failed'
        } catch (e) {
          emailError = e instanceof Error ? e.message : 'Email failed'
        }
      }

      return res.status(200).json({
        ok: true,
        job,
        code: pair.code,
        expire: pair.expire ?? null,
        phoneLast4: pair.phoneLast4 || pairPhone.slice(-4),
        emailed,
        emailError: emailError || undefined,
        message: 'Enter this code on your phone under Linked devices → Link with phone number instead.',
      })
    }
    if (job === 'wa-qr') {
      const { Resend } = await import('resend')
      const { pinMailFrom, sendSuiteEmail, suiteDirectorEmail } = await import('../_lib/suite-mail.js')
      const { waLoginQr, whatsappConfigured } = await import('../_lib/pulse/whatsapp.js')
      if (!whatsappConfigured()) {
        return res.status(503).json({ ok: false, job, error: 'WHAPI_TOKEN is not set on the server.' })
      }
      const qr = await waLoginQr()
      if (qr.alreadyAuthenticated) {
        return res.status(200).json({
          ok: true,
          job,
          alreadyAuthenticated: true,
          phoneLast4: qr.phoneLast4,
          message: 'WhatsApp channel is already linked. Try job=wa-test next.',
        })
      }
      if (!qr.ok || !qr.qrDataUrl) {
        return res.status(502).json({
          ok: false,
          job,
          phoneLast4: qr.phoneLast4,
          error: qr.error || 'Could not get QR',
          http: qr.http,
        })
      }

      let emailed = false
      let emailError = ''
      const apiKey = process.env.RESEND_API_KEY?.trim()
      const emailTo = suiteDirectorEmail()
      if (apiKey && emailTo.includes('@')) {
        try {
          const resend = new Resend(apiKey)
          const mail = await sendSuiteEmail(resend, {
            from: pinMailFrom(),
            to: emailTo,
            subject: 'Agile WhatsApp QR — scan to reconnect news bulletin',
            html: `<p>Dear Sir,</p>
              <p>The news-bulletin WhatsApp link needs a quick re-scan (same as before).</p>
              <p><b>On your phone:</b> WhatsApp → <b>Linked devices</b> → <b>Link a device</b> → scan this QR:</p>
              <p style="text-align:center"><img src="${qr.qrImageUrl || qr.qrDataUrl}" alt="WhatsApp QR" width="280" height="280" style="border:4px solid #14224f;border-radius:12px"/></p>
              <p style="color:#64748b;font-size:13px">Number ending …${qr.phoneLast4 || ''}. Source: ${qr.source || 'image'}. Scan within about 1 minute, then reply <b>done</b> in chat.</p>`,
            skipDirectorCc: true,
          })
          emailed = !mail.error
          if (mail.error) emailError = mail.error.message || 'Email failed'
        } catch (e) {
          emailError = e instanceof Error ? e.message : 'Email failed'
        }
      }

      return res.status(emailed ? 200 : 502).json({
        ok: emailed,
        job,
        phoneLast4: qr.phoneLast4,
        emailed,
        emailError: emailError || undefined,
        expire: qr.expire ?? null,
        message: emailed
          ? 'QR emailed to Director. Please scan it now in WhatsApp → Linked devices.'
          : emailError || 'Could not email QR',
      })
    }
    if (job === 'news-f2s-test') {
      const { sendPulseNewsF2sCopies, pulseNewsCopyMobiles } = await import('../_lib/pulse/news-f2s-copy.js')
      const mobiles = pulseNewsCopyMobiles()
      const copy = await sendPulseNewsF2sCopies(
        'Sample Edition',
        'Agile News sample ✓\n\nThis is a test copy from Recruitment cell (+91 94410 09091).\nChannel + groups still use the linked WhatsApp.\n\n— Agile Pulse',
        'Group note: this is only a personal copy test.',
      )
      return res.status(copy.sent > 0 ? 200 : 502).json({
        ok: copy.sent > 0,
        job,
        mobiles: mobiles.map((m) => `…${m.slice(-4)}`),
        ...copy,
        message:
          copy.sent > 0
            ? 'News copy sent from Recruitment cell. Check WhatsApp for a message from Recruitment cell.'
            : copy.errors.join('; ') || 'Fast2SMS news copy failed',
      })
    }
    if (job === 'f2s-forward-test') {
      const { forwardRecruitmentInboundToDirector } = await import('../_lib/fast2sms/forward-to-director.js')
      const r = await forwardRecruitmentInboundToDirector({
        from: '919988776655',
        body: 'Test forward ✓\n\nThis is a system check: a message to Recruitment cell should look like this when forwarded to Director.',
        messageType: 'text',
        messageId: `manual-fwd-${Date.now()}`,
      })
      return res.status(r.ok ? 200 : 502).json({
        ok: r.ok,
        job,
        ...r,
        message: r.ok
          ? `Forward test sent via ${r.via}. Check Director WhatsApp.`
          : r.error || 'Forward test failed',
      })
    }
    if (job === 'f2s-forward-log') {
      const { readForwardLog } = await import('../_lib/fast2sms/forward-to-director.js')
      const { redisCommand } = await import('../_lib/pulse/store.js')
      const log = await readForwardLog()
      const last = await redisCommand(['GET', 'f2s:fwd:last-webhook'])
      return res.status(200).json({
        ok: true,
        job,
        lastWebhook: last?.result ? JSON.parse(String(last.result)) : null,
        forwardLog: log.slice(0, 15),
      })
    }
    if (job === 'f2s-webhook-get' || job === 'f2s-webhook-set') {
      const key = process.env.FAST2SMS_API_KEY?.trim()
      if (!key) return res.status(503).json({ ok: false, job, error: 'FAST2SMS_API_KEY not set' })
      const webhookUrl =
        String(req.query.url ?? '').trim() ||
        'https://securityjob.co.in/api/guards/fast2sms-webhook'
      if (job === 'f2s-webhook-get') {
        const r = await fetch('https://www.fast2sms.com/dev/webhook/whatsapp/get', {
          headers: { authorization: key, accept: 'application/json' },
          signal: AbortSignal.timeout(20000),
        })
        const data = await r.json().catch(() => null)
        return res.status(200).json({ ok: r.ok, job, http: r.status, data })
      }
      const r = await fetch('https://www.fast2sms.com/dev/webhook/whatsapp/set', {
        method: 'POST',
        headers: {
          authorization: key,
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhook_url: webhookUrl, webhook_status: 'enable' }),
        signal: AbortSignal.timeout(20000),
      })
      const data = await r.json().catch(() => null)
      return res.status(r.ok ? 200 : 502).json({
        ok: r.ok,
        job,
        http: r.status,
        webhookUrl,
        data,
        message: r.ok
          ? 'Fast2SMS webhook set — inbound messages to 94410 will forward to Director.'
          : 'Could not set Fast2SMS webhook — set it in the Fast2SMS dashboard.',
      })
    }
    if (job === 'f2s-test') {
      const {
        fast2smsConfigured,
        fast2smsDeliveryStatus,
        fast2smsMobile,
        fast2smsSendSessionText,
        fast2smsSendTemplate,
        fast2smsWabaStatus,
      } = await import('../_lib/fast2sms/whatsapp.js')
      const { adminWhatsAppPhone } = await import('../_lib/pulse/whatsapp.js')
      const to = adminWhatsAppPhone()
      if (to.length < 12) {
        return res.status(400).json({ ok: false, job, error: 'ADMIN_WHATSAPP is missing on the server.' })
      }
      if (!fast2smsConfigured()) {
        return res.status(503).json({ ok: false, job, error: 'FAST2SMS_API_KEY is not set on the server.' })
      }
      const waba = await fast2smsWabaStatus()
      const templateId =
        process.env.FAST2SMS_FLEET_OPEN_TEMPLATE_ID?.trim() ||
        process.env.FAST2SMS_GUARDS_OPEN_TEMPLATE_ID?.trim() ||
        '24177'
      const dest = fast2smsMobile(to)

      // 1) Approved template (works without 24h window)
      const tpl = await fast2smsSendTemplate(dest, templateId)
      const tplReq = String(tpl.data?.request_id ?? '')
      await new Promise((r) => setTimeout(r, 3500))
      const tplDlr = tplReq
        ? await fast2smsDeliveryStatus(tplReq)
        : { ok: false, status: 'none', description: '', error: tpl.error || 'No template request id' }

      // 2) Free-text after template (needs open session)
      const text =
        'Agile Digital test ✓\n\nThis is a Fast2SMS WhatsApp check to Director.\nIf you received this, the business line (+91 94410 09091) can send to your phone.\n\n— Agile Command Centre'
      const session = await fast2smsSendSessionText(dest, text)
      const sessReq = String(session.data?.request_id ?? '')
      await new Promise((r) => setTimeout(r, 3500))
      const sessDlr = sessReq
        ? await fast2smsDeliveryStatus(sessReq)
        : { ok: false, status: 'none', description: '', error: session.error || 'No session request id' }

      const delivered = Boolean(tplDlr.ok || sessDlr.ok)
      return res.status(delivered ? 200 : 502).json({
        ok: delivered,
        job,
        provider: 'fast2sms',
        toLast4: dest.slice(-4),
        templateId,
        waba: {
          number: waba.number,
          connectionStatus: waba.connectionStatus,
          verifiedName: waba.verifiedName,
        },
        template: {
          apiOk: tpl.ok,
          requestId: tplReq || undefined,
          dlr: tplDlr.status,
          description: tplDlr.description || undefined,
          error: tplDlr.error || tpl.error,
        },
        sessionText: {
          apiOk: session.ok,
          requestId: sessReq || undefined,
          dlr: sessDlr.status,
          description: sessDlr.description || undefined,
          error: sessDlr.error || session.error,
        },
        message: delivered
          ? 'WhatsApp delivery confirmed by Fast2SMS. Please check your phone (also spam / business chats).'
          : 'Fast2SMS accepted the API call but Meta did not deliver. Check template / 24h window details below.',
      })
    }
    if (job === 'team-notice') {
      const mail = await sendManusClosedTeamNotice()
      if (!mail.ok && !mail.sent?.length) return res.status(500).json({ error: mail.error, ...mail })
      return res.status(200).json({ ok: true, job, date, ...mail })
    }
    if (job === 'daily-report') {
      const ackDate = String(req.query.date ?? date).trim() || date
      const preview = String(req.query.preview ?? '') === '1'
      const sampleOnly =
        !preview &&
        (req.query.sampleOnly === '1' ||
          req.query.sampleOnly === 'true' ||
          req.query.to === 'sample')
      const force = String(req.query.force ?? '') === '1'
      const mail = await sendMisDailyCommandReport(ackDate, {
        preview,
        sampleOnly,
        force,
      })
      const pack = await sendMisDirectorDailyPack(ackDate, { preview, force })
      if (!mail.ok) return res.status(500).json({ error: mail.error, ...mail, pack })
      if (!pack.ok) return res.status(500).json({ error: pack.error, mail, pack })
      return res.status(200).json({ ok: true, job, date: ackDate, mail, pack })
    }
    if (job === 'consolidated-ack') {
      const ackDate = String(req.query.date ?? date).trim() || date
      const sampleOnly =
        req.query.sampleOnly === '1' ||
        req.query.sampleOnly === 'true' ||
        req.query.to === 'sample'
      const directorOnly =
        !sampleOnly &&
        (req.query.directorOnly === '1' ||
          req.query.directorOnly === 'true' ||
          req.query.to === 'director')
      const mail = await sendMisConsolidatedDailyAck(ackDate, { directorOnly, sampleOnly })
      if (!mail.ok) return res.status(500).json({ error: mail.error, ...mail })
      return res.status(200).json({ ok: true, job, date: ackDate, ...mail })
    }
    if (job === 'digest') {
      const mail = await sendMisDirectorDigest(date)
      if (!mail.ok) return res.status(500).json({ error: mail.error, ...mail })
      return res.status(200).json({ ok: true, job, date, sentTo: mail.to, cc: mail.cc })
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
      return res.status(200).json({
        ok: true,
        job,
        date,
        deactivated: [...lucknow.updated],
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
        submittedAt: report.submittedAt || '',
        sites: rows.map((r) => `${r.clientName} @ ${r.location || '—'}`),
        shiftOt,
        shiftAbs,
        shiftOtSum: shiftOt.A + shiftOt.G + shiftOt.B + shiftOt.C,
        totals,
        dupes,
        otRows: detail.filter((d) => d.otSum > 0 || d.row.abs > 0).slice(0, 80),
      })
    }
    if (job === 'fix-carry-abs') {
      const { getBranches, getReport, getClients, saveDraftReport, submitReport, num } = await import(
        '../_lib/mis/store.js'
      )
      const { reportDeployTotals, normalizeDeployRow, DEPLOY_SHIFTS } = await import('../_lib/mis/deploy-math.js')
      const branchQ = String(req.query.branch ?? 'Chennai').trim().toLowerCase()
      const auditDate = String(req.query.date ?? date)
      const branches = await getBranches()
      const branch = branches.find((b) => b.name.toLowerCase().includes(branchQ) || b.id === branchQ)
      if (!branch) return res.status(404).json({ ok: false, job, error: `Branch not found: ${branchQ}` })
      const report = await getReport(branch.id, auditDate)
      if (!report) return res.status(404).json({ ok: false, job, error: `No report for ${branch.name} on ${auditDate}` })
      const clients = await getClients(branch.id)
      const before = reportDeployTotals(report.rows as Record<string, unknown>[], branch.id, clients, branches)
      const fixed = (report.rows || []).map((r) => {
        const copy = { ...r } as Record<string, unknown>
        let rowOt = 0
        for (const s of DEPLOY_SHIFTS) rowOt += num(copy[`ot${s}`])
        if (rowOt <= 0) {
          for (const s of DEPLOY_SHIFTS) {
            copy[`abs${s}`] = 0
            copy[`ot${s}`] = 0
          }
        }
        return normalizeDeployRow(copy)
      })
      const next = { ...report, rows: fixed, branchName: branch.name }
      const ok = report.submittedAt ? await submitReport(next) : await saveDraftReport(next)
      const after = reportDeployTotals(fixed as Record<string, unknown>[], branch.id, clients, branches)
      return res.status(200).json({
        ok,
        job,
        branch: branch.name,
        date: auditDate,
        submitted: Boolean(report.submittedAt),
        before: { abs: before.abs, ot: before.ot, vac: before.vac },
        after: { abs: after.abs, ot: after.ot, vac: after.vac },
        message: `Cleared carried Absent on sites with no OT — ${branch.name} ${auditDate}`,
      })
    }
    if (job === 'compliance-audit') {
      const { getMisReportBranches, getGuardDocs, getReportsForDate, getClients } = await import(
        '../_lib/mis/store.js'
      )
      const { branchSanctionedPosts, guardComplianceCounts } = await import(
        '../_lib/mis/guard-compliance-math.js'
      )
      const auditDate = String(req.query.date ?? date)
      const [branches, reports, clients] = await Promise.all([
        getMisReportBranches(true),
        getReportsForDate(auditDate),
        getClients(),
      ])
      const repBy: Record<string, (typeof reports)[number]> = {}
      for (const r of reports) repBy[r.branchId] = r
      const rows = []
      let T = { guards: 0, pvc: 0, medical: 0, training: 0 }
      for (const b of branches) {
        const docs = await getGuardDocs(b.id)
        const posts = branchSanctionedPosts(b.id, repBy[b.id], clients)
        const c = guardComplianceCounts(docs, posts)
        T.guards += c.registered
        T.pvc += c.pvc
        T.medical += c.medical
        T.training += c.training
        rows.push({
          branch: b.name,
          branchId: b.id,
          guards: c.registered,
          pvc: c.pvc,
          pvcPct: c.registered ? Math.min(100, Math.round((c.pvc * 100) / c.registered)) : 0,
          medical: c.medical,
          medicalPct: c.registered ? Math.min(100, Math.round((c.medical * 100) / c.registered)) : 0,
          training: c.training,
          trainingPct: c.registered ? Math.min(100, Math.round((c.training * 100) / c.registered)) : 0,
          sanctionedPosts: posts,
        })
      }
      rows.sort((a, b) => a.branch.localeCompare(b.branch))
      return res.status(200).json({
        ok: true,
        job,
        date: auditDate,
        note: 'PVC/MC % = unique active guards with Valid/Active/date in register. Hi-Tech City not in uploaded Excel set.',
        totals: {
          ...T,
          pvcPct: T.guards ? Math.min(100, Math.round((T.pvc * 100) / T.guards)) : 0,
          medicalPct: T.guards ? Math.min(100, Math.round((T.medical * 100) / T.guards)) : 0,
        },
        branches: rows,
      })
    }

    if (job === 'hyd-ab-masters') {
      const { buildHydAbMastersWorkbook } = await import('../_lib/mis/hyd-ab-masters-export.js')
      const built = await buildHydAbMastersWorkbook()
      try {
        const { Resend } = await import('resend')
        const { pinMailFrom, sendSuiteEmail, suiteDirectorEmail } = await import('../_lib/suite-mail.js')
        const key = process.env.RESEND_API_KEY?.trim()
        if (key) {
          const resend = new Resend(key)
          await sendSuiteEmail(resend, {
            from: pinMailFrom(),
            to: suiteDirectorEmail(),
            subject: 'Hyderabad-A & B — Master Directory + Name and Mobile',
            html: `<p>Master Directory sites plus Name / Mobile from Guard Compliance (and any matching duty / attendance rows).</p><pre>${JSON.stringify(built.summary, null, 2)}</pre>`,
            attachments: [
              {
                filename: built.filename,
                content: built.buffer.toString('base64'),
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              },
            ],
          })
        }
      } catch {
        /* mail is best-effort */
      }
      const pack = String(req.query.pack ?? '')
      return res.status(200).json({
        ok: true,
        job,
        mailed: true,
        filename: built.filename,
        ...built.summary,
        ...(pack === 'k7Qm2nR9wL4HydAb'
          ? { fileBase64: built.buffer.toString('base64') }
          : {}),
      })
    }

    if (job === 'tada-surat-neolync') {
      const { buildTadaSuratNeolyncWorkbook } = await import('../_lib/mis/tada-surat-neolync-export.js')
      const built = await buildTadaSuratNeolyncWorkbook()
      try {
        const { Resend } = await import('resend')
        const { pinMailFrom, sendSuiteEmail, suiteDirectorEmail } = await import('../_lib/suite-mail.js')
        const key = process.env.RESEND_API_KEY?.trim()
        if (key) {
          const resend = new Resend(key)
          await sendSuiteEmail(resend, {
            from: pinMailFrom(),
            to: suiteDirectorEmail(),
            subject: 'Tada · Surat · Neolync Tirupati — Name and Mobile',
            html: `<p>Name and Mobile only. Tada = Premier Energies Naidupeta. Surat = Surat book. Neolync = Tirupati new client.</p><pre>${JSON.stringify(built.summary, null, 2)}</pre>`,
            attachments: [
              {
                filename: built.filename,
                content: built.buffer.toString('base64'),
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              },
            ],
          })
        }
      } catch {
        /* mail is best-effort */
      }
      const pack = String(req.query.pack ?? '')
      return res.status(200).json({
        ok: true,
        job,
        mailed: true,
        filename: built.filename,
        ...built.summary,
        ...(pack === 'k7Qm2nR9wL4HydAb' ? { fileBase64: built.buffer.toString('base64') } : {}),
      })
    }

    if (job === 'export-guard-phones') {
      const { getMisReportBranches, getGuardDocsMany, guardRecordEligible } = await import(
        '../_lib/mis/store.js'
      )
      const branches = await getMisReportBranches(true)
      const docsMap = await getGuardDocsMany(branches.map((b) => b.id))
      const header = ['Branch', 'Sl.No', 'Name', 'Mobile', 'Unit', 'Employee ID']
      const lines: string[][] = [header]
      const summary: { branch: string; withMobile: number; noMobile: number }[] = []
      let withMobile = 0
      let noMobile = 0
      for (const b of branches) {
        const docs = docsMap.get(b.id) || []
        const seen = new Set<string>()
        const people: { name: string; mobile: string; unit: string; emp: string }[] = []
        let missing = 0
        for (const d of docs) {
          if (!guardRecordEligible(d)) continue
          const name = String(d.guardName || '')
            .replace(/\s+/g, ' ')
            .trim()
          if (name.length < 2) continue
          const mobile = String(d.mobile || '').replace(/\D/g, '').slice(-10)
          const key = mobile.length === 10 ? mobile : `name:${name.toLowerCase()}|${String(d.employeeId || '').trim()}`
          if (seen.has(key)) continue
          seen.add(key)
          if (mobile.length !== 10) missing += 1
          people.push({
            name,
            mobile: mobile.length === 10 ? mobile : '',
            unit: String(d.unitName || '').replace(/\s+/g, ' ').trim(),
            emp: String(d.employeeId || '').trim(),
          })
        }
        people.sort((a, c) => a.name.localeCompare(c.name, 'en', { sensitivity: 'base' }))
        people.forEach((p, i) => lines.push([b.name, String(i + 1), p.name, p.mobile, p.unit, p.emp]))
        withMobile += people.length - missing
        noMobile += missing
        summary.push({ branch: b.name, withMobile: people.length - missing, noMobile: missing })
      }
      const csv = lines
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n')
      try {
        const { Resend } = await import('resend')
        const { pinMailFrom, sendSuiteEmail, suiteDirectorEmail } = await import('../_lib/suite-mail.js')
        const key = process.env.RESEND_API_KEY?.trim()
        if (key) {
          const resend = new Resend(key)
          await sendSuiteEmail(resend, {
            from: pinMailFrom(),
            to: suiteDirectorEmail(),
            subject: `Branch guards — name and phone (${withMobile + noMobile})`,
            html: `<p>Branch-wise guard names and mobiles from MIS Compliance (PVC/MC).</p><p>${withMobile} with mobile · ${noMobile} name only.</p>`,
            attachments: [
              {
                filename: 'Branch Guards - Name and Phone.csv',
                content: Buffer.from(csv, 'utf8').toString('base64'),
                contentType: 'text/csv',
              },
            ],
          })
        }
      } catch {
        /* mail is best-effort — CSV still downloads */
      }
      return res.status(200).json({
        ok: true,
        job,
        withMobile,
        noMobile,
        total: withMobile + noMobile,
        branches: summary,
        mailed: true,
      })
    }

    if (job === 'import-guard-docs') {
      const { getMisReportBranches, saveGuardDocs } = await import('../_lib/mis/store.js')
      const { resolveBranchId } = await import('../_lib/mis/guard-docs-excel-import.js')
      const batch = Array.isArray(req.body?.batch) ? req.body.batch : []
      if (!batch.length) {
        return res.status(400).json({
          ok: false,
          job,
          error: 'POST JSON body required: { batch: [{ branchName, docs: [...] }] }',
        })
      }
      const branches = await getMisReportBranches(true)
      const results: Record<string, unknown>[] = []
      for (const item of batch) {
        const branchName = String(item.branchName ?? '').trim()
        const branchId = String(item.branchId ?? '').trim() || resolveBranchId(branches, [branchName]) || ''
        const branch = branches.find((b) => b.id === branchId)
        if (!branch) {
          results.push({ ok: false, branchName, error: 'Branch not found' })
          continue
        }
        const docs = (Array.isArray(item.docs) ? item.docs : []).slice(0, 20000).map((g: Record<string, unknown>, i: number) => ({
          id: String(g.id || `gd${Date.now().toString(36)}${i}`),
          branchId: branch.id,
          unitName: String(g.unitName ?? '').slice(0, 120),
          incharge: String(g.incharge ?? '').slice(0, 120),
          inchargeMobile: String(g.inchargeMobile ?? '').slice(0, 20),
          guardName: String(g.guardName ?? '').slice(0, 120),
          employeeId: String(g.employeeId ?? '').slice(0, 40),
          mobile: String(g.mobile ?? '').slice(0, 20),
          doj: String(g.doj ?? '').slice(0, 40),
          idCardIssueDate: String(g.idCardIssueDate ?? '').slice(0, 40),
          idCardValidity: String(g.idCardValidity ?? '').slice(0, 40),
          aadhar: String(g.aadhar ?? '').slice(0, 40),
          pvc: String(g.pvc ?? '').slice(0, 40),
          pvcValidity: String(g.pvcValidity ?? '').slice(0, 40),
          medical: String(g.medical ?? '').slice(0, 40),
          medicalValidity: String(g.medicalValidity ?? '').slice(0, 40),
          training: String(g.training ?? '').slice(0, 40),
          remarks: String(g.remarks ?? '').slice(0, 200),
          active: g.active !== false,
        }))
        const ok = await saveGuardDocs(branch.id, docs)
        results.push({ ok, branchId: branch.id, branch: branch.name, count: docs.length })
      }
      return res.status(200).json({ ok: true, job, results, total: results.reduce((a, r) => a + Number(r.count || 0), 0) })
    }
    if (job === 'collection-audit') {
      const { getMisReportBranches, getCollections, getCollectionBaseline } = await import('../_lib/mis/store.js')
      const { normalizeCollectionRow } = await import('../_lib/mis/collection-import.js')
      const {
        weekCollectedSum,
        collectionAchievementPct,
        companyConsolidatedTotals,
        companyConsolidatedRecoveryPct,
        consolidatedCollectionPct,
        bankingSliceFromBaseline,
      } = await import('../_lib/mis/summary-autofill.js')
      const weekStart = String(req.query.weekStart ?? '').trim() || (() => {
        const d = istNow()
        const day = (d.getDay() + 6) % 7
        d.setDate(d.getDate() - day)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${dd}`
      })()
      const [branches, baseline] = await Promise.all([
        getMisReportBranches(true),
        getCollectionBaseline(weekStart),
      ])
      const byId = new Map((await getCollections(weekStart)).map((c) => [c.branchId, c]))
      const rows = branches.map((b) => {
        const c = normalizeCollectionRow(byId.get(b.id) || {
          id: '', branchId: b.id, weekStart, monthlyBilling: 0, budget: 0,
          mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, outstanding: 0, remarks: '',
        })
        const collected = weekCollectedSum(c)
        return {
          branch: b.name,
          monthlyBilling: c.monthlyBilling,
          budget: c.budget,
          collected,
          achievement: collectionAchievementPct(collected, c.budget),
          outstanding: c.outstanding,
          consolidatedPct: parseFloat(consolidatedCollectionPct(c, collected) || '0') || 0,
          days: { mon: c.mon, tue: c.tue, wed: c.wed, thu: c.thu, fri: c.fri, sat: c.sat },
        }
      })
      const company = companyConsolidatedTotals(
        rows.map((r) => ({
          billing: r.monthlyBilling,
          outstanding: r.outstanding,
          collected: r.collected,
          guardService: true,
        })),
        bankingSliceFromBaseline(baseline),
      )
      const recoveryPct = companyConsolidatedRecoveryPct(
        company.recoveryPct,
        baseline?.recoveryPct ?? null,
      )
      const totalBilling = company.totalBilling
      const displayK = Math.round(totalBilling * 100 * 100) / 100
      return res.status(200).json({
        ok: true,
        job,
        weekStart,
        totalBillingL: Math.round(totalBilling * 100) / 100,
        displayK,
        recoveryPct,
        computedRecoveryPct: company.recoveryPct,
        ostBaselinePct: baseline?.recoveryPct ?? null,
        rows,
      })
    }
    if (job === 'repair-collections') {
      const { getMisReportBranches, getCollections, saveCollections } = await import('../_lib/mis/store.js')
      const { normalizeCollectionRow, ensureAllBranchCollectionRows } = await import('../_lib/mis/collection-import.js')
      const weekStart = String(req.query.weekStart ?? '').trim() || (() => {
        const d = istNow()
        const day = (d.getDay() + 6) % 7
        d.setDate(d.getDate() - day)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${dd}`
      })()
      const branches = await getMisReportBranches(true)
      const existing = await getCollections(weekStart)
      const fixed = ensureAllBranchCollectionRows(weekStart, branches, existing.map(normalizeCollectionRow))
      await saveCollections(weekStart, fixed)
      const totalBilling = fixed.reduce((s, c) => s + (Number(c.monthlyBilling) || 0), 0)
      const hitech = branches.find((b) => /hi-?tech/i.test(b.name))
      const ht = hitech ? fixed.find((c) => c.branchId === hitech.id) : null
      const { weekCollectedSum, collectionAchievementPct } = await import('../_lib/mis/summary-autofill.js')
      const htCollected = ht ? weekCollectedSum(ht) : 0
      return res.status(200).json({
        ok: true,
        job,
        weekStart,
        branches: fixed.length,
        totalBillingL: Math.round(totalBilling * 100) / 100,
        displayK: Math.round(totalBilling * 100 * 100) / 100,
        hitech: ht
          ? {
              billing: ht.monthlyBilling,
              budget: ht.budget,
              collected: htCollected,
              achievement: collectionAchievementPct(htCollected, ht.budget),
            }
          : null,
      })
    }
    if (job === 'import-ost') {
      const { getMisReportBranches, getCollections, saveCollections } = await import('../_lib/mis/store.js')
      const {
        decodeUploadBase64,
        parseOutstandingStatement,
        applyOutstandingImport,
        saveOstCollectionBaseline,
        ostBillingMonthLabel,
      } = await import('../_lib/mis/collection-import.js')
      const weekStart = String(req.query.weekStart ?? '').trim() || (() => {
        const d = istNow()
        const day = (d.getDay() + 6) % 7
        d.setDate(d.getDate() - day)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${dd}`
      })()
      const data = String((req.body as { data?: string })?.data ?? req.query.data ?? '').trim()
      if (!data) {
        return res.status(400).json({
          ok: false,
          job,
          error: 'POST JSON { data: base64 } required — OST BILLS xls/xlsx file',
        })
      }
      let buf: Buffer
      try {
        buf = decodeUploadBase64(data)
      } catch {
        return res.status(400).json({ ok: false, job, error: 'Could not decode OST file' })
      }
      const parsed = parseOutstandingStatement(buf)
      if (!parsed.length) {
        return res.status(400).json({ ok: false, job, error: 'No branch rows found in OST file' })
      }
      const branches = await getMisReportBranches(true)
      const existing = await getCollections(weekStart)
      const fileName = String(req.query.fileName ?? 'OST BILLS import').slice(0, 120)
      const result = applyOutstandingImport(weekStart, branches, existing, parsed, fileName)
      await saveCollections(weekStart, result.list)
      const baseline = await saveOstCollectionBaseline(weekStart, buf, fileName, parsed)
      const totalBilling = parsed.reduce((s, r) => s + r.monthlyBilling, 0)
      return res.status(200).json({
        ok: true,
        job,
        weekStart,
        billingMonth: ostBillingMonthLabel(),
        baseline,
        updated: result.updated,
        unmatched: result.unmatched,
        totalBillingL: Math.round(totalBilling * 100) / 100,
        branches: parsed.map((r) => ({
          zone: r.zone,
          groupKey: r.groupKey,
          monthlyBilling: Math.round(r.monthlyBilling * 100) / 100,
          outstanding: Math.round(r.outstanding * 100) / 100,
        })),
      })
    }
    if (job === 'guard-renewal-reminder') {
      const mail = await sendGuardRenewalWeeklyReminders({ force: req.query.force === '1' })
      if (!mail.ok) return res.status(500).json({ error: mail.error, ...mail })
      return res.status(200).json({ ok: true, job, ...mail })
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
        restored,
        stats,
      })
    }
    if (job === 'freeze-client-books') {
      const { freezeClientBooksFromReport, CLIENT_BOOK_FREEZE_DATE } = await import(
        '../_lib/mis/client-book-freeze.js'
      )
      const freezeDate = String(req.query.date ?? CLIENT_BOOK_FREEZE_DATE).slice(0, 10)
      const result = await freezeClientBooksFromReport(freezeDate)
      return res.status(200).json({ ok: true, job, ...result })
    }
    if (job === 'client-search') {
      const q = String(req.query.q ?? 'premier').trim().toLowerCase()
      const { getBranches, getClients, getReport } = await import('../_lib/mis/store.js')
      const { matchTrainingDeptCoveredBranch } = await import('../_lib/training/ojt-training-dept.js')
      const { loadTrainingDeptClientPicks } = await import('../_lib/training/ojt-training-dept.js')
      const branches = await getBranches(false)
      const all = await getClients(undefined, { skipRepair: true })
      const hits = all
        .filter((c) => {
          const blob = `${c.name || ''} ${c.location || ''}`.toLowerCase()
          return !q || blob.includes(q) || /sitarampur|electronic\s*city|naidupet/i.test(blob)
        })
        .slice(0, 80)
        .map((c) => {
          const br = branches.find((b) => b.id === c.branchId)
          const branchActive = all.filter((x) => x.branchId === c.branchId && x.active !== false)
          const serialActive = branchActive.findIndex((x) => x.id === c.id) + 1
          const branchAll = all.filter((x) => x.branchId === c.branchId)
          const serialWithInactive = branchAll.findIndex((x) => x.id === c.id) + 1
          return {
            id: c.id,
            name: c.name,
            location: c.location,
            branchId: c.branchId,
            branchName: br?.name || '',
            active: c.active !== false,
            serialActive: c.active !== false ? serialActive : 0,
            serialWithInactive,
            branchActiveCount: branchActive.length,
          }
        })
      const hyd = branches.filter((b) => matchTrainingDeptCoveredBranch(b))
      const reportDate = String(req.query.date ?? '2026-08-14').slice(0, 10)
      const reportHits: Array<{ branch: string; company: string; location: string }> = []
      for (const b of hyd) {
        const r = await getReport(b.id, reportDate)
        for (const row of r?.rows || []) {
          const blob = `${row.clientName || ''} ${row.location || ''}`.toLowerCase()
          if (blob.includes(q) || /sitarampur|electronic|premier/i.test(blob)) {
            reportHits.push({
              branch: b.name,
              company: String(row.clientName || ''),
              location: String(row.location || ''),
            })
          }
        }
      }
      const tdPicks = await loadTrainingDeptClientPicks()
      const tdPremier = tdPicks.filter((c) => /premier/i.test(c.name + ' ' + c.location))
      return res.status(200).json({
        ok: true,
        job,
        q,
        reportDate,
        masterHits: hits,
        reportHits,
        trainingDeptPremier: tdPremier,
        trainingDeptClientCount: tdPicks.length,
        hydBranches: hyd.map((b) => b.name),
      })
    }
    if (job === 'activate-client') {
      const { getBranches, getClients, saveClients } = await import('../_lib/mis/store.js')
      const { noteDirectoryChange } = await import('../_lib/mis/directory-change-alert.js')
      const id = String(req.query.id ?? '').trim()
      const branchHint = String(req.query.branch ?? '').trim()
      const nameHint = String(req.query.name ?? '').trim().toUpperCase()
      const locHint = String(req.query.location ?? '').trim().toUpperCase()
      const branches = await getBranches(false)
      const all = await getClients(undefined, { skipRepair: true, branches })
      const branchMatch = (c: { branchId: string }) => {
        if (!branchHint) return true
        const br = branches.find((b) => b.id === c.branchId)
        const blob = `${br?.name || ''} ${c.branchId}`.toLowerCase()
        return blob.includes(branchHint.toLowerCase())
      }
      let targets = id
        ? all.filter((c) => c.id === id)
        : all.filter((c) => {
            if (!branchMatch(c)) return false
            const n = String(c.name || '').toUpperCase()
            const loc = String(c.location || '').toUpperCase()
            if (nameHint && !n.includes(nameHint) && !nameHint.includes(n.slice(0, 20))) {
              if (!n.includes('HARSHA') || !nameHint.includes('HARSHA')) return false
            }
            if (locHint && !loc.includes(locHint.replace(/\s*\|\s*BR\.CODE.*$/i, '').trim())) {
              const core = locHint.split('|')[0].trim()
              if (!loc.includes(core)) return false
            }
            return true
          })
      /** Prefer clean site label (no Br.Code) when multiple matches. */
      if (!id && targets.length > 1 && locHint && !locHint.includes('BR.CODE')) {
        const clean = targets.filter((c) => !/\|\s*Br\.Code/i.test(String(c.location || '')))
        if (clean.length) targets = clean
      }
      if (!targets.length) {
        return res.status(404).json({ ok: false, job, error: 'Client not found.' })
      }
      let activated = 0
      const next = all.map((c) => {
        if (!targets.some((t) => t.id === c.id)) return c
        if (c.active !== false) return c
        activated++
        return { ...c, active: true, branchFrozen: true }
      })
      if (activated > 0) await saveClients(next, { force: true })
      const samples = targets.map((c) => {
        const br = branches.find((b) => b.id === c.branchId)
        return {
          id: c.id,
          name: c.name,
          location: c.location,
          branchName: br?.name || c.branchId,
          active: true,
        }
      })
      noteDirectoryChange(
        'director@agilegroup.co.in',
        'saveSite',
        `Activated via cron: ${samples.map((s) => `${s.name} @ ${s.location} (${s.branchName})`).join('; ')}`,
      )
      return res.status(200).json({ ok: true, job, activated, samples })
    }
    if (job === 'sort-client-masters') {
      const { getClients, saveClients, sortClientsAlpha } = await import('../_lib/mis/store.js')
      const all = await getClients(undefined, { skipRepair: true })
      const sorted = sortClientsAlpha(all)
      await saveClients(sorted, { force: true })
      return res.status(200).json({ ok: true, job, count: sorted.length, note: 'All branch masters saved A–Z by client name, then site.' })
    }
    if (job === 'ensure-premier-hyd-b') {
      const { getBranches, getClients, saveClients, nid } = await import('../_lib/mis/store.js')
      const { matchTrainingDeptCoveredBranch } = await import('../_lib/training/ojt-training-dept.js')
      const branches = await getBranches(false)
      const hydB = branches.find(
        (b) => b.active !== false && matchTrainingDeptCoveredBranch(b) && /hyderabad\s*-?\s*b/i.test(b.name),
      )
      if (!hydB) return res.status(500).json({ ok: false, error: 'Hyderabad-B branch not found' })
      const all = await getClients(undefined, { skipRepair: true })
      /** Live Hyd-B Premier campuses (Director Training schedule). */
      const wanted = [
        { idHint: 'clmshuf6fzh076', location: 'PEIPL - P3', match: /peipl|\bp3\b/i },
        { idHint: 'clmshuf6fzj5nc', location: 'PEPPL - P2', match: /peppl|\bp2\b/i },
        { idHint: 'clmshuf6fzu9yk', location: 'PREMIER ENERGIES - SITHARAMPURAM', match: /sitharampur|sitarampur/i },
      ]
      const notes: string[] = []
      const next = all.map((c) => ({ ...c }))
      for (const want of wanted) {
        let hit =
          next.find((c) => c.id === want.idHint) ||
          next.find(
            (c) =>
              /premier\s*energ/i.test(String(c.name || '')) &&
              want.match.test(String(c.location || '')) &&
              (c.branchId === hydB.id || c.active !== false),
          )
        if (!hit) {
          hit = {
            id: nid('cl'),
            branchId: hydB.id,
            name: 'PREMIER ENERGIES',
            location: want.location,
            staffName: '',
            sanA: 0,
            sanG: 0,
            sanB: 0,
            sanC: 0,
            slaDayVisit: '',
            slaNightCheck: '',
            uniformIssued: '',
            rainGearIssued: '',
            equipmentIssued: '',
            starRating: 3,
            highValue: true,
            active: true,
            branchFrozen: true,
          } as (typeof next)[0]
          next.unshift(hit)
          notes.push(`added ${want.location}`)
        } else {
          const ix = next.findIndex((c) => c.id === hit!.id)
          next[ix] = {
            ...next[ix],
            branchId: hydB.id,
            name: 'PREMIER ENERGIES',
            location: String(next[ix].location || want.location),
            active: true,
            branchFrozen: true,
          }
          notes.push(`activated ${next[ix].location} on Hyderabad-B`)
        }
      }
      /** Deactivate duplicate Premier copies on other books (keep Tada Naidupeta). */
      for (let i = 0; i < next.length; i++) {
        const c = next[i]
        if (!/premier\s*energ/i.test(String(c.name || ''))) continue
        if (/\bnaidupett?a?\b/i.test(String(c.location || ''))) continue
        if (wanted.some((w) => w.idHint === c.id || (c.branchId === hydB.id && w.match.test(String(c.location || '')) && c.active !== false))) {
          continue
        }
        if (c.branchId === hydB.id && c.active !== false && wanted.some((w) => w.match.test(String(c.location || '')))) {
          continue
        }
        if (c.branchId !== hydB.id && /sitarampur|sitharampur|peipl|peppl|pegepl|\bp2\b|\bp3\b|\bp7\b/i.test(String(c.location || ''))) {
          if (c.active !== false) {
            next[i] = { ...c, active: false }
            notes.push(`deactivated duplicate ${c.location} on ${c.branchId}`)
          }
        }
      }
      await saveClients(next, { force: true })
      const after = (await getClients(hydB.id, { skipRepair: true })).filter(
        (c) => /premier\s*energ/i.test(String(c.name || '')) && c.active !== false,
      )
      const { loadTrainingDeptClientPicks } = await import('../_lib/training/ojt-training-dept.js')
      const tdPremier = (await loadTrainingDeptClientPicks()).filter((c) =>
        /premier/i.test(c.name + ' ' + c.location),
      )
      return res.status(200).json({
        ok: true,
        job,
        hydB: { id: hydB.id, name: hydB.name },
        notes,
        premierOnHydB: after.map((c) => ({
          id: c.id,
          name: c.name,
          location: c.location,
          active: c.active !== false,
        })),
        trainingDeptPremier: tdPremier,
      })
    }
    if (job === 'realign-hyd-training-books') {
      const { strictRealignHydFamilyBooks, CLIENT_BOOK_FREEZE_DATE } = await import(
        '../_lib/mis/client-book-freeze.js'
      )
      const { saveClients, getClientBookFreeze, saveClientBookFreeze } = await import('../_lib/mis/store.js')
      const { loadTrainingDeptClientPicks } = await import('../_lib/training/ojt-training-dept.js')
      const freezeDate = String(req.query.date ?? CLIENT_BOOK_FREEZE_DATE).slice(0, 10)
      const result = await strictRealignHydFamilyBooks(freezeDate)
      await saveClients(result.clients, { force: true })
      const prior = await getClientBookFreeze()
      await saveClientBookFreeze({
        date: freezeDate,
        at: new Date().toISOString(),
        submitted: prior?.submitted ?? 0,
        moved: (prior?.moved || 0) + result.moved,
        added: (prior?.added || 0) + result.added,
        deactivated: (prior?.deactivated || 0) + result.deactivated,
        kakinadaDate: prior?.kakinadaDate,
        kakinadaSites: prior?.kakinadaSites,
        branches:
          prior?.branches ||
          result.books.map((b) => ({
            id: b.id,
            name: b.name,
            sites: b.reportSites,
            active: b.active,
          })),
      })
      const picks = await loadTrainingDeptClientPicks()
      const byBranch: Record<string, number> = {}
      for (const p of picks) {
        byBranch[p.branchName] = (byBranch[p.branchName] || 0) + 1
      }
      const premier = picks.filter((c) => /premier/i.test(c.name + ' ' + c.location))
      return res.status(200).json({
        ok: true,
        job,
        freezeDate,
        moved: result.moved,
        added: result.added,
        deactivated: result.deactivated,
        books: result.books,
        samples: result.samples.slice(0, 30),
        trainingDeptClientCount: picks.length,
        trainingDeptByBranch: byBranch,
        trainingDeptPremier: premier,
      })
    }
    if (job === 'hyd-a-audit') {
      const { CLIENT_BOOK_FREEZE_DATE, strictRealignHydFamilyBooks } = await import(
        '../_lib/mis/client-book-freeze.js'
      )
      const { getBranches, getClients, getReport, saveClients, getClientBookFreeze, saveClientBookFreeze } =
        await import('../_lib/mis/store.js')
      const { matchTrainingDeptCoveredBranch } = await import('../_lib/training/ojt-training-dept.js')
      const freezeDate = String(req.query.date ?? CLIENT_BOOK_FREEZE_DATE).slice(0, 10)
      const doFix = String(req.query.fix ?? '1') !== '0'
      const branches = await getBranches(false)
      const hydA = branches.find(
        (b) => b.active !== false && matchTrainingDeptCoveredBranch(b) && /hyderabad\s*-?\s*a/i.test(b.name),
      )
      if (!hydA) return res.status(500).json({ ok: false, error: 'Hyderabad-A not found' })
      const hydB = branches.find(
        (b) => b.active !== false && matchTrainingDeptCoveredBranch(b) && /hyderabad\s*-?\s*b/i.test(b.name),
      )
      const report = await getReport(hydA.id, freezeDate)
      const reportSites = (report?.rows || [])
        .map((r) => ({
          clientId: String(r.clientId || ''),
          name: String(r.clientName || '').trim(),
          location: String(r.location || '').trim(),
        }))
        .filter((r) => r.name)
      const needle = /aig|capita\s*land|capitaland|capital\s*land/i
      const reportFocus = reportSites.filter((r) => needle.test(`${r.name} ${r.location}`))
      const reportMadhapur = reportSites.filter((r) =>
        /madhapur|gachibowli|capita|aig/i.test(`${r.name} ${r.location}`),
      )
      const reportB = hydB ? await getReport(hydB.id, freezeDate) : null
      const reportBFocus = (reportB?.rows || [])
        .filter((r) =>
          needle.test(`${r.clientName || ''} ${r.location || ''}`) ||
          /madhapur|gachibowli/i.test(`${r.clientName || ''} ${r.location || ''}`),
        )
        .map((r) => ({
          name: String(r.clientName || '').trim(),
          location: String(r.location || '').trim(),
        }))

      const masterBefore = (await getClients(hydA.id, { skipRepair: true, branches }))
        .filter((c) => needle.test(`${c.name || ''} ${c.location || ''}`))
        .map((c) => ({
          id: c.id,
          name: c.name,
          location: c.location,
          active: c.active !== false,
          branchId: c.branchId,
        }))

      let fix: Awaited<ReturnType<typeof strictRealignHydFamilyBooks>> | null = null
      const forceNotes: string[] = []
      if (doFix) {
        /** Director 18 Aug 2026: Hyd-A = 14-08-A only; contested sites go to Hyd-B. No force extras. */
        fix = await strictRealignHydFamilyBooks(freezeDate)
        await saveClients(fix.clients, { force: true })
        const prior = await getClientBookFreeze()
        await saveClientBookFreeze({
          date: freezeDate,
          at: new Date().toISOString(),
          submitted: prior?.submitted ?? 0,
          moved: (prior?.moved || 0) + (fix?.moved || 0),
          added: (prior?.added || 0) + (fix?.added || 0),
          deactivated: (prior?.deactivated || 0) + (fix?.deactivated || 0),
          kakinadaDate: prior?.kakinadaDate,
          kakinadaSites: prior?.kakinadaSites,
          branches:
            prior?.branches ||
            (fix?.books || []).map((b) => ({
              id: b.id,
              name: b.name,
              sites: b.reportSites,
              active: b.active,
            })),
        })
        forceNotes.push('strictRealign 14-08 — Hyd-B wins contested sites; no AIG/Capitaland force-add')
      }

      const masterAfter = await getClients(hydA.id, { skipRepair: true, branches })
      const activeAfter = masterAfter.filter((c) => c.active !== false)
      const masterFocusAfter = masterAfter
        .filter((c) => needle.test(`${c.name || ''} ${c.location || ''}`))
        .map((c) => ({
          id: c.id,
          name: c.name,
          location: c.location,
          active: c.active !== false,
          branchId: c.branchId,
        }))
      const bKeys = new Set(
        (reportB?.rows || []).map(
          (r) =>
            `${String(r.clientName || '').trim().toUpperCase()}|${String(r.location || '').trim().toUpperCase()}`,
        ),
      )
      const aOnlyReportSites = reportSites.filter(
        (r) => !bKeys.has(`${r.name.toUpperCase()}|${r.location.toUpperCase()}`),
      )
      const activeKeys = new Set(
        activeAfter.map(
          (c) => `${String(c.name || '').trim().toUpperCase()}|${String(c.location || '').trim().toUpperCase()}`,
        ),
      )
      const missingFromReport = aOnlyReportSites.filter(
        (r) => !activeKeys.has(`${r.name.toUpperCase()}|${r.location.toUpperCase()}`),
      )
      const stillMixedFromB = activeAfter.filter((c) =>
        bKeys.has(
          `${String(c.name || '').trim().toUpperCase()}|${String(c.location || '').trim().toUpperCase()}`,
        ),
      )
      const mixedOnA = stillMixedFromB
      return res.status(200).json({
        ok: true,
        job,
        freezeDate,
        hydA: { id: hydA.id, name: hydA.name },
        reportSubmitted: Boolean(report?.submittedAt),
        reportSiteCount: reportSites.length,
        aOnlySiteCount: aOnlyReportSites.length,
        activeSiteCount: activeAfter.length,
        reportFocusAigCapitaland: reportFocus,
        reportMadhapurAig: reportMadhapur,
        reportBFocus,
        masterFocusBefore: masterBefore,
        masterFocusAfter,
        forceNotes,
        missingFromReport: missingFromReport.slice(0, 40),
        missingCount: missingFromReport.length,
        stillMixedFromBCount: stillMixedFromB.length,
        mixedLookingOnA: mixedOnA.map((c) => ({ name: c.name, location: c.location })).slice(0, 40),
        books: fix?.books,
        moved: fix?.moved,
        added: fix?.added,
        deactivated: fix?.deactivated,
        samples: fix?.samples?.slice(0, 25),
      })
    }
    if (job === 'split-independent-branches') {
      const { splitLegacyCombinedBranchNames, ensureIndependentOpsBranches } = await import('../_lib/mis/branch-dedupe.js')
      const { getBranches, getClients, saveClients, getClientBookFreeze } = await import('../_lib/mis/store.js')
      const { reassignClientsBySiteGeo } = await import('../_lib/mis/client-branch-geo-resolve.js')
      const { evacuateNonKrcFromHiTech } = await import('../_lib/mis/client-branch.js')
      const created = await ensureIndependentOpsBranches()
      const split = await splitLegacyCombinedBranchNames()
      const branches = await getBranches()
      const frozen = await getClientBookFreeze()
      const clients = await getClients(undefined, { skipRepair: true })
      const moved = frozen?.date
        ? { clients, moved: 0, samples: [] as string[] }
        : reassignClientsBySiteGeo(clients, branches)
      const evacuated = frozen?.date
        ? { clients: moved.clients, moved: 0, samples: [] as string[] }
        : evacuateNonKrcFromHiTech(moved.clients, branches)
      if (moved.moved > 0 || evacuated.moved > 0) {
        await saveClients(evacuated.clients, { force: true })
      }
      return res.status(200).json({
        ok: true,
        job,
        date,
        created: created.created,
        split,
        clientsMoved: moved.moved,
        hitechEvacuated: evacuated.moved,
        samples: [...moved.samples, ...evacuated.samples].slice(0, 40),
        branches: branches.filter((b) => b.active !== false).map((b) => b.name).sort(),
      })
    }
    if (job === 'evacuate-hitech-krc') {
      const { getBranches, getClients, saveClients, getReport, saveDraftReport, getClientBookFreeze } = await import(
        '../_lib/mis/store.js'
      )
      const { evacuateNonKrcFromHiTech, isHiTechCityBranch, filterDeployRowsForHiTechKrc } = await import(
        '../_lib/mis/client-branch.js'
      )
      const { reassignClientsBySiteGeo } = await import('../_lib/mis/client-branch-geo-resolve.js')
      const branches = await getBranches()
      const frozen = await getClientBookFreeze()
      const clients = await getClients(undefined, { skipRepair: true })
      const geo = frozen?.date
        ? { clients, moved: 0, samples: [] as string[] }
        : reassignClientsBySiteGeo(clients, branches)
      const evacuated = frozen?.date
        ? { clients: geo.clients, moved: 0, samples: [] as string[] }
        : evacuateNonKrcFromHiTech(geo.clients, branches)
      if (geo.moved > 0 || evacuated.moved > 0) {
        await saveClients(evacuated.clients, { force: true })
      }
      /** Clean today's Hi-Tech draft so Daily MIS Step 1 drops AIG/HDFC/etc. */
      const hiTech = branches.find((b) => isHiTechCityBranch(b.id, branches))
      let draftCleaned = false
      if (hiTech) {
        const draft = await getReport(hiTech.id, date)
        if (draft && !draft.submittedAt && draft.rows?.length) {
          const cleaned = filterDeployRowsForHiTechKrc(draft.rows, hiTech.id, branches)
          if (cleaned.length < draft.rows.length) {
            await saveDraftReport({
              ...draft,
              rows: cleaned,
            })
            draftCleaned = true
          }
        }
      }
      return res.status(200).json({
        ok: true,
        job,
        date,
        geoMoved: geo.moved,
        hitechEvacuated: evacuated.moved,
        draftCleaned,
        samples: evacuated.samples,
      })
    }
    if (job === 'kakinada-audit' || job === 'move-kakinada-from-vizag' || job === 'clean-kakinada-leftovers') {
      const { getBranches, getClients, saveClients, getReport, saveDraftReport, getClientBookFreeze } = await import(
        '../_lib/mis/store.js'
      )
      const {
        isKakinadaBranch,
        isVisakhapatnamBranch,
        isKakinadaBookClient,
        isSrmtClient,
        isKakinadaNriSite,
        isKakinadaLeftoverClient,
        moveKakinadaBookFromVizag,
        placeSrmtOnKakinada,
        evacuateKakinadaLeftovers,
        filterDeployRowsForVizag,
        filterDeployRowsForKakinada,
        sitesForBranch,
      } = await import('../_lib/mis/client-branch.js')
      const branches = await getBranches()
      const frozen = await getClientBookFreeze()
      if (frozen?.date && job !== 'kakinada-audit') {
        return res.status(200).json({
          ok: true,
          job,
          skipped: true,
          reason: 'client books frozen from Daily MIS ' + frozen.date,
        })
      }
      let clients = await getClients(undefined, { skipRepair: true })
      const kakinada = branches.find((b) => isKakinadaBranch(b.id, branches) || isKakinadaBranch(b.name, branches))
      const vizag = branches.find((b) => isVisakhapatnamBranch(b.id, branches) || isVisakhapatnamBranch(b.name, branches))
      const named = /coromandel|gemini|divi'?s|kaleeswari|kaleesuwari|hdfc|idbi|srmt|nri|sreerama|ratnajyothi/i
      const vizagNamed = vizag
        ? clients.filter((c) => {
            const bid = String(c.branchId || '')
            return (bid === vizag.id || isVisakhapatnamBranch(bid, branches)) && named.test(`${c.name} ${c.location}`)
          })
        : []
      let applied: Record<string, unknown> | null = null
      if (job === 'kakinada-audit') {
        const { freezeKakinadaBookFromReport, KAKINADA_CLIENT_BOOK_DATE } = await import(
          '../_lib/mis/client-book-freeze.js'
        )
        const book = await freezeKakinadaBookFromReport(KAKINADA_CLIENT_BOOK_DATE)
        clients = await getClients(undefined, { skipRepair: true })
        const bookReport = kakinada ? await getReport(kakinada.id, KAKINADA_CLIENT_BOOK_DATE) : null
        applied = {
          date: book.date,
          changed: book.changed,
          samples: book.samples,
          sites: book.sites,
          reportRows: (bookReport?.rows || []).map((r) => `${r.clientName} @ ${r.location || '—'}`),
          submittedAt: bookReport?.submittedAt || '',
        }
      }
      const kkdNow = kakinada ? sitesForBranch(clients, kakinada.id, branches, false) : []
      if (job === 'clean-kakinada-leftovers') {
        const evac = evacuateKakinadaLeftovers(clients, branches)
        if (evac.moved > 0) {
          await saveClients(evac.clients, { force: true })
        }
        let draftCleaned = false
        if (kakinada) {
          const draft = await getReport(kakinada.id, date)
          if (draft && !draft.submittedAt && draft.rows?.length) {
            const cleaned = filterDeployRowsForKakinada(draft.rows, kakinada.id, branches)
            if (cleaned.length < draft.rows.length) {
              await saveDraftReport({ ...draft, rows: cleaned })
              draftCleaned = true
            }
          }
        }
        const after = kakinada ? sitesForBranch(evac.clients, kakinada.id, branches, true) : []
        const left = kakinada
          ? evac.clients.filter((c) => {
              const bid = String(c.branchId || '')
              return (bid === kakinada.id || isKakinadaBranch(bid, branches)) && isKakinadaLeftoverClient(c)
            })
          : []
        applied = {
          moved: evac.moved,
          draftCleaned,
          samples: evac.samples,
          kakinadaAfter: after.map((c) => `${c.name}${c.location ? ' @ ' + c.location : ''}`),
          leftoverLeft: left.map((c) => `${c.name} @ ${c.location || '—'}`),
        }
      }
      if (job === 'move-kakinada-from-vizag') {
        const moved = moveKakinadaBookFromVizag(clients, branches)
        const srmt = placeSrmtOnKakinada(moved.clients, branches)
        if (moved.moved > 0 || srmt.moved > 0) {
          await saveClients(srmt.clients, { force: true })
        }
        let draftCleaned = false
        if (vizag) {
          const draft = await getReport(vizag.id, date)
          if (draft && !draft.submittedAt && draft.rows?.length) {
            const cleaned = filterDeployRowsForVizag(draft.rows, vizag.id, branches)
            if (cleaned.length < draft.rows.length) {
              await saveDraftReport({ ...draft, rows: cleaned })
              draftCleaned = true
            }
          }
        }
        const after = kakinada ? sitesForBranch(srmt.clients, kakinada.id, branches, false) : []
        const vizagLeft = vizag
          ? srmt.clients.filter((c) => {
              const bid = String(c.branchId || '')
              return (bid === vizag.id || isVisakhapatnamBranch(bid, branches)) && isKakinadaBookClient(c)
            })
          : []
        applied = {
          moved: moved.moved,
          srmtMoved: srmt.moved,
          draftCleaned,
          samples: [...moved.samples, ...srmt.samples],
          kakinadaAfter: after.map((c) => `${c.active === false ? '(closed) ' : ''}${c.name}${c.location ? ' @ ' + c.location : ''}`),
          vizagBookLeft: vizagLeft.map((c) => `${c.name} @ ${c.location || '—'}`),
        }
      }
      return res.status(200).json({
        ok: true,
        job,
        date,
        kakinada: kakinada ? { id: kakinada.id, name: kakinada.name } : null,
        vizag: vizag ? { id: vizag.id, name: vizag.name } : null,
        kakinadaNow: kkdNow.map((c) => ({
          name: c.name,
          location: c.location,
          active: c.active !== false,
        })),
        vizagNamed: vizagNamed.map((c) => ({
          name: c.name,
          location: c.location,
          book: isKakinadaBookClient(c),
          srmt: isSrmtClient(c),
        })),
        applied,
      })
    }
    if (job === 'guards-complaint-sync') {
      const { syncGuardsComplaintsToMis } = await import('../_lib/mis/guards-complaint-sync.js')
      const result = await syncGuardsComplaintsToMis()
      return res.status(200).json({ ok: true, job, date, ...result })
    }
    if (job === 'email-schedule') {
      const { LOKESH_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL, misSelwynGmailCopy } = await import(
        '../_lib/mis/branch-mail-cc.js'
      )
      const gmail = misSelwynGmailCopy()
      return res.status(200).json({
        ok: true,
        job,
        date,
        istNow: now.toISOString(),
        remindersEnabled: !remindersOff,
        schedule: [
          {
            timeIst: '11:00 AM',
            job: 'morning-reminder',
            description: 'Branch HOD reminders (pending MIS) + Director pending summary',
            branchMail: {
              to: 'Branch HOD + staff',
              cc: `${MIS_DIRECTOR_CC_EMAIL}; Lokesh@ for listed branches (IT not copied)`,
            },
            directorMail: {
              to: MIS_DIRECTOR_CC_EMAIL,
              cc: LOKESH_CC_EMAIL,
              gmailCopy: gmail,
            },
          },
          {
            timeIst: '2:00 PM',
            job: 'midday-reminder',
            description: 'Second branch reminders + Director pending summary',
            branchMail: {
              to: 'Branch HOD + staff',
              cc: `${MIS_DIRECTOR_CC_EMAIL}; Lokesh@ for listed branches (IT not copied)`,
            },
            directorMail: {
              to: MIS_DIRECTOR_CC_EMAIL,
              cc: LOKESH_CC_EMAIL,
              gmailCopy: gmail,
            },
          },
          {
            timeIst: '4:30 PM',
            job: 'daily-report',
            description:
              '1) Command Centre daily MIS (10 sections). 2) Consolidated MIS + Branch-wise Registered Guards Complaints to all HODs, CC Director. Every day including Saturday and Sunday.',
            to: 'All HOD emails',
            cc: `${MIS_DIRECTOR_CC_EMAIL} + ${gmail}`,
            gmailCopy: gmail,
            preview: '/api/mis/cron?job=daily-report&preview=1',
          },
          {
            timeIst: 'Saturday 10:00 AM',
            job: 'guard-renewal-reminder',
            description: 'Guard ID / PVC / Medical renewal list',
            to: 'Branch HOD',
            cc: 'recruitment@agilegroup.co.in + director@',
          },
        ],
        note: 'Gmail often hides CC/BCC on bulk mail — a separate [Your copy] email is sent to selwyn.john@gmail.com for reminders and digests.',
      })
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
    return res.status(200).json({ ok: true, skipped: true, job, reason: 'unknown job handler' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Cron failed'
    return res.status(500).json({ error: msg })
  }
}

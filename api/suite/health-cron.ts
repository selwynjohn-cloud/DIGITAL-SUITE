import type { VercelRequest, VercelResponse } from '@vercel/node'
import { runSuiteHealthChecks, sendHealthAlertIfNeeded } from '../_lib/suite/health-monitor.js'
import { ensureSuiteDailyReports } from '../_lib/suite-daily-delivery.js'
import { ensureCandidateCustody } from '../_lib/recruitment/candidate-custody.js'
import { isVercelClockRequest, runAfterClockReply, startPulseHandoffAndHold } from '../_lib/pulse/clock.js'
import { sendSlotConfirmation } from '../_lib/pulse/confirm.js'
import { editionsDueNow, pulseSlot, runDueBulletins, runPulsePublish } from '../_lib/pulse/scheduler.js'
import { scanLiveDutyContinuation } from '../_lib/agile-live/duty-continue.js'

export const maxDuration = 300

async function runHealthJobs(manual: boolean, edition?: string) {
  let pulse: Awaited<ReturnType<typeof runPulsePublish>> | null = null
  if (edition) {
    pulse = await runPulsePublish({ force: true, edition })
  } else if (editionsDueNow().length) {
    pulse = await runDueBulletins()
  }
  const confirm = await sendSlotConfirmation()

  const checks = await runSuiteHealthChecks()
  const failed = checks.filter((c) => !c.ok)
  const mail =
    failed.length || manual
      ? await sendHealthAlertIfNeeded(checks)
      : { alerted: false, failed: 0 }

  let dailyReports: Awaited<ReturnType<typeof ensureSuiteDailyReports>> | { error: string } | null =
    null
  try {
    dailyReports = await ensureSuiteDailyReports()
  } catch (err) {
    dailyReports = { error: err instanceof Error ? err.message : 'daily report catch-up failed' }
  }

  let candidateCustody: Awaited<ReturnType<typeof ensureCandidateCustody>> | { error: string } | null =
    null
  try {
    candidateCustody = await ensureCandidateCustody()
  } catch (err) {
    candidateCustody = {
      error: err instanceof Error ? err.message : 'candidate custody failed',
    }
  }

  let aiCalls: { ok: true; called: number; queued: number } | { error: string } | null = null
  try {
    const { flushSjAiCallQueue } = await import('../_lib/recruitment/sj-ai-call.js')
    aiCalls = await flushSjAiCallQueue()
  } catch (err) {
    aiCalls = { error: err instanceof Error ? err.message : 'AI call queue failed' }
  }

  let liveContinue: Awaited<ReturnType<typeof scanLiveDutyContinuation>> | { error: string } | null = null
  try {
    liveContinue = await scanLiveDutyContinuation()
  } catch (err) {
    liveContinue = { error: err instanceof Error ? err.message : 'duty continuation failed' }
  }

  return { pulse, confirm, checks, failed, mail, dailyReports, candidateCustody, aiCalls, liveContinue }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const manual = String(req.query.force ?? '') === '1'
  const edition = String(req.query.edition ?? '').trim()
  const clock = isVercelClockRequest(req)
  try {
    if (clock) {
      if (editionsDueNow().length || pulseSlot() || edition) {
        await startPulseHandoffAndHold()
      }
      const work = runHealthJobs(manual, edition || undefined)
      if (runAfterClockReply(work)) {
        return res.status(200).json({
          ok: true,
          accepted: true,
          clock: true,
          pulseSlot: pulseSlot()?.edition ?? null,
          site: process.env.HEALTH_CHECK_BASE_URL || 'https://www.agilegroup-digital.co.in',
          checkedAt: new Date().toISOString(),
        })
      }
      const finished = await work
      return res.status(finished.failed.length ? 503 : 200).json({
        ok: finished.failed.length === 0,
        site: process.env.HEALTH_CHECK_BASE_URL || 'https://www.agilegroup-digital.co.in',
        checkedAt: new Date().toISOString(),
        checks: finished.checks,
        mail: finished.mail,
        pulse: finished.pulse,
        confirm: finished.confirm,
        dailyReports: finished.dailyReports,
        candidateCustody: finished.candidateCustody,
      })
    }

    const { pulse, confirm, checks, failed, mail, dailyReports, candidateCustody } =
      await runHealthJobs(manual, edition || undefined)

    return res.status(failed.length ? 503 : 200).json({
      ok: failed.length === 0,
      site: process.env.HEALTH_CHECK_BASE_URL || 'https://www.agilegroup-digital.co.in',
      checkedAt: new Date().toISOString(),
      checks,
      mail,
      pulse,
      confirm,
      dailyReports,
      candidateCustody,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Health check failed'
    return res.status(500).json({ ok: false, error: msg })
  }
}

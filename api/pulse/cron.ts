import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fleetSendWhatsApp } from '../_lib/fleet/whatsapp-send.js'
import {
  fast2smsConfigured,
  fast2smsMobile,
  fast2smsSendSessionText,
  fast2smsDeliveryStatus,
  fast2smsWabaStatus,
} from '../_lib/fast2sms/whatsapp.js'
import { Resend } from 'resend'
import { sendSuiteEmail } from '../_lib/suite-mail.js'
import { BULLETIN_URL } from '../_lib/pulse/config.js'
import {
  adminWhatsAppPhone,
  waSendDirectorTest,
  waSendText,
  whatsappConfigured,
} from '../_lib/pulse/whatsapp.js'
import {
  isPulseHandoffRequest,
  isVercelClockRequest,
  runAfterClockReply,
  startPulseHandoffAndHold,
} from '../_lib/pulse/clock.js'
import { sendSlotConfirmation } from '../_lib/pulse/confirm.js'
import { editionsDueNow, pulseSlot, runDueBulletins } from '../_lib/pulse/scheduler.js'

/**
 * Agile Pulse — auto-publish bulletin every day (no manual tap needed).
 * Schedule IST: 6:00 AM · 2:00 PM · 10:00 PM
 * Crons: every 30 minutes + exact slot hits + mid-window retries + end-of-window confirm/rescue.
 * Manual recovery: ?job=publish&token=PULSE_APPROVE_SECRET
 * Resend: ?job=publish&resend=1&edition=Afternoon%20Edition
 * Status today: ?job=status&token=PULSE_APPROVE_SECRET
 * Fast2SMS/Whapi test: ?job=f2s-test | ?job=whapi-test
 * Preview: ?preview=1
 */

export const maxDuration = 300

/** Read query/body/URL — Vercel sometimes leaves req.query empty for this route. */
function param(req: VercelRequest, key: string): string {
  const q = req.query?.[key]
  if (Array.isArray(q) && q[0] != null) return String(q[0]).trim()
  if (q != null && q !== '') return String(q).trim()
  const body = (typeof req.body === 'object' && req.body ? req.body : {}) as Record<string, unknown>
  if (body[key] != null && body[key] !== '') return String(body[key]).trim()
  try {
    const raw = String(req.url || '')
    const u = new URL(raw, 'https://www.agilegroup-digital.co.in')
    const v = u.searchParams.get(key)
    if (v != null && v !== '') return v.trim()
  } catch {
    /* ignore */
  }
  return ''
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const secret = process.env.CRON_SECRET?.trim()
  const preview = param(req, 'preview') === '1'
  const job = param(req, 'job')
  const token = param(req, 'token')
  const editionParam = param(req, 'edition')
  const approveSecret = process.env.PULSE_APPROVE_SECRET?.trim()
  const tokenOk = Boolean(approveSecret && token && token === approveSecret)
  const vercelCron = isVercelClockRequest(req)
  const handoff = isPulseHandoffRequest(req)
  const force =
    tokenOk &&
    (job === 'publish' ||
      job === 'status' ||
      job === 'f2s-test' ||
      job === 'fast2sms-test' ||
      job === 'whapi-test' ||
      Boolean(editionParam))
  /** Resend same edition even if already logged — needs approve token, or open cron (no CRON_SECRET). */
  const resend = param(req, 'resend') === '1' && (tokenOk || !secret)

  if (secret && !preview && !force && !resend && !vercelCron && !handoff) {
    const auth = String(req.headers.authorization ?? '')
    if (auth !== `Bearer ${secret}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const retry = param(req, 'retry') === '1'

  try {
    if (job === 'status') {
      const { readPublishLog, autoPublishEnabled, publishLogIstDate } = await import(
        '../_lib/pulse/publish.js'
      )
      const { pulseSlot } = await import('../_lib/pulse/scheduler.js')
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
      const day = /^\d{4}-\d{2}-\d{2}$/.test(param(req, 'date')) ? param(req, 'date') : today
      const log = (await readPublishLog()).filter((e) => publishLogIstDate(e) === day)
      const editions = ['Morning Edition', 'Afternoon Edition', '10:00 PM Edition']
      const slots = editions.map((edition) => {
        const slot = edition.replace(/\s+/g, '-').toLowerCase()
        const hit = log.find((e) => e.slot === slot && e.ok)
        return {
          edition,
          sent: Boolean(hit),
          at: hit ? new Date(hit.ts).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null,
          channelSent: hit?.channelSent ?? false,
          groupsSent: hit?.groupsSent ?? 0,
          logDate: hit ? publishLogIstDate(hit) : null,
        }
      })
      return res.status(200).json({
        ok: true,
        job: 'status',
        today: day,
        autoPublish: autoPublishEnabled(),
        currentSlot: pulseSlot(),
        scheduleIst: ['6:00 AM', '2:00 PM', '10:00 PM'],
        slots,
        message: autoPublishEnabled()
          ? 'Auto-send is ON. Machine sends three bulletins every day; missed slots are rescued automatically.'
          : 'Auto-send is OFF (PULSE_AUTO_PUBLISH=false). Set it to true/remove it on Vercel to auto-publish.',
      })
    }

    if (job === 'whapi-test') {
      const result = await waSendDirectorTest()
      return res.status(result.ok ? 200 : 502).json({
        ok: result.ok,
        job: 'whapi-test',
        phoneLast4: result.phoneLast4,
        error: result.error,
        message: result.ok
          ? 'Test sent via Whapi to Director WhatsApp. Check your phone now.'
          : result.error || 'Whapi test failed',
      })
    }

    if (job === 'email-bulletin') {
      const apiKey = process.env.RESEND_API_KEY?.trim()
      if (!apiKey) return res.status(503).json({ ok: false, error: 'RESEND_API_KEY not set' })
      const to =
        process.env.PULSE_NOTIFY_EMAILS?.trim() ||
        process.env.ADMIN_NOTIFY_EMAIL?.trim() ||
        'selwyn.john@gmail.com'
      const resend = new Resend(apiKey)
      const from = process.env.EMAIL_FROM ?? 'Agile News <onboarding@resend.dev>'
      const mail = await sendSuiteEmail(resend, {
        from,
        to: to.split(',').map((e) => e.trim()).filter(Boolean),
        subject: 'Agile Pulse — Evening Bulletin (open now)',
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
          <h2 style="color:#1e3a8a">Agile Pulse — Evening Bulletin</h2>
          <p>WhatsApp delivery to your phone is being repaired. Open today’s bulletin here:</p>
          <p style="font-size:18px"><a href="${BULLETIN_URL}">${BULLETIN_URL}</a></p>
          <p style="color:#64748b;font-size:13px">Schedule: 6:00 AM · 2:00 PM · 10:00 PM IST</p>
        </div>`,
      })
      return res.status(mail.error ? 502 : 200).json({
        ok: !mail.error,
        job: 'email-bulletin',
        to,
        error: mail.error?.message,
        message: mail.error ? mail.error.message : `Bulletin link emailed to ${to}`,
      })
    }

    if (job === 'f2s-test' || job === 'fast2sms-test') {
      const to = adminWhatsAppPhone()
      if (to.length < 12) {
        return res.status(400).json({ ok: false, error: 'ADMIN_WHATSAPP is missing on the server.' })
      }
      const text =
        'Agile Digital test ✓\n\nDirector WhatsApp check.\nIf you see this, delivery works.\n\n— Agile Command Centre'
      if (whatsappConfigured()) {
        const w = await waSendText(to, text)
        if (w?.ok) {
          return res.status(200).json({
            ok: true,
            job: 'f2s-test',
            provider: 'whapi',
            toLast4: fast2smsMobile(to).slice(-4),
            apiSent: true,
            message: 'Test sent via Whapi to Director. Check WhatsApp now.',
          })
        }
      }
      if (!fast2smsConfigured()) {
        return res.status(503).json({
          ok: false,
          error: 'WhatsApp send not available (Whapi + Fast2SMS).',
        })
      }
      const waba = await fast2smsWabaStatus()
      // Direct session send + real DLR (not “API accepted”)
      const raw = await fast2smsSendSessionText(to, text)
      const reqId = String(raw.data?.request_id ?? raw.data?.requestId ?? '')
      let dlr: Awaited<ReturnType<typeof fast2smsDeliveryStatus>> | null = null
      if (reqId) {
        await new Promise((r) => setTimeout(r, 4000))
        dlr = await fast2smsDeliveryStatus(reqId)
      }
      const reallyOk = Boolean(dlr?.ok)
      return res.status(reallyOk ? 200 : 502).json({
        ok: reallyOk,
        job: 'f2s-test',
        provider: 'fast2sms',
        toLast4: fast2smsMobile(to).slice(-4),
        apiSent: Boolean(raw.ok),
        requestId: reqId || undefined,
        dlrStatus: dlr?.status,
        dlrOk: dlr?.ok,
        dlrError: dlr?.error,
        rawApiOk: raw.ok,
        waba: {
          number: waba.number,
          connectionStatus: waba.connectionStatus,
          verifiedName: waba.verifiedName,
        },
        error: reallyOk ? undefined : dlr?.error || raw.error || 'Not delivered to phone',
        message: reallyOk
          ? 'Test WhatsApp delivered/read on Director phone.'
          : `WhatsApp did NOT reach the phone (status: ${dlr?.status || 'unknown'}). Check the number ending ${fast2smsMobile(to).slice(-4)} and that Recruitment 9441009091 is not blocked.`,
      })
    }

    const wantForce =
      !preview &&
      (resend ||
        (force && (job === 'publish' || job === '' || Boolean(editionParam))) ||
        (tokenOk && Boolean(editionParam)))
    const publishOpts = {
      preview,
      force: wantForce,
      retry,
      edition: editionParam || undefined,
      ymd: param(req, 'ymd') || undefined,
    }
    if (vercelCron && !preview && !wantForce && !handoff) {
      const work = (async () => {
        const result = await runDueBulletins()
        await sendSlotConfirmation()
        return result
      })()
      if (runAfterClockReply(work)) {
        await startPulseHandoffAndHold()
        return res.status(200).json({
          ok: true,
          accepted: true,
          handoff: true,
          edition: editionsDueNow()[0] ?? pulseSlot()?.edition ?? editionParam ?? null,
          job: job || 'publish',
          echo: { editionParam, tokenOk, vercelCron, wantForce, userAgent: String(req.headers['user-agent'] ?? '') },
        })
      }
      const publishResult = await work
      return res.status(200).json({
        ...publishResult,
        confirm: { sent: false, status: 'inline' },
        job: job || 'publish',
        echo: { editionParam, tokenOk, vercelCron, wantForce },
      })
    }
    const publishResult = await runDueBulletins(publishOpts)
    const confirm = preview ? null : await sendSlotConfirmation()
    return res.status(200).json({
      ...publishResult,
      confirm,
      job: job || 'publish',
      echo: { editionParam, tokenOk, vercelCron, wantForce },
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'cron failed'
    console.error('[pulse/cron]', err)
    return res.status(500).json({ ok: false, error: msg })
  }
}

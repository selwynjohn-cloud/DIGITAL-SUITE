import { Resend } from 'resend'
import { sendSuiteEmail } from '../suite-mail.js'
import { buildWhatsAppMessages } from './messages.js'
import { getTodayQuestion } from './quiz.js'
import { flashHeadlinesFrom, markStoriesPublished, totalNewsItems } from './news.js'
import {
  auditNewsSections,
  formatQualityAlert,
  preparePulseContent,
} from './quality.js'
import {
  autoPublishEnabled,
  notifyDirectorPublished,
  publishEditionMessages,
  recordPublishLog,
  wasPublishedToday,
} from './publish.js'
import { setPending, waSendText, whatsappConfigured } from './whatsapp.js'
import { editionLabelForHour, SHARE_URL } from './config.js'

const IST_OFFSET_MIN = 5 * 60 + 30

export function istNow(): Date {
  const utcMs = Date.now() + new Date().getTimezoneOffset() * 60000
  return new Date(utcMs + IST_OFFSET_MIN * 60000)
}

export function dateLabel(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  return `${day} ${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()} (${d.toLocaleString('en-US', { weekday: 'long' })})`
}

export function dateTimeLabel(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = d.toLocaleString('en-US', { month: 'long' })
  let h = d.getHours()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${month} ${d.getFullYear()} ${h}:${mm} ${ampm}`
}

/** Which edition slot we are in (IST), if any. */
export function pulseSlot(now = istNow()): {
  edition: string
  inSlot: boolean
  isRetry: boolean
} | null {
  const h = now.getHours()
  const m = now.getMinutes()
  const edition = editionLabelForHour(h)

  const morning =
    (h === 5 && m >= 30) || h === 6 || (h === 7 && m < 30)
  const afternoon =
    (h === 13 && m >= 30) || h === 14 || (h === 15 && m < 30)
  const evening =
    (h === 17 && m >= 30) || h === 18 || (h === 19 && m < 30)

  if (edition === 'Morning Edition' && morning) {
    return { edition, inSlot: true, isRetry: h === 7 || (h === 6 && m >= 30) }
  }
  if (edition === 'Afternoon Edition' && afternoon) {
    return { edition, inSlot: true, isRetry: h === 15 || (h === 14 && m >= 30) }
  }
  if (edition === 'Evening Edition' && evening) {
    return { edition, inSlot: true, isRetry: h === 19 || (h === 18 && m >= 30) }
  }
  return null
}

function recipients(): string[] {
  const raw =
    process.env.PULSE_NOTIFY_EMAILS?.trim() ||
    process.env.ADMIN_NOTIFY_EMAIL?.trim() ||
    'selwyn.john@gmail.com'
  return raw.split(',').map((e) => e.trim()).filter(Boolean)
}

function esc(s: string) {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

async function notifyAdmin(text: string) {
  const admin = process.env.ADMIN_WHATSAPP?.trim()
  if (!admin || !whatsappConfigured()) return
  try {
    await waSendText(admin, text)
  } catch (err) {
    console.error('[pulse] admin notify failed', err)
  }
}

export type PulseRunOptions = {
  preview?: boolean
  force?: boolean
  retry?: boolean
  /** Override edition (manual recovery). */
  edition?: string
}

export type PulseRunResult = {
  ok: boolean
  skipped?: boolean
  reason?: string
  edition: string
  dateLabel: string
  autoPublish: boolean
  published: boolean
  groupsSent: number
  emailed: boolean
  emailError?: string
  newsCount?: number
  msg1?: string
  msg2?: string
  msg3?: string
}

export async function runPulsePublish(opts: PulseRunOptions = {}): Promise<PulseRunResult> {
  const now = istNow()
  const dLabel = dateLabel(now)
  const dateTime = dateTimeLabel(now)
  const dateKey = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const slot = pulseSlot(now)
  const edition = opts.edition ?? slot?.edition ?? editionLabelForHour(now.getHours())
  const preview = opts.preview === true
  const force = opts.force === true
  const retry = opts.retry === true || slot?.isRetry === true

  if (!preview && !force && !slot) {
    return {
      ok: true,
      skipped: true,
      reason: 'outside-slot',
      edition,
      dateLabel: dLabel,
      autoPublish: autoPublishEnabled(),
      published: false,
      groupsSent: 0,
      emailed: false,
    }
  }

  if (!preview && (retry || !force) && (await wasPublishedToday(edition))) {
    return {
      ok: true,
      skipped: true,
      reason: 'already-published',
      edition,
      dateLabel: dLabel,
      autoPublish: autoPublishEnabled(),
      published: false,
      groupsSent: 0,
      emailed: false,
    }
  }

  let sections: Awaited<ReturnType<typeof preparePulseContent>>['sections'] = []
  let qualityReport: Awaited<ReturnType<typeof preparePulseContent>>['report'] | null = null
  try {
    const prepared = await preparePulseContent(edition)
    sections = prepared.sections
    qualityReport = prepared.report
    await getTodayQuestion()
  } catch (err) {
    qualityReport = null
    console.error('[pulse] prepare content failed', err)
    if (!preview) {
      await notifyAdmin(
        `⚠️ *${edition}* — bulletin engine error while loading news.\n${err instanceof Error ? err.message : 'Unknown error'}\nWill retry in 30 minutes.`,
      )
    }
  }

  const newsCount = totalNewsItems(sections)
  const newsOk = auditNewsSections(sections).ok && newsCount > 0
  const topHeadline = flashHeadlinesFrom(sections)[0] ?? ''
  const { msg1, msg2, msg3 } = buildWhatsAppMessages({ edition, dateTime, topHeadline })

  if (preview) {
    return {
      ok: true,
      edition,
      dateLabel: dLabel,
      autoPublish: autoPublishEnabled(),
      published: false,
      groupsSent: 0,
      emailed: false,
      newsCount,
      msg1,
      msg2,
      msg3,
    }
  }

  if (!newsOk) {
    const reason =
      newsCount === 0
        ? `⚠️ ${edition} was NOT sent — no fresh news was available just now. The system will try again at the next scheduled time.`
        : qualityReport
          ? await formatQualityAlert(edition, qualityReport)
          : `⚠️ ${edition} was NOT sent — quality check failed.`
    await notifyAdmin(reason)
    return {
      ok: true,
      skipped: true,
      reason: newsCount === 0 ? 'no-news' : 'quality-failed',
      edition,
      dateLabel: dLabel,
      autoPublish: autoPublishEnabled(),
      published: false,
      groupsSent: 0,
      emailed: false,
      newsCount,
    }
  }

  let published = false
  let publishResult: Awaited<ReturnType<typeof publishEditionMessages>> | null = null
  const auto = autoPublishEnabled()

  if (auto && whatsappConfigured()) {
    try {
      publishResult = await publishEditionMessages(msg1, msg2)
      published = publishResult.ok
      if (published) {
        await markStoriesPublished(sections)
      }
      await recordPublishLog({
        edition,
        date: dateKey,
        slot: edition.replace(/\s+/g, '-').toLowerCase(),
        ts: Date.now(),
        ok: published,
        channelSent: publishResult.channelSent,
        groupsSent: publishResult.groupsSent,
        auto: true,
        reason: published ? undefined : publishResult.error,
      })
      await notifyDirectorPublished(edition, publishResult, true)
      if (!published) {
        await notifyAdmin(
          `⚠️ *${edition}* could NOT be published.\n${publishResult.error ?? 'Check WHAPI on Vercel.'}`,
        )
      }
    } catch (err) {
      published = false
      const msg = err instanceof Error ? err.message : 'publish failed'
      console.error('[pulse] publish failed', err)
      await notifyAdmin(`⚠️ *${edition}* publish crashed.\n${msg}`)
    }
  } else if (whatsappConfigured()) {
    try {
      await setPending({ edition, date: dLabel, msg1, msg2, ts: Date.now() })
      const admin = process.env.ADMIN_WHATSAPP?.trim()
      const approveSecret = process.env.PULSE_APPROVE_SECRET?.trim() ?? ''
      const base = 'https://www.agilegroup-digital.co.in/api/pulse/approve'
      const allLink = `${base}?mode=all&token=${encodeURIComponent(approveSecret)}`
      if (admin) {
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
        await waSendText(admin, `📋 *PREVIEW — ${edition}*\n\n▶ *POST 1*:\n\n${msg1}`)
        await sleep(1200)
        await waSendText(admin, `▶ *POST 2*:\n\n${msg2}`)
        await sleep(1200)
        await waSendText(admin, `✅ *TAP TO SEND:*\n${allLink}`)
      }
    } catch (err) {
      console.error('[pulse] preview notify failed', err)
    }
  }

  let emailed = false
  let emailError: string | undefined
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (apiKey) {
    try {
      const resend = new Resend(apiKey)
      const from = process.env.EMAIL_FROM ?? 'Agile News <onboarding@resend.dev>'
      const statusLine = published
        ? `✅ <b>Auto-published</b> — Post 1 to Channel, Post 2 to ${publishResult?.groupsSent ?? 0} group(s).`
        : auto
          ? '⚠️ Could not auto-publish this slot — will retry in 30 minutes if news becomes available.'
          : 'Preview sent — tap SEND TO ALL in WhatsApp or email to publish.'
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1e293b">
          <img src="https://www.agilegroup-digital.co.in/news-assets/og-card.png" style="width:100%;border-radius:10px" alt="Agile News">
          <h2 style="color:#1e3a8a">Agile Pulse — ${esc(edition)}</h2>
          <p>${esc(dLabel)}. ${statusLine}</p>
          <p>Open bulletin: <a href="${SHARE_URL}">${SHARE_URL}</a></p>
          <p style="font-weight:700;color:#1d4ed8">Schedule: 6:00 AM · 2:00 PM · 6:00 PM IST (daily)</p>
          <p style="font-weight:700;color:#1d4ed8">Post 1 — Channel:</p>
          <pre style="white-space:pre-wrap;background:#f1f5f9;padding:12px;border-radius:8px;font-family:Arial">${esc(msg1)}</pre>
          <p style="font-weight:700;color:#1d4ed8">Post 2 — Groups:</p>
          <pre style="white-space:pre-wrap;background:#f1f5f9;padding:12px;border-radius:8px;font-family:Arial">${esc(msg2)}</pre>
        </div>`
      const result = await sendSuiteEmail(resend, {
        from,
        to: recipients(),
        subject: published
          ? `Agile Pulse — ${edition} PUBLISHED (${dLabel})`
          : `Agile Pulse — ${edition} (${dLabel})`,
        html,
      })
      emailed = !result.error
      if (result.error) emailError = result.error.message
    } catch (err) {
      emailError = err instanceof Error ? err.message : 'send failed'
    }
  } else {
    emailError = 'RESEND_API_KEY not set'
  }

  return {
    ok: true,
    edition,
    dateLabel: dLabel,
    autoPublish: auto,
    published,
    groupsSent: publishResult?.groupsSent ?? 0,
    emailed,
    emailError,
    newsCount,
  }
}

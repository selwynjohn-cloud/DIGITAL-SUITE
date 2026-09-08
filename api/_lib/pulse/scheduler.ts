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
  acquirePublishLock,
  notifyDirectorPublished,
  publishEditionMessages,
  recordPublishLog,
  releasePublishLock,
  wasPublishedOn,
} from './publish.js'
import { setPending, waSendText, whatsappConfigured } from './whatsapp.js'
import { editionLabelForHour, SHARE_URL } from './config.js'

const IST_OFFSET_MIN = 5 * 60 + 30

export function istNow(): Date {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  return new Date(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'))
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

/**
 * Bulletin send windows (IST). Catch-up stays open until the next edition
 * so a late or failed first run still publishes the same day.
 *   Morning     6:00 AM  → 11:00 AM
 *   Afternoon   2:00 PM  →  5:30 PM
 *   10:00 PM   10:00 PM  → 11:45 PM
 */
const BULLETIN_WINDOWS = [
  { edition: 'Morning Edition', start: 6 * 60, until: 11 * 60 },
  { edition: 'Afternoon Edition', start: 14 * 60, until: 17 * 60 + 30 },
  { edition: '10:00 PM Edition', start: 22 * 60, until: 23 * 60 + 45 },
] as const

/** Which edition slot we are in (IST), if any. */
export function pulseSlot(now = istNow()): {
  edition: string
  inSlot: boolean
  isRetry: boolean
} | null {
  const mins = now.getHours() * 60 + now.getMinutes()
  for (const w of BULLETIN_WINDOWS) {
    if (mins >= w.start && mins < w.until) {
      return { edition: w.edition, inSlot: true, isRetry: mins >= w.start + 20 }
    }
  }
  return null
}

const SAME_DAY_UNTIL = 23 * 60 + 45

/**
 * Editions that must still go out today (IST).
 * First windows stay 6–11 / 2–5:30 / 10–11:45. If a window is missed,
 * keep that same day’s edition due until 11:45 PM. Never yesterday.
 * One missed edition is sent per cron tick (oldest first).
 */
export function editionsDueNow(now = istNow()): string[] {
  const mins = now.getHours() * 60 + now.getMinutes()
  if (mins < 6 * 60 || mins >= SAME_DAY_UNTIL) return []
  const due: string[] = ['Morning Edition']
  if (mins >= 14 * 60) due.push('Afternoon Edition')
  if (mins >= 22 * 60) due.push('10:00 PM Edition')
  return due
}

function skippedResult(edition: string, reason: string, dLabel: string): PulseRunResult {
  return {
    ok: true,
    skipped: true,
    reason,
    edition,
    dateLabel: dLabel,
    autoPublish: autoPublishEnabled(),
    published: false,
    groupsSent: 0,
    emailed: false,
  }
}

/** Send the next unpublished edition due today. Clock and health cron both use this. */
export async function runDueBulletins(opts: PulseRunOptions = {}): Promise<PulseRunResult> {
  if (opts.preview || opts.force || opts.ymd || (opts.edition && !opts.catchUp)) {
    return runPulsePublish(opts)
  }
  const now = istNow()
  const due = editionsDueNow(now)
  for (const edition of due) {
    if (await wasPublishedOn(edition)) continue
    return runPulsePublish({ ...opts, edition, catchUp: true })
  }
  if (due.length) {
    return skippedResult(due[due.length - 1], 'already-published', dateLabel(now))
  }
  return runPulsePublish(opts)
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
  /** IST calendar day YYYY-MM-DD for a missed edition. Do not use today’s date for last night. */
  ymd?: string
  /**
   * Same-day rescue after the first window closed.
   * Still skips if that edition already went out. Never uses yesterday’s date.
   */
  catchUp?: boolean
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

function parseYmd(ymd: string | undefined): Date | null {
  const m = String(ymd || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const dt = new Date(y, mo - 1, d, 12, 0, 0)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return dt
}

function editionClock(edition: string): { h: number; m: number } {
  if (/morning/i.test(edition)) return { h: 6, m: 0 }
  if (/afternoon/i.test(edition)) return { h: 14, m: 0 }
  return { h: 22, m: 0 }
}

export async function runPulsePublish(opts: PulseRunOptions = {}): Promise<PulseRunResult> {
  const now = istNow()
  const slot = pulseSlot(now)
  const edition = opts.edition ?? slot?.edition ?? editionLabelForHour(now.getHours())
  const asDate = parseYmd(opts.ymd)
  const clock = editionClock(edition)
  const when = asDate
    ? new Date(asDate.getFullYear(), asDate.getMonth(), asDate.getDate(), clock.h, clock.m, 0)
    : now
  const dLabel = dateLabel(when)
  const dateTime = dateTimeLabel(when)
  const dateKey = asDate
    ? `${asDate.getFullYear()}-${String(asDate.getMonth() + 1).padStart(2, '0')}-${String(asDate.getDate()).padStart(2, '0')}`
    : new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const preview = opts.preview === true
  const force = opts.force === true
  const catchUp = opts.catchUp === true
  const retry = opts.retry === true || slot?.isRetry === true

  if (!preview && !force && !catchUp && !slot) {
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

  if (!preview && (retry || !force) && (await wasPublishedOn(edition, dateKey))) {
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
    const prepared = await preparePulseContent(edition, { forceFresh: force || Boolean(slot) })
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
  const qualityNow = auditNewsSections(sections)
  const laterEdition = /afternoon|10:00\s*pm/i.test(edition)
  const onlyTooFew =
    qualityNow.violations.length > 0 &&
    qualityNow.violations.every((v) => /too few news/i.test(v))
  const newsOk =
    (qualityNow.ok && newsCount > 0) || (laterEdition && onlyTooFew)
  const headlines = flashHeadlinesFrom(sections)
  const topHeadline = headlines[0] ?? ''
  const { msg1, msg2, msg3 } = buildWhatsAppMessages({
    edition,
    dateTime,
    topHeadline,
    bullets: headlines.slice(1, 3),
  })

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
    const locked = await acquirePublishLock(edition, dateKey)
    if (!locked) {
      return {
        ok: true,
        skipped: true,
        reason: 'in-progress',
        edition,
        dateLabel: dLabel,
        autoPublish: auto,
        published: false,
        groupsSent: 0,
        emailed: false,
        newsCount,
      }
    }
    try {
      publishResult = await publishEditionMessages(msg1, msg2)
      published = publishResult.ok
      if (!published) await releasePublishLock(edition, dateKey)
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
      await releasePublishLock(edition, dateKey)
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
          <p style="font-weight:700;color:#1d4ed8">Schedule: 6:00 AM · 2:00 PM · 10:00 PM IST (daily)</p>
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

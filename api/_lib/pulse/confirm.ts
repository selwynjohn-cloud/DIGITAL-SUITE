import { SHARE_URL } from './config.js'
import { dateLabel, istNow, runPulsePublish } from './scheduler.js'
import { getTodayPublishEntry, wasPublishedToday } from './publish.js'
import { redisCommand } from './store.js'
import { waSendText, whatsappConfigured } from './whatsapp.js'

const CONFIRM_KEY = 'pulse:confirm:sent:v1'

type ConfirmSlot = {
  edition: string
  label: string
}

/** One daily WhatsApp confirmation per edition — sent after each slot ends. */
export function confirmSlot(now = istNow()): ConfirmSlot | null {
  const h = now.getHours()
  const m = now.getMinutes()

  if (h === 7 && m < 30) {
    return { edition: 'Morning Edition', label: 'Morning' }
  }
  if (h === 14 && m < 30) {
    return { edition: 'Afternoon Edition', label: 'Afternoon' }
  }
  if ((h === 19 && m >= 45) || (h === 20 && m < 15)) {
    return { edition: 'Evening Edition', label: 'Evening' }
  }
  return null
}

function todayIst(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

async function alreadyConfirmed(edition: string): Promise<boolean> {
  const date = todayIst()
  const d = await redisCommand(['GET', CONFIRM_KEY])
  if (!d?.result || typeof d.result !== 'string') return false
  try {
    const sent = JSON.parse(d.result) as Record<string, string[]>
    return sent[date]?.includes(edition) === true
  } catch {
    return false
  }
}

async function markConfirmed(edition: string): Promise<void> {
  const date = todayIst()
  const d = await redisCommand(['GET', CONFIRM_KEY])
  let sent: Record<string, string[]> = {}
  if (d?.result && typeof d.result === 'string') {
    try {
      sent = JSON.parse(d.result) as Record<string, string[]>
    } catch {
      sent = {}
    }
  }
  const list = sent[date] ?? []
  if (!list.includes(edition)) list.push(edition)
  sent[date] = list
  const dates = Object.keys(sent).sort().slice(-14)
  const trimmed: Record<string, string[]> = {}
  for (const key of dates) trimmed[key] = sent[key]
  await redisCommand(['SET', CONFIRM_KEY, JSON.stringify(trimmed)])
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export async function sendSlotConfirmation(): Promise<{
  sent: boolean
  edition?: string
  status?: string
  recovered?: boolean
}> {
  const slot = confirmSlot()
  if (!slot) return { sent: false }

  if (await alreadyConfirmed(slot.edition)) {
    return { sent: false, edition: slot.edition, status: 'already-confirmed' }
  }

  const admin = process.env.ADMIN_WHATSAPP?.trim()
  if (!admin || !whatsappConfigured()) {
    return { sent: false, edition: slot.edition, status: 'no-whatsapp' }
  }

  let published = await wasPublishedToday(slot.edition)
  let recovered = false

  if (!published) {
    const rescue = await runPulsePublish({ force: true, edition: slot.edition })
    published = rescue.published === true
    recovered = published
  }

  const dLabel = dateLabel(istNow())

  if (published) {
    const entry = await getTodayPublishEntry(slot.edition)
    const when = entry ? formatTime(entry.ts) : 'today'
    const groups = entry?.groupsSent ?? 0
    const channel = entry?.channelSent ? 'Channel ✓' : 'Channel'
    await waSendText(
      admin,
      `✅ *${slot.label} Bulletin — CONFIRMED*\n\n${dLabel}\nSent at ${when} IST\n${channel}\n${groups} WhatsApp group(s)\n\n${SHARE_URL}`,
    )
    await markConfirmed(slot.edition)
    return { sent: true, edition: slot.edition, status: 'confirmed-ok', recovered }
  }

  const approveSecret = process.env.PULSE_APPROVE_SECRET?.trim() ?? ''
  const rescueLink = approveSecret
    ? `https://www.agilegroup-digital.co.in/api/pulse/cron?job=publish&token=${encodeURIComponent(approveSecret)}`
    : SHARE_URL

  await waSendText(
    admin,
    `🚨 *${slot.label} Bulletin — NOT SENT*\n\n${dLabel}\nAutomatic send failed after all retries.\n\nTap to send now:\n${rescueLink}`,
  )
  await markConfirmed(slot.edition)
  return { sent: true, edition: slot.edition, status: 'confirmed-failed' }
}

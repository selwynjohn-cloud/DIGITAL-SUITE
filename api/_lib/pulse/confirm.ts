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

/** Confirm windows — keep trying the same IST day until 11:45 PM if that edition has not gone. */
export function confirmSlot(now = istNow()): ConfirmSlot | null {
  const h = now.getHours()
  const m = now.getMinutes()
  const mins = h * 60 + m

  if (mins >= 10 * 60 + 30 && mins < 23 * 60 + 45) {
    return { edition: 'Morning Edition', label: 'Morning' }
  }
  if (mins >= 17 * 60 && mins < 23 * 60 + 45) {
    return { edition: 'Afternoon Edition', label: 'Afternoon' }
  }
  if ((h === 22 && m >= 10) || (h === 23 && m < 50)) {
    return { edition: '10:00 PM Edition', label: '10:00 PM' }
  }
  return null
}

/** Oldest unpublished confirm slot still open today. */
export function confirmSlotsDue(now = istNow()): ConfirmSlot[] {
  const h = now.getHours()
  const m = now.getMinutes()
  const mins = h * 60 + m
  const due: ConfirmSlot[] = []
  if (mins >= 10 * 60 + 30 && mins < 23 * 60 + 45) {
    due.push({ edition: 'Morning Edition', label: 'Morning' })
  }
  if (mins >= 17 * 60 && mins < 23 * 60 + 45) {
    due.push({ edition: 'Afternoon Edition', label: 'Afternoon' })
  }
  if ((h === 22 && m >= 10) || (h === 23 && m < 50)) {
    due.push({ edition: '10:00 PM Edition', label: '10:00 PM' })
  }
  return due
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
  const due = confirmSlotsDue()
  let slot: ConfirmSlot | null = null
  for (const row of due) {
    if (await alreadyConfirmed(row.edition)) continue
    slot = row
    break
  }
  if (!slot) {
    return due.length
      ? { sent: false, edition: due[due.length - 1].edition, status: 'already-confirmed' }
      : { sent: false }
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

  // Do not ask the Director to tap Send. The machine keeps retrying until the window closes.
  const now2 = istNow()
  const hh = now2.getHours()
  const mm = now2.getMinutes()
  const firstWindowNotice =
    (slot.edition === 'Morning Edition' && hh === 10 && mm >= 30) ||
    (slot.edition === 'Afternoon Edition' && hh === 17 && mm < 30) ||
    (slot.edition === '10:00 PM Edition' && ((hh === 22 && mm >= 10) || (hh === 23 && mm < 50)))
  if (firstWindowNotice) {
    await waSendText(
      admin,
      `⚠️ *${slot.label} Bulletin — still sending*\n\n${dLabel}\nAutomatic send is still trying. You do not need to tap Send.`,
    )
    return { sent: true, edition: slot.edition, status: 'confirmed-retrying' }
  }
  return { sent: false, edition: slot.edition, status: 'confirmed-retrying' }
}

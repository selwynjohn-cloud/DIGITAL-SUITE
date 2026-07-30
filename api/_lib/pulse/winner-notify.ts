import type { PendingQuizWinner, QuizWinner } from './types.js'
import { redisCommand } from './store.js'
import { cardImageForGuardId } from './guard-directory.js'
import { thankYouCardText, winnerCardText } from './wa-cards.js'
import { waSendImageCard, waSendText, whatsappConfigured } from './whatsapp.js'
import { CURSOR_ATTRIBUTION } from './config.js'

const thankYouKey = (week: string) => `pulse:quiz:thankyou-sent:${week}`

async function alreadyThanked(week: string, mobile: string): Promise<boolean> {
  const data = await redisCommand(['SISMEMBER', thankYouKey(week), mobile])
  return data?.result === 1
}

async function markThanked(week: string, mobile: string): Promise<void> {
  await redisCommand(['SADD', thankYouKey(week), mobile])
  await redisCommand(['EXPIRE', thankYouKey(week), 1209600]) // 14 days
}

export function whatsappMobile(raw: string): string {
  const d = String(raw ?? '').replace(/\D/g, '')
  if (d.length === 10) return `91${d}`
  if (d.length === 12 && d.startsWith('91')) return d
  return d
}

export function participantThankYouMessage(name: string, week: string): string {
  return thankYouCardText(name, week)
}

export async function sendThankYouToParticipants(week: string): Promise<{
  total: number
  unique: number
  sent: number
  failed: number
  capped?: boolean
  alreadySent?: number
}> {
  const { getEntries } = await import('./quiz.js')
  const entries = await getEntries(week)
  const seen = new Set<string>()
  const unique: { name: string; mobile: string; guardId?: string }[] = []
  for (const e of entries) {
    const mobile = e.mobile.replace(/\D/g, '').slice(0, 15)
    if (!mobile || seen.has(mobile)) continue
    seen.add(mobile)
    unique.push({ name: e.name, mobile, guardId: e.guardId })
  }

  if (!whatsappConfigured() || unique.length === 0) {
    return { total: entries.length, unique: unique.length, sent: 0, failed: unique.length }
  }

  const MAX_PER_RUN = 35
  const pending: { name: string; mobile: string }[] = []
  for (const p of unique) {
    if (!(await alreadyThanked(week, p.mobile))) pending.push(p)
  }
  const batch = pending.slice(0, MAX_PER_RUN)
  const capped = pending.length > MAX_PER_RUN
  const alreadySent = unique.length - pending.length

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  let sent = 0
  let failed = 0
  for (const p of batch) {
    const to = whatsappMobile(p.mobile)
    if (to.length < 12) {
      failed++
      continue
    }
    const imageInfo = await cardImageForGuardId(p.guardId)
    const caption = thankYouCardText(p.name, week, imageInfo.agileGuard)
    const r = await waSendImageCard(to, imageInfo.url, caption)
    if (r?.ok) {
      sent++
      await markThanked(week, p.mobile)
    } else failed++
    await sleep(900)
  }

  return { total: entries.length, unique: unique.length, sent, failed, capped, alreadySent }
}

export function noWinnerWeekMessage(week: string): string {
  return (
    `ℹ️ *Security Quiz — ${week}*\n\n` +
    `There was *no winner* this week — no one submitted a correct answer.\n\n` +
    `"No winner this week" has been published automatically on the bulletin board.\n\n` +
    `Encourage guards to answer the daily question — next Sunday's draw will pick from correct entries.\n\n` +
    `— Agile Pulse\n\n` +
    `${CURSOR_ATTRIBUTION}`
  )
}

export function winnerCongratsMessage(w: Pick<QuizWinner, 'name' | 'weekKey'>): string {
  return winnerCardText(w)
}

export async function notifyWinnerPublished(
  pending: PendingQuizWinner,
  published: QuizWinner,
): Promise<{ winnerSent: boolean; adminSent: boolean }> {
  if (!whatsappConfigured()) return { winnerSent: false, adminSent: false }

  const admin = (process.env.ADMIN_WHATSAPP ?? '').replace(/\D/g, '')
  const toWinner = whatsappMobile(pending.mobile)
  const imageInfo = await cardImageForGuardId(pending.guardId)
  const winnerMsg = winnerCardText(published, imageInfo.agileGuard)

  let winnerSent = false
  let adminSent = false

  if (toWinner.length >= 12) {
    const r = await waSendImageCard(toWinner, imageInfo.url, winnerMsg)
    winnerSent = Boolean(r?.ok)
  }

  if (admin) {
    const r = await waSendText(
      admin,
      `✅ *Quiz winner published* — ${published.weekKey}\n\n` +
        `Winner: *${published.name}*\n` +
        `Entries this week: ${pending.entryCount}\n\n` +
        `Winner card WhatsApp: ${winnerSent ? 'sent ✓' : 'could not send'}\n` +
        `Bulletin board updated.\n\n` +
        `${CURSOR_ATTRIBUTION}`,
    )
    adminSent = Boolean(r?.ok)
  }

  return { winnerSent, adminSent }
}

export async function notifyNoWinnerPublished(week: string): Promise<boolean> {
  if (!whatsappConfigured()) return false
  const admin = (process.env.ADMIN_WHATSAPP ?? '').replace(/\D/g, '')
  if (!admin) return false
  const r = await waSendText(admin, noWinnerWeekMessage(week))
  return Boolean(r?.ok)
}

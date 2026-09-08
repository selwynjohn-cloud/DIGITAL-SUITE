/**
 * Command Centre daily packs — send on schedule, retry if a run is late or fails.
 *
 * Locked IST times (same every calendar day):
 *   control   08:00  catch-up until 11:00
 *   training  09:30  catch-up until 12:30
 *   guards    09:30  catch-up until 12:30
 *   guards-delayed-am  09:30  catch-up until 12:30
 *   guards-delayed  17:00  catch-up until 21:00
 *   mis       16:30  catch-up until 22:00
 *   mis-director  16:30  catch-up until 22:00 (To HODs · CC Director)
 *   securityjob-regs  17:00  catch-up until 21:00 (To HODs · CC Director, no Gmail)
 *
 * Redis remembers a successful send for 48 hours so catch-up does not double-mail.
 */

import { istNow, misTodayIst } from './mis/dates.js'

export type SuiteDailyPackId =
  | 'control'
  | 'training'
  | 'guards'
  | 'guards-delayed-am'
  | 'guards-delayed'
  | 'mis'
  | 'mis-director'
  | 'securityjob-regs'

export type SuiteDailyPackDef = {
  id: SuiteDailyPackId
  label: string
  hour: number
  minute: number
  catchUntilHour: number
  catchUntilMinute: number
}

export const SUITE_DAILY_PACKS: SuiteDailyPackDef[] = [
  { id: 'control', label: 'Agile Control daily report', hour: 8, minute: 0, catchUntilHour: 11, catchUntilMinute: 0 },
  { id: 'training', label: 'Agile Training Track-1 OJT', hour: 9, minute: 30, catchUntilHour: 12, catchUntilMinute: 30 },
  { id: 'guards', label: 'Agile Guards complaints status', hour: 9, minute: 30, catchUntilHour: 12, catchUntilMinute: 30 },
  {
    id: 'guards-delayed-am',
    label: 'Agile Guards delayed complaints (9:30 AM)',
    hour: 9,
    minute: 30,
    catchUntilHour: 12,
    catchUntilMinute: 30,
  },
  {
    id: 'guards-delayed',
    label: 'Agile Guards delayed complaints (5:00 PM)',
    hour: 17,
    minute: 0,
    catchUntilHour: 21,
    catchUntilMinute: 0,
  },
  { id: 'mis', label: 'Agile MIS daily report', hour: 16, minute: 30, catchUntilHour: 22, catchUntilMinute: 0 },
  {
    id: 'mis-director',
    label: '4:30 PM — Consolidated MIS + Guards Complaints (HODs · CC Director)',
    hour: 16,
    minute: 30,
    catchUntilHour: 22,
    catchUntilMinute: 0,
  },
  {
    id: 'securityjob-regs',
    label: 'SecurityJob daily registered candidates (5:00 PM · HODs · CC Director)',
    hour: 17,
    minute: 0,
    catchUntilHour: 21,
    catchUntilMinute: 0,
  },
]

const SENT_TTL_SEC = 48 * 3600
const LOCK_TTL_SEC = 15 * 60

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

async function redis(command: unknown[]): Promise<{ result?: unknown } | null> {
  const cfg = redisConfig()
  if (!cfg) return null
  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    })
    if (!res.ok) return null
    return (await res.json()) as { result?: unknown }
  } catch {
    return null
  }
}

function sentKey(id: SuiteDailyPackId, ymd: string) {
  return `suite:daily-pack:sent:${id}:${ymd}`
}

function lockKey(id: SuiteDailyPackId, ymd: string) {
  return `suite:daily-pack:lock:${id}:${ymd}`
}

function packOf(id: SuiteDailyPackId) {
  return SUITE_DAILY_PACKS.find((p) => p.id === id)
}

/** True once the IST clock has reached the scheduled time, until the catch-up window closes. */
export function suiteDailyPackDue(id: SuiteDailyPackId, now = istNow()): boolean {
  const pack = packOf(id)
  if (!pack) return false
  const mins = now.getHours() * 60 + now.getMinutes()
  const due = pack.hour * 60 + pack.minute
  const until = pack.catchUntilHour * 60 + pack.catchUntilMinute
  return mins >= due && mins < until
}

export async function dailyPackAlreadySent(id: SuiteDailyPackId, ymd = misTodayIst()): Promise<boolean> {
  const d = await redis(['GET', sentKey(id, ymd)])
  return Boolean(d?.result)
}

type DeliveryOpts = {
  preview?: boolean
  sampleOnly?: boolean
  force?: boolean
  ymd?: string
}

type DeliveryMeta = {
  skipped?: boolean
  reason?: string
  packId?: SuiteDailyPackId
  date?: string
}

/**
 * Wrap a daily pack send: skip if already delivered today, lock while sending,
 * mark sent only after a successful mail. Preview / sample / force bypass the ledger.
 * If Redis is down, the mail still goes out (delivery first).
 */
export async function withDailyPackDelivery<T extends { ok?: boolean; error?: string }>(
  id: SuiteDailyPackId,
  send: () => Promise<T>,
  opts?: DeliveryOpts,
): Promise<T & DeliveryMeta> {
  if (opts?.preview || opts?.sampleOnly) return send()

  const ymd = String(opts?.ymd || misTodayIst()).slice(0, 10)

  if (!opts?.force) {
    if (await dailyPackAlreadySent(id, ymd)) {
      return { ok: true, skipped: true, reason: 'already sent today', packId: id, date: ymd } as T & DeliveryMeta
    }
    const lock = await redis(['SET', lockKey(id, ymd), new Date().toISOString(), 'EX', LOCK_TTL_SEC, 'NX'])
    if (lock && lock.result !== 'OK') {
      return {
        ok: true,
        skipped: true,
        reason: 'send already in progress',
        packId: id,
        date: ymd,
      } as T & DeliveryMeta
    }
  }

  try {
    const result = await send()
    const failed = result?.ok === false || Boolean(result?.error)
    if (!failed) {
      await redis([
        'SET',
        sentKey(id, ymd),
        JSON.stringify({ sentAt: new Date().toISOString(), packId: id }),
        'EX',
        SENT_TTL_SEC,
      ])
    }
    return { ...result, packId: id, date: ymd }
  } finally {
    await redis(['DEL', lockKey(id, ymd)])
  }
}

async function sendPack(id: SuiteDailyPackId, force?: boolean) {
  if (id === 'control') {
    const { sendControlDailyReport } = await import('./control/daily-report.js')
    return sendControlDailyReport({ force })
  }
  if (id === 'training') {
    const { sendOjtMorningScheduleMail } = await import('./training/ojt-morning-report.js')
    return sendOjtMorningScheduleMail({ force })
  }
  if (id === 'guards') {
    const { sendDailyGuardsStatusMail } = await import('./guards/digest.js')
    return sendDailyGuardsStatusMail({ force })
  }
  if (id === 'guards-delayed-am') {
    const { sendDailyGuardsDelayedMail } = await import('./guards/delayed-daily.js')
    return sendDailyGuardsDelayedMail({ force, slot: 'am' })
  }
  if (id === 'guards-delayed') {
    return { ok: true, skipped: true, reason: 'Evening delayed mail stopped — 9:30 AM only' }
  }
  if (id === 'mis-director') {
    const { sendMisDirectorDailyPack } = await import('./mis/director-430-report.js')
    return sendMisDirectorDailyPack(misTodayIst(), { force })
  }
  if (id === 'securityjob-regs') {
    const { sendDailySecurityJobRegistrationsMail } = await import(
      './recruitment/daily-registrations-mail.js'
    )
    return sendDailySecurityJobRegistrationsMail({ force })
  }
  const { sendMisDailyCommandReport } = await import('./mis/daily-command-report.js')
  return sendMisDailyCommandReport(misTodayIst(), { force })
}

export type EnsureDailyReportsResult = {
  date: string
  ist: string
  packs: Record<string, unknown>
}

/** Send any due pack that has not gone out yet. Safe to call from any cron. */
export async function ensureSuiteDailyReports(opts?: {
  ids?: SuiteDailyPackId[]
  force?: boolean
}): Promise<EnsureDailyReportsResult> {
  const now = istNow()
  const ymd = misTodayIst()
  const ids = opts?.ids?.length ? opts.ids : SUITE_DAILY_PACKS.map((p) => p.id)
  const packs: Record<string, unknown> = {}

  for (const id of ids) {
    if (!opts?.force && !suiteDailyPackDue(id, now)) {
      packs[id] = { skipped: true, reason: 'not due yet' }
      continue
    }
    if (!opts?.force && (await dailyPackAlreadySent(id, ymd))) {
      packs[id] = { skipped: true, reason: 'already sent today' }
      continue
    }
    try {
      packs[id] = await sendPack(id, opts?.force)
    } catch (err) {
      packs[id] = { ok: false, error: err instanceof Error ? err.message : 'send failed' }
    }
  }

  return {
    date: ymd,
    ist: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    packs,
  }
}

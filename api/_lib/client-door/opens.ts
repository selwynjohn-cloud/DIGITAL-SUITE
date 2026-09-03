/**
 * Client Door — last opened date/time + one open-mail per email per day.
 */
import { Resend } from 'resend'
import { misTodayIst } from '../mis/dates.js'
import { getHodEmailsForBranch } from '../mis/digest.js'
import { pinMailFrom, sendSuiteEmail } from '../suite-mail.js'
import { parseClientEmails, type ClientDoorSite } from './lookup.js'
import { clientDoorTitle } from './chrome.js'
import type { ClientDoorMetrics } from './metrics.js'

const OPENS_KEY = 'agil:client-door:opens'
const MAIL_TTL_SEC = 2 * 24 * 60 * 60

export type ClientDoorOpenRow = { at: string; email: string }

async function redisCommand(command: unknown[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    })
    if (!res.ok) return null
    return (await res.json()) as { result?: unknown }
  } catch {
    return null
  }
}

const mem = () => {
  const g = globalThis as unknown as { __clientDoorOpens?: Record<string, ClientDoorOpenRow> }
  if (!g.__clientDoorOpens) g.__clientDoorOpens = {}
  return g.__clientDoorOpens
}

export function formatClientDoorOpenedAt(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const date = d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })
  const time = d.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${date} ${time} IST`
}

export async function loadClientDoorOpens(): Promise<Record<string, ClientDoorOpenRow>> {
  const data = await redisCommand(['GET', OPENS_KEY])
  if (typeof data?.result === 'string' && data.result) {
    try {
      const parsed = JSON.parse(data.result) as Record<string, ClientDoorOpenRow>
      Object.assign(mem(), parsed)
      return parsed
    } catch {
      /* fall through */
    }
  }
  return { ...mem() }
}

export async function recordClientDoorOpen(email: string, ids: string[]): Promise<void> {
  const em = String(email || '').trim().toLowerCase()
  const keys = ids.map((id) => String(id || '').trim()).filter(Boolean)
  if (!em || !keys.length) return
  const map = await loadClientDoorOpens()
  const at = new Date().toISOString()
  for (const id of keys) {
    map[id] = { at, email: em }
  }
  Object.assign(mem(), map)
  await redisCommand(['SET', OPENS_KEY, JSON.stringify(map)])
}

async function shouldSendOpenMail(email: string): Promise<boolean> {
  const em = String(email || '').trim().toLowerCase()
  const ymd = misTodayIst()
  const key = `agil:client-door:openmail:${em}:${ymd}`
  const result = await redisCommand(['SET', key, '1', 'NX', 'EX', MAIL_TTL_SEC])
  if (result?.result === 'OK') return true
  const g = globalThis as unknown as { __clientDoorOpenMail?: Set<string> }
  if (!g.__clientDoorOpenMail) g.__clientDoorOpenMail = new Set()
  if (g.__clientDoorOpenMail.has(key)) return false
  g.__clientDoorOpenMail.add(key)
  return result == null
}

export async function sendClientDoorOpenMail(opts: {
  email: string
  sites: ClientDoorSite[]
  reportHtml: string
  metrics: ClientDoorMetrics
}): Promise<void> {
  const em = String(opts.email || '').trim().toLowerCase()
  if (!em || !opts.sites.length) return
  if (!(await shouldSendOpenMail(em))) return
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return
  const branchIds = [...new Set(opts.sites.map((s) => s.branchId))]
  const hod: string[] = []
  for (const bid of branchIds) {
    hod.push(...(await getHodEmailsForBranch(bid)))
  }
  const clientEmails = [
    ...new Set([em, ...opts.sites.flatMap((s) => parseClientEmails(s.clientEmail))]),
  ].filter((e) => e.includes('@'))
  const cc = [...new Set(hod.filter((e) => e.includes('@') && !clientEmails.includes(e)))]
  try {
    const resend = new Resend(apiKey)
    await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to: clientEmails,
      cc,
      subject: `${clientDoorTitle(opts.metrics.clientLabel)} — ${opts.metrics.dateLabel}`,
      html: opts.reportHtml,
      skipDirectorCc: true,
    })
  } catch (err) {
    console.error('[clientDoorOpenMail]', err)
  }
}

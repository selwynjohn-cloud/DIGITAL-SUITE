/**
 * Agile Meeting — Redis store (prefix meet:).
 */

import type { MeetAction, MeetContact, MeetMeeting } from './types.js'

const PREFIX = 'meet:'
const KEYS = {
  meetings: `${PREFIX}meetings`,
  actions: `${PREFIX}actions`,
  contacts: `${PREFIX}contacts`,
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

export function meetStorageOk(): boolean {
  return redisConfig() !== null
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

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const d = await redis(['GET', key])
  if (d?.result && typeof d.result === 'string') {
    try {
      return JSON.parse(d.result) as T
    } catch {
      /* ignore */
    }
  }
  return fallback
}

async function setJson(key: string, value: unknown): Promise<boolean> {
  const r = await redis(['SET', key, JSON.stringify(value)])
  return r?.result === 'OK'
}

export function meetNid(p: string): string {
  return `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export async function getMeetMeetings(): Promise<MeetMeeting[]> {
  return getJson(KEYS.meetings, [])
}
export async function saveMeetMeetings(rows: MeetMeeting[]): Promise<boolean> {
  return setJson(KEYS.meetings, rows.slice(0, 5000))
}
export async function upsertMeetMeeting(row: MeetMeeting): Promise<void> {
  const all = await getMeetMeetings()
  const i = all.findIndex((x) => x.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveMeetMeetings(all)
}

export async function getMeetActions(): Promise<MeetAction[]> {
  return getJson(KEYS.actions, [])
}
export async function saveMeetActions(rows: MeetAction[]): Promise<boolean> {
  return setJson(KEYS.actions, rows.slice(0, 8000))
}
export async function upsertMeetAction(row: MeetAction): Promise<void> {
  const all = await getMeetActions()
  const i = all.findIndex((x) => x.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveMeetActions(all)
}

export async function getMeetContacts(): Promise<MeetContact[]> {
  return getJson(KEYS.contacts, [])
}
export async function saveMeetContacts(rows: MeetContact[]): Promise<boolean> {
  return setJson(KEYS.contacts, rows.slice(0, 5000))
}
export async function upsertMeetContact(row: MeetContact): Promise<void> {
  const all = await getMeetContacts()
  const i = all.findIndex((x) => x.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveMeetContacts(all)
}

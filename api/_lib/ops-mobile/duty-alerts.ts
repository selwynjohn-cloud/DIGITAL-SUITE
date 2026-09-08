/**
 * Duty alerts — late start, out of post, random voice verification.
 * Severity: mild | medium | severe (alarms escalate to OM / Director).
 */
import { redisCommand } from '../pulse/store.js'
import { opsNid } from './store.js'

export type DutyAlertSeverity = 'mild' | 'medium' | 'severe'
export type DutyAlertType =
  | 'late_start'
  | 'out_of_post'
  | 'no_duty_start'
  | 'voice_on_duty'
  | 'voice_off_duty'
  | 'voice_no_answer'
  | 'report_late'
  | 'sick'
  | 'on_the_way'
  | 'break_duty'
  | 'early_end'
  | 'chat_blocked'

export type OpsDutyAlert = {
  id: string
  at: string
  date: string
  type: DutyAlertType
  severity: DutyAlertSeverity
  guardId: string
  idNo: string
  name: string
  mobile: string
  branch: string
  clientSite: string
  detail: string
  voiceCallId?: string
}

const ALERTS_KEY = 'ops-mobile:alerts:v1'
const VOICE_LOG_KEY = 'ops-mobile:voice-checks:v1'

export function severityLateStart(minutesLate: number): DutyAlertSeverity {
  if (minutesLate <= 0) return 'mild'
  if (minutesLate <= 15) return 'mild'
  if (minutesLate <= 45) return 'medium'
  return 'severe'
}

export function severityOutOfPost(minutesAway: number, kmAway = 0): DutyAlertSeverity {
  if (minutesAway <= 15 && kmAway < 0.2) return 'mild'
  if (minutesAway <= 60 && kmAway < 0.5) return 'medium'
  return 'severe'
}

export function severityNoStart(minutesPastShift: number): DutyAlertSeverity {
  if (minutesPastShift <= 15) return 'mild'
  if (minutesPastShift <= 30) return 'medium'
  return 'severe'
}

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const d = await redisCommand(['GET', key])
  if (!d?.result || typeof d.result !== 'string') return fallback
  try {
    return JSON.parse(d.result) as T
  } catch {
    return fallback
  }
}

async function setJson(key: string, value: unknown): Promise<boolean> {
  const r = await redisCommand(['SET', key, JSON.stringify(value)])
  return r?.result === 'OK' || r?.result === true
}

export async function listDutyAlerts(date?: string, limit = 200): Promise<OpsDutyAlert[]> {
  const list = await getJson<OpsDutyAlert[]>(ALERTS_KEY, [])
  const d = String(date ?? '').trim()
  let out = Array.isArray(list) ? list : []
  if (d) out = out.filter((a) => a.date === d)
  return out.slice(0, limit)
}

export async function addDutyAlert(
  alert: Omit<OpsDutyAlert, 'id' | 'at'> & { id?: string; at?: string },
): Promise<OpsDutyAlert> {
  const list = await getJson<OpsDutyAlert[]>(ALERTS_KEY, [])
  const row: OpsDutyAlert = {
    id: alert.id || opsNid('al'),
    at: alert.at || new Date().toISOString(),
    date: alert.date,
    type: alert.type,
    severity: alert.severity,
    guardId: alert.guardId,
    idNo: alert.idNo,
    name: alert.name,
    mobile: alert.mobile,
    branch: alert.branch,
    clientSite: alert.clientSite,
    detail: alert.detail,
    voiceCallId: alert.voiceCallId,
  }
  list.unshift(row)
  await setJson(ALERTS_KEY, list.slice(0, 3000))
  return row
}

export type VoiceCheckLog = {
  id: string
  at: string
  guardId: string
  idNo: string
  name: string
  mobile: string
  callSid?: string
  digit?: string
  status: 'queued' | 'answered' | 'no_answer' | 'failed'
  alertId?: string
}

export async function listVoiceChecks(limit = 100): Promise<VoiceCheckLog[]> {
  const list = await getJson<VoiceCheckLog[]>(VOICE_LOG_KEY, [])
  return (Array.isArray(list) ? list : []).slice(0, limit)
}

export async function saveVoiceCheck(row: VoiceCheckLog): Promise<void> {
  const list = await getJson<VoiceCheckLog[]>(VOICE_LOG_KEY, [])
  const idx = list.findIndex((x) => x.id === row.id)
  if (idx >= 0) list[idx] = row
  else list.unshift(row)
  await setJson(VOICE_LOG_KEY, list.slice(0, 500))
}

export async function getVoiceCheckByCallSid(callSid: string): Promise<VoiceCheckLog | null> {
  const list = await listVoiceChecks(500)
  return list.find((x) => x.callSid === callSid) ?? null
}

export function alertLabel(severity: DutyAlertSeverity): string {
  if (severity === 'severe') return '🔴 SEVERE'
  if (severity === 'medium') return '🟠 MEDIUM'
  return '🟡 MILD'
}

export function alertTypeLabel(type: DutyAlertType): string {
  const map: Record<DutyAlertType, string> = {
    late_start: 'Late start',
    out_of_post: 'Out of post',
    no_duty_start: 'No duty start',
    voice_on_duty: 'Voice check — on duty',
    voice_off_duty: 'Voice check — off duty',
    voice_no_answer: 'Voice check — no answer',
    report_late: 'Late Start',
    sick: 'Sick',
    on_the_way: 'On the way',
    break_duty: 'Break Duty',
    early_end: 'Ended duty early',
    chat_blocked: 'Blocked chat',
  }
  return map[type] || type
}

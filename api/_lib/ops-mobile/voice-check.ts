/**
 * Random duty verification call — Twilio voice.
 * Guard hears: Press 1 if on duty at post, Press 2 if off duty.
 *
 * Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VOICE_FROM (E.164)
 * Webhook: /api/ops-mobile/voice-webhook
 */
import {
  addDutyAlert,
  saveVoiceCheck,
  type VoiceCheckLog,
} from './duty-alerts.js'
import {
  getDutySessions,
  normaliseMobile,
  openDutyForGuard,
  opsNid,
  type OpsGuard,
} from './store.js'

function twilioConfig(): { sid: string; token: string; from: string; baseUrl: string } | null {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const token = process.env.TWILIO_AUTH_TOKEN?.trim()
  const from = process.env.TWILIO_VOICE_FROM?.trim()
  const baseUrl = (
    process.env.OPS_VOICE_WEBHOOK_BASE?.trim() ||
    process.env.HEALTH_CHECK_BASE_URL?.trim() ||
    'https://www.agilegroup-digital.co.in'
  ).replace(/\/$/, '')
  if (!sid || !token || !from) return null
  return { sid, token, from, baseUrl }
}

export function voiceCheckConfigured(): boolean {
  return twilioConfig() !== null
}

function toE164(mobile: string): string {
  const ten = normaliseMobile(mobile)
  return ten.length === 10 ? `+91${ten}` : `+${ten}`
}

/** TwiML for outbound call — gather 1 or 2. */
export function dutyVerifyTwiml(checkId: string, guardName: string, baseUrl?: string): string {
  const name = String(guardName || 'Guard').slice(0, 40)
  const base = (baseUrl || 'https://www.agilegroup-digital.co.in').replace(/\/$/, '')
  const action = `${base}/api/ops-mobile/voice-webhook?checkId=${encodeURIComponent(checkId)}`
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" timeout="10" action="${action}">
    <Say voice="Polly.Aditi">Good day. This is Agile Security Force duty verification for ${name}. Press 1 if you are on duty at your post. Press 2 if you are off duty.</Say>
  </Gather>
  <Say voice="Polly.Aditi">We did not receive a response. Goodbye.</Say>
</Response>`
}

export function voiceWebhookTwiml(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Aditi">${message.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Say></Response>`
}

export async function placeDutyVerifyCall(
  guard: OpsGuard,
  checkId: string,
): Promise<{ ok: boolean; callSid?: string; error?: string }> {
  const cfg = twilioConfig()
  if (!cfg) return { ok: false, error: 'Twilio not configured (TWILIO_ACCOUNT_SID, TOKEN, VOICE_FROM)' }

  const to = toE164(guard.mobile)
  const twiml = dutyVerifyTwiml(checkId, guard.name, cfg.baseUrl)
  const body = new URLSearchParams({
    To: to,
    From: cfg.from,
    Timeout: '45',
    StatusCallback: `${cfg.baseUrl}/api/ops-mobile/voice-webhook?status=1&checkId=${encodeURIComponent(checkId)}`,
    StatusCallbackMethod: 'POST',
  })

  body.set('Twiml', twiml.replace(/\n\s*/g, ''))

  try {
    const auth = Buffer.from(`${cfg.sid}:${cfg.token}`).toString('base64')
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cfg.sid}/Calls.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      signal: AbortSignal.timeout(25000),
    })
    const data = (await res.json().catch(() => null)) as { sid?: string; message?: string } | null
    if (!res.ok) {
      return { ok: false, error: data?.message || `Twilio HTTP ${res.status}` }
    }
    return { ok: true, callSid: data?.sid }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Call failed' }
  }
}

/** Pick random on-duty guards and queue verification calls. */
export async function runRandomDutyVoiceChecks(opts?: {
  maxCalls?: number
  branchFilter?: string
}): Promise<{
  ok: boolean
  configured: boolean
  queued: number
  skipped: number
  errors: string[]
}> {
  const max = Math.min(20, Math.max(1, Number(opts?.maxCalls ?? 5) || 5))
  const branchQ = String(opts?.branchFilter ?? '').trim().toLowerCase()
  const sessions = await getDutySessions()
  let onDuty = sessions.filter((s) => s.status === 'on_duty')
  if (branchQ) onDuty = onDuty.filter((s) => s.branch.toLowerCase().includes(branchQ))

  if (!onDuty.length) {
    return { ok: true, configured: voiceCheckConfigured(), queued: 0, skipped: 0, errors: [] }
  }

  // Shuffle and pick
  const picked = [...onDuty].sort(() => Math.random() - 0.5).slice(0, max)
  const errors: string[] = []
  let queued = 0
  let skipped = 0

  if (!voiceCheckConfigured()) {
    return {
      ok: false,
      configured: false,
      queued: 0,
      skipped: picked.length,
      errors: ['Twilio voice not configured'],
    }
  }

  for (const s of picked) {
    const checkId = opsNid('vc')
    const log: VoiceCheckLog = {
      id: checkId,
      at: new Date().toISOString(),
      guardId: s.guardId,
      idNo: s.idNo,
      name: s.name,
      mobile: s.mobile,
      status: 'queued',
    }
    await saveVoiceCheck(log)

    const guard: OpsGuard = {
      id: s.guardId,
      branch: s.branch,
      clientSite: s.clientSite,
      idNo: s.idNo,
      name: s.name,
      mobile: s.mobile,
      aadhaar: '',
      doj: '',
      idCardRenewal: '',
      designation: 'Security Guard',
      shift: '',
      active: true,
      createdAt: '',
      updatedAt: '',
    }
    const call = await placeDutyVerifyCall(guard, checkId)
    if (call.ok && call.callSid) {
      log.callSid = call.callSid
      log.status = 'queued'
      await saveVoiceCheck(log)
      queued++
    } else {
      log.status = 'failed'
      await saveVoiceCheck(log)
      errors.push(`${s.name}: ${call.error || 'failed'}`)
      skipped++
    }
  }

  return { ok: queued > 0 || !errors.length, configured: true, queued, skipped, errors }
}

/** Handle keypad 1 or 2 from Twilio Gather. */
export async function handleVoiceDigit(
  checkId: string,
  digit: string,
): Promise<{ ok: boolean; alertId?: string }> {
  const checks = await import('./duty-alerts.js').then((m) => m.listVoiceChecks(500))
  const log = checks.find((x) => x.id === checkId)
  if (!log) return { ok: false }

  log.digit = digit
  log.status = 'answered'
  await saveVoiceCheck(log)

  const sessions = await getDutySessions()
  const onDuty = openDutyForGuard(sessions, log.guardId)
  const today = new Date().toISOString().slice(0, 10)

  if (digit === '1') {
    const alert = await addDutyAlert({
      date: today,
      type: 'voice_on_duty',
      severity: 'mild',
      guardId: log.guardId,
      idNo: log.idNo,
      name: log.name,
      mobile: log.mobile,
      branch: '',
      clientSite: '',
      detail: 'Random voice check — guard confirmed ON duty (pressed 1)',
      voiceCallId: log.callSid,
    })
    log.alertId = alert.id
    await saveVoiceCheck(log)
    return { ok: true, alertId: alert.id }
  }

  if (digit === '2') {
    const severity = onDuty ? 'severe' : 'medium'
    const alert = await addDutyAlert({
      date: today,
      type: 'voice_off_duty',
      severity,
      guardId: log.guardId,
      idNo: log.idNo,
      name: log.name,
      mobile: log.mobile,
      branch: onDuty?.branch || '',
      clientSite: onDuty?.clientSite || '',
      detail: onDuty
        ? 'Random voice check — guard said OFF duty while system shows ON duty (pressed 2)'
        : 'Random voice check — guard confirmed off duty (pressed 2)',
      voiceCallId: log.callSid,
    })
    log.alertId = alert.id
    await saveVoiceCheck(log)
    return { ok: true, alertId: alert.id }
  }

  return { ok: false }
}

export async function handleVoiceNoAnswer(checkId: string): Promise<void> {
  const checks = await import('./duty-alerts.js').then((m) => m.listVoiceChecks(500))
  const log = checks.find((x) => x.id === checkId)
  if (!log || log.status === 'answered') return
  log.status = 'no_answer'
  await saveVoiceCheck(log)
  const today = new Date().toISOString().slice(0, 10)
  const alert = await addDutyAlert({
    date: today,
    type: 'voice_no_answer',
    severity: 'medium',
    guardId: log.guardId,
    idNo: log.idNo,
    name: log.name,
    mobile: log.mobile,
    branch: '',
    clientSite: '',
    detail: 'Random duty verification call — no answer or no key pressed',
    voiceCallId: log.callSid,
  })
  log.alertId = alert.id
  await saveVoiceCheck(log)
}

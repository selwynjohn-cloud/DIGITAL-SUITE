import { Resend } from 'resend'
import { isLeftCompanyEmail, isNoMailRecipientEmail, normaliseEmail } from '../auth.js'
import {
  markPinSent,
  pinRecentlySent,
  savePin,
  tryAcquirePinSendLock,
  releasePinSendLock,
  verifyPinDetailed,
} from '../pin-store.js'
import { pinMailFrom, pinMailReplyTo, sendSuiteEmail } from '../suite-mail.js'
import { CLIENT_DOOR_APP_ID, clientEmailAllowed, sitesForClientEmail } from './lookup.js'

function sixPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function sendClientDoorPin(email: string): Promise<{
  status: number
  json: Record<string, unknown>
}> {
  const em = normaliseEmail(email)
  if (!clientEmailAllowed(em)) {
    return { status: 400, json: { error: 'Please enter a valid work email.' } }
  }
  if (isLeftCompanyEmail(em) || isNoMailRecipientEmail(em)) {
    return { status: 400, json: { error: 'This email cannot open Client Door.' } }
  }
  const sites = await sitesForClientEmail(em)
  if (!sites.length) {
    return {
      status: 400,
      json: {
        error: 'This email is not on the Client Door list. Please ask your Agile branch HOD to send Client Door.',
      },
    }
  }
  if (await pinRecentlySent(em, CLIENT_DOOR_APP_ID)) {
    return { status: 200, json: { ok: true, sent: true, throttled: true } }
  }
  if (!(await tryAcquirePinSendLock(em, CLIENT_DOOR_APP_ID))) {
    return { status: 200, json: { ok: true, sent: true, throttled: true } }
  }
  const pin = sixPin()
  try {
    await savePin(em, pin, 'management', CLIENT_DOOR_APP_ID)
    const apiKey = process.env.RESEND_API_KEY?.trim()
    if (!apiKey) {
      if (process.env.NODE_ENV === 'production') {
        return { status: 503, json: { error: 'PIN mail is not set up. Please ask Agile.' } }
      }
      console.log(`[DEV] Client door PIN for ${em}: ${pin}`)
      await markPinSent(em, CLIENT_DOOR_APP_ID)
      return { status: 200, json: { ok: true, sent: true, devMode: true } }
    }
    const resend = new Resend(apiKey)
    const result = await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to: em,
      replyTo: pinMailReplyTo(),
      subject: `Your login PIN ${pin} — Client Door`,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1e293b">
          <p style="color:#c9a84c;letter-spacing:.15em;font-size:12px">AGILE SECURITY FORCE</p>
          <h2 style="margin:0 0 8px">Client Door</h2>
          <p>Your one-time PIN is:</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:.35em;color:#0f766e;margin:24px 0">${pin}</p>
          <p style="font-size:14px;color:#64748b">This PIN expires in <strong>15 minutes</strong>. Do not share it.</p>
          <p style="font-size:12px;color:#94a3b8;margin-top:28px">If you did not ask for this PIN, ignore this email.</p>
        </div>`,
      skipDirectorCc: true,
    })
    if ((result as { error?: { message?: string } }).error) {
      return {
        status: 502,
        json: { error: 'Could not send the PIN. Please try again in a minute.' },
      }
    }
    await markPinSent(em, CLIENT_DOOR_APP_ID)
    return { status: 200, json: { ok: true, sent: true } }
  } finally {
    await releasePinSendLock(em, CLIENT_DOOR_APP_ID)
  }
}

export async function verifyClientDoorPin(email: string, pin: string): Promise<{
  status: number
  json: Record<string, unknown>
  email?: string
}> {
  const em = normaliseEmail(email)
  const code = String(pin ?? '').replace(/\D/g, '')
  if (!clientEmailAllowed(em) || code.length !== 6) {
    return { status: 400, json: { error: 'Enter the email and the 6-digit PIN.' } }
  }
  const sites = await sitesForClientEmail(em)
  if (!sites.length) {
    return {
      status: 400,
      json: { error: 'This email is not on the Client Door list.' },
    }
  }
  const checked = await verifyPinDetailed(em, code, CLIENT_DOOR_APP_ID)
  if (!checked.record) {
    if (checked.failure === 'locked') {
      return { status: 400, json: { error: 'Too many tries. Ask for a new PIN.' } }
    }
    if (checked.failure === 'missing') {
      return { status: 400, json: { error: 'PIN expired. Tap Send PIN again.' } }
    }
    return { status: 400, json: { error: 'Wrong PIN. Try again.' } }
  }
  return { status: 200, json: { ok: true }, email: em }
}

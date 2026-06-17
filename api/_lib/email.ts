import { Resend } from 'resend'

export type SendPinEmailResult =
  | { ok: true; devMode: boolean }
  | { ok: false; error: string }

export async function sendPinEmail(
  email: string,
  pin: string,
  appTitle: string,
  role: string,
): Promise<SendPinEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.EMAIL_FROM ?? 'Agile Command Centre <onboarding@resend.dev>'

  const subject = `Your login PIN — ${appTitle}`
  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
      <p style="color: #c9a84c; letter-spacing: 0.15em; font-size: 12px;">AGILE SECURITY FORCE</p>
      <h2 style="margin: 0 0 8px;">Digital Operations Command Centre</h2>
      <p>Hello,</p>
      <p>Your one-time login PIN for <strong>${appTitle}</strong> (${role}) is:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 0.35em; color: #0f766e; margin: 24px 0;">${pin}</p>
      <p style="font-size: 14px; color: #64748b;">This PIN expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">If you did not request this PIN, ignore this email and contact your administrator.</p>
    </div>
  `

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      return {
        ok: false,
        error:
          'Email OTP is not set up yet. Ask IT to add RESEND_API_KEY on Vercel (or use SMS OTP if configured).',
      }
    }
    console.log(`[DEV] PIN for ${email}: ${pin}`)
    return { ok: true, devMode: true }
  }

  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({ from, to: email, subject, html })
    return { ok: true, devMode: false }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not send email'
    return { ok: false, error: `Email could not be sent: ${msg.slice(0, 120)}` }
  }
}

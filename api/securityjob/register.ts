import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendSuiteEmail } from '../_lib/suite-mail.js'
import { Resend } from 'resend'
import { addApplicant, getSettings, saveImage, sjStorageOk } from '../_lib/securityjob/store.js'

/** POST /api/securityjob/register — save a new applicant registration. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!sjStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })

  const body = (req.body ?? {}) as Record<string, unknown>
  const s = (v: unknown, max = 120) => String(v ?? '').trim().slice(0, max)

  const name = s(body.name)
  const phone = s(body.phone, 20)
  if (!name || phone.replace(/\D/g, '').length < 10) {
    return res.status(400).json({ error: 'Please enter your name and a valid mobile number.' })
  }

  let photoId = ''
  const photo = String(body.photo ?? '')
  if (photo.startsWith('data:image/')) {
    photoId = (await saveImage(photo)) ?? ''
  }

  const applicant = await addApplicant({
    name,
    phone,
    location: s(body.location),
    role: s(body.role),
    experience: s(body.experience),
    education: s(body.education),
    language: s(body.language),
    photoId,
  })
  if (!applicant) return res.status(503).json({ error: 'Could not save. Please try again.' })

  // Notify recruitment (best-effort).
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (apiKey) {
    try {
      const settings = await getSettings()
      const from = process.env.EMAIL_FROM ?? 'SecurityJob <onboarding@resend.dev>'
      const to = [settings.email1, settings.email2].filter(Boolean)
      const resend = new Resend(apiKey)
      await sendSuiteEmail(resend, {
        from,
        to: to.length ? to : ['recruitment@agilegroup.co.in'],
        subject: `New Registration — ${name} (${applicant.regCode})`,
        html: `<div style="font-family:Arial,sans-serif;color:#1e293b">
          <h2 style="color:#15803d">New Security Job Registration</h2>
          <p><b>Reg. Code:</b> ${applicant.regCode}</p>
          <p><b>Registered:</b> ${applicant.createdAt}</p>
          <p><b>Name:</b> ${name}<br><b>Phone:</b> ${phone}<br>
          <b>Location:</b> ${applicant.location}<br><b>Role:</b> ${applicant.role}<br>
          <b>Experience:</b> ${applicant.experience}<br><b>Education:</b> ${applicant.education}<br>
          <b>Language:</b> ${applicant.language}</p>
        </div>`,
      })
    } catch {
      /* ignore email errors */
    }
  }

  return res.status(200).json({ ok: true, regCode: applicant.regCode, registeredAt: applicant.createdAt })
}

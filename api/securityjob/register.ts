import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendSuiteEmail } from '../_lib/suite-mail.js'
import { Resend } from 'resend'
import {
  callDueAtFromCreated,
  resolveRegistrationOwner,
} from '../_lib/recruitment/registration-store.js'
import { resolveRecruitmentCentre } from '../_lib/securityjob/recruitment-centres.js'
import { isAdultDob } from '../_lib/securityjob/age.js'
import { addApplicant, getSettings, saveImage, sjStorageOk } from '../_lib/securityjob/store.js'
import { sjToRegisteredCandidate } from '../_lib/recruitment/registration-store.js'
import { rememberCandidatesInCustody } from '../_lib/recruitment/candidate-custody.js'
import { sendSjRegThankYouAskDate } from '../_lib/recruitment/sj-reg-ask-date.js'
import { queueOrPlaceSjAiCall } from '../_lib/recruitment/sj-ai-call.js'

export const config = { maxDuration: 30 }

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
  const dob = s(body.dob, 20)
  if (!isAdultDob(dob)) {
    return res.status(400).json({ error: 'Registration is only for age 18 years and above.' })
  }

  let photoId = ''
  const photo = String(body.photo ?? '')
  if (photo.startsWith('data:image/')) {
    photoId = (await saveImage(photo)) ?? ''
  }

  const applicant = await addApplicant({
    name,
    phone,
    email: s(body.email, 120).toLowerCase(),
    dob,
    location: s(body.location),
    role: s(body.role),
    experience: s(body.experience),
    education: s(body.education),
    language: s(body.language),
    photoId,
  })
  if (!applicant) return res.status(503).json({ error: 'Could not save. Please try again.' })
  void rememberCandidatesInCustody([sjToRegisteredCandidate(applicant)]).catch(() => {})
  try {
    await sendSjRegThankYouAskDate({
      phone: applicant.phone,
      id: applicant.id,
      name: applicant.name,
      regCode: applicant.regCode,
      location: applicant.location,
    })
  } catch {
    /* WhatsApp must not block the thank-you page */
  }
  try {
    await queueOrPlaceSjAiCall({
      phone: applicant.phone,
      id: applicant.id,
      name: applicant.name,
      regCode: applicant.regCode,
      location: applicant.location,
      language: applicant.language,
    })
  } catch {
    /* voice call is best-effort */
  }

  const ownerTeam = resolveRegistrationOwner(applicant.location)
  const callDueAt = callDueAtFromCreated(applicant.createdAt, applicant.regCode)
  const callDueLabel = new Date(callDueAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

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
        subject: `New Registration — ${name} (${applicant.regCode}) · Owner: ${ownerTeam}`,
        html: `<div style="font-family:Arial,sans-serif;color:#1e293b">
          <h2 style="color:#15803d">New Security Job Registration</h2>
          <p><b>Reg. Code:</b> ${applicant.regCode}</p>
          <p><b>Registered:</b> ${applicant.createdAt}</p>
          <p style="background:#fff7ed;border:1px solid #ea580c;padding:10px 12px;border-radius:8px">
            <b>Owner:</b> ${ownerTeam}<br>
            <b>Call by (24 hours):</b> ${callDueLabel}
          </p>
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

  const centre = resolveRecruitmentCentre(applicant.location)
  return res.status(200).json({
    ok: true,
    regCode: applicant.regCode,
    registeredAt: applicant.createdAt,
    centre: {
      city: centre.city,
      mapsUrl: centre.mapsUrl,
      helpDesk: centre.helpDesk,
      centralCommand: centre.centralCommand,
      nearby: centre.nearby,
      fallback: centre.fallback,
    },
  })
}

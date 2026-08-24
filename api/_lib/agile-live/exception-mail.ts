/** Agile Live — mail OM / HOD / Control / Director on Late Start, leaving post, or Break Duty. */

import { Resend } from 'resend'
import { CONTROL_EMAIL } from '../mis/branch-mail-cc.js'
import { getHodEmailsForBranch } from '../mis/digest.js'
import { getBranches, getUsers } from '../mis/store.js'
import { pinMailFrom, pinMailReplyTo, sendSuiteEmail, suiteDirectorEmail } from '../suite-mail.js'
import { liveRoomKey } from './branches.js'
import { LIVE_APP_NAME } from './types.js'

function esc(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
}

export async function sendLiveDutyExceptionMail(opts: {
  kind: 'late_start' | 'out_of_post' | 'break_duty' | 'early_end' | 'duty_continue' | 'staff_alarm'
  name: string
  idNo: string
  branch: string
  clientName: string
  location: string
  shiftLabel?: string
  metres?: number | null
  mapUrl?: string
  detail: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return
  const branches = await getBranches(true)
  const hit = branches.find(
    (b) => liveRoomKey(b.name) === liveRoomKey(opts.branch) || b.id === opts.branch || b.name === opts.branch,
  )
  const hods = hit ? await getHodEmailsForBranch(hit.id, await getUsers(), branches) : []
  const to = [
    ...new Set(
      [CONTROL_EMAIL, suiteDirectorEmail(), 'director@agilegroup.co.in', ...hods]
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.includes('@')),
    ),
  ]
  if (!to.length) return
  const label =
    opts.kind === 'late_start'
      ? 'Late Start'
      : opts.kind === 'break_duty'
        ? 'Break Duty'
        : opts.kind === 'early_end'
          ? 'Ended duty early'
          : opts.kind === 'duty_continue'
            ? 'Duty continuation'
            : opts.kind === 'staff_alarm'
              ? 'Alarm'
              : 'Out of Post'
  const metresLine =
    opts.metres != null ? `<p>Distance from duty post: <b>${opts.metres} metres</b></p>` : ''
  const mapLine = opts.mapUrl
    ? `<p><a href="${esc(opts.mapUrl)}">Open Map</a></p>`
    : ''
  const resend = new Resend(apiKey)
  await sendSuiteEmail(resend, {
    from: pinMailFrom(),
    to,
    replyTo: pinMailReplyTo(),
    subject: `${LIVE_APP_NAME} — ${label} — ${opts.name} (${opts.idNo})`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;color:#111">
      <div style="background:#14224f;color:#fff;padding:14px;border-radius:8px 8px 0 0">
        <b style="color:#c9a84c">${esc(LIVE_APP_NAME)} — ${esc(label)}</b>
      </div>
      <div style="padding:16px;border:1px solid #ddd;border-top:none">
        <p><b>${esc(opts.name)}</b> · ID ${esc(opts.idNo)}</p>
        <p>${esc(opts.clientName)}${opts.location ? ` · ${esc(opts.location)}` : ''}${opts.shiftLabel ? ` · ${esc(opts.shiftLabel)}` : ''}</p>
        <p>${esc(opts.branch)}</p>
        <p>${esc(opts.detail)}</p>
        ${metresLine}
        ${mapLine}
      </div>
    </div>`,
  })
}

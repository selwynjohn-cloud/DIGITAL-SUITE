/**
 * Daily 8:00 PM IST — Agile Training consolidated brief (LMS portal + contacts).
 * LMS metrics live on the external Training app; this digests portal links + daily reminder.
 */

import { Resend } from 'resend'
import { misTodayIst } from '../mis/dates.js'
import { pinMailFrom, sendSuiteEmail } from '../suite-mail.js'
import {
  escHtml,
  suiteColourEmailShell,
  suiteDigestRecipients,
  suiteStatRow,
} from '../suite-digest-shell.js'
import { trainingTargetUrl } from '../suite-gate-config.js'

export function buildTrainingDailyBriefEmail(reportDate?: string): { subject: string; html: string; reportDate: string } {
  const date = String(reportDate || misTodayIst()).slice(0, 10)
  const lecturer = trainingTargetUrl('lecturer')
  const trainee = trainingTargetUrl('trainee')
  const management = trainingTargetUrl('management')
  const subject = `Agile Training — Consolidated Daily Brief ${date}`

  const body = `
    <p style="margin:0 0 8px">Dear Director / HODs,</p>
    <p style="margin:0 0 12px;color:#475569">Colourful daily Training brief for <b>${escHtml(date)}</b> — ready to share with clients and during sales discussions.</p>
    ${suiteStatRow([
      { label: 'LMS portals', value: 3, color: '#0f766e', bg: '#f0fdfa' },
      { label: 'Helpline', value: '1800', color: '#7c3aed', bg: '#f5f3ff' },
      { label: 'Focus', value: 'Quality', color: '#0369a1', bg: '#eff6ff' },
    ])}
    <div style="padding:16px;border-radius:14px;background:linear-gradient(135deg,#ecfeff,#f0fdf4);border:1px solid #99f6e4;margin-bottom:16px">
      <div style="font-weight:900;color:#0f766e;margin-bottom:8px">Today’s Training priorities</div>
      <ul style="margin:0;padding-left:18px;color:#134e4a;line-height:1.7">
        <li>Ensure new guards complete induction modules before site posting</li>
        <li>Track refresher sessions for high-value client sites</li>
        <li>Share Training Academy credentials with branch lecturers</li>
        <li>Highlight soft-skills + duty discipline modules in client pitches</li>
      </ul>
    </div>
    <h3 style="margin:8px 0 10px;color:#0f766e;font-size:15px">Open Training portals</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px">
      <tr>
        <td style="padding:12px;border:1px solid #ccfbf1;border-radius:10px;background:#fff">
          <b style="color:#0f766e">Lecturer / Branch</b><br>
          <a href="${escHtml(lecturer)}" style="color:#0369a1;word-break:break-all">${escHtml(lecturer)}</a>
        </td>
      </tr>
      <tr><td style="height:8px"></td></tr>
      <tr>
        <td style="padding:12px;border:1px solid #e0e7ff;border-radius:10px;background:#fff">
          <b style="color:#4338ca">Trainee / Guard</b><br>
          <a href="${escHtml(trainee)}" style="color:#0369a1;word-break:break-all">${escHtml(trainee)}</a>
        </td>
      </tr>
      <tr><td style="height:8px"></td></tr>
      <tr>
        <td style="padding:12px;border:1px solid #fde68a;border-radius:10px;background:#fff">
          <b style="color:#b45309">Management</b><br>
          <a href="${escHtml(management)}" style="color:#0369a1;word-break:break-all">${escHtml(management)}</a>
        </td>
      </tr>
    </table>
    <div style="padding:14px 16px;border-radius:12px;background:#fff7ed;border:1px solid #fed7aa;margin-bottom:12px">
      <b style="color:#9a3412">Sales / client talking points</b>
      <p style="margin:8px 0 0;color:#7c2d12;font-size:13px;line-height:1.6">
        Agile trains guards through a structured LMS covering duty protocols, customer handling,
        emergency response, and site discipline — backed by Central Control Centre
        <b>+91 9248707070</b>, Control <b>control@agilegroup.co.in</b>, Toll Free <b>18005995599</b>,
        Help Desk <b>+91 85009 15599</b>, and complaint QR at every branch.
      </p>
    </div>
    <p style="font-size:12px;color:#64748b;margin:0">
      Websites: <a href="https://www.agilegroup.co.in" style="color:#0f766e">agilegroup.co.in</a> ·
      <a href="https://www.securityjob.co.in" style="color:#0369a1">securityjob.co.in</a>
    </p>`

  return {
    reportDate: date,
    subject,
    html: suiteColourEmailShell({
      appName: 'Agile Training',
      title: 'Consolidated Daily Training Brief',
      subtitle: `${escHtml(date)} · LMS · Client-ready overview`,
      accentFrom: '#0f766e',
      accentTo: '#06b6d4',
      bodyHtml: body,
      footerNote: 'Agile Training Academy · Building disciplined, client-ready teams',
    }),
  }
}

export async function sendTrainingDailyBriefMail(opts?: {
  reportDate?: string
  sampleOnly?: boolean
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false as const, error: 'Email not configured' }

  const built = buildTrainingDailyBriefEmail(opts?.reportDate)
  const recipients = await suiteDigestRecipients({ sampleOnly: opts?.sampleOnly })
  const resend = new Resend(apiKey)
  const sampleTag = recipients.sampleOnly ? ' [SAMPLE — you only]' : ''
  const result = await sendSuiteEmail(resend, {
    from: pinMailFrom(),
    to: recipients.to,
    cc: recipients.cc.length ? recipients.cc : undefined,
    skipDirectorCc: true,
    subject: built.subject + sampleTag,
    html: built.html,
  })
  if (result.error) {
    return { ok: false as const, error: result.error.message || 'Send failed', recipients, reportDate: built.reportDate }
  }
  return {
    ok: true as const,
    recipients,
    reportDate: built.reportDate,
    subject: built.subject + sampleTag,
  }
}

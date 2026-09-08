import { Resend } from 'resend'
import { sendSuiteEmail } from '../suite-mail.js'
import {
  suiteColourEmailShell,
  suiteStatRow,
  suiteTable,
  escHtml,
} from '../suite-digest-shell.js'
import type { GuardComplaint } from './store.js'
import { departmentForCategory, getDeptStaff, getOpsStaff } from './store.js'
import { getHodEmailsForBranch } from '../mis/digest.js'
import { findDeptInDirectoryOrSaved, findOpsInDirectoryOrSaved } from './directory-staff.js'
import { hodEmailsForBranch } from './hod-contacts.js'
import { waSendText, whatsappConfigured } from '../pulse/whatsapp.js'
import {
  completionLetterBody,
  completionLetterSubject,
  completionLetterWhatsApp,
  displayStatus,
  SLA_LABEL,
} from './completion.js'
import { satisfactionFromFeedback } from './digest.js'
import { guardsGoogleReviewUrl } from './brand.js'
import type { GuardsDashboard } from './dashboard.js'

function esc(s: unknown) {
  return String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function fmtIst(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    })
  } catch {
    return iso
  }
}

function directorEmail() {
  return (
    process.env.MIS_DIRECTOR_EMAIL?.trim() ||
    process.env.FLEET_DIRECTOR_EMAIL?.trim() ||
    'director@agilegroup.co.in'
  )
}

function cfoEmail() {
  return process.env.GUARDS_CFO_EMAIL?.trim() || 'cfo@agilegroup.co.in'
}

function hrEmail() {
  return process.env.GUARDS_HR_EMAIL?.trim() || 'hr@agilegroup.co.in'
}

function departmentEmail(dept: string): string {
  const d = dept.toLowerCase()
  if (d.includes('finance')) return process.env.GUARDS_FINANCE_EMAIL?.trim() || hrEmail()
  if (d.includes('hr')) return hrEmail()
  return process.env.GUARDS_OPS_EMAIL?.trim() || directorEmail()
}

export function whatsappMobile(raw: string): string {
  let d = String(raw ?? '').replace(/\D/g, '')
  if (d.startsWith('0') && d.length === 11) d = d.slice(1)
  if (d.length === 10) return `91${d}`
  if (d.length === 12 && d.startsWith('91')) return d
  return d
}

function complaintDetailHtml(c: GuardComplaint, branchName: string) {
  const rows = [
    ['Complaint Code', c.code],
    ['Received', fmtIst(c.registeredAt)],
    ['SLA Deadline (24h)', fmtIst(c.slaDeadline)],
    ['Branch', branchName],
    ['Guard Name', c.guardName],
    ['Guard ID No.', c.idNo],
    ['Mobile', c.mobile],
    ['Client', c.clientName || '—'],
    ['Location', c.location || '—'],
    ['Category', c.category],
    ['Detail', c.subCategory],
    ['Complaint', c.complaintNote],
    ['Assigned Operations Staff', c.opsStaffName || '—'],
    ['Department', c.department || departmentForCategory(c.category)],
    ['Status', c.status],
  ]
  if (c.referralJoined && c.referrals?.length) {
    rows.push(['Referrals', c.referrals.map((r) => `${r.name} (${r.phone}) — ${r.city}`).join('; ')])
  }
  const tr = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;width:38%;vertical-align:top">${esc(k)}</td><td style="padding:8px;border-bottom:1px solid #eee">${esc(v)}</td></tr>`,
    )
    .join('')
  return `<table style="width:100%;font-size:14px;border-collapse:collapse;margin-top:12px">${tr}</table>`
}

export function hodWhatsAppRequestText(c: GuardComplaint, detailsWanted: string): string {
  return (
    `*Agile Security Force — Complaint Follow-up*\n\n` +
    `Dear ${c.guardName},\n\n` +
    `Regarding your complaint *${c.code}* (${c.category} — ${c.subCategory}), we need the following details:\n\n` +
    `${detailsWanted}\n\n` +
    `Please reply on WhatsApp at your earliest.\n\n` +
    `— Agile Internal Customer Care`
  )
}

/** Email on new guard complaint — ops, department, CC HOD, Director, CFO, HR. */
export async function sendGuardComplaintMail(c: GuardComplaint, branchName: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, skipped: true, reason: 'Email not configured' }

  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Guards <noreply@agilegroup.co.in>'
  const director = directorEmail()
  const hodEmails = await getHodEmailsForBranch(c.branchId)
  const dept = c.department || departmentForCategory(c.category)

  const primaryTo = new Set<string>()
  if (c.opsStaffEmail?.includes('@')) primaryTo.add(c.opsStaffEmail.trim())
  primaryTo.add(departmentEmail(dept))

  const cc = new Set<string>()
  for (const e of hodEmails) cc.add(e)
  cc.add(director)
  cc.add(cfoEmail())
  cc.add(hrEmail())

  const toList = [...primaryTo].filter(Boolean)
  const ccList = [...cc].filter((e) => !toList.includes(e))

  if (!toList.length) toList.push(director)

  const html = `<div style="font-family:Arial,sans-serif;max-width:680px;color:#111">
    <div style="background:#7f1d1d;color:#fff;padding:16px;border-radius:8px 8px 0 0">
      <b style="color:#fecaca">Agile Guards — New Complaint Registered</b>
      <div style="font-size:13px;margin-top:6px">Respond within 24 hours</div>
    </div>
    <div style="padding:16px;border:1px solid #ddd;border-top:none">
      <p>A guard has registered a complaint. <b>Operations team</b> and <b>${esc(dept)}</b> — please take action.</p>
      ${complaintDetailHtml(c, branchName)}
      <p style="font-size:12px;color:#64748b;margin-top:14px">
        <a href="https://www.agilegroup-digital.co.in/guards">Open Agile Guards HOD Portal</a>
      </p>
    </div>
  </div>`

  const result = await sendSuiteEmail(resend, {
    from,
    to: toList,
    cc: ccList.length ? ccList : undefined,
    subject: `🛡 Guard Complaint ${c.code} — ${branchName} — ${c.guardName}`,
    html,
  })

  if (result.error) return { ok: false, error: result.error.message }
  return { ok: true, to: toList, cc: ccList }
}

/** WhatsApp alert to assigned ops + HOD on new complaint. */
export async function sendGuardComplaintWhatsApp(c: GuardComplaint, branchName: string) {
  if (!whatsappConfigured()) return { ok: false, skipped: true }

  const body =
    `🛡 *New Guard Complaint*\n\n` +
    `*Code:* ${c.code}\n` +
    `*Branch:* ${branchName}\n` +
    `*Guard:* ${c.guardName} (ID ${c.idNo})\n` +
    `*Mobile:* ${c.mobile}\n` +
    `*Category:* ${c.category} — ${c.subCategory}\n` +
    `*Assigned to:* ${c.opsStaffName || 'Operations team'}\n` +
    `*Department:* ${c.department}\n` +
    `*SLA:* 24 hours\n\n` +
    `${String(c.complaintNote).slice(0, 240)}`

  const sent: string[] = []
  const admin = whatsappMobile(process.env.ADMIN_WHATSAPP ?? '')
  if (admin.length >= 12) {
    const r = await waSendText(admin, body)
    if (r?.ok) sent.push('director')
  }

  return { ok: sent.length > 0, sent }
}

function mdEmail() {
  return process.env.GUARDS_MD_EMAIL?.trim() || process.env.MIS_MD_EMAIL?.trim() || directorEmail()
}

export function shareLinkWhatsAppText(branchName: string, url: string) {
  return (
    `*Agile Security Force — Guards Complaint*\n\n` +
    `Branch: ${branchName}\n\n` +
    `Register your complaint here (no login):\n${url}\n\n` +
    `*Our response time: ${SLA_LABEL}*\n\n` +
    `— Agile Internal Customer Care`
  )
}

export async function sendShareLinkWhatsApp(mobile: string, branchName: string, url: string) {
  if (!whatsappConfigured()) return { ok: false, skipped: true }
  const to = whatsappMobile(mobile)
  if (to.length < 12) return { ok: false, error: 'Invalid mobile' }
  const r = await waSendText(to, shareLinkWhatsAppText(branchName, url))
  return { ok: Boolean(r?.ok) }
}

export async function sendShareLinkEmail(toEmail: string, branchName: string, url: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey || !toEmail.includes('@')) return { ok: false, skipped: true }
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Guards <noreply@agilegroup.co.in>'
  const r = await sendSuiteEmail(resend, {
    from,
    to: [toEmail],
    subject: `Agile Guards — Complaint link — ${branchName}`,
    html: `<p>Share with guards. <b>Response time: ${SLA_LABEL}</b></p><p><a href="${esc(url)}">${esc(url)}</a></p>`,
  })
  return { ok: !r.error, error: r.error?.message }
}

/** Completion letter to guard — email or WhatsApp. Includes feedback form link. */
export async function sendCompletionLetter(
  c: GuardComplaint,
  channel: 'email' | 'whatsapp',
  assurance: string,
  actor: string,
) {
  const fbUrl = feedbackFormUrl(c.code)
  const reviewUrl = guardsGoogleReviewUrl()
  const subject = completionLetterSubject(c.code)
  const body = completionLetterBody(c, assurance, fbUrl, reviewUrl)
  if (channel === 'whatsapp') {
    if (!whatsappConfigured()) return { ok: false, skipped: true }
    const to = whatsappMobile(c.mobile)
    if (to.length < 12) return { ok: false, error: 'Guard mobile invalid' }
    const r = await waSendText(to, completionLetterWhatsApp(c, assurance, fbUrl, reviewUrl))
    return { ok: Boolean(r?.ok), channel, subject, body, sentTo: c.mobile, feedbackUrl: fbUrl }
  }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, skipped: true }
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Guards <noreply@agilegroup.co.in>'
  const r = await sendSuiteEmail(resend, {
    from,
    to: [directorEmail()],
    subject,
    html: `<pre style="font-family:Arial;font-size:14px;white-space:pre-wrap">${esc(body)}</pre>
      <p style="margin-top:14px"><a href="${esc(fbUrl)}" style="color:#b91c1c;font-weight:bold">Share your feedback (1–5 stars) →</a></p>
      <p style="margin-top:8px;font-size:13px">Optional — if you are satisfied, you may also leave a Google review (not compulsory):<br>
      <a href="${esc(reviewUrl)}">${esc(reviewUrl)}</a></p>
      <p><i>Forward to guard ${esc(c.mobile)} if no email on file.</i></p>`,
  })
  return { ok: !r.error, channel, subject, body, sentTo: c.mobile, feedbackUrl: fbUrl, error: r.error?.message }
}

/** Delayed complaint — Director + HOD + assigned departments. */
export async function sendDelayedEscalationMail(c: GuardComplaint, branchName: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, skipped: true }
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Guards <noreply@agilegroup.co.in>'
  const director = directorEmail()
  const hodEmails = await getHodEmailsForBranch(c.branchId)
  const dept = c.department || departmentForCategory(c.category)
  const to = new Set<string>([director, ...hodEmails])
  if (c.opsStaffEmail?.includes('@')) to.add(c.opsStaffEmail)
  if (c.deptStaffEmail?.includes('@')) to.add(c.deptStaffEmail)
  to.add(departmentEmail(dept))
  const toList = [...to].filter(Boolean)
  const r = await sendSuiteEmail(resend, {
    from,
    to: toList,
    subject: `⚠ DELAYED — Guard Complaint ${c.code} — ${branchName} — past ${SLA_LABEL}`,
    html: `<div style="font-family:Arial,sans-serif"><h2 style="color:#b91c1c">Delayed Complaint — ${SLA_LABEL} exceeded</h2>
      <p>Full details below. Please close and send completion letter to guard.</p>
      ${complaintDetailHtml(c, branchName)}</div>`,
  })
  return { ok: !r.error, to: toList, error: r.error?.message }
}

/** Delayed apology to the guard (WhatsApp once) + email copy CC: IT, HOD, assigned staff, Director. */
export async function sendDelayedGuardApologyWhatsApp(c: GuardComplaint, branchName: string) {
  const mobile = whatsappMobile(c.mobile || '')
  const subject = `Delayed apology — ${c.code} — ${branchName}`
  const body =
    `Agile Security Force — Guard Care\n\n` +
    `Dear ${c.guardName || 'Guard'},\n\n` +
    `We apologise that complaint *${c.code}* (${branchName}) is taking longer than our ${SLA_LABEL} promise.\n\n` +
    `Our team is following up. You will get a completion message when it is closed.\n\n` +
    `— Agile Guards`
  const html =
    `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#0f172a">` +
    `<p><b>Agile Security Force — Guard Care</b></p>` +
    `<p>Dear ${esc(c.guardName || 'Guard')},</p>` +
    `<p>We apologise that complaint <b>${esc(c.code)}</b> (${esc(branchName)}) is taking longer than our ${esc(SLA_LABEL)} promise.</p>` +
    `<p>Our team is following up. You will get a completion message when it is closed.</p>` +
    `<p>— Agile Guards</p>` +
    `<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">` +
    `<p style="font-size:12px;color:#64748b">Staff copy — To: Assigned staff · CC: IT, HOD, Director. Same apology sent once to the guard on WhatsApp.</p>` +
    `${complaintDetailHtml(c, branchName)}` +
    `</div>`

  let waOk = false
  let waSkipped = false
  let waError: string | undefined
  if (!whatsappConfigured() || mobile.length < 12) {
    waSkipped = true
  } else {
    const r = await waSendText(mobile, body)
    waOk = Boolean(r?.ok)
    if (!waOk) waError = 'WhatsApp send failed'
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  let mailOk = false
  let mailTo: string[] = []
  let mailCc: string[] = []
  let mailError: string | undefined
  if (apiKey) {
    const resend = new Resend(apiKey)
    const from = process.env.EMAIL_FROM ?? 'Agile Guards <noreply@agilegroup.co.in>'
    const director = directorEmail()
    const hodEmails = await getHodEmailsForBranch(c.branchId)
    const assigned = [c.opsStaffEmail, c.deptStaffEmail]
      .map((e) => String(e || '').trim().toLowerCase())
      .filter((e) => e.includes('@'))
    // To: assigned staff · CC: HOD, Director — never it@ (left the company)
    const toSet = new Set<string>(assigned)
    if (!toSet.size) {
      // No assigned email yet — Director holds To so the copy still goes out once.
      toSet.add(director.toLowerCase())
    }
    const ccSet = new Set<string>()
    for (const e of [...hodEmails, director]) {
      const em = String(e || '').trim().toLowerCase()
      if (!em.includes('@') || toSet.has(em)) continue
      ccSet.add(em)
    }
    mailTo = [...toSet]
    mailCc = [...ccSet]
    if (mailTo.length) {
      const r = await sendSuiteEmail(resend, {
        from,
        to: mailTo,
        cc: mailCc.length ? mailCc : undefined,
        subject: `${subject} (staff copy)`,
        html,
      })
      mailOk = !r.error
      if (r.error) mailError = r.error.message
    }
  }

  return {
    ok: waOk || mailOk,
    skipped: waSkipped && !mailOk,
    subject,
    body,
    sentTo: waOk ? mobile : c.mobile || '',
    emailTo: mailTo,
    emailCc: mailCc,
    whatsappOk: waOk,
    emailOk: mailOk,
    error: waError || mailError,
  }
}

export async function notifyNewGuardComplaint(c: GuardComplaint, branchName: string) {
  const [email, whatsapp] = await Promise.all([
    sendGuardComplaintMail(c, branchName),
    sendGuardComplaintWhatsApp(c, branchName),
  ])
  return { email, whatsapp }
}

/** Appreciation to department/ops who delayed but then solved. */
export async function sendDeptAppreciationMail(c: GuardComplaint, branchName: string) {
  const email = c.deptStaffEmail || c.opsStaffEmail
  if (!email?.includes('@')) return { ok: false, skipped: true }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, skipped: true }
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Guards <noreply@agilegroup.co.in>'
  const name = c.deptStaffName || c.opsStaffName || 'Team'
  const r = await sendSuiteEmail(resend, {
    from,
    to: [email],
    cc: [directorEmail()],
    subject: `Thank you — ${c.code} resolved — maintain ${SLA_LABEL} response`,
    html: `<p>Dear ${esc(name)},</p>
      <p>Thank you for resolving guard complaint <b>${esc(c.code)}</b> (${esc(branchName)}).</p>
      <p>Please maintain our overall <b>${SLA_LABEL}</b> response standard for all guard complaints.</p>
      <p>— Agile Guards Management</p>`,
  })
  return { ok: !r.error, error: r.error?.message }
}

export async function sendWeeklyManagementReport(
  branchName: string,
  report: {
    weekReceived: number
    weekSolved: number
    pending: number
    delayed: number
    avgResponseHours: number
    pendingList: { code: string; guardName: string; category: string; holder: string; hoursSince: number; status: string }[]
  },
  branchId?: string,
) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, skipped: true }
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Guards <noreply@agilegroup.co.in>'
  const director = directorEmail()
  const hodEmails = await getHodEmailsForBranch(branchId || branchName)
  const rows = report.pendingList
    .map(
      (p) =>
        `<tr><td>${esc(p.code)}</td><td>${esc(p.guardName)}</td><td>${esc(p.category)}</td><td>${esc(p.holder)}</td><td>${p.hoursSince}h</td><td>${esc(p.status)}</td></tr>`,
    )
    .join('')
  const html = `<div style="font-family:Arial,sans-serif">
    <h2>Agile Guards — Weekly Report — ${esc(branchName)}</h2>
    <p>Received (7 days): <b>${report.weekReceived}</b> · Solved: <b>${report.weekSolved}</b> · Pending: <b>${report.pending}</b> · Delayed: <b>${report.delayed}</b></p>
    <p>Average response: <b>${report.avgResponseHours} hours</b> (target: ${SLA_LABEL})</p>
    <table border="1" cellpadding="6" style="border-collapse:collapse;font-size:13px">
      <tr><th>Code</th><th>Guard</th><th>Category</th><th>Held by</th><th>Hours since submit</th><th>Status</th></tr>
      ${rows || '<tr><td colspan="6">No pending complaints</td></tr>'}
    </table></div>`
  const to = [director, mdEmail(), ...hodEmails].filter(Boolean)
  const r = await sendSuiteEmail(resend, {
    from,
    to: [...new Set(to)],
    subject: `Agile Guards Weekly — ${branchName} — ${report.pending} pending`,
    html,
  })
  return { ok: !r.error, to, error: r.error?.message }
}

/** Director reminder — HOD and/or Department for a delayed complaint. */
export async function sendDelayedReminderMail(
  c: GuardComplaint,
  branchName: string,
  target: 'hod' | 'department' | 'both',
  actor: string,
  opts?: {
    hodEmail?: string
    opsStaffId?: string
    deptStaffId?: string
    branches?: { id: string; name: string }[]
    misUsers?: Awaited<ReturnType<typeof import('../mis/store.js').getUsers>>
    portalUsers?: Awaited<ReturnType<typeof import('./store.js').getPortalUsers>>
  },
) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, skipped: true, error: 'Email is not configured. Branch delayed lists still go at 9:30 AM and 5:00 PM.' }
  }
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Guards <noreply@agilegroup.co.in>'
  const director = directorEmail()
  const dept = c.department || departmentForCategory(c.category)
  const to = new Set<string>()

  if (target === 'hod' || target === 'both') {
    const pick = opts?.hodEmail?.trim()
    if (pick?.includes('@')) to.add(pick)
    else if (opts?.branches && opts.misUsers) {
      const hodEmails = await hodEmailsForBranch(
        c.branchId,
        opts.branches,
        opts.misUsers,
        opts.portalUsers ?? [],
      )
      for (const e of hodEmails) to.add(e)
    } else {
      for (const e of await getHodEmailsForBranch(c.branchId)) to.add(e)
    }
  }

  if (target === 'department' || target === 'both') {
    let picked = false
    if (opts?.opsStaffId) {
      const staff = findOpsInDirectoryOrSaved(
        opts.opsStaffId,
        await getOpsStaff(),
        opts.misUsers ?? [],
        opts.portalUsers ?? [],
        opts.branches ?? [],
      )
      if (staff?.email?.includes('@')) {
        to.add(staff.email.trim())
        picked = true
      }
    }
    if (opts?.deptStaffId) {
      const staff = findDeptInDirectoryOrSaved(opts.deptStaffId, await getDeptStaff(), opts.misUsers ?? [])
      if (staff?.email?.includes('@')) {
        to.add(staff.email.trim())
        picked = true
      }
    }
    if (!picked) {
      if (c.deptStaffEmail?.includes('@')) to.add(c.deptStaffEmail)
      if (c.opsStaffEmail?.includes('@')) to.add(c.opsStaffEmail)
      to.add(departmentEmail(dept))
    }
  }

  const toList = [...to].filter((e) => e.includes('@'))
  if (!toList.length) toList.push(director)
  const clk = stageClocksForMail(c)
  const r = await sendSuiteEmail(resend, {
    from,
    to: toList,
    cc: [director],
    subject: `REMINDER — Delayed ${c.code} — ${branchName} — Director follow-up`,
    html: `<div style="font-family:Arial,sans-serif">
      <h2 style="color:#b91c1c">Director Reminder — ${SLA_LABEL} exceeded</h2>
      <p>Please close this complaint urgently and send completion letter to the guard.</p>
      <p><b>Time taken:</b> HOD wait ${clk.hodWaitHrs}h · Operations ${clk.opsHrs}h · Department ${clk.deptHrs}h · Total ${clk.totalHrs}h</p>
      <p><b>Delayed at:</b> ${clk.delayStage}</p>
      ${complaintDetailHtml(c, branchName)}
      <p style="font-size:12px;color:#64748b">Sent by ${esc(actor)} via Agile Guards Management Portal</p>
    </div>`,
  })
  return { ok: !r.error, to: toList, error: r.error?.message }
}

function stageClocksForMail(c: GuardComplaint) {
  const now = new Date().toISOString()
  const end = c.solvedAt || now
  function hrs(a: string, b: string) {
    if (!a || !b) return 0
    return Math.max(0, Math.round(((new Date(b).getTime() - new Date(a).getTime()) / 3600000) * 10) / 10)
  }
  const hodWaitHrs = c.assignedAt ? hrs(c.registeredAt, c.assignedAt) : hrs(c.registeredAt, now)
  const opsHrs = c.assignedAt ? hrs(c.assignedAt, c.opsCompletedAt || end) : 0
  const deptHrs = c.assignedAt
    ? hrs(c.opsCompletedAt || c.assignedAt, c.deptCompletedAt || end)
    : 0
  const totalHrs = hrs(c.registeredAt, end)
  const stages = [
    { name: 'HOD / RM assignment', hrs: hodWaitHrs },
    { name: 'Operations', hrs: opsHrs },
    { name: 'Department', hrs: deptHrs },
  ]
  const top = stages.sort((a, b) => b.hrs - a.hrs)[0]
  return { hodWaitHrs, opsHrs, deptHrs, totalHrs, delayStage: top?.hrs ? top.name : 'Awaiting assignment' }
}

export function feedbackFormUrl(code: string) {
  return `https://www.agilegroup-digital.co.in/guards/feedback?code=${encodeURIComponent(code)}`
}

export async function sendFeedbackRequest(
  c: GuardComplaint,
  channel: 'email' | 'whatsapp',
  actor: string,
) {
  const url = feedbackFormUrl(c.code)
  const text =
    `*Agile Security Force — Your feedback*\n\n` +
    `Dear ${c.guardName},\n\n` +
    `Your complaint *${c.code}* has been handled. Please share your satisfaction (1–5 stars):\n\n` +
    `${url}\n\n` +
    `— Agile Internal Customer Care`
  if (channel === 'whatsapp') {
    if (!whatsappConfigured()) return { ok: false, skipped: true }
    const to = whatsappMobile(c.mobile)
    if (to.length < 12) return { ok: false, error: 'Invalid mobile' }
    const r = await waSendText(to, text)
    return { ok: Boolean(r?.ok), channel, sentTo: c.mobile, body: text, subject: `Feedback — ${c.code}` }
  }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, skipped: true }
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Guards <noreply@agilegroup.co.in>'
  const subject = `Please share your feedback — ${c.code}`
  const html = `<p>Dear ${esc(c.guardName)},</p>
    <p>Your complaint <b>${esc(c.code)}</b> has been closed. Please rate our service (1–5 stars):</p>
    <p><a href="${esc(url)}">${esc(url)}</a></p>
    <p>— Agile Guards</p>`
  const r = await sendSuiteEmail(resend, { from, to: [directorEmail()], subject, html })
  return {
    ok: !r.error,
    channel,
    sentTo: c.mobile,
    body: url,
    subject,
    error: r.error?.message,
  }
}

/** Notify HODs (+ CC Director) when guard submits feedback. */
export async function sendFeedbackSubmittedMail(
  c: GuardComplaint,
  branchName: string,
  rating: number,
  comment: string,
) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, skipped: true }
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Guards <noreply@agilegroup.co.in>'
  const director = directorEmail()
  const hodEmails = await getHodEmailsForBranch(c.branchId)
  const toList = [...new Set(hodEmails.filter((e) => e.includes('@')))]
  if (!toList.length) toList.push(director)
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  const sat = satisfactionFromFeedback(rating, comment)
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px">
    <div style="background:linear-gradient(135deg,#7f1d1d,#450a0a);color:#fff;padding:16px;border-radius:8px 8px 0 0">
      <b>Agile Guards — Guard Feedback Received</b>
    </div>
    <div style="padding:16px;border:1px solid #ddd;border-top:none">
      <p>A guard has submitted satisfaction feedback for complaint <b>${esc(c.code)}</b>.</p>
      <table style="width:100%;font-size:14px;border-collapse:collapse;margin-top:10px">
        <tr><td style="padding:6px;font-weight:600;width:40%">Branch</td><td style="padding:6px">${esc(branchName)}</td></tr>
        <tr><td style="padding:6px;font-weight:600">Guard</td><td style="padding:6px">${esc(c.guardName)}</td></tr>
        <tr><td style="padding:6px;font-weight:600">ID No.</td><td style="padding:6px">${esc(c.idNo)}</td></tr>
        <tr><td style="padding:6px;font-weight:600">Category</td><td style="padding:6px">${esc(c.category)} — ${esc(c.subCategory)}</td></tr>
        <tr><td style="padding:6px;font-weight:600">Rating for Agile</td><td style="padding:6px;color:#f59e0b;font-size:18px">${stars} (${rating}/5)</td></tr>
        <tr><td style="padding:6px;font-weight:600">AI reading</td><td style="padding:6px">${esc(sat.label)}</td></tr>
        <tr><td style="padding:6px;font-weight:600;vertical-align:top">Comment</td><td style="padding:6px">${esc(comment || '—')}</td></tr>
      </table>
      <p style="font-size:12px;color:#64748b;margin-top:14px">
        <a href="https://www.agilegroup-digital.co.in/guards?portal=management">Open Feedback Analysis in Management Portal</a>
      </p>
    </div>
  </div>`
  const r = await sendSuiteEmail(resend, {
    from,
    to: toList,
    subject: `Guard Feedback — ${c.code} — ${rating}/5 stars — ${c.guardName}`,
    html,
  })
  return { ok: !r.error, to: toList, error: r.error?.message }
}

export type GuardsDashboardShareSummary = Pick<
  GuardsDashboard,
  | 'total'
  | 'received'
  | 'delayed'
  | 'solved'
  | 'avgResponseHours'
  | 'slaCompliancePct'
  | 'topCategories'
  | 'byDepartment'
  | 'byBranch'
  | 'hurdles'
  | 'suggestions'
> & {
  /** Alias used by older callers — same as received (open cases). */
  open?: number
}

/** Colourful shareable dashboard HTML — regular Agile header + footer. */
export function buildGuardsDashboardShareHtml(
  branchName: string,
  summary: GuardsDashboardShareSummary,
  opts?: { portal?: 'staff' | 'management' },
): string {
  const open = summary.open ?? summary.received ?? 0
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
  const portal = opts?.portal === 'management' ? 'management' : 'staff'
  const portalUrl =
    portal === 'management'
      ? 'https://www.agilegroup-digital.co.in/guards?portal=management'
      : 'https://www.agilegroup-digital.co.in/guards'

  const kpis = suiteStatRow([
    { label: 'Total', value: summary.total || 0, color: '#14224f', bg: 'linear-gradient(145deg,#eff6ff,#dbeafe)' },
    { label: 'Open', value: open, color: '#1d4ed8', bg: 'linear-gradient(145deg,#eff6ff,#bfdbfe)' },
    {
      label: 'Delayed >24h',
      value: summary.delayed || 0,
      color: '#b91c1c',
      bg: 'linear-gradient(145deg,#fef2f2,#fecaca)',
    },
    {
      label: 'Solved',
      value: summary.solved || 0,
      color: '#047857',
      bg: 'linear-gradient(145deg,#ecfdf5,#bbf7d0)',
    },
    {
      label: 'Avg hours',
      value: `${summary.avgResponseHours || 0}h`,
      color: '#a16207',
      bg: 'linear-gradient(145deg,#fffbeb,#fde68a)',
    },
    {
      label: 'Within 24h',
      value: `${summary.slaCompliancePct || 0}%`,
      color: '#0f766e',
      bg: 'linear-gradient(145deg,#f0fdfa,#99f6e4)',
    },
  ])

  const catRows = (summary.topCategories || [])
    .slice(0, 8)
    .map(
      (c, i) =>
        `<tr style="background:${i % 2 ? '#f8fafc' : '#fff'}">
          <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a">${escHtml(c.category)}</td>
          <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;color:#1d4ed8;font-weight:800">${c.count}</td>
          <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;color:#64748b">${c.avgHours}h avg</td>
        </tr>`,
    )
    .join('')

  const deptRows = (summary.byDepartment || [])
    .slice(0, 10)
    .map(
      (d, i) =>
        `<tr style="background:${i % 2 ? '#f8fafc' : '#fff'}">
          <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;font-weight:700">${escHtml(d.department)}</td>
          <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0">${d.count}</td>
          <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0">${d.avgHours}h</td>
          <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;color:${d.delayed ? '#b91c1c' : '#047857'};font-weight:800">${d.delayed}</td>
        </tr>`,
    )
    .join('')

  const branchRows = (summary.byBranch || [])
    .slice(0, 20)
    .map(
      (b, i) =>
        `<tr style="background:${i % 2 ? '#f8fafc' : '#fff'}">
          <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;font-weight:800;color:#14224f">${escHtml(b.branchName)}</td>
          <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0">${b.total}</td>
          <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0">${b.received}</td>
          <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;color:${b.delayed ? '#b91c1c' : '#334155'};font-weight:700">${b.delayed}</td>
          <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;color:#047857;font-weight:700">${b.solved}</td>
          <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0">${b.avgHours}h</td>
          <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;font-weight:800">${b.slaPct}%</td>
        </tr>`,
    )
    .join('')

  const hurdles = (summary.hurdles || [])
    .slice(0, 6)
    .map(
      (x) =>
        `<div style="margin:8px 0;padding:12px 14px;border-radius:12px;background:${x.count > 2 ? 'linear-gradient(135deg,#fef2f2,#fee2e2)' : 'linear-gradient(135deg,#fffbeb,#fef3c7)'};border:1px solid ${x.count > 2 ? '#fecaca' : '#fde68a'}">
          <div style="font-weight:800;color:${x.count > 2 ? '#991b1b' : '#92400e'}">${escHtml(x.label)} (${x.count})</div>
          <div style="font-size:13px;color:#475569;margin-top:4px">${escHtml(x.hint)}</div>
        </div>`,
    )
    .join('')

  const suggestions = (summary.suggestions || [])
    .slice(0, 8)
    .map(
      (s) =>
        `<li style="margin:6px 0;padding:8px 10px;background:linear-gradient(90deg,#f0f9ff,#eff6ff);border-radius:8px;border-left:4px solid #3b82f6;color:#0f172a">${escHtml(s)}</li>`,
    )
    .join('')

  const bodyHtml = `
    <p style="margin:0 0 6px;font-size:13px;color:#64748b">Scope: <b style="color:#14224f">${escHtml(branchName)}</b> · ${escHtml(today)}</p>
    <p style="margin:0 0 12px;font-size:13px;color:#475569">Internal Customer Care · Response standard: <b>${escHtml(SLA_LABEL)}</b></p>
    ${kpis}
    ${
      branchRows
        ? `<h3 style="margin:18px 0 8px;color:#14224f;font-size:16px">Branch-wise breakdown</h3>${suiteTable(['Branch', 'Total', 'Open', 'Delayed', 'Solved', 'Avg h', 'Within 24h'], branchRows, 7)}`
        : ''
    }
    ${
      deptRows
        ? `<h3 style="margin:18px 0 8px;color:#14224f;font-size:16px">Time per department</h3>${suiteTable(['Department', 'Cases', 'Avg hours', 'Delayed'], deptRows, 4)}`
        : ''
    }
    ${
      catRows
        ? `<h3 style="margin:18px 0 8px;color:#14224f;font-size:16px">Complaint categories</h3>${suiteTable(['Category', 'Cases', 'Avg hours'], catRows, 3)}`
        : ''
    }
    ${hurdles ? `<h3 style="margin:18px 0 8px;color:#991b1b;font-size:16px">Where it is delayed</h3>${hurdles}` : ''}
    ${
      suggestions
        ? `<h3 style="margin:18px 0 8px;color:#1d4ed8;font-size:16px">Suggestions to reduce response time (${escHtml(SLA_LABEL)})</h3><ul style="margin:0;padding:0;list-style:none">${suggestions}</ul>`
        : ''
    }
    <p style="margin:18px 0 0;font-size:13px">
      <a href="${portalUrl}" style="display:inline-block;padding:10px 16px;background:linear-gradient(135deg,#14224f,#1e3a8a);color:#fff;text-decoration:none;border-radius:10px;font-weight:800">Open Agile Guards portal</a>
    </p>
  `

  return suiteColourEmailShell({
    appName: 'Agile Guards · Internal Customer Care',
    title: 'Branch Dashboard',
    subtitle: `${escHtml(branchName)} · Colourful complaint status report`,
    accentFrom: '#7f1d1d',
    accentTo: '#1e3a8a',
    bodyHtml,
  })
}

export async function sendDashboardShareMail(
  branchName: string,
  summary: GuardsDashboardShareSummary,
  toEmail: string,
  opts?: { portal?: 'staff' | 'management' },
) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey || !toEmail.includes('@')) return { ok: false, skipped: true }
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Guards <noreply@agilegroup.co.in>'
  const html = buildGuardsDashboardShareHtml(branchName, summary, opts)
  const r = await sendSuiteEmail(resend, {
    from,
    to: [toEmail],
    subject: `Agile Guards Dashboard — ${branchName}`,
    html,
  })
  return { ok: !r.error, error: r.error?.message }
}

/** Director sends complaint status to a client or department contact. */
export async function sendComplaintStatusMail(
  c: GuardComplaint,
  branchName: string,
  toEmail: string,
  actor: string,
  target: 'client' | 'department',
) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey || !toEmail.includes('@')) return { ok: false, skipped: true, error: 'Valid email required' }
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Guards <noreply@agilegroup.co.in>'
  const status = displayStatus(c)
  const clk = stageClocksForMail(c)
  const progress =
    c.status === 'solved'
      ? 'This complaint has been <b>resolved</b> and closed.'
      : c.isDelayed
        ? `This complaint is <b>delayed</b> (past our ${SLA_LABEL} standard). We are working to close it urgently.`
        : `This complaint is <b>under process</b> within our ${SLA_LABEL} response standard.`
  const subject =
    target === 'client'
      ? `Agile Guards — Complaint status ${c.code} — ${c.guardName}`
      : `Agile Guards — Status update ${c.code} — ${branchName}`
  const intro =
    target === 'client'
      ? `<p>Dear Client,</p><p>As requested, here is the current status of guard complaint <b>${esc(c.code)}</b>${c.clientName ? ` at <b>${esc(c.clientName)}</b>` : ''}.</p>`
      : `<p>Dear Team,</p><p>Director status update for complaint <b>${esc(c.code)}</b> (${esc(branchName)}).</p>`
  const html = `<div style="font-family:Arial,sans-serif;max-width:680px">
    ${intro}
    <p><b>Status:</b> ${esc(status)}</p>
    <p>${progress}</p>
    ${complaintDetailHtml(c, branchName)}
    <p><b>Time summary:</b> HOD ${clk.hodWaitHrs}h · Ops ${clk.opsHrs}h · Dept ${clk.deptHrs}h · Total ${clk.totalHrs}h</p>
    ${c.opsResolution ? `<p><b>Operations action:</b> ${esc(c.opsResolution)}</p>` : ''}
    ${c.deptResolution ? `<p><b>Department action:</b> ${esc(c.deptResolution)}</p>` : ''}
    <p style="font-size:12px;color:#64748b;margin-top:14px">Sent by ${esc(actor)} · Agile Security Force</p>
  </div>`
  const r = await sendSuiteEmail(resend, {
    from,
    to: [toEmail],
    cc: [directorEmail()],
    subject,
    html,
  })
  return { ok: !r.error, to: [toEmail], subject, error: r.error?.message }
}

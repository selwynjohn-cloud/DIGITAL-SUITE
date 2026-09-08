/**
 * Agile CRM — Director mail on lead/quote booking, plus Saturday sales-lead status.
 */

import { Resend } from 'resend'
import { sendSuiteEmail, suiteDirectorEmail } from '../suite-mail.js'
import {
  getActivities,
  getLeadsNormalized,
  getTendersNormalized,
  isClosedLostStatus,
  isClosedWonStatus,
  mapLeadStage,
  type CrmActivity,
  type CrmLead,
  type CrmTender,
} from './store.js'

function esc(s: unknown) {
  return String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function money(v: number) {
  return '₹' + (Number(v) || 0).toLocaleString('en-IN')
}

function namedLead(l: CrmLead) {
  return String(l.company || '').trim().length >= 2
}

function namedTender(t: CrmTender) {
  return String(t.tenderName || t.clientDept || '').trim().length >= 2
}

function staffName(l: CrmLead) {
  return (l.assignedTo || l.recordedBy || '—').trim() || '—'
}

function isQuoteStage(stage: string) {
  const s = mapLeadStage(stage)
  return s === 'Quote Submitted' || s === 'Quotation Sent'
}

function istYmd(d = new Date()) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function fmtDmy(ymd: string) {
  const [y, m, d] = String(ymd || '').split('-')
  if (!d) return ymd || '—'
  return `${d}-${m}-${y}`
}

function fmtTime(t: string) {
  const m = String(t || '').trim().match(/^(\d{1,2}):(\d{2})/)
  if (!m) return String(t || '').trim()
  let h = Number(m[1])
  const min = m[2]
  const ap = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${min} ${ap}`
}

function addDaysYmd(ymd: string, n: number) {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0, 10)
}

/** ISO week (Mon–Sun) for an IST calendar date YYYY-MM-DD. */
export function crmIsoWeek(ymd = istYmd()) {
  const [y, mo, d] = ymd.split('-').map(Number)
  const date = new Date(Date.UTC(y, (mo || 1) - 1, d || 1))
  const dow = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dow)
  const weekYear = date.getUTCFullYear()
  const yearStart = new Date(Date.UTC(weekYear, 0, 1))
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  const monday = new Date(Date.UTC(y, (mo || 1) - 1, d || 1))
  const monDow = monday.getUTCDay() || 7
  monday.setUTCDate(monday.getUTCDate() - monDow + 1)
  const from = monday.toISOString().slice(0, 10)
  const to = addDaysYmd(from, 6)
  return { weekNo, weekYear, from, to, label: `Week ${weekNo} (${fmtDmy(from)} to ${fmtDmy(to)})` }
}

export function crmWeeklyStatusSubject(ymd = istYmd()) {
  return `AGILE DIGITAL COMMAND CENTER , AGILE CRM- SALES LEAD STATUS ${crmIsoWeek(ymd).label}-REG`
}

function shell(title: string, sub: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:860px;color:#0f172a">
    <div style="background:linear-gradient(135deg,#14224f,#1e3a8a);color:#fff;padding:18px 20px;border-radius:10px 10px 0 0">
      <div style="font-size:13px;opacity:.9">Agile Digital Command Center · Agile CRM</div>
      <h1 style="margin:6px 0 0;font-size:20px">${esc(title)}</h1>
      <p style="margin:8px 0 0;font-size:13px;color:#fde68a">${esc(sub)}</p>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;padding:18px 20px;border-radius:0 0 10px 10px">
      ${body}
      <p style="font-size:12px;color:#64748b;margin-top:16px">Open CRM: <a href="https://www.agilegroup-digital.co.in/crm">www.agilegroup-digital.co.in/crm</a></p>
    </div>
  </div>`
}

function kv(rows: [string, string][]) {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 8px;font-weight:700;width:38%;border-bottom:1px solid #eee;vertical-align:top">${esc(k)}</td><td style="padding:7px 8px;border-bottom:1px solid #eee">${esc(v)}</td></tr>`,
    )
    .join('')}</table>`
}

async function sendDirector(subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, skipped: true, reason: 'Email not configured' }
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile CRM <noreply@agilegroup.co.in>'
  const to = suiteDirectorEmail()
  const r = await sendSuiteEmail(resend, { from, to: [to], subject, html })
  return { ok: !r.error, to, error: r.error?.message }
}

function leadDetailRows(l: CrmLead): [string, string][] {
  const when = [l.nextFollowUp ? fmtDmy(l.nextFollowUp) : '', fmtTime(l.nextFollowUpTime || '')]
    .filter(Boolean)
    .join(' ')
  return [
    ['Lead type', l.leadKind === 'Tender' ? 'Tender lead' : 'Sales lead'],
    ['Branch', l.branch || '—'],
    ['Staff name', staffName(l)],
    ['Client name', l.company || '—'],
    ['Location', [l.location, l.city, l.state].filter(Boolean).join(', ') || '—'],
    ['Guards strength', l.manpower || '—'],
    ['Status (sales process)', mapLeadStage(l.stage)],
    ['Next meeting / follow-up', when || '—'],
    ['Contact', [l.contactName, l.phone, l.email].filter(Boolean).join(' · ') || '—'],
    ['Source', l.source || '—'],
    ['Est. value / month', money(l.estValue)],
    ['Requirement', l.requirement || '—'],
    ['Recorded by', l.recordedBy || '—'],
  ]
}

function tenderDetailRows(t: CrmTender): [string, string][] {
  return [
    ['Lead type', 'Tender lead'],
    ['Branch', t.branch || '—'],
    ['Client / department', t.clientDept || t.tenderName || '—'],
    ['Tender name / no.', [t.tenderName, t.tenderNo].filter(Boolean).join(' · ') || '—'],
    ['Location', [t.location, t.state].filter(Boolean).join(', ') || '—'],
    ['Guards strength', t.requiredManpower || '—'],
    ['Status (sales process)', t.status || '—'],
    ['Our quote', t.ourQuote || '—'],
    ['Bid deadline', t.bidEndDateTime || t.submissionDate || '—'],
    ['Pre-bid meeting', [t.prebidMeetingDate, t.prebidMeetingVenue].filter(Boolean).join(' · ') || '—'],
    ['Portal', t.portal || '—'],
  ]
}

export function detectLeadAlerts(prev: CrmLead[], next: CrmLead[]) {
  const old = new Map(prev.map((l) => [l.id, l]))
  const booked: CrmLead[] = []
  const quotes: CrmLead[] = []
  for (const l of next) {
    if (!namedLead(l) || l.active === false) continue
    const p = old.get(l.id)
    const isNewBook = !p || !namedLead(p)
    const quoteNow = isQuoteStage(l.stage)
    const quoteWas = p ? isQuoteStage(p.stage) : false
    if (isNewBook) booked.push(l)
    else if (quoteNow && !quoteWas) quotes.push(l)
  }
  return { booked, quotes }
}

export function detectTenderAlerts(prev: CrmTender[], next: CrmTender[]) {
  const old = new Map(prev.map((t) => [t.id, t]))
  const booked: CrmTender[] = []
  const quotes: CrmTender[] = []
  for (const t of next) {
    if (!namedTender(t) || t.active === false) continue
    const p = old.get(t.id)
    const isNewBook = !p || !namedTender(p)
    const quoteNow = String(t.ourQuote || '').trim().length > 0
    const quoteWas = p ? String(p.ourQuote || '').trim().length > 0 : false
    if (isNewBook) booked.push(t)
    else if (quoteNow && !quoteWas) quotes.push(t)
  }
  return { booked, quotes }
}

export async function notifyCrmDirectorAlerts(opts: {
  leadsPrev?: CrmLead[]
  leadsNext?: CrmLead[]
  tendersPrev?: CrmTender[]
  tendersNext?: CrmTender[]
}) {
  const sent: string[] = []
  if (opts.leadsPrev && opts.leadsNext) {
    const { booked, quotes } = detectLeadAlerts(opts.leadsPrev, opts.leadsNext)
    for (const l of booked) {
      const quoteToo = isQuoteStage(l.stage)
      const title = quoteToo ? 'New sales lead booked — quote submitted' : 'New sales lead booked'
      const r = await sendDirector(
        `AGILE DIGITAL COMMAND CENTER , AGILE CRM- NEW SALES LEAD ${l.company}-REG`,
        shell(title, l.company, kv(leadDetailRows(l))),
      )
      if (r.ok) sent.push(`lead:${l.id}`)
    }
    for (const l of quotes) {
      const r = await sendDirector(
        `AGILE DIGITAL COMMAND CENTER , AGILE CRM- QUOTE SUBMITTED ${l.company}-REG`,
        shell('Quote submitted', l.company, kv(leadDetailRows(l))),
      )
      if (r.ok) sent.push(`quote:${l.id}`)
    }
  }
  if (opts.tendersPrev && opts.tendersNext) {
    const { booked, quotes } = detectTenderAlerts(opts.tendersPrev, opts.tendersNext)
    for (const t of booked) {
      const name = t.tenderName || t.clientDept
      const quoteToo = String(t.ourQuote || '').trim().length > 0
      const title = quoteToo ? 'New tender lead booked — quote entered' : 'New tender lead booked'
      const r = await sendDirector(
        `AGILE DIGITAL COMMAND CENTER , AGILE CRM- NEW TENDER LEAD ${name}-REG`,
        shell(title, name, kv(tenderDetailRows(t))),
      )
      if (r.ok) sent.push(`tender:${t.id}`)
    }
    for (const t of quotes) {
      const name = t.tenderName || t.clientDept
      const r = await sendDirector(
        `AGILE DIGITAL COMMAND CENTER , AGILE CRM- QUOTE SUBMITTED ${name}-REG`,
        shell('Tender quote submitted', name, kv(tenderDetailRows(t))),
      )
      if (r.ok) sent.push(`tender-quote:${t.id}`)
    }
  }
  return { ok: true, sent }
}

function meetingWhen(date: string, time?: string, extra?: string) {
  const parts = [date ? fmtDmy(date) : '', fmtTime(time || ''), extra || ''].filter(Boolean)
  return parts.join(' ') || '—'
}

export async function sendWeeklyCrmSalesLeadStatus(opts?: { preview?: boolean }) {
  const [leads, tenders, activities] = await Promise.all([
    getLeadsNormalized(),
    getTendersNormalized(),
    getActivities(),
  ])
  const today = istYmd()
  const week = crmIsoWeek(today)
  const nextFrom = addDaysYmd(week.to, 1)
  const nextTo = addDaysYmd(nextFrom, 6)
  const inNextWeek = (ymd: string) => ymd >= nextFrom && ymd <= nextTo

  const openSales = leads.filter(
    (l) =>
      namedLead(l) &&
      l.active !== false &&
      l.leadKind !== 'Tender' &&
      !isClosedLostStatus(l.stage),
  )
  const openTenders = tenders.filter((t) => namedTender(t) && t.active !== false && t.recordKind !== 'Historical')

  const leadRows = openSales
    .slice()
    .sort((a, b) => String(a.branch).localeCompare(String(b.branch)) || String(a.company).localeCompare(String(b.company)))
    .map((l) => {
      const meet = inNextWeek(l.nextFollowUp)
        ? meetingWhen(l.nextFollowUp, l.nextFollowUpTime)
        : '—'
      return `<tr>
        <td style="padding:8px">${esc(l.branch || '—')}</td>
        <td style="padding:8px">${esc(staffName(l))}</td>
        <td style="padding:8px">${esc(l.company)}</td>
        <td style="padding:8px">${esc([l.location, l.city].filter(Boolean).join(', ') || '—')}</td>
        <td style="padding:8px">${esc(l.manpower || '—')}</td>
        <td style="padding:8px">${esc(mapLeadStage(l.stage))}</td>
        <td style="padding:8px">${esc(meet)}</td>
      </tr>`
    })
    .join('')

  const meetings: {
    date: string
    time: string
    type: string
    client: string
    branch: string
    staff: string
    location: string
  }[] = []

  for (const l of openSales) {
    if (l.nextFollowUp && inNextWeek(l.nextFollowUp)) {
      meetings.push({
        date: l.nextFollowUp,
        time: l.nextFollowUpTime || '',
        type: 'Follow-up / meeting',
        client: l.company,
        branch: l.branch,
        staff: staffName(l),
        location: l.location || l.city,
      })
    }
  }
  for (const a of activities as (CrmActivity & { time?: string })[]) {
    if (a.active === false || a.done || !a.date || !inNextWeek(a.date)) continue
    const lead = leads.find((l) => l.id === a.leadId)
    meetings.push({
      date: a.date,
      time: a.time || '',
      type: a.type || 'Meeting',
      client: a.company || lead?.company || '—',
      branch: lead?.branch || '—',
      staff: lead ? staffName(lead) : '—',
      location: a.location || lead?.location || '',
    })
  }
  for (const t of openTenders) {
    const pre = String(t.prebidMeetingDate || '').slice(0, 10)
    if (pre && inNextWeek(pre)) {
      meetings.push({
        date: pre,
        time: String(t.prebidMeetingDate || '').slice(11, 16),
        type: 'Pre-bid meeting',
        client: t.clientDept || t.tenderName,
        branch: t.branch,
        staff: 'Tender Cell',
        location: t.prebidMeetingVenue || t.location,
      })
    }
  }
  meetings.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))

  const meetRows = meetings
    .map(
      (m) => `<tr>
        <td style="padding:8px">${esc(meetingWhen(m.date, m.time))}</td>
        <td style="padding:8px">${esc(m.type)}</td>
        <td style="padding:8px">${esc(m.client)}</td>
        <td style="padding:8px">${esc(m.branch || '—')}</td>
        <td style="padding:8px">${esc(m.staff)}</td>
        <td style="padding:8px">${esc(m.location || '—')}</td>
      </tr>`,
    )
    .join('')

  const tenderRows = openTenders
    .map(
      (t) => `<tr>
        <td style="padding:8px">${esc(t.branch || '—')}</td>
        <td style="padding:8px">Tender Cell</td>
        <td style="padding:8px">${esc(t.clientDept || t.tenderName)}</td>
        <td style="padding:8px">${esc(t.location || '—')}</td>
        <td style="padding:8px">${esc(t.requiredManpower || '—')}</td>
        <td style="padding:8px">${esc(t.status || '—')}</td>
        <td style="padding:8px">${esc(t.prebidMeetingDate || t.submissionDate || '—')}</td>
      </tr>`,
    )
    .join('')

  const th = `<tr style="background:#14224f;color:#fff;text-align:left">
    <th style="padding:8px">Branch</th><th style="padding:8px">Staff name</th><th style="padding:8px">Client name</th>
    <th style="padding:8px">Location</th><th style="padding:8px">Guards strength</th>
    <th style="padding:8px">Status</th><th style="padding:8px">Next week meeting</th></tr>`

  const html = shell(
    'Sales lead status',
    week.label,
    `<p style="font-size:14px">Open sales leads: <b>${openSales.length}</b> · Active tenders: <b>${openTenders.length}</b> · Next-week meetings: <b>${meetings.length}</b></p>
     <p style="font-size:13px;color:#475569">Next week: ${fmtDmy(nextFrom)} to ${fmtDmy(nextTo)}</p>
     <h3 style="color:#14224f;margin:18px 0 8px">1. Sales leads</h3>
     <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e2e8f0">${th}${
       leadRows || '<tr><td colspan="7" style="padding:8px;color:#64748b">No open sales leads.</td></tr>'
     }</table>
     <h3 style="color:#14224f;margin:18px 0 8px">2. Tender leads</h3>
     <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e2e8f0">${th}${
       tenderRows || '<tr><td colspan="7" style="padding:8px;color:#64748b">No active tenders.</td></tr>'
     }</table>
     <h3 style="color:#14224f;margin:18px 0 8px">3. Next week meeting schedule (date &amp; time)</h3>
     <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e2e8f0">
       <tr style="background:#14224f;color:#fff;text-align:left">
         <th style="padding:8px">Date &amp; time</th><th style="padding:8px">Type</th><th style="padding:8px">Client</th>
         <th style="padding:8px">Branch</th><th style="padding:8px">Staff</th><th style="padding:8px">Location</th>
       </tr>
       ${meetRows || '<tr><td colspan="6" style="padding:8px;color:#64748b">No meetings scheduled for next week.</td></tr>'}
     </table>`,
  )

  const subject = crmWeeklyStatusSubject(today)
  if (opts?.preview) {
    return {
      ok: true,
      preview: true,
      subject,
      week: week.label,
      sales: openSales.length,
      tenders: openTenders.length,
      meetings: meetings.length,
      html,
    }
  }
  const mail = await sendDirector(subject, html)
  return { ...mail, subject, week: week.label, sales: openSales.length, tenders: openTenders.length, meetings: meetings.length }
}

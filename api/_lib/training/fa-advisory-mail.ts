/**
 * HDFC Admin / RSO — branch-wise quiz + acknowledgement list (client letter).
 */

import { Resend } from 'resend'
import { getHodEmailsForBranch } from '../mis/digest.js'
import { SRIDHAR_M_CC_EMAIL } from '../mis/branch-mail-cc.js'
import { getBranches, getUsers } from '../mis/store.js'
import { pinMailFrom, sendSuiteEmail, suiteDirectorEmail } from '../suite-mail.js'
import { EN_ADV, FA_ADVISORY_URL, faAdvIssueStamp } from './fa-advisory-i18n.js'
import { trainingBrandSignOffHtml, trainingTrack1EmailShell } from './training-brand.js'

export type FaClientListRow = {
  submittedAt?: string
  ymd?: string
  code?: string
  name: string
  employeeId: string
  branchName: string
  hdfcSite: string
  mobile: string
  langName?: string
  answers?: Array<'yes' | 'no' | string>
  score?: string
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function uniqueEmails(list: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of list) {
    const e = String(raw || '')
      .trim()
      .toLowerCase()
    if (!e.includes('@') || seen.has(e)) continue
    seen.add(e)
    out.push(e)
  }
  return out
}

export function parseClientEmails(raw: unknown): string[] {
  const text = Array.isArray(raw) ? raw.join(',') : String(raw || '')
  return uniqueEmails(text.split(/[,;\n]+/)).slice(0, 5)
}

function yn(v: unknown): string {
  const s = String(v || '').toLowerCase()
  if (s === 'yes') return 'YES'
  if (s === 'no') return 'NO'
  return '—'
}

export function sampleQuizHtml(): string {
  const qs = EN_ADV.questions
    .map(
      (q, i) =>
        `<tr>
          <td style="padding:7px 8px;border:1px solid #d8e0ea;text-align:center">${i + 1}</td>
          <td style="padding:7px 8px;border:1px solid #d8e0ea">${esc(q.title)}</td>
          <td style="padding:7px 8px;border:1px solid #d8e0ea;font-weight:800">${q.correct === 'yes' ? 'YES' : 'NO'}</td>
        </tr>`,
    )
    .join('')
  return `<div style="margin:0 0 16px;padding:14px;border:1px solid #c9a84c;border-radius:10px;background:#fffbeb">
    <div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#c8102e;text-transform:uppercase;margin-bottom:6px">HDFC Bank — Strategic Client</div>
    <div style="font-size:13px;color:#14224f;font-weight:800;margin-bottom:10px">Compliance Advisory Series · ${esc(faAdvIssueStamp())}</div>
    <b style="color:#14224f">Sample quiz (correct answers)</b>
    <p style="margin:6px 0 10px;color:#334155;font-size:13px">Each Facility Attendant must answer these 3 questions on the three points, then give the undertaking.</p>
    <table style="border-collapse:collapse;width:100%;font-size:13px;background:#fff">
      <thead><tr style="background:#14224f;color:#fff">
        <th style="padding:8px;border:1px solid #14224f">Q</th>
        <th style="padding:8px;border:1px solid #14224f">Question</th>
        <th style="padding:8px;border:1px solid #14224f">Correct</th>
      </tr></thead>
      <tbody>${qs}</tbody>
    </table>
    <p style="margin:12px 0 0;font-size:13px">Poster + quiz + acknowledgement link:<br>
      <a href="${FA_ADVISORY_URL}">${FA_ADVISORY_URL}</a>
    </p>
  </div>`
}

export function branchTables(rows: FaClientListRow[]): string {
  const groups = new Map<string, FaClientListRow[]>()
  for (const r of rows) {
    const key = String(r.branchName || 'Branch').trim() || 'Branch'
    const list = groups.get(key) || []
    list.push(r)
    groups.set(key, list)
  }
  const names = [...groups.keys()].sort((a, b) => a.localeCompare(b))
  return names
    .map((branch) => {
      const list = groups.get(branch) || []
      const body = list
        .map(
          (r, i) => `<tr>
          <td style="padding:6px 7px;border:1px solid #d8e0ea;text-align:center">${i + 1}</td>
          <td style="padding:6px 7px;border:1px solid #d8e0ea">${esc(r.submittedAt || r.ymd || '')}</td>
          <td style="padding:6px 7px;border:1px solid #d8e0ea">${esc(r.name)}</td>
          <td style="padding:6px 7px;border:1px solid #d8e0ea">${esc(r.employeeId)}</td>
          <td style="padding:6px 7px;border:1px solid #d8e0ea">${esc(r.hdfcSite)}</td>
          <td style="padding:6px 7px;border:1px solid #d8e0ea">${esc(r.mobile)}</td>
          <td style="padding:6px 7px;border:1px solid #d8e0ea;text-align:center">${yn(r.answers?.[0])}</td>
          <td style="padding:6px 7px;border:1px solid #d8e0ea;text-align:center">${yn(r.answers?.[1])}</td>
          <td style="padding:6px 7px;border:1px solid #d8e0ea;text-align:center">${yn(r.answers?.[2])}</td>
          <td style="padding:6px 7px;border:1px solid #d8e0ea;text-align:center">${esc(r.score || '')}</td>
          <td style="padding:6px 7px;border:1px solid #d8e0ea">Acknowledged</td>
        </tr>`,
        )
        .join('')
      return `<h3 style="margin:18px 0 8px;color:#14224f;font-size:16px">${esc(branch)} · ${list.length}</h3>
      <table style="border-collapse:collapse;width:100%;font-size:12px;background:#fff">
        <thead><tr style="background:#14224f;color:#fff">
          <th style="padding:7px;border:1px solid #14224f">Sl.</th>
          <th style="padding:7px;border:1px solid #14224f">Date</th>
          <th style="padding:7px;border:1px solid #14224f">Name</th>
          <th style="padding:7px;border:1px solid #14224f">ID</th>
          <th style="padding:7px;border:1px solid #14224f">HDFC / SOL</th>
          <th style="padding:7px;border:1px solid #14224f">Mobile</th>
          <th style="padding:7px;border:1px solid #14224f">Q1</th>
          <th style="padding:7px;border:1px solid #14224f">Q2</th>
          <th style="padding:7px;border:1px solid #14224f">Q3</th>
          <th style="padding:7px;border:1px solid #14224f">Score</th>
          <th style="padding:7px;border:1px solid #14224f">Ack.</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>`
    })
    .join('')
}

export function trainingTables(rows: FaClientListRow[]): string {
  const groups = new Map<string, FaClientListRow[]>()
  for (const r of rows) {
    const key = String(r.branchName || 'Branch').trim() || 'Branch'
    const list = groups.get(key) || []
    list.push(r)
    groups.set(key, list)
  }
  const names = [...groups.keys()].sort((a, b) => a.localeCompare(b))
  return names
    .map((branch) => {
      const list = groups.get(branch) || []
      const body = list
        .map(
          (r, i) => `<tr>
          <td style="padding:6px 7px;border:1px solid #d8e0ea;text-align:center">${i + 1}</td>
          <td style="padding:6px 7px;border:1px solid #d8e0ea">${esc(r.submittedAt || r.ymd || '')}</td>
          <td style="padding:6px 7px;border:1px solid #d8e0ea">${esc(r.code || '')}</td>
          <td style="padding:6px 7px;border:1px solid #d8e0ea">${esc(r.name)}</td>
          <td style="padding:6px 7px;border:1px solid #d8e0ea">${esc(r.employeeId)}</td>
          <td style="padding:6px 7px;border:1px solid #d8e0ea">${esc(r.hdfcSite)}</td>
          <td style="padding:6px 7px;border:1px solid #d8e0ea">${esc(r.mobile)}</td>
          <td style="padding:6px 7px;border:1px solid #d8e0ea">Acknowledged</td>
        </tr>`,
        )
        .join('')
      return `<h3 style="margin:18px 0 8px;color:#14224f;font-size:16px">${esc(branch)} · ${list.length}</h3>
      <table style="border-collapse:collapse;width:100%;font-size:12px;background:#fff">
        <thead><tr style="background:#14224f;color:#fff">
          <th style="padding:7px;border:1px solid #14224f">Sl.</th>
          <th style="padding:7px;border:1px solid #14224f">Date</th>
          <th style="padding:7px;border:1px solid #14224f">Ack. no.</th>
          <th style="padding:7px;border:1px solid #14224f">Name</th>
          <th style="padding:7px;border:1px solid #14224f">ID</th>
          <th style="padding:7px;border:1px solid #14224f">HDFC / SOL</th>
          <th style="padding:7px;border:1px solid #14224f">Mobile</th>
          <th style="padding:7px;border:1px solid #14224f">Ack.</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>`
    })
    .join('')
}

export function faClientAckListHtml(opts: {
  title: string
  subtitle: string
  rows: FaClientListRow[]
  period?: string
  branchLabel?: string
  mode?: 'advisory' | 'training'
  showSampleQuiz?: boolean
}): string {
  const rows = opts.rows || []
  const isAdv = opts.mode !== 'training'
  const table = rows.length
    ? isAdv
      ? branchTables(rows)
      : trainingTables(rows)
    : '<p style="color:#0f172a">No acknowledgements in this period.</p>'
  const showQuiz = opts.showSampleQuiz ?? isAdv
  const intro = isAdv
    ? 'Standing <b>HDFC Bank — Strategic Client</b> advisory for Admin / RSO. Same series each time HDFC shares this. Each Facility Attendant read the three points, answered 3 quiz questions, and gave the undertaking.'
    : 'Branch-wise list of Facility Attendants who completed Learn &amp; Confirm training and submitted acknowledgement.'
  const body = `
    <p style="margin:0 0 10px;color:#0f172a;font-size:15px;line-height:1.5">
      ${intro}
    </p>
    <p style="margin:0 0 14px;color:#334155;font-size:13px">
      ${opts.branchLabel ? `Branch: <b>${esc(opts.branchLabel)}</b> · ` : ''}
      ${opts.period ? `Period: <b>${esc(opts.period)}</b> · ` : ''}
      Total acknowledged: <b>${rows.length}</b>
    </p>
    ${showQuiz ? sampleQuizHtml() : ''}
    ${table}
    ${trainingBrandSignOffHtml()}
  `
  return trainingTrack1EmailShell({
    title: opts.title,
    subtitle: opts.subtitle,
    bodyHtml: body,
    includeImportantNumbers: false,
  })
}

export async function sendFaClientAckListMail(opts: {
  to: string[]
  html: string
  subject: string
  branchIds: string[]
}): Promise<{ ok: boolean; error?: string; to: string[]; cc: string[] }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email is not configured.', to: [], cc: [] }
  const to = uniqueEmails(opts.to).slice(0, 5)
  if (!to.length) return { ok: false, error: 'Enter HDFC Admin / RSO email IDs.', to: [], cc: [] }
  const [users, branches] = await Promise.all([getUsers(), getBranches()])
  const hods: string[] = []
  for (const bid of opts.branchIds) {
    hods.push(...(await getHodEmailsForBranch(bid, users, branches)))
  }
  const cc = uniqueEmails([
    SRIDHAR_M_CC_EMAIL,
    suiteDirectorEmail(),
    'director@agilegroup.co.in',
    ...hods,
  ]).filter((e) => !to.includes(e))
  const resend = new Resend(apiKey)
  const sent = await sendSuiteEmail(resend, {
    from: pinMailFrom(),
    to,
    cc,
    subject: opts.subject,
    html: opts.html,
  })
  if (sent.error) return { ok: false, error: String(sent.error.message || 'Mail failed'), to, cc }
  return { ok: true, to, cc }
}

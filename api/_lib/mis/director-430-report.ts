/**
 * 4:30 PM pack every calendar day:
 * 1. Consolidated MIS report
 * 2. Branch-wise Registered Guards Complaints
 * To all HODs · CC Director (director@ + Selwyn Gmail). Not it@ / app@.
 */

import { Resend } from 'resend'
import { withoutNoMailRecipients } from '../auth.js'
import { sendSuiteEmail } from '../suite-mail.js'
import { withDailyPackDelivery } from '../suite-daily-delivery.js'
import { displayStatus } from '../guards/completion.js'
import { realComplaintsOnly } from '../guards/practice.js'
import {
  applySla,
  branchDisplayName,
  getComplaints,
  type GuardComplaint,
} from '../guards/store.js'
import { MIS_DIRECTOR_CC_EMAIL, misSelwynGmailCopy } from './branch-mail-cc.js'
import { MIS_BRAND, misAckDateDisplay, misAckFooterHtml } from './brand.js'
import { buildConsolidatedMisAckPayload, consolidatedBranchTableHtml, getAllHodEmails } from './digest.js'
import { getBranches } from './store.js'

function esc(s: unknown) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

async function hodToDirectorCc() {
  const director = (
    process.env.MIS_DIRECTOR_EMAIL?.trim() ||
    MIS_DIRECTOR_CC_EMAIL
  )
    .trim()
    .toLowerCase()
  const gmail = misSelwynGmailCopy()
  const hods = withoutNoMailRecipients(await getAllHodEmails())
  const skip = new Set([director, gmail].filter((e) => e.includes('@')))
  const to = withoutNoMailRecipients(
    Array.from(
      new Set(
        hods
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e.includes('@') && !skip.has(e)),
      ),
    ),
  )
  const cc = withoutNoMailRecipients(
    Array.from(new Set([director, gmail].filter((e) => e.includes('@') && !to.includes(e)))),
  )
  return { director, to: to.length ? to : cc.length ? cc : [director], cc }
}

function istLabel(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    })
  } catch {
    return String(iso)
  }
}

function istYmd(iso?: string) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  } catch {
    return String(iso).slice(0, 10)
  }
}

function complaintBucket(c: GuardComplaint): 'received' | 'process' | 'delayed' | 'solved' {
  if (c.status === 'solved') return 'solved'
  if (c.isDelayed) return 'delayed'
  if (c.status === 'received' || c.status === 'reopened') return 'received'
  return 'process'
}

function sectionTitle(n: number, title: string) {
  return `<div style="margin:22px 0 10px;padding:10px 12px;background:#14224f;color:#fff;font-size:14px;font-weight:800;border-radius:8px">${n}. ${esc(title)}</div>`
}

function registeredGuardsHtml(complaints: GuardComplaint[], branches: Awaited<ReturnType<typeof getBranches>>, today: string) {
  const live = complaints.filter((c) => c.active !== false)
  const show = live.filter(
    (c) => c.status !== 'solved' || istYmd(c.registeredAt) === today || istYmd(c.solvedAt) === today,
  )
  const byBranch = new Map<string, GuardComplaint[]>()
  for (const c of show) {
    const name = branchDisplayName(c.branchId, branches) || c.branchId || 'Branch'
    const list = byBranch.get(name) || []
    list.push(c)
    byBranch.set(name, list)
  }
  const groups = [...byBranch.entries()].sort((a, b) => {
    const openA = a[1].filter((c) => c.status !== 'solved').length
    const openB = b[1].filter((c) => c.status !== 'solved').length
    return openB - openA || a[0].localeCompare(b[0])
  })

  const summaryRows = groups.map(([name, list], i) => {
    const rec = list.filter((c) => complaintBucket(c) === 'received').length
    const proc = list.filter((c) => complaintBucket(c) === 'process').length
    const delayed = list.filter((c) => complaintBucket(c) === 'delayed').length
    const solved = list.filter((c) => c.status === 'solved').length
    const balance = rec + proc + delayed
    return `<tr style="background:${i % 2 ? '#f8fafc' : '#fff'}">
      <td style="padding:7px 6px;border:1px solid #e2e8f0;text-align:center">${i + 1}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0;font-weight:700">${esc(name)}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0;text-align:center">${rec}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0;text-align:center">${proc}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0;text-align:center;${delayed ? 'color:#dc2626;font-weight:700' : ''}">${delayed}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0;text-align:center">${solved}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0;text-align:center;${balance ? 'color:#dc2626;font-weight:700' : ''}">${balance}</td>
    </tr>`
  })
  const totRec = groups.reduce((n, [, list]) => n + list.filter((c) => complaintBucket(c) === 'received').length, 0)
  const totProc = groups.reduce((n, [, list]) => n + list.filter((c) => complaintBucket(c) === 'process').length, 0)
  const totDel = groups.reduce((n, [, list]) => n + list.filter((c) => complaintBucket(c) === 'delayed').length, 0)
  const totSol = groups.reduce((n, [, list]) => n + list.filter((c) => c.status === 'solved').length, 0)
  const totBal = totRec + totProc + totDel
  if (summaryRows.length) {
    summaryRows.push(`<tr style="background:#eef2ff">
      <td style="padding:7px 6px;border:1px solid #e2e8f0"></td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0"><b>TOTAL</b></td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0;text-align:center"><b>${totRec}</b></td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0;text-align:center"><b>${totProc}</b></td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0;text-align:center"><b>${totDel}</b></td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0;text-align:center"><b>${totSol}</b></td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0;text-align:center"><b>${totBal}</b></td>
    </tr>`)
  }

  const summary = `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px">
    <thead><tr>
      <th style="padding:7px 6px;background:#14224f;color:#fff;border:1px solid #0f1a3d;font-size:11px">Sl.No.</th>
      <th style="padding:7px 6px;background:#14224f;color:#fff;border:1px solid #0f1a3d;font-size:11px">Branch</th>
      <th style="padding:7px 6px;background:#14224f;color:#fff;border:1px solid #0f1a3d;font-size:11px">Received</th>
      <th style="padding:7px 6px;background:#14224f;color:#fff;border:1px solid #0f1a3d;font-size:11px">In process</th>
      <th style="padding:7px 6px;background:#14224f;color:#fff;border:1px solid #0f1a3d;font-size:11px">Delayed</th>
      <th style="padding:7px 6px;background:#14224f;color:#fff;border:1px solid #0f1a3d;font-size:11px">Solved today</th>
      <th style="padding:7px 6px;background:#14224f;color:#fff;border:1px solid #0f1a3d;font-size:11px">Balance</th>
    </tr></thead>
    <tbody>${summaryRows.join('') || '<tr><td colspan="7" style="padding:10px;border:1px solid #e2e8f0;text-align:center;color:#64748b">No registered guard complaints.</td></tr>'}</tbody>
  </table>`

  const blocks = groups
    .map(([name, list]) => {
      const open = list.filter((c) => c.status !== 'solved').length
      const rows = list
        .sort((a, b) => {
          const rank = (c: GuardComplaint) =>
            c.isDelayed ? 0 : c.status === 'solved' ? 3 : complaintBucket(c) === 'received' ? 1 : 2
          return rank(a) - rank(b) || String(b.registeredAt || '').localeCompare(String(a.registeredAt || ''))
        })
        .map((c, i) => {
          const delayed = c.isDelayed && c.status !== 'solved'
          return `<tr style="background:${i % 2 ? '#f8fafc' : '#fff'}">
            <td style="padding:6px;border:1px solid #e2e8f0">${i + 1}</td>
            <td style="padding:6px;border:1px solid #e2e8f0;font-weight:700">${esc(c.code)}</td>
            <td style="padding:6px;border:1px solid #e2e8f0">${esc(c.guardName)}</td>
            <td style="padding:6px;border:1px solid #e2e8f0">${esc(c.category)}${c.subCategory ? ` — ${esc(c.subCategory)}` : ''}</td>
            <td style="padding:6px;border:1px solid #e2e8f0;${delayed ? 'color:#dc2626;font-weight:700' : ''}">${esc(displayStatus(c))}</td>
            <td style="padding:6px;border:1px solid #e2e8f0">${esc(istLabel(c.registeredAt))}</td>
            <td style="padding:6px;border:1px solid #e2e8f0">${esc(c.clientName || '—')}</td>
          </tr>`
        })
        .join('')
      return `<div style="margin:0 0 16px">
        <div style="padding:8px 10px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px 8px 0 0;font-size:13px;font-weight:800;color:#14224f">${esc(name)} · Open ${open} · Listed ${list.length}</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          <thead><tr>
            <th style="padding:6px;background:#14224f;color:#fff;border:1px solid #0f1a3d;font-size:10px">#</th>
            <th style="padding:6px;background:#14224f;color:#fff;border:1px solid #0f1a3d;font-size:10px">Code</th>
            <th style="padding:6px;background:#14224f;color:#fff;border:1px solid #0f1a3d;font-size:10px">Guard</th>
            <th style="padding:6px;background:#14224f;color:#fff;border:1px solid #0f1a3d;font-size:10px">Complaint</th>
            <th style="padding:6px;background:#14224f;color:#fff;border:1px solid #0f1a3d;font-size:10px">Status</th>
            <th style="padding:6px;background:#14224f;color:#fff;border:1px solid #0f1a3d;font-size:10px">Registered</th>
            <th style="padding:6px;background:#14224f;color:#fff;border:1px solid #0f1a3d;font-size:10px">Client</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`
    })
    .join('')

  return `${summary}${blocks || '<p style="font-size:13px;color:#64748b">No registered guard complaints.</p>'}`
}

export function directorDaily430Subject(dateFor: string) {
  return `AGILE DIGITAL COMMAND CENTER — CONSOLIDATED MIS + GUARDS COMPLAINTS ${misAckDateDisplay(dateFor)}-REG`
}

export async function sendMisDirectorDailyPack(
  date: string,
  opts?: { preview?: boolean; force?: boolean; _direct?: boolean },
) {
  if (!opts?.preview && !opts?._direct) {
    return withDailyPackDelivery(
      'mis-director',
      () => sendMisDirectorDailyPack(date, { ...opts, _direct: true }),
      { force: opts?.force, ymd: date },
    )
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey && !opts?.preview) return { ok: false as const, error: 'Email not configured' }

  const [payload, raw, branches] = await Promise.all([
    buildConsolidatedMisAckPayload(date),
    getComplaints(),
    getBranches(),
  ])
  const complaints = realComplaintsOnly(raw).map((c) => applySla(c))
  const display = misAckDateDisplay(date)
  const { director, to, cc } = await hodToDirectorCc()
  const guardsHtml = registeredGuardsHtml(complaints, branches, date)
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9">
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:1100px;margin:0 auto;background:#ffffff;color:#1e293b">
  <div style="background:linear-gradient(135deg,#14224f 0%,#1e3a8a 58%,#0f172a 100%);padding:22px 24px 18px;border-radius:12px 12px 0 0;border-bottom:4px solid #c9a84c">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr>
        <td width="72" style="vertical-align:middle;padding-right:14px">
          <img src="https://www.agilegroup-digital.co.in/agile-logo-clear.png" alt="Agile" width="64" height="64" style="display:block;background:transparent;border:none;padding:0" />
        </td>
        <td style="vertical-align:middle">
          <div style="font-size:17px;font-weight:800;color:#ffffff">${esc(MIS_BRAND.company)}</div>
          <div style="font-size:12px;color:#cbd5e1;margin-top:4px">Agile Digital Command Centre · Daily 4:30 PM pack</div>
          <div style="margin-top:8px;font-size:13px;font-weight:800;color:#c9a84c">For Internal Circulation Only · All HODs · CC Director</div>
        </td>
      </tr>
    </table>
    <div style="margin-top:16px;padding:12px 14px;background:rgba(255,255,255,.1);border-radius:8px;border-left:4px solid #c9a84c">
      <div style="font-size:16px;font-weight:800;color:#c9a84c">Daily 4:30 PM — ${esc(display)}</div>
      <div style="font-size:12px;color:#e2e8f0;margin-top:4px">4:30 PM IST every day · Consolidated MIS + Branch-wise Registered Guards Complaints</div>
    </div>
  </div>
  <div style="padding:22px 24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
    <p style="margin:0 0 12px;font-size:14px">Dear HOD,</p>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:#475569">Please find today’s <b>Consolidated MIS</b> and <b>branch-wise Registered Guards Complaints</b>. This copy goes to <b>all HODs</b>, with <b>Director on copy</b>.</p>
    ${sectionTitle(1, 'Consolidated MIS report')}
    ${consolidatedBranchTableHtml(payload.branchRows, { monthCollectionPct: payload.collDisplay })}
    ${sectionTitle(2, 'Branch-wise Registered Guards Complaints')}
    <p style="margin:0 0 8px;font-size:12px;color:#64748b">From Agile Guards — registered cases, listed under each branch. Highest open balance first.</p>
    ${guardsHtml}
    <p style="margin:18px 0 6px;font-size:14px">Regards,</p>
    <p style="margin:0;font-size:14px"><b>Agile Digital Command Centre</b><br>${esc(MIS_BRAND.company)}</p>
    ${misAckFooterHtml()}
  </div>
</div>
</body></html>`

  const subject = directorDaily430Subject(date)
  if (opts?.preview) {
    return {
      ok: true as const,
      preview: true,
      subject,
      to,
      cc,
      date,
      submitted: payload.submitted,
      branchCount: payload.branchCount,
    }
  }

  const resend = new Resend(apiKey!)
  const from =
    process.env.MIS_ACK_FROM?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    'Agile MIS <noreply@agilegroup.co.in>'
  const result = await sendSuiteEmail(resend, {
    from,
    to,
    cc: cc.length ? cc : undefined,
    replyTo: director,
    subject,
    html,
    skipDirectorCc: true,
  })
  if (result.error) {
    return { ok: false as const, error: result.error.message ?? 'Send failed', to, cc, subject }
  }
  return { ok: true as const, subject, to, cc, from, date, hodTo: true }
}

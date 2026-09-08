/**
 * Agile Guards — branch-wise delayed complaint list.
 * 9:30 AM IST only (office hours). To: that branch’s HODs · CC: Director.
 */

import { Resend } from 'resend'
import { sendSuiteEmail, suiteDirectorEmail } from '../suite-mail.js'
import { suiteColourEmailShell, suiteStatRow, escHtml } from '../suite-digest-shell.js'
import { withDailyPackDelivery } from '../suite-daily-delivery.js'
import { getHodEmailsForBranch } from '../mis/digest.js'
import { getBranches, getUsers as getMisUsers, type MisBranch } from '../mis/store.js'
import { delayHeldUpAt, displayStatus, SLA_LABEL, stageClocks } from './completion.js'
import { listHodContacts } from './hod-contacts.js'
import { realComplaintsOnly } from './practice.js'
import {
  applySla,
  branchDisplayName,
  complaintMatchesBranch,
  getComplaints,
  getPortalUsers,
  guardsBranchList,
  type GuardComplaint,
} from './store.js'

export type GuardsDelayedSlot = 'am' | 'pm'

export function delayedSlotLabel(slot: GuardsDelayedSlot = 'am') {
  return '9:30 AM IST'
}

function istYmd(iso?: string) {
  const d = iso ? new Date(iso) : new Date()
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function istSubjectDate(iso?: string) {
  const ymd = istYmd(iso)
  const [y, m, d] = ymd.split('-')
  if (!d) return ymd
  return `${d}-${m}-${y}`
}

function istLongDate(iso?: string) {
  const d = iso ? new Date(iso) : new Date()
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
}

function istLabel(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    })
  } catch {
    return iso
  }
}

export function dailyGuardsDelayedSubject(branchName: string, iso?: string) {
  return `AGILE DIGITAL COMMAND CENTER , AGILE GUARDS — DELAYED COMPLAINTS — ${branchName} — ${istSubjectDate(iso)}-REG`
}

export function delayedComplaintsForBranch(
  complaints: GuardComplaint[],
  branchId: string,
  branches: { id: string; name: string }[],
): GuardComplaint[] {
  return complaints.filter(
    (c) =>
      c.active !== false &&
      c.isDelayed &&
      c.status !== 'solved' &&
      complaintMatchesBranch(c.branchId, branchId, branches),
  )
}

function timeBarRow(label: string, hours: number, color: string, maxH: number) {
  const w = Math.max(6, Math.round((Number(hours || 0) / Math.max(maxH, 1)) * 100))
  return `<tr>
    <td style="width:78px;padding:4px 8px 4px 0;font-size:12px;font-weight:700;color:#334155;white-space:nowrap">${escHtml(label)}</td>
    <td style="padding:4px 0">
      <div style="background:#e2e8f0;border-radius:8px;height:12px;overflow:hidden">
        <div style="width:${w}%;height:12px;background:${color};border-radius:8px"></div>
      </div>
    </td>
    <td style="width:46px;padding:4px 0 4px 8px;font-size:12px;font-weight:800;color:#0f172a;text-align:right">${hours}h</td>
  </tr>`
}

function complaintTimeBarsHtml(c: GuardComplaint) {
  const clk = stageClocks(c)
  const maxH = Math.max(clk.hodWaitHrs, clk.opsHrs, clk.deptHrs, 1)
  const held = delayHeldUpAt(c)
  return `<table style="width:100%;border-collapse:collapse;margin:8px 0 4px">
    ${timeBarRow('HOD / RM', clk.hodWaitHrs, '#2563eb', maxH)}
    ${timeBarRow('Operations', clk.opsHrs, '#d97706', maxH)}
    ${timeBarRow('Department', clk.deptHrs, '#dc2626', maxH)}
  </table>
  <div style="margin-top:6px;padding:7px 10px;border-radius:8px;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;font-size:13px;font-weight:800">
    Held up at: ${escHtml(held)} · Open ${clk.totalHrs}h (standard ${escHtml(SLA_LABEL)})
  </div>`
}

function delayedCardsHtml(list: GuardComplaint[]) {
  if (!list.length) return ''
  return list
    .map((c) => {
      const who = [c.opsStaffName, c.deptStaffName].filter(Boolean).join(' · ') || 'Not yet assigned'
      return `<div style="margin:0 0 14px;border:1px solid #fed7aa;border-radius:14px;overflow:hidden;background:#fff">
        <div style="background:linear-gradient(135deg,#7f1d1d,#b45309);color:#fff;padding:10px 12px">
          <div style="font-size:15px;font-weight:900">${escHtml(c.code)} · ${escHtml(c.guardName || 'Guard')}</div>
          <div style="font-size:12px;opacity:.92;margin-top:3px">${escHtml(c.category)}${c.subCategory ? ` — ${escHtml(c.subCategory)}` : ''} · ${escHtml(displayStatus(c))}</div>
        </div>
        <div style="padding:12px">
          <div style="font-size:13px;color:#334155;margin-bottom:6px">Received: <b>${escHtml(istLabel(c.registeredAt))}</b> · Assigned to: <b>${escHtml(who)}</b></div>
          ${complaintTimeBarsHtml(c)}
        </div>
      </div>`
    })
    .join('')
}

export function buildGuardsDelayedBranchHtml(opts: {
  branchName: string
  dateLabel: string
  delayed: GuardComplaint[]
  slot?: GuardsDelayedSlot
}) {
  const n = opts.delayed.length
  const nil = n === 0
  const when = delayedSlotLabel('am')
  const body = `
    ${suiteStatRow([
      {
        label: 'Delayed (past 24h)',
        value: n,
        color: nil ? '#047857' : '#b91c1c',
        bg: nil ? '#ecfdf5' : '#fef2f2',
      },
    ])}
    ${
      nil
        ? `<div style="padding:16px 14px;border-radius:12px;background:#ecfdf5;border:1px solid #bbf7d0;color:#065f46;font-size:15px;font-weight:700">
            Nil delayed complaints for <b>${escHtml(opts.branchName)}</b> as on ${escHtml(opts.dateLabel)} at ${escHtml(when)}.
          </div>`
        : `<p style="margin:0 0 12px;color:#7c2d12;font-weight:700">Please close these ${n} delayed complaint(s) during office hours today. Colour bars show where each case is held up (HOD / Operations / Department).</p>
           ${delayedCardsHtml(opts.delayed)}`
    }
    <p style="font-size:13px;color:#475569;margin-top:16px">
      Open Delayed Complaints:
      <a href="https://www.agilegroup-digital.co.in/guards">HOD portal</a> ·
      <a href="https://www.agilegroup-digital.co.in/guards?portal=management">Management portal</a>
    </p>`

  return suiteColourEmailShell({
    appName: 'Agile Guards',
    title: 'Branch-wise Delayed Complaints',
    subtitle: `${escHtml(opts.branchName)} · 9:30 AM IST · ${escHtml(opts.dateLabel)}`,
    accentFrom: nil ? '#065f46' : '#7f1d1d',
    accentTo: nil ? '#0f766e' : '#b45309',
    bodyHtml: body,
  })
}

async function hodsForBranch(
  branchId: string,
  branches: MisBranch[],
  misUsers: Awaited<ReturnType<typeof getMisUsers>>,
  portalUsers: Awaited<ReturnType<typeof getPortalUsers>>,
): Promise<string[]> {
  const seen = new Set<string>()
  const out: string[] = []
  const add = (e: string) => {
    const x = e.trim().toLowerCase()
    if (!x.includes('@') || seen.has(x)) return
    seen.add(x)
    out.push(e.trim())
  }
  for (const h of listHodContacts(branchId, branches, misUsers, portalUsers)) add(h.email)
  for (const e of await getHodEmailsForBranch(branchId, misUsers, branches)) add(e)
  return out
}

export function buildGuardsDelayedAllBranchesPreviewHtml(packs: { branchName: string; html: string; delayed: GuardComplaint[] }[]) {
  const total = packs.reduce((s, p) => s + p.delayed.length, 0)
  const note = `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:840px;margin:0 auto 16px;padding:14px 16px;border-radius:12px;background:#eff6ff;border:1px solid #93c5fd;color:#1e3a8a">
    <b>DRAFT — 9:30 AM mail</b><br>
    Each HOD receives <b>only their branch</b>. Director is copied on every mail. Colour bars = time at HOD / Operations / Department. Red line = where it is held up.
    <div style="margin-top:8px;font-weight:800">${packs.length} branch letter(s) · ${total} delayed case(s)</div>
  </div>`
  return note + packs.map((p) => p.html).join('<div style="height:22px"></div>')
}

export async function sendDailyGuardsDelayedMail(opts?: {
  preview?: boolean
  force?: boolean
  _direct?: boolean
  slot?: GuardsDelayedSlot
}) {
  if (opts?.slot === 'pm') {
    return { ok: true, skipped: true, reason: 'Evening delayed mail stopped — 9:30 AM only' }
  }
  const slot: GuardsDelayedSlot = 'am'
  if (!opts?.preview && !opts?._direct) {
    return withDailyPackDelivery('guards-delayed-am', () => sendDailyGuardsDelayedMail({ ...opts, slot, _direct: true }), {
      force: opts?.force,
    })
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey && !opts?.preview) return { ok: false, skipped: true, reason: 'Email not configured' }

  const [raw, branches, misUsers, portalUsers] = await Promise.all([
    getComplaints(),
    getBranches(),
    getMisUsers(),
    getPortalUsers(),
  ])
  const complaints = realComplaintsOnly(raw)
    .map((c) => applySla(c))
    .filter((c) => c.active !== false)
  const branchList = guardsBranchList(branches)
  const dateLabel = istLongDate()
  const director = suiteDirectorEmail()

  const packs = branchList.map((b) => {
    const delayed = delayedComplaintsForBranch(complaints, b.id, branches)
    return {
      branchId: b.id,
      branchName: branchDisplayName(b.id, branches) || b.name,
      delayed,
      html: buildGuardsDelayedBranchHtml({
        branchName: branchDisplayName(b.id, branches) || b.name,
        dateLabel,
        delayed,
        slot,
      }),
    }
  })

  if (opts?.preview) {
    const delayedTotal = packs.reduce((s, p) => s + p.delayed.length, 0)
    return {
      ok: true,
      preview: true,
      date: dateLabel,
      branches: packs.length,
      delayedTotal,
      html: buildGuardsDelayedAllBranchesPreviewHtml(packs),
      sampleHtml: packs.find((p) => p.delayed.length)?.html || packs[0]?.html || '',
    }
  }

  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Guards <noreply@agilegroup.co.in>'
  const sent: { branch: string; to: string[]; delayed: number; ok: boolean; error?: string }[] = []

  for (const pack of packs) {
    const hods = await hodsForBranch(pack.branchId, branches, misUsers, portalUsers)
    const to = hods.length ? hods : [director]
    const r = await sendSuiteEmail(resend, {
      from,
      to,
      cc: [director],
      subject: dailyGuardsDelayedSubject(pack.branchName),
      html: pack.html,
    })
    sent.push({
      branch: pack.branchName,
      to,
      delayed: pack.delayed.length,
      ok: !r.error,
      error: r.error?.message,
    })
  }

  const failed = sent.filter((s) => !s.ok)
  return {
    ok: failed.length === 0,
    date: dateLabel,
    branches: sent.length,
    delayedTotal: packs.reduce((s, p) => s + p.delayed.length, 0),
    sent,
    error: failed.length ? `${failed.length} branch mail(s) failed` : undefined,
  }
}

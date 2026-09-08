import { htmlToBase64Attachment } from '../crm/survey-report.js'
import { pinMailFrom, sendSuiteEmail } from '../suite-mail.js'
import { LOKESH_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL } from './branch-mail-cc.js'
import { MIS_BRAND } from './brand.js'
import {
  clearAllClientVisitsNow,
  emptyClientVisit,
  getClientVisits,
  normalizeClientVisit,
  purgeAllClientVisitsOnce,
  saveClientVisits,
  storageOk,
  type MisClientVisit,
} from './client-visit-store.js'
import { clientNamesForBranch } from './branch-mobile-stats.js'
import { isMgmtAllBranches } from '../suite-mgmt-branch-select.js'
import { copyVehicleRequirementToControl } from './copy-vehicle-requirement-to-control.js'
import { dayVisitsOnly, syncMobileVisits } from './mobile-visits.js'
import {
  getBranches,
  getClients,
  getStaff,
  getUsers,
  getVisitDates,
  getVisitsMany,
  misStorageOk,
  nid,
  type MisClient,
  type MisVisit,
} from './store.js'

function s(v: unknown, n = 4000): string {
  return String(v ?? '').slice(0, n)
}

function parseEmails(v: unknown): string[] {
  return String(v ?? '')
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@'))
}

function monthYm(v: unknown): string {
  const m = String(v ?? '').slice(0, 7)
  return /^\d{4}-\d{2}$/.test(m)
    ? m
    : new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(0, 7)
}

function esc(v: unknown): string {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function fmtDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd ?? '').trim())
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(ymd ?? '')
}

async function branchHodEmails(branchId: string): Promise<string[]> {
  const hodTo: string[] = []
  try {
    const users = await getUsers()
    for (const u of users) {
      if (u.active === false || !u.email?.includes('@')) continue
      if (u.branchId !== branchId) continue
      const role = String(u.role || '')
      if (
        role === 'Branch Manager' ||
        role === 'Operations Manager' ||
        role === 'Area Manager' ||
        role === 'Field Officer'
      ) {
        hodTo.push(u.email.trim().toLowerCase())
      }
    }
  } catch {
    /* optional */
  }
  return [...new Set(hodTo)]
}

export function buildClientVisitReportHtml(v: MisClientVisit, branchName: string): string {
  const row = (label: string, value: string) =>
    `<tr><th style="width:28%;text-align:left;background:#14224f;color:#c9a84c;padding:8px 10px;border:1px solid #e2e8f0">${esc(label)}</th>` +
    `<td style="padding:8px 10px;border:1px solid #e2e8f0;background:#fff;color:#0f172a">${esc(value || '—')}</td></tr>`
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Client Visit Report</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a">
<div style="max-width:820px;margin:0 auto;padding:18px 14px 28px">
  <div style="background:linear-gradient(135deg,#14224f 0%,#1e3a8a 55%,#0f172a 100%);color:#fff;border-radius:14px;padding:20px 22px;margin-bottom:16px;border-bottom:4px solid #c9a84c">
    <img src="${MIS_BRAND.logoUrl}" alt="Agile" width="56" height="56" style="background:#fff;border-radius:10px;padding:4px;margin-bottom:10px;display:block">
    <div style="font-size:18px;font-weight:900">${esc(MIS_BRAND.company)}</div>
    <div style="font-size:20px;font-weight:900;color:#c9a84c;margin-top:8px">Client Visit Report</div>
    <div style="font-size:13px;color:#cbd5e1;margin-top:6px">${esc(v.clientName || 'Client')} · ${esc(branchName)} · ${esc(fmtDate(v.visitDate))}</div>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    ${row('Client', v.clientName)}
    ${row('Location', v.location)}
    ${row('Visit date', fmtDate(v.visitDate))}
    ${row('Visit time', v.visitTime)}
    ${row('Visited by', v.officerName)}
    ${row('Person met', v.personMet)}
    ${row('Purpose', v.purpose)}
    ${row('Observation', v.observation)}
    ${row('Issues found', v.issues)}
    ${row('Action taken', v.actionTaken)}
    ${row('Follow-up', v.followUp)}
    ${row('SLA / visit note', v.slaNote)}
  </table>
  <p style="font-size:12px;color:#64748b;margin-top:16px">Prepared on Agile MIS · ${esc(MIS_BRAND.siteLabel)}</p>
</div>
</body></html>`
}

function asTime(raw: string): string {
  const m = /(\d{1,2}):(\d{2})/.exec(String(raw || ''))
  if (!m) return '10:00'
  return `${m[1].padStart(2, '0')}:${m[2]}`
}

function matchClient(name: string, clients: MisClient[]): MisClient | undefined {
  const n = name.trim().toLowerCase()
  if (!n) return undefined
  return (
    clients.find((c) => c.name.trim().toLowerCase() === n) ||
    clients.find((c) => {
      const cn = c.name.trim().toLowerCase()
      return Boolean(cn) && (n.includes(cn) || cn.includes(n))
    })
  )
}

function mobileVisitId(v: MisVisit): string {
  const raw = String(v.id || '').replace(/[^a-zA-Z0-9]/g, '')
  if (raw) return `cvm-${raw.slice(0, 28)}`
  const slug = `${v.date}|${v.user}|${v.client}|${v.visitTime}`.toLowerCase()
  return `cvm-${Buffer.from(slug).toString('base64url').slice(0, 24)}`
}

function mergeKey(v: { visitDate: string; clientName: string; officerName: string; visitTime: string }): string {
  return [v.visitDate, v.clientName.trim().toLowerCase(), v.officerName.trim().toLowerCase(), asTime(v.visitTime)]
    .join('|')
}

function fromMobileVisit(v: MisVisit, branchId: string, clients: MisClient[]): MisClientVisit {
  const client = matchClient(v.client, clients)
  const now = new Date().toISOString()
  return normalizeClientVisit({
    id: mobileVisitId(v),
    branchId,
    clientId: client?.id || '',
    clientName: client?.name || v.client || '',
    location: client?.location || v.unit || v.place || '',
    visitDate: v.date,
    visitTime: asTime(v.visitTime),
    officerName: v.user || '',
    personMet: v.personMet || '',
    purpose: 'Mobile / Work360 day visit',
    observation: v.remarks || '',
    slaNote: client?.slaDayVisit || '',
    status: 'Draft',
    createdAt: now,
    updatedAt: now,
    createdBy: v.user || 'Mobile',
    fromMobile: true,
    mobileId: String(v.id || ''),
  })
}

async function recentIstDates(days: number): Promise<string[]> {
  const out: string[] = []
  const now = new Date()
  for (let i = 0; i < days; i++) {
    const t = new Date(now.getTime() - i * 86400000)
    out.push(t.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }))
  }
  return out
}

async function loadMergedVisits(branchId: string, ym: string, clients: MisClient[]) {
  const allBranches = await getBranches(true)
  const allMode = isMgmtAllBranches(branchId)
  const branchName = allMode
    ? 'All Branches'
    : allBranches.find((b) => b.id === branchId)?.name || ''
  /** Exact Master Directory names for this branch only — no fuzzy / cross-branch match. */
  const names = clientNamesForBranch(clients)
  const saved = (await getClientVisits()).filter(
    (v) =>
      v.visitDate.startsWith(ym) &&
      v.active !== false &&
      (allMode || v.branchId === branchId),
  )
  if (allMode) {
    const merged = [...saved].sort((a, b) =>
      (b.visitDate + b.visitTime).localeCompare(a.visitDate + a.visitTime),
    )
    return { visits: merged, fetched: 0, branchName }
  }
  const known = (await getVisitDates()).filter((d) => d.startsWith(ym))
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const dates = [...new Set([...known, ...(today.startsWith(ym) ? [today] : [])])]
  const mobile = dates.length ? dayVisitsOnly(await getVisitsMany(dates)) : []
  const branchMobile = mobile.filter((v) => {
    const cl = String(v.client || '')
      .trim()
      .toLowerCase()
    return cl.length > 0 && names.has(cl)
  })
  const byId = new Map(saved.map((v) => [v.id, v]))
  const byMerge = new Map(saved.map((v) => [mergeKey(v), v]))
  const merged = [...saved]
  for (const row of branchMobile) {
    const mapped = fromMobileVisit(row, branchId, clients)
    if (byId.has(mapped.id) || byMerge.has(mergeKey(mapped))) continue
    byId.set(mapped.id, mapped)
    byMerge.set(mergeKey(mapped), mapped)
    merged.push(mapped)
  }
  merged.sort((a, b) => (b.visitDate + b.visitTime).localeCompare(a.visitDate + a.visitTime))
  return { visits: merged, fetched: branchMobile.length, branchName }
}

export async function handleClientVisitBoot(body: Record<string, unknown>, lockedBranchId?: string) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const purge = await purgeAllClientVisitsOnce()
  const allBranches = (await getBranches(true)).filter((b) => b.active !== false)
  let branchFilter = lockedBranchId || s(body.branchId, 80) || ''
  if (!lockedBranchId && (!branchFilter || isMgmtAllBranches(branchFilter))) {
    branchFilter = 'ALL'
  }
  if (lockedBranchId) branchFilter = lockedBranchId
  const ym = monthYm(body.month)
  /** Do not auto-sync every open — that pulled other branches. HOD taps Fetch when needed. */
  if (body.autoSync === true && !isMgmtAllBranches(branchFilter)) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    await syncMobileVisits(today, {
      includeVisits: true,
      includeDuty: false,
      includeAttendance: false,
    }).catch(() => null)
  }
  const allMode = isMgmtAllBranches(branchFilter) && !lockedBranchId
  const [clientsRaw, staffRaw] = await Promise.all([
    allMode ? getClients() : getClients(branchFilter || undefined),
    allMode ? Promise.resolve([]) : getStaff(branchFilter || undefined, true),
  ])
  const branchClients = allMode
    ? []
    : clientsRaw.filter((c) => c.active !== false && (!branchFilter || c.branchId === branchFilter))
  const { visits, fetched, branchName } = await loadMergedVisits(
    allMode ? 'ALL' : branchFilter,
    ym,
    branchClients,
  )
  const clients = branchClients.map((c) => ({
    id: c.id,
    name: c.name,
    location: c.location || '',
    slaDayVisit: c.slaDayVisit || '',
    branchId: c.branchId,
  }))
  const staff = staffRaw.map((x) => ({
    id: x.id,
    name: x.name,
    phone: x.phone || '',
    role: x.role || '',
  }))
  return {
    status: 200,
    json: {
      ok: true,
      month: ym,
      today: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
      branchId: allMode ? 'ALL' : branchFilter,
      branchName,
      allBranches: allMode,
      visits,
      fetched,
      clients,
      staff,
      branches: lockedBranchId ? [] : allBranches.map((b) => ({ id: b.id, name: b.name })),
      purgedSchedules: purge.purged ? purge.removed : 0,
    },
  }
}

export async function handleClientVisitFetchMobile(
  body: Record<string, unknown>,
  lockedBranchId?: string,
) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const days = Math.min(14, Math.max(1, Number(body.days) || 7))
  const dates = await recentIstDates(days)
  const ym = monthYm(body.month || dates[0])
  const scope = lockedBranchId || s(body.branchId, 80) || ''
  if (isMgmtAllBranches(scope) && !lockedBranchId) {
    return {
      status: 400,
      json: { error: 'Pick one branch first, then Fetch latest visits.' },
    }
  }
  let synced = 0
  const errors: string[] = []
  for (const date of dates) {
    const sync = await syncMobileVisits(date, {
      includeVisits: true,
      includeDuty: false,
      includeAttendance: false,
    })
    if (sync.ok) synced += Number(sync.saved || 0)
    else if (sync.error) errors.push(`${date}: ${sync.error}`)
  }
  const boot = await handleClientVisitBoot({ ...body, month: ym, autoSync: false }, lockedBranchId)
  return {
    status: boot.status,
    json: {
      ...boot.json,
      synced,
      syncError: errors[0] || '',
    },
  }
}

export async function handleClientVisitClearAll(_body: Record<string, unknown>) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const removed = await clearAllClientVisitsNow()
  return { status: 200, json: { ok: true, removed } }
}

export async function handleClientVisitSave(
  body: Record<string, unknown>,
  userName: string,
  lockedBranchId?: string,
) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const raw = (body.visit && typeof body.visit === 'object' ? body.visit : body) as Partial<MisClientVisit>
  const list = await getClientVisits()
  const existing = raw.id ? list.find((x) => x.id === raw.id) : undefined
  if (existing?.status === 'Sent') {
    return { status: 403, json: { error: 'This visit was sent to the client. Management must Reopen it before anyone can edit.' } }
  }
  const branchId = lockedBranchId || s(raw.branchId, 80) || existing?.branchId || ''
  if (!branchId || isMgmtAllBranches(branchId)) {
    return { status: 400, json: { error: 'Pick one branch (not All Branches) before saving a visit.' } }
  }
  if (lockedBranchId && existing && existing.branchId !== lockedBranchId) {
    return { status: 403, json: { error: 'This visit belongs to another branch.' } }
  }
  const clientName = s(raw.clientName, 200)
  if (!clientName) return { status: 400, json: { error: 'Pick a client from Master Directory.' } }
  const now = new Date().toISOString()
  const vehicleRequired = raw.vehicleRequired === true
  const next = normalizeClientVisit({
    ...(existing || emptyClientVisit(branchId)),
    ...raw,
    id: existing?.id || s(raw.id, 40) || nid('cv'),
    branchId,
    clientName,
    vehicleRequired,
    controlCaseNo: existing?.controlCaseNo || '',
    status: existing?.status === 'Reviewed' ? 'Reviewed' : 'Draft',
    createdAt: existing?.createdAt || now,
    createdBy: existing?.createdBy || userName,
    updatedAt: now,
    sentToClientAt: existing?.sentToClientAt || '',
    sentToClientBy: existing?.sentToClientBy || '',
    reviewedAt: existing?.reviewedAt || '',
    reviewedBy: existing?.reviewedBy || '',
  })
  let controlNote = ''
  if (vehicleRequired && !next.controlCaseNo) {
    const copied = await copyVehicleRequirementToControl({
      kind: 'client',
      branchId,
      visitDate: next.visitDate,
      visitTime: next.visitTime,
      officerName: next.officerName,
      officerPhone: next.officerPhone,
      clientName: next.clientName,
      location: next.location,
      purpose: next.purpose,
      sourceId: next.id,
      byName: userName,
    })
    if (copied.ok) {
      next.controlCaseNo = copied.caseNo
      controlNote = copied.skipped ? `Control case ${copied.caseNo} already linked.` : `Copied to Control as ${copied.caseNo}.`
    } else {
      controlNote = `Saved, but Control copy failed: ${copied.error}`
    }
  }
  const idx = list.findIndex((x) => x.id === next.id)
  if (idx >= 0) list[idx] = next
  else list.unshift(next)
  const ok = await saveClientVisits(list)
  if (!ok) return { status: 503, json: { error: 'Could not save visit.' } }
  return { status: 200, json: { ok: true, visit: next, controlNote } }
}

export async function handleClientVisitReview(
  body: Record<string, unknown>,
  userName: string,
  lockedBranchId?: string,
) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const id = s(body.visitId || body.id, 40)
  const list = await getClientVisits()
  const visit = list.find((x) => x.id === id)
  if (!visit) return { status: 404, json: { error: 'Visit not found.' } }
  if (lockedBranchId && visit.branchId !== lockedBranchId) {
    return { status: 403, json: { error: 'This visit belongs to another branch.' } }
  }
  if (visit.status === 'Sent') {
    return { status: 400, json: { error: 'Already sent to client. Reopen if you need to change it.' } }
  }
  if (!visit.clientName || !visit.observation.trim()) {
    return { status: 400, json: { error: 'Fill client and observation on Visit report before Review.' } }
  }
  const now = new Date().toISOString()
  const next = {
    ...visit,
    status: 'Reviewed' as const,
    reviewedAt: now,
    reviewedBy: userName,
    submittedAt: visit.submittedAt || now,
    submittedBy: visit.submittedBy || userName,
    updatedAt: now,
  }
  const idx = list.findIndex((x) => x.id === visit.id)
  if (idx >= 0) list[idx] = next
  await saveClientVisits(list)
  return { status: 200, json: { ok: true, visit: next } }
}

export async function handleClientVisitRemind(body: Record<string, unknown>, actorEmail: string) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const id = s(body.visitId || body.id, 40)
  const list = await getClientVisits()
  const visit = list.find((x) => x.id === id)
  if (!visit) return { status: 404, json: { error: 'Visit not found.' } }
  if (visit.status === 'Sent') {
    return { status: 400, json: { error: 'Already sent to client.' } }
  }
  const to = await branchHodEmails(visit.branchId)
  if (!to.length) {
    return { status: 400, json: { error: 'No HOD email on this branch. Add the HOD in User Management.' } }
  }
  const cc = [LOKESH_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL].filter((e) => e.includes('@') && !to.includes(e))
  const branchName = (await getBranches(true)).find((b) => b.id === visit.branchId)?.name || visit.branchId
  const text = [
    `Dear Team,`,
    ``,
    `Management reminder: please complete the Client Visit report and tap Review, then Send to client.`,
    ``,
    `Client: ${visit.clientName || '—'}`,
    `Visit date: ${fmtDate(visit.visitDate)} ${visit.visitTime || ''}`.trim(),
    `Branch: ${branchName}`,
    `Officer: ${visit.officerName || '—'}`,
    ``,
    `Open Agile MIS → HOD portal → Client Visits → Visit report.`,
    ``,
    `Reminder sent by: ${actorEmail}`,
    ``,
    `Regards,`,
    `Agile MIS — Client Visits`,
  ].join('\n')
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { status: 503, json: { error: 'Email service not configured.' } }
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    const result = await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      cc,
      subject: `[Reminder] Client Visit report — ${visit.clientName || 'Site'}`,
      text,
      html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap;font-size:14px;color:#111">${esc(text)}</div>`,
      skipDirectorCc: true,
    })
    if ((result as { error?: { message?: string } }).error) {
      return {
        status: 502,
        json: {
          error: (result as { error?: { message?: string } }).error?.message || 'Could not send reminder.',
        },
      }
    }
    const now = new Date().toISOString()
    const next = {
      ...visit,
      lastReminderAt: now,
      reminderCount: (visit.reminderCount || 0) + 1,
      updatedAt: now,
    }
    const idx = list.findIndex((x) => x.id === visit.id)
    if (idx >= 0) list[idx] = next
    await saveClientVisits(list)
    return { status: 200, json: { ok: true, visit: next, to, cc } }
  } catch (err) {
    console.error('[clientVisitRemind]', err)
    return { status: 502, json: { error: 'Could not send reminder.' } }
  }
}

export async function handleClientVisitReopen(body: Record<string, unknown>, actorEmail: string) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const id = s(body.visitId || body.id, 40)
  const list = await getClientVisits()
  const visit = list.find((x) => x.id === id)
  if (!visit) return { status: 404, json: { error: 'Visit not found.' } }
  const now = new Date().toISOString()
  const next = {
    ...visit,
    status: 'Draft' as const,
    reopenedAt: now,
    reopenedBy: actorEmail,
    updatedAt: now,
  }
  const idx = list.findIndex((x) => x.id === visit.id)
  if (idx >= 0) list[idx] = next
  await saveClientVisits(list)
  return { status: 200, json: { ok: true, visit: next } }
}

export async function handleClientVisitPreview(body: Record<string, unknown>, lockedBranchId?: string) {
  const id = s(body.visitId || body.id, 40)
  const visit = (await getClientVisits()).find((x) => x.id === id)
  if (!visit) return { status: 404, json: { error: 'Visit not found.' } }
  if (lockedBranchId && visit.branchId !== lockedBranchId) {
    return { status: 403, json: { error: 'This visit belongs to another branch.' } }
  }
  const branchName = (await getBranches(true)).find((b) => b.id === visit.branchId)?.name || ''
  return { status: 200, json: { ok: true, html: buildClientVisitReportHtml(visit, branchName) } }
}

export async function handleClientVisitSend(
  body: Record<string, unknown>,
  userName: string,
  lockedBranchId?: string,
) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const id = s(body.visitId || body.id, 40)
  const list = await getClientVisits()
  const visit = list.find((x) => x.id === id)
  if (!visit) return { status: 404, json: { error: 'Visit not found.' } }
  if (lockedBranchId && visit.branchId !== lockedBranchId) {
    return { status: 403, json: { error: 'This visit belongs to another branch.' } }
  }
  if (visit.status !== 'Reviewed' && visit.status !== 'Sent') {
    return { status: 400, json: { error: 'Review the visit report first, then Send to client.' } }
  }
  const to = parseEmails(body.to || visit.clientEmail)
  if (!to.length) return { status: 400, json: { error: 'Enter the client email on Visit report.' } }
  const extraCc = parseEmails(body.cc)
  const autoCc = [LOKESH_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL].filter((e) => e.includes('@'))
  const toSet = new Set(to)
  const cc = [...new Set([...extraCc, ...autoCc].filter((e) => !toSet.has(e)))]
  const branchName = (await getBranches(true)).find((b) => b.id === visit.branchId)?.name || ''
  const html = buildClientVisitReportHtml(visit, branchName)
  const slug = (visit.clientName || 'Client').replace(/[^\w\-]+/g, '_').slice(0, 40)
  const text = [
    `Dear Sir / Madam,`,
    ``,
    `Please find attached the Client Visit Report for ${visit.clientName || 'your site'}.`,
    `Visit date: ${fmtDate(visit.visitDate)} ${visit.visitTime || ''}`.trim(),
    visit.officerName ? `Visited by: ${visit.officerName}` : '',
    ``,
    `Regards,`,
    `Agile Security Force Pvt. Ltd.`,
    branchName,
  ]
    .filter(Boolean)
    .join('\n')
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { status: 503, json: { error: 'Email service not configured.' } }
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    const result = await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      cc,
      subject: s(body.subject, 200) || `Client Visit Report — ${visit.clientName || 'Site'} — ${fmtDate(visit.visitDate)}`,
      text,
      html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap;font-size:14px;color:#111">${esc(text)}</div>`,
      attachments: [htmlToBase64Attachment(`Client_Visit_Report_${slug}.html`, html)],
      skipDirectorCc: true,
    })
    if ((result as { error?: { message?: string } }).error) {
      return {
        status: 502,
        json: {
          error: (result as { error?: { message?: string } }).error?.message || 'Could not send to client.',
        },
      }
    }
    const now = new Date().toISOString()
    const next = {
      ...visit,
      clientEmail: to.join(', '),
      status: 'Sent' as const,
      sentToClientAt: now,
      sentToClientBy: userName,
      updatedAt: now,
    }
    const idx = list.findIndex((x) => x.id === visit.id)
    if (idx >= 0) list[idx] = next
    await saveClientVisits(list)
    return { status: 200, json: { ok: true, visit: next, to, cc } }
  } catch (err) {
    console.error('[clientVisitSend]', err)
    return { status: 502, json: { error: 'Could not send to client.' } }
  }
}

import { htmlToBase64Attachment } from '../crm/survey-report.js'
import { guardsSendWhatsAppPing } from '../guards/whatsapp-send.js'
import { pinMailFrom, sendSuiteEmail } from '../suite-mail.js'
import { LOKESH_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL } from './branch-mail-cc.js'
import { MIS_BRAND } from './brand.js'
import { misTodayIst } from './dates.js'
import {
  emptySession,
  loadNightSessions,
  normalizeReport,
  normalizeSession,
  normalizeStop,
  saveNightSessions,
  storageOk,
  type NightVisitSession,
  type NightVisitStop,
} from './night-visit-session-store.js'
import { copyVehicleRequirementToControl } from './copy-vehicle-requirement-to-control.js'
import { getBranches, getClients, getStaff, misStorageOk, nid } from './store.js'
import { isMgmtAllBranches } from '../suite-mgmt-branch-select.js'
import { handleSiteVisitList } from './site-visit-report-handlers.js'

export type NightVisitActor = {
  branchId?: string
  userName: string
  email?: string
  portal: 'staff' | 'mgmt'
}

function s(v: unknown, n = 4000): string {
  return String(v ?? '').slice(0, n)
}

function monthYm(v: unknown, visitDate?: string): string {
  const fromDate = String(visitDate ?? '').slice(0, 7)
  if (/^\d{4}-\d{2}$/.test(fromDate)) return fromDate
  const m = String(v ?? '').slice(0, 7)
  return /^\d{4}-\d{2}$/.test(m) ? m : misTodayIst().slice(0, 7)
}

function parseEmails(v: unknown): string[] {
  return String(v ?? '')
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@'))
}

function esc(v: unknown): string {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function fmtDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd ?? '').trim())
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(ymd ?? '')
}

async function resolveBranch(body: Record<string, unknown>, actor: NightVisitActor): Promise<string> {
  if (actor.branchId) return actor.branchId
  const id = s(body.branchId, 80)
  if (isMgmtAllBranches(id)) return 'ALL'
  if (id) return id
  return 'ALL'
}

async function loadMonth(branchId: string, month: string) {
  if (isMgmtAllBranches(branchId)) {
    const branches = (await getBranches(true)).filter((b) => b.active !== false)
    const packs = await Promise.all(branches.map((b) => loadNightSessions(b.id, month)))
    return packs.flat().sort((a, b) => (b.visitDate + b.visitTimeStart).localeCompare(a.visitDate + a.visitTimeStart))
  }
  return loadNightSessions(branchId, month)
}

async function putSession(branchId: string, month: string, session: NightVisitSession) {
  if (isMgmtAllBranches(branchId)) {
    return { ok: false as const, session, list: [] as NightVisitSession[], error: 'Pick one branch (not All Branches) to save.' }
  }
  const list = await loadMonth(branchId, month)
  const idx = list.findIndex((x) => x.id === session.id)
  if (idx >= 0) list[idx] = session
  else list.unshift(session)
  const ok = await saveNightSessions(branchId, month, list)
  return { ok, session, list }
}

function findSession(list: NightVisitSession[], id: string) {
  return list.find((x) => x.id === id) || null
}

function waMessage(session: NightVisitSession, kind: string): string {
  const stops = (session.stops || [])
    .map((st, i) => `${i + 1}. ${st.clientName}${st.location ? ` — ${st.location}` : ''}${st.mapUrl ? `\n   ${st.mapUrl}` : ''}`)
    .join('\n')
  const head = kind === 'reminder' ? 'REMINDER — Night Check Duty' : 'Night Check Duty'
  return [
    head,
    `Date: ${fmtDate(session.visitDate)}`,
    `Time: ${session.visitTimeStart} → ${session.visitTimeEnd}`,
    `Duty Officer: ${session.dutyOfficerName || '—'}`,
    session.driverName ? `Driver / Vehicle: ${session.driverName} / ${session.vehicleRegNo || '—'}` : '',
    ``,
    `Route:`,
    stops || '(route not set)',
    ``,
    `— Agile MIS Night Visit`,
  ]
    .filter((line) => line !== '')
    .join('\n')
}

function reportPreview(session: NightVisitSession, stop: NightVisitStop): string {
  const r = stop.report
  const posts = (r?.posts || [])
    .filter((p) => p.postName || p.observation)
    .map((p) => `Post ${p.postName || '—'}: ${p.observation || '—'}`)
    .join('\n')
  return [
    `Night Check Report — ${stop.clientName}`,
    `Date: ${fmtDate(r?.reportDate || session.visitDate)}`,
    `Officer: ${session.dutyOfficerName || '—'}`,
    `Location: ${stop.location || '—'}`,
    ``,
    `Observation: ${r?.generalObservation || '—'}`,
    `Information: ${r?.information || '—'}`,
    `Sleeping cases: ${r?.sleepingCases || '—'}`,
    `ID card: ${r?.idCardValidity || '—'}`,
    `Turnout: ${r?.turnoutIssue || '—'}`,
    posts ? `\nPost-wise:\n${posts}` : '',
  ].join('\n')
}

function reportHtml(session: NightVisitSession, stop: NightVisitStop, branchName: string): string {
  const r = stop.report
  const row = (label: string, value: string) =>
    `<tr><th style="width:28%;text-align:left;background:#14224f;color:#c9a84c;padding:8px 10px;border:1px solid #e2e8f0">${esc(label)}</th>` +
    `<td style="padding:8px 10px;border:1px solid #e2e8f0">${esc(value || '—')}</td></tr>`
  const posts = (r?.posts || [])
    .filter((p) => p.postName || p.observation)
    .map(
      (p) =>
        `<tr><td>${esc(p.postName)}</td><td>${esc(p.observation)}</td><td>${esc(p.sleeping)}</td><td>${esc(p.idCard)}</td><td>${esc(p.turnout)}</td></tr>`,
    )
    .join('')
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Night Check Report</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:820px;margin:0 auto;padding:18px 14px 28px">
  <div style="background:linear-gradient(135deg,#14224f,#1e3a8a);color:#fff;border-radius:14px;padding:20px;margin-bottom:16px;border-bottom:4px solid #c9a84c">
    <img src="${MIS_BRAND.logoUrl}" alt="Agile" width="56" height="56" style="background:#fff;border-radius:10px;padding:4px;margin-bottom:10px;display:block">
    <div style="font-weight:900;font-size:18px">${esc(MIS_BRAND.company)}</div>
    <div style="font-weight:900;font-size:20px;color:#c9a84c;margin-top:8px">Night Check Report</div>
    <div style="font-size:13px;color:#cbd5e1;margin-top:6px">${esc(stop.clientName)} · ${esc(branchName)} · ${esc(fmtDate(r?.reportDate || session.visitDate))}</div>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    ${row('Client', stop.clientName)}
    ${row('Location', stop.location)}
    ${row('Visit date', fmtDate(session.visitDate))}
    ${row('Window', `${session.visitTimeStart} → ${session.visitTimeEnd}`)}
    ${row('Duty Officer', session.dutyOfficerName)}
    ${row('Observation', r?.generalObservation || '')}
    ${row('Information', r?.information || '')}
    ${row('Sleeping cases', r?.sleepingCases || '')}
    ${row('ID card', r?.idCardValidity || '')}
    ${row('Turnout', r?.turnoutIssue || '')}
  </table>
  ${
    posts
      ? `<h3 style="margin-top:16px">Post-wise</h3><table style="width:100%;border-collapse:collapse;font-size:13px"><tr><th>Post</th><th>Observation</th><th>Sleeping</th><th>ID</th><th>Turnout</th></tr>${posts}</table>`
      : ''
  }
</div></body></html>`
}

async function boot(body: Record<string, unknown>, actor: NightVisitActor) {
  const branchId = await resolveBranch(body, actor)
  if (!branchId) return { status: 400, json: { error: 'Branch required.' } }
  const month = monthYm(body.month)
  const allMode = isMgmtAllBranches(branchId) && actor.portal === 'mgmt'
  const [sessions, clientsRaw, staffRaw, branches] = await Promise.all([
    loadMonth(branchId, month),
    allMode ? Promise.resolve([]) : getClients(branchId),
    allMode ? Promise.resolve([]) : getStaff(branchId, true),
    actor.portal === 'mgmt' ? getBranches(true) : Promise.resolve([]),
  ])
  const branchName = allMode
    ? 'All Branches'
    : (await getBranches(true)).find((b) => b.id === branchId)?.name || ''
  return {
    status: 200,
    json: {
      ok: true,
      branchId: allMode ? 'ALL' : branchId,
      branchName,
      allBranches: allMode,
      month,
      today: misTodayIst(),
      sessions,
      clients: clientsRaw
        .filter((c) => c.active !== false)
        .map((c) => ({
          id: c.id,
          name: c.name,
          location: c.location || '',
          mapUrl: '',
        })),
      staff: staffRaw.map((x) => ({ id: x.id, name: x.name, phone: x.phone || '', role: x.role || '' })),
      branches: branches.filter((b) => b.active !== false).map((b) => ({ id: b.id, name: b.name })),
    },
  }
}

async function saveSession(body: Record<string, unknown>, actor: NightVisitActor) {
  const raw = (body.session && typeof body.session === 'object' ? body.session : body) as Partial<NightVisitSession>
  const branchId = await resolveBranch(body, actor)
  if (!branchId || isMgmtAllBranches(branchId)) {
    return { status: 400, json: { error: 'Pick one branch (not All Branches) before saving a schedule.' } }
  }
  const visitDate = s(raw.visitDate, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) return { status: 400, json: { error: 'Pick the visit date.' } }
  if (!s(raw.dutyOfficerName, 120).trim()) return { status: 400, json: { error: 'Enter Duty Officer name.' } }
  const month = monthYm(body.month, visitDate)
  const list = await loadMonth(branchId, month)
  const existing = raw.id ? findSession(list, s(raw.id, 40)) : null
  if (existing?.status === 'Cancelled') {
    return { status: 400, json: { error: 'This schedule was cancelled. Add a new one.' } }
  }
  const now = new Date().toISOString()
  const vehicleRequired = raw.vehicleRequired === true || String((body as { vehicleRequired?: unknown }).vehicleRequired) === 'true'
  const next = normalizeSession({
    ...(existing || emptySession(branchId)),
    ...raw,
    id: existing?.id || s(raw.id, 40) || nid('nvs'),
    branchId,
    visitDate,
    vehicleRequired,
    controlCaseNo: existing?.controlCaseNo || '',
    status: existing?.status === 'Cancelled' ? 'Cancelled' : existing?.status || 'Scheduled',
    stops: existing?.stops || [],
    createdAt: existing?.createdAt || now,
    createdBy: existing?.createdBy || actor.userName,
    updatedAt: now,
  })
  let controlNote = ''
  if (vehicleRequired && !next.controlCaseNo) {
    const copied = await copyVehicleRequirementToControl({
      kind: 'night',
      branchId,
      visitDate,
      visitTime: `${next.visitTimeStart}–${next.visitTimeEnd}`,
      officerName: next.dutyOfficerName,
      officerPhone: next.dutyOfficerPhone,
      purpose: 'Night check duty',
      sourceId: next.id,
      byEmail: actor.email || '',
      byName: actor.userName,
    })
    if (copied.ok) {
      next.controlCaseNo = copied.caseNo
      controlNote = copied.skipped ? `Control case ${copied.caseNo} already linked.` : `Copied to Control as ${copied.caseNo}.`
    } else {
      controlNote = `Saved, but Control copy failed: ${copied.error}`
    }
  }
  const saved = await putSession(branchId, month, next)
  if (!saved.ok) return { status: 503, json: { error: 'Could not save schedule.' } }
  return { status: 200, json: { ok: true, session: saved.session, controlNote } }
}

async function cancelSession(body: Record<string, unknown>, actor: NightVisitActor) {
  const branchId = await resolveBranch(body, actor)
  const month = monthYm(body.month)
  const id = s(body.sessionId, 40)
  const reason = s(body.cancelReason, 400).trim()
  if (!reason) return { status: 400, json: { error: 'Enter a reason.' } }
  const list = await loadMonth(branchId, month)
  const session = findSession(list, id)
  if (!session) return { status: 404, json: { error: 'Schedule not found.' } }
  session.status = 'Cancelled'
  session.cancelReason = reason
  session.updatedAt = new Date().toISOString()
  const saved = await putSession(branchId, month, session)
  if (!saved.ok) return { status: 503, json: { error: 'Could not cancel.' } }
  return { status: 200, json: { ok: true, session } }
}

async function saveRoute(body: Record<string, unknown>, actor: NightVisitActor) {
  const branchId = await resolveBranch(body, actor)
  const month = monthYm(body.month)
  const id = s(body.sessionId, 40)
  const list = await loadMonth(branchId, month)
  const session = findSession(list, id)
  if (!session) return { status: 404, json: { error: 'Schedule not found.' } }
  const rawStops = Array.isArray(body.stops) ? body.stops : []
  const prevById = new Map(session.stops.map((st) => [st.id, st]))
  session.stops = rawStops
    .map((row, i) => {
      const st = normalizeStop(row as Partial<NightVisitStop>, i)
      const prev = prevById.get(st.id)
      if (prev?.report) st.report = prev.report
      return st
    })
    .filter((st) => st.clientName)
  if (session.status === 'Scheduled' && session.stops.length) session.status = 'RouteReady'
  session.updatedAt = new Date().toISOString()
  const saved = await putSession(branchId, month, session)
  if (!saved.ok) return { status: 503, json: { error: 'Could not save route.' } }
  return { status: 200, json: { ok: true, session } }
}

async function previewWa(body: Record<string, unknown>, actor: NightVisitActor) {
  const branchId = await resolveBranch(body, actor)
  const month = monthYm(body.month)
  const session = findSession(await loadMonth(branchId, month), s(body.sessionId, 40))
  if (!session) return { status: 404, json: { error: 'Schedule not found.' } }
  return { status: 200, json: { ok: true, message: waMessage(session, s(body.kind, 20) || 'auto') } }
}

async function sendWa(body: Record<string, unknown>, actor: NightVisitActor) {
  const branchId = await resolveBranch(body, actor)
  const month = monthYm(body.month)
  const list = await loadMonth(branchId, month)
  const session = findSession(list, s(body.sessionId, 40))
  if (!session) return { status: 404, json: { error: 'Schedule not found.' } }
  if (!session.dutyOfficerPhone) return { status: 400, json: { error: 'Enter Duty Officer WhatsApp number first.' } }
  if (!session.stops.length) return { status: 400, json: { error: 'Save the route first.' } }
  const kind = s(body.kind, 20) === 'reminder' ? 'reminder' : 'auto'
  const text = waMessage(session, kind)
  const sent = await guardsSendWhatsAppPing(session.dutyOfficerPhone, text)
  const now = new Date().toISOString()
  if (kind === 'reminder') {
    session.waReminderStatus = sent.ok ? 'sent' : 'failed'
    session.waReminderSentAt = sent.ok ? now : session.waReminderSentAt
  } else {
    session.waAutoStatus = sent.ok ? 'sent' : 'failed'
    session.waAutoSentAt = sent.ok ? now : session.waAutoSentAt
    session.waAutoError = sent.ok ? '' : sent.error || 'WhatsApp failed'
    if (sent.ok && session.status === 'RouteReady') session.status = 'TeamNotified'
  }
  session.updatedAt = now
  await putSession(branchId, month, session)
  if (!sent.ok) return { status: 502, json: { error: sent.error || 'WhatsApp failed', session } }
  return { status: 200, json: { ok: true, session } }
}

async function allotDuty(body: Record<string, unknown>, actor: NightVisitActor) {
  if (actor.portal !== 'mgmt') {
    return { status: 403, json: { error: 'Corporate allots the Duty Driver.' } }
  }
  const branchId = await resolveBranch(body, actor)
  const month = monthYm(body.month)
  const list = await loadMonth(branchId, month)
  const session = findSession(list, s(body.sessionId, 40))
  if (!session) return { status: 404, json: { error: 'Schedule not found.' } }
  session.driverName = s(body.driverName, 120)
  session.vehicleRegNo = s(body.vehicleRegNo, 40)
  session.updatedAt = new Date().toISOString()
  const saved = await putSession(branchId, month, session)
  if (!saved.ok) return { status: 503, json: { error: 'Could not save allotment.' } }
  return { status: 200, json: { ok: true, session } }
}

async function cancelAllotment(body: Record<string, unknown>, actor: NightVisitActor) {
  if (actor.portal !== 'mgmt') {
    return { status: 403, json: { error: 'Corporate clears the allotment.' } }
  }
  const branchId = await resolveBranch(body, actor)
  const month = monthYm(body.month)
  const list = await loadMonth(branchId, month)
  const session = findSession(list, s(body.sessionId, 40))
  if (!session) return { status: 404, json: { error: 'Schedule not found.' } }
  session.driverName = ''
  session.vehicleRegNo = ''
  session.updatedAt = new Date().toISOString()
  await putSession(branchId, month, session)
  return { status: 200, json: { ok: true, session } }
}

async function loadReports(body: Record<string, unknown>, actor: NightVisitActor) {
  const branchId = await resolveBranch(body, actor)
  const month = monthYm(body.month)
  const session = findSession(await loadMonth(branchId, month), s(body.sessionId, 40))
  if (!session) return { status: 404, json: { error: 'Schedule not found.' } }
  const items = session.stops.map((stop) => ({ stop, report: stop.report || null }))
  return { status: 200, json: { ok: true, items } }
}

function pickStop(session: NightVisitSession, stopId: string) {
  return session.stops.find((st) => st.id === stopId) || null
}

async function saveClientReport(body: Record<string, unknown>, actor: NightVisitActor) {
  const branchId = await resolveBranch(body, actor)
  const month = monthYm(body.month)
  const list = await loadMonth(branchId, month)
  const session = findSession(list, s(body.sessionId, 40))
  if (!session) return { status: 404, json: { error: 'Schedule not found.' } }
  const stop = pickStop(session, s(body.stopId, 40))
  if (!stop) return { status: 404, json: { error: 'Client stop not found.' } }
  const now = new Date().toISOString()
  stop.report = normalizeReport({
    ...(stop.report || {}),
    ...(body.report && typeof body.report === 'object' ? body.report : {}),
    savedAt: now,
  })
  session.updatedAt = now
  await putSession(branchId, month, session)
  return { status: 200, json: { ok: true, session, report: stop.report } }
}

async function hodReview(body: Record<string, unknown>, actor: NightVisitActor) {
  const branchId = await resolveBranch(body, actor)
  const month = monthYm(body.month)
  const list = await loadMonth(branchId, month)
  const session = findSession(list, s(body.sessionId, 40))
  if (!session) return { status: 404, json: { error: 'Schedule not found.' } }
  const stop = pickStop(session, s(body.stopId, 40))
  if (!stop?.report) return { status: 400, json: { error: 'Save the report first.' } }
  const now = new Date().toISOString()
  stop.report.hodApproved = body.approve !== false
  stop.report.hodApprovedAt = now
  stop.report.hodApprovedBy = actor.userName
  session.updatedAt = now
  await putSession(branchId, month, session)
  return { status: 200, json: { ok: true, report: stop.report } }
}

async function previewClient(body: Record<string, unknown>, actor: NightVisitActor) {
  const branchId = await resolveBranch(body, actor)
  const month = monthYm(body.month)
  const session = findSession(await loadMonth(branchId, month), s(body.sessionId, 40))
  if (!session) return { status: 404, json: { error: 'Schedule not found.' } }
  const stop = pickStop(session, s(body.stopId, 40))
  if (!stop) return { status: 404, json: { error: 'Client stop not found.' } }
  return { status: 200, json: { ok: true, preview: reportPreview(session, stop) } }
}

async function sendClient(body: Record<string, unknown>, actor: NightVisitActor) {
  const branchId = await resolveBranch(body, actor)
  const month = monthYm(body.month)
  const list = await loadMonth(branchId, month)
  const session = findSession(list, s(body.sessionId, 40))
  if (!session) return { status: 404, json: { error: 'Schedule not found.' } }
  const stop = pickStop(session, s(body.stopId, 40))
  if (!stop?.report) return { status: 400, json: { error: 'Save and Review the report first.' } }
  if (!stop.report.hodApproved) return { status: 400, json: { error: 'HOD Review first, then Send to client.' } }
  const to = parseEmails(stop.report.clientEmail || stop.clientEmail)
  if (!to.length) return { status: 400, json: { error: 'Enter the client email.' } }
  const cc = [LOKESH_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL].filter((e) => e.includes('@') && !to.includes(e))
  const branchName = (await getBranches(true)).find((b) => b.id === branchId)?.name || ''
  const html = reportHtml(session, stop, branchName)
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { status: 503, json: { error: 'Email service not configured.' } }
  const text = [
    `Dear Sir / Madam,`,
    ``,
    `Please find attached the Night Check Report for ${stop.clientName}.`,
    `Visit date: ${fmtDate(session.visitDate)}`,
    ``,
    `Regards,`,
    `Agile Security Force Pvt. Ltd.`,
    branchName,
  ].join('\n')
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    const result = await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      cc,
      subject: `Night Check Report — ${stop.clientName} — ${fmtDate(session.visitDate)}`,
      text,
      html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap;font-size:14px">${esc(text)}</div>`,
      attachments: [
        htmlToBase64Attachment(
          `Night_Check_${(stop.clientName || 'Client').replace(/[^\w\-]+/g, '_').slice(0, 40)}.html`,
          html,
        ),
      ],
      skipDirectorCc: true,
    })
    if ((result as { error?: { message?: string } }).error) {
      return {
        status: 502,
        json: {
          error: (result as { error?: { message?: string } }).error?.message || 'Could not send.',
        },
      }
    }
    const now = new Date().toISOString()
    stop.report.sentToClientAt = now
    stop.report.sentToClientBy = actor.userName
    session.updatedAt = now
    if (session.stops.every((st) => st.report?.sentToClientAt)) session.status = 'Completed'
    await putSession(branchId, month, session)
    return { status: 200, json: { ok: true, session } }
  } catch (err) {
    console.error('[nightVisitSendClient]', err)
    return { status: 502, json: { error: 'Could not send to client.' } }
  }
}

async function branches() {
  const list = (await getBranches(true)).filter((b) => b.active !== false)
  return { status: 200, json: { ok: true, branches: list.map((b) => ({ id: b.id, name: b.name })) } }
}

export async function handleNightVisitAction(
  action: string,
  body: Record<string, unknown>,
  actor: NightVisitActor,
) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  switch (action) {
    case 'nightVisitBoot':
      return boot(body, actor)
    case 'nightVisitBranches':
      return branches()
    case 'nightVisitSaveSession':
      return saveSession(body, actor)
    case 'nightVisitCancelSession':
      return cancelSession(body, actor)
    case 'nightVisitSaveRoute':
      return saveRoute(body, actor)
    case 'nightVisitPreviewWa':
      return previewWa(body, actor)
    case 'nightVisitSendWa':
      return sendWa(body, actor)
    case 'nightVisitAllotDuty':
      return allotDuty(body, actor)
    case 'nightVisitCancelAllotment':
      return cancelAllotment(body, actor)
    case 'nightVisitLoadReports':
      return loadReports(body, actor)
    case 'nightVisitSaveClientReport':
      return saveClientReport(body, actor)
    case 'nightVisitHodReview':
      return hodReview(body, actor)
    case 'nightVisitPreviewClient':
      return previewClient(body, actor)
    case 'nightVisitSendClient':
      return sendClient(body, actor)
    case 'nightVisitSiteReportList': {
      const branchId = await resolveBranch(body, actor)
      const all = actor.portal === 'mgmt' && isMgmtAllBranches(branchId)
      return handleSiteVisitList({
        branchId: all ? undefined : branchId === 'ALL' ? '' : branchId,
        allBranches: all,
      })
    }
    default:
      return null
  }
}

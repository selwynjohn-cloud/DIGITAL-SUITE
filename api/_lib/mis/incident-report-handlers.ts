/**
 * HOD Incident Reporting — staff-data actions.
 */
import { misTodayIst } from './dates.js'
import { suggestIncidentRecurrenceAvoidance } from './incident-report-ai.js'
import {
  buildIncidentReportLetterHtml,
  sendIncidentCloseReminder,
  sendIncidentDraftToDirector,
  sendIncidentReportSubmissionToDirector,
  sendIncidentReportToClient,
} from './incident-report-mail.js'
import {
  deleteIncidentAttachmentDataUrl,
  getIncidentReport,
  IR_MAX_DATA_URL_CHARS,
  IR_MAX_EVIDENCE,
  IR_MAX_PHOTOS,
  listIncidentReports,
  newIncidentReportId,
  nextIncidentRefNo,
  saveIncidentAttachmentDataUrl,
  upsertIncidentReport,
  type IncidentAttachmentKind,
  type IncidentAttachmentMeta,
  type MisIncidentReport,
} from './incident-report-store.js'
import { INCIDENT_CLOSE_HOURS, incidentSlaForReport, withIncidentSla } from './incident-report-sla.js'
import { getBranches, getClients, getUsers, misStorageOk } from './store.js'
import { clientBelongsToBranchForReporting, clientMatchesBranch, clientSiteText } from './client-branch.js'
import { resolveBranchFromSiteGeo } from './client-branch-geo-resolve.js'
import { LOKESH_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL } from './branch-mail-cc.js'

function s(v: unknown, n = 4000): string {
  return String(v ?? '').slice(0, n).trim()
}

async function assertClientBelongsToBranch(
  clientId: string,
  branchId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!clientId) return { ok: true }
  const branches = await getBranches(false)
  const all = await getClients(undefined, { skipRepair: true, branches })
  const hit = all.find((c) => c.id === clientId && c.active !== false)
  if (!hit) return { ok: true }
  if (!clientBelongsToBranchForReporting(hit, branchId, branches)) {
    const b = branches.find((x) => x.id === hit.branchId)
    const geoId = resolveBranchFromSiteGeo(clientSiteText(hit), branches)
    const geo = geoId ? branches.find((x) => x.id === geoId) : null
    return {
      ok: false,
      error: `${hit.name} belongs to ${geo?.name || b?.name || hit.branchId}, not this branch. Management has corrected the master list — refresh and pick the client again.`,
    }
  }
  return { ok: true }
}

function fromBody(
  body: Record<string, unknown>,
  prev: Partial<MisIncidentReport> | null,
  ctx: { branchId: string; branchName: string; email: string },
): MisIncidentReport {
  const now = new Date().toISOString()
  const id = s(body.id || prev?.id, 40) || newIncidentReportId()
  return {
    id,
    branchId: ctx.branchId,
    branchName: ctx.branchName,
    refNo: s(prev?.refNo || body.refNo, 40),
    reportDate: s(body.reportDate || prev?.reportDate || misTodayIst(), 12),
    incidentDate: s(body.incidentDate || prev?.incidentDate || misTodayIst(), 12),
    incidentTime: s(body.incidentTime || prev?.incidentTime, 40),
    informedToClientDate: s(
      body.informedToClientDate || prev?.informedToClientDate || misTodayIst(),
      12,
    ),
    informedToClientTime: s(body.informedToClientTime || prev?.informedToClientTime, 40),
    clientId: s(body.clientId || prev?.clientId, 40),
    clientName: s(body.clientName || prev?.clientName, 160),
    placeOfIncident: s(body.placeOfIncident || prev?.placeOfIncident, 200),
    typeOfIncident: s(body.typeOfIncident || prev?.typeOfIncident, 500),
    lossOfProperty: s(body.lossOfProperty || prev?.lossOfProperty || 'Nil', 500),
    sourceOfInfo: s(body.sourceOfInfo || prev?.sourceOfInfo, 500),
    personnelInvolved: s(body.personnelInvolved || prev?.personnelInvolved, 1000),
    inquiryOfficer: s(body.inquiryOfficer || prev?.inquiryOfficer, 200),
    briefDescription: s(body.briefDescription || prev?.briefDescription, 5000),
    suspectedPersons: s(body.suspectedPersons || prev?.suspectedPersons, 1000),
    findings: s(body.findings || prev?.findings, 5000),
    actionTaken: s(body.actionTaken || prev?.actionTaken, 5000),
    suggestion: s(body.suggestion || prev?.suggestion, 5000),
    aiSuggestion: s(body.aiSuggestion || prev?.aiSuggestion, 5000),
    photosNote: s(body.photosNote || prev?.photosNote, 1000),
    attachments: Array.isArray(prev?.attachments) ? prev!.attachments! : [],
    signName: s(body.signName || prev?.signName, 120),
    signDesignation: s(body.signDesignation || prev?.signDesignation, 120),
    signEmail: s(body.signEmail || prev?.signEmail || ctx.email, 120),
    clientEmail: s(body.clientEmail || prev?.clientEmail, 120),
    status: (prev?.status === 'submitted' ? 'submitted' : 'draft') as MisIncidentReport['status'],
    createdBy: prev?.createdBy || ctx.email,
    createdAt: prev?.createdAt || now,
    updatedAt: now,
    submittedAt: prev?.submittedAt,
    submittedTo: prev?.submittedTo,
    submittedCc: prev?.submittedCc,
    lastReminderAt: prev?.lastReminderAt,
    reminderCount: prev?.reminderCount,
    reopenedAt: prev?.reopenedAt,
    reopenedBy: prev?.reopenedBy,
  }
}

const ACTIONS = new Set([
  'listIncidentReports',
  'getIncidentReport',
  'saveIncidentReport',
  'previewIncidentReport',
  'submitIncidentReport',
  'uploadIncidentAttachment',
  'removeIncidentAttachment',
  'suggestIncidentRecurrence',
  'sendIncidentTestDraft',
  'remindIncidentClose',
  'reopenIncidentReport',
  'deleteIncidentReport',
  'moveIncidentReport',
])

export async function handleIncidentReportAction(
  action: string,
  body: Record<string, unknown>,
  ctx: { branchId: string; branchName: string; email: string; management?: boolean },
): Promise<{ status: number; json: Record<string, unknown> } | null> {
  if (!ACTIONS.has(action)) return null

  if (!misStorageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }

  const { branchId, branchName, email } = ctx

  if (action === 'listIncidentReports') {
    const branches = await getBranches(false)
    const [reports, clientsRaw] = await Promise.all([
      listIncidentReports(branchId),
      getClients(branchId, { skipRepair: true, branches }),
    ])
    const clients = clientsRaw.filter(
      (c) => c.active !== false && clientBelongsToBranchForReporting(c, branchId, branches),
    )
    return {
      status: 200,
      json: {
        ok: true,
        reports: reports.map((r) => withIncidentSla(r)),
        closeHours: INCIDENT_CLOSE_HOURS,
        today: misTodayIst(),
        branchName,
        maxPhotos: IR_MAX_PHOTOS,
        maxEvidence: IR_MAX_EVIDENCE,
        clients: clients.map((c) => ({ id: c.id, name: c.name, location: c.location })),
      },
    }
  }

  if (action === 'getIncidentReport') {
    const id = s(body.id, 40)
    if (!id) return { status: 400, json: { error: 'Report id required.' } }
    const report = await getIncidentReport(branchId, id)
    if (!report) return { status: 404, json: { error: 'Report not found.' } }
    return {
      status: 200,
      json: { ok: true, report: withIncidentSla(report), html: buildIncidentReportLetterHtml(report) },
    }
  }

  if (action === 'saveIncidentReport' || action === 'previewIncidentReport') {
    const id = s(body.id, 40)
    const prev = id ? await getIncidentReport(branchId, id) : null
    if (prev?.status === 'submitted' && action === 'saveIncidentReport') {
      return { status: 400, json: { error: 'Already submitted — open a new report to change details.' } }
    }
    const row = fromBody(body, prev, { branchId, branchName, email })
    if (!row.refNo) row.refNo = await nextIncidentRefNo()
    const clientCheck = await assertClientBelongsToBranch(row.clientId, branchId)
    if (!clientCheck.ok) return { status: 400, json: { error: clientCheck.error } }
    const { assertIncidentReportBranch } = await import('./incident-report-repair.js')
    const branchCheck = await assertIncidentReportBranch(row)
    if (!branchCheck.ok) return { status: 400, json: { error: branchCheck.error, suggestBranch: branchCheck.suggestBranch } }
    if (!row.placeOfIncident && row.clientName) {
      row.placeOfIncident = row.clientName
    }
    if (action === 'saveIncidentReport') {
      if (!row.typeOfIncident || !row.briefDescription) {
        return {
          status: 400,
          json: { error: 'Please enter Type of incident and Brief description.' },
        }
      }
      const ok = await upsertIncidentReport(row)
      if (!ok) return { status: 503, json: { error: 'Could not save report.' } }
    }
    return {
      status: 200,
      json: {
        ok: true,
        report: row,
        html: buildIncidentReportLetterHtml(row),
        saved: action === 'saveIncidentReport',
      },
    }
  }

  if (action === 'uploadIncidentAttachment') {
    let id = s(body.id, 40)
    let prev = id ? await getIncidentReport(branchId, id) : null
    if (prev?.status === 'submitted') {
      return { status: 400, json: { error: 'Already submitted — cannot add files.' } }
    }
    if (!prev) {
      const draft = fromBody(body, null, { branchId, branchName, email })
      if (!draft.typeOfIncident) draft.typeOfIncident = 'Incident (draft)'
      if (!draft.briefDescription) draft.briefDescription = 'Draft — details to be completed.'
      draft.refNo = await nextIncidentRefNo()
      await upsertIncidentReport(draft)
      prev = draft
      id = draft.id
    }
    const kind = (s(body.kind, 20) === 'evidence' ? 'evidence' : 'photo') as IncidentAttachmentKind
    const photos = (prev.attachments || []).filter((a) => a.kind === 'photo')
    const evidence = (prev.attachments || []).filter((a) => a.kind === 'evidence')
    if (kind === 'photo' && photos.length >= IR_MAX_PHOTOS) {
      return { status: 400, json: { error: `Maximum ${IR_MAX_PHOTOS} photos.` } }
    }
    if (kind === 'evidence' && evidence.length >= IR_MAX_EVIDENCE) {
      return { status: 400, json: { error: `Maximum ${IR_MAX_EVIDENCE} evidence documents.` } }
    }
    const dataUrl = String(body.dataUrl || '').trim()
    if (!dataUrl.startsWith('data:')) {
      return { status: 400, json: { error: 'Invalid file data.' } }
    }
    if (dataUrl.length > IR_MAX_DATA_URL_CHARS) {
      return { status: 400, json: { error: 'File too large — please compress or use a smaller PDF/photo.' } }
    }
    const docId = await saveIncidentAttachmentDataUrl(dataUrl)
    if (!docId) return { status: 503, json: { error: 'Could not store file.' } }
    const mime = /^data:([^;]+);/i.exec(dataUrl)?.[1] || 'application/octet-stream'
    const meta: IncidentAttachmentMeta = {
      id: docId,
      kind,
      filename: s(body.filename || (kind === 'photo' ? 'photo.jpg' : 'evidence.pdf'), 120) || 'file',
      contentType: s(body.contentType || mime, 80) || mime,
      label: s(body.label || body.filename || (kind === 'photo' ? 'Photo' : 'Evidence document'), 160),
    }
    const report: MisIncidentReport = {
      ...prev,
      attachments: [...(prev.attachments || []), meta],
      updatedAt: new Date().toISOString(),
    }
    await upsertIncidentReport(report)
    return { status: 200, json: { ok: true, report, attachment: meta } }
  }

  if (action === 'removeIncidentAttachment') {
    const id = s(body.id, 40)
    const attId = s(body.attachmentId, 40)
    if (!id || !attId) return { status: 400, json: { error: 'Report and attachment id required.' } }
    const prev = await getIncidentReport(branchId, id)
    if (!prev) return { status: 404, json: { error: 'Report not found.' } }
    if (prev.status === 'submitted') {
      return { status: 400, json: { error: 'Already submitted — cannot remove files.' } }
    }
    const report: MisIncidentReport = {
      ...prev,
      attachments: (prev.attachments || []).filter((a) => a.id !== attId),
      updatedAt: new Date().toISOString(),
    }
    await upsertIncidentReport(report)
    await deleteIncidentAttachmentDataUrl(attId)
    return { status: 200, json: { ok: true, report } }
  }

  if (action === 'suggestIncidentRecurrence') {
    const id = s(body.id, 40)
    const prev = id ? await getIncidentReport(branchId, id) : null
    const row = fromBody(body, prev, { branchId, branchName, email })
    if (!row.typeOfIncident && !row.briefDescription) {
      return {
        status: 400,
        json: { error: 'Enter Type of incident and Brief description first.' },
      }
    }
    const sug = await suggestIncidentRecurrenceAvoidance(row)
    if (!sug.ok) {
      return { status: 502, json: { error: 'error' in sug ? sug.error : 'Could not suggest.' } }
    }
    // Keep human Suggestion (section 12); system alerts go after human reporting.
    row.aiSuggestion = sug.suggestion
    if (!row.refNo) row.refNo = await nextIncidentRefNo()
    if (row.typeOfIncident && row.briefDescription) {
      await upsertIncidentReport(row)
    }
    return {
      status: 200,
      json: {
        ok: true,
        suggestion: row.suggestion,
        aiSuggestion: sug.suggestion,
        source: sug.source,
        report: row,
        message:
          sug.source === 'ai'
            ? 'System alerts added after your human suggestion — review before submit.'
            : 'Practical alerts added after your human suggestion — review before submit.',
      },
    }
  }

  if (action === 'sendIncidentTestDraft') {
    const id = s(body.id, 40)
    const prev = id ? await getIncidentReport(branchId, id) : null
    const row = fromBody(body, prev, { branchId, branchName, email })
    if (!row.refNo) row.refNo = await nextIncidentRefNo()
    if (!row.typeOfIncident) row.typeOfIncident = 'Test incident (sample)'
    if (!row.briefDescription) {
      row.briefDescription =
        'TEST DRAFT for Director review — sample Incident / Inquiry Report format (not a live client case).'
    }
    if (!row.placeOfIncident) row.placeOfIncident = row.clientName || 'Sample client site'
    if (!row.actionTaken) row.actionTaken = 'Sample action taken — for format review only.'
    if (!row.aiSuggestion) {
      const sug = await suggestIncidentRecurrenceAvoidance(row)
      if (sug.ok) row.aiSuggestion = sug.suggestion
    }
    if (!row.suggestion) {
      row.suggestion =
        'Human / branch suggestion to be completed by Inquiry Officer before live client send.'
    }
    if (!row.signName) row.signName = 'Operations (Test)'
    if (!row.signDesignation) row.signDesignation = 'Branch / HOD Portal'
    if (!row.signEmail) row.signEmail = email
    await upsertIncidentReport(row)
    const mail = await sendIncidentDraftToDirector(row)
    if (!mail.ok) return { status: 502, json: { error: mail.error || 'Could not send test draft.' } }
    return {
      status: 200,
      json: {
        ok: true,
        report: row,
        to: mail.to,
        message: `Test draft sent to ${mail.to}.`,
      },
    }
  }

  if (action === 'submitIncidentReport') {
    const id = s(body.id, 40)
    if (!id) return { status: 400, json: { error: 'Save the report first, then submit.' } }
    const prev = await getIncidentReport(branchId, id)
    if (!prev) return { status: 404, json: { error: 'Report not found. Save first.' } }
    if (prev.status === 'submitted') {
      return { status: 400, json: { error: 'This report was already sent to the client.' } }
    }
    const row = fromBody(body, prev, { branchId, branchName, email })
    row.refNo = prev.refNo || (await nextIncidentRefNo())
    row.attachments = prev.attachments || []
    const clientCheck = await assertClientBelongsToBranch(row.clientId, branchId)
    if (!clientCheck.ok) return { status: 400, json: { error: clientCheck.error } }
    const { assertIncidentReportBranch } = await import('./incident-report-repair.js')
    const branchCheck = await assertIncidentReportBranch(row)
    if (!branchCheck.ok) return { status: 400, json: { error: branchCheck.error, suggestBranch: branchCheck.suggestBranch } }
    if (!row.clientEmail.includes('@')) {
      return { status: 400, json: { error: 'Enter the client email address before submit.' } }
    }
    if (!row.typeOfIncident || !row.briefDescription || !row.actionTaken) {
      return {
        status: 400,
        json: {
          error: 'Type of incident, Brief description and Action Taken are required before submit.',
        },
      }
    }
    if (!row.incidentDate || !row.incidentTime) {
      return {
        status: 400,
        json: { error: 'Enter date and time of incident before submit.' },
      }
    }
    if (!row.informedToClientDate || !row.informedToClientTime) {
      return {
        status: 400,
        json: { error: 'Enter when the client was informed (date and time) before submit.' },
      }
    }
    const mail = await sendIncidentReportToClient(row)
    if (!mail.ok) return { status: 502, json: { error: mail.error || 'Could not send email.' } }
    const directorMail = await sendIncidentReportSubmissionToDirector(row, {
      clientTo: mail.to,
      clientCc: mail.cc,
    })
    row.status = 'submitted'
    row.submittedAt = new Date().toISOString()
    row.submittedTo = mail.to
    row.submittedCc = mail.cc
    row.updatedAt = row.submittedAt
    await upsertIncidentReport(row)
    return {
      status: 200,
      json: {
        ok: true,
        report: row,
        to: mail.to,
        cc: mail.cc,
        directorTo: directorMail.ok ? directorMail.to : undefined,
        directorMailError: directorMail.ok ? undefined : directorMail.error,
        message: directorMail.ok
          ? 'Incident report sent to client. Director notified by email.'
          : `Incident report sent to client. Director mail failed: ${directorMail.error || 'unknown error'}`,
      },
    }
  }

  if (action === 'reopenIncidentReport') {
    const id = s(body.id, 40)
    if (!id) return { status: 400, json: { error: 'Report id required.' } }
    const prev = await getIncidentReport(branchId, id)
    if (!prev) return { status: 404, json: { error: 'Report not found.' } }
    if (prev.status !== 'submitted') {
      return { status: 400, json: { error: 'Only closed (submitted) reports can be reopened.' } }
    }
    const now = new Date().toISOString()
    const row: MisIncidentReport = {
      ...prev,
      status: 'draft',
      submittedAt: undefined,
      submittedTo: undefined,
      submittedCc: undefined,
      reopenedAt: now,
      reopenedBy: email,
      updatedAt: now,
    }
    await upsertIncidentReport(row)
    return {
      status: 200,
      json: {
        ok: true,
        report: withIncidentSla(row),
        message: 'Reopened — HOD can edit and submit again.',
      },
    }
  }

  if (action === 'deleteIncidentReport') {
    if (!ctx.management) {
      return { status: 403, json: { error: 'Only Management can delete incident reports.' } }
    }
    const id = s(body.id, 40)
    if (!id) return { status: 400, json: { error: 'Report id required.' } }
    const prev = await getIncidentReport(branchId, id)
    if (!prev) return { status: 404, json: { error: 'Report not found.' } }
    const { deleteIncidentReport } = await import('./incident-report-store.js')
    const ok = await deleteIncidentReport(branchId, id)
    if (!ok) return { status: 503, json: { error: 'Could not delete report.' } }
    return {
      status: 200,
      json: {
        ok: true,
        message: `Deleted ${prev.refNo || 'incident report'} (${prev.typeOfIncident || prev.clientName || '—'}).`,
      },
    }
  }

  if (action === 'moveIncidentReport') {
    if (!ctx.management) {
      return { status: 403, json: { error: 'Only Management can move incident reports.' } }
    }
    const id = s(body.id, 40)
    const targetBranchId = s(body.targetBranchId, 40)
    if (!id || !targetBranchId) {
      return { status: 400, json: { error: 'Report id and target branch required.' } }
    }
    const prev = await getIncidentReport(branchId, id)
    if (!prev) return { status: 404, json: { error: 'Report not found.' } }
    if (targetBranchId === branchId) {
      return { status: 400, json: { error: 'Report is already on this branch.' } }
    }
    const branches = await getBranches(false)
    const target = branches.find((b) => b.id === targetBranchId)
    if (!target) return { status: 404, json: { error: 'Target branch not found.' } }
    const { moveIncidentReportToBranch } = await import('./incident-report-store.js')
    const moved = await moveIncidentReportToBranch(branchId, id, target)
    if (!moved) return { status: 503, json: { error: 'Could not move report.' } }
    return {
      status: 200,
      json: {
        ok: true,
        report: withIncidentSla(moved),
        message: `Moved ${prev.refNo || 'report'} to ${target.name}.`,
      },
    }
  }

  if (action === 'remindIncidentClose') {
    const id = s(body.id, 40)
    if (!id) return { status: 400, json: { error: 'Report id required.' } }
    const prev = await getIncidentReport(branchId, id)
    if (!prev) return { status: 404, json: { error: 'Report not found.' } }
    if (prev.status === 'submitted') {
      return { status: 400, json: { error: 'Already closed — use Reopen if the HOD must edit again.' } }
    }

    const users = await getUsers()
    const branchHods = users
      .filter((u) => u.active !== false && u.branchId === branchId && u.email.includes('@'))
      .map((u) => u.email.trim().toLowerCase())
    const created = String(prev.createdBy || '').trim().toLowerCase()
    const to = [...new Set([...branchHods, created].filter((e) => e.includes('@')))]
    const cc = [LOKESH_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL].filter(Boolean)

    const mail = await sendIncidentCloseReminder(prev, { to, cc, sentBy: email })
    if (!mail.ok) return { status: 502, json: { error: mail.error || 'Could not send reminder.' } }

    const now = new Date().toISOString()
    const row: MisIncidentReport = {
      ...prev,
      lastReminderAt: now,
      reminderCount: (prev.reminderCount || 0) + 1,
      updatedAt: now,
    }
    await upsertIncidentReport(row)
    return {
      status: 200,
      json: {
        ok: true,
        report: withIncidentSla(row),
        to: mail.to,
        message: `Reminder sent to ${(mail.to || []).join(', ')}.`,
      },
    }
  }

  return null
}

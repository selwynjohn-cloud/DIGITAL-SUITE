import { generateSurveyAiReport } from '../crm/survey-ai.js'
import {
  buildClientSurveyReportHtml,
  buildRiskAssessmentHtml,
  buildSiteInputsPhotosHtml,
  htmlToBase64Attachment,
} from '../crm/survey-report.js'
import { CONTRACT_START_STEPS, SURVEY_PARTS } from '../crm/survey-template.js'
import { MAX_SURVEY_PHOTOS, SECTORS } from '../crm/store.js'
import { pinMailFrom, resolveSuiteUserName, sendSuiteEmail } from '../suite-mail.js'
import { LOKESH_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL, SRIDHAR_M_CC_EMAIL } from './branch-mail-cc.js'
import { filterClientsForBranch } from './client-branch.js'
import { listPublicExternalClients, newPublicResumeCode, normPublicResumeCode, resolvePublicExternalClient } from './public-external-link.js'
import {
  emptyPeriodicalSurvey,
  getPeriodicalSurveyById,
  getPeriodicalSurveys,
  getPeriodicalSurveysForBranch,
  listPublicHdfcDraftsForBranch,
  loadPublicHdfcDraftByCode,
  loadPublicHdfcDraftByTriple,
  normalizeHdfcForm,
  normalizePeriodicalSurvey,
  savePeriodicalSurveys,
  savePublicHdfcDraft,
  upsertPeriodicalSurvey,
  storageOk,
  toCrmSurveyShape,
  buildHdfcQuestionnaireHtml,
  type MisPeriodicalSurvey,
  type MisPeriodicalSurveyStatus,
} from './periodical-survey-store.js'
import { hdfcPagesIncompleteMessage, hdfcPagesProgress } from './hdfc-page-progress.js'
import { buildSsaDirectory, rememberSsaBranchAssessor, ssaFixedHodEmailsForGroup } from './ssa-directory.js'
import { misBranchGroupKey } from './branch-group-key.js'
import { getBranches, getClients, getUsers, misStorageOk, nid, saveClientGeoFromAssessment } from './store.js'
import { dataUrlToAttachment } from './incident-report-store.js'
import { MIS_BRAND } from './brand.js'
import { refreshHdfcSsaBoardAi } from './hdfc-ssa-board-ai.js'
import {
  ensureHdfcSsaBoardViewCode,
  getHdfcSsaBoardAi,
  getHdfcSsaBoardView,
  viewCodesMatch,
} from './hdfc-ssa-board-store.js'
import { assembleHdfcSsaBoard } from './hdfc-ssa-board-risk.js'
import { indiaBoardKpis } from './hdfc-ssa-state.js'

function s(v: unknown, n = 4000): string {
  return String(v ?? '').slice(0, n)
}

function parseEmails(v: unknown): string[] {
  return String(v ?? '')
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@'))
}

function isLockedStatus(status: string): boolean {
  return status === 'Completed' || status === 'HodApproved' || status === 'Approved'
}

async function branchHodEmails(branchId: string): Promise<string[]> {
  const hodTo: string[] = []
  try {
    const [users, branches] = await Promise.all([getUsers(), getBranches(true)])
    const branch = branches.find((b) => b.id === branchId)
    const groupKey = branch ? misBranchGroupKey(branch.name) : ''
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
    hodTo.push(...ssaFixedHodEmailsForGroup(groupKey))
  } catch {
    /* optional */
  }
  return [...new Set(hodTo)]
}

function siblingIdsForBranch(
  branches: { id: string; name: string; active?: boolean }[],
  branchId: string,
): string[] {
  const self = branches.find((b) => b.id === branchId)
  const key = self ? misBranchGroupKey(self.name) : ''
  if (!key) return [branchId]
  return branches.filter((b) => b.active !== false && misBranchGroupKey(b.name) === key).map((b) => b.id)
}

function clientSanStrength(c: { sanA?: number; sanG?: number; sanB?: number; sanC?: number }): string {
  const parts: string[] = []
  if (Number(c.sanA)) parts.push(`A/Day: ${c.sanA}`)
  if (Number(c.sanG)) parts.push(`General: ${c.sanG}`)
  if (Number(c.sanB)) parts.push(`B: ${c.sanB}`)
  if (Number(c.sanC)) parts.push(`C/Night: ${c.sanC}`)
  return parts.join(' · ') || ''
}

export async function handlePeriodicalSurveyBoot(
  body: Record<string, unknown>,
  lockedBranchId?: string,
) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const branchFilter = lockedBranchId || s(body.branchId, 80) || undefined
  const [clientsRaw, branchesRaw, directory] = await Promise.all([
    getClients(branchFilter, { skipRepair: true }),
    getBranches(true),
    buildSsaDirectory(branchFilter),
  ])
  const siblingIds = branchFilter
    ? (() => {
        const self = (branchesRaw || []).find((b) => b.id === branchFilter)
        const key = self ? misBranchGroupKey(self.name) : ''
        if (!key) return [branchFilter]
        return (branchesRaw || [])
          .filter((b) => b.active !== false && misBranchGroupKey(b.name) === key)
          .map((b) => b.id)
      })()
    : []
  const surveysRaw = branchFilter
    ? await getPeriodicalSurveysForBranch(branchFilter, siblingIds)
    : await getPeriodicalSurveys()
  const surveys = branchFilter
    ? surveysRaw.map((sv) => (siblingIds.includes(sv.branchId) ? { ...sv, branchId: branchFilter } : sv))
    : surveysRaw
  const clients = clientsRaw
    .filter((c) => c.active !== false)
    .map((c) => ({
      id: c.id,
      branchId: c.branchId,
      name: c.name,
      location: c.location,
      staffName: c.staffName,
      sanctionedStrength: clientSanStrength(c),
    }))
  const opsTeam = directory.opsTeam
  const surveyTemplate = {
    parts: SURVEY_PARTS,
    contractStart: CONTRACT_START_STEPS,
    industries: SECTORS,
  }
  const branches = (branchesRaw || [])
    .filter((b) => b.active !== false)
    .filter((b) => !lockedBranchId || b.id === lockedBranchId)
    .map((b) => ({ id: b.id, name: b.name }))
  return {
    status: 200,
    json: {
      ok: true,
      surveys,
      clients,
      branches,
      surveyTemplate,
      industries: SECTORS,
      opsTeam,
      ssaDirectory: { operations: directory.operations, hods: directory.hods },
    },
  }
}

export async function handlePeriodicalSurveySave(
  body: Record<string, unknown>,
  userName: string,
  lockedBranchId?: string,
) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const incoming = Array.isArray(body.surveys) ? body.surveys : []
  const normalizedIncoming: MisPeriodicalSurvey[] = []
  for (const row of incoming.slice(0, 200)) {
    const raw = row as Partial<MisPeriodicalSurvey>
    const id = String(raw.id || nid('ps'))
    const branchId = lockedBranchId || String(raw.branchId ?? '').slice(0, 40)
    if (lockedBranchId && branchId !== lockedBranchId) {
      return { status: 403, json: { error: 'Cannot save surveys for another branch.' } }
    }
    const sv = normalizePeriodicalSurvey({ ...raw, id, branchId } as MisPeriodicalSurvey)
    sv.updatedAt = new Date().toISOString()
    if (userName) sv.surveyedBy = sv.surveyedBy || userName.slice(0, 120)
    normalizedIncoming.push(sv)
    void rememberSsaBranchAssessor({
      branchId: sv.branchId,
      name: sv.surveyedBy,
      email: sv.surveyorEmail,
      mobile: sv.surveyorWhatsApp,
    })
  }

  const existing = await getPeriodicalSurveys()
  if (!lockedBranchId) {
    return { status: 403, json: { error: 'Management reviews surveys. HOD / Staff submit them.' } }
  }

  const others = existing.filter((sv) => sv.branchId !== lockedBranchId)
  const existingBranch = existing.filter((sv) => sv.branchId === lockedBranchId)
  const incomingIds = new Set(normalizedIncoming.map((row) => row.id))
  const locked = new Map(
    existingBranch.filter((sv) => isLockedStatus(sv.status)).map((sv) => [sv.id, sv]),
  )
  const nextBranch: MisPeriodicalSurvey[] = []
  for (const sv of existingBranch) {
    if (locked.has(sv.id)) nextBranch.push(sv)
    else if (
      sv.periodLabel === 'PUBLIC_HDFC_LINK' &&
      sv.status === 'Draft' &&
      !incomingIds.has(sv.id)
    ) {
      nextBranch.push(sv)
    }
  }
  for (const sv of normalizedIncoming.filter((row) => row.branchId === lockedBranchId)) {
    if (locked.has(sv.id)) continue
    sv.status = 'Draft'
    nextBranch.push(sv)
  }

  const merged = [...others, ...nextBranch]

  const ok = await savePeriodicalSurveys(merged)
  if (!ok) return { status: 503, json: { error: 'Could not save surveys.' } }
  const branchFilter = lockedBranchId
  const surveys = branchFilter ? merged.filter((sv) => sv.branchId === branchFilter) : merged
  return { status: 200, json: { ok: true, surveys } }
}

export async function handlePeriodicalSurveySubmit(
  body: Record<string, unknown>,
  userName: string,
  actorEmail: string,
  lockedBranchId?: string,
) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  if (!lockedBranchId) {
    return { status: 403, json: { error: 'Only the branch HOD can submit a Site Security Assessment (SSA).' } }
  }
  const survey = (body.survey ?? {}) as Record<string, unknown>
  const id = s(survey.id, 40)
  if (!id) return { status: 400, json: { error: 'Save the survey first.' } }
  const incoming = normalizePeriodicalSurvey({
    ...(survey as object),
    id,
    branchId: lockedBranchId,
  } as MisPeriodicalSurvey)
  if (!incoming.company.trim()) {
    return { status: 400, json: { error: 'Pick a client / company before submitting.' } }
  }
  if (!incoming.industry.trim()) {
    return { status: 400, json: { error: 'Select Industry Type before Send for approval.' } }
  }
  const isHdfc = incoming.surveyKind === 'hdfc'
  if (!isHdfc && !incoming.hodSuggestions.trim()) {
    return { status: 400, json: { error: 'Enter HOD suggestions before Send for approval.' } }
  }
  const existing = await getPeriodicalSurveys()
  const prev = existing.find((x) => x.id === id)
  if (prev && prev.branchId && prev.branchId !== lockedBranchId) {
    return { status: 403, json: { error: 'Cannot submit surveys for another branch.' } }
  }
  if (prev && (prev.status === 'Approved' || (isHdfc && prev.status === 'HodApproved'))) {
    return {
      status: 400,
      json: {
        error: isHdfc
          ? 'Already with HOD / Director approval. Ask Management to Reopen if you must edit.'
          : 'Already approved. Ask Management to Reopen if you must edit.',
      },
    }
  }
  // Auto-generate system suggestion if HOD has not run it yet
  let systemSuggestions = incoming.systemSuggestions
  if (!isHdfc && !systemSuggestions.trim()) {
    const crmShape = toCrmSurveyShape(incoming)
    const report = await generateSurveyAiReport({
      company: incoming.company,
      locationName: incoming.locationName || incoming.address || '',
      address: incoming.address,
      natureOfBusiness: incoming.natureOfBusiness,
      surveyDate: incoming.surveyDate,
      surveyedBy: incoming.surveyedBy,
      scores: incoming.scores,
      scoreNotes: incoming.scoreNotes,
      siteInputs: crmShape.siteInputs,
      siteObservations: incoming.siteObservations,
      deploymentPlan: incoming.deploymentPlan,
      industry: incoming.industry === 'Other' ? incoming.industryOther || 'Other' : incoming.industry,
      hodSuggestions: incoming.hodSuggestions,
    })
    systemSuggestions = report.systemSuggestions
  }
  const now = new Date().toISOString()
  const sv: MisPeriodicalSurvey = {
    ...incoming,
    systemSuggestions,
    status: 'Completed',
    submittedAt: now,
    submittedBy: (userName || actorEmail).slice(0, 120),
    surveyorEmail: incoming.surveyorEmail || actorEmail.trim().toLowerCase().slice(0, 120),
    surveyedBy: incoming.surveyedBy || userName.slice(0, 120),
    reassessmentAt: '',
    reassessmentBy: '',
    reassessmentNote: '',
    updatedAt: now,
  }
  const idx = existing.findIndex((x) => x.id === id)
  const merged = idx >= 0 ? existing.map((x, i) => (i === idx ? sv : x)) : [sv, ...existing]
  const ok = await savePeriodicalSurveys(merged)
  if (!ok) return { status: 503, json: { error: 'Could not submit survey.' } }
  void rememberSsaBranchAssessor({
    branchId: sv.branchId,
    name: sv.surveyedBy,
    email: sv.surveyorEmail,
    mobile: sv.surveyorWhatsApp,
  })
  return {
    status: 200,
    json: {
      ok: true,
      survey: sv,
      surveys: merged.filter((x) => x.branchId === lockedBranchId),
    },
  }
}

export async function handlePeriodicalSurveyRemind(
  body: Record<string, unknown>,
  actorEmail: string,
) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const surveyId = s(body.surveyId, 40)
  const surveys = await getPeriodicalSurveys()
  let sv = surveyId ? surveys.find((x) => x.id === surveyId) : null
  if (!sv) return { status: 404, json: { error: 'Survey not found.' } }
  if (sv.status === 'Approved') {
    return { status: 400, json: { error: 'Already approved. Reopen if HOD must edit again.' } }
  }
  // Optional: save Management review note before sending reminder
  const note = s(body.mgmtSuggestionsNote ?? body.note, 4000)
  if (note) {
    sv = { ...sv, mgmtSuggestionsNote: note, updatedAt: new Date().toISOString() }
  }
  const hodTo = await branchHodEmails(sv.branchId)
  const surveyor = (sv.surveyorEmail || '').trim().toLowerCase()
  const to = [...new Set([surveyor, ...hodTo].filter((e) => e.includes('@')))]
  if (!to.length) to.push(MIS_DIRECTOR_CC_EMAIL.toLowerCase())
  const cc = [
    ...new Set(
      [LOKESH_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL]
        .map((e) => e.toLowerCase())
        .filter((e) => e.includes('@') && !to.includes(e)),
    ),
  ]
  const branchName =
    (await getBranches(true)).find((b) => b.id === sv.branchId)?.name || sv.branchId || '—'
  const actionLine =
    sv.status === 'Draft'
      ? `Management reminder: please complete the Site Security Assessment (SSA) and tap Send for approval.`
      : `Management reminder with suggestion: please review Management notes and complete any pending action on this Site Security Assessment (SSA).`
  const text = [
    `Dear Team,`,
    ``,
    actionLine,
    ``,
    `Client / Site: ${sv.company || '—'}`,
    `Location: ${sv.locationName || sv.address || '—'}`,
    `Industry: ${sv.industry || '—'}${sv.industry === 'Other' && sv.industryOther ? ` (${sv.industryOther})` : ''}`,
    `Period: ${sv.periodLabel || '—'}`,
    `Survey date: ${sv.surveyDate || '—'}`,
    `Branch: ${branchName}`,
    `Status: ${sv.status === 'Draft' ? 'Draft' : 'Sent for approval'}`,
    ``,
    `--- HOD suggestions ---`,
    sv.hodSuggestions?.trim() || '—',
    ``,
    `--- System suggestion ---`,
    sv.systemSuggestions?.trim() || '—',
    ``,
    `--- Management review / suggestion ---`,
    sv.mgmtSuggestionsNote?.trim() || '—',
    ``,
    `Open Agile MIS → HOD portal → Site Security Assessment (SSA) for this client.`,
    ``,
    `Reminder sent by: ${actorEmail}`,
    ``,
    `Regards,`,
    `Agile MIS — Site Security Assessment (SSA)`,
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
      subject: `[Reminder with suggestion] Site Security Assessment (SSA) — ${sv.company || 'Site'}`,
      text,
      html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap;font-size:14px;color:#111">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`,
      skipDirectorCc: true,
    })
    if ((result as { error?: { message?: string } }).error) {
      return {
        status: 502,
        json: {
          error:
            (result as { error?: { message?: string } }).error?.message || 'Could not send reminder.',
        },
      }
    }
    const now = new Date().toISOString()
    const next = {
      ...sv,
      lastReminderAt: now,
      reminderCount: (sv.reminderCount || 0) + 1,
      updatedAt: now,
    }
    const idx = surveys.findIndex((x) => x.id === sv!.id)
    if (idx >= 0) surveys[idx] = next
    await savePeriodicalSurveys(surveys)
    return { status: 200, json: { ok: true, survey: next, to, cc } }
  } catch (err) {
    console.error('[periodicalSurveyRemind]', err)
    return { status: 502, json: { error: 'Could not send reminder.' } }
  }
}

export async function handlePeriodicalSurveyReopen(
  body: Record<string, unknown>,
  actorEmail: string,
) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const surveyId = s(body.surveyId, 40)
  const surveys = await getPeriodicalSurveys()
  const sv = surveyId ? surveys.find((x) => x.id === surveyId) : null
  if (!sv) return { status: 404, json: { error: 'Survey not found.' } }
  if (sv.status === 'Draft') {
    return { status: 400, json: { error: 'This survey is already open for the HOD to edit.' } }
  }
  const now = new Date().toISOString()
  const next: MisPeriodicalSurvey = {
    ...sv,
    status: 'Draft',
    approvedAt: '',
    approvedBy: '',
    approvedByEmail: '',
    hodApprovedAt: '',
    hodApprovedBy: '',
    forwardedForApprovalAt: '',
    forwardedForApprovalBy: '',
    sentToClientAt: '',
    sentToClientBy: '',
    sentToClientTo: '',
    sentToClientCc: '',
    mgmtSuggestionsReviewedAt: '',
    mgmtSuggestionsReviewedBy: '',
    mgmtSuggestionsNote: '',
    reopenedAt: now,
    reopenedBy: actorEmail.trim().toLowerCase().slice(0, 120),
    updatedAt: now,
  }
  const idx = surveys.findIndex((x) => x.id === sv.id)
  if (idx >= 0) surveys[idx] = next
  const ok = await savePeriodicalSurveys(surveys)
  if (!ok) return { status: 503, json: { error: 'Could not reopen survey.' } }
  return { status: 200, json: { ok: true, survey: next, surveys } }
}

/** Management only — permanently delete a survey (test / wrong entry). */
export async function handlePeriodicalSurveyDelete(
  body: Record<string, unknown>,
  actorEmail: string,
  lockedBranchId?: string,
) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  if (lockedBranchId) {
    return { status: 403, json: { error: 'Only Management can delete surveys.' } }
  }
  const surveyId = s(body.surveyId, 40)
  if (!surveyId) return { status: 400, json: { error: 'Survey id required.' } }
  const surveys = await getPeriodicalSurveys()
  const sv = surveys.find((x) => x.id === surveyId)
  if (!sv) return { status: 404, json: { error: 'Survey not found.' } }
  const next = surveys.filter((x) => x.id !== surveyId)
  const ok = await savePeriodicalSurveys(next)
  if (!ok) return { status: 503, json: { error: 'Could not delete survey.' } }
  console.info(
    '[periodicalSurveyDelete]',
    surveyId,
    sv.company || '',
    sv.surveyKind || '',
    actorEmail.trim().toLowerCase().slice(0, 120),
  )
  return { status: 200, json: { ok: true, deletedId: surveyId, surveys: next } }
}

/** HDFC: HOD approval after Send to HOD (Completed → HodApproved). */
export async function handlePeriodicalSurveyHodApprove(
  body: Record<string, unknown>,
  userName: string,
  actorEmail: string,
  lockedBranchId?: string,
) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  if (!lockedBranchId) {
    return { status: 403, json: { error: 'Only the branch HOD can give HOD approval on HDFC surveys.' } }
  }
  const surveyId = s(body.surveyId, 40)
  const surveys = await getPeriodicalSurveys()
  const sv = surveyId ? surveys.find((x) => x.id === surveyId) : null
  if (!sv) return { status: 404, json: { error: 'Survey not found.' } }
  if (sv.branchId !== lockedBranchId) {
    return { status: 403, json: { error: 'Cannot approve surveys for another branch.' } }
  }
  if (sv.surveyKind !== 'hdfc') {
    return { status: 400, json: { error: 'HOD approval step is for HDFC surveys. Use Send for approval for standard surveys.' } }
  }
  if (sv.status !== 'Completed') {
    return {
      status: 400,
      json: { error: 'Save and Send to HOD first, then tap HOD’s approval.' },
    }
  }
  const now = new Date().toISOString()
  const next: MisPeriodicalSurvey = {
    ...sv,
    status: 'HodApproved',
    hodApprovedAt: now,
    hodApprovedBy: (userName || actorEmail).slice(0, 120),
    updatedAt: now,
  }
  const idx = surveys.findIndex((x) => x.id === sv.id)
  if (idx >= 0) surveys[idx] = next
  const ok = await savePeriodicalSurveys(surveys)
  if (!ok) return { status: 503, json: { error: 'Could not save HOD approval.' } }
  return {
    status: 200,
    json: { ok: true, survey: next, surveys: surveys.filter((x) => x.branchId === lockedBranchId) },
  }
}

/** HDFC: Forward for approval — appears on Management for Review / Director Approval. */
export async function handlePeriodicalSurveyForwardApproval(
  body: Record<string, unknown>,
  userName: string,
  actorEmail: string,
  lockedBranchId?: string,
) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  if (!lockedBranchId) {
    return { status: 403, json: { error: 'Only the branch portal can Forward for approval.' } }
  }
  const surveyId = s(body.surveyId, 40)
  const surveys = await getPeriodicalSurveys()
  const sv = surveyId ? surveys.find((x) => x.id === surveyId) : null
  if (!sv) return { status: 404, json: { error: 'Survey not found.' } }
  if (sv.branchId !== lockedBranchId) {
    return { status: 403, json: { error: 'Cannot forward surveys for another branch.' } }
  }
  if (sv.surveyKind !== 'hdfc') {
    return { status: 400, json: { error: 'Forward for approval is for HDFC surveys.' } }
  }
  if (sv.status === 'Approved') {
    return { status: 400, json: { error: 'Already approved. Reopen if you need to change it.' } }
  }
  if (sv.status === 'HodApproved' && sv.forwardedForApprovalAt) {
    return { status: 400, json: { error: 'Already forwarded — Management can Review / Director Approval.' } }
  }
  if (!(sv.company || '').trim()) {
    return { status: 400, json: { error: 'Pick HDFC client first, Save, then Forward for approval.' } }
  }
  const pages = hdfcPagesProgress(sv)
  if (!pages.complete) {
    return {
      status: 400,
      json: { error: hdfcPagesIncompleteMessage(sv) || `Pages completed: ${pages.label}. All 15 pages are required.` },
    }
  }
  const now = new Date().toISOString()
  const by = (userName || actorEmail).slice(0, 120)
  const next: MisPeriodicalSurvey = {
    ...sv,
    status: 'HodApproved',
    submittedAt: sv.submittedAt || now,
    submittedBy: sv.submittedBy || by,
    forwardedForApprovalAt: now,
    forwardedForApprovalBy: by,
    hodApprovedAt: sv.hodApprovedAt || now,
    hodApprovedBy: sv.hodApprovedBy || `Forwarded · ${by}`.slice(0, 120),
    updatedAt: now,
  }
  const idx = surveys.findIndex((x) => x.id === sv.id)
  if (idx >= 0) surveys[idx] = next
  const ok = await savePeriodicalSurveys(surveys)
  if (!ok) return { status: 503, json: { error: 'Could not forward for approval.' } }
  return {
    status: 200,
    json: { ok: true, survey: next, surveys: surveys.filter((x) => x.branchId === lockedBranchId) },
  }
}

function nameKey(n: string) {
  return String(n || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/** HDFC: HOD/Management asks staff to re-do SSA — Draft again (progress drops) + message to concerned staff. */
export async function handlePeriodicalSurveyReassessment(
  body: Record<string, unknown>,
  userName: string,
  actorEmail: string,
  lockedBranchId?: string,
) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const surveyId = s(body.surveyId, 40)
  const note = s(body.note, 1000).trim()
  const surveys = await getPeriodicalSurveys()
  const sv = surveyId ? surveys.find((x) => x.id === surveyId) : null
  if (!sv) return { status: 404, json: { error: 'Survey not found.' } }
  if (lockedBranchId && sv.branchId !== lockedBranchId) {
    return { status: 403, json: { error: 'Cannot request re-assessment for another branch.' } }
  }
  if (sv.surveyKind !== 'hdfc') {
    return { status: 400, json: { error: 'Re-assessment is for HDFC SSA only.' } }
  }
  if (sv.status === 'Draft' && sv.reassessmentAt) {
    return {
      status: 400,
      json: { error: 'Already marked for Re-assessment. Staff must re-submit, then progress will count again.' },
    }
  }
  if (sv.status === 'Draft') {
    return { status: 400, json: { error: 'This is still a Draft — ask staff to complete and Submit first.' } }
  }
  const now = new Date().toISOString()
  const by = (userName || actorEmail).slice(0, 120)
  const next: MisPeriodicalSurvey = {
    ...sv,
    status: 'Draft',
    submittedAt: '',
    submittedBy: '',
    approvedAt: '',
    approvedBy: '',
    approvedByEmail: '',
    hodApprovedAt: '',
    hodApprovedBy: '',
    forwardedForApprovalAt: '',
    forwardedForApprovalBy: '',
    sentToClientAt: '',
    sentToClientBy: '',
    sentToClientTo: '',
    sentToClientCc: '',
    mgmtSuggestionsReviewedAt: '',
    mgmtSuggestionsReviewedBy: '',
    mgmtSuggestionsNote: '',
    reassessmentAt: now,
    reassessmentBy: by,
    reassessmentNote: note,
    updatedAt: now,
  }
  const idx = surveys.findIndex((x) => x.id === sv.id)
  if (idx >= 0) surveys[idx] = next
  const ok = await savePeriodicalSurveys(surveys)
  if (!ok) return { status: 503, json: { error: 'Could not mark Re-assessment.' } }

  const branchName =
    (await getBranches(true)).find((b) => b.id === sv.branchId)?.name || sv.branchId || '—'
  const staffName = String(sv.surveyedBy || sv.submittedBy || sv.hdfcForm?.surveyedBy || '').trim()
  const users = await getUsers()
  const staffKey = nameKey(staffName)
  const matched = users.filter((u) => {
    if (u.active === false) return false
    if (sv.branchId && u.branchId && u.branchId !== sv.branchId) return false
    return staffKey && nameKey(u.name) === staffKey
  })
  const loose =
    matched.length > 0
      ? matched
      : users.filter((u) => {
          if (u.active === false || !staffKey) return false
          return nameKey(u.name) === staffKey
        })

  const msgLines = [
    `*HDFC SSA — Re-assessment required*`,
    ``,
    `Dear ${staffName || 'Team'},`,
    ``,
    `HOD / Management has asked for a *Re-assessment* of this HDFC Site Security Assessment.`,
    ``,
    `*HDFC / Site:* ${sv.company || '—'}`,
    `*Location:* ${sv.locationName || sv.address || '—'}`,
    `*Branch:* ${branchName}`,
    note ? `*Note:* ${note}` : '',
    ``,
    `Please open the public HDFC SSA link (or MIS), complete the assessment again, and Submit.`,
    `Branch progress has been reduced until the re-assessment is submitted.`,
    ``,
    `Requested by: ${by}`,
    `— Agile MIS · Site Security Assessment (SSA)`,
  ].filter(Boolean)
  const waText = msgLines.join('\n')
  const mailText = msgLines.join('\n').replace(/\*/g, '')

  const notify: { whatsapp: string[]; email: string[]; errors: string[] } = {
    whatsapp: [],
    email: [],
    errors: [],
  }

  try {
    const { whatsappMobile } = await import('./complaint-mail.js')
    const { waSendText, whatsappConfigured } = await import('../pulse/whatsapp.js')
    if (whatsappConfigured()) {
      for (const u of loose) {
        const m = whatsappMobile(u.phone || '')
        if (m.length < 12) continue
        const r = await waSendText(m, waText)
        if (r?.ok) notify.whatsapp.push(m)
        else notify.errors.push(`WhatsApp ${u.name}: failed`)
      }
    } else {
      notify.errors.push('WhatsApp not configured on server')
    }
  } catch (e) {
    notify.errors.push(`WhatsApp: ${e instanceof Error ? e.message : 'failed'}`)
  }

  const toEmails = [
    ...new Set(
      loose
        .map((u) => String(u.email || '').trim().toLowerCase())
        .filter((e) => e.includes('@')),
    ),
  ]
  if (sv.surveyorEmail?.includes('@')) {
    const e = sv.surveyorEmail.trim().toLowerCase()
    if (!toEmails.includes(e)) toEmails.push(e)
  }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (toEmails.length && apiKey) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(apiKey)
      const result = await sendSuiteEmail(resend, {
        from: pinMailFrom(),
        to: toEmails,
        cc: [actorEmail].filter((e) => e.includes('@') && !toEmails.includes(e.toLowerCase())),
        subject: `[Re-assessment] HDFC SSA — ${sv.company || 'Site'} (${branchName})`,
        text: mailText,
        html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap;font-size:14px;color:#111">${mailText
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')}</div>`,
        skipDirectorCc: true,
      })
      if ((result as { error?: { message?: string } }).error) {
        notify.errors.push(
          (result as { error?: { message?: string } }).error?.message || 'Email failed',
        )
      } else {
        notify.email = toEmails
      }
    } catch (e) {
      notify.errors.push(`Email: ${e instanceof Error ? e.message : 'failed'}`)
    }
  } else if (!toEmails.length) {
    notify.errors.push(
      staffName
        ? `No email/phone found in Master Directory for "${staffName}". Re-assessment is saved; please inform them separately.`
        : 'No Submitted By name on this survey — inform the staff separately.',
    )
  }

  const scoped = lockedBranchId
    ? surveys.filter((x) => x.branchId === lockedBranchId)
    : surveys
  return {
    status: 200,
    json: {
      ok: true,
      survey: next,
      surveys: scoped,
      notify,
      message:
        notify.whatsapp.length || notify.email.length
          ? 'Re-assessment marked. Message sent to concerned staff. Branch progress reduced.'
          : 'Re-assessment marked and progress reduced. Could not auto-message staff — see notify errors.',
    },
  }
}

export async function handlePeriodicalSurveyGenerateAi(body: Record<string, unknown>) {
  const survey = (body.survey ?? {}) as Record<string, unknown>
  const sv = normalizePeriodicalSurvey({
    ...(survey as object),
    id: s(survey.id, 40) || nid('ps'),
  } as MisPeriodicalSurvey)
  const crmShape = toCrmSurveyShape(sv)
  const siteInputs = crmShape.siteInputs
  const scores = (survey.scores ?? {}) as Record<string, number>
  const scoreNotes = (survey.scoreNotes ?? {}) as Record<string, string>
  const periodCtx = sv.periodLabel ? ` · Period: ${sv.periodLabel}` : ''
  const prevCtx = sv.previousSurveyDate ? ` · Previous survey: ${sv.previousSurveyDate}` : ''
  const report = await generateSurveyAiReport({
    company: `${sv.company}${periodCtx}`,
    locationName: `${sv.locationName || sv.address || ''}${prevCtx}`,
    address: s(survey.address, 400),
    natureOfBusiness: s(survey.natureOfBusiness, 300),
    surveyDate: s(survey.surveyDate, 20),
    surveyedBy: s(survey.surveyedBy, 120),
    scores,
    scoreNotes,
    siteInputs,
    siteObservations: s(survey.siteObservations, 2000),
    deploymentPlan: s(survey.deploymentPlan, 4000),
    industry:
      sv.industry === 'Other'
        ? s(survey.industryOther, 200) || 'Other'
        : s(survey.industry || sv.industry, 80),
    hodSuggestions: s(survey.hodSuggestions || sv.hodSuggestions, 8000),
  })
  return { status: 200, json: { ok: true, ...report } }
}

/** Management Step I — Review Suggestions (before Director Approve). */
export async function handlePeriodicalSurveyReviewSuggestions(
  body: Record<string, unknown>,
  actorEmail: string,
  actorName: string,
  lockedBranchId?: string,
) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  if (lockedBranchId) {
    return { status: 403, json: { error: 'Only Management can complete Review Suggestions.' } }
  }
  const surveyId = s(body.surveyId, 40)
  const surveys = await getPeriodicalSurveys()
  const sv = surveyId ? surveys.find((x) => x.id === surveyId) : null
  if (!sv) return { status: 404, json: { error: 'Survey not found.' } }
  if (sv.status !== 'Completed' && sv.status !== 'HodApproved') {
    return {
      status: 400,
      json: { error: 'HOD must Send for approval (or HOD-approve HDFC) before Management Review Suggestions.' },
    }
  }
  const senderName = (await resolveSuiteUserName(actorEmail)) || actorName || actorEmail
  const now = new Date().toISOString()
  const next: MisPeriodicalSurvey = {
    ...sv,
    mgmtSuggestionsNote: s(body.mgmtSuggestionsNote ?? body.note, 4000) || sv.mgmtSuggestionsNote,
    mgmtSuggestionsReviewedAt: now,
    mgmtSuggestionsReviewedBy: senderName.slice(0, 120),
    updatedAt: now,
  }
  const idx = surveys.findIndex((x) => x.id === sv.id)
  if (idx >= 0) surveys[idx] = next
  const ok = await savePeriodicalSurveys(surveys)
  if (!ok) return { status: 503, json: { error: 'Could not save Review Suggestions.' } }
  return { status: 200, json: { ok: true, survey: next, surveys } }
}

/** Review → Approved — email Surveyor + Branch HODs (same idea as CRM). */
export async function handlePeriodicalSurveyApprove(
  body: Record<string, unknown>,
  actorEmail: string,
  actorName: string,
  lockedBranchId?: string,
) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const surveyId = s(body.surveyId, 40)
  let surveys = await getPeriodicalSurveys()
  let sv = surveyId ? surveys.find((x) => x.id === surveyId) || null : null
  if (!sv && body.survey && typeof body.survey === 'object') {
    sv = normalizePeriodicalSurvey({
      ...(body.survey as object),
      id: s((body.survey as { id?: string }).id, 40) || nid('ps'),
    } as MisPeriodicalSurvey)
  }
  if (!sv) return { status: 404, json: { error: 'Survey not found. Save the survey first.' } }
  if (lockedBranchId) {
    return { status: 403, json: { error: 'Only Management can approve after review.' } }
  }
  const isHdfc = sv.surveyKind === 'hdfc'
  if (isHdfc) {
    if (sv.status !== 'HodApproved' && sv.status !== 'Completed') {
      return {
        status: 400,
        json: {
          error:
            'HDFC survey must be Sent to HOD or Forwarded for approval first. Then Director Approval.',
        },
      }
    }
  } else if (sv.status !== 'Completed') {
    return { status: 400, json: { error: 'HOD must Send for approval before Director can approve.' } }
  }
  if (!isHdfc && !sv.mgmtSuggestionsReviewedAt) {
    return {
      status: 400,
      json: {
        error: 'Tap Save review first, then Approved.',
      },
    }
  }

  const senderName = (await resolveSuiteUserName(actorEmail)) || actorName || actorEmail
  const now = new Date().toISOString()
  sv = {
    ...sv,
    status: 'Approved',
    approvedAt: now,
    approvedBy: senderName.slice(0, 120),
    approvedByEmail: actorEmail.trim().toLowerCase().slice(0, 120),
    updatedAt: now,
  }
  const idx = surveys.findIndex((x) => x.id === sv!.id)
  if (idx >= 0) surveys[idx] = sv
  else surveys = [sv, ...surveys]
  const ok = await savePeriodicalSurveys(surveys)
  if (!ok) return { status: 503, json: { error: 'Could not save approval.' } }

  const hodTo = await branchHodEmails(sv.branchId)
  const surveyor = (sv.surveyorEmail || '').trim().toLowerCase()
  const to = [...new Set([surveyor, ...hodTo].filter((e) => e.includes('@')))]
  if (!to.length) to.push(MIS_DIRECTOR_CC_EMAIL.toLowerCase())
  const cc = [
    ...new Set(
      [LOKESH_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL]
        .map((e) => e.toLowerCase())
        .filter((e) => e.includes('@') && !to.includes(e)),
    ),
  ]
  const branchName =
    (await getBranches(true)).find((b) => b.id === sv!.branchId)?.name || sv.branchId || '—'
  const text = [
    `Dear Team,`,
    ``,
    `The Periodical Security Survey has been APPROVED after review.`,
    ``,
    `Client / Site: ${sv.company || '—'}`,
    `Location: ${sv.locationName || sv.address || '—'}`,
    `Industry: ${sv.industry || '—'}`,
    `Period: ${sv.periodLabel || '—'}`,
    `Survey date: ${sv.surveyDate || '—'}`,
    `Surveyed by: ${sv.surveyedBy || '—'}`,
    `Surveyor email: ${surveyor || '—'}`,
    `Branch: ${branchName}`,
    ``,
    `Approved by: ${sv.approvedBy} (${sv.approvedByEmail})`,
    `Approved at: ${sv.approvedAt}`,
    ``,
    `Please proceed with client share / corrective actions as applicable.`,
    ``,
    `Regards,`,
    `Agile MIS — Security Survey Format`,
  ].join('\n')

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return {
      status: 503,
      json: { error: 'Approved saved, but email service not configured.', survey: sv, to, cc },
    }
  }
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    const result = await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      cc,
      subject: `Security Survey APPROVED — ${sv.company || 'Site'}`,
      text,
      html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap;font-size:14px;color:#111">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`,
      skipDirectorCc: true,
    })
    if ((result as { error?: { message?: string } }).error) {
      return {
        status: 502,
        json: {
          error:
            (result as { error?: { message?: string } }).error?.message ||
            'Approved saved, but email failed.',
          survey: sv,
          to,
          cc,
        },
      }
    }
    return { status: 200, json: { ok: true, survey: sv, to, cc } }
  } catch (err) {
    console.error('[periodicalSurveyApprove]', err)
    return {
      status: 502,
      json: { error: 'Approved saved, but email failed.', survey: sv, to, cc },
    }
  }
}

export async function handlePeriodicalSurveyClientReport(body: Record<string, unknown>) {
  const surveyId = s(body.surveyId, 40)
  let sv: MisPeriodicalSurvey | null = null
  if (surveyId) {
    sv = (await getPeriodicalSurveys()).find((x) => x.id === surveyId) || null
  }
  if (!sv && body.survey && typeof body.survey === 'object') {
    sv = normalizePeriodicalSurvey({
      ...(body.survey as object),
      id: s((body.survey as { id?: string }).id, 40) || nid('ps'),
    } as MisPeriodicalSurvey)
  }
  if (!sv) return { status: 404, json: { error: 'Survey not found.' } }
  let html = buildClientSurveyReportHtml(toCrmSurveyShape(sv), {
    title:
      sv.surveyKind === 'hdfc'
        ? 'HDFC Bank — Periodical Security Survey Report'
        : 'Periodical Security Survey Report',
  })
  const hdfcBlock = buildHdfcQuestionnaireHtml(sv)
  if (hdfcBlock) {
    html = html.replace(/(<\/div>\s*)(<div class="sec">\s*<h2>1\. Site Brief)/, `$1${hdfcBlock}$2`)
  }
  return { status: 200, json: { ok: true, html } }
}

export async function handlePeriodicalSurveySendMail(body: Record<string, unknown>) {
  const to = parseEmails(body.to)
  if (!to.length) return { status: 400, json: { error: 'Enter a valid To email.' } }
  const surveyId = s(body.surveyId, 40)
  let sv: MisPeriodicalSurvey | null = surveyId
    ? (await getPeriodicalSurveys()).find((x) => x.id === surveyId) || null
    : null
  if (!sv && body.survey && typeof body.survey === 'object') {
    sv = normalizePeriodicalSurvey({
      ...(body.survey as object),
      id: s((body.survey as { id?: string }).id, 40) || nid('ps'),
    } as MisPeriodicalSurvey)
  }
  if (!sv) {
    return { status: 404, json: { error: 'Survey not found. Save Site Inputs and Risk Assessment first.' } }
  }
  const crmSv = toCrmSurveyShape(sv)
  const surveyor = (s(body.surveyorEmail, 120) || sv.surveyorEmail || '').toLowerCase()
  const extraCc = parseEmails(body.cc)
  const autoCc = [surveyor, LOKESH_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL].filter((e) => e.includes('@'))
  const toSet = new Set(to.map((e) => e.toLowerCase()))
  const cc = [...new Set([...extraCc, ...autoCc].map((e) => e.toLowerCase()).filter((e) => e.includes('@') && !toSet.has(e)))]
  const companySlug = (sv.company || 'Site').replace(/[^\w\-]+/g, '_').slice(0, 40)
  let reportHtml = buildClientSurveyReportHtml(crmSv, {
    title:
      sv.surveyKind === 'hdfc'
        ? 'HDFC Bank — Periodical Security Survey Report'
        : 'Periodical Security Survey Report',
  })
  const hdfcBlock = buildHdfcQuestionnaireHtml(sv)
  if (hdfcBlock) {
    reportHtml = reportHtml.replace(/(<\/div>\s*)(<div class="sec">\s*<h2>1\. Site Brief)/, `$1${hdfcBlock}$2`)
  }
  const siteHtml = buildSiteInputsPhotosHtml(crmSv)
  const riskHtml = buildRiskAssessmentHtml(crmSv)
  const attachments = [
    htmlToBase64Attachment(`Periodical_Survey_Report_${companySlug}.html`, reportHtml),
    htmlToBase64Attachment(`Site_Inputs_Photos_${companySlug}.html`, siteHtml),
    htmlToBase64Attachment(`Risk_Assessment_${companySlug}.html`, riskHtml),
  ]
  const text =
    String(body.body ?? '').trim() ||
    [
      `Dear Sir / Madam,`,
      ``,
      `Please find attached the Periodical Security Survey Report for ${sv.company || 'your site'}.`,
      sv.periodLabel ? `Period: ${sv.periodLabel}` : '',
      ``,
      `Attachments:`,
      `1. Periodical Security Survey Report (main colourful report)`,
      `2. Site Inputs & Photos`,
      `3. Risk Assessment`,
      ``,
      `We seek your kind support and input on this report for implementation.`,
      ``,
      `Regards,`,
      `Agile Security Force`,
    ]
      .filter(Boolean)
      .join('\n')
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { status: 503, json: { error: 'Email service not configured.' } }
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    const from = pinMailFrom()
    const result = await sendSuiteEmail(resend, {
      from,
      to,
      cc,
      subject: s(body.subject, 200) || `Periodical Security Survey Report — ${sv.company || 'Site'}`,
      text,
      html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap;font-size:14px;color:#111">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`,
      attachments,
      skipDirectorCc: true,
    })
    if ((result as { error?: { message?: string } }).error) {
      return {
        status: 502,
        json: { error: (result as { error?: { message?: string } }).error?.message || 'Send failed' },
      }
    }
    return { status: 200, json: { ok: true, cc, attached: attachments.length } }
  } catch (err) {
    console.error('[periodicalSurveySendMail]', err)
    return { status: 502, json: { error: 'Could not send email.' } }
  }
}

/** HDFC: after Director Approval, HOD sends final report + photos to client. */
export async function handlePeriodicalSurveySendToClient(
  body: Record<string, unknown>,
  userName: string,
  actorEmail: string,
  lockedBranchId?: string,
) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  if (!lockedBranchId) {
    return { status: 403, json: { error: 'Only the branch HOD can Send to client.' } }
  }
  const to = parseEmails(body.to)
  if (!to.length) return { status: 400, json: { error: 'Enter client email address (TO).' } }
  const surveyId = s(body.surveyId, 40)
  const surveys = await getPeriodicalSurveys()
  const sv = surveyId ? surveys.find((x) => x.id === surveyId) : null
  if (!sv) return { status: 404, json: { error: 'Survey not found.' } }
  if (sv.branchId !== lockedBranchId) {
    return { status: 403, json: { error: 'Cannot send surveys for another branch.' } }
  }
  if (sv.surveyKind !== 'hdfc') {
    return { status: 400, json: { error: 'Send to client (this flow) is for HDFC surveys after Director Approval.' } }
  }
  if (sv.status !== 'Approved') {
    return { status: 400, json: { error: 'Director must Approve first. Then HOD can Send to client.' } }
  }
  if (sv.sentToClientAt) {
    return { status: 400, json: { error: 'Already sent to client. Reopen only if Director asks.' } }
  }

  const extraCc = parseEmails(body.cc)
  const hodTo = await branchHodEmails(sv.branchId)
  const autoCc = [...hodTo, SRIDHAR_M_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL].filter((e) => e.includes('@'))
  const toSet = new Set(to.map((e) => e.toLowerCase()))
  const cc = [
    ...new Set(
      [...extraCc, ...autoCc].map((e) => e.toLowerCase()).filter((e) => e.includes('@') && !toSet.has(e)),
    ),
  ]

  const crmSv = toCrmSurveyShape(sv)
  const companySlug = (sv.company || 'Site').replace(/[^\w\-]+/g, '_').slice(0, 40)
  let reportHtml = buildClientSurveyReportHtml(crmSv, {
    title: 'HDFC Bank — Periodical Security Survey Report',
  })
  const hdfcBlock = buildHdfcQuestionnaireHtml(sv)
  if (hdfcBlock) {
    reportHtml = reportHtml.replace(/(<\/div>\s*)(<div class="sec">\s*<h2>1\. Site Brief)/, `$1${hdfcBlock}$2`)
  }
  const sugHtml =
    `<div style="font-family:Arial,sans-serif;padding:16px;color:#111">` +
    `<h2>Final report with suggestions</h2>` +
    `<h3>HOD suggestions</h3><pre style="white-space:pre-wrap">${s(sv.hodSuggestions, 8000)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')}</pre>` +
    `<h3>System / AI suggestion</h3><pre style="white-space:pre-wrap">${s(sv.systemSuggestions, 8000)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')}</pre>` +
    `<h3>Executive Summary</h3><pre style="white-space:pre-wrap">${s(sv.executiveSummary, 8000)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')}</pre>` +
    `</div>`

  const attachments: { filename: string; content: string; contentType?: string }[] = [
    htmlToBase64Attachment(`HDFC_Survey_Report_${companySlug}.html`, reportHtml),
    htmlToBase64Attachment(`Final_Report_Suggestions_${companySlug}.html`, sugHtml),
  ]
  let photoN = 0
  for (const p of sv.photos || []) {
    if (p.active === false || !p.dataUrl) continue
    if (photoN >= 12) break
    const label = (p.heading || p.label || `Photo_${photoN + 1}`).replace(/[^\w\-]+/g, '_').slice(0, 40)
    const att = dataUrlToAttachment(p.dataUrl, `${label}_${photoN + 1}.jpg`, 'image/jpeg')
    if (att) {
      attachments.push(att)
      photoN += 1
    }
  }

  const by = (userName || actorEmail).slice(0, 120)
  const text = [
    `Dear Sir / Madam,`,
    ``,
    `Please find attached the HDFC Site Security Assessment (SSA) final report with suggestions for ${sv.company || 'your branch'}.`,
    sv.surveyDate ? `Survey date: ${sv.surveyDate}` : '',
    ``,
    `Attachments:`,
    `1. HDFC Survey Report`,
    `2. Final report with suggestions`,
    photoN ? `3. Site photos / documents (${photoN} file(s))` : '',
    ``,
    `Regards,`,
    `Agile Security Force`,
    by ? `Sent by HOD: ${by}` : '',
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
      subject: s(body.subject, 200) || `HDFC Site Security Assessment (SSA) Report — ${sv.company || 'Site'}`,
      text,
      html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap;font-size:14px;color:#111">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`,
      attachments,
      skipDirectorCc: true,
    })
    if ((result as { error?: { message?: string } }).error) {
      return {
        status: 502,
        json: { error: (result as { error?: { message?: string } }).error?.message || 'Send failed' },
      }
    }
    const now = new Date().toISOString()
    const next: MisPeriodicalSurvey = {
      ...sv,
      sentToClientAt: now,
      sentToClientBy: by,
      sentToClientTo: to.join(', ').slice(0, 500),
      sentToClientCc: cc.join(', ').slice(0, 800),
      updatedAt: now,
    }
    const idx = surveys.findIndex((x) => x.id === sv.id)
    if (idx >= 0) surveys[idx] = next
    const ok = await savePeriodicalSurveys(surveys)
    if (!ok) {
      return {
        status: 200,
        json: {
          ok: true,
          warning: 'Email sent, but could not save Sent-to-client stamp.',
          to,
          cc,
          photos: photoN,
          survey: next,
          surveys: surveys.filter((x) => x.branchId === lockedBranchId),
        },
      }
    }
    return {
      status: 200,
      json: {
        ok: true,
        to,
        cc,
        photos: photoN,
        survey: next,
        surveys: surveys.filter((x) => x.branchId === lockedBranchId),
      },
    }
  } catch (err) {
    console.error('[periodicalSurveySendToClient]', err)
    return { status: 502, json: { error: 'Could not send email to client.' } }
  }
}

function isHdfcClientName(name: string, location?: string): boolean {
  return /hdfc/i.test(`${name || ''} ${location || ''}`)
}

function clientSanStrengthPublic(c: {
  sanA?: number
  sanG?: number
  sanB?: number
  sanC?: number
}): string {
  return clientSanStrength(c)
}

const PUBLIC_MAX_PHOTO_CHARS = 900_000
const PUBLIC_MAX_TOTAL_PHOTO_CHARS = 2_800_000

function trimPublicPhotos(
  photos: MisPeriodicalSurvey['photos'],
): { photos: MisPeriodicalSurvey['photos']; error?: string } {
  const list = Array.isArray(photos) ? photos.slice(0, Math.min(14, MAX_SURVEY_PHOTOS)) : []
  let total = 0
  const out: MisPeriodicalSurvey['photos'] = []
  for (const p of list) {
    const dataUrl = String(p?.dataUrl || '')
    if (dataUrl.length > PUBLIC_MAX_PHOTO_CHARS) {
      return {
        photos: out,
        error: 'One photo is too large. Retake with lower quality or fewer photos, then submit again.',
      }
    }
    total += dataUrl.length
    if (total > PUBLIC_MAX_TOTAL_PHOTO_CHARS) {
      return {
        photos: out,
        error: 'Too many / large photos. Keep about 8–10 clear photos, then submit again.',
      }
    }
    out.push(p)
  }
  return { photos: out }
}

/** Public no-login boot — branches + survey template + ops names (optional branch). */
export async function handlePeriodicalSurveyPublicBoot(body: Record<string, unknown> = {}) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const branchFilter = s(body.branchId, 80) || undefined
  const [branchesRes, directoryRes] = await Promise.allSettled([
    getBranches(true),
    branchFilter
      ? buildSsaDirectory(branchFilter)
      : Promise.resolve({ operations: [], hods: [], opsTeam: [] as string[] }),
  ])
  const branches = branchesRes.status === 'fulfilled' ? branchesRes.value : []
  const directory =
    directoryRes.status === 'fulfilled'
      ? directoryRes.value
      : { operations: [], hods: [], opsTeam: [] as string[] }
  const activeBranches = branches
    .filter((b) => b.active !== false)
    .map((b) => ({ id: b.id, name: b.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const opsTeam = directory.opsTeam
  return {
    status: 200,
    json: {
      ok: true,
      branches: activeBranches,
      opsTeam,
      ssaDirectory: { operations: directory.operations, hods: directory.hods },
      surveyTemplate: {
        parts: SURVEY_PARTS,
        contractStart: CONTRACT_START_STEPS,
        industries: SECTORS,
      },
    },
  }
}

/** Public — HDFC clients for one branch (includes same-city book, e.g. Kochi / Kerala). */
export async function handlePeriodicalSurveyPublicClients(body: Record<string, unknown>) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const branchId = s(body.branchId, 80)
  if (!branchId) return { status: 400, json: { error: 'Pick a branch first.' } }
  const listed = await listPublicExternalClients(branchId, { hdfcOnly: true })
  if ('error' in listed && listed.error && !listed.clients.length) {
    return { status: 400, json: { error: listed.error } }
  }
  return { status: 200, json: { ok: true, branchId, clients: listed.clients } }
}

/**
 * Public no-login submit — creates a new HDFC survey as Completed (Sent to HOD).
 * Branch → HDFC client validated against Master Directory.
 */
export async function handlePeriodicalSurveyPublicSubmit(body: Record<string, unknown>) {
  const action = String(body.action || 'submit').toLowerCase()
  if (action === 'draft' || action === 'autosave') {
    return handlePeriodicalSurveyPublicDraftSave(body)
  }
  if (action === 'report' || action === 'review') {
    return handlePeriodicalSurveyPublicReport(body)
  }
  if (action === 'generate' || action === 'generateai') {
    return handlePeriodicalSurveyPublicGenerate(body)
  }
  return handlePeriodicalSurveyPublicFinalSubmit(body)
}

function publicSurveyorKey(name: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function findPublicHdfcDraft(
  list: MisPeriodicalSurvey[],
  branchId: string,
  clientId: string,
  surveyedBy: string,
  surveyId?: string,
): MisPeriodicalSurvey | undefined {
  if (surveyId) {
    const byId = list.find(
      (sv) =>
        sv.id === surveyId &&
        sv.surveyKind === 'hdfc' &&
        sv.status === 'Draft' &&
        sv.periodLabel === 'PUBLIC_HDFC_LINK' &&
        sv.active !== false,
    )
    if (byId) return byId
  }
  const key = publicSurveyorKey(surveyedBy)
  return list.find(
    (sv) =>
      sv.surveyKind === 'hdfc' &&
      sv.status === 'Draft' &&
      sv.periodLabel === 'PUBLIC_HDFC_LINK' &&
      sv.branchId === branchId &&
      sv.clientId === clientId &&
      publicSurveyorKey(sv.surveyedBy) === key &&
      sv.active !== false,
  )
}

function findPublicHdfcDraftByCode(
  list: MisPeriodicalSurvey[],
  code: string,
): MisPeriodicalSurvey | undefined {
  const want = normPublicResumeCode(code)
  if (!want) return undefined
  return list.find(
    (sv) =>
      sv.surveyKind === 'hdfc' &&
      sv.status === 'Draft' &&
      sv.periodLabel === 'PUBLIC_HDFC_LINK' &&
      normPublicResumeCode(sv.publicResumeCode) === want &&
      sv.active !== false,
  )
}

async function validatePublicHdfcContext(body: Record<string, unknown>) {
  const branchId = s(body.branchId, 80)
  const clientId = s(body.clientId, 80)
  const surveyedBy = s(body.surveyedBy, 120).trim()
  if (!branchId) return { error: { status: 400 as const, json: { error: 'Pick Branch first.' } } }
  if (!clientId) return { error: { status: 400 as const, json: { error: 'Pick the HDFC unit from the list.' } } }
  if (!surveyedBy) {
    return { error: { status: 400 as const, json: { error: 'Enter your name (Surveyed By).' } } }
  }
  const surveyId = s(body.surveyId, 40)
  const [resolved, prev] = await Promise.all([
    resolvePublicExternalClient(branchId, clientId, { hdfcOnly: true }),
    loadPublicHdfcDraftByTriple(branchId, clientId, surveyedBy, surveyId),
  ])
  if ('error' in resolved && resolved.error) return { error: resolved.error }
  const { branch, client } = resolved as Exclude<typeof resolved, { error: unknown }>
  return { branchId, clientId, surveyedBy, branch, client, existingRow: prev || undefined }
}

function buildPublicHdfcSurveyRow(opts: {
  existingRow?: MisPeriodicalSurvey
  branchId: string
  clientId: string
  surveyedBy: string
  client: { name?: string; location?: string; staffName?: string }
  surveyIn: Record<string, unknown>
  photos: MisPeriodicalSurvey['photos']
  status: MisPeriodicalSurveyStatus
  now: string
}): MisPeriodicalSurvey {
  const { existingRow, branchId, clientId, surveyedBy, client, surveyIn, photos, status, now } = opts
  const hdfcForm = normalizeHdfcForm(surveyIn.hdfcForm || existingRow?.hdfcForm || {})
  hdfcForm.branchName = client.name || hdfcForm.branchName || ''
  if (!hdfcForm.fullAddress) hdfcForm.fullAddress = String(client.location || '')
  if (!hdfcForm.managerName && client.staffName) hdfcForm.managerName = String(client.staffName)
  hdfcForm.surveyedBy = surveyedBy
  if (!hdfcForm.surveyDate) {
    hdfcForm.surveyDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  }
  const blank = emptyPeriodicalSurvey(clientId, branchId)
  const scores =
    surveyIn.scores && typeof surveyIn.scores === 'object'
      ? (surveyIn.scores as Record<string, number>)
      : existingRow?.scores || {}
  const scoreNotes =
    surveyIn.scoreNotes && typeof surveyIn.scoreNotes === 'object'
      ? (surveyIn.scoreNotes as Record<string, string>)
      : existingRow?.scoreNotes || {}
  const isDraft = status === 'Draft'
  return normalizePeriodicalSurvey({
    ...blank,
    ...existingRow,
    id: existingRow?.id || nid('ps'),
    clientId,
    branchId,
    company: client.name || s(surveyIn.company, 200) || existingRow?.company || '',
    locationName: String(client.location || surveyIn.locationName || existingRow?.locationName || ''),
    address: hdfcForm.fullAddress || String(surveyIn.address || existingRow?.address || ''),
    factoryManager: hdfcForm.managerName || String(client.staffName || existingRow?.factoryManager || ''),
    contactPhone: hdfcForm.contactNumber || existingRow?.contactPhone || '',
    contactEmail: hdfcForm.contactEmail || existingRow?.contactEmail || '',
    natureOfBusiness: 'Banking — HDFC',
    industry: 'Banking',
    industryOther: '',
    surveyDate: hdfcForm.surveyDate,
    surveyedBy,
    surveyorEmail: s(surveyIn.surveyorEmail, 120) || existingRow?.surveyorEmail || '',
    surveyorWhatsApp: s(surveyIn.surveyorWhatsApp, 20) || existingRow?.surveyorWhatsApp || '',
    startedAt: s(surveyIn.startedAt, 40) || existingRow?.startedAt || (isDraft ? now : ''),
    geoLat: (() => {
      const n = Number(surveyIn.geoLat ?? existingRow?.geoLat)
      return Number.isFinite(n) && Math.abs(n) <= 90 ? Math.round(n * 1e6) / 1e6 : null
    })(),
    geoLng: (() => {
      const n = Number(surveyIn.geoLng ?? existingRow?.geoLng)
      return Number.isFinite(n) && Math.abs(n) <= 180 ? Math.round(n * 1e6) / 1e6 : null
    })(),
    geoAccuracy: (() => {
      const n = Number(surveyIn.geoAccuracy ?? existingRow?.geoAccuracy)
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : null
    })(),
    geoCapturedAt: s(surveyIn.geoCapturedAt, 40) || existingRow?.geoCapturedAt || '',
    geoStatus: s(surveyIn.geoStatus, 40) || existingRow?.geoStatus || '',
    publicResumeCode:
      normPublicResumeCode(existingRow?.publicResumeCode) ||
      normPublicResumeCode(surveyIn.publicResumeCode) ||
      (isDraft ? newPublicResumeCode() : ''),
    periodLabel: isDraft ? 'PUBLIC_HDFC_LINK' : '',
    surveyKind: 'hdfc',
    hdfcForm,
    photos,
    scores,
    scoreNotes,
    siteObservations: s(surveyIn.siteObservations, 8000) || existingRow?.siteObservations || '',
    riskAnalysis: s(surveyIn.riskAnalysis, 8000) || existingRow?.riskAnalysis || '',
    executiveSummary: s(surveyIn.executiveSummary, 8000) || existingRow?.executiveSummary || '',
    securityRecommendations:
      s(surveyIn.securityRecommendations, 8000) || existingRow?.securityRecommendations || '',
    recommendations: s(surveyIn.recommendations, 8000) || existingRow?.recommendations || '',
    hodSuggestions: s(surveyIn.hodSuggestions, 8000) || existingRow?.hodSuggestions || '',
    systemSuggestions: s(surveyIn.systemSuggestions, 8000) || existingRow?.systemSuggestions || '',
    status,
    submittedAt: isDraft ? '' : now,
    submittedBy: isDraft ? '' : surveyedBy,
    reassessmentAt: isDraft ? existingRow?.reassessmentAt || '' : '',
    reassessmentBy: isDraft ? existingRow?.reassessmentBy || '' : '',
    reassessmentNote: isDraft ? existingRow?.reassessmentNote || '' : '',
    active: true,
    createdAt: existingRow?.createdAt || now,
    updatedAt: now,
  } as MisPeriodicalSurvey)
}

/** Quiet auto-save — Draft only; one draft per Branch + HDFC unit + Surveyed By. */
export async function handlePeriodicalSurveyPublicDraftSave(body: Record<string, unknown>) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const ctx = await validatePublicHdfcContext(body)
  if ('error' in ctx && ctx.error) return ctx.error
  const { branchId, clientId, surveyedBy, branch, client, existingRow } = ctx as Exclude<
    typeof ctx,
    { error: unknown }
  >

  const surveyIn = (body.survey ?? body) as Record<string, unknown>
  const keepPhotos = body.keepPhotos === true || body.keepPhotos === '1' || surveyIn.keepPhotos === true
  let photoTrim = trimPublicPhotos(
    Array.isArray(surveyIn.photos)
      ? (surveyIn.photos as MisPeriodicalSurvey['photos'])
      : [],
  )
  let photoNote = ''
  if (photoTrim.error) {
    photoNote = photoTrim.error
    photoTrim = { photos: [] }
  }

  const prev = existingRow
  const now = new Date().toISOString()
  const photos =
    keepPhotos || photoTrim.photos.length === 0
      ? prev?.photos || photoTrim.photos || []
      : photoTrim.photos
  const draft = buildPublicHdfcSurveyRow({
    existingRow: prev,
    branchId,
    clientId,
    surveyedBy,
    client,
    surveyIn,
    photos,
    status: 'Draft',
    now,
  })

  const ok = await savePublicHdfcDraft(draft)
  if (!ok) return { status: 503, json: { error: 'Could not auto-save. Try again.' } }
  void rememberSsaBranchAssessor({
    branchId,
    name: surveyedBy,
    email: draft.surveyorEmail,
    mobile: draft.surveyorWhatsApp,
  })

  return {
    status: 200,
    json: {
      ok: true,
      draft: true,
      surveyId: draft.id,
      resumeCode: draft.publicResumeCode,
      branchId,
      branchName: branch.name,
      company: draft.company,
      status: 'Draft',
      photoNote: photoNote || undefined,
      message: 'Draft saved on server — tap Submit to HOD when finished.',
    },
  }
}

/** Preview the client report from the current draft — does not Submit to HOD. */
export async function handlePeriodicalSurveyPublicReport(body: Record<string, unknown>) {
  const ctx = await validatePublicHdfcContext(body)
  if ('error' in ctx && ctx.error) return ctx.error
  const { branchId, clientId, surveyedBy, client, existingRow } = ctx as Exclude<
    typeof ctx,
    { error: unknown }
  >

  const surveyIn = (body.survey ?? body) as Record<string, unknown>
  let photoTrim = trimPublicPhotos(
    Array.isArray(surveyIn.photos)
      ? (surveyIn.photos as MisPeriodicalSurvey['photos'])
      : [],
  )
  if (photoTrim.error) photoTrim = { photos: [] }

  const prev = existingRow
  const now = new Date().toISOString()
  const photos = photoTrim.photos.length > 0 ? photoTrim.photos : prev?.photos || []
  const draft = buildPublicHdfcSurveyRow({
    existingRow: prev,
    branchId,
    clientId,
    surveyedBy,
    client,
    surveyIn,
    photos,
    status: 'Draft',
    now,
  })
  return handlePeriodicalSurveyClientReport({ survey: draft })
}

/** Public page 13 — fill professional assessment from answers. Draft only; does not Submit. */
export async function handlePeriodicalSurveyPublicGenerate(body: Record<string, unknown>) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const ctx = await validatePublicHdfcContext(body)
  if ('error' in ctx && ctx.error) return ctx.error
  const { branchId, clientId, surveyedBy, client, existingRow } = ctx as Exclude<
    typeof ctx,
    { error: unknown }
  >

  const surveyIn = (body.survey ?? body) as Record<string, unknown>
  const now = new Date().toISOString()
  const photos = existingRow?.photos || []
  const draft = buildPublicHdfcSurveyRow({
    existingRow,
    branchId,
    clientId,
    surveyedBy,
    client,
    surveyIn,
    photos,
    status: 'Draft',
    now,
  })

  const ai = await handlePeriodicalSurveyGenerateAi({
    survey: {
      ...draft,
      scores: draft.scores,
      scoreNotes: draft.scoreNotes,
      siteObservations: draft.siteObservations,
      hodSuggestions: draft.hodSuggestions,
    },
  })
  const report = (ai.json || {}) as Record<string, string | boolean>
  if (ai.status !== 200) return ai

  const next = {
    ...draft,
    riskAnalysis: String(report.riskAnalysis || draft.riskAnalysis || ''),
    executiveSummary: String(report.executiveSummary || draft.executiveSummary || ''),
    securityRecommendations: String(
      report.securityRecommendations || draft.securityRecommendations || '',
    ),
    recommendations: String(report.recommendations || report.securityRecommendations || ''),
    systemSuggestions: String(report.systemSuggestions || draft.systemSuggestions || ''),
    updatedAt: now,
  }
  const saved = await savePublicHdfcDraft(next)
  return {
    status: 200,
    json: {
      ok: true,
      saved,
      draft: true,
      surveyId: next.id,
      resumeCode: next.publicResumeCode,
      riskAnalysis: next.riskAnalysis,
      executiveSummary: next.executiveSummary,
      securityRecommendations: next.securityRecommendations,
      systemSuggestions: next.systemSuggestions,
      aiUsed: report.aiUsed === true,
    },
  }
}

/** Resume an in-progress public draft (same Branch + unit + name, or continue code). */
export async function handlePeriodicalSurveyPublicDraftLoad(body: Record<string, unknown>) {
  const code = normPublicResumeCode(body.code || body.resumeCode)
  if (code) {
    const byCode = await loadPublicHdfcDraftByCode(code)
    if (!byCode || byCode.status !== 'Draft') {
      return { status: 404, json: { error: 'No saved assessment for that continue code. Check the code and try again.' } }
    }
    return {
      status: 200,
      json: {
        ok: true,
        draft: byCode,
        resumeCode: byCode.publicResumeCode,
        branchId: byCode.branchId,
        clientId: byCode.clientId,
        surveyedBy: byCode.surveyedBy,
      },
    }
  }
  const branchId = s(body.branchId, 80)
  const clientId = s(body.clientId, 80)
  const surveyedBy = s(body.surveyedBy, 120).trim()
  if (!branchId || !clientId || !surveyedBy) {
    return { status: 400, json: { error: 'Branch, HDFC unit and name are required to resume.' } }
  }
  const draft = await loadPublicHdfcDraftByTriple(branchId, clientId, surveyedBy)
  if (!draft || draft.status !== 'Draft') return { status: 200, json: { ok: true, draft: null } }
  return { status: 200, json: { ok: true, draft, resumeCode: draft.publicResumeCode } }
}

async function handlePeriodicalSurveyPublicFinalSubmit(body: Record<string, unknown>) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const ctx = await validatePublicHdfcContext(body)
  if ('error' in ctx && ctx.error) return ctx.error
  const { branchId, clientId, surveyedBy, branch, client, existingRow } = ctx as Exclude<
    typeof ctx,
    { error: unknown }
  >

  const surveyIn = (body.survey ?? body) as Record<string, unknown>
  const keepPhotos = body.keepPhotos === true || body.keepPhotos === '1'
  const photoTrim = trimPublicPhotos(
    Array.isArray(surveyIn.photos)
      ? (surveyIn.photos as MisPeriodicalSurvey['photos'])
      : [],
  )
  if (photoTrim.error && !keepPhotos) return { status: 400, json: { error: photoTrim.error } }

  const prev = existingRow
  const now = new Date().toISOString()
  const photos = keepPhotos || photoTrim.photos.length === 0 ? prev?.photos || photoTrim.photos || [] : photoTrim.photos
  const draft = buildPublicHdfcSurveyRow({
    existingRow: prev,
    branchId,
    clientId,
    surveyedBy,
    client,
    surveyIn,
    photos,
    status: 'Completed',
    now,
  })
  const pages = hdfcPagesProgress({ ...draft, status: 'Draft' })
  if (!pages.complete) {
    return {
      status: 400,
      json: {
        error: hdfcPagesIncompleteMessage(draft) || `Pages completed: ${pages.label}. Complete all 15 pages before Submit to HOD.`,
        pagesDone: pages.done,
        pagesTotal: pages.total,
        pagesMissing: pages.missing,
      },
    }
  }

  const okDoc = await savePublicHdfcDraft(draft)
  const okList = await upsertPeriodicalSurvey(draft)
  if (!okDoc && !okList) return { status: 503, json: { error: 'Could not save survey. Try again.' } }
  void rememberSsaBranchAssessor({
    branchId,
    name: surveyedBy,
    email: draft.surveyorEmail,
    mobile: draft.surveyorWhatsApp,
  })

  let clientGeo: { ok: boolean; error?: string } | null = null
  if (
    draft.clientId &&
    draft.geoLat != null &&
    draft.geoLng != null &&
    Number.isFinite(draft.geoLat) &&
    Number.isFinite(draft.geoLng)
  ) {
    clientGeo = await saveClientGeoFromAssessment({
      clientId: draft.clientId,
      branchId,
      lat: draft.geoLat,
      lng: draft.geoLng,
      capturedAt: draft.geoCapturedAt || now,
      source: 'hdfc-ssa',
    })
  }

  console.log(
    '[periodicalSurveyPublicSubmit]',
    draft.id,
    branch.name,
    draft.company,
    surveyedBy,
  )
  const startedMs = Date.parse(draft.startedAt || prev?.startedAt || '')
  const submittedMs = Date.parse(draft.submittedAt || now)
  let timeTaken = ''
  if (Number.isFinite(startedMs) && Number.isFinite(submittedMs) && submittedMs >= startedMs) {
    const mins = Math.max(1, Math.round((submittedMs - startedMs) / 60000))
    if (mins < 60) timeTaken = `${mins} minute${mins === 1 ? '' : 's'}`
    else {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      timeTaken = m ? `${h} hour${h === 1 ? '' : 's'} ${m} minute${m === 1 ? '' : 's'}` : `${h} hour${h === 1 ? '' : 's'}`
    }
  }
  const submittedLabel = new Date(draft.submittedAt || now).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  const thankMsg = timeTaken
    ? `Thank you! You took ${timeTaken} for this HDFC Site Security Assessment. Submitted on ${submittedLabel}. Your branch HOD will review it.`
    : `Thank you! Submitted on ${submittedLabel}. Your branch HOD will review it under Site Security Assessment (SSA) → HDFC SSA submitted List.`

  const notify = await sendHdfcPublicThankYouNotify({
    branchId,
    branchName: branch.name,
    company: draft.company || '',
    location: draft.locationName || draft.address || '',
    surveyedBy,
    surveyorEmail: draft.surveyorEmail || '',
    surveyorWhatsApp: draft.surveyorWhatsApp || '',
    timeTaken,
    submittedLabel,
    thankMsg,
  })

  return {
    status: 200,
    json: {
      ok: true,
      surveyId: draft.id,
      branchId,
      branchName: branch.name,
      company: draft.company,
      status: draft.status,
      submittedAt: draft.submittedAt || now,
      submittedAtLabel: submittedLabel,
      timeTaken,
      surveyorEmail: draft.surveyorEmail || '',
      surveyorWhatsApp: draft.surveyorWhatsApp || '',
      geoLat: draft.geoLat,
      geoLng: draft.geoLng,
      geoStatus: draft.geoStatus || '',
      clientGeo,
      notify,
      message: thankMsg,
    },
  }
}

/** Thank-you after public HDFC submit → Risk Analyst (mail + WA) and CC Director + branch HOD (mail + WA). */
async function sendHdfcPublicThankYouNotify(opts: {
  branchId: string
  branchName: string
  company: string
  location: string
  surveyedBy: string
  surveyorEmail: string
  surveyorWhatsApp: string
  timeTaken: string
  submittedLabel: string
  thankMsg: string
}): Promise<{
  emailTo: string[]
  emailCc: string[]
  whatsapp: string[]
  errors: string[]
}> {
  const out = { emailTo: [] as string[], emailCc: [] as string[], whatsapp: [] as string[], errors: [] as string[] }
  const { whatsappMobile } = await import('./complaint-mail.js')
  const { getHodEmailsForBranch, isHodUser } = await import('./digest.js')
  const { waSendText, whatsappConfigured } = await import('../pulse/whatsapp.js')

  const users = await getUsers()
  const hodEmails = await getHodEmailsForBranch(opts.branchId, users)
  const directorEmail =
    process.env.MIS_DIRECTOR_EMAIL?.trim() ||
    MIS_DIRECTOR_CC_EMAIL ||
    'director@agilegroup.co.in'
  const analystEmail = String(opts.surveyorEmail || '')
    .trim()
    .toLowerCase()

  const mailBody = [
    `Dear ${opts.surveyedBy || 'Risk Analyst'},`,
    ``,
    opts.thankMsg,
    ``,
    `HDFC / Site: ${opts.company || '—'}`,
    `Location: ${opts.location || '—'}`,
    `Branch: ${opts.branchName || '—'}`,
    `Risk Analyst: ${opts.surveyedBy || '—'}`,
    opts.surveyorWhatsApp ? `WhatsApp: ${opts.surveyorWhatsApp}` : '',
    opts.timeTaken ? `Time taken: ${opts.timeTaken}` : '',
    `Submitted: ${opts.submittedLabel}`,
    ``,
    `This copy is also shared with the Branch HOD and Director.`,
    ``,
    `Regards,`,
    `Agile Security Force Private Limited`,
    `HDFC Site Security Assessment (SSA)`,
  ]
    .filter(Boolean)
    .join('\n')

  const waBody = [
    `✅ *Thank you — HDFC SSA submitted*`,
    ``,
    opts.thankMsg,
    ``,
    `*HDFC / Site:* ${opts.company || '—'}`,
    `*Location:* ${opts.location || '—'}`,
    `*Branch:* ${opts.branchName || '—'}`,
    `*Risk Analyst:* ${opts.surveyedBy || '—'}`,
    opts.timeTaken ? `*Time taken:* ${opts.timeTaken}` : '',
    `*Submitted:* ${opts.submittedLabel}`,
    ``,
    `— Agile Security Force Private Limited`,
  ]
    .filter(Boolean)
    .join('\n')

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (apiKey && analystEmail.includes('@')) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(apiKey)
      const cc = [
        ...new Set(
          [...hodEmails, directorEmail]
            .map((e) => e.trim().toLowerCase())
            .filter((e) => e.includes('@') && e !== analystEmail),
        ),
      ]
      const result = await sendSuiteEmail(resend, {
        from: pinMailFrom(),
        to: [analystEmail],
        cc,
        subject: `Thank you — HDFC SSA submitted · ${opts.company || 'Site'} (${opts.branchName})`,
        text: mailBody,
        html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap;font-size:14px;color:#111">${mailBody
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')}</div>`,
        skipDirectorCc: true,
      })
      if ((result as { error?: { message?: string } }).error) {
        out.errors.push(
          (result as { error?: { message?: string } }).error?.message || 'Thank-you email failed',
        )
      } else {
        out.emailTo = [analystEmail]
        out.emailCc = cc
      }
    } catch (e) {
      out.errors.push(`Email: ${e instanceof Error ? e.message : 'failed'}`)
    }
  } else if (!analystEmail.includes('@')) {
    out.errors.push('Risk Analyst email missing — thank-you mail not sent')
  } else {
    out.errors.push('Email service not configured')
  }

  if (whatsappConfigured()) {
    const waTargets = new Set<string>()
    const analystWa = whatsappMobile(opts.surveyorWhatsApp || '')
    if (analystWa.length >= 12) waTargets.add(analystWa)
    const directorWaRaw = process.env.ADMIN_WHATSAPP ?? process.env.MIS_DIRECTOR_WHATSAPP ?? ''
    const directorWa = whatsappMobile(directorWaRaw)
    if (directorWa.length >= 12) waTargets.add(directorWa)
    for (const u of users) {
      if (u.active === false || u.branchId !== opts.branchId || !isHodUser(u)) continue
      const m = whatsappMobile(u.phone || '')
      if (m.length >= 12) waTargets.add(m)
    }
    for (const to of waTargets) {
      try {
        const r = await waSendText(to, waBody)
        if (r?.ok) out.whatsapp.push(to)
        else out.errors.push(`WhatsApp ${to}: failed`)
      } catch (e) {
        out.errors.push(`WhatsApp ${to}: ${e instanceof Error ? e.message : 'failed'}`)
      }
    }
    if (!waTargets.size) out.errors.push('No WhatsApp numbers found for analyst / HOD / Director')
  } else {
    out.errors.push('WhatsApp not configured on server')
  }

  return out
}

/** HOD / Management — India dashboard JSON. HOD stays on their branch only. */
export async function handleHdfcSsaBoardBoot(body: Record<string, unknown>, lockedBranchId?: string) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const [branches, pack] = await Promise.all([getBranches(true), getHdfcSsaBoardAi()])
  const siblingIds = lockedBranchId ? siblingIdsForBranch(branches, lockedBranchId) : []
  const surveysRaw = lockedBranchId
    ? await getPeriodicalSurveysForBranch(lockedBranchId, siblingIds)
    : await getPeriodicalSurveys()
  const surveys = lockedBranchId
    ? surveysRaw.map((sv) => (siblingIds.includes(sv.branchId) ? { ...sv, branchId: lockedBranchId } : sv))
    : surveysRaw
  const states = await assembleHdfcSsaBoard({
    branches,
    surveys,
    publicOnly: false,
    lockedBranchId,
    letters: pack.letters,
    conclusions: pack.conclusions,
  })
  return {
    status: 200,
    json: {
      ok: true,
      public: false,
      states,
      kpis: indiaBoardKpis(states),
      aiUpdatedAt: pack.updatedAt,
      lockedBranch: Boolean(lockedBranchId),
      dutyWindowDays: 21,
    },
  }
}

/** Management only — write branch letters + state conclusions once. */
export async function handleHdfcSsaBoardRefreshAi(_body: Record<string, unknown>, lockedBranchId?: string) {
  if (lockedBranchId) {
    return {
      status: 403,
      json: { error: 'Management builds the AI pack. HOD opens the dashboard for their branch.' },
    }
  }
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const [branches, surveys] = await Promise.all([getBranches(true), getPeriodicalSurveys()])
  const { pack, sitesFilled } = await refreshHdfcSsaBoardAi({ branches, surveys })
  const states = await assembleHdfcSsaBoard({
    branches,
    surveys,
    publicOnly: false,
    letters: pack.letters,
    conclusions: pack.conclusions,
  })
  return {
    status: 200,
    json: {
      ok: true,
      states,
      kpis: indiaBoardKpis(states),
      aiUpdatedAt: pack.updatedAt,
      sitesFilled,
    },
  }
}

export async function handleHdfcSsaBoardLink() {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const view = await ensureHdfcSsaBoardViewCode()
  const url = `${MIS_BRAND.site}/mis-hdfc-ssa-board?code=${encodeURIComponent(view.code)}`
  return { status: 200, json: { ok: true, url, code: view.code } }
}

export async function handleHdfcSsaBoardPublicBoot(body: Record<string, unknown>) {
  const view = await getHdfcSsaBoardView()
  if (!view || !viewCodesMatch(s(body.code, 20), view.code)) {
    return { status: 401, json: { error: 'View code is not valid.' } }
  }
  const [branches, surveys, pack] = await Promise.all([
    getBranches(true),
    getPeriodicalSurveys(),
    getHdfcSsaBoardAi(),
  ])
  const states = await assembleHdfcSsaBoard({
    branches,
    surveys,
    publicOnly: true,
    letters: pack.letters,
    conclusions: pack.conclusions,
  })
  return {
    status: 200,
    json: {
      ok: true,
      public: true,
      states,
      kpis: indiaBoardKpis(states),
      aiUpdatedAt: pack.updatedAt,
      dutyWindowDays: 21,
    },
  }
}

export async function handleHdfcSsaBoardPublicReport(body: Record<string, unknown>) {
  const view = await getHdfcSsaBoardView()
  if (!view || !viewCodesMatch(s(body.code, 20), view.code)) {
    return { status: 401, json: { error: 'View code is not valid.' } }
  }
  const surveyId = s(body.surveyId, 40)
  const sv = surveyId ? await getPeriodicalSurveyById(surveyId) : null
  if (!sv || sv.surveyKind !== 'hdfc' || sv.active === false || sv.status !== 'Approved') {
    return { status: 404, json: { error: 'Approved site report not found.' } }
  }
  return handlePeriodicalSurveyClientReport({ survey: sv })
}

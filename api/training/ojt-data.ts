import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { isSuiteAdminEmail } from '../_lib/auth.js'
import { loadNightReport } from '../_lib/mis/night-ojt-store.js'
import { getBranches, getClients, getUsers, nid } from '../_lib/mis/store.js'
import { trainingTargetUrl } from '../_lib/suite-gate-config.js'
import {
  buildBranchKpi,
  buildSecurityObsList,
  summarizeSecObs,
} from '../_lib/training/ojt-dashboard.js'
import {
  reopenSecObsClosure,
  sendSecObsReminder,
  sendSecObsWhatsApp,
} from '../_lib/training/ojt-sec-obs-actions.js'
import {
  loadExtras,
  normalizeExtra,
  saveExtra,
  type OjtExtraKind,
} from '../_lib/training/ojt-extras-store.js'
import {
  ensureTrainingDepartmentBranch,
  isTrainingDepartmentBranch,
  isTrainingDeptCoveredClientBranch,
  isTrainingDeptManagerEmail,
  loadTrainingDeptClientPicks,
  OJT_QUESTION_SUBJECTS,
  resolveTrainingDeptCoveredBranches,
  TRAINING_DEPARTMENT_ID,
} from '../_lib/training/ojt-training-dept.js'
import {
  prepareClientFeedbackLink,
} from '../_lib/training/ojt-client-feedback-store.js'
import {
  clientReplyPublicUrl,
  prepareClientReplyLink,
} from '../_lib/training/ojt-client-reply-store.js'
import { copyVehicleRequirementToControl } from '../_lib/mis/copy-vehicle-requirement-to-control.js'
import {
  buildAdvanceNoticeHtml,
  buildCompletionReportHtml,
  buildMonthScheduleFormatHtml,
  sendOjtAdvanceMail,
  sendOjtCancelMail,
  sendOjtCompletionMail,
  sendOjtSecurityObsMail,
} from '../_lib/training/ojt-mail.js'
import { sendTrainingVehicleAskMail } from '../_lib/training/ojt-vehicle-mail.js'
import {
  buildGuardsScheduleWhatsAppText,
  confirmGuardAttendance,
  getTokenForSession,
  guardsLinkPublicUrl,
  loadGuardsResponses,
  marksListRows,
  prepareGuardsLink,
  summarizeGuardsLink,
} from '../_lib/training/ojt-guards-link-store.js'
import {
  buildTrainingGuardRoster,
  defaultInviteUnits,
  listGuardsGroupedByUnit,
  listTrainingUnitOptions,
  trainingGuardScopeMode,
  trainingGuardScopeNote,
} from '../_lib/training/ojt-guard-scope.js'
import {
  displaySiteLocation,
  previewTrainingConfirmWa,
  sendAttendanceRequestToResponded,
  sendTopicQuizToAttended,
  sendTrainingConfirmToGuards,
} from '../_lib/training/ojt-guards-wa-send.js'
import { guardsWhatsAppReady } from '../_lib/guards/whatsapp-send.js'
import {
  completionReportMissingColumns,
  deleteOjtReport,
  deleteSessionAndReport,
  emptyOjtReport,
  findSession,
  findSessionAcrossBranches,
  isAllowedSecObsEvidence,
  loadMonthSessions,
  loadOjtReport,
  monthOf,
  normalizeOjtReport,
  normalizeOjtSession,
  normalizeTrainingGuardRows,
  ojtClientEmailsFromSession,
  saveOjtReport,
  storageOk,
  upsertSession,
  type OjtCompletionPhoto,
  type OjtEvidenceFile,
  type OjtReport,
  type OjtSession,
} from '../_lib/training/ojt-store.js'

function lightOjtReport(report: OjtReport) {
  return {
    ...report,
    marksFileBase64: report.marksFileBase64 ? '__stored__' : '',
    completionPhotos: (report.completionPhotos || []).map((p) => ({
      ...p,
      base64: p.base64 ? '__stored__' : '',
    })),
    securityObsClosureFiles: (report.securityObsClosureFiles || []).map((f) => ({
      ...f,
      base64: f.base64 ? '__stored__' : '',
    })),
  }
}

/** Keep stored photo bytes when client sends `__stored__` placeholders. */
function mergeCompletionPhotos(existing: OjtCompletionPhoto[], incoming: unknown): OjtCompletionPhoto[] {
  if (!Array.isArray(incoming)) return existing || []
  const byId = new Map((existing || []).map((p) => [p.id, p]))
  const out: OjtCompletionPhoto[] = []
  for (const p of incoming.slice(0, 3)) {
    if (!p || typeof p !== 'object') continue
    const row = p as Partial<OjtCompletionPhoto>
    const id = String(row.id || '').slice(0, 40)
    const b64 = String(row.base64 ?? '').trim()
    if (!b64 || b64 === '__stored__') {
      const kept = id ? byId.get(id) : undefined
      if (kept) out.push(kept)
      continue
    }
    out.push({
      id: id || `ph${Date.now().toString(36)}${out.length}`,
      name: String(row.name || `photo-${out.length + 1}.jpg`).slice(0, 200),
      type: String(row.type || 'image/jpeg').slice(0, 120),
      base64: b64,
    })
  }
  return out
}

function mergeClosureFiles(existing: OjtEvidenceFile[], incoming: unknown): OjtEvidenceFile[] {
  if (!Array.isArray(incoming)) return existing || []
  const byId = new Map((existing || []).map((f) => [f.id, f]))
  const out: OjtEvidenceFile[] = []
  for (const f of incoming.slice(0, 5)) {
    if (!f || typeof f !== 'object') continue
    const row = f as Partial<OjtEvidenceFile>
    const id = String(row.id || '').slice(0, 40)
    const name = String(row.name || '').slice(0, 200)
    const type = String(row.type || '').slice(0, 120)
    const b64 = String(row.base64 ?? '')
      .replace(/^data:[^;]+;base64,/, '')
      .replace(/\s/g, '')
      .trim()
    if (!b64 || b64 === '__stored__') {
      const kept = id ? byId.get(id) : undefined
      if (kept) out.push(kept)
      continue
    }
    if (!isAllowedSecObsEvidence(name, type)) continue
    out.push({
      id: id || `ev${Date.now().toString(36)}${out.length}`,
      name: name || `evidence-${out.length + 1}`,
      type: type || 'application/octet-stream',
      base64: b64.slice(0, 2_000_000),
    })
  }
  return out
}
import {
  loadOjtTopics,
  saveOjtTopic,
  setOjtTopicActive,
  type OjtTopic,
} from '../_lib/training/ojt-topics-catalog.js'

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(status).json(body)
}

function todayYmd(): string {
  const d = new Date()
  const z = (n: number) => (n < 10 ? `0${n}` : String(n))
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`
}

function readToken(req: VercelRequest): string {
  return (
    String(req.headers['x-suite-token'] ?? '').trim() ||
    String((req.body as { token?: string })?.token ?? '').trim() ||
    String(req.query.suite_token ?? '').trim()
  )
}

async function suggestBranchHeadEmail(branchId: string): Promise<string> {
  const users = await getUsers()
  const bid = String(branchId ?? '').trim()
  const match = users.find((u) => {
    if (u.active === false) return false
    if (String(u.branchId ?? '').trim() !== bid) return false
    const role = String(u.role ?? '').toLowerCase()
    return /branch manager|hod|operations manager|rm|regional/.test(role)
  })
  return match?.email ? String(match.email) : ''
}

async function resolveSession(
  branchId: string,
  sessionId: string,
  month: string,
  alsoSearchBranchIds: string[] = [],
  trainingDate?: string,
): Promise<{ session: OjtSession; month: string } | null> {
  const tryIds = [...new Set([branchId, ...alsoSearchBranchIds].map((x) => String(x || '').trim()).filter(Boolean))]
  const wide = await findSessionAcrossBranches(sessionId, tryIds, trainingDate || month)
  if (wide) return { session: wide.session, month: wide.month }
  const hints =
    month && /^\d{4}-\d{2}$/.test(month)
      ? (() => {
          const [y, m] = month.split('-').map(Number)
          const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
          const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
          return [month, todayYmd(), prev, next]
        })()
      : [month, todayYmd()]
  for (const bid of tryIds) {
    const found = await findSession(bid, sessionId, hints)
    if (found) return found
  }
  return null
}

/** Management / TD: search every operating branch when opening a report from the all-branch board. */
async function resolveSessionForReport(
  branchId: string,
  sessionId: string,
  month: string,
  coveredIds: string[],
  opts: { isMgmt: boolean; trainingDate?: string },
): Promise<{ session: OjtSession; month: string } | null> {
  const bid = String(branchId || '').trim()
  const trainingDate = String(opts.trainingDate || '').slice(0, 10)
  let searchIds = [...coveredIds]
  if (opts.isMgmt) {
    const all = await getBranches(true)
    searchIds = [
      bid,
      ...coveredIds,
      ...all.map((b) => b.id).filter((id) => !isTrainingDepartmentBranch({ id })),
    ]
  } else {
    searchIds = [bid, ...coveredIds]
  }
  return resolveSession(bid, sessionId, monthOf(trainingDate) || month, searchIds, trainingDate || month)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' })
  try {
    if (!storageOk()) return json(res, 503, { ok: false, error: 'Storage is not configured.' })

    const session = await verifyAppSession(readToken(req), 'training')
    if (!session) return json(res, 401, { ok: false, error: 'Please sign in again.' })

    const body = (req.body || {}) as Record<string, unknown>
    const action = String(body.action ?? '').trim()
    const isMgmt = session.role === 'management'
    /** training@ — Track-1 for Hyderabad-A, Hyderabad-B, Hi-Tech City. */
    const isTdManager = isTrainingDeptManagerEmail(session.email)
    const isDualAdmin = isSuiteAdminEmail(session.email)
    const sessionBranchId = String(session.branchId ?? '').trim()
    const loggedInAsTrainingDept = isTrainingDepartmentBranch({ id: sessionBranchId })
    /**
     * Management, training@, Training Department branch, or Director on HOD portal
     * before a branch is bound (safety net — login normally asks for branch).
     */
    const useTdScope = isMgmt || isTdManager || loggedInAsTrainingDept || (isDualAdmin && !sessionBranchId)
    let branchId = String(body.branchId ?? sessionBranchId).trim()
    /** Branch HOD / lecturer — always their own branch only (never Hyd-A+B+Hi-Tech combined). */
    const isBranchHod = !isMgmt && !isTdManager && !loggedInAsTrainingDept && !(isDualAdmin && !sessionBranchId)
    if (isBranchHod) branchId = sessionBranchId
    const workBranchFromBody = String(body.workBranchId ?? '').trim()
    const month = monthOf(String(body.month ?? todayYmd())) || monthOf(todayYmd())

    if (action === 'lmsUrl') {
      return json(res, 200, {
        ok: true,
        url: trainingTargetUrl(isMgmt ? 'management' : 'lecturer'),
      })
    }

    if (action === 'listMonth') {
      const trainingDept = useTdScope ? await ensureTrainingDepartmentBranch() : null
      const covered = useTdScope ? await resolveTrainingDeptCoveredBranches() : []
      let branches = useTdScope ? await getBranches(true) : []
      if (useTdScope && trainingDept && !branches.some((b) => b.id === trainingDept.id)) {
        branches = [trainingDept, ...branches]
      }
      // Prefer Training Department first for management / Training Manager picker
      if (useTdScope) {
        branches = [
          ...branches.filter((b) => isTrainingDepartmentBranch(b)),
          ...branches.filter((b) => !isTrainingDepartmentBranch(b)),
        ]
      }
      /** Staff Training Manager / Training Department branch always works under TD scope. */
      if ((isTdManager || loggedInAsTrainingDept) && !isMgmt && trainingDept) branchId = trainingDept.id
      if (!branchId && useTdScope && trainingDept) branchId = trainingDept.id
      if (!branchId && useTdScope && branches[0]) branchId = branches[0].id
      if (!branchId && isBranchHod) branchId = sessionBranchId
      if (!branchId) return json(res, 400, { ok: false, error: 'Branch is required.' })
      const selected = branches.find((b) => b.id === branchId) || trainingDept
      const isTdSelected = useTdScope && isTrainingDepartmentBranch(selected || { id: branchId })
      /** `all` = Hyd-A + Hyd-B + Hi-Tech clients/schedules together. */
      const workRaw = isTdSelected
        ? String(workBranchFromBody || 'all').trim()
        : String(workBranchFromBody || branchId).trim()
      const workBranchId = workRaw === 'all' || !workRaw ? (isTdSelected ? 'all' : branchId) : workRaw
      const loadIds =
        isTdSelected && (workBranchId === 'all' || !workBranchId)
          ? covered.map((b) => b.id)
          : isTdSelected && covered.some((b) => b.id === workBranchId)
            ? [workBranchId]
            : [workBranchId || branchId]

      const sessionLists = await Promise.all(loadIds.map((id) => loadMonthSessions(id, month)))
      const sessions = sessionLists
        .flat()
        .map((s) => {
          /** Backfill topic name onto reply fields for older client “add topic” replies. */
          if (!s.clientReplyTopic && s.clientReplyNote) {
            const m = String(s.clientReplyNote).match(/topic:\s*(.+)$/i)
            if (m && m[1]) {
              s = {
                ...s,
                clientReplyTopic: String(m[1]).trim().slice(0, 200),
                clientReplyAction: s.clientReplyAction || 'addTopic',
              }
            }
          }
          return s
        })
        .sort((a, b) => {
          const da = String(a.trainingDate || '').localeCompare(String(b.trainingDate || ''))
          if (da) return da
          return String(a.trainingTime || '').localeCompare(String(b.trainingTime || ''))
        })

      /** Training Department / training@ — always Hyd-A + Hyd-B + Hi-Tech clients only. */
      const loadClientsAsTrainingDept =
        isTdManager || loggedInAsTrainingDept || isTdSelected
      const clientBranchIds = isBranchHod
        ? [sessionBranchId].filter(Boolean)
        : loadClientsAsTrainingDept
          ? covered.map((b) => b.id)
          : loadIds
      let clients: Array<{
        id: string
        name: string
        location: string
        branchId: string
        branchName: string
      }>
      if (loadClientsAsTrainingDept && covered.length) {
        clients = await loadTrainingDeptClientPicks()
        if (workBranchId !== 'all' && workBranchId && covered.some((b) => b.id === workBranchId)) {
          clients = clients.filter((c) => c.branchId === workBranchId)
        }
      } else {
        const clientLists = await Promise.all(
          clientBranchIds.map(async (id) => {
            const br = covered.find((b) => b.id === id) || branches.find((b) => b.id === id)
            const rows = await getClients(id, { skipRepair: true })
            return rows
              .filter((c) => c.active !== false)
              .map((c) => ({
                id: c.id,
                name: c.name,
                location: displaySiteLocation(c.name, c.location || ''),
                branchId: c.branchId || id,
                branchName: br?.name || id,
              }))
          }),
        )
        clients = clientLists.flat()
      }
      /** If Train-for-branch is a single zone, still keep full list but sort that branch first. */
      clients.sort((a, b) => {
        if (workBranchId !== 'all' && workBranchId) {
          const aHit = a.branchId === workBranchId ? 0 : 1
          const bHit = b.branchId === workBranchId ? 0 : 1
          if (aHit !== bHit) return aHit - bHit
        }
        return (
          String(a.branchName || '').localeCompare(String(b.branchName || ''), 'en', {
            sensitivity: 'base',
          }) ||
          String(a.name || '').localeCompare(String(b.name || ''), 'en', { sensitivity: 'base' })
        )
      })

      const suggestId = workBranchId !== 'all' ? workBranchId : covered[0]?.id || branchId
      const bh = await suggestBranchHeadEmail(suggestId)
      const ojtTopics = await loadOjtTopics({ includeInactive: true })
      return json(res, 200, {
        ok: true,
        role: session.role,
        trainingDeptManager: isTdManager || isMgmt || loggedInAsTrainingDept,
        clientScope: isBranchHod
          ? 'branch-hod'
          : isTdManager || loggedInAsTrainingDept || isTdSelected
            ? 'training-dept'
            : 'branch',
        branchId,
        workBranchId: isTdSelected ? workBranchId : isBranchHod ? sessionBranchId : suggestId,
        month,
        sessions,
        clients,
        branches: (useTdScope ? branches : []).map((b) => ({
          id: b.id,
          name: b.name,
          isTrainingDepartment: isTrainingDepartmentBranch(b),
        })),
        trainingDeptBranches: [
          { id: 'all', name: 'All three — Hyderabad-A · Hyderabad-B · Hi-Tech City' },
          ...covered.map((b) => ({ id: b.id, name: b.name })),
        ],
        questionSubjects: [...OJT_QUESTION_SUBJECTS],
        ojtTopics,
        suggestBranchHeadEmail: bh,
      })
    }

    if (action === 'listOjtTopics') {
      const ojtTopics = await loadOjtTopics({ includeInactive: true })
      return json(res, 200, { ok: true, ojtTopics })
    }

    if (action === 'saveOjtTopic') {
      const raw = (body.topic || body) as Partial<OjtTopic>
      const saved = await saveOjtTopic(
        {
          id: String(raw.id || '').trim() || undefined,
          title: String(raw.title ?? '').trim(),
          category: String(raw.category ?? '').trim(),
          clientSuggested: raw.clientSuggested !== false,
          active: raw.active !== false,
        },
        session.email,
      )
      if (!saved.ok) return json(res, 400, { ok: false, error: saved.error })
      const ojtTopics = await loadOjtTopics({ includeInactive: true })
      return json(res, 200, { ok: true, topic: saved.topic, ojtTopics })
    }

    if (action === 'setOjtTopicActive') {
      const topicId = String(body.topicId ?? body.id ?? '').trim()
      const active = body.active !== false && String(body.active) !== 'false'
      if (!topicId) return json(res, 400, { ok: false, error: 'Topic id is required.' })
      const updated = await setOjtTopicActive(topicId, active, session.email)
      if (!updated.ok) return json(res, 400, { ok: false, error: updated.error })
      const ojtTopics = await loadOjtTopics({ includeInactive: true })
      return json(res, 200, { ok: true, topic: updated.topic, ojtTopics })
    }

    const coveredForOps = useTdScope ? await resolveTrainingDeptCoveredBranches() : []
    const coveredIds = coveredForOps.map((b) => b.id)
    /** Physical branch for schedules / clients (not Training Department id / not "all"). */
    let dataBranchId = workBranchFromBody || branchId
    if (
      useTdScope &&
      (dataBranchId === 'all' ||
        dataBranchId === TRAINING_DEPARTMENT_ID ||
        isTrainingDepartmentBranch({ id: dataBranchId }))
    ) {
      dataBranchId = coveredIds[0] || dataBranchId
    }
    if (
      !isMgmt &&
      isTdManager &&
      dataBranchId &&
      dataBranchId !== 'all' &&
      coveredIds.length &&
      !coveredIds.includes(dataBranchId)
    ) {
      return json(res, 403, {
        ok: false,
        error: 'Training Manager may schedule only Hyderabad-A, Hyderabad-B, or Hi-Tech City.',
      })
    }

    if (!dataBranchId && !branchId && action !== 'dashboard') {
      return json(res, 400, { ok: false, error: 'Branch is required.' })
    }

    if (action === 'saveSession') {
      const raw = (body.session || {}) as Partial<OjtSession>
      const targetBranch = String(raw.branchId || dataBranchId || branchId).trim()
      if (isBranchHod) {
        if (targetBranch && targetBranch !== sessionBranchId) {
          return json(res, 403, { ok: false, error: 'You may schedule training only for your branch.' })
        }
        if (raw.clientId) {
          const hodClients = await getClients(sessionBranchId, { skipRepair: true })
          const okClient = hodClients.some((c) => c.id === raw.clientId && c.active !== false)
          if (!okClient) {
            return json(res, 403, { ok: false, error: 'Please select a client from your branch list.' })
          }
        }
      } else if (!isMgmt && !isTdManager && !loggedInAsTrainingDept && raw.branchId && raw.branchId !== branchId) {
        return json(res, 403, { ok: false, error: 'Branch mismatch.' })
      }
      if ((isTdManager || loggedInAsTrainingDept) && !isMgmt && coveredIds.length && !coveredIds.includes(targetBranch)) {
        return json(res, 403, {
          ok: false,
          error: 'Training Manager may schedule only Hyderabad-A, Hyderabad-B, or Hi-Tech City.',
        })
      }
      if ((isTdManager || loggedInAsTrainingDept || (useTdScope && isTrainingDepartmentBranch({ id: branchId }))) && raw.clientId) {
        const tdClients = await loadTrainingDeptClientPicks()
        const okClient = tdClients.some((c) => c.id === raw.clientId)
        if (!okClient) {
          return json(res, 403, {
            ok: false,
            error:
              'That client is not under Hyderabad-A, Hyderabad-B, or Hi-Tech City. Training Department can schedule only those three branches.',
          })
        }
        if (targetBranch && coveredForOps.length && !isTrainingDeptCoveredClientBranch(targetBranch, coveredForOps)) {
          return json(res, 403, {
            ok: false,
            error: 'Training Department may schedule only Hyderabad-A, Hyderabad-B, or Hi-Tech City.',
          })
        }
      }
      const saveBranch = isBranchHod
        ? sessionBranchId
        : isMgmt || isTdManager || loggedInAsTrainingDept
          ? targetBranch
          : branchId
      const row = normalizeOjtSession(
        {
          ...raw,
          branchId: saveBranch,
          branchHeadEmail: raw.branchHeadEmail || (await suggestBranchHeadEmail(saveBranch)),
          feedbackGuard: 'Yes',
          feedbackClient: 'Yes',
          feedbackPlanned: 'Yes',
        },
        saveBranch,
      )
      if (!row.trainingDate) return json(res, 400, { ok: false, error: 'Training date is required.' })
      if (!row.clientId) return json(res, 400, { ok: false, error: 'Client is required.' })
      if (!row.topic1 && !row.topic2 && !row.topic3 && !row.topic4 && !row.topic5) {
        return json(res, 400, { ok: false, error: 'Select at least one training topic from the list.' })
      }
      {
        const topicVals = [row.topic1, row.topic2, row.topic3, row.topic4, row.topic5]
          .map((t) => String(t || '').trim().toLowerCase().replace(/\s+/g, ' '))
          .filter(Boolean)
        if (new Set(topicVals).size !== topicVals.length) {
          return json(res, 400, {
            ok: false,
            error: 'Same topic selected twice. Please choose different topics.',
          })
        }
      }
      if (!row.tableTop) return json(res, 400, { ok: false, error: 'Table Top Exercise (Yes/No) is required.' })
      if (row.status === 'Draft') row.status = 'Scheduled'
      /** Keep Training invite-unit ticks unless the schedule payload explicitly sends them. */
      if (row.id) {
        const prev = await findSession(saveBranch, row.id, [row.trainingDate])
        if (prev?.session) {
          if (!Array.isArray(raw.trainingInviteUnits)) {
            row.trainingInviteUnits = prev.session.trainingInviteUnits || []
            row.trainingInviteUnitsBy = prev.session.trainingInviteUnitsBy || ''
            row.trainingInviteUnitsAt = prev.session.trainingInviteUnitsAt || ''
            row.trainingGuardRows = prev.session.trainingGuardRows || []
          }
          row.controlCaseNo = row.controlCaseNo || prev.session.controlCaseNo || ''
          row.vehicleDriverName = prev.session.vehicleDriverName || ''
          row.vehicleRegNo = prev.session.vehicleRegNo || ''
          row.vehicleAcceptedAt = prev.session.vehicleAcceptedAt || ''
          row.vehicleAskedAt = prev.session.vehicleAskedAt || ''
          if (prev.session.controlCaseNo) row.vehicleRequired = true
        }
      }
      let controlNote = ''
      if (row.vehicleRequired && !row.controlCaseNo) {
        const copied = await copyVehicleRequirementToControl({
          kind: 'training',
          branchId: saveBranch,
          visitDate: row.trainingDate,
          visitTime: row.trainingTime,
          officerName: row.trainerName,
          clientName: row.clientName,
          location: row.location,
          purpose: 'On Site Tactical Training (OJT)',
          sourceId: row.id,
          byEmail: String(session.email || row.trainerEmail || ''),
          byName: row.trainerName || String(session.email || 'Trainer'),
        })
        if (copied.ok) {
          row.controlCaseNo = copied.caseNo
          row.vehicleAskedAt = row.vehicleAskedAt || new Date().toISOString()
          if (!copied.skipped) {
            const mailed = await sendTrainingVehicleAskMail(row)
            controlNote = mailed.ok
              ? `Schedule saved. Control has been mailed to confirm the vehicle (${copied.caseNo}).`
              : `Schedule saved and sent to Control as ${copied.caseNo}, but the mail did not go: ${mailed.error}`
          } else {
            controlNote = `Schedule saved. Control case ${copied.caseNo} already linked.`
          }
        } else {
          controlNote = `Schedule saved, but Control copy failed: ${copied.error}`
        }
      }
      const saved = await upsertSession(row)
      if (!saved.ok) return json(res, 500, { ok: false, error: 'Could not save session.' })
      return json(res, 200, { ok: true, session: saved.session, controlNote })
    }

    if (action === 'cancelSession') {
      const sessionId = String(body.sessionId ?? '').trim()
      const reason = String(body.cancelReason ?? body.reason ?? '').trim()
      if (!reason) return json(res, 400, { ok: false, error: 'Please enter the cancellation reason.' })
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      if (found.session.status === 'Cancelled' && found.session.cancelSentAt) {
        return json(res, 400, { ok: false, error: 'This schedule is already cancelled and shared.' })
      }
      const row = { ...found.session }
      row.cancelReason = reason.slice(0, 2000)
      if (!row.branchHeadEmail) row.branchHeadEmail = await suggestBranchHeadEmail(row.branchId)
      if (!ojtClientEmailsFromSession(row).length) {
        return json(res, 400, { ok: false, error: 'Client email is required to share cancellation. Enter up to 3 on the schedule.' })
      }
      const mailed = await sendOjtCancelMail(row)
      if (!mailed.ok) return json(res, 400, { ok: false, error: mailed.error || 'Cancel mail failed' })
      row.status = 'Cancelled'
      row.cancelSentAt = new Date().toISOString()
      row.cancelSentBy = session.email
      row.cancelMessageId = mailed.messageId || ''
      const saved = await upsertSession(row)
      if (!saved.ok) return json(res, 500, { ok: false, error: 'Cancelled mail sent but save failed.' })
      return json(res, 200, { ok: true, session: saved.session, messageId: mailed.messageId || '' })
    }

    /**
     * Management (and Director/IT dual admins) — one-shot wipe:
     * deletes the training schedule AND the observation / completion report together.
     */
    if (action === 'deleteSession' || action === 'purgeTestSession') {
      const email = String(session.email || '')
        .trim()
        .toLowerCase()
      const dualAdmin = ['director@agilegroup.co.in', 'sai@agilegroup.co.in'].includes(
        email,
      )
      if (!isMgmt && !dualAdmin) {
        return json(res, 403, {
          ok: false,
          error:
            'Delete both is only on Management Training (or Director login). Open Management portal, then try again.',
        })
      }
      const sessionId = String(body.sessionId ?? '').trim()
      if (!sessionId) return json(res, 400, { ok: false, error: 'Session is required.' })
      const bid = String(body.branchId ?? body.workBranchId ?? dataBranchId ?? '').trim()
      const trainingDate = String(body.trainingDate ?? body.month ?? month).slice(0, 10)
      const allBranches = await getBranches(true)
      const searchIds = [
        bid,
        ...coveredIds,
        ...allBranches.map((b) => b.id).filter((id) => !isTrainingDepartmentBranch({ id })),
      ]
      let found = await findSessionAcrossBranches(sessionId, searchIds, trainingDate)
      if (!found) {
        const legacy = await resolveSession(
          bid || dataBranchId,
          sessionId,
          monthOf(trainingDate) || month,
          searchIds,
        )
        if (legacy) {
          found = {
            session: legacy.session,
            month: legacy.month,
            branchId: legacy.session.branchId || bid || dataBranchId,
          }
        }
      }
      if (!found) {
        /** Still drop orphan report if schedule row already missing. */
        await deleteOjtReport(sessionId)
        return json(res, 404, {
          ok: false,
          error: 'Could not find that schedule to delete. Refresh the list, then press Delete both again.',
        })
      }
      const branchForDelete = found.session.branchId || found.branchId || bid
      const monthForDelete = found.month || monthOf(found.session.trainingDate) || month
      const wiped = await deleteSessionAndReport(branchForDelete, sessionId, monthForDelete)
      if (!wiped.ok) {
        return json(res, 500, { ok: false, error: 'Delete failed — please try Delete both once more.' })
      }
      return json(res, 200, {
        ok: true,
        scheduleRemoved: wiped.scheduleRemoved,
        reportRemoved: wiped.reportRemoved,
        message: 'Deleted both — schedule and observation report removed.',
      })
    }

    /** Management only — delete observation / completion report only (keep the schedule). */
    if (action === 'deleteSecObsReport') {
      const email = String(session.email || '')
        .trim()
        .toLowerCase()
      const dualAdmin = ['director@agilegroup.co.in', 'sai@agilegroup.co.in'].includes(
        email,
      )
      if (!isMgmt && !dualAdmin) {
        return json(res, 403, {
          ok: false,
          error: 'Delete report is available on the Management portal only.',
        })
      }
      const sessionId = String(body.sessionId ?? '').trim()
      if (!sessionId) return json(res, 400, { ok: false, error: 'Session is required.' })
      const ok = await deleteOjtReport(sessionId)
      return json(
        res,
        ok ? 200 : 500,
        ok
          ? { ok: true, message: 'Observation / completion report deleted. Schedule kept.' }
          : { ok: false, error: 'Could not delete report.' },
      )
    }

    if (action === 'previewAdvance') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const revised = Boolean(found.session.notifySentAt)
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'www.agilegroup-digital.co.in')
      const proto = String(req.headers['x-forwarded-proto'] || 'https')
      const origin = `${proto}://${host}`
      const prepared = await prepareClientReplyLink(found.session, month)
      const replyUrl = prepared.ok
        ? clientReplyPublicUrl(prepared.meta.token, origin)
        : ''
      if (prepared.ok && prepared.meta.token && found.session.clientReplyToken !== prepared.meta.token) {
        await upsertSession({ ...found.session, clientReplyToken: prepared.meta.token })
      }
      const html = buildAdvanceNoticeHtml(found.session, {
        replyUrl:
          replyUrl ||
          (found.session.clientReplyToken
            ? clientReplyPublicUrl(found.session.clientReplyToken, origin)
            : ''),
        revised,
      })
      return json(res, 200, {
        ok: true,
        revised,
        replyUrl:
          replyUrl ||
          (found.session.clientReplyToken
            ? clientReplyPublicUrl(found.session.clientReplyToken, origin)
            : ''),
        subject: revised ? 'OJT intimation (updated) — preview' : 'OJT training intimation — preview',
        html,
        /** Kept for older clients; prefer `html` for actual format preview. */
        preview: html
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
      })
    }

    if (action === 'previewMonthSchedule') {
      const loadIds =
        useTdScope &&
        (workBranchFromBody === 'all' ||
          !workBranchFromBody ||
          workBranchFromBody === TRAINING_DEPARTMENT_ID ||
          isTrainingDepartmentBranch({ id: workBranchFromBody || branchId }))
          ? coveredIds.length
            ? coveredIds
            : [dataBranchId].filter(Boolean)
          : [dataBranchId || branchId].filter(Boolean)
      const monthSessions = (
        await Promise.all(loadIds.map((id) => loadMonthSessions(id, month)))
      ).flat()
      const allBranches = await getBranches(true)
      const branchLabel = (() => {
        if (loadIds.length > 1) {
          return coveredForOps.map((b) => b.name).filter(Boolean).join(' · ') || 'Covered branches'
        }
        const id = loadIds[0] || dataBranchId
        return allBranches.find((b) => b.id === id)?.name || id || 'Branch'
      })()
      const html = buildMonthScheduleFormatHtml(month, monthSessions, {
        branchLabel,
        viewerLabel: String(session.email || ''),
      })
      return json(res, 200, {
        ok: true,
        subject: `OJT monthly training schedule — ${month}`,
        html,
      })
    }

    if (action === 'sendAdvance') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const row = { ...found.session }
      if (!row.branchHeadEmail) row.branchHeadEmail = await suggestBranchHeadEmail(row.branchId)
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'www.agilegroup-digital.co.in')
      const proto = String(req.headers['x-forwarded-proto'] || 'https')
      const revised = Boolean(row.notifySentAt)
      const mailed = await sendOjtAdvanceMail(row, { origin: `${proto}://${host}`, revised })
      if (!mailed.ok) return json(res, 400, { ok: false, error: mailed.error || 'Mail failed' })
      row.notifySentAt = new Date().toISOString()
      row.notifySentBy = session.email
      row.notifyMessageId = mailed.messageId || ''
      if (mailed.replyUrl) {
        try {
          const u = new URL(mailed.replyUrl)
          row.clientReplyToken = u.searchParams.get('t') || row.clientReplyToken
        } catch {
          /* keep existing token */
        }
      }
      if (row.status === 'Scheduled' || row.status === 'Draft') row.status = 'ClientNotified'
      const saved = await upsertSession(row)
      return json(res, 200, {
        ok: true,
        session: saved.session,
        messageId: mailed.messageId || '',
        revised: mailed.revised,
        replyUrl: mailed.replyUrl || '',
      })
    }

    if (action === 'previewTrainingConfirmWa' || action === 'sendTrainingConfirmWa') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'www.agilegroup-digital.co.in')
      const proto = String(req.headers['x-forwarded-proto'] || 'https')
      const origin = `${proto}://${host}`
      if (action === 'previewTrainingConfirmWa') {
        /** Message + confirmation link only — guards list uses listTrainingGuards. */
        const preview = await previewTrainingConfirmWa(found.session, origin, session.email)
        if (!preview.ok) return json(res, 400, { ok: false, error: preview.error })
        return json(res, 200, {
          ok: true,
          text: preview.text,
          url: preview.url,
          waReady: guardsWhatsAppReady(),
          whatsappUrl: `https://wa.me/?text=${encodeURIComponent(preview.text)}`,
          scopeNote: trainingGuardScopeNote(found.session),
        })
      }
      const mobiles = Array.isArray(body.mobiles)
        ? (body.mobiles as unknown[]).map((m) => String(m || '').trim()).filter(Boolean)
        : []
      const availableUnits = await listTrainingUnitOptions(found.session)
      const sendUnits = (found.session.trainingInviteUnits || []).length
        ? found.session.trainingInviteUnits
        : defaultInviteUnits(found.session, availableUnits)
      const sendSession = { ...found.session, trainingInviteUnits: sendUnits }
      const sent = await sendTrainingConfirmToGuards({
        session: sendSession,
        origin,
        createdBy: session.email,
        mobiles,
      })
      /** ok=true when link/message prepared; sendOk=true when at least one WhatsApp delivered. */
      return json(res, sent.url || sent.text ? 200 : 400, {
        ...sent,
        ok: Boolean(sent.url || sent.text),
        sendOk: sent.ok,
        whatsappUrl: sent.text ? `https://wa.me/?text=${encodeURIComponent(sent.text)}` : '',
        scopeMode: trainingGuardScopeMode(found.session),
        scopeNote: trainingGuardScopeNote(sendSession),
        trainingInviteUnits: sendUnits,
        availableUnits,
      })
    }

    /**
     * Step 1: client-wise unit / location names only (toggles). No guards yet.
     * Does NOT edit Branch clients.
     */
    if (action === 'listTrainingUnits') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const clientName = String(found.session.clientName || '').trim()
      if (!clientName) {
        return json(res, 400, {
          ok: false,
          error:
            'This session has no client name saved. Open Schedule, select the client again, tap Save, then return here.',
          availableUnits: [],
          trainingInviteUnits: [],
          tableRows: [],
          guards: [],
        })
      }
      const availableUnits = await listTrainingUnitOptions(found.session)
      /** Suggest booked venue only (if it matches a unit) — do not auto-tick every unit. */
      const loc = String(found.session.location || '').trim()
      const suggested = availableUnits.filter(
        (u) =>
          loc &&
          (u.toLowerCase() === loc.toLowerCase() ||
            u.toLowerCase().includes(loc.toLowerCase()) ||
            loc.toLowerCase().includes(u.toLowerCase())),
      )
      const saved = (found.session.trainingInviteUnits || []).filter((u) =>
        availableUnits.some((a) => a === u || a.toLowerCase() === u.toLowerCase()),
      )
      const trainingInviteUnits = saved.length ? saved : suggested
      const isKrc = /\b(krc|k raheja|kraheja|mindspace|sundew|stargaze|raheja)\b/i.test(clientName)
      return json(res, 200, {
        ok: true,
        availableUnits,
        trainingInviteUnits,
        tableRows: [],
        guards: [],
        scopeNote: isKrc
          ? `Client: ${clientName} — related KRC unit / location names on this branch. Toggle only the buildings you need, then tap Load guards for selected units.`
          : `Client: ${clientName} — unit / location names on this branch. Toggle only what you need, then tap Load guards for selected units.`,
        message:
          availableUnits.length === 0
            ? `No unit / location names yet for "${clientName}" on this branch. You can still Add guard below, or check MIS guards upload.`
            : `${availableUnits.length} unit(s) for this client. Toggle the ones you need, then Load guards.`,
      })
    }

    /**
     * Step 2+: guards for selected units only.
     * Does NOT edit Branch clients.
     */
    if (action === 'listTrainingGuards') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const availableUnits = await listTrainingUnitOptions(found.session)
      const selectedFromBody = Array.isArray(body.units)
        ? [...new Set((body.units as unknown[]).map((u) => String(u || '').trim()).filter(Boolean))]
        : null
      let effectiveUnits =
        selectedFromBody && selectedFromBody.length
          ? selectedFromBody
          : (found.session.trainingInviteUnits || []).filter(Boolean)
      if (!effectiveUnits.length) {
        return json(res, 400, {
          ok: false,
          error: 'Toggle at least one client unit / location, then Load guards for selected units.',
          availableUnits,
          trainingInviteUnits: [],
          tableRows: [],
        })
      }
      /** Only keep units that exist for this client. */
      effectiveUnits = effectiveUnits.filter((u) =>
        availableUnits.some((a) => a === u || a.toLowerCase() === u.toLowerCase()),
      )
      if (!effectiveUnits.length) {
        return json(res, 400, {
          ok: false,
          error: 'Selected units are not on this client list. Show client units again and toggle valid ones.',
          availableUnits,
          tableRows: [],
        })
      }

      const prevRows = normalizeTrainingGuardRows(found.session.trainingGuardRows)
      const fresh = await buildTrainingGuardRoster(
        { ...found.session, trainingInviteUnits: effectiveUnits, trainingGuardRows: [] },
        effectiveUnits.length ? effectiveUnits : undefined,
      )
      /** Keep trainer edits (name / rank / mobile / select) when rebuilding. */
      const roster = fresh.map((f) => {
        const old =
          prevRows.find((p) => !p.deleted && p.id === f.id) ||
          prevRows.find((p) => !p.deleted && p.mobile && p.mobile === f.mobile)
        if (!old) return f
        return {
          ...f,
          name: old.name || f.name,
          employeeId: old.employeeId || f.employeeId,
          rank: old.rank || f.rank,
          mobile: old.mobile || f.mobile,
          selectedForTraining: old.selectedForTraining !== false,
          deleted: false,
        }
      })
      /** Keep manually added guards (below the list) when reloading MIS units. */
      const freshKeys = new Set(
        roster.flatMap((r) => [r.id, r.mobile && r.mobile.length === 10 ? `m:${r.mobile}` : ''].filter(Boolean)),
      )
      for (const p of prevRows) {
        if (p.deleted) continue
        const key = p.id || (p.mobile.length === 10 ? `m:${p.mobile}` : '')
        if (!key || freshKeys.has(p.id) || (p.mobile.length === 10 && freshKeys.has(`m:${p.mobile}`))) continue
        roster.push({ ...p, deleted: false })
        freshKeys.add(p.id)
        if (p.mobile.length === 10) freshKeys.add(`m:${p.mobile}`)
      }

      /** Persist so Send / Select-all work without a separate Save. */
      if (roster.length || effectiveUnits.length) {
        await upsertSession({
          ...found.session,
          trainingInviteUnits: effectiveUnits.length ? effectiveUnits : found.session.trainingInviteUnits || [],
          trainingInviteUnitsBy: found.session.trainingInviteUnitsBy || session.email,
          trainingInviteUnitsAt: found.session.trainingInviteUnitsAt || new Date().toISOString(),
          trainingGuardRows: roster,
        })
      }

      const responses = await loadGuardsResponses(found.session.id)
      const byMobile = new Map(
        responses
          .filter((r) => String(r.mobile || '').replace(/\D/g, '').slice(-10).length === 10)
          .map((r) => [String(r.mobile || '').replace(/\D/g, '').slice(-10), r]),
      )
      const tableRows = roster.map((g, i) => {
        const m = String(g.mobile || '').replace(/\D/g, '').slice(-10)
        const resp = m.length === 10 ? byMobile.get(m) : undefined
        const bits: string[] = []
        if (resp?.eoiAt || resp?.status === 'attending') {
          bits.push(resp?.eoiJoiningDate ? `EOI DOJ ${resp.eoiJoiningDate}` : 'EOI')
        }
        if (resp?.attendedAt || resp?.attendanceConfirmedAt) bits.push('ATTENDANCE')
        if (resp?.testDoneAt && resp.score != null) bits.push(`Marks ${resp.score}/${resp.maxScore || 5}`)
        if (resp?.feedbackAt) bits.push('Feedback')
        return {
          sl: i + 1,
          id: g.id,
          unitName: g.unitName,
          name: g.name,
          employeeId: g.employeeId,
          rank: g.rank || '',
          mobile: g.mobile,
          selectedForTraining: g.selectedForTraining !== false,
          canWhatsApp: m.length === 10,
          response: bits.length ? bits.join(' · ') : '—',
          eoi: Boolean(resp?.eoiAt || resp?.status === 'attending'),
          attended: Boolean(resp?.attendedAt || resp?.attendanceConfirmedAt),
        }
      })
      return json(res, 200, {
        ok: true,
        scopeMode: trainingGuardScopeMode(found.session),
        scopeNote: trainingGuardScopeNote({
          ...found.session,
          trainingInviteUnits: effectiveUnits,
        }),
        availableUnits: availableUnits.length ? availableUnits : [...new Set(roster.map((r) => r.unitName).filter(Boolean))],
        trainingInviteUnits: effectiveUnits.length
          ? effectiveUnits
          : [...new Set(roster.map((r) => r.unitName).filter(Boolean))],
        tableRows,
        guards: tableRows,
        message:
          tableRows.length === 0
            ? availableUnits.length === 0
              ? 'No units / guards found on the MIS guards list for this client on this branch. Check the schedule branch and that guards are uploaded in MIS.'
              : `Found ${availableUnits.length} unit(s) but 0 guards. Check MIS guards names match this client (e.g. KRC / K Raheja).`
            : `Loaded ${tableRows.length} guard(s) across ${(availableUnits.length || effectiveUnits.length)} unit(s).`,
      })
    }

    /**
     * Training-only: save unit toggles + rebuild roster. Does NOT edit Branch clients.
     */
    if (action === 'saveTrainingInviteUnits') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const allowed = new Set(await listTrainingUnitOptions(found.session))
      const units = Array.isArray(body.units)
        ? [...new Set((body.units as unknown[]).map((u) => String(u || '').trim()).filter(Boolean))]
            .filter((u) => allowed.has(u) || [...allowed].some((a) => a.toLowerCase() === u.toLowerCase()))
            .slice(0, 80)
        : []
      if (!units.length) {
        return json(res, 400, {
          ok: false,
          error: 'Turn on at least one unit, then Save.',
        })
      }
      const prevRows = normalizeTrainingGuardRows(found.session.trainingGuardRows)
      const fresh = await buildTrainingGuardRoster(
        { ...found.session, trainingInviteUnits: units, trainingGuardRows: [] },
        units,
      )
      const merged = fresh.map((f) => {
        const old =
          prevRows.find((p) => p.id === f.id) ||
          prevRows.find((p) => p.mobile && p.mobile === f.mobile)
        if (!old) return f
        return {
          ...f,
          name: old.name || f.name,
          employeeId: old.employeeId || f.employeeId,
          rank: old.rank || f.rank,
          mobile: old.mobile || f.mobile,
          selectedForTraining: old.selectedForTraining !== false,
          deleted: false,
        }
      })
      const row = {
        ...found.session,
        trainingInviteUnits: units,
        trainingInviteUnitsBy: session.email,
        trainingInviteUnitsAt: new Date().toISOString(),
        trainingGuardRows: merged,
      }
      const saved = await upsertSession(row)
      if (!saved.ok) return json(res, 500, { ok: false, error: 'Could not save units.' })
      const responses = await loadGuardsResponses(saved.session.id)
      const byMobile = new Map(
        responses
          .filter((r) => String(r.mobile || '').replace(/\D/g, '').slice(-10).length === 10)
          .map((r) => [String(r.mobile || '').replace(/\D/g, '').slice(-10), r]),
      )
      const tableRows = merged.map((g, i) => {
        const m = String(g.mobile || '').replace(/\D/g, '').slice(-10)
        const resp = m.length === 10 ? byMobile.get(m) : undefined
        const bits: string[] = []
        if (resp?.eoiAt || resp?.status === 'attending') {
          bits.push(resp?.eoiJoiningDate ? `EOI DOJ ${resp.eoiJoiningDate}` : 'EOI')
        }
        if (resp?.attendedAt || resp?.attendanceConfirmedAt) bits.push('ATTENDANCE')
        if (resp?.testDoneAt && resp.score != null) bits.push(`Marks ${resp.score}/${resp.maxScore || 5}`)
        if (resp?.feedbackAt) bits.push('Feedback')
        return {
          sl: i + 1,
          id: g.id,
          unitName: g.unitName,
          name: g.name,
          employeeId: g.employeeId,
          rank: g.rank || '',
          mobile: g.mobile,
          selectedForTraining: g.selectedForTraining !== false,
          canWhatsApp: m.length === 10,
          response: bits.length ? bits.join(' · ') : '—',
          eoi: Boolean(resp?.eoiAt || resp?.status === 'attending'),
          attended: Boolean(resp?.attendedAt || resp?.attendanceConfirmedAt),
        }
      })
      return json(res, 200, {
        ok: true,
        session: saved.session,
        scopeNote: trainingGuardScopeNote(saved.session),
        availableUnits: await listTrainingUnitOptions(saved.session),
        trainingInviteUnits: units,
        tableRows,
        guards: tableRows,
        message: `Saved ${units.length} unit(s). ${tableRows.length} guard(s) listed. Branch clients unchanged.`,
      })
    }

    if (action === 'addTrainingGuardRow') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const name = String(body.name ?? '').trim().slice(0, 120)
      if (!name) return json(res, 400, { ok: false, error: 'Guard name is required.' })
      const mobileDigits = String(body.mobile ?? '')
        .replace(/\D/g, '')
        .slice(-10)
      const unitName =
        String(body.unitName ?? '').trim().slice(0, 200) ||
        String(found.session.location || found.session.clientName || 'Added').slice(0, 200)
      const rows = normalizeTrainingGuardRows(found.session.trainingGuardRows).filter((r) => !r.deleted)
      if (mobileDigits.length === 10 && rows.some((r) => r.mobile === mobileDigits)) {
        return json(res, 400, { ok: false, error: 'That mobile is already on this Training list.' })
      }
      const row = {
        id: `tg_${nid()}`,
        unitName,
        name,
        employeeId: String(body.employeeId ?? '').trim().slice(0, 80),
        rank: String(body.rank ?? '').trim().slice(0, 80),
        mobile: mobileDigits.length === 10 ? mobileDigits : String(body.mobile ?? '').trim().slice(0, 20),
        selectedForTraining: mobileDigits.length === 10,
        deleted: false,
      }
      const saved = await upsertSession({
        ...found.session,
        trainingGuardRows: [...rows, row],
      })
      if (!saved.ok) return json(res, 500, { ok: false, error: 'Could not add guard.' })
      return json(res, 200, {
        ok: true,
        session: saved.session,
        message: 'Guard added on this Training list only (Branch clients / MIS unchanged).',
      })
    }

    if (action === 'saveTrainingGuardRow') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const guardId = String(body.guardId ?? body.id ?? '').trim()
      const rows = normalizeTrainingGuardRows(found.session.trainingGuardRows)
      const idx = rows.findIndex((r) => r.id === guardId)
      if (idx < 0) return json(res, 404, { ok: false, error: 'Guard row not found on this Training list.' })
      const mobileRaw = String(body.mobile ?? rows[idx].mobile ?? '')
      const mobileDigits = mobileRaw.replace(/\D/g, '').slice(-10)
      rows[idx] = {
        ...rows[idx],
        name: String(body.name ?? rows[idx].name).slice(0, 120) || rows[idx].name,
        employeeId: String(body.employeeId ?? rows[idx].employeeId).slice(0, 80),
        rank: String(body.rank ?? rows[idx].rank).slice(0, 80),
        mobile: mobileDigits.length === 10 ? mobileDigits : String(body.mobile ?? rows[idx].mobile).slice(0, 20),
        selectedForTraining:
          typeof body.selectedForTraining === 'boolean'
            ? body.selectedForTraining
            : rows[idx].selectedForTraining !== false,
        deleted: false,
      }
      const saved = await upsertSession({ ...found.session, trainingGuardRows: rows })
      if (!saved.ok) return json(res, 500, { ok: false, error: 'Could not save guard row.' })
      return json(res, 200, { ok: true, session: saved.session, message: 'Guard updated on this Training list only.' })
    }

    if (action === 'deleteTrainingGuardRow') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const guardId = String(body.guardId ?? body.id ?? '').trim()
      const rows = normalizeTrainingGuardRows(found.session.trainingGuardRows).map((r) =>
        r.id === guardId ? { ...r, deleted: true, selectedForTraining: false } : r,
      )
      const saved = await upsertSession({ ...found.session, trainingGuardRows: rows })
      if (!saved.ok) return json(res, 500, { ok: false, error: 'Could not delete guard row.' })
      return json(res, 200, {
        ok: true,
        session: saved.session,
        message: 'Removed from this Training list only (Branch clients / MIS guards unchanged).',
      })
    }

    if (action === 'selectAllTrainingGuards') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const select = body.select !== false
      const rows = normalizeTrainingGuardRows(found.session.trainingGuardRows).map((r) =>
        r.deleted
          ? r
          : {
              ...r,
              selectedForTraining: select && String(r.mobile || '').replace(/\D/g, '').slice(-10).length === 10,
            },
      )
      const saved = await upsertSession({ ...found.session, trainingGuardRows: rows })
      if (!saved.ok) return json(res, 500, { ok: false, error: 'Could not update selection.' })
      return json(res, 200, {
        ok: true,
        session: saved.session,
        message: select ? 'All guards with mobile selected for Training.' : 'Selection cleared.',
      })
    }

    if (action === 'sendAttendanceRequestWa') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'www.agilegroup-digital.co.in')
      const proto = String(req.headers['x-forwarded-proto'] || 'https')
      const origin = `${proto}://${host}`
      const sent = await sendAttendanceRequestToResponded({
        session: found.session,
        origin,
        createdBy: session.email,
      })
      return json(res, sent.url || sent.text ? 200 : 400, {
        ...sent,
        ok: Boolean(sent.url || sent.text),
        sendOk: sent.ok,
        whatsappUrl: sent.text ? `https://wa.me/?text=${encodeURIComponent(sent.text)}` : '',
      })
    }

    if (action === 'sendTopicQuizWa') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'www.agilegroup-digital.co.in')
      const proto = String(req.headers['x-forwarded-proto'] || 'https')
      const origin = `${proto}://${host}`
      const sent = await sendTopicQuizToAttended({
        session: found.session,
        origin,
        createdBy: session.email,
      })
      return json(res, sent.url || sent.text ? 200 : 400, {
        ...sent,
        ok: Boolean(sent.url || sent.text),
        sendOk: sent.ok,
        whatsappUrl: sent.text ? `https://wa.me/?text=${encodeURIComponent(sent.text)}` : '',
      })
    }

    if (action === 'prepareGuardsLink') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const prepared = await prepareGuardsLink(found.session, session.email)
      if (!prepared.ok) return json(res, 400, { ok: false, error: prepared.error })
      const rows = await loadGuardsResponses(found.session.id)
      const summary = summarizeGuardsLink(rows)
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'www.agilegroup-digital.co.in')
      const proto = String(req.headers['x-forwarded-proto'] || 'https')
      const url = guardsLinkPublicUrl(prepared.meta.token, `${proto}://${host}`)
      const waText = encodeURIComponent(buildGuardsScheduleWhatsAppText(found.session, url))
      return json(res, 200, {
        ok: true,
        url,
        token: prepared.meta.token,
        whatsappUrl: `https://wa.me/?text=${waText}`,
        whatsappText: buildGuardsScheduleWhatsAppText(found.session, url),
        summary,
        roster: marksListRows(rows),
      })
    }

    if (action === 'guardsRoster') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const rows = await loadGuardsResponses(found.session.id)
      return json(res, 200, {
        ok: true,
        summary: summarizeGuardsLink(rows),
        roster: marksListRows(rows),
      })
    }

    if (action === 'confirmGuardAttendance') {
      const sessionId = String(body.sessionId ?? '').trim()
      const responseId = String(body.responseId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      if (!responseId) return json(res, 400, { ok: false, error: 'Guard response id required.' })
      const confirmed = await confirmGuardAttendance({
        sessionId: found.session.id,
        responseId,
        confirmedBy: session.email,
      })
      if (!confirmed.ok) return json(res, 400, { ok: false, error: confirmed.error })
      const rows = await loadGuardsResponses(found.session.id)
      return json(res, 200, {
        ok: true,
        response: confirmed.row,
        summary: summarizeGuardsLink(rows),
        roster: marksListRows(rows),
      })
    }

    if (action === 'guardsLinkSummary') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const token = await getTokenForSession(found.session.id)
      const rows = await loadGuardsResponses(found.session.id)
      const summary = summarizeGuardsLink(rows)
      return json(res, 200, {
        ok: true,
        token,
        url: token ? guardsLinkPublicUrl(token) : '',
        summary,
        responses: rows,
      })
    }

    if (action === 'getReport') {
      const sessionId = String(body.sessionId ?? '').trim()
      const trainingDate = String(body.trainingDate ?? '').slice(0, 10)
      const preferBranch = String(body.branchId ?? body.workBranchId ?? dataBranchId ?? '').trim()
      const found = await resolveSessionForReport(preferBranch, sessionId, month, coveredIds, {
        isMgmt,
        trainingDate,
      })
      /** Report is keyed by session id — still open it even if calendar row is hard to locate. */
      const report = (await loadOjtReport(sessionId)) || (found ? emptyOjtReport(sessionId) : null)
      if (!found && !report) {
        return json(res, 404, {
          ok: false,
          error: 'Could not open this observation — session not found. Refresh the list and try again.',
        })
      }
      const sessionRow =
        found?.session ||
        ({
          id: sessionId,
          branchId: preferBranch,
          clientName: '',
          trainingDate: trainingDate || '',
          topics: '',
        } as OjtSession)
      if (!report) {
        return json(res, 404, { ok: false, error: 'Observation report not found yet.' })
      }
      if (!report.reportDate) report.reportDate = sessionRow.trainingDate || ''
      if (!report.topicsCovered) report.topicsCovered = sessionRow.topics || ''
      let nightHint = ''
      try {
        const nv = await loadNightReport(sessionRow.branchId, sessionRow.trainingDate)
        if (nv) {
          const unit = String(sessionRow.clientName || '').toLowerCase()
          const visited = String(nv.unitsVisited || '').toLowerCase()
          if (!unit || visited.includes(unit.slice(0, Math.min(12, unit.length)))) {
            nightHint = `MIS Night Visit on ${nv.reportDate}: units ${nv.unitsVisited || '—'}; observation ${nv.observation || '—'}`
            if (!report.previousNightCheckDate && nv.reportDate) {
              report.previousNightCheckDate = String(nv.reportDate).slice(0, 10)
            }
          }
        }
      } catch {
        /* optional hint */
      }
      // Do not send large file bytes to the browser unless needed for re-share
      return json(res, 200, {
        ok: true,
        report: lightOjtReport(report),
        nightHint,
        session: sessionRow,
      })
    }

    if (action === 'previewCompletion') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      let report = (await loadOjtReport(sessionId)) || emptyOjtReport(sessionId)
      const draft = (body.report ?? {}) as Record<string, unknown>
      if (draft && typeof draft === 'object' && Object.keys(draft).length) {
        const mergedPhotos = mergeCompletionPhotos(
          report.completionPhotos || [],
          draft.completionPhotos,
        )
        report = normalizeOjtReport(
          {
            ...report,
            ...draft,
            sessionId,
            completionPhotos: mergedPhotos,
          },
          sessionId,
        )
      }
      if (!report.reportDate) report.reportDate = found.session.trainingDate || ''
      if (!report.topicsCovered) report.topicsCovered = found.session.topics || ''
      const gRows = await loadGuardsResponses(sessionId)
      const gSum = summarizeGuardsLink(gRows)
      const guardsLink = {
        attended: gSum.attended,
        tested: gSum.tested,
        avgScore: gSum.avgScore,
        feedbackCount: gSum.feedbackCount,
        feedbackNotes: gSum.feedbackNotes,
        attendanceNames: gSum.attendanceNames,
        statusLine: `On duty ${gSum.statusCounts.on_duty} · On leave ${gSum.statusCounts.on_leave} · Attending ${gSum.statusCounts.attending} · Not working ${gSum.statusCounts.not_working}`,
      }
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'www.agilegroup-digital.co.in')
      const proto = String(req.headers['x-forwarded-proto'] || 'https')
      const origin = `${proto}://${host}`
      const preparedFb = await prepareClientFeedbackLink(
        found.session,
        monthOf(found.session.trainingDate) || month,
        origin,
      )
      const feedbackUrl = preparedFb.ok ? preparedFb.url : ''
      if (preparedFb.ok && preparedFb.meta.token) {
        report.clientFeedbackToken = preparedFb.meta.token
        const stored = (await loadOjtReport(sessionId)) || emptyOjtReport(sessionId)
        stored.clientFeedbackToken = preparedFb.meta.token
        await saveOjtReport(stored)
      }
      const html = buildCompletionReportHtml(found.session, report, guardsLink, feedbackUrl)
      return json(res, 200, {
        ok: true,
        html,
        subject: `OJT Completion — ${found.session.clientName || 'Training'}`,
        feedbackUrl,
      })
    }

    if (action === 'saveReport') {
      const raw = (body.report || {}) as Record<string, unknown>
      const sessionId = String(raw.sessionId ?? body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const existing = (await loadOjtReport(sessionId)) || emptyOjtReport(sessionId)
      const keepMarks =
        !raw.marksFileBase64 ||
        raw.marksFileBase64 === '__stored__' ||
        String(raw.marksFileBase64).length < 8
      const mergedPhotos = mergeCompletionPhotos(existing.completionPhotos || [], raw.completionPhotos)
      const merged = {
        ...existing,
        ...raw,
        sessionId,
        marksFileBase64: keepMarks ? existing.marksFileBase64 : raw.marksFileBase64,
        marksFileName: keepMarks && !raw.marksFileName ? existing.marksFileName : raw.marksFileName,
        marksFileType: keepMarks && !raw.marksFileType ? existing.marksFileType : raw.marksFileType,
        completionPhotos: mergedPhotos,
        // Client link feedback stays on the completion report record (staff save must not clear it).
        clientFeedbackToken: existing.clientFeedbackToken || String(raw.clientFeedbackToken || ''),
        clientOjtBenefitRating: existing.clientOjtBenefitRating || String(raw.clientOjtBenefitRating || ''),
        clientOjtBenefitAt: existing.clientOjtBenefitAt || String(raw.clientOjtBenefitAt || ''),
        clientOjtBenefitBy: existing.clientOjtBenefitBy || String(raw.clientOjtBenefitBy || ''),
      }
      const section = String(body.section ?? '').trim()
      if (section === 'completion') {
        merged.completionSavedAt = new Date().toISOString()
        if (!merged.reportDate) merged.reportDate = found.session.trainingDate
        if (!merged.topicsCovered) merged.topicsCovered = found.session.topics
      }
      if (section === 'security') {
        merged.securityObsSavedAt = new Date().toISOString()
      }
      const report = normalizeOjtReport(merged as Partial<typeof existing>, sessionId)
      const ok = await saveOjtReport(report)
      if (!ok) return json(res, 500, { ok: false, error: 'Could not save report.' })
      return json(res, 200, { ok: true, report: lightOjtReport(report) })
    }

    if (action === 'sendCompletion') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const report = (await loadOjtReport(sessionId)) || emptyOjtReport(sessionId)
      if (!report.completionSavedAt) {
        return json(res, 400, { ok: false, error: 'Please Save the completion report after Review, then Send to Client.' })
      }
      const missingCols = completionReportMissingColumns(report)
      if (missingCols.length) {
        return json(res, 400, {
          ok: false,
          error: `Please ask the trainer to fill all columns before sending: ${missingCols.join(', ')}.`,
        })
      }
      const row = { ...found.session }
      if (!row.branchHeadEmail) row.branchHeadEmail = await suggestBranchHeadEmail(row.branchId)
      const gRows = await loadGuardsResponses(sessionId)
      const gSum = summarizeGuardsLink(gRows)
      const guardsLink = {
        attended: gSum.attended,
        tested: gSum.tested,
        avgScore: gSum.avgScore,
        feedbackCount: gSum.feedbackCount,
        feedbackNotes: gSum.feedbackNotes,
        attendanceNames: gSum.attendanceNames,
        statusLine: `On duty ${gSum.statusCounts.on_duty} · On leave ${gSum.statusCounts.on_leave} · Attending ${gSum.statusCounts.attending} · Not working ${gSum.statusCounts.not_working}`,
      }
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'www.agilegroup-digital.co.in')
      const proto = String(req.headers['x-forwarded-proto'] || 'https')
      const mailed = await sendOjtCompletionMail(row, report, guardsLink, {
        origin: `${proto}://${host}`,
      })
      if (!mailed.ok) return json(res, 400, { ok: false, error: mailed.error || 'Mail failed' })
      report.reportSentToClient = 'Yes'
      report.reportSentAt = new Date().toISOString()
      report.reportSentBy = session.email
      report.reportMessageId = mailed.messageId || ''
      if (mailed.feedbackUrl) {
        const tok = mailed.feedbackUrl.split('t=')[1]
        if (tok) report.clientFeedbackToken = decodeURIComponent(tok.split('&')[0] || '')
      }
      await saveOjtReport(report)
      row.status = 'Completed'
      await upsertSession(row)
      return json(res, 200, {
        ok: true,
        report: lightOjtReport(report),
        messageId: mailed.messageId || '',
        guardsLink,
      })
    }

    if (action === 'sendSecurityObs') {
      const sessionId = String(body.sessionId ?? '').trim()
      const found = await resolveSession(dataBranchId, sessionId, month, coveredIds)
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const report = (await loadOjtReport(sessionId)) || emptyOjtReport(sessionId)
      if (!report.securityObsSavedAt) {
        return json(res, 400, { ok: false, error: 'Please Save and Review Security Observations before sharing.' })
      }
      const row = { ...found.session }
      if (!row.branchHeadEmail) row.branchHeadEmail = await suggestBranchHeadEmail(row.branchId)
      const mailed = await sendOjtSecurityObsMail(row, report)
      if (!mailed.ok) return json(res, 400, { ok: false, error: mailed.error || 'Mail failed' })
      report.securityObsSentAt = new Date().toISOString()
      report.securityObsSentBy = session.email
      report.securityObsMessageId = mailed.messageId || ''
      await saveOjtReport(report)
      const light = { ...report, marksFileBase64: report.marksFileBase64 ? '__stored__' : '' }
      return json(res, 200, { ok: true, report: light, messageId: mailed.messageId || '' })
    }

    /** Branch Security Observation List — WhatsApp chase to assigned staff / trainer. */
    if (action === 'secObsWhatsApp') {
      const sessionId = String(body.sessionId ?? '').trim()
      const bid = String(body.branchId ?? body.workBranchId ?? dataBranchId ?? '').trim()
      if (!sessionId || !bid) return json(res, 400, { ok: false, error: 'Session and branch are required.' })
      if (isBranchHod && bid !== sessionBranchId) {
        return json(res, 403, { ok: false, error: 'You can only message staff for your own branch.' })
      }
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'www.agilegroup-digital.co.in')
      const proto = String(req.headers['x-forwarded-proto'] || 'https')
      const result = await sendSecObsWhatsApp({
        sessionId,
        branchId: bid,
        sentBy: session.email,
        origin: `${proto}://${host}`,
        monthHint: month,
      })
      if (!result.ok) return json(res, 400, { ok: false, error: result.error })
      return json(res, 200, {
        ok: true,
        mobile: result.mobile,
        name: result.name,
        message: `WhatsApp sent to ${result.name} (${result.mobile}).`,
      })
    }

    /** Management only — email + WhatsApp reminder to assigned staff. */
    if (action === 'secObsReminder') {
      if (!isMgmt) {
        return json(res, 403, { ok: false, error: 'Reminder is available on the Management portal only.' })
      }
      const sessionId = String(body.sessionId ?? '').trim()
      const bid = String(body.branchId ?? body.workBranchId ?? dataBranchId ?? '').trim()
      if (!sessionId || !bid) return json(res, 400, { ok: false, error: 'Session and branch are required.' })
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'www.agilegroup-digital.co.in')
      const proto = String(req.headers['x-forwarded-proto'] || 'https')
      const result = await sendSecObsReminder({
        sessionId,
        branchId: bid,
        sentBy: session.email,
        origin: `${proto}://${host}`,
        monthHint: month,
      })
      if (!result.ok) return json(res, 400, { ok: false, error: result.error })
      return json(res, 200, {
        ok: true,
        channels: result.channels,
        message: `Reminder sent via ${result.channels.join(' + ')}.`,
      })
    }

    /** Management only — reopen a closed Security Observation completion report. */
    if (action === 'secObsReopen') {
      if (!isMgmt) {
        return json(res, 403, { ok: false, error: 'Reopen is available on the Management portal only.' })
      }
      const sessionId = String(body.sessionId ?? '').trim()
      const bid = String(body.branchId ?? body.workBranchId ?? dataBranchId ?? '').trim()
      if (!sessionId || !bid) return json(res, 400, { ok: false, error: 'Session and branch are required.' })
      const result = await reopenSecObsClosure({
        sessionId,
        branchId: bid,
        reopenedBy: session.email,
        monthHint: month,
      })
      if (!result.ok) return json(res, 400, { ok: false, error: result.error })
      return json(res, 200, { ok: true, message: 'Observation reopened — completion report cleared.' })
    }

    /** Branch Security Observation List — register Completion report (date, text, evidence). */
    if (action === 'submitSecObsClosure') {
      const sessionId = String(body.sessionId ?? '').trim()
      const trainingDate = String(body.trainingDate ?? '').slice(0, 10)
      const preferBranch = String(body.branchId ?? body.workBranchId ?? dataBranchId ?? '').trim()
      const found = await resolveSessionForReport(preferBranch, sessionId, month, coveredIds, {
        isMgmt,
        trainingDate,
      })
      if (!found) return json(res, 404, { ok: false, error: 'Session not found.' })
      const closureDate = String(body.closureDate ?? body.date ?? '').slice(0, 10)
      const closureText = String(body.closureText ?? body.text ?? '').trim()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(closureDate)) {
        return json(res, 400, { ok: false, error: 'Please enter the Date of completion.' })
      }
      if (!closureText) {
        return json(res, 400, { ok: false, error: 'Please enter the Completion report text.' })
      }
      const existing = (await loadOjtReport(sessionId)) || emptyOjtReport(sessionId)
      const files = mergeClosureFiles(existing.securityObsClosureFiles || [], body.files ?? body.evidence)
      if (!files.length && !(existing.securityObsClosureFiles || []).length) {
        return json(res, 400, {
          ok: false,
          error: 'Please upload at least one evidence document (PDF, image, Word or Excel).',
        })
      }
      const report = normalizeOjtReport(
        {
          ...existing,
          securityObsClosureDate: closureDate,
          securityObsClosureText: closureText.slice(0, 8000),
          securityObsClosureFiles: files.length ? files : existing.securityObsClosureFiles,
          securityObsClosureSubmittedAt: new Date().toISOString(),
          securityObsClosureSubmittedBy: session.email,
        },
        sessionId,
      )
      /** Preserve file bytes if normalize dropped __stored__ placeholders incorrectly. */
      if (!report.securityObsClosureFiles.length && files.length) {
        report.securityObsClosureFiles = files
      }
      const ok = await saveOjtReport(report)
      if (!ok) return json(res, 500, { ok: false, error: 'Could not save completion report.' })
      return json(res, 200, {
        ok: true,
        completed: true,
        report: lightOjtReport(report),
        message: 'Completion report submitted — list shows Completed.',
      })
    }

    if (action === 'dashboard') {
      const trainingDept = await ensureTrainingDepartmentBranch()
      const covered = await resolveTrainingDeptCoveredBranches()
      const branches = await getBranches(true)
      const filterBranchId = String(body.filterBranchId ?? '').trim()
      const fromDate = String(body.fromDate ?? body.periodFrom ?? `${month}-01`).slice(0, 10)
      const toDate = String(body.toDate ?? body.periodTo ?? todayYmd()).slice(0, 10)
      let scope = branches.filter((b) => b.id === session.branchId)
      if (isMgmt || isTdManager) {
        if (!filterBranchId || filterBranchId === 'training-dept' || filterBranchId === trainingDept?.id) {
          scope = covered.length ? covered : branches.filter((b) => !isTrainingDepartmentBranch(b))
        } else if (filterBranchId === 'all' && isMgmt) {
          scope = branches.filter((b) => !isTrainingDepartmentBranch(b))
        } else {
          scope = branches.filter((b) => b.id === filterBranchId && !isTrainingDepartmentBranch(b))
          if (!scope.length) scope = covered.filter((b) => b.id === filterBranchId)
          /** Training Manager may only view Hyd-A / B / Hi-Tech. */
          if (isTdManager && !isMgmt) {
            scope = scope.filter((b) => covered.some((c) => c.id === b.id))
            if (!scope.length) scope = covered
          }
        }
      }
      const today = todayYmd()
      const branchKpis = []
      let balanceSchedule = 0
      let guardsTrained = 0
      let sanctionedPosts = 0
      let totalSites = 0
      let completedUnits = 0
      for (const b of scope) {
        const { kpi } = await buildBranchKpi(b.id, b.name, fromDate, toDate)
        branchKpis.push(kpi)
        balanceSchedule += kpi.balanceSchedule
        completedUnits += kpi.completedUnits
        guardsTrained += kpi.guardsTrained
        sanctionedPosts += kpi.sanctionedPosts
        totalSites += kpi.totalSites
      }
      /**
       * Security Observation board is always all operating branches for Management
       * (and Training Department covered branches for training@), independent of KPI filter.
       */
      let secScope = scope
      if (isMgmt) {
        secScope = branches.filter((b) => !isTrainingDepartmentBranch(b))
      } else if (isTdManager || loggedInAsTrainingDept) {
        secScope = covered.length ? covered : scope
      }
      const secFilter = String(body.secObsBranchId ?? 'all').trim()
      if (secFilter && secFilter !== 'all') {
        secScope = secScope.filter((b) => b.id === secFilter)
      }
      const secObs = []
      for (const b of secScope) {
        secObs.push(...(await buildSecurityObsList(b.id, b.name, fromDate, toDate, today)))
      }
      const secSummary = summarizeSecObs(secObs)
      const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0)
      return json(res, 200, {
        ok: true,
        role: session.role,
        trainingDeptManager: isTdManager || isMgmt,
        canSecObsRemind: isMgmt,
        canSecObsReopen: isMgmt,
        waReady: guardsWhatsAppReady(),
        month,
        fromDate,
        toDate,
        asOf: today,
        stats: {
          scheduled: balanceSchedule,
          notified: 0,
          completed: completedUnits,
          balanceSchedule,
          totalSites,
          completedUnits,
          trainingCompletedLabel: `${completedUnits}/${totalSites}`,
          trainingCompletedPct: pct(completedUnits, totalSites),
          guardsTrained,
          sanctionedPosts,
          trainedGuardsPct: pct(guardsTrained, sanctionedPosts),
          unitsTrainedLabel: `${completedUnits}/${totalSites}`,
          unitsTrainedPct: pct(completedUnits, totalSites),
        },
        secObsSummary: secSummary,
        branchKpis,
        secObs,
        branches: [
          ...((isMgmt || isTdManager) && trainingDept
            ? [{ id: trainingDept.id, name: trainingDept.name, isTrainingDepartment: true }]
            : []),
          ...covered.map((b) => ({ id: b.id, name: b.name, isTrainingDepartment: false })),
          ...(isMgmt
            ? branches
                .filter((b) => !isTrainingDepartmentBranch(b) && !covered.some((c) => c.id === b.id))
                .map((b) => ({ id: b.id, name: b.name, isTrainingDepartment: false }))
            : []),
        ],
        allBranches: (isMgmt ? branches : covered)
          .filter((b) => !isTrainingDepartmentBranch(b))
          .map((b) => ({ id: b.id, name: b.name })),
        trainingDeptBranches: covered.map((b) => ({ id: b.id, name: b.name })),
        questionSubjects: [...OJT_QUESTION_SUBJECTS],
      })
    }

    if (action === 'listExtras') {
      if (!dataBranchId) return json(res, 400, { ok: false, error: 'Branch is required.' })
      const kind = String(body.kind ?? '').trim() as OjtExtraKind | ''
      const list = await loadExtras(dataBranchId, month)
      return json(res, 200, {
        ok: true,
        extras: kind ? list.filter((e) => e.kind === kind) : list,
      })
    }

    if (action === 'saveExtra') {
      if (!dataBranchId) return json(res, 400, { ok: false, error: 'Branch is required.' })
      const raw = (body.entry || body.extra || {}) as Record<string, unknown>
      const entry = normalizeExtra(
        {
          ...raw,
          branchId: dataBranchId,
          createdBy: String(raw.createdBy || session.email || ''),
        },
        dataBranchId,
      )
      if (!entry.body && !entry.title) {
        return json(res, 400, { ok: false, error: 'Please enter details before saving.' })
      }
      const saved = await saveExtra(entry, monthOf(entry.trainingDate) || month)
      if (!saved) return json(res, 500, { ok: false, error: 'Could not save.' })
      return json(res, 200, { ok: true, entry: saved })
    }

    return json(res, 400, { ok: false, error: 'Unknown action.' })
  } catch (err) {
    console.error('[training/ojt-data]', err)
    return json(res, 500, { ok: false, error: 'OJT data request failed.' })
  }
}

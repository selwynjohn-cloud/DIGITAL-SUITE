import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { isSuiteAdminEmail } from '../_lib/auth.js'
import { noteItSuiteChange } from '../_lib/it-activity-alert.js'
import { isHodUser } from '../_lib/mis/digest.js'
import { isSupportMisUser } from '../_lib/user-team.js'
import { getUsers as getMisUsers, getBranches as getMisBranches, getActiveBranch } from '../_lib/mis/store.js'
import {
  RECRUIT_BRANCHES,
  defaultSeedUsers,
  getConfig,
  getDrr,
  getGuards,
  getJoinBacks,
  getRequisitions,
  getUsers,
  getVendors,
  getAttendanceDates,
  getAttendanceMarks,
  normalizeDrr,
  normalizeGuard,
  normalizeJoinBack,
  normalizeRequisition,
  normalizeUser,
  recruitNid,
  recruitNum,
  recruitStorageOk,
  saveConfig,
  saveDrr,
  saveGuards,
  saveJoinBacks,
  saveRequisitions,
  saveUsers,
  saveVendors,
  type DailyRecruitmentReport,
  type GuardApplicant,
  type JoinBackRecord,
  type ManpowerRequisition,
  type RecruitUser,
  type RecruitmentConfig,
  type RecruitmentVendor,
} from '../_lib/recruitment/store.js'
import { buildDrrThankYouEmail, buildShortageReminderEmail, loadBranchManpower, loadRecruitmentShortage, sendDrrThankYouEmail, sendShortageReminderForBranch, autoSendShortageReminders } from '../_lib/recruitment/drr-mail.js'
import { recruitEmailShell } from '../_lib/recruitment/brand.js'
import { hydZoneCentreFromText, isHydZoneCentre } from '../_lib/recruitment/branches.js'
import { sendSuiteEmail } from '../_lib/suite-mail.js'
import { Resend } from 'resend'
import {
  absconderReminderText,
  absconderShareHtml,
  absconderTerminationNoticeHtml,
  absconderTerminationNoticeText,
  groupAbscondersByBranch,
  loadAbsconders,
  sameRecruitBranch,
} from '../_lib/recruitment/absconder.js'
import { absconderFollowKey, upsertAbsconderFollow } from '../_lib/recruitment/absconder-followup.js'
import { syncWork360AttendanceRange } from '../_lib/recruitment/work360-attendance.js'

export const config = { maxDuration: 60 }
import { work360Config } from '../_lib/mis/work360-client.js'
import { misTodayIst } from '../_lib/mis/dates.js'
import { resolveRecruitmentCentre } from '../_lib/securityjob/recruitment-centres.js'
import {
  isRecruitDepartmentLoginId,
  recruitDepartmentFromLoginId,
} from '../_lib/recruitment/department-auth.js'
import { securityJobListVisibleForScope } from '../_lib/recruitment/departments.js'
import {
  applySjFollowupDateBook,
  datesFromBook,
  hydrateSjDatesFromPersonKeys,
  isSjFollowupDateField,
  loadSjFollowupDateBook,
  mergeSjFollowupDates,
  preserveSjFollowupDates,
  rememberSjFollowupDates,
  ymdFollowup,
} from '../_lib/recruitment/sj-followup-dates.js'
import {
  candidatePipelineBucket,
  computeCallSla,
  ensureRegistrationOwnership,
  getRegistrations,
  loadAllRegisteredCandidates,
  materializeSjRegistration,
  normalizeRegistration,
  registrationDay,
  registrationSortTs,
  resolveRegistrationOwner,
  saveRegistrations,
  sjCall1At,
  sjFollowBucket,
  sjHoldOn,
} from '../_lib/recruitment/registration-store.js'
import {
  custodyExcelPayload,
  ensureCandidateCustody,
  rememberCandidatesInCustody,
} from '../_lib/recruitment/candidate-custody.js'
import { addWalkIn, getWalkIns, normalizeWalkIn, saveWalkIns } from '../_lib/recruitment/walk-in-store.js'
import { sendWalkInBranchNotify } from '../_lib/recruitment/walk-in-mail.js'
import { defaultWalkInSource } from '../_lib/recruitment/department-auth.js'
import { walkInVisibleForRecruitScope } from '../_lib/recruitment/departments.js'
import {
  drrDetailIsSubmitted,
  getDrrDetails,
  ladyRecruitMissingUndertaking,
  normalizeDrrDetail,
  saveDrrDetails,
  type DrrDetailPackage,
} from '../_lib/recruitment/drr-detail-store.js'
import {
  buildDeploymentOrderHtml,
  buildDeploymentOrderText,
  getDeployFollowups,
  saveDeployFollowups,
  syncDeployFollowupsFromDrr,
  waUrlForText,
  type DeployFollowup,
} from '../_lib/recruitment/deploy-followup-store.js'
import { getBranchWages, normalizeWageRow, saveBranchWages } from '../_lib/recruitment/wage-store.js'
import {
  buildDeployOrderFormatText,
  buildRecruitThankYouText,
  buildSecurityJobWhatsApp,
  buildSecurityNewsWhatsApp,
  waUrl as recruitWaUrl,
} from '../_lib/recruitment/message-formats.js'
import {
  loadSjJoinOrderMap,
  sendSjProvisionalJoinOrder,
} from '../_lib/recruitment/sj-join-order.js'
import { loadSjAiCallMap } from '../_lib/recruitment/sj-ai-call.js'
import { loadSjAskDateMap } from '../_lib/recruitment/sj-reg-ask-date.js'
import {
  getReferralIncentiveFlags,
  saveReferralIncentiveFlag,
} from '../_lib/recruitment/referral-incentive-store.js'
import {
  buildKnownGuardIndex,
  dedupeReferralRows,
  isRejoinOrOldGuardRow,
  looksLikeRejoinOrOldGuard,
  monthReferralRange,
  referralLeaderTotals,
  type ReferralListRow,
} from '../_lib/recruitment/referral-dedupe.js'
import { branchEmail } from '../_lib/fleet/analysis.js'

function branchFromMis(misBranchId: string, misBranches: { id: string; name: string }[]): string | null {
  const hit = misBranches.find((b) => b.id === misBranchId || b.name === misBranchId)
  const name = hit?.name || misBranchId
  if (RECRUIT_BRANCHES.includes(name as (typeof RECRUIT_BRANCHES)[number])) return name
  if (/hi-?tech/i.test(name)) return 'Hi-Tech City'
  if (/hyderabad[\s\-–]*b|hyd[\s\-]*zone[\s\-]*b/i.test(name)) return 'Hyderabad - B'
  if (/hyderabad[\s\-–]*a|hyd[\s\-]*zone[\s\-]*a/i.test(name)) return 'Hyderabad - A'
  if (/visakhapatnam|vizag/i.test(name)) return 'Visakhapatnam'
  if (/^tada\b/i.test(name.trim()) && !/tadipatri/i.test(name)) return 'Tada'
  if (/tadipatri/i.test(name)) return 'Tadipatri'
  if (/tirupati/i.test(name)) return 'Tirupati'
  if (/nellore/i.test(name)) return 'Nellore'
  if (/gulbarga|kalaburagi|bangalore|bengaluru/i.test(name)) return 'Bangalore'
  if (/surat/i.test(name)) return 'Surat'
  if (/mumbai/i.test(name)) return 'Mumbai'
  if (/puducherry|pondicherry/i.test(name)) return 'Puducherry'
  if (/chennai/i.test(name)) return 'Chennai'
  if (/vijayawada/i.test(name)) return 'Vijayawada'
  if (/kakinada/i.test(name)) return 'Kakinada'
  if (/bhopal/i.test(name)) return 'Bhopal'
  if (/kochi|cochin/i.test(name)) return 'Kochi'
  if (/lucknow/i.test(name)) return 'Lucknow'
  if (/corporate/i.test(name)) return null
  const fuzzy = RECRUIT_BRANCHES.find(
    (f) => name.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(name.toLowerCase()),
  )
  return fuzzy || null
}

async function resolveRecruitUser(
  email: string,
  sessionRole: 'staff' | 'management',
  users: RecruitUser[],
  misUsers: Awaited<ReturnType<typeof getMisUsers>>,
  misBranches: { id: string; name: string }[],
  sessionBranchId?: string,
): Promise<{ role: 'admin' | 'branch'; branch: string | null; name: string; email: string } | null> {
  const em = email.trim().toLowerCase()
  if (!em.includes('@')) return null
  if (isSuiteAdminEmail(email)) {
    const adminName = em === 'sai@agilegroup.co.in' ? 'Sai' : 'Director'
    if (sessionRole === 'staff' && sessionBranchId) {
      if (isRecruitDepartmentLoginId(sessionBranchId)) {
        const dept = recruitDepartmentFromLoginId(sessionBranchId)
        if (dept) {
          return { role: 'branch', branch: dept.recruitBranch, name: dept.displayName || adminName, email }
        }
      }
      const misBranch = await getActiveBranch(sessionBranchId)
      if (misBranch) {
        const branch = branchFromMis(misBranch.id, misBranches)
        if (branch) return { role: 'branch', branch, name: adminName, email }
      }
    }
    return { role: 'admin', branch: null, name: adminName, email }
  }

  if (sessionRole === 'management') {
    // Same as Fleet/CRM: Management portal OTP session = management access.
    const admin = users.find((u) => u.active && u.role === 'admin' && u.email.trim().toLowerCase() === em)
    if (admin) return { role: 'admin', branch: null, name: admin.name || email, email }
    return { role: 'admin', branch: null, name: email, email }
  }

  // Branch-password login puts MIS branch id (or recruit-dept:…) on the session.
  if (sessionBranchId) {
    if (isRecruitDepartmentLoginId(sessionBranchId)) {
      const dept = recruitDepartmentFromLoginId(sessionBranchId)
      if (dept) {
        return { role: 'branch', branch: dept.recruitBranch, name: dept.displayName || email, email }
      }
    }
    const misBranch = await getActiveBranch(sessionBranchId)
    if (misBranch) {
      const branch = branchFromMis(misBranch.id, misBranches)
      if (branch) return { role: 'branch', branch, name: email, email }
    }
  }

  const branchUser = users.find((u) => u.active && u.role === 'branch' && u.email.trim().toLowerCase() === em)
  if (branchUser?.branchId) {
    const activeMis = misBranches.some((b) => branchFromMis(b.id, misBranches) === branchUser.branchId)
    if (!activeMis) return null
    return { role: 'branch', branch: branchUser.branchId, name: branchUser.name || email, email }
  }

  const mu = misUsers.find((u) => u.email?.trim().toLowerCase() === em && u.active !== false)
  if (mu && isSupportMisUser(mu)) return null
  if (mu && isHodUser(mu)) {
    const misBranch = await getActiveBranch(mu.branchId || '')
    if (!misBranch) return null
    const branch = branchFromMis(misBranch.id, misBranches)
    if (branch) return { role: 'branch', branch, name: mu.name || email, email }
  }
  return null
}

function effectiveBranch(
  user: { role: 'admin' | 'branch'; branch: string | null },
  branchIdFromBody: string,
): string | null {
  if (user.role === 'admin') return branchIdFromBody || null
  const locked = user.branch
  if (!locked) return null
  if (branchIdFromBody && branchIdFromBody !== locked) return null
  return locked
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = String(body.action ?? '')
  const s = (v: unknown, n = 200) => String(v ?? '').slice(0, n)

  if (action === 'status') return res.status(200).json({ ok: true, storage: recruitStorageOk() })

  let users = await getUsers()
  users = users.map((u) => normalizeUser(u))
  if (users.length === 0 && recruitStorageOk()) {
    users = defaultSeedUsers()
    await saveUsers(users)
  }

  const otpSession = await verifyAppSession(String(body.sessionToken ?? ''), 'recruitment')
  if (!otpSession) return res.status(401).json({ error: 'Please sign in with your @agilegroup.co.in email OTP.' })

  const misUsers = await getMisUsers()
  const branches = await getMisBranches(true)
  const recruitUser = await resolveRecruitUser(
    otpSession.email,
    otpSession.role,
    users,
    misUsers,
    branches,
    otpSession.branchId,
  )
  if (!recruitUser) {
    if (otpSession.role === 'staff') {
      const lockedId = String(otpSession.branchId || '').trim()
      if (lockedId && !(await getActiveBranch(lockedId))) {
        return res.status(403).json({
          error:
            'This branch is deactivated. Only activated branch teams can access the portal. Contact management.',
        })
      }
      const mu = misUsers.find((u) => u.email?.trim().toLowerCase() === otpSession.email && u.active !== false)
      if (mu && isHodUser(mu) && !(await getActiveBranch(mu.branchId || ''))) {
        return res.status(403).json({
          error:
            'This branch is deactivated. Only activated branch teams can access the portal. Contact management.',
        })
      }
    }
    return res.status(403).json({
      error:
        otpSession.role === 'management'
          ? 'Management sign-in failed. Use the dark Management button, your @agilegroup.co.in email, and the PIN from your email.'
          : 'Branch access only for registered HODs / recruiters.',
    })
  }

  const branchIdFromBody = String(body.branchId ?? '').trim()
  const branch = effectiveBranch(recruitUser, branchIdFromBody)
  if (recruitUser.role === 'branch' && branchIdFromBody && !branch) {
    return res.status(403).json({ error: 'You can only access your own branch (' + recruitUser.branch + ').' })
  }
  const role = recruitUser.role
  if (/^(save|approve|sync)/i.test(action) && action !== 'saveSjDate' && action !== 'saveFunnelDate') {
    const sendJson = res.json.bind(res)
    res.json = ((payload: unknown) => {
      const code = res.statusCode || 200
      if (code >= 200 && code < 300) {
        noteItSuiteChange(otpSession.email, 'Recruitment', 'recruitment', action)
      }
      return sendJson(payload)
    }) as typeof res.json
  }

  if (action === 'login' || action === 'load') {
    const shortageScope = role === 'branch' && branch ? branch : null
    const [drr, drrDetails, guards, requisitions, joinbacks, vendors, config, shortage] =
      await Promise.all([
        getDrr(),
        getDrrDetails(),
        getGuards(),
        getRequisitions(),
        getJoinBacks(),
        getVendors(),
        getConfig(),
        loadRecruitmentShortage({
          recruitBranch: shortageScope,
          centres: RECRUIT_BRANCHES,
          saveClosing: false,
        }).catch(() => null),
      ])
    const shortageSafe =
      shortage ||
      ({
        date: misTodayIst(),
        vac: 0,
        ot: 0,
        shortage: config.shortageCount || 0,
        prevVac: 0,
        prevOt: 0,
        prevShortage: config.shortageCount || 0,
        openingVac: 0,
        openingOt: 0,
        openingShortage: config.shortageCount || 0,
        openingDate: '2026-08-14',
        recruitsSinceBaseline: 0,
        san: 0,
        dep: 0,
        misSubmittedCount: 0,
        branchCount: 0,
        source: 'config' as const,
        label: 'Opening from Consolidated MIS 14/08/2026 · Shortages = Vacant + OT',
        byBranch: [],
      })
    const payload: Record<string, unknown> = {
      ok: true,
      role,
      branch,
      name: recruitUser.name,
      email: recruitUser.email,
      lockedBranch: role === 'branch' ? branch : null,
      drr: drr.map((r) => normalizeDrr(r)),
      drrDetails: drrDetails.filter((p) => p.active !== false),
      guards: guards.map((g) => normalizeGuard(g)),
      requisitions: requisitions.map((r) => normalizeRequisition(r)),
      joinbacks: joinbacks.map((j) => normalizeJoinBack(j)),
      vendors,
      config,
      shortage: shortageSafe,
    }
    if (role === 'admin') payload.users = users
    payload.recruitBranches = [...RECRUIT_BRANCHES]
    return res.status(200).json(payload)
  }

  if (!recruitStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })

  if (action === 'saveDrr') {
    const arr = Array.isArray(body.drr) ? body.drr : body.report ? [body.report] : []
    if (!arr.length) return res.status(400).json({ error: 'No DRR to save.' })
    const prev = await getDrr()
    const upserts = new Map<string, DailyRecruitmentReport>()

    for (const r of arr.slice(0, 500) as Record<string, unknown>[]) {
      const branchId = role === 'branch' ? (branch ?? '') : s(r.branchId, 80)
      if (!branchId) continue
      if (role === 'branch' && branch && branchId !== branch) continue
      const reportDate = s(r.reportDate, 20)
      if (!reportDate) continue
      const key = `${branchId}|${reportDate}`
      const existing = prev.find((p) => p.branchId === branchId && p.reportDate === reportDate)
      const next = normalizeDrr({
        id: String(r.id || existing?.id || recruitNid('dr')),
        reportCode: s(r.reportCode, 40) || existing?.reportCode || '',
        branchId,
        reportDate,
        submittedBy: s(r.submittedBy, 120) || existing?.submittedBy || '',
        submittedAt: s(r.submittedAt, 40) || new Date().toISOString(),
        walkIns: r.walkIns,
        screened: r.screened,
        docsComplete: r.docsComplete,
        selected: r.selected,
        deployed: r.deployed,
        // Branch portal only updates walk-ins — keep HQ sourcing numbers already on file
        campsHeld: role === 'branch' ? existing?.campsHeld ?? 0 : r.campsHeld,
        whatsappLeads: role === 'branch' ? existing?.whatsappLeads ?? 0 : r.whatsappLeads,
        securityjobLeads: role === 'branch' ? existing?.securityjobLeads ?? 0 : r.securityjobLeads,
        referralLeads: role === 'branch' ? existing?.referralLeads ?? 0 : r.referralLeads,
        fieldAgentLeads: role === 'branch' ? existing?.fieldAgentLeads ?? 0 : r.fieldAgentLeads,
        mediaLeads: role === 'branch' ? existing?.mediaLeads ?? 0 : r.mediaLeads,
        subAgencyLeads: role === 'branch' ? existing?.subAgencyLeads ?? 0 : r.subAgencyLeads,
        newsBulletinLeads: role === 'branch' ? existing?.newsBulletinLeads ?? 0 : r.newsBulletinLeads,
        notes: s(r.notes, 2000),
        bottlenecks: s(r.bottlenecks, 2000),
        active: r.active !== false,
      })
      upserts.set(key, next)
    }

    if (!upserts.size) return res.status(400).json({ error: 'Branch and report date are required.' })

    const final = prev
      .filter((p) => !upserts.has(`${p.branchId}|${p.reportDate}`))
      .concat([...upserts.values()])
      .slice(0, 5000)
    const ok = await saveDrr(final)
    if (!ok) return res.status(503).json({ error: 'Could not save DRR. Try again.' })

    let emailSent = false
    if (role === 'branch' && branch) {
      const added = [...upserts.values()].filter(
        (r) => r.branchId === branch && !prev.some((p) => p.id === r.id),
      )
      if (added.length >= 1) {
        const config = await getConfig()
        const mail = await sendDrrThankYouEmail(added[added.length - 1], config)
        emailSent = mail.ok
      }
    }

    return res.status(200).json({
      ok: true,
      count: final.length,
      saved: [...upserts.values()],
      thankYouEmail: emailSent,
    })
  }

  if (action === 'previewDrrEmail') {
    const branchId = role === 'branch' ? (branch ?? '') : s(body.branchId, 80)
    const reportDate = s(body.reportDate, 20) || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    if (!branchId) return res.status(400).json({ error: 'Branch required.' })
    const [drr, details, config] = await Promise.all([getDrr(), getDrrDetails(), getConfig()])
    const detail = details.filter(
      (p) => p.active !== false && p.branchId === branchId && p.reportDate === reportDate,
    )
    const report = drr.find((r) => r.active && r.branchId === branchId && r.reportDate === reportDate)
    if (!report && !detail.length) {
      return res.status(404).json({ error: `No DRR found for ${branchId} on ${reportDate}. Submit a report first.` })
    }
    const snap = await loadBranchManpower(branchId, reportDate)
    const base = report
      ? normalizeDrr(report)
      : normalizeDrr({
          branchId,
          reportDate,
          submittedBy: detail[0]?.submittedBy || '',
          submittedAt: detail[0]?.submittedAt || '',
          active: true,
        })
    const { subject, html } = buildDrrThankYouEmail(
      {
        ...base,
        recruitCount: detail.reduce((n, p) => n + (p.recruits?.length || 0), 0),
        transferCount: detail.reduce((n, p) => n + (p.transfers?.length || 0), 0),
        resignationCount: detail.reduce((n, p) => n + (p.resignations?.length || 0), 0),
      } as typeof base & { recruitCount: number; transferCount: number; resignationCount: number },
      config,
      snap,
    )
    return res.status(200).json({ ok: true, subject, html })
  }

  if (action === 'previewShortageReminder') {
    const branchId = role === 'branch' ? (branch ?? '') : s(body.branchId, 80) || RECRUIT_BRANCHES[0]
    if (!branchId) return res.status(400).json({ error: 'Branch required.' })
    const ymd = misTodayIst()
    const [details, shortage] = await Promise.all([
      getDrrDetails(),
      loadRecruitmentShortage({
        recruitBranch: branchId,
        centres: RECRUIT_BRANCHES,
        saveClosing: false,
      }),
    ])
    const row = shortage.byBranch.find((b) => b.branch === branchId) || shortage.byBranch[0]
    const pkgs = details.filter((p) => p.active !== false && p.reportDate === ymd && p.branchId === branchId)
    let recruits = 0
    let rejoins = 0
    let resignations = 0
    for (const p of pkgs) {
      for (const r of p.recruits || []) {
        if (r.kind === 'rejoin') rejoins += 1
        else recruits += 1
      }
      resignations += (p.resignations || []).length
    }
    const { subject, html } = buildShortageReminderEmail({
      branch: branchId,
      date: ymd,
      openingShortage: row?.openingShortage ?? shortage.openingShortage,
      openingVac: row?.openingVac ?? shortage.openingVac,
      openingOt: row?.openingOt ?? shortage.openingOt,
      vac: row?.vac ?? shortage.vac,
      ot: row?.ot ?? shortage.ot,
      shortage: row?.shortage ?? shortage.shortage,
      recruitsSinceBaseline: row?.recruitsSinceBaseline ?? shortage.recruitsSinceBaseline,
      recruitedToday: recruits,
      rejoinsToday: rejoins,
      resignationsToday: resignations,
      drrSubmitted: pkgs.some(drrDetailIsSubmitted),
    })
    return res.status(200).json({
      ok: true,
      subject,
      html,
      to: 'Branch HOD',
      cc: 'Director',
    })
  }

  if (action === 'sendShortageReminder') {
    if (role !== 'admin') return res.status(403).json({ error: 'Management only.' })
    const branchId = s(body.branchId, 80)
    if (!branchId) return res.status(400).json({ error: 'Branch required.' })
    const force = body.force !== false
    const mail = await sendShortageReminderForBranch(branchId, { force })
    if (!mail.ok) return res.status(502).json({ error: mail.error || 'Send failed', to: mail.to })
    noteItSuiteChange(otpSession.email, 'Recruitment', 'recruitment', 'sendShortageReminder')
    return res.status(200).json({
      ok: true,
      skipped: mail.skipped || false,
      reason: mail.reason || '',
      to: mail.to || [],
      branchId,
    })
  }

  if (action === 'autoShortageReminders') {
    if (role !== 'admin') return res.status(403).json({ error: 'Management only.' })
    const result = await autoSendShortageReminders({ centres: RECRUIT_BRANCHES })
    noteItSuiteChange(otpSession.email, 'Recruitment', 'recruitment', 'autoShortageReminders')
    return res.status(200).json({ ok: true, ...result })
  }

  if (action === 'saveGuards') {
    const arr = Array.isArray(body.guards) ? body.guards : []
    const list = arr.slice(0, 10000).map((g: Record<string, unknown>) =>
      normalizeGuard({
        id: String(g.id || recruitNid('gd')),
        branchId: role === 'branch' ? (branch ?? '') : s(g.branchId, 80),
        name: s(g.name, 80),
        mobile: s(g.mobile, 20),
        source: s(g.source, 40),
        stage: s(g.stage, 20),
        siteZone: s(g.siteZone, 120),
        requisitionId: s(g.requisitionId, 40),
        policeVerification: s(g.policeVerification, 40),
        medicalStatus: s(g.medicalStatus, 40),
        fitnessStatus: s(g.fitnessStatus, 40),
        batchNo: s(g.batchNo, 40),
        deployedSite: s(g.deployedSite, 120),
        notes: s(g.notes, 1000),
        active: g.active !== false,
        createdAt: s(g.createdAt, 40),
        updatedAt: new Date().toISOString(),
      }),
    )
    if (role === 'branch') {
      const prev = await getGuards()
      const others = prev.filter((p) => p.branchId !== branch)
      await saveGuards(others.concat(list))
      return res.status(200).json({ ok: true, count: list.length })
    }
    await saveGuards(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'saveRequisitions') {
    const arr = Array.isArray(body.requisitions) ? body.requisitions : []
    const list = arr.slice(0, 3000).map((r: Record<string, unknown>) =>
      normalizeRequisition({
        id: String(r.id || recruitNid('rq')),
        branchId: role === 'branch' ? (branch ?? '') : s(r.branchId, 80),
        siteZone: s(r.siteZone, 120),
        guardsNeeded: r.guardsNeeded,
        urgency: s(r.urgency, 20),
        status: role === 'branch' ? 'pending' : s(r.status, 20),
        requestedBy: s(r.requestedBy, 120),
        approvedBy: s(r.approvedBy, 120),
        notes: s(r.notes, 1000),
        createdAt: s(r.createdAt, 40),
        active: r.active !== false,
      }),
    )
    if (role === 'branch') {
      const prev = await getRequisitions()
      const kept = prev.filter((p) => p.branchId !== branch || p.status !== 'pending')
      await saveRequisitions(kept.concat(list))
      return res.status(200).json({ ok: true, count: list.length })
    }
    await saveRequisitions(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'saveJoinbacks') {
    const arr = Array.isArray(body.joinbacks) ? body.joinbacks : []
    const list = arr.slice(0, 5000).map((j: Record<string, unknown>) =>
      normalizeJoinBack({
        id: String(j.id || recruitNid('jb')),
        branchId: role === 'branch' ? (branch ?? '') : s(j.branchId, 80),
        guardName: s(j.guardName, 80),
        mobile: s(j.mobile, 20),
        siteZone: s(j.siteZone, 120),
        leftDate: s(j.leftDate, 20),
        rejoinDate: s(j.rejoinDate, 20),
        reason: s(j.reason, 400),
        status: s(j.status, 20),
        notes: s(j.notes, 1000),
        active: j.active !== false,
        createdAt: s(j.createdAt, 40),
      }),
    )
    if (role === 'branch') {
      const prev = await getJoinBacks()
      await saveJoinBacks(prev.filter((p) => p.branchId !== branch).concat(list))
      return res.status(200).json({ ok: true, count: list.length })
    }
    await saveJoinBacks(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'saveVendors') {
    if (role !== 'admin') return res.status(403).json({ error: 'Management only.' })
    const arr = Array.isArray(body.vendors) ? body.vendors : []
    const list: RecruitmentVendor[] = arr.slice(0, 500).map((v: Record<string, unknown>) => ({
      id: String(v.id || recruitNid('vn')),
      name: s(v.name, 120),
      contactPerson: s(v.contactPerson, 80),
      mobile: s(v.mobile, 20),
      branchesServed: s(v.branchesServed, 200),
      contractValidTill: s(v.contractValidTill, 20),
      guardsSupplied: Number(v.guardsSupplied) || 0,
      active: v.active !== false,
      remarks: s(v.remarks, 500),
      createdAt: s(v.createdAt, 40) || new Date().toISOString(),
    }))
    await saveVendors(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'saveConfig') {
    if (role !== 'admin') return res.status(403).json({ error: 'Management only.' })
    const c = (body.config ?? {}) as Record<string, unknown>
    const prev = await getConfig()
    const config: RecruitmentConfig = {
      shortageCount: recruitNum(c.shortageCount) || prev.shortageCount,
      previousShortage: prev.shortageCount,
      contractedStrength: recruitNum(c.contractedStrength),
      actualDeployed: recruitNum(c.actualDeployed),
      dailyTargetPerBranch: recruitNum(c.dailyTargetPerBranch) || prev.dailyTargetPerBranch,
      monthlyTarget: recruitNum(c.monthlyTarget) || prev.monthlyTarget,
      wageHoldSites: Array.isArray(c.wageHoldSites)
        ? (c.wageHoldSites as Record<string, unknown>[]).slice(0, 200).map((w) => ({
            id: String(w.id || recruitNid('wh')),
            siteZone: s(w.siteZone, 120),
            branchId: s(w.branchId, 80),
            riskLevel: (['watch', 'hold', 'release'].includes(String(w.riskLevel))
              ? w.riskLevel
              : 'watch') as 'watch' | 'hold' | 'release',
            attritionPct: s(w.attritionPct, 20),
            notes: s(w.notes, 500),
            updatedAt: new Date().toISOString(),
          }))
        : prev.wageHoldSites,
      updatedAt: new Date().toISOString(),
    }
    await saveConfig(config)
    return res.status(200).json({ ok: true, config })
  }

  if (action === 'shareDashboard') {
    if (role !== 'admin') return res.status(403).json({ error: 'Management portal only.' })
    const to = s(body.to, 120).toLowerCase()
    if (!to.includes('@')) return res.status(400).json({ error: 'Valid email required.' })
    const apiKey = process.env.RESEND_API_KEY?.trim()
    if (!apiKey) return res.status(503).json({ error: 'Email not configured.' })

    const [config, details] = await Promise.all([getConfig(), getDrrDetails()])
    const shortageSnap = await loadRecruitmentShortage({
      centres: RECRUIT_BRANCHES,
      configFallback: config.shortageCount,
    })
    const ymd = misTodayIst()
    const esc = (v: unknown) =>
      String(v ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')

    const countFor = (centre: string) => {
      let recruits = 0
      let rejoins = 0
      let resignations = 0
      let submitted = false
      for (const p of details) {
        if (p.active === false || p.reportDate !== ymd) continue
        const bid = String(p.branchId || '')
        let rows = p.recruits || []
        let resRows = p.resignations || []
        if (bid === centre || (centre === 'Bangalore' && /gulbarga|kalaburagi/i.test(bid))) {
          submitted = submitted || rows.length + (p.transfers?.length || 0) + resRows.length > 0
        } else if (isHydZoneCentre(centre)) {
          if (
            bid === centre ||
            hydZoneCentreFromText(bid) === centre ||
            /^(Hyderabad|Recruitment Department|Training Department|Training Academy)$/i.test(bid)
          ) {
            if (bid === centre || hydZoneCentreFromText(bid) === centre) {
              submitted = submitted || rows.length + resRows.length > 0
            } else {
              rows = rows.filter((r) => {
                const z = hydZoneCentreFromText(
                  `${r.unit || ''} ${r.location || ''} ${r.vacantPosition || ''} ${r.remarks || ''}`,
                )
                return z === centre
              })
              resRows = resRows.filter((r) => {
                const z = hydZoneCentreFromText(`${r.unit || ''} ${r.location || ''} ${r.remarks || ''}`)
                return z === centre
              })
              submitted = submitted || rows.length + resRows.length > 0
            }
          } else continue
        } else if (bid !== centre) continue
        else submitted = submitted || rows.length + (p.transfers?.length || 0) + resRows.length > 0

        for (const r of rows) {
          if (r.kind === 'rejoin') rejoins += 1
          else recruits += 1
        }
        resignations += resRows.length
      }
      return { recruits, rejoins, resignations, submitted }
    }

    const branchRows = (shortageSnap.byBranch || [])
      .slice()
      .sort((a, b) => a.branch.localeCompare(b.branch, 'en', { sensitivity: 'base' }))
      .map((b) => {
        const c = countFor(b.branch)
        return `<tr>
          <td>${esc(b.branch)}</td><td>${b.openingShortage}</td><td>${b.vac}</td><td>${b.ot}</td><td><b>${b.shortage}</b></td>
          <td>${c.submitted ? '✓ Submitted' : '⚠ Pending'}</td>
          <td>${c.recruits}</td><td>${c.rejoins}</td><td>${c.resignations}</td>
        </tr>`
      })
      .join('')

    const bodyHtml = `
      <p>Agile Recruitment <b>Management Dashboard</b> shared with you.</p>
      <div style="background:linear-gradient(135deg,#7f1d1d,#dc2626);color:#fff;padding:14px 16px;border-radius:10px;margin:14px 0">
        <b>Total Shortages ${shortageSnap.shortage}</b>
        <span style="opacity:.9"> · Opening Vacant ${shortageSnap.openingVac} + OT ${shortageSnap.openingOt} = ${shortageSnap.openingShortage} from Consolidated MIS ${esc(shortageSnap.openingDate || '2026-08-14')} · Remaining after ${shortageSnap.recruitsSinceBaseline || 0} recruits</span>
      </div>
      <table style="border-collapse:collapse;width:100%;font-size:12px" border="1" cellpadding="6">
        <thead style="background:#4c1d95;color:#fff"><tr>
          <th>Branch</th><th>Opening</th><th>Vacant</th><th>OT</th><th>Remaining</th><th>DRR</th><th>Recruited</th><th>Rejoin</th><th>Resigned</th>
        </tr></thead>
        <tbody>${branchRows || '<tr><td colspan="9">No branch rows.</td></tr>'}</tbody>
      </table>
      <p style="font-size:12px;color:#64748b;margin-top:12px">Opening locked to Consolidated MIS 14/08/2026 until recruitment is registered on DRR. Hyderabad A · B · Hi-Tech City from Training / Recruitment DRR. Gulbarga under Bangalore.</p>`

    const html = recruitEmailShell(
      'Recruitment Dashboard',
      `Shared · ${ymd}`,
      bodyHtml,
    )
    const resend = new Resend(apiKey)
    const from = process.env.EMAIL_FROM ?? 'Agile Recruitment <noreply@agilegroup.co.in>'
    const result = await sendSuiteEmail(resend, {
      from,
      to,
      subject: `Agile Recruitment — Dashboard — ${ymd}`,
      html,
    })
    if (result.error) return res.status(502).json({ error: result.error.message ?? 'Send failed' })
    noteItSuiteChange(otpSession.email, 'Recruitment', 'recruitment', 'shareDashboard')
    return res.status(200).json({ ok: true, to })
  }

  if (action === 'saveUsers') {
    if (role !== 'admin') return res.status(403).json({ error: 'Management only.' })
    const arr = Array.isArray(body.users) ? body.users : []
    const list = arr.slice(0, 500).map((u: Record<string, unknown>) => normalizeUser(u as Partial<RecruitUser>))
    await saveUsers(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'approveRequisition') {
    if (role !== 'admin') return res.status(403).json({ error: 'Management only.' })
    const id = s(body.id, 40)
    const status = s(body.status, 20) as ManpowerRequisition['status']
    const reqs = await getRequisitions()
    const updated = reqs.map((r) =>
      r.id === id ? { ...r, status: status || 'approved', approvedBy: recruitUser.name } : r,
    )
    await saveRequisitions(updated)
    return res.status(200).json({ ok: true })
  }

  if (action === 'syncAttendance') {
    const asOf = s(body.asOf, 20) || new Date().toISOString().slice(0, 10)
    const sync = await syncWork360AttendanceRange(asOf, 14)
    return res.status(200).json({ ok: sync.ok, asOf, ...sync })
  }

  if (action === 'absconders') {
    const asOf = s(body.asOf, 20) || new Date().toISOString().slice(0, 10)
    const minDays = Math.max(1, Number(body.minDays) || 7)
    let sync: Awaited<ReturnType<typeof syncWork360AttendanceRange>> | null = null
    if (body.syncFirst === true) {
      try {
        sync = await syncWork360AttendanceRange(asOf, 14)
      } catch (err) {
        sync = {
          ok: false,
          endDate: asOf,
          days: 14,
          saved: 0,
          error: err instanceof Error ? err.message : 'Attendance sync failed',
        }
      }
    }
    let guards = await loadAbsconders(asOf, minDays)
    const branchFilter =
      role === 'branch' && branch ? branch : s(body.branchFilter, 80) || 'ALL'
    if (branchFilter && branchFilter !== 'ALL') {
      const needle = branchFilter.toLowerCase()
      guards = guards.filter((g) => {
        if (sameRecruitBranch(g.branch, branchFilter) || sameRecruitBranch(g.branchHint, branchFilter)) return true
        const hay = `${g.branch} ${g.branchHint} ${g.client} ${g.unit}`.toLowerCase()
        return hay.includes(needle)
      })
    }
    const groups = groupAbscondersByBranch(guards)
    const fromJoinback = guards.filter((g) => g.source === 'joinback').length
    return res.status(200).json({
      ok: true,
      asOf,
      minDays,
      count: guards.length,
      guards,
      groups,
      fromJoinback,
      work360Configured: !!work360Config(),
      sync,
      hint: !guards.length
        ? sync?.error ||
          (work360Config()
            ? 'No 7+ day absconders yet. Tap Sync & Refresh, or log absent guards under Roster & Join-Backs.'
            : 'Add Work360 settings on server, or log absent guards under Roster & Join-Backs.')
        : sync?.saved
          ? undefined
          : fromJoinback
            ? `${fromJoinback} from Join-Back log (mobile attendance export had no rows).`
            : undefined,
    })
  }

  if (action === 'updateAbsconderFollow') {
    const key = s(body.key, 200) || absconderFollowKey({
      employeeId: s(body.employeeId, 40),
      guardName: s(body.guardName, 120),
      mobile: s(body.mobile, 20),
    })
    const status = body.status === 'joined' ? 'joined' : body.status === 'pending' ? 'pending' : undefined
    const remind = body.remind === true
    const row = await upsertAbsconderFollow(key, {
      status,
      remindedAt: remind ? new Date().toISOString() : undefined,
    })
    if (status === 'joined') {
      const joins = await getJoinBacks()
      const name = s(body.guardName, 120)
      const mobile = s(body.mobile, 20)
      const hit = joins.find(
        (j) =>
          j.active !== false &&
          ((mobile && j.mobile === mobile) || (name && j.guardName.toLowerCase() === name.toLowerCase())),
      )
      if (hit) {
        hit.status = 'rejoined'
        hit.rejoinDate = misTodayIst()
        await saveJoinBacks(joins)
      } else if (name) {
        joins.push(
          normalizeJoinBack({
            branchId: role === 'branch' ? branch || '' : s(body.branch, 80),
            guardName: name,
            mobile,
            siteZone: s(body.unit, 120),
            leftDate: s(body.absentSince, 20),
            rejoinDate: misTodayIst(),
            status: 'rejoined',
            reason: 'Marked Joined from Absconder List',
          }),
        )
        await saveJoinBacks(joins)
      }
    }
    const waText = absconderReminderText({
      key,
      employeeId: s(body.employeeId, 40),
      guardName: s(body.guardName, 120),
      mobile: s(body.mobile, 20),
      client: s(body.client, 120),
      unit: s(body.unit, 120),
      absentSince: s(body.absentSince, 20),
      consecutiveDays: Math.max(7, Number(body.consecutiveDays) || 7),
      branch: s(body.branch, 80),
      branchHint: s(body.branch, 80),
      followStatus: row.status,
      remindedAt: row.remindedAt,
    })
    const digits = s(body.mobile, 20).replace(/\D/g, '').slice(-10)
    return res.status(200).json({
      ok: true,
      follow: row,
      waUrl: digits ? `https://wa.me/91${digits}?text=${encodeURIComponent(waText)}` : '',
      reminderText: waText,
    })
  }

  if (action === 'shareAbsconders') {
    const to = s(body.to, 120).toLowerCase()
    if (!to.includes('@')) return res.status(400).json({ error: 'Valid email required.' })
    const apiKey = process.env.RESEND_API_KEY?.trim()
    if (!apiKey) return res.status(503).json({ error: 'Email not configured.' })
    const asOf = s(body.asOf, 20) || misTodayIst()
    let guards = await loadAbsconders(asOf, 7)
    const branchFilter =
      role === 'branch' && branch ? branch : s(body.branchFilter, 80) || 'ALL'
    if (branchFilter && branchFilter !== 'ALL') {
      guards = guards.filter((g) => sameRecruitBranch(g.branch, branchFilter))
    }
    const groups = groupAbscondersByBranch(guards)
    const html = recruitEmailShell(
      'Absconder List (7+ days)',
      `Branch-wise · highest first · ${asOf}`,
      absconderShareHtml(asOf, groups),
    )
    const resend = new Resend(apiKey)
    const from = process.env.EMAIL_FROM ?? 'Agile Recruitment <noreply@agilegroup.co.in>'
    const result = await sendSuiteEmail(resend, {
      from,
      to,
      subject: `Agile Recruitment — Absconder List (7+ days) — ${asOf}`,
      html,
    })
    if (result.error) return res.status(502).json({ error: result.error.message ?? 'Send failed' })
    noteItSuiteChange(otpSession.email, 'Recruitment', 'recruitment', 'shareAbsconders')
    return res.status(200).json({ ok: true, to, count: guards.length })
  }

  if (action === 'previewAbsconderTermination' || action === 'sendAbsconderTermination') {
    const noticeDate = misTodayIst()
    const one = {
      key: s(body.key, 200),
      employeeId: s(body.employeeId, 40),
      guardName: s(body.guardName, 120),
      mobile: s(body.mobile, 20),
      unit: s(body.unit, 120),
      client: s(body.client, 120),
      absentSince: s(body.absentSince, 20),
      consecutiveDays: Math.max(7, Number(body.consecutiveDays) || 7),
      branch: s(body.branch, 80),
      noticeDate,
    }
    const rawPeople = Array.isArray(body.people) ? body.people : [body]
    const people = (rawPeople.length ? rawPeople : [one]).slice(0, 20).map((raw) => {
      const p = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
      return {
        key: s(p.key, 200),
        employeeId: s(p.employeeId, 40),
        guardName: s(p.guardName, 120),
        mobile: s(p.mobile, 20),
        unit: s(p.unit, 120),
        client: s(p.client, 120),
        absentSince: s(p.absentSince, 20),
        consecutiveDays: Math.max(7, Number(p.consecutiveDays) || 7),
        branch: s(p.branch, 80),
        noticeDate,
      }
    })
    if (action === 'previewAbsconderTermination') {
      const row = people[0] || one
      return res.status(200).json({
        ok: true,
        text: absconderTerminationNoticeText(row),
        html: absconderTerminationNoticeHtml(row),
      })
    }
    const { waSendText, whatsappChatId, whatsappConfigured } = await import('../_lib/pulse/whatsapp.js')
    if (!whatsappConfigured()) {
      return res.status(503).json({ error: 'WhatsApp sending line is not connected.' })
    }
    const results: { name: string; mobile: string; ok: boolean; error?: string }[] = []
    const chunk = 4
    for (let i = 0; i < people.length; i += chunk) {
      const slice = people.slice(i, i + chunk)
      const part = await Promise.all(
        slice.map(async (row) => {
          const digits = String(row.mobile || '').replace(/\D/g, '').slice(-10)
          if (digits.length !== 10) {
            return { name: row.guardName, mobile: digits, ok: false, error: 'Mobile missing' }
          }
          if (role === 'branch' && branch && row.branch && !sameRecruitBranch(row.branch, branch)) {
            return { name: row.guardName, mobile: digits, ok: false, error: 'Other branch' }
          }
          const text = absconderTerminationNoticeText(row)
          const r = await waSendText(whatsappChatId(digits), text)
          if (!r?.ok) {
            return { name: row.guardName, mobile: digits, ok: false, error: 'WhatsApp did not go' }
          }
          const key =
            row.key ||
            absconderFollowKey({
              employeeId: row.employeeId,
              guardName: row.guardName,
              mobile: digits,
            })
          await upsertAbsconderFollow(key, { terminatedAt: new Date().toISOString() })
          return { name: row.guardName, mobile: digits, ok: true }
        }),
      )
      results.push(...part)
    }
    const sent = results.filter((x) => x.ok).length
    const failed = results.filter((x) => !x.ok).length
    if (sent < 1) {
      return res.status(502).json({
        error: results[0]?.error || 'Termination notice did not go out. Check the WhatsApp line.',
        sent,
        failed,
        results,
      })
    }
    noteItSuiteChange(otpSession.email, 'Recruitment', 'recruitment', 'sendAbsconderTermination')
    return res.status(200).json({
      ok: true,
      sent,
      failed,
      results,
      text: absconderTerminationNoticeText(people[0] || one),
      html: absconderTerminationNoticeHtml(people[0] || one),
    })
  }

  if (action === 'trainingEoiFollowUps' || action === 'syncTrainingEoi') {
    const {
      listTrainingEoiFollowUps,
      filterTrainingEoiRows,
      syncTrainingEoiFromSessions,
    } = await import('../_lib/recruitment/training-eoi-store.js')
    if (action === 'syncTrainingEoi' || body.syncFirst === true) {
      await syncTrainingEoiFromSessions({ months: 1 })
    }
    let rows = await listTrainingEoiFollowUps()
    const kind =
      body.kind === 'absentee_doj' || body.kind === 'attend' || body.kind === 'all'
        ? body.kind
        : 'all'
    const followStatus =
      body.followStatus === 'pending' ||
      body.followStatus === 'contacted' ||
      body.followStatus === 'rejoined' ||
      body.followStatus === 'closed' ||
      body.followStatus === 'all'
        ? body.followStatus
        : 'all'
    const branchFilter = role === 'branch' && branch ? branch : s(body.branchFilter, 80) || 'ALL'
    rows = filterTrainingEoiRows(rows, {
      branchName: branchFilter === 'ALL' ? '' : branchFilter,
      kind,
      followStatus,
    })
    const dojCount = rows.filter((r) => r.eoiJoiningDate).length
    return res.status(200).json({
      ok: true,
      count: rows.length,
      dojCount,
      rows,
      hint:
        rows.length === 0
          ? 'No Training EOI replies yet. After Training sends WhatsApp, EOI / EOI DOJ replies appear here. Tap Sync from Training.'
          : `${dojCount} absentee DOJ reply(ies) · ${rows.length} total EOI.`,
    })
  }

  if (action === 'updateTrainingEoiFollowUp') {
    const { updateTrainingEoiFollowUp } = await import('../_lib/recruitment/training-eoi-store.js')
    const id = s(body.id, 80)
    const followStatus =
      body.followStatus === 'pending' ||
      body.followStatus === 'contacted' ||
      body.followStatus === 'rejoined' ||
      body.followStatus === 'closed'
        ? body.followStatus
        : undefined
    const result = await updateTrainingEoiFollowUp({
      id,
      followStatus,
      followNotes: body.followNotes != null ? s(body.followNotes, 1000) : undefined,
      by: otpSession.email || branch || role,
    })
    if (!result.ok) return res.status(404).json({ ok: false, error: result.error })
    return res.status(200).json({ ok: true, row: result.row })
  }

  if (action === 'funnelFollowupList') {
    const {
      isFunnelKind,
      loadFunnelDateBook,
      countFunnelBuckets,
    } = await import('../_lib/recruitment/funnel-followup-store.js')
    const { loadFunnelFollowup, filterFunnelByBranch } = await import(
      '../_lib/recruitment/funnel-extract.js'
    )
    const kindRaw = s(body.kind, 20).toLowerCase()
    if (!isFunnelKind(kindRaw)) return res.status(400).json({ error: 'Unknown follow-up list.' })
    const asOf = s(body.asOf, 20) || misTodayIst()
    const month = s(body.month, 10) || asOf.slice(0, 7)
    const syncFirst = body.syncFirst === true
    const snap = await loadFunnelFollowup(kindRaw, {
      sync: syncFirst,
      asOf,
      month,
    })
    const allBranches = role !== 'branch' && (body.allBranches === true || s(body.branchId, 80) === 'ALL')
    const scope = role === 'branch' ? branch || '' : s(body.branchId, 80) || 'ALL'
    const people = filterFunnelByBranch(snap.people, scope, allBranches || scope === 'ALL', kindRaw)
    const todayYmd = misTodayIst()
    const dateBook = await loadFunnelDateBook(kindRaw)
    return res.status(200).json({
      ok: true,
      kind: kindRaw,
      people,
      counts: countFunnelBuckets(people, todayYmd),
      dateBook,
      extractedAt: snap.extractedAt,
      asOf: snap.asOf || asOf,
      month: snap.month || month,
      hint: snap.hint,
      remembered: !syncFirst,
    })
  }

  if (action === 'saveFunnelDate') {
    const { isFunnelKind, rememberFunnelDates, loadFunnelSnapshot, saveFunnelSnapshot, applyFunnelDateBook, loadFunnelDateBook } =
      await import('../_lib/recruitment/funnel-followup-store.js')
    const kindRaw = s(body.kind, 20).toLowerCase()
    if (!isFunnelKind(kindRaw)) return res.status(400).json({ error: 'Unknown follow-up list.' })
    const field = s(body.field, 40)
    const value = ymdFollowup(s(body.value, 20))
    const phone = s(body.phone, 20)
    const id = s(body.id, 80)
    if (!isSjFollowupDateField(field)) {
      return res.status(400).json({ error: 'Unknown follow-up date.' })
    }
    const recruitOnly = field === 'call3At' || field === 'joinedAt' || field === 'holdRemindOn'
    if (recruitOnly && role === 'branch' && branch !== 'Recruitment Department') {
      return res.status(403).json({
        error: 'Call 3, Joined date and Hold on are for the Recruitment team.',
      })
    }
    const refs = { phone, id }
    if (!value) {
      const { datesFromBook } = await import('../_lib/recruitment/sj-followup-dates.js')
      const kept = datesFromBook(refs, await loadFunnelDateBook(kindRaw))
      return res.status(200).json({
        ok: true,
        kept: true,
        dates: kept,
        message: 'Dates stay saved. They cannot be deleted.',
      })
    }
    let saved = await rememberFunnelDates(kindRaw, refs, { [field]: value })
    try {
      const snap = await loadFunnelSnapshot(kindRaw)
      if (snap) {
        const mob = String(phone || '').replace(/\D/g, '').slice(-10)
        let hit = false
        snap.people = snap.people.map((p) => {
          const same = p.id === id || (mob.length === 10 && p.phone === mob)
          if (!same) return p
          hit = true
          return { ...p, ...saved.dates, [field]: value }
        })
        if (hit) await saveFunnelSnapshot(snap)
        if (!saved.ok && hit) saved = { ok: true, dates: { ...saved.dates, [field]: value } }
      }
    } catch {
      /* date book already saved */
    }
    if (!saved.ok) {
      return res.status(500).json({ error: saved.error || 'Date could not be saved. Try again.' })
    }
    return res.status(200).json({
      ok: true,
      field,
      value,
      dates: saved.dates,
      popup: 'Saved',
      message: 'Saved',
    })
  }

  if (action === 'funnelWhatsApp') {
    const { isFunnelKind } = await import('../_lib/recruitment/funnel-followup-store.js')
    const { funnelWaUrl, funnelWhatsAppText } = await import('../_lib/recruitment/funnel-extract.js')
    const kindRaw = s(body.kind, 20).toLowerCase()
    if (!isFunnelKind(kindRaw)) return res.status(400).json({ error: 'Unknown follow-up list.' })
    const name = s(body.name, 120)
    const mobile = s(body.mobile, 20)
    const text = funnelWhatsAppText(kindRaw, name)
    const wa = funnelWaUrl(kindRaw, mobile, name)
    if (!String(mobile || '').replace(/\D/g, '').slice(-10)) {
      return res.status(400).json({ error: 'Mobile number missing.' })
    }
    return res.status(200).json({ ok: true, waUrl: wa, text })
  }

  if (action === 'securityNewsRegisteredList') {
    const { listQuizPeopleForRecruitment } = await import('../_lib/pulse/quiz.js')
    const pack = await listQuizPeopleForRecruitment()
    return res.status(200).json({
      ok: true,
      people: pack.people,
      answers: pack.answers,
      count: pack.people.length,
    })
  }

  if (action === 'securityJobListExcel' || action === 'securityNewsListExcel') {
    const {
      buildSecurityJobExcel,
      buildSecurityNewsExcel,
      excelAsBase64,
      SECURITY_JOB_XLSX,
      SECURITY_NEWS_XLSX,
    } = await import('../_lib/recruitment/securityjob-list-excel.js')
    const job = action === 'securityJobListExcel'
    const buf = job ? await buildSecurityJobExcel() : await buildSecurityNewsExcel()
    return res.status(200).json({
      ok: true,
      filename: job ? SECURITY_JOB_XLSX : SECURITY_NEWS_XLSX,
      base64: excelAsBase64(buf),
    })
  }

  if (action === 'sjInvitePreview') {
    const id = s(body.id, 80)
    if (!id) return res.status(400).json({ error: 'Candidate required.' })
    const allCandidates = await loadAllRegisteredCandidates().then((list) =>
      list.map((r) => ensureRegistrationOwnership(r)),
    )
    const hit = allCandidates.find((r) => r.id === id && r.active !== false)
    if (!hit) return res.status(404).json({ error: 'Registration not found.' })
    const centre = resolveRecruitmentCentre(hit.location || hit.branchId)
    const draft = buildSecurityJobWhatsApp({
      kind: s(body.kind, 12) === 'remind' ? 'remind' : 'invite',
      name: hit.name,
      regCode: hit.regCode,
      centreCity: centre.city,
      mapsUrl: centre.mapsUrl,
      helpDesk: centre.helpDesk,
      centralCommand: centre.centralCommand,
      tentativeJoinDate: hit.tentativeJoinDate,
    })
    const { listSjInviteRecipients, publicInviteRecipients, sjInviteAlwaysCopyMobiles } = await import(
      '../_lib/recruitment/sj-invite-recipients.js'
    )
    const recipients = await listSjInviteRecipients()
    return res.status(200).json({
      ok: true,
      candidateName: hit.name,
      draft,
      recipients: publicInviteRecipients(recipients),
      copyNote: 'Always copied to Director and 9500915599 (app).',
      copyCount: sjInviteAlwaysCopyMobiles().length,
    })
  }

  if (action === 'securityNewsWhatsApp') {
    const name = s(body.name, 80)
    const mobile = s(body.mobile, 20)
    const mob = mobile.replace(/\D/g, '').slice(-10)
    if (mob.length < 10) return res.status(400).json({ error: 'Mobile number missing.' })
    const text = buildSecurityNewsWhatsApp({ name })
    return res.status(200).json({ ok: true, waUrl: recruitWaUrl(mob, text), text })
  }

  if (action === 'saveSjDate') {
    const field = s(body.field, 40)
    const value = ymdFollowup(s(body.value, 20))
    const phone = s(body.phone, 20)
    const id = s(body.id, 80)
    const regCode = s(body.regCode, 40)
    if (!isSjFollowupDateField(field)) {
      return res.status(400).json({ error: 'Unknown follow-up date.' })
    }
    const recruitOnly = field === 'call3At' || field === 'joinedAt' || field === 'holdRemindOn'
    if (recruitOnly && role === 'branch' && branch !== 'Recruitment Department') {
      return res.status(403).json({
        error: 'Call 3, Joined date and Hold on are for the Recruitment team.',
      })
    }
    const refs = { phone, id, regCode }
    if (!value) {
      const kept = datesFromBook(refs, await loadSjFollowupDateBook())
      return res.status(200).json({
        ok: true,
        kept: true,
        dates: kept,
        message: 'Dates stay saved. They cannot be deleted.',
      })
    }
    const saved = await rememberSjFollowupDates(refs, { [field]: value })
    if (!saved.ok) {
      return res.status(500).json({ error: saved.error || 'Date could not be saved. Try again.' })
    }
    let popup =
      field === 'call1At'
        ? 'Saved Call 1'
        : field === 'tentativeJoinDate'
          ? 'Saved Tentative date'
          : field === 'call2At'
            ? 'Saved Call 2'
            : field === 'call3At'
              ? 'Saved Call 3'
              : field === 'joinedAt'
                ? 'Saved Joined date'
                : 'Saved Hold on date'
    if (field === 'tentativeJoinDate') {
      const letter = await sendSjProvisionalJoinOrder({
        phone,
        id,
        regCode,
        tentativeJoinDate: value,
      })
      popup = letter.ok
        ? 'Saved Tentative date. WhatsApp joining letter sent to the candidate.'
        : `Saved Tentative date. ${letter.error || 'WhatsApp could not be sent — tap Send joining letter.'}`
    }
    return res.status(200).json({
      ok: true,
      field,
      value,
      dates: saved.dates,
      popup,
      message: popup,
    })
  }

  if (action === 'sendSjJoinOrder') {
    const id = s(body.id, 80)
    const phone = s(body.phone, 20)
    const all = await loadAllRegisteredCandidates()
    const hit = all.find(
      (r) =>
        r.active !== false &&
        (r.id === id ||
          (phone && r.phone.replace(/\D/g, '').slice(-10) === phone.replace(/\D/g, '').slice(-10))),
    )
    if (!hit) return res.status(404).json({ error: 'Registration not found.' })
    const doj = ymdFollowup(hit.tentativeJoinDate)
    if (!doj) return res.status(400).json({ error: 'Save Tentative date first.' })
    const letter = await sendSjProvisionalJoinOrder({
      phone: hit.phone,
      id: hit.id,
      name: hit.name,
      regCode: hit.regCode,
      tentativeJoinDate: doj,
      location: hit.location || hit.branchId,
    })
    if (!letter.ok) return res.status(502).json({ error: letter.error || 'WhatsApp joining letter did not go out.' })
    return res.status(200).json({
      ok: true,
      popup: 'WhatsApp joining letter sent to the candidate.',
      message: 'WhatsApp joining letter sent to the candidate.',
    })
  }

  if (action === 'candidatesPipeline') {
    const allBranches = body.allBranches === true || s(body.branchId, 80) === 'ALL'
    const recruitBranch =
      role === 'branch' ? (branch ?? '') : s(body.branchId, 80) || s(body.branch, 80)
    if (!allBranches && !recruitBranch) return res.status(400).json({ error: 'Branch required.' })
    const todayYmd = misTodayIst()
    const nowMs = Date.now()
    const all = await loadAllRegisteredCandidates()
    const dateBook = await hydrateSjDatesFromPersonKeys(await loadSjFollowupDateBook(), all)
    const candidates = all
      .filter((r) => r.active !== false)
      .map((r) => applySjFollowupDateBook(ensureRegistrationOwnership(r), dateBook))
      .filter((r) => {
        const owner = r.ownerTeam || 'Recruitment Department'
        if (allBranches) return true
        /** Management branch filter "Hyderabad" = Recruitment Department queue */
        if (role === 'admin' && recruitBranch === 'Hyderabad') {
          return owner === 'Recruitment Department'
        }
        return securityJobListVisibleForScope(owner, recruitBranch, false)
      })
      .map((r) => {
        const registeredOn = registrationDay(r.createdAt, r.regCode)
        const sla = computeCallSla(r, nowMs)
        return {
          ...r,
          ownerTeam: sla.ownerTeam,
          callDueAt: sla.callDueAt,
          registeredOn,
          sortTs: registrationSortTs(r.createdAt, r.regCode, registeredOn),
          pipelineBucket: sjFollowBucket(r, todayYmd),
          call1At: ymdFollowup(r.call1At) || sjCall1At(r),
          holdRemindOn: sjHoldOn(r),
          slaPct: sla.slaPct,
          slaRemainingMs: sla.remainingMs,
          slaOverdue: sla.overdue,
          slaMet: sla.met,
          slaLabel: sla.label,
        }
      })
      .sort((a, b) => {
        /** Last come first — newest registration at the top */
        return (b.sortTs ?? 0) - (a.sortTs ?? 0) || String(b.id).localeCompare(String(a.id))
      })
    const phones = candidates.map((c) => c.phone)
    const [joinOrders, aiCalls, askDates] = await Promise.all([
      loadSjJoinOrderMap(phones),
      loadSjAiCallMap(phones),
      loadSjAskDateMap(phones),
    ])
    const withLetters = candidates.map((c) => {
      const mob = String(c.phone || '').replace(/\D/g, '').slice(-10)
      const order = joinOrders[mob]
      const call = aiCalls[mob]
      const ask = askDates[mob]
      return {
        ...c,
        joinOrderStatus: order?.status || '',
        joinOrderSentAt: order?.sentAt || '',
        aiCallStatus: call?.status || '',
        askDateStatus: ask?.status || '',
      }
    })
    const counts = { call1: 0, call2: 0, call3: 0, hold: 0, joined: 0, holdToday: 0 }
    for (const c of withLetters) {
      const b = c.pipelineBucket
      if (b === 'call2') counts.call2++
      else if (b === 'call3') counts.call3++
      else if (b === 'hold') {
        counts.hold++
        if (String(c.holdRemindOn || c.waitingListAt || '').slice(0, 10) === todayYmd) counts.holdToday++
      } else if (b === 'joined') counts.joined++
      else counts.call1++
    }
    let inviteRecipients: { id: string; label: string; group: string; hasMobile: boolean }[] = []
    try {
      const { listSjInviteRecipients, publicInviteRecipients } = await import(
        '../_lib/recruitment/sj-invite-recipients.js'
      )
      inviteRecipients = publicInviteRecipients(await listSjInviteRecipients())
    } catch {
      inviteRecipients = [{ id: 'recruitment', label: 'Recruitment department', group: 'recruitment', hasMobile: false }]
    }
    return res.status(200).json({
      ok: true,
      today: todayYmd,
      branchId: allBranches ? 'ALL' : recruitBranch,
      counts,
      candidates: withLetters,
      dateBook,
      inviteRecipients,
    })
  }

  if (action === 'registeredCandidateAction') {
    const id = s(body.id, 80)
    const act = s(body.subAction, 40) || s(body.actionName, 40)
    if (!id || !act) return res.status(400).json({ error: 'Candidate and action required.' })

    const allCandidates = await loadAllRegisteredCandidates().then((list) =>
      list.map((r) => ensureRegistrationOwnership(r)),
    )
    const actionPhone = s(body.phone, 20).replace(/\D/g, '').slice(-10)
    let hit = allCandidates.find((r) => r.id === id && r.active !== false)
    if (!hit && actionPhone.length === 10) {
      hit = allCandidates.find(
        (r) => r.active !== false && r.phone.replace(/\D/g, '').slice(-10) === actionPhone,
      )
    }
    if (!hit) return res.status(404).json({ error: 'Registration not found.' })
    if (
      role === 'branch' &&
      branch &&
      !securityJobListVisibleForScope(hit.ownerTeam || 'Recruitment Department', branch, false)
    ) {
      return res.status(403).json({ error: 'You can only update registrations owned by your team.' })
    }

    hit = await materializeSjRegistration(hit)
    const workId = hit.id
    const now = new Date().toISOString()
    const todayYmd = misTodayIst()
    let waUrl: string | undefined

    const all = await getRegistrations()
    let idx = all.findIndex((r) => r.id === workId && r.active !== false)
    if (idx < 0 && actionPhone.length === 10) {
      idx = all.findIndex(
        (r) => r.active !== false && r.phone.replace(/\D/g, '').slice(-10) === actionPhone,
      )
    }
    if (idx < 0) return res.status(404).json({ error: 'Registration not found.' })
    const row = ensureRegistrationOwnership({ ...all[idx] })
    if (!row.ownerTeam) row.ownerTeam = resolveRegistrationOwner(row.location, row.branchId)

    const touchCall = () => {
      if (!row.firstCalledAt) row.firstCalledAt = now
      if (!row.calledAt) row.calledAt = todayYmd
    }

    if (act === 'log_call' || act === 'contacted') {
      row.calledAt = s(body.calledAt, 20) || todayYmd
      touchCall()
      if (row.status === 'new') row.status = 'contacted'
    } else if (act === 'set_tentative_doj' || act === 'record_reply') {
      const tentativeJoinDate = s(body.tentativeJoinDate, 20)
      if (!tentativeJoinDate) {
        return res.status(400).json({ error: 'Tentative date of joining required.' })
      }
      row.tentativeJoinDate = tentativeJoinDate
      row.replyAt = now
      row.replyNotes = s(body.replyNotes, 500) || s(body.followUpNotes, 500) || row.replyNotes
      touchCall()
      if (row.status === 'new' || row.status === 'contacted' || row.status === 'auto_reply') {
        row.status = 'replied'
      }
    } else if (act === 'follow_up') {
      const notes = s(body.replyNotes, 500) || s(body.followUpNotes, 500)
      if (notes) row.replyNotes = notes
      const tentativeJoinDate = s(body.tentativeJoinDate, 20)
      if (tentativeJoinDate) row.tentativeJoinDate = tentativeJoinDate
      touchCall()
      row.calledAt = s(body.calledAt, 20) || todayYmd
      if (row.status === 'new') row.status = 'contacted'
    } else if (act === 'mark_joined') {
      row.status = 'joined'
      row.joinedAt = s(body.joinedAt, 20) || todayYmd
      touchCall()
    } else if (act === 'mark_recruited') {
      if (role === 'branch' && branch !== 'Recruitment Department') {
        return res.status(403).json({
          error: 'Recruited and Reopen are for the Recruitment team.',
        })
      }
      row.status = 'joined'
      row.joinedAt = ymdFollowup(row.joinedAt) || todayYmd
      row.recruitClosed = true
      delete row.reopenedAt
      touchCall()
      try {
        await rememberSjFollowupDates(
          { phone: row.phone, id: row.id, regCode: row.regCode },
          { joinedAt: row.joinedAt },
        )
      } catch {
        /* row save below still keeps the date */
      }
    } else if (act === 'reopen_recruit') {
      if (role === 'branch' && branch !== 'Recruitment Department') {
        return res.status(403).json({
          error: 'Recruited and Reopen are for the Recruitment team.',
        })
      }
      row.recruitClosed = false
      row.reopenedAt = now
      if (row.status === 'joined') row.status = 'replied'
    } else if (act === 'rejected' || act === 'not_willing') {
      row.status = act === 'not_willing' ? 'not_willing' : 'rejected'
      const rejDay = s(body.rejectedAt, 20) || todayYmd
      row.rejectedAt = rejDay
      if (act === 'not_willing') row.notWillingAt = rejDay
    } else if (act === 'set_followup') {
      const field = s(body.field, 40)
      const value = ymdFollowup(s(body.value, 20))
      const recruitOnly = field === 'call3At' || field === 'joinedAt' || field === 'holdRemindOn'
      if (
        recruitOnly &&
        role === 'branch' &&
        branch !== 'Recruitment Department'
      ) {
        return res.status(403).json({
          error: 'Call 3, Joined date and Hold on are for the Recruitment team.',
        })
      }
      if (!isSjFollowupDateField(field)) {
        return res.status(400).json({ error: 'Unknown follow-up date.' })
      }
      if (!value) {
        const kept = preserveSjFollowupDates(all[idx] as Record<string, unknown>, normalizeRegistration(row))
        return res.status(200).json({
          ok: true,
          kept: true,
          candidate: kept,
          message: 'Dates stay saved. They cannot be deleted.',
        })
      }
      if (field === 'call1At') {
        row.call1At = value
        row.calledAt = row.calledAt || value
        touchCall()
        if (row.status === 'new') row.status = 'contacted'
      } else if (field === 'call2At') {
        row.call2At = value
        touchCall()
        if (row.status === 'new') row.status = 'contacted'
      } else if (field === 'call3At') {
        row.call3At = value
        touchCall()
      } else if (field === 'tentativeJoinDate') {
        row.tentativeJoinDate = value
        if (row.status === 'new' || row.status === 'contacted' || row.status === 'auto_reply') {
          row.status = 'replied'
        }
      } else if (field === 'joinedAt') {
        row.joinedAt = value
        row.status = 'joined'
        touchCall()
      } else if (field === 'holdRemindOn') {
        row.holdRemindOn = value
        row.waitingListAt = row.waitingListAt || value
        if (row.status === 'new') row.status = 'contacted'
      }
      let savedDates = mergeSjFollowupDates(all[idx] as Record<string, unknown>, row, { [field]: value })
      try {
        const remembered = await rememberSjFollowupDates(
          { phone: row.phone, id: row.id, regCode: row.regCode },
          savedDates,
        )
        if (remembered.ok) savedDates = remembered.dates
      } catch {
        /* row save below still keeps the date */
      }
      Object.assign(row, savedDates)
      const stampPhone = String(row.phone || actionPhone || '').replace(/\D/g, '').slice(-10)
      if (stampPhone.length === 10) {
        for (let i = 0; i < all.length; i++) {
          if (all[i].phone.replace(/\D/g, '').slice(-10) !== stampPhone) continue
          Object.assign(all[i], savedDates)
        }
      }
    } else if (act === 'waiting_list') {
      row.waitingListAt = s(body.waitingListAt, 20) || todayYmd
      row.calledAt = s(body.calledAt, 20) || row.calledAt || todayYmd
      touchCall()
      if (row.status === 'new') row.status = 'contacted'
      row.replyNotes = s(body.replyNotes, 500) || row.replyNotes
    } else if (act === 'send_whatsapp' || act === 'remind_whatsapp') {
      const isRemind = act === 'remind_whatsapp'
      if (isRemind) touchCall()
      const centre = resolveRecruitmentCentre(row.location || row.branchId)
      const msg = buildSecurityJobWhatsApp({
        kind: isRemind ? 'remind' : 'invite',
        name: row.name,
        regCode: row.regCode,
        centreCity: centre.city,
        mapsUrl: centre.mapsUrl,
        helpDesk: centre.helpDesk,
        centralCommand: centre.centralCommand,
        tentativeJoinDate: row.tentativeJoinDate,
      })
      const toId = s(body.toId, 80)
      if (!toId) {
        return res.status(400).json({ error: 'Select an HOD or Recruitment department.' })
      }
      const {
        listSjInviteRecipients,
        mobilesForInviteRecipient,
        sjInviteAlwaysCopyMobiles,
      } = await import('../_lib/recruitment/sj-invite-recipients.js')
      const { waSendText, whatsappConfigured } = await import('../_lib/pulse/whatsapp.js')
      const recipients = await listSjInviteRecipients()
      const primary = mobilesForInviteRecipient(recipients, toId)
      if (!primary.length) {
        return res.status(400).json({
          error: 'That name has no WhatsApp number yet. Pick another HOD or Recruitment department.',
        })
      }
      const targets = [...new Set([...primary, ...sjInviteAlwaysCopyMobiles()])]
      if (!whatsappConfigured()) {
        return res.status(503).json({ error: 'WhatsApp sending line is not connected.' })
      }
      let sent = 0
      for (const to of targets) {
        const r = await waSendText(to, msg)
        if (r?.ok) sent += 1
      }
      if (sent < 1) {
        return res.status(502).json({
          error: isRemind
            ? 'WhatsApp reminder did not go out. Check the 6626 line.'
            : 'WhatsApp invitation did not go out. Check the 6626 line.',
        })
      }
      if (!isRemind) {
        if (row.status === 'new') row.status = 'auto_reply'
        row.autoReplyAt = now
        row.noticeSentAt = now
        row.whatsappInviteAt = todayYmd
      }
      touchCall()
      all[idx] = preserveSjFollowupDates(
        all[idx] as Record<string, unknown>,
        normalizeRegistration(row),
      )
      await saveRegistrations(all)
      void rememberCandidatesInCustody([all[idx]]).catch(() => {})
      return res.status(200).json({
        ok: true,
        candidate: all[idx],
        sent,
        tried: targets.length,
        message: isRemind
          ? 'WhatsApp reminder sent to the selected person, and copied to Director and 9500915599.'
          : 'WhatsApp invitation sent to the selected person, and copied to Director and 9500915599.',
      })
    } else {
      return res.status(400).json({ error: 'Unknown action.' })
    }

    all[idx] = preserveSjFollowupDates(
      all[idx] as Record<string, unknown>,
      normalizeRegistration(row),
    )
    await saveRegistrations(all)
    void rememberCandidatesInCustody([all[idx]]).catch(() => {})
    return res.status(200).json({ ok: true, candidate: all[idx], waUrl })
  }

  if (action === 'candidatesCustodyExport' || action === 'candidatesCustodyEmail') {
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Only Management can download or email the full safe copy.' })
    }
    if (action === 'candidatesCustodyExport') {
      const file = await custodyExcelPayload()
      return res.status(200).json({ ok: true, ...file })
    }
    const result = await ensureCandidateCustody({ forceMail: true })
    if (!result.ok) return res.status(500).json({ error: result.error || 'Could not email the safe copy.' })
    return res.status(200).json({
      ok: true,
      count: result.synced,
      mailed: result.mailed,
      filename: result.filename,
    })
  }

  if (action === 'loadDrrDetail') {
    const reportDate = s(body.reportDate, 20) || misTodayIst()
    const rawCo = s(body.company, 20)
    const company = rawCo === 'sparks' ? 'sparks' : rawCo === 'all' ? 'all' : 'agile'
    const requestedBranch = s(body.detailBranchId, 80) || s(body.branchId, 80)
    const detailBranch = role === 'branch' ? branch || '' : requestedBranch
    if (!detailBranch) return res.status(400).json({ error: 'Branch required.' })
    const all = await getDrrDetails()
    const sameDay = all.filter(
      (p) => p.active !== false && p.branchId === detailBranch && p.reportDate === reportDate,
    )
    let pkg: DrrDetailPackage
    if (company === 'all') {
      const agile = sameDay.find((p) => p.company === 'agile')
      const sparks = sameDay.find((p) => p.company === 'sparks')
      pkg = normalizeDrrDetail({
        branchId: detailBranch,
        company: 'agile',
        reportDate,
        submittedBy: agile?.submittedBy || sparks?.submittedBy || recruitUser.name,
        submittedAt: agile?.submittedAt || sparks?.submittedAt || '',
        recruits: [...(agile?.recruits || []), ...(sparks?.recruits || [])],
        transfers: [...(agile?.transfers || []), ...(sparks?.transfers || [])],
        resignations: [...(agile?.resignations || []), ...(sparks?.resignations || [])],
        nilRecruitment: Boolean(agile?.nilRecruitment || sparks?.nilRecruitment),
        active: true,
      })
    } else {
      const hit = sameDay.find((p) => p.company === company)
      pkg = hit
        ? normalizeDrrDetail(hit)
        : normalizeDrrDetail({
            branchId: detailBranch,
            company,
            reportDate,
            submittedBy: recruitUser.name,
            recruits: [],
            transfers: [],
            resignations: [],
            active: true,
          })
    }
    const snap = await loadBranchManpower(detailBranch, reportDate)
    return res.status(200).json({
      ok: true,
      package: { ...pkg, company },
      vacant: {
        date: snap.date,
        vac: snap.vac,
        san: snap.san,
        dep: snap.dep,
        misSubmitted: snap.misSubmitted,
        posts: snap.vacantPosts,
        clients: snap.clients || [],
      },
      clients: snap.clients || [],
    })
  }

  if (action === 'saveDrrDetail') {
    const pkg = normalizeDrrDetail((body.package ?? body) as Partial<DrrDetailPackage>)
    const requestedBranch = s(body.detailBranchId, 80) || pkg.branchId
    const detailBranch = role === 'branch' ? branch || '' : requestedBranch
    if (!detailBranch || !pkg.reportDate) {
      return res.status(400).json({ error: 'Branch and report date required.' })
    }
    if (role === 'branch' && pkg.branchId && pkg.branchId !== detailBranch) {
      return res.status(403).json({ error: 'You can only save DRR for your branch.' })
    }
    if (s(pkg.company, 20) === 'all' || s(body.company, 20) === 'all') {
      return res.status(400).json({ error: 'Choose Agile or Sparks to save. All is for viewing both together.' })
    }
    pkg.branchId = detailBranch
    pkg.company = pkg.company === 'sparks' ? 'sparks' : 'agile'
    pkg.submittedBy = pkg.submittedBy || recruitUser.name
    pkg.submittedAt = new Date().toISOString()
    pkg.active = true
    const hasRows =
      (pkg.recruits?.length || 0) + (pkg.transfers?.length || 0) + (pkg.resignations?.length || 0) > 0
    pkg.nilRecruitment = !hasRows
    const missingLady = pkg.recruits.filter(ladyRecruitMissingUndertaking)
    if (missingLady.length) {
      return res.status(400).json({
        error:
          'Received Ladies Undertaking is compulsory for Female recruits. Missing for: ' +
          missingLady.map((r) => r.name || r.empId || 'unnamed').join(', '),
      })
    }
    const all = await getDrrDetails()
    const others = all.filter(
      (p) =>
        !(
          p.branchId === pkg.branchId &&
          p.reportDate === pkg.reportDate &&
          p.company === pkg.company
        ),
    )
    const saved = await saveDrrDetails([...others, pkg])
    if (!saved) return res.status(503).json({ error: 'Could not save detailed DRR.' })
    noteItSuiteChange(otpSession.email, 'Recruitment', 'recruitment', 'saveDrrDetail')
    /** After any DRR save, remind HODs of shortage branches that still have zero recruits. */
    let shortageReminders: Awaited<ReturnType<typeof autoSendShortageReminders>> | undefined
    try {
      shortageReminders = await autoSendShortageReminders({ centres: RECRUIT_BRANCHES })
    } catch {
      shortageReminders = undefined
    }
    return res.status(200).json({ ok: true, package: pkg, shortageReminders })
  }

  if (action === 'listDrrDetails') {
    const allBranches = body.allBranches === true || s(body.detailBranchId, 80) === 'ALL'
    const requestedBranch = s(body.detailBranchId, 80)
    const detailBranch = role === 'branch' ? branch || '' : requestedBranch
    if (!allBranches && !detailBranch) return res.status(400).json({ error: 'Branch required.' })
    const packages = (await getDrrDetails())
      .filter((p) => p.active !== false)
      .filter((p) => allBranches || p.branchId === detailBranch)
      .sort(
        (a, b) =>
          b.reportDate.localeCompare(a.reportDate) ||
          b.submittedAt.localeCompare(a.submittedAt),
      )
    return res.status(200).json({ ok: true, packages })
  }

  if (action === 'walkInPipeline') {
    const allBranches = body.allBranches === true || s(body.branchId, 80) === 'ALL'
    const recruitBranch =
      role === 'branch' ? (branch ?? '') : s(body.branchId, 80) || s(body.branch, 80)
    if (!allBranches && !recruitBranch) return res.status(400).json({ error: 'Branch required.' })
    const funnel = s(body.funnelChannel, 40).toLowerCase() || 'walkin'
    const todayYmd = misTodayIst()
    const candidates = (await getWalkIns())
      .filter((r) => r.active !== false)
      .filter((r) => walkInVisibleForRecruitScope(r, recruitBranch, allBranches))
      .filter((r) => {
        const ch = String(r.funnelChannel || 'walkin').toLowerCase()
        if (funnel === 'walkin') return ch === 'walkin' || !r.funnelChannel
        return ch === funnel
      })
      .map((r) => ({
        ...r,
        pipelineBucket: candidatePipelineBucket(r, todayYmd),
      }))
      .sort(
        (a, b) =>
          String(b.createdAt || '').localeCompare(String(a.createdAt || '')) ||
          String(b.id).localeCompare(String(a.id)),
      )
    const counts = { registered: 0, responded: 0, follow_up: 0, joined: 0, closed: 0 }
    for (const c of candidates) counts[c.pipelineBucket]++
    return res.status(200).json({
      ok: true,
      today: todayYmd,
      branchId: allBranches ? 'ALL' : recruitBranch,
      funnelChannel: funnel,
      counts,
      candidates,
    })
  }

  if (action === 'addWalkIn') {
    const name = s(body.name, 120)
    const phone = String(body.phone || '')
      .replace(/\D/g, '')
      .slice(-10)
    const branchId = s(body.branchId, 80) || (role === 'branch' ? branch || '' : '')
    const walkInFrom =
      s(body.walkInFrom, 80) || defaultWalkInSource(branch || s(body.branchId, 80) || '')
    if (!name) return res.status(400).json({ error: 'Name required.' })
    if (phone.length < 10) return res.status(400).json({ error: 'Valid 10-digit mobile required.' })
    if (!branchId) return res.status(400).json({ error: 'Branch required.' })
    const row = await addWalkIn({
      name,
      phone,
      branchId,
      walkInFrom,
      referredBy: s(body.referredBy, 120) || undefined,
      replyNotes: s(body.replyNotes, 500) || undefined,
      addedBy: recruitUser.name,
      funnelChannel: s(body.funnelChannel, 40) || 'walkin',
    })
    if (!row) return res.status(503).json({ error: 'Could not save walk-in.' })
    const mail = await sendWalkInBranchNotify(row, recruitUser.name)
    return res.status(200).json({
      ok: true,
      candidate: row,
      emailSent: mail.ok,
      emailError: mail.error,
    })
  }

  if (action === 'walkInCandidateAction') {
    const id = s(body.id, 80)
    const act = s(body.subAction, 40) || s(body.actionName, 40)
    if (!id || !act) return res.status(400).json({ error: 'Candidate and action required.' })
    const all = await getWalkIns()
    const idx = all.findIndex((r) => r.id === id && r.active !== false)
    if (idx < 0) return res.status(404).json({ error: 'Walk-in not found.' })
    const hit = all[idx]
    if (role === 'branch' && branch && !walkInVisibleForRecruitScope(hit, branch, false)) {
      return res.status(403).json({ error: 'You can only update walk-ins for your team.' })
    }
    const now = new Date().toISOString()
    const todayYmd = misTodayIst()
    const row = { ...hit }
    const touchCall = () => {
      if (!row.firstCalledAt) row.firstCalledAt = now
      if (!row.calledAt) row.calledAt = todayYmd
    }
    if (act === 'log_call' || act === 'contacted') {
      row.calledAt = s(body.calledAt, 20) || todayYmd
      touchCall()
      if (row.status === 'new') row.status = 'contacted'
    } else if (act === 'set_tentative_doj' || act === 'record_reply') {
      const tentativeJoinDate = s(body.tentativeJoinDate, 20)
      if (!tentativeJoinDate) {
        return res.status(400).json({ error: 'Tentative date of joining required.' })
      }
      row.tentativeJoinDate = tentativeJoinDate
      row.replyAt = now
      row.replyNotes = s(body.replyNotes, 500) || s(body.followUpNotes, 500) || row.replyNotes
      touchCall()
      if (row.status === 'new' || row.status === 'contacted' || row.status === 'auto_reply') {
        row.status = 'replied'
      }
    } else if (act === 'follow_up') {
      const notes = s(body.replyNotes, 500) || s(body.followUpNotes, 500)
      if (notes) row.replyNotes = notes
      const tentativeJoinDate = s(body.tentativeJoinDate, 20)
      if (tentativeJoinDate) row.tentativeJoinDate = tentativeJoinDate
      touchCall()
      row.calledAt = s(body.calledAt, 20) || todayYmd
      if (row.status === 'new') row.status = 'contacted'
    } else if (act === 'mark_joined') {
      row.status = 'joined'
      row.joinedAt = s(body.joinedAt, 20) || todayYmd
      touchCall()
    } else if (act === 'rejected' || act === 'not_willing') {
      row.status = act === 'not_willing' ? 'not_willing' : 'rejected'
      const rejDay = s(body.rejectedAt, 20) || todayYmd
      row.rejectedAt = rejDay
      if (act === 'not_willing') row.notWillingAt = rejDay
    } else {
      return res.status(400).json({ error: 'Unknown action.' })
    }
    all[idx] = normalizeWalkIn(row)
    const ok = await saveWalkIns(all)
    if (!ok) return res.status(503).json({ error: 'Could not save walk-in update.' })
    return res.status(200).json({ ok: true, candidate: all[idx] })
  }

  if (action === 'referralList') {
    const allBranches = body.allBranches === true || s(body.branchId, 80) === 'ALL'
    const recruitBranch =
      role === 'branch' ? (branch ?? '') : s(body.branchId, 80) || s(body.branch, 80)
    if (!allBranches && !recruitBranch) return res.status(400).json({ error: 'Branch required.' })
    const company = s(body.company, 20).toLowerCase() || 'all'
    const month = monthReferralRange(misTodayIst())
    const from = s(body.from, 20).slice(0, 10) || month.from
    const to = s(body.to, 20).slice(0, 10) || month.to
    const inRange = (ymd: string) => {
      const d = String(ymd || '').slice(0, 10)
      if (!d) return !from && !to
      if (from && d < from) return false
      if (to && d > to) return false
      return true
    }
    const [allDetails, walkIns, joinbacks, followups] = await Promise.all([
      getDrrDetails(),
      company === 'all' ? getWalkIns() : Promise.resolve([]),
      getJoinBacks(),
      getDeployFollowups(),
    ])
    const index = buildKnownGuardIndex(allDetails, joinbacks, followups)
    const drrRows: ReferralListRow[] = allDetails
      .filter((p) => p.active !== false)
      .filter((p) => allBranches || p.branchId === recruitBranch)
      .filter((p) => company === 'all' || p.company === company)
      .filter((p) => inRange(p.reportDate))
      .flatMap((p) =>
        (p.recruits || [])
          .filter((r) => String(r.referredBy || '').trim())
          .filter((r) => !isRejoinOrOldGuardRow(r, p, index))
          .map((r) => ({
            id: r.id,
            name: r.name,
            phone: r.mobile,
            mobile: r.mobile,
            empId: r.empId || '',
            branchId: p.branchId,
            company: p.company === 'sparks' ? 'Sparks' : 'Agile',
            client: r.unit || '',
            location: r.location || '',
            vacantPosition: r.vacantPosition || '',
            designation: r.designation || '',
            walkInFrom: '',
            referredBy: String(r.referredBy || '').trim(),
            regCode: r.empId || '',
            createdAt: r.doj || p.reportDate,
            reportDate: p.reportDate,
            status: 'new recruit',
            source: 'Daily Recruitment Report',
            remarks: r.remarks || '',
            kind: 'new',
          })),
      )
    const walkRows: ReferralListRow[] =
      company === 'all'
        ? walkIns
            .filter((r) => r.active !== false)
            .filter((r) => String(r.referredBy || '').trim())
            .filter((r) => walkInVisibleForRecruitScope(r, recruitBranch, allBranches))
            .filter((r) => inRange(String(r.createdAt || '').slice(0, 10)))
            .filter((r) => !looksLikeRejoinOrOldGuard('', r.replyNotes, r.name, r.referredBy))
            .filter((r) => !isRejoinOrOldGuardRow({
              kind: 'new',
              remarks: String(r.replyNotes || ''),
              referredBy: String(r.referredBy || ''),
              name: r.name,
              mobile: r.phone,
              empId: r.regCode || '',
              id: r.id,
            }, { reportDate: String(r.createdAt || '').slice(0, 10), branchId: r.branchId }, index))
            .map((r) => ({
              id: r.id,
              name: r.name,
              phone: r.phone,
              mobile: r.phone,
              empId: r.regCode || '',
              branchId: r.branchId,
              company: '',
              client: '',
              location: r.walkInFrom || '',
              vacantPosition: '',
              designation: '',
              walkInFrom: r.walkInFrom || '',
              referredBy: String(r.referredBy || '').trim(),
              regCode: r.regCode || '',
              createdAt: r.createdAt,
              reportDate: String(r.createdAt || '').slice(0, 10),
              status: r.status,
              source: 'Walk-in Pipeline',
            }))
        : []
    const rows = dedupeReferralRows([...drrRows, ...walkRows])
    const leaders = referralLeaderTotals(rows)
    return res.status(200).json({
      ok: true,
      branchId: allBranches ? 'ALL' : recruitBranch,
      company,
      rows,
      leaders,
      from,
      to,
    })
  }

  if (action === 'branchVacantRankWise') {
    const ymd = misTodayIst()
    const shortage = await loadRecruitmentShortage({
      recruitBranch: role === 'branch' ? branch : null,
      centres: RECRUIT_BRANCHES,
      saveClosing: false,
    })
    const snaps = await Promise.all(
      (shortage.byBranch || []).map(async (b) => {
        const snap = await loadBranchManpower(b.branch, ymd)
        return {
          branch: b.branch,
          vac: snap.vac,
          ot: snap.ot,
          shortage: snap.vac + snap.ot,
          san: snap.san,
          dep: snap.dep,
        }
      }),
    )
    const rows = snaps
      .sort((a, b) => b.vac - a.vac || b.shortage - a.shortage)
      .map((r, i) => ({ ...r, rank: i + 1 }))
    return res.status(200).json({ ok: true, date: ymd, rows })
  }

  if (action === 'irregularAttendance') {
    const month = s(body.month, 10) || misTodayIst().slice(0, 7)
    const minDuties = Math.max(1, Math.floor(Number(body.minDuties) || 13))
    const scope = role === 'branch' ? branch || '' : s(body.branchId, 80) || 'ALL'
    if (body.syncFirst === true) {
      const cfg = work360Config()
      if (cfg) {
        const from = `${month}-01`
        const to = misTodayIst().startsWith(month) ? misTodayIst() : `${month}-28`
        try {
          await syncWork360AttendanceRange(from, to)
        } catch {
          /* continue with saved marks */
        }
      }
    }
    const dates = (await getAttendanceDates()).filter((d) => d.startsWith(month))
    const duty = new Map<
      string,
      { guardName: string; employeeId: string; unit: string; mobile: string; branch: string; duties: number }
    >()
    const guessBranch = (client: string, unit: string) => {
      const hay = `${client} ${unit}`.toLowerCase()
      for (const c of RECRUIT_BRANCHES) {
        if (hay.includes(String(c).toLowerCase())) return c
      }
      return scope && scope !== 'ALL' ? scope : 'Unassigned'
    }
    for (const d of dates) {
      const marks = await getAttendanceMarks(d)
      for (const m of marks) {
        if (m.status !== 'present' && m.status !== 'late') continue
        const key = `${m.employeeId || m.guardName}|${m.unit || ''}`.toLowerCase()
        const cur = duty.get(key) || {
          guardName: m.guardName,
          employeeId: m.employeeId,
          unit: m.unit || m.client || '',
          mobile: m.mobile || '',
          branch: guessBranch(m.client || '', m.unit || ''),
          duties: 0,
        }
        cur.duties += 1
        duty.set(key, cur)
      }
    }
    let rows = [...duty.values()].filter((r) => r.duties < minDuties)
    if (scope && scope !== 'ALL') {
      const needle = scope.toLowerCase()
      rows = rows.filter(
        (r) =>
          r.branch.toLowerCase() === needle ||
          r.unit.toLowerCase().includes(needle) ||
          r.branch === scope,
      )
    }
    rows.sort((a, b) => a.branch.localeCompare(b.branch) || a.duties - b.duties || a.guardName.localeCompare(b.guardName))
    return res.status(200).json({ ok: true, month, minDuties, rows: rows.slice(0, 2000) })
  }

  if (action === 'previewDrrThankYouWa' || action === 'sendDrrThankYouWa') {
    const branchId = role === 'branch' ? branch || '' : s(body.branchId, 80)
    const reportDate = s(body.reportDate, 20) || misTodayIst()
    if (!branchId) return res.status(400).json({ error: 'Branch required.' })
    const details = await getDrrDetails()
    const pkgs = details.filter(
      (p) => p.active !== false && p.branchId === branchId && p.reportDate === reportDate,
    )
    const recruits = pkgs.flatMap((p) => p.recruits || [])
    const text = [
      `Agile Recruitment — Thank you`,
      ``,
      `Dear ${branchId} Team,`,
      `Thank you — Daily Recruitment Report (DRR) for ${reportDate} is received.`,
      `New / rejoin: ${recruits.length}`,
      `Please continue walk-ins and update vacant posts.`,
      `Portal: https://www.agilegroup-digital.co.in/recruitment?portal=staff`,
      ``,
      `Agile Recruitment`,
    ].join('\n')
    const hodMobile = ''
    const waUrl = waUrlForText(hodMobile, text)
    if (action === 'sendDrrThankYouWa') {
      noteItSuiteChange(otpSession.email, 'Recruitment', 'recruitment', 'sendDrrThankYouWa')
    }
    return res.status(200).json({ ok: true, text, waUrl, toHint: branchEmail(branchId) })
  }

  if (action === 'listDeployFollowups') {
    const kind = s(body.kind, 20) === 'rejoin' ? 'rejoin' : 'new'
    const scope = role === 'branch' ? branch || '' : s(body.branchId, 80) || 'ALL'
    const all = await getDeployFollowups()
    const rows = all
      .filter((r) => r.active !== false && r.kind === kind)
      .filter((r) => !scope || scope === 'ALL' || r.branch === scope)
      .sort((a, b) => String(b.recruitDate).localeCompare(String(a.recruitDate)) || a.name.localeCompare(b.name))
    return res.status(200).json({ ok: true, rows })
  }

  if (action === 'syncDeployFollowups') {
    const kind = s(body.kind, 20) === 'rejoin' ? 'rejoin' : 'new'
    const result = await syncDeployFollowupsFromDrr(kind)
    noteItSuiteChange(otpSession.email, 'Recruitment', 'recruitment', 'syncDeployFollowups')
    return res.status(200).json({ ok: true, ...result })
  }

  if (action === 'saveDeployFollowup') {
    const id = s(body.id, 40)
    const field = s(body.field, 40)
    const value = s(body.value, 200)
    if (!id || !field) return res.status(400).json({ error: 'id and field required.' })
    const all = await getDeployFollowups()
    const idx = all.findIndex((r) => r.id === id)
    if (idx < 0) return res.status(404).json({ error: 'Row not found.' })
    if (role === 'branch' && all[idx].branch !== branch) {
      return res.status(403).json({ error: 'Not your branch.' })
    }
    const allowed = new Set([
      'unit',
      'location',
      'omContact',
      'mapsUrl',
      'call1Status',
      'call2Status',
      'call3Status',
      'call4Status',
      'call5Status',
      'call6Status',
      'finalRemark',
    ])
    if (!allowed.has(field)) return res.status(400).json({ error: 'Field not allowed.' })
    if (field === 'finalRemark' && role !== 'admin' && body.reopen === true) {
      return res.status(403).json({ error: 'Only Management can reopen.' })
    }
    const row = { ...all[idx], updatedAt: new Date().toISOString() } as DeployFollowup
    if (field === 'finalRemark') {
      row.finalRemark = value === 'Settled' ? 'Settled' : 'Not settled'
    } else if (field === 'unit') row.unit = value
    else if (field === 'location') row.location = value
    else if (field === 'omContact') row.omContact = value
    else if (field === 'mapsUrl') row.mapsUrl = value
    else if (field === 'call1Status') row.call1Status = value
    else if (field === 'call2Status') row.call2Status = value
    else if (field === 'call3Status') row.call3Status = value
    else if (field === 'call4Status') row.call4Status = value
    else if (field === 'call5Status') row.call5Status = value
    else if (field === 'call6Status') row.call6Status = value
    if (body.reopen === true && role === 'admin') {
      row.finalRemark = 'Not settled'
      row.call1Status = ''
      row.call2Status = ''
      row.call3Status = ''
    }
    all[idx] = row
    await saveDeployFollowups(all)
    return res.status(200).json({ ok: true, row })
  }

  if (action === 'previewDeploymentOrder' || action === 'sendDeploymentOrderWa') {
    const id = s(body.id, 40)
    const all = await getDeployFollowups()
    const row = all.find((r) => r.id === id)
    if (!row) return res.status(404).json({ error: 'Row not found.' })
    if (role === 'branch' && row.branch !== branch) return res.status(403).json({ error: 'Not your branch.' })
    const text = buildDeploymentOrderText(row)
    const html = buildDeploymentOrderHtml(row)
    const waUrl = waUrlForText(row.mobile, text)
    return res.status(200).json({ ok: true, text, html, waUrl })
  }

  if (action === 'listBranchWages') {
    const scope = role === 'branch' ? branch || '' : s(body.branchId, 80) || 'ALL'
    const rows = (await getBranchWages())
      .filter((r) => !scope || scope === 'ALL' || r.branchId === scope)
      .sort(
        (a, b) =>
          a.branchId.localeCompare(b.branchId) ||
          a.category.localeCompare(b.category) ||
          a.city.localeCompare(b.city) ||
          a.designation.localeCompare(b.designation),
      )
    return res.status(200).json({ ok: true, rows })
  }

  if (action === 'saveBranchWage') {
    if (role !== 'branch' || !branch) {
      return res.status(403).json({ error: 'Only branch HOD / Staff can upload wages.' })
    }
    const city = s(body.city, 80)
    const designation = s(body.designation, 80) || 'SECURITY GUARD'
    const wageAmount = Math.max(0, Math.floor(Number(body.wageAmount) || 0))
    if (!city) return res.status(400).json({ error: 'City required.' })
    if (!wageAmount) return res.status(400).json({ error: 'Wage amount required.' })
    const row = normalizeWageRow({
      branchId: branch,
      city,
      area: s(body.area, 80),
      category: s(body.category, 20) === 'central' ? 'central' : 'state',
      designation,
      wageAmount,
      effectiveFrom: s(body.effectiveFrom, 20).slice(0, 10) || misTodayIst(),
      remarks: s(body.remarks, 500),
      uploadedBy: recruitUser.name,
      uploadedAt: new Date().toISOString(),
      active: true,
    })
    const all = await getBranchWages()
    all.push(row)
    const ok = await saveBranchWages(all)
    if (!ok) return res.status(503).json({ error: 'Could not save wage row.' })
    noteItSuiteChange(otpSession.email, 'Recruitment', 'recruitment', 'saveBranchWage')
    return res.status(200).json({ ok: true, row })
  }

  if (action === 'previewRecruitFormat' || action === 'sendRecruitFormat') {
    const kind = s(body.kind, 20).toLowerCase() || 'thankyou'
    const branchId = role === 'branch' ? branch || '' : s(body.branchId, 80)
    if (!branchId) return res.status(400).json({ error: 'Branch required.' })

    if (kind === 'shortage') {
      const packed = await loadRecruitmentShortage({
        recruitBranch: null,
        centres: RECRUIT_BRANCHES,
        saveClosing: false,
      })
      const row = (packed.byBranch || []).find((b) => b.branch === branchId)
      const mail = buildShortageReminderEmail({
        branch: branchId,
        date: misTodayIst(),
        openingShortage: row?.openingShortage ?? packed.openingShortage,
        openingVac: row?.openingVac ?? packed.openingVac,
        openingOt: row?.openingOt ?? packed.openingOt,
        vac: row?.vac ?? packed.vac,
        ot: row?.ot ?? packed.ot,
        shortage: row?.shortage ?? packed.shortage,
        recruitsSinceBaseline: row?.recruitsSinceBaseline ?? packed.recruitsSinceBaseline,
      })
      if (action === 'sendRecruitFormat') {
        const sent = await sendShortageReminderForBranch(branchId, { force: true })
        noteItSuiteChange(otpSession.email, 'Recruitment', 'recruitment', 'sendRecruitFormat:shortage')
        return res.status(200).json({
          ok: sent.ok,
          emailSent: sent.ok && !sent.skipped,
          subject: mail.subject,
          html: mail.html,
          text: mail.subject,
          to: sent.to,
          error: sent.error,
        })
      }
      return res.status(200).json({ ok: true, subject: mail.subject, html: mail.html, text: mail.subject })
    }

    const name = s(body.name, 120) || 'Guard'
    const empId = s(body.empId, 40) || '—'
    const unit = s(body.unit, 120)
    const omMobile = s(body.omMobile, 20)
    const hodMobile = s(body.hodMobile, 20)
    const toMobile = s(body.toMobile, 20)
    const text =
      kind === 'deploy'
        ? buildDeployOrderFormatText({
            name,
            empId,
            branch: branchId,
            unit,
            location: unit,
            omMobile,
            hodMobile,
          })
        : buildRecruitThankYouText({
            name,
            empId,
            branch: branchId,
            unit,
            omMobile,
            hodMobile,
          })
    const subject =
      kind === 'deploy' ? `Deployment Order — ${name} (${empId})` : `Thank you for joining — ${name} (${empId})`
    const wa = recruitWaUrl(toMobile, text)
    if (action === 'sendRecruitFormat') {
      noteItSuiteChange(otpSession.email, 'Recruitment', 'recruitment', `sendRecruitFormat:${kind}`)
    }
    return res.status(200).json({ ok: true, subject, text, waUrl: wa, html: '' })
  }

  if (action === 'referralIncentives' || action === 'previewReferralIncentiveMail' || action === 'sendReferralIncentiveMail') {
    const allBranches = role !== 'branch' && (s(body.branchId, 80) === 'ALL' || !s(body.branchId, 80))
    const recruitBranch = role === 'branch' ? branch || '' : s(body.branchId, 80) || 'ALL'
    const from = s(body.from, 20).slice(0, 10)
    const to = s(body.to, 20).slice(0, 10) || misTodayIst()
    const inRange = (ymd: string) => {
      const d = String(ymd || '').slice(0, 10)
      if (!d) return !from
      if (from && d < from) return false
      if (to && d > to) return false
      return true
    }
    const flags = await getReferralIncentiveFlags()
    const rows = (await getDrrDetails())
      .filter((p) => p.active !== false)
      .filter((p) => allBranches || p.branchId === recruitBranch)
      .flatMap((p) =>
        (p.recruits || [])
          .filter((r) => String(r.referredBy || '').trim())
          .filter((r) => inRange(r.doj || p.reportDate))
          .map((r) => {
            const id = `ri:${p.branchId}:${r.empId || r.id}:${r.doj || p.reportDate}`
            const flag = flags[id]
            return {
              id,
              referredBy: String(r.referredBy || '').trim(),
              name: r.name,
              empId: r.empId || '',
              rank: r.designation || r.vacantPosition || '',
              client: r.unit || '',
              location: r.location || '',
              doj: r.doj || p.reportDate,
              branchId: p.branchId,
              continuing: flag?.continuing === 'no' ? 'no' : 'yes',
            }
          }),
      )
      .sort(
        (a, b) =>
          a.referredBy.localeCompare(b.referredBy) ||
          a.name.localeCompare(b.name) ||
          a.doj.localeCompare(b.doj),
      )

    if (action === 'referralIncentives') {
      return res.status(200).json({ ok: true, rows })
    }

    const tableRows = rows
      .map(
        (r, i) =>
          `<tr><td>${i + 1}</td><td>${escHtml(r.referredBy)}</td><td>${escHtml(r.name)}</td><td>${escHtml(r.empId)}</td><td>${escHtml(r.rank)}</td><td>${escHtml(r.client)} / ${escHtml(r.location)}</td><td>${escHtml(r.doj)}</td><td>${r.continuing === 'no' ? 'No' : 'Yes'}</td></tr>`,
      )
      .join('')
    const subject = `Referral Incentives — ${allBranches || recruitBranch === 'ALL' ? 'All Branch' : recruitBranch} (${from || '…'} to ${to})`
    const inner = `
      <p style="margin:0 0 12px;color:#334155">Staff / Referred-by person wise list. Verify the guard is still working.</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px" border="1" cellpadding="6">
        <thead><tr style="background:#1e3a8a;color:#fff">
          <th>Sl.</th>
          <th>Referred by</th>
          <th>Guard</th>
          <th>ID</th>
          <th>Rank</th>
          <th>Client / Location</th>
          <th>DOJ</th>
          <th>Continuing</th>
        </tr></thead>
        <tbody>${tableRows || '<tr><td colspan="8">No referral rows in range.</td></tr>'}</tbody>
      </table>`
    const html = recruitEmailShell('Referral Incentives', subject, inner)

    if (action === 'previewReferralIncentiveMail') {
      return res.status(200).json({ ok: true, subject, html, rows })
    }

    const apiKey = process.env.RESEND_API_KEY?.trim()
    if (!apiKey) return res.status(503).json({ error: 'Email not configured.' })
    const director =
      process.env.DIRECTOR_EMAIL?.trim() ||
      process.env.SUITE_DIRECTOR_EMAIL?.trim() ||
      'selwyn@agilegroup.co.in'
    const resend = new Resend(apiKey)
    const mailFrom = process.env.EMAIL_FROM ?? 'Agile Recruitment <noreply@agilegroup.co.in>'
    const mail = await sendSuiteEmail(resend, {
      from: mailFrom,
      to: [director],
      subject,
      html,
    })
    if (mail.error) return res.status(502).json({ error: mail.error.message ?? 'Send failed' })
    noteItSuiteChange(otpSession.email, 'Recruitment', 'recruitment', 'sendReferralIncentiveMail')
    return res.status(200).json({ ok: true, to: director, subject })
  }

  if (action === 'saveReferralIncentiveFlag') {
    const id = s(body.id, 120)
    const continuing = s(body.continuing, 10).toLowerCase() === 'no' ? 'no' : 'yes'
    if (!id) return res.status(400).json({ error: 'Row id required.' })
    const ok = await saveReferralIncentiveFlag(id, continuing, recruitUser.name)
    if (!ok) return res.status(503).json({ error: 'Could not save flag.' })
    return res.status(200).json({ ok: true })
  }

  return res.status(400).json({ error: 'Unknown action.' })
}

function escHtml(v: unknown): string {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

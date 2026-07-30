import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { isSuperAdminEmail } from '../_lib/auth.js'
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
import { buildDrrThankYouEmail, loadBranchManpower, sendDrrThankYouEmail } from '../_lib/recruitment/drr-mail.js'
import { loadAbsconders } from '../_lib/recruitment/absconder.js'
import { syncWork360AttendanceRange } from '../_lib/recruitment/work360-attendance.js'
import { work360Config } from '../_lib/mis/work360-client.js'

function branchFromMis(misBranchId: string, misBranches: { id: string; name: string }[]): string | null {
  const hit = misBranches.find((b) => b.id === misBranchId || b.name === misBranchId)
  const name = hit?.name || misBranchId
  if (RECRUIT_BRANCHES.includes(name as (typeof RECRUIT_BRANCHES)[number])) return name
  if (/hyderabad|hi-tech/i.test(name)) return 'Hyderabad'
  if (/visakhapatnam|vizag/i.test(name)) return 'Visakhapatnam'
  if (/nellore/i.test(name)) return 'Nellore'
  if (/bangalore|gulbarga|karnataka/i.test(name)) return name.includes('Gulbarga') ? 'Gulbarga' : 'Bangalore'
  if (/mumbai|maharashtra/i.test(name)) return 'Mumbai'
  if (/chennai|tamil/i.test(name)) return 'Chennai'
  if (/vijayawada/i.test(name)) return 'Vijayawada'
  if (/kakinada/i.test(name)) return 'Kakinada'
  if (/corporate/i.test(name)) return 'Corporate Office'
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
): Promise<{ role: 'admin' | 'branch'; branch: string | null; name: string; email: string } | null> {
  const em = email.trim().toLowerCase()
  if (!em.includes('@')) return null
  if (isSuperAdminEmail(email)) return { role: 'admin', branch: null, name: 'Director', email }

  if (sessionRole === 'management') {
    const admin = users.find((u) => u.active && u.role === 'admin' && u.email.trim().toLowerCase() === em)
    if (admin) return { role: 'admin', branch: null, name: admin.name || email, email }
    return null
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
  const recruitUser = await resolveRecruitUser(otpSession.email, otpSession.role, users, misUsers, branches)
  if (!recruitUser) {
    if (otpSession.role === 'staff') {
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
          ? 'Management access only for Director or Recruitment administrators.'
          : 'Branch access only for registered HODs / recruiters.',
    })
  }

  const branchIdFromBody = String(body.branchId ?? '').trim()
  const branch = effectiveBranch(recruitUser, branchIdFromBody)
  if (recruitUser.role === 'branch' && branchIdFromBody && !branch) {
    return res.status(403).json({ error: 'You can only access your own branch (' + recruitUser.branch + ').' })
  }
  const role = recruitUser.role

  if (action === 'login' || action === 'load') {
    const [drr, guards, requisitions, joinbacks, vendors, config] = await Promise.all([
      getDrr(),
      getGuards(),
      getRequisitions(),
      getJoinBacks(),
      getVendors(),
      getConfig(),
    ])
    const payload: Record<string, unknown> = {
      ok: true,
      role,
      branch,
      name: recruitUser.name,
      email: recruitUser.email,
      lockedBranch: role === 'branch' ? branch : null,
      drr: drr.map((r) => normalizeDrr(r)),
      guards: guards.map((g) => normalizeGuard(g)),
      requisitions: requisitions.map((r) => normalizeRequisition(r)),
      joinbacks: joinbacks.map((j) => normalizeJoinBack(j)),
      vendors,
      config,
    }
    if (role === 'admin') payload.users = users
    const recruitBranches = [
      ...new Set(
        branches
          .map((b) => branchFromMis(b.id, branches))
          .filter((x): x is string => Boolean(x)),
      ),
    ]
    if (recruitBranches.length) payload.recruitBranches = recruitBranches
    return res.status(200).json(payload)
  }

  if (!recruitStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })

  if (action === 'saveDrr') {
    const arr = Array.isArray(body.drr) ? body.drr : []
    const prev = await getDrr()
    const list: DailyRecruitmentReport[] = arr.slice(0, 5000).map((r: Record<string, unknown>) =>
      normalizeDrr({
        id: String(r.id || recruitNid('dr')),
        reportCode: s(r.reportCode, 40),
        branchId: role === 'branch' ? (branch ?? '') : s(r.branchId, 80),
        reportDate: s(r.reportDate, 20),
        submittedBy: s(r.submittedBy, 120),
        submittedAt: s(r.submittedAt, 40) || new Date().toISOString(),
        walkIns: r.walkIns,
        screened: r.screened,
        docsComplete: r.docsComplete,
        selected: r.selected,
        deployed: r.deployed,
        campsHeld: r.campsHeld,
        whatsappLeads: r.whatsappLeads,
        securityjobLeads: r.securityjobLeads,
        referralLeads: r.referralLeads,
        fieldAgentLeads: r.fieldAgentLeads,
        mediaLeads: r.mediaLeads,
        subAgencyLeads: r.subAgencyLeads,
        newsBulletinLeads: r.newsBulletinLeads,
        notes: s(r.notes, 2000),
        bottlenecks: s(r.bottlenecks, 2000),
        active: r.active !== false,
      }),
    )
    const final = list
    await saveDrr(final)

    let emailSent = false
    if (role === 'branch' && branch) {
      const added = list.filter((r) => r.branchId === branch && !prev.some((p) => p.id === r.id))
      if (added.length >= 1) {
        const config = await getConfig()
        const mail = await sendDrrThankYouEmail(added[added.length - 1], config)
        emailSent = mail.ok
      }
    }

    return res.status(200).json({ ok: true, count: final.length, thankYouEmail: emailSent })
  }

  if (action === 'previewDrrEmail') {
    const branchId = role === 'branch' ? (branch ?? '') : s(body.branchId, 80)
    const reportDate = s(body.reportDate, 20) || new Date().toISOString().slice(0, 10)
    if (!branchId) return res.status(400).json({ error: 'Branch required.' })
    const [drr, config] = await Promise.all([getDrr(), getConfig()])
    const report = drr.find((r) => r.active && r.branchId === branchId && r.reportDate === reportDate)
    if (!report) {
      return res.status(404).json({ error: `No DRR found for ${branchId} on ${reportDate}. Submit a report first.` })
    }
    const snap = await loadBranchManpower(branchId)
    const { subject, html } = buildDrrThankYouEmail(normalizeDrr(report), config, snap)
    return res.status(200).json({ ok: true, subject, html })
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
      sync = await syncWork360AttendanceRange(asOf, 14)
    }
    let guards = await loadAbsconders(asOf, minDays)
    if (role === 'branch' && branch) {
      const b = branch.toLowerCase()
      guards = guards.filter(
        (g) =>
          g.branchHint.toLowerCase().includes(b) ||
          b.includes(g.branchHint.toLowerCase()) ||
          g.unit.toLowerCase().includes(b) ||
          (g.source === 'joinback' && (g.branchHint || '').toLowerCase().includes(b)),
      )
    }
    const fromJoinback = guards.filter((g) => g.source === 'joinback').length
    return res.status(200).json({
      ok: true,
      asOf,
      minDays,
      count: guards.length,
      guards,
      fromJoinback,
      work360Configured: !!work360Config(),
      sync,
      hint: !guards.length
        ? sync?.error ||
          (work360Config()
            ? 'No 7+ day absconders yet. Log absent guards under Recruitment → Roster & Join-Backs (left date 7+ days ago).'
            : 'Add Work360 settings on server, or log absent guards under Roster & Join-Backs.')
        : sync?.saved
          ? undefined
          : fromJoinback
            ? `${fromJoinback} from Join-Back log (mobile attendance export had no rows).`
            : undefined,
    })
  }

  return res.status(400).json({ error: 'Unknown action.' })
}

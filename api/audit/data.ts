/**
 * Agile HR Audit — data API (Staff + Management), branch-wise.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { isSuiteAdminEmail, normaliseEmail } from '../_lib/auth.js'
import { collectHraAlerts } from '../_lib/audit/alerts.js'
import {
  getHraAudits,
  getHraIssues,
  getHraProfiles,
  hraNid,
  hraStorageOk,
  upsertHraAudit,
  upsertHraIssue,
  upsertHraProfile,
} from '../_lib/audit/store.js'
import type {
  HraAudit,
  HraAuditStatus,
  HraCadence,
  HraCheckPoint,
  HraClientProfile,
  HraDocItem,
  HraIssue,
  HraIssueSeverity,
  HraIssueStatus,
} from '../_lib/audit/types.js'
import {
  HRA_SAMPLE_FORMATS,
  defaultChecklist,
  defaultDocuments,
  nextDueAfterAudit,
  nextMonthlySlaDate,
} from '../_lib/audit/types.js'
import { businessTierForName, businessTierLabel, resolveBusinessTiers } from '../_lib/mis/client-rules.js'
import { getBranches, getClients } from '../_lib/mis/store.js'
import { resolveSuiteUserName } from '../_lib/suite-mail.js'

function isStrategicStars(starRating: number): boolean {
  return starRating >= 5
}

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  return res.status(status).json(body)
}
function s(v: unknown, n = 200) {
  return String(v ?? '').trim().slice(0, n)
}
function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function parseDocs(raw: unknown): HraDocItem[] {
  if (!Array.isArray(raw)) return defaultDocuments()
  return raw.map((d) => {
    const x = (d || {}) as Record<string, unknown>
    return {
      kind: (s(x.kind, 40) as HraDocItem['kind']) || 'Other',
      label: s(x.label, 160) || s(x.kind, 40),
      status: (s(x.status, 20) as HraDocItem['status']) || 'Pending',
      fileUrl: s(x.fileUrl, 500),
      periodLabel: s(x.periodLabel, 80),
      remarks: s(x.remarks, 1000),
    }
  })
}

function parseChecklist(raw: unknown): HraCheckPoint[] {
  if (!Array.isArray(raw)) return defaultChecklist()
  return raw.map((p, i) => {
    const x = (p || {}) as Record<string, unknown>
    return {
      id: s(x.id, 40) || `cp${i + 1}`,
      title: s(x.title, 300),
      required: x.required !== false,
      status: (s(x.status, 20) as HraCheckPoint['status']) || 'Pending',
      remarks: s(x.remarks, 1000),
    }
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = s(body.action, 60)

  if (action === 'status') return json(res, 200, { ok: true, storage: hraStorageOk() })

  const session = await verifyAppSession(String(body.sessionToken ?? ''), 'audit')
  if (!session) return json(res, 401, { error: 'Please sign in with your work email / branch login.' })

  const email = normaliseEmail(session.email)
  const name = await resolveSuiteUserName(email)
  const portal = String(body.portal || session.role || 'staff') === 'management' ? 'management' : 'staff'
  const isMgmt = portal === 'management' || isSuiteAdminEmail(email)
  const branchId = isMgmt ? s(body.branchId, 40) : session.branchId || s(body.branchId, 40)

  const filterBranch = <T extends { branchId?: string }>(rows: T[]) => {
    if (isMgmt && !branchId) return rows
    const bid = branchId || session.branchId || ''
    if (!bid) return rows
    return rows.filter((r) => !r.branchId || r.branchId === bid)
  }

  if (action === 'bootstrap') {
    const branches = await getBranches(true)
    const allClients = await getClients(undefined, { skipRepair: true, branches })
    const clientsRaw = branchId
      ? allClients.filter((c) => c.branchId === branchId)
      : isMgmt
        ? allClients
        : allClients.filter((c) => c.branchId === (session.branchId || ''))
    const branchNameById = Object.fromEntries(branches.map((b) => [b.id, b.name]))
    const tierByGroup = resolveBusinessTiers(allClients, branches)
    const scopedClients = (Array.isArray(clientsRaw) ? clientsRaw : [])
      .filter((c) => c.active !== false)
      .map((c) => {
        const stars = Number(c.starRating) || 0
        const tierId = businessTierForName(c.name, tierByGroup)
        return {
          id: c.id,
          name: c.name,
          branchId: c.branchId,
          branchName: branchNameById[c.branchId] || '',
          starRating: stars,
          isStrategic: isStrategicStars(stars) || tierId === 'apex',
          businessTier: tierId,
          tier: businessTierLabel(tierId),
        }
      })
    return json(res, 200, {
      ok: true,
      email,
      name,
      portal,
      isMgmt,
      branchId: session.branchId || '',
      storage: hraStorageOk(),
      branches: branches.map((b) => ({ id: b.id, name: b.name })),
      clients: scopedClients.slice(0, 2000),
      strategicClients: scopedClients.filter((c) => c.isStrategic || c.businessTier === 'apex').slice(0, 1000),
      defaultChecklist: defaultChecklist(),
      defaultDocuments: defaultDocuments(),
      sampleFormats: HRA_SAMPLE_FORMATS,
    })
  }

  if (action === 'dashboard') {
    const [profiles, audits, issues, alerts] = await Promise.all([
      getHraProfiles(),
      getHraAudits(),
      getHraIssues(),
      collectHraAlerts(),
    ])
    const P = filterBranch(profiles).filter((p) => p.active)
    const A = filterBranch(audits)
    const I = filterBranch(issues)
    const today = new Date().toISOString().slice(0, 10)
    const scopedAlerts = alerts.filter((a) => {
      if (isMgmt && !branchId) return true
      const bid = branchId || session.branchId || ''
      if (!bid) return true
      return (
        P.some((p) => p.id === a.refId || p.branchName === a.branchName) ||
        A.some((x) => x.id === a.refId || x.branchName === a.branchName) ||
        I.some((x) => x.id === a.refId || x.branchName === a.branchName)
      )
    })
    return json(res, 200, {
      ok: true,
      kpis: {
        profiles: P.length,
        monthly: P.filter((p) => p.cadence === 'Monthly').length,
        quarterly: P.filter((p) => p.cadence === 'Quarterly').length,
        plannedAudits: A.filter((a) => a.status === 'Planned' || a.status === 'InProgress').length,
        openIssues: I.filter((i) => i.status !== 'Closed').length,
        dueSoon: P.filter((p) => p.nextAuditDate && p.nextAuditDate <= addDays(today, 14)).length,
      },
      alerts: scopedAlerts.slice(0, 40),
    })
  }

  if (action === 'listProfiles') {
    let rows = filterBranch(await getHraProfiles())
    if (body.activeOnly !== false) rows = rows.filter((r) => r.active !== false)
    return json(res, 200, {
      ok: true,
      profiles: rows.sort((a, b) => String(a.nextAuditDate).localeCompare(String(b.nextAuditDate))),
    })
  }

  if (action === 'saveProfile') {
    const id = s(body.id, 40) || hraNid('hp')
    const existing = (await getHraProfiles()).find((x) => x.id === id)
    const cadence = (s(body.cadence, 20) as HraCadence) || 'Monthly'
    const slaDay = Math.min(28, Math.max(1, num(body.slaDay) || 10))
    let nextAuditDate = s(body.nextAuditDate, 20)
    if (!nextAuditDate) {
      nextAuditDate =
        cadence === 'Monthly' ? nextMonthlySlaDate(slaDay) : addMonthsFromToday(3)
    }
    const row: HraClientProfile = {
      id,
      clientId: s(body.clientId, 40),
      clientName: s(body.clientName, 160),
      branchId: s(body.branchId, 40) || session.branchId || '',
      branchName: s(body.branchName, 120),
      cadence,
      slaDay,
      clientCode: s(body.clientCode, 40),
      active: body.active !== false && body.active !== 'false',
      notes: s(body.notes, 2000),
      responsibleOfficer: s(body.responsibleOfficer, 120) || name,
      nextAuditDate,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByEmail: existing?.createdByEmail || email,
    }
    if (!isMgmt && session.branchId) row.branchId = session.branchId
    if (!row.clientName) return json(res, 400, { error: 'Client name is required.' })
    await upsertHraProfile(row)
    return json(res, 200, { ok: true, profile: row })
  }

  if (action === 'listAudits') {
    let rows = filterBranch(await getHraAudits())
    const q = s(body.q, 80).toLowerCase()
    const status = s(body.status, 20)
    if (status) rows = rows.filter((r) => r.status === status)
    if (q) {
      rows = rows.filter((r) =>
        [r.clientName, r.clientCode, r.status, r.agenda].join(' ').toLowerCase().includes(q),
      )
    }
    rows = rows.sort((a, b) => String(b.auditDate).localeCompare(String(a.auditDate)))
    return json(res, 200, { ok: true, audits: rows.slice(0, 800) })
  }

  if (action === 'saveAudit') {
    const id = s(body.id, 40) || hraNid('ha')
    const existing = (await getHraAudits()).find((x) => x.id === id)
    const auditDate = s(body.auditDate, 20)
    const cadence = (s(body.cadence, 20) as HraCadence) || 'Monthly'
    const status = (s(body.status, 20) as HraAuditStatus) || 'Planned'
    const row: HraAudit = {
      id,
      profileId: s(body.profileId, 40),
      clientId: s(body.clientId, 40),
      clientName: s(body.clientName, 160),
      clientCode: s(body.clientCode, 40),
      branchId: s(body.branchId, 40) || session.branchId || '',
      branchName: s(body.branchName, 120),
      cadence,
      auditDate,
      periodFrom: s(body.periodFrom, 20),
      periodTo: s(body.periodTo, 20),
      status,
      checklist: parseChecklist(body.checklist ?? existing?.checklist),
      documents: parseDocs(body.documents ?? existing?.documents),
      agenda: s(body.agenda, 4000),
      minutes: s(body.minutes, 8000),
      submittedAt:
        status === 'Submitted' || status === 'Closed'
          ? existing?.submittedAt || new Date().toISOString()
          : '',
      submittedBy:
        status === 'Submitted' || status === 'Closed' ? existing?.submittedBy || name : '',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByEmail: existing?.createdByEmail || email,
    }
    if (!isMgmt && session.branchId) row.branchId = session.branchId
    if (!row.auditDate) return json(res, 400, { error: 'Please pick an audit date.' })
    if (!row.clientName) return json(res, 400, { error: 'Client name is required.' })
    await upsertHraAudit(row)

    /* Advance profile next date when audit submitted/closed */
    if ((status === 'Submitted' || status === 'Closed') && row.profileId) {
      const profiles = await getHraProfiles()
      const p = profiles.find((x) => x.id === row.profileId)
      if (p) {
        p.nextAuditDate = nextDueAfterAudit(row.auditDate, p.cadence, p.slaDay)
        p.updatedAt = new Date().toISOString()
        await upsertHraProfile(p)
      }
    }

    return json(res, 200, { ok: true, audit: row })
  }

  if (action === 'listIssues') {
    let rows = filterBranch(await getHraIssues())
    const status = s(body.status, 20)
    const q = s(body.q, 80).toLowerCase()
    if (status === 'open') rows = rows.filter((r) => r.status !== 'Closed')
    else if (status) rows = rows.filter((r) => r.status === status)
    if (q) {
      rows = rows.filter((r) =>
        [r.title, r.clientName, r.pointRef, r.ownerName].join(' ').toLowerCase().includes(q),
      )
    }
    rows = rows.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
    return json(res, 200, { ok: true, issues: rows.slice(0, 1000) })
  }

  if (action === 'saveIssue') {
    const id = s(body.id, 40) || hraNid('hi')
    const existing = (await getHraIssues()).find((x) => x.id === id)
    let status = (s(body.status, 20) as HraIssueStatus) || 'Open'
    let closedAt = existing?.closedAt || ''
    if (status === 'Closed' && !closedAt) closedAt = new Date().toISOString()
    if (status !== 'Closed') closedAt = ''
    const row: HraIssue = {
      id,
      auditId: s(body.auditId, 40),
      clientId: s(body.clientId, 40),
      clientName: s(body.clientName, 160),
      branchId: s(body.branchId, 40) || session.branchId || '',
      branchName: s(body.branchName, 120),
      title: s(body.title, 240),
      pointRef: s(body.pointRef, 120),
      severity: (s(body.severity, 20) as HraIssueSeverity) || 'Medium',
      status,
      dueDate: s(body.dueDate, 20),
      ownerName: s(body.ownerName, 120) || name,
      ownerEmail: s(body.ownerEmail, 160) || email,
      closureNotes: s(body.closureNotes, 4000),
      closedAt,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByEmail: existing?.createdByEmail || email,
    }
    if (!isMgmt && session.branchId) row.branchId = session.branchId
    if (!row.title) return json(res, 400, { error: 'Issue title is required.' })
    if (!row.dueDate) return json(res, 400, { error: 'Please pick a due date.' })
    await upsertHraIssue(row)
    return json(res, 200, { ok: true, issue: row })
  }

  if (action === 'alerts') {
    const alerts = await collectHraAlerts()
    return json(res, 200, { ok: true, alerts: alerts.slice(0, 150) })
  }

  return json(res, 400, { error: 'Unknown action.' })
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00+05:30')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function addMonthsFromToday(months: number): string {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  d.setMonth(d.getMonth() + months)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

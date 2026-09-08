/**
 * Agile Meeting — data API (Staff + Management), branch-wise.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { isSuiteAdminEmail, normaliseEmail } from '../_lib/auth.js'
import { collectMeetAlerts, refreshActionStatus } from '../_lib/meetings/alerts.js'
import {
  getMeetActions,
  getMeetContacts,
  getMeetMeetings,
  meetNid,
  meetStorageOk,
  upsertMeetAction,
  upsertMeetContact,
  upsertMeetMeeting,
} from '../_lib/meetings/store.js'
import type {
  MeetAction,
  MeetActionStatus,
  MeetContact,
  MeetMeeting,
  MeetPlatform,
  MeetStatus,
} from '../_lib/meetings/types.js'
import {
  MEET_PLATFORMS,
  cadenceForStars,
  isStrategicStars,
  nextDueFromMeeting,
} from '../_lib/meetings/types.js'
import { businessTierForName, businessTierLabel, resolveBusinessTiers } from '../_lib/mis/client-rules.js'
import { getBranches, getClients } from '../_lib/mis/store.js'
import { resolveSuiteUserName } from '../_lib/suite-mail.js'

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = s(body.action, 60)

  if (action === 'status') return json(res, 200, { ok: true, storage: meetStorageOk() })

  const session = await verifyAppSession(String(body.sessionToken ?? ''), 'meetings')
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
          isStrategic: isStrategicStars(stars),
          cadence: cadenceForStars(stars),
          businessTier: tierId,
          tier: businessTierLabel(tierId),
          staffName: c.staffName || '',
        }
      })
    return json(res, 200, {
      ok: true,
      email,
      name,
      portal,
      isMgmt,
      branchId: session.branchId || '',
      storage: meetStorageOk(),
      platforms: MEET_PLATFORMS,
      branches: branches.map((b) => ({ id: b.id, name: b.name })),
      clients: scopedClients.slice(0, 2000),
    })
  }

  if (action === 'dashboard') {
    const [meetings, actions, contacts, alerts] = await Promise.all([
      getMeetMeetings(),
      getMeetActions(),
      getMeetContacts(),
      collectMeetAlerts(),
    ])
    const M = filterBranch(meetings)
    const A = filterBranch(actions).map(refreshActionStatus)
    const C = filterBranch(contacts)
    const scopedAlerts = alerts.filter((a) => {
      if (isMgmt && !branchId) return true
      const bid = branchId || session.branchId || ''
      if (!bid) return true
      return (
        M.some((m) => m.id === a.refId || m.branchName === a.branchName) ||
        A.some((x) => x.id === a.refId || x.branchName === a.branchName)
      )
    })
    const today = new Date().toISOString().slice(0, 10)
    return json(res, 200, {
      ok: true,
      kpis: {
        scheduled: M.filter((m) => m.status === 'Scheduled' && m.meetingDate >= today).length,
        completed: M.filter((m) => m.status === 'Completed').length,
        strategic: M.filter((m) => m.isStrategic).length,
        openActions: A.filter((a) => a.status !== 'Done').length,
        overdueActions: A.filter((a) => a.status === 'Overdue' || (a.status !== 'Done' && a.dueDate < today))
          .length,
        contacts: C.length,
      },
      alerts: scopedAlerts.slice(0, 40),
    })
  }

  if (action === 'listMeetings') {
    let rows = filterBranch(await getMeetMeetings())
    const q = s(body.q, 80).toLowerCase()
    const status = s(body.status, 20)
    if (status) rows = rows.filter((r) => r.status === status)
    if (q) {
      rows = rows.filter((r) =>
        [r.clientName, r.platform, r.contactEmail, r.hostName, r.agenda].join(' ').toLowerCase().includes(q),
      )
    }
    rows = rows.sort((a, b) => String(b.meetingDate).localeCompare(String(a.meetingDate)))
    return json(res, 200, { ok: true, meetings: rows.slice(0, 800) })
  }

  if (action === 'saveMeeting') {
    const id = s(body.id, 40) || meetNid('mt')
    const existing = (await getMeetMeetings()).find((x) => x.id === id)
    const meetingDate = s(body.meetingDate, 20)
    const starsHint = num(body.starRating)
    const isStrategic =
      body.isStrategic === true || body.isStrategic === 'true' || isStrategicStars(starsHint)
    const cadence = isStrategic ? 'Monthly' : 'Quarterly'
    const status = (s(body.status, 20) as MeetStatus) || 'Scheduled'
    const nextDue =
      s(body.nextDueDate, 20) ||
      (meetingDate ? nextDueFromMeeting(meetingDate, cadence) : existing?.nextDueDate || '')
    const row: MeetMeeting = {
      id,
      branchId: s(body.branchId, 40) || session.branchId || '',
      branchName: s(body.branchName, 120),
      clientId: s(body.clientId, 40),
      clientName: s(body.clientName, 160),
      isStrategic,
      cadence,
      platform: (s(body.platform, 20) as MeetPlatform) || 'Zoom',
      meetingUrl: s(body.meetingUrl, 500),
      meetingRef: s(body.meetingRef, 120),
      meetingDate,
      meetingTime: s(body.meetingTime, 10),
      durationMins: num(body.durationMins) || 60,
      agenda: s(body.agenda, 4000),
      contactName: s(body.contactName, 120),
      contactEmail: s(body.contactEmail, 160),
      contactPhone: s(body.contactPhone, 40),
      hostName: s(body.hostName, 120) || name,
      hostEmail: s(body.hostEmail, 160) || email,
      status,
      minutes: s(body.minutes, 8000),
      nextDueDate: nextDue,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByEmail: existing?.createdByEmail || email,
    }
    if (!isMgmt && session.branchId) row.branchId = session.branchId
    if (!row.meetingDate) return json(res, 400, { error: 'Please pick a meeting date.' })
    if (!row.clientName) return json(res, 400, { error: 'Client name is required.' })
    await upsertMeetMeeting(row)
    return json(res, 200, { ok: true, meeting: row })
  }

  if (action === 'listActions') {
    let rows = filterBranch(await getMeetActions()).map(refreshActionStatus)
    const status = s(body.status, 20)
    const q = s(body.q, 80).toLowerCase()
    if (status === 'open') rows = rows.filter((r) => r.status !== 'Done')
    else if (status) rows = rows.filter((r) => r.status === status)
    if (q) {
      rows = rows.filter((r) =>
        [r.title, r.clientName, r.ownerName, r.ownerEmail].join(' ').toLowerCase().includes(q),
      )
    }
    rows = rows.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
    return json(res, 200, { ok: true, actions: rows.slice(0, 1000) })
  }

  if (action === 'saveAction') {
    const id = s(body.id, 40) || meetNid('ac')
    const existing = (await getMeetActions()).find((x) => x.id === id)
    let status = (s(body.status, 20) as MeetActionStatus) || 'Open'
    const dueDate = s(body.dueDate, 20)
    let completedAt = existing?.completedAt || ''
    if (status === 'Done' && !completedAt) completedAt = new Date().toISOString()
    if (status !== 'Done') completedAt = ''
    let row: MeetAction = {
      id,
      meetingId: s(body.meetingId, 40),
      branchId: s(body.branchId, 40) || session.branchId || '',
      branchName: s(body.branchName, 120),
      clientId: s(body.clientId, 40),
      clientName: s(body.clientName, 160),
      title: s(body.title, 240),
      ownerName: s(body.ownerName, 120) || name,
      ownerEmail: s(body.ownerEmail, 160) || email,
      dueDate,
      status,
      completionNotes: s(body.completionNotes, 4000),
      completedAt,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByEmail: existing?.createdByEmail || email,
    }
    if (!isMgmt && session.branchId) row.branchId = session.branchId
    if (!row.title) return json(res, 400, { error: 'Action title is required.' })
    if (!row.dueDate) return json(res, 400, { error: 'Please pick a due date.' })
    row = refreshActionStatus(row)
    await upsertMeetAction(row)
    return json(res, 200, { ok: true, action: row })
  }

  if (action === 'listContacts') {
    let rows = filterBranch(await getMeetContacts())
    const q = s(body.q, 80).toLowerCase()
    if (q) {
      rows = rows.filter((r) =>
        [r.name, r.email, r.clientName, r.phone, r.role].join(' ').toLowerCase().includes(q),
      )
    }
    rows = rows.sort((a, b) => a.clientName.localeCompare(b.clientName) || a.name.localeCompare(b.name))
    return json(res, 200, { ok: true, contacts: rows.slice(0, 2000) })
  }

  if (action === 'saveContact') {
    const id = s(body.id, 40) || meetNid('ct')
    const existing = (await getMeetContacts()).find((x) => x.id === id)
    const row: MeetContact = {
      id,
      branchId: s(body.branchId, 40) || session.branchId || '',
      branchName: s(body.branchName, 120),
      clientId: s(body.clientId, 40),
      clientName: s(body.clientName, 160),
      name: s(body.name, 120),
      email: s(body.email, 160),
      phone: s(body.phone, 40),
      role: s(body.role, 120),
      notes: s(body.notes, 2000),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByEmail: existing?.createdByEmail || email,
    }
    if (!isMgmt && session.branchId) row.branchId = session.branchId
    if (!row.name) return json(res, 400, { error: 'Contact name is required.' })
    if (!row.clientName) return json(res, 400, { error: 'Client name is required.' })
    await upsertMeetContact(row)
    return json(res, 200, { ok: true, contact: row })
  }

  if (action === 'clientCadence') {
    const meetings = filterBranch(await getMeetMeetings())
    const branches = await getBranches(true)
    const allClients = await getClients(undefined, { skipRepair: true, branches })
    const clientsRaw = branchId
      ? allClients.filter((c) => c.branchId === branchId)
      : isMgmt
        ? allClients
        : allClients.filter((c) => c.branchId === (session.branchId || ''))
    const branchNameById = Object.fromEntries(branches.map((b) => [b.id, b.name]))
    const tierByGroup = resolveBusinessTiers(allClients, branches)
    const lastByClient = new Map<string, MeetMeeting>()
    for (const m of meetings) {
      if (m.status === 'Cancelled') continue
      const key = m.clientId || m.clientName
      const prev = lastByClient.get(key)
      if (!prev || m.meetingDate > prev.meetingDate) lastByClient.set(key, m)
    }
    const clients = (Array.isArray(clientsRaw) ? clientsRaw : [])
      .filter((c) => c.active !== false)
      .map((c) => {
        const stars = Number(c.starRating) || 0
        const last = lastByClient.get(c.id) || lastByClient.get(c.name)
        const tierId = businessTierForName(c.name, tierByGroup)
        return {
          id: c.id,
          name: c.name,
          branchId: c.branchId,
          branchName: branchNameById[c.branchId] || '',
          starRating: stars,
          isStrategic: isStrategicStars(stars),
          cadence: cadenceForStars(stars),
          businessTier: tierId,
          tier: businessTierLabel(tierId),
          staffName: c.staffName || '',
          lastMeetingDate: last?.meetingDate || '',
          lastPlatform: last?.platform || '',
          nextDueDate: last?.nextDueDate || '',
          lastStatus: last?.status || '',
        }
      })
      .sort((a, b) => Number(b.isStrategic) - Number(a.isStrategic) || a.name.localeCompare(b.name))
    return json(res, 200, { ok: true, clients: clients.slice(0, 2000) })
  }

  if (action === 'alerts') {
    const alerts = await collectMeetAlerts()
    return json(res, 200, { ok: true, alerts: alerts.slice(0, 150) })
  }

  return json(res, 400, { error: 'Unknown action.' })
}

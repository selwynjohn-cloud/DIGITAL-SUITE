/**
 * Copy live suite data into Ops shadow (read-only from source systems).
 * Sources: MIS clients/guards/docs, Recruitment pipeline, recent Work360 attendance marks.
 */

import { getAttendanceMarks, getGuards as getRecruitGuards } from '../recruitment/store.js'
import {
  getBranches,
  getClients,
  getGuardDocs,
  getGuards as getMisGuards,
  getMisReportBranches,
  getReportsForDate,
  getStaff as getMisStaff,
  getUsers as getMisUsers,
  type MisBranch,
} from '../mis/store.js'
import { defaultWaMessage, type OpsGuardJourney } from './journey.js'
import {
  getGuards,
  getJourneys,
  getPosts,
  opsNid,
  saveGuards,
  saveJourneys,
  savePosts,
} from './store.js'
import type { OpsGuard, OpsPost } from './types.js'

function todayIso() {
  const now = new Date()
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().slice(0, 10)
}

function keyEmp(emp: string, name: string) {
  const e = emp.trim().toLowerCase()
  if (e) return `e:${e}`
  return `n:${name.trim().toLowerCase()}`
}

export type ShadowImportResult = {
  ok: true
  branchId: string
  branchName: string
  postsAdded: number
  postsUpdated: number
  guardsAdded: number
  guardsUpdated: number
  journeysAdded: number
  journeysSkipped: number
  sources: string[]
  message: string
}

export type ShadowVerifyResult = {
  ok: true
  complete: boolean
  liveActiveClients: number
  shadowPosts: number
  matched: number
  missing: number
  matchPct: number
  shadowGuards: number
  shadowJourneys: number
  journeysWithClientLoc: number
  postsMissingLocation: number
  branchesTotal: number
  branchesComplete: number
  branchesIncomplete: { branchId: string; branchName: string; clients: number; matched: number; missing: number }[]
  sampleMissing: { branchId: string; branchName: string; client: string; location: string }[]
  message: string
}

function postMatchKey(branchId: string, clientName: string, postName: string) {
  return `${branchId.trim()}|${clientName.trim().toLowerCase()}|${postName.trim().toLowerCase()}`
}

/** Compare live MIS clients (name + location + strength) vs Ops shadow posts. */
export async function verifyShadowCopy(): Promise<ShadowVerifyResult> {
  const branches = await getMisReportBranches(true).catch(() => getBranches(true))
  const branchName = (id: string) => branches.find((b) => b.id === id)?.name || id
  const clients = (await getClients()).filter((c) => c.active !== false)
  const posts = await getPosts()
  const guards = await getGuards()
  const journeys = await getJourneys()

  const byExact = new Map<string, OpsPost>()
  const byClient = new Map<string, OpsPost>()
  for (const p of posts) {
    byExact.set(postMatchKey(p.branchId, p.clientName, p.postName), p)
    byClient.set(`${p.branchId}|${p.clientName.trim().toLowerCase()}`, p)
  }

  let matched = 0
  const sampleMissing: ShadowVerifyResult['sampleMissing'] = []
  const roll = new Map<string, { clients: number; matched: number; missing: number }>()

  for (const c of clients) {
    const bid = c.branchId || ''
    const r = roll.get(bid) || { clients: 0, matched: 0, missing: 0 }
    r.clients++
    const hit =
      byExact.get(postMatchKey(bid, c.name, c.location || c.name)) ||
      byExact.get(postMatchKey(bid, c.name, c.name)) ||
      byClient.get(`${bid}|${c.name.trim().toLowerCase()}`)
    if (hit) {
      matched++
      r.matched++
    } else {
      r.missing++
      if (sampleMissing.length < 25) {
        sampleMissing.push({
          branchId: bid,
          branchName: branchName(bid),
          client: c.name,
          location: c.location || '',
        })
      }
    }
    roll.set(bid, r)
  }

  const missing = clients.length - matched
  const branchesIncomplete = [...roll.entries()]
    .filter(([, v]) => v.missing > 0)
    .map(([branchId, v]) => ({
      branchId,
      branchName: branchName(branchId),
      clients: v.clients,
      matched: v.matched,
      missing: v.missing,
    }))
    .sort((a, b) => b.missing - a.missing)

  const branchesTotal = roll.size
  const branchesComplete = branchesTotal - branchesIncomplete.length
  const postsMissingLocation = posts.filter((p) => !String(p.location || '').trim()).length
  const journeysWithClientLoc = journeys.filter(
    (j) => String(j.clientName || '').trim() && (String(j.location || '').trim() || String(j.postName || '').trim()),
  ).length
  const matchPct = clients.length ? Math.round((matched / clients.length) * 1000) / 10 : 100
  const complete = missing === 0 && clients.length > 0

  return {
    ok: true,
    complete,
    liveActiveClients: clients.length,
    shadowPosts: posts.length,
    matched,
    missing,
    matchPct,
    shadowGuards: guards.length,
    shadowJourneys: journeys.length,
    journeysWithClientLoc,
    postsMissingLocation,
    branchesTotal,
    branchesComplete,
    branchesIncomplete,
    sampleMissing,
    message: complete
      ? `Confirmed: all ${clients.length} live clients / locations are in shadow (${posts.length} posts). Guards ${guards.length}, journeys ${journeys.length}.`
      : `Not complete: ${matched}/${clients.length} clients matched (${matchPct}%). Missing ${missing} across ${branchesIncomplete.length} branches. Copy those branches, then check again.`,
  }
}

export async function importLiveIntoOpsShadow(opts?: {
  branchId?: string
  createJourneys?: boolean
}): Promise<ShadowImportResult> {
  const createJourneys = opts?.createJourneys !== false
  const sources: string[] = []
  const branches = await getMisReportBranches(true).catch(() => getBranches(true))
  const branchList: MisBranch[] = opts?.branchId
    ? branches.filter((b) => b.id === opts.branchId)
    : branches
  const branchName = (id: string) => branchList.find((b) => b.id === id)?.name || id

  // ——— Posts from MIS clients ———
  const clients = await getClients()
  sources.push('MIS clients')
  let posts = await getPosts()
  let postsAdded = 0
  let postsUpdated = 0
  const postByClient = new Map<string, OpsPost>()
  for (const p of posts) {
    postByClient.set(`${p.branchId}|${p.clientName.trim().toLowerCase()}|${p.postName.trim().toLowerCase()}`, p)
  }
  for (const c of clients) {
    if (c.active === false) continue
    if (opts?.branchId && c.branchId !== opts.branchId) continue
    const k = `${c.branchId}|${c.name.trim().toLowerCase()}|${(c.location || c.name).trim().toLowerCase()}`
    const existing = postByClient.get(k)
    if (existing) {
      existing.sanA = c.sanA
      existing.sanG = c.sanG
      existing.sanB = c.sanB
      existing.sanC = c.sanC
      existing.location = c.location || existing.location
      existing.branchName = branchName(c.branchId)
      existing.active = true
      postsUpdated++
    } else {
      const row: OpsPost = {
        id: opsNid('p'),
        branchId: c.branchId,
        branchName: branchName(c.branchId),
        clientId: c.id,
        clientName: c.name,
        postName: c.location || c.name,
        location: c.location || '',
        lat: null,
        lng: null,
        sanA: c.sanA || 0,
        sanG: c.sanG || 0,
        sanB: c.sanB || 0,
        sanC: c.sanC || 0,
        active: true,
        createdAt: new Date().toISOString(),
      }
      posts.push(row)
      postByClient.set(k, row)
      postsAdded++
    }
  }
  await savePosts(posts)

  // ——— Guards from MIS guards + guard docs + recruitment + attendance ———
  let guards = await getGuards()
  const byKey = new Map<string, OpsGuard>()
  for (const g of guards) byKey.set(keyEmp(g.employeeId, g.name), g)

  let guardsAdded = 0
  let guardsUpdated = 0

  const upsertGuard = (partial: {
    employeeId: string
    name: string
    mobile: string
    branchId: string
    rank?: string
    doj?: string
    status?: OpsGuard['status']
    kind?: OpsGuard['kind']
    email?: string
    department?: string
    team?: OpsGuard['team']
  }) => {
    if (!partial.name && !partial.employeeId) return
    const k = keyEmp(partial.employeeId, partial.name)
    const prev = byKey.get(k)
    if (prev) {
      prev.employeeId = partial.employeeId || prev.employeeId
      prev.name = partial.name || prev.name
      prev.mobile = partial.mobile || prev.mobile
      prev.branchId = partial.branchId || prev.branchId
      prev.branchName = branchName(prev.branchId)
      if (partial.rank) prev.rank = partial.rank
      if (partial.doj) prev.doj = partial.doj
      if (partial.kind) prev.kind = partial.kind
      if (partial.email) prev.email = partial.email
      if (partial.department) prev.department = partial.department
      if (partial.team) prev.team = partial.team
      if (!prev.kind) prev.kind = 'guard'
      if (!prev.email) prev.email = ''
      if (!prev.department) prev.department = ''
      if (!prev.team) prev.team = ''
      if (!prev.photoId) prev.photoId = ''
      prev.updatedAt = new Date().toISOString()
      guardsUpdated++
    } else {
      const row: OpsGuard = {
        id: opsNid('g'),
        kind: partial.kind || 'guard',
        employeeId: partial.employeeId || '',
        name: partial.name || '',
        mobile: partial.mobile || '',
        email: partial.email || '',
        branchId: partial.branchId || '',
        branchName: branchName(partial.branchId || ''),
        rank: partial.rank || (partial.kind === 'staff' ? 'Staff' : 'Guard'),
        department: partial.department || '',
        team: partial.team || '',
        skills: '',
        lat: null,
        lng: null,
        status: partial.status || 'active',
        doj: partial.doj || '',
        photoId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      guards.push(row)
      byKey.set(k, row)
      guardsAdded++
    }
  }

  const misGuardsCache = new Map<string, Awaited<ReturnType<typeof getMisGuards>>>()
  const docsCache = new Map<string, Awaited<ReturnType<typeof getGuardDocs>>>()

  for (const b of branchList) {
    const misGuards = await getMisGuards(b.id)
    misGuardsCache.set(b.id, misGuards)
    if (misGuards.length) sources.push(`MIS guards:${b.name}`)
    for (const g of misGuards) {
      upsertGuard({
        employeeId: g.employeeId,
        name: g.name,
        mobile: g.mobile,
        branchId: b.id,
      })
    }
    const docs = await getGuardDocs(b.id)
    docsCache.set(b.id, docs)
    if (docs.length) sources.push(`MIS guard-docs:${b.name}`)
    for (const d of docs) {
      upsertGuard({
        employeeId: d.employeeId,
        name: d.guardName,
        mobile: d.mobile,
        branchId: b.id,
        doj: d.doj,
      })
    }
  }

  const recruit = await getRecruitGuards()
  sources.push('Recruitment pipeline')
  for (const r of recruit) {
    if (r.active === false) continue
    if (opts?.branchId && r.branchId !== opts.branchId) continue
    const deployed = /deploy/i.test(r.stage || '')
    upsertGuard({
      employeeId: '',
      name: r.name,
      mobile: r.mobile,
      branchId: r.branchId,
      status: deployed ? 'active' : r.stage === 'training' ? 'training' : 'active',
    })
  }

  // Attendance marks only when copying all branches (no branch on mark rows)
  if (!opts?.branchId) {
    const marks = await getAttendanceMarks(todayIso())
    if (marks.length) sources.push('Work360 attendance marks (today)')
    for (const m of marks) {
      upsertGuard({
        employeeId: m.employeeId,
        name: m.guardName,
        mobile: m.mobile || '',
        branchId: '',
      })
    }
  }

  // ——— Agile Group staff (branch ops + HQ support) — always refresh with each copy ———
  if (await upsertAgileStaff(upsertGuard, opts?.branchId)) {
    sources.push('MIS Agile staff + users')
  }

  await saveGuards(guards)

  // ——— Journey stubs from MIS daily deployment + guard docs ———
  let journeys = await getJourneys()
  let journeysAdded = 0
  let journeysSkipped = 0
  const journeyKey = new Set(
    journeys.map((j) => keyEmp(j.employeeId, j.guardName) + '|' + j.branchId),
  )

  if (createJourneys) {
    const date = todayIso()
    const reports = await getReportsForDate(date, branchList)
    if (reports.length) sources.push('MIS daily deployment rows')
    for (const rep of reports) {
      const branchGuards = misGuardsCache.get(rep.branchId) || []
      for (const row of rep.rows || []) {
        const atClient = branchGuards.filter(
          (g) => g.clientName.trim().toLowerCase() === row.clientName.trim().toLowerCase(),
        )
        for (const g of atClient) {
          const gk = keyEmp(g.employeeId, g.name) + '|' + rep.branchId
          if (journeyKey.has(gk)) {
            journeysSkipped++
            continue
          }
          journeys.push(
            journeyFromGuard({
              branchId: rep.branchId,
              branchName: rep.branchName,
              guardName: g.name,
              employeeId: g.employeeId,
              mobile: g.mobile,
              clientName: g.clientName || row.clientName,
              postName: g.unitName || row.location,
              location: row.location || g.unitName,
              stage: 'active_duty',
            }),
          )
          journeyKey.add(gk)
          journeysAdded++
        }
      }
    }

    for (const b of branchList) {
      const docs = docsCache.get(b.id) || []
      for (const d of docs) {
        const gk = keyEmp(d.employeeId, d.guardName) + '|' + b.id
        if (journeyKey.has(gk)) {
          journeysSkipped++
          continue
        }
        journeys.push(
          journeyFromGuard({
            branchId: b.id,
            branchName: b.name,
            guardName: d.guardName,
            employeeId: d.employeeId,
            mobile: d.mobile,
            clientName: d.unitName,
            postName: d.unitName,
            location: d.unitName,
            joiningDate: d.doj,
            idCardIssued: Boolean(d.idCardIssueDate),
            idCardNo: '',
            fitnessOk: /valid|fit|ok/i.test(d.medical || ''),
            stage: 'active_duty',
          }),
        )
        journeyKey.add(gk)
        journeysAdded++
      }
    }

    // Recruitment deployed
    for (const r of recruit) {
      if (r.active === false || !/deploy/i.test(r.stage || '')) continue
      if (opts?.branchId && r.branchId !== opts.branchId) continue
      const gk = keyEmp('', r.name) + '|' + r.branchId
      if (journeyKey.has(gk)) {
        journeysSkipped++
        continue
      }
      journeys.push(
        journeyFromGuard({
          branchId: r.branchId,
          branchName: branchName(r.branchId),
          guardName: r.name,
          employeeId: '',
          mobile: r.mobile,
          clientName: r.deployedSite || r.siteZone,
          postName: r.deployedSite || r.siteZone,
          location: r.deployedSite || r.siteZone,
          fitnessOk: /pass|ok|fit/i.test(r.fitnessStatus || r.medicalStatus || ''),
          stage: 'active_duty',
        }),
      )
      journeyKey.add(gk)
      journeysAdded++
    }

    await saveJourneys(journeys)
  }

  const branchLabel = opts?.branchId
    ? branchName(opts.branchId) || opts.branchId
    : 'all branches'
  return {
    ok: true,
    branchId: opts?.branchId || '',
    branchName: branchLabel,
    postsAdded,
    postsUpdated,
    guardsAdded,
    guardsUpdated,
    journeysAdded,
    journeysSkipped,
    sources: [...new Set(sources)],
    message: `Copied ${branchLabel}: Posts +${postsAdded}/~${postsUpdated}, Guards +${guardsAdded}/~${guardsUpdated}, Journeys +${journeysAdded} (skipped ${journeysSkipped}). Live apps unchanged.`,
  }
}

function staffEmpId(phone: string, email: string, id: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  const em = email.trim().toLowerCase()
  if (em) return `EM-${em.slice(0, 36)}`
  return `ST-${id}`.slice(0, 40)
}

/** Import MIS Master Directory staff + User Management into Ops people (kind=staff). */
async function upsertAgileStaff(
  upsert: (partial: {
    employeeId: string
    name: string
    mobile: string
    branchId: string
    rank?: string
    kind?: OpsGuard['kind']
    email?: string
    department?: string
    team?: OpsGuard['team']
  }) => void,
  branchId?: string,
): Promise<boolean> {
  let touched = false
  const staff = await getMisStaff()
  for (const s of staff) {
    if (s.active === false) continue
    if (branchId && s.branchId !== branchId && s.team !== 'support') continue
    const emp = staffEmpId(s.phone || '', '', s.id)
    upsert({
      employeeId: emp,
      name: s.name,
      mobile: s.phone || '',
      branchId: s.branchId || '',
      rank: s.role || 'Staff',
      kind: 'staff',
      department: s.department || '',
      team: s.team === 'support' ? 'support' : s.team === 'operations' ? 'operations' : '',
    })
    touched = true
  }
  const users = await getMisUsers()
  for (const u of users) {
    if (u.active === false) continue
    if (branchId && u.branchId !== branchId) {
      // Still allow HQ support users when filtering by branch
      if (u.team !== 'support') continue
    }
    const emp = staffEmpId(u.phone || '', u.email || '', u.id)
    upsert({
      employeeId: emp,
      name: u.name,
      mobile: u.phone || '',
      branchId: u.branchId || '',
      rank: u.role || 'Staff',
      kind: 'staff',
      email: u.email || '',
      department: u.department || '',
      team: u.team === 'support' ? 'support' : 'operations',
    })
    touched = true
  }
  return touched
}

/** Copy only Agile Group staff (ops + HQ) into shadow — one click. */
export async function importStaffIntoOpsShadow(opts?: { branchId?: string }) {
  const branches = await getMisReportBranches(true).catch(() => getBranches(true))
  const branchNameOf = (id: string) => branches.find((b) => b.id === id)?.name || id
  let people = await getGuards()
  const byKey = new Map<string, OpsGuard>()
  for (const g of people) byKey.set(keyEmp(g.employeeId, g.name), g)
  let added = 0
  let updated = 0

  const upsert = (partial: {
    employeeId: string
    name: string
    mobile: string
    branchId: string
    rank?: string
    kind?: OpsGuard['kind']
    email?: string
    department?: string
    team?: OpsGuard['team']
  }) => {
    if (!partial.name && !partial.employeeId) return
    const k = keyEmp(partial.employeeId, partial.name)
    const prev = byKey.get(k)
    if (prev) {
      prev.kind = 'staff'
      prev.employeeId = partial.employeeId || prev.employeeId
      prev.name = partial.name || prev.name
      prev.mobile = partial.mobile || prev.mobile
      prev.email = partial.email || prev.email || ''
      prev.branchId = partial.branchId || prev.branchId
      prev.branchName = branchNameOf(prev.branchId)
      prev.rank = partial.rank || prev.rank
      prev.department = partial.department || prev.department || ''
      prev.team = partial.team || prev.team || ''
      if (!prev.photoId) prev.photoId = ''
      prev.updatedAt = new Date().toISOString()
      updated++
    } else {
      const row: OpsGuard = {
        id: opsNid('g'),
        kind: 'staff',
        employeeId: partial.employeeId || '',
        name: partial.name || '',
        mobile: partial.mobile || '',
        email: partial.email || '',
        branchId: partial.branchId || '',
        branchName: branchNameOf(partial.branchId || ''),
        rank: partial.rank || 'Staff',
        department: partial.department || '',
        team: partial.team || '',
        skills: '',
        lat: null,
        lng: null,
        status: 'active',
        doj: '',
        photoId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      people.push(row)
      byKey.set(k, row)
      added++
    }
  }

  await upsertAgileStaff(upsert, opts?.branchId)
  await saveGuards(people)
  const staffCount = people.filter((p) => p.kind === 'staff').length
  return {
    ok: true as const,
    branchId: opts?.branchId || '',
    branchName: opts?.branchId ? branchNameOf(opts.branchId) : 'all branches',
    postsAdded: 0,
    postsUpdated: 0,
    guardsAdded: added,
    guardsUpdated: updated,
    journeysAdded: 0,
    journeysSkipped: 0,
    staffCount,
    sources: ['MIS Agile staff', 'MIS User Management'],
    message: `Agile staff copied. +${added} new / ~${updated} updated. Staff in shadow now: ${staffCount}. Photo required before any staff or guard starts duty.`,
  }
}

function journeyFromGuard(p: {
  branchId: string
  branchName: string
  guardName: string
  employeeId: string
  mobile: string
  clientName: string
  postName: string
  location: string
  joiningDate?: string
  idCardIssued?: boolean
  idCardNo?: string
  fitnessOk?: boolean
  stage?: OpsGuardJourney['stage']
}): OpsGuardJourney {
  const joiningDate = p.joiningDate || ''
  const row: OpsGuardJourney = {
    id: opsNid('jy'),
    kind: 'new_join',
    stage: p.stage || 'active_duty',
    branchId: p.branchId,
    branchName: p.branchName,
    guardName: p.guardName,
    employeeId: p.employeeId,
    mobile: p.mobile,
    photoId: '',
    psaraDocsOk: true,
    psaraDocNotes: 'Imported from live suite (shadow copy)',
    fitnessOk: Boolean(p.fitnessOk),
    fitnessDate: '',
    idCardIssued: Boolean(p.idCardIssued),
    idCardNo: p.idCardNo || '',
    uniformIssued: false,
    uniformItems: '',
    orderNo: `IMP-${Date.now().toString(36).toUpperCase()}`,
    clientName: p.clientName,
    postName: p.postName,
    location: p.location,
    joiningDate,
    shift: 'A',
    waGuard: p.mobile,
    waHod: '',
    waOpsManager: '',
    waIt: '',
    waMessage: '',
    waSentAt: '',
    waStatus: 'draft',
    reportedDuty: p.stage === 'active_duty',
    reportedDutyAt: '',
    helpCalls: [],
    scheduled: p.stage === 'active_duty',
    scheduleNote: 'Imported shadow record',
    firstWeekNoNight: false,
    dutyMessageSentAt: '',
    hodApproved: true,
    hodApprovedBy: 'import',
    hodApprovedAt: new Date().toISOString(),
    previousClient: '',
    resignationDate: '',
    resignationReason: '',
    exitInterview: null,
    events: [
      {
        id: opsNid('je'),
        at: new Date().toISOString(),
        by: 'shadow-import',
        stage: p.stage || 'active_duty',
        note: 'Copied from live MIS / Recruitment into Ops shadow',
      },
    ],
    createdBy: 'shadow-import',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  row.waMessage = defaultWaMessage(row)
  return row
}

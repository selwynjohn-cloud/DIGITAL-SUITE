/** Agile Live operations phone — sanctioned / shift / day + split contacts. */

import { listHodContacts } from '../guards/hod-contacts.js'
import type { MisClient, MisGuardDoc, MisStaff, MisUser } from '../mis/store.js'
import { normaliseMobile, type OpsGuard } from '../ops-mobile/store.js'
import { foldLiveSite, matchLiveDutyPost } from './duty-post.js'
import { LIVE_WEEKDAYS, livePersonWeek, liveShiftLetter } from './weekly-roster.js'

export type LiveOpsPhonePerson = {
  name: string
  mobile: string
  idNo?: string
  clientSite?: string
  rank?: string
  shift?: string
  role?: string
}

export type LiveOpsSanctioned = {
  clientSite: string
  sanA: number
  sanG: number
  sanB: number
  sanC: number
  total: number
  onFile: boolean
}

export type LiveOpsShiftBlock = {
  clientSite: string
  shift: string
  people: LiveOpsPhonePerson[]
}

export type LiveOpsDayBlock = {
  dow: string
  ymd: string
  isToday: boolean
  people: LiveOpsPhonePerson[]
}

export type LiveOpsPhonePack = {
  room: string
  weekLabel: string
  weekdays: readonly string[]
  sanctioned: LiveOpsSanctioned[]
  shiftwise: LiveOpsShiftBlock[]
  daywise: LiveOpsDayBlock[]
  contacts: {
    unitStaff: LiveOpsPhonePerson[]
    emergency: LiveOpsPhonePerson[]
    operationsTeam: LiveOpsPhonePerson[]
    commandCentre: LiveOpsPhonePerson[]
    helpdesk: LiveOpsPhonePerson[]
  }
}

const SHIFT_ORDER = ['A', 'G', 'B', 'C', 'Off'] as const

function siteLabel(name: string, location: string, fallback = ''): string {
  return [name, location].map((s) => String(s || '').trim()).filter(Boolean).join(' — ') || fallback
}

function personSort(a: LiveOpsPhonePerson, b: LiveOpsPhonePerson): number {
  return (
    String(a.clientSite || '').localeCompare(String(b.clientSite || '')) ||
    String(a.name || '').localeCompare(String(b.name || ''))
  )
}

function addUnique(list: LiveOpsPhonePerson[], row: LiveOpsPhonePerson, seen: Set<string>) {
  const mob = normaliseMobile(row.mobile)
  const key = mob.length === 10 ? mob : `${foldLiveSite(row.name)}|${foldLiveSite(row.clientSite || row.role || '')}`
  if (!key || seen.has(key)) return
  seen.add(key)
  list.push({ ...row, mobile: mob.length === 10 ? mob : '' })
}

function isHelpdeskRole(raw: string): boolean {
  return /help\s*desk|helpdesk/i.test(String(raw || ''))
}

function shiftOrder(code: string): number {
  const i = (SHIFT_ORDER as readonly string[]).indexOf(code)
  return i >= 0 ? i : SHIFT_ORDER.length
}

export function buildLiveOpsPhoneLists(opts: {
  room: string
  branchId: string
  people: OpsGuard[]
  clients: MisClient[]
  opsStaff: MisStaff[]
  users: MisUser[]
  branches: { id: string; name: string }[]
  docs: MisGuardDoc[]
  offWeekday: (branch: string, clientSite: string) => number
}): LiveOpsPhonePack {
  const unitSeen = new Map<string, LiveOpsSanctioned>()
  for (const c of opts.clients) {
    if (c.active === false) continue
    const clientSite = siteLabel(c.name, c.location, c.name)
    const key = foldLiveSite(clientSite) || c.id
    const sanA = Number(c.sanA) || 0
    const sanG = Number(c.sanG) || 0
    const sanB = Number(c.sanB) || 0
    const sanC = Number(c.sanC) || 0
    const total = sanA + sanG + sanB + sanC
    if (!unitSeen.has(key)) {
      unitSeen.set(key, { clientSite, sanA, sanG, sanB, sanC, total, onFile: total > 0 })
    }
  }

  const shiftMap = new Map<string, LiveOpsShiftBlock>()
  const dayMap = new Map<string, LiveOpsDayBlock>()
  const unitStaff: LiveOpsPhonePerson[] = []
  const unitSeenMob = new Set<string>()
  let weekLabel = 'This week · duty changes every Sunday'

  for (const g of opts.people) {
    const view = matchLiveDutyPost({ clientSite: g.clientSite, branch: g.branch, clients: opts.clients })
    const clientSite = siteLabel(view.clientName, view.location, g.clientSite)
    const unitKey = foldLiveSite(clientSite)
    if (unitKey && !unitSeen.has(unitKey)) {
      const sanA = Number(view.sanA) || 0
      const sanG = Number(view.sanG) || 0
      const sanB = Number(view.sanB) || 0
      const sanC = Number(view.sanC) || 0
      const total = sanA + sanG + sanB + sanC
      unitSeen.set(unitKey, { clientSite, sanA, sanG, sanB, sanC, total, onFile: total > 0 })
    }
    const week = livePersonWeek({
      idNo: g.idNo,
      clientSite,
      designation: g.designation,
      shiftRaw: g.shift,
      offWeekday: opts.offWeekday(g.branch, g.clientSite),
    })
    weekLabel = week.weekLabel || weekLabel
    const todayShift = week.todayOff ? 'Off' : week.todayShift || liveShiftLetter(week.shiftCode) || 'Duty'
    const person: LiveOpsPhonePerson = {
      name: g.name,
      mobile: normaliseMobile(g.mobile),
      idNo: g.idNo,
      clientSite,
      rank: week.rank,
      shift: week.todayOff ? 'Off Duty' : week.shiftLabel,
    }
    addUnique(unitStaff, person, unitSeenMob)
    const sk = `${unitKey}|${todayShift}`
    if (!shiftMap.has(sk)) shiftMap.set(sk, { clientSite, shift: todayShift, people: [] })
    shiftMap.get(sk)!.people.push(person)
    for (const day of week.days) {
      if (!dayMap.has(day.ymd)) {
        dayMap.set(day.ymd, { dow: day.dow, ymd: day.ymd, isToday: day.isToday, people: [] })
      }
      if (day.isOff) continue
      dayMap.get(day.ymd)!.people.push({
        ...person,
        shift: week.shiftLabel,
      })
    }
  }

  const sanctioned = [...unitSeen.values()].sort((a, b) => a.clientSite.localeCompare(b.clientSite))
  const shiftwise = [...shiftMap.values()]
    .map((b) => ({ ...b, people: b.people.slice().sort(personSort) }))
    .sort(
      (a, b) => a.clientSite.localeCompare(b.clientSite) || shiftOrder(a.shift) - shiftOrder(b.shift),
    )
  const daywise = [...dayMap.values()]
    .map((d) => ({ ...d, people: d.people.slice().sort(personSort) }))
    .sort((a, b) => a.ymd.localeCompare(b.ymd))

  const emergency: LiveOpsPhonePerson[] = []
  const emSeen = new Set<string>()
  for (const d of opts.docs) {
    const name = String(d.incharge || '').trim()
    const mobile = normaliseMobile(d.inchargeMobile)
    if (!name && mobile.length !== 10) continue
    addUnique(
      emergency,
      {
        name: name || 'Unit incharge',
        mobile,
        clientSite: String(d.unitName || '').trim(),
        role: 'Unit incharge',
      },
      emSeen,
    )
  }
  emergency.sort(personSort)

  const operationsTeam: LiveOpsPhonePerson[] = []
  const opsSeen = new Set<string>()
  for (const s of opts.opsStaff) {
    if (s.active === false || s.team === 'support') continue
    addUnique(
      operationsTeam,
      {
        name: s.name,
        mobile: s.phone,
        role: s.role || 'Operations',
      },
      opsSeen,
    )
  }
  if (opts.branchId) {
    for (const h of listHodContacts(opts.branchId, opts.branches, opts.users)) {
      const u = opts.users.find((x) => String(x.email || '').trim().toLowerCase() === h.email.toLowerCase())
      addUnique(
        operationsTeam,
        {
          name: h.name,
          mobile: u?.phone || '',
          role: h.roleLabel,
        },
        opsSeen,
      )
    }
  }
  operationsTeam.sort(personSort)

  const helpdesk: LiveOpsPhonePerson[] = []
  const hdSeen = new Set<string>()
  for (const u of opts.users) {
    if (u.active === false || !isHelpdeskRole(`${u.role} ${u.department || ''}`)) continue
    addUnique(helpdesk, { name: u.name || u.email, mobile: u.phone, role: u.role || 'Helpdesk' }, hdSeen)
  }
  for (const s of opts.opsStaff) {
    if (s.active === false || !isHelpdeskRole(`${s.role} ${s.department || ''}`)) continue
    addUnique(helpdesk, { name: s.name, mobile: s.phone, role: s.role || 'Helpdesk' }, hdSeen)
  }
  helpdesk.sort(personSort)

  return {
    room: opts.room,
    weekLabel,
    weekdays: LIVE_WEEKDAYS,
    sanctioned,
    shiftwise,
    daywise,
    contacts: {
      unitStaff: unitStaff.sort(personSort),
      emergency,
      operationsTeam,
      commandCentre: [{ name: 'Central Control', mobile: '9248707070', role: 'Command Centre' }],
      helpdesk,
    },
  }
}

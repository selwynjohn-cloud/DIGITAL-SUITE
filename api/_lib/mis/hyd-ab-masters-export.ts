/**
 * Read-only Hyderabad-A / Hyderabad-B pull from Master Directory + Guard Compliance.
 * Used by MIS cron job=hyd-ab-masters.
 */
import * as XLSX from 'xlsx'
import { getAttendanceDates, getAttendanceMarks } from '../recruitment/store.js'
import { work360Config } from './work360-client.js'
import { loadWork360EmployeeDirectory } from '../recruitment/work360-employees.js'
import {
  getClients,
  getDutyDates,
  getDutyIncidents,
  getGuardDocs,
  getGuards,
  getMisReportBranches,
  getStaff,
  guardRecordEligible,
  type MisBranch,
  type MisClient,
  type MisGuardDoc,
} from './store.js'

function mobile10(raw: unknown): string {
  const d = String(raw ?? '').replace(/\D/g, '')
  return d.length >= 10 ? d.slice(-10) : ''
}

function clean(raw: unknown): string {
  return String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

type Person = {
  name: string
  mobile: string
  unit: string
  employeeId: string
  source: string
}

function personKey(p: Person): string {
  const mob = mobile10(p.mobile)
  const emp = clean(p.employeeId).replace(/\s+/g, '').toUpperCase()
  if (mob.length === 10) return `m:${mob}`
  if (emp.length >= 4) return `e:${emp}`
  return `n:${clean(p.name).toLowerCase()}|${clean(p.unit).toLowerCase()}`
}

function upsert(map: Map<string, Person>, incoming: Person) {
  const name = clean(incoming.name)
  if (name.length < 2) return
  const row: Person = {
    name,
    mobile: mobile10(incoming.mobile),
    unit: clean(incoming.unit),
    employeeId: clean(incoming.employeeId),
    source: incoming.source,
  }
  const key = personKey(row)
  const prev = map.get(key)
  if (!prev) {
    map.set(key, row)
    return
  }
  map.set(key, {
    name: prev.name.length >= row.name.length ? prev.name : row.name,
    mobile: prev.mobile || row.mobile,
    unit: prev.unit || row.unit,
    employeeId: prev.employeeId || row.employeeId,
    source: prev.source.includes(row.source) ? prev.source : `${prev.source}+${row.source}`,
  })
}

function hydBranches(all: MisBranch[]): MisBranch[] {
  return all.filter((b) => /hyderabad\s*-?\s*[ab]\b/i.test(b.name)).sort((a, c) => a.name.localeCompare(c.name, 'en'))
}

function empKey(raw: unknown): string {
  const t = clean(raw).replace(/\s+/g, '').toUpperCase()
  if (t.length < 4) return ''
  return t.replace(/^0+/, '') || t
}

function fillFromLookup(peopleById: Map<string, Map<string, Person>>, employeeId: string, mobile: string, source: string) {
  const emp = empKey(employeeId)
  const mob = mobile10(mobile)
  if (!emp || !mob) return
  for (const people of peopleById.values()) {
    for (const [key, prev] of people) {
      if (empKey(prev.employeeId) !== emp) continue
      if (prev.mobile) return
      people.set(key, { ...prev, mobile: mob, source: `${prev.source}+${source}` })
      return
    }
  }
}

function addSheet(wb: XLSX.WorkBook, name: string, rows: (string | number)[][], cols: number[]) {
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = cols.map((wch) => ({ wch }))
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31))
}

export async function buildHydAbMastersWorkbook(): Promise<{
  buffer: Buffer
  filename: string
  summary: Record<string, unknown>
}> {
  const branches = hydBranches(await getMisReportBranches(true))
  if (branches.length < 2) throw new Error('Hyderabad-A / Hyderabad-B not found in Master Directory.')

  const sitesById = new Map<string, MisClient[]>()
  const peopleById = new Map<string, Map<string, Person>>()
  const staffRows: (string | number)[][] = [['Branch', 'Name', 'Role', 'Mobile', 'Team']]
  const siteRows: Record<string, (string | number)[][]> = {}

  for (const b of branches) {
    const [sites, staff, docs, guards] = await Promise.all([
      getClients(b.id, { skipRepair: true }),
      getStaff(b.id, false),
      getGuardDocs(b.id),
      getGuards(b.id),
    ])
    const activeSites = sites.filter((c) => c.active !== false)
    sitesById.set(b.id, activeSites)
    const people = new Map<string, Person>()
    peopleById.set(b.id, people)

    for (const d of docs) {
      if (!guardRecordEligible(d as MisGuardDoc)) continue
      upsert(people, {
        name: d.guardName,
        mobile: d.mobile,
        unit: d.unitName,
        employeeId: d.employeeId,
        source: 'Guard Compliance',
      })
    }
    for (const g of guards) {
      upsert(people, {
        name: g.name,
        mobile: g.mobile,
        unit: g.unitName || g.clientName,
        employeeId: g.employeeId,
        source: 'Guards master',
      })
    }

    const header = ['Client', 'Site', 'Staff', 'San A', 'San G', 'San B', 'San C', 'Total', 'Active']
    siteRows[b.id] = [
      header,
      ...activeSites
        .slice()
        .sort((a, c) => `${a.name} ${a.location}`.localeCompare(`${c.name} ${c.location}`, 'en'))
        .map((c) => {
          const tot = (Number(c.sanA) || 0) + (Number(c.sanG) || 0) + (Number(c.sanB) || 0) + (Number(c.sanC) || 0)
          return [
            clean(c.name),
            clean(c.location),
            clean(c.staffName),
            Number(c.sanA) || 0,
            Number(c.sanG) || 0,
            Number(c.sanB) || 0,
            Number(c.sanC) || 0,
            tot,
            c.active === false ? 'No' : 'Yes',
          ]
        }),
    ]

    for (const s of staff.filter((x) => x.active !== false)) {
      staffRows.push([b.name, clean(s.name), clean(s.role), mobile10(s.phone) || clean(s.phone), s.team || 'operations'])
    }
  }

  try {
    const cfg = work360Config()
    if (cfg) {
      const dir = await loadWork360EmployeeDirectory(cfg, [])
      for (const [emp, hit] of dir) {
        fillFromLookup(peopleById, emp, hit.mobile, 'Work360')
      }
    }
  } catch {
    /* Work360 is optional */
  }

  for (const d of (await getDutyDates()).slice(-14)) {
    for (const inc of await getDutyIncidents(d)) {
      fillFromLookup(peopleById, inc.employeeId, inc.mobile || '', 'Duty')
    }
  }
  for (const d of (await getAttendanceDates()).slice(-14)) {
    for (const m of await getAttendanceMarks(d)) {
      fillFromLookup(peopleById, m.employeeId, m.mobile, 'Attendance')
    }
  }

  const wb = XLSX.utils.book_new()
  const summaryRows: (string | number)[][] = [
    ['Branch', 'Master sites', 'Sanctioned (sites)', 'Guards in book', 'Guards with mobile', 'Operations staff'],
  ]
  const allGuards: (string | number)[][] = [['Branch', 'Name', 'Mobile', 'Unit / Site', 'Employee ID', 'Source']]
  const counts: Record<string, unknown>[] = []

  for (const b of branches) {
    const sites = sitesById.get(b.id) || []
    const san = sites.reduce(
      (n, c) => n + (Number(c.sanA) || 0) + (Number(c.sanG) || 0) + (Number(c.sanB) || 0) + (Number(c.sanC) || 0),
      0,
    )
    const people = [...(peopleById.get(b.id)?.values() || [])].sort((a, c) =>
      a.name.localeCompare(c.name, 'en', { sensitivity: 'base' }),
    )
    const withMob = people.filter((p) => p.mobile.length === 10).length
    const staffN = staffRows.filter((r) => r[0] === b.name).length
    summaryRows.push([b.name, sites.length, san, people.length, withMob, staffN])
    counts.push({
      branch: b.name,
      sites: sites.length,
      sanctioned: san,
      guards: people.length,
      withMobile: withMob,
      staff: staffN,
    })

    const guardSheet: (string | number)[][] = [['Name', 'Mobile', 'Unit / Site', 'Employee ID', 'Source']]
    for (const p of people) {
      guardSheet.push([p.name, p.mobile, p.unit, p.employeeId, p.source])
      allGuards.push([b.name, p.name, p.mobile, p.unit, p.employeeId, p.source])
    }
    addSheet(wb, `${b.name} Guards`, guardSheet, [36, 14, 42, 16, 22])
    addSheet(wb, `${b.name} Sites`, siteRows[b.id] || [['Client']], [36, 36, 22, 8, 8, 8, 8, 8, 8])
  }

  addSheet(wb, 'All Hyd A+B Guards', allGuards, [16, 36, 14, 42, 16, 22])
  addSheet(wb, 'Operations Staff', staffRows, [16, 28, 24, 14, 14])
  addSheet(wb, 'Summary', summaryRows, [16, 14, 20, 16, 20, 18])

  const buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer)
  return {
    buffer,
    filename: 'Hyderabad-A-B-Master-Guards.xlsx',
    summary: { branches: counts, sheets: wb.SheetNames },
  }
}

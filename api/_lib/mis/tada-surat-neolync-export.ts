/**
 * Tada, Surat, and Tirupati — Neolync Name + Mobile.
 * Tada stays Premier Energies Naidupeta only. Surat stays Surat (not Mumbai).
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
  guardRecordEligible,
  type MisBranch,
} from './store.js'

const NA = /^(n\/?a|n\.a\.?|nil|null|-|—|none|not available|\.)$/i

function clean(raw: unknown): string {
  return String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isNaVal(raw: unknown): boolean {
  const t = clean(raw)
  return !t || NA.test(t)
}

function mobile10(raw: unknown): string {
  const d = String(raw ?? '').replace(/\D/g, '')
  return d.length >= 10 ? d.slice(-10) : ''
}

function empKey(raw: unknown): string {
  const t = clean(raw).replace(/\s+/g, '').toUpperCase()
  if (t.length < 4) return ''
  return t.replace(/^0+/, '') || t
}

function blob(parts: unknown[]): string {
  return parts
    .map((p) => clean(p).toUpperCase())
    .filter(Boolean)
    .join(' ')
}

function isTadaPremier(text: string): boolean {
  const t = text.toUpperCase().replace(/[_-]+/g, ' ')
  if (!/\bPREMIER\s*ENERG/.test(t)) return false
  if (!/\bNAIDUPETT?A?\b/.test(t)) return false
  if (/\bSITH?ARAMPUR|\bPEIPL\b|\bPEPPL\b|\bPEGEPL\b|\bP2\b|\bP3\b|\bP7\b/.test(t)) return false
  return true
}

function isNeolync(text: string): boolean {
  return /NEOLYNC/i.test(text)
}

type Person = { name: string; mobile: string; unit: string; employeeId: string }

function upsert(map: Map<string, Person>, incoming: Person) {
  const name = clean(incoming.name)
  const mobile = mobile10(incoming.mobile)
  const unit = clean(incoming.unit)
  if (isNaVal(name) || name.length < 2) return
  if (isNaVal(unit) && !mobile) return
  if (NA.test(unit)) return
  const row: Person = {
    name,
    mobile,
    unit: isNaVal(unit) ? '' : unit,
    employeeId: isNaVal(incoming.employeeId) ? '' : clean(incoming.employeeId),
  }
  const key = mobile || (empKey(row.employeeId) ? `e:${empKey(row.employeeId)}` : `n:${name.toLowerCase()}|${row.unit.toLowerCase()}`)
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
  })
}

function findBranch(branches: MisBranch[], re: RegExp): MisBranch | undefined {
  return branches.find((b) => re.test(b.name))
}

function addSheet(wb: XLSX.WorkBook, name: string, people: Person[]) {
  const rows: (string | number)[][] = [['Name', 'Mobile', 'Unit / Site']]
  const ready = people
    .filter((p) => p.mobile.length === 10 && !isNaVal(p.name))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
  const seen = new Set<string>()
  for (const p of ready) {
    if (seen.has(p.mobile)) continue
    seen.add(p.mobile)
    rows.push([p.name, p.mobile, p.unit])
  }
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 36 }, { wch: 14 }, { wch: 42 }]
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31))
  return rows.length - 1
}

async function loadBranchPeople(branch: MisBranch, keep: (unit: string) => boolean): Promise<Map<string, Person>> {
  const [docs, guards] = await Promise.all([getGuardDocs(branch.id), getGuards(branch.id)])
  const map = new Map<string, Person>()
  for (const d of docs) {
    if (!guardRecordEligible(d)) continue
    const unit = clean(d.unitName)
    if (!keep(unit)) continue
    upsert(map, { name: d.guardName, mobile: d.mobile, unit, employeeId: d.employeeId })
  }
  for (const g of guards) {
    const unit = clean(g.unitName || g.clientName)
    if (!keep(unit)) continue
    upsert(map, { name: g.name, mobile: g.mobile, unit, employeeId: g.employeeId })
  }
  return map
}

function fillMobile(map: Map<string, Person>, employeeId: string, mobile: string) {
  const emp = empKey(employeeId)
  const mob = mobile10(mobile)
  if (!emp || !mob) return
  for (const [key, prev] of map) {
    if (empKey(prev.employeeId) !== emp) continue
    if (prev.mobile) return
    map.set(key, { ...prev, mobile: mob })
    return
  }
}

export async function buildTadaSuratNeolyncWorkbook(): Promise<{
  buffer: Buffer
  filename: string
  summary: Record<string, unknown>
}> {
  const branches = await getMisReportBranches(true)
  const tada = findBranch(branches, /^tada$/i)
  const surat = findBranch(branches, /^surat$/i)
  const tirupati = findBranch(branches, /^tirupati$/i)
  if (!tada || !surat || !tirupati) {
    throw new Error(
      `Missing branch: Tada=${tada?.name || 'no'} Surat=${surat?.name || 'no'} Tirupati=${tirupati?.name || 'no'}`,
    )
  }

  const [tadaPeople, suratPeople, tirupatiAll] = await Promise.all([
    loadBranchPeople(tada, (u) => !u || isTadaPremier(u)),
    loadBranchPeople(surat, () => true),
    loadBranchPeople(tirupati, (u) => isNeolync(u)),
  ])

  const suratSites = (await getClients(surat.id, { skipRepair: true })).filter((c) => c.active !== false)

  function onSuratSite(text: string): boolean {
    const t = blob([text])
    if (!t) return false
    if (!/\bSURAT\b|\bGUJARAT\b/.test(t)) return false
    const suratBlobs = suratSites.map((c) => blob([c.name, c.location])).filter((s) => s.length >= 10)
    return suratBlobs.some((s) => t.includes(s) || s.includes(t))
  }

  for (const d of (await getDutyDates()).slice(-21)) {
    for (const inc of await getDutyIncidents(d)) {
      const text = blob([inc.client, inc.unit])
      if (isTadaPremier(text)) {
        upsert(tadaPeople, {
          name: inc.guardName,
          mobile: inc.mobile || '',
          unit: clean(inc.unit || inc.client),
          employeeId: inc.employeeId,
        })
      }
      if (isNeolync(text)) {
        upsert(tirupatiAll, {
          name: inc.guardName,
          mobile: inc.mobile || '',
          unit: clean(inc.unit || inc.client),
          employeeId: inc.employeeId,
        })
      }
      if (onSuratSite(text)) {
        upsert(suratPeople, {
          name: inc.guardName,
          mobile: inc.mobile || '',
          unit: clean(inc.unit || inc.client),
          employeeId: inc.employeeId,
        })
      }
    }
  }

  for (const d of (await getAttendanceDates()).slice(-21)) {
    for (const m of await getAttendanceMarks(d)) {
      const text = blob([m.client, m.unit])
      if (isTadaPremier(text)) {
        upsert(tadaPeople, {
          name: m.guardName,
          mobile: m.mobile,
          unit: clean(m.unit || m.client),
          employeeId: m.employeeId,
        })
      }
      if (isNeolync(text)) {
        upsert(tirupatiAll, {
          name: m.guardName,
          mobile: m.mobile,
          unit: clean(m.unit || m.client),
          employeeId: m.employeeId,
        })
      }
      if (onSuratSite(text)) {
        upsert(suratPeople, {
          name: m.guardName,
          mobile: m.mobile,
          unit: clean(m.unit || m.client),
          employeeId: m.employeeId,
        })
      }
    }
  }

  try {
    const cfg = work360Config()
    if (cfg) {
      const dir = await loadWork360EmployeeDirectory(cfg, [])
      for (const [emp, hit] of dir) {
        fillMobile(tadaPeople, emp, hit.mobile)
        fillMobile(suratPeople, emp, hit.mobile)
        fillMobile(tirupatiAll, emp, hit.mobile)
      }
    }
  } catch {
    /* optional */
  }

  const wb = XLSX.utils.book_new()
  const tadaN = addSheet(wb, 'Tada', [...tadaPeople.values()])
  const suratN = addSheet(wb, 'Surat', [...suratPeople.values()])
  const neoN = addSheet(wb, 'Neolync Tirupati', [...tirupatiAll.values()])

  const all: (string | number)[][] = [['List', 'Name', 'Mobile', 'Unit / Site']]
  for (const [label, map] of [
    ['Tada', tadaPeople],
    ['Surat', suratPeople],
    ['Neolync Tirupati', tirupatiAll],
  ] as const) {
    const people = [...map.values()]
      .filter((p) => p.mobile.length === 10)
      .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
    const seen = new Set<string>()
    for (const p of people) {
      if (seen.has(p.mobile)) continue
      seen.add(p.mobile)
      all.push([label, p.name, p.mobile, p.unit])
    }
  }
  const allWs = XLSX.utils.aoa_to_sheet(all)
  allWs['!cols'] = [{ wch: 20 }, { wch: 36 }, { wch: 14 }, { wch: 42 }]
  XLSX.utils.book_append_sheet(wb, allWs, 'All')

  const buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer)
  return {
    buffer,
    filename: 'Tada-Surat-Neolync-Name-Mobile.xlsx',
    summary: {
      tada: { sites: 1, withMobile: tadaN },
      surat: { sites: suratSites.length, withMobile: suratN },
      neolyncTirupati: { withMobile: neoN },
    },
  }
}

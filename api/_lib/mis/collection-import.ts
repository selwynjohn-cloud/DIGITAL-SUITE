/**
 * Saturday collection / outstanding imports.
 *
 * CC BEFORE [date].xlsx — weekly budget (In Lakhs), Mon–Sat collected, branch overdue total.
 * OST BILLS [date].xls — client-wise outstanding statement (branch totals for DSO tracker).
 */
import * as XLSX from 'xlsx'
import { misBranchGroupKey } from './branch-dedupe.js'
import type { MisBranch, MisCollection } from './store.js'
import { nid, num } from './store.js'

export type CollectionSheetRow = {
  zone: string
  groupKey: string
  budget: number
  outstanding: number
  mon: number
  tue: number
  wed: number
  thu: number
  fri: number
  sat: number
  presentPct: number
}

export type OutstandingBranchRow = {
  zone: string
  groupKey: string
  outstanding: number
  monthlyBilling: number
  clients: number
}

/** Map CC / OST zone labels to the same group keys used in branch masters. */
export function collectionZoneGroupKey(zone: string): string {
  const raw = String(zone ?? '').trim().toUpperCase()
  if (!raw || raw === 'TOTAL') return ''
  const cleaned = raw
    .replace(/:.*$/, '')
    .replace(/\s+/g, ' ')
    .trim()

  const alias: Record<string, string> = {
    'HYD ZONE A': 'HYDERABAD-A',
    'HYD ZONE B': 'HYDERABAD-B',
    'K RAHEJA MIND SPACE': 'HI-TECH CITY',
    'K RAHEJA': 'HI-TECH CITY',
    'MIND SPACE': 'HI-TECH CITY',
    'TIRUPATI': 'TIRUPATHI',
    'NELLORE': 'NELLORE-TADA',
    'VIJAYAWADA': 'VIJAYAWADA',
    'VISAKHAPATNAM': 'VIZAG-KAKINADA',
    'VIZAG': 'VIZAG-KAKINADA',
    'PUDUCHERRY': 'TN-PONDICHERRY',
    'PONDICHERRY': 'TN-PONDICHERRY',
    'TAMIL NADU': 'TN-PONDICHERRY',
    'TAMILNADU': 'TN-PONDICHERRY',
    'KERALA': 'KERALA',
    'KARNATAKA': 'KARNATAKA',
    'MAHARASHTRA': 'MUMBAI-SURAT',
    'MUMBAI': 'MUMBAI-SURAT',
    'GUJARAT': 'MUMBAI-SURAT',
    'GUJARAT BRANCH': 'MUMBAI-SURAT',
    'BANKING': 'BANKING',
  }

  if (alias[cleaned]) return alias[cleaned]
  if (/MADHYA\s+PRADESH/i.test(cleaned)) return 'BHOPAL-MP'

  const viaBranch = misBranchGroupKey(cleaned)
  if (viaBranch && viaBranch !== cleaned) return viaBranch
  return viaBranch || cleaned
}

export function findBranchForGroupKey(branches: MisBranch[], groupKey: string): MisBranch | null {
  if (!groupKey || groupKey === 'BANKING') return null
  const active = branches.filter((b) => b.active !== false)
  for (const b of active) {
    if (misBranchGroupKey(b.name) === groupKey) return b
  }
  return null
}

function cellNum(v: unknown): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(String(v).replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function sheetRows(buf: Buffer): unknown[][] {
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: false })
  const name = wb.SheetNames[0]
  if (!name) return []
  const sh = wb.Sheets[name]
  return XLSX.utils.sheet_to_json<unknown[]>(sh, { header: 1, defval: null, raw: true }) as unknown[][]
}

/** Parse "CC BEFORE …" weekly collection commitment workbook. */
export function parseCollectionCommitmentSheet(buf: Buffer): CollectionSheetRow[] {
  const rows = sheetRows(buf)
  let header = -1
  for (let i = 0; i < rows.length; i++) {
    const line = (rows[i] || []).map((c) => String(c ?? '').toUpperCase()).join('|')
    if (line.includes('ZONE') && line.includes('LAKH') && (line.includes('OVERDUE') || line.includes('BRANCH'))) {
      header = i
      break
    }
  }
  if (header < 0) return []

  const hdr = (rows[header] || []).map((c) => String(c ?? '').trim().toUpperCase())
  const zoneIdx = hdr.findIndex((h) => h.includes('ZONE') || h === 'ZONE')
  const pctIdx = hdr.findIndex((h) => h.includes('PRESENT') || h.includes('PERCENT'))
  const monIdx = hdr.findIndex((h) => h === 'MON')
  const budgetIdx = hdr.findIndex((h) => h.includes('IN LAKH') || h === 'IN LAKHS')
  const outIdx = hdr.findIndex((h) => h.includes('OVERDUE') || h.includes('OUTSTANDING'))

  const out: CollectionSheetRow[] = []
  for (let i = header + 1; i < rows.length; i++) {
    const r = rows[i] || []
    const zone = String(r[zoneIdx >= 0 ? zoneIdx : 1] ?? '').trim()
    if (!zone || /^total$/i.test(zone)) continue
    const groupKey = collectionZoneGroupKey(zone)
    if (!groupKey || groupKey === 'BANKING') continue
    out.push({
      zone,
      groupKey,
      presentPct: pctIdx >= 0 ? cellNum(r[pctIdx]) : 0,
      mon: monIdx >= 0 ? cellNum(r[monIdx]) : 0,
      tue: monIdx >= 0 ? cellNum(r[monIdx + 1]) : 0,
      wed: monIdx >= 0 ? cellNum(r[monIdx + 2]) : 0,
      thu: monIdx >= 0 ? cellNum(r[monIdx + 3]) : 0,
      fri: monIdx >= 0 ? cellNum(r[monIdx + 4]) : 0,
      sat: monIdx >= 0 ? cellNum(r[monIdx + 5]) : 0,
      budget: budgetIdx >= 0 ? cellNum(r[budgetIdx]) : 0,
      outstanding: outIdx >= 0 ? cellNum(r[outIdx]) : 0,
    })
  }
  return out
}

function mergeSheetRows(rows: CollectionSheetRow[]): CollectionSheetRow[] {
  const by: Record<string, CollectionSheetRow> = {}
  for (const r of rows) {
    const cur = by[r.groupKey]
    if (!cur) {
      by[r.groupKey] = { ...r }
      continue
    }
    cur.budget += r.budget
    cur.outstanding += r.outstanding
    cur.mon += r.mon
    cur.tue += r.tue
    cur.wed += r.wed
    cur.thu += r.thu
    cur.fri += r.fri
    cur.sat += r.sat
    cur.zone = `${cur.zone} + ${r.zone}`
  }
  return Object.values(by)
}

export function applyCollectionSheetImport(
  weekStart: string,
  branches: MisBranch[],
  existing: MisCollection[],
  sheetRows: CollectionSheetRow[],
  sourceLabel: string,
): { list: MisCollection[]; updated: number; unmatched: string[]; merged: CollectionSheetRow[] } {
  const merged = mergeSheetRows(sheetRows)
  const byId: Record<string, MisCollection> = {}
  for (const c of existing) byId[c.branchId] = c

  let updated = 0
  const unmatched: string[] = []

  for (const row of merged) {
    const br = findBranchForGroupKey(branches, row.groupKey)
    if (!br) {
      unmatched.push(row.zone)
      continue
    }
    const cur = byId[br.id] || {
      id: nid('col'),
      branchId: br.id,
      weekStart,
      monthlyBilling: 0,
      budget: 0,
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      outstanding: 0,
      remarks: '',
    }
    cur.budget = row.budget || cur.budget
    cur.outstanding = row.outstanding || cur.outstanding
    if (row.mon) cur.mon = row.mon
    if (row.tue) cur.tue = row.tue
    if (row.wed) cur.wed = row.wed
    if (row.thu) cur.thu = row.thu
    if (row.fri) cur.fri = row.fri
    if (row.sat) cur.sat = row.sat
    cur.remarks = `Updated from ${sourceLabel}`
    byId[br.id] = cur
    updated++
  }

  return { list: Object.values(byId), updated, unmatched, merged }
}

// ---- Outstanding statement (OST BILLS) ----------------------------------------

function sumClientRange(
  sheet: XLSX.WorkSheet,
  r0: number,
  r1: number,
  zoneFilter?: string,
): { outstanding: number; monthlyBilling: number; clients: number } {
  const ref = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  let outstanding = 0
  let monthlyBilling = 0
  let clients = 0
  for (let r = r0; r < r1; r++) {
    const client = String(sheet[XLSX.utils.encode_cell({ r, c: 3 })]?.v ?? '').trim()
    if (!client || /branch/i.test(client)) continue
    if (client === 'Collected' || client === 'Collected %' || client.startsWith('less')) continue
    if (zoneFilter != null) {
      const z = String(sheet[XLSX.utils.encode_cell({ r, c: 1 })]?.v ?? '').trim().toUpperCase()
      if (z !== zoneFilter) continue
    }
    const total = cellNum(sheet[XLSX.utils.encode_cell({ r, c: 13 })]?.v)
    const june = cellNum(sheet[XLSX.utils.encode_cell({ r, c: 4 })]?.v)
    if (total <= 0) continue
    outstanding += total
    monthlyBilling += june
    clients++
  }
  return { outstanding: outstanding / 100, monthlyBilling: monthlyBilling / 100, clients }
}

function branchSections(sheet: XLSX.WorkSheet): { name: string; start: number; end: number }[] {
  const ref = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  const breaks: { name: string; row: number }[] = []
  for (let r = 0; r <= ref.e.r; r++) {
    const client = String(sheet[XLSX.utils.encode_cell({ r, c: 3 })]?.v ?? '').trim()
    if (client && /branch/i.test(client)) {
      breaks.push({ name: client.replace(/\s*:?\s*$/i, '').trim(), row: r })
    }
  }
  const out: { name: string; start: number; end: number }[] = []
  for (let i = 0; i < breaks.length; i++) {
    out.push({
      name: breaks[i].name,
      start: breaks[i].row + 1,
      end: i + 1 < breaks.length ? breaks[i + 1].row : ref.e.r + 1,
    })
  }
  return out
}

const OST_BRANCH_MAP: Record<string, string> = {
  'TIRUPATI BRANCH': 'TIRUPATHI',
  'NELLORE BRANCH': 'NELLORE-TADA',
  'VIJAYAWADA BRANCH': 'VIJAYAWADA',
  'VISAKHAPATNAM BRANCH': 'VIZAG-KAKINADA',
  'TN BRANCH': 'TN-PONDICHERRY',
  'KA BRANCH': 'KARNATAKA',
  'MAHARASHTRA BRANCH': 'MUMBAI-SURAT',
  'GUJARAT BRANCH': 'MUMBAI-SURAT',
  'MADHYA PRADESH BRANCH': 'BHOPAL-MP',
  'KERALA': 'KERALA',
}

function ostSectionKey(name: string): string {
  const u = name.toUpperCase().replace(/\s+/g, ' ').trim()
  if (OST_BRANCH_MAP[u]) return OST_BRANCH_MAP[u]
  return collectionZoneGroupKey(name)
}

/** Parse OST BILLS outstanding workbook — branch totals in lakhs (Rs thousands ÷ 100). */
export function parseOutstandingStatement(buf: Buffer): OutstandingBranchRow[] {
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: false })
  const acc: Record<string, OutstandingBranchRow> = {}

  // Hyderabad A / B / Hi-Tech from A-ZONE sheet (zone column)
  const az = wb.Sheets['A-ZONE '] || wb.Sheets['A-ZONE']
  if (az) {
    for (const [zone, key] of [
      ['A', 'HYDERABAD-A'],
      ['B', 'HYDERABAD-B'],
      ['KRC', 'HI-TECH CITY'],
    ] as const) {
      const s = sumClientRange(az, 4, 195, zone)
      if (s.outstanding > 0) {
        acc[key] = { zone: `HYD ZONE ${zone}`, groupKey: key, outstanding: s.outstanding, monthlyBilling: s.monthlyBilling, clients: s.clients }
      }
    }
  }

  const ap = wb.Sheets.AP
  if (ap) {
    for (const sec of branchSections(ap)) {
      const key = ostSectionKey(sec.name)
      if (!key) continue
      const s = sumClientRange(ap, sec.start, sec.end)
      const cur = acc[key]
      if (cur) {
        cur.outstanding += s.outstanding
        cur.monthlyBilling += s.monthlyBilling
        cur.clients += s.clients
        cur.zone += ` + ${sec.name}`
      } else {
        acc[key] = { zone: sec.name, groupKey: key, ...s }
      }
    }
  }

  const tn = wb.Sheets['TN,KA&PY,KL']
  if (tn) {
    for (const sec of branchSections(tn)) {
      const key = ostSectionKey(sec.name)
      if (!key) continue
      const s = sumClientRange(tn, sec.start, sec.end)
      const cur = acc[key]
      if (cur) {
        cur.outstanding += s.outstanding
        cur.monthlyBilling += s.monthlyBilling
        cur.clients += s.clients
      } else {
        acc[key] = { zone: sec.name, groupKey: key, ...s }
      }
    }
  }

  const mp = wb.Sheets['MP&MH']
  if (mp) {
    for (const sec of branchSections(mp)) {
      const key = ostSectionKey(sec.name)
      if (!key) continue
      const s = sumClientRange(mp, sec.start, sec.end)
      const cur = acc[key]
      if (cur) {
        cur.outstanding += s.outstanding
        cur.monthlyBilling += s.monthlyBilling
        cur.clients += s.clients
      } else {
        acc[key] = { zone: sec.name, groupKey: key, ...s }
      }
    }
  }

  return Object.values(acc)
}

export function applyOutstandingImport(
  weekStart: string,
  branches: MisBranch[],
  existing: MisCollection[],
  ostRows: OutstandingBranchRow[],
  sourceLabel: string,
): { list: MisCollection[]; updated: number; unmatched: string[] } {
  const byId: Record<string, MisCollection> = {}
  for (const c of existing) byId[c.branchId] = c

  let updated = 0
  const unmatched: string[] = []

  for (const row of ostRows) {
    const br = findBranchForGroupKey(branches, row.groupKey)
    if (!br) {
      unmatched.push(row.zone)
      continue
    }
    const cur = byId[br.id] || {
      id: nid('col'),
      branchId: br.id,
      weekStart,
      monthlyBilling: 0,
      budget: 0,
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      outstanding: 0,
      remarks: '',
    }
    cur.outstanding = row.outstanding
    if (row.monthlyBilling) cur.monthlyBilling = row.monthlyBilling
    cur.remarks = `Outstanding from ${sourceLabel}`
    byId[br.id] = cur
    updated++
  }

  return { list: Object.values(byId), updated, unmatched }
}

export function decodeUploadBase64(data: string): Buffer {
  const raw = String(data ?? '').trim()
  const b64 = raw.includes(',') ? raw.split(',').pop()! : raw
  return Buffer.from(b64, 'base64')
}

/**
 * Saturday collection / outstanding imports.
 *
 * CC BEFORE [date].xlsx — weekly budget (In Lakhs), Mon–Sat collected, branch overdue total.
 * OST BILLS [date].xls — client-wise outstanding statement (branch totals for DSO tracker).
 */
import * as XLSX from 'xlsx'
import { normalizeToLacs, roundMoney2, parseMoneyNumber } from '../inr-money.js'
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
  /** Current-month collected (lakhs) from Friday OST — bill minus current-month arrears. */
  collected?: number
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
    'TIRUPATI': 'TIRUPATI',
    'NELLORE': 'NELLORE',
    'TADA': 'TADA',
    'VIJAYAWADA': 'VIJAYAWADA',
    'VISAKHAPATNAM': 'VISAKHAPATNAM',
    'VIZAG': 'VISAKHAPATNAM',
    'KAKINADA': 'KAKINADA',
    'PUDUCHERRY': 'PUDUCHERRY',
    'PONDICHERRY': 'PUDUCHERRY',
    'TAMIL NADU': 'CHENNAI',
    'TAMILNADU': 'CHENNAI',
    'KERALA': 'KOCHI',
    'KARNATAKA': 'BANGALORE',
    'MAHARASHTRA': 'MUMBAI',
    'MUMBAI': 'MUMBAI',
    'GUJARAT': 'SURAT',
    'GUJARAT BRANCH': 'SURAT',
    'SURAT': 'SURAT',
    'AHMEDABAD': 'SURAT',
    'CHENNAI': 'CHENNAI',
    'TAMIL NADU & PONDICHERRY': 'CHENNAI',
    'TN & PONDICHERRY': 'CHENNAI',
    'TN': 'CHENNAI',
    'PO': 'PUDUCHERRY',
    'KOCHI': 'KOCHI',
    'BANGALORE': 'BANGALORE',
    'BENGALURU': 'BANGALORE',
    'BHOPAL': 'BHOPAL',
    'MADHYA PRADESH': 'BHOPAL',
    'LUCKNOW': 'LUCKNOW',
    'KRC': 'HI-TECH CITY',
    'K RAHEJA MINDSPACE': 'HI-TECH CITY',
    'RAHEJA MIND SPACE': 'HI-TECH CITY',
    'HI TECH CITY': 'HI-TECH CITY',
    'HITECH': 'HI-TECH CITY',
    'HYDERABAD A': 'HYDERABAD-A',
    'HYDERABAD B': 'HYDERABAD-B',
    'HYD A': 'HYDERABAD-A',
    'HYD B': 'HYDERABAD-B',
    'VISAKHAPATNAM & KAKINADA': 'VISAKHAPATNAM',
    'NELLORE & TADA': 'NELLORE',
    'TIRUPATI & TADIPATRI': 'TIRUPATI',
    'TIRUPATHI': 'TIRUPATI',
    'TADIPATRI': 'TADIPATRI',
    'BANKING': 'CORPORATE-OFFICE',
    'CORPORATE OFFICE': 'CORPORATE-OFFICE',
    'CORPORATE-OFFICE': 'CORPORATE-OFFICE',
  }

  if (alias[cleaned]) return alias[cleaned]
  if (/MADHYA\s+PRADESH/i.test(cleaned)) return 'BHOPAL'

  const viaBranch = misBranchGroupKey(cleaned)
  if (viaBranch && viaBranch !== cleaned) return viaBranch
  return viaBranch || cleaned
}

export function findCorporateOfficeBranch(branches: MisBranch[]): MisBranch | null {
  const active = branches.filter((b) => b.active !== false)
  for (const b of active) {
    if (/corporate\s*office/i.test(b.name)) return b
  }
  return null
}

export function findBranchForGroupKey(branches: MisBranch[], groupKey: string): MisBranch | null {
  if (!groupKey) return null
  if (groupKey === 'BANKING' || groupKey === 'CORPORATE-OFFICE') {
    return findCorporateOfficeBranch(branches)
  }
  const active = branches.filter((b) => b.active !== false)
  for (const b of active) {
    if (misBranchGroupKey(b.name) === groupKey) return b
  }
  const keyNorm = groupKey.replace(/-/g, ' ').trim()
  for (const b of active) {
    const nameNorm = b.name.trim().toUpperCase().replace(/-/g, ' ')
    if (nameNorm === keyNorm || nameNorm.includes(keyNorm) || keyNorm.includes(nameNorm)) return b
  }
  const hint = GROUP_KEY_BRANCH_HINTS[groupKey]
  if (hint) {
    for (const b of active) {
      if (hint.test(b.name)) return b
    }
  }
  return null
}

const GROUP_KEY_BRANCH_HINTS: Record<string, RegExp> = {
  CHENNAI: /\bchennai\b|tamil/i,
  PUDUCHERRY: /pondicherry|puducherry/i,
  'HYDERABAD-A': /hyderabad\s*-?\s*a\b/i,
  'HYDERABAD-B': /hyderabad\s*-?\s*b\b/i,
  'HI-TECH CITY': /hi-?tech|mind\s*space|raheja/i,
  NELLORE: /\bnellore\b/i,
  TADA: /\btada\b/i,
  TIRUPATI: /\btirupati|\btirupathi\b/i,
  TADIPATRI: /\btadipatri\b/i,
  VISAKHAPATNAM: /visakhapatnam|\bvizag\b/i,
  KAKINADA: /\bkakinada\b/i,
  MUMBAI: /\bmumbai\b|maharashtra/i,
  SURAT: /\bsurat\b|gujarat/i,
  BANGALORE: /bangalore|bengaluru|karnataka/i,
  KOCHI: /kochi|kerala/i,
  BHOPAL: /bhopal|madhya/i,
}

function moneyLacs(v: unknown): number {
  return collectionMoneyLacs(v)
}

/** CC sheet Mon–Sat collected columns are in ₹ thousands (same as OST) → lakhs. */
function ccDailyCollectedToLacs(v: unknown): number {
  const n = cellNum(v)
  if (n === 0) return 0
  return roundMoney2(n / 100)
}

/** Fix rows saved when lakhs ≥1000 were wrongly divided by 1,00,000 (old threshold bug). */
function repairCorruptedCollectionRow(row: MisCollection): MisCollection {
  let { monthlyBilling, outstanding, mon, tue, wed, thu, fri, sat } = row
  if (monthlyBilling > 0 && monthlyBilling < 0.05) {
    monthlyBilling = roundMoney2(monthlyBilling * 100_000)
    if (outstanding > 0 && outstanding < 50) {
      outstanding = roundMoney2(outstanding * 100_000)
    }
  } else if (outstanding > 0 && outstanding < 0.05 && monthlyBilling > 50) {
    outstanding = roundMoney2(outstanding * 100_000)
  }

  const dayVals = [mon, tue, wed, thu, fri, sat].map((d) => Number(d) || 0)
  const daySum = dayVals.reduce((s, d) => s + d, 0)
  const billing = Number(monthlyBilling) || 0
  const budget = Number(row.budget) || 0

  /** CC Mon–Sat often uploaded in ₹ thousands but stored as lakhs → achievement 999%+. */
  const scaleDaysDown = daySum > 0 && budget > 0 && daySum > budget * 3
  /** Legacy bug: week total equals monthly billing (105 L collected vs 6 L budget). */
  const billingMatchOvercollect =
    daySum > 0 &&
    billing > 0 &&
    budget > 0 &&
    daySum > budget * 5 &&
    Math.abs(daySum - billing) / billing <= 0.05

  if (scaleDaysDown || billingMatchOvercollect) {
    mon = roundMoney2(mon / 100)
    tue = roundMoney2(tue / 100)
    wed = roundMoney2(wed / 100)
    thu = roundMoney2(thu / 100)
    fri = roundMoney2(fri / 100)
    sat = roundMoney2(sat / 100)
  }

  return { ...row, monthlyBilling, outstanding, mon, tue, wed, thu, fri, sat }
}

/** Normalize all money fields on a collection row (lakhs internally). */
export function normalizeCollectionRow(row: MisCollection): MisCollection {
  const repaired = repairCorruptedCollectionRow(row)
  return {
    ...repaired,
    monthlyBilling: moneyLacs(repaired.monthlyBilling),
    budget: moneyLacs(repaired.budget),
    mon: moneyLacs(repaired.mon),
    tue: moneyLacs(repaired.tue),
    wed: moneyLacs(repaired.wed),
    thu: moneyLacs(repaired.thu),
    fri: moneyLacs(repaired.fri),
    sat: moneyLacs(repaired.sat),
    outstanding: moneyLacs(repaired.outstanding),
    ostCollected: moneyLacs(repaired.ostCollected),
  }
}

/** Ensure every active branch has a collection row for the week (keeps finance uploads visible everywhere). */
export function ensureAllBranchCollectionRows(
  weekStart: string,
  branches: MisBranch[],
  list: MisCollection[],
): MisCollection[] {
  const byId: Record<string, MisCollection> = {}
  for (const c of list) byId[c.branchId] = normalizeCollectionRow(c)
  for (const b of branches) {
    if (b.active === false) continue
    if (!byId[b.id]) {
      byId[b.id] = {
        id: nid('col'),
        branchId: b.id,
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
    }
  }
  return Object.values(byId)
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
    if (!groupKey) continue
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

function applyCorporateOfficeBanking(
  byId: Record<string, MisCollection>,
  branches: MisBranch[],
  weekStart: string,
  banking: { outstanding: number; budget?: number; monthlyBilling?: number },
  sourceLabel: string,
) {
  if (banking.outstanding <= 0 && (banking.budget || 0) <= 0 && (banking.monthlyBilling || 0) <= 0) return
  const br = findCorporateOfficeBranch(branches)
  if (!br) return
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
  cur.outstanding = moneyLacs(cur.outstanding) + moneyLacs(banking.outstanding)
  if (banking.budget) cur.budget = moneyLacs(cur.budget) + moneyLacs(banking.budget)
  if (banking.monthlyBilling) cur.monthlyBilling = moneyLacs(cur.monthlyBilling)
  cur.remarks = `Banking billing/outstanding (Corporate Office) — ${sourceLabel}`
  byId[br.id] = normalizeCollectionRow(cur)
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
    if (row.groupKey === 'BANKING' || row.groupKey === 'CORPORATE-OFFICE') continue
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
    const out = moneyLacs(row.outstanding)
    const bud = moneyLacs(row.budget)
    if (out > 0) cur.outstanding = out
    if (bud > 0) cur.budget = bud
    const daySum =
      ccDailyCollectedToLacs(row.mon) +
      ccDailyCollectedToLacs(row.tue) +
      ccDailyCollectedToLacs(row.wed) +
      ccDailyCollectedToLacs(row.thu) +
      ccDailyCollectedToLacs(row.fri) +
      ccDailyCollectedToLacs(row.sat)
    if (daySum > 0) {
      cur.mon = ccDailyCollectedToLacs(row.mon)
      cur.tue = ccDailyCollectedToLacs(row.tue)
      cur.wed = ccDailyCollectedToLacs(row.wed)
      cur.thu = ccDailyCollectedToLacs(row.thu)
      cur.fri = ccDailyCollectedToLacs(row.fri)
      cur.sat = ccDailyCollectedToLacs(row.sat)
    }
    cur.remarks = `Updated from ${sourceLabel}`
    byId[br.id] = normalizeCollectionRow(cur)
    updated++
  }

  return { list: ensureAllBranchCollectionRows(weekStart, branches, Object.values(byId)), updated, unmatched, merged }
}

// ---- Outstanding statement (OST BILLS) ----------------------------------------

const MONTH_TOKENS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

/** Billing month for OST — July'26 bills are on the Friday file (override via MIS_OST_BILLING_MONTH). */
export function ostBillingMonthKey(): string {
  return (process.env.MIS_OST_BILLING_MONTH?.trim() || '2026-07').slice(0, 7)
}

/** Latest Friday OST BILLS footer (14.08.26 July sheet) — used until the next Accounts mail is uploaded. */
export const LATEST_OST_FOOTER = {
  asOn: '2026-08-14',
  billingMonth: "July'26",
  billingK: 339338.4,
  collectedK: 64342.5,
  outstandingK: 1125347.41,
  recoveryPct: 18.96,
  source: 'OST BILLS 14.08.26.xls',
}

/** Parse OST BILLS 14.08.26.xls → 2026-08-14 */
export function ostAsOnFromSource(source?: string, fallback = LATEST_OST_FOOTER.asOn): string {
  const m = String(source || '').match(/(\d{2})\.(\d{2})\.(\d{2})/)
  if (!m) return fallback
  return `20${m[3]}-${m[2]}-${m[1]}`
}

export function ostBillingMonthLabel(): string {
  const key = ostBillingMonthKey()
  const [y, m] = key.split('-').map(Number)
  if (!y || !m) return "June'26"
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[m - 1] || 'Jun'}'${String(y).slice(-2)}`
}

/**
 * Current-month billing is collected from the 10th of the next month
 * to the 10th of the month after that (e.g. July bills: 10 Aug – 10 Sep).
 */
export function ostBillingCollectionWindow(billingYm = ostBillingMonthKey()): { from: string; to: string } {
  const [y, m] = String(billingYm || '').split('-').map(Number)
  if (!y || !m) return { from: '', to: '' }
  const from = new Date(y, m, 10)
  const to = new Date(y, m + 1, 10)
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { from: iso(from), to: iso(to) }
}

type OstMoney = { outstanding: number; monthlyBilling: number; clients: number }

type OstLayout = {
  headerRow: number
  dataStartRow: number
  clientCol: number
  zoneCol: number
  billingCol: number
  totalCol: number
}

function isBankingClient(name: string): boolean {
  const u = String(name ?? '').trim().toUpperCase()
  if (!u) return false
  return /CANARA BANK|BANK - AP|BANK - TS|STATE BANK OF INDIA|HDFC BANK|SBI\s-/i.test(u)
}

function isBankingRow(zone: string, client: string): boolean {
  return String(zone ?? '').trim().toLowerCase() === 'banking' || isBankingClient(client)
}

function isOstFooterLabel(value: string): boolean {
  const c = String(value ?? '').trim()
  if (!c) return false
  return /^collected|^total|^grand|^less|^over due/i.test(c)
}

/** @deprecated use isOstFooterLabel — empty client rows are section subtotals, not end-of-sheet. */
function isOstDataEnd(client: string): boolean {
  return isOstFooterLabel(client)
}

/** Money already stored in ₹ Lakhs — do not treat 1,000–50,000 as full rupees. */
function collectionMoneyLacs(v: unknown): number {
  const n = parseMoneyNumber(v)
  if (n == null) return num(v)
  if (Math.abs(n) < 50_000) return roundMoney2(n)
  return normalizeToLacs(v) ?? num(v)
}

function pickBillingColumn(monthCols: { col: number; label: string; idx: number }[]): {
  col: number
  label: string
} {
  if (!monthCols.length) return { col: 4, label: ostBillingMonthLabel() }
  const key = ostBillingMonthKey()
  const wantYear = key.slice(0, 4)
  const wantMonth = Number(key.slice(5, 7)) - 1
  const exact = monthCols.find(
    (m) =>
      m.idx === wantMonth &&
      (m.label.includes(wantYear) || m.label.includes(wantYear.slice(-2)) || /['']?\s*26/.test(m.label)),
  )
  if (exact) return { col: exact.col, label: exact.label }
  const monthOnly = monthCols.find((m) => m.idx === wantMonth)
  if (monthOnly) return { col: monthOnly.col, label: monthOnly.label }
  const jun26 = monthCols.find((m) => /JUN/i.test(m.label) && /26/.test(m.label))
  if (jun26) return { col: jun26.col, label: jun26.label }
  const billAmount = monthCols.find((m) => /BILL/i.test(m.label))
  if (billAmount) return { col: billAmount.col, label: billAmount.label }
  const fallback = monthCols.find((m) => m.idx === 5) || monthCols.sort((a, b) => b.idx - a.idx)[0]
  return { col: fallback.col, label: fallback.label }
}

/** Detect client / zone / billing / total columns from OST sheet headers. */
function detectOstLayout(sheet: XLSX.WorkSheet): OstLayout | null {
  const ref = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  for (let r = 0; r <= Math.min(6, ref.e.r); r++) {
    let clientCol = -1
    let zoneCol = -1
    let billingCol = -1
    let totalCol = -1
    const monthCols: { col: number; label: string; idx: number }[] = []
    for (let c = 0; c <= Math.min(20, ref.e.c); c++) {
      const raw = String(sheet[XLSX.utils.encode_cell({ r, c })]?.v ?? '').trim()
      const u = raw.toUpperCase()
      if (!u) continue
      if (/CLIENT|PARTY|NAME OF CLIENT/.test(u) && clientCol < 0) clientCol = c
      if (/^ZONE$/.test(u.replace(/\s+$/, '')) || u === 'ZONE ') zoneCol = c
      if (/TOTAL|OUTSTANDING|BALANCE|DUE/.test(u) && c >= 8) totalCol = c
      for (let mi = 0; mi < MONTH_TOKENS.length; mi++) {
        if (u.includes(MONTH_TOKENS[mi]) || u.includes(`${MONTH_TOKENS[mi]}-`) || u.includes(`${MONTH_TOKENS[mi]} `)) {
          monthCols.push({ col: c, label: raw, idx: mi })
        }
      }
      if (/BILL/i.test(u) && billingCol < 0) billingCol = c
    }
    if (clientCol >= 0 && (billingCol >= 0 || monthCols.length)) {
      if (billingCol < 0 && monthCols.length) billingCol = pickBillingColumn(monthCols).col
      if (totalCol < 0) totalCol = billingCol >= 0 ? billingCol + 9 : 13
      return {
        headerRow: r,
        dataStartRow: r + 2,
        clientCol,
        zoneCol,
        billingCol: billingCol >= 0 ? billingCol : 4,
        totalCol,
      }
    }
  }
  return null
}

/**
 * Outstanding for DSO = last "Total Amount" column (all months due).
 * Do NOT use the June'26 aging bucket (billingCol+1) — that is only current-month arrears.
 */
function ostOutstandingCol(sheet: XLSX.WorkSheet, layout: OstLayout): number {
  const ref = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  for (let c = Math.min(20, ref.e.c); c >= 0; c--) {
    const u = String(sheet[XLSX.utils.encode_cell({ r: layout.headerRow, c })]?.v ?? '')
      .trim()
      .toUpperCase()
    if (/^TOTAL\s*AMOUNT$|^TOTAL$|TOTAL\s*OUTSTAND|GRAND\s*TOTAL/.test(u)) return c
  }
  if (layout.totalCol >= 0) return layout.totalCol
  return layout.billingCol >= 0 ? layout.billingCol + 9 : 13
}

/** Calendar days in YYYY-MM (e.g. 2026-06 → 30). */
export function daysInBillingMonth(ym = ostBillingMonthKey()): number {
  const [y, m] = String(ym || '').split('-').map(Number)
  if (!y || !m || m < 1 || m > 12) return 30
  return new Date(y, m, 0).getDate()
}

/**
 * DSO = (Total Outstanding ÷ Latest Monthly Billing) × days in billing month.
 * Example: (1124940.9 / 373016.7) × 30 = 90.47
 */
export function collectionDso(outstanding: number, monthlyBilling: number, billingYm?: string): number {
  if (!(monthlyBilling > 0)) return outstanding > 0 ? 999 : 0
  const days = daysInBillingMonth(billingYm || ostBillingMonthKey())
  return Math.round((outstanding / monthlyBilling) * days * 100) / 100
}

function sumOstRange(
  sheet: XLSX.WorkSheet,
  r0: number,
  r1: number,
  opts?: { zoneFilter?: string; excludeBanking?: boolean; bankingOnly?: boolean },
): OstMoney {
  const layout = detectOstLayout(sheet)
  if (!layout) return { outstanding: 0, monthlyBilling: 0, clients: 0 }
  const outCol = ostOutstandingCol(sheet, layout)
  let outstanding = 0
  let monthlyBilling = 0
  let clients = 0
  const sectionSubtotals: OstMoney[] = []

  for (let r = r0; r < r1; r++) {
    const client = String(sheet[XLSX.utils.encode_cell({ r, c: layout.clientCol })]?.v ?? '').trim()
    const billRaw = sheet[XLSX.utils.encode_cell({ r, c: layout.billingCol })]?.v
    const billLabel = String(billRaw ?? '').trim()
    const total = cellNum(sheet[XLSX.utils.encode_cell({ r, c: outCol })]?.v)
    const bill = cellNum(billRaw)

    if (isOstFooterLabel(client) || isOstFooterLabel(billLabel)) continue
    if (/branch\s*:?\s*$/i.test(client)) continue

    /** Section subtotal row (e.g. MP sheet: Madhya Pradesh 147925.9 + Bhopal 34661.9). */
    if (!client && bill > 0 && !opts?.zoneFilter && !opts?.bankingOnly) {
      sectionSubtotals.push({ outstanding: total, monthlyBilling: bill, clients: 0 })
      continue
    }
    if (!client) continue

    const zone =
      layout.zoneCol >= 0 ? String(sheet[XLSX.utils.encode_cell({ r, c: layout.zoneCol })]?.v ?? '').trim() : ''
    const banking = isBankingRow(zone, client)
    if (opts?.bankingOnly) {
      if (!banking) continue
    } else if (opts?.excludeBanking && banking) {
      continue
    }
    if (opts?.zoneFilter && zone.toUpperCase() !== opts.zoneFilter.toUpperCase()) continue
    if (total <= 0 && bill <= 0) continue
    outstanding += total
    monthlyBilling += bill
    clients++
  }

  if (!opts?.zoneFilter && !opts?.bankingOnly && sectionSubtotals.length > 1) {
    outstanding = sectionSubtotals.reduce((s, x) => s + x.outstanding, 0)
    monthlyBilling = sectionSubtotals.reduce((s, x) => s + x.monthlyBilling, 0)
    clients = sectionSubtotals.length
  }

  return { outstanding: outstanding / 100, monthlyBilling: monthlyBilling / 100, clients }
}

function sumOstSheet(
  sheet: XLSX.WorkSheet,
  opts?: { zoneFilter?: string; excludeBanking?: boolean; bankingOnly?: boolean },
): OstMoney {
  const layout = detectOstLayout(sheet)
  if (!layout) return { outstanding: 0, monthlyBilling: 0, clients: 0 }
  const ref = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  return sumOstRange(sheet, layout.dataStartRow, ref.e.r + 1, opts)
}

function findOstLabelRow(sheet: XLSX.WorkSheet, pattern: RegExp): number {
  const layout = detectOstLayout(sheet)
  const clientCol = layout?.clientCol ?? 3
  const ref = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  for (let r = 0; r <= ref.e.r; r++) {
    const client = String(sheet[XLSX.utils.encode_cell({ r, c: clientCol })]?.v ?? '').trim()
    if (pattern.test(client)) return r
  }
  return -1
}

function mergeOstRow(acc: Record<string, OutstandingBranchRow>, row: OutstandingBranchRow) {
  const cur = acc[row.groupKey]
  if (!cur) {
    acc[row.groupKey] = { ...row }
    return
  }
  cur.outstanding += row.outstanding
  cur.monthlyBilling += row.monthlyBilling
  cur.clients += row.clients
  cur.collected = (Number(cur.collected) || 0) + (Number(row.collected) || 0)
  if (!cur.zone.includes(row.zone)) cur.zone += ` + ${row.zone}`
}

function findOstSheet(wb: XLSX.WorkBook, pattern: RegExp): { name: string; sheet: XLSX.WorkSheet } | null {
  const name = wb.SheetNames.find((n) => pattern.test(n.trim()))
  if (!name) return null
  const sheet = wb.Sheets[name]
  return sheet ? { name, sheet } : null
}

function isNewOstWorkbook(wb: XLSX.WorkBook): boolean {
  const names = wb.SheetNames.map((n) => n.trim())
  /** Hybrid workbooks (A-ZONE + AP + TN,KA&PY,KL) must use legacy regional parser. */
  if (names.some((n) => /^(AP|TN,KA&PY,KL|MP&MH)$/i.test(n))) return false
  return names.some((n) => /^(TPT|NLR|VJY|VIZ|PO|TN|KL|KA|MH|GUJ|MP|A-ZONE|B-ZONE|BANKING)$/i.test(n))
}

const OST_NEW_SHEETS: Array<{ pattern: RegExp; groupKey: string; zone?: string; label: string }> = [
  { pattern: /^A-?ZONE$/i, groupKey: 'HYDERABAD-A', zone: 'A', label: 'Hyderabad-A' },
  { pattern: /^B-?ZONE$/i, groupKey: 'HYDERABAD-B', zone: 'B', label: 'Hyderabad-B' },
  { pattern: /^KRC$/i, groupKey: 'HI-TECH CITY', zone: 'KRC', label: 'Hi-Tech City' },
  { pattern: /^TPT$/i, groupKey: 'TIRUPATI', label: 'Tirupati' },
  { pattern: /^NLR$/i, groupKey: 'NELLORE', label: 'Nellore' },
  { pattern: /^VJY$/i, groupKey: 'VIJAYAWADA', label: 'Vijayawada' },
  { pattern: /^VIZ$/i, groupKey: 'VISAKHAPATNAM', label: 'Visakhapatnam' },
  { pattern: /^PO$/i, groupKey: 'PUDUCHERRY', label: 'Puducherry' },
  { pattern: /^TN$/i, groupKey: 'CHENNAI', label: 'Chennai' },
  { pattern: /^KL$/i, groupKey: 'KOCHI', label: 'Kochi' },
  { pattern: /^KA$/i, groupKey: 'BANGALORE', label: 'Bangalore' },
  { pattern: /^MH$/i, groupKey: 'MUMBAI', label: 'Mumbai' },
  { pattern: /^GUJ$/i, groupKey: 'SURAT', label: 'Surat' },
  { pattern: /^MP$/i, groupKey: 'BHOPAL', label: 'Bhopal' },
]

function parseNewOutstandingStatement(wb: XLSX.WorkBook): OutstandingBranchRow[] {
  const acc: Record<string, OutstandingBranchRow> = {}

  for (const spec of OST_NEW_SHEETS) {
    const found = findOstSheet(wb, spec.pattern)
    if (!found) continue
    const s = sumOstSheet(found.sheet, { zoneFilter: spec.zone, excludeBanking: true })
    if (s.outstanding <= 0 && s.monthlyBilling <= 0) continue
    mergeOstRow(acc, {
      zone: spec.label,
      groupKey: spec.groupKey,
      outstanding: s.outstanding,
      monthlyBilling: s.monthlyBilling,
      clients: s.clients,
    })
  }

  const bankSheet = findOstSheet(wb, /^BANKING$/i)
  if (bankSheet) {
    const s = sumOstSheet(bankSheet.sheet, { bankingOnly: true })
    if (s.outstanding > 0 || s.monthlyBilling > 0) {
      acc['CORPORATE-OFFICE'] = {
        zone: 'Banking (Corporate Office)',
        groupKey: 'CORPORATE-OFFICE',
        outstanding: s.outstanding,
        monthlyBilling: s.monthlyBilling,
        clients: s.clients,
      }
    }
  }

  return Object.values(acc)
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
  'TIRUPATI BRANCH': 'TIRUPATI',
  'NELLORE BRANCH': 'NELLORE',
  'VIJAYAWADA BRANCH': 'VIJAYAWADA',
  'VISAKHAPATNAM BRANCH': 'VISAKHAPATNAM',
  'TN BRANCH': 'CHENNAI',
  'KA BRANCH': 'BANGALORE',
  'MAHARASHTRA BRANCH': 'MUMBAI',
  'GUJARAT BRANCH': 'SURAT',
  'MADHYA PRADESH BRANCH': 'BHOPAL',
  'KERALA': 'KOCHI',
}

function ostSectionKey(name: string): string {
  const u = name.toUpperCase().replace(/\s+/g, ' ').trim()
  if (/BANKING/i.test(u)) return '__BANKING__'
  if (OST_BRANCH_MAP[u]) return OST_BRANCH_MAP[u]
  return collectionZoneGroupKey(name)
}

function parseLegacyOutstandingStatement(wb: XLSX.WorkBook): OutstandingBranchRow[] {
  const acc: Record<string, OutstandingBranchRow> = {}

  const azFound = findOstSheet(wb, /^A-?ZONE/i)
  if (azFound) {
    for (const [zone, key, label] of [
      ['A', 'HYDERABAD-A', 'Hyderabad-A'],
      ['B', 'HYDERABAD-B', 'Hyderabad-B'],
      ['KRC', 'HI-TECH CITY', 'Hi-Tech City'],
    ] as const) {
      const s = sumOstSheet(azFound.sheet, { zoneFilter: zone, excludeBanking: true })
      if (s.outstanding > 0 || s.monthlyBilling > 0) {
        acc[key] = { zone: label, groupKey: key, outstanding: s.outstanding, monthlyBilling: s.monthlyBilling, clients: s.clients }
      }
    }
  }

  const ap = wb.Sheets.AP
  if (ap) {
    for (const sec of branchSections(ap)) {
      const key = ostSectionKey(sec.name)
      if (key === '__BANKING__' || !key) continue
      const s = sumOstRange(ap, sec.start, sec.end, { excludeBanking: true })
      mergeOstRow(acc, { zone: sec.name, groupKey: key, outstanding: s.outstanding, monthlyBilling: s.monthlyBilling, clients: s.clients })
    }
  }

  const tn = wb.Sheets['TN,KA&PY,KL']
  if (tn) {
    const ref = XLSX.utils.decode_range(tn['!ref'] || 'A1')
    const tnRow = findOstLabelRow(tn, /TN Branch/i)
    const keralaRow = findOstLabelRow(tn, /^KERALA$/i)
    const kaRow = findOstLabelRow(tn, /KA Branch/i)
    if (tnRow >= 0 && keralaRow > tnRow) {
      const s = sumOstRange(tn, tnRow + 1, keralaRow, { excludeBanking: true })
      mergeOstRow(acc, { zone: 'TN Branch', groupKey: 'CHENNAI', outstanding: s.outstanding, monthlyBilling: s.monthlyBilling, clients: s.clients })
    }
    if (keralaRow >= 0 && kaRow > keralaRow) {
      /** Kerala section is often a single HDFC row — do not exclude banking here. */
      const s = sumOstRange(tn, keralaRow + 1, kaRow)
      mergeOstRow(acc, { zone: 'Kerala', groupKey: 'KOCHI', outstanding: s.outstanding, monthlyBilling: s.monthlyBilling, clients: s.clients })
    }
    if (kaRow >= 0) {
      const s = sumOstRange(tn, kaRow + 1, ref.e.r + 1, { excludeBanking: true })
      mergeOstRow(acc, { zone: 'KA Branch', groupKey: 'BANGALORE', outstanding: s.outstanding, monthlyBilling: s.monthlyBilling, clients: s.clients })
    } else {
      for (const sec of branchSections(tn)) {
        const key = ostSectionKey(sec.name)
        if (!key || key === '__BANKING__') continue
        const s = sumOstRange(tn, sec.start, sec.end, { excludeBanking: true })
        mergeOstRow(acc, { zone: sec.name, groupKey: key, outstanding: s.outstanding, monthlyBilling: s.monthlyBilling, clients: s.clients })
      }
    }
  }

  const mp = wb.Sheets['MP&MH']
  if (mp) {
    for (const sec of branchSections(mp)) {
      const key = ostSectionKey(sec.name)
      if (!key || key === '__BANKING__') continue
      const s = sumOstRange(mp, sec.start, sec.end, { excludeBanking: true })
      mergeOstRow(acc, { zone: sec.name, groupKey: key, outstanding: s.outstanding, monthlyBilling: s.monthlyBilling, clients: s.clients })
    }
  }

  const bankSheet = findOstSheet(wb, /^BANKING$/i)
  if (bankSheet) {
    const s = sumOstSheet(bankSheet.sheet, { bankingOnly: true })
    if (s.outstanding > 0 || s.monthlyBilling > 0) {
      acc['CORPORATE-OFFICE'] = {
        zone: 'Banking (Corporate Office)',
        groupKey: 'CORPORATE-OFFICE',
        outstanding: s.outstanding,
        monthlyBilling: s.monthlyBilling,
        clients: s.clients,
      }
    }
  }

  return Object.values(acc)
}

function findJuneConsolidatedSheet(wb: XLSX.WorkBook): XLSX.WorkSheet | null {
  const names = wb.SheetNames.map((n) => String(n ?? '').trim())
  const monthSheet = names.find((n) => /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*['’\s-]*\d{2}$/i.test(n))
  const preferred = names.find((n) => /Jul(y)?['’\s-]*26/i.test(n))
    || names.find((n) => /Jun(e)?['’\s-]*26/i.test(n))
    || monthSheet
  if (!preferred) return null
  return wb.Sheets[preferred] || null
}

/** Assign a June'26 consolidated row to a branch group (non-bank clients). */
function juneConsolidatedBranchKey(
  sheet: XLSX.WorkSheet,
  row: number,
  layout: OstLayout,
  breaks: { row: number; key: string; label: string }[],
): string {
  const firstBranch = breaks.find((b) => b.row > layout.dataStartRow)
  if (firstBranch && row < firstBranch.row) {
    const zone =
      layout.zoneCol >= 0
        ? String(sheet[XLSX.utils.encode_cell({ row, c: layout.zoneCol })]?.v ?? '')
            .trim()
            .toUpperCase()
        : ''
    if (zone === 'A') return 'HYDERABAD-A'
    if (zone === 'B') return 'HYDERABAD-B'
    if (zone === 'KRC') return 'HI-TECH CITY'
    return ''
  }
  let key = ''
  for (const b of breaks) {
    if (row > b.row) key = b.key
    else break
  }
  return key
}

function juneConsolidatedBreaks(sheet: XLSX.WorkSheet, layout: OstLayout): { row: number; key: string; label: string }[] {
  const ref = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  const breaks: { row: number; key: string; label: string }[] = []
  for (let r = 0; r <= ref.e.r; r++) {
    const client = String(sheet[XLSX.utils.encode_cell({ r, c: layout.clientCol })]?.v ?? '').trim()
    if (/^KERALA$/i.test(client)) {
      breaks.push({ row: r, key: 'KOCHI', label: 'Kerala' })
      continue
    }
    if (!client || !/branch/i.test(client) || /SBI|State Bank|All Branches/i.test(client)) continue
    const label = client.replace(/\s*:?\s*$/i, '').trim()
    const key = ostSectionKey(label)
    if (!key || key === '__BANKING__') continue
    /** Normalise legacy branch keys to group keys used in branch master. */
    const groupKey =
      key === 'VIJAYAWADA BRANCH'
        ? 'VIJAYAWADA'
        : key === 'VISAKHAPATNAM BRANCH'
          ? 'VISAKHAPATNAM'
          : key
    breaks.push({ row: r, key: groupKey, label })
  }
  return breaks.sort((a, b) => a.row - b.row)
}

/**
 * June'26 consolidated sheet — branch + banking totals (matches footer bill / collected / %).
 * Banking is included in company consolidated % but not shown on branch MIS grid.
 */
function parseJuneConsolidatedOst(wb: XLSX.WorkBook): OutstandingBranchRow[] {
  const sheet = findJuneConsolidatedSheet(wb)
  if (!sheet) return []
  const layout = detectOstLayout(sheet)
  if (!layout) return []
  /** June'26: Zone, client, Bill Amounts, …, Total Amount (₹ thousands). */
  const clientCol = layout.clientCol
  const zoneCol = layout.zoneCol >= 0 ? layout.zoneCol : 1
  const billingCol = layout.billingCol
  const outCol = ostOutstandingCol(sheet, layout)
  const ref = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  const breaks = juneConsolidatedBreaks(sheet, layout)
  const acc: Record<string, OutstandingBranchRow> = {}
  const firstBranchRow = breaks.find((b) => b.row > layout.dataStartRow)?.row ?? ref.e.r + 1

  const zoneLabels: Record<string, string> = {
    'HYDERABAD-A': 'Hyderabad-A',
    'HYDERABAD-B': 'Hyderabad-B',
    'HI-TECH CITY': 'Hi-Tech City',
  }

  let dataEnd = ref.e.r + 1
  for (let r = layout.dataStartRow; r <= ref.e.r; r++) {
    const client = String(sheet[XLSX.utils.encode_cell({ r, c: clientCol })]?.v ?? '').trim()
    if (/^collected|^collected %/i.test(client)) {
      dataEnd = r
      break
    }
    const bill = cellNum(sheet[XLSX.utils.encode_cell({ r, c: billingCol })]?.v)
    if (!client && bill > 100_000) {
      dataEnd = r
      break
    }
  }

  for (let r = layout.dataStartRow; r < dataEnd; r++) {
    const client = String(sheet[XLSX.utils.encode_cell({ r, c: clientCol })]?.v ?? '').trim()
    const zone = String(sheet[XLSX.utils.encode_cell({ r, c: zoneCol })]?.v ?? '').trim()
    const bill = cellNum(sheet[XLSX.utils.encode_cell({ r, c: billingCol })]?.v)
    const out = cellNum(sheet[XLSX.utils.encode_cell({ r, c: outCol })]?.v)
    const arrears = cellNum(sheet[XLSX.utils.encode_cell({ r, c: billingCol + 1 })]?.v)
    const collectedK = bill > 0 && arrears >= 0 && arrears <= bill ? Math.max(0, bill - arrears) : 0
    if (!client || /branch\s*:?\s*$/i.test(client)) continue
    if (bill <= 0 && out <= 0) continue
    if (isBankingRow(zone, client)) {
      mergeOstRow(acc, {
        zone: 'Banking',
        groupKey: 'BANKING',
        outstanding: out / 100,
        monthlyBilling: bill / 100,
        collected: collectedK / 100,
        clients: 1,
      })
      continue
    }

    let groupKey: string
    let zoneLabel: string
    if (r < firstBranchRow) {
      const z = zone.toUpperCase()
      if (z === 'A') groupKey = 'HYDERABAD-A'
      else if (z === 'B') groupKey = 'HYDERABAD-B'
      else if (z === 'KRC') groupKey = 'HI-TECH CITY'
      else continue
      zoneLabel = zoneLabels[groupKey] || groupKey
    } else {
      groupKey = juneConsolidatedBranchKey(sheet, r, layout, breaks)
      if (!groupKey) continue
      zoneLabel = zoneLabels[groupKey] || breaks.find((b) => b.key === groupKey)?.label || groupKey
    }

    mergeOstRow(acc, {
      zone: zoneLabel,
      groupKey,
      outstanding: out / 100,
      monthlyBilling: bill / 100,
      collected: collectedK / 100,
      clients: 1,
    })
  }

  return Object.values(acc)
}

/** June'26 consolidated footer — billing, collected, total outstanding (₹ K), collected %. */
export function parseJuneConsolidatedFooter(buf: Buffer): {
  billingK: number
  collectedK: number
  outstandingK: number
  recoveryPct: number
} | null {
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: false })
  const sheet = findJuneConsolidatedSheet(wb)
  if (!sheet) return null
  const layout = detectOstLayout(sheet)
  const billCol = layout?.billingCol ?? 4
  const outCol = layout ? ostOutstandingCol(sheet, layout) : 13
  const ref = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  for (let r = 0; r <= ref.e.r; r++) {
    const label = String(sheet[XLSX.utils.encode_cell({ r, c: billCol })]?.v ?? '').trim()
    if (!/^collected\s*%$/i.test(label)) continue
    const pctRaw = cellNum(sheet[XLSX.utils.encode_cell({ r, c: billCol + 1 })]?.v)
    const collectedK = cellNum(sheet[XLSX.utils.encode_cell({ r: r - 1, c: billCol + 1 })]?.v)
    let billingK = 0
    let outstandingK = 0
    for (let br = r - 1; br >= Math.max(0, r - 8); br--) {
      const bill = cellNum(sheet[XLSX.utils.encode_cell({ r: br, c: billCol })]?.v)
      if (bill > 100_000) {
        billingK = bill
        outstandingK = cellNum(sheet[XLSX.utils.encode_cell({ r: br, c: outCol })]?.v)
        break
      }
    }
    if (!billingK || !collectedK || !pctRaw) return null
    const recoveryPct = pctRaw > 1 ? pctRaw : pctRaw * 100
    return {
      billingK: Math.round(billingK * 100) / 100,
      collectedK: Math.round(collectedK * 100) / 100,
      outstandingK: Math.round(outstandingK * 100) / 100,
      recoveryPct: Math.round(recoveryPct * 100) / 100,
    }
  }
  return null
}

/** Persist June'26 footer + banking slice when OST is imported. */
export async function saveOstCollectionBaseline(
  weekStart: string,
  buf: Buffer,
  sourceLabel: string,
  ostRows?: OutstandingBranchRow[],
): Promise<import('./store.js').MisCollectionBaseline | null> {
  const footer = parseJuneConsolidatedFooter(buf)
  if (!footer) return null
  const bankingRow = ostRows?.find((r) => r.groupKey === 'BANKING')
  const { saveCollectionBaseline } = await import('./store.js')
  const baseline = {
    weekStart,
    billingK: footer.billingK,
    collectedK: footer.collectedK,
    outstandingK: footer.outstandingK,
    recoveryPct: footer.recoveryPct,
    bankingBillingL: bankingRow ? moneyLacs(bankingRow.monthlyBilling) : 0,
    bankingOutstandingL: bankingRow ? moneyLacs(bankingRow.outstanding) : 0,
    source: sourceLabel,
    importedAt: new Date().toISOString(),
  }
  await saveCollectionBaseline(baseline)
  return baseline
}

/** Parse OST BILLS outstanding workbook — branch totals in lakhs (Rs thousands ÷ 100). */
export function parseOutstandingStatement(buf: Buffer): OutstandingBranchRow[] {
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: false })
  const juneRows = parseJuneConsolidatedOst(wb)
  if (juneRows.length) return juneRows
  if (isNewOstWorkbook(wb)) return parseNewOutstandingStatement(wb)
  return parseLegacyOutstandingStatement(wb)
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
    if (row.groupKey === 'BANKING' || row.groupKey === 'CORPORATE-OFFICE') continue
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
    cur.outstanding = moneyLacs(row.outstanding)
    cur.monthlyBilling = moneyLacs(row.monthlyBilling)
    if ((Number(row.collected) || 0) > 0) cur.ostCollected = moneyLacs(row.collected)
    cur.remarks = `${ostBillingMonthLabel()} billing + outstanding — ${sourceLabel}`
    byId[br.id] = normalizeCollectionRow(cur)
    updated++
  }

  return { list: ensureAllBranchCollectionRows(weekStart, branches, Object.values(byId)), updated, unmatched }
}

export function decodeUploadBase64(data: string): Buffer {
  const raw = String(data ?? '').trim()
  const b64 = raw.includes(',') ? raw.split(',').pop()! : raw
  return Buffer.from(b64, 'base64')
}

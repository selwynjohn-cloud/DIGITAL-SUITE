/**
 * Equipment Issues as per SLA — unit-wise, same equipment columns as Unit Equipment Register.
 */

import { UNIT_ISSUE_ITEMS, emptyQty, type UnitIssueQty } from './unit-issue.js'
import { getClients, nid, num, type MisClient } from './store.js'

export type SlaUnitRow = {
  clientId: string
  clientName: string
  location: string
  /** Datestamp — when issue was last updated */
  issueDate: string
  /** Issue quantity per equipment item */
  qty: UnitIssueQty
  nextIssueDate: string
  /** Tick — shared with stores */
  sharedWithStores: boolean
  remark: string
  /** Any equipment issue is repeated for this unit */
  repeated: boolean
  active: boolean
  deactivatedAt?: string
}

const slaIssueKey = (branchId: string) => `mis:slaissue:${branchId}`
const slaHistoryKey = (branchId: string) => `mis:slahistory:${branchId}`

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

async function redis(command: unknown[]): Promise<{ result?: unknown } | null> {
  const cfg = redisConfig()
  if (!cfg) return null
  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    })
    if (!res.ok) return null
    return (await res.json()) as { result?: unknown }
  } catch {
    return null
  }
}

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const d = await redis(['GET', key])
  if (d?.result && typeof d.result === 'string') {
    try {
      return JSON.parse(d.result) as T
    } catch {
      /* ignore */
    }
  }
  return fallback
}

async function setJson(key: string, value: unknown): Promise<boolean> {
  const r = await redis(['SET', key, JSON.stringify(value)])
  return r?.result === 'OK'
}

function seedFromClients(clients: MisClient[]): SlaUnitRow[] {
  const today = new Date().toISOString().slice(0, 10)
  return clients
    .filter((c) => c.active !== false)
    .map((c) => ({
      clientId: c.id,
      clientName: c.name,
      location: c.location,
      issueDate: today,
      qty: emptyQty(),
      nextIssueDate: '',
      sharedWithStores: false,
      remark: '',
      repeated: false,
      active: true,
    }))
}

function cleanQty(raw?: UnitIssueQty): UnitIssueQty {
  const qty = emptyQty()
  for (const it of UNIT_ISSUE_ITEMS) qty[it.key] = num(raw?.[it.key])
  return qty
}

function rowHasIssue(qty: UnitIssueQty): boolean {
  return UNIT_ISSUE_ITEMS.some((it) => (qty[it.key] || 0) > 0)
}

export async function getSlaIssueRegister(branchId: string, seed = true): Promise<SlaUnitRow[]> {
  const stored = await getJson<SlaUnitRow[]>(slaIssueKey(branchId), [])
  if (stored.length) {
    return stored.map((r) => ({
      clientId: String(r.clientId ?? ''),
      clientName: String(r.clientName ?? ''),
      location: String(r.location ?? ''),
      issueDate: String(r.issueDate ?? '').slice(0, 10) || new Date().toISOString().slice(0, 10),
      qty: cleanQty((r as { qty?: UnitIssueQty }).qty),
      nextIssueDate: String(r.nextIssueDate ?? '').slice(0, 10),
      sharedWithStores: Boolean(r.sharedWithStores),
      remark: String(r.remark ?? ''),
      repeated: Boolean(r.repeated),
      active: (r as { active?: boolean }).active !== false,
      deactivatedAt: String(r.deactivatedAt ?? ''),
    }))
  }
  if (!seed) return []
  return seedFromClients(await getClients(branchId))
}

export function flagRepeatedSlaRows(rows: SlaUnitRow[], history: Set<string>): SlaUnitRow[] {
  const nextHistory = new Set(history)
  return rows.map((r) => {
    if (r.active === false || !rowHasIssue(r.qty)) return { ...r, repeated: false }
    let repeated = r.repeated
    for (const it of UNIT_ISSUE_ITEMS) {
      if ((r.qty[it.key] || 0) <= 0) continue
      const key = `${r.clientId}|${it.key}`.toLowerCase()
      if (history.has(key)) repeated = true
      nextHistory.add(key)
    }
    return { ...r, repeated }
  })
}

export async function getSlaHistory(branchId: string): Promise<Set<string>> {
  const arr = await getJson<string[]>(slaHistoryKey(branchId), [])
  return new Set(arr)
}

export async function saveSlaHistory(branchId: string, history: Set<string>): Promise<void> {
  await setJson(slaHistoryKey(branchId), [...history].slice(0, 50000))
}

export async function saveSlaIssueRegister(branchId: string, rows: SlaUnitRow[]): Promise<boolean> {
  const history = await getSlaHistory(branchId)
  const flagged = flagRepeatedSlaRows(rows, history)
  for (const r of flagged) {
    if (r.active === false || !rowHasIssue(r.qty)) continue
    for (const it of UNIT_ISSUE_ITEMS) {
      if ((r.qty[it.key] || 0) > 0) history.add(`${r.clientId}|${it.key}`.toLowerCase())
    }
  }
  await saveSlaHistory(branchId, history)

  const clean = flagged.slice(0, 5000).map((r) => ({
    clientId: String(r.clientId ?? nid('cl')),
    clientName: String(r.clientName ?? '').slice(0, 120),
    location: String(r.location ?? '').slice(0, 120),
    issueDate: String(r.issueDate ?? '').slice(0, 10),
    qty: cleanQty(r.qty),
    nextIssueDate: String(r.nextIssueDate ?? '').slice(0, 10),
    sharedWithStores: Boolean(r.sharedWithStores),
    remark: String(r.remark ?? '').slice(0, 300),
    repeated: Boolean(r.repeated),
    active: r.active !== false,
    deactivatedAt: r.active === false ? String(r.deactivatedAt ?? '').slice(0, 10) : '',
  }))
  return setJson(slaIssueKey(branchId), clean)
}

export type SlaPendingSummary = {
  branchId: string
  branchName: string
  pendingUnits: number
  pendingItems: number
  repeatedUnits: number
}

export function summarizeSlaPending(branchId: string, branchName: string, rows: SlaUnitRow[]): SlaPendingSummary {
  let pendingUnits = 0
  let pendingItems = 0
  let repeatedUnits = 0
  for (const r of rows) {
    if (r.active === false || !rowHasIssue(r.qty)) continue
    if (!r.sharedWithStores) pendingUnits++
    if (r.repeated) repeatedUnits++
    for (const it of UNIT_ISSUE_ITEMS) pendingItems += r.qty[it.key] || 0
  }
  return { branchId, branchName, pendingUnits, pendingItems, repeatedUnits }
}

export type SlaClientIndent = {
  clientId: string
  clientName: string
  location: string
  rows: SlaUnitRow[]
}

export function groupSlaIndents(rows: SlaUnitRow[]): SlaClientIndent[] {
  const map = new Map<string, SlaClientIndent>()
  for (const r of rows) {
    if (r.active === false || !r.repeated || !rowHasIssue(r.qty)) continue
    const key = `${r.clientId}|${r.location}`
    if (!map.has(key)) map.set(key, { clientId: r.clientId, clientName: r.clientName, location: r.location, rows: [] })
    map.get(key)!.rows.push(r)
  }
  return [...map.values()].sort((a, b) => a.clientName.localeCompare(b.clientName))
}

export async function buildSlaIndentMailHtml(branchName: string, indents: SlaClientIndent[]): Promise<string> {
  const itemLabel = (k: string) => UNIT_ISSUE_ITEMS.find((i) => i.key === k)?.label ?? k
  const blocks = indents
    .map((g) => {
      const lines: string[] = []
      for (const r of g.rows) {
        for (const it of UNIT_ISSUE_ITEMS) {
          const q = r.qty[it.key] || 0
          if (q <= 0) continue
          lines.push(
            `<tr><td style="padding:8px;border:1px solid #e2e8f0">${esc(itemLabel(it.key))}</td>` +
              `<td style="padding:8px;border:1px solid #e2e8f0">${q}</td>` +
              `<td style="padding:8px;border:1px solid #e2e8f0">${esc(r.nextIssueDate || '—')}</td>` +
              `<td style="padding:8px;border:1px solid #e2e8f0">${esc(r.remark || '—')}</td></tr>`,
          )
        }
      }
      return `<div style="margin-bottom:22px"><h3 style="color:#14224f">${esc(g.clientName)}</h3>` +
        `<p style="font-size:13px;color:#64748b">Unit: <b>${esc(g.location || '—')}</b></p>` +
        `<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#f1f5f9">` +
        `<th style="padding:8px;border:1px solid #e2e8f0">Equipment</th><th style="padding:8px;border:1px solid #e2e8f0">Issue Qty</th>` +
        `<th style="padding:8px;border:1px solid #e2e8f0">Next Issue Date</th><th style="padding:8px;border:1px solid #e2e8f0">Remark</th>` +
        `</tr></thead><tbody>${lines.join('')}</tbody></table></div>`
    })
    .join('')
  return `<p><b>Agile Security Force Pvt. Ltd.</b><br>Equipment Issues as per SLA — Indent<br>Branch: ${esc(branchName)}</p>` +
    `<p style="font-size:13px;color:#64748b">Repeated equipment issues — please arrange supply / action.</p>${blocks}` +
    `<p style="font-size:12px;color:#64748b">— Agile MIS</p>`
}

export async function buildStoresIssueMailHtml(branchName: string, row: SlaUnitRow): Promise<string> {
  const items = UNIT_ISSUE_ITEMS.filter((it) => (row.qty[it.key] || 0) > 0)
    .map((it) => `<tr><td style="padding:8px;border:1px solid #e2e8f0">${esc(it.label)}</td><td style="padding:8px;border:1px solid #e2e8f0">${row.qty[it.key]}</td></tr>`)
    .join('')
  return `<p><b>Stores Indent — Equipment Issue</b><br>Branch: ${esc(branchName)}</p>` +
    `<p>Client: <b>${esc(row.clientName)}</b><br>Unit: ${esc(row.location)}<br>Datestamp: ${esc(row.issueDate)}<br>Next Issue Date: ${esc(row.nextIssueDate || '—')}</p>` +
    `<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f1f5f9"><th style="padding:8px;border:1px solid #e2e8f0">Equipment</th><th style="padding:8px;border:1px solid #e2e8f0">Qty Required</th></tr></thead><tbody>${items}</tbody></table>` +
    `<p>Remark: ${esc(row.remark || '—')}</p>`
}

function esc(s: string): string {
  return String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

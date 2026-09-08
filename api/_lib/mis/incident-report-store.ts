/**
 * HOD Incident Reporting — formal client letter (Agile/IR/… format).
 * Attachments stored as separate Redis data-URL keys (not in the list JSON).
 */

import { nid } from './store.js'

export type IncidentReportStatus = 'draft' | 'submitted'

export type IncidentAttachmentKind = 'photo' | 'evidence'

export type IncidentAttachmentMeta = {
  id: string
  kind: IncidentAttachmentKind
  filename: string
  contentType: string
  /** Short label e.g. Replacement FA photo / Deployment order */
  label: string
}

export type MisIncidentReport = {
  id: string
  branchId: string
  branchName: string
  /** Agile/IR/14/2026 */
  refNo: string
  /** Report letter date YYYY-MM-DD */
  reportDate: string
  /** Incident date YYYY-MM-DD */
  incidentDate: string
  /** Time e.g. 15:22 or 15:22 Hrs */
  incidentTime: string
  /** When client was informed (verbal/phone) — YYYY-MM-DD */
  informedToClientDate: string
  /** When client was informed — HH:MM */
  informedToClientTime: string
  clientId: string
  clientName: string
  placeOfIncident: string
  typeOfIncident: string
  lossOfProperty: string
  sourceOfInfo: string
  personnelInvolved: string
  inquiryOfficer: string
  briefDescription: string
  suspectedPersons: string
  findings: string
  actionTaken: string
  /** Human-written suggestion (HOD / inquiry officer). */
  suggestion: string
  /** System / AI alerts & suggestions — shown after human reporting. */
  aiSuggestion?: string
  /** Optional note about photos / attachments */
  photosNote: string
  attachments: IncidentAttachmentMeta[]
  signName: string
  signDesignation: string
  signEmail: string
  /** Client email (To) — required on submit */
  clientEmail: string
  status: IncidentReportStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  submittedAt?: string
  submittedTo?: string[]
  submittedCc?: string[]
  /** Last management reminder to close (email to HOD). */
  lastReminderAt?: string
  reminderCount?: number
  /** Reopened by management after client send. */
  reopenedAt?: string
  reopenedBy?: string
}

const listKey = (branchId: string) => `mis:incident-reports:${branchId}`
const SEQ_KEY = 'mis:incident-report-seq'
const DOC_PREFIX = 'mis:ir-doc:'

export const IR_MAX_PHOTOS = 5
export const IR_MAX_EVIDENCE = 5
/** Max data-URL length per file (~670KB binary). */
export const IR_MAX_DATA_URL_CHARS = 900_000

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

async function getList(branchId: string): Promise<MisIncidentReport[]> {
  const d = await redis(['GET', listKey(branchId)])
  if (d?.result && typeof d.result === 'string') {
    try {
      const arr = JSON.parse(d.result) as MisIncidentReport[]
      if (!Array.isArray(arr)) return []
      return arr.map((r) => ({
        ...r,
        attachments: Array.isArray(r.attachments) ? r.attachments : [],
      }))
    } catch {
      return []
    }
  }
  return []
}

async function setList(branchId: string, list: MisIncidentReport[]): Promise<boolean> {
  const r = await redis(['SET', listKey(branchId), JSON.stringify(list.slice(0, 500))])
  return Boolean(r)
}

export async function nextIncidentRefNo(): Promise<string> {
  const year = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(0, 4)
  const d = await redis(['INCR', SEQ_KEY])
  const seq = typeof d?.result === 'number' ? d.result : Math.floor(Date.now() / 1000) % 10000
  return `Agile/IR/${seq}/${year}`
}

export async function listIncidentReports(branchId: string): Promise<MisIncidentReport[]> {
  const list = await getList(branchId)
  return list.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
}

/** Open = draft; Closed = submitted (incident report sent to client). */
export function countIncidentOpenClosed(reports: MisIncidentReport[]): {
  open: number
  closed: number
  total: number
} {
  let open = 0
  let closed = 0
  for (const r of reports) {
    if (r.status === 'submitted') closed++
    else open++
  }
  return { open, closed, total: open + closed }
}

export async function countIncidentsForBranch(branchId: string): Promise<{
  open: number
  closed: number
  total: number
}> {
  return countIncidentOpenClosed(await listIncidentReports(branchId))
}

export async function countIncidentsByBranches(
  branches: { id: string; name: string }[],
): Promise<{
  open: number
  closed: number
  total: number
  byBranch: { branchId: string; branch: string; open: number; closed: number; total: number }[]
}> {
  const byBranch: { branchId: string; branch: string; open: number; closed: number; total: number }[] =
    []
  let open = 0
  let closed = 0
  for (const b of branches) {
    const c = await countIncidentsForBranch(b.id)
    byBranch.push({
      branchId: b.id,
      branch: b.name,
      open: c.open,
      closed: c.closed,
      total: c.total,
    })
    open += c.open
    closed += c.closed
  }
  return { open, closed, total: open + closed, byBranch }
}

export async function getIncidentReport(
  branchId: string,
  id: string,
): Promise<MisIncidentReport | null> {
  return (await getList(branchId)).find((r) => r.id === id) || null
}

export async function upsertIncidentReport(row: MisIncidentReport): Promise<boolean> {
  const list = await getList(row.branchId)
  const next = [row, ...list.filter((x) => x.id !== row.id)].slice(0, 500)
  return setList(row.branchId, next)
}

/** Remove one report from a branch bucket (e.g. after moving to another branch). */
export async function removeIncidentReport(branchId: string, id: string): Promise<boolean> {
  const list = await getList(branchId)
  const next = list.filter((r) => r.id !== id)
  if (next.length === list.length) return false
  return setList(branchId, next)
}

/** Management — permanently delete report and stored attachments. */
export async function deleteIncidentReport(branchId: string, id: string): Promise<boolean> {
  const list = await getList(branchId)
  const hit = list.find((r) => r.id === id)
  if (!hit) return false
  for (const att of hit.attachments || []) {
    await deleteIncidentAttachmentDataUrl(att.id)
  }
  return removeIncidentReport(branchId, id)
}

/** Move report to another branch list (updates branchId / branchName). */
export async function moveIncidentReportToBranch(
  fromBranchId: string,
  reportId: string,
  toBranch: { id: string; name: string },
): Promise<MisIncidentReport | null> {
  const list = await getList(fromBranchId)
  const hit = list.find((r) => r.id === reportId)
  if (!hit) return null
  const moved: MisIncidentReport = {
    ...hit,
    branchId: toBranch.id,
    branchName: toBranch.name,
    updatedAt: new Date().toISOString(),
  }
  const okRemove = await removeIncidentReport(fromBranchId, reportId)
  if (!okRemove) return null
  await upsertIncidentReport(moved)
  return moved
}

export function newIncidentReportId(): string {
  return nid('ir')
}

export function isHdfcClient(clientName: string, place: string): boolean {
  const s = `${clientName} ${place}`.toLowerCase()
  return /\bhdfc\b/.test(s)
}

export const HDFC_SPOC_CC_EMAIL = 'sridhar.m@agilegroup.co.in'

export async function saveIncidentAttachmentDataUrl(dataUrl: string): Promise<string | null> {
  const raw = String(dataUrl || '').trim()
  if (!raw.startsWith('data:') || raw.length > IR_MAX_DATA_URL_CHARS) return null
  const id = nid('irdoc')
  const r = await redis(['SET', DOC_PREFIX + id, raw])
  if (!r) return null
  await redis(['EXPIRE', DOC_PREFIX + id, String(60 * 60 * 24 * 180)])
  return id
}

export async function getIncidentAttachmentDataUrl(id: string): Promise<string | null> {
  const d = await redis(['GET', DOC_PREFIX + String(id || '').trim()])
  return typeof d?.result === 'string' ? d.result : null
}

export async function deleteIncidentAttachmentDataUrl(id: string): Promise<void> {
  await redis(['DEL', DOC_PREFIX + String(id || '').trim()])
}

export function dataUrlToAttachment(dataUrl: string, filename: string, contentType?: string) {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl)
  if (!m) return null
  return {
    filename,
    contentType: contentType || m[1] || 'application/octet-stream',
    content: m[2],
  }
}

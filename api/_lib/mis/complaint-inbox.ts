/**
 * Import client complaints from Director inbox (Gmail API or Apps Script webhook).
 */

import {
  COMPLAINT_NATURES,
  getBranches,
  getClients,
  getComplaints,
  getDirectorInboxComplaints,
  isComplaintNature,
  isComplaintEmailProcessed,
  markComplaintEmailProcessed,
  nextComplaintCode,
  nid,
  saveComplaints,
  saveDirectorInboxComplaints,
  type MisClient,
  type MisComplaint,
} from './store.js'

export type InboxEmailPayload = {
  emailId: string
  from: string
  subject: string
  body: string
  date?: string
  to?: string
}

const DIRECTOR_INBOX =
  process.env.MIS_COMPLAINT_INBOX_EMAIL?.trim().toLowerCase() || 'director@agilegroup.co.in'

/** Only import mail delivered to Agile Group director inbox — not personal Gmail. */
export function isAllowedDirectorInboxEmail(item: InboxEmailPayload): boolean {
  const to = String(item.to ?? '').toLowerCase()
  const cc = String((item as { cc?: string }).cc ?? '').toLowerCase()
  const hay = `${to} ${cc}`
  if (hay.includes(DIRECTOR_INBOX)) return true
  if (hay.includes('@agilegroup.co.in')) return true
  return false
}

const COMPLAINT_HINTS = [
  'complaint',
  'complaints',
  'incident',
  'grievance',
  'grievances',
  'unhappy',
  'dissatisfied',
  'escalat',
  'issue',
  'feedback',
  'unsatisfactory',
  'deficien',
  'shortage',
  'absent',
  'misconduct',
]

export function looksLikeComplaintEmail(subject: string, body: string): boolean {
  const hay = `${subject} ${body}`.toLowerCase()
  return COMPLAINT_HINTS.some((h) => hay.includes(h))
}

function extractClientName(subject: string, body: string, clients: MisClient[]): string {
  const hay = `${subject} ${body}`.toLowerCase()
  const sorted = [...clients].sort((a, b) => b.name.length - a.name.length)
  for (const c of sorted) {
    const n = c.name.trim()
    if (n.length >= 4 && hay.includes(n.toLowerCase())) return n
  }
  const sub = subject.replace(/^(re:|fwd:|fw:)\s*/gi, '').trim()
  const m = sub.match(/^(.{3,80}?)(?:\s*[-–:]|$)/)
  if (m) return m[1].trim().slice(0, 120)
  return sub.slice(0, 120) || 'Client (from email)'
}

function guessBranchId(clientName: string, clients: MisClient[]): string {
  const norm = clientName.trim().toUpperCase()
  const hit = clients.find((c) => c.name.trim().toUpperCase() === norm)
  return hit?.branchId || ''
}

function parseEmailDate(raw?: string): string {
  if (!raw) return new Date().toISOString().slice(0, 10)
  const d = new Date(raw)
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return new Date().toISOString().slice(0, 10)
}

export async function ingestComplaintEmail(item: InboxEmailPayload): Promise<{
  ok: boolean
  skipped?: boolean
  reason?: string
  complaint?: MisComplaint
}> {
  const emailId = String(item.emailId ?? '').trim()
  if (!emailId) return { ok: false, reason: 'Missing emailId' }

  if (await isComplaintEmailProcessed(emailId)) {
    return { ok: true, skipped: true, reason: 'Already imported' }
  }

  const subject = String(item.subject ?? '').slice(0, 300)
  const body = String(item.body ?? '').slice(0, 2000)
  if (!looksLikeComplaintEmail(subject, body)) {
    return { ok: true, skipped: true, reason: 'Not a complaint email' }
  }

  if (!isAllowedDirectorInboxEmail(item)) {
    return { ok: true, skipped: true, reason: 'Not addressed to director@agilegroup.co.in' }
  }

  const [clients, branches] = await Promise.all([getClients(), getBranches()])
  const clientName = extractClientName(subject, body, clients)
  const branchId = guessBranchId(clientName, clients)
  const now = new Date().toISOString()
  const code = await nextComplaintCode()

  const complaint: MisComplaint = {
    id: nid('cmp'),
    code,
    branchId: branchId || '',
    clientName,
    location: '',
    incidentDate: parseEmailDate(item.date),
    type: 'Client',
    description: `Subject: ${subject}\n\n${body}`.slice(0, 500),
    actionTaken: '',
    momWithin24h: false,
    status: 'Open',
    reportedBy: String(item.from ?? '').slice(0, 80),
    source: 'inbox',
    channel: 'Email',
    emailId,
    fromEmail: String(item.from ?? '').slice(0, 120),
    subject,
    importedAt: now,
    registeredAt: now,
  }

  if (branchId && branches.some((b) => b.id === branchId)) {
    const list = await getComplaints(branchId)
    list.push(complaint)
    await saveComplaints(branchId, list)
  } else {
    const inbox = await getDirectorInboxComplaints()
    inbox.unshift(complaint)
    await saveDirectorInboxComplaints(inbox.slice(0, 500))
  }

  await markComplaintEmailProcessed(emailId)
  return { ok: true, complaint }
}

export async function ingestComplaintEmails(
  items: InboxEmailPayload[],
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  let imported = 0
  let skipped = 0
  const errors: string[] = []
  for (const item of items) {
    try {
      const r = await ingestComplaintEmail(item)
      if (r.skipped) skipped++
      else if (r.ok) imported++
      else errors.push(r.reason || 'Unknown error')
    } catch (e) {
      errors.push(e instanceof Error ? e.message : 'Import failed')
    }
  }
  return { imported, skipped, errors }
}

async function gmailAccessToken(): Promise<string | null> {
  const clientId = process.env.GMAIL_CLIENT_ID?.trim()
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim()
  const refresh = process.env.GMAIL_REFRESH_TOKEN?.trim()
  if (!clientId || !clientSecret || !refresh) return null

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refresh,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) return null
  const j = (await res.json()) as { access_token?: string }
  return j.access_token || null
}

function decodeGmailBody(part: { body?: { data?: string }; parts?: unknown[] }): string {
  if (part.body?.data) {
    try {
      return Buffer.from(part.body.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    } catch {
      return ''
    }
  }
  if (Array.isArray(part.parts)) {
    for (const p of part.parts as { mimeType?: string; body?: { data?: string }; parts?: unknown[] }[]) {
      if (p.mimeType === 'text/plain' && p.body?.data) return decodeGmailBody(p)
      if (p.parts) {
        const t = decodeGmailBody(p)
        if (t) return t
      }
    }
  }
  return ''
}

export async function syncComplaintsFromGmail(): Promise<{
  ok: boolean
  skipped?: boolean
  error?: string
  imported?: number
  scanned?: number
  skippedPersonal?: number
}> {
  const token = await gmailAccessToken()
  if (!token) return { ok: false, skipped: true, error: 'Gmail not configured (set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN)' }

  const q = encodeURIComponent(
    process.env.MIS_COMPLAINT_GMAIL_QUERY?.trim() ||
      `newer_than:14d to:${DIRECTOR_INBOX} (complaint OR incident OR grievance OR unhappy OR escalation OR feedback OR issue)`,
  )
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=40`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!listRes.ok) return { ok: false, error: `Gmail list failed (${listRes.status})` }

  const list = (await listRes.json()) as { messages?: { id: string }[] }
  const messages = list.messages || []
  const payloads: InboxEmailPayload[] = []

  for (const m of messages) {
    const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!msgRes.ok) continue
    const msg = (await msgRes.json()) as {
      id: string
      internalDate?: string
      payload?: { headers?: { name: string; value: string }[]; body?: { data?: string }; parts?: unknown[] }
    }
    const headers = msg.payload?.headers || []
    const getH = (n: string) => headers.find((h) => h.name.toLowerCase() === n.toLowerCase())?.value || ''
    const dateHdr = getH('Date')
    const internal = msg.internalDate ? new Date(Number(msg.internalDate)).toISOString() : dateHdr
    payloads.push({
      emailId: msg.id,
      from: getH('From').slice(0, 120),
      subject: getH('Subject').slice(0, 300),
      body: decodeGmailBody(msg.payload || {}).slice(0, 2000),
      date: internal,
      to: getH('To'),
      cc: getH('Cc'),
    } as InboxEmailPayload & { cc?: string })
  }

  const allowed = payloads.filter(isAllowedDirectorInboxEmail)
  const result = await ingestComplaintEmails(allowed)
  return { ok: true, imported: result.imported, scanned: allowed.length, skippedPersonal: payloads.length - allowed.length }
}

export async function assignInboxComplaintToBranch(complaintId: string, branchId: string): Promise<boolean> {
  const inbox = await getDirectorInboxComplaints()
  const idx = inbox.findIndex((c) => c.id === complaintId)
  if (idx < 0) return false
  const [item] = inbox.splice(idx, 1)
  item.branchId = branchId
  if (!item.code) item.code = await nextComplaintCode()
  if (!item.registeredAt) item.registeredAt = new Date().toISOString()
  await saveDirectorInboxComplaints(inbox)
  const branchList = await getComplaints(branchId)
  branchList.unshift(item)
  await saveComplaints(branchId, branchList)
  return true
}

/** Remove unwanted inbox email — marks Gmail id processed so it is not re-imported. */
export async function deleteInboxComplaint(complaintId: string): Promise<boolean> {
  const inbox = await getDirectorInboxComplaints()
  const idx = inbox.findIndex((c) => c.id === complaintId)
  if (idx < 0) return false
  const [item] = inbox.splice(idx, 1)
  await saveDirectorInboxComplaints(inbox)
  if (item.emailId) await markComplaintEmailProcessed(item.emailId)
  return true
}

/** Permanently remove a branch complaint — preserves other records; blocks email re-import if applicable. */
export async function deleteBranchComplaint(branchId: string, complaintId: string): Promise<boolean> {
  const list = await getComplaints(branchId)
  const idx = list.findIndex((c) => c.id === complaintId)
  if (idx < 0) return false
  const [item] = list.splice(idx, 1)
  await saveComplaints(branchId, list)
  if (item.emailId) await markComplaintEmailProcessed(item.emailId)
  return true
}

export type PublicComplaintInput = {
  branchId: string
  clientName: string
  location: string
  type: string
  description: string
  reportedBy: string
  phone?: string
  email?: string
  channel: string
  expectedAction?: string
  nature?: string
}

/** Public / web / branch manual registration with auto code + timestamp. */
export async function registerOperationalComplaint(
  input: PublicComplaintInput,
): Promise<{ ok: boolean; error?: string; complaint?: MisComplaint; branchName?: string }> {
  const branchId = String(input.branchId ?? '').trim()
  if (!branchId) return { ok: false, error: 'Please select a branch' }
  const branches = await getBranches(true)
  if (!branches.some((b) => b.id === branchId)) return { ok: false, error: 'Invalid branch' }

  const description = String(input.description ?? '').trim()
  if (description.length < 10) return { ok: false, error: 'Please describe the complaint (at least 10 characters)' }

  const nature = String(input.nature ?? '').trim()
  if (!nature || !isComplaintNature(nature)) {
    return { ok: false, error: 'Please select the nature of complaint' }
  }

  const now = new Date().toISOString()
  const code = await nextComplaintCode()
  const phone = String(input.phone ?? '').trim()
  const email = String(input.email ?? '').trim()
  const reportedBy = String(input.reportedBy ?? '').trim() || (phone ? `Tel: ${phone}` : 'Web form')

  const complaint: MisComplaint = {
    id: nid('cmp'),
    code,
    branchId,
    clientName: String(input.clientName ?? '').slice(0, 160) || 'Client',
    location: String(input.location ?? '').slice(0, 160),
    incidentDate: now.slice(0, 10),
    type: String(input.type ?? 'Client').slice(0, 20),
    nature,
    description: description.slice(0, 500),
    actionTaken: '',
    momWithin24h: false,
    status: 'Open',
    reportedBy: reportedBy.slice(0, 80),
    contactPhone: phone.slice(0, 20),
    contactEmail: email.slice(0, 120),
    expectedAction: String(input.expectedAction ?? '').slice(0, 300),
    source: 'web',
    channel: String(input.channel ?? 'Web').slice(0, 20),
    registeredAt: now,
    importedAt: now,
    active: true,
  }

  const list = await getComplaints(branchId)
  list.unshift(complaint)
  await saveComplaints(branchId, list)
  const branch = branches.find((b) => b.id === branchId)
  return { ok: true, complaint, branchName: branch?.name || '' }
}

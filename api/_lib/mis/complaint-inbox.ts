/**
 * Import client complaints / incidents from Director inbox (Gmail API or Apps Script webhook).
 * Only client-origin mail (not @agilegroup.co.in) with incident keywords.
 */

import {
  COMPLAINT_NATURES,
  getBranches,
  getMisReportBranches,
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
  cc?: string
}

const DIRECTOR_INBOX =
  process.env.MIS_COMPLAINT_INBOX_EMAIL?.trim().toLowerCase() || 'director@agilegroup.co.in'

/** Only import mail delivered to Agile Group director inbox — not personal Gmail. */
export function isAllowedDirectorInboxEmail(item: InboxEmailPayload): boolean {
  const to = String(item.to ?? '').toLowerCase()
  const cc = String(item.cc ?? '').toLowerCase()
  const hay = `${to} ${cc}`
  if (hay.includes(DIRECTOR_INBOX)) return true
  if (hay.includes('@agilegroup.co.in')) return true
  return false
}

/** Client mail only — reject internal Agile / personal Selwyn Gmail / noreply senders. */
export function isFromClientSender(from: string): boolean {
  const f = String(from ?? '').toLowerCase()
  if (!f.includes('@')) return false
  if (f.includes('@agilegroup.co.in')) return false
  if (f.includes('selwyn.john@gmail.com')) return false
  if (/noreply|no-reply|mailer-daemon|notifications@|donotreply/i.test(f)) return false
  return true
}

/** Remove already-imported non-client rows (e.g. selwyn.john@gmail.com) from Director inbox. */
export async function purgeNonClientInboxComplaints(): Promise<number> {
  const inbox = await getDirectorInboxComplaints()
  const kept = inbox.filter((c) => isFromClientSender(c.fromEmail || c.reportedBy || ''))
  const removed = inbox.length - kept.length
  if (removed > 0) await saveDirectorInboxComplaints(kept)
  return removed
}

/** Repair Nature = mail subject (or NIL) on inbox + all branch complaint stores. */
export async function repairComplaintNatureSubjects(): Promise<number> {
  let fixed = 0
  const inbox = await getDirectorInboxComplaints()
  let inboxChanged = false
  const nextInbox = inbox.map((c) => {
    const n = syncNatureWithMailSubject(c)
    if (n.nature !== c.nature || n.subject !== c.subject) {
      fixed++
      inboxChanged = true
    }
    return n
  })
  if (inboxChanged) await saveDirectorInboxComplaints(nextInbox)

  const branches = await getMisReportBranches(true)
  for (const b of branches) {
    const list = await getComplaints(b.id)
    let changed = false
    const next = list.map((c) => {
      const n = syncNatureWithMailSubject(c)
      if (n.nature !== c.nature || n.subject !== c.subject) {
        fixed++
        changed = true
      }
      return n
    })
    if (changed) await saveComplaints(b.id, next)
  }
  return fixed
}

/** Subject/body keywords for client complaints & incidents. */
export const CLIENT_COMPLAINT_HINTS = [
  'fire',
  'incident',
  'shortage',
  'shortages',
  'theft',
  'left the post',
  'left post',
  'missing',
  'sleeping',
  'accident',
] as const

export function looksLikeComplaintEmail(subject: string, body: string): boolean {
  const hay = `${subject} ${body}`.toLowerCase()
  return CLIENT_COMPLAINT_HINTS.some((h) => hay.includes(h))
}

export function detectNatureFromText(subject: string, body: string): string {
  const hay = `${subject} ${body}`.toLowerCase()
  if (/left\s+the\s+post|left\s+post/.test(hay)) return 'Left the post'
  if (/\bfire\b/.test(hay)) return 'Fire'
  if (/\btheft\b/.test(hay)) return 'Theft'
  if (/\bsleeping\b/.test(hay)) return 'Sleeping'
  if (/\baccident\b/.test(hay)) return 'Accident'
  if (/\bshortage/.test(hay)) return 'Shortage of Manpower'
  if (/\bmissing\b/.test(hay)) return 'Missing'
  if (/\bincident\b/.test(hay)) return 'Incident'
  return ''
}

/** Decode RFC 2047 encoded-words in Gmail Subject headers (=?UTF-8?B?...?=). */
export function decodeMimeWords(raw: string): string {
  const input = String(raw ?? '')
  if (!/=\?/.test(input)) return input
  return input.replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g, (_m, _charset, enc, data) => {
    try {
      if (String(enc).toUpperCase() === 'B') {
        return Buffer.from(String(data).replace(/\s/g, ''), 'base64').toString('utf8')
      }
      const q = String(data).replace(/_/g, ' ')
      const bytes: number[] = []
      for (let i = 0; i < q.length; i++) {
        if (q[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(q.slice(i + 1, i + 3))) {
          bytes.push(parseInt(q.slice(i + 1, i + 3), 16))
          i += 2
        } else {
          bytes.push(q.charCodeAt(i) & 0xff)
        }
      }
      return Buffer.from(bytes).toString('utf8')
    } catch {
      return String(data ?? '')
    }
  })
}

/** Clean mail subject for Nature column. Empty / placeholder → ''. */
export function normalizeMailSubject(raw: string): string {
  let s = decodeMimeWords(String(raw ?? ''))
    .replace(/\s+/g, ' ')
    .trim()
  if (!s) return ''
  if (/^(nil|null|n\/a|none|undefined|-|—|–)$/i.test(s)) return ''
  return s.slice(0, 300)
}

/** Nature (subject) column value — exact mail subject, or NIL if none. */
export function natureFromMailSubject(subject: string): string {
  return normalizeMailSubject(subject) || 'NIL'
}

const KEYWORD_NATURES = new Set<string>([...COMPLAINT_NATURES, 'NIL', '—', '-'])

/**
 * For mail-sourced complaints: Nature must equal mail subject (or NIL).
 * Fixes older rows where Nature was a keyword or truncated on save.
 */
export function syncNatureWithMailSubject(c: MisComplaint): MisComplaint {
  const channel = String(c.channel ?? '').toLowerCase()
  const isMail = c.source === 'inbox' || channel === 'email' || channel === 'mail' || !!c.emailId
  if (!isMail) {
    const n = String(c.nature ?? '').trim()
    if (!n) return { ...c, nature: 'NIL' }
    return c
  }

  let subject = normalizeMailSubject(c.subject || '')
  const curNature = String(c.nature ?? '').trim()
  // If subject missing but Nature holds a full subject (not a short keyword), recover it
  if (!subject && curNature && curNature !== 'NIL' && !KEYWORD_NATURES.has(curNature) && curNature.length > 2) {
    subject = normalizeMailSubject(curNature)
  }
  const nature = subject || 'NIL'
  return { ...c, subject: subject || '', nature }
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

function guessClient(clientName: string, clients: MisClient[]): MisClient | null {
  const norm = clientName.trim().toUpperCase()
  return clients.find((c) => c.name.trim().toUpperCase() === norm) || null
}

function parseEmailDate(raw?: string): string {
  if (!raw) return new Date().toISOString().slice(0, 10)
  const d = new Date(raw)
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return new Date().toISOString().slice(0, 10)
}

function parseEmailDateTime(raw?: string): string {
  if (!raw) return new Date().toISOString()
  const d = new Date(raw)
  if (!Number.isNaN(d.getTime())) return d.toISOString()
  return new Date().toISOString()
}

function reportedByFromSignature(from: string, body: string): string {
  const fromName = String(from ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/"/g, '')
    .trim()
  const lines = String(body ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  // Prefer last non-empty lines that look like a sign-off name
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 8); i--) {
    const line = lines[i]
    if (/^(regards|thanks|thank you|sincerely|best|warm regards)[,!.]?$/i.test(line)) continue
    if (/^--/.test(line)) continue
    if (line.length >= 3 && line.length <= 60 && !/@/.test(line) && !/https?:/i.test(line)) {
      return line.slice(0, 80)
    }
  }
  return fromName.slice(0, 80) || 'Client email'
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

  const subject = normalizeMailSubject(item.subject ?? '')
  const body = String(item.body ?? '').slice(0, 4000)
  if (!looksLikeComplaintEmail(subject, body)) {
    return { ok: true, skipped: true, reason: 'Not a client complaint/incident email' }
  }

  if (!isAllowedDirectorInboxEmail(item)) {
    return { ok: true, skipped: true, reason: 'Not addressed to director@agilegroup.co.in' }
  }

  if (!isFromClientSender(item.from)) {
    return { ok: true, skipped: true, reason: 'Not from a client (internal / system mail skipped)' }
  }

  const [clients, branches] = await Promise.all([getClients(), getBranches()])
  const clientName = extractClientName(subject, body, clients)
  const matched = guessClient(clientName, clients)
  const branchId = matched?.branchId || ''
  const location = matched?.location || ''
  const mailReceivedAt = parseEmailDateTime(item.date)
  const now = new Date().toISOString()
  const code = await nextComplaintCode(clientName || 'XXX', mailReceivedAt)
  /** Nature column = exact mail subject; empty subject → NIL */
  const nature = natureFromMailSubject(subject)

  const complaint: MisComplaint = {
    id: nid('cmp'),
    code,
    branchId: branchId || '',
    clientName,
    location,
    incidentDate: parseEmailDate(item.date),
    type: 'Client',
    nature,
    description: body.slice(0, 2000),
    actionTaken: '',
    assignedTo: '',
    resolvedOn: '',
    completionReportSentOn: '',
    momWithin24h: false,
    status: 'Open',
    reportedBy: reportedByFromSignature(item.from, body),
    source: 'inbox',
    channel: 'Email',
    emailId,
    fromEmail: String(item.from ?? '').slice(0, 120),
    subject,
    importedAt: now,
    registeredAt: mailReceivedAt,
    mailReceivedAt,
    active: true,
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

function defaultClientComplaintGmailQuery(): string {
  return [
    `newer_than:60d`,
    `to:${DIRECTOR_INBOX}`,
    `(`,
    `fire OR incident OR shortage OR shortages OR theft OR missing OR sleeping OR accident`,
    `OR "left the post" OR "left post"`,
    `)`,
  ].join(' ')
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
  if (!token) {
    return {
      ok: false,
      skipped: true,
      error: 'Gmail not configured (set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN)',
    }
  }

  const q = encodeURIComponent(process.env.MIS_COMPLAINT_GMAIL_QUERY?.trim() || defaultClientComplaintGmailQuery())
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=80`,
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
      subject: normalizeMailSubject(getH('Subject')),
      body: decodeGmailBody(msg.payload || {}).slice(0, 4000),
      date: internal,
      to: getH('To'),
      cc: getH('Cc'),
    })
  }

  const allowed = payloads.filter((p) => isAllowedDirectorInboxEmail(p) && isFromClientSender(p.from))
  const result = await ingestComplaintEmails(allowed)
  return {
    ok: true,
    imported: result.imported,
    scanned: allowed.length,
    skippedPersonal: payloads.length - allowed.length,
  }
}

/** Like Fleet expense refresh — Apps Script webapp first, then Gmail OAuth. */
export async function refreshClientComplaintInbox(): Promise<{
  ok: boolean
  imported: number
  scanned: number
  skipped?: boolean
  purged?: number
  error?: string
  natureFixed?: number
  mode?: 'webapp' | 'oauth' | 'ingest-only'
}> {
  const url = process.env.MIS_COMPLAINT_SYNC_WEBAPP_URL?.trim()
  if (url) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(28000) })
      const text = await res.text()
      try {
        const j = JSON.parse(text) as { ok?: boolean; imported?: number; scanned?: number; error?: string }
        if (j.ok !== false) {
          const purged = await purgeNonClientInboxComplaints()
          const natureFixed = await repairComplaintNatureSubjects()
          return {
            ok: true,
            imported: j.imported || 0,
            scanned: j.scanned || 0,
            purged,
            natureFixed,
            mode: 'webapp',
          }
        }
      } catch {
        if (res.ok) {
          const purged = await purgeNonClientInboxComplaints()
          const natureFixed = await repairComplaintNatureSubjects()
          return { ok: true, imported: 0, scanned: 0, purged, natureFixed, mode: 'webapp' }
        }
      }
    } catch {
      /* fall through to OAuth */
    }
  }

  const oauth = await syncComplaintsFromGmail()
  if (oauth.ok) {
    const purged = await purgeNonClientInboxComplaints()
    const natureFixed = await repairComplaintNatureSubjects()
    return {
      ok: true,
      imported: oauth.imported || 0,
      scanned: oauth.scanned || 0,
      purged,
      natureFixed,
      mode: 'oauth',
    }
  }

  if (process.env.MIS_COMPLAINT_INGEST_SECRET?.trim()) {
    return {
      ok: false,
      imported: 0,
      scanned: 0,
      mode: 'ingest-only',
      skipped: true,
      error: oauth.error || 'Director Google script runs every 30 min — tap Mail sync again after it runs',
    }
  }

  return {
    ok: false,
    imported: 0,
    scanned: 0,
    skipped: true,
    mode: 'ingest-only',
    error: oauth.error || 'Director inbox not linked — Gmail OAuth or Google script needed',
  }
}

export async function assignInboxComplaintToBranch(complaintId: string, branchId: string): Promise<boolean> {
  const inbox = await getDirectorInboxComplaints()
  const idx = inbox.findIndex((c) => c.id === complaintId)
  if (idx < 0) return false
  const [item] = inbox.splice(idx, 1)
  item.branchId = branchId
  if (!item.code) {
    item.code = await nextComplaintCode(
      item.clientName || 'XXX',
      item.mailReceivedAt || item.registeredAt || item.incidentDate,
    )
  }
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
  const branches = await getMisReportBranches(true)
  if (!branches.some((b) => b.id === branchId)) return { ok: false, error: 'Invalid branch' }

  const description = String(input.description ?? '').trim()
  if (description.length < 10) return { ok: false, error: 'Please describe the complaint (at least 10 characters)' }

  const nature = String(input.nature ?? '').trim()
  if (!nature || !isComplaintNature(nature)) {
    return { ok: false, error: 'Please select the nature of complaint' }
  }

  const now = new Date().toISOString()
  const clientName = String(input.clientName ?? '').slice(0, 160) || 'Client'
  const code = await nextComplaintCode(clientName, now)
  const phone = String(input.phone ?? '').trim()
  const email = String(input.email ?? '').trim()
  const reportedBy = String(input.reportedBy ?? '').trim() || (phone ? `Tel: ${phone}` : 'Web form')

  const complaint: MisComplaint = {
    id: nid('cmp'),
    code,
    branchId,
    clientName,
    location: String(input.location ?? '').slice(0, 160),
    incidentDate: now.slice(0, 10),
    type: String(input.type ?? 'Client').slice(0, 20),
    nature,
    description: description.slice(0, 2000),
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
    mailReceivedAt: now,
    importedAt: now,
    active: true,
  }

  const list = await getComplaints(branchId)
  list.unshift(complaint)
  await saveComplaints(branchId, list)
  const branch = branches.find((b) => b.id === branchId)
  return { ok: true, complaint, branchName: branch?.name || '' }
}

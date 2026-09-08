/**
 * One WhatsApp group per ops branch for that branch’s guards.
 * Name style: AGILE-CHENNAI (Chennai). Hyderabad-A / B / Hi-Tech stay separate.
 * List path stays light (Redis only) so the page does not sit on “Loading…”.
 */
import type { MisUser } from '../mis/store.js'
import { redisCommand } from '../pulse/store.js'

const STORE_KEY = 'guards:wa-branch-groups'
const PUBLIC_HOST = 'https://www.agilegroup-digital.co.in'
/** Director / Recruitment WhatsApp — every branch group includes this number. */
export const DIRECTOR_BRANCH_GROUP_MOBILE = '919441009091'
/** Blocked by WhatsApp — never add or seed this number. */
const BLOCKED_GROUP_MOBILES = new Set(['917893692345', '7893692345'])
export const STAFF_GROUP_SUBJECT = 'AGILE-STAFF'
export const STAFF_STORE_KEY = 'staff'
export const STAFF_BRANCH_ID = 'STAFF'
/** WhatsApp blocked 2345 and then 9091 after the unofficial computer link. Do not reconnect. */
export const WA_GROUP_AUTOMATION_HALTED = true
export const WA_GROUP_HALT_MESSAGE =
  'WhatsApp is reviewing 9441009091 for 24 hours. Group create is stopped. Do not tap Connect. Use the phone only as a normal WhatsApp.'
const UNOFFICIAL_LOGOUT_KEY = 'guards:wa-unofficial-logged-out'

export async function disconnectUnofficialWhatsAppOnce(): Promise<void> {
  try {
    await redisCommand(['SET', UNOFFICIAL_LOGOUT_KEY, new Date().toISOString()])
    /* Do not waLogout(). Pulse news groups use the same WhatsApp session. */
  } catch {
    /* leftover create actions still refuse */
  }
}

export type StoredBranchWaGroup = {
  branch: string
  subject: string
  groupId: string
  inviteUrl: string
  createdAt: string
  updatedAt: string
  lastAdded: number
  addCursor?: number
  guardsFilled?: boolean
}

export type BranchWaGroupRow = {
  branchId: string
  branchName: string
  subject: string
  guardCount: number
  logoUrl: string
  groupId: string
  inviteUrl: string
  status: 'ready' | 'missing'
}

export function agileBranchGroupSubject(branchName: string): string {
  const slug = String(branchName || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()
  return slug ? `AGILE-${slug}` : ''
}

export function storeKey(branchName: string): string {
  return String(branchName || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
}

export function branchGroupLogoPath(branchName: string): string {
  if (/chennai/i.test(String(branchName || ''))) return '/agile-chennai-group-logo.png'
  return ''
}

export function branchGroupLogoUrl(branchName: string): string {
  const path = branchGroupLogoPath(branchName)
  return path ? `${PUBLIC_HOST}${path}` : ''
}

function skipBranch(name: string): boolean {
  const k = storeKey(name)
  if (!k || k === 'other') return true
  return /corporate-office|training-academy|training-department|recruitment|it-department/.test(k)
}

async function loadStore(): Promise<Record<string, StoredBranchWaGroup>> {
  try {
    const res = await redisCommand(['GET', STORE_KEY])
    const raw = res?.result
    if (!raw || typeof raw !== 'string') return {}
    const parsed = JSON.parse(raw) as Record<string, StoredBranchWaGroup>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function saveStore(map: Record<string, StoredBranchWaGroup>): Promise<void> {
  await redisCommand(['SET', STORE_KEY, JSON.stringify(map)])
}

export async function listBranchWaGroupRows(opts: {
  branches: { id: string; name: string }[]
  misUsers: MisUser[]
  onlyBranchId?: string | null
  includeStaff?: boolean
}): Promise<BranchWaGroupRow[]> {
  const store = await loadStore()
  let branches = opts.branches.filter((b) => !skipBranch(b.name))
  if (opts.onlyBranchId && opts.onlyBranchId !== STAFF_BRANCH_ID) {
    branches = branches.filter(
      (b) => b.id === opts.onlyBranchId || storeKey(b.name) === storeKey(String(opts.onlyBranchId)),
    )
  }
  const rows = branches
    .map((b) => {
      const stored = store[storeKey(b.name)]
      return {
        branchId: b.id,
        branchName: b.name,
        subject: agileBranchGroupSubject(b.name),
        guardCount: stored?.lastAdded || 0,
        logoUrl: branchGroupLogoPath(b.name),
        groupId: stored?.groupId || '',
        inviteUrl: stored?.inviteUrl || '',
        status: stored?.groupId ? ('ready' as const) : ('missing' as const),
      }
    })
    .sort((a, b) => a.branchName.localeCompare(b.branchName))
  if (opts.includeStaff && (!opts.onlyBranchId || opts.onlyBranchId === STAFF_BRANCH_ID)) {
    const staff = store[STAFF_STORE_KEY]
    rows.unshift({
      branchId: STAFF_BRANCH_ID,
      branchName: 'Staff',
      subject: STAFF_GROUP_SUBJECT,
      guardCount: staff?.lastAdded || 0,
      logoUrl: '',
      groupId: staff?.groupId || '',
      inviteUrl: staff?.inviteUrl || '',
      status: staff?.groupId ? ('ready' as const) : ('missing' as const),
    })
  }
  return rows
}

function waDigits(raw: string, whatsappChatId: (s: string) => string): string {
  const id = whatsappChatId(raw)
  if (id.length === 12 && id.startsWith('91')) return id
  if (id.length >= 11 && id.length <= 15) return id
  return ''
}

function pickGroupId(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  const nested = o.group && typeof o.group === 'object' ? (o.group as Record<string, unknown>) : null
  return String(o.id || o.group_id || o.groupId || nested?.id || nested?.group_id || '').trim()
}

function pickInvite(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  const link = String(o.invite_link || o.inviteLink || o.link || '').trim()
  if (link.startsWith('http')) return link
  const code = String(o.invite_code || o.inviteCode || '').trim()
  return code ? `https://chat.whatsapp.com/${code}` : ''
}

function pushPhone(
  raw: string,
  wa: typeof import('../pulse/whatsapp.js'),
  seen: Set<string>,
  out: string[],
) {
  const d = waDigits(raw, wa.whatsappChatId)
  if (!d || wa.isItBlockedWhatsApp(d) || seen.has(d)) return
  if (d === DIRECTOR_BRANCH_GROUP_MOBILE) return
  if (BLOCKED_GROUP_MOBILES.has(d) || d.endsWith('7893692345')) return
  seen.add(d)
  out.push(d)
}

async function guardPhones(
  branchId: string,
  branchName: string,
  wa: typeof import('../pulse/whatsapp.js'),
): Promise<string[]> {
  const seen = new Set<string>()
  const out: string[] = []
  try {
    const { getGuardDocs } = await import('../mis/store.js')
    const docs = await getGuardDocs(branchId)
    for (const g of docs) {
      if (g.active === false || !g.mobile) continue
      pushPhone(g.mobile, wa, seen, out)
    }
  } catch {
    /* keep roster fallback */
  }
  try {
    const { canonicalizeBranch, getGuardsDataSnapshot } = await import('../guards-data/roster.js')
    const snap = await getGuardsDataSnapshot()
    const people = snap
      ? snap.byBranch[canonicalizeBranch(branchName)] || snap.byBranch[branchName] || []
      : []
    for (const p of people) {
      if (!p.mobile || !p.name) continue
      pushPhone(p.mobile, wa, seen, out)
    }
  } catch {
    /* ignore */
  }
  return out
}

async function addInBatches(
  wa: typeof import('../pulse/whatsapp.js'),
  id: string,
  mobiles: string[],
  maxChunks = 4,
): Promise<{ added: number; remaining: number }> {
  const CHUNK = 8
  const list = mobiles.slice(0, CHUNK * maxChunks)
  let added = 0
  for (let i = 0; i < list.length; i += CHUNK) {
    const chunk = list.slice(i, i + CHUNK)
    const res = await wa.waAddGroupParticipants(id, chunk)
    if (res?.ok) added += chunk.length
    if (i + CHUNK < list.length) await new Promise((r) => setTimeout(r, 400))
  }
  return { added, remaining: Math.max(0, mobiles.length - list.length) }
}

export async function forgetStoredBranchWaGroups(): Promise<void> {
  await saveStore({})
}

async function requireLinked9091(wa: typeof import('../pulse/whatsapp.js')): Promise<{ ok: true } | { ok: false; error: string }> {
  const link = await wa.waLinkStatus()
  if (link.phoneLast4 === '9091') return { ok: true }
  return {
    ok: false,
    error: 'WhatsApp is not connected as 9441009091 yet. Tap Connect 9441009091 first.',
  }
}

export async function createOrUpdateBranchWaGroup(opts: {
  branchId: string
  branchName: string
  branches: { id: string; name: string }[]
  misUsers: MisUser[]
  createIfMissing: boolean
}): Promise<{
  ok: boolean
  error?: string
  row?: BranchWaGroupRow
  added?: number
  remaining?: number
  created?: boolean
  addGuards?: boolean
}> {
  if (WA_GROUP_AUTOMATION_HALTED) {
    await disconnectUnofficialWhatsAppOnce()
    return { ok: false, error: WA_GROUP_HALT_MESSAGE }
  }
  const wa = await import('../pulse/whatsapp.js')
  if (!wa.whatsappConfigured()) {
    return { ok: false, error: 'WhatsApp is not connected on the server.' }
  }
  const linked = await requireLinked9091(wa)
  if (!linked.ok) return linked
  const subject = agileBranchGroupSubject(opts.branchName)
  if (!subject) return { ok: false, error: 'Branch name missing.' }
  const ops = storeKey(opts.branchName)
  if (skipBranch(opts.branchName)) return { ok: false, error: 'This branch is not an ops city group.' }

  const store = await loadStore()
  let rec = store[ops]
  let groupId = rec?.groupId || ''

  if (!groupId && opts.createIfMissing) {
    const seed = [DIRECTOR_BRANCH_GROUP_MOBILE]
    let created: Awaited<ReturnType<typeof wa.waCreateGroup>> = null
    created = await wa.waCreateGroup(subject, seed)
    groupId = pickGroupId(created?.data)
    if (!created?.ok || !groupId) {
      return { ok: false, error: 'WhatsApp could not create the group. Check that 9441009091 WhatsApp is connected, then try again.' }
    }
    const logo = branchGroupLogoUrl(opts.branchName)
    if (logo) await wa.waSetGroupIcon(groupId, logo, 'image/png')
    await wa.waSendText(
      groupId,
      `*${subject}*\n\nThis group is for ${opts.branchName} branch guards.\n\n— Agile Security Force`,
    )
    rec = {
      branch: ops,
      subject,
      groupId,
      inviteUrl: pickInvite(created.data),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAdded: 0,
    }
    store[ops] = rec
    await saveStore(store)
    const rows = await listBranchWaGroupRows({
      branches: opts.branches,
      misUsers: opts.misUsers,
      onlyBranchId: opts.branchId,
    })
    return { ok: true, row: rows[0], added: rec.lastAdded, remaining: 0, created: true, addGuards: true }
  }

  if (!groupId) {
    return { ok: false, error: 'Group is not created yet. Tap Create group first.' }
  }

  if (branchGroupLogoUrl(opts.branchName)) {
    await wa.waSetGroupIcon(groupId, branchGroupLogoUrl(opts.branchName), 'image/png')
  }
  const phones = await guardPhones(opts.branchId, opts.branchName, wa)
  if (!phones.length) {
    rec = rec || {
      branch: ops,
      subject,
      groupId,
      inviteUrl: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAdded: 0,
    }
    rec.guardsFilled = true
    rec.updatedAt = new Date().toISOString()
    store[ops] = rec
    await saveStore(store)
    const emptyRows = await listBranchWaGroupRows({
      branches: opts.branches,
      misUsers: opts.misUsers,
      onlyBranchId: opts.branchId,
    })
    return { ok: true, row: emptyRows[0], added: 0, remaining: 0, created: false, addGuards: false }
  }
  const offset = rec?.addCursor || 0
  const batch = await addInBatches(wa, groupId, phones.slice(offset))
  rec = rec || {
    branch: ops,
    subject,
    groupId,
    inviteUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAdded: 0,
  }
  rec.groupId = groupId
  rec.subject = subject
  rec.lastAdded = (rec.lastAdded || 0) + batch.added
  rec.addCursor = offset + phones.slice(offset).length - batch.remaining
  rec.guardsFilled = rec.addCursor >= phones.length
  rec.updatedAt = new Date().toISOString()
  store[ops] = rec
  await saveStore(store)

  const rows = await listBranchWaGroupRows({
    branches: opts.branches,
    misUsers: opts.misUsers,
    onlyBranchId: opts.branchId,
  })
  return { ok: true, row: rows[0], added: batch.added, remaining: batch.remaining, created: false, addGuards: false }
}

export async function createNextMissingBranchWaGroup(opts: {
  branches: { id: string; name: string }[]
  misUsers: MisUser[]
}): Promise<{
  ok: boolean
  error?: string
  done?: boolean
  subject?: string
  branchName?: string
  rows?: BranchWaGroupRow[]
  created?: boolean
}> {
  const rows = await listBranchWaGroupRows({ branches: opts.branches, misUsers: opts.misUsers, includeStaff: true })
  const next = rows.find((r) => r.status === 'missing')
  if (!next) return { ok: true, done: true, rows }
  const result =
    next.branchId === STAFF_BRANCH_ID
      ? await createOrUpdateStaffWaGroup({
          branches: opts.branches,
          misUsers: opts.misUsers,
          createIfMissing: true,
        })
      : await createOrUpdateBranchWaGroup({
          branchId: next.branchId,
          branchName: next.branchName,
          branches: opts.branches,
          misUsers: opts.misUsers,
          createIfMissing: true,
        })
  const after = await listBranchWaGroupRows({ branches: opts.branches, misUsers: opts.misUsers, includeStaff: true })
  if (!result.ok) return { ok: false, error: result.error, subject: next.subject, branchName: next.branchName, rows: after }
  return {
    ok: true,
    done: false,
    subject: next.subject,
    branchName: next.branchName,
    rows: after,
    created: true,
  }
}

export async function addGuardsNextBranchWaGroup(opts: {
  branches: { id: string; name: string }[]
  misUsers: MisUser[]
}): Promise<{
  ok: boolean
  error?: string
  done?: boolean
  subject?: string
  branchName?: string
  added?: number
  remaining?: number
  rows?: BranchWaGroupRow[]
}> {
  const store = await loadStore()
  const rows = await listBranchWaGroupRows({ branches: opts.branches, misUsers: opts.misUsers })
  const next = rows.find((r) => {
    if (r.status !== 'ready') return false
    const rec = store[storeKey(r.branchName)]
    return !rec?.guardsFilled
  })
  if (!next) {
    return { ok: true, done: true, rows: await listBranchWaGroupRows({ branches: opts.branches, misUsers: opts.misUsers, includeStaff: true }) }
  }
  const result = await createOrUpdateBranchWaGroup({
    branchId: next.branchId,
    branchName: next.branchName,
    branches: opts.branches,
    misUsers: opts.misUsers,
    createIfMissing: false,
  })
  const after = await listBranchWaGroupRows({ branches: opts.branches, misUsers: opts.misUsers, includeStaff: true })
  if (!result.ok) return { ok: false, error: result.error, subject: next.subject, branchName: next.branchName, rows: after }
  return {
    ok: true,
    done: false,
    subject: next.subject,
    branchName: next.branchName,
    added: result.added,
    remaining: result.remaining,
    rows: after,
  }
}

async function staffPhones(
  misUsers: MisUser[],
  wa: typeof import('../pulse/whatsapp.js'),
): Promise<string[]> {
  const { getOpsStaff, getDeptStaff } = await import('./store.js')
  const [ops, dept] = await Promise.all([getOpsStaff(), getDeptStaff()])
  const seen = new Set<string>()
  const out: string[] = []
  for (const u of misUsers) {
    if (u.active === false) continue
    const role = String(u.role || '').toLowerCase()
    if (role.includes('guard')) continue
    if (
      role.includes('hod') ||
      role.includes('head') ||
      role.includes('manager') ||
      role.includes('officer') ||
      role.includes('admin') ||
      role.includes('director')
    ) {
      pushPhone(u.phone || '', wa, seen, out)
    }
  }
  for (const s of ops) {
    if (s.active === false) continue
    pushPhone(s.whatsApp || s.mobile, wa, seen, out)
  }
  for (const s of dept) {
    if (s.active === false) continue
    pushPhone(s.mobile, wa, seen, out)
  }
  return out
}

export async function createOrUpdateStaffWaGroup(opts: {
  branches: { id: string; name: string }[]
  misUsers: MisUser[]
  createIfMissing: boolean
}): Promise<{
  ok: boolean
  error?: string
  row?: BranchWaGroupRow
  added?: number
  remaining?: number
  created?: boolean
  addGuards?: boolean
}> {
  if (WA_GROUP_AUTOMATION_HALTED) {
    await disconnectUnofficialWhatsAppOnce()
    return { ok: false, error: WA_GROUP_HALT_MESSAGE }
  }
  const wa = await import('../pulse/whatsapp.js')
  if (!wa.whatsappConfigured()) {
    return { ok: false, error: 'WhatsApp is not connected on the server.' }
  }
  const linked = await requireLinked9091(wa)
  if (!linked.ok) return linked
  const store = await loadStore()
  let rec = store[STAFF_STORE_KEY]
  let groupId = rec?.groupId || ''
  if (!groupId && opts.createIfMissing) {
    const seed = [DIRECTOR_BRANCH_GROUP_MOBILE]
    const created = await wa.waCreateGroup(STAFF_GROUP_SUBJECT, seed)
    groupId = pickGroupId(created?.data)
    if (!created?.ok || !groupId) {
      return { ok: false, error: 'WhatsApp could not create AGILE-STAFF. Try again in a minute.' }
    }
    await wa.waSendText(
      groupId,
      `*${STAFF_GROUP_SUBJECT}*\n\nThis group is for Agile office staff only. Guards stay in their branch groups.\n\n— Agile Security Force`,
    )
    rec = {
      branch: STAFF_STORE_KEY,
      subject: STAFF_GROUP_SUBJECT,
      groupId,
      inviteUrl: pickInvite(created.data),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAdded: 0,
    }
    store[STAFF_STORE_KEY] = rec
    await saveStore(store)
  }
  if (!groupId) {
    return { ok: false, error: 'AGILE-STAFF is not created yet. Tap Create group on the Staff row first.' }
  }
  const phones = await staffPhones(opts.misUsers, wa)
  const offset = rec?.addCursor || 0
  const batch = phones.length ? await addInBatches(wa, groupId, phones.slice(offset)) : { added: 0, remaining: 0 }
  rec = rec || {
    branch: STAFF_STORE_KEY,
    subject: STAFF_GROUP_SUBJECT,
    groupId,
    inviteUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAdded: 0,
  }
  rec.groupId = groupId
  rec.subject = STAFF_GROUP_SUBJECT
  rec.lastAdded = (rec.lastAdded || 0) + batch.added
  rec.addCursor = offset + Math.max(0, phones.slice(offset).length - batch.remaining)
  rec.guardsFilled = rec.addCursor >= phones.length
  rec.updatedAt = new Date().toISOString()
  store[STAFF_STORE_KEY] = rec
  await saveStore(store)
  const rows = await listBranchWaGroupRows({
    branches: opts.branches,
    misUsers: opts.misUsers,
    includeStaff: true,
    onlyBranchId: STAFF_BRANCH_ID,
  })
  return {
    ok: true,
    row: rows[0],
    added: batch.added,
    remaining: batch.remaining,
    created: Boolean(opts.createIfMissing && !offset),
    addGuards: Boolean(opts.createIfMissing),
  }
}

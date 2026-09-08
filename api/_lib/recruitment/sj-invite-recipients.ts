/**
 * WhatsApp invitation recipients — HOD names + Recruitment department.
 * Always copy Director and 9500915599 (app). Does not change Recruitment reports.
 */
import { isHodUser } from '../mis/digest.js'
import { getMisReportBranches, getUsers as getMisUsers, type MisUser } from '../mis/store.js'
import { adminWhatsAppPhone, whatsappChatId } from '../pulse/whatsapp.js'
import { getUsers as getRecruitUsers, type RecruitUser } from './store.js'

export const SJ_INVITE_APP_COPY = '919500915599'

export type SjInviteRecipient = {
  id: string
  label: string
  group: 'recruitment' | 'hod'
  mobiles: string[]
}

const KNOWN_HODS: { email: string; name: string; branch: string }[] = [
  { email: 'aashish@agilegroup.co.in', name: 'Aashish', branch: 'Hyderabad-A' },
  { email: 'munawar.salim@agilegroup.co.in', name: 'Munawar Salim', branch: 'Hyderabad-B' },
  { email: 'sridhar.m@agilegroup.co.in', name: 'Sridhar M.', branch: 'Hi-Tech City' },
  { email: 'areamanager@agilegroup.co.in', name: 'Area Manager', branch: 'Hi-Tech City' },
  { email: 'maha.admin@agilegroup.co.in', name: 'Vikram', branch: 'Mumbai' },
  { email: 'cochin@agilegroup.co.in', name: 'Joykumar', branch: 'Kochi' },
]

function ten(raw: string): string {
  const d = String(raw || '').replace(/\D/g, '')
  if (d.length >= 12 && d.startsWith('91')) return d.slice(-10)
  return d.slice(-10)
}

function waId(raw: string): string {
  const d = ten(raw)
  return d.length >= 10 ? whatsappChatId(raw) : ''
}

export function sjInviteAlwaysCopyMobiles(): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const add = (raw: string) => {
    const id = waId(raw)
    const d = ten(id)
    if (d.length < 10 || seen.has(d)) return
    seen.add(d)
    out.push(id)
  }
  add(adminWhatsAppPhone())
  add(SJ_INVITE_APP_COPY)
  return out
}

function looksHod(u: { role?: string; userType?: string; active?: boolean; name?: string }): boolean {
  if (u.active === false || !String(u.name || '').trim()) return false
  const role = String(u.role || '').toLowerCase()
  const ut = String(u.userType || '').toLowerCase()
  if (ut === 'hod') return true
  return (
    role.includes('hod') ||
    role.includes('head of') ||
    role.includes('branch manager') ||
    role.includes('operations manager') ||
    role.includes('operation manager') ||
    role.includes('area manager') ||
    role.includes('regional manager') ||
    role.includes('general manager')
  )
}

function isRecruitmentPerson(u: { branchId?: string; userType?: string; department?: string; role?: string }): boolean {
  const bid = String(u.branchId || '')
  const dept = String(u.department || '')
  const role = String(u.role || '')
  const ut = String(u.userType || '')
  return (
    bid === 'Recruitment Department' ||
    /recruit/i.test(bid) ||
    /recruit/i.test(dept) ||
    /recruit/i.test(role) ||
    ut === 'recruiter'
  )
}

export async function listSjInviteRecipients(): Promise<SjInviteRecipient[]> {
  const [misUsers, branches, recruitUsers] = await Promise.all([
    getMisUsers().catch(() => [] as MisUser[]),
    getMisReportBranches(true).catch(() => [] as { id: string; name: string }[]),
    getRecruitUsers().catch(() => [] as RecruitUser[]),
  ])
  const branchName = (id: string) => {
    const hit = branches.find((b) => b.id === id || b.name === id)
    return hit?.name || id || ''
  }

  const recMobiles: string[] = []
  const recSeen = new Set<string>()
  const addRec = (raw: string) => {
    const id = waId(raw)
    const d = ten(id)
    if (d.length < 10 || recSeen.has(d)) return
    recSeen.add(d)
    recMobiles.push(id)
  }
  for (const u of recruitUsers) {
    if (u.active === false) continue
    if (isRecruitmentPerson(u)) addRec(u.mobile)
  }
  for (const u of misUsers) {
    if (u.active === false) continue
    if (isRecruitmentPerson(u)) addRec(u.phone)
  }

  const out: SjInviteRecipient[] = [
    {
      id: 'recruitment',
      label: 'Recruitment department',
      group: 'recruitment',
      mobiles: recMobiles,
    },
  ]

  const seenKey = new Set<string>()
  const addHod = (id: string, name: string, branch: string, mobile: string) => {
    const label = `${name || 'HOD'}${branch ? ` — ${branch}` : ''}`
    const key = `${String(name || '').trim().toLowerCase()}|${String(branch || '').trim().toLowerCase()}`
    if (!name.trim() || seenKey.has(key)) {
      const existing = out.find((r) => r.id !== 'recruitment' && `${r.label}`.toLowerCase() === label.toLowerCase())
      if (existing && mobile && !existing.mobiles.length) existing.mobiles = [waId(mobile)].filter(Boolean)
      return
    }
    seenKey.add(key)
    const wa = waId(mobile)
    out.push({
      id,
      label,
      group: 'hod',
      mobiles: wa ? [wa] : [],
    })
  }

  for (const u of misUsers) {
    if (!looksHod(u) && !isHodUser(u)) continue
    addHod(`hod:${u.id || u.email}`, u.name, branchName(u.branchId), u.phone)
  }
  for (const u of recruitUsers) {
    if (u.active === false || u.userType !== 'hod') continue
    if (isRecruitmentPerson(u)) continue
    addHod(`rh:${u.id}`, u.name, branchName(u.branchId) || u.branchId, u.mobile)
  }
  for (const seed of KNOWN_HODS) {
    const match =
      misUsers.find((u) => String(u.email || '').toLowerCase() === seed.email) ||
      recruitUsers.find((u) => String(u.email || '').toLowerCase() === seed.email)
    addHod(
      `seed:${seed.email}`,
      seed.name,
      seed.branch,
      match && 'phone' in match ? String(match.phone || '') : String((match as RecruitUser | undefined)?.mobile || ''),
    )
  }

  const hods = out.filter((r) => r.group === 'hod').sort((a, b) => a.label.localeCompare(b.label))
  return [out[0], ...hods]
}

export function mobilesForInviteRecipient(
  recipients: SjInviteRecipient[],
  toId: string,
): string[] {
  const hit = recipients.find((r) => r.id === toId)
  return hit?.mobiles?.length ? [...hit.mobiles] : []
}

export function publicInviteRecipients(list: SjInviteRecipient[]) {
  return list.map((r) => ({
    id: r.id,
    label: r.label,
    group: r.group,
    hasMobile: r.mobiles.length > 0,
  }))
}

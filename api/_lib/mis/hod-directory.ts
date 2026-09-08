/**
 * Known branch HOD emails — merged into User Management on each reminder run.
 */
import { normaliseEmail } from '../auth.js'
import { getMisReportBranches, getUsers, nid, saveUsers, type MisBranch, type MisUser } from './store.js'

type HodSeed = { email: string; name: string; branchMatch: RegExp; role: string }

const TELANGANA_HODS: HodSeed[] = [
  {
    email: 'aashish@agilegroup.co.in',
    name: 'Aashish',
    branchMatch: /hyderabad-a/i,
    role: 'Operations Manager',
  },
  {
    email: 'munawar.salim@agilegroup.co.in',
    name: 'Munawar Salim',
    branchMatch: /hyderabad-b/i,
    role: 'Operations Manager',
  },
  {
    email: 'sridhar.m@agilegroup.co.in',
    name: 'Sridhar M.',
    branchMatch: /hi-?tech/i,
    role: 'Branch Manager',
  },
  {
    email: 'areamanager@agilegroup.co.in',
    name: 'Area Manager',
    branchMatch: /hi-?tech/i,
    role: 'Area Manager',
  },
]

const OTHER_HOD_SEEDS: HodSeed[] = [
  {
    email: 'maha.admin@agilegroup.co.in',
    name: 'Vikram',
    branchMatch: /^mumbai$/i,
    role: 'Branch Manager',
  },
  {
    email: 'cochin@agilegroup.co.in',
    name: 'Joykumar',
    branchMatch: /^kochi$/i,
    role: 'Branch Manager',
  },
  {
    email: 'vp.blr@agilegroup.co.in',
    name: 'Prathap Kumar',
    branchMatch: /^bangalore$|^bengaluru$/i,
    role: 'Branch Manager',
  },
  {
    email: 'ahmad.salman@agilegroup.co.in',
    name: 'Ahmad Salman',
    branchMatch: /^bhopal/i,
    role: 'Branch Manager',
  },
  {
    email: 'selvam.k@agilegroup.co.in',
    name: 'Col. Selvam',
    branchMatch: /^chennai$/i,
    role: 'Branch Manager',
  },
  {
    email: 'sid@agilegroup.co.in',
    name: 'Siddharth',
    branchMatch: /^vijayawada$/i,
    role: 'Branch Manager',
  },
  {
    email: 'sanjay.singh@agilegroup.co.in',
    name: 'Sanjay Singh',
    branchMatch: /^surat$/i,
    role: 'Branch Manager',
  },
  {
    email: 'cgm.vizag@agilegroup.co.in',
    name: 'Raghu Ram Raju',
    branchMatch: /^visakhapatnam$|^vizag$/i,
    role: 'Chief General Manager',
  },
]

const KNOWN_HOD_SEEDS: HodSeed[] = [...TELANGANA_HODS, ...OTHER_HOD_SEEDS]

function findBranch(branches: MisBranch[], pattern: RegExp): MisBranch | undefined {
  return branches.find((b) => pattern.test(b.name))
}

/** Upsert known branch HOD emails into MIS User Management (idempotent). */
export async function ensureKnownHodUsers(): Promise<{ ok: boolean; updated: string[] }> {
  const [branches, users] = await Promise.all([getMisReportBranches(true), getUsers()])
  const updated: string[] = []
  let list = [...users]

  for (const seed of KNOWN_HOD_SEEDS) {
    const branch = findBranch(branches, seed.branchMatch)
    if (!branch) continue
    const email = normaliseEmail(seed.email)
    const idx = list.findIndex((u) => normaliseEmail(u.email) === email)
    const row: MisUser = {
      id: idx >= 0 ? list[idx].id : nid('us'),
      name: seed.name,
      email,
      phone: idx >= 0 ? list[idx].phone : '',
      role: seed.role,
      branchId: branch.id,
      active: true,
    }
    if (idx >= 0) {
      if (
        list[idx].branchId !== row.branchId ||
        list[idx].name !== row.name ||
        list[idx].role !== row.role ||
        list[idx].active === false
      ) {
        list[idx] = row
        updated.push(`${row.name} → ${branch.name}`)
      }
    } else {
      list.push(row)
      updated.push(`${row.name} → ${branch.name}`)
    }
  }

  if (updated.length) await saveUsers(list)
  return { ok: true, updated }
}

/** @deprecated use ensureKnownHodUsers */
export const ensureTelanganaHodUsers = ensureKnownHodUsers

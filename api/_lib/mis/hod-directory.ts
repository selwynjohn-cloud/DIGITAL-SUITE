/**
 * Known branch HOD emails — merged into User Management on each reminder run.
 */
import { normaliseEmail } from '../auth.js'
import { getBranches, getUsers, nid, saveUsers, type MisBranch, type MisUser } from './store.js'

const TELANGANA_HODS: { email: string; name: string; branchMatch: RegExp; role: string }[] = [
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

function findBranch(branches: MisBranch[], pattern: RegExp): MisBranch | undefined {
  return branches.find((b) => pattern.test(b.name))
}

/** Upsert Telangana HOD emails into MIS User Management (idempotent). */
export async function ensureTelanganaHodUsers(): Promise<{ ok: boolean; updated: string[] }> {
  const [branches, users] = await Promise.all([getBranches(true), getUsers()])
  const updated: string[] = []
  let list = [...users]

  for (const seed of TELANGANA_HODS) {
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

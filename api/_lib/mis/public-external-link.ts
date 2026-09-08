/**
 * Public MIS external links (HDFC SSA + Site Visit) — all branches.
 * Start at the site (GPS), auto-save draft, continue on a computer with a code.
 */

import { misBranchGroupKey } from './branch-group-key.js'
import { filterClientsForBranch } from './client-branch.js'
import { getBranches, getClients, type MisBranch, type MisClient } from './store.js'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function newPublicResumeCode(): string {
  let out = ''
  for (let i = 0; i < 8; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)] || 'A'
  }
  return out
}

export function normPublicResumeCode(v: unknown): string {
  return String(v || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12)
}

function isHdfcClientName(name: string, location?: string): boolean {
  return /hdfc/i.test(`${name || ''} ${location || ''}`)
}

function branchGroupOf(branchId: string, branches: MisBranch[]): string {
  const b = branches.find((x) => x.id === branchId)
  return misBranchGroupKey(b?.name || branchId || '')
}

function sameOpsBranch(branchId: string, client: MisClient, branches: MisBranch[]): boolean {
  if (client.branchId === branchId) return true
  const want = branchGroupOf(branchId, branches)
  const got = branchGroupOf(client.branchId, branches)
  return Boolean(want && got && want === got)
}

function publicClientRow(c: MisClient) {
  return {
    id: c.id,
    branchId: c.branchId,
    name: c.name,
    location: c.location || '',
    staffName: c.staffName || '',
    sanctionedStrength:
      Number(c.sanA || 0) + Number(c.sanG || 0) + Number(c.sanB || 0) + Number(c.sanC || 0) > 0
        ? String(Number(c.sanA || 0) + Number(c.sanG || 0) + Number(c.sanB || 0) + Number(c.sanC || 0))
        : '',
  }
}

/** Units for one branch, plus same-city book so the dropdown is not empty (every branch). */
export async function listPublicExternalClients(branchId: string, opts?: { hdfcOnly?: boolean }) {
  const branches = await getBranches(true)
  const branch = branches.find((b) => b.id === branchId && b.active !== false)
  if (!branch) return { error: 'Invalid branch.' as const, clients: [] as ReturnType<typeof publicClientRow>[] }
  const scoped = filterClientsForBranch(
    (await getClients(branchId, { skipRepair: true, branches })).filter((c) => c.active !== false),
    branchId,
    branches,
  )
  const seen = new Set(scoped.map((c) => c.id))
  const extra = (await getClients(undefined, { skipRepair: true, branches }))
    .filter((c) => c.active !== false && !seen.has(c.id) && sameOpsBranch(branchId, c, branches))
    .filter((c) => (opts?.hdfcOnly ? isHdfcClientName(c.name || '', c.location || '') : true))
  const merged = [
    ...scoped.filter((c) => (opts?.hdfcOnly ? isHdfcClientName(c.name || '', c.location || '') : true)),
    ...extra,
  ]
  const clients = merged
    .map(publicClientRow)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
  return { branch, clients }
}

/** Fast lookup for auto-save — do not rebuild or write the client book. */
export async function resolvePublicExternalClient(
  branchId: string,
  clientId: string,
  opts?: { hdfcOnly?: boolean },
) {
  const branches = await getBranches(true)
  const branch = branches.find((b) => b.id === branchId && b.active !== false)
  if (!branch) return { error: { status: 400 as const, json: { error: 'Invalid branch.' } } }
  const scoped = (await getClients(branchId, { skipRepair: true, branches })).filter((c) => c.active !== false)
  let raw = scoped.find((c) => c.id === clientId)
  if (!raw) {
    raw = (await getClients(undefined, { skipRepair: true, branches })).find(
      (c) => c.id === clientId && c.active !== false,
    )
    if (raw && !sameOpsBranch(branchId, raw, branches)) raw = undefined
  }
  if (!raw) {
    return {
      error: {
        status: 400 as const,
        json: { error: opts?.hdfcOnly ? 'That HDFC unit is not on this branch list.' : 'That unit is not on this branch list.' },
      },
    }
  }
  if (opts?.hdfcOnly && !isHdfcClientName(raw.name || '', raw.location || '')) {
    return { error: { status: 400 as const, json: { error: 'Select an HDFC unit only.' } } }
  }
  return { branch, client: publicClientRow(raw) }
}

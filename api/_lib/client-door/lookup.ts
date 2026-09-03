/**
 * Client door — email → strategic client sites only.
 */
import { isLeftCompanyEmail, isNoMailRecipientEmail, isSuiteAdminEmail, normaliseEmail } from '../auth.js'
import { isNamedStrategicClient, matchStrategicGroup } from '../mis/strategic-client-names.js'
import { getBranches, getClients, type MisClient } from '../mis/store.js'
import { getClientVisits } from '../mis/client-visit-store.js'
import { loadClientDoorInvite } from './invite.js'
import { loadBookEmailMap, siteIdsForBookEmail } from './books.js'

export const CLIENT_DOOR_APP_ID = 'client-door'
export const CLIENT_DOOR_URL = 'https://www.agilegroup-digital.co.in/client'

export type ClientDoorSite = {
  id: string
  branchId: string
  branchName: string
  name: string
  location: string
  clientEmail: string
  emails: string[]
  groupKey: string
  groupLabel: string
  lastOpenedAt?: string
  lastOpenedLabel?: string
}

export function parseClientEmails(v: unknown): string[] {
  return String(v ?? '')
    .split(/[,;\s]+/)
    .map((e) => normaliseEmail(e))
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && !isLeftCompanyEmail(e))
}

export function clientEmailAllowed(email: string): boolean {
  const em = normaliseEmail(email)
  if (!em || !em.includes('@')) return false
  if (isLeftCompanyEmail(em) || isNoMailRecipientEmail(em)) return false
  return true
}

function siteFromClient(c: MisClient, branchName: string): ClientDoorSite | null {
  if (c.active === false) return null
  const g = matchStrategicGroup(c.name)
  if (!g) return null
  const emails = parseClientEmails(c.clientEmail)
  return {
    id: c.id,
    branchId: c.branchId,
    branchName,
    name: c.name,
    location: c.location,
    clientEmail: emails.join(', '),
    emails,
    groupKey: g.key,
    groupLabel: g.label,
  }
}

export async function listStrategicDoorSites(branchId?: string): Promise<ClientDoorSite[]> {
  const branches = await getBranches(true)
  const nameOf = (id: string) => branches.find((b) => b.id === id)?.name || id
  const all = await getClients(undefined, { skipRepair: true, branches })
  const out: ClientDoorSite[] = []
  for (const c of all) {
    if (branchId && c.branchId !== branchId) continue
    const site = siteFromClient(c, nameOf(c.branchId))
    if (site) out.push(site)
  }
  out.sort((a, b) => {
    const g = a.groupLabel.localeCompare(b.groupLabel)
    if (g) return g
    const br = a.branchName.localeCompare(b.branchName)
    if (br) return br
    return a.name.localeCompare(b.name)
  })
  return out
}

async function fallbackIdsForEmail(email: string): Promise<Set<string>> {
  const em = normaliseEmail(email)
  const ids = new Set<string>()
  try {
    const visits = await getClientVisits()
    for (const v of visits) {
      if (!isNamedStrategicClient(v.clientName)) continue
      if (parseClientEmails(v.clientEmail).includes(em) && v.clientId) ids.add(v.clientId)
    }
  } catch {
    /* keep MD-only */
  }
  return ids
}

/** Director / Sai may open the door to test — HDFC books (state-wise). */
function directorTestSites(all: ClientDoorSite[]): ClientDoorSite[] {
  const hdfc = all.filter((s) => s.groupKey === 'hdfc')
  return hdfc.length ? hdfc : all
}

/** Sites this client email may open. Strategic clients only. */
export async function sitesForClientEmail(email: string): Promise<ClientDoorSite[]> {
  if (!clientEmailAllowed(email)) return []
  const em = normaliseEmail(email)
  const all = await listStrategicDoorSites()
  const extraIds = await fallbackIdsForEmail(em)
  const invite = await loadClientDoorInvite(em)
  for (const id of invite?.clientIds ?? []) extraIds.add(id)
  try {
    const bookMails = await loadBookEmailMap()
    for (const id of siteIdsForBookEmail(all, em, bookMails)) extraIds.add(id)
  } catch {
    /* MD + invite still work */
  }
  const found = all.filter((s) => parseClientEmails(s.clientEmail).includes(em) || extraIds.has(s.id))
  if (found.length) return found
  if (isSuiteAdminEmail(em)) return directorTestSites(all)
  return []
}

export function doorSiteById(sites: ClientDoorSite[], id: string): ClientDoorSite | undefined {
  return sites.find((s) => s.id === id)
}

/**
 * Suggest nearby available guards who are on W.Off for vacant posts.
 */

import { getGuards, rosterForDate } from './store.js'
import type { OpsGuard, OpsPost, OpsRosterSlot } from './types.js'

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const la1 = (aLat * Math.PI) / 180
  const la2 = (bLat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export type NearbySuggestion = {
  guardId: string
  employeeId: string
  guardName: string
  mobile: string
  branchId: string
  rank: string
  skills: string
  distanceKm: number | null
  reason: string
}

export async function suggestNearbyWOff(
  date: string,
  post: OpsPost,
  limit = 8,
): Promise<NearbySuggestion[]> {
  const roster = await rosterForDate(date, post.branchId)
  const woffIds = new Set(roster.filter((r) => r.isWOff).map((r) => r.guardId).filter(Boolean))
  const onDuty = new Set(roster.filter((r) => !r.isWOff).map((r) => r.guardId).filter(Boolean))
  const guards = (await getGuards()).filter((g) => g.status === 'active')

  const candidates: { g: OpsGuard; slot?: OpsRosterSlot; dist: number | null }[] = []
  for (const g of guards) {
    if (onDuty.has(g.id)) continue
    const isWoff = woffIds.has(g.id) || roster.some((r) => r.employeeId && r.employeeId === g.employeeId && r.isWOff)
    const sameBranch = g.branchId === post.branchId
    if (!isWoff && !sameBranch) continue
    let dist: number | null = null
    if (post.lat != null && post.lng != null && g.lat != null && g.lng != null) {
      dist = Math.round(haversineKm(post.lat, post.lng, g.lat, g.lng) * 10) / 10
    }
    candidates.push({ g, dist })
  }

  candidates.sort((a, b) => {
    const aBranch = a.g.branchId === post.branchId ? 0 : 1
    const bBranch = b.g.branchId === post.branchId ? 0 : 1
    if (aBranch !== bBranch) return aBranch - bBranch
    const ad = a.dist ?? 9999
    const bd = b.dist ?? 9999
    return ad - bd
  })

  return candidates.slice(0, limit).map(({ g, dist }) => ({
    guardId: g.id,
    employeeId: g.employeeId,
    guardName: g.name,
    mobile: g.mobile,
    branchId: g.branchId,
    rank: g.rank,
    skills: g.skills,
    distanceKm: dist,
    reason:
      dist != null
        ? `W.Off / available · ~${dist} km`
        : g.branchId === post.branchId
          ? 'W.Off / available · same branch'
          : 'W.Off / available',
  }))
}

/** Agile Live — duty post (client GPS) + 100 metre fence. */

import type { MisClient } from '../mis/store.js'
import { kmBetween } from './duty-window.js'
import { OUT_OF_POST_KM, OUT_OF_POST_M } from './types.js'

export function foldLiveSite(raw: string): string {
  return String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
}

export function splitLiveClientSite(clientSite: string, branch = ''): { clientName: string; location: string } {
  const raw = String(clientSite || '').trim()
  const locFallback = String(branch || '').trim()
  if (!raw) return { clientName: locFallback || 'Duty post', location: locFallback }
  const parts = raw
    .split(/\s*[—–]\s*|\s+-\s+|,\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length >= 2) {
    return { clientName: parts[0]!, location: parts.slice(1).join(' — ') }
  }
  return { clientName: raw, location: locFallback }
}

export function liveMapUrl(lat: number | null | undefined, lng: number | null | undefined): string {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return ''
  return `https://maps.google.com/?q=${lat},${lng}`
}

export function liveMetresAway(
  lat1: number | null | undefined,
  lng1: number | null | undefined,
  lat2: number | null | undefined,
  lng2: number | null | undefined,
): number | null {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null
  if (![lat1, lng1, lat2, lng2].every((n) => Number.isFinite(n))) return null
  return Math.round(kmBetween(lat1, lng1, lat2, lng2) * 1000)
}

export function isLiveOutOfPost(metres: number | null): boolean {
  return metres != null && metres >= OUT_OF_POST_M
}

export type LiveDutyPost = {
  clientName: string
  location: string
  postLat: number | null
  postLng: number | null
  postSource: 'client' | 'start' | ''
  sanA: number
  sanG: number
  sanB: number
  sanC: number
}

export function matchLiveDutyPost(opts: {
  clientSite: string
  branch: string
  clients: MisClient[]
  startLat?: number | null
  startLng?: number | null
}): LiveDutyPost {
  const split = splitLiveClientSite(opts.clientSite, opts.branch)
  const siteFold = foldLiveSite(opts.clientSite)
  let best: MisClient | null = null
  let bestScore = 0
  for (const c of opts.clients) {
    if (c.active === false) continue
    const nameF = foldLiveSite(c.name)
    const locF = foldLiveSite(c.location)
    const combo = foldLiveSite(`${c.name} ${c.location}`)
    let score = 0
    if (siteFold && combo === siteFold) score = 100
    else if (siteFold && nameF === siteFold) score = 80
    else if (siteFold && nameF && locF && siteFold.includes(nameF) && siteFold.includes(locF)) score = 70
    else if (siteFold && nameF && (siteFold.includes(nameF) || nameF.includes(siteFold))) score = 40
    if (score > bestScore) {
      bestScore = score
      best = c
    }
  }
  const hit = bestScore >= 40 ? best : null
  const clientName = String(hit?.name || split.clientName).trim()
  const location = String(hit?.location || split.location).trim()
  const clientLat = Number(hit?.geoLat)
  const clientLng = Number(hit?.geoLng)
  const sans = {
    sanA: Number(hit?.sanA) || 0,
    sanG: Number(hit?.sanG) || 0,
    sanB: Number(hit?.sanB) || 0,
    sanC: Number(hit?.sanC) || 0,
  }
  if (Number.isFinite(clientLat) && Number.isFinite(clientLng)) {
    return { clientName, location, postLat: clientLat, postLng: clientLng, postSource: 'client', ...sans }
  }
  const startLat = opts.startLat ?? null
  const startLng = opts.startLng ?? null
  if (startLat != null && startLng != null && Number.isFinite(startLat) && Number.isFinite(startLng)) {
    return { clientName, location, postLat: startLat, postLng: startLng, postSource: 'start', ...sans }
  }
  return { clientName, location, postLat: null, postLng: null, postSource: '', ...sans }
}

export function liveDutyGeo(opts: {
  postLat: number | null
  postLng: number | null
  hereLat: number | null
  hereLng: number | null
}) {
  const metres = liveMetresAway(opts.postLat, opts.postLng, opts.hereLat, opts.hereLng)
  const mapLat = opts.hereLat ?? opts.postLat
  const mapLng = opts.hereLng ?? opts.postLng
  return {
    metres,
    outOfPost: isLiveOutOfPost(metres),
    mapUrl: liveMapUrl(mapLat, mapLng),
    fenceM: OUT_OF_POST_M,
    fenceKm: OUT_OF_POST_KM,
  }
}

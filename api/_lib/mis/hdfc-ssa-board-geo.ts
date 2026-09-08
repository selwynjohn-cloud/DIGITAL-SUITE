/**
 * HDFC SSA board — GPS + district for the India political map.
 * Survey geo first, then client-master geo. Independent cities stay separate.
 */
import type { MisPeriodicalSurvey } from './periodical-survey-store.js'
import type { HdfcSsaBoardBranch, HdfcSsaBoardSite } from './hdfc-ssa-state.js'
import type { MisClient } from './store.js'

export type HdfcCityGeo = {
  city: string
  state: string
  district: string
  lat: number
  lng: number
}

/** Agile cities only — Tada is not Nellore; Tadipatri is not Tada; Vizag is not Kakinada. */
export const HDFC_SSA_CITY_GEO: HdfcCityGeo[] = [
  { city: 'Nellore', state: 'Andhra Pradesh', district: 'SPSR Nellore', lat: 14.4426, lng: 79.9865 },
  { city: 'Tada', state: 'Andhra Pradesh', district: 'Tirupati', lat: 13.586, lng: 80.034 },
  { city: 'Tadipatri', state: 'Andhra Pradesh', district: 'Anantapuramu', lat: 14.908, lng: 78.009 },
  { city: 'Tirupati', state: 'Andhra Pradesh', district: 'Tirupati', lat: 13.6288, lng: 79.4192 },
  { city: 'Vijayawada', state: 'Andhra Pradesh', district: 'NTR', lat: 16.5062, lng: 80.648 },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', district: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
  { city: 'Kakinada', state: 'Andhra Pradesh', district: 'Kakinada', lat: 16.9891, lng: 82.2475 },
  { city: 'Hyderabad - A', state: 'Telangana', district: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { city: 'Hyderabad - B', state: 'Telangana', district: 'Hyderabad', lat: 17.4239, lng: 78.4738 },
  { city: 'Hi-Tech City', state: 'Telangana', district: 'Ranga Reddy', lat: 17.4435, lng: 78.3772 },
  { city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { city: 'Puducherry', state: 'Puducherry', district: 'Puducherry', lat: 11.9416, lng: 79.8083 },
  { city: 'Bangalore', state: 'Karnataka', district: 'Bengaluru Urban', lat: 12.9716, lng: 77.5946 },
  { city: 'Kochi', state: 'Kerala', district: 'Ernakulam', lat: 9.9312, lng: 76.2673 },
  { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { city: 'Surat', state: 'Gujarat', district: 'Surat', lat: 21.1702, lng: 72.8311 },
  { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal', lat: 23.2599, lng: 77.4126 },
]

function geoNorm(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const CITY_ALIASES: Record<string, string> = {
  vizag: 'visakhapatnam',
  vishakhapatnam: 'visakhapatnam',
  'hi tech city': 'hi tech city',
  hitech: 'hi tech city',
  'hi-tech city': 'hi tech city',
  'hyderabad a': 'hyderabad a',
  'hyderabad-a': 'hyderabad a',
  'hyd zone a': 'hyderabad a',
  'hyderabad b': 'hyderabad b',
  'hyderabad-b': 'hyderabad b',
  'hyd zone b': 'hyderabad b',
  pondicherry: 'puducherry',
  bengaluru: 'bangalore',
  cochin: 'kochi',
}

function cityKey(name: string): string {
  const n = geoNorm(name).replace(/\bbranch\b/g, '').trim()
  if (CITY_ALIASES[n]) return CITY_ALIASES[n]
  if (n === 'hi tech' || n === 'hitech city') return 'hi tech city'
  return n
}

export function cityGeoForName(branchName: string): HdfcCityGeo | null {
  const key = cityKey(branchName)
  if (!key) return null
  return (
    HDFC_SSA_CITY_GEO.find((row) => cityKey(row.city) === key) ||
    null
  )
}

export function finiteCoord(n: unknown): number | null {
  const v = Number(n)
  if (!Number.isFinite(v)) return null
  if (Math.abs(v) < 0.01) return null
  return Math.round(v * 1e6) / 1e6
}

/** India box — drop obviously bad pins. */
export function indiaCoords(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  const a = finiteCoord(lat)
  const b = finiteCoord(lng)
  if (a == null || b == null) return null
  if (a < 6 || a > 37 || b < 68 || b > 98) return null
  return { lat: a, lng: b }
}

export function coordsForSurvey(
  sv?: Pick<MisPeriodicalSurvey, 'geoLat' | 'geoLng'> | null,
  client?: Pick<MisClient, 'geoLat' | 'geoLng'> | null,
): { lat: number | null; lng: number | null } {
  const fromSv = indiaCoords(sv?.geoLat, sv?.geoLng)
  if (fromSv) return fromSv
  const fromClient = indiaCoords(client?.geoLat, client?.geoLng)
  if (fromClient) return fromClient
  return { lat: null, lng: null }
}

const DISTRICT_CANON: Record<string, string> = {
  nellore: 'SPSR Nellore',
  'spsr nellore': 'SPSR Nellore',
  'sri potti sriramulu nellore': 'SPSR Nellore',
  tirupati: 'Tirupati',
  chittoor: 'Tirupati',
  anantapur: 'Anantapuramu',
  anantapuramu: 'Anantapuramu',
  'east godavari': 'Kakinada',
  kakinada: 'Kakinada',
  visakhapatnam: 'Visakhapatnam',
  vishakhapatnam: 'Visakhapatnam',
  krishna: 'NTR',
  ntr: 'NTR',
  vijayawada: 'NTR',
  hyderabad: 'Hyderabad',
  'ranga reddy': 'Ranga Reddy',
  rangareddy: 'Ranga Reddy',
  chennai: 'Chennai',
  madras: 'Chennai',
  puducherry: 'Puducherry',
  pondicherry: 'Puducherry',
  bangalore: 'Bengaluru Urban',
  bengaluru: 'Bengaluru Urban',
  'bengaluru urban': 'Bengaluru Urban',
  'bangalore urban': 'Bengaluru Urban',
  ernakulam: 'Ernakulam',
  mumbai: 'Mumbai',
  'mumbai city': 'Mumbai',
  'mumbai suburban': 'Mumbai',
  surat: 'Surat',
  bhopal: 'Bhopal',
}

export function canonDistrictName(raw: string): string {
  const key = geoNorm(raw)
  if (!key) return ''
  if (DISTRICT_CANON[key]) return DISTRICT_CANON[key]
  const titled = String(raw || '')
    .trim()
    .replace(/\s+district$/i, '')
    .replace(/\s+/g, ' ')
  return titled
}

export function parseDistrictFromText(text: string): string {
  const blob = String(text || '')
  const m = blob.match(/\b([A-Za-z][A-Za-z .]{1,40}?)\s+district\b/i)
  if (m) return canonDistrictName(m[1])
  return ''
}

export function districtForCity(branchName: string): string {
  return cityGeoForName(branchName)?.district || ''
}

export function districtForSite(
  branchName: string,
  location: string,
  extra = '',
): string {
  const parsed = parseDistrictFromText(`${location} ${extra}`)
  if (parsed) return parsed
  return districtForCity(branchName)
}

export function attachSiteGeo(
  site: HdfcSsaBoardSite,
  sv?: MisPeriodicalSurvey | null,
  client?: MisClient | null,
): void {
  const pts = coordsForSurvey(sv, client)
  site.lat = pts.lat
  site.lng = pts.lng
  site.district = districtForSite(
    site.branchName,
    site.location,
    `${sv?.address || ''} ${sv?.locationName || ''} ${client?.location || ''}`,
  )
}

export function rollupCityGeo(city: HdfcSsaBoardBranch): void {
  const withGeo = city.sites.filter((s) => s.lat != null && s.lng != null)
  const fallback = cityGeoForName(city.branchName)
  if (withGeo.length) {
    city.lat = Math.round((withGeo.reduce((n, s) => n + Number(s.lat), 0) / withGeo.length) * 1e6) / 1e6
    city.lng = Math.round((withGeo.reduce((n, s) => n + Number(s.lng), 0) / withGeo.length) * 1e6) / 1e6
  } else if (fallback) {
    city.lat = fallback.lat
    city.lng = fallback.lng
  } else {
    city.lat = null
    city.lng = null
  }
  const counts = new Map<string, number>()
  for (const s of city.sites) {
    const d = String(s.district || '').trim()
    if (!d) continue
    counts.set(d, (counts.get(d) || 0) + 1)
  }
  let best = fallback?.district || ''
  let n = 0
  for (const [d, c] of counts) {
    if (c > n) {
      best = d
      n = c
    }
  }
  city.district = best
}

export function hdfcSsaCityGeoJson(): string {
  return JSON.stringify(HDFC_SSA_CITY_GEO)
}

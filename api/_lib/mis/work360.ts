/**
 * Patrol Visit Report — Work360 Mobile app "Duty Visits" JSON API.
 * GET /v1/dutyvisits (not /v1/reports/visitreportblob).
 */
import { nid, saveVisits, type MisVisit } from './store.js'
import type { SyncVisitsResult } from './visit-sync-types.js'
import { parseWork360VisitBlob } from './work360-parse.js'
import {
  isoToWork360Date,
  work360Config,
  work360DateParams,
  work360FetchBlob,
  work360FetchJson,
  work360Token,
  type Work360Config,
} from './work360-client.js'

type DutyVisitRow = Record<string, unknown>

const PAGE_SIZE = 100
const MAX_PAGES = 50

function mapDutyVisitRow(row: DutyVisitRow, date: string): MisVisit | null {
  const user = String(row.userName ?? row.user ?? '').trim()
  const client = String(row.client ?? row.clientName ?? '').trim()
  if (!user && !client) return null
  const place = String(row.placeOfVisit ?? row.place ?? row.visitedPlaces ?? '').trim()
  const patrolPoint = place.slice(0, 120)
  return {
    id: nid('vs'),
    date,
    user: user.slice(0, 120),
    personMet: String(row.personMet ?? '').slice(0, 120),
    client: client.slice(0, 120),
    unit: String(row.unit ?? row.unitName ?? '').slice(0, 120),
    visitTime: String(row.createdTimeStr ?? row.visitTime ?? row.dateStr ?? '').slice(0, 40),
    place: place.slice(0, 120),
    remarks: String(row.remarks ?? '').slice(0, 300),
    visitType: 'D',
    patrolPoint: patrolPoint || undefined,
    kmTravelled: String(row.kmTravelled ?? row.travelDistance ?? row.distance ?? '').trim() || undefined,
    fromMobile: true,
  }
}

function visitKey(v: MisVisit): string {
  return `${v.user}|${v.client}|${v.visitTime}|${v.unit}`.toLowerCase()
}

function dateParams(date: string, useDmy: boolean): Record<string, string> {
  if (useDmy) {
    const d = isoToWork360Date(date)
    return { fromDateStr: d, toDateStr: d }
  }
  return work360DateParams(date)
}

function dutyVisitQuery(date: string, useDmy: boolean, page: number): Record<string, string> {
  return {
    ...dateParams(date, useDmy),
    pageNumber: String(page),
    pageSize: String(PAGE_SIZE),
    visitedClientId: '-1',
    visitedUnitId: '-1',
    otherClient: '',
    visitTypeId: '-1',
    dayType: '-1',
    travelMode: '-1',
  }
}

function unwrapRows(data: unknown): DutyVisitRow[] {
  if (Array.isArray(data)) return data.filter((x) => x && typeof x === 'object') as DutyVisitRow[]
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    for (const k of ['content', 'data', 'items', 'records', 'list']) {
      const arr = o[k]
      if (Array.isArray(arr)) return arr.filter((x) => x && typeof x === 'object') as DutyVisitRow[]
    }
  }
  return []
}

async function fetchDutyVisitsJson(cfg: Work360Config, date: string): Promise<MisVisit[]> {
  const paths = ['/v1/dutyvisits', '/v1/dutyvisitsread', '/dutyvisits']
  const merged = new Map<string, MisVisit>()
  for (const path of paths) {
    for (const useDmy of [false, true]) {
      try {
        for (let page = 1; page <= MAX_PAGES; page++) {
          const data = await work360FetchJson<unknown>(cfg, path, dutyVisitQuery(date, useDmy, page))
          const rows = unwrapRows(data)
          if (!rows.length) break
          for (const row of rows) {
            const v = mapDutyVisitRow(row, date)
            if (v) merged.set(visitKey(v), v)
          }
          if (rows.length < PAGE_SIZE) break
        }
        if (merged.size) return [...merged.values()]
      } catch {
        /* try next path / date format */
      }
    }
  }
  return [...merged.values()]
}

/** Excel export fallback — POST /v1/dutyvisitsreportblob (same as Mobile "Export Report"). */
async function fetchDutyVisitsBlob(cfg: Work360Config, date: string): Promise<MisVisit[]> {
  for (const useDmy of [false, true]) {
    try {
      const dp = dateParams(date, useDmy)
      const form = new FormData()
      form.append('fromDateStr', dp.fromDateStr)
      form.append('toDateStr', dp.toDateStr)
      form.append('visitedClientId', '-1')
      form.append('visitedUnitId', '-1')
      form.append('otherClient', '')
      form.append('visitTypeId', '-1')
      form.append('dayType', '-1')
      form.append('travelMode', '-1')

      const token = await work360Token(cfg)
      const url = `${cfg.apiBaseUrl.replace(/\/$/, '')}/v1/dutyvisitsreportblob`
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'x-tenantid': cfg.tenantId },
        body: form,
      })
      if (!res.ok) continue
      const buf = await res.arrayBuffer()
      if (!buf.byteLength) continue
      const list = parseWork360VisitBlob(buf, date).map((v) => ({ ...v, visitType: 'D' as const }))
      if (list.length) return list
    } catch {
      /* try dmy / next method */
    }
  }

  // Legacy GET visitreportblob with required visitTypeId (was 500 without it)
  for (const useDmy of [false, true]) {
    try {
      const buf = await work360FetchBlob(cfg, '/v1/reports/visitreportblob', {
        ...dateParams(date, useDmy),
        visitedClientId: '-1',
        visitedUnitId: '-1',
        otherClient: '',
        visitTypeId: '-1',
        dayType: '-1',
        travelMode: '-1',
      })
      const list = parseWork360VisitBlob(buf, date).map((v) => ({ ...v, visitType: 'D' as const }))
      if (list.length) return list
    } catch {
      /* next */
    }
  }
  return []
}

/** One calendar day — Patrol Visit Report from Agile Mobile (Work360). */
export async function syncWork360Visits(date: string): Promise<SyncVisitsResult> {
  const cfg = work360Config()
  if (!cfg) {
    return {
      ok: true,
      date,
      fetched: 0,
      saved: 0,
      skipped: true,
      error: 'Work360 env not configured (WORK360_API_BASE_URL, TENANT_ID, USERNAME, PASSWORD)',
    }
  }

  try {
    let list = await fetchDutyVisitsJson(cfg, date)
    if (!list.length) list = await fetchDutyVisitsBlob(cfg, date)

    if (!list.length) {
      return {
        ok: true,
        date,
        fetched: 0,
        saved: 0,
        skipped: true,
        error: `No Patrol Visit Report rows for ${date}`,
      }
    }

    const ok = await saveVisits(date, list.slice(0, 5000))
    return {
      ok,
      date,
      fetched: list.length,
      saved: Math.min(list.length, 5000),
      error: ok ? undefined : 'Could not save visits to storage',
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Work360 patrol visit sync failed'
    return { ok: false, date, fetched: 0, saved: 0, error: msg }
  }
}

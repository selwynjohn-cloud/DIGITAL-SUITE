import { nid, saveVisits } from './store.js'
import type { SyncVisitsResult } from './visit-sync-types.js'
import { parseWork360VisitBlob } from './work360-parse.js'
import {
  work360Config,
  work360DateParams,
  work360FetchBlob,
  work360ListClients,
  type Work360Config,
} from './work360-client.js'

function skipped(message: string, date: string): SyncVisitsResult {
  return { ok: true, date, fetched: 0, saved: 0, skipped: true, error: message }
}

async function fetchVisitsForClient(cfg: Work360Config, date: string, visitedClientId: string) {
  return work360FetchBlob(cfg, '/v1/reports/visitreportblob', {
    ...work360DateParams(date),
    dayType: '-1',
    travelMode: '-1',
    visitedClientId,
    visitedUnitId: '-1',
  })
}

/** One calendar day only — fromDateStr and toDateStr both set to the chosen date (ISO). */
export async function syncWork360Visits(date: string): Promise<SyncVisitsResult> {
  const cfg = work360Config()
  if (!cfg) {
    return skipped('Work360 env not configured (WORK360_API_BASE_URL, TENANT_ID, USERNAME, PASSWORD)', date)
  }

  try {
    let buf = await fetchVisitsForClient(cfg, date, '-1')
    let list = buf.byteLength ? parseWork360VisitBlob(buf, date) : []

    if (!list.length) {
      const clients = await work360ListClients(cfg)
      const clientIds = clients
        .map((c) => String(c.id ?? '').trim())
        .filter((id) => id && id !== '-1' && id !== '0')
        .slice(0, 8)
      if (!clientIds.length && cfg.tenantId) clientIds.push(cfg.tenantId)

      const merged = new Map<string, ReturnType<typeof parseWork360VisitBlob>[number]>()
      for (const clientId of clientIds) {
        try {
          buf = await fetchVisitsForClient(cfg, date, clientId)
          if (!buf.byteLength) continue
          for (const v of parseWork360VisitBlob(buf, date)) {
            const k = `${v.user}|${v.client}|${v.visitTime}|${v.unit}`.toLowerCase()
            if (!merged.has(k)) merged.set(k, v)
          }
        } catch {
          /* next client */
        }
        if (merged.size >= 500) break
      }
      list = [...merged.values()]
    }

    if (!list.length) {
      return skipped(`Work360 returned no visit rows for ${date}`, date)
    }

    const ok = await saveVisits(date, list)
    return {
      ok,
      date,
      fetched: list.length,
      saved: list.length,
      error: ok ? undefined : 'Could not save visits to storage',
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Work360 visit sync failed'
    return { ok: false, date, fetched: 0, saved: 0, error: msg }
  }
}

/**
 * Site Security Visit Report — Day / Night Check handlers (public + portal list).
 */

import { listPublicExternalClients, newPublicResumeCode, normPublicResumeCode, resolvePublicExternalClient } from './public-external-link.js'
import { getBranches, misStorageOk, nid, saveClientGeoFromAssessment } from './store.js'
import {
  emptySiteVisitReport,
  getSiteVisitReports,
  normalizeSiteVisitReport,
  storageOk,
  type SiteVisitReport,
  upsertSiteVisitReport,
} from './site-visit-report-store.js'

function s(v: unknown, n = 4000): string {
  return String(v ?? '').slice(0, n)
}

function clientSanStrength(c: { sanA?: number; sanG?: number; sanB?: number; sanC?: number }): string {
  const n = Number(c.sanA || 0) + Number(c.sanG || 0) + Number(c.sanB || 0) + Number(c.sanC || 0)
  return n > 0 ? String(n) : ''
}

export async function handleSiteVisitPublicBoot() {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const branches = (await getBranches(true))
    .filter((b) => b.active !== false)
    .map((b) => ({ id: b.id, name: b.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
  return { status: 200, json: { ok: true, branches } }
}

export async function handleSiteVisitPublicClients(body: Record<string, unknown>) {
  const branchId = s(body.branchId, 80)
  if (!branchId) return { status: 400, json: { error: 'Pick Branch first.' } }
  const listed = await listPublicExternalClients(branchId)
  if ('error' in listed && listed.error && !listed.clients.length) {
    return { status: 400, json: { error: listed.error } }
  }
  return { status: 200, json: { ok: true, branchId, clients: listed.clients } }
}

function findSiteVisitDraft(all: SiteVisitReport[], opts: { id?: string; code?: string; branchId?: string; clientId?: string; officerName?: string }) {
  const code = normPublicResumeCode(opts.code)
  if (code) {
    return all.find((r) => r.status === 'Draft' && r.active !== false && normPublicResumeCode(r.publicResumeCode) === code) || null
  }
  if (opts.id) {
    return all.find((r) => r.id === opts.id && r.status === 'Draft' && r.active !== false) || null
  }
  const name = String(opts.officerName || '').trim().toLowerCase()
  return (
    all.find(
      (r) =>
        r.status === 'Draft' &&
        r.active !== false &&
        r.branchId === opts.branchId &&
        r.clientId === opts.clientId &&
        String(r.officerName || '').trim().toLowerCase() === name,
    ) || null
  )
}

export async function handleSiteVisitPublicDraftLoad(body: Record<string, unknown>) {
  const all = await getSiteVisitReports()
  const draft = findSiteVisitDraft(all, {
    id: s(body.id, 80),
    code: s(body.code || body.resumeCode, 20),
    branchId: s(body.branchId, 80),
    clientId: s(body.clientId, 80),
    officerName: s(body.officerName, 120),
  })
  if (!draft) {
    if (normPublicResumeCode(body.code || body.resumeCode)) {
      return { status: 404, json: { error: 'No saved visit for that continue code.' } }
    }
    return { status: 200, json: { ok: true, draft: null } }
  }
  return { status: 200, json: { ok: true, draft, resumeCode: draft.publicResumeCode } }
}

function buildRow(body: Record<string, unknown>, existing?: SiteVisitReport | null, asDraft = false): SiteVisitReport {
  const now = new Date().toISOString()
  const visitType = s(body.visitType, 10) === 'night' ? 'night' : 'day'
  const geoLat = Number(body.geoLat)
  const geoLng = Number(body.geoLng)
  const geoAccuracy = Number(body.geoAccuracy)
  const keepPhotos = body.keepPhotos === true || body.keepPhotos === '1'
  const base = existing || emptySiteVisitReport({ id: s(body.id, 80) || nid('svr') })
  const n = normalizeSiteVisitReport({
    ...base,
    ...body,
    id: base.id,
    visitType,
    photoSelfie: keepPhotos ? base.photoSelfie : body.photoSelfie ?? base.photoSelfie,
    photoSite1: keepPhotos ? base.photoSite1 : body.photoSite1 ?? base.photoSite1,
    photoSite2: keepPhotos ? base.photoSite2 : body.photoSite2 ?? base.photoSite2,
    geoLat: Number.isFinite(geoLat) ? geoLat : base.geoLat,
    geoLng: Number.isFinite(geoLng) ? geoLng : base.geoLng,
    geoAccuracy: Number.isFinite(geoAccuracy) ? geoAccuracy : base.geoAccuracy,
    publicResumeCode: normPublicResumeCode(base.publicResumeCode) || newPublicResumeCode(),
    status: asDraft ? 'Draft' : 'Completed',
    submittedAt: asDraft ? '' : now,
    updatedAt: now,
    active: true,
    createdAt: base.createdAt || now,
    startedAt: s(body.startedAt, 40) || base.startedAt || now,
    submittedToHodDate: s(body.submittedToHodDate, 20) || (asDraft ? '' : now.slice(0, 10)),
  })
  return n || emptySiteVisitReport({ id: base.id, status: asDraft ? 'Draft' : 'Completed', submittedAt: asDraft ? '' : now })
}

export async function handleSiteVisitPublicSubmit(body: Record<string, unknown>) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const branchId = s(body.branchId, 80)
  const clientId = s(body.clientId, 80)
  const officerName = s(body.officerName, 120).trim()
  if (!branchId) return { status: 400, json: { error: 'Pick Branch first.' } }
  if (!clientId) return { status: 400, json: { error: 'Pick the Target Unit / Site.' } }
  if (!officerName) return { status: 400, json: { error: 'Enter Inspecting Officer Name.' } }

  const existingAll = await getSiteVisitReports()
  const resolved = await resolvePublicExternalClient(branchId, clientId)
  if ('error' in resolved && resolved.error) return resolved.error
  const { branch, client } = resolved as Exclude<typeof resolved, { error: unknown }>

  const asDraft = String(body.action || '').toLowerCase() === 'draft' || String(body.action || '').toLowerCase() === 'autosave'
  const existingId = s(body.id, 80)
  const existing =
    findSiteVisitDraft(existingAll, {
      id: existingId,
      code: s(body.resumeCode || body.code, 20),
      branchId,
      clientId,
      officerName,
    }) || (existingId ? existingAll.find((r) => r.id === existingId) || null : null)
  const row = buildRow(
    {
      ...body,
      branchId,
      clientId,
      officerName,
      branchOffice: s(body.branchOffice, 120) || branch.name,
      unitName: s(body.unitName, 200) || client.name,
      unitLocation: s(body.unitLocation, 400) || client.location || '',
      sanctionedStrength:
        s(body.sanctionedStrength, 40) || String((client as { sanctionedStrength?: string }).sanctionedStrength || '') || clientSanStrength(client),
    },
    existing,
    asDraft,
  )

  const ok = await upsertSiteVisitReport(row)
  if (!ok) return { status: 503, json: { error: asDraft ? 'Could not auto-save. Try again.' : 'Could not save visit report. Try again.' } }

  if (asDraft) {
    return {
      status: 200,
      json: {
        ok: true,
        draft: true,
        id: row.id,
        resumeCode: row.publicResumeCode,
        message: 'Draft saved — continue on a computer with this code if the phone is hard.',
      },
    }
  }

  let clientGeo: { ok: boolean; error?: string } | null = null
  if (row.geoLat != null && row.geoLng != null && Number.isFinite(row.geoLat) && Number.isFinite(row.geoLng)) {
    clientGeo = await saveClientGeoFromAssessment({
      clientId,
      branchId,
      lat: row.geoLat,
      lng: row.geoLng,
      capturedAt: row.geoCapturedAt || row.submittedAt,
      source: 'site-visit-day-night',
    })
  }

  return {
    status: 200,
    json: {
      ok: true,
      id: row.id,
      visitType: row.visitType,
      unitName: row.unitName,
      geoLat: row.geoLat,
      geoLng: row.geoLng,
      clientGeo,
      message: 'Visit report submitted to HOD.',
    },
  }
}

export async function handleSiteVisitList(opts: {
  branchId?: string
  allBranches?: boolean
}) {
  if (!misStorageOk() && !storageOk()) {
    return { status: 503, json: { error: 'Storage not connected.' } }
  }
  const all = await getSiteVisitReports()
  const branches = await getBranches(true)
  const nameOf = (id: string) => branches.find((b) => b.id === id)?.name || id
  let rows = all.filter((r) => r.active !== false && r.status === 'Completed')
  if (!opts.allBranches) {
    const bid = s(opts.branchId, 80)
    if (!bid) return { status: 400, json: { error: 'Branch required.' } }
    rows = rows.filter((r) => r.branchId === bid)
  }
  rows.sort((a, b) => String(b.submittedAt || b.updatedAt).localeCompare(String(a.submittedAt || a.updatedAt)))
  return {
    status: 200,
    json: {
      ok: true,
      reports: rows.slice(0, 200).map((r) => ({
        id: r.id,
        branchId: r.branchId,
        branchName: nameOf(r.branchId),
        clientId: r.clientId,
        visitType: r.visitType,
        visitDate: r.visitDate,
        visitTime: r.visitTime,
        officerName: r.officerName,
        unitName: r.unitName,
        unitLocation: r.unitLocation,
        overallStatus: r.overallStatus,
        submittedAt: r.submittedAt,
        geoLat: r.geoLat,
        geoLng: r.geoLng,
        keyObservations: r.keyObservations.slice(0, 280),
      })),
    },
  }
}

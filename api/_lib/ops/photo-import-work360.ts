/**
 * Copy face photos from Work360 / mobile app sources into Ops shadow photo store.
 * Sources (best effort):
 *  1) Pulse guard directory (already linked to mobile API when configured)
 *  2) Work360 employee / user JSON (photoUrl / profilePhoto fields if present)
 *  3) MOBILE_GUARD_API_URL template (same as Pulse)
 */

import { work360Config, work360FetchJson, work360ListClients } from '../mis/work360-client.js'
import { lookupGuard } from '../pulse/guard-directory.js'
import {
  getGuards,
  getPhotoMap,
  linkPhotoToEmployee,
  opsStorageOk,
  saveOpsImage,
} from './store.js'

export type PhotoImportResult = {
  ok: true
  scanned: number
  imported: number
  skippedHadPhoto: number
  skippedNoPhoto: number
  failed: number
  sources: string[]
  hasMore: boolean
  nextOffset: number
  message: string
  sampleFields: string[]
}

type Candidate = { employeeId: string; name: string; photoUrl: string; source: string }

function pickPhoto(obj: Record<string, unknown>): string {
  const keys = [
    'photoUrl',
    'photo_url',
    'photo',
    'image',
    'imageUrl',
    'image_url',
    'profilePhoto',
    'profile_photo',
    'profileImage',
    'profile_image',
    'picture',
    'avatar',
    'userPhoto',
    'employeePhoto',
    'photoPath',
    'photo_path',
  ]
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  for (const nest of ['data', 'user', 'employee', 'profile', 'guard']) {
    const child = obj[nest]
    if (child && typeof child === 'object') {
      const p = pickPhoto(child as Record<string, unknown>)
      if (p) return p
    }
  }
  return ''
}

function pickEmpId(obj: Record<string, unknown>): string {
  for (const k of [
    'employeeId',
    'empId',
    'empCode',
    'employeeCode',
    'employeeNo',
    'biometricId',
    'userId',
    'id',
    'guardId',
  ]) {
    const v = obj[k]
    if (v != null && String(v).trim()) return String(v).trim().slice(0, 40)
  }
  return ''
}

function pickName(obj: Record<string, unknown>): string {
  for (const k of ['employeeName', 'name', 'userName', 'guardName', 'fullName']) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 120)
  }
  return ''
}

function asList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
  }
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    for (const k of ['data', 'employees', 'users', 'result', 'items', 'content']) {
      if (Array.isArray(o[k])) return asList(o[k])
    }
  }
  return []
}

async function redisGet(key: string): Promise<string | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['GET', key]),
    })
    if (!res.ok) return null
    const d = (await res.json()) as { result?: unknown }
    return typeof d.result === 'string' ? d.result : null
  } catch {
    return null
  }
}

async function candidatesFromPulseDirectory(): Promise<Candidate[]> {
  const raw = await redisGet('pulse:guards:directory')
  if (!raw) return []
  try {
    const map = JSON.parse(raw) as Record<string, { guardId?: string; name?: string; photoUrl?: string }>
    const out: Candidate[] = []
    for (const row of Object.values(map || {})) {
      const employeeId = String(row.guardId || '').trim()
      const photoUrl = String(row.photoUrl || '').trim()
      if (!employeeId || !photoUrl) continue
      out.push({
        employeeId,
        name: String(row.name || ''),
        photoUrl,
        source: 'pulse-directory',
      })
    }
    return out
  } catch {
    return []
  }
}

async function candidatesFromWork360(): Promise<{ rows: Candidate[]; sampleFields: string[] }> {
  const cfg = work360Config()
  const sampleFields = new Set<string>()
  const byEmp = new Map<string, Candidate>()
  if (!cfg) return { rows: [], sampleFields: [] }

  const paths = ['/v1/employees', '/v1/users', '/v1/staff', '/v1/guards']
  for (const path of paths) {
    try {
      const data = await work360FetchJson<unknown>(cfg, path)
      const list = asList(data)
      for (const o of list.slice(0, 5)) {
        Object.keys(o).forEach((k) => sampleFields.add(k))
      }
      for (const o of list) {
        const employeeId = pickEmpId(o)
        const photoUrl = pickPhoto(o)
        if (!employeeId || !photoUrl) continue
        byEmp.set(employeeId, {
          employeeId,
          name: pickName(o),
          photoUrl,
          source: `work360:${path}`,
        })
      }
      if (byEmp.size >= 50) break
    } catch {
      /* try next */
    }
  }

  // If JSON list had few photos, still collect IDs from clients for mobile API lookup later
  if (byEmp.size < 10) {
    try {
      const clients = await work360ListClients(cfg)
      void clients
    } catch {
      /* ignore */
    }
  }

  return { rows: [...byEmp.values()], sampleFields: [...sampleFields].slice(0, 40) }
}

async function downloadAsDataUrl(url: string): Promise<string | null> {
  const u = url.trim()
  if (!u) return null
  if (u.startsWith('data:image/')) return u
  try {
    const abs = u.startsWith('http')
      ? u
      : u.startsWith('/')
        ? `https://www.agilegroup-digital.co.in${u}`
        : u
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    try {
      const res = await fetch(abs, { signal: controller.signal, redirect: 'follow' })
      if (!res.ok) return null
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 80 || buf.length > 900_000) return null
      const ctype = (res.headers.get('content-type') || '').toLowerCase()
      let mime = 'image/jpeg'
      if (ctype.includes('png')) mime = 'image/png'
      else if (ctype.includes('webp')) mime = 'image/webp'
      else if (ctype.includes('gif')) mime = 'image/gif'
      else if (ctype.includes('jpeg') || ctype.includes('jpg')) mime = 'image/jpeg'
      else if (!(buf[0] === 0xff && buf[1] === 0xd8) && !(buf[0] === 0x89 && buf[1] === 0x50)) {
        // Unknown binary — still try as jpeg if it looks like an image endpoint
        if (!ctype.startsWith('image/')) return null
      }
      return `data:${mime};base64,${buf.toString('base64')}`
    } finally {
      clearTimeout(timer)
    }
  } catch {
    return null
  }
}

async function candidatesFromMobileApi(employeeIds: string[], limit: number): Promise<Candidate[]> {
  if (!process.env.MOBILE_GUARD_API_URL?.trim()) return []
  const out: Candidate[] = []
  for (const id of employeeIds.slice(0, limit)) {
    const g = await lookupGuard(id)
    if (g?.photoUrl) {
      out.push({
        employeeId: id,
        name: g.name || '',
        photoUrl: g.photoUrl,
        source: 'mobile-api',
      })
    }
  }
  return out
}

export async function importPhotosFromMobile(opts?: {
  limit?: number
  offset?: number
}): Promise<PhotoImportResult> {
  if (!opsStorageOk()) {
    return {
      ok: true,
      scanned: 0,
      imported: 0,
      skippedHadPhoto: 0,
      skippedNoPhoto: 0,
      failed: 0,
      sources: [],
      hasMore: false,
      nextOffset: 0,
      sampleFields: [],
      message: 'Photo storage not connected.',
    }
  }

  const limit = Math.min(Math.max(opts?.limit ?? 25, 1), 40)
  const offset = Math.max(opts?.offset ?? 0, 0)
  const sources: string[] = []
  const sampleFields: string[] = []

  const fromPulse = await candidatesFromPulseDirectory()
  if (fromPulse.length) sources.push('Pulse / mobile directory')

  const w360 = await candidatesFromWork360()
  if (w360.rows.length) sources.push('Work360 employee API')
  sampleFields.push(...w360.sampleFields)

  const byEmp = new Map<string, Candidate>()
  for (const c of [...fromPulse, ...w360.rows]) {
    if (!byEmp.has(c.employeeId)) byEmp.set(c.employeeId, c)
  }

  // Fill gaps via mobile API for guards missing photos
  const map = await getPhotoMap()
  const guards = await getGuards()
  const missingIds = guards
    .filter((g) => g.employeeId && !map[g.employeeId.trim().toLowerCase().replace(/\s+/g, '')] && !g.photoId)
    .map((g) => g.employeeId)
  if (missingIds.length && process.env.MOBILE_GUARD_API_URL?.trim()) {
    const fromMobile = await candidatesFromMobileApi(missingIds.slice(offset, offset + limit), limit)
    if (fromMobile.length) sources.push('MOBILE_GUARD_API')
    for (const c of fromMobile) {
      if (!byEmp.has(c.employeeId)) byEmp.set(c.employeeId, c)
    }
  }

  const all = [...byEmp.values()]
  // Prefer candidates that still need a photo
  const need = all.filter((c) => {
    const k = c.employeeId.trim().toLowerCase().replace(/\s+/g, '')
    return !map[k]
  })
  const batch = (need.length ? need : all).slice(offset, offset + limit)

  let imported = 0
  let skippedHadPhoto = 0
  let skippedNoPhoto = 0
  let failed = 0

  // Refresh map after possible earlier links
  let liveMap = await getPhotoMap()

  for (const c of batch) {
    const key = c.employeeId.trim().toLowerCase().replace(/\s+/g, '')
    if (liveMap[key]) {
      skippedHadPhoto++
      continue
    }
    if (!c.photoUrl) {
      skippedNoPhoto++
      continue
    }
    const dataUrl = await downloadAsDataUrl(c.photoUrl)
    if (!dataUrl) {
      failed++
      continue
    }
    const photoId = await saveOpsImage(dataUrl)
    if (!photoId) {
      failed++
      continue
    }
    const linked = await linkPhotoToEmployee(c.employeeId, photoId)
    if (linked) {
      imported++
      liveMap[key] = photoId
    } else {
      failed++
    }
  }

  const hasMore = offset + limit < (need.length || all.length)
  const nextOffset = offset + limit

  let message = ''
  if (!all.length && !missingIds.length) {
    message =
      'No photos found in Work360 / mobile directory yet. The mobile app may not expose face photos on the API. You can still upload one by one, or we can connect a photo API URL.'
  } else if (!batch.length) {
    message = 'All known mobile photo links are already copied.'
  } else {
    message = `Mobile photo copy: +${imported} saved this batch (skipped ${skippedHadPhoto} already had, ${failed} failed). Source: ${sources.join(', ') || 'none'}.`
    if (hasMore) message += ' Tap again to copy the next batch.'
  }

  return {
    ok: true,
    scanned: batch.length,
    imported,
    skippedHadPhoto,
    skippedNoPhoto,
    failed,
    sources: [...new Set(sources)],
    hasMore,
    nextOffset: hasMore ? nextOffset : 0,
    sampleFields,
    message,
  }
}

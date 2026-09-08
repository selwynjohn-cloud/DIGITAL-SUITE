import { decodeUploadBase64 } from './collection-import.js'
import { misTodayIst } from './dates.js'
import {
  emptyNightReport,
  emptyTrainingReport,
  loadNightReport,
  loadSchedule,
  loadTrainingReport,
  normalizeNightReport,
  normalizeTrainingReport,
  saveNightReport,
  saveScheduleForBranch,
  saveTrainingReport,
  storageOk,
  type MisNightVisitReport,
  type MisScheduleUpload,
  type MisTrainingDayReport,
  type NightOjtKind,
} from './night-ojt-store.js'
import { isMgmtAllBranches } from '../suite-mgmt-branch-select.js'
import { getBranches, getMisReportBranches, misStorageOk } from './store.js'

function s(v: unknown, n = 4000): string {
  return String(v ?? '').slice(0, n)
}

function monthYm(v: unknown): string {
  const m = String(v ?? '').slice(0, 7)
  return /^\d{4}-\d{2}$/.test(m) ? m : misTodayIst().slice(0, 7)
}

function dateYmd(v: unknown): string {
  const d = String(v ?? '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : misTodayIst()
}

function kindFrom(body: Record<string, unknown>): NightOjtKind {
  return String(body.kind ?? body.module ?? '') === 'training' ? 'training' : 'night'
}

async function resolveBranchId(body: Record<string, unknown>, lockedBranchId?: string): Promise<string> {
  if (lockedBranchId) return lockedBranchId
  const id = s(body.branchId, 80)
  if (isMgmtAllBranches(id)) return 'ALL'
  if (id) return id
  return 'ALL'
}

export async function handleNightOjtLoad(body: Record<string, unknown>, lockedBranchId?: string) {
  if (!misStorageOk() && !storageOk()) return { status: 503, json: { error: 'Storage not connected.' } }
  const kind = kindFrom(body)
  const tab = s(body.tab, 20) || 'schedule'
  const branchId = await resolveBranchId(body, lockedBranchId)
  if (!branchId) return { status: 400, json: { error: 'Branch required.' } }
  const allMode = isMgmtAllBranches(branchId) && !lockedBranchId

  if (tab === 'schedule') {
    const ym = monthYm(body.month)
    if (allMode) {
      const branches = await getMisReportBranches(true)
      const schedules = await Promise.all(
        branches.map(async (b) => {
          const schedule = await loadSchedule(kind, b.id, ym)
          return schedule
            ? { branchId: b.id, branchName: b.name, schedule }
            : { branchId: b.id, branchName: b.name, schedule: null }
        }),
      )
      return {
        status: 200,
        json: {
          ok: true,
          kind,
          tab,
          branchId: 'ALL',
          allBranches: true,
          month: ym,
          schedules,
          schedule: null,
        },
      }
    }
    const schedule = await loadSchedule(kind, branchId, ym)
    return { status: 200, json: { ok: true, kind, tab, branchId, month: ym, schedule } }
  }

  if (allMode) {
    return {
      status: 200,
      json: {
        ok: true,
        kind,
        tab,
        branchId: 'ALL',
        allBranches: true,
        date: dateYmd(body.date),
        report: null,
        message: 'Pick one branch (not All Branches) to open or save a report.',
      },
    }
  }

  const dt = dateYmd(body.date)
  if (kind === 'night') {
    const report = (await loadNightReport(branchId, dt)) || emptyNightReport(branchId, dt)
    return { status: 200, json: { ok: true, kind, tab, branchId, date: dt, report } }
  }
  const report = (await loadTrainingReport(branchId, dt)) || emptyTrainingReport(branchId, dt)
  return { status: 200, json: { ok: true, kind, tab, branchId, date: dt, report } }
}

export async function handleNightOjtUploadSchedule(
  body: Record<string, unknown>,
  userName: string,
  lockedBranchId?: string,
) {
  if (!misStorageOk() && !storageOk()) return { status: 503, json: { error: 'Storage not connected.' } }
  const kind = kindFrom(body)
  const branchId = await resolveBranchId(body, lockedBranchId)
  const ym = monthYm(body.month)
  const fileName = s(body.fileName, 160) || 'schedule'
  const mimeType = s(body.mimeType, 120) || 'application/octet-stream'
  const dataRaw = String(body.data ?? '')
  if (!branchId || isMgmtAllBranches(branchId)) {
    return { status: 400, json: { error: 'Pick one branch (not All Branches) before uploading.' } }
  }
  if (!dataRaw) return { status: 400, json: { error: 'Choose a file to upload.' } }
  try {
    decodeUploadBase64(dataRaw)
  } catch {
    return { status: 400, json: { error: 'Could not read file.' } }
  }
  const b64 = dataRaw.includes(',') ? dataRaw.split(',').pop()! : dataRaw
  if (b64.length > 6_000_000) return { status: 400, json: { error: 'File too large (max ~4 MB).' } }

  const upload: Omit<MisScheduleUpload, 'branchId'> & { month: string } = {
    month: ym,
    fileName,
    mimeType,
    dataBase64: dataRaw,
    uploadedAt: new Date().toISOString(),
    uploadedBy: userName,
  }
  const ok = await saveScheduleForBranch(kind, branchId, upload)
  if (!ok) return { status: 503, json: { error: 'Could not save schedule.' } }
  const schedule = await loadSchedule(kind, branchId, ym)
  return { status: 200, json: { ok: true, schedule } }
}

export async function handleNightOjtSaveReport(
  body: Record<string, unknown>,
  userName: string,
  lockedBranchId?: string,
) {
  if (!misStorageOk() && !storageOk()) return { status: 503, json: { error: 'Storage not connected.' } }
  const kind = kindFrom(body)
  const branchId = await resolveBranchId(body, lockedBranchId)
  const dt = dateYmd(body.date ?? (body.report as MisNightVisitReport)?.reportDate)
  if (!branchId || isMgmtAllBranches(branchId)) {
    return { status: 400, json: { error: 'Pick one branch (not All Branches) before saving a report.' } }
  }

  if (kind === 'night') {
    const raw = (body.report ?? body) as Partial<MisNightVisitReport>
    const report = normalizeNightReport(raw, branchId, dt)
    report.updatedAt = new Date().toISOString()
    report.updatedBy = userName
    const ok = await saveNightReport(report)
    if (!ok) return { status: 503, json: { error: 'Could not save report.' } }
    return { status: 200, json: { ok: true, report } }
  }

  const raw = (body.report ?? body) as Partial<MisTrainingDayReport>
  const report = normalizeTrainingReport(raw, branchId, dt)
  report.updatedAt = new Date().toISOString()
  report.updatedBy = userName
  const ok = await saveTrainingReport(report)
  if (!ok) return { status: 503, json: { error: 'Could not save report.' } }
  return { status: 200, json: { ok: true, report } }
}

export async function handleNightOjtBranches() {
  const branches = await getMisReportBranches(true)
  return {
    status: 200,
    json: {
      ok: true,
      branches: branches.map((b) => ({ id: b.id, name: b.name })),
    },
  }
}

export async function handleNightOjtListReports(
  body: Record<string, unknown>,
  lockedBranchId?: string,
) {
  const kind = kindFrom(body)
  const branchId = await resolveBranchId(body, lockedBranchId)
  const ym = monthYm(body.month)
  if (!branchId) return { status: 400, json: { error: 'Branch required.' } }
  if (isMgmtAllBranches(branchId) && !lockedBranchId) {
    const branches = await getMisReportBranches(true)
    const packs = await Promise.all(
      branches.map(async (b) => {
        const [y, m] = ym.split('-').map(Number)
        const daysInMonth = new Date(y, m, 0).getDate()
        let savedDays = 0
        for (let d = 1; d <= daysInMonth; d++) {
          const dd = String(d).padStart(2, '0')
          const dt = `${ym}-${dd}`
          if (kind === 'night') {
            const r = await loadNightReport(b.id, dt)
            if (r?.dutyOfficerName || r?.unitsVisited) savedDays += 1
          } else {
            const r = await loadTrainingReport(b.id, dt)
            if (r?.trainingByName || r?.rows?.some((x) => x.unitName)) savedDays += 1
          }
        }
        return { branchId: b.id, branchName: b.name, savedDays }
      }),
    )
    return { status: 200, json: { ok: true, kind, branchId: 'ALL', allBranches: true, month: ym, branches: packs, items: [] } }
  }
  const [y, m] = ym.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const items: { date: string; saved: boolean }[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dd = String(d).padStart(2, '0')
    const dt = `${ym}-${dd}`
    if (kind === 'night') {
      const r = await loadNightReport(branchId, dt)
      items.push({ date: dt, saved: Boolean(r?.dutyOfficerName || r?.unitsVisited) })
    } else {
      const r = await loadTrainingReport(branchId, dt)
      items.push({
        date: dt,
        saved: Boolean(r?.trainingByName || r?.rows?.some((x) => x.unitName)),
      })
    }
  }
  return { status: 200, json: { ok: true, kind, branchId, month: ym, items } }
}

/** Management consolidated — list branches for picker */
export async function allMisBranchesForPicker() {
  const list = await getBranches(true)
  return list.filter((b) => b.active !== false).map((b) => ({ id: b.id, name: b.name }))
}

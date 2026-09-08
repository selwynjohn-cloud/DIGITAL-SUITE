import { getBranches, getGuards } from '../mis/store.js'
import { faDigitsMobile } from './fa-store.js'
import { loadFaAdvisoryRoster } from './fa-advisory-roster.js'
import {
  listFaAdvisoryIndexBranchIds,
  loadFaAdvisoryAcksRange,
  type FaAdvisoryAck,
} from './fa-advisory-store.js'

export type HdfcFaRecipient = {
  name: string
  employeeId: string
  mobile: string
  branchId: string
  branchName: string
  hdfcSite: string
  acknowledged: boolean
}

export function isHdfcFaSite(clientName: string, unitName = ''): boolean {
  return /hdfc/i.test(`${clientName || ''} ${unitName || ''}`)
}

function uniqueByMobile(rows: HdfcFaRecipient[]): HdfcFaRecipient[] {
  const seen = new Set<string>()
  const out: HdfcFaRecipient[] = []
  for (const r of rows) {
    const m = faDigitsMobile(r.mobile)
    if (m.length !== 10 || seen.has(m)) continue
    seen.add(m)
    out.push({ ...r, mobile: m })
  }
  return out
}

export async function listHdfcFaRecipients(branchIds: string[]): Promise<HdfcFaRecipient[]> {
  const ids = [...new Set(branchIds.map((x) => String(x || '').trim()).filter(Boolean))]
  const branches = await getBranches(true)
  const nameOf = (id: string) => branches.find((b) => b.id === id)?.name || id
  const [packs, rosters] = await Promise.all([
    Promise.all(ids.map((id) => getGuards(id))),
    Promise.all(ids.map((id) => loadFaAdvisoryRoster(id))),
  ])
  const fromRoster: HdfcFaRecipient[] = []
  ids.forEach((id, i) => {
    for (const r of rosters[i] || []) {
      fromRoster.push({
        name: r.name,
        employeeId: r.employeeId,
        mobile: r.mobile,
        branchId: id,
        branchName: nameOf(id),
        hdfcSite: r.hdfcSite || 'HDFC Bank',
        acknowledged: false,
      })
    }
  })
  const fromMis: HdfcFaRecipient[] = []
  if (!fromRoster.length) {
    ids.forEach((id, i) => {
      for (const g of packs[i] || []) {
        if (!isHdfcFaSite(g.clientName, g.unitName)) continue
        fromMis.push({
          name: String(g.name || '').trim(),
          employeeId: String(g.employeeId || '').trim(),
          mobile: g.mobile,
          branchId: id,
          branchName: nameOf(id),
          hdfcSite: String(g.unitName || g.clientName || 'HDFC Bank').trim(),
          acknowledged: false,
        })
      }
    })
  }
  const indexed = await listFaAdvisoryIndexBranchIds()
  const ackIds = ids.filter((id) => indexed.includes(id))
  const acks =
    ackIds.length > 0
      ? await loadFaAdvisoryAcksRange({ branchIds: ackIds, fromYmd: '2020-01-01', toYmd: '2099-12-31' })
      : []
  const ackByMobile = new Map(acks.map((a) => [faDigitsMobile(a.mobile), a]))
  const merged = uniqueByMobile([
    ...fromRoster,
    ...fromMis,
    ...acks.map((a) => ({
      name: a.name,
      employeeId: a.employeeId,
      mobile: a.mobile,
      branchId: a.branchId,
      branchName: a.branchName,
      hdfcSite: a.hdfcSite,
      acknowledged: true,
    })),
  ]).map((r) => {
    const ack = ackByMobile.get(r.mobile)
    return ack ? { ...r, acknowledged: true, name: r.name || ack.name, employeeId: r.employeeId || ack.employeeId } : r
  })
  merged.sort((a, b) => a.branchName.localeCompare(b.branchName) || a.name.localeCompare(b.name))
  return merged
}

export function ackListRows(acks: FaAdvisoryAck[]) {
  return acks.map((r) => ({
    submittedAt: r.submittedAt,
    ymd: r.ymd,
    code: r.code,
    name: r.name,
    employeeId: r.employeeId,
    branchName: r.branchName,
    hdfcSite: r.hdfcSite,
    mobile: r.mobile,
    langName: r.langName,
    answers: r.answers || [],
    score: r.score || '',
  }))
}

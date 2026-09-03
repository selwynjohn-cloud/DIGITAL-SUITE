/**
 * Client Door numbers — previous duty day (yesterday) only. No money.
 */
import { getClientVisits } from '../mis/client-visit-store.js'
import { misYesterdayIst } from '../mis/dates.js'
import { rowDeployTotals } from '../mis/deploy-math.js'
import { listIncidentReports } from '../mis/incident-report-store.js'
import { loadNightSessions } from '../mis/night-visit-session-store.js'
import { getComplaints, getDutyIncidents, getReport, getVisitDates, getVisits } from '../mis/store.js'
import type { ClientDoorSite } from './lookup.js'
import { fmtDoorDate } from './chrome.js'

export type ClientDoorSiteOnPost = {
  id: string
  name: string
  location: string
  sanctioned: number
  absent: number
  ot: number
  deployed: number
  vacant: number
}

export type ClientDoorMetrics = {
  date: string
  dateLabel: string
  clientLabel: string
  siteCount: number
  reportReady: boolean
  sanctioned: number
  absent: number
  ot: number
  deployed: number
  vacant: number
  agileVisits: number
  lastNightCheck: string
  lastTraining: string
  guardsComplaints: number
  clientComplaints: number
  incidents: number
  lateStart: number
  outOfPost: number
  onTime: number
  onPost: { sanctioned: number; deployed: number; vacant: number; sites: ClientDoorSiteOnPost[] }
}

function norm(s: string): string {
  return String(s ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
}

function sameSite(aName: string, aLoc: string, bName: string, bLoc: string): boolean {
  const an = norm(aName)
  const bn = norm(bName)
  if (!an || !bn) return false
  const nameOk = an === bn || an.includes(bn) || bn.includes(an)
  if (!nameOk) return false
  const al = norm(aLoc)
  const bl = norm(bLoc)
  if (!al || !bl) return true
  return al === bl || al.includes(bl) || bl.includes(al)
}

function hitsSite(
  sites: ClientDoorSite[],
  clientId: string,
  name: string,
  location = '',
): boolean {
  return sites.some((s) => {
    if (clientId && s.id === clientId) return true
    return sameSite(s.name, s.location, name, location)
  })
}

function prevMonth(ymd: string): string {
  const [y, m] = ymd.slice(0, 7).split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 2, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function emptyMetrics(date: string, label: string, siteCount: number): ClientDoorMetrics {
  return {
    date,
    dateLabel: fmtDoorDate(date),
    clientLabel: label,
    siteCount,
    reportReady: false,
    sanctioned: 0,
    absent: 0,
    ot: 0,
    deployed: 0,
    vacant: 0,
    agileVisits: 0,
    lastNightCheck: '—',
    lastTraining: '—',
    guardsComplaints: 0,
    clientComplaints: 0,
    incidents: 0,
    lateStart: 0,
    outOfPost: 0,
    onTime: 0,
    onPost: { sanctioned: 0, deployed: 0, vacant: 0, sites: [] },
  }
}

export function clientDoorClientLabel(sites: ClientDoorSite[]): string {
  if (!sites.length) return 'Client'
  if (sites.length === 1) return sites[0].name
  const groups = [...new Set(sites.map((s) => s.groupLabel))]
  return groups.length === 1 ? groups[0] : groups.join(' · ')
}

export async function buildClientDoorMetrics(sites: ClientDoorSite[]): Promise<ClientDoorMetrics> {
  const date = misYesterdayIst()
  const ym = date.slice(0, 7)
  const label = clientDoorClientLabel(sites)
  if (!sites.length) return emptyMetrics(date, label, 0)

  const branchIds = [...new Set(sites.map((s) => s.branchId))]
  let reportReady = false
  const onSites: ClientDoorSiteOnPost[] = []
  let san = 0
  let abs = 0
  let ot = 0
  let dep = 0
  let vac = 0

  for (const bid of branchIds) {
    const report = await getReport(bid, date)
    const rows = report?.rows ?? []
    if (report?.submittedAt || rows.length) reportReady = true
    for (const site of sites.filter((s) => s.branchId === bid)) {
      let sSan = 0
      let sAbs = 0
      let sOt = 0
      let sDep = 0
      let sVac = 0
      for (const row of rows) {
        if (!hitsSite([site], row.clientId, row.clientName, row.location)) continue
        const t = rowDeployTotals(row)
        sSan += t.san
        sAbs += t.abs
        sOt += t.ot
        sDep += t.dep
        sVac += t.vac
      }
      san += sSan
      abs += sAbs
      ot += sOt
      dep += sDep
      vac += sVac
      onSites.push({
        id: site.id,
        name: site.name,
        location: site.location,
        sanctioned: sSan,
        absent: sAbs,
        ot: sOt,
        deployed: sDep,
        vacant: sVac,
      })
    }
  }

  const yVisits = await getVisits(date)
  let agileVisits = yVisits.filter((v) => {
    if (!hitsSite(sites, '', v.client, v.unit || v.place)) return false
    const t = String(v.visitType || '').toUpperCase()
    return t !== 'N' && t !== 'T'
  }).length
  try {
    const scheduled = await getClientVisits()
    for (const v of scheduled) {
      if (v.active === false) continue
      if (String(v.visitDate || '').slice(0, 10) !== date) continue
      if (!hitsSite(sites, v.clientId, v.clientName, v.location)) continue
      agileVisits += 1
    }
  } catch {
    /* visits only */
  }

  const visitDates = (await getVisitDates()).filter(Boolean).sort().reverse().slice(0, 45)
  let lastNight = ''
  let lastTrain = ''
  for (const d of visitDates) {
    if (lastNight && lastTrain) break
    const list = d === date ? yVisits : await getVisits(d)
    for (const v of list) {
      if (!hitsSite(sites, '', v.client, v.unit || v.place)) continue
      const t = String(v.visitType || '').toUpperCase()
      if (!lastNight && t === 'N') lastNight = d
      if (!lastTrain && t === 'T') lastTrain = d
    }
  }
  for (const bid of branchIds) {
    for (const month of [ym, prevMonth(date)]) {
      const sessions = await loadNightSessions(bid, month)
      for (const ses of sessions) {
        if (ses.status === 'Cancelled') continue
        for (const stop of ses.stops || []) {
          if (!hitsSite(sites, stop.clientId, stop.clientName, stop.location)) continue
          const when = String(stop.report?.reportDate || ses.visitDate || '').slice(0, 10)
          if (!when) continue
          if (!lastNight || when > lastNight) lastNight = when
        }
      }
    }
  }

  const duties = await getDutyIncidents(date)
  let lateStart = 0
  let outOfPost = 0
  for (const inc of duties) {
    if (!hitsSite(sites, '', inc.client, inc.unit)) continue
    if (inc.type === 'late_start') lateStart += 1
    else if (inc.type === 'out_of_post') outOfPost += 1
  }
  const onTime = Math.max(0, san - lateStart - outOfPost)

  const complaintLists = await Promise.all(branchIds.map((id) => getComplaints(id)))
  let guardsComplaints = 0
  let clientComplaints = 0
  for (const c of complaintLists.flat()) {
    if (c.active === false) continue
    if (String(c.incidentDate || '').slice(0, 10) !== date) continue
    if (!hitsSite(sites, '', c.clientName, c.location)) continue
    if (String(c.type ?? '').toLowerCase() === 'guard') guardsComplaints += 1
    else clientComplaints += 1
  }

  const incidentLists = await Promise.all(branchIds.map((id) => listIncidentReports(id)))
  const incidents = incidentLists.flat().filter((r) => {
    const when = String(r.incidentDate || r.reportDate || '').slice(0, 10)
    if (when !== date) return false
    return hitsSite(sites, r.clientId, r.clientName, r.placeOfIncident)
  }).length

  return {
    date,
    dateLabel: fmtDoorDate(date),
    clientLabel: label,
    siteCount: sites.length,
    reportReady,
    sanctioned: san,
    absent: abs,
    ot,
    deployed: dep,
    vacant: vac,
    agileVisits,
    lastNightCheck: lastNight ? fmtDoorDate(lastNight) : '—',
    lastTraining: lastTrain ? fmtDoorDate(lastTrain) : '—',
    guardsComplaints,
    clientComplaints,
    incidents,
    lateStart,
    outOfPost,
    onTime,
    onPost: { sanctioned: san, deployed: dep, vacant: vac, sites: onSites },
  }
}

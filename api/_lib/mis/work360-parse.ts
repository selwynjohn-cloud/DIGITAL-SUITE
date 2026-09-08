import { nid, type MisVisit } from './store.js'
import { mapSheetRows, sheetRows } from './work360-excel.js'
import { formatKmLabel } from './work360-km.js'

const VISIT_HEADER_MAP: Record<string, string> = {
  employee: 'user',
  employeename: 'user',
  staff: 'user',
  staffname: 'user',
  username: 'user',
  user: 'user',
  officer: 'user',
  visitedby: 'user',
  patrolemployee: 'user',
  patrolemployeename: 'user',
  patrolstaff: 'user',
  patrolby: 'user',
  guardname: 'user',
  guard: 'user',
  fieldofficer: 'user',
  fieldofficername: 'user',
  client: 'client',
  clientname: 'client',
  company: 'client',
  visitedclient: 'client',
  visitedclientname: 'client',
  site: 'unit',
  sitename: 'unit',
  sitevisited: 'unit',
  visitedlocation: 'unit',
  visitedsite: 'unit',
  checkintime: 'visitTime',
  checkouttime: 'visitTime',
  visitdateandtime: 'visitTime',
  patroltime: 'visitTime',
  reportingtime: 'visitTime',
  intime: 'visitTime',
  outtime: 'visitTime',
  unit: 'unit',
  unitname: 'unit',
  location: 'unit',
  site: 'unit',
  visitedunit: 'unit',
  visittime: 'visitTime',
  time: 'visitTime',
  visitedat: 'visitTime',
  visitdate: 'visitTime',
  date: 'visitTime',
  timestamp: 'visitTime',
  personmet: 'personMet',
  contactperson: 'personMet',
  metperson: 'personMet',
  place: 'place',
  address: 'place',
  locationname: 'place',
  geolocation: 'place',
  remarks: 'remarks',
  notes: 'remarks',
  comment: 'remarks',
  description: 'remarks',
  visittype: 'visitTypeRaw',
  type: 'visitTypeRaw',
  daytype: 'visitTypeRaw',
  category: 'visitTypeRaw',
  patrolpoint: 'patrolPoint',
  traveldistance: 'kmTravelled',
  distance: 'kmTravelled',
  kmtravelled: 'kmTravelled',
  kmtravelleddistance: 'kmTravelled',
  travelledkm: 'kmTravelled',
  totaldistance: 'kmTravelled',
  patroldistance: 'kmTravelled',
  kilometers: 'kmTravelled',
  km: 'kmTravelled',
}

function inferVisitType(raw: string): 'D' | 'N' | 'T' | '' {
  const t = String(raw ?? '').trim().toUpperCase()
  if (!t) return 'D'
  if (t === 'D' || t.includes('DAY') || t.includes('PATROL')) return 'D'
  if (t === 'N' || t.includes('NIGHT')) return 'N'
  if (t === 'T' || t.includes('TRAIN')) return 'T'
  return 'D'
}

export function parseWork360VisitBlob(buffer: ArrayBuffer, date: string): MisVisit[] {
  const raw = sheetRows(buffer)
  let rows = mapSheetRows(raw, VISIT_HEADER_MAP, 2)
  if (!rows.length) rows = mapSheetRows(raw, VISIT_HEADER_MAP, 1)
  return rows
    .map((raw) => {
      const user = raw.user || ''
      const client = raw.client || ''
      if (!user && !client) return null
      const patrolPoint = (raw.patrolPoint || '').slice(0, 120)
      const kmTravelled = formatKmLabel(raw.kmTravelled || '')
      const remarks = [raw.remarks, patrolPoint ? `Patrol: ${patrolPoint}` : ''].filter(Boolean).join(' · ')
      return {
        id: nid('vs'),
        date,
        user: user.slice(0, 120),
        personMet: (raw.personMet || '').slice(0, 120),
        client: client.slice(0, 120),
        unit: (raw.unit || '').slice(0, 120),
        visitTime: (raw.visitTime || '').slice(0, 40),
        place: (raw.place || '').slice(0, 120),
        remarks: remarks.slice(0, 300),
        visitType: inferVisitType(raw.visitTypeRaw || ''),
        patrolPoint: patrolPoint || undefined,
        kmTravelled: kmTravelled || undefined,
        fromMobile: true,
      } satisfies MisVisit
    })
    .filter((v): v is MisVisit => v !== null)
    .slice(0, 5000)
}

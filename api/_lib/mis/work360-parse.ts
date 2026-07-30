import { nid, type MisVisit } from './store.js'
import { mapSheetRows, sheetRows } from './work360-excel.js'

const VISIT_HEADER_MAP: Record<string, string> = {
  employee: 'user',
  employeename: 'user',
  staff: 'user',
  staffname: 'user',
  username: 'user',
  user: 'user',
  officer: 'user',
  visitedby: 'user',
  client: 'client',
  clientname: 'client',
  company: 'client',
  visitedclient: 'client',
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
  const rows = mapSheetRows(sheetRows(buffer), VISIT_HEADER_MAP)
  return rows
    .map((raw) => {
      const user = raw.user || ''
      const client = raw.client || ''
      if (!user && !client) return null
      const remarks = [raw.remarks, raw.patrolPoint ? `Patrol: ${raw.patrolPoint}` : ''].filter(Boolean).join(' · ')
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
        fromMobile: true,
      } satisfies MisVisit
    })
    .filter((v): v is MisVisit => v !== null)
    .slice(0, 5000)
}

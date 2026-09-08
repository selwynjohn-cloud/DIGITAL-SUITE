/**
 * Agile Meeting — branch-wise online meetings (Zoom / Teams),
 * strategic = monthly · others = quarterly · action follow-ups.
 */

export type MeetPlatform = 'Zoom' | 'Teams'

export type MeetStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'NoShow'

export type MeetCadence = 'Monthly' | 'Quarterly'

export type MeetActionStatus = 'Open' | 'InProgress' | 'Done' | 'Overdue'

export type MeetMeeting = {
  id: string
  branchId: string
  branchName: string
  clientId: string
  clientName: string
  isStrategic: boolean
  cadence: MeetCadence
  platform: MeetPlatform
  meetingUrl: string
  meetingRef: string
  /** YYYY-MM-DD */
  meetingDate: string
  /** HH:MM 24h */
  meetingTime: string
  durationMins: number
  agenda: string
  contactName: string
  contactEmail: string
  contactPhone: string
  hostName: string
  hostEmail: string
  status: MeetStatus
  minutes: string
  /** Next required meeting date from cadence (YYYY-MM-DD) */
  nextDueDate: string
  createdAt: string
  updatedAt: string
  createdByEmail: string
}

export type MeetAction = {
  id: string
  meetingId: string
  branchId: string
  branchName: string
  clientId: string
  clientName: string
  title: string
  ownerName: string
  ownerEmail: string
  dueDate: string
  status: MeetActionStatus
  completionNotes: string
  completedAt: string
  createdAt: string
  updatedAt: string
  createdByEmail: string
}

export type MeetContact = {
  id: string
  branchId: string
  branchName: string
  clientId: string
  clientName: string
  name: string
  email: string
  phone: string
  role: string
  notes: string
  createdAt: string
  updatedAt: string
  createdByEmail: string
}

export type MeetAlert = {
  id: string
  kind: 'meeting' | 'cadence' | 'action'
  severity: 'critical' | 'warn' | 'info'
  title: string
  branchName: string
  clientName: string
  dueDate: string
  actionRequired: string
  daysLeft: number
  refId: string
}

export const MEET_PLATFORMS: { id: MeetPlatform; label: string }[] = [
  { id: 'Zoom', label: 'Zoom' },
  { id: 'Teams', label: 'Microsoft Teams' },
]

export const MEET_STATUSES: MeetStatus[] = ['Scheduled', 'Completed', 'Cancelled', 'NoShow']

export const MEET_ACTION_STATUSES: MeetActionStatus[] = ['Open', 'InProgress', 'Done', 'Overdue']

/** Strategic clients (5★) meet monthly; others quarterly. */
export function cadenceForStars(starRating: number): MeetCadence {
  return starRating >= 5 ? 'Monthly' : 'Quarterly'
}

export function isStrategicStars(starRating: number): boolean {
  return starRating >= 5
}

export function addMonthsIso(isoDate: string, months: number): string {
  const d = new Date(String(isoDate || '').slice(0, 10) + 'T12:00:00+05:30')
  if (!Number.isFinite(d.getTime())) return ''
  d.setMonth(d.getMonth() + months)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function nextDueFromMeeting(meetingDate: string, cadence: MeetCadence): string {
  return addMonthsIso(meetingDate, cadence === 'Monthly' ? 1 : 3)
}

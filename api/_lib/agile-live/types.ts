/** Agile Live — guard / staff phone door (not a copy of other suite apps). */

export const LIVE_APP_ID = 'live'
export const LIVE_APP_NAME = 'Agile Live'
export const REPORT_EARLY_MIN = 30

export const LIVE_TRIAL_KEYS = ['HYDERABAD-A', 'HYDERABAD-B', 'HI-TECH CITY'] as const

/** Phone try-out login — not a Master Directory guard. */
export const LIVE_DEMO_ID = 'LIVEDEMO'
export const LIVE_DEMO_MOBILE = '9000000001'

export type LiveStatusKind = 'late_start' | 'out_of_post' | 'break_duty' | 'early_end' | 'late' | 'sick' | 'on_the_way' | 'duty_continue' | 'staff_alarm'

/** 100 metres from the duty post (client GPS, or first Start Duty pin). */
export const OUT_OF_POST_M = 100
export const OUT_OF_POST_KM = 0.1

export const LIVE_BREAK_REASONS = [
  'Bathroom',
  'Medical',
  'Dinner',
  'Lunch',
  'Breakfast',
  'Get water',
] as const

export const LIVE_LEAVE_POST_MSG = 'You are leaving the assigned duty.'

export const LIVE_DUTY_REPLIES = ['On the way', 'Will report', 'Leave informed', 'Traffic delay'] as const
export type LiveDutyReply = (typeof LIVE_DUTY_REPLIES)[number]
export type LiveReminderKind = 'duty' | 'training' | 'vacant_post'

export type LiveReminder = {
  id: string
  at: string
  date: string
  kind: LiveReminderKind
  guardId: string
  idNo: string
  name: string
  mobile: string
  branch: string
  clientSite: string
  text: string
  reply: string
  repliedAt: string
  showWageSlip: boolean
  by: string
}

export type LiveVacantAllot = {
  id: string
  at: string
  date: string
  branch: string
  clientSite: string
  guardId: string
  idNo: string
  name: string
  mobile: string
  setBy: string
}

export type LiveGuardSession = {
  token: string
  guardId: string
  idNo: string
  name: string
  mobile: string
  branch: string
  clientSite: string
  shift: string
  designation: string
}

export type LiveFileKind = 'image' | 'pdf' | 'word' | 'audio' | 'video'

export type LiveChatMessage = {
  id: string
  at: string
  roomKey: string
  fromRole: 'guard' | 'staff'
  fromKind?: 'guard' | 'staff' | 'management'
  fromName: string
  fromId: string
  text: string
  fileKind?: LiveFileKind
  fileUrl?: string
  fileName?: string
  fileMime?: string
  /** 10-digit mobile — Guard, Staff, or added Director / extra number. */
  toMobile?: string
  toName?: string
}

export type LiveExtraMobile = {
  mobile: string
  name: string
  addedBy: string
  at: string
}

export type LiveMute = {
  id: string
  key: string
  name: string
  until: string
  by: string
  reason: string
}

export type LiveStatusRow = {
  id: string
  at: string
  date: string
  kind: LiveStatusKind
  guardId: string
  idNo: string
  name: string
  mobile: string
  branch: string
  clientSite: string
  remark: string
}

export const LIVE_NEWS_PAGE = 'https://www.agilegroup-digital.co.in/pulse'
export const LIVE_NEWS_CHANNEL = 'https://tinyurl.com/Security-News'
export const LIVE_JOBS_URL = 'https://www.securityjob.co.in'

export const LIVE_SOFT_DEFAULTS = [
  { title: 'Greet first', text: 'Greet every visitor and client politely at the gate.' },
  { title: 'Speak clearly', text: 'Speak clearly, keep your uniform neat, and stand at your post.' },
  { title: 'Listen first', text: 'Listen fully, then answer. Do not argue at the gate.' },
  { title: 'Help, then report', text: 'Help if it is safe. Report anything unusual to the OM / HOD at once.' },
] as const

export type LiveSiteNote = {
  key: string
  branch: string
  clientSite: string
  text: string
  by: string
  at: string
}

export type LiveSoftSkill = {
  id: string
  title: string
  text: string
  by: string
  at: string
}

export type LiveUnitWeekOff = {
  key: string
  branch: string
  clientSite: string
  weekday: number
  setBy: string
  at: string
}

export type LiveBlockedAttempt = {
  id: string
  at: string
  date: string
  roomKey: string
  fromName: string
  fromId: string
  hit: string
  snippet: string
}

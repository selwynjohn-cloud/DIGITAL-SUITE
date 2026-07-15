/**
 * SecurityJob portal storage (Upstash Redis). Holds site settings, job
 * postings, applicant registrations and applicant photos. Mirrors the current
 * securityjob.co.in admin so the rebuild is faithful.
 */

export type SjSettings = {
  guardsPlaced: string
  locations: string
  states: string
  whatsapp: string
  email1: string
  email2: string
}

export type SjJob = {
  id: string
  title: string
  status: 'Active' | 'Upcoming' | 'Closed'
  locations: string
  eligibility: string
  wages: string
  postedDate?: string
  closingDate: string
  benefits: string[]
}

export type SjApplicant = {
  id: string
  regCode: string
  name: string
  phone: string
  location: string
  role: string
  experience: string
  education: string
  language: string
  photoId: string
  createdAt: string
}

const SETTINGS_KEY = 'sj:settings'
const JOBS_KEY = 'sj:jobs'
const APPLICANTS_KEY = 'sj:applicants'
const COUNTER_KEY = 'sj:counter'
const IMG_PREFIX = 'sj:img:'

export const DEFAULT_SETTINGS: SjSettings = {
  guardsPlaced: '24,000+',
  locations: '1,410+',
  states: '15+',
  whatsapp: '9248707070',
  email1: 'Recruitment@securityjob.co.in',
  email2: 'recruitment@agilegroup.co.in',
}

export const BENEFIT_OPTIONS = [
  'ESI & PF as applicable law',
  'Free Accommodation',
  'Monthly Bonus',
  'Compulsory Weekly Off',
  'National Holidays',
  'Meritorious Service Appreciation',
  'Guard of Month',
  'Monthly Referral Incentives',
  'Accommodation Assistance',
  'POSH compliance with ICC support',
  'Quarterly Performance Incentives (every three months)',
  'Defined Career Growth on performance',
  'Government Scheme benefits',
  'Peaceful work environment',
  'Caring Client',
  'Timely wages',
]

export const DEFAULT_JOBS: SjJob[] = [
  {
    id: 'seed-guard',
    title: 'Security Guard',
    status: 'Active',
    locations: 'Tirupati',
    eligibility: '10th Pass',
    wages: 'Rs. 21,700/-',
    postedDate: '26/06/2026',
    closingDate: '18/07/2026',
    benefits: [
      'ESI & PF as applicable law',
      'Guard of Month',
      'Quarterly Performance Incentives (every three months)',
      'Government Scheme benefits',
      'Peaceful work environment',
      'Caring Client',
      'Timely wages',
      'Defined Career Growth on performance',
      'POSH compliance with ICC support',
      'Accommodation Assistance',
      'Monthly Referral Incentives',
      'Meritorious Service Appreciation',
    ],
  },
  {
    id: 'seed-officer',
    title: 'Security Officer',
    status: 'Active',
    locations: 'Hyderabad, Bangalore, Mumbai, Delhi',
    eligibility: '12th Pass | Age 21–45 | Ex-servicemen preferred',
    wages: 'Competitive',
    postedDate: '28/06/2026',
    closingDate: '20/07/2026',
    benefits: [
      'ESI & PF as applicable law',
      'Defined Career Growth on performance',
      'Quarterly Performance Incentives (every three months)',
      'Monthly Referral Incentives',
      'National Holidays',
      'Compulsory Weekly Off',
      'Peaceful work environment',
      'Timely wages',
    ],
  },
  {
    id: 'seed-lady',
    title: 'Lady Security Guard',
    status: 'Active',
    locations: 'Pan India — day shifts available',
    eligibility: '10th Pass | Age 18–40 | Female only',
    wages: 'Rs. 21,000/-',
    postedDate: '01/07/2026',
    closingDate: '22/07/2026',
    benefits: [
      'ESI & PF as applicable law',
      'Safe & supportive work environment',
      'Day shifts available',
      'POSH compliance with ICC support',
      'Meritorious Service Appreciation',
      'Government Scheme benefits',
      'Timely wages',
      'Accommodation Assistance',
    ],
  },
  {
    id: 'seed-supervisor',
    title: 'Security Supervisor',
    status: 'Active',
    locations: 'Major cities across India',
    eligibility: '12th Pass + 3 yrs experience | Age 25–50',
    wages: 'Incentive-based',
    postedDate: '28/06/2026',
    closingDate: '15/07/2026',
    benefits: [
      'Team leadership role',
      'Quarterly Performance Incentives (every three months)',
      'Defined Career Growth on performance',
      'ESI & PF as applicable law',
      'Monthly Referral Incentives',
      'Training provided',
      'Timely wages',
    ],
  },
  {
    id: 'seed-armed',
    title: 'Armed Guard / PSO',
    status: 'Active',
    locations: 'Select premium client sites',
    eligibility: 'Arms licence mandatory | Ex-military preferred',
    wages: 'Premium wage scale',
    postedDate: '30/06/2026',
    closingDate: '25/07/2026',
    benefits: [
      'Premium wage scale',
      'Specialised training',
      'Client-facing role',
      'ESI & PF as applicable law',
      'Meritorious Service Appreciation',
      'Defined Career Growth on performance',
      'Timely wages',
    ],
  },
  {
    id: 'seed-fire',
    title: 'Fire & Safety Guard',
    status: 'Active',
    locations: 'Industrial & commercial sites',
    eligibility: 'Fire safety certificate preferred | Age 18–45',
    wages: 'Competitive',
    postedDate: '02/07/2026',
    closingDate: '20/07/2026',
    benefits: [
      'Technical role',
      'Certification support',
      'ESI & PF as applicable law',
      'Quarterly Performance Incentives (every three months)',
      'Government Scheme benefits',
      'Timely wages',
      'Accommodation Assistance',
    ],
  },
]

/** Roles offered in the registration dropdown. */
export const ROLE_OPTIONS = [
  'Security Guard',
  'Lady Security Guard',
  'Security Officer',
  'Security Supervisor',
  'Armed Guard / PSO',
  'Personal Security Officer (PSO)',
  'Escort Guard',
  'Fire & Safety Guard',
  'CCTV Operator',
  'STF',
  'Driver',
  'Facility Attendant',
  'Admin Executive',
  'Admin Manager',
  'Accounts Executive',
  'Sales Co-ordinator',
  'Area Sales Manager (ASM)',
  'Operations Manager (OM)',
  'Regional Manager (RM)',
  'General Manager (GM)',
  'Assistant Vice President (AVP)',
  'Vice President (VP)',
  'Any Suitable Role',
]

export const EXPERIENCE_OPTIONS = ['Fresher', '1–3 years', '3–5 years', '5+ years']
export const LANGUAGE_OPTIONS = ['Hindi', 'English', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Assamese', 'Marathi', 'Other']

/** Education options for the registration dropdown. */
export const EDUCATION_OPTIONS = [
  'Below 10th',
  '10th Pass',
  '12th Pass',
  'ITI / Diploma',
  'Graduate',
  'Post Graduate',
  'Ex-Serviceman',
  'Other',
]

/**
 * Cities for the registration dropdown. `code` is the 3-letter airport/city
 * code and `st` is the 3-letter state prefix — both used to build the
 * registration code: ST/CODE/00000/DDMMYYYY-HHMM.
 */
export const CITY_OPTIONS: { city: string; code: string; st: string }[] = [
  { city: 'Hyderabad', code: 'HYD', st: 'TEL' },
  { city: 'Warangal', code: 'WGL', st: 'TEL' },
  { city: 'Karimnagar', code: 'KMR', st: 'TEL' },
  { city: 'Visakhapatnam', code: 'VTZ', st: 'AND' },
  { city: 'Vijayawada', code: 'VGA', st: 'AND' },
  { city: 'Guntur', code: 'GNT', st: 'AND' },
  { city: 'Tirupati', code: 'TIR', st: 'AND' },
  { city: 'Bengaluru', code: 'BLR', st: 'KAR' },
  { city: 'Mysuru', code: 'MYS', st: 'KAR' },
  { city: 'Mangaluru', code: 'IXE', st: 'KAR' },
  { city: 'Chennai', code: 'MAA', st: 'TAM' },
  { city: 'Coimbatore', code: 'CJB', st: 'TAM' },
  { city: 'Madurai', code: 'IXM', st: 'TAM' },
  { city: 'Mumbai', code: 'BOM', st: 'MAH' },
  { city: 'Pune', code: 'PNQ', st: 'MAH' },
  { city: 'Nagpur', code: 'NAG', st: 'MAH' },
  { city: 'Delhi', code: 'DEL', st: 'DEL' },
  { city: 'Gurugram', code: 'GGN', st: 'HAR' },
  { city: 'Noida', code: 'NOI', st: 'UTP' },
  { city: 'Lucknow', code: 'LKO', st: 'UTP' },
  { city: 'Kolkata', code: 'CCU', st: 'WBL' },
  { city: 'Ahmedabad', code: 'AMD', st: 'GUJ' },
  { city: 'Surat', code: 'STV', st: 'GUJ' },
  { city: 'Jaipur', code: 'JAI', st: 'RAJ' },
  { city: 'Kochi', code: 'COK', st: 'KER' },
  { city: 'Thiruvananthapuram', code: 'TRV', st: 'KER' },
  { city: 'Bhubaneswar', code: 'BBI', st: 'ODI' },
  { city: 'Indore', code: 'IDR', st: 'MAP' },
  { city: 'Bhopal', code: 'BHO', st: 'MAP' },
  { city: 'Guwahati', code: 'GAU', st: 'ASM' },
  { city: 'Chandigarh', code: 'IXC', st: 'CHD' },
  { city: 'Goa', code: 'GOI', st: 'GOA' },
  { city: 'Patna', code: 'PAT', st: 'BIH' },
  { city: 'Other', code: 'OTH', st: 'IND' },
]

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

export function sjStorageOk(): boolean {
  return redisConfig() !== null
}

async function redis(command: unknown[]): Promise<{ result?: unknown } | null> {
  const cfg = redisConfig()
  if (!cfg) return null
  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    })
    if (!res.ok) return null
    return (await res.json()) as { result?: unknown }
  } catch {
    return null
  }
}

export async function getSettings(): Promise<SjSettings> {
  const d = await redis(['GET', SETTINGS_KEY])
  if (d?.result && typeof d.result === 'string') {
    try {
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(d.result) as Partial<SjSettings>) }
    } catch {
      /* ignore */
    }
  }
  return DEFAULT_SETTINGS
}

export async function saveSettings(s: SjSettings): Promise<boolean> {
  const r = await redis(['SET', SETTINGS_KEY, JSON.stringify(s)])
  return r?.result === 'OK'
}

export async function getJobs(): Promise<SjJob[]> {
  const d = await redis(['GET', JOBS_KEY])
  if (d?.result && typeof d.result === 'string') {
    try {
      const arr = JSON.parse(d.result)
      if (Array.isArray(arr) && arr.length > 0) return arr as SjJob[]
    } catch {
      /* ignore */
    }
  }
  return DEFAULT_JOBS
}

export async function saveJobs(jobs: SjJob[]): Promise<boolean> {
  const r = await redis(['SET', JOBS_KEY, JSON.stringify(jobs)])
  return r?.result === 'OK'
}

export async function getApplicants(): Promise<SjApplicant[]> {
  const d = await redis(['LRANGE', APPLICANTS_KEY, 0, -1])
  const arr = Array.isArray(d?.result) ? (d!.result as string[]) : []
  return arr
    .map((s) => {
      try {
        return JSON.parse(s) as SjApplicant
      } catch {
        return null
      }
    })
    .filter((a): a is SjApplicant => a !== null)
    .map((a) => normalizeApplicant(a))
    .reverse()
}

/** IST date/time stamp for admin list, CSV, and emails. */
export function sjRegisteredStamp(when = new Date()): string {
  return when.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

/** Read date/time embedded in reg code: ST/CODE/00001/08072026-1019 */
export function parseRegCodeDate(regCode: string): Date | null {
  const m = String(regCode ?? '').match(/\/(\d{2})(\d{2})(\d{4})-(\d{2})(\d{2})$/)
  if (!m) return null
  const [, dd, mm, yyyy, hh, min] = m
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min))
  return Number.isNaN(d.getTime()) ? null : d
}

export function normalizeApplicant(a: SjApplicant): SjApplicant {
  const createdAt = String(a.createdAt ?? '').trim()
  if (createdAt) {
    const parsed = Date.parse(createdAt)
    if (!Number.isNaN(parsed)) return { ...a, createdAt: sjRegisteredStamp(new Date(parsed)) }
    return { ...a, createdAt }
  }
  const fromCode = parseRegCodeDate(a.regCode)
  return { ...a, createdAt: fromCode ? sjRegisteredStamp(fromCode) : '—' }
}

/** Build a registration code: ST/CODE/00000/DDMMYYYY-HHMM (from the city). */
export function buildRegCode(city: string, serial: number, when: Date): string {
  const c = (city || '').trim().toLowerCase()
  const match = CITY_OPTIONS.find((o) => o.city.toLowerCase() === c)
  const st = match ? match.st : (city.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase() || 'IND')
  const code = match ? match.code : (city.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase() || 'OTH')
  const dd = String(when.getDate()).padStart(2, '0')
  const mm = String(when.getMonth() + 1).padStart(2, '0')
  const hh = String(when.getHours()).padStart(2, '0')
  const min = String(when.getMinutes()).padStart(2, '0')
  return `${st}/${code}/${String(serial).padStart(5, '0')}/${dd}${mm}${when.getFullYear()}-${hh}${min}`
}

export async function addApplicant(a: Omit<SjApplicant, 'id' | 'regCode' | 'createdAt'>): Promise<SjApplicant | null> {
  const countRes = await redis(['INCR', COUNTER_KEY])
  const n = typeof countRes?.result === 'number' ? countRes.result : Date.now()
  const now = new Date()
  const applicant: SjApplicant = {
    ...a,
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    regCode: buildRegCode(a.location, n, now),
    createdAt: sjRegisteredStamp(now),
  }
  const r = await redis(['RPUSH', APPLICANTS_KEY, JSON.stringify(applicant)])
  return typeof r?.result === 'number' ? applicant : null
}

export async function replaceApplicants(list: SjApplicant[], counter: number): Promise<boolean> {
  await redis(['DEL', APPLICANTS_KEY])
  for (const a of list) await redis(['RPUSH', APPLICANTS_KEY, JSON.stringify(a)])
  await redis(['SET', COUNTER_KEY, String(counter)])
  return true
}

export async function deleteApplicant(id: string): Promise<boolean> {
  const all = await getApplicants()
  const kept = all.filter((a) => a.id !== id).reverse() // restore stored order
  await redis(['DEL', APPLICANTS_KEY])
  for (const a of kept) await redis(['RPUSH', APPLICANTS_KEY, JSON.stringify(a)])
  return true
}

export async function saveImage(dataUrl: string): Promise<string | null> {
  if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(dataUrl)) return null
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  const r = await redis(['SET', `${IMG_PREFIX}${id}`, dataUrl])
  return r?.result === 'OK' ? id : null
}

export async function getImage(id: string): Promise<string | null> {
  const safe = id.replace(/[^a-z0-9]/gi, '')
  if (!safe) return null
  const d = await redis(['GET', `${IMG_PREFIX}${safe}`])
  return d?.result && typeof d.result === 'string' ? d.result : null
}

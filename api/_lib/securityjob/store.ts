/**
 * SecurityJob portal storage (Upstash Redis). Holds site settings, job
 * postings, applicant registrations and applicant photos. Mirrors the current
 * securityjob.co.in admin so the rebuild is faithful.
 */

export type SjSettings = {
  guardsPlaced: string
  locations: string
  states: string
  helpline: string
  whatsapp: string
  email1: string
  email2: string
  /** Show Administrative & Operations hiring banner on public site */
  adminOpsShow: 'Yes' | 'No'
  adminOpsEyebrow: string
  adminOpsTitle: string
  adminOpsText: string
  adminOpsButton: string
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
  email: string
  dob: string
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
const ANTHEMS_KEY = 'sj:anthems'
const ACADEMY_VIDEOS_KEY = 'sj:academy-videos'

export type SjAnthem = {
  id: string
  language: string
  title: string
  url: string
  active: boolean
}

export type SjAcademyVideo = {
  id: string
  title: string
  url: string
  active: boolean
}

export const DEFAULT_SETTINGS: SjSettings = {
  guardsPlaced: '24,000+',
  locations: '1,410+',
  states: '15+',
  helpline: '+91 8500915599',
  whatsapp: '9248707070',
  email1: 'Recruitment@securityjob.co.in',
  email2: 'recruitment@agilegroup.co.in',
  adminOpsShow: 'Yes',
  adminOpsEyebrow: 'Office & Operations — Pan India',
  adminOpsTitle: 'We Are Hiring: Operations & Administrative Staff',
  adminOpsText:
    'Hiring for HR, Admin, Accounts, Operations & Coordination roles — register directly, no fees ever.',
  adminOpsButton: "Register Now — It's Free",
}

export const BENEFIT_GROUPS: { heading: string; items: string[] }[] = [
  {
    heading: 'Statutory Compliance',
    items: ['Wages as per MW Act', 'ESIC & EPF As Per Law'],
  },
  {
    heading: 'Financial Incentives & Bonuses',
    items: [
      'Monthly Bonus',
      'Annual Bonus',
      'Gratuity As per the Law',
      'Attendance Bonus',
      'Night Duty Allowance',
      'Operational Support Incentives',
      'Performance Incentives',
    ],
  },
  {
    heading: 'Food & Meals',
    items: ['Free Duty Food', 'Subsidized Food'],
  },
  {
    heading: 'Accommodation & Logistics',
    items: ['Accommodation Assistance', 'Free Accommodation', 'Free Transport (Route Basis)'],
  },
  {
    heading: 'Workplace Culture & Environment',
    items: ['Safe Working Place', 'Peaceful Working Environment', 'Caring Client'],
  },
  {
    heading: 'Leave & Time Off',
    items: ['Compulsory Weekly Off', 'National Holidays'],
  },
  {
    heading: 'Recognition & Career Growth',
    items: ['Guard of the Month Award', 'Meritorious Duty Appreciation', 'Defined Career Growth'],
  },
  {
    heading: 'Safety & Compliance',
    items: ['Timely Wages', 'POSH Compliance with ICC Support'],
  },
]

/** Flat list for toggles / validation (order follows groups). */
export const BENEFIT_OPTIONS = BENEFIT_GROUPS.flatMap((g) => g.items)

/** Map older saved benefit labels onto the new catalogue. */
const BENEFIT_ALIASES: Record<string, string> = {
  'Free Duty Food': 'Free Duty Food',
  'Subsidized Food': 'Subsidized Food',
  'Wages as per MW Act': 'Wages as per MW Act',
  'ESI & PF as applicable law': 'ESIC & EPF As Per Law',
  'ESIC & EPF As Per Law': 'ESIC & EPF As Per Law',
  'Meritorious Service Appreciation': 'Meritorious Duty Appreciation',
  'Guard of Month': 'Guard of the Month Award',
  'Guard of the Month Award': 'Guard of the Month Award',
  'POSH compliance with ICC support': 'POSH Compliance with ICC Support',
  'POSH Compliance with ICC Support': 'POSH Compliance with ICC Support',
  'Quarterly Performance Incentives (every three months)': 'Performance Incentives',
  'Defined Career Growth on performance': 'Defined Career Growth',
  'Defined Career Growth': 'Defined Career Growth',
  'Peaceful work environment': 'Peaceful Working Environment',
  'Peaceful Working Environment': 'Peaceful Working Environment',
  'Timely wages': 'Timely Wages',
  'Timely Wages': 'Timely Wages',
  'Monthly Referral Incentives': 'Operational Support Incentives',
  'Safe Working Place': 'Safe Working Place',
  'Caring Client': 'Caring Client',
  'Free Accommodation': 'Free Accommodation',
  'Accommodation Assistance': 'Accommodation Assistance',
  'Monthly Bonus': 'Monthly Bonus',
  'Annual Bonus': 'Annual Bonus',
  'Gratuity As per the Law': 'Gratuity As per the Law',
  'Attendance Bonus': 'Attendance Bonus',
  'Night Duty Allowance': 'Night Duty Allowance',
  'Operational Support Incentives': 'Operational Support Incentives',
  'Performance Incentives': 'Performance Incentives',
  'Free Transport (Route Basis)': 'Free Transport (Route Basis)',
  'Compulsory Weekly Off': 'Compulsory Weekly Off',
  'National Holidays': 'National Holidays',
  'Meritorious Duty Appreciation': 'Meritorious Duty Appreciation',
}

export function normalizeBenefitLabels(list: string[] | undefined): string[] {
  const allowed = new Set(BENEFIT_OPTIONS)
  const out: string[] = []
  for (const raw of list || []) {
    const mapped = BENEFIT_ALIASES[String(raw).trim()] || String(raw).trim()
    if (allowed.has(mapped) && !out.includes(mapped)) out.push(mapped)
  }
  return out
}

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
      'ESIC & EPF As Per Law',
      'Guard of the Month Award',
      'Performance Incentives',
      'Peaceful Working Environment',
      'Caring Client',
      'Timely Wages',
      'Defined Career Growth',
      'POSH Compliance with ICC Support',
      'Accommodation Assistance',
      'Operational Support Incentives',
      'Meritorious Duty Appreciation',
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
      'ESIC & EPF As Per Law',
      'Defined Career Growth',
      'Performance Incentives',
      'Operational Support Incentives',
      'National Holidays',
      'Compulsory Weekly Off',
      'Peaceful Working Environment',
      'Timely Wages',
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
      'ESIC & EPF As Per Law',
      'Safe Working Place',
      'POSH Compliance with ICC Support',
      'Meritorious Duty Appreciation',
      'Timely Wages',
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
      'Performance Incentives',
      'Defined Career Growth',
      'ESIC & EPF As Per Law',
      'Operational Support Incentives',
      'Timely Wages',
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
      'ESIC & EPF As Per Law',
      'Meritorious Duty Appreciation',
      'Defined Career Growth',
      'Timely Wages',
      'Performance Incentives',
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
      'ESIC & EPF As Per Law',
      'Performance Incentives',
      'Timely Wages',
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
  'Area Manager',
  'Field Officer',
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
      if (Array.isArray(arr) && arr.length > 0) {
        return (arr as SjJob[])
          .filter((j) => !/^Operations Team\s*[—-]\s*(Mumbai|Hyderabad)$/i.test(String(j.title || '')))
          .map((j) => ({
            ...j,
            benefits: normalizeBenefitLabels(j.benefits),
          }))
      }
    } catch {
      /* ignore */
    }
  }
  return DEFAULT_JOBS
}

export async function saveJobs(jobs: SjJob[]): Promise<boolean> {
  const cleaned = (jobs || []).map((j) => ({
    ...j,
    benefits: normalizeBenefitLabels(j.benefits),
  }))
  const r = await redis(['SET', JOBS_KEY, JSON.stringify(cleaned)])
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
  const base: SjApplicant = {
    id: String(a.id || ''),
    regCode: String(a.regCode || ''),
    name: String(a.name || ''),
    phone: String(a.phone || ''),
    email: String(a.email || '').trim().toLowerCase(),
    dob: String(a.dob || '').trim(),
    location: String(a.location || ''),
    role: String(a.role || ''),
    experience: String(a.experience || ''),
    education: String(a.education || ''),
    language: String(a.language || ''),
    photoId: String(a.photoId || ''),
    createdAt: String(a.createdAt ?? '').trim(),
  }
  if (base.createdAt) {
    const parsed = Date.parse(base.createdAt)
    if (!Number.isNaN(parsed)) return { ...base, createdAt: sjRegisteredStamp(new Date(parsed)) }
    return base
  }
  const fromCode = parseRegCodeDate(base.regCode)
  return { ...base, createdAt: fromCode ? sjRegisteredStamp(fromCode) : '—' }
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

export const DEFAULT_ANTHEMS: SjAnthem[] = [
  {
    id: 'anthem-en',
    language: 'English',
    title: 'The Shield of Honor',
    url: '/securityjob/song-english.mp3',
    active: true,
  },
  {
    id: 'anthem-te',
    language: 'Telugu',
    title: 'Gauravam – Rakshana',
    url: '/securityjob/song-telugu.mp3',
    active: true,
  },
  {
    id: 'anthem-hi',
    language: 'Hindi',
    title: 'Shaurya aur Suraksha',
    url: '/securityjob/song-hindi.mp3',
    active: true,
  },
  {
    id: 'anthem-ta',
    language: 'Tamil',
    title: 'Gauravam – Pathukaappu',
    url: '/securityjob/song-tamil.mp3',
    active: true,
  },
  {
    id: 'anthem-ml',
    language: 'Malayalam',
    title: 'Agile Recruitment Anthem',
    url: '/securityjob/song-malayalam.mp3',
    active: true,
  },
]

export const DEFAULT_ACADEMY_VIDEOS: SjAcademyVideo[] = []

function sanitizeAnthem(raw: Partial<SjAnthem>): SjAnthem | null {
  const language = String(raw.language ?? '').trim().slice(0, 80)
  const title = String(raw.title ?? '').trim().slice(0, 160)
  const url = String(raw.url ?? '').trim().slice(0, 600)
  if (!language || !url) return null
  return {
    id: String(raw.id || `anthem-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`).slice(0, 40),
    language,
    title: title || language,
    url,
    active: raw.active !== false,
  }
}

function sanitizeAcademyVideo(raw: Partial<SjAcademyVideo>): SjAcademyVideo | null {
  const title = String(raw.title ?? '').trim().slice(0, 160)
  const url = String(raw.url ?? '').trim().slice(0, 600)
  if (!title || !url) return null
  return {
    id: String(raw.id || `vid-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`).slice(0, 40),
    title,
    url,
    active: raw.active !== false,
  }
}

export async function getAnthems(): Promise<SjAnthem[]> {
  const d = await redis(['GET', ANTHEMS_KEY])
  if (d?.result && typeof d.result === 'string') {
    try {
      const arr = JSON.parse(d.result)
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.map((x) => sanitizeAnthem(x)).filter((x): x is SjAnthem => Boolean(x))
      }
    } catch {
      /* ignore */
    }
  }
  return DEFAULT_ANTHEMS
}

export async function saveAnthems(list: SjAnthem[]): Promise<boolean> {
  const cleaned = (list || [])
    .map((x) => sanitizeAnthem(x))
    .filter((x): x is SjAnthem => Boolean(x))
    .slice(0, 40)
  const r = await redis(['SET', ANTHEMS_KEY, JSON.stringify(cleaned)])
  return r?.result === 'OK'
}

export async function getAcademyVideos(): Promise<SjAcademyVideo[]> {
  const d = await redis(['GET', ACADEMY_VIDEOS_KEY])
  if (d?.result && typeof d.result === 'string') {
    try {
      const arr = JSON.parse(d.result)
      if (Array.isArray(arr)) {
        return arr.map((x) => sanitizeAcademyVideo(x)).filter((x): x is SjAcademyVideo => Boolean(x))
      }
    } catch {
      /* ignore */
    }
  }
  return DEFAULT_ACADEMY_VIDEOS
}

export async function saveAcademyVideos(list: SjAcademyVideo[]): Promise<boolean> {
  const cleaned = (list || [])
    .map((x) => sanitizeAcademyVideo(x))
    .filter((x): x is SjAcademyVideo => Boolean(x))
    .slice(0, 40)
  const r = await redis(['SET', ACADEMY_VIDEOS_KEY, JSON.stringify(cleaned)])
  return r?.result === 'OK'
}

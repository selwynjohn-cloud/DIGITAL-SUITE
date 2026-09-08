export type SuiteApp = {
  id: string
  number: string
  title: string
  tagline: string
  color: string
  buttonDark: string
  staffUrl: string
  managementUrl: string
  /** Trainee portal URL (Agile Training — third login button) */
  traineeUrl?: string
  status: 'live' | 'coming-soon' | 'external'
  /** Opens in a new tab without Command Centre login (Facebook, LinkedIn only) */
  external?: boolean
  /** Opens in the same window without Command Centre login (own Google/training login or welcome page) */
  opensDirectly?: boolean
  /** One Management button only — no Staff / HOD twin (Agile Visitors) */
  singlePortal?: boolean
}

/** Apps with their own login screen — skip Command Centre OTP (one login only). */
const DIRECT = { opensDirectly: true as const }

/**
 * Landing hub for www.agilegroup-digital.co.in
 * Card order locked to Director’s preferred sequence (not alphabetical).
 */
const MOBILE = import.meta.env.VITE_MOBILE_URL ?? 'https://agilegroup-work360.aititude.in/'
const FACEBOOK = import.meta.env.VITE_FACEBOOK_URL ?? 'https://www.facebook.com/agilegroup2#'
const LINKEDIN =
  import.meta.env.VITE_LINKEDIN_URL ??
  'https://www.linkedin.com/company/13703487/admin/dashboard/'
const YOUTUBE =
  (import.meta.env.VITE_YOUTUBE_URL as string | undefined)?.trim() ||
  'https://www.youtube.com/@agilegroup1619'

/**
 * Agile Insights (Client & Branch Profitability).
 * Prefer direct app URL when VITE_PROFITABILITY_URL is set; otherwise use Command Centre bridge.
 */
const PROFITABILITY_HOST = (import.meta.env.VITE_PROFITABILITY_URL as string | undefined)?.replace(
  /\/$/,
  '',
)
const PROFITABILITY_BRIDGE = '/profitability'
const PROFITABILITY_ACCOUNTS = PROFITABILITY_HOST
  ? `${PROFITABILITY_HOST}/login/accounts?from=command-centre`
  : `${PROFITABILITY_BRIDGE}/?portal=staff`
const PROFITABILITY_MANAGEMENT = PROFITABILITY_HOST
  ? `${PROFITABILITY_HOST}/login/management?from=command-centre`
  : `${PROFITABILITY_BRIDGE}/?portal=management`

const DEPLOYMENT_URL =
  'https://script.google.com/macros/s/AKfycbyZYSEmhioAAM4UYaF0bRFIfn04rNst_yaShc9Iqf6_oZ7Ce69QCu5-awfS5fdwdOk/exec'

const REVIEWS_URL =
  'https://script.google.com/macros/s/AKfycby0MYZkRDiXONTxUi2h-a9CEZYRIuN1h4Sw_7ENTPX_1s7vmrs62pWsD0RCMV-lRvDp/exec'

function appPath(slug: string, portal: 'staff' | 'management') {
  return `/${slug}/?portal=${portal}`
}

/**
 * Command Centre cards — Director order:
 * CRM → Recruitment → Training → Deployment → Meeting → Control → MIS → Guards →
 * Reviews → Licenses → Fleet → Facilities → Assets → Insights → HR Audit →
 * Security News → LinkedIn → Facebook → YouTube → Mobile → Visitors
 */
export const suiteApps: SuiteApp[] = [
  {
    id: 'crm',
    number: '01',
    title: 'Agile CRM',
    tagline: 'Driving Growth Through Every Lead',
    color: '#c2410c',
    buttonDark: '#9a3412',
    staffUrl: '/crm?portal=staff',
    managementUrl: '/crm?portal=management',
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'recruitment',
    number: '02',
    title: 'Agile Recruitment',
    tagline: 'Building Teams That Win',
    color: '#7c3aed',
    buttonDark: '#5b21b6',
    staffUrl: '/recruitment/?portal=staff&v=20260819r',
    managementUrl: '/recruitment/?portal=management&v=20260819r',
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'training',
    number: '03',
    title: 'Agile Training',
    tagline: "Investing in Tomorrow's Talent",
    color: '#0f766e',
    buttonDark: '#115e59',
    staffUrl: '/training/?portal=lecturer',
    managementUrl: '/training/?portal=management',
    traineeUrl: '/training/?portal=trainee',
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'deployment',
    number: '04',
    title: 'Agile Deployment',
    tagline: 'Seamless Starts, Strong Results',
    color: '#9333ea',
    buttonDark: '#7e22ce',
    staffUrl: DEPLOYMENT_URL,
    managementUrl: DEPLOYMENT_URL,
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'meetings',
    number: '05',
    title: 'Agile Meeting (War Room)',
    tagline: 'Zoom & Teams — Monthly Strategic, Quarterly Clients',
    color: '#7c3aed',
    buttonDark: '#6d28d9',
    staffUrl: appPath('meetings', 'staff'),
    managementUrl: appPath('meetings', 'management'),
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'control',
    number: '06',
    title: 'Agile Control',
    tagline: 'Commanding Operations with Confidence',
    color: '#a16207',
    buttonDark: '#854d0e',
    staffUrl: '/control?portal=staff&v=20260819',
    managementUrl: '/control?portal=management&v=20260819',
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'mis',
    number: '07',
    title: 'Agile MIS',
    tagline: 'Official MIS — old Manus system closed',
    color: '#2563eb',
    buttonDark: '#1d4ed8',
    staffUrl: '/mis-staff',
    managementUrl: '/mis',
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'guards',
    number: '08',
    title: 'Agile Guards',
    tagline: 'Caring for Those Who Protect',
    color: '#2563eb',
    buttonDark: '#1d4ed8',
    staffUrl: '/guards',
    managementUrl: '/guards?portal=management',
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'reviews',
    number: '09',
    title: 'Agile Reviews',
    tagline: 'Knowing Where We Stand',
    color: '#db2777',
    buttonDark: '#be185d',
    staffUrl: REVIEWS_URL,
    managementUrl: REVIEWS_URL,
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'licences',
    number: '10',
    title: 'Agile Licenses',
    tagline: 'PSARA, Trade & Client Labour Licence Compliance',
    color: '#6366f1',
    buttonDark: '#4f46e5',
    staffUrl: appPath('licences', 'staff'),
    managementUrl: appPath('licences', 'management'),
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'fleets',
    number: '11',
    title: 'Agile Fleet',
    tagline: 'Moving Forward with Confidence',
    color: '#0d9488',
    buttonDark: '#0f766e',
    staffUrl: '/fleets?portal=staff&v=20260817',
    managementUrl: '/fleets?portal=management&v=20260817',
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'facilities',
    number: '12',
    title: 'Agile Facilities',
    tagline: 'Property, Leases, Tax & Facility Upkeep',
    color: '#0891b2',
    buttonDark: '#0e7490',
    staffUrl: appPath('facilities', 'staff'),
    managementUrl: appPath('facilities', 'management'),
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'assets',
    number: '13',
    title: 'Agile Assets',
    tagline: 'Furniture, Fittings & Office Equipment Across Branches',
    color: '#ca8a04',
    buttonDark: '#a16207',
    staffUrl: appPath('assets', 'staff'),
    managementUrl: appPath('assets', 'management'),
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'profitability',
    number: '14',
    title: 'Agile Insights',
    tagline: 'Strategic Analysis — PBITDA, Collection & Branch Profitability',
    color: '#0b3d6e',
    buttonDark: '#082a4a',
    staffUrl: PROFITABILITY_ACCOUNTS,
    managementUrl: PROFITABILITY_MANAGEMENT,
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'hr-audit',
    number: '15',
    title: 'Agile HR Audit',
    tagline: 'Apex Client SLA — PF, ESIC, Wages & Issue Closure',
    color: '#be185d',
    buttonDark: '#9d174d',
    staffUrl: '/audit/?portal=staff',
    managementUrl: '/audit/?portal=management',
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'pulse',
    number: '16',
    title: 'Agile Security News',
    tagline: 'Connecting the Security Community',
    color: '#14532d',
    buttonDark: '#166534',
    staffUrl: '/pulse',
    managementUrl: '/pulse/admin',
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'linkedin',
    number: '17',
    title: 'Agile LinkedIn',
    tagline: 'Connecting Professionals, Creating Opportunities',
    color: '#0a66c2',
    buttonDark: '#004182',
    staffUrl: LINKEDIN,
    managementUrl: LINKEDIN,
    status: 'external',
    external: true,
  },
  {
    id: 'facebook',
    number: '18',
    title: 'Agile Facebook',
    tagline: 'Showcasing Our Journey',
    color: '#1877f2',
    buttonDark: '#0d65d9',
    staffUrl: FACEBOOK,
    managementUrl: FACEBOOK,
    status: 'external',
    external: true,
  },
  {
    id: 'youtube',
    number: '19',
    title: 'Agile YouTube',
    tagline: 'Stories, Training & Company Presence',
    color: '#dc2626',
    buttonDark: '#b91c1c',
    staffUrl: YOUTUBE || '#',
    managementUrl: YOUTUBE || '#',
    status: YOUTUBE ? 'external' : 'coming-soon',
    ...(YOUTUBE ? { external: true as const } : DIRECT),
  },
  {
    id: 'mobile',
    number: '20',
    title: 'Agile Mobile',
    tagline: 'Workforce Connectivity at Your Fingertips',
    color: '#0ea5e9',
    buttonDark: '#0284c7',
    staffUrl: MOBILE,
    managementUrl: MOBILE,
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'visitors',
    number: '21',
    title: 'Agile Visitors Management',
    tagline: 'Client visitor app — one Management portal',
    color: '#1d4ed8',
    buttonDark: '#1e3a8a',
    staffUrl: '/visitors/?portal=management',
    managementUrl: '/visitors/?portal=management',
    status: 'live',
    singlePortal: true,
    ...DIRECT,
  },
]

export const companyBadges = [
  'RRU Affiliated',
  '30,000+ Guards',
  '24 Branches',
]

export const disclaimerText = `This Digital Operations Command Centre and all integrated applications are
for authorised users of Agile Security Force Private Limited only. Unauthorised
access, use, or disclosure of information is strictly prohibited and may attract
penalties under the Information Technology Act, 2000 and other applicable laws.
By proceeding, you confirm that you are an authorised user and agree to comply with
company policies, data protection rules, and acceptable use guidelines.`

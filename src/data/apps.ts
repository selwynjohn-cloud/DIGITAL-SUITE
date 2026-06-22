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
}

/** Apps with their own login screen — skip Command Centre OTP (one login only). */
const DIRECT = { opensDirectly: true as const }

/**
 * Landing hub for www.agilegroup-digital.co.in
 * Internal apps require email/SMS OTP on Command Centre before redirect (see vercel.json).
 */
const TRAINING_LMS =
  import.meta.env.VITE_TRAINING_URL ?? 'https://guard-training-app.vercel.app/'
const TRAINING_ACADEMY = import.meta.env.VITE_TRAINING_ACADEMY_URL ?? ''
const MOBILE = import.meta.env.VITE_MOBILE_URL ?? 'https://agilegroup-work360.aititude.in/'
const MIS_EXEC =
  import.meta.env.VITE_MIS_URL ??
  'https://script.google.com/macros/s/AKfycbzw8XOjIplL8AEHHIk75KayFLx2HipbJFlwEcfPi2RiHXN-xWYNVENiJM5XlO1N1io/exec'
const CRM_EXEC =
  import.meta.env.VITE_CRM_URL ??
  'https://script.google.com/macros/s/AKfycbz_UyonvAFhyxtI1dLfUKCOxzUjW7fhFOjeyB5xThIQPsIo_vjoaAzOGVs9CNMwWcA/exec'
const FACEBOOK = import.meta.env.VITE_FACEBOOK_URL ?? 'https://www.facebook.com/agilegroup2#'
const LINKEDIN =
  import.meta.env.VITE_LINKEDIN_URL ??
  'https://www.linkedin.com/company/13703487/admin/dashboard/'

function appPath(slug: string, portal: 'staff' | 'management') {
  return `/${slug}/?portal=${portal}`
}

export const suiteApps: SuiteApp[] = [
  {
    id: 'recruitment',
    number: '01',
    title: 'Agile Recruitment',
    tagline: 'Building Teams That Win',
    color: '#7c3aed',
    buttonDark: '#5b21b6',
    staffUrl: '/recruitment',
    managementUrl: '/recruitment',
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'training',
    number: '02',
    title: 'Agile Training',
    tagline: "Investing in Tomorrow's Talent",
    color: '#0f766e',
    buttonDark: '#115e59',
    staffUrl: TRAINING_ACADEMY || `${TRAINING_LMS}?portal=lecturer`,
    managementUrl: TRAINING_ACADEMY || `${TRAINING_LMS}?portal=management`,
    traineeUrl: `${TRAINING_LMS}?portal=trainee`,
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'crm',
    number: '03',
    title: 'Agile CRM',
    tagline: 'Driving Growth Through Every Lead',
    color: '#c2410c',
    buttonDark: '#9a3412',
    staffUrl: CRM_EXEC,
    managementUrl: CRM_EXEC,
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
    staffUrl: '/deployment',
    managementUrl: '/deployment',
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'mis',
    number: '05',
    title: 'Agile MIS',
    tagline: 'Measuring Performance, Driving Excellence',
    color: '#2563eb',
    buttonDark: '#1d4ed8',
    staffUrl: MIS_EXEC,
    managementUrl: MIS_EXEC,
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
    staffUrl: appPath('control', 'staff'),
    managementUrl: appPath('control', 'management'),
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'guards',
    number: '07',
    title: 'Agile Guards',
    tagline: 'Caring for Those Who Protect',
    color: '#dc2626',
    buttonDark: '#b91c1c',
    staffUrl: '/guards',
    managementUrl: '/guards',
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'quality',
    number: '08',
    title: 'Agile Quality',
    tagline: 'Guiding Excellence Every Day',
    color: '#059669',
    buttonDark: '#047857',
    staffUrl: appPath('quality', 'staff'),
    managementUrl: appPath('quality', 'management'),
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'meetings',
    number: '09',
    title: 'Agile Meeting (War Room)',
    tagline: 'Where Strategies Become Actions',
    color: '#7c3aed',
    buttonDark: '#6d28d9',
    staffUrl: appPath('meetings', 'staff'),
    managementUrl: appPath('meetings', 'management'),
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'reviews',
    number: '10',
    title: 'Agile Reviews',
    tagline: 'Knowing Where We Stand',
    color: '#db2777',
    buttonDark: '#be185d',
    staffUrl: '/reviews',
    managementUrl: '/reviews',
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'pulse',
    number: '11',
    title: 'Agile News',
    tagline: 'Connecting the Security Community',
    color: '#14532d',
    buttonDark: '#166534',
    staffUrl: '/pulse',
    managementUrl: '/pulse',
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'fleets',
    number: '12',
    title: 'Agile Fleet',
    tagline: 'Moving Forward with Confidence',
    color: '#0d9488',
    buttonDark: '#0f766e',
    staffUrl: '/fleets',
    managementUrl: '/fleets',
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'assets',
    number: '13',
    title: 'Agile Assets',
    tagline: 'Empowering Growth Through Resources',
    color: '#ca8a04',
    buttonDark: '#a16207',
    staffUrl: appPath('assets', 'staff'),
    managementUrl: appPath('assets', 'management'),
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'facilities',
    number: '14',
    title: 'Agile Facilities',
    tagline: 'Creating Comfortable Workspaces',
    color: '#0891b2',
    buttonDark: '#0e7490',
    staffUrl: appPath('facilities', 'staff'),
    managementUrl: appPath('facilities', 'management'),
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'licences',
    number: '15',
    title: 'Agile Licenses',
    tagline: 'Ensuring Compliance, Always',
    color: '#6366f1',
    buttonDark: '#4f46e5',
    staffUrl: appPath('licences', 'staff'),
    managementUrl: appPath('licences', 'management'),
    status: 'live',
    ...DIRECT,
  },
  {
    id: 'facebook',
    number: '16',
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
    id: 'mobile',
    number: '18',
    title: 'Agile Mobile',
    tagline: 'Workforce Connectivity at Your Fingertips',
    color: '#0ea5e9',
    buttonDark: '#0284c7',
    staffUrl: MOBILE,
    managementUrl: MOBILE,
    status: 'live',
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

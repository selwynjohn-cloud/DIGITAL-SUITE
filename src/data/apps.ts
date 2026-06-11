export type SuiteApp = {
  id: string
  number: string
  title: string
  tagline: string
  color: string
  buttonDark: string
  staffUrl: string
  managementUrl: string
  status: 'live' | 'coming-soon' | 'external'
  external?: boolean
  /** Email + PIN required before access (default true) */
  requiresAuth?: boolean
  /** Redirects to a separate built app after login (e.g. Training) */
  hasBuiltInPortal?: boolean
  /** Live app with its own login — opens directly (e.g. MIS on Google Apps Script) */
  usesOwnAuth?: boolean
}

/**
 * Landing hub for agilegroup-digital.co.in
 * HODs/Staff and Management use @agilegroup.co.in email + PIN login.
 * Exceptions: Facebook & LinkedIn open externally without login.
 * Agile Mobile, CRM, MIS & Reviews use their own login on external URLs.
 */
/** Trainee LMS — PSARA online modules for guards */
const TRAINING_LMS =
  import.meta.env.VITE_TRAINING_URL ?? 'https://training.agilegroup-digital.co.in/'
/** App 02 HOD/Management — Google Apps Script (OTP login, same Users sheet) */
const TRAINING_ACADEMY = import.meta.env.VITE_TRAINING_ACADEMY_URL ?? ''
const MIS_EXEC =
  'https://script.google.com/macros/s/AKfycbxZ5teJVOw61Nf7j5HcVw0Mu-8mrzWtQg7PpeaewvkC8EGSbMQNiI8MMl9k7CVe0qBm/exec'
/** New Agile MIS on Google Apps Script; /mis on Vercel redirects here too */
const MIS = import.meta.env.VITE_MIS_URL ?? MIS_EXEC
const CRM =
  import.meta.env.VITE_CRM_URL ?? 'https://tinyurl.com/CRM-AGILE'
const REVIEWS =
  import.meta.env.VITE_REVIEWS_URL ?? 'https://tinyurl.com/AGILE-REVIEW-2627'
const PULSE_EXEC =
  'https://script.google.com/macros/s/AKfycbzGqyQNdyvBy2Bw1p7N84rdB-8VobOGVT8g4gZcghtN27SI6guihHdaNXLTNfIOYKQ/exec'
const PULSE = import.meta.env.VITE_PULSE_URL ?? PULSE_EXEC
const MOBILE =
  import.meta.env.VITE_MOBILE_URL ?? 'https://agilegroup-work360.aititude.in/'

function appPath(slug: string, portal: 'staff' | 'management') {
  return `/${slug}/?portal=${portal}`
}

export const suiteApps: SuiteApp[] = [
  {
    id: 'recruitment',
    number: '01',
    title: 'Agile Recruitment',
    tagline: 'Building High-Performing Teams',
    color: '#7c3aed',
    buttonDark: '#5b21b6',
    staffUrl: appPath('recruitment', 'staff'),
    managementUrl: appPath('recruitment', 'management'),
    status: 'live',
  },
  {
    id: 'training',
    number: '02',
    title: 'Agile Training',
    tagline: 'Security Workforce Competency Validation — 1 week certificate (existing guards)',
    color: '#0f766e',
    buttonDark: '#115e59',
    staffUrl: TRAINING_ACADEMY || `${TRAINING_LMS}?portal=trainee`,
    managementUrl: TRAINING_ACADEMY || `${TRAINING_LMS}?portal=admin`,
    status: 'live',
    usesOwnAuth: true,
    hasBuiltInPortal: true,
  },
  {
    id: 'crm',
    number: '03',
    title: 'Agile CRM',
    tagline: 'BD pipeline, leads & tenders — live CRM',
    color: '#c2410c',
    buttonDark: '#9a3412',
    staffUrl: CRM,
    managementUrl: CRM,
    status: 'live',
    usesOwnAuth: true,
    hasBuiltInPortal: true,
  },
  {
    id: 'deployment',
    number: '04',
    title: 'Agile Deployment',
    tagline: 'Streamline deployments from planning to execution.',
    color: '#9333ea',
    buttonDark: '#7e22ce',
    staffUrl: appPath('deployment', 'staff'),
    managementUrl: appPath('deployment', 'management'),
    status: 'live',
  },
  {
    id: 'mis',
    number: '05',
    title: 'Agile MIS',
    tagline: 'Daily MIS — integrated with Agile Digital Suite',
    color: '#2563eb',
    buttonDark: '#1d4ed8',
    staffUrl: MIS,
    managementUrl: MIS,
    status: 'live',
    usesOwnAuth: true,
    hasBuiltInPortal: true,
  },
  {
    id: 'control',
    number: '06',
    title: 'Agile Control (24×7)',
    tagline: 'Command & Control Centre',
    color: '#a16207',
    buttonDark: '#854d0e',
    staffUrl: appPath('control', 'staff'),
    managementUrl: appPath('control', 'management'),
    status: 'live',
  },
  {
    id: 'guards',
    number: '07',
    title: 'Agile Guards',
    tagline: 'Caring for Those Who Protect',
    color: '#dc2626',
    buttonDark: '#b91c1c',
    staffUrl: appPath('guards', 'staff'),
    managementUrl: appPath('guards', 'management'),
    status: 'live',
  },
  {
    id: 'quality',
    number: '08',
    title: 'Agile Quality',
    tagline: 'Drive excellence through quality and compliance.',
    color: '#059669',
    buttonDark: '#047857',
    staffUrl: appPath('quality', 'staff'),
    managementUrl: appPath('quality', 'management'),
    status: 'live',
  },
  {
    id: 'meetings',
    number: '09',
    title: 'Agile Meeting',
    tagline: 'Connecting Teams, Sharing Ideas',
    color: '#7c3aed',
    buttonDark: '#6d28d9',
    staffUrl: appPath('meetings', 'staff'),
    managementUrl: appPath('meetings', 'management'),
    status: 'live',
  },
  {
    id: 'reviews',
    number: '10',
    title: 'Agile Reviews',
    tagline: 'Yardstick of Quality — client review form',
    color: '#db2777',
    buttonDark: '#be185d',
    staffUrl: REVIEWS,
    managementUrl: REVIEWS,
    status: 'live',
    usesOwnAuth: true,
    hasBuiltInPortal: true,
  },
  {
    id: 'pulse',
    number: '11',
    title: 'Agile Security Force — The Pulse',
    tagline: 'Connecting Security Community — A World Full of Opportunity',
    color: '#14532d',
    buttonDark: '#166534',
    staffUrl: PULSE,
    managementUrl: PULSE,
    status: 'live',
    usesOwnAuth: true,
    hasBuiltInPortal: true,
  },
  {
    id: 'fleets',
    number: '12',
    title: 'Agile Fleets',
    tagline: 'Monitor, maintain, and move with confidence.',
    color: '#0d9488',
    buttonDark: '#0f766e',
    staffUrl: appPath('fleets', 'staff'),
    managementUrl: appPath('fleets', 'management'),
    status: 'live',
  },
  {
    id: 'assets',
    number: '13',
    title: 'Agile Assets',
    tagline: 'Track, manage, and maximise every asset.',
    color: '#ca8a04',
    buttonDark: '#a16207',
    staffUrl: appPath('assets', 'staff'),
    managementUrl: appPath('assets', 'management'),
    status: 'live',
  },
  {
    id: 'facilities',
    number: '14',
    title: 'Agile Facilities',
    tagline: 'Manage spaces, services, and infrastructure seamlessly.',
    color: '#0891b2',
    buttonDark: '#0e7490',
    staffUrl: appPath('facilities', 'staff'),
    managementUrl: appPath('facilities', 'management'),
    status: 'live',
  },
  {
    id: 'licences',
    number: '15',
    title: 'Agile Licenses',
    tagline: 'Control renewals, compliance, and software entitlements.',
    color: '#6366f1',
    buttonDark: '#4f46e5',
    staffUrl: appPath('licences', 'staff'),
    managementUrl: appPath('licences', 'management'),
    status: 'live',
  },
  {
    id: 'facebook',
    number: '16',
    title: 'Agile Facebook',
    tagline: 'Social Media & Community Engagement',
    color: '#1877f2',
    buttonDark: '#0d65d9',
    staffUrl: import.meta.env.VITE_FACEBOOK_URL ?? 'https://facebook.com',
    managementUrl: import.meta.env.VITE_FACEBOOK_ADMIN_URL ?? 'https://facebook.com',
    status: 'external',
    external: true,
    requiresAuth: false,
  },
  {
    id: 'linkedin',
    number: '17',
    title: 'Agile LinkedIn',
    tagline: 'Professional Network & Brand Presence',
    color: '#0a66c2',
    buttonDark: '#004182',
    staffUrl: import.meta.env.VITE_LINKEDIN_URL ?? 'https://linkedin.com',
    managementUrl: import.meta.env.VITE_LINKEDIN_ADMIN_URL ?? 'https://linkedin.com',
    status: 'external',
    external: true,
    requiresAuth: false,
  },
  {
    id: 'mobile',
    number: '18',
    title: 'Agile Mobile',
    tagline: 'Workforce mobile app — Work360 portal for guards and field teams.',
    color: '#0ea5e9',
    buttonDark: '#0284c7',
    staffUrl: MOBILE,
    managementUrl: MOBILE,
    status: 'live',
    usesOwnAuth: true,
    hasBuiltInPortal: true,
  },
]

export const companyBadges = [
  'PSARA Licensed',
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

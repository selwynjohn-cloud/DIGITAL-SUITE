export type LoginGuideEntry = {
  number: string
  title: string
  howToOpen: string
  loginSteps: string
  demoNote?: string
}

export const suiteLoginGuide: LoginGuideEntry[] = [
  {
    number: '01',
    title: 'Agile Recruitment',
    howToOpen: 'www.agilegroup-digital.co.in → App 01 → HODs/Staff or Management',
    loginSteps:
      'Staff portal login — email OTP to your inbox. Manage applicants, camps, Recruited Today. Public apply link for WhatsApp: agile-recruitment.codewords.run',
  },
  {
    number: '02',
    title: 'Agile Training',
    howToOpen: 'www.agilegroup-digital.co.in → App 02 → choose Trainees / Staff / Management',
    loginSteps:
      'Command Centre OTP first (@agilegroup.co.in email or registered mobile). Then the Training app opens — sign in again there if asked.',
  },
  {
    number: '03',
    title: 'Agile CRM',
    howToOpen: 'www.agilegroup-digital.co.in → App 03 → HODs/Staff or Management',
    loginSteps:
      'Opens Agile CRM directly — one login only. Email OTP sent to your inbox.',
  },
  {
    number: '04',
    title: 'Agile Deployment',
    howToOpen: 'www.agilegroup-digital.co.in → App 04',
    loginSteps: 'Command Centre OTP first, then the portal welcome page opens.',
  },
  {
    number: '05',
    title: 'Agile MIS',
    howToOpen: 'www.agilegroup-digital.co.in → App 05',
    loginSteps:
      'Opens MIS directly. Sign in with your email — OTP is sent to your inbox (Director, Management, and Staff).',
  },
  {
    number: '06',
    title: 'Agile Control (24×7)',
    howToOpen: 'www.agilegroup-digital.co.in → App 06',
    loginSteps: 'Command Centre OTP first, then the portal welcome page opens.',
  },
  {
    number: '07',
    title: 'Agile Guards',
    howToOpen: 'www.agilegroup-digital.co.in → App 07',
    loginSteps: 'Command Centre OTP first, then the portal welcome page opens.',
  },
  {
    number: '08',
    title: 'Agile Quality',
    howToOpen: 'www.agilegroup-digital.co.in → App 08',
    loginSteps: 'Command Centre OTP first, then the portal welcome page opens.',
  },
  {
    number: '09',
    title: 'Agile Meeting',
    howToOpen: 'www.agilegroup-digital.co.in → App 09',
    loginSteps: 'Command Centre OTP first, then the portal welcome page opens.',
  },
  {
    number: '10',
    title: 'Agile Reviews',
    howToOpen: 'www.agilegroup-digital.co.in → App 10',
    loginSteps:
      'Command Centre OTP first, then Reviews opens. Sign in again inside the app with email OTP if asked.',
  },
  {
    number: '11',
    title: 'Agile Security Force — The Pulse',
    howToOpen: 'www.agilegroup-digital.co.in → App 11',
    loginSteps:
      'Command Centre OTP first, then The Pulse opens. Sign in again inside the app if asked.',
  },
  {
    number: '12',
    title: 'Agile Fleets',
    howToOpen: 'www.agilegroup-digital.co.in → App 12',
    loginSteps: 'Command Centre OTP first, then the portal welcome page opens.',
  },
  {
    number: '13',
    title: 'Agile Assets',
    howToOpen: 'www.agilegroup-digital.co.in → App 13',
    loginSteps: 'Command Centre OTP first, then the portal welcome page opens.',
  },
  {
    number: '14',
    title: 'Agile Facilities',
    howToOpen: 'www.agilegroup-digital.co.in → App 14',
    loginSteps: 'Command Centre OTP first, then the portal welcome page opens.',
  },
  {
    number: '15',
    title: 'Agile Licenses',
    howToOpen: 'www.agilegroup-digital.co.in → App 15',
    loginSteps: 'Command Centre OTP first, then the portal welcome page opens.',
  },
  {
    number: '16',
    title: 'Agile Facebook',
    howToOpen: 'www.agilegroup-digital.co.in → App 16',
    loginSteps: 'Opens Facebook in a new tab. No Agile login — use your Facebook account if you manage the page.',
  },
  {
    number: '17',
    title: 'Agile LinkedIn',
    howToOpen: 'www.agilegroup-digital.co.in → App 17',
    loginSteps: 'Opens LinkedIn in a new tab. No Agile login — use your LinkedIn account.',
  },
  {
    number: '18',
    title: 'Agile Mobile (Work360)',
    howToOpen: 'www.agilegroup-digital.co.in → App 18',
    loginSteps:
      'Opens Work360 directly — no Command Centre OTP. Sign in inside the app with the details HR/IT gave you.',
  },
]

export const suiteHomeUrl = 'https://www.agilegroup-digital.co.in/'

/** User-facing note: every internal app requires OTP on the Command Centre first. */
export const suiteAccessNote =
  'Open www.agilegroup-digital.co.in. Click any app — most apps ask for a 6-digit OTP (email or mobile) before they open. Agile Mobile (Work360), Facebook, and LinkedIn open directly without Command Centre login.'

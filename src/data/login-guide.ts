export type LoginGuideEntry = {
  number: string
  title: string
  howToOpen: string
  loginSteps: string
  demoNote?: string
}

/** Matches Command Centre card order (Director sequence). */
export const suiteLoginGuide: LoginGuideEntry[] = [
  {
    number: '01',
    title: 'Agile CRM',
    howToOpen: 'www.agilegroup-digital.co.in → App 01 → HODs/Staff or Management',
    loginSteps: 'Opens Agile CRM directly — one login only. Email OTP sent to your inbox.',
  },
  {
    number: '02',
    title: 'Agile Recruitment',
    howToOpen: 'www.agilegroup-digital.co.in → App 02 → HODs/Staff or Management',
    loginSteps:
      'HODs / Staff: select branch + work email + Send PIN (code in inbox). Left menu includes Daily Recruitment Report (DRR). Management: work email + Send PIN — same DRR menu. Public apply link: www.securityjob.co.in',
  },
  {
    number: '03',
    title: 'Agile Training',
    howToOpen: 'www.agilegroup-digital.co.in → App 03 → choose Trainees / Staff / Management',
    loginSteps:
      'Staff and Management: work email + Send PIN (code in inbox). Training team use Management with training@agilegroup.co.in. Trainees: mobile login on Digital Learning.',
  },
  {
    number: '04',
    title: 'Agile Deployment',
    howToOpen: 'www.agilegroup-digital.co.in → App 04',
    loginSteps: 'Command Centre OTP first, then the portal welcome page opens.',
  },
  {
    number: '05',
    title: 'Agile Meeting',
    howToOpen: 'www.agilegroup-digital.co.in → App 05 → HODs/Staff or Management',
    loginSteps:
      'HOD / Staff: branch password or email PIN (own branch). Management: email PIN (all branches). Left menu: Dashboard, Schedule Meeting (Zoom/Teams), Meetings, Client List (Strategic monthly / others quarterly), Contacts (email), Action Follow-ups, Reminders. Dates use calendar pickers.',
  },
  {
    number: '06',
    title: 'Agile Control (24×7)',
    howToOpen: 'www.agilegroup-digital.co.in → App 06',
    loginSteps:
      'Authorised emails only (Command Centre / Help Desk / Director). Staff and Management both have the same left menu: Dashboard, Track 1 · Control (Incident Received, Command Console, Cases, Escalations, Client Checks, Sites, Logbook, HOTO), Track 2 · Help Desk (Night Calls). Sign in with work email PIN — the 6-digit PIN is also in the email subject line. Daily Control Report mail goes at 8:00 AM.',
  },
  {
    number: '07',
    title: 'Agile MIS',
    howToOpen: 'www.agilegroup-digital.co.in → App 07',
    loginSteps:
      'Opens MIS directly. Sign in with your email — OTP is sent to your inbox (Director, Management, and Staff).',
  },
  {
    number: '08',
    title: 'Agile Guards',
    howToOpen: 'www.agilegroup-digital.co.in → App 08',
    loginSteps: 'Command Centre OTP first, then the portal welcome page opens.',
  },
  {
    number: '09',
    title: 'Agile Reviews',
    howToOpen: 'www.agilegroup-digital.co.in → App 09',
    loginSteps:
      'Command Centre OTP first, then Reviews opens. Sign in again inside the app with email OTP if asked.',
  },
  {
    number: '10',
    title: 'Agile Licenses',
    howToOpen: 'www.agilegroup-digital.co.in → App 10 → HODs/Staff or Management',
    loginSteps:
      'HOD / Staff: branch password or email PIN (own branch). Management: email PIN (all branches). Left menu: Dashboard, Branch Licences (PSARA / Shop & Est. / Trade), Labour Licences (State & Central), Client List, Renewal Reminders. Dates use calendar pickers.',
  },
  {
    number: '11',
    title: 'Agile Fleet',
    howToOpen: 'www.agilegroup-digital.co.in → App 11',
    loginSteps: 'Command Centre OTP first, then the portal welcome page opens.',
  },
  {
    number: '12',
    title: 'Agile Facilities',
    howToOpen: 'www.agilegroup-digital.co.in → App 12 → HODs/Staff or Management',
    loginSteps:
      'HOD / Staff: select branch + branch password, or email PIN. Management: work email + PIN from inbox (PIN also in email subject). Left menu: Dashboard, Properties, Leases, Tax & Compliance, Maintenance, Reports, Alerts.',
  },
  {
    number: '13',
    title: 'Agile Assets',
    howToOpen: 'www.agilegroup-digital.co.in → App 13 → HODs/Staff or Management',
    loginSteps:
      'HOD / Staff: select branch + branch password, or email PIN. Management: work email + PIN. Left menu: Dashboard, Asset Directory, Branch Stock, Transfers/HOTO, Maintenance, Write-off, Alerts.',
  },
  {
    number: '14',
    title: 'Agile Insights',
    howToOpen: 'www.agilegroup-digital.co.in → App 14 → Accounts or Management',
    loginSteps:
      'Opens Agile Insights directly (no Command Centre OTP). Accounts: accounts@agilegroup.in / accounts123. Management: management@agilegroup.in / management123. MD/Director: tap Master PIN and enter the Director Master PIN (same as Command Centre SUPER_ADMIN_PIN).',
    demoNote: 'Strategic Analysis app — client-branch-profitability.vercel.app',
  },
  {
    number: '15',
    title: 'Agile HR Audit',
    howToOpen: 'www.agilegroup-digital.co.in → App 15 → HODs/Staff or Management',
    loginSteps:
      'HOD / Staff: branch password or email PIN (own branch). Management: email PIN (all branches). Left menu: Dashboard, Apex Clients (Monthly e.g. KRC on fixed day / Quarterly e.g. HDFC), Audits (PF/ESIC/wages pack + checklist), Pending Issues (close), Reminders. Dates use calendar pickers. Sample document formats can be added later.',
  },
  {
    number: '16',
    title: 'Agile Security News',
    howToOpen: 'www.agilegroup-digital.co.in → App 16',
    loginSteps:
      'Command Centre OTP first, then Security News (The Pulse) opens. Sign in again inside the app if asked.',
  },
  {
    number: '17',
    title: 'Agile LinkedIn',
    howToOpen: 'www.agilegroup-digital.co.in → App 17',
    loginSteps: 'Opens LinkedIn in a new tab. No Agile login — use your LinkedIn account.',
  },
  {
    number: '18',
    title: 'Agile Facebook',
    howToOpen: 'www.agilegroup-digital.co.in → App 18',
    loginSteps: 'Opens Facebook in a new tab. No Agile login — use your Facebook account if you manage the page.',
  },
  {
    number: '19',
    title: 'Agile YouTube',
    howToOpen: 'www.agilegroup-digital.co.in → App 19 → opens company YouTube',
    loginSteps: 'Opens https://www.youtube.com/@agilegroup1619 (no separate login).',
  },
  {
    number: '20',
    title: 'Agile Mobile (Work360)',
    howToOpen: 'www.agilegroup-digital.co.in → App 20',
    loginSteps:
      'Opens Work360 directly — no Command Centre OTP. Sign in inside the app with the details HR/IT gave you.',
  },
]

export const suiteHomeUrl = 'https://www.agilegroup-digital.co.in/'

/** User-facing note: every internal app requires OTP on the Command Centre first. */
export const suiteAccessNote =
  'Open www.agilegroup-digital.co.in. Click any app — most apps ask for a 6-digit OTP (email or mobile) before they open. Agile Mobile (Work360), Facebook, LinkedIn, and Agile Insights (App 14) open directly without Command Centre login.'

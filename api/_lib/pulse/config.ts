import type { EditorialContent, Quiz, QuizQuestion } from './types.js'

/**
 * AGILE PULSE — editorial content and settings.
 *
 * The NEWS, WEATHER and TEMPERATURES are pulled automatically every edition.
 * The items below change less often (weekly-ish). Edit the text/links here and
 * the next bulletin picks them up. (Later this can be moved to a Google Sheet
 * so it can be edited without touching code.)
 */

/** Company links shown in the header/footer. */
export const BRAND = {
  companyName: 'AGILE SECURITY FORCE PRIVATE LIMITED',
  website: 'https://www.agilegroup.co.in/',
  websiteLabel: 'www.agilegroup.co.in',
  logoUrl: 'https://www.agilegroup-digital.co.in/agile-logo.png',
}

/**
 * Cities shown in the temperature ticker, with coordinates for the (free,
 * no-key) Open-Meteo weather service.
 */
export const WEATHER_CITIES: { name: string; lat: number; lon: number }[] = [
  { name: 'Delhi', lat: 28.61, lon: 77.21 },
  { name: 'Mumbai', lat: 19.076, lon: 72.877 },
  { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
  { name: 'Hyderabad', lat: 17.385, lon: 78.4867 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567 },
  { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185 },
  { name: 'Kochi', lat: 9.9312, lon: 76.2673 },
  { name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
  { name: 'Lucknow', lat: 26.8467, lon: 80.9462 },
  { name: 'Bhopal', lat: 23.2599, lon: 77.4126 },
  { name: 'Patna', lat: 25.5941, lon: 85.1376 },
  { name: 'Chandigarh', lat: 30.7333, lon: 76.7794 },
  { name: 'Guwahati', lat: 26.1445, lon: 91.7362 },
  { name: 'Bhubaneswar', lat: 20.2961, lon: 85.8245 },
  { name: 'Balasore', lat: 21.4942, lon: 86.932 }, // Odisha coast — cyclone / depression track
  { name: 'Surat', lat: 21.1702, lon: 72.8311 },
  { name: 'Nagpur', lat: 21.1458, lon: 79.0882 },
  { name: 'Indore', lat: 22.7196, lon: 75.8577 },
]

/**
 * Major Indian cities — used to pull and tag city-level security & safety news.
 */
export const INDIAN_NEWS_CITIES: string[] = [
  'Hyderabad', 'Secunderabad', 'Hitech City', 'Bangalore', 'Bengaluru', 'Mumbai', 'Delhi', 'New Delhi',
  'Chennai', 'Kolkata', 'Ahmedabad', 'Pune', 'Lucknow', 'Jaipur', 'Patna', 'Bhopal', 'Visakhapatnam',
  'Vizag', 'Vijayawada', 'Tirupati', 'Kochi', 'Guwahati', 'Chandigarh', 'Nagpur', 'Indore', 'Surat',
  'Bhubaneswar', 'Coimbatore', 'Madurai', 'Thiruvananthapuram', 'Varanasi', 'Kanpur', 'Noida',
  'Gurugram', 'Gurgaon', 'Raipur', 'Ranchi', 'Dehradun', 'Amritsar', 'Ludhiana', 'Agra', 'Meerut',
  'Mysuru', 'Mysore', 'Mangalore', 'Hubli', 'Warangal', 'Nellore', 'Guntur', 'Rajahmundry', 'Kakinada',
  'Balasore', 'Cuttack', 'Puri', 'Jamshedpur', 'Siliguri', 'Jodhpur', 'Udaipur', 'Kota', 'Nashik',
  'Thane', 'Navi Mumbai', 'Faridabad', 'Ghaziabad', 'Srinagar', 'Jammu', 'Shimla', 'Panaji', 'Goa',
  'Leh', 'Ladakh', 'Kargil', 'Manali', 'Dharamshala', 'Mandya', 'Ramanagara', 'Ghatkopar', 'Kurla',
]

/** States / regions — so Leh, Himachal, Karnataka statewide news is not dropped. */
export const INDIAN_NEWS_REGIONS: string[] = [
  'India', 'Indian', 'Ladakh', 'Himachal', 'Karnataka', 'Maharashtra', 'Telangana', 'Andhra',
  'Tamil Nadu', 'TamilNadu', 'Kerala', 'Gujarat', 'Odisha', 'Orissa', 'Kashmir', 'Jammu',
  'Uttarakhand', 'Punjab', 'Haryana', 'Rajasthan', 'Bihar', 'Jharkhand', 'Assam', 'West Bengal',
  'Madhya Pradesh', 'Chhattisgarh', 'Goa', 'Puducherry', 'Pondicherry',
]

/**
 * Major highways / corridors — road-closure news helps branches, guards & client logistics.
 */
export const INDIAN_HIGHWAY_CORRIDORS: string[] = [
  'Mumbai-Pune', 'Mumbai Pune', 'Pune-Mumbai', 'Pune Mumbai', 'Mumbai-Pune Expressway', 'Express Highway',
  'Yamuna Expressway', 'Delhi-Jaipur', 'Delhi-Mumbai', 'Bengaluru-Mysuru', 'Bangalore-Mysore',
  'Chennai-Bengaluru', 'Hyderabad-Vijayawada', 'NH48', 'NH44', 'NH16', 'Eastern Express Highway',
  'Western Express Highway', 'Mumbai-Nashik', 'Pune-Bengaluru', 'Visakhapatnam-Srikakulam',
]

/** Words that mark a story as security / safety related (for city flash section). */
export const SECURITY_SAFETY_KEYWORDS: string[] = [
  'security', 'crime', 'police', 'accident', 'crash', 'collision', 'fire', 'blaze', 'explosion',
  'robbery', 'theft', 'snatching', 'attack', 'assault', 'blast', 'bomb', 'alert', 'arrest', 'incident',
  'injured', 'killed', 'dies', 'dead', 'traffic', 'highway', 'expressway', 'road closed', 'protest',
  'bandh', 'hartal', 'strike', 'agitation', 'blockade', 'curfew', 'terror', 'militant', 'nsg', 'bank',
  'atm', 'cash', 'loot', 'dacoity', 'heist', 'hostage', 'kidnap', 'shootout', 'firing', 'stabbing',
  'mob', 'unrest', 'riot', 'hazmat', 'gas leak', 'building collapse', 'flood', 'cyclone', 'heavy rain',
  'landslide', 'land slide', 'earthquake', 'tremor', 'weather alert', 'imd', 'red alert', 'orange alert',
  'flight delay', 'flights cancelled', 'airport', 'railway', 'train cancelled', 'advisory',
  'gallantry', 'commendation', 'bravery', 'meritorious', 'cisf', 'crpf', 'bsf',
]

export type NewsCategory = {
  title: string
  titleHindi: string
  emoji: string
  headerBg: string
  keywords: string[]
  /** Story must mention one of INDIAN_NEWS_CITIES. */
  cityRequired?: boolean
}

/**
 * Security & safety news categories — Indian cities first, then thematic sections.
 * Order matters: first match wins when categorising headlines.
 */
export const NEWS_CATEGORIES: NewsCategory[] = [
  {
    title: 'Highway & Road Closure Alerts — India',
    titleHindi: 'हाईवे बंद और सड़क चेतावनी — भारत',
    emoji: '🛣️',
    headerBg: '#b45309',
    keywords: [
      'highway closed', 'expressway closed', 'road closed', 'road blocked', 'road shut', 'traffic suspended',
      'vehicular movement', 'movement suspended', 'landslide', 'land slide', 'mudslide', 'rockfall', 'rock fall',
      'cave-in', 'washout', 'road caved', 'stranded', 'diversion', 'alternate route', 'traffic halted',
      'mumbai-pune', 'mumbai pune', 'pune mumbai', 'express highway', 'expressway', 'eastern express',
      'western express', 'nh48', 'nh44', 'nh16', 'yamuna expressway', 'rain disrupts',
      'flooded road', 'waterlogging', 'traffic advisory', 'commuters warned', 'road blockade',
      ...INDIAN_HIGHWAY_CORRIDORS.map((c) => c.toLowerCase()),
    ],
  },
  {
    title: 'Travel Advisory — Air, Rail, Road & Water',
    titleHindi: 'यात्रा सलाह — हवा, रेल, सड़क और जल',
    emoji: '✈️',
    headerBg: '#0f766e',
    keywords: [
      'flight delay', 'flights delayed', 'flights cancelled', 'flight cancelled', 'airport advisory',
      'airport closed', 'fog delay', 'dgca', 'air india delay', 'indigo delay', 'railway cancelled',
      'trains cancelled', 'train delayed', 'rail advisory', 'ferry cancelled', 'port closed',
      'shipping advisory', 'waterways', 'imd travel', 'commuters advised', 'leave early',
    ],
  },
  {
    title: 'Public Agitation, Bandh & Strike — India',
    titleHindi: 'आंदोलन, बंद और हड़ताल — भारत',
    emoji: '📢',
    headerBg: '#9a3412',
    keywords: [
      'bandh', 'hartal', 'statewide strike', 'state-wide strike', 'general strike', 'agitation',
      'public protest', 'road blockade', 'chakka jam', 'dharna', 'rally disrupts', 'shutdown call',
    ],
  },
  {
    title: 'Weather, Earthquake & Natural Calamity — India',
    titleHindi: 'मौसम, भूकंप और प्राकृतिक आपदा — भारत',
    emoji: '⛈',
    headerBg: '#0d9488',
    keywords: [
      'earthquake', 'tremor', 'seismic', 'weather alert', 'heavy rain', 'cyclone', 'depression',
      'imd', 'flood', 'cloudburst', 'odisha', 'bay of bengal', 'red alert', 'orange alert',
      'yellow alert', 'heatwave', 'cold wave', 'thunderstorm', 'lightning', 'leh', 'ladakh',
    ],
  },
  {
    title: 'Indian City Flash — Security & Safety',
    titleHindi: 'भारतीय शहर — सुरक्षा और सुरक्षा समाचार',
    emoji: '🏙️',
    headerBg: '#1e40af',
    cityRequired: true,
    keywords: SECURITY_SAFETY_KEYWORDS,
  },
  {
    title: 'Incidents & Accidents — India',
    titleHindi: 'घटनाएं और दुर्घटनाएं — भारत',
    emoji: '🚨',
    headerBg: '#991b1b',
    keywords: [
      'accident', 'incident', 'collision', 'crash', 'overturned', 'injured', 'hospitalised',
      'hospitalized', 'killed', 'dies', 'dead', 'fatal', 'mishap', 'tragedy', 'building collapse',
      'wall collapse', 'stampede', 'electrocuted', 'drowning', 'fall from',
    ],
  },
  {
    title: 'Fire, Explosion & Hazards — India',
    titleHindi: 'आग, विस्फोट और खतरे — भारत',
    emoji: '🔥',
    headerBg: '#b91c1c',
    keywords: [
      'fire accident', 'fire breaks out', 'blaze', 'inferno', 'short circuit', 'explosion', 'blast',
      'gas leak', 'cylinder blast', 'factory fire', 'warehouse fire', 'hazmat', 'smoke',
    ],
  },
  {
    title: 'Terror, Threats & High Alert — India',
    titleHindi: 'आतंक, खतरे और उच्च सतर्कता — भारत',
    emoji: '⚠️',
    headerBg: '#7f1d1d',
    keywords: [
      'terror', 'terrorist', 'militant', 'ied', 'bomb threat', 'suspicious object', 'high alert',
      'nsg', 'ats', 'intelligence', 'threat letter', 'communal tension', 'security forces',
    ],
  },
  {
    title: 'Bank, ATM & Cash Security — India',
    titleHindi: 'बैंक, एटीएम और नकद सुरक्षा — भारत',
    emoji: '🏦',
    headerBg: '#854d0e',
    keywords: [
      'bank robbery', 'bank heist', 'atm theft', 'atm fraud', 'cash van', 'cash loot', 'dacoity',
      'bank guard', 'bank security', 'cash transit', 'bullion', 'vault', 'bank branch',
    ],
  },
  {
    title: 'Crime & Law & Order — India',
    titleHindi: 'अपराध और कानून व्यवस्था — भारत',
    emoji: '👮',
    headerBg: '#1e3a8a',
    keywords: [
      'crime', 'police', 'arrest', 'murder', 'robbery', 'theft', 'snatching', 'law and order',
      'encounter', 'raid', 'seized', 'custody', 'firing', 'shootout',
    ],
  },
  {
    title: 'Gallantry, Police, Army & Security Service — India',
    titleHindi: 'वीरता, पुलिस, सेना और सुरक्षा सेवा — भारत',
    emoji: '🏅',
    headerBg: '#1d4ed8',
    keywords: [
      'gallantry', 'bravery award', 'police medal', 'shaurya', 'commendation', 'meritorious',
      'honoured for', 'honored for', 'security guard saved', 'cisf award', 'army honour',
      'param vir', 'kirti chakra', 'ashoka chakra', 'president police medal', 'best security',
      'private security award', 'guard foils', 'guard catches',
    ],
  },
  {
    title: 'Traffic & Public Order — India',
    titleHindi: 'यातायात और सार्वजनिक व्यवस्था',
    emoji: '🚧',
    headerBg: '#92400e',
    keywords: [
      'road accident', 'traffic jam', 'gridlock', 'curfew', 'riot', 'unrest', 'law and order situation',
    ],
  },
]

/**
 * News sources to BLOCK — job portals, classifieds and directory/ad sites that
 * are not genuine flash news. Matched against the source name and the link.
 */
export const BLOCKED_SOURCES: string[] = [
  'justdial',
  'sulekha',
  'quikr',
  'olx',
  'naukri',
  'shine',
  'monster',
  'timesjobs',
  'indeed',
  'apna',
  'workindia',
  'securityhai',
  'freejobalert',
  'sarkari',
  'jobalert',
  'classified',
  'freeadstime',
  'clickindia',
]

/** SecurityJob.co.in — Register Now form (Director rule: never tinyurl / agilegroup-digital). */
export const SECURITYJOB_REGISTER_URL = 'https://www.securityjob.co.in/#register'

/** Job Posting links (shown under the Job Posting header). */
export const JOB_LINKS = {
  registerUrl: SECURITYJOB_REGISTER_URL,
  registerLabel: 'www.SecurityJob.co.in',
  applyUrl: SECURITYJOB_REGISTER_URL,
}

/** Official WhatsApp Channel — Security News, Agile Group. */
export const CHANNEL_URL = 'https://whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y'

/** Short public link to the bulletin (shared on WhatsApp). */
export const SHARE_URL = 'https://tinyurl.com/Security-News'

/** Direct, always-working bulletin link. */
export const BULLETIN_URL = 'https://www.agilegroup-digital.co.in/pulse'

/** Branded card image (logo header) for WhatsApp thank-you & winner messages. */
export const CARD_IMAGE_URL = 'https://www.agilegroup-digital.co.in/news-assets/og-card.png'

/** Official Cursor.ai attribution — bulletin, quiz & winner automation. */
export const CURSOR_ATTRIBUTION =
  'The News Bulletin, Security Question of the Day, and weekly winner selections are fully managed automatically by Cursor.ai, San Francisco, California, USA.'

/** Daily bulletin times (India). Catch-up keeps trying until the next edition. */
export const BULLETIN_SCHEDULE = [
  { edition: 'Morning Bulletin', timeIst: '6:00 AM' },
  { edition: 'Afternoon Bulletin', timeIst: '2:00 PM' },
  { edition: '10:00 PM Bulletin', timeIst: '10:00 PM' },
] as const

export const QUIZ_WINNER_SCHEDULE = 'Every Sunday morning — winner on bulletin + WhatsApp'

/** Shown on the News Bulletin and in the WhatsApp group message. */
export const QUIZ_AWARENESS_POINTS = [
  'Expanding Security Awareness: With daily entries now crossing 299, the management is eager to spread security knowledge as widely as possible.',
  'Open to Everyone: This initiative is not exclusively for security industry personnel; it is open to all, because security is everyone\'s responsibility.',
  'Weekly Rewards: Starting from Week 34 onwards, the system will select two lucky winners to receive gift vouchers worth Rs 250 each',
] as const

/** Contest rules on the Security News Question of the Day box. */
export const QUIZ_CONTEST_RULES = [
  'One attempt only each day — your first answer must be correct. You cannot try again the same day.',
  'You must take part all 7 days — Sunday to Saturday.',
  'You must give the correct first answer on every day of that week.',
  'From those who finish all 7 days, two lucky winners are chosen. Each receives a Rs 250 gift coupon.',
] as const

/** Edition name from IST hour. */
export function editionLabelForHour(h: number): string {
  if (h >= 6 && h < 14) return 'Morning Edition'
  if (h >= 14 && h < 22) return 'Afternoon Edition'
  if (h >= 22) return '10:00 PM Edition'
  return 'Morning Edition'
}

/** Next scheduled bulletin after current IST hour. */
export function nextBulletinLabel(h: number): string {
  if (h < 6) return 'Morning Bulletin — 6:00 AM IST (today)'
  if (h < 14) return 'Afternoon Bulletin — 2:00 PM IST'
  if (h < 22) return '10:00 PM Bulletin — 10:00 PM IST'
  return 'Morning Bulletin — 6:00 AM IST (tomorrow)'
}

/** The daily Security Quiz. */
export const QUIZ: Quiz = {
  question:
    'While on patrol, you notice a visitor attempting to tailgate through a secure gate ' +
    'without authorization. What should be your immediate action?',
  options: [
    { key: 'A', text: 'Ignore and continue your patrol' },
    { key: 'B', text: 'Politely challenge the visitor and verify their authorization' },
    { key: 'C', text: 'Report the incident to your supervisor after your shift' },
    { key: 'D', text: 'Allow the visitor to enter since they are already inside' },
  ],
  correctKey: 'B',
  explanation:
    'Challenging the visitor and verifying their authorization helps prevent security ' +
    'breaches and maintain gate security.',
}

/**
 * Default editorial content — used only until a manager saves content in the
 * admin portal (after that, the saved content from the database is shown).
 */
export const DEFAULT_EDITORIAL: EditorialContent = {
  events: [
    {
      id: 'seed-event-1',
      heading: 'Agile Group Expansion',
      text:
        'Agile Group is excited to announce the successful launch of new business operations in ' +
        'Hitech City, Tirupati, Visakhapatnam, Vijayawada, and Ahmedabad. IDBI Bank and HDFC Bank ' +
        'have expanded our services to additional branches, further strengthening our partnership.',
      imageUrl: '/news-assets/event1.jpg',
      videoUrl: '',
    },
    {
      id: 'seed-event-2',
      heading: 'Agile Group Moments',
      text: '',
      imageUrl: '/news-assets/event2.jpg',
      videoUrl: '',
    },
  ],
  jobImages: ['/news-assets/job1.jpg'],
  guards: [
    {
      id: 'seed-guard',
      name: 'Mr. Babul Taid',
      guardId: '0201001932',
      clientName: 'M/s. Divis Lab',
      location: 'Chottuppal',
      photoUrl: '/news-assets/guard1.jpg',
      citation:
        'Mr. Babul Taid, while performing his duties at our client\u2019s premises, demonstrated ' +
        'exceptional alertness by apprehending a thief red-handed while attempting to steal ' +
        'materials from the site. His prompt action prevented a potential loss to the client and ' +
        'reflected the highest standards of professionalism and integrity. In recognition of his ' +
        'exemplary performance, the client has announced a cash reward for Mr. Taid.',
    },
  ],
}

/** Helper to build a starter question quickly. */
function sq(
  id: string,
  question: string,
  options: string[],
  correctKey: string,
  explanation: string,
): QuizQuestion {
  return {
    id,
    type: 'text',
    question,
    imageUrl: '',
    options: options.map((text, i) => ({ key: ['A', 'B', 'C', 'D'][i], text })),
    correctKey,
    explanation,
  }
}

/**
 * Built-in Security & Fire-Safety question bank (130 unique questions).
 * About 100 stay live. Every month 30 are changed. One per day; no repeat in a calendar month.
 */
export const STARTER_QUIZ_BANK: QuizQuestion[] = [
  sq(
    'sq1',
    'While on patrol, you notice a visitor attempting to tailgate through a secure gate without authorization. What should be your immediate action?',
    [
      'Ignore and continue your patrol',
      'Politely challenge the visitor and verify their authorization',
      'Report it only after your shift',
      'Allow them in since they are already inside',
    ],
    'B',
    'Politely challenging and verifying authorization prevents unauthorized access and security breaches.',
  ),
  sq(
    'sq2',
    'Which fire extinguisher is safest to use on a live electrical fire?',
    ['Water extinguisher', 'CO2 (carbon dioxide) extinguisher', 'Foam extinguisher', 'Soda-acid extinguisher'],
    'B',
    'CO2 does not conduct electricity, making it safe for live electrical fires. Never use water on electrical fires.',
  ),
  sq(
    'sq3',
    'A fire involving flammable liquids like petrol or diesel belongs to which fire class?',
    ['Class A', 'Class B', 'Class C', 'Class D'],
    'B',
    'Class B fires involve flammable liquids such as petrol, diesel and oil.',
  ),
  sq(
    'sq4',
    'What is the very first thing you should do on discovering a fire?',
    [
      'Start fighting the fire yourself',
      'Raise the alarm and alert others',
      'Collect your belongings',
      'Wait for instructions',
    ],
    'B',
    'Raising the alarm immediately warns everyone and starts the emergency response without delay.',
  ),
  sq(
    'sq5',
    'The correct way to operate a fire extinguisher is remembered by the word PASS. What does it stand for?',
    [
      'Push, Aim, Slide, Stop',
      'Pull, Aim, Squeeze, Sweep',
      'Point, Alert, Spray, Stand',
      'Pull, Alarm, Shout, Save',
    ],
    'B',
    'PASS = Pull the pin, Aim at the base, Squeeze the handle, Sweep side to side.',
  ),
  sq(
    'sq6',
    'What is the main purpose of an assembly point during an evacuation?',
    [
      'A place to store equipment',
      'A safe place to gather and take a headcount',
      'A smoking area',
      'A parking area',
    ],
    'B',
    'The assembly point lets wardens account for everyone and confirm no one is left behind.',
  ),
  sq(
    'sq7',
    'You find an unattended, suspicious bag near the entrance. What should you do?',
    [
      'Open it to check the contents',
      'Do not touch it, keep people away and report immediately',
      'Move it outside the building',
      'Ignore it',
    ],
    'B',
    'Never touch a suspicious object. Cordon the area, keep people away and report to your supervisor/police.',
  ),
  sq(
    'sq8',
    'For a fire caused by an electrical short circuit, which agent must you NEVER use?',
    ['CO2', 'Dry powder', 'Water', 'Fire blanket'],
    'C',
    'Water conducts electricity and can cause electrocution. Isolate power and use CO2 or dry powder.',
  ),
  sq(
    'sq9',
    'You smell LPG gas leaking near a cylinder. What is the safest action?',
    [
      'Switch on the exhaust fan',
      'Close the regulator, ventilate the area and avoid any flame or switch',
      'Light a matchstick to check',
      'Turn on the lights to see better',
    ],
    'B',
    'Any spark can ignite the gas. Shut the valve, open windows for ventilation and avoid operating any electrical switch.',
  ),
  sq(
    'sq10',
    'During CPR on an adult, the chest compressions should be given at a rate of about:',
    ['40–60 per minute', '100–120 per minute', '150–180 per minute', 'As fast as possible'],
    'B',
    'Effective CPR uses 100–120 compressions per minute at a depth of about 5 cm.',
  ),
  sq(
    'sq11',
    'A caller gives a bomb threat over the phone. What should you do?',
    [
      'Hang up immediately',
      'Stay calm, note details (time, voice, background), keep them talking and inform authorities',
      'Panic and run',
      'Ignore the call',
    ],
    'B',
    'Recording details and informing the authorities/supervisor at once is critical for the response.',
  ),
  sq(
    'sq12',
    'The three things a fire needs to burn (the fire triangle) are:',
    ['Heat, fuel and oxygen', 'Smoke, ash and heat', 'Water, wind and wood', 'Fuel, spark and paper'],
    'A',
    'Remove any one of heat, fuel or oxygen and the fire goes out.',
  ),
  sq(
    'sq13',
    'For minor bleeding from a cut, the correct first aid is to:',
    [
      'Apply firm direct pressure with a clean cloth',
      'Rub the wound hard',
      'Leave it open in the air',
      'Apply mud to it',
    ],
    'A',
    'Direct pressure with a clean cloth helps stop the bleeding; then cover with a clean dressing.',
  ),
  sq(
    'sq14',
    'Why must emergency exits and fire escape routes always be kept clear?',
    [
      'To look tidy',
      'So people can evacuate quickly and safely in an emergency',
      'For storing materials',
      'It is not important',
    ],
    'B',
    'Blocked exits cost lives during an emergency. Exit routes must always be unobstructed and unlocked.',
  ),
  sq(
    'sq15',
    'A visitor asks you to share your access card "just for a minute." You should:',
    [
      'Share it to be helpful',
      'Never share it; access cards are personal and non-transferable',
      'Sell it',
      'Leave it at the gate',
    ],
    'B',
    'Access credentials are personal and must never be shared — it breaks accountability and security.',
  ),
  sq(
    'sq16',
    'As a first responder reaching an incident scene, your first priority is to:',
    [
      'Take photos for social media',
      'Ensure the scene is safe for yourself and others',
      'Move all evidence',
      'Leave the area',
    ],
    'B',
    'Scene safety comes first — you cannot help others if you become a casualty yourself.',
  ),
  sq(
    'sq17',
    'Good practice for an effective night patrol is to:',
    [
      'Follow the exact same route and time every night',
      'Vary your routes and timings so they are unpredictable',
      'Stay at one spot all night',
      'Patrol only once',
    ],
    'B',
    'Unpredictable patrol patterns make it harder for intruders to plan around your movements.',
  ),
  sq(
    'sq18',
    'An adult is choking and cannot breathe or speak. The correct action is to:',
    [
      'Give water to drink',
      'Give abdominal thrusts (Heimlich manoeuvre)',
      'Make them lie down flat',
      'Wait for it to pass',
    ],
    'B',
    'Abdominal thrusts help expel the object blocking the airway. Call for medical help too.',
  ),
  sq(
    'sq19',
    'The best extinguishing agent for a Class A fire (wood, paper, cloth) is:',
    ['Water', 'Petrol', 'CO2 only', 'Sand mixed with oil'],
    'A',
    'Class A fires (ordinary combustibles) are best cooled and put out with water.',
  ),
  sq(
    'sq20',
    'While recording an incident in the register, your report must be:',
    [
      'Exaggerated to sound serious',
      'Accurate, factual, timely and complete',
      'Written days later from memory',
      'Left blank',
    ],
    'B',
    'An accurate, timely and factual record is essential for investigation and legal purposes.',
  ),
  sq(
    'sq21',
    'When force is unavoidable in the line of duty, a security guard should use:',
    [
      'Maximum force always',
      'Only the minimum force necessary, as a last resort',
      'Any force they like',
      'Force before talking',
    ],
    'B',
    'Force must always be the minimum necessary and a last resort, within the law.',
  ),
  sq(
    'sq22',
    'A CCTV camera has developed a blind spot in a sensitive area. You should:',
    [
      'Do nothing',
      'Report it and increase physical patrolling of that area until repaired',
      'Cover the whole area with tape',
      'Switch off all cameras',
    ],
    'B',
    'Report the fault and compensate with extra physical patrols so coverage is not lost.',
  ),
  sq(
    'sq23',
    'A small child is found lost inside a shopping mall. The correct action is to:',
    [
      'Leave the child alone',
      'Reassure the child, take them to the help desk and make an announcement',
      'Send the child out of the mall',
      'Ignore and continue patrol',
    ],
    'B',
    'Keep the child safe, take them to a help desk/control room and announce to reunite with parents.',
  ),
  sq(
    'sq24',
    'The main purpose of a visitor entry register at the gate is to:',
    [
      'Waste time',
      'Keep an accurate record of who enters and leaves the premises',
      'Collect autographs',
      'Advertise the company',
    ],
    'B',
    'A visitor register maintains accountability and a traceable record of everyone on site.',
  ),
  sq(
    'sq25',
    'A contractor arrives without a valid work permit. You should:',
    [
      'Allow them in to avoid delay',
      'Stop entry, inform the site in-charge and wait for a valid permit',
      'Take their tools and send them in',
      'Ask them to come back tomorrow without recording it',
    ],
    'B',
    'No permit means no entry. Record the attempt and inform the site in-charge.',
  ),
  sq(
    'sq26',
    'The national emergency number in India that you should know for police, fire or ambulance is:',
    ['100 only', '112', '108 only', '101 only'],
    'B',
    '112 is the national emergency number. 100, 101 and 108 also work, but 112 is the single number to remember.',
  ),
  sq(
    'sq27',
    'Keys to a restricted store must be:',
    [
      'Left on the table for convenience',
      'Issued against a signature, counted and locked when not in use',
      'Shared with any visitor who asks',
      'Copied for every guard',
    ],
    'B',
    'Key control needs a signed issue register and secure storage so every key is accounted for.',
  ),
  sq(
    'sq28',
    'A vehicle is leaving with a carton that has no gate pass. Your action is to:',
    [
      'Wave it through to save time',
      'Stop the vehicle, check the load against a valid gate pass and call the supervisor if it does not match',
      'Ask the driver to bring the pass later',
      'Take a photo and let it go',
    ],
    'B',
    'Material movement without a gate pass is a theft risk. Stop, verify and escalate.',
  ),
  sq(
    'sq29',
    'During a night shift handover, the outgoing guard must:',
    [
      'Leave as soon as the reliever arrives',
      'Brief the reliever on incidents, keys, visitors still inside and any faults',
      'Only hand over the torch',
      'Write nothing if the night was quiet',
    ],
    'B',
    'A proper handover covers keys, open issues, people still on site and equipment status.',
  ),
  sq(
    'sq30',
    'You see smoke coming from a kitchen exhaust. First you should:',
    [
      'Open the kitchen door wide and wait',
      'Raise the alarm, isolate LPG/electricity if safe, and use the correct extinguisher',
      'Pour water on the electrical panel',
      'Go off duty and report tomorrow',
    ],
    'B',
    'Raise the alarm first, cut fuel/power if it is safe, then fight a small fire with the right extinguisher.',
  ),
  sq(
    'sq31',
    'A visitor says “the manager told me to go in, I forgot my ID.” You should:',
    [
      'Believe them and open the gate',
      'Politely hold them, verify with the host on the phone or intercom, then issue a visitor pass',
      'Take their mobile as security and let them in',
      'Ask another visitor to vouch for them',
    ],
    'B',
    'Never accept a verbal story in place of ID. Verify with the host and issue a pass.',
  ),
  sq(
    'sq32',
    'The safest place to stand while directing traffic at a site gate is:',
    [
      'In the middle of the road with your back to vehicles',
      'On the side, clearly visible, facing oncoming traffic',
      'Behind a parked truck',
      'On your mobile in the cabin',
    ],
    'B',
    'Stay visible on the side, face traffic, and use a torch or cone at night.',
  ),
  sq(
    'sq33',
    'A fire hydrant and hose reel must be kept:',
    [
      'Blocked by parked vehicles if space is short',
      'Clear, unlocked and ready for instant use',
      'Tied shut so children cannot play',
      'Used to wash vehicles',
    ],
    'B',
    'Hydrants and hose reels are life-saving equipment. Keep the approach clear at all times.',
  ),
  sq(
    'sq34',
    'If a woman employee reports she is being followed in the parking area, you should:',
    [
      'Tell her it is not a security matter',
      'Stay with her, take her to a safe well-lit area, inform control and record the incident',
      'Ask her to handle it herself',
      'Post it on the group WhatsApp',
    ],
    'B',
    'Escort her to safety, alert control, and record facts. Do not leave her alone.',
  ),
  sq(
    'sq35',
    'A lift is stuck between floors with people inside. You should:',
    [
      'Force the doors open with a crowbar',
      'Reassure them, call the lift agency/emergency, keep the area clear and wait for trained help',
      'Ask them to jump out',
      'Switch the main building power off immediately',
    ],
    'B',
    'Do not force lift doors. Reassure occupants and call trained lift/emergency staff.',
  ),
  sq(
    'sq36',
    'The correct way to search a vehicle at the gate is to:',
    [
      'Only look at the dashboard',
      'Check cabin, boot/dicky, under seats and undercarriage as per site SOP, with the driver present',
      'Ask the driver to search and tell you',
      'Search only if you “feel something is wrong”',
    ],
    'B',
    'Follow the site SOP and search systematically with the driver present so nothing is missed.',
  ),
  sq(
    'sq37',
    'You receive a radio call you did not understand. You should:',
    [
      'Ignore it',
      'Ask them to repeat, confirm the message, then act',
      'Guess what they said',
      'Switch off the radio',
    ],
    'B',
    'Repeat-back confirmation avoids wrong action. Never guess an emergency message.',
  ),
  sq(
    'sq38',
    'A visitor leaves a laptop at the reception. You should:',
    [
      'Keep it in your bag till they return',
      'Log it in Lost & Found, lock it, and hand it over only against ID and signature',
      'Use it until someone claims it',
      'Give it to the next visitor with the same name',
    ],
    'B',
    'Lost property must be logged, secured and released only to the owner with ID and a signature.',
  ),
  sq(
    'sq39',
    'During heavy rain the basement starts flooding. Your first duty is to:',
    [
      'Continue normal gate duty only',
      'Alert control, stop vehicle entry to the basement, help people move to higher safe ground',
      'Wait for the rain to stop',
      'Open all electrical panels to “dry them”',
    ],
    'B',
    'Life safety first: warn people, stop entry to flooded areas, and keep away from live electrics.',
  ),
  sq(
    'sq40',
    'A person offers you money to skip the bag check. You should:',
    [
      'Take it if the amount is small',
      'Refuse, complete the check, and report the attempt to your supervisor',
      'Take it and do a light check',
      'Tell them to come at night',
    ],
    'B',
    'Bribes are a disciplinary and legal offence. Refuse, follow SOP, and report at once.',
  ),
  sq(
    'sq41',
    'The fire alarm is ringing but you cannot see smoke. You should:',
    [
      'Silence it and wait',
      'Treat it as real: follow evacuation SOP, check the panel location, and do not reset until instructed',
      'Tell people it is a drill without checking',
      'Leave the building without informing control',
    ],
    'B',
    'Every alarm is real until the authorised person says otherwise. Follow the evacuation plan.',
  ),
  sq(
    'sq42',
    'A delivery boy wants to enter the office floors alone with a large parcel. You should:',
    [
      'Send him up alone to save time',
      'Verify the host, issue a pass, and escort or announce as per SOP',
      'Keep the parcel and send him away without a record',
      'Ask him to leave the parcel on the road',
    ],
    'B',
    'Unknown delivery staff must be verified and controlled. Do not give free run of the floors.',
  ),
  sq(
    'sq43',
    'For a person with a suspected fracture, first aid is to:',
    [
      'Try to straighten the bone',
      'Keep the limb still, support it, and call medical help',
      'Ask them to walk it off',
      'Massage the area hard',
    ],
    'B',
    'Do not move or straighten a suspected fracture. Immobilise and get medical help.',
  ),
  sq(
    'sq44',
    'CCTV monitors at the control desk should be:',
    [
      'Covered with a cloth when it is hot',
      'Watched actively, with faults logged and reported the same shift',
      'Used only for watching films',
      'Switched off at night to save power',
    ],
    'B',
    'Control must watch live views, note blind cameras, and report faults in the same shift.',
  ),
  sq(
    'sq45',
    'A crowd gathers at the gate during a festival. You should:',
    [
      'Open both gates fully and step aside',
      'Keep a single controlled lane, use barriers, stay calm and call for extra staff',
      'Shout and push people',
      'Lock the gate and hide',
    ],
    'B',
    'Crowd control needs one clear lane, barriers, calm instructions and extra hands — not force.',
  ),
  sq(
    'sq46',
    'An access card that does not belong to the person showing it means you should:',
    [
      'Allow them if the photo is “close enough”',
      'Deny entry, retain the card if SOP allows, and inform the card controller',
      'Let them in and return the card later',
      'Ignore it after office hours',
    ],
    'B',
    'Cards are personal. A mismatch is a security breach — stop entry and report.',
  ),
  sq(
    'sq47',
    'The first thing to check when you take charge of a post is:',
    [
      'Your mobile messages',
      'The post book, keys, equipment, and that the area is as described in the handover',
      'The canteen menu',
      'Only the time on the clock',
    ],
    'B',
    'Taking charge means checking book, keys, radio, torch, seals and the physical post.',
  ),
  sq(
    'sq48',
    'A snake is seen near the guard cabin. You should:',
    [
      'Try to catch or kill it with a stick',
      'Keep people away, inform control, and call authorised pest/rescue help',
      'Ignore it',
      'Throw petrol on it',
    ],
    'B',
    'Do not handle snakes. Cordon the area and call trained rescue. Treat bites as a medical emergency.',
  ),
  sq(
    'sq49',
    'Confidential visitor documents at the gate must be:',
    [
      'Photographed on your personal phone',
      'Seen only as needed, not copied, and never discussed outside duty',
      'Shared with friends for “awareness”',
      'Thrown in the open dustbin',
    ],
    'B',
    'Guard duty includes protecting information. Do not copy or gossip about visitor papers.',
  ),
  sq(
    'sq50',
    'If you feel unwell and cannot stay alert on night duty, you should:',
    [
      'Sleep in the cabin and hope nobody notices',
      'Inform the supervisor immediately so a reliever can be arranged',
      'Drink more tea and hide it',
      'Leave the post empty',
    ],
    'B',
    'An unattended or sleeping post is a serious failure. Call for a reliever at once.',
  ),
  sq(
    'sq51',
    'A Class C fire (flammable gas) is best handled by:',
    [
      'Water jet on the cylinder',
      'Shutting off the gas supply if safe, then using dry powder / CO2',
      'Foam only on the valve',
      'Fanning the flame',
    ],
    'B',
    'Stop the gas if you can do it safely, then use dry powder or CO2. Never use a water jet on a gas fire.',
  ),
  sq(
    'sq52',
    'When verifying a photo ID at the gate, you must match:',
    [
      'Only the name on the slip',
      'Face, name, validity date and the authorised purpose of visit',
      'Only the company logo',
      'Only the signature on the back',
    ],
    'B',
    'Look at the face, the name, whether the ID is valid, and why the person is entering.',
  ),
  sq(
    'sq53',
    'A perimeter light is fused on a dark stretch of wall. You should:',
    [
      'Ignore it till the monthly meeting',
      'Log it, report it the same shift, and increase patrols on that stretch',
      'Switch off all lights to match',
      'Stand only at the well-lit gate',
    ],
    'B',
    'Dark stretches invite intrusion. Report the fault and cover the gap with extra patrols.',
  ),
  sq(
    'sq54',
    'Someone asks you on the phone for the Director’s mobile and home address. You should:',
    [
      'Give it to be helpful',
      'Refuse, take their name and number, and pass the request through the proper office',
      'Share the office WhatsApp group link',
      'Confirm the address but not the mobile',
    ],
    'B',
    'This is social engineering. Never give personal details of management to unknown callers.',
  ),
  sq(
    'sq55',
    'The assembly point after evacuation should be used to:',
    [
      'Continue working on laptops',
      'Take a headcount and wait for the all-clear from the warden',
      'Go home immediately without reporting',
      'Re-enter to collect bags',
    ],
    'B',
    'Stay at the assembly point for roll-call. Do not re-enter until the warden says it is safe.',
  ),
  sq(
    'sq56',
    'A small oil fire in a pan in the pantry is best put out by:',
    [
      'Throwing water into the pan',
      'Covering with a lid or fire blanket and turning off the heat',
      'Carrying the burning pan through the corridor',
      'Using a water extinguisher',
    ],
    'B',
    'Water on burning oil spreads the fire. Smother it and cut the heat. Do not carry the pan.',
  ),
  sq(
    'sq57',
    'Your uniform and grooming on duty should be:',
    [
      'Optional on Sunday',
      'Complete, clean and as per company standard for the whole shift',
      'Only the shirt, trousers optional',
      'Civilian clothes if it is hot',
    ],
    'B',
    'A complete, tidy uniform is part of discipline and how the client judges the company.',
  ),
  sq(
    'sq58',
    'If you find a broken seal on a store door at the start of the shift, you should:',
    [
      'Fix a new seal quietly and say nothing',
      'Do not enter alone — inform control, record it, and wait for a supervisor check',
      'Open the store to see what is missing',
      'Blame the previous guard in the group chat',
    ],
    'B',
    'A broken seal may mean theft. Preserve the scene, report, and let a supervisor inspect.',
  ),
  sq(
    'sq59',
    'While using a fire extinguisher you must aim at:',
    [
      'The top of the flames',
      'The base of the fire, sweeping side to side',
      'The ceiling',
      'People standing nearby',
    ],
    'B',
    'PASS: aim at the base of the fire and sweep. Aiming at the flames wastes the charge.',
  ),
  sq(
    'sq60',
    'After any incident (theft attempt, fire alarm, medical case) you must:',
    [
      'Tell only your friends',
      'Write a clear, timed, factual report in the register the same shift',
      'Wait a week so you remember better',
      'Delete CCTV to “avoid trouble”',
    ],
    'B',
    'Same-shift, factual reporting protects the client, the company and you. Never hide evidence.',
  ),
  sq(
    'sq61',
    'A car tries to follow another vehicle through the boom barrier before it closes. You should:',
    [
      'Let both through to avoid a queue',
      'Stop the second vehicle, check its pass, and only then raise the barrier',
      'Shout and leave the barrier open',
      'Ask the first driver to vouch for them',
    ],
    'B',
    'One vehicle, one check. Tailgating through a barrier is unauthorised entry.',
  ),
  sq(
    'sq62',
    'A person’s face does not match the biometric / access photo. You should:',
    [
      'Allow them if they know the employee’s name',
      'Deny entry, hold the card if SOP allows, and inform the access controller',
      'Reset the biometric yourself',
      'Let them in after office hours',
    ],
    'B',
    'A face mismatch is a security breach. Stop entry and report. Do not override biometrics.',
  ),
  sq(
    'sq63',
    'Goods are coming in without a delivery challan or inward note. You should:',
    [
      'Unload them to save the driver’s time',
      'Hold the vehicle, inform stores/site in-charge, and record the attempt',
      'Sign a blank paper for the driver',
      'Ask the driver to bring the paper tomorrow after unloading',
    ],
    'B',
    'No document means no inward. Hold, inform, and record so material cannot vanish.',
  ),
  sq(
    'sq64',
    'During a fire drill, the guard at the gate should mainly:',
    [
      'Leave the gate and join the crowd',
      'Keep the gate clear for fire engines, guide people to the assembly point, and stop incoming visitors',
      'Lock the gate and hide',
      'Continue normal visitor passes as usual',
    ],
    'B',
    'Keep emergency access clear, guide people out, and stop new entry until the all-clear.',
  ),
  sq(
    'sq65',
    'A staff member presses the panic / duress alarm. You should:',
    [
      'Assume it is a joke and reset it',
      'Treat it as real: inform control, go to the location with backup, and follow the site SOP',
      'Announce it on the public PA first',
      'Wait 30 minutes to see if they call back',
    ],
    'B',
    'A panic alarm is an emergency until proven otherwise. Respond with backup and report.',
  ),
  sq(
    'sq66',
    'Someone has a small burn from hot water. First aid is to:',
    [
      'Apply toothpaste or oil',
      'Cool the burn under clean running water, then cover loosely and get medical help if needed',
      'Break any blister',
      'Rub ice hard on the skin',
    ],
    'B',
    'Cool with clean water. Do not use toothpaste, oil or ice. Cover loosely and seek help for larger burns.',
  ),
  sq(
    'sq67',
    'A colleague on outdoor duty looks confused, hot, and has stopped sweating. You should:',
    [
      'Give them tea and send them back to the sun',
      'Move them to shade, loosen clothing, cool them, and call medical help — this may be heat stroke',
      'Ask them to run to cool down',
      'Leave them and finish your patrol first',
    ],
    'B',
    'Heat stroke is an emergency. Shade, cool, and get medical help at once.',
  ),
  sq(
    'sq68',
    'A person is still in contact with a live electrical wire. You should:',
    [
      'Pull them away with your bare hands',
      'Do not touch them — isolate power if safe, or push them clear with a dry non-metal object, then call help',
      'Pour water on them',
      'Hold their metal belt and drag them',
    ],
    'B',
    'Touching them can electrocute you. Cut power or use a dry wooden/plastic object, then give first aid.',
  ),
  sq(
    'sq69',
    'A cyclone / high-wind warning is in force for your city. At the site you should:',
    [
      'Open all terrace doors to “let wind through”',
      'Secure loose items, close openings, keep people away from glass and hoardings, and follow control instructions',
      'Stand under a tall tree at the gate',
      'Ignore it if it is not raining yet',
    ],
    'B',
    'Secure loose objects, keep people clear of glass and boards, and stay in touch with control.',
  ),
  sq(
    'sq70',
    'A visitor arrives smelling of alcohol and is unsteady. You should:',
    [
      'Issue a pass and hope they behave',
      'Refuse entry, stay polite, inform the host and control, and record the incident',
      'Take them to the canteen for coffee and then send them up',
      'Ask another visitor to take them inside',
    ],
    'B',
    'An intoxicated visitor is a safety risk. Refuse entry, inform, and record.',
  ),
  sq(
    'sq71',
    'A person with a camera says they are from the press and must enter now. You should:',
    [
      'Open the gate because press have a right to enter any site',
      'Stop them, verify with the authorised host / PR, and follow site media SOP',
      'Let them photograph the perimeter from inside',
      'Take their camera and hide it',
    ],
    'B',
    'Media need authorisation like any visitor. Verify before entry. Do not allow free photography.',
  ),
  sq(
    'sq72',
    'A visitor starts taking photos of the gate, CCTV and shift roster. You should:',
    [
      'Pose with them',
      'Politely stop them, ask them to delete if SOP requires, and inform control',
      'Ignore it as “only photos”',
      'Ask them to put the photos on Instagram for the company',
    ],
    'B',
    'Photos of security layouts can help criminals. Stop it and report.',
  ),
  sq(
    'sq73',
    'On terrace / roof patrol you must mainly check:',
    [
      'Only the mobile network signal',
      'Doors, water tanks, loose items, unauthorised people, and that the terrace door is secured after you leave',
      'Whether the view is nice',
      'Nothing — terraces are always safe',
    ],
    'B',
    'Roofs hide intrusion and fire risk. Check, record, and lock the terrace door behind you.',
  ),
  sq(
    'sq74',
    'Near a diesel yard or fuel store, you must not allow:',
    [
      'A fire extinguisher nearby',
      'Smoking, open flame, or mobile sparks',
      'A “No Smoking” board',
      'A clear approach for the fire tender',
    ],
    'B',
    'Fuel vapour ignites easily. No smoking, no flame, keep extinguishers and access ready.',
  ),
  sq(
    'sq75',
    'An adult collapses, is not breathing normally, and no pulse is felt. After calling help you should:',
    [
      'Splash water and wait',
      'Start CPR and use an AED if one is available, as trained',
      'Give them food',
      'Sit them on a chair and leave',
    ],
    'B',
    'Call emergency help, start CPR, and use the AED if you are trained. Seconds matter.',
  ),
  sq(
    'sq76',
    'During evacuation a person using a wheelchair is at the stairs. You should:',
    [
      'Leave them and say someone will come',
      'Help them to the refuge area / safe zone and inform the warden — do not use the lift if it is a fire',
      'Carry them down alone without telling anyone',
      'Put them in the lift during a fire',
    ],
    'B',
    'Use the planned refuge route. Never use a lift in a fire. Tell the warden their location.',
  ),
  sq(
    'sq77',
    'A fire door is found wedged open with a stone. You should:',
    [
      'Leave it — it is cooler that way',
      'Remove the wedge, close the door, and report who is blocking fire doors',
      'Remove the door closer',
      'Tie it open with rope',
    ],
    'B',
    'Fire doors save lives by holding back smoke. They must stay closed, never wedged.',
  ),
  sq(
    'sq78',
    'When the fire alarm sounds, people should leave by:',
    [
      'The lift, because it is faster',
      'The marked staircase / emergency exit — never the lift',
      'The basement car lift',
      'Waiting for the lift lobby to empty',
    ],
    'B',
    'Lifts can fail or fill with smoke. Always use stairs and marked exits.',
  ),
  sq(
    'sq79',
    'Welders arrive for hot work without a hot-work permit. You should:',
    [
      'Allow them if they look experienced',
      'Stop the work, inform the site in-charge, and wait for a valid permit and fire watch',
      'Give them your water bottle as a permit',
      'Ask them to weld outside the gate on the road',
    ],
    'B',
    'Hot work without a permit is a fire risk. No permit, no spark.',
  ),
  sq(
    'sq80',
    'On a construction or hard-hat site, a visitor without a helmet should:',
    [
      'Be sent in if they “will only be five minutes”',
      'Be given / asked for PPE as per SOP, or denied entry until they wear it',
      'Sign a paper and walk in bareheaded',
      'Walk only on the yellow line without a helmet',
    ],
    'B',
    'PPE is not optional. No helmet, no entry where the site rules require it.',
  ),
  sq(
    'sq81',
    'Using a personal mobile for long chats while on a live post is:',
    [
      'Allowed if the post is quiet',
      'Not allowed — it drops alertness; keep the phone for duty calls only as per SOP',
      'Allowed at night only',
      'Allowed if you put one earphone',
    ],
    'B',
    'A distracted guard is an open gate. Phones are for duty, not entertainment.',
  ),
  sq(
    'sq82',
    'A reliever reports for duty smelling of alcohol. You should:',
    [
      'Hand over and go home',
      'Refuse handover, keep the post, and inform the supervisor immediately',
      'Give them coffee and hand over after 10 minutes',
      'Share the post so both can “rest”',
    ],
    'B',
    'An intoxicated guard must not take charge. Stay on post and call the supervisor.',
  ),
  sq(
    'sq83',
    'Your reliever is late and your shift time is over. You should:',
    [
      'Leave the post empty',
      'Stay on post, inform control, and wait until a reliever or supervisor takes charge',
      'Lock the cabin and go',
      'Ask a visitor to “just watch” the gate',
    ],
    'B',
    'A post must never be left empty. Stay, inform, and wait for a proper reliever.',
  ),
  sq(
    'sq84',
    'A visitor’s ID card expired last month. You should:',
    [
      'Accept it because the photo still looks like them',
      'Refuse that ID, ask for a valid one, and verify with the host',
      'Write the old number in the register and send them in',
      'Take a photo of the expired card and allow entry',
    ],
    'B',
    'Expired ID is not valid proof. Ask for a current ID and verify the visit.',
  ),
  sq(
    'sq85',
    'Strangers try to walk into a lift behind a staff member without a pass. You should:',
    [
      'Ignore it if the staff member does not object',
      'Stop them, check passes, and do not allow lift tailgating',
      'Hold the lift door open for everyone',
      'Ask them to press any floor',
    ],
    'B',
    'Tailgating into lifts bypasses the gate. Challenge every person without a pass.',
  ),
  sq(
    'sq86',
    'An electric vehicle is charging and you see smoke from the charger. You should:',
    [
      'Throw a bucket of water on the battery',
      'Raise the alarm, keep people away, isolate power if safe, and use the site’s approved extinguisher — call the fire service',
      'Sit in the car to move it yourself if you are not trained',
      'Cover it with a woollen blanket and leave',
    ],
    'B',
    'EV / lithium fires need trained response. Alarm, isolate if safe, keep clear, call fire service.',
  ),
  sq(
    'sq87',
    'A lithium battery (phone / power bank / e-bike) is burning. You should NOT:',
    [
      'Call the fire service',
      'Use a hose of water as if it were a paper fire, or throw the battery',
      'Keep people away',
      'Inform control',
    ],
    'B',
    'Do not throw a burning battery or treat it like a simple paper fire. Alarm, isolate, get trained help.',
  ),
  sq(
    'sq88',
    'A cash van arrives at the gate. Your duty is to:',
    [
      'Open both gates and chat with the crew',
      'Follow the cash-van SOP: clear the bay, verify crew IDs, keep the area controlled, and do not leave them unescorted if the SOP requires escort',
      'Ask them to park on the public road and walk in with cash',
      'Post a photo of the van on the group',
    ],
    'B',
    'Cash movement is high risk. Follow the written SOP, control the area, and never advertise it.',
  ),
  sq(
    'sq89',
    'Strong-room or dual-control keys must be:',
    [
      'Held by one person “for convenience”',
      'Split as per SOP — no single person holds both controls',
      'Copied for the whole team',
      'Left in the lock overnight',
    ],
    'B',
    'Dual control means two people. One person with both keys defeats the control.',
  ),
  sq(
    'sq90',
    'An ambulance is coming to collect a patient. You should:',
    [
      'Finish the visitor queue first',
      'Clear the gate at once, guide them in, and keep a path for them to leave',
      'Ask them to wait outside for 20 minutes',
      'Check every cupboard in the ambulance before they enter',
    ],
    'B',
    'Life comes first. Clear the path immediately, then complete any required record.',
  ),
  sq(
    'sq91',
    'If the building starts shaking in an earthquake, people inside should:',
    [
      'Run to the lift',
      'Drop, cover under a strong table, hold on, then evacuate when the shaking stops if told to',
      'Stand next to glass windows',
      'Gather under a tall bookshelf',
    ],
    'B',
    'Drop, cover, hold. Do not use lifts. Evacuate only when it is safer to move.',
  ),
  sq(
    'sq92',
    'A protest group gathers at the main gate with banners. You should:',
    [
      'Argue politics with them',
      'Stay calm, keep the gate controlled, inform control/police as per SOP, and do not use force',
      'Open the gate so they can sit in the lobby',
      'Lock yourself in and switch off the radio',
    ],
    'B',
    'Stay professional, protect the gate, inform control. Force makes a crowd worse.',
  ),
  sq(
    'sq93',
    'A VIP / director convoy is arriving. You should:',
    [
      'Leave the gate and take selfies',
      'Clear the lane, stop other entry briefly as briefed, and stay at your post',
      'Ask the VIP to sign the visitor book in the queue',
      'Open every barrier and walk away',
    ],
    'B',
    'Follow the brief: clear the path, stay alert, remain on post. No photos.',
  ),
  sq(
    'sq94',
    'You see a chemical drum leaking in the store passage. You should:',
    [
      'Mop it with your hands',
      'Keep people away, do not sniff or touch, inform control and the safety officer',
      'Hose it toward the drain',
      'Taste it to identify the chemical',
    ],
    'B',
    'Unknown chemicals can burn or poison. Cordon, report, wait for trained staff.',
  ),
  sq(
    'sq95',
    'The site has a sudden power failure at night. You should:',
    [
      'Leave the post to find the fault in the HT yard alone',
      'Use your torch, keep the gate controlled, inform control, and log the time',
      'Open all gates so people can “see better”',
      'Sleep until power returns',
    ],
    'B',
    'Stay on post with a torch, control entry, and report the outage time.',
  ),
  sq(
    'sq96',
    'The generator room should be kept:',
    [
      'Full of cartons and old files',
      'Clear, no storage, no fuel cans lying open, and ready for the operator',
      'Locked with the key thrown away',
      'Used as a changing room',
    ],
    'B',
    'A blocked or messy generator room is a fire and start-up risk. Keep it clear.',
  ),
  sq(
    'sq97',
    'A stranger says they have come to pick a child from the site creche / school. You should:',
    [
      'Hand over the child if they sound kind',
      'Verify with the authorised parent/staff list and site SOP before the child leaves',
      'Ask the child only, and ignore the register',
      'Send the child to the gate alone',
    ],
    'B',
    'Children leave only with a verified authorised person. Follow the written pickup SOP.',
  ),
  sq(
    'sq98',
    'On a rainy night patrol you should:',
    [
      'Stay in the cabin the whole night',
      'Wear raincoat, use a working torch, walk the route, and note dark or flooded stretches',
      'Patrol without a torch to “save battery”',
      'Skip the far corners because of rain',
    ],
    'B',
    'Rain is when intruders test you. Patrol with proper kit and report dark or flooded gaps.',
  ),
  sq(
    'sq99',
    'If you make a mistake in the occurrence register, you should:',
    [
      'Tear the page out',
      'Strike through with one line, sign, and write the correct words — never use whitener to hide it',
      'Overwrite heavily so nobody can read it',
      'Leave it and write a new book',
    ],
    'B',
    'Registers are legal records. One-line cancel, sign, and correct. Do not destroy pages.',
  ),
  sq(
    'sq100',
    'Posting photos of the site, guards, or CCTV on personal WhatsApp status is:',
    [
      'Good publicity',
      'Not allowed — it can leak security details; use only official company channels if asked',
      'Allowed after midnight',
      'Allowed if you hide the company board',
    ],
    'B',
    'Site photos on personal status help the wrong people. Duty photos stay official only.',
  ),
  sq(
    'sq101',
    'A stranger asks you to keep a sealed packet “for my friend who works inside.” You should:',
    [
      'Keep it in the cabin till they come',
      'Refuse, do not accept unknown packets, and inform control',
      'Open it to see if it is safe',
      'Leave it on the reception sofa',
    ],
    'B',
    'Unknown packets are a bomb and theft risk. Do not accept or store them.',
  ),
  sq(
    'sq102',
    'The boom barrier is stuck open. You should:',
    [
      'Leave it and go for tea',
      'Control vehicles by hand, inform maintenance/control, and stay at the gate until it is fixed or a reliever takes over',
      'Tie it with a rope and leave',
      'Switch off all site lights',
    ],
    'B',
    'A stuck barrier is an open gate. Man the point and report the fault at once.',
  ),
  sq(
    'sq103',
    'A staff member wants to take a desktop computer home “for official work” with no gate pass. You should:',
    [
      'Allow it because you know them',
      'Stop the item, ask for a valid material pass, and inform the in-charge if there is none',
      'Take a photo and let it go',
      'Ask them to bring the pass next week',
    ],
    'B',
    'No material pass, no exit. Computers are high-value assets.',
  ),
  sq(
    'sq104',
    'You find a wet floor with no warning sign near the lobby. You should:',
    [
      'Walk past it',
      'Cordon or put a wet-floor sign, inform housekeeping, and log it',
      'Mop it with your uniform',
      'Wait for someone to slip',
    ],
    'B',
    'Slip hazards injure visitors. Mark the area and call housekeeping.',
  ),
  sq(
    'sq105',
    'A dog is aggressive at the perimeter at night. You should:',
    [
      'Kick it or throw stones',
      'Keep distance, do not run, inform control, and call authorised animal help if needed',
      'Feed it from the canteen every night',
      'Open the gate so it goes to the road',
    ],
    'B',
    'Do not fight the animal. Keep people away and report. Treat bites as a medical emergency.',
  ),
  sq(
    'sq106',
    'The visitor management computer at the gate is down. You should:',
    [
      'Stop all entry till next week',
      'Use the manual register, verify IDs as usual, and inform IT/control',
      'Wave people in without a record',
      'Ask visitors to write their own names on scrap paper and leave',
    ],
    'B',
    'Duty continues. Manual register plus proper ID check until the system is back.',
  ),
  sq(
    'sq107',
    'A contractor’s workers want to sleep inside the site store at night. You should:',
    [
      'Allow it to be helpful',
      'Refuse unless the site in-charge has given written permission, and record the request',
      'Take money and allow it',
      'Lock them in for safety',
    ],
    'B',
    'Unauthorised night stay is a fire and theft risk. Only a written okay from the in-charge.',
  ),
  sq(
    'sq108',
    'You hear a gas-like smell near the pantry after hours. You should:',
    [
      'Switch on all lights to look',
      'Do not operate switches, ventilate if safe, keep people away, and inform control',
      'Light a match to find the leak',
      'Ignore it if you cannot see a flame',
    ],
    'B',
    'A spark can ignite a leak. No switches, no flame. Ventilate if safe and report.',
  ),
  sq(
    'sq109',
    'A visitor’s vehicle has no number plate. You should:',
    [
      'Allow parking because the driver is in a hurry',
      'Stop entry, inform control, and follow site SOP — do not park unidentified vehicles inside',
      'Write “no plate” and send them to the basement',
      'Ask them to make a plate from cardboard',
    ],
    'B',
    'A vehicle without a plate is a security risk. Do not let it into the premises.',
  ),
  sq(
    'sq110',
    'During a medical emergency you should give the ambulance driver:',
    [
      'A long speech about the company',
      'A clear path, the patient’s location, and any known facts — then complete the register',
      'The full visitor book to take away',
      'Nothing; they should find the patient themselves',
    ],
    'B',
    'Guide them fast. Paperwork can wait until the patient is moving to help.',
  ),
  sq(
    'sq111',
    'A fire extinguisher’s pressure needle is in the red zone. You should:',
    [
      'Hide it behind a curtain',
      'Log it, report it the same shift, and do not count it as a working extinguisher',
      'Shake it and put it back',
      'Use it for a “test spray” on the garden',
    ],
    'B',
    'A red-zone extinguisher may fail in a fire. Report it and get it replaced or refilled.',
  ),
  sq(
    'sq112',
    'Someone asks you to switch off the CCTV “for a private meeting.” You should:',
    [
      'Switch it off to be helpful',
      'Refuse, keep cameras on as per SOP, and inform the supervisor',
      'Cover only one camera with a cloth',
      'Agree if they are a senior visitor',
    ],
    'B',
    'CCTV is for everyone’s safety. Guards do not switch it off on a verbal request.',
  ),
  sq(
    'sq113',
    'A package arrived by courier for a staff member who is on leave. You should:',
    [
      'Keep it in your bag',
      'Log it, lock it in Lost & Found / inward, and hand it only to the addressee or authorised person against signature',
      'Give it to any colleague with the same first name',
      'Open it to confirm the contents',
    ],
    'B',
    'Courier parcels must be logged and locked. Release only against a signature.',
  ),
  sq(
    'sq114',
    'The emergency exit sign light is off. You should:',
    [
      'Ignore it till the annual audit',
      'Log it, report it the same shift, and keep the exit path clear',
      'Remove the sign so nobody notices',
      'Put a chair under it',
    ],
    'B',
    'People must find the exit in smoke. A dead sign is a fault — report it today.',
  ),
  sq(
    'sq115',
    'A visitor wants to enter through the vehicle gate on foot because the pedestrian gate is busy. You should:',
    [
      'Allow it to save time',
      'Keep people to the pedestrian path; vehicles and people must not mix if the SOP says so',
      'Close both gates',
      'Ask them to climb the barrier',
    ],
    'B',
    'Mixing walkers and vehicles causes accidents. Use the correct gate.',
  ),
  sq(
    'sq116',
    'You are offered leftover food from a client party at the gate. You should:',
    [
      'Eat it on post',
      'Do not eat on a live post; follow company rules — never leave the gate unattended to eat',
      'Invite friends to the cabin',
      'Store it in the fire hose box',
    ],
    'B',
    'Eating on a live post drops alertness and looks unprofessional. Follow the meal-relief SOP.',
  ),
  sq(
    'sq117',
    'A drone is flying low over the client building. You should:',
    [
      'Throw stones at it',
      'Note the time and direction, inform control, and do not leave the post unattended',
      'Ignore it as a toy',
      'Go to the terrace alone for 30 minutes',
    ],
    'B',
    'Drones can film security. Report at once. Stay on post unless ordered otherwise.',
  ),
  sq(
    'sq118',
    'The first-aid box at the post is empty. You should:',
    [
      'Wait for the next monthly meeting',
      'Log it and inform the supervisor / admin the same shift so it is refilled',
      'Buy tablets from your own money and say nothing',
      'Use the box for stationery',
    ],
    'B',
    'An empty first-aid box fails the next emergency. Report it the same shift.',
  ),
  sq(
    'sq119',
    'A visitor says they forgot their mobile at security and will collect it tomorrow. You should:',
    [
      'Keep it in your pocket overnight',
      'Log it as lost property, lock it, and release only against ID and signature',
      'Give it to the next person who asks',
      'Switch it on and browse it',
    ],
    'B',
    'Phones are personal property. Log, lock, and hand over only to the owner.',
  ),
  sq(
    'sq120',
    'Rain water is entering an electrical room under the staircase. You should:',
    [
      'Step in water and switch the mains yourself',
      'Keep people away, inform control/electrician, and do not touch panels',
      'Open the panel to dry it with a cloth',
      'Put a carpet over the water',
    ],
    'B',
    'Water and electricity kill. Cordon, report, wait for an electrician.',
  ),
  sq(
    'sq121',
    'A new guard joins your post mid-shift. Before you share keys you must:',
    [
      'Just hand them over and leave',
      'Confirm they are the posted reliever, show the book, keys and faults, and take a signed handover',
      'Give keys and go for a walk',
      'Ask them to learn tomorrow',
    ],
    'B',
    'Handover is name, keys, book and faults — signed. Never dump keys and walk away.',
  ),
  sq(
    'sq122',
    'The client asks you to beat a trespasser. You should:',
    [
      'Beat them as ordered',
      'Use only minimum force if you or others are in danger, hold them, call police/control — do not assault',
      'Let the client’s staff beat them while you watch',
      'Tie them in a room overnight',
    ],
    'B',
    'Guards are not allowed to assault. Restrain if needed, call the police, and record facts.',
  ),
  sq(
    'sq123',
    'A fire hose is missing its nozzle. You should:',
    [
      'Say nothing',
      'Log it, report it the same shift, and do not hide the gap',
      'Put a plastic bottle as a nozzle',
      'Use the hose to wash bikes',
    ],
    'B',
    'A hose without a nozzle may fail in a fire. Report the missing part today.',
  ),
  sq(
    'sq124',
    'You must check a lady visitor’s bag and a lady guard is not on duty. You should:',
    [
      'Search her yourself behind a wall',
      'Follow site SOP: ask a lady staff/host to be present, or use a table-top bag check with dignity, or hold entry till a lady guard arrives',
      'Refuse all lady visitors for the day',
      'Skip the check because it is awkward',
    ],
    'B',
    'Bag checks must be respectful and as per SOP. Never a private search by a male guard alone.',
  ),
  sq(
    'sq125',
    'The night patrol clock / QR point on the far wall is broken. You should:',
    [
      'Skip that corner every night',
      'Still walk that stretch, log the broken point, and report it the same shift',
      'Mark it as done without going',
      'Only patrol near the cabin',
    ],
    'B',
    'A broken checkpoint is not a reason to skip the ground. Walk it and report the fault.',
  ),
  sq(
    'sq126',
    'A visitor wants a photocopy of another visitor’s ID “for their office.” You should:',
    [
      'Give the copy from the register',
      'Refuse — visitor IDs are confidential; direct them to the host office',
      'WhatsApp the photo from the scanner',
      'Sell the copy',
    ],
    'B',
    'Do not share other people’s ID copies. That is a privacy and security breach.',
  ),
  sq(
    'sq127',
    'Smoke is coming from a dustbin in the parking. You should:',
    [
      'Kick the bin over',
      'Raise the alarm, keep people away, and use the right extinguisher if it is a small fire and you are trained',
      'Pour petrol to “burn it out”',
      'Cover it and go off duty',
    ],
    'B',
    'Bin fires spread to cars. Alarm, isolate people, and fight only a small fire if trained.',
  ),
  sq(
    'sq128',
    'The client’s child is running near the vehicle gate. You should:',
    [
      'Ignore it as a family matter',
      'Alert the parent/host, slow or stop vehicles, and keep the child off the vehicle path',
      'Shout at the child only',
      'Open the barrier fully',
    ],
    'B',
    'Children near moving vehicles are an accident waiting. Stop traffic and alert the adult.',
  ),
  sq(
    'sq129',
    'You are asked to sign a blank material gate pass “we will fill later.” You should:',
    [
      'Sign to help the stores team',
      'Refuse — never sign a blank pass; the item, quantity and vehicle must be written first',
      'Sign and keep a photo',
      'Ask a visitor to sign instead',
    ],
    'B',
    'A blank signed pass is an open door for theft. Details first, then the signature.',
  ),
  sq(
    'sq130',
    'At the end of a month the occurrence book has unused pages. You should:',
    [
      'Tear them out to keep the book thin',
      'Leave them in the book; do not remove pages',
      'Use them for rough work and throw them',
      'Give them to visitors as scrap',
    ],
    'B',
    'Unused pages stay in the book. Tearing pages looks like a hidden incident.',
  ),
]

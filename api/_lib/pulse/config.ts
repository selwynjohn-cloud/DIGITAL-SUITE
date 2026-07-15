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
  'bandh', 'strike', 'curfew', 'terror', 'militant', 'nsg', 'bank', 'atm', 'cash', 'loot', 'dacoity',
  'heist', 'hostage', 'kidnap', 'shootout', 'firing', 'stabbing', 'mob', 'unrest', 'riot', 'hazmat',
  'gas leak', 'building collapse', 'flood', 'cyclone', 'heavy rain', 'landslide', 'land slide',
  'weather alert', 'imd', 'red alert', 'orange alert',
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
      'western express', 'nh48', 'nh44', 'nh16', 'yamuna expressway', 'heavy rain', 'rain disrupts',
      'flooded road', 'waterlogging', 'traffic advisory', 'commuters warned',
      ...INDIAN_HIGHWAY_CORRIDORS.map((c) => c.toLowerCase()),
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
    title: 'Traffic, Bandh & Public Order — India',
    titleHindi: 'यातायात, बंद और सार्वजनिक व्यवस्था',
    emoji: '🚧',
    headerBg: '#92400e',
    keywords: [
      'road accident', 'traffic', 'highway', 'road advisory', 'gridlock', 'jam', 'strike', 'bandh',
      'protest', 'unrest', 'riot', 'curfew', 'dharna', 'agitation',
    ],
  },
  {
    title: 'Weather, Flood & Natural Calamity (IMD) — India',
    titleHindi: 'मौसम, बाढ़ और प्राकृतिक आपदा (IMD)',
    emoji: '⛈',
    headerBg: '#0d9488',
    keywords: [
      'weather alert', 'heavy rain', 'cyclone', 'depression', 'imd', 'flood', 'landslide',
      'earthquake', 'odisha', 'bay of bengal', 'red alert', 'orange alert', 'yellow alert',
      'heatwave', 'cold wave', 'thunderstorm', 'lightning',
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

/** Daily bulletin times (India). Vercel cron fires at :30 UTC matching these slots. */
export const BULLETIN_SCHEDULE = [
  { edition: 'Morning Bulletin', timeIst: '6:00 AM' },
  { edition: 'Afternoon Bulletin', timeIst: '2:00 PM' },
  { edition: 'Evening Bulletin', timeIst: '6:00 PM' },
] as const

export const QUIZ_WINNER_SCHEDULE = 'Every Sunday morning — winner on bulletin + WhatsApp'

/** Edition name from IST hour (6am–2pm morning, 2pm–6pm afternoon, else evening). */
export function editionLabelForHour(h: number): string {
  if (h >= 6 && h < 14) return 'Morning Edition'
  if (h >= 14 && h < 18) return 'Afternoon Edition'
  return 'Evening Edition'
}

/** Next scheduled bulletin after current IST hour. */
export function nextBulletinLabel(h: number): string {
  if (h < 6) return 'Morning Bulletin — 6:00 AM IST (today)'
  if (h < 14) return 'Afternoon Bulletin — 2:00 PM IST'
  if (h < 18) return 'Evening Bulletin — 6:00 PM IST'
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
 * Built-in Security & Fire-Safety question bank — used until managers add their
 * own (or AI-generated ones). One is shown per day with no repeat for 60 days.
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
]

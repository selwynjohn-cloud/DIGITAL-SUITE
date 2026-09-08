/**
 * Branch letterhead addresses for client-facing letters (Incident Report, etc.).
 * Address follows the sending branch — not always Corporate Office.
 */

export const CORPORATE_OFFICE_ADDRESS_LINES = [
  'CORPORATE OFFICE: 3rd Floor, Uma Enclave,',
  'Road No.9, Banjara Hills,',
  'Hyderabad – 500 034, Tel.No.040-30404030',
]

/** Street / phone lines when known; otherwise city/branch name is used. */
const BRANCH_ADDRESS_BY_NAME: Record<string, string[]> = {
  'Corporate Office': CORPORATE_OFFICE_ADDRESS_LINES,
  'Hyderabad-A': CORPORATE_OFFICE_ADDRESS_LINES,
  'Hyderabad-B': CORPORATE_OFFICE_ADDRESS_LINES,
  'Hi-Tech City': [
    'BRANCH OFFICE — Hi-Tech City',
    'Agile Security Force Private Limited',
    'Hyderabad',
  ],
  Bangalore: ['BRANCH OFFICE — Bangalore', 'Agile Security Force Private Limited'],
  Bhopal: ['BRANCH OFFICE — Bhopal', 'Agile Security Force Private Limited'],
  'Chennai & Pondicherry': [
    'BRANCH OFFICE — Chennai & Pondicherry',
    'Agile Security Force Private Limited',
  ],
  Kochi: ['BRANCH OFFICE — Kochi', 'Agile Security Force Private Limited'],
  'Mumbai & Surat': ['BRANCH OFFICE — Mumbai & Surat', 'Agile Security Force Private Limited'],
  'Nellore & Tada': ['BRANCH OFFICE — Nellore & Tada', 'Agile Security Force Private Limited'],
  'Tirupati & Tadipatri': [
    'BRANCH OFFICE — Tirupati & Tadipatri',
    'Agile Security Force Private Limited',
  ],
  Vijayawada: ['BRANCH OFFICE — Vijayawada', 'Agile Security Force Private Limited'],
  'Visakhapatnam & Kakinada': [
    'BRANCH OFFICE — Visakhapatnam & Kakinada',
    'Agile Security Force Private Limited',
  ],
  'Training Academy': [
    'TRAINING ACADEMY',
    'Agile Security Force Private Limited',
  ],
}

export function branchLetterheadAddressLines(branchName: string): string[] {
  const name = String(branchName || '').trim()
  if (!name) return CORPORATE_OFFICE_ADDRESS_LINES
  if (BRANCH_ADDRESS_BY_NAME[name]) return BRANCH_ADDRESS_BY_NAME[name]
  const key = Object.keys(BRANCH_ADDRESS_BY_NAME).find(
    (k) => k.toLowerCase() === name.toLowerCase(),
  )
  if (key) return BRANCH_ADDRESS_BY_NAME[key]
  if (/hyderabad|corporate/i.test(name)) return CORPORATE_OFFICE_ADDRESS_LINES
  return [`BRANCH OFFICE — ${name}`, 'Agile Security Force Private Limited']
}

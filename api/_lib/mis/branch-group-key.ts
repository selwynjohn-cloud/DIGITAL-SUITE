function stripStateSuffix(label: string): string {
  return label.replace(/-(AP|TG|MH|GJ|UP|PY|TN|KA|KL|MP)$/i, '').trim()
}

/** Normalise branch label for duplicate detection and client/report matching. */
export function misBranchGroupKey(name: string): string {
  const raw = String(name ?? '').trim().toUpperCase()
  if (!raw) return ''
  const compact = raw
    .replace(/[_]+/g, ' ')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
  const stripped = stripStateSuffix(compact)

  const alias: Record<string, string> = {
    'HYDERABAD-A': 'HYDERABAD-A',
    'HYDERABAD A': 'HYDERABAD-A',
    'HYDERABAD-B': 'HYDERABAD-B',
    'HYDERABAD B': 'HYDERABAD-B',
    'HI-TECH CITY': 'HI-TECH CITY',
    'HI-TECH CITY HYDERABAD': 'HI-TECH CITY',
    'HI-TECH CITY, HYDERABAD': 'HI-TECH CITY',
    'HITECH CITY': 'HI-TECH CITY',
    'PUDUCHERRY': 'TN-PONDICHERRY',
    'PONDICHERRY': 'TN-PONDICHERRY',
    'CHENNAI': 'TN-PONDICHERRY',
    'TAMIL NADU': 'TN-PONDICHERRY',
    'TAMILNADU': 'TN-PONDICHERRY',
    'TAMILNADU & PONDICHERRY': 'TN-PONDICHERRY',
    'KAKINADA': 'VIZAG-KAKINADA',
    'VIZAG & KAKINADA': 'VIZAG-KAKINADA',
    'VIZAG AND KAKINADA': 'VIZAG-KAKINADA',
    'VIZAG': 'VIZAG-KAKINADA',
    'VISAKHAPATNAM': 'VIZAG-KAKINADA',
    'TADA': 'NELLORE-TADA',
    'NELLORE & TADA': 'NELLORE-TADA',
    'NELLORE AND TADA': 'NELLORE-TADA',
    'NELLORE': 'NELLORE-TADA',
    'BANGALORE': 'KARNATAKA',
    'KARNATAKA': 'KARNATAKA',
    'KOCHI': 'KERALA',
    'KERALA': 'KERALA',
    'MUMBAI & SURAT': 'MUMBAI-SURAT',
    'MAHARASHTRA': 'MUMBAI-SURAT',
    'SURAT': 'MUMBAI-SURAT',
    'GUJARAT': 'MUMBAI-SURAT',
    'MADHYA PRADESH': 'BHOPAL-MP',
    'LUCKNOW': 'LUCKNOW-UP',
    'VIJAYAWADA': 'VIJAYAWADA',
    'TIRUPATHI & TADIPATRI': 'TIRUPATHI',
    'TIRUPATI': 'TIRUPATHI',
    'TIRUPATHI': 'TIRUPATHI',
    'BHOPAL': 'BHOPAL-MP',
  }

  return alias[stripped] || alias[compact] || alias[raw] || stripped || compact
}

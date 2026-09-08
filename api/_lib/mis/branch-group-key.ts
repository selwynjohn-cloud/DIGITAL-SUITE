function stripStateSuffix(label: string): string {
  return label.replace(/-(AP|TG|MH|GJ|UP|PY|TN|KA|KL|MP)$/i, '').trim()
}

/**
 * Normalise a branch label for matching.
 * Standing rule: every ops city is INDEPENDENT.
 * Nellore ≠ Tada, Tirupati ≠ Tadipatri, Chennai ≠ Puducherry,
 * Mumbai ≠ Surat, Visakhapatnam ≠ Kakinada.
 * Legacy "A & B" names keep their own key so they are never folded into a neighbour.
 */
export function misBranchGroupKey(name: string): string {
  const raw = String(name ?? '').trim().toUpperCase()
  if (!raw) return ''
  const compact = raw
    .replace(/[_]+/g, ' ')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
  const stripped = stripStateSuffix(compact)

  if (/NELLORE/.test(stripped) && /TADA/.test(stripped) && /&|AND/.test(stripped)) return 'LEGACY-NELLORE-TADA'
  if (/TIRUPAT[HI]/.test(stripped) && /TADIPATRI/.test(stripped) && /&|AND/.test(stripped)) {
    return 'LEGACY-TIRUPATI-TADIPATRI'
  }
  if (/(CHENNAI|TAMIL)/.test(stripped) && /(PONDICHERRY|PUDUCHERRY)/.test(stripped) && /&|AND/.test(stripped)) {
    return 'LEGACY-CHENNAI-PUDUCHERRY'
  }
  if (/MUMBAI/.test(stripped) && /SURAT/.test(stripped) && /&|AND/.test(stripped)) return 'LEGACY-MUMBAI-SURAT'
  if (/(VIZAG|VISAKHAPATNAM)/.test(stripped) && /KAKINADA/.test(stripped) && /&|AND/.test(stripped)) {
    return 'LEGACY-VIZAG-KAKINADA'
  }

  const alias: Record<string, string> = {
    'HYDERABAD-A': 'HYDERABAD-A',
    'HYDERABAD A': 'HYDERABAD-A',
    'HYD A': 'HYDERABAD-A',
    'HYD-A': 'HYDERABAD-A',
    'HYD ZONE A': 'HYDERABAD-A',
    'HYD-ZONE-A': 'HYDERABAD-A',
    'HYDERABAD ZONE A': 'HYDERABAD-A',
    'HYDERABAD-B': 'HYDERABAD-B',
    'HYDERABAD B': 'HYDERABAD-B',
    'HYD B': 'HYDERABAD-B',
    'HYD-B': 'HYDERABAD-B',
    'HYD ZONE B': 'HYDERABAD-B',
    'HYD-ZONE-B': 'HYDERABAD-B',
    'HYDERABAD ZONE B': 'HYDERABAD-B',
    'HI-TECH CITY': 'HI-TECH CITY',
    'HI-TECH CITY HYDERABAD': 'HI-TECH CITY',
    'HI-TECH CITY, HYDERABAD': 'HI-TECH CITY',
    'HITECH CITY': 'HI-TECH CITY',
    CHENNAI: 'CHENNAI',
    'TAMIL NADU': 'CHENNAI',
    TAMILNADU: 'CHENNAI',
    PUDUCHERRY: 'PUDUCHERRY',
    PONDICHERRY: 'PUDUCHERRY',
    KAKINADA: 'KAKINADA',
    VIZAG: 'VISAKHAPATNAM',
    VISAKHAPATNAM: 'VISAKHAPATNAM',
    TADA: 'TADA',
    NELLORE: 'NELLORE',
    BANGALORE: 'BANGALORE',
    BENGALURU: 'BANGALORE',
    KARNATAKA: 'BANGALORE',
    KOCHI: 'KOCHI',
    COCHIN: 'KOCHI',
    KERALA: 'KOCHI',
    MUMBAI: 'MUMBAI',
    MAHARASHTRA: 'MUMBAI',
    SURAT: 'SURAT',
    GUJARAT: 'SURAT',
    'MADHYA PRADESH': 'BHOPAL',
    BHOPAL: 'BHOPAL',
    'BHOPAL-MP': 'BHOPAL',
    LUCKNOW: 'LUCKNOW',
    'LUCKNOW-UP': 'LUCKNOW',
    VIJAYAWADA: 'VIJAYAWADA',
    TIRUPATI: 'TIRUPATI',
    TIRUPATHI: 'TIRUPATI',
    TADIPATRI: 'TADIPATRI',
    'CHENNAI & PONDICHERRY': 'LEGACY-CHENNAI-PUDUCHERRY',
    'CHENNAI AND PONDICHERRY': 'LEGACY-CHENNAI-PUDUCHERRY',
    'VIZAG & KAKINADA': 'LEGACY-VIZAG-KAKINADA',
    'NELLORE & TADA': 'LEGACY-NELLORE-TADA',
    'MUMBAI & SURAT': 'LEGACY-MUMBAI-SURAT',
    'TIRUPATI & TADIPATRI': 'LEGACY-TIRUPATI-TADIPATRI',
    'TIRUPATHI & TADIPATRI': 'LEGACY-TIRUPATI-TADIPATRI',
  }

  return alias[stripped] || alias[compact] || alias[raw] || stripped || compact
}

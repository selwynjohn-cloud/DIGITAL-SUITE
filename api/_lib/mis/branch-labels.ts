/** City-only branch labels — no state names, no bracket hints. */
export const MIS_BRANCH_HINTS: Record<string, string> = {}

export function misBranchDisplayName(_id: string, name: string): string {
  return String(name ?? '').trim()
}

export const MIS_BRANCH_HINTS_JS = JSON.stringify(MIS_BRANCH_HINTS)

/**
 * Canonical city-only display names (alphabetical).
 * Specific cities first so Tada is not renamed Nellore, Surat is not renamed Mumbai, etc.
 */
export const MIS_CITY_BRANCH_NAMES: { match: RegExp; name: string }[] = [
  { match: /^karnataka$|^bangalore$|^bengaluru$/i, name: 'Bangalore' },
  { match: /^madhya\s*pradesh$|^bhopal/i, name: 'Bhopal' },
  { match: /^pondicherry$|^puducherry$/i, name: 'Puducherry' },
  { match: /^chennai$|^tamil\s*nadu$/i, name: 'Chennai' },
  { match: /^hi-?tech/i, name: 'Hi-Tech City' },
  { match: /^hyderabad-?a$/i, name: 'Hyderabad-A' },
  { match: /^hyderabad-?b$/i, name: 'Hyderabad-B' },
  { match: /^kerala$|^kochi$|^cochin$/i, name: 'Kochi' },
  { match: /^surat$|^gujarat$/i, name: 'Surat' },
  { match: /^mumbai$|^maharashtra$/i, name: 'Mumbai' },
  { match: /^tada$/i, name: 'Tada' },
  { match: /^nellore$/i, name: 'Nellore' },
  { match: /^tadipatri$/i, name: 'Tadipatri' },
  { match: /^tirupati$|^tirupathi$/i, name: 'Tirupati' },
  { match: /^vijayawada$/i, name: 'Vijayawada' },
  { match: /^kakinada$/i, name: 'Kakinada' },
  { match: /^visakhapatnam$|^vizag$/i, name: 'Visakhapatnam' },
]

export function cityOnlyBranchName(name: string): string {
  const n = String(name ?? '').trim()
  if (/&|\band\b/i.test(n) && /(nellore|tada|tirupati|tadipatri|chennai|pondicherry|puducherry|mumbai|surat|vizag|visakhapatnam|kakinada)/i.test(n)) {
    return n
  }
  for (const row of MIS_CITY_BRANCH_NAMES) {
    if (row.match.test(n)) return row.name
  }
  return n
}

/** City-only branch labels — no state names, no bracket hints. */
export const MIS_BRANCH_HINTS: Record<string, string> = {}

export function misBranchDisplayName(_id: string, name: string): string {
  return String(name ?? '').trim()
}

export const MIS_BRANCH_HINTS_JS = JSON.stringify(MIS_BRANCH_HINTS)

/** Canonical city-only display names (alphabetical). */
export const MIS_CITY_BRANCH_NAMES: { match: RegExp; name: string }[] = [
  { match: /^karnataka$|^bangalore$|^bengaluru$/i, name: 'Bangalore' },
  { match: /^madhya\s*pradesh$|^bhopal/i, name: 'Bhopal' },
  { match: /^chennai|^tamil\s*nadu|^pondicherry|^puducherry/i, name: 'Chennai & Pondicherry' },
  { match: /^hi-?tech/i, name: 'Hi-Tech City' },
  { match: /^hyderabad-?a$/i, name: 'Hyderabad-A' },
  { match: /^hyderabad-?b$/i, name: 'Hyderabad-B' },
  { match: /^kerala$|^kochi$|^cochin$/i, name: 'Kochi' },
  { match: /^mumbai|^maharashtra$|^gujarat$|^surat/i, name: 'Mumbai & Surat' },
  { match: /^nellore|^tada/i, name: 'Nellore & Tada' },
  { match: /^tirupati|^tirupathi|^tadipatri/i, name: 'Tirupati & Tadipatri' },
  { match: /^vijayawada$/i, name: 'Vijayawada' },
  { match: /^visakhapatnam|^vizag|^kakinada/i, name: 'Visakhapatnam & Kakinada' },
]

export function cityOnlyBranchName(name: string): string {
  const n = String(name ?? '').trim()
  for (const row of MIS_CITY_BRANCH_NAMES) {
    if (row.match.test(n)) return row.name
  }
  return n
}

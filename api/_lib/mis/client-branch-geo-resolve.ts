/**
 * Geography hints for assigning a site to the correct MIS ops branch.
 * Used by Work360 master sync — Mobile app branch label wins when present;
 * these rules apply when Mobile omits branch/region (e.g. Warangal → Hyderabad-B).
 */
import { misBranchGroupKey } from './branch-group-key.js'
import type { MisBranch, MisClient } from './store.js'

function siteLooksLikeKakinadaLeftover(c: { name?: string; location?: string; geoAddress?: string }): boolean {
  const blob = [c.name, c.location, c.geoAddress].filter(Boolean).join(' ').toUpperCase().replace(/[_-]+/g, ' ')
  if (/\bDIVI'?S\b/.test(blob) && /\b(TELANGANA|CHOUTUPPAL|SANATHNAGAR|LINGOJIGUDEM)\b/.test(blob)) return true
  if (/\b(STATE BANK|SBI)\b/.test(blob)) return true
  if (/\bAVG\b/.test(blob) && /\b(BHIMAVARAM|BEEMAVARAM)\b/.test(blob)) return true
  if (/\b(HDFC|IDBI)\b/.test(blob) && /\b(ELURU|ELLURU|BHIMAVARAM|BEEMAVARAM|RR\s*PET|VIJAYAWADA)\b/.test(blob)) {
    return true
  }
  return false
}

/** Local copy — Kakinada book must not geo-land on Visakhapatnam. */
function siteLooksLikeKakinadaBook(c: { name?: string; location?: string; geoAddress?: string }): boolean {
  const blob = [c.name, c.location, c.geoAddress].filter(Boolean).join(' ').toUpperCase().replace(/[_-]+/g, ' ')
  if (!blob.trim()) return false
  if (/\b(SREERAMA|SREE\s*RAMA|RATNAJYOTHI|NRI\s*SITE)\b/.test(blob)) return true
  if (/\bCOROMANDEL\b/.test(blob)) return true
  if (/\b(KALEESWARI|KALEESUWARI)\b/.test(blob)) return true
  if (/\bDIVI'?S\b/.test(blob) && /\b(TELANGANA|CHOUTUPPAL|SANATHNAGAR|LINGOJIGUDEM)\b/.test(blob)) return false
  if (/\bDIVI'?S\b/.test(blob) && /\b(THONDANGI|ANDHRA|\bAP\b|KAKINADA)\b/.test(blob)) return true
  if (/\bGEMINI\b/.test(blob) && !/\bNELLORE\b/.test(blob)) return true
  if (!/\b(HDFC|IDBI)\b/.test(blob)) return false
  if (/\b(VIZAG|VISAKHAPATNAM|VISHAKHAPATNAM|GAJUWAKA|MADHURAWADA)\b/.test(blob)) return false
  if (/\b(ELURU|ELLURU|BHIMAVARAM|BEEMAVARAM|VIJAYAWADA)\b/.test(blob)) return false
  return /\b(KAKINADA|RAJAHMUNDRY|RAJAHMANDRY|ANNAVARAM|AMALAPURAM|THONDANGI)\b/.test(blob)
}

/** Local copy — avoid circular import with client-branch.ts */
function siteLooksLikeKrc(c: { name?: string; location?: string; geoAddress?: string }): boolean {
  const blob = [c.name, c.location, c.geoAddress].filter(Boolean).join(' ').toUpperCase()
  if (!blob.trim()) return false
  if (/\bKRC\b/.test(blob)) return true
  if (/K\s*RAHEJA|RAHEJA\s*CORP|RAHEJA\s*MIND/.test(blob)) return true
  if (/MIND\s*A?SPACE|SUNDEW|STARGAZE|NEWFOUND/.test(blob)) return true
  if (/J\.?\s*T\.?\s*HOLD|KRIT\s*OFFICE|POCHARAM/.test(blob)) return true
  return false
}

const GEO_RULES: Array<{ re: RegExp; group: string }> = [
  { re: /\b(bangalore|bengaluru|banglore|mangalore|mangaluru|ballari|bellary|ginigera|karnataka)\b/i, group: 'BANGALORE' },
  { re: /\b(kochi|cochin|ernakulam|kerala)\b/i, group: 'KOCHI' },
  { re: /\b(pondicherry|puducherry|auroville|cuddalore)\b/i, group: 'PONDICHERRY' },
  { re: /\b(chennai|tamil\s*nadu|madurai|coimbatore|tambaram|chrompet)\b/i, group: 'CHENNAI' },
  { re: /\b(mumbai|thane|navi\s*mumbai|kalyan)\b/i, group: 'MUMBAI' },
  { re: /\b(surat|gujarat|vadodara|vapi|bharuch)\b/i, group: 'SURAT' },
  { re: /\b(bhopal|madhya\s*pradesh|gwalior|indore)\b/i, group: 'BHOPAL' },
  // Tada = Premier Energies, Naidupetta ONLY (Director 15 Aug 2026). HDFC Tada / Sri City → Nellore.
  { re: /\bpremier\s*energies\b.*\bnaidupett?a?\b|\bnaidupett?a?\b.*\bpremier\s*energies\b/i, group: 'TADA' },
  { re: /\b(tada|sri\s*city|gummidipoondi|naidupett?a?)\b/i, group: 'NELLORE' },
  { re: /\b(nellore|gudur|kavali|sullurpeta?)\b/i, group: 'NELLORE' },
  // Tadipatri = UTCL / Aditya Birla Tadipatri — not Tirupati.
  { re: /\b(utcl|adithya\s*birla|aditya\s*birla|ultra\s*tech)\b.*\btadipatri\b|\btadipatri\b.*\b(utcl|adithya\s*birla|aditya\s*birla|ultra\s*tech)\b/i, group: 'TADIPATRI' },
  { re: /\b(tadipatri|anantapur|gooty)\b/i, group: 'TADIPATRI' },
  { re: /\b(tirupati|tirupathi|chittoor|renigunta)\b/i, group: 'TIRUPATI' },
  // Kakinada book (Director 14 Aug 2026) — not Visakhapatnam.
  { re: /\b(sreerama|sree\s*rama|ratnajyothi|nri\s*site)\b/i, group: 'KAKINADA' },
  { re: /\bcoromandel\b/i, group: 'KAKINADA' },
  { re: /\b(kaleeswari|kaleesuwari)\b/i, group: 'KAKINADA' },
  { re: /\bdivi'?s\b.*\b(telangana|choutuppal|sanathnagar|lingojigudem)\b/i, group: 'HYDERABAD-B' },
  { re: /\bdivi'?s\b.*\b(thondangi|andhra|\bap\b|kakinada)\b/i, group: 'KAKINADA' },
  { re: /\bgemini\b(?![\s\S]*\bnellore\b)/i, group: 'KAKINADA' },
  { re: /\b(eluru|elluru|bhimavaram|beemavaram|rr\s*pet)\b/i, group: 'VISAKHAPATNAM' },
  { re: /\b(kakinada|rajahmundry|rajahmandry|rajhmundry|rajamundry)\b/i, group: 'KAKINADA' },
  { re: /\b(vizag|visakhapatnam|vishakhapatnam|vizianagaram)\b/i, group: 'VISAKHAPATNAM' },
  { re: /\b(vijayawada|guntur|amaravati)\b/i, group: 'VIJAYAWADA' },
  // Hi-Tech City branch = KRC / Mindspace family ONLY (Director lock).
  // Do NOT match bare "Hi-Tech City" / bank names like "HDFC - HI TECH CITY" — those are Hyd-A.
  {
    re: /\b(k\s*raheja|raheja\s*corp|\bkrc\b|mind\s*a?space|sundew|stargaze|pocharam|newfound)\b/i,
    group: 'HI-TECH CITY',
  },
  // West / Cyberabad localities (incl. bank "HI TECH CITY" labels) → Hyderabad-A
  {
    re: /\b(gachibowli|madhapur|kondapur|raidurg(?:am)?|nanakramguda|financial\s*district|hi[\s\-]?tech\s*city|hitech\s*city|hitec\s*city|hi[\s\-]?tech)\b/i,
    group: 'HYDERABAD-A',
  },
  { re: /\b(hyderabad\s*-?\s*b|hyd\s*-?\s*b|zone\s*-?\s*b|hyderabadzoneb)\b/i, group: 'HYDERABAD-B' },
  {
    re: /\b(warangal|karimnagar|nizamabad|khammam|mahbubnagar|siddipet|medak|kakatiya|kakatya|nalgon(?:da|da))\b/i,
    group: 'HYDERABAD-B',
  },
  { re: /\b(telangana)\b.*\bzone\s*-?\s*b\b/i, group: 'HYDERABAD-B' },
  { re: /\b(hyderabad\s*-?\s*a|hyd\s*-?\s*a|zone\s*-?\s*a|hyderabadzonea)\b/i, group: 'HYDERABAD-A' },
  {
    re: /\b(zaheerabad|sangareddy|medchal|secunderabad|palwancha|sarapaka|bhadrachalam)\b/i,
    group: 'HYDERABAD-A',
  },
  { re: /\b(hyderabad|telangana|\bts\b)\b/i, group: 'HYDERABAD-A' },
]

export function resolveBranchFromSiteGeo(text: string, branches: MisBranch[]): string | null {
  const blob = String(text || '').trim()
  if (!blob) return null
  const pool = branches.filter((b) => b.active !== false)
  for (const rule of GEO_RULES) {
    if (!rule.re.test(blob)) continue
    const hit = pool.find((b) => misBranchGroupKey(b.name) === rule.group)
    if (hit) return hit.id
  }
  return null
}

/** Fix sites whose location text names a different city than their stored branch (e.g. Warangal on Pondicherry). */
export function reassignClientsBySiteGeo(
  clients: MisClient[],
  branches: MisBranch[],
): { clients: MisClient[]; moved: number; samples: string[] } {
  let moved = 0
  const samples: string[] = []
  const next = clients.map((c) => {
    if (c.active === false) return c
    const text = [c.name, c.location, c.geoAddress].filter(Boolean).join(' · ')
    const geoId = resolveBranchFromSiteGeo(text, branches)
    if (!geoId || geoId === c.branchId) return c
    const cur = branches.find((b) => b.id === c.branchId)
    const geo = branches.find((b) => b.id === geoId)
    const curKey = cur ? misBranchGroupKey(cur.name) : ''
    const geoKey = geo ? misBranchGroupKey(geo.name) : ''
    if (!geoKey || curKey === geoKey) return c
    // Never geo-assign non-KRC sites onto Hi-Tech City (Director lock).
    if (geoKey === 'HI-TECH CITY' && !siteLooksLikeKrc(c)) return c
    // Tada = Premier Energies Naidupeta only.
    if (geoKey === 'TADA' && !/\bpremier\s*energ/i.test(text) && !/\bnaidupet/i.test(text)) return c
    if (geoKey === 'TADA' && !/\bpremier\s*energ/i.test([c.name, c.location].join(' '))) return c
    // Never geo-assign the Kakinada book onto Visakhapatnam.
    if (geoKey === 'VISAKHAPATNAM' && siteLooksLikeKakinadaBook(c)) return c
    // Never geo-assign Eluru / Bhimavaram / SBI / Divis Telangana onto Kakinada.
    if (geoKey === 'KAKINADA' && siteLooksLikeKakinadaLeftover(c)) return c
    moved++
    if (samples.length < 30) {
      samples.push(
        `${c.name}${c.location ? ' @ ' + c.location : ''}: ${cur?.name || c.branchId} → ${geo?.name || geoId}`,
      )
    }
    return { ...c, branchId: geoId }
  })
  return { clients: next, moved, samples }
}

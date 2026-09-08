/**
 * Agile Recruitment Centre locations for Security Job thank-you message.
 * Source: Agile Security Force Private Limited — Recruitment Centre list (Aug 2026).
 * Shown after registration only (not as a full website directory).
 */

export type RecruitmentCentre = {
  city: string
  mapsUrl: string
  /** Optional short note under the city name */
  note?: string
}

export const HELP_DESK_PHONE = '+91 8500915599'
export const CENTRAL_COMMAND_PHONE = '+91 9248707070'
export const CENTRAL_COMMAND_MAPS =
  'https://maps.app.goo.gl/Ths5iMzCXRKvZEXr5'

/** Centres with Google Maps links from Selwyn’s PDF. */
export const RECRUITMENT_CENTRES: RecruitmentCentre[] = [
  { city: 'Hyderabad', mapsUrl: 'https://maps.app.goo.gl/KTWcTcd52vdgBMdK8' },
  { city: 'Kakinada', mapsUrl: 'https://maps.app.goo.gl/eTtmsv4U9ugAyc8t9' },
  { city: 'Nellore', mapsUrl: 'https://maps.app.goo.gl/KfQABXKhiMKgNTJs6' },
  { city: 'Chennai', mapsUrl: 'https://maps.app.goo.gl/6Xo26z534ZUNqVhA8' },
  { city: 'Bangalore', mapsUrl: 'https://maps.app.goo.gl/CR2MFZHTUkqaqtL88' },
  { city: 'Bhopal', mapsUrl: 'https://maps.app.goo.gl/7xJTXrSiZVRH3YGj7' },
  { city: 'Visakhapatnam', mapsUrl: 'https://maps.app.goo.gl/TRRbnixxvkoWDH7p7' },
  { city: 'Mumbai', mapsUrl: 'https://maps.app.goo.gl/ngWnozadEcEAcBWW9' },
]

/** Map preferred registration city → nearest recruitment centre city. */
const CITY_TO_CENTRE: Record<string, string> = {
  hyderabad: 'Hyderabad',
  warangal: 'Hyderabad',
  karimnagar: 'Hyderabad',
  secunderabad: 'Hyderabad',
  kakinada: 'Kakinada',
  nellore: 'Nellore',
  tirupati: 'Nellore',
  chennai: 'Chennai',
  coimbatore: 'Chennai',
  madurai: 'Chennai',
  bangalore: 'Bangalore',
  bengaluru: 'Bangalore',
  mysuru: 'Bangalore',
  mysore: 'Bangalore',
  mangaluru: 'Bangalore',
  mangalore: 'Bangalore',
  bhopal: 'Bhopal',
  indore: 'Bhopal',
  visakhapatnam: 'Visakhapatnam',
  vizag: 'Visakhapatnam',
  vijayawada: 'Visakhapatnam',
  guntur: 'Visakhapatnam',
  mumbai: 'Mumbai',
  pune: 'Mumbai',
  nagpur: 'Mumbai',
}

export type ResolvedRecruitmentCentre = {
  city: string
  mapsUrl: string
  helpDesk: string
  centralCommand: string
  /** True when we used a nearby centre, not an exact city match */
  nearby: boolean
  /** True when no local centre — point to Central Command map */
  fallback: boolean
}

/** Same place under another name (not a “nearby” redirect). */
const SAME_CITY_ALIASES: Record<string, string> = {
  bengaluru: 'bangalore',
  bangalore: 'bangalore',
  vizag: 'visakhapatnam',
  visakhapatnam: 'visakhapatnam',
  mysore: 'mysuru',
  mangalore: 'mangaluru',
  secunderabad: 'hyderabad',
}

export function resolveRecruitmentCentre(preferredLocation: string): ResolvedRecruitmentCentre {
  const raw = String(preferredLocation ?? '').trim()
  const key = raw.toLowerCase()
  const centreName = CITY_TO_CENTRE[key]
  if (centreName) {
    const centre = RECRUITMENT_CENTRES.find((c) => c.city === centreName)!
    const prefNorm = SAME_CITY_ALIASES[key] || key
    const centreNorm = SAME_CITY_ALIASES[centre.city.toLowerCase()] || centre.city.toLowerCase()
    return {
      city: centre.city,
      mapsUrl: centre.mapsUrl,
      helpDesk: HELP_DESK_PHONE,
      centralCommand: CENTRAL_COMMAND_PHONE,
      nearby: prefNorm !== centreNorm,
      fallback: false,
    }
  }
  const exact = RECRUITMENT_CENTRES.find((c) => c.city.toLowerCase() === key)
  if (exact) {
    return {
      city: exact.city,
      mapsUrl: exact.mapsUrl,
      helpDesk: HELP_DESK_PHONE,
      centralCommand: CENTRAL_COMMAND_PHONE,
      nearby: false,
      fallback: false,
    }
  }
  return {
    city: 'Central Command Centre',
    mapsUrl: CENTRAL_COMMAND_MAPS,
    helpDesk: HELP_DESK_PHONE,
    centralCommand: CENTRAL_COMMAND_PHONE,
    nearby: false,
    fallback: true,
  }
}

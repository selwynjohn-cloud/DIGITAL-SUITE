/** Agile Security Force — Security Survey & Risk Assessment checklist (0–5 per item). */

export type SurveyCheckItem = { id: string; label: string; hint?: string }
export type SurveyPart = { id: string; title: string; maxTotal: number; items: SurveyCheckItem[] }
export type ContractStartStep = { id: string; title: string; bullets: string[] }

export const SURVEY_PARTS: SurveyPart[] = [
  {
    id: 'p1',
    title: 'Part 1 — Incidence of Crime (Last 12 Months)',
    maxTotal: 50,
    items: [
      { id: 'p1_trespass_day', label: 'Trespassers during day time', hint: '0 = none reported; 5 = frequent / no fence' },
      { id: 'p1_trespass_night', label: 'Trespassers during night time' },
      { id: 'p1_vandalism', label: 'Vandalism or group representations by public/employees' },
      { id: 'p1_theft', label: 'Theft / burglary or attempt' },
      { id: 'p1_fire_local', label: 'Fire near-miss / fire accidents in locality' },
      { id: 'p1_attack', label: 'Attack on staff or visitors' },
      { id: 'p1_intrusion_day', label: 'Intrusion reported during day time' },
      { id: 'p1_intrusion_night', label: 'Intrusion reported during night time' },
      { id: 'p1_threats', label: 'Threats or attack on staff' },
      { id: 'p1_hiding', label: 'Hiding places in premises' },
      { id: 'p1_garbage', label: 'Garbage / sewage dumped into premises' },
      { id: 'p1_id_cards', label: 'ID cards for staff/workers/contractors/drivers/visitors (Yes=0)', hint: '0 if all have ID; higher if missing' },
    ],
  },
  {
    id: 'p2',
    title: 'Part 2 — Environment and Building',
    maxTotal: 70,
    items: [
      { id: 'p2_crime_area', label: 'Crime rate of locality' },
      { id: 'p2_overlooked', label: 'Site overlooked from roads / prominent buildings' },
      { id: 'p2_boundaries', label: 'Boundaries, fences and gates' },
      { id: 'p2_entrances', label: 'Clearly defined entrances with warning signages' },
      { id: 'p2_access_records', label: 'Visitors & vehicle movements recorded' },
      { id: 'p2_parking', label: 'Outsiders park vehicles after office hours' },
      { id: 'p2_perimeter', label: 'Perimeter protective with warning signages' },
      { id: 'p2_critical', label: 'Security of critical areas' },
      { id: 'p2_cctv_critical', label: 'Critical areas / water tank remotely monitored by CCTV' },
      { id: 'p2_police', label: 'Police patrolling team visits' },
      { id: 'p2_after_hours', label: 'Staff use premises after office hours' },
      { id: 'p2_accommodation', label: 'Permitted residents/workers on premises' },
      { id: 'p2_drivers', label: 'Drivers permitted to stay on site at night (Yes=5)' },
      { id: 'p2_vehicles_after', label: 'Unauthorized vehicle movements after hours (Yes=5)' },
    ],
  },
  {
    id: 'p3',
    title: 'Part 3 — Security Measures',
    maxTotal: 60,
    items: [
      { id: 'p3_watch', label: 'System for reporting suspicious movements' },
      { id: 'p3_lighting', label: 'Security lighting — perimeter, entrances, footpaths' },
      { id: 'p3_cctv', label: 'CCTV surveillance covering perimeter & access points' },
      { id: 'p3_recording', label: 'CCTV recording retention (less days = higher risk)' },
      { id: 'p3_sensitive', label: 'Sensitive areas marked and secured' },
      { id: 'p3_breach_log', label: 'Security breach / trespass / strangers recorded & reported' },
      { id: 'p3_crime_5km', label: 'Crime cases within 5 km' },
      { id: 'p3_locals', label: 'Type of locals from surrounding area' },
      { id: 'p3_liquor', label: 'Liquor / alcohol / gutka usage on premises' },
      { id: 'p3_vehicle_log', label: 'Record keeping for visitors & vehicle movement' },
      { id: 'p3_door_lock', label: 'Access points locked & recorded after office hours' },
      { id: 'p3_keys', label: 'Key handling procedures followed' },
      { id: 'p3_public_access', label: 'Public permitted inside (e.g. free water) — No=0' },
      { id: 'p3_patrol_path', label: 'Perimeter patrolling way available (Yes=0)' },
    ],
  },
]

export const CONTRACT_START_STEPS: ContractStartStep[] = [
  {
    id: 'cs1',
    title: '1. Pre-Deployment Planning',
    bullets: ['Client briefing & scope', 'Review contract / SLA', 'Client policies & compliance', 'Confirm guards, shifts, posts', 'Critical assets & sensitive areas', 'Working hours, visitor flow, risk profile', 'Emergency contacts'],
  },
  {
    id: 'cs2',
    title: '2. Site Survey & Risk Assessment',
    bullets: ['Entry/exit points', 'Vulnerable areas', 'CCTV, access control, alarms, lighting', 'Fire safety & evacuation', 'Perimeter security', 'Traffic management', 'Risk assessment report'],
  },
  {
    id: 'cs3',
    title: '3. Deployment Planning',
    bullets: ['Guard posts & patrolling routes', 'Shift schedule & manpower', 'Supervisory structure', 'Static vs mobile patrols', 'Duty instructions per post', 'Access control procedures', 'Incident response protocols'],
  },
  {
    id: 'cs4',
    title: '4. Documentation & Registers',
    bullets: ['Attendance, visitor, vehicle registers', 'Material in/out, key, incident registers', 'Post orders & site instructions', 'Emergency contact list', 'Escalation matrix'],
  },
  {
    id: 'cs5',
    title: '5. Staff Selection & Training',
    bullets: ['Licensed verified guards', 'Background verification', 'Site-specific training', 'Access control, emergency, fire safety', 'Customer handling & incident reporting', 'Client SOP briefing'],
  },
  {
    id: 'cs6',
    title: '6. Equipment & Logistics',
    bullets: ['Uniforms & ID cards', 'Walkie-talkies, torches', 'HHMD/DFMD if required', 'Visitor badges, log books', 'First aid, fire extinguisher awareness'],
  },
  {
    id: 'cs7',
    title: '7. Handover / Takeover',
    bullets: ['Pooja (prayer)', 'Joint inspection with client', 'Check security equipment', 'Verify keys & access cards', 'Record pending incidents', 'Handover notes'],
  },
  {
    id: 'cs8',
    title: '8. Implementation of SOPs',
    bullets: ['Access control & visitor management', 'Vehicle & material checks', 'Key control', 'Emergency evacuation', 'Incident reporting — SOP copy at security cabin'],
  },
  {
    id: 'cs9',
    title: '9. Communication & Reporting',
    bullets: ['Daily security report (DSR)', 'Incident & breach registers', 'Shift handover reports', 'Weekly/monthly review', 'Client representative communication'],
  },
  {
    id: 'cs10',
    title: '10. Initial Monitoring & Audit',
    bullets: ['Daily supervisor checks', 'Guard performance review', 'Register maintenance', 'Operational gaps', 'Client feedback meetings'],
  },
  {
    id: 'cs11',
    title: '11. Emergency Preparedness',
    bullets: ['Fire drills', 'Evacuation procedures', 'Medical emergency', 'Security threat response', 'Police & fire coordination'],
  },
  {
    id: 'cs12',
    title: '12. Site Security File',
    bullets: ['Contract copy', 'Deployment chart', 'Guard details & licences', 'SOPs & post orders', 'Risk assessment report', 'Daily reports & incident records'],
  },
]

export function surveyPartTotal(scores: Record<string, number>, part: SurveyPart): number {
  return part.items.reduce((s, it) => s + Math.min(5, Math.max(0, Number(scores[it.id]) || 0)), 0)
}

export function surveyGrandTotal(scores: Record<string, number>): number {
  return SURVEY_PARTS.reduce((s, p) => s + surveyPartTotal(scores, p), 0)
}

export function riskBand(total: number): { level: string; colour: string } {
  if (total <= 60) return { level: 'Low', colour: '#22c55e' }
  if (total <= 100) return { level: 'Moderate', colour: '#f59e0b' }
  if (total <= 140) return { level: 'High', colour: '#f97316' }
  return { level: 'Critical', colour: '#ef4444' }
}

export const DEFAULT_SITE_INPUTS = {
  clientBrief: '',
  scopeOfWork: '',
  existingSecurity: '',
  proposedShifts: '',
  sanctionedStrength: '',
  criticalAssets: '',
  accessPoints: '',
  vulnerableAreas: '',
  clientExpectations: '',
}

export const DEFAULT_UNIFORM_REQUIREMENTS = `Agile Security Force standard uniform per PSARA & client branding:
• Navy blue / client-specified shirt with Agile & client logo
• Black trousers, black leather belt, black safety shoes
• Name badge, company ID card, rank insignia (ASO / LSG / SG)
• Peak cap or beret as per site SOP · clean shave / groomed appearance daily
• Raincoat & torch for outdoor posts · reflective jacket for traffic posts`

export const SURVEY_PHOTO_TYPES: { id: string; label: string }[] = [
  { id: 'site_photo', label: 'Site Photo (phone)' },
  { id: 'deployment_chart', label: 'Deployment Chart' },
  { id: 'perimeter', label: 'Perimeter / Fence' },
  { id: 'entrance', label: 'Main Entrance' },
  { id: 'cctv', label: 'CCTV / Blind Spot' },
  { id: 'other', label: 'Other' },
]

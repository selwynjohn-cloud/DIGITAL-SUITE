/**
 * HDFC SSA — how many of the 15 pages are complete (for the submitted list
 * and to block Submit to HOD until all 15 are done).
 */

import { SURVEY_PARTS } from '../crm/survey-template.js'

export const HDFC_PAGE_TOTAL = 15

const HDFC_PHOTO_NEED = ['selfie', 'bank_front', 'bank_approach', 'ac_outdoor', 'sensitive'] as const

const FORM_PAGES: { id: string; label: string; keys: string[] }[] = [
  {
    id: 'h1',
    label: '1. Location & Identification',
    keys: [
      'locationCategory',
      'geoLandmark',
      'surroundLeft',
      'surroundRight',
      'surroundFront',
      'surroundBack',
      'nearestFireStation',
      'nearestPoliceStation',
      'wineShopNearby',
      'barsNearby',
      'shops24x7Nearby',
      'busStandNearby',
      'railwayStationNearby',
      'politicalPartyOfficeNearby',
      'airportNearby',
      'publicMovement24x7',
      'remoteAtNight',
    ],
  },
  {
    id: 'h2',
    label: '2. Basic Information',
    keys: ['managerName', 'surveyedBy', 'holidayOpenPermission', 'faKnowsProcedure'],
  },
  {
    id: 'h3',
    label: '3. Deployment verification',
    keys: ['sanctionedGuards', 'dayShiftStart', 'afternoonShiftStart', 'eveningShiftStart', 'faOnDuty'],
  },
  {
    id: 'h4',
    label: '4. Registers & Compliance',
    keys: [
      'attendanceRegister',
      'hotoRegister',
      'occurrenceRegister',
      'breakRegister',
      'generatorRegister',
      'cashLoadingRegister',
      'bankOpenCloseRegister',
      'complianceFile',
      'holidayRegisterKeepPlace',
      'faDocPvc',
      'faDocMedical',
      'faDocDeploymentOrder',
    ],
  },
  {
    id: 'h5',
    label: '5. Bank Physical security',
    keys: [
      'entryPointsToBank',
      'openPosition',
      'backYardDoor',
      'damagedWindows',
      'closingBankChecklist',
      'whoLocksBank',
      'whoSealsKeys',
    ],
  },
  {
    id: 'h6',
    label: '6. ATM & Lobby',
    keys: ['atmSite', 'atmShiftCount', 'atmGuarding', 'atmLobbyClean', 'atmVisibleFromRoad'],
  },
  {
    id: 'h7',
    label: '7. Generator & Utility',
    keys: [
      'generatorLocation',
      'generatorVisibleFromAtm',
      'generatorCctvCoverage',
      'generatorAreaLuminated',
      'generatorRegisterMaintained',
    ],
  },
  {
    id: 'h8',
    label: '8. Perimeter & Patrolling',
    keys: ['patrolFrequency', 'outdoorAcUnit', 'outdoorAcLighting', 'outdoorAcCctv'],
  },
  {
    id: 'h9',
    label: '9. Fire safety',
    keys: ['feAtmCount', 'feBankCount', 'cookingHeatingAvailable', 'microwavePresent'],
  },
  {
    id: 'h10',
    label: '10. Emergency communication',
    keys: [
      'routerInstalled',
      'panicSwitchAtm',
      'agileControlNumber',
      'faKnowledgeAgileMobileAlarm',
      'emergencyContactDisplayedFa',
      'escalationKnownFa',
    ],
  },
  {
    id: 'h11',
    label: '11. Electronic Security',
    keys: ['cctvAtmCount', 'cctvBankCount', 'localDvrLocation', 'cctvCableOpen', 'cctvCoverageOk'],
  },
]

function scoreIds(): string[] {
  return SURVEY_PARTS.flatMap((p) => p.items.map((it) => it.id))
}

export type HdfcPageProgressInput = {
  hdfcForm?: Record<string, string> | null
  scores?: Record<string, number> | null
  photos?: Array<{ heading?: string; dataUrl?: string; active?: boolean }> | null
  riskAnalysis?: string
  executiveSummary?: string
  securityRecommendations?: string
  siteObservations?: string
  hodSuggestions?: string
  status?: string
}

export type HdfcPageProgress = {
  done: number
  total: typeof HDFC_PAGE_TOTAL
  missing: string[]
  label: string
  complete: boolean
}

function filled(v: unknown): boolean {
  return String(v ?? '').trim().length > 0
}

function formHas(form: Record<string, string>, keys: string[]): boolean {
  return keys.every((k) => filled(form[k]))
}

export function hdfcFaValidityOk(form: Record<string, string>): boolean {
  try {
    const arr = JSON.parse(form.facilityAttendantsJson || '[]') as Array<{
      name?: string
      idNo?: string
      idCardValidity?: string
    }>
    if (!Array.isArray(arr) || !arr.length) return false
    let need = 1
    const s = String(form.sanctionedGuards || '')
    if (s === '2FA') need = 2
    if (s === '3FA') need = 3
    const ok = arr.filter((x) => filled(x?.name) && filled(x?.idNo) && filled(x?.idCardValidity))
    return ok.length >= need
  } catch {
    return false
  }
}

export function hdfcPagesProgress(sv: HdfcPageProgressInput): HdfcPageProgress {
  const form = sv.hdfcForm && typeof sv.hdfcForm === 'object' ? sv.hdfcForm : {}
  const missing: string[] = []

  for (const page of FORM_PAGES) {
    const keysOk = formHas(form, page.keys)
    const faOk = page.id !== 'h3' || hdfcFaValidityOk(form)
    if (!keysOk || !faOk) missing.push(page.label)
  }

  const scores = sv.scores && typeof sv.scores === 'object' ? sv.scores : {}
  const needScores = scoreIds()
  const scoresOk = needScores.every((id) => Object.prototype.hasOwnProperty.call(scores, id))
  if (!scoresOk) missing.push('12. Risk check list')

  const reportOk =
    filled(sv.riskAnalysis) && filled(sv.executiveSummary) && filled(sv.securityRecommendations)
  if (!reportOk) missing.push('13. Professional assessment')

  const photos = Array.isArray(sv.photos) ? sv.photos : []
  const slots = new Set(
    photos
      .filter((p) => p && p.active !== false && filled(p.dataUrl))
      .map((p) => String(p.heading || '')),
  )
  const photosOk = HDFC_PHOTO_NEED.every((id) => slots.has(id))
  if (!photosOk) missing.push('14. Site Photos & Documents')

  const alreadySent =
    sv.status === 'Completed' || sv.status === 'HodApproved' || sv.status === 'Approved'
  const finalOk = alreadySent || form.page15Reviewed === 'Yes' || filled(sv.hodSuggestions)
  if (!finalOk) missing.push('15. Final Report with suggestions')

  const done = HDFC_PAGE_TOTAL - missing.length
  return {
    done,
    total: HDFC_PAGE_TOTAL,
    missing,
    label: `${done} / ${HDFC_PAGE_TOTAL}`,
    complete: missing.length === 0,
  }
}

export function hdfcPagesIncompleteMessage(sv: HdfcPageProgressInput): string {
  const p = hdfcPagesProgress(sv)
  if (p.complete) return ''
  return (
    `Please complete all 15 pages before sending to HOD.\n\n` +
    `Pages completed: ${p.label}\n` +
    `Still pending:\n• ${p.missing.join('\n• ')}`
  )
}

/** Browser helper used on public + HOD/Management SSA screens. */
export function hdfcPagesProgressClientJs(): string {
  return `
var HDFC_PAGE_TOTAL=${HDFC_PAGE_TOTAL};
var HDFC_PHOTO_NEED=${JSON.stringify(HDFC_PHOTO_NEED)};
var HDFC_SCORE_IDS=${JSON.stringify(scoreIds())};
var HDFC_FORM_PAGES=${JSON.stringify(FORM_PAGES)};
function hdfcFilled(v){return String(v==null?'':v).trim().length>0;}
function hdfcFaValidityOk(form){
  try{
    var arr=JSON.parse((form&&form.facilityAttendantsJson)||'[]');
    if(!arr||!arr.length)return false;
    var need=1,s=String((form&&form.sanctionedGuards)||'');
    if(s==='2FA')need=2;
    if(s==='3FA')need=3;
    var n=0;
    arr.forEach(function(x){if(x&&hdfcFilled(x.name)&&hdfcFilled(x.idNo)&&hdfcFilled(x.idCardValidity))n++;});
    return n>=need;
  }catch(e){return false;}
}
function hdfcPagesProgress(sv){
  sv=sv||{};
  var form=sv.hdfcForm&&typeof sv.hdfcForm==='object'?sv.hdfcForm:{};
  var missing=[];
  HDFC_FORM_PAGES.forEach(function(page){
    var ok=page.keys.every(function(k){return hdfcFilled(form[k]);});
    if(page.id==='h3'&&!hdfcFaValidityOk(form))ok=false;
    if(!ok)missing.push(page.label);
  });
  var scores=sv.scores&&typeof sv.scores==='object'?sv.scores:{};
  var scoresOk=HDFC_SCORE_IDS.every(function(id){return Object.prototype.hasOwnProperty.call(scores,id);});
  if(!scoresOk)missing.push('12. Risk check list');
  if(!(hdfcFilled(sv.riskAnalysis)&&hdfcFilled(sv.executiveSummary)&&hdfcFilled(sv.securityRecommendations)))missing.push('13. Professional assessment');
  var slots={};
  (sv.photos||[]).forEach(function(p){
    if(p&&p.active!==false&&hdfcFilled(p.dataUrl)&&p.heading)slots[p.heading]=true;
  });
  var photosOk=HDFC_PHOTO_NEED.every(function(id){return !!slots[id];});
  if(!photosOk)missing.push('14. Site Photos & Documents');
  var sent=sv.status==='Completed'||sv.status==='HodApproved'||sv.status==='Approved';
  if(!(sent||form.page15Reviewed==='Yes'||hdfcFilled(sv.hodSuggestions)))missing.push('15. Final Report with suggestions');
  var done=HDFC_PAGE_TOTAL-missing.length;
  return {done:done,total:HDFC_PAGE_TOTAL,missing:missing,label:done+' / '+HDFC_PAGE_TOTAL,complete:missing.length===0};
}
function hdfcPagesIncompleteMessage(sv){
  var p=hdfcPagesProgress(sv);
  if(p.complete)return '';
  return 'Please complete all 15 pages before sending to HOD.\\n\\nPages completed: '+p.label+'\\nStill pending:\\n• '+p.missing.join('\\n• ');
}
function markHdfcPage15Reviewed(si){
  var sv=SV[si];if(!sv)return;
  if(!sv.hdfcForm)sv.hdfcForm=typeof emptyHdfcForm==='function'?emptyHdfcForm():{};
  sv.hdfcForm.page15Reviewed='Yes';
  if(typeof scheduleHdfcAutoSave==='function')scheduleHdfcAutoSave();
  else if(typeof schedulePublicAutoSave==='function')schedulePublicAutoSave();
}
`
}

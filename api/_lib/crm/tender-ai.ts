import type { CrmTender } from './store.js'

export type TenderExtractResult = {
  tenderNo: string
  tenderName: string
  clientDept: string
  location: string
  portal: string
  submissionMode: string
  bidType: string
  publishedDate: string
  prebidMeetingDate: string
  prebidMeetingVenue: string
  emdPreparationDate: string
  submissionDate: string
  bidEndDateTime: string
  bidValidityFromEnd: string
  openingDate: string
  emd: string
  emdMode: string
  tenderFee: string
  epbgPercent: string
  eligibility: string
  documentsRequired: string
  importantDates: string
  requiredManpower: string
  typeOfServices: string
  contractPeriod: string
  minTurnover3yr: string
  experienceYears: string
  estimatedBidValue: string
  evaluationMethod: string
  scoreMatrix: string
  serviceCharge: string
  l1TieBreak: string
  msePreference: string
  summary: string
  aiUsed: boolean
  wasTranslated?: boolean
  wasBilingual?: boolean
  originalLang?: string
  displayText?: string
  translationFailed?: boolean
}

export type TenderCompareChange = {
  field: string
  oldValue: string
  newValue: string
  note: string
  direction?: string
}

export type TenderCompareResult = {
  summary: string
  changes: TenderCompareChange[]
  unchanged: string[]
  recommendations: string
  aiUsed: boolean
  changeCount?: number
}

async function callLlm(system: string, user: string): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  const pplxKey = process.env.PERPLEXITY_API_KEY?.trim()
  const url = openaiKey ? 'https://api.openai.com/v1/chat/completions' : pplxKey ? 'https://api.perplexity.ai/chat/completions' : ''
  const key = openaiKey || pplxKey
  if (!url || !key) return null
  const model = openaiKey ? (process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini') : 'sonar'

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.2,
        max_tokens: 3500,
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
}

function parseJsonBlock(raw: string): Record<string, unknown> | null {
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return null
  try {
    return JSON.parse(m[0]) as Record<string, unknown>
  } catch {
    return null
  }
}

function str(v: unknown, max = 2000) {
  return String(v ?? '').trim().slice(0, max)
}

const INDIC_SCRIPT =
  /[\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F]/

function countLatinLetters(text: string): number {
  return (text.match(/[A-Za-z]/g) || []).length
}

function countIndicChars(text: string): number {
  return (text.match(new RegExp(INDIC_SCRIPT.source, 'g')) || []).length
}

function latinRatio(text: string): number {
  const chars = text.replace(/\s/g, '')
  if (!chars.length) return 0
  return countLatinLetters(text) / chars.length
}

function isMostlyEnglishLine(line: string): boolean {
  const latin = countLatinLetters(line)
  const indic = countIndicChars(line)
  if (latin < 4) return false
  if (indic > 0 && latin < indic) return false
  const lineChars = line.replace(/\s/g, '').length
  if (!lineChars) return false
  return latin / lineChars > 0.35 || (latin >= 12 && latin >= indic * 2)
}

/** Keep English lines when a tender has Hindi + English side by side. */
function extractEnglishFromBilingual(text: string): string {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const eng: string[] = []
  for (const line of lines) {
    if (isMostlyEnglishLine(line)) eng.push(line)
  }
  return eng.join('\n')
}

function detectSourceLang(text: string): string {
  if (/[\u0900-\u097F]/.test(text)) return 'hindi'
  if (/[\u0B80-\u0BFF]/.test(text)) return 'tamil'
  if (/[\u0C00-\u0C7F]/.test(text)) return 'telugu'
  if (/[\u0980-\u09FF]/.test(text)) return 'bengali'
  return 'other'
}

async function translateTenderToEnglish(text: string): Promise<string | null> {
  const system = `You are a professional translator for Indian government tender notices (Hindi, Tamil, Telugu, Bengali, etc.).
Translate the COMPLETE tender notice into clear English.
Keep all numbers, dates, amounts (Rs/INR/₹), tender IDs, organisation names, and addresses exactly as stated.
Preserve paragraph breaks with blank lines.
Output ONLY the English translation — no preamble or notes.`
  return await callLlm(system, text.slice(0, 14000))
}

export async function prepareTenderWorkingText(rawText: string): Promise<{
  text: string
  wasTranslated: boolean
  wasBilingual: boolean
  originalLang: string
  translationFailed: boolean
}> {
  const raw = String(rawText ?? '').trim()
  if (raw.length < 40) {
    return { text: raw, wasTranslated: false, wasBilingual: false, originalLang: 'en', translationFailed: false }
  }

  const indic = countIndicChars(raw)
  const latin = countLatinLetters(raw)
  const lang = detectSourceLang(raw)

  const engOnly = extractEnglishFromBilingual(raw)
  const engLooksComplete =
    engOnly.length > 400 &&
    indic > 50 &&
    latinRatio(engOnly) > 0.35 &&
    engOnly.length >= raw.length * 0.2

  if (engLooksComplete) {
    return {
      text: engOnly.slice(0, 50000),
      wasTranslated: false,
      wasBilingual: true,
      originalLang: lang,
      translationFailed: false,
    }
  }

  const primarilyEnglish = indic < 25 || (latin > indic * 2 && latinRatio(raw) > 0.15)
  if (primarilyEnglish) {
    return { text: raw.slice(0, 50000), wasTranslated: false, wasBilingual: false, originalLang: 'en', translationFailed: false }
  }

  const translated = await translateTenderToEnglish(raw)
  if (translated && translated.length > 40) {
    return {
      text: translated.slice(0, 50000),
      wasTranslated: true,
      wasBilingual: false,
      originalLang: lang,
      translationFailed: false,
    }
  }

  return {
    text: raw.slice(0, 50000),
    wasTranslated: false,
    wasBilingual: false,
    originalLang: lang,
    translationFailed: indic > 25,
  }
}

function findDateNear(text: string, keywords: RegExp): string {
  const lines = text.split(/\n+/)
  for (const line of lines) {
    if (!keywords.test(line)) continue
    const dm = line.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/)
    if (dm) {
      const y = dm[3].length === 2 ? `20${dm[3]}` : dm[3]
      return `${y}-${dm[2].padStart(2, '0')}-${dm[1].padStart(2, '0')}`
    }
    const iso = line.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  }
  return ''
}

/** Match Agile tender format labels (label on one line, value on next or after colon). */
function extractByLabel(text: string, labels: string[], maxLen = 200): string {
  const lines = text.replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const label of labels) {
      const re = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[:\\-–]?\\s*(.+)$`, 'i')
      const inline = line.match(re)
      if (inline?.[1]?.trim()) return inline[1].trim().slice(0, maxLen)
      if (new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i').test(line)) {
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const next = lines[j]
          if (
            next &&
            isMostlyEnglishLine(next) &&
            !/^(tender|bid|organisation|organization|type|location|contract|minimum|years|estimated|evaluation|emd|epbg|score|service|total|mse|pre-bid)/i.test(
              next,
            )
          ) {
            return next.slice(0, maxLen)
          }
        }
      }
    }
  }
  return ''
}

function findMoney(text: string, keywords: RegExp): string {
  const m = text.match(
    new RegExp(`(?:${keywords.source})[^\\n₹]{0,40}(?:Rs\\.?|INR|₹)\\s*([\\d,]+(?:\\.\\d+)?)`, 'i'),
  )
  if (m) return m[1].replace(/,/g, '')
  const m2 = text.match(new RegExp(`(?:${keywords.source})[^\\n]{0,30}([\\d,]+(?:\\.\\d+)?)\\s*(?:lakh|lac|crore)`, 'i'))
  if (m2) return m2[1].replace(/,/g, '')
  return ''
}

function ruleExtract(text: string): TenderExtractResult {
  const t = text.replace(/\r/g, '')
  const lower = t.toLowerCase()

  let submissionMode = 'Unknown'
  if (/online|e-?procurement|gem\.gov|nic\.in|portal|electronic\s+submission/i.test(t)) submissionMode = 'Online'
  if (/offline|physical\s+submission|sealed\s+(cover|envelope)|by\s+hand/i.test(t)) {
    submissionMode = submissionMode === 'Online' ? 'Hybrid' : 'Offline'
  }

  let bidType = 'Unknown'
  if (/two\s*(?:stage|bid|cover)|technical\s+bid.*financial|financial\s+bid.*technical/i.test(t)) {
    bidType = 'Two-Bid (Technical + Financial)'
  } else if (/single\s*bid|single\s*stage|combined\s*bid/i.test(t)) {
    bidType = 'Single Bid'
  }

  let portal = ''
  if (/gem\.gov/i.test(t)) portal = 'GeM'
  else if (/eprocurement|e-procurement/i.test(t)) portal = 'eProcurement'
  else if (/nic\.in/i.test(t)) portal = 'NIC / eProcurement'
  else if (/cppp|central public procurement/i.test(t)) portal = 'CPPP'
  else {
    const pm = t.match(/(?:portal|website)\s*[:\-]\s*([^\n]{4,80})/i)
    if (pm) portal = pm[1].trim()
  }

  const tenderFee = findMoney(t, /tender\s+fee|document\s+fee|processing\s+fee/i)

  let emdMode = ''
  if (/emd.*(?:dd|demand\s+draft|bank\s+guarantee|bg|online\s+payment|neft|rtgs)/i.test(t)) {
    const mm = t.match(/EMD[^\n]{0,120}/i)
    if (mm) emdMode = mm[0].trim().slice(0, 200)
  }

  const emd =
    extractByLabel(t, ['EMD Amount', 'EMD']) ||
    findMoney(t, /EMD|earnest\s+money|bid\s+security|earnest\s+money\s+deposit/i)

  const publishedDate = findDateNear(t, /publish|nit|notice\s+inviting|date\s+of\s+issue/i)
  const prebidMeetingDate =
    extractByLabel(t, ['Pre-Bid meeting date & Time', 'Pre-Bid Meeting Date', 'Prebid Meeting Date']) ||
    findDateNear(t, /pre[\s-]?bid|pre\s+bid\s+meeting|clarification/i)
  const submissionDate = findDateNear(t, /last\s+date|submission|bid\s+submission|due\s+date/i)
  const openingDate = findDateNear(t, /opening\s+of\s+bid|bid\s+opening|technical\s+opening/i)
  const emdPreparationDate = findDateNear(t, /emd\s+(?:last|due|submission)|obtain\s+emd/i)

  let eligibility = ''
  const elIdx = lower.search(/eligibility|pre-?qualification|qualification\s+criteria/)
  if (elIdx >= 0) eligibility = t.slice(elIdx, elIdx + 1200).split(/\n\n/)[0].trim()

  let documentsRequired = ''
  const docIdx = lower.search(/documents?\s+(?:to\s+be\s+)?(?:attached|submitted|enclosed)|list\s+of\s+documents/)
  if (docIdx >= 0) documentsRequired = t.slice(docIdx, docIdx + 1500).split(/\n\n/)[0].trim()

  const dateLines: string[] = []
  for (const line of t.split('\n').slice(0, 200)) {
    if (/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/.test(line) && /date|last|opening|pre|emd|meeting|submission/i.test(line)) {
      dateLines.push(line.trim().slice(0, 120))
    }
  }

  const tenderNo =
    extractByLabel(t, ['Tender No', 'Tender Number', 'Tender ID']) ||
    (t.match(/tender\s*(?:no|number|id)\s*[:\-#]?\s*([A-Za-z0-9/_\-.]{3,40})/i) || [])[1] ||
    ''
  const clientDept =
    extractByLabel(t, ['Organisation Name', 'Organization Name', 'Organisation', 'Department', 'Client']) ||
    (t.match(/(?:organisation|organization|department|authority|client)\s*[:\-]\s*([^\n]{4,120})/i) || [])[1]?.trim() ||
    ''
  const location =
    extractByLabel(t, ['Location', 'Place of Work', 'Site Location']) ||
    (t.match(/location\s*[:\-]\s*([^\n]{3,200})/i) || [])[1]?.trim() ||
    ''
  const typeOfServices =
    extractByLabel(t, ['Type of Service', 'Type of Services', 'Nature of Service']) ||
    (/(manned\s+guarding|security\s+services|security\s+agency|facility\s+management|housekeeping)/i.test(t)
      ? (t.match(/(manned\s+guarding[^.\n]{0,40}|security\s+services[^.\n]{0,40})/i) || [])[1] || 'Manned Guarding / Security'
      : '')
  const contractPeriod =
    extractByLabel(t, ['Contract Period']) || (t.match(/contract\s+period\s*[:\-]\s*([^\n]{3,80})/i) || [])[1]?.trim() || ''
  const minTurnover3yr =
    extractByLabel(t, [
      'Min Turnover Condition',
      'Minimum Average Annual Turnover of the bidder (For 3 Years)',
      'Minimum Average Annual Turnover',
      'Min Turnover',
      'Minimum turnover condition',
    ]) || (t.match(/(?:minimum\s+)?(?:average\s+)?annual\s+turnover[^\n]{0,40}[:\-]?\s*([^\n]{3,80})/i) || [])[1]?.trim() || ''
  const experienceYears =
    extractByLabel(t, [
      'Years of Past Experience Required for the same/similar service',
      'Years of Past Experience Required',
      'Experience Required',
    ]) || (t.match(/(?:years?\s+of\s+)?(?:past\s+)?experience[^\n]{0,40}[:\-]?\s*([^\n]{3,60})/i) || [])[1]?.trim() || ''
  const estimatedBidValue =
    extractByLabel(t, [
      'Estimated Bid Value',
      'Approximate value of work',
      'Estimated cost of work',
      'Value of Work',
      'Estimated Cost',
    ]) ||
    findMoney(t, /estimated\s+bid\s+value|approximate\s+(?:value|cost)|estimated\s+cost\s+of\s+work|value\s+of\s+work/i) ||
    (t.match(/(?:estimated\s+bid\s+value|approximate\s+value)[^\n]{0,40}[:\-]?\s*([^\n]{3,120})/i) || [])[1]?.trim() ||
    ''
  const evaluationMethod =
    extractByLabel(t, ['Evaluation Method']) || (t.match(/evaluation\s+method\s*[:\-]\s*([^\n]{3,120})/i) || [])[1]?.trim() || ''
  const epbgPercent =
    extractByLabel(t, ['ePBG Percentage (%)', 'ePBG Percentage', 'EPBG %', 'PBG Percentage']) ||
    (t.match(/e?pbg\s*(?:percentage|%)?\s*[:\-]?\s*([\d.]+%?)/i) || [])[1] ||
    ''
  const scoreMatrix =
    extractByLabel(t, ['Score Matrix']) || (t.match(/score\s+matrix\s*[:\-]?\s*([^\n]{3,120})/i) || [])[1]?.trim() || ''
  const serviceCharge =
    extractByLabel(t, ['Service Charge']) || (t.match(/service\s+charge\s*[:\-]?\s*([^\n]{3,80})/i) || [])[1]?.trim() || ''
  const l1TieBreak =
    extractByLabel(t, ['In Case of L1 Tie Break', 'L1 Tie Break']) ||
    (t.match(/l1\s+tie\s*break\s*[:\-]?\s*([^\n]{3,120})/i) || [])[1]?.trim() ||
    ''
  const msePreference =
    extractByLabel(t, ['MSE Purchase Preference', 'MSE Preference']) ||
    (t.match(/mse\s+purchase\s+preference\s*[:\-]?\s*([^\n]{3,120})/i) || [])[1]?.trim() ||
    ''
  const prebidMeetingVenue =
    extractByLabel(t, ['Pre-Bid meeting Venue', 'Pre-Bid Meeting Venue', 'Prebid Meeting Venue']) ||
    (t.match(/pre[\s-]?bid\s+meeting\s+venue\s*[:\-]?\s*([^\n]{3,200})/i) || [])[1]?.trim() ||
    ''
  const bidValidityFromEnd =
    extractByLabel(t, ['Bid Offer Validity (From End Date)', 'Bid Offer Validity', 'Bid Validity']) ||
    (t.match(/bid\s+offer\s+validity[^\n]{0,40}[:\-]?\s*([^\n]{3,80})/i) || [])[1]?.trim() ||
    ''
  const bidEndDateTime =
    extractByLabel(t, ['Bid End Date/Time', 'Bid End Date', 'Last Date / Time']) ||
    (t.match(/bid\s+end\s+date[^\n]{0,80}/i) || [])[0]?.trim().slice(0, 80) ||
    ''

  let tenderName = ''
  const nm = t.match(/(?:tender\s+for|name\s+of\s+work|description\s+of\s+work)\s*[:\-]\s*([^\n]{8,200})/i)
  if (nm) tenderName = nm[1].trim()
  if (!tenderName && typeOfServices && clientDept) tenderName = typeOfServices + ' — ' + clientDept

  const requiredManpower =
    extractByLabel(t, ['Total Manpower', 'Manpower Required', 'Required Manpower']) ||
    (t.match(/(\d+)\s*(?:nos\.?|numbers?|guards?|personnel|manpower|security\s+staff)/i) || [])[1] ||
    ''
  const bidEndFinal = bidEndDateTime || submissionDate

  const summary = [
    portal ? `Portal: ${portal}` : '',
    submissionMode !== 'Unknown' ? `Submission: ${submissionMode}` : '',
    bidType !== 'Unknown' ? `Bid type: ${bidType}` : '',
    submissionDate ? `Last date: ${submissionDate}` : '',
    emd ? `EMD: ₹${emd}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return {
    tenderNo,
    tenderName,
    clientDept,
    location,
    portal,
    submissionMode,
    bidType,
    publishedDate,
    prebidMeetingDate,
    prebidMeetingVenue,
    emdPreparationDate,
    submissionDate,
    bidEndDateTime: bidEndFinal,
    bidValidityFromEnd,
    openingDate,
    emd,
    emdMode,
    tenderFee,
    epbgPercent,
    eligibility: eligibility.slice(0, 2000),
    documentsRequired: documentsRequired.slice(0, 2000),
    importantDates: dateLines.slice(0, 12).join('\n'),
    requiredManpower,
    typeOfServices,
    contractPeriod,
    minTurnover3yr,
    experienceYears,
    estimatedBidValue,
    evaluationMethod,
    scoreMatrix,
    serviceCharge,
    l1TieBreak,
    msePreference,
    summary: summary || 'Key fields extracted — please review dates and EMD.',
    aiUsed: false,
  }
}

export async function extractTenderNotice(rawText: string): Promise<TenderExtractResult> {
  const raw = String(rawText ?? '').trim()
  if (raw.length < 40) {
    return {
      ...ruleExtract(''),
      summary: 'Paste more text from the tender notice (at least a few paragraphs).',
      aiUsed: false,
      wasTranslated: false,
      wasBilingual: false,
      originalLang: 'en',
      displayText: '',
      translationFailed: false,
    }
  }

  const prep = await prepareTenderWorkingText(raw)
  const text = prep.text
  const langNote = prep.wasTranslated
    ? ' (translated to English)'
    : prep.wasBilingual
      ? ' (English lines from bilingual document)'
      : prep.translationFailed
        ? ' (Hindi/local language detected — translation unavailable)'
        : ''

  const fallback = ruleExtract(text)
  const system = `You are an expert Indian government & private tender analyst for Agile Security Force Pvt Ltd (security services).
Read the tender notice and return ONLY valid JSON (no markdown) with these keys:
tenderNo, tenderName, clientDept (organisation name), location, portal, submissionMode (Online|Offline|Hybrid|Unknown), bidType (Single Bid|Two-Bid (Technical + Financial)|Unknown),
publishedDate, prebidMeetingDate, prebidMeetingVenue, emdPreparationDate, submissionDate, bidEndDateTime, bidValidityFromEnd, openingDate (YYYY-MM-DD or empty),
emd, emdMode, tenderFee, epbgPercent, eligibility, documentsRequired, importantDates (newline-separated list), requiredManpower (total manpower),
typeOfServices, contractPeriod, minTurnover3yr (minimum turnover condition), experienceYears, estimatedBidValue, evaluationMethod, scoreMatrix, serviceCharge, l1TieBreak, msePreference, summary (2-3 sentences).
Use Indian tender conventions. If not found, use empty string.
The text is already in English. If it was translated from Hindi or another language, extract from the English meaning.`

  const llm = await callLlm(system, text.slice(0, 14000))
  if (!llm) {
    return {
      ...fallback,
      summary: fallback.summary + langNote,
      wasTranslated: prep.wasTranslated,
      wasBilingual: prep.wasBilingual,
      originalLang: prep.originalLang,
      displayText: text,
      translationFailed: prep.translationFailed,
    }
  }

  const j = parseJsonBlock(llm)
  if (!j) {
    return {
      ...fallback,
      summary: fallback.summary + ' (AI parse failed — rule-based fields shown.)' + langNote,
      wasTranslated: prep.wasTranslated,
      wasBilingual: prep.wasBilingual,
      originalLang: prep.originalLang,
      displayText: text,
      translationFailed: prep.translationFailed,
    }
  }

  return {
    tenderNo: str(j.tenderNo, 80) || fallback.tenderNo,
    tenderName: str(j.tenderName, 200) || fallback.tenderName,
    clientDept: str(j.clientDept, 200) || fallback.clientDept,
    location: str(j.location, 200) || fallback.location,
    portal: str(j.portal, 120) || fallback.portal,
    submissionMode: str(j.submissionMode, 40) || fallback.submissionMode,
    bidType: str(j.bidType, 80) || fallback.bidType,
    publishedDate: str(j.publishedDate, 20) || fallback.publishedDate,
    prebidMeetingDate: str(j.prebidMeetingDate, 40) || fallback.prebidMeetingDate,
    prebidMeetingVenue: str(j.prebidMeetingVenue, 200) || fallback.prebidMeetingVenue,
    emdPreparationDate: str(j.emdPreparationDate, 20) || fallback.emdPreparationDate,
    submissionDate: str(j.submissionDate, 20) || fallback.submissionDate,
    bidEndDateTime: str(j.bidEndDateTime, 40) || fallback.bidEndDateTime,
    bidValidityFromEnd: str(j.bidValidityFromEnd, 80) || fallback.bidValidityFromEnd,
    openingDate: str(j.openingDate, 20) || fallback.openingDate,
    emd: str(j.emd, 40) || fallback.emd,
    emdMode: str(j.emdMode, 200) || fallback.emdMode,
    tenderFee: str(j.tenderFee, 40) || fallback.tenderFee,
    epbgPercent: str(j.epbgPercent, 20) || fallback.epbgPercent,
    eligibility: str(j.eligibility, 2000) || fallback.eligibility,
    documentsRequired: str(j.documentsRequired, 2000) || fallback.documentsRequired,
    importantDates: str(j.importantDates, 2000) || fallback.importantDates,
    requiredManpower: str(j.requiredManpower, 80) || fallback.requiredManpower,
    typeOfServices: str(j.typeOfServices, 200) || fallback.typeOfServices,
    contractPeriod: str(j.contractPeriod, 120) || fallback.contractPeriod,
    minTurnover3yr: str(j.minTurnover3yr, 80) || fallback.minTurnover3yr,
    experienceYears: str(j.experienceYears, 40) || fallback.experienceYears,
    estimatedBidValue: str(j.estimatedBidValue, 60) || fallback.estimatedBidValue,
    evaluationMethod: str(j.evaluationMethod, 120) || fallback.evaluationMethod,
    scoreMatrix: str(j.scoreMatrix, 200) || fallback.scoreMatrix,
    serviceCharge: str(j.serviceCharge, 80) || fallback.serviceCharge,
    l1TieBreak: str(j.l1TieBreak, 200) || fallback.l1TieBreak,
    msePreference: str(j.msePreference, 120) || fallback.msePreference,
    summary: (str(j.summary, 800) || fallback.summary) + langNote,
    aiUsed: true,
    wasTranslated: prep.wasTranslated,
    wasBilingual: prep.wasBilingual,
    originalLang: prep.originalLang,
    displayText: text,
    translationFailed: prep.translationFailed,
  }
}

/** Build readable text from a stored tender record for comparison. */
export function tenderRecordToText(t: CrmTender, label = 'Tender record'): string {
  const l1 = (t.bidders || []).find((b) => b.rank === 'L1')
  return [
    `${label}`,
    `Tender: ${t.tenderName}`,
    `Client / Dept: ${t.clientDept}`,
    `Location: ${t.location} | State: ${t.state}`,
    `Portal: ${t.portal}`,
    `Services: ${t.typeOfServices}`,
    `Manpower: ${t.requiredManpower}`,
    `Published: ${t.publishedDate}`,
    `Pre-bid: ${t.prebidMeetingDate}`,
    `EMD obtain by: ${t.emdPreparationDate}`,
    `Submission / Last date: ${t.submissionDate}`,
    `EMD: ${t.emd}`,
    `Tender fee: ${t.tenderFee}`,
    `Our quote: ${t.ourQuote} | Position: ${t.ourPosition}`,
    `Awarded: ${t.contractAwardedDate} to ${t.awardedTo || l1?.name || ''}`,
    `Award rate: ${t.contractAwardedRate}`,
    `L1: ${l1?.name || ''} @ ${l1?.quote || ''}`,
    `Bidders: ${(t.bidders || []).map((b) => `${b.rank} ${b.name} ${b.quote}`).join('; ')}`,
    `Allotment: ${t.allotmentDetails}`,
    `Remarks: ${t.remarks}`,
    t.tenderExtract?.eligibility ? `Eligibility (extracted): ${t.tenderExtract.eligibility}` : '',
    t.tenderExtract?.documentsRequired ? `Documents (extracted): ${t.tenderExtract.documentsRequired}` : '',
    t.tenderExtract?.submissionMode ? `Submission: ${t.tenderExtract.submissionMode}` : '',
    t.tenderExtract?.bidType ? `Bid type: ${t.tenderExtract.bidType}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function parseComparableNumber(s: string): number | null {
  const t = String(s ?? '').trim()
  if (!t) return null
  const clean = t.replace(/,/g, '')
  const m = clean.match(/(\d+(?:\.\d+)?)/)
  if (!m) return null
  let n = parseFloat(m[1])
  if (/crore|\bcr\b/i.test(clean)) n *= 1e7
  else if (/lakh|lac/i.test(clean)) n *= 1e5
  return Number.isFinite(n) ? n : null
}

function parseComparableDate(s: string): number | null {
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return Date.UTC(+iso[1], +iso[2] - 1, +iso[3])
  const dm = s.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/)
  if (dm) {
    const y = dm[3].length === 2 ? 2000 + +dm[3] : +dm[3]
    return Date.UTC(y, +dm[2] - 1, +dm[1])
  }
  return null
}

const COMPARE_FIELDS: { key: keyof TenderExtractResult; label: string }[] = [
  { key: 'clientDept', label: 'Organisation Name' },
  { key: 'tenderNo', label: 'Tender No' },
  { key: 'minTurnover3yr', label: 'Min Turnover Condition' },
  { key: 'requiredManpower', label: 'Total Manpower' },
  { key: 'estimatedBidValue', label: 'Estimated Bid Value' },
  { key: 'emd', label: 'EMD Amount' },
  { key: 'epbgPercent', label: 'ePBG %' },
  { key: 'tenderFee', label: 'Tender Fee' },
  { key: 'contractPeriod', label: 'Contract Period' },
  { key: 'experienceYears', label: 'Experience Required' },
  { key: 'typeOfServices', label: 'Type of Service' },
  { key: 'location', label: 'Location' },
  { key: 'evaluationMethod', label: 'Evaluation Method' },
  { key: 'scoreMatrix', label: 'Score Matrix' },
  { key: 'serviceCharge', label: 'Service Charge' },
  { key: 'msePreference', label: 'MSE Preference' },
  { key: 'publishedDate', label: 'Published Date' },
  { key: 'prebidMeetingDate', label: 'Pre-Bid Date & Time' },
  { key: 'prebidMeetingVenue', label: 'Pre-Bid Venue' },
  { key: 'emdPreparationDate', label: 'EMD Preparation Date' },
  { key: 'submissionDate', label: 'Submission / Last Date' },
  { key: 'bidEndDateTime', label: 'Bid End Date/Time' },
  { key: 'bidValidityFromEnd', label: 'Bid Validity' },
  { key: 'openingDate', label: 'Bid Opening Date' },
  { key: 'submissionMode', label: 'Submission Mode' },
  { key: 'bidType', label: 'Bid Type' },
]

function inferChangeDirection(
  oldVal: string,
  newVal: string,
  key: string,
): 'increased' | 'decreased' | 'extended' | 'shortened' | 'added' | 'removed' | 'changed' {
  if (!oldVal && newVal) return 'added'
  if (oldVal && !newVal) return 'removed'
  const od = parseComparableDate(oldVal)
  const nd = parseComparableDate(newVal)
  if (od != null && nd != null) {
    if (nd > od) return 'extended'
    if (nd < od) return 'shortened'
    return 'changed'
  }
  const on = parseComparableNumber(oldVal)
  const nn = parseComparableNumber(newVal)
  if (on != null && nn != null) {
    if (nn > on) return 'increased'
    if (nn < on) return 'decreased'
  }
  return 'changed'
}

function buildChangeNote(
  label: string,
  dir: 'increased' | 'decreased' | 'extended' | 'shortened' | 'added' | 'removed' | 'changed',
): string {
  const notes: Record<typeof dir, string> = {
    increased: `${label} increased in new tender`,
    decreased: `${label} reduced in new tender`,
    extended: `${label} extended / later in new tender`,
    shortened: `${label} brought forward / earlier in new tender`,
    added: `${label} newly added in new tender`,
    removed: `${label} removed in new tender`,
    changed: `${label} changed in new tender`,
  }
  return notes[dir]
}

function structuredFieldCompare(oldText: string, newText: string): TenderCompareChange[] {
  const oldEx = ruleExtract(oldText)
  const newEx = ruleExtract(newText)
  const changes: TenderCompareChange[] = []
  for (const f of COMPARE_FIELDS) {
    const o = str(oldEx[f.key], 500)
    const n = str(newEx[f.key], 500)
    if (!o && !n) continue
    if (o.toLowerCase() === n.toLowerCase()) continue
    const dir = inferChangeDirection(o, n, f.key)
    changes.push({
      field: f.label,
      oldValue: o || '—',
      newValue: n || '—',
      note: buildChangeNote(f.label, dir),
      direction: dir,
    })
  }
  return changes
}

function structuredUnchangedFields(oldText: string, newText: string): string[] {
  const oldEx = ruleExtract(oldText)
  const newEx = ruleExtract(newText)
  const same: string[] = []
  for (const f of COMPARE_FIELDS) {
    const o = str(oldEx[f.key], 500)
    const n = str(newEx[f.key], 500)
    if (o && n && o.toLowerCase() === n.toLowerCase()) same.push(f.label)
  }
  return same
}

function buildCompareRecommendations(changes: TenderCompareChange[]): string {
  if (!changes.length) return 'Documents appear aligned on key fields — still review eligibility and document checklist before bidding.'
  const tips: string[] = []
  if (changes.some((c) => /turnover|emd|fee|experience/i.test(c.field))) {
    tips.push('Check financial eligibility (turnover, EMD, fees) and update bid strategy.')
  }
  if (changes.some((c) => /manpower/i.test(c.field))) {
    tips.push('Revise deployment chart and costing for manpower change.')
  }
  if (changes.some((c) => /date|submission|pre-bid|validity/i.test(c.field))) {
    tips.push('Update CRM dates and set reminders for new deadlines immediately.')
  }
  if (changes.some((c) => /evaluation|score|service charge/i.test(c.field))) {
    tips.push('Review technical/financial scoring and service charge impact on quote.')
  }
  if (!tips.length) tips.push('Brief Tender Cell and update the CRM tender record before bid preparation.')
  return tips.join(' ')
}

function mergeCompareChanges(primary: TenderCompareChange[], extra: TenderCompareChange[]): TenderCompareChange[] {
  const map = new Map<string, TenderCompareChange>()
  for (const c of primary) map.set(c.field.toLowerCase(), c)
  for (const c of extra) {
    const k = c.field.toLowerCase()
    if (!map.has(k)) map.set(k, c)
    else {
      const cur = map.get(k)!
      if ((c.note?.length || 0) > (cur.note?.length || 0)) map.set(k, { ...cur, note: c.note, direction: c.direction || cur.direction })
    }
  }
  return [...map.values()]
}

function ruleCompare(oldText: string, newText: string): TenderCompareResult {
  const pick = (text: string, re: RegExp) => {
    const m = text.match(re)
    return m ? m[0].replace(/^[^:]*:\s*/i, '').trim().slice(0, 200) : ''
  }
  const fields: { field: string; oldRe: RegExp; newRe: RegExp }[] = [
    { field: 'EMD', oldRe: /EMD[^\n]{0,80}/i, newRe: /EMD[^\n]{0,80}/i },
    { field: 'Last submission date', oldRe: /(?:last date|submission)[^\n]{0,60}/i, newRe: /(?:last date|submission)[^\n]{0,60}/i },
    { field: 'Pre-bid meeting', oldRe: /pre[\s-]?bid[^\n]{0,60}/i, newRe: /pre[\s-]?bid[^\n]{0,60}/i },
    { field: 'Manpower', oldRe: /\d+\s*(?:guards?|manpower|personnel)/i, newRe: /\d+\s*(?:guards?|manpower|personnel)/i },
  ]
  const changes: TenderCompareChange[] = []
  const unchanged: string[] = []
  for (const f of fields) {
    const o = pick(oldText, f.oldRe)
    const n = pick(newText, f.newRe)
    if (!o && !n) continue
    if (o && n && o.toLowerCase() === n.toLowerCase()) unchanged.push(f.field)
    else if (o !== n) changes.push({ field: f.field, oldValue: o || '—', newValue: n || '—', note: o && n ? 'Changed' : 'New or removed' })
  }
  return {
    summary: changes.length
      ? `${changes.length} difference(s) found between old and new tender text.`
      : 'No major differences detected in key fields — please review full text.',
    changes,
    unchanged,
    recommendations: changes.some((c) => c.field.includes('EMD') || c.field.includes('date'))
      ? 'Check EMD and submission dates immediately. Update CRM tender record and set reminders.'
      : 'Review eligibility and document list before bid preparation.',
    aiUsed: false,
  }
}

export async function compareTenderDocuments(
  oldText: string,
  newText: string,
  labelA = 'Previous tender / agreement',
  labelB = 'New tender notice',
): Promise<TenderCompareResult> {
  const a = String(oldText ?? '').trim().slice(0, 25000)
  const b = String(newText ?? '').trim().slice(0, 25000)
  if (a.length < 30 || b.length < 30) {
    return {
      summary: 'Need more text in both old and new documents to compare.',
      changes: [],
      unchanged: [],
      recommendations: 'Paste or upload both documents.',
      aiUsed: false,
      changeCount: 0,
    }
  }

  const [prepOld, prepNew] = await Promise.all([prepareTenderWorkingText(a), prepareTenderWorkingText(b)])
  const oldEng = prepOld.text
  const newEng = prepNew.text
  const langNote =
    prepOld.wasTranslated || prepNew.wasTranslated
      ? ' Documents were read in English (translated where needed).'
      : ''

  const structured = structuredFieldCompare(oldEng, newEng)
  const unchanged = structuredUnchangedFields(oldEng, newEng)
  const fallback: TenderCompareResult = {
    summary: structured.length
      ? `Found ${structured.length} difference(s) between old and new tender.${langNote}`
      : `No major field differences detected between old and new tender.${langNote} Please still review eligibility and documents.`,
    changes: structured,
    unchanged,
    recommendations: buildCompareRecommendations(structured),
    aiUsed: false,
    changeCount: structured.length,
  }

  const system = `You are a tender analyst for Agile Security Force Pvt Ltd (security services).
Compare OLD vs NEW tender/agreement text. Return ONLY valid JSON:
{
  "summary": "2-4 sentence executive summary in plain English for directors",
  "changes": [{"field":"field name","oldValue":"old","newValue":"new","note":"plain English e.g. Turnover limit increased in new tender","direction":"increased|decreased|extended|shortened|added|removed|changed"}],
  "unchanged": ["fields still the same"],
  "recommendations": "numbered action points for bid team"
}
Read BOTH documents carefully. For EVERY real difference, state clearly if something INCREASED, REDUCED, EXTENDED, SHORTENED, ADDED or REMOVED.
Priority fields: Min Turnover, Total Manpower, EMD, Tender Fee, ePBG, Contract Period, Experience, Estimated Bid Value, dates (pre-bid, submission, bid end), evaluation method, score matrix, eligibility, documents required, submission mode, bid type.
Examples of good notes: "Turnover limit increased in new tender", "Manpower reduced from 45 to 38 guards", "Submission date extended by 7 days".`

  const user = `=== ${labelA} (OLD) ===\n${oldEng.slice(0, 10000)}\n\n=== ${labelB} (NEW) ===\n${newEng.slice(0, 10000)}`
  const llm = await callLlm(system, user)
  if (!llm) return fallback

  const j = parseJsonBlock(llm)
  if (!j) return { ...fallback, summary: fallback.summary + ' (AI unavailable for full narrative.)' }

  const aiChanges = Array.isArray(j.changes)
    ? j.changes.slice(0, 30).map((c) => {
        const row = c as Record<string, unknown>
        const field = str(row.field, 80) || 'Item'
        const oldValue = str(row.oldValue, 500)
        const newValue = str(row.newValue, 500)
        const direction = str(row.direction, 20) || inferChangeDirection(oldValue, newValue, field)
        return {
          field,
          oldValue,
          newValue,
          note: str(row.note, 300) || buildChangeNote(field, direction as ReturnType<typeof inferChangeDirection>),
          direction,
        }
      })
    : []

  const changes = mergeCompareChanges(structured, aiChanges)

  return {
    summary: str(j.summary, 1200) || fallback.summary,
    changes,
    unchanged: Array.isArray(j.unchanged)
      ? [...new Set([...unchanged, ...j.unchanged.map((x) => str(x, 80)).filter(Boolean)])].slice(0, 25)
      : unchanged,
    recommendations: str(j.recommendations, 1200) || fallback.recommendations,
    aiUsed: true,
    changeCount: changes.length,
  }
}

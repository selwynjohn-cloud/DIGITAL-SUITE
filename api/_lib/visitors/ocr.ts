/**
 * Clean photo-to-text from Aadhaar / Driving Licence.
 * Never keep a full Aadhaar number or licence number in stored text.
 */
import { redactSensitiveDigits } from './store.js'

const NAME_LINE =
  /(?:name|naam)\s*[:\-]?\s*([A-Za-z][A-Za-z .']{2,60})/i

export function parseIdOcr(raw: string): { ocrName: string; ocrText: string } {
  const cleaned = redactSensitiveDigits(String(raw || '').replace(/\s+/g, ' '), 800)
  const named = cleaned.match(NAME_LINE)
  let ocrName = named?.[1]?.trim() || ''
  if (!ocrName) {
    const words = cleaned
      .split(/[^A-Za-z]+/)
      .filter((w) => w.length > 2 && !/^(india|government|licence|license|driving|aadhaar|uidai|male|female|dob)$/i.test(w))
    if (words.length >= 2) ocrName = `${words[0]} ${words[1]}`.slice(0, 80)
  }
  return { ocrName: redactSensitiveDigits(ocrName, 80), ocrText: cleaned }
}

export function isLikelyVisitingCardText(raw: string): boolean {
  const t = String(raw || '').toLowerCase()
  const hasPhotoHint = /aadhaar|uidai|driving|licence|license|emp id|employee|staff id|photo/i.test(t)
  const looksCard = /director|sales|mobile|email|www\.|@/.test(t) && !hasPhotoHint
  return looksCard
}

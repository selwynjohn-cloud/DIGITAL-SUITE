/**
 * Company chat filter — block strike / stop-work / unlawful calls.
 * Duty talk (late, shortage, site, uniform) must still go through.
 */

const STRIKE_PATTERNS: { re: RegExp; hit: string }[] = [
  { re: /\bstrike\b/i, hit: 'strike' },
  { re: /\bbandh\b/i, hit: 'bandh' },
  { re: /\bhartal\b/i, hit: 'hartal' },
  { re: /\bgherao\b/i, hit: 'gherao' },
  { re: /\bagitation\b/i, hit: 'agitation' },
  { re: /\bwalk[\s-]?out\b/i, hit: 'walk-out' },
  { re: /\bstop\s+work\b/i, hit: 'stop work' },
  { re: /\bno\s+duty\b/i, hit: 'no duty' },
  { re: /\bdon'?t\s+come\s+(to\s+)?duty\b/i, hit: "don't come to duty" },
  { re: /\bdo\s+not\s+report\b/i, hit: 'do not report' },
  { re: /\brefuse\s+(duty|work)\b/i, hit: 'refuse duty' },
  { re: /\bsabotage\b/i, hit: 'sabotage' },
  { re: /\bmass\s+(leave|absent|absentee)/i, hit: 'mass leave' },
  { re: /\bunion\s+(call|action|strike)/i, hit: 'union action' },
  { re: /\bunion\b(?!\s+bank)/i, hit: 'union' },
  { re: /\bassociation\b/i, hit: 'association' },
  { re: /\bdon'?t\s+go\s+(for\s+)?duty\b/i, hit: "don't go for duty" },
  { re: /\bdo\s+not\s+go\s+(for\s+)?duty\b/i, hit: 'do not go for duty' },
  { re: /हड़ताल/, hit: 'हड़ताल' },
  { re: /\bबंद\b/, hit: 'बंद' },
  { re: /సమ్మె/, hit: 'సమ్మె' },
]

export const LIVE_CHAT_RULE =
  'This is a company duty chat. Strike talk, stop-work calls, or unlawful messages are blocked and sent to your HOD.'

export const LIVE_CHAT_RULE_MGMT =
  "This is a company duty chat. Strike talk, stop-work calls, Union, Association, don't go for duty or unlawful messages are blocked and sent to your Management."

export const LIVE_CHAT_BLOCKED =
  'This message was not sent. Agile Live is for duty only. Strike or unlawful talk is not allowed.'

export function moderateLiveChat(raw: string): { ok: true; text: string } | { ok: false; hit: string } {
  const text = String(raw || '').replace(/\s+/g, ' ').trim()
  if (!text) return { ok: false, hit: 'empty' }
  if (text.length > 400) return { ok: false, hit: 'too-long' }
  for (const row of STRIKE_PATTERNS) {
    if (row.re.test(text)) return { ok: false, hit: row.hit }
  }
  return { ok: true, text }
}

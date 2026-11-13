import { BULLETIN_URL, JOB_LINKS } from './config.js'

/** Kept for thank-you / winner cards. Bulletin Channel + group posts are text only. */
export const CHANNEL_LOGO_URL = 'https://www.agilegroup-digital.co.in/agile-logo-wa-header.png'

export const CHANNEL_COMPANY_LINE = 'Agile Security Force Private Limited.'

/**
 * Short WhatsApp posts — must fit on one phone screen (no “Read more” / second page).
 *   msg1 = Channel (company + news + Pulse only) — no logo image
 *   msg2 = Groups (company + news + jobs + website) — no Channel URL, no tinyurl/Security-News
 *   msg3 = approval prompt
 * Do not put the old section menu, awareness essays, or Cursor attribution here.
 */
export function buildWhatsAppMessages(opts: {
  edition: string
  dateTime: string
  topHeadline: string
  bullets?: string[]
}) {
  const stamp = shortStamp(opts.edition, opts.dateTime)
  const headline = clip(opts.topHeadline, 110) || 'Today’s top security, traffic & weather updates'
  const extra = (opts.bullets ?? [])
    .map((b) => clip(b, 110))
    .filter((b) => b && !sameLine(b, headline))
    .slice(0, 2)
  const news =
    `🔴 ${headline}` + (extra.length ? `\n${extra.map((b) => `• ${b}`).join('\n')}` : '')
  const head =
    `${CHANNEL_COMPANY_LINE}\n` +
    `🚨 *SECURITY NEWS – AGILE GROUP* 🚨\n` +
    `🗓️ ${stamp.date} — ${stamp.bulletin}`

  const msg1 =
    `${head}\n` +
    `${news}\n` +
    `👉 Full bulletin: ${BULLETIN_URL}.`

  // Director rule: group blasts must not include Channel or tinyurl.com/Security-News links.
  const msg2 =
    `${head}\n` +
    `${news}\n` +
    `\nFor immediate Job Vacancies - ${JOB_LINKS.registerLabel}\n` +
    `our full range of services - www.agilegroup.co.in`

  const msg3 =
    `✅ Above is today's bulletin preview.\n` +
    `Reply OK or SEND to distribute to all groups.\n` +
    `No reply = edition skipped.`

  return { msg1, msg2, msg3 }
}

function shortStamp(edition: string, dateTime: string): { date: string; bulletin: string } {
  const date = String(dateTime || '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+—.*$/, '')
    .replace(/\s+\d{1,2}:\d{2}\s*[AP]M.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (/morning/i.test(edition)) return { date, bulletin: 'Morning Bulletin' }
  if (/afternoon/i.test(edition)) return { date, bulletin: 'Afternoon Bulletin' }
  return { date, bulletin: '10:00 PM Bulletin' }
}

function clip(s: string, max: number): string {
  const t = String(s || '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, Math.max(0, max - 1)).trim()}…`
}

function sameLine(a: string, b: string): boolean {
  const n = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')
  return Boolean(n(a)) && n(a) === n(b)
}

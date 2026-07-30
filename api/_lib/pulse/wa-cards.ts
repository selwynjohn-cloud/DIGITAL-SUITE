import {
  BRAND,
  BULLETIN_URL,
  CARD_IMAGE_URL,
  CURSOR_ATTRIBUTION,
  JOB_LINKS,
  SECURITYJOB_REGISTER_URL,
} from './config.js'
import type { QuizWinner } from './types.js'

function esc(s: string): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const DIVIDER = '━━━━━━━━━━━━━━━━━━━━━'

/** Card header — logo line + company + contest title (WhatsApp caption). */
function cardHeader(): string {
  return (
    `${DIVIDER}\n` +
    `🛡️ *${BRAND.companyName}*\n` +
    `*Question of the Day Contest*\n` +
    `${DIVIDER}`
  )
}

function cardFooter(): string {
  return (
    `${DIVIDER}\n` +
    `${CURSOR_ATTRIBUTION}\n\n` +
    `© ${new Date().getFullYear()} ${BRAND.companyName}\n` +
    `${BRAND.websiteLabel}`
  )
}

/** WhatsApp thank-you card — daily participant (no mobile number shown). */
export function thankYouCardText(name: string, week: string, agileGuard = false): string {
  const who = name.trim() ? `*${name.trim()}*` : '*you*'
  const guardLine = agileGuard
    ? `Thank you for participating as an *Agile Guard* in today's *Question of the Day Contest* with a correct answer.\n\n`
    : `Thank you for participating in today's *Question of the Day Contest* with a correct answer.\n\n`
  return (
    `${cardHeader()}\n\n` +
    `🙏 *Thank you, ${who}!*\n\n` +
    guardLine +
    `Every correct answer enters this week's Sunday lucky draw (${week}).\n\n` +
    `*Last week's winner is announced in our News Bulletin:*\n` +
    `👉 ${BULLETIN_URL}\n\n` +
    `Keep answering daily — good luck!\n\n` +
    `— *Agile Group*\n\n` +
    `💼 *Immediate FREE Security Jobs*\n` +
    `👉 ${JOB_LINKS.registerLabel}\n` +
    `${SECURITYJOB_REGISTER_URL}\n\n` +
    cardFooter()
  )
}

/** WhatsApp winner congratulations card (no mobile number shown). */
export function winnerCardText(w: Pick<QuizWinner, 'name' | 'weekKey'>, agileGuard = false): string {
  const guardLine = agileGuard
    ? `You are this week's *Agile Guard* winner of the *Question of the Day Contest* lucky draw (${w.weekKey}).\n\n`
    : `You are this week's winner of the *Question of the Day Contest* lucky draw (${w.weekKey}).\n\n`
  return (
    `${cardHeader()}\n\n` +
    `🎉 *Congratulations, ${w.name}!*\n\n` +
    guardLine +
    `Thank you for learning and participating. Our team will contact you about your prize.\n\n` +
    `Your name is now on our News Bulletin:\n` +
    `👉 ${BULLETIN_URL}\n\n` +
    `— *Agile Group*\n\n` +
    `💼 *Immediate FREE Security Jobs*\n` +
    `👉 ${JOB_LINKS.registerLabel}\n` +
    `${SECURITYJOB_REGISTER_URL}\n\n` +
    cardFooter()
  )
}

export function cardImageUrl(): string {
  return CARD_IMAGE_URL
}

/** Visual HTML card (open in browser / share link). */
export function renderCardHtml(opts: {
  type: 'thankyou' | 'winner'
  name: string
  week: string
}): string {
  const isWinner = opts.type === 'winner'
  const title = isWinner ? '🎉 Congratulations!' : '🙏 Thank You!'
  const body = isWinner
    ? `<p style="font-size:17px;color:#1e293b;line-height:1.6;margin:0 0 12px">Dear <b>${esc(opts.name)}</b>, you are this week's <b>Question of the Day Contest</b> winner (${esc(opts.week)}). Our team will contact you about your prize. Your name is on our <a href="${esc(BULLETIN_URL)}" style="color:#1d4ed8;font-weight:700">News Bulletin</a>.</p>`
    : `<p style="font-size:17px;color:#1e293b;line-height:1.6;margin:0 0 12px">Dear <b>${esc(opts.name)}</b>, thank you for a correct answer in today's <b>Question of the Day Contest</b> (${esc(opts.week)}). Every correct answer enters Sunday's lucky draw.</p>` +
      `<p style="font-size:15px;color:#334155;line-height:1.5;margin:0 0 12px"><b>Last week's winner</b> is announced in our News Bulletin:<br><a href="${esc(BULLETIN_URL)}" style="color:#1d4ed8;font-weight:700">${esc(BULLETIN_URL)}</a></p>`

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(BRAND.companyName)} — Question of the Day</title>
<style>body{margin:0;font-family:'Segoe UI',Arial,sans-serif;background:#e8eef7;padding:16px}</style></head><body>
<div style="max-width:420px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(29,78,216,0.2);border:2px solid #c9a84c">
<div style="background:linear-gradient(135deg,#1d4ed8,#1e3a8a);padding:20px 16px;text-align:center;border-bottom:3px solid #c9a84c">
<img src="${esc(BRAND.logoUrl)}" alt="Agile" style="height:52px;margin-bottom:8px">
<div style="font-size:12px;color:#93c5fd;font-weight:700;letter-spacing:0.3px;line-height:1.4">${esc(BRAND.companyName)}</div>
<div style="font-size:13px;color:#fde68a;font-weight:800;margin-top:6px">Question of the Day Contest</div>
</div>
<div style="padding:24px 20px;text-align:center">
<div style="font-size:26px;font-weight:800;color:#1d4ed8;margin-bottom:12px">${title}</div>
${body}
<div style="margin:20px 0;padding:14px;background:#eff6ff;border-radius:12px;border:1px solid #bfdbfe">
<div style="font-size:14px;font-weight:700;color:#1e40af;margin-bottom:6px">💼 Immediate FREE Security Jobs</div>
<a href="${esc(SECURITYJOB_REGISTER_URL)}" style="font-size:15px;font-weight:800;color:#dc2626;text-decoration:none">${esc(JOB_LINKS.registerLabel)}</a>
</div>
<div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;line-height:1.5;font-style:italic">${esc(CURSOR_ATTRIBUTION)}</div>
<div style="font-size:11px;color:#94a3b8;margin-top:8px">© ${new Date().getFullYear()} ${esc(BRAND.companyName)} · ${esc(BRAND.websiteLabel)}</div>
</div></div></body></html>`
}

import { BRAND, BULLETIN_URL, CHANNEL_URL, CURSOR_ATTRIBUTION, JOB_LINKS, SECURITYJOB_REGISTER_URL } from './config.js'

/**
 * Builds the three scheduled messages:
 *  msg1 = simple Channel post (brand + date + Flash News + link)
 *  msg2 = attractive Groups post (headline + contents + jobs + follow + link)
 *  msg3 = approval prompt
 */
export function buildWhatsAppMessages(opts: {
  edition: string
  dateTime: string
  topHeadline: string
}) {
  const editionBulletin = opts.edition.replace('Edition', 'Bulletin')
  const divider = '━━━━━━━━━━━━━━━━━━━━━'
  const headline = opts.topHeadline
    ? `🔴 ${opts.topHeadline}`
    : `🔴 Today's top security, crime, traffic & weather updates`

  // Message 1 — simple, for the Channel.
  const msg1 =
    `📰 *Security News – Agile Group*\n` +
    `🗓️ ${opts.dateTime} — ${editionBulletin}\n\n` +
    `⚡ *Flash News* — open the full news bulletin:\n` +
    `👉 ${BULLETIN_URL}\n\n` +
    `🌐 www.agilegroup.co.in`

  // Message 2 — attractive, for the groups.
  const msg2 =
    `🚨 *SECURITY NEWS – AGILE GROUP* 🚨\n` +
    `🗓️ ${opts.dateTime} — ${editionBulletin}\n` +
    `${divider}\n\n` +
    `${headline}\n\n` +
    `📢 *Inside today's bulletin:*\n` +
    `  ▸ 🛣️ Highway & Road Closure Alerts\n` +
    `  ▸ 🏙️ Indian City Security News\n` +
    `  ▸ 🚨 Incidents, Fire, Terror & Bank/ATM\n` +
    `  ▸ ⛈️ Weather & IMD Alerts\n` +
    `  ▸ 🧠 Security Question of the Day\n` +
    `  ▸ 🏆 Weekly Quiz Winner & Guard News\n\n` +
    `💼 *Immediate Security Jobs — Register FREE:*\n👉 ${JOB_LINKS.registerLabel}\n${SECURITYJOB_REGISTER_URL}\n\n` +
    `⭐ *Flash News, Weather, Jobs & Daily Quiz:*\n👉 ${BULLETIN_URL}\n\n` +
    `*Follow our Channel:* ${CHANNEL_URL}\n\n` +
    `🌐 ${BRAND.websiteLabel}\n\n` +
    `${CURSOR_ATTRIBUTION}`

  const msg3 =
    `✅ Above is today's bulletin preview.\n` +
    `Reply OK or SEND to distribute to all groups.\n` +
    `No reply = edition skipped.`

  return { msg1, msg2, msg3 }
}

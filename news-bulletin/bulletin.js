/**
 * Shared bulletin copy — AGILE GROUP Security News format.
 * Used by Node send.js. Apps Script mirrors this in Code.gs (buildBulletin_).
 */

'use strict';

function buildAgileSecurityBulletin(now = new Date(), opts = {}) {
  const tz = 'Asia/Kolkata';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(now);

  const get = (type) => (parts.find((p) => p.type === type) || {}).value || '';
  const day = get('day');
  const month = get('month');
  const year = get('year');
  let hour = get('hour');
  const minute = get('minute');
  const dayPeriod = (get('dayPeriod') || '').toUpperCase();
  // en-GB hour12 can omit leading zero; keep as-is
  const timeLabel = `${hour}:${minute} ${dayPeriod}`;
  const dateLabel = `${day} ${month} ${year}`;

  const hour24 = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      hour12: false,
    }).format(now)
  );
  let slot = 'Evening Bulletin';
  if (hour24 < 12) slot = 'Morning Bulletin';
  else if (hour24 < 17) slot = 'Afternoon Bulletin';

  const flash =
    opts.flashHeadline ||
    process.env.BULLETIN_FLASH_HEADLINE ||
    'eight killed in bus collision and fire on Delhi-Mumbai Expressway in Rajasthan';

  const body = [
    '🚨 *SECURITY NEWS – AGILE GROUP* 🚨',
    `🗓️ ${dateLabel} ${timeLabel} — ${slot}`,
    '━━━━━━━━━━━━━━━━━━━━━',
    '',
    `🔴 ${flash}`,
    '',
    "📢 *Inside today's bulletin:*",
    '  ▸ 🛣️ Highway & Road Closure Alerts',
    '  ▸ 🏙️ Indian City Security News',
    '  ▸ 🚨 Incidents, Fire, Terror & Bank/ATM',
    '  ▸ ⛈️ Weather & IMD Alerts',
    '  ▸ 🧠 Security Question of the Day',
    '  ▸ 🏆 Weekly Quiz Winner — ₹250 Amazon voucher',
    '',
    '━━━━━━━━━━━━━━━━━━━━━',
    '⚡ *Flash News Link*',
    '👉 https://www.agilegroup-digital.co.in/pulse',
    '',
    '🎯 *PLAY & WIN — don\'t miss this*',
    '',
    '🧠 *Security Question of the Day* — answer daily',
    "🏆 *Last week's Winner* announced every Sunday",
    '🎁 Prize: *₹250 Amazon gift voucher*',
    '',
    '👇 *Follow our News Channel* to view the full News Bulletin, Question, answers & winner updates:',
    'https://whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y',
    '',
    '✨ Tap *Follow* once — stay ahead with Flash News, quiz & jobs.',
    '━━━━━━━━━━━━━━━━━━━━━',
    '',
    '💼 *Immediate Security Jobs — Register FREE:*',
    '👉 www.SecurityJob.co.in',
    'https://www.securityjob.co.in/#register',
    '',
    '🌐 Discover our full range of services at www.agilegroup.co.in',
    '',
    'Agile Digital Operations Command Centre — designed and built with Cursor.ai, San Francisco, California, USA, in partnership with Agile Group leadership.',
    'www.agilegroup-digital.co.in · cursor.ai',
  ].join('\n');

  const shortFlash = flash.length > 60 ? `${flash.slice(0, 57)}...` : flash;

  return {
    dateLabel,
    timeLabel,
    slot,
    flash,
    shortFlash,
    body,
    defaultVariables: `${dateLabel}|${shortFlash}`,
  };
}

module.exports = { buildAgileSecurityBulletin };

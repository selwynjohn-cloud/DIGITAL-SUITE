#!/usr/bin/env node
/**
 * DIGITAL-SUITE — Security Job News Bulletin sender (Fast2SMS)
 *
 * Usage:
 *   cp .env.example .env   # fill FAST2SMS_API_KEY
 *   node send.js           # send now (whatsapp → sms fallback with CHANNEL=auto)
 *   node send.js --list    # list WABA numbers / templates
 *   node send.js --sms     # force Quick SMS
 */

'use strict';

const fs = require('fs');
const path = require('path');

loadEnv(path.join(__dirname, '.env'));

const API_KEY = process.env.FAST2SMS_API_KEY || '';
const BULLETIN_TO = normalizePhone(process.env.BULLETIN_TO || '9441009091');
const CHANNEL = (process.env.BULLETIN_CHANNEL || 'whatsapp').toLowerCase();
const BASE = 'https://www.fast2sms.com';

async function main() {
  const args = new Set(process.argv.slice(2));
  if (!API_KEY) {
    console.error('Missing FAST2SMS_API_KEY. Copy .env.example → .env and paste your key.');
    process.exit(1);
  }

  if (args.has('--list')) {
    const numbers = await fast2smsGet('/dev/dlt_manager/whatsapp', { type: 'number' });
    const templates = await fast2smsGet('/dev/dlt_manager/whatsapp', { type: 'template' });
    console.log(JSON.stringify({ numbers, templates }, null, 2));
    return;
  }

  const bulletin = buildBulletin();
  const channel = args.has('--sms')
    ? 'sms'
    : args.has('--whatsapp')
      ? 'whatsapp'
      : CHANNEL;

  let result = null;
  if (channel === 'whatsapp' || channel === 'auto') {
    try {
      result = await sendWhatsApp(bulletin);
    } catch (err) {
      console.error('[whatsapp]', err.message || err);
      if (channel === 'whatsapp') throw err;
    }
  }

  if (!result && (channel === 'sms' || channel === 'auto')) {
    result = await sendSms(bulletin);
  }

  if (!result) throw new Error('Bulletin not sent.');
  console.log(JSON.stringify(result, null, 2));
}

function buildBulletin() {
  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeLabel = now.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const headlines = [
    'New security guard vacancies are open near you — check Security Job today.',
    'Recruiters are reviewing fresh applications. Keep your profile complete.',
    'Interview tip from SG. Priya: arrive 15 minutes early and carry your ID.',
    'Joining reminder: confirm your reporting time with AGILE recruitment.',
    'Library update: new training clips are available in the Security Job app.',
  ];
  const istWeekday = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  ).getDay();
  const lead = headlines[istWeekday % headlines.length];
  const shortLead = lead.length > 60 ? `${lead.slice(0, 57)}...` : lead;

  const body = [
    `SECURITY JOB NEWS · ${dateLabel} · ${timeLabel} IST`,
    'Anchor: SG. Priya (Id.No. 010190073)',
    '',
    lead,
    '',
    'Hotline: 1800 599 5599',
    'Alt: 92487 07070',
    'Email: recruitment@securityjob.co.in',
    'Web: https://www.securityjob.co.in',
    '',
    '— AGILE · Experience Never Retires',
  ].join('\n');

  return {
    dateLabel,
    lead,
    shortLead,
    body,
    defaultVariables: process.env.BULLETIN_VARIABLES || `${dateLabel}|${shortLead}`,
  };
}

async function sendWhatsApp(bulletin) {
  let phoneNumberId = process.env.FAST2SMS_PHONE_NUMBER_ID || '';
  let messageId = process.env.FAST2SMS_MESSAGE_ID || '';

  if (!phoneNumberId || !messageId) {
    const resolved = await resolveWhatsAppAssets(phoneNumberId, messageId);
    phoneNumberId = resolved.phoneNumberId;
    messageId = resolved.messageId;
    console.error(
      `[resolve] phone_number_id=${phoneNumberId} message_id=${messageId} template=${resolved.templateName || '?'}`
    );
  }

  const params = {
    authorization: API_KEY,
    message_id: String(messageId),
    phone_number_id: String(phoneNumberId),
    numbers: BULLETIN_TO,
    variables_values: bulletin.defaultVariables,
  };
  const data = await fast2smsGet('/dev/whatsapp', params, true);
  const ok = data && (data.status === true || data.return === true || data.success === true);
  if (!ok) throw new Error(JSON.stringify(data));
  return {
    ok: true,
    channel: 'whatsapp',
    to: BULLETIN_TO,
    phoneNumberId,
    messageId,
    requestId: data.request_id || null,
    upstream: data,
  };
}

async function sendSms(bulletin) {
  const data = await fast2smsGet(
    '/dev/bulkV2',
    {
      authorization: API_KEY,
      route: 'q',
      message: bulletin.body,
      numbers: BULLETIN_TO,
    },
    true
  );
  if (!(data && data.return === true)) throw new Error(JSON.stringify(data));
  return {
    ok: true,
    channel: 'sms',
    to: BULLETIN_TO,
    requestId: data.request_id || null,
    upstream: data,
  };
}

async function resolveWhatsAppAssets(phoneNumberId, messageId) {
  const tplResp = await fast2smsGet('/dev/dlt_manager/whatsapp', { type: 'template' });
  const rows = (tplResp && tplResp.data) || [];
  if (!rows.length) {
    throw new Error(
      'No WhatsApp WABA/templates found. Finish Fast2SMS WhatsApp onboarding first.'
    );
  }

  for (const row of rows) {
    for (const t of row.templates || []) {
      const status = String(t.status || '').toLowerCase();
      if (status && status !== 'approved') continue;
      if (messageId && String(t.message_id) !== String(messageId)) continue;
      const rowPid = String(t.phone_number_id || row.phone_number_id);
      if (phoneNumberId && rowPid !== String(phoneNumberId)) continue;
      return {
        phoneNumberId: rowPid,
        messageId: String(t.message_id),
        templateName: t.template_name || null,
      };
    }
  }

  const first = rows[0];
  const firstTpl = (first.templates && first.templates[0]) || null;
  if (!firstTpl) throw new Error('WABA connected but no templates available.');
  return {
    phoneNumberId: String(firstTpl.phone_number_id || first.phone_number_id),
    messageId: String(firstTpl.message_id),
    templateName: firstTpl.template_name || null,
  };
}

async function fast2smsGet(pathname, query, authInQuery) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query || {})) {
    if (v === undefined || v === null || v === '') continue;
    if (!authInQuery && k === 'authorization') continue;
    params.set(k, String(v));
  }
  const url = `${BASE}${pathname}?${params.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: API_KEY,
      accept: 'application/json',
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits.slice(-10);
}

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

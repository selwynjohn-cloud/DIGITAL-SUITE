/**
 * DIGITAL-SUITE — Security Job News Bulletin (WhatsApp via Fast2SMS)
 *
 * ACTIVATE (Google Apps Script):
 * 1. https://script.google.com → New project → name it "News Bulletin"
 * 2. Paste this entire file into Code.gs (replace the stub)
 * 3. Project Settings → Script properties → Add:
 *      FAST2SMS_API_KEY          = <from https://www.fast2sms.com/dashboard/dev-api>
 *      BULLETIN_TO               = 9441009091
 *      FAST2SMS_PHONE_NUMBER_ID  = (optional — auto-resolved if blank)
 *      FAST2SMS_MESSAGE_ID       = (optional — auto-picks first Approved template)
 *      BULLETIN_CHANNEL          = whatsapp   (or "sms" / "auto")
 * 4. Run → activateNewsBulletin  (authorize when prompted)
 * 5. Check Executions log + your WhatsApp (9441009091)
 *
 * Daily send uses a time-driven trigger created by activateNewsBulletin().
 */

var DEFAULT_BULLETIN_TO = '9441009091';
var FAST2SMS_BASE = 'https://www.fast2sms.com';

/** One-shot activation: send now + install daily 09:00 IST trigger. */
function activateNewsBulletin() {
  var result = sendNewsBulletin();
  ensureDailyTrigger_();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/** Daily / manual send. */
function sendNewsBulletin() {
  var cfg = getConfig_();
  if (!cfg.apiKey) {
    throw new Error(
      'FAST2SMS_API_KEY missing. Add it under Project Settings → Script properties.'
    );
  }

  var bulletin = buildBulletin_();
  var channel = String(cfg.channel || 'whatsapp').toLowerCase();
  var sent = null;

  if (channel === 'whatsapp' || channel === 'auto') {
    try {
      sent = sendWhatsAppBulletin_(cfg, bulletin);
    } catch (err) {
      Logger.log('WhatsApp send failed: ' + err);
      if (channel === 'whatsapp') throw err;
    }
  }

  if (!sent && (channel === 'sms' || channel === 'auto')) {
    sent = sendSmsBulletin_(cfg, bulletin);
  }

  if (!sent) {
    throw new Error(
      'No bulletin sent. Set BULLETIN_CHANNEL=whatsapp|sms|auto and ensure Fast2SMS WhatsApp WABA/templates are ready.'
    );
  }

  PropertiesService.getScriptProperties().setProperty(
    'LAST_BULLETIN_RESULT',
    JSON.stringify({ at: new Date().toISOString(), result: sent })
  );
  return sent;
}

/** List WABA numbers + approved templates (debug helper). */
function listWhatsAppAssets() {
  var cfg = getConfig_();
  var numbers = fast2smsGet_('/dev/dlt_manager/whatsapp', cfg.apiKey, {
    type: 'number',
  });
  var templates = fast2smsGet_('/dev/dlt_manager/whatsapp', cfg.apiKey, {
    type: 'template',
  });
  var out = { numbers: numbers, templates: templates };
  Logger.log(JSON.stringify(out, null, 2));
  return out;
}

/** Remove daily trigger (pause bulletin). */
function deactivateNewsBulletin() {
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendNewsBulletin') {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }
  return { ok: true, removed: removed };
}

/* ───────────────────────── internals ───────────────────────── */

function getConfig_() {
  var p = PropertiesService.getScriptProperties();
  return {
    apiKey: trim_(p.getProperty('FAST2SMS_API_KEY')),
    to: normalizePhone_(p.getProperty('BULLETIN_TO') || DEFAULT_BULLETIN_TO),
    phoneNumberId: trim_(p.getProperty('FAST2SMS_PHONE_NUMBER_ID')),
    messageId: trim_(p.getProperty('FAST2SMS_MESSAGE_ID')),
    channel: trim_(p.getProperty('BULLETIN_CHANNEL') || 'whatsapp'),
    variables: trim_(p.getProperty('BULLETIN_VARIABLES')),
  };
}

function buildBulletin_() {
  var tz = 'Asia/Kolkata';
  var now = new Date();
  var dateLabel = Utilities.formatDate(now, tz, 'd MMM yyyy');
  var timeLabel = Utilities.formatDate(now, tz, 'HH:mm');

  var headlines = [
    'New security guard vacancies are open near you — check Security Job today.',
    'Recruiters are reviewing fresh applications. Keep your profile complete.',
    'Interview tip from SG. Priya: arrive 15 minutes early and carry your ID.',
    'Joining reminder: confirm your reporting time with AGILE recruitment.',
    'Library update: new training clips are available in the Security Job app.',
  ];
  var dayIndex = Number(Utilities.formatDate(now, tz, 'u')) - 1; // 0=Mon
  var lead = headlines[Math.abs(dayIndex) % headlines.length];

  var body =
    'SECURITY JOB NEWS · ' +
    dateLabel +
    ' · ' +
    timeLabel +
    ' IST\n' +
    'Anchor: SG. Priya (Id.No. 010190073)\n\n' +
    lead +
    '\n\n' +
    'Hotline: 1800 599 5599\n' +
    'Alt: 92487 07070\n' +
    'Email: recruitment@securityjob.co.in\n' +
    'Web: https://www.securityjob.co.in\n\n' +
    '— AGILE · Experience Never Retires';

  // Template vars: date | short lead (keep short for WhatsApp template limits)
  var shortLead = lead.length > 60 ? lead.substring(0, 57) + '...' : lead;
  return {
    dateLabel: dateLabel,
    timeLabel: timeLabel,
    lead: lead,
    shortLead: shortLead,
    body: body,
    defaultVariables: dateLabel + '|' + shortLead,
  };
}

function sendWhatsAppBulletin_(cfg, bulletin) {
  var phoneNumberId = cfg.phoneNumberId;
  var messageId = cfg.messageId;

  if (!phoneNumberId || !messageId) {
    var resolved = resolveWhatsAppAssets_(cfg.apiKey, phoneNumberId, messageId);
    phoneNumberId = resolved.phoneNumberId;
    messageId = resolved.messageId;
    // Persist so later runs skip lookup
    var props = PropertiesService.getScriptProperties();
    if (!cfg.phoneNumberId && phoneNumberId) {
      props.setProperty('FAST2SMS_PHONE_NUMBER_ID', String(phoneNumberId));
    }
    if (!cfg.messageId && messageId) {
      props.setProperty('FAST2SMS_MESSAGE_ID', String(messageId));
    }
  }

  var variables = cfg.variables || bulletin.defaultVariables;
  var params = {
    authorization: cfg.apiKey,
    message_id: String(messageId),
    phone_number_id: String(phoneNumberId),
    numbers: cfg.to,
  };
  if (variables) params.variables_values = variables;

  var data = fast2smsGet_('/dev/whatsapp', cfg.apiKey, params, true);
  var ok = data && (data.status === true || data.return === true || data.success === true);
  if (!ok) {
    throw new Error('Fast2SMS WhatsApp error: ' + JSON.stringify(data));
  }
  return {
    ok: true,
    channel: 'whatsapp',
    to: cfg.to,
    phoneNumberId: phoneNumberId,
    messageId: messageId,
    requestId: data.request_id || null,
    upstream: data,
  };
}

function sendSmsBulletin_(cfg, bulletin) {
  var data = fast2smsGet_(
    '/dev/bulkV2',
    cfg.apiKey,
    {
      authorization: cfg.apiKey,
      route: 'q',
      message: bulletin.body,
      numbers: cfg.to,
    },
    true
  );
  if (!(data && data.return === true)) {
    throw new Error('Fast2SMS SMS error: ' + JSON.stringify(data));
  }
  return {
    ok: true,
    channel: 'sms',
    to: cfg.to,
    requestId: data.request_id || null,
    upstream: data,
  };
}

function resolveWhatsAppAssets_(apiKey, phoneNumberId, messageId) {
  var tplResp = fast2smsGet_('/dev/dlt_manager/whatsapp', apiKey, {
    type: 'template',
  });
  var rows = (tplResp && tplResp.data) || [];
  if (!rows.length) {
    throw new Error(
      'No WhatsApp WABA/templates found. Complete Fast2SMS WhatsApp onboarding, then re-run activateNewsBulletin.'
    );
  }

  var chosenNumberId = phoneNumberId;
  var chosenMessageId = messageId;
  var chosenTemplate = null;

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var templates = row.templates || [];
    for (var j = 0; j < templates.length; j++) {
      var t = templates[j];
      var status = String(t.status || '').toLowerCase();
      if (status && status !== 'approved') continue;
      if (messageId && String(t.message_id) !== String(messageId)) continue;
      if (phoneNumberId && String(t.phone_number_id || row.phone_number_id) !== String(phoneNumberId)) {
        continue;
      }
      chosenTemplate = t;
      chosenNumberId = t.phone_number_id || row.phone_number_id;
      chosenMessageId = t.message_id;
      break;
    }
    if (chosenTemplate) break;
  }

  if (!chosenTemplate) {
    // Fallback: first template even if status unknown
    var first = rows[0];
    var firstTpl = (first.templates && first.templates[0]) || null;
    if (!firstTpl) {
      throw new Error('WABA connected but no templates available.');
    }
    chosenTemplate = firstTpl;
    chosenNumberId = firstTpl.phone_number_id || first.phone_number_id;
    chosenMessageId = firstTpl.message_id;
  }

  return {
    phoneNumberId: String(chosenNumberId),
    messageId: String(chosenMessageId),
    templateName: chosenTemplate.template_name || null,
  };
}

function ensureDailyTrigger_() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendNewsBulletin') {
      return { created: false, existing: true };
    }
  }
  // 09:00 Asia/Kolkata ≈ 03:30 UTC
  ScriptApp.newTrigger('sendNewsBulletin')
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();
  return { created: true, existing: false };
}

function fast2smsGet_(pathname, apiKey, query, authInQuery) {
  var qs = [];
  var keys = Object.keys(query || {});
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (query[k] === undefined || query[k] === null || query[k] === '') continue;
    if (!authInQuery && k === 'authorization') continue;
    qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(query[k])));
  }
  var url = FAST2SMS_BASE + pathname + (qs.length ? '?' + qs.join('&') : '');
  var resp = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      Authorization: apiKey,
      accept: 'application/json',
    },
    muteHttpExceptions: true,
  });
  var text = resp.getContentText();
  var data = {};
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = { raw: text, httpStatus: resp.getResponseCode() };
  }
  if (resp.getResponseCode() >= 400) {
    throw new Error(
      'Fast2SMS HTTP ' + resp.getResponseCode() + ': ' + JSON.stringify(data)
    );
  }
  return data;
}

function normalizePhone_(raw) {
  var digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.indexOf('91') === 0) return digits.slice(2);
  if (digits.length === 10) return digits;
  return digits;
}

function trim_(v) {
  return v == null ? '' : String(v).trim();
}

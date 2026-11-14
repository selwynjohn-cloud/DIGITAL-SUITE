/**
 * DIGITAL-SUITE — SECURITY NEWS – AGILE GROUP (WhatsApp via Fast2SMS)
 *
 * Sends the official AGILE Security News bulletin copy (full free-form body).
 *
 * ACTIVATE (Google Apps Script):
 * 1. https://script.google.com → New project → name it "News Bulletin"
 * 2. Paste this entire file into Code.gs (replace the stub)
 * 3. Project Settings → Script properties → Add:
 *      FAST2SMS_API_KEY          = <from https://www.fast2sms.com/dashboard/dev-api>
 *      BULLETIN_TO               = 9441009091
 *      FAST2SMS_PHONE_NUMBER_ID  = (optional — auto-resolved if blank)
 *      FAST2SMS_MESSAGE_ID       = (optional — template fallback only)
 *      BULLETIN_CHANNEL          = whatsapp   (or "sms" / "auto")
 *      BULLETIN_FLASH_HEADLINE   = (optional lead story line under 🔴)
 * 4. Run → activateNewsBulletin  (authorize when prompted)
 * 5. Check Executions log + WhatsApp (9441009091)
 *
 * Delivery order for whatsapp/auto:
 *   1) WhatsApp session text (full AGILE copy — needs 24h window)
 *   2) WhatsApp approved template (vars only)
 *   3) Quick SMS if channel=auto|sms
 */

var DEFAULT_BULLETIN_TO = '9441009091';
var FAST2SMS_BASE = 'https://www.fast2sms.com';
var DEFAULT_FLASH =
  'eight killed in bus collision and fire on Delhi-Mumbai Expressway in Rajasthan';

/** One-shot activation: send now + install daily trigger. */
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
      sent = sendWhatsAppSession_(cfg, bulletin);
    } catch (err) {
      Logger.log('WhatsApp session failed: ' + err);
      try {
        sent = sendWhatsAppTemplate_(cfg, bulletin);
      } catch (err2) {
        Logger.log('WhatsApp template failed: ' + err2);
        if (channel === 'whatsapp') throw err2;
      }
    }
  }

  if (!sent && (channel === 'sms' || channel === 'auto')) {
    sent = sendSmsBulletin_(cfg, bulletin);
  }

  if (!sent) {
    throw new Error(
      'No bulletin sent. Set BULLETIN_CHANNEL=whatsapp|sms|auto and ensure Fast2SMS WhatsApp is ready.'
    );
  }

  PropertiesService.getScriptProperties().setProperty(
    'LAST_BULLETIN_RESULT',
    JSON.stringify({ at: new Date().toISOString(), result: sent })
  );
  return sent;
}

/** Preview body in Apps Script logger (no send). */
function previewNewsBulletin() {
  var body = buildBulletin_().body;
  Logger.log(body);
  return body;
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
    flashHeadline: trim_(p.getProperty('BULLETIN_FLASH_HEADLINE')),
  };
}

/** Official AGILE GROUP Security News bulletin copy. */
function buildBulletin_() {
  var tz = 'Asia/Kolkata';
  var now = new Date();
  var dateLabel = Utilities.formatDate(now, tz, 'd MMMM yyyy');
  var timeLabel = Utilities.formatDate(now, tz, 'h:mm a').toUpperCase();
  var hour24 = Number(Utilities.formatDate(now, tz, 'H'));
  var slot = 'Evening Bulletin';
  if (hour24 < 12) slot = 'Morning Bulletin';
  else if (hour24 < 17) slot = 'Afternoon Bulletin';

  var flash = getConfig_().flashHeadline || DEFAULT_FLASH;
  var shortFlash = flash.length > 60 ? flash.substring(0, 57) + '...' : flash;

  var body = [
    '🚨 *SECURITY NEWS – AGILE GROUP* 🚨',
    '🗓️ ' + dateLabel + ' ' + timeLabel + ' — ' + slot,
    '━━━━━━━━━━━━━━━━━━━━━',
    '',
    '🔴 ' + flash,
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
    "🎯 *PLAY & WIN — don't miss this*",
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

  return {
    dateLabel: dateLabel,
    timeLabel: timeLabel,
    slot: slot,
    flash: flash,
    shortFlash: shortFlash,
    body: body,
    defaultVariables: dateLabel + '|' + shortFlash,
  };
}

/** Full free-form AGILE copy (requires open WhatsApp 24h session). */
function sendWhatsAppSession_(cfg, bulletin) {
  var phoneNumberId = cfg.phoneNumberId;
  if (!phoneNumberId) {
    var resolved = resolveWhatsAppAssets_(cfg.apiKey, '', '');
    phoneNumberId = resolved.phoneNumberId;
    PropertiesService.getScriptProperties().setProperty(
      'FAST2SMS_PHONE_NUMBER_ID',
      String(phoneNumberId)
    );
  }

  var to = '91' + cfg.to;
  var url =
    FAST2SMS_BASE +
    '/dev/whatsapp-session?phone_number_id=' +
    encodeURIComponent(String(phoneNumberId)) +
    '&to=' +
    encodeURIComponent(to);

  var resp = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: cfg.apiKey,
      accept: 'application/json',
    },
    payload: JSON.stringify({ type: 'text', text: bulletin.body }),
    muteHttpExceptions: true,
  });
  var data = parseJson_(resp);
  if (resp.getResponseCode() >= 400) {
    throw new Error('Session HTTP ' + resp.getResponseCode() + ': ' + JSON.stringify(data));
  }
  var ok =
    data &&
    (data.status === true ||
      data.status === 'success' ||
      data.return === true ||
      data.success === true ||
      data.request_id ||
      data.message_id ||
      data.messages);
  if (!ok) throw new Error('Fast2SMS session error: ' + JSON.stringify(data));

  return {
    ok: true,
    channel: 'whatsapp-session',
    to: cfg.to,
    phoneNumberId: phoneNumberId,
    requestId: data.request_id || data.message_id || null,
    upstream: data,
  };
}

/** Template fallback — only injects short variables, not full AGILE copy. */
function sendWhatsAppTemplate_(cfg, bulletin) {
  var phoneNumberId = cfg.phoneNumberId;
  var messageId = cfg.messageId;

  if (!phoneNumberId || !messageId) {
    var resolved = resolveWhatsAppAssets_(cfg.apiKey, phoneNumberId, messageId);
    phoneNumberId = resolved.phoneNumberId;
    messageId = resolved.messageId;
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
    throw new Error('Fast2SMS WhatsApp template error: ' + JSON.stringify(data));
  }
  return {
    ok: true,
    channel: 'whatsapp-template',
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
    var numResp = fast2smsGet_('/dev/dlt_manager/whatsapp', apiKey, {
      type: 'number',
    });
    var nums = (numResp && numResp.data) || [];
    if (!nums.length) {
      throw new Error(
        'No WhatsApp WABA found. Complete Fast2SMS WhatsApp onboarding, then re-run.'
      );
    }
    return {
      phoneNumberId: String(nums[0].phone_number_id),
      messageId: messageId || '',
      templateName: null,
    };
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
      if (
        phoneNumberId &&
        String(t.phone_number_id || row.phone_number_id) !== String(phoneNumberId)
      ) {
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
    var first = rows[0];
    var firstTpl = (first.templates && first.templates[0]) || null;
    chosenNumberId = (firstTpl && firstTpl.phone_number_id) || first.phone_number_id;
    chosenMessageId = (firstTpl && firstTpl.message_id) || messageId || '';
    chosenTemplate = firstTpl || {};
  }

  return {
    phoneNumberId: String(chosenNumberId),
    messageId: String(chosenMessageId || ''),
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
  // ~09:00 Asia/Kolkata ≈ 03:30 UTC
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
  var data = parseJson_(resp);
  if (resp.getResponseCode() >= 400) {
    throw new Error(
      'Fast2SMS HTTP ' + resp.getResponseCode() + ': ' + JSON.stringify(data)
    );
  }
  return data;
}

function parseJson_(resp) {
  var text = resp.getContentText();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { raw: text, httpStatus: resp.getResponseCode() };
  }
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

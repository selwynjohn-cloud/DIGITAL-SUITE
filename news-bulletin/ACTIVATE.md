# Activate Security Job News Bulletin

Sends a daily **SECURITY JOB NEWS** bulletin to WhatsApp (`9441009091`) via **Fast2SMS**.

## Fastest path — Google Apps Script

1. Open [script.google.com](https://script.google.com) → **New project** → name it `News Bulletin`.
2. Replace `Code.gs` with the full contents of [`Code.gs`](./Code.gs) in this folder.
3. **Project Settings → Script properties** — add:

| Property | Value |
|----------|-------|
| `FAST2SMS_API_KEY` | from [Fast2SMS Dev API](https://www.fast2sms.com/dashboard/dev-api) |
| `BULLETIN_TO` | `9441009091` |
| `BULLETIN_CHANNEL` | `whatsapp` |
| `FAST2SMS_PHONE_NUMBER_ID` | optional (auto) |
| `FAST2SMS_MESSAGE_ID` | optional (auto) |

4. Select function **`activateNewsBulletin`** → **Run** → approve permissions.
5. Confirm the message on WhatsApp. A daily trigger is installed automatically.

Helpers:
- `listWhatsAppAssets` — dump WABA numbers / templates
- `sendNewsBulletin` — send once without changing triggers
- `deactivateNewsBulletin` — remove the daily trigger

## Node (local / CI)

```bash
cd news-bulletin
cp .env.example .env
# paste FAST2SMS_API_KEY into .env
node send.js --list     # inspect WABA + templates
node send.js            # send WhatsApp bulletin now
node send.js --sms      # Quick SMS fallback
```

## WhatsApp prerequisites (Fast2SMS)

1. Complete [WhatsApp Business API onboarding](https://www.fast2sms.com/help/how-to-complete-whatsapp-business-api-onboarding-process/) in Fast2SMS.
2. Keep at least one **Approved** template (Fast2SMS ships sample Marketing / Utility / Authentication templates).
3. Template body variables should accept values we send as `date|headline` (or set `BULLETIN_VARIABLES` / Script property to match your template’s `var_count`).

If WhatsApp is not ready yet, set `BULLETIN_CHANNEL=sms` (or `auto`) to deliver via Fast2SMS Quick SMS immediately with only the API key.

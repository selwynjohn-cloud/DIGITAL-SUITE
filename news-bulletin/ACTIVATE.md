# Activate AGILE GROUP Security News Bulletin

**Production (preferred):** the live Command Centre already auto-publishes three daily editions — see [`LIVE.md`](./LIVE.md).

**Legacy / backup in this folder:** Google Apps Script + Fast2SMS sender for the official **SECURITY NEWS – AGILE GROUP** WhatsApp copy.

## Fastest path — Google Apps Script

1. Open [script.google.com](https://script.google.com) → **New project** → name it `News Bulletin`.
2. Replace `Code.gs` with the full contents of [`Code.gs`](./Code.gs) in this folder.
3. **Project Settings → Script properties** — add:

| Property | Value |
|----------|-------|
| `FAST2SMS_API_KEY` | from [Fast2SMS Dev API](https://www.fast2sms.com/dashboard/dev-api) |
| `BULLETIN_TO` | `9441009091` |
| `BULLETIN_CHANNEL` | `whatsapp` |
| `BULLETIN_FLASH_HEADLINE` | optional lead under 🔴 |
| `FAST2SMS_PHONE_NUMBER_ID` | optional (auto) |
| `FAST2SMS_MESSAGE_ID` | optional (template fallback) |

4. Select function **`activateNewsBulletin`** → **Run** → approve permissions.
5. Confirm the AGILE Security News message on WhatsApp. A daily trigger is installed automatically.

Helpers:
- `previewNewsBulletin` — print full AGILE copy in logger (no send)
- `listWhatsAppAssets` — dump WABA numbers / templates
- `sendNewsBulletin` — send once without changing triggers
- `deactivateNewsBulletin` — remove the daily trigger

## Node (local / CI)

```bash
cd news-bulletin
cp .env.example .env
# paste FAST2SMS_API_KEY into .env
node send.js --preview  # print AGILE bulletin body
node send.js --list     # inspect WABA + templates
node send.js            # send full copy via WhatsApp session
node send.js --sms      # Quick SMS fallback
```

## WhatsApp prerequisites (Fast2SMS)

1. Complete [WhatsApp Business API onboarding](https://www.fast2sms.com/help/how-to-complete-whatsapp-business-api-onboarding-process/) in Fast2SMS.
2. **Full AGILE copy** uses WhatsApp **session** messages (`/dev/whatsapp-session`) — recipient must be inside the 24-hour service window (they messaged you / opted in recently), or use Channel posts separately.
3. Outside the 24h window, Fast2SMS falls back to an **Approved template** (short vars only — not the full newsletter body).
4. Set `BULLETIN_CHANNEL=sms` (or `auto`) for Quick SMS delivery of the full text with only the API key.

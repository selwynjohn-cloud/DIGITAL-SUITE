# Activate AGILE GROUP Security News Bulletin

**Do not use Fast2SMS.** It is unreliable (1:1 session window, template-only fallback, no Channel/groups blast). Treat `send.js` / `Code.gs` in this folder as **retired**. Number `9441009091` is only a leftover Fast2SMS `BULLETIN_TO` — it is **not** how production Security News is shared.

**Production:** Pulse Command Centre — WhatsApp **Channel + groups + email**. See [`LIVE.md`](./LIVE.md).

- Page: https://www.agilegroup-digital.co.in/pulse
- Channel: https://whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y
- Force send: **Pulse Admin** OTP `@agilegroup.co.in` → **Publish now**

If WhatsApp Channel/groups fail (`published: false`, `groupsSent: 0`) while `emailed: true`, paste the locked SHARE packs by hand. Do not retry Fast2SMS.

## Historical Fast2SMS notes (do not run)

The steps below are kept only as a record of the old 1:1 path to `9441009091`. They are **not** the live share method.

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

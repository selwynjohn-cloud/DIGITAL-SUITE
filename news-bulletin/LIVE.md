# Live News Bulletin (production)

Production publisher: **https://www.agilegroup-digital.co.in/pulse**  
Manager portal (OTP `@agilegroup.co.in`): **https://www.agilegroup-digital.co.in/pulse/admin**

## Daily schedule (IST)

| Edition | Time | Cron `edition=` |
|---------|------|-----------------|
| Morning Bulletin | 6:00 AM | `morning` |
| Afternoon Bulletin | 2:00 PM | `afternoon` |
| Evening Bulletin | 10:00 PM | `evening` |

`autoPublish: true` — each edition is auto-published to the WhatsApp Channel + groups at the scheduled time. Missed slots are rescued automatically.

## Cron / status API

```bash
# Status (slots sent today + schedule)
curl -sS 'https://www.agilegroup-digital.co.in/api/pulse/cron?job=status'

# In-slot auto / rescue publish (preferred during the edition window)
curl -sS 'https://www.agilegroup-digital.co.in/api/pulse/cron'

# Publish a specific edition (works inside that edition’s slot window)
curl -sS -X POST 'https://www.agilegroup-digital.co.in/api/pulse/cron?edition=morning' \
  -H 'Content-Type: application/json' -d '{}'
curl -sS -X POST 'https://www.agilegroup-digital.co.in/api/pulse/cron?edition=afternoon' \
  -H 'Content-Type: application/json' -d '{}'
curl -sS -X POST 'https://www.agilegroup-digital.co.in/api/pulse/cron?edition=evening' \
  -H 'Content-Type: application/json' -d '{}'
```

Outside a slot window the API returns `skipped: true, reason: "outside-slot"`. Use **Pulse Admin → Publish now** (signed-in OTP) to force-send Morning / Afternoon / Evening.

## 06 August 2026 — Morning rescue + 2:00 PM Afternoon

| Edition | Sent | Channel | Groups | At (IST) |
|---------|------|---------|--------|----------|
| Morning | yes | yes | 20 | 7:38 AM (rescue / activate) |
| Afternoon | yes | yes | 21 | 2:50 PM (rescue / activate) |
| Evening | no | — | — | due 10:00 PM |

**Morning:** Slot was still `sent: false` in the retry window. Rescued via in-slot `GET /api/pulse/cron`. Flash lead: Toll suspended on Rs 4,200 Kanpur-Lucknow Expressway just 13 days after opening.

**Afternoon (2:00 PM):** Still unsent at ~2:49 PM IST (`isRetry: true`). Sent via in-slot `GET /api/pulse/cron` — Channel + **21 groups** + email. Flash lead: Heavy rain lashes Delhi, IMD issues orange alert as waterlogging slows traffic. Confirm status: `confirmed-ok`.

Full bulletin page: https://www.agilegroup-digital.co.in/pulse  
WhatsApp channel: https://whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y

## 05 August 2026 — 6:00 AM activate

| Edition | Sent | Channel | Groups | At (IST) |
|---------|------|---------|--------|----------|
| Morning | yes | yes | 21 | 7:40 AM (rescue / activate) |
| Afternoon | no | — | — | due 2:00 PM |
| Evening | no | — | — | due 10:00 PM |

Activated via in-slot `GET /api/pulse/cron` during the Morning retry window (`autoPublish: true`). Bulletin page + WhatsApp Channel updated; flash + full AGILE copy distributed to **21 groups**; email sent.

## 04 August 2026 — 6:00 PM activate check

| Edition | Sent | Channel | Groups | At (IST) |
|---------|------|---------|--------|----------|
| Morning | yes | yes | 21 | 6:50 AM |
| Afternoon | yes | yes | 19 | 8:22 PM (rescue) |
| Evening | no | — | — | due 10:00 PM |

> **6:00 PM note:** There is **no dedicated 6:00 PM edition** in production. Schedule remains **6:00 AM / 2:00 PM / 10:00 PM IST**.

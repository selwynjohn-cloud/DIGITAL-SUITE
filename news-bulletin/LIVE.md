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

## 09 August 2026 — 10:00 PM share (Evening)

| Edition | Sent | Channel | Groups | At (IST) |
|---------|------|---------|--------|----------|
| Morning | yes | yes | 21 | 6:21 AM |
| Afternoon | no | — | — | missed |
| Evening | yes | yes | 21 | 10:02 PM |

Shared via in-slot `GET /api/pulse/cron` during the Evening window (`autoPublish: true`, `inSlot: true`, `edition: Evening Edition`). Bulletin page + WhatsApp Channel updated; flash + full AGILE copy distributed to **21 groups**; email sent; **29** stories.

Lead: *Two killed, 24 hurt as Kerala RTC bus overturns on Bengaluru-Mysuru E-way*

Full bulletin page: https://www.agilegroup-digital.co.in/pulse  
WhatsApp channel: https://whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y

## 08 August 2026 — 6:00 AM share

| Edition | Sent | Channel | Groups | At (IST) |
|---------|------|---------|--------|----------|
| Morning | yes | yes | 20 | 6:20 AM |
| Afternoon | no | — | — | due 2:00 PM |
| Evening | no | — | — | due 10:00 PM |

Shared via in-slot `GET /api/pulse/cron` during the Morning window (`autoPublish: true`, `inSlot: true`). Bulletin page + WhatsApp Channel updated; flash + full AGILE copy distributed to **20 groups**; email sent; **33** stories.

Lead: *Heavy Rain Chokes Delhi-Gurugram Traffic, Major Roads Waterlogged, Vehicles Stuck For Kms*

Full bulletin page: https://www.agilegroup-digital.co.in/pulse  
WhatsApp channel: https://whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y

## 07 August 2026 — 6:00 AM activate / share

| Edition | Sent | Channel | Groups | At (IST) |
|---------|------|---------|--------|----------|
| Morning | yes | yes | 19 | 7:16 AM (rescue / share) |
| Afternoon | no | — | — | due 2:00 PM |
| Evening | no | — | — | due 10:00 PM |

Activated via in-slot `GET /api/pulse/cron` during the Morning retry window (`autoPublish: true`). Bulletin page + WhatsApp Channel updated; flash + full AGILE copy distributed to **19 groups**; email sent; **32** stories.

Lead: *Maharashtra districts on alert as Mumbai sees heavy rainfall*

Full bulletin page: https://www.agilegroup-digital.co.in/pulse  
WhatsApp channel: https://whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y

## 06 August 2026 — 6:00 PM activate check

Checked at **~7:16 PM IST**. There is **no dedicated 6:00 PM edition**. Closest live send: **Afternoon** (already published).

| Edition | Sent | Channel | Groups | At (IST) |
|---------|------|---------|--------|----------|
| Morning | yes | yes | 20 | 7:38 AM |
| Afternoon | yes | yes | 21 | 2:50 PM |
| Evening | no | — | — | due 10:00 PM |

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

# Live News Bulletin (production)

Production publisher: **https://www.agilegroup-digital.co.in/pulse**  
Manager portal (OTP `@agilegroup.co.in`): **https://www.agilegroup-digital.co.in/pulse/admin**

## Daily schedule (IST)

| Edition | Time | Cron `edition=` |
|---------|------|-----------------|
| Morning Bulletin | 6:00 AM | `morning` |
| Afternoon Bulletin | 2:00 PM | `afternoon` |
| Evening Bulletin | 6:00 PM | `evening` |

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

## 13 August 2026 — 6:00 AM Morning share

Checked at **~8:56 AM IST**. Live Pulse page shows **Morning Edition** for **13 August 2026 (Thursday)**. Morning cron slot has closed (`skipped: true, reason: "outside-slot"` on `GET/POST /api/pulse/cron` and `?edition=morning` / `force=1`). Status API no longer returns the full slots table (same outside-slot payload). **Channel + groups not auto-blasted** (`published: false`, `groupsSent: 0`, `emailed: false`).

| Edition | Sent | Channel | Groups | At (IST) |
|---------|------|---------|--------|----------|
| Morning | page yes / WA no | no* | 0* | page live · force via Admin |
| Afternoon | no | — | — | due 2:00 PM |
| Evening | no | — | — | due schedule |

\*Force WhatsApp Channel + groups + email: **https://www.agilegroup-digital.co.in/pulse/admin** → OTP `@agilegroup.co.in` → **Publish now** (Morning).

Lead flash: *2 Children Among 7 Dead In Landslide In Mumbai's Kurla*

Also flashing: Delhi Red Fort blast / AQIS UN report · Air India captain investigated after drug reports · SNGPL gas leakage deaths · Maharashtra ATS meth seizure · Kolathur chain snatching

Copy-paste packs: [`SHARE-2026-08-13-morning.txt`](./SHARE-2026-08-13-morning.txt) (msg2) · [`SHARE-2026-08-13-morning-flash.txt`](./SHARE-2026-08-13-morning-flash.txt) (msg1)

Full bulletin page: https://www.agilegroup-digital.co.in/pulse  
WhatsApp channel: https://whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y

**Security Question of the Day (sq13):** For minor bleeding from a cut, the correct first aid is to:  
A) Apply firm direct pressure with a clean cloth · B) Rub the wound hard · C) Leave it open in the air · D) Apply mud to it

## 11 August 2026 — 2:00 PM Afternoon share

Checked at **~7:30 PM IST**. Live Pulse page shows **Evening Edition** for **11 August 2026 (Tuesday)** (production schedule: Morning 6:00 AM / Afternoon 2:00 PM / Evening **6:00 PM** IST). Afternoon slot has passed; Evening already auto-published.

| Edition | Sent | Channel | Groups | At (IST) |
|---------|------|---------|--------|----------|
| Morning | yes* | yes* | — | due 6:00 AM |
| Afternoon | yes* | yes* | — | due 2:00 PM (page rolled forward) |
| Evening | yes | yes | 20 | live now · email sent · **29** stories |

\*Cron status API currently returns only the active Evening edition (`published: true`, `groupsSent: 20`, `emailed: true`, `confirm.sent: false`). `POST ?edition=afternoon` / `force=1` returns Evening status / `outside-slot` — cannot republish Afternoon without **Pulse Admin → Publish now** (OTP `@agilegroup.co.in`).

Lead flash: *Pune-Mumbai Missing Link To Remain Closed For 3 Hours On August 12 – Heres All You Need To Know*

Also flashing: Himachal rain / Chandigarh-Manali highway shut · Air India CEO after Phuket flight incident · Kashmir high alert ahead of Independence Day · HP orange alert (Kangra, Mandi & Sirmaur)

WhatsApp Channel + **20 groups** already carrying today’s bulletin; full Afternoon AGILE copy shared below / in agent chat for re-post.

Full bulletin page: https://www.agilegroup-digital.co.in/pulse  
WhatsApp channel: https://whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y

## 09 August 2026 — 6:00 AM share

| Edition | Sent | Channel | Groups | At (IST) |
|---------|------|---------|--------|----------|
| Morning | yes | yes | 21 | 6:21 AM |
| Afternoon | no | — | — | due 2:00 PM |
| Evening | no | — | — | due 10:00 PM |

Shared via in-slot `GET /api/pulse/cron` during the Morning window (`autoPublish: true`, `inSlot: true`). Bulletin page + WhatsApp Channel updated; flash + full AGILE copy distributed to **21 groups**; email sent; **37** stories.

Lead: *Pune Mumbai Expressway Boosts Tunnel Surveillance*

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

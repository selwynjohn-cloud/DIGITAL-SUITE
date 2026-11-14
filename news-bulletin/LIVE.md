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

## Message formats (locked)

1. **WhatsApp News Channel** — short (news + Pulse only). No jobs.
2. **All groups** — fuller (duty line + `https://tinyurl.com/Security-News` + jobs). Never long section menus.

## 05 September 2026 — 6:00 AM Morning share

Shared / published at **7:51:15 AM IST** during the live morning slot (`inSlot: true`, rescue retry). Live Pulse page shows **Morning Edition** for **05 September 2026 (Saturday)**. Cron `GET /api/pulse/cron` returned `published: true`, `groupsSent: 39`, `emailed: true`. Status: `sent: true`, `channelSent: true`, `groupsSent: 39`.

**Feed check (07:55+ IST):** the live page currently has **only 1 RSS news card** — *Heavy rain halts Chardham Yatra…*. Highway / City Flash / Incidents sections are empty. Cron `newsCount: 9` at publish time does **not** match the page. Extra lines still on the page are the IMD ticker (Pune landslide / Mumbai–Worli Dahi Handi), not extra RSS stories. Google News itself still has many India headlines; Pulse’s other category pulls dropped after publish. Cron jobs now return `already-published` (no unsigned refresh).

| Edition | Sent | Channel | Groups | At (IST) |
|---------|------|---------|--------|----------|
| Morning | yes | yes | 39 | **7:51:15 AM** |
| Afternoon | no | — | — | due 2:00 PM |
| Evening | no | — | — | due 10:00 PM |

Lead flash: *Heavy rain halts Chardham Yatra in Kedarnath: Floodwater enters 150 homes in Kanpur, 16 districts flooded*

Also on page (IMD box only): Maharashtra monsoon / Pune landslide kills three · Mumbai Worli diversions for Parivartan Dahi Handi 2026

Copy-paste packs (newly designed): [`SHARE-2026-09-05-morning-channel.txt`](./SHARE-2026-09-05-morning-channel.txt) (Channel) · [`SHARE-2026-09-05-morning-groups.txt`](./SHARE-2026-09-05-morning-groups.txt) (All groups)

Full bulletin page: https://www.agilegroup-digital.co.in/pulse  
WhatsApp channel: https://whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y

**Security Question of the Day (sq100):** Posting photos of the site, guards, or CCTV on personal WhatsApp status is:  
A) Good publicity · B) Not allowed — it can leak security details; use only official company channels if asked · C) Allowed after midnight · D) Allowed if you hide the company board

**Week 35 winners:** Mr. ShaijoJoseph (AG-2026W35-6558) · Mr. Shaijin (AG-2026W35-3407)

**Next edition:** Afternoon Bulletin — **2:00 PM IST**

## 03 September 2026 — 6:00 AM Morning share

Shared / published at **7:36:00 AM IST** during the live morning slot (`inSlot: true`, rescue retry). Live Pulse page shows **Morning Edition** for **03 September 2026 (Thursday)**. Cron status: `sent: true`, `channelSent: true`, `groupsSent: 39`, `emailed: true`.

| Edition | Sent | Channel | Groups | At (IST) |
|---------|------|---------|--------|----------|
| Morning | yes | yes | 39 | **7:36:00 AM** |
| Afternoon | no | — | — | due 2:00 PM |
| Evening | no | — | — | due 10:00 PM |

Lead flash: *Child dies, 53 fall ill after mass malaria medication drive in Andhra Pradesh*

Also flashing: Hyderabad fake-currency racket (3 held, ₹2.91 lakh) · Lucknow 12-foot road pit / bike fall · Dahi Handi 2026 Mumbai routes · Hyderabad hit-and-run viral video · Delhi HC bail (S.437 CrPC) · Delhi niece held for uncle murder · IMD Red Alert Odisha · Uttarakhand orange alert

Copy-paste packs (newly designed): [`SHARE-2026-09-03-morning-channel.txt`](./SHARE-2026-09-03-morning-channel.txt) (Channel) · [`SHARE-2026-09-03-morning-groups.txt`](./SHARE-2026-09-03-morning-groups.txt) (All groups)

Full bulletin page: https://www.agilegroup-digital.co.in/pulse  
WhatsApp channel: https://whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y

**Next edition:** Afternoon Bulletin — **2:00 PM IST**

## 01 September 2026 — 6:00 AM Morning share

Shared / published at **6:18:43 AM IST** during the live morning slot (`inSlot: true`). Live Pulse page shows **Morning Edition** for **01 September 2026 (Tuesday)**. Cron status: `sent: true`, `channelSent: true`, `groupsSent: 39`.

| Edition | Sent | Channel | Groups | At (IST) |
|---------|------|---------|--------|----------|
| Morning | yes | yes | 39 | **6:18:43 AM** |
| Afternoon | no | — | — | due 2:00 PM |
| Evening | no | — | — | due 10:00 PM |

Lead flash: *Row over Malala’s book intensifies in Ahmedabad: Students set 72-hour protest deadline as no arrests made*

Also flashing: Delhi moving-bus rape case arrests · Mumbai-Goa Highway / Ratnagiri teenage girls injured · Delhi Police dedicated cells for bomb hoaxes & cybercrimes against women/children · Himachal monsoon death toll 256 · Uttarakhand school holidays amid rain

Copy-paste packs (newly designed): [`SHARE-2026-09-01-morning-channel.txt`](./SHARE-2026-09-01-morning-channel.txt) (Channel) · [`SHARE-2026-09-01-morning-groups.txt`](./SHARE-2026-09-01-morning-groups.txt) (All groups)

Full bulletin page: https://www.agilegroup-digital.co.in/pulse  
WhatsApp channel: https://whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y

**Next edition:** Afternoon Bulletin — **2:00 PM IST**

## 31 August 2026 — 10:00 PM Evening share

Shared / published at **~10:09 PM IST** during the live evening slot (`inSlot: true`). Live Pulse page shows **10:00 PM Edition** for **31 August 2026 (Monday)**. Cron `GET /api/pulse/cron` and `POST ?edition=evening` both returned `published: true`, `groupsSent: 39`, `emailed: true`.

| Edition | Sent | Channel | Groups | At (IST) |
|---------|------|---------|--------|----------|
| Morning | no | no | 0 | — |
| Afternoon | yes | yes | 39 | 2:29:24 pm |
| Evening | yes | yes | 39 | **10:09:04 pm** |

Lead flash: *Monsoon alert: Heavy rainfall expected in several states till September 6. What's for Delhi-NCR?*

Also flashing: Navi Mumbai Sanpada housekeeping fraud (₹10.16 Lakh) · Delhi playschool assault case · Karnataka doctor cheated ₹1.79 crore by fake cyber crime officer · Air India bomb-note divert to Ahmedabad · Delhi Police 72-hour crackdown · Nashik Samruddhi Mahamarg slash-and-rob patrols · IMD Red Warning Sundargarh & Keonjhar (Odisha)

Copy-paste packs: [`SHARE-2026-08-31-evening.txt`](./SHARE-2026-08-31-evening.txt) (msg2) · [`SHARE-2026-08-31-evening-flash.txt`](./SHARE-2026-08-31-evening-flash.txt) (msg1)

Full bulletin page: https://www.agilegroup-digital.co.in/pulse  
WhatsApp channel: https://whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y

**Security Question of the Day (sq42):** A delivery boy wants to enter the office floors alone with a large parcel. You should:  
A) Send him up alone to save time · B) Verify the host, issue a pass, and escort or announce as per SOP · C) Keep the parcel and send him away without a record · D) Ask him to leave the parcel on the road

**Week 35 winners:** Mr. ShaijoJoseph (AG-2026W35-6558) · Mr. Shaijin (AG-2026W35-3407)

**Next edition:** Morning Bulletin — **6:00 AM IST** (tomorrow)

## 13 August 2026 — 10:00 PM Evening activate / share

Activated / shared at **~11:44 PM IST**. Live Pulse page shows **Evening Edition** for **13 August 2026 (Thursday)**. Evening cron slot closed (`skipped: true, reason: "outside-slot"` on `GET/POST /api/pulse/cron` and `?edition=evening` / `force=1`). No cron secret in agent env. **Channel + groups not auto-blasted** (`published: false`, `groupsSent: 0`, `emailed: false`).

| Edition | Sent | Channel | Groups | At (IST) |
|---------|------|---------|--------|----------|
| Morning | page earlier / WA no* | no* | 0* | see morning note |
| Afternoon | rolled | — | — | — |
| Evening | page yes / WA no | no* | 0* | page live · **Admin Publish now required** |

\*Force WhatsApp Channel + groups + email: **https://www.agilegroup-digital.co.in/pulse/admin** → OTP `@agilegroup.co.in` → **Publish now** (Evening).

Lead flash: *Sonamarg Cloudburst Triggers Massive Landslide Near Zojila Pass, Srinagar-Leh Highway Blocked*

Also flashing: Mumbai rain / IMD yellow alert · Delhi man survives 2 murder attempts, killed in 3rd · Jharkhand students protest / policeman injured · Lucknow influencer threats · Bihar arrests in 2025 Karnataka cash van case

Copy-paste packs: [`SHARE-2026-08-13-evening.txt`](./SHARE-2026-08-13-evening.txt) (msg2) · [`SHARE-2026-08-13-evening-flash.txt`](./SHARE-2026-08-13-evening-flash.txt) (msg1)

Full bulletin page: https://www.agilegroup-digital.co.in/pulse  
WhatsApp channel: https://whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y

**Security Question of the Day (sq13):** For minor bleeding from a cut, the correct first aid is to:  
A) Apply firm direct pressure with a clean cloth · B) Rub the wound hard · C) Leave it open in the air · D) Apply mud to it

**Next edition:** Morning Bulletin — **6:00 AM IST** (tomorrow)

## 13 August 2026 — 6:00 AM Morning send

Checked / send attempted at **~8:56–9:01 AM IST**. Live Pulse page shows **Morning Edition** for **13 August 2026 (Thursday)**. Morning cron slot has closed (`skipped: true, reason: "outside-slot"` on `GET/POST /api/pulse/cron`, `?edition=morning`, and all `force=1` / `confirm=SEND` variants). No `CRON_SECRET` / `PULSE_CRON_SECRET` / `FAST2SMS_API_KEY` in this agent env. Admin API `publishNow` requires OTP. **Channel + groups not sent** (`published: false`, `groupsSent: 0`, `emailed: false`).

| Edition | Sent | Channel | Groups | At (IST) |
|---------|------|---------|--------|----------|
| Morning | page yes / WA no | no* | 0* | page live · **Admin Publish now required** |
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

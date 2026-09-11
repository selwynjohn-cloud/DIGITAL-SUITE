# Live News Bulletin (production)

Production publisher: **https://www.agilegroup-digital.co.in/pulse**  
Manager portal (OTP `@agilegroup.co.in`): **https://www.agilegroup-digital.co.in/pulse/admin**

**Ops rule:** Pulse auto-publishes; Cursor agents are status + code only. See [`OPERATING.md`](./OPERATING.md).  
**Force Publish gap / fix:** [`FORCE-PUBLISH-FIX.md`](./FORCE-PUBLISH-FIX.md).

## Daily schedule (IST)

| Edition | Time | Cron `edition=` |
|---------|------|-----------------|
| Morning Bulletin | 6:00 AM | `morning` |
| Afternoon Bulletin | 2:00 PM | `afternoon` |
| Evening Bulletin | 10:00 PM | `evening` |

`autoPublish: true` — each edition is auto-published to the WhatsApp Channel + groups at the scheduled time. Missed slots are rescued automatically **when cron auth (`tokenOk`) works**.

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

Outside a slot window the API returns `skipped: true, reason: "outside-slot"`. Use **Pulse Admin → Force Publish** (signed-in OTP) to force-send Morning / Afternoon / Evening.

Unauthenticated cron echoes `tokenOk: false` and will not blast groups. Production needs `PULSE_CRON_SECRET` (and Vercel Cron wiring).

## Message formats (locked)

1. **WhatsApp News Channel** — short (news + Pulse only). No jobs.
2. **All groups** — fuller (duty line + `https://tinyurl.com/Security-News` + jobs). Never long section menus.

## 11 September 2026 — 6:00 AM Morning (Force Publish needed)

Checked during morning **retry** window (`inSlot: true`, `isRetry: true`). Live Pulse page shows **Morning Edition** for **11 September 2026 (Friday)** with **14** stories. Cron: `published: false`, `groupsSent: 0`, `emailed: true`, `tokenOk: false`. Status slots: Morning/Afternoon/Evening all `sent: false`, `channelSent: false`, `groupsSent: 0`.

| Edition | Sent | Channel | Groups | At (IST) |
|---------|------|---------|--------|----------|
| Morning | page yes / WA no | no* | 0* | page live · **Force Publish required** |
| Afternoon | no | — | — | due 2:00 PM |
| Evening | no | — | — | due 10:00 PM |

\*Admin UI has **no Force Publish button** (confirmed). Workaround + permanent patch: [`FORCE-PUBLISH-FIX.md`](./FORCE-PUBLISH-FIX.md).

Lead flash: *Monsoon revival in Mumbai: IMD issues yellow alert; heavy rainfall in Thane, Palghar*

Also: Northern Railway Delhi-NCR disruptions · Ludhiana illegal PG safety checks · BRICS Delhi fortification · IndiGo bomb-threat diversion to Ahmedabad · IMD Karnataka/Odisha red alerts · Agile client appreciation (P. V. Sindhu Academy)

Copy-paste packs: [`SHARE-2026-09-11-morning-channel.txt`](./SHARE-2026-09-11-morning-channel.txt) (Channel) · [`SHARE-2026-09-11-morning-groups.txt`](./SHARE-2026-09-11-morning-groups.txt) (All groups)

Full bulletin page: https://www.agilegroup-digital.co.in/pulse  
WhatsApp channel: https://whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y

**Week 35 winners:** Mr. ShaijoJoseph (AG-2026W35-6558) · Mr. Shaijin (AG-2026W35-3407)

**Next edition:** Afternoon Bulletin — **2:00 PM IST**

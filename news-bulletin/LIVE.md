# Live News Bulletin (production)

Production publisher: **https://www.agilegroup-digital.co.in/pulse**

## Daily schedule (IST)

| Edition | Time |
|---------|------|
| Morning Bulletin | 6:00 AM |
| Afternoon Bulletin | 2:00 PM |
| Evening Bulletin | 10:00 PM |

`autoPublish: true` — each edition is auto-published to the WhatsApp Channel + groups at the scheduled time.

## Cron / status API

```bash
# Status (current edition)
curl -sS 'https://www.agilegroup-digital.co.in/api/pulse/cron'

# Publish a specific edition (also used by the scheduler)
curl -sS -X POST 'https://www.agilegroup-digital.co.in/api/pulse/cron?edition=morning'
curl -sS -X POST 'https://www.agilegroup-digital.co.in/api/pulse/cron?edition=afternoon'
curl -sS -X POST 'https://www.agilegroup-digital.co.in/api/pulse/cron?edition=evening'
```

Full bulletin page: https://www.agilegroup-digital.co.in/pulse  
WhatsApp channel: https://whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y

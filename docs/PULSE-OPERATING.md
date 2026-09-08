# Agile Pulse — operating rule

Pulse cron drafts and blasts WhatsApp (Channel + groups) at **6:00 AM · 2:00 PM · 10:00 PM IST**.

Cursor / agents: status checks and code fixes only — never the WhatsApp blast path.

Director: check ~15–20 min after each slot; if miss/bad → Admin OTP → **Publish now**.

## Quality gate before send

- ≥ 5 stories, ≥ 3 sections, one story per event  
- Failure → Admin WhatsApp alert; no send  
- Success → edition snapshot frozen on `/pulse` until next edition

Admin: https://www.agilegroup-digital.co.in/pulse/admin  
Status: `GET /api/pulse/cron?job=status`

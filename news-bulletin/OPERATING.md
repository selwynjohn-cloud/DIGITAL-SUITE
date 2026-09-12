# Agile Pulse — operating rule (from 08 Sep 2026)

## Who does what

| Role | Responsibility |
|------|----------------|
| **Pulse machine** (Vercel cron) | Drafts the edition, runs quality gate, sends Channel + groups at **6:00 AM · 2:00 PM · 10:00 PM IST** |
| **Director** | ~15–20 min after each slot, check status. If miss or bad pack → Admin OTP → **Publish now** |
| **Cursor / agents** | Status checks + code fixes only. **Never** treat a WhatsApp share pack as the blast path |

## Group WhatsApp copy (Director rule)

Group blasts must **not** include:
- `https://whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y`
- `https://tinyurl.com/Security-News`

Keep news + jobs + website only. Channel link stays on the Channel post (`msg1`), not groups.

## Good prompts for agents

- “Did Morning send? channel? groups?”
- “Fix Pulse duplicate / quality gate”
- “Why did quality fail for Afternoon?”

## Avoid

- “Share today’s 6am bulletin” as the send path (agents drafting `SHARE-*.txt` must not replace the machine)

## Emergency send

1. Open https://www.agilegroup-digital.co.in/pulse/admin  
2. OTP for `sai@` / `director@` `@agilegroup.co.in`  
3. **Publish now** for the edition that failed  

## Quality gate (after deploy of fix branch)

Send is blocked unless the pack has:

- ≥ **5** news stories  
- ≥ **3** topic sections  
- **One story per real-world event** (same-event duplicates blocked)  
- Fresh news within policy age  

On failure, Admin WhatsApp gets an alert. On success, `/pulse` freezes to the sent pack until the next edition (edition snapshot).

## Status check

```bash
curl -sS 'https://www.agilegroup-digital.co.in/api/pulse/cron?job=status'
```

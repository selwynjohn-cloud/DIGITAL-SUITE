# Agile Pulse — operating rule (from 08 Sep 2026)

## Who does what

| Role | Responsibility |
|------|----------------|
| **Pulse machine** (Vercel cron) | Drafts the edition, runs quality gate, sends Channel + groups at **6:00 AM · 2:00 PM · 10:00 PM IST** |
| **Director** | ~15–20 min after each slot, check status. If miss or bad pack → Admin OTP → **Force Publish / Publish now** |
| **Cursor / agents** | Status checks + code fixes only. **Never** treat a WhatsApp share pack as the blast path |

## Good prompts for agents

- “Did Morning send? channel? groups?”
- “Fix Pulse duplicate / quality gate”
- “Why did quality fail for Afternoon?”
- “Force Publish button missing — fix admin”

## Avoid

- “Share today’s 6am bulletin” as the send path (agents drafting `SHARE-*.txt` must not replace the machine)

## Emergency send

1. Open https://www.agilegroup-digital.co.in/pulse/admin  
2. OTP for `sai@agilegroup.co.in` / `director@agilegroup.co.in`  
3. **Force Publish** for the edition that failed  

If the button is missing, use the console workaround in [`FORCE-PUBLISH-FIX.md`](./FORCE-PUBLISH-FIX.md).

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

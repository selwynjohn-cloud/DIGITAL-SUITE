# Agile Guards — login check (12 Aug 2026, ~10:48 PM IST)

Live app **07 — Agile Guards** (“Caring for Those Who Protect”) on the Command Centre.

## Verdict

OTP email sending is **working**. Login fails when the **Management** portal is used with any email other than IT / Sai / Director.

| Portal | URL | Who can request a PIN |
|--------|-----|------------------------|
| **HOD / Staff** (use this) | https://www.agilegroup-digital.co.in/guards | Any `@agilegroup.co.in` work email, then select branch |
| **Management** | https://www.agilegroup-digital.co.in/guards?portal=management | **Only** `it@agilegroup.co.in`, `sai@agilegroup.co.in`, `director@agilegroup.co.in` |

### API checks (live)

```text
POST /api/auth/app-otp  action=send  appId=guards  role=management
  email=selwyn@agilegroup.co.in
  → error: "Management portal is only for IT, Sai, and Director (@agilegroup.co.in). Use HODs / Staff for branch access."

POST /api/auth/app-otp  action=send  appId=guards  role=staff
  email=selwyn@agilegroup.co.in
  → ok: PIN sent (check inbox + spam, valid ~15 minutes)

POST /api/auth/app-otp  action=send  appId=guards  role=staff
  email=selwyn.john@gmail.com
  → error: "Use your @agilegroup.co.in work email."
```

Branch list for HOD step loads OK (**20** branches via `POST /api/auth/branch-login`).

Guards do **not** sign in to this portal. Guard phone flow (no login):  
https://www.agilegroup-digital.co.in/guards/register

## How to sign in now (HOD)

1. Open **https://www.agilegroup-digital.co.in/guards**  
   (not `?portal=management`, and not a long `vercel.app` link)
2. Enter your **`@agilegroup.co.in`** email (example that works for PIN send: `selwyn@agilegroup.co.in`)
3. Tap **Send PIN** → check **inbox and junk/spam** (PIN is also in the email subject)
4. Enter the **6-digit PIN** → **Sign in**
5. **Select your branch** → Continue  
   Hyderabad: choose **Hyderabad - A** or **Hyderabad - B** (not a generic “Hyderabad”)

### If you need Management (all branches)

Sign in only as:

- `director@agilegroup.co.in`
- `it@agilegroup.co.in`
- `sai@agilegroup.co.in`

URL: https://www.agilegroup-digital.co.in/guards?portal=management

## Command Centre tip

On https://www.agilegroup-digital.co.in open **Agile Guards** with the **Staff / HOD** button, not **Management**, unless you are IT / Sai / Director.

## Help pages

- Manual: https://www.agilegroup-digital.co.in/guards/manual  
- Troubleshooting: https://www.agilegroup-digital.co.in/guards/troubleshooting  

## Note on source

The live Vercel app (`agilegroup-digital.co.in`) is **not** in this GitHub repo (`DIGITAL-SUITE` is ops notes + news-bulletin helpers). Widening the Management allowlist (e.g. adding `selwyn@agilegroup.co.in`) needs a change in that deployed auth code (`/api/auth/app-otp` dual-portal admin list), not in this repo.

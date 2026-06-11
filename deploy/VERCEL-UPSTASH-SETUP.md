# Vercel + Upstash Redis — Command Centre login (Staff & Management)

Both **HODs/Staff** and **Management** login use the **same** `/api/auth/send-pin` API and the **same** Upstash Redis database. You only need **one** Redis integration.

---

## Step 1 — Create Upstash Redis (free tier is fine)

1. Open [console.upstash.com](https://console.upstash.com) and sign in (GitHub/Google is fine).
2. **Create Database**
   - Name: `agile-command-centre-pins`
   - Region: pick **ap-south-1 (Mumbai)** if available (closest to India), otherwise Singapore or US.
   - Type: **Regional**
3. Open the new database → tab **REST API**
4. Copy:
   - **UPSTASH_REDIS_REST_URL** (starts with `https://….upstash.io`)
   - **UPSTASH_REDIS_REST_TOKEN** (long secret string)

---

## Step 2 — Add to Vercel (one project: agilgroup-digital)

1. Open [vercel.com](https://vercel.com) → your **agilgroup-digital** project
2. **Settings** → **Environment Variables**
3. Add each variable below for **Production**, **Preview**, and **Development**:

| Variable | Example / notes |
|----------|-----------------|
| `UPSTASH_REDIS_REST_URL` | `https://xxxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | paste token from Upstash |
| `AUTH_SECRET` | long random string (32+ chars). Generate: `openssl rand -base64 32` |
| `RESEND_API_KEY` | from [resend.com](https://resend.com) — sends PIN emails |
| `EMAIL_FROM` | `Command Centre <noreply@agilegroup.co.in>` (domain must be verified in Resend) |
| `ALLOWED_EMAIL_DOMAIN` | `agilegroup.co.in` |
| `SUPER_ADMIN_PIN` | your 6-digit Director Master PIN |
| `SUPER_ADMIN_EMAILS` | `director@agilegroup.co.in,selwyn.john@gmail.com` |
| `AUTH_COOKIE_DOMAIN` | `.agilegroup-digital.co.in` (only if using that domain on Vercel) |

### Faster: Vercel Marketplace integration

1. Vercel project → **Storage** → **Create** → **Upstash Redis**
2. Link to this project — Vercel auto-adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
3. You still must add `AUTH_SECRET`, `RESEND_API_KEY`, etc. manually

---

## Step 3 — Redeploy

After saving env vars:

**Deployments** → latest deployment → **⋯** → **Redeploy**

(New env vars do not apply until redeploy.)

---

## Step 4 — Test both logins

| Test | Steps |
|------|--------|
| **Staff / HOD** | Open Command Centre → any app → **HODs/Staff** → email → **Send PIN** → enter PIN from email |
| **Management** | Same app → **Management** → email → **Send PIN** |
| **Director** | Enter Director email → **Director — use Master PIN** → `SUPER_ADMIN_PIN` (no email, no Redis needed for this path) |

If Redis is OK, you will **not** see “PIN storage is not configured”.

---

## Troubleshooting

| Message | Fix |
|---------|-----|
| PIN storage is not configured | Add both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, then redeploy |
| RESEND_API_KEY is not configured | Add Resend key + verified sender domain |
| AUTH_SECRET is not configured | Add `AUTH_SECRET` and redeploy |
| PIN sent but email not received | Check Resend dashboard, spam folder, verify `EMAIL_FROM` domain |
| Director Master PIN fails | Set `SUPER_ADMIN_PIN` and `SUPER_ADMIN_EMAILS` in Vercel |

---

## Note: Apps with their own login

These **do not** use Command Centre Redis (they use Google Apps Script OTP):

- Agile Reviews (App 10)
- Agile Pulse (App 11) — after you set `VITE_PULSE_URL` + `usesOwnAuth`
- Agile MIS, CRM, Mobile

Command Centre Redis is only for hub apps that show the PIN modal on agilegroup-digital.co.in.

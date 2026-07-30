# Go live on www.agilegroup-digital.co.in

**For Selwyn — plain English.** Technical work is mostly done in the app. You only need to do **Step 1** below in your browser (GoDaddy + Vercel). We can help with each click if you say **done** after each step.

---

## What is already prepared in the software

- Links and messages use **agilegroup-digital.co.in** (not the old Vercel-only address).
- **Command Centre** email PIN login (when Vercel env vars are set — see `deploy/VERCEL-UPSTASH-SETUP.md`).
- **Director Master PIN** on Training Management / Lecturer login (demo **890123** until you set your own on Vercel).
- **Training** opens from the hub at **/training/** on the same website.

---

## Step 1 — Connect the website name (you do this once)

1. Open **vercel.com** and sign in.
2. Open project **agilgroup-digital** (Command Centre — 18 apps).
3. **Settings → Domains → Add** → type **agilegroup-digital.co.in** → Add.
4. Add **www.agilegroup-digital.co.in** as well.
5. If Vercel says the name is on another project, remove it there first, then add again here.
6. Wait for a **green tick** (Valid Configuration).

Reply **done** when both names show green, or tell me what you see on screen.

---

## Step 2 — Promote the latest 18-app build (after Step 1)

On Vercel → **Deployments** → latest deployment → **⋯** → **Promote to Production**.

---

## Step 3 — Test in a private window

Open: **https://www.agilegroup-digital.co.in**

You should see **18 live · 18 applications**.

---

## Step 4 — Real SMS & email OTP (Training app)

On Vercel project **guard-training-app** → **Environment Variables** → Production:

| Variable | Purpose |
|----------|---------|
| `VITE_BASE_PATH` | `/training/` |
| `VITE_COMMAND_CENTRE_URL` | `https://www.agilegroup-digital.co.in/` |
| `VITE_TRAINING_URL` | `https://www.agilegroup-digital.co.in/training/` |
| `VITE_TRAINING_API_URL` | Your Google Apps Script `/exec` URL (when ready) |
| `VITE_DIRECTOR_MASTER_PIN` | Your private 6+ digit Director passcode |

Redeploy **guard-training-app** after saving variables.

---

## Step 5 — Command Centre email PIN (hub apps 04–09, etc.)

See: **deploy/VERCEL-UPSTASH-SETUP.md** (Upstash + Resend on **agilgroup-digital** project).

---

## Quick links after go-live

| What | Address |
|------|---------|
| Command Centre (18 apps) | https://www.agilegroup-digital.co.in |
| Training — Trainee | https://www.agilegroup-digital.co.in/training/?portal=trainee |
| Training — Management | https://www.agilegroup-digital.co.in/training/?portal=management |

---

## If Safari still shows 12 apps

Use a **Private Window** or **Develop → Empty Caches**. The domain may still point at an old Production build until Step 2 is done.

---

*Last updated: go-live preparation — PIN login wired on Command Centre hub apps.*

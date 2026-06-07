# GoDaddy deployment — Full digital suite
## Domain: agilgroup-digital.co.in

```
agilgroup-digital.co.in/              → Command Centre (hub)
agilgroup-digital.co.in/training/     → PSARA Training app
agilgroup-digital.co.in/recruitment/  → (future)
agilgroup-digital.co.in/crm/          → (future)
```

---

## Step 1 — Build both apps

```bash
# Command Centre (main page)
cd ~/agilgroup-digital
npm install
npm run build
# Upload dist/ → public_html/

# Training app (subfolder)
cd ~/guard-training-app
npm run build:subfolder
# Upload dist/ → public_html/training/
# Copy public/.htaccess.subfolder → training/.htaccess
```

---

## Step 2 — GoDaddy File Manager

```
public_html/
├── index.html          ← from agilgroup-digital/dist
├── .htaccess
├── assets/
├── training/
│   ├── index.html      ← from guard-training-app/dist
│   ├── .htaccess       ← from .htaccess.subfolder
│   └── assets/
```

---

## Step 3 — Enable SSL

cPanel → SSL/TLS → Enable for agilgroup-digital.co.in

---

## Step 4 — Test links

| Page | URL |
|------|-----|
| Command Centre | https://agilgroup-digital.co.in |
| Training (staff) | https://agilgroup-digital.co.in/training/?portal=trainee |
| Training (admin) | https://agilgroup-digital.co.in/training/?portal=admin |

---

## Adding new apps later

1. Edit `agilgroup-digital/src/data/apps.ts` — set `status: 'live'` and URLs
2. Deploy new app to `public_html/your-app/`
3. Rebuild hub if URLs changed

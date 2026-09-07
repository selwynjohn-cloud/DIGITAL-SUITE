# eGate mobile app

Personal **eGate** visitor / gate management app for **egate.co.in**.

Built with **Expo (React Native)** so one codebase ships to:

- Apple App Store (`in.co.egate.app`)
- Google Play (`in.co.egate.app`)

No company (Agile) branding or links.

**Accounts:** Apple Developer + Google Play Console are open.  
**Next:** follow [`STORE_UPLOAD.md`](./STORE_UPLOAD.md) — create the app records, then send Team ID, ASC App ID, and Expo token so we can build & submit.

## What this first version does

- Home — product intro + actions
- Check-in — visitor name, host, purpose, phone
- Gate pass — approve / share / mark exit
- Today — list of check-ins (on-device memory for now)

Backend / WhatsApp host notify can come in a later release.

## Run locally

```bash
cd egate-app
npm install
npx expo start
```

Scan the QR with Expo Go (Android) or Camera (iOS).

## Upload docs

| File | Purpose |
|------|---------|
| `STORE_UPLOAD.md` | Console steps + what to send back |
| `STORE_LISTING.md` | Copy for store listings |
| `privacy.html` | Host at egate.co.in/privacy.html before submit |
| `eas.json` | Build + submit profiles |

```bash
cd egate-app
npm install -g eas-cli
eas login
eas init
eas build --platform all --profile production
eas submit --platform all --profile production
```

### Play note (personal accounts)

New personal Play accounts need **12 testers for 14 days** in closed testing before production.

### Apple note (India)

Enrollment is through the Apple Developer **app**. Seller name will be your legal personal name unless you enroll as an organisation.

## Privacy

This scaffold stores visitor data **only on the device in memory** (cleared when the app restarts). Publish `privacy.html` on egate.co.in before store submission.

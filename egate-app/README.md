# eGate mobile app

Personal **eGate** visitor / gate management app for **egate.co.in**.

Built with **Expo (React Native)** so one codebase ships to:

- Apple App Store (`in.co.egate.app`)
- Google Play (`in.co.egate.app`)

No company (Agile) branding or links.

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

## Accounts you need (one-time)

1. **Apple Developer Program** — $99/year  
   India: enroll in the **Apple Developer** app → [developer.apple.com](https://developer.apple.com)
2. **Google Play Console** — $25 one-time  
   [play.google.com/console](https://play.google.com/console)
3. **Expo account** (free) — for cloud builds  
   [expo.dev/signup](https://expo.dev/signup)

## Upload path (EAS)

```bash
cd egate-app
npm install -g eas-cli
eas login
eas init          # writes real projectId into app.json
eas build --platform android --profile production
eas build --platform ios --profile production
```

Then submit:

```bash
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

### Before first submit

| Item | Where |
|------|--------|
| Replace `REPLACE_AFTER_EAS_INIT` | `app.json` → `extra.eas.projectId` (or run `eas init`) |
| Apple Team ID + App Store Connect App ID | `eas.json` → `submit.production.ios` |
| Play service account JSON | `google-play-service-account.json` (do **not** commit) |
| Store listing screenshots + privacy policy | App Store Connect / Play Console |

### Play note (personal accounts)

New personal Play accounts need **12 testers for 14 days** in closed testing before production.

### Apple note (India)

Enrollment is through the Apple Developer **app**. Seller name will be your legal personal name unless you enroll as an organisation.

## Privacy

This scaffold stores visitor data **only on the device in memory** (cleared when the app restarts). Add a privacy policy URL on egate.co.in before store submission.

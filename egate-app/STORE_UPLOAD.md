# eGate — store upload (accounts are open)

Apple Developer and Google Play Console are ready. Complete these console clicks, then paste the values back so builds can submit.

## A. Create the apps in both consoles

### App Store Connect
1. Open [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps** → **+** → **New App**
2. Platforms: **iOS**
3. Name: **eGate**
4. Bundle ID: register **`in.co.egate.app`** in [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list) if it is not there yet, then select it
5. SKU: `egate-001`
6. User Access: Full Access

Copy and send:
- **Apple Team ID** — received: `3D9CZYWR4Z` ✓
- **Apple ID** email used for the account (likely `selwyn.john@gmail.com`)
- **App Store Connect App ID** (App Information → Apple ID — numeric) — still needed

### Google Play Console
1. Open [play.google.com/console](https://play.google.com/console) → **Create app**
2. App name: **eGate**
3. Default language: English (India) or English (US)
4. App or game: **App**
5. Free / paid: **Free**
6. Declarations: accept

Then create a service account for upload (API access):
1. Play Console → **Setup** → **API access** (or Users and permissions → Invite / service accounts)
2. Link a Google Cloud project → create service account with **Release manager** (or Admin) on the app
3. Download JSON key → do **not** paste it in chat; keep it as `google-play-service-account.json` on your Mac when running `eas submit`

## B. Expo account (required for cloud builds)

1. Sign up / log in at [expo.dev](https://expo.dev)
2. Create access token: [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens)
3. Send the token (or add as secret `EXPO_TOKEN`) so this agent can run:

```bash
cd egate-app
EXPO_TOKEN=… eas init
EXPO_TOKEN=… eas build --platform all --profile production
```

Or run those commands yourself after `eas login` on your computer.

## C. Store listing copy (ready to paste)

**Short description (Play, 80 chars):**  
Calm gate & visitor check-in for desks, societies, and campuses.

**Full description:**  
eGate helps reception desks and gate staff know who is entering — without paper chaos.

• Fast visitor check-in (name, host, purpose)  
• On-device gate pass with share  
• Approve entry and mark exit  
• Today’s visitor list on your phone  

Personal product by John Selwyn — https://egate.co.in  

Visitor details in this first version stay on your device while the app is open.

**Keywords (App Store):** visitor, gate, check-in, pass, reception, society, campus, desk

**Support URL:** https://egate.co.in/  
**Marketing URL:** https://egate.co.in/  
**Privacy policy URL:** https://egate.co.in/privacy.html  

## D. Privacy policy

File ready in this repo: `privacy.html` — host it on egate.co.in before submit.

## E. After you send Team ID + ASC App ID + Expo token

We will:
1. Fill `eas.json` submit fields  
2. Run production Android AAB + iOS IPA builds  
3. Submit to Play **internal** track and App Store Connect  
4. You finish screenshots + review questions in each console  

## Package IDs (already set)

| Platform | ID |
|----------|-----|
| iOS bundle | `in.co.egate.app` |
| Android package | `in.co.egate.app` |
| Version | 1.0.0 |

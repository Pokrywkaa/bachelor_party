# 🎉 Bachelor Party App — Setup Guide

Two Expo React Native apps for the big day: one for participants, one for admins.

---

## Project Structure

```
bachelor_party/
├── apps/
│   ├── participant/   — Participant app (iOS via Expo Go, Android via APK)
│   └── admin/         — Admin app (Bartek + Damian)
├── packages/
│   └── shared/        — Shared types, Firebase client, utilities
├── firebase/
│   ├── functions/     — Cloud Functions (push notifications + scoring)
│   ├── firestore.rules
│   ├── storage.rules
│   └── firebase.json
└── scripts/
    └── seed.js        — One-time Firestore seed script
```

---

## Step 1 — Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `bachelor-party` → disable Google Analytics (optional)
3. In the left sidebar, enable:
   - **Authentication** → Sign-in methods → **Anonymous** → Enable
   - **Firestore Database** → Create database → **Production mode** (rules will be deployed)
   - **Storage** → Get started → **Production mode**
   - **Functions** (requires Blaze plan — upgrade with a $5 spending cap)
4. Go to **Project Settings** → **Your apps** → Add a **Web app**
5. Copy the `firebaseConfig` object shown

---

## Step 2 — Fill in Firebase Config

Open `packages/shared/src/firebase.ts` and replace the placeholders:

```ts
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

---

## Step 3 — Install Dependencies

```bash
# From repo root
pnpm install
```

---

## Step 4 — Deploy Firebase Rules & Functions

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project

# Deploy everything
firebase deploy
```

Or deploy individually:
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only functions
```

---

## Step 5 — Seed Firestore (run once before the event)

1. In Firebase Console → Project Settings → Service Accounts → **Generate new private key**
2. Save the downloaded file as `scripts/serviceAccountKey.json`
3. Install firebase-admin: `npm install -g firebase-admin`
4. Edit `scripts/seed.js`:
   - Change admin PINs (currently `1234` for Bartek, `5678` for Damian)
   - Update participant names if needed
5. Run: `node scripts/seed.js`

> ⚠️ Run the seed script **only once**. Running it again will duplicate participants.

---

## Step 6 — Run the Apps

### Participant App (Expo Go — iOS & Android)

```bash
cd apps/participant
pnpm start
```

- **iOS**: Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) → scan QR code
- **Android**: Scan QR code in Expo Go, OR build APK (see below)

### Admin App

```bash
cd apps/admin
pnpm start
```

Same process — open in Expo Go or build APK.

---

## Step 7 — Build Android APK for Distribution

For participants without Expo Go or for sending a direct APK link:

```bash
npm install -g eas-cli
eas login
eas build:configure   # run once per app

# Build participant APK
cd apps/participant
eas build --platform android --profile preview

# Build admin APK
cd apps/admin
eas build --platform android --profile preview
```

EAS will give you a download URL to share via WhatsApp/Telegram.

> For iOS without Apple Developer account: use **Expo Go** — participants install it from the App Store, then open the `exp://` link you share.

---

## Before the Event — Checklist

- [ ] Firebase project created and configured
- [ ] `packages/shared/src/firebase.ts` filled in
- [ ] Firebase rules deployed
- [ ] Cloud Functions deployed (Blaze plan required)
- [ ] `node scripts/seed.js` run once
- [ ] Both apps tested on a real device
- [ ] Android APK built and link shared with participants (or Expo Go link)
- [ ] Admin PINs communicated privately to Bartek and Damian
- [ ] Groom (Adam) has the participant app ready

---

## Default Participants

| Name       | Role        | PIN    |
|------------|-------------|--------|
| Adam       | Groom       | —      |
| Bartek     | Admin       | 1234   |
| Damian     | Admin       | 5678   |
| Piotr      | Participant | —      |
| Łukasz     | Participant | —      |
| Marcin     | Participant | —      |
| Tomek      | Participant | —      |
| Krzysztof  | Participant | —      |

> Change PINs in `scripts/seed.js` before seeding, or update them via the **Participants** tab in the admin app.

---

## Task Types Supported

| Type       | Description |
|------------|-------------|
| `photo`    | Take or upload a photo |
| `video`    | Record a video (max duration configurable) |
| `audio`    | Record an audio clip |
| `quiz`     | Multiple choice or free text question |
| `gps`      | Check in at a GPS location (within a radius) |
| `timed`    | Complete a task within a countdown |
| `dare`     | Accept or fail a dare |
| `creative` | Creative challenge with optional media |
| `social`   | Social challenge with optional media |
| `memory`   | Memory challenge with optional media |
| `physical` | Physical challenge with optional media |

---

## Scoring

Points are awarded on submission approval:

```
finalPoints = basePoints × (rating / 5) × (isLate ? 0.5 : 1.0)
```

- `basePoints` — set per-task in the admin task library
- `rating` — 1–5 stars given by admin when approving
- Late submissions (after deadline) get 50% points

---

## Troubleshooting

**"Module not found: @bachelor-party/shared"**
→ Run `pnpm install` from the repo root, not from inside an app folder.

**Push notifications not working**
→ Ensure Cloud Functions are deployed on the Blaze plan. Check FCM Server Key.

**Participant can't find their name**
→ Names are case-insensitive. Make sure the seed script ran successfully and the name matches exactly (e.g. "Łukasz" not "Lukasz").

**Admin can't log in**
→ Check the PIN matches what's in Firestore (`participants/{id}.pinHash` = `pin:XXXX`). Update via the Participants tab in the admin app.

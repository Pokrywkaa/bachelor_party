# Bachelor Party App — Implementation Plan

## Overview

Two React Native apps (built with Expo) backed by Firebase, distributed via shareable download links (no App Store required). Designed for a closed group of ~8 people for a single-day event.

---

## Firebase Costs

> **Short answer: likely $0 for a one-day event.**

Firebase's free **Spark plan** covers:
| Service | Free Tier | Expected Usage |
|---|---|---|
| Firestore | 1 GB storage, 50k reads/day, 20k writes/day | Well within limits |
| Firebase Storage | 5 GB storage, 1 GB/day download | Borderline — videos can be large |
| Cloud Messaging (FCM) | Free unlimited | Free |
| Authentication | 10k users/month | Free |

**Risk:** If participants record many long videos (>30 seconds each), storage downloads could approach the 1 GB/day limit. Mitigation: compress video before upload, or upgrade to **Blaze plan** (pay-as-you-go) for peace of mind — realistically the cost for one day would be **< $2**.

**Recommendation:** Start on Spark, switch to Blaze with a spending cap ($5) just before the event.

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | **Expo SDK 52** (managed workflow) | Camera, notifications, sharing — all built-in; EAS Build gives shareable links |
| Language | **TypeScript** | Type safety across both apps |
| Backend | **Firebase** (Firestore + Storage + FCM + Auth) | Real-time, no server to maintain |
| Navigation | **React Navigation v7** | Industry standard for RN |
| State | **Zustand** | Lightweight, no boilerplate |
| Notifications | **Expo Notifications + Firebase Cloud Messaging** | Push + in-app |
| Media | **Expo Camera, Expo ImagePicker, Expo AV** | Photo, video, playback |
| Location | **Expo Location** | GPS check-in tasks |
| Styling | **NativeWind (Tailwind for RN)** | Fast, consistent UI |
| Monorepo | **pnpm workspaces** | Share types and Firebase config |
| Distribution | **EAS Build** (Internal Distribution) | Shareable HTTPS download link for APK/IPA |

---

## Repository Structure

```
bachelor_party/
├── apps/
│   ├── participant/          # Participant app
│   └── admin/                # Admin app
├── packages/
│   └── shared/               # Shared types, Firebase config, utilities
│       ├── src/
│       │   ├── firebase.ts
│       │   ├── types.ts
│       │   └── utils.ts
│       └── package.json
├── firebase/
│   ├── firestore.rules
│   ├── storage.rules
│   └── firebase.json
├── IMPLEMENTATION_PLAN.md
├── package.json              # pnpm workspace root
└── pnpm-workspace.yaml
```

---

## Firebase Data Model

```
/events/{eventId}/
  ├── meta                    # Event name, date, status
  ├── participants/{uid}/     # name, role (participant|admin), score, pushToken, isGroom
  ├── tasks/{taskId}/         # Task templates (pre-created by admin)
  │   ├── title
  │   ├── description
  │   ├── type                # photo | video | timed | quiz | gps | audio | dare | creative
  │   ├── durationSeconds     # null = no timer
  │   ├── reward              # ref to reward
  │   ├── punishment          # ref to punishment
  │   └── mediaRequired       # bool
  ├── assignments/{id}/       # When admin triggers a task for a participant
  │   ├── taskId
  │   ├── participantId
  │   ├── triggeredAt
  │   ├── expiresAt           # triggeredAt + durationSeconds
  │   ├── status              # pending | submitted | approved | rejected | expired
  │   └── submissionId
  ├── submissions/{id}/       # Participant's response
  │   ├── assignmentId
  │   ├── participantId
  │   ├── submittedAt
  │   ├── isLate              # submitted after timer
  │   ├── mediaUrl            # Firebase Storage URL
  │   ├── answer              # text answer for quiz/dare
  │   ├── location            # GeoPoint for GPS tasks
  │   ├── rating              # 1–5, set by admin
  │   └── verdict             # approved | rejected
  ├── rewards/{id}/
  │   ├── title
  │   ├── description
  │   └── icon
  └── punishments/{id}/
      ├── title
      ├── description
      └── icon
```

---

## App 1 — Participant App

### Features

#### Onboarding / Entry
- **Name entry screen** — participant types their name; the app checks if it matches a pre-registered participant name in Firestore (case-insensitive)
- **Bridegroom detection** — if the participant is flagged as `isGroom: true`, they get a special onboarding flow
- **Standard onboarding** (3–5 slides): How the app works, how tasks arrive, leaderboard explanation
- **Bridegroom onboarding** (separate flow): Personalized welcome message, fun intro text/images set by admin, then merges into standard onboarding

#### Home Screen
- Active/pending task card (highlighted, with countdown timer if applicable)
- Current score + rank badge
- Quick link to leaderboard

#### Task Screen (triggered by push notification or in-app alert)
- Task title and description
- Countdown timer (ring/progress style) — turns red when < 20% remaining
- Task-type-specific UI (see Task Types below)
- Submit button (allowed even after timer expires — submission marked as `isLate`)
- Status feedback after submission (waiting for admin review)

#### Task Types — Participant UI
| Type | UI |
|---|---|
| `photo` | Camera viewfinder + capture button, or pick from gallery |
| `video` | Video recorder with optional max duration |
| `timed` | Timer + confirm button ("I did it!") |
| `quiz` | Multiple choice or free-text input |
| `gps` | Map showing target location + "I'm here" button (validates proximity) |
| `audio` | Microphone recorder |
| `dare` | Description only + "Done!" / "Failed" buttons |
| `creative` | Free-form: text + optional media |
| `social` | Post something on social media + screenshot proof |
| `memory` | Answer a question about the groom from memory |
| `physical` | Physical challenge (push-ups, etc.) — video proof |

#### Leaderboard Screen
- Ranked list of all participants with scores and avatar initials
- Animated rank changes (real-time Firestore listener)

#### History Screen
- All past assignments with status (approved / rejected / pending / expired)
- Earned rewards and suffered punishments displayed per task

#### Notifications
- Push notification when a task is triggered (deep-links directly to Task Screen)
- In-app banner (if app is in foreground)
- In-app alert on leaderboard update

### Screens Summary
```
Stack:
  ├── NameEntryScreen
  ├── OnboardingGroomScreen (groom only, swipeable slides)
  ├── OnboardingStandardScreen (swipeable slides)
  └── MainTabs:
        ├── HomeTab
        │     └── TaskDetailScreen (modal)
        ├── LeaderboardTab
        └── HistoryTab
```

---

## App 2 — Admin App

### Features

#### Entry
- Admin name + PIN (4-digit PIN stored in Firestore, hashed)
- Supports 2 admins

#### Dashboard
- Live overview: how many tasks triggered today, pending submissions, leaderboard snapshot
- Quick-trigger buttons for common tasks

#### Task Library
- List of all pre-created tasks
- Create / edit / delete tasks
- Filter by type
- Each task has: title, description, type, timer, reward, punishment

#### Trigger Task
- Select a task from library
- Assign to one or more participants (or "All" / "Groom only")
- Optionally override timer duration
- Send push notification immediately

#### Submissions Review
- Feed of all submissions (newest first)
- Media preview inline (photo, video player, audio player, map for GPS)
- Per submission: **Approve / Reject** buttons + **1–5 star rating**
- After verdict: choose reward (on approve) or punishment (on reject) to display to participant
- Filter by: pending / approved / rejected / all

#### Rewards & Punishments Manager
- CRUD list of rewards (e.g., "Skip next task", "Bonus points +50", "Choose someone's punishment")
- CRUD list of punishments (e.g., "Drink penalty", "Wear the hat for 30 min", "Do 10 push-ups")
- Each has title, description, optional emoji/icon

#### Participants Manager
- List of all participants
- Flag one as `isGroom`
- Manually adjust scores
- View individual history

#### Leaderboard
- Same live leaderboard as participant app, with score adjustment controls

### Screens Summary
```
Stack:
  ├── AdminLoginScreen
  └── AdminTabs:
        ├── DashboardTab
        │     └── TriggerTaskModal
        ├── TaskLibraryTab
        │     ├── TaskDetailScreen
        │     └── CreateEditTaskScreen
        ├── SubmissionsTab
        │     └── SubmissionReviewScreen (full-screen media)
        ├── RewardsPunishmentsTab
        └── ParticipantsTab
```

---

## Notifications Architecture

```
Admin triggers task
       ↓
Firestore write (assignments/{id})
       ↓
Firebase Cloud Function (onWrite trigger)
       ↓
FCM sends push to target participant(s)
       ↓
Participant device:
  - App in background → system push notification → tap → deep link to task
  - App in foreground → in-app banner shown automatically
```

> **Note:** This requires one Firebase Cloud Function (Node.js). It's within the free tier (2M invocations/month free).

---

## Scoring System

- Admin approves a submission → base points awarded (configurable per task, default: 100)
- Admin sets rating (1–5 stars) → multiplier: rating × 20 bonus points
- Late submission → 25% point deduction applied automatically
- Rejection → 0 points, punishment assigned
- Scores update in real-time in Firestore, leaderboard reflects immediately

---

## Distribution Plan (No App Store)

### Android
1. `eas build --platform android --profile preview` → generates APK
2. EAS provides a shareable HTTPS download link
3. Participants tap link → download APK → enable "Install from unknown sources" → install

### iOS
1. `eas build --platform ios --profile preview` → generates IPA via Ad Hoc or TestFlight
2. Add each participant's UDID to the provisioning profile (requires Apple Developer account, $99/year)
3. **Alternative:** Use **Expo Go** app — participants install Expo Go from App Store, then open a shared `exp://` link (simpler, no developer account needed, but limited to Expo SDK features)

**Recommendation:** Use Expo Go for iOS during development/testing; use EAS Ad Hoc build for the actual event if possible.

---

## Implementation Phases

### Phase 1 — Foundation (Week 1)
- [ ] Set up pnpm monorepo with `apps/participant`, `apps/admin`, `packages/shared`
- [ ] Initialize Expo projects in both apps
- [ ] Set up Firebase project (Firestore, Storage, Auth, FCM)
- [ ] Define Firestore security rules
- [ ] Create shared TypeScript types for all data models
- [ ] Set up NativeWind in both apps
- [ ] Implement Firebase connection and basic auth (anonymous + name matching)

### Phase 2 — Participant App Core (Week 2)
- [ ] Name entry + participant lookup
- [ ] Standard onboarding slides
- [ ] Bridegroom special onboarding flow
- [ ] Home screen with active task card
- [ ] Real-time Firestore listener for assignments
- [ ] Leaderboard screen

### Phase 3 — Task Types — Participant (Week 3)
- [ ] Photo task (camera + gallery)
- [ ] Video task (recorder with duration limit)
- [ ] Timed task (countdown + confirm)
- [ ] Quiz task (multiple choice + free text)
- [ ] GPS check-in task (Expo Location + map)
- [ ] Audio recording task
- [ ] Dare task
- [ ] Creative task (free media + text)
- [ ] Countdown timer component (ring UI)
- [ ] Upload to Firebase Storage
- [ ] Submission creation in Firestore

### Phase 4 — Push Notifications (Week 3)
- [ ] Register Expo push token, save to Firestore participant doc
- [ ] Write Firebase Cloud Function (trigger on new assignment)
- [ ] In-app notification banner component
- [ ] Deep linking from notification to task screen

### Phase 5 — Admin App (Week 4)
- [ ] Admin login with PIN
- [ ] Dashboard with live stats
- [ ] Task library (list, create, edit, delete)
- [ ] Trigger task modal (select task + participant + optional timer override)
- [ ] Submissions feed with inline media preview
- [ ] Approve/reject + rating UI
- [ ] Reward/punishment assignment after verdict
- [ ] Rewards & punishments manager (CRUD)
- [ ] Participants manager (score adjustment, groom flag)

### Phase 6 — Polish & Testing (Week 5)
- [ ] Score calculation Cloud Function
- [ ] History screen in participant app
- [ ] Animations (leaderboard rank changes, task arrival animation)
- [ ] Error handling and loading states throughout
- [ ] Test on real Android and iOS devices
- [ ] EAS build setup + generate shareable links
- [ ] Seed Firebase with initial participants, tasks, rewards, punishments

---

## Key Libraries

```json
{
  "expo": "~52.0.0",
  "firebase": "^10.x",
  "react-navigation/native": "^7.x",
  "react-navigation/bottom-tabs": "^7.x",
  "react-navigation/stack": "^7.x",
  "expo-camera": "latest",
  "expo-image-picker": "latest",
  "expo-av": "latest",
  "expo-location": "latest",
  "expo-notifications": "latest",
  "expo-file-system": "latest",
  "expo-image-manipulator": "latest",
  "nativewind": "^4.x",
  "tailwindcss": "^3.x",
  "zustand": "^4.x",
  "react-native-maps": "latest",
  "react-native-reanimated": "^3.x",
  "react-native-gesture-handler": "latest"
}
```

---

## Security Considerations

- Firestore rules: participants can only read/write their own submissions; admins (by role flag) can read/write everything
- Admin PIN is hashed (SHA-256) before storage — never stored in plain text
- Firebase Storage rules: uploads require authenticated session tied to a known participant UID
- No sensitive personal data stored — only names and in-event media
- All Firebase API keys are public by design (secured via Firestore/Storage rules, not key secrecy)

---

## Final Decisions

1. **Groom onboarding content** — Placeholder slides with participant introductions; real content filled in via Firestore/Admin app before the event.
2. **Task list** — No hardcoded tasks; add everything via the Admin app before the event.
3. **Scoring** — Each task has its own configurable `points` value set at task creation time.
4. **Reward/punishment list** — Placeholder set provided; edit via Admin app before the event.
5. **iOS distribution** — No Apple Developer account → use **Expo Go** app on iOS. Participants install Expo Go from the App Store, then open a shared `exp://` link. Android uses EAS APK shareable link.

---

## Estimated Timeline

| Phase | Duration |
|---|---|
| Phase 1 — Foundation | ~3–4 days |
| Phase 2 — Participant Core | ~4–5 days |
| Phase 3 — Task Types | ~5–6 days |
| Phase 4 — Notifications | ~2–3 days |
| Phase 5 — Admin App | ~5–7 days |
| Phase 6 — Polish & QA | ~3–4 days |
| **Total** | **~3–5 weeks** |

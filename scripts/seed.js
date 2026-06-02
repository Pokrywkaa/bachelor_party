/**
 * Seed script — run ONCE before the event to populate Firestore with
 * participants, rewards and punishments.
 *
 * Usage:
 *   node scripts/seed.js
 *
 * Prerequisites:
 *   1. Fill in your Firebase config in packages/shared/src/firebase.ts
 *   2. Run `pnpm install` from the repo root
 *   3. Ensure your Firebase project has Firestore enabled
 */

// We use the Firebase Admin SDK for server-side seeding.
// Install it only in the scripts dev context:
//   npm install -g firebase-admin   OR   npx firebase-admin
//
// Alternatively you can run this from the Firebase Functions shell.
//
// ──────────────────────────────────────────────────────────────────────────
// FILL THESE IN (from Firebase Console → Project Settings → Service Accounts)
// ──────────────────────────────────────────────────────────────────────────
const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json'; // Download from Firebase Console
const EVENT_ID = 'main';

// ─── Data ─────────────────────────────────────────────────────────────────

const PARTICIPANTS = [
  { name: 'Adam',     isGroom: true,  role: 'participant', score: 0, pushToken: null },
  { name: 'Bartek',   isGroom: false, role: 'admin',       score: 0, pushToken: null, pinHash: 'pin:1234' },
  { name: 'Damian',   isGroom: false, role: 'admin',       score: 0, pushToken: null, pinHash: 'pin:5678' },
  { name: 'Piotr',    isGroom: false, role: 'participant', score: 0, pushToken: null },
  { name: 'Łukasz',   isGroom: false, role: 'participant', score: 0, pushToken: null },
  { name: 'Marcin',   isGroom: false, role: 'participant', score: 0, pushToken: null },
  { name: 'Tomek',    isGroom: false, role: 'participant', score: 0, pushToken: null },
  { name: 'Krzysztof',isGroom: false, role: 'participant', score: 0, pushToken: null },
];

const REWARDS = [
  { icon: '🍺', title: 'Beer Round',    description: 'The groom buys a round of beers for everyone!' },
  { icon: '🎤', title: 'Karaoke Song',  description: 'Groom must perform a full karaoke song of your choice.' },
  { icon: '💪', title: 'Piggyback Ride', description: 'Groom carries you on his back for 50 meters.' },
  { icon: '🤳', title: 'Embarrassing Photo', description: 'Groom must pose for a ridiculous photo that goes in the group.' },
];

const PUNISHMENTS = [
  { icon: '🥃', title: 'Shot',          description: 'Take a shot of whatever the group decides.' },
  { icon: '🎭', title: 'Impression',    description: 'Do a 1-minute impression of your partner.' },
  { icon: '📞', title: 'Awkward Call',  description: 'Call someone from your contacts and sing Happy Birthday.' },
  { icon: '🕺', title: 'Solo Dance',    description: 'Dance alone for 30 seconds to a song chosen by the group.' },
  { icon: '🍋', title: 'Lemon Challenge', description: 'Eat a full lemon slice without making a face.' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Deletes all documents in a collection (in batches of 100). */
async function deleteCollection(db, colRef) {
  const snap = await colRef.get();
  if (snap.empty) return;
  const BATCH_SIZE = 100;
  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    snap.docs.slice(i, i + BATCH_SIZE).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

/** Recursively wipes all sub-collections and the document itself. */
async function wipeEvent(db, eventRef) {
  const SUBCOLS = ['participants', 'tasks', 'assignments', 'submissions', 'rewards', 'punishments'];
  for (const name of SUBCOLS) {
    await deleteCollection(db, eventRef.collection(name));
    console.log(`🗑️  Cleared ${name}`);
  }
  await eventRef.delete();
  console.log('🗑️  Deleted event document');
}

// ─── Seed logic ───────────────────────────────────────────────────────────

async function seed() {
  let admin;
  try {
    admin = require('firebase-admin');
  } catch {
    console.error('firebase-admin not found. Run: npm install -g firebase-admin');
    process.exit(1);
  }

  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();

  const eventRef = db.collection('events').doc(EVENT_ID);

  // ── Wipe existing data ─────────────────────────────────────────────────
  console.log('🔥 Wiping existing data...');
  await wipeEvent(db, eventRef);
  console.log('');

  // ── Re-seed ────────────────────────────────────────────────────────────

  // Create event metadata
  await eventRef.set({
    id: EVENT_ID,
    name: "Adam's Bachelor Party",
    date: new Date().toISOString().split('T')[0],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('✅ Event metadata set');

  // Seed participants
  const participantsCol = eventRef.collection('participants');
  for (const p of PARTICIPANTS) {
    const ref = participantsCol.doc();
    await ref.set({ id: ref.id, ...p, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log(`✅ Participant: ${p.name}`);
  }

  // Seed rewards
  const rewardsCol = eventRef.collection('rewards');
  for (const r of REWARDS) {
    const ref = rewardsCol.doc();
    await ref.set({ id: ref.id, ...r });
    console.log(`✅ Reward: ${r.title}`);
  }

  // Seed punishments
  const punishmentsCol = eventRef.collection('punishments');
  for (const p of PUNISHMENTS) {
    const ref = punishmentsCol.doc();
    await ref.set({ id: ref.id, ...p });
    console.log(`✅ Punishment: ${p.title}`);
  }

  console.log('\n🎉 Seed complete! Firebase is ready for the party.');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });

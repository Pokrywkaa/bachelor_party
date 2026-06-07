/**
 * Seed script — run ONCE before the event to populate Firestore with
 * participants, tasks, rewards and punishments.
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
  { name: 'Kondziu',     isGroom: true,  role: 'participant', score: 0, pushToken: null },
  { name: 'Damian',   isGroom: false, role: 'admin',       score: 0, pushToken: null, pinHash: 'pin:5678' },
  { name: 'Kociu',   isGroom: false, role: 'participant',       score: 0, pushToken: null},
  { name: 'Sali',    isGroom: false, role: 'participant', score: 0, pushToken: null },
  { name: 'Kamzo',   isGroom: false, role: 'participant', score: 0, pushToken: null },
  { name: 'Mati',   isGroom: false, role: 'participant', score: 0, pushToken: null },
  { name: 'Hubert',    isGroom: false, role: 'participant', score: 0, pushToken: null },
  { name: 'Rafał',     isGroom: false, role: 'participant', score: 0, pushToken: null },
  { name: 'Filip',     isGroom: false, role: 'participant', score: 0, pushToken: null },
];

const REWARDS = [
  { icon: '🍻', title: 'Kolejka piwa', description: 'Fundujesz kolejkę piwa dla całej ekipy!' },
  { icon: '🎯', title: 'Mistrz wyzwań', description: 'Wymyślasz zadanie dla wybranej przez Ciebie osoby.' },
  { icon: '🥂', title: 'Toast mistrza', description: 'Wznosisz toast i wszyscy muszą powtórzyć Twoje słowa.' },
  { icon: '📢', title: 'Ogłoszenie króla', description: 'Wygłoś krótkie „ważne ogłoszenie” dla wszystkich.' },
  { icon: '🤝', title: 'Sojusznik', description: 'Wybierasz osobę, która musi Ci pomóc w kolejnym wyzwaniu.' },
  { icon: '🎁', title: 'Prezent od grupy', description: 'Grupa spełnia Twoje małe życzenie (w granicach rozsądku).' },
  { icon: '🎲', title: 'Losowanie kary', description: 'Wybierasz osobę, która wykonuje wylosowaną przez grupę karę.' },
];

const PUNISHMENTS = [
  { icon: '🥃', title: 'Shot wódki', description: 'Wypij czysty shot wódki (lub innego alkoholu wskazanego przez grupę).' },
  { icon: '🍺', title: 'Piwo na raz', description: 'Wypij całe piwo na raz.' },
  { icon: '🗣️', title: 'Wymyślony język', description: 'Podejdź do kogoś i mów przez 1 minutę wymyślonym językiem.' },
  { icon: '🎭', title: 'Odgrywanie postaci', description: 'Przez nastepne 10 minut udawaj osobe ktore akutalnie siedzi najblizej Ciebie.' },
  { icon: '📞', title: 'Cringe telefon', description: 'Zadzwoń do kogoś i powiedz coś losowo dziwnego, co wymyśli grupa.' },
  { icon: '💃', title: 'Solo taniec', description: 'Tańcz solo przez 30 sekund do wybranej przez grupę muzyki.' },
  { icon: '🧠', title: 'Pytanie prawdy', description: 'Odpowiedz szczerze na bardzo niewygodne pytanie od grupy.' },
  { icon: '📣', title: 'Krzyk na zewnątrz', description: 'Wyjdź i krzyknij coś losowego na głos.' },
];

const TASKS = [
  {
    title: 'Selfie z nieznajomym',
    description: 'Zrób selfie z osobą, której nie znacie i wrzuć jako dowód.',
    type: 'photo',
    points: 120,
    durationSeconds: 420,
    mediaRequired: true,
    rewardId: null,
    punishmentId: null,
  },
  {
    title: 'Nagranie okrzyku',
    description: 'Nagraj 10-sekundowy okrzyk drużyny i wyślij audio.',
    type: 'audio',
    points: 100,
    durationSeconds: 300,
    mediaRequired: true,
    rewardId: null,
    punishmentId: null,
  },
  {
    title: 'Quiz: Urodziny',
    description: 'Kiedy Konrad obchodzi urodziny?',
    type: 'quiz',
    points: 90,
    durationSeconds: 180,
    mediaRequired: false,
    rewardId: null,
    punishmentId: null,
    quizOptions: [
      { id: 'a', text: '4 października', isCorrect: false },
      { id: 'b', text: '13 października', isCorrect: true },
      { id: 'c', text: '6 października', isCorrect: false },
      { id: 'd', text: '21 października', isCorrect: false },
    ],
  },
  {
    title: 'Odwaga: mini stand-up',
    description: 'Opowiedz 30-sekundowy żart lub historię przed grupą.',
    type: 'dare',
    points: 125,
    durationSeconds: 300,
    mediaRequired: false,
    rewardId: null,
    punishmentId: null,
  },
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

  // Seed tasks
  const tasksCol = eventRef.collection('tasks');
  for (const t of TASKS) {
    const ref = tasksCol.doc();
    await ref.set({
      id: ref.id,
      ...t,
      createdBy: 'seed-script',
      createdAt: new Date().toISOString(),
    });
    console.log(`✅ Task: ${t.title}`);
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

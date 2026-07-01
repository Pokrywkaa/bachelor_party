import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import type { Participant, Task, Assignment, Submission, Reward, Punishment, EventMeta } from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const EVENT_ID = 'main'; // Single event; change if needed

// ─── Collection helpers ────────────────────────────────────────────────────────

export const eventRef = () => doc(db, 'events', EVENT_ID);
export const participantsCol = () => collection(db, 'events', EVENT_ID, 'participants');
export const tasksCol = () => collection(db, 'events', EVENT_ID, 'tasks');
export const assignmentsCol = () => collection(db, 'events', EVENT_ID, 'assignments');
export const submissionsCol = () => collection(db, 'events', EVENT_ID, 'submissions');
export const rewardsCol = () => collection(db, 'events', EVENT_ID, 'rewards');
export const punishmentsCol = () => collection(db, 'events', EVENT_ID, 'punishments');

// ─── Scoring ──────────────────────────────────────────────────────────────────

export function calculatePoints(basePoints: number, rating: number, isLate: boolean): number {
  const ratingBonus = (rating - 1) * 20; // 0 to 80 bonus
  const total = basePoints + ratingBonus;
  return isLate ? Math.floor(total * 0.75) : total;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatCountdown(secondsLeft: number): string {
  if (secondsLeft <= 0) return '00:00';
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function taskTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    photo: '📸 Zdjęcie',
    video: '🎥 Wideo',
    quiz: '🧠 Quiz',
    audio: '🎙️ Audio',
    dare: '😈 Wyzwanie',
  };
  return labels[type] ?? type;
}

// ─── Seed Helpers (run once from admin) ──────────────────────────────────────

export const PLACEHOLDER_PARTICIPANTS: Omit<Participant, 'id'>[] = [
  { name: 'Adam', role: 'participant', isGroom: true, score: 0, createdAt: new Date().toISOString() },
  { name: 'Bartek', role: 'admin', isGroom: false, score: 0, createdAt: new Date().toISOString() },
  { name: 'Damian', role: 'admin', isGroom: false, score: 0, createdAt: new Date().toISOString() },
  { name: 'Piotr', role: 'participant', isGroom: false, score: 0, createdAt: new Date().toISOString() },
  { name: 'Łukasz', role: 'participant', isGroom: false, score: 0, createdAt: new Date().toISOString() },
  { name: 'Marcin', role: 'participant', isGroom: false, score: 0, createdAt: new Date().toISOString() },
  { name: 'Tomek', role: 'participant', isGroom: false, score: 0, createdAt: new Date().toISOString() },
  { name: 'Krzysztof', role: 'participant', isGroom: false, score: 0, createdAt: new Date().toISOString() },
];

export const PLACEHOLDER_REWARDS: Omit<Reward, 'id'>[] = [
  { title: 'Skip Next Task', description: 'You can skip your next assigned task — no consequences!', icon: '🦸', createdAt: new Date().toISOString() },
  { title: 'Bonus Points +50', description: 'Receive 50 extra points on top of your task reward.', icon: '⭐', createdAt: new Date().toISOString() },
  { title: 'Choose Someone\'s Punishment', description: 'You get to pick what punishment another participant receives.', icon: '😈', createdAt: new Date().toISOString() },
  { title: 'VIP Status (30 min)', description: 'You\'re VIP for 30 minutes — admins wait on you.', icon: '👑', createdAt: new Date().toISOString() },
];

export const PLACEHOLDER_PUNISHMENTS: Omit<Punishment, 'id'>[] = [
  { title: 'Drink Penalty 🍺', description: 'You must take a drink of whatever is in your hand.', icon: '🍺', createdAt: new Date().toISOString() },
  { title: 'Wear the Sash', description: 'Wear the embarrassing sash for the next 30 minutes.', icon: '🎀', createdAt: new Date().toISOString() },
  { title: '10 Push-Ups', description: 'Drop and give us 10. Right now.', icon: '💪', createdAt: new Date().toISOString() },
  { title: 'Sing a Song', description: 'Perform a full chorus of any song — chosen by the group.', icon: '🎤', createdAt: new Date().toISOString() },
  { title: 'No Phone (15 min)', description: 'Phone goes to the admin for 15 minutes.', icon: '📵', createdAt: new Date().toISOString() },
];

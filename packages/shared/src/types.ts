// ─── Task Types ──────────────────────────────────────────────────────────────

export type TaskType =
  | 'photo'       // Take a photo
  | 'video'       // Record a video
  | 'timed'       // Complete within a time limit and confirm
  | 'quiz'        // Answer a question (multiple choice or free text)
  | 'gps'         // Check in at a GPS location
  | 'audio'       // Record an audio clip
  | 'dare'        // Accept or reject a dare
  | 'creative'    // Free-form text + optional media
  | 'social'      // Post on social media + screenshot proof
  | 'memory'      // Answer a memory question about the groom
  | 'physical';   // Physical challenge (video proof)

// ─── Roles ───────────────────────────────────────────────────────────────────

export type ParticipantRole = 'participant' | 'admin';

// ─── Verdict / Status ────────────────────────────────────────────────────────

export type AssignmentStatus =
  | 'pending'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'expired';

export type Verdict = 'approved' | 'rejected';

// ─── Firestore Models ─────────────────────────────────────────────────────────

export interface EventMeta {
  id: string;
  name: string;
  date: string; // ISO string
  status: 'upcoming' | 'active' | 'finished';
  groomName: string;
}

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  isGroom: boolean;
  score: number;
  pushToken?: string;
  createdAt: string;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface GpsTarget {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  label: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  points: number;
  durationSeconds: number | null; // null = no timer
  mediaRequired: boolean;
  rewardId: string | null;
  punishmentId: string | null;
  // Type-specific fields
  quizOptions?: QuizOption[];       // for 'quiz'
  quizCorrectAnswer?: string;       // for free-text quiz
  gpsTarget?: GpsTarget;            // for 'gps'
  maxVideoDurationSeconds?: number; // for 'video'
  createdAt: string;
  createdBy: string; // participantId
}

export interface Assignment {
  id: string;
  taskId: string;
  participantId: string;
  triggeredBy: string; // admin participantId
  triggeredAt: string;
  expiresAt: string | null;
  status: AssignmentStatus;
  submissionId?: string;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  taskId: string;
  participantId: string;
  submittedAt: string;
  isLate: boolean;
  mediaUrl?: string;        // Firebase Storage download URL
  mediaType?: 'photo' | 'video' | 'audio';
  answer?: string;          // for quiz / dare / creative / memory
  location?: GeoPoint;      // for gps
  rating?: number;          // 1–5, set by admin
  verdict?: Verdict;
  pointsAwarded?: number;
  rewardId?: string;
  punishmentId?: string;
  adminNote?: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  createdAt: string;
}

export interface Punishment {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  createdAt: string;
}

// ─── Navigation Params ────────────────────────────────────────────────────────

export interface NotificationPayload {
  assignmentId: string;
  taskId: string;
  participantId: string;
  taskTitle: string;
}

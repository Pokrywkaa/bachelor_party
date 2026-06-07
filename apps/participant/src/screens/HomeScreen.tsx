import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform,
} from 'react-native';
import {
  collection, query, where, onSnapshot, orderBy,
} from 'firebase/firestore';
import { db, EVENT_ID, getInitials, taskTypeLabel } from '@bachelor-party/shared';
import { useParticipantStore } from '../store/participantStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import CountdownRing from '../components/CountdownRing';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

export default function HomeScreen({ navigation }: Props) {
  const {
    currentParticipant,
    assignments, setAssignments,
    tasks, setTasks,
    participants, setParticipants,
    rewards, setRewards,
    punishments, setPunishments,
    submissions, setSubmissions,
  } = useParticipantStore();

  // ── Web browser notifications for new assignments ────────────────────────

  const seenAssignmentIds = useRef<Set<string>>(new Set());
  const notificationsInitialized = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof Notification === 'undefined') return;

    if (!notificationsInitialized.current) {
      // First snapshot: mark all existing assignments as seen without notifying
      assignments.forEach((a) => seenAssignmentIds.current.add(a.id));
      notificationsInitialized.current = true;
      return;
    }

    const newPending = assignments.filter(
      (a) => a.status === 'pending' && !seenAssignmentIds.current.has(a.id)
    );
    assignments.forEach((a) => seenAssignmentIds.current.add(a.id));

    if (newPending.length === 0) return;

    const fire = async () => {
      const permission =
        Notification.permission === 'granted'
          ? 'granted'
          : await Notification.requestPermission();
      if (permission !== 'granted') return;

      for (const assignment of newPending) {
        const task = tasks.find((t) => t.id === assignment.taskId);
        new Notification('🚨 Nowa misja!', {
          body: task?.title ?? 'Czeka na Ciebie nowe zadanie!',
          icon: '/icon.png',
        });
      }
    };

    fire();
  }, [assignments, tasks]);

  // ── Real-time listeners ────────────────────────────────────────────────────

  useEffect(() => {
    if (!currentParticipant) return;

    const unsubAssignments = onSnapshot(
      query(
        collection(db, 'events', EVENT_ID, 'assignments'),
        where('participantId', '==', currentParticipant.id),
        orderBy('triggeredAt', 'desc')
      ),
      (snap) => setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any))
    );

    const unsubTasks = onSnapshot(
      collection(db, 'events', EVENT_ID, 'tasks'),
      (snap) => setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any))
    );

    const unsubParticipants = onSnapshot(
      query(collection(db, 'events', EVENT_ID, 'participants'), orderBy('score', 'desc')),
      (snap) => setParticipants(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any))
    );

    const unsubRewards = onSnapshot(
      collection(db, 'events', EVENT_ID, 'rewards'),
      (snap) => setRewards(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any))
    );

    const unsubPunishments = onSnapshot(
      collection(db, 'events', EVENT_ID, 'punishments'),
      (snap) => setPunishments(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any))
    );

    const unsubSubmissions = onSnapshot(
      query(
        collection(db, 'events', EVENT_ID, 'submissions'),
        where('participantId', '==', currentParticipant.id),
        orderBy('submittedAt', 'desc')
      ),
      (snap) => setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any))
    );

    return () => {
      unsubAssignments();
      unsubTasks();
      unsubParticipants();
      unsubRewards();
      unsubPunishments();
      unsubSubmissions();
    };
  }, [currentParticipant]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const pendingAssignment = assignments.find((a) => a.status === 'pending');
  const activeTask = pendingAssignment
    ? tasks.find((t) => t.id === pendingAssignment.taskId)
    : null;

  const myRank = participants.findIndex((p) => p.id === currentParticipant?.id) + 1;

  // ── Live countdown ────────────────────────────────────────────────────────
  const calcRemaining = () =>
    pendingAssignment?.expiresAt
      ? Math.max(0, Math.floor((new Date(pendingAssignment.expiresAt).getTime() - Date.now()) / 1000))
      : null;

  const [expiresAtSeconds, setExpiresAtSeconds] = useState<number | null>(calcRemaining);

  useEffect(() => {
    setExpiresAtSeconds(calcRemaining());
    if (!pendingAssignment?.expiresAt) return;
    const interval = setInterval(() => {
      const remaining = calcRemaining();
      setExpiresAtSeconds(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [pendingAssignment?.expiresAt]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Cześć, {currentParticipant?.name} {currentParticipant?.isGroom ? '👑' : '👋'}</Text>
            <Text style={styles.subGreeting}>Bądź czujny - nowa misja może wpaść w każdej chwili!</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreLabel}>MIEJSCE</Text>
            <Text style={styles.scoreValue}>#{myRank || '—'}</Text>
          </View>
        </View>

        {/* Score card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreCardLabel}>Twój wynik</Text>
          <Text style={styles.scoreCardValue}>{currentParticipant?.score ?? 0} pkt</Text>
        </View>

        {/* Active task */}
        {pendingAssignment && activeTask ? (
          <TouchableOpacity
            style={styles.taskCard}
            onPress={() => navigation.navigate('Task', { assignmentId: pendingAssignment.id })}
          >
            <View style={styles.taskCardHeader}>
              <Text style={styles.taskCardBadge}>🎯 AKTYWNA MISJA</Text>
              {expiresAtSeconds !== null && (
                <CountdownRing totalSeconds={activeTask.durationSeconds ?? 0} remainingSeconds={expiresAtSeconds} />
              )}
            </View>
            <Text style={styles.taskCardTitle}>{activeTask.title}</Text>
            <Text style={styles.taskCardType}>{taskTypeLabel(activeTask.type)}</Text>
            <Text style={styles.taskCardDesc} numberOfLines={2}>{activeTask.description}</Text>
            <View style={styles.taskCardFooter}>
              <Text style={styles.taskCardPoints}>+{activeTask.points} pkt</Text>
              <Text style={styles.taskCardCta}>Kliknij, aby otworzyć →</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.noTaskCard}>
            <Text style={styles.noTaskEmoji}>😴</Text>
            <Text style={styles.noTaskText}>Brak aktywnej misji</Text>
            <Text style={styles.noTaskSub}>Organizator wkrótce wyśle kolejną...</Text>
          </View>
        )}

        {/* Recent submissions */}
        <Text style={styles.sectionTitle}>Ostatnia aktywność</Text>
        {submissions.slice(0, 3).map((sub) => {
          const task = tasks.find((t) => t.id === sub.taskId);
          const verdictLabel =
            sub.verdict === 'approved'
              ? 'ZATWIERDZONE'
              : sub.verdict === 'rejected'
                ? 'ODRZUCONE'
                : 'OCZEKUJE';
          return (
            <View key={sub.id} style={styles.historyItem}>
              <Text style={styles.historyTitle}>{task?.title ?? 'Zadanie'}</Text>
              <Text style={[styles.historyStatus,
                sub.verdict === 'approved' && styles.statusApproved,
                sub.verdict === 'rejected' && styles.statusRejected,
                !sub.verdict && styles.statusPending,
              ]}>
                {verdictLabel}
              </Text>
            </View>
          );
        })}
        {submissions.length === 0 && (
          <Text style={styles.emptyText}>Brak zgłoszeń</Text>
        )}

        {/* Replay onboarding */}
        <TouchableOpacity
          style={styles.introButton}
          onPress={() =>
            navigation.navigate(currentParticipant?.isGroom ? 'OnboardingGroom' : 'OnboardingStandard')
          }
        >
          <Text style={styles.introButtonText}>📖 Obejrzyj intro ponownie</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a0a2e' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#f3e8ff' },
  subGreeting: { fontSize: 13, color: '#a78bfa', marginTop: 4 },
  scoreBadge: {
    backgroundColor: '#4c1d95',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    minWidth: 60,
  },
  scoreLabel: { fontSize: 10, color: '#c4b5fd', fontWeight: 'bold' },
  scoreValue: { fontSize: 20, fontWeight: 'bold', color: '#fbbf24' },
  scoreCard: {
    backgroundColor: '#2d1b6b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  scoreCardLabel: { fontSize: 14, color: '#a78bfa' },
  scoreCardValue: { fontSize: 36, fontWeight: 'bold', color: '#f3e8ff', marginTop: 4 },
  taskCard: {
    backgroundColor: '#3b0764',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  taskCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  taskCardBadge: { fontSize: 12, color: '#fbbf24', fontWeight: 'bold' },
  taskCardTitle: { fontSize: 22, fontWeight: 'bold', color: '#f3e8ff', marginBottom: 6 },
  taskCardType: { fontSize: 13, color: '#a78bfa', marginBottom: 10 },
  taskCardDesc: { fontSize: 15, color: '#d8b4fe', marginBottom: 16 },
  taskCardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  taskCardPoints: { fontSize: 16, color: '#4ade80', fontWeight: 'bold' },
  taskCardCta: { fontSize: 14, color: '#a78bfa' },
  noTaskCard: {
    backgroundColor: '#2d1b6b',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
  },
  noTaskEmoji: { fontSize: 48, marginBottom: 12 },
  noTaskText: { fontSize: 18, color: '#f3e8ff', fontWeight: 'bold', marginBottom: 6 },
  noTaskSub: { fontSize: 14, color: '#a78bfa' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#a78bfa', marginBottom: 12 },
  historyItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#2d1b6b', borderRadius: 10, padding: 14, marginBottom: 8,
  },
  historyTitle: { fontSize: 14, color: '#f3e8ff', flex: 1 },
  historyStatus: { fontSize: 12, fontWeight: 'bold', marginLeft: 8 },
  statusApproved: { color: '#4ade80' },
  statusRejected: { color: '#f87171' },
  statusPending: { color: '#fbbf24' },
  emptyText: { color: '#6b7280', textAlign: 'center', marginTop: 8 },
  introButton: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#4c1d95',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  introButtonText: { color: '#a78bfa', fontSize: 15 },
});


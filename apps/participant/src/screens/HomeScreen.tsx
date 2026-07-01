import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, ActivityIndicator
} from 'react-native';
import {
  collection, query, where, onSnapshot, orderBy,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; // Import this to track auth changes reactively
import { db, EVENT_ID, taskTypeLabel, auth } from '@bachelor-party/shared';
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
    rewards, setRewards,
    punishments, setPunishments,
    submissions, setSubmissions,
  } = useParticipantStore();

  const [loadingData, setLoadingData] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  // ── 1. Reactive Auth State Listener ────────────────────────────────────────
  useEffect(() => {
    // onAuthStateChanged fires once on mount with the persisted session (or null).
    // Only after this first callback do we know whether auth is ready.
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
    });

    return () => unsubscribeAuth();
  }, []);

  // ── Web browser notifications for new assignments ────────────────────────

  const seenAssignmentIds = useRef<Set<string>>(new Set());
  const notificationsInitialized = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof Notification === 'undefined') return;

    if (!notificationsInitialized.current) {
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
        new Notification('🚨 Nowe zadanie!', {
          body: task?.title ?? 'Czeka na Ciebie nowe zadanie!',
          icon: '/icon.png',
        });
      }
    };

    fire();
  }, [assignments, tasks]);

  // ── 2. Real-time Firestore listeners ────────────────────────────────────────

  useEffect(() => {
    // Wait for onAuthStateChanged to fire at least once before acting
    if (!authReady) return;

    // No authenticated session — nothing to load
    if (!firebaseUser) {
      setLoadingData(false);
      return;
    }

    // Participant not yet in store
    if (!currentParticipant?.id) {
      setLoadingData(false);
      return;
    }

    setLoadingData(true);

    let assignmentsLoaded = false;
    let fallbackTimeout: NodeJS.Timeout;

    // Safety fallback: if rules temporarily block or network lags, don't freeze the app
    fallbackTimeout = setTimeout(() => {
      setLoadingData(false);
    }, 3000);

    const unsubAssignments = onSnapshot(
      query(
        collection(db, 'events', EVENT_ID, 'assignments'),
        where('participantId', '==', currentParticipant.id),
        orderBy('triggeredAt', 'desc')
      ),
      (snap) => {
        setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any));
        assignmentsLoaded = true;
        setLoadingData(false);
        clearTimeout(fallbackTimeout);
      },
      (error) => {
        console.warn("Assignments stream error:", error.message);
        if (!assignmentsLoaded) {
          setTimeout(() => setLoadingData(false), 1000);
        }
      }
    );

    const unsubTasks = onSnapshot(
      collection(db, 'events', EVENT_ID, 'tasks'),
      (snap) => setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any)),
      (error) => console.warn("Tasks stream warning:", error.message)
    );

    const unsubRewards = onSnapshot(
      collection(db, 'events', EVENT_ID, 'rewards'),
      (snap) => setRewards(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any)),
      (error) => console.warn("Rewards stream warning:", error.message)
    );

    const unsubPunishments = onSnapshot(
      collection(db, 'events', EVENT_ID, 'punishments'),
      (snap) => setPunishments(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any)),
      (error) => console.warn("Punishments stream warning:", error.message)
    );

    const unsubSubmissions = onSnapshot(
      query(
        collection(db, 'events', EVENT_ID, 'submissions'),
        where('participantId', '==', currentParticipant.id),
        orderBy('submittedAt', 'desc')
      ),
      (snap) => setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any)),
      (error) => console.warn("Submissions stream warning:", error.message)
    );

    return () => {
      clearTimeout(fallbackTimeout);
      unsubAssignments();
      unsubTasks();
      unsubRewards();
      unsubPunishments();
      unsubSubmissions();
    };
    // Component dependency watches the state version of the auth session
  }, [currentParticipant?.id, authReady, firebaseUser]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const pendingAssignment = assignments.find((a) => a.status === 'pending');
  const activeTask = pendingAssignment
    ? tasks.find((t) => t.id === pendingAssignment.taskId)
    : null;

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

  if (loadingData) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#a78bfa" />
        <Text style={{ color: '#a78bfa', fontSize: 15, marginTop: 12, fontWeight: '500' }}>
          Synchronizowanie danych zdań...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Cześć, {currentParticipant?.name} {currentParticipant?.isGroom ? '👑' : '👋'}</Text>
            <Text style={styles.subGreeting}>Bądź czujny - nowe zadanie może wpaść w każdej chwili 😉</Text>
          </View>
        </View>

        {/* Active task */}
        {pendingAssignment && activeTask ? (
          <TouchableOpacity
            style={styles.taskCard}
            onPress={() => navigation.navigate('Task', { assignmentId: pendingAssignment.id })}
          >
            <View style={styles.taskCardHeader}>
              <Text style={styles.taskCardBadge}>🎯 AKTYWNE ZADANIE</Text>
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
            <Text style={styles.noTaskText}>Brak aktywnego zadania</Text>
            <Text style={styles.noTaskSub}>Organizator wkrótce wyśle kolejne...</Text>
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
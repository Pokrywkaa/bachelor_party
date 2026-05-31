import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Modal, FlatList, Alert, ActivityIndicator,
} from 'react-native';
import {
  collection, onSnapshot, addDoc, query, orderBy, where,
} from 'firebase/firestore';
import { db, EVENT_ID } from '@bachelor-party/shared';
import { useAdminStore } from '../store/adminStore';
import type { Assignment, Task } from '@bachelor-party/shared';

export default function DashboardScreen() {
  const {
    participants, setParticipants,
    tasks, setTasks,
    assignments, setAssignments,
    submissions, setSubmissions,
    rewards, setRewards,
    punishments, setPunishments,
    currentAdmin,
  } = useAdminStore();

  const [triggerModalVisible, setTriggerModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const [triggering, setTriggering] = useState(false);

  // ── Live data ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, 'events', EVENT_ID, 'participants'), orderBy('score', 'desc')),
        (s) => setParticipants(s.docs.map((d) => ({ id: d.id, ...d.data() }) as any))),
      onSnapshot(collection(db, 'events', EVENT_ID, 'tasks'),
        (s) => setTasks(s.docs.map((d) => ({ id: d.id, ...d.data() }) as any))),
      onSnapshot(query(collection(db, 'events', EVENT_ID, 'assignments'), orderBy('triggeredAt', 'desc')),
        (s) => setAssignments(s.docs.map((d) => ({ id: d.id, ...d.data() }) as any))),
      onSnapshot(query(collection(db, 'events', EVENT_ID, 'submissions'), orderBy('submittedAt', 'desc')),
        (s) => setSubmissions(s.docs.map((d) => ({ id: d.id, ...d.data() }) as any))),
      onSnapshot(collection(db, 'events', EVENT_ID, 'rewards'),
        (s) => setRewards(s.docs.map((d) => ({ id: d.id, ...d.data() }) as any))),
      onSnapshot(collection(db, 'events', EVENT_ID, 'punishments'),
        (s) => setPunishments(s.docs.map((d) => ({ id: d.id, ...d.data() }) as any))),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  // ── Stats ────────────────────────────────────────────────────────────────────

  const pendingSubmissions = submissions.filter((s) => !s.verdict).length;
  const totalAssignments = assignments.length;
  const approvedCount = submissions.filter((s) => s.verdict === 'approved').length;

  // ── Trigger task ─────────────────────────────────────────────────────────────

  const triggerTask = async () => {
    if (!selectedTask || !selectedParticipantId || !currentAdmin) return;
    setTriggering(true);
    try {
      const now = new Date();
      const expiresAt = selectedTask.durationSeconds
        ? new Date(now.getTime() + selectedTask.durationSeconds * 1000).toISOString()
        : null;

      await addDoc(collection(db, 'events', EVENT_ID, 'assignments'), {
        taskId: selectedTask.id,
        participantId: selectedParticipantId,
        triggeredBy: currentAdmin.id,
        triggeredAt: now.toISOString(),
        expiresAt,
        status: 'pending',
      } as Omit<Assignment, 'id'>);

      setTriggerModalVisible(false);
      setSelectedTask(null);
      setSelectedParticipantId('');
      Alert.alert('Task triggered!', `"${selectedTask.title}" sent.`);
    } catch (e) {
      Alert.alert('Error', 'Could not trigger task. Try again.');
    } finally {
      setTriggering(false);
    }
  };

  const nonAdminParticipants = participants.filter((p) => p.role === 'participant');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>📊 Dashboard</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalAssignments}</Text>
            <Text style={styles.statLabel}>Tasks Triggered</Text>
          </View>
          <View style={[styles.statCard, pendingSubmissions > 0 && styles.statCardAlert]}>
            <Text style={styles.statValue}>{pendingSubmissions}</Text>
            <Text style={styles.statLabel}>Pending Review</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{approvedCount}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
        </View>

        {/* Quick trigger */}
        <TouchableOpacity style={styles.triggerButton} onPress={() => setTriggerModalVisible(true)}>
          <Text style={styles.triggerButtonText}>🎯 Trigger a Task</Text>
        </TouchableOpacity>

        {/* Mini leaderboard */}
        <Text style={styles.sectionTitle}>🏆 Leaderboard</Text>
        {participants.slice(0, 5).map((p, i) => (
          <View key={p.id} style={styles.leaderRow}>
            <Text style={styles.leaderRank}>#{i + 1}</Text>
            <Text style={styles.leaderName}>{p.name}{p.isGroom ? ' 👑' : ''}</Text>
            <Text style={styles.leaderScore}>{p.score} pts</Text>
          </View>
        ))}

        {/* Recent assignments */}
        <Text style={styles.sectionTitle}>⚡ Recent Triggers</Text>
        {assignments.slice(0, 5).map((a) => {
          const task = tasks.find((t) => t.id === a.taskId);
          const participant = participants.find((p) => p.id === a.participantId);
          return (
            <View key={a.id} style={styles.recentRow}>
              <View style={styles.recentLeft}>
                <Text style={styles.recentTask}>{task?.title ?? '—'}</Text>
                <Text style={styles.recentParticipant}>→ {participant?.name ?? '—'}</Text>
              </View>
              <Text style={[styles.recentStatus,
                a.status === 'approved' && styles.statusGreen,
                a.status === 'rejected' && styles.statusRed,
                a.status === 'pending' && styles.statusYellow,
                a.status === 'submitted' && styles.statusBlue,
              ]}>{a.status.toUpperCase()}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Trigger Task Modal */}
      <Modal visible={triggerModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>🎯 Trigger a Task</Text>

            <Text style={styles.modalLabel}>Select Task:</Text>
            <FlatList
              data={tasks}
              keyExtractor={(t) => t.id}
              style={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, selectedTask?.id === item.id && styles.modalItemSelected]}
                  onPress={() => setSelectedTask(item)}
                >
                  <Text style={styles.modalItemText}>{item.title}</Text>
                  <Text style={styles.modalItemSub}>{item.points} pts · {item.type}</Text>
                </TouchableOpacity>
              )}
            />

            <Text style={styles.modalLabel}>Assign to:</Text>
            <FlatList
              data={nonAdminParticipants}
              keyExtractor={(p) => p.id}
              style={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, selectedParticipantId === item.id && styles.modalItemSelected]}
                  onPress={() => setSelectedParticipantId(item.id)}
                >
                  <Text style={styles.modalItemText}>{item.name}{item.isGroom ? ' 👑' : ''}</Text>
                </TouchableOpacity>
              )}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setTriggerModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, (!selectedTask || !selectedParticipantId) && styles.buttonDisabled]}
                onPress={triggerTask}
                disabled={!selectedTask || !selectedParticipantId || triggering}
              >
                {triggering ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalConfirmText}>Send 🚀</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, alignItems: 'center' },
  statCardAlert: { borderWidth: 1, borderColor: '#f59e0b' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#38bdf8' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4, textAlign: 'center' },
  triggerButton: { backgroundColor: '#0284c7', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 24 },
  triggerButtonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#94a3b8', marginBottom: 10 },
  leaderRow: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 10, padding: 12, marginBottom: 6 },
  leaderRank: { color: '#64748b', width: 30, fontSize: 14 },
  leaderName: { flex: 1, color: '#f1f5f9', fontSize: 14 },
  leaderScore: { color: '#38bdf8', fontWeight: 'bold', fontSize: 14 },
  recentRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1e293b', borderRadius: 10, padding: 12, marginBottom: 6 },
  recentLeft: {},
  recentTask: { color: '#f1f5f9', fontSize: 14, fontWeight: 'bold' },
  recentParticipant: { color: '#64748b', fontSize: 12 },
  recentStatus: { fontSize: 11, fontWeight: 'bold', alignSelf: 'center' },
  statusGreen: { color: '#4ade80' },
  statusRed: { color: '#f87171' },
  statusYellow: { color: '#fbbf24' },
  statusBlue: { color: '#60a5fa' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 16 },
  modalLabel: { fontSize: 14, color: '#94a3b8', marginBottom: 8, marginTop: 8 },
  modalList: { maxHeight: 150, marginBottom: 8 },
  modalItem: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, marginBottom: 6 },
  modalItemSelected: { borderWidth: 2, borderColor: '#0284c7' },
  modalItemText: { color: '#f1f5f9', fontSize: 15 },
  modalItemSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancel: { flex: 1, backgroundColor: '#334155', borderRadius: 10, padding: 14, alignItems: 'center' },
  modalCancelText: { color: '#94a3b8', fontSize: 15 },
  modalConfirm: { flex: 1, backgroundColor: '#0284c7', borderRadius: 10, padding: 14, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  buttonDisabled: { opacity: 0.5 },
});

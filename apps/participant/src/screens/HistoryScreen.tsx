import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { useParticipantStore } from '../store/participantStore';
import { taskTypeLabel } from '@bachelor-party/shared';
import type { Assignment } from '@bachelor-party/shared';

const STATUS_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  pending: { label: 'Oczekuje', color: '#fbbf24', emoji: '⏳' },
  submitted: { label: 'W ocenie', color: '#60a5fa', emoji: '🔍' },
  approved: { label: 'Zatwierdzone', color: '#4ade80', emoji: '✅' },
  rejected: { label: 'Odrzucone', color: '#f87171', emoji: '❌' },
  expired: { label: 'Wygaslo', color: '#6b7280', emoji: '⌛' },
};

export default function HistoryScreen() {
  const { assignments, tasks, submissions, rewards, punishments } = useParticipantStore();

  const renderItem = ({ item }: { item: Assignment }) => {
    const task = tasks.find((t) => t.id === item.taskId);
    const submission = submissions.find((s) => s.assignmentId === item.id);
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
    const reward = submission?.rewardId ? rewards.find((r) => r.id === submission.rewardId) : null;
    const punishment = submission?.punishmentId ? punishments.find((p) => p.id === submission.punishmentId) : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <Text style={styles.taskType}>{task ? taskTypeLabel(task.type) : ''}</Text>
            <Text style={styles.taskTitle}>{task?.title ?? 'Nieznane zadanie'}</Text>
            <Text style={styles.triggeredAt}>
              {new Date(item.triggeredAt).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: cfg.color }]}>
            <Text style={styles.statusEmoji}>{cfg.emoji}</Text>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {submission?.rating && (
          <Text style={styles.rating}>
            Ocena: {'⭐'.repeat(submission.rating)}
          </Text>
        )}

        {submission?.pointsAwarded !== undefined && (
          <Text style={[styles.points, { color: submission.pointsAwarded > 0 ? '#4ade80' : '#6b7280' }]}>
            {submission.pointsAwarded > 0 ? `+${submission.pointsAwarded} pkt` : '0 pkt'}
            {submission.isLate ? ' (po czasie)' : ''}
          </Text>
        )}

        {reward && (
          <View style={styles.rewardBadge}>
            <Text>{reward.icon} Nagroda: {reward.title}</Text>
          </View>
        )}

        {punishment && (
          <View style={styles.punishmentBadge}>
            <Text>{punishment.icon} Kara: {punishment.title}</Text>
          </View>
        )}

        {submission?.adminNote && (
          <Text style={styles.adminNote}>Notatka organizatora: "{submission.adminNote}"</Text>
        )}
      </View>
    );
  };

  const sorted = [...assignments].sort(
    (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>📋 Historia zadań</Text>
        <FlatList
          data={sorted}
          keyExtractor={(a) => a.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>Brak zadań</Text>
              <Text style={styles.emptySub}>Historia pojawi się tutaj po otrzymaniu zadań</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a0a2e' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f3e8ff', marginBottom: 20, textAlign: 'center' },
  list: { gap: 12 },
  card: { backgroundColor: '#2d1b6b', borderRadius: 14, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardLeft: { flex: 1, marginRight: 12 },
  taskType: { fontSize: 12, color: '#a78bfa', marginBottom: 4 },
  taskTitle: { fontSize: 17, fontWeight: 'bold', color: '#f3e8ff', marginBottom: 4 },
  triggeredAt: { fontSize: 12, color: '#6b7280' },
  statusBadge: { borderWidth: 1, borderRadius: 8, padding: 6, alignItems: 'center', minWidth: 70 },
  statusEmoji: { fontSize: 16, marginBottom: 2 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  rating: { color: '#fbbf24', fontSize: 14, marginTop: 6 },
  points: { fontSize: 15, fontWeight: 'bold', marginTop: 4 },
  rewardBadge: {
    backgroundColor: '#14532d', borderRadius: 8, padding: 8, marginTop: 8,
  },
  punishmentBadge: {
    backgroundColor: '#7f1d1d', borderRadius: 8, padding: 8, marginTop: 8,
  },
  adminNote: { color: '#9ca3af', fontSize: 13, fontStyle: 'italic', marginTop: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, color: '#f3e8ff', fontWeight: 'bold', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});

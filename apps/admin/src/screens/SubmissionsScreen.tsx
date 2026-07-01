import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useAdminStore } from '../store/adminStore';
import { taskTypeLabel } from '@bachelor-party/shared';
import type { Submission } from '@bachelor-party/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AdminNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AdminMain'>;
};

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

const FILTER_OPTIONS: Filter[] = ['all', 'pending', 'approved', 'rejected'];

export default function SubmissionsScreen({ navigation }: Props) {
  const { submissions, tasks, participants } = useAdminStore();
  const [filter, setFilter] = useState<Filter>('pending');

  const filtered = submissions.filter((s) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !s.verdict;
    return s.verdict === filter;
  });

  const renderItem = ({ item }: { item: Submission }) => {
    const task = tasks.find((t) => t.id === item.taskId);
    const participant = participants.find((p) => p.id === item.participantId);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('SubmissionReview', { submissionId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{participant?.name?.[0] ?? '?'}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.participantName}>{participant?.name ?? '—'}</Text>
            <Text style={styles.taskTitle}>{task?.title ?? '—'}</Text>
            <Text style={styles.taskType}>{task ? taskTypeLabel(task.type) : ''}</Text>
          </View>
          <View style={styles.statusCol}>
            {item.verdict ? (
              <Text style={[styles.verdict, item.verdict === 'approved' ? styles.verdictGreen : styles.verdictRed]}>
                {item.verdict === 'approved' ? '✅' : '❌'}
              </Text>
            ) : (
              <Text style={styles.pendingBadge}>⏳ Ocena</Text>
            )}
            {item.isLate && <Text style={styles.lateBadge}>Spóźnione</Text>}
          </View>
        </View>
        <Text style={styles.submittedAt}>
          {new Date(item.submittedAt).toLocaleString()}
        </Text>
        {item.mediaUrl && (
          <Text style={styles.mediaHint}>📎 Zawiera {item.mediaType}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>📥 Zgłoszenia</Text>

        {/* Filter tabs */}
        <View style={styles.filters}>
          {FILTER_OPTIONS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'Wszystkie' : f === 'pending' ? 'Oczekuje' : f === 'approved' ? 'Zatwierdzone' : 'Odrzucone'}
                {f === 'pending' && ` (${submissions.filter((s) => !s.verdict).length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>Brak {filter === 'all' ? '' : filter === 'pending' ? 'oczekujących ' : filter === 'approved' ? 'zatwierdzonych ' : 'odrzuconych '}zgłoszeń</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 16 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterTab: { flex: 1, backgroundColor: '#1e293b', borderRadius: 8, padding: 8, alignItems: 'center' },
  filterTabActive: { backgroundColor: '#0284c7' },
  filterText: { color: '#64748b', fontSize: 12, fontWeight: 'bold' },
  filterTextActive: { color: '#fff' },
  list: { gap: 10 },
  card: { backgroundColor: '#1e293b', borderRadius: 14, padding: 16 },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0284c7', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cardInfo: { flex: 1 },
  participantName: { color: '#f1f5f9', fontWeight: 'bold', fontSize: 15 },
  taskTitle: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  taskType: { color: '#38bdf8', fontSize: 11, marginTop: 2 },
  statusCol: { alignItems: 'flex-end', gap: 4 },
  verdict: { fontSize: 24 },
  verdictGreen: { color: '#4ade80' },
  verdictRed: { color: '#f87171' },
  pendingBadge: { color: '#fbbf24', fontSize: 12, fontWeight: 'bold' },
  lateBadge: { color: '#f87171', fontSize: 11, backgroundColor: '#7f1d1d', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  submittedAt: { color: '#475569', fontSize: 11 },
  mediaHint: { color: '#64748b', fontSize: 12, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#64748b', fontSize: 16 },
});

import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { useParticipantStore } from '../store/participantStore';
import { getInitials } from '@bachelor-party/shared';
import type { Participant } from '@bachelor-party/shared';

const RANK_COLORS = ['#fbbf24', '#d1d5db', '#cd7f32'];
const RANK_LABELS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const { participants, currentParticipant } = useParticipantStore();

  const renderItem = ({ item, index }: { item: Participant; index: number }) => {
    const isMe = item.id === currentParticipant?.id;
    const rankColor = RANK_COLORS[index] ?? '#a78bfa';
    const rankLabel = RANK_LABELS[index] ?? `#${index + 1}`;

    return (
      <View style={[styles.row, isMe && styles.rowHighlight]}>
        <Text style={[styles.rank, { color: rankColor }]}>{rankLabel}</Text>
        <View style={[styles.avatar, { backgroundColor: item.isGroom ? '#f59e0b' : '#4c1d95' }]}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          {item.isGroom && <Text style={styles.groomCrown}>👑</Text>}
        </View>
        <View style={styles.nameCol}>
          <Text style={styles.name}>{item.name}{isMe ? ' (you)' : ''}</Text>
          <Text style={styles.role}>{item.role === 'admin' ? '⚙️ Admin' : '🎮 Participant'}</Text>
        </View>
        <Text style={[styles.score, { color: rankColor }]}>{item.score} pts</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <FlatList
          data={participants}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No participants yet</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a0a2e' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f3e8ff', marginBottom: 20, textAlign: 'center' },
  list: { gap: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2d1b6b', borderRadius: 14, padding: 14, gap: 12,
  },
  rowHighlight: { borderWidth: 2, borderColor: '#7c3aed' },
  rank: { fontSize: 22, width: 40, textAlign: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#f3e8ff', fontWeight: 'bold', fontSize: 16 },
  groomCrown: { position: 'absolute', top: -10, fontSize: 14 },
  nameCol: { flex: 1 },
  name: { color: '#f3e8ff', fontWeight: 'bold', fontSize: 16 },
  role: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  score: { fontSize: 18, fontWeight: 'bold' },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 32 },
});

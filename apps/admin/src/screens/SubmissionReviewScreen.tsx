import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { Image } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db, EVENT_ID, calculatePoints } from '@bachelor-party/shared';
import { useAdminStore } from '../store/adminStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AdminNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SubmissionReview'>;
  route: RouteProp<RootStackParamList, 'SubmissionReview'>;
};

const STARS = [1, 2, 3, 4, 5];

// Inner component so useVideoPlayer hook is always called unconditionally
function VideoViewInline({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = false; });
  return (
    <VideoView player={player} style={styles.media} contentFit="contain" nativeControls />
  );
}

export default function SubmissionReviewScreen({ navigation, route }: Props) {
  const { submissionId } = route.params;
  const { submissions, tasks, participants, rewards, punishments } = useAdminStore();

  const submission = submissions.find((s) => s.id === submissionId);
  const task = submission ? tasks.find((t) => t.id === submission.taskId) : null;
  const participant = submission ? participants.find((p) => p.id === submission.participantId) : null;

  const [rating, setRating] = useState(submission?.rating ?? 3);
  const [adminNote, setAdminNote] = useState(submission?.adminNote ?? '');
  const [selectedRewardId, setSelectedRewardId] = useState(task?.rewardId ?? '');
  const [selectedPunishmentId, setSelectedPunishmentId] = useState(task?.punishmentId ?? '');
  const [saving, setSaving] = useState(false);

  if (!submission || !task || !participant) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Submission not found.</Text>
      </SafeAreaView>
    );
  }

  const verdict = async (v: 'approved' | 'rejected') => {
    setSaving(true);
    try {
      const pointsAwarded = v === 'approved'
        ? calculatePoints(task.points, rating, submission.isLate)
        : 0;

      await updateDoc(doc(db, 'events', EVENT_ID, 'submissions', submission.id), {
        verdict: v,
        rating,
        pointsAwarded,
        adminNote: adminNote.trim() || null,
        rewardId: v === 'approved' ? (selectedRewardId || null) : null,
        punishmentId: v === 'rejected' ? (selectedPunishmentId || null) : null,
      });

      // Update assignment status
      await updateDoc(doc(db, 'events', EVENT_ID, 'assignments', submission.assignmentId), {
        status: v,
      });

      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save verdict.');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const alreadyReviewed = !!submission.verdict;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Review Submission</Text>
        </View>

        {/* Participant & task info */}
        <View style={styles.infoCard}>
          <Text style={styles.participantName}>{participant.name}{participant.isGroom ? ' 👑' : ''}</Text>
          <Text style={styles.taskTitle}>{task.title}</Text>
          {submission.isLate && <Text style={styles.lateBadge}>⏰ Submitted late (–25% points)</Text>}
          <Text style={styles.submittedAt}>Submitted: {new Date(submission.submittedAt).toLocaleString()}</Text>
        </View>

        {/* Media preview */}
        {submission.mediaUrl && submission.mediaType === 'photo' && (
          <Image source={{ uri: submission.mediaUrl }} style={styles.media} resizeMode="contain" />
        )}
        {submission.mediaUrl && submission.mediaType === 'video' && (
          <VideoViewInline uri={submission.mediaUrl} />
        )}
        {submission.mediaUrl && submission.mediaType === 'audio' && (
          <View style={styles.audioCard}>
            <Text style={styles.audioText}>🎙️ Audio submission</Text>
            <Text style={styles.audioUrl} numberOfLines={1}>{submission.mediaUrl}</Text>
          </View>
        )}

        {/* Text answer */}
        {submission.answer && (
          <View style={styles.answerCard}>
            <Text style={styles.answerLabel}>Answer:</Text>
            <Text style={styles.answerText}>{submission.answer}</Text>
          </View>
        )}

        {/* GPS */}
        {submission.location && (
          <View style={styles.answerCard}>
            <Text style={styles.answerLabel}>📍 Location checked in</Text>
            <Text style={styles.answerText}>
              {submission.location.latitude.toFixed(5)}, {submission.location.longitude.toFixed(5)}
            </Text>
          </View>
        )}

        {/* Rating */}
        {!alreadyReviewed && (
          <>
            <Text style={styles.sectionLabel}>Rating</Text>
            <View style={styles.stars}>
              {STARS.map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Text style={[styles.star, s <= rating && styles.starActive]}>⭐</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingHint}>
              {calculatePoints(task.points, rating, submission.isLate)} pts will be awarded on approval
            </Text>

            {/* Admin note */}
            <Text style={styles.sectionLabel}>Admin Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={adminNote}
              onChangeText={setAdminNote}
              placeholder="Leave a message for the participant..."
              placeholderTextColor="#475569"
              multiline
            />

            {/* Reward / Punishment selector */}
            <Text style={styles.sectionLabel}>Reward on Approve</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.chip, !selectedRewardId && styles.chipActive]}
                onPress={() => setSelectedRewardId('')}
              >
                <Text style={styles.chipText}>None</Text>
              </TouchableOpacity>
              {rewards.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.chip, selectedRewardId === r.id && styles.chipActive]}
                  onPress={() => setSelectedRewardId(r.id)}
                >
                  <Text style={styles.chipText}>{r.icon} {r.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionLabel}>Punishment on Reject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.chip, !selectedPunishmentId && styles.chipActive]}
                onPress={() => setSelectedPunishmentId('')}
              >
                <Text style={styles.chipText}>None</Text>
              </TouchableOpacity>
              {punishments.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, selectedPunishmentId === p.id && styles.chipActive]}
                  onPress={() => setSelectedPunishmentId(p.id)}
                >
                  <Text style={styles.chipText}>{p.icon} {p.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Verdict buttons */}
            <View style={styles.verdictButtons}>
              <TouchableOpacity
                style={[styles.approveBtn, saving && styles.btnDisabled]}
                onPress={() => verdict('approved')}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>✅ Approve</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rejectBtn, saving && styles.btnDisabled]}
                onPress={() => verdict('rejected')}
                disabled={saving}
              >
                <Text style={styles.btnText}>❌ Reject</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {alreadyReviewed && (
          <View style={[styles.reviewedBanner,
            submission.verdict === 'approved' ? styles.reviewedApproved : styles.reviewedRejected
          ]}>
            <Text style={styles.reviewedText}>
              {submission.verdict === 'approved'
                ? `✅ Approved — ${submission.pointsAwarded} pts awarded`
                : '❌ Rejected — no points'}
            </Text>
            {submission.rating && <Text style={styles.reviewedRating}>Rating: {'⭐'.repeat(submission.rating)}</Text>}
            {submission.adminNote && <Text style={styles.reviewedNote}>"{submission.adminNote}"</Text>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  back: { color: '#38bdf8', fontSize: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#f1f5f9' },
  infoCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16 },
  participantName: { fontSize: 20, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 4 },
  taskTitle: { fontSize: 15, color: '#94a3b8', marginBottom: 6 },
  lateBadge: { color: '#fca5a5', fontSize: 13, marginBottom: 4 },
  submittedAt: { color: '#475569', fontSize: 12 },
  media: { width: '100%', height: 280, borderRadius: 12, backgroundColor: '#000', marginBottom: 16 },
  audioCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center' },
  audioText: { color: '#94a3b8', fontSize: 16, marginBottom: 4 },
  audioUrl: { color: '#475569', fontSize: 11 },
  answerCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16 },
  answerLabel: { color: '#64748b', fontSize: 12, marginBottom: 6 },
  answerText: { color: '#f1f5f9', fontSize: 16 },
  sectionLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  stars: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  star: { fontSize: 32, opacity: 0.3 },
  starActive: { opacity: 1 },
  ratingHint: { color: '#4ade80', fontSize: 13, marginBottom: 4 },
  noteInput: {
    backgroundColor: '#1e293b', borderRadius: 10, padding: 14,
    color: '#f1f5f9', fontSize: 14, borderWidth: 1, borderColor: '#334155',
    minHeight: 80, textAlignVertical: 'top', marginBottom: 4,
  },
  chip: {
    backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    marginRight: 8, borderWidth: 1, borderColor: '#334155',
  },
  chipActive: { borderColor: '#0284c7', backgroundColor: '#082f49' },
  chipText: { color: '#94a3b8', fontSize: 13 },
  verdictButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  approveBtn: { flex: 1, backgroundColor: '#166534', borderRadius: 12, padding: 16, alignItems: 'center' },
  rejectBtn: { flex: 1, backgroundColor: '#7f1d1d', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  btnDisabled: { opacity: 0.5 },
  reviewedBanner: { borderRadius: 14, padding: 20, alignItems: 'center', marginTop: 16 },
  reviewedApproved: { backgroundColor: '#14532d' },
  reviewedRejected: { backgroundColor: '#7f1d1d' },
  reviewedText: { color: '#f1f5f9', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  reviewedRating: { color: '#fbbf24', fontSize: 16, marginBottom: 6 },
  reviewedNote: { color: '#94a3b8', fontSize: 14, fontStyle: 'italic' },
  errorText: { color: '#f87171', textAlign: 'center', margin: 32, fontSize: 18 },
});

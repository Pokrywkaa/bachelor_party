import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { doc, updateDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, EVENT_ID, taskTypeLabel } from '@bachelor-party/shared';
import { useParticipantStore } from '../store/participantStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Submission } from '@bachelor-party/shared';

// Task-type sub-components
import PhotoTask from '../components/tasks/PhotoTask';
import VideoTask from '../components/tasks/VideoTask';
import AudioTask from '../components/tasks/AudioTask';
import QuizTask from '../components/tasks/QuizTask';
import GpsTask from '../components/tasks/GpsTask';
import TimedTask from '../components/tasks/TimedTask';
import DareTask from '../components/tasks/DareTask';
import CreativeTask from '../components/tasks/CreativeTask';
import CountdownRing from '../components/CountdownRing';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Task'>;
  route: RouteProp<RootStackParamList, 'Task'>;
};

// Result from each task sub-component
export interface TaskResult {
  mediaUri?: string;        // local file URI
  mediaType?: 'photo' | 'video' | 'audio';
  answer?: string;
  location?: { latitude: number; longitude: number };
  confirmed?: boolean;      // for timed / dare / physical
}

export default function TaskScreen({ navigation, route }: Props) {
  const { assignmentId } = route.params;
  const { assignments, tasks, currentParticipant, submissions } = useParticipantStore();

  const assignment = assignments.find((a) => a.id === assignmentId);
  const task = assignment ? tasks.find((t) => t.id === assignment.taskId) : null;

  const [result, setResult] = useState<TaskResult>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!assignment?.expiresAt) return;

    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(assignment.expiresAt!).getTime() - Date.now()) / 1000));
      setRemainingSeconds(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [assignment?.expiresAt]);

  const isLate = remainingSeconds !== null && remainingSeconds <= 0;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!assignment || !task || !currentParticipant) return;

    setSubmitting(true);
    try {
      let mediaUrl: string | undefined;

      // Upload media to Firebase Storage if present
      if (result.mediaUri && result.mediaType) {
        const response = await fetch(result.mediaUri);
        const blob = await response.blob();
        const ext = result.mediaType === 'photo' ? 'jpg' : result.mediaType === 'audio' ? 'm4a' : 'mp4';
        const storageRef = ref(
          storage,
          `events/${EVENT_ID}/submissions/${currentParticipant.id}/${assignment.id}.${ext}`
        );
        await uploadBytes(storageRef, blob);
        mediaUrl = await getDownloadURL(storageRef);
      }

      const submissionData: Omit<Submission, 'id'> = {
        assignmentId: assignment.id,
        taskId: task.id,
        participantId: currentParticipant.id,
        submittedAt: new Date().toISOString(),
        isLate,
        ...(mediaUrl && { mediaUrl, mediaType: result.mediaType }),
        ...(result.answer && { answer: result.answer }),
        ...(result.location && { location: result.location }),
      };

      // Create submission doc
      const submissionRef = await addDoc(
        collection(db, 'events', EVENT_ID, 'submissions'),
        submissionData
      );

      // Update assignment status
      await updateDoc(doc(db, 'events', EVENT_ID, 'assignments', assignment.id), {
        status: 'submitted',
        submissionId: submissionRef.id,
      });

      setSubmitted(true);
    } catch (error) {
      Alert.alert('Upload failed', 'Could not submit your response. Please try again.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }, [assignment, task, currentParticipant, result, isLate]);

  if (!task || !assignment) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Task not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (submitted || assignment.status === 'submitted') {
    return (
      <SafeAreaView style={[styles.container, styles.centeredContainer]}>
        <Text style={styles.doneEmoji}>✅</Text>
        <Text style={styles.doneTitle}>Submitted!</Text>
        <Text style={styles.doneSub}>Waiting for admin review...</Text>
        {isLate && <Text style={styles.lateWarning}>⚠️ Submitted late — 25% point deduction applies</Text>}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const renderTaskContent = () => {
    switch (task.type) {
      case 'photo':
        return <PhotoTask onResult={(r) => setResult(r)} />;
      case 'video':
        return <VideoTask maxDuration={task.maxVideoDurationSeconds ?? 60} onResult={(r) => setResult(r)} />;
      case 'audio':
        return <AudioTask onResult={(r) => setResult(r)} />;
      case 'quiz':
        return (
          <QuizTask
            options={task.quizOptions ?? []}
            onResult={(r) => setResult(r)}
          />
        );
      case 'gps':
        return <GpsTask target={task.gpsTarget!} onResult={(r) => setResult(r)} />;
      case 'timed':
        return <TimedTask description={task.description} onResult={(r) => setResult(r)} />;
      case 'dare':
        return <DareTask description={task.description} onResult={(r) => setResult(r)} />;
      case 'creative':
      case 'social':
      case 'memory':
      case 'physical':
        return <CreativeTask type={task.type} description={task.description} onResult={(r) => setResult(r)} />;
      default:
        return <CreativeTask type={task.type} description={task.description} onResult={(r) => setResult(r)} />;
    }
  };

  const canSubmit = () => {
    if (!task.mediaRequired) return true;
    if (['photo', 'video', 'audio'].includes(task.type)) return !!result.mediaUri;
    if (task.type === 'quiz') return !!result.answer;
    if (task.type === 'gps') return !!result.location;
    if (['timed', 'dare'].includes(task.type)) return result.confirmed === true;
    return true;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          {remainingSeconds !== null && task.durationSeconds && (
            <CountdownRing
              totalSeconds={task.durationSeconds}
              remainingSeconds={remainingSeconds}
              size={64}
            />
          )}
        </View>

        {isLate && (
          <View style={styles.lateBanner}>
            <Text style={styles.lateBannerText}>⏰ Time's up! You can still submit (–25% points)</Text>
          </View>
        )}

        {/* Task info */}
        <View style={styles.taskInfo}>
          <Text style={styles.taskType}>{taskTypeLabel(task.type)}</Text>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskDesc}>{task.description}</Text>
          <Text style={styles.taskPoints}>🏆 {task.points} points</Text>
        </View>

        {/* Task-specific UI */}
        <View style={styles.taskContent}>
          {renderTaskContent()}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, (!canSubmit() || submitting) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit() || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit Mission ✅</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a0a2e' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  centeredContainer: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backText: { color: '#a78bfa', fontSize: 16 },
  lateBanner: { backgroundColor: '#7f1d1d', borderRadius: 10, padding: 12, marginBottom: 16 },
  lateBannerText: { color: '#fca5a5', textAlign: 'center', fontSize: 14 },
  taskInfo: { marginBottom: 24 },
  taskType: { fontSize: 13, color: '#a78bfa', marginBottom: 6 },
  taskTitle: { fontSize: 26, fontWeight: 'bold', color: '#f3e8ff', marginBottom: 10 },
  taskDesc: { fontSize: 16, color: '#d8b4fe', lineHeight: 24, marginBottom: 12 },
  taskPoints: { fontSize: 15, color: '#4ade80', fontWeight: 'bold' },
  taskContent: { marginBottom: 32 },
  submitButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  errorText: { color: '#f87171', fontSize: 18, textAlign: 'center', margin: 32 },
  backButton: { alignSelf: 'center' },
  backButtonText: { color: '#a78bfa', fontSize: 16 },
  doneEmoji: { fontSize: 64, marginBottom: 16 },
  doneTitle: { fontSize: 28, fontWeight: 'bold', color: '#4ade80', marginBottom: 8 },
  doneSub: { fontSize: 16, color: '#a78bfa', marginBottom: 24 },
  lateWarning: { color: '#fca5a5', fontSize: 14, marginBottom: 20, textAlign: 'center' },
  button: {
    backgroundColor: '#7c3aed', borderRadius: 12, padding: 16,
    paddingHorizontal: 40, marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

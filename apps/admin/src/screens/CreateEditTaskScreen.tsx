import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, EVENT_ID, taskTypeLabel } from '@bachelor-party/shared';
import { useAdminStore } from '../store/adminStore';
import type { Task, TaskType } from '@bachelor-party/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AdminNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateEditTask'>;
  route: RouteProp<RootStackParamList, 'CreateEditTask'>;
};

const TASK_TYPES: TaskType[] = [
  'photo', 'video', 'quiz', 'audio', 'dare',
];

export default function CreateEditTaskScreen({ navigation, route }: Props) {
  const { taskId } = route.params ?? {};
  const { rewards, punishments, currentAdmin } = useAdminStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('photo');
  const [points, setPoints] = useState('100');
  const [duration, setDuration] = useState('');
  const [mediaRequired, setMediaRequired] = useState(false);
  const [rewardId, setRewardId] = useState<string>('');
  const [punishmentId, setPunishmentId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    getDoc(doc(db, 'events', EVENT_ID, 'tasks', taskId)).then((snap) => {
      if (!snap.exists()) return;
      const d = snap.data() as Task;
      setTitle(d.title);
      setDescription(d.description);
      setType(d.type);
      setPoints(String(d.points));
      setDuration(d.durationSeconds ? String(d.durationSeconds) : '');
      setMediaRequired(d.mediaRequired);
      setRewardId(d.rewardId ?? '');
      setPunishmentId(d.punishmentId ?? '');
    });
  }, [taskId]);

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing fields', 'Title and description are required.');
      return;
    }
    setSaving(true);
    try {
      const data: Omit<Task, 'id'> = {
        title: title.trim(),
        description: description.trim(),
        type,
        points: parseInt(points) || 100,
        durationSeconds: duration ? parseInt(duration) : null,
        mediaRequired,
        rewardId: rewardId || null,
        punishmentId: punishmentId || null,
        createdAt: new Date().toISOString(),
        createdBy: currentAdmin?.id ?? '',
      };

      if (taskId) {
        await updateDoc(doc(db, 'events', EVENT_ID, 'tasks', taskId), data as any);
      } else {
        await addDoc(collection(db, 'events', EVENT_ID, 'tasks'), data);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>✕ Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{taskId ? 'Edit Task' : 'New Task'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#38bdf8" /> : <Text style={styles.save}>Save ✓</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Take a selfie with a stranger" placeholderTextColor="#475569" />

        <Text style={styles.label}>Description *</Text>
        <TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} placeholder="Describe the task in detail..." placeholderTextColor="#475569" multiline numberOfLines={4} />

        <Text style={styles.label}>Task Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          {TASK_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, type === t && styles.typeChipActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                {taskTypeLabel(t)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Points</Text>
        <TextInput style={styles.input} value={points} onChangeText={setPoints} keyboardType="number-pad" placeholder="100" placeholderTextColor="#475569" />

        <Text style={styles.label}>Timer (seconds, leave blank for no timer)</Text>
        <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="number-pad" placeholder="e.g. 300 for 5 minutes" placeholderTextColor="#475569" />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Media Required</Text>
          <Switch
            value={mediaRequired}
            onValueChange={setMediaRequired}
            trackColor={{ false: '#334155', true: '#0284c7' }}
            thumbColor="#f1f5f9"
          />
        </View>

        <Text style={styles.label}>Reward (on success)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          <TouchableOpacity
            style={[styles.typeChip, !rewardId && styles.typeChipActive]}
            onPress={() => setRewardId('')}
          >
            <Text style={[styles.typeChipText, !rewardId && styles.typeChipTextActive]}>None</Text>
          </TouchableOpacity>
          {rewards.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.typeChip, rewardId === r.id && styles.typeChipActive]}
              onPress={() => setRewardId(r.id)}
            >
              <Text style={[styles.typeChipText, rewardId === r.id && styles.typeChipTextActive]}>
                {r.icon} {r.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Punishment (on failure)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          <TouchableOpacity
            style={[styles.typeChip, !punishmentId && styles.typeChipActive]}
            onPress={() => setPunishmentId('')}
          >
            <Text style={[styles.typeChipText, !punishmentId && styles.typeChipTextActive]}>None</Text>
          </TouchableOpacity>
          {punishments.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.typeChip, punishmentId === p.id && styles.typeChipActive]}
              onPress={() => setPunishmentId(p.id)}
            >
              <Text style={[styles.typeChipText, punishmentId === p.id && styles.typeChipTextActive]}>
                {p.icon} {p.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  back: { color: '#64748b', fontSize: 15 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#f1f5f9' },
  save: { color: '#38bdf8', fontSize: 16, fontWeight: 'bold' },
  label: { fontSize: 13, color: '#94a3b8', marginBottom: 6, marginTop: 14, fontWeight: '600' },
  input: {
    backgroundColor: '#1e293b', borderRadius: 10, padding: 14,
    color: '#f1f5f9', fontSize: 15, borderWidth: 1, borderColor: '#334155',
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  typeScroll: { marginBottom: 4 },
  typeChip: {
    backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    marginRight: 8, borderWidth: 1, borderColor: '#334155',
  },
  typeChipActive: { borderColor: '#0284c7', backgroundColor: '#082f49' },
  typeChipText: { color: '#64748b', fontSize: 13 },
  typeChipTextActive: { color: '#38bdf8', fontWeight: 'bold' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

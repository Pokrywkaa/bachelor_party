import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert,
} from 'react-native';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, EVENT_ID, taskTypeLabel } from '@bachelor-party/shared';
import { useAdminStore } from '../store/adminStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AdminNavigator';
import type { Task } from '@bachelor-party/shared';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AdminMain'>;
};

export default function TaskLibraryScreen({ navigation }: Props) {
  const { tasks } = useAdminStore();

  const handleDelete = (task: Task) => {
    Alert.alert('Usuń zadanie', `Usunąć "${task.title}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń', style: 'destructive',
        onPress: async () => {
          await deleteDoc(doc(db, 'events', EVENT_ID, 'tasks', task.id));
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Task }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.taskType}>{taskTypeLabel(item.type)}</Text>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.taskDesc} numberOfLines={2}>{item.description}</Text>
        </View>
        <Text style={styles.taskPoints}>{item.points} pts</Text>
      </View>
      <View style={styles.cardFooter}>
        {item.durationSeconds && (
          <Text style={styles.tag}>⏱️ {item.durationSeconds}s</Text>
        )}
        {item.mediaRequired && <Text style={styles.tag}>📎 Wymagane media</Text>}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('CreateEditTask', { taskId: item.id })}
          >
            <Text style={styles.editBtnText}>Edytuj</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Text style={styles.deleteBtnText}>Usuń</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🎯 Biblioteka zadań</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateEditTask', {})}
          >
            <Text style={styles.addButtonText}>+ Nowe</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={tasks}
          keyExtractor={(t) => t.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🎯</Text>
              <Text style={styles.emptyText}>Brak zadań</Text>
              <Text style={styles.emptySub}>Kliknij "+ Nowe", aby stworzyć pierwsze zadanie</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f1f5f9' },
  addButton: { backgroundColor: '#0284c7', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  list: { gap: 12 },
  card: { backgroundColor: '#1e293b', borderRadius: 14, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardLeft: { flex: 1, marginRight: 12 },
  taskType: { fontSize: 12, color: '#38bdf8', marginBottom: 4 },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 4 },
  taskDesc: { fontSize: 13, color: '#64748b' },
  taskPoints: { fontSize: 20, fontWeight: 'bold', color: '#4ade80' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  tag: { fontSize: 12, color: '#94a3b8', backgroundColor: '#0f172a', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  actions: { marginLeft: 'auto', flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: '#1d4ed8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { color: '#fff', fontSize: 13 },
  deleteBtn: { backgroundColor: '#7f1d1d', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  deleteBtnText: { color: '#fca5a5', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, color: '#f1f5f9', fontWeight: 'bold', marginBottom: 6 },
  emptySub: { fontSize: 14, color: '#64748b' },
});

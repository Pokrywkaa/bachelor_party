import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, EVENT_ID } from '@bachelor-party/shared';
import { useAdminStore } from '../store/adminStore';
import type { Reward, Punishment } from '@bachelor-party/shared';

type Mode = 'rewards' | 'punishments';

export default function RewardsPunishmentsScreen() {
  const { rewards, punishments } = useAdminStore();
  const [mode, setMode] = useState<Mode>('rewards');
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<Reward | Punishment | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [saving, setSaving] = useState(false);

  const items = mode === 'rewards' ? rewards : punishments;
  const colName = mode === 'rewards' ? 'rewards' : 'punishments';

  const openCreate = () => {
    setEditItem(null);
    setTitle('');
    setDescription('');
    setIcon(mode === 'rewards' ? '⭐' : '💀');
    setModalVisible(true);
  };

  const openEdit = (item: Reward | Punishment) => {
    setEditItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setIcon(item.icon);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const data = { title: title.trim(), description: description.trim(), icon: icon.trim() || '⭐', createdAt: new Date().toISOString() };
      if (editItem) {
        await updateDoc(doc(db, 'events', EVENT_ID, colName, editItem.id), data);
      } else {
        await addDoc(collection(db, 'events', EVENT_ID, colName), data);
      }
      setModalVisible(false);
    } catch {
      Alert.alert('Error', 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: Reward | Punishment) => {
    Alert.alert('Delete', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'events', EVENT_ID, colName, item.id));
      }},
    ]);
  };

  const renderItem = ({ item }: { item: Reward | Punishment }) => (
    <View style={styles.card}>
      <Text style={styles.cardIcon}>{item.icon}</Text>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc}>{item.description}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteBtnText}>Del</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>🎁 Rewards & Punishments</Text>

        {/* Mode toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'rewards' && styles.toggleBtnActive]}
            onPress={() => setMode('rewards')}
          >
            <Text style={[styles.toggleText, mode === 'rewards' && styles.toggleTextActive]}>🏆 Rewards</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'punishments' && styles.toggleBtnActive]}
            onPress={() => setMode('punishments')}
          >
            <Text style={[styles.toggleText, mode === 'punishments' && styles.toggleTextActive]}>💀 Punishments</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ Add {mode === 'rewards' ? 'Reward' : 'Punishment'}</Text>
        </TouchableOpacity>

        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No {mode} yet. Add some!</Text>}
        />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editItem ? 'Edit' : 'New'} {mode === 'rewards' ? 'Reward' : 'Punishment'}</Text>
            <TextInput style={styles.input} value={icon} onChangeText={setIcon} placeholder="Emoji icon" placeholderTextColor="#475569" />
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title *" placeholderTextColor="#475569" />
            <TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} placeholder="Description..." placeholderTextColor="#475569" multiline />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSaveText}>Save</Text>}
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
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 16 },
  toggle: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, padding: 4, marginBottom: 16 },
  toggleBtn: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#0284c7' },
  toggleText: { color: '#64748b', fontWeight: 'bold' },
  toggleTextActive: { color: '#fff' },
  addBtn: { backgroundColor: '#1e293b', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed' },
  addBtnText: { color: '#64748b', fontSize: 15 },
  list: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, gap: 12 },
  cardIcon: { fontSize: 32 },
  cardBody: { flex: 1 },
  cardTitle: { color: '#f1f5f9', fontWeight: 'bold', fontSize: 15 },
  cardDesc: { color: '#64748b', fontSize: 13, marginTop: 2 },
  cardActions: { gap: 6 },
  editBtn: { backgroundColor: '#1d4ed8', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  editBtnText: { color: '#fff', fontSize: 12 },
  deleteBtn: { backgroundColor: '#7f1d1d', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  deleteBtnText: { color: '#fca5a5', fontSize: 12 },
  empty: { color: '#475569', textAlign: 'center', marginTop: 40, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 16 },
  input: { backgroundColor: '#0f172a', borderRadius: 10, padding: 14, color: '#f1f5f9', fontSize: 15, borderWidth: 1, borderColor: '#334155', marginBottom: 10 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancel: { flex: 1, backgroundColor: '#334155', borderRadius: 10, padding: 14, alignItems: 'center' },
  modalCancelText: { color: '#94a3b8', fontSize: 15 },
  modalSave: { flex: 1, backgroundColor: '#0284c7', borderRadius: 10, padding: 14, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});

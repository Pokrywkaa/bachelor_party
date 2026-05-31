import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView,
  Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, EVENT_ID } from '@bachelor-party/shared';
import { useAdminStore } from '../store/adminStore';
import type { Participant, Assignment } from '@bachelor-party/shared';

export default function ParticipantsScreen() {
  const { participants, tasks, currentAdmin } = useAdminStore();
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [history, setHistory] = useState<Assignment[]>([]);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinTarget, setPinTarget] = useState<Participant | null>(null);
  const [newPin, setNewPin] = useState('');
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Participant | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');

  const sorted = [...participants].sort((a, b) => b.score - a.score);

  const setGroom = async (participant: Participant) => {
    Alert.alert('Set Groom', `Mark ${participant.name} as the groom?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes', onPress: async () => {
          for (const p of participants) {
            if (p.isGroom && p.id !== participant.id) {
              await updateDoc(doc(db, 'events', EVENT_ID, 'participants', p.id), { isGroom: false });
            }
          }
          await updateDoc(doc(db, 'events', EVENT_ID, 'participants', participant.id), { isGroom: true });
        },
      },
    ]);
  };

  const openAdjust = (participant: Participant) => {
    setAdjustTarget(participant);
    setAdjustAmount('');
    setAdjustModalVisible(true);
  };

  const handleAdjust = async () => {
    const delta = parseInt(adjustAmount, 10);
    if (isNaN(delta) || !adjustTarget) return;
    const newScore = Math.max(0, adjustTarget.score + delta);
    await updateDoc(doc(db, 'events', EVENT_ID, 'participants', adjustTarget.id), { score: newScore });
    setAdjustModalVisible(false);
  };

  const viewHistory = async (participant: Participant) => {
    setSelectedParticipant(participant);
    const q = query(collection(db, 'events', EVENT_ID, 'assignments'), where('participantId', '==', participant.id));
    const snap = await getDocs(q);
    setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as Assignment)));
    setHistoryVisible(true);
  };

  const openPinSetup = (participant: Participant) => {
    setPinTarget(participant);
    setNewPin('');
    setPinModalVisible(true);
  };

  const hashPin = (pin: string) => `pin:${pin}`;

  const handleSetPin = async () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      Alert.alert('Invalid PIN', 'PIN must be exactly 4 digits.');
      return;
    }
    if (!pinTarget) return;
    await updateDoc(doc(db, 'events', EVENT_ID, 'participants', pinTarget.id), {
      role: 'admin',
      pinHash: hashPin(newPin),
    });
    setPinModalVisible(false);
    Alert.alert('Done', `Admin PIN set for ${pinTarget.name}.`);
  };

  const renderParticipant = ({ item, index }: { item: Participant; index: number }) => {
    const rankColors = ['#f59e0b', '#94a3b8', '#b45309'];
    const rankColor = index < 3 ? rankColors[index] : '#64748b';
    const isCurrentAdmin = item.id === currentAdmin?.id;

    return (
      <View style={styles.card}>
        <View style={[styles.rankBadge, { backgroundColor: rankColor + '33', borderColor: rankColor }]}>
          <Text style={[styles.rankText, { color: rankColor }]}>#{index + 1}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.name}</Text>
            {item.isGroom && <Text style={styles.groomBadge}>👑 Groom</Text>}
            {item.role === 'admin' && <Text style={styles.adminBadge}>🔑 Admin</Text>}
            {isCurrentAdmin && <Text style={styles.youBadge}>You</Text>}
          </View>
          <Text style={styles.score}>Score: {item.score} pts</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => viewHistory(item)}>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openAdjust(item)}>
            <Text style={styles.actionText}>Score</Text>
          </TouchableOpacity>
          {!item.isGroom && (
            <TouchableOpacity style={[styles.actionBtn, styles.groomBtn]} onPress={() => setGroom(item)}>
              <Text style={styles.actionText}>👑</Text>
            </TouchableOpacity>
          )}
          {item.role !== 'admin' && (
            <TouchableOpacity style={[styles.actionBtn, styles.pinBtn]} onPress={() => openPinSetup(item)}>
              <Text style={styles.actionText}>🔑 PIN</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const getTaskTitle = (taskId: string) => tasks.find(t => t.id === taskId)?.title ?? taskId;

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#22c55e';
      case 'rejected': return '#ef4444';
      case 'submitted': return '#f59e0b';
      default: return '#475569';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>👥 Participants</Text>
        <Text style={styles.subtitle}>{participants.length} participants registered</Text>
        <FlatList
          data={sorted}
          keyExtractor={(p) => p.id}
          renderItem={renderParticipant}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No participants yet.</Text>}
        />
      </View>

      {/* History Modal */}
      <Modal visible={historyVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>📋 {selectedParticipant?.name}'s History</Text>
            <ScrollView style={styles.historyScroll}>
              {history.length === 0 ? (
                <Text style={styles.empty}>No assignments yet.</Text>
              ) : (
                history.map(a => (
                  <View key={a.id} style={styles.historyCard}>
                    <Text style={styles.historyTask}>{getTaskTitle(a.taskId)}</Text>
                    <View style={[styles.statusPill, { backgroundColor: statusColor(a.status) + '33' }]}>
                      <Text style={[styles.statusText, { color: statusColor(a.status) }]}>{a.status}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setHistoryVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Score Adjust Modal */}
      <Modal visible={adjustModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Adjust Score: {adjustTarget?.name}</Text>
            <Text style={styles.currentScore}>Current score: {adjustTarget?.score ?? 0}</Text>
            <TextInput
              style={styles.input}
              value={adjustAmount}
              onChangeText={setAdjustAmount}
              placeholder="e.g. +10 or -5"
              placeholderTextColor="#475569"
              keyboardType="numbers-and-punctuation"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setAdjustModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleAdjust}>
                <Text style={styles.modalSaveText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PIN Setup Modal */}
      <Modal visible={pinModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Set Admin PIN: {pinTarget?.name}</Text>
            <Text style={styles.pinHint}>This will grant admin access and set a 4-digit PIN.</Text>
            <TextInput
              style={styles.input}
              value={newPin}
              onChangeText={t => setNewPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
              placeholder="4-digit PIN"
              placeholderTextColor="#475569"
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setPinModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSetPin}>
                <Text style={styles.modalSaveText}>Set PIN</Text>
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
  title: { fontSize: 22, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 4 },
  subtitle: { color: '#64748b', marginBottom: 16, fontSize: 13 },
  list: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, gap: 10 },
  rankBadge: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontWeight: 'bold', fontSize: 13 },
  cardBody: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { color: '#f1f5f9', fontWeight: 'bold', fontSize: 15 },
  groomBadge: { backgroundColor: '#78350f', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, fontSize: 11, color: '#fbbf24' },
  adminBadge: { backgroundColor: '#1e3a5f', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, fontSize: 11, color: '#7dd3fc' },
  youBadge: { backgroundColor: '#1e3a5f', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, fontSize: 11, color: '#7dd3fc' },
  score: { color: '#64748b', fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'column', gap: 4 },
  actionBtn: { backgroundColor: '#0f172a', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  groomBtn: { backgroundColor: '#78350f' },
  pinBtn: { backgroundColor: '#1e3a5f' },
  actionText: { color: '#94a3b8', fontSize: 11 },
  empty: { color: '#475569', textAlign: 'center', marginTop: 40, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 12 },
  historyScroll: { maxHeight: 300, marginBottom: 12 },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 10, padding: 12, marginBottom: 8 },
  historyTask: { color: '#f1f5f9', fontSize: 14, flex: 1 },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  closeBtn: { backgroundColor: '#334155', borderRadius: 10, padding: 14, alignItems: 'center' },
  closeBtnText: { color: '#94a3b8', fontSize: 15 },
  currentScore: { color: '#64748b', marginBottom: 12, fontSize: 14 },
  input: { backgroundColor: '#0f172a', borderRadius: 10, padding: 14, color: '#f1f5f9', fontSize: 15, borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  pinHint: { color: '#64748b', fontSize: 13, marginBottom: 12 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, backgroundColor: '#334155', borderRadius: 10, padding: 14, alignItems: 'center' },
  modalCancelText: { color: '#94a3b8', fontSize: 15 },
  modalSave: { flex: 1, backgroundColor: '#0284c7', borderRadius: 10, padding: 14, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});

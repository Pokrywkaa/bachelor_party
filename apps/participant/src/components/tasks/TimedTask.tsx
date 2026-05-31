import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { TaskResult } from '../../screens/TaskScreen';

interface Props {
  description: string;
  onResult: (r: TaskResult) => void;
}

export default function TimedTask({ description, onResult }: Props) {
  const [confirmed, setConfirmed] = useState(false);

  const confirm = () => {
    setConfirmed(true);
    onResult({ confirmed: true, answer: 'Completed' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoCard}>
        <Text style={styles.infoEmoji}>⏱️</Text>
        <Text style={styles.infoText}>
          Complete the task described above, then tap the button below to confirm you did it!
        </Text>
      </View>
      {confirmed ? (
        <View style={styles.doneCard}>
          <Text style={styles.doneEmoji}>✅</Text>
          <Text style={styles.doneText}>Marked as done!</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={confirm}>
          <Text style={styles.buttonText}>✅ I Did It!</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  infoCard: { backgroundColor: '#2d1b6b', borderRadius: 16, padding: 20, alignItems: 'center' },
  infoEmoji: { fontSize: 36, marginBottom: 10 },
  infoText: { color: '#d8b4fe', textAlign: 'center', fontSize: 15, lineHeight: 22 },
  doneCard: { backgroundColor: '#14532d', borderRadius: 16, padding: 24, alignItems: 'center' },
  doneEmoji: { fontSize: 40, marginBottom: 8 },
  doneText: { color: '#4ade80', fontSize: 18, fontWeight: 'bold' },
  button: { backgroundColor: '#22c55e', borderRadius: 12, padding: 18, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

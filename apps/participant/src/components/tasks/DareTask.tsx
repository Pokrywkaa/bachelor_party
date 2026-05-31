import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { TaskResult } from '../../screens/TaskScreen';

interface Props {
  description: string;
  onResult: (r: TaskResult) => void;
}

export default function DareTask({ description, onResult }: Props) {
  const [verdict, setVerdict] = useState<'done' | 'failed' | null>(null);

  const choose = (v: 'done' | 'failed') => {
    setVerdict(v);
    onResult({ confirmed: v === 'done', answer: v === 'done' ? 'Completed dare' : 'Failed dare' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.dareCard}>
        <Text style={styles.dareEmoji}>😈</Text>
        <Text style={styles.dareInstruction}>Do you accept and complete the dare?</Text>
      </View>

      {verdict ? (
        <View style={[styles.resultCard, verdict === 'done' ? styles.successCard : styles.failCard]}>
          <Text style={styles.resultEmoji}>{verdict === 'done' ? '✅' : '❌'}</Text>
          <Text style={styles.resultText}>
            {verdict === 'done' ? 'Dare completed! Awaiting review.' : 'Dare failed. Face the consequences.'}
          </Text>
        </View>
      ) : (
        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.button, styles.doneButton]} onPress={() => choose('done')}>
            <Text style={styles.buttonText}>✅ Done!</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.failButton]} onPress={() => choose('failed')}>
            <Text style={styles.buttonText}>❌ I Failed</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  dareCard: { backgroundColor: '#3b0764', borderRadius: 16, padding: 24, alignItems: 'center' },
  dareEmoji: { fontSize: 48, marginBottom: 12 },
  dareInstruction: { color: '#e9d5ff', fontSize: 16, textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, borderRadius: 12, padding: 18, alignItems: 'center' },
  doneButton: { backgroundColor: '#22c55e' },
  failButton: { backgroundColor: '#ef4444' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultCard: { borderRadius: 16, padding: 24, alignItems: 'center' },
  successCard: { backgroundColor: '#14532d' },
  failCard: { backgroundColor: '#7f1d1d' },
  resultEmoji: { fontSize: 40, marginBottom: 8 },
  resultText: { color: '#f3e8ff', fontSize: 15, textAlign: 'center' },
});

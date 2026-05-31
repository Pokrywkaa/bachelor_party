import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import type { QuizOption } from '@bachelor-party/shared';
import type { TaskResult } from '../../screens/TaskScreen';

interface Props {
  options: QuizOption[];
  onResult: (r: TaskResult) => void;
}

export default function QuizTask({ options, onResult }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');

  const isFreeText = options.length === 0;

  const selectOption = (id: string) => {
    setSelected(id);
    const option = options.find((o) => o.id === id);
    if (option) onResult({ answer: option.text });
  };

  const handleTextChange = (text: string) => {
    setFreeText(text);
    onResult({ answer: text });
  };

  if (isFreeText) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Your Answer:</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Type your answer here..."
          placeholderTextColor="#6b7280"
          value={freeText}
          onChangeText={handleTextChange}
          multiline
          numberOfLines={4}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Choose the correct answer:</Text>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.option, selected === opt.id && styles.optionSelected]}
          onPress={() => selectOption(opt.id)}
        >
          <Text style={[styles.optionText, selected === opt.id && styles.optionTextSelected]}>
            {opt.text}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label: { color: '#a78bfa', fontSize: 15, marginBottom: 4 },
  option: {
    backgroundColor: '#2d1b6b', borderRadius: 12, padding: 16,
    borderWidth: 2, borderColor: '#4c1d95',
  },
  optionSelected: { borderColor: '#7c3aed', backgroundColor: '#3b0764' },
  optionText: { color: '#d8b4fe', fontSize: 16 },
  optionTextSelected: { color: '#f3e8ff', fontWeight: 'bold' },
  textInput: {
    backgroundColor: '#2d1b6b', borderRadius: 12, padding: 16,
    color: '#f3e8ff', fontSize: 16, borderWidth: 1, borderColor: '#4c1d95',
    minHeight: 120, textAlignVertical: 'top',
  },
});

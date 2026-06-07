import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { TaskResult } from '../../screens/TaskScreen';

interface Props {
  type: string;
  description: string;
  onResult: (r: TaskResult) => void;
}

const TYPE_CONFIG: Record<string, { emoji: string; hint: string; requiresMedia: boolean }> = {
  creative: { emoji: '🎨', hint: 'Opisz swoja kreatywna odpowiedz albo dodaj zdjecie/wideo.', requiresMedia: false },
  social: { emoji: '📱', hint: 'Opublikuj w social media i dolacz zrzut ekranu jako dowod.', requiresMedia: true },
  memory: { emoji: '🧩', hint: 'Wpisz odpowiedz z pamieci.', requiresMedia: false },
  physical: { emoji: '💪', hint: 'Nagraj wideo, jak wykonujesz wyzwanie.', requiresMedia: true },
};

export default function CreativeTask({ type, description, onResult }: Props) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.creative;
  const [text, setText] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');

  const update = (newText: string, uri?: string, mType?: 'photo' | 'video') => {
    onResult({
      answer: newText || undefined,
      ...(uri && { mediaUri: uri, mediaType: mType ?? 'photo' }),
    });
  };

  const attachMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'] as const,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mType = asset.type === 'video' ? 'video' : 'photo';
      setMediaUri(asset.uri);
      setMediaType(mType);
      update(text, asset.uri, mType);
    }
  };

  const handleTextChange = (val: string) => {
    setText(val);
    update(val, mediaUri ?? undefined, mediaType);
  };

  return (
    <View style={styles.container}>
      <View style={styles.hintCard}>
        <Text style={styles.hintEmoji}>{config.emoji}</Text>
        <Text style={styles.hintText}>{config.hint}</Text>
      </View>

      <TextInput
        style={styles.textInput}
        placeholder={type === 'memory' ? 'Twoja odpowiedz...' : 'Dodaj notatke (opcjonalnie)...'}
        placeholderTextColor="#6b7280"
        value={text}
        onChangeText={handleTextChange}
        multiline
        numberOfLines={4}
      />

      {mediaUri ? (
        <View>
          {mediaType === 'photo' ? (
            <Image source={{ uri: mediaUri }} style={styles.preview} />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>🎥 Wideo dolaczone</Text>
            </View>
          )}
          <TouchableOpacity style={styles.reattachButton} onPress={attachMedia}>
            <Text style={styles.reattachText}>Zmien multimedia</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={attachMedia}>
          <Text style={styles.buttonText}>📎 Dolacz zdjecie / wideo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  hintCard: { backgroundColor: '#2d1b6b', borderRadius: 12, padding: 16, flexDirection: 'row', gap: 10, alignItems: 'center' },
  hintEmoji: { fontSize: 28 },
  hintText: { color: '#d8b4fe', fontSize: 14, flex: 1, lineHeight: 20 },
  textInput: {
    backgroundColor: '#2d1b6b', borderRadius: 12, padding: 16,
    color: '#f3e8ff', fontSize: 15, borderWidth: 1, borderColor: '#4c1d95',
    minHeight: 100, textAlignVertical: 'top',
  },
  preview: { width: '100%', height: 200, borderRadius: 12, marginBottom: 6 },
  videoPlaceholder: {
    backgroundColor: '#1e1b4b', borderRadius: 12, height: 80,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  videoPlaceholderText: { color: '#a78bfa', fontSize: 16 },
  reattachButton: { alignItems: 'center', padding: 6 },
  reattachText: { color: '#a78bfa', fontSize: 13 },
  button: { backgroundColor: '#7c3aed', borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonSecondary: { backgroundColor: '#4c1d95' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});

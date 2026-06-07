import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { TaskResult } from '../../screens/TaskScreen';

interface Props {
  maxDuration: number;
  onResult: (r: TaskResult) => void;
}

export default function VideoTask({ maxDuration, onResult }: Props) {
  const [uri, setUri] = useState<string | null>(null);
  const player = useVideoPlayer(uri ?? null, (p) => { p.loop = false; });

  const recordVideo = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Wymagane uprawnienie', 'Aby nagrac wideo, potrzebny jest dostep do aparatu.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'videos' as const,
      videoMaxDuration: maxDuration,
      quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });
    if (!result.canceled && result.assets[0]) {
      setUri(result.assets[0].uri);
      onResult({ mediaUri: result.assets[0].uri, mediaType: 'video' });
    }
  };

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'videos' as const,
    });
    if (!result.canceled && result.assets[0]) {
      setUri(result.assets[0].uri);
      onResult({ mediaUri: result.assets[0].uri, mediaType: 'video' });
    }
  };

  return (
    <View style={styles.container}>
      {uri ? (
        <VideoView
          player={player}
          style={styles.preview}
          contentFit="contain"
          nativeControls
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>🎥</Text>
          <Text style={styles.placeholderText}>Maksymalny czas: {maxDuration}s</Text>
        </View>
      )}
      <TouchableOpacity style={styles.button} onPress={recordVideo}>
        <Text style={styles.buttonText}>🎬 Nagraj wideo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={pickVideo}>
        <Text style={styles.buttonText}>📁 Wybierz z galerii</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  preview: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#000', marginBottom: 8 },
  placeholder: {
    backgroundColor: '#2d1b6b', borderRadius: 12, height: 160,
    justifyContent: 'center', alignItems: 'center',
  },
  placeholderEmoji: { fontSize: 40, marginBottom: 8 },
  placeholderText: { color: '#6b7280', fontSize: 14 },
  button: { backgroundColor: '#7c3aed', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonSecondary: { backgroundColor: '#4c1d95' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});


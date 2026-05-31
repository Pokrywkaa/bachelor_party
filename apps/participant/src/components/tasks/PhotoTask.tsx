import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { TaskResult } from '../../screens/TaskScreen';

interface Props {
  onResult: (r: TaskResult) => void;
}

export default function PhotoTask({ onResult }: Props) {
  const [uri, setUri] = useState<string | null>(null);

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Camera access is needed to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images' as const,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setUri(result.assets[0].uri);
      onResult({ mediaUri: result.assets[0].uri, mediaType: 'photo' });
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Gallery access is needed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as const,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setUri(result.assets[0].uri);
      onResult({ mediaUri: result.assets[0].uri, mediaType: 'photo' });
    }
  };

  return (
    <View style={styles.container}>
      {uri ? (
        <View>
          <Image source={{ uri }} style={styles.preview} />
          <TouchableOpacity style={styles.retakeButton} onPress={takePhoto}>
            <Text style={styles.retakeText}>Retake Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>📸</Text>
          <Text style={styles.placeholderText}>No photo taken yet</Text>
        </View>
      )}
      <TouchableOpacity style={styles.button} onPress={takePhoto}>
        <Text style={styles.buttonText}>📷 Take Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={pickFromGallery}>
        <Text style={styles.buttonText}>🖼️ Pick from Gallery</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  preview: { width: '100%', height: 220, borderRadius: 12, marginBottom: 8 },
  retakeButton: { alignItems: 'center', padding: 8 },
  retakeText: { color: '#a78bfa', fontSize: 14 },
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

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import {
  useAudioPlayer,
  useAudioRecorder,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from 'expo-audio';
import type { TaskResult } from '../../screens/TaskScreen';

interface Props {
  onResult: (r: TaskResult) => void;
}

export default function AudioTask({ onResult }: Props) {
  const [uri, setUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(uri ?? null);

  const startRecording = async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission required', 'Microphone access is needed.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch (e) {
      Alert.alert('Error', 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    await recorder.stop();
    const fileUri = recorder.uri;
    setIsRecording(false);
    if (fileUri) {
      setUri(fileUri);
      onResult({ mediaUri: fileUri, mediaType: 'audio' });
    }
  };

  const togglePlayback = () => {
    if (!uri) return;
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.visualizer}>
        <Text style={styles.micEmoji}>{isRecording ? '🔴' : uri ? '✅' : '🎙️'}</Text>
        <Text style={styles.status}>
          {isRecording ? 'Recording...' : uri ? 'Recording ready' : 'Tap to record'}
        </Text>
      </View>

      {!isRecording && !uri && (
        <TouchableOpacity style={styles.button} onPress={startRecording}>
          <Text style={styles.buttonText}>🎙️ Start Recording</Text>
        </TouchableOpacity>
      )}

      {isRecording && (
        <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopRecording}>
          <Text style={styles.buttonText}>⏹️ Stop Recording</Text>
        </TouchableOpacity>
      )}

      {uri && !isRecording && (
        <View style={{ gap: 10 }}>
          <TouchableOpacity style={styles.button} onPress={togglePlayback}>
            <Text style={styles.buttonText}>{player.playing ? '⏹️ Stop' : '▶️ Play Recording'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={startRecording}>
            <Text style={styles.buttonText}>🔄 Record Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  visualizer: {
    backgroundColor: '#2d1b6b', borderRadius: 16, padding: 32,
    alignItems: 'center', marginBottom: 8,
  },
  micEmoji: { fontSize: 48, marginBottom: 8 },
  status: { color: '#a78bfa', fontSize: 15 },
  button: { backgroundColor: '#7c3aed', borderRadius: 12, padding: 16, alignItems: 'center' },
  stopButton: { backgroundColor: '#ef4444' },
  buttonSecondary: { backgroundColor: '#4c1d95' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

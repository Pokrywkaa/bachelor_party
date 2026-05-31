import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import type { GpsTarget } from '@bachelor-party/shared';
import type { TaskResult } from '../../screens/TaskScreen';

interface Props {
  target: GpsTarget;
  onResult: (r: TaskResult) => void;
}

function haversineDistanceMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function GpsTask({ target, onResult }: Props) {
  const [checking, setChecking] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [verified, setVerified] = useState(false);

  const checkIn = async () => {
    setChecking(true);
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission required', 'Location access is needed for this task.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = pos.coords;
      const dist = haversineDistanceMeters(latitude, longitude, target.latitude, target.longitude);
      setDistance(Math.round(dist));

      if (dist <= target.radiusMeters) {
        setVerified(true);
        onResult({ location: { latitude, longitude }, confirmed: true });
      } else {
        Alert.alert(
          'Not close enough',
          `You are ${Math.round(dist)}m away. You need to be within ${target.radiusMeters}m of "${target.label}".`
        );
      }
    } catch {
      Alert.alert('Error', 'Could not get your location. Try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.targetCard}>
        <Text style={styles.targetEmoji}>📍</Text>
        <Text style={styles.targetLabel}>Target Location</Text>
        <Text style={styles.targetName}>{target.label}</Text>
        <Text style={styles.targetRadius}>Must be within {target.radiusMeters}m</Text>
      </View>

      {distance !== null && !verified && (
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>You are {distance}m away — keep moving!</Text>
        </View>
      )}

      {verified ? (
        <View style={styles.successCard}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={styles.successText}>Location verified!</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={checkIn} disabled={checking}>
          {checking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>📡 Check In Here</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  targetCard: {
    backgroundColor: '#2d1b6b', borderRadius: 16, padding: 24, alignItems: 'center',
  },
  targetEmoji: { fontSize: 40, marginBottom: 8 },
  targetLabel: { color: '#a78bfa', fontSize: 13, marginBottom: 4 },
  targetName: { color: '#f3e8ff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  targetRadius: { color: '#6b7280', fontSize: 13, marginTop: 6 },
  distanceBadge: { backgroundColor: '#7f1d1d', borderRadius: 10, padding: 12 },
  distanceText: { color: '#fca5a5', textAlign: 'center' },
  successCard: {
    backgroundColor: '#14532d', borderRadius: 16, padding: 24, alignItems: 'center',
  },
  successEmoji: { fontSize: 40, marginBottom: 8 },
  successText: { color: '#4ade80', fontSize: 18, fontWeight: 'bold' },
  button: { backgroundColor: '#7c3aed', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

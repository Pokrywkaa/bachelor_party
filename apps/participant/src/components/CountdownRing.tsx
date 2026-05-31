import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface Props {
  totalSeconds: number;
  remainingSeconds: number;
  size?: number;
}

export default function CountdownRing({ totalSeconds, remainingSeconds, size = 56 }: Props) {
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const isUrgent = progress < 0.2;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2, borderWidth: 4 },
        isUrgent ? styles.ringUrgent : styles.ringNormal,
      ]} />
      <Text style={[styles.text, isUrgent && styles.textUrgent, { fontSize: size * 0.22 }]}>
        {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a0a2e',
  },
  ring: {
    position: 'absolute',
    borderStyle: 'solid',
  },
  ringNormal: { borderColor: '#7c3aed' },
  ringUrgent: { borderColor: '#ef4444' },
  text: { color: '#f3e8ff', fontWeight: 'bold' },
  textUrgent: { color: '#ef4444' },
});

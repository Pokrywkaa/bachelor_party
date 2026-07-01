import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useParticipantStore } from '../store/participantStore';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OnboardingStandard'>;
};

const SLIDES = [
  {
    id: '1',
    emoji: '🎉',
    title: 'Witamy!',
    body: 'Jesteś częścią wieczoru kawalerskiego Konrada. Powodzenia!',
  }
];

export default function OnboardingStandardScreen({ navigation }: Props) {
  const { setHasCompletedOnboarding } = useParticipantStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const slide = SLIDES[currentIndex];

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setHasCompletedOnboarding(true);
      navigation.replace('Main');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.slide}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={goNext}>
        <Text style={styles.buttonText}>
          {currentIndex < SLIDES.length - 1 ? 'Dalej →' : 'Start! 🚀'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0a2e',
    paddingBottom: 40,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emoji: { fontSize: 80, marginBottom: 24 },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#a78bfa',
    textAlign: 'center',
    marginBottom: 20,
  },
  body: {
    fontSize: 17,
    color: '#e9d5ff',
    textAlign: 'center',
    lineHeight: 26,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4c1d95' },
  dotActive: { backgroundColor: '#a78bfa', width: 24 },
  button: {
    marginHorizontal: 32,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

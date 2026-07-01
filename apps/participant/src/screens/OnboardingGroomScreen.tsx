import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useParticipantStore } from '../store/participantStore';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OnboardingGroom'>;
};

// These slides are placeholders — update content in Firestore or here before the event
const GROOM_SLIDES = [
  {
    id: '1',
    emoji: '👑',
    title: 'Siema Pecie, witamy na Kawalerskim!',
    body: 'Albo wszyscy albo razem',
  },
  {
    id: '2',
    emoji: '🤝',
    title: 'Ale żeście ekipe zmontowali',
    body: 'Przez weekend będą towarzyszyć Ci: \n Kociu • Damian • Sali • Szwagier • Tomek • Rąpała • Kamzo • Felo • Chubert',
  },
  {
    id: '3',
    emoji: '📍',
    title: 'Miejsce',
    body: 'Cel wycieczki już znasz bo pewien gagatek sie już wysprzęglił, więc nie jest to tajemnicą, że jest to MALTA',
  },
  {
    id: '4',
    emoji: '📱',
    title: 'Aplikacja',
    body: 'Apka została stworzona na potrzebe Twojego kawalerskiego. Gdy telefon zawibruje lub poinformujemy Cię o sprawdzenie go, otrzymasz zadania do wykonania.',
  },
  {
    id: '5',
    emoji: '📱',
    title: 'Zadania',
    body: 'Do wykonania będziesz miał zadania przez nas stworzone. Dwóch z organizatorów ma dostęp do panelu admina gdzie mogą wysyłać Ci zadania w dowolnym momencie. Istnieją różne typy zadań np. zrobienie zdjęcia, nagranie audio itd, niektóre z nich mogą mieć ograniczenie czasowe ;)',
  },
  {
    id: '6',
    emoji: '🏆',
    title: 'Nagrody i kary',
    body: 'Każde wysłane zadanie będzie weryfikowane przez wykwalifikowanych ekspertów, a następnie otrzymasz potencjalną nagrode lub kare.',
  },
  {
    id: '7',
    emoji: '🎊',
    title: 'Powodzenia byczku',
    body: '',
  },
];

export default function OnboardingGroomScreen({ navigation }: Props) {
  const { setHasCompletedOnboarding } = useParticipantStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const slide = GROOM_SLIDES[currentIndex];

  const goNext = () => {
    if (currentIndex < GROOM_SLIDES.length - 1) {
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

      {/* Dots */}
      <View style={styles.dots}>
        {GROOM_SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={goNext}>
        <Text style={styles.buttonText}>
          {currentIndex < GROOM_SLIDES.length - 1 ? 'Dalej →' : 'SIUUUUUUUUU! 🎉'}
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
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fbbf24',
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4c1d95',
  },
  dotActive: {
    backgroundColor: '#fbbf24',
    width: 24,
  },
  button: {
    marginHorizontal: 32,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#1a0a2e',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

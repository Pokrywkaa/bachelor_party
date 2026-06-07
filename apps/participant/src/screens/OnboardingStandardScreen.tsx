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
    title: 'Witamy na imprezie!',
    body: 'Jesteś częścią wieczoru kawalerskiego Konrada. Dzisiaj czeka Cię miejska przygoda z misjami. Przygotuj się na zadania.',
  },
  {
    id: '2',
    emoji: '📱',
    title: 'Jak działają zadania',
    body: 'Gdy organizator uruchomi dla Ciebie zadanie, telefon wyśle powiadomienie push. Otwórz aplikację, a zobaczysz swoją misję ze wszystkimi szczegółami.',
  },
  {
    id: '3',
    emoji: '⏱️',
    title: 'Liczniki czasu',
    body: 'Niektore zadania maja odliczanie. Wykonaj i wyslij przed uplywem czasu, aby dostac pelne punkty. Mozesz wyslac po czasie, ale tracisz 25% punktow.',
  },
  {
    id: '4',
    emoji: '📸',
    title: 'Typy zadan',
    body: 'Zadania obejmuja zdjecia i filmy, check-in GPS, quizy, wyzwania i wiele wiecej. Badz kreatywny - sedziowie patrza!',
  },
  {
    id: '5',
    emoji: '🏆',
    title: 'Ranking',
    body: 'Punkty sa przyznawane po ocenie organizatora. Sprawdz ranking na zywo i zobacz swoje miejsce. Na odwaznych czekaja nagrody, na reszte - kary.',
  },
  {
    id: '6',
    emoji: '🚀',
    title: 'Gotowy!',
    body: 'Badz czujny, trzymaj telefon blisko i baw sie dobrze. Organizator moze wyslac Ci zadanie w kazdej chwili. Powodzenia!',
  },
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

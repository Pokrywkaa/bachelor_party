import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  useWindowDimensions, Animated,
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
    title: 'The Man of the Hour',
    body: 'Welcome, Adam! Today is YOUR day. We are gathered here to celebrate the last chapter of your single life — and we plan to make it unforgettable.',
  },
  {
    id: '2',
    emoji: '🤝',
    title: 'Your Fellow Adventurers',
    body: 'Today you\'ll be joined by your best mates:\n\nBartek • Damian • Piotr • Łukasz • Marcin • Tomek • Krzysztof\n\nEach of them has prepared something special for you.',
  },
  {
    id: '3',
    emoji: '📍',
    title: 'The Journey Ahead',
    body: 'The day takes you from the airport → through the city → to the club. At every stop, missions await. Complete them for glory. Fail them for… consequences.',
  },
  {
    id: '4',
    emoji: '📱',
    title: 'Your Mission (Should You Choose to Accept It)',
    body: 'When a task arrives, your phone will buzz. Open the app, read your mission, and complete it before the timer runs out. Photos, videos, dares — anything goes.',
  },
  {
    id: '5',
    emoji: '🏆',
    title: 'Rewards & Punishments',
    body: 'Complete tasks → earn points and rewards. Fail tasks → suffer punishments. The leaderboard is live and everyone can see it. No pressure. 😈',
  },
  {
    id: '6',
    emoji: '🎊',
    title: "Let's Go!",
    body: "Today is going to be legendary. Enjoy every moment. We love you, brother. Now let's make some memories!",
  },
];

export default function OnboardingGroomScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const { setHasCompletedOnboarding } = useParticipantStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const goNext = () => {
    if (currentIndex < GROOM_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      setHasCompletedOnboarding(true);
      navigation.replace('Main');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={GROOM_SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {GROOM_SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={goNext}>
        <Text style={styles.buttonText}>
          {currentIndex < GROOM_SLIDES.length - 1 ? 'Next →' : "Let's Go! 🎉"}
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

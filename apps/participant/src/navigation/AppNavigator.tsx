import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '@bachelor-party/shared';
import { useParticipantStore } from '../store/participantStore';

// Screens
import NameEntryScreen from '../screens/NameEntryScreen';
import OnboardingGroomScreen from '../screens/OnboardingGroomScreen';
import OnboardingStandardScreen from '../screens/OnboardingStandardScreen';
import HomeScreen from '../screens/HomeScreen';
import TaskScreen from '../screens/TaskScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import HistoryScreen from '../screens/HistoryScreen';

export type RootStackParamList = {
  Armagedon: undefined;
  OnboardingGroom: undefined;
  OnboardingStandard: undefined;
  Main: undefined;
  Task: { assignmentId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Leaderboard: undefined;
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1a0a2e', borderTopColor: '#2d1b6b' },
        tabBarActiveTintColor: '#a78bfa',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Start', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ tabBarLabel: 'Ranking', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏆</Text> }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarLabel: 'Historia', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📋</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { currentParticipant, hasCompletedOnboarding } = useParticipantStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // Safely listen to hydration events
  useEffect(() => {
    // Check if store is already hydrated on mount
    if (useParticipantStore.persist.hasHydrated()) {
      setIsHydrated(true);
    } else {
      // If not hydrated yet, subscribe to the finish hydration event
      const unsub = useParticipantStore.persist.onFinishHydrate(() => {
        setIsHydrated(true);
      });
      return () => unsub();
    }
  }, []);

  // Wait for Firebase auth to initialise, auto re-sign-in if session was lost
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user && currentParticipant) {
        // Auth session lost (e.g. web page reload before persistence fix) — re-authenticate
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.warn('Auto sign-in failed:', e);
        }
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, [currentParticipant]);

  const getInitialRoute = (): keyof RootStackParamList => {
    if (!currentParticipant) return 'Armagedon';
    if (!hasCompletedOnboarding) {
      return currentParticipant.isGroom ? 'OnboardingGroom' : 'OnboardingStandard';
    }
    return 'Main';
  };

  // Render loading state while reading storage to prevent flashing wrong screens
  if (!isHydrated || !authReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a0a2e' }}>
        <ActivityIndicator size="large" color="#a78bfa" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Armagedon" component={NameEntryScreen} />
        <Stack.Screen name="OnboardingGroom" component={OnboardingGroomScreen} />
        <Stack.Screen name="OnboardingStandard" component={OnboardingStandardScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Task"
          component={TaskScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
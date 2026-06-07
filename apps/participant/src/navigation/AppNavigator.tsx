import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
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

  const getInitialRoute = (): keyof RootStackParamList => {
    if (!currentParticipant) return 'Armagedon';
    if (!hasCompletedOnboarding) {
      return currentParticipant.isGroom ? 'OnboardingGroom' : 'OnboardingStandard';
    }
    return 'Main';
  };

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


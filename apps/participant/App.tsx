import 'react-native-gesture-handler';
import React, { useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainerRef } from '@react-navigation/native';
import AppNavigator, { RootStackParamList } from './src/navigation/AppNavigator';
import { useNotifications } from './src/hooks/useNotifications';

function AppInner() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  useNotifications(navigationRef);
  return <AppNavigator />;
}

export default function App() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#1a0a2e" />
      <AppInner />
    </>
  );
}

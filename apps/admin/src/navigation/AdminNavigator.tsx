import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAdminStore } from '../store/adminStore';

// Screens
import AdminLoginScreen from '../screens/AdminLoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TaskLibraryScreen from '../screens/TaskLibraryScreen';
import CreateEditTaskScreen from '../screens/CreateEditTaskScreen';
import SubmissionsScreen from '../screens/SubmissionsScreen';
import SubmissionReviewScreen from '../screens/SubmissionReviewScreen';
import RewardsPunishmentsScreen from '../screens/RewardsPunishmentsScreen';
import ParticipantsScreen from '../screens/ParticipantsScreen';

export type RootStackParamList = {
  Login: undefined;
  AdminMain: undefined;
  CreateEditTask: { taskId?: string };
  SubmissionReview: { submissionId: string };
};

export type AdminTabParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Submissions: undefined;
  RewardsPunishments: undefined;
  Participants: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<AdminTabParamList>();

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b' },
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#475569',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📊</Text> }}
      />
      <Tab.Screen
        name="Tasks"
        component={TaskLibraryScreen}
        options={{ tabBarLabel: 'Zadania', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🎯</Text> }}
      />
      <Tab.Screen
        name="Submissions"
        component={SubmissionsScreen}
        options={{ tabBarLabel: 'Zgłoszenia', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📥</Text> }}
      />
      <Tab.Screen
        name="RewardsPunishments"
        component={RewardsPunishmentsScreen}
        options={{ tabBarLabel: 'Nagrody', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🎁</Text> }}
      />
      <Tab.Screen
        name="Participants"
        component={ParticipantsScreen}
        options={{ tabBarLabel: 'Uczestnicy', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👥</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function AdminNavigator() {
  const { currentAdmin } = useAdminStore();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={currentAdmin ? 'AdminMain' : 'Login'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={AdminLoginScreen} />
        <Stack.Screen name="AdminMain" component={AdminTabs} />
        <Stack.Screen name="CreateEditTask" component={CreateEditTaskScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="SubmissionReview" component={SubmissionReviewScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { doc, updateDoc } from 'firebase/firestore';
import { db, EVENT_ID } from '@bachelor-party/shared';
import { useParticipantStore } from '../store/participantStore';
import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NotificationPayload } from '@bachelor-party/shared';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications(
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>
) {
  const { currentParticipant } = useParticipantStore();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!currentParticipant) return;

    // Register for push notifications
    const register = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) return;

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

      // Save push token to Firestore
      await updateDoc(doc(db, 'events', EVENT_ID, 'participants', currentParticipant.id), {
        pushToken: token,
      });
    };

    register();

    // In-foreground notification handler
    notificationListener.current = Notifications.addNotificationReceivedListener((_notification) => {
      // The notification banner is shown automatically by setNotificationHandler above
    });

    // Tap on notification → navigate to task
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as unknown as NotificationPayload;
      if (data?.assignmentId) {
        navigationRef.current?.navigate('Task', { assignmentId: data.assignmentId });
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [currentParticipant]);
}

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCBSRKMDTRtpKgYBmKD04-oIzk4kk9wKZw",
  authDomain: "b-party-10e90.firebaseapp.com",
  projectId: "b-party-10e90",
  storageBucket: "b-party-10e90.firebasestorage.app",
  messagingSenderId: "88188209347",
  appId: "1:88188209347:web:a860b68356450eb3b53a76"
};

// Singleton — capture isNew BEFORE initializeApp so the flag is correct on hot reload
const isNew = getApps().length === 0;
const app = isNew ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);

function createAuth() {
  if (!isNew) return getAuth(app);
  // On web, navigator.product is undefined; on React Native it is 'ReactNative'.
  // getReactNativePersistence only exists in the Metro/RN bundle, not the web bundle.
  const isNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
  if (!isNative) {
    return initializeAuth(app);
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getReactNativePersistence } = require('firebase/auth');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}

export const auth = createAuth();

export default app;

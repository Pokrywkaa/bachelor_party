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

// Use getReactNativePersistence via require so Metro resolves the RN-specific
// bundle (which exports this function) rather than the browser build.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getReactNativePersistence } = require('firebase/auth');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

export const auth = isNew
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);

export default app;

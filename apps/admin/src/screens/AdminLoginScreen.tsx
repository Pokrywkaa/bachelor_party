import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { auth, db, EVENT_ID } from '@bachelor-party/shared';
import { useAdminStore } from '../store/adminStore';
import type { Participant } from '@bachelor-party/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AdminNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

// Simple hash for PIN comparison (must match what was stored)
function hashPin(pin: string): string {
  // In production use expo-crypto or react-native-quick-crypto
  // For now, storing pin as-is prefixed with "pin:" to distinguish
  return `pin:${pin}`;
}

export default function AdminLoginScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { setCurrentAdmin } = useAdminStore();

  const handleLogin = async () => {
    if (!name.trim() || pin.length !== 4) {
      Alert.alert('Błędne dane', 'Podaj swoje imię i 4-cyfrowy PIN.');
      return;
    }
    setLoading(true);
    try {
      const credential = await signInAnonymously(auth);
      const uid = credential.user.uid;

      const q = query(
        collection(db, 'events', EVENT_ID, 'participants'),
        where('name', '==', name.trim()),
        where('role', '==', 'admin')
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        Alert.alert('Brak dostępu', 'To imię nie jest zarejestrowane jako administrator.');
        return;
      }

      const adminDoc = snap.docs[0];
      const data = adminDoc.data();

      // Verify PIN
      if (data.pinHash !== hashPin(pin)) {
        Alert.alert('Błędny PIN', 'Nieprawidłowy PIN. Spróbuj ponownie.');
        return;
      }

      // Link this anonymous auth UID to the admin participant document
      await updateDoc(doc(db, 'events', EVENT_ID, 'participants', adminDoc.id), {
        authUid: uid,
      });

      setCurrentAdmin({ id: adminDoc.id, ...data } as Participant);
      navigation.replace('AdminMain');
    } catch (e) {
      Alert.alert('Błąd', 'Logowanie nie powiodło się. Sprawdź połączenie.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.emoji}>⚙️</Text>
        <Text style={styles.title}>Panel Admina</Text>
        <Text style={styles.subtitle}>Centrum Dowodzenia Armagedonem</Text>

        <TextInput
          style={styles.input}
          placeholder="Twoje imię..."
          placeholderTextColor="#475569"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="4-cyfrowy PIN"
          placeholderTextColor="#475569"
          value={pin}
          onChangeText={(t) => setPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Zaloguj →</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 60, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 40 },
  input: {
    width: '100%', backgroundColor: '#1e293b', borderRadius: 12, padding: 16,
    fontSize: 16, color: '#f1f5f9', marginBottom: 14, borderWidth: 1, borderColor: '#334155',
  },
  button: { width: '100%', backgroundColor: '#0284c7', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});

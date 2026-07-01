import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { auth, db } from '@bachelor-party/shared';
import { EVENT_ID } from '@bachelor-party/shared';
import { useParticipantStore } from '../store/participantStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Participant } from '@bachelor-party/shared';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Armagedon'>;
};

export default function NameEntryScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setCurrentParticipant, hasCompletedOnboarding } = useParticipantStore();

  const handleJoin = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Wpisz swoje imię, aby kontynuować.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      // Sign in anonymously to get a Firebase UID
      const credential = await signInAnonymously(auth);
      const uid = credential.user.uid;

      // Find participant by name (case-insensitive)
      const q = query(
        collection(db, 'events', EVENT_ID, 'participants'),
        where('name', '==', trimmed)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setError(`Nie znaleziono "${trimmed}" na liście gości. Sprawdź pisownię lub zapytaj admina.`);
        setLoading(false);
        return;
      }

      const participantDoc = snap.docs[0];
      const participantData = { id: participantDoc.id, ...participantDoc.data() } as Participant;

      // Link this anonymous auth UID to the participant document
      await updateDoc(doc(db, 'events', EVENT_ID, 'participants', participantDoc.id), {
        authUid: uid,
      });

      setCurrentParticipant(participantData);

      if (hasCompletedOnboarding) {
        navigation.replace('Main');
      } else {
        navigation.replace(participantData.isGroom ? 'OnboardingGroom' : 'OnboardingStandard');
      }
    } catch (error) {
      setError('Coś poszło nie tak. Spróbuj ponownie.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}
    >
      <View style={styles.inner}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>Armagedon</Text>
        <Text style={styles.subtitle}>Wpisz imię, aby dołączyć do gry</Text>

        <TextInput
          style={[styles.input, !!error && styles.inputError]}
          placeholder="Twoje imię..."
          placeholderTextColor="#6b7280"
          value={name}
          onChangeText={(t) => { setName(t); setError(''); }}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleJoin}
        />
        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleJoin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Dołącz 🚀</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0a2e',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f3e8ff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a78bfa',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#2d1b6b',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#f3e8ff',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4c1d95',
  },
  inputError: {
    borderColor: '#f87171',
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    marginBottom: 16,
    width: '100%',
    textAlign: 'left',
  },
  button: {
    width: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Participant, Assignment, Submission, Reward, Punishment, Task } from '@bachelor-party/shared';

interface ParticipantStore {
  // Auth
  currentParticipant: Participant | null;
  setCurrentParticipant: (p: Participant | null) => void;

  // Active task
  activeAssignment: Assignment | null;
  setActiveAssignment: (a: Assignment | null) => void;

  // Data
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;

  assignments: Assignment[];
  setAssignments: (a: Assignment[]) => void;

  submissions: Submission[];
  setSubmissions: (s: Submission[]) => void;

  participants: Participant[];
  setParticipants: (p: Participant[]) => void;

  rewards: Reward[];
  setRewards: (r: Reward[]) => void;

  punishments: Punishment[];
  setPunishments: (p: Punishment[]) => void;

  // Onboarding
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (v: boolean) => void;
}

export const useParticipantStore = create<ParticipantStore>()(
  persist(
    (set) => ({
      currentParticipant: null,
      setCurrentParticipant: (p) => set({ currentParticipant: p }),

      activeAssignment: null,
      setActiveAssignment: (a) => set({ activeAssignment: a }),

      tasks: [],
      setTasks: (tasks) => set({ tasks }),

      assignments: [],
      setAssignments: (assignments) => set({ assignments }),

      submissions: [],
      setSubmissions: (submissions) => set({ submissions }),

      participants: [],
      setParticipants: (participants) => set({ participants }),

      rewards: [],
      setRewards: (rewards) => set({ rewards }),

      punishments: [],
      setPunishments: (punishments) => set({ punishments }),

      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (v) => set({ hasCompletedOnboarding: v }),
    }),
    {
      name: 'participant-storage', // Unique name for AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),
      // CRITICAL: Filter out everything except auth and onboarding states
      partialize: (state) => ({
        currentParticipant: state.currentParticipant,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);
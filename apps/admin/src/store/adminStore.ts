import { create } from 'zustand';
import type { Participant, Task, Assignment, Submission, Reward, Punishment } from '@bachelor-party/shared';

interface AdminStore {
  currentAdmin: Participant | null;
  setCurrentAdmin: (p: Participant | null) => void;

  participants: Participant[];
  setParticipants: (p: Participant[]) => void;

  tasks: Task[];
  setTasks: (t: Task[]) => void;

  assignments: Assignment[];
  setAssignments: (a: Assignment[]) => void;

  submissions: Submission[];
  setSubmissions: (s: Submission[]) => void;

  rewards: Reward[];
  setRewards: (r: Reward[]) => void;

  punishments: Punishment[];
  setPunishments: (p: Punishment[]) => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  currentAdmin: null,
  setCurrentAdmin: (p) => set({ currentAdmin: p }),

  participants: [],
  setParticipants: (participants) => set({ participants }),

  tasks: [],
  setTasks: (tasks) => set({ tasks }),

  assignments: [],
  setAssignments: (assignments) => set({ assignments }),

  submissions: [],
  setSubmissions: (submissions) => set({ submissions }),

  rewards: [],
  setRewards: (rewards) => set({ rewards }),

  punishments: [],
  setPunishments: (punishments) => set({ punishments }),
}));

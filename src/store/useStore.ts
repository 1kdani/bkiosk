import { create } from 'zustand';
import { User } from 'firebase/auth';

export interface UserPermissions {
  manageNews: boolean;
  manageTimetable: boolean;
  manageSettings: boolean;
  manageUsers: boolean;
}

interface AppState {
  user: User | null;
  userName: string | null;
  permissions: UserPermissions | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setUserData: (name: string | null, perms: UserPermissions | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  userName: null,
  permissions: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setUserData: (userName, permissions) => set({ userName, permissions }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
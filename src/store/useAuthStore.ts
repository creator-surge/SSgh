import { create } from "zustand";
import { Profile } from "../types";
import { getProfile, updateProfile } from "../lib/api";

interface AuthState {
  userId: string;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  login: (id: string) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  updateUserAddress: (address: string) => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: localStorage.getItem("surgebox_user_id") || "user-default-id",
  profile: null,
  isLoading: false,
  error: null,

  login: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      localStorage.setItem("surgebox_user_id", id);
      set({ userId: id });
      const profile = await getProfile(id);
      set({ profile, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Login failed", isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("surgebox_user_id");
    set({ userId: "user-default-id", profile: null });
    get().loadProfile();
  },

  loadProfile: async () => {
    const { userId } = get();
    if (!userId) return;
    set({ isLoading: true });
    try {
      const profile = await getProfile(userId);
      set({ profile, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateUserAddress: async (address: string) => {
    const { userId, profile } = get();
    if (!userId || !profile) return;
    try {
      const updated = await updateProfile(userId, { username: profile.username, shipping_address: address });
      set({ profile: updated });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateUsername: async (username: string) => {
    const { userId, profile } = get();
    if (!userId || !profile) return;
    try {
      const updated = await updateProfile(userId, { username, shipping_address: profile.shipping_address || "" });
      set({ profile: updated });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  refreshProfile: async () => {
    const { userId } = get();
    if (!userId) return;
    try {
      const profile = await getProfile(userId);
      set({ profile });
    } catch (err: any) {
      console.error("Failed to silently refresh profile", err);
    }
  }
}));

// Auto-initialize profile in the background immediately on store load
setTimeout(() => {
  useAuthStore.getState().loadProfile();
}, 0);

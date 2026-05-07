import { StorageAdapter } from '@/helpers/adapters/secure-storage.adapter';
import { create } from 'zustand';

const THEME_STORAGE_KEY = 'omb_theme_dark_mode';

interface ThemeState {
  isDarkMode: boolean;
  isLoading: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
  loadThemePreference: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDarkMode: false,
  isLoading: true,

  toggleDarkMode: () => {
    const newValue = !get().isDarkMode;
    set({ isDarkMode: newValue });
    StorageAdapter.setItem(THEME_STORAGE_KEY, JSON.stringify(newValue));
  },

  setDarkMode: (value: boolean) => {
    set({ isDarkMode: value });
    StorageAdapter.setItem(THEME_STORAGE_KEY, JSON.stringify(value));
  },

  loadThemePreference: async () => {
    try {
      const stored = await StorageAdapter.getItem(THEME_STORAGE_KEY);
      if (stored !== null) {
        set({ isDarkMode: JSON.parse(stored), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));

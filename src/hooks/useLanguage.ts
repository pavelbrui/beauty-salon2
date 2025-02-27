import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LanguageState {
  language: 'pl' | 'en' | 'ru';
  setLanguage: (language: 'pl' | 'en' | 'ru') => void;
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'pl',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'language-storage',
    }
  )
);
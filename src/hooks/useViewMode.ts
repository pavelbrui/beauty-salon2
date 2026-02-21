import { useState, useCallback } from 'react';

type ViewMode = 'list' | 'calendar';

const STORAGE_KEY = 'bookings-view-mode';
const COOKIE_NAME = 'bookings_view_mode';
const COOKIE_DAYS = 365;

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value};expires=${expires};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? match[1] : null;
}

function getSavedViewMode(): ViewMode {
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (fromStorage === 'list' || fromStorage === 'calendar') return fromStorage;
  } catch {}

  const fromCookie = getCookie(COOKIE_NAME);
  if (fromCookie === 'list' || fromCookie === 'calendar') return fromCookie;

  return 'list';
}

export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewModeState] = useState<ViewMode>(getSavedViewMode);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {}
    setCookie(COOKIE_NAME, mode, COOKIE_DAYS);
  }, []);

  return [viewMode, setViewMode];
}

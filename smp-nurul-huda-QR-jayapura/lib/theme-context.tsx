'use client';

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore, useMemo } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'presensi_theme_preference';

const emptySubscribe = () => () => {};

function subscribeToMedia(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

function getSystemThemeSnapshot(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getSystemThemeServerSnapshot(): 'light' | 'dark' {
  return 'light';
}

function subscribeTheme(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('theme-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('theme-change', callback);
  };
}

function getThemeSnapshot(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // fallback
  }
  return 'light';
}

function getThemeServerSnapshot(): Theme {
  return 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const systemPreference = useSyncExternalStore(
    subscribeToMedia,
    getSystemThemeSnapshot,
    getSystemThemeServerSnapshot
  );

  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  const resolvedTheme: 'light' | 'dark' = useMemo(() => {
    if (theme === 'dark') return 'dark';
    if (theme === 'light') return 'light';
    return systemPreference;
  }, [theme, systemPreference]);

  // Synchronize DOM classes whenever resolvedTheme changes
  useEffect(() => {
    if (!isClient) return;

    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    // Update meta theme-color for mobile browsers and PWA status bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#090d16' : '#059669');
    }
  }, [resolvedTheme, isClient]);

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      window.dispatchEvent(new Event('theme-change'));
    } catch {
      // Ignore storage errors
    }
  };

  const toggleTheme = () => {
    const nextTheme: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

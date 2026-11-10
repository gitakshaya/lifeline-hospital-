import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'lifeline_theme_mode_v1';

// Brand colours sampled from the Lifeline banner
export const BRAND = { red: '#D81818', navy: '#203878' };

export const THEMES = {
  light: {
    dark: false,
    bg: '#F5F7FA',
    card: '#FFFFFF',
    text: '#1B2430',
    muted: '#667385',
    border: '#D9E0E7',
    primary: BRAND.navy,
    accent: BRAND.red,
    input: '#FFFFFF',
    chip: '#E3EBEF',
    logoBg: '#F6F8F7', // matches the banner's own background
  },
  dark: {
    dark: true,
    bg: '#0E141D',
    card: '#182231',
    text: '#E8EDF3',
    muted: '#93A1B3',
    border: '#2B3A4F',
    primary: '#5C7CE6', // lighter navy so it stays readable on dark surfaces
    accent: '#FF5A52',
    input: '#121B28',
    chip: '#243247',
    logoBg: '#F6F8F7',
  },
};

const ThemeCtx = createContext(null);

// mode: 'system' | 'light' | 'dark'
export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') setModeState(saved);
      } catch (e) {}
      setReady(true);
    })();
  }, []);

  const setMode = (m) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m).catch(() => {});
  };

  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  const value = useMemo(
    () => ({ colors: isDark ? THEMES.dark : THEMES.light, mode, isDark, setMode }),
    [mode, isDark]
  );

  if (!ready) return null;
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

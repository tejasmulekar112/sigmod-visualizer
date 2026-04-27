import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'light' | 'dark';

export type ThemeTokens = {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryText: string;
  teal: string;
  blue: string;
  purple: string;
  axis: string;
};

export const lightTheme: ThemeTokens = {
  bg: '#f4f6f9',
  surface: '#ffffff',
  surface2: '#f9fafb',
  border: '#e2e5ea',
  text: '#1a1d23',
  textMuted: '#6b7280',
  textSubtle: '#9aa1ac',
  primary: '#2563eb',
  primaryText: '#ffffff',
  teal: '#0d9488',
  blue: '#2563eb',
  purple: '#7c3aed',
  axis: '#d4d7dc',
};

export const darkTheme: ThemeTokens = {
  bg: '#0d1015',
  surface: '#161a21',
  surface2: '#1c2129',
  border: '#262c36',
  text: '#e6e8eb',
  textMuted: '#9aa1ac',
  textSubtle: '#6a7281',
  primary: '#3b82f6',
  primaryText: '#ffffff',
  teal: '#2dd4bf',
  blue: '#60a5fa',
  purple: '#a78bfa',
  axis: '#2d333d',
};

const STORAGE_KEY = 'sigmod-theme';

export function useTheme() {
  const system = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'system' || value === 'light' || value === 'dark') {
        setMode(value);
      }
    }).catch(() => { /* ignore */ });
  }, []);

  const resolved: 'light' | 'dark' =
    mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  const tokens = resolved === 'dark' ? darkTheme : lightTheme;

  const cycle = () => {
    const next: ThemeMode = mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system';
    setMode(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => { /* ignore */ });
  };

  return { mode, tokens, cycle };
}

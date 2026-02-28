import { useContext } from 'react';
import type { ThemeContextValue } from '../types/model';
import { ThemeContext } from './createThemeContext';

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

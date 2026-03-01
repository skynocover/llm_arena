import { useState, useEffect, type ReactNode } from 'react';
import type { ChartColors, Theme } from '../types/model';
import { ThemeContext } from './createThemeContext';

const LIGHT_CHART: ChartColors = {
  grid: '#e5e7eb',
  tick: '#71717a',
  tickDim: '#a1a1aa',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e5e7eb',
  axis: '#e5e7eb',
  cursor: '#d1d5db',
  textPrimary: '#18181b',
  textSecondary: '#52525b',
};

const DARK_CHART: ChartColors = {
  grid: '#2c2c31',
  tick: '#8b8b94',
  tickDim: '#71717a',
  tooltipBg: '#18181b',
  tooltipBorder: '#2c2c31',
  axis: '#2c2c31',
  cursor: '#3f3f46',
  textPrimary: '#e4e4e7',
  textSecondary: '#a1a1aa',
};

const STORAGE_KEY = 'llm-arena-theme';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const chartColors = theme === 'dark' ? DARK_CHART : LIGHT_CHART;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, chartColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

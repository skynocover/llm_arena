import { createContext } from 'react';
import type { ThemeContextValue } from '../types/model';

export const ThemeContext = createContext<ThemeContextValue | null>(null);

import { createContext, useContext, useState, useEffect, useMemo } from "react";

const ThemeContext = createContext();

const LIGHT_CHART = {
  grid: "#e5e7eb",
  tick: "#71717a",
  tickDim: "#a1a1aa",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e5e7eb",
  axis: "#e5e7eb",
  cursor: "#d1d5db",
  textPrimary: "#18181b",
  textSecondary: "#52525b",
};

const DARK_CHART = {
  grid: "#27272a",
  tick: "#71717a",
  tickDim: "#52525b",
  tooltipBg: "#18181b",
  tooltipBorder: "#27272a",
  axis: "#27272a",
  cursor: "#3f3f46",
  textPrimary: "#e4e4e7",
  textSecondary: "#a1a1aa",
};

const STORAGE_KEY = "llm-compare-theme";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" ? "light" : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));

  const chartColors = useMemo(
    () => (theme === "dark" ? DARK_CHART : LIGHT_CHART),
    [theme],
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, chartColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

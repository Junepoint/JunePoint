import React, { createContext, useContext, useLayoutEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'jp-studio-theme';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useLayoutEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = theme;

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', isDark ? '#0b1220' : '#ffffff');

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Keep the selected theme active when storage is unavailable.
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default function ThemeToggle() {
  const context = useContext(ThemeContext);
  if (!context) return null;

  const isDark = context.theme === 'dark';
  const label = isDark ? 'Use light theme' : 'Use dark theme';

  return (
    <button
      type="button"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-300 bg-white/80 text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300"
      onClick={() => context.setTheme(isDark ? 'light' : 'dark')}
      aria-label={label}
      title={label}
    >
      {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeSwitcherProps {
  variant?: 'button' | 'toggle' | 'full';
  className?: string;
}

/**
 * ThemeSwitcher component for toggling between Light and Dark visual modes.
 */
export function ThemeSwitcher({ variant = 'button', className = '' }: ThemeSwitcherProps) {
  const { theme, toggleTheme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 ${className}`}>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            !isDark 
              ? 'bg-white text-amber-600 shadow-xs border border-slate-200 font-bold' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          title="Light Theme"
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isDark 
              ? 'bg-slate-900 text-indigo-400 shadow-xs border border-slate-700 font-bold' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          title="Dark Theme"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Dark</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
        isDark
          ? 'bg-slate-800/80 border-slate-700 text-amber-400 hover:bg-slate-800 hover:border-amber-400/40 shadow-xs'
          : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-100 hover:border-indigo-400/40 shadow-xs'
      } ${className}`}
      title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
      aria-label="Toggle Theme"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

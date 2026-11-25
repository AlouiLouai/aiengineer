'use client';

import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem('aie:theme', next);
    } catch {
      /* the choice just will not persist */
    }
  };
  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label="Switch between light and dark theme" title="Toggle theme">
      <Sun className="theme-sun" />
      <Moon className="theme-moon" />
    </button>
  );
}

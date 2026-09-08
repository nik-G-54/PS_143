// src/components/layout/ThemeToggle.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex items-center bg-card/90 border border-border p-1 rounded-full cursor-pointer select-none transition-colors duration-200 hover:border-primary/40 shadow-xs"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      {/* Sliding Active Pill Indicator */}
      <motion.div
        className="absolute h-7 w-7 rounded-full bg-accent border border-border/80 shadow-xs"
        initial={false}
        animate={{
          x: isDark ? 0 : 28,
        }}
        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
      />

      {/* Dark Mode (Moon) */}
      <div className="relative z-10 flex h-7 w-7 items-center justify-center transition-colors">
        <Moon size={15} strokeWidth={isDark ? 2 : 1.5} className={isDark ? 'text-primary' : 'text-muted-foreground/70'} />
      </div>

      {/* Light Mode (Sun) */}
      <div className="relative z-10 flex h-7 w-7 items-center justify-center transition-colors">
        <Sun size={15} strokeWidth={!isDark ? 2 : 1.5} className={!isDark ? 'text-amber-500' : 'text-muted-foreground/70'} />
      </div>
    </button>
  );
};

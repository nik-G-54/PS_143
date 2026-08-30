import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../../hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 rounded-full flex items-center justify-center
                 border transition-all duration-200
                 bg-white border-[#E5E7EB] hover:bg-[#F9FAFB]
                 dark:bg-[#1A1D27] dark:border-[#252830] dark:hover:bg-[#252830]"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark'
        ? <Sun size={18} className="text-[#F1F5F9]" />
        : <Moon size={18} className="text-[#4B5563]" />
      }
    </button>
  );
}

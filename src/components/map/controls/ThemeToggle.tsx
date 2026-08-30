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
                 dark:bg-[#151F33] dark:border-[#64748B]/30 dark:hover:bg-[#1F2E4A]"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark'
        ? <Sun size={18} className="text-[#F8FAFC]" />
        : <Moon size={18} className="text-[#4B5563]" />
      }
    </button>
  );
}

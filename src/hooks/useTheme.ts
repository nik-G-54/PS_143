import { useTheme as useThemeCtx } from '../context/ThemeContext';

export function useTheme() {
  return useThemeCtx();
}

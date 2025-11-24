import { useTheme as useNextTheme } from 'next-themes';

export const useTheme = () => {
  // Get all theme data from next-themes
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  const isSystemModeActive = theme === 'system';
  const isDarkModeActive = resolvedTheme === 'dark';
  const isLightModeActive = resolvedTheme === 'light';

  return {
    currentState: {
      isDark: isDarkModeActive,
      isLight: isLightModeActive,
      isSystem: isSystemModeActive,
    },
    currentTheme: theme,
    setCurrentTheme: setTheme,
  };
};

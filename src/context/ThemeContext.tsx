import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { DARK_THEME, LIGHT_THEME, AppTheme } from '../theme';

interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DARK_THEME,
  isDark: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(Appearance.getColorScheme() !== 'light');

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme !== 'light');
    });
    return () => sub.remove();
  }, []);

  const toggleTheme = () => setIsDark(prev => !prev);
  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

import { useState, useEffect } from 'react';
import { themes } from './theme';
import { ThemeContext } from './ThemeContext';

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState('dark');

  const theme = themes[themeName];

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) setThemeName(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', themeName);
  }, [themeName]);

  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

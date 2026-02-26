/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const SAHARLIK_H = 5, SAHARLIK_M = 8;
const IFTOR_H = 18, IFTOR_M = 47;

function isNightTime() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const sahar = SAHARLIK_H * 60 + SAHARLIK_M;
  const iftor = IFTOR_H * 60 + IFTOR_M;
  return mins < sahar || mins >= iftor;
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('ramadan_theme') || 'light');

  const dark = mode === 'dark' || (mode === 'auto' && isNightTime());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    localStorage.setItem('ramadan_theme', mode);
  }, [mode]);

  // Auto mode: har daqiqada tekshirish
  useEffect(() => {
    if (mode !== 'auto') return;
    const id = setInterval(() => {
      const shouldBeDark = isNightTime();
      document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
    }, 60000);
    return () => clearInterval(id);
  }, [mode]);

  const toggle = () => setMode(m => m === 'dark' ? 'light' : 'dark');
  const setAuto = () => setMode('auto');

  return (
    <ThemeContext.Provider value={{ dark, mode, toggle, setAuto }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);



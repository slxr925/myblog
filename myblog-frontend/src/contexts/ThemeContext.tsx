import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme; // 实际应用的主题
  themeMode: ThemeMode; // 用户选择的模式
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [theme, setTheme] = useState<Theme>('light');
  const [isMounted, setIsMounted] = useState(false);

  // 获取系统主题偏好
  const getSystemTheme = (): Theme => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // 应用主题到 DOM
  const applyTheme = (newTheme: Theme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setTheme(newTheme);
  };

  // 初始化主题
  useEffect(() => {
    setIsMounted(true);

    // 迁移旧的 localStorage 格式
    const oldTheme = localStorage.getItem('theme');
    const newMode = localStorage.getItem('theme-mode');

    // 如果有旧格式但没有新格式，进行迁移
    if (oldTheme && !newMode) {
      localStorage.setItem('theme-mode', oldTheme as ThemeMode);
      // 清理旧数据（可选）
      localStorage.removeItem('theme');
    }

    // 从 localStorage 获取保存的主题模式，默认为 auto
    const savedMode = (localStorage.getItem('theme-mode') as ThemeMode) || 'auto';
    setThemeModeState(savedMode);

    // 根据模式决定实际主题
    let actualTheme: Theme;
    if (savedMode === 'auto') {
      actualTheme = getSystemTheme();
    } else {
      actualTheme = savedMode;
    }

    applyTheme(actualTheme);
  }, []);

  // 监听系统主题变化（仅在 auto 模式下生效）
  useEffect(() => {
    if (!isMounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // 只有在 auto 模式下才跟随系统主题
      if (themeMode === 'auto') {
        const newTheme = e.matches ? 'dark' : 'light';
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isMounted, themeMode]);

  const setThemeMode = (newMode: ThemeMode) => {
    setThemeModeState(newMode);
    localStorage.setItem('theme-mode', newMode);

    // 根据新模式决定实际主题
    let actualTheme: Theme;
    if (newMode === 'auto') {
      actualTheme = getSystemTheme();
    } else {
      actualTheme = newMode;
    }

    applyTheme(actualTheme);
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    isDark: theme === 'dark',
  };

  // 避免服务端渲染不匹配
  if (!isMounted) {
    return (
      <ThemeContext.Provider value={value}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
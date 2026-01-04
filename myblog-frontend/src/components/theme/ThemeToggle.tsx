import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { themeMode, setThemeMode, isDark } = useTheme();

  const cycleTheme = () => {
    // 循环切换: auto -> light -> dark -> auto
    if (themeMode === 'auto') {
      setThemeMode('light');
    } else if (themeMode === 'light') {
      setThemeMode('dark');
    } else {
      setThemeMode('auto');
    }
  };

  const getIcon = () => {
    if (themeMode === 'auto') {
      return <Monitor className="h-4 w-4" />;
    }
    return isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
  };

  const getTitle = () => {
    if (themeMode === 'auto') {
      return '模式：跟随系统（点击切换为浅色）';
    } else if (themeMode === 'light') {
      return '模式：浅色（点击切换为深色）';
    } else {
      return '模式：深色（点击切换为自动）';
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className={`w-9 h-9 transition-all duration-300 hover:scale-110 ${className}`}
      title={getTitle()}
    >
      <div className="relative w-4 h-4">
        {getIcon()}
      </div>
    </Button>
  );
};

export default ThemeToggle;
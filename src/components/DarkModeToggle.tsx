import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="glass-button hover-lift transition-all duration-300 relative overflow-hidden group"
      aria-label="Toggle dark mode"
    >
      <div className="relative w-4 h-4">
        <Sun className="w-4 h-4 absolute inset-0 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-primary" />
        <Moon className="w-4 h-4 absolute inset-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export default DarkModeToggle;
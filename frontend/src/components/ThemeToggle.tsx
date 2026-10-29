import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { toggleTheme, useTheme } from '../theme';

interface ThemeToggleProps {
  className?: string;
}

/**
 * Header theme control. Shows the destination scheme (sun = switch to light),
 * so the label and icon always describe the action that will be taken.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const theme = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      className={className ?? 'qr-icon-btn'}
      aria-label={label}
      title={label}
    >
      {isDark ? (
        <Sun size={16} strokeWidth={1.75} className="qr-theme-icon" aria-hidden="true" />
      ) : (
        <Moon size={16} strokeWidth={1.75} className="qr-theme-icon" aria-hidden="true" />
      )}
    </button>
  );
};

export default ThemeToggle;

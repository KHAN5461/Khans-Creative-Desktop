import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Theme, ThemeId, ThemeColors } from './types';
import { themes } from './themes';

interface ThemeContextType {
  theme: Theme;
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  setDynamicColors: (colors: ThemeColors) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to flatten the nested object into CSS variables
const generateCssVariables = (theme: Theme): string => {
  let css = '';

  // 1. Tonal Palettes
  Object.entries(theme.colors).forEach(([category, palette]) => {
    Object.entries(palette).forEach(([level, value]) => {
      css += `--${category}-${level}: ${value}; `;
    });
  });

  // 2. Semantic Mappings (Shortcuts for Tailwind)
  // Surface: Use neutral 99 for light mode bg, neutral 10 for dark mode bg
  css += `--bg-app: ${theme.isDark ? theme.colors.neutral[90] : theme.colors.neutral[99]}; `;
  css += `--bg-surface: ${theme.isDark ? theme.colors.neutral[80] : theme.colors.neutral[100]}; `;
  css += `--text-main: ${theme.isDark ? theme.colors.neutral[10] : theme.colors.neutral[10]}; `;
  css += `--text-muted: ${theme.isDark ? theme.colors.neutral[40] : theme.colors.neutral[50]}; `;
  css += `--border-main: ${theme.isDark ? theme.colors.neutral[60] : theme.colors.neutral[90]}; `;

  // 3. System Specs
  css += `--glass-opacity: ${theme.glass.opacity}; `;
  css += `--glass-blur: ${theme.glass.blur}px; `;
  css += `--glass-border-opacity: ${theme.glass.borderOpacity}; `;
  
  css += `--shadow-soft: ${theme.shadows.soft}; `;
  css += `--shadow-medium: ${theme.shadows.medium}; `;
  css += `--shadow-hard: ${theme.shadows.hard}; `;

  return css;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-theme') as ThemeId;
      if (themes[saved]) return saved;
    }
    return 'warm';
  });

  const [dynamicColors, setDynamicColorsState] = useState<ThemeColors | null>(null);

  const currentTheme = useMemo(() => {
    // If dynamic colors are present, use them on top of a base theme structure (e.g., warm)
    if (dynamicColors) {
        return {
            ...themes.warm, // Use warm as base for shadows/glass
            id: 'dynamic',
            name: 'Dynamic Wallpaper',
            colors: dynamicColors,
            isDark: false, // Default to light, or logic to determine based on background luminance could go here
        };
    }
    return themes[themeId] || themes.warm;
  }, [themeId, dynamicColors]);

  useEffect(() => {
    const root = document.documentElement;
    const cssVariables = generateCssVariables(currentTheme);
    
    // Inject variables
    root.setAttribute('style', cssVariables);
    
    // Toggle 'dark' class
    if (currentTheme.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Only persist themeId if it's one of the presets, dynamic isn't persisted this way usually 
    // (WallpaperContext handles its persistence)
    if (themes[themeId]) {
        localStorage.setItem('app-theme', themeId);
    }
  }, [currentTheme, themeId]);

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, themeId, setTheme: setThemeId, setDynamicColors: setDynamicColorsState }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
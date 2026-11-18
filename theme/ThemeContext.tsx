import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Theme, ThemeId, ThemeColors, ContrastLevel } from './types';
import { themes } from './themes';
import { generateThemeColors } from '../utils/dynamicTheme';
import warmDuneImg from '../src/assets/images/wallpaper_warm_dune_1794772175661.jpg';
import mistPeaksImg from '../src/assets/images/wallpaper_mist_peaks_1794772176331.jpg';
import cobaltWavesImg from '../src/assets/images/wallpaper_cobalt_waves_1794772176881.jpg';
import botanicalFernImg from '../src/assets/images/wallpaper_botanical_fern_1794772177601.jpg';

export type Wallpaper = {
  id: string;
  type: 'default' | 'gradient' | 'image' | 'custom';
  value: string;
  label: string;
  seed?: string;
  isDarkSurface?: boolean;
};

export const PRESET_WALLPAPERS: Wallpaper[] = [
  { id: 'default', type: 'default', value: '', label: 'System Tonal' },
  {
    id: 'mesh-aurora',
    type: 'gradient',
    value:
      'radial-gradient(at 12% 15%, #1d2d44 0%, transparent 55%), radial-gradient(at 85% 20%, #3e5c76 0%, transparent 50%), radial-gradient(at 50% 85%, #489fb5 0%, transparent 60%), #0d1321',
    label: 'Nordic Aurora',
    seed: '#3E5C76',
    isDarkSurface: true,
  },
  {
    id: 'solar-horizon',
    type: 'gradient',
    value:
      'radial-gradient(at 20% 20%, #fff3cc 0%, transparent 55%), radial-gradient(at 85% 75%, #ffe0b5 0%, transparent 55%), radial-gradient(at 60% 10%, #e9f1f7 0%, transparent 50%), #fcfaf5',
    label: 'Solar Paper',
    seed: '#D5A700',
    isDarkSurface: false,
  },
  {
    id: 'warm-dune',
    type: 'image',
    value: warmDuneImg,
    label: 'Warm Dune',
    isDarkSurface: false,
  },
  {
    id: 'mist-peaks',
    type: 'image',
    value: mistPeaksImg,
    label: 'Mist Peaks',
    isDarkSurface: true,
  },
  {
    id: 'cobalt-waves',
    type: 'image',
    value: cobaltWavesImg,
    label: 'Cobalt Glass',
    isDarkSurface: false,
  },
  {
    id: 'botanical-fern',
    type: 'image',
    value: botanicalFernImg,
    label: 'Botanical Studio',
    isDarkSurface: true,
  },
];

interface UnifiedTonalContextType {
  theme: Theme;
  themeId: ThemeId;
  contrast: ContrastLevel;
  isDynamicActive: boolean;
  dynamicDark: boolean;
  wallpaper: Wallpaper;
  customWallpaper: Wallpaper | null;
  extractedSeed: string | null;
  setTheme: (id: ThemeId) => void;
  setContrast: (level: ContrastLevel) => void;
  setDarkMode: (isDark: boolean) => void;
  toggleDarkMode: () => void;
  setWallpaper: (wp: Wallpaper) => void;
  setCustomWallpaper: (wp: Wallpaper | null) => void;
  setDynamicDark: (isDark: boolean) => void;
  resetAppearance: () => void;
}

const ThemeContext = createContext<UnifiedTonalContextType | undefined>(undefined);

const generateCssVariables = (theme: Theme, contrast: ContrastLevel): string => {
  let css = '';
  const { primary, secondary, tertiary, error, neutral, neutralVariant } = theme.colors;

  Object.entries(theme.colors).forEach(([category, palette]) => {
    Object.entries(palette).forEach(([level, value]) => {
      if (value) css += `--${category}-${level}: ${value}; `;
    });
  });

  if (theme.isDark) {
    const bgApp =
      contrast === 'high'
        ? neutral[4] || neutral[0]
        : neutral[6] || neutral[10];
    const surfaceDim = neutral[4] || neutral[6] || neutral[0];
    const bgSurface =
      contrast === 'high'
        ? neutral[10]
        : contrast === 'medium'
          ? neutral[12] || neutral[10]
          : neutral[10];
    const surfaceContainer = neutral[12] || neutral[10];
    const surfaceHigh =
      contrast === 'high' ? neutral[22] || neutral[20] : neutral[17] || neutral[20];
    const surfaceHighest = neutral[22] || neutral[20];
    const textMain =
      contrast === 'high'
        ? neutral[100]
        : contrast === 'medium'
          ? neutral[95]
          : neutral[90];
    const textMuted =
      contrast === 'high'
        ? neutralVariant[90] || neutral[90]
        : contrast === 'medium'
          ? neutralVariant[80] || neutral[80]
          : neutralVariant[70] || neutral[70];
    const borderMain =
      contrast === 'high'
        ? neutralVariant[60] || neutral[60]
        : contrast === 'medium'
          ? neutralVariant[40] || neutral[40]
          : neutralVariant[24] || neutralVariant[30] || neutral[30];
    const outlineStrong =
      contrast === 'high'
        ? neutralVariant[80]
        : contrast === 'medium'
          ? neutralVariant[70]
          : neutralVariant[60];

    const m3Primary = contrast === 'high' ? primary[90] : primary[80];
    const m3OnPrimary =
      contrast === 'high' ? primary[0] : contrast === 'medium' ? primary[10] : primary[20];
    const m3PrimaryContainer =
      contrast === 'high' ? primary[50] : contrast === 'medium' ? primary[40] : primary[30];
    const m3OnPrimaryContainer =
      contrast === 'high' ? primary[100] : contrast === 'medium' ? primary[95] : primary[90];

    css += `--bg-app: ${bgApp}; `;
    css += `--surface-dim: ${surfaceDim}; `;
    css += `--bg-surface: ${bgSurface}; `;
    css += `--surface-container: ${surfaceContainer}; `;
    css += `--surface-high: ${surfaceHigh}; `;
    css += `--surface-highest: ${surfaceHighest}; `;
    css += `--text-main: ${textMain}; `;
    css += `--text-muted: ${textMuted}; `;
    css += `--border-main: ${borderMain}; `;
    css += `--outline-strong: ${outlineStrong}; `;

    // Map --neutral-10 cleanly to elevated dark container surface so dark:bg-neutral-10 & dark:hover:bg-neutral-10 stay refined
    css += `--neutral-10: ${surfaceHigh}; `;
    css += `--neutral-20: ${surfaceHighest}; `;

    css += `--m3-primary: ${m3Primary}; `;
    css += `--m3-on-primary: ${m3OnPrimary}; `;
    css += `--m3-primary-container: ${m3PrimaryContainer}; `;
    css += `--m3-on-primary-container: ${m3OnPrimaryContainer}; `;

    css += `--m3-secondary: ${secondary[80]}; `;
    css += `--m3-secondary-container: ${secondary[30]}; `;
    css += `--m3-tertiary: ${tertiary[80]}; `;
    css += `--m3-tertiary-container: ${tertiary[30]}; `;
    css += `--m3-error: ${error[80]}; `;

    css += `--wallpaper-glow-1: ${primary[20]}; `;
    css += `--wallpaper-glow-2: ${tertiary[20]}; `;

    const darkShadows = theme.id === 'dev'
      ? theme.shadows
      : {
          soft: '0px 2px 10px rgba(0, 0, 0, 0.36)',
          medium: '0px 8px 24px rgba(0, 0, 0, 0.48)',
          hard: '0px 14px 36px rgba(0, 0, 0, 0.62), 0px 0px 0px 1px rgba(255, 255, 255, 0.05)',
        };
    css += `--shadow-soft: ${darkShadows.soft}; `;
    css += `--shadow-medium: ${darkShadows.medium}; `;
    css += `--shadow-hard: ${darkShadows.hard}; `;
  } else {
    const bgApp = contrast === 'high' ? neutral[100] : neutral[98] || neutral[99];
    const surfaceDim = neutral[87] || neutral[80];
    const bgSurface = neutral[100];
    const surfaceContainer = neutral[94] || neutral[95];
    const surfaceHigh = neutral[92] || neutral[90];
    const surfaceHighest = neutral[90];
    const textMain = contrast === 'high' ? neutral[0] : neutral[10];
    const textMuted =
      contrast === 'high'
        ? neutralVariant[20] || neutral[20]
        : contrast === 'medium'
          ? neutralVariant[30] || neutral[30]
          : neutralVariant[40] || neutral[50];
    const borderMain =
      contrast === 'high'
        ? neutralVariant[40] || neutral[40]
        : contrast === 'medium'
          ? neutralVariant[70] || neutral[70]
          : neutral[90];
    const outlineStrong =
      contrast === 'high'
        ? neutralVariant[20]
        : contrast === 'medium'
          ? neutralVariant[40]
          : neutralVariant[50];

    const m3Primary =
      contrast === 'high' ? primary[20] : contrast === 'medium' ? primary[30] : primary[40];
    const m3OnPrimary = primary[100];
    const m3PrimaryContainer = contrast === 'high' ? primary[80] : primary[90];
    const m3OnPrimaryContainer = contrast === 'high' ? primary[0] : primary[10];

    css += `--bg-app: ${bgApp}; `;
    css += `--surface-dim: ${surfaceDim}; `;
    css += `--bg-surface: ${bgSurface}; `;
    css += `--surface-container: ${surfaceContainer}; `;
    css += `--surface-high: ${surfaceHigh}; `;
    css += `--surface-highest: ${surfaceHighest}; `;
    css += `--text-main: ${textMain}; `;
    css += `--text-muted: ${textMuted}; `;
    css += `--border-main: ${borderMain}; `;
    css += `--outline-strong: ${outlineStrong}; `;

    css += `--m3-primary: ${m3Primary}; `;
    css += `--m3-on-primary: ${m3OnPrimary}; `;
    css += `--m3-primary-container: ${m3PrimaryContainer}; `;
    css += `--m3-on-primary-container: ${m3OnPrimaryContainer}; `;

    css += `--m3-secondary: ${secondary[40]}; `;
    css += `--m3-secondary-container: ${secondary[90]}; `;
    css += `--m3-tertiary: ${tertiary[40]}; `;
    css += `--m3-tertiary-container: ${tertiary[90]}; `;
    css += `--m3-error: ${error[40]}; `;

    css += `--wallpaper-glow-1: ${primary[95]}; `;
    css += `--wallpaper-glow-2: ${secondary[95]}; `;

    css += `--shadow-soft: ${theme.shadows.soft}; `;
    css += `--shadow-medium: ${theme.shadows.medium}; `;
    css += `--shadow-hard: ${theme.shadows.hard}; `;
  }

  css += `--glass-opacity: ${theme.glass.opacity}; `;
  css += `--glass-blur: ${theme.glass.blur}px; `;
  css += `--glass-border-opacity: ${theme.glass.borderOpacity}; `;

  return css;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-theme') as ThemeId;
      if (themes[saved]) return saved;
    }
    return 'warm';
  });

  const [darkOverride, setDarkOverride] = useState<boolean | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-dark-override');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
    }
    return null;
  });

  const [contrast, setContrastState] = useState<ContrastLevel>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-contrast') as ContrastLevel;
      if (saved === 'standard' || saved === 'medium' || saved === 'high') return saved;
    }
    return 'standard';
  });

  const [wallpaper, setWallpaperState] = useState<Wallpaper>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-wallpaper');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Wallpaper;
          const presetMatch = PRESET_WALLPAPERS.find((p) => p.id === parsed.id);
          return presetMatch || parsed;
        } catch {
          // ignore
        }
      }
    }
    return PRESET_WALLPAPERS[0];
  });

  const [customWallpaper, setCustomWallpaper] = useState<Wallpaper | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-custom-wallpaper');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return null;
  });

  const [dynamicColors, setDynamicColors] = useState<ThemeColors | null>(null);
  const [dynamicDark, setDynamicDark] = useState<boolean>(false);
  const [extractedSeed, setExtractedSeed] = useState<string | null>(null);

  const setTheme = useCallback((id: ThemeId) => {
    setWallpaperState(PRESET_WALLPAPERS[0]);
    setDynamicColors(null);
    setExtractedSeed(null);
    setDarkOverride(null);
    setThemeIdState(id);
  }, []);

  const setContrast = useCallback((level: ContrastLevel) => {
    setContrastState(level);
    try {
      localStorage.setItem('app-contrast', level);
    } catch {
      // ignore
    }
  }, []);

  const setWallpaper = useCallback((next: Wallpaper) => {
    setWallpaperState(next);
  }, []);

  const resetAppearance = useCallback(() => {
    setWallpaperState(PRESET_WALLPAPERS[0]);
    setDynamicColors(null);
    setExtractedSeed(null);
    setDarkOverride(null);
    setContrastState('standard');
    setThemeIdState('warm');
    try {
      localStorage.removeItem('app-dark-override');
      localStorage.setItem('app-contrast', 'standard');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('app-wallpaper', JSON.stringify(wallpaper));
    } catch {
      // ignore storage quota overflow
    }

    let cancelled = false;

    const processWallpaperTheme = async () => {
      if (wallpaper.type === 'default') {
        setDynamicColors(null);
        setExtractedSeed(null);
        return;
      }

      const source = wallpaper.seed || wallpaper.value;
      const result = await generateThemeColors(source);
      if (!cancelled && result) {
        const darkPolarity =
          typeof wallpaper.isDarkSurface === 'boolean' ? wallpaper.isDarkSurface : result.suggestedDark;
        setDynamicColors(result.colors);
        setDynamicDark(darkPolarity);
        setExtractedSeed(result.seedHex);
      }
    };

    processWallpaperTheme();

    return () => {
      cancelled = true;
    };
  }, [wallpaper]);

  useEffect(() => {
    if (customWallpaper) {
      try {
        localStorage.setItem('app-custom-wallpaper', JSON.stringify(customWallpaper));
      } catch {
        // ignore quota limits
      }
    }
  }, [customWallpaper]);

  const currentTheme = useMemo<Theme>(() => {
    if (dynamicColors) {
      const baseTheme = dynamicDark ? themes.dark : themes.warm;
      return {
        ...baseTheme,
        id: 'dynamic',
        name: 'Dynamic Wallpaper',
        isDark: dynamicDark,
        colors: dynamicColors,
      };
    }
    const base = themes[themeId] || themes.warm;
    const isDark = darkOverride !== null ? darkOverride : base.isDark;
    return {
      ...base,
      isDark,
    };
  }, [themeId, darkOverride, dynamicColors, dynamicDark]);

  const setDarkMode = useCallback(
    (isDark: boolean) => {
      if (dynamicColors) {
        setDynamicDark(isDark);
      } else {
        setDarkOverride(isDark);
        try {
          localStorage.setItem('app-dark-override', isDark ? 'dark' : 'light');
        } catch {
          // ignore
        }
      }
    },
    [dynamicColors]
  );

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!currentTheme.isDark);
  }, [currentTheme.isDark, setDarkMode]);

  useEffect(() => {
    const root = document.documentElement;
    const cssVariables = generateCssVariables(currentTheme, contrast);
    root.setAttribute('style', cssVariables);

    if (currentTheme.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (themes[themeId] && !dynamicColors) {
      localStorage.setItem('app-theme', themeId);
    }
    if (darkOverride === null) {
      localStorage.removeItem('app-dark-override');
    }
  }, [currentTheme, contrast, themeId, darkOverride, dynamicColors]);

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        themeId,
        contrast,
        isDynamicActive: Boolean(dynamicColors),
        dynamicDark,
        wallpaper,
        customWallpaper,
        extractedSeed,
        setTheme,
        setContrast,
        setDarkMode,
        toggleDarkMode,
        setWallpaper,
        setCustomWallpaper,
        setDynamicDark,
        resetAppearance,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
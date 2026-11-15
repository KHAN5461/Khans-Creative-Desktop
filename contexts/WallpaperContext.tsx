
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { generateThemeColors } from '../utils/dynamicTheme';

export type Wallpaper = {
  id: string;
  type: 'preset' | 'custom' | 'default';
  value: string;
  label: string;
  seed?: string; // Hex color for presets where image extraction isn't ideal (gradients)
};

export const PRESET_WALLPAPERS: Wallpaper[] = [
  { id: 'default', type: 'default', value: '', label: 'System Default', seed: '#D5A700' },
  { id: 'mesh', type: 'preset', value: 'radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)', label: 'Deep Mesh', seed: '#3F51B5' },
  { id: 'mountains', type: 'preset', value: 'url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80)', label: 'Mountains' },
  { id: 'abstract', type: 'preset', value: 'url(https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=2000&q=80)', label: 'Fluid' },
];

interface WallpaperContextType {
  wallpaper: Wallpaper;
  setWallpaper: (wallpaper: Wallpaper) => void;
  customWallpaper: Wallpaper | null;
  setCustomWallpaper: (wallpaper: Wallpaper) => void;
}

const WallpaperContext = createContext<WallpaperContextType | undefined>(undefined);

export const WallpaperProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setDynamicColors } = useTheme();
  
  const [wallpaper, setWallpaper] = useState<Wallpaper>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-wallpaper');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse wallpaper", e);
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
        } catch (e) {
          console.error("Failed to parse custom wallpaper", e);
        }
      }
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem('app-wallpaper', JSON.stringify(wallpaper));
    
    // Determine source for color extraction
    const processTheme = async () => {
        let colors = null;
        
        // 1. If preset has a seed, use it (fastest)
        if (wallpaper.seed) {
            colors = await generateThemeColors(wallpaper.seed);
        } 
        // 2. If it's a URL (custom or preset image)
        else if (wallpaper.value.startsWith('url(')) {
            const url = wallpaper.value.slice(4, -1).replace(/["']/g, ""); // extract clean URL
            colors = await generateThemeColors(url);
        }

        if (colors) {
            setDynamicColors(colors);
        }
    };

    processTheme();

  }, [wallpaper, setDynamicColors]);

  useEffect(() => {
    if (customWallpaper) {
      localStorage.setItem('app-custom-wallpaper', JSON.stringify(customWallpaper));
    }
  }, [customWallpaper]);

  return (
    <WallpaperContext.Provider value={{ wallpaper, setWallpaper, customWallpaper, setCustomWallpaper }}>
      {children}
    </WallpaperContext.Provider>
  );
};

export const useWallpaper = () => {
  const context = useContext(WallpaperContext);
  if (!context) throw new Error('useWallpaper must be used within a WallpaperProvider');
  return context;
};

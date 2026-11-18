export type TonalPalette = {
  0: string;
  4?: string;
  6?: string;
  10: string;
  12?: string;
  17?: string;
  20: string;
  22?: string;
  24?: string;
  30: string;
  40: string;
  50: string;
  60: string;
  70: string;
  80: string;
  87?: string;
  90: string;
  92?: string;
  94?: string;
  95: string;
  96?: string;
  98?: string;
  99: string;
  100: string;
};

export interface ThemeColors {
  primary: TonalPalette;
  secondary: TonalPalette;
  tertiary: TonalPalette;
  error: TonalPalette;
  neutral: TonalPalette;
  neutralVariant: TonalPalette;
}

export interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  colors: ThemeColors;
  glass: {
    opacity: number; // 0 to 1
    blur: number; // px
    borderOpacity: number; // 0 to 1
  };
  shadows: {
    soft: string;
    medium: string;
    hard: string;
  };
}

export type ThemeId = 'warm' | 'dark' | 'dev' | 'minimal' | 'ocean' | 'lavender';

export type ContrastLevel = 'standard' | 'medium' | 'high';

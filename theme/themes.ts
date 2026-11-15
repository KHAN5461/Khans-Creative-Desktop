import { Theme, ThemeColors, TonalPalette } from './types';

// Helper to generate a simple mono palette for fallback/prototyping
const createMonoPalette = (hue: number, sat: number): TonalPalette => ({
  0: `hsl(${hue}, ${sat}%, 0%)`,
  10: `hsl(${hue}, ${sat}%, 10%)`,
  20: `hsl(${hue}, ${sat}%, 20%)`,
  30: `hsl(${hue}, ${sat}%, 30%)`,
  40: `hsl(${hue}, ${sat}%, 40%)`,
  50: `hsl(${hue}, ${sat}%, 50%)`,
  60: `hsl(${hue}, ${sat}%, 60%)`,
  70: `hsl(${hue}, ${sat}%, 70%)`,
  80: `hsl(${hue}, ${sat}%, 80%)`,
  90: `hsl(${hue}, ${sat}%, 90%)`,
  95: `hsl(${hue}, ${sat}%, 95%)`,
  99: `hsl(${hue}, ${sat}%, 99%)`,
  100: `hsl(${hue}, ${sat}%, 100%)`,
});

// --- 1. WARM (Default) ---
const warmColors: ThemeColors = {
  primary: { // Gold/Brown
    0: '#000000', 10: '#291800', 20: '#422D00', 30: '#5D4200', 40: '#7A5900', 
    50: '#987200', 60: '#B68C00', 70: '#D5A700', 80: '#F4C300', 90: '#FFE084', 
    95: '#FFF0C9', 99: '#FFFBFF', 100: '#FFFFFF'
  },
  secondary: { // Warm Grey/Taupe
    0: '#000000', 10: '#1D1B16', 20: '#32302A', 30: '#494640', 40: '#615E57', 
    50: '#7A766F', 60: '#949088', 70: '#B0ACA3', 80: '#CCC7BE', 90: '#E8E3DA', 
    95: '#F7F1E8', 99: '#FFFBFF', 100: '#FFFFFF'
  },
  tertiary: { // Muted Green
    0: '#000000', 10: '#0F1F10', 20: '#263424', 30: '#3C4B39', 40: '#54634F', 
    50: '#6C7C67', 60: '#869680', 70: '#A0B19A', 80: '#BCCD85', 90: '#D8E8D0', 
    95: '#E6F6DE', 99: '#F6FBF3', 100: '#FFFFFF'
  },
  error: {
    0: '#000000', 10: '#410002', 20: '#690005', 30: '#93000A', 40: '#BA1A1A', 
    50: '#DE3730', 60: '#FF5449', 70: '#FF897D', 80: '#FFB4AB', 90: '#FFDAD6', 
    95: '#FFEDEA', 99: '#FFFBFF', 100: '#FFFFFF'
  },
  neutral: { // Warm background base
    0: '#000000', 10: '#1C1B1F', 20: '#313033', 30: '#484649', 40: '#605D62', 
    50: '#787579', 60: '#939094', 70: '#AEAAAE', 80: '#CAC5C9', 90: '#E6E1E5', 
    95: '#F4F3F7', 99: '#FFFBFF', 100: '#FFFFFF'
  },
  neutralVariant: createMonoPalette(30, 5),
};

export const warmTheme: Theme = {
  id: 'warm',
  name: 'Warm & Cozy',
  isDark: false,
  colors: warmColors,
  glass: { opacity: 1, blur: 0, borderOpacity: 1 },
  shadows: {
    soft: '0px 2px 4px rgba(0,0,0,0.05)',
    medium: '0px 4px 8px rgba(0,0,0,0.1)',
    hard: '8px 8px 0px 0px rgba(0,0,0,0.05)',
  }
};

// --- 2. DARK MODE ---
const darkColors: ThemeColors = {
  primary: warmColors.primary, // Keep brand color
  secondary: warmColors.secondary,
  tertiary: warmColors.tertiary,
  error: warmColors.error,
  neutral: { 
     // Inverted lightness for dark mode mapping manually for control
    0: '#FFFFFF', 10: '#E6E1E5', 20: '#CAC5C9', 30: '#AEAAAE', 40: '#939094', 
    50: '#787579', 60: '#605D62', 70: '#484649', 80: '#313033', 90: '#1C1B1F', 
    95: '#101012', 99: '#050505', 100: '#000000'
  },
  neutralVariant: createMonoPalette(0, 0),
};

export const darkTheme: Theme = {
  id: 'dark',
  name: 'Focus Dark',
  isDark: true,
  colors: darkColors,
  glass: { opacity: 1, blur: 0, borderOpacity: 1 },
  shadows: {
    soft: '0px 2px 4px rgba(0,0,0,0.3)',
    medium: '0px 4px 8px rgba(0,0,0,0.5)',
    hard: '8px 8px 0px 0px rgba(0,0,0,0.5)',
  }
};

// --- 3. DEV MODE (Neon/Cyber) ---
const devColors: ThemeColors = {
  primary: createMonoPalette(150, 100), // Bright Green
  secondary: createMonoPalette(280, 80), // Purple
  tertiary: createMonoPalette(320, 90), // Pink
  error: createMonoPalette(0, 100),
  neutral: {
    0: '#ffffff', 10: '#f0f0f0', 20: '#cccccc', 30: '#999999', 40: '#666666',
    50: '#444444', 60: '#333333', 70: '#222222', 80: '#111111', 90: '#0a0a0a',
    95: '#050505', 99: '#020202', 100: '#000000'
  },
  neutralVariant: createMonoPalette(150, 20),
};

export const devTheme: Theme = {
  id: 'dev',
  name: 'Cyber Dev',
  isDark: true,
  colors: {
    ...devColors,
    primary: { ...devColors.primary, 80: '#00FF94', 40: '#008F53' } // Neon override
  },
  glass: { opacity: 1, blur: 0, borderOpacity: 1 },
  shadows: {
    soft: '0px 0px 4px rgba(0, 255, 148, 0.2)',
    medium: '0px 0px 12px rgba(0, 255, 148, 0.1)',
    hard: '4px 4px 0px 0px #00FF94',
  }
};

// --- 4. MINIMAL (Monochrome) ---
const minimalColors: ThemeColors = {
  primary: createMonoPalette(0, 0),
  secondary: createMonoPalette(0, 0),
  tertiary: createMonoPalette(0, 0),
  error: createMonoPalette(0, 100),
  neutral: createMonoPalette(0, 0),
  neutralVariant: createMonoPalette(0, 0),
};

export const minimalTheme: Theme = {
  id: 'minimal',
  name: 'Swiss Minimal',
  isDark: false,
  colors: minimalColors,
  glass: { opacity: 1, blur: 0, borderOpacity: 1 }, // No glass, solid lines
  shadows: {
    soft: 'none',
    medium: 'none',
    hard: '2px 2px 0px 0px #000000',
  }
};

// --- 5. OCEAN (Blue) ---
const oceanColors: ThemeColors = {
  primary: { // Deep Blue
    0: '#000000', 10: '#001D36', 20: '#003358', 30: '#004A7B', 40: '#0061A4', 
    50: '#007ACC', 60: '#1E97F2', 70: '#5FB3FF', 80: '#9BCBFF', 90: '#D1E4FF', 
    95: '#EBF3FF', 99: '#FAFCFF', 100: '#FFFFFF'
  },
  secondary: { // Slate Blue
    0: '#000000', 10: '#0E1D29', 20: '#23323F', 30: '#394856', 40: '#50606E', 
    50: '#697987', 60: '#8293A1', 70: '#9DADBC', 80: '#B9C9D8', 90: '#D5E4F5', 
    95: '#E6F2FF', 99: '#FAFCFF', 100: '#FFFFFF'
  },
  tertiary: { // Purple Accent
    0: '#000000', 10: '#231533', 20: '#392A4A', 30: '#504061', 40: '#68587A', 
    50: '#827094', 60: '#9C89B0', 70: '#B7A4CB', 80: '#D3BFE8', 90: '#EFDBFF', 
    95: '#F9ECFF', 99: '#FFFBFF', 100: '#FFFFFF'
  },
  error: warmColors.error,
  neutral: { // Cool Grey
    0: '#000000', 10: '#191C20', 20: '#2E3135', 30: '#44474B', 40: '#5C5F63', 
    50: '#75787C', 60: '#8F9196', 70: '#AAABAF', 80: '#C6C7CB', 90: '#E2E2E6', 
    95: '#F1F1F4', 99: '#FDFBFF', 100: '#FFFFFF'
  },
  neutralVariant: {
    0: '#000000', 10: '#151D26', 20: '#2A323B', 30: '#404852', 40: '#58606A',
    50: '#707983', 60: '#8A929D', 70: '#A4ACB8', 80: '#C0C8D4', 90: '#DCE4F0',
    95: '#EBF3FF', 99: '#FAFCFF', 100: '#FFFFFF'
  },
};

export const oceanTheme: Theme = {
  id: 'ocean',
  name: 'Pacific Blue',
  isDark: false,
  colors: oceanColors,
  glass: { opacity: 1, blur: 0, borderOpacity: 1 },
  shadows: {
    soft: '0px 2px 8px rgba(0, 97, 164, 0.1)',
    medium: '0px 4px 16px rgba(0, 97, 164, 0.15)',
    hard: '6px 6px 0px 0px rgba(0, 97, 164, 0.1)',
  }
};

// --- 6. LAVENDER (Purple) ---
const lavenderColors: ThemeColors = {
  primary: { // M3 Purple
    0: '#000000', 10: '#21005D', 20: '#381E72', 30: '#4F378B', 40: '#6750A4', 
    50: '#7F67BE', 60: '#9A82DB', 70: '#B69DF8', 80: '#D0BCFF', 90: '#EADDFF', 
    95: '#F6EDFF', 99: '#FFFBFF', 100: '#FFFFFF'
  },
  secondary: { // Grey Purple
    0: '#000000', 10: '#1D192B', 20: '#332D41', 30: '#4A4458', 40: '#625B71', 
    50: '#7A738A', 60: '#958DA5', 70: '#B0A7C0', 80: '#CCC2DC', 90: '#E8DEF8', 
    95: '#F6EDFF', 99: '#FFFBFF', 100: '#FFFFFF'
  },
  tertiary: { // Pinkish
    0: '#000000', 10: '#31111D', 20: '#492532', 30: '#633B48', 40: '#7D5260', 
    50: '#986977', 60: '#B58392', 70: '#D29DAC', 80: '#EFB8C8', 90: '#FFD8E4', 
    95: '#FFECF1', 99: '#FFFBFF', 100: '#FFFFFF'
  },
  error: warmColors.error,
  neutral: { // Light Grey
    0: '#000000', 10: '#1C1B1F', 20: '#313033', 30: '#484649', 40: '#605D62', 
    50: '#787579', 60: '#939094', 70: '#AEAAAE', 80: '#CAC5C9', 90: '#E6E1E5', 
    95: '#F4F3F7', 99: '#FFFBFF', 100: '#FFFFFF'
  },
  neutralVariant: {
    0: '#000000', 10: '#1D192B', 20: '#332D41', 30: '#4A4458', 40: '#625B71',
    50: '#7A738A', 60: '#958DA5', 70: '#B0A7C0', 80: '#CCC2DC', 90: '#E8DEF8',
    95: '#F6EDFF', 99: '#FFFBFF', 100: '#FFFFFF'
  },
};

export const lavenderTheme: Theme = {
  id: 'lavender',
  name: 'Lavender Mist',
  isDark: false,
  colors: lavenderColors,
  glass: { opacity: 1, blur: 0, borderOpacity: 1 },
  shadows: {
    soft: '0px 2px 4px rgba(103, 80, 164, 0.1)',
    medium: '0px 4px 12px rgba(103, 80, 164, 0.15)',
    hard: '4px 4px 0px 0px rgba(103, 80, 164, 0.1)',
  }
};

export const themes: Record<string, Theme> = {
  warm: warmTheme,
  dark: darkTheme,
  dev: devTheme,
  minimal: minimalTheme,
  ocean: oceanTheme,
  lavender: lavenderTheme,
};

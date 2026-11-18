import {
  sourceColorFromImage,
  themeFromSourceColor,
  hexFromArgb,
  argbFromHex,
  TonalPalette as MaterialTonalPalette,
} from "@material/material-color-utilities";
import { ThemeColors, TonalPalette } from "../theme/types";

const mapTonalPalette = (p: MaterialTonalPalette): TonalPalette => ({
  0: hexFromArgb(p.tone(0)),
  4: hexFromArgb(p.tone(4)),
  6: hexFromArgb(p.tone(6)),
  10: hexFromArgb(p.tone(10)),
  12: hexFromArgb(p.tone(12)),
  17: hexFromArgb(p.tone(17)),
  20: hexFromArgb(p.tone(20)),
  22: hexFromArgb(p.tone(22)),
  24: hexFromArgb(p.tone(24)),
  30: hexFromArgb(p.tone(30)),
  40: hexFromArgb(p.tone(40)),
  50: hexFromArgb(p.tone(50)),
  60: hexFromArgb(p.tone(60)),
  70: hexFromArgb(p.tone(70)),
  80: hexFromArgb(p.tone(80)),
  87: hexFromArgb(p.tone(87)),
  90: hexFromArgb(p.tone(90)),
  92: hexFromArgb(p.tone(92)),
  94: hexFromArgb(p.tone(94)),
  95: hexFromArgb(p.tone(95)),
  96: hexFromArgb(p.tone(96)),
  98: hexFromArgb(p.tone(98)),
  99: hexFromArgb(p.tone(99)),
  100: hexFromArgb(p.tone(100)),
});

export interface DynamicThemeResult {
  colors: ThemeColors;
  suggestedDark: boolean;
  seedHex: string;
}

const estimateImageDarkness = (img: HTMLImageElement): boolean => {
  try {
    const canvas = document.createElement('canvas');
    const size = 24;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    let lumSum = 0;
    const count = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      lumSum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    }
    return lumSum / count < 122;
  } catch {
    return false;
  }
};

const isHexDark = (hex: string): boolean => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 110;
};

export const generateThemeColors = async (source: string | HTMLImageElement): Promise<DynamicThemeResult | null> => {
  try {
    let sourceColor: number;
    let suggestedDark = false;

    if (typeof source === 'string' && source.startsWith('#')) {
      sourceColor = argbFromHex(source);
      suggestedDark = isHexDark(source);
    } else {
      let img: HTMLImageElement;
      if (typeof source === 'string') {
        img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = source;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error(`Failed to load image: ${source}`));
        });
      } else {
        img = source;
      }
      sourceColor = await sourceColorFromImage(img);
      suggestedDark = estimateImageDarkness(img);
    }

    const theme = themeFromSourceColor(sourceColor);

    return {
      colors: {
        primary: mapTonalPalette(theme.palettes.primary),
        secondary: mapTonalPalette(theme.palettes.secondary),
        tertiary: mapTonalPalette(theme.palettes.tertiary),
        error: mapTonalPalette(theme.palettes.error),
        neutral: mapTonalPalette(theme.palettes.neutral),
        neutralVariant: mapTonalPalette(theme.palettes.neutralVariant),
      },
      suggestedDark,
      seedHex: hexFromArgb(sourceColor),
    };
  } catch (error) {
    console.error("Error generating dynamic theme:", error);
    return null;
  }
};

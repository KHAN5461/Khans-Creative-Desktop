
import {
  sourceColorFromImage,
  themeFromSourceColor,
  hexFromArgb,
  argbFromHex,
  TonalPalette as MaterialTonalPalette,
} from "@material/material-color-utilities";
import { ThemeColors, TonalPalette } from "../theme/types";

// Helper to convert Material TonalPalette to our app's TonalPalette interface
const mapTonalPalette = (p: MaterialTonalPalette): TonalPalette => ({
  0: hexFromArgb(p.tone(0)),
  10: hexFromArgb(p.tone(10)),
  20: hexFromArgb(p.tone(20)),
  30: hexFromArgb(p.tone(30)),
  40: hexFromArgb(p.tone(40)),
  50: hexFromArgb(p.tone(50)),
  60: hexFromArgb(p.tone(60)),
  70: hexFromArgb(p.tone(70)),
  80: hexFromArgb(p.tone(80)),
  90: hexFromArgb(p.tone(90)),
  95: hexFromArgb(p.tone(95)),
  99: hexFromArgb(p.tone(99)),
  100: hexFromArgb(p.tone(100)),
});

export const generateThemeColors = async (source: string | HTMLImageElement): Promise<ThemeColors | null> => {
  try {
    let sourceColor: number;

    if (typeof source === 'string' && source.startsWith('#')) {
      // It's a hex code
      sourceColor = argbFromHex(source);
    } else {
      // It's a URL or Image Element
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
    }

    const theme = themeFromSourceColor(sourceColor);

    return {
      primary: mapTonalPalette(theme.palettes.primary),
      secondary: mapTonalPalette(theme.palettes.secondary),
      tertiary: mapTonalPalette(theme.palettes.tertiary),
      error: mapTonalPalette(theme.palettes.error),
      neutral: mapTonalPalette(theme.palettes.neutral),
      neutralVariant: mapTonalPalette(theme.palettes.neutralVariant),
    };
  } catch (error) {
    console.error("Error generating dynamic theme:", error);
    return null;
  }
};

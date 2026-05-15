/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Odoo main colors
const odooPurple = '#714B67';
const odooLightPurple = '#A084A2';
const odooGray = '#F7F7F7';
const odooDarkGray = '#1A1A2E';
const odooWhite = '#fff';
const odooAccent = '#FFB84D';

// Dark mode specific
const darkBackground = '#121212';
const darkCard = '#1E1E2E';
const darkTextPrimary = '#E8E0F0';
const darkTextSecondary = '#C4B5D0';
const darkPurple = '#9B7EB5';

const tintColorLight = odooPurple;
const tintColorDark = odooWhite;

export const Colors = {
  light: {
    text: odooPurple,
    background: odooGray,
    tint: tintColorLight,
    icon: odooLightPurple,
    tabIconDefault: odooLightPurple,
    tabIconSelected: tintColorLight,
    primary: odooPurple,
    accent: odooAccent,
    card: odooWhite,
    border: odooDarkGray,
  },
  dark: {
    text: darkTextPrimary,
    background: darkBackground,
    tint: tintColorDark,
    icon: darkTextSecondary,
    tabIconDefault: darkTextSecondary,
    tabIconSelected: tintColorDark,
    primary: darkPurple,
    accent: odooAccent,
    card: darkCard,
    border: '#2A2A3E',
  },
};

/* Devuelve el objeto de colores correspondiente al modo actual (claro u oscuro) */
export const getColors = (isDarkMode: boolean): typeof Colors.light => {
  return isDarkMode ? Colors.dark : Colors.light;
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

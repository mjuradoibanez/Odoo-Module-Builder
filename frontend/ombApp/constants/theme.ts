/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Odoo main colors
const odooPurple = '#714B67';
const odooLightPurple = '#A084A2';
const odooGray = '#F7F7F7';
const odooDarkGray = '#222';
const odooWhite = '#fff';
const odooAccent = '#FFB84D';

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
    text: odooWhite,
    background: odooDarkGray,
    tint: tintColorDark,
    icon: odooLightPurple,
    tabIconDefault: odooLightPurple,
    tabIconSelected: tintColorDark,
    primary: odooPurple,
    accent: odooAccent,
    card: odooPurple,
    border: odooLightPurple,
  },
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

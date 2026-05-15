
import { PRIMARY, ACCENT, BLACK, WHITE, BORDER, CARD, LIGHT_TEXT } from './colors';

export const AppColors = {
  primary: PRIMARY,
  accent: ACCENT,
  background: CARD,
  text: PRIMARY,
  border: BORDER,
  card: WHITE,
  lightText: LIGHT_TEXT,
  dark: BLACK,
};

export const AppFonts = {
  bold: 'Montserrat-Bold',
  regular: 'Montserrat-Regular',
  light: 'Montserrat-Light',
  ...require('../constants/theme').Fonts,
};
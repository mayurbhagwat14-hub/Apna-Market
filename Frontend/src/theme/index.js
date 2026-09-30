/**
 * ZEVYGO theme barrel — import from here.
 *
 * @example
 * import { APP_NAME, colors, userTheme, tokens } from '../theme';
 */

import themeColors, { userTheme, vendorTheme, workerTheme, brand, palette, gradients, elevation } from './colors';
import tokens, {
  colors,
  typography,
  spacing,
  radius,
  motion,
  bookingStatusColors,
} from './tokens';
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from './brand';

export {
  APP_NAME,
  APP_TAGLINE,
  APP_DESCRIPTION,
  themeColors,
  userTheme,
  vendorTheme,
  workerTheme,
  brand,
  palette,
  gradients,
  elevation,
  tokens,
  colors,
  typography,
  spacing,
  radius,
  motion,
  bookingStatusColors,
};

export const getThemeColor = (colorPath) => {
  const paths = colorPath.split('.');
  let value = themeColors;

  for (const path of paths) {
    value = value[path];
    if (value === undefined) {
      console.warn(`Theme color path "${colorPath}" not found`);
      return colors.neutral[950];
    }
  }

  return value;
};

export const theme = {
  colors: themeColors,
  tokens,
  getColor: getThemeColor,
  APP_NAME,
};

export default theme;

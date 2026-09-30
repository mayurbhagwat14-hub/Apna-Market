/**
 * Panel theme objects — derived from design tokens.
 * Kept for backward compatibility with existing `themeColors` / `userTheme` imports.
 * New code should prefer tokens + CSS variables (bg-primary-500, text-brand, etc.).
 */

import { colors, gradients, elevation } from './tokens';

/** Core brand aliases (legacy shape used across the app) */
export const brand = {
  blue: colors.primary[500],
  cyan: colors.secondary[500],
  lightBlue: colors.primary[300],
  // Legacy aliases → map to current primary so old teal/orange refs don't regress
  teal: colors.primary[500],
  yellow: colors.secondary[500],
  orange: colors.primary[600],
  gradient: gradients.brand,
  conic: gradients.brandConic,
};

const sharedPanel = {
  gradient: brand.gradient,
  button: brand.blue,
  icon: brand.blue,
  cardShadow: elevation.md,
  cardBorder: `1px solid rgba(229, 231, 235, 0.6)`,
  brand,
};

export const userTheme = {
  ...sharedPanel,
  backgroundGradient: gradients.page,
  headerGradient: gradients.brandDiagonal,
  headerBg: colors.neutral[0],
};

export const vendorTheme = {
  ...sharedPanel,
  backgroundGradient: gradients.pageSoft,
  headerGradient: brand.blue,
};

/** @deprecated Worker panel removed — alias kept so old imports don't crash */
export const workerTheme = { ...vendorTheme };

export const themeColors = userTheme;

export { colors as palette, gradients, elevation };

export default themeColors;

/**
 * Apna Market Design System Tokens (2026)
 * Aligned to brand: deep emerald green (#016A54), soft depth, rounded geometry.
 *
 * Prefer CSS variables (index.css @theme) or these tokens — never hardcode hex in components.
 */

export const colors = {
  // Brand — deep emerald green (#016A54)
  primary: {
    50: '#EDF8F5',
    100: '#D5EFEB',
    200: '#ADE2D7',
    300: '#74CCBC',
    400: '#28A78F',
    500: '#016A54', // Core brand / buttons
    600: '#015B48',
    700: '#014A3B',
    800: '#01372C',
    900: '#00221B',
  },
  secondary: {
    50: '#EDF8F5',
    100: '#D5EFEB',
    200: '#ADE2D7',
    300: '#74CCBC',
    400: '#28A78F',
    500: '#016A54',
    600: '#015B48',
    700: '#014A3B',
    800: '#01372C',
    900: '#00221B',
  },
  accent: {
    50: '#EDF8F5',
    100: '#D5EFEB',
    200: '#ADE2D7',
    300: '#74CCBC',
    400: '#28A78F',
    500: '#016A54',
    600: '#015B48',
  },

  // Neutrals
  neutral: {
    0: '#FFFFFF',
    25: '#FAFAFC',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  // Semantic — booking status, payments, verification
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  info: {
    50: '#EDF8F5',
    100: '#D5EFEB',
    500: '#28A78F',
    600: '#016A54',
    700: '#014A3B',
  },
  blue: {
    50: '#EDF8F5',
    100: '#D5EFEB',
    200: '#ADE2D7',
    300: '#74CCBC',
    400: '#28A78F',
    500: '#016A54',
    600: '#015B48',
    700: '#014A3B',
    800: '#01372C',
    900: '#00221B',
  },
};

/** Gradients used by auth CTAs and headers */
export const gradients = {
  brand: `linear-gradient(to right, ${colors.primary[500]} 0%, ${colors.primary[700]} 100%)`,
  brandSoft: `linear-gradient(to right, ${colors.primary[300]} 0%, ${colors.primary[500]} 100%)`,
  brandDiagonal: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 50%, ${colors.primary[800]} 100%)`,
  brandConic: `conic-gradient(from 0deg, ${colors.primary[500]}, ${colors.primary[600]}, ${colors.primary[700]}, ${colors.primary[500]})`,
  page: `linear-gradient(180deg, ${colors.neutral[50]} 0%, ${colors.neutral[100]} 15%, ${colors.neutral[0]} 30%)`,
  pageSoft: `linear-gradient(to bottom, rgba(1, 106, 84, 0.03) 0%, rgba(1, 106, 84, 0.02) 10%, #ffffff 20%)`,
  authBlob: `linear-gradient(to bottom right, ${colors.primary[500]}, ${colors.primary[700]})`,
};

export const typography = {
  fontFamily: {
    sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],       // 12
    sm: ['0.875rem', { lineHeight: '1.25rem' }],    // 14
    base: ['1rem', { lineHeight: '1.5rem' }],      // 16
    lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18
    xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20
    '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

/** 4px base scale */
export const spacing = {
  0: '0',
  0.5: '0.125rem', // 2
  1: '0.25rem',    // 4
  1.5: '0.375rem', // 6
  2: '0.5rem',     // 8
  2.5: '0.625rem', // 10
  3: '0.75rem',    // 12
  4: '1rem',       // 16
  5: '1.25rem',    // 20
  6: '1.5rem',     // 24
  8: '2rem',       // 32
  10: '2.5rem',    // 40
  12: '3rem',      // 48
  14: '3.5rem',    // 56 — auth input height
  16: '4rem',      // 64
  20: '5rem',      // 80
  24: '6rem',      // 96
};

export const radius = {
  none: '0',
  sm: '0.375rem',   // 6
  md: '0.5rem',     // 8
  lg: '0.75rem',    // 12
  xl: '0.875rem',   // 14 — auth inputs / CTAs
  '2xl': '1rem',    // 16
  '3xl': '1.5rem',  // 24 — mobile cards
  '4xl': '2rem',    // 32 — desktop cards
  full: '9999px',
};

export const elevation = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  sm: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.06)',
  md: '0 4px 12px -2px rgba(1, 106, 84, 0.1), 0 2px 6px -1px rgba(1, 106, 84, 0.05)',
  lg: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
  xl: '0 20px 40px -12px rgba(15, 23, 42, 0.15)',
  brand: '0 8px 24px -4px rgba(1, 106, 84, 0.3)',
  brandSoft: '0 4px 14px -2px rgba(1, 106, 84, 0.25)',
};

export const motion = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    entrance: 'cubic-bezier(0.16, 1, 0.3, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
  },
};

/** Booking status → semantic color mapping (backend BOOKING_STATUS) */
export const bookingStatusColors = {
  searching: { bg: colors.info[50], text: colors.info[600], border: colors.info[100] },
  requested: { bg: colors.warning[50], text: colors.warning[600], border: colors.warning[100] },
  awaiting_payment: { bg: colors.warning[50], text: colors.warning[700], border: colors.warning[100] },
  pending: { bg: colors.neutral[100], text: colors.neutral[600], border: colors.neutral[200] },
  confirmed: { bg: colors.info[50], text: colors.info[700], border: colors.info[100] },
  accepted: { bg: colors.primary[50], text: colors.primary[600], border: colors.primary[100] },
  assigned: { bg: colors.primary[100], text: colors.primary[700], border: colors.primary[200] },
  journey_started: { bg: colors.primary[50], text: colors.primary[700], border: colors.primary[100] },
  visited: { bg: colors.success[50], text: colors.success[600], border: colors.success[100] },
  in_progress: { bg: colors.primary[50], text: colors.primary[600], border: colors.primary[100] },
  work_done: { bg: colors.success[50], text: colors.success[700], border: colors.success[100] },
  completed: { bg: colors.success[50], text: colors.success[700], border: colors.success[100] },
  cancelled: { bg: colors.error[50], text: colors.error[600], border: colors.error[100] },
  rejected: { bg: colors.error[50], text: colors.error[700], border: colors.error[100] },
};

const tokens = {
  colors,
  gradients,
  typography,
  spacing,
  radius,
  elevation,
  motion,
  bookingStatusColors,
};

export default tokens;

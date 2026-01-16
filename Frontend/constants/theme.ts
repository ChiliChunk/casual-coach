export const colors = {
  background: '#FAF8F5',
  backgroundSecondary: '#F5F2ED',
  card: '#FFFFFF',
  cardBorder: '#E8E4DE',

  primary: '#6B7B6B',
  primaryLight: '#8A9A8A',
  primaryDark: '#4A5A4A',

  accent: '#808068',
  accentLight: '#9A9A80',
  accentDark: '#5A5A48',

  text: '#2D2D2D',
  textSecondary: '#6B6B6B',
  textMuted: '#9A9A9A',
  textInverse: '#FFFFFF',

  border: '#E0DCD5',
  borderLight: '#F0EDE8',

  success: '#6B8B6B',
  warning: '#B8A060',
  error: '#A86868',

  overlay: 'rgba(45, 45, 45, 0.5)',
  shadow: 'rgba(107, 123, 107, 0.15)',
};

export const fonts = {
  family: 'Noto Serif',
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
};

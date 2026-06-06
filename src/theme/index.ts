export const GOLD = {
  primary: '#C9A227',
  light: '#F5D06E',
  dark: '#9C7A1A',
  glow: 'rgba(201, 162, 39, 0.25)',
  border: 'rgba(201, 162, 39, 0.4)',
  subtle: 'rgba(201, 162, 39, 0.12)',
};

export const DARK_THEME = {
  background: '#0D0B14',
  surface: '#1A1625',
  card: '#211D2E',
  cardElevated: '#2A2540',
  text: '#F0EBE3',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  border: 'rgba(255,255,255,0.08)',
  overlay: 'rgba(13,11,20,0.85)',
  tabBar: '#12101C',
  statusBar: 'light' as const,
  gradients: {
    background: ['#0D0B14', '#1A1625', '#0F0C1E'] as string[],
    card: ['#211D2E', '#1A1625'] as string[],
    gold: ['#C9A227', '#F5D06E', '#C9A227'] as string[],
    goldSubtle: ['rgba(201,162,39,0.15)', 'rgba(201,162,39,0.05)'] as string[],
    header: ['#1A1625', '#211D2E'] as string[],
  },
};

export const LIGHT_THEME = {
  background: '#FAF7F0',
  surface: '#FFFFFF',
  card: '#FFF9EE',
  cardElevated: '#FFFDF7',
  text: '#1A1020',
  textSecondary: '#4A4060',
  textMuted: '#8B7CA0',
  border: 'rgba(201,162,39,0.2)',
  overlay: 'rgba(250,247,240,0.85)',
  tabBar: '#FFFFFF',
  statusBar: 'dark' as const,
  gradients: {
    background: ['#FAF7F0', '#FFF3D4', '#FAF7F0'] as string[],
    card: ['#FFFDF7', '#FFF9EE'] as string[],
    gold: ['#C9A227', '#F5D06E', '#C9A227'] as string[],
    goldSubtle: ['rgba(201,162,39,0.12)', 'rgba(201,162,39,0.04)'] as string[],
    header: ['#FFF9EE', '#FFFDF7'] as string[],
  },
};

export type AppTheme = typeof DARK_THEME;

export const FONTS = {
  thin: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const SHADOWS = {
  gold: {
    shadowColor: '#C9A227',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

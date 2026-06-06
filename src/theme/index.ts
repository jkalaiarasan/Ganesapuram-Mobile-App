export const GOLD = {
  primary: '#C9A227',
  light: '#F5D06E',
  dark: '#9C7A1A',
  glow: 'rgba(201,162,39,0.25)',
  border: 'rgba(201,162,39,0.35)',
  subtle: 'rgba(201,162,39,0.10)',
};

export const DARK_THEME = {
  background: '#0F0A02',
  surface: '#1C1408',
  card: 'rgba(30,20,5,0.85)',
  cardElevated: 'rgba(45,32,8,0.9)',
  text: '#F5ECD7',
  textSecondary: '#C4A882',
  textMuted: '#7A6040',
  border: 'rgba(201,162,39,0.18)',
  tabBar: '#120E03',
  statusBar: 'light' as const,
  gradients: {
    background: ['#0F0A02', '#1C1408', '#110C03'] as string[],
    card: ['rgba(35,24,6,0.95)', 'rgba(22,15,3,0.95)'] as string[],
    gold: ['#9C7A1A', '#C9A227', '#F5D06E'] as string[],
    goldSubtle: ['rgba(201,162,39,0.18)', 'rgba(201,162,39,0.06)'] as string[],
    header: ['rgba(20,14,3,0.98)', 'rgba(15,10,2,0.95)'] as string[],
  },
};

export const LIGHT_THEME = {
  background: '#FFF8EC',
  surface: '#FFF3D4',
  card: 'rgba(255,248,236,0.92)',
  cardElevated: 'rgba(255,255,255,0.96)',
  text: '#2C1A00',
  textSecondary: '#6B4A1A',
  textMuted: '#A07840',
  border: 'rgba(201,162,39,0.25)',
  tabBar: '#FFFBF0',
  statusBar: 'dark' as const,
  gradients: {
    background: ['#FFF8EC', '#FFF0CC', '#FFF8EC'] as string[],
    card: ['rgba(255,252,240,0.96)', 'rgba(255,246,220,0.96)'] as string[],
    gold: ['#9C7A1A', '#C9A227', '#F5D06E'] as string[],
    goldSubtle: ['rgba(201,162,39,0.12)', 'rgba(201,162,39,0.04)'] as string[],
    header: ['rgba(255,248,236,0.98)', 'rgba(255,243,210,0.95)'] as string[],
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

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };

export const SHADOWS = {
  gold: {
    shadowColor: '#C9A227',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  card: {
    shadowColor: '#8B6914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
};

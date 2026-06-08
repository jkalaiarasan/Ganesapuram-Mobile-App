export const GOLD = {
  primary: '#C9A227',
  light: '#F5D06E',
  dark: '#9C7A1A',
  glow: 'rgba(201,162,39,0.25)',
  border: 'rgba(201,162,39,0.35)',
  subtle: 'rgba(201,162,39,0.10)',
};

export const DARK_THEME = {
  background: '#0C0C0C',
  surface: '#161616',
  card: 'rgba(20,20,20,0.88)',
  cardElevated: 'rgba(28,28,28,0.94)',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textMuted: '#666666',
  border: 'rgba(201,162,39,0.22)',
  tabBar: '#0A0A0A',
  statusBar: 'light' as const,
  gradients: {
    background: ['#0C0C0C', '#141414', '#0C0C0C'] as string[],
    card: ['rgba(22,22,22,0.96)', 'rgba(16,16,16,0.96)'] as string[],
    gold: ['#9C7A1A', '#C9A227', '#F5D06E'] as string[],
    goldSubtle: ['rgba(201,162,39,0.18)', 'rgba(201,162,39,0.06)'] as string[],
    header: ['rgba(14,14,14,0.98)', 'rgba(10,10,10,0.97)'] as string[],
  },
};

export const LIGHT_THEME = {
  background: '#FFFFFF',
  surface: '#F5F5F7',
  card: 'rgba(255,255,255,0.97)',
  cardElevated: 'rgba(255,255,255,1.0)',
  text: '#1A1A1A',
  textSecondary: '#555555',
  textMuted: '#9A9A9A',
  border: 'rgba(201,162,39,0.30)',
  tabBar: '#FFFFFF',
  statusBar: 'dark' as const,
  gradients: {
    background: ['#FFFFFF', '#F8F8FA', '#FFFFFF'] as string[],
    card: ['rgba(255,255,255,0.98)', 'rgba(248,248,250,0.97)'] as string[],
    gold: ['#9C7A1A', '#C9A227', '#F5D06E'] as string[],
    goldSubtle: ['rgba(201,162,39,0.14)', 'rgba(201,162,39,0.05)'] as string[],
    header: ['rgba(255,255,255,0.99)', 'rgba(248,248,250,0.97)'] as string[],
  },
};

export type AppTheme = typeof DARK_THEME;

// Inter font family — weight-specific variants for cross-platform consistency
export const FONT_FAMILY = {
  thin:      'Inter_300Light',
  regular:   'Inter_400Regular',
  medium:    'Inter_500Medium',
  semibold:  'Inter_600SemiBold',
  bold:      'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
  black:     'Inter_900Black',
};

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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
};

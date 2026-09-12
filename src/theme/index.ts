// Warm clay — the app's single accent. Replaces the former cool platinum,
// which read as corporate grey and gave the brand no colour identity.
export const ACCENT = {
  primary: '#D97757',
  light: '#EFA88A',
  dark: '#9C4F32',
  glow: 'rgba(217,119,87,0.22)',
  border: 'rgba(217,119,87,0.28)',
  subtle: 'rgba(217,119,87,0.10)',
  // Fills for icon chips and inset panels. Tokens rather than literals so
  // screens stop hardcoding the accent's rgba by hand.
  tintStrong: 'rgba(217,119,87,0.16)',
  tintSoft: 'rgba(217,119,87,0.06)',
};

// Warm-neutral greys — the base/secondary hue paired with ACCENT everywhere.
// Deliberately low-chroma: the earlier browns muddied every surface they sat
// behind. Colour comes from ACCENT, the ground stays neutral.
export const DEEP = {
  primary: '#292524',
  deep: '#0C0A09',
  light: '#44403C',
};

// Text/icon colour on top of accent-filled surfaces (buttons, badges).
export const ON_ACCENT = '#FFFFFF';

// Off-white used anywhere text would otherwise sit on stark #fff.
export const SOFT_WHITE = '#FAFAF9';

// Presence stays conventionally green — a warm palette should not make
// "online" ambiguous.
export const ONLINE_GREEN = '#4ADE80';

export const DARK_THEME = {
  background: '#0C0A09',
  surface: '#1C1917',
  card: 'rgba(28,25,23,0.92)',
  cardElevated: 'rgba(41,37,36,0.96)',
  text: '#FAFAF9',
  textSecondary: '#D6D3D1',
  textMuted: '#A8A29E',
  border: 'rgba(217,119,87,0.18)',
  divider: 'rgba(250,250,249,0.10)',
  tabBar: '#000000',
  statusBar: 'light' as const,
  gradients: {
    // Near-flat. A lighter middle stop reads as a smudge on a dark ground.
    background: ['#0C0A09', '#15120F', '#0C0A09'] as string[],
    card: ['rgba(41,37,36,0.94)', 'rgba(12,10,9,0.92)'] as string[],
    accent: [ACCENT.dark, ACCENT.primary, ACCENT.light] as string[],
    accentSubtle: ['rgba(217,119,87,0.14)', 'rgba(41,37,36,0.18)'] as string[],
    header: ['rgba(28,25,23,0.96)', 'rgba(12,10,9,0.96)'] as string[],
    deep: [DEEP.deep, DEEP.primary, DEEP.light] as string[],
    row: ['rgba(35,31,29,0.96)', 'rgba(18,15,14,0.94)'] as string[],
    avatar: ['#292524', '#1C1917'] as string[],
  },
};

export const LIGHT_THEME = {
  background: '#FAFAF9',
  surface: '#F5F5F4',
  card: 'rgba(255,255,255,0.96)',
  cardElevated: '#FFFFFF',
  text: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#A8A29E',
  border: 'rgba(28,25,23,0.10)',
  divider: 'rgba(28,25,23,0.08)',
  tabBar: '#F5F5F4',
  statusBar: 'dark' as const,
  gradients: {
    background: ['#FAFAF9', '#F5F5F4', '#FAFAF9'] as string[],
    card: ['rgba(255,255,255,0.98)', 'rgba(245,245,244,0.96)'] as string[],
    accent: [ACCENT.dark, ACCENT.primary, ACCENT.light] as string[],
    accentSubtle: ['rgba(217,119,87,0.12)', 'rgba(41,37,36,0.04)'] as string[],
    header: ['rgba(250,250,249,0.97)', 'rgba(245,245,244,0.96)'] as string[],
    deep: [DEEP.deep, DEEP.primary, DEEP.light] as string[],
    row: ['rgba(255,255,255,0.98)', 'rgba(247,247,246,0.96)'] as string[],
    avatar: ['#F5F5F4', '#E7E5E4'] as string[],
  },
};

export type AppTheme = typeof DARK_THEME | typeof LIGHT_THEME;

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

export const SPACING = { xs: 4, sm: 10, md: 18, lg: 28, xl: 40, xxl: 56 };
export const RADIUS = { sm: 10, md: 16, lg: 22, xl: 30, full: 999 };

// Softer and warmer than the previous hard black shadows — large radius, low
// opacity, so cards lift off the ground without a visible dark halo.
export const SHADOWS = {
  accent: {
    shadowColor: ACCENT.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 12,
  },
  card: {
    shadowColor: '#2A1B12',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
};

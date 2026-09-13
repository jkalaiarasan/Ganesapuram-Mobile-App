// Ocean — the app's single accent. A cool cyan-blue, paired with a cool
// neutral ground so accent and surface never fight for attention.
export const ACCENT = {
  primary: '#0EA5E9',
  light: '#22D3EE',
  dark: '#0369A1',
  glow: 'rgba(14,165,233,0.24)',
  border: 'rgba(14,165,233,0.22)',
  subtle: 'rgba(14,165,233,0.10)',
  // Fills for icon chips and inset panels. Tokens rather than literals so
  // screens stop hardcoding the accent's rgba by hand.
  tintStrong: 'rgba(14,165,233,0.16)',
  tintSoft: 'rgba(14,165,233,0.06)',
};

// Cool neutral slate — the base/secondary hue paired with ACCENT everywhere.
export const DEEP = {
  primary: '#1E293B',
  deep: '#080C14',
  light: '#334155',
};

// Text/icon colour on top of accent-filled surfaces (buttons, badges).
export const ON_ACCENT = '#FFFFFF';

// Off-white used anywhere text would otherwise sit on stark #fff.
export const SOFT_WHITE = '#F8FAFC';

// Presence stays conventionally green so "online" is never ambiguous.
export const ONLINE_GREEN = '#34D399';

export const DARK_THEME = {
  background: '#080C14',
  surface: '#111827',
  card: 'rgba(17,24,39,0.94)',
  cardElevated: 'rgba(27,36,54,0.97)',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  // Soft cards lean on elevation, not outlines — so the border is a whisper.
  border: 'rgba(148,163,184,0.14)',
  divider: 'rgba(248,250,252,0.08)',
  tabBar: '#05080E',
  statusBar: 'light' as const,
  gradients: {
    // Near-flat. A lighter middle stop reads as a smudge on a dark ground.
    background: ['#080C14', '#0C121F', '#080C14'] as string[],
    card: ['rgba(27,36,54,0.96)', 'rgba(17,24,39,0.94)'] as string[],
    accent: [ACCENT.dark, ACCENT.primary, ACCENT.light] as string[],
    accentSubtle: ['rgba(14,165,233,0.14)', 'rgba(30,41,59,0.18)'] as string[],
    header: ['rgba(17,24,39,0.97)', 'rgba(8,12,20,0.97)'] as string[],
    deep: [DEEP.deep, DEEP.primary, DEEP.light] as string[],
    row: ['rgba(24,32,48,0.97)', 'rgba(15,21,33,0.95)'] as string[],
    avatar: ['#1E293B', '#111827'] as string[],
  },
};

export const LIGHT_THEME = {
  background: '#F8FAFC',
  surface: '#F1F5F9',
  card: 'rgba(255,255,255,0.97)',
  cardElevated: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: 'rgba(15,23,42,0.08)',
  divider: 'rgba(15,23,42,0.06)',
  tabBar: '#F1F5F9',
  statusBar: 'dark' as const,
  gradients: {
    background: ['#F8FAFC', '#F1F5F9', '#F8FAFC'] as string[],
    card: ['#FFFFFF', 'rgba(248,250,252,0.97)'] as string[],
    accent: [ACCENT.dark, ACCENT.primary, ACCENT.light] as string[],
    accentSubtle: ['rgba(14,165,233,0.12)', 'rgba(30,41,59,0.04)'] as string[],
    header: ['rgba(248,250,252,0.97)', 'rgba(241,245,249,0.96)'] as string[],
    deep: [DEEP.deep, DEEP.primary, DEEP.light] as string[],
    row: ['#FFFFFF', 'rgba(248,250,252,0.97)'] as string[],
    avatar: ['#F1F5F9', '#E2E8F0'] as string[],
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

// A real scale, so screens stop inventing font sizes inline. Tracking stays
// near zero — the wide letter-spacing the old UI used on every label is the
// single most dated thing about it.
export const TYPE = {
  display:    { fontSize: 32, fontFamily: FONT_FAMILY.bold,     letterSpacing: -0.6 },
  title:      { fontSize: 22, fontFamily: FONT_FAMILY.bold,     letterSpacing: -0.4 },
  heading:    { fontSize: 17, fontFamily: FONT_FAMILY.semibold, letterSpacing: -0.2 },
  body:       { fontSize: 15, fontFamily: FONT_FAMILY.regular,  lineHeight: 22 },
  bodyStrong: { fontSize: 15, fontFamily: FONT_FAMILY.semibold },
  label:      { fontSize: 13, fontFamily: FONT_FAMILY.medium },
  caption:    { fontSize: 12, fontFamily: FONT_FAMILY.regular },
  micro:      { fontSize: 11, fontFamily: FONT_FAMILY.medium },
};

export const SPACING = { xs: 4, sm: 10, md: 18, lg: 28, xl: 40, xxl: 56 };

// Soft cards — noticeably rounder than before. Cards read as pebbles rather
// than panels, and chips go fully pill.
export const RADIUS = { sm: 14, md: 20, lg: 28, xl: 36, full: 999 };

// Wide, diffuse and cool-tinted. Elevation is what separates a soft card from
// the ground, so the shadow is large and faint rather than tight and dark.
export const SHADOWS = {
  accent: {
    shadowColor: ACCENT.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 24,
    elevation: 12,
  },
  card: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 10,
  },
};

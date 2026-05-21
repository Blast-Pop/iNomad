// Central theme tokens — outdoor sombre palette.
// Anything visual reaches for these instead of hardcoding hex.

export const colors = {
  // Backgrounds — deep navy with slightly elevated cards
  bg: '#0B1F26',
  bgElevated: '#143540',
  surface: '#1F4756',
  surfaceMuted: '#0F2A33',
  overlay: 'rgba(7, 18, 22, 0.78)',

  // Text — cream on dark
  text: '#F4F0E6',
  textMuted: '#A8B4BA',
  textDim: '#6B7F87',
  textInverse: '#0B1F26',

  // Borders & dividers
  border: '#2C5564',
  borderSubtle: '#1B3A45',

  // Accents
  accent: '#E8A33D',        // gold (for fish-related actions)
  accentMuted: '#B8821E',
  primary: '#4A90A4',       // brand blue
  primaryDeep: '#0B3A47',
  success: '#7DB37C',
  danger: '#E55353',
  warning: '#E8A33D',

  // Per-activity pin colors (vivid enough on dark map)
  activity: {
    Peche: '#4A90A4',
    Camping: '#7DB37C',
    'Sentier 4 roues': '#C97D3C',
    'Sentier pédestre': '#5DD4C6',
    'Relais routier': '#B084DC',
    'Descente de bateau': '#6BB6E0',
  },
};

export function colorForActivity(activity) {
  return colors.activity[activity] || colors.danger;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', color: colors.text },
  h2: { fontSize: 22, fontWeight: '700', color: colors.text },
  h3: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, color: colors.text },
  bodyMuted: { fontSize: 15, color: colors.textMuted },
  caption: { fontSize: 12, color: colors.textMuted },
  mono: { fontFamily: 'monospace', color: colors.text },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  pin: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },
};

// MapLibre style URL for the dark outdoor look.
// CartoCDN's Dark Matter is OSS, free, no key, well-maintained.
export const MAP_STYLE_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default { colors, spacing, radius, typography, shadow, colorForActivity, MAP_STYLE_URL };

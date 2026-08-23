// Shared design tokens — the single source of truth for color, spacing, radius,
// type scale, and animation duration across the app.
//
// debate.tsx intentionally keeps its own scoped pink+violet romantic theme
// rather than pulling from this file (the pink is sourced from
// `color.accentPink` below to stay in sync; violet is its own token, scoped
// to that screen), and top-picks.tsx keeps its own dark cinematic palette
// as file-local constants.

export const color = {
  // Brand — Netflix red family (login, tabs, home, match brand touches)
  brand: "#E50914",
  brandLight: "#FF3B47",

  // Secondary accent — pink, the most cross-screen-consistent non-red accent
  // (home, match, notifications, debate all converge on this independently)
  accentPink: "#ec4899",

  // Semantic — established by the Toast/Confirm system, reused everywhere
  success: "#10b981",
  error: "#f43f5e",
  info: "#06b6d4",
  warning: "#f59e0b",

  // Neutrals — light surfaces (home, match, profile, notifications, debate)
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textTertiary: "#9ca3af",
  border: "#e5e7eb",
  surface: "#f9fafb",
  surfaceHigh: "#f3f4f6",
  bg: "#ffffff",

  // Dark-glass surface — Toast/Confirm sheets, reusable for any future dark modal
  surfaceDark: "#0f172a",
  surfaceDarkBorder: "rgba(255,255,255,0.08)",
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 48,
  "5xl": 64,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  full: 9999,
} as const

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 32,
} as const

export const duration = {
  fast: 150,
  base: 250,
  slow: 400,
} as const

// Soft, neutral shadows — never colored/heavy. Cards should feel like they're
// resting gently above the background, not casting a hard drop shadow.
export const shadow = {
  sm: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 12,
  },
} as const

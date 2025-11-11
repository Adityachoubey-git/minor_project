export const themeConfig = {
  colors: {
    light: {
      background: "oklch(0.98 0 0)",
      foreground: "oklch(0.15 0 0)",
      primary: "oklch(0.42 0.22 263)",
      accent: "oklch(0.52 0.28 80)",
      destructive: "oklch(0.56 0.24 27)",
    },
    dark: {
      background: "oklch(0.13 0 0)",
      foreground: "oklch(0.98 0 0)",
      primary: "oklch(0.65 0.22 263)",
      accent: "oklch(0.7 0.28 80)",
      destructive: "oklch(0.6 0.24 27)",
    },
  },
  transitions: {
    fast: "transition-all duration-150",
    normal: "transition-all duration-300",
    slow: "transition-all duration-500",
  },
} as const

export type ThemeMode = "light" | "dark" | "system"

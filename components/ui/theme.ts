import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Guinness amber-gold — primary brand
        brand: {
          50:  { value: "#fff7e6" },
          100: { value: "#fdecc5" },
          200: { value: "#f9d98e" },
          300: { value: "#f4c05a" },
          400: { value: "#eda52e" },
          500: { value: "#d4880e" },   // warm amber — main CTA
          600: { value: "#b36c08" },
          700: { value: "#8c5005" },
          800: { value: "#653805" },
          900: { value: "#3e2204" },
          950: { value: "#1f1002" },
        },
        // Guinness stout — deep warm-black used for surfaces & fg in dark
        stout: {
          50:  { value: "#f5ede0" },
          100: { value: "#e8d4b8" },
          200: { value: "#c9a87a" },
          300: { value: "#a07845" },
          400: { value: "#6b4a22" },
          500: { value: "#3d2409" },
          600: { value: "#2c1a07" },
          700: { value: "#1e1104" },
          800: { value: "#130b02" },
          900: { value: "#0a0501" },
          950: { value: "#050301" },
        },
        // Harp green — Guinness logo, used very sparingly (success states only)
        harp: {
          50:  { value: "#e6f4ed" },
          100: { value: "#b3ddc6" },
          200: { value: "#80c7a0" },
          300: { value: "#4db079" },
          400: { value: "#1a9953" },
          500: { value: "#006b3c" },
          600: { value: "#005530" },
          700: { value: "#004024" },
          800: { value: "#002a18" },
          900: { value: "#00150c" },
        },
      },
      fonts: {
        heading: { value: '"Geist", sans-serif' },
        body:    { value: '"Geist", sans-serif' },
      },
      radii: {
        soft:  { value: "1rem" },
        cloud: { value: "1.5rem" },
        panel: { value: "1.75rem" },
      },
      shadows: {
        soft:   { value: "0 12px 40px rgba(61, 36, 9, 0.10)" },
        lifted: { value: "0 24px 70px rgba(61, 36, 9, 0.16)" },
      },
    },
    semanticTokens: {
      colors: {
        // ── Backgrounds ─────────────────────────────────────────────────────────
        "app.canvas":      { value: { _light: "#f6f6f6",                   _dark: "#0f0b07"  } },
        "app.surface":     { value: { _light: "rgba(255,255,255,0.76)",    _dark: "rgba(26,17,6,0.82)" } },
        "app.surfaceSolid":{ value: { _light: "#fffaf3",                   _dark: "#1a1106"  } },
        // ── Borders ─────────────────────────────────────────────────────────────
        "app.border":      { value: { _light: "#e4d4bb",                   _dark: "#2f2115"  } },
        // ── Foreground ──────────────────────────────────────────────────────────
        "app.fg":          { value: { _light: "#231608",                   _dark: "#f2e8d6"  } },
        "app.muted":       { value: { _light: "#7a6248",                   _dark: "#b09070"  } },
        "app.subtle":      { value: { _light: "#9c7d5c",                   _dark: "#8a7055"  } },
        // ── Accent (amber) ───────────────────────────────────────────────────────
        "app.accent":      { value: { _light: "#c07800",                   _dark: "#f0aa4a"  } },
        "app.accentFg":    { value: { _light: "#fff8ec",                   _dark: "#271500"  } },
        // ── Danger ──────────────────────────────────────────────────────────────
        "app.danger":      { value: { _light: "#c23b39",                   _dark: "#ff9b92"  } },

        // ── Brand semantic slots (wires colorPalette="brand" into Chakra) ───────
        brand: {
          solid:      { value: "{colors.brand.500}" },
          contrast:   { value: "{colors.brand.50}"  },
          fg:         { value: { _light: "{colors.brand.700}", _dark: "{colors.brand.300}" } },
          muted:      { value: { _light: "{colors.brand.100}", _dark: "{colors.brand.900}" } },
          subtle:     { value: { _light: "{colors.brand.200}", _dark: "{colors.brand.800}" } },
          emphasized: { value: { _light: "{colors.brand.300}", _dark: "{colors.brand.700}" } },
          focusRing:  { value: "{colors.brand.500}" },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);

import type { ThemeTokens } from "@/lib/theme";

export type DesignPreset = {
  id: string;
  name: string;
  mode: "light" | "dark";
  description: string;
  tokens: ThemeTokens;
  font: string;
};

// 3 light + 2 dark, each with its own personality. Colors picked for
// WCAG AA contrast on the auto-derived foregrounds.
export const PRESETS: DesignPreset[] = [
  {
    id: "marine",
    name: "Marine",
    mode: "light",
    description: "Corporate, sachlich. Tiefblau auf Weiß.",
    tokens: {
      background: "#ffffff",
      foreground: "#0a1929",
      primary: "#1e40af",
      card: "#ffffff",
      muted: "#f1f5f9",
      accent: "#e0e7ff",
      border: "#e2e8f0",
    },
    font: "Inter",
  },
  {
    id: "sunset",
    name: "Sunset",
    mode: "light",
    description: "Warm, freundlich. Orange auf Cremeweiß.",
    tokens: {
      background: "#fff7ed",
      foreground: "#1c1917",
      primary: "#ea580c",
      card: "#ffffff",
      muted: "#fed7aa",
      accent: "#fde68a",
      border: "#fed7aa",
    },
    font: "Nunito",
  },
  {
    id: "forest",
    name: "Forest",
    mode: "light",
    description: "Natürlich, eco. Grün auf Salbei.",
    tokens: {
      background: "#f0fdf4",
      foreground: "#14532d",
      primary: "#15803d",
      card: "#ffffff",
      muted: "#dcfce7",
      accent: "#bbf7d0",
      border: "#bbf7d0",
    },
    font: "Source Sans 3",
  },
  {
    id: "midnight",
    name: "Midnight",
    mode: "dark",
    description: "Premium, tech. Indigo auf Tiefblau-Schwarz.",
    tokens: {
      background: "#0a0e1a",
      foreground: "#e2e8f0",
      primary: "#6366f1",
      card: "#161b2e",
      muted: "#1e293b",
      accent: "#312e81",
      border: "#1e293b",
    },
    font: "Inter",
  },
  {
    id: "charcoal",
    name: "Charcoal",
    mode: "dark",
    description: "Editorial, bold. Orange-Akzent auf Anthrazit.",
    tokens: {
      background: "#1c1917",
      foreground: "#fafaf9",
      primary: "#f97316",
      card: "#292524",
      muted: "#292524",
      accent: "#44403c",
      border: "#44403c",
    },
    font: "Manrope",
  },
];

export function getPreset(id: string): DesignPreset | undefined {
  return PRESETS.find((p) => p.id === id);
}

import { getSetting } from "@/lib/settings";
import { contrastingFg, mix } from "./colors";

// The seven user-controllable tokens. Foregrounds for each
// background-ish token are auto-derived for AA-readability.
export type ThemeTokens = {
  background: string;
  foreground: string;
  primary: string;
  card: string;
  muted: string;
  accent: string;
  border: string;
};

export type ThemeConfig = {
  preset: string; // "default" | "marine" | "sunset" | "forest" | "midnight" | "charcoal" | "custom"
  tokens: ThemeTokens;
  font: string | null; // Google-Fonts family name, e.g. "Inter". null = system default.
};

// Hard fallback that matches src/app/globals.css :root in plain hex.
// Keeps the app rendering correctly when no theme setting exists yet.
export const DEFAULT_TOKENS: ThemeTokens = {
  background: "#ffffff",
  foreground: "#0a0a0a",
  primary: "#171717",
  card: "#ffffff",
  muted: "#f5f5f5",
  accent: "#f5f5f5",
  border: "#e5e7eb",
};

export async function getActiveTheme(): Promise<ThemeConfig> {
  const rawPreset = await getSetting("theme.preset");
  const rawTokens = await getSetting("theme.tokens");
  const rawFont = await getSetting("theme.font");
  let tokens: ThemeTokens = DEFAULT_TOKENS;
  if (rawTokens) {
    try {
      const parsed = JSON.parse(rawTokens) as Partial<ThemeTokens>;
      tokens = { ...DEFAULT_TOKENS, ...parsed };
    } catch {
      // Bad data — fall through to defaults rather than 500'ing.
    }
  }
  return {
    preset: rawPreset ?? "default",
    tokens,
    font: rawFont ?? null,
  };
}

// Build the `:root { … }` CSS that we inject in the root layout.
// Foregrounds are computed once here so consumers don't have to.
export function themeStyleVars(t: ThemeTokens): string {
  const fg = t.foreground;
  const bg = t.background;
  const cardFg = contrastingFg(t.card);
  const primaryFg = contrastingFg(t.primary);
  // muted-foreground sits *on* muted — pick a softer alternative to
  // the page foreground so secondary text doesn't compete with body.
  const mutedFg = mix(fg, bg, 0.4);
  const accentFg = contrastingFg(t.accent);
  // A subtle ring keyed off primary for focus outlines.
  const ring = t.primary;
  return [
    `--background:${bg};`,
    `--foreground:${fg};`,
    `--card:${t.card};`,
    `--card-foreground:${cardFg};`,
    `--popover:${t.card};`,
    `--popover-foreground:${cardFg};`,
    `--primary:${t.primary};`,
    `--primary-foreground:${primaryFg};`,
    `--secondary:${t.muted};`,
    `--secondary-foreground:${fg};`,
    `--muted:${t.muted};`,
    `--muted-foreground:${mutedFg};`,
    `--accent:${t.accent};`,
    `--accent-foreground:${accentFg};`,
    `--border:${t.border};`,
    `--input:${t.border};`,
    `--ring:${ring};`,
  ].join("");
}

// Curated subset of Google Fonts. The crawler matches against this
// list; the template picker exposes the same names. We restrict the
// set so the layout's <link> stays small and CSP-friendly.
export const FONT_WHITELIST = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Nunito",
  "Source Sans 3",
  "Manrope",
  "Geist",
  "Poppins",
  "Work Sans",
  "Playfair Display",
  "Merriweather",
  "Roboto Slab",
  "Space Grotesk",
  "DM Sans",
] as const;

export function googleFontHref(family: string): string | null {
  if (!FONT_WHITELIST.includes(family as (typeof FONT_WHITELIST)[number])) return null;
  const familyParam = family.replace(/ /g, "+");
  // Pull weights 400 and 700 — covers body + bold + headings.
  return `https://fonts.googleapis.com/css2?family=${familyParam}:wght@400;500;700&display=swap`;
}

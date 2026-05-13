import { FONT_WHITELIST } from "@/lib/theme";

// Hand-curated map of common non-Google-Fonts to their closest available
// Google Fonts equivalent. Picked by visual similarity (x-height, weight
// curves, terminal shape) rather than algorithmic — there's no good
// programmatic way to compare arbitrary font binaries without rendering.
const ALIASES: Record<string, (typeof FONT_WHITELIST)[number]> = {
  // Sans-serif — neo-grotesque / humanist sans
  helvetica: "Inter",
  "helvetica neue": "Inter",
  arial: "Inter",
  verdana: "Inter",
  tahoma: "Inter",
  segoe: "Inter",
  "segoe ui": "Inter",
  "apple system": "Inter",
  "-apple-system": "Inter",
  "san francisco": "Inter",
  "sf pro": "Inter",
  "sf pro text": "Inter",
  "sf pro display": "Inter",
  "neue haas": "Inter",
  "neue haas grotesk": "Inter",
  futura: "DM Sans",
  avenir: "DM Sans",
  "avenir next": "DM Sans",
  gotham: "Manrope",
  "gotham black": "Manrope",
  proxima: "DM Sans",
  "proxima nova": "DM Sans",
  museo: "Nunito",
  "museo sans": "Nunito",
  myriad: "Source Sans 3",
  "myriad pro": "Source Sans 3",
  calibri: "Source Sans 3",
  "open sans condensed": "Open Sans",
  // Serif
  georgia: "Merriweather",
  times: "Merriweather",
  "times new roman": "Merriweather",
  garamond: "Merriweather",
  cambria: "Merriweather",
  baskerville: "Playfair Display",
  bodoni: "Playfair Display",
  didot: "Playfair Display",
  // Slab
  rockwell: "Roboto Slab",
  museosa: "Roboto Slab",
  // Display / geometric
  bebas: "Space Grotesk",
  "bebas neue": "Space Grotesk",
};

const SANS_FALLBACK: (typeof FONT_WHITELIST)[number] = "Inter";
const SERIF_FALLBACK: (typeof FONT_WHITELIST)[number] = "Merriweather";

// Detect category from the full font-family string. CSS authors usually
// write `font-family: "Brand Sans", "Arial", sans-serif;` — the generic
// at the end tells us the category.
function categoryFromFallbackChain(rawFamily: string): "sans" | "serif" | "mono" | null {
  const lower = rawFamily.toLowerCase();
  if (/\bmonospace\b/.test(lower)) return "mono";
  if (/\bserif\b/.test(lower) && !/sans-serif/.test(lower)) return "serif";
  if (/sans-serif/.test(lower)) return "sans";
  return null;
}

// Resolve a font-family declaration to a whitelisted Google Font.
// Strategy:
//   1. Exact whitelist match wins.
//   2. ALIASES table lookup (case-insensitive, ignores quotes).
//   3. Category fallback from the generic in the chain.
//   4. Last resort: SANS_FALLBACK.
//
// Returns { font, similar } where `similar=true` means we picked an
// alternative — caller surfaces a "ähnliche Schrift verwendet" hint.
export function resolveFont(rawFamily: string): { font: (typeof FONT_WHITELIST)[number] | null; similar: boolean } {
  // The crawler hands us one family name at a time, but to keep the
  // category-detection useful we accept the raw declaration too.
  const parts = rawFamily
    .split(",")
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);

  for (const name of parts) {
    const norm = name.toLowerCase();
    // 1) exact whitelist
    const exact = FONT_WHITELIST.find((w) => w.toLowerCase() === norm);
    if (exact) return { font: exact, similar: false };
  }

  for (const name of parts) {
    const norm = name.toLowerCase();
    if (ALIASES[norm]) return { font: ALIASES[norm]!, similar: true };
    // Fuzzy prefix match — "Helvetica Neue Light" → "helvetica neue"
    for (const key of Object.keys(ALIASES)) {
      if (norm.startsWith(key)) return { font: ALIASES[key]!, similar: true };
    }
  }

  const cat = categoryFromFallbackChain(rawFamily);
  if (cat === "serif") return { font: SERIF_FALLBACK, similar: true };
  if (cat === "sans") return { font: SANS_FALLBACK, similar: true };
  if (cat === "mono") return { font: null, similar: true };

  // No category, no alias — give up and return null so caller can
  // decide whether to inherit system default.
  return { font: null, similar: false };
}

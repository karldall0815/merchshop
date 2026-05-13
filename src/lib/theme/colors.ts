// Lightweight CSS color → relative luminance helpers, written from
// scratch instead of pulling in chroma-js. We accept hex (#abc, #aabbcc,
// #aabbccdd), rgb(a)(), and named colors via a tiny embedded table.

export function parseColor(input: string): { r: number; g: number; b: number } | null {
  const s = input.trim().toLowerCase();
  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0]! + hex[0]!, 16);
      const g = parseInt(hex[1]! + hex[1]!, 16);
      const b = parseInt(hex[2]! + hex[2]!, 16);
      return Number.isNaN(r) ? null : { r, g, b };
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return Number.isNaN(r) ? null : { r, g, b };
    }
    return null;
  }
  const rgb = s.match(/^rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)/);
  if (rgb) {
    return { r: +rgb[1]!, g: +rgb[2]!, b: +rgb[3]! };
  }
  // Named colors — small embedded table of the most common ones plus
  // any encountered in extracted CSS.
  return NAMED[s] ?? null;
}

const NAMED: Record<string, { r: number; g: number; b: number }> = {
  white: { r: 255, g: 255, b: 255 },
  black: { r: 0, g: 0, b: 0 },
  red: { r: 255, g: 0, b: 0 },
  green: { r: 0, g: 128, b: 0 },
  blue: { r: 0, g: 0, b: 255 },
  gray: { r: 128, g: 128, b: 128 },
  grey: { r: 128, g: 128, b: 128 },
  silver: { r: 192, g: 192, b: 192 },
  navy: { r: 0, g: 0, b: 128 },
  teal: { r: 0, g: 128, b: 128 },
  orange: { r: 255, g: 165, b: 0 },
  purple: { r: 128, g: 0, b: 128 },
};

// Relative luminance (WCAG). 0 = pure black, 1 = pure white.
export function luminance(c: { r: number; g: number; b: number }): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

// Pick #000 or #fff so the text on top of `bg` reaches AA contrast.
export function contrastingFg(bg: string): string {
  const c = parseColor(bg);
  if (!c) return "#000000";
  return luminance(c) > 0.5 ? "#0a0a0a" : "#fafafa";
}

// Mix two colors by ratio (0..1). Used to derive `muted` and `accent`
// from the base background when a crawl gives us only background +
// primary.
export function mix(a: string, b: string, ratio = 0.5): string {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return a;
  const r = Math.round(ca.r * (1 - ratio) + cb.r * ratio);
  const g = Math.round(ca.g * (1 - ratio) + cb.g * ratio);
  const bl = Math.round(ca.b * (1 - ratio) + cb.b * ratio);
  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// HSL distance heuristic for "is this color grayish?" — used by the
// crawler to drop near-greys when picking a brand primary.
export function saturation(c: { r: number; g: number; b: number }): number {
  const max = Math.max(c.r, c.g, c.b);
  const min = Math.min(c.r, c.g, c.b);
  if (max === 0) return 0;
  return (max - min) / max;
}

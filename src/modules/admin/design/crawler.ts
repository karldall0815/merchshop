import * as cheerio from "cheerio";
import { parseColor, luminance, saturation, mix } from "@/lib/theme/colors";
import type { ThemeTokens } from "@/lib/theme";
import { resolveFont } from "./font-similarity";
import { extractImageColors } from "./image-colors";

const MAX_HTML_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_CSS_BYTES = 1 * 1024 * 1024; // 1 MB per stylesheet
const MAX_STYLESHEETS = 12;
const FETCH_TIMEOUT_MS = 8000;

export type CrawlResult = {
  ok: true;
  tokens: ThemeTokens;
  font: string | null;
  logoUrl: string | null;
  note?: string;
};

export class CrawlError extends Error {}

// Block private + loopback IPs to prevent SSRF. Hostname must resolve
// to a public address; we additionally reject literal private IPv4 ranges.
function isPrivateHost(host: string): boolean {
  if (!host) return true;
  if (host === "localhost") return true;
  // IPv4 literal
  const m = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const [a, b] = [+m[1]!, +m[2]!];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
  }
  // IPv6 literal — block all reserved/loopback for now (we don't expect
  // people to crawl IPv6-only public domains via raw address).
  if (host.includes(":")) return true;
  return false;
}

async function fetchWithTimeout(url: string, maxBytes: number): Promise<string> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: "follow",
      headers: {
        "user-agent": "MerchShop-DesignAnalyzer/1.0",
        accept: "text/html, text/css, */*",
      },
    });
    if (!res.ok) throw new CrawlError(`HTTP ${res.status} bei ${url}`);
    const reader = res.body?.getReader();
    if (!reader) throw new CrawlError("Leere Antwort");
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        reader.cancel();
        throw new CrawlError(`Response > ${maxBytes} Bytes`);
      }
      chunks.push(value);
    }
    return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
  } finally {
    clearTimeout(t);
  }
}

const COLOR_RE = /(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\))/g;

function extractColors(css: string): string[] {
  const out: string[] = [];
  for (const m of css.matchAll(COLOR_RE)) {
    out.push(m[1]!.toLowerCase());
  }
  return out;
}

function extractFontFamilies(css: string): string[] {
  const out: string[] = [];
  for (const m of css.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
    const list = m[1]!.split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
    for (const f of list) {
      if (!f) continue;
      // Filter generics
      if (["serif", "sans-serif", "monospace", "system-ui", "inherit", "initial", "unset"].includes(f.toLowerCase())) {
        continue;
      }
      out.push(f);
    }
  }
  return out;
}

function pickPrimary(counts: Map<string, number>): string | null {
  // Sort by frequency desc, then prefer saturated colors that are not
  // near-white or near-black (the page already has those as bg/fg).
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [hex] of sorted) {
    const c = parseColor(hex);
    if (!c) continue;
    const lum = luminance(c);
    const sat = saturation(c);
    if (lum < 0.05 || lum > 0.95) continue; // skip near-black / near-white
    if (sat < 0.25) continue; // skip near-greys
    return normalizeHex(hex);
  }
  return null;
}

function pickBackground(counts: Map<string, number>): string {
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [hex] of sorted) {
    const c = parseColor(hex);
    if (!c) continue;
    if (luminance(c) > 0.85) return normalizeHex(hex);
  }
  return "#ffffff";
}

function pickForeground(counts: Map<string, number>, bg: string): string {
  const bgL = luminance(parseColor(bg) ?? { r: 255, g: 255, b: 255 });
  const wantDark = bgL > 0.5;
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [hex] of sorted) {
    const c = parseColor(hex);
    if (!c) continue;
    const l = luminance(c);
    if (wantDark && l < 0.2) return normalizeHex(hex);
    if (!wantDark && l > 0.8) return normalizeHex(hex);
  }
  return wantDark ? "#0a0a0a" : "#fafafa";
}

function normalizeHex(input: string): string {
  const c = parseColor(input);
  if (!c) return input;
  return `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// Walk the parsed font-family declarations and try each one against the
// whitelist + alias table. Also re-uses categoryFromFallbackChain via
// resolveFont when no exact name matches.
function matchFont(families: string[], declarations: string[]): { font: string | null; similar: boolean } {
  const seen = new Map<string, number>();
  for (const f of families) {
    seen.set(f, (seen.get(f) ?? 0) + 1);
  }
  const ordered = [...seen.entries()].sort((a, b) => b[1] - a[1]);
  for (const [f] of ordered) {
    const r = resolveFont(f);
    if (r.font) return r;
  }
  // No single name matched — try the full declarations (with sans-serif
  // fallback markers) so we at least get a category-default.
  for (const d of declarations) {
    const r = resolveFont(d);
    if (r.font) return r;
  }
  return { font: null, similar: false };
}

// Capture the full `font-family: …` declarations too (not just split
// names) so resolveFont can read the generic fallback marker.
function extractFontDeclarations(css: string): string[] {
  const out: string[] = [];
  for (const m of css.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
    out.push(m[1]!.trim());
  }
  return out;
}

// Collect image URLs whose pixels are worth quantizing: the logo
// candidate plus the largest few <img> tags on the page. Capped so
// we don't fan out to dozens of HTTP requests.
function collectImageCandidates($: cheerio.CheerioAPI, baseUrl: URL, max: number): string[] {
  const out = new Set<string>();
  const logo = extractLogoCandidate($, baseUrl);
  if (logo) out.add(logo);

  // Rank visible <img>s by stated size (width attribute or px in style).
  const ranked: { url: string; score: number }[] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    let abs: string;
    try {
      abs = new URL(src, baseUrl).toString();
    } catch {
      return;
    }
    if (out.has(abs)) return;
    const widthAttr = parseInt($(el).attr("width") ?? "", 10);
    const styleMatch = ($(el).attr("style") ?? "").match(/width\s*:\s*(\d+)/);
    const score = Number.isFinite(widthAttr) ? widthAttr : styleMatch ? +styleMatch[1]! : 64;
    ranked.push({ url: abs, score });
  });
  ranked.sort((a, b) => b.score - a.score);
  for (const r of ranked) {
    if (out.size >= max) break;
    out.add(r.url);
  }
  return [...out];
}

function extractLogoCandidate($: cheerio.CheerioAPI, baseUrl: URL): string | null {
  // Prefer apple-touch-icon at largest size, then any icon-link, then
  // the first <img> with "logo" in src/class/alt.
  const candidates: { href: string; score: number }[] = [];
  $("link[rel*='icon']").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const sizes = $(el).attr("sizes") ?? "";
    const m = sizes.match(/(\d+)x(\d+)/);
    const dim = m ? +m[1]! : $(el).attr("rel")?.includes("apple") ? 180 : 32;
    candidates.push({ href, score: dim });
  });
  $("img").each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    const cls = ($(el).attr("class") ?? "") + " " + ($(el).attr("alt") ?? "");
    if (/logo|brand/i.test(cls) || /logo/i.test(src)) {
      candidates.push({ href: src, score: 100 });
    }
  });
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  try {
    return new URL(candidates[0]!.href, baseUrl).toString();
  } catch {
    return null;
  }
}

export async function analyzeWebsite(rawUrl: string): Promise<CrawlResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new CrawlError("Ungültige URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new CrawlError("Nur http(s) erlaubt");
  }
  if (isPrivateHost(url.hostname)) {
    throw new CrawlError("Interne / lokale Hosts sind nicht erlaubt");
  }

  const html = await fetchWithTimeout(url.toString(), MAX_HTML_BYTES);
  const $ = cheerio.load(html);

  // Inline <style> + linked stylesheets, all merged into one big CSS blob.
  let css = "";
  $("style").each((_, el) => {
    css += "\n" + $(el).html();
  });

  const sheetHrefs: string[] = [];
  $("link[rel='stylesheet']").each((_, el) => {
    const href = $(el).attr("href");
    if (href) sheetHrefs.push(href);
  });
  const limited = sheetHrefs.slice(0, MAX_STYLESHEETS);
  for (const h of limited) {
    let abs: string;
    try {
      abs = new URL(h, url).toString();
    } catch {
      continue;
    }
    try {
      const sheet = await fetchWithTimeout(abs, MAX_CSS_BYTES);
      css += "\n" + sheet;
    } catch {
      // Skip individual sheet failures rather than aborting the whole
      // crawl — many sites have third-party CSS that 404s/rate-limits.
    }
  }

  // Color analysis
  const colorList = extractColors(css);
  const counts = new Map<string, number>();
  for (const c of colorList) {
    const norm = normalizeHex(c);
    if (!parseColor(norm)) continue;
    counts.set(norm, (counts.get(norm) ?? 0) + 1);
  }

  // Image color extraction — modern sites embed their brand color in
  // logo PNGs/SVGs and hero images, not in CSS. We pull from the logo
  // candidate + the first few <img> tags by-size and add the dominant
  // pixels to the count map with a weight of 200 (about as influential
  // as a moderately popular CSS color).
  const imageUrls = collectImageCandidates($, url, 6);
  for (const imgUrl of imageUrls) {
    const colors = await extractImageColors(imgUrl, 5);
    // The first few colors per image are the strongest signal — fade
    // their weight so the logo doesn't drown out CSS entirely.
    let weight = 400;
    for (const hex of colors) {
      counts.set(hex, (counts.get(hex) ?? 0) + weight);
      weight = Math.floor(weight * 0.6);
    }
  }

  if (counts.size === 0) {
    throw new CrawlError(
      "Keine Farbdaten lesbar — Seite nutzt evtl. CSS-in-JS oder erfordert JavaScript.",
    );
  }

  const background = pickBackground(counts);
  const foreground = pickForeground(counts, background);
  const primary = pickPrimary(counts) ?? mix(background, foreground, 0.4);
  // Derive the rest from those three.
  const card = background;
  const muted = mix(background, foreground, 0.05);
  const accent = mix(background, primary, 0.15);
  const border = mix(background, foreground, 0.15);

  const tokens: ThemeTokens = { background, foreground, primary, card, muted, accent, border };

  const fontNames = extractFontFamilies(css);
  const fontDecls = extractFontDeclarations(css);
  const fontMatch = matchFont(fontNames, fontDecls);

  const logoUrl = extractLogoCandidate($, url);

  const notes: string[] = [];
  if (fontMatch.similar && fontMatch.font) {
    notes.push(
      `Original-Schrift nicht frei verfügbar — "${fontMatch.font}" als ähnliche Google-Font gewählt.`,
    );
  } else if (!fontMatch.font && fontNames.length > 0) {
    notes.push(
      `Schriftarten erkannt (${fontNames.slice(0, 3).join(", ")}), aber keine ähnliche Google-Font gefunden.`,
    );
  }
  if (imageUrls.length === 0) {
    notes.push("Keine Logos/Hero-Bilder zur Farbanalyse gefunden.");
  }
  const note = notes.length > 0 ? notes.join(" ") : undefined;
  const font = fontMatch.font;

  return { ok: true, tokens, font, logoUrl, note };
}

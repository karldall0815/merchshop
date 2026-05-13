import sharp from "sharp";
import { parseColor, luminance, saturation } from "@/lib/theme/colors";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 6000;
const SAMPLE_SIZE = 64; // downscale images to NxN for fast quantization

async function fetchImage(url: string): Promise<Buffer> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: { "user-agent": "MerchShop-DesignAnalyzer/1.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type") ?? "";
    if (!/^image\//i.test(ct) && !/svg\+xml/i.test(ct)) {
      throw new Error(`not an image (${ct})`);
    }
    const arr = await res.arrayBuffer();
    if (arr.byteLength > MAX_IMAGE_BYTES) throw new Error(`> ${MAX_IMAGE_BYTES} bytes`);
    return Buffer.from(arr);
  } finally {
    clearTimeout(t);
  }
}

// Quantize a pixel triple to a coarser color bucket — drops the low 4
// bits of each channel so 16M colors collapse to 4096 buckets. Coarse
// enough that JPEG noise / antialiasing don't fragment the histogram.
function bucket(r: number, g: number, b: number): string {
  const rb = r & 0xf0;
  const gb = g & 0xf0;
  const bb = b & 0xf0;
  return `#${[rb, gb, bb].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// Returns the N most common dominant colors in the image, dropping
// near-white, near-black and near-grey (those are usually background
// + outline rather than brand).
export async function extractImageColors(url: string, limit = 5): Promise<string[]> {
  let buf: Buffer;
  try {
    buf = await fetchImage(url);
  } catch {
    return [];
  }

  // Sharp accepts SVG, PNG, JPEG, WebP, AVIF out of the box. We
  // explicitly flatten on a transparent background so PNGs with alpha
  // don't bias the count toward "transparent looks white".
  let raw: { data: Buffer; info: { width: number; height: number; channels: number } };
  try {
    raw = await sharp(buf)
      .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: "cover" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
  } catch {
    return [];
  }

  const counts = new Map<string, number>();
  const { data, info } = raw;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const key = bucket(r, g, b);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Drop boring colors before sorting.
  const interesting: { color: string; count: number }[] = [];
  for (const [color, count] of counts.entries()) {
    const c = parseColor(color);
    if (!c) continue;
    const lum = luminance(c);
    const sat = saturation(c);
    if (lum < 0.04 || lum > 0.96) continue; // near black / white
    if (sat < 0.2 && lum > 0.3 && lum < 0.7) continue; // mid-grey
    interesting.push({ color, count });
  }

  interesting.sort((a, b) => b.count - a.count);
  return interesting.slice(0, limit).map((x) => x.color);
}

import packageJson from "../../package.json";

export const APP_VERSION: string = (packageJson as { version: string }).version;

/**
 * GitHub repo in `owner/repo` form for the upstream-version check.
 * Optional: when unset, the footer shows only the local version and
 * skips the upstream comparison.
 */
export const GITHUB_REPO: string | null = process.env.GITHUB_REPO?.trim() || null;

export interface UpstreamVersion {
  latest: string | null;
  url: string | null;
  error: string | null;
}

/**
 * Fetches the latest release tag from GitHub.
 * Cached for 15 minutes via Next.js fetch cache.
 *
 * Returns nulls on any failure (no token, rate-limit, no releases yet)
 * rather than throwing — the footer is a side-feature and must not
 * break page rendering.
 */
export async function fetchUpstreamVersion(): Promise<UpstreamVersion> {
  if (!GITHUB_REPO) {
    return { latest: null, url: null, error: null };
  }
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 900 },
      },
    );
    if (!res.ok) {
      return { latest: null, url: null, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as { tag_name?: string; html_url?: string };
    const tag = data.tag_name?.replace(/^v/i, "") ?? null;
    return { latest: tag, url: data.html_url ?? null, error: null };
  } catch (err) {
    return {
      latest: null,
      url: null,
      error: err instanceof Error ? err.message : "fetch failed",
    };
  }
}

/**
 * Compare two semver-ish strings ("1.2.3" vs "1.10.0"). Returns
 * true when `b` is strictly newer than `a`. Falls back to string
 * comparison if either side is non-numeric.
 */
export function isNewer(local: string, upstream: string): boolean {
  const lp = local.split(/[.\-+]/).map((x) => Number.parseInt(x, 10));
  const up = upstream.split(/[.\-+]/).map((x) => Number.parseInt(x, 10));
  const len = Math.max(lp.length, up.length);
  for (let i = 0; i < len; i++) {
    const a = lp[i] ?? 0;
    const b = up[i] ?? 0;
    if (Number.isNaN(a) || Number.isNaN(b)) {
      return upstream.localeCompare(local) > 0;
    }
    if (b > a) return true;
    if (b < a) return false;
  }
  return false;
}

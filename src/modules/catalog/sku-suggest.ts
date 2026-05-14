import { db } from "@/lib/db";
import { getGeneralSettings } from "@/modules/admin/general-settings";

// Escape regex special chars in user-configured prefix so we can build a safe
// pattern. Prefix already passes a strict charset check in updateGeneralSettings
// (alphanumeric + - _), so this is defence-in-depth.
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function computeNextSku(prefix: string, padding: number, existing: string[]): string {
  const pattern = new RegExp("^" + escapeRegex(prefix) + "(\\d+)$");
  let max = 0;
  for (const s of existing) {
    const m = s.match(pattern);
    if (!m) continue;
    const n = parseInt(m[1]!, 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  const next = max + 1;
  return `${prefix}${String(next).padStart(padding, "0")}`;
}

/**
 * Build the next-to-suggest SKU based on Setting-defined prefix and padding,
 * looking at existing matching SKUs in the database.
 * Used by /catalog/new to pre-fill the SKU field. The user may edit freely.
 */
export async function getNextSuggestedSku(): Promise<string> {
  const { skuPrefix, skuPadding } = await getGeneralSettings();
  const matches = await db.product.findMany({
    where: { sku: { startsWith: skuPrefix } },
    select: { sku: true },
  });
  return computeNextSku(skuPrefix, skuPadding, matches.map((p) => p.sku));
}

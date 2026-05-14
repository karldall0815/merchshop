"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/modules/auth/session";

export const generalSettingsSchema = z.object({
  skuPrefix: z.string().max(40).regex(/^[A-Za-z0-9_\-]*$/, "Nur Buchstaben, Ziffern, Bindestrich und Unterstrich erlaubt"),
  skuPadding: z.coerce.number().int().min(1).max(12),
});

export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>;

const COST_CENTERS_KEY = "catalog.costCenters";

export const costCentersSchema = z.object({
  items: z.array(z.string().min(1).max(120)).max(500),
});

export type CostCentersInput = z.infer<typeof costCentersSchema>;

export async function getGeneralSettings(): Promise<{ skuPrefix: string; skuPadding: number }> {
  const rows = await db.setting.findMany({
    where: { key: { in: ["catalog.skuPrefix", "catalog.skuPadding"] } },
  });
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  return {
    skuPrefix: byKey.get("catalog.skuPrefix") ?? "ART-",
    skuPadding: Number(byKey.get("catalog.skuPadding") ?? "4"),
  };
}

export async function getCostCenters(): Promise<string[]> {
  const row = await db.setting.findUnique({ where: { key: COST_CENTERS_KEY } });
  if (!row) return [];
  try {
    const parsed: unknown = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  } catch {
    return [];
  }
}

export async function updateCostCenters(raw: CostCentersInput): Promise<ActionResult> {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return fail("PERMISSION_DENIED", "Nicht eingeloggt");
  if (user.role !== "admin") return fail("PERMISSION_DENIED", "Nur Admin darf Grundeinstellungen ändern");

  const parsed = costCentersSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Ungültige Eingabe");
  }

  // Dedupe case-insensitive, trim, drop empties, sort de-locale.
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const raw of parsed.data.items) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(trimmed);
  }
  cleaned.sort((a, b) => a.localeCompare(b, "de"));

  await db.setting.upsert({
    where: { key: COST_CENTERS_KEY },
    create: {
      key: COST_CENTERS_KEY,
      value: JSON.stringify(cleaned),
      encrypted: false,
      updatedBy: user.id,
    },
    update: { value: JSON.stringify(cleaned), updatedBy: user.id },
  });

  await db.auditLog.create({
    data: {
      entity: "Setting",
      entityId: COST_CENTERS_KEY,
      action: "update",
      actorId: user.id,
      diff: { count: cleaned.length },
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/users");
  return ok();
}

export async function updateGeneralSettings(
  raw: GeneralSettingsInput,
): Promise<ActionResult> {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return fail("PERMISSION_DENIED", "Nicht eingeloggt");
  if (user.role !== "admin") return fail("PERMISSION_DENIED", "Nur Admin darf Grundeinstellungen ändern");

  const parsed = generalSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Ungültige Eingabe");
  }
  const data = parsed.data;

  await db.setting.upsert({
    where: { key: "catalog.skuPrefix" },
    create: { key: "catalog.skuPrefix", value: data.skuPrefix, encrypted: false, updatedBy: user.id },
    update: { value: data.skuPrefix, updatedBy: user.id },
  });
  await db.setting.upsert({
    where: { key: "catalog.skuPadding" },
    create: { key: "catalog.skuPadding", value: String(data.skuPadding), encrypted: false, updatedBy: user.id },
    update: { value: String(data.skuPadding), updatedBy: user.id },
  });

  await db.auditLog.create({
    data: {
      entity: "Setting",
      entityId: "catalog.sku",
      action: "update",
      actorId: user.id,
      diff: data as object,
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/catalog/new");
  return ok();
}

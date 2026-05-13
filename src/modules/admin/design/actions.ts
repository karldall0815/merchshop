"use server";

import { revalidatePath } from "next/cache";
import { setSetting } from "@/lib/settings";
import { getCurrentUser } from "@/modules/auth/session";
import { db } from "@/lib/db";
import { getPreset } from "./presets";
import type { ThemeTokens } from "@/lib/theme";

async function requireAdmin() {
  const u = await getCurrentUser();
  if (!u) throw new Error("unauthenticated");
  if (u.role !== "admin") throw new Error("nur admin");
  return u;
}

export async function applyPreset(presetId: string) {
  const actor = await requireAdmin();
  const preset = getPreset(presetId);
  if (!preset) throw new Error(`Preset ${presetId} unbekannt`);
  await setSetting("theme.preset", preset.id, { actorId: actor.id });
  await setSetting("theme.tokens", JSON.stringify(preset.tokens), { actorId: actor.id });
  await setSetting("theme.font", preset.font, { actorId: actor.id });
  await db.auditLog.create({
    data: {
      actorId: actor.id,
      entity: "Theme",
      entityId: preset.id,
      action: "apply_preset",
      diff: { preset: preset.id },
    },
  });
  // Themes affect every page → blanket revalidate.
  revalidatePath("/", "layout");
}

export async function applyCustomTheme(input: {
  tokens: ThemeTokens;
  font: string | null;
  source: string; // URL the crawler analysed
}) {
  const actor = await requireAdmin();
  await setSetting("theme.preset", "custom", { actorId: actor.id });
  await setSetting("theme.tokens", JSON.stringify(input.tokens), { actorId: actor.id });
  await setSetting("theme.font", input.font ?? "", { actorId: actor.id });
  await db.auditLog.create({
    data: {
      actorId: actor.id,
      entity: "Theme",
      entityId: "custom",
      action: "import_from_url",
      diff: { source: input.source, font: input.font, tokens: input.tokens as object },
    },
  });
  revalidatePath("/", "layout");
}

export async function setBrandingLogo(input: { url: string | null; replaceWordmark: boolean }) {
  const actor = await requireAdmin();
  await setSetting("branding.logo", input.url ?? "", { actorId: actor.id });
  await setSetting("branding.replace_wordmark", input.replaceWordmark ? "true" : "false", {
    actorId: actor.id,
  });
  await db.auditLog.create({
    data: {
      actorId: actor.id,
      entity: "Branding",
      entityId: "logo",
      action: "set",
      diff: { logo: input.url, replaceWordmark: input.replaceWordmark },
    },
  });
  revalidatePath("/", "layout");
}

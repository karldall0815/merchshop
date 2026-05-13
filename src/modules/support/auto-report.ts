"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/modules/auth/session";

async function getSettingBool(key: string, fallback: boolean): Promise<boolean> {
  const s = await db.setting.findUnique({ where: { key } });
  if (!s) return fallback;
  return s.value === "true";
}

async function getSettingInt(key: string, fallback: number): Promise<number> {
  const s = await db.setting.findUnique({ where: { key } });
  if (!s) return fallback;
  const n = Number(s.value);
  return Number.isFinite(n) ? n : fallback;
}

export async function reportErrorToSupport(input: {
  url: string;
  userAgent: string;
  digest?: string;
  message?: string;
  stack?: string;
}): Promise<
  | { ok: true; reportId: string; isDuplicate: boolean }
  | { ok: false }
> {
  const enabled = await getSettingBool("support.errorAutoReport", true);
  if (!enabled) return { ok: false };

  const dedupMin = await getSettingInt("support.errorReportDedupeMinutes", 5);
  const user = await getCurrentUser().catch(() => null);
  const reporterId = user?.id ?? null;
  const dedupSince = new Date(Date.now() - dedupMin * 60_000);

  let existing: { id: string } | null = null;
  if (input.digest) {
    existing = await db.supportReport.findFirst({
      where: {
        type: "auto",
        errorDigest: input.digest,
        url: input.url,
        reporterId,
        lastSeenAt: { gte: dedupSince },
      },
      select: { id: true },
    });
  }

  if (existing) {
    await db.supportReport.update({
      where: { id: existing.id },
      data: { count: { increment: 1 }, lastSeenAt: new Date() },
    });
    return { ok: true, reportId: existing.id, isDuplicate: true };
  }

  const created = await db.supportReport.create({
    data: {
      type: "auto",
      reporterId,
      url: input.url,
      userAgent: input.userAgent,
      errorDigest: input.digest,
      errorMessage: input.message,
      errorStack: input.stack,
    },
  });

  return { ok: true, reportId: created.id, isDuplicate: false };
}

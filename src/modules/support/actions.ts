"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/modules/auth/session";
import {
  createSupportReportSchema,
  resolveSupportReportSchema,
  type CreateSupportReportInput,
} from "./schemas";
import { notifyAdminsOfSupportReport } from "./notifications";

async function getSettingBool(key: string, fallback: boolean): Promise<boolean> {
  const s = await db.setting.findUnique({ where: { key } });
  if (!s) return fallback;
  return s.value === "true";
}

export async function createSupportReport(
  raw: CreateSupportReportInput
): Promise<ActionResult<{ reportId: string }>> {
  const parsed = createSupportReportSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingaben."
    );
  }
  const data = parsed.data;
  const user = await getCurrentUser().catch(() => null);

  let report: { id: string };
  if (data.fromAutoReportDigest) {
    const auto = await db.supportReport.findFirst({
      where: {
        type: "auto",
        errorDigest: data.fromAutoReportDigest,
        reporterId: user?.id ?? null,
      },
      orderBy: { lastSeenAt: "desc" },
      select: { id: true },
    });
    if (auto) {
      await db.supportReport.update({
        where: { id: auto.id },
        data: { userMessage: data.description, type: "manual" },
      });
      report = auto;
    } else {
      report = await db.supportReport.create({
        data: {
          type: "manual",
          reporterId: user?.id ?? null,
          url: data.url,
          userAgent: data.userAgent,
          userMessage: data.description,
          errorMessage: data.context,
        },
      });
    }
  } else {
    report = await db.supportReport.create({
      data: {
        type: "manual",
        reporterId: user?.id ?? null,
        url: data.url,
        userAgent: data.userAgent,
        userMessage: data.description,
        errorMessage: data.context,
      },
    });
  }

  const mailEnabled = await getSettingBool("support.notifyAdminsByMail", true);
  if (mailEnabled) {
    Promise.resolve(notifyAdminsOfSupportReport(report.id)).catch(() => {});
  }

  revalidatePath("/admin/support");
  return ok({ reportId: report.id });
}

export async function resolveSupportReport(
  raw: { id: string }
): Promise<ActionResult> {
  const parsed = resolveSupportReportSchema.safeParse(raw);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Ungültige ID");
  const user = await getCurrentUser().catch(() => null);
  if (!user) return fail("PERMISSION_DENIED", "Nicht eingeloggt");

  await db.supportReport.update({
    where: { id: parsed.data.id },
    data: {
      status: "resolved",
      resolvedById: user.id,
      resolvedAt: new Date(),
    },
  });
  revalidatePath("/admin/support");
  return ok();
}

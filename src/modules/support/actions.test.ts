import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    supportReport: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    user: { findMany: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
    setting: { findUnique: vi.fn() },
  },
}));
vi.mock("@/modules/auth/session", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ id: "user-1", role: "requester" }),
}));
vi.mock("@/modules/support/notifications", () => ({
  notifyAdminsOfSupportReport: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createSupportReport, resolveSupportReport } from "./actions";
import { db } from "@/lib/db";
import { notifyAdminsOfSupportReport } from "@/modules/support/notifications";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const m = db as any;

beforeEach(() => {
  for (const k of Object.values(m)) for (const fn of Object.values(k as object)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (fn as any).mockClear === "function") (fn as any).mockClear();
  }
  m.setting.findUnique.mockResolvedValue({ key: "support.notifyAdminsByMail", value: "true" });
  (notifyAdminsOfSupportReport as ReturnType<typeof vi.fn>).mockClear();
});

describe("createSupportReport (manual)", () => {
  it("creates a manual report, returns ok with id", async () => {
    m.supportReport.findFirst.mockResolvedValue(null);
    m.supportReport.create.mockResolvedValue({ id: "rep-x" });
    const res = await createSupportReport({
      description: "Es klappt nicht",
      url: "/orders",
      userAgent: "vitest",
    });
    expect(res).toEqual({ ok: true, data: { reportId: "rep-x" } });
    expect(m.supportReport.create).toHaveBeenCalled();
    expect(notifyAdminsOfSupportReport).toHaveBeenCalledWith("rep-x");
  });

  it("attaches userMessage to existing auto-report when fromAutoReportDigest matches", async () => {
    m.supportReport.findFirst.mockResolvedValue({ id: "rep-auto-1" });
    m.supportReport.update.mockResolvedValue({ id: "rep-auto-1" });
    const res = await createSupportReport({
      description: "Bei mir crasht es",
      fromAutoReportDigest: "abc",
      url: "/orders",
      userAgent: "vitest",
    });
    expect(res).toEqual({ ok: true, data: { reportId: "rep-auto-1" } });
    expect(m.supportReport.update).toHaveBeenCalledWith({
      where: { id: "rep-auto-1" },
      data: { userMessage: "Bei mir crasht es", type: "manual" },
    });
    expect(notifyAdminsOfSupportReport).toHaveBeenCalledWith("rep-auto-1");
  });

  it("returns validation error for empty description", async () => {
    const res = await createSupportReport({ description: "" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("VALIDATION_ERROR");
  });

  it("does not call notifyAdminsOfSupportReport when setting is off", async () => {
    m.setting.findUnique.mockResolvedValue({ key: "support.notifyAdminsByMail", value: "false" });
    m.supportReport.findFirst.mockResolvedValue(null);
    m.supportReport.create.mockResolvedValue({ id: "rep-y" });
    await createSupportReport({ description: "ok" });
    expect(notifyAdminsOfSupportReport).not.toHaveBeenCalled();
  });
});

describe("resolveSupportReport", () => {
  it("sets status=resolved and resolvedBy/At", async () => {
    m.supportReport.update.mockResolvedValue({ id: "rep-z", status: "resolved" });
    const res = await resolveSupportReport({ id: "rep-z" });
    expect(res).toEqual({ ok: true });
    expect(m.supportReport.update).toHaveBeenCalledWith({
      where: { id: "rep-z" },
      data: {
        status: "resolved",
        resolvedById: "user-1",
        resolvedAt: expect.any(Date),
      },
    });
  });
});

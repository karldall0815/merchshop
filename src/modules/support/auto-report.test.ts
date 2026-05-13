import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    setting: { findUnique: vi.fn() },
    supportReport: {
      findFirst: vi.fn(),
      update:    vi.fn(),
      create:    vi.fn(),
    },
  },
}));
vi.mock("@/modules/auth/session", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ id: "user-1" }),
}));

import { reportErrorToSupport } from "./auto-report";
import { db } from "@/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const m = db as any;

beforeEach(() => {
  for (const k of Object.values(m)) for (const fn of Object.values(k as object)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (fn as any).mockClear === "function") (fn as any).mockClear();
  }
  // default: setting "support.errorAutoReport" is true, dedupe=5
  m.setting.findUnique.mockImplementation(({ where }: { where: { key: string } }) => {
    if (where.key === "support.errorAutoReport") return Promise.resolve({ key: where.key, value: "true" });
    if (where.key === "support.errorReportDedupeMinutes") return Promise.resolve({ key: where.key, value: "5" });
    return Promise.resolve(null);
  });
});

describe("reportErrorToSupport", () => {
  it("creates a new report when none in dedupe window", async () => {
    m.supportReport.findFirst.mockResolvedValue(null);
    m.supportReport.create.mockResolvedValue({ id: "rep-1" });
    const res = await reportErrorToSupport({
      url: "/orders/x", userAgent: "vitest", digest: "abc",
    });
    expect(res).toEqual({ ok: true, reportId: "rep-1", isDuplicate: false });
    expect(m.supportReport.create).toHaveBeenCalled();
  });

  it("increments count when a matching report is within dedupe window", async () => {
    m.supportReport.findFirst.mockResolvedValue({ id: "rep-1", count: 1 });
    m.supportReport.update.mockResolvedValue({ id: "rep-1", count: 2 });
    const res = await reportErrorToSupport({
      url: "/orders/x", userAgent: "vitest", digest: "abc",
    });
    expect(res).toEqual({ ok: true, reportId: "rep-1", isDuplicate: true });
    expect(m.supportReport.create).not.toHaveBeenCalled();
    expect(m.supportReport.update).toHaveBeenCalledWith({
      where: { id: "rep-1" },
      data: { count: { increment: 1 }, lastSeenAt: expect.any(Date) },
    });
  });

  it("returns { ok: false } when auto-report is disabled in settings", async () => {
    m.setting.findUnique.mockImplementation(({ where }: { where: { key: string } }) => {
      if (where.key === "support.errorAutoReport") return Promise.resolve({ key: where.key, value: "false" });
      return Promise.resolve(null);
    });
    const res = await reportErrorToSupport({ url: "/x", userAgent: "v", digest: "d" });
    expect(res).toEqual({ ok: false });
    expect(m.supportReport.create).not.toHaveBeenCalled();
  });

  it("does not dedupe when no digest is provided", async () => {
    m.supportReport.create.mockResolvedValue({ id: "rep-2" });
    const res = await reportErrorToSupport({ url: "/x", userAgent: "v" });
    expect(res).toEqual({ ok: true, reportId: "rep-2", isDuplicate: false });
    expect(m.supportReport.findFirst).not.toHaveBeenCalled();
  });
});

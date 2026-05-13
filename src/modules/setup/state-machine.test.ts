import { describe, expect, it, vi, beforeEach } from "vitest";
import { nextStep, isInstalled, canEnterStep } from "./state-machine";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: {
    systemSetup: {
      findUnique: vi.fn(),
    },
    setting: { findUnique: vi.fn() },
    user: { count: vi.fn() },
  },
}));

const dbMock = db as unknown as {
  systemSetup: { findUnique: ReturnType<typeof vi.fn> };
  setting: { findUnique: ReturnType<typeof vi.fn> };
  user: { count: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  dbMock.systemSetup.findUnique.mockReset();
  dbMock.setting.findUnique.mockReset();
  dbMock.user.count.mockReset();
  for (const v of [
    "S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY", "S3_SECRET_KEY",
    "RESEND_API_KEY", "SMTP_HOST", "DHL_API_KEY",
  ]) delete process.env[v];
});

describe("isInstalled", () => {
  it("returns false when installedAt is null", async () => {
    dbMock.systemSetup.findUnique.mockResolvedValue({ id: 1, installedAt: null });
    expect(await isInstalled()).toBe(false);
  });
  it("returns true when installedAt is set", async () => {
    dbMock.systemSetup.findUnique.mockResolvedValue({ id: 1, installedAt: new Date() });
    expect(await isInstalled()).toBe(true);
  });
  it("returns false when no row yet", async () => {
    dbMock.systemSetup.findUnique.mockResolvedValue(null);
    expect(await isInstalled()).toBe(false);
  });
});

describe("nextStep", () => {
  it("returns first required step that is not complete", async () => {
    dbMock.systemSetup.findUnique.mockResolvedValue({ id: 1, currentStep: "welcome" });
    dbMock.setting.findUnique.mockResolvedValue(null);
    dbMock.user.count.mockResolvedValue(0);
    expect(await nextStep()).toBe("branding");
  });
  it("skips storage when fully provided by ENV", async () => {
    dbMock.systemSetup.findUnique.mockResolvedValue({ id: 1, currentStep: "admin" });
    process.env.S3_ENDPOINT = "x";
    process.env.S3_BUCKET = "x";
    process.env.S3_ACCESS_KEY = "x";
    process.env.S3_SECRET_KEY = "x";
    dbMock.setting.findUnique.mockImplementation(({ where }: { where: { key: string } }) =>
      where.key === "branding.appName" ? { value: "x" } : null,
    );
    dbMock.user.count.mockResolvedValue(1);
    expect(await nextStep()).toBe("email");
  });
  it("does NOT skip storage when only some S3 env vars are set (envVarsMatch=all)", async () => {
    dbMock.systemSetup.findUnique.mockResolvedValue({ id: 1, currentStep: "admin" });
    process.env.S3_ENDPOINT = "x";
    // intentionally leave S3_BUCKET / S3_ACCESS_KEY / S3_SECRET_KEY unset
    dbMock.setting.findUnique.mockImplementation(({ where }: { where: { key: string } }) =>
      where.key === "branding.appName" ? { value: "x" } : null,
    );
    dbMock.user.count.mockResolvedValue(1);
    expect(await nextStep()).toBe("storage");
  });
  it("skips email when EITHER provider env var is set (envVarsMatch=any)", async () => {
    dbMock.systemSetup.findUnique.mockResolvedValue({ id: 1, currentStep: "admin" });
    process.env.RESEND_API_KEY = "rk_test";
    // SMTP_HOST unset — "any" semantics should still satisfy
    dbMock.setting.findUnique.mockImplementation(({ where }: { where: { key: string } }) =>
      where.key === "branding.appName" || where.key === "storage.bucket"
        ? { value: "x" } : null,
    );
    dbMock.user.count.mockResolvedValue(1);
    expect(await nextStep()).toBe("review");
  });
});

describe("canEnterStep", () => {
  it("rejects entering review before required steps are complete", async () => {
    dbMock.systemSetup.findUnique.mockResolvedValue({ id: 1, currentStep: "welcome" });
    dbMock.setting.findUnique.mockResolvedValue(null);
    dbMock.user.count.mockResolvedValue(0);
    expect(await canEnterStep("review")).toBe(false);
  });
  it("allows entering the current next step", async () => {
    dbMock.systemSetup.findUnique.mockResolvedValue({ id: 1, currentStep: "welcome" });
    dbMock.setting.findUnique.mockResolvedValue(null);
    dbMock.user.count.mockResolvedValue(0);
    expect(await canEnterStep("branding")).toBe(true);
  });
});

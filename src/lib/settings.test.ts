import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSetting, isSettingFromEnv, setSetting } from "./settings";
import { db } from "./db";

vi.mock("./db", () => ({
  db: {
    setting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

const dbMock = db as unknown as {
  setting: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
};

describe("settings", () => {
  beforeEach(() => {
    dbMock.setting.findUnique.mockReset();
    dbMock.setting.upsert.mockReset();
    delete process.env.S3_BUCKET;
  });
  afterEach(() => {
    delete process.env.S3_BUCKET;
  });

  it("returns ENV value when present, bypassing DB", async () => {
    process.env.S3_BUCKET = "from-env";
    dbMock.setting.findUnique.mockResolvedValue({
      key: "storage.bucket",
      value: "from-db",
      encrypted: false,
    });
    const v = await getSetting("storage.bucket", { envVar: "S3_BUCKET" });
    expect(v).toBe("from-env");
    expect(dbMock.setting.findUnique).not.toHaveBeenCalled();
  });

  it("falls back to DB when ENV is unset", async () => {
    dbMock.setting.findUnique.mockResolvedValue({
      key: "storage.bucket",
      value: "from-db",
      encrypted: false,
    });
    const v = await getSetting("storage.bucket", { envVar: "S3_BUCKET" });
    expect(v).toBe("from-db");
  });

  it("decrypts when encrypted flag is true", async () => {
    const { encryptSetting, deriveSettingKey } = await import("./crypto");
    const secret = "test-next-auth-secret-with-enough-entropy-1234";
    process.env.NEXTAUTH_SECRET = secret;
    const ct = encryptSetting("plain", deriveSettingKey(secret));
    dbMock.setting.findUnique.mockResolvedValue({
      key: "smtp.password",
      value: ct,
      encrypted: true,
    });
    const v = await getSetting("smtp.password");
    expect(v).toBe("plain");
  });

  it("isSettingFromEnv reports correctly", () => {
    process.env.S3_BUCKET = "from-env";
    expect(isSettingFromEnv({ envVar: "S3_BUCKET" })).toBe(true);
    delete process.env.S3_BUCKET;
    expect(isSettingFromEnv({ envVar: "S3_BUCKET" })).toBe(false);
  });

  it("setSetting encrypts when requested", async () => {
    process.env.NEXTAUTH_SECRET = "test-next-auth-secret-with-enough-entropy-1234";
    dbMock.setting.upsert.mockResolvedValue({});
    await setSetting("smtp.password", "secret-value", { encrypt: true, actorId: "u1" });
     
    const call = dbMock.setting.upsert.mock.calls[0]![0];
    expect(call.create.encrypted).toBe(true);
    expect(call.create.value).not.toBe("secret-value");
    expect(call.create.updatedBy).toBe("u1");
  });
});

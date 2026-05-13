import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    setting: { upsert: vi.fn().mockResolvedValue({}), findUnique: vi.fn().mockResolvedValue(null) },
    systemSetup: {
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
      upsert: vi.fn().mockResolvedValue({}),
    },
    user: {
      create: vi.fn().mockResolvedValue({ id: "u1" }),
      count: vi.fn().mockResolvedValue(0),
    },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

// next/navigation.redirect() throws NEXT_REDIRECT in real Next runtimes to
// abort rendering. In vitest the production runtime isn't present, so we
// stub it to a thrown sentinel and the tests catch around it.
class TestRedirect extends Error {
  constructor(public url: string) {
    super(`NEXT_REDIRECT:${url}`);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new TestRedirect(url);
  },
}));

async function runExpectingRedirect(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof TestRedirect) return e.url;
    throw e;
  }
  throw new Error("expected a redirect, none thrown");
}

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-next-auth-secret-with-enough-entropy-1234";
});

import { submitBranding, submitAdmin } from "./actions";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbMock = db as any;

describe("submitBranding", () => {
  it("persists app name and primary color, then redirects to next step", async () => {
    const url = await runExpectingRedirect(() =>
      submitBranding({ appName: "MerchShop", primaryColor: "#112233" }),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calls = dbMock.setting.upsert.mock.calls.map((c: any[]) => c[0].create.key);
    expect(calls).toContain("branding.appName");
    expect(calls).toContain("branding.primaryColor");
    expect(url).toMatch(/^\/setup\//);
  });

  it("rejects empty appName", async () => {
    await expect(submitBranding({ appName: "", primaryColor: "#000000" })).rejects.toThrow();
  });
});

describe("submitAdmin", () => {
  it("creates an admin user with hashed password, then redirects", async () => {
    await runExpectingRedirect(() =>
      submitAdmin({
        name: "Alice",
        email: "alice@example.test",
        password: "supersecure-12345",
      }),
    );
    expect(dbMock.user.create).toHaveBeenCalled();
    const created = dbMock.user.create.mock.calls[0][0].data;
    expect(created.role).toBe("admin");
    expect(created.passwordHash).not.toBe("supersecure-12345");
    expect(created.passwordHash.startsWith("$argon2id$")).toBe(true);
  });
});

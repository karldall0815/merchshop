import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./hash";

describe("password hash", () => {
  it("verifies a correct password", async () => {
    const h = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPassword(h, "correct-horse-battery-staple")).toBe(true);
  });
  it("rejects an incorrect password", async () => {
    const h = await hashPassword("a");
    expect(await verifyPassword(h, "b")).toBe(false);
  });
  it("produces argon2id output", async () => {
    const h = await hashPassword("x");
    expect(h.startsWith("$argon2id$")).toBe(true);
  });
});

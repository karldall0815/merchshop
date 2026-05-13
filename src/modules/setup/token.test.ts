import { describe, expect, it, beforeEach } from "vitest";
import { signSetupToken, verifySetupToken, TOKEN_TTL_MS } from "./token";

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-next-auth-secret-with-enough-entropy-1234";
});

describe("setup token", () => {
  it("verifies a freshly signed token", () => {
    const token = signSetupToken("session-123");
    expect(verifySetupToken(token, "session-123")).toBe(true);
  });

  it("rejects a token signed for a different session", () => {
    const token = signSetupToken("session-A");
    expect(verifySetupToken(token, "session-B")).toBe(false);
  });

  it("rejects a tampered token", () => {
    const token = signSetupToken("s1");
    const tampered = token.slice(0, -2) + "AA";
    expect(verifySetupToken(tampered, "s1")).toBe(false);
  });

  it("rejects an expired token", () => {
    const token = signSetupToken("s1", Date.now() - TOKEN_TTL_MS - 1);
    expect(verifySetupToken(token, "s1")).toBe(false);
  });
});

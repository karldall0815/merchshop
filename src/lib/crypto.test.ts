import { describe, expect, it } from "vitest";
import { decryptSetting, deriveSettingKey, encryptSetting } from "./crypto";

const secret = "test-next-auth-secret-with-enough-entropy-1234";

describe("crypto", () => {
  it("round-trips a plaintext value", () => {
    const key = deriveSettingKey(secret);
    const ciphertext = encryptSetting("hello world", key);
    expect(ciphertext).not.toContain("hello");
    expect(decryptSetting(ciphertext, key)).toBe("hello world");
  });

  it("produces different ciphertexts for the same input (random IV)", () => {
    const key = deriveSettingKey(secret);
    const a = encryptSetting("same", key);
    const b = encryptSetting("same", key);
    expect(a).not.toBe(b);
    expect(decryptSetting(a, key)).toBe("same");
    expect(decryptSetting(b, key)).toBe("same");
  });

  it("rejects tampered ciphertext", () => {
    const key = deriveSettingKey(secret);
    const ciphertext = encryptSetting("secret", key);
    const tampered = ciphertext.slice(0, -2) + "AA";
    expect(() => decryptSetting(tampered, key)).toThrow();
  });
});

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;
const SALT = Buffer.from("merchshop-setting-v1");
const INFO = Buffer.from("setting-encryption");

export function deriveSettingKey(masterSecret: string): Buffer {
  const ikm = Buffer.from(masterSecret, "utf8");
  return Buffer.from(hkdfSync("sha256", ikm, SALT, INFO, KEY_LEN));
}

export function encryptSetting(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decryptSetting(payload: string, key: Buffer): string {
  const buf = Buffer.from(payload, "base64");
  if (buf.length < IV_LEN + TAG_LEN + 1) throw new Error("ciphertext too short");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

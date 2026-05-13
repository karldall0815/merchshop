import { createHmac, timingSafeEqual } from "node:crypto";

export const TOKEN_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours

function hmac(payload: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET not set");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function signSetupToken(sessionId: string, issuedAt = Date.now()): string {
  const payload = `${sessionId}.${issuedAt}`;
  const sig = hmac(payload);
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifySetupToken(token: string, expectedSession: string): boolean {
  const dotIdx = token.indexOf(".");
  if (dotIdx === -1) return false;
  const payloadB64 = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!payloadB64 || !sig) return false;
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return false;
  }
  const innerDot = payload.indexOf(".");
  if (innerDot === -1) return false;
  const sessionId = payload.slice(0, innerDot);
  const issuedAtStr = payload.slice(innerDot + 1);
  if (sessionId !== expectedSession) return false;
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > TOKEN_TTL_MS) return false;
  const expected = hmac(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

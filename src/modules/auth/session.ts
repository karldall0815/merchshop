import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";

export type SessionUser = { id: string; email: string; name: string; role: string };

// NextAuth v5 chunks large JWEs across cookies: `<base>`, `<base>.0`, `<base>.1`, …
// The HKDF salt used for decryption is the *base* cookie name, so we must use
// whichever variant is actually present (`__Secure-` prefixed on https, plain
// on http). Picking the wrong salt yields `null` silently.
const COOKIE_NAMES = ["__Secure-authjs.session-token", "authjs.session-token"] as const;

type ReadResult = { token: string; salt: string };

function readSessionToken(jar: Awaited<ReturnType<typeof cookies>>): ReadResult | null {
  for (const base of COOKIE_NAMES) {
    const root = jar.get(base)?.value;
    if (root) return { token: root, salt: base };
    const chunks: string[] = [];
    for (let i = 0; ; i++) {
      const chunk = jar.get(`${base}.${i}`)?.value;
      if (!chunk) break;
      chunks.push(chunk);
    }
    if (chunks.length > 0) return { token: chunks.join(""), salt: base };
  }
  return null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const found = readSessionToken(jar);
  if (!found) return null;

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  let payload: Awaited<ReturnType<typeof decode>>;
  try {
    payload = await decode({ token: found.token, secret, salt: found.salt });
  } catch {
    return null;
  }
  if (!payload) return null;

  const uid = (payload as { uid?: string }).uid;
  if (!uid) return null;

  return {
    id: uid,
    email: (payload as { email?: string }).email ?? "",
    name: (payload as { name?: string }).name ?? "",
    role: (payload as { role?: string }).role ?? "requester",
  };
}

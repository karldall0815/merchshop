import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "./hash";

// Argon2-Hash eines zufälligen Wegwerf-Passworts, gegen den ein Dummy-Verify
// gerechnet wird, wenn der angegebene User nicht existiert. Verhindert
// E-Mail-Enumeration über Timing-Differenzen (~80–120 ms pro Argon2-Verify).
// Lazy-initialisiert beim ersten "User not found"-Treffer und danach gecached.
let dummyHashPromise: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword(
      "dummy-" + Math.random().toString(36) + "-" + Date.now(),
    );
  }
  return dummyHashPromise;
}

// `identifier` accepts either an email address or a display name. Phase 1
// doesn't model a dedicated username column — name collisions are theoretically
// possible but the current setup has one admin user. Phase 2 should either add
// a unique-username column or require name uniqueness at the schema level.
const credentialsSchema = z.object({
  identifier: z.string().min(1).max(160),
  password: z.string().min(1),
});

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "E-Mail oder Benutzername", type: "text" },
        password: { label: "Passwort", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { identifier, password } = parsed.data;
        const user = await db.user.findFirst({
          where: { OR: [{ email: identifier }, { name: identifier }] },
        });
        // Konstant-Zeit-Pfad: auch bei unbekanntem/inaktivem User wird ein
        // Argon2-Verify gegen einen Dummy-Hash gerechnet, damit die Antwortzeit
        // identisch ist und keine User-Enumeration möglich wird.
        if (!user || !user.active) {
          await verifyPassword(await getDummyHash(), password);
          return null;
        }
        if (!(await verifyPassword(user.passwordHash, password))) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role as string };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.uid = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as { id?: string }).id = token.uid as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

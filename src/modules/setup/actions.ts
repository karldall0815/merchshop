"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { setSetting } from "@/lib/settings";
import { hashPassword } from "@/modules/auth/hash";
import { isInstalled, nextStep } from "./state-machine";
import { testS3 } from "./tests/s3";
import { testMail } from "./tests/mail";
import { randomBytes } from "node:crypto";
import type { Role } from "@prisma/client";

async function ensureSetupAllowed() {
  if (await isInstalled() && process.env.ALLOW_SETUP_REINIT !== "true") {
    throw new Error("setup already completed");
  }
}

// Compute the next pending step and persist it on the singleton SystemSetup row.
// upsert (not update) so fresh containers don't depend on prisma db seed.
async function persistNextStep(): Promise<string> {
  const step = await nextStep();
  await db.systemSetup.upsert({
    where: { id: 1 },
    update: { currentStep: step },
    create: { id: 1, currentStep: step },
  });
  return step;
}

// Default end-of-action: persist progress and force a server-side redirect so
// the browser actually navigates. router.push("/setup") from a client step
// component doesn't always fire a fresh render in Next 16, so we drive
// navigation from the server here.
async function advanceToNextStep(): Promise<never> {
  const step = await persistNextStep();
  redirect(`/setup/${step}`);
}

const brandingSchema = z.object({
  appName: z.string().min(1).max(80),
  subtitle: z.string().max(160).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logoUrl: z.string().url().optional(),
  publicAppUrl: z.string().url().optional(),
});

export async function submitBranding(raw: unknown) {
  await ensureSetupAllowed();
  const data = brandingSchema.parse(raw);
  await setSetting("branding.appName", data.appName);
  await setSetting("branding.primaryColor", data.primaryColor);
  if (data.subtitle) await setSetting("branding.subtitle", data.subtitle);
  if (data.logoUrl) await setSetting("branding.logoUrl", data.logoUrl);
  if (data.publicAppUrl) await setSetting("branding.publicAppUrl", data.publicAppUrl);
  await advanceToNextStep();
}

const adminSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(12),
});

export async function submitAdmin(raw: unknown) {
  await ensureSetupAllowed();
  const data = adminSchema.parse(raw);
  const passwordHash = await hashPassword(data.password);
  await db.user.create({
    data: { name: data.name, email: data.email, passwordHash, role: "admin" },
  });
  await advanceToNextStep();
}

const storageSchema = z.object({
  endpoint: z.string().url(),
  region: z.string().min(1),
  bucket: z.string().min(1),
  accessKey: z.string().min(1),
  secretKey: z.string().min(1),
  forcePathStyle: z.boolean().optional(),
});

// TODO(phase-2): wrap the multi-setSetting sequence in a Prisma $transaction
// to avoid leaving partial storage config on crash mid-write.
export async function submitStorage(raw: unknown) {
  await ensureSetupAllowed();
  const data = storageSchema.parse(raw);
  const result = await testS3(data);
  if (!result.ok) throw new Error(`S3-Test fehlgeschlagen: ${result.error}`);
  await setSetting("storage.endpoint", data.endpoint);
  await setSetting("storage.region", data.region);
  await setSetting("storage.bucket", data.bucket);
  await setSetting("storage.accessKey", data.accessKey, { encrypt: true });
  await setSetting("storage.secretKey", data.secretKey, { encrypt: true });
  await setSetting("storage.forcePathStyle", String(!!data.forcePathStyle));
  await advanceToNextStep();
}

const emailSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("resend"), apiKey: z.string().min(1), from: z.string().email() }),
  z.object({
    mode: z.literal("smtp"),
    host: z.string().min(1), port: z.number().int().min(1).max(65535),
    user: z.string().optional(), password: z.string().optional(),
    secure: z.boolean().optional(), from: z.string().email(),
  }),
  z.object({ mode: z.literal("later") }),
]);

// TODO(phase-2): wrap the multi-setSetting sequence in a Prisma $transaction.
export async function submitEmail(raw: unknown, testRecipient?: string) {
  await ensureSetupAllowed();
  const data = emailSchema.parse(raw);
  if (data.mode !== "later" && testRecipient) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await testMail({ ...data, to: testRecipient } as any);
    if (!res.ok) throw new Error(`Mail-Test fehlgeschlagen: ${res.error}`);
  }
  await setSetting("email.mode", data.mode);
  if (data.mode === "resend") {
    await setSetting("email.apiKey", data.apiKey, { encrypt: true });
    await setSetting("email.from", data.from);
  } else if (data.mode === "smtp") {
    await setSetting("email.host", data.host);
    await setSetting("email.port", String(data.port));
    if (data.user) await setSetting("email.user", data.user);
    if (data.password) await setSetting("email.password", data.password, { encrypt: true });
    await setSetting("email.secure", String(!!data.secure));
    await setSetting("email.from", data.from);
  }
  await advanceToNextStep();
}

const shippingSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.union([z.literal("sandbox"), z.literal("production")]),
    apiKey: z.string().min(1), user: z.string().min(1), password: z.string().min(1),
    accountNumber: z.string().min(1),
    senderName: z.string().min(1), senderStreet: z.string().min(1),
    senderZip: z.string().min(1), senderCity: z.string().min(1), senderCountry: z.string().min(2),
  }),
  z.object({ mode: z.literal("later") }),
]);

export async function submitShipping(raw: unknown) {
  await ensureSetupAllowed();
  const data = shippingSchema.parse(raw);
  await setSetting("shipping.mode", data.mode);
  if (data.mode !== "later") {
    await setSetting("shipping.apiKey", data.apiKey, { encrypt: true });
    await setSetting("shipping.user", data.user, { encrypt: true });
    await setSetting("shipping.password", data.password, { encrypt: true });
    await setSetting("shipping.accountNumber", data.accountNumber);
    await setSetting("shipping.sender", JSON.stringify({
      name: data.senderName, street: data.senderStreet,
      zip: data.senderZip, city: data.senderCity, country: data.senderCountry,
    }));
  }
  await advanceToNextStep();
}

const defaultsSchema = z.object({
  costCenters: z.array(z.string().min(1)).default([]),
  defaultMinStock: z.number().int().min(0).default(0),
  approvalPolicy: z.enum(["always", "by-quantity", "by-value"]).default("always"),
  approvalThreshold: z.number().int().min(0).optional(),
});

export async function submitDefaults(raw: unknown) {
  await ensureSetupAllowed();
  const data = defaultsSchema.parse(raw);
  await setSetting("defaults.costCenters", JSON.stringify(data.costCenters));
  await setSetting("defaults.minStock", String(data.defaultMinStock));
  await setSetting("defaults.approvalPolicy", data.approvalPolicy);
  if (data.approvalThreshold !== undefined) {
    await setSetting("defaults.approvalThreshold", String(data.approvalThreshold));
  }
  await advanceToNextStep();
}

const usersSchema = z.object({
  users: z.array(z.object({
    role: z.enum(["agentur", "approver", "requester"]),
    name: z.string().min(1), email: z.string().email(),
  })).default([]),
});

// Created accounts are only reachable via the temporary password returned here
// — there is no password-reset flow in Phase 1 yet. The wizard UI is expected
// to display these credentials once on the next screen so the admin can hand
// them over out-of-band. A magic-link / reset-email flow lands in a later phase.
export type ProvisionedUser = { email: string; tempPassword: string };

// Unlike the other steps, submitUsers does NOT redirect server-side — the
// caller needs the provisioned temp passwords back so the wizard UI can
// display them once. Navigation is left to the client (UsersStep advances
// after the admin has seen the credentials).
export async function submitUsers(raw: unknown): Promise<ProvisionedUser[]> {
  await ensureSetupAllowed();
  const data = usersSchema.parse(raw);
  const provisioned: ProvisionedUser[] = [];
  for (const u of data.users) {
    const tempPassword = randomBytes(16).toString("base64url");
    const passwordHash = await hashPassword(tempPassword);
    await db.user.create({ data: { name: u.name, email: u.email, role: u.role as Role, passwordHash } });
    provisioned.push({ email: u.email, tempPassword });
  }
  await persistNextStep();
  return provisioned;
}

export async function completeSetup(): Promise<never> {
  await ensureSetupAllowed();
  const next = await nextStep();
  if (next !== "review") throw new Error(`cannot complete: still on step ${next}`);
  await db.systemSetup.upsert({
    where: { id: 1 },
    update: { installedAt: new Date(), currentStep: "review", setupToken: null, tokenExpiresAt: null },
    create: { id: 1, installedAt: new Date(), currentStep: "review" },
  });
  await db.auditLog.create({
    data: { entity: "SystemSetup", entityId: "1", action: "installed", diff: {} },
  });
  (await cookies()).set("merchshop_installed", "1", {
    httpOnly: false, path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/login");
}

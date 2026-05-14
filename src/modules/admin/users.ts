"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, Role } from "@prisma/client";
import { getCurrentUser } from "@/modules/auth/session";
import { hashPassword } from "@/modules/auth/hash";

const roleEnum = z.nativeEnum(Role);

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");
  if (user.role !== "admin") throw new Error("nur admin");
  return user;
}

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(120),
  role: roleEnum,
  password: z.string().min(10).max(200),
});

export async function listUsers() {
  await requireAdmin();
  return db.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      defaultCostCenter: true,
      createdAt: true,
    },
  });
}

export async function createUser(input: z.input<typeof createSchema>) {
  const actor = await requireAdmin();
  const data = createSchema.parse(input);
  const passwordHash = await hashPassword(data.password);
  const u = await db.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name.trim(),
      role: data.role,
      passwordHash,
      active: true,
    },
  });
  await db.auditLog.create({
    data: {
      actorId: actor.id,
      entity: "User",
      entityId: u.id,
      action: "create",
      diff: { email: u.email, name: u.name, role: u.role },
    },
  });
  revalidatePath("/admin/users");
  return { id: u.id };
}

export async function updateUserRole(userId: string, role: Role) {
  const actor = await requireAdmin();
  const before = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!before) throw new Error("User existiert nicht");
  await db.user.update({ where: { id: userId }, data: { role } });
  await db.auditLog.create({
    data: {
      actorId: actor.id,
      entity: "User",
      entityId: userId,
      action: "role_change",
      diff: { from: before.role, to: role },
    },
  });
  revalidatePath("/admin/users");
}

export async function setUserActive(userId: string, active: boolean) {
  const actor = await requireAdmin();
  if (userId === actor.id && !active) throw new Error("Eigenen Account nicht deaktivieren");
  await db.user.update({ where: { id: userId }, data: { active } });
  await db.auditLog.create({
    data: {
      actorId: actor.id,
      entity: "User",
      entityId: userId,
      action: active ? "activate" : "deactivate",
      diff: { active },
    },
  });
  revalidatePath("/admin/users");
}

const defaultCostCenterSchema = z.object({
  userId: z.string().min(1),
  defaultCostCenter: z.string().max(120).optional().nullable(),
});

export async function updateUserDefaultCostCenter(
  input: z.input<typeof defaultCostCenterSchema>,
) {
  const actor = await requireAdmin();
  const data = defaultCostCenterSchema.parse(input);
  const before = await db.user.findUnique({
    where: { id: data.userId },
    select: { defaultCostCenter: true },
  });
  if (!before) throw new Error("User existiert nicht");
  const next = data.defaultCostCenter?.trim() || null;
  await db.user.update({
    where: { id: data.userId },
    data: { defaultCostCenter: next },
  });
  await db.auditLog.create({
    data: {
      actorId: actor.id,
      entity: "User",
      entityId: data.userId,
      action: "update_default_cost_center",
      diff: { from: before.defaultCostCenter, to: next },
    },
  });
  revalidatePath("/admin/users");
}

const updateUserSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(2).max(120),
  role: roleEnum,
  defaultCostCenter: z.string().max(120).optional().nullable(),
  newPassword: z.string().max(200).optional().nullable(),
});

export async function updateUser(input: z.input<typeof updateUserSchema>) {
  const actor = await requireAdmin();
  const data = updateUserSchema.parse(input);

  const before = await db.user.findUnique({
    where: { id: data.userId },
    select: { email: true, name: true, role: true, defaultCostCenter: true },
  });
  if (!before) throw new Error("User existiert nicht");

  const nextEmail = data.email.toLowerCase().trim();
  const nextName = data.name.trim();
  const nextCostCenter = data.defaultCostCenter?.trim() || null;
  const passwordToSet = data.newPassword?.trim() || "";

  if (passwordToSet && passwordToSet.length < 10) {
    throw new Error("Passwort zu kurz (min. 10)");
  }

  if (nextEmail !== before.email) {
    const collision = await db.user.findUnique({
      where: { email: nextEmail },
      select: { id: true },
    });
    if (collision && collision.id !== data.userId) {
      throw new Error("E-Mail bereits vergeben");
    }
  }

  const updates: Prisma.UserUpdateInput = {
    email: nextEmail,
    name: nextName,
    role: data.role,
    defaultCostCenter: nextCostCenter,
  };
  if (passwordToSet) {
    updates.passwordHash = await hashPassword(passwordToSet);
  }

  await db.user.update({ where: { id: data.userId }, data: updates });

  const diff: Record<string, unknown> = {};
  if (nextEmail !== before.email) diff.email = { from: before.email, to: nextEmail };
  if (nextName !== before.name) diff.name = { from: before.name, to: nextName };
  if (data.role !== before.role) diff.role = { from: before.role, to: data.role };
  if (nextCostCenter !== before.defaultCostCenter) {
    diff.defaultCostCenter = { from: before.defaultCostCenter, to: nextCostCenter };
  }
  if (passwordToSet) diff.passwordReset = true;

  if (Object.keys(diff).length > 0) {
    await db.auditLog.create({
      data: {
        actorId: actor.id,
        entity: "User",
        entityId: data.userId,
        action: "update",
        diff: diff as Prisma.InputJsonValue,
      },
    });
  }

  revalidatePath("/admin/users");
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const actor = await requireAdmin();
  if (newPassword.length < 10) throw new Error("Passwort zu kurz (min. 10)");
  const passwordHash = await hashPassword(newPassword);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
  await db.auditLog.create({
    data: {
      actorId: actor.id,
      entity: "User",
      entityId: userId,
      action: "password_reset",
      diff: {},
    },
  });
  revalidatePath("/admin/users");
}

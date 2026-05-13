"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { categoryCreateSchema, categoryUpdateSchema, type CategoryCreateInput, type CategoryUpdateInput } from "./schemas";
import type { AttributeSchemaItem } from "./defaults";
import { ok, fail, type ActionResult } from "@/lib/action-result";

type AffectedProduct = { id: string; sku: string; name: string };

export async function createCategory(
  raw: CategoryCreateInput,
  actorId: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = categoryCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Ungültige Eingabe");
  }
  const data = parsed.data;
  const cat = await db.category.create({
    data: {
      slug: data.slug,
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder,
      attributeSchema: data.attributeSchema as object,
      variantTemplate: (data.variantTemplate as object | null) ?? undefined,
      isBuiltin: false,
      createdById: actorId,
    },
  });
  await db.auditLog.create({
    data: { entity: "Category", entityId: cat.id, action: "create", actorId, diff: data as object },
  });
  revalidatePath("/admin/categories");
  return ok({ id: cat.id });
}

export async function updateCategory(
  raw: CategoryUpdateInput,
  actorId: string,
): Promise<
  | { status: "ok"; id: string }
  | { status: "needs_confirmation"; removedKeys: string[]; affectedProducts: AffectedProduct[] }
> {
  const data = categoryUpdateSchema.parse(raw);

  const before = await db.category.findUnique({ where: { id: data.id } });
  if (!before) throw new Error("Category not found");

  const beforeSchema = (before.attributeSchema as unknown as AttributeSchemaItem[]) ?? [];
  const removedKeys = beforeSchema
    .map((s) => s.key)
    .filter((k) => !data.attributeSchema.some((n) => n.key === k));

  if (removedKeys.length > 0 && !data.confirmAffectedProducts) {
    const affected: AffectedProduct[] = [];
    for (const key of removedKeys) {
      const products = await db.product.findMany({
        where: { categoryId: data.id, attributes: { path: [key], not: Prisma.DbNull } },
        select: { id: true, sku: true, name: true },
      });
      for (const p of products) if (!affected.find((a) => a.id === p.id)) affected.push(p);
    }
    if (affected.length > 0) {
      return { status: "needs_confirmation", removedKeys, affectedProducts: affected };
    }
  }

  const strippedProductIds: string[] = [];
  if (removedKeys.length > 0) {
    const affected = await db.product.findMany({
      where: { categoryId: data.id },
      select: { id: true, attributes: true },
    });
    for (const p of affected) {
      const attrs = (p.attributes as Record<string, unknown> | null) ?? null;
      if (!attrs) continue;
      let modified = false;
      const next = { ...attrs };
      for (const k of removedKeys) {
        if (k in next) { delete next[k]; modified = true; }
      }
      if (modified) {
        await db.product.update({
          where: { id: p.id },
          data: { attributes: next as Prisma.InputJsonValue },
        });
        strippedProductIds.push(p.id);
      }
    }
  }

  await db.category.update({
    where: { id: data.id },
    data: {
      slug: data.slug,
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder,
      attributeSchema: data.attributeSchema as object,
      variantTemplate: (data.variantTemplate as object | null) ?? undefined,
      active: data.active ?? true,
    },
  });

  await db.auditLog.create({
    data: {
      entity: "Category",
      entityId: data.id,
      action: "update",
      actorId,
      diff: {
        before: { attributeSchema: beforeSchema },
        after: { attributeSchema: data.attributeSchema },
        removedKeys,
        affectedProductIds: strippedProductIds,
      } as object,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${data.id}`);
  return { status: "ok", id: data.id };
}

export async function archiveCategory(id: string, actorId: string) {
  const cat = await db.category.findUnique({ where: { id } });
  if (!cat) throw new Error("Category not found");
  await db.category.update({ where: { id }, data: { active: false } });
  await db.auditLog.create({
    data: { entity: "Category", entityId: id, action: "archive", actorId, diff: {} },
  });
  revalidatePath("/admin/categories");
}

export async function deleteCategory(
  id: string,
  confirmAffectedProducts: boolean,
  actorId: string,
): Promise<
  | { status: "ok" }
  | { status: "needs_confirmation"; affectedProducts: AffectedProduct[] }
> {
  const cat = await db.category.findUnique({ where: { id } });
  if (!cat) throw new Error("Category not found");
  if (cat.isBuiltin) throw new Error("Cannot delete builtin category — archive it instead");

  const affected = await db.product.findMany({
    where: { categoryId: id },
    select: { id: true, sku: true, name: true },
  });

  if (affected.length > 0 && !confirmAffectedProducts) {
    return { status: "needs_confirmation", affectedProducts: affected };
  }

  if (affected.length > 0) {
    await db.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
  }
  await db.category.delete({ where: { id } });
  await db.auditLog.create({
    data: {
      entity: "Category", entityId: id, action: "delete", actorId,
      diff: { affectedProductIds: affected.map((p) => p.id) } as object,
    },
  });
  revalidatePath("/admin/categories");
  return { status: "ok" };
}

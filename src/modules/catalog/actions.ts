"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { productCreateSchema, productUpdateSchema, type ProductCreateInput, type ProductUpdateInput } from "./schemas";
import { recordMovement } from "@/modules/inventory/movements";
import { buildAttributeValidator } from "@/modules/categories/attribute-validator";
import type { AttributeSchemaItem } from "@/modules/categories/defaults";
import { Prisma } from "@prisma/client";
import { ok, fail, type ActionResult } from "@/lib/action-result";

export async function createProduct(
  raw: ProductCreateInput,
  actorId: string,
): Promise<ActionResult<{ productId: string }>> {
  const parsed = productCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Ungültige Eingabe");
  }
  const data = parsed.data;

  let validatedAttributes: Record<string, unknown> = {};
  if (data.categoryId) {
    const cat = await db.category.findUnique({ where: { id: data.categoryId } });
    if (!cat) return fail("NOT_FOUND", "Kategorie nicht gefunden");
    const validator = buildAttributeValidator(((cat.attributeSchema as unknown) as AttributeSchemaItem[]) ?? []);
    const attrParsed = validator.safeParse(data.attributes ?? {});
    if (!attrParsed.success) {
      return fail("VALIDATION_ERROR", attrParsed.error.issues[0]?.message ?? "Ungültige Attribute");
    }
    validatedAttributes = attrParsed.data as Record<string, unknown>;
  }
  const product = await db.product.create({
    data: {
      sku: data.sku,
      name: data.name,
      description: data.description,
      minStock: data.minStock,
      createdById: actorId,
      categoryId: data.categoryId ?? null,
      attributes: validatedAttributes as Prisma.InputJsonValue,
    },
  });
  if (data.variants.length > 0) {
    await db.productVariant.createMany({
      data: data.variants.map((v) => ({
        productId: product.id,
        label: v.label,
        minStock: v.minStock,
      })),
    });
  }
  if (data.initialStock > 0) {
    await recordMovement({
      productId: product.id,
      delta: data.initialStock,
      reason: "initial",
      actorId,
    });
  }
  await db.auditLog.create({
    data: { entity: "Product", entityId: product.id, action: "create", actorId, diff: data as object },
  });
  revalidatePath("/catalog");
  return ok({ productId: product.id });
}

export async function updateProduct(
  raw: ProductUpdateInput,
  actorId: string,
): Promise<ActionResult<{ productId: string }>> {
  const parsed = productUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Ungültige Eingabe");
  }
  const data = parsed.data;

  const existing = await db.product.findUnique({ where: { id: data.id } });
  if (!existing) return fail("NOT_FOUND", "Produkt nicht gefunden");

  const categoryChanged = (existing.categoryId ?? null) !== (data.categoryId ?? null);
  if (categoryChanged && !data.confirmCategoryChange) {
    return fail("CATEGORY_CHANGE_REQUIRES_CONFIRM", "Kategoriewechsel benötigt Bestätigung");
  }

  let validatedAttributes: Record<string, unknown> = {};
  if (data.categoryId) {
    const cat = await db.category.findUnique({ where: { id: data.categoryId } });
    if (!cat) return fail("NOT_FOUND", "Kategorie nicht gefunden");
    const validator = buildAttributeValidator(((cat.attributeSchema as unknown) as AttributeSchemaItem[]) ?? []);
    const attrParsed = validator.safeParse(data.attributes ?? {});
    if (!attrParsed.success) {
      return fail("VALIDATION_ERROR", attrParsed.error.issues[0]?.message ?? "Ungültige Attribute");
    }
    validatedAttributes = attrParsed.data as Record<string, unknown>;
  }
  await db.product.update({
    where: { id: data.id },
    data: {
      sku: data.sku,
      name: data.name,
      description: data.description,
      minStock: data.minStock,
      active: data.active ?? true,
      categoryId: data.categoryId ?? null,
      attributes: validatedAttributes as Prisma.InputJsonValue,
    },
  });
  await db.productVariant.deleteMany({ where: { productId: data.id } });
  if (data.variants.length > 0) {
    await db.productVariant.createMany({
      data: data.variants.map((v) => ({ productId: data.id, label: v.label, minStock: v.minStock })),
    });
  }
  await db.auditLog.create({
    data: { entity: "Product", entityId: data.id, action: "update", actorId, diff: data as object },
  });
  revalidatePath("/catalog");
  revalidatePath(`/catalog/${data.id}/edit`);
  return ok({ productId: data.id });
}

export async function archiveProduct(id: string, actorId: string): Promise<ActionResult> {
  await db.product.update({ where: { id }, data: { active: false } });
  await db.auditLog.create({
    data: { entity: "Product", entityId: id, action: "archive", actorId, diff: {} },
  });
  revalidatePath("/catalog");
  return ok();
}

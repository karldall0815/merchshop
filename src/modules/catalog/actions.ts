"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { productCreateSchema, productUpdateSchema, type ProductCreateInput, type ProductUpdateInput } from "./schemas";
import { recordMovement } from "@/modules/inventory/movements";

export async function createProduct(raw: ProductCreateInput, actorId: string) {
  const data = productCreateSchema.parse(raw);
  const product = await db.product.create({
    data: {
      sku: data.sku,
      name: data.name,
      description: data.description,
      minStock: data.minStock,
      createdById: actorId,
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
  redirect("/catalog");
}

export async function updateProduct(raw: ProductUpdateInput, actorId: string) {
  const data = productUpdateSchema.parse(raw);
  await db.product.update({
    where: { id: data.id },
    data: {
      sku: data.sku,
      name: data.name,
      description: data.description,
      minStock: data.minStock,
      active: data.active ?? true,
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
  redirect("/catalog");
}

export async function archiveProduct(id: string, actorId: string) {
  await db.product.update({ where: { id }, data: { active: false } });
  await db.auditLog.create({
    data: { entity: "Product", entityId: id, action: "archive", actorId, diff: {} },
  });
  revalidatePath("/catalog");
}

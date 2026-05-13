"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function attachProductImage(opts: { productId: string; url: string }) {
  const count = await db.productImage.count({ where: { productId: opts.productId } });
  await db.productImage.create({
    data: { productId: opts.productId, url: opts.url, sortOrder: count },
  });
  revalidatePath(`/catalog/${opts.productId}/images`);
  revalidatePath("/catalog");
}

export async function removeProductImage(imageId: string) {
  const img = await db.productImage.findUnique({ where: { id: imageId } });
  if (!img) return;
  await db.productImage.delete({ where: { id: imageId } });
  // Note: phase 2 leaves orphan S3 objects. A periodic janitor lands in phase 6.
  revalidatePath(`/catalog/${img.productId}/images`);
  revalidatePath("/catalog");
}

export async function reorderProductImages(productId: string, orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, idx) =>
      db.productImage.update({ where: { id }, data: { sortOrder: idx } }),
    ),
  );
  revalidatePath(`/catalog/${productId}/images`);
}

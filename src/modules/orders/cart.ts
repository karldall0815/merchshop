"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { availableStock } from "@/modules/inventory/stock";

// The "cart" is just an Order in status=draft. One per requester at a
// time — we get-or-create on each interaction so the UI doesn't have to
// distinguish an empty cart from a missing one.
//
// A partial unique index ("Order_one_draft_per_requester") enforces the
// uniqueness at the DB layer. If two concurrent addToCart calls both see
// "no existing draft" and both try to create, one wins and the other
// trips the index — we catch it and re-read the winner.
async function getOrCreateDraft(userId: string) {
  const existing = await db.order.findFirst({
    where: { requesterId: userId, status: "draft" },
    include: { items: true },
  });
  if (existing) return existing;
  try {
    return await db.order.create({
      data: { requesterId: userId, status: "draft" },
      include: { items: true },
    });
  } catch {
    // Concurrent create lost the race — fetch what landed.
    const w = await db.order.findFirst({
      where: { requesterId: userId, status: "draft" },
      include: { items: true },
    });
    if (!w) throw new Error("draft creation failed");
    return w;
  }
}

export async function getCart() {
  const user = await getCurrentUser();
  if (!user) return null;
  const cart = await db.order.findFirst({
    where: { requesterId: user.id, status: "draft" },
    include: {
      items: {
        orderBy: { id: "asc" },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              active: true,
              images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
            },
          },
        },
      },
    },
  });
  return cart;
}

export async function addToCart(input: {
  productId: string;
  variantId?: string;
  quantity: number;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");
  const qty = Math.max(1, Math.floor(input.quantity));

  // Don't let an add put us past the bookable available count. The check
  // looks at the *delta*: how much extra are we trying to commit beyond
  // what's already reserved by THIS cart's existing line.
  const available = await availableStock({
    productId: input.productId,
    variantId: input.variantId,
  });
  // Walk the existing cart line so we can preserve what's already
  // committed (the existing reservation already subtracted from
  // `available`).
  const cart = await getOrCreateDraft(user.id);
  const existingLine = cart.items.find(
    (it) => it.productId === input.productId && (it.variantId ?? null) === (input.variantId ?? null),
  );
  // The delta this add introduces (existing line's quantity is already
  // counted in `availableStock` for non-draft statuses — but draft items
  // aren't reserved per spec §3.5, so the entire qty needs to fit).
  if (qty > available) {
    throw new Error(
      `Nur ${available} verfügbar — kann ${qty} nicht reservieren`,
    );
  }

  const product = await db.product.findFirst({
    where: { id: input.productId, active: true },
    select: {
      name: true,
      images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
    },
  });
  if (!product) throw new Error("Artikel existiert nicht oder ist inaktiv");

  let variantLabel: string | undefined;
  if (input.variantId) {
    const v = await db.productVariant.findUnique({
      where: { id: input.variantId },
      select: { label: true },
    });
    variantLabel = v?.label;
  }

  if (existingLine) {
    await db.orderItem.update({
      where: { id: existingLine.id },
      data: { quantity: existingLine.quantity + qty },
    });
  } else {
    await db.orderItem.create({
      data: {
        orderId: cart.id,
        productId: input.productId,
        variantId: input.variantId,
        quantity: qty,
        snapshotName: product.name,
        snapshotImageUrl: product.images[0]?.url,
        snapshotVariant: variantLabel,
      },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/shop");
}

export async function updateCartLine(itemId: string, quantity: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");
  const item = await db.orderItem.findFirst({
    where: { id: itemId, order: { requesterId: user.id, status: "draft" } },
  });
  if (!item) throw new Error("Artikel nicht im Warenkorb");
  const qty = Math.max(1, Math.floor(quantity));
  await db.orderItem.update({ where: { id: itemId }, data: { quantity: qty } });
  revalidatePath("/cart");
}

export async function removeCartLine(itemId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");
  const item = await db.orderItem.findFirst({
    where: { id: itemId, order: { requesterId: user.id, status: "draft" } },
  });
  if (!item) return;
  await db.orderItem.delete({ where: { id: itemId } });
  revalidatePath("/cart");
}

export async function clearCart() {
  const user = await getCurrentUser();
  if (!user) return;
  const cart = await db.order.findFirst({
    where: { requesterId: user.id, status: "draft" },
    select: { id: true },
  });
  if (!cart) return;
  await db.orderItem.deleteMany({ where: { orderId: cart.id } });
  revalidatePath("/cart");
}

// Tiny helper for the TopNav badge.
export async function cartItemCount() {
  const user = await getCurrentUser();
  if (!user) return 0;
  const agg = await db.orderItem.aggregate({
    where: { order: { requesterId: user.id, status: "draft" } },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}

// Convenience: navigate the requester to the cart after an add.
export async function addAndGoToCart(input: { productId: string; variantId?: string; quantity: number }) {
  await addToCart(input);
  redirect("/cart");
}

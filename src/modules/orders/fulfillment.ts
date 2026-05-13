"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { assertTransition, type AppRole } from "./state-machine";
import { notifyOrderShipped, notifyOrderDelivered } from "./notifications";

async function loadOrder(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
}

export async function startProcessing(orderId: string): Promise<never> {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");
  const order = await loadOrder(orderId);
  if (!order) throw new Error("Bestellung nicht gefunden");
  assertTransition(order.status, "processing", (user.role as AppRole) ?? "requester");

  await db.$transaction([
    db.order.update({ where: { id: order.id }, data: { status: "processing" } }),
    db.auditLog.create({
      data: {
        actorId: user.id,
        entity: "Order",
        entityId: order.id,
        action: "start_processing",
        diff: { from: order.status, to: "processing" },
      },
    }),
  ]);

  revalidatePath("/fulfillment");
  revalidatePath(`/fulfillment/${order.id}`);
  redirect(`/fulfillment/${order.id}`);
}

export async function markShipped(
  orderId: string,
  input: { trackingNumber: string; carrier: string },
): Promise<never> {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");
  const tracking = input.trackingNumber.trim();
  const carrier = input.carrier.trim();
  if (!tracking) throw new Error("Tracking-Nummer fehlt");
  if (!carrier) throw new Error("Carrier fehlt");

  const order = await loadOrder(orderId);
  if (!order) throw new Error("Bestellung nicht gefunden");
  assertTransition(order.status, "shipped", (user.role as AppRole) ?? "requester");

  // §3.5: definitive Abbuchung bei processing → shipped via StockMovement.
  // Each OrderItem becomes one negative-delta StockMovement with reason=
  // "order" and orderId linked, so the audit trail traces the reduction
  // straight back to the order that caused it.
  await db.$transaction([
    ...order.items.map((it) =>
      db.stockMovement.create({
        data: {
          productId: it.productId,
          variantId: it.variantId,
          delta: -it.quantity,
          reason: "order",
          orderId: order.id,
          actorId: user.id,
          comment: order.orderNumber ?? undefined,
        },
      }),
    ),
    db.order.update({
      where: { id: order.id },
      data: {
        status: "shipped",
        trackingNumber: tracking,
        carrier,
        shippedAt: new Date(),
      },
    }),
    db.auditLog.create({
      data: {
        actorId: user.id,
        entity: "Order",
        entityId: order.id,
        action: "ship",
        diff: { from: order.status, to: "shipped", trackingNumber: tracking, carrier },
      },
    }),
  ]);

  await notifyOrderShipped(order.id);

  revalidatePath("/fulfillment");
  revalidatePath(`/fulfillment/${order.id}`);
  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/inventory");
  redirect("/fulfillment");
}

// Webhook-only edge — the carrier (or for now, a manual click) tells us
// the parcel was delivered.
export async function markDelivered(orderId: string, actor: "system" | { role: AppRole; id: string }) {
  const order = await loadOrder(orderId);
  if (!order) throw new Error("Bestellung nicht gefunden");
  if (actor === "system") {
    assertTransition(order.status, "delivered", "system");
  } else {
    // No UI role can drive delivered per spec, but admin override stays
    // open for the manual-mark button in the fulfillment detail page.
    if (actor.role !== "admin") throw new Error("nur admin oder system");
  }
  await db.$transaction([
    db.order.update({
      where: { id: order.id },
      data: { status: "delivered", deliveredAt: new Date() },
    }),
    db.auditLog.create({
      data: {
        actorId: actor === "system" ? null : actor.id,
        entity: "Order",
        entityId: order.id,
        action: "deliver",
        diff: { from: order.status, to: "delivered", source: actor === "system" ? "webhook" : "manual" },
      },
    }),
  ]);
  await notifyOrderDelivered(order.id);

  revalidatePath("/fulfillment");
  revalidatePath(`/fulfillment/${order.id}`);
  revalidatePath(`/orders/${order.id}`);
}

export async function markDeliveredManual(orderId: string): Promise<void> {
  "use server";
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");
  await markDelivered(orderId, { role: (user.role as AppRole) ?? "requester", id: user.id });
}

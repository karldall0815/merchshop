"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { assertTransition, type AppRole } from "./state-machine";
import { notifyOrderDecided } from "./notifications";

async function loadOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, requesterId: true },
  });
  return order;
}

export async function approveOrder(orderId: string, comment?: string): Promise<never> {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");
  const order = await loadOrder(orderId);
  if (!order) throw new Error("Bestellung nicht gefunden");
  assertTransition(order.status, "approved", (user.role as AppRole) ?? "requester");

  await db.$transaction([
    db.order.update({
      where: { id: order.id },
      data: { status: "approved", approverId: user.id, approvedAt: new Date() },
    }),
    db.approvalLog.create({
      data: { orderId: order.id, userId: user.id, action: "approve", comment },
    }),
    db.auditLog.create({
      data: {
        actorId: user.id,
        entity: "Order",
        entityId: order.id,
        action: "approve",
        diff: { from: order.status, to: "approved", comment },
      },
    }),
  ]);

  await notifyOrderDecided(order.id);
  revalidatePath("/approvals");
  revalidatePath(`/orders/${order.id}`);
  redirect("/approvals");
}

export async function rejectOrder(orderId: string, reason: string): Promise<never> {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");
  if (!reason?.trim()) throw new Error("Begründung ist Pflicht");
  const order = await loadOrder(orderId);
  if (!order) throw new Error("Bestellung nicht gefunden");
  assertTransition(order.status, "rejected", (user.role as AppRole) ?? "requester");

  await db.$transaction([
    db.order.update({
      where: { id: order.id },
      data: {
        status: "rejected",
        approverId: user.id,
        approvedAt: new Date(),
        rejectionReason: reason.trim(),
      },
    }),
    db.approvalLog.create({
      data: { orderId: order.id, userId: user.id, action: "reject", comment: reason.trim() },
    }),
    db.auditLog.create({
      data: {
        actorId: user.id,
        entity: "Order",
        entityId: order.id,
        action: "reject",
        diff: { from: order.status, to: "rejected", reason: reason.trim() },
      },
    }),
  ]);

  await notifyOrderDecided(order.id);
  revalidatePath("/approvals");
  revalidatePath(`/orders/${order.id}`);
  redirect("/approvals");
}

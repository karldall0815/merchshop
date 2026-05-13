"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/modules/auth/session";
import { assertTransition } from "./state-machine";
import type { AppRole } from "./state-machine";
import { notifyOrderSubmitted } from "./notifications";
import { ok, fail, type ActionResult } from "@/lib/action-result";

type CheckoutInput = {
  occasion: string;
  costCenter?: string;
  desiredDate?: string; // YYYY-MM-DD from the date input
  desiredDateIsDeadline?: boolean;
  shippingAddress: {
    recipient: string;
    contact?: string;
    street: string;
    zip: string;
    city: string;
    country?: string;
  };
};

async function nextOrderNumber(): Promise<string> {
  // Year + zero-padded running counter — readable for the user, monotonic
  // per year. Looking at existing year's count avoids a separate Counter
  // table; collisions are caught by the unique index and would only
  // surface under extreme concurrency.
  const year = new Date().getUTCFullYear();
  const prefix = `MS-${year}-`;
  const last = await db.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  const lastNum = last?.orderNumber ? parseInt(last.orderNumber.slice(prefix.length), 10) : 0;
  const next = (Number.isFinite(lastNum) ? lastNum : 0) + 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

export async function submitCheckout(
  input: CheckoutInput
): Promise<ActionResult<{ orderId: string }>> {
  const user = await getCurrentUser();
  if (!user) return fail("PERMISSION_DENIED", "Nicht eingeloggt");

  const cart = await db.order.findFirst({
    where: { requesterId: user.id, status: "draft" },
    include: { items: true },
  });
  if (!cart) return fail("INVALID_STATE_TRANSITION", "Kein Entwurf vorhanden");
  if (cart.items.length === 0) return fail("VALIDATION_ERROR", "Warenkorb ist leer");

  // Defensive trim + minimum-length checks (the form does HTML validation
  // already; this catches manual API calls).
  const occasion = input.occasion.trim();
  const costCenter = (input.costCenter ?? "").trim() || null;
  const addr = input.shippingAddress;
  for (const k of ["recipient", "street", "zip", "city"] as const) {
    if (!addr[k]?.trim()) return fail("VALIDATION_ERROR", `Adressfeld ${k} fehlt`);
  }
  if (!occasion) return fail("VALIDATION_ERROR", "Anlass fehlt");

  let desired: Date | null = null;
  if (input.desiredDate) {
    const parsed = new Date(input.desiredDate);
    if (Number.isNaN(parsed.getTime())) return fail("VALIDATION_ERROR", "Wunschtermin ungültig");
    desired = parsed;
  }
  const isDeadline = !!(desired && input.desiredDateIsDeadline);

  try {
    assertTransition(cart.status, "pending", (user.role as AppRole) ?? "requester");
  } catch (e) {
    return fail("INVALID_STATE_TRANSITION", e instanceof Error ? e.message : "Ungültiger Statusübergang");
  }

  const orderNumber = await nextOrderNumber();

  await db.order.update({
    where: { id: cart.id },
    data: {
      status: "pending",
      orderNumber,
      occasion,
      costCenter,
      desiredDate: desired,
      desiredDateIsDeadline: isDeadline,
      shippingAddress: {
        recipient: addr.recipient.trim(),
        contact: (addr.contact ?? "").trim() || undefined,
        street: addr.street.trim(),
        zip: addr.zip.trim(),
        city: addr.city.trim(),
        country: (addr.country ?? "DE").trim() || "DE",
      },
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      entity: "Order",
      entityId: cart.id,
      action: "submit",
      diff: { from: "draft", to: "pending", orderNumber },
    },
  });

  await notifyOrderSubmitted(cart.id);

  revalidatePath("/cart");
  revalidatePath("/orders");
  revalidatePath("/approvals");

  return ok({ orderId: cart.id });
}

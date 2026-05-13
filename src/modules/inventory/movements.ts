import { db } from "@/lib/db";
import type { StockReason } from "@prisma/client";

export type MovementInput = {
  productId: string;
  variantId?: string;
  delta: number;
  reason: StockReason;
  comment?: string;
  orderId?: string;
  actorId?: string;
};

export async function recordMovement(m: MovementInput) {
  if (m.delta === 0) throw new Error("delta must not be zero");
  if (m.reason === "correction" && !m.comment) {
    throw new Error("correction requires a comment");
  }
  return db.stockMovement.create({
    data: {
      productId: m.productId,
      variantId: m.variantId,
      delta: m.delta,
      reason: m.reason,
      comment: m.comment,
      orderId: m.orderId,
      actorId: m.actorId,
    },
  });
}

import { db } from "@/lib/db";

// "Hard" stock — the algebraic sum of all StockMovement deltas. This is
// the single source of truth (no Product.stock column to drift from).
// Use for warehouse reporting and the low-stock alert.
export async function currentStock(opts: { productId: string; variantId?: string }) {
  const where: { productId: string; variantId?: string } = { productId: opts.productId };
  if (opts.variantId) where.variantId = opts.variantId;
  const agg = await db.stockMovement.aggregate({ where, _sum: { delta: true } });
  return agg._sum.delta ?? 0;
}

// Reserved qty held by orders that haven't yet shipped. Spec §3.5:
// "Verfügbarer Bestand = stock − Σ(quantity offener Orders in
//  pending/approved/processing)".
//
// Items in `draft` aren't reserved (cart still being assembled) and items
// in `shipped`/`delivered` already drove a StockMovement so they're
// counted in `currentStock` instead — double-counting them here would
// double-deduct.
export async function reservedStock(opts: { productId: string; variantId?: string }) {
  const where: { productId: string; variantId?: string | null } = { productId: opts.productId };
  if (opts.variantId) where.variantId = opts.variantId;
  const agg = await db.orderItem.aggregate({
    where: {
      ...where,
      order: { status: { in: ["pending", "approved", "processing"] } },
    },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}

// Bookable inventory: what a requester sees when deciding whether to add
// one more of an item to their cart.
export async function availableStock(opts: { productId: string; variantId?: string }) {
  const [hard, reserved] = await Promise.all([
    currentStock(opts),
    reservedStock(opts),
  ]);
  return hard - reserved;
}

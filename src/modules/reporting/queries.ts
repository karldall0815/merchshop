import { db } from "@/lib/db";
import { OrderStatus, Prisma } from "@prisma/client";
import type { SessionUser } from "@/modules/auth/session";

const OPEN_OR_DONE: OrderStatus[] = [
  OrderStatus.pending,
  OrderStatus.approved,
  OrderStatus.processing,
  OrderStatus.shipped,
  OrderStatus.delivered,
];

// Visibility model (§3.7): requester sees only their own orders;
// approver/agentur/admin see everything. We bake the scoping into a
// single shared whereOrder() so every report respects it consistently.
function whereOrder(user: SessionUser): Prisma.OrderWhereInput {
  if (user.role === "requester") return { requesterId: user.id };
  return {};
}

export type DateRange = { from?: Date; to?: Date };

function withRange<T extends Prisma.OrderWhereInput | Prisma.StockMovementWhereInput>(
  where: T,
  range?: DateRange,
): T {
  if (!range || (!range.from && !range.to)) return where;
  return {
    ...where,
    createdAt: {
      ...(range.from ? { gte: range.from } : {}),
      ...(range.to ? { lte: range.to } : {}),
    },
  } as T;
}

// "Top products" = sum(orderItem.quantity) across all non-draft, non-
// rejected, non-cancelled orders in the window. Sorting by qty desc.
export async function topProducts(user: SessionUser, range?: DateRange, limit = 25) {
  const order = whereOrder(user);
  // groupBy returns aggregates only; we re-fetch product display fields
  // in a second pass since SQL grouping doesn't carry them along.
  const rows = await db.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: withRange(
        {
          ...order,
          status: { in: OPEN_OR_DONE },
        },
        range,
      ),
    },
    _sum: { quantity: true },
    _count: { _all: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  if (rows.length === 0) return [];
  const products = await db.product.findMany({
    where: { id: { in: rows.map((r) => r.productId) } },
    select: { id: true, sku: true, name: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return rows.map((r) => ({
    productId: r.productId,
    sku: byId.get(r.productId)?.sku ?? "—",
    name: byId.get(r.productId)?.name ?? "(unbekannt)",
    quantity: r._sum?.quantity ?? 0,
    orderLines: r._count?._all ?? 0,
  }));
}

// Orders bucketed by `occasion` or `costCenter` — for marketing-budget
// and finance roll-ups. Nulls become "—".
export async function ordersGrouped(
  user: SessionUser,
  field: "occasion" | "costCenter",
  range?: DateRange,
) {
  const orders = await db.order.findMany({
    where: withRange(
      {
        ...whereOrder(user),
        status: { in: ["pending", "approved", "processing", "shipped", "delivered"] },
      },
      range,
    ),
    select: { id: true, [field]: true, items: { select: { quantity: true } } } as never,
  });
  const buckets = new Map<string, { orders: number; items: number }>();
  for (const o of orders as Array<{ id: string; items: { quantity: number }[] } & Record<string, string | null>>) {
    const key = (o[field] as string | null)?.trim() || "—";
    const cur = buckets.get(key) ?? { orders: 0, items: 0 };
    cur.orders += 1;
    cur.items += o.items.reduce((a, i) => a + i.quantity, 0);
    buckets.set(key, cur);
  }
  return Array.from(buckets.entries())
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.items - a.items);
}

// Per-product stock-movement timeline (already used by inventory detail
// but exposed here too for reporting/export).
export async function stockHistory(productId: string, range?: DateRange) {
  return db.stockMovement.findMany({
    where: withRange({ productId }, range),
    orderBy: { createdAt: "desc" },
    include: {
      variant: { select: { label: true } },
    },
  });
}

// Full order list for CSV/admin reporting. Caller is responsible for
// passing a sane `take` cap when used unfiltered.
export async function ordersForExport(user: SessionUser, range?: DateRange, take = 1000) {
  return db.order.findMany({
    where: withRange(
      {
        ...whereOrder(user),
        status: { not: OrderStatus.draft },
      },
      range,
    ),
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      occasion: true,
      costCenter: true,
      desiredDate: true,
      createdAt: true,
      shippedAt: true,
      deliveredAt: true,
      trackingNumber: true,
      carrier: true,
      requester: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
  });
}

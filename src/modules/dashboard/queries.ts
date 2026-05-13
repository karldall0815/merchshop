import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import type { SessionUser } from "@/modules/auth/session";
import { currentStock } from "@/modules/inventory/stock";

export type DashboardStats = {
  myDraftItems: number;
  myOpenOrders: number;
  myRecentOrders: Array<{
    id: string;
    orderNumber: string | null;
    status: OrderStatus;
    createdAt: Date;
  }>;
  pendingApprovals: number;
  fulfillmentApproved: number;
  fulfillmentProcessing: number;
  fulfillmentShipped: number;
  lowStock: Array<{ id: string; name: string; sku: string; minStock: number; current: number }>;
};

// One DB hit per role-relevant chunk so the dashboard renders fast even
// if any one source is slow. The shape is intentionally union-style:
// fields not relevant to the role end up as 0/[]; the UI hides them
// based on user.role.
export async function dashboardStats(user: SessionUser): Promise<DashboardStats> {
  const myDraftItems = await db.orderItem
    .aggregate({
      where: { order: { requesterId: user.id, status: OrderStatus.draft } },
      _sum: { quantity: true },
    })
    .then((a) => a._sum.quantity ?? 0);

  const OPEN: OrderStatus[] = [
    OrderStatus.pending,
    OrderStatus.approved,
    OrderStatus.processing,
    OrderStatus.shipped,
  ];
  const myOpenOrders = await db.order.count({
    where: { requesterId: user.id, status: { in: OPEN } },
  });

  const myRecentOrders = await db.order.findMany({
    where: { requesterId: user.id, status: { not: OrderStatus.draft } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, orderNumber: true, status: true, createdAt: true },
  });

  // Role-gated counts: only compute the heavy ones for users who'll see them.
  const isApprover = user.role === "approver" || user.role === "admin";
  const isFulfiller = user.role === "agentur" || user.role === "admin";

  const pendingApprovals = isApprover
    ? await db.order.count({ where: { status: OrderStatus.pending } })
    : 0;

  const [fulfillmentApproved, fulfillmentProcessing, fulfillmentShipped] = isFulfiller
    ? await Promise.all([
        db.order.count({ where: { status: OrderStatus.approved } }),
        db.order.count({ where: { status: OrderStatus.processing } }),
        db.order.count({ where: { status: OrderStatus.shipped } }),
      ])
    : [0, 0, 0];

  // Low-stock listing for the agentur dashboard pane. Uses the same
  // definition as /api/jobs/low-stock so the UI lines up with the
  // outbound mail.
  const lowStock: DashboardStats["lowStock"] = [];
  if (isFulfiller) {
    const products = await db.product.findMany({
      where: { active: true, minStock: { gt: 0 } },
      select: { id: true, sku: true, name: true, minStock: true },
    });
    for (const p of products) {
      const cur = await currentStock({ productId: p.id });
      if (cur < p.minStock) {
        lowStock.push({ id: p.id, sku: p.sku, name: p.name, minStock: p.minStock, current: cur });
      }
    }
  }

  return {
    myDraftItems,
    myOpenOrders,
    myRecentOrders,
    pendingApprovals,
    fulfillmentApproved,
    fulfillmentProcessing,
    fulfillmentShipped,
    lowStock,
  };
}

import { db } from "@/lib/db";

// Orders visible to the requester themselves. Drafts are hidden — they
// are the cart, not "real" orders.
export async function listMyOrders(userId: string) {
  return db.order.findMany({
    where: { requesterId: userId, status: { not: "draft" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      occasion: true,
      desiredDate: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });
}

// Detail visible to the requester (own orders) and admin/agentur/approver
// (any order). Caller is responsible for the role check.
export async function getOrderDetail(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    include: {
      items: { orderBy: { id: "asc" } },
      requester: { select: { id: true, name: true, email: true } },
      approver: { select: { id: true, name: true, email: true } },
      approvals: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true, role: true } } },
      },
    },
  });
}

// Three-column kanban data: approved (ready to start), processing
// (label/ship-prep ongoing), shipped (waiting for delivered).
export async function listFulfillmentColumns() {
  const orders = await db.order.findMany({
    where: { status: { in: ["approved", "processing", "shipped"] } },
    orderBy: { approvedAt: "asc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      occasion: true,
      desiredDate: true,
      shippedAt: true,
      trackingNumber: true,
      requester: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });
  return {
    approved: orders.filter((o) => o.status === "approved"),
    processing: orders.filter((o) => o.status === "processing"),
    shipped: orders.filter((o) => o.status === "shipped"),
  };
}

// Pending orders waiting for an approver decision.
export async function listPendingApprovals() {
  return db.order.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      orderNumber: true,
      occasion: true,
      costCenter: true,
      desiredDate: true,
      createdAt: true,
      requester: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
  });
}

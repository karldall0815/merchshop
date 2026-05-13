import type { OrderStatus } from "@prisma/client";

export type AppRole = "admin" | "agentur" | "approver" | "requester";

// Status → allowed-roles map. The ordered tuple makes the actor lookup
// O(1) and keeps the design-doc table next to the code that enforces it.
//
// See docs/superpowers/specs/2026-05-11-merchshop-design.md §6.
const TRANSITIONS: Record<OrderStatus, Partial<Record<OrderStatus, AppRole[]>>> = {
  draft: {
    pending: ["requester", "admin"],
    cancelled: ["requester", "admin"],
  },
  pending: {
    approved: ["approver", "admin"],
    rejected: ["approver", "admin"],
    cancelled: ["requester", "admin"],
  },
  approved: {
    processing: ["agentur", "admin"],
    cancelled: ["requester", "admin"],
  },
  processing: {
    shipped: ["agentur", "admin"],
  },
  shipped: {
    // System-only via tracking webhook; no role can do this through the UI.
    delivered: [],
  },
  // Terminal states — no outbound edges.
  rejected: {},
  delivered: {},
  cancelled: {},
};

export class OrderTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderTransitionError";
  }
}

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  role: AppRole | "system",
): boolean {
  const allowed = TRANSITIONS[from]?.[to];
  if (!allowed) return false;
  if (role === "system") {
    // System transitions are explicit edges with no role attached (delivered).
    return allowed.length === 0;
  }
  return allowed.includes(role);
}

export function assertTransition(
  from: OrderStatus,
  to: OrderStatus,
  role: AppRole | "system",
): void {
  if (!canTransition(from, to, role)) {
    throw new OrderTransitionError(
      `${role} darf Bestellung nicht von ${from} → ${to} überführen`,
    );
  }
}

// Pretty-print the transition matrix for tests / documentation. Used by
// the unit-test snapshot to detect accidental edge changes.
export function transitions(): Array<{ from: OrderStatus; to: OrderStatus; roles: AppRole[] }> {
  const out: Array<{ from: OrderStatus; to: OrderStatus; roles: AppRole[] }> = [];
  for (const [from, edges] of Object.entries(TRANSITIONS) as [OrderStatus, Partial<Record<OrderStatus, AppRole[]>>][]) {
    for (const [to, roles] of Object.entries(edges) as [OrderStatus, AppRole[]][]) {
      out.push({ from, to, roles });
    }
  }
  return out;
}

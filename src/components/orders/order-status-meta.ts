export type OrderStatus =
  | "draft"
  | "pending"
  | "approved"
  | "processing"
  | "shipped"
  | "delivered"
  | "rejected"
  | "cancelled";

export interface OrderForStatus {
  status: OrderStatus;
  approverId?: string | null;
  approver?: { name: string } | null;
  approvedAt?: Date | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  updatedAt: Date;
  rejectionReason?: string | null;
}

export type BadgeColor =
  | "indigo"
  | "green"
  | "amber"
  | "blue"
  | "green-pastel"
  | "red"
  | "grey";

export interface StatusMeta {
  color: BadgeColor;
  label: string;
  hint: string;
}

function relativeGerman(from: Date, now: Date): string {
  const diffMs = now.getTime() - from.getTime();
  const days = Math.floor(diffMs / (24 * 3600 * 1000));
  if (days >= 2) return `seit ${days} Tagen`;
  if (days === 1) return "seit gestern";
  const hours = Math.floor(diffMs / (3600 * 1000));
  if (hours >= 1) return `seit ${hours} h`;
  return "vor wenigen Minuten";
}

function germanDate(d: Date): string {
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function computeStatusMeta(
  order: OrderForStatus,
  now: Date = new Date(),
): StatusMeta {
  switch (order.status) {
    case "draft":
      return {
        color: "grey",
        label: "Entwurf",
        hint: "Du musst noch absenden",
      };
    case "pending":
      return {
        color: "indigo",
        label: "Wartet auf Freigabe",
        hint: `→ ${order.approver?.name ?? "Approver"} · ${relativeGerman(order.updatedAt, now)}`,
      };
    case "approved":
      return {
        color: "green",
        label: "Freigegeben",
        hint: "→ wartet auf Versand",
      };
    case "processing":
      return {
        color: "amber",
        label: "Wird verpackt",
        hint: `→ Agentur · ${relativeGerman(order.updatedAt, now)}`,
      };
    case "shipped":
      return {
        color: "blue",
        label: "Versandt",
        hint: order.shippedAt ? `am ${germanDate(order.shippedAt)}` : "in Zustellung",
      };
    case "delivered":
      return {
        color: "green-pastel",
        label: "Zugestellt",
        hint: order.deliveredAt
          ? `am ${germanDate(order.deliveredAt)}`
          : "abgeschlossen",
      };
    case "rejected":
      return {
        color: "red",
        label: "Abgelehnt",
        hint: order.rejectionReason
          ? `Grund: ${order.rejectionReason}`
          : "ohne Grund",
      };
    case "cancelled":
      return {
        color: "grey",
        label: "Storniert",
        hint: `am ${germanDate(order.updatedAt)}`,
      };
  }
}

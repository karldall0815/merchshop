import type { OrderStatus } from "./order-status-meta";

export type StepKey = "submitted" | "approved" | "processing" | "shipped" | "delivered";
export type StepState = "done" | "current" | "future" | "rejected";

export interface TimelineStep {
  key: StepKey;
  label: string;
  state: StepState;
  date?: Date | null;
}

export interface OrderForTimeline {
  status: OrderStatus;
  createdAt: Date;
  approvedAt?: Date | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  rejectionReason?: string | null;
}

const ORDER: StepKey[] = ["submitted", "approved", "processing", "shipped", "delivered"];

const LABELS: Record<StepKey, string> = {
  submitted:  "Eingereicht",
  approved:   "Freigegeben",
  processing: "Wird verpackt",
  shipped:    "Versandt",
  delivered:  "Zugestellt",
};

function currentIndex(status: OrderStatus): number {
  switch (status) {
    case "draft":      return -1;
    case "pending":    return 0;
    case "approved":   return 2;
    case "processing": return 2;
    case "shipped":    return 3;
    case "delivered":  return 4;
    case "rejected":   return 1;
    case "cancelled":  return -1;
  }
}

export function computeTimelineSteps(order: OrderForTimeline): TimelineStep[] {
  const cur = currentIndex(order.status);
  return ORDER.map((key, idx) => {
    let state: StepState;
    if (order.status === "rejected" && key === "approved") state = "rejected";
    else if (order.status === "delivered") state = "done";
    else if (idx < cur) state = "done";
    else if (idx === cur) state = (order.status === "pending" || order.status === "approved" || order.status === "processing") ? "current" : "done";
    else state = "future";

    let date: Date | null = null;
    if (key === "submitted") date = order.createdAt;
    if (key === "approved") date = order.approvedAt ?? null;
    if (key === "shipped") date = order.shippedAt ?? null;
    if (key === "delivered") date = order.deliveredAt ?? null;

    return { key, label: LABELS[key], state, date };
  });
}

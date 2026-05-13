import type { OrderStatus } from "@prisma/client";

const STYLE: Record<OrderStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  approved: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200",
  processing: "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200",
  shipped: "bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-200",
  delivered: "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200",
  rejected: "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200",
  cancelled: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700/40 dark:text-zinc-300",
};

const LABEL: Record<OrderStatus, string> = {
  draft: "Entwurf",
  pending: "Wartet auf Freigabe",
  approved: "Freigegeben",
  processing: "In Bearbeitung",
  shipped: "Versendet",
  delivered: "Zugestellt",
  rejected: "Abgelehnt",
  cancelled: "Storniert",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${STYLE[status]}`}>
      {LABEL[status]}
    </span>
  );
}

import {
  computeStatusMeta,
  type BadgeColor,
  type OrderForStatus,
} from "./order-status-meta";

const COLOR_CLASSES: Record<BadgeColor, string> = {
  indigo: "bg-indigo-100 text-indigo-800",
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-blue-100 text-blue-800",
  "green-pastel": "bg-emerald-50 text-emerald-700",
  red: "bg-red-100 text-red-800",
  grey: "bg-gray-100 text-gray-700",
};

export function OrderStatusBadge({ order }: { order: OrderForStatus }) {
  const meta = computeStatusMeta(order);
  return (
    <span className="inline-flex items-baseline gap-2">
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLOR_CLASSES[meta.color]}`}
      >
        {meta.label}
      </span>
      <span className="text-xs text-muted-foreground">{meta.hint}</span>
    </span>
  );
}

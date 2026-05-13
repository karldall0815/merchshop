import { computeTimelineSteps, type OrderForTimeline, type StepState } from "./order-timeline-data";
import { computeStatusMeta, type OrderForStatus } from "./order-status-meta";

const CIRCLE_CLASS: Record<StepState, string> = {
  done:     "bg-green-600 text-white",
  current:  "bg-amber-100 text-amber-700 border-2 border-amber-500",
  future:   "bg-gray-200 text-gray-400",
  rejected: "bg-red-600 text-white",
};

const LINE_CLASS: Record<StepState, string> = {
  done:     "bg-green-600",
  current:  "bg-amber-500",
  future:   "bg-gray-200",
  rejected: "bg-red-600",
};

export function OrderTimeline({ order }: { order: OrderForTimeline & OrderForStatus }) {
  const steps = computeTimelineSteps(order);
  const meta = computeStatusMeta(order);

  return (
    <div className="space-y-3">
      <div className="flex items-start">
        {steps.map((s, i) => {
          const prev = steps[i - 1];
          const lineState: StepState =
            prev && prev.state === "done" && s.state !== "future"
              ? "done"
              : s.state === "current"
              ? "current"
              : s.state === "rejected"
              ? "rejected"
              : "future";
          return (
            <div key={s.key} className="flex items-start flex-1 last:flex-none">
              {i > 0 && <div className={`h-0.5 flex-1 mt-3.5 ${LINE_CLASS[lineState]}`} />}
              <div className="text-center min-w-[5rem]">
                <div className={`mx-auto h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${CIRCLE_CLASS[s.state]}`}>
                  {s.state === "done" ? "✓" : s.state === "current" ? "…" : s.state === "rejected" ? "✕" : ""}
                </div>
                <div className="mt-1 text-xs font-medium">{s.label}</div>
                {s.date && (
                  <div className="text-[0.625rem] text-muted-foreground">
                    {new Date(s.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {order.status !== "delivered" && order.status !== "cancelled" && order.status !== "rejected" && (
        <div className="rounded border-l-4 border-amber-400 bg-amber-50 p-3 text-sm">
          ⏳ <strong>{meta.label}</strong> — {meta.hint}
        </div>
      )}
      {order.status === "rejected" && (
        <div className="rounded border-l-4 border-red-500 bg-red-50 p-3 text-sm">
          ✕ <strong>Abgelehnt</strong>{order.rejectionReason ? ` — Grund: ${order.rejectionReason}` : ""}
        </div>
      )}
    </div>
  );
}

import { describe, expect, it } from "vitest";
import { computeTimelineSteps } from "./order-timeline-data";

const base = {
  status: "approved" as const,
  createdAt: new Date("2026-05-10T13:42:00Z"),
  approverId: null,
  approver: null,
  approvedAt: new Date("2026-05-10T16:25:00Z"),
  shippedAt: null,
  deliveredAt: null,
  rejectionReason: null,
};

describe("computeTimelineSteps", () => {
  it("returns 5 steps with correct state", () => {
    const steps = computeTimelineSteps(base);
    expect(steps).toHaveLength(5);
    expect(steps[0]).toMatchObject({ key: "submitted", state: "done" });
    expect(steps[1]).toMatchObject({ key: "approved",  state: "done" });
    expect(steps[2]).toMatchObject({ key: "processing", state: "current" });
    expect(steps[3]).toMatchObject({ key: "shipped",   state: "future" });
    expect(steps[4]).toMatchObject({ key: "delivered", state: "future" });
  });

  it("marks rejection as broken state", () => {
    const steps = computeTimelineSteps({ ...base, status: "rejected", rejectionReason: "X" });
    expect(steps.find((s) => s.key === "approved")?.state).toBe("rejected");
  });

  it("delivered fills all steps", () => {
    const steps = computeTimelineSteps({
      ...base,
      status: "delivered",
      shippedAt: new Date("2026-05-11T08:00:00Z"),
      deliveredAt: new Date("2026-05-12T14:00:00Z"),
    });
    expect(steps.every((s) => s.state === "done")).toBe(true);
  });
});

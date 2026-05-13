import { describe, expect, it } from "vitest";
import { computeStatusMeta } from "./order-status-meta";

const baseOrder = {
  status: "pending" as const,
  approverId: "approver-1",
  approver: { name: "A. Approver" },
  approvedAt: null,
  shippedAt: null,
  deliveredAt: null,
  updatedAt: new Date("2026-05-10T10:00:00Z"),
  rejectionReason: null,
};

describe("computeStatusMeta", () => {
  it("pending → indigo with approver name", () => {
    const meta = computeStatusMeta(baseOrder, new Date("2026-05-12T10:00:00Z"));
    expect(meta.color).toBe("indigo");
    expect(meta.label).toBe("Wartet auf Freigabe");
    expect(meta.hint).toContain("A. Approver");
    expect(meta.hint).toContain("seit 2 Tagen");
  });

  it("approved → green, hints next step", () => {
    const meta = computeStatusMeta({ ...baseOrder, status: "approved", approvedAt: new Date() }, new Date());
    expect(meta.color).toBe("green");
    expect(meta.label).toBe("Freigegeben");
    expect(meta.hint).toContain("Versand");
  });

  it("processing → amber with agentur hint", () => {
    const meta = computeStatusMeta({ ...baseOrder, status: "processing" }, new Date());
    expect(meta.color).toBe("amber");
    expect(meta.label).toBe("Wird verpackt");
    expect(meta.hint).toContain("Agentur");
  });

  it("shipped → blue, hint contains ETA or shipped date", () => {
    const shipped = new Date("2026-05-11T08:00:00Z");
    const meta = computeStatusMeta({ ...baseOrder, status: "shipped", shippedAt: shipped }, new Date("2026-05-13T08:00:00Z"));
    expect(meta.color).toBe("blue");
    expect(meta.label).toBe("Versandt");
  });

  it("delivered → green-pastel with delivery date", () => {
    const delivered = new Date("2026-05-12T14:00:00Z");
    const meta = computeStatusMeta({ ...baseOrder, status: "delivered", deliveredAt: delivered }, new Date());
    expect(meta.color).toBe("green-pastel");
    expect(meta.label).toBe("Zugestellt");
    expect(meta.hint).toContain("12.05.");
  });

  it("rejected → red with reason in hint", () => {
    const meta = computeStatusMeta({
      ...baseOrder,
      status: "rejected",
      rejectionReason: "Falsche Kostenstelle",
    }, new Date());
    expect(meta.color).toBe("red");
    expect(meta.label).toBe("Abgelehnt");
    expect(meta.hint).toContain("Falsche Kostenstelle");
  });

  it("cancelled → grey", () => {
    const meta = computeStatusMeta({ ...baseOrder, status: "cancelled" }, new Date());
    expect(meta.color).toBe("grey");
    expect(meta.label).toBe("Storniert");
  });

  it("draft → grey with prompt to submit", () => {
    const meta = computeStatusMeta({ ...baseOrder, status: "draft" }, new Date());
    expect(meta.color).toBe("grey");
    expect(meta.label).toBe("Entwurf");
    expect(meta.hint).toContain("absenden");
  });
});

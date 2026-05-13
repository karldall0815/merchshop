import { describe, expect, it } from "vitest";
import { canTransition, assertTransition, transitions, OrderTransitionError } from "./state-machine";

describe("order state machine", () => {
  it("allows the spec-listed forward path", () => {
    expect(canTransition("draft", "pending", "requester")).toBe(true);
    expect(canTransition("pending", "approved", "approver")).toBe(true);
    expect(canTransition("approved", "processing", "agentur")).toBe(true);
    expect(canTransition("processing", "shipped", "agentur")).toBe(true);
    expect(canTransition("shipped", "delivered", "system")).toBe(true);
  });

  it("admin can drive every non-system edge", () => {
    expect(canTransition("draft", "pending", "admin")).toBe(true);
    expect(canTransition("pending", "approved", "admin")).toBe(true);
    expect(canTransition("pending", "rejected", "admin")).toBe(true);
    expect(canTransition("approved", "processing", "admin")).toBe(true);
    expect(canTransition("processing", "shipped", "admin")).toBe(true);
  });

  it("requester cannot approve own order", () => {
    expect(canTransition("pending", "approved", "requester")).toBe(false);
    expect(canTransition("pending", "rejected", "requester")).toBe(false);
  });

  it("agentur cannot approve, only fulfill", () => {
    expect(canTransition("pending", "approved", "agentur")).toBe(false);
    expect(canTransition("approved", "processing", "agentur")).toBe(true);
  });

  it("approver cannot fulfill, only approve/reject", () => {
    expect(canTransition("approved", "processing", "approver")).toBe(false);
    expect(canTransition("pending", "approved", "approver")).toBe(true);
  });

  it("cancellation is allowed by requester only before processing", () => {
    expect(canTransition("draft", "cancelled", "requester")).toBe(true);
    expect(canTransition("pending", "cancelled", "requester")).toBe(true);
    expect(canTransition("approved", "cancelled", "requester")).toBe(true);
    expect(canTransition("processing", "cancelled", "requester")).toBe(false);
  });

  it("terminal states reject all outbound edges", () => {
    expect(canTransition("rejected", "pending", "admin")).toBe(false);
    expect(canTransition("delivered", "shipped", "admin")).toBe(false);
    expect(canTransition("cancelled", "draft", "admin")).toBe(false);
  });

  it("delivered is system-only — no UI role can drive it", () => {
    expect(canTransition("shipped", "delivered", "agentur")).toBe(false);
    expect(canTransition("shipped", "delivered", "admin")).toBe(false);
    expect(canTransition("shipped", "delivered", "system")).toBe(true);
  });

  it("assertTransition throws on forbidden moves", () => {
    expect(() => assertTransition("pending", "shipped", "agentur")).toThrow(OrderTransitionError);
  });

  it("transition matrix matches the spec table exactly", () => {
    const list = transitions().map((t) => `${t.from}→${t.to}(${t.roles.join(",") || "system"})`).sort();
    expect(list).toEqual(
      [
        "approved→cancelled(requester,admin)",
        "approved→processing(agentur,admin)",
        "draft→cancelled(requester,admin)",
        "draft→pending(requester,admin)",
        "pending→approved(approver,admin)",
        "pending→cancelled(requester,admin)",
        "pending→rejected(approver,admin)",
        "processing→shipped(agentur,admin)",
        "shipped→delivered(system)",
      ].sort(),
    );
  });
});

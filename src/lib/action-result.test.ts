import { describe, expect, it } from "vitest";
import { ok, fail, type ActionResult } from "./action-result";

describe("ok", () => {
  it("wraps data with ok: true", () => {
    const r = ok({ id: "x" });
    expect(r).toEqual({ ok: true, data: { id: "x" } });
  });

  it("works without data", () => {
    const r = ok();
    expect(r.ok).toBe(true);
    expect((r as { data?: unknown }).data).toBeUndefined();
  });
});

describe("fail", () => {
  it("builds a failure with code and message", () => {
    const r = fail("VALIDATION_ERROR", "Bitte prüfen");
    expect(r).toEqual({ ok: false, code: "VALIDATION_ERROR", message: "Bitte prüfen" });
  });

  it("includes details when provided", () => {
    const r = fail("INSUFFICIENT_STOCK", "Nicht genug", { available: 2 });
    expect(r.details).toEqual({ available: 2 });
  });
});

describe("ActionResult discriminator", () => {
  it("narrows correctly on ok=true", () => {
    const r: ActionResult<number> = ok(5);
    if (r.ok) {
      expect(r.data! + 1).toBe(6);
    } else {
      throw new Error("not reachable");
    }
  });
});

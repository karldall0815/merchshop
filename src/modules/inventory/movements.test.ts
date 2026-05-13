import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    stockMovement: { create: vi.fn().mockResolvedValue({ id: "m1" }) },
  },
}));

import { recordMovement } from "./movements";
import { db } from "@/lib/db";
const m = db as unknown as { stockMovement: { create: ReturnType<typeof vi.fn> } };

describe("recordMovement", () => {
  it("creates an append-only entry with required fields", async () => {
    await recordMovement({
      productId: "p1",
      delta: -3,
      reason: "order",
      orderId: "o1",
      actorId: "u1",
    });
    const arg = m.stockMovement.create.mock.calls.at(-1)![0];
    expect(arg.data).toMatchObject({
      productId: "p1",
      delta: -3,
      reason: "order",
      orderId: "o1",
      actorId: "u1",
    });
  });

  it("rejects delta=0", async () => {
    await expect(
      recordMovement({ productId: "p", delta: 0, reason: "correction" }),
    ).rejects.toThrow(/zero/i);
  });

  it("requires comment for correction", async () => {
    await expect(
      recordMovement({ productId: "p", delta: -5, reason: "correction" }),
    ).rejects.toThrow(/comment/i);
  });

  it("accepts correction with comment", async () => {
    await recordMovement({
      productId: "p",
      delta: -5,
      reason: "correction",
      comment: "stocktake adjust",
      actorId: "u1",
    });
    expect(m.stockMovement.create).toHaveBeenCalled();
  });
});

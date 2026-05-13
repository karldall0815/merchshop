import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    stockMovement: { aggregate: vi.fn() },
  },
}));

import { currentStock } from "./stock";
import { db } from "@/lib/db";
const m = db as unknown as { stockMovement: { aggregate: ReturnType<typeof vi.fn> } };

describe("currentStock", () => {
  it("returns sum of deltas for a product", async () => {
    m.stockMovement.aggregate.mockResolvedValue({ _sum: { delta: 17 } });
    expect(await currentStock({ productId: "p" })).toBe(17);
  });

  it("returns 0 when no movements exist", async () => {
    m.stockMovement.aggregate.mockResolvedValue({ _sum: { delta: null } });
    expect(await currentStock({ productId: "p" })).toBe(0);
  });

  it("filters by variant when given", async () => {
    m.stockMovement.aggregate.mockResolvedValue({ _sum: { delta: 5 } });
    await currentStock({ productId: "p", variantId: "v1" });
    const arg = m.stockMovement.aggregate.mock.calls.at(-1)![0];
    expect(arg.where).toMatchObject({ productId: "p", variantId: "v1" });
  });
});

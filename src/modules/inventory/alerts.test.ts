import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    product: { findMany: vi.fn() },
    stockMovement: { aggregate: vi.fn() },
  },
}));

import { findLowStockProducts } from "./alerts";
import { db } from "@/lib/db";
const m = db as unknown as {
  product: { findMany: ReturnType<typeof vi.fn> };
  stockMovement: { aggregate: ReturnType<typeof vi.fn> };
};

describe("findLowStockProducts", () => {
  it("returns products where current stock < minStock", async () => {
    m.product.findMany.mockResolvedValue([
      { id: "p1", name: "A", minStock: 5 },
      { id: "p2", name: "B", minStock: 10 },
    ]);
    m.stockMovement.aggregate
      .mockResolvedValueOnce({ _sum: { delta: 3 } })   // p1 below
      .mockResolvedValueOnce({ _sum: { delta: 20 } }); // p2 above
    const low = await findLowStockProducts();
    expect(low.map((p) => p.id)).toEqual(["p1"]);
    expect(low[0]).toMatchObject({ current: 3, minStock: 5 });
  });

  it("excludes products with minStock<=0 (never alert on zero floor)", async () => {
    m.product.findMany.mockResolvedValue([{ id: "p3", name: "C", minStock: 0 }]);
    m.stockMovement.aggregate.mockResolvedValueOnce({ _sum: { delta: null } });
    const low = await findLowStockProducts();
    expect(low).toEqual([]);
  });

  it("treats null delta sum as zero stock for the comparison", async () => {
    m.product.findMany.mockResolvedValue([{ id: "p4", name: "D", minStock: 3 }]);
    m.stockMovement.aggregate.mockResolvedValueOnce({ _sum: { delta: null } });
    const low = await findLowStockProducts();
    expect(low).toEqual([
      { id: "p4", name: "D", minStock: 3, current: 0 },
    ]);
  });
});

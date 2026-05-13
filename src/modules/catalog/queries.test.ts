import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    product: {
      findMany: vi.fn().mockResolvedValue([
        { id: "p1", sku: "A", name: "Tasse", description: null, minStock: 5, active: true,
          images: [{ url: "x.png", sortOrder: 0 }], variants: [], createdAt: new Date(), updatedAt: new Date() },
      ]),
      findUnique: vi.fn(),
    },
    stockMovement: { aggregate: vi.fn().mockResolvedValue({ _sum: { delta: 10 } }) },
  },
}));

import { listProductsWithStock } from "./queries";

describe("listProductsWithStock", () => {
  it("joins current stock into each product", async () => {
    const rows = await listProductsWithStock();
    expect(rows[0]).toMatchObject({ id: "p1", current: 10 });
  });
});

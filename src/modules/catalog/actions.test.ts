import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    product: {
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "p1", ...data })),
      update: vi.fn().mockResolvedValue({ id: "p1" }),
      findUnique: vi.fn(),
    },
    productVariant: { create: vi.fn().mockResolvedValue({ id: "v1" }), deleteMany: vi.fn(), createMany: vi.fn() },
    stockMovement: { create: vi.fn().mockResolvedValue({ id: "m1" }) },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error("NEXT_REDIRECT:" + url);
  }),
}));

import { createProduct, archiveProduct } from "./actions";
import { db } from "@/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const m = db as any;

beforeEach(() => {
  for (const k of Object.values(m)) {
    for (const fn of Object.values(k as object)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (fn as any).mockClear === "function") (fn as any).mockClear();
    }
  }
});

describe("createProduct", () => {
  it("creates product, variants and initial stock movement", async () => {
    await expect(
      createProduct({
        sku: "MUG-001",
        name: "Tasse",
        minStock: 5,
        variants: [{ label: "S", minStock: 0 }, { label: "L", minStock: 0 }],
        initialStock: 12,
      }, "actor-1")
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(m.product.create).toHaveBeenCalled();
    expect(m.productVariant.createMany).toHaveBeenCalled();
    expect(m.stockMovement.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ reason: "initial", delta: 12 }),
    }));
  });

  it("rejects invalid SKU", async () => {
    await expect(createProduct({
      sku: "with spaces",
      name: "x",
      minStock: 0,
      variants: [],
      initialStock: 0,
    } as never, "actor-1")).rejects.toThrow();
  });
});

describe("archiveProduct", () => {
  it("sets active=false and writes audit log", async () => {
    await archiveProduct("p1", "actor-1");
    expect(m.product.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "p1" }, data: { active: false },
    }));
    expect(m.auditLog.create).toHaveBeenCalled();
  });
});


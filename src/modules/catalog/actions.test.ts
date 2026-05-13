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
    category: { findUnique: vi.fn() },
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

describe("createProduct with category", () => {
  beforeEach(() => {
    m.category.findUnique.mockResolvedValue({
      id: "cat-food",
      attributeSchema: [
        { key: "mhd",      label: "MHD",  type: "date",    sortOrder: 1 },
        { key: "packSize", label: "Pack", type: "number",  sortOrder: 2, min: 1 },
        { key: "bio",      label: "Bio",  type: "boolean", sortOrder: 3 },
      ],
      variantTemplate: null,
    });
  });

  it("creates with valid attributes", async () => {
    await expect(createProduct({
      sku: "BR-001", name: "Brezel", minStock: 0, variants: [], initialStock: 0,
      categoryId: "cat-food",
      attributes: { mhd: "2026-12-31", packSize: 10, bio: true },
    }, "actor-1")).rejects.toThrow("NEXT_REDIRECT");
    expect(m.product.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        categoryId: "cat-food",
        attributes: expect.objectContaining({ mhd: "2026-12-31", packSize: 10, bio: true }),
      }),
    }));
  });

  it("rejects invalid attribute (bad date)", async () => {
    await expect(createProduct({
      sku: "BR-002", name: "X", minStock: 0, variants: [], initialStock: 0,
      categoryId: "cat-food",
      attributes: { mhd: "31.12.2026" },
    }, "actor-1")).rejects.toThrow();
  });

  it("strips unknown attribute keys silently", async () => {
    await expect(createProduct({
      sku: "BR-003", name: "X", minStock: 0, variants: [], initialStock: 0,
      categoryId: "cat-food",
      attributes: { mhd: "2026-12-31", foo: "drop" },
    }, "actor-1")).rejects.toThrow("NEXT_REDIRECT");
    const callArg = m.product.create.mock.calls[0][0].data.attributes;
    expect(callArg.foo).toBeUndefined();
    expect(callArg.mhd).toBe("2026-12-31");
  });

  it("creates without category (attributes ignored)", async () => {
    await expect(createProduct({
      sku: "FR-001", name: "Frei", minStock: 0, variants: [], initialStock: 0,
      categoryId: null,
      attributes: { something: "ignored" },
    }, "actor-1")).rejects.toThrow("NEXT_REDIRECT");
    const callArg = m.product.create.mock.calls[0][0].data;
    expect(callArg.categoryId).toBeNull();
    expect(callArg.attributes).toEqual({});
  });
});


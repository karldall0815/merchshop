import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    product: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { listCategories, getCategoryById, getCategoryWithUsage, getProductsUsingAttributeKey } from "./queries";
import { db } from "@/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const m = db as any;

beforeEach(() => {
  for (const k of Object.values(m)) for (const fn of Object.values(k as object)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (fn as any).mockClear === "function") (fn as any).mockClear();
  }
});

describe("listCategories", () => {
  it("returns active categories sorted by sortOrder, name", async () => {
    m.category.findMany.mockResolvedValue([{ id: "1", slug: "a", name: "A" }]);
    const res = await listCategories({ activeOnly: true });
    expect(m.category.findMany).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    expect(res).toEqual([{ id: "1", slug: "a", name: "A" }]);
  });

  it("includes inactive when activeOnly=false", async () => {
    m.category.findMany.mockResolvedValue([]);
    await listCategories({ activeOnly: false });
    expect(m.category.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  });
});

describe("getCategoryById", () => {
  it("delegates to findUnique", async () => {
    m.category.findUnique.mockResolvedValue({ id: "x" });
    const res = await getCategoryById("x");
    expect(m.category.findUnique).toHaveBeenCalledWith({ where: { id: "x" } });
    expect(res).toEqual({ id: "x" });
  });
});

describe("getCategoryWithUsage", () => {
  it("returns category plus productCount", async () => {
    m.category.findUnique.mockResolvedValue({ id: "x", name: "T" });
    m.product.count.mockResolvedValue(7);
    const res = await getCategoryWithUsage("x");
    expect(res).toEqual({ id: "x", name: "T", productCount: 7 });
    expect(m.product.count).toHaveBeenCalledWith({ where: { categoryId: "x" } });
  });

  it("returns null when category missing", async () => {
    m.category.findUnique.mockResolvedValue(null);
    expect(await getCategoryWithUsage("x")).toBeNull();
  });
});

describe("getProductsUsingAttributeKey", () => {
  it("queries products in category whose attributes have the key set", async () => {
    m.product.findMany.mockResolvedValue([{ id: "p1", name: "Brezel" }]);
    const res = await getProductsUsingAttributeKey("cat-id", "mhd");
    expect(m.product.findMany).toHaveBeenCalledWith({
      where: {
        categoryId: "cat-id",
        attributes: { path: ["mhd"], not: null },
      },
      select: { id: true, sku: true, name: true },
    });
    expect(res).toEqual([{ id: "p1", name: "Brezel" }]);
  });
});

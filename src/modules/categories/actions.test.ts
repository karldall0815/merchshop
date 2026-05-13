import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    category: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createCategory, updateCategory, archiveCategory, deleteCategory } from "./actions";
import { db } from "@/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const m = db as any;

beforeEach(() => {
  for (const k of Object.values(m)) {
    if (typeof k !== "object" || k === null) continue;
    for (const fn of Object.values(k as object)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (fn as any).mockClear === "function") (fn as any).mockClear();
    }
  }
});

describe("createCategory", () => {
  it("creates category and writes audit log", async () => {
    m.category.create.mockResolvedValue({ id: "c1", slug: "neu", name: "Neu" });
    const res = await createCategory({
      slug: "neu", name: "Neu", sortOrder: 0,
      attributeSchema: [], variantTemplate: null,
    }, "actor-1");
    expect(res.id).toBe("c1");
    expect(m.category.create).toHaveBeenCalled();
    expect(m.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ entity: "Category", action: "create" }),
    }));
  });

  it("rejects duplicate key in attributeSchema", async () => {
    await expect(createCategory({
      slug: "x", name: "X", sortOrder: 0, variantTemplate: null,
      attributeSchema: [
        { key: "k", label: "K1", type: "text", sortOrder: 1 },
        { key: "k", label: "K2", type: "text", sortOrder: 2 },
      ],
    }, "a")).rejects.toThrow();
  });
});

describe("updateCategory", () => {
  beforeEach(() => {
    m.category.findUnique.mockResolvedValue({
      id: "c1",
      slug: "lebensmittel",
      name: "Lebensmittel",
      isBuiltin: false,
      attributeSchema: [
        { key: "mhd",      label: "MHD",     type: "date",   sortOrder: 1 },
        { key: "packSize", label: "Pack",    type: "number", sortOrder: 2 },
      ],
      variantTemplate: null,
    });
  });

  it("returns needs_confirmation when removing a field used by products", async () => {
    m.product.findMany.mockResolvedValue([{ id: "p1", sku: "S1", name: "Brezel" }]);
    const res = await updateCategory({
      id: "c1",
      slug: "lebensmittel", name: "Lebensmittel", sortOrder: 0,
      attributeSchema: [
        { key: "mhd", label: "MHD", type: "date", sortOrder: 1 },
      ],
      variantTemplate: null,
      confirmAffectedProducts: false,
    }, "actor-1");
    expect(res).toEqual({
      status: "needs_confirmation",
      removedKeys: ["packSize"],
      affectedProducts: [{ id: "p1", sku: "S1", name: "Brezel" }],
    });
    expect(m.category.update).not.toHaveBeenCalled();
  });

  it("strips removed keys when confirmed", async () => {
    m.product.findMany.mockResolvedValue([
      { id: "p1", sku: "S1", name: "Brezel", attributes: { mhd: "2026-12-31", packSize: 10 } },
    ]);
    m.category.update.mockResolvedValue({ id: "c1" });
    const res = await updateCategory({
      id: "c1",
      slug: "lebensmittel", name: "Lebensmittel", sortOrder: 0,
      attributeSchema: [
        { key: "mhd", label: "MHD", type: "date", sortOrder: 1 },
      ],
      variantTemplate: null,
      confirmAffectedProducts: true,
    }, "actor-1");
    expect(res.status).toBe("ok");
    expect(m.category.update).toHaveBeenCalled();
    expect(m.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ entity: "Category", action: "update" }),
    }));
  });

  it("updates straight when only adding fields (no confirmation needed)", async () => {
    m.product.findMany.mockResolvedValue([]);
    m.category.update.mockResolvedValue({ id: "c1" });
    const res = await updateCategory({
      id: "c1",
      slug: "lebensmittel", name: "Lebensmittel", sortOrder: 0,
      attributeSchema: [
        { key: "mhd",      label: "MHD",  type: "date",    sortOrder: 1 },
        { key: "packSize", label: "Pack", type: "number",  sortOrder: 2 },
        { key: "bio",      label: "Bio",  type: "boolean", sortOrder: 3 },
      ],
      variantTemplate: null,
      confirmAffectedProducts: false,
    }, "actor-1");
    expect(res.status).toBe("ok");
  });
});

describe("archiveCategory", () => {
  it("sets active=false", async () => {
    m.category.findUnique.mockResolvedValue({ id: "c1", isBuiltin: false, active: true });
    m.category.update.mockResolvedValue({ id: "c1", active: false });
    await archiveCategory("c1", "actor-1");
    expect(m.category.update).toHaveBeenCalledWith({
      where: { id: "c1" }, data: { active: false },
    });
  });
});

describe("deleteCategory", () => {
  it("refuses to delete builtin", async () => {
    m.category.findUnique.mockResolvedValue({ id: "b1", isBuiltin: true });
    await expect(deleteCategory("b1", true, "actor-1")).rejects.toThrow(/builtin/i);
  });

  it("returns needs_confirmation when products linked and not confirmed", async () => {
    m.category.findUnique.mockResolvedValue({ id: "c1", isBuiltin: false });
    m.product.findMany.mockResolvedValue([{ id: "p1", sku: "S1", name: "X" }]);
    const res = await deleteCategory("c1", false, "actor-1");
    expect(res.status).toBe("needs_confirmation");
    if (res.status === "needs_confirmation") {
      expect(res.affectedProducts).toHaveLength(1);
    }
  });

  it("nulls categoryId on products when confirmed", async () => {
    m.category.findUnique.mockResolvedValue({ id: "c1", isBuiltin: false });
    m.product.findMany.mockResolvedValue([{ id: "p1", sku: "S1", name: "X" }]);
    m.product.updateMany.mockResolvedValue({ count: 1 });
    m.category.delete.mockResolvedValue({ id: "c1" });
    const res = await deleteCategory("c1", true, "actor-1");
    expect(res.status).toBe("ok");
    expect(m.product.updateMany).toHaveBeenCalledWith({
      where: { categoryId: "c1" }, data: { categoryId: null },
    });
    expect(m.category.delete).toHaveBeenCalled();
  });
});

import { describe, expect, it } from "vitest";
import { parseShopFilters, filtersToPrismaWhere } from "./shop-filters";
import type { AttributeSchemaItem } from "@/modules/categories/defaults";

describe("parseShopFilters", () => {
  it("parses categoryId and attribute params from URLSearchParams", () => {
    const sp = new URLSearchParams("cat=cat-1&attr.bio=true&attr.mhd.gte=2026-06-01&attr.mhd.lte=2026-12-31&attr.qty.min=5&attr.color=red&attr.tags=a&attr.tags=b");
    const f = parseShopFilters(sp);
    expect(f.categoryId).toBe("cat-1");
    expect(f.attrFilters).toMatchObject({
      bio: { eq: "true" },
      mhd: { gte: "2026-06-01", lte: "2026-12-31" },
      qty: { min: "5" },
      color: { eq: "red" },
      tags: { in: ["a","b"] },
    });
  });
});

describe("filtersToPrismaWhere", () => {
  const schema: AttributeSchemaItem[] = [
    { key: "bio",   label: "Bio",   type: "boolean", sortOrder: 1 },
    { key: "mhd",   label: "MHD",   type: "date",    sortOrder: 2 },
    { key: "qty",   label: "Anzahl",type: "number",  sortOrder: 3 },
    { key: "color", label: "Farbe", type: "select",  sortOrder: 4,
      options: [{ value: "red", label: "Rot" }, { value: "blue", label: "Blau" }] },
    { key: "tags",  label: "Tags",  type: "multiselect", sortOrder: 5,
      options: [{ value: "a", label: "A" }, { value: "b", label: "B" }] },
  ];

  it("builds boolean filter", () => {
    const w = filtersToPrismaWhere({ categoryId: "cat-1", attrFilters: { bio: { eq: "true" } } }, schema);
    expect(w).toEqual({
      categoryId: "cat-1",
      AND: [{ attributes: { path: ["bio"], equals: true } }],
    });
  });

  it("builds date range filter", () => {
    const w = filtersToPrismaWhere({ categoryId: "cat-1", attrFilters: { mhd: { gte: "2026-06-01" } } }, schema);
    expect(w).toEqual({
      categoryId: "cat-1",
      AND: [{ attributes: { path: ["mhd"], gte: "2026-06-01" } }],
    });
  });

  it("builds select equality", () => {
    const w = filtersToPrismaWhere({ categoryId: "cat-1", attrFilters: { color: { eq: "red" } } }, schema);
    expect(w).toEqual({
      categoryId: "cat-1",
      AND: [{ attributes: { path: ["color"], equals: "red" } }],
    });
  });

  it("builds multiselect array_contains-any", () => {
    const w = filtersToPrismaWhere({ categoryId: "cat-1", attrFilters: { tags: { in: ["a","b"] } } }, schema);
    expect(w).toEqual({
      categoryId: "cat-1",
      AND: [{ OR: [
        { attributes: { path: ["tags"], array_contains: ["a"] } },
        { attributes: { path: ["tags"], array_contains: ["b"] } },
      ] }],
    });
  });

  it("no filters → just categoryId", () => {
    const w = filtersToPrismaWhere({ categoryId: "cat-1", attrFilters: {} }, schema);
    expect(w).toEqual({ categoryId: "cat-1" });
  });
});

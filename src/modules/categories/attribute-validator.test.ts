import { describe, expect, it } from "vitest";
import { buildAttributeValidator } from "./attribute-validator";
import type { AttributeSchemaItem } from "./defaults";

describe("buildAttributeValidator", () => {
  const schema: AttributeSchemaItem[] = [
    { key: "title",   label: "Titel",   type: "text",        sortOrder: 1 },
    { key: "notes",   label: "Notizen", type: "longtext",    sortOrder: 2 },
    { key: "link",    label: "Link",    type: "url",         sortOrder: 3 },
    { key: "qty",     label: "Anzahl",  type: "number",      sortOrder: 4, min: 1, max: 100 },
    { key: "date",    label: "Datum",   type: "date",        sortOrder: 5 },
    { key: "bio",     label: "Bio",     type: "boolean",     sortOrder: 6 },
    { key: "color",   label: "Farbe",   type: "select",      sortOrder: 7,
      options: [{ value: "r", label: "Rot" }, { value: "b", label: "Blau" }] },
    { key: "tags",    label: "Tags",    type: "multiselect", sortOrder: 8,
      options: [{ value: "a", label: "A" }, { value: "b", label: "B" }] },
  ];

  it("accepts valid input for every type", () => {
    const v = buildAttributeValidator(schema);
    const result = v.parse({
      title: "Hallo",
      notes: "lange Notiz",
      link: "https://example.com",
      qty: 5,
      date: "2026-12-31",
      bio: true,
      color: "r",
      tags: ["a", "b"],
    });
    expect(result.title).toBe("Hallo");
    expect(result.qty).toBe(5);
    expect(result.tags).toEqual(["a", "b"]);
  });

  it("rejects out-of-range number", () => {
    const v = buildAttributeValidator(schema);
    expect(() => v.parse({ qty: 200 })).toThrow();
  });

  it("rejects malformed date", () => {
    const v = buildAttributeValidator(schema);
    expect(() => v.parse({ date: "31.12.2026" })).toThrow();
  });

  it("rejects unknown select option", () => {
    const v = buildAttributeValidator(schema);
    expect(() => v.parse({ color: "green" })).toThrow();
  });

  it("rejects bad URL", () => {
    const v = buildAttributeValidator(schema);
    expect(() => v.parse({ link: "not a url" })).toThrow();
  });

  it("accepts empty input (all optional, no required)", () => {
    const v = buildAttributeValidator(schema);
    expect(v.parse({})).toEqual({});
  });

  it("treats empty string as undefined for text", () => {
    const v = buildAttributeValidator(schema);
    const out = v.parse({ title: "" });
    expect(out.title).toBeUndefined();
  });

  it("strips unknown keys silently", () => {
    const v = buildAttributeValidator(schema);
    const out = v.parse({ title: "x", unknown: "drop me" }) as Record<string, unknown>;
    expect(out.unknown).toBeUndefined();
    expect(out.title).toBe("x");
  });

  it("enforces required when flag set", () => {
    const req: AttributeSchemaItem[] = [
      { key: "must", label: "Pflicht", type: "text", required: true, sortOrder: 1 },
    ];
    const v = buildAttributeValidator(req);
    expect(() => v.parse({})).toThrow();
    expect(v.parse({ must: "ok" }).must).toBe("ok");
  });
});

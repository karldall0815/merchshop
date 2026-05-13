import type { AttributeSchemaItem } from "@/modules/categories/defaults";

export interface ParsedFilters {
  categoryId: string | null;
  attrFilters: Record<string, { eq?: string; gte?: string; lte?: string; min?: string; max?: string; in?: string[] }>;
}

export function parseShopFilters(sp: URLSearchParams): ParsedFilters {
  const out: ParsedFilters = { categoryId: sp.get("cat") || null, attrFilters: {} };
  for (const [key, val] of sp.entries()) {
    if (!key.startsWith("attr.")) continue;
    const rest = key.substring(5);
    const parts = rest.split(".");
    const attrKey = parts[0];
    if (!attrKey) continue;
    const op = parts[1] ?? "eq";
    out.attrFilters[attrKey] = out.attrFilters[attrKey] ?? {};
    const existing = out.attrFilters[attrKey]!;
    if (op === "eq") {
      if (existing.eq) {
        existing.in = existing.in ? [...existing.in, val] : [existing.eq, val];
        delete existing.eq;
      } else if (existing.in) {
        existing.in.push(val);
      } else {
        existing.eq = val;
      }
    } else {
      (existing as Record<string, string>)[op] = val;
    }
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filtersToPrismaWhere(filters: ParsedFilters, schema: AttributeSchemaItem[]): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (filters.categoryId) where.categoryId = filters.categoryId;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ands: any[] = [];
  for (const [key, ops] of Object.entries(filters.attrFilters)) {
    const item = schema.find((s) => s.key === key);
    if (!item) continue;
    switch (item.type) {
      case "boolean":
        if (ops.eq) ands.push({ attributes: { path: [key], equals: ops.eq === "true" } });
        break;
      case "number": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cond: any = {};
        if (ops.min) cond.gte = Number(ops.min);
        if (ops.max) cond.lte = Number(ops.max);
        if (Object.keys(cond).length) ands.push({ attributes: { path: [key], ...cond } });
        break;
      }
      case "date": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cond: any = {};
        if (ops.gte) cond.gte = ops.gte;
        if (ops.lte) cond.lte = ops.lte;
        if (Object.keys(cond).length) ands.push({ attributes: { path: [key], ...cond } });
        break;
      }
      case "select":
      case "text":
      case "longtext":
      case "url":
        if (ops.eq) ands.push({ attributes: { path: [key], equals: ops.eq } });
        else if (ops.in) ands.push({ OR: ops.in.map((v) => ({ attributes: { path: [key], equals: v } })) });
        break;
      case "multiselect":
        if (ops.in) ands.push({ OR: ops.in.map((v) => ({ attributes: { path: [key], array_contains: [v] } })) });
        else if (ops.eq) ands.push({ attributes: { path: [key], array_contains: [ops.eq] } });
        break;
    }
  }
  if (ands.length > 0) where.AND = ands;
  return where;
}

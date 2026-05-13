import { z, type ZodTypeAny } from "zod";
import type { AttributeSchemaItem } from "./defaults";

function fieldValidator(item: AttributeSchemaItem): ZodTypeAny {
  let v: ZodTypeAny;
  switch (item.type) {
    case "text": {
      v = z.string().max(item.maxLength ?? 200);
      break;
    }
    case "longtext": {
      v = z.string().max(item.maxLength ?? 4000);
      break;
    }
    case "url": {
      v = z.string().url();
      break;
    }
    case "number": {
      let n: z.ZodNumber = z.coerce.number();
      if (item.step == null || item.step === 1) n = n.int();
      if (item.min != null) n = n.min(item.min);
      if (item.max != null) n = n.max(item.max);
      v = n;
      break;
    }
    case "date": {
      v = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
      break;
    }
    case "boolean": {
      v = z.boolean();
      break;
    }
    case "select": {
      const values = (item.options ?? []).map((o) => o.value);
      if (values.length === 0) v = z.string();
      else v = z.enum(values as [string, ...string[]]);
      break;
    }
    case "multiselect": {
      const values = (item.options ?? []).map((o) => o.value);
      const inner = values.length === 0 ? z.string() : z.enum(values as [string, ...string[]]);
      v = z.array(inner);
      break;
    }
  }
  return v;
}

/**
 * Build a Zod object validator from a category's attribute schema.
 * - Optional fields normalize empty string / null / [] to undefined and strip them
 * - Unknown keys are stripped silently
 * - required: true → field becomes mandatory
 */
export function buildAttributeValidator(schema: AttributeSchemaItem[]) {
  const shape: Record<string, ZodTypeAny> = {};
  for (const item of schema) {
    const base = fieldValidator(item);
    if (item.required) {
      shape[item.key] = base;
    } else {
      const prep = z.preprocess((val) => {
        if (val === "" || val === null) return undefined;
        if (Array.isArray(val) && val.length === 0) return undefined;
        return val;
      }, base.optional());
      shape[item.key] = prep;
    }
  }
  return z.object(shape).strip();
}

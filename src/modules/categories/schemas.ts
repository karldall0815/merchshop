import { z } from "zod";

export const attributeOptionSchema = z.object({
  value: z.string().min(1).max(60).regex(/^[a-z0-9][a-zA-Z0-9_-]*$/),
  label: z.string().min(1).max(80),
});

export const attributeSchemaItemSchema = z.object({
  key: z.string().min(1).max(40).regex(/^[a-z][a-zA-Z0-9_]*$/),
  label: z.string().min(1).max(80),
  type: z.enum(["text","longtext","url","number","date","boolean","select","multiselect"]),
  required: z.boolean().optional(),
  helpText: z.string().max(400).optional(),
  sortOrder: z.number().int().min(0).max(10_000),
  options: z.array(attributeOptionSchema).min(2).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  maxLength: z.number().int().min(1).max(20_000).optional(),
}).refine((d) => {
  if (d.type === "select" || d.type === "multiselect") return d.options && d.options.length >= 2;
  return true;
}, { message: "select/multiselect need at least 2 options" })
  .refine((d) => d.min == null || d.max == null || d.min <= d.max, { message: "min must be ≤ max" });

export const variantTemplateSchema = z.object({
  axisName: z.string().min(1).max(40),
  defaults: z.array(z.string().min(1).max(40)).max(50),
});

export const categoryCreateSchema = z.object({
  slug: z.string().min(1).max(60).regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string().min(1).max(80),
  description: z.string().max(400).optional(),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  attributeSchema: z.array(attributeSchemaItemSchema).superRefine((arr, ctx) => {
    const keys = new Set<string>();
    arr.forEach((item, i) => {
      if (keys.has(item.key)) ctx.addIssue({
        code: "custom", message: `Duplicate key '${item.key}'`, path: [i, "key"],
      });
      keys.add(item.key);
    });
  }).default([]),
  variantTemplate: variantTemplateSchema.nullable().default(null),
});

export const categoryUpdateSchema = categoryCreateSchema.extend({
  id: z.string().min(1),
  active: z.boolean().optional(),
  confirmAffectedProducts: z.boolean().default(false),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type AttributeSchemaItemInput = z.infer<typeof attributeSchemaItemSchema>;

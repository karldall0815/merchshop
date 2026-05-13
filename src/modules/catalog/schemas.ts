import { z } from "zod";

export const productCreateSchema = z.object({
  sku: z.string().min(1).max(80).regex(/^[a-zA-Z0-9\-_]+$/),
  name: z.string().min(1).max(160),
  description: z.string().max(4000).optional(),
  minStock: z.number().int().min(0).default(0),
  variants: z.array(z.object({
    label: z.string().min(1).max(40),
    minStock: z.number().int().min(0).default(0),
  })).default([]),
  initialStock: z.number().int().min(0).default(0),
  categoryId: z.string().nullable().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export const productUpdateSchema = productCreateSchema.extend({
  id: z.string().min(1),
  active: z.boolean().optional(),
  confirmCategoryChange: z.boolean().optional(),
}).omit({ initialStock: true });

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

import { z } from "zod";

export const createSupportReportSchema = z.object({
  context: z.string().max(2000).optional(),
  description: z.string().min(1).max(4000),
  url: z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
  fromAutoReportDigest: z.string().max(120).optional(),
});

export type CreateSupportReportInput = z.infer<typeof createSupportReportSchema>;

export const resolveSupportReportSchema = z.object({
  id: z.string().min(1),
});

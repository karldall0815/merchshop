"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { recordMovement } from "./movements";
import { getCurrentUser } from "@/modules/auth/session";

const schema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  delta: z.number().int().refine(d => d !== 0, "delta must not be zero"),
  comment: z.string().min(3, "Bitte einen kurzen Grund angeben."),
});

export async function correctStock(raw: unknown) {
  const data = schema.parse(raw);
  const user = await getCurrentUser();
  if (!user || (user.role !== "agentur" && user.role !== "admin")) {
    throw new Error("forbidden");
  }
  await recordMovement({
    productId: data.productId,
    variantId: data.variantId,
    delta: data.delta,
    reason: "correction",
    comment: data.comment,
    actorId: user.id,
  });
  revalidatePath(`/inventory/${data.productId}`);
  revalidatePath("/inventory");
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { markDelivered } from "@/modules/orders/fulfillment";

export const dynamic = "force-dynamic";

// Tracking-webhook stub. Carrier-side integration (DHL push, Sendcloud
// callback, …) lives behind this same shape: a JOBS_TOKEN gated endpoint
// that takes a tracking number (or orderNumber as fallback) and flips
// the matching shipped order to delivered.
//
// MVP supports:
//   POST /api/jobs/delivery-webhook?token=<JOBS_TOKEN>
//   { "trackingNumber": "..." }   OR   { "orderNumber": "MS-2026-00001" }
// Real carrier payloads will be normalised in a thin adapter before
// reaching this route.

const bodySchema = z
  .object({
    trackingNumber: z.string().min(1).optional(),
    orderNumber: z.string().min(1).optional(),
  })
  .refine((v) => v.trackingNumber || v.orderNumber, {
    message: "trackingNumber or orderNumber required",
  });

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const expected = process.env.JOBS_TOKEN;
  if (!expected || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let parsed;
  try {
    parsed = bodySchema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const where = parsed.data.trackingNumber
    ? { trackingNumber: parsed.data.trackingNumber }
    : { orderNumber: parsed.data.orderNumber! };
  const order = await db.order.findFirst({ where, select: { id: true, status: true } });
  if (!order) {
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }
  if (order.status !== "shipped") {
    return NextResponse.json(
      { error: `order is ${order.status}, not shipped` },
      { status: 409 },
    );
  }
  try {
    await markDelivered(order.id, "system");
    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "transition failed" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { cartItemCount } from "@/modules/orders/cart";

export const dynamic = "force-dynamic";

export async function GET() {
  const count = await cartItemCount();
  return NextResponse.json({ count });
}

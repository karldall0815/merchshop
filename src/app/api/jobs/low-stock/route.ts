import { NextRequest, NextResponse } from "next/server";
import { findLowStockProducts, notifyAdmins } from "@/modules/inventory/alerts";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const expected = process.env.JOBS_TOKEN;
  if (!expected || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const low = await findLowStockProducts();
    const result = await notifyAdmins(low);
    return NextResponse.json({
      low: low.length,
      delivered: result.delivered,
      recipients: result.recipients.length,
      ...(result.skipped ? { skipped: result.skipped } : {}),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}

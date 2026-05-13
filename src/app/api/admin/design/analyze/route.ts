import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { analyzeWebsite, CrawlError } from "@/modules/admin/design/crawler";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: { url?: string };
  try {
    body = (await req.json()) as { url?: string };
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const url = body.url?.trim();
  if (!url) return NextResponse.json({ error: "url missing" }, { status: 400 });
  try {
    const result = await analyzeWebsite(url);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof CrawlError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "internal" },
      { status: 500 },
    );
  }
}

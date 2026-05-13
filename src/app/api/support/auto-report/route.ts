import { NextResponse } from "next/server";
import { reportErrorToSupport } from "@/modules/support/auto-report";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  await reportErrorToSupport({
    url: String(body.url ?? ""),
    userAgent: String(body.userAgent ?? ""),
    digest: typeof body.digest === "string" ? body.digest : undefined,
    message: typeof body.message === "string" ? body.message : undefined,
    stack: typeof body.stack === "string" ? body.stack : undefined,
  });
  return NextResponse.json({ ok: true });
}

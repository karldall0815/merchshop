import { NextRequest, NextResponse } from "next/server";
import { getProductImage } from "@/lib/storage";

// Streams a product image back from MinIO. Bucket sits on the docker
// network, so the browser cannot fetch directly — this route is the
// public side of the upload pipeline (see /api/uploads/image).
//
// No auth check on read: image URLs are referenced from authenticated
// pages and otherwise contain a random suffix. Tightening to signed
// short-lived URLs is a later refinement.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ key: string[] }> }) {
  const { key: keyParts } = await ctx.params;
  const key = keyParts.join("/");
  try {
    const { body, contentType, contentLength } = await getProductImage(key);
    const headers: Record<string, string> = {
      "cache-control": "public, max-age=3600, immutable",
    };
    if (contentType) headers["content-type"] = contentType;
    if (contentLength !== undefined) headers["content-length"] = String(contentLength);
    return new NextResponse(body, { headers });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { hasRole } from "@/lib/rbac";
import { putProductImage } from "@/lib/storage";
import { attachProductImage } from "@/modules/catalog/images";

const MAX_SIZE = 8 * 1024 * 1024;

// Accepts a multipart upload (file + productId), validates auth + size +
// content-type, streams the body into MinIO server-side, and attaches the
// resulting image to the product in one round-trip. Browser never speaks
// to MinIO directly, so the bucket can stay on the internal docker network.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!hasRole(user, ["agentur", "admin"])) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });
  }

  const productId = String(form.get("productId") ?? "");
  const file = form.get("file");
  if (!productId || !(file instanceof File)) {
    return NextResponse.json({ error: "missing productId or file" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: `file exceeds ${MAX_SIZE} bytes` }, { status: 413 });
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const { publicPath } = await putProductImage({
      productId,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      body: buf,
    });
    await attachProductImage({ productId, url: publicPath });
    return NextResponse.json({ url: publicPath });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "upload failed" },
      { status: 400 },
    );
  }
}

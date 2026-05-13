import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { putProductImage } from "@/lib/storage";

const MAX_SIZE = 8 * 1024 * 1024;

// Logo uploads share the product-image bucket but live under a
// branding/ key prefix. Same MinIO-proxy retrieval path applies via
// /api/images/branding/<key>.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing file" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: `file exceeds ${MAX_SIZE} bytes` }, { status: 413 });
  }
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const { publicPath } = await putProductImage({
      productId: "branding",
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      body: buf,
    });
    return NextResponse.json({ url: publicPath });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "upload failed" },
      { status: 400 },
    );
  }
}

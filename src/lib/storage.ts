import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSetting } from "@/lib/settings";
import { randomBytes } from "node:crypto";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MiB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/svg+xml",
]);

async function s3Config() {
  const endpoint = await getSetting("storage.endpoint", { envVar: "S3_ENDPOINT" });
  const region = await getSetting("storage.region", { envVar: "S3_REGION" });
  const bucket = await getSetting("storage.bucket", { envVar: "S3_BUCKET" });
  const accessKey = await getSetting("storage.accessKey", { envVar: "S3_ACCESS_KEY" });
  const secretKey = await getSetting("storage.secretKey", { envVar: "S3_SECRET_KEY" });
  const pathStyle =
    (await getSetting("storage.forcePathStyle", { envVar: "S3_FORCE_PATH_STYLE" })) === "true";
  if (!endpoint || !bucket || !accessKey || !secretKey || !region) {
    throw new Error("storage settings incomplete");
  }
  const client = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: pathStyle,
  });
  return { client, bucket };
}

// Server-side upload. Browser POSTs the file to a Next.js API route; the
// route calls this to land bytes in MinIO. Returns the object key, which
// the app stores as a relative `/api/images/<key>` URL. This avoids the
// presigned-POST round-trip — MinIO doesn't have to be reachable from the
// browser, only from this container.
export async function putProductImage(opts: {
  productId: string;
  filename: string;
  contentType: string;
  body: Buffer | Uint8Array;
}): Promise<{ key: string; publicPath: string }> {
  if (opts.body.byteLength > MAX_SIZE) {
    throw new Error(`file size ${opts.body.byteLength} exceeds limit ${MAX_SIZE}`);
  }
  if (!ALLOWED_TYPES.has(opts.contentType)) {
    throw new Error(`content type ${opts.contentType} is not allowed`);
  }
  const { client, bucket } = await s3Config();
  const ext = opts.filename.split(".").pop()?.toLowerCase() ?? "bin";
  const random = randomBytes(8).toString("hex");
  const key = `products/${opts.productId}/${Date.now()}-${random}.${ext}`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: opts.body,
      ContentType: opts.contentType,
    }),
  );
  return { key, publicPath: `/api/images/${key}` };
}

// Streams an image back from MinIO. Browser hits `/api/images/<key>`, the
// route handler calls this to read from the internal MinIO endpoint and
// pipes the body back to the client.
export async function getProductImage(key: string): Promise<{ body: ReadableStream<Uint8Array>; contentType: string | undefined; contentLength: number | undefined }> {
  const { client, bucket } = await s3Config();
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!res.Body) throw new Error("image not found");
  // SDK returns a Node readable; cast to Web stream.
  return {
    body: res.Body.transformToWebStream(),
    contentType: res.ContentType,
    contentLength: res.ContentLength,
  };
}

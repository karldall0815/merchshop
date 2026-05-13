import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export type S3TestInput = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  forcePathStyle?: boolean;
};

export async function testS3(input: S3TestInput): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const client = new S3Client({
      endpoint: input.endpoint,
      region: input.region,
      credentials: { accessKeyId: input.accessKey, secretAccessKey: input.secretKey },
      forcePathStyle: input.forcePathStyle ?? true,
    });
    const key = `setup-test-${Date.now()}.txt`;
    await client.send(new PutObjectCommand({ Bucket: input.bucket, Key: key, Body: "ok" }));
    await client.send(new DeleteObjectCommand({ Bucket: input.bucket, Key: key }));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/settings", () => ({
  getSetting: vi.fn(async (key: string) => {
    const map: Record<string, string> = {
      "storage.endpoint": "http://minio:9000",
      "storage.region": "eu-central-1",
      "storage.bucket": "merchshop-images",
      "storage.accessKey": "ak",
      "storage.secretKey": "sk",
      "storage.forcePathStyle": "true",
    };
    return map[key] ?? null;
  }),
}));

// putProductImage performs a real S3 PUT, so we only test the input
// validation paths that don't need a live bucket. The full upload path
// is covered by the E2E suite once MinIO is reachable in CI.
describe("putProductImage validation", () => {
  it("rejects oversized uploads", async () => {
    const { putProductImage } = await import("./storage");
    const big = new Uint8Array(20 * 1024 * 1024);
    await expect(
      putProductImage({
        productId: "p1",
        filename: "huge.png",
        contentType: "image/png",
        body: big,
      }),
    ).rejects.toThrow(/exceeds/i);
  });

  it("rejects unknown content types", async () => {
    const { putProductImage } = await import("./storage");
    await expect(
      putProductImage({
        productId: "p1",
        filename: "exec.sh",
        contentType: "application/x-sh",
        body: new Uint8Array(100),
      }),
    ).rejects.toThrow(/not allowed/i);
  });
});

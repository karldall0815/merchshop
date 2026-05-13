"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";

// Single-shot multipart upload. The browser POSTs the file to a Next.js
// API route which forwards it to MinIO server-side; no presigned URL
// dance is needed since the bucket stays internal.
async function uploadImage(productId: string, file: File): Promise<void> {
  const form = new FormData();
  form.append("productId", productId);
  form.append("file", file);
  const res = await fetch("/api/uploads/image", { method: "POST", body: form });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `upload failed (${res.status})`);
  }
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/avif,image/svg+xml";

export function ImageUploader({ productId }: { productId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      try {
        await uploadImage(productId, file);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
      }
    });
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    if (pending) return;
    handleFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor="image-upload-input"
        onDragOver={(e) => {
          e.preventDefault();
          if (!pending) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition ${
          pending
            ? "cursor-wait border-muted-foreground/30 bg-muted/30"
            : dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/40 bg-muted/20 hover:border-foreground hover:bg-muted/40"
        }`}
      >
        {pending ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" strokeWidth={1.5} />
            <span className="text-sm font-medium">Lädt hoch…</span>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <div>
              <p className="font-medium">Bild auswählen oder hierher ziehen</p>
              <p className="mt-1 text-xs text-muted-foreground">
                PNG, JPEG, WebP, AVIF, SVG · max. 8 MiB
              </p>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          id="image-upload-input"
          type="file"
          accept={ACCEPT}
          disabled={pending}
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="sr-only"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Trash2 } from "lucide-react";
import { setBrandingLogo } from "@/modules/admin/design/actions";

async function uploadLogo(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/admin/branding/logo", { method: "POST", body: form });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `upload failed (${res.status})`);
  }
  const json = (await res.json()) as { url: string };
  return json.url;
}

export function BrandingForm({
  initialLogoUrl,
  initialReplaceWordmark,
}: {
  initialLogoUrl: string | null;
  initialReplaceWordmark: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [replace, setReplace] = useState(initialReplaceWordmark);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function commit(url: string | null, replaceFlag: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await setBrandingLogo({ url, replaceWordmark: replaceFlag });
        setLogoUrl(url);
        setReplace(replaceFlag);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
      }
    });
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      try {
        const url = await uploadLogo(file);
        await setBrandingLogo({ url, replaceWordmark: replace });
        setLogoUrl(url);
        if (inputRef.current) inputRef.current.value = "";
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload fehlgeschlagen");
      }
    });
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      {logoUrl && (
        <div className="flex items-center gap-4 rounded border p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Logo-Vorschau"
            className="h-12 w-auto max-w-[200px] object-contain"
          />
          <div className="flex-1">
            <p className="text-sm font-medium">Aktuelles Logo</p>
            <p className="break-all text-xs text-muted-foreground">{logoUrl}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => commit(null, false)}
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </div>
      )}

      <label
        htmlFor="logo-upload"
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition ${
          pending
            ? "cursor-wait border-muted-foreground/30 bg-muted/30"
            : "border-muted-foreground/40 bg-muted/20 hover:border-foreground hover:bg-muted/40"
        }`}
      >
        {pending ? (
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" strokeWidth={1.5} />
        ) : (
          <Upload className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
        )}
        <p className="text-sm font-medium">
          {pending ? "Lädt hoch…" : "Logo auswählen"}
        </p>
        <p className="text-xs text-muted-foreground">PNG, JPEG, WebP, SVG · max. 8 MiB</p>
        <input
          ref={inputRef}
          id="logo-upload"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          disabled={pending}
          onChange={(e) => onFile(e.target.files?.[0])}
          className="sr-only"
        />
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded border bg-background p-3 text-sm">
        <input
          type="checkbox"
          checked={replace}
          disabled={pending || !logoUrl}
          onChange={(e) => commit(logoUrl, e.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <div>
          <p className="font-medium">Logo ersetzt &quot;MerchShop&quot;-Schriftzug</p>
          <p className="text-xs text-muted-foreground">
            Bei aktiv: oben links steht nur das Logo. Bei inaktiv: Logo + Wortmarke
            nebeneinander.
          </p>
        </div>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

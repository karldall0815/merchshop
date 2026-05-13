"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyCustomTheme } from "@/modules/admin/design/actions";
import type { ThemeTokens } from "@/lib/theme";

type AnalyzeResponse = {
  ok: boolean;
  tokens?: ThemeTokens;
  font?: string | null;
  logoUrl?: string | null;
  note?: string;
  error?: string;
};

export function CrawlImporter() {
  const [url, setUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [applying, startApplying] = useTransition();

  function analyze() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const r = await fetch("/api/admin/design/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const json = (await r.json()) as AnalyzeResponse;
        if (!r.ok || !json.ok) {
          setError(json.error ?? `Fehler (${r.status})`);
          return;
        }
        setResult(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Netzwerkfehler");
      }
    });
  }

  function apply() {
    if (!result?.tokens) return;
    startApplying(async () => {
      await applyCustomTheme({
        tokens: result.tokens!,
        font: result.font ?? null,
        source: url,
      });
    });
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[260px] space-y-2">
          <Label htmlFor="crawl-url">Website-URL</Label>
          <Input
            id="crawl-url"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <Button onClick={analyze} disabled={pending || !url.trim()}>
          {pending ? "Analysiere…" : "Analysieren"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Holt CSS, Schriftarten und Logo-Kandidaten der Seite. Erkennt das Farbschema
        automatisch — bei schwer parsbaren Sites (CSS-in-JS) ggf. unvollständig.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result?.ok && result.tokens && (
        <div className="space-y-3 rounded border bg-background p-3">
          <p className="text-sm font-medium">Vorschau</p>

          <div className="flex flex-wrap gap-2">
            {(["background", "foreground", "primary", "card", "muted", "accent", "border"] as const).map(
              (k) => (
                <div key={k} className="text-center">
                  <span
                    className="inline-block h-10 w-10 rounded border"
                    style={{ background: result.tokens![k] }}
                    title={`${k}: ${result.tokens![k]}`}
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">{k}</p>
                </div>
              ),
            )}
          </div>

          <p className="text-sm">
            Schrift: <span className="font-mono">{result.font ?? "(keine erkannt)"}</span>
          </p>
          {result.note && <p className="text-xs text-amber-600">{result.note}</p>}

          <div className="flex gap-2">
            <Button onClick={apply} disabled={applying}>
              {applying ? "Wird angewendet…" : "Übernehmen"}
            </Button>
            <Button variant="ghost" onClick={() => setResult(null)} disabled={applying}>
              Verwerfen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormErrorBanner } from "@/components/forms/FormErrorBanner";
import { updateGeneralSettings } from "@/modules/admin/general-settings";
import type { ActionResult } from "@/lib/action-result";

interface Props {
  initial: { skuPrefix: string; skuPadding: number };
}

export function SkuSettingsForm({ initial }: Props) {
  const [pending, startTransition] = useTransition();
  const [skuPrefix, setSkuPrefix] = useState(initial.skuPrefix);
  const [skuPadding, setSkuPadding] = useState(String(initial.skuPadding));
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await updateGeneralSettings({
        skuPrefix,
        skuPadding: Number(skuPadding),
      });
      if (!res.ok) {
        setResult(res);
        return;
      }
      setSavedAt(new Date());
    });
  }

  const previewN = 1;
  const padding = Number(skuPadding) || 1;
  const preview = `${skuPrefix}${String(previewN).padStart(padding, "0")}`;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div className="space-y-2">
          <Label htmlFor="skuPrefix">SKU-Präfix</Label>
          <Input
            id="skuPrefix"
            value={skuPrefix}
            onChange={(e) => setSkuPrefix(e.target.value)}
            placeholder="z. B. ART-"
            maxLength={40}
            pattern="[A-Za-z0-9_\-]*"
          />
          <p className="text-xs text-muted-foreground">
            Nur Buchstaben, Ziffern, Bindestrich und Unterstrich.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="skuPadding">Ziffern-Stellen</Label>
          <Input
            id="skuPadding"
            type="number"
            value={skuPadding}
            onChange={(e) => setSkuPadding(e.target.value)}
            min={1}
            max={12}
          />
          <p className="text-xs text-muted-foreground">Mit führenden Nullen.</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Vorschau für nächste neue SKU:{" "}
        <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{preview}</code>
      </p>
      <FormErrorBanner result={result} />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Speichere…" : "Speichern"}
        </Button>
        {savedAt && (
          <span className="text-sm text-muted-foreground">
            ✓ Gespeichert um {savedAt.toLocaleTimeString("de-DE")}
          </span>
        )}
      </div>
    </form>
  );
}

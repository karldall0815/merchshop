"use client";

import { useState, useTransition } from "react";
import { correctStock } from "@/modules/inventory/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CorrectionDialog({ productId, variants }: { productId: string; variants: { id: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(fd: FormData) {
    setError(null);
    const delta = Number(fd.get("delta") ?? 0);
    const comment = String(fd.get("comment") ?? "");
    const variantId = String(fd.get("variantId") ?? "") || undefined;
    startTransition(async () => {
      try {
        await correctStock({ productId, variantId, delta, comment });
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "unbekannter Fehler");
      }
    });
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)} variant="outline">Bestand korrigieren</Button>;
  }
  return (
    <form action={onSubmit} className="space-y-3 rounded-lg border bg-card p-4">
      <h3 className="font-semibold">Bestand korrigieren</h3>
      {variants.length > 0 && (
        <div className="space-y-1">
          <Label htmlFor="variantId">Variante (optional)</Label>
          <select id="variantId" name="variantId" className="border rounded px-2 py-1 text-sm">
            <option value="">— gesamtes Produkt —</option>
            {variants.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor="delta">Delta (positive Zahl = Zugang, negative = Abgang)</Label>
        <Input id="delta" name="delta" type="number" required step={1} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="comment">Grund *</Label>
        <Input id="comment" name="comment" required minLength={3} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Speichern…" : "Speichern"}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Abbrechen</Button>
      </div>
    </form>
  );
}

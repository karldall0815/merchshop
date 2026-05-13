"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAndGoToCart } from "@/modules/orders/cart";

type Variant = { id: string; label: string; available: number };

export function AddToCartForm({
  productId,
  variants,
}: {
  productId: string;
  variants: Variant[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | undefined>(
    variants[0]?.id,
  );
  const [qty, setQty] = useState(1);

  const selectedVariant = variants.find((v) => v.id === variantId);
  const max = selectedVariant?.available ?? Infinity;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await addAndGoToCart({
          productId,
          variantId,
          quantity: qty,
        });
      } catch (err) {
        // next/navigation redirect throws — let it bubble.
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        setError(err instanceof Error ? err.message : "Hinzufügen fehlgeschlagen");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      {variants.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="variant">Variante</Label>
          <select
            id="variant"
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.available <= 0}>
                {v.label} {v.available <= 0 ? "(ausverkauft)" : `(${v.available} verfügbar)`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="qty">Menge</Label>
        <Input
          id="qty"
          type="number"
          min={1}
          max={isFinite(max) ? max : undefined}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          className="w-24"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={pending || max <= 0}>
        {pending ? "Lege in Warenkorb…" : "In den Warenkorb"}
      </Button>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { removeCartLine, updateCartLine } from "@/modules/orders/cart";

export function CartLineControls({
  itemId,
  quantity,
}: {
  itemId: string;
  quantity: number;
}) {
  const [pending, startTransition] = useTransition();
  const [qty, setQty] = useState(quantity);
  const [error, setError] = useState<string | null>(null);

  function commit(next: number) {
    setError(null);
    setQty(next);
    startTransition(async () => {
      try {
        await updateCartLine(itemId, next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update fehlgeschlagen");
      }
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      try {
        await removeCartLine(itemId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Entfernen fehlgeschlagen");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          value={qty}
          disabled={pending}
          onChange={(e) => commit(Math.max(1, Number(e.target.value) || 1))}
          className="w-20"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={remove}
          aria-label="Aus Warenkorb entfernen"
        >
          ×
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

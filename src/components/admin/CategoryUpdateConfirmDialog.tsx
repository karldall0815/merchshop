"use client";

import { Button } from "@/components/ui/button";

interface Props {
  removedKeys: string[];
  affectedProducts: { id: string; sku: string; name: string }[];
  onCancel: () => void;
  onConfirm: () => void;
}

export function CategoryUpdateConfirmDialog({ removedKeys, affectedProducts, onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="rounded-lg bg-background p-6 max-w-lg w-full space-y-4">
        <h2 className="text-lg font-semibold">Schema-Änderung bestätigen</h2>
        <p className="text-sm">
          Du entfernst <strong>{removedKeys.length}</strong> Feld(er):{" "}
          <span className="font-mono">{removedKeys.join(", ")}</span>
        </p>
        <p className="text-sm">
          <strong>{affectedProducts.length}</strong> Artikel haben Werte in diesen Feldern. Bei Speichern werden die Werte gelöscht:
        </p>
        <ul className="text-sm max-h-40 overflow-y-auto border rounded p-2 space-y-1">
          {affectedProducts.map((p) => (
            <li key={p.id}>{p.sku} — {p.name}</li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Abbrechen</Button>
          <Button onClick={onConfirm}>Trotzdem speichern</Button>
        </div>
      </div>
    </div>
  );
}

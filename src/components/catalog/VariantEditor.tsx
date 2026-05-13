"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type VariantRow = { label: string; minStock: number };

interface VariantEditorProps {
  value: VariantRow[];
  onChange: (next: VariantRow[]) => void;
}

export function VariantEditor({ value, onChange }: VariantEditorProps) {
  function addRow() {
    onChange([...value, { label: "", minStock: 0 }]);
  }

  function updateRow(index: number, patch: Partial<VariantRow>) {
    const next = value.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  }

  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <Label>Varianten</Label>
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="Bezeichnung (z. B. S, L, XL)"
                value={row.label}
                onChange={(e) => updateRow(i, { label: e.target.value })}
                className="flex-1"
              />
              <Input
                type="number"
                min={0}
                placeholder="Mindestbestand"
                value={row.minStock}
                onChange={(e) => updateRow(i, { minStock: Number(e.target.value) })}
                className="w-36"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="rounded p-1 text-muted-foreground hover:text-destructive"
                aria-label="Variante entfernen"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        + Variante hinzufügen
      </Button>
    </div>
  );
}

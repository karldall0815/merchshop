"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AttributeSchemaItem, AttributeType, AttributeOption } from "@/modules/categories/defaults";

const TYPES: { value: AttributeType; label: string }[] = [
  { value: "text",        label: "Text" },
  { value: "longtext",    label: "Mehrzeilig" },
  { value: "url",         label: "URL" },
  { value: "number",      label: "Zahl" },
  { value: "date",        label: "Datum" },
  { value: "boolean",     label: "Ja/Nein" },
  { value: "select",      label: "Auswahl" },
  { value: "multiselect", label: "Mehrfachauswahl" },
];

function autoKey(label: string): string {
  const cleaned = label.replace(/[^a-zA-Z0-9 ]+/g, "").trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "";
  const first = parts[0].toLowerCase();
  const rest = parts.slice(1).map((p) => (p[0] ?? "").toUpperCase() + p.slice(1).toLowerCase());
  return [first, ...rest].join("").replace(/^[^a-z]/, "f");
}

interface Props {
  value: AttributeSchemaItem[];
  onChange: (next: AttributeSchemaItem[]) => void;
}

export function AttributeSchemaEditor({ value, onChange }: Props) {
  const [optionsEditingIndex, setOptionsEditingIndex] = useState<number | null>(null);

  function updateItem(i: number, patch: Partial<AttributeSchemaItem>) {
    onChange(value.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  }
  function removeItem(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    const a = next[i]!;
    const b = next[j]!;
    next[i] = b;
    next[j] = a;
    onChange(next.map((it, idx) => ({ ...it, sortOrder: (idx + 1) * 10 })));
  }
  function addItem() {
    const nextOrder = ((value.at(-1)?.sortOrder ?? 0) + 10) || 10;
    onChange([...value, { key: "", label: "", type: "text", sortOrder: nextOrder }]);
  }

  return (
    <div className="space-y-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-muted-foreground">
            <th>Label</th><th>Key</th><th>Typ</th><th>Pflicht</th><th>Optionen</th><th></th>
          </tr>
        </thead>
        <tbody>
          {value.map((it, i) => (
            <tr key={i} className="border-b">
              <td>
                <Input
                  value={it.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    const nextKey = !it.key ? autoKey(label) : it.key;
                    updateItem(i, { label, key: nextKey });
                  }}
                />
              </td>
              <td>
                <Input
                  value={it.key}
                  onChange={(e) => updateItem(i, { key: e.target.value })}
                  className="font-mono"
                />
              </td>
              <td>
                <select
                  value={it.type}
                  onChange={(e) => updateItem(i, { type: e.target.value as AttributeType })}
                  className="w-full rounded border px-2 py-1"
                >
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </td>
              <td className="text-center">
                <input
                  type="checkbox"
                  checked={!!it.required}
                  onChange={(e) => updateItem(i, { required: e.target.checked })}
                />
              </td>
              <td>
                {(it.type === "select" || it.type === "multiselect") && (
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => setOptionsEditingIndex(optionsEditingIndex === i ? null : i)}>
                    Optionen ({(it.options ?? []).length})
                  </Button>
                )}
              </td>
              <td className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => move(i, -1)}>↑</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => move(i, +1)}>↓</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(i)}>✕</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {optionsEditingIndex !== null && value[optionsEditingIndex] && (
        <OptionsEditor
          options={value[optionsEditingIndex]?.options ?? []}
          onChange={(opts) => updateItem(optionsEditingIndex, { options: opts })}
          onClose={() => setOptionsEditingIndex(null)}
        />
      )}

      <Button type="button" variant="outline" onClick={addItem}>＋ Feld hinzufügen</Button>
    </div>
  );
}

function OptionsEditor({ options, onChange, onClose }: {
  options: AttributeOption[];
  onChange: (next: AttributeOption[]) => void;
  onClose: () => void;
}) {
  return (
    <div className="rounded border p-3 bg-muted/30 space-y-2">
      <div className="flex items-center justify-between">
        <Label>Optionen</Label>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Schließen</Button>
      </div>
      {options.map((o, i) => (
        <div key={i} className="flex gap-2">
          <Input value={o.value} placeholder="Key (z.B. red)"
            onChange={(e) => onChange(options.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))}
            className="font-mono w-1/3" />
          <Input value={o.label} placeholder="Anzeige (z.B. Rot)"
            onChange={(e) => onChange(options.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} />
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(options.filter((_, idx) => idx !== i))}>✕</Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm"
        onClick={() => onChange([...options, { value: "", label: "" }])}>＋ Option</Button>
    </div>
  );
}

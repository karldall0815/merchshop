"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AttributeSchemaItem } from "@/modules/categories/defaults";

interface Props {
  schema: AttributeSchemaItem[];
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}

export function CustomFieldsPanel({ schema, values, onChange }: Props) {
  if (schema.length === 0) return null;
  const sorted = [...schema].sort((a, b) => a.sortOrder - b.sortOrder);

  function setVal(key: string, v: unknown) {
    onChange({ ...values, [key]: v });
  }

  return (
    <div className="space-y-3 rounded border p-3">
      {sorted.map((item) => (
        <div key={item.key} className="grid sm:grid-cols-[200px_1fr] items-start gap-2">
          <Label htmlFor={`attr-${item.key}`}>{item.label}{item.required ? " *" : ""}</Label>
          {renderField(item, values[item.key], (v) => setVal(item.key, v))}
        </div>
      ))}
    </div>
  );
}

function renderField(item: AttributeSchemaItem, value: unknown, onChange: (v: unknown) => void) {
  const id = `attr-${item.key}`;
  switch (item.type) {
    case "text":
      return <Input id={id} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} maxLength={item.maxLength ?? 200} />;
    case "longtext":
      return <textarea id={id} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} maxLength={item.maxLength ?? 4000} className="w-full rounded border px-2 py-1" rows={3} />;
    case "url":
      return <Input id={id} type="url" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="https://…" />;
    case "number":
      return <Input id={id} type="number" value={value == null ? "" : String(value)}
        min={item.min} max={item.max} step={item.step ?? 1}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} />;
    case "date":
      return <Input id={id} type="date" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "boolean":
      return <input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />;
    case "select":
      return (
        <select id={id} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value || undefined)} className="w-full rounded border px-2 py-1">
          <option value="">—</option>
          {(item.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case "multiselect": {
      const arr = (value as string[]) ?? [];
      return (
        <div className="flex flex-wrap gap-3">
          {(item.options ?? []).map((o) => (
            <label key={o.value} className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={arr.includes(o.value)}
                onChange={(e) => onChange(e.target.checked ? [...arr, o.value] : arr.filter((x) => x !== o.value))} />
              {o.label}
            </label>
          ))}
        </div>
      );
    }
  }
}

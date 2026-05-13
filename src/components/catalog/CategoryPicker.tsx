"use client";

import { Label } from "@/components/ui/label";

interface CategoryLite { id: string; name: string; active: boolean; isBuiltin: boolean; }

interface Props {
  categories: CategoryLite[];
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}

export function CategoryPicker({ categories, value, onChange, disabled }: Props) {
  const currentIsArchived = value ? !categories.find((c) => c.id === value)?.active : false;
  const visible = categories.filter((c) => c.active || c.id === value);

  return (
    <div className="space-y-1">
      <Label htmlFor="cat">Kategorie</Label>
      <select
        id="cat"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className="w-full rounded border px-2 py-1"
      >
        <option value="">(keine — Frei lassen)</option>
        {visible.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}{c.id === value && currentIsArchived ? " (archiviert)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

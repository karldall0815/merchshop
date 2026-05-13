"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VariantTemplate } from "@/modules/categories/defaults";

interface Props {
  value: VariantTemplate | null;
  onChange: (next: VariantTemplate | null) => void;
}

export function VariantTemplateEditor({ value, onChange }: Props) {
  if (!value) {
    return (
      <Button type="button" variant="outline"
        onClick={() => onChange({ axisName: "", defaults: [] })}>
        ＋ Varianten-Vorlage hinzufügen
      </Button>
    );
  }
  return (
    <div className="rounded border p-3 space-y-3">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label htmlFor="vt-axis">Achsen-Name</Label>
          <Input id="vt-axis" value={value.axisName}
            onChange={(e) => onChange({ ...value, axisName: e.target.value })}
            placeholder="z.B. Größe, Farbe, Kapazität" />
        </div>
        <Button type="button" variant="ghost" onClick={() => onChange(null)}>Entfernen</Button>
      </div>
      <div>
        <Label>Default-Labels</Label>
        <div className="space-y-1 mt-1">
          {value.defaults.map((d, i) => (
            <div key={i} className="flex gap-2">
              <Input value={d}
                onChange={(e) => onChange({
                  ...value, defaults: value.defaults.map((x, idx) => idx === i ? e.target.value : x),
                })} />
              <Button type="button" variant="ghost" size="sm"
                onClick={() => onChange({ ...value, defaults: value.defaults.filter((_, idx) => idx !== i) })}>✕</Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm"
            onClick={() => onChange({ ...value, defaults: [...value.defaults, ""] })}>＋ Label</Button>
        </div>
      </div>
    </div>
  );
}

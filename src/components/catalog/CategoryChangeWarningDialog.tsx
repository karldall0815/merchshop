"use client";

import { Button } from "@/components/ui/button";

interface Props {
  losingFields: { label: string; valueDisplay: string }[];
  onCancel: () => void;
  onConfirm: () => void;
}

export function CategoryChangeWarningDialog({ losingFields, onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="rounded-lg bg-background p-6 max-w-lg w-full space-y-4">
        <h2 className="text-lg font-semibold">Kategorie-Wechsel</h2>
        <p className="text-sm">Folgende Werte gehen beim Wechsel verloren:</p>
        <ul className="text-sm max-h-60 overflow-y-auto border rounded p-2 space-y-1">
          {losingFields.map((f, i) => (
            <li key={i}><strong>{f.label}:</strong> {f.valueDisplay}</li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Abbrechen</Button>
          <Button onClick={onConfirm}>Trotzdem wechseln</Button>
        </div>
      </div>
    </div>
  );
}

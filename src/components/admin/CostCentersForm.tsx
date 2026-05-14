"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormErrorBanner } from "@/components/forms/FormErrorBanner";
import { updateCostCenters } from "@/modules/admin/general-settings";
import type { ActionResult } from "@/lib/action-result";

interface Props {
  initial: string[];
}

export function CostCentersForm({ initial }: Props) {
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<string[]>(() => [...initial]);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function addDraft() {
    const v = draft.trim();
    if (!v) return;
    const exists = items.some((i) => i.toLowerCase() === v.toLowerCase());
    if (exists) {
      setResult({
        ok: false,
        code: "VALIDATION_ERROR",
        message: `Kostenstelle "${v}" gibt es schon.`,
      });
      return;
    }
    setItems((prev) => [...prev, v]);
    setDraft("");
    setSavedAt(null);
    setResult(null);
  }

  function removeAt(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setSavedAt(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await updateCostCenters({ items });
      if (!res.ok) {
        setResult(res);
        return;
      }
      setSavedAt(new Date());
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <label htmlFor="cc-new" className="text-sm font-medium">
            Neue Kostenstelle
          </label>
          <Input
            id="cc-new"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDraft();
              }
            }}
            placeholder="z. B. KST-4711 oder Marketing-DACH"
            maxLength={120}
          />
        </div>
        <Button type="button" variant="ghost" onClick={addDraft} disabled={!draft.trim()}>
          Hinzufügen
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Noch keine Kostenstellen hinterlegt.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {items.map((item, idx) => (
            <li key={`${item}-${idx}`} className="flex items-center justify-between px-3 py-2">
              <span className="font-mono text-sm">{item}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeAt(idx)}
                aria-label={`${item} entfernen`}
              >
                Entfernen
              </Button>
            </li>
          ))}
        </ul>
      )}

      <FormErrorBanner result={result} />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Speichere…" : "Speichern"}
        </Button>
        {savedAt && (
          <span className="text-sm text-muted-foreground">
            ✓ Gespeichert um {savedAt.toLocaleTimeString("de-DE")}
          </span>
        )}
      </div>
    </form>
  );
}

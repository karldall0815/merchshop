"use client";

import { useState, useTransition } from "react";
import { submitDefaults } from "@/modules/setup/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DefaultsStep() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [policy, setPolicy] = useState<"always" | "by-quantity" | "by-value">("always");

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await submitDefaults({
          costCenters: String(formData.get("costCenters") ?? "")
            .split(",").map((s) => s.trim()).filter(Boolean),
          defaultMinStock: Number(formData.get("minStock") ?? 0),
          approvalPolicy: policy,
          approvalThreshold: policy === "always" ? undefined : Number(formData.get("threshold") ?? 0),
        });
      } catch (e) {
        if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
        setError(e instanceof Error ? e.message : "unbekannter Fehler");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">Workflow-Defaults</h2>
      <div className="space-y-2">
        <Label htmlFor="costCenters">Kostenstellen (komma-separiert)</Label>
        <Input id="costCenters" name="costCenters" placeholder="Messe-2026, Onboarding, ..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="minStock">Default-Mindestbestand für neue Artikel</Label>
        <Input id="minStock" name="minStock" type="number" min={0} defaultValue={0} />
      </div>
      <div className="space-y-2">
        <Label>Genehmigung erforderlich</Label>
        <div className="flex gap-3 text-sm">
          {(["always", "by-quantity", "by-value"] as const).map((p) => (
            <label key={p} className="flex items-center gap-1">
              <input type="radio" name="policy" checked={policy === p} onChange={() => setPolicy(p)} />
              {p === "always" ? "immer" : p === "by-quantity" ? "ab Stückzahl" : "ab Warenwert"}
            </label>
          ))}
        </div>
        {policy !== "always" && (
          <Input name="threshold" type="number" min={0} placeholder="Schwelle" />
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Speichern…" : "Weiter"}</Button>
    </form>
  );
}

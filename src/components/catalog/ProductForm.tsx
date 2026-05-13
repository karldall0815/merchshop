"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProduct, updateProduct, archiveProduct } from "@/modules/catalog/actions";
import { VariantEditor, type VariantRow } from "./VariantEditor";
import type { ProductUpdateInput } from "@/modules/catalog/schemas";

interface ProductFormProps {
  mode: "create" | "edit";
  initial?: ProductUpdateInput | null;
  actorId: string;
}

export function ProductForm({ mode, initial, actorId }: ProductFormProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>(
    initial?.variants ?? []
  );

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createProduct(
            {
              sku: String(formData.get("sku") ?? ""),
              name: String(formData.get("name") ?? ""),
              description: String(formData.get("description") ?? "") || undefined,
              minStock: Number(formData.get("minStock") ?? 0),
              variants,
              initialStock: Number(formData.get("initialStock") ?? 0),
            },
            actorId
          );
        } else {
          if (!initial?.id) return;
          await updateProduct(
            {
              id: initial.id,
              sku: String(formData.get("sku") ?? ""),
              name: String(formData.get("name") ?? ""),
              description: String(formData.get("description") ?? "") || undefined,
              minStock: Number(formData.get("minStock") ?? 0),
              active: formData.get("active") === "on",
              variants,
            },
            actorId
          );
        }
      } catch (e) {
        // next/navigation redirect throws — re-throw so the router handles it
        if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
        setError(e instanceof Error ? e.message : "Unbekannter Fehler");
      }
    });
  }

  function onArchive() {
    if (!initial?.id) return;
    if (!confirm("Artikel wirklich archivieren? Er wird aus dem Katalog entfernt.")) return;
    startTransition(async () => {
      try {
        await archiveProduct(initial.id!, actorId);
      } catch (e) {
        if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
        setError(e instanceof Error ? e.message : "Unbekannter Fehler");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU *</Label>
          <Input
            id="sku"
            name="sku"
            required
            placeholder="DEMO-001"
            defaultValue={initial?.sku}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="Demo-Tasse"
            defaultValue={initial?.name}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Optionale Beschreibung des Artikels"
          defaultValue={initial?.description}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="minStock">Mindestbestand</Label>
        <Input
          id="minStock"
          name="minStock"
          type="number"
          min={0}
          defaultValue={initial?.minStock ?? 0}
          className="w-40"
        />
      </div>

      {mode === "create" && (
        <div className="space-y-2">
          <Label htmlFor="initialStock">Anfangsbestand</Label>
          <Input
            id="initialStock"
            name="initialStock"
            type="number"
            min={0}
            defaultValue={0}
            className="w-40"
          />
        </div>
      )}

      {mode === "edit" && (
        <div className="flex items-center gap-2">
          <input
            id="active"
            name="active"
            type="checkbox"
            defaultChecked={initial?.active ?? true}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="active">Aktiv</Label>
        </div>
      )}

      <VariantEditor value={variants} onChange={setVariants} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending
            ? mode === "create"
              ? "Erstelle…"
              : "Speichere…"
            : mode === "create"
            ? "Artikel erstellen"
            : "Änderungen speichern"}
        </Button>
        {mode === "edit" && (
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={onArchive}
          >
            Archivieren
          </Button>
        )}
      </div>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AttributeSchemaEditor } from "./AttributeSchemaEditor";
import { VariantTemplateEditor } from "./VariantTemplateEditor";
import { CategoryUpdateConfirmDialog } from "./CategoryUpdateConfirmDialog";
import { createCategory, updateCategory, archiveCategory, deleteCategory } from "@/modules/categories/actions";
import type { AttributeSchemaItem, VariantTemplate } from "@/modules/categories/defaults";
import { useRouter } from "next/navigation";

interface Initial {
  id?: string; slug: string; name: string; description?: string;
  attributeSchema: AttributeSchemaItem[]; variantTemplate: VariantTemplate | null;
  isBuiltin?: boolean; active?: boolean;
}

export function CategoryForm({ mode, initial, actorId }: {
  mode: "create" | "edit"; initial?: Initial; actorId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [schema, setSchema] = useState<AttributeSchemaItem[]>(initial?.attributeSchema ?? []);
  const [variantTemplate, setVariantTemplate] = useState<VariantTemplate | null>(initial?.variantTemplate ?? null);
  const [confirmDialog, setConfirmDialog] = useState<null | { removedKeys: string[]; affectedProducts: { id: string; sku: string; name: string }[] }>(null);

  async function submit(confirm: boolean) {
    setError(null);
    try {
      if (mode === "create") {
        const res = await createCategory({
          slug, name, description: description || undefined,
          sortOrder: 0, attributeSchema: schema, variantTemplate,
        }, actorId);
        if (!res.ok) {
          setError(res.message);
          return;
        }
        router.push("/admin/categories");
      } else if (initial?.id) {
        const res = await updateCategory({
          id: initial.id, slug, name, description: description || undefined,
          sortOrder: 0, attributeSchema: schema, variantTemplate,
          active: initial.active ?? true,
          confirmAffectedProducts: confirm,
        }, actorId);
        if (res.status === "needs_confirmation") {
          setConfirmDialog({ removedKeys: res.removedKeys, affectedProducts: res.affectedProducts });
        } else {
          router.push("/admin/categories");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); startTransition(() => { submit(false); }); }}
          className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="slug">Slug *</Label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)}
            disabled={mode === "edit" && initial?.isBuiltin}
            placeholder="z.B. werbeartikel" required pattern="[a-z0-9][a-z0-9-]*" />
        </div>
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
      </div>

      <div>
        <Label htmlFor="desc">Beschreibung</Label>
        <textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded border px-2 py-1" rows={2} />
      </div>

      <div>
        <Label>Felder</Label>
        <AttributeSchemaEditor value={schema} onChange={setSchema} />
      </div>

      <div>
        <Label>Varianten-Vorlage (optional)</Label>
        <VariantTemplateEditor value={variantTemplate} onChange={setVariantTemplate} />
      </div>

      {error && <div className="rounded bg-destructive/10 text-destructive p-2">{error}</div>}

      <div className="flex justify-between">
        <div>
          {mode === "edit" && initial?.id && !initial.isBuiltin && (
            <Button type="button" variant="destructive"
              onClick={() => { if (confirm("Kategorie wirklich löschen?")) startTransition(async () => {
                try {
                  const res = await deleteCategory(initial.id!, false, actorId);
                  if (res.status === "needs_confirmation") {
                    if (confirm(`${res.affectedProducts.length} Artikel verlieren die Zuordnung. Trotzdem löschen?`)) {
                      await deleteCategory(initial.id!, true, actorId);
                      router.push("/admin/categories");
                    }
                  } else {
                    router.push("/admin/categories");
                  }
                } catch (e) { setError(e instanceof Error ? e.message : "Fehler"); }
              }); }}>Löschen</Button>
          )}
          {mode === "edit" && initial?.id && initial.active !== false && (
            <Button type="button" variant="outline" className="ml-2"
              onClick={() => startTransition(async () => {
                try { await archiveCategory(initial.id!, actorId); router.push("/admin/categories"); }
                catch (e) { setError(e instanceof Error ? e.message : "Fehler"); }
              })}>Archivieren</Button>
          )}
        </div>
        <Button type="submit" disabled={pending}>Speichern</Button>
      </div>

      {confirmDialog && (
        <CategoryUpdateConfirmDialog
          removedKeys={confirmDialog.removedKeys}
          affectedProducts={confirmDialog.affectedProducts}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={() => { setConfirmDialog(null); startTransition(() => { submit(true); }); }}
        />
      )}
    </form>
  );
}

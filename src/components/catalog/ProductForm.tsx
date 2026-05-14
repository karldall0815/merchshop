"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProduct, updateProduct, archiveProduct } from "@/modules/catalog/actions";
import { VariantEditor, type VariantRow } from "./VariantEditor";
import { CategoryPicker } from "./CategoryPicker";
import { CustomFieldsPanel } from "./CustomFieldsPanel";
import { CategoryChangeWarningDialog } from "./CategoryChangeWarningDialog";
import type { ProductUpdateInput } from "@/modules/catalog/schemas";
import type { AttributeSchemaItem, VariantTemplate } from "@/modules/categories/defaults";

interface CategoryOption {
  id: string;
  name: string;
  active: boolean;
  isBuiltin: boolean;
  attributeSchema: AttributeSchemaItem[];
  variantTemplate: VariantTemplate | null;
}

interface ProductFormProps {
  mode: "create" | "edit";
  initial?: ProductUpdateInput | null;
  actorId: string;
  categories: CategoryOption[];
  initialCategoryId?: string | null;
  initialAttributes?: Record<string, unknown>;
  /** Pre-filled SKU suggestion for create mode (admin-configured prefix + auto-counter). */
  suggestedSku?: string;
}

function isAttrSet(v: unknown): boolean {
  if (v === undefined || v === null || v === "") return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

function formatValueForDisplay(item: AttributeSchemaItem, value: unknown): string {
  if (!isAttrSet(value)) return "—";
  if (item.type === "boolean") return value ? "ja" : "nein";
  if (item.type === "select") {
    const opt = (item.options ?? []).find((o) => o.value === value);
    return opt?.label ?? String(value);
  }
  if (item.type === "multiselect" && Array.isArray(value)) {
    return value
      .map((v) => (item.options ?? []).find((o) => o.value === v)?.label ?? String(v))
      .join(", ");
  }
  return String(value);
}

export function ProductForm({
  mode,
  initial,
  actorId,
  categories,
  initialCategoryId,
  initialAttributes,
  suggestedSku,
}: ProductFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>(
    initial?.variants ?? []
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    initialCategoryId ?? null
  );
  const [attributes, setAttributes] = useState<Record<string, unknown>>(
    initialAttributes ?? {}
  );
  const [pendingCategoryChange, setPendingCategoryChange] = useState<
    | {
        nextId: string | null;
        losingFields: { label: string; valueDisplay: string }[];
      }
    | null
  >(null);

  const currentCategory = categoryId
    ? categories.find((c) => c.id === categoryId) ?? null
    : null;
  const currentSchema: AttributeSchemaItem[] = currentCategory?.attributeSchema ?? [];

  function applyCategoryChange(nextId: string | null) {
    setCategoryId(nextId);
    setAttributes({});
    // Only prefill variants if current list is empty, to avoid overwriting user edits.
    if (variants.length === 0 && nextId) {
      const nextCat = categories.find((c) => c.id === nextId);
      const tpl = nextCat?.variantTemplate;
      if (tpl && tpl.defaults.length > 0) {
        setVariants(tpl.defaults.map((label) => ({ label, minStock: 0 })));
      }
    }
  }

  function handleCategoryChange(nextId: string | null) {
    if (nextId === categoryId) return;
    // Check if we have any meaningful attribute values currently set
    const hasSetValues =
      currentSchema.length > 0 &&
      Object.entries(attributes).some(([, v]) => isAttrSet(v));
    if (hasSetValues) {
      const losingFields = currentSchema
        .filter((item) => isAttrSet(attributes[item.key]))
        .map((item) => ({
          label: item.label,
          valueDisplay: formatValueForDisplay(item, attributes[item.key]),
        }));
      setPendingCategoryChange({ nextId, losingFields });
    } else {
      applyCategoryChange(nextId);
    }
  }

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "create") {
          const res = await createProduct(
            {
              sku: String(formData.get("sku") ?? ""),
              name: String(formData.get("name") ?? ""),
              description: String(formData.get("description") ?? "") || undefined,
              minStock: Number(formData.get("minStock") ?? 0),
              variants,
              initialStock: Number(formData.get("initialStock") ?? 0),
              categoryId: categoryId ?? null,
              attributes,
            },
            actorId
          );
          if (!res.ok) {
            setError(res.message);
            return;
          }
          router.push("/catalog");
        } else {
          if (!initial?.id) return;
          const res = await updateProduct(
            {
              id: initial.id,
              sku: String(formData.get("sku") ?? ""),
              name: String(formData.get("name") ?? ""),
              description: String(formData.get("description") ?? "") || undefined,
              minStock: Number(formData.get("minStock") ?? 0),
              active: formData.get("active") === "on",
              variants,
              categoryId: categoryId ?? null,
              attributes,
              confirmCategoryChange: true,
            },
            actorId
          );
          if (!res.ok) {
            setError(res.message);
            return;
          }
          router.push("/catalog");
        }
      } catch (e) {
        // ActionResult no longer throws for domain errors; this catch only handles unexpected runtime errors.
        setError(e instanceof Error ? e.message : "Unbekannter Fehler");
      }
    });
  }

  function onArchive() {
    if (!initial?.id) return;
    if (!confirm("Artikel wirklich archivieren? Er wird aus dem Katalog entfernt.")) return;
    startTransition(async () => {
      try {
        const res = await archiveProduct(initial.id!, actorId);
        if (!res.ok) {
          setError(res.message);
          return;
        }
        router.push("/catalog");
      } catch (e) {
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
            defaultValue={initial?.sku ?? suggestedSku ?? ""}
          />
          {mode === "create" && suggestedSku && (
            <p className="text-xs text-muted-foreground">
              Vorschlag aus den Grundeinstellungen — kann überschrieben werden.
            </p>
          )}
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

      <CategoryPicker
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          active: c.active,
          isBuiltin: c.isBuiltin,
        }))}
        value={categoryId}
        onChange={handleCategoryChange}
        disabled={pending}
      />

      <CustomFieldsPanel
        schema={currentSchema}
        values={attributes}
        onChange={setAttributes}
      />

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

      {pendingCategoryChange && (
        <CategoryChangeWarningDialog
          losingFields={pendingCategoryChange.losingFields}
          onCancel={() => setPendingCategoryChange(null)}
          onConfirm={() => {
            applyCategoryChange(pendingCategoryChange.nextId);
            setPendingCategoryChange(null);
          }}
        />
      )}
    </form>
  );
}

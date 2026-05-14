import { getCurrentUser } from "@/modules/auth/session";
import { ProductForm } from "@/components/catalog/ProductForm";
import { listCategories } from "@/modules/categories/queries";
import { getNextSuggestedSku } from "@/modules/catalog/sku-suggest";
import type { AttributeSchemaItem, VariantTemplate } from "@/modules/categories/defaults";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const user = await getCurrentUser();
  const rawCats = await listCategories({ activeOnly: false });
  const categories = rawCats.map((c) => ({
    id: c.id,
    name: c.name,
    active: c.active,
    isBuiltin: c.isBuiltin,
    attributeSchema:
      ((c.attributeSchema as unknown) as AttributeSchemaItem[]) ?? [],
    variantTemplate:
      ((c.variantTemplate as unknown) as VariantTemplate | null) ?? null,
  }));
  const suggestedSku = await getNextSuggestedSku();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Neuer Artikel</h1>
      <ProductForm
        mode="create"
        actorId={user?.id ?? ""}
        categories={categories}
        suggestedSku={suggestedSku}
      />
    </div>
  );
}

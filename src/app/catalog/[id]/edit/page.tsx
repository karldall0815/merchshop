import { notFound } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { getProductDetail } from "@/modules/catalog/queries";
import { ProductForm } from "@/components/catalog/ProductForm";
import { listCategories } from "@/modules/categories/queries";
import type { AttributeSchemaItem, VariantTemplate } from "@/modules/categories/defaults";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductDetail(id);
  if (!product) notFound();
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
  const initial = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description ?? undefined,
    minStock: product.minStock,
    active: product.active,
    variants: product.variants.map((v) => ({ label: v.label, minStock: v.minStock })),
  };
  const initialAttributes =
    (product.attributes as Record<string, unknown> | null) ?? {};
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{product.name}</h1>
      <ProductForm
        mode="edit"
        initial={initial}
        actorId={user?.id ?? ""}
        categories={categories}
        initialCategoryId={product.categoryId ?? null}
        initialAttributes={initialAttributes}
      />
    </div>
  );
}

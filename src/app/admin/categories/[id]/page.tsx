import { notFound } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { getCategoryWithUsage } from "@/modules/categories/queries";
import { CategoryForm } from "@/components/admin/CategoryForm";
import type { AttributeSchemaItem, VariantTemplate } from "@/modules/categories/defaults";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const cat = await getCategoryWithUsage(id);
  if (!cat) notFound();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{cat.name}</h1>
      <p className="text-sm text-muted-foreground">
        {cat.productCount} Artikel zugeordnet · {cat.isBuiltin ? "Builtin" : "Custom"} · {cat.active ? "aktiv" : "archiviert"}
      </p>
      <CategoryForm
        mode="edit"
        initial={{
          id: cat.id, slug: cat.slug, name: cat.name, description: cat.description ?? undefined,
          attributeSchema: ((cat.attributeSchema as unknown) as AttributeSchemaItem[]) ?? [],
          variantTemplate: ((cat.variantTemplate as unknown) as VariantTemplate | null) ?? null,
          isBuiltin: cat.isBuiltin, active: cat.active,
        }}
        actorId={user?.id ?? ""}
      />
    </div>
  );
}

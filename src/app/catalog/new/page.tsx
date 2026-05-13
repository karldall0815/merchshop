import { getCurrentUser } from "@/modules/auth/session";
import { ProductForm } from "@/components/catalog/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const user = await getCurrentUser();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Neuer Artikel</h1>
      <ProductForm mode="create" actorId={user?.id ?? ""} />
    </div>
  );
}

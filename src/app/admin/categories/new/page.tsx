import { getCurrentUser } from "@/modules/auth/session";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  const user = await getCurrentUser();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Neue Kategorie</h1>
      <CategoryForm mode="create" actorId={user?.id ?? ""} />
    </div>
  );
}

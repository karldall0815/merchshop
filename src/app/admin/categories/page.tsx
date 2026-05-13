import Link from "next/link";
import { listCategories } from "@/modules/categories/queries";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const cats = await listCategories({ activeOnly: false });
  const counts = await db.product.groupBy({
    by: ["categoryId"],
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.categoryId ?? "", c._count._all]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kategorien</h1>
        <Link href="/admin/categories/new">
          <Button>＋ Neue Kategorie</Button>
        </Link>
      </div>

      <table className="w-full text-sm">
        <thead className="border-b">
          <tr className="text-left">
            <th className="py-2">Name</th>
            <th className="py-2">Slug</th>
            <th className="py-2">Felder</th>
            <th className="py-2">Artikel</th>
            <th className="py-2">Typ</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {cats.map((c) => (
            <tr key={c.id} className="border-b hover:bg-muted/30">
              <td className="py-2">
                <Link className="underline" href={`/admin/categories/${c.id}`}>{c.name}</Link>
              </td>
              <td className="py-2 font-mono text-xs">{c.slug}</td>
              <td className="py-2">{((c.attributeSchema as unknown[]) ?? []).length}</td>
              <td className="py-2">{countMap.get(c.id) ?? 0}</td>
              <td className="py-2">{c.isBuiltin ? "Builtin" : "Custom"}</td>
              <td className="py-2">{c.active ? "aktiv" : "archiviert"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

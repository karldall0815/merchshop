import Link from "next/link";
import { listProductsWithStock } from "@/modules/catalog/queries";
import { ProductTable } from "@/components/catalog/ProductTable";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const products = await listProductsWithStock();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Artikel</h1>
        <Link
          href="/catalog/new"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          + Neuer Artikel
        </Link>
      </div>
      <ProductTable products={products} />
    </div>
  );
}

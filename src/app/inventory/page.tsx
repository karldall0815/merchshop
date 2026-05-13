import Link from "next/link";
import Image from "next/image";
import { listProductsWithStock } from "@/modules/catalog/queries";
import { StockBadge } from "@/components/inventory/StockBadge";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const products = await listProductsWithStock();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Bestand</h1>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Bild</th>
              <th className="px-4 py-3 text-left font-medium">SKU</th>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-right font-medium">Aktueller Bestand</th>
              <th className="px-4 py-3 text-right font-medium">Mindestbestand</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map(p => {
              const thumb = p.images[0]?.url;
              return (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt={p.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-right">{p.current}</td>
                  <td className="px-4 py-3 text-right">{p.minStock}</td>
                  <td className="px-4 py-3">
                    <StockBadge current={p.current} minStock={p.minStock} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/inventory/${p.id}`}
                      className="text-primary hover:underline"
                    >
                      Verlauf →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Keine Artikel vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Link from "next/link";

type ProductImage = { url: string };
type Product = {
  id: string;
  sku: string;
  name: string;
  minStock: number;
  current: number;
  images: ProductImage[];
};

interface ProductTableProps {
  products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Noch keine Artikel angelegt.{" "}
        <Link href="/catalog/new" className="underline hover:text-foreground">
          Ersten Artikel anlegen
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="p-3 text-left font-medium">Bild</th>
            <th className="p-3 text-left font-medium">SKU</th>
            <th className="p-3 text-left font-medium">Name</th>
            <th className="p-3 text-right font-medium">Bestand</th>
            <th className="p-3 text-right font-medium">Mindestbestand</th>
            <th className="p-3 text-left font-medium">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {products.map((product) => {
            const belowMin = product.current < product.minStock;
            return (
              <tr key={product.id} className="hover:bg-muted/30">
                <td className="p-3">
                  {product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-3 font-mono text-xs">{product.sku}</td>
                <td className="p-3 font-medium">{product.name}</td>
                <td className="p-3 text-right">
                  <span className="inline-flex items-center gap-1.5">
                    {belowMin && (
                      <span
                        className="inline-block h-2 w-2 rounded-full bg-red-500"
                        title="Unter Mindestbestand"
                      />
                    )}
                    {product.current}
                  </span>
                </td>
                <td className="p-3 text-right">{product.minStock}</td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/catalog/${product.id}/edit`}
                      className="text-sm underline hover:no-underline"
                    >
                      Bearbeiten
                    </Link>
                    <Link
                      href={`/catalog/${product.id}/images`}
                      className="text-sm underline hover:no-underline"
                    >
                      Bilder
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

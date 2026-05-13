import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductDetail } from "@/modules/catalog/queries";
import { removeProductImage } from "@/modules/catalog/images";
import { ImageUploader } from "@/components/catalog/ImageUploader";

export const dynamic = "force-dynamic";

export default async function ProductImagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductDetail(id);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bilder · {product.name}</h1>
        <Link
          href={`/catalog/${product.id}/edit`}
          className="text-sm underline text-muted-foreground"
        >
          ← zurück zum Artikel
        </Link>
      </header>

      <ImageUploader productId={product.id} />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Aktuelle Bilder ({product.images.length})</h2>
        {product.images.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Bilder vorhanden.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {product.images.map((img) => (
              <li key={img.id} className="rounded-md border p-2 space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={product.name}
                  className="aspect-square w-full rounded object-cover"
                />
                <form
                  action={async () => {
                    "use server";
                    await removeProductImage(img.id);
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs text-red-600 underline"
                  >
                    Entfernen
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

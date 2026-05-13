import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopProduct } from "@/modules/catalog/queries";
import { AddToCartForm } from "@/components/shop/AddToCartForm";
import { ProductGallery } from "@/components/shop/ProductGallery";

export const dynamic = "force-dynamic";

export default async function ShopProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getShopProduct(id);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <Link href="/shop" className="text-sm underline">
        ← zurück zum Shop
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <ProductGallery images={product.images} alt={product.name} />

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <p className="text-sm text-muted-foreground">{product.sku}</p>
          </div>
          {product.description && (
            <p className="whitespace-pre-line text-sm">{product.description}</p>
          )}
          <AddToCartForm productId={product.id} variants={product.variants} />
        </div>
      </div>
    </div>
  );
}

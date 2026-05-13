import Link from "next/link";
import Image from "next/image";
import { getCart } from "@/modules/orders/cart";
import { CartLineControls } from "@/components/cart/CartLineControls";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const cart = await getCart();
  const items = cart?.items ?? [];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Warenkorb</h1>
        <Link href="/shop" className="text-sm underline">
          ← weiter einkaufen
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Dein Warenkorb ist leer.{" "}
          <Link href="/shop" className="underline">
            Zum Shop
          </Link>
          .
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 rounded-lg border bg-card p-4">
                <div className="h-16 w-16 flex-none overflow-hidden rounded bg-muted">
                  {item.snapshotImageUrl ? (
                    <Image
                      src={item.snapshotImageUrl}
                      alt={item.snapshotName}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.snapshotName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.product.sku}
                    {item.snapshotVariant ? ` · ${item.snapshotVariant}` : ""}
                    {!item.product.active ? " · Artikel nicht mehr verfügbar" : ""}
                  </p>
                </div>
                <CartLineControls itemId={item.id} quantity={item.quantity} />
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/checkout"
              className="inline-flex items-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Zur Kasse
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

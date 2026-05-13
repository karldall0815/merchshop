import Link from "next/link";
import { redirect } from "next/navigation";
import { getCart } from "@/modules/orders/cart";
import { listAddressFavorites } from "@/modules/orders/addresses";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const cart = await getCart();
  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }
  const favorites = await listAddressFavorites();
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <Link href="/cart" className="text-sm underline">
          ← zurück zum Warenkorb
        </Link>
      </header>
      <section className="rounded-lg border bg-card p-4 space-y-2">
        <h2 className="font-medium">Bestellübersicht</h2>
        <ul className="text-sm">
          {cart.items.map((it) => (
            <li key={it.id} className="flex justify-between border-b py-1 last:border-0">
              <span>
                {it.snapshotName}
                {it.snapshotVariant ? ` · ${it.snapshotVariant}` : ""}
              </span>
              <span>{it.quantity}×</span>
            </li>
          ))}
        </ul>
      </section>
      <CheckoutForm favorites={favorites} />
    </div>
  );
}

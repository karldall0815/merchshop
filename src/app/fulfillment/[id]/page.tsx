import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getOrderDetail } from "@/modules/orders/queries";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { FulfillmentControls } from "@/components/fulfillment/FulfillmentControls";

export const dynamic = "force-dynamic";

export default async function FulfillmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderDetail(id);
  if (!order) notFound();

  const addr = order.shippingAddress as
    | { recipient: string; street: string; zip: string; city: string; country: string }
    | null;

  return (
    <div className="space-y-6">
      <Link href="/fulfillment" className="text-sm underline">
        ← zurück zum Board
      </Link>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{order.orderNumber ?? "(ohne Nummer)"}</h1>
          <p className="text-sm text-muted-foreground">
            Besteller: <span className="font-medium">{order.requester.name}</span> ·{" "}
            {order.occasion ?? "—"} · KS {order.costCenter ?? "—"} · Wunschtermin{" "}
            {order.desiredDate
              ? new Date(order.desiredDate).toLocaleDateString("de-DE")
              : "—"}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 font-medium">Artikel</h2>
        <ul className="space-y-2">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 border-b pb-2 last:border-0">
              <div className="h-12 w-12 flex-none overflow-hidden rounded bg-muted">
                {it.snapshotImageUrl && (
                  <Image
                    src={it.snapshotImageUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{it.snapshotName}</p>
                {it.snapshotVariant && (
                  <p className="text-xs text-muted-foreground">Variante: {it.snapshotVariant}</p>
                )}
              </div>
              <span className="text-sm">{it.quantity}×</span>
            </li>
          ))}
        </ul>
      </section>

      {addr && (
        <section className="space-y-1 rounded-lg border bg-card p-4 text-sm">
          <h2 className="font-medium">Lieferadresse</h2>
          <p>{addr.recipient}</p>
          <p>{addr.street}</p>
          <p>
            {addr.zip} {addr.city}
            {addr.country && addr.country !== "DE" ? `, ${addr.country}` : ""}
          </p>
        </section>
      )}

      {order.trackingNumber && (
        <section className="rounded-lg border bg-card p-4 text-sm">
          <h2 className="font-medium">Versand</h2>
          <p>
            {order.carrier ?? "Carrier?"} ·{" "}
            <span className="font-mono">{order.trackingNumber}</span>
          </p>
          {order.shippedAt && (
            <p className="text-muted-foreground">
              versendet am {new Date(order.shippedAt).toLocaleString("de-DE")}
            </p>
          )}
          {order.deliveredAt && (
            <p className="text-muted-foreground">
              zugestellt am {new Date(order.deliveredAt).toLocaleString("de-DE")}
            </p>
          )}
        </section>
      )}

      <FulfillmentControls orderId={order.id} status={order.status} />
    </div>
  );
}

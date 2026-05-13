import Link from "next/link";
import { listFulfillmentColumns } from "@/modules/orders/queries";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import type { OrderForStatus } from "@/components/orders/order-status-meta";

export const dynamic = "force-dynamic";

type CardRow = OrderForStatus & {
  id: string;
  orderNumber: string | null;
  occasion: string | null;
  desiredDate: Date | null;
  shippedAt: Date | null;
  trackingNumber: string | null;
  requester: { name: string };
  _count: { items: number };
};

function Card({ o }: { o: CardRow }) {
  return (
    <Link
      href={`/fulfillment/${o.id}`}
      className="block rounded-md border bg-card p-3 hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{o.orderNumber ?? "(ohne Nummer)"}</p>
      </div>
      <div className="mt-1">
        <OrderStatusBadge order={o} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {o.requester.name} · {o._count.items} Artikel
      </p>
      {o.occasion && <p className="mt-1 truncate text-xs">{o.occasion}</p>}
      {o.desiredDate && (
        <p className="mt-1 text-xs text-muted-foreground">
          Wunschtermin {new Date(o.desiredDate).toLocaleDateString("de-DE")}
        </p>
      )}
      {o.trackingNumber && (
        <p className="mt-1 text-xs">
          Tracking: <span className="font-mono">{o.trackingNumber}</span>
        </p>
      )}
    </Link>
  );
}

function Column({ title, items, hint }: { title: string; items: CardRow[]; hint: string }) {
  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <header>
        <h2 className="font-semibold">
          {title} <span className="text-muted-foreground">({items.length})</span>
        </h2>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </header>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="rounded border border-dashed p-3 text-center text-xs text-muted-foreground">
            leer
          </p>
        ) : (
          items.map((o) => <Card key={o.id} o={o} />)
        )}
      </div>
    </div>
  );
}

export default async function FulfillmentPage() {
  const cols = await listFulfillmentColumns();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Fulfillment</h1>
        <p className="text-sm text-muted-foreground">
          Bestellungen vorbereiten und versenden.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <Column
          title="Freigegeben"
          items={cols.approved}
          hint="Bereit zur Bearbeitung"
        />
        <Column
          title="In Bearbeitung"
          items={cols.processing}
          hint="Label drucken / verpacken"
        />
        <Column
          title="Versendet"
          items={cols.shipped}
          hint="Wartet auf Zustellung"
        />
      </div>
    </div>
  );
}

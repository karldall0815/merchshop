import Link from "next/link";
import { listPendingApprovals } from "@/modules/orders/queries";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const orders = await listPendingApprovals();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Offene Freigaben</h1>
        <p className="text-sm text-muted-foreground">
          Bestellungen warten auf deine Entscheidung.
        </p>
      </header>
      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Keine offenen Bestellungen.
        </div>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/approvals/${o.id}`}
                className="flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-muted/40"
              >
                <div>
                  <p className="font-medium">{o.orderNumber ?? "(ohne Nummer)"}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.requester.name} · {o.occasion ?? "—"} · {o._count.items} Artikel ·{" "}
                    {new Date(o.createdAt).toLocaleString("de-DE")}
                  </p>
                </div>
                <OrderStatusBadge order={o} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

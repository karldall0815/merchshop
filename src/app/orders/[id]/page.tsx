import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { getOrderDetail } from "@/modules/orders/queries";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const order = await getOrderDetail(id);
  if (!order) notFound();
  // Requesters only see their own orders. Other roles (admin/agentur/approver)
  // see everything via /approvals or /fulfillment respectively.
  const canSee =
    order.requesterId === user.id ||
    user.role === "admin" ||
    user.role === "agentur" ||
    user.role === "approver";
  if (!canSee) notFound();

  const addr = order.shippingAddress as
    | {
        recipient: string;
        contact?: string;
        street: string;
        zip: string;
        city: string;
        country: string;
      }
    | null;

  return (
    <div className="space-y-6">
      <Link href="/orders" className="text-sm underline">
        ← zurück zur Liste
      </Link>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{order.orderNumber ?? "(ohne Nummer)"}</h1>
          <p className="text-sm text-muted-foreground">
            {order.occasion ?? "—"} · {order.costCenter ?? "—"}
          </p>
          {order.desiredDate && (order.desiredDateIsDeadline ? (
            <div className="text-sm">
              <span className="font-semibold text-red-700">📅 Deadline:</span>{" "}
              {new Date(order.desiredDate).toLocaleDateString("de-DE")}
            </div>
          ) : (
            <div className="text-sm">
              <span className="text-muted-foreground">Wunsch:</span>{" "}
              {new Date(order.desiredDate).toLocaleDateString("de-DE")}
            </div>
          ))}
        </div>
        <StatusBadge status={order.status} />
      </header>

      <OrderTimeline order={order} />

      <section className="space-y-2 rounded-lg border bg-card p-4">
        <h2 className="font-medium">Artikel</h2>
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
          {addr.recipient && <p className="font-medium">{addr.recipient}</p>}
          {addr.contact && (
            <p className="text-sm text-muted-foreground">{addr.contact}</p>
          )}
          <p>{addr.street}</p>
          <p>
            {addr.zip} {addr.city}
            {addr.country && addr.country !== "DE" ? `, ${addr.country}` : ""}
          </p>
        </section>
      )}

      {order.approvals.length > 0 && (
        <section className="space-y-2 rounded-lg border bg-card p-4 text-sm">
          <h2 className="font-medium">Verlauf</h2>
          <ul>
            {order.approvals.map((a) => (
              <li key={a.id} className="border-b py-2 last:border-0">
                <span className="font-medium">{a.user.name}</span> ({a.user.role}) ·{" "}
                {a.action} · {new Date(a.createdAt).toLocaleString("de-DE")}
                {a.comment && <p className="text-muted-foreground">{a.comment}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {order.status === "rejected" && order.rejectionReason && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-100">
          <h2 className="font-medium">Ablehnungsgrund</h2>
          <p>{order.rejectionReason}</p>
        </section>
      )}
    </div>
  );
}

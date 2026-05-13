"use client";

import { useState, useTransition } from "react";
import type { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { markDeliveredManual, markShipped, startProcessing } from "@/modules/orders/fulfillment";

export function FulfillmentControls({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("DHL");

  function run(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
        setError(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  if (status === "approved") {
    return (
      <section className="space-y-3 rounded-lg border bg-card p-4">
        <h2 className="font-medium">Bearbeitung starten</h2>
        <p className="text-sm text-muted-foreground">
          Setzt den Status auf „In Bearbeitung&ldquo;. Bestand wird hier noch nicht abgebucht.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={() => run(() => startProcessing(orderId))} disabled={pending}>
          {pending ? "Speichere…" : "Bearbeitung starten"}
        </Button>
      </section>
    );
  }

  if (status === "processing") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => markShipped(orderId, { trackingNumber: tracking, carrier }));
        }}
        className="space-y-3 rounded-lg border bg-card p-4"
      >
        <h2 className="font-medium">Als versendet markieren</h2>
        <p className="text-sm text-muted-foreground">
          Bucht den Bestand definitiv ab und benachrichtigt den Besteller.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="carrier">Carrier *</Label>
            <Input
              id="carrier"
              required
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="DHL"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tracking">Tracking-Nr. *</Label>
            <Input
              id="tracking"
              required
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="z. B. 00340434000000000000"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Versende…" : "Als versendet markieren"}
        </Button>
      </form>
    );
  }

  if (status === "shipped") {
    return (
      <section className="space-y-3 rounded-lg border bg-card p-4">
        <h2 className="font-medium">Zustellung markieren</h2>
        <p className="text-sm text-muted-foreground">
          Wird normalerweise per Tracking-Webhook automatisch gesetzt. Für manuellen Override:
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button variant="outline" onClick={() => run(() => markDeliveredManual(orderId))} disabled={pending}>
          {pending ? "Speichere…" : "Manuell als zugestellt markieren"}
        </Button>
      </section>
    );
  }

  return null;
}

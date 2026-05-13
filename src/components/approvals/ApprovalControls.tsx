"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { approveOrder, rejectOrder } from "@/modules/orders/approvals";

export function ApprovalControls({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [approveComment, setApproveComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [mode, setMode] = useState<"none" | "approve" | "reject">("none");

  function onApprove(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await approveOrder(orderId, approveComment.trim() || undefined);
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        setError(err instanceof Error ? err.message : "Freigabe fehlgeschlagen");
      }
    });
  }

  function onReject(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!rejectReason.trim()) {
      setError("Bitte Begründung angeben");
      return;
    }
    startTransition(async () => {
      try {
        await rejectOrder(orderId, rejectReason.trim());
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        setError(err instanceof Error ? err.message : "Ablehnung fehlgeschlagen");
      }
    });
  }

  return (
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <h2 className="font-medium">Entscheidung</h2>
      {mode === "none" && (
        <div className="flex gap-2">
          <Button type="button" onClick={() => setMode("approve")} disabled={pending}>
            Freigeben
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setMode("reject")}
            disabled={pending}
          >
            Ablehnen
          </Button>
        </div>
      )}

      {mode === "approve" && (
        <form onSubmit={onApprove} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="approve-comment">Kommentar (optional)</Label>
            <Input
              id="approve-comment"
              value={approveComment}
              onChange={(e) => setApproveComment(e.target.value)}
              placeholder="z. B. „mit Eilversand"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Speichere…" : "Bestätigen"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode("none")} disabled={pending}>
              Abbrechen
            </Button>
          </div>
        </form>
      )}

      {mode === "reject" && (
        <form onSubmit={onReject} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Begründung *</Label>
            <Input
              id="reject-reason"
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="z. B. „Budget Q2 überschritten"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Speichere…" : "Endgültig ablehnen"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode("none")} disabled={pending}>
              Abbrechen
            </Button>
          </div>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}

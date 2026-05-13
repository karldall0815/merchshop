"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormErrorBanner } from "@/components/forms/FormErrorBanner";
import { createSupportReport } from "@/modules/support/actions";
import type { ActionResult } from "@/lib/action-result";

interface Props {
  preset?: { digest?: string; fromError?: boolean };
}

export function SupportReportForm({ preset }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [context, setContext] = useState("");
  const [description, setDescription] = useState("");
  const [errorState, setErrorState] = useState<ActionResult<unknown> | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorState(null);
    startTransition(async () => {
      const url = typeof window !== "undefined" ? window.location.pathname : undefined;
      const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : undefined;
      const res = await createSupportReport({
        context: context || undefined,
        description,
        url,
        userAgent,
        fromAutoReportDigest: preset?.digest || undefined,
      });
      if (!res.ok) {
        setErrorState(res);
        return;
      }
      const id = res.data?.reportId ?? "";
      router.push(`/support/report/sent?id=${encodeURIComponent(id)}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border p-4">
      {preset?.fromError && (
        <div className="rounded bg-muted px-3 py-2 text-sm">
          Diese Meldung wird mit dem aufgetretenen Fehler verknüpft
          {preset.digest ? ` (ID: ${preset.digest})` : ""}.
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="context">Was hast du gerade gemacht? <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <textarea
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={2}
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="z.B. Ich wollte eine Bestellung mit 3 T-Shirts abschicken"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Was ist passiert / was hast du erwartet? *</Label>
        <textarea
          id="description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="z.B. Statt der Bestätigung kam eine Fehlerseite"
        />
      </div>
      <FormErrorBanner result={errorState} />
      <Button type="submit" disabled={pending}>{pending ? "Sende…" : "Fehler melden"}</Button>
    </form>
  );
}

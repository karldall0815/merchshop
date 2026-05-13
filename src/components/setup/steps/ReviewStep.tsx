"use client";

import { useTransition, useState } from "react";
import { completeSetup } from "@/modules/setup/actions";
import { Button } from "@/components/ui/button";

export function ReviewStep() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onComplete() {
    setError(null);
    startTransition(async () => {
      try {
        // completeSetup() server-redirects to /login on success; we only
        // ever reach the catch on a real error.
        await completeSetup();
      } catch (e) {
        // next/navigation.redirect() throws a NEXT_REDIRECT sentinel that the
        // framework intercepts — let it propagate, only surface real errors.
        if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
        setError(e instanceof Error ? e.message : "unbekannter Fehler");
      }
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Abschluss</h2>
      <p>Alle Pflichtschritte sind ausgefüllt. Klicke auf &bdquo;Installation abschließen&ldquo;, um die Konfiguration zu finalisieren und zum Login zu wechseln.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={onComplete} disabled={pending}>{pending ? "Schließe ab…" : "Installation abschließen"}</Button>
    </div>
  );
}

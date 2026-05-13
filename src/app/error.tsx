"use client";

import { useEffect } from "react";
import { reportErrorToSupport } from "@/modules/support/auto-report";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportErrorToSupport({
      url: typeof window !== "undefined" ? window.location.pathname : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      digest: error.digest,
      message: error.message,
      stack: error.stack,
    }).catch(() => {
      /* never block the boundary on report failure */
    });
  }, [error.digest, error.message, error.stack]);

  return (
    <div className="max-w-xl mx-auto py-12 text-center space-y-4">
      <div className="text-5xl" aria-hidden>
        ⚠️
      </div>
      <h1 className="text-xl font-semibold">Ups, das hat nicht geklappt</h1>
      <p className="text-muted-foreground">
        Beim Laden dieser Seite ist ein Fehler aufgetreten.{" "}
        <strong>Ein Bericht wurde automatisch an den Admin gesendet.</strong>
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">
          Fehler-ID:{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded">{error.digest}</code>
        </p>
      )}
      <div className="flex gap-2 justify-center pt-2">
        <Button onClick={reset}>Erneut versuchen</Button>
        <a
          href={`/support/report?digest=${encodeURIComponent(error.digest ?? "")}&from=error`}
          className={buttonVariants({ variant: "outline" })}
        >
          Eigene Beschreibung ergänzen
        </a>
      </div>
    </div>
  );
}

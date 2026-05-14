"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof fetch !== "undefined") {
      fetch("/api/support/auto-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: window.location.pathname,
          userAgent: navigator.userAgent,
          digest: error.digest,
          message: error.message,
          stack: error.stack,
        }),
      }).catch(() => {});
    }
  }, [error]);

  return (
    <html lang="de">
      <body
        style={{ fontFamily: "system-ui", padding: "2rem", textAlign: "center" }}
      >
        <div style={{ fontSize: "3rem" }} aria-hidden>
          ⚠️
        </div>
        <h1
          style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0.5rem 0" }}
        >
          Ups, das hat nicht geklappt
        </h1>
        <p style={{ color: "#6b7280" }}>
          Die Seite konnte nicht geladen werden.
          {error.digest ? ` Fehler-ID: ${error.digest}` : ""}
        </p>
        <p>
          {/* global-error renders its own <html>/<body> after a render-time
              crash; next/link is not guaranteed to work in that reduced
              context, so a plain anchor with a full navigation is correct. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" style={{ color: "#4f46e5" }}>
            Zur Startseite
          </a>
          {" · "}
          <a
            href={`/support/report?digest=${encodeURIComponent(error.digest ?? "")}&from=error`}
            style={{ color: "#4f46e5" }}
          >
            Fehler melden
          </a>
        </p>
      </body>
    </html>
  );
}

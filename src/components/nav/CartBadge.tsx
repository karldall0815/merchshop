"use client";

import { useEffect, useState } from "react";

// The badge is hydrated client-side so /shop and other pages don't have
// to wait on a DB roundtrip per render. It pings /api/auth/session first
// to avoid a 401 ping on logged-out screens.
export function CartBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/cart/count", { credentials: "include" });
        if (!r.ok) return;
        const j = (await r.json()) as { count?: number };
        if (!cancelled && typeof j.count === "number") setCount(j.count);
      } catch {
        // ignore — badge is decorative
      }
    }
    load();
    // Refresh on focus so badge picks up adds done in another tab.
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (!count) return null;
  return (
    <span className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
      {count}
    </span>
  );
}
